# Local World Mini App Dev

To test the new backend-driven World flows locally:

## 1. Start the local World mock backend

```bash
npm run world:mock
```

Default URL:

```bash
http://127.0.0.1:8787
```

## 2. Start Expo with the backend URL

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 npm run dev:web
```

Or for mobile/tunnel:

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 npm run dev:web:tunnel
```

## 3. What the mock backend supports

- `POST /api/world/wallet-auth/nonce`
- `POST /api/world/wallet-auth/verify`
- `POST /api/world/payments/vip/create`
- `POST /api/world/payments/vip/confirm`
- `GET /health`

## 4. Notes

- This mock backend is only for local development.
- It stores nonce and payment references in memory.
- Restarting the process clears all mock state.
- Production should replace this with a real backend that verifies SIWE signatures and payment confirmations.
