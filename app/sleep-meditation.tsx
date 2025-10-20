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
import { Play, ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";
import { MEDITATION_SESSIONS } from "@/constants/meditations";
import { useSettings } from "@/providers/SettingsProvider";

export default function SleepMeditationScreen() {
  const { currentTheme, settings } = useSettings();
  const lang = settings.language;
  
  const sleepSessions = MEDITATION_SESSIONS.filter(s => s.category === "sleep");

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={["#667EEA", "#764BA2"] as any}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              testID="back-button"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {lang === "zh" ? "睡眠冥想" : "Sleep Meditation"}
            </Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerSubtitle}>
              {lang === "zh" 
                ? "讓心靈安靜，身體放鬆，進入深度睡眠" 
                : "Calm your mind, relax your body, and drift into deep sleep"}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sessionsContainer}>
          {sleepSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => router.push(`/meditation/${session.id}`)}
              testID={`session-${session.id}`}
            >
              <LinearGradient
                colors={session.gradient as any}
                style={styles.sessionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.sessionContent}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>
                      {lang === "zh" ? session.titleZh : session.title}
                    </Text>
                    <Text style={styles.sessionDescription}>
                      {lang === "zh" ? session.descriptionZh : session.description}
                    </Text>
                    <View style={styles.sessionMeta}>
                      <Text style={styles.sessionDuration}>
                        {session.duration} {lang === "zh" ? "分鐘" : "min"}
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
          
          {sleepSessions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                {lang === "zh" 
                  ? "目前沒有可用的睡眠冥想課程" 
                  : "No sleep meditation sessions available"}
              </Text>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  headerContent: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#E0E7FF",
    textAlign: "center",
    lineHeight: 24,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  sessionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sessionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sessionGradient: {
    padding: 20,
  },
  sessionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    color: "#E0E7FF",
    lineHeight: 20,
    marginBottom: 12,
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionDuration: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  sessionNarrator: {
    fontSize: 14,
    color: "#E0E7FF",
    marginLeft: 8,
  },
  playIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
