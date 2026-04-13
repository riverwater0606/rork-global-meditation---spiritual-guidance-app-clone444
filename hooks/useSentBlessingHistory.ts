import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchGiftHistory, type GiftHistoryEntry } from "@/lib/firebaseGifts";
import type { OrbShape } from "@/providers/MeditationProvider";
import type { Language } from "@/providers/SettingsProvider";

export type LocalSentGiftRecord = {
  giftId: string;
  createdAt: string;
  toWalletAddress: string;
  toUsername?: string;
  friendName: string;
  blessing: string;
  status: "pending" | "uploaded" | "failed";
  resonanceBlessed?: boolean;
  orbSnapshot?: {
    level: number;
    layers: string[];
    isAwakened: boolean;
    createdAt: string;
    shape: OrbShape;
  };
};

export type GiftOrbSnapshot = NonNullable<LocalSentGiftRecord["orbSnapshot"]>;

export type SentBlessingDisplayStatus = "pending" | "synced" | "consumed" | "failed";

const LOCAL_GIFT_OUTBOX_STORAGE_KEY = "localGiftOutbox";

export function blessingHasResonanceMark(text?: string | null) {
  return Boolean(text && /Resonance/i.test(text));
}

export function getSentBlessingStatusLabel(
  status: "pending" | "uploaded" | "failed" | "consumed" | "synced",
  language: Language,
  giftId?: string
) {
  const t = (zh: string, en: string, es: string) => {
    if (language === "zh") return zh;
    if (language === "es") return es;
    return en;
  };
  if (status === "consumed") {
    return t("狀態：對方已接收並打開祝福", "Status: received and opened", "Estado: recibido y abierto");
  }
  if (status === "uploaded" || status === "synced") {
    return t(
      `狀態：已寫入雲端 · giftId: ${giftId}`,
      `Status: synced to cloud · giftId: ${giftId}`,
      `Estado: sincronizado con la nube · giftId: ${giftId}`
    );
  }
  if (status === "pending") {
    return t("狀態：正在寫入雲端", "Status: syncing to cloud", "Estado: sincronizando con la nube");
  }
  return t("狀態：上傳失敗", "Status: upload failed", "Estado: subida fallida");
}

export function useSentBlessingHistory(params: {
  walletAddress?: string | null;
  username?: string | null;
  language: Language;
}) {
  const { walletAddress, username, language } = params;
  const [sentBlessingHistory, setSentBlessingHistory] = useState<GiftHistoryEntry[]>([]);
  const [giftHistoryReady, setGiftHistoryReady] = useState(false);
  const [giftHistoryError, setGiftHistoryError] = useState<string | null>(null);
  const [localGiftOutbox, setLocalGiftOutbox] = useState<LocalSentGiftRecord[]>([]);

  const refreshSentBlessingHistory = useCallback(async () => {
    if (!walletAddress) {
      setSentBlessingHistory([]);
      setGiftHistoryReady(true);
      return;
    }

    try {
      const sentHistory = await fetchGiftHistory({
        walletAddress,
        username: username || null,
        role: "sender",
        max: 12,
      });
      setGiftHistoryError(null);
      setSentBlessingHistory(sentHistory);
      setGiftHistoryReady(true);
    } catch (error) {
      console.error("[gift] failed to refresh sent blessing history", error);
      setGiftHistoryError(
        language === "zh"
          ? "未能同步送出記錄，先顯示本機送出資料。"
          : language === "es"
            ? "Todavía no se pudo sincronizar el historial enviado. Mostrando primero los registros locales."
            : "Could not sync sent history yet. Showing local sent records first."
      );
      setGiftHistoryReady(true);
    }
  }, [language, username, walletAddress]);

  const persistLocalGiftOutbox = useCallback(
    async (updater: (prev: LocalSentGiftRecord[]) => LocalSentGiftRecord[]) => {
      setLocalGiftOutbox((prev) => {
        const next = updater(prev).slice(0, 12);
        void AsyncStorage.setItem(LOCAL_GIFT_OUTBOX_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const stageLocalGiftRecord = useCallback(
    async (record: LocalSentGiftRecord, fallbackSnapshot: GiftOrbSnapshot) => {
      await persistLocalGiftOutbox((prev) => [
        {
          ...record,
          orbSnapshot: record.orbSnapshot ?? fallbackSnapshot,
        },
        ...prev.filter((entry) => entry.giftId !== record.giftId),
      ]);
    },
    [persistLocalGiftOutbox]
  );

  useEffect(() => {
    const loadLocalGiftOutbox = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCAL_GIFT_OUTBOX_STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLocalGiftOutbox(parsed);
        }
      } catch (error) {
        console.error("[gift] failed to load local gift outbox", error);
      }
    };

    void loadLocalGiftOutbox();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const loadGiftHistory = async () => {
      await refreshSentBlessingHistory();
    };

    void loadGiftHistory();
    timer = setInterval(() => {
      if (!cancelled) {
        void loadGiftHistory();
      }
    }, 12000);

    return () => {
      cancelled = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [refreshSentBlessingHistory]);

  const displayedSentBlessings = useMemo(() => {
    const remoteById = new Map(sentBlessingHistory.map((entry) => [entry.giftId, entry]));

    const mergedLocal = localGiftOutbox
      .filter((entry) => !remoteById.has(entry.giftId))
      .map((entry) => ({
        giftId: entry.giftId,
        createdAt: entry.createdAt,
        from: walletAddress || "",
        to: entry.toWalletAddress,
        toUsername: entry.toUsername,
        friendName: entry.friendName,
        resonanceBlessed: Boolean(entry.resonanceBlessed),
        blessing: entry.blessing,
        orb: {
          id: "local-gift-preview",
          level: entry.orbSnapshot?.level ?? 0,
          layers: entry.orbSnapshot?.layers ?? [],
          isAwakened: entry.orbSnapshot?.isAwakened ?? false,
          createdAt: entry.orbSnapshot?.createdAt ?? entry.createdAt,
          shape: entry.orbSnapshot?.shape ?? "default",
        },
        role: "sender" as const,
        status: (entry.status === "uploaded" ? "synced" : entry.status) as SentBlessingDisplayStatus,
        viewOnly: true,
      }));

    return [...sentBlessingHistory, ...mergedLocal]
      .sort((a, b) => {
        const aBoosted = Boolean((a as any).resonanceBlessed) || blessingHasResonanceMark(a.blessing);
        const bBoosted = Boolean((b as any).resonanceBlessed) || blessingHasResonanceMark(b.blessing);
        if (aBoosted !== bBoosted) return aBoosted ? -1 : 1;
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      })
      .slice(0, 12);
  }, [localGiftOutbox, sentBlessingHistory, walletAddress]);

  const recentGiftRecipients = useMemo(() => {
    const seen = new Set<string>();
    const usernames: string[] = [];
    for (const entry of localGiftOutbox) {
      const nextUsername = entry.toUsername?.trim().replace(/^@/, "");
      if (!nextUsername || seen.has(nextUsername)) continue;
      seen.add(nextUsername);
      usernames.push(nextUsername);
      if (usernames.length >= 5) break;
    }
    return usernames;
  }, [localGiftOutbox]);

  return {
    sentBlessingHistory,
    giftHistoryReady,
    giftHistoryError,
    localGiftOutbox,
    displayedSentBlessings,
    recentGiftRecipients,
    refreshSentBlessingHistory,
    persistLocalGiftOutbox,
    stageLocalGiftRecord,
  };
}
