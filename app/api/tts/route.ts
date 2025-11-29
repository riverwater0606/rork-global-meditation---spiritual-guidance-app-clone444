import { TextToSpeechClient } from "@google-cloud/text-to-speech";

export async function POST(request: Request) {
  try {
    const { script, language } = await request.json();

    const client = new TextToSpeechClient({
      credentials: {
        client_email: process.env.GOOGLE_TTS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_TTS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
    });

    const [response] = await client.synthesizeSpeech({
      input: { text: script },
      voice: {
        languageCode: language === "zh" ? "zh-CN" : "en-US",
        name: language === "zh" ? "zh-CN-Wavenet-C" : "en-US-Wavenet-F",
        ssmlGender: "FEMALE",
      },
      audioConfig: { audioEncoding: "MP3" },
    });

    const audioContent = response.audioContent?.toString("base64");

    return Response.json({ audioContent });
  } catch (error) {
    console.error("TTS Error:", error);
    return Response.json({ error: "TTS failed" }, { status: 500 });
  }
}
