import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Moon, Sun, TrendingUp, Clock, Heart, Brain, Bell } from "lucide-react-native";
import { router, Stack } from "expo-router";
import { useSettings } from "@/providers/SettingsProvider";
import { useSleepTracker } from "@/providers/SleepTrackerProvider";



export default function SleepTrackerScreen() {
  const { currentTheme, settings } = useSettings();
  const { sleepData, startSleep, stopSleep, isTracking } = useSleepTracker();
  const lang = settings.language;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (lang === "zh") {
      return `${hours}小時 ${mins}分鐘`;
    }
    return `${hours}h ${mins}m`;
  };

  const getSleepQuality = (minutes: number) => {
    if (minutes >= 420) return { text: lang === "zh" ? "優秀" : "Excellent", color: "#10B981" };
    if (minutes >= 360) return { text: lang === "zh" ? "良好" : "Good", color: "#3B82F6" };
    if (minutes >= 300) return { text: lang === "zh" ? "一般" : "Fair", color: "#F59E0B" };
    return { text: lang === "zh" ? "需改善" : "Needs Improvement", color: "#EF4444" };
  };

  const weekData = sleepData.slice(0, 7);
  const avgSleep = weekData.length > 0
    ? Math.floor(weekData.reduce((sum: number, d: any) => sum + d.duration, 0) / weekData.length)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#1E3A8A", "#312E81"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {lang === "zh" ? "睡眠追蹤" : "Sleep Tracker"}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/settings/notifications")}
            >
              <Bell size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.trackingCard, { backgroundColor: currentTheme.surface }]}>
          <Moon size={48} color="#8B5CF6" />
          <Text style={[styles.trackingTitle, { color: currentTheme.text }]}>
            {isTracking
              ? lang === "zh" ? "正在追蹤睡眠..." : "Tracking Sleep..."
              : lang === "zh" ? "開始追蹤睡眠" : "Start Sleep Tracking"}
          </Text>
          <TouchableOpacity
            style={[
              styles.trackingButton,
              { backgroundColor: isTracking ? "#EF4444" : currentTheme.primary },
            ]}
            onPress={isTracking ? stopSleep : startSleep}
          >
            <Text style={styles.trackingButtonText}>
              {isTracking
                ? lang === "zh" ? "停止追蹤" : "Stop Tracking"
                : lang === "zh" ? "開始睡眠" : "Start Sleep"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: currentTheme.surface }]}>
            <Clock size={24} color="#3B82F6" />
            <Text style={[styles.statValue, { color: currentTheme.text }]}>
              {formatDuration(avgSleep)}
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              {lang === "zh" ? "平均睡眠" : "Avg Sleep"}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: currentTheme.surface }]}>
            <TrendingUp size={24} color="#10B981" />
            <Text style={[styles.statValue, { color: currentTheme.text }]}>
              {getSleepQuality(avgSleep).text}
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              {lang === "zh" ? "睡眠質量" : "Sleep Quality"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            {lang === "zh" ? "本週睡眠" : "This Week"}
          </Text>
          <View style={[styles.chartCard, { backgroundColor: currentTheme.surface }]}>
            {weekData.length === 0 ? (
              <Text style={[styles.noDataText, { color: currentTheme.textSecondary }]}>
                {lang === "zh" ? "尚無數據" : "No data yet"}
              </Text>
            ) : (
              <View style={styles.chart}>
                {weekData.map((day: any, index: number) => {
                  const quality = getSleepQuality(day.duration);
                  const heightPercent = Math.min((day.duration / 480) * 100, 100);
                  
                  return (
                    <View key={index} style={styles.chartBar}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: quality.color,
                          },
                        ]}
                      />
                      <Text style={[styles.chartLabel, { color: currentTheme.textSecondary }]}>
                        {new Date(day.date).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US", {
                          weekday: "short",
                        })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            {lang === "zh" ? "睡眠建議" : "Sleep Recommendations"}
          </Text>
          <View style={[styles.tipsCard, { backgroundColor: currentTheme.surface }]}>
            <View style={styles.tipItem}>
              <Heart size={20} color="#EC4899" />
              <Text style={[styles.tipText, { color: currentTheme.text }]}>
                {lang === "zh"
                  ? "睡前1小時進行冥想可提高睡眠質量"
                  : "Meditate 1 hour before bed to improve sleep quality"}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Brain size={20} color="#8B5CF6" />
              <Text style={[styles.tipText, { color: currentTheme.text }]}>
                {lang === "zh"
                  ? "保持規律的睡眠時間表"
                  : "Maintain a consistent sleep schedule"}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Sun size={20} color="#F59E0B" />
              <Text style={[styles.tipText, { color: currentTheme.text }]}>
                {lang === "zh"
                  ? "白天多曬太陽，晚上避免藍光"
                  : "Get sunlight during the day, avoid blue light at night"}
              </Text>
            </View>
          </View>
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
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    fontSize: 32,
    color: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  trackingCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trackingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 20,
  },
  trackingButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  trackingButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 15,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  chartCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 20,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 200,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    marginHorizontal: 4,
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 10,
  },
  chartLabel: {
    fontSize: 10,
    marginTop: 8,
  },
  tipsCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 20,
  },
});
