import { Alert } from "react-native";
import { get, push, ref, set, query, orderByChild, limitToLast } from "firebase/database";
import { getFirebase } from "@/constants/firebase";

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
  console.log("[firebaseMeditations] uploadMeditationRecord:start", {
    userId: params.userId,
    courseName: params.courseName,
    duration: params.duration,
  });

  try {
    const { db } = getFirebase();
    const safeUserId = sanitizeUserId(params.userId);

    const recordRef = push(ref(db, `meditations/${safeUserId}`));
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

    await set(recordRef, record);

    console.log("[firebaseMeditations] uploadMeditationRecord:success", { recordId, safeUserId });
    return { recordId };
  } catch (e) {
    console.error("[firebaseMeditations] uploadMeditationRecord:error", e);
    Alert.alert("同步失敗，請重試");
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
