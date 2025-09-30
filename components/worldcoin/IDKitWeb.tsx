import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VerifyButtonProps {
  appId: string;
  action: string;
  callbackUrl: string;
  testID?: string;
  label?: string;
}

export function IDKitWeb() {
  return null;
}

function getMiniKit(): any | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as any;
  const mk = w.MiniKit ?? w.miniKit ?? w.worldApp?.miniKit ?? w.WorldApp?.miniKit;
  return mk;
}

async function ensureMiniKitLoaded(): Promise<any | undefined> {
  let mk = getMiniKit();
  if (mk) return mk;
  if (Platform.OS !== 'web') return undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-minikit]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@worldcoin/minikit-js@latest/dist/minikit.js';
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
    const resolved = typeof val?.then === 'function' ? await val : val;
    return Boolean(resolved);
  } catch (e) {
    console.log('[WorldIDVerifyButton] isInstalled check failed', e);
    return false;
  }
}

export function WorldIDVerifyButton({ appId, action, callbackUrl, testID, label }: VerifyButtonProps) {
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const onPress = useCallback(async () => {
    setError(null);
    if (Platform.OS !== 'web') {
      setError('Please open in World App browser');
      return;
    }
    try {
      let mk = await ensureMiniKitLoaded();
      if (!mk) {
        setError('MiniKit not detected. Open inside World App');
        return;
      }
      const installed = await isMiniKitInstalled(mk);
      if (!installed) {
        setError('MiniKit not detected. Open inside World App');
        return;
      }
      const verifyFn = mk?.commandsAsync?.verify as undefined | ((args: any) => Promise<any>);
      if (!verifyFn) {
        setError('Verification API unavailable');
        return;
      }
      setBusy(true);
      const actionId = action || 'psig';
      const { finalPayload } = await verifyFn({
        action: actionId,
        signal: 'user_signal',
        verification_level: 'orb',
        enableTelemetry: true,
        app_id: appId,
      });
      setBusy(false);
      if (finalPayload?.status === 'error') {
        setError(finalPayload.error_code ?? 'Verification failed');
        return;
      }
      const url = new URL(callbackUrl);
      url.searchParams.set('result', encodeURIComponent(JSON.stringify(finalPayload)));
      window.location.href = url.toString();
    } catch (e: any) {
      console.error('[WorldIDVerifyButton] error:', e);
      setBusy(false);
      setError(e?.message ?? 'Failed to verify');
    }
  }, [appId, action, callbackUrl]);

  return (
    <View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity
        style={[styles.button, busy && styles.buttonBusy]}
        onPress={onPress}
        disabled={busy}
        testID={testID}
      >
        <Text style={styles.buttonText}>{busy ? 'Verifying...' : (label ?? 'Connect with World ID')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
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
    marginBottom: 6,
  },
});
