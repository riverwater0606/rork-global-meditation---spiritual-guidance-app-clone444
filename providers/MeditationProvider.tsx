import { useState, useEffect, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

interface CustomMeditation {
  id: string;
  title: string;
  script: string;
  duration: number;
  language: "en" | "zh";
  createdAt: string;
  breathingMethod?: string;
  gradient?: [string, string];
}

type OrbStage = "growing" | "awakened" | "legendary" | "eternal";

export interface Orb {
  id: string;
  level: number;
  layers: string[]; // Colors
  isAwakened: boolean;
  createdAt: string;
  stage: OrbStage;
  cultivationDays: number;
  completedAt?: string;
  sender?: string;
  message?: string;
}

export const CHAKRA_COLORS = [
  "#FF0000", // Root - Red
  "#FF7F00", // Sacral - Orange
  "#FFFF00", // Solar Plexus - Yellow
  "#00FF00", // Heart - Green
  "#0000FF", // Throat - Blue
  "#4B0082", // Third Eye - Indigo
  "#9400D3", // Crown - Violet
];

const INITIAL_STATS: MeditationStats = {
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  lastSessionDate: null,
  weekProgress: [false, false, false, false, false, false, false],
};

const INITIAL_ORB: Orb = {
  id: "orb-init",
  level: 0,
  layers: [],
  isAwakened: false,
  createdAt: new Date().toISOString(),
  stage: "growing",
  cultivationDays: 0,
};

const hydrateOrb = (candidate: Partial<Orb>): Orb => {
  const normalizedLayers = Array.isArray(candidate.layers) ? candidate.layers : [];
  const normalizedStage = candidate.stage ?? (candidate.isAwakened ? "awakened" : "growing");
  const normalizedDays = typeof candidate.cultivationDays === "number" ? candidate.cultivationDays : 0;

  return {
    ...INITIAL_ORB,
    ...candidate,
    layers: normalizedLayers,
    stage: normalizedStage,
    cultivationDays: normalizedDays,
  } as Orb;
};

const createFreshOrb = (): Orb => ({
  id: `orb-${Date.now()}`,
  level: 0,
  layers: [],
  isAwakened: false,
  createdAt: new Date().toISOString(),
  stage: "growing",
  cultivationDays: 0,
});

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
  const [customMeditations, setCustomMeditations] = useState<CustomMeditation[]>([]);
  const [currentOrb, setCurrentOrb] = useState<Orb>(INITIAL_ORB);
  const [orbHistory, setOrbHistory] = useState<Orb[]>([]);

  const persistCurrentOrb = async (nextOrb: Orb) => {
    setCurrentOrb(nextOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(nextOrb));
  };

  const persistOrbHistory = async (history: Orb[]) => {
    setOrbHistory(history);
    await AsyncStorage.setItem("orbHistory", JSON.stringify(history));
  };

  const updateWeekProgress = useCallback((currentStats: MeditationStats) => {
    const today = new Date().getDay();
    const lastSession = currentStats.lastSessionDate ? new Date(currentStats.lastSessionDate) : null;
    
    if (lastSession && lastSession.toDateString() === new Date().toDateString()) {
      const newWeekProgress = [...currentStats.weekProgress];
      newWeekProgress[today] = true;
      setStats({ ...currentStats, weekProgress: newWeekProgress });
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const savedStats = await AsyncStorage.getItem("meditationStats");
      const savedAchievements = await AsyncStorage.getItem("achievements");
      
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        setStats(parsed);
        updateWeekProgress(parsed);
      }
      
      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements));
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [updateWeekProgress]);

  const loadCustomMeditations = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem("customMeditations");
      if (saved) {
        setCustomMeditations(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading custom meditations:", error);
    }
  }, []);

  const loadOrbData = useCallback(async () => {
    try {
      const savedOrb = await AsyncStorage.getItem("currentOrb");
      const savedHistory = await AsyncStorage.getItem("orbHistory");
      if (savedOrb) {
        try {
          const parsedOrb = JSON.parse(savedOrb);
          setCurrentOrb(hydrateOrb(parsedOrb));
        } catch (parseError) {
          console.error("Failed to parse stored orb", parseError);
        }
      }
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          if (Array.isArray(parsedHistory)) {
            const normalizedHistory = parsedHistory.map((entry: Partial<Orb>) => hydrateOrb(entry));
            setOrbHistory(normalizedHistory);
          }
        } catch (historyError) {
          console.error("Failed to parse orb history", historyError);
        }
      }
    } catch (e) {
      console.error("Failed to load orb data", e);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadCustomMeditations();
    loadOrbData();
  }, [loadStats, loadCustomMeditations, loadOrbData]);

  const completeMeditation = async (sessionId: string, duration: number) => {
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

    // Orb Logic
    const alreadyMeditatedToday = lastSession && lastSession.toDateString() === todayStr;
    if (!alreadyMeditatedToday && currentOrb.level < 7) {
      const nextLevel = Math.min(7, currentOrb.level + 1);
      const nextLayerColor = CHAKRA_COLORS[currentOrb.layers.length % CHAKRA_COLORS.length];
      const isAdvancedStage = currentOrb.stage === "legendary" || currentOrb.stage === "eternal";
      const updatedOrb: Orb = {
        ...currentOrb,
        level: nextLevel,
        layers: [...currentOrb.layers, nextLayerColor].slice(0, nextLevel),
        isAwakened: nextLevel === 7,
        stage: nextLevel === 7 ? (isAdvancedStage ? currentOrb.stage : "awakened") : "growing",
        cultivationDays: (currentOrb.cultivationDays ?? 0) + 1,
        completedAt: nextLevel === 7 ? new Date().toISOString() : currentOrb.completedAt,
      };
      await persistCurrentOrb(updatedOrb);
    }

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
  };

  const deleteCustomMeditation = async (id: string) => {
    const updated = customMeditations.filter(m => m.id !== id);
    setCustomMeditations(updated);
    await AsyncStorage.setItem("customMeditations", JSON.stringify(updated));
  };

  const updateCustomMeditation = async (id: string, updates: Partial<CustomMeditation>) => {
    const updated = customMeditations.map(m => m.id === id ? { ...m, ...updates } : m);
    setCustomMeditations(updated);
    await AsyncStorage.setItem("customMeditations", JSON.stringify(updated));
  };

  const addCustomMeditation = async (meditation: Omit<CustomMeditation, "id" | "createdAt">) => {
    const newMeditation: CustomMeditation = {
      ...meditation,
      id: `custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      breathingMethod: "4-7-8",
      gradient: ["#8B5CF6", "#6366F1"],
    };
    const updated = [...customMeditations, newMeditation];
    setCustomMeditations(updated);
    await AsyncStorage.setItem("customMeditations", JSON.stringify(updated));
    return newMeditation;
  };

  const sendOrb = async (friendId: string, message: string) => {
    const archivedOrb = { ...currentOrb, sender: "Me", message };
    const newHistory = [archivedOrb, ...orbHistory];
    await persistOrbHistory(newHistory);

    const nextOrb = createFreshOrb();
    await persistCurrentOrb(nextOrb);
  };

  const devAddLayer = async () => {
    if (currentOrb.level >= 7) {
      console.log("[MeditationProvider] DevAddLayer ignored, already max layers");
      return;
    }
    const nextColor = CHAKRA_COLORS[currentOrb.layers.length % CHAKRA_COLORS.length];
    const nextLevel = currentOrb.level + 1;
    const isAdvancedStage = currentOrb.stage === "legendary" || currentOrb.stage === "eternal";
    const updatedOrb: Orb = {
      ...currentOrb,
      level: nextLevel,
      layers: [...currentOrb.layers, nextColor],
      isAwakened: nextLevel === 7,
      stage: nextLevel === 7 ? (isAdvancedStage ? currentOrb.stage : "awakened") : "growing",
      cultivationDays: (currentOrb.cultivationDays ?? 0) + 1,
      completedAt: nextLevel === 7 ? new Date().toISOString() : currentOrb.completedAt,
    };
    console.log("[MeditationProvider] DevAddLayer applied", updatedOrb.level);
    await persistCurrentOrb(updatedOrb);
  };

  const devForceStage = async (stage: OrbStage, targetDays: number) => {
    const forcedOrb: Orb = {
      ...currentOrb,
      level: 7,
      layers: CHAKRA_COLORS.slice(0, 7),
      isAwakened: true,
      stage,
      cultivationDays: targetDays,
      completedAt: new Date().toISOString(),
    };
    console.log("[MeditationProvider] DevForceStage", stage, targetDays);
    await persistCurrentOrb(forcedOrb);
  };

  const devSendOrbToSelf = async () => {
    console.log("[MeditationProvider] DevSendOrbToSelf triggered");
    await sendOrb("dev-self", "Developer self transfer");
  };

  const devResetOrb = async () => {
    console.log("[MeditationProvider] DevResetOrb resetting to seed state");
    await persistCurrentOrb(createFreshOrb());
  };

  return {
    stats,
    achievements,
    customMeditations,
    currentOrb,
    orbHistory,
    completeMeditation,
    addCustomMeditation,
    deleteCustomMeditation,
    updateCustomMeditation,
    sendOrb,
    devAddLayer,
    devForceStage,
    devSendOrbToSelf,
    devResetOrb,
  };
});
