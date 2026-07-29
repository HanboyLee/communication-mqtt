/**
 * Generate src/window.html as a full DOM twin of src/sidepanel.html.
 * Source of truth: sidepanel.html only. Do not hand-edit window.html.
 *
 * Usage: node scripts/generate-window-html.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sidepanelPath = resolve(root, 'src/sidepanel.html');
const windowPath = resolve(root, 'src/window.html');

const GENERATED_BANNER =
  '<!-- GENERATED from sidepanel.html — do not edit by hand. Run: node scripts/generate-window-html.mjs -->\n';

/**
 * Transform sidepanel HTML into floating-window twin with data-shell="window".
 * @param {string} html
 * @returns {string}
 */
export function transformSidepanelToWindow(html) {
  let out = html;

  out = out.replace(/^<!-- GENERATED from sidepanel\.html[\s\S]*?-->\n?/, '');

  out = out.replace(/<html\b([^>]*)>/i, (_m, attrs) => {
    let a = String(attrs || '');
    if (/\bdata-shell\s*=/.test(a)) {
      a = a.replace(/\bdata-shell\s*=\s*["'][^"']*["']/, 'data-shell="window"');
    } else {
      a = `${a} data-shell="window"`;
    }
    return `<html${a}>`;
  });

  out = out.replace(
    /<title>[^<]*<\/title>/i,
    '<title>WebSocket Debugger (Window)</title>'
  );

  return GENERATED_BANNER + out;
}

export function generateWindowHtml({ silent = false } = {}) {
  if (!existsSync(sidepanelPath)) {
    throw new Error(`Missing source: ${sidepanelPath}`);
  }
  const source = readFileSync(sidepanelPath, 'utf8');
  const twin = transformSidepanelToWindow(source);
  writeFileSync(windowPath, twin, 'utf8');
  if (!silent) {
    console.log(`Generated ${windowPath}`);
  }
  return windowPath;
}

// Back-compat alias for any old imports
export const generatePopupHtml = generateWindowHtml;
export const transformSidepanelToPopup = transformSidepanelToWindow;

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  generateWindowHtml();
}
