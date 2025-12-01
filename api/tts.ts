import textToSpeech from "@google-cloud/text-to-speech";

// Simple type definitions to replace Next.js types
interface VercelRequest {
  method: string;
  body: any;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  send: (data: any) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = await req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text field" });
    }

    // Load Google Cloud credentials from environment variable
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!credentialsJson) {
      return res.status(500).json({
        error: "Missing GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable",
      });
    }

    const credentials = JSON.parse(credentialsJson);

    // Initialize Google TTS Client
    const client = new textToSpeech.TextToSpeechClient({
      credentials,
    });

    const request = {
      input: { text },
      voice: {
        languageCode: "en-US",
        name: "en-US-Wavenet-D",
      },
      audioConfig: {
        audioEncoding: "MP3" as const,
      },
    };

    const [response] = (await client.synthesizeSpeech(request)) as any;

    if (!response.audioContent) {
      return res.status(500).json({ error: "Google TTS returned no audio" });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(Buffer.from(response.audioContent, "base64"));
  } catch (err) {
    console.error("TTS Error:", err);
    return res.status(500).json({ error: "TTS synthesis failed", details: err });
  }
}
