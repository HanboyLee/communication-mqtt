import { resolve } from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { generatePopupHtml } from './scripts/generate-popup-html.mjs';

// Ensure popup.html exists before Rollup resolves multi-page inputs
generatePopupHtml({ silent: true });

/**
 * Scope node polyfills to the app (sidepanel/popup) graph only.
 * Background SW must stay free of mqtt/node polyfill bloat.
 */
function nodePolyfillsAppOnly(options) {
  const poly = nodePolyfills(options);
  const isBackground = (id) =>
    typeof id === 'string' &&
    (id.includes(`${resolve('src')}/background`) ||
      id.replace(/\\/g, '/').includes('/background.js') ||
      id.replace(/\\/g, '/').endsWith('/background'));

  const wrapHook = (hook) => {
    if (!hook) return hook;
    if (typeof hook === 'function') {
      return function (id, ...rest) {
        if (isBackground(id) || (typeof rest[0] === 'string' && isBackground(rest[0]))) {
          return null;
        }
        if (rest[0] && typeof rest[0] === 'string' && isBackground(rest[0])) {
          return null;
        }
        return hook.call(this, id, ...rest);
      };
    }
    return {
      ...hook,
      handler(id, ...rest) {
        if (isBackground(id) || (rest[0] && isBackground(rest[0]))) {
          return null;
        }
        return hook.handler.call(this, id, ...rest);
      }
    };
  };

  return {
    ...poly,
    name: 'node-polyfills-app-only',
    resolveId: wrapHook(poly.resolveId),
    load: wrapHook(poly.load),
    transform: wrapHook(poly.transform)
  };
}

/** Rebuild popup.html when sidepanel.html changes (dev/watch). */
function generatePopupHtmlPlugin() {
  const sidepanelAbs = resolve(__dirname, 'src/sidepanel.html');
  return {
    name: 'generate-popup-html',
    buildStart() {
      generatePopupHtml({ silent: true });
      this.addWatchFile(sidepanelAbs);
    },
    configureServer(server) {
      generatePopupHtml({ silent: true });
      server.watcher.add(sidepanelAbs);
      server.watcher.on('change', (file) => {
        if (resolve(file) === sidepanelAbs) {
          generatePopupHtml({ silent: true });
        }
      });
    }
  };
}

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel.html'),
        popup: resolve(__dirname, 'src/popup.html'),
        background: resolve(__dirname, 'src/background.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  plugins: [
    generatePopupHtmlPlugin(),
    nodePolyfillsAppOnly({
      include: ['stream', 'buffer', 'process', 'util', 'events']
    })
  ]
});
