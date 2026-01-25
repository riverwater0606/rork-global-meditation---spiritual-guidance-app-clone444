import { useState, useEffect } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { router } from "expo-router";

interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  isVIP?: boolean;
}

interface VerificationPayload {
  nullifier_hash?: string;
  merkle_root?: string;
  status?: string;
  [key: string]: unknown;
}

export const [UserProvider, useUser] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
  });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verification, setVerification] = useState<VerificationPayload | null>(null);
  const [isVIP, setIsVIP] = useState<boolean>(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem("userProfile");
      const savedWallet = await AsyncStorage.getItem("walletAddress");
      const savedVerified = await AsyncStorage.getItem("isVerified");
      const savedVerification = await AsyncStorage.getItem("verificationPayload");
      const savedVIP = await AsyncStorage.getItem("isVIP");
      
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
      
      if (savedWallet) {
        setWalletAddress(savedWallet);
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

      if (savedVIP) {
        setIsVIP(savedVIP === 'true');
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await AsyncStorage.setItem("userProfile", JSON.stringify(newProfile));
  };

  const connectWallet = async (address: string) => {
    setWalletAddress(address);
    await AsyncStorage.setItem("walletAddress", address);
    return address;
  };

  const disconnectWallet = async () => {
    setWalletAddress(null);
    await AsyncStorage.removeItem("walletAddress");
  };

  const setVerified = async (payload: VerificationPayload) => {
    setIsVerified(true);
    setVerification(payload);
    await AsyncStorage.setItem('isVerified', 'true');
    await AsyncStorage.setItem('verificationPayload', JSON.stringify(payload));
  };

  const logout = async () => {
    console.log('[UserProvider] Logging out - clearing all verification data');
    setIsVerified(false);
    setVerification(null);
    setWalletAddress(null);
    await AsyncStorage.multiRemove([
      'isVerified',
      'verificationPayload',
      'walletAddress',
      'wallet-auth',
      'worldid:result',
      'userProfile',
      'isVIP',
    ]);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const sensitiveKeys = allKeys.filter((key) =>
        /verify|world|wallet|auth|token|session|user/i.test(key),
      );
      if (sensitiveKeys.length > 0) {
        await AsyncStorage.multiRemove(sensitiveKeys);
      }
    } catch (error) {
      console.log('[UserProvider] Failed to clear sensitive AsyncStorage keys', error);
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const sessionKeys = Object.keys(window.sessionStorage ?? {});
        sessionKeys.forEach((key) => {
          if (/verify|world|wallet|auth|token|session|user/i.test(key)) {
            window.sessionStorage?.removeItem(key);
          }
        });
      } catch (error) {
        console.log('[UserProvider] Failed to clear sessionStorage', error);
      }
      try {
        const localKeys = Object.keys(window.localStorage ?? {});
        localKeys.forEach((key) => {
          if (/verify|world|wallet|auth|token|session|user/i.test(key)) {
            window.localStorage?.removeItem(key);
          }
        });
      } catch (error) {
        console.log('[UserProvider] Failed to clear localStorage', error);
      }
    }
    try {
      router.replace('/sign-in');
    } catch (error) {
      console.log('[UserProvider] router.replace failed during logout', error);
    }
    setTimeout(() => {
      try {
        router.replace('/sign-in');
      } catch (error) {
        console.log('[UserProvider] router.replace retry failed during logout', error);
      }
    }, 0);
    console.log('[UserProvider] Logout complete');
  };

  const unlockVIP = async () => {
    setIsVIP(true);
    await AsyncStorage.setItem('isVIP', 'true');
  };

  return {
    profile,
    walletAddress,
    isVerified,
    verification,
    isVIP,
    updateProfile,
    connectWallet,
    disconnectWallet,
    setVerified,
    logout,
    unlockVIP,
  };
});
