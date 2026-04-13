import { useState, useEffect, useMemo, useRef } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchCloudCustomMeditations, saveCloudCustomMeditations } from "@/lib/customMeditationCloud";
import { fetchAndConsumeGifts } from "@/lib/firebaseGifts";
import { sanitizeUserId, uploadMeditationRecord } from "@/lib/firebaseMeditations";
import { fetchCloudJourneyState, saveCloudJourneyState } from "@/lib/journeyStateCloud";
import { deleteCloudTtsCacheForMeditation } from "@/lib/elevenLabsTts";
import {
  AI_MEDITATION_CONTENT_VERSION,
  buildMeditationPreviewText,
} from "@/lib/aiMeditation";
import { resolveMeditationUserId } from "@/lib/resolveMeditationUserId";
import { useUser } from "@/providers/UserProvider";
import { Alert } from "react-native";
import { IS_DEV_FULL_MOCK, IS_LOCAL_DEV } from "@/constants/env";
import { MEDITATION_SESSIONS } from "@/constants/meditations";
import { BEGINNER_TASK_DEFINITIONS, SHAPE_MISSION_DEFINITIONS } from "@/constants/missions";
import { FREE_CORE_SHAPES, FREE_DAILY_AWAKENING_MINUTES, ORB_AWAKENING_DAYS_REQUIRED, VIP_DAILY_AWAKENING_MINUTES, VIP_STARTER_SHAPES } from "@/constants/vip";
import { CHAKRA_COLORS } from "@/constants/chakras";
import { DAILY_RESONANCE_CAP, RESONANCE_AMBIENT_PASS_COST, RESONANCE_BLESSING_BOOST_COST, RESONANCE_ORB_AURA_COST, RESONANCE_REWARDS, ResonanceLedgerType, ResonanceRewardType } from "@/constants/resonance";
import {
  AI_GUIDANCE_TOP_UP_AMOUNT_BUNDLE,
  AI_GUIDANCE_TOP_UP_AMOUNT_SINGLE,
  AI_GUIDANCE_TOP_UP_COST_BUNDLE,
  AI_GUIDANCE_TOP_UP_COST_SINGLE,
  FREE_DAILY_AI_GUIDANCE_LIMIT,
  VIP_DAILY_AI_GUIDANCE_LIMIT,
} from "@/constants/ai";
import type { Language } from "@/providers/SettingsProvider";

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
  isCustom?: boolean;
  title: string;
  openingPreview?: string;
  previewText?: string;
  script: string;
  duration: number;
  language: Language;
  createdAt: string;
  updatedAt?: string;
  breathingMethod?: string;
  gradient?: [string, string];
  contentVersion?: number;
  qualityFlags?: string[];
}

interface MissionStats {
  blessingsSent: number;
  uniqueCategories: string[];
  starterShapesGranted: string[];
  vipStarterPackGranted: boolean;
  vipWelcomeSeen: boolean;
  orbsStored: number;
  shapeChanges: number;
  highestOrbLevel: number;
  customMeditationsCreated: number;
  customMeditationsCompleted: number;
}

interface CustomMeditationCloudSyncState {
  status: "idle" | "syncing" | "synced" | "error";
  lastSyncedAt: string | null;
  error: string | null;
}

interface ResonanceLedgerEntry {
  id: string;
  type: ResonanceLedgerType;
  amount: number;
  createdAt: string;
  dayKey: string;
}

interface ResonanceState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  dailyBucket: {
    dayKey: string | null;
    amount: number;
  };
  lastCheckInDate: string | null;
  lastMeditationRewardDate: string | null;
  lastChakraRewardDate: string | null;
  firstAiCreationRewardClaimed: boolean;
  blessingBoostCharges: number;
  orbAuraDayKey: string | null;
  ambientPassDayKey: string | null;
  ledger: ResonanceLedgerEntry[];
}

interface AiUsageState {
  dayKey: string | null;
  used: number;
  purchasedExtra: number;
}

interface LastMeditationContext {
  sessionId: string;
  courseName: string;
  duration: number;
  completedAt: string;
  category: string | null;
  isCustomSession: boolean;
}

interface JourneyStateCloudSyncState {
  lastSyncedAt: string | null;
}

export type OrbShape = 'default' | 'flower-of-life' | 'flower-of-life-complete' | 'star-of-david' | 'merkaba' | 'earth' | 'mars' | 'venus' | 'jupiter' | 'saturn' | 'neptune' | 'akashic-galaxy' | 'soul-nebula' | 'lotus-galaxy' | 'oracle-constellation' | 'ascension-spiral' | 'tree-of-life' | 'grid-of-life' | 'sri-yantra' | 'triquetra' | 'ring-torus' | 'golden-rectangles' | 'double-helix-dna' | 'vortex-ring' | 'fractal-tree' | 'wave-interference' | 'quantum-orbitals' | 'celtic-knot' | 'starburst-nova' | 'lattice-wave' | 'sacred-flame' | 'metatrons-cube' | 'torus-flower' | 'lotus-mandala' | 'phoenix-spiral' | 'vesica-piscis' | 'crown-chakra' | 'cosmic-serpent' | 'prism-field' | 'halo-bloom' | 'infinity-prayer' | 'seed-of-life' | 'egg-of-life' | 'fruit-of-life' | 'golden-spiral' | 'vector-equilibrium' | 'curved-merkaba' | 'curved-metatron' | 'unicursal-hexagram' | 'yin-yang-flow' | 'seven-waves' | 'snowflake-mandala' | 'golden-circles' | 'sphere-of-circles' | 'caduceus' | 'octagram-star';

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
  isBlessingGift?: boolean;
  isVipGiftedStarter?: boolean;
  resonanceBlessed?: boolean;
}

export type OrbDisplayMode = "idle" | "diffused";

const INITIAL_STATS: MeditationStats = {
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  lastSessionDate: null,
  weekProgress: [false, false, false, false, false, false, false],
};

const INITIAL_MISSION_STATS: MissionStats = {
  blessingsSent: 0,
  uniqueCategories: [],
  starterShapesGranted: [],
  vipStarterPackGranted: false,
  vipWelcomeSeen: false,
  orbsStored: 0,
  shapeChanges: 0,
  highestOrbLevel: 0,
  customMeditationsCreated: 0,
  customMeditationsCompleted: 0,
};

const INITIAL_RESONANCE_STATE: ResonanceState = {
  balance: 0,
  totalEarned: 0,
  totalSpent: 0,
  dailyBucket: {
    dayKey: null,
    amount: 0,
  },
  lastCheckInDate: null,
  lastMeditationRewardDate: null,
  lastChakraRewardDate: null,
  firstAiCreationRewardClaimed: false,
  blessingBoostCharges: 0,
  orbAuraDayKey: null,
  ambientPassDayKey: null,
  ledger: [],
};

const INITIAL_AI_USAGE_STATE: AiUsageState = {
  dayKey: null,
  used: 0,
  purchasedExtra: 0,
};

const INITIAL_LAST_MEDITATION_CONTEXT: LastMeditationContext | null = null;
const CUSTOM_MEDITATIONS_STORAGE_KEY = "customMeditations";
const CUSTOM_MEDITATIONS_BACKUP_STORAGE_KEY = "customMeditationsBackup";
const CUSTOM_MEDITATIONS_CLOUD_SYNC_STORAGE_KEY = "customMeditationsCloudSync";
const JOURNEY_STATE_CLOUD_SYNC_STORAGE_KEY = "journeyStateCloudSync";

const VIP_STARTER_ORB_SENDER = "Gifted Awakened Orb";
const VIP_STARTER_ORB_MESSAGE = "VIP Gifted Orb";

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

const getLocalDayKey = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const applyResonanceReward = (
  state: ResonanceState,
  type: ResonanceRewardType,
  at: Date = new Date()
) => {
  const dayKey = getLocalDayKey(at);
  const earnedToday = state.dailyBucket.dayKey === dayKey ? state.dailyBucket.amount : 0;
  const remaining = Math.max(0, DAILY_RESONANCE_CAP - earnedToday);
  const configuredAmount = RESONANCE_REWARDS[type];
  const grantedAmount = Math.min(configuredAmount, remaining);

  if (grantedAmount <= 0) {
    return {
      nextState: state,
      granted: false,
      amount: 0,
      capped: true,
      entry: null as ResonanceLedgerEntry | null,
    };
  }

  const entry: ResonanceLedgerEntry = {
    id: `res-${type}-${at.getTime()}`,
    type,
    amount: grantedAmount,
    createdAt: at.toISOString(),
    dayKey,
  };

  const nextState: ResonanceState = {
    ...state,
    balance: state.balance + grantedAmount,
    totalEarned: state.totalEarned + grantedAmount,
    dailyBucket: {
      dayKey,
      amount: earnedToday + grantedAmount,
    },
    ledger: [entry, ...state.ledger].slice(0, 30),
  };

  if (type === "dailyCheckIn") nextState.lastCheckInDate = dayKey;
  if (type === "dailyMeditation") nextState.lastMeditationRewardDate = dayKey;
  if (type === "chakraRitual") nextState.lastChakraRewardDate = dayKey;
  if (type === "aiCreation") nextState.firstAiCreationRewardClaimed = true;

  return {
    nextState,
    granted: true,
    amount: grantedAmount,
    capped: grantedAmount < configuredAmount,
    entry,
  };
};

const appendResonanceLedgerEntry = (
  state: ResonanceState,
  type: ResonanceLedgerType,
  amount: number,
  at: Date = new Date()
) => {
  const dayKey = getLocalDayKey(at);
  const entry: ResonanceLedgerEntry = {
    id: `res-${type}-${at.getTime()}`,
    type,
    amount,
    createdAt: at.toISOString(),
    dayKey,
  };

  return {
    ...state,
    ledger: [entry, ...state.ledger].slice(0, 30),
  };
};

export const [MeditationProvider, useMeditation] = createContextHook(() => {
  const { walletAddress, profile, hasActiveVIP } = useUser();

  const [stats, setStats] = useState<MeditationStats>(INITIAL_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [customMeditations, setCustomMeditations] = useState<CustomMeditation[]>([]);
  const [currentOrb, setCurrentOrb] = useState<Orb>(INITIAL_ORB);
  const [orbHistory, setOrbHistory] = useState<Orb[]>([]);
  const [sharedSpinVelocity, setSharedSpinVelocity] = useState(0);
  const [orbDisplayMode, setOrbDisplayModeState] = useState<OrbDisplayMode>("idle");
  const [missionStats, setMissionStats] = useState<MissionStats>(INITIAL_MISSION_STATS);
  const [resonanceState, setResonanceState] = useState<ResonanceState>(INITIAL_RESONANCE_STATE);
  const [aiUsageState, setAiUsageState] = useState<AiUsageState>(INITIAL_AI_USAGE_STATE);
  const [lastMeditationContext, setLastMeditationContext] = useState<LastMeditationContext | null>(INITIAL_LAST_MEDITATION_CONTEXT);
  const cloudCustomMeditationsHydratedRef = useRef(false);
  const journeyStateHydratedRef = useRef(false);
  const journeyStateLoadCompleteRef = useRef(false);
  const isApplyingCloudJourneyStateRef = useRef(false);
  const [customMeditationCloudSync, setCustomMeditationCloudSync] = useState<CustomMeditationCloudSyncState>({
    status: "idle",
    lastSyncedAt: null,
    error: null,
  });
  const [journeyStateCloudSync, setJourneyStateCloudSync] = useState<JourneyStateCloudSyncState>({
    lastSyncedAt: null,
  });

  const getMeditationRevisionTime = (meditation: Partial<CustomMeditation>) => {
    const source = meditation.updatedAt || meditation.createdAt;
    const millis = source ? new Date(source).getTime() : 0;
    return Number.isFinite(millis) ? millis : 0;
  };

  const getSnapshotTime = (value: string | null | undefined) => {
    const millis = value ? new Date(value).getTime() : 0;
    return Number.isFinite(millis) ? millis : 0;
  };

  const normalizeCustomMeditations = (rawItems: unknown[]) =>
    rawItems
      .map((meditation: Partial<CustomMeditation>, index: number) => {
        try {
          const normalizedLanguage =
            meditation.language === "zh" || meditation.language === "es" || meditation.language === "en"
              ? meditation.language
              : "en";
          const normalizedScript = typeof meditation.script === "string" ? meditation.script : "";
          if (!normalizedScript) return null;

          const createdAt =
            typeof meditation.createdAt === "string" && meditation.createdAt
              ? meditation.createdAt
              : new Date().toISOString();

          return {
            ...meditation,
            id: typeof meditation.id === "string" ? meditation.id : `custom-legacy-${index}`,
            title:
              typeof meditation.title === "string" && meditation.title.trim().length > 0
                ? meditation.title
                : "Personal Meditation",
            script: normalizedScript,
            duration:
              typeof meditation.duration === "number" && Number.isFinite(meditation.duration)
                ? meditation.duration
                : 10,
            language: normalizedLanguage,
            createdAt,
            updatedAt:
              typeof meditation.updatedAt === "string" && meditation.updatedAt
                ? meditation.updatedAt
                : createdAt,
            isCustom: meditation.isCustom ?? true,
            previewText:
              typeof meditation.previewText === "string" && meditation.previewText.trim().length > 0
                ? meditation.previewText
                : buildMeditationPreviewText(
                    normalizedScript,
                    typeof meditation.openingPreview === "string" ? meditation.openingPreview : undefined,
                    normalizedLanguage
                  ),
            contentVersion:
              typeof meditation.contentVersion === "number" ? meditation.contentVersion : 0,
            qualityFlags:
              Array.isArray(meditation.qualityFlags) && meditation.qualityFlags.length > 0
                ? meditation.qualityFlags
                : meditation.contentVersion === AI_MEDITATION_CONTENT_VERSION
                  ? []
                  : ["legacy-session"],
          } as CustomMeditation;
        } catch (error) {
          console.error("[MeditationProvider] Failed to normalize custom meditation:", error);
          return null;
        }
      })
      .filter(Boolean) as CustomMeditation[];

  const persistCustomMeditations = async (items: CustomMeditation[]) => {
    const serialized = JSON.stringify(items);
    await AsyncStorage.setItem(CUSTOM_MEDITATIONS_STORAGE_KEY, serialized);
    await AsyncStorage.setItem(CUSTOM_MEDITATIONS_BACKUP_STORAGE_KEY, serialized);

    if (IS_LOCAL_DEV) {
      return;
    }

    try {
      setCustomMeditationCloudSync((current) => ({
        ...current,
        status: "syncing",
        error: null,
      }));
      const { userId } = await resolveMeditationUserId({ walletAddress });
      if (!userId) return;
      const syncedAt = new Date().toISOString();
      await saveCloudCustomMeditations({
        userId: sanitizeUserId(userId),
        items,
        updatedAt: syncedAt,
      });
      const nextState: CustomMeditationCloudSyncState = {
        status: "synced",
        lastSyncedAt: syncedAt,
        error: null,
      };
      setCustomMeditationCloudSync(nextState);
      await AsyncStorage.setItem(CUSTOM_MEDITATIONS_CLOUD_SYNC_STORAGE_KEY, JSON.stringify(nextState));
    } catch (error) {
      console.error("[MeditationProvider] Failed to sync custom meditations to cloud:", error);
      const nextState: CustomMeditationCloudSyncState = {
        status: "error",
        lastSyncedAt: customMeditationCloudSync.lastSyncedAt,
        error: error instanceof Error ? error.message : "sync_failed",
      };
      setCustomMeditationCloudSync(nextState);
      await AsyncStorage.setItem(CUSTOM_MEDITATIONS_CLOUD_SYNC_STORAGE_KEY, JSON.stringify(nextState));
    }
  };

  const getJourneyStateSnapshot = () => ({
    stats,
    currentOrb,
    orbHistory,
    orbDisplayMode,
    missionStats,
    resonanceState,
  });

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

        const savedCustom = await AsyncStorage.getItem(CUSTOM_MEDITATIONS_STORAGE_KEY);
        const savedCustomBackup = await AsyncStorage.getItem(CUSTOM_MEDITATIONS_BACKUP_STORAGE_KEY);
        const rawCustomSource = savedCustom || savedCustomBackup;
        if (rawCustomSource) {
          const parsedRawCustom = JSON.parse(rawCustomSource);
          const parsedCustomMeditations = normalizeCustomMeditations(Array.isArray(parsedRawCustom) ? parsedRawCustom : []);
          setCustomMeditations(parsedCustomMeditations);
          if (!savedCustom && savedCustomBackup && parsedCustomMeditations.length > 0) {
            await AsyncStorage.setItem(CUSTOM_MEDITATIONS_STORAGE_KEY, JSON.stringify(parsedCustomMeditations));
          }
        }

        const savedOrb = await AsyncStorage.getItem("currentOrb");
        const savedHistory = await AsyncStorage.getItem("orbHistory");
        const savedOrbDisplayMode = await AsyncStorage.getItem("orbDisplayMode");
        const savedMissionStats = await AsyncStorage.getItem("missionStats");
        const savedResonanceState = await AsyncStorage.getItem("resonanceState");
        const savedAiUsageState = await AsyncStorage.getItem("aiUsageState");
        const savedLastMeditationContext = await AsyncStorage.getItem("lastMeditationContext");
        const savedCustomMeditationCloudSync = await AsyncStorage.getItem(CUSTOM_MEDITATIONS_CLOUD_SYNC_STORAGE_KEY);
        const savedJourneyStateCloudSync = await AsyncStorage.getItem(JOURNEY_STATE_CLOUD_SYNC_STORAGE_KEY);
        if (savedOrb) setCurrentOrb(JSON.parse(savedOrb));
        if (savedHistory) setOrbHistory(JSON.parse(savedHistory));
        if (savedOrbDisplayMode === "idle" || savedOrbDisplayMode === "diffused") {
          setOrbDisplayModeState(savedOrbDisplayMode);
        }
        if (savedMissionStats) {
          setMissionStats({
            ...INITIAL_MISSION_STATS,
            ...JSON.parse(savedMissionStats),
          });
        }
        if (savedResonanceState) {
          setResonanceState({
            ...INITIAL_RESONANCE_STATE,
            ...JSON.parse(savedResonanceState),
          });
        }
        if (savedAiUsageState) {
          setAiUsageState({
            ...INITIAL_AI_USAGE_STATE,
            ...JSON.parse(savedAiUsageState),
          });
        }
        if (savedLastMeditationContext) {
          setLastMeditationContext(JSON.parse(savedLastMeditationContext));
        }
        if (savedCustomMeditationCloudSync) {
          const parsedSync = JSON.parse(savedCustomMeditationCloudSync);
          setCustomMeditationCloudSync({
            status:
              parsedSync?.status === "syncing" ||
              parsedSync?.status === "synced" ||
              parsedSync?.status === "error"
                ? parsedSync.status
                : "idle",
            lastSyncedAt:
              typeof parsedSync?.lastSyncedAt === "string" ? parsedSync.lastSyncedAt : null,
            error: typeof parsedSync?.error === "string" ? parsedSync.error : null,
          });
        }
        if (savedJourneyStateCloudSync) {
          const parsedSync = JSON.parse(savedJourneyStateCloudSync);
          setJourneyStateCloudSync({
            lastSyncedAt:
              typeof parsedSync?.lastSyncedAt === "string" ? parsedSync.lastSyncedAt : null,
          });
        }
        if (IS_DEV_FULL_MOCK) {
          const baseOrb = savedOrb ? JSON.parse(savedOrb) : INITIAL_ORB;
          const forcedLayers = [...baseOrb.layers ?? []];
          while (forcedLayers.length < 7) {
            forcedLayers.push(CHAKRA_COLORS[forcedLayers.length]);
          }
          const mockOrb: Orb = {
            ...baseOrb,
            id: baseOrb.id || "orb-dev-full-mock",
            level: 7,
            layers: forcedLayers.slice(0, 7),
            isAwakened: true,
            completedAt: baseOrb.completedAt || new Date().toISOString(),
            lastLayerAddedAt: new Date().toISOString(),
          };
          setCurrentOrb(mockOrb);
          await AsyncStorage.setItem("currentOrb", JSON.stringify(mockOrb));
          console.log("DEV FULL MOCK: awakened orb level 7 simulated");
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        journeyStateLoadCompleteRef.current = true;
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (cloudCustomMeditationsHydratedRef.current || IS_LOCAL_DEV) return;

    let cancelled = false;
    const hydrateCloudCustomMeditations = async () => {
      try {
        const { userId } = await resolveMeditationUserId({ walletAddress });
        if (!userId) return;

        const cloudSnapshot = await fetchCloudCustomMeditations<CustomMeditation>(sanitizeUserId(userId));
        if (cancelled || !cloudSnapshot.items.length) {
          cloudCustomMeditationsHydratedRef.current = true;
          return;
        }

        const cloudItems = normalizeCustomMeditations(cloudSnapshot.items);
        if (!cloudItems.length) {
          cloudCustomMeditationsHydratedRef.current = true;
          return;
        }

        setCustomMeditations((current) => {
          const merged = new Map<string, CustomMeditation>();
          current.forEach((item) => merged.set(item.id, item));
          cloudItems.forEach((cloudItem) => {
            const currentItem = merged.get(cloudItem.id);
            if (!currentItem || getMeditationRevisionTime(cloudItem) >= getMeditationRevisionTime(currentItem)) {
              merged.set(cloudItem.id, cloudItem);
            }
          });

          const mergedItems = Array.from(merged.values()).sort(
            (a, b) => getMeditationRevisionTime(a) - getMeditationRevisionTime(b)
          );
          void AsyncStorage.setItem(CUSTOM_MEDITATIONS_STORAGE_KEY, JSON.stringify(mergedItems));
          void AsyncStorage.setItem(CUSTOM_MEDITATIONS_BACKUP_STORAGE_KEY, JSON.stringify(mergedItems));
          return mergedItems;
        });
        const nextState: CustomMeditationCloudSyncState = {
          status: "synced",
          lastSyncedAt: cloudSnapshot.updatedAt || new Date().toISOString(),
          error: null,
        };
        setCustomMeditationCloudSync(nextState);
        void AsyncStorage.setItem(CUSTOM_MEDITATIONS_CLOUD_SYNC_STORAGE_KEY, JSON.stringify(nextState));
      } catch (error) {
        console.error("[MeditationProvider] Failed to hydrate custom meditations from cloud:", error);
        const nextState: CustomMeditationCloudSyncState = {
          status: "error",
          lastSyncedAt: null,
          error: error instanceof Error ? error.message : "cloud_hydration_failed",
        };
        setCustomMeditationCloudSync(nextState);
        void AsyncStorage.setItem(CUSTOM_MEDITATIONS_CLOUD_SYNC_STORAGE_KEY, JSON.stringify(nextState));
      } finally {
        cloudCustomMeditationsHydratedRef.current = true;
      }
    };

    void hydrateCloudCustomMeditations();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  useEffect(() => {
    if (!journeyStateLoadCompleteRef.current || journeyStateHydratedRef.current || IS_LOCAL_DEV) return;

    let cancelled = false;
    const hydrateJourneyState = async () => {
      try {
        const { userId } = await resolveMeditationUserId({ walletAddress });
        if (!userId) return;

        const cloudSnapshot = await fetchCloudJourneyState<ReturnType<typeof getJourneyStateSnapshot>>(sanitizeUserId(userId));
        if (cancelled || !cloudSnapshot.state) {
          journeyStateHydratedRef.current = true;
          return;
        }

        const localTime = getSnapshotTime(journeyStateCloudSync.lastSyncedAt);
        const cloudTime = getSnapshotTime(cloudSnapshot.updatedAt);
        if (localTime > 0 && localTime >= cloudTime) {
          journeyStateHydratedRef.current = true;
          return;
        }

        isApplyingCloudJourneyStateRef.current = true;
        const nextState = cloudSnapshot.state;
        if (nextState.stats) {
          setStats(nextState.stats);
          await AsyncStorage.setItem("meditationStats", JSON.stringify(nextState.stats));
        }
        if (nextState.currentOrb) {
          setCurrentOrb(nextState.currentOrb);
          await AsyncStorage.setItem("currentOrb", JSON.stringify(nextState.currentOrb));
        }
        if (Array.isArray(nextState.orbHistory)) {
          setOrbHistory(nextState.orbHistory);
          await AsyncStorage.setItem("orbHistory", JSON.stringify(nextState.orbHistory));
        }
        if (nextState.orbDisplayMode === "idle" || nextState.orbDisplayMode === "diffused") {
          setOrbDisplayModeState(nextState.orbDisplayMode);
          await AsyncStorage.setItem("orbDisplayMode", nextState.orbDisplayMode);
        }
        if (nextState.missionStats) {
          setMissionStats(nextState.missionStats);
          await AsyncStorage.setItem("missionStats", JSON.stringify(nextState.missionStats));
        }
        if (nextState.resonanceState) {
          setResonanceState(nextState.resonanceState);
          await AsyncStorage.setItem("resonanceState", JSON.stringify(nextState.resonanceState));
        }

        const nextSync = {
          lastSyncedAt: cloudSnapshot.updatedAt || new Date().toISOString(),
        };
        setJourneyStateCloudSync(nextSync);
        await AsyncStorage.setItem(JOURNEY_STATE_CLOUD_SYNC_STORAGE_KEY, JSON.stringify(nextSync));
      } catch (error) {
        console.error("[MeditationProvider] Failed to hydrate journey state from cloud:", error);
      } finally {
        isApplyingCloudJourneyStateRef.current = false;
        journeyStateHydratedRef.current = true;
      }
    };

    void hydrateJourneyState();

    return () => {
      cancelled = true;
    };
  }, [journeyStateCloudSync.lastSyncedAt, walletAddress]);

  useEffect(() => {
    if (!journeyStateLoadCompleteRef.current || !journeyStateHydratedRef.current || isApplyingCloudJourneyStateRef.current || IS_LOCAL_DEV) {
      return;
    }

    let cancelled = false;
    const syncJourneyState = async () => {
      try {
        const { userId } = await resolveMeditationUserId({ walletAddress });
        if (!userId) return;

        const syncedAt = new Date().toISOString();
        await saveCloudJourneyState({
          userId: sanitizeUserId(userId),
          state: getJourneyStateSnapshot(),
          updatedAt: syncedAt,
        });
        if (cancelled) return;
        const nextSync = { lastSyncedAt: syncedAt };
        setJourneyStateCloudSync(nextSync);
        await AsyncStorage.setItem(JOURNEY_STATE_CLOUD_SYNC_STORAGE_KEY, JSON.stringify(nextSync));
      } catch (error) {
        console.error("[MeditationProvider] Failed to sync journey state to cloud:", error);
      }
    };

    void syncJourneyState();

    return () => {
      cancelled = true;
    };
  }, [walletAddress, stats, currentOrb, orbHistory, orbDisplayMode, missionStats, resonanceState]);

  const syncCustomMeditationsNow = async () => {
    if (IS_LOCAL_DEV) return;
    const { userId } = await resolveMeditationUserId({ walletAddress });
    if (!userId) return;
    const syncedAt = new Date().toISOString();
    setCustomMeditationCloudSync((current) => ({
      ...current,
      status: "syncing",
      error: null,
    }));
    try {
      await saveCloudCustomMeditations({
        userId: sanitizeUserId(userId),
        items: customMeditations,
        updatedAt: syncedAt,
      });
      const nextState: CustomMeditationCloudSyncState = {
        status: "synced",
        lastSyncedAt: syncedAt,
        error: null,
      };
      setCustomMeditationCloudSync(nextState);
      await AsyncStorage.setItem(CUSTOM_MEDITATIONS_CLOUD_SYNC_STORAGE_KEY, JSON.stringify(nextState));
    } catch (error) {
      const nextState: CustomMeditationCloudSyncState = {
        status: "error",
        lastSyncedAt: customMeditationCloudSync.lastSyncedAt,
        error: error instanceof Error ? error.message : "sync_failed",
      };
      setCustomMeditationCloudSync(nextState);
      await AsyncStorage.setItem(CUSTOM_MEDITATIONS_CLOUD_SYNC_STORAGE_KEY, JSON.stringify(nextState));
      throw error;
    }
  };

  const persistMissionStats = async (nextStats: MissionStats) => {
    setMissionStats(nextStats);
    await AsyncStorage.setItem("missionStats", JSON.stringify(nextStats));
  };

  const persistResonanceState = async (nextState: ResonanceState) => {
    setResonanceState(nextState);
    await AsyncStorage.setItem("resonanceState", JSON.stringify(nextState));
  };

  const persistAiUsageState = async (nextState: AiUsageState) => {
    setAiUsageState(nextState);
    await AsyncStorage.setItem("aiUsageState", JSON.stringify(nextState));
  };

  const normalizeAiUsageState = (state: AiUsageState, at: Date = new Date()) => {
    const dayKey = getLocalDayKey(at);
    if (state.dayKey === dayKey) return state;
    return {
      dayKey,
      used: 0,
      purchasedExtra: 0,
    };
  };

  const aiDailyLimit = hasActiveVIP ? VIP_DAILY_AI_GUIDANCE_LIMIT : FREE_DAILY_AI_GUIDANCE_LIMIT;

  const aiUsageSnapshot = useMemo(() => {
    const normalized = normalizeAiUsageState(aiUsageState);
    const totalAvailable = aiDailyLimit + normalized.purchasedExtra;
    return {
      dayKey: normalized.dayKey,
      used: normalized.used,
      purchasedExtra: normalized.purchasedExtra,
      limit: aiDailyLimit,
      totalAvailable,
      remaining: Math.max(0, totalAvailable - normalized.used),
    };
  }, [aiDailyLimit, aiUsageState]);

  const consumeAiGuidanceUse = async (_source: "chat" | "course") => {
    const normalized = normalizeAiUsageState(aiUsageState);
    const totalAvailable = aiDailyLimit + normalized.purchasedExtra;
    if (normalized.used >= totalAvailable) {
      return {
        granted: false,
        reason: "daily-limit-reached" as const,
        remaining: 0,
      };
    }

    const nextState: AiUsageState = {
      ...normalized,
      used: normalized.used + 1,
    };
    await persistAiUsageState(nextState);
    return {
      granted: true,
      remaining: Math.max(0, totalAvailable - nextState.used),
    };
  };

  const purchaseAiGuidanceTopUp = async (pack: "single" | "bundle" = "single") => {
    const normalized = normalizeAiUsageState(aiUsageState);
    const amount = pack === "bundle" ? AI_GUIDANCE_TOP_UP_AMOUNT_BUNDLE : AI_GUIDANCE_TOP_UP_AMOUNT_SINGLE;
    const cost = pack === "bundle" ? AI_GUIDANCE_TOP_UP_COST_BUNDLE : AI_GUIDANCE_TOP_UP_COST_SINGLE;
    const ledgerType: ResonanceLedgerType = pack === "bundle" ? "aiBundleSpend" : "aiTopUpSpend";

    if (resonanceState.balance < cost) {
      return {
        granted: false,
        reason: "insufficient-balance" as const,
        amount: 0,
        balanceAfter: resonanceState.balance,
      };
    }

    const nextResonanceState = appendResonanceLedgerEntry(
      {
        ...resonanceState,
        balance: resonanceState.balance - cost,
        totalSpent: resonanceState.totalSpent + cost,
      },
      ledgerType,
      -cost
    );

    const nextAiUsageState: AiUsageState = {
      ...normalized,
      purchasedExtra: normalized.purchasedExtra + amount,
    };

    await persistResonanceState(nextResonanceState);
    await persistAiUsageState(nextAiUsageState);

    return {
      granted: true,
      amount,
      balanceAfter: nextResonanceState.balance,
      remainingAfter: Math.max(0, aiDailyLimit + nextAiUsageState.purchasedExtra - nextAiUsageState.used),
    };
  };

  const claimDailyCheckIn = async () => {
    const todayKey = getLocalDayKey();
    if (resonanceState.lastCheckInDate === todayKey) {
      return {
        granted: false,
        amount: 0,
        reason: "already-claimed" as const,
      };
    }

    const reward = applyResonanceReward(resonanceState, "dailyCheckIn");
    if (!reward.granted) {
      return {
        granted: false,
        amount: 0,
        reason: "daily-cap" as const,
      };
    }

    await persistResonanceState(reward.nextState);
    return {
      granted: true,
      amount: reward.amount,
      reason: "claimed" as const,
    };
  };

  const hasClaimedDailyCheckIn = useMemo(() => {
    return resonanceState.lastCheckInDate === getLocalDayKey();
  }, [resonanceState.lastCheckInDate]);

  const unlockBlessingBoost = async () => {
    if (resonanceState.balance < RESONANCE_BLESSING_BOOST_COST) {
      return {
        granted: false,
        reason: "insufficient-balance" as const,
      };
    }

    const nextState = appendResonanceLedgerEntry(
      {
        ...resonanceState,
        balance: resonanceState.balance - RESONANCE_BLESSING_BOOST_COST,
        totalSpent: resonanceState.totalSpent + RESONANCE_BLESSING_BOOST_COST,
        blessingBoostCharges: resonanceState.blessingBoostCharges + 1,
      },
      "blessingBoostSpend",
      -RESONANCE_BLESSING_BOOST_COST
    );

    await persistResonanceState(nextState);
    return {
      granted: true,
      remainingCharges: nextState.blessingBoostCharges,
      balanceAfter: nextState.balance,
    };
  };

  const isOrbAuraActive = useMemo(() => {
    return resonanceState.orbAuraDayKey === getLocalDayKey();
  }, [resonanceState.orbAuraDayKey]);

  const unlockOrbAura = async () => {
    if (isOrbAuraActive) {
      return {
        granted: false,
        reason: "already-active" as const,
      };
    }

    if (resonanceState.balance < RESONANCE_ORB_AURA_COST) {
      return {
        granted: false,
        reason: "insufficient-balance" as const,
      };
    }

    const dayKey = getLocalDayKey();
    const nextState = appendResonanceLedgerEntry(
      {
        ...resonanceState,
        balance: resonanceState.balance - RESONANCE_ORB_AURA_COST,
        totalSpent: resonanceState.totalSpent + RESONANCE_ORB_AURA_COST,
        orbAuraDayKey: dayKey,
      },
      "orbAuraSpend",
      -RESONANCE_ORB_AURA_COST
    );

    await persistResonanceState(nextState);
    return {
      granted: true,
      activeDayKey: dayKey,
      balanceAfter: nextState.balance,
    };
  };

  const hasAmbientPassToday = useMemo(() => {
    return resonanceState.ambientPassDayKey === getLocalDayKey();
  }, [resonanceState.ambientPassDayKey]);

  const unlockAmbientPass = async () => {
    if (hasAmbientPassToday) {
      return {
        granted: false,
        reason: "already-active" as const,
      };
    }

    if (resonanceState.balance < RESONANCE_AMBIENT_PASS_COST) {
      return {
        granted: false,
        reason: "insufficient-balance" as const,
      };
    }

    const dayKey = getLocalDayKey();
    const nextState = appendResonanceLedgerEntry(
      {
        ...resonanceState,
        balance: resonanceState.balance - RESONANCE_AMBIENT_PASS_COST,
        totalSpent: resonanceState.totalSpent + RESONANCE_AMBIENT_PASS_COST,
        ambientPassDayKey: dayKey,
      },
      "ambientPassSpend",
      -RESONANCE_AMBIENT_PASS_COST
    );

    await persistResonanceState(nextState);
    return {
      granted: true,
      activeDayKey: dayKey,
      balanceAfter: nextState.balance,
    };
  };

  const grantTestResonance = async (amount: number = 50) => {
    if (amount <= 0) {
      return {
        granted: false,
        reason: "invalid-amount" as const,
      };
    }

    const nextState = appendResonanceLedgerEntry(
      {
        ...resonanceState,
        balance: resonanceState.balance + amount,
        totalEarned: resonanceState.totalEarned + amount,
      },
      "testGrant",
      amount
    );

    await persistResonanceState(nextState);
    return {
      granted: true,
      amount,
      balanceAfter: nextState.balance,
    };
  };

  const consumeBlessingBoost = async () => {
    if (resonanceState.blessingBoostCharges <= 0) {
      return {
        boosted: false,
      };
    }

    const nextState: ResonanceState = {
      ...resonanceState,
      blessingBoostCharges: Math.max(0, resonanceState.blessingBoostCharges - 1),
    };
    await persistResonanceState(nextState);

    return {
      boosted: true,
      remainingCharges: nextState.blessingBoostCharges,
    };
  };

  const dailyAwakeningMinutesRequired = hasActiveVIP
    ? VIP_DAILY_AWAKENING_MINUTES
    : FREE_DAILY_AWAKENING_MINUTES;

  const unlockedMissionShapes = useMemo(() => {
    return SHAPE_MISSION_DEFINITIONS
      .filter((mission) => {
        const target = hasActiveVIP ? mission.target.vip : mission.target.free;
        switch (mission.metric) {
          case "totalSessions":
            return stats.totalSessions >= target;
          case "totalMinutes":
            return stats.totalMinutes >= target;
          case "currentStreak":
            return stats.currentStreak >= target;
          case "blessingsSent":
            return missionStats.blessingsSent >= target;
          case "uniqueCategories":
            return missionStats.uniqueCategories.length >= target;
          case "orbsStored":
            return missionStats.orbsStored >= target;
          case "shapeChanges":
            return missionStats.shapeChanges >= target;
          case "highestOrbLevel":
            return missionStats.highestOrbLevel >= target;
          case "customMeditationsCreated":
            return missionStats.customMeditationsCreated >= target;
          case "customMeditationsCompleted":
            return missionStats.customMeditationsCompleted >= target;
          default:
            return false;
        }
      })
      .map((mission) => mission.unlockShape as OrbShape);
  }, [hasActiveVIP, missionStats.blessingsSent, missionStats.customMeditationsCompleted, missionStats.customMeditationsCreated, missionStats.highestOrbLevel, missionStats.orbsStored, missionStats.shapeChanges, missionStats.uniqueCategories.length, stats.currentStreak, stats.totalMinutes, stats.totalSessions]);

  const unlockedShapes = useMemo(() => {
    return Array.from(
      new Set<OrbShape>([
        ...missionStats.starterShapesGranted.map((shape) => shape as OrbShape),
        ...unlockedMissionShapes,
      ])
    );
  }, [missionStats.starterShapesGranted, unlockedMissionShapes]);

  const missions = useMemo(() => {
    return SHAPE_MISSION_DEFINITIONS.map((mission) => {
      const target = hasActiveVIP ? mission.target.vip : mission.target.free;
      let progress = 0;

      switch (mission.metric) {
        case "totalSessions":
          progress = stats.totalSessions;
          break;
        case "totalMinutes":
          progress = stats.totalMinutes;
          break;
        case "currentStreak":
          progress = stats.currentStreak;
          break;
        case "blessingsSent":
          progress = missionStats.blessingsSent;
          break;
        case "uniqueCategories":
          progress = missionStats.uniqueCategories.length;
          break;
        case "orbsStored":
          progress = missionStats.orbsStored;
          break;
        case "shapeChanges":
          progress = missionStats.shapeChanges;
          break;
        case "highestOrbLevel":
          progress = missionStats.highestOrbLevel;
          break;
        case "customMeditationsCreated":
          progress = missionStats.customMeditationsCreated;
          break;
        case "customMeditationsCompleted":
          progress = missionStats.customMeditationsCompleted;
          break;
      }

      return {
        ...mission,
        targetValue: target,
        progressValue: Math.min(progress, target),
        completed: progress >= target,
      };
    });
  }, [hasActiveVIP, missionStats.blessingsSent, missionStats.customMeditationsCompleted, missionStats.customMeditationsCreated, missionStats.highestOrbLevel, missionStats.orbsStored, missionStats.shapeChanges, missionStats.uniqueCategories.length, stats.currentStreak, stats.totalMinutes, stats.totalSessions]);

  const beginnerJourney = useMemo(() => {
    return BEGINNER_TASK_DEFINITIONS.map((task) => {
      const target = hasActiveVIP ? task.target.vip : task.target.free;
      let progress = 0;

      switch (task.metric) {
        case "totalSessions":
          progress = stats.totalSessions;
          break;
        case "blessingsSent":
          progress = missionStats.blessingsSent;
          break;
        case "orbsStored":
          progress = missionStats.orbsStored;
          break;
        case "shapeChanges":
          progress = missionStats.shapeChanges;
          break;
        case "highestOrbLevel":
          progress = missionStats.highestOrbLevel;
          break;
      }

      return {
        ...task,
        targetValue: target,
        progressValue: Math.min(progress, target),
        completed: progress >= target,
      };
    });
  }, [hasActiveVIP, missionStats.blessingsSent, missionStats.highestOrbLevel, missionStats.orbsStored, missionStats.shapeChanges, stats.totalSessions]);

  const updateWeekProgress = (currentStats: MeditationStats) => {
    const today = new Date().getDay();
    const lastSession = currentStats.lastSessionDate ? new Date(currentStats.lastSessionDate) : null;
    
    if (lastSession && lastSession.toDateString() === new Date().toDateString()) {
      const newWeekProgress = [...currentStats.weekProgress];
      newWeekProgress[today] = true;
      setStats({ ...currentStats, weekProgress: newWeekProgress });
    }
  };

  const completeMeditation = async (
    sessionId: string,
    duration: number,
    growOrb: boolean = false,
    courseName?: string
  ): Promise<{
    uploaded: boolean;
    error?: string;
    sessionCategory: string | null;
    addedNewCategory: boolean;
    customMeditationCompleted: boolean;
    streakAfter: number;
    totalSessionsAfter: number;
    totalMinutesAfter: number;
    orbLevelBefore: number;
    orbLevelAfter: number;
    orbAwakenedNow: boolean;
    resonanceGained: number;
    resonanceRewardTypes: ResonanceRewardType[];
    resonanceBalanceAfter: number;
    resonanceDailyCapReached: boolean;
  }> => {
    const orbLevelBefore = currentOrb.level;
    const orbWasAwakened = currentOrb.isAwakened;
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

    const sessionCategory =
      MEDITATION_SESSIONS.find((session) => session.id === sessionId)?.category ||
      (sessionId.startsWith("custom-") ? "custom" : null) ||
      (sessionId.startsWith("garden-") ? "spiritual" : null);
    const isCustomSession = sessionId.startsWith("custom-");
    const addedNewCategory = sessionCategory ? !missionStats.uniqueCategories.includes(sessionCategory) : false;
    const orbLevelAfter = growOrb && !currentOrb.isAwakened
      ? Math.min(currentOrb.level + 1, ORB_AWAKENING_DAYS_REQUIRED)
      : currentOrb.level;
    const orbAwakenedNow = !orbWasAwakened && orbLevelAfter === ORB_AWAKENING_DAYS_REQUIRED;
    let nextResonanceState = resonanceState;
    const resonanceRewardTypes: ResonanceRewardType[] = [];
    let resonanceGained = 0;
    let resonanceDailyCapReached = false;

    if (nextResonanceState.lastMeditationRewardDate !== getLocalDayKey()) {
      const reward = applyResonanceReward(nextResonanceState, "dailyMeditation");
      if (reward.granted) {
        nextResonanceState = reward.nextState;
        resonanceGained += reward.amount;
        resonanceRewardTypes.push("dailyMeditation");
      }
      if (reward.capped) {
        resonanceDailyCapReached = true;
      }
    }

    if (growOrb && nextResonanceState.lastChakraRewardDate !== getLocalDayKey()) {
      const reward = applyResonanceReward(nextResonanceState, "chakraRitual");
      if (reward.granted) {
        nextResonanceState = reward.nextState;
        resonanceGained += reward.amount;
        resonanceRewardTypes.push("chakraRitual");
      }
      if (reward.capped) {
        resonanceDailyCapReached = true;
      }
    }

    if (nextResonanceState !== resonanceState) {
      await persistResonanceState(nextResonanceState);
    }

    const completionSummary = {
      sessionCategory,
      addedNewCategory,
      customMeditationCompleted: isCustomSession,
      streakAfter: newStats.currentStreak,
      totalSessionsAfter: newStats.totalSessions,
      totalMinutesAfter: newStats.totalMinutes,
      orbLevelBefore,
      orbLevelAfter,
      orbAwakenedNow,
      resonanceGained,
      resonanceRewardTypes,
      resonanceBalanceAfter: nextResonanceState.balance,
      resonanceDailyCapReached,
    };
    const nextLastMeditationContext: LastMeditationContext = {
      sessionId,
      courseName: courseName || sessionId,
      duration,
      completedAt: today.toISOString(),
      category: sessionCategory,
      isCustomSession: isCustomSession,
    };
    setLastMeditationContext(nextLastMeditationContext);
    await AsyncStorage.setItem("lastMeditationContext", JSON.stringify(nextLastMeditationContext));
    if (sessionCategory) {
      const nextMissionStats: MissionStats = {
        ...missionStats,
        uniqueCategories: Array.from(new Set([...missionStats.uniqueCategories, sessionCategory])),
        highestOrbLevel: Math.max(missionStats.highestOrbLevel, growOrb ? currentOrb.level + 1 : currentOrb.level),
        customMeditationsCompleted: missionStats.customMeditationsCompleted + (isCustomSession ? 1 : 0),
      };
      await persistMissionStats(nextMissionStats);
    }

    // Upload to Firebase if user is logged in
    const { userId, source } = await resolveMeditationUserId({ walletAddress });
    const userIdForFirebase = userId ? sanitizeUserId(userId) : null;

    console.log("[MeditationProvider] completeMeditation: checking userId for Firebase upload");
    console.log("[MeditationProvider] walletAddress:", walletAddress);
    console.log("[MeditationProvider] resolved userId:", userId);
    console.log("[MeditationProvider] resolved userId (sanitized):", userIdForFirebase);
    console.log("[MeditationProvider] userId source:", source);
    console.log("[MeditationProvider] sessionId:", sessionId);
    console.log("[MeditationProvider] courseName:", courseName);
    console.log("[MeditationProvider] duration:", duration);
    
    if (IS_LOCAL_DEV) {
      Alert.alert(`Upload userId (${source}): ${userIdForFirebase || "missing"}`);
      Alert.alert("Attempting upload...");
    }

    if (userIdForFirebase) {
      console.log("[MeditationProvider] User logged in, attempting Firebase upload...", {
        userIdPrefix: `${userIdForFirebase.slice(0, 6)}...`,
        source,
      });
      const recordData = {
        userId: userIdForFirebase,
        courseName: courseName || sessionId,
        duration,
      };
      try {
        console.log("[Meditation] Uploading record: " + JSON.stringify(recordData));
        const result = await uploadMeditationRecord(recordData);
        console.log("[Meditation] Uploading record: " + JSON.stringify(recordData));
        console.log("[MeditationProvider] Meditation record uploaded to Firebase, recordId:", result.recordId);
        if (IS_LOCAL_DEV) {
          Alert.alert("記錄已上傳");
        }
        // Orb Logic after successful upload
        if (growOrb && !currentOrb.isAwakened) {
          const nextLevel = currentOrb.level + 1;
          if (nextLevel <= ORB_AWAKENING_DAYS_REQUIRED) {
            const newLayer = CHAKRA_COLORS[currentOrb.level % 7];
            const updatedOrb = {
              ...currentOrb,
              level: nextLevel,
              layers: [...currentOrb.layers, newLayer],
              isAwakened: nextLevel === ORB_AWAKENING_DAYS_REQUIRED,
              completedAt: nextLevel === ORB_AWAKENING_DAYS_REQUIRED ? new Date().toISOString() : undefined,
              lastLayerAddedAt: new Date().toISOString()
            };
            setCurrentOrb(updatedOrb);
            await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));
          }
        }

        // Check achievements
        await checkAndUpdateAchievements(newStats);
        return { uploaded: true, ...completionSummary };
      } catch (e: any) {
        console.error("[MeditationProvider] Failed to upload meditation record:", e);
        console.error("[MeditationProvider] Error message:", e?.message);
        const code = e?.code ?? "unknown";
        const message = e?.message ?? "";
        if (IS_LOCAL_DEV) {
          Alert.alert("冥想記錄雲端同步失敗", `${code}: ${message}`);
        }
        // Still do orb and achievements even if upload failed
        if (growOrb && !currentOrb.isAwakened) {
          const nextLevel = currentOrb.level + 1;
          if (nextLevel <= ORB_AWAKENING_DAYS_REQUIRED) {
            const newLayer = CHAKRA_COLORS[currentOrb.level % 7];
            const updatedOrb = {
              ...currentOrb,
              level: nextLevel,
              layers: [...currentOrb.layers, newLayer],
              isAwakened: nextLevel === ORB_AWAKENING_DAYS_REQUIRED,
              completedAt: nextLevel === ORB_AWAKENING_DAYS_REQUIRED ? new Date().toISOString() : undefined,
              lastLayerAddedAt: new Date().toISOString()
            };
            setCurrentOrb(updatedOrb);
            await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));
          }
        }
        await checkAndUpdateAchievements(newStats);
        return {
          uploaded: false,
          error: e?.message ?? "upload_failed",
          ...completionSummary,
        };
      }
    } else {
      console.log("[MeditationProvider] WARNING: No userId - skipping Firebase upload");
      if (IS_LOCAL_DEV) {
        Alert.alert("上傳失敗: userId missing");
      }
      // Still do orb and achievements even without wallet
      if (growOrb && !currentOrb.isAwakened) {
        const nextLevel = currentOrb.level + 1;
        if (nextLevel <= ORB_AWAKENING_DAYS_REQUIRED) {
          const newLayer = CHAKRA_COLORS[currentOrb.level % 7];
          const updatedOrb = {
            ...currentOrb,
            level: nextLevel,
            layers: [...currentOrb.layers, newLayer],
            isAwakened: nextLevel === ORB_AWAKENING_DAYS_REQUIRED,
            completedAt: nextLevel === ORB_AWAKENING_DAYS_REQUIRED ? new Date().toISOString() : undefined,
            lastLayerAddedAt: new Date().toISOString()
          };
          setCurrentOrb(updatedOrb);
          await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));
        }
      }
      await checkAndUpdateAchievements(newStats);
      return { uploaded: false, error: "Upload failed: missing userId", ...completionSummary };
    }
  };

  const checkAndUpdateAchievements = async (newStats: MeditationStats) => {
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
    await persistCustomMeditations(updated);
    void deleteCloudTtsCacheForMeditation({
      walletAddress,
      sessionId: id,
    });
  };

  const updateCustomMeditation = async (id: string, updates: Partial<CustomMeditation>) => {
    const updated = customMeditations.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m);
    setCustomMeditations(updated);
    await persistCustomMeditations(updated);
  };

  const addCustomMeditation = async (meditation: Omit<CustomMeditation, "id" | "createdAt">) => {
    const newMeditation: CustomMeditation = {
      ...meditation,
      id: `custom-${Date.now()}`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      breathingMethod: "4-7-8",
      gradient: ["#8B5CF6", "#6366F1"],
      previewText:
        meditation.previewText ||
        buildMeditationPreviewText(meditation.script, meditation.openingPreview, meditation.language),
      contentVersion: meditation.contentVersion ?? AI_MEDITATION_CONTENT_VERSION,
      qualityFlags: meditation.qualityFlags ?? [],
    };
    const updated = [...customMeditations, newMeditation];
    setCustomMeditations(updated);
    await persistCustomMeditations(updated);
    await persistMissionStats({
      ...missionStats,
      customMeditationsCreated: missionStats.customMeditationsCreated + 1,
    });
    let rewardSummary = {
      granted: false,
      amount: 0,
      balanceAfter: resonanceState.balance,
    };
    if (!resonanceState.firstAiCreationRewardClaimed) {
      const reward = applyResonanceReward(resonanceState, "aiCreation");
      if (reward.granted) {
        await persistResonanceState(reward.nextState);
        rewardSummary = {
          granted: true,
          amount: reward.amount,
          balanceAfter: reward.nextState.balance,
        };
      }
    }
    return {
      meditation: newMeditation,
      reward: rewardSummary,
    };
  };

  const recordBlessingSent = async () => {
    await persistMissionStats({
      ...missionStats,
      blessingsSent: missionStats.blessingsSent + 1,
    });
  };

  const sendOrb = async (_friendId: string, _message: string, _toWalletAddress?: string) => {
    // Garden owns cloud gifting authority now. Provider keeps only the mission/progression side effect.
    await recordBlessingSent();
  };

  const receiveGiftOrb = async (gift: {
    fromDisplayName?: string;
    fromWalletAddress?: string;
    resonanceBlessed?: boolean;
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
      isBlessingGift: true,
      isVipGiftedStarter: false,
      resonanceBlessed: Boolean(gift.resonanceBlessed),
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

    console.log("[MeditationProvider][Gifts] Starting 10s gift poll for:", walletAddress);

    const run = async () => {
      if (giftPollInFlightRef.current) return;
      giftPollInFlightRef.current = true;

      try {
        const gifts = await fetchAndConsumeGifts({
          myWalletAddress: walletAddress,
          myUsername: profile.username || null,
          max: 10,
        });
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
    const id = setInterval(() => {
      void run();
    }, 10000);

    return () => {
      clearInterval(id);
    };
  }, [walletAddress, profile.username]);

  // Dev Tools
  const devAddLayer = async () => {
     const nextLevel = currentOrb.level + 1;
     if (nextLevel <= ORB_AWAKENING_DAYS_REQUIRED) {
       const newLayer = CHAKRA_COLORS[currentOrb.level % 7];
       const updatedOrb = {
         ...currentOrb,
         level: nextLevel,
         layers: [...currentOrb.layers, newLayer],
         isAwakened: nextLevel === ORB_AWAKENING_DAYS_REQUIRED,
         completedAt: nextLevel === ORB_AWAKENING_DAYS_REQUIRED ? new Date().toISOString() : undefined
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
       level: ORB_AWAKENING_DAYS_REQUIRED,
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
    const duration = dailyAwakeningMinutesRequired;
    await completeMeditation("garden-cultivation", duration, true);
  };

  const hasShapeUnlocked = (shape: OrbShape) => {
    if (IS_DEV_FULL_MOCK) return true;
    return unlockedShapes.includes(shape);
  };

  const canUseShape = (shape: OrbShape) => {
    if (IS_DEV_FULL_MOCK) return true;
    if ((FREE_CORE_SHAPES as readonly string[]).includes(shape)) return true;
    return hasShapeUnlocked(shape);
  };

  const getShapeUnlockMission = (shape: OrbShape) => {
    return missions.find((mission) => mission.unlockShape === shape) ?? null;
  };

  const getShapeAccessMeta = (shape: OrbShape) => {
    if (IS_DEV_FULL_MOCK) {
      return { status: "dev-mock" as const, mission: null };
    }
    if ((FREE_CORE_SHAPES as readonly string[]).includes(shape)) {
      return { status: "free-core" as const, mission: null };
    }
    if (missionStats.starterShapesGranted.includes(shape)) {
      return { status: "vip-starter" as const, mission: null };
    }
    const mission = getShapeUnlockMission(shape);
    if (mission) {
      return {
        status: mission.completed ? ("mission-unlocked" as const) : ("mission-locked" as const),
        mission,
      };
    }
    return { status: "sealed-archive" as const, mission: null };
  };

  const grantVipStarterPack = async () => {
    const starterAlreadyGranted = missionStats.vipStarterPackGranted;
    const nextMissionStats: MissionStats = {
      ...missionStats,
      starterShapesGranted: Array.from(new Set([...missionStats.starterShapesGranted, ...VIP_STARTER_SHAPES])),
      vipStarterPackGranted: true,
      vipWelcomeSeen: false,
    };
    await persistMissionStats(nextMissionStats);

    if (!starterAlreadyGranted) {
      const starterOrb: Orb = {
        id: `vip-starter-${Date.now()}`,
        level: ORB_AWAKENING_DAYS_REQUIRED,
        layers: [...CHAKRA_COLORS],
        isAwakened: true,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        lastLayerAddedAt: new Date().toISOString(),
        shape: "halo-bloom",
        sender: VIP_STARTER_ORB_SENDER,
        message: VIP_STARTER_ORB_MESSAGE,
        isVipGiftedStarter: true,
      };
      const nextHistory = [starterOrb, ...orbHistory];
      setOrbHistory(nextHistory);
      await AsyncStorage.setItem("orbHistory", JSON.stringify(nextHistory));
    }
  };

  const resetVipStarterPack = async () => {
    const filteredHistory = orbHistory.filter(
      (orb) => !(orb.sender === VIP_STARTER_ORB_SENDER && orb.message === VIP_STARTER_ORB_MESSAGE)
    );
    setOrbHistory(filteredHistory);
    await AsyncStorage.setItem("orbHistory", JSON.stringify(filteredHistory));
    await persistMissionStats({
      ...missionStats,
      starterShapesGranted: [],
      vipStarterPackGranted: false,
      vipWelcomeSeen: false,
    });
  };

  const markVipWelcomeSeen = async () => {
    await persistMissionStats({
      ...missionStats,
      vipWelcomeSeen: true,
    });
  };

  const resetVipTestingSandbox = async () => {
    const freshOrb: Orb = {
      ...INITIAL_ORB,
      id: `orb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setStats(INITIAL_STATS);
    setAchievements(ACHIEVEMENTS.map((achievement) => ({ ...achievement, unlocked: false })));
    setCurrentOrb(freshOrb);
    setOrbHistory([]);
    setOrbDisplayModeState("idle");
    setSharedSpinVelocity(0);

    await AsyncStorage.multiSet([
      ["meditationStats", JSON.stringify(INITIAL_STATS)],
      ["achievements", JSON.stringify(ACHIEVEMENTS.map((achievement) => ({ ...achievement, unlocked: false })))],
      ["currentOrb", JSON.stringify(freshOrb)],
      ["orbHistory", JSON.stringify([])],
      ["orbDisplayMode", "idle"],
      ["resonanceState", JSON.stringify(INITIAL_RESONANCE_STATE)],
      ["aiUsageState", JSON.stringify(INITIAL_AI_USAGE_STATE)],
      ["lastMeditationContext", JSON.stringify(INITIAL_LAST_MEDITATION_CONTEXT)],
    ]);

    await persistMissionStats(INITIAL_MISSION_STATS);
    setResonanceState(INITIAL_RESONANCE_STATE);
    setAiUsageState(INITIAL_AI_USAGE_STATE);
    setLastMeditationContext(INITIAL_LAST_MEDITATION_CONTEXT);
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
    await persistMissionStats({
      ...missionStats,
      orbsStored: missionStats.orbsStored + 1,
      highestOrbLevel: Math.max(missionStats.highestOrbLevel, storedOrb.level),
    });

    const newOrb = { ...INITIAL_ORB, id: `orb-${Date.now()}` };
    setCurrentOrb(newOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(newOrb));
  };

  const swapOrb = async (orbId: string) => {
    const orbIndex = orbHistory.findIndex(o => o.id === orbId);
    if (orbIndex === -1) return;

    const orbToRetrieve = orbHistory[orbIndex];
    if (orbToRetrieve.isBlessingGift) {
      return;
    }
    const newHistory = [...orbHistory];
    newHistory.splice(orbIndex, 1); // Remove retrieved orb

    // If current orb has progress OR non-default shape, save it to history
    if (currentOrb.level > 0 || currentOrb.layers.length > 0 || (currentOrb.shape && currentOrb.shape !== 'default')) {
      newHistory.unshift({ ...currentOrb });
    }

    const retrievedShape = orbToRetrieve.shape;
    const sanitizedRetrievedOrb =
      retrievedShape && retrievedShape !== "default" && !canUseShape(retrievedShape)
        ? {
            ...orbToRetrieve,
            shape: "default" as OrbShape,
          }
        : orbToRetrieve;

    setOrbHistory(newHistory);
    setCurrentOrb(sanitizedRetrievedOrb);

    await AsyncStorage.setItem("orbHistory", JSON.stringify(newHistory));
    await AsyncStorage.setItem("currentOrb", JSON.stringify(sanitizedRetrievedOrb));
  };

  const setOrbShape = async (shape: OrbShape) => {
    if (!canUseShape(shape)) {
      return;
    }
    if (currentOrb.shape !== shape) {
      await persistMissionStats({
        ...missionStats,
        shapeChanges: missionStats.shapeChanges + 1,
      });
    }
    const updatedOrb = { ...currentOrb, shape };
    setCurrentOrb(updatedOrb);
    await AsyncStorage.setItem("currentOrb", JSON.stringify(updatedOrb));
  };

  const setOrbDisplayMode = async (mode: OrbDisplayMode) => {
    setOrbDisplayModeState(mode);
    await AsyncStorage.setItem("orbDisplayMode", mode);
  };

  return {
    stats,
    achievements,
    customMeditations,
    customMeditationCloudSync,
    currentOrb,
    orbHistory,
    hasMeditatedToday,
    hasGrownOrbToday,
    cultivateDailyOrb,
    completeMeditation,
    addCustomMeditation,
    deleteCustomMeditation,
    updateCustomMeditation,
    syncCustomMeditationsNow,
    recordBlessingSent,
    sendOrb,
    receiveGiftOrb,
    devAddLayer,
    devInstantOrb,
    devResetOrb,
    devSendOrbToSelf,
    storeOrb,
    swapOrb,
    setOrbShape,
    dailyAwakeningMinutesRequired,
    missions,
    beginnerJourney,
    unlockedShapes,
    missionStats,
    resonanceState,
    aiUsageSnapshot,
    lastMeditationContext,
    hasClaimedDailyCheckIn,
    claimDailyCheckIn,
    consumeAiGuidanceUse,
    purchaseAiGuidanceTopUp,
    isOrbAuraActive,
    unlockOrbAura,
    hasAmbientPassToday,
    unlockAmbientPass,
    grantTestResonance,
    unlockBlessingBoost,
    consumeBlessingBoost,
    canUseShape,
    hasShapeUnlocked,
    getShapeUnlockMission,
    getShapeAccessMeta,
    grantVipStarterPack,
    resetVipStarterPack,
    resetVipTestingSandbox,
    markVipWelcomeSeen,
    orbDisplayMode,
    setOrbDisplayMode,
    sharedSpinVelocity,
    setSharedSpinVelocity,
  };
});
