import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { useUser } from '@/providers/UserProvider';
import { ACTION_ID, API_BASE_URL, WALLET_AUTH_STATEMENT } from '@/constants/world';
import { ensureMiniKitLoaded, getMiniKit, isMiniKitInstalled, runWalletAuth, runWorldVerify } from '@/components/worldcoin/IDKitWeb';

const API_BASE = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
const WORLD_APP_REQUIRED_ERROR = 'WORLD_APP_REQUIRED';
const GUIDE_URL = 'https://docs.world.org/mini-apps/quick-start/installing';
const MINIKIT_SIGNIN_TIMEOUT_MS = 8000;

async function checkWindowMiniKitInstalledFlag(): Promise<boolean | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  const globalMiniKit = (window as unknown as { MiniKit?: any }).MiniKit;
  if (!globalMiniKit) {
    return null;
  }
  try {
    const candidate = typeof globalMiniKit.isInstalled === 'function' ? globalMiniKit.isInstalled() : globalMiniKit.isInstalled;
    if (candidate && typeof (candidate as Promise<unknown>).then === 'function') {
      const awaited = await (candidate as Promise<unknown>);
      return Boolean(awaited);
    }
    return Boolean(candidate);
  } catch (error) {
    console.log('[SignIn] window.MiniKit isInstalled check failed', error);
    return false;
  }
}

async function loadMiniKitWithCommandTimeout() {
  const mk = await Promise.race<any>([
    ensureMiniKitLoaded(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('MiniKit load timeout')), MINIKIT_SIGNIN_TIMEOUT_MS);
    }),
  ]); // Timeout per MiniKit Quick Start: https://docs.world.org/mini-apps/quick-start/installing
  return mk;
}

type WalletAuthPayload = {
  address?: string;
  wallet_address?: string;
  walletAddress?: string;
  message?: string;
  signature?: string;
  status?: string;
  error_code?: string;
  [key: string]: unknown;
};

type ServerResponse = {
  status?: string;
  address?: string;
  error?: string;
  [key: string]: unknown;
};

export default function SignInScreen() {
  const { currentTheme, settings } = useSettings();
  const { connectWallet, walletAddress: storedWallet } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(storedWallet ?? null);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [showFallback, setShowFallback] = useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  useEffect(() => {
    setWalletAddress(storedWallet ?? null);
  }, [storedWallet]);

  const lang = settings.language;

  const defaultCallbackUrl = useMemo(() => process.env.EXPO_PUBLIC_WORLD_ID_CALLBACK_URL ?? 'https://444-two.vercel.app/callback', []);

  const callbackUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return defaultCallbackUrl;
    }
    try {
      const { origin, hostname } = window.location;
      const normalizedOrigin = origin?.endsWith('/') ? origin.slice(0, -1) : origin;
      const shouldUseOrigin = hostname?.includes('localhost') || hostname?.includes('127.0.0.1') || hostname?.endsWith('.vercel.app');
      if (normalizedOrigin && shouldUseOrigin) {
        return `${normalizedOrigin}/callback`;
      }
    } catch (err) {
      console.log('[SignIn] callbackUrl derivation failed', err);
    }
    return defaultCallbackUrl;
  }, [defaultCallbackUrl]);

  const texts = useMemo(() => {
    const zh = lang === 'zh';
    return {
      eyebrow: zh ? 'PSI-G 身份' : 'PSI-G identity',
      title: zh ? 'World ID 安全登入' : 'World ID secure sign-in',
      body: zh ? '簽署即可連接錢包並完成 World ID 驗證。' : 'Sign once to link your wallet and verify World ID.',
      button: zh ? '使用 World ID 登入' : 'Sign in with World ID',
      buttonLoading: zh ? '處理中…' : 'Signing in…',
      helper: zh ? '抽屜會顯示：錢包權限、Verification level、保持登入。' : 'Drawer shows wallet access, verification level, and Stay signed in.',
      statusPreparing: zh ? '啟動 MiniKit…' : 'Preparing MiniKit…',
      statusDrawer: zh ? '簽署以確認錢包擁有權並登入 PSI-G' : 'Sign to confirm wallet ownership and authenticate to PSI-G',
      statusVerify: zh ? 'World ID 驗證執行中…' : 'Completing World ID verification…',
      fallbackTitle: zh ? '請於 World App 內開啟' : 'Please open in World App',
      fallbackBody: zh ? 'World App 內建瀏覽器才能顯示 World ID 抽屜。' : 'World ID drawer requires the World App in-app browser.',
      guide: zh ? '開啟 World App 指南' : 'Open World App Guide',
      debug: zh ? '以瀏覽器繼續（除錯）' : 'Continue in browser (debug)',
      openWorld: zh ? '請於 World App 內開啟此頁面' : 'Please open inside World App',
      permissionTitle: zh ? '此登入會要求' : 'Permissions requested',
      permissionWallet: zh ? '• 錢包' : '• Wallet',
      permissionVerification: zh ? '• Verification level' : '• Verification level',
      permissionStay: zh ? '• 保持登入' : '• Stay signed in',
    } as const;
  }, [lang]);

  const fetchNonce = useCallback(async (): Promise<string> => {
    const response = await fetch(`${API_BASE}/auth/nonce`, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      const body = await response.text();
      console.log('[SignIn] /auth/nonce failed', body);
      throw new Error(lang === 'zh' ? '伺服器無法提供 nonce' : 'Failed to fetch nonce');
    }
    const payload = (await response.json()) as { nonce?: string };
    if (!payload?.nonce) {
      throw new Error(lang === 'zh' ? 'nonce 回應格式錯誤' : 'Nonce response malformed');
    }
    return payload.nonce;
  }, [lang]);

  const verifySiweOnServer = useCallback(async (params: { address: string; message: string; signature: string; nonce: string }) => {
    const response = await fetch(`${API_BASE}/auth/verify-siwe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    let payload: ServerResponse | null = null;
    try {
      payload = (await response.json()) as ServerResponse;
    } catch (err) {
      console.log('[SignIn] /auth/verify-siwe JSON parse failed', err);
    }
    if (!response.ok || !payload?.address) {
      console.log('[SignIn] /auth/verify-siwe failed payload', payload);
      throw new Error(payload?.error ?? (lang === 'zh' ? '錢包簽署驗證失敗' : 'Wallet signature verification failed'));
    }
    return payload.address;
  }, [lang]);

  const verifyWorldIdOnServer = useCallback(async (proofPayload: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE}/world-id/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proofPayload),
    });
    let payload: ServerResponse | null = null;
    try {
      payload = (await response.json()) as ServerResponse;
    } catch (err) {
      console.log('[SignIn] /world-id/verify JSON parse failed', err);
    }
    if (!response.ok || payload?.status !== 'success') {
      console.log('[SignIn] /world-id/verify failed payload', payload);
      throw new Error(payload?.error ?? (lang === 'zh' ? 'World ID 驗證失敗' : 'World ID verification failed'));
    }
    return payload;
  }, [lang]);

  const resolveMiniKitClient = useCallback(async () => {
    if (Platform.OS !== 'web') {
      throw new Error(WORLD_APP_REQUIRED_ERROR);
    }
    const preInstalled = await checkWindowMiniKitInstalledFlag();
    if (preInstalled === false) {
      throw new Error(WORLD_APP_REQUIRED_ERROR);
    }
    let mk: any | undefined = await loadMiniKitWithCommandTimeout();
    if (!mk) {
      mk = getMiniKit();
    }
    if (!mk) {
      throw new Error(WORLD_APP_REQUIRED_ERROR);
    }
    const installed = await isMiniKitInstalled(mk);
    if (!installed) {
      throw new Error(WORLD_APP_REQUIRED_ERROR);
    }
    return mk;
  }, []);

  const launchCallback = useCallback((payload: Record<string, unknown>) => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage?.setItem('worldid:result', JSON.stringify(payload));
      }
    } catch (storageError) {
      console.log('[SignIn] sessionStorage write failed', storageError);
    }
    const url = new URL(callbackUrl);
    url.searchParams.set('result', encodeURIComponent(JSON.stringify(payload)));
    if (typeof window !== 'undefined') {
      window.location.assign(url.toString());
    }
  }, [callbackUrl]);

  const triggerFallback = useCallback((message?: string) => {
    setFallbackReason(message ?? texts.fallbackBody);
    setShowFallback(true);
  }, [texts.fallbackBody]);

  const handleSignIn = useCallback(async () => {
    console.log('[SignIn] Starting combined sign-in flow');
    if (Platform.OS !== 'web') {
      triggerFallback(texts.openWorld);
      return;
    }
    try {
      setShowFallback(false);
      setFallbackReason(null);
      setError(null);
      setSigningIn(true);
      setStatusMessage(texts.statusPreparing);

      const installState = await checkWindowMiniKitInstalledFlag();
      if (installState === false) {
        triggerFallback(texts.fallbackBody);
        setStatusMessage(null);
        return;
      }

      const mk = await resolveMiniKitClient();

      setStatusMessage(texts.statusDrawer);
      const nonce = await fetchNonce();
      const walletPayload = (await runWalletAuth({ mk, nonce, statement: WALLET_AUTH_STATEMENT })) as WalletAuthPayload;
      if (walletPayload?.status === 'error') {
        throw new Error(walletPayload.error_code ?? (lang === 'zh' ? 'WalletAuth 失敗' : 'Wallet auth failed'));
      }

      const normalizedAddress = (walletPayload?.address ?? walletPayload?.wallet_address ?? walletPayload?.walletAddress) as string | undefined;
      const message = walletPayload?.message as string | undefined;
      const signature = walletPayload?.signature as string | undefined;
      if (!normalizedAddress || !message || !signature) {
        throw new Error(lang === 'zh' ? 'WalletAuth 回傳資料不完整' : 'Wallet auth response missing fields');
      }

      const verifiedAddress = await verifySiweOnServer({ address: normalizedAddress, message, signature, nonce });
      await connectWallet(verifiedAddress);
      setWalletAddress(verifiedAddress);

      setStatusMessage(texts.statusVerify);
      const proofPayload: any = await runWorldVerify({ mk, action: ACTION_ID, signal: verifiedAddress });
      if (proofPayload?.status === 'error') {
        throw new Error(proofPayload?.error_code ?? (lang === 'zh' ? 'World ID 驗證失敗' : 'World ID verification failed'));
      }

      await verifyWorldIdOnServer(proofPayload);
      launchCallback(proofPayload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      console.log('[SignIn] Combined flow error', err);
      if (err instanceof Error && err.message === WORLD_APP_REQUIRED_ERROR) {
        triggerFallback(texts.fallbackBody);
      } else {
        setError(message);
      }
      setStatusMessage(null);
    } finally {
      setSigningIn(false);
    }
  }, [connectWallet, fetchNonce, lang, launchCallback, resolveMiniKitClient, texts.fallbackBody, texts.openWorld, texts.statusDrawer, texts.statusPreparing, texts.statusVerify, triggerFallback, verifySiweOnServer, verifyWorldIdOnServer]);

  const handleOpenGuide = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(GUIDE_URL, '_blank', 'noopener');
      return;
    }
    Linking.openURL(GUIDE_URL).catch((err) => console.log('[SignIn] Failed to open guide', err));
  }, []);

  const handleContinueBrowser = useCallback(() => {
    setShowFallback(false);
    setFallbackReason(null);
    setError(null);
  }, []);

  const shortWallet = useMemo(() => {
    if (!walletAddress) return '';
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  return (
    <View style={[styles.root, { backgroundColor: currentTheme.background }]}> 
      <LinearGradient colors={currentTheme.gradient as any} style={styles.heroBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <ShieldCheck size={28} color="#0A0A0A" />
            </View>
            <Text style={styles.eyebrow}>{texts.eyebrow}</Text>
            <Text style={styles.title} testID="signin-title">{texts.title}</Text>
            <Text style={styles.subtitle}>{texts.body}</Text>
            {!!walletAddress && (
              <Text style={styles.connectedText}>Connected: <Text style={styles.connectedValue}>{shortWallet}</Text></Text>
            )}
          </View>

          {showFallback && (
            <View style={styles.fallbackCard} testID="world-fallback">
              <Text style={styles.fallbackTitle}>{texts.fallbackTitle}</Text>
              <Text style={styles.fallbackBody}>{fallbackReason ?? texts.fallbackBody}</Text>
              <TouchableOpacity style={styles.fallbackPrimary} onPress={handleOpenGuide} testID="fallback-guide">
                <Text style={styles.fallbackPrimaryText}>{texts.guide}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fallbackSecondary} onPress={handleContinueBrowser} testID="fallback-continue">
                <Text style={styles.fallbackSecondaryText}>{texts.debug}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!showFallback && !!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} testID="minikit-init-error">{error}</Text>
            </View>
          )}

          <View style={styles.ctaBlock}>
            <TouchableOpacity
              style={[styles.primaryButton, signingIn && styles.btnDisabled]}
              onPress={handleSignIn}
              disabled={signingIn}
              testID="btn-sign-in"
              accessibilityRole="button"
            >
              {signingIn ? (
                <View style={styles.rowCenter}>
                  <ActivityIndicator color="#050C1F" size="small" />
                  <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>{texts.buttonLoading}</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>{texts.button}</Text>
              )}
            </TouchableOpacity>

            {!!statusMessage && (
              <Text style={styles.statusMessage} testID="signin-status">{statusMessage}</Text>
            )}

            <View style={styles.permissionsCard}>
              <Text style={styles.permissionsTitle}>{texts.permissionTitle}</Text>
              <Text style={styles.permissionLine}>{texts.permissionWallet}</Text>
              <Text style={styles.permissionLine}>{texts.permissionVerification}</Text>
              <Text style={styles.permissionLine}>{texts.permissionStay}</Text>
            </View>

            <Text style={styles.helperText}>{texts.helper}</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  container: { flex: 1, justifyContent: 'space-between', paddingBottom: 32 },
  hero: { paddingTop: 48, paddingHorizontal: 24, gap: 10 },
  iconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: 'rgba(255,255,255,0.72)', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  subtitle: { fontSize: 15, color: '#E5E7EB', lineHeight: 22 },
  connectedText: { color: '#93C5FD', fontSize: 12 },
  connectedValue: { fontWeight: '700', color: '#FFFFFF' },
  fallbackCard: { backgroundColor: '#0B1221', borderRadius: 20, marginHorizontal: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)', gap: 12 },
  fallbackTitle: { color: '#F87171', fontSize: 16, fontWeight: '700' },
  fallbackBody: { color: '#E5E7EB', fontSize: 13, lineHeight: 20 },
  fallbackPrimary: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  fallbackPrimaryText: { color: '#04121C', fontWeight: '700' },
  fallbackSecondary: { borderColor: '#1F2937', borderWidth: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  fallbackSecondaryText: { color: '#9CA3AF', fontWeight: '600' },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 10, marginHorizontal: 24 },
  errorText: { color: '#B91C1C', fontSize: 12 },
  ctaBlock: { paddingHorizontal: 24, gap: 16 },
  primaryButton: { backgroundColor: '#F9FAFB', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  primaryButtonText: { color: '#050C1F', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.7 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statusMessage: { textAlign: 'center', fontSize: 12, color: '#E5E7EB' },
  permissionsCard: { backgroundColor: 'rgba(15,23,42,0.65)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)', gap: 6 },
  permissionsTitle: { color: '#F9FAFB', fontWeight: '700', fontSize: 14 },
  permissionLine: { color: '#CBD5F5', fontSize: 13 },
  helperText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});
