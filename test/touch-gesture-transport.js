'use strict';
// Exercise the actual closed-over tap function with a fake CDP transport.
// Browser delivery is checked separately by the real mobile-emulation job.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'lib/playable-browser.js'), 'utf8');
const start = source.indexOf('  async function tap(x, y) {');
const end = source.indexOf('  async function reload()', start);
assert.ok(start >= 0 && end > start, 'Load actual tap implementation');
function fixture(mobile, rejectMethod) {
  const calls = [], events = [];
  const context = { width: 390, height: 844, options: { mobile },
    assertOpen() {}, record: (type, value) => events.push({type, ...value}),
    integer(v, name, min, max) { assert.ok(Number.isInteger(v) && v >= min && v <= max, name); },
    cdp: { async send(method, params) {
      calls.push({ method, params: JSON.parse(JSON.stringify(params)) });
      if (method === rejectMethod) throw new Error('transport refused');
      return {};
    } }
  };
  vm.runInNewContext(source.slice(start, end) + '\nthis.tap = tap;', context);
  return { tap: context.tap, calls, events };
}
async function main() {
  const touch = fixture(true); await touch.tap(50, 60);
  assert.deepEqual(touch.calls, [{method:'Input.synthesizeTapGesture',params:{x:50,y:60,duration:20,tapCount:1,gestureSourceType:'touch'}}]);
  assert.equal(touch.events[0].durationMs,20);
  for (const args of [[-1,5],[390,5],[5,844],[NaN,5],[5,1.2]]) await assert.rejects(touch.tap(...args));
  assert.equal(touch.calls.length,1,'Invalid coordinates never reach Chrome');
  const mouse=fixture(false); await mouse.tap(10,20);
  assert.deepEqual(mouse.calls.map(c=>[c.method,c.params.type]),[['Input.dispatchMouseEvent','mousePressed'],['Input.dispatchMouseEvent','mouseReleased']]);
  const refused=fixture(true,'Input.synthesizeTapGesture'); await assert.rejects(refused.tap(10,20),/transport refused/);
  assert.deepEqual(refused.calls.map(c=>[c.method,c.params.type]),[['Input.synthesizeTapGesture',undefined],['Input.dispatchTouchEvent','touchCancel']]);
  const mouseRefused=fixture(false,'Input.dispatchMouseEvent'); await assert.rejects(mouseRefused.tap(10,20),/transport refused/);
  assert.equal(mouseRefused.calls.length,2,'A failed mouse down still releases input');
  console.log('touch-gesture-transport: bounded browser-owned tap, validation and failure cleanup PASS (host fixture)');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
