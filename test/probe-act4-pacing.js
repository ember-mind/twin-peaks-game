/* probe-act4-pacing.js — diagnostica, NON tocca file di produzione.
 * Sibling di test/probe-act3-pacing.js (stessa impalcatura: stub browser, BFS
 * a piedi sulla griglia calpestabile, Manhattan sui cambi mappa, 213 ms/tile,
 * lettura 12/15 cps + 0.6 s/pagina), applicato all'Atto 4 COME E' COSTRUITO
 * OGGI (M8 "Sta accadendo di nuovo", narrative/missions/M8.json).
 *
 * Punto di partenza: Cooper alla centrale davanti a Truman, subito dopo
 * m6_atto4_bridge (M6 B9, che imposta flags.atto4 — entry_condition di M8).
 * Lo stato narrativo NON rigioca M4/M5/M6: e' seminato come in
 * test/m8-engine-harness.html::seedBase() (atto4 + E3_LETTERA_R + E1_DIARIO,
 * le due evidenze di carryover richieste dai confronti del taccuino).
 *
 * Coordinate: porte da GAME.Maps[id].doors a runtime (incluse quelle
 * registrate da location-connections), target ambientali da WORLD_TARGETS
 * (A._debugWorldTargets), attori iniettati (maddy/leland al diner) da
 * NARRATIVE_ENTITIES (A._debugNarrativeEntities), NPC classici (norma, truman)
 * da GAME.Maps[id].npcs. Tutto validato con isWalkableTile.
 *
 * Esegui con: node test/probe-act4-pacing.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------------- stub ambiente browser (identico al riferimento) ------ */
let tnow = 0;
let rafQueue = [];
const handlers = {};
global.window = global;
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.requestAnimationFrame = (cb) => { rafQueue.push(cb); };
global.performance = { now: () => tnow };
global.setInterval = () => 0;
global.document = {
  body: { classList: { toggle() {} }, setAttribute() {} },
  getElementById: () => null,
  addEventListener() {}
};
const ctxStub = new Proxy(
  { measureText: (s) => ({ width: String(s).length * 5 }) },
  { get(t, k) { return k in t ? t[k] : () => {}; }, set() { return true; } }
);
const canvasStub = { getContext: () => ctxStub };

const J = (f) => path.join(__dirname, '..', 'js', f);
[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js',
  'engine.js', 'scene-objects.gen.js', 'glue.js', 'location-connections.js', 'environment-reactions.js','world-connections.gen.js',
  'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js', 'sheriffs-station-exterior-scene.js', 'sheriffs-station-production.js',
  'room-315-art.js', 'room-315-scene.js', 'room-315-production.js', 'world-connections-production.js'
].forEach((f) => require(J(f)));

const GAME = global.GAME;
const E = GAME.Engine;
const S = () => E.state;

require(J('narrative-runtime.js'));
require(J('narrative-data.gen.js'));
require(J('narrative-engine-adapter.js'));
const NR = GAME.NarrativeRuntime;
const MD = GAME.NarrativeData.missions;
const M8 = MD.M8;
const A = GAME.NarrativeAdapter;
if (!M8) throw new Error('M8 assente da js/narrative-data.gen.js');
if (!A) throw new Error('GAME.NarrativeAdapter non esposto');
(function extractWorldTargets() {
  const scratch = NR.createState();
  A.enable({ mission: M8, missions: [MD.M4, MD.M5, MD.M6, M8].filter(Boolean), state: scratch });
  A.disable && A.disable();
})();
const WORLD_TARGETS = A._debugWorldTargets;
const ENTITIES = A._debugNarrativeEntities || [];
['roadhouse', 'town', 'palmer'].forEach((m) => { if (!WORLD_TARGETS || !WORLD_TARGETS[m]) throw new Error(`WORLD_TARGETS.${m} mancante`); });

(function installValueDomains() {
  const enumsPath = path.join(__dirname, '..', 'narrative', 'state-enums.json');
  if (!fs.existsSync(enumsPath)) return;
  const enums = JSON.parse(fs.readFileSync(enumsPath, 'utf8'));
  const domains = {};
  Object.keys(enums.values_allowed || {}).forEach((name) => { domains[name] = enums.enums[enums.values_allowed[name]]; });
  NR.setValueDomains(domains);
  NR.setValueTransitions(enums.value_transitions || {}); // presagio_status active->verified (m8_discovery)
})();

function pump(ms) {
  for (let i = 0; i < Math.ceil(ms / 16); i++) { tnow += 16; rafQueue.splice(0).forEach((cb) => cb(tnow)); }
}

/* ---------------- costanti (identiche al riferimento) ------------------ */
const TILE_PX = 16, SPEED = 0.075;
const MS_PER_TILE = TILE_PX / SPEED;
const TILES_PER_SEC = 1000 / MS_PER_TILE;
const CHARS_PER_SEC = 12, CHARS_PER_SEC_FAST = 15, SEC_PER_PAGE_INPUT = 0.6;

/* ---------------- BFS / coordinate (identici al riferimento) ----------- */
function tileBlocked(mapId, x, y) {
  const st = S();
  if (GAME.Maps.isSolid(mapId, x, y, st)) return true;
  const door = GAME.Maps.doorAt(mapId, x, y);
  if (door) {
    if (door.locked) return true;
    if (door.needsFlag && !E.checkCond('flag:' + door.needsFlag, st)) return true;
    if (door.needsClues && st.clues.length < door.needsClues) return true;
  }
  const map = GAME.Maps[mapId];
  for (let i = 0; i < map.npcs.length; i++) { const n = map.npcs[i]; if (n.x === x && n.y === y && E.npcActive(n, st)) return true; }
  if (GAME.Maps.objectAt(mapId, x, y)) return true;
  return false;
}
function bfsDistance(mapId, x0, y0, x1, y1) {
  if (x0 === x1 && y0 === y1) return 0;
  const seen = new Set([x0 + ',' + y0]);
  const queue = [{ x: x0, y: y0, d: 0 }];
  const deltas = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  let qi = 0;
  while (qi < queue.length) {
    const cur = queue[qi++];
    for (const d of deltas) {
      const nx = cur.x + d[0], ny = cur.y + d[1], k = nx + ',' + ny;
      if (seen.has(k)) continue;
      const isTarget = nx === x1 && ny === y1;
      if (!isTarget && tileBlocked(mapId, nx, ny)) continue;
      seen.add(k);
      if (isTarget) return cur.d + 1;
      queue.push({ x: nx, y: ny, d: cur.d + 1 });
    }
  }
  return null;
}
function isWalkableTile(mapId, x, y) {
  const map = GAME.Maps[mapId];
  if (!map || x < 0 || y < 0 || y >= map.rows.length || x >= map.rows[0].length) return false;
  return !GAME.Maps.isSolid(mapId, x, y, { clues: [] });
}
function findApproachTile(mapId, nx, ny, preferred) {
  if (preferred && isWalkableTile(mapId, preferred[0], preferred[1])) return { x: preferred[0], y: preferred[1] };
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const x = nx + dx, y = ny + dy; if (isWalkableTile(mapId, x, y)) return { x, y }; }
  throw new Error(`nessuna tile calpestabile adiacente a ${mapId} (${nx},${ny})`);
}
function approachNpcTile(mapId, npcId, preferred) {
  const npc = GAME.Maps[mapId].npcs.find((n) => n.id === npcId);
  if (!npc) throw new Error(`npc "${npcId}" non trovato su ${mapId}`);
  return findApproachTile(mapId, npc.x, npc.y, preferred);
}
function approachEntityTile(mapId, npcId) {
  const ent = ENTITIES.find((e) => e.map_id === mapId && e.npc && e.npc.id === npcId);
  if (!ent) throw new Error(`NARRATIVE_ENTITIES: "${npcId}" non registrato su ${mapId}`);
  return findApproachTile(mapId, ent.npc.x, ent.npc.y, null);
}
function approachWorldTarget(mapId, targetId) {
  const reg = WORLD_TARGETS[mapId];
  if (!reg || !reg[targetId]) throw new Error(`WORLD_TARGETS["${mapId}"]["${targetId}"] non trovato`);
  const t = reg[targetId];
  return findApproachTile(mapId, t.x, t.y, [t.x, t.y]);
}
function findDoorTile(mapId, targetMapId, fromX, fromY) {
  const doors = GAME.Maps[mapId].doors;
  let best = null, bestD = Infinity;
  Object.keys(doors).forEach((k) => {
    const d = doors[k];
    if (d.to !== targetMapId) return;
    const [x, y] = k.split(',').map(Number);
    const dist = Math.abs(x - fromX) + Math.abs(y - fromY);
    if (dist < bestD) { bestD = dist; best = { x, y, def: d }; }
  });
  if (!best) throw new Error(`nessuna porta da ${mapId} a ${targetMapId}`);
  return best;
}

/* ---------------- runtime narrativo ----------------------------------- */
function nodeOf(id) { const n = M8.nodes.find((x) => x.id === id); if (!n) throw new Error(`nodo "${id}" non in M8`); return n; }
function doNode(s, id) {
  const p = NR.prepareNode(s, M8, id);
  if (!p.ok) throw new Error(`prepareNode(M8.${id}) fallita: ${p.error}`);
  if (p.continuation || p.resume_choice) throw new Error(`prepareNode(M8.${id}): stato inatteso (continuation/resume)`);
  const c = NR.commitNode(s, M8, p);
  if (!c.ok) throw new Error(`commitNode(M8.${id}) fallita`);
  return p.pages || [];
}
function doChoice(s, id, choiceId) {
  const node = nodeOf(id);
  const p = NR.prepareChoice(s, M8, node, choiceId);
  if (!p.ok) throw new Error(`prepareChoice(${id}.${choiceId}) fallita: ${p.error}`);
  const c = NR.commitChoice(s, M8, node, p);
  if (!c.ok) throw new Error(`commitChoice(${id}.${choiceId}) fallita`);
  if (c.goto) throw new Error(`${id}.${choiceId}: goto inatteso (${c.goto})`);
  return p.feedback_pages || [];
}
function seedState() {
  // identico a test/m8-engine-harness.html::seedBase()
  const s = NR.createState();
  NR.applyEffects(s, [{ set: 'atto4' }, { evidence: 'E3_LETTERA_R' }, { evidence: 'E1_DIARIO' }]);
  return s;
}
const chars = (pages) => pages.reduce((a, p) => a + (p && p.text ? p.text.length : 0), 0);
function modeCounts(pages, acc) {
  acc = acc || { action: 0, dialogue: 0, notebook: 0, other: 0 };
  pages.forEach((p) => { const m = p && p.mode; if (m === 'action' || m === 'dialogue' || m === 'notebook') acc[m]++; else acc.other++; });
  return acc;
}

/* ---------------- percorso obbligato ----------------------------------- */
const ROUTE_NODE = { palmer: 'm8_route_palmer', lago: 'm8_route_lake', diner: 'm8_route_diner' };

function runRequiredPath(promise, warning, focus) {
  E.init(canvasStub); E.start(); pump(32);
  E.state.mode = 'play';
  E.state.flags.intro_town = true; E.state.flags.intro_hotel = true;
  E.state.flags.atto4 = true;              // porta town(47,28)->roadhouse: needsFlag atto4
  E.state.flags.narrative_m8_owned = true; // come in produzione: gli NPC classici sostituiti da M8 non bloccano tile

  const s = seedState();
  const log = [];
  const approx = [];
  let lastMap = null, lastX = null, lastY = null;

  function recordMap(mapId, tx, ty, note) {
    const e = { kind: 'map', mapId, tx, ty, note: note || '' };
    if (lastMap === null) { e.walkTiles = 0; e.approx = false; }
    else if (lastMap === mapId) {
      const d = bfsDistance(mapId, lastX, lastY, tx, ty);
      if (d === null) { e.walkTiles = Math.abs(tx - lastX) + Math.abs(ty - lastY); e.approx = true; approx.push(`${mapId}(${lastX},${lastY})->(${tx},${ty}): Manhattan (BFS senza percorso)`); }
      else { e.walkTiles = d; e.approx = false; }
    } else {
      e.walkTiles = Math.abs(tx - lastX) + Math.abs(ty - lastY); e.approx = true;
      approx.push(`${lastMap}(${lastX},${lastY}) -> ${mapId}(${tx},${ty}): Manhattan (cambio mappa)`);
    }
    log.push(e); lastMap = mapId; lastX = tx; lastY = ty;
  }
  function load(mapId, tx, ty, dir, note) { E.loadMap(mapId, tx, ty, dir); recordMap(mapId, tx, ty, note); }
  function crossDoor(target, dir) {
    const from = lastMap;
    const door = findDoorTile(from, target, lastX, lastY);
    load(from, door.x, door.y, dir || 'down', `porta verso ${target}`);
    load(door.def.to, door.def.tx, door.def.ty, door.def.dir, `arrivo da ${from}`);
  }
  function narr(label, id, beat, prePages, choiceNode, feedbackPages) {
    const nChoices = choiceNode ? (nodeOf(choiceNode).choices || []).length : 0;
    log.push({ kind: 'narrativo', label, id, beat, mapId: lastMap, prePages, feedbackPages: feedbackPages || [],
      pages: prePages.length + (feedbackPages || []).length, chars: chars(prePages) + chars(feedbackPages || []), choices: nChoices, choiceNode: choiceNode || null });
  }

  // partenza: davanti a Truman, dove M6 B9 lascia Cooper
  const t0 = approachNpcTile('sheriff', 'truman', [11, 4]);
  load('sheriff', t0.x, t0.y, 'left', 'partenza (fine Atto 3, m6_atto4_bridge)');

  // A — diner: la promessa
  crossDoor('sheriffs_station_exterior', 'down');
  crossDoor('town', 'down');
  crossDoor('double_r_exterior_prototype', 'up');
  crossDoor('diner', 'up');
  const maddyTile = approachEntityTile('diner', 'maddy');
  load('diner', maddyTile.x, maddyTile.y, 'up', 'Maddy (NARRATIVE_ENTITIES)');
  const walkBeforeFirstChoice = log.filter((b) => b.kind === 'map').reduce((a, b) => a + b.walkTiles, 0);
  const dinerPre = doNode(s, 'm8_diner');
  const dinerFb = doChoice(s, 'm8_diner', 'promise_' + promise);
  narr(`Diner: la promessa a Maddy (A, ${promise})`, `m8_diner + promise_${promise}`, 'A', dinerPre, 'm8_diner', dinerFb);
  const readingBeforeFirstChoice = chars(dinerPre) / CHARS_PER_SEC + dinerPre.length * SEC_PER_PAGE_INPUT;

  // B0 — Leland al bancone
  const lelandTile = approachEntityTile('diner', 'leland');
  load('diner', lelandTile.x, lelandTile.y, 'up', 'Leland (NARRATIVE_ENTITIES)');
  narr('Diner: Leland e il taxi (B0)', 'm8_leland_taxi', 'B0', doNode(s, 'm8_leland_taxi'));

  // B — Roadhouse (pass 01, split B1: si CAMMINA dal tavolo di Truman al
  // telefono, nessun `next` fra i due nodi)
  crossDoor('double_r_exterior_prototype', 'down');
  crossDoor('town', 'down');
  crossDoor('roadhouse', 'up');
  const trumanTile = approachEntityTile('roadhouse', 'truman');
  load('roadhouse', trumanTile.x, trumanTile.y, 'up', 'Truman al tavolo (NARRATIVE_ENTITIES)');
  narr('Roadhouse: il Gigante, al tavolo (B)', 'm8_roadhouse_truman', 'B', doNode(s, 'm8_roadhouse_truman'));
  const phone = approachWorldTarget('roadhouse', 'roadhouse_phone');
  load('roadhouse', phone.x, phone.y, 'up', 'telefono (WORLD_TARGETS)');
  const rhPre = doNode(s, 'm8_roadhouse_phone');
  const rhFb = doChoice(s, 'm8_roadhouse_phone', 'warning_' + warning);
  narr(`Roadhouse: la telefonata (B, ${warning})`, `m8_roadhouse_phone + warning_${warning}`, 'B', rhPre, 'm8_roadhouse_phone', rhFb);

  // C — crocevia
  crossDoor('town', 'down');
  const cross = approachWorldTarget('town', 'town_crossroads');
  load('town', cross.x, cross.y, 'up', 'crocevia (WORLD_TARGETS)');
  const fcPre = doNode(s, 'm8_focus_choice');
  const fcFb = doChoice(s, 'm8_focus_choice', 'focus_' + focus);
  narr(`Crocevia: dove vai? (C, ${focus})`, `m8_focus_choice + focus_${focus}`, 'C', fcPre, 'm8_focus_choice', fcFb);

  // C — destinazione scelta (si CAMMINA, nessun goto)
  if (focus === 'palmer') {
    crossDoor('palmer', 'up');
    const pe = approachWorldTarget('palmer', 'palmer_entrance');
    load('palmer', pe.x, pe.y, 'up', 'ingresso Palmer (WORLD_TARGETS)');
    narr('Casa Palmer: la chiamata della centrale (C)', 'm8_route_palmer', 'C', doNode(s, 'm8_route_palmer'));
    crossDoor('town', 'down');
  } else if (focus === 'diner') {
    crossDoor('double_r_exterior_prototype', 'up');
    crossDoor('diner', 'up');
    const nt = approachNpcTile('diner', 'norma', [5, 3]);
    load('diner', nt.x, nt.y, 'up', 'Norma (NPC classico)');
    narr('Diner: Norma (C)', 'm8_route_diner', 'C', doNode(s, 'm8_route_diner'));
    crossDoor('double_r_exterior_prototype', 'down');
    crossDoor('town', 'down');
  }
  const lake = approachWorldTarget('town', 'lago_maddy');
  load('town', lake.x, lake.y, 'down', 'riva del lago (WORLD_TARGETS)');
  if (focus === 'lago') narr('Lago: Cooper arriva per primo (C)', 'm8_route_lake', 'C', doNode(s, 'm8_route_lake'));

  // D — ritrovamento + eco (next: nessun goto dal runtime, si prepara il nodo seguente)
  narr('Il ritrovamento (D)', 'm8_discovery', 'D', doNode(s, 'm8_discovery'));
  narr('L\'eco della promessa (D)', 'm8_promise_echo', 'D', doNode(s, 'm8_promise_echo'));
  if (!s.flags.maddy_trovata) throw new Error('atteso maddy_trovata');

  // E — taccuino (canale notebook: nessun cammino)
  narr('Taccuino: confronto lettere R<->O (E)', 'm8_cmp_letters', 'E', doNode(s, 'm8_cmp_letters'));
  const cdPre = doNode(s, 'm8_cmp_diary');
  const cdFb = doChoice(s, 'm8_cmp_diary', 'diary_a');
  narr('Taccuino: confronto lettere <-> diario, P8 (E)', 'm8_cmp_diary + diary_a', 'E', cdPre, 'm8_cmp_diary', cdFb);
  if (NR.peekProp(s, 'P8').formulation.status !== 'formulated') throw new Error('attesa P8 formulata');

  // F — centrale
  crossDoor('sheriffs_station_exterior', 'up');
  crossDoor('sheriff', 'up');
  const t1 = approachNpcTile('sheriff', 'truman', [11, 4]);
  load('sheriff', t1.x, t1.y, 'left', 'Truman');
  narr('Centrale, prima dell\'alba (F)', 'm8_station', 'F', doNode(s, 'm8_station'));
  if (!s.nodes_done.m8_station) throw new Error('attesa completion M8 (node_done m8_station)');

  return { log, approx, walkBeforeFirstChoice, readingBeforeFirstChoice, state: s };
}

/* ---------------- aggregati ------------------------------------------- */
const fmt = (n, d = 1) => Number(n).toFixed(d);
const sumWalk = (log) => log.filter((b) => b.kind === 'map').reduce((a, b) => a + b.walkTiles, 0);
function sumContent(log) { const c = log.filter((b) => b.kind !== 'map'); return { pages: c.reduce((a, b) => a + b.pages, 0), chars: c.reduce((a, b) => a + b.chars, 0), choices: c.reduce((a, b) => a + b.choices, 0) }; }
const readSec = (ch, pg, cps) => ch / cps + pg * SEC_PER_PAGE_INPUT;
function totalSec(log, cps) { const c = sumContent(log); return sumWalk(log) / TILES_PER_SEC + readSec(c.chars, c.pages, cps); }

const PROMISES = ['accompagno', 'autonomia', 'prudenza'];
const WARNINGS = ['palmer', 'centrale', 'nessuno'];
const FOCUSES = ['palmer', 'lago', 'diner'];
const CANON = { promise: 'accompagno', warning: 'palmer', focus: 'palmer' };

const variants = [];
let canonical = null;
PROMISES.forEach((p) => WARNINGS.forEach((w) => FOCUSES.forEach((f) => {
  const r = runRequiredPath(p, w, f);
  const v = { promise: p, warning: w, focus: f, log: r.log, r };
  variants.push(v);
  if (p === CANON.promise && w === CANON.warning && f === CANON.focus) canonical = v;
})));
const beats = canonical.log;
const t12 = variants.map((v) => totalSec(v.log, CHARS_PER_SEC));
const t15 = variants.map((v) => totalSec(v.log, CHARS_PER_SEC_FAST));

// beat compressi: ogni beat narrativo con il cammino accumulato dai beat mappa precedenti
const rows = [];
let pendingWalk = 0, pendingApprox = false, pendingVia = [];
beats.forEach((b) => {
  if (b.kind === 'map') { pendingWalk += b.walkTiles; pendingApprox = pendingApprox || b.approx; if (b.note.startsWith('arrivo')) pendingVia.push(b.mapId); return; }
  rows.push({ b, walk: pendingWalk, approx: pendingApprox, via: pendingVia.slice() });
  pendingWalk = 0; pendingApprox = false; pendingVia = [];
});

// blocco passivo piu' lungo: pagine consecutive senza scelta e senza cambio mappa
let longestPassive = { pages: 0, chars: 0, ids: [] }, cur = { pages: 0, chars: 0, ids: [] };
const flush = () => { if (cur.pages > longestPassive.pages) longestPassive = cur; cur = { pages: 0, chars: 0, ids: [] }; };
beats.forEach((b) => {
  if (b.kind === 'map') { if (b.walkTiles > 0) flush(); return; }
  cur.pages += b.prePages.length; cur.chars += chars(b.prePages); cur.ids.push(b.id.split(' ')[0]);
  if (b.choices > 0) { flush(); cur.pages += b.feedbackPages.length; cur.chars += chars(b.feedbackPages); cur.ids.push('feedback:' + b.id.split(' ')[0]); }
});
flush();

// tratto a piedi ininterrotto piu' lungo (somma dei beat mappa fra due beat narrativi)
const longestWalk = rows.reduce((best, r) => (r.walk > (best ? best.walk : -1) ? r : best), null);

// modi pagina sul percorso canonico
const modes = { action: 0, dialogue: 0, notebook: 0, other: 0 };
let actionInChoiceNodes = 0;
rows.forEach((r) => { modeCounts(r.b.prePages, modes); modeCounts(r.b.feedbackPages, modes); if (r.b.choices) actionInChoiceNodes += r.b.prePages.filter((p) => p.mode === 'action').length; });

// contenuto NON obbligatorio: M8 non ha nodi opzionali; le alternative sono i due
// route node non scelti (mutuamente esclusivi) e le righe `repeat`. Il layer
// classico gated su atto4 (js/glue.js) e' elencato con le sole pagine (nessun cammino).
const altRoutes = FOCUSES.filter((f) => f !== CANON.focus).map((f) => { const n = nodeOf(ROUTE_NODE[f]); return { id: n.id, pages: n.pages.length, chars: chars(n.pages) }; });
const repeats = M8.nodes.filter((n) => n.repeat).map((n) => ({ id: n.id, chars: n.repeat.text.length }));
const classicA4 = ['maddy_a4', 'sarah_visione', 'leland_a4', 'gerard_a4', 'loglady_a4'].map((id) => { const d = GAME.Data.dialogues[id]; return { id, present: !!d, pages: d ? d.pages.length : 0, chars: d ? chars(d.pages) : 0 }; });
const optPages = classicA4.reduce((a, d) => a + d.pages, 0), optChars = classicA4.reduce((a, d) => a + d.chars, 0);

const cc = sumContent(beats), cw = sumWalk(beats);
const canon12 = totalSec(beats, CHARS_PER_SEC), canon15 = totalSec(beats, CHARS_PER_SEC_FAST);

/* ---------------- report ------------------------------------------------ */
let md = '';
md += '# Pacing Atto 4 (M8) — stato attuale\n\n';
md += 'Misurato headless con `node test/probe-act4-pacing.js` (metodo di `test/probe-act3-pacing.js`), da Cooper davanti a Truman alla centrale ' +
  'subito dopo `m6_atto4_bridge` (M6 B9, `flags.atto4`) fino a `node_done: m8_station` (completion di M8). Stato narrativo seminato come ' +
  '`test/m8-engine-harness.html::seedBase()` (atto4 + E3_LETTERA_R + E1_DIARIO), senza rigiocare M4/M5/M6.\n\n';
md += `Velocita': ${fmt(MS_PER_TILE, 2)} ms/tile (${fmt(TILES_PER_SEC, 3)} tile/s). Lettura: ${CHARS_PER_SEC}/${CHARS_PER_SEC_FAST} car/s + ${SEC_PER_PAGE_INPUT}s/pagina.\n\n`;

md += '## Riepilogo\n\n| Metrica | Valore |\n|---|---|\n';
md += `| Percorso obbligato canonico (${CANON.promise}/${CANON.warning}/${CANON.focus}) | ${cw} tile (${fmt(cw / TILES_PER_SEC)}s), ${cc.pages} pagine, ${cc.chars} car, ${cc.choices} opzioni su 4 scelte -> **${fmt(canon12)}s (~${fmt(canon12 / 60, 2)} min) @12cps / ${fmt(canon15)}s (~${fmt(canon15 / 60, 2)} min) @15cps** |\n`;
md += `| Range percorso obbligato, 27 varianti (promessa x avviso x destinazione) | ${fmt(Math.min(...t12))}-${fmt(Math.max(...t12))}s (~${fmt(Math.min(...t12) / 60, 2)}-${fmt(Math.max(...t12) / 60, 2)} min) @12cps; ${fmt(Math.min(...t15))}-${fmt(Math.max(...t15))}s @15cps |\n`;
md += `| Obbligato + tutto l'opzionale (solo layer classico atto4, sola lettura) | ${fmt(canon12 + readSec(optChars, optPages, CHARS_PER_SEC))}s (~${fmt((canon12 + readSec(optChars, optPages, CHARS_PER_SEC)) / 60, 2)} min) @12cps; cammino opzionale NON modellato |\n`;
md += `| Tempo prima della prima scelta significativa (promise_stance) | ${canonical.r.walkBeforeFirstChoice} tile (${fmt(canonical.r.walkBeforeFirstChoice / TILES_PER_SEC)}s) + ${fmt(canonical.r.readingBeforeFirstChoice)}s di lettura = **${fmt(canonical.r.walkBeforeFirstChoice / TILES_PER_SEC + canonical.r.readingBeforeFirstChoice)}s** |\n`;
md += `| Blocco passivo piu' lungo (pagine senza scelta ne' cambio mappa) | ${longestPassive.pages} pagine, ${longestPassive.chars} car (~${fmt(readSec(longestPassive.chars, longestPassive.pages, CHARS_PER_SEC))}s): ${longestPassive.ids.join(' + ')} |\n`;
md += `| Tratto a piedi ininterrotto piu' lungo | ${longestWalk.walk} tile (${fmt(longestWalk.walk / TILES_PER_SEC)}s) verso "${longestWalk.b.label}" via ${longestWalk.via.join(' > ')} |\n`;
md += `| Pagine per modo (canonico, feedback inclusi) | action ${modes.action} (di cui ${actionInChoiceNodes} dentro nodi a scelta, prima della scelta) / dialogue ${modes.dialogue} / notebook ${modes.notebook}${modes.other ? ' / altro ' + modes.other : ''} |\n`;
md += `| Nodi M8 attraversati / totali | ${rows.length} / ${M8.nodes.length} (i 2 route node non scelti sono alternative esclusive; nessun nodo opzionale in M8) |\n\n`;

md += `## Beat per beat (canonico: promessa ${CANON.promise}, avviso ${CANON.warning}, destinazione ${CANON.focus})\n\n`;
md += '| # | Beat | Mappa | Nodo | Cammino dal beat prec. | Sec. cammino | Pagine | Car | Sec. lettura (12cps) | Opzioni |\n|---|---|---|---|---:|---:|---:|---:|---:|---:|\n';
rows.forEach((r, i) => {
  const b = r.b;
  md += `| ${i + 1} | ${b.beat} | ${b.mapId} | ${b.label} (\`${b.id}\`) | ${r.walk}${r.approx ? ' ~' : ''}${r.via.length ? ' via ' + r.via.join('>') : ''} | ${fmt(r.walk / TILES_PER_SEC, 2)} | ${b.pages} | ${b.chars} | ${fmt(readSec(b.chars, b.pages, CHARS_PER_SEC), 2)} | ${b.choices || ''} |\n`;
});
md += '\n"~" = include tratti Manhattan (cambio mappa). I beat E sono a canale taccuino: nessun cammino.\n\n';

md += `## Range per avviso x destinazione (promessa ${CANON.promise}; le altre promesse spostano il totale di pochi caratteri)\n\n`;
md += '| Avviso | Destinazione | Tile | Pagine | Car | 12cps | 15cps |\n|---|---|---:|---:|---:|---:|---:|\n';
variants.filter((v) => v.promise === CANON.promise).forEach((v) => {
  const c = sumContent(v.log), a = totalSec(v.log, CHARS_PER_SEC), b = totalSec(v.log, CHARS_PER_SEC_FAST);
  md += `| ${v.warning} | ${v.focus} | ${sumWalk(v.log)} | ${c.pages} | ${c.chars} | ${fmt(a)}s (~${fmt(a / 60, 2)} min) | ${fmt(b)}s |\n`;
});
const byPromise = PROMISES.map((p) => { const ts = variants.filter((v) => v.promise === p).map((v) => totalSec(v.log, CHARS_PER_SEC)); return `${p} ${fmt(Math.min(...ts))}-${fmt(Math.max(...ts))}s`; });
md += `\nPer promessa (12cps): ${byPromise.join('; ')}.\n\n`;

md += '## Contenuto non obbligatorio (misurato a parte)\n\n';
md += `- M8 non ha nodi opzionali. Route node alternativi (non scelti nel canonico): ${altRoutes.map((a) => `\`${a.id}\` ${a.pages} pag/${a.chars} car`).join(', ')}.\n`;
md += `- Righe \`repeat\` (guardie, 1 pagina se si ri-interagisce): ${repeats.map((r) => `\`${r.id}\` ${r.chars} car`).join(', ')}.\n`;
md += `- Layer classico gated su \`flag:atto4\` (js/glue.js, fuori M8, facoltativo): ${classicA4.map((d) => `\`${d.id}\` ${d.present ? d.pages + ' pag/' + d.chars + ' car' : 'ASSENTE'}`).join(', ')} -> ${optPages} pagine, ${optChars} car, ${fmt(readSec(optChars, optPages, CHARS_PER_SEC))}s di sola lettura; il cammino (Palmer/diner/hotel) non e' modellato.\n\n`;

md += '## Passi non misurabili / approssimati\n\n';
md += '- `m8_discovery` -> `m8_promise_echo`: `next` dichiarativo, il runtime non restituisce goto al commit; qui preparato come nodo consecutivo senza cammino (stesso schema del harness M8). Il passaggio scenico in produzione (fade, sync adapter) non e\' misurato.\n';
md += '- I beat E (`m8_cmp_letters`, `m8_cmp_diary`) sono a canale taccuino: l\'apertura del taccuino e la navigazione fra sezioni non hanno costo modellato (solo pagine).\n';
const crossMapTiles = beats.filter((b) => b.kind === 'map' && b.note.startsWith('arrivo')).reduce((a, b) => a + b.walkTiles, 0);
md += `- Cambio mappa = Manhattan fra la porta di uscita e lo spawn di arrivo (coordinate di mappe diverse, metodo del riferimento): ${beats.filter((b) => b.kind === 'map' && b.note.startsWith('arrivo')).length} tratti nel canonico per ${crossMapTiles} tile (${fmt(crossMapTiles / TILES_PER_SEC)}s) su ${cw}; e' un artefatto sistematico (es. roadhouse(7,9)->town(47,29) = 60 tile), da leggere come limite superiore. Nessun BFS intra-mappa e' fallito.\n`;
md += '- Le pagine con `condition` (es. valigia a Palmer, `p_valigia` alla centrale) sono conteggiate solo nelle varianti in cui il runtime le include.\n';
md += '- Attesa della banda al Roadhouse, transizioni notte/alba e cutscene grafiche: nessuna e\' rappresentata come pagina in M8, quindi non misurata.\n';
md += '- Lettura: stima lineare caratteri/velocita\' + costante per pagina; non modella riletture, esitazioni o skip.\n';

const outDir = path.join(__dirname, '..', 'artifacts', 'act-4-design');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'pacing-current.md');
fs.writeFileSync(outPath, md);
console.log(md);
console.log(`\nReport scritto in ${outPath} (${md.split('\n').length} righe)`);
