/* view-continuity.js — Living Town: one person, one look, one route, everywhere.
 * Who draws a place and who draws the people in it are separate choices. An
 * inhabitant keeps the generated look stored in state on a provisional street
 * as much as in the finished café; a change of place is a cut even when the
 * numbers are close; and at any speed the sprite goes where the person went,
 * not across the furniture between two frames. The view never routes anybody.
 * node living-town/test/view-continuity.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const J = (...p) => path.resolve(__dirname, '..', '..', ...p);

global.window = global;
/* A sheet that decodes only when the test says so. */
const pendingImages = [];
global.Image = class {
  set src(v) { this._src = v; pendingImages.push(this); }
  get src() { return this._src; }
};
function decodeSheets() {
  pendingImages.splice(0).forEach((img) => { img.complete = true; img.naturalWidth = 360; img.naturalHeight = 360; if (img.onload) img.onload(); });
}
['ember-math.js', 'ember-grid.js', 'ember-camera.js', 'ember-tilemap.js', 'ember-viewport.js'].forEach((f) => require(J('engine', f)));
require(J('living-town', 'js', 'lt-scenario.js'));
require(J('living-town', 'js', 'lt-production-host.js'));
require(J('js', 'retro-authored.js'));
require(J('living-town', 'js', 'lt-cafe-scene.js'));
require(J('living-town', 'js', 'lt-art.js'));
require(J('living-town', 'js', 'lt-view.js'));
const LT = global.LT, W = LT.World;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

function makeCanvas(log) {
  const ctx = {
    canvas: null, globalAlpha: 1, imageSmoothingEnabled: true, fillStyle: '#000',
    fillRect(x, y, w, h) { log.push({ op: 'rect', x, y, w, h, fill: String(this.fillStyle) }); },
    drawImage(img, sx, sy, sw, sh, dx, dy) { log.push({ op: 'image', src: img.src, sx, sy, dx, dy }); },
    save() {}, restore() {}, translate() {}, scale() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
    closePath() {}, fill() {}, stroke() {}, arc() {}, rect() {}, clip() {}, setTransform() {}, ellipse() {}
  };
  const canvas = { width: 0, height: 0, style: {}, getContext() { return ctx; } };
  ctx.canvas = canvas;
  return canvas;
}

function quietSim() {
  const sim = LT.Scenario.day1({ intervention: false });
  sim.requestDecision = () => null;
  return sim;
}

const block = (id) => { const i = LT.Appearance.ORDER.indexOf(id); return { x: (i % 5) * 72, y: Math.floor(i / 5) * 72 }; };
const inBlock = (e, b) => e.sx >= b.x && e.sx < b.x + 72 && e.sy >= b.y && e.sy < b.y + 72;

function noIdentityKeyedArt() {
  console.log('# continuity: nothing about how a person is drawn is keyed by who they are');
  ok(W.CHARACTERS.every((c) => !('sprite' in c)), 'world characters carry no fixed sprite id');
  const art = fs.readFileSync(J('living-town', 'js', 'lt-art.js'), 'utf8');
  const view = fs.readFileSync(J('living-town', 'js', 'lt-view.js'), 'utf8');
  ok(!/resident_[ab]/.test(art) && !/resident_[ab]/.test(view), 'neither the temporary art nor the view mentions an inhabitant id');
}

function placeholderIsTheSamePerson() {
  console.log('# continuity: before the sheet decodes, the stand-in wears the person\'s own colours');
  const sim = quietSim();
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  sim.placeCharacter(a, 'park', { x: 6, y: 6, dir: 'down' });
  sim.placeCharacter(b, 'park', { x: 9, y: 6, dir: 'down' });
  const log = [];
  const view = LT.View.create(makeCanvas(log), sim);
  view.focus('resident_a'); view.update(16);
  const result = view.draw();
  ok(result.inhabitants === 'placeholder' && result.environment === 'temporary', 'the view says it is using the stand-in, on temporary ground');
  const fills = new Set(log.filter((e) => e.op === 'rect').map((e) => e.fill.toLowerCase()));
  const jacket = (c) => LT.Appearance.spec(c.appearanceId).colors.J.toLowerCase();
  ok(jacket(a) !== jacket(b) && fills.has(jacket(a)) && fills.has(jacket(b)), 'each stand-in is painted in its own look\'s jacket colour (' + jacket(a) + ', ' + jacket(b) + ')');
  sim.state.characters.resident_a.appearanceId = b.appearanceId === 'look_plum_long' ? 'look_moss_neat' : 'look_plum_long';
  log.length = 0; view.draw();
  ok(log.some((e) => e.op === 'rect' && e.fill.toLowerCase() === jacket(a)), 'the colours follow appearanceId in state, not the inhabitant\'s id');
}

async function sameLookInEveryPlace() {
  console.log('# continuity: the same sheet block draws a person in the café and outside it');
  LT.ProductionHost.attach();
  decodeSheets();
  await new Promise((r) => setTimeout(r, 5));
  ok(LT.ProductionHost.ready === true, 'the inhabitants\' sheet has decoded');
  const sim = quietSim();
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  sim.placeCharacter(b, 'flat_b');
  const log = [];
  const view = LT.View.create(makeCanvas(log), sim);
  view.focus('resident_a');
  const seen = {};
  ['cafe', 'street', 'park', 'flat_a'].forEach((place) => {
    sim.placeCharacter(a, place);
    log.length = 0; view.update(16);
    const result = view.draw();
    const images = log.filter((e) => e.op === 'image');
    assert.equal(images.length, 1, 'exactly one inhabitant drawn in ' + place);
    assert(/inhabitants-hg-24\.png$/.test(images[0].src), place + ' draws from the inhabitants sheet');
    assert(inBlock(images[0], block(a.appearanceId)), place + ' draws the block of ' + a.appearanceId);
    assert.equal(result.inhabitants, 'atlas');
    seen[place] = result.environment;
  });
  ok(seen.cafe === 'production' && seen.street === 'temporary' && seen.park === 'temporary' && seen.flat_a === 'temporary',
     'café on the production room, street/park/flat on temporary ground — and one look, ' + a.appearanceId + ', in all four');
  sim.placeCharacter(b, 'park'); view.focus('resident_b'); log.length = 0; view.update(16); view.draw();
  const other = log.filter((e) => e.op === 'image');
  ok(other.length === 1 && inBlock(other[0], block(b.appearanceId)) && b.appearanceId !== a.appearanceId, 'the other inhabitant keeps a different look of their own outside too');
}

function placeChangeIsACut() {
  console.log('# transitions: a change of place cuts, however close the coordinates are');
  const sim = quietSim();
  const a = sim.state.characters.resident_a;
  sim.placeCharacter(a, 'cafe', { x: 5, y: 5, dir: 'down' });
  const view = LT.View.create(makeCanvas([]), sim);
  view.focus('resident_a'); view.update(16);
  sim.placeCharacter(a, 'flat_a', { x: 5, y: 6, dir: 'down' });   // 16 px away on screen, another room entirely
  view.update(16);
  const r = view.render.resident_a;
  ok(r.x === 5 * 16 && r.y === 6 * 16 && r.walking === false && r.trail.length === 0,
     'one tile apart across two rooms: the sprite is at the new spot at once, not sliding (' + r.x + ',' + r.y + ')');
  sim.placeCharacter(a, 'cafe', { x: 5, y: 6, dir: 'down' });     // identical coordinates in another room
  view.update(16);
  ok(view.render.resident_a.location === 'cafe' && view.render.resident_a.walking === false, 'identical coordinates in another room still register as a change of place');
  sim.placeCharacter(a, 'cafe', { x: 9, y: 6, dir: 'down' });     // moved within a room without walking
  view.update(16);
  ok(view.render.resident_a.x === 9 * 16 && view.render.resident_a.trail.length === 0, 'a jump the view saw no steps for is a cut too; it never invents a route');
}

function coveredCells(r) {
  const xs = [Math.floor(r.x / 16), Math.ceil(r.x / 16)], ys = [Math.floor(r.y / 16), Math.ceil(r.y / 16)];
  const out = [];
  xs.forEach((x) => ys.forEach((y) => out.push([x, y])));
  return out;
}

function spriteFollowsTheWalkedRoute(ticksPerFrame, frameMs, label) {
  const sim = quietSim();
  const a = sim.state.characters.resident_a, cafe = W.LOCATIONS.cafe;
  sim.state.minute = 600;
  sim.placeCharacter(a, 'cafe');
  sim.placeCharacter(sim.state.characters.resident_b, 'flat_b');
  const view = LT.View.create(makeCanvas([]), sim);
  view.focus('resident_a'); view.update(16);
  assert(sim.startActivity(a, { actionId: 'work_shift', targetKind: 'object', targetId: 'obj_counter' }, 'test', null).ok);
  const walked = new Set([a.pos.x + ',' + a.pos.y]);
  let samples = 0, diagonal = 0, inFurniture = 0, offRoute = 0;
  for (let frame = 0; frame < 400; frame++) {
    if (frame < 40) for (let t = 0; t < ticksPerFrame; t++) { sim.tick(); view.observe(); walked.add(a.pos.x + ',' + a.pos.y); }
    view.update(frameMs);
    const r = view.render.resident_a;
    samples++;
    if (r.x % 16 !== 0 && r.y % 16 !== 0) diagonal++;
    coveredCells(r).forEach(([x, y]) => {
      if (W.isSolid(cafe.rows[y].charAt(x))) inFurniture++;
      if (!walked.has(x + ',' + y)) offRoute++;
    });
  }
  const spot = W.OBJECTS.find((o) => o.id === 'obj_counter').anchors.work_shift;
  const r = view.render.resident_a;
  ok(diagonal === 0 && inFurniture === 0 && offRoute === 0,
     label + ': over ' + samples + ' frames the sprite never left the tiles the person walked (' + walked.size + '), never overlapped furniture, never moved diagonally');
  ok(r.x === spot.x * 16 && r.y === spot.y * 16 && r.walking === false && r.dir === 'down', label + ': and it comes to rest exactly on the work spot, facing the room');
}

function viewNeverWritesState() {
  console.log('# transitions: following a route is a projection');
  const sim = quietSim();
  const view = LT.View.create(makeCanvas([]), sim);
  sim.tick(); sim.tick();
  const before = JSON.stringify(sim.state);
  view.observe(); view.update(16); view.update(500); view.draw();
  ok(JSON.stringify(sim.state) === before, 'observe/update/draw leave the simulation state byte-identical');
  const src = fs.readFileSync(J('living-town', 'js', 'lt-view.js'), 'utf8');
  ok(!/nextStep|walkStep|walkTarget|isSolid/.test(src), 'the view has no pathfinding or collision of its own');
  const observer = fs.readFileSync(J('living-town', 'js', 'lt-observer.js'), 'utf8');
  ok(/state\.sim\.tick\(\);\s*\n\s*state\.view\.observe\(\);/.test(observer), 'the observer shows the view every tick, not every frame');
}

(async function main() {
  noIdentityKeyedArt();
  placeholderIsTheSamePerson();
  await sameLookInEveryPlace();
  placeChangeIsACut();
  console.log('# transitions: the sprite goes round the counter at every speed');
  spriteFollowsTheWalkedRoute(1, 250, '1x, a tick every 250 ms frame');
  spriteFollowsTheWalkedRoute(1, 16, '1 tick per 16 ms frame');
  spriteFollowsTheWalkedRoute(2, 16, '20x, two ticks in a 16 ms frame');
  spriteFollowsTheWalkedRoute(8, 100, 'backlog, eight ticks in a 100 ms frame');
  viewNeverWritesState();
  console.log('\nview-continuity: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
