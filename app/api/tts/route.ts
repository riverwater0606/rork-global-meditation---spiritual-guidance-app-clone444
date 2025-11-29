import { TextToSpeechClient } from "@google-cloud/text-to-speech";

const client = new TextToSpeechClient({
  credentials: {
    client_email: process.env.GOOGLE_TTS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_TTS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

export async function POST(request: Request) {
  try {
    const { script, language } = await request.json();

    const [response] = await client.synthesizeSpeech({
      input: { text: script },
      voice: { 
        languageCode: language === "zh" ? "zh-CN" : "en-US", 
        name: language === "zh" ? "zh-CN-Wavenet-C" : "en-US-Wavenet-F" 
      },
      audioConfig: { audioEncoding: "MP3" },
    });

    const base64 = Buffer.from(response.audioContent as string | Uint8Array).toString("base64");

    return Response.json({ audioContent: base64 });
  } catch (error) {
    console.error("TTS Error:", error);
    return Response.json({ error: "TTS failed" }, { status: 500 });
  }
}
