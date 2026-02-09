/**
 * TopicManager - 多主题订阅管理模块
 * 
 * 提供 TopicSession 数据结构和 TopicManager 类，用于管理多个 MQTT 主题订阅。
 */

/**
 * 生成唯一 ID
 * @returns {string} UUID
 */
export const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 预设颜色列表
 */
export const topicColors = [
  { name: 'blue', value: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { name: 'green', value: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { name: 'orange', value: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { name: 'purple', value: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  { name: 'pink', value: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
  { name: 'cyan', value: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
];

/**
 * TopicSession - 主题会话类
 * 
 * 表示一个订阅主题的完整状态，包括配置、日志和统计信息。
 */
export class TopicSession {
  /**
   * @param {Object} options 配置选项
   * @param {string} options.topic MQTT 主题名称
   * @param {string} [options.displayName] 显示名称
   * @param {number} [options.qos=0] QoS 等级
   * @param {string} [options.color] 颜色标识
   * @param {number} [options.maxLogs=1000] 最大日志数
   */
  constructor(options = {}) {
    this.id = options.id || generateId();
    this.topic = options.topic || '';
    this.displayName = options.displayName || options.topic || '';
    this.qos = options.qos ?? 0;
    this.color = options.color || topicColors[0].value;
    this.colorBg = options.colorBg || topicColors[0].bg;
    
    // 日志管理
    this.logs = [];
    this.maxLogs = options.maxLogs ?? 1000;
    
    // 状态标志
    this.isSubscribed = false;
    this.isPaused = false;
    this.isMuted = false;
    this.autoScroll = true;
    this.jsonFormat = true;
    
    // 统计信息
    this.unreadCount = 0;
    this.totalReceived = 0;
    this.lastMessage = null;
    this.created = options.created || Date.now();
    
    // 过滤器
    this.filter = '';
  }

  /**
   * 添加日志条目
   * @param {Object} entry 日志条目 { kind, message, time, topic }
   */
  addLog(entry) {
    if (this.isPaused) return;
    
    this.logs.push({
      ...entry,
      id: generateId(),
      timestamp: Date.now()
    });
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    this.totalReceived++;
    this.lastMessage = Date.now();
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
    this.unreadCount = 0;
  }

  /**
   * 增加未读计数
   */
  incrementUnread() {
    this.unreadCount++;
  }

  /**
   * 重置未读计数
   */
  resetUnread() {
    this.unreadCount = 0;
  }

  /**
   * 获取过滤后的日志
   * @returns {Array} 过滤后的日志数组
   */
  getFilteredLogs() {
    if (!this.filter) return this.logs;
    
    const filterLower = this.filter.toLowerCase();
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(filterLower)
    );
  }

  /**
   * 导出为可持久化的配置对象（不包含日志）
   * @returns {Object} 配置对象
   */
  toConfig() {
    return {
      id: this.id,
      topic: this.topic,
      displayName: this.displayName,
      qos: this.qos,
      color: this.color,
      colorBg: this.colorBg,
      maxLogs: this.maxLogs,
      autoScroll: this.autoScroll,
      jsonFormat: this.jsonFormat,
      isPaused: this.isPaused,
      created: this.created
    };
  }

  /**
   * 从配置对象恢复
   * @param {Object} config 配置对象
   * @returns {TopicSession} 新的 TopicSession 实例
   */
  static fromConfig(config) {
    return new TopicSession(config);
  }
}

/**
 * MQTT 主题匹配算法
 * 
 * 支持 MQTT 通配符：
 * - `+` 单级通配符：匹配一个层级
 * - `#` 多级通配符：匹配零个或多个层级（必须在末尾）
 * 
 * @param {string} subscriptionPattern 订阅主题模式
 * @param {string} messageTopic 消息主题
 * @returns {boolean} 是否匹配
 */
export function matchTopic(subscriptionPattern, messageTopic) {
  // 空检查
  if (!subscriptionPattern || !messageTopic) return false;
  
  // 精确匹配
  if (subscriptionPattern === messageTopic) return true;
  
  // 全匹配通配符
  if (subscriptionPattern === '#') return true;
  
  const patternParts = subscriptionPattern.split('/');
  const topicParts = messageTopic.split('/');
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    
    // 多级通配符 # - 匹配零个或多个层级
    if (patternPart === '#') {
      // # 必须是最后一个
      // 如果 pattern 是 "home/#"，topicParts 可以是 ["home"] 或 ["home", "living", ...]
      // i 指向 #，patternParts[0..i-1] 已经匹配完成
      // 只需要确保 topicParts 长度 >= i（即前面的部分已匹配）
      return true;
    }
    
    // 如果消息主题已无更多层级
    if (i >= topicParts.length) {
      return false;
    }
    
    const topicPart = topicParts[i];
    
    // 单级通配符 + - 匹配任意一个层级
    if (patternPart === '+') {
      continue;
    }
    
    // 精确匹配该层级
    if (patternPart !== topicPart) {
      return false;
    }
  }
  
  // 检查长度是否一致（pattern 没有 # 的情况）
  return patternParts.length === topicParts.length;
}

/**
 * TopicManager - 多主题管理器
 * 
 * 管理所有 TopicSession 实例的生命周期。
 */
export class TopicManager {
  constructor() {
    /** @type {Map<string, TopicSession>} */
    this.sessions = new Map();
    
    /** @type {string|null} 当前活动主题 ID */
    this.activeTopicId = null;
    
    /** @type {string[]} Tab 顺序 */
    this.topicOrder = [];
    
    /** @type {number} 已使用的颜色索引 */
    this._colorIndex = 0;
    
    /** @type {Function|null} 状态变更回调 */
    this.onStateChange = null;
  }

  /**
   * 获取下一个可用颜色
   * @returns {Object} { value, bg }
   */
  _getNextColor() {
    const color = topicColors[this._colorIndex % topicColors.length];
    this._colorIndex++;
    return color;
  }

  /**
   * 创建新的主题会话
   * @param {string} topic MQTT 主题
   * @param {Object} [options] 额外选项
   * @returns {TopicSession} 新创建的会话
   */
  createSession(topic, options = {}) {
    // 检查是否已存在相同主题
    for (const session of this.sessions.values()) {
      if (session.topic === topic) {
        console.warn(`主题 "${topic}" 已存在`);
        return session;
      }
    }
    
    const color = this._getNextColor();
    const session = new TopicSession({
      topic,
      color: color.value,
      colorBg: color.bg,
      ...options
    });
    
    this.sessions.set(session.id, session);
    this.topicOrder.push(session.id);
    
    // 如果是第一个主题，设为活动
    if (this.sessions.size === 1) {
      this.activeTopicId = session.id;
    }
    
    this._notifyChange();
    return session;
  }

  /**
   * 删除主题会话
   * @param {string} sessionId 会话 ID
   * @returns {boolean} 是否成功删除
   */
  deleteSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      return false;
    }
    
    this.sessions.delete(sessionId);
    this.topicOrder = this.topicOrder.filter(id => id !== sessionId);
    
    // 如果删除的是活动主题，切换到第一个
    if (this.activeTopicId === sessionId) {
      this.activeTopicId = this.topicOrder[0] || null;
    }
    
    this._notifyChange();
    return true;
  }

  /**
   * 切换活动主题
   * @param {string} sessionId 会话 ID
   */
  switchToSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      return;
    }
    
    this.activeTopicId = sessionId;
    
    // 重置该主题的未读计数
    const session = this.sessions.get(sessionId);
    if (session) {
      session.resetUnread();
    }
    
    this._notifyChange();
  }

  /**
   * 获取活动会话
   * @returns {TopicSession|null}
   */
  getActiveSession() {
    return this.activeTopicId ? this.sessions.get(this.activeTopicId) : null;
  }

  /**
   * 获取所有会话（按顺序）
   * @returns {TopicSession[]}
   */
  getAllSessions() {
    return this.topicOrder
      .map(id => this.sessions.get(id))
      .filter(Boolean);
  }

  /**
   * 根据主题名称查找会话
   * @param {string} topic 主题名称
   * @returns {TopicSession|null}
   */
  findByTopic(topic) {
    for (const session of this.sessions.values()) {
      if (session.topic === topic) {
        return session;
      }
    }
    return null;
  }

  /**
   * 查找所有匹配消息主题的会话
   * @param {string} messageTopic 消息主题
   * @returns {TopicSession[]} 匹配的会话列表
   */
  findMatchingSessions(messageTopic) {
    const matches = [];
    for (const session of this.sessions.values()) {
      if (matchTopic(session.topic, messageTopic)) {
        matches.push(session);
      }
    }
    return matches;
  }

  /**
   * 更新会话的订阅状态
   * @param {string} sessionId 会话 ID
   * @param {boolean} isSubscribed 是否已订阅
   */
  setSubscribed(sessionId, isSubscribed) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isSubscribed = isSubscribed;
      this._notifyChange();
    }
  }

  /**
   * 导出所有配置
   * @returns {Object} 配置对象
   */
  exportConfig() {
    return {
      topicConfigs: this.getAllSessions().map(s => s.toConfig()),
      activeTopicId: this.activeTopicId,
      topicOrder: [...this.topicOrder]
    };
  }

  /**
   * 从配置恢复
   * @param {Object} config 配置对象
   */
  importConfig(config) {
    this.sessions.clear();
    this.topicOrder = [];
    
    if (config.topicConfigs) {
      for (const topicConfig of config.topicConfigs) {
        const session = TopicSession.fromConfig(topicConfig);
        this.sessions.set(session.id, session);
      }
    }
    
    this.topicOrder = config.topicOrder || [];
    this.activeTopicId = config.activeTopicId || this.topicOrder[0] || null;
    
    // 更新颜色索引
    this._colorIndex = this.sessions.size;
    
    this._notifyChange();
  }

  /**
   * 通知状态变更
   * @private
   */
  _notifyChange() {
    if (this.onStateChange) {
      this.onStateChange(this);
    }
  }

  /**
   * 清空所有会话
   */
  clear() {
    this.sessions.clear();
    this.topicOrder = [];
    this.activeTopicId = null;
    this._colorIndex = 0;
    this._notifyChange();
  }
}

// 导出单例
export const topicManager = new TopicManager();
