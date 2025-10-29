const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native-reanimated': path.resolve(projectRoot, 'polyfills/react-native-reanimated.ts'),
};

module.exports = config;
