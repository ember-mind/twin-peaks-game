#!/usr/bin/env node
'use strict';

/* Regression contract for the R70 graphical pass.
 *
 * The pass is deliberately visual-only: map ASCII, doors, collision and saves
 * remain authoritative.  These tests therefore exercise the generated pixels
 * and the viewport contracts without comparing a large, anti-alias-sensitive
 * browser screenshot.
 */

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

class PixelContext {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.pixels = new Array(width * height).fill(null);
    this.fillStyle = '#000000';
    this.globalAlpha = 1;
  }
  fillRect(x, y, width, height) {
    x = Math.round(x); y = Math.round(y);
    width = Math.round(width); height = Math.round(height);
    const color = String(this.fillStyle || '').toLowerCase();
    for (let py = y; py < y + height; py++) {
      for (let px = x; px < x + width; px++) {
        if (px >= 0 && py >= 0 && px < this.width && py < this.height) {
          this.pixels[py * this.width + px] = color;
        }
      }
    }
  }
  save() {}
  restore() {}
  translate() {}
  scale() {}
  drawImage() {}
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function pixelSignature(context) {
  return hash(context.pixels.map((pixel) => pixel || '-').join(','));
}

function countPixels(context, accepted, rect) {
  const [x0, y0, width, height] = rect || [0, 0, context.width, context.height];
  let count = 0;
  for (let y = y0; y < y0 + height; y++) {
    for (let x = x0; x < x0 + width; x++) {
      if (accepted.has(context.pixels[y * context.width + x])) count++;
    }
  }
  return count;
}

function connectedDigitBuildings(map) {
  const seen = new Set();
  const buildings = [];
  const key = (x, y) => `${x},${y}`;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const glyph = map.rows[y][x];
      if (!/[0-9]/.test(glyph) || seen.has(key(x, y))) continue;
      const pending = [[x, y]];
      const cells = [];
      seen.add(key(x, y));
      while (pending.length) {
        const [cx, cy] = pending.pop();
        cells.push([cx, cy]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy, nextKey = key(nx, ny);
          if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
          if (map.rows[ny][nx] !== glyph || seen.has(nextKey)) continue;
          seen.add(nextKey);
          pending.push([nx, ny]);
        }
      }
      buildings.push({
        glyph,
        bbox: [
          Math.min(...cells.map((cell) => cell[0])),
          Math.min(...cells.map((cell) => cell[1])),
          Math.max(...cells.map((cell) => cell[0])),
          Math.max(...cells.map((cell) => cell[1]))
        ]
      });
    }
  }
  return buildings;
}

function functionBody(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${functionName} must exist`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  assert.fail(`${functionName} body is not balanced`);
}

function actorScaleAt(width, height, touch) {
  const calls = [];
  const style = {
    setProperty() {},
    width: '', height: '', left: '', top: '', transform: ''
  };
  const stage = { style };
  const canvas = { width: 0, height: 0 };
  const visualViewport = { width, height, addEventListener() {} };
  const window = {
    innerWidth: width,
    innerHeight: height,
    visualViewport,
    location: { search: touch ? '?touch=1' : '' },
    navigator: { maxTouchPoints: touch ? 1 : 0 },
    matchMedia: () => ({ matches: touch }),
    addEventListener() {},
    requestAnimationFrame(callback) { callback(); }
  };
  if (touch) window.ontouchstart = null;
  const document = {
    readyState: 'complete',
    getElementById(id) { return id === 'game' ? canvas : id === 'stage' ? stage : null; },
    addEventListener() {}
  };
  const GAME = {
    Sprites: { setRuntimeActorScale(value) { calls.push(value); } },
    Engine: { onResize() {}, init() {}, start() {} }
  };
  vm.runInNewContext(read('js/main.js'), {
    window, document, navigator: window.navigator, GAME, Math
  }, { filename: 'js/main.js' });
  assert.equal(calls.length, 1, 'bootstrap must set actor scale exactly once');
  assert.equal(canvas.width, 256, 'bootstrap keeps native canvas width');
  assert.equal(canvas.height, 192, 'bootstrap keeps native canvas height');
  return calls[0];
}

global.window = global;
require(path.join(ROOT, 'js/maps.js'));
require(path.join(ROOT, 'js/chars.js'));
const originalTile = function () {};
GAME.Sprites = { CHARS: GAME.sprites.CHARS, drawTile: originalTile };
require(path.join(ROOT, 'js/retro-authored.js'));

const maps = GAME.maps.maps;
// Scene objects live in world/scene-objects.json since M8 9332786; copy them onto the raw maps as glue.js does.
require(path.join(ROOT, 'js/scene-objects.gen.js'));
for (const [id, scene] of Object.entries(GAME.WorldData.sceneObjects.scenes)) {
  if (maps[id]) maps[id].objects = JSON.parse(JSON.stringify(scene.objects));
}
const matrix = JSON.parse(read('test/visual-audit-matrix.json'));
const engineSource = read('js/engine.js');
const cameraBody = functionBody(engineSource, 'updateCamera');
const upLookaheadMatch = /p\.dir\s*===\s*['"]up['"][\s\S]*?tyy\s*=\s*clamp\(tyy\s*-\s*(\d+)/.exec(cameraBody);
assert(upLookaheadMatch, 'upward landmark camera look-ahead must exist');
const upLookaheadPixels = Number(upLookaheadMatch[1]);
// View height from engine.js (VH = 192, 12 tiles); the old 9-tile model predates the DS viewport.
const viewportHeight = Number(/\bVH\s*=\s*(\d+)/.exec(engineSource)[1]);
assert(upLookaheadPixels >= 16 && upLookaheadPixels <= 48,
  'upward look-ahead must reveal landmarks without skipping more than three tiles');

/* Every connected town building volume has its own named capture. The camera
 * formula is the production 160x144 upward look-ahead: a 10 x 9 tile view
 * whose vertical origin is derived from the actual render-only offset. */
const expectedTownCaptures = [
  'town-bookhouse', 'town-great-northern', 'town-hospital', 'town-hornes',
  'town-palmer', 'town-shop-west', 'town-shop-center', 'town-shop-east',
  'town-sheriff', 'town-diner', 'town-roadhouse'
];
const townCaptures = matrix.gameplay.filter((entry) => expectedTownCaptures.includes(entry.id));
assert.deepEqual(townCaptures.map((entry) => entry.id).sort(), expectedTownCaptures.slice().sort(),
  'visual matrix must contain one named entry for every town building');
const buildings = connectedDigitBuildings(maps.town);
assert.equal(buildings.length, 11, 'town building component inventory changed; update matrix deliberately');
const unmatched = buildings.slice();
for (const capture of townCaptures) {
  assert.equal(capture.map, 'town', `${capture.id} must capture the town runtime map`);
  assert.equal(capture.dir, 'up', `${capture.id} must exercise upward landmark look-ahead`);
  const candidates = unmatched.filter((building) => {
    const [x0, y0, x1, y1] = building.bbox;
    const roofY = building.glyph === '7' ? y0 : y0 - 1;
    const centerX = (x0 + x1) / 2;
    const viewTop = (capture.y * 16 + 8 - viewportHeight / 2 - upLookaheadPixels) / 16;
    const viewBottom = viewTop + viewportHeight / 16;
    return Math.abs(capture.x - centerX) <= 2 &&
      x0 >= capture.x - 4.5 && x1 <= capture.x + 5.5 &&
      roofY >= viewTop && y1 <= viewBottom;
  });
  assert(candidates.length >= 1, `${capture.id} must contain one complete town building and its roof`);
  candidates.sort((a, b) => Math.abs(capture.x - (a.bbox[0] + a.bbox[2]) / 2) -
    Math.abs(capture.x - (b.bbox[0] + b.bbox[2]) / 2));
  unmatched.splice(unmatched.indexOf(candidates[0]), 1);
}
assert.deepEqual(unmatched, [], 'every town building component must be assigned to a visual capture');
console.log('ok - visual matrix covers all 11 town building components');

/* Una cattura di prova deve partire da una cella legalmente calpestabile.
 * Prima lago, cartello e sicomoro producevano prove visive impossibili da
 * raggiungere giocando, incluso Cooper in piedi nell'acqua. */
for (const profile of ['gameplay', 'temporal']) {
  for (const capture of matrix[profile]) {
    if (!capture.map) continue;
    const map = maps[capture.map];
    assert(map, `${capture.id}: map missing`);
    const tile = map.rows[capture.y] && map.rows[capture.y].charAt(capture.x);
    assert(!GAME.maps.isSolid(tile), `${capture.id}: capture starts on solid ${capture.map}@${capture.x},${capture.y} (${tile})`);
  }
}
console.log('ok - every visual capture starts on a walkable production tile');

/* Landmark non-edificio: ogni dichiarazione deve possedere arte semantica e
 * una cattura legale. I binari erano metadata senza un solo pixel attivo. */
for (const id of ['arrival-tableau', 'town-tracks']) {
  assert(matrix.gameplay.some((entry) => entry.id === id), `${id} missing from gameplay matrix`);
}
const tracks = maps.town.objects.find((object) => object.type === 'landmark' && object.kind === 'tracks');
assert(tracks, 'town tracks landmark missing');
for (let ty = tracks.y; ty < tracks.y + tracks.h; ty++) {
  for (let tx = tracks.x; tx < tracks.x + tracks.w; tx++) {
    assert(!GAME.maps.isSolid(maps.town.rows[ty][tx]), `track bed must be walkable at ${tx},${ty}`);
  }
}
const railView = new PixelContext(160, 144);
const railCx = 52 * 16 - 80, railCy = 15 * 16 - 72;
GAME.sprites.drawStructures(railView, maps.town, railCx, railCy);
const railRect = [tracks.x * 16 - railCx, 0, tracks.w * 16, 144];
assert(countPixels(railView, new Set(['#30383b']), railRect) > 500, 'track rails/sleepers must be visible');
assert(countPixels(railView, new Set(['#d0c89d']), railRect) > 100, 'track metal highlight must be visible');
console.log('ok - town tracks own visible rail art, walkable crossing and named capture');

/* Attraversare un confine camera non deve rigenerare ancore forestali. Due
 * render separati di 1px devono quindi essere lo stesso mondo traslato di
 * 1px in tutta la loro area comune, incluse chiome e ombre macro. */
const forestBeforeBoundary = new PixelContext(256, 192);
const forestAfterBoundary = new PixelContext(256, 192);
const forestViewport = { mapId: 'town', indoor: false, viewportWidth: 256, viewportHeight: 192 };
GAME.sprites.drawStructures(forestBeforeBoundary, maps.town, 351, 384, forestViewport);
GAME.sprites.drawStructures(forestAfterBoundary, maps.town, 352, 384, forestViewport);
for (let y = 0; y < 192; y++) for (let x = 32; x < 223; x++) {
  assert.equal(forestAfterBoundary.pixels[y * 256 + x],
    forestBeforeBoundary.pixels[y * 256 + x + 1],
    `town forest changed layout across camera boundary at ${x},${y}`);
}
console.log('ok - town forest stays world-locked across camera tile boundaries');

/* Alberi e attori condividono painter's order tramite quota dei piedi. Un
 * albero con radice davanti deve coprire il marker-attore; un range oltre
 * fondo mappa non deve toccarlo. Il pass depth ridisegna chioma/tronco, non
 * ombre del terreno. */
const actorMarker = '#ff00ff';
const treeInFront = new PixelContext(256, 192);
treeInFront.fillStyle = actorMarker;
treeInFront.fillRect(208, 88, 16, 24);
GAME.sprites.drawForegroundStructures(treeInFront, maps.town, 351, 384, {
  viewportWidth: 256, viewportHeight: 192,
  forestDepthMin: 500, forestDepthMax: 550
});
assert(countPixels(treeInFront, new Set([actorMarker]), [208, 88, 16, 24]) < 96,
  'tree rooted in front must occlude actor body');
const treeBehind = new PixelContext(256, 192);
treeBehind.fillStyle = actorMarker;
treeBehind.fillRect(208, 88, 16, 24);
GAME.sprites.drawForegroundStructures(treeBehind, maps.town, 351, 384, {
  viewportWidth: 256, viewportHeight: 192,
  forestDepthMin: 10000, forestDepthMax: Infinity
});
assert.equal(countPixels(treeBehind, new Set([actorMarker]), [208, 88, 16, 24]), 16 * 24,
  'tree rooted behind actor must not be redrawn over actor');
const paintWorldBody = functionBody(engineSource, 'paintWorld');
assert(paintWorldBody.indexOf('GAME.Sprites.drawChar') < paintWorldBody.indexOf('GAME.sprites.drawForegroundStructures'),
  'foreground tree pass must run after actor draw');
/* The band scan moved into the shared engine: the engine hands it TILE as the
 * foot offset, and the scan derives every threshold from wy + that offset. */
const emberTilemapSource = fs.readFileSync(path.join(__dirname, '..', 'engine', 'ember-tilemap.js'), 'utf8');
assert(/EMBER\.Tilemap\.paintDepthBands\(entities,\s*TILE,/.test(paintWorldBody) &&
  /var foot = entities\[i\]\.wy \+ footOffset/.test(emberTilemapSource),
  'forest depth threshold must use actor foot position');
console.log('ok - town trees occlude actors by foot depth without foreground shadows');

/* Town usa ancore organiche macro: tronco e chioma devono condividere stessa
 * ancora. Un tronco dentro ogni tile T crea pali staccati dove algoritmo macro
 * fonde piu' celle in una sola massa. */
const trunkColors = new Set(['#806948', '#ad8758', '#9b7449', '#c09761']);
const treeTile = new PixelContext(16, 16);
GAME.Sprites.drawTile(treeTile, 'T', 0, 0, 12, 10, maps.town.rows, { mapId: 'town' });
assert.equal(countPixels(treeTile, trunkColors), 0,
  'town T tile must not emit a detached per-cell trunk');
const completeForest = new PixelContext(256, 192);
GAME.sprites.drawStructures(completeForest, maps.town, 351, 384, forestViewport);
assert(countPixels(completeForest, trunkColors) > 0,
  'complete macro trees must retain authored trunks');
console.log('ok - town trunks exist only inside complete macro trees');

/* Facciate, tetti, ombre e landscaping devono restare pixel-identici quando
 * camera attraversa confini sia X sia Y. Confronto area centrale comune,
 * lontana dal clipping legittimo del canvas. */
const houseBase = new PixelContext(256, 192);
const houseShiftX = new PixelContext(256, 192);
const houseShiftY = new PixelContext(256, 192);
GAME.sprites.drawStructures(houseBase, maps.town, 319, 31, forestViewport);
GAME.sprites.drawStructures(houseShiftX, maps.town, 320, 31, forestViewport);
GAME.sprites.drawStructures(houseShiftY, maps.town, 319, 32, forestViewport);
for (let y = 24; y < 168; y++) for (let x = 32; x < 223; x++) {
  assert.equal(houseShiftX.pixels[y * 256 + x], houseBase.pixels[y * 256 + x + 1],
    `town house changed across horizontal camera boundary at ${x},${y}`);
}
for (let y = 24; y < 167; y++) for (let x = 32; x < 224; x++) {
  assert.equal(houseShiftY.pixels[y * 256 + x], houseBase.pixels[(y + 1) * 256 + x],
    `town house changed across vertical camera boundary at ${x},${y}`);
}
console.log('ok - town houses stay world-locked across horizontal and vertical camera boundaries');

/* Arrival hero art uses same contact boxes as ASCII collision. Roof overhang
 * is allowed; body/base pixels must terminate on these four exact bounds. */
function glyphBounds(map, glyph) {
  const cells = [];
  for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
    if (map.rows[y][x] === glyph) cells.push([x, y]);
  }
  return [
    Math.min(...cells.map((cell) => cell[0])) * 16,
    Math.min(...cells.map((cell) => cell[1])) * 16,
    (Math.max(...cells.map((cell) => cell[0])) - Math.min(...cells.map((cell) => cell[0])) + 1) * 16,
    (Math.max(...cells.map((cell) => cell[1])) - Math.min(...cells.map((cell) => cell[1])) + 1) * 16
  ];
}
assert.deepEqual(GAME.Retro2D.arrivalContactBounds, {
  shop: glyphBounds(maps.arrival, '9'), cabin: glyphBounds(maps.arrival, 'J'),
  mailbox: glyphBounds(maps.arrival, 'E'), car: glyphBounds(maps.arrival, 'V')
});
const arrival = new PixelContext(160, 144);
GAME.Retro2D.drawArrivalBackdrop(arrival, 0, 0, 160, 144);
const contactInk = new Set([
  '#072619', '#34572d', '#5b4737', '#a98b5d', '#4b382d', '#835e42',
  '#24382f', '#315a49', '#294f42'
]);
assert(countPixels(arrival, contactInk, [32, 46, 32, 2]) >= 32, 'arrival shop base must reach collision base');
assert(countPixels(arrival, contactInk, [96, 46, 48, 2]) >= 20, 'arrival cabin base must reach collision base');
assert(countPixels(arrival, contactInk, [64, 16, 16, 16]) >= 35, 'arrival mailbox must stay legible inside its solid tile');
assert(countPixels(arrival, contactInk, [96, 61, 32, 3]) >= 30, 'arrival car contact must reach its collision base');
assert.equal(arrival.pixels[56 * 160 + 90], '#24382f', 'large car left bumper missing');
assert.equal(arrival.pixels[56 * 160 + 134], '#24382f', 'large car right bumper missing');
assert.equal(arrival.pixels[41 * 160 + 101], '#24382f', 'large car roof must rise above its V collision row');
console.log('ok - arrival shop, cabin, mailbox and car art aligns with collision contact boxes');

const forestContact = new Set([
  '#072619', '#34572d', '#6a8a43', '#9aab69', '#24382f', '#315a49',
  '#294f42', '#3e725b', '#639b72', '#80b878'
]);
for (let ty = 5; ty <= 8; ty++) {
  for (let tx = 0; tx < maps.arrival.width; tx++) {
    const dark = countPixels(arrival, forestContact, [tx * 16, ty * 16, 16, 16]);
    if (maps.arrival.rows[ty][tx] === 'T') {
      assert(dark >= 110, `arrival solid forest must read solid at ${tx},${ty}: ${dark}/256`);
    } else {
      assert(dark <= 80, `arrival walkable corridor must read open at ${tx},${ty}: ${dark}/256`);
    }
  }
}
console.log('ok - arrival south forest coverage agrees with T collision and open corridor');

/* Red Room floor: adjacent metatiles must not restart the same 16px stamp.
 * Dark strokes cross every vertical tile seam in a 4x4 test field. */
const zigzag = new PixelContext(64, 64);
for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) {
  GAME.Sprites.drawTile(zigzag, 'Z', tx * 16, ty * 16, tx, ty,
    ['ZZZZ', 'ZZZZ', 'ZZZZ', 'ZZZZ'], { mapId: 'redroom' });
}
const ink = '#24382f';
const tileSigs = [];
for (let tx = 0; tx < 4; tx++) {
  const tile = [];
  for (let y = 0; y < 16; y++) for (let x = tx * 16; x < tx * 16 + 16; x++) {
    tile.push(zigzag.pixels[y * 64 + x]);
  }
  tileSigs.push(hash(tile.join(',')));
}
assert(new Set(tileSigs).size >= 2, 'Red Room zigzag must use world phase, not one repeated tile stamp');
for (const seam of [16, 32, 48]) {
  let crossings = 0;
  for (let y = 0; y < 64; y++) {
    if (zigzag.pixels[y * 64 + seam - 1] === ink && zigzag.pixels[y * 64 + seam] === ink) crossings++;
  }
  assert(crossings >= 3, `Red Room zigzag must cross tile seam x=${seam}`);
}
assert(countPixels(zigzag, new Set([ink])) > 360, 'Red Room zigzag must remain visually dominant');

/* Curtains are a viewport accent, not only the off-screen solid R columns.
 * Test multiple camera offsets because Red Room is wider than 160px. */
const curtainColors = new Set(['#4c1119', '#8f2430', '#c1585a', '#e47a75']);
for (const cameraX of [0, 48, 96]) {
  const viewport = new PixelContext(160, 144);
  GAME.sprites.drawStructures(viewport, maps.redroom, cameraX, 0);
  const left = countPixels(viewport, curtainColors, [0, 0, 18, 144]);
  const right = countPixels(viewport, curtainColors, [142, 0, 18, 144]);
  const valance = countPixels(viewport, curtainColors, [0, 0, 160, 14]);
  assert(left >= 18 * 144 * 0.80, `left Red Room curtain missing at camera ${cameraX}`);
  assert(right >= 18 * 144 * 0.80, `right Red Room curtain missing at camera ${cameraX}`);
  assert(valance >= 160 * 14 * 0.45, `Red Room valance missing at camera ${cameraX}`);
}
console.log('ok - Red Room has continuous zigzag and curtains in every viewport');

/* Train car accents are rasterized as one shell: roof/floor runs, windows,
 * wheels and two separated rails. None of these are collision tiles. */
const train = new PixelContext(160, 144);
GAME.sprites.drawStructures(train, maps.traincar, 104, 32);
const trainColors = new Set(train.pixels.filter(Boolean));
assert(trainColors.size >= 5, 'train car accent layer needs a complete tonal ramp');
assert(countPixels(train, new Set([ink])) >= 1800, 'train car shell/rails lack continuous ink mass');
assert(countPixels(train, new Set(['#d0a868'])) >= 100, 'train car windows are missing');
assert(countPixels(train, new Set(['#715d48'])) >= 900, 'train car ribs, wheels and sleepers are missing');
const longInkRows = [];
for (let y = 0; y < 144; y++) {
  let run = 0, best = 0;
  for (let x = 0; x < 160; x++) {
    if (train.pixels[y * 160 + x] === ink) { run++; best = Math.max(best, run); }
    else run = 0;
  }
  if (best >= 120) longInkRows.push(y);
}
assert(longInkRows.some((y) => y < 20), 'train car roof line missing');
assert(longInkRows.some((y) => y > 60 && y < 72), 'train car floor line missing');
assert(longInkRows.some((y) => y > 75) && Math.max(...longInkRows) - Math.min(...longInkRows.filter((y) => y > 75)) >= 8,
  'train car needs two separated continuous rails');
console.log('ok - train car continuous shell, windows, wheels and rails are present');

/* Each playable interior family has a distinct floor signature. This tests
 * produced pixels rather than map IDs or source comments. */
const interiorMaps = ['sheriff', 'palmer', 'hotel_gn', 'hospital', 'diner', 'oej', 'roadhouse'];
const profiles = new Map();
for (const mapId of interiorMaps) {
  /* Sample a metatile phase block: some restrained interiors intentionally
   * place their motif only every fourth tile. */
  const floor = new PixelContext(32, 32);
  for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
    GAME.Sprites.drawTile(floor, 'f', tx * 16, ty * 16, tx, ty,
      ['fff', 'fff', 'fff'], { mapId, indoor: true });
  }
  const signature = pixelSignature(floor);
  assert(!profiles.has(signature), `${mapId} floor duplicates ${profiles.get(signature)} interior profile`);
  profiles.set(signature, mapId);
  assert(new Set(floor.pixels.filter(Boolean)).size >= 2, `${mapId} floor lacks an authored pattern`);
}
assert.equal(profiles.size, interiorMaps.length, 'all seven interior profiles must remain distinct');
console.log('ok - seven interior floor profiles are pixel-distinct');

/* Camera look-ahead is render-only. Its source block may calculate camera
 * targets, but may not write player coordinates or touch map/collision data.
 * Rendering every new accent also leaves the collision model byte-identical. */
assert(/!S\.dialogue\s*&&\s*!map\.indoor/.test(cameraBody),
  'look-ahead must be limited to outdoor gameplay without a dialogue');
assert(!/GAME\.Maps|\.SOLID|\.doors|\.rows/.test(cameraBody),
  'camera look-ahead must not read collision or map topology');
assert(!/p\.(?:x|y|tx|ty|mx|my)\s*=/.test(cameraBody),
  'camera look-ahead must never write player coordinates');
const stepBody = functionBody(engineSource, 'tryStep');
assert(/GAME\.Maps\.isSolid\(S\.mapId,\s*nx,\s*ny,\s*S\)/.test(stepBody),
  'movement collision must remain authoritative after look-ahead');
const collisionBefore = hash(JSON.stringify({ solid: GAME.maps.SOLID, maps: Object.fromEntries(
  Object.entries(maps).map(([id, map]) => [id, { rows: map.rows, doors: map.doors }])
)}));
for (const [id, map] of Object.entries(maps)) {
  const context = new PixelContext(160, 144);
  GAME.sprites.drawStructures(context, map, 0, 0);
  for (let y = 0; y < Math.min(map.height, 9); y++) for (let x = 0; x < Math.min(map.width, 10); x++) {
    GAME.Sprites.drawTile(context, map.rows[y][x], x * 16, y * 16, x, y, map.rows,
      { mapId: id, indoor: !!map.indoor });
  }
}
const collisionAfter = hash(JSON.stringify({ solid: GAME.maps.SOLID, maps: Object.fromEntries(
  Object.entries(maps).map(([id, map]) => [id, { rows: map.rows, doors: map.doors }])
)}));
assert.equal(collisionAfter, collisionBefore, 'graphic render pass must not mutate collision rows or doors');
console.log('ok - look-ahead is render-only and collision data stays byte-identical');

const desktopActorScale = actorScaleAt(1280, 720, false);
const mobilePortraitActorScale = actorScaleAt(390, 844, true);
const mobileLandscapeActorScale = actorScaleAt(844, 390, true);
assert.equal(desktopActorScale, 1, 'desktop actors must retain native 1x OBJ scale');
assert.equal(mobilePortraitActorScale, desktopActorScale, 'portrait mobile and desktop actor scale differ');
assert.equal(mobileLandscapeActorScale, desktopActorScale, 'landscape mobile and desktop actor scale differ');
console.log('ok - desktop and mobile use the identical native actor scale');

console.log('\nGRAPHIC-PASS-CONTRACT-PASS 14/14');
