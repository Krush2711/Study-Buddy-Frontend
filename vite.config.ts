import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * In development the browser never performs a cross-origin request:
 *   - /api  -> hosted StudyBuddy .NET API (auth, users, knowledge, ingestion, admin)
 *   - /ai   -> local FastAPI       (summary, notes, shortnotes, mindmap)
 *
 * The hosted API's CORS policy is not under our control, so proxying through
 * Vite keeps development working regardless. A production build calls the
 * hosted origin directly unless VITE_API_BASE_URL overrides it.
 */
const API_PROXY = {
  '/api': {
    // Must match REMOTE_API_ORIGIN in src/services/api/client.ts: the Google
    // popup opens that origin directly, while this proxy carries the exchange
    // poll (/api/auth/google-response). If the two differ, the auth cookie set
    // during the popup hop is presented to a different API and sign-in hangs.
    // target: 'https://krushnas2.studybuddy.blitz.cloud',
    target: 'https://localhost:7217',
    changeOrigin: true,
    // The ASP.NET Core dev certificate is self-signed; Node rejects it with
    // DEPTH_ZERO_SELF_SIGNED_CERT when secure is true, which makes every /api
    // call fail with a proxy 500. Set this back to true for the hosted origin.
    secure: false,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      ...API_PROXY,
      '/ai': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        // /ai/summary -> http://localhost:8000/summary
        rewrite: (path) => path.replace(/^\/ai/, ''),
      },
    },
  },
  // `vite preview` serves the production bundle. The proxy applies when the
  // build used a relative API root (VITE_API_BASE_URL=/api); with the default
  // absolute origin the browser calls the API directly and needs CORS.
  preview: {
    port: 4173,
    proxy: API_PROXY,
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
