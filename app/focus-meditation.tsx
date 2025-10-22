import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { Brain, Clock, Play, Sparkles, Star } from "lucide-react-native";
import { MEDITATION_SESSIONS, getLocalizedContent, SupportedLanguage } from "@/constants/meditations";
import { useSettings } from "@/providers/SettingsProvider";
import { CustomMeditationSession, useMeditation } from "@/providers/MeditationProvider";

const TRANSLATIONS: Record<SupportedLanguage, {
  title: string;
  subtitle: string;
  recommended: string;
  minutes: string;
  badge: string;
}> = {
  en: {
    title: "Focus Meditations",
    subtitle: "Enhance concentration & clarity",
    recommended: "Recommended for Focus",
    minutes: "min",
    badge: "AI Guided",
  },
  zh: {
    title: "專注冥想",
    subtitle: "提升專注力與清晰度",
    recommended: "推薦專注冥想",
    minutes: "分鐘",
    badge: "AI 引導",
  },
};

const isCustom = (
  session: (typeof MEDITATION_SESSIONS)[number] | CustomMeditationSession
): session is CustomMeditationSession => {
  return (session as CustomMeditationSession).source !== undefined;
};

const getDurationMinutes = (session: (typeof MEDITATION_SESSIONS)[number] | CustomMeditationSession) => {
  const parsed = Number(session.duration);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  const fallback = Number.parseInt(String((session as any).duration ?? ""), 10);
  return Number.isFinite(fallback) && fallback >= 0 ? fallback : 0;
};

export default function FocusMeditationScreen() {
  const { settings, currentTheme } = useSettings();
  const { customSessions } = useMeditation();
  const lang = settings.language as SupportedLanguage;
  const t = TRANSLATIONS[lang];

  const catalogSessions = MEDITATION_SESSIONS.filter((session) => session.category === "focus");
  const personalizedSessions = customSessions.filter((session) => session.category === "focus");
  const focusSessions = [...personalizedSessions, ...catalogSessions];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={["#43E97B", "#38F9D7"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Sparkles size={28} color="#FFFFFF" />
            </View>
            <View style={styles.iconContainer}>
              <Brain size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t.recommended}</Text>

        <View style={styles.sessionsList}>
          {focusSessions.map((session) => {
            const localized = getLocalizedContent(session, lang);
            const durationMinutes = getDurationMinutes(session);
            const narratorName = session.narrator || (lang === "zh" ? "AI 引導" : "AI Guide");
            return (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => router.push(`/meditation/${session.id}`)}
                testID={`focus-session-${session.id}`}
              >
                <LinearGradient
                  colors={session.gradient as [string, string]}
                  style={styles.sessionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.sessionContent}>
                    <View style={styles.sessionInfo}>
                      <View style={styles.sessionHeaderRow}>
                        <Text style={styles.sessionTitle}>{localized.title}</Text>
                        {isCustom(session) && (
                          <View style={styles.badge}>
                            <Sparkles size={12} color="#FCD34D" />
                            <Text style={styles.badgeText}>{t.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.sessionDescription}>{localized.description}</Text>
                      <View style={styles.sessionMeta}>
                        <Clock size={14} color="#E0E7FF" />
                        <Text style={styles.sessionDuration}>
                          {durationMinutes} {t.minutes}
                        </Text>
                        <Star size={14} color="#FCD34D" />
                        <Text style={styles.sessionNarrator}>{narratorName}</Text>
                      </View>
                    </View>
                    <View style={styles.playIconContainer}>
                      <Play size={24} color="#FFFFFF" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}

          {focusSessions.length === 0 && (
            <View style={[styles.emptyState, { borderColor: currentTheme.border }]}>
              <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                {lang === "zh" ? "目前沒有專注冥想課程" : "No focus meditations yet"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 40,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 18,
    color: "#E0E7FF",
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sessionsList: {
    gap: 16,
  },
  sessionCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  sessionGradient: {
    padding: 20,
  },
  sessionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
    marginRight: 16,
    gap: 12,
  },
  sessionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  sessionDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    lineHeight: 20,
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionDuration: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  sessionNarrator: {
    fontSize: 14,
    color: "#E0E7FF",
    fontWeight: "600",
  },
  playIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(252, 211, 77, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    color: "#FCD34D",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  emptyState: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  bottomSpacing: {
    height: 40,
  },
});
