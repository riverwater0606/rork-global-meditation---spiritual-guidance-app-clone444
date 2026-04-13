import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
} from "react-native";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import { 
  ArrowLeft, 
  Download,
  Trash2,
} from "lucide-react-native";
import { useSettings } from "@/providers/SettingsProvider";
import CustomModal from "@/components/CustomModal";

const EXPORT_DRAFT_STORAGE_KEY = "privacyExportDraft";

export default function PrivacyScreen() {
  const { settings, exportData, clearAllData, currentTheme } = useSettings();
  const tr = (zh: string, en: string, es: string) => {
    if (settings.language === "zh") return zh;
    if (settings.language === "es") return es;
    return en;
  };
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', onConfirm: () => {}, destructive: false });

  const handleExportData = async () => {
    try {
      const data = await exportData();
      const filename = `psig-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

      await AsyncStorage.setItem(
        EXPORT_DRAFT_STORAGE_KEY,
        JSON.stringify({ filename, content: data })
      );

      if (Platform.OS === "web") {
        const blob = new Blob([data], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        router.push("/settings/export-preview");
      } else if (FileSystem.documentDirectory) {
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, data, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        try {
          await Share.share({
            url: fileUri,
            message: tr(
              "PSI-G 資料匯出已準備好。",
              "Your PSI-G export is ready.",
              "Tu exportación de PSI-G está lista."
            ),
            title: filename,
          });
        } catch {
          // Fall through to success modal with file location guidance.
        }

        router.push("/settings/export-preview");
      }

      setModalConfig({
        title: tr("資料匯出", "Data Export", "Exportación de datos"),
        message: Platform.OS === "web"
          ? tr(
              `匯出檔案 ${filename} 已開始下載。`,
              `The export file ${filename} should now be downloading.`,
              `El archivo ${filename} debería estar descargándose ahora.`
            )
          : tr(
              `匯出檔案 ${filename} 已準備好，已嘗試打開分享/儲存流程。`,
              `The export file ${filename} is ready and the share/save flow has been opened.`,
              `El archivo ${filename} está listo y se abrió el flujo para compartir o guardar.`
            ),
        onConfirm: () => setModalVisible(false),
        destructive: false,
      });
      setModalVisible(true);
    } catch {
      setModalConfig({
        title: tr("錯誤", "Error", "Error"),
        message: tr("匯出資料失敗，請再試一次。", "Failed to export data. Please try again.", "No se pudo exportar la información. Inténtalo de nuevo."),
        onConfirm: () => setModalVisible(false),
        destructive: false,
      });
      setModalVisible(true);
    }
  };

  const handleClearData = () => {
    setModalConfig({
      title: tr("清除所有資料", "Clear All Data", "Borrar todos los datos"),
      message: tr("這會清除這部裝置上的資料，並刪除已接上的雲端狀態快照（課程、光球、能量、VIP 等）。已送出的禮物與既有歷史記錄不一定全部一併移除。", "This clears data on this device and deletes connected cloud state snapshots such as courses, orb state, resonance, and VIP. Delivered gifts and historical records may not all be removed.", "Esto borra los datos de este dispositivo y elimina los estados conectados en la nube, como cursos, esfera, Resonance y VIP. Los regalos ya enviados y ciertos historiales pueden no eliminarse por completo."),
      onConfirm: async () => {
        try {
          await clearAllData();
          setModalVisible(false);
          setModalConfig({
            title: tr("完成", "Success", "Éxito"),
            message: tr("本機資料與可用的雲端狀態快照已清除。", "Local data and available cloud state snapshots were cleared.", "Se borraron los datos locales y los estados disponibles en la nube."),
            onConfirm: () => setModalVisible(false),
            destructive: false,
          });
          setModalVisible(true);
        } catch {
          setModalVisible(false);
          setModalConfig({
            title: tr("錯誤", "Error", "Error"),
            message: tr("清除資料失敗，請再試一次。", "Failed to clear data. Please try again.", "No se pudieron borrar los datos. Inténtalo de nuevo."),
            onConfirm: () => setModalVisible(false),
            destructive: false,
          });
          setModalVisible(true);
        }
      },
      destructive: true,
    });
    setModalVisible(true);
  };

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    actionItem: {
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
    actionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: currentTheme.text,
    },
    actionSubtitle: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.text,
    },
  });

  return (
    <View style={themedStyles.container}>
      <CustomModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        cancelText={tr("取消", "Cancel", "Cancelar")}
        confirmText={modalConfig.destructive ? tr("全部刪除", "Delete All", "Borrar todo") : tr("知道了", "OK", "OK")}
        onConfirm={modalConfig.onConfirm}
        confirmDestructive={modalConfig.destructive}
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
            <Text style={styles.title}>{tr("私隱與安全", "Privacy & Security", "Privacidad y seguridad")}</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={themedStyles.sectionTitle}>{tr("資料管理", "Data Management", "Gestión de datos")}</Text>

          <TouchableOpacity
            style={themedStyles.actionItem}
            onPress={handleExportData}
            testID="export-data-button"
          >
            <View style={styles.actionIcon}>
              <Download size={20} color="#059669" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={themedStyles.actionTitle}>{tr("匯出我的資料", "Export My Data", "Exportar mis datos")}</Text>
              <Text style={themedStyles.actionSubtitle}>
                {tr("下載你所有資料的副本", "Download a copy of all your data", "Descarga una copia de todos tus datos")}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={themedStyles.actionItem}
            onPress={handleClearData}
            testID="clear-data-button"
          >
            <View style={[styles.actionIcon, styles.dangerIcon]}>
              <Trash2 size={20} color="#DC2626" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[themedStyles.actionTitle, styles.dangerText]}>
                {tr("清除所有資料", "Clear All Data", "Borrar todos los datos")}
              </Text>
              <Text style={themedStyles.actionSubtitle}>
                {tr("永久刪除你的所有資料", "Permanently delete all your data", "Elimina permanentemente todos tus datos")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

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
  actionItem: {
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
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: "#FEF2F2",
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  dangerText: {
    color: "#DC2626",
  },
  actionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
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
