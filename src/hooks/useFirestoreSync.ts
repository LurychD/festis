import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, writeBatch, query, orderBy, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../errorHandlers';
import { onAuthStateChanged } from 'firebase/auth';
import { trackFirestoreReads, trackFirestoreWrites, trackFirestoreDeletes } from '../utils/readCounters';

function removeUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined) as any;
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = removeUndefined(obj[key]);
    }
  }
  return newObj;
}

export function useFirestoreSyncArray<T extends { id: string }>(
  path: string, 
  initialData: T[] = [],
  queryConfig?: { sortField?: string, sortDesc?: boolean, limitCount?: number },
  options?: { skipFetch?: boolean }
) {
  const skipFetch = options?.skipFetch;
  const [isLocalMode, setIsLocalMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('__localMode') === 'true';
  });

  useEffect(() => {
    const handleSyncModeChange = () => {
      const activeLocal = typeof window !== 'undefined' && localStorage.getItem('__localMode') === 'true';
      setIsLocalMode(activeLocal);
    };

    window.addEventListener('cardigan:sync-mode-change', handleSyncModeChange);
    window.addEventListener('storage', handleSyncModeChange);
    return () => {
      window.removeEventListener('cardigan:sync-mode-change', handleSyncModeChange);
      window.removeEventListener('storage', handleSyncModeChange);
    };
  }, []);

  const getInitialData = () => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('__localMode') === 'true') {
        const stored = localStorage.getItem(`local_${path}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              const uniqueMap = new Map<string, any>();
              parsed.forEach((item) => {
                if (item && item.id) uniqueMap.set(item.id, item);
              });
              return Array.from(uniqueMap.values());
            }
            return parsed;
          } catch (e) {}
        }
      } else {
        // En modo nube, purgar cualquier copia local previa de festivales para evitar confusiones
        if (path === 'festivals') {
          localStorage.removeItem('local_festivals');
        }
      }
    }
    return initialData;
  };

  const [data, setData] = useState<T[]>(getInitialData);
  const [loading, setLoading] = useState(true);
  const dbDataRef = useRef<Map<string, T>>(new Map());
  const isFirestoreReadyRef = useRef<boolean>(false);

  const qConfigStr = JSON.stringify(queryConfig);

  useEffect(() => {
    if (isLocalMode) {
      const stored = localStorage.getItem(`local_${path}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const uniqueMap = new Map<string, any>();
            parsed.forEach((item) => {
              if (item && item.id) uniqueMap.set(item.id, item);
            });
            setData(Array.from(uniqueMap.values()));
          }
        } catch (e) {}
      }
      setLoading(false);
      return;
    }

    if (skipFetch) {
      setLoading(false);
      return;
    }

    setLoading(true);
    dbDataRef.current = new Map();
    let unsubscribe: (() => void) | undefined;
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const queryConfigParsed = qConfigStr ? JSON.parse(qConfigStr) : undefined;
        let constraints: any[] = [];
        if (queryConfigParsed?.sortField) {
          constraints.push(orderBy(queryConfigParsed.sortField, queryConfigParsed.sortDesc ? 'desc' : 'asc'));
        }
        if (queryConfigParsed?.limitCount) {
          constraints.push(limit(queryConfigParsed.limitCount));
        }
        
        const q = constraints.length > 0 ? query(collection(db, path), ...constraints) : query(collection(db, path));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
            trackFirestoreReads(snapshot.docChanges().length);
          }
          const items: T[] = [];
          const newDbMap = new Map<string, T>();
          snapshot.forEach(doc => {
            const item = { id: doc.id, ...doc.data() } as T;
            if (!newDbMap.has(item.id)) {
              items.push(item);
              newDbMap.set(item.id, item);
            }
          });
          dbDataRef.current = newDbMap;
          isFirestoreReadyRef.current = true;
          setData(items);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          setLoading(false);
        });
      } else {
        isFirestoreReadyRef.current = false;
        setData(initialData);
        setLoading(false);
        if (unsubscribe) unsubscribe();
      }
    });

    return () => {
      isFirestoreReadyRef.current = false;
      authUnsub();
      if (unsubscribe) unsubscribe();
    };
  }, [path, skipFetch, qConfigStr, isLocalMode]);

  const updateData = async (newData: T[] | ((prev: T[]) => T[])) => {
    // We update local state immediately for fast UI response
    let resolvedData: T[];
    if (typeof newData === 'function') {
      resolvedData = (newData as any)(data);
    } else {
      resolvedData = newData;
    }
    
    // Deduplicate to ensure no duplicate keys are ever set
    const uniqueMap = new Map<string, T>();
    resolvedData.forEach((item) => {
      if (item && item.id) {
        uniqueMap.set(item.id, item);
      }
    });
    resolvedData = Array.from(uniqueMap.values());
    
    setData(resolvedData);
    
    if (isLocalMode) {
      localStorage.setItem(`local_${path}`, JSON.stringify(resolvedData));
      return;
    }

    // Guardia estricta de seguridad: Prohibido escribir a Firestore antes de que la sincronización inicial termine
    if (!isFirestoreReadyRef.current) {
      console.warn(`[useFirestoreSyncArray] Escritura bloqueada en '${path}': la base de datos aún no finalizó su lectura inicial.`);
      return;
    }

    const resolvedDbMap = new Map<string, T>();
    resolvedData.forEach(item => resolvedDbMap.set(item.id, item));

    // chunk into batches of 500
    const operations: { type: 'set' | 'update' | 'delete', ref: any, data?: any }[] = [];

    // Add / Update
    resolvedData.forEach(item => {
      const dbItem = dbDataRef.current.get(item.id);
      if (!dbItem) {
        // Add
        operations.push({ type: 'set', ref: doc(db, path, item.id), data: removeUndefined(item) });
      } else {
        // Check for diff
        if (JSON.stringify(item) !== JSON.stringify(dbItem)) {
          operations.push({ type: 'update', ref: doc(db, path, item.id), data: removeUndefined(item) });
        }
      }
    });

    // Remove
    dbDataRef.current.forEach((item, id) => {
      if (!resolvedDbMap.has(id)) {
        operations.push({ type: 'delete', ref: doc(db, path, id) });
      }
    });

    try {
      if (!auth.currentUser) return;
      if (operations.length > 0) {
        // Group into chunks of 450
        const chunkSize = 450;
        for (let i = 0; i < operations.length; i += chunkSize) {
          const chunk = operations.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach(op => {
             if (op.type === 'set') batch.set(op.ref, op.data);
             if (op.type === 'update') batch.update(op.ref, op.data);
             if (op.type === 'delete') batch.delete(op.ref);
          });
          await batch.commit();
          const deletesCount = chunk.filter(op => op.type === 'delete').length;
          const writesCount = chunk.length - deletesCount;
          if (writesCount > 0) trackFirestoreWrites(writesCount);
          if (deletesCount > 0) trackFirestoreDeletes(deletesCount);
        }
      }
      dbDataRef.current = resolvedDbMap;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return [data, updateData, loading] as const;
}
