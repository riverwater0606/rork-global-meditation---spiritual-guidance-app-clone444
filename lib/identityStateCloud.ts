import { API_BASE_URL } from "@/constants/world";

export interface CloudIdentityStateResponse<T> {
  state: T | null;
  updatedAt: string | null;
  found: boolean;
}

const getApiBaseUrl = () => {
  const trimmed = API_BASE_URL.trim().replace(/\/$/, "");
  if (!trimmed) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL 未設定，identity state cloud backend 尚未接好");
  }
  return trimmed;
};

export async function fetchCloudIdentityState<T>(walletAddress: string): Promise<CloudIdentityStateResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/identity-state?walletAddress=${encodeURIComponent(walletAddress)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText.slice(0, 300) || `Identity state fetch failed (${response.status})`);
  }

  const data = await response.json();
  return {
    state: (data?.state ?? null) as T | null,
    updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : null,
    found: data?.found !== false,
  };
}

export async function saveCloudIdentityState<T>(params: {
  walletAddress: string;
  state: T;
  updatedAt?: string;
}) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/identity-state`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      walletAddress: params.walletAddress,
      state: params.state,
      updatedAt: params.updatedAt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText.slice(0, 300) || `Identity state save failed (${response.status})`);
  }

  return response.json();
}
