import React, { useState, useEffect } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem("userProfile");
      const savedWallet = await AsyncStorage.getItem("walletAddress");
      const savedVerified = await AsyncStorage.getItem("isVerified");
      const savedVerification = await AsyncStorage.getItem("verificationPayload");
      
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
        } catch (e) {
          console.log('[UserProvider] Failed to parse verification payload');
        }
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

  const connectWallet = async () => {
    const mockAddress = "0x" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setWalletAddress(mockAddress);
    await AsyncStorage.setItem("walletAddress", mockAddress);
    return mockAddress;
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

  return {
    profile,
    walletAddress,
    isVerified,
    verification,
    updateProfile,
    connectWallet,
    disconnectWallet,
    setVerified,
    logout,
  };
});