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
