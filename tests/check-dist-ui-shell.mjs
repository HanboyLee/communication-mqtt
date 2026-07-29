/**
 * Post-build assert for UI shell artifacts.
 * Run after `vite build`: node tests/check-dist-ui-shell.mjs
 */
import { existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

const required = ['background.js', 'sidepanel.html', 'popup.html'];

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

const popupPath = resolve(dist, 'popup.html');
if (existsSync(popupPath)) {
  const html = readFileSync(popupPath, 'utf8');
  if (!/data-shell\s*=\s*["']popup["']/.test(html)) {
    console.error('❌ dist/popup.html missing data-shell="popup"');
    failed++;
  } else {
    console.log('✅ dist/popup.html has data-shell=popup');
  }
  if (!html.includes('sidepanel.js') && !html.includes('sidepanel-')) {
    // Vite rewrites script to hashed asset; either sidepanel chunk or script tag ok
    // After build the script src points at assets/sidepanel-*.js or assets/popup-*.js
    // Both should share the same module graph; just ensure a module script exists
    if (!/<script\b[^>]*type=["']module["']/.test(html)) {
      console.error('❌ dist/popup.html missing module script');
      failed++;
    } else {
      console.log('✅ dist/popup.html has module script');
    }
  } else {
    console.log('✅ dist/popup.html references app script');
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
  if (!src.includes('popup.html')) {
    console.error('❌ background.js should setPopup popup.html');
    failed++;
  } else {
    console.log('✅ background.js references popup.html');
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
