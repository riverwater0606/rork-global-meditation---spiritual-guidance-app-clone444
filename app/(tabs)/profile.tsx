import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import { router } from "expo-router";
import { ensureMiniKitLoaded, getMiniKit } from "@/components/worldcoin/IDKitWeb";
import CustomModal from "@/components/CustomModal";



export default function ProfileScreen() {
  const { profile, updateProfile, logout, isVIP, unlockVIP, walletAddress, isVerified } = useUser();
  const { settings, currentTheme, isDarkMode } = useSettings();
  const { stats } = useMeditation();
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [vipModalVisible, setVipModalVisible] = useState(false);
  const [vipModalMessage, setVipModalMessage] = useState("");
  const [firebaseTestRunning, setFirebaseTestRunning] = useState<boolean>(false);
  const lang = settings.language;


  const handleSave = () => {
    updateProfile({ name });
    setIsEditing(false);
  };

  const handleSignOut = () => {
    setLogoutModalVisible(true);
  };

  const confirmSignOut = async () => {
    try {
      console.log("[ProfileScreen] Logging out...");
      await logout();
      console.log("[ProfileScreen] Logout successful, redirecting...");
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
      default: return "English";
    }
  };

  const translations = {
    notifications: { en: "Notifications", zh: "通知" },
    theme: { en: "Theme", zh: "主題" },
    language: { en: "Language", zh: "語言" },
    privacy: { en: "Privacy & Security", zh: "隱私與安全" },
    remindersEnabled: { en: "Reminders enabled", zh: "提醒已啟用" },
    remindersDisabled: { en: "Reminders disabled", zh: "提醒已停用" },
    manageData: { en: "Manage your data", zh: "管理您的數據" },
  };

  const settingsItems = [
    { 
      id: "notifications", 
      icon: Bell, 
      title: translations.notifications[lang], 
      subtitle: settings.notifications.dailyReminder 
        ? translations.remindersEnabled[lang] 
        : translations.remindersDisabled[lang],
      onPress: () => router.push("/settings/notifications")
    },
    { 
      id: "theme", 
      icon: Moon, 
      title: translations.theme[lang], 
      subtitle: getThemeSubtitle(),
      onPress: () => router.push("/settings/theme")
    },
    { 
      id: "language", 
      icon: Globe, 
      title: translations.language[lang], 
      subtitle: getLanguageSubtitle(),
      onPress: () => router.push("/settings/language")
    },
    { 
      id: "privacy", 
      icon: Shield, 
      title: translations.privacy[lang], 
      subtitle: translations.manageData[lang],
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
        title={lang === "zh" ? "登出" : "Sign Out"}
        message={lang === "zh" ? "您確定要登出嗎？" : "Are you sure you want to sign out?"}
        cancelText={lang === "zh" ? "取消" : "Cancel"}
        confirmText={lang === "zh" ? "登出" : "Sign Out"}
        onConfirm={confirmSignOut}
        confirmDestructive
      />
      <CustomModal
        isVisible={vipModalVisible}
        onClose={() => setVipModalVisible(false)}
        title={lang === "zh" ? "成功" : "Success"}
        message={vipModalMessage}
        confirmText="OK"
        onConfirm={() => setVipModalVisible(false)}
      />
      <LinearGradient
        colors={currentTheme.gradient as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <Text style={styles.title}>
            {lang === "zh" ? "個人資料" : "Profile"}
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
                placeholder={lang === "zh" ? "輸入您的名稱" : "Enter your name"}
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
                    {lang === "zh" ? "取消" : "Cancel"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>
                    {lang === "zh" ? "儲存" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={themedStyles.profileName}>
                  {profile.name || (lang === "zh" ? "靈性探索者" : "Spiritual Seeker")}
                </Text>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Edit2 size={18} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
              <Text style={themedStyles.profileEmail}>
                {lang === "zh" ? `成員自 ${new Date().getFullYear()}` : `Member since ${new Date().getFullYear()}`}
              </Text>
            </View>
          )}
        </View>

        {!isVIP && (
          <TouchableOpacity
            style={[styles.vipButton, { backgroundColor: currentTheme.primary }]}
            onPress={async () => {
              try {
                await Promise.race([
                  ensureMiniKitLoaded(),
                  new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
                ]);

                const mk = getMiniKit();
                if (!mk?.isInstalled?.()) {
                  return;
                }

                const sendPayload = {
                  address: "0xf683cbce6d42918907df66040015fcbdad411d9d",
                  amount: 9.99,
                  description: "PSI-G VIP Membership"
                };

                console.log("[VIP] Sending payment", sendPayload);

                const result = await mk.commands.sendPayment(sendPayload);

                if (result?.status === "success") {
                  console.log("[VIP] Payment success", result);
                  await unlockVIP();
                  setVipModalMessage(lang === "zh" ? "您已成功升級為 VIP！" : "You are now a VIP member!");
                  setVipModalVisible(true);
                } else {
                  console.log("[VIP] Payment cancelled or failed", result);
                }
              } catch (error) {
                console.error("[VIP] Payment error", error);
                const currentMk = getMiniKit();
                if (!currentMk?.isInstalled?.()) {
                  setVipModalMessage(lang === "zh" ? "請在 World App 中打開" : "Please open in World App");
                  setVipModalVisible(true);
                }
              }
            }}
            testID="vip-upgrade-button"
          >
            <Crown size={20} color="#FFFFFF" />
            <Text style={styles.vipButtonText}>
              {lang === "zh" ? "升級 VIP · 9.99 WLD" : "Go VIP · 9.99 WLD"}
            </Text>
          </TouchableOpacity>
        )}

        {isVIP && (
          <View style={[styles.vipBadge, { backgroundColor: currentTheme.primary }]}>
            <Crown size={20} color="#FFFFFF" />
            <Text style={styles.vipBadgeText}>
              {lang === "zh" ? "VIP 會員" : "VIP Member"}
            </Text>
          </View>
        )}

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <Text style={themedStyles.sectionTitle}>
            {lang === "zh" ? "設定" : "Settings"}
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

        {/* Debug Info Section */}
        <TouchableOpacity 
          style={[styles.debugToggle, { backgroundColor: currentTheme.card }]}
          onPress={() => setShowDebugInfo(!showDebugInfo)}
        >
          <Database size={18} color={currentTheme.textSecondary} />
          <Text style={[styles.debugToggleText, { color: currentTheme.textSecondary }]}>
            {lang === "zh" ? "同步狀態" : "Sync Status"}
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
                {lang === "zh" ? "錢包" : "Wallet"}:
              </Text>
              <Text style={[styles.debugValue, { color: walletAddress ? "#10B981" : "#F59E0B" }]}>
                {walletAddress 
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
                  : (lang === "zh" ? "未連接" : "Not connected")}
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
                {lang === "zh" ? "驗證" : "Verified"}:
              </Text>
              <Text style={[styles.debugValue, { color: isVerified ? "#10B981" : "#F59E0B" }]}>
                {isVerified 
                  ? (lang === "zh" ? "已驗證" : "Yes") 
                  : (lang === "zh" ? "未驗證" : "No")}
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
                  ? (lang === "zh" ? "已啟用" : "Enabled") 
                  : (lang === "zh" ? "未啟用" : "Disabled")}
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
                {lang === "zh" ? "Firebase 認證" : "Firebase Auth"}:
              </Text>
              <Text style={[styles.debugValue, { 
                color: isFirebaseAuthReady() && getFirebaseAuthUser() 
                  ? "#10B981" 
                  : isFirebaseAuthReady() ? "#EF4444" : "#F59E0B" 
              }]}>
                {isFirebaseAuthReady() && getFirebaseAuthUser()
                  ? (lang === "zh" ? "已認證" : "Authenticated")
                  : isFirebaseAuthReady()
                    ? (lang === "zh" ? "認證失敗" : "Auth Failed")
                    : (lang === "zh" ? "等待中..." : "Waiting...")}
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
                {lang === "zh" ? "雲端同步" : "Cloud Sync"}:
              </Text>
              <Text style={[styles.debugValue, { color: (walletAddress && isFirebaseEnabled()) ? "#10B981" : "#F59E0B" }]}>
                {walletAddress && isFirebaseEnabled()
                  ? (lang === "zh" ? "已啟用" : "Enabled")
                  : (lang === "zh" ? "未啟用" : "Disabled")}
              </Text>
            </View>

            {/* Local Stats */}
            <View style={styles.debugRow}>
              <Database size={16} color={currentTheme.textSecondary} />
              <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                {lang === "zh" ? "本地記錄" : "Local Records"}:
              </Text>
              <Text style={[styles.debugValue, { color: currentTheme.textSecondary }]}>
                {stats.totalSessions} {lang === "zh" ? "次冥想" : "sessions"}
              </Text>
            </View>

            {/* Firebase Diagnostics */}
            {(() => {
              const diag = getFirebaseDiagnostics();
              const err = diag.lastAuthError;
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
              const diag = getFirebaseDiagnostics();
              const err = diag.lastWriteError;
              if (!err?.code && !err?.message) return null;
              return (
                <View style={styles.debugRow}>
                  <AlertCircle size={16} color="#F59E0B" />
                  <Text style={[styles.debugLabel, { color: currentTheme.text }]}>
                    {lang === "zh" ? "寫入錯誤" : "Write Error"}:
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
                  setVipModalMessage(lang === "zh" ? "需要先有錢包地址才能測試" : "Wallet address required to test");
                  setVipModalVisible(true);
                  return;
                }

                setFirebaseTestRunning(true);
                try {
                  const res = await firebaseDebugPing({ walletAddress });
                  setVipModalMessage(
                    lang === "zh"
                      ? `雲端寫入測試成功\npath: ${res.path}\nkey: ${res.key}`
                      : `Cloud write OK\npath: ${res.path}\nkey: ${res.key}`
                  );
                  setVipModalVisible(true);
                } catch (e: any) {
                  const msg = typeof e?.message === "string" ? e.message : "Test failed";
                  setVipModalMessage(
                    lang === "zh" ? `雲端寫入測試失敗\n${msg}` : `Cloud write failed\n${msg}`
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
                  ? (lang === "zh" ? "測試中…" : "Testing…")
                  : (lang === "zh" ? "測試雲端寫入" : "Test cloud write")}
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
                        : "Sign in with World ID to enable cloud sync")
                    : !isFirebaseEnabled()
                      ? (lang === "zh"
                          ? "Firebase 未啟用，無法同步"
                          : "Firebase not enabled, sync disabled")
                      : !getFirebaseAuthUser()
                        ? (lang === "zh"
                            ? "Firebase 認證失敗，請檢查網絡連接"
                            : "Firebase auth failed, check network")
                        : null}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: isDarkMode ? "#7F1D1D" : "#FEE2E2" }]}
          onPress={handleSignOut}
          testID="sign-out-button"
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.signOutText}>
            {lang === "zh" ? "登出" : "Sign Out"}
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
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
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
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    borderRadius: 12,
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
    borderRadius: 12,
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
    borderRadius: 12,
  },
  vipBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
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
