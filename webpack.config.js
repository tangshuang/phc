const { DefinePlugin } = require('webpack');
const path = require('path');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'none';
const devtool = mode === 'production' ? 'source-map' : undefined;
const alias = {
  'ts-fns': path.resolve(__dirname, 'node_modules/ts-fns/es'),
};
const defines = new DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
});
const fallback = {
};
const optimization = {
  usedExports: true,
  sideEffects: true,
};

module.exports = [
  {
    mode,
    devtool,
    target: 'web',
    entry: path.resolve(__dirname, 'src/worker/index.js'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
      library: 'SFCJS',
      libraryTarget: 'umd',
    },
    resolve: {
      alias,
      fallback,
    },
    plugins: [
      defines,
    ],
    optimization,
  },
  {
    mode,
    devtool,
    target: 'webworker',
    entry: path.resolve(__dirname, 'src/worker/worker.js'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'worker.js',
    },
    resolve: {
      alias,
      fallback,
    },
    plugins: [
      defines,
    ],
    optimization,
  },
  {
    mode: 'none',
    target: 'node',
    entry: path.resolve(__dirname, 'src/bundler/index.js'),
    output: {
      path: __dirname,
      filename: 'bundler.js',
      libraryTarget: 'commonjs2',
    },
    resolve: {
      alias,
      fallback,
    },
    plugins: [
      defines,
    ],
    optimization,
  },
  {
    mode,
    devtool,
    target: 'web',
    entry: path.resolve(__dirname, 'src/index.js'),
    output: {
      path: __dirname,
      filename: 'index.js',
      library: 'SFCJS',
      libraryTarget: 'umd',
    },
    resolve: {
      alias,
      fallback,
    },
    plugins: [
      defines,
    ],
    optimization,
  },
];
