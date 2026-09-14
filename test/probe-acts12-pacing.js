/* probe-acts12-pacing.js — diagnostica, NON tocca file di produzione.
 * Segue lo stesso percorso obbligato Atto 1 -> Atto 2 usato da test/smoke.js
 * (dallo spawno in citta' fino al primo trigger di Atto 3, cioe' il dialogo
 * "truman_atto3" che imposta flag:atto3), pero' invece di teleportare il
 * giocatore con E.loadMap ad ogni interazione calcola la distanza reale a
 * piedi (BFS sulla griglia calpestabile della mappa corrente) fra
 * un'interazione e la successiva, quando le due condividono la mappa.
 *
 * Limite dichiarato: quando un'interazione richiede il cambio mappa, la
 * distanza "a piedi" dentro la mappa di partenza (fino alla porta piu'
 * vicina verso la mappa successiva, se il gioco ne definisce una) e dentro
 * la mappa di arrivo (dal punto di ingresso fino al bersaglio) SONO
 * approssimate con la distanza di Manhattan fra le coordinate riga/colonna,
 * perche' walkthrough.js non modella un multi-hop reale fra porte diverse e
 * qui non si vuole reimplementare un router di mappe: e' un'approssimazione,
 * segnalata come tale nel report.
 *
 * Esegui con: node test/probe-acts12-pacing.js
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
require(J('retro-font.js'));
require(J('engine.js'));
require(J('glue.js'));
require(J('location-connections.js'));
require(J('double-r-exterior-art.js'));
require(J('double-r-exterior-scene.js'));
require(J('world-connections.gen.js'));
require(J('sheriffs-station-exterior-scene.js'));
require(J('sheriffs-station-scene.js'));
global.GAME.DoubleRExteriorScene.install();
global.GAME.SheriffsStationExteriorScene.install();
global.GAME.SheriffsStationScene.install();
require(J('world-connections-production.js')); // every registry door (js/maps.js carries none)

const GAME = global.GAME;
const E = GAME.Engine;
const S = () => E.state;

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
const SEC_PER_PAGE_INPUT = 0.6; // tempo per registrare/premere Invio a pagina letta

/* ---------------- BFS distanza a piedi sulla griglia calpestabile ------ */
// Stessa nozione di "tile bloccato" di walkthrough.js: solidita' del
// terreno + porte non attraversabili + NPC attivi + oggetti, ma valutata
// sullo stato REALE della partita (S()), non su uno stato simulato.
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
// Ritorna null se non raggiungibile (non dovrebbe accadere sul percorso
// obbligato, ma non si vuole far esplodere il probe: si segnala e si
// ricade sull'approssimazione di Manhattan).
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
      // la tile bersaglio stessa puo' essere "bloccata" (es. tile dell'NPC
      // o dell'oggetto con cui si interagisce): la si accetta comunque come
      // arrivo, il blocco vale solo per l'attraversamento intermedio.
      const isTarget = nx === x1 && ny === y1;
      if (!isTarget && tileBlocked(mapId, nx, ny)) continue;
      seen.add(k);
      if (isTarget) return cur.d + 1;
      queue.push({ x: nx, y: ny, d: cur.d + 1 });
    }
  }
  return null;
}

/* ---------------- log strutturato --------------------------------- */

const beats = []; // {kind, ...}
let lastMap = null, lastX = null, lastY = null;
let approxNotes = [];

function recordMapChange(mapId, tx, ty) {
  const entry = { kind: 'map', mapId, tx, ty };
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
    // cambio mappa: distanza NON calcolabile con un BFS single-map, per
    // dichiarazione esplicita del task si approssima con Manhattan fra le
    // coordinate riga/colonna (ignora topologia porte/scale multiple).
    entry.walkTiles = Math.abs(tx - lastX) + Math.abs(ty - lastY);
    entry.approx = true;
    approxNotes.push(`${lastMap}(${lastX},${lastY}) -> ${mapId}(${tx},${ty}): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato`);
  }
  beats.push(entry);
  lastMap = mapId; lastX = tx; lastY = ty;
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
  beats.push({ kind: 'dialogue', label, id, pages: info.pages, chars: info.chars });
}

function recordFlag(flag) {
  beats.push({ kind: 'flag', flag });
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

function loadMapAndLog(mapId, tx, ty, dir) {
  E.loadMap(mapId, tx, ty, dir);
  recordMapChange(mapId, tx, ty);
}

/* ---------------- flag gia' presenti prima del percorso, per il diff --- */
function flagSnapshot() { return Object.assign({}, S().flags); }
function logNewFlags(before) {
  const after = S().flags;
  Object.keys(after).forEach((f) => {
    if (!before[f] && after[f]) { recordFlag(f); before[f] = true; }
  });
}

/* ==================== PERCORSO OBBLIGATO ATTO 1 -> ATTO 2 =============
 * Identico, passo per passo, alla sezione "2. partita completa" di
 * test/smoke.js fino al dialogo "truman_atto3" incluso (primo trigger di
 * Atto 3: imposta flag:atto3). Le interazioni OPZIONALI note lungo il
 * percorso (npc/oggetti raggiungibili ma non obbligatori) sono elencate a
 * parte piu' sotto, enumerate via walkthrough-style reachability, non
 * simulate qui passo-passo. */

E.init(canvasStub);
E.start();
pump(32);
if (S().mode !== 'title') throw new Error('atteso mode=title dopo lo start');

let flagsBefore = flagSnapshot();

key('Enter'); pump(16); // titolo -> intro
const introPages = E.introPages();
for (let i = 0; i < introPages.length; i++) key('Enter');
pump(16); // intro -> play
if (S().mode !== 'play') throw new Error('atteso mode=play dopo il prologo');

recordMapChange(S().mapId, S().player.tx, S().player.ty); // spawn iniziale (town 28,31)

// Truman: consegna il diario
loadMapAndLog('sheriff', 11, 4, 'left');
key('Enter'); pump(16);
drainDialogueAndLog('Truman iniziale');
logNewFlags(flagsBefore);

// camera di Laura: cuore + lettera R
loadMapAndLog('palmer', 6, 2, 'up');
key('Enter'); pump(16);
drainDialogueAndLog('camera di Laura');
logNewFlags(flagsBefore);

// bosco -> Stanza Rossa camminando fino alla porta della Lodge (14,4)
loadMapAndLog('woods', 14, 5, 'up');
const woodsWalkStart = { x: S().player.tx, y: S().player.ty };
hold('ArrowUp', 800);
pump(600); // dissolvenza + warp
// la camminata nel bosco e' un vero hold di movimento (non loadMap): la
// registriamo come beat di movimento reale, 1 tile verticale (14,5 -> 14,4)
// prima del warp automatico in redroom.
beats.push({ kind: 'map', mapId: 'redroom', tx: S().player.tx, ty: S().player.ty, walkTiles: 1, approx: false, note: 'hold ArrowUp nel bosco fino alla porta della Lodge, poi warp automatico' });
lastMap = S().mapId; lastX = S().player.tx; lastY = S().player.ty;

// Nano: flag met_mfap
loadMapAndLog('redroom', 8, 5, 'up');
key('Enter'); pump(16);
drainDialogueAndLog('Nano (mfap)');
logNewFlags(flagsBefore);

// Laura: il sogno
loadMapAndLog('redroom', 11, 3, 'up');
key('Enter'); pump(16);
drainDialogueAndLog('sogno di Laura');
logNewFlags(flagsBefore);

// Truman: racconta il sogno (ponte Atto1->Atto2)
loadMapAndLog('sheriff', 11, 4, 'left');
key('Enter'); pump(16);
drainDialogueAndLog('Truman post-sogno');
logNewFlags(flagsBefore);

// Great Northern: Ben Horne e Audrey
loadMapAndLog('hotel_gn', 5, 6, 'down');
key('Enter'); pump(16);
drainDialogueAndLog('Ben Horne');
logNewFlags(flagsBefore);

loadMapAndLog('hotel_gn', 12, 10, 'up');
key('Enter'); pump(16);
drainDialogueAndLog('Audrey (Great Northern)');
logNewFlags(flagsBefore);

// ospedale: Gerard (poesia del fuoco), Ronette (BOB)
loadMapAndLog('hospital', 12, 4, 'left');
key('Enter'); pump(16);
drainDialogueAndLog('Gerard');
logNewFlags(flagsBefore);

loadMapAndLog('hospital', 3, 6, 'up');
key('Enter'); pump(16);
drainDialogueAndLog('Ronette');
logNewFlags(flagsBefore);

// Double R: James, l'altra meta' del cuore
loadMapAndLog('diner', 9, 7, 'up');
key('Enter'); pump(16);
drainDialogueAndLog('James');
logNewFlags(flagsBefore);

// Truman: chiusura Atto2, PRIMO TRIGGER DI ATTO 3 (flag:atto3)
loadMapAndLog('sheriff', 11, 4, 'left');
key('Enter'); pump(16);
drainDialogueAndLog('Truman Atto 3 (trigger)');
logNewFlags(flagsBefore);

if (!S().flags.atto3) throw new Error('atteso flag:atto3 impostato al termine del percorso');

/* ==================== interazioni opzionali raggiungibili lungo il percorso ====
 * Non simulate passo-passo: per ogni mappa toccata dal percorso obbligato,
 * si enumerano NPC/oggetti presenti che NON fanno parte della sequenza
 * sopra ma sono raggiungibili con lo stato di flag/indizi finale di questo
 * tratto (quindi una sovrastima prudente: alcuni potrebbero sbloccarsi solo
 * più avanti nel tratto, non a inizio tratto). */
const mandatoryDialogueIds = new Set(beats.filter((b) => b.kind === 'dialogue').map((b) => b.id));
const touchedMaps = [...new Set(beats.filter((b) => b.kind === 'map').map((b) => b.mapId))];
const optionalByMap = {};
let optionalTotal = 0;
touchedMaps.forEach((mapId) => {
  const map = GAME.Maps[mapId];
  if (!map) return;
  const list = [];
  (map.npcs || []).forEach((n) => {
    if (!E.npcActive(n, S())) return;
    const ids = (typeof n.dialogue === 'string') ? [n.dialogue] : [];
    ids.forEach((id) => { if (id && !mandatoryDialogueIds.has(id)) list.push({ kind: 'npc', id: n.id, dialogue: id }); });
  });
  (map.objects || []).forEach((o) => {
    const d = o.dialogue;
    const ids = (typeof d === 'string') ? [d] : [];
    ids.forEach((id) => { if (id && !mandatoryDialogueIds.has(id)) list.push({ kind: 'object', at: `${o.x},${o.y}`, dialogue: id }); });
  });
  optionalByMap[mapId] = list;
  optionalTotal += list.length;
});

/* ==================== calcoli di tempo ============================= */

const mapBeats = beats.filter((b) => b.kind === 'map');
const dialogueBeats = beats.filter((b) => b.kind === 'dialogue');
const flagBeats = beats.filter((b) => b.kind === 'flag');

const totalWalkTiles = mapBeats.reduce((s, b) => s + b.walkTiles, 0);
const totalWalkSec = totalWalkTiles / TILES_PER_SEC;

const totalDialogueChars = dialogueBeats.reduce((s, b) => s + b.chars, 0);
const totalDialoguePages = dialogueBeats.reduce((s, b) => s + b.pages, 0);
const totalReadingSec = totalDialogueChars / CHARS_PER_SEC + totalDialoguePages * SEC_PER_PAGE_INPUT;

const longest = dialogueBeats.reduce((best, b) => (b.chars > (best ? best.chars : -1) ? b : best), null);

const totalSec = totalWalkSec + totalReadingSec;

/* ==================== report markdown =============================== */

function fmt(n, d = 1) { return Number(n).toFixed(d); }

let md = '';
md += '# Pacing Atto 1 -> Atto 2 (stato attuale)\n\n';
md += `Misurato headless con \`node test/probe-acts12-pacing.js\`, ripercorrendo esattamente il percorso obbligato di \`test/smoke.js\` fino al primo trigger di Atto 3 (dialogo \`truman_atto3\`, flag \`atto3\`).\n\n`;
md += `Velocita' giocatore reale (da \`js/engine.js\`): SPEED=${SPEED}, TILE=${TILE_PX}px -> ${fmt(MS_PER_TILE, 2)} ms/tile (${fmt(TILES_PER_SEC, 3)} tile/s).\n\n`;
md += `Velocita' di lettura stimata: ${CHARS_PER_SEC} caratteri/s + ${SEC_PER_PAGE_INPUT}s per pagina (tempo di lettura/input).\n\n`;

md += '## Beat per beat\n\n';
md += '| # | Tipo | Dettaglio | Tiles a piedi | Sec. camminati | Pagine | Caratteri | Sec. lettura |\n';
md += '|---|------|-----------|---------------:|----------------:|-------:|----------:|---------------:|\n';
let i = 0;
let runningWalk = 0, runningRead = 0;
beats.forEach((b) => {
  i++;
  if (b.kind === 'map') {
    const sec = b.walkTiles / TILES_PER_SEC;
    runningWalk += sec;
    const approxTag = b.approx ? ' (~approx)' : '';
    md += `| ${i} | mappa | ${b.mapId} @(${b.tx},${b.ty})${approxTag}${b.note ? ' — ' + b.note : ''} | ${b.walkTiles} | ${fmt(sec, 2)} | | | |\n`;
  } else if (b.kind === 'dialogue') {
    const sec = b.chars / CHARS_PER_SEC + b.pages * SEC_PER_PAGE_INPUT;
    runningRead += sec;
    md += `| ${i} | dialogo | ${b.label} (\`${b.id}\`) | | | ${b.pages} | ${b.chars} | ${fmt(sec, 2)} |\n`;
  } else if (b.kind === 'flag') {
    md += `| ${i} | flag | \`${b.flag}\` impostato | | | | | |\n`;
  }
});
md += '\n';

md += '## Riepilogo\n\n';
md += '| Metrica | Valore |\n|---|---|\n';
md += `| Camminata totale (tile) | ${totalWalkTiles} |\n`;
md += `| Camminata totale (sec) | ${fmt(totalWalkSec, 1)} |\n`;
md += `| Interazioni obbligatorie (dialoghi) | ${dialogueBeats.length} |\n`;
md += `| Pagine totali di dialogo obbligatorio | ${totalDialoguePages} |\n`;
md += `| Caratteri totali di dialogo obbligatorio | ${totalDialogueChars} |\n`;
md += `| Tempo di lettura stimato (sec) | ${fmt(totalReadingSec, 1)} |\n`;
md += `| Dialogo obbligatorio piu' lungo | \`${longest ? longest.id : '-'}\` (${longest ? longest.chars : 0} caratteri, ${longest ? longest.pages : 0} pagine) |\n`;
md += `| Flag impostati lungo il percorso | ${flagBeats.length} (${flagBeats.map((f) => f.flag).join(', ')}) |\n`;
md += `| Interazioni opzionali raggiungibili sulle mappe toccate | ${optionalTotal} |\n`;
md += `| **Tempo totale stimato (cammino + lettura)** | **${fmt(totalSec, 1)} sec (~${fmt(totalSec / 60, 1)} min)** |\n`;
md += '\n';

md += '## Interazioni opzionali per mappa (stima prudente per eccesso)\n\n';
md += 'NPC/oggetti presenti e attivi con lo stato di flag/indizi raggiunto a fine tratto, non parte della sequenza obbligata. Alcuni potrebbero sbloccarsi solo più avanti nel tratto stesso (sovrastima).\n\n';
md += '| Mappa | Opzionali | Elenco |\n|---|---:|---|\n';
touchedMaps.forEach((mapId) => {
  const list = optionalByMap[mapId] || [];
  md += `| ${mapId} | ${list.length} | ${list.map((o) => `${o.kind}:${o.id || o.at} (\`${o.dialogue}\`)`).join(', ') || '-'} |\n`;
});
md += '\n';

if (approxNotes.length) {
  md += '## Note di approssimazione\n\n';
  md += 'Distanze NON derivate da BFS reale (cambio mappa: la topologia porta-a-porta multi-hop non è modellata qui, per scelta dichiarata nel task; si usa Manhattan riga/colonna fra le coordinate di arrivo/partenza registrate):\n\n';
  approxNotes.forEach((n) => { md += `- ${n}\n`; });
  md += '\n';
}

md += '## Limiti dichiarati\n\n';
md += '- Le distanze a piedi ENTRO la stessa mappa fra due interazioni consecutive sono BFS reale sulla griglia calpestabile (stessa nozione di "tile bloccato" di `test/walkthrough.js`: solidità, porte, NPC attivi, oggetti), valutata sullo stato reale della run.\n';
md += '- Le distanze quando l\'interazione successiva richiede un CAMBIO MAPPA sono approssimate con Manhattan fra le coordinate registrate (riga/colonna), come esplicitamente concesso dal task: non si modella qui il routing porta-a-porta fra mappe diverse.\n';
md += '- Il tratto nel bosco (bosco -> Stanza Rossa) usa un vero `hold(ArrowUp, 800ms)`: la distanza a piedi lì è 1 tile reale prima del warp automatico, il resto del tempo di hold è dissolvenza/caricamento, non camminata a tile aggiuntivi (non ci sono altri tile calpestabili fra 14,5 e 14,4 su quella mappa in questo punto).\n';
md += '- Tempo di lettura: stima lineare caratteri/velocità + costante per pagina; non modella riletture, esitazioni o skip.\n';

fs.mkdirSync(path.join(__dirname, '..', 'artifacts', 'narrative-vertical-slice-01'), { recursive: true });
const outPath = path.join(__dirname, '..', 'artifacts', 'narrative-vertical-slice-01', 'original-pacing.md');
fs.writeFileSync(outPath, md);

console.log(md);
console.log(`\nReport scritto in ${outPath}`);
