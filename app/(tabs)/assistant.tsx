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
import { Send, Bot, User, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSettings } from "@/providers/SettingsProvider";
import { useMeditation } from "@/providers/MeditationProvider";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

type Language = 'en' | 'zh';

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
  },
};

export default function AssistantScreen() {
  const { currentTheme, settings } = useSettings();
  const { addCustomMeditation } = useMeditation();
  const language = settings.language as Language;
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: TRANSLATIONS[language].welcome,
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
  const scrollViewRef = useRef<ScrollView>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    setMessages([{
      id: "1",
      text: TRANSLATIONS[language].welcome,
      isUser: false,
      timestamp: new Date(),
    }]);
    setShowGenerateButton(false);
  }, [language]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
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
                ? `You are a professional meditation and spiritual guidance AI assistant. Your tasks are:
1. Provide personalized meditation guidance and advice
2. Help users relax and reduce stress and anxiety
3. Teach various meditation techniques (breathing, mindfulness, visualization, etc.)
4. Answer questions about meditation and spiritual growth
5. Provide positive guidance and encouragement
6. Recommend suitable meditation practices based on user needs

Please respond in a warm, supportive, and professional tone. Keep answers concise, clear, and practical. Use English.`
                : `你是一個專業的冥想和靈性指導AI助手。你的任務是：
1. 提供個性化的冥想指導和建議
2. 幫助用戶放鬆身心，減輕壓力和焦慮
3. 教授各種冥想技巧（呼吸法、正念、觀想等）
4. 回答關於冥想、靈性成長的問題
5. 提供積極正面的引導和鼓勵
6. 根據用戶的需求推薦合適的冥想練習

請用溫暖、支持和專業的語氣回應。回答要簡潔明瞭，實用性強。使用繁體中文。`,
            },
            ...messages.map((msg) => ({
              role: msg.isUser ? "user" : "assistant",
              content: msg.text,
            })),
            {
              role: "user",
              content: inputText,
            },
          ],
        }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.completion,
        isUser: false,
        timestamp: new Date(),
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
    setIsGenerating(true);
    try {
      const conversationContext = messages
        .filter(m => m.isUser)
        .map(m => m.text)
        .join(" ");

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
                ? `Generate a personalized guided meditation script based on the user's conversation.
STRICT OUTPUT FORMAT (Do not add any other text):
Title: [Meditation title]
Duration: [Duration in minutes, integer only]
Script: [Full text to be spoken by TTS. Do not include 'Script:' label here, just the text.]

The script should be 200-300 words. Use plain text.`
                : `根據用戶的對話生成個性化的引導冥想腳本。
嚴格輸出格式（不要添加其他文字）：
標題：[冥想標題]
時長：[分鐘數，僅數字]
腳本：[TTS朗讀的完整文本。不要在此處包含'腳本：'標籤，僅包含文本。]

腳本保持200-300字。使用純文本。`
            },
            {
              role: "user",
              content: language === 'en'
                ? `Generate a meditation for me based on: ${conversationContext}`
                : `請根據以下內容為我生成冥想：${conversationContext}`
            }
          ],
        }),
      });

      const data = await response.json();
      const meditationText = data.completion;

      // Robust regex to handle potential markdown and spacing
      const titleMatch = meditationText.match(/(?:^|\n)(?:[*#\s]*)(?:Title|標題)(?:[*#\s]*)\s*[:：]\s*(.+)/i);
      const durationMatch = meditationText.match(/(?:^|\n)(?:[*#\s]*)(?:Duration|時長)(?:[*#\s]*)\s*[:：]\s*(\d+)/i);
      
      // Match Script label and everything after it
      const scriptMatch = meditationText.match(/(?:^|\n)(?:[*#\s]*)(?:Script|腳本)(?:[*#\s]*)\s*[:：]\s*([\s\S]+)/i);

      const title = titleMatch ? titleMatch[1].trim() : (language === 'en' ? "Personal Meditation" : "專屬冥想");
      const duration = durationMatch ? parseInt(durationMatch[1]) : 10;
      
      // If script match fails, try to use the whole text but strip title/duration if possible, or just use it all.
      let script = scriptMatch ? scriptMatch[1].trim() : meditationText;
      
      // Fallback cleanup if regex failed but structure exists
      if (!scriptMatch && (titleMatch || durationMatch)) {
         // If we found title or duration but not script, likely the script is the rest of the text
         // This is a naive heuristic but better than nothing
         const lines = meditationText.split('\n');
         const contentLines = lines.filter((line: string) => 
           !line.match(/(?:Title|標題)[：:]/i) && 
           !line.match(/(?:Duration|時長)[：:]/i)
         );
         if (contentLines.length > 0) {
           script = contentLines.join('\n').trim();
         }
      }

      await addCustomMeditation({
        title,
        script,
        duration,
        language,
      });

      console.log("Meditation saved to Library");

      showToast(t.toastSaved);
      setShowGenerateButton(false);
    } catch (error) {
      console.error("Error generating meditation:", error);
    } finally {
      setIsGenerating(false);
    }
  };



  const handlePromptPress = (prompt: string) => {
    setInputText(prompt);
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
                <Text
                  style={[
                    styles.messageText,
                    message.isUser ? styles.userMessageText : [styles.aiMessageText, { color: currentTheme.text }],
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
              {MEDITATION_PROMPTS[language].map((prompt, index) => (
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
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
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
    padding: 16,
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
    maxWidth: "70%",
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: "#8B5CF6",
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    paddingVertical: 12,
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
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
