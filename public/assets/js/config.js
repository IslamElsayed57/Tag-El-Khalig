// The Node server serves the website and API from the same origin.
// Keep this value relative so local and hosted deployments use their own origin.
window.TAJ_CONFIG = Object.freeze({ apiBaseUrl: '/api', mode: 'remote' });
