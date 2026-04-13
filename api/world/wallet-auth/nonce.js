const { ACTION_ID, APP_ID, createNonce, handleCors, json, readJson } = require("../_lib");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await readJson(req);
    const statement =
      body.statement || "Sign to confirm wallet ownership and authenticate to PSI-G";
    const nonce = createNonce(statement);
    return json(res, 200, {
      nonce,
      statement,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      appId: APP_ID,
      action: ACTION_ID,
    });
  } catch (error) {
    return json(res, 500, {
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
};
