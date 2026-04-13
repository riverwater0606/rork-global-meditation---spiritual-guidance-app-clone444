import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send, Bot, User, Sparkles, Lock, Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSettings, type Language } from "@/providers/SettingsProvider";
import { useMeditation } from "@/providers/MeditationProvider";
import { router } from "expo-router";
import {
  MEDITATION_PREVIEW_LIMITS,
  parseGeneratedMeditation,
} from "@/lib/aiMeditation";
import {
  AI_GUIDANCE_TOP_UP_AMOUNT_BUNDLE,
  AI_GUIDANCE_TOP_UP_AMOUNT_SINGLE,
  AI_GUIDANCE_TOP_UP_COST_BUNDLE,
  AI_GUIDANCE_TOP_UP_COST_SINGLE,
  FREE_DAILY_AI_GUIDANCE_LIMIT,
  VIP_DAILY_AI_GUIDANCE_LIMIT,
} from "@/constants/ai";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  action?: {
    label: string;
    pathname: string;
  };
}

type AiModeId = "guidance" | "course" | "integration" | "blessing" | "inquiry" | "guide";
type AppGuideIntent = "send-blessing" | "latest-ai" | "library" | "progress" | "garden" | "app-guide";

interface AiModeConfig {
  id: AiModeId;
  title: string;
  body: string;
  prompt: string;
}

interface InquiryPreset {
  id: string;
  title: string;
  prompt: string;
}

interface BlessingPreset {
  id: string;
  title: string;
  prompt: string;
}

type InquiryPresetId = "symbols" | "life-theme" | "chakra" | "awakening";
type BlessingPresetId = "gentle" | "encouraging" | "healing" | "celebration";

interface SpiritualLens {
  id: string;
  title: string;
  body: string;
}

interface InsightSection {
  key: string;
  title: string;
  body: string;
}

function buildSpiritualLenses({
  language,
  stats,
  currentOrb,
  missionStats,
  lastMeditationContext,
}: {
  language: Language;
  stats: {
    totalSessions: number;
    totalMinutes: number;
    currentStreak: number;
  };
  currentOrb: {
    level: number;
    isAwakened: boolean;
    shape?: string;
  };
  missionStats: {
    blessingsSent: number;
    customMeditationsCreated: number;
    customMeditationsCompleted: number;
    uniqueCategories: string[];
  };
  lastMeditationContext?: {
    courseName: string;
    duration: number;
    completedAt: string;
    category: string | null;
    isCustomSession: boolean;
  } | null;
}): SpiritualLens[] {
  const lenses: SpiritualLens[] = [];

  if (!currentOrb.isAwakened) {
    lenses.push(
      language === "zh"
        ? {
            id: "becoming",
            title: "成長中的核心",
            body: `你仍在第 ${currentOrb.level} 層旅程中，較適合探討正在形成中的課題，而不是只談完成。`,
          }
        : language === "es"
          ? {
              id: "becoming",
              title: "Núcleo en formación",
              body: `Sigues en la capa ${currentOrb.level}, así que esta exploración se enfoca más en el proceso de formarte que en una llegada final.`,
            }
          : {
              id: "becoming",
              title: "Core in formation",
              body: `You are still in layer ${currentOrb.level}, so inquiry should focus on becoming, not only arrival.`,
            }
    );
  } else {
    lenses.push(
      language === "zh"
        ? {
            id: "integration",
            title: "覺醒後整合",
            body: "你已覺醒，現在更適合探討整合、承載、穩定與新的責任感。",
          }
        : language === "es"
          ? {
              id: "integration",
              title: "Integración tras el despertar",
              body: "Tu esfera ya despertó, así que la exploración puede inclinarse hacia integración, estabilidad y encarnación.",
            }
          : {
              id: "integration",
              title: "Post-awakening integration",
              body: "Your orb is awakened, so inquiry should lean toward integration, steadiness, and embodiment.",
            }
    );
  }

  if (missionStats.blessingsSent > 0) {
    lenses.push(
      language === "zh"
        ? {
            id: "blessing",
            title: "分享與流動",
            body: `你已送出 ${missionStats.blessingsSent} 次祝福，可多看關係、流動、給予與回應。`,
          }
        : language === "es"
          ? {
              id: "blessing",
              title: "Flujo y ofrenda",
              body: `Ya has enviado ${missionStats.blessingsSent} bendiciones, así que aquí importan la relación, la reciprocidad y la expresión.`,
            }
          : {
              id: "blessing",
              title: "Flow and offering",
              body: `You have sent ${missionStats.blessingsSent} blessings, so relationship, reciprocity, and expression matter here.`,
            }
    );
  }

  if (lastMeditationContext?.category) {
    lenses.push(
      language === "zh"
        ? {
            id: "recent-practice",
            title: "最近練習餘波",
            body: `你最近完成的是「${lastMeditationContext.courseName}」，可優先從這節練習留下的主題切入。`,
          }
        : language === "es"
          ? {
              id: "recent-practice",
              title: "Eco de la práctica reciente",
              body: `Tu sesión completada más reciente fue "${lastMeditationContext.courseName}", así que la exploración puede empezar desde su resonancia.`,
            }
          : {
              id: "recent-practice",
              title: "Echo of recent practice",
              body: `Your most recent completed session was "${lastMeditationContext.courseName}", so inquiry can begin from its aftereffect.`,
            }
    );
  }

  if (missionStats.uniqueCategories.length >= 4 || stats.totalMinutes >= 60) {
    lenses.push(
      language === "zh"
        ? {
            id: "breadth",
            title: "主題擴展期",
            body: "你已開始接觸較多主題，適合探討模式之間的連結，而不只是單一情緒。",
          }
        : language === "es"
          ? {
              id: "breadth",
              title: "Fase de expansión",
              body: "Ya exploraste suficiente amplitud como para conectar patrones entre temas, no solo una emoción aislada.",
            }
          : {
              id: "breadth",
              title: "Expansion phase",
              body: "You have explored enough range that inquiry can connect patterns across themes, not just one feeling.",
            }
    );
  }

  return lenses.slice(0, 3);
}

function buildSpiritualLensSummary(language: Language, lenses: SpiritualLens[]) {
  if (lenses.length === 0) return "";
  const prefix =
    language === "zh"
      ? "目前最 relevant 的靈性閱讀角度："
      : "Most relevant spiritual reading angles right now:";
  return [prefix, ...lenses.map((lens) => `- ${lens.title}: ${lens.body}`)].join("\n");
}

function getInquiryPresetSystemPrompt(language: Language, presetId: InquiryPresetId | null) {
  if (!presetId) return "";

  const prompts = {
    en: {
      symbols: `If the user chose symbol reading:
- Focus on recurring symbols, sacred geometry, numbers, dreams, and archetypal images.
- Explain symbolic resonance first, not superstition.
- Show what the symbol may mirror psychologically or spiritually.`,
      "life-theme": `If the user chose life theme:
- Focus on repeated emotional, relational, or behavioral patterns.
- Help name the lesson, attachment, fear, or maturation path underneath.
- Be honest but compassionate.`,
      chakra: `If the user chose chakra reading:
- Focus on likely energetic imbalance in a grounded and non-medical way.
- Connect it to safety, trust, boundaries, expression, love, intuition, or integration.
- Keep it interpretable, not diagnostic.`,
      awakening: `If the user chose awakening integration:
- Focus on transition, identity shifts, sensitivity, grief, expansion, embodiment, and steadiness.
- Help distinguish genuine integration from overwhelm.
- Emphasize grounding and coherence over dramatic mysticism.
- Keep the three-section response frame intact.`,
    },
    zh: {
      symbols: `如果用戶選的是象徵解讀：
- 請聚焦反覆出現的象徵、神聖幾何、數字、夢境感與原型圖像。
- 先解釋象徵共鳴，不要落入迷信口吻。
- 幫用戶看見它可能映照的心理或靈性主題。
- 保持三段式回答框架。`,
      "life-theme": `如果用戶選的是人生課題：
- 請聚焦反覆出現的情緒、人際或行為模式。
- 幫助用戶辨認其背後的課題、執著、恐懼或成熟邀請。
- 要誠實，但保持溫柔。
- 保持三段式回答框架。`,
      chakra: `如果用戶選的是脈輪解讀：
- 請用 grounded、非醫療診斷式的語氣解讀可能的能量失衡。
- 可連結到安全感、信任、界線、表達、愛、直覺與整合。
- 要可理解，不要神神化化。
- 保持三段式回答框架。`,
      awakening: `如果用戶選的是覺醒整合：
- 請聚焦轉化期、身份鬆動、敏感提升、悲傷、擴張、承載與落地。
- 幫助用戶分辨這是整合中的震動、過載，還是更深的重組。
- 強調穩定與整合，而不是誇大神秘感。
- 保持三段式回答框架。`,
    },
    es: {
      symbols: `Si el usuario eligió lectura simbólica:
- Enfócate en símbolos recurrentes, geometría sagrada, números, imágenes oníricas y arquetipos.
- Explica primero la resonancia simbólica, no desde la superstición.
- Ayuda a ver qué puede reflejar a nivel psicológico o espiritual.
- Mantén la estructura de respuesta en tres partes.`,
      "life-theme": `Si el usuario eligió tema de vida:
- Enfócate en patrones repetidos emocionales, relacionales o de comportamiento.
- Ayuda a nombrar la lección, el apego, el miedo o la maduración que hay debajo.
- Sé honesto pero compasivo.
- Mantén la estructura de respuesta en tres partes.`,
      chakra: `Si el usuario eligió lectura de chakras:
- Interpreta posibles desequilibrios energéticos de forma aterrizada y no médica.
- Puedes conectarlo con seguridad, confianza, límites, expresión, amor, intuición e integración.
- Hazlo comprensible, no exageradamente místico.
- Mantén la estructura de respuesta en tres partes.`,
      awakening: `Si el usuario eligió integración del despertar:
- Enfócate en transición, aflojamiento de identidad, sensibilidad, duelo, expansión, integración y encarnación.
- Ayuda a distinguir entre una vibración de integración, una sobrecarga o una reorganización más profunda.
- Prioriza estabilidad e integración por encima del dramatismo místico.
- Mantén la estructura de respuesta en tres partes.`,
    },
  };

  return (prompts[language] ?? prompts.en)[presetId];
}

function detectAppGuideIntent(text: string, language: Language): AppGuideIntent | null {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;

  const matchers =
    language === "zh"
      ? [
          { intent: "app-guide" as const, pattern: /(這個app|呢個app|這app|psi-g).*(怎麼用|點用|如何使用|點玩|怎樣玩)|((如何|怎樣|點樣).*(使用|玩).*(這個app|呢個app|psi-g))/ },
          { intent: "send-blessing" as const, pattern: /(如何|點樣|怎樣|教我|想知).*(傳送|送出|送).*?(光球|祝福)|((傳送|送出).*(光球|祝福))/ },
          { intent: "latest-ai" as const, pattern: /(最新.*ai.*課程|最新.*專屬冥想|打開.*ai.*課程|完成.*ai.*課程)/ },
          { intent: "library" as const, pattern: /(冥想館|圖書館|library)/ },
          { intent: "progress" as const, pattern: /(進度|任務|解鎖|mission)/ },
          { intent: "garden" as const, pattern: /(花園|garden|光球收藏|受到祝福|已送出祝福)/ },
        ]
      : [
          { intent: "app-guide" as const, pattern: /(how.*use.*psi-g|how.*this app works|how.*use.*this app|what does this app do)/ },
          { intent: "send-blessing" as const, pattern: /(how|where).*(send|gift).*(orb|blessing)|send.*(orb|blessing)/ },
          { intent: "latest-ai" as const, pattern: /(latest ai session|open ai session|finish ai session|latest personalized meditation)/ },
          { intent: "library" as const, pattern: /(library|meditation library|open library)/ },
          { intent: "progress" as const, pattern: /(progress|missions|unlocks|journey)/ },
          { intent: "garden" as const, pattern: /(garden|blessing history|received blessings|my orbs)/ },
        ];

  const hit = matchers.find((matcher) => matcher.pattern.test(normalized));
  return hit?.intent ?? null;
}

function buildAppGuideInstruction(language: Language, intent: AppGuideIntent | null) {
  if (!intent) return "";

  const instructions = {
    en: {
      "send-blessing": `The user is asking how to send an orb or blessing inside PSI-G. You must answer with exact app steps:
1. Open the Garden tab
2. Open the blessing / gifting modal
3. Enter the friend's @username (or Contacts Beta if available)
4. Write the blessing
5. Send it
Also mention that @username is the reliable main path right now. Do not explain generic energy visualization unless the user explicitly asks for symbolism.`,
      "latest-ai": `The user wants the latest AI session flow. Answer with actual in-app steps and mention whether the next step is AI Assistant or Meditation Library.`,
      library: `The user is asking about the meditation library. Answer with PSI-G in-app navigation and the most relevant next tap.`,
      progress: `The user is asking about progress or missions. Answer with PSI-G in-app navigation and explain what page to open and why.`,
      garden: `The user is asking about Garden. Answer with PSI-G in-app navigation and what each section is for. Prefer practical app guidance over abstract spirituality.`,
      "app-guide": `The user is asking how PSI-G works overall. Explain the app as a guided journey: Home -> Meditate -> Garden -> Progress -> AI Assistant -> Profile. Be concrete, concise, and onboarding-friendly.`,
    },
    zh: {
      "send-blessing": `用戶是在問 PSI-G app 內怎樣傳送光球／祝福。你必須用 app 真正步驟回答：
1. 進入光球花園
2. 打開送祝福 / gifting 視窗
3. 輸入對方 @username（或使用 Contacts Beta）
4. 寫下祝福
5. 按傳送
另外請清楚提到：目前最可靠的主路徑是 @username。除非用戶明確問象徵意義，否則不要講抽象能量觀想。`,
      "latest-ai": `用戶是在問最新 AI 課程怎樣繼續。請用 app 內實際路徑回答，並講清楚下一步是去 AI 助手還是去冥想館。`,
      library: `用戶是在問冥想館 / 圖書館。請用 PSI-G app 內實際路徑回答，並講清楚下一個最 relevant 的按鈕。`,
      progress: `用戶是在問進度 / 任務 / 解鎖。請用 PSI-G app 內實際路徑回答，並說明為什麼要去那一頁。`,
      garden: `用戶是在問花園功能。請用 PSI-G app 內實際路徑回答，並解釋各個區塊是做什麼，不要只講抽象靈性。`,
      "app-guide": `用戶是在問 PSI-G 整個 app 怎樣使用。請用 onboarding 導遊方式，按 Home -> 冥想館 -> 花園 -> 進度 -> AI 助手 -> 個人資料 的順序，簡潔又具體地帶他理解。`,
    },
  };

  return instructions[language][intent];
}

function buildMessageAction(
  language: Language,
  intent: AppGuideIntent | null,
  latestCustomMeditation?: { id: string } | null
) {
  if (!intent) return null;

  switch (intent) {
    case "send-blessing":
      return {
        label: language === "zh" ? "打開花園送祝福" : language === "es" ? "Abrir jardín para enviar" : "Open Garden to Send",
        pathname: "/(tabs)/garden",
      };
    case "latest-ai":
      return latestCustomMeditation
        ? {
            label: language === "zh" ? "打開最新 AI 課程" : language === "es" ? "Abrir la última sesión AI" : "Open Latest AI Session",
            pathname: `/meditation/${latestCustomMeditation.id}`,
          }
        : {
            label: language === "zh" ? "去 AI 助手" : language === "es" ? "Ir al asistente AI" : "Go to AI Assistant",
            pathname: "/(tabs)/assistant",
          };
    case "library":
      return {
        label: language === "zh" ? "打開冥想館" : language === "es" ? "Abrir biblioteca" : "Open Library",
        pathname: "/(tabs)/meditate",
      };
    case "progress":
      return {
        label: language === "zh" ? "查看進度任務" : language === "es" ? "Abrir progreso" : "Open Progress",
        pathname: "/(tabs)/progress",
      };
    case "garden":
      return {
        label: language === "zh" ? "打開光球花園" : language === "es" ? "Abrir jardín" : "Open Garden",
        pathname: "/(tabs)/garden",
      };
    case "app-guide":
      return {
        label: language === "zh" ? "回到首頁開始" : language === "es" ? "Volver al inicio" : "Go to Home",
        pathname: "/(tabs)",
      };
    default:
      return null;
  }
}

function buildModeAction(
  language: Language,
  modeId: AiModeId | null,
  currentOrb: { isAwakened: boolean },
  latestCustomMeditation?: { id: string } | null
) {
  if (!modeId) return null;

  switch (modeId) {
    case "guidance":
      return currentOrb.isAwakened
        ? {
            label: language === "zh" ? "去花園推進今天旅程" : language === "es" ? "Ir al jardín de hoy" : "Go to Garden for Today",
            pathname: "/(tabs)/garden",
          }
        : {
            label: language === "zh" ? "去冥想開始今天練習" : language === "es" ? "Empezar la meditación de hoy" : "Start Today's Meditation",
            pathname: "/(tabs)/meditate",
          };
    case "integration":
      return {
        label: language === "zh" ? "去進度頁看看推進" : language === "es" ? "Abrir progreso" : "Open Progress",
        pathname: "/(tabs)/progress",
      };
    case "course":
      return latestCustomMeditation
        ? {
            label: language === "zh" ? "打開最新 AI 課程" : language === "es" ? "Abrir la última sesión AI" : "Open Latest AI Session",
            pathname: `/meditation/${latestCustomMeditation.id}`,
          }
        : {
            label: language === "zh" ? "去冥想館" : language === "es" ? "Abrir biblioteca" : "Open Library",
            pathname: "/(tabs)/meditate",
          };
    case "blessing":
      return {
        label: language === "zh" ? "去花園送祝福" : language === "es" ? "Abrir jardín para bendecir" : "Open Garden to Bless",
        pathname: "/(tabs)/garden",
      };
    case "guide":
      return {
        label: language === "zh" ? "從首頁開始" : language === "es" ? "Empezar desde inicio" : "Start from Home",
        pathname: "/(tabs)",
      };
    default:
      return null;
  }
}

function parseInsightSections(text: string, language: Language): InsightSection[] {
  const sectionPatterns =
    language === "zh"
      ? [
          { key: "notice", title: "我看到什麼", matchers: ["我看到什麼", "我看見什麼"] },
          { key: "meaning", title: "這可能代表什麼", matchers: ["這可能代表什麼", "這代表什麼", "可能的意義"] },
          { key: "observe", title: "你現在可以如何溫柔覺察", matchers: ["你現在可以如何溫柔覺察", "你現在可以如何覺察", "下一步可如何覺察"] },
        ]
      : [
          { key: "notice", title: "What I notice", matchers: ["What I notice"] },
          { key: "meaning", title: "What it may mean", matchers: ["What it may mean", "What this may mean"] },
          { key: "observe", title: "What to gently observe next", matchers: ["What to gently observe next", "What to observe next"] },
        ];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sectionIndices = sectionPatterns
    .map((pattern) => {
      const index = lines.findIndex((line) =>
        pattern.matchers.some((matcher) => line.includes(matcher))
      );
      return index >= 0 ? { pattern, index } : null;
    })
    .filter(Boolean) as Array<{ pattern: (typeof sectionPatterns)[number]; index: number }>;

  if (sectionIndices.length < 2) return [];

  sectionIndices.sort((a, b) => a.index - b.index);

  return sectionIndices.map((current, idx) => {
    const nextIndex = sectionIndices[idx + 1]?.index ?? lines.length;
    const body = lines
      .slice(current.index + 1, nextIndex)
      .join("\n")
      .trim();
    return {
      key: current.pattern.key,
      title: current.pattern.title,
      body,
    };
  }).filter((section) => section.body.length > 0);
}

function buildAppContextSummary({
  language,
  stats,
  currentOrb,
  missionStats,
  latestCustomMeditation,
  lastMeditationContext,
}: {
  language: Language;
  stats: {
    totalSessions: number;
    totalMinutes: number;
    currentStreak: number;
  };
  currentOrb: {
    level: number;
    isAwakened: boolean;
    shape?: string;
  };
  missionStats: {
    blessingsSent: number;
    customMeditationsCreated: number;
    customMeditationsCompleted: number;
    uniqueCategories: string[];
  };
  latestCustomMeditation?: {
    title: string;
    duration: number;
    createdAt: string;
  } | null;
  lastMeditationContext?: {
    courseName: string;
    duration: number;
    completedAt: string;
    category: string | null;
    isCustomSession: boolean;
  } | null;
}) {
  if (language === "zh") {
    return [
      "這是 PSI-G app 內的真實用戶狀態。請優先依這些資料回答，不要假設額外記憶。",
      `目前連續天數：${stats.currentStreak} 天`,
      `總冥想次數：${stats.totalSessions} 次`,
      `總冥想分鐘：${stats.totalMinutes} 分鐘`,
      `主光球：${currentOrb.isAwakened ? "已覺醒" : `第 ${currentOrb.level} 層`}，形態：${currentOrb.shape || "default"}`,
      `已送出祝福：${missionStats.blessingsSent} 次`,
      `已生成 AI 課程：${missionStats.customMeditationsCreated} 次`,
      `已完成 AI 課程：${missionStats.customMeditationsCompleted} 次`,
      `已探索主題：${missionStats.uniqueCategories.length} 類`,
      latestCustomMeditation
        ? `最新 AI 課程：${latestCustomMeditation.title}（${latestCustomMeditation.duration} 分鐘）`
        : "最新 AI 課程：暫無",
      lastMeditationContext
        ? `最近一次完成的冥想：${lastMeditationContext.courseName}（${lastMeditationContext.duration} 分鐘，分類：${lastMeditationContext.category || "unknown"}，完成時間：${lastMeditationContext.completedAt}）`
        : "最近一次完成的冥想：app 暫未有資料",
      "如果用戶問 app 功能怎樣做，請用 app 內實際路徑回答，而不是抽象靈性解釋。",
      "例如傳送光球，應回答：進入光球花園 -> 打開送祝福視窗 -> 輸入對方 @username 或使用聯絡人 Beta -> 寫祝福 -> 傳送。",
      "如果 app 沒有某個真實資料，請清楚講『我現在未知道』，然後再給最合理下一步。",
    ].join("\n");
  }

  if (language === "es") {
    return [
      "Este es el estado real del usuario dentro de PSI-G. Úsalo como base y no inventes memoria adicional.",
      `Racha actual: ${stats.currentStreak} días`,
      `Sesiones totales: ${stats.totalSessions}`,
      `Minutos totales: ${stats.totalMinutes}`,
      `Esfera principal: ${currentOrb.isAwakened ? "despierta" : `nivel ${currentOrb.level}`}, forma: ${currentOrb.shape || "default"}`,
      `Bendiciones enviadas: ${missionStats.blessingsSent}`,
      `Sesiones AI creadas: ${missionStats.customMeditationsCreated}`,
      `Sesiones AI completadas: ${missionStats.customMeditationsCompleted}`,
      `Categorías exploradas: ${missionStats.uniqueCategories.length}`,
      latestCustomMeditation
        ? `Última sesión AI: ${latestCustomMeditation.title} (${latestCustomMeditation.duration} min)`
        : "Última sesión AI: ninguna",
      lastMeditationContext
        ? `Meditación más reciente completada: ${lastMeditationContext.courseName} (${lastMeditationContext.duration} min, categoría: ${lastMeditationContext.category || "unknown"}, completada en: ${lastMeditationContext.completedAt})`
        : "Meditación más reciente completada: la app aún no tiene registro",
      "Si el usuario pregunta cómo usar una función, responde con pasos reales dentro de la app, no con espiritualidad abstracta.",
      "Por ejemplo, para enviar una esfera: abre Jardín -> abre la ventana de bendición -> introduce el @username del amigo o usa Contacts Beta -> escribe la bendición -> envía.",
      "Si la app aún no sabe un dato concreto, dilo claramente antes de sugerir el mejor siguiente paso.",
    ].join("\n");
  }

  return [
    "This is real PSI-G in-app user state. Use it as ground truth and do not invent memory beyond it.",
    `Current streak: ${stats.currentStreak} days`,
    `Total sessions: ${stats.totalSessions}`,
    `Total minutes: ${stats.totalMinutes}`,
    `Main orb: ${currentOrb.isAwakened ? "awakened" : `level ${currentOrb.level}`}, shape: ${currentOrb.shape || "default"}`,
    `Blessings sent: ${missionStats.blessingsSent}`,
    `AI sessions created: ${missionStats.customMeditationsCreated}`,
    `AI sessions completed: ${missionStats.customMeditationsCompleted}`,
    `Explored categories: ${missionStats.uniqueCategories.length}`,
    latestCustomMeditation
      ? `Latest AI session: ${latestCustomMeditation.title} (${latestCustomMeditation.duration} min)`
      : "Latest AI session: none",
    lastMeditationContext
      ? `Most recently completed meditation: ${lastMeditationContext.courseName} (${lastMeditationContext.duration} min, category: ${lastMeditationContext.category || "unknown"}, completed at: ${lastMeditationContext.completedAt})`
      : "Most recently completed meditation: app has no stored record yet",
    "When the user asks about app features, answer with actual in-app steps instead of abstract spirituality.",
    "For example, to send an orb: open Garden -> open the blessing modal -> enter a friend's @username or use Contacts Beta -> write the blessing -> send.",
    "If the app does not know a specific fact yet, say that clearly before giving the best next step.",
  ].join("\n");
}

function buildAppFeatureGuideSummary(language: Language) {
  if (language === "zh") {
    return [
      "以下是 PSI-G app 目前主要功能地圖。回答 how-to 問題時，優先以這些真實頁面與用途作導航：",
      "1. 首頁 / Home：看今天下一步、主光球狀態、Resonance 與 AI 靈感狀態。",
      "2. 冥想 / Meditate：進入冥想館，選主題、打開 AI 課程、開始冥想、完成一節練習。",
      "3. 光球花園 / Garden：看主光球、打開送祝福視窗、輸入 @username 送出祝福、查看已送出祝福、受到祝福、你的光球收藏、改變形態與 preview。",
      "4. 進度 / Progress：看主光球養成、祝福與花園、AI 冥想課程三條路線，以及今天最相關任務與解鎖進度。",
      "5. AI 助手 / AI Assistant：拿今日 AI 指引、生成專屬冥想課程、做冥想後整合、生成祝福、做靈性探問。",
      "6. 個人資料 / Profile：看 VIP 狀態、Resonance balance、最近收入 / 消耗、同步狀態、測試工具。",
      "7. 設定 / Settings：語言、通知、主題、私隱。",
      "重要功能規則：",
      "- 傳送祝福目前最可靠的主路徑是輸入對方 @username。",
      "- 受到祝福的光球只供觀賞 / preview，不能拿來冥想，也不能解任務。",
      "- AI 生成與 AI 對話有每日靈感配額；免費較少，VIP 較多，也可用 Resonance 補充。",
      "- Resonance 可用於祝福加持、光場、全環境音通行，以及 AI 配額補充。",
      "如果用戶問『這 app 怎麼用』，請按以上頁面順序帶他理解，而不是只講單一功能。",
    ].join("\n");
  }

  if (language === "es") {
    return [
      "Este es el mapa principal de funciones actuales de PSI-G. Para preguntas de uso, guía al usuario con estas pantallas reales:",
      "1. Inicio / Home: siguiente paso de hoy, estado de la esfera principal, Resonance y estado de inspiración AI.",
      "2. Meditar / Meditate: entrar en la biblioteca, elegir temas, abrir sesiones AI, empezar y completar una meditación.",
      "3. Jardín / Garden: ver la esfera principal, abrir la ventana de bendición, enviar bendiciones por @username, revisar bendiciones enviadas, recibidas, colección de esferas, formas y previsualizaciones.",
      "4. Progreso / Progress: ver las tres rutas principales, las misiones más relevantes de hoy y el avance de desbloqueos.",
      "5. Asistente AI / AI Assistant: recibir guía diaria AI, generar una meditación personalizada, integrar después de meditar, escribir bendiciones y hacer exploración espiritual.",
      "6. Perfil / Profile: estado VIP, saldo de Resonance, ingresos y gastos recientes, salud de sincronización y herramientas de prueba.",
      "7. Ajustes / Settings: idioma, notificaciones, tema y privacidad.",
      "Reglas funcionales importantes:",
      "- La forma más fiable de enviar una bendición ahora mismo es escribiendo el @username del amigo.",
      "- Las esferas de bendición recibidas son solo de vista: se pueden previsualizar, pero no usar para meditar ni desbloquear misiones.",
      "- La generación y el chat AI usan créditos diarios; gratis tiene menos, VIP tiene más, y Resonance puede recargarlos.",
      "- Resonance sirve actualmente para potenciar bendiciones, campo de luz, pase ambiental y recargas AI.",
      "Si el usuario pregunta cómo funciona toda la app, guíalo por estas pantallas en orden en vez de describir una sola función.",
    ].join("\n");
  }

  return [
    "This is the current PSI-G feature map. For how-to questions, prefer guiding the user through these real pages and purposes:",
    "1. Home: today's next step, main orb status, Resonance, and AI guidance status.",
    "2. Meditate: open the meditation library, choose themes, open AI sessions, start and complete meditation.",
    "3. Garden: view the main orb, open the blessing modal, send blessings via @username, review sent blessings, received blessings, orb collection, shape changing, and previews.",
    "4. Progress: see the three main tracks, today’s most relevant missions, and unlock progress.",
    "5. AI Assistant: get daily AI guidance, generate personalized meditation, post-meditation integration, blessing writing, and spiritual inquiry.",
    "6. Profile: VIP status, Resonance balance, recent earnings/spend, sync health, and testing tools.",
    "7. Settings: language, notifications, theme, privacy.",
    "Important functional rules:",
    "- The most reliable blessing path right now is entering a friend's @username.",
    "- Received blessing orbs are view-only: they can be previewed but not used for meditation or mission unlocks.",
    "- AI generation and chat use daily guidance credits; free has fewer, VIP has more, and Resonance can top them up.",
    "- Resonance currently supports blessing boost, light field, ambient pass, and AI top-ups.",
    "If the user asks how the app works overall, guide them through these pages in order instead of describing only one feature.",
  ].join("\n");
}

function buildVisibleContextChips({
  language,
  stats,
  currentOrb,
  missionStats,
  lastMeditationContext,
}: {
  language: Language;
  stats: {
    totalSessions: number;
    totalMinutes: number;
    currentStreak: number;
  };
  currentOrb: {
    level: number;
    isAwakened: boolean;
    shape?: string;
  };
  missionStats: {
    blessingsSent: number;
    customMeditationsCreated: number;
    customMeditationsCompleted: number;
    uniqueCategories: string[];
  };
  lastMeditationContext?: {
    courseName: string;
    duration: number;
    completedAt: string;
    category: string | null;
    isCustomSession: boolean;
  } | null;
}) {
  const chips: string[] = [];

  chips.push(
    language === "zh"
      ? `連續 ${stats.currentStreak} 天`
      : language === "es"
        ? `Racha de ${stats.currentStreak} días`
        : `${stats.currentStreak}-day streak`
  );
  chips.push(
    language === "zh"
      ? `${stats.totalMinutes} 分鐘`
      : language === "es"
        ? `${stats.totalMinutes} min`
        : `${stats.totalMinutes} min`
  );
  chips.push(
    currentOrb.isAwakened
      ? language === "zh"
        ? "光球已覺醒"
        : language === "es"
          ? "Esfera despierta"
        : "Awakened orb"
      : language === "zh"
        ? `光球第 ${currentOrb.level} 層`
        : language === "es"
          ? `Esfera nivel ${currentOrb.level}`
        : `Orb level ${currentOrb.level}`
  );

  if (missionStats.customMeditationsCreated > 0) {
    chips.push(
      language === "zh"
        ? `AI 課程 ${missionStats.customMeditationsCreated} 節`
        : language === "es"
          ? `${missionStats.customMeditationsCreated} sesiones AI`
          : `${missionStats.customMeditationsCreated} AI sessions`
    );
  }

  if (missionStats.blessingsSent > 0) {
    chips.push(
      language === "zh"
        ? `已送祝福 ${missionStats.blessingsSent} 次`
        : language === "es"
          ? `${missionStats.blessingsSent} bendiciones enviadas`
          : `${missionStats.blessingsSent} blessings sent`
    );
  }

  if (lastMeditationContext?.courseName) {
    chips.push(
      language === "zh"
        ? `最近：${lastMeditationContext.courseName}`
        : language === "es"
          ? `Última: ${lastMeditationContext.courseName}`
          : `Last: ${lastMeditationContext.courseName}`
    );
  }

  return chips.slice(0, 6);
}

function buildRecentCategoryBias({
  language,
  lastMeditationContext,
}: {
  language: Language;
  lastMeditationContext?: {
    category: string | null;
    courseName: string;
  } | null;
}) {
  const category = lastMeditationContext?.category?.toLowerCase() ?? "";
  if (!category) return "";

  if (language === "zh") {
    if (category.includes("sleep")) {
      return `你最近完成的冥想偏向睡眠 / 放鬆主題，因此在解讀時可更留意：放下控制、神經系統安撫、疲憊與安全感。`;
    }
    if (category.includes("focus") || category.includes("clarity")) {
      return `你最近完成的冥想偏向專注 / 清晰主題，因此在解讀時可更留意：心智雜訊、方向感、意圖聚焦與精神耗散。`;
    }
    if (category.includes("healing") || category.includes("heart")) {
      return `你最近完成的冥想偏向療癒 / 心主題，因此在解讀時可更留意：關係創傷、柔軟、防衛與重新接納。`;
    }
    if (category.includes("chakra")) {
      return `你最近完成的冥想偏向脈輪主題，因此在解讀時可更留意：哪一層能量中心正尋求整合，而不是把所有感受混在一起。`;
    }
    if (category.includes("ground") || category.includes("root")) {
      return `你最近完成的冥想偏向落地 / 根部主題，因此在解讀時可更留意：安全感、身體承托、現實壓力與邊界。`;
    }
    return `你最近完成的是「${lastMeditationContext.courseName}」，解讀時可把這節練習的餘波當成背景脈絡。`;
  }

  if (category.includes("sleep")) {
    return `Your most recent meditation leaned toward sleep / relaxation, so interpretation can pay more attention to surrender, nervous-system settling, fatigue, and safety.`;
  }
  if (category.includes("focus") || category.includes("clarity")) {
    return `Your most recent meditation leaned toward focus / clarity, so interpretation can pay more attention to mental noise, direction, intention, and scattered energy.`;
  }
  if (category.includes("healing") || category.includes("heart")) {
    return `Your most recent meditation leaned toward healing / heart themes, so interpretation can pay more attention to softness, defense, relationship wounds, and reopening.`;
  }
  if (category.includes("chakra")) {
    return `Your most recent meditation leaned toward chakra themes, so interpretation can look for which center is asking for integration instead of flattening everything into one feeling.`;
  }
  if (category.includes("ground") || category.includes("root")) {
    return `Your most recent meditation leaned toward grounding / root themes, so interpretation can pay more attention to safety, embodiment, pressure, and boundaries.`;
  }
  return `Your most recent meditation was "${lastMeditationContext.courseName}", so its aftereffect can be treated as context for this reading.`;
}

function buildModePrompt({
  modeId,
  language,
  lastMeditationContext,
  currentOrb,
  stats,
}: {
  modeId: AiModeId;
  language: Language;
  lastMeditationContext?: {
    courseName: string;
    duration: number;
    completedAt: string;
    category: string | null;
    isCustomSession: boolean;
  } | null;
  currentOrb: {
    level: number;
    isAwakened: boolean;
  };
  stats: {
    currentStreak: number;
    totalMinutes: number;
  };
}) {
  switch (modeId) {
    case "guidance":
      return language === "zh"
        ? `請根據我今天在 app 內的狀態，給我一句 AI 指引，並建議我現在最適合做的冥想方向。補充背景：我目前${currentOrb.isAwakened ? "已覺醒" : `主光球在第 ${currentOrb.level} 層`}，已連續 ${stats.currentStreak} 天，累積 ${stats.totalMinutes} 分鐘。`
        : language === "es"
          ? `Según mi estado actual dentro de la app, dame una guía AI breve para hoy y sugiéreme la dirección de meditación que mejor me conviene ahora. Contexto extra: mi esfera está ${currentOrb.isAwakened ? "despierta" : `en el nivel ${currentOrb.level}`}, llevo una racha de ${stats.currentStreak} días y ${stats.totalMinutes} minutos en total.`
        : `Based on my in-app state today, give me one short AI guidance and suggest the meditation direction that fits me best right now. Extra context: my orb is ${currentOrb.isAwakened ? "awakened" : `at level ${currentOrb.level}`}, I have a ${stats.currentStreak}-day streak, and ${stats.totalMinutes} total minutes.`;
    case "course":
      return language === "zh"
        ? `我想生成一節今天專屬的冥想課程。請先根據我 app 內現在的進度，幫我整理最適合的主題、意圖與節奏，再為我生成。`
        : language === "es"
          ? `Quiero generar una meditación personalizada para hoy. Primero identifica el tema, la intención y el ritmo más adecuados según mi progreso dentro de la app, y luego genérala.`
        : `I want a personalized meditation for today. First identify the best theme, intention, and pace from my in-app progress, then generate it.`;
    case "integration":
      return language === "zh"
        ? lastMeditationContext
          ? `我剛完成「${lastMeditationContext.courseName}」這節 ${lastMeditationContext.duration} 分鐘的冥想。請根據這節練習，幫我整理今天浮現的感受，並給我一個收束問題。`
          : "我剛完成一節冥想。請幫我整理今天浮現的感受，並給我一個收束問題。"
        : language === "es"
          ? lastMeditationContext
            ? `Acabo de completar "${lastMeditationContext.courseName}", una meditación de ${lastMeditationContext.duration} minutos. A partir de esa sesión, ayúdame a integrar lo que surgió hoy y dame una pregunta de cierre.`
            : "Acabo de terminar una meditación. Ayúdame a integrar lo que surgió hoy y dame una pregunta de cierre."
        : lastMeditationContext
          ? `I just completed "${lastMeditationContext.courseName}", a ${lastMeditationContext.duration}-minute meditation. Based on that session, help me integrate what surfaced today and give me one closing question.`
          : "I just finished meditating. Help me integrate what surfaced today and give me one closing reflection question.";
    case "blessing":
      return language === "zh"
        ? "請幫我寫一段短短的祝福，溫柔、有光感、真誠，適合直接送給朋友。"
        : language === "es"
          ? "Ayúdame a escribir una bendición breve, luminosa, sincera y suave, lista para enviársela a una amistad."
        : "Help me write a short blessing that feels warm, luminous, and sincere enough to send to a friend.";
    case "inquiry":
      return language === "zh"
        ? "我想更深入探討我的靈性狀態、象徵、人生課題或內在轉化。請不要急著叫我去冥想，先陪我看清楚我現在正在經歷什麼。"
        : language === "es"
          ? "Quiero explorar con más profundidad mi estado espiritual, símbolos, temas de vida o transformación interior. No me mandes enseguida a meditar; primero ayúdame a ver con claridad lo que estoy atravesando."
        : "I want to explore my spiritual state, symbols, life themes, or inner transformation more deeply. Please do not rush to suggest meditation; first help me understand what I may be moving through.";
    case "guide":
      return language === "zh"
        ? "請帶我快速認識 PSI-G 這個 app 應該怎樣玩，先做什麼、再去哪裡、每一頁主要用途是什麼。"
        : "Give me a quick guided tour of how to use PSI-G: what to do first, where to go next, and the main purpose of each page.";
    default:
      return "";
  }
}

function getCompletionOrThrow(data: unknown) {
  const completion = (data as { completion?: unknown })?.completion;
  if (typeof completion !== "string" || !completion.trim()) {
    throw new Error("LLM response missing completion");
  }
  return completion.trim();
}

const MEDITATION_PROMPTS = {
  en: [
    "I'm feeling stressed",
    "How to start meditating?",
    "Help me relax",
    "Improve sleep quality",
  ],
  zh: [
    "我感到壓力很大",
    "如何開始冥想？",
    "幫我放鬆身心",
    "改善睡眠品質",
  ],
  es: [
    "Me siento muy estresado",
    "¿Cómo empiezo a meditar?",
    "Ayúdame a relajarme",
    "Mejorar la calidad del sueño",
  ],
};

const TRANSLATIONS = {
  en: {
    title: "AI Meditation Assistant",
    welcome: "Hello! I'm your meditation AI assistant. I can help you with:\n\n• Personalized meditation guidance\n• Answer meditation-related questions\n• Recommend suitable meditation practices\n• Help you relax and reduce stress\n\nHow can I help you today?",
    inputPlaceholder: "Type your question...",
    thinking: "AI is thinking...",
    error: "Sorry, an error occurred. Please try again later.",
    quickPrompts: "Quick prompts:",
    guidedMeditations: "Guided Meditation Practices",
    minutes: "minutes",
    generateButton: "Generate My Personal Meditation",
    generating: "Generating meditation...",
    toastSaved: "Personal meditation generated! Saved to Library",
    dailyGuidance: "Daily Guidance",
    dailyRemaining: "remaining today",
    topUpOne: "Top up +1",
    topUpThree: "Top up +3",
    limitReached: "Today's free guidance is used up. Use Resonance or VIP to continue.",
    aiQuotaUsed: "This AI action uses 1 guidance credit.",
    modesTitle: "Choose a path",
    modeGuidance: "Today's guidance",
    modeGuidanceBody: "Ask for a short direction based on how you feel right now.",
    modeCourse: "Personal session",
    modeCourseBody: "Generate a full meditation tailored to today's state.",
    modeIntegration: "After-practice integration",
    modeIntegrationBody: "Reflect on what surfaced after your meditation.",
    modeBlessing: "Blessing writer",
    modeBlessingBody: "Draft a warmer blessing to send to someone else.",
    modeInquiry: "Spiritual inquiry",
    modeInquiryBody: "Explore symbols, awakening, chakras, shadow, and meaning with a deeper guided reading.",
    modeGuide: "How to use PSI-G",
    modeGuideBody: "Get a quick in-app tour of what each page does and where to start.",
    activeMode: "Current mode",
    modeReady: "Your prompt is ready below.",
    modeReadyCourse: "This path is ready to generate a personalized session.",
    modeUseChat: "Send this prompt",
    modeUseCourse: "Generate this session",
    useInGarden: "Use in Garden blessing",
    inquiryPresetsTitle: "Go deeper with",
    inquiryPresetSymbols: "Symbol reading",
    inquiryPresetLifeTheme: "Life theme",
    inquiryPresetChakra: "Chakra reading",
    inquiryPresetAwakening: "Awakening integration",
    inquiryLensesTitle: "Your current lenses",
  },
  zh: {
    title: "AI 冥想助手",
    welcome: "你好！我是你的冥想AI助手。我可以幫助你：\n\n• 提供個性化的冥想指導\n• 解答冥想相關問題\n• 推薦適合的冥想練習\n• 幫助你放鬆和減壓\n\n請問有什麼可以幫助你的嗎？",
    inputPlaceholder: "輸入你的問題...",
    thinking: "AI正在思考...",
    error: "抱歉，發生了錯誤。請稍後再試。",
    quickPrompts: "快速提問：",
    guidedMeditations: "引導冥想練習",
    minutes: "分鐘",
    generateButton: "為我生成專屬冥想",
    generating: "正在生成冥想...",
    toastSaved: "專屬冥想已生成！已儲存至冥想圖書館",
    dailyGuidance: "今日靈感",
    dailyRemaining: "今日尚餘",
    topUpOne: "補充 +1",
    topUpThree: "補充 +3",
    limitReached: "今日免費靈感已用完，可用 Resonance 或 VIP 繼續。",
    aiQuotaUsed: "每次 AI 對話或生成都會消耗 1 次靈感。",
    modesTitle: "選一條 AI 路徑",
    modeGuidance: "今日 AI 指引",
    modeGuidanceBody: "根據你現在的狀態，先請 AI 給你一句方向。",
    modeCourse: "專屬冥想課程",
    modeCourseBody: "生成一節更完整、更貼合今天狀態的冥想。",
    modeIntegration: "冥想後整合",
    modeIntegrationBody: "在完成練習後，幫你整理剛才浮現的感受。",
    modeBlessing: "祝福生成",
    modeBlessingBody: "幫你寫一段更有溫度、適合送給別人的祝福。",
    modeInquiry: "靈性探問",
    modeInquiryBody: "用更像導師解讀的方式，探討象徵、覺醒、脈輪、陰影與人生課題。",
    modeGuide: "如何使用 PSI-G",
    modeGuideBody: "快速帶你認識每一頁的用途，以及先做什麼。",
    activeMode: "目前模式",
    modeReady: "提示已準備好，可直接送出。",
    modeReadyCourse: "這條路徑已準備好，可直接生成一節專屬課程。",
    modeUseChat: "直接發送這個提示",
    modeUseCourse: "直接生成這節課程",
    useInGarden: "帶去花園祝福",
    inquiryPresetsTitle: "深入探問方向",
    inquiryPresetSymbols: "象徵解讀",
    inquiryPresetLifeTheme: "人生課題",
    inquiryPresetChakra: "脈輪解讀",
    inquiryPresetAwakening: "覺醒整合",
    inquiryLensesTitle: "你目前的閱讀角度",
  },
  es: {
    title: "Asistente de meditación IA",
    welcome: "Hola. Soy tu asistente de meditación con IA. Puedo ofrecerte guía personalizada, responder preguntas sobre meditación y recomendar prácticas adecuadas. ¿Cómo puedo ayudarte hoy?",
    inputPlaceholder: "Escribe tu pregunta...",
    thinking: "La IA está pensando...",
    error: "Lo siento, ocurrió un error. Inténtalo de nuevo más tarde.",
    quickPrompts: "Sugerencias rápidas:",
    guidedMeditations: "Prácticas guiadas",
    minutes: "minutos",
    generateButton: "Generar mi meditación personalizada",
    generating: "Generando meditación...",
    toastSaved: "Meditación personalizada generada y guardada en la biblioteca",
    dailyGuidance: "Guía diaria",
    dailyRemaining: "restantes hoy",
    topUpOne: "Recargar +1",
    topUpThree: "Recargar +3",
    limitReached: "La guía gratuita de hoy se agotó. Usa Resonance o VIP para continuar.",
    aiQuotaUsed: "Cada acción de IA consume 1 crédito de guía.",
    modesTitle: "Elige un camino",
    modeGuidance: "Guía de hoy",
    modeGuidanceBody: "Pide una dirección breve basada en cómo te sientes ahora.",
    modeCourse: "Sesión personal",
    modeCourseBody: "Genera una meditación completa adaptada a tu estado de hoy.",
    modeIntegration: "Integración tras la práctica",
    modeIntegrationBody: "Reflexiona sobre lo que surgió después de tu meditación.",
    modeBlessing: "Escritor de bendiciones",
    modeBlessingBody: "Redacta una bendición más cálida para enviar a otra persona.",
    modeInquiry: "Exploración espiritual",
    modeInquiryBody: "Explora símbolos, despertar, chakras, sombra y significado con una guía más profunda.",
    modeGuide: "Cómo usar PSI-G",
    modeGuideBody: "Recibe un recorrido rápido por la app y por dónde empezar.",
    activeMode: "Modo actual",
    modeReady: "Tu prompt está listo abajo.",
    modeReadyCourse: "Este camino está listo para generar una sesión personalizada.",
    modeUseChat: "Enviar este prompt",
    modeUseCourse: "Generar esta sesión",
    useInGarden: "Usar en la bendición del jardín",
    inquiryPresetsTitle: "Profundiza con",
    inquiryPresetSymbols: "Lectura de símbolos",
    inquiryPresetLifeTheme: "Tema de vida",
    inquiryPresetChakra: "Lectura de chakras",
    inquiryPresetAwakening: "Integración del despertar",
    inquiryLensesTitle: "Tus lentes actuales",
  },
};

const getAssistantTranslations = (language: Language) => TRANSLATIONS[language] ?? TRANSLATIONS.en;
const getMeditationPromptsForLanguage = (language: Language) => MEDITATION_PROMPTS[language] ?? MEDITATION_PROMPTS.en;

function getModeSystemPrompt(modeId: AiModeId | null, language: Language) {
  if (!modeId) return "";

  const prompts = {
    en: {
      guidance: "Prioritize one grounded recommendation for today and keep the answer short, practical, and emotionally supportive.",
      course: "Help the user identify a meditation theme and intent for today so it can be turned into a personalized guided session.",
      integration: "Act like a post-meditation integration guide. Reflect gently, help name what surfaced, and end with one closing question.",
      blessing: "Write with warmth, light, and tenderness. Make the blessing short enough to send to a friend and emotionally sincere.",
      inquiry: `Go deeper into spiritual meaning, symbols, awakening, life patterns, shadow work, and inner inquiry. Do not default to suggesting meditation unless it truly helps.

For spiritual inquiry responses, prefer this structure:
1. What I notice
2. What it may mean
3. What to gently observe next

Start directly with those headings, and keep each section compact, insightful, grounded, and emotionally precise.`,
      guide: `Act like an in-app onboarding guide for PSI-G. Explain the app in a clear sequence, starting from Home, then Meditate, Garden, Progress, AI Assistant, and Profile. Keep it practical and specific.`,
    },
    zh: {
      guidance: "請優先給出一句今天最適合的方向，回答要短、穩定、實用，並帶支持感。",
      course: "請先幫用戶整理今天最適合的冥想主題與意圖，方便生成一節專屬冥想。",
      integration: "請以冥想後整合導師的語氣回應，溫柔整理剛才浮現的感受，最後附上一個收束問題。",
      blessing: "請用溫暖、有光感、真誠的語氣寫作，內容要短，適合直接送給朋友。",
      inquiry: `請更深入探討靈性意義、象徵、覺醒、人生模式、陰影與內在提問；不要一開口就叫用戶去冥想，除非那真的是最貼切的一步。

回答靈性探問時，優先用這個結構：
1. 我看到什麼
2. 這可能代表什麼
3. 你現在可以如何溫柔覺察

請直接用以上標題開始回答，每段保持精準、有洞察、grounded、清楚、溫柔。`,
      guide: "請像 app 內新手導遊一樣，按首頁 -> 冥想館 -> 花園 -> 進度 -> AI 助手 -> 個人資料 的順序，具體而簡潔地介紹 PSI-G 的玩法。",
    },
    es: {
      guidance: "Prioriza una recomendación sencilla y aterrizada para hoy. La respuesta debe ser breve, útil y emocionalmente sostenedora.",
      course: "Ayuda a la persona a identificar el tema y la intención de meditación más adecuados para hoy para convertirlos en una sesión guiada personalizada.",
      integration: "Responde como una guía de integración después de meditar. Refleja con suavidad lo que surgió y termina con una sola pregunta de cierre.",
      blessing: "Escribe con calidez, luz y ternura. La bendición debe ser breve, fácil de enviar y emocionalmente sincera.",
      inquiry: `Profundiza en significado espiritual, símbolos, despertar, patrones de vida, sombra e indagación interior. No sugieras meditar por defecto a menos que realmente ayude.

Para respuestas de exploración espiritual, prefiere esta estructura:
1. Lo que percibo
2. Lo que podría significar
3. Qué observar con suavidad ahora

Empieza directamente con esos títulos y mantén cada sección compacta, clara, sensible y aterrizada.`,
      guide: `Actúa como una guía de onboarding dentro de PSI-G. Explica la app en una secuencia clara, empezando por Inicio, luego Meditar, Jardín, Progreso, Asistente AI y Perfil. Mantén el tono práctico y específico.`,
    },
  };

  return (prompts[language] ?? prompts.en)[modeId];
}

function buildMeditationGenerationSystemPrompt(language: Language, appContextSummary: string) {
  if (language === "zh") {
    return `你是 PSI-G 的冥想導引編輯，不只是內容生成器。你的工作是產出「適合被朗讀」的高品質冥想稿。

嚴格輸出格式（不要添加其他文字、不要 markdown、不要代碼框）：
標題：[冥想標題]
時長：[分鐘數，僅數字]
Opening Preview：[只供 opening 試聽的短開場，2-3 句]
腳本：[完整導引腳本]

寫作規則：
- Opening Preview 只寫開場安定與第一個呼吸提示，長度控制在 45-110 字內。
- 完整腳本請用「短句 + 段落」寫作，不要一整大段。
- 每句只做一件事，例如：呼吸、身體覺察、情緒覺察、主題探索、收束回來。
- 沉默也是引導的一部分，不要用太多字把每一秒都塞滿。
- 腳本保持約 260-420 字，讓停頓與留白成為節奏，而不是一直說話。
- 不要使用條列、編號、括號舞台指示、提示詞說明、分析口吻。
- 不要寫「現在我將帶你」這種客服式開頭，也不要寫 app 功能說明。
- 不要在冥想稿裡提及任何 app 統計、連續天數、分鐘數、光球層級、任務數量、完成次數。
- 這些狀態只能作為你決定主題與語氣的背景，不能直接被讀出來。
- 不要說「你已連續幾天」、「你累積了多少分鐘」、「你現在在第幾層」這類句子。

引導結構：
1. 到來與安定
2. 呼吸放慢
3. 身體 / 情緒覺察
4. 今日主題探索
5. 收束與回來

品質標準：
- 溫柔、穩定、可朗讀
- 不空泛，不說教
- 有呼吸感，有停頓感
- 讀出來要像真正導引，不像文章

${appContextSummary}`;
  }

  if (language === "es") {
    return `Eres el editor de meditaciones guiadas de PSI-G, no solo un generador de texto. Tu trabajo es crear guiones de meditación de alta calidad que suenen naturales al ser leídos en voz alta.

FORMATO DE SALIDA ESTRICTO (No añadas texto extra, markdown ni bloques de código):
Título: [Título de la meditación]
Duración: [Minutos, solo número entero]
Opening Preview: [Un preview breve de apertura en 2-3 frases]
Guion: [Guion completo de la meditación guiada]

Reglas de escritura:
- El Opening Preview solo debe incluir llegada, estabilización y la primera indicación de respiración, alrededor de 80-180 caracteres.
- Escribe el guion completo en frases cortas y párrafos breves, nunca como un bloque largo.
- Una indicación por frase: respiración, cuerpo, emoción, tema o regreso.
- El silencio también forma parte de la meditación. No llenes cada segundo con palabras.
- Mantén el guion alrededor de 180-280 palabras para que el ritmo nazca de las pausas y no de hablar sin parar.
- No uses viñetas, numeración, acotaciones entre paréntesis ni comentarios analíticos.
- No suenes como chatbot ni expliques funciones de la app dentro de la meditación.
- No menciones estadísticas de la app, rachas, minutos totales, niveles de esfera, misiones ni conteos de completado dentro del texto leído.
- Usa el estado del usuario solo como contexto oculto para tema y tono, nunca como línea a leer.
- Nunca escribas frases como "vas por el día X", "has meditado Y minutos" o "tu esfera está en el nivel Z".

Estructura de guía:
1. Llegar y asentarse
2. Suavizar la respiración
3. Notar cuerpo o emoción
4. Explorar el tema de hoy
5. Regresar y cerrar

Estándar de calidad:
- suave
- estable
- fácil de leer en voz
- emocionalmente preciso
- claro y aterrizado, no vago

${appContextSummary}`;
  }

  return `You are PSI-G's guided meditation editor, not just a text generator. Write meditation that sounds natural when spoken aloud.

STRICT OUTPUT FORMAT (Do not add any extra text, markdown, or code fences):
Title: [Meditation title]
Duration: [Minutes, integer only]
Opening Preview: [A short opening-only preview in 2-3 sentences]
Script: [Full guided meditation script]

Writing rules:
- Opening Preview should contain only grounding and the first breath cue, around 80-180 characters.
- Write the full script in short spoken lines and short paragraphs, never as one long block.
- One cue per sentence: breath, body awareness, emotional awareness, theme exploration, or return.
- Silence is part of meditation. Do not fill every second with words.
- Keep the script around 180-280 words so pacing comes from pauses, not nonstop talking.
- Do not use bullets, numbering, bracketed stage directions, or analytical commentary.
- Do not sound like a chatbot or explain app features inside the meditation.
- Do not mention any app stats, streaks, totals, orb levels, mission counts, or completion counts inside the spoken meditation.
- Use user state only as hidden context for theme and tone, never as lines to be read aloud.
- Never write lines such as "you are on day X", "you have meditated for Y minutes", or "your orb is at level Z".

Guidance structure:
1. Arrive and settle
2. Slow the breath
3. Notice body or feeling
4. Explore today's theme
5. Return and close

Quality bar:
- gentle
- steady
- speakable
- emotionally precise
- grounded rather than vague

${appContextSummary}`;
}

function buildMeditationGenerationContextSummary({
  language,
  currentOrb,
  missionStats,
  lastMeditationContext,
}: {
  language: Language;
  currentOrb: {
    level: number;
    isAwakened: boolean;
    shape?: string;
  };
  missionStats: {
    blessingsSent: number;
    customMeditationsCreated: number;
    customMeditationsCompleted: number;
    uniqueCategories: string[];
  };
  lastMeditationContext?: {
    courseName: string;
    duration: number;
    completedAt: string;
    category: string | null;
    isCustomSession: boolean;
  } | null;
}) {
  if (language === "zh") {
    const lines = [
      "以下背景只供你決定主題與語氣，不能直接在冥想稿裡讀出來：",
      currentOrb.isAwakened
        ? "用戶已進入較成熟的整合階段，語氣可更穩、更內收。"
        : "用戶仍在成長與形成階段，語氣可更安定、更支持。",
      missionStats.blessingsSent > 0
        ? "最近旅程帶有分享、流動、關係與祝福的主題。"
        : "最近旅程較偏向內在安定、建立與自我連結。",
      missionStats.uniqueCategories.length >= 4
        ? "用戶已接觸多個主題，可稍微增加整合感與深度。"
        : "主題保持單純，聚焦一個主要感受或方向即可。",
      lastMeditationContext?.category
        ? `最近一節練習偏向「${lastMeditationContext.category}」，新課程可與這股餘波自然銜接。`
        : "如無明確最近主題，請先以安定、呼吸與回到身體作為起點。",
    ];
    return lines.join("\n");
  }

  const lines = [
    "Use the following only as hidden context for tone and theme. Do not mention any of it directly in the meditation:",
    currentOrb.isAwakened
      ? "The user is in a more integrated, mature phase, so the tone can be steadier and deeper."
      : "The user is still in a forming phase, so the tone should feel grounding and supportive.",
    missionStats.blessingsSent > 0
      ? "Recent themes include sharing, flow, relationship, and offering."
      : "Recent themes lean more toward inner steadiness, building, and self-connection.",
    missionStats.uniqueCategories.length >= 4
      ? "The user has explored enough range that the script can hold slightly more integration and depth."
      : "Keep the theme simple and centered on one emotional direction.",
    lastMeditationContext?.category
      ? `The most recent session leaned toward "${lastMeditationContext.category}", so the new meditation can gently continue that aftereffect.`
      : "If there is no strong recent theme, begin with grounding, breath, and returning to the body.",
  ];
  return lines.join("\n");
}

export default function AssistantScreen() {
  const { currentTheme, settings } = useSettings();
  const {
    addCustomMeditation,
    missionStats,
    customMeditations,
    resonanceState,
    aiUsageSnapshot,
    consumeAiGuidanceUse,
    purchaseAiGuidanceTopUp,
    currentOrb,
    stats,
    lastMeditationContext,
  } = useMeditation();
  const language = settings.language as Language;
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: getAssistantTranslations(language).welcome,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedModeId, setSelectedModeId] = useState<AiModeId | null>("guidance");
  const [selectedInquiryPresetId, setSelectedInquiryPresetId] = useState<InquiryPresetId | null>(null);
  const [selectedBlessingPresetId, setSelectedBlessingPresetId] = useState<BlessingPresetId | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const t = getAssistantTranslations(language);
  const tr = (zh: string, en: string, es: string) => {
    if (language === "zh") return zh;
    if (language === "es") return es;
    return en;
  };
  const latestCustomMeditation = customMeditations[customMeditations.length - 1];
  const latestAssistantMessage = [...messages].reverse().find((message) => !message.isUser)?.text ?? "";
  const spiritualLenses = buildSpiritualLenses({
    language,
    stats,
    currentOrb,
    missionStats,
    lastMeditationContext,
  });
  const recentCategoryBias = buildRecentCategoryBias({
    language,
    lastMeditationContext,
  });
  const visibleContextChips = buildVisibleContextChips({
    language,
    stats,
    currentOrb,
    missionStats,
    lastMeditationContext,
  });
  const appContextSummary = buildAppContextSummary({
    language,
    stats,
    currentOrb,
    missionStats,
    latestCustomMeditation,
    lastMeditationContext,
  });
  const meditationGenerationContextSummary = buildMeditationGenerationContextSummary({
    language,
    currentOrb,
    missionStats,
    lastMeditationContext,
  });
  const appFeatureGuideSummary = buildAppFeatureGuideSummary(language);
  const spiritualLensSummary = buildSpiritualLensSummary(language, spiritualLenses);
  const aiJourneyPrimaryActionLabel =
    !latestCustomMeditation
      ? null
      : missionStats.customMeditationsCompleted === 0
        ? tr("去完成最新 AI 課程", "Complete Latest AI Session", "Completar la última sesión AI")
        : tr("打開最新 AI 課程", "Open Latest AI Session", "Abrir la última sesión AI");
  const aiJourneySecondaryActionLabel =
    missionStats.customMeditationsCreated === 0
      ? tr("去冥想圖書館看看", "Browse the Library", "Explorar la biblioteca")
      : missionStats.customMeditationsCompleted === 0
        ? tr("去冥想圖書館", "Go to the Library", "Ir a la biblioteca")
        : tr("查看旅程進度", "View Journey Progress", "Ver el progreso del viaje");
  const aiJourneyCopy =
    missionStats.customMeditationsCreated === 0
      ? tr(
          "先用 AI 助手生成第一個專屬冥想，之後它會直接進入圖書館。",
          "Generate your first personalized meditation here, then it will appear in the library.",
          "Genera aquí tu primera meditación personalizada y después aparecerá en la biblioteca."
        )
      : missionStats.customMeditationsCompleted === 0
        ? tr(
            "你已生成 AI 課程，下一步去圖書館完成它。",
            "Your AI meditation is ready. Next, finish it from the library.",
            "Tu meditación AI ya está lista. El siguiente paso es completarla desde la biblioteca."
          )
        : tr(
            "AI 助手已經成為你的旅程一部分，想要新的主題時隨時再生成。",
            "AI is now part of your journey. Generate another session anytime you want a fresh theme.",
            "La IA ya forma parte de tu viaje. Genera otra sesión cuando quieras un tema nuevo."
          );
  const aiModes: AiModeConfig[] = [
    {
      id: "guidance",
      title: t.modeGuidance,
      body: t.modeGuidanceBody,
      prompt: buildModePrompt({ modeId: "guidance", language, lastMeditationContext, currentOrb, stats }),
    },
    {
      id: "course",
      title: t.modeCourse,
      body: t.modeCourseBody,
      prompt: buildModePrompt({ modeId: "course", language, lastMeditationContext, currentOrb, stats }),
    },
    {
      id: "integration",
      title: t.modeIntegration,
      body: t.modeIntegrationBody,
      prompt: buildModePrompt({ modeId: "integration", language, lastMeditationContext, currentOrb, stats }),
    },
    {
      id: "blessing",
      title: t.modeBlessing,
      body: t.modeBlessingBody,
      prompt: buildModePrompt({ modeId: "blessing", language, lastMeditationContext, currentOrb, stats }),
    },
    {
      id: "inquiry",
      title: t.modeInquiry,
      body: t.modeInquiryBody,
      prompt: buildModePrompt({ modeId: "inquiry", language, lastMeditationContext, currentOrb, stats }),
    },
    {
      id: "guide",
      title: t.modeGuide,
      body: t.modeGuideBody,
      prompt: buildModePrompt({ modeId: "guide", language, lastMeditationContext, currentOrb, stats }),
    },
  ];
  const inquiryPresets: Array<InquiryPreset & { id: InquiryPresetId }> = [
    {
      id: "symbols",
      title: t.inquiryPresetSymbols,
      prompt:
        language === "zh"
          ? "我最近反覆被某些象徵、圖像、數字或神聖幾何吸引。請幫我解讀它可能對應的內在訊息與靈性意義。"
          : language === "es"
            ? "Últimamente me atraen ciertos símbolos, imágenes, números o geometrías sagradas. Ayúdame a interpretar su posible mensaje interior y espiritual."
          : "I keep being drawn to certain symbols, images, numbers, or sacred geometry. Help me interpret their possible inner and spiritual meaning.",
    },
    {
      id: "life-theme",
      title: t.inquiryPresetLifeTheme,
      prompt:
        language === "zh"
          ? "請幫我看看，我最近反覆遇到的人生模式、情緒或關係課題，可能在提醒我學習什麼。"
          : language === "es"
            ? "Ayúdame a ver qué podrían estar enseñándome los patrones de vida, bucles emocionales o temas relacionales que se me repiten."
          : "Help me look at the life patterns, emotional loops, or relationship themes I keep repeating, and what they may be asking me to learn.",
    },
    {
      id: "chakra",
      title: t.inquiryPresetChakra,
      prompt:
        language === "zh"
          ? "請根據我現在的狀態，幫我看看可能是哪個脈輪失衡，這背後代表什麼，以及我可以先如何覺察。"
          : language === "es"
            ? "Según mi estado actual, ayúdame a ver qué chakra podría estar desequilibrado, qué podría significar y cómo puedo empezar a observarlo."
          : "Based on my current state, help me see which chakra may be out of balance, what it may mean, and how I can begin to notice it.",
    },
    {
      id: "awakening",
      title: t.inquiryPresetAwakening,
      prompt:
        language === "zh"
          ? "我想理解自己目前的覺醒與整合階段。請幫我分辨這是成長、鬆動、重組，還是更深的轉化。"
          : language === "es"
            ? "Quiero comprender mi fase actual de despertar e integración. Ayúdame a distinguir si esto es crecimiento, aflojamiento, reorganización o una transformación más profunda."
          : "I want to understand my current awakening and integration stage. Help me discern whether this is growth, unraveling, reorganization, or deeper transformation.",
    },
  ];
  const blessingPresets: Array<BlessingPreset & { id: BlessingPresetId }> = [
    {
      id: "gentle",
      title: tr("溫柔陪伴", "Gentle", "Suave"),
      prompt:
        language === "zh"
          ? "請幫我寫一段短短的祝福，語氣溫柔、安定、有陪伴感，適合送給一位需要被溫柔接住的朋友。"
          : language === "es"
            ? "Escribe una bendición corta con un tono suave, estable y acompañante para una amistad que necesita sentirse sostenida con ternura."
          : "Write a short blessing with a gentle, steady, companioning tone for a friend who needs softness and support.",
    },
    {
      id: "encouraging",
      title: tr("鼓勵打氣", "Encouraging", "Ánimo"),
      prompt:
        language === "zh"
          ? "請幫我寫一段短短的祝福，語氣溫暖、有力量、能鼓勵對方繼續前行。"
          : language === "es"
            ? "Escribe una bendición corta con calidez, fuerza y ánimo para alguien que necesita seguir avanzando."
          : "Write a short blessing that feels warm, strong, and encouraging for someone who needs momentum.",
    },
    {
      id: "healing",
      title: tr("療癒安撫", "Healing", "Sanación"),
      prompt:
        language === "zh"
          ? "請幫我寫一段短短的祝福，語氣療癒、安撫、有光感，像是在溫柔照顧對方現在的疲憊與情緒。"
          : language === "es"
            ? "Escribe una bendición corta con tono sanador, calmante y luminoso, como si cuidara con ternura el cansancio y las emociones de esa persona."
          : "Write a short blessing with a healing, soothing, luminous tone for someone who feels tired or emotionally tender.",
    },
    {
      id: "celebration",
      title: tr("喜悅慶祝", "Celebration", "Celebración"),
      prompt:
        language === "zh"
          ? "請幫我寫一段短短的祝福，語氣喜悅、明亮、帶慶祝感，適合送給剛完成一件重要事情的朋友。"
          : language === "es"
            ? "Escribe una bendición corta con una energía alegre, luminosa y celebratoria para una amistad que acaba de lograr algo importante."
          : "Write a short blessing with bright celebratory energy for a friend who has just completed something meaningful.",
    },
  ];
  const selectedMode = aiModes.find((mode) => mode.id === selectedModeId) ?? null;
  const selectedInquiryPreset = inquiryPresets.find((preset) => preset.id === selectedInquiryPresetId) ?? null;
  const selectedBlessingPreset = blessingPresets.find((preset) => preset.id === selectedBlessingPresetId) ?? null;

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && !prev[0]?.isUser) {
        return [{
          ...prev[0],
          text: getAssistantTranslations(language).welcome,
        }];
      }
      return prev;
    });
  }, [language]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const trimmedInput = inputText.trim();
    const detectedGuideIntent = detectAppGuideIntent(trimmedInput, language);

    const quota = await consumeAiGuidanceUse("chat");
    if (!quota.granted) {
      showToast(t.limitReached);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmedInput,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    setShowGenerateButton(false);

    try {
      const response = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: language === 'en' 
                ? `You are a spiritual guide inside the PSI-G app, not just a generic meditation chatbot.

Your priorities:
1. Help the user understand their inner state, spiritual themes, symbols, life patterns, and emotional process.
2. Offer meditation only when it is actually the most useful next step, not as a default answer.
3. When relevant, explore chakras, awakening, sacred geometry, energy, shadow, integration, intention, blessings, and meaning in a grounded way.
4. If the user asks about app features, answer with the actual in-app steps.
5. Stay warm, calm, insightful, and practical. Avoid vague filler.

Response guidance:
- If the user is asking a spiritual question, first interpret and reflect.
- If the user is asking what something means, explain the meaning before suggesting practice.
- If a practice helps, suggest one short and specific practice, not a generic “go meditate”.
- Prefer depth, interpretation, and integration over repetitive wellness clichés.
- When possible, structure spiritual answers so the user can quickly understand what you notice, what it may mean, and what to observe next.

Use English.`
                : language === 'es'
                  ? `Eres una guía espiritual dentro de la app PSI-G, no solo un chatbot genérico de meditación.

Tus prioridades:
1. Ayudar a la persona a comprender su estado interior, temas espirituales, símbolos, patrones de vida y proceso emocional.
2. Sugerir meditación solo cuando realmente sea el siguiente paso más útil, no como respuesta por defecto.
3. Cuando corresponda, explorar chakras, despertar, geometría sagrada, energía, sombra, integración, intención, bendiciones y significado de una manera aterrizada.
4. Si la persona pregunta por funciones de la app, responder con pasos reales dentro de la app.
5. Mantener un tono cálido, calmado, perspicaz y práctico. Evitar relleno vago.

Guía de respuesta:
- Si la persona hace una pregunta espiritual, primero interpreta y refleja.
- Si pregunta qué significa algo, explica el sentido antes de sugerir una práctica.
- Si una práctica ayuda, sugiere una sola práctica breve y específica, no un genérico “ve a meditar”.
- Prioriza profundidad, interpretación e integración por encima de clichés de bienestar repetitivos.
- Cuando sea posible, estructura las respuestas espirituales para que sea fácil entender qué percibes, qué podría significar y qué observar después.

Usa español.`
                : `你是 PSI-G app 內的靈性導師，不只是一般的冥想聊天機器人。

你的優先任務：
1. 幫助用戶理解自己的內在狀態、靈性主題、象徵、人生模式與情緒歷程。
2. 只有在真正適合時，才把冥想當成下一步，而不是預設答案。
3. 在適合的情況下，可以深入探討脈輪、覺醒、神聖幾何、能量、陰影、整合、意圖、祝福與意義，但要 grounded。
4. 如果用戶問 app 功能，請回答 app 內的實際操作路徑。
5. 語氣要溫暖、平靜、有洞察，而且實際，不要空泛。

回應原則：
- 如果用戶問的是靈性問題，先理解與詮釋，再談做法。
- 如果用戶問某件事代表什麼，先解釋意義，再建議練習。
- 如果需要建議練習，請只給一個短而具體的做法，不要一味叫人去冥想。
- 優先提供深度、象徵理解與整合，而不是重複 wellness 套話。
- 如果是靈性探問，盡量讓回答有清楚層次，讓用戶一眼看明白你看到什麼、它可能意味什麼、以及下一步可怎樣覺察。

請使用繁體中文。${getModeSystemPrompt(selectedModeId, language) ? `\n\n${getModeSystemPrompt(selectedModeId, language)}` : ""}${selectedModeId === "inquiry" && selectedInquiryPresetId ? `\n\n${getInquiryPresetSystemPrompt(language, selectedInquiryPresetId)}` : ""}

${buildAppGuideInstruction(language, detectedGuideIntent) ? `\n\n${buildAppGuideInstruction(language, detectedGuideIntent)}` : ""}

${appContextSummary}

${appFeatureGuideSummary}

${spiritualLensSummary}

${recentCategoryBias}`,
            },
            ...messages.map((msg) => ({
              role: msg.isUser ? "user" : "assistant",
              content: msg.text,
            })),
            {
              role: "user",
              content: trimmedInput,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM request failed (${response.status})`);
      }

      const data = await response.json();
      const completion = getCompletionOrThrow(data);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: completion,
        isUser: false,
        timestamp: new Date(),
        action:
          buildMessageAction(language, detectedGuideIntent, latestCustomMeditation) ??
          buildModeAction(language, selectedModeId, currentOrb, latestCustomMeditation),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setShowGenerateButton(true);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t.error,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  };

  const generateMeditation = async () => {
    const quota = await consumeAiGuidanceUse("course");
    if (!quota.granted) {
      showToast(t.limitReached);
      return;
    }

    setIsGenerating(true);
    try {
      const conversationContext = messages
        .filter(m => m.isUser)
        .map(m => m.text)
        .join(" ");
      const fallbackContext = inputText.trim() || selectedMode?.prompt || conversationContext;

      const response = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: buildMeditationGenerationSystemPrompt(language, meditationGenerationContextSummary),
            },
            {
              role: "user",
              content: language === 'en'
                ? `Generate a meditation for me based on: ${fallbackContext}`
                : language === 'es'
                  ? `Genera una meditación para mí a partir de lo siguiente: ${fallbackContext}`
                  : `請根據以下內容為我生成冥想：${fallbackContext}`
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM request failed (${response.status})`);
      }

      const data = await response.json();
      const meditationText = getCompletionOrThrow(data);
      const structuredMeditation = parseGeneratedMeditation(meditationText, language);

      const creationResult = await addCustomMeditation({
        title: structuredMeditation.title,
        openingPreview: structuredMeditation.openingPreview,
        previewText: structuredMeditation.previewText,
        script: structuredMeditation.script,
        duration: structuredMeditation.duration,
        language,
        contentVersion: structuredMeditation.contentVersion,
        qualityFlags: structuredMeditation.qualityFlags,
      });

      console.log("Meditation saved to Library");

      showToast(
        creationResult.reward.granted
          ? `${t.toastSaved} +${creationResult.reward.amount} Resonance`
          : t.toastSaved
      );
      setShowGenerateButton(false);
    } catch (error) {
      console.error("Error generating meditation:", error);
    } finally {
      setIsGenerating(false);
    }
  };



  const handlePromptPress = (prompt: string) => {
    setSelectedModeId(null);
    setSelectedInquiryPresetId(null);
    setInputText(prompt);
  };

  const handleModePress = (mode: AiModeConfig) => {
    setSelectedModeId(mode.id);
    if (mode.id !== "inquiry") {
      setSelectedInquiryPresetId(null);
    }
    if (mode.id !== "blessing") {
      setSelectedBlessingPresetId(null);
    }
    setInputText(mode.prompt);
    setShowGenerateButton(mode.id === "course");
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleTopUp = async (pack: "single" | "bundle") => {
    const result = await purchaseAiGuidanceTopUp(pack);
    if (!result.granted) {
      showToast(language === "zh" ? "Resonance 不足" : "Not enough Resonance");
      return;
    }
    showToast(
      language === "zh"
        ? `已補充 ${result.amount} 次 AI 靈感`
        : `Added ${result.amount} AI guidance credits`
    );
  };

  const handleUseBlessingInGarden = () => {
    if (!latestAssistantMessage.trim()) return;
    router.push({
      pathname: "/(tabs)/garden",
      params: {
        giftDraft: latestAssistantMessage.trim(),
        openGift: "1",
      },
    });
  };

  const renderAssistantMessage = (text: string) => {
    const sections = parseInsightSections(text, language);
    if (sections.length === 0) {
      return (
        <Text style={[styles.messageText, styles.aiMessageText, { color: currentTheme.text }]}>
          {text}
        </Text>
      );
    }

    return (
      <View style={styles.insightCardStack}>
        {sections.map((section) => (
          <View
            key={section.key}
            style={[styles.insightCard, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}
          >
            <Text style={[styles.insightCardTitle, { color: currentTheme.primary }]}>
              {section.title}
            </Text>
            <Text style={[styles.insightCardBody, { color: currentTheme.text }]}>
              {section.body}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const handleInquiryPresetPress = (preset: InquiryPreset & { id: InquiryPresetId }) => {
    setSelectedModeId("inquiry");
    setSelectedInquiryPresetId(preset.id);
    setInputText(preset.prompt);
  };

  const handleBlessingPresetPress = (preset: BlessingPreset & { id: BlessingPresetId }) => {
    setSelectedModeId("blessing");
    setSelectedBlessingPresetId(preset.id);
    setInputText(preset.prompt);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={currentTheme.gradient as any}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Bot color="#FFFFFF" size={28} />
          <Text style={styles.headerTitle}>{t.title}</Text>
          <Sparkles color="#FFFFFF" size={24} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.aiQuotaCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <View style={styles.aiQuotaHeader}>
              <View>
                <Text style={[styles.aiQuotaTitle, { color: currentTheme.text }]}>
                  {t.dailyGuidance}
                </Text>
                <Text style={[styles.aiQuotaBody, { color: currentTheme.textSecondary }]}>
                  {t.aiQuotaUsed}
                </Text>
              </View>
              <View style={[styles.aiQuotaPill, { backgroundColor: `${currentTheme.primary}14`, borderColor: `${currentTheme.primary}24` }]}>
                <Sparkles size={12} color={currentTheme.primary} />
                <Text style={[styles.aiQuotaPillText, { color: currentTheme.primary }]}>
                  {aiUsageSnapshot.remaining}
                </Text>
              </View>
            </View>
            <View style={styles.aiQuotaStats}>
              <View style={[styles.aiQuotaChip, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.aiQuotaChipText, { color: currentTheme.textSecondary }]}>
                  {tr(
                    `免費 ${FREE_DAILY_AI_GUIDANCE_LIMIT} / VIP ${VIP_DAILY_AI_GUIDANCE_LIMIT}`,
                    `Free ${FREE_DAILY_AI_GUIDANCE_LIMIT} / VIP ${VIP_DAILY_AI_GUIDANCE_LIMIT}`,
                    `Gratis ${FREE_DAILY_AI_GUIDANCE_LIMIT} / VIP ${VIP_DAILY_AI_GUIDANCE_LIMIT}`
                  )}
                </Text>
              </View>
              {aiUsageSnapshot.purchasedExtra > 0 && (
                <View style={[styles.aiQuotaChip, { backgroundColor: currentTheme.background }]}>
                  <Text style={[styles.aiQuotaChipText, { color: currentTheme.primary }]}>
                    {tr(
                      `已補充 +${aiUsageSnapshot.purchasedExtra}`,
                      `Top-up +${aiUsageSnapshot.purchasedExtra}`,
                      `Recarga +${aiUsageSnapshot.purchasedExtra}`
                    )}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.aiQuotaActionRow}>
              <TouchableOpacity
                style={[styles.aiQuotaAction, { borderColor: currentTheme.border, backgroundColor: currentTheme.background }]}
                onPress={() => handleTopUp("single")}
                activeOpacity={0.85}
              >
                <Plus size={14} color={currentTheme.primary} />
                <Text style={[styles.aiQuotaActionText, { color: currentTheme.text }]}>
                  {`${t.topUpOne} · ${AI_GUIDANCE_TOP_UP_COST_SINGLE}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.aiQuotaAction, { borderColor: currentTheme.border, backgroundColor: currentTheme.background }]}
                onPress={() => handleTopUp("bundle")}
                activeOpacity={0.85}
              >
                <Lock size={14} color={currentTheme.primary} />
                <Text style={[styles.aiQuotaActionText, { color: currentTheme.text }]}>
                  {`${t.topUpThree} · ${AI_GUIDANCE_TOP_UP_COST_BUNDLE}`}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.aiQuotaFootnote, { color: currentTheme.textSecondary }]}>
              {tr(
                `今日已用 ${aiUsageSnapshot.used} / ${aiUsageSnapshot.totalAvailable} 次，Resonance 餘額 ${resonanceState.balance}`,
                `Used ${aiUsageSnapshot.used} / ${aiUsageSnapshot.totalAvailable} today, Resonance balance ${resonanceState.balance}`,
                `Usado hoy ${aiUsageSnapshot.used} / ${aiUsageSnapshot.totalAvailable}, saldo de Resonance ${resonanceState.balance}`
              )}
            </Text>
          </View>

          <View style={[styles.aiModesCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <Text style={[styles.aiModesTitle, { color: currentTheme.text }]}>
              {t.modesTitle}
            </Text>
            <View style={styles.aiModesGrid}>
              {aiModes.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.aiModeTile, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}
                  activeOpacity={0.85}
                  onPress={() => handleModePress(mode)}
                >
                  <Text style={[styles.aiModeTitle, { color: currentTheme.text }]}>
                    {mode.title}
                  </Text>
                  <Text style={[styles.aiModeBody, { color: currentTheme.textSecondary }]}>
                    {mode.body}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.contextReadCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <Text style={[styles.contextReadTitle, { color: currentTheme.text }]}>
              {tr("AI 目前讀到的狀態", "What AI currently sees", "Lo que la IA ve ahora")}
            </Text>
            <Text style={[styles.contextReadBody, { color: currentTheme.textSecondary }]}>
              {tr(
                "助手會用這些 app 內真實進度作為今天回答的基礎。",
                "The assistant uses these real in-app signals as today’s ground truth.",
                "El asistente usa estas señales reales de la app como base de sus respuestas de hoy."
              )}
            </Text>
            <View style={styles.contextReadChipWrap}>
              {visibleContextChips.map((chip) => (
                <View
                  key={chip}
                  style={[styles.contextReadChip, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}
                >
                  <Text style={[styles.contextReadChipText, { color: currentTheme.text }]}>
                    {chip}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {selectedMode ? (
            <View style={[styles.activeModeCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
              <View style={styles.activeModeHeader}>
                <Text style={[styles.activeModeEyebrow, { color: currentTheme.primary }]}>
                  {t.activeMode}
                </Text>
                <Text style={[styles.activeModeTitle, { color: currentTheme.text }]}>
                  {selectedMode.id === "inquiry" && selectedInquiryPreset
                    ? `${selectedMode.title} · ${selectedInquiryPreset.title}`
                    : selectedMode.title}
                </Text>
              </View>
              <Text style={[styles.activeModeBody, { color: currentTheme.textSecondary }]}>
                {selectedMode.id === "course" ? t.modeReadyCourse : t.modeReady}
              </Text>
              {selectedMode.id === "inquiry" ? (
                <Text style={[styles.activeModeHint, { color: currentTheme.primary }]}>
                  {tr(
                    "會以：我看到什麼 / 這可能代表什麼 / 你現在可以如何溫柔覺察 回應",
                    "Replies follow: What I notice / What it may mean / What to gently observe next",
                    "Responderá con: Lo que percibo / Lo que podría significar / Qué observar con suavidad ahora"
                  )}
                </Text>
              ) : null}
              <TouchableOpacity
                style={[styles.activeModeButton, { borderColor: currentTheme.primary, backgroundColor: `${currentTheme.primary}12` }]}
                activeOpacity={0.85}
                onPress={selectedMode.id === "course" ? generateMeditation : sendMessage}
                disabled={(selectedMode.id !== "course" && (!inputText.trim() || isLoading)) || isGenerating}
              >
                <Text style={[styles.activeModeButtonText, { color: currentTheme.primary }]}>
                  {selectedMode.id === "course" ? t.modeUseCourse : t.modeUseChat}
                </Text>
              </TouchableOpacity>
              {selectedMode.id === "blessing" && latestAssistantMessage.trim() ? (
                <TouchableOpacity
                  style={[styles.activeModeButton, styles.activeModeSecondaryButton, { borderColor: currentTheme.border, backgroundColor: currentTheme.background }]}
                  activeOpacity={0.85}
                  onPress={handleUseBlessingInGarden}
                >
                  <Text style={[styles.activeModeButtonText, { color: currentTheme.text }]}>
                    {t.useInGarden}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {selectedMode?.id === "inquiry" ? (
            <View style={[styles.inquiryPresetsCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
              <Text style={[styles.inquiryPresetsTitle, { color: currentTheme.text }]}>
                {t.inquiryPresetsTitle}
              </Text>
              <View style={styles.inquiryPresetsGrid}>
                {inquiryPresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.inquiryPresetChip, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}
                    activeOpacity={0.85}
                    onPress={() => handleInquiryPresetPress(preset)}
                  >
                    <Text style={[styles.inquiryPresetChipText, { color: currentTheme.text }]}>
                      {preset.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {spiritualLenses.length > 0 ? (
                <>
                  <Text style={[styles.inquiryLensesTitle, { color: currentTheme.textSecondary }]}>
                    {t.inquiryLensesTitle}
                  </Text>
                  <View style={styles.inquiryLensStack}>
                    {spiritualLenses.map((lens) => (
                      <View
                        key={lens.id}
                        style={[styles.inquiryLensCard, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}
                      >
                        <Text style={[styles.inquiryLensTitle, { color: currentTheme.text }]}>
                          {lens.title}
                        </Text>
                        <Text style={[styles.inquiryLensBody, { color: currentTheme.textSecondary }]}>
                          {lens.body}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}

          {selectedMode?.id === "blessing" ? (
            <View style={[styles.inquiryPresetsCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
              <Text style={[styles.inquiryPresetsTitle, { color: currentTheme.text }]}>
                {tr("祝福語氣", "Blessing tone", "Tono de bendición")}
              </Text>
              <View style={styles.inquiryPresetsGrid}>
                {blessingPresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.inquiryPresetChip, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}
                    activeOpacity={0.85}
                    onPress={() => handleBlessingPresetPress(preset)}
                  >
                    <Text style={[styles.inquiryPresetChipText, { color: currentTheme.text }]}>
                      {preset.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedBlessingPreset ? (
                <Text style={[styles.inquiryLensesTitle, { color: currentTheme.textSecondary }]}>
                  {tr(
                    `目前語氣：${selectedBlessingPreset.title}`,
                    `Current tone: ${selectedBlessingPreset.title}`,
                    `Tono actual: ${selectedBlessingPreset.title}`
                  )}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={[styles.aiJourneyCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <Text style={[styles.aiJourneyTitle, { color: currentTheme.text }]}>
              {tr("AI 課程旅程", "AI Journey", "Viaje AI")}
            </Text>
            <Text style={[styles.aiJourneyBody, { color: currentTheme.textSecondary }]}>
              {aiJourneyCopy}
            </Text>
            <View style={styles.aiJourneyStats}>
              <View style={[styles.aiJourneyPill, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.aiJourneyPillText, { color: currentTheme.primary }]}>
                  {tr(
                    `已生成 ${missionStats.customMeditationsCreated}`,
                    `Created ${missionStats.customMeditationsCreated}`,
                    `Creadas ${missionStats.customMeditationsCreated}`
                  )}
                </Text>
              </View>
              <View style={[styles.aiJourneyPill, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.aiJourneyPillText, { color: currentTheme.primary }]}>
                  {tr(
                    `已完成 ${missionStats.customMeditationsCompleted}`,
                    `Completed ${missionStats.customMeditationsCompleted}`,
                    `Completadas ${missionStats.customMeditationsCompleted}`
                  )}
                </Text>
              </View>
            </View>
            {latestCustomMeditation ? (
              <TouchableOpacity
                style={[styles.aiJourneyButton, { borderColor: currentTheme.primary }]}
                onPress={() => router.push(`/meditation/${latestCustomMeditation.id}`)}
                activeOpacity={0.85}
              >
                <Text style={[styles.aiJourneyButtonText, { color: currentTheme.primary }]}>
                  {aiJourneyPrimaryActionLabel}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.aiJourneyButton, styles.aiJourneySecondaryButton, { borderColor: currentTheme.border }]}
              onPress={() => router.push(missionStats.customMeditationsCompleted === 0 ? "/meditate" : "/progress")}
              activeOpacity={0.85}
            >
              <Text style={[styles.aiJourneyButtonText, { color: currentTheme.textSecondary }]}>
                {aiJourneySecondaryActionLabel}
              </Text>
            </TouchableOpacity>
          </View>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper,
              ]}
            >
              {!message.isUser && (
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={currentTheme.gradient as any}
                    style={styles.avatar}
                  >
                    <Bot color="#FFFFFF" size={20} />
                  </LinearGradient>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessage : [styles.aiMessage, { backgroundColor: currentTheme.card }],
                ]}
              >
                {message.isUser ? (
                  <Text style={[styles.messageText, styles.userMessageText]}>
                    {message.text}
                  </Text>
                ) : (
                  <>
                    {renderAssistantMessage(message.text)}
                    {message.action ? (
                      <TouchableOpacity
                        style={[styles.messageActionButton, { borderColor: currentTheme.primary, backgroundColor: `${currentTheme.primary}12` }]}
                        onPress={() => router.push(message.action!.pathname as any)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.messageActionText, { color: currentTheme.primary }]}>
                          {message.action.label}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                )}
              </View>
              {message.isUser && (
                <View style={styles.avatarContainer}>
                  <View style={[styles.userAvatar, { backgroundColor: currentTheme.surface }]}>
                    <User color={currentTheme.primary} size={20} />
                  </View>
                </View>
              )}
            </View>
          ))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={currentTheme.primary} />
              <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
                {t.thinking}
              </Text>
            </View>
          )}

          {showGenerateButton && !isLoading && (
            <View style={styles.generateButtonContainer}>
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: currentTheme.primary }]}
                onPress={generateMeditation}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.generateButtonText}>{t.generating}</Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.generateButtonText}>{t.generateButton}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {(messages.length === 1 || messages.filter(m => m.isUser).length === 0) && (
          <View style={[styles.promptsContainer, { backgroundColor: currentTheme.surface, borderTopColor: currentTheme.border }]}>
            <Text style={[styles.promptsTitle, { color: currentTheme.textSecondary }]}>
              {t.quickPrompts}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.promptsScroll}
            >
              {getMeditationPromptsForLanguage(language).map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.promptButton, { backgroundColor: currentTheme.background }]}
                  onPress={() => handlePromptPress(prompt)}
                >
                  <Text style={[styles.promptText, { color: currentTheme.text }]}>
                    {prompt}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: currentTheme.surface, borderTopColor: currentTheme.border, paddingBottom: insets.bottom + 78 }]}>
          <TextInput
            style={[styles.input, { backgroundColor: currentTheme.background, color: currentTheme.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={selectedMode?.prompt ?? t.inputPlaceholder}
            placeholderTextColor={currentTheme.textSecondary}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: currentTheme.primary },
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Send color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {toastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastOpacity,
              backgroundColor: currentTheme.primary,
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginHorizontal: 12,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 18,
  },
  aiJourneyCard: {
    borderRadius: 22,
    borderWidth: 0.5,
    padding: 18,
    marginBottom: 16,
  },
  aiModesCard: {
    borderRadius: 22,
    borderWidth: 0.5,
    padding: 18,
    marginBottom: 16,
  },
  aiModesTitle: {
    fontSize: 17,
    fontWeight: "800" as const,
    marginBottom: 12,
  },
  aiModesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  aiModeTile: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: "48%",
    minHeight: 108,
  },
  aiModeTitle: {
    fontSize: 14,
    fontWeight: "800" as const,
    marginBottom: 4,
  },
  aiModeBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  contextReadCard: {
    borderRadius: 22,
    borderWidth: 0.5,
    padding: 18,
    marginBottom: 16,
  },
  contextReadTitle: {
    fontSize: 15,
    fontWeight: "800" as const,
    marginBottom: 6,
  },
  contextReadBody: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  contextReadChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  contextReadChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  contextReadChipText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  activeModeCard: {
    borderRadius: 22,
    borderWidth: 0.5,
    padding: 18,
    marginBottom: 16,
  },
  activeModeHeader: {
    marginBottom: 8,
  },
  activeModeEyebrow: {
    fontSize: 11,
    fontWeight: "800" as const,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  activeModeTitle: {
    fontSize: 16,
    fontWeight: "800" as const,
  },
  activeModeBody: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  activeModeHint: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  activeModeButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeModeSecondaryButton: {
    marginTop: 10,
  },
  activeModeButtonText: {
    fontSize: 12,
    fontWeight: "800" as const,
  },
  messageActionButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageActionText: {
    fontSize: 12,
    fontWeight: "800" as const,
  },
  inquiryPresetsCard: {
    borderRadius: 22,
    borderWidth: 0.5,
    padding: 18,
    marginBottom: 16,
  },
  inquiryPresetsTitle: {
    fontSize: 15,
    fontWeight: "800" as const,
    marginBottom: 12,
  },
  inquiryLensesTitle: {
    fontSize: 12,
    fontWeight: "800" as const,
    marginTop: 14,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inquiryPresetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inquiryPresetChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inquiryPresetChipText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  inquiryLensStack: {
    gap: 10,
  },
  inquiryLensCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inquiryLensTitle: {
    fontSize: 13,
    fontWeight: "800" as const,
    marginBottom: 4,
  },
  inquiryLensBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  aiQuotaCard: {
    borderRadius: 22,
    borderWidth: 0.5,
    padding: 18,
    marginBottom: 16,
  },
  aiQuotaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  aiQuotaTitle: {
    fontSize: 17,
    fontWeight: "800" as const,
    marginBottom: 6,
  },
  aiQuotaBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  aiQuotaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  aiQuotaPillText: {
    fontSize: 12,
    fontWeight: "900" as const,
  },
  aiQuotaStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  aiQuotaChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  aiQuotaChipText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  aiQuotaActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  aiQuotaAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  aiQuotaActionText: {
    fontSize: 12,
    fontWeight: "800" as const,
  },
  aiQuotaFootnote: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
  },
  aiJourneyTitle: {
    fontSize: 17,
    fontWeight: "800" as const,
    marginBottom: 6,
  },
  aiJourneyBody: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  aiJourneyStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  aiJourneyPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  aiJourneyPillText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  aiJourneyButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  aiJourneySecondaryButton: {
    marginTop: 10,
  },
  aiJourneyButtonText: {
    fontSize: 12,
    fontWeight: "800" as const,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessageWrapper: {
    justifyContent: "flex-end",
  },
  aiMessageWrapper: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "74%",
    padding: 13,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: "#8B5CF6",
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  aiMessageText: {
    color: "#1F2937",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 52,
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: "#6B7280",
    fontSize: 14,
  },
  generateButtonContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  promptsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  promptsTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  promptsScroll: {
    flexDirection: "row",
  },
  promptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    marginRight: 8,
  },
  promptText: {
    fontSize: 14,
    color: "#4B5563",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
    color: "#1F2937",
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  guidedMeditationsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  meditationsScroll: {
    flexDirection: "row",
  },
  meditationCard: {
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  meditationCardGradient: {
    padding: 16,
    alignItems: "center",
    width: 120,
  },
  meditationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 8,
    textAlign: "center",
  },
  meditationDuration: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  toastContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 22,
  },
});
