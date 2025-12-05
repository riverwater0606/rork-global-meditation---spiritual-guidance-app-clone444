import { useState, useEffect, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MiniKit } from "@/constants/minikit";

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

export type OrbStage = "seed" | "radiant" | "legendary" | "eternal";

export interface Orb {
  id: string;
  level: number;
  layers: string[];
  isAwakened: boolean;
  createdAt: string;
  completedAt?: string;
  sender?: string;
  message?: string;
  progressMinutes: number;
  milestoneTarget: number;
  stage: OrbStage;
  fragments: number;
  brightness: number;
  lastInfusionAt?: string;
  mintedOnChain?: boolean;
  retainedCopy?: "none" | "dim" | "full";
  energySegments?: number;
}

export const CHAKRA_COLORS = [
  "#FF0000",
  "#FF7F00",
  "#FFFF00",
  "#00FF00",
  "#0000FF",
  "#4B0082",
  "#9400D3",
];

const INITIAL_STATS: MeditationStats = {
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  lastSessionDate: null,
  weekProgress: [false, false, false, false, false, false, false],
};

const ORB_PROGRESS_CAP = 180;

interface StageDefinition {
  stage: OrbStage;
  min: number;
  nextThreshold: number;
  halo: string;
  brightness: number;
}

const STAGE_DEFINITIONS: StageDefinition[] = [
  { stage: "seed", min: 0, nextThreshold: 21, halo: "#FF6B6B", brightness: 0.5 },
  { stage: "radiant", min: 21, nextThreshold: 49, halo: "#FACC15", brightness: 0.7 },
  { stage: "legendary", min: 49, nextThreshold: 108, halo: "#C084FC", brightness: 0.85 },
  { stage: "eternal", min: 108, nextThreshold: 144, halo: "#F472B6", brightness: 1 },
];

const INITIAL_ORB: Orb = {
  id: "orb-init",
  level: 0,
  layers: [],
  isAwakened: false,
  createdAt: new Date().toISOString(),
  progressMinutes: 0,
  milestoneTarget: 21,
  stage: "seed",
  fragments: 0,
  brightness: 0.5,
  mintedOnChain: false,
  retainedCopy: "none",
  energySegments: 0,
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

const clampProgress = (value: number) => Math.min(ORB_PROGRESS_CAP, Math.max(0, value));

const getStageMeta = (minutes: number) => {
  const ordered = [...STAGE_DEFINITIONS].sort((a, b) => b.min - a.min);
  for (const def of ordered) {
    if (minutes >= def.min) {
      return def;
    }
  }
  return STAGE_DEFINITIONS[0];
};

const shapeOrb = (orb?: Partial<Orb>): Orb => {
  const progressMinutes = clampProgress(orb?.progressMinutes ?? 0);
  const stageMeta = getStageMeta(progressMinutes);
  const level = orb?.level ?? (orb?.layers?.length ?? 0);
  const layers = orb?.layers && orb.layers.length > 0 ? orb.layers : CHAKRA_COLORS.slice(0, level);
  return {
    ...INITIAL_ORB,
    ...orb,
    progressMinutes,
    stage: stageMeta.stage,
    milestoneTarget: stageMeta.nextThreshold,
    level: layers.length,
    layers,
    fragments: orb?.fragments ?? INITIAL_ORB.fragments,
    brightness: orb?.brightness ?? stageMeta.brightness,
    energySegments: orb?.energySegments ?? Math.floor(progressMinutes / 10),
    isAwakened: stageMeta.stage !== "seed" || layers.length >= 7,
  };
};

interface ApplyOrbOptions {
  minutesDelta?: number;
  addLayer?: boolean;
  fragmentsDelta?: number;
  recordInfusion?: boolean;
}

const buildNextOrb = (base: Orb, options: ApplyOrbOptions): Orb => {
  const minutesBefore = base.progressMinutes;
  const minutesDelta = options.minutesDelta ?? 0;
  const nextMinutes = clampProgress(minutesBefore + minutesDelta);
  const stageMeta = getStageMeta(nextMinutes);
  const tensBefore = Math.floor(minutesBefore / 10);
  const tensAfter = Math.floor(nextMinutes / 10);
  const fragmentFromProgress = Math.max(0, tensAfter - tensBefore);
  const shouldAddLayer = options.addLayer && base.layers.length < CHAKRA_COLORS.length;
  const newLayers = shouldAddLayer ? [...base.layers, CHAKRA_COLORS[base.layers.length]] : base.layers;

  return {
    ...base,
    progressMinutes: nextMinutes,
    stage: stageMeta.stage,
    milestoneTarget: stageMeta.nextThreshold,
    layers: newLayers,
    level: newLayers.length,
    fragments: Math.max(0, base.fragments + (options.fragmentsDelta ?? 0) + fragmentFromProgress),
    isAwakened: stageMeta.stage !== "seed" || newLayers.length >= 7,
    brightness: stageMeta.brightness,
    lastInfusionAt: options.recordInfusion ? new Date().toISOString() : base.lastInfusionAt,
    energySegments: Math.floor(nextMinutes / 10),
  };
};

const maybeMintOrb = async (orb: Orb) => {
  if (orb.mintedOnChain || orb.stage === "seed") {
    return orb;
  }

  if (!MiniKit || !MiniKit.commands?.mintNft) {
    return { ...orb, mintedOnChain: true };
  }

  try {
    await MiniKit.commands.mintNft({
      collectionAddress: "0xLightOrbCollection",
      recipient: MiniKit.walletAddress ?? "",
      metadata: {
        name: "Chakra Light Orb",
        description: "Awarded for reaching the Awakened state",
        attributes: [
          { trait_type: "stage", value: orb.stage },
          { trait_type: "layers", value: orb.layers.length },
          { trait_type: "brightness", value: orb.brightness },
        ],
      },
    });
    return { ...orb, mintedOnChain: true };
  } catch (error) {
    console.warn("MiniKit mint failed", error);
    return orb;
  }
};

export const [MeditationProvider, useMeditation] = createContextHook(() => {
  const [stats, setStats] = useState<MeditationStats>(INITIAL_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [customMeditations, setCustomMeditations] = useState<CustomMeditation[]>([]);
  const [currentOrb, setCurrentOrb] = useState<Orb>(INITIAL_ORB);
  const [orbHistory, setOrbHistory] = useState<Orb[]>([]);

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
  }, []);

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
      if (savedOrb) setCurrentOrb(shapeOrb(JSON.parse(savedOrb)));
      if (savedHistory) {
        const parsedHistory: Orb[] = JSON.parse(savedHistory);
        setOrbHistory(parsedHistory.map((entry) => shapeOrb(entry)));
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

  const updateWeekProgress = (currentStats: MeditationStats) => {
    const today = new Date().getDay();
    const lastSession = currentStats.lastSessionDate ? new Date(currentStats.lastSessionDate) : null;

    if (lastSession && lastSession.toDateString() === new Date().toDateString()) {
      const newWeekProgress = [...currentStats.weekProgress];
      newWeekProgress[today] = true;
      setStats({ ...currentStats, weekProgress: newWeekProgress });
    }
  };

  const persistOrb = async (orb: Orb) => {
    setCurrentOrb(orb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(orb));
  };

  const handleOrbProgress = async (options: ApplyOrbOptions) => {
    const updated = buildNextOrb(currentOrb, options);
    const minted = updated.stage !== "seed" ? await maybeMintOrb(updated) : updated;
    await persistOrb(minted);
  };

  const completeMeditation = async (_sessionId: string, duration: number) => {
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

    const alreadyMeditatedToday = lastSession && lastSession.toDateString() === todayStr;
    await handleOrbProgress({
      minutesDelta: duration,
      addLayer: !alreadyMeditatedToday,
      recordInfusion: true,
    });

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
    const updated = customMeditations.filter((m) => m.id !== id);
    setCustomMeditations(updated);
    await AsyncStorage.setItem("customMeditations", JSON.stringify(updated));
  };

  const updateCustomMeditation = async (id: string, updates: Partial<CustomMeditation>) => {
    const updated = customMeditations.map((m) => (m.id === id ? { ...m, ...updates } : m));
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

  const updateOrbHistory = async (newHistory: Orb[]) => {
    setOrbHistory(newHistory);
    await AsyncStorage.setItem("orbHistory", JSON.stringify(newHistory));
  };

  const sendOrb = async (friendId: string, message: string, recipientAddress?: string) => {
    if (!currentOrb.layers.length) {
      return;
    }

    const archivedOrb: Orb = {
      ...currentOrb,
      sender: friendId,
      message,
      retainedCopy:
        currentOrb.stage === "legendary"
          ? "dim"
          : currentOrb.stage === "eternal"
            ? "full"
            : "none",
    };

    if (MiniKit && MiniKit.commands?.transferNft) {
      try {
        await MiniKit.commands.transferNft({
          collectionAddress: "0xLightOrbCollection",
          tokenId: currentOrb.id,
          recipient: recipientAddress ?? friendId,
        });
      } catch (error) {
        console.warn("MiniKit transfer failed", error);
      }
    }

    const newHistory = [archivedOrb, ...orbHistory];
    await updateOrbHistory(newHistory);

    await persistOrb(
      shapeOrb({
        id: `orb-${Date.now()}`,
        createdAt: new Date().toISOString(),
        fragments: currentOrb.stage === "seed" ? 0 : Math.floor(currentOrb.fragments / 2),
      }),
    );
  };

  const boostOrbProgress = async (minutesDelta: number, fragmentsConsumed = 0) => {
    await handleOrbProgress({
      minutesDelta,
      fragmentsDelta: -fragmentsConsumed,
      recordInfusion: true,
    });
  };

  const updateOrbState = async (newOrb: Orb) => {
    await persistOrb(shapeOrb(newOrb));
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
    updateOrbState,
    updateOrbHistory,
    boostOrbProgress,
  };
});
