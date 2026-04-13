import { ACTION_ID, API_BASE_URL, APP_ID } from "@/constants/world";

const VIP_PAY_CREATE_PATH = "/api/world/payments/vip/create";
const VIP_PAY_CONFIRM_PATH = "/api/world/payments/vip/confirm";

interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

export interface VipPaymentCreateResponse {
  reference: string;
  verificationToken?: string;
  recipient?: string;
  to?: string;
  amount?: number | string;
  tokenAmount?: string;
  token?: string;
  tokens?: Array<{
    symbol: string;
    token_amount: string;
  }>;
  description?: string;
}

export interface VipPaymentConfirmResponse {
  success: boolean;
  isVIP?: boolean;
  profile?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    email?: string;
  };
  [key: string]: unknown;
}

function getApiBaseUrl(): string {
  const trimmed = API_BASE_URL.trim().replace(/\/$/, "");
  if (!trimmed || trimmed.includes("mini-app-backend.example.com")) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL 未設定，VIP payment backend 尚未接好");
  }
  return trimmed;
}

async function parseJsonSafe(response: Response) {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return null;
  }
}

async function postJson<TResponse>(
  path: string,
  body: Record<string, unknown>,
  authToken?: string | null
): Promise<TResponse> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (authToken) {
    headers.authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      payload?.detail ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as TResponse;
}

export async function createVipPayment(authToken?: string | null) {
  const payload = await postJson<VipPaymentCreateResponse>(
    VIP_PAY_CREATE_PATH,
    {
      appId: APP_ID,
      action: ACTION_ID,
      product: "vip-membership",
    },
    authToken
  );

  const recipient = payload.recipient || payload.to;
  if (!payload.reference || !recipient || !payload.amount) {
    throw new Error("VIP payment backend 未返回完整付款資料");
  }

  return {
    reference: payload.reference,
    verificationToken: payload.verificationToken || "",
    recipient,
    amount: payload.amount,
    tokenAmount: payload.tokenAmount || "",
    tokens: payload.tokens || [],
    token: payload.token || "WLD",
    description: payload.description || "PSI-G VIP Membership",
  };
}

export async function confirmVipPayment(
  paymentResult: Record<string, unknown>,
  reference: string,
  verificationToken: string,
  authToken?: string | null
) {
  const payload = await postJson<VipPaymentConfirmResponse>(
    VIP_PAY_CONFIRM_PATH,
    {
      appId: APP_ID,
      action: ACTION_ID,
      reference,
      verificationToken,
      paymentResult,
    },
    authToken
  );

  if (!payload?.success) {
    throw new Error("VIP payment 驗證未成功");
  }

  return payload;
}
