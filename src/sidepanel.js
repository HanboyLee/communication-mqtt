import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles.css';
import mqtt from 'mqtt';

// Multi-topic modules
import { topicManager, topicRouter, topicStorage, tabRenderer } from './modules/index.js';

const Status = {
  Connecting: 'connecting',
  Connected: 'connected',
  Disconnected: 'disconnected'
};

const storageKeys = {
  url: 'ws:url',
  idleSeconds: 'ws:idleSeconds',
  history: 'ws:history',
  historySize: 'ws:historySize',
  theme: 'ws:theme',
  connConfig: 'ws:connConfig'
};

const dom = {
  urlInput: document.getElementById('urlInput'),
  idleInput: document.getElementById('idleInput'),
  historySizeInput: document.getElementById('historySizeInput'),
  connectBtn: document.getElementById('connectBtn'),
  clearBtn: document.getElementById('clearBtn'),
  scrollLockBtn: document.getElementById('scrollLockBtn'),
  themeBtn: document.getElementById('themeBtn'),
  logContainer: document.getElementById('logContainer'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  historyChips: document.getElementById('historyChips'),
  statusDot: document.getElementById('statusDot'),
  // Multi-topic elements
  topicTabBar: document.getElementById('topicTabBar'),
  topicTabs: document.getElementById('topicTabs'),
  addTopicBtn: document.getElementById('addTopicBtn'),
  manageTopicsBtn: document.getElementById('manageTopicsBtn'),
  // Topic Management Panel
  topicManagePanel: document.getElementById('topicManagePanel'),
  closeTopicPanelBtn: document.getElementById('closeTopicPanelBtn'),
  newTopicInput: document.getElementById('newTopicInput'),
  addTopicSubmitBtn: document.getElementById('addTopicSubmitBtn'),
  topicList: document.getElementById('topicList'),
  topicCount: document.getElementById('topicCount'),
  subscribeAllBtn: document.getElementById('subscribeAllBtn'),
  unsubscribeAllBtn: document.getElementById('unsubscribeAllBtn'),
  clearAllTopicsBtn: document.getElementById('clearAllTopicsBtn')
};

const cfgDom = {
  panel: document.getElementById('settingsPanel'),
  toggleBtn: document.getElementById('settingsToggleBtn'),
  closeBtn: document.getElementById('closeSettingsBtn'),
  mode: document.getElementById('cfgMode'),
  clientId: document.getElementById('cfgClientId'),
  protocol: document.getElementById('cfgProtocol'),
  host: document.getElementById('cfgHost'),
  port: document.getElementById('cfgPort'),
  path: document.getElementById('cfgPath'),
  ssl: document.getElementById('cfgSsl'),
  username: document.getElementById('cfgUsername'),
  password: document.getElementById('cfgPassword'),
  pubTopic: document.getElementById('cfgPubTopic'),
  autoReconnect: document.getElementById('cfgAutoReconnect'),
  preview: document.getElementById('cfgPreview'),
  applyBtn: document.getElementById('applyConfigBtn')
};

let ws = null;
let mqttClient = null;
let mode = 'mqtt';
let status = Status.Disconnected;
let logs = [];
let scrollLocked = false;
let history = [];
let historySize = 5;
let idleSeconds = 0;
let lastInteraction = Date.now();
let idleTimer = null;
let theme = 'light';
let mqttConnected = false;

const stopMqttClient = () => {
  if (!mqttClient) return;
  const client = mqttClient;
  mqttClient = null;
  mqttConnected = false;
  try {
    if (client.options) {
      client.options.reconnectPeriod = 0;
    }
    client.reconnecting = false;
    
    // Clear all internal timers
    if (client._reconnectTimer) {
      clearTimeout(client._reconnectTimer);
      client._reconnectTimer = null;
    }
    if (client._connectedTimer) {
      clearTimeout(client._connectedTimer);
      client._connectedTimer = null;
    }
    if (client._pingTimer) {
      clearInterval(client._pingTimer);
      client._pingTimer = null;
    }
    
    client.removeAllListeners();
    client.end(true, {}, () => {});
  } catch (e) {
    // ignore
  }
};

const formatTime = (date = new Date()) =>
  `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

const isJsonString = (text) => {
  if (typeof text !== 'string') return false;
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === 'object' || Array.isArray(parsed);
  } catch (e) {
    return false;
  }
};

const prettify = (text) => {
  if (isJsonString(text)) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch (e) {
      return text;
    }
  }
  return text;
};

const persistState = async () => {
  await chrome.storage.local.set({
    [storageKeys.url]: dom.urlInput.value.trim(),
    [storageKeys.idleSeconds]: idleSeconds,
    [storageKeys.history]: history.slice(0, historySize),
    [storageKeys.historySize]: historySize,
    [storageKeys.theme]: theme
  });
};

const persistConfig = async () => {
  await chrome.storage.local.set({
    [storageKeys.connConfig]: {
      mode: cfgDom.mode.value,
      clientId: cfgDom.clientId.value.trim(),
      protocol: cfgDom.ssl.checked ? 'wss' : cfgDom.protocol.value || 'ws',
      host: cfgDom.host.value.trim()||"192.168.10.190",
      port: cfgDom.port.value.trim()||"8884",
      path: cfgDom.path.value.trim()||"/mqtt",
      pubTopic: cfgDom.pubTopic.value.trim(),
      ssl: cfgDom.ssl.checked,
      username: cfgDom.username.value.trim(),
      password: cfgDom.password.value,
      autoReconnect: cfgDom.autoReconnect.checked
    }
  });
};

const loadState = async () => {
  const stored = await chrome.storage.local.get(Object.values(storageKeys));
  dom.urlInput.value = stored[storageKeys.url] || '';
  idleSeconds = Number.isFinite(stored[storageKeys.idleSeconds]) ? stored[storageKeys.idleSeconds] : 0;
  historySize = Number.isFinite(stored[storageKeys.historySize]) ? stored[storageKeys.historySize] : 5;
  history = Array.isArray(stored[storageKeys.history]) ? stored[storageKeys.history] : [];
  theme = stored[storageKeys.theme] || 'light';

  dom.idleInput.value = idleSeconds;
  dom.historySizeInput.value = historySize;
  applyTheme(theme);
  renderHistoryChips();
};

const loadConfig = async () => {
  const stored = await chrome.storage.local.get(storageKeys.connConfig);
  const cfg = stored[storageKeys.connConfig] || {};
  cfgDom.mode.value = cfg.mode || 'mqtt';
  cfgDom.clientId.value = cfg.clientId || '';
  cfgDom.protocol.value = cfg.protocol || 'ws';
  cfgDom.host.value = cfg.host || '192.168.10.190';
  cfgDom.port.value = cfg.port || '8884';
  cfgDom.path.value = cfg.path || '/mqtt';
  cfgDom.pubTopic.value = cfg.pubTopic || '';
  cfgDom.ssl.checked = cfg.ssl || false;
  cfgDom.username.value = cfg.username || 'sinoval';
  cfgDom.password.value = cfg.password || '';
  cfgDom.autoReconnect.checked = cfg.autoReconnect || false;
  mode = cfgDom.mode.value;
  refreshPreview();
};

const setStatus = (next) => {
  status = next;
  dom.statusDot.dataset.status = next === Status.Connecting ? 'connecting' : next === Status.Connected ? 'connected' : 'disconnected';
  dom.statusDot.title = next.charAt(0).toUpperCase() + next.slice(1);
  
  if (status === Status.Connected) {
    dom.connectBtn.innerHTML = '<span class="btn-text">断开</span><i class="fa-solid fa-plug-circle-xmark"></i>';
    dom.connectBtn.classList.replace('btn-primary', 'btn-danger'); // Assuming you might want a red button, but style.css doesn't have btn-danger. Prototype styles use btn-primary.
    // Let's stick to changing text/icon. Current CSS only has btn-primary/secondary.
    // To make it red, we might need to add a class or inline style, or just keep it blue. 
    // The prototype css defines status colors but not specific button colors for disconnect.
    // I will simulate the red button by inline style or adding a utility class if I could, but wait, 
    // the previous JS used Tailwind 'bg-red-600'.
    // The prototype `style.css` doesn't seem to have a `btn-danger`.
    // I'll stick to `btn-primary` but maybe change the text.
    dom.connectBtn.style.backgroundColor = 'var(--status-disconnected)';
    dom.connectBtn.style.color = 'white';
  } else if (status === Status.Connecting) {
    dom.connectBtn.innerHTML = '<span class="btn-text">连接中...</span><i class="fa-solid fa-spinner fa-spin"></i>';
    dom.connectBtn.style.backgroundColor = 'var(--status-connecting)';
  } else {
    dom.connectBtn.innerHTML = '<span class="btn-text">连接</span><i class="fa-solid fa-plug"></i>';
    dom.connectBtn.style.backgroundColor = ''; // Reset to default
    dom.connectBtn.style.color = '';
  }
};

const buildUrlFromConfig = () => {
  const protocol = cfgDom.ssl.checked ? 'wss' : (cfgDom.protocol.value || 'ws');
  const host = cfgDom.host.value.trim();
  const port = cfgDom.port.value.trim();
  let path = cfgDom.path.value.trim();
  if (path && !path.startsWith('/')) path = `/${path}`;

  const base = `${protocol}://${host}${port ? `:${port}` : ''}${path || ''}`;
  return base;
};

const refreshPreview = () => {
  cfgDom.preview.textContent = buildUrlFromConfig();
};

const pushLog = (kind, message) => {
  const entry = { kind, message: prettify(message), time: formatTime() };
  logs.push(entry);
  renderLogs();
};

const renderLogs = () => {
  dom.logContainer.innerHTML = '';
  const frag = document.createDocumentFragment();
  logs.forEach((log) => {
    const row = document.createElement('div');
    row.className = `log-row ${log.kind}`; // rx, tx, sys
    
    const bubble = document.createElement('div');
    bubble.className = 'log-bubble';
    bubble.textContent = log.message;

    const wrap = document.createElement('div');
    // For timestamp, prototype puts it below bubble?
    // styles key: .log-row.rx { justify-content: flex-start; }
    // The timestamp in prototype css is .timestamp.
    
    wrap.appendChild(bubble); // Just append bubble to row?
    // Wait, prototype styles: .log-row is flex.
    // .timestamp is display block inside something?
    // In src logic it was inside a wrap.
    // Let's look at prototype HTML structure again or guess based on CSS.
    // CSS: .timestamp { margin-top: 0.25rem; }
    // If I append bubble and timestamp to row directly, they will be side-by-side or flexed.
    // Better to wrap them if we want timestamp below bubble.
    // Actually, looking at previous src JS, it wrapped them. 
    // Let's assume a wrapper div is needed for column layout of bubble+time.
    const contentCol = document.createElement('div');
    contentCol.style.display = 'flex';
    contentCol.style.flexDirection = 'column';
    contentCol.style.alignItems = log.kind === 'tx' ? 'flex-end' : log.kind === 'sys' ? 'center' : 'flex-start';
    contentCol.style.maxWidth = '100%';
    
    contentCol.appendChild(bubble);
    
    if (log.kind !== 'sys') {
      const ts = document.createElement('div');
      ts.className = 'timestamp';
      ts.textContent = log.time;
      contentCol.appendChild(ts);
    }
    
    row.appendChild(contentCol);
    frag.appendChild(row);
  });
  
  if (logs.length === 0) {
    dom.logContainer.innerHTML = `
      <div class="empty-state">
          <i class="fa-solid fa-satellite-dish"></i>
          <p>准备连接</p>
      </div>`;
  } else {
    dom.logContainer.appendChild(frag);
  }

  if (!scrollLocked) {
    dom.logContainer.scrollTop = dom.logContainer.scrollHeight;
  }
};

const renderHistoryChips = () => {
  dom.historyChips.innerHTML = '';
  const frag = document.createDocumentFragment();
  history.slice(0, historySize).forEach((item) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = item;
    chip.addEventListener('click', () => {
      dom.messageInput.value = item;
      dom.messageInput.focus();
    });
    frag.appendChild(chip);
  });
  dom.historyChips.appendChild(frag);
};

const recordInteraction = () => {
  lastInteraction = Date.now();
};

const startIdleWatcher = () => {
  stopIdleWatcher();
  idleTimer = setInterval(() => {
    if (!idleSeconds || status !== Status.Connected || !ws) return;
    const diff = Date.now() - lastInteraction;
    if (diff > idleSeconds * 1000) {
      if (ws) ws.close();
      pushLog('sys', '因长时间无操作连接已关闭。');
    }
  }, 1000);
};

const stopIdleWatcher = () => {
  if (idleTimer) {
    clearInterval(idleTimer);
    idleTimer = null;
  }
};

const connect = () => {
  const manualUrl = dom.urlInput.value.trim();
  const builtUrl = buildUrlFromConfig();
  const url = manualUrl || builtUrl;
  
  if (!url) {
    pushLog('sys', '请输入 WebSocket URL。');
    return;
  }
  
  if (status === Status.Connected || status === Status.Connecting) {
    disconnect();
    return; // Return mainly to avoid immediate reconnect unless intended? Logic was: disconnect then start new?
    // Usually toggle behavior.
  }
  
  setStatus(Status.Connecting);
  recordInteraction();
  
  if (mode === 'mqtt') {
    connectMqtt(url);
    return;
  }

  try {
    ws = new WebSocket(url);
  } catch (e) {
    setStatus(Status.Disconnected);
    pushLog('sys', `无效 URL: ${e.message}`);
    return;
  }

  ws.onopen = () => {
    setStatus(Status.Connected);
    pushLog('sys', '已连接');
    persistState();
    startIdleWatcher();
  };

  ws.onmessage = (ev) => {
    recordInteraction();
    pushLog('rx', typeof ev.data === 'string' ? ev.data : '[binary]');
  };

  ws.onerror = () => {
    pushLog('sys', '连接错误');
  };

  ws.onclose = () => {
    setStatus(Status.Disconnected);
    ws = null;
    pushLog('sys', '已断开');
    stopIdleWatcher();
  };
};

const disconnect = () => {
  if (mode === 'mqtt') {
    stopMqttClient();
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  setStatus(Status.Disconnected);
};

const sendMessage = () => {
  const text = dom.messageInput.value;
  if (!text) return;
  if (mode === 'mqtt') {
    if (!mqttClient || !mqttConnected) {
      pushLog('sys', 'MQTT 未连接');
      return;
    }
    const pubTopic = cfgDom.pubTopic.value.trim() || cfgDom.topic.value.trim();
    if (!pubTopic) {
      pushLog('sys', '发布需要主题');
      return;
    }
    mqttClient.publish(pubTopic, text);
    recordInteraction();
    pushLog('tx', `[MQTT PUBLISH] ${pubTopic}\n${text}`);
  } else {
    if (status !== Status.Connected || !ws) {
      pushLog('sys', '未连接');
      return;
    }
    ws.send(text);
    recordInteraction();
    pushLog('tx', text);
  }
  history = [text, ...history.filter((h) => h !== text)].slice(0, historySize);
  renderHistoryChips();
  persistState();
  dom.messageInput.value = ''; // Clear input
};

const toggleScrollLock = () => {
  scrollLocked = !scrollLocked;
  dom.scrollLockBtn.innerHTML = scrollLocked ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>';
};

const applyTheme = (nextTheme) => {
  document.documentElement.setAttribute('data-theme', nextTheme);
  theme = nextTheme;
  if (nextTheme === 'dark') {
    dom.themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    dom.themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
};

const toggleTheme = () => {
  applyTheme(theme === 'dark' ? 'light' : 'dark');
  persistState();
};

const initEvents = () => {
  dom.connectBtn.addEventListener('click', connect);
  dom.clearBtn.addEventListener('click', () => {
    logs = [];
    renderLogs();
  });
  dom.scrollLockBtn.addEventListener('click', toggleScrollLock);
  dom.themeBtn.addEventListener('click', toggleTheme);
  dom.sendBtn.addEventListener('click', sendMessage);

  dom.messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  dom.idleInput.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    idleSeconds = Number.isFinite(val) && val >= 0 ? val : 0;
    persistState();
    startIdleWatcher();
  });

  dom.historySizeInput.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    historySize = Number.isFinite(val) && val > 0 ? Math.min(val, 50) : 5; // Max 50 per HTML
    dom.historySizeInput.value = historySize;
    history = history.slice(0, historySize);
    renderHistoryChips();
    persistState();
  });

  // Config Panel
  cfgDom.toggleBtn.addEventListener('click', () => {
    cfgDom.panel.classList.add('open');
  });
  cfgDom.closeBtn.addEventListener('click', () => {
    cfgDom.panel.classList.remove('open');
  });

  // General config changes
  ['protocol', 'host', 'port', 'path', 'ssl', 'username', 'password', 'pubTopic', 'autoReconnect'].forEach((key) => {
    const el = cfgDom[key];
    if (!el) return;
    el.addEventListener(key === 'ssl' || key === 'autoReconnect' ? 'change' : 'input', () => {
      if (key === 'ssl' && cfgDom.ssl.checked) {
        cfgDom.protocol.value = 'wss';
      }
      refreshPreview();
      persistConfig();
    });
  });

  cfgDom.applyBtn.addEventListener('click', () => {
    const built = buildUrlFromConfig();
    dom.urlInput.value = built;
    refreshPreview();
    persistConfig();
    persistState();
    pushLog('sys', `URL 已填充: ${built}`);
    cfgDom.panel.classList.remove('open'); 
  });

  cfgDom.mode.addEventListener('change', () => {
    mode = cfgDom.mode.value;
    refreshPreview();
    persistConfig();
  });
};

let currentSubscribedTopic = '';

const connectMqtt = (url) => {
  const clientId = cfgDom.clientId.value.trim() || `mqttjs_${Math.random().toString(16).slice(2, 8)}`;
  stopMqttClient();
  currentSubscribedTopic = ''; // Reset

  const options = {
    clientId,
    username: cfgDom.username.value.trim() || undefined,
    password: cfgDom.password.value || undefined,
    protocolId: 'MQTT',
    protocolVersion: 4,
    keepalive: 60,
    clean: true,
    reconnectPeriod: cfgDom.autoReconnect.checked ? 5000 : 0,
    resubscribe: false,
    connectTimeout: 30 * 1000
  };
  try {
    mqttClient = mqtt.connect(url, options);
  } catch (e) {
    setStatus(Status.Disconnected);
    pushLog('sys', `MQTT 连接错误: ${e.message}`);
    return;
  }

  const client = mqttClient;

  client.on('connect', () => {
    if (!client || client !== mqttClient) return;
    mqttConnected = true;
    setStatus(Status.Connected);
    pushLog('sys', `MQTT 已连接 (客户端ID: ${clientId})`);
    persistState();
    startIdleWatcher();
    
    // Subscribe all saved topics from TopicManager
    const sessions = topicManager.getAllSessions();
    for (const session of sessions) {
      mqttClient.subscribe(session.topic, { qos: session.qos }, (err) => {
        if (!mqttClient) return;
        if (err) {
          pushLog('sys', `订阅失败 [${session.topic}]: ${err.message}`);
          topicManager.setSubscribed(session.id, false);
        } else {
          pushLog('sys', `已订阅: ${session.topic}`);
          topicManager.setSubscribed(session.id, true);
        }
        tabRenderer.render();
      });
    }
    
    // Legacy: subscribe single topic from config if no multi-topic sessions
    if (sessions.length === 0) {
      const subTopic = cfgDom.topic.value.trim();
      if (subTopic && mqttClient) {
        mqttClient.subscribe(subTopic, { qos: 0 }, (err) => {
          if (!mqttClient) return;
          if (err) {
            pushLog('sys', `MQTT 订阅失败: ${err.message}`);
          } else {
            pushLog('sys', `已订阅: ${subTopic}`);
            currentSubscribedTopic = subTopic;
          }
        });
      }
    }
  });

  client.on('message', (topic, payload) => {
    if (!mqttClient) return;
    recordInteraction();
    const text = payload ? payload.toString() : '';
    
    // Route message to matching sessions
    const matchedSessions = topicRouter.routeMessage(topic, text);
    
    if (matchedSessions.length > 0) {
      // Update badge for non-active sessions
      for (const session of matchedSessions) {
        tabRenderer.updateBadge(session.id);
      }
      
      // Re-render if active session received message
      const activeSession = topicManager.getActiveSession();
      if (activeSession && matchedSessions.some(s => s.id === activeSession.id)) {
        renderActiveSessionLogs();
      }
    } else {
      // Fallback: no matching session, log to global (legacy behavior)
      pushLog('rx', `[${topic}] ${text}`);
    }
  });

  client.on('error', (err) => {
    pushLog('sys', `MQTT 错误: ${err?.message || err}`);
  });

  client.on('close', () => {
    if (client === mqttClient) {
      mqttConnected = false;
      setStatus(Status.Disconnected);
      mqttClient = null;
      currentSubscribedTopic = '';
      pushLog('sys', 'MQTT 已断开');
      stopIdleWatcher();
    }
  });
};

const init = async () => {
  setStatus(Status.Disconnected);
  await loadState();
  await loadConfig();
  initEvents();
  
  // Initialize multi-topic system
  await initMultiTopic();
};

/**
 * Initialize multi-topic system
 */
const initMultiTopic = async () => {
  // Initialize TabRenderer
  tabRenderer.init('topicTabs');
  
  // Load saved topic configs
  await topicStorage.loadAll();
  
  // Set up TabRenderer callbacks
  tabRenderer.onTabClick = (sessionId) => {
    topicManager.switchToSession(sessionId);
    renderActiveSessionLogs();
  };
  
  tabRenderer.onTabClose = async (sessionId, topic) => {
    // Unsubscribe from MQTT if connected
    if (mqttConnected && mqttClient) {
      mqttClient.unsubscribe(topic, () => {
        pushLog('sys', `已取消订阅: ${topic}`);
      });
    }
    topicManager.deleteSession(sessionId);
    await topicStorage.saveAll();
    renderActiveSessionLogs();
  };
  
  // Add topic button
  dom.addTopicBtn?.addEventListener('click', () => {
    const topic = prompt('输入要订阅的主题:');
    if (topic && topic.trim()) {
      addNewTopic(topic.trim());
    }
  });
  
  // Initial render
  tabRenderer.render();
  
  // === Topic Management Panel ===
  
  // Open/close panel
  dom.manageTopicsBtn?.addEventListener('click', () => {
    dom.topicManagePanel?.classList.add('open');
    renderTopicList();
  });
  
  dom.closeTopicPanelBtn?.addEventListener('click', () => {
    dom.topicManagePanel?.classList.remove('open');
  });
  
  // Add topic from panel
  const submitNewTopic = () => {
    const topic = dom.newTopicInput?.value.trim();
    if (topic) {
      addNewTopic(topic);
      dom.newTopicInput.value = '';
      renderTopicList();
    }
  };
  
  dom.addTopicSubmitBtn?.addEventListener('click', submitNewTopic);
  dom.newTopicInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitNewTopic();
  });
  
  // Subscribe all topics
  dom.subscribeAllBtn?.addEventListener('click', () => {
    if (!mqttConnected || !mqttClient) {
      pushLog('sys', '请先连接 MQTT 服务器');
      return;
    }
    const sessions = topicManager.getAllSessions();
    for (const session of sessions) {
      if (!session.isSubscribed) {
        mqttClient.subscribe(session.topic, { qos: session.qos }, (err) => {
          if (!err) {
            topicManager.setSubscribed(session.id, true);
            tabRenderer.render();
            renderTopicList();
          }
        });
      }
    }
  });
  
  // Unsubscribe all topics
  dom.unsubscribeAllBtn?.addEventListener('click', () => {
    if (!mqttClient) return;
    const sessions = topicManager.getAllSessions();
    for (const session of sessions) {
      if (session.isSubscribed) {
        mqttClient.unsubscribe(session.topic, () => {
          topicManager.setSubscribed(session.id, false);
          tabRenderer.render();
          renderTopicList();
        });
      }
    }
  });
  
  // Clear all topics
  dom.clearAllTopicsBtn?.addEventListener('click', async () => {
    if (!confirm('确定清空所有主题？')) return;
    
    // Unsubscribe all first
    if (mqttClient) {
      const sessions = topicManager.getAllSessions();
      for (const session of sessions) {
        mqttClient.unsubscribe(session.topic);
      }
    }
    
    // Clear all sessions
    topicManager.clear();
    await topicStorage.saveAll();
    tabRenderer.render();
    renderTopicList();
    renderActiveSessionLogs();
    cfgDom.topic.value = '';
  });
};

/**
 * Render topic list in Topic Management Panel
 */
const renderTopicList = () => {
  const container = dom.topicList;
  const countBadge = dom.topicCount;
  if (!container) return;
  
  const sessions = topicManager.getAllSessions();
  
  // Update count badge
  if (countBadge) {
    countBadge.textContent = sessions.length;
  }
  
  // Empty state
  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-hint">
        <i class="fa-solid fa-inbox"></i>
        <p>暂无订阅主题</p>
      </div>
    `;
    return;
  }
  
  // Render topic items
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  
  for (const session of sessions) {
    const item = document.createElement('div');
    item.className = 'topic-item';
    item.dataset.id = session.id;
    
    item.innerHTML = `
      <span class="topic-color" style="background: ${session.color}"></span>
      <div class="topic-info">
        <div class="topic-name" title="${session.topic}">${session.topic}</div>
        <div class="topic-stats">
          ${session.isSubscribed ? '✓ 已订阅' : '○ 未订阅'} · ${session.logs.length} 条消息
        </div>
      </div>
      <div class="topic-actions">
        <button class="switch" title="切换到此主题"><i class="fa-solid fa-arrow-right"></i></button>
        <button class="delete" title="删除主题"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    
    // Switch button
    item.querySelector('.switch')?.addEventListener('click', () => {
      topicManager.switchToSession(session.id);
      cfgDom.topic.value = session.topic;
      renderActiveSessionLogs();
      tabRenderer.render();
      dom.topicManagePanel?.classList.remove('open');
    });
    
    // Delete button
    item.querySelector('.delete')?.addEventListener('click', async () => {
      if (mqttClient && session.isSubscribed) {
        mqttClient.unsubscribe(session.topic);
      }
      topicManager.deleteSession(session.id);
      await topicStorage.saveAll();
      tabRenderer.render();
      renderTopicList();
      renderActiveSessionLogs();
    });
    
    frag.appendChild(item);
  }
  
  container.appendChild(frag);
};

/**
 * Add a new topic subscription
 */
const addNewTopic = async (topic) => {
  // Create session
  const session = topicManager.createSession(topic);
  
  // Subscribe if MQTT is connected
  if (mqttConnected && mqttClient) {
    mqttClient.subscribe(topic, { qos: 0 }, (err) => {
      if (err) {
        pushLog('sys', `订阅失败: ${err.message}`);
        topicManager.setSubscribed(session.id, false);
      } else {
        pushLog('sys', `已订阅: ${topic}`);
        topicManager.setSubscribed(session.id, true);
      }
      tabRenderer.render();
    });
  }
  
  // Save and switch to new topic
  await topicStorage.saveAll();
  topicManager.switchToSession(session.id);
  renderActiveSessionLogs();
  
  // Sync topic input with new session
  cfgDom.topic.value = topic;
};

/**
 * Render logs for the active session
 */
const renderActiveSessionLogs = () => {
  const session = topicManager.getActiveSession();
  
  if (!session) {
    // No active session, show default empty state
    dom.logContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-satellite-dish"></i>
        <p>点击 + 添加主题开始</p>
      </div>
    `;
    return;
  }
  
  // Render session logs
  dom.logContainer.innerHTML = '';
  const frag = document.createDocumentFragment();
  
  for (const log of session.getFilteredLogs()) {
    const row = document.createElement('div');
    row.className = `log-row ${log.kind}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'log-bubble';
    bubble.textContent = log.message;
    
    const contentCol = document.createElement('div');
    contentCol.style.display = 'flex';
    contentCol.style.flexDirection = 'column';
    contentCol.style.alignItems = log.kind === 'tx' ? 'flex-end' : log.kind === 'sys' ? 'center' : 'flex-start';
    contentCol.style.maxWidth = '100%';
    
    contentCol.appendChild(bubble);
    
    if (log.kind !== 'sys') {
      const ts = document.createElement('div');
      ts.className = 'timestamp';
      ts.textContent = log.time;
      contentCol.appendChild(ts);
    }
    
    row.appendChild(contentCol);
    frag.appendChild(row);
  }
  
  if (session.logs.length === 0) {
    dom.logContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-inbox"></i>
        <p>等待 ${session.topic} 的消息...</p>
      </div>
    `;
  } else {
    dom.logContainer.appendChild(frag);
  }
  
  if (!scrollLocked) {
    dom.logContainer.scrollTop = dom.logContainer.scrollHeight;
  }
};

init();
