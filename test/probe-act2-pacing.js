/* probe-act2-pacing.js — diagnostica, NON tocca file di produzione.
 * Modellato su test/probe-acts12-pacing.js: stessa impalcatura (stub
 * browser, BFS a piedi sulla griglia calpestabile, approssimazione
 * Manhattan sui cambi mappa), ma applicata all'Atto 2 (NVS02), che
 * parte DIRETTAMENTE dal risveglio in room_315 (non ri-simula l'Atto 1).
 *
 * Differenza chiave rispetto al riferimento: il testo live dell'Atto 2
 * arriva da DUE sistemi:
 *  (1) dialoghi classici (js/data.js, risolti da GAME.Data.dialogues via
 *      E.resolveDialogue, avanzati con Invio come in smoke.js);
 *  (2) nodi del runtime narrativo M4 (js/narrative-runtime.js + missione
 *      narrative/missions/M4.json), misurati chiamando direttamente
 *      prepareNode/commitNode/prepareChoice/commitChoice/preparePresentation/
 *      commitPresentation — non passano MAI dalla dialogue box classica.
 * Le due bookkeeping (flag classici su E.state, stato del runtime M4) sono
 * volutamente SEPARATE: qui servono solo le metriche testo (pagine/caratteri)
 * dei nodi M4, non la loro integrazione con i flag classici.
 *
 * Le coordinate di mappa/porta/NPC NON sono prese per buone dalla
 * descrizione del task: ogni porta viene scoperta a runtime interrogando
 * GAME.Maps[mapId].doors (dopo che tutte le connessioni sono installate) e
 * ogni bersaglio NPC viene validato con GAME.Maps.isSolid prima di essere
 * usato come tile di arrivo.
 *
 * Esegui con: node test/probe-act2-pacing.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------------- stub ambiente browser (come smoke.js/walkthrough.js) ---- */

let tnow = 0;
let rafQueue = [];
const handlers = {};
global.window = global;
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.requestAnimationFrame = (cb) => { rafQueue.push(cb); };
global.performance = { now: () => tnow };
global.setInterval = () => 0;
// stub minimo di `document`: necessario perché js/engine.js legge
// `typeof document !== 'undefined'` per far scattare l'onEnter automatico
// di room_315 (hotel_risveglio) — stesso stub di test/world-connections.gen.js.
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
  'engine.js', 'glue.js', 'location-connections.js', 'environment-reactions.js','world-connections.gen.js',
  'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js', 'sheriffs-station-exterior-scene.js', 'sheriffs-station-production.js',
  'room-315-art.js', 'room-315-scene.js', 'room-315-production.js', 'world-connections-production.js'
].forEach((f) => require(J(f)));

const GAME = global.GAME;
const E = GAME.Engine;
const S = () => E.state;

/* narrative-runtime.js: stesso GAME globale, si limita ad aggiungere
 * GAME.NarrativeRuntime. Nessun conflitto con l'engine classico già
 * richiesto sopra (a differenza di test/act-2-flow.js, qui NON serve
 * isolare i due require in cache separate: vogliamo entrambi nello stesso
 * processo). */
require(J('narrative-runtime.js'));
const NR = GAME.NarrativeRuntime;
const M4 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'narrative', 'missions', 'M4.json'), 'utf8'));

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
function hold(code, ms) {
  handlers.keydown({ code, preventDefault() {}, repeat: false });
  pump(ms);
  handlers.keyup({ code });
}

/* ---------------- velocita' reale del giocatore -----------------------
 * js/engine.js: SPEED = 0.075, TILE = 16, p.moveT += dt * SPEED / TILE.
 * Un tile si completa quando moveT arriva a 1, cioe' dopo
 * sum(dt) = TILE / SPEED millisecondi. */
const TILE_PX = 16;
const SPEED = 0.075;
const MS_PER_TILE = TILE_PX / SPEED; // 213.33 ms/tile
const TILES_PER_SEC = 1000 / MS_PER_TILE;

/* ---------------- velocita' di lettura (italiano, stimata) ------------- */
const CHARS_PER_SEC = 12;
const CHARS_PER_SEC_FAST = 15; // lettore veloce
const SEC_PER_PAGE_INPUT = 0.6; // tempo per registrare/premere Invio a pagina letta

/* ---------------- BFS distanza a piedi sulla griglia calpestabile ------ */
// Stessa nozione di "tile bloccato" di walkthrough.js/probe-acts12-pacing.js:
// solidita' del terreno + porte non attraversabili + NPC attivi + oggetti,
// valutata sullo stato REALE della partita (S()), non su uno stato simulato.
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

// BFS shortest path (numero di passi) fra due tile della STESSA mappa.
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
      // la tile bersaglio stessa puo' essere "bloccata" (es. tile dell'NPC con
      // cui si interagisce, o di un altro NPC adiacente): si accetta comunque
      // come arrivo, il blocco vale solo per l'attraversamento intermedio.
      const isTarget = nx === x1 && ny === y1;
      if (!isTarget && tileBlocked(mapId, nx, ny)) continue;
      seen.add(k);
      if (isTarget) return cur.d + 1;
      queue.push({ x: nx, y: ny, d: cur.d + 1 });
    }
  }
  return null;
}

/* ---------------- helper di scoperta coordinate a runtime -------------- */
// Non ci si fida delle coordinate letterali del task: si valida ogni target
// contro la mappa reale dopo che tutte le connessioni sono installate.
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
// scopre a runtime la porta di mapId che conduce a targetMapId, scegliendo
// (se ce n'e' piu' d'una, come per i piazzali a piu' tile) quella piu'
// vicina alla posizione corrente, per una simulazione di percorso plausibile.
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

/* ---------------- log strutturato --------------------------------- */

const beats = []; // {kind:'map'|'dialogue'|'m4', ...}
let lastMap = null, lastX = null, lastY = null;
const approxNotes = [];
const notesGeneral = [];
const optionalBeats = []; // {label, mapId, system, id, walkTiles, approx, pages, chars}

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

// attraversa la porta reale (scoperta a runtime) fra la mappa corrente e
// targetMapId: registra PRIMA il tratto a piedi fino alla porta (BFS sulla
// stessa mappa), POI l'arrivo sulla mappa successiva (Manhattan approx, per
// dichiarazione esplicita: il routing porta-a-porta multi-hop reale non e'
// modellato qui).
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

function recordM4(label, id, pagesArr) {
  const chars = pagesArr.reduce((s, p) => s + (p && p.text ? p.text.length : 0), 0);
  beats.push({ kind: 'm4', label, id, system: 'narrativo(M4)', pages: pagesArr.length, chars });
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

// registra un'interazione OPZIONALE: la distanza a piedi e' un BFS reale sulla
// mappa corrente a partire dal punto già raggiunto dal percorso obbligato più
// vicino (non un secondo playthrough completo: le pagine/caratteri sono dati
// statici, letti allo stesso modo delle interazioni obbligatorie, quindi
// "misurati" e non solo enumerati — si veda la nota nei limiti dichiarati).
function recordOptional(label, mapId, system, id, from, target, pagesInfo) {
  const d = bfsDistance(mapId, from.x, from.y, target.x, target.y);
  const approx = d === null;
  const walkTiles = approx ? Math.abs(target.x - from.x) + Math.abs(target.y - from.y) : d;
  if (approx) approxNotes.push(`opzionale "${label}" su ${mapId}: BFS non ha trovato un percorso da (${from.x},${from.y}) a (${target.x},${target.y}), uso Manhattan`);
  optionalBeats.push({ label, mapId, system, id, walkTiles, approx, pages: pagesInfo.pages, chars: pagesInfo.chars });
}

/* ==================== runtime narrativo M4: helper (mirror di test/act-2-flow.js) */

function doNode(s, id) {
  const p = NR.prepareNode(s, M4, id);
  if (!p.ok) throw new Error(`prepareNode(${id}) fallita: ${p.error}`);
  const c = NR.commitNode(s, M4, p);
  if (!c.ok) throw new Error(`commitNode(${id}) fallita`);
  return { pages: p.pages || [], repeated: !!c.repeated };
}
function doChoice(s, atId, choiceId) {
  const node = M4.nodes.find((n) => n.id === atId);
  if (!node) throw new Error(`nodo M4 "${atId}" non trovato`);
  const p = NR.prepareChoice(s, M4, node, choiceId);
  if (!p.ok) throw new Error(`prepareChoice(${atId}.${choiceId}) fallita: ${p.error}`);
  const c = NR.commitChoice(s, M4, node, p);
  if (!c.ok) throw new Error(`commitChoice(${atId}.${choiceId}) fallita`);
  // Il feedback della scelta (prepared.feedback_pages) e' cio' che il vero
  // motore mostra PRIMA del commit (js/narrative-ui.js legge `prepared.
  // feedback_pages`) — non e' esposto dal return di commitChoice, quindi lo
  // si cattura qui esplicitamente invece di scartarlo come farebbe una copia
  // letterale del wrapper di test/act-2-flow.js.
  let gotoPages = [];
  if (c.goto) { const r = doNode(s, c.goto); gotoPages = r.pages; }
  return { feedbackPages: p.feedback_pages || [], gotoPages, goto: c.goto || null };
}
function doPresent(s, propId) {
  const pres = M4.nodes.find((n) => n.id === 'present_truman_m4');
  const p = NR.preparePresentation(s, M4, pres, propId);
  if (!p.ok) throw new Error(`preparePresentation(${propId}) fallita: ${p.error}`);
  const c = NR.commitPresentation(s, M4, pres, p);
  if (!c.ok) throw new Error('commitPresentation fallita');
  return { pages: p.pages || [] };
}

/* ==================== PERCORSO ATTO 2 (NVS02) =========================
 * Parte direttamente dal risveglio in room_315 (non ri-simula l'Atto 1).
 * Ogni tratto: crossDoor() scopre la porta reale a runtime (BFS fino alla
 * porta sulla mappa di partenza + Manhattan approx fino allo spawn sulla
 * mappa di arrivo); ogni interazione con un NPC usa approachNpcTile() per
 * trovare la tile calpestabile adiacente realmente reachable. */

E.init(canvasStub);
E.start();
pump(32);

E.state.mode = 'play';
E.state.flags.sogno_fatto = true; // flag CLASSICO su E.state, slegato dallo stato del runtime M4 qui sotto
E.loadMap('room_315', 2, 6, 'down'); // onEnter automatico: hotel_risveglio (mode gia' 'play')
recordMapChange('room_315', 2, 6);

if (!S().dialogue || S().dialogue.id !== 'hotel_risveglio') {
  throw new Error(`atteso onEnter automatico hotel_risveglio su room_315, trovato: ${S().dialogue && S().dialogue.id}`);
}
drainDialogueAndLog('Risveglio (hotel_risveglio)');

notesGeneral.push(
  'room_315.doors e\' {} in js/maps.js (statico): la porta verso hotel_gn e\' installata a runtime dalla ' +
  'connessione "great-northern-room-315-hall" (js/world-connections.gen.js, applicata da js/room-315-production.js). ' +
  'Dump a runtime: room_315.doors["7,11"] -> hotel_gn(14,2,down); hotel_gn.doors["14,1"] -> room_315(7,10,up).'
);

// stato del runtime narrativo M4 — bookkeeping SEPARATA dai flag classici
// di E.state usati sopra per far scattare l'onEnter.
const m4State = NR.createState();
m4State.flags.sogno_fatto = true;

/* -------- room_315 -> hotel_gn (passaggio, nessun dialogo obbligatorio) - */
crossDoor('hotel_gn', 'down');
const hotelGnEntry = { x: lastX, y: lastY };

/* -------- hotel_gn -> town -> piazzale sceriffo -> sceriffo (Truman) ---- */
crossDoor('town', 'down');
crossDoor('sheriffs_station_exterior', 'up');
crossDoor('sheriff', 'up');
const sheriffEntry1 = { x: lastX, y: lastY };

const trumanApproach1 = approachNpcTile('sheriff', 'truman', [11, 4]);
loadMapAndLog('sheriff', trumanApproach1.x, trumanApproach1.y, 'left');

// Tempo prima della prima interazione significativa DOPO il monologo del
// risveglio: solo cammino, dallo spawn di room_315 fino alla tile di
// approccio a Truman (dialogo di risveglio ESCLUSO, come richiesto).
const walkTilesBeforeFirstInteraction = beats.filter((b) => b.kind === 'map').reduce((s, b) => s + b.walkTiles, 0);

const trumanNode = doNode(m4State, 'truman_a2');
recordM4('Truman: racconta il sogno (M4 B1)', 'truman_a2', trumanNode.pages);
if (!m4State.flags.sogno_raccontato) throw new Error('atteso flags.sogno_raccontato dopo truman_a2');

/* -------- sceriffo -> piazzale -> town -> ospedale (Ronette) ------------ */
crossDoor('sheriffs_station_exterior', 'down');
crossDoor('town', 'down');
crossDoor('hospital', 'up');
const hospitalEntry = { x: lastX, y: lastY };

const ronetteBedApproach = findApproachTile('hospital', 3, 5, [3, 6]);
loadMapAndLog('hospital', ronetteBedApproach.x, ronetteBedApproach.y, 'up');

const ronetteEntry = doNode(m4State, 'ronette_q');
const ronetteChoice = doChoice(m4State, 'ronette_q', 'q_uomo');
recordM4('Ronette: interrogatorio, "chi era l\'uomo?" (M4 B2)', 'ronette_q + ronette_uomo',
  ronetteEntry.pages.concat(ronetteChoice.gotoPages));
if (!m4State.evidence.T1_RONETTE_BOB) throw new Error('atteso evidence.T1_RONETTE_BOB dopo ronette_uomo');

/* -------- ospedale -> town -> piazzale Double R -> diner (James) ------- */
crossDoor('town', 'down');
crossDoor('double_r_exterior_prototype', 'up');
crossDoor('diner', 'up');
const dinerEntry = { x: lastX, y: lastY };

const jamesApproach = approachNpcTile('diner', 'james', [9, 7]);
loadMapAndLog('diner', jamesApproach.x, jamesApproach.y, 'up');

const jamesNode = doNode(m4State, 'james_a2');
recordM4('James: l\'altra meta\' del cuore (M4 B4)', 'james_a2', jamesNode.pages);

/* -------- taccuino: confronto pendaglio/percorso di James (0 tile) ------ */
const cmpEntry = doNode(m4State, 'cmp_e6a_tjames');
const cmpChoice = doChoice(m4State, 'cmp_e6a_tjames', 'b8_a');
recordM4('Taccuino: confronto E6A/T_JAMES_EST -> P2 (M4 B8, 0 tile)', 'cmp_e6a_tjames + b8_a',
  cmpEntry.pages.concat(cmpChoice.feedbackPages));
if (!m4State.props.P2 || m4State.props.P2.formulation.status !== 'formulated') {
  throw new Error('atteso P2 formulata dopo cmp_e6a_tjames/b8_a');
}

/* -------- diner -> piazzale Double R -> town -> piazzale sceriffo -> sceriffo (presenta P2) */
crossDoor('double_r_exterior_prototype', 'down');
crossDoor('town', 'down');
crossDoor('sheriffs_station_exterior', 'up');
crossDoor('sheriff', 'up');

const trumanApproach2 = approachNpcTile('sheriff', 'truman', [11, 4]);
loadMapAndLog('sheriff', trumanApproach2.x, trumanApproach2.y, 'left');

const presentIntro = doNode(m4State, 'present_truman_m4');
const presentBranch = doPresent(m4State, 'P2');
recordM4('Presenta a Truman il nesso P2 (M4 B9)', 'present_truman_m4 + present(P2)',
  presentIntro.pages.concat(presentBranch.pages));

if (!m4State.flags.atto3) throw new Error('atteso flags.atto3 (M4) impostato al termine del percorso obbligato');

/* ==================== interazioni opzionali (misurate, non solo elencate)
 * BFS reale dal punto già raggiunto dal percorso obbligato più vicino sulla
 * stessa mappa; pagine/caratteri letti direttamente dai dati statici (stesso
 * dialoguePagesInfo delle interazioni obbligatorie per i dialoghi classici,
 * doNode del runtime M4 per infermiera_ctx) — NON si rigioca un secondo
 * playthrough completo con la dialogue box: si e' preferita questa via più
 * semplice a un secondo passaggio integrale, pur restituendo tiles/pagine/
 * caratteri MISURATI e non solo enumerati (si veda "Limiti dichiarati"). */

// hotel_gn: Ben Horne, Audrey (variante "_ben", visitata dopo Ben Horne)
const benhorneApproach = approachNpcTile('hotel_gn', 'benhorne', [5, 6]);
recordOptional('Ben Horne', 'hotel_gn', 'classico', 'benhorne_a2', hotelGnEntry, benhorneApproach, dialoguePagesInfo('benhorne_a2'));
const audreyNpc = GAME.Maps.hotel_gn.npcs.find((n) => n.id === 'audrey');
const audreyResolved = E.resolveDialogue(audreyNpc.dialogue, { evidence: {}, flags: { done_benhorne_a2: true }, clues: [] });
const audreyApproach = approachNpcTile('hotel_gn', 'audrey', [12, 10]);
recordOptional('Audrey (dopo Ben Horne)', 'hotel_gn', 'classico', audreyResolved, hotelGnEntry, audreyApproach, dialoguePagesInfo(audreyResolved));

// sceriffo: Hawk (dal punto in cui si e' raggiunto Truman la prima volta)
const hawkApproach = approachNpcTile('sheriff', 'hawk', [13, 8]);
recordOptional('Hawk', 'sheriff', 'classico', 'hawk_a2', trumanApproach1, hawkApproach, dialoguePagesInfo('hawk_a2'));

// ospedale: Gerard (dal letto di Ronette), infermiera_ctx (nodo M4, stesso comodino: 0 tile)
const gerardApproach = approachNpcTile('hospital', 'gerard', [12, 4]);
recordOptional('Gerard', 'hospital', 'classico', 'gerard_a2', ronetteBedApproach, gerardApproach, dialoguePagesInfo('gerard_a2'));
const infNode = doNode(m4State, 'infermiera_ctx');
optionalBeats.push({
  label: 'Infermiera (contesto, M4)', mapId: 'hospital', system: 'narrativo(M4)', id: 'infermiera_ctx',
  walkTiles: 0, approx: false,
  pages: infNode.pages.length, chars: infNode.pages.reduce((s, p) => s + (p.text ? p.text.length : 0), 0)
});

// diner: Norma (dal punto in cui si e' raggiunto James)
const normaApproach = approachNpcTile('diner', 'norma', [5, 1]);
recordOptional('Norma', 'diner', 'classico', 'norma_a2', jamesApproach, normaApproach, dialoguePagesInfo('norma_a2'));

// room_315 (visitato all'inizio, prima di uscire verso hotel_gn): letto, specchio
const room315Spawn = { x: 2, y: 6 };
const lettoTarget = findApproachTile('room_315', 2, 5, [2, 5]);
recordOptional('Letto (room 315)', 'room_315', 'classico', 'letto_315', room315Spawn, lettoTarget, dialoguePagesInfo('letto_315'));
const specchioResolved = E.resolveDialogue(GAME.INTERACT_DLG.specchio315, { evidence: {}, flags: {}, clues: [] });
const specchioApproach = findApproachTile('room_315', 13, 3, [13, 4]);
recordOptional('Specchio (room 315)', 'room_315', 'classico', specchioResolved, room315Spawn, specchioApproach, dialoguePagesInfo(specchioResolved));

// room_315: scrivania, come detour DOPO Ronette (l'evidenza T1_RONETTE_BOB e'
// scritta solo nello stato del runtime M4, non sui flag classici di E.state:
// per questo beat opzionale la si specchia manualmente su S().evidence per
// misurare la variante "_bob", realmente raggiungibile a quel punto della
// storia — si veda la nota nei limiti dichiarati).
const scrivaniaResolved = E.resolveDialogue(GAME.INTERACT_DLG.scrivania_315, { evidence: { T1_RONETTE_BOB: true }, flags: {}, clues: [] });
const scrivaniaApproach = findApproachTile('room_315', 8, 3, [8, 4]);
// mappa diversa dall'ultima posizione obbligatoria (sheriff): Manhattan diretto,
// stessa approssimazione dichiarata di crossDoor ma qui volutamente collassata
// in UN solo salto (nessun instradamento intermedio sceriffo->piazzale->
// town->hotel_gn->room_315 per una deviazione opzionale).
const scrivaniaWalk = Math.abs(scrivaniaApproach.x - trumanApproach2.x) + Math.abs(scrivaniaApproach.y - trumanApproach2.y);
approxNotes.push(`opzionale "Scrivania (room 315, dopo Ronette)": salto diretto sheriff(${trumanApproach2.x},${trumanApproach2.y}) -> room_315(${scrivaniaApproach.x},${scrivaniaApproach.y}), Manhattan, instradamento intermedio non modellato`);
optionalBeats.push({
  label: 'Scrivania (room 315, dopo Ronette)', mapId: 'room_315', system: 'classico', id: scrivaniaResolved,
  walkTiles: scrivaniaWalk, approx: true,
  pages: dialoguePagesInfo(scrivaniaResolved).pages, chars: dialoguePagesInfo(scrivaniaResolved).chars
});

/* ==================== calcoli di tempo ============================= */

const mapBeats = beats.filter((b) => b.kind === 'map');
const contentBeats = beats.filter((b) => b.kind === 'dialogue' || b.kind === 'm4');

const totalWalkTiles = mapBeats.reduce((s, b) => s + b.walkTiles, 0);
const totalWalkSec = totalWalkTiles / TILES_PER_SEC;

const totalChars = contentBeats.reduce((s, b) => s + b.chars, 0);
const totalPages = contentBeats.reduce((s, b) => s + b.pages, 0);
const totalReadingSec12 = totalChars / CHARS_PER_SEC + totalPages * SEC_PER_PAGE_INPUT;
const totalReadingSec15 = totalChars / CHARS_PER_SEC_FAST + totalPages * SEC_PER_PAGE_INPUT;

const optWalkTiles = optionalBeats.reduce((s, b) => s + b.walkTiles, 0);
const optChars = optionalBeats.reduce((s, b) => s + b.chars, 0);
const optPages = optionalBeats.reduce((s, b) => s + b.pages, 0);
const optReadingSec12 = optChars / CHARS_PER_SEC + optPages * SEC_PER_PAGE_INPUT;
const optReadingSec15 = optChars / CHARS_PER_SEC_FAST + optPages * SEC_PER_PAGE_INPUT;
const optWalkSec = optWalkTiles / TILES_PER_SEC;

const longest = contentBeats.reduce((best, b) => (b.chars > (best ? best.chars : -1) ? b : best), null);

const totalSec12 = totalWalkSec + totalReadingSec12;
const totalSec15 = totalWalkSec + totalReadingSec15;
const totalSec12WithOpt = totalWalkSec + optWalkSec + totalReadingSec12 + optReadingSec12;
const totalSec15WithOpt = totalWalkSec + optWalkSec + totalReadingSec15 + optReadingSec15;

/* ==================== report markdown =============================== */

function fmt(n, d = 1) { return Number(n).toFixed(d); }

let md = '';
md += '# Pacing Atto 2 (NVS02) — stato attuale\n\n';
md += 'Misurato headless con `node test/probe-act2-pacing.js`, a partire direttamente dal risveglio in `room_315` ' +
  '(non ri-simula l\'Atto 1) fino alla presentazione a Truman del nesso P2 (nodo M4 `present_truman_m4`, che imposta ' +
  '`flags.atto3` nel runtime narrativo).\n\n';
md += `Velocita' giocatore reale (da \`js/engine.js\`): SPEED=${SPEED}, TILE=${TILE_PX}px -> ${fmt(MS_PER_TILE, 2)} ms/tile (${fmt(TILES_PER_SEC, 3)} tile/s).\n\n`;
md += `Velocita' di lettura stimata: ${CHARS_PER_SEC} caratteri/s (riferimento) e ${CHARS_PER_SEC_FAST} caratteri/s (lettore veloce), + ${SEC_PER_PAGE_INPUT}s per pagina (tempo di lettura/input).\n\n`;
md += 'Il testo live dell\'Atto 2 arriva da due sistemi: dialoghi **classici** (`js/data.js`, colonna Sistema = `classico`) ' +
  'e nodi del **runtime narrativo M4** (`narrative/missions/M4.json`, colonna Sistema = `narrativo(M4)`), misurati chiamando ' +
  'direttamente `prepareNode`/`commitNode`/`prepareChoice`/`commitChoice`/`preparePresentation`/`commitPresentation`, mai attraverso la dialogue box classica.\n\n';

md += '## Beat per beat (percorso obbligato)\n\n';
md += '| # | Tipo | Sistema | Dettaglio | Tiles a piedi | Sec. camminati | Pagine | Caratteri | Sec. lettura (12cps) | Sec. lettura (15cps) |\n';
md += '|---|------|---------|-----------|---------------:|----------------:|-------:|----------:|---------------:|---------------:|\n';
let i = 0;
beats.forEach((b) => {
  i++;
  if (b.kind === 'map') {
    const sec = b.walkTiles / TILES_PER_SEC;
    const approxTag = b.approx ? ' (~approx)' : '';
    md += `| ${i} | mappa | — | ${b.mapId} @(${b.tx},${b.ty})${approxTag}${b.note ? ' — ' + b.note : ''} | ${b.walkTiles} | ${fmt(sec, 2)} | | | | |\n`;
  } else if (b.kind === 'dialogue' || b.kind === 'm4') {
    const sec12 = b.chars / CHARS_PER_SEC + b.pages * SEC_PER_PAGE_INPUT;
    const sec15 = b.chars / CHARS_PER_SEC_FAST + b.pages * SEC_PER_PAGE_INPUT;
    md += `| ${i} | ${b.kind === 'm4' ? 'nodo M4' : 'dialogo'} | ${b.system} | ${b.label} (\`${b.id}\`) | | | ${b.pages} | ${b.chars} | ${fmt(sec12, 2)} | ${fmt(sec15, 2)} |\n`;
  }
});
md += '\n';

md += '## Totali (a) solo percorso obbligato\n\n';
md += '| Metrica | Valore |\n|---|---|\n';
md += `| Camminata totale (tile) | ${totalWalkTiles} |\n`;
md += `| Camminata totale (sec) | ${fmt(totalWalkSec, 1)} |\n`;
md += `| Interazioni obbligatorie (dialoghi classici + nodi M4) | ${contentBeats.length} |\n`;
md += `| Pagine totali | ${totalPages} |\n`;
md += `| Caratteri totali | ${totalChars} |\n`;
md += `| Tempo di lettura a 12 caratteri/s (sec) | ${fmt(totalReadingSec12, 1)} |\n`;
md += `| Tempo di lettura a 15 caratteri/s (sec) | ${fmt(totalReadingSec15, 1)} |\n`;
md += `| **Tempo totale (12cps): cammino + lettura** | **${fmt(totalSec12, 1)} sec (~${fmt(totalSec12 / 60, 1)} min)** |\n`;
md += `| **Tempo totale (15cps): cammino + lettura** | **${fmt(totalSec15, 1)} sec (~${fmt(totalSec15 / 60, 1)} min)** |\n`;
md += '\n';

md += '## Totali (b) percorso obbligato + tutte le opzionali misurate\n\n';
md += '| Metrica | Valore |\n|---|---|\n';
md += `| Camminata totale (tile, obbl.+opz.) | ${totalWalkTiles + optWalkTiles} |\n`;
md += `| Camminata totale (sec, obbl.+opz.) | ${fmt(totalWalkSec + optWalkSec, 1)} |\n`;
md += `| Interazioni totali (obbl.+opz.) | ${contentBeats.length + optionalBeats.length} |\n`;
md += `| Pagine totali (obbl.+opz.) | ${totalPages + optPages} |\n`;
md += `| Caratteri totali (obbl.+opz.) | ${totalChars + optChars} |\n`;
md += `| Tempo di lettura a 12 caratteri/s (sec, obbl.+opz.) | ${fmt(totalReadingSec12 + optReadingSec12, 1)} |\n`;
md += `| Tempo di lettura a 15 caratteri/s (sec, obbl.+opz.) | ${fmt(totalReadingSec15 + optReadingSec15, 1)} |\n`;
md += `| **Tempo totale (12cps): cammino + lettura, obbl.+opz.** | **${fmt(totalSec12WithOpt, 1)} sec (~${fmt(totalSec12WithOpt / 60, 1)} min)** |\n`;
md += `| **Tempo totale (15cps): cammino + lettura, obbl.+opz.** | **${fmt(totalSec15WithOpt, 1)} sec (~${fmt(totalSec15WithOpt / 60, 1)} min)** |\n`;
md += '\n';

md += '## Tempo prima della prima interazione significativa\n\n';
md += 'Somma di tile/secondi camminati dallo spawn in `room_315` (dopo il monologo del risveglio, ESCLUSO) fino alla ' +
  'tile di approccio a Truman (prima visita, prima di `truman_a2`): attraversa room_315 -> hotel_gn -> town -> ' +
  'sheriffs_station_exterior -> sheriff. Include SOLO cammino, non il dialogo di risveglio.\n\n';
md += `- Tile camminati: **${walkTilesBeforeFirstInteraction}**\n`;
md += `- Secondi camminati: **${fmt(walkTilesBeforeFirstInteraction / TILES_PER_SEC, 1)}**\n\n`;

md += '## Dialogo/nodo piu\' lungo (percorso obbligato)\n\n';
md += longest
  ? `\`${longest.id}\` — ${longest.label} (sistema: ${longest.system}) — ${longest.chars} caratteri, ${longest.pages} pagine (~${fmt(longest.chars / CHARS_PER_SEC + longest.pages * SEC_PER_PAGE_INPUT, 1)}s a 12cps).\n\n`
  : 'nessuno.\n\n';

md += '## Conteggi\n\n';
md += '| Metrica | Valore |\n|---|---|\n';
md += `| Interazioni obbligatorie (dialoghi + nodi M4) | ${contentBeats.length} |\n`;
md += `| Interazioni opzionali misurate | ${optionalBeats.length} |\n`;
md += `| Tile camminati (solo obbligatorio) | ${totalWalkTiles} |\n`;
md += `| Tile camminati (obbligatorio + opzionale) | ${totalWalkTiles + optWalkTiles} |\n`;
md += '\n';

md += '## Interazioni opzionali (misurate: BFS reale + pagine/caratteri statici)\n\n';
md += '| Mappa | Sistema | Etichetta (id) | Tiles a piedi | Sec. camminati | Pagine | Caratteri | Sec. lettura (12cps) |\n';
md += '|---|---|---|---:|---:|---:|---:|---:|\n';
optionalBeats.forEach((o) => {
  const sec = o.walkTiles / TILES_PER_SEC;
  const readSec = o.chars / CHARS_PER_SEC + o.pages * SEC_PER_PAGE_INPUT;
  const approxTag = o.approx ? ' (~approx)' : '';
  md += `| ${o.mapId}${approxTag} | ${o.system} | ${o.label} (\`${o.id}\`) | ${o.walkTiles} | ${fmt(sec, 2)} | ${o.pages} | ${o.chars} | ${fmt(readSec, 2)} |\n`;
});
md += '\n';

if (approxNotes.length) {
  md += '## Note di approssimazione (cambi mappa / BFS senza percorso)\n\n';
  approxNotes.forEach((n) => { md += `- ${n}\n`; });
  md += '\n';
}

if (notesGeneral.length) {
  md += '## Altre note\n\n';
  notesGeneral.forEach((n) => { md += `- ${n}\n`; });
  md += '\n';
}

md += '## Limiti dichiarati\n\n';
md += '- Le distanze a piedi ENTRO la stessa mappa fra due interazioni consecutive sono BFS reale sulla griglia calpestabile ' +
  '(stessa nozione di "tile bloccato" di `test/walkthrough.js`/`test/probe-acts12-pacing.js`), valutata sullo stato reale della run.\n';
md += '- Ogni attraversamento di porta e\' scomposto in DUE beat: cammino fino alla porta (BFS reale sulla mappa di partenza) ' +
  'e arrivo sulla mappa successiva (Manhattan fra le coordinate della porta e lo spawn di arrivo, perche\' non si modella qui ' +
  'un router multi-hop reale fra porte diverse — stesso limite dichiarato di `test/probe-acts12-pacing.js`).\n';
md += '- Le porte con piu\' tile trigger (piazzali) usano la tile piu\' vicina alla posizione corrente, non un routing reale.\n';
md += '- Le interazioni OPZIONALI non vengono "giocate" attraverso la dialogue box classica: le pagine/caratteri sono letti ' +
  'direttamente dai dati statici (`GAME.Data.dialogues`/nodi M4, come per le obbligatorie), e la distanza a piedi e\' un BFS ' +
  'reale dal punto piu\' vicino gia\' raggiunto dal percorso obbligato sulla stessa mappa — non un secondo playthrough integrale ' +
  'con motore e stato duplicati. E\' una via di mezzo dichiarata fra "solo enumerazione" (come nel riferimento Atto1->2) e un ' +
  'secondo passaggio completo: restituisce cifre misurate (non solo un elenco), a un costo di implementazione minore.\n';
md += '- Il beat opzionale "Scrivania (room 315, dopo Ronette)" collassa in un UNICO salto Manhattan l\'intero instradamento ' +
  'sheriff -> piazzale -> town -> hotel_gn -> room_315: e\' una deviazione facoltativa di fine tratto, non si e\' ritenuto utile ' +
  'scomporla porta per porta come il percorso obbligato.\n';
md += '- Sincronizzazione flag classici / runtime M4: `T1_RONETTE_BOB` viene scritto SOLO su `m4State.evidence` (runtime M4) ' +
  'dalla scelta `ronette_uomo`, mai su `S().evidence` (stato classico di `E.state`, usato da `E.resolveDialogue` per la cascata ' +
  'di `scrivania_315`). Per misurare la variante "_bob" — quella realmente raggiungibile narrativamente a quel punto — il beat ' +
  'opzionale della scrivania specchia manualmente `T1_RONETTE_BOB: true` in un oggetto di stato passato a `E.resolveDialogue`, ' +
  'senza toccare `S()` reale: e\' una lettura mirata, non un\'integrazione dei due sistemi.\n';
md += '- Tempo di lettura: stima lineare caratteri/velocita\' + costante per pagina; non modella riletture, esitazioni o skip.\n';
md += '- `truman_a2`/`ronette_q`+`ronette_uomo`/`james_a2`/`cmp_e6a_tjames`+`b8_a`/`present_truman_m4`+P2 sono misurati ' +
  'chiamando direttamente le API del runtime M4 (non tramite `E.state.dialogue`): per `cmp_e6a_tjames` e `ronette_q`, il ' +
  'contenuto reso da una scelta (`feedback_pages`/nodo `goto`) e\' catturato esplicitamente dal `prepared` di `prepareChoice`, ' +
  'perche\' il wrapper `doChoice` di `test/act-2-flow.js`, copiato alla lettera, scarterebbe quelle pagine dal proprio return.\n';

fs.mkdirSync(path.join(__dirname, '..', 'artifacts', 'act-2-nvs02'), { recursive: true });
const outPath = path.join(__dirname, '..', 'artifacts', 'act-2-nvs02', 'pacing.md');
fs.writeFileSync(outPath, md);

console.log(md);
console.log(`\nReport scritto in ${outPath}`);
