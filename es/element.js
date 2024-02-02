import { useModule } from './loader.js';
import { forEach, appendChild, createElement, getAttribute, resolveUrl, defineProperties, keys } from './utils.js';

export class PHCElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.sandbox = null;
    }

    getUrl() {
        const src = this.getAttribute('src');
        const url = resolveUrl(location.href, src);
        return url;
    }

    getOptions() {}

    async connectedCallback() {
        const url = this.getUrl();
        const options = this.getOptions();
        const [links, cssChunks, jsChunks, htmlChunks] = await useModule(url, options);

        // const baseUrl = resolveUrl(url, '.');
        // const base = document.createElement('base');
        // base.href = baseUrl;
        // appendChild(this.shadowRoot, base);

        useLinks(links, this);
        useCss(cssChunks, this);
        useHtml(htmlChunks, this);
        useJs(jsChunks, this);
    }

    async disconnectedCallback() {
        if (this.sandbox) {
            document.body.removeChild(this.sandbox);
        }
    }
}

function useLinks(links, customElement) {
    const { shadowRoot } = customElement;
    forEach(links, (link) => {
        appendChild(shadowRoot, link);
    });
}

function useCss(cssChunks, customElement) {
    const { shadowRoot } = customElement;
    forEach(cssChunks, (chunk) => {
        const { innerHTML } = chunk;
        // eslint-disable-next-line no-param-reassign
        chunk.innerHTML = innerHTML;
        appendChild(shadowRoot, chunk);
    });
}

function useHtml(htmlChunks, customElement) {
    const { shadowRoot } = customElement;
    forEach(htmlChunks, (el) => {
        appendChild(shadowRoot, el);
    });
}

function useJs(jsChunks, customElement) {
    const scripts = [];
    forEach(jsChunks, (chunk) => {
        const type = getAttribute(chunk, 'type');

        if (type && type !== 'module' && type !== 'text/javascript') {
            return;
        }

        const src = getAttribute(chunk, 'src');
        const text = chunk.innerHTML;

        scripts.push({ text, src, type });
    });

    if (!scripts.length) {
        return;
    }

    runScripts(scripts, customElement);
}

function runScripts(scripts, customElement) {
    const innerContents = scripts
        .map(({ src, text, type }) => {
            const script = createElement('script');
            if (type) {
                script.type = type;
            }
            if (src) {
                script.src = src;
            }
            if (text) {
                script.innerHTML = text;
            }
            return script;
        })
        .map(script => script.outerHTML);
    const innerHTML = innerContents.join('\n');

    const sandbox = createElement('iframe');
    sandbox.style.position = 'fixed';
    sandbox.style.top = '-100em';
    sandbox.style.opacity = '0';

    // const url = customElement.getUrl();
    // const baseUrl = resolveUrl(url, '.');
    // const html = `<base href="${baseUrl}">\n${innerHTML}`;
    const html = innerHTML;
    sandbox.srcdoc = html;
    // eslint-disable-next-line no-param-reassign
    customElement.sandbox = sandbox;

    // 必须先挂载才能生成窗口对象，否则下面的win是空的
    appendChild(document.body, sandbox);

    const win = sandbox.contentWindow;
    const { shadowRoot } = customElement;

    /**
     * 重写接口，以让内部document生效
     */

    const override = (api, map) => {
        const desc = keys(map).reduce((o, key) => {
            // eslint-disable-next-line no-param-reassign
            o[key] = { get: map[key] };
            return o;
        }, {});
        defineProperties(api, desc);
    };

    override(win.HTMLDocument.prototype, {
        body: () => shadowRoot,
        rootElement: () => customElement,
        defaultView: () => window,
        URL: () => document.URL,
        documentURI: () => customElement.getUrl(),
        activeElement: () => document.activeElement,
        doctype: () => document.doctype,
        documentElement: () => shadowRoot,
        firstElementChild: () => shadowRoot.firstElementChild,
        head: () => shadowRoot,
        lastElementChild: () => shadowRoot.lastElementChild,
    });

    const methods = ['querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName', 'getElementsByName', 'getElementsByTagName'];
    const mtdMap = methods.reduce((map, fn) => {
        // eslint-disable-next-line no-param-reassign
        map[fn] = () => (...args) => shadowRoot[fn](...args);
        return map;
    }, {});
    override(win.HTMLDocument.prototype, mtdMap);

    // // 支持组件内定义customeElement，但是注意，会污染全局
    // win.HTMLElement = window.HTMLElement;
    // override(win.CustomElementRegistry.prototype, {
    //     define: () => (...args) => customElements.define(...args),
    //     get: () => (...args) => customElements.get(...args),
    //     getName: () => (...args) => customElements.getName(...args),
    //     upgrade: () => (...args) => customElements.upgrade(...args),
    //     whenDefined: () => (...args) => customElements.whenDefined(...args),
    // });

    win.IS_PHC = 1;
}
