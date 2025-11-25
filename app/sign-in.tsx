import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ScanLine, RefreshCw, Wallet } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { useUser } from '@/providers/UserProvider';
import { ACTION_ID, API_BASE_URL, WALLET_AUTH_STATEMENT } from '@/constants/world';
import { ensureMiniKitLoaded, getMiniKit, isMiniKitInstalled, runWalletAuth, runWorldVerify } from '@/components/worldcoin/IDKitWeb';

const API_BASE = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

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

type FlowStep = 'idle' | 'wallet' | 'verify' | 'redirect';
type StepStatus = 'pending' | 'active' | 'complete';

export default function SignInScreen() {
  const { currentTheme, settings } = useSettings();
  const { connectWallet, walletAddress: storedWallet } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [ua, setUa] = useState<string>('');
  const [isWorldEnv, setIsWorldEnv] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(storedWallet ?? null);
  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [signingIn, setSigningIn] = useState<boolean>(false);

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
      title: zh ? '登入以繼續' : 'Sign in to continue',
      subtitle: zh ? '使用 World ID 驗證你是真人' : 'Use World ID to confirm you are human',
      openWorld: zh ? '請於 World App 內開啟此頁面' : 'Please open inside World App',
      helper: zh ? '透過 World App 內建掃描器開啟，勿使用系統瀏覽器。' : 'Open via the World App QR scanner, not a system browser.',
      walletStep: zh ? '連接 World 錢包' : 'Connect your World Wallet',
      walletDesc: zh ? '系統會要求簽署 SIWE 訊息以綁定錢包地址。' : 'You will sign a SIWE message so we can bind your wallet address.',
      verifyStep: zh ? '完成 World ID 驗證' : 'Complete World ID verification',
      verifyDesc: zh ? '使用相同錢包地址作為 signal，提交 Proof。' : 'Use the same wallet address as your signal and submit the proof.',
      connectCta: zh ? '一鍵登入' : 'Sign in',
      verifying: zh ? '驗證中…' : 'Verifying…',
      signingIn: zh ? '流程進行中…' : 'Completing sign-in…',
      walletConnecting: zh ? '錢包連線中…' : 'Linking wallet…',
      walletConnected: zh ? '錢包已連接，繼續驗證。' : 'Wallet connected. Continuing verification.',
      verifyRunning: zh ? 'World ID 驗證中…' : 'Submitting World ID proof…',
      verifyDone: zh ? '驗證完成，準備重新導向。' : 'Verification complete. Redirecting…',
      connectedLabel: zh ? '已綁定錢包：' : 'Connected wallet:',
      pendingLabel: zh ? '待處理' : 'Pending',
      activeLabel: zh ? '處理中' : 'In progress',
      completeLabel: zh ? '已完成' : 'Done',
    } as const;
  }, [lang]);

  useEffect(() => {
    const userAgent = (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '';
    setUa(userAgent);
    const detected = /(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i.test(userAgent);
    setIsWorldEnv(detected);
    console.log('[SignIn] UA:', userAgent, 'WorldApp:', detected);
  }, []);

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
    let mk: any | undefined = await ensureMiniKitLoaded();
    if (!mk && (isWorldEnv || /(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i.test(ua))) {
      for (let i = 0; i < 60 && !mk; i++) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        mk = getMiniKit();
      }
    }
    if (!mk) {
      throw new Error(texts.openWorld);
    }
    const installed = await isMiniKitInstalled(mk);
    if (!installed) {
      throw new Error(texts.openWorld);
    }
    return mk;
  }, [isWorldEnv, texts.openWorld, ua]);

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

  const handleSignIn = useCallback(async () => {
    console.log('[SignIn] Starting combined sign-in flow');
    if (Platform.OS !== 'web') {
      setError(texts.openWorld);
      return;
    }
    try {
      setError(null);
      setSigningIn(true);
      setStatusMessage(texts.signingIn);
      setFlowStep('wallet');

      const mk = await resolveMiniKitClient();
      setStatusMessage(texts.walletConnecting);
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
      setStatusMessage(texts.walletConnected);

      setFlowStep('verify');
      console.log('[SignIn] Wallet linked, running World ID verify');
      const proofPayload: any = await runWorldVerify({ mk, action: ACTION_ID, signal: verifiedAddress });
      if (proofPayload?.status === 'error') {
        throw new Error(proofPayload?.error_code ?? (lang === 'zh' ? 'World ID 驗證失敗' : 'World ID verification failed'));
      }

      setStatusMessage(texts.verifyRunning);
      await verifyWorldIdOnServer(proofPayload);
      setFlowStep('redirect');
      setStatusMessage(texts.verifyDone);
      launchCallback(proofPayload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      console.log('[SignIn] Combined flow error', err);
      setError(message);
      setStatusMessage(null);
      setFlowStep('idle');
    } finally {
      setSigningIn(false);
    }
  }, [connectWallet, fetchNonce, lang, launchCallback, resolveMiniKitClient, texts.openWorld, texts.signingIn, texts.verifyDone, texts.verifyRunning, texts.walletConnected, texts.walletConnecting, verifySiweOnServer, verifyWorldIdOnServer]);

  const shortWallet = useMemo(() => {
    if (!walletAddress) return '';
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  const steps = useMemo(() => {
    const walletStatus: StepStatus = flowStep === 'wallet' ? 'active' : walletAddress ? 'complete' : 'pending';
    const verifyStatus: StepStatus = flowStep === 'verify' ? 'active' : flowStep === 'redirect' ? 'complete' : walletAddress ? 'pending' : 'pending';
    return [
      {
        key: 'wallet',
        icon: Wallet,
        title: texts.walletStep,
        description: texts.walletDesc,
        status: walletStatus,
      },
      {
        key: 'verify',
        icon: RefreshCw,
        title: texts.verifyStep,
        description: texts.verifyDesc,
        status: verifyStatus,
      },
    ];
  }, [flowStep, texts.verifyDesc, texts.verifyStep, texts.walletDesc, texts.walletStep, walletAddress]);

  const statusMeta = useMemo(() => ({
    pending: { label: texts.pendingLabel, color: '#6B7280', bg: '#1F2937' },
    active: { label: texts.activeLabel, color: '#FBBF24', bg: '#1E1B4B' },
    complete: { label: texts.completeLabel, color: '#10B981', bg: '#052E16' },
  }), [texts.activeLabel, texts.completeLabel, texts.pendingLabel]);

  const showWorldWarning = Platform.OS === 'web' && !isWorldEnv;

  return (
    <View style={[styles.root, { backgroundColor: currentTheme.background }]}> 
      <LinearGradient colors={currentTheme.gradient as any} style={styles.heroBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <ShieldCheck size={28} color="#FFFFFF" />
            <Text style={styles.title} testID="signin-title">{texts.title}</Text>
            <Text style={styles.subtitle}>{texts.subtitle}</Text>
          </View>

          {showWorldWarning && (
            <View style={styles.worldWarning} testID="world-warning">
              <Text style={styles.worldWarningTitle}>{texts.openWorld}</Text>
              <Text style={styles.worldWarningBody}>{texts.helper}</Text>
            </View>
          )}

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} testID="minikit-init-error">{error}</Text>
            </View>
          )}

          <View style={styles.actions}>
            {steps.map((step) => {
              const Icon = step.icon;
              const meta = statusMeta[step.status];
              return (
                <View key={step.key} style={[styles.stepCard, step.status === 'active' && styles.cardActive, step.status === 'complete' && styles.cardComplete]}>
                  <View style={styles.stepHeader}>
                    <View style={[styles.stepIcon, step.status === 'complete' && styles.stepIconComplete]}>
                      <Icon size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.stepHeaderText}>
                      <Text style={styles.stepLabel}>{step.title}</Text>
                      <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: meta.bg }]}> 
                      <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>
                  {step.key === 'wallet' && walletAddress && (
                    <Text style={styles.connectedText}>{texts.connectedLabel} <Text style={styles.connectedValue}>{shortWallet}</Text></Text>
                  )}
                </View>
              );
            })}

            <TouchableOpacity
              style={[styles.primaryButton, signingIn && styles.btnDisabled]}
              onPress={handleSignIn}
              disabled={signingIn}
              testID="btn-sign-in"
              accessibilityRole="button"
            >
              {signingIn ? (
                <View style={styles.rowCenter}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>{texts.signingIn}</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>{texts.connectCta}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.hint}>
              <ScanLine size={16} color="#6B7280" />
              <Text style={styles.hintText}>{texts.helper}</Text>
            </View>

            {!!statusMessage && (
              <Text style={styles.statusMessage} testID="signin-status">{statusMessage}</Text>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  container: { flex: 1, justifyContent: 'flex-start' },
  header: { paddingTop: 24, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#E5E7EB', marginTop: 6 },
  actions: { marginTop: 24, paddingHorizontal: 24, gap: 16 } as const,
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 10, marginHorizontal: 24, marginTop: 16 },
  errorText: { color: '#B91C1C', fontSize: 12 },
  worldWarning: { backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 16, padding: 16, marginHorizontal: 24, marginTop: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.45)' },
  worldWarningTitle: { color: '#34D399', fontSize: 14, fontWeight: '700' },
  worldWarningBody: { color: '#D1FAE5', fontSize: 12, marginTop: 6, lineHeight: 18 },
  stepCard: { backgroundColor: '#111827', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#1F2937' } as const,
  cardActive: { borderColor: '#FBBF24' },
  cardComplete: { borderColor: '#10B981' },
  stepHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' } as const,
  stepHeaderText: { flex: 1 } as const,
  stepLabel: { color: '#F9FAFB', fontSize: 16, fontWeight: '700' },
  stepDescription: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  stepIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
  stepIconComplete: { backgroundColor: '#065F46' },
  primaryButton: { backgroundColor: '#6366F1', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.7 },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 6 } as const,
  hintText: { color: '#6B7280', fontSize: 12, marginLeft: 6, textAlign: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statusMessage: { textAlign: 'center', fontSize: 12, color: '#9CA3AF' },
  connectedText: { color: '#9CA3AF', fontSize: 12 },
  connectedValue: { color: '#F9FAFB', fontSize: 12, fontWeight: '600' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
});
