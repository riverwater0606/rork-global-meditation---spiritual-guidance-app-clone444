import { Platform } from 'react-native';
import { IS_LOCAL_DEV } from '@/constants/env';

let MiniKit: any = null;
let ResponseEvent: any = null;
let Permission: any = null;

if (!IS_LOCAL_DEV && Platform.OS === 'web') {
  try {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@worldcoin/minikit-js');
    MiniKit = mod.MiniKit;
    ResponseEvent = mod.ResponseEvent;
    Permission = mod.Permission;
  } catch (e) {
    console.warn('MiniKit module failed to load:', e);
  }
}

export { MiniKit, ResponseEvent, Permission };
