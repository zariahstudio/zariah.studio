import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The admin app is served under /admin on both the custom domain and its
  // dedicated Netlify site. Netlify rewrites /admin/assets/* to /assets/*.
  base: '/admin/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
