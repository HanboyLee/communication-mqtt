/**
 * UI shell pure helpers + optional post-build dist checks.
 * Run: node tests/ui-shell.node.test.js
 * (Duplicate of background/sidepanel constants — zero app imports.)
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const UI_SHELL_DEFAULT = 'sidepanel';

function normalizeUiShell(value) {
  return value === 'popup' ? 'popup' : UI_SHELL_DEFAULT;
}

/** @returns {{ openPanelOnActionClick: boolean, popup: string }} */
function uiShellToActionConfig(shell) {
  const mode = normalizeUiShell(shell);
  if (mode === 'popup') {
    return { openPanelOnActionClick: false, popup: 'popup.html' };
  }
  return { openPanelOnActionClick: true, popup: '' };
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

console.log('🧪 UI shell normalize / action config\n');
console.log('='.repeat(60));

// normalizeUiShell truth table
const normalizeCases = [
  { in: 'popup', out: 'popup' },
  { in: 'sidepanel', out: 'sidepanel' },
  { in: undefined, out: 'sidepanel' },
  { in: null, out: 'sidepanel' },
  { in: '', out: 'sidepanel' },
  { in: 'PANEL', out: 'sidepanel' },
  { in: 'Popup', out: 'sidepanel' },
  { in: 0, out: 'sidepanel' },
  { in: {}, out: 'sidepanel' }
];

for (const c of normalizeCases) {
  const result = normalizeUiShell(c.in);
  assert(result === c.out, `normalizeUiShell(${JSON.stringify(c.in)}) === ${JSON.stringify(c.out)}`);
}

// uiShellToActionConfig mapping
const side = uiShellToActionConfig('sidepanel');
assert(side.openPanelOnActionClick === true, 'sidepanel → openPanelOnActionClick true');
assert(side.popup === '', 'sidepanel → popup empty string');

const pop = uiShellToActionConfig('popup');
assert(pop.openPanelOnActionClick === false, 'popup → openPanelOnActionClick false');
assert(pop.popup === 'popup.html', 'popup → popup.html');

const bad = uiShellToActionConfig('nope');
assert(bad.openPanelOnActionClick === true && bad.popup === '', 'invalid shell → sidepanel config');

// Post-build dist asserts (skip if dist missing so pure unit tests still run pre-build)
const distDir = resolve(root, 'dist');
if (existsSync(distDir)) {
  console.log('\n📦 dist/ post-build checks\n');
  assert(existsSync(resolve(distDir, 'background.js')), 'dist/background.js exists');
  assert(existsSync(resolve(distDir, 'sidepanel.html')), 'dist/sidepanel.html exists');
  // popup.html is required from PR-3 onward; if present, pass; if not yet, skip
  if (existsSync(resolve(distDir, 'popup.html'))) {
    assert(true, 'dist/popup.html exists');
  } else {
    console.log('ℹ️  SKIP: dist/popup.html (expected until popup twin commit)');
  }
} else {
  console.log('\nℹ️  SKIP dist checks (dist/ not built yet)');
}

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
