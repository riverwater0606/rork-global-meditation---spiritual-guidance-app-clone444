const {
  ACTION_ID,
  APP_ID,
  handleCors,
  json,
  makeSessionToken,
  readJson,
  verifyWalletAuthPayload,
} = require("../_lib");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await readJson(req);
    const walletAuthResult = body.walletAuthResult || {};
    const nonce = body.nonce || walletAuthResult.nonce;
    const statement = body.statement || walletAuthResult.statement;
    const verified = await verifyWalletAuthPayload(walletAuthResult, nonce, statement);

    return json(res, 200, {
      success: true,
      appId: APP_ID,
      action: ACTION_ID,
      sessionToken: makeSessionToken(verified.walletAddress),
      walletAddress: verified.walletAddress,
      verification: {
        status: "success",
        address: verified.walletAddress,
        source: "vercel-wallet-auth-backend",
      },
      profile: {
        username: verified.username,
        displayName: verified.username,
        avatarUrl: "",
        email: "",
      },
    });
  } catch (error) {
    return json(res, 400, {
      success: false,
      error: error instanceof Error ? error.message : "Wallet Auth verification failed",
    });
  }
};
