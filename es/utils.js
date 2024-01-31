export function resolveUrl(baseUrl, uri) {
    // 使用 https://xxx
    if (isAbsUrl(uri)) {
        return uri;
    }

    let path = baseUrl;
    if (baseUrl.indexOf('#') > -1) {
        // eslint-disable-next-line prefer-destructuring
        path = baseUrl.split('#')[0];
    }
    if (baseUrl.indexOf('?') > -1) {
        // eslint-disable-next-line prefer-destructuring
        path = baseUrl.split('?')[0];
    }

    let root = '/';
    if (isAbsUrl(baseUrl)) {
        root = path.split('/').slice(0, 3)
            .join('/');
    }

    // uri是根绝对路径
    if (isAbsPath(uri)) {
        if (root === '/') {
            return uri;
        }
        return root + uri;
    }

    if (uri[0] === '?') {
        return path + uri;
    }

    if (['&', '#'].includes(uri[0])) {
        return baseUrl + uri;
    }

    let dir = '';
    if (path[path.length - 1] === '/') {
        dir = path.substring(0, path.length - 1);
    } else {
        const chain = path.split('/');
        const tail = chain.pop();
        dir = tail.indexOf('.') === -1 ? path : chain.join('/');
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

export function isAbsPath(url) {
    return url[0] === '/' && url[1] !== '/';
}

export function isAbsUrl(url) {
    if (url[0] === '/' && url[1] === '/') {
        return true;
    }
    return /^[a-z]+:\/\//.test(url);
}

export const querySelectorAll = (el, selector) => el.querySelectorAll(selector);
export const getAttribute = (el, attr) => el.getAttribute(attr);
export const getAttributeNames = el => el.getAttributeNames();
export const forEach = (arr, fn) => arr.forEach(fn);
export const appendChild = (el, child) => el.appendChild(child);
export const { keys, defineProperty } = Object;
export const createElement = tag => document.createElement(tag);
export const toArrary = arr => Array.from(arr);
export const setAttribute = (el, attr, value) => el.setAttribute(attr, value);
export const upperCase = str => str.toUpperCase();
