export function each(obj, fn) {
    if (Array.isArray(obj)) {
        for (let i = 0, len = obj.length; i < len; i ++) {
            const item = obj[i];
            fn(item, i);
        }
        return;
    }

    const keys = Object.keys(obj);
    for (let i = 0, len = keys.length; i < len; i ++) {
        const key = keys[i];
        const value = obj[key];
        fn(value, key);
    }
}

export function clearComments(str) {
    return str.replace(/\/\*.*?\*\//gmi, '').replace(/\/\/.*?[\n$]/, '');
}

export function clearHtml(str) {
    return str.replace(/>[\n\s]+?</gmi, '><').replace(/>\n+?([\w\W]+?)\n+?</gmi, '>$1<');
}

export function padding(count) {
    return new Array(count).fill(' ')
        .join('');
}

export function camelcase(str, force) {
    if (force) {
        const s = camelcase(str);
        return s.replace(s[0], s[0].toUpperCase());
    }
    return str.replace(/[-_]\w/ig, matched => matched[1].toUpperCase()).replace(/\s+/g, '');
}

export function resolveUrl(baseUrl, uri) {
    if (!uri) {
        throw new Error('baseUrl & uri required');
    }

    // 使用 https://xxx
    if (isAbsUrl(uri)) {
        return uri;
    }

    const isAbs = baseUrl[0] === '/' && baseUrl[1] !== '/';
    // 必须是 /a/b/c || http://xxx
    if (!isAbs && (!baseUrl || !isAbsUrl(baseUrl))) {
        throw new Error('baseUrl without protool');
    }

    if (uri.indexOf('/') === 0) {
        const origin = isAbs ? '' : baseUrl
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

export function randomString(len = 8) {
    const CHARS = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ';
    let text = '';
    for (let i = 0; i < len; i++) {
        text += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return text;
}

export function noop() {}

export function createBlobUrl(contents, type = 'application/javascript') {
    const url = window.URL || window.webkitURL;
    const blob = new Blob([contents], { type });
    const blobURL = url.createObjectURL(blob);
    return blobURL;
}

export function createScript(src, type) {
    const script = document.createElement('script');
    script.type = type || 'text/javascript';
    script.src = src;
    return script;
}

export function createScriptBy(contents) {
    const src = createBlobUrl(contents);
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    return script;
}

export async function insertScript(script) {
    return new Promise((r) => {
    // eslint-disable-next-line no-param-reassign
        script.onload = r;
        document.body.appendChild(script);
    });
}

export function tryParse(str, useString) {
    try {
        const jsonStr = str.replace(/'/g, '"').replace(/(\w+:)|(\w+ :)/g, s => `"${s.substring(0, s.length - 1)}":`);
        return JSON.parse(jsonStr);
    } catch (e) {
        if (useString) {
            return str;
        }
    }
}

/**
 * 根据条件删除元素
 * @param {*} items
 * @param {*} fn
 */
export function removeBy(items, fn) {
    items.forEach((item, i) => {
        if (fn(item, i, items)) {
            items.splice(i, 1);
        }
    });
}

export function createReady() {
    let resolve = null;
    const promise = new Promise((r) => {
        resolve = r;
    });

    return (resolved) => {
        if (resolved) {
            resolve();
        }
        return promise;
    };
}

export function remap(obj) {
    if (Array.isArray(obj)) {
        return obj.reduce((res, item) => {
            res[item] = camelcase(item);
            return res;
        }, {});
    }

    const keys = Object.keys(obj);
    const res = {};
    keys.forEach((key) => {
        res[obj[key]] = camelcase(key);
    });
    return res;
}

export function sleep(time) {
    return new Promise(r => setTimeout(r, time));
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
