import React, { ReactNode } from 'react';
// import { Platform } from 'react-native';

// let LibProvider: React.ComponentType<{ children: ReactNode }> | null = null;
// if (Platform.OS === 'web') {
//   try {
//     // eslint-disable-next-line @typescript-eslint/no-var-requires
//     LibProvider = require('@worldcoin/minikit-js/minikit-provider').MiniKitProvider as React.ComponentType<{ children: ReactNode }>;
//   } catch (e) {
//     console.log('[MiniKitProvider] Not available on web yet', e);
//   }
// }

interface Props { children: ReactNode }

export default function MiniKitProvider({ children }: Props) {
  // if (Platform.OS === 'web' && LibProvider) {
  //   return <LibProvider>{children}</LibProvider>;
  // }
  return <>{children}</>;
}