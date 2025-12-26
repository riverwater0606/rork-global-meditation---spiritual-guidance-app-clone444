import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

export function getMiniKit(): any | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as any;
  const mk =
    w.MiniKit ??
    w.miniKit ??
    w.worldApp?.miniKit ??
    w.WorldApp?.miniKit ??
    w.WorldApp?.MiniKit ??
    w.worldApp?.MiniKit;
  return mk;
}

export async function ensureMiniKitLoaded(): Promise<any | undefined> {
  let mk = getMiniKit();
  if (mk) return mk;
  if (Platform.OS !== 'web') return undefined;

  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '';
  const isWorldAppUA = /(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i.test(ua);

  // Poll for injected MiniKit when inside World App, then fallback to CDN injection
  if (isWorldAppUA) {
    for (let i = 0; i < 150; i++) {
      await new Promise((r) => setTimeout(r, 100));
      mk = getMiniKit();
      if (mk) return mk;
    }
    // Fallback: try injecting CDN script even inside World App
    try {
      await new Promise<void>((resolve) => {
        const existing = document.querySelector('script[data-minikit]') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => resolve());
          return;
        }
        const script = document.createElement('script');
        // Primary + fallback hosts via onerror swap
        script.src = 'https://idkit.worldcoin.org/minikit/v1/minikit.js';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-minikit', 'true');
        script.onerror = () => {
          const fallback = document.createElement('script');
          fallback.src = 'https://cdn.worldcoin.org/minikit/v1/minikit.js';
          fallback.async = true;
          fallback.defer = true;
          fallback.setAttribute('data-minikit', 'true');
          fallback.onload = () => resolve();
          fallback.onerror = () => resolve();
          document.head.appendChild(fallback);
        };
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    } catch {}
    mk = getMiniKit();
    return mk;
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
      // Primary + fallback
      script.src = 'https://idkit.worldcoin.org/minikit/v1/minikit.js';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-minikit', 'true');
      script.onerror = () => {
        const fallback = document.createElement('script');
        fallback.src = 'https://cdn.worldcoin.org/minikit/v1/minikit.js';
        fallback.async = true;
        fallback.defer = true;
        fallback.setAttribute('data-minikit', 'true');
        fallback.onload = () => resolve();
        fallback.onerror = () => resolve();
        document.head.appendChild(fallback);
      };
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  } catch {}
  mk = getMiniKit();
  return mk;
}

export async function isMiniKitInstalled(mk: any): Promise<boolean> {
  try {
    if (!mk) return false;
    const val = typeof mk.isInstalled === 'function' ? mk.isInstalled() : mk.isInstalled;
    const resolved = typeof (val as any)?.then === 'function' ? await (val as Promise<any>) : val;
    if (resolved != null) return Boolean(resolved);
    const hasApi = Boolean(mk?.commandsAsync || mk?.commands || mk?.actions || mk?.verify);
    return hasApi;
  } catch (e) {
    console.log('[WorldIDVerifyButton] isInstalled check failed', e);
    return false;
  }
}

export function WorldIDVerifyButton({ appId, action, callbackUrl, testID, label }: VerifyButtonProps) {
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uaMemo = useMemo(() => (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '', []);
  const isWorldAppUA = useMemo(() => /(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i.test(uaMemo), [uaMemo]);

  const onPress = useCallback(async () => {
    setError(null);
    console.log('[WorldIDVerifyButton] Pressed. Platform:', Platform.OS);
    if (Platform.OS !== 'web') {
      setError('Please open inside World App');
      return;
    }
    try {
      setBusy(true);
      let mk = await ensureMiniKitLoaded();
      if (!mk && isWorldAppUA) {
        for (let i = 0; i < 150; i++) {
          await new Promise((r) => setTimeout(r, 100));
          mk = getMiniKit();
          if (mk) break;
        }
      }
      if (!mk) {
        console.log('[WorldIDVerifyButton] MiniKit not found after load attempt');
        // Try deep-linking to World App as a fallback
        try {
          const actionId = action || 'psig';
          const signal = '0x12312';
          const verification = 'orb';
          const deeplink = `worldapp://v1/verify?app_id=${encodeURIComponent(appId)}&action=${encodeURIComponent(actionId)}&signal=${encodeURIComponent(signal)}&verification_level=${encodeURIComponent(verification)}&callback_url=${encodeURIComponent(callbackUrl)}`;
          const universal = `https://app.worldcoin.org/verify?app_id=${encodeURIComponent(appId)}&action=${encodeURIComponent(actionId)}&signal=${encodeURIComponent(signal)}&verification_level=${encodeURIComponent(verification)}&callback_url=${encodeURIComponent(callbackUrl)}`;
          console.log('[WorldIDVerifyButton] Redirecting to World App via deep-link');
          // Attempt deep link, then fallback to universal link
          window.location.assign(deeplink);
          setTimeout(() => {
            try { window.location.assign(universal); } catch {}
          }, 800);
          return;
        } catch {
          console.log('[WorldIDVerifyButton] Deep link failed');
        }
        setError('請在 World App 中開啟 | Please open inside World App');
        setBusy(false);
        return;
      }
      const installed = await isMiniKitInstalled(mk);
      if (!installed && !isWorldAppUA) {
        console.log('[WorldIDVerifyButton] mk.isInstalled returned false and UA not WorldApp');
        // Try deep-linking to World App
        try {
          const actionId = action || 'psig';
          const signal = '0x12312';
          const verification = 'orb';
          const deeplink = `worldapp://v1/verify?app_id=${encodeURIComponent(appId)}&action=${encodeURIComponent(actionId)}&signal=${encodeURIComponent(signal)}&verification_level=${encodeURIComponent(verification)}&callback_url=${encodeURIComponent(callbackUrl)}`;
          const universal = `https://app.worldcoin.org/verify?app_id=${encodeURIComponent(appId)}&action=${encodeURIComponent(actionId)}&signal=${encodeURIComponent(signal)}&verification_level=${encodeURIComponent(verification)}&callback_url=${encodeURIComponent(callbackUrl)}`;
          console.log('[WorldIDVerifyButton] Redirecting to World App via deep-link (not installed)');
          window.location.assign(deeplink);
          setTimeout(() => {
            try { window.location.assign(universal); } catch {}
          }, 800);
          return;
        } catch {
          console.log('[WorldIDVerifyButton] Deep link (not installed) failed');
        }
        setError('請在 World App 中開啟 | Please open inside World App');
        setBusy(false);
        return;
      }
      const verifyFn = (
        mk?.commandsAsync?.verify ||
        mk?.commands?.verify ||
        mk?.actions?.verify ||
        mk?.verify
      ) as undefined | ((args: any) => Promise<any>);
      if (!verifyFn) {
        setError('Verification API unavailable');
        setBusy(false);
        return;
      }
      const actionId = action || 'psig';
      console.log('[WorldIDVerifyButton] Calling verify with action:', actionId);
      const result: any = await verifyFn({
        action: actionId,
        signal: '0x12312',
        verification_level: 'orb',
      }).catch(async (err: any) => {
        console.log('[WorldIDVerifyButton] verify threw, retrying once after 500ms', err);
        await new Promise((r) => setTimeout(r, 500));
        return verifyFn({ action: actionId, signal: '0x12312', verification_level: 'orb' });
      });
      const finalPayload = (result?.finalPayload ?? result) as any;
      console.log('[WorldIDVerifyButton] verify result:', finalPayload?.status);
      if (finalPayload?.status === 'error') {
        setBusy(false);
        setError(finalPayload?.error_code ?? 'Verification failed');
        return;
      }
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage?.setItem('worldid:result', JSON.stringify(finalPayload));
        }
      } catch {}
      const url = new URL(callbackUrl);
      url.searchParams.set('result', encodeURIComponent(JSON.stringify(finalPayload)));
      if (typeof window !== 'undefined') {
        window.location.assign(url.toString());
      }
      setBusy(false);
    } catch (e: any) {
      console.error('[WorldIDVerifyButton] error:', e);
      setBusy(false);
      setError(e?.message ?? 'Failed to verify');
    }
  }, [action, appId, callbackUrl, isWorldAppUA]);

  return (
    <View>
      {!!error && <Text style={styles.errorText} testID={testID ? `${testID}-error` : undefined}>{error}</Text>}
      <TouchableOpacity
        style={[styles.button, busy && styles.buttonBusy]}
        onPress={onPress}
        disabled={busy}
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

export async function runWorldVerify({ mk, action, signal }: { mk: any; action: string; signal: string }) {
  const fn = (
    mk?.commandsAsync?.verify ||
    mk?.commands?.verify ||
    mk?.actions?.verify ||
    mk?.verify
  ) as undefined | ((args: any) => Promise<any>);
  if (!fn) throw new Error('Verification API unavailable');
  const payload = { action, signal, verification_level: 'orb' } as const;
  try {
    const res: any = await fn(payload);
    return res?.finalPayload ?? res;
  } catch {
    await new Promise((r) => setTimeout(r, 500));
    const res2: any = await fn(payload);
    return res2?.finalPayload ?? res2;
  }
}

export async function runWalletAuth({ mk, nonce, statement }: { mk: any; nonce: string; statement: string }) {
  const fn = (
    mk?.commandsAsync?.walletAuth ||
    mk?.commands?.walletAuth ||
    mk?.actions?.walletAuth ||
    mk?.walletAuth
  ) as undefined | ((args: any) => Promise<any>);
  if (!fn) throw new Error('WalletAuth API unavailable');
  const args = { nonce, statement } as const;
  try {
    const res: any = await fn(args);
    return res?.finalPayload ?? res;
  } catch {
    await new Promise((r) => setTimeout(r, 400));
    const res2: any = await fn(args);
    return res2?.finalPayload ?? res2;
  }
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
