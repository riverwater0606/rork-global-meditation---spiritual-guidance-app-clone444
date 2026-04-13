import {
  deleteObject,
  getDownloadURL,
  getStorage,
  listAll,
  ref as storageRef,
  uploadString,
} from "firebase/storage";
import { getFirebaseMaybe, waitForFirebaseAuth } from "@/constants/firebase";
import { requestElevenLabsTts } from "@/lib/elevenLabsTts";
import { resolveMeditationUserId } from "@/lib/resolveMeditationUserId";

export type CloudTtsMode = "preview" | "full";

export function getCloudTtsDayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeStorageSegment(input: string) {
  return input.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function getCloudTtsContext(walletAddress?: string | null) {
  const fb = getFirebaseMaybe();
  if (!fb) {
    throw new Error("Firebase is unavailable");
  }

  const authUser = await waitForFirebaseAuth();
  if (!authUser?.uid) {
    throw new Error("Firebase auth is unavailable");
  }

  const { userId } = await resolveMeditationUserId({ walletAddress });
  if (!userId) {
    throw new Error("No cloud cache user is available");
  }

  return {
    storage: getStorage(fb.app),
    userId: sanitizeStorageSegment(userId),
  };
}

function buildAssetPath(params: {
  userId: string;
  mode: CloudTtsMode;
  sessionId: string;
  cacheKey: string;
}) {
  return `tts-cache/${params.userId}/assets/${params.mode}/${sanitizeStorageSegment(params.sessionId)}/${sanitizeStorageSegment(params.cacheKey)}.mp3`;
}

function buildUsagePath(params: {
  userId: string;
  mode: CloudTtsMode;
  dayKey: string;
  cacheKey: string;
}) {
  return `tts-cache/${params.userId}/usage/${params.mode}/${sanitizeStorageSegment(params.dayKey)}/${sanitizeStorageSegment(params.cacheKey)}.json`;
}

function isStorageObjectMissing(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  return code.includes("object-not-found") || message.includes("object-not-found");
}

export function isCloudTtsStorageUnavailableError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = `${code} ${message}`.toLowerCase();
  return (
    normalized.includes("retry-limit-exceeded") ||
    normalized.includes("max retry time") ||
    normalized.includes("cloud cache timeout") ||
    normalized.includes("cloud cache is currently unavailable") ||
    normalized.includes("bucket") ||
    normalized.includes("storage/unknown") ||
    normalized.includes("object does not exist at the desired reference")
  );
}

async function countUsageMarkers(params: {
  storage: ReturnType<typeof getStorage>;
  userId: string;
  mode: CloudTtsMode;
  dayKey: string;
}) {
  try {
    const listing = await listAll(
      storageRef(params.storage, `tts-cache/${params.userId}/usage/${params.mode}/${sanitizeStorageSegment(params.dayKey)}`)
    );
    return listing.items.length;
  } catch (error) {
    if (isStorageObjectMissing(error)) {
      return 0;
    }
    throw error;
  }
}

export async function getCloudTtsUsageForToday(params: {
  walletAddress?: string | null;
  dayKey?: string;
}) {
  const dayKey = params.dayKey ?? getCloudTtsDayKey();
  const { storage, userId } = await getCloudTtsContext(params.walletAddress);

  const [previewUsed, fullUsed] = await Promise.all([
    countUsageMarkers({ storage, userId, mode: "preview", dayKey }),
    countUsageMarkers({ storage, userId, mode: "full", dayKey }),
  ]);

  return {
    dayKey,
    previewUsed,
    fullUsed,
  };
}

export async function getOrCreateCloudTtsAudioUrl(params: {
  walletAddress?: string | null;
  sessionId: string;
  text: string;
  language: string;
  cacheKey: string;
  mode: CloudTtsMode;
  dailyLimit: number;
}) {
  const { storage, userId } = await getCloudTtsContext(params.walletAddress);
  const assetRef = storageRef(
    storage,
    buildAssetPath({
      userId,
      mode: params.mode,
      sessionId: params.sessionId,
      cacheKey: params.cacheKey,
    })
  );

  try {
    const existingUrl = await getDownloadURL(assetRef);
    return {
      url: existingUrl,
      fromCache: true,
      dayKey: getCloudTtsDayKey(),
      usageAfter: null as number | null,
    };
  } catch (error) {
    if (!isStorageObjectMissing(error)) {
      throw error;
    }
  }

  const dayKey = getCloudTtsDayKey();
  const usedToday = await countUsageMarkers({
    storage,
    userId,
    mode: params.mode,
    dayKey,
  });

  if (usedToday >= params.dailyLimit) {
    throw new Error(
      params.mode === "full"
        ? "Today's full guidance generation limit has been reached"
        : "Today's preview generation limit has been reached"
    );
  }

  const payload = await requestElevenLabsTts({
    text: params.text,
    language: params.language,
    cacheKey: params.cacheKey,
    mode: params.mode,
  });

  await uploadString(assetRef, payload.audioBase64, "base64", {
    contentType: payload.mimeType,
    customMetadata: {
      mode: params.mode,
      cacheKey: params.cacheKey,
      language: params.language,
    },
  });

  const usageRef = storageRef(
    storage,
    buildUsagePath({
      userId,
      mode: params.mode,
      dayKey,
      cacheKey: params.cacheKey,
    })
  );

  await uploadString(
    usageRef,
    JSON.stringify({
      createdAt: new Date().toISOString(),
      sessionId: params.sessionId,
      cacheKey: params.cacheKey,
      mode: params.mode,
    }),
    "raw",
    {
      contentType: "application/json",
    }
  );

  const url = await getDownloadURL(assetRef);
  return {
    url,
    fromCache: false,
    dayKey,
    usageAfter: usedToday + 1,
  };
}

export async function deleteCloudTtsCacheForMeditation(params: {
  walletAddress?: string | null;
  sessionId: string;
}) {
  try {
    const { storage, userId } = await getCloudTtsContext(params.walletAddress);
    const sessionKey = sanitizeStorageSegment(params.sessionId);

    const deleteAllInPrefix = async (mode: CloudTtsMode) => {
      const listing = await listAll(
        storageRef(storage, `tts-cache/${userId}/assets/${mode}/${sessionKey}`)
      ).catch((error) => {
        if (isStorageObjectMissing(error)) {
          return null;
        }
        throw error;
      });

      if (!listing) return;
      await Promise.all(listing.items.map((item) => deleteObject(item).catch(() => {})));
    };

    await Promise.all([deleteAllInPrefix("preview"), deleteAllInPrefix("full")]);
  } catch (error) {
    console.error("[firebaseTtsCache] Failed to delete meditation cache", error);
  }
}
