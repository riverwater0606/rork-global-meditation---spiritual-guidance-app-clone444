import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ensureMiniKitLoaded, getMiniKit, isMiniKitInstalled, runWalletAuth } from '@/components/worldcoin/IDKitWeb';
import { MiniKit } from '@/constants/minikit';
import { useUser } from '@/providers/UserProvider';
import { useRouter } from 'expo-router';

const MINIKIT_TIMEOUT_MS = 8000;

export default function SignInScreen() {
  const { setVerified, connectWallet } = useUser();
  const router = useRouter();

  const handleSignIn = useCallback(async () => {
    let step = 'init';
    let authTimeout: ReturnType<typeof setTimeout> | null = null;
    try {
      step = 'start';
      console.log('[SignIn][step1]', 'Pressed sign-in');
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isWorldAppUA = /(WorldApp|World App|WorldAppWebView|WorldCoin|Worldcoin)/i.test(userAgent ?? '');
      let didTimeout = false;
      let mk = await Promise.race([
        ensureMiniKitLoaded().then((loaded) => {
          console.log('[SignIn][step2]', 'ensureMiniKitLoaded resolved', { hasMiniKit: Boolean(loaded) });
          return loaded;
        }),
        new Promise<undefined>((resolve) =>
          setTimeout(() => {
            didTimeout = true;
            console.log('[SignIn][step2b]', 'ensureMiniKitLoaded timeout');
            resolve(undefined);
          }, MINIKIT_TIMEOUT_MS),
        ),
      ]);
      if (!mk && isWorldAppUA) {
        console.log('[SignIn][step2c]', 'Polling for injected MiniKit after timeout');
        for (let i = 0; i < 50; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          mk = getMiniKit();
          if (mk) break;
        }
        console.log('[SignIn][step2d]', 'Polling result', { hasMiniKit: Boolean(mk) });
      }
      if (!mk && MiniKit) {
        console.log('[SignIn][step3]', 'Fallback to static MiniKit');
        mk = MiniKit;
      }
      if (!mk) {
        console.log('[SignIn][step4]', 'MiniKit missing');
        const baseMessage = didTimeout
          ? 'World App SDK 載入逾時，請重新開啟或稍後再試。'
          : '請確認在 World App 內開啟或稍後再試。';
        Alert.alert('World App SDK 未載入', baseMessage);
        return;
      }
      console.log('[SignIn][step5]', 'MiniKit available');
      if (typeof mk?.install === 'function') {
        try {
          step = 'install';
          console.log('[SignIn][step6]', 'Calling MiniKit.install');
          const installResult = await mk.install();
          if (installResult?.success === false) {
            console.log('[SignIn][step6b]', 'MiniKit.install returned error', { errorMessage: installResult?.errorMessage });
            Alert.alert('World App SDK 安裝失敗', installResult?.errorMessage ?? '請稍後再試。');
          }
        } catch (installError) {
          console.log('[SignIn][step6c]', 'MiniKit.install failed', installError);
          Alert.alert('World App SDK 安裝失敗', '請稍後再試。');
        }
      }

      step = 'check-installed';
      const installed = await isMiniKitInstalled(mk);
      if (!installed) {
        console.log('[SignIn][step7]', 'MiniKit not installed');
        if (!isWorldAppUA) {
          Alert.alert('World App SDK 未就緒', '請確認在 World App 內開啟或稍後再試。');
          return;
        }
        Alert.alert('World App SDK 未就緒', '仍會嘗試開啟授權，若失敗請重新開啟 World App。');
      }

      step = 'wallet-auth';
      console.log('[SignIn][step8]', 'Calling walletAuth');
      authTimeout = setTimeout(() => {
        console.log('[SignIn][timeout]', 'Wallet auth drawer not shown within 10s', { step });
        Alert.alert('授權未彈出', '請確認在 World App 內開啟並允許授權。');
      }, 10000);

      const result = await runWalletAuth({
        mk,
        nonce: `psig-${Date.now()}`,
        statement: 'Sign in to PSI-G',
        requestId: `wallet-auth-${Date.now()}`,
      });

      console.log('[SignIn][step9]', 'walletAuth result', { status: result?.status });
      if (result?.status === 'success') {
        console.log('[SignIn][step9a]', 'WalletAuth success', result);

        if (result.address) {
          console.log('[SignIn][step10]', 'Connecting wallet', { hasAddress: true });
          await connectWallet(result.address);
        }

        console.log('[SignIn][step11]', 'Setting verified');
        await setVerified(result);

        console.log('[SignIn][step12]', 'Redirect to tabs');
        router.replace('/(tabs)');
      } else if (result?.status === 'error') {
        console.log('[SignIn][step9b]', 'WalletAuth error', { errorCode: result?.error_code });
        Alert.alert('登入失敗', result?.error_code ?? '請稍後再試。');
      } else {
        console.log('[SignIn][step9c]', 'WalletAuth unknown response', result);
        Alert.alert('登入失敗', '授權回應異常，請稍後再試。');
      }
    } catch (err) {
      console.log('[SignIn][step-error]', 'walletAuth cancelled or failed', err);
      const message = err instanceof Error ? err.message : '登入失敗，請稍後再試。';
      if (message.toLowerCase().includes('cancel')) {
        console.log('[SignIn][step-error]', 'WalletAuth cancelled by user');
        Alert.alert('登入已取消', '你已取消授權，請重新嘗試。');
      } else {
        Alert.alert('登入失敗', message);
      }
    } finally {
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
    }
  }, [setVerified, connectWallet, router]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#030712', '#0F172A']} style={styles.background} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>PSI-G</Text>
          <Text style={styles.subtitle}>Secure Sign In with World ID</Text>
          <Text style={styles.description}>Sign to connect your wallet and verify with World ID.</Text>
          <TouchableOpacity style={styles.button} onPress={handleSignIn} testID="sign-in-button">
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030712',
  },
  background: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 22,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#022C22',
    fontSize: 18,
    fontWeight: '700',
  },
});
