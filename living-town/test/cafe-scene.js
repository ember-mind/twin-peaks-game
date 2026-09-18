/* cafe-scene.js — Living Town: the café drawn by the shared production renderer.
 * What can be checked without eyes: that the collision rows and the painted
 * room agree, that people stand where the furniture lets them, that looks are
 * state and not identity, and that the production path really is the one
 * drawing — with the simulation still deciding everything that moves.
 * Whether it LOOKS right is a browser question; see living-town/tools/capture-cafe.js.
 * node living-town/test/cafe-scene.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const J = (...p) => path.resolve(__dirname, '..', '..', ...p);

global.window = global;
/* A decoded sheet, as far as the renderer can tell. */
global.Image = class { set src(v) { this._src = v; this.complete = true; this.naturalWidth = 360; this.naturalHeight = 360; setTimeout(() => this.onload && this.onload(), 0); } get src() { return this._src; } };
['ember-math.js', 'ember-grid.js', 'ember-camera.js', 'ember-tilemap.js', 'ember-viewport.js'].forEach((f) => require(J('engine', f)));
require(J('living-town', 'js', 'lt-scenario.js'));
require(J('living-town', 'js', 'lt-production-host.js'));
require(J('js', 'retro-authored.js'));
require(J('living-town', 'js', 'lt-art.js'));
require(J('living-town', 'js', 'lt-view.js'));
const LT = global.LT, GAME = global.GAME, W = LT.World;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const cafe = W.LOCATIONS.cafe, model = cafe.visual.interior;
const cell = (x, y) => cafe.rows[y].charAt(x);
const solid = (x, y) => W.isSolid(cell(x, y));

function rowsAgreeWithPaintedRoom() {
  console.log('# café: collision rows agree with what the painter draws');
  const claimed = {};
  const claim = (x, y, what) => { claimed[x + ',' + y] = what; };
  for (let i = 0; i < model.counter[2]; i++) claim(model.counter[0] + i, model.counter[1], 'counter');
  model.stools.forEach((s) => claim(s[0], s[1], 'stool'));
  model.booths.forEach((b) => { for (let i = 0; i < b[2]; i++) claim(b[0] + i, b[1], 'booth table'); });
  claim(model.specials[0], model.specials[1], 'specials board');
  claim(model.islandPlant[0], model.islandPlant[1], 'floor plant');
  Object.keys(claimed).forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    assert(solid(x, y), claimed[k] + ' at ' + k + ' is painted but walkable');
  });
  ok(true, Object.keys(claimed).length + ' painted furniture cells are all solid');
  ok(cell(2, 3) === 'C' && cell(10, 3) === 'C' && !solid(1, 3) && !solid(11, 3), 'the counter can be walked round at both ends, as painted');
  ok(cell(6, 9) === 'D' && cell(7, 9) === 'D' && !solid(cafe.spawn.x, cafe.spawn.y), 'the painted doors are the doors, and the spawn inside them is floor');
  ok(model.guests.every((g) => g === null), 'no painted patrons: everyone seen in the room is someone the simulation owns');
}

function reachable(from) {
  const seen = { [from.x + ',' + from.y]: true }, q = [from];
  while (q.length) {
    const c = q.shift();
    [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => {
      const x = c.x + dx, y = c.y + dy, k = x + ',' + y;
      if (y < 0 || y >= cafe.rows.length || x < 0 || x >= cafe.rows[0].length || seen[k] || solid(x, y)) return;
      seen[k] = true; q.push({ x, y });
    });
  }
  return seen;
}

function anchorsAreStandable() {
  console.log('# café: every interaction anchor is a place someone can actually stand');
  const open = reachable(cafe.spawn);
  let n = 0;
  W.OBJECTS.filter((o) => o.location === 'cafe').forEach((o) => {
    assert(solid(o.x, o.y), o.id + ' sits on a walkable cell');
    Object.keys(o.anchors).forEach((action) => {
      const a = o.anchors[action];
      assert(!solid(a.x, a.y), o.id + '/' + action + ' anchor is inside furniture');
      assert(open[a.x + ',' + a.y], o.id + '/' + action + ' anchor cannot be reached from the door');
      assert(LT.Actions.get(action), o.id + ' anchors an action nobody implements: ' + action);
      n++;
    });
  });
  ok(n >= 4, n + ' anchors are on floor, reachable from the door, and belong to real actions');
  const counter = W.OBJECTS.find((o) => o.id === 'obj_counter');
  ok(counter.anchors.work_shift.y < model.counter[1] && counter.anchors.buy_meal.y > model.counter[1],
     'staff work the counter from behind it and customers order from the front');
  ok(counter.anchors.work_shift.dir === 'down' && counter.anchors.buy_meal.dir === 'up', 'and they face each other across it');
}

function walkingGoesRoundTheFurniture() {
  console.log('# café: the simulation walks people round furniture, never through it');
  const sim = LT.Scenario.day1({ intervention: false });
  sim.requestDecision = () => null;
  const a = sim.state.characters.resident_a;
  sim.state.minute = 600;
  sim.placeCharacter(a, 'cafe');
  sim.placeCharacter(sim.state.characters.resident_b, 'flat_b');
  ok(sim.startActivity(a, { actionId: 'work_shift', targetKind: 'object', targetId: 'obj_counter' }, 'test', null).ok, 'a shift starts at the door');
  const trail = [];
  for (let i = 0; i < 30; i++) { sim.tick(); trail.push(a.pos.x + ',' + a.pos.y); assert(!solid(a.pos.x, a.pos.y), 'stood inside furniture at ' + trail[trail.length - 1]); }
  ok(a.pos.x === 5 && a.pos.y === 2 && a.pos.dir === 'down', 'she ends up behind the counter, facing the room (' + a.pos.x + ',' + a.pos.y + ' ' + a.pos.dir + ')');
  ok(trail.some((p) => p === '1,3' || p === '11,3'), 'having gone round the end of the counter to get there');
  for (let i = 1; i < trail.length; i++) {
    const [x0, y0] = trail[i - 1].split(',').map(Number), [x1, y1] = trail[i].split(',').map(Number);
    assert(Math.abs(x0 - x1) + Math.abs(y0 - y1) <= 1, 'jumped from ' + trail[i - 1] + ' to ' + trail[i]);
  }
  ok(true, 'one tile at a time, no teleporting');
}

function looksAreStateNotIdentity() {
  console.log('# café: a look is persistent state, separate from the name');
  const a1 = LT.Scenario.day1({ seed: 4242 }).state.characters, a2 = LT.Scenario.day1({ seed: 4242 }).state.characters;
  ok(a1.resident_a.appearanceId === a2.resident_a.appearanceId && a1.resident_b.appearanceId === a2.resident_b.appearanceId, 'the same seed gives the same looks');
  ok(a1.resident_a.appearanceId !== a1.resident_b.appearanceId, 'two inhabitants do not share a look');
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => { const c = LT.Scenario.day1({ seed: s }).state.characters.resident_a; return c.name + '/' + c.appearanceId; });
  const byLook = {}; seeds.forEach((s) => { const [n, l] = s.split('/'); (byLook[l] = byLook[l] || new Set()).add(n); });
  ok(Object.values(byLook).some((set) => set.size > 1) || new Set(seeds.map((s) => s.split('/')[1])).size > 1, 'name and look vary independently across seeds');
  ok(LT.Appearance.ORDER.every((id) => LT.Appearance.spec(id)) && LT.Appearance.ORDER.length <= 25, 'every sheet id has a recipe and the sheet fits the atlas layout');
  const c = a1.resident_a;
  ok(LT.Appearance.sheetIdFor(Object.assign({}, c, { activity: { actionId: 'work_shift' } })) === c.appearanceId + '_work'
     && LT.Appearance.sheetIdFor(Object.assign({}, c, { activity: null })) === c.appearanceId, 'working a shift shows the apron; it is read from the activity and changes nothing');
  const r = spawnSync(process.execPath, [J('living-town', 'tools', 'build-inhabitants.js'), '--check'], { encoding: 'utf8' });
  ok(r.status === 0, 'the committed sheet is what the recipes compile to');
}

function makeCanvas(log) {
  const ctx = {
    canvas: null, globalAlpha: 1, imageSmoothingEnabled: true, fillStyle: '#000',
    fillRect(x, y, w, h) { log.push({ op: 'rect', x, y, w, h, fill: this.fillStyle }); },
    drawImage(img, sx, sy, sw, sh, dx, dy) { log.push({ op: 'image', src: img.src, sx, sy, dx, dy }); },
    save() {}, restore() {}, translate(x) { this._tx = x; }, scale() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
    closePath() {}, fill() {}, stroke() {}, arc() {}, rect() {}, clip() {}, setTransform() {}
  };
  const canvas = { width: 0, height: 0, style: {}, getContext() { return ctx; } };
  ctx.canvas = canvas;
  return canvas;
}

async function productionRendererDrawsTheRoom() {
  console.log('# café: the production renderer draws the room and the people in it');
  ok(Object.keys(GAME.Sprites.CHARS).every((k) => LT.Appearance.ORDER.indexOf(k) >= 0), 'the renderer\'s people table holds Living Town looks and nothing else');
  ok(!GAME.maps && !GAME.NPCS && !GAME.CastPresence && !GAME.Narrative && !GAME.RetroCastMatrices && !GAME.Engine,
     'no Twin Peaks map, cast, presence, narrative or engine state is loaded to get the graphics');
  LT.ProductionHost.attach();
  await new Promise((r) => setTimeout(r, 5));
  ok(LT.ProductionHost.ready === true, 'the host reports the character sheet ready');

  const sim = LT.Scenario.day1({ intervention: false });
  sim.requestDecision = () => null;
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  sim.state.minute = 600;
  sim.placeCharacter(a, 'cafe', { x: 5, y: 2, dir: 'down' });     // behind the counter
  sim.placeCharacter(b, 'cafe', { x: 5, y: 4, dir: 'up' });       // in front of it
  sim.startActivity(a, { actionId: 'work_shift', targetKind: 'object', targetId: 'obj_counter' }, 'test', null);
  const log = [];
  let bandCalls = 0;
  const sharedBands = global.EMBER.Tilemap.paintDepthBands;
  global.EMBER.Tilemap.paintDepthBands = function () { bandCalls++; return sharedBands.apply(this, arguments); };
  const view = LT.View.create(makeCanvas(log), sim);
  view.focus('resident_a');
  view.update(16);
  const before = JSON.stringify(sim.state);
  const result = view.draw();
  ok(result.renderer === 'production' && result.entities === 2, 'the café is drawn by the production path, with both inhabitants');
  ok(JSON.stringify(sim.state) === before, 'drawing changed nothing in the simulation');

  ok(bandCalls === 1, 'layering goes through the shared engine\'s depth-band pass, the one Twin Peaks uses');
  global.EMBER.Tilemap.paintDepthBands = sharedBands;
  const images = log.filter((e) => e.op === 'image');
  ok(images.length === 2 && images.every((e) => /inhabitants-hg-24\.png$/.test(e.src)), 'both people come off Living Town\'s own sheet');
  const block = (id) => { const i = LT.Appearance.ORDER.indexOf(id); return { x: (i % 5) * 72, y: Math.floor(i / 5) * 72 }; };
  const blockA = block(a.appearanceId + '_work'), blockB = block(b.appearanceId);
  ok(images[0].sx >= blockA.x && images[0].sx < blockA.x + 72 && images[0].sy >= blockA.y && images[0].sy < blockA.y + 72, 'the worker is drawn from her own look, in its apron variant');
  ok(images[1].sx >= blockB.x && images[1].sx < blockB.x + 72 && images[1].sy === blockB.y + 24, 'the customer from theirs, on the facing-away row');

  /* Real occlusion: between the worker (behind) and the customer (in front)
   * the counter is painted again, so it covers her legs and not the customer. */
  const iA = log.indexOf(images[0]), iB = log.indexOf(images[1]);
  const between = log.slice(iA + 1, iB).filter((e) => e.op === 'rect');
  const counterTop = model.counter[1] * 16 + 16;   // room is centred: camera offset -16
  ok(between.length > 20 && between.some((e) => e.y >= counterTop - 8 && e.y <= counterTop + 20 && e.w >= 100),
     'the counter is repainted between the person behind it and the person in front (' + between.length + ' draws)');
  const roomDraws = log.slice(0, iA).filter((e) => e.op === 'rect').length;
  ok(roomDraws > 2000, 'the room itself is the production painter\'s ' + roomDraws + ' draws, not a tile fill');

  view.focus('resident_b'); sim.placeCharacter(b, 'park'); view.update(16);
  ok(view.draw().renderer === 'temporary', 'locations without production content still draw with the temporary art, and say so');
}

(async function main() {
  rowsAgreeWithPaintedRoom();
  anchorsAreStandable();
  walkingGoesRoundTheFurniture();
  looksAreStateNotIdentity();
  await productionRendererDrawsTheRoom();
  console.log('\ncafe-scene: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
