import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ScanLine, RefreshCw } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { ensureMiniKitLoaded, getMiniKit, isMiniKitInstalled, runWorldVerify } from '@/components/worldcoin/IDKitWeb';

export default function SignInScreen() {
  const { currentTheme, settings } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [ua, setUa] = useState<string>('');
  const [isWorldEnv, setIsWorldEnv] = useState<boolean>(false);
  const autoTriedRef = useRef<boolean>(false);

  const lang = settings.language;

  const ACTION_ID = 'psig' as const;
  const CALLBACK_URL = typeof window !== 'undefined' && (window.location?.host?.includes('localhost') || window.location?.host?.includes('127.0.0.1'))
    ? 'http://localhost:3000/callback'
    : 'https://444-two.vercel.app/callback';

  const texts = useMemo(() => {
    const zh = lang === 'zh';
    return {
      title: zh ? '登入以繼續' : 'Sign in to continue',
      subtitle: zh ? '使用 World ID 確認你是真人' : 'Use World ID to confirm you are human',
      ctaVerify: zh ? '我已在 World App 內，開始驗證' : "I'm inside World App, verify",
      openWorld: zh ? '請在 World App 中開啟' : 'Please open inside World App',
      helper: zh ? '請用 World App 內置掃描器開啟此頁面（或掃描 QR），不要用系統瀏覽器。' : 'Open with World App’s built‑in scanner (or scan the QR), not the system browser.',
      verifying: zh ? '驗證中…' : 'Verifying…',
    } as const;
  }, [lang]);

  useEffect(() => {
    const u = (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '';
    setUa(u);
    const detected = /(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i.test(u);
    setIsWorldEnv(detected);
    console.log('[SignIn] UA:', u, 'detectedWorldEnv', detected);
  }, []);

  const verifyInsideWorldApp = useCallback(async () => {
    if (Platform.OS !== 'web') {
      setError(texts.openWorld);
      return;
    }
    try {
      setBusy(true);
      setError(null);
      let mk: any | undefined = await ensureMiniKitLoaded();
      if (!mk && (/(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i.test(ua) || isWorldEnv)) {
        for (let i = 0; i < 30 && !mk; i++) {
          await new Promise((r) => setTimeout(r, 150));
          mk = getMiniKit();
        }
      }
      if (!mk) {
        setError(texts.openWorld);
        setBusy(false);
        return;
      }
      const installed = await isMiniKitInstalled(mk);
      if (!installed) {
        setError(texts.openWorld);
        setBusy(false);
        return;
      }
      const payload: any = await runWorldVerify({ mk, action: ACTION_ID });
      if (payload?.status === 'error') {
        setError(payload?.error_code ?? 'Verification failed');
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
      console.error('[SignIn] verify error', e);
      setError(e?.message ?? 'Failed to verify');
      setBusy(false);
    }
  }, [ACTION_ID, CALLBACK_URL, isWorldEnv, texts.openWorld, ua, texts.verifying]);

  useEffect(() => {
    if (autoTriedRef.current) return;
    if (Platform.OS !== 'web') return;
    if (!isWorldEnv) return;
    const id = setTimeout(() => {
      autoTriedRef.current = true;
      console.log('[SignIn] Auto-start verify inside World App');
      void verifyInsideWorldApp();
    }, 400);
    return () => clearTimeout(id);
  }, [isWorldEnv, verifyInsideWorldApp]);

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

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} testID="minikit-init-error">{error}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.verifyBtn, busy && styles.btnDisabled]}
              onPress={verifyInsideWorldApp}
              disabled={busy}
              testID="btn-worldid-verify"
              accessibilityRole="button"
            >
              {busy ? (
                <View style={styles.rowCenter}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={[styles.verifyText, { marginLeft: 8 }]}>{texts.verifying}</Text>
                </View>
              ) : (
                <View style={styles.rowCenter}>
                  <RefreshCw size={16} color="#FFFFFF" />
                  <Text style={[styles.verifyText, { marginLeft: 6 }]}>{texts.ctaVerify}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.hint}>
              <ScanLine size={16} color="#6B7280" />
              <Text style={styles.hintText}>{texts.helper}</Text>
            </View>
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
  verifyBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  verifyText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 6 } as const,
  hintText: { color: '#6B7280', fontSize: 12, marginLeft: 6 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});