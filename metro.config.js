const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.resolver.sourceExts = Array.from(new Set([...(config.resolver.sourceExts || []), 'cjs']));
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@worldcoin/minikit-js': path.resolve(projectRoot, 'node_modules/@worldcoin/minikit-js/build'),
};

module.exports = config;
