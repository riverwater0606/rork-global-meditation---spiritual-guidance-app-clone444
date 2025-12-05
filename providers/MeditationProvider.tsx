import { useState, useEffect } from "react";
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

export interface Orb {
  id: string;
  level: number;
  layers: string[]; // Colors
  isAwakened: boolean;
  createdAt: string;
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
  const [customMeditations, setCustomMeditations] = useState<CustomMeditation[]>([]);
  const [currentOrb, setCurrentOrb] = useState<Orb>(INITIAL_ORB);
  const [orbHistory, setOrbHistory] = useState<Orb[]>([]);

  useEffect(() => {
    loadStats();
    loadCustomMeditations();
    loadOrbData();
  }, []);

  const loadStats = async () => {
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
  };

  const loadCustomMeditations = async () => {
    try {
      const saved = await AsyncStorage.getItem("customMeditations");
      if (saved) {
        setCustomMeditations(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading custom meditations:", error);
    }
  };

  const loadOrbData = async () => {
    try {
      const savedOrb = await AsyncStorage.getItem("currentOrb");
      const savedHistory = await AsyncStorage.getItem("orbHistory");
      if (savedOrb) setCurrentOrb(JSON.parse(savedOrb));
      if (savedHistory) setOrbHistory(JSON.parse(savedHistory));
    } catch (e) {
      console.error("Failed to load orb data", e);
    }
  };

  const updateWeekProgress = (currentStats: MeditationStats) => {
    const today = new Date().getDay();
    const lastSession = currentStats.lastSessionDate ? new Date(currentStats.lastSessionDate) : null;
    
    if (lastSession && lastSession.toDateString() === new Date().toDateString()) {
      const newWeekProgress = [...currentStats.weekProgress];
      newWeekProgress[today] = true;
      setStats({ ...currentStats, weekProgress: newWeekProgress });
    }
  };

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
    if (!alreadyMeditatedToday && !currentOrb.isAwakened) {
       const nextLevel = currentOrb.level + 1;
       if (nextLevel <= 7) {
         const newLayer = CHAKRA_COLORS[currentOrb.level % 7];
         const updatedOrb = {
           ...currentOrb,
           level: nextLevel,
           layers: [...currentOrb.layers, newLayer],
           isAwakened: nextLevel === 7,
           completedAt: nextLevel === 7 ? new Date().toISOString() : undefined
         };
         setCurrentOrb(updatedOrb);
         await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));
       }
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

  const addOrbLayer = async (color: string) => {
    const updatedOrb = {
      ...currentOrb,
      layers: [...currentOrb.layers, color],
      level: currentOrb.level + 1,
    };
    setCurrentOrb(updatedOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));
  };

  const setOrbLevel = async (level: number) => {
    const newLayers: string[] = [];
    for (let i = 0; i < Math.min(level, 7); i++) {
      newLayers.push(CHAKRA_COLORS[i % 7]);
    }
    
    const updatedOrb = {
      ...currentOrb,
      level,
      layers: newLayers,
      isAwakened: level >= 21,
      completedAt: level >= 21 ? new Date().toISOString() : undefined,
    };
    setCurrentOrb(updatedOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));
  };

  const sendOrb = async (friendId: string, message: string) => {
    const archivedOrb = { ...currentOrb, sender: "Me", message };
    const newHistory = [archivedOrb, ...orbHistory];
    setOrbHistory(newHistory);
    await AsyncStorage.setItem("orbHistory", JSON.stringify(newHistory));

    let nextOrb: Orb;
    if (currentOrb.isAwakened) {
       nextOrb = {
         ...INITIAL_ORB,
         id: `orb-${Date.now()}`,
         createdAt: new Date().toISOString(),
       };
    } else {
       nextOrb = {
         ...INITIAL_ORB,
         id: `orb-${Date.now()}`,
         createdAt: new Date().toISOString(),
       };
    }
    
    setCurrentOrb(nextOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(nextOrb));
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
    addOrbLayer,
    setOrbLevel,
  };
});
