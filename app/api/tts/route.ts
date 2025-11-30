import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Missing `text`" },
        { status: 400 }
      );
    }

    // Use environment variables from Vercel
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL!;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
    const projectId = process.env.GOOGLE_PROJECT_ID!;

    // ---- 1. Generate Google OAuth token ----
    const jwtHeader = {
      alg: "RS256",
      typ: "JWT",
    };

    const jwtClaimSet = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    const base64url = (str: string) =>
      Buffer.from(str)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    const crypto = await import("crypto");
    const jwtUnsigned =
      base64url(JSON.stringify(jwtHeader)) +
      "." +
      base64url(JSON.stringify(jwtClaimSet));

    const signature = crypto
      .createSign("RSA-SHA256")
      .update(jwtUnsigned)
      .sign(privateKey, "base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const jwt = jwtUnsigned + "." + signature;

    // ---- 2. Exchange JWT for access token ----
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const tokenJson = await tokenRes.json();

    if (!tokenJson.access_token) {
      console.error("OAuth Error:", tokenJson);
      return NextResponse.json(
        { error: "Failed to obtain access token." },
        { status: 500 }
      );
    }

    // ---- 3. Call Google TTS API ----
    const ttsRes = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: "en-US",
            ssmlGender: "FEMALE",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
          },
        }),
      }
    );

    const ttsJson = await ttsRes.json();

    return NextResponse.json(ttsJson);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "TTS Server Error" },
      { status: 500 }
    );
  }
}
