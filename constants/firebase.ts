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
  values: {
    apiKey?: string;
    authDomain?: string;
    databaseURL?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
};

type FirebaseEnvName =
  | "EXPO_PUBLIC_FIREBASE_API_KEY"
  | "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
  | "EXPO_PUBLIC_FIREBASE_DATABASE_URL"
  | "EXPO_PUBLIC_FIREBASE_PROJECT_ID"
  | "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"
  | "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  | "EXPO_PUBLIC_FIREBASE_APP_ID";

function readStringEnv(name: FirebaseEnvName): string | undefined {
  const v =
    name === "EXPO_PUBLIC_FIREBASE_API_KEY"
      ? process.env.EXPO_PUBLIC_FIREBASE_API_KEY
      : name === "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
        ? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
        : name === "EXPO_PUBLIC_FIREBASE_DATABASE_URL"
          ? process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL
          : name === "EXPO_PUBLIC_FIREBASE_PROJECT_ID"
            ? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
            : name === "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"
              ? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
              : name === "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
                ? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
                : process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function getEnvCheck(): FirebaseEnvCheck {
  const missing: string[] = [];

  const apiKey = readStringEnv("EXPO_PUBLIC_FIREBASE_API_KEY");
  const authDomain = readStringEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN");
  const databaseURL = readStringEnv("EXPO_PUBLIC_FIREBASE_DATABASE_URL");
  const projectId = readStringEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID");
  const storageBucket = readStringEnv("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET");
  const messagingSenderId = readStringEnv("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  const appId = readStringEnv("EXPO_PUBLIC_FIREBASE_APP_ID");

  if (!apiKey) missing.push("EXPO_PUBLIC_FIREBASE_API_KEY");
  if (!authDomain) missing.push("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!databaseURL) missing.push("EXPO_PUBLIC_FIREBASE_DATABASE_URL");
  if (!projectId) missing.push("EXPO_PUBLIC_FIREBASE_PROJECT_ID");
  if (!storageBucket) missing.push("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!messagingSenderId) missing.push("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!appId) missing.push("EXPO_PUBLIC_FIREBASE_APP_ID");

  return {
    ok: missing.length === 0,
    missing,
    values: {
      apiKey,
      authDomain,
      databaseURL,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    },
  };
}

const envCheck = getEnvCheck();

export type FirebaseEnvStatus = {
  enabled: boolean;
  missing: string[];
};

export const firebaseEnvStatus: FirebaseEnvStatus = {
  enabled: envCheck.ok,
  missing: envCheck.missing,
};

console.log("[Firebase] ENV check:", {
  EXPO_PUBLIC_FIREBASE_API_KEY: envCheck.values.apiKey ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: envCheck.values.authDomain ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_DATABASE_URL: envCheck.values.databaseURL ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: envCheck.values.projectId ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: envCheck.values.storageBucket ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: envCheck.values.messagingSenderId ? "SET" : "MISSING",
  EXPO_PUBLIC_FIREBASE_APP_ID: envCheck.values.appId ? "SET" : "MISSING",
});

if (!envCheck.ok) {
  console.error("[Firebase] Missing Firebase env (non-fatal, features disabled):", envCheck.missing);
}

const firebaseConfig = envCheck.ok
  ? {
      apiKey: envCheck.values.apiKey as string,
      authDomain: envCheck.values.authDomain as string,
      databaseURL: envCheck.values.databaseURL as string,
      projectId: envCheck.values.projectId as string,
      storageBucket: envCheck.values.storageBucket as string,
      messagingSenderId: envCheck.values.messagingSenderId as string,
      appId: envCheck.values.appId as string,
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
  return firebaseEnvStatus.missing;
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

export function getFirebase(): FirebaseRuntime | null {
  return getFirebaseMaybe();
}

export function requireEnv(name: FirebaseEnvName): string {
  const v = readStringEnv(name);
  if (!v) {
    console.error(`[Firebase] Missing Firebase env: ${name}`);
    return "";
  }
  return v;
}
