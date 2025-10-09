import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';

export default function SignInScreen() {
  const { currentTheme, settings } = useSettings();
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';
  const lang = settings.language;

  const ACTION_ID = 'psig' as const;

  const texts = useMemo(
    () => ({
      cta: lang === 'zh' ? '使用 World ID 登入' : 'Sign in with World ID',
      openWorld: lang === 'zh' ? '請在 World App 中開啟' : 'Please open inside World App',
      checking: lang === 'zh' ? '驗證中...' : 'Verifying...',
      failed: lang === 'zh' ? '登入失敗，請再試一次。' : 'Sign-in failed, please try again.'
    }),
    [lang]
  );

  const handleSignIn = useCallback(async () => {
    setInitError(null);
    try {
      setIsChecking(true);

      if (!isWeb) {
        setInitError(texts.openWorld);
        return;
      }

      const { MiniKit, VerificationLevel } = await import('@worldcoin/minikit-js');
      const installed = await Promise.resolve(MiniKit?.isInstalled?.());
      if (!installed) {
        setInitError(texts.openWorld);
        return;
      }

      const verifyPayload: { action: string; signal?: string; verification_level?: any } = {
        action: ACTION_ID,
        signal: '0x12312',
        verification_level: VerificationLevel.Orb,
      };

      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload as any);
      if ((finalPayload as any).status === 'error') {
        setInitError((finalPayload as any).error_code ?? 'Verification failed');
        return;
      }

      if (typeof window !== 'undefined') {
        try {
          const payloadStr = JSON.stringify(finalPayload);
          window.sessionStorage?.setItem('worldid:result', payloadStr);
        } catch {}

        const callbackUrl = (window.location?.host?.includes('localhost') || window.location?.host?.includes('127.0.0.1'))
          ? 'http://localhost:3000/callback'
          : 'https://444-two.vercel.app/callback';
        window.location.href = callbackUrl;
      }
    } catch (e) {
      console.error('[WorldID] handleSignIn error', e);
      setInitError(texts.failed);
    } finally {
      setIsChecking(false);
    }
  }, [isWeb, texts]);

  return (
    <View style={[styles.simpleContainer, { backgroundColor: currentTheme.background }]}>
      {!!initError && (
        <Text style={styles.initError} testID="minikit-init-error">{initError}</Text>
      )}
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn} testID="btn-worldid-signin" disabled={isChecking}>
        {isChecking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryLabel}>{texts.cta}</Text>
        )}
      </TouchableOpacity>
      {isChecking && (
        <Text style={styles.hint} testID="hint-loading">{texts.checking}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  simpleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hint: { color: '#6B7280', fontSize: 12, marginTop: 10 },
  initError: { color: '#EF4444', fontSize: 12, marginBottom: 12 },
  primaryBtn: { marginTop: 6, backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, alignSelf: 'stretch' },
  primaryLabel: { color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center' },
});
