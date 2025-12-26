import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useSettings } from '@/providers/SettingsProvider';
import { useUser } from '@/providers/UserProvider';
import { CheckCircle } from 'lucide-react-native';

export default function CallbackScreen() {
  const params = useLocalSearchParams<{ result?: string }>();
  const { currentTheme, settings } = useSettings();
  const { setVerified } = useUser();
  const [error, setError] = useState<string | null>(null);

  const hasRunRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const run = async () => {
      try {
        let obj: any | null = null;

        if (typeof params.result === 'string') {
          try {
            const decoded = decodeURIComponent(params.result);
            obj = JSON.parse(decoded);
          } catch {
            console.log('[Callback] query parse failed, trying sessionStorage');
          }
        }

        if (!obj && typeof window !== 'undefined') {
          try {
            const fromSession = window.sessionStorage?.getItem('worldid:result');
            if (fromSession) {
              obj = JSON.parse(fromSession);
            }
          } catch {}
        }

        if (obj) {
          try {
            await setVerified(obj as any);
          } catch {
            console.log('[Callback] setVerified failed');
          }
          console.log('[Callback] Parsed result', obj);
          setTimeout(() => {
            try {
              router.replace('/');
            } catch {}
          }, 800);

        } else {
          setError('No result provided');
        }
      } catch (e) {
        console.error('[Callback] parse error', e);
        setError((e as Error).message);
      }
    };

    void run();
  }, [params.result, setVerified]);

  const lang = settings.language;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        {error ? (
          <View style={styles.centerContent}>
            <Text style={[styles.error, { color: '#EF4444' }]} testID="callback-error">{error}</Text>
          </View>
        ) : (
          <View style={styles.centerContent} testID="callback-result">
            <CheckCircle size={64} color="#10B981" />
            <Text style={[styles.title, { color: currentTheme.text, marginTop: 20 }]}>
              {lang === 'zh' ? '驗證成功' : 'Verification Success'}
            </Text>
            <Text style={{ color: currentTheme.textSecondary, marginTop: 12, textAlign: 'center' }}>
              {lang === 'zh' ? '正在跳轉...' : 'Redirecting...'}
            </Text>
            <ActivityIndicator size="small" color={currentTheme.primary} style={{ marginTop: 16 }} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  centerContent: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  error: { fontSize: 16, textAlign: 'center' },
});
