import { use } from '../index.js';

use({
    onParseChunks(doc, absUrl) {
        const ext = absUrl.split('.').pop();
        if (ext !== 'vue') {
            return;
        }

        const root = document.createElement('div');
        root.id = 'root';
        doc.appendChild(root);

        const setup = doc.querySelector('script[setup]');
        const setupText = setup.innerHTML;
        const setupScript = setupText.replace(/export\s*\{(.*?)\}/, 'return {$1}');
        doc.removeChild(setup);

        const script = document.createElement('script');
        script.innerHTML = `
            const win = new Window();
            const { Vue } = win;
            const { createApp } = Vue;
            const doc = new Document();
            const root = doc.querySelector('#root');

            const app = createApp({
                template: doc.querySelector('template').innerHTML,
                setup() {
                    ${setupScript}
                },
            });

            app.mount(root);
        `;
        doc.appendChild(script);
    },
});
