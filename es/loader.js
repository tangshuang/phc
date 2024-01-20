import { isAbsUrl, resolveUrl } from './utils.js';

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
    const temp = document.createElement('div');
    fragment.appendChild(temp);
    temp.innerHTML = text;

    if (options?.onParseChunks) {
        options.onParseChunks(temp, options.absUrl);
    }

    const metaBlocks = Array.from(temp.querySelectorAll('meta'));
    const linkBlocks = Array.from(temp.querySelectorAll('link'));
    const cssBlocks = Array.from(temp.querySelectorAll('style'));
    const jsBlocks = Array.from(temp.querySelectorAll('script'));
    const htmlBlocks = Array.from(temp.children).filter(item => !['META', 'LINK', 'STYLE', 'SCRIPT'].includes(item.nodeName));

    const metas = metaBlocks.map(meta => parseMeta(meta, options));
    const links = linkBlocks.map(link => parseLink(link, options));
    const cssChunks = cssBlocks.map(style => parseCss(style, options));
    const jsChunks = jsBlocks.map(script => parseScript(script, options));
    const htmlChunks = htmlBlocks.map(node => parseNode(node, options));

    return [metas, links, cssChunks, jsChunks, htmlChunks];
}

export function parseMeta(meta) {
    const names = meta.getAttributeNames();
    const obj = names.reduce((obj, key) => {
        // eslint-disable-next-line no-param-reassign
        obj[key] = meta.getAttribute(key);
        return obj;
    }, {});
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

    if (options?.onParseNode) {
        options.onParseNode(node, absUrl);
    }

    return node;
}
