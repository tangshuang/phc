import { loadFile, loadModule } from './loader.js';
import { getStringHash } from './utils.js';

export const PHC_COMPONENTS = {};

export function useComponent(absUrl) {
    if (PHC_COMPONENTS[absUrl]) {
        return PHC_COMPONENTS[absUrl];
    }

    const hash = getStringHash(absUrl);
    const prefix = `phc-${hash}`;

    class PHC_Element extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.components = {};
            this.sandbox = null;
        }

        async connectedCallback() {
            const { cssChunks, jsChunks, htmlChunks, metas, links } = await loadModule(absUrl);

            this.useLinks(links);
            this.createCss(cssChunks);
            this.createHtml(htmlChunks);
            this.createJs(jsChunks);
        }

        async disconnectedCallback() {
            if (this.sandbox) {
                document.body.removeChild(this.sandbox);
            }
        }

        useLinks(links) {
            links.forEach((link) => {
                if (link.rel === 'phc') {
                    this.useLinkAsComponent(link);
                }
                else {
                    this.shadowRoot.appendChild(link.__link);
                }
            });
        }

        useLinkAsComponent(link) {
            const { href, as: name } = link;
            this.components[name] = useComponent(href);
        }

        createCss(cssChunks) {
            cssChunks.forEach((chunk) => {
                this.shadowRoot.appendChild(chunk);
            });
        }

        createHtml(htmlChunks) {
            const componentNames = Object.keys(this.components);
            if (componentNames.length) {
                this.createHtmlAndComponents(htmlChunks);
            }
            else {
                htmlChunks.forEach((el) => {
                    this.shadowRoot.appendChild(el);
                });
            }
        }

        createHtmlAndComponents(htmlChunks) {
            const componentNames = Object.keys(this.components);
            htmlChunks.forEach((chunk) => {
                componentNames.forEach((name) => {
                    const els = chunk.querySelectorAll(name);
                    els.forEach((el) => {
                        const node = document.createElement(`${prefix}-${name}`);
                        const attrNames = el.getAttributeNames();
                        attrNames.forEach((attr) => {
                            const value = el.getAttribute(attr);
                            node.setAttribute(attr, value);
                        });
                        el.childNodes.forEach((child) => {
                            node.appendChild(child);
                        });
                        el.replaceWith(node);
                    });
                });
                this.shadowRoot.appendChild(chunk);
            });
        }

        async createJs(jsChunks) {
            const scripts = [];
            await new Promise.all(jsChunks.map(async (chunk) => {
                const type = chunk.getAttribute('type');

                if (type && type !== 'module' && type !== 'text/javascript') {
                    return;
                }

                const src = chunk.getAttribute('src');
                const text = src ? await loadFile(src) : chunk.innerText;

                if (type === 'module') {
                    await this.generateModuleScript(text, src, scripts);
                }
                else {
                    scripts.push({ text, src, type });
                }
            }));

            if (!scripts.length) {
                return;
            }

            await this.runScripts(scripts);
        }

        async generateModuleScript(scriptText, src, scripts, isDep) {
            const defers = [];
            const push = (fileurl) => {
                const ctx = { src: fileurl, type: 'file' };
                if (isDep) {
                    scripts.unshift(ctx);
                }
                else {
                    scripts.push(ctx);
                }
                const defer = loadFile(fileurl).then(async (text) => {
                    const t = await this.generateModuleScript(text, fileurl, scripts, true);
                    ctx.text = t;
                });
                defers.push(defer);
            };
            const text = scriptText
                .replace(/import\s*['"](.*?)['"](;|(\s*\n))/gm, (matched, href) => {
                    const fileurl = resolveUrl(src, href);
                    push(fileurl);
                    return `import "${fileurl}";\n`;
                })
                .replace(/import(.*?)from\s*['"](.*?)['"](;|(\s*\n))/gm, (matched, declares, href) => {
                    const fileurl = resolveUrl(src, href);
                    push(fileurl);
                    return `import${declares}from "${fileurl}";\n`;
                });
            scripts.push({ text, src, type: 'module' });
            if (defers.length) {
                await Promise.all(defers);
            }
        }

        async runScripts(scripts) {
            const sandbox = document.createElement('iframe');
            sandbox.srcdoc = '<body></body>';
            sandbox.style.position = 'fixed';
            sandbox.style.top = '-100000px';
            sandbox.style.opacity = '0';
            this.sandbox = sandbox;
            document.body.appendChild(sandbox);

            const win = sandbox.contentWindow;
            const doc = sandbox.contentDocument;

            const files = {};
            const generate = (text) => text
                .replace(/import\s*['"](.*?)['"](;|(\s*\n))/gm, (matched, href) => {
                    if (files[href]) {
                        return `import "${files[href]}";\n`;
                    }
                    return matched;
                })
                .replace(/import(.*?)from\s*['"](.*?)['"](;|(\s*\n))/gm, (matched, declares, href) => {
                    if (files[href]) {
                        return `import${declares}from "${href}";\n`;
                    }
                    return matched;
                });
            scripts.forEach(({ src, text, type }) => {
                if (src) {
                    if (type === 'file' && files[src]) {
                        return;
                    }
                    const url = win.URL || win.webkitURL;
                    const contents = generate(text);
                    const blob = new Blob([contents], { type: 'application/javascript' });
                    const blobUrl = url.createObjectURL(blob);
                    if (type === 'file') {
                        files[src] = blobUrl;
                    }
                    else {
                        const script = doc.createElement('script');
                        script.src = blobUrl;
                        script.setAttribute('type', type);
                        script.setAttribute('data-src', src);
                        doc.body.appendChild(script);
                    }
                }
                else {
                    const contents = generate(text);
                    const script = doc.createElement('script');
                    script.setAttribute('type', type);
                    script.innerText = contents;
                    doc.body.appendChild(script);
                }
            });
        }
    }

    PHC_COMPONENTS[absUrl] = PHC_Element;

    return PHC_Element;
}
