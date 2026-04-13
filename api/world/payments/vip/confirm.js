const {
  handleCors,
  json,
  readJson,
  verifyVipPaymentOnChain,
} = require("../../_lib");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await readJson(req);
    const reference = body.reference;
    const paymentResult = body.paymentResult || {};
    const verificationToken = body.verificationToken;

    const verification = await verifyVipPaymentOnChain(
      paymentResult,
      reference,
      verificationToken
    );

    return json(res, 200, {
      ...verification,
      profile: {
        username: "vip-seeker.world",
        displayName: "vip-seeker.world",
        avatarUrl: "",
        email: "",
      },
    });
  } catch (error) {
    return json(res, 400, {
      success: false,
      error: error instanceof Error ? error.message : "Payment verification failed",
    });
  }
};
