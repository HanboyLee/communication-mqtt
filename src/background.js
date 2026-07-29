/**
 * MV3 service worker — UI shell control only.
 * Hard constraint: zero imports from sidepanel / mqtt / modules / css.
 */

const UI_SHELL_KEY = 'ws:uiShell';
const UI_SHELL_DEFAULT = 'sidepanel';

const POPUP_PAGE = 'popup.html';

function normalizeUiShell(value) {
  return value === 'popup' ? 'popup' : UI_SHELL_DEFAULT;
}

/**
 * Ordered mutual-exclusion apply (KD-14):
 * - popup: disable action→panel first, then set popup
 * - sidepanel: clear popup first, then enable action→panel
 */
async function applyUiShell(mode) {
  const shell = normalizeUiShell(mode);
  try {
    if (shell === 'popup') {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
      await chrome.action.setPopup({ popup: POPUP_PAGE });
    } else {
      await chrome.action.setPopup({ popup: '' });
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
  await chrome.storage.local.set({ [UI_SHELL_KEY]: shell });
  await applyUiShell(shell);
}

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
