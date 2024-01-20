import { useComponent } from './component.js';
import { resolveUrl } from './utils.js';

export function bootstrap(currUrl, options) {
    const links = document.querySelectorAll('link');
    links.forEach((link) => {
        if (link.rel !== 'phc') {
            return;
        }
        const name = link.getAttribute('as');
        if (!name) {
            return;
        }
        const src = link.href;
        const url = resolveUrl(currUrl, src);
        const Component = useComponent(url, options);
        customElements.define(name, Component);
    });
}
