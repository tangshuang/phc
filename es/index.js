import { bootstrap } from './bootstrap.js';

const currUrl = location.href;
if (document.readyState === 'complete') {
    bootstrap(currUrl);
}
else {
    addEventListener('load', () => bootstrap(currUrl));
}
