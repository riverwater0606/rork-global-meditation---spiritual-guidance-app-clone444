import { ref, update } from "firebase/database";
import {
  getFirebaseLastAuthError,
  getFirebaseMaybe,
  getFirebaseMissingEnv,
  isAutomatedWebRuntime,
  isFirebaseEnabled,
  waitForFirebaseAuth,
} from "@/constants/firebase";

export type FirebaseUserBinding = {
  uid: string;
  walletAddress?: string;
  walletGiftId?: string;
  walletMeditationId?: string;
  username?: string;
  usernameGiftId?: string;
  updatedAt: string;
};

export type FirebaseBindingPreview = {
  walletAddress: string | null;
  username: string | null;
  walletGiftId: string | null;
  usernameGiftId: string | null;
  walletMeditationId: string | null;
  hasAnyIdentity: boolean;
  prefersUsernameRouting: boolean;
};

export function sanitizeGiftIdentityId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "unknown";
  return trimmed.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

export function sanitizeMeditationIdentityId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "unknown";
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function getFirebaseBindingPreview(params: {
  walletAddress?: string | null;
  username?: string | null;
}): FirebaseBindingPreview {
  const walletAddress = params.walletAddress?.trim() || null;
  const username = params.username?.trim() || null;

  return {
    walletAddress,
    username,
    walletGiftId: walletAddress ? sanitizeGiftIdentityId(walletAddress) : null,
    usernameGiftId: username ? sanitizeGiftIdentityId(username) : null,
    walletMeditationId: walletAddress ? sanitizeMeditationIdentityId(walletAddress) : null,
    hasAnyIdentity: Boolean(walletAddress || username),
    prefersUsernameRouting: Boolean(username),
  };
}

export async function syncFirebaseUserBinding(params: {
  walletAddress?: string | null;
  username?: string | null;
}): Promise<FirebaseUserBinding | null> {
  if (!isFirebaseEnabled()) {
    return null;
  }

  const authUser = await waitForFirebaseAuth();
  if (!authUser?.uid) {
    if (!isAutomatedWebRuntime()) {
      const last = getFirebaseLastAuthError();
      console.error("[firebaseIdentity] Missing Firebase auth user", last);
    }
    return null;
  }

  const fb = getFirebaseMaybe();
  if (!fb) {
    const missing = getFirebaseMissingEnv();
    console.error("[firebaseIdentity] Firebase unavailable", { missing });
    return null;
  }

  const walletAddress = params.walletAddress?.trim();
  const username = params.username?.trim();

  const binding: FirebaseUserBinding = {
    uid: authUser.uid,
    updatedAt: new Date().toISOString(),
    ...(walletAddress
      ? {
          walletAddress,
          walletGiftId: sanitizeGiftIdentityId(walletAddress),
          walletMeditationId: sanitizeMeditationIdentityId(walletAddress),
        }
      : {}),
    ...(username
      ? {
          username,
          usernameGiftId: sanitizeGiftIdentityId(username),
        }
      : {}),
  };

  await update(ref(fb.db, `userBindings/${authUser.uid}`), binding);
  return binding;
}
