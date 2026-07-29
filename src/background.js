/**
 * MV3 service worker — UI shell control only.
 * Hard constraint: zero imports from sidepanel / mqtt / modules / css.
 *
 * Modes (ws:uiShell):
 * - sidepanel: toolbar click opens Side Panel
 * - window: toolbar click opens/focuses a draggable chrome.windows floating tool window
 * Legacy value "popup" migrates to "window".
 */

const UI_SHELL_KEY = 'ws:uiShell';
const UI_SHELL_DEFAULT = 'sidepanel';
const WINDOW_PAGE = 'window.html';
const FLOATING_WIDTH = 420;
const FLOATING_HEIGHT_FALLBACK = 800;

/** @type {number | null} SW-memory id of the floating debugger window */
let floatingWindowId = null;

/**
 * Normalize shell preference. Migrates legacy "popup" → "window".
 * @param {unknown} value
 * @returns {'sidepanel' | 'window'}
 */
function normalizeUiShell(value) {
  if (value === 'window' || value === 'popup') return 'window';
  return UI_SHELL_DEFAULT;
}

/**
 * Apply Chrome action/sidePanel mutual exclusion for toolbar click.
 * Never uses action.setPopup (product: no toolbar-anchored popup).
 * - sidepanel: openPanelOnActionClick true (onClicked will not fire)
 * - window: openPanelOnActionClick false + empty popup so onClicked fires
 */
async function applyUiShell(mode) {
  const shell = normalizeUiShell(mode);
  try {
    // Always clear any leftover action popup path
    await chrome.action.setPopup({ popup: '' });
    if (shell === 'window') {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    } else {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  } catch (err) {
    console.error('[uiShell] applyUiShell failed', shell, err);
  }
}

async function readShell() {
  const bag = await chrome.storage.local.get(UI_SHELL_KEY);
  return normalizeUiShell(bag[UI_SHELL_KEY]);
}

async function bootstrap() {
  const shell = await readShell();
  // Persist normalized value (migrates legacy "popup" → "window")
  await chrome.storage.local.set({ [UI_SHELL_KEY]: shell });
  await applyUiShell(shell);
}

/**
 * Height of the user's current normal browser window, for a full-height tool window.
 */
async function getFloatingWindowHeight() {
  try {
    const w = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
    if (w && typeof w.height === 'number' && w.height > 0) return w.height;
  } catch (_) {
    /* ignore */
  }
  try {
    const all = await chrome.windows.getAll({ windowTypes: ['normal'] });
    const pick = all.find((x) => x.focused) || all[0];
    if (pick && typeof pick.height === 'number' && pick.height > 0) return pick.height;
  } catch (_) {
    /* ignore */
  }
  return FLOATING_HEIGHT_FALLBACK;
}

async function isFloatingWindowOpen(id) {
  if (id == null) return false;
  try {
    await chrome.windows.get(id);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Open one floating debugger window, or focus the existing one.
 * Never opens a second instance while the tracked window still exists.
 */
async function openOrFocusFloatingWindow() {
  if (await isFloatingWindowOpen(floatingWindowId)) {
    try {
      await chrome.windows.update(floatingWindowId, { focused: true });
      return floatingWindowId;
    } catch (err) {
      console.error('[uiShell] focus floating window failed', err);
      floatingWindowId = null;
    }
  }

  const height = await getFloatingWindowHeight();
  const url = chrome.runtime.getURL(WINDOW_PAGE);
  try {
    const created = await chrome.windows.create({
      url,
      type: 'popup', // chromeless tool window; still movable/resizable
      width: FLOATING_WIDTH,
      height,
      focused: true
    });
    floatingWindowId = created?.id ?? null;
    return floatingWindowId;
  } catch (err) {
    console.error('[uiShell] create floating window failed', err);
    floatingWindowId = null;
    return null;
  }
}

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === floatingWindowId) {
    floatingWindowId = null;
  }
});

// Fires only when no action popup is set and openPanelOnActionClick is false
chrome.action.onClicked.addListener(() => {
  readShell()
    .then((shell) => {
      if (shell === 'window') {
        return openOrFocusFloatingWindow();
      }
      // sidepanel: Chrome opens the side panel via setPanelBehavior
      return undefined;
    })
    .catch((err) => {
      console.error('[uiShell] action.onClicked', err);
    });
});

chrome.runtime.onInstalled.addListener(() => {
  bootstrap();
});

chrome.runtime.onStartup.addListener(() => {
  readShell().then(applyUiShell);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes[UI_SHELL_KEY]) return;
  applyUiShell(changes[UI_SHELL_KEY].newValue);
});

// UI writes storage then wakes SW (complements storage.onChanged if SW was asleep)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'APPLY_UI_SHELL') return;
  readShell()
    .then(applyUiShell)
    .then(() => sendResponse({ ok: true }))
    .catch((e) => {
      console.error('[uiShell] APPLY_UI_SHELL', e);
      sendResponse({ ok: false, error: String(e) });
    });
  return true; // async sendResponse
});

// Cold-start SW evaluation also applies once
bootstrap();
