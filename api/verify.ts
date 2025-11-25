const ACTION = 'psig';
const VERIFY_ENDPOINT = 'https://developer.worldcoin.org/api/v1/verify';

type VerifyPayload = Record<string, unknown> & {
  nullifier_hash?: string;
  proof?: string;
  merkle_root?: string;
  verification_level?: string;
  credential_type?: string;
  signal?: string;
};

interface VerifyResponseBody {
  success: boolean;
  code?: string;
  detail?: unknown;
  [key: string]: unknown;
}

async function forwardVerification(payload: VerifyPayload | undefined, appId: string): Promise<VerifyResponseBody> {
  if (!payload) {
    return { success: false, code: 'missing_payload' };
  }
  if (!payload.nullifier_hash || !payload.proof || !payload.merkle_root) {
    return { success: false, code: 'invalid_payload', detail: 'Incomplete proof fields' };
  }

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (process.env.WORLD_ID_API_KEY) {
    headers.authorization = `Bearer ${process.env.WORLD_ID_API_KEY}`;
  }

  const body = {
    app_id: appId,
    action: ACTION,
    signal: payload.signal,
    nullifier_hash: payload.nullifier_hash,
    proof: payload.proof,
    merkle_root: payload.merkle_root,
    verification_level: payload.verification_level ?? 'orb',
    credential_type: payload.credential_type ?? 'orb',
  };

  const response = await fetch(VERIFY_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  let parsed: VerifyResponseBody;
  try {
    parsed = (await response.json()) as VerifyResponseBody;
  } catch (error) {
    return { success: false, code: 'invalid_json', detail: error instanceof Error ? error.message : String(error) };
  }

  if (!response.ok) {
    return { success: false, code: parsed.code ?? String(response.status), detail: parsed };
  }

  return parsed;
}

function jsonResponse(body: VerifyResponseBody, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  const appId = process.env.WORLD_ID_APP_ID;
  if (!appId) {
    return jsonResponse({ success: false, code: 'missing_app_id' }, 500);
  }
  const body = (await request.json().catch(() => ({ payload: undefined }))) as { payload?: VerifyPayload };
  const result = await forwardVerification(body.payload, appId);
  return jsonResponse(result, result.success ? 200 : 400);
}

async function readNodeRequestBody(req: any): Promise<{ payload?: VerifyPayload }> {
  if (!req) {
    return {};
  }
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }
  return await new Promise<{ payload?: VerifyPayload }>((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  }).catch(() => ({ } as { payload?: VerifyPayload }));
}

export default async function handler(req: any, res: any) {
  if (req?.method && req.method !== 'POST') {
    res?.status?.(405)?.json?.({ success: false, code: 'method_not_allowed' });
    return;
  }
  const appId = process.env.WORLD_ID_APP_ID;
  if (!appId) {
    res?.status?.(500)?.json?.({ success: false, code: 'missing_app_id' });
    return;
  }
  const body = await readNodeRequestBody(req);
  const result = await forwardVerification(body.payload, appId);
  res?.status?.(result.success ? 200 : 400)?.json?.(result);
}
