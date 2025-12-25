import { Platform } from 'react-native';

let MiniKit: any = null;
let ResponseEvent: any = null;

if (Platform.OS === 'web') {
  try {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@worldcoin/minikit-js');
    MiniKit = mod.MiniKit;
    ResponseEvent = mod.ResponseEvent;
  } catch (e) {
    console.warn('MiniKit module failed to load:', e);
  }
}

export { MiniKit, ResponseEvent };
