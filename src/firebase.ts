/**
 * Inicialización limpia del SDK de Firebase para Festis Multi-Tenant.
 * Conexión configurada desde firebase-applet-config.json.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

// Instancia única de la aplicación Firebase
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Autenticación de usuarios
export const auth: Auth = getAuth(app);

// Proveedor de acceso mediante Google OAuth
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Cloud Firestore apuntando explícitamente a la base festis-db-a
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || "festis-db-a");

// Cloud Storage apuntando explícitamente a festis-bucket-a
export const storage: FirebaseStorage = getStorage(app, firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : "gs://festis-bucket-a");

// Servicio de Firebase Cloud Messaging condicional según soporte de navegador
export const messagingPromise: Promise<Messaging | null> = isSupported().then((supported) => {
  if (supported) {
    return getMessaging(app);
  }
  return null;
}).catch(() => null);

