import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from './firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  isIframe: boolean;
  authError: string | null;
  debugLogs: string[];
  loginWithGoogle: () => Promise<void>;
  openInNewTab: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  loading: true,
  isIframe: false,
  authError: null,
  debugLogs: [],
  loginWithGoogle: async () => {},
  openInNewTab: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('google_access_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const isIframe = typeof window !== 'undefined' && (window !== window.parent || window !== window.top);

  const addLog = (msg: string) => {
    console.log(`[AUTH DEBUG]: ${msg}`);
    setDebugLogs((prev) => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${msg}`]);
  };

  useEffect(() => {
    let isMounted = true;
    addLog(`AuthProvider montado. Es iFrame: ${isIframe}`);

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (!isMounted) return;
        addLog(`onAuthStateChanged: ${currentUser?.email || 'desautenticado'}`);

        if (currentUser) {
          setUser(currentUser);
          if (currentUser.email) localStorage.setItem('userEmail', currentUser.email);
          if (currentUser.displayName) localStorage.setItem('userName', currentUser.displayName);
        } else {
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
        }
        setLoading(false);
      },
      (error) => {
        if (!isMounted) return;
        addLog(`Error en onAuthStateChanged: ${error.message}`);
        setAuthError(error.message);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isIframe]);

  const openInNewTab = () => {
    addLog('Abriendo aplicación en pestaña independiente para autenticación nativa...');
    window.open(window.location.href, '_blank');
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    addLog('Iniciando autenticación formal con Google...');
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;

      if (token) {
        setAccessToken(token);
        localStorage.setItem('google_access_token', token);
      }

      if (result.user) {
        setUser(result.user);
        if (result.user.email) localStorage.setItem('userEmail', result.user.email);
        if (result.user.displayName) localStorage.setItem('userName', result.user.displayName);
        addLog(`Autenticación exitosa como: ${result.user.email} (UID: ${result.user.uid})`);
      }
    } catch (error: any) {
      addLog(`Error de autenticación Google: ${error.message} (código: ${error.code})`);
      console.error('Error al iniciar sesión con Google:', error);

      if (error.code === 'auth/popup-blocked' || error.message?.includes('popup-blocked')) {
        setAuthError(
          'La ventana emergente fue bloqueada por el navegador. Usa el botón "Abrir en nueva pestaña" para iniciar sesión.'
        );
      } else if (error.code === 'auth/popup-closed-by-user') {
        setAuthError(
          'La ventana de inicio de sesión se cerró antes de completar la verificación. Si estás dentro del iFrame, abrí la app en una pestaña independiente.'
        );
      } else {
        setAuthError(error.message || 'Error al iniciar sesión con Google');
      }
    }
  };

  const logout = async () => {
    try {
      addLog('Cerrando sesión en Firebase Auth...');
      await signOut(auth);
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      addLog('Sesión cerrada con éxito.');
    } catch (error: any) {
      addLog(`Error al cerrar sesión: ${error.message}`);
      console.error('Error en logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        isIframe,
        authError,
        debugLogs,
        loginWithGoogle,
        openInNewTab,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
