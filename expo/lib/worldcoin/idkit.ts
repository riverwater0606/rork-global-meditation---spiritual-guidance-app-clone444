const DEFAULT_ENDPOINT = 'https://developer.worldcoin.org/api/v1/verify';

export interface VerifyCloudProofPayload {
  nullifier_hash?: string;
  proof?: string;
  merkle_root?: string;
  signal?: string;
  credential_type?: string;
  verification_level?: string;
  app_id?: string;
  action?: string;
  [key: string]: unknown;
}

export interface VerifyCloudProofResponse {
  success: boolean;
  code?: string;
  detail?: unknown;
  [key: string]: unknown;
}

const DEFAULT_VERIFICATION_LEVEL = 'orb';

function buildRequestBody(payload: VerifyCloudProofPayload, appId: string, action: string) {
  if (!payload) {
    throw new Error('Missing verification payload');
  }
  if (!payload.nullifier_hash || !payload.proof || !payload.merkle_root) {
    throw new Error('Incomplete World ID proof payload');
  }
  return {
    app_id: appId,
    action,
    signal: payload.signal,
    nullifier_hash: payload.nullifier_hash,
    proof: payload.proof,
    merkle_root: payload.merkle_root,
    verification_level: payload.verification_level ?? DEFAULT_VERIFICATION_LEVEL,
    credential_type: payload.credential_type ?? DEFAULT_VERIFICATION_LEVEL,
  };
}

export async function verifyCloudProof(payload: VerifyCloudProofPayload, appId: string, action: string): Promise<VerifyCloudProofResponse> {
  if (!appId) {
    throw new Error('WORLD_ID_APP_ID missing');
  }
  if (!action) {
    throw new Error('Verification action missing');
  }

  const body = buildRequestBody(payload, appId, action);
  const endpoint = process.env.WORLD_ID_VERIFY_ENDPOINT ?? DEFAULT_ENDPOINT;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (process.env.WORLD_ID_API_KEY) {
    headers.authorization = `Bearer ${process.env.WORLD_ID_API_KEY}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  let parsed: VerifyCloudProofResponse;
  try {
    parsed = (await response.json()) as VerifyCloudProofResponse;
  } catch (error) {
    return {
      success: false,
      code: 'invalid_json',
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  if (!response.ok) {
    return {
      success: false,
      code: parsed?.code ?? String(response.status),
      detail: parsed,
    };
  }

  return parsed;
}
