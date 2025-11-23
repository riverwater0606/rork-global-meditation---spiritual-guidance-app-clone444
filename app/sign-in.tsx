import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export default function SignInScreen() {
  const { currentTheme, settings } = useSettings();
  const { connectWallet, walletAddress: storedWallet } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [walletBusy, setWalletBusy] = useState<boolean>(false);
  const [verifyBusy, setVerifyBusy] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [ua, setUa] = useState<string>('');
  const [isWorldEnv, setIsWorldEnv] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(storedWallet ?? null);
  const autoVerifyTried = useRef<boolean>(false);

  useEffect(() => {
    setWalletAddress(storedWallet ?? null);
  }, [storedWallet]);

  const lang = settings.language;

  const callbackUrl = useMemo(() => {
    if (typeof window !== 'undefined' && (window.location?.host?.includes('localhost') || window.location?.host?.includes('127.0.0.1'))) {
      return 'http://localhost:3000/callback';
    }
    return 'https://444-two.vercel.app/callback';
  }, []);

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
      connectCta: zh ? '連接錢包' : 'Connect wallet',
      verifyingCta: zh ? '提交驗證' : 'Submit verification',
      verifying: zh ? '驗證中…' : 'Verifying…',
      walletConnecting: zh ? '錢包連線中…' : 'Connecting wallet…',
      walletConnected: zh ? '錢包已連接，請進行驗證。' : 'Wallet connected. Continue with verification.',
      verifyRunning: zh ? 'World ID 驗證中…' : 'Submitting World ID proof…',
      verifyDone: zh ? '驗證完成，準備重新導向。' : 'Verification complete. Redirecting…',
      connectFirst: zh ? '請先完成錢包連線' : 'Connect your wallet first',
      connectedLabel: zh ? '已綁定錢包：' : 'Connected wallet:',
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

  const verifySiweOnServer = useCallback(async (params: { address: string; message: string; signature: string; nonce: string; }) => {
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

  const handleConnectWallet = useCallback(async () => {
    if (Platform.OS !== 'web') {
      setError(texts.openWorld);
      return;
    }
    try {
      setError(null);
      setStatusMessage(texts.walletConnecting);
      setWalletBusy(true);
      const mk = await resolveMiniKitClient();
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wallet auth failed';
      console.log('[SignIn] wallet auth error', err);
      setError(message);
      setStatusMessage(null);
    } finally {
      setWalletBusy(false);
    }
  }, [connectWallet, fetchNonce, lang, resolveMiniKitClient, texts.openWorld, texts.walletConnected, texts.walletConnecting, verifySiweOnServer]);

  const handleVerify = useCallback(async () => {
    if (Platform.OS !== 'web') {
      setError(texts.openWorld);
      return;
    }
    if (!walletAddress) {
      setError(texts.connectFirst);
      return;
    }
    try {
      setVerifyBusy(true);
      setError(null);
      setStatusMessage(texts.verifyRunning);
      const mk = await resolveMiniKitClient();
      const proofPayload: any = await runWorldVerify({ mk, action: ACTION_ID, signal: walletAddress });
      if (proofPayload?.status === 'error') {
        throw new Error(proofPayload?.error_code ?? (lang === 'zh' ? 'World ID 驗證失敗' : 'World ID verification failed'));
      }
      await verifyWorldIdOnServer(proofPayload);
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage?.setItem('worldid:result', JSON.stringify(proofPayload));
        }
      } catch (storageError) {
        console.log('[SignIn] sessionStorage write failed', storageError);
      }
      const url = new URL(callbackUrl);
      url.searchParams.set('result', encodeURIComponent(JSON.stringify(proofPayload)));
      setStatusMessage(texts.verifyDone);
      if (typeof window !== 'undefined') {
        window.location.assign(url.toString());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      console.log('[SignIn] verify error', err);
      setError(message);
      setStatusMessage(null);
    } finally {
      setVerifyBusy(false);
    }
  }, [callbackUrl, lang, resolveMiniKitClient, texts.connectFirst, texts.openWorld, texts.verifyDone, texts.verifyRunning, walletAddress, verifyWorldIdOnServer]);

  useEffect(() => {
    if (autoVerifyTried.current) return;
    if (Platform.OS !== 'web') return;
    if (!isWorldEnv) return;
    if (!walletAddress) return;
    autoVerifyTried.current = true;
    console.log('[SignIn] Auto verify trigger with saved wallet');
    void handleVerify();
  }, [handleVerify, isWorldEnv, walletAddress]);

  const shortWallet = useMemo(() => {
    if (!walletAddress) return '';
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  return (
    <View style={[styles.root, { backgroundColor: currentTheme.background }]}> 
      <LinearGradient colors={currentTheme.gradient as any} style={styles.heroBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <ShieldCheck size={28} color="#FFFFFF" />
            <Text style={styles.title} testID="signin-title">{texts.title}</Text>
            <Text style={styles.subtitle}>{texts.subtitle}</Text>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} testID="minikit-init-error">{error}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Wallet size={18} color="#10B981" />
                <View>
                  <Text style={styles.stepLabel}>{texts.walletStep}</Text>
                  <Text style={styles.stepDescription}>{texts.walletDesc}</Text>
                </View>
              </View>
              {walletAddress && (
                <Text style={styles.connectedText}>{texts.connectedLabel} <Text style={styles.connectedValue}>{shortWallet}</Text></Text>
              )}
              <TouchableOpacity
                style={[styles.primaryButton, walletBusy && styles.btnDisabled]}
                onPress={handleConnectWallet}
                disabled={walletBusy}
                testID="btn-wallet-connect"
                accessibilityRole="button"
              >
                {walletBusy ? (
                  <View style={styles.rowCenter}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>{texts.walletConnecting}</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>{texts.connectCta}</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <RefreshCw size={18} color="#2563EB" />
                <View>
                  <Text style={styles.stepLabel}>{texts.verifyStep}</Text>
                  <Text style={styles.stepDescription}>{texts.verifyDesc}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.verifyBtn, (verifyBusy || !walletAddress) && styles.btnDisabled]}
                onPress={handleVerify}
                disabled={verifyBusy || !walletAddress}
                testID="btn-worldid-verify"
                accessibilityRole="button"
              >
                {verifyBusy ? (
                  <View style={styles.rowCenter}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={[styles.verifyText, { marginLeft: 8 }]}>{texts.verifying}</Text>
                  </View>
                ) : (
                  <Text style={styles.verifyText}>{texts.verifyingCta}</Text>
                )}
              </TouchableOpacity>
            </View>

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
  stepCard: { backgroundColor: '#111827', borderRadius: 16, padding: 16, gap: 12 } as const,
  stepHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' } as const,
  stepLabel: { color: '#F9FAFB', fontSize: 16, fontWeight: '700' },
  stepDescription: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  primaryButton: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  verifyBtn: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  verifyText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 6 } as const,
  hintText: { color: '#6B7280', fontSize: 12, marginLeft: 6, textAlign: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statusMessage: { textAlign: 'center', fontSize: 12, color: '#9CA3AF' },
  connectedText: { color: '#9CA3AF', fontSize: 12 },
  connectedValue: { color: '#F9FAFB', fontSize: 12, fontWeight: '600' },
});
