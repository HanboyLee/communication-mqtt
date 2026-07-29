/**
 * Generate src/popup.html as a full DOM twin of src/sidepanel.html.
 * Source of truth: sidepanel.html only. Do not hand-edit popup.html.
 *
 * Usage: node scripts/generate-popup-html.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sidepanelPath = resolve(root, 'src/sidepanel.html');
const popupPath = resolve(root, 'src/popup.html');

const GENERATED_BANNER =
  '<!-- GENERATED from sidepanel.html — do not edit by hand. Run: node scripts/generate-popup-html.mjs -->\n';

/**
 * Transform sidepanel HTML into popup twin with data-shell="popup".
 * @param {string} html
 * @returns {string}
 */
export function transformSidepanelToPopup(html) {
  let out = html;

  // Strip any prior generated banner if re-processing a twin by mistake
  out = out.replace(/^<!-- GENERATED from sidepanel\.html[\s\S]*?-->\n?/, '');

  // Ensure <html ... data-shell="popup">
  out = out.replace(/<html\b([^>]*)>/i, (_m, attrs) => {
    let a = String(attrs || '');
    if (/\bdata-shell\s*=/.test(a)) {
      a = a.replace(/\bdata-shell\s*=\s*["'][^"']*["']/, 'data-shell="popup"');
    } else {
      a = `${a} data-shell="popup"`;
    }
    return `<html${a}>`;
  });

  // Optional distinct title
  out = out.replace(
    /<title>[^<]*<\/title>/i,
    '<title>WebSocket Debugger (Popup)</title>'
  );

  return GENERATED_BANNER + out;
}

export function generatePopupHtml({ silent = false } = {}) {
  if (!existsSync(sidepanelPath)) {
    throw new Error(`Missing source: ${sidepanelPath}`);
  }
  const source = readFileSync(sidepanelPath, 'utf8');
  const twin = transformSidepanelToPopup(source);
  writeFileSync(popupPath, twin, 'utf8');
  if (!silent) {
    console.log(`Generated ${popupPath}`);
  }
  return popupPath;
}

// CLI
const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  generatePopupHtml();
}
