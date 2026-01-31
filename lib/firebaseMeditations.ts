import { get, limitToLast, orderByChild, push, query, ref, set } from "firebase/database";
import {
  getFirebaseLastAuthError,
  getFirebaseMaybe,
  getFirebaseMissingEnv,
  isFirebaseEnabled,
  setFirebaseLastWriteError,
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
    console.log("[Firebase] Writing to /meditations: " + path);
    
    const recordRef = push(ref(db, path));
    const recordId = recordRef.key;
    if (!recordId) throw new Error("Failed to allocate recordId");

    const now = new Date().toISOString();
    const record: MeditationRecord = Object.fromEntries(
      Object.entries({
        id: recordId,
        date: now,
        courseName: params.courseName,
        duration: params.duration,
        energyRating: params.energyRating,
        createdAt: now,
      }).filter(([, value]) => value !== undefined)
    ) as MeditationRecord;

    console.log("[firebaseMeditations] Calling set() with record:", JSON.stringify(record));
    await set(recordRef, record);

    console.log("[firebaseMeditations] uploadMeditationRecord:success", { recordId, safeUserId });
    console.log("[firebaseMeditations] Upload success", { path, recordId });
    console.log("[firebaseMeditations] ========== UPLOAD SUCCESS ==========");
    return { recordId };
  } catch (e: any) {
    const code = e?.code;
    const message = e?.message;
    console.error("[firebaseMeditations] ========== UPLOAD FAILED ==========");
    console.error("[firebaseMeditations] uploadMeditationRecord:error", e);
    console.error("[Firebase] Write failed:", { code: e?.code, message: e?.message });
    console.error("[firebaseMeditations] Error message:", e?.message);
    console.error("[firebaseMeditations] Error code:", e?.code);
    console.error("[firebaseMeditations] Error stack:", e?.stack);
    setFirebaseLastWriteError({ code, message });
    const normalizedError = e instanceof Error ? e : new Error(message ?? "Firebase write failed");
    (normalizedError as { code?: string }).code = code;
    if (message && normalizedError.message !== message) {
      normalizedError.message = message;
    }
    throw normalizedError;
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

    const buildList = (value: Record<string, MeditationRecord> | null) => {
      if (!value) return [];
      return Object.entries(value)
        .map(([id, record]) => ({ ...record, id }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const snap = await get(meditationsQuery);
    if (!snap.exists()) {
      console.log("[firebaseMeditations] fetchMeditationHistory:empty", { safeUserId });
      return [];
    }

    const list = buildList(snap.val() as Record<string, MeditationRecord>);
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

export async function fetchMeditationHistoryForUserIds(params: {
  userIds: string[];
  limit?: number;
}): Promise<MeditationRecord[]> {
  const uniqueUserIds = Array.from(
    new Set(params.userIds.map((userId) => userId.trim()).filter(Boolean))
  );

  if (uniqueUserIds.length === 0) {
    return [];
  }

  const historyLists = await Promise.all(
    uniqueUserIds.map((userId) => fetchMeditationHistory({ userId, limit: params.limit }))
  );

  const mergedMap = new Map<string, MeditationRecord>();

  historyLists.forEach((history, index) => {
    const safeUserId = sanitizeUserId(uniqueUserIds[index]!);
    history.forEach((record, recordIndex) => {
      const baseId = record.id ?? `${record.createdAt}-${recordIndex}`;
      const mergedId = `${safeUserId}:${baseId}`;
      if (!mergedMap.has(mergedId)) {
        mergedMap.set(mergedId, { ...record, id: mergedId });
      }
    });
  });

  const merged = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (typeof params.limit === "number") {
    return merged.slice(0, params.limit);
  }

  return merged;
}
