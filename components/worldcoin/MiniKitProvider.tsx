import React, { ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';

import { ensureMiniKitLoaded } from './IDKitWeb';

interface Props {
  children: ReactNode;
}

export default function MiniKitProvider({ children }: Props) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let isMounted = true;

    ensureMiniKitLoaded()
      .then(() => {
        if (!isMounted) return;
        console.log('[MiniKitProvider] MiniKit script ready');
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
