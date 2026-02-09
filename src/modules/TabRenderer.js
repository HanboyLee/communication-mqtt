/**
 * TabRenderer - Tab Bar 渲染模块
 * 
 * 负责渲染和管理主题标签页 UI。
 */

import { topicManager } from './TopicManager.js';

/**
 * TabRenderer - 标签页渲染器
 */
export class TabRenderer {
  constructor(manager = topicManager) {
    this.manager = manager;
    
    /** @type {HTMLElement|null} */
    this.tabsContainer = null;
    
    /** @type {Function|null} 点击 Tab 回调 */
    this.onTabClick = null;
    
    /** @type {Function|null} 关闭 Tab 回调 */
    this.onTabClose = null;
    
    /** @type {Function|null} 添加主题回调 */
    this.onAddTopic = null;
  }

  /**
   * 初始化渲染器
   * @param {string} containerId Tab 容器 ID
   */
  init(containerId = 'topicTabs') {
    this.tabsContainer = document.getElementById(containerId);
    
    if (!this.tabsContainer) {
      console.error('TabRenderer: 找不到容器元素', containerId);
      return;
    }

    // 监听 manager 状态变化
    this.manager.onStateChange = () => this.render();
  }

  /**
   * 渲染所有 Tab
   */
  render() {
    if (!this.tabsContainer) return;

    const sessions = this.manager.getAllSessions();
    const activeId = this.manager.activeTopicId;

    // 清空容器
    this.tabsContainer.innerHTML = '';

    if (sessions.length === 0) {
      // 显示空状态提示
      this.tabsContainer.innerHTML = `
        <div class="topic-tab-empty">
          <span style="color: var(--text-secondary); font-size: 0.85rem;">
            点击 <i class="fa-solid fa-plus"></i> 添加主题
          </span>
        </div>
      `;
      return;
    }

    const frag = document.createDocumentFragment();

    for (const session of sessions) {
      const tab = this._createTabElement(session, session.id === activeId);
      frag.appendChild(tab);
    }

    this.tabsContainer.appendChild(frag);
  }

  /**
   * 创建单个 Tab 元素
   * @param {Object} session TopicSession 实例
   * @param {boolean} isActive 是否为活动 Tab
   * @returns {HTMLElement}
   */
  _createTabElement(session, isActive) {
    const tab = document.createElement('div');
    tab.className = `topic-tab${isActive ? ' active' : ''}`;
    tab.dataset.id = session.id;
    tab.style.setProperty('--tab-color', session.color);

    // 状态指示器
    const indicator = document.createElement('span');
    indicator.className = 'tab-indicator';
    if (session.isSubscribed) {
      indicator.classList.add('subscribed');
    } else if (session.isPaused) {
      indicator.classList.add('pending');
    } else {
      indicator.classList.add('error');
    }
    indicator.style.background = session.isSubscribed ? session.color : '';

    // 名称
    const name = document.createElement('span');
    name.className = 'tab-name';
    name.textContent = session.displayName || session.topic;
    name.title = session.topic;

    // 未读徽章 (只显示未读数，不显示消息总数)
    const badge = document.createElement('span');
    badge.className = 'tab-badge';
    if (session.unreadCount > 0 && !isActive) {
      badge.textContent = session.unreadCount > 99 ? '99+' : session.unreadCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }

    // 关闭按钮
    const closeBtn = document.createElement('span');
    closeBtn.className = 'tab-close';
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onTabClose) {
        this.onTabClose(session.id, session.topic);
      }
    });

    // 组装
    tab.appendChild(indicator);
    tab.appendChild(name);
    tab.appendChild(badge);
    tab.appendChild(closeBtn);

    // 点击切换
    tab.addEventListener('click', () => {
      if (this.onTabClick) {
        this.onTabClick(session.id);
      }
    });

    return tab;
  }

  /**
   * 更新单个 Tab 的徽章
   * @param {string} sessionId 会话 ID
   */
  updateBadge(sessionId) {
    const session = this.manager.sessions.get(sessionId);
    if (!session) return;

    const tab = this.tabsContainer?.querySelector(`[data-id="${sessionId}"]`);
    if (!tab) return;

    const badge = tab.querySelector('.tab-badge');
    if (badge) {
      const isActive = sessionId === this.manager.activeTopicId;
      if (session.unreadCount > 0 && !isActive) {
        badge.textContent = session.unreadCount > 99 ? '99+' : session.unreadCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  /**
   * 更新 Tab 订阅状态指示器
   * @param {string} sessionId 会话 ID
   * @param {string} status 'subscribed' | 'pending' | 'error'
   */
  updateIndicator(sessionId, status) {
    const tab = this.tabsContainer?.querySelector(`[data-id="${sessionId}"]`);
    if (!tab) return;

    const indicator = tab.querySelector('.tab-indicator');
    if (indicator) {
      indicator.className = `tab-indicator ${status}`;
    }
  }
}

// 导出单例
export const tabRenderer = new TabRenderer();
