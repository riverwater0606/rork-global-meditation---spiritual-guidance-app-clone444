import { push, ref, set } from "firebase/database";
import {
  getFirebaseLastAuthError,
  getFirebaseMaybe,
  getFirebaseMissingEnv,
  isFirebaseEnabled,
  waitForFirebaseAuth,
} from "@/constants/firebase";
import { sanitizeUserId } from "@/lib/firebaseMeditations";

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

  const userId = authUser.uid;
  const safeUserId = sanitizeUserId(userId);
  const path = `meditations/${safeUserId}/debug`;

  const r = push(ref(fb.db, path));
  const key = r.key;
  if (!key) throw new Error("Failed to allocate key");

  const payload = {
    createdAt: new Date().toISOString(),
    authUid: authUser.uid,
    resolvedUserId: userId,
    resolvedSource: "auth",
    walletAddress: params.walletAddress,
    platform: "expo",
  };

  console.log("[firebaseDebug] Writing ping", { path, key, payload });
  await set(r, payload);

  return { path, key };
}
