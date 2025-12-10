import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, Redirect, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { Component, ErrorInfo, ReactNode, useEffect } from "react";
import { MiniKit } from "@/constants/minikit";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MeditationProvider } from "@/providers/MeditationProvider";
import { UserProvider, useUser } from "@/providers/UserProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";
import MiniKitProvider from "@/components/worldcoin/MiniKitProvider";

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
            testID="error-retry"
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
    backgroundColor: '#0f0f1a',
  },
  title: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#e0e0ff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 17,
    color: '#b0b0ff',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500' as const,
  },
  button: {
    backgroundColor: '#a78bfa',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 16,
  },
});

function RootLayoutNav() {
  const { isVerified } = useUser();
  const pathname = usePathname();
  const onAuthScreen = pathname === "/sign-in" || pathname === "/callback";
  if (!isVerified && !onAuthScreen) {
    return <Redirect href="/sign-in" />;
  }
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
      <Stack.Screen name="sign-in" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch((error) => {
      console.log('[RootLayout] SplashScreen.hideAsync failed', error);
    });
  }, []);

  useEffect(() => {
    if (MiniKit?.install) {
      try {
        MiniKit.install();
        console.log('[RootLayout] MiniKit installed');
      } catch (error) {
        console.log('[RootLayout] MiniKit install failed', error);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.container}>
            <MiniKitProvider>
              <SettingsProvider>
                <UserProvider>
                  <MeditationProvider>
                    <RootLayoutNav />
                  </MeditationProvider>
                </UserProvider>
              </SettingsProvider>
            </MiniKitProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
