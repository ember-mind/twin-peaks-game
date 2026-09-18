#!/usr/bin/env node
/* interior-scenes-contract — the Double R stays the Double R.
 *
 * The interior kit was opened up so that a room belonging to another
 * experience can be arranged from the same pieces (GAME.Retro2D
 * .registerInteriorScene, used by living-town/js/lt-cafe-scene.js). That must
 * cost this game nothing: the diner's complete draw-call stream — room, then
 * every foreground band — is pinned here by hash. It was recorded from the
 * renderer BEFORE signage, cast atlas and kit pieces were made content, and
 * has not changed since. If you change how the diner looks on purpose,
 * re-record it; if this fails and you did not mean to, you have altered the
 * Double R while working on something else.
 * node test/interior-scenes-contract.js */
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');

global.window = global;
globalThis.GAME = { Sprites: { CHARS: {}, drawTile() {} } };
require(path.resolve(__dirname, '..', 'js', 'maps.js'));
require(path.resolve(__dirname, '..', 'js', 'retro-authored.js'));

const PINNED = { calls: 3536, sha1: 'de9a9c62c4fe2f7e6d7d5f17fe4d8b058c038b6f' };
let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

function recorder() {
  const log = [];
  const ctx = {
    canvas: { width: 256, height: 192 }, globalAlpha: 1, _f: '#000',
    set fillStyle(v) { this._f = v; }, get fillStyle() { return this._f; },
    fillRect(x, y, w, h) { log.push([this._f, this.globalAlpha, x, y, w, h].join(',')); },
    drawImage() { log.push('img'); },
    save() {}, restore() {}, translate() {}, scale() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
    fill() {}, stroke() {}, arc() {}, clearRect() {}, rect() {}, clip() {}, setTransform() {}
  };
  return { ctx, log };
}
function paint(map, id) {
  const { ctx, log } = recorder();
  const opts = { mapId: id, indoor: true, viewportWidth: 256, viewportHeight: 192, t: 0 };
  GAME.sprites.drawStructures(ctx, map, -16, -16, opts);
  [[0, 80], [80, 120], [120, Infinity]].forEach((b) => GAME.sprites.drawForegroundStructures(ctx, map, -16, -16,
    { mapId: id, indoor: true, forestDepthMin: b[0], forestDepthMax: b[1] }));
  return log;
}

const source = (GAME.maps.maps || GAME.maps).diner;
const diner = { id: 'diner', indoor: true, rows: source.rows, width: 14, height: 10, interior: source.interior };

const before = paint(diner, 'diner');
ok(before.length === PINNED.calls && crypto.createHash('sha1').update(before.join('|')).digest('hex') === PINNED.sha1,
   'the Double R paints the pinned ' + PINNED.calls + ' draw calls, unchanged');

/* Registering somebody else's room must not leak into it. */
let drew = 0;
GAME.Retro2D.interiorKit.materials.contract_room = Object.assign({}, GAME.Retro2D.interiorKit.materials.diner, { red: '#00ff00' });
GAME.Retro2D.registerInteriorScene('contract_room', {
  material: 'contract_room', monogram: 'CM',
  draw(g, map, x, y, p, kit) { drew++; kit.booth(g, x + 16, y + 96, 48, p, 0, null); kit.menuBoard(g, x, y, p, [['QUIZ', '4.89'], ['JAVA', '1.76']]); },
  foreground(g, map, x, y, p, kit, min, max) { if (96 >= min && 96 < max) kit.booth(g, x + 16, y + 96, 48, p, 0, null); }
});
const other = paint({ id: 'contract_room', indoor: true, rows: ['#'], width: 1, height: 1 }, 'contract_room');
ok(drew === 1 && other.length > 50 && other.some((l) => l.indexOf('#00ff00') === 0), 'a registered room is drawn by its own arrangement, in its own material');
ok(Object.keys(GAME.Retro2D.unsupportedGlyphs).length === 0, 'and can letter Q, Z, J, V and the digits the town font never had');
const after = paint(diner, 'diner');
ok(after.join('|') === before.join('|'), 'after which the Double R still paints exactly as before (monogram, lettering and material did not leak)');
assert.throws(() => GAME.Retro2D.registerInteriorScene('diner', { material: 'diner', draw() {} }), /composed by the renderer/);
ok(true, 'nobody can register over the Double R');

console.log('\nINTERIOR-SCENES-PASS ' + checks + ' checks');
