import { useCallback, useRef, useState } from "react";
import { MiniKit } from "@/constants/minikit";
import type { Language } from "@/providers/SettingsProvider";

export function extractContactsFromPayload(payload: any) {
  const contacts =
    payload?.contacts ||
    payload?.finalPayload?.contacts ||
    payload?.data?.contacts ||
    payload?.response?.contacts ||
    payload?.result?.contacts ||
    payload?.data?.result?.contacts ||
    payload?.response?.result?.contacts ||
    payload?.payload?.result?.contacts ||
    payload?.data?.payload?.result?.contacts;
  if (Array.isArray(contacts)) return contacts;
  if (payload?.contact) return [payload.contact];
  if (payload?.finalPayload?.contact) return [payload.finalPayload.contact];
  return [];
}

export function extractContactWalletAddress(contact: any): string {
  if (!contact) return "";
  const directAddress = contact.walletAddress || contact.wallet_address || contact.address;
  if (directAddress) return directAddress;

  if (Array.isArray(contact.wallets)) {
    const walletEntry = contact.wallets.find(
      (entry: any) => entry?.address || entry?.walletAddress || entry?.wallet_address
    );
    const walletEntryAddress =
      walletEntry?.address || walletEntry?.walletAddress || walletEntry?.wallet_address;
    if (walletEntryAddress) return walletEntryAddress;
  }

  if (contact?.wallet && typeof contact.wallet === "object") {
    const walletAddress =
      contact.wallet.address || contact.wallet.walletAddress || contact.wallet.wallet_address;
    if (walletAddress) return walletAddress;
  }

  if (typeof contact.wallet === "string") return contact.wallet;
  return contact?.account?.address || "";
}

export function extractContactUsername(contact: any): string {
  if (!contact) return "";
  return (
    contact?.username ||
    contact?.handle ||
    contact?.name ||
    ""
  )
    .toString()
    .trim()
    .replace(/^@/, "");
}

export function looksLikeWalletAddress(value: string) {
  return /^0x[a-fA-F0-9]{8,}$/.test(value.trim());
}

export async function resolveContactWalletAddress(contact: any, miniKitInstance?: any): Promise<string> {
  const directAddress = extractContactWalletAddress(contact);
  if (directAddress) return directAddress;

  const username = contact?.username;
  const getUserByUsernameFn =
    miniKitInstance?.getUserByUsername ||
    MiniKit?.getUserByUsername;

  if (!username || typeof getUserByUsernameFn !== "function") {
    return "";
  }

  try {
    const user = await getUserByUsernameFn(username);
    return user?.walletAddress || "";
  } catch (error) {
    console.warn("[gift] failed to resolve wallet address from username:", error);
    return "";
  }
}

export function sanitizeResolvedRecipientAddress(
  candidateAddress: string,
  recipientUsername: string,
  senderWalletAddress?: string | null,
  senderUsername?: string | null
) {
  const trimmed = candidateAddress?.trim() || "";
  if (!trimmed) return "";

  if (
    senderWalletAddress &&
    trimmed.toLowerCase() === senderWalletAddress.trim().toLowerCase() &&
    recipientUsername &&
    recipientUsername !== senderUsername?.trim().replace(/^@/, "")
  ) {
    console.warn("[gift] Ignoring self wallet returned for different recipient username", {
      recipientUsername,
      senderUsername,
      senderWalletAddress,
    });
    return "";
  }

  return trimmed;
}

export function formatContactName(contact: any, fallbackWallet?: string, language: Language = "en") {
  const display =
    contact?.name ||
    contact?.displayName ||
    contact?.username ||
    contact?.handle ||
    "";
  if (display) return display;
  if (fallbackWallet) return `User ${fallbackWallet.slice(0, 4)}`;
  if (language === "zh") return "好友";
  if (language === "es") return "Amigo";
  return "Friend";
}

export function isSelfGiftTarget(params: {
  recipientUsername?: string | null;
  recipientWalletAddress?: string | null;
  senderUsername?: string | null;
  senderWalletAddress?: string | null;
}) {
  const recipientUsername = params.recipientUsername?.trim().replace(/^@/, "").toLowerCase() || "";
  const senderUsername = params.senderUsername?.trim().replace(/^@/, "").toLowerCase() || "";
  const recipientWalletAddress = params.recipientWalletAddress?.trim().toLowerCase() || "";
  const senderWalletAddress = params.senderWalletAddress?.trim().toLowerCase() || "";

  return Boolean(
    (recipientUsername && senderUsername && recipientUsername === senderUsername) ||
      (recipientWalletAddress && senderWalletAddress && recipientWalletAddress === senderWalletAddress)
  );
}

export function getSelfGiftErrorMessage(language: Language) {
  if (language === "zh") {
    return "暫不支援把祝福傳送給自己。請改用另一個 @username 或朋友帳號測試。";
  }
  if (language === "es") {
    return "Por ahora no puedes enviarte bendiciones a ti mismo. Usa otro @username o la cuenta de un amigo para probar.";
  }
  return "Sending blessings to yourself is not supported right now. Please use another @username or a friend's account to test.";
}

export function useGardenGifting(params: {
  language: Language;
  defaultBlessingMessage: string;
  blessingBoostCharges: number;
  onTimeout: (pendingRequestId: string) => Promise<void> | void;
}) {
  const { language, defaultBlessingMessage, blessingBoostCharges, onTimeout } = params;

  const [giftMessage, setGiftMessage] = useState("");
  const [manualGiftRecipient, setManualGiftRecipient] = useState("");
  const [isGiftingUI, setIsGiftingUI] = useState(false);
  const [giftingError, setGiftingError] = useState<string | null>(null);
  const [giftDebugMessage, setGiftDebugMessage] = useState<string | null>(null);
  const [giftDeliveryState, setGiftDeliveryState] = useState<null | {
    status: "sending" | "delivered" | "failed";
    friendName: string;
  }>(null);

  const isGiftingRef = useRef(false);
  const hasAttemptedGiftRef = useRef(false);
  const giftUploadAttemptRef = useRef(false);
  const giftSuccessHandledRef = useRef(false);
  const pendingShareContactsRef = useRef(false);
  const activeGiftRequestIdRef = useRef<string | null>(null);
  const shareContactsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const giftDeliveryClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildGiftBlessingText = useCallback(
    (baseMessage?: string) => {
      const trimmed = (baseMessage || giftMessage || defaultBlessingMessage).trim();
      if (blessingBoostCharges <= 0) {
        return trimmed;
      }
      const amplifiedSuffix =
        language === "zh"
          ? "⟡ Resonance 加持"
          : "⟡ Resonance-blessed";
      return trimmed ? `${trimmed}\n\n${amplifiedSuffix}` : amplifiedSuffix;
    },
    [blessingBoostCharges, defaultBlessingMessage, giftMessage, language]
  );

  const clearShareContactsTimeout = useCallback(() => {
    if (shareContactsTimeoutRef.current) {
      clearTimeout(shareContactsTimeoutRef.current);
      shareContactsTimeoutRef.current = null;
    }
  }, []);

  const scheduleShareContactsTimeout = useCallback((timeoutMs: number) => {
    clearShareContactsTimeout();
    shareContactsTimeoutRef.current = setTimeout(() => {
      if (!pendingShareContactsRef.current) return;
      const pendingRequestId =
        activeGiftRequestIdRef.current ?? `failed-timeout-${Date.now()}`;
      void Promise.resolve(onTimeout(pendingRequestId));
    }, timeoutMs);
  }, [clearShareContactsTimeout, onTimeout]);

  const updateGiftDeliveryState = useCallback((
    next: null | {
      status: "sending" | "delivered" | "failed";
      friendName: string;
    }
  ) => {
    if (giftDeliveryClearRef.current) {
      clearTimeout(giftDeliveryClearRef.current);
      giftDeliveryClearRef.current = null;
    }
    setGiftDeliveryState(next);
    if (next?.status === "delivered") {
      giftDeliveryClearRef.current = setTimeout(() => {
        setGiftDeliveryState(null);
      }, 6000);
    }
  }, []);

  const resetGiftUiState = useCallback(() => {
    setGiftMessage("");
    setManualGiftRecipient("");
    setGiftingError(null);
    setIsGiftingUI(false);
    isGiftingRef.current = false;
    hasAttemptedGiftRef.current = false;
    giftSuccessHandledRef.current = false;
    giftUploadAttemptRef.current = false;
    pendingShareContactsRef.current = false;
    activeGiftRequestIdRef.current = null;
  }, []);

  return {
    giftMessage,
    setGiftMessage,
    manualGiftRecipient,
    setManualGiftRecipient,
    isGiftingUI,
    setIsGiftingUI,
    giftingError,
    setGiftingError,
    giftDebugMessage,
    setGiftDebugMessage,
    giftDeliveryState,
    buildGiftBlessingText,
    clearShareContactsTimeout,
    scheduleShareContactsTimeout,
    updateGiftDeliveryState,
    resetGiftUiState,
    isGiftingRef,
    hasAttemptedGiftRef,
    giftUploadAttemptRef,
    giftSuccessHandledRef,
    pendingShareContactsRef,
    activeGiftRequestIdRef,
  };
}
