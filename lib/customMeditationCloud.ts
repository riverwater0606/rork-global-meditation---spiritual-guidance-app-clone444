import { API_BASE_URL } from "@/constants/world";

export interface CloudMeditationSnapshot<T> {
  items: T[];
  updatedAt: string | null;
  found: boolean;
}

const getApiBaseUrl = () => {
  const trimmed = API_BASE_URL.trim().replace(/\/$/, "");
  if (!trimmed) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL 未設定，custom meditation cloud backend 尚未接好");
  }
  return trimmed;
};

export async function fetchCloudCustomMeditations<T>(userId: string): Promise<CloudMeditationSnapshot<T>> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/custom-meditations?userId=${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText.slice(0, 300) || `Cloud fetch failed (${response.status})`);
  }

  const data = await response.json();
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : null,
    found: data?.found !== false,
  };
}

export async function saveCloudCustomMeditations<T>(params: {
  userId: string;
  items: T[];
  updatedAt?: string;
}) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/custom-meditations`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: params.userId,
      items: params.items,
      updatedAt: params.updatedAt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText.slice(0, 300) || `Cloud save failed (${response.status})`);
  }

  return response.json();
}
