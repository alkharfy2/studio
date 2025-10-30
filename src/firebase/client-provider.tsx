'use client';

import { FirebaseProvider, initializeFirebase } from ".";

const { app, firestore, auth } = initializeFirebase();

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseProvider app={app} firestore={firestore} auth={auth}>
      {children}
    </FirebaseProvider>
  );
}
