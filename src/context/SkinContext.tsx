import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../AuthProvider';

export interface SkinDefinition {
  id: string;
  name: string;
  badge?: string;
  previewColors: string[];
}

export const REGISTERED_SKINS: SkinDefinition[] = [
  {
    id: 'cardigan',
    name: 'Cardigan',
    badge: 'Oficial',
    previewColors: ['#fbcfe8', '#bae6fd', '#fef08a', '#e91e63'],
  },
  {
    id: 'cardigan-noche',
    name: 'Cardigan Noche',
    badge: 'WiP',
    previewColors: ['#0f172a', '#1e293b', '#e91e63', '#38bdf8'],
  },
  {
    id: 'cardigan-boceto',
    name: 'Cardigan Ilustración',
    badge: 'WiP',
    previewColors: ['#eaf2f8', '#d3e4f0', '#2d3e50', '#5b82a6'],
  },
];

interface SkinContextType {
  activeSkin: string;
  setActiveSkin: (skinId: string) => Promise<void>;
  skins: SkinDefinition[];
}

const SkinContext = createContext<SkinContextType>({
  activeSkin: 'cardigan',
  setActiveSkin: async () => {},
  skins: REGISTERED_SKINS,
});

export const useSkin = () => useContext(SkinContext);

export const SkinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeSkin, setActiveSkinState] = useState<string>(() => {
    return localStorage.getItem('festis_active_skin') || 'cardigan';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', activeSkin);
    document.body.setAttribute('data-skin', activeSkin);
    if (activeSkin === 'cardigan-noche') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('festis_active_skin', activeSkin);
  }, [activeSkin]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const loadUserSkin = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const userDocRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          if (data && data.activeSkin) {
            setActiveSkinState(data.activeSkin);
          }
        }
      } catch (err) {
        console.warn('Error cargando skin del usuario desde Firestore:', err);
      }
    };

    loadUserSkin();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const setActiveSkin = async (skinId: string) => {
    setActiveSkinState(skinId);
    localStorage.setItem('festis_active_skin', skinId);

    if (user) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            activeSkin: skinId,
            updatedAt: new Date().toISOString(),
            email: user.email || '',
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Error guardando skin en Firestore:', err);
      }
    }
  };

  return (
    <SkinContext.Provider value={{ activeSkin, setActiveSkin, skins: REGISTERED_SKINS }}>
      {children}
    </SkinContext.Provider>
  );
};
