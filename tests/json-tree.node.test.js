import assert from 'node:assert/strict';
import { getType, parseJson, buildTreeData, renderTreeHtml } from '../src/modules/JsonTreeRenderer.js';

console.log('🧪 JSON 树形结构渲染器单元测试\n');
console.log('='.repeat(60));

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    failCount++;
  }
}

// 1. 类型判定测试
test('getType 正确识别基本数据类型', () => {
  assert.equal(getType('hello'), 'string');
  assert.equal(getType(123), 'number');
  assert.equal(getType(true), 'boolean');
  assert.equal(getType(false), 'boolean');
  assert.equal(getType(null), 'null');
  assert.equal(getType(undefined), 'undefined');
});

test('getType 正确识别复合数据类型', () => {
  assert.equal(getType([]), 'array');
  assert.equal(getType([1, 2]), 'array');
  assert.equal(getType({}), 'object');
  assert.equal(getType({ a: 1 }), 'object');
});

// 2. parseJson 容错解析
test('parseJson 正确解析合法 JSON', () => {
  const res = parseJson('{"name":"sensor-1","temp":25.5,"active":true}');
  assert.equal(res.valid, true);
  assert.equal(res.data.name, 'sensor-1');
  assert.equal(res.data.temp, 25.5);
  assert.equal(res.data.active, true);
});

test('parseJson 正确处理非合法 JSON', () => {
  const res = parseJson('not a json');
  assert.equal(res.valid, false);
  assert.equal(res.data, null);
  assert.ok(res.error);
});

test('parseJson 正确提取带 [发送到 topic] 前缀的消息正文中的 JSON', () => {
  const raw = '[发送到 home/temp]\n{"sensor":"dht22","val":26.8}';
  const res = parseJson(raw);
  assert.equal(res.valid, true);
  assert.equal(res.prefix, '[发送到 home/temp]');
  assert.equal(res.data.sensor, 'dht22');
  assert.equal(res.data.val, 26.8);
});

test('parseJson 正确提取带 [topic] 前缀的消息正文中的 JSON', () => {
  const raw = '[device/status] {"online":true,"uptime":3600}';
  const res = parseJson(raw);
  assert.equal(res.valid, true);
  assert.equal(res.prefix, '[device/status]');
  assert.equal(res.data.online, true);
});

test('parseJson 正确支持前后多余空行与空格的 JSON', () => {
  const raw = '  \n\n  {"ok": true}  \n ';
  const res = parseJson(raw);
  assert.equal(res.valid, true);
  assert.equal(res.data.ok, true);
});

// 3. buildTreeData 节点树构建
test('buildTreeData 正确构建嵌套树结构与摘要', () => {
  const data = {
    device: 'esp32',
    sensors: [21.5, 22.0],
    config: { enabled: true, alert: null }
  };

  const tree = buildTreeData(data, '', 0, { defaultExpandDepth: 1 });
  assert.equal(tree.type, 'object');
  assert.equal(tree.isLeaf, false);
  assert.equal(tree.count, 3);
  assert.equal(tree.expanded, true);
  assert.equal(tree.children.length, 3);

  // device 节点
  const devNode = tree.children.find(c => c.key === 'device');
  assert.equal(devNode.type, 'string');
  assert.equal(devNode.isLeaf, true);
  assert.equal(devNode.value, 'esp32');

  // sensors 数组节点
  const sensorsNode = tree.children.find(c => c.key === 'sensors');
  assert.equal(sensorsNode.type, 'array');
  assert.equal(sensorsNode.isLeaf, false);
  assert.equal(sensorsNode.count, 2);
  assert.equal(sensorsNode.children.length, 2);

  // config 深度折叠逻辑 (depth=1，子节点 depth=2 应根据 defaultExpandDepth:1 设为 expanded:false)
  const configNode = tree.children.find(c => c.key === 'config');
  assert.equal(configNode.expanded, true); // depth 1 展开
  // alert 值为 null 的节点
  const alertNode = configNode.children.find(c => c.key === 'alert');
  assert.equal(alertNode.type, 'null');
  assert.equal(alertNode.value, 'null');
});

// 4. renderTreeHtml HTML 输出测试
test('renderTreeHtml 渲染包含结构类名与高亮标签', () => {
  const data = { status: 'online', code: 200 };
  const html = renderTreeHtml(data);
  assert.ok(html.includes('json-tree-root'));
  assert.ok(html.includes('json-key'));
  assert.ok(html.includes('json-val-string'));
  assert.ok(html.includes('json-val-number'));
  assert.ok(html.includes('online'));
  assert.ok(html.includes('200'));
});

console.log('='.repeat(60));
console.log(`\n📊 结果: ${passCount} 通过, ${failCount} 失败\n`);

if (failCount > 0) {
  process.exit(1);
}
