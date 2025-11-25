import { Platform } from 'react-native';

let MiniKit: any = null;

if (Platform.OS === 'web') {
  try {
    // @ts-ignore
    const mod = require('@worldcoin/minikit-js');
    MiniKit = mod.MiniKit;
  } catch (e) {
    console.warn('MiniKit module failed to load:', e);
  }
}

export { MiniKit };
