/**
 * 主题匹配算法 Node.js 测试脚本
 * 运行: node tests/topic-matching.node.test.js
 */

// 内联 matchTopic 函数
function matchTopic(subscriptionPattern, messageTopic) {
  if (!subscriptionPattern || !messageTopic) return false;
  if (subscriptionPattern === messageTopic) return true;
  if (subscriptionPattern === '#') return true;
  
  const patternParts = subscriptionPattern.split('/');
  const topicParts = messageTopic.split('/');
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    
    if (patternPart === '#') {
      return true;
    }
    
    if (i >= topicParts.length) {
      return false;
    }
    
    const topicPart = topicParts[i];
    
    if (patternPart === '+') {
      continue;
    }
    
    if (patternPart !== topicPart) {
      return false;
    }
  }
  
  return patternParts.length === topicParts.length;
}

// 测试用例
const testCases = [
  // 精确匹配
  { pattern: 'home/temp', topic: 'home/temp', expected: true },
  { pattern: 'home/temp', topic: 'home/humidity', expected: false },
  
  // 单级通配符 +
  { pattern: 'home/+/temp', topic: 'home/living/temp', expected: true },
  { pattern: 'home/+/temp', topic: 'home/living/room/temp', expected: false },
  { pattern: '+/temp', topic: 'home/temp', expected: true },
  
  // 多级通配符 #
  { pattern: 'home/#', topic: 'home/living/room/temp', expected: true },
  { pattern: 'home/#', topic: 'home/temp', expected: true },
  { pattern: 'home/#', topic: 'home', expected: true }, // MQTT 3.1.1: # 匹配零级
  { pattern: '#', topic: 'any/topic/here', expected: true },
  
  // 边界情况
  { pattern: '', topic: 'home', expected: false },
  { pattern: 'home', topic: '', expected: false },
];

// 运行测试
console.log('🧪 MQTT 主题匹配算法测试\n');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;

for (const test of testCases) {
  const result = matchTopic(test.pattern, test.topic);
  const ok = result === test.expected;
  
  if (ok) {
    passed++;
    console.log(`✅ PASS: matchTopic("${test.pattern}", "${test.topic}") = ${result}`);
  } else {
    failed++;
    console.log(`❌ FAIL: matchTopic("${test.pattern}", "${test.topic}")`);
    console.log(`        期望: ${test.expected}, 实际: ${result}`);
  }
}

console.log('=' .repeat(60));
console.log(`\n📊 结果: ${passed} 通过, ${failed} 失败\n`);

if (failed === 0) {
  console.log('🎉 所有测试通过!');
  process.exit(0);
} else {
  console.log('⚠️ 有测试失败!');
  process.exit(1);
}
