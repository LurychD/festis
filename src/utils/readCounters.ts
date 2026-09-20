export const trackFirestoreReads = (count: number) => {
  if (count <= 0) return;
  const current = parseInt(localStorage.getItem('__firestoreReads') || '0', 10);
  const newCount = current + count;
  localStorage.setItem('__firestoreReads', newCount.toString());
  window.dispatchEvent(new CustomEvent('firestoreReadSync', { detail: { total: newCount, delta: count } }));
};

export const getFirestoreReads = () => {
  return parseInt(localStorage.getItem('__firestoreReads') || '0', 10);
};

export const resetFirestoreReads = () => {
  localStorage.setItem('__firestoreReads', '0');
  window.dispatchEvent(new CustomEvent('firestoreReadSync', { detail: { total: 0, delta: 0 } }));
};

export const trackFirestoreWrites = (count: number) => {
  if (count <= 0) return;
  const current = parseInt(localStorage.getItem('__firestoreWrites') || '0', 10);
  const newCount = current + count;
  localStorage.setItem('__firestoreWrites', newCount.toString());
  window.dispatchEvent(new CustomEvent('firestoreWriteSync', { detail: { total: newCount, delta: count } }));
};

export const getFirestoreWrites = () => {
  return parseInt(localStorage.getItem('__firestoreWrites') || '0', 10);
};

export const resetFirestoreWrites = () => {
  localStorage.setItem('__firestoreWrites', '0');
  window.dispatchEvent(new CustomEvent('firestoreWriteSync', { detail: { total: 0, delta: 0 } }));
};

export const trackFirestoreDeletes = (count: number) => {
  if (count <= 0) return;
  const current = parseInt(localStorage.getItem('__firestoreDeletes') || '0', 10);
  const newCount = current + count;
  localStorage.setItem('__firestoreDeletes', newCount.toString());
  window.dispatchEvent(new CustomEvent('firestoreDeleteSync', { detail: { total: newCount, delta: count } }));
};

export const getFirestoreDeletes = () => {
  return parseInt(localStorage.getItem('__firestoreDeletes') || '0', 10);
};

export const resetFirestoreDeletes = () => {
  localStorage.setItem('__firestoreDeletes', '0');
  window.dispatchEvent(new CustomEvent('firestoreDeleteSync', { detail: { total: 0, delta: 0 } }));
};
