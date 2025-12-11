import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { TrendingUp, Calendar, Award, Target } from "lucide-react-native";
import { useMeditation } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";

const { width } = Dimensions.get("window");

export default function ProgressScreen() {
  const { currentTheme, settings } = useSettings();
  const { stats, achievements } = useMeditation();
  const lang = settings.language;

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const currentDay = new Date().getDay();

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={currentTheme.gradient as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <Text style={styles.title}>{lang === "zh" ? "你的進展" : "Your Progress"}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: currentTheme.surface }]}>
              <View style={styles.statIcon}>
                <TrendingUp size={24} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: currentTheme.text }]}>{stats.currentStreak}</Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>{lang === "zh" ? "連續天數" : "Day Streak"}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: currentTheme.surface }]}>
              <View style={styles.statIcon}>
                <Calendar size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.statValue, { color: currentTheme.text }]}>{stats.totalSessions}</Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>{lang === "zh" ? "總課程" : "Total Sessions"}</Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: currentTheme.surface }]}>
              <View style={styles.statIcon}>
                <Target size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.statValue, { color: currentTheme.text }]}>{Math.floor(stats.totalMinutes / 60)}h</Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>{lang === "zh" ? "總時間" : "Total Time"}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: currentTheme.surface }]}>
              <View style={styles.statIcon}>
                <Award size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.statValue, { color: currentTheme.text }]}>{achievements.filter(a => a.unlocked).length}</Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>{lang === "zh" ? "成就" : "Achievements"}</Text>
            </View>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.weeklyContainer}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{lang === "zh" ? "本週" : "This Week"}</Text>
          <View style={[styles.weekGrid, { backgroundColor: currentTheme.surface }]}>
            {weekDays.map((day, index) => {
              const isToday = index === currentDay;
              const isCompleted = stats.weekProgress[index];
              
              return (
                <View key={`day-${index}`} style={styles.dayContainer}>
                  <Text style={[styles.dayLabel, { color: currentTheme.textSecondary }, isToday && { color: currentTheme.primary, fontWeight: "bold" }]}>
                    {day}
                  </Text>
                  <View
                    style={[
                      styles.dayCircle,
                      { borderColor: currentTheme.border },
                      isCompleted && styles.dayCircleCompleted,
                      isToday && { borderColor: currentTheme.primary },
                    ]}
                  >
                    {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsContainer}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{lang === "zh" ? "成就" : "Achievements"}</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  { backgroundColor: currentTheme.surface },
                  !achievement.unlocked && styles.achievementCardLocked,
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={[styles.achievementTitle, { color: currentTheme.text }]}>{achievement.title}</Text>
                <Text style={[styles.achievementDescription, { color: currentTheme.textSecondary }]}>
                  {achievement.description}
                </Text>
                {achievement.unlocked && (
                  <View style={styles.achievementBadge}>
                    <Text style={styles.achievementBadgeText}>{lang === "zh" ? "已解鎖" : "Unlocked"}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "900" as const,
    color: "#e0e0ff",
    paddingHorizontal: 20,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "900" as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  weeklyContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900" as const,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  weekGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  dayContainer: {
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "500",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircleCompleted: {
    backgroundColor: "#8b5cf6",
    borderColor: "#8b5cf6",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  achievementsContainer: {
    paddingHorizontal: 20,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  achievementCard: {
    width: (width - 50) / 2,
    padding: 16,
    borderRadius: 24,
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    marginBottom: 4,
    textAlign: "center",
  },
  achievementDescription: {
    fontSize: 12,
    textAlign: "center",
  },
  achievementBadge: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  achievementBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
});