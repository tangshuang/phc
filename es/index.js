import { bootstrap } from './bootstrap.js';

const config = {};

const plugins = [];
const createHook = method => config[method] = (...args) => {
    plugins.forEach((plugin) => {
        plugin[method]?.(...args);
    });
};

export function use(plugin) {
    plugins.push(plugin);
}

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
