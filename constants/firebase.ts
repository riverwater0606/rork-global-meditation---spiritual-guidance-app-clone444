import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

export type FirebaseRuntime = {
  app: FirebaseApp;
  db: Database;
};

function requireEnv(name: string, value: string | undefined): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  console.error(`[Firebase] Missing env: ${name}`);
  throw new Error(`Missing Firebase env: ${name}`);
}

const firebaseConfig = {
  apiKey: requireEnv("EXPO_PUBLIC_FIREBASE_API_KEY", process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: requireEnv(
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  ),
  databaseURL: requireEnv(
    "EXPO_PUBLIC_FIREBASE_DATABASE_URL",
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL
  ),
  projectId: requireEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID", process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: requireEnv(
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  ),
  messagingSenderId: requireEnv(
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: requireEnv("EXPO_PUBLIC_FIREBASE_APP_ID", process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
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
