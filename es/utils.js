export function resolveUrl(baseUrl, uri) {
    // 使用 https://xxx
    if (isAbsUrl(uri)) {
        return uri;
    }

    const isRoot = baseUrl[0] === '/' && baseUrl[1] !== '/';

    if (uri.indexOf('/') === 0) {
        const origin = isRoot ? '' : baseUrl
            .split('/')
            .slice(0, 3)
            .join('/');
        return origin + uri;
    }

    if (/^(\?|&|#)$/.test(uri[0])) {
        return baseUrl + uri;
    }

    let dir = '';
    if (baseUrl[baseUrl.length - 1] === '/') {
        dir = baseUrl.substring(0, baseUrl.length - 1);
    } else {
        const chain = baseUrl.split('/');
        const tail = chain.pop();
        dir = tail.indexOf('.') === -1 ? baseUrl : chain.join('/');
    }

    const roots = dir.split('/');
    const blocks = uri.split('/');
    while (true) {
        const block = blocks[0];
        if (block === '..') {
            blocks.shift();
            roots.pop();
        } else if (block === '.') {
            blocks.shift();
        } else {
            break;
        }
    }

    const url = `${roots.join('/')}/${blocks.join('/')}`;
    return url;
}

export function isAbsUrl(url) {
    return /^[a-z]+:\/\//.test(url);
}

export function getStringHash(str) {
    let hash = 5381;
    let i = str.length;

    while (i) {
        // eslint-disable-next-line no-plusplus
        hash = (hash * 33) ^ str.charCodeAt(--i);
    }

    return hash >>> 0;
}

export function createSafeExp(exp) {
    const sign = '*.?+-$^!<>[](){}|\\/';
    const signArr = sign.split('');
    const expArr = exp.split('');
    const expList = expArr.map(char => (signArr.indexOf(char) > -1 ? `\\${char}` : char));
    const safeExp = expList.join('');
    return safeExp;
}

export const querySelectorAll = (el, selector) => el.querySelectorAll(selector);
export const getAttribute = (el, attr) => el.getAttribute(attr);
export const getAttributeNames = el => el.getAttributeNames();
export const forEach = (arr, fn) => arr.forEach(fn);
export const appendChild = (el, child) => el.appendChild(child);
export const { keys, defineProperty } = Object;
export const createElement = tag => document.createElement(tag);
