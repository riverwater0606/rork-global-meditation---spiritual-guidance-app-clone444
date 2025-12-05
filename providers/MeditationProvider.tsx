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
  accumulatedMinutes: number; // New: Total minutes fed to this orb
  layers: string[]; // Colors
  status: 'seed' | 'awakened' | 'legendary' | 'eternal'; // New: Explicit status
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
  accumulatedMinutes: 0,
  layers: [],
  status: 'seed',
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
    const minutesAdded = duration;
    
    // Update current orb
    const newAccumulatedMinutes = (currentOrb.accumulatedMinutes || 0) + minutesAdded;
    let newStatus = currentOrb.status || 'seed';
    
    if (newAccumulatedMinutes >= 108) newStatus = 'eternal';
    else if (newAccumulatedMinutes >= 49) newStatus = 'legendary';
    else if (newAccumulatedMinutes >= 21) newStatus = 'awakened';
    
    // Add layer every ~10 mins or based on milestones?
    // Let's keep the layer logic: 1 layer per day or session?
    // Previous logic was: 1 layer per day if not awakened.
    // New logic: Based on minutes?
    // User wants "Progress Perception ... every 10 mins once obvious positive feedback".
    // Let's add a layer every 10 minutes of progress effectively.
    
    const newLayers = [...currentOrb.layers];
    const layersCount = Math.floor(newAccumulatedMinutes / 10);
    // Ensure we have enough layers
    while (newLayers.length < layersCount && newLayers.length < 7) {
        newLayers.push(CHAKRA_COLORS[newLayers.length % 7]);
    }
    
    // Also keep daily layer logic if needed, but let's prioritize minutes
    const updatedOrb: Orb = {
        ...currentOrb,
        accumulatedMinutes: newAccumulatedMinutes,
        status: newStatus,
        layers: newLayers,
        // Sync level for backward compat or UI
        level: newLayers.length,
    };
    
    setCurrentOrb(updatedOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));

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
    // Determine if we keep a copy based on status
    let keepCopy = false;
    let copyStrength = 0; // 0 = none, 1 = dim, 2 = full
    
    if (currentOrb.status === 'eternal' || currentOrb.status === 'legendary') {
        keepCopy = true;
        copyStrength = 2; // Full copy for legendary/eternal
    } else if (currentOrb.status === 'awakened') {
        keepCopy = true;
        copyStrength = 1; // Dim copy
    }
    
    const archivedOrb = { ...currentOrb, sender: "Me", message };
    const newHistory = [archivedOrb, ...orbHistory];
    setOrbHistory(newHistory);
    await AsyncStorage.setItem("orbHistory", JSON.stringify(newHistory));

    let nextOrb: Orb;
    if (keepCopy) {
        // Reset progress but keep some essence? Or keep full?
        // "Awakened+ orb: keep dim copy (70% brightness), can re-cultivate"
        // "Legendary/Eternal: full copy on chain (both keep)"
        
        if (currentOrb.status === 'awakened') {
            // Keep dim copy = maybe start with some minutes but not full?
            // "can re-cultivate" implies it goes back to growing but looks like the old one?
            // Let's restart minutes but keep visual "Ghost" layers? 
            // For simplicity, let's reset minutes to 0 but maybe add a flag "reincarnated".
             nextOrb = {
                ...INITIAL_ORB,
                id: `orb-${Date.now()}`,
                createdAt: new Date().toISOString(),
                // Maybe keep one layer?
                layers: [currentOrb.layers[0] || CHAKRA_COLORS[0]],
                accumulatedMinutes: 5, // Head start
             };
        } else {
            // Legendary/Eternal -> Full copy
            // User keeps the orb as is? But then how do they grow new one?
            // Usually "sending" implies giving away.
            // If they keep it, maybe it just stays in their "Collection"?
            // But main orb should probably reset to allow new cultivation?
            // Let's assume Main Orb resets, but a Copy is added to Collection (already done above).
            // Wait, "both keep" implies the sender STILL has it as their MAIN orb?
            // "Awakened+ orb: keep dim copy... can re-cultivate"
            // This implies the Main Orb becomes the "Dim Copy".
            
            if (currentOrb.status === 'eternal' || currentOrb.status === 'legendary') {
                 // Keep as is?
                 // If I send it, and I keep it, nothing changes?
                 // Maybe I just record the transaction?
                 // But the prompt says "Transfer system".
                 // Let's assume we reset to a "Copy" state.
                 nextOrb = {
                    ...currentOrb,
                    id: `orb-${Date.now()}`,
                 };
            } else {
                // Should not happen as logic handled above
                 nextOrb = { ...INITIAL_ORB, id: `orb-${Date.now()}` };
            }
        }
    } else {
       // Disappears
       nextOrb = {
         ...INITIAL_ORB,
         id: `orb-${Date.now()}`,
         createdAt: new Date().toISOString(),
       };
    }
    
    setCurrentOrb(nextOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(nextOrb));
  };

  const mergeOrb = async (sourceOrbId: string) => {
      // Find source orb in history
      const sourceOrbIndex = orbHistory.findIndex(o => o.id === sourceOrbId);
      if (sourceOrbIndex === -1) return;
      
      const sourceOrb = orbHistory[sourceOrbIndex];
      
      // Calculate boost
      // E.g. 50% of its accumulated minutes
      const boostMinutes = Math.floor((sourceOrb.accumulatedMinutes || 0) * 0.5);
      
      // Remove from history (consumed)
      const newHistory = [...orbHistory];
      newHistory.splice(sourceOrbIndex, 1);
      
      // Update current orb
      const newAccumulatedMinutes = (currentOrb.accumulatedMinutes || 0) + boostMinutes;
      let newStatus = currentOrb.status || 'seed';
       if (newAccumulatedMinutes >= 108) newStatus = 'eternal';
       else if (newAccumulatedMinutes >= 49) newStatus = 'legendary';
       else if (newAccumulatedMinutes >= 21) newStatus = 'awakened';
      
      const newLayers = [...currentOrb.layers];
      // Add colors from source orb not present? Or just standard progression?
      // Let's just run standard progression logic
       const layersCount = Math.floor(newAccumulatedMinutes / 10);
       while (newLayers.length < layersCount && newLayers.length < 7) {
         newLayers.push(CHAKRA_COLORS[newLayers.length % 7]);
       }

      const updatedOrb = {
          ...currentOrb,
          accumulatedMinutes: newAccumulatedMinutes,
          status: newStatus,
          layers: newLayers,
          level: newLayers.length
      };
      
      setOrbHistory(newHistory);
      setCurrentOrb(updatedOrb);
      await AsyncStorage.setItem("orbHistory", JSON.stringify(newHistory));
      await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));
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
    mergeOrb,
    updateOrbState,
    updateOrbHistory,
  };
});
