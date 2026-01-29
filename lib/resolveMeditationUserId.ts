import { getFirebaseAuthUser, waitForFirebaseAuth } from "@/constants/firebase";

export type MeditationUserIdSource = "auth" | "wallet" | "none";

export async function resolveMeditationUserId(params: {
  walletAddress?: string | null;
}): Promise<{ userId: string | null; source: MeditationUserIdSource }> {
  const authUser = getFirebaseAuthUser() ?? await waitForFirebaseAuth();
  if (authUser?.uid) {
    return { userId: authUser.uid, source: "auth" };
  }

  const wallet = params.walletAddress?.trim();
  if (wallet) {
    return { userId: wallet, source: "wallet" };
  }

  return { userId: null, source: "none" };
}
