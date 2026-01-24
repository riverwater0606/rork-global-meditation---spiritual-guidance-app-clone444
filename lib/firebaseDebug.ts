import { push, ref, set } from "firebase/database";
import {
  getFirebaseLastAuthError,
  getFirebaseMaybe,
  getFirebaseMissingEnv,
  isFirebaseEnabled,
  waitForFirebaseAuth,
} from "@/constants/firebase";

function sanitizeKey(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "unknown";
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function firebaseDebugPing(params: {
  walletAddress: string;
}): Promise<{ path: string; key: string }> {
  if (!isFirebaseEnabled()) {
    const missing = getFirebaseMissingEnv();
    console.error("[firebaseDebug] Firebase disabled", { missing });
    throw new Error(`Firebase disabled (missing env: ${missing.join(", ")})`);
  }

  const authUser = await waitForFirebaseAuth();
  if (!authUser) {
    const last = getFirebaseLastAuthError();
    const code = last?.code ? ` (${last.code})` : "";
    throw new Error(`Firebase auth failed${code}. ${last?.message ?? ""}`);
  }

  const fb = getFirebaseMaybe();
  if (!fb) {
    const missing = getFirebaseMissingEnv();
    throw new Error(`Firebase disabled (missing env: ${missing.join(", ")})`);
  }

  const safe = sanitizeKey(params.walletAddress);
  const path = `debug/ping/${safe}`;

  const r = push(ref(fb.db, path));
  const key = r.key;
  if (!key) throw new Error("Failed to allocate key");

  const payload = {
    createdAt: new Date().toISOString(),
    authUid: authUser.uid,
    walletAddress: params.walletAddress,
    platform: "expo",
  };

  console.log("[firebaseDebug] Writing ping", { path, key, payload });
  await set(r, payload);

  return { path, key };
}
