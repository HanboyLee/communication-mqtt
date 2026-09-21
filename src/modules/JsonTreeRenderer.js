/**
 * JsonTreeRenderer.js
 * 轻量级、无外部依赖的交互式 JSON 树形结构渲染器
 * 负责解析 JSON 数据，渲染可分级折叠/展开、带语法高亮的 DOM 树，并提供便捷操作工具栏。
 */

/**
 * 精确判断数据类型
 * @param {any} val
 * @returns {'string'|'number'|'boolean'|'null'|'array'|'object'|'undefined'}
 */
export function getType(val) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

/**
 * 安全解析 JSON 字符串（支持前缀提取与容错）
 * @param {string|any} input
 * @returns {{ valid: boolean, data: any, prefix?: string, error?: string }}
 */
export function parseJson(input) {
  if (typeof input !== 'string') {
    if (typeof input === 'object' && input !== null) {
      return { valid: true, data: input };
    }
    return { valid: false, data: null, error: '输入不是字符串或对象' };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, data: null, error: '输入为空' };
  }

  // 1. 尝试直接标准解析
  try {
    const data = JSON.parse(trimmed);
    if (data !== null && typeof data === 'object') {
      return { valid: true, data };
    }
  } catch (e) {
    // 继续尝试带前缀匹配或子串提取
  }

  // 2. 检查常见带方括号前缀的日志格式：例如 "[发送到 topic]\n{...}" 或 "[topic] {...}"
  const prefixMatch = trimmed.match(/^(\[[^\]]+\]\s*)([\s\S]*)$/);
  if (prefixMatch) {
    const prefix = prefixMatch[1].trim();
    const rest = prefixMatch[2].trim();
    if (rest) {
      try {
        const data = JSON.parse(rest);
        if (data !== null && typeof data === 'object') {
          return { valid: true, data, prefix };
        }
      } catch (e) {
        // 继续兜底提取
      }
    }
  }

  // 3. 智能提取：如果消息中夹带 JSON 块（从第一个 '{' 到最后一个 '}' 或 '[' 到 ']'）
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      const data = JSON.parse(candidate);
      if (data !== null && typeof data === 'object') {
        const prefix = trimmed.substring(0, firstBrace).trim();
        return { valid: true, data, prefix: prefix || undefined };
      }
    } catch (e) {
      // 忽略
    }
  }

  // 4. 尝试宽松 JSON 容错（单引号/无引号键名兼容）
  try {
    const candidate = (firstBrace !== -1 && lastBrace > firstBrace)
      ? trimmed.substring(firstBrace, lastBrace + 1)
      : (firstBracket !== -1 && lastBracket > firstBracket)
        ? trimmed.substring(firstBracket, lastBracket + 1)
        : trimmed;

    const relaxed = candidate
      .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"')
      .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
    const data = JSON.parse(relaxed);
    if (data !== null && typeof data === 'object') {
      const prefix = (candidate !== trimmed) ? trimmed.substring(0, trimmed.indexOf(candidate)).trim() : undefined;
      return { valid: true, data, prefix: prefix || undefined };
    }
  } catch (e) {
    // 忽略
  }

  return { valid: false, data: null, error: '未能解析出有效 JSON 对象或数组' };
}

/**
 * 构建树形节点数据结构（支持递归深度与折叠预计算）
 * @param {any} data
 * @param {string} key
 * @param {number} depth
 * @param {{ defaultExpandDepth?: number }} options
 * @returns {object}
 */
export function buildTreeData(data, key = '', depth = 0, options = {}) {
  const defaultExpandDepth = options.defaultExpandDepth !== undefined ? options.defaultExpandDepth : 1;
  const type = getType(data);
  const isLeaf = type !== 'object' && type !== 'array';
  const expanded = depth <= defaultExpandDepth;

  if (isLeaf) {
    let formattedVal = String(data);
    if (type === 'string') formattedVal = data;
    return {
      key,
      type,
      depth,
      isLeaf: true,
      value: formattedVal,
      expanded: true,
      children: []
    };
  }

  const isArray = type === 'array';
  const entries = isArray
    ? data.map((v, i) => [String(i), v])
    : Object.entries(data);

  const count = entries.length;
  const summary = isArray ? `Array(${count})` : `{ ${count} keys }`;

  const children = entries.map(([childKey, childVal]) =>
    buildTreeData(childVal, childKey, depth + 1, options)
  );

  return {
    key,
    type,
    depth,
    isLeaf: false,
    count,
    summary,
    expanded,
    children
  };
}

/**
 * 递归生成节点 HTML 字符串（供测试及简单渲染）
 * @param {any} data
 * @param {{ defaultExpandDepth?: number }} options
 * @returns {string}
 */
export function renderTreeHtml(data, options = {}) {
  const tree = buildTreeData(data, '', 0, options);

  function renderNode(node) {
    if (node.isLeaf) {
      const keyHtml = node.key ? `<span class="json-key">${escapeHtml(node.key)}:</span> ` : '';
      const valHtml = `<span class="json-val json-val-${node.type}">${escapeHtml(JSON.stringify(node.value))}</span>`;
      return `<div class="json-node json-leaf" style="--depth:${node.depth}">${keyHtml}${valHtml}</div>`;
    }

    const keyHtml = node.key ? `<span class="json-key">${escapeHtml(node.key)}:</span> ` : '';
    const toggleIcon = node.expanded ? '▼' : '▶';
    const collapsedCls = node.expanded ? '' : 'collapsed';

    const header = `
      <div class="json-node-header">
        <span class="json-toggle">${toggleIcon}</span>
        ${keyHtml}
        <span class="json-summary">${escapeHtml(node.summary)}</span>
      </div>
    `;

    const childrenHtml = node.children.map(renderNode).join('');
    return `
      <div class="json-node json-branch ${collapsedCls}" style="--depth:${node.depth}">
        ${header}
        <div class="json-children">${childrenHtml}</div>
      </div>
    `;
  }

  return `<div class="json-tree-root">${renderNode(tree)}</div>`;
}

/**
 * HTML 转义辅助函数
 */
function escapeHtml(str) {
  if (typeof str !== 'string') str = String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 在浏览器中创建完整的交互式 JSON 树 DOM
 * @param {any} jsonData
 * @param {object} options
 * @param {string} [options.rawText] 原始字符串，用于一键复制
 * @param {number} [options.defaultExpandDepth=1] 默认展开层级
 * @param {function} [options.onNotify] 提示回调 (如复制成功)
 * @returns {HTMLElement}
 */
export function createJsonTreeDom(jsonData, options = {}) {
  const defaultExpandDepth = options.defaultExpandDepth !== undefined ? options.defaultExpandDepth : 1;
  const rawText = options.rawText || JSON.stringify(jsonData, null, 2);

  const container = document.createElement('div');
  container.className = 'json-tree-container';

  // 1. 顶部小工具栏
  const toolbar = document.createElement('div');
  toolbar.className = 'json-tree-toolbar';

  const type = getType(jsonData);
  const infoSpan = document.createElement('span');
  infoSpan.className = 'json-tree-badge';
  const count = type === 'array' ? jsonData.length : Object.keys(jsonData).length;
  infoSpan.textContent = type === 'array' ? `Array[${count}]` : `Object{${count}}`;

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'json-tree-actions';

  const expandAllBtn = document.createElement('button');
  expandAllBtn.type = 'button';
  expandAllBtn.className = 'json-btn json-btn-expand';
  expandAllBtn.title = '全部展开';
  expandAllBtn.innerHTML = '<i class="fa-solid fa-angles-down"></i>';

  const collapseAllBtn = document.createElement('button');
  collapseAllBtn.type = 'button';
  collapseAllBtn.className = 'json-btn json-btn-collapse';
  collapseAllBtn.title = '全部收起';
  collapseAllBtn.innerHTML = '<i class="fa-solid fa-angles-up"></i>';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'json-btn json-btn-copy';
  copyBtn.title = '复制完整 JSON';
  copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';

  actionsDiv.appendChild(expandAllBtn);
  actionsDiv.appendChild(collapseAllBtn);
  actionsDiv.appendChild(copyBtn);

  toolbar.appendChild(infoSpan);
  toolbar.appendChild(actionsDiv);
  container.appendChild(toolbar);

  // 2. 节点构建
  const treeBody = document.createElement('div');
  treeBody.className = 'json-tree-body';

  function createDomNode(key, val, depth) {
    const valType = getType(val);
    const isLeaf = valType !== 'object' && valType !== 'array';

    const nodeEl = document.createElement('div');
    nodeEl.className = `json-node ${isLeaf ? 'json-leaf' : 'json-branch'}`;
    nodeEl.style.setProperty('--depth', depth);

    if (isLeaf) {
      const line = document.createElement('div');
      line.className = 'json-leaf-line';

      if (key !== '') {
        const keyEl = document.createElement('span');
        keyEl.className = 'json-key';
        keyEl.textContent = `"${key}": `;
        line.appendChild(keyEl);
      }

      const valEl = document.createElement('span');
      valEl.className = `json-val json-val-${valType}`;
      if (valType === 'string') {
        valEl.textContent = `"${val}"`;
      } else {
        valEl.textContent = String(val);
      }
      line.appendChild(valEl);
      nodeEl.appendChild(line);
      return nodeEl;
    }

    // 复合节点（Object / Array）
    const isArray = valType === 'array';
    const entries = isArray
      ? val.map((v, i) => [String(i), v])
      : Object.entries(val);
    const count = entries.length;

    const isExpanded = depth <= defaultExpandDepth;
    if (!isExpanded) {
      nodeEl.classList.add('collapsed');
    }

    const header = document.createElement('div');
    header.className = 'json-node-header';

    const toggle = document.createElement('span');
    toggle.className = 'json-toggle';
    toggle.innerHTML = '<i class="fa-solid fa-caret-down"></i>';
    header.appendChild(toggle);

    if (key !== '') {
      const keyEl = document.createElement('span');
      keyEl.className = 'json-key';
      keyEl.textContent = `"${key}": `;
      header.appendChild(keyEl);
    }

    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';

    const openEl = document.createElement('span');
    openEl.className = 'json-bracket';
    openEl.textContent = openBracket;
    header.appendChild(openEl);

    const summary = document.createElement('span');
    summary.className = 'json-summary';
    summary.textContent = ` ${count} ${isArray ? 'items' : 'keys'} `;
    header.appendChild(summary);

    const closeElInline = document.createElement('span');
    closeElInline.className = 'json-bracket json-bracket-inline';
    closeElInline.textContent = closeBracket;
    header.appendChild(closeElInline);

    nodeEl.appendChild(header);

    // 子节点容器
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'json-children';

    entries.forEach(([childKey, childVal]) => {
      childrenContainer.appendChild(createDomNode(childKey, childVal, depth + 1));
    });

    const footer = document.createElement('div');
    footer.className = 'json-node-footer';
    const closeEl = document.createElement('span');
    closeEl.className = 'json-bracket';
    closeEl.textContent = closeBracket;
    footer.appendChild(closeEl);
    childrenContainer.appendChild(footer);

    nodeEl.appendChild(childrenContainer);

    // 点击头部折叠/展开
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      nodeEl.classList.toggle('collapsed');
    });

    return nodeEl;
  }

  treeBody.appendChild(createDomNode('', jsonData, 0));
  container.appendChild(treeBody);

  // 3. 工具栏按钮事件绑定
  expandAllBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    treeBody.querySelectorAll('.json-branch.collapsed').forEach(el => el.classList.remove('collapsed'));
  });

  collapseAllBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    treeBody.querySelectorAll('.json-branch').forEach(el => el.classList.add('collapsed'));
  });

  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(rawText);
      copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--status-connected)"></i>';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      }, 1500);
      if (typeof options.onNotify === 'function') {
        options.onNotify('JSON 已复制到剪贴板');
      }
    } catch (err) {
      console.error('复制失败:', err);
    }
  });

  return container;
}
