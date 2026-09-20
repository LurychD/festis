import { useState, useEffect } from 'react';

export function useLocalSyncArray<T extends { id: string }>(path: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(() => {
    const stored = localStorage.getItem(`local_sync_${path}`);
    let parsed: T[] = initialData;
    if (stored) {
      try {
        const temp = JSON.parse(stored);
        if (Array.isArray(temp)) {
          parsed = temp;
        }
      } catch (e) {
        console.error("Error parsing local sync array:", e);
      }
    }
    const uniqueMap = new Map<string, T>();
    parsed.forEach((item) => {
      if (item && item.id) uniqueMap.set(item.id, item);
    });
    return Array.from(uniqueMap.values());
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(`local_sync_${path}`, JSON.stringify(data));
  }, [data, path]);

  const updateData = async (newData: T[] | ((prev: T[]) => T[])) => {
    setData((prev) => {
      let resolved: T[];
      if (typeof newData === 'function') {
        resolved = (newData as any)(prev);
      } else {
        resolved = newData;
      }
      const uniqueMap = new Map<string, T>();
      resolved.forEach((item) => {
        if (item && item.id) uniqueMap.set(item.id, item);
      });
      return Array.from(uniqueMap.values());
    });
  };

  return [data, updateData, loading] as const;
}
