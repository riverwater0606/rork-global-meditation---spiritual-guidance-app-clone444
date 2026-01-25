import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
    try {
      let mk = await Promise.race([
        ensureMiniKitLoaded(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('MiniKit load timeout')), MINIKIT_TIMEOUT_MS)),
      ]);
      if (!mk && MiniKit) {
        mk = MiniKit;
      }
      if (!mk) {
        Alert.alert('World App SDK 未載入', '請確認在 World App 內開啟或稍後再試。');
        return;
      }
      if (typeof mk?.install === 'function') {
        try {
          const installResult = await mk.install();
          if (installResult?.success === false) {
            console.log('[SignIn] MiniKit.install returned error', installResult?.errorMessage);
          }
        } catch (installError) {
          console.log('[SignIn] MiniKit.install failed', installError);
        }
      }

      const installed = await isMiniKitInstalled(mk);
      if (!installed) {
        Alert.alert('World App SDK 未就緒', '請確認在 World App 內開啟或稍後再試。');
        return;
      }

      console.log('[SignIn] Calling walletAuth');

      const result = await runWalletAuth({
        mk,
        nonce: `psig-${Date.now()}`,
        statement: 'Sign in to PSI-G',
        requestId: `wallet-auth-${Date.now()}`,
      });

      if (result?.status === 'success') {
        console.log('[SignIn] WalletAuth success', result);

        if (result.address) {
          await connectWallet(result.address);
        }

        await setVerified(result);

        router.replace('/(tabs)');
      } else if (result?.status === 'error') {
        Alert.alert('登入失敗', result?.error_code ?? '請稍後再試。');
      }
    } catch (err) {
      console.log('[SignIn] walletAuth cancelled or failed (silent)', err);
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
