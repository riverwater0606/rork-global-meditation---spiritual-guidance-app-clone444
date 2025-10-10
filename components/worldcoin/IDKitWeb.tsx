import { useMiniKit } from '@worldcoin/minikit-js';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VerifyButtonProps {
  testID?: string;
  label?: string;
}

export function WorldIDVerifyButton({ testID, label }: VerifyButtonProps) {
  const { minikit, ...config } = useMiniKit();
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const onPress = useCallback(async () => {
    setError(null);
    setBusy(true);
    console.log('[WorldIDVerifyButton] Pressed.');

    try {
      // The `verify` method is now called without any parameters,
      // as all configuration is handled by the MiniKitProvider.
      const result = await minikit.verify();
      console.log('[WorldIDVerifyButton] verify result:', result);

      if (result?.status === 'error') {
        setError(result.error_code ?? 'Verification failed');
        setBusy(false);
        return;
      }

      const callbackUrl = (config as any).callbackUrl;
      if (callbackUrl) {
        try {
          if (typeof window !== 'undefined') {
            window.sessionStorage?.setItem('worldid:result', JSON.stringify(result));
          }
        } catch {}

        const url = new URL(callbackUrl);
        url.searchParams.set('result', encodeURIComponent(JSON.stringify(result)));

        if (typeof window !== 'undefined') {
          window.location.assign(url.toString());
        }
      }

      setBusy(false);
    } catch (e: any) {
      console.error('[WorldIDVerifyButton] error:', e);
      setError("DIAGNOSTIC TEST: MiniKit failed to load. If you see this, the new code is running.");
      setBusy(false);
    }
  }, [minikit, config]);

  return (
    <View>
      {!!error && <Text style={styles.errorText} testID={testID ? `${testID}-error` : undefined}>{error}</Text>}
      <TouchableOpacity
        style={[styles.button, busy && styles.buttonBusy]}
        onPress={onPress}
        disabled={busy || !minikit}
        testID={testID}
        accessibilityRole="button"
      >
        {busy ? (
          <View style={styles.row}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Verifying…</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>{label ?? 'Sign in with World ID'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'stretch',
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBusy: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});