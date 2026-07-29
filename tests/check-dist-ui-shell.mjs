/**
 * Post-build assert for UI shell artifacts.
 * Run after `vite build`: node tests/check-dist-ui-shell.mjs
 */
import { existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

const required = ['background.js', 'sidepanel.html'];
// popup.html optional until PR-3; pass REQUIRE_POPUP=1 to enforce
if (process.env.REQUIRE_POPUP === '1') {
  required.push('popup.html');
}

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

const bgPath = resolve(dist, 'background.js');
if (existsSync(bgPath)) {
  const src = readFileSync(bgPath, 'utf8');
  const size = statSync(bgPath).size;
  // Guard: SW must not pull mqtt / polyfill-heavy app graph
  const banned = ['mqtt', 'node_modules/mqtt', 'TopicManager', 'sidepanel.js'];
  for (const b of banned) {
    if (src.includes(b)) {
      console.error(`❌ background.js must not contain "${b}"`);
      failed++;
    }
  }
  // Heuristic: fixed single-file SW should stay small
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
