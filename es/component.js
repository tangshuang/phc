import { useModule } from './loader.js';
import { getStringHash, createSafeExp } from './utils.js';

export const PHC_COMPONENTS = {};

export function useComponent(absUrl) {
    if (PHC_COMPONENTS[absUrl]) {
        return PHC_COMPONENTS[absUrl];
    }

    const hash = getStringHash(absUrl);
    const prefix = `phc-${hash}`;

    class PHCElement extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.sandbox = null;
            this.components = {};
            this.componentPrefix = prefix;
        }

        async connectedCallback() {
            const [, links, cssChunks, jsChunks, htmlChunks] = await useModule(absUrl);
            useLinks(links, this);
            createCss(cssChunks, this);
            createHtml(htmlChunks, this);
            createJs(jsChunks, this);
        }

        async disconnectedCallback() {
            if (this.sandbox) {
                document.body.removeChild(this.sandbox);
            }
        }
    }

    PHC_COMPONENTS[absUrl] = PHCElement;

    return PHCElement;
}

function useLinks(links, customElement) {
    const { shadowRoot } = customElement;
    links.forEach((link) => {
        if (link.rel === 'phc') {
            useLinkAsComponent(link, customElement);
        }
        else {
            // eslint-disable-next-line no-underscore-dangle
            shadowRoot.appendChild(link.__link);
        }
    });
}

function useLinkAsComponent(link, customElement) {
    const { components } = customElement;
    const { href, as: name } = link;
    components[name] = useComponent(href);
}

function createCss(cssChunks, customElement) {
    const { shadowRoot, components, componentPrefix } = customElement;
    const componentNames = Object.keys(components);
    cssChunks.forEach((chunk) => {
        let { innerHTML } = chunk;
        componentNames.forEach((name) => {
            const customElementName = `${componentPrefix}-${name}`;
            const reg = new RegExp(`([\\n|\\s|(|)|}|+|>])${createSafeExp(name)}([\\s|\\{])`, 'g');
            if (reg.test(chunk.innerHTML)) {
                innerHTML = innerHTML.replace(reg, `$1${customElementName}$2`);
            }
        });
        // eslint-disable-next-line no-param-reassign
        chunk.innerHTML = innerHTML;
        shadowRoot.appendChild(chunk);
    });
}

function createHtml(htmlChunks, customElement) {
    const { components, shadowRoot  } = customElement;
    const componentNames = Object.keys(components);
    if (componentNames.length) {
        createHtmlAndComponents(htmlChunks, customElement);
    }
    else {
        htmlChunks.forEach((el) => {
            shadowRoot.appendChild(el);
        });
    }
}

function createHtmlAndComponents(htmlChunks, customElement) {
    const { shadowRoot, components, componentPrefix } = customElement;
    const componentNames = Object.keys(components);
    const componentMap = {};
    componentNames.forEach((name) => {
        const customElementName = `${componentPrefix}-${name}`;
        if (!customElements.get(customElementName)) {
            customElements.define(customElementName, components[name]);
        }
        const key = name.split('-')
            .map(str => str.replace(str[0], str[0].toUpperCase()))
            .join('');
        componentMap[key] = customElementName;
    });
    // patch component map
    shadowRoot.components = componentMap;

    htmlChunks.forEach((chunk) => {
        componentNames.forEach((name) => {
            const customElementName = `${componentPrefix}-${name}`;
            const replace = (el) => {
                const node = document.createElement(customElementName);
                const attrNames = el.getAttributeNames();
                attrNames.forEach((attr) => {
                    const value = el.getAttribute(attr);
                    node.setAttribute(attr, value);
                });
                el.childNodes.forEach((child) => {
                    node.appendChild(child);
                });
                return node;
            };

            const els = chunk.querySelectorAll(name);
            els.forEach((el) => {
                const node = replace(el);
                el.replaceWith(node);
            });

            // 替换自身
            if (chunk.nodeName.toLowerCase() === name) {
                const node = replace(chunk);
                // eslint-disable-next-line no-param-reassign
                chunk = node;
            }
        });
        shadowRoot.appendChild(chunk);
    });
}

async function createJs(jsChunks, customElement) {
    const scripts = [];
    await Promise.all(jsChunks.map(async (chunk) => {
        const type = chunk.getAttribute('type');

        if (type && type !== 'module' && type !== 'text/javascript') {
            return;
        }

        const src = chunk.getAttribute('src');
        const text = chunk.innerHTML;

        scripts.push({ text, src, type });
    }));

    if (!scripts.length) {
        return;
    }

    await runScripts(scripts, customElement);
}

async function runScripts(scripts, customElement) {
    const innerContents = scripts
        .map(({ src, text, type }) => {
            const script = document.createElement('script');
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

    const sandbox = document.createElement('iframe');
    sandbox.style.position = 'fixed';
    sandbox.style.top = '-100000px';
    sandbox.style.opacity = '0';
    sandbox.srcdoc = innerHTML;
    // eslint-disable-next-line no-param-reassign
    customElement.sandbox = sandbox;

    // 必须先挂载才能生成窗口对象，否则下面的win是空的
    document.body.appendChild(sandbox);

    const win = sandbox.contentWindow;
    const { shadowRoot } = customElement;
    win.Document = function () {
        Object.defineProperty(shadowRoot, 'rootElement', { get: () => customElement });
        return shadowRoot;
    };
    win.Window = function () {
        return window;
    };
}
