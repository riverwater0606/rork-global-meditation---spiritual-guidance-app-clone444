import React, { useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Headphones, Search, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import {
  CATEGORIES,
  getLocalizedContent,
  MeditationSession,
  SupportedLanguage,
} from "@/constants/meditations";
import { useSettings } from "@/providers/SettingsProvider";
import { CustomMeditationSession, useMeditation } from "@/providers/MeditationProvider";

const { width } = Dimensions.get("window");

type Session = MeditationSession | CustomMeditationSession;

const getDurationMinutes = (session: Session) => {
  const rawDuration = (session as any).duration;
  const numeric = Number(rawDuration);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return Math.round(numeric);
  }
  return 0;
};

const TRANSLATIONS: Record<
  SupportedLanguage,
  { title: string; search: string; all: string; customBadge: string }
> = {
  en: {
    title: "Meditation Library",
    search: "Search meditations...",
    all: "All",
    customBadge: "AI Guided",
  },
  zh: {
    title: "冥想資源庫",
    search: "搜尋冥想課程...",
    all: "全部",
    customBadge: "AI 引導",
  },
};

const isCustomSession = (session: Session): session is CustomMeditationSession => {
  return (session as CustomMeditationSession).source !== undefined;
};

export default function MeditateScreen() {
  const { currentTheme, settings } = useSettings();
  const { getAllSessions } = useMeditation();
  const language = settings.language as SupportedLanguage;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const t = TRANSLATIONS[language];

  const sessions = useMemo(() => getAllSessions(), [getAllSessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const localized = getLocalizedContent(session, language);
      const matchesSearch =
        localized.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        localized.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || session.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [sessions, searchQuery, selectedCategory, language]);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={currentTheme.gradient as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <Text style={styles.title}>{t.title}</Text>

          <View style={[styles.searchContainer, { backgroundColor: currentTheme.surface }]}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={[styles.searchInput, { color: currentTheme.text }]}
              placeholder={t.search}
              placeholderTextColor={currentTheme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
              style={[
                styles.categoryChip,
                { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
                selectedCategory === category.id && {
                  backgroundColor: currentTheme.primary,
                  borderColor: currentTheme.primary,
                },
              ]}
              onPress={() => setSelectedCategory(category.id)}
              testID={`category-${category.id}`}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: currentTheme.textSecondary },
                  selectedCategory === category.id && { color: "#FFFFFF" },
                ]}
              >
              {category.id === "all" ? t.all : category.name[language] ?? category.name.en}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>

        <View style={styles.sessionsGrid}>
          {filteredSessions.map((session, index) => {
            const localized = getLocalizedContent(session, language);
            const durationMinutes = getDurationMinutes(session);
            const narratorName = session.narrator || (language === "zh" ? "AI 引導" : "AI Guidance");
            return (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionCard,
                  index % 2 === 0 ? styles.sessionCardLeft : styles.sessionCardRight,
                ]}
                onPress={() => router.push(`/meditation/${session.id}`)}
                testID={`meditation-${session.id}`}
              >
                <LinearGradient
                  colors={session.gradient as [string, string]}
                  style={styles.sessionCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.sessionCardContent}>
                    <View style={styles.sessionCardHeader}>
                      <Text style={styles.sessionCardTitle}>{localized.title}</Text>
                      {isCustomSession(session) && (
                        <View style={styles.badge}>
                          <Sparkles size={12} color="#FCD34D" />
                          <Text style={styles.badgeText}>{t.customBadge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.sessionCardDescription} numberOfLines={2}>
                      {localized.description}
                    </Text>

                    <View style={styles.sessionCardMeta}>
                      <View style={styles.sessionCardMetaItem}>
                        <Clock size={14} color="#E0E7FF" />
                        <Text style={styles.sessionCardMetaText}>
                          {durationMinutes} {language === "zh" ? "分鐘" : "min"}
                        </Text>
                      </View>
                      <View style={styles.sessionCardMetaItem}>
                        <Headphones size={14} color="#E0E7FF" />
                        <Text style={styles.sessionCardMetaText}>{narratorName}</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  categoriesContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sessionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
  },
  sessionCard: {
    width: (width - 50) / 2,
    marginBottom: 15,
    borderRadius: 12,
    overflow: "hidden",
  },
  sessionCardLeft: {
    marginRight: 10,
  },
  sessionCardRight: {
    marginLeft: 0,
  },
  sessionCardGradient: {
    padding: 20,
  },
  sessionCardContent: {
    gap: 12,
  },
  sessionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
  },
  sessionCardDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    lineHeight: 20,
  },
  sessionCardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sessionCardMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionCardMetaText: {
    fontSize: 14,
    color: "#E0E7FF",
    fontWeight: "500",
  },
  bottomSpacing: {
    height: 40,
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
});
