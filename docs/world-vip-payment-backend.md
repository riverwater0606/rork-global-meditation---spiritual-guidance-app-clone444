# World VIP Payment Backend Contract

Frontend VIP upgrade now expects a backend at `EXPO_PUBLIC_API_BASE_URL` with two POST endpoints.

## 1. Create VIP payment intent

Path: `/api/world/payments/vip/create`

Request body:

```json
{
  "appId": "app_346b0844d114f6bac06f1d35eb9f3d1d",
  "action": "psig",
  "product": "vip-membership"
}
```

Optional auth header:

```http
Authorization: Bearer <sessionToken>
```

Successful response:

```json
{
  "reference": "vip_20260322_123456",
  "recipient": "0xf683cbce6d42918907df66040015fcbdad411d9d",
  "amount": "9.99",
  "token": "WLD",
  "description": "PSI-G VIP Membership"
}
```

Notes:
- Create the payment reference on the backend.
- Return the exact wallet, token, amount, and description the client should pass to World Pay.
- Keep the reference unique and idempotent.

## 2. Confirm VIP payment

Path: `/api/world/payments/vip/confirm`

Request body:

```json
{
  "appId": "app_346b0844d114f6bac06f1d35eb9f3d1d",
  "action": "psig",
  "reference": "vip_20260322_123456",
  "paymentResult": {
    "status": "success"
  }
}
```

Optional auth header:

```http
Authorization: Bearer <sessionToken>
```

Successful response:

```json
{
  "success": true,
  "isVIP": true,
  "profile": {
    "username": "user.world",
    "displayName": "user.world",
    "avatarUrl": "https://...",
    "email": ""
  }
}
```

Notes:
- Verify the World payment on the backend using the returned reference and transaction details.
- Only unlock VIP after backend verification succeeds.
- Mark the payment reference as consumed to prevent replay.
