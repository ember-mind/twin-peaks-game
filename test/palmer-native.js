#!/usr/bin/env node
'use strict';

// test/palmer-native.js — contratto della casa Palmer nativa: geometria
// authored == js/maps.js, parita' footprints/definitions, pixel nativi interi,
// intervalli di profondita' (arredo + ventilatore + stipite della porta), e
// l'ordine dei valori misurato rasterizzando l'arte stessa, senza Chrome.
//
// La stanza e' un taglio della casa intera: camera di Laura sulle righe 1-3,
// muro delle scale sulla riga 4 (pianerottolo 4-5), soggiorno 5-10, porta
// d'ingresso su 7,11 e 8,11. Sarah sta in piedi sul tappeto a (9,7): nessun
// arredo puo' dipingere su quel tile.

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
load('palmer-art.js');
load('palmer-scene.js');
// Le porte vengono dal registro delle connessioni (js/maps.js non ne porta).
load('location-connections.js');
load('world-connections.gen.js');
global.GAME.LocationConnections.connectionRecordsFor(['town-palmer-house'])
  .forEach((c) => global.GAME.LocationConnections.install(c, global.GAME.Maps));

const G = global.GAME;
const Engine = G.Engine;
const Scene = G.PalmerScene;
const Art = G.PalmerArt;
const MAP_ID = 'palmer';

// ------------------------------------------------- hook di produzione
const priorCalls = { tile: [], structures: [], foreground: [], palette: [] };
G.Sprites.drawTile = function () { priorCalls.tile.push({ self: this }); return 'tile-prior'; };
G.sprites.drawStructures = function () { priorCalls.structures.push({ self: this }); return 'structures-prior'; };
G.sprites.drawForegroundStructures = function () { priorCalls.foreground.push({ self: this }); return 'foreground-prior'; };
G.Retro2D.limitBackgroundPalettes = function () { priorCalls.palette.push({ self: this }); return 'palette-prior'; };

const installedMap = Scene.install();
const installedHooks = {
  tile: G.Sprites.drawTile,
  structures: G.sprites.drawStructures,
  foreground: G.sprites.drawForegroundStructures,
  palette: G.Retro2D.limitBackgroundPalettes
};
assert.strictEqual(Scene.install(), installedMap, 'second install returns the same map');
assert.strictEqual(G.Sprites.drawTile, installedHooks.tile, 'second install does not wrap tile hook again');
assert.strictEqual(G.sprites.drawStructures, installedHooks.structures, 'second install does not wrap structure hook again');
assert.strictEqual(G.sprites.drawForegroundStructures, installedHooks.foreground, 'second install does not wrap depth hook again');
assert.strictEqual(G.Retro2D.limitBackgroundPalettes, installedHooks.palette, 'second install does not wrap palette hook again');

const foreignThis = { id: 'foreign-this' };
const foreignMap = { id: 'foreign-map' };
assert.equal(G.Sprites.drawTile.call(foreignThis, canvasContext, '.', 1, 2, 3, 4, ['.'], { mapId: 'foreign-map' }), 'tile-prior');
assert.equal(G.sprites.drawStructures.call(foreignThis, canvasContext, foreignMap, 5, 6, {}), 'structures-prior');
assert.equal(G.sprites.drawForegroundStructures.call(foreignThis, canvasContext, foreignMap, 7, 8, {}), 'foreground-prior');
assert.equal(G.Retro2D.limitBackgroundPalettes.call(foreignThis, canvasContext, 1, 2, 3, 4, 'foreign-map'), 'palette-prior');
for (const [name, calls] of Object.entries(priorCalls)) {
  assert.equal(calls.length, 1, name + ' foreign hook delegates exactly once');
  assert.strictEqual(calls[0].self, foreignThis, name + ' foreign hook preserves receiver');
}

let ownDraws = 0;
let ownForegrounds = 0;
const artDraw = Art.draw;
const artForeground = Art.foreground;
Art.draw = function () { ownDraws++; return artDraw.apply(this, arguments); };
Art.foreground = function () { ownForegrounds++; return artForeground.apply(this, arguments); };
assert.equal(G.Sprites.drawTile(canvasContext, '.', 0, 0, 0, 0, ['.'], { mapId: MAP_ID }), undefined);
assert.equal(G.sprites.drawStructures(canvasContext, installedMap, 0, 0, {}), undefined);
assert.equal(G.sprites.drawForegroundStructures(canvasContext, installedMap, 0, 0, { forestDepthMin: 96, forestDepthMax: 120 }), undefined);
assert.equal(G.Retro2D.limitBackgroundPalettes(canvasContext, 0, 0, 256, 192, MAP_ID), undefined);
assert.equal(ownDraws, 1, 'own structure hook invokes the palmer art');
assert.equal(ownForegrounds, 1, 'own depth hook invokes the palmer foreground art');
for (const [name, calls] of Object.entries(priorCalls)) {
  assert.equal(calls.length, 1, name + ' own hook does not delegate');
}

// ---------------------------------------------------------------- geometria
assert.equal(Scene.mapId, MAP_ID);
const house = G.Maps[MAP_ID];
assert.strictEqual(installedMap, house, 'install keeps the glue-owned map record');
assert.deepEqual(house.rows, Scene.rows, 'maps.js geometry matches the authored footprints');
assert.equal(house.width, 16);
assert.equal(house.height, 12);
assert.equal(house.width * 16, 256, 'map spans the full native viewport width');
assert.equal(house.height * 16, 192, 'map spans the full native viewport height: the frame never scrolls');
assert.equal(house.rows.every((row) => row.length === house.width), true);
assert.equal(house.indoor, true);
assert.equal(house.rows[4], 'iiiiffiiiiiiiiii', 'the stair wall keeps the landing at columns 4-5 and nothing else');
assert.equal(house.rows[11], 'iiiiiiiDDiiiiiii', 'the front door keeps its two canonical leaves');

// footprints <-> definitions: stessi id, stesse celle, stesso footY, e il
// glifo authored e' quello che js/maps.js pubblica davvero per quella cella.
const artIds = Art.definitions.map((prop) => prop.id).sort();
const sceneIds = Object.keys(Scene.footprints).sort();
assert.deepEqual(artIds, sceneIds, 'art definitions and scene footprints name the same props');
for (const prop of Art.definitions) {
  const spec = Scene.footprints[prop.id];
  const key = (cell) => cell[0] + ',' + cell[1];
  assert.deepEqual(prop.cells.map(key).sort(), spec.cells.map(key).sort(),
    prop.id + ' occupies the same cells in art and scene');
  for (const [x, y] of spec.cells) {
    assert.equal(house.rows[y][x], spec.glyph, prop.id + ' keeps the canonical glyph at ' + x + ',' + y);
  }
  const southRow = Math.max(...spec.cells.map((cell) => cell[1]));
  assert.equal(prop.footY, (southRow + 1) * 16, prop.id + ' footY is the south edge of its footprint');
  assert.equal(prop.bounds.length, 4, prop.id + ' declares pixel bounds');
  assert.equal(prop.shadow.length, 4, prop.id + ' declares a contact shadow band');
  assert(prop.bounds.every(Number.isInteger) && prop.shadow.every(Number.isInteger),
    prop.id + ' bounds and shadow are integer rectangles');
}
assert.equal(Art.definitions.length, 11, 'eleven grounded props: everything else is architecture');
assert.equal(Art.fanFoot, 64, 'the ceiling fan sorts at the foot of the upper hall row');
assert.equal(Art.doorFoot, 192, 'the door casing sorts at the south wall foot line');

// Il tappeto del soggiorno e' pavimento, non arredo: mai solido.
for (let y = Scene.rug.y0; y <= Scene.rug.y1; y++) {
  for (let x = Scene.rug.x0; x <= Scene.rug.x1; x++) {
    assert.equal(house.rows[y][x], 'c', 'the rug cell ' + x + ',' + y + ' stays carpet');
  }
}

// ------------------------------------------------------- collisione e rotte
const isSolid = (x, y) => G.Maps.isSolid(MAP_ID, x, y, { clues: [], flags: {} });
const freeTiles = [];
for (let y = 0; y < house.height; y++) {
  for (let x = 0; x < house.width; x++) if (!isSolid(x, y)) freeTiles.push([x, y]);
}
const entrance = Scene.targets.entrance;
assert.deepEqual([entrance.x, entrance.y], [7, 10], 'the spawn is the door approach tile');
const reachable = new Set([entrance.x + ',' + entrance.y]);
const bfsQueue = [[entrance.x, entrance.y]];
while (bfsQueue.length) {
  const [x, y] = bfsQueue.shift();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    const key = nx + ',' + ny;
    if (!isSolid(nx, ny) && !reachable.has(key)) { reachable.add(key); bfsQueue.push([nx, ny]); }
  }
}
assert.equal(reachable.size, freeTiles.length, 'every free tile is connected to the front door');
for (const leaf of ['7,11', '8,11']) {
  const door = house.doors && house.doors[leaf];
  assert(door && typeof door.to === 'string', leaf + ' is a valid door record');
  assert(Number.isInteger(door.tx) && Number.isInteger(door.ty), leaf + ' door lands on integer tiles');
}
for (const [name, target] of Object.entries(Scene.targets)) {
  assert.equal(isSolid(target.x, target.y), false, name + ' target is walkable');
  assert(reachable.has(target.x + ',' + target.y), name + ' target is reachable');
}
// La scala e' l'unico passaggio fra soggiorno e camera di Laura.
for (let x = 0; x < 16; x++) {
  assert.equal(isSolid(x, 4), x !== 4 && x !== 5,
    'row 4 stays solid everywhere except the landing');
}

// Cast Presence: Sarah e' l'unico attore posato in questa mappa. Deve stare su
// un tile calpestabile, raggiungibile, e con almeno un lato di avvicinamento.
const SARAH = { x: 9, y: 7 };
assert.equal(isSolid(SARAH.x, SARAH.y), false, 'Sarah stands on a walkable tile');
assert(reachable.has(SARAH.x + ',' + SARAH.y), 'Sarah tile is reachable from the door');
const sarahApproaches = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  .map(([dx, dy]) => [SARAH.x + dx, SARAH.y + dy])
  .filter(([x, y]) => !isSolid(x, y) && reachable.has(x + ',' + y));
assert(sarahApproaches.length >= 3, 'Sarah keeps an open approach on three sides');

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

const authored = newRecordingContext();
artDraw(authored.context, 0, 0);
assert(authored.calls.length > 150, 'scene paints a substantial authored native frame');
assert(authored.calls.every((call) => call.args.every(Number.isInteger)),
  'all authored draw calls use integer coordinates and dimensions');
assert(authored.calls.every((call) => /^#[0-9a-f]{6}$/i.test(call.color)),
  'every authored rectangle is a flat opaque colour, never a gradient or pattern');

// Ogni prop sta dentro i bounds dichiarati: niente mobile che sborda in una
// cella calpestabile senza che il contratto lo dica.
for (const prop of Art.definitions) {
  const recording = newRecordingContext();
  Art.paintProp(recording.context, 0, 0, prop.id);
  assert(recording.calls.length > 0, prop.id + ' paints something');
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const call of recording.calls) {
    x0 = Math.min(x0, call.args[0]); y0 = Math.min(y0, call.args[1]);
    x1 = Math.max(x1, call.args[0] + call.args[2]); y1 = Math.max(y1, call.args[1] + call.args[3]);
  }
  assert.deepEqual([x0, y0, x1 - x0, y1 - y0], prop.bounds,
    prop.id + ' paints exactly inside its declared bounds');
}

function foregroundCalls(min, max) {
  const recording = newRecordingContext();
  artForeground(recording.context, 0, 0, min, max);
  return recording.calls;
}
function hasRect(calls, x, y, width, height) {
  return calls.some((call) =>
    call.args[0] === x && call.args[1] === y && call.args[2] === width && call.args[3] === height);
}
const depth32 = foregroundCalls(32, 64);
assert(hasRect(depth32, 16, 16, 32, 18), '32px interval selects Laura bed');
assert(hasRect(depth32, 97, 18, 14, 13), '32px interval selects Laura dresser');
assert(!hasRect(depth32, 75, 37, 11, 11), 'half-open interval excludes the ceiling fan at 64px');
const depth80 = foregroundCalls(64, 112);
assert(hasRect(depth80, 75, 37, 11, 11), '64px interval repaints the ceiling fan over the top of the stairs');
assert(hasRect(depth80, 111, 78, 18, 20), '64px interval selects the wing chair north of the rug');
assert(!hasRect(depth80, 47, 88, 18, 25), '64px interval excludes the living room furniture at 112px');
const depth112 = foregroundCalls(112, 144);
assert(hasRect(depth112, 47, 88, 18, 25), '112px interval selects the settee');
assert(hasRect(depth112, 223, 84, 17, 28), '112px interval selects the phonograph console');
assert(hasRect(depth112, 206, 84, 18, 28), '112px interval selects the upright piano');
assert(hasRect(depth112, 78, 116, 20, 10), '112px interval selects the low table on the rug');
assert(!hasRect(depth112, 32, 120, 32, 10), '112px interval excludes the dining table at 144px');
const depth144 = foregroundCalls(144, 160);
assert(hasRect(depth144, 32, 120, 32, 10), '144px interval selects the dining table');
assert(hasRect(depth144, 190, 124, 18, 22), '144px interval selects the club chair on the oval');
assert(hasRect(depth144, 208, 125, 16, 4), '144px interval selects the telephone table');
assert(!hasRect(depth144, 33, 146, 14, 3), '144px interval excludes the chairs at 160px');
const depth160 = foregroundCalls(160, 192);
assert(hasRect(depth160, 33, 146, 14, 3), '160px interval selects the dining chairs');
assert(!hasRect(depth160, 108, 176, 40, 1), '160px interval excludes the door casing at 192px');
const depthDoor = foregroundCalls(192, Infinity);
assert(hasRect(depthDoor, 108, 176, 40, 1), 'the south wall line repaints over whoever stands in the doorway');
assert(!hasRect(depthDoor, 108, 170, 40, 2),
  'the band never reaches above the wall line: an actor on the approach tile is never crossed');
assert(hasRect(depthDoor, 108, 176, 5, 16), 'the west jamb repaints over the doorway');
assert(hasRect(depthDoor, 143, 176, 5, 16), 'the east jamb repaints over the doorway');
assert(!hasRect(depthDoor, 112, 176, 32, 16),
  'the door band never repaints the leaf: an actor in the doorway stays in front of it');
assert.equal(foregroundCalls(33, 63).length, 0, 'empty depth interval paints nothing');

// Nessun arredo e nessun ventilatore dipinge sul tile di Sarah o nella colonna
// di avvicinamento alla porta: un corpo non viene mai sepolto.
const propPixels = newRecordingContext();
for (const prop of Art.definitions) Art.paintProp(propPixels.context, 0, 0, prop.id);
artForeground(propPixels.context, 0, 0, 64, 65); // il ventilatore
const overlaps = (call, [bx, by, bw, bh]) =>
  call.args[0] < bx + bw && call.args[0] + call.args[2] > bx &&
  call.args[1] < by + bh && call.args[1] + call.args[3] > by;
const SARAH_BOX = [SARAH.x * 16, SARAH.y * 16, 16, 16];
const DOOR_COLUMN = [96, 144, 64, 32]; // colonne 6-9, righe 9-10
for (const call of propPixels.calls) {
  assert.equal(overlaps(call, SARAH_BOX), false,
    'furniture never paints on Sarah tile 9,7: ' + call.args.join(','));
  assert.equal(overlaps(call, DOOR_COLUMN), false,
    'furniture never paints in the door approach column: ' + call.args.join(','));
}

// ---------------------------------------------- niente isole, niente stinte
// Il divano, il tappeto e la luce sopra di essi devono essere UN gruppo, e
// altrettanto la consolle con il suo tappeto e il ritratto: la critica a
// freddo leggeva ogni oggetto come un'isola su un pavimento nudo.
const armchair = Art.definitions.find((prop) => prop.id === 'sofa');
const console_ = Art.definitions.find((prop) => prop.id === 'sideboard');
assert(Art.rug.x <= armchair.bounds[0] + armchair.bounds[2],
  'the rug reaches the armchair: its west edge ' + Art.rug.x +
  ' is not east of the chair edge ' + (armchair.bounds[0] + armchair.bounds[2]));
assert(Art.rug.y + Art.rug.h > armchair.footY,
  'the armchair stands on the rug, it does not sit north of it');
assert(Art.wool.y <= console_.footY,
  'the braided oval reaches under the console foot (' + Art.wool.y + ' vs ' + console_.footY + ')');
assert(Art.wool.x + Art.wool.w >= console_.bounds[0] + console_.bounds[2] - 2,
  'the braided oval reaches the console east side');

// Il terzo destro (colonne 11-14) deve portare arredo vero, non un tappeto
// nudo: la critica a freddo leggeva "empty floorboards with one rug and one
// cabinet". Almeno tre pezzi solidi, e almeno uno staccato dal muro est.
const rightThird = Art.definitions.filter((prop) =>
  prop.cells.every(([x, y]) => x >= 11 && x <= 14 && y >= 5 && y <= 10));
assert(rightThird.length >= 3,
  'the right third carries at least three grounded props (' + rightThird.length + ')');
assert(rightThird.some((prop) => prop.cells.every(([x]) => x <= 13)),
  'at least one right-third prop stands off the east wall');
const nook = Art.definitions.find((prop) => prop.id === 'nookChair');
assert(Art.wool.y <= nook.footY && Art.wool.x <= nook.bounds[0],
  'the club chair stands on the braided oval, not beside it');

// Il gruppo di seduta e' un gruppo: il tavolino basso sta sul tappeto dipinto
// e fra la poltrona verde e la poltrona alta, non su un'isola di parquet.
const low = Art.definitions.find((prop) => prop.id === 'coffeeTable');
const wing = Art.definitions.find((prop) => prop.id === 'wingChair');
assert(low.bounds[0] >= Art.rug.x && low.bounds[0] + low.bounds[2] <= Art.rug.x + Art.rug.w,
  'the low table stands inside the painted rug');
assert(low.bounds[0] > armchair.bounds[0] && low.bounds[0] < wing.bounds[0],
  'the low table sits between the armchair and the wing chair');
assert(wing.footY <= Art.rug.y, 'the wing chair stands on the north edge of the rug');

// Il ventilatore e' un corpo illuminante sul soffitto, non una macchia nera
// sul muro: nessun pixel di contorno nero fra le pale.
const fanOnly = newRecordingContext();
artForeground(fanOnly.context, 0, 0, Art.fanFoot, Art.fanFoot + 1);
assert(fanOnly.calls.length > 0, 'the fan is painted in its own band');
const blades = fanOnly.calls.filter((call) => call.args[1] < 37 || call.args[1] > 47);
assert(blades.length > 0, 'the fan has blades outside the hub');
for (const call of blades) {
  assert.notEqual(call.color.toLowerCase(), Art.palette.ink,
    'a fan blade carries no ink outline: it is a fixture, not a stain');
}

// La fascia della porta non sale mai sopra la linea del muro sud: chi sta
// sulla soglia o sul tile d'avvicinamento non viene tagliato.
for (const call of foregroundCalls(Art.doorFoot, Infinity)) {
  assert(call.args[1] >= 176,
    'the door band paints nothing above the south wall line: ' + call.args.join(','));
}

// ------------------------------------------- ordine dei valori sul rasterizzato
// Non serve Chrome: rigiochiamo i rettangoli dell'arte in un buffer RGB e
// misuriamo i piani direttamente, cosi' la prova e' la stessa che il motore
// dipinge e non una cattura che puo' invecchiare.
const W = 256, H = 192;
const buffer = new Uint8Array(W * H * 3);
function raster() {
  const recording = newRecordingContext();
  artDraw(recording.context, 0, 0);
  for (const call of recording.calls) {
    const [x, y, w, h] = call.args;
    const r = parseInt(call.color.slice(1, 3), 16);
    const g = parseInt(call.color.slice(3, 5), 16);
    const b = parseInt(call.color.slice(5, 7), 16);
    for (let py = Math.max(0, y); py < Math.min(H, y + h); py++) {
      for (let px = Math.max(0, x); px < Math.min(W, x + w); px++) {
        const i = (py * W + px) * 3;
        buffer[i] = r; buffer[i + 1] = g; buffer[i + 2] = b;
      }
    }
  }
}
raster();
const pixel = (x, y) => {
  const i = (y * W + x) * 3;
  return [buffer[i], buffer[i + 1], buffer[i + 2]];
};
function region(x0, y0, w, h) {
  const pixels = [];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) pixels.push(pixel(x, y));
  return pixels;
}
const luma = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const mean = (pixels) => pixels.reduce((sum, px) => sum + luma(px), 0) / pixels.length;

const distinct = new Set(region(0, 0, W, H).map((px) => px.join(',')));
assert(distinct.size > 24, 'the raster is a painted frame, not a flat fill (' + distinct.size + ' colours)');
const untouched = region(0, 0, W, H).filter((px) => px[0] === 0 && px[1] === 0 && px[2] === 0);
assert.equal(untouched.length, 0, 'every pixel of the native frame is painted');

const pillow = mean(region(24, 17, 6, 10));
const lauraFloor = mean(region(140, 40, 40, 12));
const parquet = mean(region(196, 150, 36, 16));
const rugField = mean(region(112, 116, 12, 12));
const panelling = mean(region(144, 68, 24, 6));
const southWall = mean(region(60, 183, 30, 4));

assert(pillow > lauraFloor + 40,
  'Laura pillow is the brightest plane in the frame ' +
  `(pillow ${pillow.toFixed(1)} vs upstairs floor ${lauraFloor.toFixed(1)})`);
assert(lauraFloor > parquet + 20 && parquet > rugField + 15 &&
  rugField > panelling + 4 && panelling > southWall + 10,
  'value order holds: upstairs maple > parquet > rug > stair panelling > south wall ' +
  `(${lauraFloor.toFixed(1)} > ${parquet.toFixed(1)} > ${rugField.toFixed(1)} > ` +
  `${panelling.toFixed(1)} > ${southWall.toFixed(1)})`);

// Due ruoli di luce, ciascuno un gradino netto sopra il parquet neutro, e la
// lampada a muro resta la nota piu' calda del pavimento.
const lampPool = mean(region(182, 82, 12, 6));
const duskPlane = mean(region(18, 106, 16, 6));
assert(lampPool > parquet + 30,
  `the sconce pool is a clear step above the parquet (${lampPool.toFixed(1)} vs ${parquet.toFixed(1)})`);
assert(duskPlane > parquet + 8,
  `the west window plane is a step above the parquet (${duskPlane.toFixed(1)} vs ${parquet.toFixed(1)})`);
assert(lampPool > duskPlane + 20,
  'the tungsten pool outshines the cold window plane, never the other way round');

// Il vetro e' l'unica superficie fredda: b > r. Il resto della casa e' calda.
const glassPixels = region(5, 104, 3, 8);
assert(glassPixels.every(([r, , b]) => b > r + 20), 'the west window glass stays cold');
assert(region(196, 150, 36, 16).every(([r, , b]) => r > b + 30), 'the parquet stays warm');

// ------------------------------------------- motore reale e tastiera
Engine.init(canvas, null);
assert.deepEqual([canvas.width, canvas.height], [256, 192], 'engine restores the native canvas dimensions');
Engine.start();
Engine.state.mode = 'title';
Engine.loadMap(MAP_ID, entrance.x, entrance.y, 'up');
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
  const queue = [{ point: start, route: [] }];
  const seen = new Set([start.join(',')]);
  const directions = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
  while (queue.length) {
    const current = queue.shift();
    if (current.point[0] === target.x && current.point[1] === target.y) return current.route;
    for (const [direction, dx, dy] of directions) {
      const x = current.point[0] + dx;
      const y = current.point[1] + dy;
      const key = x + ',' + y;
      if (!seen.has(key) && !isSolid(x, y)) {
        seen.add(key);
        queue.push({ point: [x, y], route: current.route.concat(direction) });
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

for (const name of ['rugCenter', 'sideboard', 'sofaSide', 'coffeeSide', 'wingChairFront', 'nook',
  'nookSouth', 'diningSide', 'landing', 'lauraBedFoot', 'lauraDresser']) {
  walkTo(name);
}

walkTo('lauraBedFoot');
let before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'Laura bed rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before,
  'bed collision leaves player and map unchanged');

walkTo('sideboard');
before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'the phonograph console rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before,
  'console collision leaves player and map unchanged');
assert.equal(storageWrites, 0, 'native scene traversal never writes a save');

console.log('PALMER-NATIVE-PASS production hooks, authored geometry and canonical glyphs, footprint ' +
  'parity, walkable rug, collision and Sarah approach, keyboard routes, integer native pixels, ' +
  'prop bounds, depth intervals with fan and door casing, no furniture on the cast tile, ' +
  'value order and the two light roles');
