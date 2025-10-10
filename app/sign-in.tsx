import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { WorldIDVerifyButton } from '@/components/worldcoin/IDKitWeb';

export default function SignInScreen() {
  const { currentTheme, settings } = useSettings();
  const lang = settings.language;

  const texts = useMemo(
    () => ({
      cta: lang === 'zh' ? '(V3) 按這裡登入' : '(V3) Sign In Here',
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
