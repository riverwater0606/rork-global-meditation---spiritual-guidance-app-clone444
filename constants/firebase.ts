import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type User,
} from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth/react-native";

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

// Hardcoded defaults to ensure it works even if env vars fail to load in preview
const DEFAULTS = {
  apiKey: "AIzaSyB3UgfHijCISL5ttb_fui37KM0OJr895fs",
  authDomain: "psi-g-fad57.firebaseapp.com",
  databaseURL: "https://psi-g-fad57-default-rtdb.firebaseio.com",
  projectId: "psi-g-fad57",
  storageBucket: "psi-g-fad57.firebasestorage.app",
  messagingSenderId: "2645596524",
  appId: "1:2645596524:web:cf0172a516747b0aa8fb49",
};

function readStringEnv(name: FirebaseEnvName): string | undefined {
  try {
    const v =
      name === "EXPO_PUBLIC_FIREBASE_API_KEY"
        ? (process.env.EXPO_PUBLIC_FIREBASE_API_KEY || DEFAULTS.apiKey)
        : name === "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
          ? (process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULTS.authDomain)
          : name === "EXPO_PUBLIC_FIREBASE_DATABASE_URL"
            ? (process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || DEFAULTS.databaseURL)
            : name === "EXPO_PUBLIC_FIREBASE_PROJECT_ID"
              ? (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || DEFAULTS.projectId)
              : name === "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"
                ? (process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULTS.storageBucket)
                : name === "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
                  ? (process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || DEFAULTS.messagingSenderId)
                  : (process.env.EXPO_PUBLIC_FIREBASE_APP_ID || DEFAULTS.appId);

    if (typeof v !== "string") return undefined;
    const trimmed = v.trim();
    if (!trimmed) return undefined;
    return trimmed;
  } catch (e) {
    console.warn(`[Firebase] Failed to read env ${name}:`, e);
    return undefined;
  }
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
let authInitPromise: Promise<User | null> | null = null;
let authReady = false;
let authUser: User | null = null;
let lastAuthError: { code?: string; message?: string } | null = null;

function syncCachedUser(user: User | null) {
  if (cached) {
    cached.user = user;
  }
}

export function getFirebaseLastAuthError(): { code?: string; message?: string } | null {
  return lastAuthError;
}

export function getFirebaseDiagnostics(): {
  enabled: boolean;
  missingEnv: string[];
  authReady: boolean;
  authUid: string | null;
  authIsAnonymous: boolean | null;
  lastAuthError: { code?: string; message?: string } | null;
  databaseURL: string | null;
} {
  return {
    enabled: isFirebaseEnabled(),
    missingEnv: getFirebaseMissingEnv(),
    authReady,
    authUid: authUser?.uid ?? null,
    authIsAnonymous: typeof authUser?.isAnonymous === "boolean" ? authUser.isAnonymous : null,
    lastAuthError,
    databaseURL: firebaseConfig?.databaseURL ?? null,
  };
}

async function ensureAnonymousAuth(auth: Auth): Promise<User | null> {
  if (auth.currentUser) {
    authReady = true;
    authUser = auth.currentUser;
    return auth.currentUser;
  }

  if (!authInitPromise) {
    authInitPromise = new Promise<User | null>((resolve) => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log("[Firebase][Auth] existing user:", { uid: user.uid, isAnonymous: user.isAnonymous });
          authReady = true;
          authUser = user;
          syncCachedUser(user);
          unsub();
          resolve(user);
          return;
        }

        try {
          console.log("[Firebase][Auth] signing in anonymously...");
          const cred = await signInAnonymously(auth);
          console.log("[Firebase][Auth] anonymous sign-in success:", {
            uid: cred.user.uid,
            isAnonymous: cred.user.isAnonymous,
          });
          authReady = true;
          authUser = cred.user;
          syncCachedUser(cred.user);
          unsub();
          resolve(cred.user);
        } catch (e: any) {
          console.error("[Firebase][Auth] anonymous sign-in failed:", e);
          console.error("[Firebase][Auth] Error message:", e?.message);
          console.error("[Firebase][Auth] Error code:", e?.code);
          lastAuthError = { code: e?.code, message: e?.message };
          if (e?.code === "auth/operation-not-allowed" || e?.code === "auth/admin-restricted-operation") {
            console.error(
              "[Firebase][Auth] Anonymous auth is disabled in Firebase Console. Enable: Authentication -> Sign-in method -> Anonymous"
            );
          }
          authReady = true;
          authUser = null;
          syncCachedUser(null);
          unsub();
          resolve(null);
        }
      });
    });
  }

  return authInitPromise;
}

export async function waitForFirebaseAuth(): Promise<User | null> {
  if (!firebaseConfig) return null;

  if (authReady) return authUser;

  const fb = getFirebaseMaybe();
  if (!fb) return null;

  const user = await ensureAnonymousAuth(fb.auth);
  syncCachedUser(user);
  return user;
}

export function isFirebaseAuthReady(): boolean {
  return authReady;
}

export function getFirebaseAuthUser(): User | null {
  return authUser;
}

export function getFirebaseMaybe(): FirebaseRuntime | null {
  if (!firebaseConfig) {
    console.log("[Firebase] getFirebaseMaybe: Firebase disabled (missing env)");
    return null;
  }

  if (cached) {
    return cached;
  }

  console.log("[Firebase] getFirebaseMaybe: initializing new instance...");
  const apps = getApps();
  console.log("[Firebase] Existing apps:", apps.length);

  const app = apps.length > 0 ? apps[0]! : initializeApp(firebaseConfig);
  console.log("[Firebase] App initialized:", app.name);

  const db = getDatabase(app);
  console.log("[Firebase] Database instance created, URL:", firebaseConfig.databaseURL);

  const auth: Auth = (() => {
    if (Platform.OS === "web") {
      console.log("[Firebase][Auth] Using getAuth() (web)");
      return getAuth(app);
    }

    try {
      console.log("[Firebase][Auth] Using initializeAuth() with ReactNative persistence");
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (e) {
      console.log("[Firebase][Auth] initializeAuth() failed or already initialized, falling back to getAuth()", e);
      return getAuth(app);
    }
  })();

  ensureAnonymousAuth(auth).catch((e) => {
    console.error("[Firebase] Auth initialization failed:", e);
  });

  cached = { app, db, auth, user: auth.currentUser };
  return cached;
}

export function getFirebase(): FirebaseRuntime | null {
  return getFirebaseMaybe();
}
