/**
 * TopicRouter - 消息路由模块
 * 
 * 负责将 MQTT 消息分发到匹配的 TopicSession。
 */

import { topicManager, matchTopic } from './TopicManager.js';

/**
 * TopicRouter - 消息路由器
 * 
 * 接收 MQTT 消息并分发到所有匹配的主题会话。
 */
export class TopicRouter {
  constructor(manager = topicManager) {
    this.manager = manager;
    
    /** @type {Function|null} 消息处理回调 */
    this.onMessageRouted = null;
  }

  /**
   * 路由消息到匹配的会话
   * @param {string} messageTopic 消息主题
   * @param {string} payload 消息内容
   * @param {Object} [meta] 额外元数据
   * @returns {TopicSession[]} 接收到消息的会话列表
   */
  routeMessage(messageTopic, payload, meta = {}) {
    const matchingSessions = this.manager.findMatchingSessions(messageTopic);
    
    if (matchingSessions.length === 0) {
      console.warn(`无会话匹配主题: ${messageTopic}`);
      return [];
    }

    const logEntry = {
      kind: 'rx',
      message: payload,
      time: this._formatTime(),
      originalTopic: messageTopic,
      ...meta
    };

    for (const session of matchingSessions) {
      session.addLog(logEntry);
      
      // 如果不是活动会话，增加未读计数
      if (session.id !== this.manager.activeTopicId) {
        session.incrementUnread();
      }
    }

    // 触发回调
    if (this.onMessageRouted) {
      this.onMessageRouted(matchingSessions, logEntry);
    }

    return matchingSessions;
  }

  /**
   * 添加发送消息日志（TX）
   * @param {string} topic 发送主题
   * @param {string} message 消息内容
   */
  addSentMessage(topic, message) {
    // 尝试找到匹配的会话
    const session = this.manager.findByTopic(topic);
    
    const logEntry = {
      kind: 'tx',
      message: `[发送到 ${topic}]\n${message}`,
      time: this._formatTime(),
      originalTopic: topic
    };

    if (session) {
      session.addLog(logEntry);
    } else {
      // 如果没有匹配的会话，添加到活动会话
      const activeSession = this.manager.getActiveSession();
      if (activeSession) {
        activeSession.addLog(logEntry);
      }
    }
  }

  /**
   * 添加系统消息
   * @param {string} message 系统消息
   * @param {string} [sessionId] 可选的会话 ID，如果不提供则添加到活动会话
   */
  addSystemMessage(message, sessionId = null) {
    const logEntry = {
      kind: 'sys',
      message,
      time: this._formatTime()
    };

    if (sessionId) {
      const session = this.manager.sessions.get(sessionId);
      if (session) {
        session.addLog(logEntry);
      }
    } else {
      const activeSession = this.manager.getActiveSession();
      if (activeSession) {
        activeSession.addLog(logEntry);
      }
    }
  }

  /**
   * 广播系统消息到所有会话
   * @param {string} message 系统消息
   */
  broadcastSystemMessage(message) {
    const logEntry = {
      kind: 'sys',
      message,
      time: this._formatTime()
    };

    for (const session of this.manager.sessions.values()) {
      session.addLog(logEntry);
    }
  }

  /**
   * 格式化时间
   * @private
   * @returns {string}
   */
  _formatTime(date = new Date()) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  }
}

// 导出单例
export const topicRouter = new TopicRouter();
