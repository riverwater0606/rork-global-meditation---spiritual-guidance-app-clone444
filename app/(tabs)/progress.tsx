import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { TrendingUp, Calendar, Award, Target, Clock, BookOpen } from "lucide-react-native";
import { useMeditation } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { fetchMeditationHistory, MeditationRecord } from "@/lib/firebaseMeditations";
import { getFirebaseAuthUser, waitForFirebaseAuth } from "@/constants/firebase";

const { width } = Dimensions.get("window");

export default function ProgressScreen() {
  const { currentTheme, settings } = useSettings();
  const { stats, achievements } = useMeditation();
  const { walletAddress } = useUser();
  const lang = settings.language;

  const [meditationHistory, setMeditationHistory] = useState<MeditationRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"success" | "failed" | "missing">("missing");
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [userIdSource, setUserIdSource] = useState<"wallet" | "auth" | "none">("none");
  const pollInFlightRef = useRef(false);

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const currentDay = new Date().getDay();

  const loadHistory = useCallback(async () => {
    if (!resolvedUserId || pollInFlightRef.current) return;
    
    pollInFlightRef.current = true;
    console.log("[ProgressScreen] Loading meditation history...");
    
    try {
      const history = await fetchMeditationHistory({ userId: resolvedUserId, limit: 50 });
      setMeditationHistory(history);
      setSyncStatus("success");
      console.log("[ProgressScreen] Loaded history count:", history.length);
    } catch (e) {
      console.error("[ProgressScreen] Failed to load history:", e);
      setSyncStatus("failed");
    } finally {
      pollInFlightRef.current = false;
      setIsLoadingHistory(false);
    }
  }, [resolvedUserId]);

  useEffect(() => {
    let isActive = true;
    const resolveUser = async () => {
      if (walletAddress) {
        if (isActive) {
          setResolvedUserId(walletAddress);
          setUserIdSource("wallet");
        }
        return;
      }

      const authUser = getFirebaseAuthUser() ?? await waitForFirebaseAuth();
      if (isActive) {
        if (authUser?.uid) {
          setResolvedUserId(authUser.uid);
          setUserIdSource("auth");
        } else {
          setResolvedUserId(null);
          setUserIdSource("none");
        }
      }
    };

    void resolveUser();
    return () => {
      isActive = false;
    };
  }, [walletAddress]);

  useEffect(() => {
    if (!resolvedUserId) {
      setSyncStatus("missing");
    }

    if (resolvedUserId) {
      setIsLoadingHistory(true);
      loadHistory();

      const intervalId = setInterval(loadHistory, 30000);

      const subscription = AppState.addEventListener("change", (nextAppState) => {
        if (nextAppState === "active") {
          console.log("[ProgressScreen] App became active, refreshing history");
          loadHistory();
        }
      });

      return () => {
        clearInterval(intervalId);
        subscription.remove();
      };
    }
  }, [resolvedUserId, loadHistory]);

  const formattedUserId = resolvedUserId
    ? userIdSource === "wallet"
      ? `${resolvedUserId.slice(0, 6)}...${resolvedUserId.slice(-4)}`
      : `${resolvedUserId.slice(0, 8)}...${resolvedUserId.slice(-6)}`
    : null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${month}/${day} ${hours}:${minutes}`;
  };

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
        <View style={[styles.syncBanner, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.syncBannerText, { color: currentTheme.textSecondary }]}>
            Firebase Sync: {syncStatus === "success" ? "Success" : syncStatus === "failed" ? "Failed" : "Missing userId"}
          </Text>
          <Text style={[styles.syncBannerText, { color: currentTheme.textSecondary }]}>
            {lang === "zh" ? "使用者來源" : "User source"}: {userIdSource === "wallet" ? "Wallet" : userIdSource === "auth" ? "Auth UID" : "None"}{formattedUserId ? ` (${formattedUserId})` : ""}
          </Text>
        </View>
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
                  <Text style={[styles.dayLabel, { color: currentTheme.textSecondary }, isToday && { color: currentTheme.primary, fontWeight: "bold" as const }]}>
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

        {/* Meditation History */}
        {resolvedUserId && (
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                {lang === "zh" ? "冥想記錄" : "Meditation History"}
              </Text>
              {isLoadingHistory && <ActivityIndicator size="small" color="#8b5cf6" />}
            </View>
            
            {meditationHistory.length === 0 && !isLoadingHistory ? (
              <View style={[styles.emptyHistory, { backgroundColor: currentTheme.surface }]}>
                <BookOpen size={32} color={currentTheme.textSecondary} />
                <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                  {lang === "zh" ? "尚無冥想記錄" : "No meditation records yet"}
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {meditationHistory.slice(0, 20).map((record) => (
                  <View 
                    key={record.id} 
                    style={[styles.historyItem, { backgroundColor: currentTheme.surface }]}
                  >
                    <View style={styles.historyLeft}>
                      <View style={styles.historyIconContainer}>
                        <Clock size={18} color="#8b5cf6" />
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={[styles.historyCourseName, { color: currentTheme.text }]} numberOfLines={1}>
                          {record.courseName}
                        </Text>
                        <Text style={[styles.historyDate, { color: currentTheme.textSecondary }]}>
                          {formatDate(record.date)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={[styles.historyDuration, { color: currentTheme.text }]}>
                        {record.duration} {lang === "zh" ? "分鐘" : "min"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

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
  syncBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#8b5cf6",
    backgroundColor: "rgba(20,20,40,0.4)",
  },
  syncBannerText: {
    fontSize: 13,
    fontWeight: "600" as const,
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
    fontWeight: "500" as const,
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
    fontWeight: "bold" as const,
  },
  historyContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  emptyHistory: {
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyCourseName: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
  },
  historyRight: {
    marginLeft: 12,
  },
  historyDuration: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#8b5cf6",
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
