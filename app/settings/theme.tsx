import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import { ArrowLeft, Moon, Sun, Smartphone, Check } from "lucide-react-native";
import { useSettings, Theme } from "@/providers/SettingsProvider";

export default function ThemeScreen() {
  const { settings, updateTheme, currentTheme } = useSettings();
  const tr = (zh: string, en: string, es: string) => {
    if (settings.language === "zh") return zh;
    if (settings.language === "es") return es;
    return en;
  };

  const themeOptions = [
    {
      id: "light" as Theme,
      title: tr("淺色模式", "Light Mode", "Modo claro"),
      subtitle: tr("乾淨明亮的介面", "Clean and bright interface", "Interfaz limpia y luminosa"),
      icon: Sun,
      colors: ["#FFFFFF", "#F9FAFB"] as const,
    },
    {
      id: "dark" as Theme,
      title: tr("深色模式", "Dark Mode", "Modo oscuro"),
      subtitle: tr("在低光環境中更舒適", "Easy on the eyes in low light", "Más cómodo para la vista en poca luz"),
      icon: Moon,
      colors: ["#1F2937", "#111827"] as const,
    },
    {
      id: "system" as Theme,
      title: tr("跟隨系統", "System Default", "Predeterminado del sistema"),
      subtitle: tr("配合你的裝置設定", "Matches your device settings", "Coincide con la configuración de tu dispositivo"),
      icon: Smartphone,
      colors: ["#8B5CF6", "#6366F1"] as const,
    },
  ];

  const handleThemeSelect = async (theme: Theme) => {
    await updateTheme(theme);
  };

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: currentTheme.text,
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      marginBottom: 24,
    },
    themeOption: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 2,
      borderColor: "transparent",
    },
    selectedOption: {
      borderColor: "#8B5CF6",
      backgroundColor: currentTheme.surface,
    },
    themeTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: currentTheme.text,
      marginBottom: 4,
    },
    themeSubtitle: {
      fontSize: 14,
      color: currentTheme.textSecondary,
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
  });

  return (
    <View style={themedStyles.container}>
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
            <Text style={styles.title}>{tr("主題", "Theme", "Tema")}</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={themedStyles.sectionTitle}>{tr("選擇你的主題", "Choose Your Theme", "Elige tu tema")}</Text>
          <Text style={themedStyles.sectionSubtitle}>
            {tr("選擇最適合你的外觀風格", "Select the appearance that works best for you", "Elige la apariencia que mejor se adapte a ti")}
          </Text>

          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = settings.theme === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[themedStyles.themeOption, isSelected && themedStyles.selectedOption]}
                onPress={() => handleThemeSelect(option.id)}
                testID={`theme-${option.id}`}
              >
                <LinearGradient
                  colors={option.colors}
                  style={styles.themePreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon size={24} color={option.id === "light" ? "#6B7280" : "#FFFFFF"} />
                </LinearGradient>

                <View style={styles.themeInfo}>
                  <Text style={themedStyles.themeTitle}>{option.title}</Text>
                  <Text style={themedStyles.themeSubtitle}>{option.subtitle}</Text>
                </View>

                {isSelected && (
                  <View style={styles.checkContainer}>
                    <Check size={20} color="#8B5CF6" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={themedStyles.infoCard}>
          <Text style={themedStyles.infoTitle}>{tr("關於主題", "About Themes", "Sobre los temas")}</Text>
          <Text style={themedStyles.infoText}>
            {tr(
              "• 淺色模式提供乾淨明亮的介面，適合日間使用\n• 深色模式可減少低光環境下的眼睛疲勞\n• 跟隨系統會依照裝置設定自動切換",
              "• Light mode provides a clean, bright interface perfect for daytime use\n• Dark mode reduces eye strain in low-light environments\n• System default automatically switches based on your device settings",
              "• El modo claro ofrece una interfaz limpia y luminosa, ideal para el día\n• El modo oscuro reduce la fatiga visual en entornos con poca luz\n• El modo del sistema cambia automáticamente según tu dispositivo"
            )}
          </Text>
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 24,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedOption: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F8FAFC",
  },
  themePreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  themeSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  checkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
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
