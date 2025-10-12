import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ScanLine, RefreshCw } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { ensureMiniKitLoaded, getMiniKit, isMiniKitInstalled, runWorldVerify, WorldIDVerifyButton } from '@/components/worldcoin/IDKitWeb';

export default function SignInScreen() {
  const { currentTheme, settings } = useSettings();
  const [initError, setInitError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [ua, setUa] = useState<string>('');
  const [isWorldEnv, setIsWorldEnv] = useState<boolean>(false);
  const autoTriedRef = useRef<boolean>(false);

  const lang = settings.language;

  const ACTION_ID = 'psig' as const;
  const CALLBACK_URL = typeof window !== 'undefined' && (window.location?.host?.includes('localhost') || window.location?.host?.includes('127.0.0.1'))
    ? 'http://localhost:3000/callback'
    : 'https://444-two.vercel.app/callback';

  const texts = useMemo(
    () => ({
      title: lang === 'zh' ? '登入以繼續' : 'Sign in to continue',
      subtitle: lang === 'zh' ? '使用 World ID 確認你是真人' : 'Use World ID to confirm you are human',
      cta: lang === 'zh' ? '使用 World ID 登入' : 'Sign in with World ID',
      tryAgain: lang === 'zh' ? '我已在 World App 內，重試' : "I'm inside World App, try again",
      openWorld: lang === 'zh' ? '請在 World App 中開啟' : 'Please open inside World App',
      helper: lang === 'zh' ? '請用 World App 內置掃描器開啟此頁面，而非系統瀏覽器。' : 'Use the built-in scanner in World App, not the system browser.',
      needHelp: lang === 'zh' ? '教學與疑難排解' : 'Guide & troubleshooting',
      verifying: lang === 'zh' ? '驗證中…' : 'Verifying…',
    }),
    [lang]
  );

  useEffect(() => {
    const u = (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '';
    setUa(u);
    const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined;
    const forceParam = (sp?.get('worldapp') ?? '') === '1';
    const detected = /(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i.test(u) || forceParam;
    setIsWorldEnv(detected);
    console.log('[SignIn] UA:', u, 'forceParam', forceParam, 'detectedWorldEnv', detected);
  }, []);

  const openHelp = useCallback(() => {
    const url = 'https://developer.worldcoin.org/mini-apps/commands/verify';
    Linking.openURL(url).catch(() => {});
  }, []);

  const hardRetry = useCallback(async () => {
    if (Platform.OS !== 'web') {
      setInitError(texts.openWorld);
      return;
    }
    try {
      setBusy(true);
      setInitError(null);
      console.log('[SignIn] Hard retry pressed');

      let mk: any | undefined = await ensureMiniKitLoaded();
      if (!mk && (/(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i.test(ua) || isWorldEnv)) {
        for (let i = 0; i < 20 && !mk; i++) {
          await new Promise((r) => setTimeout(r, 150));
          mk = getMiniKit();
        }
      }
      if (!mk) {
        setInitError(texts.openWorld);
        setBusy(false);
        return;
      }
      const installed = await isMiniKitInstalled(mk);
      if (!installed && !isWorldEnv) {
        setInitError(texts.openWorld);
        setBusy(false);
        return;
      }

      const payload: any = await runWorldVerify({ mk, action: ACTION_ID });
      if (payload?.status === 'error') {
        setInitError(payload?.error_code ?? 'Verification failed');
        setBusy(false);
        return;
      }
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage?.setItem('worldid:result', JSON.stringify(payload));
        }
      } catch {}
      const url = new URL(CALLBACK_URL);
      url.searchParams.set('result', encodeURIComponent(JSON.stringify(payload)));
      if (typeof window !== 'undefined') {
        window.location.assign(url.toString());
      }
      setBusy(false);
    } catch (e: any) {
      console.error('[SignIn] hardRetry error', e);
      setInitError(e?.message ?? 'Failed to verify');
      setBusy(false);
    }
  }, [ACTION_ID, CALLBACK_URL, isWorldEnv, texts.openWorld, ua]);

  useEffect(() => {
    if (autoTriedRef.current) return;
    if (Platform.OS !== 'web') return;
    const shouldAuto = isWorldEnv;
    if (!shouldAuto) return;
    const id = setTimeout(() => {
      autoTriedRef.current = true;
      console.log('[SignIn] Auto-start verify after 700ms');
      void hardRetry();
    }, 700);
    return () => clearTimeout(id);
  }, [isWorldEnv, hardRetry]);

  return (
    <View style={[styles.root, { backgroundColor: currentTheme.background }]}>
      <LinearGradient colors={currentTheme.gradient as any} style={styles.heroBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <ShieldCheck size={28} color="#FFFFFF" />
            <Text style={styles.title} testID="signin-title">{texts.title}</Text>
            <Text style={styles.subtitle}>{texts.subtitle}</Text>
          </View>

          {!!initError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} testID="minikit-init-error">{initError}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <WorldIDVerifyButton
              appId={'app_346b0844d114f6bac06f1d35eb9f3d1d'}
              action={ACTION_ID}
              callbackUrl={CALLBACK_URL}
              testID="btn-worldid-signin"
              label={busy ? texts.verifying : texts.cta}
            />

            <TouchableOpacity style={[styles.retryBtn, busy && styles.btnDisabled]} onPress={hardRetry} disabled={busy} testID="btn-worldid-retry">
              {busy ? (
                <View style={styles.rowCenter}>
                  <ActivityIndicator color="#111827" size="small" />
                  <Text style={[styles.retryText, { marginLeft: 8 }]}>{texts.verifying}</Text>
                </View>
              ) : (
                <View style={styles.rowCenter}>
                  <RefreshCw size={16} color="#111827" />
                  <Text style={[styles.retryText, { marginLeft: 6 }]}>{texts.tryAgain}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.hint}>
              <ScanLine size={16} color="#6B7280" />
              <Text style={styles.hintText}>{texts.helper}</Text>
            </View>

            <TouchableOpacity onPress={openHelp} style={styles.helpLink} testID="worldid-help-link">
              <Text style={styles.helpText}>{texts.needHelp}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  container: { flex: 1, justifyContent: 'flex-start' },
  header: { paddingTop: 24, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#E5E7EB', marginTop: 6 },
  actions: { marginTop: 24, paddingHorizontal: 24, gap: 12 } as const,
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 10, marginHorizontal: 24, marginTop: 16 },
  errorText: { color: '#B91C1C', fontSize: 12 },
  retryBtn: { backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  retryText: { color: '#111827', fontSize: 14, fontWeight: '700' },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 6 } as const,
  hintText: { color: '#6B7280', fontSize: 12, marginLeft: 6 },
  helpLink: { alignItems: 'center', marginTop: 8 },
  helpText: { color: '#3B82F6', fontSize: 12, fontWeight: '600' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
