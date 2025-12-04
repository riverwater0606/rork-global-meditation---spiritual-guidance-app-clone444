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

export type OrbStage = 'growing' | 'awakened' | 'legendary' | 'eternal';

export interface Orb {
  id: string;
  level: number;
  layers: string[]; // Colors
  stage: OrbStage;
  minutes: number;
  brightness: number; // 0.0 to 1.0
  createdAt: string;
  completedAt?: string;
  sender?: string;
  message?: string;
  isArchived?: boolean; // If true, it's in the garden collection, not the active one
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

export const ORB_STAGES = {
  AWAKENED: 21,
  LEGENDARY: 49,
  ETERNAL: 108,
};

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
  stage: 'growing',
  minutes: 0,
  brightness: 1.0,
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
    // We award minutes for every session now, or maybe limited? 
    // Prompt says "Every 10 min meditation = stunning visual reward".
    // Let's add minutes regardless of "already meditated", but maybe limit layers per day?
    // Prompt: "Daily meditation → orb absorbs today's color (stack up to 7 layers)"
    // So layers are limited to 1 per day. Minutes are cumulative.

    let updatedOrb = { ...currentOrb };
    let orbChanged = false;

    // Add minutes
    updatedOrb.minutes += duration;
    orbChanged = true;

    // Check Stage
    if (updatedOrb.minutes >= ORB_STAGES.ETERNAL) updatedOrb.stage = 'eternal';
    else if (updatedOrb.minutes >= ORB_STAGES.LEGENDARY) updatedOrb.stage = 'legendary';
    else if (updatedOrb.minutes >= ORB_STAGES.AWAKENED) updatedOrb.stage = 'awakened';

    // Add Layer (only once per day)
    if (!alreadyMeditatedToday && updatedOrb.layers.length < 7) {
       const newLayer = CHAKRA_COLORS[updatedOrb.layers.length % 7];
       updatedOrb.layers = [...updatedOrb.layers, newLayer];
       updatedOrb.level = updatedOrb.layers.length;
       orbChanged = true;
    }

    if (orbChanged) {
        setCurrentOrb(updatedOrb);
        await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));
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
    // Archive current orb
    const archivedOrb = { 
        ...currentOrb, 
        sender: "Me", 
        message, 
        isArchived: true,
        completedAt: new Date().toISOString()
    };
    
    // Add to history (Garden Collection)
    const newHistory = [archivedOrb, ...orbHistory];
    setOrbHistory(newHistory);
    await AsyncStorage.setItem("orbHistory", JSON.stringify(newHistory));

    // Create copy if eligible (70% brightness)
    let nextOrb: Orb;
    
    // Check if we should keep a copy (Awakened+)
    const canKeepCopy = currentOrb.stage !== 'growing'; // Awakened or better
    
    if (canKeepCopy) {
        nextOrb = {
            ...currentOrb,
            id: `orb-${Date.now()}`,
            brightness: 0.7, // Dim copy
            message: undefined,
            sender: undefined,
            createdAt: new Date().toISOString(),
        };
    } else {
        // Reset to new
        nextOrb = {
            ...INITIAL_ORB,
            id: `orb-${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
    }
    
    setCurrentOrb(nextOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(nextOrb));
  };

  const synthesizeOrbs = async (orbId1: string, orbId2: string) => {
    // Find orbs in history
    const orb1Index = orbHistory.findIndex(o => o.id === orbId1);
    const orb2Index = orbHistory.findIndex(o => o.id === orbId2);
    
    if (orb1Index === -1 || orb2Index === -1) return;
    
    const orb1 = orbHistory[orb1Index];
    const orb2 = orbHistory[orb2Index];
    
    // Merge Layers (Unique)
    const combinedLayers = Array.from(new Set([...orb1.layers, ...orb2.layers])).slice(0, 7);
    
    // Bonus Minutes
    const bonusMinutes = 40;
    const totalMinutes = orb1.minutes + orb2.minutes + bonusMinutes;
    
    // Determine Stage
    let newStage: OrbStage = 'growing';
    if (totalMinutes >= ORB_STAGES.ETERNAL) newStage = 'eternal';
    else if (totalMinutes >= ORB_STAGES.LEGENDARY) newStage = 'legendary';
    else if (totalMinutes >= ORB_STAGES.AWAKENED) newStage = 'awakened';
    
    const newOrb: Orb = {
        id: `orb-synth-${Date.now()}`,
        level: combinedLayers.length,
        layers: combinedLayers,
        stage: newStage,
        minutes: totalMinutes,
        brightness: 1.0,
        createdAt: new Date().toISOString(),
        sender: "Synthesis",
        message: "Born from fusion.",
        isArchived: true
    };
    
    // Remove old orbs and add new one
    const newHistory = orbHistory.filter(o => o.id !== orbId1 && o.id !== orbId2);
    const finalHistory = [newOrb, ...newHistory];
    
    setOrbHistory(finalHistory);
    await AsyncStorage.setItem("orbHistory", JSON.stringify(finalHistory));
  };

  const updateOrbState = async (newOrb: Orb) => {
    setCurrentOrb(newOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(newOrb));
  };

  const updateOrbHistory = async (newHistory: Orb[]) => {
    setOrbHistory(newHistory);
    await AsyncStorage.setItem("orbHistory", JSON.stringify(newHistory));
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
    synthesizeOrbs,
    updateOrbState,
    updateOrbHistory,
  };
});
