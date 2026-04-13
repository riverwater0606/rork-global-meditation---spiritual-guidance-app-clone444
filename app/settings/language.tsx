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
import { ArrowLeft, Globe, Check } from "lucide-react-native";
import { useSettings, Language } from "@/providers/SettingsProvider";
import { languageScreenCopy, localize } from "@/lib/i18n";

export default function LanguageScreen() {
  const { settings, updateLanguage, currentTheme } = useSettings();

  const languageOptions = [
    {
      id: "en" as Language,
      title: "English",
      subtitle: localize(settings.language, languageScreenCopy.englishSubtitle),
      flag: "🇺🇸",
    },
    {
      id: "zh" as Language,
      title: "中文",
      subtitle: localize(settings.language, languageScreenCopy.chineseSubtitle),
      flag: "🇭🇰",
    },
    {
      id: "es" as Language,
      title: "Español",
      subtitle: localize(settings.language, languageScreenCopy.spanishSubtitle),
      flag: "🇪🇸",
    },
  ];

  const handleLanguageSelect = async (language: Language) => {
    await updateLanguage(language);
  };

  const getLocalizedText = (key: keyof typeof languageScreenCopy) =>
    localize(settings.language, languageScreenCopy[key]);

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: currentTheme.text,
    },
    sectionSubtitle: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      marginBottom: 24,
    },
    languageOption: {
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
    languageTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: currentTheme.text,
      marginBottom: 4,
    },
    languageSubtitle: {
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
            <Text style={styles.title}>{getLocalizedText('title')}</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color="#8B5CF6" />
            <Text style={themedStyles.sectionTitle}>{getLocalizedText('chooseLanguage')}</Text>
          </View>
          <Text style={themedStyles.sectionSubtitle}>
            {getLocalizedText('subtitle')}
          </Text>

          {languageOptions.map((option) => {
            const isSelected = settings.language === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[themedStyles.languageOption, isSelected && themedStyles.selectedOption]}
                onPress={() => handleLanguageSelect(option.id)}
                testID={`language-${option.id}`}
              >
                <View style={styles.flagContainer}>
                  <Text style={styles.flag}>{option.flag}</Text>
                </View>

                <View style={styles.languageInfo}>
                  <Text style={themedStyles.languageTitle}>{option.title}</Text>
                  <Text style={themedStyles.languageSubtitle}>{option.subtitle}</Text>
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
          <Text style={themedStyles.infoTitle}>{getLocalizedText('languageSupport')}</Text>
          <Text style={themedStyles.infoText}>
            {getLocalizedText('supportText')}
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 24,
  },
  languageOption: {
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
  flagContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  flag: {
    fontSize: 28,
  },
  languageInfo: {
    flex: 1,
  },
  languageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  languageSubtitle: {
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
