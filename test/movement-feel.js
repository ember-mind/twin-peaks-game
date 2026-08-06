/* movement-feel.js — regressioni deterministiche per input e prenotazione tile.
 * Esegui con: node test/movement-feel.js
 */
'use strict';

const assert = require('assert');
const path = require('path');

let now = 0;
let rafQueue = [];
const windowHandlers = {};
const documentHandlers = {};

global.window = global;
global.performance = { now: () => now };
global.requestAnimationFrame = (cb) => { rafQueue.push(cb); };
global.setInterval = () => 0;
global.localStorage = {
  getItem() { return null; },
  setItem() {},
  removeItem() {}
};
global.addEventListener = (type, fn) => {
  (windowHandlers[type] || (windowHandlers[type] = [])).push(fn);
};
global.document = {
  hidden: false,
  addEventListener(type, fn) {
    (documentHandlers[type] || (documentHandlers[type] = [])).push(fn);
  }
};

const ctxStub = new Proxy(
  { measureText: (s) => ({ width: String(s).length * 5 }) },
  { get(t, k) { return k in t ? t[k] : () => {}; }, set() { return true; } }
);
const canvasStub = { width: 240, height: 160, getContext: () => ctxStub };

const J = (f) => path.join(__dirname, '..', 'js', f);
require(J('tiles.js'));
require(J('chars.js'));
require(J('maps.js'));
require(J('data.js'));
require(J('retro-font.js'));
require(J('engine.js'));
require(J('glue.js'));

const E = global.GAME.Engine;
const S = () => E.state;
let passed = 0;

function ok(value, label) {
  assert(value, label);
  passed++;
  console.log('  ok - ' + label);
}

function emit(list, type, props) {
  const event = Object.assign({
    type,
    preventDefault() {},
    repeat: false
  }, props || {});
  (list[type] || []).slice().forEach((fn) => fn(event));
}

function keyDown(code) { emit(windowHandlers, 'keydown', { code }); }
function keyUp(code) { emit(windowHandlers, 'keyup', { code }); }

function pump(ms) {
  for (let i = 0; i < Math.ceil(ms / 16); i++) {
    now += 16;
    const cbs = rafQueue.splice(0);
    cbs.forEach((cb) => cb(now));
  }
}

function npc(opts) {
  return Object.assign({
    id: 'test-npc', x: 6, y: 7, vx: 6, vy: 7,
    sprite: 'andy', name: 'Test', dialogue: 'andy', dir: 'right',
    homeX: 6, homeY: 7, wander: false,
    moving: false, mx: 6, my: 7, moveStartX: 6, moveStartY: 7,
    moveT: 0, nextThink: 1e9, reverseUntil: 0
  }, opts || {});
}

function reset(x, y, dir, npcs) {
  E.loadMap('sheriff', x, y, dir);
  S().mode = 'play';
  S().dialogue = null;
  S().menu = false;
  S().fade = 0;
  S().fadePhase = 0;
  S().warp = null;
  S().npcs = npcs || [];
}

console.log('# movement feel');
E.init(canvasStub);
E.start();
pump(32);
S().mode = 'play';

// Blur cancella la coda, non il passo gia' iniziato: nessun passo fantasma.
reset(6, 7, 'right');
keyDown('ArrowRight');
pump(16);
ok(S().player.moving, 'passo avviato prima del blur');
emit(windowHandlers, 'blur');
pump(500);
keyUp('ArrowRight');
ok(S().player.tx === 7 && !S().player.moving, 'blur completa solo il passo in corso');

// visibilitychange nascosto cancella anche un input non ancora consumato.
reset(6, 7, 'right');
keyDown('ArrowRight');
document.hidden = true;
emit(documentHandlers, 'visibilitychange');
pump(300);
keyUp('ArrowRight');
document.hidden = false;
ok(S().player.tx === 6 && !S().player.moving, 'tab nascosta azzera input tenuti');

// NPC in transito prenota sia origine sia destinazione contro il player.
reset(8, 7, 'left', [npc({
  x: 6, y: 7, vx: 6.2, vy: 7, moving: true,
  mx: 7, my: 7, moveStartX: 6, moveStartY: 7, moveT: 0.2
})]);
keyDown('ArrowLeft');
pump(16);
keyUp('ArrowLeft');
ok(S().player.tx === 8 && !S().player.moving, 'player non entra nella destinazione prenotata da NPC');

// NPC che pensa una mossa rispetta la destinazione gia' prenotata dal player.
reset(16, 7, 'left', [npc({
  x: 10, y: 7, vx: 10, vy: 7, homeX: 10, homeY: 7,
  wander: true, nextThink: 0
})]);
Object.assign(S().player, {
  moving: true, mx: 11, my: 7, moveStartX: 16, moveStartY: 7, moveT: 0
});
const random0 = Math.random;
const randomSeq = [0, 0.99, 0];
Math.random = () => randomSeq.length ? randomSeq.shift() : 0;
pump(16);
Math.random = random0;
ok(!S().npcs[0].moving, 'NPC non entra nella destinazione prenotata dal player');

// Direzione invariata: al frame di arrivo la tile seguente viene prenotata.
reset(6, 7, 'right');
keyDown('ArrowRight');
pump(16);
let guard = 0;
while (S().player.tx === 6 && guard++ < 20) pump(16);
ok(S().player.tx === 7 && S().player.moving && S().player.mx === 8,
   'movimento tenuto concatena il passo senza frame morto');
keyUp('ArrowRight');
pump(500);
ok(S().player.tx === 8 && !S().player.moving, 'rilascio termina dopo il passo prenotato');

console.log('\n' + passed + ' controlli superati ✔');
