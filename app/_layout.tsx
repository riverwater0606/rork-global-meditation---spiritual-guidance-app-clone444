import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, Redirect, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { Component, ErrorInfo, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MiniKit } from "@/constants/minikit";
import { MeditationProvider } from "@/providers/MeditationProvider";
import { UserProvider, useUser } from "@/providers/UserProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";
import MiniKitProvider from "@/components/worldcoin/MiniKitProvider";

console.log('[WorldID] SplashScreen.preventAutoHideAsync() - start');
try {
  SplashScreen.preventAutoHideAsync()
    .then(() => console.log('[WorldID] SplashScreen.preventAutoHideAsync() - done'))
    .catch((e) => console.log('[WorldID] SplashScreen.preventAutoHideAsync() error', e));
} catch (e) {
  console.log('[WorldID] SplashScreen.preventAutoHideAsync() crashed', e);
}

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

type WorldEnv = 'unknown' | 'world' | 'browser';

function AppBootstrap() {
  const [bootState, setBootState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [bootError, setBootError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [worldEnv, setWorldEnv] = useState<WorldEnv>('unknown');
  const [webOverride, setWebOverride] = useState(false);
  const gateStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#030712',
      padding: 32,
      gap: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: '#F9FAFB',
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: '#9CA3AF',
      textAlign: 'center',
      lineHeight: 22,
    },
    primary: {
      backgroundColor: '#10B981',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 999,
    },
    primaryText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    secondary: {
      borderColor: '#374151',
      borderWidth: 1,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 999,
    },
    secondaryText: {
      color: '#9CA3AF',
      fontWeight: '600',
    },
  }), []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setWorldEnv('world');
      return;
    }
    const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '';
    const detected = /(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i.test(ua);
    setWorldEnv(detected ? 'world' : 'browser');
  }, []);

  useEffect(() => {
    let isMounted = true;
    const prepare = async () => {
      console.log(`[Boot] Preparing app (attempt ${attempt + 1})`);
      setBootState('loading');
      setBootError(null);
      let localError: string | null = null;
      try {
        if (Platform.OS === 'web') {
          // Safe check for MiniKit
          if (MiniKit && typeof MiniKit.install === 'function') {
            await MiniKit.install();
            console.log('[Boot] MiniKit.install resolved');
          } else {
             console.log('[Boot] MiniKit not available or not a function');
          }
        }
      } catch (error) {
        localError = (error as Error)?.message ?? 'MiniKit initialization failed';
        console.log('[Boot] MiniKit.install error', error);
      } finally {
        try {
          await SplashScreen.hideAsync();
          console.log('[Boot] SplashScreen hidden');
        } catch (hideError) {
          console.log('[Boot] SplashScreen.hideAsync failed', hideError);
        }
        if (!isMounted) {
          return;
        }
        if (localError) {
          setBootError(localError);
          setBootState('error');
        } else {
          setBootState('ready');
        }
      }
    };

    void prepare();

    return () => {
      isMounted = false;
    };
  }, [attempt]);

  const handleRetry = useCallback(() => {
    console.log('[Boot] Retry requested');
    setAttempt((prev) => prev + 1);
  }, []);

  const handleOpenWorldApp = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.open('https://app.worldcoin.org', '_blank', 'noopener');
      } catch (err) {
        console.log('[Boot] Failed to open World App link', err);
      }
    }
  }, []);

  const handleContinueOnWeb = useCallback(() => {
    setWebOverride(true);
  }, []);

  const shouldShowWorldFallback = Platform.OS === 'web' && worldEnv === 'browser' && !webOverride;

  if (shouldShowWorldFallback) {
    return (
      <View style={gateStyles.container} testID="world-gate">
        <Text style={gateStyles.title}>Please open in World App</Text>
        <Text style={gateStyles.subtitle}>
          World ID verification requires the in-app browser. Scan this page with the World App QR scanner or tap below to learn more.
        </Text>
        <TouchableOpacity style={gateStyles.primary} onPress={handleOpenWorldApp} testID="world-gate-open">
          <Text style={gateStyles.primaryText}>Open World App Guide</Text>
        </TouchableOpacity>
        <TouchableOpacity style={gateStyles.secondary} onPress={handleContinueOnWeb} testID="world-gate-continue">
          <Text style={gateStyles.secondaryText}>Continue in browser (debug)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (bootState === 'loading') {
    return (
      <View style={bootStyles.container} testID="boot-loading">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={bootStyles.message}>Preparing immersive experience…</Text>
      </View>
    );
  }

  if (bootState === 'error') {
    return (
      <View style={bootStyles.container} testID="boot-error">
        <Text style={bootStyles.errorTitle}>啟動失敗</Text>
        <Text style={bootStyles.errorMessage}>{bootError ?? 'MiniKit 無法啟動，請重試'}</Text>
        <TouchableOpacity style={bootStyles.retryButton} onPress={handleRetry} testID="boot-retry">
          <Text style={bootStyles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.container}>
            <MiniKitProvider>
              <SettingsProvider>
                <UserProvider>
                  <MeditationProvider>
                    <AppBootstrap />
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

const bootStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050C1F',
    padding: 24,
  },
  message: {
    marginTop: 16,
    color: '#E5E7EB',
    fontSize: 14,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F87171',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#F3F4F6',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});