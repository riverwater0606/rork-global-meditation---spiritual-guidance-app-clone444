import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import { ArrowLeft, Download, Copy } from "lucide-react-native";
import { useSettings } from "@/providers/SettingsProvider";

const EXPORT_DRAFT_STORAGE_KEY = "privacyExportDraft";

export default function ExportPreviewScreen() {
  const { settings, currentTheme } = useSettings();
  const tr = (zh: string, en: string, es: string) => {
    if (settings.language === "zh") return zh;
    if (settings.language === "es") return es;
    return en;
  };

  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await AsyncStorage.getItem(EXPORT_DRAFT_STORAGE_KEY);
      if (!raw || cancelled) return;
      try {
        const parsed = JSON.parse(raw) as { filename?: string; content?: string };
        if (!cancelled) {
          setFilename(parsed.filename || "psig-export.json");
          setContent(parsed.content || "");
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownload = () => {
    if (Platform.OS !== "web" || !content) return;
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "psig-export.json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!content) return;
    if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={["#8B5CF6", "#6366F1"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>{tr("匯出預覽", "Export Preview", "Vista previa de exportación")}</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={[styles.filename, { color: currentTheme.text }]}>
          {filename || tr("尚未準備匯出檔案", "No export file ready yet", "Aún no hay archivo listo")}
        </Text>
        <Text style={[styles.helper, { color: currentTheme.textSecondary }]}>
          {tr(
            "如果 World 內建 webview 沒有自動下載，請在這裡再按一次下載，或先複製資料保底。",
            "If the in-app webview did not download automatically, use the buttons below to retry the download or copy the export first.",
            "Si el webview integrado no descargó el archivo automáticamente, usa los botones de abajo para reintentar la descarga o copiar los datos."
          )}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, { borderColor: currentTheme.primary }]} onPress={handleDownload}>
            <Download size={16} color={currentTheme.primary} />
            <Text style={[styles.actionText, { color: currentTheme.primary }]}>
              {tr("再試下載", "Download Again", "Descargar otra vez")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { borderColor: currentTheme.primary }]} onPress={handleCopy}>
            <Copy size={16} color={currentTheme.primary} />
            <Text style={[styles.actionText, { color: currentTheme.primary }]}>
              {tr("複製 JSON", "Copy JSON", "Copiar JSON")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={[styles.previewCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
          <Text style={[styles.previewText, { color: currentTheme.text }]}>
            {content || tr("目前沒有匯出內容。", "There is no export content yet.", "Aún no hay contenido para exportar.")}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 24,
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
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  filename: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  helper: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "800",
  },
  previewCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
