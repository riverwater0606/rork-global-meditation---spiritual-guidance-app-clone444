import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type User,
} from "firebase/auth";

export type FirebaseRuntime = {
  app: FirebaseApp;
  db: Database;
  auth: Auth;
  user: User | null;
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
let authInitPromise: Promise<void> | null = null;

async function ensureAnonymousAuth(auth: Auth): Promise<void> {
  if (auth.currentUser) return;

  if (!authInitPromise) {
    authInitPromise = new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log("[Firebase][Auth] existing user:", { uid: user.uid, isAnonymous: user.isAnonymous });
          unsub();
          resolve();
          return;
        }

        try {
          console.log("[Firebase][Auth] signing in anonymously...");
          const cred = await signInAnonymously(auth);
          console.log("[Firebase][Auth] anonymous sign-in success:", {
            uid: cred.user.uid,
            isAnonymous: cred.user.isAnonymous,
          });
        } catch (e: any) {
          console.error("[Firebase][Auth] anonymous sign-in failed:", e);
          console.error("[Firebase][Auth] Error message:", e?.message);
          console.error("[Firebase][Auth] Error code:", e?.code);
        } finally {
          unsub();
          resolve();
        }
      });
    });
  }

  await authInitPromise;
}

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

  const auth = getAuth(app);
  void ensureAnonymousAuth(auth);

  cached = { app, db, auth, user: auth.currentUser };
  return cached;
}
