const DEFAULT_TIMEOUT = 12000;
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch(path: string, options: RequestOptions = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function postJson<TBody>(path: string, body: TBody, options: RequestOptions = {}) {
  return apiFetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
    ...options,
  });
}
