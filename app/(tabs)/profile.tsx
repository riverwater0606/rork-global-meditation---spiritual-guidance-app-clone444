import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  User,
  Bell,
  Moon,
  Globe,
  Shield,
  LogOut,
  ChevronRight,
  Edit2,
  Crown,
  Wifi,
  WifiOff,
  Database,
  AlertCircle,
  CheckCircle,
} from "lucide-react-native";
import { useUser } from "@/providers/UserProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useMeditation } from "@/providers/MeditationProvider";
import {
  getFirebaseAuthUser,
  getFirebaseDiagnostics,
  isFirebaseAuthReady,
  isFirebaseEnabled,
} from "@/constants/firebase";
import { firebaseDebugPing } from "@/lib/firebaseDebug";
import { getFirebaseBindingPreview } from "@/lib/firebaseIdentity";
import { router } from "expo-router";
import { ensureMiniKitLoaded, getMiniKit, isMiniKitInstalled } from "@/components/worldcoin/IDKitWeb";
import { ResponseEvent } from "@/constants/minikit";
import { getPreferredIdentityLabel, shortenWalletAddress } from "@/lib/identity";
import { createVipPayment } from "@/lib/worldcoin/pay";
import { getOpenInWorldAppMessage } from "@/lib/worldcoin/messages";
import CustomModal from "@/components/CustomModal";
import { FREE_AMBIENT_SOUND_IDS, VIP_DURATION_DAYS } from "@/constants/vip";
import { IS_DEV_FULL_MOCK, IS_LOCAL_DEV } from "@/constants/env";
import { DAILY_RESONANCE_CAP, RESONANCE_AMBIENT_PASS_COST, RESONANCE_ORB_AURA_COST, getResonanceRewardLabel } from "@/constants/resonance";
import { useVipConfirmationSync } from "@/hooks/useVipConfirmationSync";
import { localize, profileCopy } from "@/lib/i18n";

const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const extractPaymentResultField = (
  payload: Record<string, unknown> | null | undefined,
  keys: string[]
) => {
  if (!payload) return null;
  for (const key of keys) {
    const direct = payload[key];
    if (direct != null && direct !== "") return direct;
  }
  const nestedCandidates = [
    payload.data as Record<string, unknown> | undefined,
    payload.finalPayload as Record<string, unknown> | undefined,
    payload.transaction as Record<string, unknown> | undefined,
    payload.input as Record<string, unknown> | undefined,
  ];
  for (const nested of nestedCandidates) {
    if (!nested) continue;
    for (const key of keys) {
      const value = nested[key];
      if (value != null && value !== "") return value;
    }
  }
  return null;
};

const normalizePaymentPayload = (payload: unknown): Record<string, unknown> => {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  const dataPayload =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;
  const finalPayload =
    root.finalPayload && typeof root.finalPayload === "object"
      ? (root.finalPayload as Record<string, unknown>)
      : null;
  return {
    ...root,
    ...(dataPayload || {}),
    ...(finalPayload || {}),
  };
};

const hasSubmittedPaymentSignal = (payload: Record<string, unknown> | null | undefined) => {
  const paymentCommandStatus = String(
    extractPaymentResultField(payload, ["status", "command_status"]) || ""
  ).toLowerCase();
  const paymentTransactionStatus = String(
    extractPaymentResultField(payload, ["transaction_status", "status"]) || ""
  ).toLowerCase();
  const paymentTransactionId = extractPaymentResultField(payload, [
    "transaction_id",
    "transactionId",
    "id",
  ]);

  if (paymentCommandStatus === "error") {
    return false;
  }

  return (
    paymentCommandStatus === "success" ||
    paymentCommandStatus === "submitted" ||
    paymentTransactionStatus === "submitted" ||
    paymentTransactionStatus === "pending" ||
    paymentTransactionStatus === "success" ||
    Boolean(paymentTransactionId)
  );
};

const resolveMiniKitPaymentPayload = async ({
  miniKit,
  payFn,
  sendPayload,
}: {
  miniKit: any;
  payFn: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  sendPayload: Record<string, unknown>;
}) => {
  const paymentEvent = ResponseEvent?.MiniAppPayment;
  const canSubscribe =
    Boolean(paymentEvent) &&
    typeof miniKit?.subscribe === "function" &&
    typeof miniKit?.unsubscribe === "function";

  let unsubscribe = () => {};
  let eventPromise: Promise<Record<string, unknown> | null> = Promise.resolve(null);

  if (canSubscribe) {
    eventPromise = new Promise((resolve) => {
      let settled = false;
      const cleanup = () => {
        unsubscribe();
      };
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(null);
      }, 20_000);
      const handleResponse = (response: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(normalizePaymentPayload(response));
      };
      unsubscribe = () => {
        clearTimeout(timer);
        try {
          miniKit.unsubscribe(paymentEvent);
        } catch (error) {
          console.warn("[VIP] Payment event unsubscribe failed", error);
        }
      };
      try {
        miniKit.subscribe(paymentEvent, handleResponse);
      } catch (error) {
        clearTimeout(timer);
        unsubscribe = () => {};
        console.warn("[VIP] Payment event subscribe failed", error);
        resolve(null);
      }
    });
  }

  let commandResult: unknown;
  try {
    commandResult = await payFn(sendPayload);
  } catch (error) {
    unsubscribe();
    throw error;
  }

  const normalizedCommandPayload = normalizePaymentPayload(commandResult);
  const normalizedEventPayload = await eventPromise;
  const mergedPayload = {
    ...normalizedCommandPayload,
    ...(normalizedEventPayload || {}),
  };

  if (Object.keys(mergedPayload).length > 0) {
    return mergedPayload;
  }

  return normalizedEventPayload || normalizedCommandPayload;
};

type LocalVipPendingPayment = {
  reference: string;
  verificationToken: string;
  paymentResult: Record<string, unknown>;
} | null;

const persistVipPendingFallback = async (pendingPayment: Exclude<LocalVipPendingPayment, null>) => {
  await AsyncStorage.multiSet([
    ["vipConfirmPending", "true"],
    ["vipPaymentLock", "true"],
    ["vipPendingPayment", JSON.stringify(pendingPayment)],
  ]);
};

const clearVipPendingFallback = async () => {
  await AsyncStorage.multiRemove(["vipConfirmPending", "vipPaymentLock", "vipPendingPayment"]);
};


export default function ProfileScreen() {
  const { profile, updateProfile, logout, hasActiveVIP, unlockVIP, resetVIP, markVIPConfirmPending, setVIPPaymentLockState, vipActivatedAt, vipExpiresAt, vipDaysRemaining, vipConfirmPending, vipPaymentLock, vipPendingPayment, walletAddress, isVerified, authToken } = useUser();
  const { settings, currentTheme, isDarkMode } = useSettings();
  const { stats, missionStats, grantVipStarterPack, resetVipStarterPack, resetVipTestingSandbox, markVipWelcomeSeen, resonanceState, hasClaimedDailyCheckIn, claimDailyCheckIn, isOrbAuraActive, grantTestResonance } = useMeditation();
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [vipModalVisible, setVipModalVisible] = useState(false);
  const [vipModalMessage, setVipModalMessage] = useState("");
  const [vipWelcomeModalVisible, setVipWelcomeModalVisible] = useState(false);
  const [vipUpgradePending, setVipUpgradePending] = useState(false);
  const [vipPendingNotice, setVipPendingNotice] = useState<string | null>(null);
  const [localVipPendingPayment, setLocalVipPendingPayment] = useState<LocalVipPendingPayment>(null);
  const [firebaseTestRunning, setFirebaseTestRunning] = useState<boolean>(false);
  const [claimingResonance, setClaimingResonance] = useState(false);
  const [grantingTestResonance, setGrantingTestResonance] = useState(false);
  const todayKey = getTodayKey();
  const lang = settings.language;
  const tr = (zh: string, en: string, es: string) => {
    if (lang === "zh") return zh;
    if (lang === "es") return es;
    return en;
  };
  const firebaseDiag = getFirebaseDiagnostics();
  const firebaseBindingPreview = getFirebaseBindingPreview({
    walletAddress,
    username: profile.username,
  });
  const firebaseHealthState = !isFirebaseEnabled()
    ? "disabled"
    : !isFirebaseAuthReady()
      ? "waiting"
      : !getFirebaseAuthUser()
        ? "auth-failed"
        : !firebaseBindingPreview.hasAnyIdentity
          ? "identity-missing"
          : "ready";
  const profileDisplayName = getPreferredIdentityLabel({
    profile,
    walletAddress,
    lang,
    fallbackZh: "靈性探索者",
    fallbackEn: "Spiritual Seeker",
  });
  const profileSecondaryLine =
    profile.username ||
    profile.email ||
    (walletAddress
      ? shortenWalletAddress(walletAddress)
      : lang === "zh"
        ? `成員自 ${new Date().getFullYear()}`
        : lang === "es"
          ? `Miembro desde ${new Date().getFullYear()}`
        : `Member since ${new Date().getFullYear()}`);
  const vipActivatedAtLabel = vipActivatedAt
    ? new Date(vipActivatedAt).toLocaleString(lang === "zh" ? "zh-HK" : lang === "es" ? "es-ES" : "en-US")
    : vipConfirmPending
      ? tr("確認後顯示", "After confirmation", "Después de la confirmación")
      : tr("未記錄", "Not recorded", "Sin registro");
  const vipExpiryLabel = vipExpiresAt
    ? new Date(vipExpiresAt).toLocaleString(lang === "zh" ? "zh-HK" : lang === "es" ? "es-ES" : "en-US")
    : vipConfirmPending
      ? tr("確認後顯示", "After confirmation", "Después de la confirmación")
      : tr("未設定", "Not set", "Sin configurar");
  const effectiveVipPendingPayment = vipPendingPayment || localVipPendingPayment;
  const hasVipPendingWorkflow =
    !hasActiveVIP && (vipConfirmPending || vipPaymentLock || Boolean(effectiveVipPendingPayment));
  const pendingTransactionId = String(
    extractPaymentResultField(effectiveVipPendingPayment?.paymentResult, [
      "transaction_id",
      "transactionId",
      "id",
    ]) || ""
  );
  const pendingTransactionStatus = String(
    extractPaymentResultField(effectiveVipPendingPayment?.paymentResult, [
      "transaction_status",
      "status",
    ]) || ""
  );
  const vipBenefits = lang === "zh"
    ? "解鎖全部環境音、送 1 粒贈送覺醒球作即時體驗、開放精品形態，並以較低門檻完成任務。"
    : lang === "es"
      ? "Desbloquea todos los sonidos ambientales, recibe 1 esfera despierta de regalo para exploración inmediata, formas premium y umbrales de misión más bajos."
    : "Unlock all ambient sounds, receive 1 gifted awakened orb for instant exploration, premium starter forms, and lower mission thresholds.";
  const vipAmbientSoundCount = 29;
  const vipLockedAmbientSoundCount = Math.max(0, vipAmbientSoundCount - FREE_AMBIENT_SOUND_IDS.length);
  const vipStarterItems = lang === "zh"
    ? ["1 粒贈送覺醒球（即時體驗）", "量子軌道", "宇宙靈蛇", "光環綻放"]
    : lang === "es"
      ? ["1 esfera despierta de regalo (acceso inmediato)", "Órbitas cuánticas", "Serpiente cósmica", "Halo en flor"]
    : ["1 gifted awakened orb (instant access)", "Quantum Orbitals", "Cosmic Serpent", "Halo Bloom"];
  const starterShapeLabels: Record<string, { zh: string; en: string; es: string }> = {
    "quantum-orbitals": { zh: "量子軌道", en: "Quantum Orbitals", es: "Órbitas cuánticas" },
    "cosmic-serpent": { zh: "宇宙靈蛇", en: "Cosmic Serpent", es: "Serpiente cósmica" },
    "halo-bloom": { zh: "光環綻放", en: "Halo Bloom", es: "Halo en flor" },
  };
  const starterPackDisplay = missionStats.starterShapesGranted.length > 0
    ? missionStats.starterShapesGranted.map((shape) => starterShapeLabels[shape]?.[lang] ?? starterShapeLabels[shape]?.en ?? shape).join(lang === "zh" ? "、" : ", ")
    : tr("未記錄", "Not recorded", "Sin registro");
  const vipOngoingBenefits = lang === "zh"
    ? [
        `30 天內解鎖全部 ${vipAmbientSoundCount} 條環境音`,
        `立即開放現時鎖住的 ${vipLockedAmbientSoundCount} 條環境音`,
        "你自己養成的主線光球仍然要 7 日，但每日只需 5 分鐘",
        "形態任務門檻比免費版更低",
      ]
    : lang === "es"
      ? [
          `Desbloquea los ${vipAmbientSoundCount} sonidos ambientales durante 30 días`,
          `Abre de inmediato los ${vipLockedAmbientSoundCount} sonidos bloqueados en la versión gratis`,
          "Tu esfera principal sigue tardando 7 días en despertar, pero solo requiere 5 minutos al día",
          "Los umbrales de las tareas son más bajos que en la versión gratis",
        ]
    : [
        `Unlock all ${vipAmbientSoundCount} ambient sounds for 30 days`,
        `Immediately open the ${vipLockedAmbientSoundCount} sounds locked in the free tier`,
        "Your main orb still takes 7 days to awaken, but only 5 minutes per day",
        "Lower task thresholds than the free tier",
      ];
  const vipCompareLines = lang === "zh"
    ? [
        `免費版：只開放 ${FREE_AMBIENT_SOUND_IDS.length} 條精選環境音、每日 7 分鐘養球`,
        `VIP：開放全部 ${vipAmbientSoundCount} 條環境音、送 1 粒贈送覺醒球、精品形態、每日 5 分鐘養球`,
      ]
    : [
        `Free: ${FREE_AMBIENT_SOUND_IDS.length} selected ambient sounds, 7 minutes/day to grow your orb`,
        `VIP: all ${vipAmbientSoundCount} ambient sounds, 1 gifted awakened orb, premium forms, 5 minutes/day to grow your orb`,
      ];
  const recentResonanceEntries = resonanceState.ledger.slice(0, 3);
  const todayResonanceEarned = resonanceState.dailyBucket.dayKey === todayKey ? resonanceState.dailyBucket.amount : 0;
  const resonanceSpendPrompt = resonanceState.blessingBoostCharges > 0
    ? (lang === "zh"
      ? `你目前有 ${resonanceState.blessingBoostCharges} 次祝福加持可用。下次送禮會自動消耗 1 次，對方會更容易先看到這則祝福，而你自己的送出卡也會帶金色加持標記。`
      : `You have ${resonanceState.blessingBoostCharges} blessing boost charge ready. It will be consumed on your next gift, making the blessing more prominent for the recipient and visibly marked in your sent history.`)
    : (lang === "zh"
      ? "第一個用途是「強化下一次祝福」：在花園花 5 點，下一次送禮會帶金色標記，並在對方那邊更顯眼。"
      : "The first spend option is Amplify Next Blessing: spend 5 in the garden so your next gift gets a golden mark and stands out more for the recipient.");
  const resonanceAuraPrompt = isOrbAuraActive
    ? (lang === "zh"
      ? "今日光場已啟動。首頁與花園的主光球都會進入更亮、更像展演的狀態，這是你自己最即時看得到的 Resonance 效果。"
      : "Today's aura field is active. Your main orb appears brighter and more ceremonial across Home and Garden, so you can immediately feel Resonance in action.")
    : (lang === "zh"
      ? `第二個用途是「點亮今日光場」：花費 ${RESONANCE_ORB_AURA_COST} 點，讓首頁與花園的主光球今日都更亮、更有存在感。`
      : `The second spend is Activate Today's Aura Field: spend ${RESONANCE_ORB_AURA_COST} to make your main orb brighter and more present across Home and Garden for the day.`);
  const resonanceAmbientPrompt = lang === "zh"
    ? `第三個用途是「今日全環境音通行」：花費 ${RESONANCE_AMBIENT_PASS_COST} 點，即日解鎖花園與冥想館的全部環境音。`
    : lang === "es"
      ? `El tercer gasto es Todos los sonidos ambientales de hoy: gasta ${RESONANCE_AMBIENT_PASS_COST} para desbloquear toda la biblioteca de sonidos en Jardín y Meditar durante hoy.`
    : `The third spend is All Ambient Sounds Today: spend ${RESONANCE_AMBIENT_PASS_COST} to unlock the full ambient sound library across Garden and Meditate for the day.`;

  const handleCopyUsername = async () => {
    if (!profile.username) return;
    const value = `@${profile.username}`;
    try {
      const clipboard = globalThis?.navigator?.clipboard;
      if (clipboard?.writeText) {
        await clipboard.writeText(value);
        Alert.alert(tr("已複製", "Copied", "Copiado"), value);
        return;
      }
    } catch (error) {
      console.warn("[Profile] copy username failed", error);
    }

    Alert.alert(
      tr("請手動複製", "Copy manually", "Copia manualmente"),
      value
    );
  };

  const handleClaimDailyCheckIn = async () => {
    if (claimingResonance) return;
    setClaimingResonance(true);
    try {
      const result = await claimDailyCheckIn();
      if (result.granted) {
        Alert.alert(
          tr("已領取 Resonance", "Resonance claimed", "Resonance obtenido"),
          tr(`今天已獲得 ${result.amount} 點 Resonance。`, `You earned ${result.amount} Resonance today.`, `Hoy obtuviste ${result.amount} de Resonance.`)
        );
      } else {
        Alert.alert(
          tr("今日已完成", "Already done today", "Ya está hecho hoy"),
          result.reason === "daily-cap"
            ? tr("今日 Resonance 已達上限。", "You have reached today's Resonance cap.", "Ya alcanzaste el límite de Resonance de hoy.")
            : tr("今日簽到已領取。", "Today's check-in has already been claimed.", "El check-in de hoy ya fue reclamado.")
        );
      }
    } finally {
      setClaimingResonance(false);
    }
  };

  const handleGrantTestResonance = async () => {
    if (grantingTestResonance) return;
    setGrantingTestResonance(true);
    try {
      const result = await grantTestResonance(50);
      if (result.granted) {
        Alert.alert(
          tr("已加 50 Resonance", "Added 50 Resonance", "Se añadieron 50 de Resonance"),
          tr(
            `測試點數已發放，你而家可以直接試光暈、祝福加持同環境音通行。餘額：${result.balanceAfter}`,
            `Test currency granted. You can now try aura, blessing boost, and ambient pass. Balance: ${result.balanceAfter}`,
            `Moneda de prueba otorgada. Ya puedes probar el aura, el impulso de bendición y el pase ambiental. Saldo: ${result.balanceAfter}`
          )
        );
      }
    } finally {
      setGrantingTestResonance(false);
    }
  };

  React.useEffect(() => {
    setName(profile.name || "");
  }, [profile.name]);

  React.useEffect(() => {
    if (!hasActiveVIP || !missionStats.vipStarterPackGranted || missionStats.vipWelcomeSeen) {
      return;
    }
    setVipWelcomeModalVisible(true);
  }, [hasActiveVIP, missionStats.vipStarterPackGranted, missionStats.vipWelcomeSeen]);

  React.useEffect(() => {
    if (hasActiveVIP) {
      setLocalVipPendingPayment(null);
      void clearVipPendingFallback();
      return;
    }
  }, [hasActiveVIP]);

  React.useEffect(() => {
    if (hasActiveVIP || vipPendingPayment || localVipPendingPayment) return;

    let cancelled = false;
    void (async () => {
      try {
        const savedPendingPayment = await AsyncStorage.getItem("vipPendingPayment");
        if (!savedPendingPayment || cancelled) return;
        const parsed = JSON.parse(savedPendingPayment) as Exclude<LocalVipPendingPayment, null>;
        if (parsed?.reference) {
          setLocalVipPendingPayment(parsed);
        }
      } catch (error) {
        console.warn("[VIP] Failed to restore local pending payment fallback", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasActiveVIP, localVipPendingPayment, vipPendingPayment]);

  const { retryConfirmation, lastConfirmationError } = useVipConfirmationSync({
    enabled: hasVipPendingWorkflow && Boolean(effectiveVipPendingPayment),
    pendingPayment: effectiveVipPendingPayment,
    authToken,
    lang,
    profile,
    unlockVIP,
    grantVipStarterPack,
    markVIPConfirmPending,
    updateProfile,
    onNotice: setVipPendingNotice,
  });


  const handleSave = () => {
    updateProfile({ name: name.trim() });
    setIsEditing(false);
  };

  const handleSignOut = () => {
    setLogoutModalVisible(true);
  };

  const confirmSignOut = async () => {
    try {
      await logout();
      router.replace("/sign-in");
    } catch (error) {
      console.error("[ProfileScreen] Logout error:", error);
    }
  };

  const getThemeSubtitle = () => {
    const themes = {
      light: { en: "Light mode", zh: "淺色模式" },
      dark: { en: "Dark mode", zh: "深色模式" },
      system: { en: "System default", zh: "系統預設" },
    };
    return themes[settings.theme]?.[lang] || themes.light[lang];
  };

  const getLanguageSubtitle = () => {
    switch (settings.language) {
      case "en": return "English";
      case "zh": return "中文";
      case "es": return "Español";
      default: return "English";
    }
  };

  const settingsItems = [
    { 
      id: "notifications", 
      icon: Bell, 
      title: localize(lang, profileCopy.notifications), 
      subtitle: settings.notifications.dailyReminder 
        ? localize(lang, profileCopy.remindersEnabled) 
        : localize(lang, profileCopy.remindersDisabled),
      onPress: () => router.push("/settings/notifications")
    },
    { 
      id: "theme", 
      icon: Moon, 
      title: localize(lang, profileCopy.theme), 
      subtitle: getThemeSubtitle(),
      onPress: () => router.push("/settings/theme")
    },
    { 
      id: "language", 
      icon: Globe, 
      title: localize(lang, profileCopy.language), 
      subtitle: getLanguageSubtitle(),
      onPress: () => router.push("/settings/language")
    },
    { 
      id: "privacy", 
      icon: Shield, 
      title: localize(lang, profileCopy.privacy), 
      subtitle: localize(lang, profileCopy.manageData),
      onPress: () => router.push("/settings/privacy")
    },
  ];

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    profileCard: {
      backgroundColor: currentTheme.card,
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 20,
      borderRadius: 16,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    profileName: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.text,
    },
    profileEmail: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginTop: 4,
    },
    nameInput: {
      width: "100%",
      borderWidth: 1,
      borderColor: currentTheme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      marginBottom: 12,
      color: currentTheme.text,
      backgroundColor: currentTheme.surface,
    },
    cancelButton: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    cancelButtonText: {
      color: currentTheme.textSecondary,
      fontWeight: "600",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.text,
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentTheme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: currentTheme.text,
    },
    settingSubtitle: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginTop: 2,
    },
  });

  return (
    <View style={themedStyles.container}>
      <CustomModal
        isVisible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        title={tr("登出", "Sign Out", "Cerrar sesión")}
        message={tr("您確定要登出嗎？", "Are you sure you want to sign out?", "¿Seguro que quieres cerrar sesión?")}
        cancelText={tr("取消", "Cancel", "Cancelar")}
        confirmText={tr("登出", "Sign Out", "Cerrar sesión")}
        onConfirm={confirmSignOut}
        confirmDestructive
      />
      <CustomModal
        isVisible={vipModalVisible}
        onClose={() => setVipModalVisible(false)}
        title={tr("成功", "Success", "Correcto")}
        message={vipModalMessage}
        confirmText="OK"
        onConfirm={() => setVipModalVisible(false)}
      />
      <CustomModal
        isVisible={vipWelcomeModalVisible}
        onClose={() => {
          void markVipWelcomeSeen();
          setVipWelcomeModalVisible(false);
        }}
        title={tr("VIP 禮包已送達", "VIP Gift Pack Delivered", "Pack de regalo VIP entregado")}
        message={
          lang === "zh"
            ? "你已收到 1 粒覺醒球，以及 3 款 VIP 精品形態：量子軌道、宇宙靈蛇、光環綻放。現在可以直接去花園體驗。"
            : lang === "es"
              ? "Has recibido 1 esfera despierta y 3 formas premium VIP: Órbitas cuánticas, Serpiente cósmica y Halo en flor. Puedes ir al jardín y probarlas ahora."
              : "You received 1 awakened orb and 3 VIP premium forms: Quantum Orbitals, Cosmic Serpent, and Halo Bloom. You can head to the garden and try them now."
        }
        confirmText={tr("開始體驗", "Start Exploring", "Empezar a explorar")}
        onConfirm={async () => {
          await markVipWelcomeSeen();
          setVipWelcomeModalVisible(false);
        }}
      />
      <LinearGradient
        colors={currentTheme.gradient as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <Text style={styles.title}>
            {localize(lang, profileCopy.title)}
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={themedStyles.profileCard}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={currentTheme.gradient as any}
              style={styles.avatar}
            >
              <User size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={themedStyles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder={tr("輸入您的名稱", "Enter your name", "Introduce tu nombre")}
                placeholderTextColor={currentTheme.textSecondary}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={themedStyles.cancelButton}
                  onPress={() => {
                    setName(profile.name);
                    setIsEditing(false);
                  }}
                >
                  <Text style={themedStyles.cancelButtonText}>
                    {tr("取消", "Cancel", "Cancelar")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>
                    {tr("儲存", "Save", "Guardar")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={themedStyles.profileName}>
                  {profileDisplayName}
                </Text>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Edit2 size={18} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
              <Text style={themedStyles.profileEmail}>
                {profileSecondaryLine}
              </Text>
            </View>
          )}
        </View>

        {profile.username ? (
          <View style={[styles.usernameCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.usernameCardLabel, { color: currentTheme.textSecondary }]}>
                {localize(lang, profileCopy.worldUsername)}
              </Text>
              <Text style={[styles.usernameCardValue, { color: currentTheme.text }]}>
                @{profile.username}
              </Text>
              <Text style={[styles.usernameCardHint, { color: currentTheme.textSecondary }]}>
                {localize(lang, profileCopy.usernameHint)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.usernameCopyButton, { borderColor: currentTheme.primary }]}
              onPress={handleCopyUsername}
            >
              <Text style={[styles.usernameCopyText, { color: currentTheme.primary }]}>
                {localize(lang, profileCopy.copy)}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={[styles.resonanceInfoCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
          <View style={styles.resonanceInfoHeader}>
            <View>
              <Text style={[styles.resonanceInfoLabel, { color: currentTheme.primary }]}>
                {localize(lang, profileCopy.resonanceEnergy)}
              </Text>
              <Text style={[styles.resonanceInfoBalance, { color: currentTheme.text }]}>
                {resonanceState.balance}
              </Text>
            </View>
            <View style={[styles.resonanceTodayBadge, { backgroundColor: `${currentTheme.primary}18` }]}>
              <Text style={[styles.resonanceTodayBadgeText, { color: currentTheme.primary }]}>
                {lang === "zh"
                  ? `今日 ${todayResonanceEarned}/${DAILY_RESONANCE_CAP}`
                  : `Today ${todayResonanceEarned}/${DAILY_RESONANCE_CAP}`}
              </Text>
            </View>
          </View>
          <Text style={[styles.resonanceInfoLine, { color: currentTheme.textSecondary }]}>
            {localize(lang, profileCopy.resonanceIntro)}
          </Text>
          <TouchableOpacity
            style={[styles.resonanceClaimButton, { borderColor: currentTheme.border, marginBottom: 12 }]}
            onPress={() => router.push("/garden")}
            activeOpacity={0.85}
          >
            <Text style={[styles.resonanceClaimButtonText, { color: currentTheme.textSecondary }]}>
              {resonanceSpendPrompt}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resonanceClaimButton, { borderColor: isOrbAuraActive ? "#f59e0b" : currentTheme.border, marginBottom: 12 }]}
            onPress={() => router.push("/")}
            activeOpacity={0.85}
          >
            <Text style={[styles.resonanceClaimButtonText, { color: isOrbAuraActive ? "#f59e0b" : currentTheme.textSecondary }]}>
              {resonanceAuraPrompt}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resonanceClaimButton, { borderColor: currentTheme.border, marginBottom: 12 }]}
            onPress={() => router.push("/garden")}
            activeOpacity={0.85}
          >
            <Text style={[styles.resonanceClaimButtonText, { color: currentTheme.textSecondary }]}>
              {resonanceAmbientPrompt}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resonanceClaimButton, { borderColor: hasClaimedDailyCheckIn ? currentTheme.border : currentTheme.primary }]}
            onPress={handleClaimDailyCheckIn}
            activeOpacity={0.85}
          >
            <Text style={[styles.resonanceClaimButtonText, { color: hasClaimedDailyCheckIn ? currentTheme.textSecondary : currentTheme.primary }]}>
              {hasClaimedDailyCheckIn
                ? localize(lang, profileCopy.checkedInToday)
                : claimingResonance
                  ? localize(lang, profileCopy.claiming)
                  : localize(lang, profileCopy.dailyCheckIn)}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.resonanceRecentTitle, { color: currentTheme.text }]}>
            {localize(lang, profileCopy.recentEarnings)}
          </Text>
          {recentResonanceEntries.length > 0 ? (
            recentResonanceEntries.map((entry) => (
              <View key={entry.id} style={styles.resonanceLedgerRow}>
                <Text style={[styles.resonanceLedgerLabel, { color: currentTheme.textSecondary }]}>
                  {getResonanceRewardLabel(entry.type, lang)}
                </Text>
                <Text
                  style={[
                    styles.resonanceLedgerAmount,
                    { color: entry.amount >= 0 ? currentTheme.primary : "#f59e0b" },
                  ]}
                >
                  {entry.amount >= 0 ? `+${entry.amount}` : entry.amount}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.resonanceInfoLine, { color: currentTheme.textSecondary }]}>
              {localize(lang, profileCopy.noResonanceYet)}
            </Text>
          )}
        </View>

        {!hasActiveVIP && (
          <>
            <View style={[styles.vipInfoCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
              <Text style={[styles.vipInfoTitle, { color: currentTheme.text }]}>
              {localize(lang, profileCopy.vip30DayPass)}
            </Text>
            <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
              {localize(lang, profileCopy.vipIntro)}
            </Text>
            <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary, fontWeight: "700" }]}>
              {localize(lang, profileCopy.instantUnlocks)}
            </Text>
              {vipStarterItems.map((item) => (
                <Text key={item} style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
                  {lang === "zh" ? `• ${item}` : `• ${item}`}
                </Text>
              ))}
              <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary, fontWeight: "700", marginTop: 6 }]}>
                {localize(lang, profileCopy.duringFull30Days)}
              </Text>
              {vipOngoingBenefits.map((item) => (
                <Text key={item} style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
                  {lang === "zh" ? `• ${item}` : `• ${item}`}
                </Text>
              ))}
              <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary, fontWeight: "700", marginTop: 6 }]}>
                {localize(lang, profileCopy.freeVsVip)}
              </Text>
              {vipCompareLines.map((item) => (
                <Text key={item} style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
                  {lang === "zh" ? `• ${item}` : `• ${item}`}
                </Text>
              ))}
              {hasVipPendingWorkflow ? (
                <Text style={[styles.vipPendingNotice, { color: currentTheme.primary }]}>
                  {lang === "zh"
                    ? "你已有一筆 VIP 付款等待確認中。確認完成後會自動開通，暫時不需重複付款。"
                    : "A VIP payment is already waiting for confirmation. VIP will activate automatically once confirmed, so there is no need to pay again right now."}
                </Text>
              ) : null}
              {!hasVipPendingWorkflow && vipPaymentLock ? (
                <Text style={[styles.vipPendingNotice, { color: currentTheme.primary }]}>
                  {lang === "zh"
                    ? "VIP 付款流程暫時鎖定中，請稍後再試；如測試卡住，可使用下方重置工具。"
                    : "The VIP payment flow is temporarily locked. Please try again shortly, or use the reset tools below if your test flow is stuck."}
                </Text>
              ) : null}
            </View>
            {!hasVipPendingWorkflow && (
            <TouchableOpacity
              style={[styles.vipButton, { backgroundColor: currentTheme.primary }]}
              disabled={vipUpgradePending || vipPaymentLock}
              onPress={async () => {
                if (vipUpgradePending || vipPaymentLock) return;
                let paymentCommandStarted = false;
                try {
                  await setVIPPaymentLockState(true);
                  setVipUpgradePending(true);
                  await Promise.race([
                    ensureMiniKitLoaded(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
                  ]);

                  const mk = getMiniKit();
                  if (!(await isMiniKitInstalled(mk))) {
                    await setVIPPaymentLockState(false);
                    setVipModalMessage(getOpenInWorldAppMessage(lang));
                    setVipModalVisible(true);
                    return;
                  }

                  const paymentIntent = await createVipPayment(authToken);
                  const payAsyncFn = mk?.commandsAsync?.pay;
                  const payCommandFn = mk?.commands?.pay;
                  const legacySendPaymentFn =
                    mk?.commands?.sendPayment ||
                    mk?.sendPayment;
                  const payFn = payAsyncFn || payCommandFn || legacySendPaymentFn;

                  if (!payFn) {
                    throw new Error(tr("World Pay API 不可用", "World Pay API unavailable", "La API de World Pay no está disponible"));
                  }

                  const tokenPayload =
                    paymentIntent.tokens.length > 0
                      ? paymentIntent.tokens
                      : paymentIntent.tokenAmount
                        ? [
                            {
                              symbol: paymentIntent.token,
                              token_amount: paymentIntent.tokenAmount,
                            },
                          ]
                        : [];

                  const sendPayload =
                    payAsyncFn || payCommandFn
                      ? {
                          reference: paymentIntent.reference,
                          to: paymentIntent.recipient,
                          tokens: tokenPayload,
                          network: "worldchain",
                          description: paymentIntent.description,
                        }
                      : {
                          reference: paymentIntent.reference,
                          to: paymentIntent.recipient,
                          amount: paymentIntent.amount,
                          token: paymentIntent.token,
                          description: paymentIntent.description,
                        };

                  paymentCommandStarted = true;
                  const paymentPayload = await resolveMiniKitPaymentPayload({
                    miniKit: mk,
                    payFn,
                    sendPayload,
                  });
                  const paymentCommandStatus = String(
                    extractPaymentResultField(paymentPayload, ["status", "command_status"]) || ""
                  ).toLowerCase();
                  const paymentSubmitted = hasSubmittedPaymentSignal(paymentPayload);

                  if (paymentCommandStatus === "error") {
                    throw new Error(
                      String(
                        extractPaymentResultField(paymentPayload, ["error_code", "message", "error"]) ||
                          tr("VIP 升級失敗", "VIP upgrade failed", "La mejora VIP falló")
                      )
                    );
                  }

                  if (paymentSubmitted) {
                    const nextPendingPayment = {
                      reference: paymentIntent.reference,
                      verificationToken: paymentIntent.verificationToken,
                      paymentResult: paymentPayload,
                    };
                    setLocalVipPendingPayment(nextPendingPayment);
                    await persistVipPendingFallback(nextPendingPayment);
                    await markVIPConfirmPending(true, nextPendingPayment);
                    setVipPendingNotice(
                      lang === "zh"
                        ? "付款已送出，正在等待鏈上確認。確認完成後會自動開通 VIP，請勿重複付款。"
                        : "Payment submitted. Waiting for on-chain confirmation. VIP will activate automatically once confirmed. Please do not pay again."
                    );
                    setVipModalMessage(
                      lang === "zh"
                        ? "付款已送出，正在等待鏈上確認。確認完成後會自動開通 VIP，並發放覺醒球與 VIP 精品形態。請勿重複付款。"
                        : "Payment submitted. Waiting for on-chain confirmation. VIP will activate automatically and your awakened orb + premium forms will be granted after confirmation. Please do not pay again."
                    );
                    setVipModalVisible(true);
                  } else {
                    throw new Error(
                      lang === "zh"
                        ? "付款已送出，但尚未取得可驗證狀態"
                        : "Payment was sent, but no verifiable transaction status was returned."
                    );
                  }
                } catch (error) {
                  console.error("[VIP] Payment error", error);
                  const currentMk = getMiniKit();
                  if (!(await isMiniKitInstalled(currentMk))) {
                    setVipModalMessage(getOpenInWorldAppMessage(lang));
                    setVipModalVisible(true);
                  } else {
                    setVipModalMessage(error instanceof Error ? error.message : tr("VIP 升級失敗", "VIP upgrade failed", "La mejora VIP falló"));
                    setVipModalVisible(true);
                  }
                  if (!paymentCommandStarted) {
                    await setVIPPaymentLockState(false);
                  }
                } finally {
                  setVipUpgradePending(false);
                }
              }}
              testID="vip-upgrade-button"
            >
              <Crown size={20} color="#FFFFFF" />
              <Text style={styles.vipButtonText}>
                {vipUpgradePending
                  ? tr("處理付款中...", "Processing payment...", "Procesando pago...")
                  : vipPaymentLock
                      ? tr("VIP 付款流程鎖定中", "VIP payment flow locked", "El flujo de pago VIP está bloqueado")
                      : tr("升級 VIP · 0.2 WLD", "Go VIP · 0.2 WLD", "Hazte VIP · 0.2 WLD")}
              </Text>
            </TouchableOpacity>
            )}
          </>
        )}

        {hasActiveVIP && (
          <View style={[styles.vipBadge, { backgroundColor: currentTheme.primary }]}>
            <Crown size={20} color="#FFFFFF" />
            <Text style={styles.vipBadgeText}>
              {tr("VIP 會員", "VIP Member", "Miembro VIP")}
            </Text>
          </View>
        )}

        {!hasActiveVIP && hasVipPendingWorkflow && (
          <View style={[styles.vipBadge, { backgroundColor: currentTheme.primary }]}>
            <Crown size={20} color="#FFFFFF" />
            <Text style={styles.vipBadgeText}>
              {tr("VIP 確認中", "VIP Confirming", "VIP en confirmación")}
            </Text>
          </View>
        )}

        {(hasActiveVIP || hasVipPendingWorkflow) && (
          <View style={[styles.vipInfoCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.vipInfoTitle, { color: currentTheme.text }]}>
              {lang === "zh" ? "會員資訊" : lang === "es" ? "Información de membresía" : "Membership Info"}
            </Text>
            <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
              {lang === "zh" ? `狀態：${hasActiveVIP ? "已開通" : "確認中"}` : lang === "es" ? `Estado: ${hasActiveVIP ? "Activo" : "Confirmando"}` : `Status: ${hasActiveVIP ? "Active" : "Confirming"}`}
            </Text>
            {hasVipPendingWorkflow && vipPendingNotice ? (
              <Text style={[styles.vipPendingNotice, { color: currentTheme.primary }]}>
                {vipPendingNotice}
              </Text>
            ) : null}
            <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
              {lang === "zh" ? `開通時間：${vipActivatedAtLabel}` : lang === "es" ? `Activado el: ${vipActivatedAtLabel}` : `Activated at: ${vipActivatedAtLabel}`}
            </Text>
            <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
              {lang === "zh" ? `到期時間：${vipExpiryLabel}` : lang === "es" ? `Expira el: ${vipExpiryLabel}` : `Expires at: ${vipExpiryLabel}`}
            </Text>
            <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
              {hasVipPendingWorkflow
                ? (lang === "zh" ? `剩餘天數：確認後開始計算 ${VIP_DURATION_DAYS} 天` : lang === "es" ? `Días restantes: empezarán a contar tras la confirmación durante ${VIP_DURATION_DAYS} días` : `Days remaining: starts counting after confirmation for ${VIP_DURATION_DAYS} days`)
                : (lang === "zh" ? `剩餘天數：${vipDaysRemaining} / ${VIP_DURATION_DAYS} 天` : lang === "es" ? `Días restantes: ${vipDaysRemaining} / ${VIP_DURATION_DAYS}` : `Days remaining: ${vipDaysRemaining} / ${VIP_DURATION_DAYS} days`)}
            </Text>
            <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
              {lang === "zh" ? `用途：${vipBenefits}` : lang === "es" ? `Beneficios: ${vipBenefits}` : `Benefits: ${vipBenefits}`}
            </Text>
            <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
              {lang === "zh"
                ? `Starter Pack：${hasVipPendingWorkflow ? "確認完成後發放贈送覺醒球與 VIP 精品形態" : `贈送覺醒球 + ${starterPackDisplay}`}`
                : lang === "es"
                  ? `Starter Pack: ${hasVipPendingWorkflow ? "La esfera despierta de regalo y las formas premium se entregarán tras la confirmación" : `Esfera despierta de regalo + ${starterPackDisplay}`}`
                  : `Starter Pack: ${hasVipPendingWorkflow ? "Gifted awakened orb + premium forms will be granted after confirmation" : `Gifted awakened orb + ${starterPackDisplay}`}`}
            </Text>
            <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
              {lang === "zh"
                ? "說明：贈送覺醒球只是即時體驗用；你自己的主線光球仍然要完成 7 日養成。"
                : lang === "es"
                  ? "Nota: la esfera despierta de regalo es para exploración inmediata; tu esfera principal sigue el viaje de despertar de 7 días."
                  : "Note: the gifted awakened orb is for instant exploration; your own main orb still follows the 7-day awakening journey."}
            </Text>
            {hasVipPendingWorkflow && effectiveVipPendingPayment ? (
              <View style={[styles.firebaseDebugCard, { borderColor: currentTheme.border, backgroundColor: currentTheme.card }]}>
                <Text style={[styles.firebaseDebugTitle, { color: currentTheme.text }]}>
                  {tr("VIP 確認診斷", "VIP Confirmation Debug", "Diagnóstico de confirmación VIP")}
                </Text>
                <Text style={[styles.firebaseDebugLine, { color: currentTheme.textSecondary }]}>
                  {lang === "zh"
                    ? `Reference：${effectiveVipPendingPayment.reference}`
                    : lang === "es" ? `Referencia: ${effectiveVipPendingPayment.reference}` : `Reference: ${effectiveVipPendingPayment.reference}`}
                </Text>
                <Text style={[styles.firebaseDebugLine, { color: currentTheme.textSecondary }]}>
                  {lang === "zh"
                    ? `Transaction ID：${pendingTransactionId || "未收到"}`
                    : lang === "es" ? `ID de transacción: ${pendingTransactionId || "sin recibir"}` : `Transaction ID: ${pendingTransactionId || "missing"}`}
                </Text>
                <Text style={[styles.firebaseDebugLine, { color: currentTheme.textSecondary }]}>
                  {lang === "zh"
                    ? `付款狀態：${pendingTransactionStatus || "未收到"}`
                    : lang === "es" ? `Estado del pago: ${pendingTransactionStatus || "sin recibir"}` : `Payment status: ${pendingTransactionStatus || "missing"}`}
                </Text>
                <Text style={[styles.firebaseDebugLine, { color: lastConfirmationError ? "#ff9b9b" : currentTheme.textSecondary }]}>
                  {lang === "zh"
                    ? `最後確認錯誤：${lastConfirmationError || "尚未收到"}`
                    : lang === "es" ? `Último error de confirmación: ${lastConfirmationError || "aún no hay"}` : `Last confirmation error: ${lastConfirmationError || "none yet"}`}
                </Text>
              </View>
            ) : null}

            {hasVipPendingWorkflow && effectiveVipPendingPayment && (
              <View style={styles.vipResetActions}>
                <TouchableOpacity
                  style={[styles.vipResetButton, { borderColor: currentTheme.primary }]}
                  onPress={retryConfirmation}
                >
                  <Text style={[styles.vipResetButtonText, { color: currentTheme.primary }]}>
                    {tr("立即刷新確認", "Refresh Confirmation", "Actualizar confirmación")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {(hasActiveVIP || hasVipPendingWorkflow) && (
              <View style={styles.vipResetActions}>
                <TouchableOpacity
                  style={[styles.vipResetButton, { borderColor: currentTheme.border }]}
                  onPress={async () => {
                    setLocalVipPendingPayment(null);
                    setVipPendingNotice(null);
                    await clearVipPendingFallback();
                    await resetVIP();
                    await resetVipStarterPack();
                    setVipModalMessage(tr("已重置本地 VIP 狀態，可重新測試升級流程。", "Local VIP state reset. You can test the upgrade flow again.", "El estado VIP local se restableció. Ya puedes volver a probar el flujo de mejora."));
                    setVipModalVisible(true);
                  }}
                >
                  <Text style={[styles.vipResetButtonText, { color: currentTheme.text }]}>
                    {tr("重置 VIP 測試", "Reset VIP for Testing", "Restablecer VIP para pruebas")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {(IS_LOCAL_DEV || IS_DEV_FULL_MOCK || Boolean(walletAddress)) && (
          <View style={[styles.vipInfoCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.vipInfoTitle, { color: currentTheme.text }]}>
              {tr("測試工具", "Testing Tools", "Herramientas de prueba")}
            </Text>
            <Text style={[styles.vipInfoLine, { color: currentTheme.textSecondary }]}>
              {lang === "zh"
                ? "把 VIP、任務、starter shapes、starter orb、當前光球與冥想進度一起清成新用戶視角。"
                : lang === "es"
                  ? "Restablece VIP, misiones, formas iniciales, la esfera inicial, la esfera actual y el progreso de meditación para volver a una vista de usuario nuevo."
                  : "Reset VIP, missions, starter shapes, starter orb, current orb, and meditation progress together into a new-user view."}
            </Text>
            <TouchableOpacity
              style={[styles.vipResetButton, styles.vipSandboxResetButton, { borderColor: "#F59E0B" }]}
              onPress={async () => {
                setLocalVipPendingPayment(null);
                setVipPendingNotice(null);
                await clearVipPendingFallback();
                await resetVIP();
                await resetVipStarterPack();
                await resetVipTestingSandbox();
                setVipModalMessage(
                  lang === "zh"
                    ? "已完成 VIP 測試沙盒重置。任務、starter shapes、starter orb、當前光球與冥想進度都已清成新用戶視角。"
                    : lang === "es"
                      ? "El sandbox de pruebas VIP se restableció. Las misiones, formas iniciales, esfera inicial, esfera actual y progreso de meditación volvieron a una vista de usuario nuevo."
                      : "VIP testing sandbox reset complete. Missions, starter shapes, starter orb, current orb, and meditation progress have all been reset to a new-user view."
                );
                setVipModalVisible(true);
              }}
            >
              <Text style={[styles.vipResetButtonText, { color: currentTheme.text }]}>
                {tr("VIP 測試沙盒重置", "VIP Sandbox Reset", "Restablecer sandbox VIP")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.vipResetButton, { borderColor: "#22C55E", marginTop: 12 }]}
              onPress={handleGrantTestResonance}
              disabled={grantingTestResonance}
            >
              <Text style={[styles.vipResetButtonText, { color: "#22C55E" }]}>
                {grantingTestResonance
                  ? tr("加值中...", "Adding...", "Añadiendo...")
                  : tr("測試加 50 Resonance", "Add 50 Resonance for testing", "Añadir 50 de Resonance para probar")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <Text style={themedStyles.sectionTitle}>
            {tr("設定", "Settings", "Ajustes")}
          </Text>
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={themedStyles.settingItem}
                onPress={item.onPress}
                testID={`setting-${item.id}`}
              >
                <View style={themedStyles.settingIcon}>
                  <Icon size={20} color={currentTheme.textSecondary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={themedStyles.settingTitle}>{item.title}</Text>
                  <Text style={themedStyles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRight size={20} color="#D1D5DB" />
              </TouchableOpacity>
            );
          })}
        </View>

        {(IS_LOCAL_DEV || IS_DEV_FULL_MOCK) && (
          <>
        <TouchableOpacity 
          style={[styles.debugToggle, { backgroundColor: currentTheme.card }]}
          onPress={() => setShowDebugInfo(!showDebugInfo)}
        >
          <Database size={18} color={currentTheme.textSecondary} />
          <Text style={[styles.debugToggleText, { color: currentTheme.textSecondary }]}>
            {tr("同步狀態", "Sync Status", "Estado de sincronización")}
          </Text>
          <ChevronRight 
            size={18} 
            color={currentTheme.textSecondary} 
            style={{ transform: [{ rotate: showDebugInfo ? '90deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {showDebugInfo && (
          <View style={[styles.debugContainer, { backgroundColor: currentTheme.card }]}>
            {/* Wallet Status */}
            <View style={styles.debugRow}>
              {walletAddress ? (
                <CheckCircle size={16} color="#10B981" />
              ) : (
                <AlertCircle size={16} color="#F59E0B" />
              )}
              <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                {tr("錢包", "Wallet", "Billetera")}:
              </Text>
              <Text style={[styles.debugValue, { color: walletAddress ? "#10B981" : "#F59E0B" }]}>
                {walletAddress 
                  ? shortenWalletAddress(walletAddress)
                  : tr("未連接", "Not connected", "No conectada")}
              </Text>
            </View>

            {/* Verification Status */}
            <View style={styles.debugRow}>
              {isVerified ? (
                <CheckCircle size={16} color="#10B981" />
              ) : (
                <AlertCircle size={16} color="#F59E0B" />
              )}
              <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                {tr("驗證", "Verified", "Verificado")}:
              </Text>
              <Text style={[styles.debugValue, { color: isVerified ? "#10B981" : "#F59E0B" }]}>
                {isVerified 
                  ? tr("已驗證", "Yes", "Sí") 
                  : tr("未驗證", "No", "No")}
              </Text>
            </View>

            {/* Firebase Status */}
            <View style={styles.debugRow}>
              {isFirebaseEnabled() ? (
                <CheckCircle size={16} color="#10B981" />
              ) : (
                <WifiOff size={16} color="#EF4444" />
              )}
              <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                Firebase:
              </Text>
              <Text style={[styles.debugValue, { color: isFirebaseEnabled() ? "#10B981" : "#EF4444" }]}>
                {isFirebaseEnabled() 
                  ? tr("已啟用", "Enabled", "Activado") 
                  : tr("未啟用", "Disabled", "Desactivado")}
              </Text>
            </View>

            {/* Firebase Auth Status */}
            <View style={styles.debugRow}>
              {isFirebaseAuthReady() && getFirebaseAuthUser() ? (
                <CheckCircle size={16} color="#10B981" />
              ) : isFirebaseAuthReady() ? (
                <AlertCircle size={16} color="#EF4444" />
              ) : (
                <AlertCircle size={16} color="#F59E0B" />
              )}
              <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                {tr("Firebase 認證", "Firebase Auth", "Auth de Firebase")}:
              </Text>
              <Text style={[styles.debugValue, { 
                color: isFirebaseAuthReady() && getFirebaseAuthUser() 
                  ? "#10B981" 
                  : isFirebaseAuthReady() ? "#EF4444" : "#F59E0B" 
              }]}>
                {isFirebaseAuthReady() && getFirebaseAuthUser()
                  ? tr("已認證", "Authenticated", "Autenticado")
                  : isFirebaseAuthReady()
                    ? tr("認證失敗", "Auth Failed", "La autenticación falló")
                    : tr("等待中...", "Waiting...", "Esperando...")}
              </Text>
            </View>

            {/* Cloud Sync Status */}
            <View style={styles.debugRow}>
              {walletAddress && isFirebaseEnabled() ? (
                <Wifi size={16} color="#10B981" />
              ) : (
                <WifiOff size={16} color="#F59E0B" />
              )}
              <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                {tr("雲端同步", "Cloud Sync", "Sincronización en la nube")}:
              </Text>
              <Text style={[styles.debugValue, { color: (walletAddress && isFirebaseEnabled()) ? "#10B981" : "#F59E0B" }]}>
                {walletAddress && isFirebaseEnabled()
                  ? tr("已啟用", "Enabled", "Activado")
                  : tr("未啟用", "Disabled", "Desactivado")}
              </Text>
            </View>

            {/* Local Stats */}
            <View style={styles.debugRow}>
              <Database size={16} color={currentTheme.textSecondary} />
              <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                {tr("本地記錄", "Local Records", "Registros locales")}:
              </Text>
              <Text style={[styles.debugValue, { color: currentTheme.textSecondary }]}>
                {stats.totalSessions} {tr("次冥想", "sessions", "sesiones")}
              </Text>
            </View>

            {/* Firebase Security Health */}
            <View style={styles.debugRow}>
              {firebaseHealthState === "ready" ? (
                <CheckCircle size={16} color="#10B981" />
              ) : firebaseHealthState === "disabled" || firebaseHealthState === "auth-failed" ? (
                <AlertCircle size={16} color="#EF4444" />
              ) : (
                <AlertCircle size={16} color="#F59E0B" />
              )}
              <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                {tr("Firebase 安全健康", "Firebase Security Health", "Estado de seguridad de Firebase")}:
              </Text>
              <Text
                style={[
                  styles.debugValue,
                  {
                    color:
                      firebaseHealthState === "ready"
                        ? "#10B981"
                        : firebaseHealthState === "disabled" || firebaseHealthState === "auth-failed"
                          ? "#EF4444"
                          : "#F59E0B",
                  },
                ]}
              >
                {firebaseHealthState === "ready"
                  ? tr("規則已收緊，身份綁定可用", "Rules hardened, identity binding ready", "Reglas endurecidas; la vinculación de identidad está lista")
                  : firebaseHealthState === "disabled"
                    ? tr("Firebase 未啟用", "Firebase disabled", "Firebase desactivado")
                    : firebaseHealthState === "auth-failed"
                      ? tr("Firebase 認證失敗", "Firebase auth failed", "La autenticación de Firebase falló")
                      : firebaseHealthState === "identity-missing"
                        ? tr("等待錢包或用戶名綁定", "Waiting for wallet or username binding", "Esperando la vinculación de billetera o usuario")
                        : tr("等待 Firebase 初始化", "Waiting for Firebase init", "Esperando la inicialización de Firebase")}
              </Text>
            </View>

            {/* Firebase Routing */}
            <View style={styles.debugRow}>
              <Database size={16} color={currentTheme.textSecondary} />
              <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                {tr("送禮路由", "Gift Routing", "Ruta de regalos")}:
              </Text>
              <Text style={[styles.debugValue, { color: currentTheme.textSecondary, flex: 1 }]} numberOfLines={2}>
                {firebaseBindingPreview.prefersUsernameRouting
                  ? (lang === "zh"
                      ? `優先 @${firebaseBindingPreview.username}，回退 ${firebaseBindingPreview.walletGiftId ?? "wallet"}`
                      : lang === "es"
                        ? `Prioriza @${firebaseBindingPreview.username}, respaldo ${firebaseBindingPreview.walletGiftId ?? "wallet"}`
                        : `Prefer @${firebaseBindingPreview.username}, fallback ${firebaseBindingPreview.walletGiftId ?? "wallet"}`)
                  : (firebaseBindingPreview.walletGiftId
                      ? (lang === "zh"
                          ? `僅錢包路由 ${firebaseBindingPreview.walletGiftId}`
                          : lang === "es"
                            ? `Ruta solo por billetera ${firebaseBindingPreview.walletGiftId}`
                            : `Wallet-only route ${firebaseBindingPreview.walletGiftId}`)
                      : tr("尚未建立可用收件路由", "No recipient route yet", "Aún no hay una ruta de destinatario"))}
              </Text>
            </View>

            {/* Firebase Diagnostics */}
            {(() => {
              const diag = firebaseDiag;
              if (!diag.projectId && !diag.databaseURL) return null;
              return (
                <>
                  <View style={styles.debugRow}>
                    <Database size={16} color={currentTheme.textSecondary} />
                    <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                      Firebase Project:
                    </Text>
                    <Text style={[styles.debugValue, { color: currentTheme.textSecondary, flex: 1 }]} numberOfLines={1}>
                      {diag.projectId ?? "unknown"}
                    </Text>
                  </View>
                  <View style={styles.debugRow}>
                    <Database size={16} color={currentTheme.textSecondary} />
                    <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                      Firebase DB:
                    </Text>
                    <Text style={[styles.debugValue, { color: currentTheme.textSecondary, flex: 1 }]} numberOfLines={1}>
                      {diag.databaseURL ?? "unknown"}
                    </Text>
                  </View>
                </>
              );
            })()}

            <View style={styles.debugRow}>
              <Database size={16} color={currentTheme.textSecondary} />
              <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                {tr("綁定鍵", "Binding Keys", "Claves de vinculación")}:
              </Text>
              <Text style={[styles.debugValue, { color: currentTheme.textSecondary, flex: 1 }]} numberOfLines={3}>
                {[
                  firebaseBindingPreview.walletGiftId ? `wallet:${firebaseBindingPreview.walletGiftId}` : null,
                  firebaseBindingPreview.usernameGiftId ? `username:${firebaseBindingPreview.usernameGiftId}` : null,
                  firebaseBindingPreview.walletMeditationId ? `meditation:${firebaseBindingPreview.walletMeditationId}` : null,
                ].filter(Boolean).join(" · ") || tr("尚未建立", "Not created yet", "Aún no creadas")}
              </Text>
            </View>

            {(() => {
              const err = firebaseDiag.lastAuthError;
              if (!err?.code && !err?.message) return null;
              return (
                <View style={styles.debugRow}>
                  <AlertCircle size={16} color="#F59E0B" />
                  <Text style={[styles.debugLabel, { color: currentTheme.text }]}>Auth Error:</Text>
                  <Text
                    style={[
                      styles.debugValue,
                      { color: "#F59E0B", flex: 1 },
                    ]}
                    numberOfLines={2}
                  >
                    {(err.code ?? "unknown") + ": " + (err.message ?? "")}
                  </Text>
                </View>
              );
            })()}

            {(() => {
              const err = firebaseDiag.lastWriteError;
              if (!err?.code && !err?.message) return null;
              return (
                <View style={styles.debugRow}>
                  <AlertCircle size={16} color="#F59E0B" />
                  <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                    {tr("寫入錯誤", "Write Error", "Error de escritura")}:
                  </Text>
                  <Text
                    style={[
                      styles.debugValue,
                      { color: "#F59E0B", flex: 1 },
                    ]}
                    numberOfLines={2}
                  >
                    {(err.code ?? "unknown") + ": " + (err.message ?? "")}
                  </Text>
                </View>
              );
            })()}

            {/* Firebase Test */}
            <TouchableOpacity
              disabled={firebaseTestRunning}
              onPress={async () => {
                if (firebaseTestRunning) return;

                if (!walletAddress) {
                  setVipModalMessage(tr("需要先有錢包地址才能測試", "Wallet address required to test", "Hace falta una dirección de billetera para probar"));
                  setVipModalVisible(true);
                  return;
                }

                setFirebaseTestRunning(true);
                try {
                  const res = await firebaseDebugPing({ walletAddress });
                  setVipModalMessage(
                    lang === "zh"
                      ? `雲端寫入測試成功\npath: ${res.path}\nkey: ${res.key}\n模式: debug/${getFirebaseAuthUser()?.uid ?? "uid"}`
                      : lang === "es"
                        ? `Escritura en la nube correcta\npath: ${res.path}\nkey: ${res.key}\nmodo: debug/${getFirebaseAuthUser()?.uid ?? "uid"}`
                        : `Cloud write OK\npath: ${res.path}\nkey: ${res.key}\nmode: debug/${getFirebaseAuthUser()?.uid ?? "uid"}`
                  );
                  setVipModalVisible(true);
                } catch (e: any) {
                  const msg = typeof e?.message === "string" ? e.message : "Test failed";
                  setVipModalMessage(
                    lang === "zh" ? `雲端寫入測試失敗\n${msg}` : lang === "es" ? `La escritura en la nube falló\n${msg}` : `Cloud write failed\n${msg}`
                  );
                  setVipModalVisible(true);
                } finally {
                  setFirebaseTestRunning(false);
                }
              }}
              style={[
                styles.firebaseTestButton,
                { backgroundColor: currentTheme.surface, opacity: firebaseTestRunning ? 0.6 : 1 },
              ]}
              testID="firebase-test-write"
            >
              <Database size={16} color={currentTheme.textSecondary} />
              <Text style={[styles.firebaseTestText, { color: currentTheme.textSecondary }]}>
                {firebaseTestRunning
                  ? tr("測試中…", "Testing…", "Probando…")
                  : tr("測試雲端寫入", "Test cloud write", "Probar escritura en la nube")}
              </Text>
            </TouchableOpacity>

            {/* Warning if not syncing */}
            {(!walletAddress || !isFirebaseEnabled() || !getFirebaseAuthUser()) && (
              <View style={styles.debugWarning}>
                <AlertCircle size={14} color="#F59E0B" />
                <Text style={styles.debugWarningText}>
                  {!walletAddress 
                    ? (lang === "zh" 
                        ? "請登入 World ID 以啟用雲端同步" 
                        : lang === "es"
                          ? "Inicia sesión con World ID para activar la sincronización en la nube"
                          : "Sign in with World ID to enable cloud sync")
                    : !isFirebaseEnabled()
                      ? (lang === "zh"
                          ? "Firebase 未啟用，無法同步"
                          : lang === "es"
                            ? "Firebase no está activado; la sincronización está desactivada"
                            : "Firebase not enabled, sync disabled")
                      : !getFirebaseAuthUser()
                        ? (lang === "zh"
                            ? "Firebase 認證失敗，請檢查網絡連接"
                            : lang === "es"
                              ? "La autenticación de Firebase falló; revisa la conexión"
                              : "Firebase auth failed, check network")
                        : null}
                </Text>
              </View>
            )}

            {firebaseHealthState === "ready" && (
              <View style={styles.debugWarning}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={[styles.debugWarningText, { color: "#10B981" }]}>
                  {lang === "zh"
                    ? "Realtime Database 已改成預設拒絕，依靠 userBindings、giftHistory 與 debug 路徑做最小授權。"
                    : lang === "es"
                      ? "Realtime Database ahora deniega por defecto y solo abre acceso mínimo a través de userBindings, giftHistory y rutas debug."
                      : "Realtime Database now defaults to deny, with least-privilege access through userBindings, giftHistory, and debug routes."}
                </Text>
              </View>
            )}
          </View>
        )}
          </>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: isDarkMode ? "#7F1D1D" : "#FEE2E2" }]}
          onPress={handleSignOut}
          testID="sign-out-button"
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.signOutText}>
            {tr("登出", "Sign Out", "Cerrar sesión")}
          </Text>
        </TouchableOpacity>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingBottom: 26,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 22,
    borderRadius: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  usernameCard: {
    marginHorizontal: 20,
    marginTop: -6,
    marginBottom: 20,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  usernameCardLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  usernameCardValue: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  usernameCardHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  usernameCopyButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  usernameCopyText: {
    fontSize: 12,
    fontWeight: "800",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  profileEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  editContainer: {
    width: "100%",
    alignItems: "center",
  },
  nameInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  settingsContainer: {
    paddingHorizontal: 20,
  },
  firebaseTestButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
  },
  firebaseTestText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },

  vipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
  },
  vipButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
  },
  vipBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  vipInfoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  vipInfoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  vipInfoLine: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  vipPendingNotice: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: "700",
  },
  vipResetButton: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  vipResetButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  vipResetActions: {
    marginTop: 4,
    gap: 10,
  },
  vipSandboxResetButton: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
  },
  resonanceInfoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  resonanceInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  resonanceInfoLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resonanceInfoBalance: {
    fontSize: 28,
    fontWeight: "900",
  },
  resonanceTodayBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resonanceTodayBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  resonanceClaimButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  resonanceClaimButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },
  resonanceRecentTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  resonanceLedgerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(148, 163, 184, 0.22)",
  },
  resonanceLedgerLabel: {
    fontSize: 13,
    flex: 1,
    marginRight: 12,
  },
  resonanceLedgerAmount: {
    fontSize: 13,
    fontWeight: "800",
  },
  worldIDSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  worldIDContent: {
    flex: 1,
  },
  debugToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  debugToggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  debugContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
  },
  debugRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  debugLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  debugValue: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  debugWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  debugWarningText: {
    fontSize: 12,
    color: "#F59E0B",
    flex: 1,
  },
});
