import { bootstrap, define } from './bootstrap.js';

export { define };

const config = {};

const plugins = [];
const createHook = method => config[method] = (...args) => plugins.reduce(
    (_, plugin) => plugin[method]?.(...args),
    null,
);

export function use(plugin) {
    plugins.push(plugin);
}

createHook('onLoadFile');
createHook('onParseChunks');
createHook('onParseCss');
createHook('onParseScript');
createHook('onParseNode');

const currUrl = location.href;
if (document.readyState === 'complete') {
    // 延迟启动，让插件可以更好的加载
    setTimeout(() => {
        bootstrap(currUrl, config);
    }, 32);
}
else {
    addEventListener('load', () => bootstrap(currUrl, config));
}
