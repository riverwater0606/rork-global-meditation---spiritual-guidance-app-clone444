import { get, push, ref, set, query, orderByChild, limitToLast } from "firebase/database";
import {
  getFirebaseLastAuthError,
  getFirebaseMaybe,
  getFirebaseMissingEnv,
  isFirebaseEnabled,
  waitForFirebaseAuth,
} from "@/constants/firebase";

export interface MeditationRecord {
  id?: string;
  date: string;
  courseName: string;
  duration: number;
  energyRating?: number;
  createdAt: string;
}

export function sanitizeUserId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "unknown";
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "_");
}



export async function uploadMeditationRecord(params: {
  userId: string;
  courseName: string;
  duration: number;
  energyRating?: number;
}): Promise<{ recordId: string }> {
  if (!isFirebaseEnabled()) {
    const missing = getFirebaseMissingEnv();
    console.error("[firebaseMeditations] Firebase disabled - cannot upload", { missing });
    throw new Error(`Firebase disabled (missing env: ${missing.join(", ")})`);
  }
  console.log("[firebaseMeditations] ========== UPLOAD START ==========");
  console.log("[firebaseMeditations] uploadMeditationRecord:start", {
    userId: params.userId,
    courseName: params.courseName,
    duration: params.duration,
    energyRating: params.energyRating,
  });

  try {
    console.log("[firebaseMeditations] Waiting for Firebase auth...");
    const authUser = await waitForFirebaseAuth();
    
    if (!authUser) {
      const last = getFirebaseLastAuthError();
      console.error("[firebaseMeditations] Firebase auth failed - no user", last);
      const code = last?.code ? ` (${last.code})` : "";
      throw new Error(
        `Firebase auth failed${code}. Please enable Anonymous sign-in in Firebase Authentication, then try again.`
      );
    }
    
    console.log("[firebaseMeditations] Auth ready:", {
      uid: authUser.uid,
      isAnonymous: authUser.isAnonymous,
    });

    const fb = getFirebaseMaybe();
    if (!fb) {
      const missing = getFirebaseMissingEnv();
      console.error("[firebaseMeditations] getFirebaseMaybe returned null", { missing });
      throw new Error(`Firebase disabled (missing env: ${missing.join(", ")})`);
    }
    const { db } = fb;
    console.log("[firebaseMeditations] Firebase DB obtained");
    
    const safeUserId = sanitizeUserId(params.userId);
    console.log("[firebaseMeditations] Sanitized userId:", safeUserId);

    const path = `meditations/${safeUserId}`;
    console.log("[firebaseMeditations] Writing to path:", path);
    console.log("[firebaseMeditations] Upload attempt to", path);
    
    const recordRef = push(ref(db, path));
    const recordId = recordRef.key;
    if (!recordId) throw new Error("Failed to allocate recordId");

    const record: MeditationRecord = {
      id: recordId,
      date: new Date().toISOString(),
      courseName: params.courseName,
      duration: params.duration,
      energyRating: params.energyRating,
      createdAt: new Date().toISOString(),
    };

    console.log("[firebaseMeditations] Calling set() with record:", JSON.stringify(record));
    await set(recordRef, record);

    console.log("[firebaseMeditations] uploadMeditationRecord:success", { recordId, safeUserId });
    console.log("[firebaseMeditations] Upload success", { path, recordId });
    console.log("[firebaseMeditations] ========== UPLOAD SUCCESS ==========");
    return { recordId };
  } catch (e: any) {
    console.error("[firebaseMeditations] ========== UPLOAD FAILED ==========");
    console.error("[firebaseMeditations] uploadMeditationRecord:error", e);
    console.error("[firebaseMeditations] Upload failed", { code: e?.code, message: e?.message, path });
    console.error("[firebaseMeditations] Error message:", e?.message);
    console.error("[firebaseMeditations] Error code:", e?.code);
    console.error("[firebaseMeditations] Error stack:", e?.stack);
    throw e;
  }
}

export async function fetchMeditationHistory(params: {
  userId: string;
  limit?: number;
}): Promise<MeditationRecord[]> {
  if (!isFirebaseEnabled()) {
    const missing = getFirebaseMissingEnv();
    console.error("[firebaseMeditations] Firebase disabled - returning empty history", { missing });
    return [];
  }
  console.log("[firebaseMeditations] fetchMeditationHistory:start", {
    userId: params.userId,
    limit: params.limit,
  });

  try {
    console.log("[firebaseMeditations] Waiting for Firebase auth (history)...");
    const authUser = await waitForFirebaseAuth();
    if (!authUser) {
      console.error("[firebaseMeditations] Firebase auth failed - no user (history)");
      return [];
    }
    console.log("[firebaseMeditations] Auth ready (history):", {
      uid: authUser.uid,
      isAnonymous: authUser.isAnonymous,
    });

    const fb = getFirebaseMaybe();
    if (!fb) {
      const missing = getFirebaseMissingEnv();
      console.error("[firebaseMeditations] getFirebaseMaybe returned null (history)", { missing });
      return [];
    }
    const { db } = fb;
    const safeUserId = sanitizeUserId(params.userId);
    const meditationsRef = ref(db, `meditations/${safeUserId}`);
    
    const meditationsQuery = query(
      meditationsRef,
      orderByChild("createdAt"),
      limitToLast(params.limit ?? 50)
    );

    const snap = await get(meditationsQuery);
    if (!snap.exists()) {
      console.log("[firebaseMeditations] fetchMeditationHistory:empty", { safeUserId });
      return [];
    }

    const val = snap.val() as Record<string, MeditationRecord>;
    const list = Object.entries(val)
      .map(([id, record]) => ({ ...record, id }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log("[firebaseMeditations] fetchMeditationHistory:success", {
      safeUserId,
      count: list.length,
    });

    return list;
  } catch (e) {
    console.error("[firebaseMeditations] fetchMeditationHistory:error", e);
    throw e;
  }
}
