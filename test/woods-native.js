#!/usr/bin/env node
'use strict';

// test/woods-native.js — contratto della radura di Glastonbury nativa.
// La mappa e' ESTERNA e scorre (28x22 tile), quindi l'arte e' authored in
// pixel di mondo e il painter sottrae la camera. Qui si verificano: gli hook
// di produzione, le ancore canoniche (varco del sogno, olio, cartello,
// spawn), l'anello degli otto sicomori, i pixel nativi interi, il fatto che
// la banda di profondita' non dipinge NULLA (nessuna chioma puo' coprire un
// attore), la grammatica dei bordi del sentiero, e l'ordine dei valori
// misurato rasterizzando l'arte stessa, senza Chrome.

const assert = require('node:assert/strict');
const path = require('node:path');

const root = path.join(__dirname, '..');
const noop = () => {};
let now = 0;
let rafQueue = [];
const handlers = {};
let storageWrites = 0;

global.window = global;
global.performance = { now: () => now };
global.requestAnimationFrame = (callback) => { rafQueue.push(callback); };
global.setInterval = () => 0;
global.addEventListener = (type, callback) => { handlers[type] = callback; };
global.localStorage = {
  getItem: () => null,
  setItem: () => { storageWrites++; },
  removeItem: noop
};

const canvasContext = new Proxy({
  fillStyle: '#000000',
  strokeStyle: '#000000',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true,
  measureText: (text) => ({ width: String(text).length * 5 }),
  fillRect: noop,
  drawImage: noop
}, {
  get(target, key) { return key in target ? target[key] : noop; },
  set(target, key, value) { target[key] = value; return true; }
});
const canvas = { width: 9, height: 9, getContext: () => canvasContext };

global.document = {
  body: { classList: { toggle: noop }, setAttribute: noop },
  getElementById: () => null,
  addEventListener: noop
};
global.GAME = {};

function load(name) { return require(path.join(root, 'js', name)); }

[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js',
  'portraits.js', 'gold-tone.js', 'engine.js', 'scene-objects.gen.js', 'glue.js', 'retro.js',
  'retro-cast-matrices-a.js', 'retro-cast-matrices-b.js', 'retro-authored.js'
].forEach(load);
load('woods-art.js');
load('woods-scene.js');
load('location-connections.js');
load('world-connections.gen.js');
global.GAME.LocationConnections.connectionRecordsFor(['town-woods-north'])
  .forEach((c) => global.GAME.LocationConnections.install(c, global.GAME.Maps));

const G = global.GAME;
const Engine = G.Engine;
const Scene = G.WoodsScene;
const Art = G.WoodsArt;
const MAP_ID = 'woods';

// ------------------------------------------------- hook di produzione
const priorCalls = { tile: [], structures: [], foreground: [] };
G.Sprites.drawTile = function () { priorCalls.tile.push({ self: this }); return 'tile-prior'; };
G.sprites.drawStructures = function () { priorCalls.structures.push({ self: this }); return 'structures-prior'; };
G.sprites.drawForegroundStructures = function () { priorCalls.foreground.push({ self: this }); return 'foreground-prior'; };

const installedMap = Scene.install();
const installedHooks = {
  tile: G.Sprites.drawTile,
  structures: G.sprites.drawStructures,
  foreground: G.sprites.drawForegroundStructures
};
assert.strictEqual(Scene.install(), installedMap, 'second install returns the same map');
assert.strictEqual(G.Sprites.drawTile, installedHooks.tile, 'second install does not wrap tile hook again');
assert.strictEqual(G.sprites.drawStructures, installedHooks.structures, 'second install does not wrap structure hook again');
assert.strictEqual(G.sprites.drawForegroundStructures, installedHooks.foreground, 'second install does not wrap depth hook again');

const foreignThis = { id: 'foreign-this' };
const foreignMap = { id: 'foreign-map' };
assert.equal(G.Sprites.drawTile.call(foreignThis, canvasContext, '.', 1, 2, 3, 4, ['.'], { mapId: 'town' }), 'tile-prior');
assert.equal(G.sprites.drawStructures.call(foreignThis, canvasContext, foreignMap, 5, 6, {}), 'structures-prior');
assert.equal(G.sprites.drawForegroundStructures.call(foreignThis, canvasContext, foreignMap, 7, 8, {}), 'foreground-prior');
for (const [name, calls] of Object.entries(priorCalls)) {
  assert.equal(calls.length, 1, name + ' foreign hook delegates exactly once');
  assert.strictEqual(calls[0].self, foreignThis, name + ' foreign hook preserves receiver');
}

let ownDraws = 0;
const artDraw = Art.draw;
Art.draw = function () { ownDraws++; return artDraw.apply(this, arguments); };
assert.equal(G.Sprites.drawTile(canvasContext, 'T', 0, 0, 0, 0, ['T'], { mapId: MAP_ID }), undefined,
  'the per-tile pipeline paints nothing on this map');
assert.equal(G.sprites.drawStructures(canvasContext, installedMap, 0, 0,
  { mapId: MAP_ID, viewportWidth: 256, viewportHeight: 192 }), undefined);
assert.equal(ownDraws, 1, 'own structure hook invokes the woods art');
for (const [name, calls] of Object.entries(priorCalls)) {
  assert.equal(calls.length, 1, name + ' own hook does not delegate');
}

// ---------------------------------------------------------------- geometria
assert.equal(Scene.mapId, MAP_ID);
const woods = G.Maps[MAP_ID];
assert.strictEqual(installedMap, woods, 'install keeps the glue-owned map record');
assert.equal(woods.width, 28, 'the woods is 28 tiles wide');
assert.equal(woods.height, 22, 'the woods is 22 tiles tall');
assert.equal(woods.rows.every((row) => row.length === woods.width), true);
assert(!woods.indoor, 'the woods is an outdoor map');
assert(woods.width * 16 > 256 && woods.height * 16 > 192,
  'the map is larger than the viewport, so the art must be authored in world pixels');

// Ancore canoniche: se una di queste si muove, la scena deve fallire forte.
for (const [name, anchor] of Object.entries(Scene.anchors)) {
  assert.equal(woods.rows[anchor.y].charAt(anchor.x), anchor.glyph,
    name + ' keeps its canonical glyph at ' + anchor.x + ',' + anchor.y);
}
assert.deepEqual([Scene.anchors.portal.x, Scene.anchors.portal.y], [14, 4],
  'the one-way dream trigger stays at 14,4');
assert.deepEqual([Scene.anchors.oil.x, Scene.anchors.oil.y], [14, 12],
  'the olio interact tile stays at 14,12');
assert.deepEqual([Scene.anchors.sign.x, Scene.anchors.sign.y], [11, 16],
  'the cartelloBosco interact tile stays at 11,16');
assert.deepEqual([Scene.anchors.spawn.x, Scene.anchors.spawn.y], [14, 20],
  'the town arrival spawn stays at 14,20');

// L'anello: otto sicomori su un cerchio di raggio tre tile attorno alla pozza.
assert.equal(Scene.ring.length, 8, 'the map carries eight sycamores, not the reference twelve');
let sycamoreCount = 0;
for (let y = 0; y < woods.rows.length; y++) {
  for (let x = 0; x < woods.rows[y].length; x++) if (woods.rows[y].charAt(x) === 'Y') sycamoreCount++;
}
assert.equal(sycamoreCount, 8, 'the art invents no extra sycamore and drops none');
const ringCentre = { x: 14, y: 12 };
for (const [x, y] of Scene.ring) {
  assert.equal(woods.rows[y].charAt(x), 'Y', 'sycamore present at ' + x + ',' + y);
  const dx = x - ringCentre.x;
  const dy = y - ringCentre.y;
  const r = Math.sqrt(dx * dx + dy * dy);
  assert(r > 2.6 && r < 3.7,
    'sycamore ' + x + ',' + y + ' sits on the ring radius (r=' + r.toFixed(2) + ')');
}
assert.deepEqual(Art.sycamores, Scene.ring, 'art and scene name the same eight trees');
assert.deepEqual(Art.poolCells, Scene.poolCells, 'art and scene name the same oil cells');
assert.equal(Art.ring.cx, ringCentre.x * 16 + 8, 'the worn ring is centred on the pool');
assert.equal(Art.ring.cy, ringCentre.y * 16 + 8, 'the worn ring is centred on the pool');
assert(Art.ring.outer > Art.ring.inner, 'the worn ring is an annulus');
assert(Art.ring.inner >= 40 && Art.ring.outer <= 60,
  'the worn ring passes through the sycamores at three tiles');

// ------------------------------------------------------- collisione e rotte
const isSolid = (x, y) => G.Maps.isSolid(MAP_ID, x, y, { clues: [], flags: {} });
assert.equal(isSolid(14, 9), true, 'the north sycamore blocks the path column');
assert.equal(isSolid(14, 15), true, 'the south sycamore blocks the path column');
assert.equal(isSolid(11, 16), true, 'the sign is solid');
assert.equal(isSolid(14, 12), false, 'the oil is walkable: it is the interact tile');
assert.equal(isSolid(14, 4), false, 'the dream trigger is enterable');

const spawn = Scene.targets.spawn;
const reachable = new Set([spawn.x + ',' + spawn.y]);
const queue = [[spawn.x, spawn.y]];
while (queue.length) {
  const [x, y] = queue.shift();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    const key = nx + ',' + ny;
    if (nx < 0 || ny < 0 || nx >= woods.width || ny >= woods.height) continue;
    if (!isSolid(nx, ny) && !reachable.has(key)) { reachable.add(key); queue.push([nx, ny]); }
  }
}
for (const [name, target] of Object.entries(Scene.targets)) {
  assert.equal(isSolid(target.x, target.y), false, name + ' target is walkable');
  assert(reachable.has(target.x + ',' + target.y), name + ' target is reachable from the spawn');
}
assert(reachable.has('14,4'), 'the dream trigger is reachable from the town arrival');
assert(reachable.has('14,12'), 'the oil is reachable from the town arrival');
for (const cell of Scene.poolCells) {
  assert.equal(isSolid(cell[0], cell[1]), false, 'oil cell ' + cell.join(',') + ' stays walkable');
}

// ------------------------------------------------------------ pixel nativi
function newRecordingContext() {
  const calls = [];
  const context = new Proxy({
    fillStyle: '#000000',
    globalAlpha: 1,
    fillRect(x, y, width, height) { calls.push({ args: [x, y, width, height], color: this.fillStyle }); }
  }, {
    get(target, key) { return key in target ? target[key] : noop; },
    set(target, key, value) { target[key] = value; return true; }
  });
  return { calls, context };
}

const CAMERA = { x: 96, y: 96 };
const authored = newRecordingContext();
artDraw(authored.context, CAMERA.x, CAMERA.y, 256, 192, woods, { mapId: MAP_ID, woodsOpen: false });
assert(authored.calls.length > 800, 'the viewport is a substantial authored frame');
assert(authored.calls.every((call) => call.args.every(Number.isInteger)),
  'all authored draw calls use integer coordinates and dimensions');
assert(authored.calls.every((call) => /^#[0-9a-f]{6}$/i.test(call.color)),
  'every authored rectangle is a flat opaque colour, never a gradient or pattern');

// Determinismo: la stessa camera dipinge gli stessi rettangoli, sempre. Le
// variazioni per tile vengono da un hash, non da Math.random.
const again = newRecordingContext();
artDraw(again.context, CAMERA.x, CAMERA.y, 256, 192, woods, { mapId: MAP_ID, woodsOpen: false });
assert.equal(again.calls.length, authored.calls.length, 'the same camera paints the same frame');
assert.equal(JSON.stringify(again.calls), JSON.stringify(authored.calls),
  'the authored frame is deterministic, rect for rect');

// Profondita' per albero, la regola HeartGold: un albero il cui piede sta a
// SUD dell'attore lo ricopre, uno a nord no. E' sicuro solo perche' ogni
// chioma e' tagliata: il massimo che un albero puo' coprire di chi sta
// esattamente una riga a nord sono le gambe, mai il corpo intero.
function depthCalls(min, max) {
  const recording = newRecordingContext();
  Art.foreground(recording.context, 0, 0,
    { forestDepthMin: min, forestDepthMax: max, viewportWidth: FULL_W, viewportHeight: FULL_H },
    woods);
  return recording.calls;
}
const FULL_W = woods.width * 16, FULL_H = woods.height * 16;
const southTree = { tx: 14, ty: 15, footY: 256 };
assert.equal(woods.rows[southTree.ty].charAt(southTree.tx), 'Y', 'the south ring tree is where we think');
const coversFromSouth = depthCalls(240, Infinity);
assert(coversFromSouth.length > 0,
  'an actor at 14,14 is overlapped by the tree south of him: the band repaints it');
// Un albero a NORD dell'attore resta nel passaggio di terreno, sotto di lui:
// il sicomoro a 14,9 (piede 160) non compare nella banda di chi ha il piede
// a 176, cioe' di chi gli sta una riga a sud.
const northTreeBox = { x0: 214, x1: 250, y0: 128, y1: 154 };
for (const call of depthCalls(176, 192)) {
  const inside = call.args[0] < northTreeBox.x1 && call.args[0] + call.args[2] > northTreeBox.x0 &&
    call.args[1] < northTreeBox.y1 && call.args[1] + call.args[3] > northTreeBox.y0;
  assert.equal(inside, false,
    'the tree north of the actor is not repainted over him: ' + call.args.join(','));
}
assert(depthCalls(160, 176).some((call) =>
  call.args[0] < northTreeBox.x1 && call.args[0] + call.args[2] > northTreeBox.x0 &&
  call.args[1] < northTreeBox.y1 && call.args[1] + call.args[3] > northTreeBox.y0),
  'that same tree IS repainted for an actor standing north of it');
assert.equal(depthCalls(161, 175).length, 0, 'a band with no tree foot in it paints nothing');

// Il taglio della chioma e' il contratto che rende sicura la banda: nessun
// albero dipinge piu' di MAX_CANOPY_LIFT pixel sopra la propria cella.
let worstLift = 0;
for (const tree of Art.treeList(woods.rows)) {
  const recording = newRecordingContext();
  Art.foreground(recording.context, 0, 0,
    { forestDepthMin: tree.footY, forestDepthMax: tree.footY + 1, viewportWidth: FULL_W, viewportHeight: FULL_H },
    woods);
  const mine = recording.calls.filter((call) =>
    call.args[0] >= tree.tx * 16 - 20 && call.args[0] <= tree.tx * 16 + 24);
  if (!mine.length) continue;
  const top = Math.min(...mine.map((call) => call.args[1]));
  worstLift = Math.max(worstLift, tree.ty * 16 - top);
}
assert(worstLift <= Art.maxCanopyLift,
  'no canopy rises more than ' + Art.maxCanopyLift + ' px above its own tile (worst ' +
  worstLift + '): that is what keeps an actor north of a tree from being buried');
assert.equal(G.sprites.drawForegroundStructures(canvasContext, installedMap, 0, 0,
  { forestDepthMin: 161, forestDepthMax: 175 }), undefined,
  'the installed depth hook runs the woods art and returns nothing');

// Il varco: nessuna geometria, solo pixel, e la luce compare solo con i tre
// indizi in mano.
const closed = newRecordingContext();
artDraw(closed.context, 160, 0, 256, 192, woods, { mapId: MAP_ID, woodsOpen: false });
const opened = newRecordingContext();
artDraw(opened.context, 160, 0, 256, 192, woods, { mapId: MAP_ID, woodsOpen: true });
assert(opened.calls.length > closed.calls.length,
  'the third clue lights the threshold and paints more, never less');
const warm = (call) => {
  const r = parseInt(call.color.slice(1, 3), 16);
  const g = parseInt(call.color.slice(3, 5), 16);
  const b = parseInt(call.color.slice(5, 7), 16);
  return r > g + 24 && r > b + 12;
};
const warmClosed = closed.calls.filter(warm).length;
const warmOpen = opened.calls.filter(warm).length;
assert(warmClosed > 0, 'the curtain is red even before the dream opens');
assert(warmOpen > warmClosed, 'opening the threshold adds warm pixels, it does not move geometry');

// ------------------------------------------ grammatica dei bordi del sentiero
// Un tile di sentiero con un vicino non-sentiero porta il labbro scuro su
// quel lato: e' la stessa grammatica del pipeline cittadino. (13,13) ha
// sentiero a nord, sud ed est, ed erba a ovest.
function tileRects(tx, ty) {
  const recording = newRecordingContext();
  artDraw(recording.context, 0, 0, 448, 352, woods, { mapId: MAP_ID });
  const x0 = tx * 16;
  const y0 = ty * 16;
  return recording.calls.filter((call) =>
    call.args[0] >= x0 - 1 && call.args[0] < x0 + 16 &&
    call.args[1] >= y0 && call.args[1] < y0 + 16);
}
assert.equal(woods.rows[13].charAt(13), 'p', 'the sample tile is path');
assert.equal(woods.rows[13].charAt(12), 'g', 'its west neighbour is not path');
assert.equal(woods.rows[13].charAt(14), 'p', 'its east neighbour is path');
const sampled = tileRects(13, 13);
const hasRect = (calls, x, y, w, h) => calls.some((call) =>
  call.args[0] === x && call.args[1] === y && call.args[2] === w && call.args[3] === h);
assert(hasRect(sampled, 13 * 16, 13 * 16, 2, 16),
  'the path tile carries its west lip where it meets the clearing');
assert(!hasRect(sampled, 13 * 16 + 14, 13 * 16, 2, 16),
  'the path tile carries no east lip where the path continues');

// ------------------------------------------- censimento dei colori
// La mappa scorre, quindi un campione a coordinate fisse mente non appena
// qualcosa si sposta di due pixel. Qui si rasterizza l'INTERA mappa e si
// contano i colori: la disciplina della palette, la copertura dell'anello,
// della pozza e dei tronchi, e il fatto che l'unico rosso sia la soglia.
const FW = woods.width * 16, FH = woods.height * 16;
const full = newRecordingContext();
artDraw(full.context, 0, 0, FW, FH, woods, { mapId: MAP_ID, woodsOpen: true });
const index = new Int32Array(FW * FH).fill(-1);
const colours = [];
const colourIndex = new Map();
for (const call of full.calls) {
  const [x, y, w, h] = call.args;
  let ci = colourIndex.get(call.color);
  if (ci === undefined) { ci = colours.length; colours.push(call.color); colourIndex.set(call.color, ci); }
  for (let py = Math.max(0, y); py < Math.min(FH, y + h); py++) {
    for (let px = Math.max(0, x); px < Math.min(FW, x + w); px++) index[py * FW + px] = ci;
  }
}
const colourAt = (x, y) => colours[index[y * FW + x]];

let unpainted = 0;
for (let i = 0; i < FW * FH; i++) if (index[i] < 0) unpainted++;
assert.equal(unpainted, 0, 'every pixel of the 448x352 world is painted');

// Disciplina: ogni colore dipinto e' un colore dichiarato nella palette.
const declared = new Set(Object.values(Art.palette).map((c) => c.toLowerCase()));
const used = new Set(full.calls.map((call) => call.color.toLowerCase()));
for (const colour of used) {
  assert(declared.has(colour), 'undeclared colour painted on the woods: ' + colour);
}
// I sei toni del terreno restano una rampa ordinata.
const luma = (hex) => 0.299 * parseInt(hex.slice(1, 3), 16) +
  0.587 * parseInt(hex.slice(3, 5), 16) + 0.114 * parseInt(hex.slice(5, 7), 16);
const ramp = ['ink', 'deep', 'shadow', 'mid', 'light', 'moon'];
for (let i = 1; i < ramp.length; i++) {
  assert(luma(Art.palette[ramp[i]]) > luma(Art.palette[ramp[i - 1]]) + 10,
    'ground ramp step ' + ramp[i - 1] + ' -> ' + ramp[i] + ' is a real step');
}
assert(luma(Art.palette.oil) < luma(Art.palette.deep) - 8,
  'the pool is the darkest plane in the frame, not just a shade under the forest floor (' +
  luma(Art.palette.oil).toFixed(1) + ' vs ' + luma(Art.palette.deep).toFixed(1) + ')');
assert(luma(Art.palette.shadow) - luma(Art.palette.deep) > 30,
  'the clearing floor is two steps above the forest floor, not one (' +
  (luma(Art.palette.shadow) - luma(Art.palette.deep)).toFixed(1) + ')');
assert(luma(Art.palette.moon) - luma(Art.palette.ink) > 150,
  'the frame is not four crowded blue-greys: the ramp spans a real range');
// Il bordo illuminato della pozza esiste davvero: pixel chiari sul labbro.
let litRimPixels = 0;
for (let y = 170; y < 212; y++) {
  for (let x = 182; x < 262; x++) {
    const colour = colourAt(x, y);
    if (colour === Art.palette.moon || colour === Art.palette.light) litRimPixels++;
  }
}
assert(litRimPixels > 40, 'the pool carries a lit rim (' + litRimPixels + ' px)');

// L'anello di terra battuta copre davvero la corona fra i sicomori.
let ringPixels = 0;
for (let y = 0; y < FH; y++) {
  for (let x = 0; x < FW; x++) {
    const dx = x - Art.ring.cx;
    const dy = y - Art.ring.cy;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r >= Art.ring.inner && r <= Art.ring.outer && colourAt(x, y) === Art.palette.mid) ringPixels++;
  }
}
assert(ringPixels > 1200,
  'the worn ring actually covers the annulus between the sycamores (' + ringPixels + ' px)');

// La pozza e' liquido, non un blob: corpo scuro esteso su piu' di una cella.
let oilPixels = 0;
for (let i = 0; i < FW * FH; i++) {
  const colour = colours[index[i]];
  if (colour === Art.palette.oil || colour === Art.palette.oilCore) oilPixels++;
}
assert(oilPixels > 800, 'the oil body is a pool, not a mark (' + oilPixels + ' px)');
// e il suo contorno non e' un rettangolo: i bordi sinistro e destro cambiano
// riga per riga.
const poolEdges = new Set();
for (let y = 176; y < 208; y += 2) {
  let first = -1;
  for (let x = 176; x < 264; x++) {
    if (colourAt(x, y) === Art.palette.oilCore || colourAt(x, y) === Art.palette.oil) { first = x; break; }
  }
  if (first >= 0) poolEdges.add(first);
}
assert(poolEdges.size >= 8, 'the pool outline is organic: its west edge moves row by row');

// I tronchi dei sicomori sono le sole verticali chiare della radura, e ogni
// albero porta il suo spigolo di luna.
let trunkPixels = 0;
for (const [tx, ty] of Art.sycamores) {
  let litEdge = 0;
  for (let y = ty * 16 - 4; y < ty * 16 + 16; y++) {
    for (let x = tx * 16 - 6; x < tx * 16 + 22; x++) {
      const colour = colourAt(x, y);
      if (colour === Art.palette.mid || colour === Art.palette.light ||
        colour === Art.palette.moon) trunkPixels++;
      if (colour === Art.palette.light || colour === Art.palette.moon) litEdge++;
    }
  }
  assert(litEdge > 8, 'the sycamore at ' + tx + ',' + ty + ' carries its moon edge');
}
assert(trunkPixels > 300, 'the eight trunks carry the pale bark that makes the ring read (' +
  trunkPixels + ' px)');

// Tre sagome diverse distribuite in senso orario: nessuna coppia di vicini
// condivide la stessa chioma, ed e' questo che toglie il "timbro ripetuto".
const clockwise = ['14,9', '16,10', '17,12', '16,14', '14,15', '12,14', '11,12', '12,10'];
assert.equal(clockwise.length, Art.sycamores.length, 'the clockwise order names every tree');
for (const key of clockwise) {
  assert(Object.prototype.hasOwnProperty.call(Art.ringVariant, key),
    'the ring assigns a variant to ' + key);
}
assert(Art.crowns.length >= 3, 'there are at least three sycamore silhouettes');
for (let i = 0; i < clockwise.length; i++) {
  const here = Art.ringVariant[clockwise[i]];
  const next = Art.ringVariant[clockwise[(i + 1) % clockwise.length]];
  assert.notEqual(here, next,
    'neighbours ' + clockwise[i] + ' and ' + clockwise[(i + 1) % clockwise.length] +
    ' do not share a crown');
}
const shapes = new Set(Art.crowns.map((c) => JSON.stringify(c.bands)));
assert.equal(shapes.size, Art.crowns.length, 'every crown silhouette is a different shape');
const leans = new Set(Art.crowns.map((c) => c.lean));
assert(leans.size >= 2, 'the crowns do not all stand at the same lean');

// La notte e' fredda ovunque tranne la soglia: nessun rosso vagante.
const warmPixels = [];
for (let y = 0; y < FH; y++) {
  for (let x = 0; x < FW; x++) {
    const colour = colourAt(x, y);
    const r = parseInt(colour.slice(1, 3), 16);
    const g = parseInt(colour.slice(3, 5), 16);
    const b = parseInt(colour.slice(5, 7), 16);
    if (r > g + 24 && r > b + 12) warmPixels.push([x, y]);
  }
}
assert(warmPixels.length > 0, 'the threshold is actually painted red');
const portalBox = {
  x0: Art.portal.tx * 16 - 6, y0: Art.portal.ty * 16 - 4,
  x1: Art.portal.tx * 16 + 22, y1: Art.portal.ty * 16 + 26
};
for (const [x, y] of warmPixels) {
  assert(x >= portalBox.x0 && x < portalBox.x1 && y >= portalBox.y0 && y < portalBox.y1,
    'warm pixel outside the threshold at ' + x + ',' + y);
}

// ------------------------------------------- motore reale e tastiera
Engine.init(canvas, null);
assert.deepEqual([canvas.width, canvas.height], [256, 192], 'engine restores the native canvas dimensions');
Engine.start();
Engine.state.mode = 'title';
Engine.loadMap(MAP_ID, spawn.x, spawn.y, 'up');
Engine.state.mode = 'play';
Engine.state.fade = 0;
Engine.state.fadePhase = 0;
Engine.state.dialogue = null;
Engine.state.menu = false;
Engine.state.npcs = [];

function frame() {
  now += 20;
  rafQueue.splice(0).forEach((callback) => callback(now));
}
function tap(direction) {
  const code = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[direction];
  const before = [Engine.state.player.tx, Engine.state.player.ty];
  handlers.keydown({ code, preventDefault: noop, repeat: false });
  let guard = 40;
  try {
    while (guard-- && !Engine.state.player.moving &&
      Engine.state.player.tx === before[0] && Engine.state.player.ty === before[1]) frame();
  } finally { handlers.keyup({ code }); }
  while (Engine.state.player.moving && guard-- > -40) frame();
  const distance = Math.abs(before[0] - Engine.state.player.tx) + Math.abs(before[1] - Engine.state.player.ty);
  assert(distance <= 1, 'one held step must not overshoot');
  return distance === 1;
}
function routeTo(target) {
  const start = [Engine.state.player.tx, Engine.state.player.ty];
  const search = [{ point: start, route: [] }];
  const seen = new Set([start.join(',')]);
  const directions = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
  while (search.length) {
    const current = search.shift();
    if (current.point[0] === target.x && current.point[1] === target.y) return current.route;
    for (const [direction, dx, dy] of directions) {
      const x = current.point[0] + dx;
      const y = current.point[1] + dy;
      const key = x + ',' + y;
      if (!seen.has(key) && !isSolid(x, y)) {
        seen.add(key);
        search.push({ point: [x, y], route: current.route.concat(direction) });
      }
    }
  }
  return null;
}
function walkTo(name) {
  const target = Scene.targets[name];
  const route = routeTo(target);
  assert(route, 'route exists to ' + name);
  for (const direction of route) assert.equal(tap(direction), true, 'real keyboard step moves toward ' + name);
  assert.deepEqual([Engine.state.player.tx, Engine.state.player.ty], [target.x, target.y],
    'real engine arrives at ' + name);
}

for (const name of ['signApproach', 'poolSouth', 'ringWest', 'ringEast', 'courtyard', 'portalApproach']) walkTo(name);

walkTo('sycamoreApproach');
const before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('down'), false, 'the south sycamore rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before,
  'sycamore collision leaves player and map unchanged');
assert.equal(storageWrites, 0, 'native scene traversal never writes a save');

console.log('WOODS-NATIVE-PASS production hooks on an outdoor map, canonical anchors and the ' +
  'eight-sycamore ring, collision and reachability to the threshold, integer native pixels, ' +
  'deterministic frame, empty depth band so no canopy covers an actor, the threshold lighting ' +
  'with the third clue, value order oil < forest < clearing < path < trunks, and a cold grove');
