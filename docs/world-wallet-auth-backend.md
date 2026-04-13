# World Wallet Auth Backend Contract

Frontend sign-in now expects a backend at `EXPO_PUBLIC_API_BASE_URL` with two POST endpoints.

## 1. Create nonce

Path: `/api/world/wallet-auth/nonce`

Request body:

```json
{
  "appId": "app_346b0844d114f6bac06f1d35eb9f3d1d",
  "action": "psig",
  "statement": "Sign to confirm wallet ownership and authenticate to PSI-G"
}
```

Successful response:

```json
{
  "nonce": "random-server-generated-nonce",
  "statement": "Sign to confirm wallet ownership and authenticate to PSI-G",
  "issuedAt": "2026-03-22T00:00:00.000Z",
  "expiresAt": "2026-03-22T00:05:00.000Z"
}
```

Notes:
- Generate nonce on the server.
- Store nonce expiry server-side.
- One-time use is recommended.

## 2. Verify wallet auth result

Path: `/api/world/wallet-auth/verify`

Request body:

```json
{
  "appId": "app_346b0844d114f6bac06f1d35eb9f3d1d",
  "action": "psig",
  "walletAuthResult": {
    "status": "success",
    "address": "0x...",
    "signature": "0x...",
    "message": "..."
  }
}
```

Successful response:

```json
{
  "success": true,
  "sessionToken": "jwt-or-session-token",
  "walletAddress": "0x...",
  "verification": {
    "status": "success",
    "address": "0x...",
    "source": "wallet-auth-backend"
  },
  "profile": {
    "username": "user.world",
    "displayName": "user.world",
    "avatarUrl": "https://...",
    "email": ""
  }
}
```

Notes:
- Verify the SIWE payload/signature on the server.
- Reject expired or replayed nonces.
- Return a stable session token for future authenticated API calls.
- `profile` is optional but recommended so the app can show username instead of raw wallet address.
