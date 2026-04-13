const crypto = require("node:crypto");
const {
  createPublicClient,
  decodeEventLog,
  http,
  parseUnits,
} = require("viem");

const normalizeEnv = (value, fallback) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || fallback;
};

const APP_ID = normalizeEnv(
  process.env.WORLD_ID_APP_ID,
  "app_7cb26ab7bcbdd62a1bcb3c6353f0b957"
);
const ACTION_ID = normalizeEnv(process.env.WORLD_ID_ACTION_ID, "psig");
const CALLBACK_URL = normalizeEnv(
  process.env.WORLD_ID_CALLBACK_URL,
  "https://444-two.vercel.app/callback"
);
const VIP_RECIPIENT = normalizeEnv(
  process.env.WORLD_VIP_RECIPIENT,
  "0xf683cbce6d42918907df66040015fcbdad411d9d"
).toLowerCase();
const VIP_AMOUNT = normalizeEnv(process.env.WORLD_VIP_AMOUNT, "0.2");
const VIP_TOKEN = normalizeEnv(process.env.WORLD_VIP_TOKEN, "WLD").toUpperCase();
const WORLDCHAIN_RPC_URL = normalizeEnv(
  process.env.WORLDCHAIN_RPC_URL,
  "https://worldchain-mainnet.g.alchemy.com/public"
);
const WORLD_API_BASE_URL = normalizeEnv(
  process.env.WORLD_API_BASE_URL,
  "https://developer.worldcoin.org/api/v2"
).replace(/\/$/, "");
const WORLD_DEV_PORTAL_API_KEY = normalizeEnv(
  process.env.WORLD_DEV_PORTAL_API_KEY ||
    process.env.DEV_PORTAL_API_KEY ||
    process.env.WORLD_ID_API_KEY,
  ""
);
const BACKEND_SECRET =
  normalizeEnv(process.env.WORLD_BACKEND_SECRET, "") ||
  normalizeEnv(process.env.WORLD_ID_APP_ID, "") ||
  "psig-world-backend-secret";

const ENTRY_POINT_V07 = "0x0000000071727de22e5e9d8baf0edac6f37da032";
const USER_OPERATION_EVENT_TOPIC =
  "0x49628fd1471006c1482da88028e97b0d189f215bdc8ef80694955d4485ec7a9d";
const ERC20_TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const WORLD_PAYMENT_TIMEOUT_MS = 5 * 60_000;
const WORLD_PAYMENT_POLL_INTERVAL_MS = 1_000;

const TOKEN_CONFIG = {
  WLD: {
    symbol: "WLD",
    decimals: 18,
    // World Chain canonical WLD token address.
    address: normalizeEnv(
      process.env.WORLD_VIP_TOKEN_ADDRESS_WLD ||
        process.env.WORLD_VIP_TOKEN_ADDRESS,
      "0x2cfc85d8e48f8eab294be644d9e25c3030863003"
    ).toLowerCase(),
  },
  USDC: {
    symbol: "USDC",
    decimals: 6,
    address: normalizeEnv(
      process.env.WORLD_VIP_TOKEN_ADDRESS_USDC ||
        process.env.WORLD_VIP_TOKEN_ADDRESS,
      "0x79a02482a880bce3f13e09da970dc34db4cd24d1"
    ).toLowerCase(),
  },
};

const worldchain = {
  id: 480,
  name: "World Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [WORLDCHAIN_RPC_URL] },
    public: { http: [WORLDCHAIN_RPC_URL] },
  },
};

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http(WORLDCHAIN_RPC_URL, { timeout: 15_000 }),
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function base64UrlEncode(input) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signValue(value) {
  return crypto.createHmac("sha256", BACKEND_SECRET).update(value).digest("base64url");
}

function createSignedToken(payload) {
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = signValue(body);
  return `${body}.${sig}`;
}

function readSignedToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    throw new Error("Invalid signed token");
  }
  const [body, sig] = token.split(".");
  const expected = signValue(body);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error("Signed token verification failed");
  }
  return JSON.parse(base64UrlDecode(body));
}

function createCompactReference() {
  const version = Buffer.from([1]);
  const random = crypto.randomBytes(12);
  const body = Buffer.concat([version, random]);
  const tag = crypto.createHmac("sha256", BACKEND_SECRET).update(body).digest().subarray(0, 8);
  return Buffer.concat([body, tag]).toString("base64url");
}

function verifyCompactReference(reference) {
  const bytes = Buffer.from(reference, "base64url");
  if (bytes.length !== 21) {
    throw new Error("Invalid payment reference format");
  }

  const body = bytes.subarray(0, 13);
  const tag = bytes.subarray(13);
  const expected = crypto.createHmac("sha256", BACKEND_SECRET).update(body).digest().subarray(0, 8);

  if (!crypto.timingSafeEqual(tag, expected)) {
    throw new Error("Payment reference signature mismatch");
  }

  if (body[0] !== 1) {
    throw new Error("Unsupported payment reference version");
  }

  return {
    version: body[0],
    id: body.subarray(1).toString("hex"),
  };
}

function getTokenConfig(symbol) {
  const config = TOKEN_CONFIG[String(symbol || VIP_TOKEN).toUpperCase()];
  if (!config) {
    throw new Error(`Unsupported VIP token: ${symbol}`);
  }
  return config;
}

function decimalToAtomic(amount, symbol = VIP_TOKEN) {
  const config = getTokenConfig(symbol);
  return parseUnits(String(amount), config.decimals).toString();
}

async function getCurrentBlockNumber() {
  const blockNumber = await publicClient.getBlockNumber();
  return Number(blockNumber);
}

function createNonce(statement) {
  const payload = {
    type: "wallet-auth-nonce",
    appId: APP_ID,
    action: ACTION_ID,
    statement,
    jti: crypto.randomBytes(8).toString("hex"),
    iat: Date.now(),
    exp: Date.now() + 5 * 60 * 1000,
  };
  return createSignedToken(payload);
}

function verifyNonce(nonce, expectedStatement) {
  const payload = readSignedToken(nonce);
  if (payload.type !== "wallet-auth-nonce") {
    throw new Error("Invalid nonce type");
  }
  if (payload.appId !== APP_ID || payload.action !== ACTION_ID) {
    throw new Error("Nonce app/action mismatch");
  }
  if (payload.exp < Date.now()) {
    throw new Error("Nonce expired");
  }
  if (expectedStatement && payload.statement !== expectedStatement) {
    throw new Error("Nonce statement mismatch");
  }
  return payload;
}

async function createPaymentIntent() {
  const tokenConfig = getTokenConfig(VIP_TOKEN);
  const reference = createCompactReference();
  const fromBlock = await getCurrentBlockNumber();
  const verificationToken = createSignedToken({
    type: "vip-payment-intent",
    appId: APP_ID,
    action: ACTION_ID,
    reference,
    recipient: VIP_RECIPIENT,
    token: tokenConfig.symbol,
    tokenAddress: tokenConfig.address,
    amount: VIP_AMOUNT,
    atomicAmount: decimalToAtomic(VIP_AMOUNT, tokenConfig.symbol),
    fromBlock,
    iat: Date.now(),
    exp: Date.now() + 30 * 60 * 1000,
  });

  return {
    reference,
    verificationToken,
    fromBlock,
    tokenConfig,
  };
}

function verifyPaymentIntent(reference, verificationToken) {
  verifyCompactReference(reference);

  const payload = readSignedToken(verificationToken);
  if (payload.type !== "vip-payment-intent") {
    throw new Error("Invalid payment intent token");
  }
  if (payload.appId !== APP_ID || payload.action !== ACTION_ID) {
    throw new Error("Payment intent app/action mismatch");
  }
  if (payload.exp < Date.now()) {
    throw new Error("Payment intent expired");
  }
  if (payload.reference !== reference) {
    throw new Error("Payment intent/reference mismatch");
  }
  return payload;
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return await new Promise((resolve, reject) => {
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

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,authorization");
  res.end(JSON.stringify(data));
}

function handleCors(req, res) {
  if (req.method === "OPTIONS") {
    json(res, 200, { ok: true });
    return true;
  }
  return false;
}

async function verifyWalletAuthPayload(walletAuthResult, providedNonce, expectedStatement) {
  const nonce = providedNonce || walletAuthResult?.nonce;
  const address = walletAuthResult?.address;
  const signature = walletAuthResult?.signature;
  const message = walletAuthResult?.message || walletAuthResult?.siweMessage;

  if (!nonce || !address) {
    throw new Error("Wallet Auth result missing nonce or address");
  }

  verifyNonce(nonce, expectedStatement);

  if (signature && message) {
    const verified = await publicClient.verifyMessage({
      address,
      message,
      signature,
    });
    if (!verified) {
      throw new Error("Wallet signature verification failed");
    }
  }

  return {
    walletAddress: address,
    username: `psi-${String(address).slice(2, 8).toLowerCase()}.world`,
  };
}

function makeSessionToken(walletAddress) {
  return createSignedToken({
    type: "session",
    walletAddress,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
}

function extractPaymentResultReference(payload) {
  return (
    payload?.reference ||
    payload?.payment_reference ||
    payload?.data?.reference ||
    payload?.data?.payment_reference ||
    payload?.transaction?.reference ||
    payload?.transaction?.payment_reference ||
    payload?.finalPayload?.reference ||
    payload?.finalPayload?.payment_reference ||
    payload?.input?.reference ||
    null
  );
}

function extractPaymentResultTransactionId(payload) {
  return (
    payload?.transaction_id ||
    payload?.transactionId ||
    payload?.id ||
    payload?.data?.transaction_id ||
    payload?.data?.transactionId ||
    payload?.data?.id ||
    payload?.transaction?.transaction_id ||
    payload?.transaction?.transactionId ||
    payload?.transaction?.id ||
    payload?.finalPayload?.transaction_id ||
    payload?.finalPayload?.transactionId ||
    payload?.finalPayload?.id ||
    null
  );
}

function extractPaymentResultStatus(payload) {
  return (
    payload?.transaction_status ||
    payload?.status ||
    payload?.data?.transaction_status ||
    payload?.data?.status ||
    payload?.transaction?.transaction_status ||
    payload?.transaction?.status ||
    payload?.finalPayload?.transaction_status ||
    payload?.finalPayload?.status ||
    null
  );
}

function extractPaymentResultCommandStatus(payload) {
  return (
    payload?.status ||
    payload?.command_status ||
    payload?.data?.status ||
    payload?.data?.command_status ||
    payload?.finalPayload?.status ||
    payload?.transaction?.command_status ||
    null
  );
}

function extractPaymentResultFrom(payload) {
  return (
    payload?.from ||
    payload?.from_wallet_address ||
    payload?.fromWalletAddress ||
    payload?.data?.from ||
    payload?.data?.from_wallet_address ||
    payload?.data?.fromWalletAddress ||
    payload?.transaction?.from ||
    payload?.transaction?.from_wallet_address ||
    payload?.transaction?.fromWalletAddress ||
    payload?.finalPayload?.from ||
    payload?.finalPayload?.from_wallet_address ||
    payload?.finalPayload?.fromWalletAddress ||
    null
  );
}

function extractPaymentResultChain(payload) {
  return (
    payload?.chain ||
    payload?.network ||
    payload?.data?.chain ||
    payload?.data?.network ||
    payload?.transaction?.chain ||
    payload?.transaction?.network ||
    payload?.finalPayload?.chain ||
    payload?.finalPayload?.network ||
    null
  );
}

function ensureSubmittedPaymentResult(paymentResult, expectedReference) {
  if (!paymentResult || typeof paymentResult !== "object") {
    throw new Error("Missing payment result");
  }

  const commandStatus = String(
    extractPaymentResultCommandStatus(paymentResult) || ""
  ).toLowerCase();
  const transactionStatus = String(
    extractPaymentResultStatus(paymentResult) || ""
  ).toLowerCase();
  const paymentReference = extractPaymentResultReference(paymentResult);
  const transactionId = extractPaymentResultTransactionId(paymentResult);

  if (
    commandStatus &&
    commandStatus !== "success" &&
    commandStatus !== "submitted"
  ) {
    throw new Error("Payment command did not succeed");
  }

  if (
    transactionStatus &&
    transactionStatus !== "submitted" &&
    transactionStatus !== "pending" &&
    transactionStatus !== "mined" &&
    transactionStatus !== "confirmed" &&
    transactionStatus !== "completed" &&
    transactionStatus !== "success"
  ) {
    throw new Error(`Unexpected payment transaction status: ${transactionStatus}`);
  }

  if (paymentReference && paymentReference !== expectedReference) {
    throw new Error("Payment result reference mismatch");
  }

  if (!transactionId) {
    throw new Error("Payment result missing transaction_id");
  }

  return {
    reference: paymentReference || expectedReference,
    transactionId,
    transactionStatus: transactionStatus || "submitted",
    senderAddress: extractPaymentResultFrom(paymentResult),
    chain: extractPaymentResultChain(paymentResult) || "worldchain",
  };
}

async function fetchWorldTransaction(transactionId) {
  const url = new URL(
    `${WORLD_API_BASE_URL}/minikit/transaction/${encodeURIComponent(transactionId)}`
  );
  url.searchParams.set("app_id", APP_ID);
  url.searchParams.set("type", "payment");

  const headers = {};
  if (WORLD_DEV_PORTAL_API_KEY) {
    headers.authorization = `Bearer ${WORLD_DEV_PORTAL_API_KEY}`;
  }

  const response = await fetch(url.toString(), { headers });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      `World transaction lookup failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function getPortalTransactionStatus(payload) {
  return (
    payload?.transaction_status ||
    payload?.status ||
    payload?.transaction?.transaction_status ||
    payload?.transaction?.status ||
    null
  );
}

function extractPortalReference(payload) {
  return (
    payload?.reference ||
    payload?.transaction?.reference ||
    payload?.input?.reference ||
    null
  );
}

function extractPortalTxHash(payload) {
  return (
    payload?.transaction_hash ||
    payload?.tx_hash ||
    payload?.hash ||
    payload?.transactionHash ||
    payload?.transaction?.transaction_hash ||
    payload?.transaction?.tx_hash ||
    payload?.transaction?.hash ||
    payload?.transaction?.transactionHash ||
    null
  );
}

function extractPortalFrom(payload) {
  return (
    payload?.from ||
    payload?.from_wallet_address ||
    payload?.fromWalletAddress ||
    payload?.transaction?.from ||
    payload?.transaction?.from_wallet_address ||
    payload?.transaction?.fromWalletAddress ||
    null
  );
}

function extractPortalRecipient(payload) {
  return (
    payload?.to ||
    payload?.recipient ||
    payload?.receiver ||
    payload?.transaction?.to ||
    payload?.transaction?.recipient ||
    payload?.transaction?.receiver ||
    null
  );
}

function extractPortalTokenSymbol(payload) {
  return (
    payload?.token ||
    payload?.token_symbol ||
    payload?.symbol ||
    payload?.transaction?.token ||
    payload?.transaction?.token_symbol ||
    payload?.transaction?.symbol ||
    null
  );
}

function extractPortalAmount(payload) {
  return (
    payload?.amount ||
    payload?.token_amount ||
    payload?.value ||
    payload?.transaction?.amount ||
    payload?.transaction?.token_amount ||
    payload?.transaction?.value ||
    null
  );
}

function normalizeAddress(value) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function valuesEqualAsStrings(a, b) {
  return String(a ?? "").trim() === String(b ?? "").trim();
}

function buildAcceptedPortalAmounts(intent) {
  const accepted = new Set();
  if (intent?.atomicAmount != null) {
    accepted.add(String(intent.atomicAmount));
  }
  if (intent?.amount != null) {
    accepted.add(String(intent.amount));
    try {
      accepted.add(parseUnits(String(intent.amount), 6).toString());
    } catch {
      // Ignore malformed decimal conversions here; other comparisons remain available.
    }
  }
  return accepted;
}

async function waitForPortalPayment(transactionId, expectedReference) {
  const deadline = Date.now() + WORLD_PAYMENT_TIMEOUT_MS;
  let lastPayload = null;

  while (Date.now() < deadline) {
    const payload = await fetchWorldTransaction(transactionId);
    lastPayload = payload;

    const portalReference = extractPortalReference(payload);
    if (portalReference && portalReference !== expectedReference) {
      throw new Error("World transaction reference mismatch");
    }

    const status = getPortalTransactionStatus(payload);
    const transactionHash = extractPortalTxHash(payload);
    if (transactionHash) {
      return payload;
    }
    if (
      status === "mined" ||
      status === "confirmed" ||
      status === "completed" ||
      status === "success" ||
      status === "submitted" ||
      status === "pending"
    ) {
      return payload;
    }
    if (status === "failed") {
      throw new Error("World payment transaction failed on-chain");
    }

    await sleep(WORLD_PAYMENT_POLL_INTERVAL_MS);
  }

  if (lastPayload) {
    const status = getPortalTransactionStatus(lastPayload);
    throw new Error(`Timed out waiting for mined payment (last status: ${status || "unknown"})`);
  }

  throw new Error("Timed out waiting for World payment confirmation");
}

async function waitForReceipt(transactionHash) {
  const deadline = Date.now() + WORLD_PAYMENT_TIMEOUT_MS;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      return await publicClient.getTransactionReceipt({
        hash: transactionHash,
      });
    } catch (error) {
      lastError = error;
      await sleep(WORLD_PAYMENT_POLL_INTERVAL_MS);
    }
  }

  throw new Error(
    `Timed out waiting for on-chain receipt${
      lastError instanceof Error && lastError.message
        ? ` (${lastError.message})`
        : ""
    }`
  );
}

async function verifyUserOperationEvent(transactionHash, fromBlock, senderAddress) {
  const receipt = await waitForReceipt(transactionHash);

  if (receipt.status !== "success") {
    throw new Error("On-chain receipt status is not success");
  }

  const entryPoint = ENTRY_POINT_V07.toLowerCase();
  const sender = normalizeAddress(senderAddress);

  const userOpLog = receipt.logs.find(
    (log) =>
      normalizeAddress(log.address) === entryPoint &&
      log.topics?.[0]?.toLowerCase() === USER_OPERATION_EVENT_TOPIC
  );

  if (!userOpLog) {
    throw new Error("UserOperationEvent log not found");
  }

  const decoded = decodeEventLog({
    abi: [
      {
        anonymous: false,
        inputs: [
          { indexed: true, name: "userOpHash", type: "bytes32" },
          { indexed: true, name: "sender", type: "address" },
          { indexed: true, name: "paymaster", type: "address" },
          { indexed: false, name: "nonce", type: "uint256" },
          { indexed: false, name: "success", type: "bool" },
          { indexed: false, name: "actualGasCost", type: "uint256" },
          { indexed: false, name: "actualGasUsed", type: "uint256" },
        ],
        name: "UserOperationEvent",
        type: "event",
      },
    ],
    data: userOpLog.data,
    topics: userOpLog.topics,
  });

  const logSender = normalizeAddress(decoded.args.sender);
  if (sender && logSender !== sender) {
    throw new Error("UserOperationEvent sender mismatch");
  }

  if (!decoded.args.success) {
    throw new Error("UserOperationEvent indicates failure");
  }

  if (typeof fromBlock === "number" && Number(receipt.blockNumber) < fromBlock) {
    throw new Error("Payment mined before issued payment intent");
  }

  return {
    receipt,
    sender: logSender,
    blockNumber: Number(receipt.blockNumber),
    userOpHash: decoded.args.userOpHash,
  };
}

function getIndexedAddressFromTopic(topic) {
  if (!topic) return "";
  return `0x${topic.slice(-40)}`.toLowerCase();
}

function matchesTransferAmount(log, expectedAtomicAmount) {
  if (!log?.data) return false;
  try {
    const value = BigInt(log.data);
    return value === BigInt(expectedAtomicAmount);
  } catch {
    return false;
  }
}

function verifyTokenTransfer(receipt, intent, senderAddress) {
  const expectedTokenAddress = normalizeAddress(intent.tokenAddress);
  const expectedSender = normalizeAddress(senderAddress);
  const expectedRecipient = normalizeAddress(intent.recipient);

  const transferLog = receipt.logs.find((log) => {
    if (normalizeAddress(log.address) !== expectedTokenAddress) return false;
    if (log.topics?.[0]?.toLowerCase() !== ERC20_TRANSFER_TOPIC) return false;

    const from = getIndexedAddressFromTopic(log.topics?.[1]);
    const to = getIndexedAddressFromTopic(log.topics?.[2]);
    if (from !== expectedSender || to !== expectedRecipient) return false;

    return matchesTransferAmount(log, intent.atomicAmount);
  });

  if (!transferLog) {
    throw new Error("Expected token transfer log not found");
  }

  return transferLog;
}

async function verifyVipPaymentOnChain(paymentResult, reference, verificationToken) {
  const normalizedPayment = ensureSubmittedPaymentResult(paymentResult, reference);
  const intent = verifyPaymentIntent(reference, verificationToken);
  const portalPayload = await waitForPortalPayment(normalizedPayment.transactionId, reference);
  const portalReference = extractPortalReference(portalPayload);
  if (portalReference && portalReference !== reference) {
    throw new Error("World transaction reference mismatch");
  }
  const transactionHash = extractPortalTxHash(portalPayload);
  const portalStatus = String(getPortalTransactionStatus(portalPayload) || "").toLowerCase();
  if (portalStatus === "failed") {
    throw new Error("World payment transaction failed");
  }
  const senderAddress = extractPortalFrom(portalPayload) || normalizedPayment.senderAddress;

  return {
    success: true,
    appId: APP_ID,
    action: ACTION_ID,
    isVIP: true,
    reference,
    transactionId: normalizedPayment.transactionId,
    transactionHash,
    chain: normalizedPayment.chain,
    sender: normalizeAddress(senderAddress),
    recipient: intent.recipient,
    amount: intent.amount,
    atomicAmount: intent.atomicAmount,
    token: intent.token,
    verification: {
      portalStatus: getPortalTransactionStatus(portalPayload) || "submitted",
      blockNumber: null,
      userOpHash: null,
      onChainVerified: false,
      onChainVerificationError: null,
    },
  };
}

module.exports = {
  APP_ID,
  ACTION_ID,
  CALLBACK_URL,
  VIP_RECIPIENT,
  VIP_AMOUNT,
  VIP_TOKEN,
  WORLDCHAIN_RPC_URL,
  WORLD_API_BASE_URL,
  WORLD_DEV_PORTAL_API_KEY,
  createNonce,
  verifyNonce,
  createPaymentIntent,
  verifyPaymentIntent,
  getTokenConfig,
  decimalToAtomic,
  readJson,
  json,
  handleCors,
  verifyWalletAuthPayload,
  makeSessionToken,
  verifyVipPaymentOnChain,
};
