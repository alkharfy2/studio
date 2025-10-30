import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FirebaseProvider, useFirebaseApp, useFirestore, useAuth, useUser } from './provider';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { FirebaseClientProvider } from './client-provider';

const firebaseConfig: FirebaseOptions = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');

function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useCollection,
  useDoc,
  useUser,
  useFirebaseApp,
  useFirestore,
  useAuth,
};
