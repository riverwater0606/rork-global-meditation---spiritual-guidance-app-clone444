import { Tabs } from "expo-router";
import { Home, Activity, User, Sparkles, MessageCircle, Sprout } from "lucide-react-native";
import React from "react";
import { useSettings } from "@/providers/SettingsProvider";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

export default function TabLayout() {
  const { settings } = useSettings();
  const lang = settings.language;

  const translations = {
    home: { en: "Home", zh: "首頁" },
    meditate: { en: "Meditate", zh: "冥想" },
    progress: { en: "Progress", zh: "進度" },
    profile: { en: "Profile", zh: "個人資料" },
    assistant: { en: "AI Assistant", zh: "AI助手" },
    garden: { en: "Garden", zh: "光球花園" },
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#a78bfa",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: Platform.OS === 'web' ? 'rgba(15,15,26,0.95)' : 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute',
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: "#a78bfa",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        tabBarBackground: () => Platform.OS !== 'web' ? (
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
        ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: translations.home[lang],
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meditate"
        options={{
          title: translations.meditate[lang],
          tabBarIcon: ({ color }) => <Sparkles size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: translations.garden[lang],
          tabBarIcon: ({ color }) => <Sprout size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: translations.progress[lang],
          tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: translations.assistant[lang],
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: translations.profile[lang],
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}