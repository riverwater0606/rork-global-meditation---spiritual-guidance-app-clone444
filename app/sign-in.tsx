import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ensureMiniKitLoaded, getMiniKit, isMiniKitInstalled, runWalletAuth } from '@/components/worldcoin/IDKitWeb';
import { useUser } from '@/providers/UserProvider';
import { useRouter } from 'expo-router';
import { IS_LOCAL_DEV } from '@/constants/env';
import { requestWalletAuthNonce, verifyWalletAuthResult } from '@/lib/worldcoin/walletAuth';
import { WALLET_AUTH_STATEMENT } from '@/constants/world';
import { getOpenInWorldAppMessage } from '@/lib/worldcoin/messages';

const MINIKIT_TIMEOUT_MS = 8000;

export default function SignInScreen() {
  const { setVerified, connectWallet, updateProfile, persistAuthToken } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    try {
      setIsSubmitting(true);
      if (IS_LOCAL_DEV) {
        const fakeWalletAddress = '0xFakeDevWallet';
        await connectWallet(fakeWalletAddress);
        await setVerified({ status: 'success', address: fakeWalletAddress, source: 'local-dev' } as any);
        Alert.alert('Local Dev Mode', 'Local Dev Mode: 模擬登入成功');
        router.replace('/(tabs)');
        return;
      }

      await Promise.race([
        ensureMiniKitLoaded(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('MiniKit load timeout')), MINIKIT_TIMEOUT_MS)),
      ]);

      const mk = getMiniKit();
      if (!(await isMiniKitInstalled(mk))) {
        setAuthError(getOpenInWorldAppMessage('zh'));
        return;
      }

      const noncePayload = await requestWalletAuthNonce();

      console.log('[SignIn] Calling walletAuth with backend nonce');

      const result = await runWalletAuth({
        mk,
        nonce: noncePayload.nonce,
        statement: noncePayload.statement || WALLET_AUTH_STATEMENT,
      });

      if (result?.status === 'success') {
        const verifiedSession = await verifyWalletAuthResult(
          result as Record<string, unknown>,
          noncePayload.nonce,
          noncePayload.statement || WALLET_AUTH_STATEMENT
        );
        const walletAddress = verifiedSession.walletAddress || result.address;

        if (!walletAddress) {
          throw new Error('Wallet Auth 未返回錢包地址');
        }

        await connectWallet(walletAddress);
        await persistAuthToken(verifiedSession.sessionToken || verifiedSession.token || null);
        await setVerified((verifiedSession.verification || {
          status: 'success',
          address: walletAddress,
          source: 'wallet-auth-backend',
        }) as any);

        if (verifiedSession.profile) {
          await updateProfile({
            name: verifiedSession.profile.displayName || verifiedSession.profile.username || '',
            email: verifiedSession.profile.email || '',
            username: verifiedSession.profile.username,
            avatarUrl: verifiedSession.profile.avatarUrl,
          });
        }

        router.replace('/(tabs)');
        return;
      }

      setAuthError('Wallet Auth 已取消或未完成');
    } catch (err) {
      console.error('[SignIn] walletAuth failed', err);
      setAuthError(err instanceof Error ? err.message : '登入失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  }, [setVerified, connectWallet, updateProfile, persistAuthToken, router]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#030712', '#0F172A']} style={styles.background} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>PSI-G</Text>
          <Text style={styles.subtitle}>Spiritual Guidance Inside World App</Text>
          <Text style={styles.description}>Use World App wallet authentication to enter PSI-G and unlock meditation, gifting, and spiritual progress in one place.</Text>
          <Text style={styles.caption}>Best experience: open PSI-G directly inside World App.</Text>
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
          <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleSignIn} testID="sign-in-button" disabled={isSubmitting}>
            {isSubmitting ? (
              <View style={styles.buttonRow}>
                <ActivityIndicator size="small" color="#022C22" />
                <Text style={[styles.buttonText, styles.buttonTextBusy]}>Signing In...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
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
  caption: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.52)',
    lineHeight: 18,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#022C22',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonTextBusy: {
    marginLeft: 8,
  },
  errorText: {
    color: '#FCA5A5',
    lineHeight: 20,
  },
});
