import { Tabs } from "expo-router";
import { Home, Activity, User, Sparkles, MessageCircle, Sprout } from "lucide-react-native";
import React from "react";
import { useSettings } from "@/providers/SettingsProvider";
import { localize, tabsCopy } from "@/lib/i18n";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";

const WEB_TAB_GUARD_STYLE =
  Platform.OS === "web"
    ? ({
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      } as any)
    : null;

function NoPreviewTabBarButton(props: any) {
  const {
    href: _href,
    target: _target,
    rel: _rel,
    download: _download,
    onLongPress,
    onContextMenu,
    style,
    children,
    ...touchableProps
  } = props;

  return (
    <TouchableOpacity
      {...touchableProps}
      activeOpacity={1}
      delayLongPress={1000000}
      onLongPress={(event: any) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        onLongPress?.(event);
      }}
      onContextMenu={(event: any) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        onContextMenu?.(event);
      }}
      style={[style, WEB_TAB_GUARD_STYLE]}
    >
      {children}
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { settings } = useSettings();
  const lang = settings.language;

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
        tabBarButton: (props) => <NoPreviewTabBarButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: localize(lang, tabsCopy.home),
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meditate"
        options={{
          title: localize(lang, tabsCopy.meditate),
          tabBarIcon: ({ color }) => <Sparkles size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: localize(lang, tabsCopy.garden),
          tabBarIcon: ({ color }) => <Sprout size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: localize(lang, tabsCopy.progress),
          tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: localize(lang, tabsCopy.assistant),
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: localize(lang, tabsCopy.profile),
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
