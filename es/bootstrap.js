import { resolveUrl, querySelectorAll, getAttribute, forEach } from './utils.js';
import { PHCElement } from './element.js';
import { PHC_FILES } from './loader.js';

export function bootstrap(currUrl, options) {
    defineElement(currUrl, options);
    setupLinks(currUrl, options);
}

function setupLinks(currUrl, options) {
    const links = querySelectorAll(document, 'link');
    forEach(links, (link) => {
        if (link.rel !== 'phc') {
            return;
        }
        const name = getAttribute(link, 'as');
        if (!name) {
            return;
        }
        const src = link.href;
        const url = resolveUrl(currUrl, src);
        register(name, url, options);
    });
}

function defineElement(currUrl, options) {
    class PHC extends PHCElement {
        getOptions() {
            return options;
        }
        getUrl() {
            const src = this.getAttribute('src');
            const url = resolveUrl(currUrl, src);
            return url;
        }
    }
    customElements.define('phc-x', PHC);
}

export function register(name, url, options) {
    class Component extends PHCElement {
        getOptions() {
            return options;
        }
        getUrl() {
            return url;
        }
    }
    customElements.define(name, Component);
}

export function define(name, text, options) {
    const url = Symbol(name);
    PHC_FILES[url] = Promise.resolve(text);
    register(name, url, options);
}
