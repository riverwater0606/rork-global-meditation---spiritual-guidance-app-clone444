import { ACTION_ID, API_BASE_URL, APP_ID, WALLET_AUTH_STATEMENT } from "@/constants/world";

const WALLET_AUTH_NONCE_PATH = "/api/world/wallet-auth/nonce";
const WALLET_AUTH_VERIFY_PATH = "/api/world/wallet-auth/verify";

interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

export interface WalletAuthNonceResponse {
  nonce: string;
  statement?: string;
  issuedAt?: string;
  expiresAt?: string;
}

export interface WalletAuthVerificationResponse {
  success: boolean;
  token?: string;
  sessionToken?: string;
  walletAddress?: string;
  verification?: Record<string, unknown>;
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
    throw new Error("EXPO_PUBLIC_API_BASE_URL 未設定，Wallet Auth backend 尚未接好");
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

async function postJson<TResponse>(path: string, body: Record<string, unknown>): Promise<TResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
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

export async function requestWalletAuthNonce() {
  const payload = await postJson<WalletAuthNonceResponse>(WALLET_AUTH_NONCE_PATH, {
    appId: APP_ID,
    action: ACTION_ID,
    statement: WALLET_AUTH_STATEMENT,
  });

  if (!payload?.nonce) {
    throw new Error("Wallet Auth backend 未返回 nonce");
  }

  return payload;
}

export async function verifyWalletAuthResult(
  walletAuthResult: Record<string, unknown>,
  nonce: string,
  statement?: string
) {
  const payload = await postJson<WalletAuthVerificationResponse>(WALLET_AUTH_VERIFY_PATH, {
    appId: APP_ID,
    action: ACTION_ID,
    nonce,
    statement: statement || WALLET_AUTH_STATEMENT,
    walletAuthResult,
  });

  if (!payload?.success) {
    throw new Error("Wallet Auth 驗證未成功");
  }

  return payload;
}
