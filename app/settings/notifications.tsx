import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import { ArrowLeft, Bell, Clock } from "lucide-react-native";
import { useSettings } from "@/providers/SettingsProvider";
import CustomModal from "@/components/CustomModal";

export default function NotificationsScreen() {
  const {
    settings,
    updateNotificationSettings,
    currentTheme,
    notificationPermissionStatus,
    requestNotificationPermission,
    openNotificationSettings,
  } = useSettings();
  const tr = (zh: string, en: string, es: string) => {
    if (settings.language === "zh") return zh;
    if (settings.language === "es") return es;
    return en;
  };
  const [reminderTime, setReminderTime] = useState(settings.notifications.reminderTime);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', onConfirm: () => {} });
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [permissionActionBusy, setPermissionActionBusy] = useState(false);

  const handleToggle = async (key: keyof typeof settings.notifications, value: boolean) => {
    await updateNotificationSettings({ [key]: value });
  };

  const handleTimeChange = () => {
    if (Platform.OS === "web") {
      const time = prompt(tr("輸入時間（HH:MM 格式）：", "Enter time (HH:MM format):", "Introduce la hora (formato HH:MM):"), reminderTime);
      if (time && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        setReminderTime(time);
        updateNotificationSettings({ reminderTime: time });
      } else if (time) {
        setModalConfig({
          title: tr("時間無效", "Invalid Time", "Hora no válida"),
          message: tr("請輸入 HH:MM 格式，例如 09:30", "Please enter time in HH:MM format (e.g., 09:30)", "Introduce la hora en formato HH:MM, por ejemplo 09:30"),
          onConfirm: () => setModalVisible(false),
        });
        setModalVisible(true);
      }
    } else {
      setShowTimeOptions((prev) => !prev);
    }
  };

  const updateTime = async (time: string) => {
    setReminderTime(time);
    await updateNotificationSettings({ reminderTime: time });
  };

  const permissionMeta = {
    granted: {
      badge: tr("已啟用", "Enabled", "Activadas"),
      title: tr("通知已啟用", "Notifications are enabled", "Las notificaciones están activadas"),
      message: tr("這部裝置可以接收每日提醒。", "Daily reminders can be delivered on this device.", "Este dispositivo puede recibir recordatorios diarios."),
      action: null,
    },
    denied: {
      badge: tr("已封鎖", "Blocked", "Bloqueadas"),
      title: tr("通知已被封鎖", "Notifications are blocked", "Las notificaciones están bloqueadas"),
      message: tr("打開系統設定重新啟用冥想提醒。", "Open system settings to re-enable meditation reminders.", "Abre los ajustes del sistema para volver a activar los recordatorios."),
      action: "settings" as const,
      actionLabel: tr("打開設定", "Open Settings", "Abrir ajustes"),
    },
    undetermined: {
      badge: tr("需要權限", "Needs Access", "Necesita acceso"),
      title: tr("允許這部裝置接收提醒", "Allow reminders on this device", "Permite recordatorios en este dispositivo"),
      message: tr("授權通知後即可接收每日冥想提示。", "Grant notification access to receive daily meditation prompts.", "Concede acceso a notificaciones para recibir recordatorios diarios."),
      action: "request" as const,
      actionLabel: tr("啟用通知", "Enable Notifications", "Activar notificaciones"),
    },
    unknown: {
      badge: tr("需要檢查", "Check Needed", "Revisar"),
      title: tr("無法取得通知狀態", "Notification status unavailable", "Estado de notificaciones no disponible"),
      message: tr("請再試一次授權以完成設定。", "Try requesting access again to finish setup.", "Prueba de nuevo para completar la configuración."),
      action: "request" as const,
      actionLabel: tr("再試一次", "Check Again", "Volver a intentar"),
    },
    unsupported: {
      badge: tr("網頁預覽", "Web Preview", "Vista web"),
      title: tr("網頁版不支援推播提醒", "Push reminders are not available on web", "Los recordatorios push no están disponibles en la web"),
      message: tr("請使用手機 app 接收本地冥想提醒。", "Use the mobile app to receive local meditation reminders.", "Usa la app móvil para recibir recordatorios locales."),
      action: null,
    },
  } as const;

  const currentPermissionMeta = permissionMeta[notificationPermissionStatus] ?? permissionMeta.unknown;

  const handlePermissionAction = async () => {
    if (!currentPermissionMeta.action || permissionActionBusy) return;

    setPermissionActionBusy(true);
    try {
      if (currentPermissionMeta.action === "request") {
        const status = await requestNotificationPermission();
        if (status === "denied") {
          setModalConfig({
            title: tr("需要權限", "Permission Needed", "Se necesita permiso"),
            message: tr("通知仍然被封鎖；如果你想接收冥想提醒，請到系統設定開啟。", "Notifications are still blocked. Open system settings if you want meditation reminders.", "Las notificaciones siguen bloqueadas. Abre los ajustes del sistema si quieres recordatorios."),
            onConfirm: () => setModalVisible(false),
          });
          setModalVisible(true);
        }
      } else if (currentPermissionMeta.action === "settings") {
        await openNotificationSettings();
      }
    } finally {
      setPermissionActionBusy(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.text,
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
    timeSelector: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      marginLeft: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    timeTitle: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    timeValue: {
      fontSize: 16,
      fontWeight: "600",
      color: currentTheme.text,
      marginTop: 2,
    },
    infoCard: {
      backgroundColor: currentTheme.surface,
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: "#8B5CF6",
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: currentTheme.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      lineHeight: 20,
    },
    permissionCard: {
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: "rgba(139, 92, 246, 0.22)",
    },
    permissionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      gap: 12,
    },
    permissionTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      color: currentTheme.text,
    },
    permissionMessage: {
      fontSize: 14,
      lineHeight: 20,
      color: currentTheme.textSecondary,
    },
    permissionBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "rgba(139, 92, 246, 0.18)",
    },
    permissionBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: currentTheme.primary,
    },
    permissionButton: {
      marginTop: 14,
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: currentTheme.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    permissionButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
  });

  return (
    <View style={themedStyles.container}>
      <CustomModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={tr("知道了", "OK", "OK")}
        onConfirm={modalConfig.onConfirm}
      />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <LinearGradient
        colors={["#8B5CF6", "#6366F1"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              testID="back-button"
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>{tr("通知", "Notifications", "Notificaciones")}</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={themedStyles.permissionCard}>
            <View style={themedStyles.permissionHeader}>
              <Text style={themedStyles.permissionTitle}>{currentPermissionMeta.title}</Text>
              <View style={themedStyles.permissionBadge}>
                <Text style={themedStyles.permissionBadgeText}>{currentPermissionMeta.badge}</Text>
              </View>
            </View>
            <Text style={themedStyles.permissionMessage}>{currentPermissionMeta.message}</Text>
            {currentPermissionMeta.action && (
              <TouchableOpacity
                style={themedStyles.permissionButton}
                onPress={handlePermissionAction}
                disabled={permissionActionBusy}
                testID="notification-permission-button"
              >
                {permissionActionBusy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : null}
                <Text style={themedStyles.permissionButtonText}>
                  {currentPermissionMeta.actionLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Bell size={20} color="#8B5CF6" />
            <Text style={themedStyles.sectionTitle}>{tr("冥想提醒", "Meditation Reminders", "Recordatorios de meditación")}</Text>
          </View>

          <View style={themedStyles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={themedStyles.settingTitle}>{tr("每日提醒", "Daily Reminder", "Recordatorio diario")}</Text>
              <Text style={themedStyles.settingSubtitle}>
                {tr("每天提醒你進行冥想", "Get reminded to meditate every day", "Recibe un recordatorio diario para meditar")}
              </Text>
            </View>
            <Switch
              value={settings.notifications.dailyReminder}
              onValueChange={(value) => handleToggle("dailyReminder", value)}
              trackColor={{ false: "#E5E7EB", true: "#8B5CF6" }}
              thumbColor="#FFFFFF"
              testID="daily-reminder-switch"
            />
          </View>

          {settings.notifications.dailyReminder && (
            <View>
              <TouchableOpacity
                style={themedStyles.timeSelector}
                onPress={handleTimeChange}
                testID="time-selector"
              >
                <Clock size={20} color={currentTheme.textSecondary} />
                <View style={styles.timeInfo}>
                  <Text style={themedStyles.timeTitle}>{tr("提醒時間", "Reminder Time", "Hora del recordatorio")}</Text>
                  <Text style={themedStyles.timeValue}>{formatTime(reminderTime)}</Text>
                </View>
              </TouchableOpacity>
              {showTimeOptions && (
                <View style={{ marginTop: 12, marginLeft: 16 }}>
                  <TouchableOpacity
                    style={[themedStyles.settingItem, { marginBottom: 8 }]}
                    onPress={() => { updateTime("09:00"); setShowTimeOptions(false); }}
                  >
                    <Text style={themedStyles.settingTitle}>9:00 AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[themedStyles.settingItem, { marginBottom: 8 }]}
                    onPress={() => { updateTime("12:00"); setShowTimeOptions(false); }}
                  >
                    <Text style={themedStyles.settingTitle}>12:00 PM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[themedStyles.settingItem, { marginBottom: 8 }]}
                    onPress={() => { updateTime("18:00"); setShowTimeOptions(false); }}
                  >
                    <Text style={themedStyles.settingTitle}>6:00 PM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[themedStyles.settingItem, { marginBottom: 8 }]}
                    onPress={() => { updateTime("21:00"); setShowTimeOptions(false); }}
                  >
                    <Text style={themedStyles.settingTitle}>9:00 PM</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={themedStyles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={themedStyles.settingTitle}>{tr("冥想內提醒", "Session Reminders", "Recordatorios durante la sesión")}</Text>
              <Text style={themedStyles.settingSubtitle}>
                {tr("在冥想過程中給你溫和提示", "Gentle reminders during meditation sessions", "Recordatorios suaves durante la sesión de meditación")}
              </Text>
            </View>
            <Switch
              value={settings.notifications.sessionReminder}
              onValueChange={(value) => handleToggle("sessionReminder", value)}
              trackColor={{ false: "#E5E7EB", true: "#8B5CF6" }}
              thumbColor="#FFFFFF"
              testID="session-reminder-switch"
            />
          </View>

          <View style={themedStyles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={themedStyles.settingTitle}>{tr("進度更新", "Progress Updates", "Actualizaciones de progreso")}</Text>
              <Text style={themedStyles.settingSubtitle}>
                {tr("每週進度與成就通知", "Weekly progress and achievement notifications", "Notificaciones semanales de progreso y logros")}
              </Text>
            </View>
            <Switch
              value={settings.notifications.progressUpdates}
              onValueChange={(value) => handleToggle("progressUpdates", value)}
              trackColor={{ false: "#E5E7EB", true: "#8B5CF6" }}
              thumbColor="#FFFFFF"
              testID="progress-updates-switch"
            />
          </View>
        </View>

        {Platform.OS !== "web" && (
          <View style={themedStyles.infoCard}>
            <Text style={themedStyles.infoTitle}>{tr("關於通知", "About Notifications", "Sobre las notificaciones")}</Text>
            <Text style={themedStyles.infoText}>
              {tr(
                "通知可以幫助你維持穩定的冥想習慣。你可以自訂提醒的時間與方式，找到最適合自己的節奏。",
                "Notifications help you maintain a consistent meditation practice. You can customize when and how you receive reminders to find what works best for you.",
                "Las notificaciones te ayudan a mantener una práctica constante. Puedes personalizar cuándo y cómo recibir recordatorios."
              )}
            </Text>
          </View>
        )}

        <View style={styles.spacer} />
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
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
  settingInfo: {
    flex: 1,
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
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginLeft: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  timeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  timeTitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: "#EEF2FF",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  spacer: {
    height: 40,
  },
});
