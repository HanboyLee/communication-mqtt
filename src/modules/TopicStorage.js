/**
 * TopicStorage - 主题配置存储模块
 * 
 * 负责将主题配置持久化到 chrome.storage.local。
 */

import { topicManager } from './TopicManager.js';

/**
 * 存储 key 常量
 */
const STORAGE_KEYS = {
  topicConfigs: 'ws:topicConfigs',
  activeTopicId: 'ws:activeTopicId',
  topicOrder: 'ws:topicOrder'
};

/**
 * TopicStorage - 主题存储管理器
 */
export class TopicStorage {
  constructor(manager = topicManager) {
    this.manager = manager;
  }

  /**
   * 保存所有主题配置
   * @returns {Promise<void>}
   */
  async saveAll() {
    const config = this.manager.exportConfig();
    
    await chrome.storage.local.set({
      [STORAGE_KEYS.topicConfigs]: config.topicConfigs,
      [STORAGE_KEYS.activeTopicId]: config.activeTopicId,
      [STORAGE_KEYS.topicOrder]: config.topicOrder
    });
    
    console.log('主题配置已保存', config);
  }

  /**
   * 加载所有主题配置
   * @returns {Promise<void>}
   */
  async loadAll() {
    const stored = await chrome.storage.local.get([
      STORAGE_KEYS.topicConfigs,
      STORAGE_KEYS.activeTopicId,
      STORAGE_KEYS.topicOrder
    ]);

    const config = {
      topicConfigs: stored[STORAGE_KEYS.topicConfigs] || [],
      activeTopicId: stored[STORAGE_KEYS.activeTopicId] || null,
      topicOrder: stored[STORAGE_KEYS.topicOrder] || []
    };

    this.manager.importConfig(config);
    console.log('主题配置已加载', config);
  }

  /**
   * 保存活动主题 ID
   * @returns {Promise<void>}
   */
  async saveActiveTopicId() {
    await chrome.storage.local.set({
      [STORAGE_KEYS.activeTopicId]: this.manager.activeTopicId
    });
  }

  /**
   * 清除所有主题配置
   * @returns {Promise<void>}
   */
  async clearAll() {
    await chrome.storage.local.remove([
      STORAGE_KEYS.topicConfigs,
      STORAGE_KEYS.activeTopicId,
      STORAGE_KEYS.topicOrder
    ]);
    
    this.manager.clear();
    console.log('主题配置已清除');
  }

  /**
   * 检查是否有保存的配置
   * @returns {Promise<boolean>}
   */
  async hasStoredConfig() {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.topicConfigs);
    return Array.isArray(stored[STORAGE_KEYS.topicConfigs]) && 
           stored[STORAGE_KEYS.topicConfigs].length > 0;
  }
}

// 导出单例
export const topicStorage = new TopicStorage();
