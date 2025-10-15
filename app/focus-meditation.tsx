import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { Brain, Clock, Play, Star } from "lucide-react-native";
import { MEDITATION_SESSIONS } from "@/constants/meditations";
import { useSettings } from "@/providers/SettingsProvider";

const TRANSLATIONS = {
  en: {
    title: "Focus Meditations",
    subtitle: "Enhance concentration & clarity",
    recommended: "Recommended for Focus",
    min: "min",
  },
  zh: {
    title: "專注冥想",
    subtitle: "提升專注力與清晰度",
    recommended: "推薦專注冥想",
    min: "分鐘",
  },
};

export default function FocusMeditationScreen() {
  const { settings, currentTheme } = useSettings();
  const lang = settings.language;
  const t = TRANSLATIONS[lang];

  const focusSessions = MEDITATION_SESSIONS.filter(
    (session) => session.category === "focus"
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <LinearGradient
        colors={["#43E97B", "#38F9D7"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <View>
              <View style={styles.iconContainer}>
                <Brain size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.subtitle}>{t.subtitle}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          {t.recommended}
        </Text>

        <View style={styles.sessionsList}>
          {focusSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => router.push(`/meditation/${session.id}`)}
              testID={`focus-session-${session.id}`}
            >
              <LinearGradient
                colors={session.gradient as any}
                style={styles.sessionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sessionContent}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <Text style={styles.sessionDescription}>
                      {session.description}
                    </Text>
                    <View style={styles.sessionMeta}>
                      <Clock size={14} color="#E0E7FF" />
                      <Text style={styles.sessionDuration}>
                        {session.duration} {t.min}
                      </Text>
                      <Star size={14} color="#FCD34D" />
                      <Text style={styles.sessionNarrator}>
                        {session.narrator}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.playIconContainer}>
                    <Play size={24} color="#FFFFFF" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
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
    paddingTop: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
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
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  sessionDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 12,
    lineHeight: 20,
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionDuration: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
    marginRight: 12,
  },
  sessionNarrator: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  playIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSpacing: {
    height: 40,
  },
});