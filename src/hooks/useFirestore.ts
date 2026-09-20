import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../errorHandlers';
import { onAuthStateChanged } from 'firebase/auth';

export function useFirestoreCollection<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, path));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
          setData(items);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
        });
      } else {
        setData([]);
        setLoading(false);
        if (unsubscribe) unsubscribe();
      }
    });

    return () => {
      authUnsub();
      if (unsubscribe) unsubscribe();
    };
  }, [path]);

  const add = async (id: string, item: any) => {
    try {
      await setDoc(doc(db, path, id), item);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  };

  const update = async (id: string, item: any) => {
    try {
      await updateDoc(doc(db, path, id), item);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${path}/${id}`);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDoc(doc(db, path, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${path}/${id}`);
    }
  };

  return { data, loading, add, update, remove };
}
