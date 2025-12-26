import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

export type FirebaseRuntime = {
  app: FirebaseApp;
  db: Database;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let cached: FirebaseRuntime | null = null;

export function getFirebase(): FirebaseRuntime {
  if (cached) return cached;

  const apps = getApps();
  const app = apps.length > 0 ? apps[0]! : initializeApp(firebaseConfig);
  const db = getDatabase(app);

  cached = { app, db };
  return cached;
}
