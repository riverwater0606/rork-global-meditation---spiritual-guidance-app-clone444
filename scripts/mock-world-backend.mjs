import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.WORLD_MOCK_PORT || 8787);
const APP_ID = process.env.WORLD_APP_ID || "app_346b0844d114f6bac06f1d35eb9f3d1d";
const ACTION_ID = process.env.WORLD_ACTION_ID || "psig";
const VIP_RECIPIENT =
  process.env.WORLD_VIP_RECIPIENT || "0xf683cbce6d42918907df66040015fcbdad411d9d";
const VIP_AMOUNT = process.env.WORLD_VIP_AMOUNT || "9.99";
const VIP_TOKEN = process.env.WORLD_VIP_TOKEN || "WLD";

const nonces = new Map();
const paymentRefs = new Map();

function json(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  });
  res.end(JSON.stringify(data));
}

function notFound(res) {
  json(res, 404, { error: "Not found" });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function createNonceRecord(statement) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  nonces.set(nonce, {
    issuedAt,
    expiresAt,
    statement,
    consumed: false,
  });
  return { nonce, issuedAt, expiresAt, statement };
}

function createPaymentReference() {
  return `vip_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    return notFound(res);
  }

  if (req.method === "OPTIONS") {
    return json(res, 200, { ok: true });
  }

  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, {
      ok: true,
      appId: APP_ID,
      action: ACTION_ID,
      vipRecipient: VIP_RECIPIENT,
    });
  }

  try {
    if (req.method === "POST" && req.url === "/api/world/wallet-auth/nonce") {
      const body = await readJson(req);
      const statement =
        body.statement || "Sign to confirm wallet ownership and authenticate to PSI-G";
      const record = createNonceRecord(statement);
      return json(res, 200, record);
    }

    if (req.method === "POST" && req.url === "/api/world/wallet-auth/verify") {
      const body = await readJson(req);
      const result = body.walletAuthResult || {};
      const nonce = result.nonce;
      const record = nonce ? nonces.get(nonce) : null;

      if (!nonce || !record) {
        return json(res, 400, { error: "Unknown nonce" });
      }
      if (record.consumed) {
        return json(res, 400, { error: "Nonce already used" });
      }
      if (Date.now() > Date.parse(record.expiresAt)) {
        return json(res, 400, { error: "Nonce expired" });
      }

      record.consumed = true;

      const walletAddress =
        result.address ||
        "0xDeFaCe000000000000000000000000000000BEEF";
      const username = `psi-${walletAddress.slice(2, 8).toLowerCase()}.world`;

      return json(res, 200, {
        success: true,
        sessionToken: `mock_session_${crypto.randomBytes(12).toString("hex")}`,
        walletAddress,
        verification: {
          status: "success",
          address: walletAddress,
          source: "mock-wallet-auth-backend",
          nonce,
        },
        profile: {
          username,
          displayName: username,
          avatarUrl: "",
          email: "",
        },
      });
    }

    if (req.method === "POST" && req.url === "/api/world/payments/vip/create") {
      const reference = createPaymentReference();
      paymentRefs.set(reference, {
        consumed: false,
        createdAt: new Date().toISOString(),
      });

      return json(res, 200, {
        reference,
        recipient: VIP_RECIPIENT,
        amount: VIP_AMOUNT,
        token: VIP_TOKEN,
        description: "PSI-G VIP Membership",
      });
    }

    if (req.method === "POST" && req.url === "/api/world/payments/vip/confirm") {
      const body = await readJson(req);
      const { reference, paymentResult } = body;
      const record = paymentRefs.get(reference);

      if (!reference || !record) {
        return json(res, 400, { error: "Unknown payment reference" });
      }
      if (record.consumed) {
        return json(res, 400, { error: "Payment reference already confirmed" });
      }
      if (paymentResult?.status !== "success") {
        return json(res, 400, { error: "Payment not successful" });
      }

      record.consumed = true;

      return json(res, 200, {
        success: true,
        isVIP: true,
        profile: {
          username: "vip-seeker.world",
          displayName: "vip-seeker.world",
          avatarUrl: "",
          email: "",
        },
      });
    }

    return notFound(res);
  } catch (error) {
    return json(res, 500, {
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
});

server.listen(PORT, () => {
  console.log(`[world-mock-backend] listening on http://127.0.0.1:${PORT}`);
  console.log(
    `[world-mock-backend] set EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:${PORT}`
  );
});
