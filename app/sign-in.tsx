import React, { useCallback, useMemo, useState } from 'react';
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
  const isWeb = Platform.OS === 'web';
  const lang = settings.language;

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
      const installed = typeof mk?.isInstalled === 'function' ? mk.isInstalled() : false;
      console.log('[WorldID] Sign-in pressed. isInstalled =', installed);
      if (!installed) {
        alert(texts.openWorld);
        return;
      }
      const action = 'psig';
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
      // store verification via provider callback on callback screen; redirect there
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

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <ShieldCheck size={28} color="#10B981" />
          </View>
          <Text style={styles.cardTitle}>{texts.cta}</Text>
          <Text style={styles.cardSubtitle}>{texts.openWorld}</Text>

          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn} testID="btn-worldid-signin" disabled={isChecking}>
            {isChecking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.signInText}>{texts.cta}</Text>
                <ChevronRight size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {isVerified && (
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>{texts.proceed}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', paddingHorizontal: 20, marginTop: 16 },
  subtitle: { fontSize: 14, color: '#E0E7FF', paddingHorizontal: 20, marginTop: 6 },
  content: { padding: 20 },
  card: { backgroundColor: '#111827', padding: 20, borderRadius: 16 },
  badge: { backgroundColor: '#ECFDF5', width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardTitle: { color: '#F9FAFB', fontSize: 18, fontWeight: '700' },
  cardSubtitle: { color: '#9CA3AF', fontSize: 12, marginTop: 6 },
  signInButton: { marginTop: 14, backgroundColor: '#10B981', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  signInText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  verifiedPill: { marginTop: 12, backgroundColor: '#065F46', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start' },
  verifiedText: { color: '#D1FAE5', fontSize: 12, fontWeight: '600' },
});
