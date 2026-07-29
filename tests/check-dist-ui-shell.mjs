/**
 * Post-build assert for UI shell artifacts.
 * Run after `vite build`: node tests/check-dist-ui-shell.mjs
 */
import { existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

const required = ['background.js', 'sidepanel.html', 'window.html'];

let failed = 0;

for (const name of required) {
  const p = resolve(dist, name);
  if (!existsSync(p)) {
    console.error(`❌ missing dist/${name}`);
    failed++;
  } else {
    console.log(`✅ dist/${name}`);
  }
}

const windowPath = resolve(dist, 'window.html');
if (existsSync(windowPath)) {
  const html = readFileSync(windowPath, 'utf8');
  if (!/data-shell\s*=\s*["']window["']/.test(html)) {
    console.error('❌ dist/window.html missing data-shell="window"');
    failed++;
  } else {
    console.log('✅ dist/window.html has data-shell=window');
  }
  if (!/<script\b[^>]*type=["']module["']/.test(html)) {
    console.error('❌ dist/window.html missing module script');
    failed++;
  } else {
    console.log('✅ dist/window.html has module script');
  }
}

const bgPath = resolve(dist, 'background.js');
if (existsSync(bgPath)) {
  const src = readFileSync(bgPath, 'utf8');
  const size = statSync(bgPath).size;
  const banned = ['mqtt', 'node_modules/mqtt', 'TopicManager', 'sidepanel.js'];
  for (const b of banned) {
    if (src.includes(b)) {
      console.error(`❌ background.js must not contain "${b}"`);
      failed++;
    }
  }
  // Product: floating window via chrome.windows, not action.setPopup(html)
  if (!src.includes('window.html') && !src.includes('windows.create')) {
    // minified may keep string window.html
    if (!src.includes('window.html')) {
      console.error('❌ background.js should reference window.html for floating window');
      failed++;
    }
  } else {
    console.log('✅ background.js references floating window page');
  }
  if (src.includes("setPopup({popup:\"window") || src.includes("setPopup({ popup: 'window")) {
    console.error('❌ background.js must not setPopup(window.html) — use chrome.windows');
    failed++;
  }
  if (size > 50_000) {
    console.error(`❌ background.js too large (${size} bytes) — possible polyfill pollution`);
    failed++;
  } else {
    console.log(`✅ background.js size ${size} bytes (no heavy graph)`);
  }
}

if (failed > 0) {
  process.exit(1);
}
console.log('All dist UI-shell checks passed.');
