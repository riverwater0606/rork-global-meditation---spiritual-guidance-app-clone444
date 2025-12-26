import { Alert } from "react-native";
import { child, get, push, ref, remove, set } from "firebase/database";
import { getFirebase } from "@/constants/firebase";

export type GiftOrbPayloadV1 = {
  v: 1;
  createdAt: string;
  giftId?: string;
  to: string;
  from: string;
  fromDisplayName?: string;
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

export function sanitizeWalletId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "unknown";
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function uploadGiftOrb(params: {
  toWalletAddress: string;
  fromWalletAddress: string;
  fromDisplayName?: string;
  blessing?: string;
  orb: GiftOrbPayloadV1["orb"];
}): Promise<{ giftId: string }> {
  console.log("[firebaseGifts] uploadGiftOrb:start", {
    toWalletAddress: params.toWalletAddress,
    fromWalletAddress: params.fromWalletAddress,
    orbId: params.orb?.id,
  });

  try {
    const { db } = getFirebase();
    const toId = sanitizeWalletId(params.toWalletAddress);

    const giftRef = push(ref(db, `gifts/${toId}`));
    const giftId = giftRef.key;
    if (!giftId) throw new Error("Failed to allocate giftId");

    const payload: GiftOrbPayloadV1 = {
      v: 1,
      createdAt: new Date().toISOString(),
      giftId,
      to: params.toWalletAddress,
      from: params.fromWalletAddress,
      fromDisplayName: params.fromDisplayName,
      blessing: params.blessing,
      orb: params.orb,
    };

    await set(giftRef, payload);

    console.log("[firebaseGifts] uploadGiftOrb:success", { giftId, toId });
    return { giftId };
  } catch (e) {
    console.error("[firebaseGifts] uploadGiftOrb:error", e);
    Alert.alert("傳送失敗，請重試");
    throw e;
  }
}

export async function fetchAndConsumeGifts(params: {
  myWalletAddress: string;
  max?: number;
}): Promise<GiftOrbPayloadV1[]> {
  console.log("[firebaseGifts] fetchAndConsumeGifts:start", {
    myWalletAddress: params.myWalletAddress,
    max: params.max,
  });

  try {
    const { db } = getFirebase();
    const myId = sanitizeWalletId(params.myWalletAddress);
    const giftsRoot = ref(db, `gifts/${myId}`);

    const snap = await get(giftsRoot);
    if (!snap.exists()) {
      console.log("[firebaseGifts] fetchAndConsumeGifts:empty", { myId });
      return [];
    }

    const val = snap.val() as Record<string, GiftOrbPayloadV1>;
    const list = Object.entries(val)
      .map(([giftId, payload]) => ({ ...payload, giftId }))
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

    const max = params.max ?? 5;
    const selected = list.slice(0, max);

    await Promise.all(
      selected
        .map((g) => g.giftId)
        .filter((id): id is string => Boolean(id))
        .map((giftId) => remove(child(giftsRoot, giftId)))
    );

    console.log("[firebaseGifts] fetchAndConsumeGifts:success", {
      myId,
      selected: selected.length,
    });

    return selected;
  } catch (e) {
    console.error("[firebaseGifts] fetchAndConsumeGifts:error", e);
    Alert.alert("傳送失敗，請重試");
    throw e;
  }
}
