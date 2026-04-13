import { uploadGiftOrb } from "@/lib/firebaseGifts";

export type GiftUploadAttempt = {
  key: string;
  toWalletAddress?: string;
  toUsername?: string;
};

export async function uploadGiftWithFallback(params: {
  fromWalletAddress: string;
  fromUsername?: string;
  fromDisplayName: string;
  blessing: string;
  resonanceBlessed?: boolean;
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
  attempts: GiftUploadAttempt[];
}) {
  const dedupedAttempts = params.attempts.filter(
    (attempt, index, arr) => arr.findIndex((entry) => entry.key === attempt.key) === index
  );

  let uploadResult: { giftId: string } | null = null;
  let lastUploadError: unknown = null;

  for (const attempt of dedupedAttempts) {
    try {
      uploadResult = await uploadGiftOrb({
        toWalletAddress: attempt.toWalletAddress,
        toUsername: attempt.toUsername,
        fromWalletAddress: params.fromWalletAddress,
        fromUsername: params.fromUsername,
        fromDisplayName: params.fromDisplayName,
        resonanceBlessed: Boolean(params.resonanceBlessed),
        blessing: params.blessing,
        orb: params.orb,
      });
      break;
    } catch (uploadError) {
      lastUploadError = uploadError;
      console.warn("[gift] upload attempt failed", attempt, uploadError);
    }
  }

  if (!uploadResult) {
    throw lastUploadError instanceof Error
      ? lastUploadError
      : new Error("Gift upload failed on all routes");
  }

  return uploadResult;
}
