/**
 * UI shell pure helpers + optional post-build dist checks.
 * Run: node tests/ui-shell.node.test.js
 * (Duplicate of background/sidepanel constants — zero app imports.)
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const UI_SHELL_DEFAULT = 'sidepanel';

/** Migrates legacy "popup" → "window". */
function normalizeUiShell(value) {
  if (value === 'window' || value === 'popup') return 'window';
  return UI_SHELL_DEFAULT;
}

/**
 * Action/sidePanel mapping for toolbar click (no action popup path).
 * @returns {{ openPanelOnActionClick: boolean, useActionPopup: false, opensFloatingWindow: boolean }}
 */
function uiShellToActionConfig(shell) {
  const mode = normalizeUiShell(shell);
  if (mode === 'window') {
    return {
      openPanelOnActionClick: false,
      useActionPopup: false,
      opensFloatingWindow: true
    };
  }
  return {
    openPanelOnActionClick: true,
    useActionPopup: false,
    opensFloatingWindow: false
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(cond, label) {
  if (cond) {
    passed++;
    console.log(`✅ PASS: ${label}`);
  } else {
    failed++;
    console.log(`❌ FAIL: ${label}`);
  }
}

console.log('🧪 UI shell normalize / action config (window mode)\n');
console.log('='.repeat(60));

const normalizeCases = [
  { in: 'window', out: 'window' },
  { in: 'popup', out: 'window' }, // legacy migration
  { in: 'sidepanel', out: 'sidepanel' },
  { in: undefined, out: 'sidepanel' },
  { in: null, out: 'sidepanel' },
  { in: '', out: 'sidepanel' },
  { in: 'PANEL', out: 'sidepanel' },
  { in: 'Popup', out: 'sidepanel' },
  { in: 'Window', out: 'sidepanel' },
  { in: 0, out: 'sidepanel' },
  { in: {}, out: 'sidepanel' }
];

for (const c of normalizeCases) {
  const result = normalizeUiShell(c.in);
  assert(result === c.out, `normalizeUiShell(${JSON.stringify(c.in)}) === ${JSON.stringify(c.out)}`);
}

const side = uiShellToActionConfig('sidepanel');
assert(side.openPanelOnActionClick === true, 'sidepanel → openPanelOnActionClick true');
assert(side.useActionPopup === false, 'sidepanel → no action popup');
assert(side.opensFloatingWindow === false, 'sidepanel → no floating window');

const win = uiShellToActionConfig('window');
assert(win.openPanelOnActionClick === false, 'window → openPanelOnActionClick false');
assert(win.useActionPopup === false, 'window → no action popup');
assert(win.opensFloatingWindow === true, 'window → opens floating window');

const legacy = uiShellToActionConfig('popup');
assert(legacy.opensFloatingWindow === true && legacy.useActionPopup === false, 'legacy popup maps to window config');

const bad = uiShellToActionConfig('nope');
assert(
  bad.openPanelOnActionClick === true && !bad.opensFloatingWindow,
  'invalid shell → sidepanel config'
);

const distDir = resolve(root, 'dist');
if (existsSync(distDir)) {
  console.log('\n📦 dist/ post-build checks\n');
  assert(existsSync(resolve(distDir, 'background.js')), 'dist/background.js exists');
  assert(existsSync(resolve(distDir, 'sidepanel.html')), 'dist/sidepanel.html exists');
  assert(existsSync(resolve(distDir, 'window.html')), 'dist/window.html exists');
} else {
  console.log('\nℹ️  SKIP dist checks (dist/ not built yet)');
}

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
