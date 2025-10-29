const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@worldcoin/idkit-core': path.resolve(projectRoot, 'node_modules/@worldcoin/idkit-core/build/index.js'),
  'react-native-reanimated': path.resolve(projectRoot, 'polyfills/react-native-reanimated.ts'),
};

module.exports = config;
