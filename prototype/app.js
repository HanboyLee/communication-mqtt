/**
 * WebSocket & MQTT Debugger Pro
 * Prototype Implementation based on existing logic
 */

const dom = {
    // Header
    statusDot: document.getElementById('statusDot'),
    urlInput: document.getElementById('urlInput'),
    connectBtn: document.getElementById('connectBtn'),
    settingsToggleBtn: document.getElementById('settingsToggleBtn'),
    
    // Toolbar
    idleInput: document.getElementById('idleInput'),
    historySizeInput: document.getElementById('historySizeInput'),
    clearBtn: document.getElementById('clearBtn'),
    scrollLockBtn: document.getElementById('scrollLockBtn'),
    themeBtn: document.getElementById('themeBtn'),
    
    // Panels
    settingsPanel: document.getElementById('settingsPanel'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    
    // Settings Form
    cfgMode: document.getElementById('cfgMode'),
    cfgClientId: document.getElementById('cfgClientId'),
    cfgProtocol: document.getElementById('cfgProtocol'),
    cfgHost: document.getElementById('cfgHost'),
    cfgPort: document.getElementById('cfgPort'),
    cfgPath: document.getElementById('cfgPath'),
    cfgTopic: document.getElementById('cfgTopic'),
    cfgSsl: document.getElementById('cfgSsl'),
    cfgUsername: document.getElementById('cfgUsername'),
    cfgPassword: document.getElementById('cfgPassword'),
    cfgPubTopic: document.getElementById('cfgPubTopic'),
    cfgAutoReconnect: document.getElementById('cfgAutoReconnect'),
    cfgPreview: document.getElementById('cfgPreview'),
    applyConfigBtn: document.getElementById('applyConfigBtn'),

    // Body
    logContainer: document.getElementById('logContainer'),
    
    // Footer
    historyChips: document.getElementById('historyChips'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn')
};

// State
let state = {
    ws: null,
    mqttClient: null,
    mode: 'ws',
    status: 'disconnected', // disconnected, connecting, connected
    logs: [],
    history: [],
    historySize: 5,
    idleSeconds: 0,
    lastInteraction: 0,
    idleTimer: null,
    scrollLocked: false,
    theme: 'dark' // Default to dark for prototype
};

const STORAGE_KEY = 'ws_debug_proto_state';

// --- Utils ---

const formatTime = (date = new Date()) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const prettify = (str) => {
    try {
        const obj = JSON.parse(str);
        return JSON.stringify(obj, null, 2);
    } catch {
        return str;
    }
};

// --- Storage ---

const loadState = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const saved = JSON.parse(raw);
            // Hydrate config fields
            if (saved.config) {
                dom.cfgMode.value = saved.config.mode || 'mqtt';
                dom.cfgClientId.value = saved.config.clientId || '';
                dom.cfgProtocol.value = saved.config.protocol || 'ws';
                dom.cfgHost.value = saved.config.host || '192.168.10.190';
                dom.cfgPort.value = saved.config.port || '8884';
                dom.cfgPath.value = saved.config.path || '/mqtt';
                dom.cfgTopic.value = saved.config.topic || '';
                dom.cfgSsl.checked = saved.config.ssl || false;
                dom.cfgUsername.value = saved.config.username || '';
                // Don't save password in local storage plain text for prototype best practice? 
                // Source did it, so we will do it but maybe minimal.
                dom.cfgPassword.value = saved.config.password || ''; 
                dom.cfgPubTopic.value = saved.config.pubTopic || '';
                dom.cfgAutoReconnect.checked = saved.config.autoReconnect || false;
            }
            
            if (saved.url) dom.urlInput.value = saved.url;
            
            state.history = saved.history || [];
            state.historySize = saved.historySize || 5;
            state.idleSeconds = saved.idleSeconds || 0;
            state.theme = saved.theme || 'dark';

            dom.idleInput.value = state.idleSeconds;
            dom.historySizeInput.value = state.historySize;
            
            state.mode = dom.cfgMode.value;
            applyTheme(state.theme);
            renderHistoryChips();
            refreshPreview();
        } else {
             // Initial load defaults
            applyTheme(state.theme);
        }
    } catch (e) {
        console.error('Failed to load state', e);
    }
};

const saveState = () => {
    const data = {
        url: dom.urlInput.value,
        history: state.history,
        historySize: state.historySize,
        idleSeconds: state.idleSeconds,
        theme: state.theme,
        config: {
            mode: dom.cfgMode.value,
            clientId: dom.cfgClientId.value,
            protocol: dom.cfgProtocol.value,
            host: dom.cfgHost.value,
            port: dom.cfgPort.value,
            path: dom.cfgPath.value,
            topic: dom.cfgTopic.value,
            ssl: dom.cfgSsl.checked,
            username: dom.cfgUsername.value,
            password: dom.cfgPassword.value,
            pubTopic: dom.cfgPubTopic.value,
            autoReconnect: dom.cfgAutoReconnect.checked
        }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- Theme ---

const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    dom.themeBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    state.theme = theme;
};

const toggleTheme = () => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveState();
};

// --- Logs ---

const pushLog = (kind, message) => {
    const msg = prettify(message);
    const time = formatTime();
    
    // Determine scroll state before adding
    const isScrolledToBottom = dom.logContainer.scrollHeight - dom.logContainer.scrollTop <= dom.logContainer.clientHeight + 50;

    const row = document.createElement('div');
    row.className = `log-row ${kind}`;
    
    const wrapper = document.createElement('div');
    
    const bubble = document.createElement('div');
    bubble.className = 'log-bubble';
    bubble.textContent = msg;
    
    wrapper.appendChild(bubble);
    
    if (kind !== 'sys') {
        const ts = document.createElement('div');
        ts.className = 'timestamp';
        ts.textContent = time;
        wrapper.appendChild(ts);
    }
    
    row.appendChild(wrapper);
    
    // If first log, clear empty state
    if (dom.logContainer.querySelector('.empty-state')) {
        dom.logContainer.innerHTML = '';
    }
    
    dom.logContainer.appendChild(row);
    
    // Cleanup logs if too many? (optional, not strictly in reqs but good for perf)
    if (dom.logContainer.children.length > 500) {
        dom.logContainer.removeChild(dom.logContainer.firstElementChild);
    }

    if (!state.scrollLocked && isScrolledToBottom) {
        dom.logContainer.scrollTop = dom.logContainer.scrollHeight;
    }
};

// --- Connection Logic ---

const setStatus = (sts) => {
    state.status = sts;
    dom.statusDot.dataset.status = sts;
    const btnText = dom.connectBtn.querySelector('.btn-text');
    
    if (sts === 'connected') {
        btnText.textContent = 'Disconnect';
        dom.connectBtn.style.backgroundColor = 'var(--status-disconnected)'; // Red for disconnect
        dom.statusDot.title = "Connected";
    } else if (sts === 'connecting') {
        btnText.textContent = 'Connecting...';
        dom.connectBtn.style.backgroundColor = 'var(--status-connecting)';
        dom.statusDot.title = "Connecting";
    } else {
        btnText.textContent = 'Connect';
        dom.connectBtn.style.backgroundColor = 'var(--accent-primary)';
        dom.statusDot.title = "Disconnected";
    }
};

const buildUrl = () => {
    const protocol = dom.cfgSsl.checked ? 'wss' : (dom.cfgProtocol.value || 'ws');
    const host = dom.cfgHost.value.trim();
    const port = dom.cfgPort.value.trim();
    let path = dom.cfgPath.value.trim();
    if (path && !path.startsWith('/')) path = `/${path}`;
    const topic = dom.cfgTopic.value.trim();

    const base = `${protocol}://${host}${port ? `:${port}` : ''}${path || ''}`;
    
    // In WS mode, some users pass query/topic in URL.
    if (state.mode === 'ws' && topic) {
        return `${base}?${topic}`;
    }
    return base;
};

const refreshPreview = () => {
    dom.cfgPreview.textContent = buildUrl();
};

const connect = () => {
    if (state.status === 'connected' || state.status === 'connecting') {
        disconnect();
        return;
    }

    const manualUrl = dom.urlInput.value.trim();
    const configUrl = buildUrl();
    const url = manualUrl || configUrl;

    if (!url) {
        pushLog('sys', 'Error: Please provide a URL.');
        return;
    }

    setStatus('connecting');
    state.lastInteraction = Date.now();
    startIdleWatcher();

    if (state.mode === 'mqtt') {
        connectMqtt(url);
    } else {
        connectWs(url);
    }
};

const disconnect = () => {
    if (state.ws) {
        state.ws.close();
        state.ws = null;
    }
    if (state.mqttClient) {
        // Force end
        try {
            state.mqttClient.end(true);
        } catch(e){}
        state.mqttClient = null;
    }
    setStatus('disconnected');
    pushLog('sys', 'Disconnected');
    stopIdleWatcher();
};

// --- WS Impl ---

const connectWs = (url) => {
    try {
        const ws = new WebSocket(url);
        state.ws = ws;

        ws.onopen = () => {
            if (state.ws !== ws) return;
            setStatus('connected');
            pushLog('sys', `Connected to ${url}`);
            saveState();
        };

        ws.onmessage = (ev) => {
            state.lastInteraction = Date.now();
            pushLog('rx', ev.data);
        };

        ws.onerror = (e) => {
            pushLog('sys', 'Connection Error');
        };

        ws.onclose = () => {
            if (state.ws === ws) {
                setStatus('disconnected');
                state.ws = null;
                pushLog('sys', 'Connection Closed');
                stopIdleWatcher();
            }
        };
    } catch (e) {
        setStatus('disconnected');
        pushLog('sys', `Error: ${e.message}`);
    }
};

// --- MQTT Impl ---

const connectMqtt = (url) => {
    const clientId = dom.cfgClientId.value.trim() || `mqtt_${Math.random().toString(16).slice(2, 8)}`;
    
    // Options
    const opts = {
        clientId,
        username: dom.cfgUsername.value.trim() || undefined,
        password: dom.cfgPassword.value || undefined,
        keepalive: 60,
        clean: true,
        reconnectPeriod: dom.cfgAutoReconnect.checked ? 5000 : 0,
        connectTimeout: 30 * 1000
    };

    try {
        // mqtt is global from script tag
        if (typeof mqtt === 'undefined') {
            throw new Error('MQTT library not loaded');
        }
        
        const client = mqtt.connect(url, opts);
        state.mqttClient = client;

        client.on('connect', () => {
            if (state.mqttClient !== client) return;
            setStatus('connected');
            pushLog('sys', `MQTT Connected (ID: ${clientId})`);
            saveState();

            // Auto subscribe
            const topic = dom.cfgTopic.value.trim();
            if (topic) {
                client.subscribe(topic, { qos: 0 }, (err) => {
                    if (!err) pushLog('sys', `Subscribed to ${topic}`);
                    else pushLog('sys', `Subscribed failed: ${err.message}`);
                });
            }
        });

        client.on('message', (topic, payload) => {
            state.lastInteraction = Date.now();
            const msg = payload.toString();
            pushLog('rx', `Topic: ${topic}\n${msg}`);
        });

        client.on('error', (err) => {
            pushLog('sys', `MQTT Error: ${err.message}`);
        });

        client.on('close', () => {
            if (state.mqttClient === client) {
                 // Only log if we didn't initiate disconnect (simple check)
                 if(state.status === 'connected') pushLog('sys', 'MQTT Connection Closed');
                 // If auto reconnect is off, or we want to reflect UI state:
                 if (!dom.cfgAutoReconnect.checked) {
                     setStatus('disconnected');
                     state.mqttClient = null;
                     stopIdleWatcher();
                 }
            }
        });

    } catch (e) {
        setStatus('disconnected');
        pushLog('sys', `MQTT Init Error: ${e.message}`);
    }
};

// --- Idle Watcher ---

const startIdleWatcher = () => {
    stopIdleWatcher();
    state.idleTimer = setInterval(() => {
        if (!state.idleSeconds || state.status !== 'connected') return;
        const diff = (Date.now() - state.lastInteraction) / 1000;
        if (diff > state.idleSeconds) {
            pushLog('sys', 'Idle timeout reached. Disconnecting...');
            disconnect();
        }
    }, 1000);
};

const stopIdleWatcher = () => {
    if (state.idleTimer) {
        clearInterval(state.idleTimer);
        state.idleTimer = null;
    }
};

// --- Sending ---

const sendMessage = () => {
    const text = dom.messageInput.value;
    if (!text) return;

    if (state.status !== 'connected') {
        pushLog('sys', 'Not connected');
        return;
    }
    
    // Add to history
    state.history = [text, ...state.history.filter(h => h !== text)].slice(0, state.historySize);
    renderHistoryChips();
    saveState();

    state.lastInteraction = Date.now();

    if (state.mode === 'mqtt' && state.mqttClient) {
        const topic = dom.cfgPubTopic.value.trim() || dom.cfgTopic.value.trim();
        if(!topic) {
            pushLog('sys', 'No topic defined for publishing');
            return;
        }
        state.mqttClient.publish(topic, text);
        pushLog('tx', `[${topic}] ${text}`);
    } else if (state.ws) {
        state.ws.send(text);
        pushLog('tx', text);
    }
    
    // dom.messageInput.value = ''; // Optional: Clear input? Source didn't clear I think, or maybe chips usage implies keeping it. 
    // Usually standard to clear, but "Debugger" often keeps for re-sending. 
    // Source: `dom.messageInput.value = item` on chip click.
    // Let's NOT clear it to allow easy edit/resend, standard for this tool type.
};

// --- UI Rendering ---

const renderHistoryChips = () => {
    dom.historyChips.innerHTML = '';
    state.history.slice(0, state.historySize).forEach(txt => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.textContent = txt;
        chip.title = txt;
        chip.onclick = () => {
            dom.messageInput.value = txt;
            dom.messageInput.focus();
        };
        dom.historyChips.appendChild(chip);
    });
};

// --- Event Listeners ---

dom.connectBtn.addEventListener('click', connect);

dom.sendBtn.addEventListener('click', sendMessage);
dom.messageInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') sendMessage();
});

dom.clearBtn.addEventListener('click', () => {
    dom.logContainer.innerHTML = '';
    // Restore empty state?
    // dom.logContainer.innerHTML = '<div class="empty-state">...</div>'; 
});

dom.scrollLockBtn.addEventListener('click', () => {
    state.scrollLocked = !state.scrollLocked;
    dom.scrollLockBtn.innerHTML = state.scrollLocked ? 
        '<i class="fa-solid fa-lock" style="color:red"></i>' : 
        '<i class="fa-solid fa-lock-open"></i>';
});

dom.themeBtn.addEventListener('click', toggleTheme);

dom.settingsToggleBtn.addEventListener('click', () => {
    dom.settingsPanel.classList.add('open');
});
dom.closeSettingsBtn.addEventListener('click', () => {
    dom.settingsPanel.classList.remove('open');
});

// Config fields logic
dom.cfgSsl.addEventListener('change', () => {
    if (dom.cfgSsl.checked) dom.cfgProtocol.value = 'wss';
    refreshPreview();
});

['cfgMode', 'cfgHost', 'cfgPort', 'cfgPath', 'cfgTopic', 'cfgProtocol'].forEach(id => {
    dom[id].addEventListener('input', () => {
        state.mode = dom.cfgMode.value;
        refreshPreview();
    });
});

dom.applyConfigBtn.addEventListener('click', () => {
    dom.urlInput.value = buildUrl();
    dom.settingsPanel.classList.remove('open');
    pushLog('sys', 'Configuration applied.');
    saveState();
});

dom.idleInput.addEventListener('change', (e) => {
    state.idleSeconds = parseInt(e.target.value) || 0;
    saveState();
    startIdleWatcher();
});

dom.historySizeInput.addEventListener('change', (e) => {
    state.historySize = parseInt(e.target.value) || 5;
    renderHistoryChips();
    saveState();
});

// Init
loadState();
