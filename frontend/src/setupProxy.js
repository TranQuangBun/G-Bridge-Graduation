const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Only proxy API requests, not hot-update files or webpack dev server files
  // Use '/api' as the path to ensure only API requests are proxied
  app.use(
    '/api',
    createProxyMiddleware({
      // Filter: only proxy API requests, ignore hot-update files
      filter: function (pathname, req) {
        // Don't proxy hot-update files or other webpack dev server files
        if (pathname.includes('hot-update') || pathname.includes('.hot-update.') || pathname.includes('sockjs-node')) {
          return false;
        }
        // Only proxy API requests (pathname already starts with /api due to app.use('/api'))
        return pathname.startsWith('/api');
      },
      // In Docker, use service name; this will be resolved by Docker DNS
      target: 'http://backend:4000',
      changeOrigin: true,
      logLevel: 'warn',
      timeout: 30000, // 30 seconds timeout
      proxyTimeout: 30000, // 30 seconds proxy timeout
      // Path rewrite: remove /api prefix when forwarding to backend
      pathRewrite: {
        '^/api': '/api', // Keep /api prefix (backend expects /api)
      },
      // Ignore proxy errors silently for non-API requests
      onError: (err, req, res) => {
        // Silently ignore errors for hot-update files and other non-API requests
        if (req.url && (req.url.includes('hot-update') || !req.url.startsWith('/api'))) {
          return;
        }
        // Handle connection errors gracefully (backend might not be ready yet)
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          // Backend is not ready yet, return 503 Service Unavailable
          if (!res.headersSent) {
            res.writeHead(503, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({
              error: 'Backend service is not ready yet. Please wait a moment and try again.',
              code: 'SERVICE_UNAVAILABLE'
            }));
          }
          return;
        }
        // Only log other errors for actual API requests
        console.error('Proxy error for API request:', err.message);
      }
    })
  );
};

