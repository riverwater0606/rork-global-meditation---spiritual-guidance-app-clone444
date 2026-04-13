import { API_BASE_URL } from "@/constants/world";

export interface CloudVipEntitlementResponse<T> {
  state: T | null;
  updatedAt: string | null;
  found: boolean;
  serverNow: string | null;
}

const getApiBaseUrl = () => {
  const trimmed = API_BASE_URL.trim().replace(/\/$/, "");
  if (!trimmed) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL 未設定，VIP entitlement cloud backend 尚未接好");
  }
  return trimmed;
};

export async function fetchCloudVipEntitlement<T>(walletAddress: string): Promise<CloudVipEntitlementResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/vip-entitlement?walletAddress=${encodeURIComponent(walletAddress)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText.slice(0, 300) || `VIP cloud fetch failed (${response.status})`);
  }

  const data = await response.json();
  return {
    state: (data?.state ?? null) as T | null,
    updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : null,
    found: data?.found !== false,
    serverNow: typeof data?.serverNow === "string" ? data.serverNow : null,
  };
}

export async function saveCloudVipEntitlement<T>(params: {
  walletAddress: string;
  state: T;
  updatedAt?: string;
}) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/vip-entitlement`, {
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
    throw new Error(errorText.slice(0, 300) || `VIP cloud save failed (${response.status})`);
  }

  return response.json();
}
