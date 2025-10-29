import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { VerifyCommandInput, ISuccessResult } from '@/types/worldcoin';
import { VerificationLevel } from '@/types/worldcoin';

import { ACTION_ID, VERIFY_SIGNAL } from '@/constants/world';

export interface MiniAppVerifyActionSuccessPayload {
  status: 'success';
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
  version: number;
  [key: string]: unknown;
}

export interface MiniAppVerifyActionErrorPayload {
  status: 'error';
  error_code?: string;
  error?: string;
  [key: string]: unknown;
}

export type MiniAppVerifyActionPayload =
  | MiniAppVerifyActionSuccessPayload
  | MiniAppVerifyActionErrorPayload;

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
      const actionId = action || ACTION_ID;
      const verifyPayload: VerifyCommandInput = {
        action: actionId,
        signal: VERIFY_SIGNAL,
        verification_level: VerificationLevel.Orb,
      };

      if (!mk) {
        console.log('[WorldIDVerifyButton] MiniKit not found after load attempt');
        console.log('[WorldIDVerifyButton] Redirecting user to World App');
        await redirectToWorldApp({
          appId,
          action: verifyPayload.action,
          signal: verifyPayload.signal,
          verificationLevel: verifyPayload.verification_level ?? VerificationLevel.Orb,
          callbackUrl,
        });
        setError('請在 World App 中開啟 | Please open inside World App');
        setBusy(false);
        return;
      }

      const installed = await isMiniKitInstalled(mk);
      if (!installed && !isWorldAppUA) {
        console.log('[WorldIDVerifyButton] mk.isInstalled returned false and UA not WorldApp');
        console.log('[WorldIDVerifyButton] Redirecting user to World App');
        await redirectToWorldApp({
          appId,
          action: verifyPayload.action,
          signal: verifyPayload.signal,
          verificationLevel: verifyPayload.verification_level ?? VerificationLevel.Orb,
          callbackUrl,
        });
        setError('請在 World App 中開啟 | Please open inside World App');
        setBusy(false);
        return;
      }

      const verificationResponse = await runWorldVerify({ mk, payload: verifyPayload });
      console.log('[WorldIDVerifyButton] verify result:', verificationResponse?.status);

      if (verificationResponse.status === 'error') {
        setBusy(false);
        setError(verificationResponse.error_code ?? 'Verification failed');
        return;
      }

      const successPayload = verificationResponse as MiniAppVerifyActionSuccessPayload;
      const verificationResult = {
        payload: successPayload as unknown as ISuccessResult,
        action: verifyPayload.action,
        signal: verifyPayload.signal,
      };

      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage?.setItem('worldid:result', JSON.stringify(verificationResult));
        }
      } catch {}

      const url = new URL(callbackUrl);
      url.searchParams.set('result', encodeURIComponent(JSON.stringify(verificationResult)));
      if (typeof window !== 'undefined') {
        window.location.assign(url.toString());
      }

      setBusy(false);
    } catch (e: any) {
      console.error('[WorldIDVerifyButton] error:', e);
      setBusy(false);
      setError(e?.message ?? 'Failed to verify');
    }
  }, [action, callbackUrl, isWorldAppUA]);

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

interface RedirectOptions {
  appId: string;
  action: VerifyCommandInput['action'];
  signal?: VerifyCommandInput['signal'];
  verificationLevel: VerificationLevel;
  callbackUrl: string;
}

async function redirectToWorldApp({ appId, action, signal, verificationLevel, callbackUrl }: RedirectOptions) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const actionParam = typeof action === 'string' ? action : String(action);
    const signalParam =
      signal == null ? undefined : typeof signal === 'string' ? signal : String(signal);
    const deeplink = `worldapp://v1/verify?app_id=${encodeURIComponent(appId)}&action=${encodeURIComponent(actionParam)}${
      signalParam ? `&signal=${encodeURIComponent(signalParam)}` : ''
    }&verification_level=${encodeURIComponent(verificationLevel)}&callback_url=${encodeURIComponent(callbackUrl)}`;
    const universal = `https://app.worldcoin.org/verify?app_id=${encodeURIComponent(appId)}&action=${encodeURIComponent(
      actionParam
    )}${signalParam ? `&signal=${encodeURIComponent(signalParam)}` : ''}&verification_level=${encodeURIComponent(
      verificationLevel
    )}&callback_url=${encodeURIComponent(callbackUrl)}`;

    window.location.assign(deeplink);
    setTimeout(() => {
      try {
        window.location.assign(universal);
      } catch (error) {
        console.log('[WorldIDVerifyButton] Universal link redirect failed', error);
      }
    }, 800);
  } catch (error) {
    console.log('[WorldIDVerifyButton] Deep link redirect failed', error);
  }
}

export async function runWorldVerify({
  mk,
  payload,
}: {
  mk: any;
  payload: VerifyCommandInput;
}): Promise<MiniAppVerifyActionPayload> {
  const fn = (
    mk?.commandsAsync?.verify ||
    mk?.commands?.verify ||
    mk?.actions?.verify ||
    mk?.verify
  ) as undefined | ((args: VerifyCommandInput) => Promise<any>);
  if (!fn) {
    throw new Error('Verification API unavailable');
  }

  const commandPayload: VerifyCommandInput = {
    ...payload,
    verification_level: payload.verification_level ?? VerificationLevel.Orb,
  };

  const attempt = async () => {
    const response: any = await fn(commandPayload);
    return (response?.finalPayload ?? response) as MiniAppVerifyActionPayload;
  };

  try {
    return await attempt();
  } catch (error) {
    console.log('[WorldIDVerifyButton] verify failed, retrying once', error);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return attempt();
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
