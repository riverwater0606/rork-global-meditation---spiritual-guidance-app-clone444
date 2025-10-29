module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@worldcoin/idkit-core': './node_modules/@worldcoin/idkit-core/build/index',
            'react-native-reanimated': './polyfills/react-native-reanimated',
          },
        },
      ],
    ],
  };
};
