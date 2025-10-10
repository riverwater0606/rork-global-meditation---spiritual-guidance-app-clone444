import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { WorldIDVerifyButton } from '@/components/worldcoin/IDKitWeb';

export default function SignInScreen() {
  const { currentTheme, settings } = useSettings();
  const lang = settings.language;

  const texts = useMemo(
    () => ({
      cta: lang === 'zh' ? '使用 World ID 登入 (v2)' : 'Sign in with World ID (v2)',
    }),
    [lang]
  );

  return (
    <View style={[styles.simpleContainer, { backgroundColor: currentTheme.background }]}>
      <WorldIDVerifyButton testID="btn-worldid-signin" label={texts.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  simpleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
