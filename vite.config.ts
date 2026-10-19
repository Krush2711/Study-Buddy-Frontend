import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * The .NET API enables HTTPS redirection, so browser traffic hits https://localhost:7000
 * and Vite must not reject its self-signed dev certificate.
 *
 * Both proxies exist so the browser never performs a cross-origin request while
 * developing:
 *   - /api  -> ASP.NET Core (auth, profile, knowledge, ingestion, admin)
 *   - /ai   -> FastAPI       (summary, notes, shortnotes, mindmap)
 *
 * FastAPI does NOT register CORSMiddleware, so a direct browser call to
 * http://localhost:8000 would be blocked. Going through the dev proxy sidesteps
 * that entirely. For production, add CORSMiddleware there (or front both services
 * with a gateway) — see PROXY_NOTES in src/services/api/endpoints.ts.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://localhost:7000',
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        // /ai/summary -> http://localhost:8000/summary
        rewrite: (path) => path.replace(/^\/ai/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
})
