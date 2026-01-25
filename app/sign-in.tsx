import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ensureMiniKitLoaded, getMiniKit, runWalletAuth } from '@/components/worldcoin/IDKitWeb';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ensureMiniKitLoaded, isMiniKitInstalled, runWalletAuth } from '@/components/worldcoin/IDKitWeb';
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
      await Promise.race([
        ensureMiniKitLoaded(),
      step = 'start';
      console.log('[SignIn][step1] Pressed sign-in');
      let mk = await Promise.race([
        ensureMiniKitLoaded().then((loaded) => {
          console.log('[SignIn][step2] ensureMiniKitLoaded resolved', { hasMiniKit: Boolean(loaded) });
          return loaded;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('MiniKit load timeout')), MINIKIT_TIMEOUT_MS)),
      ]);
      if (!mk && MiniKit) {
        console.log('[SignIn][step3] Fallback to static MiniKit');
        mk = MiniKit;
      }
      if (!mk) {
        console.log('[SignIn][step4] MiniKit missing');
        Alert.alert('World App SDK 未載入', '請確認在 World App 內開啟或稍後再試。');
        return;
      }
      console.log('[SignIn][step5] MiniKit available');
      if (typeof mk?.install === 'function') {
        try {
          step = 'install';
          console.log('[SignIn][step6] Calling MiniKit.install');
          const installResult = await mk.install();
          if (installResult?.success === false) {
            console.log('[SignIn] MiniKit.install returned error', installResult?.errorMessage);
          }
        } catch (installError) {
          console.log('[SignIn] MiniKit.install failed', installError);
        }
      }

      const mk = getMiniKit();
      if (!mk?.isInstalled?.()) {
      step = 'check-installed';
      const installed = await isMiniKitInstalled(mk);
      if (!installed) {
        console.log('[SignIn][step7] MiniKit not installed');
        Alert.alert('World App SDK 未就緒', '請確認在 World App 內開啟或稍後再試。');
        return;
      }

      console.log('[SignIn] Calling walletAuth');
      step = 'wallet-auth';
      console.log('[SignIn][step8] Calling walletAuth');
      authTimeout = setTimeout(() => {
        console.log('[SignIn][timeout] Wallet auth drawer not shown within 10s', { step });
        Alert.alert('授權未彈出', '請確認在 World App 內開啟並允許授權。');
      }, 10000);

      const result = await runWalletAuth({
        mk,
        nonce: `psig-${Date.now()}`,
        statement: 'Sign in to PSI-G',
        requestId: `wallet-auth-${Date.now()}`,
      });

      console.log('[SignIn][step9] walletAuth result', { status: result?.status });
      if (result?.status === 'success') {
        console.log('[SignIn] WalletAuth success', result);

        if (result.address) {
          console.log('[SignIn][step10] Connecting wallet', { hasAddress: true });
          await connectWallet(result.address);
        }

        console.log('[SignIn][step11] Setting verified');
        await setVerified(result);

        console.log('[SignIn][step12] Redirect to tabs');
        router.replace('/(tabs)');
      } else if (result?.status === 'error') {
        console.log('[SignIn][step9b] WalletAuth error', { errorCode: result?.error_code });
        Alert.alert('登入失敗', result?.error_code ?? '請稍後再試。');
      }
    } catch (err) {
      console.log('[SignIn] walletAuth cancelled or failed (silent)', err);
      console.log('[SignIn] walletAuth cancelled or failed', err);
      const message = err instanceof Error ? err.message : '登入失敗，請稍後再試。';
      if (message.toLowerCase().includes('cancel')) {
        console.log('[SignIn] WalletAuth cancelled by user');
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