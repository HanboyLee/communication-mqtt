import { resolve } from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel.html')
      }
    }
  },
  plugins: [
    nodePolyfills({
      // Enable polyfills for stream, buffer, process, etc.
      include: ['stream', 'buffer', 'process', 'util', 'events']
    })
  ]
});
