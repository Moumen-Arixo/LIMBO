/*
  فحص بنيوي محلي بلا مكتبات خارجية.
  شغّله عبر: node tests/validate-project.cjs
*/
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

// بيانات الحملة والواجهة
assert.equal((source.match(/ actName:/g) || []).length, 25, 'يجب أن تحتوي الحملة على 25 فصلاً.');
const storyBlock = source.slice(source.indexOf('const STORY_BEATS'), source.indexOf('const SAVE_KEY'));
assert.equal((storyBlock.match(/^    \['/gm) || []).length, 25, 'يجب أن يحتوي كل فصل على نبضة سردية.');
for (const id of ['game', 'settings-screen', 'dialogue', 'chapter-map', 'start-btn', 'settings-btn']) {
  assert.match(html, new RegExp(`\\bid=["']${id}["']`), `العنصر #${id} مفقود من الواجهة.`);
}
for (const option of ['guidance', 'gentle', 'reducedMotion', 'highContrast']) {
  assert.match(html, new RegExp(`data-setting="${option}"`), `خيار الإتاحة ${option} مفقود.`);
}

// لا نحتاج متصفحاً لفحص أن تحميل الملف لا يرمي خطأ قبل بدء حلقة الرسم.
const ids = [...html.matchAll(/\bid=["']([^"']+)/g)].map((match) => match[1]);
function makeNode() {
  return {
    textContent: '', innerHTML: '', dataset: {}, disabled: false, style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, setAttribute() {}, appendChild() {}, getContext() { return {}; }
  };
}
const nodes = Object.fromEntries(ids.map((id) => [id, makeNode()]));
// يكفي هذا الـ proxy لمحاكاة Canvas مرة واحدة؛ الغاية كشف أخطاء الرسم المبكرة لا مقارنة البكسلات.
const gradient = { addColorStop() {} };
const canvasContext = new Proxy({}, {
  get: (_target, key) => {
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
    return () => {};
  },
  set: () => true
});
nodes.game.clientWidth = 1280;
nodes.game.clientHeight = 720;
nodes.game.getContext = () => canvasContext;
const document = {
  body: makeNode(),
  getElementById: (id) => nodes[id] || makeNode(),
  querySelectorAll: () => [],
  createElement: () => makeNode()
};
let rafCount = 0;
const context = {
  console, document,
  window: { AudioContext: null, webkitAudioContext: null, addEventListener() {}, matchMedia: () => ({ matches: false }), confirm: () => false, devicePixelRatio: 1 },
  localStorage: { getItem: () => null, setItem() {} },
  setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame: (callback) => { if (rafCount++ === 0) callback(16); }, Math, JSON
};
vm.createContext(context);
vm.runInContext(source, context, { filename: 'game.js' });

console.log('PASS: campaign content, UI bindings, settings, bootstrap, and one Canvas render frame are valid.');
