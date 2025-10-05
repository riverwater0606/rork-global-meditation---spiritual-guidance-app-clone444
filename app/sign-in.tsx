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

  function getMiniKit(): any | undefined {
    if (typeof window === 'undefined') return undefined;
    const w = window as any;
    return (
      w.MiniKit ||
      w.miniKit ||
      w.worldApp?.miniKit ||
      w.WorldApp?.miniKit ||
      w.WorldApp?.MiniKit ||
      w.worldApp?.MiniKit
    );
  }

  async function ensureMiniKitLoaded(): Promise<any | undefined> {
    let mk = getMiniKit();
    if (mk) return mk;
    if (Platform.OS !== 'web') return undefined;

    const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '';
    const isWorldAppUA = /(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i.test(ua);

    if (isWorldAppUA) {
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 100));
        mk = getMiniKit();
        if (mk) return mk;
      }
      return undefined;
    }

    try {
      await new Promise<void>((resolve) => {
        const existing = document.querySelector('script[data-minikit]') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => resolve());
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.worldcoin.org/minikit/v1/minikit.js';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-minikit', 'true');
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
    } catch {}
    mk = getMiniKit();
    return mk;
  }

  async function isMiniKitInstalled(mk: any): Promise<boolean> {
    try {
      if (!mk) return false;
      const val = typeof mk.isInstalled === 'function' ? mk.isInstalled() : mk.isInstalled;
      const resolved = typeof (val as any)?.then === 'function' ? await (val as Promise<any>) : val;
      if (resolved != null) return Boolean(resolved);
      const hasApi = Boolean(mk?.commandsAsync || mk?.commands || mk?.actions || mk?.verify);
      return hasApi;
    } catch (e) {
      console.log('[WorldID] isInstalled check failed', e);
      return false;
    }
  }

  useEffect(() => {
    if (!isWeb) return;
    const setup = async () => {
      try {
        const w: any = typeof window !== 'undefined' ? window : undefined;
        if (!w) return;
        if (!w.__MINI_APP_METADATA) {
          w.__MINI_APP_METADATA = { app_id: APP_ID };
          console.log('[WorldID] Injected __MINI_APP_METADATA', w.__MINI_APP_METADATA);
        }
        let mk = await ensureMiniKitLoaded();
        if (mk?.init) {
          await Promise.resolve(mk.init({ app_id: APP_ID }));
        }
        mk = getMiniKit();
        const installed = await isMiniKitInstalled(mk);
        setIsMiniApp(installed);
      } catch (e) {
        console.log('[WorldID] init error', e);
        setInitError((e as Error)?.message ?? 'Unknown error');
      }
    };
    setup();
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
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      setIsChecking(false);
      alert(texts.openWorld);
    }, 8000);
    try {
      setIsChecking(true);
      if (!isWeb) {
        console.log('[WorldID] Native platform: ask user to open in World App');
        alert(texts.openWorld);
        return;
      }
      let mk = await ensureMiniKitLoaded();
      if (timedOut) return;
      if (!mk) {
        alert(texts.openWorld);
        return;
      }
      const installed = await isMiniKitInstalled(mk);
      if (timedOut) return;
      console.log('[WorldID] Sign-in pressed. installed =', installed);
      if (!installed) {
        alert(texts.openWorld);
        return;
      }
      const verifyFn = (
        mk?.commandsAsync?.verify ||
        mk?.commands?.verify ||
        mk?.actions?.verify ||
        mk?.verify
      ) as undefined | ((args: any) => Promise<any>);
      if (!verifyFn) {
        alert('MiniKit not ready.');
        return;
      }
      const result: any = await verifyFn({
        action: ACTION_ID,
        signal: 'user_signal',
        verification_level: 'orb',
        enableTelemetry: true,
        app_id: APP_ID,
      });
      if (timedOut) return;
      const finalPayload = (result?.finalPayload ?? result) as any;
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
      alert('Sign-in failed, please try again.');
    } finally {
      clearTimeout(timeout);
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
        {isChecking ? (
          <Text style={styles.hint} testID="hint-loading">{texts.checking}</Text>
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
