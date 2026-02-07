import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Converts render-blocking CSS <link> tags to non-render-blocking preloads.
 * The inline loading state in index.html provides immediate FCP.
 */
function asyncCssPlugin(): Plugin {
  return {
    name: 'async-css',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        '<link rel="preload" as="style" crossorigin href="$1" onload="this.rel=\'stylesheet\'">\n<noscript><link rel="stylesheet" crossorigin href="$1"></noscript>'
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), asyncCssPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-router-dom": path.resolve(__dirname, "node_modules/react-router-dom"),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    force: true,
  },
  build: {
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React - always needed
          if (id.includes('react-dom') || (id.includes('/react/') && !id.includes('react-router'))) {
            return 'vendor-react-core';
          }
          // Router - needed for navigation
          if (id.includes('react-router')) {
            return 'vendor-react-router';
          }
          // Supabase auth only (GoTrueClient) - needed on login
          if (id.includes('@supabase/auth-js') || id.includes('@supabase/supabase-js')) {
            return 'vendor-supabase-auth';
          }
          // Supabase data (postgrest, realtime, storage) - deferred
          if (id.includes('@supabase/postgrest-js') || id.includes('@supabase/realtime-js') || id.includes('@supabase/storage-js')) {
            return 'vendor-supabase-data';
          }
          // React Query - only needed after login
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          // Radix UI - split toast (used on login) from rest
          if (id.includes('@radix-ui/react-toast') || id.includes('@radix-ui/react-slot')) {
            return 'vendor-ui-core';
          }
          if (id.includes('@radix-ui/')) {
            return 'vendor-ui-extra';
          }
          // Date-fns - only dashboard
          if (id.includes('date-fns')) {
            return 'vendor-datefns';
          }
          // Floating UI - deferred
          if (id.includes('@floating-ui')) {
            return 'vendor-floating';
          }
        },
      },
    },
  },
}));
