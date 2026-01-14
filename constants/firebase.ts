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

type FirebaseEnvCheck = {
  ok: boolean;
  missing: string[];
};

function getEnvCheck(): FirebaseEnvCheck {
  const missing: string[] = [];

  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const databaseURL = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

  if (!(typeof apiKey === "string" && apiKey.trim().length > 0)) missing.push("EXPO_PUBLIC_FIREBASE_API_KEY");
  if (!(typeof authDomain === "string" && authDomain.trim().length > 0)) missing.push("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!(typeof databaseURL === "string" && databaseURL.trim().length > 0)) missing.push("EXPO_PUBLIC_FIREBASE_DATABASE_URL");
  if (!(typeof projectId === "string" && projectId.trim().length > 0)) missing.push("EXPO_PUBLIC_FIREBASE_PROJECT_ID");
  if (!(typeof storageBucket === "string" && storageBucket.trim().length > 0)) missing.push("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!(typeof messagingSenderId === "string" && messagingSenderId.trim().length > 0)) missing.push("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!(typeof appId === "string" && appId.trim().length > 0)) missing.push("EXPO_PUBLIC_FIREBASE_APP_ID");

  return { ok: missing.length === 0, missing };
}

const envCheck = getEnvCheck();

console.log("[Firebase] ENV check:", {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_DATABASE_URL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? "SET" : "MISSING",
});

if (!envCheck.ok) {
  console.error("[Firebase] Firebase env missing; Firebase features will be disabled:", envCheck.missing);
}

const firebaseConfig = envCheck.ok
  ? {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL!,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
    }
  : null;

if (firebaseConfig) {
  console.log("[Firebase] Config loaded:", {
    apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.slice(0, 8) + "..." : "NONE",
    authDomain: firebaseConfig.authDomain,
    databaseURL: firebaseConfig.databaseURL,
    projectId: firebaseConfig.projectId,
  });
}

export function isFirebaseEnabled(): boolean {
  return Boolean(firebaseConfig);
}

export function getFirebaseMissingEnv(): string[] {
  return envCheck.missing;
}

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

export function getFirebaseMaybe(): FirebaseRuntime | null {
  if (!firebaseConfig) {
    console.log("[Firebase] getFirebaseMaybe: Firebase disabled (missing env)");
    return null;
  }

  if (cached) {
    console.log("[Firebase] getFirebaseMaybe: returning cached instance");
    return cached;
  }

  console.log("[Firebase] getFirebaseMaybe: initializing new instance...");
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

export function getFirebase(): FirebaseRuntime {
  const fb = getFirebaseMaybe();
  if (!fb) {
    throw new Error(
      `Firebase is disabled (missing env: ${getFirebaseMissingEnv().join(", ")})`
    );
  }
  return fb;
}
