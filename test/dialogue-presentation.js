/* Regression: con WebGL attivo il dialogo vive solo nel pannello HTML.
 * Esegui con: node test/dialogue-presentation.js
 */
'use strict';

const assert = require('assert');
const path = require('path');

let now = 0;
let rafQueue = [];
let legacyDrawOps = 0;
const handlers = {};
const attrs = {};
const elements = {};

for (const id of [
  'cinematic-kicker', 'cinematic-title', 'cinematic-body',
  'cinematic-action', 'cinematic-meta',
  'dialogue-speaker', 'dialogue-context', 'dialogue-text'
]) {
  elements[id] = { textContent: '' };
}

global.window = global;
global.performance = { now: () => now };
global.requestAnimationFrame = (cb) => { rafQueue.push(cb); return rafQueue.length; };
global.setInterval = () => 0;
global.setTimeout = () => 0;
global.localStorage = {
  getItem() { return null; },
  setItem() {},
  removeItem() {}
};
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.document = {
  hidden: false,
  body: {
    setAttribute(name, value) { attrs[name] = value; }
  },
  addEventListener() {},
  getElementById(id) { return elements[id] || null; }
};

const ctx = new Proxy({
  clearRect() {},
  setTransform() {},
  measureText(text) { return { width: String(text).length * 5 }; },
  fillRect() { legacyDrawOps++; },
  fillText() { legacyDrawOps++; }
}, {
  get(target, key) { return key in target ? target[key] : () => {}; },
  set() { return true; }
});
const canvas = { width: 480, height: 320, getContext: () => ctx };

const J = (file) => path.join(__dirname, '..', 'js', file);
require(J('tiles.js'));
require(J('chars.js'));
require(J('maps.js'));
require(J('data.js'));
require(J('retro-font.js'));
require(J('engine.js'));
require(J('glue.js'));

global.GAME.Render3D = {
  init() { return true; },
  render() {},
  prewarm() {}
};

const E = global.GAME.Engine;
E.init(canvas, {});
E.start();
E.loadMap('sheriff', 6, 1, 'right');
E.state.mode = 'play';

handlers.keydown({ code: 'Enter', repeat: false, preventDefault() {} });
assert(E.state.dialogue, 'interaction must open classic dialogue state');

legacyDrawOps = 0;
now += 16;
rafQueue.splice(0).forEach((cb) => cb(now));

assert.strictEqual(attrs['data-dialogue'], 'true', 'HTML dialogue panel must be active');
assert(elements['dialogue-text'].textContent, 'HTML dialogue panel must contain copy');
assert.strictEqual(
  legacyDrawOps,
  0,
  'WebGL frame must not draw legacy canvas dialogue underneath HTML panel'
);

console.log('ok - WebGL dialogue uses only HTML presentation');
