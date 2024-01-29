import { resolveUrl, querySelectorAll, getAttribute, forEach } from './utils.js';
import { PHCElement } from './element.js';

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

        class Component extends PHCElement {
            getOptions() {
                return options;
            }
            getUrl() {
                return resolveUrl(currUrl, url);
            }
        }

        customElements.define(name, Component);
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
