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
        entry: path.resolve(__dirname, 'es/index.js'),
        output: {
            path: __dirname,
            filename: 'index.js',
            library: 'phc',
            libraryTarget: 'window',
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
