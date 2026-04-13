import type { Language } from "@/providers/SettingsProvider";

export const AI_MEDITATION_CONTENT_VERSION = 1;

export const MEDITATION_PREVIEW_LIMITS: Record<Language, { target: number; max: number }> = {
  zh: { target: 88, max: 116 },
  en: { target: 140, max: 190 },
  es: { target: 140, max: 190 },
};

export interface StructuredAiMeditationDraft {
  title: string;
  duration: number;
  openingPreview: string;
  previewText: string;
  script: string;
  contentVersion: number;
  qualityFlags: string[];
}

const MEDITATION_LABELS = {
  title: ["Title", "標題", "Título"],
  duration: ["Duration", "時長", "Duración"],
  openingPreview: ["Opening Preview", "開場預覽", "OpeningPreview", "Vista previa inicial", "Vista previa"],
  script: ["Script", "腳本", "Guion"],
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSectionRegex = (labels: string[], options?: { until?: string[] }) => {
  const labelPattern = labels.map(escapeRegex).join("|");
  const untilPattern = options?.until?.map(escapeRegex).join("|");
  return new RegExp(
    untilPattern
      ? `(?:^|\\n)(?:[*#\\s]*)(?:${labelPattern})(?:[*#\\s]*)\\s*[:：]\\s*([\\s\\S]*?)(?=\\n(?:[*#\\s]*)(?:${untilPattern})(?:[*#\\s]*)\\s*[:：]|$)`
      : `(?:^|\\n)(?:[*#\\s]*)(?:${labelPattern})(?:[*#\\s]*)\\s*[:：]\\s*([\\s\\S]+)`,
    "i"
  );
};

const TITLE_REGEX = buildSectionRegex(MEDITATION_LABELS.title);
const DURATION_REGEX = new RegExp(
  `(?:^|\\n)(?:[*#\\s]*)(?:${MEDITATION_LABELS.duration.map(escapeRegex).join("|")})(?:[*#\\s]*)\\s*[:：]\\s*(\\d+)`,
  "i"
);
const OPENING_PREVIEW_REGEX = buildSectionRegex(MEDITATION_LABELS.openingPreview, {
  until: MEDITATION_LABELS.script,
});
const SCRIPT_REGEX = buildSectionRegex(MEDITATION_LABELS.script);

const stripLeadingLabelLine = (text: string, labels: string[]) => {
  const regex = new RegExp(
    `^\\s*(?:[*#\\s]*)(?:${labels.map(escapeRegex).join("|")})(?:[*#\\s]*)\\s*[:：]\\s*`,
    "i"
  );
  return text.replace(regex, "").trim();
};

const getFallbackMeditationTitle = (language: Language) => {
  if (language === "zh") return "專屬冥想";
  if (language === "es") return "Meditación personal";
  return "Personal Meditation";
};

const getSentenceRegex = (language: Language) =>
  language === "zh" ? /[^。！？!?]+[。！？!?]?/gu : /[^.!?]+[.!?]?/g;

export function stripMeditationFormatting(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, "")
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
}

export function clampMeditationDuration(rawDuration: number) {
  if (!Number.isFinite(rawDuration)) return 10;
  return Math.min(20, Math.max(3, Math.round(rawDuration)));
}

export function buildOpeningPreviewFromScript(script: string, language: Language) {
  const cleaned = stripMeditationFormatting(script);
  if (!cleaned) return "";

  const sentences = (cleaned.match(getSentenceRegex(language)) || [cleaned])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const { target, max } = MEDITATION_PREVIEW_LIMITS[language];

  let preview = "";
  for (const sentence of sentences) {
    const candidate = preview ? `${preview} ${sentence}` : sentence;
    if (candidate.length > max) break;
    preview = candidate;
    if (preview.length >= target) break;
  }

  return (preview || cleaned.slice(0, max)).trim();
}

export function sanitizeMeditationScript(script: string, language: Language) {
  const cleaned = stripMeditationFormatting(script);
  if (!cleaned) return "";

  const rawParagraphs = cleaned
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  const sentenceRegex = getSentenceRegex(language);
  const paragraphs = rawParagraphs.map((paragraph) => {
    const sentences = (paragraph.match(sentenceRegex) || [paragraph])
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    return sentences.join("\n");
  });

  return paragraphs.join("\n\n").trim();
}

export function sanitizeOpeningPreview(preview: string | undefined, script: string, language: Language) {
  const fallback = buildOpeningPreviewFromScript(script, language);
  const cleaned = stripMeditationFormatting(preview || fallback);
  if (!cleaned) return fallback;

  const { max } = MEDITATION_PREVIEW_LIMITS[language];
  const sentences = (cleaned.match(getSentenceRegex(language)) || [cleaned])
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  let result = "";
  for (const sentence of sentences) {
    const candidate = result ? `${result} ${sentence}` : sentence;
    if (candidate.length > max) break;
    result = candidate;
  }

  return (result || fallback).trim();
}

export function buildMeditationPreviewText(
  script: string,
  explicitPreview: string | undefined,
  language: Language
) {
  return sanitizeOpeningPreview(explicitPreview, script, language);
}

const buildFallbackScriptFromLabeledText = (rawText: string) => {
  const lines = rawText.split("\n");
  const shouldDropLine = (line: string) => {
    const normalized = line.trim();
    if (!normalized) return false;
    return [MEDITATION_LABELS.title, MEDITATION_LABELS.duration, MEDITATION_LABELS.openingPreview].some((labels) =>
      labels.some((label) => new RegExp(`^(?:[*#\\s]*)${escapeRegex(label)}(?:[*#\\s]*)\\s*[:：]`, "i").test(normalized))
    );
  };

  return lines.filter((line) => !shouldDropLine(line)).join("\n").trim();
};

export function parseGeneratedMeditation(rawText: string, language: Language): StructuredAiMeditationDraft {
  const qualityFlags: string[] = [];
  const meditationText = rawText.trim();

  const titleMatch = meditationText.match(TITLE_REGEX);
  const durationMatch = meditationText.match(DURATION_REGEX);
  const openingPreviewMatch = meditationText.match(OPENING_PREVIEW_REGEX);
  const scriptMatch = meditationText.match(SCRIPT_REGEX);

  const title = stripLeadingLabelLine(titleMatch?.[1]?.trim() || "", MEDITATION_LABELS.title) || getFallbackMeditationTitle(language);
  if (!titleMatch) {
    qualityFlags.push("fallback:title");
  }

  const duration = clampMeditationDuration(durationMatch ? parseInt(durationMatch[1], 10) : 10);
  if (!durationMatch) {
    qualityFlags.push("fallback:duration");
  }

  let script = scriptMatch ? stripLeadingLabelLine(scriptMatch[1].trim(), MEDITATION_LABELS.script) : meditationText;
  if (!scriptMatch) {
    qualityFlags.push("fallback:script");
  }

  if (!scriptMatch && (titleMatch || durationMatch || openingPreviewMatch)) {
    const fallbackScript = buildFallbackScriptFromLabeledText(meditationText);
    if (fallbackScript) {
      script = fallbackScript;
      qualityFlags.push("repaired:labeled-body");
    }
  }

  script = sanitizeMeditationScript(script, language);
  if (!script) {
    throw new Error(language === "zh" ? "AI 生成的導引內容太短，請重試。" : language === "es" ? "El guion generado es demasiado corto. Inténtalo de nuevo." : "The generated meditation script is too short. Please try again.");
  }

  const openingPreview = sanitizeOpeningPreview(openingPreviewMatch?.[1]?.trim(), script, language);
  if (!openingPreviewMatch) {
    qualityFlags.push("fallback:opening-preview");
  }

  const previewText = buildMeditationPreviewText(script, openingPreview, language);
  const minScriptLength = language === "zh" ? 60 : 120;
  if (script.length < minScriptLength) {
    throw new Error(language === "zh" ? "AI 生成的導引內容太短，請重試。" : language === "es" ? "El guion generado es demasiado corto. Inténtalo de nuevo." : "The generated meditation script is too short. Please try again.");
  }
  if (!previewText) {
    throw new Error(language === "zh" ? "未能產生有效的開場預覽，請重試。" : language === "es" ? "No se pudo crear una vista previa inicial válida. Inténtalo de nuevo." : "Could not build a valid opening preview. Please try again.");
  }

  return {
    title,
    duration,
    openingPreview,
    previewText,
    script,
    contentVersion: AI_MEDITATION_CONTENT_VERSION,
    qualityFlags,
  };
}
