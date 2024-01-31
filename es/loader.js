import { isAbsUrl, resolveUrl, createElement, appendChild, defineProperty, querySelectorAll, getAttribute, getAttributeNames, forEach, upperCase, toArrary } from './utils.js';
import { PHC_TAG } from './constants.js';

export const PHC_FILES = {};

export const PHC_MODULES = {};

export function useModule(absUrl, options) {
    if (PHC_MODULES[absUrl]) {
        return PHC_MODULES[absUrl];
    }
    PHC_MODULES[absUrl] = useFile(absUrl, options).then(text => parseChunks(text, { ...options, absUrl }));
    const defer = PHC_MODULES[absUrl];
    return defer;
}

export function useFile(absUrl, options) {
    if (PHC_FILES[absUrl]) {
        return PHC_FILES[absUrl];
    }

    const defer = options?.onLoadFile
        ? options.onLoadFile(absUrl)
        : fetch(absUrl).then(res => res.text());
    PHC_FILES[absUrl] = defer;
    return defer;
}

export async function parseChunks(text, options) {
    const fragment = new DocumentFragment();
    const temp = createElement('div');
    appendChild(fragment, temp);
    temp.innerHTML = text;

    if (options?.onParseChunks) {
        options.onParseChunks(temp, options.absUrl);
    }

    const metaBlocks = toArrary(querySelectorAll(temp, 'meta'));
    const linkBlocks = toArrary(querySelectorAll(temp, 'link'));
    const cssBlocks = toArrary(querySelectorAll(temp, 'style'));
    const jsBlocks = toArrary(querySelectorAll(temp, 'script'));
    const htmlBlocks = toArrary(temp.children).filter(item => !['META', 'LINK', 'STYLE', 'SCRIPT'].includes(item.nodeName));

    const metas = metaBlocks.map(meta => parseMeta(meta, options));
    const links = linkBlocks.map(link => parseLink(link, options));
    const cssChunks = cssBlocks.map(style => parseCss(style, options));
    const jsChunks = jsBlocks.map(script => parseScript(script, options));
    const htmlChunks = htmlBlocks.map(node => parseNode(node, options));

    return [metas, links, cssChunks, jsChunks, htmlChunks];
}

export function parseMeta(meta) {
    const names = getAttributeNames(meta);
    const obj = names.reduce((obj, key) => {
        // eslint-disable-next-line no-param-reassign
        obj[key] = getAttribute(meta, key);
        return obj;
    }, {});
    return obj;
}

export function parseLink(link, options) {
    const { absUrl } = options;
    const names = getAttributeNames(link);
    const ini = {};
    defineProperty(ini, '__link', { get: () => link, enumerable: false });
    const obj = names.reduce((obj, key) => {
        const value = link.getAttribute(key);
        if (key === 'href' && !isAbsUrl(value)) {
            const newHref = resolveUrl(absUrl, value);
            // eslint-disable-next-line no-param-reassign
            obj[key] = newHref;
        }
        else {
            // eslint-disable-next-line no-param-reassign
            obj[key] = value;
        }
        return obj;
    }, ini);
    return obj;
}

export function parseCss(style, options) {
    const { absUrl } = options;
    const cssText = style.innerHTML;
    const newCssText = cssText
        .replace(/@import\s*['"](.*?)['"]/gm, (matched, href) => {
            if (!isAbsUrl(href)) {
                const newHref = resolveUrl(absUrl, href);
                return `@import "${newHref}"`;
            }
            return matched;
        })
        .replace(/url\(['"]*(.*?)['"]*\)/gm, (matched, href) => {
            if (!isAbsUrl(href)) {
                const newHref = resolveUrl(absUrl, href);
                return `url("${newHref}")`;
            }
            return matched;
        });

    // eslint-disable-next-line no-param-reassign
    style.innerHTML = newCssText;

    if (options?.onParseCss) {
        options.onParseCss(style, absUrl);
    }

    return style;
}

export function parseScript(script, options) {
    const { absUrl } = options;
    const text = script.innerHTML;
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
    // eslint-disable-next-line no-param-reassign
    script.innerHTML = newText;

    const src = script.getAttribute('src');
    if (src && !isAbsUrl(src)) {
        const newSrc = resolveUrl(absUrl, src);
        script.setAttribute('src', newSrc);
    }

    if (options?.onParseScript) {
        options.onParseScript(script, absUrl);
    }

    return script;
}

export function parseNode(node, options) {
    const { absUrl } = options;

    const transform = (child, attr) => {
        const url = getAttribute(child, attr);
        if (url && !isAbsUrl(url)) {
            const newUrl = resolveUrl(absUrl, url);
            child.setAttribute(attr, newUrl);
        }
    };

    const walk = (root, tag, attr) => {
        const childs = querySelectorAll(root, tag);
        forEach(childs, (child) => {
            transform(child, attr);
        });
        if (root.nodeName === upperCase(tag)) {
            transform(node, attr);
        }
    };

    walk(node, 'img', 'src');
    walk(node, 'a', 'href');
    walk(node, 'source', 'src');
    walk(node, PHC_TAG, 'src');

    if (options?.onParseNode) {
        options.onParseNode(node, absUrl);
    }

    return node;
}
