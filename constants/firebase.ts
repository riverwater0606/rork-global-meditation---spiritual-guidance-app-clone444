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

console.log("[Firebase] ENV check:", {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_DATABASE_URL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? "SET" : "MISSING",
});

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

console.log("[Firebase] Config loaded:", {
  apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.slice(0, 8) + "..." : "NONE",
  authDomain: firebaseConfig.authDomain,
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId,
});

let cached: FirebaseRuntime | null = null;

export function getFirebase(): FirebaseRuntime {
  if (cached) {
    console.log("[Firebase] getFirebase: returning cached instance");
    return cached;
  }

  console.log("[Firebase] getFirebase: initializing new instance...");
  const apps = getApps();
  console.log("[Firebase] Existing apps:", apps.length);
  
  const app = apps.length > 0 ? apps[0]! : initializeApp(firebaseConfig);
  console.log("[Firebase] App initialized:", app.name);
  
  const db = getDatabase(app);
  console.log("[Firebase] Database instance created, URL:", firebaseConfig.databaseURL);

  cached = { app, db };
  return cached;
}
