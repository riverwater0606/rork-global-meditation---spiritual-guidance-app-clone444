const { put, head, list, del } = require("@vercel/blob");
const { handleCors, json, readJson } = require("../world/_lib");

const normalizeEnv = (value, fallback = "") => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || fallback;
};

const ELEVENLABS_API_KEY = normalizeEnv(process.env.ELEVENLABS_API_KEY);
const ELEVENLABS_BASE_URL = normalizeEnv(
  process.env.ELEVENLABS_BASE_URL,
  "https://api.elevenlabs.io/v1"
).replace(/\/$/, "");
const ELEVENLABS_TTS_MODEL = normalizeEnv(
  process.env.ELEVENLABS_TTS_MODEL,
  "eleven_multilingual_v2"
);
const ELEVENLABS_TTS_VOICE_ID = normalizeEnv(
  process.env.ELEVENLABS_TTS_VOICE_ID,
  "JBFqnCBsd6RMkjVDRZzb"
);
const ELEVENLABS_OUTPUT_FORMAT = normalizeEnv(
  process.env.ELEVENLABS_OUTPUT_FORMAT,
  "mp3_44100_128"
);
const BLOB_READ_WRITE_TOKEN = normalizeEnv(process.env.BLOB_READ_WRITE_TOKEN);
const PREVIEW_TTS_MAX_UTF8_BYTES = 1800;
const FULL_TTS_MAX_UTF8_BYTES = 12000;

function sanitizeSegment(input) {
  return String(input || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
}

function buildBlobPath(params) {
  return `tts-cache/v1/${sanitizeSegment(params.sessionId)}/${params.mode}/${sanitizeSegment(params.cacheKey)}.mp3`;
}

async function findCachedBlob(pathname) {
  if (!BLOB_READ_WRITE_TOKEN) return null;
  try {
    const metadata = await head(pathname, { token: BLOB_READ_WRITE_TOKEN });
    return metadata;
  } catch (error) {
    const name = error && error.constructor ? error.constructor.name : "";
    if (name === "BlobNotFoundError") {
      return null;
    }
    throw error;
  }
}

function buildNarrationInput(text, mode, language) {
  const isZh = String(language || "").startsWith("zh");
  const normalized = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s*/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  const sentenceRegex = isZh ? /[^。！？!?]+[。！？!?]?/gu : /[^.!?]+[.!?]?/g;
  const sentenceSpacer = mode === "full" ? "\n" : " ";

  const pacedParagraphs = paragraphs.map((paragraph) => {
    const sentences = (paragraph.match(sentenceRegex) || [paragraph])
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    return sentences.join(sentenceSpacer);
  });

  return pacedParagraphs.join(mode === "full" ? "\n\n" : "\n").trim();
}

function buildVoiceSettings(mode) {
  if (mode === "full") {
    return {
      stability: 0.52,
      similarity_boost: 0.78,
      style: 0.14,
      use_speaker_boost: true,
    };
  }
  return {
    stability: 0.4,
    similarity_boost: 0.74,
    style: 0.24,
    use_speaker_boost: true,
  };
}

function getLanguageCode(language) {
  return String(language || "").startsWith("zh") ? "zh" : "en";
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method === "DELETE") {
    try {
      const body = await readJson(req);
      const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
      if (!sessionId.trim()) {
        return json(res, 400, { error: "sessionId is required" });
      }
      if (!BLOB_READ_WRITE_TOKEN) {
        return json(res, 200, { ok: true, deleted: 0, skipped: true });
      }

      const prefix = `tts-cache/v1/${sanitizeSegment(sessionId)}/`;
      const listing = await list({
        token: BLOB_READ_WRITE_TOKEN,
        prefix,
        limit: 1000,
      });
      const pathnames = listing.blobs.map((blob) => blob.pathname);
      if (pathnames.length > 0) {
        await del(pathnames, { token: BLOB_READ_WRITE_TOKEN });
      }
      return json(res, 200, { ok: true, deleted: pathnames.length });
    } catch (error) {
      return json(res, 500, {
        error: error instanceof Error ? error.message : "Failed to delete TTS cache",
      });
    }
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  if (!ELEVENLABS_API_KEY) {
    return json(res, 503, {
      error: "ELEVENLABS_API_KEY is missing",
      provider: "elevenlabs",
    });
  }

  try {
    const body = await readJson(req);
    const text = typeof body?.text === "string" ? body.text : "";
    const language = typeof body?.language === "string" ? body.language : "en";
    const cacheKey = typeof body?.cacheKey === "string" ? body.cacheKey : "";
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const mode = body?.mode === "full" ? "full" : "preview";
    const allowGenerate = body?.allowGenerate !== false;
    const responseType = body?.responseType === "binary" ? "binary" : "json";

    if (!text.trim()) {
      return json(res, 400, { error: "text is required" });
    }
    if (!sessionId.trim()) {
      return json(res, 400, { error: "sessionId is required" });
    }

    const utf8Bytes = Buffer.byteLength(text, "utf8");
    const maxUtf8Bytes = mode === "full" ? FULL_TTS_MAX_UTF8_BYTES : PREVIEW_TTS_MAX_UTF8_BYTES;
    if (utf8Bytes > maxUtf8Bytes) {
      return json(res, 400, {
        error: mode === "full" ? "full guidance text is too long for a single TTS request" : "preview text is too long for a single TTS request",
        utf8Bytes,
        maxUtf8Bytes,
      });
    }

    const blobPath = buildBlobPath({
      sessionId,
      mode,
      cacheKey,
    });

    if (BLOB_READ_WRITE_TOKEN) {
      const cachedBlob = await findCachedBlob(blobPath);
      if (cachedBlob?.url) {
        return json(res, 200, {
          provider: "elevenlabs",
          model: ELEVENLABS_TTS_MODEL,
          voice: ELEVENLABS_TTS_VOICE_ID,
          mode,
          mimeType: cachedBlob.contentType || "audio/mpeg",
          cacheKey,
          cached: true,
          audioUrl: cachedBlob.url,
        });
      }
    }

    if (!allowGenerate) {
      return json(res, 429, {
        error:
          mode === "full"
            ? "Today's full guidance generation limit has been reached"
            : "Today's preview generation limit has been reached",
      });
    }

    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${ELEVENLABS_TTS_VOICE_ID}?output_format=${encodeURIComponent(ELEVENLABS_OUTPUT_FORMAT)}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: buildNarrationInput(text, mode, language),
          model_id: ELEVENLABS_TTS_MODEL,
          language_code: getLanguageCode(language),
          voice_settings: buildVoiceSettings(mode),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return json(res, response.status, {
        error: "ElevenLabs TTS request failed",
        detail: errorText.slice(0, 500),
      });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    let uploadedBlob = null;
    if (BLOB_READ_WRITE_TOKEN) {
      uploadedBlob = await put(blobPath, audioBuffer, {
        access: "public",
        addRandomSuffix: false,
        contentType: "audio/mpeg",
        token: BLOB_READ_WRITE_TOKEN,
      });
    }

    if (responseType === "binary") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-PSIG-TTS-Mode", mode);
      if (cacheKey) {
        res.setHeader("X-PSIG-TTS-Cache-Key", cacheKey);
      }
      res.end(audioBuffer);
      return;
    }
    return json(res, 200, {
      provider: "elevenlabs",
      model: ELEVENLABS_TTS_MODEL,
      voice: ELEVENLABS_TTS_VOICE_ID,
      mode,
      mimeType: "audio/mpeg",
      cacheKey,
      cached: false,
      audioUrl: uploadedBlob?.url,
      audioBase64: audioBuffer.toString("base64"),
    });
  } catch (error) {
    return json(res, 500, {
      error: error instanceof Error ? error.message : "Failed to generate speech",
      provider: "elevenlabs",
    });
  }
};
