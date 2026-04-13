import { child, get, push, ref, remove, set, update } from "firebase/database";
import {
  getFirebaseLastAuthError,
  getFirebaseMaybe,
  getFirebaseMissingEnv,
  isAutomatedWebRuntime,
  isFirebaseEnabled,
  setFirebaseLastWriteError,
  waitForFirebaseAuth,
} from "@/constants/firebase";
import {
  sanitizeGiftIdentityId,
  syncFirebaseUserBinding,
} from "@/lib/firebaseIdentity";

export type GiftOrbPayloadV1 = {
  v: 1;
  createdAt: string;
  giftId?: string;
  giftKind: "blessing-copy";
  viewOnly: true;
  canMeditate: false;
  canUnlockMissions: false;
  to: string;
  toUsername?: string;
  from: string;
  senderGiftId: string;
  fromUsername?: string;
  fromDisplayName?: string;
  recipientWalletId?: string;
  recipientUsernameId?: string;
  resonanceBlessed?: boolean;
  blessing?: string;
  orb: {
    id: string;
    level: number;
    layers: string[];
    isAwakened: boolean;
    createdAt: string;
    completedAt?: string;
    shape?: string;
    rotationSpeed?: number;
  };
};

type GiftAuditPayload = GiftOrbPayloadV1 & {
  audit: {
    status: "pending" | "consumed";
    recipientIds: string[];
    createdByUid?: string;
    consumedAt?: string;
    consumedByUid?: string;
    consumedByWallet?: string;
  };
};

type GiftHistoryRecord = {
  giftId: string;
  createdAt: string;
  giftKind: GiftOrbPayloadV1["giftKind"];
  from: string;
  to: string;
  toUsername?: string;
  fromUsername?: string;
  fromDisplayName?: string;
  senderGiftId: string;
  recipientWalletId?: string;
  recipientUsernameId?: string;
  resonanceBlessed?: boolean;
  blessing?: string;
  orb: GiftOrbPayloadV1["orb"];
  role: "sender" | "receiver";
  status: "pending" | "consumed";
  viewOnly: true;
  consumedAt?: string;
};

export type GiftHistoryEntry = GiftHistoryRecord;

export function sanitizeWalletId(input: string): string {
  return sanitizeGiftIdentityId(input);
}

function getRecipientIds(params: { walletAddress?: string | null; username?: string | null }) {
  const ids = new Set<string>();
  if (params.walletAddress?.trim()) {
    ids.add(sanitizeWalletId(params.walletAddress));
  }
  if (params.username?.trim()) {
    ids.add(sanitizeWalletId(params.username));
  }
  return [...ids];
}
export async function uploadGiftOrb(params: {
  toWalletAddress?: string;
  toUsername?: string;
  fromWalletAddress: string;
  fromUsername?: string;
  fromDisplayName?: string;
  resonanceBlessed?: boolean;
  blessing?: string;
  orb: GiftOrbPayloadV1["orb"];
}): Promise<{ giftId: string }> {
  try {
    if (!isFirebaseEnabled()) {
      const missing = getFirebaseMissingEnv();
      console.error("[firebaseGifts] Firebase disabled - cannot upload gift", { missing });
      const error = new Error(`Firebase disabled (missing env: ${missing.join(", ")})`);
      (error as { code?: string }).code = "firebase/disabled";
      throw error;
    }
    console.log("[firebaseGifts] ========== GIFT UPLOAD START ==========");
    console.log("[firebaseGifts] uploadGiftOrb:start", {
      toWalletAddress: params.toWalletAddress,
      toUsername: params.toUsername,
      fromWalletAddress: params.fromWalletAddress,
      fromUsername: params.fromUsername,
      fromDisplayName: params.fromDisplayName,
      blessing: params.blessing,
      orbId: params.orb?.id,
      orbLevel: params.orb?.level,
    });
    console.log("[firebaseGifts] Waiting for Firebase auth...");
    const authUser = await waitForFirebaseAuth();
    
    if (!authUser) {
      const last = getFirebaseLastAuthError();
      console.error("[firebaseGifts] Firebase auth failed - no user", last);
      const code = last?.code ? ` (${last.code})` : "";
      const error = new Error(
        `Firebase auth failed${code}. Please enable Anonymous sign-in in Firebase Authentication, then try again.`
      );
      (error as { code?: string }).code = last?.code ?? "auth/missing-user";
      throw error;
    }
    
    console.log("[firebaseGifts] Auth ready:", {
      uid: authUser.uid,
      isAnonymous: authUser.isAnonymous,
    });

    const fb = getFirebaseMaybe();
    if (!fb) {
      const missing = getFirebaseMissingEnv();
      console.error("[firebaseGifts] getFirebaseMaybe returned null", { missing });
      throw new Error(`Firebase disabled (missing env: ${missing.join(", ")})`);
    }
    const { db } = fb;
    console.log("[firebaseGifts] Firebase DB obtained");

    const senderBinding = await syncFirebaseUserBinding({
      walletAddress: params.fromWalletAddress,
      username: params.fromUsername,
    });
    const fromId =
      senderBinding?.walletGiftId || sanitizeWalletId(params.fromWalletAddress);
    const recipientIds = getRecipientIds({
      walletAddress: params.toWalletAddress,
      username: params.toUsername,
    });
    if (recipientIds.length === 0) {
      const error = new Error("Missing recipient wallet address or username");
      (error as { code?: string }).code = "gift/missing-recipient";
      throw error;
    }
    console.log("[firebaseGifts] Recipient ids:", recipientIds);

    const primaryPath = `gifts/${recipientIds[0]}`;
    console.log("[firebaseGifts] Writing to path:", primaryPath);
    console.log("[Firebase] Writing to /gifts: " + primaryPath);

    const giftRef = push(ref(db, primaryPath));
    const giftId = giftRef.key;
    if (!giftId) throw new Error("Failed to allocate giftId");

    const payload: GiftOrbPayloadV1 = {
      v: 1,
      createdAt: new Date().toISOString(),
      giftId,
      giftKind: "blessing-copy",
      viewOnly: true,
      canMeditate: false,
      canUnlockMissions: false,
      to: params.toWalletAddress || params.toUsername || "",
      toUsername: params.toUsername,
      from: params.fromWalletAddress,
      senderGiftId: fromId,
      fromUsername: params.fromUsername,
      fromDisplayName: params.fromDisplayName,
      recipientWalletId: params.toWalletAddress
        ? sanitizeWalletId(params.toWalletAddress)
        : undefined,
      recipientUsernameId: params.toUsername
        ? sanitizeWalletId(params.toUsername)
        : undefined,
      resonanceBlessed: Boolean(params.resonanceBlessed),
      blessing: params.blessing,
      orb: params.orb,
    };

    const auditPayload: GiftAuditPayload = {
      ...payload,
      audit: {
        status: "pending",
        recipientIds,
        createdByUid: authUser.uid,
      },
    };

    const senderHistoryRecord: GiftHistoryRecord = {
      giftId,
      createdAt: payload.createdAt,
      giftKind: payload.giftKind,
      from: payload.from,
      to: payload.to,
      toUsername: payload.toUsername,
      fromUsername: payload.fromUsername,
      fromDisplayName: payload.fromDisplayName,
      senderGiftId: payload.senderGiftId,
      recipientWalletId: payload.recipientWalletId,
      recipientUsernameId: payload.recipientUsernameId,
      resonanceBlessed: payload.resonanceBlessed,
      blessing: payload.blessing,
      orb: payload.orb,
      role: "sender",
      status: "pending",
      viewOnly: true,
    };

    const receiverHistoryRecord: GiftHistoryRecord = {
      giftId,
      createdAt: payload.createdAt,
      giftKind: payload.giftKind,
      from: payload.from,
      to: payload.to,
      toUsername: payload.toUsername,
      fromUsername: payload.fromUsername,
      fromDisplayName: payload.fromDisplayName,
      senderGiftId: payload.senderGiftId,
      recipientWalletId: payload.recipientWalletId,
      recipientUsernameId: payload.recipientUsernameId,
      resonanceBlessed: payload.resonanceBlessed,
      blessing: payload.blessing,
      orb: payload.orb,
      role: "receiver",
      status: "pending",
      viewOnly: true,
    };

    console.log("[firebaseGifts] Calling set() with payload:", JSON.stringify(payload));
    await Promise.all([
      ...recipientIds.map((recipientId) =>
        set(ref(db, `gifts/${recipientId}/${giftId}`), payload)
      ),
      set(ref(db, `giftAudit/${giftId}`), auditPayload),
      set(ref(db, `giftHistory/sent/${fromId}/${giftId}`), senderHistoryRecord),
      ...recipientIds.map((recipientId) =>
        set(ref(db, `giftHistory/received/${recipientId}/${giftId}`), receiverHistoryRecord)
      ),
    ]);
    setFirebaseLastWriteError(null);

    console.log("[firebaseGifts] uploadGiftOrb:success", { giftId, recipientIds });
    console.log("[firebaseGifts] Upload success", { path: primaryPath, giftId });
    console.log("[firebaseGifts] ========== GIFT UPLOAD SUCCESS ==========");
    return { giftId };
  } catch (e: any) {
    const code = e?.code ?? "unknown";
    const message = e?.message;
    console.error("[firebaseGifts] ========== GIFT UPLOAD FAILED ==========");
    console.error("[firebaseGifts] uploadGiftOrb:error", e);
    console.error("[Firebase] Write failed:", { code: e?.code, message: e?.message });
    console.error("[firebaseGifts] Error message:", e?.message);
    console.error("[firebaseGifts] Error code:", e?.code);
    console.error("[firebaseGifts] Error stack:", e?.stack);
    setFirebaseLastWriteError({ code, message });
    const normalizedError = e instanceof Error ? e : new Error(message ?? "Firebase write failed");
    (normalizedError as { code?: string }).code = code;
    if (message && normalizedError.message !== message) {
      normalizedError.message = message;
    }
    throw normalizedError;
  }
}

export async function fetchAndConsumeGifts(params: {
  myWalletAddress?: string | null;
  myUsername?: string | null;
  max?: number;
}): Promise<GiftOrbPayloadV1[]> {
  if (!isFirebaseEnabled()) {
    const missing = getFirebaseMissingEnv();
    console.error("[firebaseGifts] Firebase disabled - returning empty gifts", { missing });
    return [];
  }
  console.log("[firebaseGifts] fetchAndConsumeGifts:start", {
    myWalletAddress: params.myWalletAddress,
    myUsername: params.myUsername,
    max: params.max,
  });

  try {
    console.log("[firebaseGifts] Waiting for Firebase auth (fetch)...");
    const authUser = await waitForFirebaseAuth();
    if (!authUser) {
      if (!isAutomatedWebRuntime()) {
        console.error("[firebaseGifts] Firebase auth failed - no user (fetch)");
      }
      return [];
    }
    console.log("[firebaseGifts] Auth ready (fetch):", {
      uid: authUser.uid,
      isAnonymous: authUser.isAnonymous,
    });

    const fb = getFirebaseMaybe();
    if (!fb) {
      const missing = getFirebaseMissingEnv();
      console.error("[firebaseGifts] getFirebaseMaybe returned null (fetch)", { missing });
      return [];
    }
    await syncFirebaseUserBinding({
      walletAddress: params.myWalletAddress,
      username: params.myUsername,
    });

    const { db } = fb;
    const recipientIds = getRecipientIds({
      walletAddress: params.myWalletAddress,
      username: params.myUsername,
    });
    if (recipientIds.length === 0) {
      console.log("[firebaseGifts] fetchAndConsumeGifts:missing-recipient-id");
      return [];
    }

    const inboxSnapshots = await Promise.all(
      recipientIds.map(async (recipientId) => ({
        recipientId,
        snap: await get(ref(db, `gifts/${recipientId}`)),
      }))
    );

    const deduped = new Map<string, GiftOrbPayloadV1 & { sourceRecipientIds: string[] }>();
    for (const { recipientId, snap } of inboxSnapshots) {
      if (!snap.exists()) continue;
      const val = snap.val() as Record<string, GiftOrbPayloadV1>;
      for (const [giftId, payload] of Object.entries(val)) {
        const normalizedPayload: GiftOrbPayloadV1 = {
          ...payload,
          giftId: payload.giftId || giftId,
          giftKind: payload.giftKind || "blessing-copy",
          viewOnly: true,
          canMeditate: false,
          canUnlockMissions: false,
          resonanceBlessed: Boolean(payload.resonanceBlessed),
        };
        const existing = deduped.get(giftId);
        if (existing) {
          existing.sourceRecipientIds.push(recipientId);
          continue;
        }
        deduped.set(giftId, { ...normalizedPayload, sourceRecipientIds: [recipientId] });
      }
    }

    if (deduped.size === 0) {
      console.log("[firebaseGifts] fetchAndConsumeGifts:empty", { recipientIds });
      return [];
    }

    const list = [...deduped.values()]
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

    const max = params.max ?? 5;
    const selected = list.slice(0, max);

    await Promise.all(
      selected
        .filter((g): g is GiftOrbPayloadV1 & { giftId: string; sourceRecipientIds: string[] } => Boolean(g.giftId))
        .flatMap((gift) => [
          ...gift.sourceRecipientIds.map((recipientId) =>
            remove(ref(db, `gifts/${recipientId}/${gift.giftId}`))
          ),
          update(ref(db, `giftAudit/${gift.giftId}/audit`), {
            status: "consumed",
            consumedAt: new Date().toISOString(),
            consumedByUid: authUser.uid,
            consumedByWallet: params.myWalletAddress || params.myUsername || "",
          }),
          ...recipientIds.map((recipientId) =>
            update(ref(db, `giftHistory/received/${recipientId}/${gift.giftId}`), {
              status: "consumed",
              consumedAt: new Date().toISOString(),
            })
          ),
          update(ref(db, `giftHistory/sent/${gift.senderGiftId || sanitizeWalletId(gift.from || "")}/${gift.giftId}`), {
            status: "consumed",
            consumedAt: new Date().toISOString(),
          }),
        ])
    );

    console.log("[firebaseGifts] fetchAndConsumeGifts:success", {
      recipientIds,
      selected: selected.length,
    });

    return selected.map(({ sourceRecipientIds: _sourceRecipientIds, ...gift }) => gift);
  } catch (e) {
    console.error("[firebaseGifts] fetchAndConsumeGifts:error", e);
    throw e;
  }
}

export async function fetchGiftHistory(params: {
  walletAddress?: string | null;
  username?: string | null;
  role: "sender" | "receiver";
  max?: number;
}): Promise<GiftHistoryEntry[]> {
  if (!isFirebaseEnabled()) {
    const missing = getFirebaseMissingEnv();
    console.error("[firebaseGifts] Firebase disabled - returning empty gift history", { missing });
    return [];
  }

  try {
    const authUser = await waitForFirebaseAuth();
    if (!authUser) {
      if (!isAutomatedWebRuntime()) {
        console.error("[firebaseGifts] Firebase auth failed - no user (history)");
      }
      return [];
    }

    const fb = getFirebaseMaybe();
    if (!fb) {
      const missing = getFirebaseMissingEnv();
      console.error("[firebaseGifts] getFirebaseMaybe returned null (history)", { missing });
      return [];
    }

    await syncFirebaseUserBinding({
      walletAddress: params.walletAddress,
      username: params.username,
    });

    const { db } = fb;
    const branch = params.role === "sender" ? "sent" : "received";
    const recipientIds = getRecipientIds({
      walletAddress: params.walletAddress,
      username: params.username,
    });
    if (recipientIds.length === 0) {
      return [];
    }

    const snapshots = await Promise.all(
      recipientIds.map(async (recipientId) => ({
        recipientId,
        snap: await get(ref(db, `giftHistory/${branch}/${recipientId}`)),
      }))
    );

    const deduped = new Map<string, GiftHistoryEntry>();
    const statusRank = (status: GiftHistoryEntry["status"]) =>
      status === "consumed" ? 2 : 1;
    const mergeHistoryEntry = (existing: GiftHistoryEntry, incoming: GiftHistoryEntry): GiftHistoryEntry => {
      const existingRank = statusRank(existing.status);
      const incomingRank = statusRank(incoming.status);
      const nextStatus =
        incomingRank > existingRank
          ? incoming.status
          : existingRank > incomingRank
            ? existing.status
            : (incoming.createdAt || "") >= (existing.createdAt || "")
              ? incoming.status
              : existing.status;

      return {
        ...existing,
        ...incoming,
        giftId: incoming.giftId || existing.giftId,
        status: nextStatus,
        consumedAt: incoming.consumedAt || existing.consumedAt,
      };
    };
    for (const { snap } of snapshots) {
      if (!snap.exists()) continue;
      const val = snap.val() as Record<string, GiftHistoryEntry>;
      for (const [giftId, payload] of Object.entries(val)) {
        const normalized: GiftHistoryEntry = {
          ...payload,
          giftId: payload.giftId || giftId,
          giftKind: payload.giftKind || "blessing-copy",
          viewOnly: true,
          resonanceBlessed: Boolean(payload.resonanceBlessed),
        };
        const existing = deduped.get(giftId);
        if (existing) {
          deduped.set(giftId, mergeHistoryEntry(existing, normalized));
        } else {
          deduped.set(giftId, normalized);
        }
      }
    }

    const list = [...deduped.values()]
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return list.slice(0, params.max ?? 20);
  } catch (e) {
    console.error("[firebaseGifts] fetchGiftHistory:error", e);
    throw e;
  }
}
