import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { Component, ErrorInfo, ReactNode, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MeditationProvider } from "@/providers/MeditationProvider";
import { UserProvider } from "@/providers/UserProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";

console.log('[WorldID] SplashScreen.preventAutoHideAsync() - start');
SplashScreen.preventAutoHideAsync()
  .then(() => console.log('[WorldID] SplashScreen.preventAutoHideAsync() - done'))
  .catch(() => console.log('[WorldID] SplashScreen.preventAutoHideAsync() - already prevented or failed'));

const queryClient = new QueryClient();

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Failed to load, please retry</Text>
          <Text style={errorStyles.message}>{this.state.error?.message}</Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={errorStyles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="meditation/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="breathing" options={{ presentation: "modal" }} />
      <Stack.Screen name="timer" options={{ presentation: "modal" }} />
      <Stack.Screen name="guided-session" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings/notifications" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings/theme" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings/language" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings/privacy" options={{ presentation: "modal" }} />
      <Stack.Screen name="callback" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const hide = async () => {
      try {
        console.log('[WorldID] SplashScreen.hideAsync() - start');
      } finally {
        await SplashScreen.hideAsync()
          .then(() => console.log('[WorldID] SplashScreen.hideAsync() - done'))
          .catch(() => console.log('[WorldID] SplashScreen.hideAsync() - failed'));
      }
    };
    void hide();
  }, []);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <SettingsProvider>
            <UserProvider>
              <MeditationProvider>
                <RootLayoutNav />
              </MeditationProvider>
            </UserProvider>
          </SettingsProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});