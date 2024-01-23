import { useModule } from './loader.js';
import { getStringHash, createSafeExp, forEach, appendChild, keys, createElement, getAttribute, querySelectorAll, defineProperty, getAttributeNames } from './utils.js';

export const PHC_COMPONENTS = {};

export function useComponent(absUrl, options) {
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
            const [, links, cssChunks, jsChunks, htmlChunks] = await useModule(absUrl, options);
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

    function useLinks(links, customElement) {
        const { shadowRoot } = customElement;
        forEach(links, (link) => {
            if (link.rel === 'phc') {
                useLinkAsComponent(link, customElement);
            }
            else {
                // eslint-disable-next-line no-underscore-dangle
                appendChild(shadowRoot, link.__link);
            }
        });
    }

    function useLinkAsComponent(link, customElement) {
        const { components } = customElement;
        const { href, as: name } = link;
        components[name] = useComponent(href, options);
    }

    function createCss(cssChunks, customElement) {
        const { shadowRoot, components, componentPrefix } = customElement;
        const componentNames = keys(components);
        forEach(cssChunks, (chunk) => {
            let { innerHTML } = chunk;
            forEach(componentNames, (name) => {
                const customElementName = `${componentPrefix}-${name}`;
                const reg = new RegExp(`([\\n|\\s|(|)|}|+|>])${createSafeExp(name)}([\\s|\\{])`, 'g');
                if (reg.test(chunk.innerHTML)) {
                    innerHTML = innerHTML.replace(reg, `$1${customElementName}$2`);
                }
            });
            // eslint-disable-next-line no-param-reassign
            chunk.innerHTML = innerHTML;
            appendChild(shadowRoot, chunk);
        });
    }

    function createHtml(htmlChunks, customElement) {
        const { components, shadowRoot  } = customElement;
        const componentNames = keys(components);
        if (componentNames.length) {
            createHtmlAndComponents(htmlChunks, customElement);
        }
        else {
            forEach(htmlChunks, (el) => {
                appendChild(shadowRoot, el);
            });
        }
    }

    function createHtmlAndComponents(htmlChunks, customElement) {
        const { shadowRoot, components, componentPrefix } = customElement;
        const componentNames = keys(components);
        const componentMap = {};
        forEach(componentNames, (name) => {
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

        forEach(htmlChunks, (chunk) => {
            forEach(componentNames, (name) => {
                const customElementName = `${componentPrefix}-${name}`;
                const replace = (el) => {
                    const node = createElement(customElementName);
                    const attrNames = getAttributeNames(el);
                    forEach(attrNames, (attr) => {
                        const value = getAttribute(el, attr);
                        node.setAttribute(attr, value);
                    });
                    forEach(el.childNodes, (child) => {
                        appendChild(node, child);
                    });
                    return node;
                };

                const els = querySelectorAll(chunk, name);
                forEach(els, (el) => {
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
            appendChild(shadowRoot, chunk);
        });
    }

    async function createJs(jsChunks, customElement) {
        const scripts = [];
        await Promise.all(jsChunks.map(async (chunk) => {
            const type = getAttribute(chunk, 'type');

            if (type && type !== 'module' && type !== 'text/javascript') {
                return;
            }

            const src = getAttribute(chunk, 'src');
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
        sandbox.srcdoc = innerHTML;
        // eslint-disable-next-line no-param-reassign
        customElement.sandbox = sandbox;

        // 必须先挂载才能生成窗口对象，否则下面的win是空的
        appendChild(document.body, sandbox);

        const win = sandbox.contentWindow;
        const { shadowRoot } = customElement;
        win.Document = function () {
            defineProperty(shadowRoot, 'rootElement', { get: () => customElement });
            return shadowRoot;
        };
        win.Window = function () {
            return window;
        };
    }
}
