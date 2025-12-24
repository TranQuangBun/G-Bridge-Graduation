const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Only proxy API requests, not hot-update files or webpack dev server files
  app.use(
    createProxyMiddleware({
      // Filter: only proxy API requests, ignore hot-update files
      filter: function (pathname, req) {
        // Don't proxy hot-update files or other webpack dev server files
        if (pathname.includes('hot-update') || pathname.includes('.hot-update.') || pathname.includes('sockjs-node')) {
          return false;
        }
        // Only proxy API requests
        return pathname.startsWith('/api');
      },
      // In Docker, use service name; this will be resolved by Docker DNS
      target: 'http://backend:4000',
      changeOrigin: true,
      logLevel: 'warn',
      // Ignore proxy errors silently for non-API requests
      onError: (err, req, res) => {
        // Silently ignore errors for hot-update files and other non-API requests
        if (req.url && (req.url.includes('hot-update') || !req.url.startsWith('/api'))) {
          return;
        }
        // Only log errors for actual API requests
        console.error('Proxy error for API request:', err.message);
      }
    })
  );
};

