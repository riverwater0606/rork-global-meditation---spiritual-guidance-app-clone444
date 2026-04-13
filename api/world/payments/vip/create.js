const {
  ACTION_ID,
  APP_ID,
  VIP_AMOUNT,
  VIP_RECIPIENT,
  VIP_TOKEN,
  createPaymentIntent,
  decimalToAtomic,
  handleCors,
  json,
} = require("../../_lib");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const paymentIntent = await createPaymentIntent();
    return json(res, 200, {
      appId: APP_ID,
      action: ACTION_ID,
      reference: paymentIntent.reference,
      verificationToken: paymentIntent.verificationToken,
      recipient: VIP_RECIPIENT,
      amount: VIP_AMOUNT,
      tokenAmount: decimalToAtomic(VIP_AMOUNT, VIP_TOKEN),
      token: VIP_TOKEN,
      tokens: [
        {
          symbol: VIP_TOKEN,
          token_amount: decimalToAtomic(VIP_AMOUNT, VIP_TOKEN),
        },
      ],
      description: "PSI-G VIP Membership",
    });
  } catch (error) {
    return json(res, 500, {
      error: error instanceof Error ? error.message : "Failed to create payment intent",
    });
  }
};
