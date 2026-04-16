module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@types': './src/types',
            '@storage': './src/storage',
            '@utils': './src/utils',
            '@screens': './src/screens',
            '@components': './src/components',
            '@navigation': './src/navigation',
            '@hooks': './src/hooks',
            '@constants': './src/constants',
          },
        },
      ],
    ],
  };
};
