import { useState, useEffect, useMemo, useRef } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchAndConsumeGifts } from "@/lib/firebaseGifts";
import { useUser } from "@/providers/UserProvider";

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

export type OrbShape = 'default' | 'flower-of-life' | 'flower-of-life-complete' | 'star-of-david' | 'merkaba' | 'earth' | 'tree-of-life' | 'grid-of-life' | 'sri-yantra' | 'triquetra' | 'golden-rectangles' | 'double-helix-dna' | 'vortex-ring' | 'fractal-tree' | 'wave-interference' | 'quantum-orbitals' | 'celtic-knot' | 'starburst-nova' | 'lattice-wave' | 'sacred-flame';

export interface Orb {
  id: string;
  level: number;
  layers: string[]; // Colors
  isAwakened: boolean;
  createdAt: string;
  completedAt?: string;
  sender?: string;
  message?: string;
  lastLayerAddedAt?: string;
  shape?: OrbShape;
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
  const { walletAddress } = useUser();

  const [stats, setStats] = useState<MeditationStats>(INITIAL_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [customMeditations, setCustomMeditations] = useState<CustomMeditation[]>([]);
  const [currentOrb, setCurrentOrb] = useState<Orb>(INITIAL_ORB);
  const [orbHistory, setOrbHistory] = useState<Orb[]>([]);
  const [sharedSpinVelocity, setSharedSpinVelocity] = useState(0);

  useEffect(() => {
    const loadData = async () => {
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

        const savedCustom = await AsyncStorage.getItem("customMeditations");
        if (savedCustom) {
          setCustomMeditations(JSON.parse(savedCustom));
        }

        const savedOrb = await AsyncStorage.getItem("currentOrb");
        const savedHistory = await AsyncStorage.getItem("orbHistory");
        if (savedOrb) setCurrentOrb(JSON.parse(savedOrb));
        if (savedHistory) setOrbHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
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

  const completeMeditation = async (sessionId: string, duration: number, growOrb: boolean = false) => {
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
    // Only grow if explicitly requested (garden) 
    // FOR TESTING: Removed "AND not grown today" check
    // const alreadyGrownToday = currentOrb.lastLayerAddedAt && new Date(currentOrb.lastLayerAddedAt).toDateString() === todayStr;
    
    // if (growOrb && !alreadyGrownToday && !currentOrb.isAwakened) {
    if (growOrb && !currentOrb.isAwakened) {
       const nextLevel = currentOrb.level + 1;
       if (nextLevel <= 7) {
         const newLayer = CHAKRA_COLORS[currentOrb.level % 7];
         const updatedOrb = {
           ...currentOrb,
           level: nextLevel,
           layers: [...currentOrb.layers, newLayer],
           isAwakened: nextLevel === 7,
           completedAt: nextLevel === 7 ? new Date().toISOString() : undefined,
           lastLayerAddedAt: new Date().toISOString()
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

  const sendOrb = async (friendId: string, message: string) => {
    const archivedOrb = { ...currentOrb, sender: "Me", message };
    const newHistory = [archivedOrb, ...orbHistory];
    setOrbHistory(newHistory);
    await AsyncStorage.setItem("orbHistory", JSON.stringify(newHistory));

    const nextOrb: Orb = {
      ...INITIAL_ORB,
      id: `orb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setCurrentOrb(nextOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(nextOrb));
  };

  const receiveGiftOrb = async (gift: {
    fromDisplayName?: string;
    fromWalletAddress?: string;
    blessing?: string;
    orb: {
      id: string;
      level: number;
      layers: string[];
      isAwakened: boolean;
      createdAt: string;
      completedAt?: string;
      shape?: OrbShape;
    };
  }) => {
    const receivedOrb: Orb = {
      id: gift.orb.id || `gift-${Date.now()}`,
      level: gift.orb.level,
      layers: gift.orb.layers,
      isAwakened: gift.orb.isAwakened,
      createdAt: gift.orb.createdAt,
      completedAt: gift.orb.completedAt,
      shape: gift.orb.shape,
      sender: gift.fromDisplayName || gift.fromWalletAddress || "Friend",
      message: gift.blessing,
    };

    setOrbHistory((prev) => {
      const next = [receivedOrb, ...prev];
      void AsyncStorage.setItem("orbHistory", JSON.stringify(next));
      return next;
    });
  };

  const giftPollInFlightRef = useRef<boolean>(false);

  useEffect(() => {
    if (!walletAddress) {
      console.log("[MeditationProvider][Gifts] Poll disabled (no walletAddress)");
      return;
    }

    console.log("[MeditationProvider][Gifts] Starting 30s gift poll for:", walletAddress);

    const id = setInterval(() => {
      const run = async () => {
        if (giftPollInFlightRef.current) return;
        giftPollInFlightRef.current = true;

        try {
          const gifts = await fetchAndConsumeGifts({ myWalletAddress: walletAddress, max: 10 });
          if (gifts.length > 0) {
            console.log("[MeditationProvider][Gifts] Incoming gifts:", gifts.length);
          }

          for (const g of gifts) {
            console.log("[MeditationProvider][Gifts] Consuming gift:", JSON.stringify(g, null, 2));
            await receiveGiftOrb({
              fromDisplayName: g.fromDisplayName,
              fromWalletAddress: g.from,
              blessing: g.blessing,
              orb: {
                id: g.orb.id,
                level: g.orb.level,
                layers: g.orb.layers,
                isAwakened: g.orb.isAwakened,
                createdAt: g.orb.createdAt,
                completedAt: g.orb.completedAt,
                shape: (g.orb.shape as OrbShape | undefined) ?? undefined,
              },
            });
          }
        } catch (e) {
          console.error("[MeditationProvider][Gifts] Poll failed:", e);
        } finally {
          giftPollInFlightRef.current = false;
        }
      };

      void run();
    }, 30000);

    return () => {
      clearInterval(id);
    };
  }, [walletAddress]);

  // Dev Tools
  const devAddLayer = async () => {
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
  };

  const devInstantOrb = async (days: number) => {
    // 21 days = Awakened
    // 49 days = Legendary
    // 108 days = Eternal
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);
    
    const fullLayers = [...CHAKRA_COLORS]; // 7 colors
    
    const updatedOrb = {
       ...currentOrb,
       level: 7,
       layers: fullLayers,
       isAwakened: true,
       createdAt: targetDate.toISOString(),
       completedAt: new Date().toISOString()
    };
    setCurrentOrb(updatedOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));
  };
  
  const devResetOrb = async () => {
      const newOrb = { ...INITIAL_ORB, id: `orb-${Date.now()}` };
      setCurrentOrb(newOrb);
      await AsyncStorage.setItem("currentOrb", JSON.stringify(newOrb));
  };

  const devSendOrbToSelf = async () => {
     const randomLayers = CHAKRA_COLORS.slice(0, Math.floor(Math.random() * 7) + 1);
     const receivedOrb: Orb = {
       id: `orb-dev-${Date.now()}`,
       level: randomLayers.length,
       layers: randomLayers,
       isAwakened: randomLayers.length === 7,
       createdAt: new Date().toISOString(),
       sender: "Me (Dev)",
       message: "Dev test orb"
     };
     const newHistory = [receivedOrb, ...orbHistory];
     setOrbHistory(newHistory);
     await AsyncStorage.setItem("orbHistory", JSON.stringify(newHistory));
  };

  const hasGrownOrbToday = useMemo(() => {
    if (!currentOrb.lastLayerAddedAt) return false;
    const todayStr = new Date().toDateString();
    const lastGrowth = new Date(currentOrb.lastLayerAddedAt);
    return lastGrowth.toDateString() === todayStr;
  }, [currentOrb.lastLayerAddedAt]);

  const hasMeditatedToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    const lastSession = stats.lastSessionDate ? new Date(stats.lastSessionDate) : null;
    return lastSession && lastSession.toDateString() === todayStr;
  }, [stats.lastSessionDate]);

  const cultivateDailyOrb = async () => {
    // FOR TESTING: Removed daily limit check
    // if (hasGrownOrbToday || currentOrb.isAwakened) return;

    // Count as a session
    const duration = 7; // 7 minutes
    await completeMeditation("garden-cultivation", duration, true);
  };

  const storeOrb = async () => {
    console.log("storeOrb called. Current Orb:", JSON.stringify(currentOrb));
    
    // Allow storing if there are layers OR if the shape is not default
    const isDefault = !currentOrb.shape || currentOrb.shape === 'default';
    const isEmpty = currentOrb.level === 0 && currentOrb.layers.length === 0;
    
    if (isEmpty && isDefault) {
      console.log("storeOrb aborted: Orb is empty and default shape.");
      return;
    }
    
    const storedOrb = { 
      ...currentOrb, 
      id: currentOrb.id === 'orb-init' ? `orb-${Date.now()}` : currentOrb.id,
      completedAt: new Date().toISOString() 
    };
    
    console.log("Storing orb to history:", storedOrb);
    
    const newHistory = [storedOrb, ...orbHistory];
    setOrbHistory(newHistory);
    await AsyncStorage.setItem("orbHistory", JSON.stringify(newHistory));

    const newOrb = { ...INITIAL_ORB, id: `orb-${Date.now()}` };
    setCurrentOrb(newOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(newOrb));
  };

  const swapOrb = async (orbId: string) => {
    const orbIndex = orbHistory.findIndex(o => o.id === orbId);
    if (orbIndex === -1) return;

    const orbToRetrieve = orbHistory[orbIndex];
    const newHistory = [...orbHistory];
    newHistory.splice(orbIndex, 1); // Remove retrieved orb

    // If current orb has progress OR non-default shape, save it to history
    if (currentOrb.level > 0 || currentOrb.layers.length > 0 || (currentOrb.shape && currentOrb.shape !== 'default')) {
      newHistory.unshift({ ...currentOrb });
    }

    setOrbHistory(newHistory);
    setCurrentOrb(orbToRetrieve);

    await AsyncStorage.setItem("orbHistory", JSON.stringify(newHistory));
    await AsyncStorage.setItem("currentOrb", JSON.stringify(orbToRetrieve));
  };

  const setOrbShape = async (shape: OrbShape) => {
    const updatedOrb = { ...currentOrb, shape };
    setCurrentOrb(updatedOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));
  };

  return {
    stats,
    achievements,
    customMeditations,
    currentOrb,
    orbHistory,
    hasMeditatedToday,
    hasGrownOrbToday,
    cultivateDailyOrb,
    completeMeditation,
    addCustomMeditation,
    deleteCustomMeditation,
    updateCustomMeditation,
    sendOrb,
    receiveGiftOrb,
    devAddLayer,
    devInstantOrb,
    devResetOrb,
    devSendOrbToSelf,
    storeOrb,
    swapOrb,
    setOrbShape,
    sharedSpinVelocity,
    setSharedSpinVelocity,
  };
});
