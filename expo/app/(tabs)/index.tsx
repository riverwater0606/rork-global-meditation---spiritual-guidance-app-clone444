import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Play, Clock, Heart, Moon, Brain, Zap, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useMeditation } from "@/providers/MeditationProvider";
import { useUser } from "@/providers/UserProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { DAILY_AFFIRMATIONS } from "@/constants/affirmations";
import { SPIRITUAL_QUOTES } from "@/constants/quotes";
import { MEDITATION_SESSIONS } from "@/constants/meditations";
import { Orb3DPreview } from "@/components/Orb3DPreview";


SplashScreen.preventAutoHideAsync().catch(() => {});

export default function HomeScreen() {
  const { stats, currentOrb } = useMeditation();
  const { profile, isVerified } = useUser();
  const { currentTheme, settings } = useSettings();
  const [affirmation, setAffirmation] = useState(DAILY_AFFIRMATIONS[0]);
  const [dailyQuote, setDailyQuote] = useState(SPIRITUAL_QUOTES[0]);
  const isWeb = Platform.OS === 'web';

  const lang = settings.language;

  useEffect(() => {
    const today = new Date().getDay();
    setAffirmation(DAILY_AFFIRMATIONS[today % DAILY_AFFIRMATIONS.length]);
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setDailyQuote(SPIRITUAL_QUOTES[dayOfYear % SPIRITUAL_QUOTES.length]);
  }, []);

  useEffect(() => {
    async function onLoad() {
      try {
        console.log('[WorldID] onLoad - isWeb:', isWeb, 'isVerified:', isVerified);
        if (isWeb && !isVerified) {
          try {
            const installed = (typeof window !== 'undefined' && (window as any)?.MiniKit?.isInstalled?.()) ?? false;
            console.log('[WorldID] MiniKit.isInstalled():', installed);
          } catch (e) {
            console.warn('[WorldID] MiniKit.isInstalled() check failed:', e);
          }
        }
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    void onLoad();
  }, [isWeb, isVerified]);

  const quickActions = [
    { id: "breathing", title: lang === "zh" ? "呼吸" : "Breathing", icon: Heart, color: "#EC4899" },
    { id: "timer", title: lang === "zh" ? "計時器" : "Timer", icon: Clock, color: "#3B82F6" },
    { id: "sleep", title: lang === "zh" ? "睡眠" : "Sleep", icon: Moon, color: "#8B5CF6" },
    { id: "focus", title: lang === "zh" ? "專注" : "Focus", icon: Brain, color: "#10B981" },
  ];

  const featuredSessions = MEDITATION_SESSIONS.filter(s => s.featured).slice(0, 3);

  const handleQuickAction = (actionId: string) => {
    if (actionId === "breathing") {
      router.push("/breathing");
    } else if (actionId === "timer") {
      router.push("/timer");
    } else {
      router.push("/meditate");
    }
  };







  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={currentTheme.gradient as any}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting(lang)}, {profile.name || (lang === "zh" ? "探索者" : "Seeker")}
              </Text>
              <Text style={styles.subtitle}>
                {lang === "zh" ? "您的旅程繼續" : "Your journey continues"}
              </Text>
              <Text style={styles.quoteText}>
                {lang === "zh" ? dailyQuote.zh : dailyQuote.en}
              </Text>
              <Text style={styles.quoteAuthor}>— {dailyQuote.author}</Text>
            </View>
            <View style={styles.streakContainer}>
              <Zap size={20} color="#FCD34D" />
              <Text style={styles.streakText}>{stats.currentStreak}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Light Orb 3D Preview */}
        <TouchableOpacity
          style={[styles.orbSection, { backgroundColor: currentTheme.card }]}
          onPress={() => router.push('/garden')}
          activeOpacity={0.9}
        >
          <View style={styles.orbHeader}>
            <View style={styles.orbTitleRow}>
              <Sparkles size={20} color={currentTheme.primary} />
              <Text style={[styles.orbTitle, { color: currentTheme.text }]}>
                {lang === 'zh' ? '你的光球' : 'Your Light Orb'}
              </Text>
            </View>
            <View style={styles.orbBadge}>
              <Text style={[styles.orbBadgeText, { color: currentTheme.primary }]}>
                {currentOrb.layers.length}/7
              </Text>
            </View>
          </View>
          <Orb3DPreview orb={currentOrb} size={180} />
          <View style={styles.orbFooter}>
            <Text style={[styles.orbStatus, { color: currentTheme.textSecondary }]}>
              {currentOrb.isAwakened 
                ? (lang === 'zh' ? '✨ 已覺醒' : '✨ Awakened')
                : (lang === 'zh' ? '🌱 成長中' : '🌱 Growing')
              }
            </Text>
            <Text style={[styles.orbCTA, { color: currentTheme.primary }]}>
              {lang === 'zh' ? '進入花園 →' : 'Enter Garden →'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Daily Affirmation */}
        <View style={[styles.affirmationCard, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.affirmationLabel, { color: currentTheme.primary }]}>
            {lang === "zh" ? "今日肯定語" : "Today's Affirmation"}
          </Text>
          <Text style={[styles.affirmationText, { color: currentTheme.text }]}>
            {lang === "zh" ? affirmation.zh : affirmation.en}
          </Text>
          <Text style={[styles.affirmationAuthor, { color: currentTheme.textSecondary }]}>
            - {lang === "zh" ? affirmation.authorZh : affirmation.author}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.id}
                style={styles.quickAction}
                onPress={() => handleQuickAction(action.id)}
                testID={`quick-action-${action.id}`}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + "20" }]}>
                  <Icon size={24} color={action.color} />
                </View>
                <Text style={[styles.quickActionText, { color: currentTheme.textSecondary }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Featured Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
              {lang === "zh" ? "精選課程" : "Featured Sessions"}
            </Text>
            <TouchableOpacity onPress={() => router.push("/meditate")}>
              <Text style={[styles.seeAll, { color: currentTheme.primary }]}>
                {lang === "zh" ? "查看全部" : "See all"}
              </Text>
            </TouchableOpacity>
          </View>

          {featuredSessions.map((session) => (
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
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <Text style={styles.sessionDuration}>{session.duration} min</Text>
                  </View>
                  <Play size={20} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.statValue, { color: currentTheme.primary }]}>
              {stats.totalSessions}
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              {lang === "zh" ? "課程" : "Sessions"}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.statValue, { color: currentTheme.primary }]}>
              {Math.floor(stats.totalMinutes / 60)}h
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              {lang === "zh" ? "總時間" : "Total Time"}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.statValue, { color: currentTheme.primary }]}>
              {stats.currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              {lang === "zh" ? "連續天數" : "Day Streak"}
            </Text>
          </View>
        </View>


      </ScrollView>
    </View>
  );
}

function getGreeting(lang: "en" | "zh" = "en") {
  const hour = new Date().getHours();
  const greetings = {
    morning: { en: "Good morning", zh: "早安" },
    afternoon: { en: "Good afternoon", zh: "午安" },
    evening: { en: "Good evening", zh: "晚安" },
  };
  
  if (hour < 12) return greetings.morning[lang];
  if (hour < 18) return greetings.afternoon[lang];
  return greetings.evening[lang];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#e0e0ff",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "500" as const,
    color: "#b0b0ff",
    marginTop: 4,
  },
  quoteText: {
    fontSize: 14,
    color: "#E0E7FF",
    marginTop: 12,
    fontStyle: "italic" as const,
    lineHeight: 20,
  },
  quoteAuthor: {
    fontSize: 12,
    color: "rgba(224, 231, 255, 0.8)",
    marginTop: 6,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  orbSection: {
    backgroundColor: 'rgba(20,20,40,0.4)',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  orbHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orbTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orbTitle: {
    fontSize: 20,
    fontWeight: '900' as const,
    letterSpacing: 0.5,
  },
  orbBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  orbBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  orbFooter: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  orbStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  orbCTA: {
    fontSize: 14,
    fontWeight: '700',
  },
  orbSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  affirmationCard: {
    backgroundColor: 'rgba(20,20,40,0.4)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  affirmationLabel: {
    fontSize: 14,
    color: "#a78bfa",
    fontWeight: "700" as const,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  affirmationText: {
    fontSize: 17,
    color: "#e0e0ff",
    lineHeight: 26,
    fontStyle: "italic" as const,
    fontWeight: "500" as const,
  },
  affirmationAuthor: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  quickAction: {
    alignItems: "center",
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  quickActionText: {
    fontSize: 13,
    color: "#b0b0ff",
    fontWeight: "600" as const,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900" as const,
    color: "#e0e0ff",
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: 15,
    color: "#a78bfa",
    fontWeight: "700" as const,
  },
  sessionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: 'rgba(139,92,246,0.4)',
  },
  sessionGradient: {
    padding: 16,
  },
  sessionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 14,
    color: "#E0E7FF",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'rgba(20,20,40,0.4)',
    padding: 18,
    borderRadius: 24,
    alignItems: "center",
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900" as const,
    color: "#a78bfa",
  },
  statLabel: {
    fontSize: 13,
    color: "#b0b0ff",
    marginTop: 4,
    fontWeight: "500" as const,
  },
  worldBanner: {
    backgroundColor: "#111827",
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  worldBannerTitle: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "700",
  },
  worldBannerError: {
    color: "#FCA5A5",
    marginTop: 6,
    fontSize: 12,
  },
  verifyingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  verifyingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  verifyingSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  verifyingDebug: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.6,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});