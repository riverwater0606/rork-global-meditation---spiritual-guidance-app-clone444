import { useState, useEffect } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    await AsyncStorage.removeItem('isVerified');
    await AsyncStorage.removeItem('verificationPayload');
    await AsyncStorage.removeItem('walletAddress');
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