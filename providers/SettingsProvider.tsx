import { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Appearance, ColorSchemeName, Linking } from "react-native";
import * as Notifications from "expo-notifications";
import { APP_STORAGE_KEYS } from "@/constants/storageKeys";
import { API_BASE_URL } from "@/constants/world";
import { fetchCloudCustomMeditations } from "@/lib/customMeditationCloud";
import { fetchCloudJourneyState } from "@/lib/journeyStateCloud";
import { fetchCloudVipEntitlement } from "@/lib/vipEntitlementCloud";
import { fetchCloudIdentityState } from "@/lib/identityStateCloud";

export type Theme = "light" | "dark" | "system";
export type Language = "en" | "zh" | "es";

interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  card: string;
  gradient: string[];
}

const lightTheme: ThemeColors = {
  background: "#0f0f1a",
  surface: "rgba(20,20,40,0.4)",
  primary: "#a78bfa",
  secondary: "#8b5cf6",
  text: "#e0e0ff",
  textSecondary: "#b0b0ff",
  border: "#8b5cf6",
  card: "rgba(20,20,40,0.4)",
  gradient: ["#000000", "#0f0f1a"],
};

const darkTheme: ThemeColors = {
  background: "#0f0f1a",
  surface: "rgba(20,20,40,0.4)",
  primary: "#a78bfa",
  secondary: "#8b5cf6",
  text: "#e0e0ff",
  textSecondary: "#b0b0ff",
  border: "#8b5cf6",
  card: "rgba(20,20,40,0.4)",
  gradient: ["#000000", "#0f0f1a"],
};

interface NotificationSettings {
  dailyReminder: boolean;
  sessionReminder: boolean;
  progressUpdates: boolean;
  reminderTime: string; // HH:MM format
}

interface PrivacySettings {
  analytics: boolean;
  crashReporting: boolean;
  personalizedContent: boolean;
  dataSharing: boolean;
}

interface AppSettings {
  theme: Theme;
  language: Language;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

type NotificationPermissionStatus = "unknown" | "granted" | "denied" | "undetermined" | "unsupported";

const defaultSettings: AppSettings = {
  theme: "dark",
  language: "en",
  notifications: {
    dailyReminder: true,
    sessionReminder: true,
    progressUpdates: false,
    reminderTime: "09:00",
  },
  privacy: {
    analytics: true,
    crashReporting: true,
    personalizedContent: true,
    dataSharing: false,
  },
};

const SUPPORTED_LANGUAGES: Language[] = ["en", "zh", "es"];

function normalizeLanguage(value: unknown): Language {
  return typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as Language)
    ? (value as Language)
    : defaultSettings.language;
}

const EXTRA_STORAGE_KEYS = [
  "customMeditationsBackup",
  "customMeditationsCloudSync",
  "journeyStateCloudSync",
  "vipUpdatedAt",
  "identityUpdatedAt",
] as const;

const getApiBaseUrl = () => {
  const trimmed = API_BASE_URL.trim().replace(/\/$/, "");
  if (!trimmed || trimmed.includes("mini-app-backend.example.com")) {
    return null;
  }
  return trimmed;
};

const deleteCloudSnapshot = async (path: string, body: Record<string, unknown>) => {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return;
  const response = await fetch(`${baseUrl}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText.slice(0, 300) || `Delete failed (${response.status})`);
  }
};

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermissionStatus>(
    Platform.OS === "web" ? "unsupported" : "unknown"
  );

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("appSettings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...defaultSettings,
          ...parsed,
          language: normalizeLanguage(parsed?.language),
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem("appSettings", JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }, []);

  const refreshNotificationPermissionStatus = useCallback(async (): Promise<NotificationPermissionStatus> => {
    if (Platform.OS === "web") {
      setNotificationPermissionStatus("unsupported");
      return "unsupported";
    }

    try {
      const permissions = await Notifications.getPermissionsAsync();
      const status = (permissions.status || "unknown") as NotificationPermissionStatus;
      setNotificationPermissionStatus(status);
      return status;
    } catch (error) {
      console.error("Error checking notification permissions:", error);
      setNotificationPermissionStatus("unknown");
      return "unknown";
    }
  }, []);

  const setupNotifications = useCallback(async () => {
    if (Platform.OS === "web") {
      setNotificationPermissionStatus("unsupported");
      return;
    }

    try {
      const existingStatus = await refreshNotificationPermissionStatus();
      const { status } =
        existingStatus === "undetermined"
          ? await Notifications.requestPermissionsAsync()
          : await Notifications.getPermissionsAsync();
      setNotificationPermissionStatus((status || "unknown") as NotificationPermissionStatus);
      if (status !== "granted") {
        return;
      }

      // Configure notification behavior
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  }, [refreshNotificationPermissionStatus]);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermissionStatus> => {
    if (Platform.OS === "web") {
      setNotificationPermissionStatus("unsupported");
      return "unsupported";
    }

    try {
      const currentStatus = await refreshNotificationPermissionStatus();
      if (currentStatus === "granted") {
        return "granted";
      }

      const { status } = await Notifications.requestPermissionsAsync();
      const nextStatus = (status || "unknown") as NotificationPermissionStatus;
      setNotificationPermissionStatus(nextStatus);

      if (nextStatus === "granted") {
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      }

      return nextStatus;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      setNotificationPermissionStatus("unknown");
      return "unknown";
    }
  }, [refreshNotificationPermissionStatus]);

  const openNotificationSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error("Error opening settings:", error);
      throw error;
    }
  }, []);

  const scheduleNotifications = useCallback(async (notificationSettings: NotificationSettings) => {
    if (Platform.OS === "web") return;

    try {
      // Cancel all existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (notificationSettings.dailyReminder) {
        const [hours, minutes] = notificationSettings.reminderTime.split(":").map(Number);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Time to Meditate 🧘‍♀️",
            body: "Take a moment for yourself and find inner peace",
            sound: true,
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          } as Notifications.CalendarTriggerInput,
        });
      }
    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    setupNotifications();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });
    
    return () => subscription?.remove();
  }, [loadSettings, setupNotifications]);

  const updateTheme = useCallback(async (theme: Theme) => {
    const newSettings = { ...settings, theme };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const updateLanguage = useCallback(async (language: Language) => {
    const newSettings = { ...settings, language };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const updateNotificationSettings = useCallback(async (notifications: Partial<NotificationSettings>) => {
    const newNotifications = { ...settings.notifications, ...notifications };
    const newSettings = { ...settings, notifications: newNotifications };
    await saveSettings(newSettings);

    // Schedule or cancel notifications based on settings
    if (Platform.OS !== "web") {
      await scheduleNotifications(newNotifications);
    }
  }, [settings, saveSettings, scheduleNotifications]);

  const updatePrivacySettings = useCallback(async (privacy: Partial<PrivacySettings>) => {
    const newPrivacy = { ...settings.privacy, ...privacy };
    const newSettings = { ...settings, privacy: newPrivacy };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const resetSettings = useCallback(async () => {
    await saveSettings(defaultSettings);
  }, [saveSettings]);

  const exportData = useCallback(async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const dynamicKeys = allKeys.filter(
        (key) => key.startsWith("vipEntitlement:") || key.startsWith("psig-voice-usage:")
      );
      const keysToRead = [...APP_STORAGE_KEYS, ...EXTRA_STORAGE_KEYS, ...dynamicKeys];
      const entries = await AsyncStorage.multiGet(keysToRead);
      const localData = Object.fromEntries(entries.filter(([key, value]) => key && value != null));
      const savedWallet = localData.walletAddress ? String(localData.walletAddress) : null;
      const savedProfile = localData.userProfile ? JSON.parse(String(localData.userProfile)) : null;

      const allData = {
        settings,
        localData,
        cloudData: savedWallet
          ? {
              customMeditations: await fetchCloudCustomMeditations(savedWallet),
              journeyState: await fetchCloudJourneyState(savedWallet),
              vipEntitlement: await fetchCloudVipEntitlement(savedWallet),
              identityState: await fetchCloudIdentityState(savedWallet),
            }
          : null,
        metadata: {
          walletAddress: savedWallet,
          username: savedProfile?.username ?? null,
          exportedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
      return JSON.stringify(allData, null, 2);
    } catch (error) {
      console.error("Error exporting data:", error);
      throw error;
    }
  }, [settings]);

  const clearAllData = useCallback(async () => {
    try {
      const savedWallet = await AsyncStorage.getItem("walletAddress");
      const savedCustomMeditations = await AsyncStorage.getItem("customMeditations");
      const allKeys = await AsyncStorage.getAllKeys();
      const dynamicKeys = allKeys.filter(
        (key) => key.startsWith("vipEntitlement:") || key.startsWith("psig-voice-usage:")
      );

      if (savedWallet) {
        await Promise.allSettled([
          deleteCloudSnapshot("/api/custom-meditations", { userId: savedWallet }),
          deleteCloudSnapshot("/api/journey-state", { userId: savedWallet }),
          deleteCloudSnapshot("/api/vip-entitlement", { walletAddress: savedWallet }),
          deleteCloudSnapshot("/api/identity-state", { walletAddress: savedWallet }),
        ]);
      }

      if (savedWallet && savedCustomMeditations) {
        try {
          const parsed = JSON.parse(savedCustomMeditations) as Array<{ id?: string }>;
          const sessionIds = Array.isArray(parsed) ? parsed.map((item) => item?.id).filter(Boolean) as string[] : [];
          const baseUrl = getApiBaseUrl();
          if (baseUrl && sessionIds.length > 0) {
            await Promise.allSettled(
              sessionIds.map((sessionId) =>
                fetch(`${baseUrl}/api/tts/elevenlabs`, {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sessionId }),
                })
              )
            );
          }
        } catch (error) {
          console.error("Error clearing TTS cache snapshot:", error);
        }
      }

      await AsyncStorage.multiRemove([...APP_STORAGE_KEYS, ...EXTRA_STORAGE_KEYS, ...dynamicKeys]);
      setSettings(defaultSettings);
    } catch (error) {
      console.error("Error clearing data:", error);
      throw error;
    }
  }, []);

  const currentTheme = useMemo(() => {
    if (settings.theme === "system") {
      return systemColorScheme === "dark" ? darkTheme : lightTheme;
    }
    return settings.theme === "dark" ? darkTheme : lightTheme;
  }, [settings.theme, systemColorScheme]);

  const isDarkMode = useMemo(() => {
    if (settings.theme === "system") {
      return systemColorScheme === "dark";
    }
    return settings.theme === "dark";
  }, [settings.theme, systemColorScheme]);

  return useMemo(() => ({
    settings,
    isLoading,
    currentTheme,
    isDarkMode,
    notificationPermissionStatus,
    refreshNotificationPermissionStatus,
    requestNotificationPermission,
    openNotificationSettings,
    updateTheme,
    updateLanguage,
    updateNotificationSettings,
    updatePrivacySettings,
    resetSettings,
    exportData,
    clearAllData,
  }), [
    settings,
    isLoading,
    currentTheme,
    isDarkMode,
    notificationPermissionStatus,
    refreshNotificationPermissionStatus,
    requestNotificationPermission,
    openNotificationSettings,
    updateTheme,
    updateLanguage,
    updateNotificationSettings,
    updatePrivacySettings,
    resetSettings,
    exportData,
    clearAllData,
  ]);
});
