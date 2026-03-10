import { fetchAndConsumeGifts, uploadGiftOrb } from "@/lib/firebaseGifts";

export const pollGiftOrbs = fetchAndConsumeGifts;
export const uploadGiftOrbToCloud = uploadGiftOrb;
