import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { WorldIDVerifyButton } from '@/components/worldcoin/IDKitWeb';

export default function SignInScreen() {
  const { currentTheme, settings } = useSettings();
  const [initError, setInitError] = useState<string | null>(null);
  const lang = settings.language;

  const ACTION_ID = 'psig' as const;
  const APP_ID = 'app_346b0844d114f6bac06f1d35eb9f3d1d' as const;
  const CALLBACK_URL = typeof window !== 'undefined' && (window.location?.host?.includes('localhost') || window.location?.host?.includes('127.0.0.1'))
    ? 'http://localhost:3000/callback'
    : 'https://444-two.vercel.app/callback';

  const texts = useMemo(
    () => ({
      cta: lang === 'zh' ? '使用 World ID 登入' : 'Sign in with World ID',
      openWorld: lang === 'zh' ? '請在 World App 中開啟' : 'Please open inside World App',
      failed: lang === 'zh' ? '登入失敗，請再試一次。' : 'Sign-in failed, please try again.'
    }),
    [lang]
  );

  return (
    <View style={[styles.simpleContainer, { backgroundColor: currentTheme.background }]}>
      {!!initError && (
        <Text style={styles.initError} testID="minikit-init-error">{initError}</Text>
      )}
      <WorldIDVerifyButton
        appId={APP_ID}
        action={ACTION_ID}
        callbackUrl={CALLBACK_URL}
        testID="btn-worldid-signin"
        label={texts.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  simpleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  initError: { color: '#EF4444', fontSize: 12, marginBottom: 12 },
});
