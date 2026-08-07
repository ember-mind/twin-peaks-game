#!/usr/bin/env node
'use strict';

/* Gate R60: legge la mappa di produzione, non la clone procedurale di
 * genmaps.js. Verifica topologia, percorsi e layer terreno/prop. */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

global.window = global;
require('../js/tiles.js');
require('../js/chars.js');
require('../js/houses.js');
require('../js/maps.js');
require('../js/data.js');
require('../js/glue.js');

const sourceMap = GAME.maps.maps.town;
const arrivalMap = GAME.maps.maps.arrival;
const map = GAME.Maps.town;
const rows = sourceMap.rows;
const W = sourceMap.width;
const H = sourceMap.height;
let passed = 0;

function ok(value, label) {
  assert(value, label);
  passed++;
  console.log('ok - ' + label);
}

function key(x, y) { return x + ',' + y; }
function at(x, y) { return y >= 0 && y < H && x >= 0 && x < W ? rows[y][x] : ''; }
function neighbors(x, y) { return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]; }

function flood(start, accepts) {
  const seen = new Set();
  const todo = [start];
  while (todo.length) {
    const [x, y] = todo.shift();
    const k = key(x, y);
    if (x < 0 || y < 0 || x >= W || y >= H || seen.has(k) || !accepts(x, y)) continue;
    seen.add(k);
    for (const next of neighbors(x, y)) todo.push(next);
  }
  return seen;
}

function coordsWhere(chars) {
  const out = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (chars.includes(at(x, y))) out.push([x, y]);
  }
  return out;
}

ok(rows.length === 36 && rows.every((row) => row.length === 56), 'town reale resta 56x36 rettangolare');
ok(!GAME.maps.SOLID.u, 'piazza u e calpestabile');
ok(!GAME.maps.SOLID[':'], 'zebra est-ovest : e calpestabile');
ok(arrivalMap.doors['4,8'].to === 'town' && arrivalMap.doors['4,8'].tx === 30 && arrivalMap.doors['4,8'].ty === 33 &&
  !GAME.maps.SOLID[at(30, 33)], 'radura sbocca sul margine sud calpestabile, non sulla strada');

const expectedDoors = ['9,6', '23,6', '42,6', '12,20', '42,20', '47,28', '55,14', '55,15'];
ok(expectedDoors.every((k) => sourceMap.doors[k]), 'coordinate porte storiche invariate');
for (const k of expectedDoors.slice(0, 6)) {
  const [x, y] = k.split(',').map(Number);
  ok(at(x, y + 1) === 'p', 'approccio authored subito sotto porta ' + k);
}

const walkable = flood([30, 31], (x, y) => x >= 0 && y >= 0 && x < W && y < H && !GAME.maps.SOLID[at(x, y)]);
for (const k of expectedDoors) ok(walkable.has(k), 'porta raggiungibile dalla piazza ' + k);
for (const npc of map.npcs) ok(walkable.has(key(npc.x, npc.y)), 'NPC raggiungibile: ' + npc.id);
for (const k of Object.keys(sourceMap.interact)) ok(walkable.has(k) || GAME.maps.SOLID[at(...k.split(',').map(Number))], 'interact presente nel distretto: ' + k);

const roadChars = 'r-:';
const roadTiles = coordsWhere(roadChars);
const roadComponent = flood(roadTiles[0], (x, y) => roadChars.includes(at(x, y)));
ok(roadComponent.size === roadTiles.length, 'strada e attraversamenti formano una componente unica');
ok(roadTiles.every(([x, y]) => neighbors(x, y).some(([nx, ny]) => roadChars.includes(at(nx, ny)))), 'nessun tile strada isolato');
ok([14, 15].every((y) => Array.from({ length: 55 }, (_, x) => x + 1).every((x) => roadChars.includes(at(x, y)))), 'asse est-ovest continuo e largo due tile');
ok(Array.from({ length: 19 }, (_, i) => i + 16).every((y) => [27, 28, 29].every((x) => roadChars.includes(at(x, y)))),
  'asse nord-sud attraversa piazza e bordo sud, largo tre tile');

const routeChars = '=r-:puD';
const route = flood([30, 31], (x, y) => routeChars.includes(at(x, y)));
for (const k of expectedDoors) ok(route.has(k), 'rete primaria collega porta ' + k);

const urban = coordsWhere('u');
const urbanRemaining = new Set(urban.map(([x, y]) => key(x, y)));
const urbanComponents = [];
while (urbanRemaining.size) {
  const startKey = urbanRemaining.values().next().value;
  const start = startKey.split(',').map(Number);
  const component = flood(start, (x, y) => at(x, y) === 'u' || sourceMap.ground[key(x, y)] === 'u');
  urbanComponents.push(component);
  for (const k of component) urbanRemaining.delete(k);
}
ok(urban.length === 18 && urbanComponents.length === 1,
  'ghiaia limitata a corte civica 6x4 e ingresso visibile');

const groundedProps = 'SLPBAHEqV';
const props = coordsWhere(groundedProps);
ok(props.every(([x, y]) => ['.', '=', 'u', 'p', 'r'].includes(sourceMap.ground[key(x, y)])), 'ogni prop urbano dichiara sottofondo');
const compactBuildings = coordsWhere('0');
ok(compactBuildings.length === 27 && compactBuildings.every(([x, y]) => sourceMap.ground[key(x, y)] === '.'),
  'le tre botteghe/case 3x3 dichiarano sottofondo su ogni tile solido');
ok(Object.keys(sourceMap.ground).every((k) => {
  const [x, y] = k.split(',').map(Number);
  return groundedProps.includes(at(x, y)) || at(x, y) === '0';
}), 'layer sottofondo non contiene coordinate stale');

const plazaWindow = new Set();
for (let y = 27; y <= 35; y++) for (let x = 24; x <= 35; x++) plazaWindow.add(at(x, y));
for (const anchor of ['u', 'r', ':', '=', 'S', 'B', 'A', 'H', 'E', 'L']) ok(plazaWindow.has(anchor), 'frame piazza contiene anchor ' + anchor);
ok(Array.from({ length: 7 }, (_, i) => i + 28).every((y) => [27, 28, 29].every((x) => roadChars.includes(at(x, y)))),
  'asse rosa domina piazza e uscita sud includendo la zebra semantica');
ok(at(30, 31) === 'p' && [30, 31, 32].every((x) => walkable.has(key(x, 31))) &&
   neighbors(30, 31).some(([x, y]) => at(x, y) === 'r'),
  'spawn piazza sulla bocca 3-wide e adiacente alla strada');
ok([30, 31, 32, 33, 34].every((x) => [27, 28, 29, 30].every((y) =>
  at(x, y) === 'u' || sourceMap.ground[key(x, y)] === 'u')),
  'corte 5x4 continua, props interni sullo stesso sottofondo');
ok([30, 31, 32].every((x) => [28, 29, 30].every((y) =>
  at(x, y) === 'u' || sourceMap.ground[key(x, y)] === 'u')) &&
   [28, 29].every((y) => at(29, y) === ':') && at(29, 30) === 'r' && at(35, 27) === '=' &&
   sourceMap.ground['35,28'] === '=',
  'corte civica ha bocca 3-wide diretta dalla strada e solo bordo est');
ok(at(30, 30) === 'S' && sourceMap.interact['30,30'] === 'cartello' &&
  sourceMap.objects.some((obj) => obj.kind === 'welcomesign' && obj.x === 30 && obj.y === 30),
  'cartello visibile, interazione e landmark coincidono a 30,30');

ok([23, 24, 25].every((y) =>
  [...Array.from({ length: 25 }, (_, i) => i + 1), ...Array.from({ length: 14 }, (_, i) => i + 30)]
    .every((x) => at(x, y) === '=')),
  'passeggiata civica larga tre righe su entrambi i lati della strada');

/* Crosswalk: tre tile, centrati SOLO sugli accessi nord reali. */
const expectedCrosswalk = new Set();
for (const y of [14, 15]) for (const center of [9, 23, 42]) {
  for (let x = center - 1; x <= center + 1; x++) expectedCrosswalk.add(key(x, y));
}
const crosswalk = coordsWhere('-');
ok(crosswalk.length === expectedCrosswalk.size && crosswalk.every(([x, y]) => expectedCrosswalk.has(key(x, y))),
  'crosswalk 3-wide allineati solo a hotel, ospedale e Palmer');
const eastWestCrosswalk = coordsWhere(':');
ok(eastWestCrosswalk.length === 6 && [28, 29].every((y) => [27, 28, 29].every((x) => at(x, y) === ':')),
  'zebra E-O 3x2 attraversa la strada verticale davanti alla corte');

/* Scala Pokémon: nessun landmark principale supera 6x4. Le porte storiche
 * sono incluse nel bbox pur usando il glifo D invece del glifo edificio. */
const footprints = [
  ['4', 6, 3, 6, 4, 9, 6], ['5', 20, 3, 6, 4, 23, 6], ['3', 40, 4, 4, 3, 42, 6],
  ['1', 10, 17, 6, 4, 12, 20], ['2', 39, 18, 6, 3, 42, 20], ['6', 44, 25, 6, 4, 47, 28]
];
for (const [ch, x0, y0, width, height, dx, dy] of footprints) {
  const cells = coordsWhere(ch).concat([[dx, dy]]);
  ok(width <= 6 && height <= 4 && cells.every(([x, y]) => x >= x0 && x < x0 + width && y >= y0 && y < y0 + height) &&
    Math.min(...cells.map(([x]) => x)) === x0 && Math.max(...cells.map(([x]) => x)) === x0 + width - 1,
    'footprint ' + ch + ' entro ' + width + 'x' + height + ' con porta invariata');
}

/* Cattura street: due edifici veri separati da un vicolo percorribile,
 * non ali costruite per ingannare il frame. */
function exactBlock(ch, x0, y0, width) {
  const cells = coordsWhere(ch);
  return cells.length === width * 4 && cells.every(([x, y]) => x >= x0 && x < x0 + width && y >= y0 && y < y0 + 4);
}
ok(exactBlock('7', 28, 2, 3) && exactBlock('9', 33, 3, 3),
  'Bookhouse e Horne\'s 3x4 sono autonomi e sfalsati verticalmente');
ok([2, 3, 4, 5, 6, 7, 8, 9].every((y) => [31, 32].every((x) =>
  at(x, y) === 'p' && walkable.has(key(x, y)))),
  'vicolo largo due tile fra edifici sfalsati, calpestabile e connesso');
ok(at(32, 5) === 'p' && walkable.has('32,5'), 'camera street x32,y5 in vicolo reale e connessa');
const streetWindow = [];
for (let y = 2; y <= 10; y++) for (let x = 27; x <= 36; x++) streetWindow.push(at(x, y));
ok(streetWindow.filter((ch) => ch === '7').length === 12 && streetWindow.filter((ch) => ch === '9').length === 12,
  'frame street contiene entrambi gli edifici interi');
const streetComponents = [];
const streetSolid = new Set();
for (let y = 2; y <= 10; y++) for (let x = 27; x <= 36; x++) if (/^[0-9]$/.test(at(x, y))) streetSolid.add(key(x, y));
while (streetSolid.size) {
  const first = streetSolid.values().next().value.split(',').map(Number);
  const component = flood(first, (x, y) => streetSolid.has(key(x, y)));
  streetComponents.push(component);
  for (const k of component) streetSolid.delete(k);
}
ok(streetComponents.length === 2, 'frame street contiene esattamente due componenti edificio, nessuna terza slice');
ok(streetWindow.filter((ch) => ch === '.' || ch === ',').length / streetWindow.length < 0.40,
  'frame street usa meno del 40% prato');
ok([8, 9, 10, 11, 12].every((y) => [25, 26, 27].every((x) => !'wF'.includes(at(x, y)))),
  'nessuna massa blu o rail residua accanto alla coppia street');
ok([8, 9, 10].every((x) => [7, 8, 9, 10, 11, 12, 13].every((y) => at(x, y) === 'p')),
  'approccio hotel largo tre tile dalla porta alla strada');
ok([[22, 24], [41, 43]].every(([x0, x1]) =>
  Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).every((x) =>
    [7, 8, 9, 10, 11, 12, 13].every((y) => at(x, y) === 'p'))),
  'approcci ospedale e Palmer larghi tre tile fino alla strada');
ok([7, 8, 9].every((y) => Array.from({ length: 36 }, (_, i) => i + 8).every((x) =>
  at(x, y) === 'p' || sourceMap.ground[key(x, y)] === 'p')),
  'corsia nord 36x3 continua, con una vera riga interna senza bordi');
ok([7, 8, 9].every((x) => [16, 17, 18, 19, 20, 21, 22, 23].every((y) => 'p='.includes(at(x, y)))) &&
   [21, 22, 23].every((y) => Array.from({ length: 7 }, (_, i) => i + 7).every((x) => 'p='.includes(at(x, y)))),
  'raccordo hotel-sheriff largo tre tile e svolta 7x3');
ok([45, 46, 47].every((x) => [16, 17, 18, 19, 20, 21, 22, 23, 24].every((y) => at(x, y) === 'p')) &&
   [21, 22, 23].every((y) => [41, 42, 43, 44, 45, 46, 47].every((x) => 'p='.includes(at(x, y)))) &&
   [41, 42, 43].every((x) => [24, 25, 26, 27, 28, 29, 30, 31].every((y) => 'p='.includes(at(x, y)))) &&
   [29, 30, 31].every((y) => [41, 42, 43, 44, 45, 46, 47, 48].every((x) => at(x, y) === 'p')),
  'diner e Roadhouse collegati da corridoi e forecourt larghi almeno tre tile');

const compactExpected = new Set();
for (const [x0, y0] of [[15, 10], [19, 10], [46, 10]]) {
  for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + 3; x++) compactExpected.add(key(x, y));
}
ok(compactBuildings.every(([x, y]) => compactExpected.has(key(x, y))) && compactExpected.size === compactBuildings.length,
  'botteghe/case formano tre volumi 3x3 fuori dal frame street');

/* Carrier criticati: ognuno deve contenere un volume 3x3 intero, compreso
 * il lift del tetto. È una misura di completezza, non un conteggio gonfiato
 * da recinti o props. */
function frameContains(cx, cy, x0, y0, width, height) {
  return x0 >= cx - 5 && x0 + width - 1 <= cx + 4 && y0 - 1 >= cy - 4 && y0 + height - 1 <= cy + 4;
}
for (const [cx, cy, bx, by] of [
  [16, 9, 15, 10], [20, 9, 19, 10], [47, 13, 46, 10]
]) {
  ok(frameContains(cx, cy, bx, by, 3, 3), 'carrier frame @' + cx + ',' + cy + ' contiene landmark 3x3 intero con tetto');
}

const authored = fs.readFileSync(path.join(__dirname, '..', 'js', 'retro-authored.js'), 'utf8');
ok(!/urbanCore/.test(authored), 'nessun cambio materiale tramite rettangolo di coordinate');
ok(/case 'r':[\s\S]{0,180}townRoad/.test(authored) && /case 'u':[\s\S]{0,180}townGravel/.test(authored) && /case ':'/.test(authored),
  'strada, zebra orientata e piazza hanno renderer distinti');
ok(/function semanticCell/.test(authored) && /vertical && !horizontal/.test(authored), 'marciapiede usa autotile orizzontale verticale e giunzioni');
ok(/function departmentStore/.test(authored) && /case '9': building/.test(authored), 'Horne\'s usa storefront authored dedicato');
ok(/'0': \['#713943'/.test(authored) && /case '0': case '1'/.test(authored), 'bottega\/casa compatta ha renderer distinto');
ok(/function townGround/.test(authored) && /function townPath/.test(authored) && /function townRoad/.test(authored) &&
  /function townSidewalk/.test(authored) && /paleGround/.test(authored),
  'town estende terreno crema R69 a prato, sentieri, strada, marciapiedi e sotto-alberi');

console.log('\nTOWN-MAP-COHERENCE-PASS ' + passed + '/' + passed);
