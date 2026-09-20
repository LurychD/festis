import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  authError: string | null;
  debugLogs: string[];
  loginWithGoogle: () => Promise<void>;
  loginAsDirect: (email?: string, name?: string) => void;
  logout: () => Promise<void>;
}

const getInitialUser = (): User | null => {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cached = localStorage.getItem('cached_firebase_user');
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  const savedEmail = localStorage.getItem('userEmail');
  if (savedEmail) {
    const savedName = localStorage.getItem('userName') || 'Axel Ibarra';
    return {
      uid: savedEmail,
      email: savedEmail,
      displayName: savedName,
      photoURL: null,
    } as unknown as User;
  }
  return null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  loading: false,
  authError: null,
  debugLogs: [],
  loginWithGoogle: async () => {},
  loginAsDirect: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('google_access_token'));
  const [loading, setLoading] = useState<boolean>(() => {
    // Si ya tenemos un usuario en caché, no demoramos el montaje de la interfaz
    const initial = getInitialUser();
    return !initial;
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const addLog = (msg: string) => {
    console.log(`[AUTH DEBUG]: ${msg}`);
    setDebugLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${msg}`]);
  };

  useEffect(() => {
    let isMounted = true;
    addLog(`AuthProvider mounted. Origin: ${window.location.origin}`);
    
    const isIframe = window !== window.parent || window !== window.top;
    addLog(`Is inside iframe: ${isIframe}`);
    
    addLog('Attaching onAuthStateChanged listener...');
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      addLog(`onAuthStateChanged fired! User: ${currentUser?.email || 'none'}`);
      if (isMounted) {
        if (currentUser) {
          setUser(currentUser);
          try {
            localStorage.setItem('cached_firebase_user', JSON.stringify({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
            }));
            if (currentUser.email) localStorage.setItem('userEmail', currentUser.email);
            if (currentUser.displayName) localStorage.setItem('userName', currentUser.displayName);
          } catch (e) {}
        } else {
          // Solo limpiamos si no hay un usuario local activo
          const localEmail = localStorage.getItem('userEmail');
          if (!localEmail) {
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('cached_firebase_user');
          }
        }
        setLoading(false);
      }
    }, (error) => {
      addLog(`onAuthStateChanged error: ${error.message}`);
      console.error('Error in onAuthStateChanged:', error);
      if (isMounted) {
        setAuthError(error.message);
        setLoading(false);
      }
    });

    // Timeout de seguridad optimizado: máx 2.5s para no congelar la app en redes móviles
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
        addLog("Timeout de 2.5s alcanzado. Interfaz liberada de forma inmediata.");
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const loginAsDirect = (email = 'axeldibarra@gmail.com', name = 'Axel Ibarra') => {
    addLog(`Activating direct session: ${email}`);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    const mockUser = {
      uid: email,
      email: email,
      displayName: name,
      photoURL: null,
    } as unknown as User;
    setUser(mockUser);
    try {
      localStorage.setItem('cached_firebase_user', JSON.stringify({
        uid: email,
        email: email,
        displayName: name,
        photoURL: null,
      }));
    } catch (e) {}
    setLoading(false);
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    addLog('User clicked loginWithGoogle...');
    try {
      addLog('Setting persistence to local explicitly...');
      await setPersistence(auth, browserLocalPersistence);
      
      addLog('Using signInWithPopup (default resolver)...');
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      
      if (token) {
        setAccessToken(token);
        localStorage.setItem('google_access_token', token);
        addLog('Saved Google access token.');
      }
    } catch (error: any) {
      addLog(`Login try catch error: ${error.message} (code: ${error.code})`);
      console.error('Error logging in with Google:', error);
      
      if (error.code === 'auth/popup-blocked' || error.message?.includes('popup-blocked')) {
        addLog('Popup blocked by browser.');
        setAuthError('El inicio de sesión fue bloqueado. Por favor, habilita las ventanas emergentes (popups) para este sitio.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        addLog('Popup closed by user or automatically by browser constraints.');
        setAuthError('La ventana de inicio de sesión se cerró inésperadamente. Si estás en una vista previa, intenta abrir la app en una nueva pestaña (↗️) o autoriza cookies de terceros.');
      } else {
        setAuthError(error.message || 'Error desconocido al iniciar sesión');
      }
    }
  };

  const logout = async () => {
    try {
      addLog('Logging out...');
      await signOut(auth);
      setAccessToken(null);
      localStorage.removeItem('google_access_token');
    } catch (error: any) {
      addLog(`Logout error: ${error.message}`);
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, authError, debugLogs, loginWithGoogle, loginAsDirect, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
