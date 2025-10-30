import React, { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MEDITATION_SESSIONS,
  MeditationSession,
  SupportedLanguage,
} from "@/constants/meditations";

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

export interface CustomMeditationSession extends MeditationSession {
  source: "ai-generated" | "manual";
  script: string[];
  createdAt: string;
  language: SupportedLanguage;
  promptSummary?: string;
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

interface MeditationContext {
  stats: MeditationStats;
  achievements: Achievement[];
  customSessions: CustomMeditationSession[];
  offlineSessions: (MeditationSession | CustomMeditationSession)[];
  completeMeditation: (sessionId: string, duration: number) => Promise<void>;
  addCustomSession: (session: CustomMeditationSession) => Promise<void>;
  removeCustomSession: (sessionId: string) => Promise<void>;
  getSessionById: (id: string) => MeditationSession | CustomMeditationSession | undefined;
  getAllSessions: () => (MeditationSession | CustomMeditationSession)[];
  cacheOfflineSession: (sessionId: string) => Promise<void>;
}

const CUSTOM_SESSIONS_KEY = "customMeditationSessions";
const MEDITATION_STATS_KEY = "meditationStats";
const ACHIEVEMENTS_KEY = "achievements";
const OFFLINE_SESSIONS_KEY = "offlineMeditationSessions";

export const [MeditationProvider, useMeditation] = createContextHook(() => {
  const [stats, setStats] = useState<MeditationStats>(INITIAL_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [customSessions, setCustomSessions] = useState<CustomMeditationSession[]>([]);
  const [offlineSessions, setOfflineSessions] = useState<(MeditationSession | CustomMeditationSession)[]>([]);

  const loadCustomSessions = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(CUSTOM_SESSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CustomMeditationSession[];
        setCustomSessions(parsed);
      }
    } catch (error) {
      console.error("Error loading custom sessions:", error);
    }
  }, []);

  const persistCustomSessions = useCallback(async (sessions: CustomMeditationSession[]) => {
    try {
      await AsyncStorage.setItem(CUSTOM_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Error saving custom sessions:", error);
    }
  }, []);

  const loadOfflineSessions = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(OFFLINE_SESSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as (MeditationSession | CustomMeditationSession)[];
        setOfflineSessions(parsed);
      }
    } catch (error) {
      console.error("Error loading offline sessions:", error);
    }
  }, []);

  const persistOfflineSessions = useCallback(
    async (sessions: (MeditationSession | CustomMeditationSession)[]) => {
      try {
        await AsyncStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(sessions));
      } catch (error) {
        console.error("Error saving offline sessions:", error);
      }
    },
    [],
  );

  const loadStats = useCallback(async () => {
    try {
      const savedStats = await AsyncStorage.getItem(MEDITATION_STATS_KEY);
      const savedAchievements = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);

      if (savedStats) {
        const parsed = JSON.parse(savedStats) as MeditationStats;
        setStats(parsed);
        updateWeekProgress(parsed);
      }

      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements));
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, []);

  const updateWeekProgress = useCallback((currentStats: MeditationStats) => {
    const today = new Date().getDay();
    const lastSession = currentStats.lastSessionDate ? new Date(currentStats.lastSessionDate) : null;

    if (lastSession && lastSession.toDateString() === new Date().toDateString()) {
      const newWeekProgress = [...currentStats.weekProgress];
      newWeekProgress[today] = true;
      setStats({ ...currentStats, weekProgress: newWeekProgress });
    }
  }, []);

  const saveStats = useCallback(async (newStats: MeditationStats) => {
    setStats(newStats);
    await AsyncStorage.setItem(MEDITATION_STATS_KEY, JSON.stringify(newStats));
  }, []);

  const findSessionById = useCallback(
    (id: string) => {
      return (
        customSessions.find((session) => session.id === id) ??
        MEDITATION_SESSIONS.find((session) => session.id === id)
      );
    },
    [customSessions],
  );

  const cacheOfflineSession = useCallback(
    async (sessionId: string) => {
      const session = findSessionById(sessionId);
      if (!session) return;
      setOfflineSessions((prev) => {
        const next = [session, ...prev.filter((item) => item.id !== session.id)].slice(0, 3);
        void persistOfflineSessions(next);
        return next;
      });
    },
    [findSessionById, persistOfflineSessions],
  );

  useEffect(() => {
    void loadStats();
    void loadCustomSessions();
    void loadOfflineSessions();
  }, [loadCustomSessions, loadOfflineSessions, loadStats]);

  const completeMeditation = useCallback(
    async (sessionId: string, duration: number) => {
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

      await saveStats(newStats);

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
        await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(newAchievements));
      }

      void cacheOfflineSession(sessionId);
    },
    [achievements, cacheOfflineSession, saveStats, stats]
  );

  const addCustomSession = useCallback(
    async (session: CustomMeditationSession) => {
      setCustomSessions((prev) => {
        const next = [session, ...prev.filter((s) => s.id !== session.id)];
        void persistCustomSessions(next);
        return next;
      });
    },
    [persistCustomSessions]
  );

  const removeCustomSession = useCallback(
    async (sessionId: string) => {
      setCustomSessions((prev) => {
        const next = prev.filter((session) => session.id !== sessionId);
        void persistCustomSessions(next);
        return next;
      });
    },
    [persistCustomSessions]
  );

  const getAllSessions = useCallback(() => {
    return [...customSessions, ...MEDITATION_SESSIONS];
  }, [customSessions]);

  return useMemo<MeditationContext>(
    () => ({
      stats,
      achievements,
      customSessions,
      offlineSessions,
      completeMeditation,
      addCustomSession,
      removeCustomSession,
      getSessionById: findSessionById,
      getAllSessions,
      cacheOfflineSession,
    }),
    [
      stats,
      achievements,
      customSessions,
      offlineSessions,
      completeMeditation,
      addCustomSession,
      removeCustomSession,
      findSessionById,
      getAllSessions,
      cacheOfflineSession,
    ]
  );
});
