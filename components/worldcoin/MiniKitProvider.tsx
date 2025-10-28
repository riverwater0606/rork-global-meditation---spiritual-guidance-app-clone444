import React, { ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';

import { ensureMiniKitLoaded } from './IDKitWeb';
import { APP_ID } from '@/constants/world';

interface Props {
  children: ReactNode;
}

export default function MiniKitProvider({ children }: Props) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let isMounted = true;

    ensureMiniKitLoaded()
      .then((mk) => {
        if (!isMounted) return;
        console.log('[MiniKitProvider] MiniKit script ready');
        try {
          const miniKit = mk ?? (typeof window !== 'undefined' ? (window as any).MiniKit : undefined);
          const installResult = miniKit?.install?.(APP_ID);
          if (installResult && typeof installResult === 'object' && 'success' in installResult && !installResult.success) {
            console.log('[MiniKitProvider] MiniKit install failed', installResult);
          }
        } catch (error) {
          console.log('[MiniKitProvider] MiniKit install threw', error);
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        console.log('[MiniKitProvider] Failed to preload MiniKit', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return <>{children}</>;
}
