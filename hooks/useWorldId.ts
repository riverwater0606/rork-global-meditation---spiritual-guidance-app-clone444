import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import type { ISuccessResult, VerifyCommandInput } from '@worldcoin/minikit-js';
import { VerificationLevel } from '@worldcoin/minikit-js';

import {
  ensureMiniKitLoaded,
  getMiniKit,
  isMiniKitInstalled,
  redirectToWorldApp,
  runWorldVerify,
} from '@/components/worldcoin/IDKitWeb';
import { ACTION_ID, APP_ID, CALLBACK_URL, VERIFY_SIGNAL } from '@/constants/world';
import { useUser, type WorldIDVerificationResult } from '@/providers/UserProvider';

interface UseWorldIdResult {
  isVerified: boolean;
  isVerifying: boolean;
  verificationError: string | null;
  lastVerification: WorldIDVerificationResult | null;
  startVerification: () => Promise<WorldIDVerificationResult | void>;
  resetError: () => void;
  isWidgetBusy: boolean;
}

const WORLD_APP_USER_AGENT_REGEX = /(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i;

const DEFAULT_CALLBACK_FALLBACK = 'https://meditation-v2-rebuild.vercel.app/callback';

export function useWorldId(): UseWorldIdResult {
  const { isVerified, isVerifying, setVerified, verification, verificationError } = useUser();
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [widgetBusy, setWidgetBusy] = useState(false);
  const [lastVerification, setLastVerification] = useState<WorldIDVerificationResult | null>(
    verification,
  );

  useEffect(() => {
    setLastVerification(verification);
  }, [verification]);

  const resetError = useCallback(() => {
    setWidgetError(null);
  }, []);

  const resolvedCallbackUrl = useMemo(() => {
    if (CALLBACK_URL && CALLBACK_URL.trim().length > 0) {
      return CALLBACK_URL;
    }
    if (typeof window !== 'undefined') {
      const origin = window.location?.origin ?? DEFAULT_CALLBACK_FALLBACK;
      return `${origin.replace(/\/$/, '')}/callback`;
    }
    return DEFAULT_CALLBACK_FALLBACK;
  }, []);

  const computeSignal = useCallback(() => {
    const base = VERIFY_SIGNAL && VERIFY_SIGNAL.trim().length > 0 ? VERIFY_SIGNAL : 'world-signal';
    return `${base}:${Date.now().toString(16)}`;
  }, []);

  const startVerification = useCallback(async () => {
    if (Platform.OS !== 'web') {
      const message =
        'World ID verification is only available from the World App webview. Please open the mini app inside World App.';
      setWidgetError(message);
      Alert.alert('World ID', message);
      return;
    }

    try {
      setWidgetBusy(true);
      setWidgetError(null);

      const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '';
      const isWorldApp = WORLD_APP_USER_AGENT_REGEX.test(ua);

      const verifyPayload: VerifyCommandInput = {
        action: ACTION_ID,
        signal: computeSignal(),
        verification_level: VerificationLevel.Orb,
      };

      let mk = await ensureMiniKitLoaded();
      if (!mk && isWorldApp) {
        for (let i = 0; i < 40 && !mk; i++) {
          await new Promise((resolve) => setTimeout(resolve, 120));
          mk = getMiniKit();
        }
      }

      if (!mk) {
        await redirectToWorldApp({
          appId: APP_ID,
          action: verifyPayload.action,
          signal: verifyPayload.signal,
          verificationLevel: verifyPayload.verification_level ?? VerificationLevel.Orb,
          callbackUrl: resolvedCallbackUrl,
        });
        const message = 'Please open inside World App to complete verification.';
        setWidgetError(message);
        throw new Error(message);
      }

      const installed = await isMiniKitInstalled(mk);
      if (!installed && !isWorldApp) {
        await redirectToWorldApp({
          appId: APP_ID,
          action: verifyPayload.action,
          signal: verifyPayload.signal,
          verificationLevel: verifyPayload.verification_level ?? VerificationLevel.Orb,
          callbackUrl: resolvedCallbackUrl,
        });
        const message = 'Please open inside World App to finish verification.';
        setWidgetError(message);
        throw new Error(message);
      }

      const result = await runWorldVerify({ mk, payload: verifyPayload });
      if (result.status === 'error') {
        const message = result.error_code ?? result.error ?? 'Verification failed';
        setWidgetError(message);
        throw new Error(message);
      }

      const successPayload = result as unknown as ISuccessResult;
      const verificationResult: WorldIDVerificationResult = {
        payload: successPayload,
        action: verifyPayload.action,
        signal: verifyPayload.signal,
      };

      await setVerified(verificationResult);
      setLastVerification(verificationResult);

      return verificationResult;
    } catch (error) {
      console.error('[useWorldId] verification error', error);
      if (error instanceof Error) {
        setWidgetError(error.message);
      } else {
        setWidgetError('Verification failed');
      }
      throw error;
    } finally {
      setWidgetBusy(false);
    }
  }, [computeSignal, resolvedCallbackUrl, setVerified]);

  const mergedError = useMemo(() => {
    if (verificationError) return verificationError;
    if (widgetError) return widgetError;
    return null;
  }, [verificationError, widgetError]);

  return {
    isVerified,
    isVerifying: isVerifying || widgetBusy,
    verificationError: mergedError,
    lastVerification,
    startVerification,
    resetError,
    isWidgetBusy: widgetBusy,
  };
}

export type { WorldIDVerificationResult } from '@/providers/UserProvider';
