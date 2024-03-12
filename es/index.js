import { bootstrap, define } from './bootstrap.js';

export { define };

const config = {};

const plugins = [];
const createHook = (method) => {
    if (!plugins.some(item => item[method])) {
        return;
    }
    config[method] = (...args) => plugins.reduce(
        (_, plugin) => plugin[method]?.(...args),
        null,
    );
};

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

/**
 * 获取上下文对应的对象
 */
export function getOutsideContext() {
    if (!window.IS_PHC) {
        return;
    }
    const win = document.defaultView;
    return {
        window: win,
        document: win.document,
        shadowRoot: document.body,
        rootElement: document.rootElement,
    };
}
