/* walkthrough.js — simulatore di partita completa, data-driven (senza browser).
 * Non conosce i contenuti specifici dell'atto corrente: scopre mappe, porte,
 * NPC e oggetti a runtime tramite GAME.Maps/GAME.Data e le stesse funzioni di
 * gating dell'engine (checkCond/resolveDialogue/npcActive), cosi' non serve
 * toccarlo quando atti futuri aggiungono contenuto.
 * Esegui con: node test/walkthrough.js
 */
'use strict';
const path = require('path');

/* ---------------- stub ambiente browser (come test/smoke.js) ---------------- */

global.window = global;
global.addEventListener = () => {};
global.requestAnimationFrame = () => {};
global.performance = { now: () => 0 };

const ctxStub = new Proxy(
  { measureText: (s) => ({ width: String(s).length * 5 }) },
  { get(t, k) { return k in t ? t[k] : () => {}; }, set() { return true; } }
);
const canvasStub = { getContext: () => ctxStub };

const J = (f) => path.join(__dirname, '..', 'js', f);
require(J('tiles.js'));
require(J('chars.js'));
require(J('houses.js'));
require(J('maps.js'));
require(J('data.js'));
require(J('engine.js'));
require(J('glue.js'));

const GAME = global.GAME;
const E = GAME.Engine;

/* ---------------- tabella invarianti (estendere qui per atti futuri) -------- */

// PREREQ[chiave] = elenco di flag/indizi che devono comparire PRIMA nella
// traccia di acquisizione. Chiave con prefisso "done_" = dialogo concluso.
const PREREQ = {
  'done_laura_sogno': ['met_mfap'],
  'sogno_fatto': ['met_mfap'], // stesso evento di "done_laura_sogno": e' il flag che lo dimostra
  'ronette_bob': ['sogno_fatto'],
  'poesia_fuoco': ['sogno_fatto'],
  'cuore_intero': ['sogno_fatto'],
  'atto3': ['poesia_fuoco', 'cuore_intero', 'sogno_fatto'],
  'done_truman_atto3': ['poesia_fuoco', 'cuore_intero', 'sogno_fatto'],
  'biglietto_fuoco': ['atto3'],
  'anello': ['atto3'],
  'jacques_preso': ['atto3'],
  'audrey_salvata': ['audrey_indaga', 'atto3'],
  'jacques_morto': ['jacques_preso'],
  'gigante1': ['jacques_morto'],
  'atto4': ['gigante1'],
  'done_truman_atto4': ['gigante1'],
  'gigante2': ['atto4'],
  'lettera_o': ['gigante2'],
  'maddy_trovata': ['gigante2'],
  'atto5': ['maddy_trovata'],
  'done_truman_atto5': ['maddy_trovata'],
  'leland_confessa': ['atto5'],
  'leland_morto': ['leland_confessa'],
  'done_laura_finale2': ['leland_morto', 'met_mfap']
};
// invariante strutturale extra: la prima volta che una mappa "woods*" entra
// nell'orizzonte raggiungibile, servono almeno N indizi (gating della transenna).
const WOODS_MIN_CLUES = 3;

/* ---------------- stato simulato ---------------- */

E.init(canvasStub); // popola E.state con lo stato iniziale (mappa/spawn di partenza)
const start = { mapId: E.state.mapId, x: E.state.player.tx, y: E.state.player.ty };

const simSt = { clues: [], flags: {} }; // stesso shape di S: {clues:[], flags:{}}
const trace = [];       // {type:'clue'|'flag'|'done', id, map}
const mapEntries = [];  // {mapId, clues} al momento della prima scoperta
let endReached = false;

function firstIndex(type, id) {
  for (let i = 0; i < trace.length; i++) if (trace[i].type === type && trace[i].id === id) return i;
  return -1;
}
function traceIndexOf(key) {
  if (key.indexOf('done_') === 0) return firstIndex('done', key.slice(5));
  const byFlag = firstIndex('flag', key);
  if (byFlag >= 0) return byFlag;
  return firstIndex('clue', key);
}

/* tile bloccato per il movimento: solidita' del terreno, porte non attraversabili,
 * NPC attivi, oggetti — stessa logica di GAME.Maps.isSolid + tryStep() */
function tileBlocked(mapId, x, y) {
  if (GAME.Maps.isSolid(mapId, x, y, simSt)) return true;
  const door = GAME.Maps.doorAt(mapId, x, y);
  if (door) {
    if (door.locked) return true;
    if (door.needsFlag && !E.checkCond('flag:' + door.needsFlag, simSt)) return true;
    if (door.needsClues && simSt.clues.length < door.needsClues) return true;
  }
  const map = GAME.Maps[mapId];
  for (let i = 0; i < map.npcs.length; i++) {
    const n = map.npcs[i];
    if (n.x === x && n.y === y && E.npcActive(n, simSt)) return true;
  }
  if (GAME.Maps.objectAt(mapId, x, y)) return true;
  return false;
}

// BFS delle tile raggiungibili su una mappa, a partire da uno o piu' punti noti;
// ritorna anche le porte attraversabili incontrate (per scoprire nuove mappe).
function reachableTiles(mapId, entryPoints) {
  const seen = {};
  const queue = [];
  entryPoints.forEach((p) => {
    const k = p.x + ',' + p.y;
    if (!seen[k]) { seen[k] = true; queue.push(p); }
  });
  const doorsFound = [];
  const deltas = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  let qi = 0;
  while (qi < queue.length) {
    const cur = queue[qi++];
    for (const d of deltas) {
      const nx = cur.x + d[0], ny = cur.y + d[1];
      const k = nx + ',' + ny;
      if (seen[k]) continue;
      if (tileBlocked(mapId, nx, ny)) continue;
      seen[k] = true;
      queue.push({ x: nx, y: ny });
      const door = GAME.Maps.doorAt(mapId, nx, ny);
      if (door && door.to) doorsFound.push(door);
    }
  }
  return { seen, doors: doorsFound };
}

function adjacentReachable(seen, x, y) {
  return !!(seen[x + ',' + (y - 1)] || seen[x + ',' + (y + 1)] || seen[(x - 1) + ',' + y] || seen[(x + 1) + ',' + y]);
}

// applica gli effetti "prima lettura" di un dialogo (stessa logica di advanceDialogue)
function applyDialogue(dialogueField, mapId) {
  const id = E.resolveDialogue(dialogueField, simSt);
  if (!id) return false;
  if (simSt.flags['done_' + id]) return false; // gia' letto: solo pagine "again", nessun nuovo effetto
  const def = GAME.Data.dialogues[id];
  if (!def) return false;
  if (def.give) {
    def.give.forEach((c) => {
      if (simSt.clues.indexOf(c) < 0) { simSt.clues.push(c); trace.push({ type: 'clue', id: c, map: mapId }); }
    });
  }
  if (def.setFlag && !simSt.flags[def.setFlag]) {
    simSt.flags[def.setFlag] = true;
    trace.push({ type: 'flag', id: def.setFlag, map: mapId });
  }
  simSt.flags['done_' + id] = true;
  trace.push({ type: 'done', id: id, map: mapId });
  if (def.end) endReached = true;
  return true;
}

/* ---------------- iterazione a punto fisso ---------------- */

const knownEntries = { [start.mapId]: [{ x: start.x, y: start.y }] };
let changed = true;
let iterations = 0;
while (changed && iterations < 200) {
  changed = false;
  iterations++;
  Object.keys(knownEntries).forEach((mapId) => {
    const res = reachableTiles(mapId, knownEntries[mapId]);

    res.doors.forEach((d) => {
      const arr = knownEntries[d.to] || (knownEntries[d.to] = []);
      if (!arr.some((p) => p.x === d.tx && p.y === d.ty)) {
        arr.push({ x: d.tx, y: d.ty });
        if (!mapEntries.some((e) => e.mapId === d.to)) mapEntries.push({ mapId: d.to, clues: simSt.clues.length });
        changed = true;
      }
    });

    const map = GAME.Maps[mapId];
    map.npcs.forEach((n) => {
      if (!E.npcActive(n, simSt)) return;
      if (!adjacentReachable(res.seen, n.x, n.y)) return;
      if (applyDialogue(n.dialogue, mapId)) changed = true;
    });
    map.objects.forEach((o) => {
      if (!adjacentReachable(res.seen, o.x, o.y)) return;
      if (applyDialogue(o.dialogue, mapId)) changed = true;
    });
  });
}
if (!mapEntries.some((e) => e.mapId === start.mapId)) mapEntries.unshift({ mapId: start.mapId, clues: 0 });

if (iterations >= 200) {
  console.error('ERRORE: la simulazione non converge (200 iterazioni raggiunte) — possibile ciclo di gating.');
  process.exit(1);
}

/* ---------------- report ---------------- */

console.log('--- MAPPE SCOPERTE (indizi al momento della scoperta) ---');
mapEntries.forEach((e) => console.log('  ' + e.mapId + '  (indizi: ' + e.clues + ')'));

console.log('\n--- TRACCIA ACQUISIZIONI (ordine) ---');
trace.forEach((e, i) => console.log('  ' + (i + 1) + '. ' + e.type + ':' + e.id + '  [' + e.map + ']'));

/* ---------------- assertion ---------------- */

const failures = [];

if (!endReached) failures.push('nessun dialogo con end:true raggiunto dalla simulazione');

Object.keys(PREREQ).forEach((key) => {
  const idx = traceIndexOf(key);
  if (idx < 0) { failures.push(`PREREQ: "${key}" non risulta mai raggiunto`); return; }
  PREREQ[key].forEach((req) => {
    const reqIdx = traceIndexOf(req);
    if (reqIdx < 0) { failures.push(`PREREQ: "${key}" raggiunto ma prerequisito "${req}" mai impostato`); return; }
    if (reqIdx > idx) failures.push(`PREREQ violato: "${key}" raggiunto PRIMA di "${req}" (ordine errato)`);
  });
});

mapEntries.forEach((e) => {
  if (e.mapId.indexOf('woods') === 0 && e.clues < WOODS_MIN_CLUES) {
    failures.push(`PREREQ violato: mappa "${e.mapId}" raggiunta con ${e.clues} indizi (richiesti >= ${WOODS_MIN_CLUES})`);
  }
});

if (failures.length) {
  console.error('\nFALLITO:');
  failures.forEach((f) => console.error('  - ' + f));
  process.exit(1);
}

console.log(`\nOK: cammino completo simulato, ${trace.length} acquisizioni, finale raggiunto ✔`);
