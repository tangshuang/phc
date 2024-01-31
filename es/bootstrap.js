import { resolveUrl, querySelectorAll, getAttribute, forEach } from './utils.js';
import { PHCElement } from './element.js';
import { PHC_TAG } from './constants.js';

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
        define(name, url, options);
    });
}

function defineElement(currUrl, options) {
    class PHCXElement extends PHCElement {
        getOptions() {
            return options;
        }
        getUrl() {
            const src = this.getAttribute('src');
            const url = resolveUrl(currUrl, src);
            return url;
        }
    }
    customElements.define(PHC_TAG, PHCXElement);
}

export function define(name, url, options) {
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
