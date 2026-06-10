const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
globalThis.fetch = fetch;
