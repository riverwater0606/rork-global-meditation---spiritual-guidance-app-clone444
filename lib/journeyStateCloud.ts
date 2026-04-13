import { API_BASE_URL } from "@/constants/world";

export interface JourneyStateSnapshot<T> {
  state: T | null;
  updatedAt: string | null;
  found: boolean;
}

const getApiBaseUrl = () => {
  const trimmed = API_BASE_URL.trim().replace(/\/$/, "");
  if (!trimmed) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL 未設定，journey state cloud backend 尚未接好");
  }
  return trimmed;
};

export async function fetchCloudJourneyState<T>(userId: string): Promise<JourneyStateSnapshot<T>> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/journey-state?userId=${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText.slice(0, 300) || `Journey state fetch failed (${response.status})`);
  }

  const data = await response.json();
  return {
    state: (data?.state ?? null) as T | null,
    updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : null,
    found: data?.found !== false,
  };
}

export async function saveCloudJourneyState<T>(params: {
  userId: string;
  state: T;
  updatedAt?: string;
}) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/journey-state`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: params.userId,
      state: params.state,
      updatedAt: params.updatedAt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText.slice(0, 300) || `Journey state save failed (${response.status})`);
  }

  return response.json();
}
