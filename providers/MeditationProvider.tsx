import { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Language } from "./SettingsProvider";

interface MeditationStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  lastSessionDate: string | null;
  weekProgress: boolean[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface DailyAffirmation {
  text: string;
  author: string;
  date: string;
}

export interface CustomMeditation {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  duration: number;
  script: string;
  scriptZh: string;
  category: string;
  createdAt: string;
  gradient: string[];
}

const INITIAL_STATS: MeditationStats = {
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  lastSessionDate: null,
  weekProgress: [false, false, false, false, false, false, false],
};

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-session",
    title: "First Steps",
    description: "Complete your first meditation",
    icon: "🌱",
    unlocked: false,
  },
  {
    id: "week-streak",
    title: "Week Warrior",
    description: "7 day streak",
    icon: "🔥",
    unlocked: false,
  },
  {
    id: "10-sessions",
    title: "Dedicated",
    description: "Complete 10 sessions",
    icon: "⭐",
    unlocked: false,
  },
  {
    id: "hour-milestone",
    title: "Hour Power",
    description: "Meditate for 1 hour total",
    icon: "⏰",
    unlocked: false,
  },
];

export const [MeditationProvider, useMeditation] = createContextHook(() => {
  const [stats, setStats] = useState<MeditationStats>(INITIAL_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [dailyAffirmation, setDailyAffirmation] = useState<DailyAffirmation | null>(null);
  const [isGeneratingAffirmation, setIsGeneratingAffirmation] = useState<boolean>(false);
  const [customMeditations, setCustomMeditations] = useState<CustomMeditation[]>([]);

  const loadStats = useCallback(async () => {
    try {
      const savedStats = await AsyncStorage.getItem("meditationStats");
      const savedAchievements = await AsyncStorage.getItem("achievements");
      const savedCustomMeditations = await AsyncStorage.getItem("customMeditations");
      
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        setStats(parsed);
        updateWeekProgress(parsed);
      }
      
      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements));
      }

      if (savedCustomMeditations) {
        setCustomMeditations(JSON.parse(savedCustomMeditations));
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, []);

  const loadOrGenerateAffirmation = useCallback(async (language: Language = "en") => {
    try {
      const today = new Date().toDateString();
      const savedAffirmation = await AsyncStorage.getItem("dailyAffirmation");
      
      if (savedAffirmation) {
        const parsed: DailyAffirmation = JSON.parse(savedAffirmation);
        
        if (parsed.date === today) {
          setDailyAffirmation(parsed);
          return;
        }
      }
      
      await generateDailyAffirmation(language);
    } catch (error) {
      console.error("Error loading affirmation:", error);
    }
  }, []);

  const generateDailyAffirmation = useCallback(async (language: Language = "en") => {
    try {
      setIsGeneratingAffirmation(true);
      console.log("Generating daily affirmation with AI...");
      
      const prompt = language === "zh" 
        ? `生成一句關於冥想和正念的勵志肯定語句。
要求：
- 積極向上並充滿力量
- 與平和、正念或個人成長相關
- 15-30個字
- 使用現在時態
- 用繁體中文書寫

只回應肯定語句本身，不要其他內容。`
        : `Generate a single inspirational affirmation for meditation and mindfulness practice. 
The affirmation should be:
- Positive and empowering
- Related to peace, mindfulness, or personal growth
- Between 15-30 words
- Written in present tense

Respond with ONLY the affirmation text, nothing else.`;
      
      const response = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      const data = await response.json();
      
      const affirmation: DailyAffirmation = {
        text: data.completion.trim(),
        author: language === "zh" ? "每日肯定" : "Daily Inspiration",
        date: new Date().toDateString(),
      };
      
      setDailyAffirmation(affirmation);
      await AsyncStorage.setItem("dailyAffirmation", JSON.stringify(affirmation));
      
      console.log("Daily affirmation generated:", affirmation.text);
    } catch (error) {
      console.error("Error generating affirmation:", error);
      
      const fallback: DailyAffirmation = {
        text: language === "zh" 
          ? "我與過去、現在和未來的一切和平共處。"
          : "I am at peace with all that has happened, is happening, and will happen.",
        author: language === "zh" ? "佛教智慧" : "Buddhist Wisdom",
        date: new Date().toDateString(),
      };
      setDailyAffirmation(fallback);
    } finally {
      setIsGeneratingAffirmation(false);
    }
  }, []);

  const updateWeekProgress = (currentStats: MeditationStats) => {
    const today = new Date().getDay();
    const lastSession = currentStats.lastSessionDate ? new Date(currentStats.lastSessionDate) : null;
    
    if (lastSession && lastSession.toDateString() === new Date().toDateString()) {
      const newWeekProgress = [...currentStats.weekProgress];
      newWeekProgress[today] = true;
      setStats({ ...currentStats, weekProgress: newWeekProgress });
    }
  };

  const completeMeditation = useCallback(async (sessionId: string, duration: number) => {
    const today = new Date();
    const todayStr = today.toDateString();
    const lastSession = stats.lastSessionDate ? new Date(stats.lastSessionDate) : null;
    
    let newStreak = stats.currentStreak;
    if (!lastSession || lastSession.toDateString() !== todayStr) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastSession && lastSession.toDateString() === yesterday.toDateString()) {
        newStreak += 1;
      } else if (!lastSession || lastSession.toDateString() !== todayStr) {
        newStreak = 1;
      }
    }

    const newWeekProgress = [...stats.weekProgress];
    newWeekProgress[today.getDay()] = true;

    const newStats: MeditationStats = {
      totalSessions: stats.totalSessions + 1,
      totalMinutes: stats.totalMinutes + duration,
      currentStreak: newStreak,
      lastSessionDate: todayStr,
      weekProgress: newWeekProgress,
    };

    setStats(newStats);
    await AsyncStorage.setItem("meditationStats", JSON.stringify(newStats));

    // Check achievements
    const newAchievements = [...achievements];
    let updated = false;

    if (newStats.totalSessions === 1 && !newAchievements[0].unlocked) {
      newAchievements[0].unlocked = true;
      updated = true;
    }

    if (newStats.currentStreak >= 7 && !newAchievements[1].unlocked) {
      newAchievements[1].unlocked = true;
      updated = true;
    }

    if (newStats.totalSessions >= 10 && !newAchievements[2].unlocked) {
      newAchievements[2].unlocked = true;
      updated = true;
    }

    if (newStats.totalMinutes >= 60 && !newAchievements[3].unlocked) {
      newAchievements[3].unlocked = true;
      updated = true;
    }

    if (updated) {
      setAchievements(newAchievements);
      await AsyncStorage.setItem("achievements", JSON.stringify(newAchievements));
    }
  }, [stats, achievements]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const initializeAffirmation = useCallback((language: Language) => {
    void loadOrGenerateAffirmation(language);
  }, [loadOrGenerateAffirmation]);

  const addCustomMeditation = useCallback(async (meditation: Omit<CustomMeditation, "id" | "createdAt">) => {
    const newMeditation: CustomMeditation = {
      ...meditation,
      id: `custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newMeditation, ...customMeditations];
    setCustomMeditations(updated);
    await AsyncStorage.setItem("customMeditations", JSON.stringify(updated));
    
    console.log("Custom meditation added:", newMeditation.title);
    return newMeditation;
  }, [customMeditations]);

  const deleteCustomMeditation = useCallback(async (id: string) => {
    const updated = customMeditations.filter(m => m.id !== id);
    setCustomMeditations(updated);
    await AsyncStorage.setItem("customMeditations", JSON.stringify(updated));
    console.log("Custom meditation deleted:", id);
  }, [customMeditations]);

  return useMemo(
    () => ({
      stats,
      achievements,
      completeMeditation,
      dailyAffirmation,
      isGeneratingAffirmation,
      refreshAffirmation: generateDailyAffirmation,
      initializeAffirmation,
      customMeditations,
      addCustomMeditation,
      deleteCustomMeditation,
    }),
    [stats, achievements, completeMeditation, dailyAffirmation, isGeneratingAffirmation, generateDailyAffirmation, initializeAffirmation, customMeditations, addCustomMeditation, deleteCustomMeditation]
  );
});