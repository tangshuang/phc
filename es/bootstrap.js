import { useComponent } from './component.js';
import { resolveUrl, querySelectorAll, getAttribute, forEach } from './utils.js';

export function bootstrap(currUrl, options) {
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
        const Component = useComponent(url, options);
        customElements.define(name, Component);
    });
}
