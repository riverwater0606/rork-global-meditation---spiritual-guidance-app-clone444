import { API_BASE_URL } from "@/constants/world";

const TTS_PATH = "/api/tts/elevenlabs";

export interface ElevenLabsTtsResponse {
  provider: "elevenlabs";
  model: string;
  voice: string;
  mode?: "preview" | "full";
  mimeType: string;
  cacheKey: string;
  cached: boolean;
  audioUrl?: string;
  audioBase64?: string;
}

const normalizeTtsErrorDetail = (raw: unknown) => {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return normalizeTtsErrorDetail(JSON.parse(raw));
    } catch {
      const trimmed = raw.trim();
      if (trimmed.includes("quota_exceeded")) {
        return "ElevenLabs credits are exhausted";
      }
      return trimmed;
    }
  }

  if (typeof raw === "object") {
    const payload = raw as {
      detail?: unknown;
      message?: unknown;
      status?: unknown;
      error?: unknown;
    };
    if (typeof payload.status === "string" && payload.status.includes("quota_exceeded")) {
      return "ElevenLabs credits are exhausted";
    }
    return (
      normalizeTtsErrorDetail(payload.detail) ||
      normalizeTtsErrorDetail(payload.message) ||
      normalizeTtsErrorDetail(payload.error)
    );
  }

  return null;
};

const sanitizeBaseUrl = () => {
  const trimmed = API_BASE_URL.trim().replace(/\/$/, "");
  if (!trimmed || trimmed.includes("mini-app-backend.example.com")) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL 未設定，ElevenLabs TTS backend 尚未接好");
  }
  return trimmed;
};

export const createMeditationTtsCacheKey = (
  sessionId: string,
  previewText: string,
  language: string
) => {
  let hash = 5381;
  const source = `${sessionId}:${language}:${previewText}`;
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) + hash + source.charCodeAt(i)) >>> 0;
  }
  return `el-${sessionId}-${hash.toString(36)}`;
};

export async function requestElevenLabsTts(params: {
  sessionId: string;
  text: string;
  language: string;
  cacheKey: string;
  mode?: "preview" | "full";
  allowGenerate?: boolean;
}) {
  const response = await fetch(`${sanitizeBaseUrl()}${TTS_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const payload = (await response.json().catch(() => null)) as
    | ElevenLabsTtsResponse
    | { error?: string; detail?: string }
    | null;

  if (
    !response.ok ||
    !payload ||
    (!("audioUrl" in payload) || !payload.audioUrl) &&
      (!("audioBase64" in payload) || !payload.audioBase64)
  ) {
    const detail =
      normalizeTtsErrorDetail(payload && "detail" in payload ? payload.detail : null) ||
      normalizeTtsErrorDetail(payload && "error" in payload ? payload.error : null) ||
      (payload && "error" in payload && payload.error) ||
      `TTS request failed (${response.status})`;
    throw new Error(detail);
  }

  return payload;
}

export async function requestElevenLabsMeditationPreviewTts(params: {
  sessionId: string;
  text: string;
  language: string;
  cacheKey: string;
  allowGenerate?: boolean;
}) {
  return requestElevenLabsTts(params);
}

export async function requestElevenLabsTtsBlob(params: {
  sessionId: string;
  text: string;
  language: string;
  cacheKey: string;
  mode?: "preview" | "full";
  allowGenerate?: boolean;
}) {
  const response = await fetch(`${sanitizeBaseUrl()}${TTS_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...params,
      responseType: "binary",
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; detail?: string }
      | null;
    const detail =
      normalizeTtsErrorDetail(payload?.detail) ||
      normalizeTtsErrorDetail(payload?.error) ||
      `TTS request failed (${response.status})`;
    throw new Error(detail);
  }

  return response.blob();
}

export async function deleteCloudTtsCacheForMeditation(params: {
  sessionId: string;
}) {
  const response = await fetch(`${sanitizeBaseUrl()}${TTS_PATH}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: params.sessionId,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; detail?: string }
      | null;
    const detail =
      normalizeTtsErrorDetail(payload?.detail) ||
      normalizeTtsErrorDetail(payload?.error) ||
      `Delete TTS cache failed (${response.status})`;
    throw new Error(detail);
  }
}
