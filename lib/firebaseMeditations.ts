import { Alert } from "react-native";
import { get, push, ref, set, query, orderByChild, limitToLast } from "firebase/database";
import { getFirebase } from "@/constants/firebase";
import { onAuthStateChanged } from "firebase/auth";

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

async function waitForAuthReady(timeoutMs: number = 5000): Promise<void> {
  try {
    const { auth } = getFirebase();
    if (auth.currentUser) return;

    await new Promise<void>((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve();
      }, timeoutMs);

      const unsub = onAuthStateChanged(auth, () => {
        clearTimeout(timeoutId);
        unsub();
        resolve();
      });
    });
  } catch (e) {
    console.error("[firebaseMeditations] waitForAuthReady failed (non-fatal):", e);
  }
}

export async function uploadMeditationRecord(params: {
  userId: string;
  courseName: string;
  duration: number;
  energyRating?: number;
}): Promise<{ recordId: string }> {
  console.log("[firebaseMeditations] ========== UPLOAD START ==========");
  console.log("[firebaseMeditations] uploadMeditationRecord:start", {
    userId: params.userId,
    courseName: params.courseName,
    duration: params.duration,
    energyRating: params.energyRating,
  });

  try {
    console.log("[firebaseMeditations] Getting Firebase instance...");
    const { db, auth } = getFirebase();
    console.log("[firebaseMeditations] Firebase DB obtained");

    console.log("[firebaseMeditations] Auth currentUser before wait:", {
      hasUser: Boolean(auth.currentUser),
      uid: auth.currentUser?.uid,
      isAnonymous: auth.currentUser?.isAnonymous,
    });

    await waitForAuthReady(5000);

    console.log("[firebaseMeditations] Auth currentUser after wait:", {
      hasUser: Boolean(auth.currentUser),
      uid: auth.currentUser?.uid,
      isAnonymous: auth.currentUser?.isAnonymous,
    });
    
    const safeUserId = sanitizeUserId(params.userId);
    console.log("[firebaseMeditations] Sanitized userId:", safeUserId);

    const path = `meditations/${safeUserId}`;
    console.log("[firebaseMeditations] Writing to path:", path);
    
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
    console.log("[firebaseMeditations] ========== UPLOAD SUCCESS ==========");
    return { recordId };
  } catch (e: any) {
    console.error("[firebaseMeditations] ========== UPLOAD FAILED ==========");
    console.error("[firebaseMeditations] uploadMeditationRecord:error", e);
    console.error("[firebaseMeditations] Error message:", e?.message);
    console.error("[firebaseMeditations] Error code:", e?.code);
    console.error("[firebaseMeditations] Error stack:", e?.stack);
    Alert.alert("上傳失敗，請檢查網路或重試");
    throw e;
  }
}

export async function fetchMeditationHistory(params: {
  userId: string;
  limit?: number;
}): Promise<MeditationRecord[]> {
  console.log("[firebaseMeditations] fetchMeditationHistory:start", {
    userId: params.userId,
    limit: params.limit,
  });

  try {
    const { db } = getFirebase();
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
    Alert.alert("同步失敗，請重試");
    throw e;
  }
}
