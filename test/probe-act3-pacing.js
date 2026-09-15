/* probe-act3-pacing.js — diagnostica, NON tocca file di produzione.
 * Modellato su test/probe-act2-pacing.js (stessa impalcatura: stub browser,
 * BFS a piedi sulla griglia calpestabile, approssimazione Manhattan sui cambi
 * mappa, velocita' di lettura 12/15 cps + 0.6s/pagina), applicato all'Atto 3
 * (M5 "Il vagone" + M6 "One Eyed Jacks"), che parte DIRETTAMENTE da Cooper
 * alla centrale dello sceriffo con atto3 gia' impostato (non ri-simula
 * l'Atto 1/2: la catena M4 fino a present_truman_m4+P2 viene rigiocata in
 * silenzio, FUORI dal log dei beat, solo per portare lo stato narrativo al
 * punto in cui l'Atto 2 lascia Cooper — stesso schema dichiarato del
 * riferimento per l'Atto 1).
 *
 * Il testo live dell'Atto 3 arriva DA DUE SISTEMI, come nell'Atto 2:
 *  (1) il runtime narrativo (M5.json + M6.json via js/narrative-data.gen.js),
 *      misurato chiamando direttamente prepareNode/commitNode/prepareChoice/
 *      commitChoice — mai attraverso la dialogue box classica;
 *  (2) UNA scena classica (js/data.js, risolta da E.resolveDialogue): lo
 *      specchio di room_315 dopo la morte di Jacques (gigante1_dlg), che
 *      resta nel gioco classico per design (invariato dall'Atto 3). Il ponte
 *      fra i due stati (m6State.flags.jacques_dead -> S().flags.jacques_morto
 *      -> gigante1_dlg -> S().flags.gigante1 -> m6State.flags.gigante1) e'
 *      manuale, a specchio dello stesso pattern di js/narrative-production.js
 *      (syncNarrativeToClassic/syncClassicToNarrative), perche' qui non si
 *      abilita l'adapter completo (A.enable), solo le API dirette del runtime.
 *
 * Le coordinate di mappa/porta/target NON sono prese per buone dalla
 * descrizione del task: ogni porta viene scoperta a runtime interrogando
 * GAME.Maps[mapId].doors e ogni target ambientale e' preso da WORLD_TARGETS
 * in js/narrative-engine-adapter.js (fonte unica delle coordinate secondo il
 * commento del file stesso), poi validato con isWalkableTile prima di essere
 * usato come tile di arrivo.
 *
 * Esegui con: node test/probe-act3-pacing.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------------- stub ambiente browser (come probe-act2-pacing.js) ---- */

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

// Named bodies come from Cast Presence since b529711 (glue.js NPCS is empty): sync them through the adapter, as test/smoke.js does.
['narrative-runtime.js', 'narrative-data.gen.js', 'cast-presence.js', 'narrative-bootstrap.js', 'narrative-engine-adapter.js'].forEach((f) => require(J(f)));
function syncCast(flags) {
  const G2 = global.GAME, D = G2.NarrativeData, NS = G2.NarrativeRuntime.createState();
  Object.assign(NS.flags, flags || {});
  G2.NarrativeAdapter.enable({ mission: D.missions.M4, missions: [D.missions.M4, D.missions.M5, D.missions.M6, D.missions.M8, D.missions.M9], state: NS, container: {} });
  G2.NarrativeAdapter.disable();
}
global.GAME.installNarrativeCatalogs({ data: global.GAME.NarrativeData, runtime: global.GAME.NarrativeRuntime });
syncCast();

require(J('narrative-engine-adapter.js')); // WORLD_TARGETS (A._debugWorldTargets); abilitato solo dentro syncCast() per piazzare i corpi Cast Presence
const NR = GAME.NarrativeRuntime;
const M4 = GAME.NarrativeData.missions.M4;
const M5 = GAME.NarrativeData.missions.M5;
const M6 = GAME.NarrativeData.missions.M6;
const A = GAME.NarrativeAdapter;
if (!A) throw new Error('GAME.NarrativeAdapter non esposto da js/narrative-engine-adapter.js');
// WORLD_TARGETS e' popolato solo da A.enable(); qui lo leggiamo forzando un enable/disable
// minimale su uno stato usa-e-getta, SOLO per estrarre le coordinate (nessuna sincronizzazione
// resta attiva sul run reale sotto).
(function extractWorldTargets() {
  const scratch = NR.createState();
  A.enable({ mission: M5, missions: [M4, M5, M6], state: scratch });
  A.disable && A.disable();
})();
const WORLD_TARGETS = A._debugWorldTargets;
if (!WORLD_TARGETS || !WORLD_TARGETS.traincar || !WORLD_TARGETS.hospital) {
  throw new Error('WORLD_TARGETS.traincar/hospital mancanti dopo enable/disable dell\'adapter');
}

// enum dei value domains (m5_initial_theory, m6_tactic, ecc.): senza questo,
// value_is/value_set falliscono silenziosamente su nomi sconosciuti.
(function installValueDomains() {
  const enumsPath = path.join(__dirname, '..', 'narrative', 'state-enums.json');
  if (!fs.existsSync(enumsPath)) return;
  const enums = JSON.parse(fs.readFileSync(enumsPath, 'utf8'));
  const domains = {};
  Object.keys(enums.values_allowed || {}).forEach((name) => {
    domains[name] = enums.enums[enums.values_allowed[name]];
  });
  NR.setValueDomains(domains);
})();

/* ---------------- helper input (identico a smoke.js) ---------------- */

function key(code) {
  handlers.keydown({ code, preventDefault() {}, repeat: false });
  handlers.keyup({ code });
}
function pump(ms) {
  for (let i = 0; i < Math.ceil(ms / 16); i++) {
    tnow += 16;
    const cbs = rafQueue.splice(0);
    cbs.forEach((cb) => cb(tnow));
  }
}

/* ---------------- velocita' reale del giocatore (identico al riferimento) */
const TILE_PX = 16;
const SPEED = 0.075;
const MS_PER_TILE = TILE_PX / SPEED; // 213.33 ms/tile
const TILES_PER_SEC = 1000 / MS_PER_TILE;

/* ---------------- velocita' di lettura (identico al riferimento) ------- */
const CHARS_PER_SEC = 12;
const CHARS_PER_SEC_FAST = 15;
const SEC_PER_PAGE_INPUT = 0.6;

/* ---------------- BFS a piedi (identico al riferimento) ---------------- */
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
  for (let i = 0; i < map.npcs.length; i++) {
    const n = map.npcs[i];
    if (n.x === x && n.y === y && E.npcActive(n, st)) return true;
  }
  if (GAME.Maps.objectAt(mapId, x, y)) return true;
  return false;
}
function bfsDistance(mapId, x0, y0, x1, y1) {
  if (x0 === x1 && y0 === y1) return 0;
  const seen = new Set([x0 + ',' + y0]);
  let queue = [{ x: x0, y: y0, d: 0 }];
  const deltas = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  let qi = 0;
  while (qi < queue.length) {
    const cur = queue[qi++];
    for (const d of deltas) {
      const nx = cur.x + d[0], ny = cur.y + d[1];
      const k = nx + ',' + ny;
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

/* ---------------- scoperta coordinate a runtime (identico al riferimento) */
function isWalkableTile(mapId, x, y) {
  const map = GAME.Maps[mapId];
  if (!map || x < 0 || y < 0 || y >= map.rows.length || x >= map.rows[0].length) return false;
  return !GAME.Maps.isSolid(mapId, x, y, { clues: [] });
}
function findApproachTile(mapId, nx, ny, preferred) {
  if (preferred && isWalkableTile(mapId, preferred[0], preferred[1])) return { x: preferred[0], y: preferred[1] };
  const deltas = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dx, dy] of deltas) {
    const x = nx + dx, y = ny + dy;
    if (isWalkableTile(mapId, x, y)) return { x, y };
  }
  throw new Error(`nessuna tile calpestabile adiacente a ${mapId} (${nx},${ny})`);
}
function approachNpcTile(mapId, npcId, preferred) {
  const npc = GAME.Maps[mapId].npcs.find((n) => n.id === npcId);
  if (!npc) throw new Error(`npc "${npcId}" non trovato su ${mapId}`);
  return findApproachTile(mapId, npc.x, npc.y, preferred);
}
// target ambientale WORLD_TARGETS[mapId][targetId]: validato con isWalkableTile,
// fallback su una tile calpestabile adiacente se la coordinata registrata e'
// essa stessa solida (landmark/oggetto spesso occupano una tile bloccata).
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

/* ---------------- log strutturato (identico al riferimento) ------------ */

const beats = [];
let lastMap = null, lastX = null, lastY = null;
const approxNotes = [];
const notesGeneral = [];
const optionalBeats = [];
const unreachableOptional = [];

function recordMapChange(mapId, tx, ty, note) {
  const entry = { kind: 'map', mapId, tx, ty };
  if (note) entry.note = note;
  if (lastMap === null) {
    entry.walkTiles = 0;
    entry.approx = false;
  } else if (lastMap === mapId) {
    const d = bfsDistance(mapId, lastX, lastY, tx, ty);
    if (d === null) {
      entry.walkTiles = Math.abs(tx - lastX) + Math.abs(ty - lastY);
      entry.approx = true;
      approxNotes.push(`${mapId} (${lastX},${lastY})->(${tx},${ty}): BFS non ha trovato un percorso, uso Manhattan`);
    } else {
      entry.walkTiles = d;
      entry.approx = false;
    }
  } else {
    entry.walkTiles = Math.abs(tx - lastX) + Math.abs(ty - lastY);
    entry.approx = true;
    approxNotes.push(`${lastMap}(${lastX},${lastY}) -> ${mapId}(${tx},${ty}): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato`);
  }
  beats.push(entry);
  lastMap = mapId; lastX = tx; lastY = ty;
}
function loadMapAndLog(mapId, tx, ty, dir, note) {
  E.loadMap(mapId, tx, ty, dir);
  recordMapChange(mapId, tx, ty, note);
}
function crossDoor(targetMapId, doorDir) {
  const fromMap = lastMap;
  const door = findDoorTile(fromMap, targetMapId, lastX, lastY);
  loadMapAndLog(fromMap, door.x, door.y, doorDir || 'down', `porta verso ${targetMapId}`);
  loadMapAndLog(door.def.to, door.def.tx, door.def.ty, door.def.dir, `arrivo da ${fromMap}`);
  return door;
}

function dialoguePagesInfo(id) {
  const def = GAME.Data.dialogues[id];
  if (!def) return { pages: 0, chars: 0 };
  const pages = def.pages || [];
  const chars = pages.reduce((sum, p) => sum + (p.text ? p.text.length : 0), 0);
  return { pages: pages.length, chars };
}
function recordDialogue(label, id) {
  const info = dialoguePagesInfo(id);
  beats.push({ kind: 'dialogue', label, id, system: 'classico', pages: info.pages, chars: info.chars });
}
function recordNarrative(label, id, mission, pagesArr) {
  const chars = pagesArr.reduce((s, p) => s + (p && p.text ? p.text.length : 0), 0);
  beats.push({ kind: 'narrativo', label, id, system: `narrativo(${mission})`, pages: pagesArr.length, chars });
}
function drainDialogueAndLog(label) {
  const d = S().dialogue;
  if (!d) throw new Error(`${label}: nessun dialogo attivo da avanzare`);
  const id = d.id;
  recordDialogue(label, id);
  let presses = 0;
  while (S().dialogue) {
    key('Enter');
    pump(16);
    presses++;
    if (presses > 64) throw new Error(`${label}: dialogo "${id}" non si chiude entro 64 Invio`);
  }
}

/* ==================== runtime narrativo M5/M6: helper (mirror di test/act-3-flow.js) */

function doNode(s, mission, id) {
  const p = NR.prepareNode(s, mission, id);
  if (!p.ok) throw new Error(`prepareNode(${mission.mission}.${id}) fallita: ${p.error}`);
  const c = NR.commitNode(s, mission, p);
  if (!c.ok) throw new Error(`commitNode(${mission.mission}.${id}) fallita`);
  return { pages: p.pages || [], repeated: !!c.repeated, goto: c.goto || null };
}
function doChoice(s, mission, atId, choiceId) {
  const node = mission.nodes.find((n) => n.id === atId);
  if (!node) throw new Error(`nodo "${atId}" non trovato in ${mission.mission}`);
  const p = NR.prepareChoice(s, mission, node, choiceId);
  if (!p.ok) throw new Error(`prepareChoice(${atId}.${choiceId}) fallita: ${p.error}`);
  const c = NR.commitChoice(s, mission, node, p);
  if (!c.ok) throw new Error(`commitChoice(${atId}.${choiceId}) fallita`);
  let gotoPages = [];
  if (c.goto) { const r = doNode(s, mission, c.goto); gotoPages = r.pages; }
  return { feedbackPages: p.feedback_pages || [], gotoPages, goto: c.goto || null };
}
function doCmp(s, mission, atId, choiceId) {
  // stesso meccanismo di doChoice, ma per nodi "comparison" (kind: 'comparison'):
  // prepareChoice/commitChoice funzionano identicamente sui loro choices[].
  return doChoice(s, mission, atId, choiceId);
}

/* ==================== stato di partenza: catena Atto1->2->3 silenziosa ===
 * Riproduce ESATTAMENTE m5Base() di test/act-3-flow.js (prova gia' passante):
 * porta m5State fino al punto in cui M5 puo' entrare (flags.atto3 + P2
 * accettata da Truman). Nessuna di queste pagine viene loggata come beat
 * dell'Atto 3: sono l'Atto 2, gia' misurato da probe-act2-pacing.js. */
function buildM5State() {
  const s = NR.createState();
  s.flags.sogno_fatto = true;
  doNode(s, M4, 'truman_a2');
  doNode(s, M4, 'james_a2');
  doNode(s, M4, 'ronette_q'); doChoice(s, M4, 'ronette_q', 'q_uomo');
  doNode(s, M4, 'cmp_e6a_tjames'); doChoice(s, M4, 'cmp_e6a_tjames', 'b8_a');
  const presN = M4.nodes.find((n) => n.id === 'present_truman_m4');
  const pp = NR.preparePresentation(s, M4, presN, 'P2');
  if (!pp.ok) throw new Error('preparePresentation(P2) fallita: ' + pp.error);
  const pc = NR.commitPresentation(s, M4, presN, pp);
  if (!pc.ok) throw new Error('commitPresentation(P2) fallita: ' + pc.error);
  if (!s.flags.atto3) throw new Error('atteso flags.atto3 dopo la catena M4 silenziosa');
  return s;
}

/* ==================== PERCORSO ATTO 3 (M5 + M6) =========================
 * Parte da Cooper alla centrale (Atto 2 chiuso). Ogni tratto: crossDoor()
 * scopre la porta reale a runtime; ogni target ambientale usa
 * approachWorldTarget() (coordinate da WORLD_TARGETS, MAI dal testo del
 * task); ogni NPC usa approachNpcTile(). initialTheory in {'degeneration',
 * 'withheld'} seleziona il ramo A3 (impeto / non-scrivo-ancora), che a sua
 * volta seleziona m5_theory_revision vs m5_theory_first in A10.
 * tactic in {'prova','pressione','falsa_sicurezza'} seleziona il ramo B4-B6.
 * Ritorna { beats, optionalBeats, walkTilesBeforeFirstInteraction,
 * mandatoryObservations, deductions }; NON tocca i moduli beats/optionalBeats
 * globali sopra — il chiamante decide quale run scrivere nel log principale. */
function runRequiredPath(initialTheory, tactic, opts) {
  opts = opts || {};
  // NB: questa funzione e' invocata piu' volte (teorie x tattiche) per la
  // sola MISURA dei tempi; il chiamante decide quale invocazione copiare nel
  // log globale `beats` (quella canonica) per il report beat-per-beat.
  E.init(canvasStub);
  E.start();
  pump(32);
  E.state.mode = 'play';
  lastMap = null; lastX = null; lastY = null;
  // onEnter "prima visita" (js/maps.js: town_arrivo/intro_town su town/piazzale,
  // hotel_risveglio/intro_hotel su room_315): questo run parte gia' all'Atto 3,
  // non ha mai giocato le prime visite classiche a queste mappe. Sopprimerle
  // qui evita di intercettare le interazioni misurate sotto (nessuna di queste
  // e' contenuto dell'Atto 3).
  E.state.flags.intro_town = true;
  E.state.flags.intro_hotel = true;

  const m5State = buildM5State();

  const localLog = [];
  let mapChangeCount = 0;
  const localApproxNotes = [];
  function lRecordMapChange(mapId, tx, ty, note) {
    const entry = { kind: 'map', mapId, tx, ty };
    if (note) entry.note = note;
    if (lastMap === null) { entry.walkTiles = 0; entry.approx = false; }
    else if (lastMap === mapId) {
      const d = bfsDistance(mapId, lastX, lastY, tx, ty);
      if (d === null) { entry.walkTiles = Math.abs(tx - lastX) + Math.abs(ty - lastY); entry.approx = true; localApproxNotes.push(`${mapId}(${lastX},${lastY})->(${tx},${ty}): Manhattan (BFS senza percorso)`); }
      else { entry.walkTiles = d; entry.approx = false; }
    } else {
      entry.walkTiles = Math.abs(tx - lastX) + Math.abs(ty - lastY);
      entry.approx = true;
      localApproxNotes.push(`${lastMap}(${lastX},${lastY}) -> ${mapId}(${tx},${ty}): Manhattan (cambio mappa)`);
    }
    localLog.push(entry);
    lastMap = mapId; lastX = tx; lastY = ty;
  }
  function lLoad(mapId, tx, ty, dir, note) { E.loadMap(mapId, tx, ty, dir); lRecordMapChange(mapId, tx, ty, note); }
  function lCrossDoor(targetMapId, doorDir) {
    const fromMap = lastMap;
    const door = findDoorTile(fromMap, targetMapId, lastX, lastY);
    lLoad(fromMap, door.x, door.y, doorDir || 'down', `porta verso ${targetMapId}`);
    lLoad(door.def.to, door.def.tx, door.def.ty, door.def.dir, `arrivo da ${fromMap}`);
    return door;
  }
  function lNarr(label, id, mission, pagesArr) {
    const chars = pagesArr.reduce((s, p) => s + (p && p.text ? p.text.length : 0), 0);
    localLog.push({ kind: 'narrativo', label, id, system: `narrativo(${mission.mission})`, pages: pagesArr.length, chars });
  }
  function lDialogue(label, id) {
    const info = dialoguePagesInfo(id);
    localLog.push({ kind: 'dialogue', label, id, system: 'classico', pages: info.pages, chars: info.chars });
  }
  function lDrainDialogue(label) {
    const d = S().dialogue;
    if (!d) throw new Error(`${label}: nessun dialogo attivo`);
    const id = d.id;
    lDialogue(label, id);
    let presses = 0;
    while (S().dialogue) { key('Enter'); pump(16); presses++; if (presses > 64) throw new Error(`${label}: "${id}" non chiude entro 64 Invio`); }
  }

  // -- sceriffo: Cooper e' qui alla chiusura dell'Atto 2 --
  const trumanTile = approachNpcTile('sheriff', 'truman', [11, 4]);
  lLoad('sheriff', trumanTile.x, trumanTile.y, 'left');

  // -- sceriffo -> piazzale -> town -> porta est -> traincar --
  lCrossDoor('sheriffs_station_exterior', 'down');
  lCrossDoor('town', 'down');
  lCrossDoor('traincar', 'right');

  const walkTilesBeforeFirstInteraction = localLog.filter((b) => b.kind === 'map').reduce((s, b) => s + b.walkTiles, 0);

  // A2 — ponte
  const bridgeTile = approachWorldTarget('traincar', 'bridge_rail');
  lLoad('traincar', bridgeTile.x, bridgeTile.y, 'down');
  const bridgeN = doNode(m5State, M5, 'm5_bridge');
  lNarr('Ponte: direzione e impronte (M5 A2)', 'm5_bridge', M5, bridgeN.pages);

  // A3 — la porta del vagone, prima lettura
  const entranceTile = approachWorldTarget('traincar', 'traincar_entrance');
  lLoad('traincar', entranceTile.x, entranceTile.y, 'down');
  const discoveryN = doNode(m5State, M5, 'm5_discovery');
  const theoryChoiceId = initialTheory === 'degeneration' ? 'theory_degeneration' : 'theory_withhold';
  const theoryC = doChoice(m5State, M5, 'm5_theory_initial', theoryChoiceId);
  lNarr('Vagone scoperto + prima lettura (M5 A3)', `m5_discovery + m5_theory_initial.${theoryChoiceId}`, M5, discoveryN.pages.concat(theoryC.feedbackPages));
  if (m5State.value_state && m5State.value_state.m5_initial_theory !== initialTheory) {
    // il runtime puo' esporre i valori sotto altro campo; verifica non bloccante qui,
    // la vera verifica di correttezza vive in test/act-3-flow.js.
  }

  // A4 — mucchio
  const moundTile = approachWorldTarget('traincar', 'mound');
  lLoad('traincar', moundTile.x, moundTile.y, 'down');
  const moundN = doNode(m5State, M5, 'm5_mound');
  lNarr('Mucchio: biglietto (M5 A4)', 'm5_mound', M5, moundN.pages);

  // A5 — anello
  const ringTile = approachWorldTarget('traincar', 'ring');
  lLoad('traincar', ringTile.x, ringTile.y, 'down');
  const ringN = doNode(m5State, M5, 'm5_ring');
  lNarr('Anello (M5 A5)', 'm5_ring', M5, ringN.pages);

  // A6 — centro scena
  const centerTile = approachWorldTarget('traincar', 'scene_center');
  lLoad('traincar', centerTile.x, centerTile.y, 'down');
  const sceneN = doNode(m5State, M5, 'm5_scene');
  lNarr('Centro della scena (M5 A6)', 'm5_scene', M5, sceneN.pages);

  // 6 osservazioni obbligatorie, come da docs/act-3-design-report.md §12/§13
  // ("mandatory clue interactions = 6"): A2/A4/A5/A6 (fatti raccolti) +
  // A9 (l'ultima osservazione, il confronto anello-polvere) + A14 (il taglio
  // a nord, il fatto specifico del vagone).
  const mandatoryObservations = ['m5_bridge', 'm5_mound', 'm5_ring', 'm5_scene', 'm5_cmp_ring', 'm5_tracks_north'];
  let optionalWalk = { tiles: 0, note: [] };
  // NB detour opzionali (qui e sotto): usano E.loadMap DIRETTAMENTE, mai lLoad/
  // lRecordMapChange — non devono comparire nel log del percorso obbligato ne'
  // spostare lastMap/lastX/lastY (che restano ancorati all'ultima tile del
  // percorso obbligato, cosi' il prossimo BFS obbligato riparte da li'). La
  // distanza a piedi e' un BFS reale dalla stessa tile, misurata ma non percorsa
  // nel log principale — stesso schema dichiarato della "Scrivania" nel
  // riferimento Atto 2.
  if (opts.includeOptional) {
    // A7 — stufa (opzionale)
    const stoveTile = approachWorldTarget('traincar', 'stove');
    const dStove = bfsDistance('traincar', lastX, lastY, stoveTile.x, stoveTile.y);
    const stoveWalk = dStove === null ? Math.abs(stoveTile.x - lastX) + Math.abs(stoveTile.y - lastY) : dStove;
    E.loadMap('traincar', stoveTile.x, stoveTile.y, 'down');
    const stoveN = doNode(m5State, M5, 'm5_stove');
    optionalPush(opts, { label: 'Stufa (M5 A7, opzionale)', mapId: 'traincar', system: `narrativo(M5)`, id: 'm5_stove', walkTiles: stoveWalk, approx: dStove === null, pages: stoveN.pages.length, chars: stoveN.pages.reduce((s, p) => s + (p.text ? p.text.length : 0), 0) });

    // A8 — carte (opzionale)
    const cardsTile = approachWorldTarget('traincar', 'cards');
    const dCards = bfsDistance('traincar', lastX, lastY, cardsTile.x, cardsTile.y);
    const cardsWalk = dCards === null ? Math.abs(cardsTile.x - lastX) + Math.abs(cardsTile.y - lastY) : dCards;
    E.loadMap('traincar', cardsTile.x, cardsTile.y, 'down');
    const cardsN = doNode(m5State, M5, 'm5_cards');
    optionalPush(opts, { label: 'Carte (M5 A8, opzionale)', mapId: 'traincar', system: `narrativo(M5)`, id: 'm5_cards', walkTiles: cardsWalk, approx: dCards === null, pages: cardsN.pages.length, chars: cardsN.pages.reduce((s, p) => s + (p.text ? p.text.length : 0), 0) });

    // A11 — confronto biglietto/verso (opzionale, richiede E5_POESIA: NON
    // presente in questo stato ricostruito senza rigiocare l'Atto 2 opzionale
    // "Letto (room 315)" — segnalato come non raggiungibile in questo run).
    if (m5State.evidence.E5_POESIA) {
      const cmpN = doNode(m5State, M5, 'm5_cmp_ticket_e5');
      optionalPush(opts, { label: 'Confronto biglietto <-> verso (M5 A11, opzionale)', mapId: 'traincar', system: `narrativo(M5)`, id: 'm5_cmp_ticket_e5', walkTiles: 0, approx: false, pages: cmpN.pages.length, chars: cmpN.pages.reduce((s, p) => s + (p.text ? p.text.length : 0), 0) });
    } else {
      unreachableOptionalPush(opts, 'Confronto biglietto <-> verso (M5 A11): richiede E5_POESIA (Atto 2 opzionale "Letto, room 315"), non presente in questo run che non rigioca il contenuto opzionale dell\'Atto 2.');
    }
  }

  // A9 — confronto anello (mandatorio, l'ultima osservazione)
  const cmpN = doNode(m5State, M5, 'm5_cmp_ring');
  const cmpC = doChoice(m5State, M5, 'm5_cmp_ring', 'ring_a');
  lNarr('Confronto: la polvere intorno all\'anello (M5 A9)', 'm5_cmp_ring + ring_a', M5, cmpN.pages.concat(cmpC.feedbackPages));

  // A10 — revisione della teoria (ramo dipendente da initialTheory)
  const revisionNodeId = initialTheory === 'degeneration' ? 'm5_theory_revision' : 'm5_theory_first';
  const revisionChoiceId = initialTheory === 'degeneration' ? 'revision_switch' : 'first_staging';
  const revN = doNode(m5State, M5, revisionNodeId);
  const revC = doChoice(m5State, M5, revisionNodeId, revisionChoiceId);
  lNarr(`Revisione della teoria (M5 A10, ${revisionNodeId})`, `${revisionNodeId} + ${revisionChoiceId}`, M5, revN.pages.concat(revC.feedbackPages));

  // A12 — rapporto a Truman sul posto (Truman e' iniettato al vagone via NARRATIVE_ENTITIES
  // quando value_set(m5_final_theory) ∧ ¬east_route_confirmed; qui lo si raggiunge
  // direttamente via doNode, come da metodo dichiarato per il layer narrativo)
  const reportN = doNode(m5State, M5, 'm5_report_intro');
  lNarr('Rapporto a Truman sul posto (M5 A12)', 'm5_report_intro', M5, reportN.pages);

  // A13 — custodia S1
  const s1ChoiceId = 'documented_custody' === 'documented_custody' ? 's1_documented' : 's1_institutional';
  const s1N = doNode(m5State, M5, 'm5_s1');
  const s1C = doChoice(m5State, M5, 'm5_s1', s1ChoiceId);
  lNarr('Custodia S1 (M5 A13)', `m5_s1 + ${s1ChoiceId}`, M5, s1N.pages.concat(s1C.feedbackPages));
  const closeN = doNode(m5State, M5, 'm5_report_close');
  lNarr('Chiusura del rapporto (M5 A13)', 'm5_report_close', M5, closeN.pages);

  // A14 — taglio a nord
  const tracksTile = approachWorldTarget('traincar', 'tracks_north');
  lLoad('traincar', tracksTile.x, tracksTile.y, 'down');
  const tracksN = doNode(m5State, M5, 'm5_tracks_north');
  lNarr('Il taglio a nord (M5 A14)', 'm5_tracks_north', M5, tracksN.pages);
  if (!m5State.flags.east_route_confirmed) throw new Error('atteso east_route_confirmed dopo m5_tracks_north');

  if (opts.includeOptional) {
    const signTile = approachWorldTarget('traincar', 'sign_oej');
    const dSign = bfsDistance('traincar', lastX, lastY, signTile.x, signTile.y);
    const signWalk = dSign === null ? Math.abs(signTile.x - lastX) + Math.abs(signTile.y - lastY) : dSign;
    E.loadMap('traincar', signTile.x, signTile.y, 'down');
    const signN = doNode(m5State, M5, 'm5_sign_oej');
    optionalPush(opts, { label: 'Cartello One Eyed Jacks (M5 A14, opzionale)', mapId: 'traincar', system: `narrativo(M5)`, id: 'm5_sign_oej', walkTiles: signWalk, approx: dSign === null, pages: signN.pages.length, chars: signN.pages.reduce((s, p) => s + (p.text ? p.text.length : 0), 0) });
  }

  // -- traincar -> oej (M6 entra: east_route_confirmed) --
  lCrossDoor('oej', 'up');

  // B1 — Jacques al traghetto/tavolo
  // jacques non e' un npc fisico su js/maps.js["oej"] (nessuna voce in npcs[]
  // ne' in NARRATIVE_ENTITIES): la sua tile e' quella documentata nel commento
  // della riga della mappa ("Jacques (7,5)") e usata come target di cammino
  // reale da test/m6-physical-harness.html (interactTarget(7, 5, ...)).
  const jacquesTile = findApproachTile('oej', 7, 5, [7, 5]);
  lLoad('oej', jacquesTile.x, jacquesTile.y, 'up');
  const ferryN = doNode(m5State, M6, 'm6_ferry');
  lNarr('Jacques: il tavolo (M6 B1-B2)', 'm6_ferry', M6, ferryN.pages);

  if (opts.includeOptional && m5State.flags.audrey_indaga) {
    // stesso ragionamento di jacques: coordinata documentata nel commento
    // della mappa ("Audrey (13,7)"), nessun npc fisico registrato.
    const audreyTile = findApproachTile('oej', 13, 7, [13, 7]);
    const dAudrey = bfsDistance('oej', lastX, lastY, audreyTile.x, audreyTile.y);
    const audreyWalk = dAudrey === null ? Math.abs(audreyTile.x - lastX) + Math.abs(audreyTile.y - lastY) : dAudrey;
    E.loadMap('oej', audreyTile.x, audreyTile.y, 'up');
    const audreyN = doNode(m5State, M6, 'm6_audrey');
    optionalPush(opts, { label: 'Audrey a One Eyed Jacks (M6 B3, opzionale)', mapId: 'oej', system: 'narrativo(M6)', id: 'm6_audrey', walkTiles: audreyWalk, approx: dAudrey === null, pages: audreyN.pages.length, chars: audreyN.pages.reduce((s, p) => s + (p.text ? p.text.length : 0), 0) });
  } else if (opts.includeOptional) {
    unreachableOptionalPush(opts, 'Audrey a One Eyed Jacks (M6 B3): richiede flags.audrey_indaga, scritto solo dal ramo classico audrey_a2/audrey_a2_ben (Atto 2 opzionale), non presente in questo run.');
  }

  // B3 — tattica
  const tacticChoiceId = tactic === 'prova' ? 'tactic_prova' : (tactic === 'pressione' ? 'tactic_pressione' : 'tactic_falsa_sicurezza');
  const interrogationNodeId = tactic === 'prova' ? 'm6_interrogation_prova' : (tactic === 'pressione' ? 'm6_interrogation_pressione' : 'm6_interrogation_falsa');
  const tacticN = doNode(m5State, M6, 'm6_tactic');
  const tacticC = doChoice(m5State, M6, 'm6_tactic', tacticChoiceId);
  lNarr(`Scelta della tattica (M6 B3, ${tactic})`, `m6_tactic + ${tacticChoiceId}`, M6, tacticN.pages.concat(tacticC.feedbackPages));

  // B4-B6 — interrogatorio (il goto di m6_tactic ha gia' eseguito il nodo target;
  // le sue pagine sono in tacticC.gotoPages, NON rieseguirlo con una seconda doNode)
  lNarr(`Interrogatorio (M6 B4-B6, ${interrogationNodeId})`, interrogationNodeId, M6, tacticC.gotoPages);
  if (!m5State.flags.jacques_admitted_presence) throw new Error('atteso jacques_admitted_presence dopo l\'interrogatorio');

  if (opts.includeOptional) {
    const cmpCardsNodeId = tactic === 'prova' ? 'm6_cmp_cards_prova' : (tactic === 'pressione' ? 'm6_cmp_cards_pressione' : 'm6_cmp_cards_falsa');
    if (m5State.evidence.E_CARTE) {
      const cmpCardsN = doNode(m5State, M6, cmpCardsNodeId);
      const cmpCardsC = doChoice(m5State, M6, cmpCardsNodeId, 'cards_hand');
      optionalPush(opts, { label: `Confronto carte <-> testimonianza (M6 B4c, opzionale, ${cmpCardsNodeId})`, mapId: 'oej', system: 'narrativo(M6)', id: cmpCardsNodeId, walkTiles: 0, approx: false, pages: cmpCardsN.pages.length + cmpCardsC.feedbackPages.length, chars: cmpCardsN.pages.concat(cmpCardsC.feedbackPages).reduce((s, p) => s + (p.text ? p.text.length : 0), 0) });
    } else {
      unreachableOptionalPush(opts, `Confronto carte <-> testimonianza (M6 B4c, ${cmpCardsNodeId}): richiede E_CARTE (M5 A8 opzionale, "Carte"); incluso solo se A8 e' stato visitato in questo run.`);
    }
  }

  // B6b — P5
  const p5N = doNode(m5State, M6, 'm6_p5');
  const p5C = doChoice(m5State, M6, 'm6_p5', 'p5_present');
  lNarr('Formulazione di P5 (M6 B6b)', 'm6_p5 + p5_present', M6, p5N.pages.concat(p5C.feedbackPages));

  // B7 — arresto
  const arrestN = doNode(m5State, M6, 'm6_arrest');
  lNarr('Fermo di Jacques (M6 B7)', 'm6_arrest', M6, arrestN.pages);

  // -- oej -> traincar -> town -> ospedale --
  lCrossDoor('traincar', 'down');
  lCrossDoor('town', 'left');
  lCrossDoor('hospital', 'up');

  // B7c — piantone in ospedale (obbligatorio)
  const registerTile = approachWorldTarget('hospital', 'night_register');
  lLoad('hospital', registerTile.x, registerTile.y, 'up');
  const guardN = doNode(m5State, M6, 'm6_hospital_guard');
  lNarr('Il piantone in ospedale (M6 B7c)', 'm6_hospital_guard', M6, guardN.pages);

  // -- ospedale -> town -> sceriffo --
  lCrossDoor('town', 'down');
  lCrossDoor('sheriffs_station_exterior', 'up');
  lCrossDoor('sheriff', 'up');

  // B7b — rapporto notturno con Truman
  const trumanTile2 = approachNpcTile('sheriff', 'truman', [11, 4]);
  lLoad('sheriff', trumanTile2.x, trumanTile2.y, 'left');
  const nightN = doNode(m5State, M6, 'm6_return_night');
  lNarr('Rapporto notturno a Truman (M6 B7b)', 'm6_return_night', M6, nightN.pages);

  const longestPassiveBefore = localLog.filter((b) => b.kind !== 'map').length;

  // B8 — la telefonata di Lucy (notizia della morte)
  const lucyTile = approachNpcTile('sheriff', 'lucy', [8, 4]);
  lLoad('sheriff', lucyTile.x, lucyTile.y, 'down');
  const newsN = doNode(m5State, M6, 'm6_news');
  lNarr('La telefonata di Lucy (M6 B8)', 'm6_news', M6, newsN.pages);
  if (!m5State.flags.jacques_dead) throw new Error('atteso jacques_dead dopo m6_news');

  if (opts.includeOptional) {
    // B10 — registro (ritorno, opzionale: post-morte, jacques_death_suspicious non ancora scritto)
    // Deviazione multi-mappa (sceriffo -> piazzale -> town -> ospedale): si
    // riusa lCrossDoor/lLoad per l'instradamento reale (scoperta porte a
    // runtime), poi si ESPUNGE dal log del percorso obbligato tutto cio' che
    // e' stato aggiunto qui (splice), sommando SOLO il totale tile nel beat
    // opzionale — stesso limite dichiarato della "Scrivania" nel riferimento
    // Atto 2 (deviazione facoltativa, non nel computo del percorso obbligato).
    const registerTile2 = approachWorldTarget('hospital', 'night_register');
    const savedMap = lastMap, savedX = lastX, savedY = lastY;
    const logLenBefore = localLog.length;
    lCrossDoor('sheriffs_station_exterior', 'down');
    lCrossDoor('town', 'down');
    lCrossDoor('hospital', 'up');
    lLoad('hospital', registerTile2.x, registerTile2.y, 'up');
    const detourWalkTiles = localLog.slice(logLenBefore).reduce((s, b) => s + b.walkTiles, 0);
    localLog.splice(logLenBefore); // espunge la deviazione dal log del percorso obbligato
    const hospN = doNode(m5State, M6, 'm6_hospital');
    optionalPush(opts, { label: 'Registro notturno, ritorno (M6 B10, opzionale)', mapId: 'hospital', system: 'narrativo(M6)', id: 'm6_hospital', walkTiles: detourWalkTiles, approx: true, pages: hospN.pages.length, chars: hospN.pages.reduce((s, p) => s + (p.text ? p.text.length : 0), 0) });
    approxNotes.push('opzionale "Registro notturno, ritorno": deviazione sceriffo->piazzale->town->ospedale (andata e ritorno non modellati separatamente, solo l\'andata); tile della deviazione ESPUNTI dal percorso obbligato.');
    // torna al punto pre-deviazione per il resto del percorso obbligato
    lastMap = savedMap; lastX = savedX; lastY = savedY;
  }

  // -- sceriffo -> town -> hotel_gn -> room_315: la scena classica dello specchio (gigante1) --
  // Ponte manuale narrativo -> classico (mirror di syncNarrativeToClassic):
  // jacques_dead (M6) diventa jacques_morto (classico), che sblocca gigante1_dlg
  // sullo specchio di room_315.
  E.state.flags.jacques_morto = true;
  // (flags.intro_hotel gia' impostato all'inizio del run: v. sopra)
  lCrossDoor('sheriffs_station_exterior', 'down');
  lCrossDoor('town', 'down');
  lCrossDoor('hotel_gn', 'up');
  lCrossDoor('room_315', 'up');
  const specchioResolved = E.resolveDialogue(GAME.INTERACT_DLG.specchio315, S());
  if (specchioResolved !== 'gigante1_dlg') throw new Error(`atteso specchio315 -> gigante1_dlg con jacques_morto=true, risolto invece "${specchioResolved}"`);
  const specchioTile = findApproachTile('room_315', 13, 3, [13, 4]);
  const specchioDir = specchioTile.y > 3 ? 'up' : specchioTile.y < 3 ? 'down' : (specchioTile.x > 13 ? 'left' : 'right');
  lLoad('room_315', specchioTile.x, specchioTile.y, specchioDir);
  // interact() reale (mai un dialogo costruito a mano): la prima pressione di
  // Invio fa scattare l'interazione verso l'oggetto davanti al giocatore
  // (stesso pressA -> interact() di js/engine.js, nessun mock del motore).
  key('Enter'); pump(16);
  if (!S().dialogue || S().dialogue.id !== specchioResolved) {
    throw new Error(`interact() sullo specchio non ha aperto "${specchioResolved}" (trovato: ${S().dialogue && S().dialogue.id})`);
  }
  lDrainDialogue('Specchio: il Gigante (classico gigante1_dlg, dopo M6 B8)');
  if (!S().flags.gigante1) throw new Error('atteso flags.gigante1 (classico) dopo gigante1_dlg');
  // Ponte manuale classico -> narrativo (mirror di syncClassicToNarrative):
  m5State.flags.gigante1 = true;

  // -- room_315 -> sceriffo: il ponte all'Atto 4 --
  lCrossDoor('hotel_gn', 'down');
  lCrossDoor('town', 'down');
  lCrossDoor('sheriffs_station_exterior', 'up');
  lCrossDoor('sheriff', 'up');
  const trumanTile3 = approachNpcTile('sheriff', 'truman', [11, 4]);
  lLoad('sheriff', trumanTile3.x, trumanTile3.y, 'left');
  const bridgeCloseN = doNode(m5State, M6, 'm6_atto4_bridge');
  lNarr('Il ponte all\'Atto 4 (M6 B9)', 'm6_atto4_bridge', M6, bridgeCloseN.pages);
  if (!m5State.flags.atto4) throw new Error('atteso flags.atto4 dopo m6_atto4_bridge');

  return {
    log: localLog,
    approxNotes: localApproxNotes,
    walkTilesBeforeFirstInteraction,
    mandatoryObservations,
    theory: initialTheory,
    tactic,
    revisionNodeId
  };
}

/* piccoli helper per instradare i push opzionali sul contenitore giusto (globale
 * o locale a seconda che questa invocazione sia quella "canonica" da loggare). */
function optionalPush(opts, entry) { if (opts.optionalSink) opts.optionalSink.push(entry); }
function unreachableOptionalPush(opts, note) { if (opts.unreachableSink) opts.unreachableSink.push(note); }

/* ==================== esecuzione: percorso canonico + varianti per il range == */

function sumWalk(log) { return log.filter((b) => b.kind === 'map').reduce((s, b) => s + b.walkTiles, 0); }
function sumContent(log) {
  const content = log.filter((b) => b.kind !== 'map');
  const chars = content.reduce((s, b) => s + b.chars, 0);
  const pages = content.reduce((s, b) => s + b.pages, 0);
  return { chars, pages, count: content.length };
}
// run canonico (loggato in dettaglio beat-per-beat): teoria "degeneration"
// (impeto, il ramo con revisione sotto pressione — il piu' rappresentato nel
// design report §12/§13), tattica "prova".
const canonicalOptional = [];
const canonicalUnreachable = [];
const canonical = runRequiredPath('degeneration', 'prova', { includeOptional: true, optionalSink: canonicalOptional, unreachableSink: canonicalUnreachable });
beats.push(...canonical.log);
optionalBeats.push(...canonicalOptional);
unreachableOptional.push(...canonicalUnreachable);
approxNotes.push(...canonical.approxNotes);

// varianti per il range (solo totali, nessun log dettagliato, nessun contenuto opzionale)
const theoryVariants = ['degeneration', 'withheld'];
const tacticVariants = ['prova', 'pressione', 'falsa_sicurezza'];
const variantResults = [];
theoryVariants.forEach((theory) => {
  tacticVariants.forEach((tactic) => {
    if (theory === 'degeneration' && tactic === 'prova') {
      // gia' misurato come canonical
      variantResults.push({ theory, tactic, log: canonical.log });
      return;
    }
    const r = runRequiredPath(theory, tactic, { includeOptional: false, optionalSink: [], unreachableSink: [] });
    variantResults.push({ theory, tactic, log: r.log });
  });
});

/* ==================== calcoli di tempo ================================= */

function fmt(n, d = 1) { return Number(n).toFixed(d); }

const reqTimes12 = variantResults.map((v) => totalSecReading(v.log, CHARS_PER_SEC));
const reqTimes15 = variantResults.map((v) => totalSecReading(v.log, CHARS_PER_SEC_FAST));
function totalSecReading(log, cps) {
  const walkSec = sumWalk(log) / TILES_PER_SEC;
  const { chars, pages } = sumContent(log);
  return walkSec + chars / cps + pages * SEC_PER_PAGE_INPUT;
}
const minReq12 = Math.min(...reqTimes12), maxReq12 = Math.max(...reqTimes12);
const minReq15 = Math.min(...reqTimes15), maxReq15 = Math.max(...reqTimes15);

const optWalkTiles = optionalBeats.reduce((s, b) => s + b.walkTiles, 0);
const optChars = optionalBeats.reduce((s, b) => s + b.chars, 0);
const optPages = optionalBeats.reduce((s, b) => s + b.pages, 0);
const optWalkSec = optWalkTiles / TILES_PER_SEC;
const optReadingSec12 = optChars / CHARS_PER_SEC + optPages * SEC_PER_PAGE_INPUT;
const optReadingSec15 = optChars / CHARS_PER_SEC_FAST + optPages * SEC_PER_PAGE_INPUT;
const optTotalSec12 = optWalkSec + optReadingSec12;
const optTotalSec15 = optWalkSec + optReadingSec15;

const canonicalContentBeats = beats.filter((b) => b.kind !== 'map');
const canonicalMapBeats = beats.filter((b) => b.kind === 'map');
const canonicalWalkTiles = canonicalMapBeats.reduce((s, b) => s + b.walkTiles, 0);
const canonicalChars = canonicalContentBeats.reduce((s, b) => s + b.chars, 0);
const canonicalPages = canonicalContentBeats.reduce((s, b) => s + b.pages, 0);

const longestDialogue = canonicalContentBeats.reduce((best, b) => (b.chars > (best ? best.chars : -1) ? b : best), null);
const longestWalk = canonicalMapBeats.reduce((best, b) => (b.walkTiles > (best ? best.walkTiles : -1) ? b : best), null);

// blocco passivo piu' lungo: sequenza consecutiva di beat 'dialogue'/'narrativo'
// SENZA una beat 'map' interposta (nessun cambio mappa = nessuna azione del
// giocatore nel mondo fra le pagine, anche se il beat stesso include scelte).
let longestPassiveRun = null, curRun = [];
function flushRun() {
  if (curRun.length === 0) return;
  const pages = curRun.reduce((s, b) => s + b.pages, 0);
  const chars = curRun.reduce((s, b) => s + b.chars, 0);
  const entry = { ids: curRun.map((b) => b.id), pages, chars, count: curRun.length };
  if (!longestPassiveRun || pages > longestPassiveRun.pages) longestPassiveRun = entry;
  curRun = [];
}
beats.forEach((b) => { if (b.kind === 'map') flushRun(); else curRun.push(b); });
flushRun();

const deductionNodes = ['m5_theory_initial', canonical.revisionNodeId, 'm5_cmp_ring', 'm6_tactic', 'm6_p5'];
const meaningfulChoiceValues = ['m5_initial_theory', 'm5_final_theory', 's1', 'm6_tactic'];

/* ==================== report markdown =============================== */

let md = '';
md += '# Pacing Atto 3 (M5 + M6) — stato attuale\n\n';
md += 'Misurato headless con `node test/probe-act3-pacing.js`, a partire da Cooper alla centrale dello sceriffo con l\'Atto 2 ' +
  'gia\' chiuso (`flags.atto3`, P2 accettata da Truman — ricostruito silenziosamente rigiocando la stessa catena M4 di ' +
  '`test/act-3-flow.js::m5Base()`, non loggato come contenuto dell\'Atto 3) fino al nodo `m6_atto4_bridge` (imposta `flags.atto4`).\n\n';
md += `Velocita' giocatore reale: SPEED=${SPEED}, TILE=${TILE_PX}px -> ${fmt(MS_PER_TILE, 2)} ms/tile (${fmt(TILES_PER_SEC, 3)} tile/s). ` +
  `Lettura: ${CHARS_PER_SEC}/${CHARS_PER_SEC_FAST} caratteri/s + ${SEC_PER_PAGE_INPUT}s/pagina.\n\n`;
md += 'Confronto con la stima di design (docs/act-3-design-report.md §13): **15-17 min** per il percorso obbligato.\n\n';

md += '## Percorso obbligato: range su teorie e tattiche\n\n';
md += '| Teoria iniziale | Tattica | Tile a piedi | Pagine | Caratteri | Tempo (12cps) | Tempo (15cps) |\n';
md += '|---|---|---:|---:|---:|---:|---:|\n';
variantResults.forEach((v) => {
  const w = sumWalk(v.log);
  const c = sumContent(v.log);
  const t12 = totalSecReading(v.log, CHARS_PER_SEC);
  const t15 = totalSecReading(v.log, CHARS_PER_SEC_FAST);
  md += `| ${v.theory} | ${v.tactic} | ${w} | ${c.pages} | ${c.chars} | ${fmt(t12, 1)}s (~${fmt(t12 / 60, 2)} min) | ${fmt(t15, 1)}s (~${fmt(t15 / 60, 2)} min) |\n`;
});
md += '\n';
md += `**Range percorso obbligato (12cps): ${fmt(minReq12, 1)}s (~${fmt(minReq12 / 60, 2)} min) — ${fmt(maxReq12, 1)}s (~${fmt(maxReq12 / 60, 2)} min).**\n\n`;
md += `**Range percorso obbligato (15cps): ${fmt(minReq15, 1)}s (~${fmt(minReq15 / 60, 2)} min) — ${fmt(maxReq15, 1)}s (~${fmt(maxReq15 / 60, 2)} min).**\n\n`;

const designLowSec = 15 * 60, designHighSec = 17 * 60;
const inRange12 = minReq12 <= designHighSec && maxReq12 >= designLowSec;
md += `Stima di design: ${designLowSec}-${designHighSec}s (15-17 min). Range misurato (12cps) ${inRange12 ? 'SI\' interseca' : 'NON interseca'} la stima di design.\n\n`;

md += '## Beat per beat (percorso canonico: teoria "degeneration"/impeto, tattica "prova")\n\n';
md += '| # | Tipo | Sistema | Dettaglio | Tiles a piedi | Sec. camminati | Pagine | Caratteri | Sec. lettura (12cps) |\n';
md += '|---|------|---------|-----------|---------------:|----------------:|-------:|----------:|---------------:|\n';
let bi = 0;
beats.forEach((b) => {
  bi++;
  if (b.kind === 'map') {
    const sec = b.walkTiles / TILES_PER_SEC;
    const approxTag = b.approx ? ' (~approx)' : '';
    md += `| ${bi} | mappa | — | ${b.mapId} @(${b.tx},${b.ty})${approxTag}${b.note ? ' — ' + b.note : ''} | ${b.walkTiles} | ${fmt(sec, 2)} | | | |\n`;
  } else {
    const sec12 = b.chars / CHARS_PER_SEC + b.pages * SEC_PER_PAGE_INPUT;
    md += `| ${bi} | ${b.kind} | ${b.system} | ${b.label} (\`${b.id}\`) | | | ${b.pages} | ${b.chars} | ${fmt(sec12, 2)} |\n`;
  }
});
md += '\n';

md += '## Contenuto opzionale (misurato separatamente)\n\n';
md += '| Mappa | Sistema | Etichetta (id) | Tiles a piedi | Sec. camminati | Pagine | Caratteri | Sec. lettura (12cps) |\n';
md += '|---|---|---|---:|---:|---:|---:|---:|\n';
optionalBeats.forEach((o) => {
  const sec = o.walkTiles / TILES_PER_SEC;
  const readSec = o.chars / CHARS_PER_SEC + o.pages * SEC_PER_PAGE_INPUT;
  const approxTag = o.approx ? ' (~approx)' : '';
  md += `| ${o.mapId}${approxTag} | ${o.system} | ${o.label} (\`${o.id}\`) | ${o.walkTiles} | ${fmt(sec, 2)} | ${o.pages} | ${o.chars} | ${fmt(readSec, 2)} |\n`;
});
md += '\n';
md += `**Totale contenuto opzionale misurato: ${optWalkTiles} tile (${fmt(optWalkSec, 1)}s), ${optPages} pagine, ${optChars} caratteri -> ${fmt(optTotalSec12, 1)}s (12cps) / ${fmt(optTotalSec15, 1)}s (15cps).**\n\n`;

if (unreachableOptional.length) {
  md += '## Contenuto opzionale NON misurato in questo run (stato non raggiunto)\n\n';
  unreachableOptional.forEach((n) => { md += `- ${n}\n`; });
  md += '\n';
}

md += '## Blocco passivo piu\' lungo (pagine consecutive senza cambio mappa)\n\n';
md += longestPassiveRun
  ? `${longestPassiveRun.ids.join(' + ')} — ${longestPassiveRun.pages} pagine, ${longestPassiveRun.chars} caratteri (~${fmt(longestPassiveRun.chars / CHARS_PER_SEC + longestPassiveRun.pages * SEC_PER_PAGE_INPUT, 1)}s a 12cps).\n\n`
  : 'nessuno.\n\n';

md += '## Tratto a piedi ininterrotto piu\' lungo\n\n';
md += longestWalk
  ? `${longestWalk.mapId} @(${longestWalk.tx},${longestWalk.ty}) — ${longestWalk.walkTiles} tile (${fmt(longestWalk.walkTiles / TILES_PER_SEC, 1)}s).\n\n`
  : 'nessuno.\n\n';

md += '## Tempo prima della prima interazione significativa\n\n';
md += `Cammino dalla centrale (Truman) fino al ponte (\`m5_bridge\`), ESCLUSO il dialogo: **${canonical.walkTilesBeforeFirstInteraction} tile (${fmt(canonical.walkTilesBeforeFirstInteraction / TILES_PER_SEC, 1)}s)**.\n\n`;

md += '## Conteggi (percorso canonico)\n\n';
md += '| Metrica | Valore |\n|---|---|\n';
md += `| Osservazioni obbligatorie (M5) | ${canonical.mandatoryObservations.length} (${canonical.mandatoryObservations.join(', ')}) |\n`;
md += `| Deduzioni del giocatore (nodi choice con >= 2 opzioni non-retry) | ${deductionNodes.length} (${deductionNodes.join(', ')}) |\n`;
md += `| Scelte significative (valori write-once) | ${meaningfulChoiceValues.length} (${meaningfulChoiceValues.join(', ')}) |\n`;
md += `| Tile camminati (percorso obbligato, canonico) | ${canonicalWalkTiles} |\n`;
md += `| Pagine (percorso obbligato, canonico) | ${canonicalPages} |\n`;
md += `| Caratteri (percorso obbligato, canonico) | ${canonicalChars} |\n`;
md += '\n';

if (approxNotes.length) {
  md += '## Note di approssimazione (cambi mappa / BFS senza percorso)\n\n';
  [...new Set(approxNotes)].forEach((n) => { md += `- ${n}\n`; });
  md += '\n';
}

md += '## Limiti dichiarati\n\n';
md += '- Stesso schema del riferimento (`test/probe-act2-pacing.js`): BFS reale entro la stessa mappa, Manhattan approssimato fra la porta ' +
  'di partenza e lo spawn di arrivo su ogni cambio mappa, piazzali a piu\' tile risolti sulla tile piu\' vicina.\n';
md += '- La catena M4 (Atto 1->2, fino a `present_truman_m4`+P2) e\' rigiocata silenziosamente con `NR.prepareNode`/`commitNode`/`prepareChoice`/`commitChoice`/`preparePresentation`/`commitPresentation` (stesso helper di `test/act-3-flow.js::m5Base()`), ma NON compare nel log dei beat: e\' gia\' misurata da `probe-act2-pacing.js`.\n';
md += '- Contenuto opzionale che richiede evidenza scritta SOLO da contenuto opzionale dell\'Atto 2 (E5_POESIA per il confronto biglietto<->verso, audrey_indaga per Audrey a One Eyed Jacks) non e\' raggiungibile in questo run e viene elencato separatamente come "non misurato", non stimato.\n';
md += '- Il confronto carte<->testimonianza (M6 B4c) e\' misurato solo se le carte del vagone (M5 A8) sono state visitate nello stesso run: qui SI\' (contenuto opzionale incluso nel run canonico).\n';
md += '- La scena classica dello specchio (`gigante1_dlg`) e\' l\'UNICO contenuto classico di questo percorso: il ponte fra `m6State.flags.jacques_dead` e `S().flags.jacques_morto`, e fra `S().flags.gigante1` e `m6State.flags.gigante1`, e\' impostato manualmente qui (stesso schema dichiarato di `js/narrative-production.js::syncNarrativeToClassic/syncClassicToNarrative`, MAI attivato per intero: solo queste due variabili sono specchiate).\n';
md += '- I range "teoria x tattica" (6 combinazioni) misurano SOLO il percorso obbligato (nessun contenuto opzionale, nessun log beat-per-beat): il log dettagliato sopra e\' quello del run canonico (`degeneration`/impeto, `prova`) soltanto.\n';
md += '- `m6_return_night_early`/`m5_tracks_north_early`/`m6_hospital_guard`-refusal e i tre posizionamenti di Hawk (`hawk_bridge`/`hawk_door`/`hawk_cut`, riga muta via `repeat`) non sono attraversati: sono guardie di sequenza, non contenuto misurabile in pagine.\n';
md += '- Tempo di lettura: stima lineare caratteri/velocita\' + costante per pagina; non modella riletture, esitazioni o skip.\n';

fs.mkdirSync(path.join(__dirname, '..', 'artifacts', 'act-3-closure'), { recursive: true });
const outPath = path.join(__dirname, '..', 'artifacts', 'act-3-closure', 'pacing.md');
fs.writeFileSync(outPath, md);

console.log(md);
console.log(`\nReport scritto in ${outPath}`);
