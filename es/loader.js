import { isAbsUrl, resolveUrl } from './utils.js';

export const PHC_FILES = {};

export const PHC_MODULES = {};

export function loadModule(absUrl) {
    if (PHC_MODULES[absUrl]) {
        return PHC_MODULES[absUrl];
    }

    const defer = PHC_MODULES[absUrl] = loadFile(absUrl).then(async (text) => {
        const { cssChunks, jsChunks, htmlChunks, metas, links } = await parseChunks(text, { absUrl });
        return { cssChunks, jsChunks, htmlChunks, metas, links };
    });
    return defer;
}

export function loadFile(absUrl) {
    if (PHC_FILES[absUrl]) {
        return PHC_FILES[absUrl];
    }

    const defer = PHC_FILES[absUrl] = fetch(absUrl).then(res => res.text());
    return defer;
}

export async function parseChunks(text, options) {
    const fragment = new DocumentFragment();
    const temp = document.createElement('template');
    fragment.appendChild(temp);
    temp.innerHTML = text;

    const metaBlocks = Array.from(temp.querySelectorAll('meta'));
    const linkBlocks = Array.from(temp.querySelectorAll('link'));
    const cssBlocks = Array.from(temp.querySelectorAll('style'));
    const jsBlocks = Array.from(temp.querySelectorAll('script'));
    const htmlBlocks = Array.from(temp.children).filter((item) => !['META', 'LINK', 'STYLE', 'SCRIPTS'].includes(item.nodeName));

    const metas = metaBlocks.map(meta => parseMeta(meta, options));
    const links = linkBlocks.map(link => parseLink(link, options));
    const cssChunks = cssBlocks.map(style => parseCss(style, options));
    const jsChunks = jsBlocks.map(script => parseScript(script, options));
    const htmlChunks = htmlBlocks.map(node => parseNode(node, options));

    return { metas, links, cssChunks, jsChunks, htmlChunks };
}

export function parseMeta(meta, options) {
    const names = meta.getAttributeNames();
    const obj = names.reduce((obj, key) => { obj[key] = meta.getAttribute(key); return obj }, {});
    return obj;
}

export function parseLink(link, options) {
    const { absUrl } = options;
    const names = link.getAttributeNames();
    const ini = {};
    Object.defineProperty(ini, '__link', { get: () => link, enumerable: false });
    const obj = names.reduce((obj, key) => {
        const value = link.getAttribute(key);
        if (key === 'href' && !isAbsUrl(value)) {
            const newHref = resolveUrl(absUrl, href);
            obj[key] = newHref;
        }
        else {
            obj[key] = value;
        }
        return obj;
    }, ini);
    return obj;
}

export function parseCss(style, options) {
    const { absUrl } = options;
    const cssText = style.innerText;
    const newCssText = cssText.replace(/@import\s*['"](.*?)['"]/gm, (matched, href) => {
        if (!isAbsUrl(href)) {
            const newHref = resolveUrl(absUrl, href);
            return `@import "${newHref}"`;
        }
        return matched;
    });
    style.innerText = newCssText;
    return style;
}

export function parseScript(script, options) {
    const { absUrl } = options;
    const text = script.innerText;
    const newText = text
        .replace(/import\s*['"](.*?)['"]/gm, (matched, href) => {
            if (!isAbsUrl(href)) {
                const newHref = resolveUrl(absUrl, href);
                return `import "${newHref}"`;
            }
            return matched;
        })
        .replace(/import(.*?)from\s*['"](.*?)['"]/gm, (matched, declares, href) => {
            if (!isAbsUrl(href)) {
                const newHref = resolveUrl(absUrl, href);
                return `import${declares}from "${newHref}"`;
            }
            return matched;
        });
    script.innerText = newText;

    const src = script.getAttribute('src');
    if (src && !isAbsUrl(src)) {
        const newSrc = resolveUrl(absUrl, src);
        script.setAttribute('src', newSrc);
    }

    return script;
}

export function parseNode(node, options) {
    const { absUrl } = options;

    const transformImage = (img) => {
        const src = img.getAttribute('src');
        if (src && !isAbsUrl(src)) {
            const newSrc = resolveUrl(absUrl, src);
            img.setAttribute('src', newSrc);
        }
    };

    const transformLink = (link) => {
        const src = link.getAttribute('href');
        if (src && !isAbsUrl(src)) {
            const newSrc = resolveUrl(absUrl, src);
            link.setAttribute('src', newSrc);
        }
    };

    const imgs = Array.from(node.querySelectorAll('img'));
    imgs.forEach(transformImage);

    const links = Array.from(node.querySelectorAll('a'));
    links.forEach(transformLink);

    transformImage(node);
    transformLink(node);

    return node;
}