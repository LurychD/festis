import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../errorHandlers';
import { onAuthStateChanged } from 'firebase/auth';
import { trackFirestoreReads, trackFirestoreWrites } from '../utils/readCounters';

export function useFirestoreSyncDoc<T>(path: string, initialData: T, options?: { skipFetch?: boolean }) {
  const skipFetch = options?.skipFetch;
  const [isLocalMode, setIsLocalMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('__localMode') === 'true';
  });

  useEffect(() => {
    const handleSyncModeChange = () => {
      const activeLocal = typeof window !== 'undefined' && localStorage.getItem('__localMode') === 'true';
      setIsLocalMode(activeLocal);
    };

    window.addEventListener('festis:sync-mode-change', handleSyncModeChange);
    window.addEventListener('cardigan:sync-mode-change', handleSyncModeChange);
    window.addEventListener('storage', handleSyncModeChange);
    return () => {
      window.removeEventListener('festis:sync-mode-change', handleSyncModeChange);
      window.removeEventListener('cardigan:sync-mode-change', handleSyncModeChange);
      window.removeEventListener('storage', handleSyncModeChange);
    };
  }, []);

  const getInitialData = () => {
    if (typeof window !== 'undefined' && localStorage.getItem('__localMode') === 'true') {
      const stored = localStorage.getItem(`local_${path}`);
      if (stored) {
        try { return JSON.parse(stored); } catch(e){}
      }
    }
    return initialData;
  };
  const [data, setData] = useState<T>(getInitialData);
  const [loading, setLoading] = useState(true);
  const dbDataRef = useRef<T>(initialData);

  const initialDataStr = JSON.stringify(initialData);

  useEffect(() => {
    if (isLocalMode) {
      const stored = localStorage.getItem(`local_${path}`);
      if (stored) {
        try { setData(JSON.parse(stored)); } catch(e){}
      }
      setLoading(false);
      return;
    }

    if (skipFetch) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe: (() => void) | undefined;
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const docRef = doc(db, path);
        unsubscribe = onSnapshot(docRef, (snapshot) => {
          if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites && snapshot.exists()) {
            trackFirestoreReads(1);
          }
          if (snapshot.exists()) {
            const item = snapshot.data() as T;
            dbDataRef.current = item;
            setData(item);
          } else {
            setData(initialData);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          setLoading(false);
        });
      } else {
        setData(initialData);
        setLoading(false);
        if (unsubscribe) unsubscribe();
      }
    });

    return () => {
      authUnsub();
      if (unsubscribe) unsubscribe();
    };
  }, [path, initialDataStr, skipFetch, isLocalMode]);

  const updateData = async (newData: T | ((prev: T) => T)) => {
    let resolvedData: T;
    if (typeof newData === 'function') {
      resolvedData = (newData as any)(data);
    } else {
      resolvedData = newData;
    }
    
    setData(resolvedData);
    
    if (isLocalMode) {
      localStorage.setItem(`local_${path}`, JSON.stringify(resolvedData));
      return;
    }

    try {
      if (!auth.currentUser) return;
      const docRef = doc(db, path);
      await setDoc(docRef, resolvedData, { merge: true });
      trackFirestoreWrites(1);
      dbDataRef.current = resolvedData;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return [data, updateData, loading] as const;
}
