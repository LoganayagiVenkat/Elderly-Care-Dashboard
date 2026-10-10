import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/dist/**', '**/.git/**'],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        configure: (proxy) => {
          process.nextTick(() => {
            proxy.removeAllListeners('error');
            proxy.on('error', (err, _req, res) => {
              if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
                if (res && typeof res.writeHead === 'function' && !res.headersSent) {
                  res.writeHead(503, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    success: false,
                    offline: true,
                    message: 'Backend server is currently offline. Operating in local mode.'
                  }));
                }
                return;
              }
              console.warn('[Proxy Error]', err.message);
            });
          });
        }
      }
    }
  }
})
