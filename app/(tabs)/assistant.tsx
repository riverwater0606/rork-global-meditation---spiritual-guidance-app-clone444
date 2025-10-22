import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Bot, Loader2, PlayCircle, PlusCircle, Send, Sparkles, User } from "lucide-react-native";
import { GUIDED_MEDITATIONS } from "@/constants/meditationGuidance";
import { useSettings } from "@/providers/SettingsProvider";
import { CustomMeditationSession, useMeditation } from "@/providers/MeditationProvider";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

type Language = "en" | "zh";

type TranslationConfig = {
  title: string;
  welcome: string;
  inputPlaceholder: string;
  thinking: string;
  error: string;
  quickPrompts: string;
  guidedMeditations: string;
  minutes: string;
  createCourse: string;
  formTitle: string;
  formDescription: string;
  formDuration: string;
  formTitlePlaceholder: string;
  formGoalPlaceholder: string;
  formDurationPlaceholder: string;
  cancel: string;
  generate: string;
  success: (title: string) => string;
};

const CONVERSATION_STORAGE_KEY = "assistantConversation";

const MEDITATION_PROMPTS: Record<Language, string[]> = {
  en: ["I'm feeling stressed", "How to start meditating?", "Help me relax", "Improve sleep quality"],
  zh: ["我感到壓力很大", "如何開始冥想？", "幫我放鬆身心", "改善睡眠品質"],
};

const TRANSLATIONS: Record<Language, TranslationConfig> = {
  en: {
    title: "AI Meditation Assistant",
    welcome:
      "Hello! I'm your meditation AI assistant. I can help you with:\n\n• Personalized meditation guidance\n• Answer meditation-related questions\n• Recommend suitable meditation practices\n• Help you relax and reduce stress\n\nHow can I help you today?",
    inputPlaceholder: "Type your question...",
    thinking: "AI is thinking...",
    error: "Sorry, an error occurred. Please try again later.",
    quickPrompts: "Quick prompts:",
    guidedMeditations: "Guided Meditation Practices",
    minutes: "minutes",
    createCourse: "Create Custom Meditation",
    formTitle: "Meditation Title",
    formDescription: "Intent or focus",
    formDuration: "Duration (minutes)",
    formTitlePlaceholder: "e.g. Evening Calm",
    formGoalPlaceholder: "Describe how you want to feel...",
    formDurationPlaceholder: "10",
    cancel: "Cancel",
    generate: "Generate",
    success: (title) => `I've created \"${title}\" for you. Would you like to listen now?`,
  },
  zh: {
    title: "AI 冥想助手",
    welcome:
      "你好！我是你的冥想AI助手。我可以幫助你：\n\n• 提供個性化的冥想指導\n• 解答冥想相關問題\n• 推薦適合的冥想練習\n• 幫助你放鬆和減壓\n\n請問有什麼可以幫助你的嗎？",
    inputPlaceholder: "輸入你的問題...",
    thinking: "AI 正在思考...",
    error: "抱歉，發生了錯誤。請稍後再試。",
    quickPrompts: "快速提問：",
    guidedMeditations: "引導冥想練習",
    minutes: "分鐘",
    createCourse: "建立客製冥想",
    formTitle: "冥想課程名稱",
    formDescription: "目的或重點",
    formDuration: "時長（分鐘）",
    formTitlePlaceholder: "例如：夜間放鬆",
    formGoalPlaceholder: "描述你想達到的感受...",
    formDurationPlaceholder: "10",
    cancel: "取消",
    generate: "生成",
    success: (title) => `已為你建立「${title}」課程，現在開始嗎？`,
  },
};

const serializeMessages = (messages: Message[]) =>
  messages.map(({ id, text, isUser, timestamp }) => ({ id, text, isUser, timestamp: timestamp.toISOString() }));

const safeParseJSON = <T = unknown>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Failed to parse JSON", error);
    return null;
  }
};

const deserializeMessages = (raw: string | null): Message[] => {
  if (!raw) return [];
  const parsed = safeParseJSON<{ id: string; text: string; isUser: boolean; timestamp: string }[]>(raw);
  if (!parsed) return [];
  return parsed.map((item) => ({ ...item, timestamp: new Date(item.timestamp) }));
};

const FALLBACK_REPLIES: Record<Language, { keywords: string[]; response: string }[]> = {
  en: [
    {
      keywords: ["sleep", "insomnia", "night"],
      response:
        "Let's create a relaxing evening wind-down. Try slowing your breath to a 4-6 rhythm, soften your shoulders, and picture a gentle wave washing away the day."
    },
    {
      keywords: ["focus", "work", "study"],
      response:
        "Begin with three deep breaths, then set a 20 minute focus timer. Keep your attention on the coolness of the inhale and warmth of the exhale, and return to it whenever distraction appears."
    },
    {
      keywords: ["stress", "anxiety", "overwhelm"],
      response:
        "Place a hand on your chest, breathe in for four counts, out for six, and silently repeat ‘I am safe, I am present.’ Let the exhale soften your jaw and abdomen."
    },
    {
      keywords: ["gratitude", "joy", "thank"],
      response:
        "Close your eyes and recall one supportive person, one comforting place, and one moment of lightness from today. Breathe them in with appreciation, exhale a quiet thank you."
    }
  ],
  zh: [
    {
      keywords: ["睡", "失眠", "夜"],
      response: "今晚先做三次深長呼吸，吸氣四拍、吐氣六拍，想像海浪慢慢拍打沙灘，讓肩頸逐步放鬆。"
    },
    {
      keywords: ["專注", "工作", "讀書"],
      response: "請先做三次覺察式呼吸，接著設定 20 分鐘專注時段。心念飄走時，輕輕帶回鼻尖的吸氣涼意與吐氣暖度。"
    },
    {
      keywords: ["壓力", "焦慮", "緊張"],
      response: "把手放在胸口，吸氣四拍、吐氣六拍，心中默念「我很安全，我在當下」，讓吐氣帶走下巴與腹部的緊繃。"
    },
    {
      keywords: ["感恩", "喜悅", "謝"],
      response: "閉上眼睛回想一位支持你的的人、一處安心的地方，以及今日一個美好瞬間，吸氣迎向它們，吐氣輕聲道謝。"
    }
  ]
};

const pickFallbackReply = (language: Language, prompt: string) => {
  const normalized = prompt.toLowerCase();
  const entries = FALLBACK_REPLIES[language];
  const matched = entries.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)));
  if (matched) {
    return matched.response;
  }
  return language === "zh"
    ? "先做三次深呼吸，吸氣時覺察身體逐漸擴張，吐氣時讓壓力慢慢溶解，再觀察此刻的情緒與感受。"
    : "Take three gentle breaths, notice how your body expands on the inhale and softens on the exhale, then check in with the emotion that is present right now.";
};

const parseAssistantCompletion = (data: unknown): string | null => {
  if (!data) return null;
  if (typeof data === "string") {
    return data.trim();
  }
  if (typeof (data as { completion?: unknown }).completion === "string") {
    return ((data as { completion: string }).completion || "").trim();
  }
  if (Array.isArray((data as any)?.choices) && (data as any).choices.length > 0) {
    const choice = (data as any).choices[0];
    if (typeof choice?.text === "string") {
      return choice.text.trim();
    }
    if (typeof choice?.message?.content === "string") {
      return choice.message.content.trim();
    }
  }
  if (typeof (data as any)?.message === "string") {
    return (data as any).message.trim();
  }
  if (typeof (data as any)?.data?.text === "string") {
    return (data as any).data.text.trim();
  }
  return null;
};

const extractJsonBlock = (raw: string) => {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : raw;
};

const DEFAULT_CUSTOM_GRADIENT: [string, string] = ["#7F5AF0", "#2CB1BC"];
const DEFAULT_AUDIO_URL = "https://cdn.pixabay.com/download/audio/2021/11/15/audio_4abf43ceab.mp3?filename=meditation-ambient-11254.mp3";

export default function AssistantScreen() {
  const router = useRouter();
  const { currentTheme, settings } = useSettings();
  const { addCustomSession } = useMeditation();
  const language = settings.language as Language;
  const t = TRANSLATIONS[language];
  const storageKey = `${CONVERSATION_STORAGE_KEY}:${language}`;

  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCreatorVisible, setIsCreatorVisible] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [customDuration, setCustomDuration] = useState("10");
  const [isGeneratingSession, setIsGeneratingSession] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadConversation = async () => {
      const stored = await AsyncStorage.getItem(storageKey);
      if (!isMounted) return;
      const restored = deserializeMessages(stored);
      if (restored.length > 0) {
        setMessages(restored);
      } else {
        setMessages([
          {
            id: "welcome",
            text: TRANSLATIONS[language].welcome,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
      setIsHydrated(true);
    };
    void loadConversation();
    return () => {
      isMounted = false;
    };
  }, [language, storageKey]);

  useEffect(() => {
    if (!isHydrated || messages.length === 0) return;
    const toPersist = serializeMessages(messages.slice(-50));
    void AsyncStorage.setItem(storageKey, JSON.stringify(toPersist));
  }, [isHydrated, messages, storageKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const history = [...messages, userMessage];
    setMessages(history);
    setInputText("");
    setIsLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const fallbackText = pickFallbackReply(language, userMessage.text);
    let responseText = "";
    try {
      const response = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                language === "en"
                  ? `You are a professional meditation and spiritual guidance assistant. Respond in a warm, concise, and actionable way. Focus on breathing exercises, mindfulness, stress relief, spiritual alignment, and lifestyle tips.`
                  : `你是一位專業的冥想與靈性指導助手。請以溫暖、具體並可行的方式回應，提供呼吸、正念、放鬆與靈性生活的建議，使用繁體中文。`,
            },
            ...history
              .slice(-10)
              .map((msg) => ({ role: msg.isUser ? "user" : "assistant", content: msg.text })),
          ],
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        responseText = fallbackText;
      } else {
        const raw = await response.text();
        const parsed = safeParseJSON(raw);
        const parsedText = parseAssistantCompletion(parsed ?? raw);
        if (typeof parsedText === "string" && parsedText.trim().length > 0) {
          responseText = parsedText.trim();
        } else if (typeof raw === "string") {
          responseText = raw.trim();
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      responseText = fallbackText;
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }

    const aiText = responseText && responseText.trim().length > 0 ? responseText : fallbackText || t.error;

    const aiMessage: Message = {
      id: `${Date.now()}-ai`,
      text: aiText,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
  };

  const handlePromptPress = (prompt: string) => {
    setInputText(prompt);
  };

  const closeCreator = () => {
    setIsCreatorVisible(false);
    setCustomTitle("");
    setCustomGoal("");
    setCustomDuration("10");
  };

  const generateCustomMeditation = async () => {
    if (!customTitle.trim() || !customGoal.trim()) {
      Alert.alert(language === "zh" ? "請填寫完整資訊" : "Please complete all fields");
      return;
    }

    const duration = Number.parseInt(customDuration, 10) || 10;
    setIsGeneratingSession(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                language === "en"
                  ? `You design bespoke guided meditations. Output valid JSON with the structure:
{
  "title": {"en": string, "zh": string},
  "description": {"en": string, "zh": string},
  "script": {"en": string[], "zh": string[]},
  "narrator": string,
  "category": "mindfulness" | "sleep" | "focus" | "anxiety" | "spiritual",
  "ambientSoundId": "rain" | "ocean" | "forest" | "wind" | "fire" | "meditation" | "tibetan" | "nature"
}
Script arrays should contain short guiding sentences. Ensure both languages are provided.`
                  : `你是一位冥想腳本設計師。請輸出 JSON 格式：
{
  "title": {"en": string, "zh": string},
  "description": {"en": string, "zh": string},
  "script": {"en": string[], "zh": string[]},
  "narrator": string,
  "category": "mindfulness" | "sleep" | "focus" | "anxiety" | "spiritual",
  "ambientSoundId": "rain" | "ocean" | "forest" | "wind" | "fire" | "meditation" | "tibetan" | "nature"
}
Script 使用多行句子，引導使用者完成冥想。`,
            },
            {
              role: "user",
              content:
                language === "en"
                  ? `Create a ${duration}-minute guided meditation named "${customTitle}" focusing on: ${customGoal}`
                  : `請以「${customTitle}」為題，設計 ${duration} 分鐘冥想，引導重點：${customGoal}`,
            },
          ],
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const rawBody = await response.text();
      const parsedResponse = safeParseJSON(rawBody);

      const completionPayload =
        typeof parsedResponse === "string"
          ? parsedResponse
          : parseAssistantCompletion(parsedResponse) ?? "";

      const jsonText = extractJsonBlock(completionPayload);

      let parsed: any = {};
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        console.warn("Failed to parse AI-generated meditation JSON", parseError);
      }

      const normalizeScript = (value: unknown): string[] => {
        if (Array.isArray(value)) {
          return value.map((line) => String(line)).map((line) => line.trim()).filter(Boolean);
        }
        if (typeof value === "string") {
          return value
            .split(/\n+/)
            .map((line) => line.trim())
            .filter(Boolean);
        }
        return [];
      };

      const titleEn = parsed?.title?.en ?? customTitle;
      const titleZh = parsed?.title?.zh ?? customTitle;
      const descriptionEn = parsed?.description?.en ?? customGoal;
      const descriptionZh = parsed?.description?.zh ?? customGoal;
      const scriptEn: string[] = normalizeScript(parsed?.script?.en);
      const scriptZh: string[] = normalizeScript(parsed?.script?.zh);
      const narrator = parsed?.narrator || (language === "zh" ? "AI 引導者" : "AI Guide");
      const ambientSoundId = parsed?.ambientSoundId ?? "meditation";
      const category = parsed?.category ?? "mindfulness";

      const sessionScript =
        language === "zh"
          ? scriptZh.length > 0
            ? scriptZh
            : scriptEn
          : scriptEn.length > 0
            ? scriptEn
            : scriptZh;

      const newSession: CustomMeditationSession = {
        id: `custom-${Date.now()}`,
        category,
        duration,
        narrator,
        gradient: DEFAULT_CUSTOM_GRADIENT,
        featured: false,
        audioUrl: DEFAULT_AUDIO_URL,
        defaultAmbientSoundId: ambientSoundId,
        translations: {
          en: {
            title: titleEn,
            description: descriptionEn,
          },
          zh: {
            title: titleZh,
            description: descriptionZh,
          },
        },
        source: "ai-generated",
        script: sessionScript,
        createdAt: new Date().toISOString(),
        language,
        promptSummary: customGoal,
      };

      await addCustomSession(newSession);

      const confirmation: Message = {
        id: `${Date.now()}-custom`,
        text: t.success(language === "zh" ? titleZh : titleEn),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmation]);
      closeCreator();
      router.push(`/meditation/${newSession.id}`);
    } catch (error) {
      console.error("Failed to create custom meditation", error);
      Alert.alert(language === "zh" ? "生成失敗" : "Generation failed", t.error);
    } finally {
      clearTimeout(timeout);
      setIsGeneratingSession(false);
    }
  };

  const showCreator = () => {
    setIsCreatorVisible(true);
  };

  const shouldShowGuides = useMemo(() => messages.filter((m) => m.isUser).length === 0, [messages]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}> 
      <LinearGradient colors={currentTheme.gradient as [string, string]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Bot color="#FFFFFF" size={28} />
            <Text style={styles.headerTitle}>{t.title}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.createButton} onPress={showCreator}>
              <PlusCircle size={18} color="#FFFFFF" />
              <Text style={styles.createButtonText}>{t.createCourse}</Text>
            </TouchableOpacity>
          </View>
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
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[styles.messageWrapper, message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper]}
            >
              {!message.isUser && (
                <View style={styles.avatarContainer}>
                  <LinearGradient colors={currentTheme.gradient as [string, string]} style={styles.avatar}>
                    <Bot color="#FFFFFF" size={20} />
                  </LinearGradient>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.isUser
                    ? styles.userMessage
                    : [styles.aiMessage, { backgroundColor: currentTheme.card }],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isUser
                      ? styles.userMessageText
                      : [styles.aiMessageText, { color: currentTheme.text }],
                  ]}
                >
                  {message.text}
                </Text>
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
              <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>{t.thinking}</Text>
            </View>
          )}
        </ScrollView>

        {shouldShowGuides && (
          <>
            <View
              style={[styles.guidedMeditationsContainer, {
                backgroundColor: currentTheme.surface,
                borderTopColor: currentTheme.border,
              }]}
            >
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t.guidedMeditations}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.meditationsScroll}>
                {GUIDED_MEDITATIONS.slice(0, 4).map((meditation) => (
                  <TouchableOpacity
                    key={meditation.id}
                    style={styles.meditationCard}
                    onPress={() => router.push(`/guided-session?id=${meditation.id}`)}
                  >
                    <LinearGradient colors={currentTheme.gradient as [string, string]} style={styles.meditationCardGradient}>
                      <PlayCircle color="#FFFFFF" size={24} />
                      <Text style={styles.meditationTitle}>{meditation.title[language]}</Text>
                      <Text style={styles.meditationDuration}>
                        {meditation.duration} {t.minutes}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View
              style={[styles.promptsContainer, {
                backgroundColor: currentTheme.surface,
                borderTopColor: currentTheme.border,
              }]}
            >
              <Text style={[styles.promptsTitle, { color: currentTheme.textSecondary }]}>{t.quickPrompts}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll}>
                {MEDITATION_PROMPTS[language].map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.promptButton, { backgroundColor: currentTheme.background }]}
                    onPress={() => handlePromptPress(prompt)}
                  >
                    <Text style={[styles.promptText, { color: currentTheme.text }]}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        <View style={[styles.inputContainer, { backgroundColor: currentTheme.surface, borderTopColor: currentTheme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: currentTheme.background, color: currentTheme.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t.inputPlaceholder}
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

      <Modal visible={isCreatorVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.surface }]}> 
            <View style={styles.modalHeader}>
              <Sparkles size={20} color={currentTheme.primary} />
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t.createCourse}</Text>
            </View>

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: currentTheme.text }]}>{t.formTitle}</Text>
              <TextInput
                style={[styles.modalInput, { borderColor: currentTheme.border, color: currentTheme.text }]}
                value={customTitle}
                onChangeText={setCustomTitle}
                placeholder={t.formTitlePlaceholder}
                placeholderTextColor={currentTheme.textSecondary}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: currentTheme.text }]}>{t.formDescription}</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea, { borderColor: currentTheme.border, color: currentTheme.text }]}
                value={customGoal}
                onChangeText={setCustomGoal}
                placeholder={t.formGoalPlaceholder}
                placeholderTextColor={currentTheme.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: currentTheme.text }]}>{t.formDuration}</Text>
              <TextInput
                style={[styles.modalInput, { borderColor: currentTheme.border, color: currentTheme.text }]}
                value={customDuration}
                onChangeText={setCustomDuration}
                keyboardType="numeric"
                placeholder={t.formDurationPlaceholder}
                placeholderTextColor={currentTheme.textSecondary}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={closeCreator} disabled={isGeneratingSession}>
                <Text style={styles.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimary, { backgroundColor: currentTheme.primary }]}
                onPress={generateCustomMeditation}
                disabled={isGeneratingSession}
              >
                {isGeneratingSession ? <Loader2 size={18} color="#FFFFFF" /> : <Sparkles size={18} color="#FFFFFF" />}
                <Text style={styles.modalPrimaryText}>{t.generate}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
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
    width: 36,
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  userMessage: {
    backgroundColor: "#4C1D95",
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  aiMessage: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  aiMessageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  guidedMeditationsContainer: {
    borderTopWidth: 1,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  meditationsScroll: {
    paddingLeft: 20,
  },
  meditationCard: {
    marginRight: 12,
    borderRadius: 16,
    overflow: "hidden",
    width: 200,
  },
  meditationCardGradient: {
    padding: 16,
    gap: 12,
  },
  meditationTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  meditationDuration: {
    color: "#E0E7FF",
    fontSize: 12,
  },
  promptsContainer: {
    borderTopWidth: 1,
    paddingVertical: 16,
  },
  promptsTitle: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  promptsScroll: {
    paddingLeft: 20,
  },
  promptButton: {
    marginRight: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  promptText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    maxHeight: 140,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalField: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  modalTextarea: {
    minHeight: 100,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  modalCancel: {
    backgroundColor: "rgba(148, 163, 184, 0.2)",
  },
  modalPrimary: {
    backgroundColor: "#4C1D95",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  modalPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
