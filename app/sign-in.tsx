import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, ChevronRight } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { useUser } from '@/providers/UserProvider';

export default function SignInScreen() {
  const { currentTheme, settings } = useSettings();
  const { isVerified } = useUser();
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isMiniApp, setIsMiniApp] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';
  const lang = settings.language;

  const APP_ID = 'app_346b0844d114f6bac06f1d35eb9f3d1d' as const;
  const ACTION_ID = 'psig' as const;

  useEffect(() => {
    if (!isWeb) return;
    try {
      const w: any = typeof window !== 'undefined' ? window : undefined;
      if (!w) return;
      if (!w.__MINI_APP_METADATA) {
        w.__MINI_APP_METADATA = { app_id: APP_ID };
        console.log('[WorldID] Injected __MINI_APP_METADATA', w.__MINI_APP_METADATA);
      }
      const mk = w.MiniKit;
      if (mk?.init) {
        Promise.resolve(mk.init({ app_id: APP_ID }))
          .then(() => {
            console.log('[WorldID] MiniKit.init resolved');
            try {
              const installed = typeof mk.isInstalled === 'function' ? mk.isInstalled() : !!mk;
              setIsMiniApp(!!installed);
            } catch (e) {
              console.log('[WorldID] isInstalled check failed, assuming mini browser', e);
              setIsMiniApp(true);
            }
          })
          .catch((e: unknown) => {
            console.log('[WorldID] MiniKit.init failed', e);
            setInitError('MiniKit initialization failed');
            setIsMiniApp(!!mk);
          });
      } else {
        setIsMiniApp(!!mk);
      }
    } catch (e) {
      console.log('[WorldID] init error', e);
      setInitError((e as Error)?.message ?? 'Unknown error');
    }
  }, [isWeb]);

  const texts = useMemo(() => ({
    title: lang === 'zh' ? '登入' : 'Sign In',
    subtitle: lang === 'zh' ? '使用 World ID 驗證以進入應用' : 'Use World ID verification to enter the app',
    cta: lang === 'zh' ? '使用 World ID 登入' : 'Sign in with World ID',
    openWorld: lang === 'zh' ? '請在 World App 中開啟' : 'Please open inside World App',
    checking: lang === 'zh' ? '檢查中...' : 'Checking...',
    proceed: lang === 'zh' ? '已驗證，進入應用' : 'Verified, enter app'
  }), [lang]);

  const handleSignIn = useCallback(async () => {
    try {
      setIsChecking(true);
      if (!isWeb) {
        console.log('[WorldID] Native platform: ask user to open in World App');
        return;
      }
      const mk = (typeof window !== 'undefined' ? (window as any).MiniKit : undefined);
      const installed = typeof mk?.isInstalled === 'function' ? mk.isInstalled() : !!mk;
      console.log('[WorldID] Sign-in pressed. isInstalled =', installed);
      if (!installed) {
        alert(texts.openWorld);
        return;
      }
      const action = ACTION_ID;
      const verify = mk?.commandsAsync?.verify as undefined | ((args: any) => Promise<any>);
      if (!verify) {
        alert('MiniKit not ready.');
        return;
      }
      const { finalPayload } = await verify({ action, signal: 'user_signal', verification_level: 'orb', enableTelemetry: true });
      if (finalPayload?.status === 'error') {
        alert(finalPayload.error_code ?? 'Verification failed');
        return;
      }
      const callbackUrl = (typeof window !== 'undefined' && (window.location?.host?.includes('localhost') || window.location?.host?.includes('127.0.0.1')))
        ? 'http://localhost:3000/callback'
        : 'https://444-two.vercel.app/callback';
      const url = new URL(callbackUrl);
      url.searchParams.set('result', encodeURIComponent(JSON.stringify(finalPayload)));
      window.location.href = url.toString();
    } catch (e) {
      console.error('[WorldID] handleSignIn error', e);
    } finally {
      setIsChecking(false);
    }
  }, [isWeb, texts]);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient colors={currentTheme.gradient as any} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.title}>{texts.title}</Text>
          <Text style={styles.subtitle}>{texts.subtitle}</Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.centerWrap}>
        <View style={styles.logoCircle}>
          <ShieldCheck size={36} color="#10B981" />
        </View>
        {initError ? (
          <Text style={styles.initError} testID="minikit-init-error">{initError}</Text>
        ) : null}
        {!isMiniApp && isWeb ? (
          <Text style={styles.hint} testID="hint-open-world">{texts.openWorld}</Text>
        ) : null}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn} testID="btn-worldid-signin" disabled={isChecking}>
          {isChecking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.btnInner}>
              <Text style={styles.primaryLabel}>{texts.cta}</Text>
              <ChevronRight size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        {isVerified ? (
          <View style={styles.verifiedPill}>
            <Text style={styles.verifiedText}>{texts.proceed}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', paddingHorizontal: 20, marginTop: 16 },
  subtitle: { fontSize: 14, color: '#E0E7FF', paddingHorizontal: 20, marginTop: 6 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logoCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  hint: { color: '#6B7280', fontSize: 12, marginBottom: 10 },
  initError: { color: '#EF4444', fontSize: 12, marginBottom: 8 },
  primaryBtn: { marginTop: 6, backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, alignSelf: 'stretch' },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
  verifiedPill: { marginTop: 14, backgroundColor: '#065F46', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  verifiedText: { color: '#D1FAE5', fontSize: 12, fontWeight: '600' },
});
