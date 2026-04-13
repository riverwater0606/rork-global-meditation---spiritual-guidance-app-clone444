import { useState, useEffect, useRef } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IS_DEV_FULL_MOCK, IS_LOCAL_DEV } from "@/constants/env";
import { USER_SESSION_STORAGE_KEYS } from "@/constants/storageKeys";
import { getVipDaysRemaining, resolveVipExpiryDate, VIP_DURATION_DAYS } from "@/constants/vip";
import { syncFirebaseUserBinding } from "@/lib/firebaseIdentity";
import { fetchCloudIdentityState, saveCloudIdentityState } from "@/lib/identityStateCloud";
import { fetchCloudVipEntitlement, saveCloudVipEntitlement } from "@/lib/vipEntitlementCloud";

interface UserProfile {
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  isVIP?: boolean;
}

interface VerificationPayload {
  nullifier_hash?: string;
  merkle_root?: string;
  status?: string;
  [key: string]: unknown;
}

interface VipPendingPayment {
  reference: string;
  verificationToken: string;
  paymentResult: Record<string, unknown>;
}

interface VipEntitlementState {
  isVIP: boolean;
  vipActivatedAt: string | null;
  vipExpiresAt: string | null;
  vipConfirmPending: boolean;
  vipPaymentLock: boolean;
  vipPendingPayment: VipPendingPayment | null;
  vipUpdatedAt?: string | null;
}

const VIP_UPDATED_AT_STORAGE_KEY = "vipUpdatedAt";
const IDENTITY_UPDATED_AT_STORAGE_KEY = "identityUpdatedAt";

interface IdentityStateSnapshot {
  profile: UserProfile;
  isVerified: boolean;
  verification: VerificationPayload | null;
  updatedAt: string | null;
}

const getVipEntitlementStorageKey = (walletAddress: string) =>
  `vipEntitlement:${walletAddress.trim().toLowerCase()}`;

const persistScopedVipEntitlement = async (
  walletAddress: string | null | undefined,
  state: VipEntitlementState
) => {
  const normalized = walletAddress?.trim().toLowerCase();
  if (!normalized) return;

  if (
    state.isVIP ||
    state.vipConfirmPending ||
    state.vipPaymentLock ||
    state.vipPendingPayment
  ) {
    await AsyncStorage.setItem(
      getVipEntitlementStorageKey(normalized),
      JSON.stringify(state)
    );
    return;
  }

  await AsyncStorage.removeItem(getVipEntitlementStorageKey(normalized));
};

export const [UserProvider, useUser] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
  });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verification, setVerification] = useState<VerificationPayload | null>(null);
  const [isVIP, setIsVIP] = useState<boolean>(false);
  const [vipActivatedAt, setVipActivatedAt] = useState<string | null>(null);
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(null);
  const [vipConfirmPending, setVipConfirmPending] = useState<boolean>(false);
  const [vipPaymentLock, setVipPaymentLock] = useState<boolean>(false);
  const [vipPendingPayment, setVipPendingPayment] = useState<VipPendingPayment | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const identityCloudHydratedRef = useRef(false);
  const identityUpdatedAtRef = useRef<string | null>(null);
  const vipCloudHydratedRef = useRef(false);
  const vipServerNowOffsetMsRef = useRef(0);
  const vipEntitlementRef = useRef<VipEntitlementState>({
    isVIP: false,
    vipActivatedAt: null,
    vipExpiresAt: null,
    vipConfirmPending: false,
    vipPaymentLock: false,
    vipPendingPayment: null,
    vipUpdatedAt: null,
  });

  const getVipReferenceNowMs = () => Date.now() + vipServerNowOffsetMsRef.current;
  const applyVipServerNow = (serverNow: string | null | undefined) => {
    if (!serverNow) return;
    const millis = new Date(serverNow).getTime();
    if (Number.isFinite(millis)) {
      vipServerNowOffsetMsRef.current = millis - Date.now();
    }
  };
  const isVipEntitlementActive = (state: VipEntitlementState) =>
    Boolean(
      state.isVIP &&
      state.vipExpiresAt &&
      new Date(state.vipExpiresAt).getTime() > getVipReferenceNowMs()
    );
  const getIdentitySnapshot = (): IdentityStateSnapshot => ({
    profile,
    isVerified,
    verification,
    updatedAt: identityUpdatedAtRef.current,
  });

  const applyVipEntitlementState = (next: VipEntitlementState) => {
    vipEntitlementRef.current = next;
    setIsVIP(next.isVIP);
    setVipActivatedAt(next.vipActivatedAt);
    setVipExpiresAt(next.vipExpiresAt);
    setVipConfirmPending(next.vipConfirmPending);
    setVipPaymentLock(next.vipPaymentLock);
    setVipPendingPayment(next.vipPendingPayment);
  };

  const persistVipEntitlementState = async (next: VipEntitlementState) => {
    const nextWithTimestamp: VipEntitlementState = {
      ...next,
      vipUpdatedAt: next.vipUpdatedAt || new Date().toISOString(),
    };
    applyVipEntitlementState(nextWithTimestamp);

    if (nextWithTimestamp.isVIP && nextWithTimestamp.vipActivatedAt && nextWithTimestamp.vipExpiresAt) {
      await AsyncStorage.multiSet([
        ["isVIP", "true"],
        ["vipActivatedAt", nextWithTimestamp.vipActivatedAt],
        ["vipExpiresAt", nextWithTimestamp.vipExpiresAt],
      ]);
    } else {
      await AsyncStorage.multiRemove(["isVIP", "vipActivatedAt", "vipExpiresAt"]);
    }

    await AsyncStorage.setItem("vipConfirmPending", nextWithTimestamp.vipConfirmPending ? "true" : "false");
    await AsyncStorage.setItem("vipPaymentLock", nextWithTimestamp.vipPaymentLock ? "true" : "false");
    await AsyncStorage.setItem(VIP_UPDATED_AT_STORAGE_KEY, nextWithTimestamp.vipUpdatedAt || "");

    if (nextWithTimestamp.vipPendingPayment) {
      await AsyncStorage.setItem("vipPendingPayment", JSON.stringify(nextWithTimestamp.vipPendingPayment));
    } else {
      await AsyncStorage.removeItem("vipPendingPayment");
    }

    await persistScopedVipEntitlement(walletAddress, nextWithTimestamp);

    const normalizedWallet = walletAddress?.trim();
    if (IS_LOCAL_DEV) {
      return;
    }
    if (normalizedWallet) {
      try {
        const cloudResponse = await saveCloudVipEntitlement({
          walletAddress: normalizedWallet,
          state: nextWithTimestamp,
          updatedAt: nextWithTimestamp.vipUpdatedAt || undefined,
        });
        applyVipServerNow(cloudResponse?.serverNow);
      } catch (error) {
        console.error("[UserProvider] Failed to sync VIP entitlement to cloud", error);
      }
    }
  };

  const persistIdentityState = async (next: {
    profile?: UserProfile;
    isVerified?: boolean;
    verification?: VerificationPayload | null;
    updatedAt?: string | null;
  }) => {
    const nextProfile = next.profile ?? profile;
    const nextIsVerified = next.isVerified ?? isVerified;
    const nextVerification = next.verification ?? verification;
    const updatedAt = next.updatedAt || new Date().toISOString();

    identityUpdatedAtRef.current = updatedAt;
    setProfile(nextProfile);
    setIsVerified(nextIsVerified);
    setVerification(nextVerification);

    await AsyncStorage.setItem("userProfile", JSON.stringify(nextProfile));
    await AsyncStorage.setItem("isVerified", nextIsVerified ? "true" : "false");
    await AsyncStorage.setItem(IDENTITY_UPDATED_AT_STORAGE_KEY, updatedAt);
    if (nextVerification) {
      await AsyncStorage.setItem("verificationPayload", JSON.stringify(nextVerification));
    } else {
      await AsyncStorage.removeItem("verificationPayload");
    }

    const normalizedWallet = walletAddress?.trim();
    if (normalizedWallet) {
      try {
        await saveCloudIdentityState({
          walletAddress: normalizedWallet,
          state: {
            profile: nextProfile,
            isVerified: nextIsVerified,
            verification: nextVerification,
            updatedAt,
          },
          updatedAt,
        });
      } catch (error) {
        console.error("[UserProvider] Failed to sync identity state to cloud", error);
      }
    }
  };

  const hydrateVipEntitlementForWallet = async (address: string | null) => {
    const normalized = address?.trim().toLowerCase();
    if (!normalized) return;

    const scoped = await AsyncStorage.getItem(getVipEntitlementStorageKey(normalized));
    if (!scoped) {
      applyVipEntitlementState({
        isVIP: false,
        vipActivatedAt: null,
        vipExpiresAt: null,
        vipConfirmPending: false,
        vipPaymentLock: false,
        vipPendingPayment: null,
      });
      await AsyncStorage.multiRemove(["isVIP", "vipActivatedAt", "vipExpiresAt", "vipConfirmPending", "vipPaymentLock", "vipPendingPayment"]);
      return;
    }

    try {
      const parsed = JSON.parse(scoped) as VipEntitlementState;
      const stillActive = isVipEntitlementActive(parsed);
      const hasWorkflowState =
        parsed.vipConfirmPending ||
        parsed.vipPaymentLock ||
        Boolean(parsed.vipPendingPayment);

      const nextState: VipEntitlementState = stillActive
        ? {
            isVIP: true,
            vipActivatedAt: parsed.vipActivatedAt,
            vipExpiresAt: parsed.vipExpiresAt,
            vipConfirmPending: false,
            vipPaymentLock: false,
            vipPendingPayment: null,
            vipUpdatedAt: parsed.vipUpdatedAt ?? null,
          }
        : hasWorkflowState
          ? {
              isVIP: false,
              vipActivatedAt: null,
              vipExpiresAt: null,
              vipConfirmPending: parsed.vipConfirmPending,
              vipPaymentLock: parsed.vipPaymentLock,
              vipPendingPayment: parsed.vipPendingPayment,
              vipUpdatedAt: parsed.vipUpdatedAt ?? null,
            }
          : {
              isVIP: false,
              vipActivatedAt: null,
              vipExpiresAt: null,
              vipConfirmPending: false,
              vipPaymentLock: false,
              vipPendingPayment: null,
              vipUpdatedAt: parsed.vipUpdatedAt ?? null,
            };

      await persistVipEntitlementState(nextState);
    } catch (error) {
      console.error("[UserProvider] Failed to hydrate wallet-scoped VIP state", error);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!isHydrated || !walletAddress || identityCloudHydratedRef.current || IS_LOCAL_DEV) return;

    let cancelled = false;
    const hydrateIdentityFromCloud = async () => {
      try {
        const cloudResponse = await fetchCloudIdentityState<IdentityStateSnapshot>(walletAddress);
        if (cancelled || !cloudResponse.state) {
          identityCloudHydratedRef.current = true;
          return;
        }

        const localUpdatedAt = identityUpdatedAtRef.current ? new Date(identityUpdatedAtRef.current).getTime() : 0;
        const cloudUpdatedAt = cloudResponse.updatedAt ? new Date(cloudResponse.updatedAt).getTime() : 0;
        if (localUpdatedAt > cloudUpdatedAt) {
          identityCloudHydratedRef.current = true;
          return;
        }

        const parsed = cloudResponse.state;
        identityUpdatedAtRef.current = parsed.updatedAt ?? cloudResponse.updatedAt ?? null;
        setProfile(parsed.profile ?? { name: "", email: "" });
        setIsVerified(Boolean(parsed.isVerified));
        setVerification(parsed.verification ?? null);
        await AsyncStorage.setItem("userProfile", JSON.stringify(parsed.profile ?? { name: "", email: "" }));
        await AsyncStorage.setItem("isVerified", parsed.isVerified ? "true" : "false");
        await AsyncStorage.setItem(IDENTITY_UPDATED_AT_STORAGE_KEY, identityUpdatedAtRef.current || "");
        if (parsed.verification) {
          await AsyncStorage.setItem("verificationPayload", JSON.stringify(parsed.verification));
        } else {
          await AsyncStorage.removeItem("verificationPayload");
        }
      } catch (error) {
        console.error("[UserProvider] Failed to hydrate identity state from cloud", error);
      } finally {
        identityCloudHydratedRef.current = true;
      }
    };

    void hydrateIdentityFromCloud();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, walletAddress]);

  useEffect(() => {
    if (!isHydrated || !walletAddress) return;

    const snapshot: VipEntitlementState = {
      isVIP,
      vipActivatedAt,
      vipExpiresAt,
      vipConfirmPending,
      vipPaymentLock,
      vipPendingPayment,
      vipUpdatedAt: vipEntitlementRef.current.vipUpdatedAt,
    };

    void persistScopedVipEntitlement(walletAddress, snapshot).catch((error) => {
      console.error("[UserProvider] Failed to backfill wallet-scoped VIP state", error);
    });
  }, [
    isHydrated,
    walletAddress,
    isVIP,
    vipActivatedAt,
    vipExpiresAt,
    vipConfirmPending,
    vipPaymentLock,
    vipPendingPayment,
  ]);

  useEffect(() => {
    if (!isHydrated || IS_DEV_FULL_MOCK) return;
    if (!walletAddress && !profile.username) return;

    void syncFirebaseUserBinding({
      walletAddress,
      username: profile.username,
    }).catch((error) => {
      console.error("[UserProvider] Failed to sync Firebase binding", error);
    });
  }, [isHydrated, walletAddress, profile.username]);

  useEffect(() => {
    if (!isHydrated || !walletAddress || vipCloudHydratedRef.current || IS_LOCAL_DEV) return;

    let cancelled = false;
    const hydrateVipFromCloud = async () => {
      try {
        const cloudResponse = await fetchCloudVipEntitlement<VipEntitlementState>(walletAddress);
        applyVipServerNow(cloudResponse.serverNow);
        if (cancelled || !cloudResponse.state) {
          vipCloudHydratedRef.current = true;
          return;
        }

        const localUpdatedAt = vipEntitlementRef.current.vipUpdatedAt
          ? new Date(vipEntitlementRef.current.vipUpdatedAt).getTime()
          : 0;
        const cloudUpdatedAt = cloudResponse.updatedAt ? new Date(cloudResponse.updatedAt).getTime() : 0;
        if (localUpdatedAt > cloudUpdatedAt) {
          vipCloudHydratedRef.current = true;
          return;
        }

        const parsed = cloudResponse.state;
        const stillActive = isVipEntitlementActive(parsed);
        const hasWorkflowState =
          parsed.vipConfirmPending ||
          parsed.vipPaymentLock ||
          Boolean(parsed.vipPendingPayment);

        const nextState: VipEntitlementState = stillActive
          ? {
              isVIP: true,
              vipActivatedAt: parsed.vipActivatedAt,
              vipExpiresAt: parsed.vipExpiresAt,
              vipConfirmPending: false,
              vipPaymentLock: false,
              vipPendingPayment: null,
              vipUpdatedAt: parsed.vipUpdatedAt ?? cloudResponse.updatedAt ?? null,
            }
          : hasWorkflowState
            ? {
                isVIP: false,
                vipActivatedAt: null,
                vipExpiresAt: null,
                vipConfirmPending: parsed.vipConfirmPending,
                vipPaymentLock: parsed.vipPaymentLock,
                vipPendingPayment: parsed.vipPendingPayment,
                vipUpdatedAt: parsed.vipUpdatedAt ?? cloudResponse.updatedAt ?? null,
              }
            : {
                isVIP: false,
                vipActivatedAt: null,
                vipExpiresAt: null,
                vipConfirmPending: false,
                vipPaymentLock: false,
                vipPendingPayment: null,
                vipUpdatedAt: parsed.vipUpdatedAt ?? cloudResponse.updatedAt ?? null,
              };

        applyVipEntitlementState(nextState);
        await AsyncStorage.setItem(VIP_UPDATED_AT_STORAGE_KEY, nextState.vipUpdatedAt || "");
        await persistScopedVipEntitlement(walletAddress, nextState);
      } catch (error) {
        console.error("[UserProvider] Failed to hydrate VIP entitlement from cloud", error);
      } finally {
        vipCloudHydratedRef.current = true;
      }
    };

    void hydrateVipFromCloud();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, walletAddress]);

  const loadProfile = async () => {
    try {
      if (IS_DEV_FULL_MOCK) {
        const devProfile = {
          name: "Dev Mock User",
          email: "dev-full-mock@local.test",
          isVIP: true,
        };
        const devVerification = {
          status: "success",
          source: "dev-full-mock",
        };
        setProfile(devProfile);
        setWalletAddress("0xDevMockWallet_999999");
        setAuthToken("dev-full-mock-token");
        setIsVerified(true);
        setVerification(devVerification);
        const activatedAt = new Date().toISOString();
        applyVipEntitlementState({
          isVIP: true,
          vipActivatedAt: activatedAt,
          vipExpiresAt: resolveVipExpiryDate(activatedAt, 3650),
          vipConfirmPending: false,
          vipPaymentLock: false,
          vipPendingPayment: null,
        });
        await AsyncStorage.multiSet([
          ["userProfile", JSON.stringify(devProfile)],
          ["walletAddress", "0xDevMockWallet_999999"],
          ["authToken", "dev-full-mock-token"],
          ["isVerified", "true"],
          ["verificationPayload", JSON.stringify(devVerification)],
          ["isVIP", "true"],
          ["vipActivatedAt", activatedAt],
          ["vipExpiresAt", resolveVipExpiryDate(activatedAt, 3650)],
          ["vipConfirmPending", "false"],
          ["vipPaymentLock", "false"],
        ]);
        await AsyncStorage.removeItem("vipPendingPayment");
        console.log("DEV FULL MOCK: wallet + awakened + VIP simulated");
        return;
      }

      const savedProfile = await AsyncStorage.getItem("userProfile");
      const savedWallet = await AsyncStorage.getItem("walletAddress");
      const savedAuthToken = await AsyncStorage.getItem("authToken");
      const savedVerified = await AsyncStorage.getItem("isVerified");
      const savedVerification = await AsyncStorage.getItem("verificationPayload");
      const savedVIP = await AsyncStorage.getItem("isVIP");
      const savedVipActivatedAt = await AsyncStorage.getItem("vipActivatedAt");
      const savedVipExpiresAt = await AsyncStorage.getItem("vipExpiresAt");
        const savedVipConfirmPending = await AsyncStorage.getItem("vipConfirmPending");
        const savedVipPaymentLock = await AsyncStorage.getItem("vipPaymentLock");
        const savedVipPendingPayment = await AsyncStorage.getItem("vipPendingPayment");
        const savedVipUpdatedAt = await AsyncStorage.getItem(VIP_UPDATED_AT_STORAGE_KEY);
        const savedIdentityUpdatedAt = await AsyncStorage.getItem(IDENTITY_UPDATED_AT_STORAGE_KEY);
      
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
      identityUpdatedAtRef.current = savedIdentityUpdatedAt;
      
      if (savedWallet) {
        setWalletAddress(savedWallet);
      }

      if (savedAuthToken) {
        setAuthToken(savedAuthToken);
      }

      if (savedVerified) {
        setIsVerified(savedVerified === 'true');
      }

      if (savedVerification) {
        try {
          setVerification(JSON.parse(savedVerification));
        } catch {
          console.log('[UserProvider] Failed to parse verification payload');
        }
      }

      const rawVip = savedVIP === "true";
      const inferredActivatedAt = savedVipActivatedAt || new Date().toISOString();
      const inferredVipExpiresAt =
        savedVipExpiresAt ||
        (rawVip ? resolveVipExpiryDate(inferredActivatedAt, VIP_DURATION_DAYS) : null);
      const savedVipConfirmPendingBool = savedVipConfirmPending === "true";
      const savedVipPaymentLockBool = savedVipPaymentLock === "true";
      let parsedVipPendingPayment: VipPendingPayment | null = null;
      if (savedVipPendingPayment) {
        try {
          parsedVipPendingPayment = JSON.parse(savedVipPendingPayment);
        } catch {
          console.log("[UserProvider] Failed to parse vip pending payment");
        }
      }

      const hasVipWorkflowState =
        savedVipConfirmPendingBool ||
        savedVipPaymentLockBool ||
        Boolean(parsedVipPendingPayment);

      if (rawVip && inferredVipExpiresAt && new Date(inferredVipExpiresAt).getTime() > Date.now()) {
        applyVipEntitlementState({
          isVIP: true,
          vipActivatedAt: inferredActivatedAt,
          vipExpiresAt: inferredVipExpiresAt,
          vipConfirmPending: false,
          vipPaymentLock: false,
          vipPendingPayment: null,
          vipUpdatedAt: savedVipUpdatedAt,
        });
        if (!savedVipExpiresAt) {
          await AsyncStorage.setItem("vipExpiresAt", inferredVipExpiresAt);
        }
        if (savedVipPendingPayment) {
          await AsyncStorage.removeItem("vipPendingPayment");
        }
      } else {
        applyVipEntitlementState({
          isVIP: false,
          vipActivatedAt: null,
          vipExpiresAt: null,
          vipConfirmPending: hasVipWorkflowState ? savedVipConfirmPendingBool : false,
          vipPaymentLock: hasVipWorkflowState ? savedVipPaymentLockBool : false,
          vipPendingPayment: hasVipWorkflowState ? parsedVipPendingPayment : null,
          vipUpdatedAt: savedVipUpdatedAt,
        });
        await AsyncStorage.multiRemove(["isVIP", "vipActivatedAt", "vipExpiresAt"]);
        if (!hasVipWorkflowState) {
          await AsyncStorage.multiRemove(["vipConfirmPending", "vipPaymentLock", "vipPendingPayment"]);
        }
      }

      if (savedVipConfirmPending) {
        setVipConfirmPending(savedVipConfirmPendingBool);
      }

      if (savedVipPaymentLock) {
        setVipPaymentLock(savedVipPaymentLockBool);
      }

      if (parsedVipPendingPayment) {
        setVipPendingPayment(parsedVipPendingPayment);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsHydrated(true);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    await persistIdentityState({
      profile: newProfile,
    });
  };

  const connectWallet = async (address: string) => {
    setWalletAddress(address);
    await AsyncStorage.setItem("walletAddress", address);
    await hydrateVipEntitlementForWallet(address);
    return address;
  };

  const disconnectWallet = async () => {
    setWalletAddress(null);
    await AsyncStorage.removeItem("walletAddress");
  };

  const persistAuthToken = async (token: string | null) => {
    setAuthToken(token);
    if (token) {
      await AsyncStorage.setItem("authToken", token);
      return;
    }
    await AsyncStorage.removeItem("authToken");
  };

  const setVerified = async (payload: VerificationPayload) => {
    await persistIdentityState({
      isVerified: true,
      verification: payload,
    });
  };

  const logout = async () => {
    console.log('[UserProvider] Logging out - clearing all verification data');
    setProfile({
      name: "",
      email: "",
    });
    setIsVerified(false);
    setVerification(null);
    setWalletAddress(null);
    setAuthToken(null);
    setIsVIP(false);
    setVipActivatedAt(null);
    setVipExpiresAt(null);
    setVipConfirmPending(false);
    setVipPaymentLock(false);
    setVipPendingPayment(null);
    identityUpdatedAtRef.current = null;
    await AsyncStorage.multiRemove([...USER_SESSION_STORAGE_KEYS]);
    await AsyncStorage.removeItem(VIP_UPDATED_AT_STORAGE_KEY);
    await AsyncStorage.removeItem(IDENTITY_UPDATED_AT_STORAGE_KEY);
    console.log('[UserProvider] Logout complete');
  };

  const unlockVIP = async (durationDays = VIP_DURATION_DAYS) => {
    const activatedAt = new Date().toISOString();
    const expiresAt = resolveVipExpiryDate(activatedAt, durationDays);
    await persistVipEntitlementState({
      isVIP: true,
      vipActivatedAt: activatedAt,
      vipExpiresAt: expiresAt,
      vipConfirmPending: false,
      vipPaymentLock: false,
      vipPendingPayment: null,
    });
  };

  const resetVIP = async () => {
    await persistVipEntitlementState({
      isVIP: false,
      vipActivatedAt: null,
      vipExpiresAt: null,
      vipConfirmPending: false,
      vipPaymentLock: false,
      vipPendingPayment: null,
    });
  };

  const markVIPConfirmPending = async (
    pending: boolean,
    pendingPayment?: VipPendingPayment | null
  ) => {
    const current = vipEntitlementRef.current;
    await persistVipEntitlementState({
      isVIP: current.isVIP,
      vipActivatedAt: current.vipActivatedAt,
      vipExpiresAt: current.vipExpiresAt,
      vipConfirmPending: pending,
      vipPaymentLock: pending,
      vipPendingPayment: pending ? pendingPayment ?? null : null,
    });
  };

  const setVIPPaymentLockState = async (locked: boolean) => {
    const current = vipEntitlementRef.current;
    await persistVipEntitlementState({
      isVIP: current.isVIP,
      vipActivatedAt: current.vipActivatedAt,
      vipExpiresAt: current.vipExpiresAt,
      vipConfirmPending: current.vipConfirmPending,
      vipPaymentLock: locked,
      vipPendingPayment: current.vipPendingPayment,
    });
  };

  const vipNowMs = getVipReferenceNowMs();
  const hasActiveVIP = IS_DEV_FULL_MOCK || (isVIP && getVipDaysRemaining(vipExpiresAt, vipNowMs) > 0);
  const vipDaysRemaining = hasActiveVIP ? getVipDaysRemaining(vipExpiresAt, vipNowMs) : 0;

  return {
    profile,
    walletAddress,
    authToken,
    isVerified,
    verification,
    isVIP,
    vipActivatedAt,
    vipExpiresAt,
    hasActiveVIP,
    vipDaysRemaining,
    vipConfirmPending,
    vipPaymentLock,
    vipPendingPayment,
    isHydrated,
    updateProfile,
    connectWallet,
    disconnectWallet,
    persistAuthToken,
    setVerified,
    logout,
    unlockVIP,
    resetVIP,
    markVIPConfirmPending,
    setVIPPaymentLockState,
  };
});
