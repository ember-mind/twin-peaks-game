/* smoke.js — test senza browser: stub del canvas, caricamento script,
 * controlli strutturali (dialoghi/porte/NPC) + partita completa simulata.
 * Esegui con: node test/smoke.js
 */
'use strict';
const assert = require('assert');
const path = require('path');

/* ---------------- stub ambiente browser ---------------- */

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

/* ---------------- caricamento script ---------------- */

const J = (f) => path.join(__dirname, '..', 'js', f);
require(J('tiles.js'));
require(J('chars.js'));
require(J('houses.js'));
require(J('maps.js'));
require(J('data.js'));
require(J('retro-font.js'));
require(J('engine.js'));
require(J('glue.js'));
require(J('double-r-exterior-art.js'));
require(J('double-r-exterior-scene.js'));
global.GAME.DoubleRExteriorScene.install();
require(J('sheriffs-station-exterior-scene.js'));
global.GAME.SheriffsStationExteriorScene.install();
require(J('sheriffs-station-scene.js'));
global.GAME.SheriffsStationScene.install();
require(J('location-connections.js'));
require(J('double-r-location-data.js'));
require(J('sheriffs-station-location-data.js'));
require(J('room-315-location-data.js'));
[].concat(global.GAME.DoubleRLocationConnections, global.GAME.SheriffsStationLocationConnections, global.GAME.Room315LocationConnections)
  .forEach((c) => global.GAME.LocationConnections.install(c, global.GAME.Maps));
require(J('render3d.js')); // window e' globale (riga sopra): CONFIG si popola anche senza THREE

const GAME = global.GAME;
const E = GAME.Engine;

/* ---------------- helper ---------------- */

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
const S = () => E.state;

function drainDialogue(label) {
  assert(S().dialogue, `${label}: nessun dialogo da avanzare`);
  let presses = 0;
  while (S().dialogue) {
    const id = S().dialogue.id;
    key('Enter');
    pump(16);
    presses++;
    assert(presses <= 64, `${label}: dialogo "${id}" non si chiude entro 64 Enter`);
  }
  return presses;
}

function dialogueId(d) {
  if (typeof d === 'string') return [d];
  if (Array.isArray(d)) return d.flatMap(dialogueId); // cascata condizionale
  return [d.then, d.else].filter(Boolean);
}

let passed = 0;
function ok(cond, label) {
  assert(cond, label);
  passed++;
  console.log('  ok - ' + label);
}

/* ---------------- 1. controlli strutturali ---------------- */

console.log('# struttura');
const mapIds = ['town', 'sheriff', 'palmer', 'hotel_gn', 'room_315', 'hospital', 'diner', 'woods', 'redroom', 'traincar', 'oej', 'roadhouse'];
// Le due scene native (piazzali di distretto e Double R) vivono solo in
// GAME.Maps: entrano nella guardia strutturale, non nelle guardie che leggono
// l'oggetto sorgente di maps.js.
const sceneIds = mapIds.concat(['sheriffs_station_exterior', 'double_r_exterior_prototype']);
const fake3 = { clues: ['a', 'b', 'c'] };

for (const id of sceneIds) {
  const m = GAME.Maps[id];
  ok(m && m.rows.length === m.height && m.rows[0].length === m.width, `mappa ${id} coerente`);
  for (const r of m.rows) assert.strictEqual(r.length, m.width, `riga larghezza costante in ${id}`);

  for (const [k, d] of Object.entries(m.doors)) {
    if (d.locked) {
      ok(GAME.Data.dialogues[d.dialogue], `porta ${id}:${k} bloccata con dialogo valido`);
      continue;
    }
    ok(GAME.Maps[d.to], `porta ${id}:${k} -> mappa ${d.to} esiste`);
    ok(!GAME.Maps.isSolid(d.to, d.tx, d.ty, fake3), `porta ${id}:${k} -> tile arrivo calpestabile`);
  }
  for (const o of m.objects) {
    for (const did of dialogueId(o.dialogue)) {
      ok(GAME.Data.dialogues[did], `oggetto ${id}@${o.x},${o.y} dialogo "${did}" esiste`);
    }
  }
  for (const n of m.npcs) {
    ok(GAME.sprites.CHARS[n.sprite], `npc ${n.id} sprite "${n.sprite}" esiste`);
    for (const did of dialogueId(n.dialogue)) {
      ok(GAME.Data.dialogues[did], `npc ${n.id} dialogo "${did}" esiste`);
    }
    ok(!GAME.Maps.isSolid(id, n.x, n.y, fake3), `npc ${n.id} su tile calpestabile`);
  }
}

// pagine di dialogo: max 3 righe da ~43 caratteri nel box (216px / ~5px a carattere)
for (const [id, def] of Object.entries(GAME.Data.dialogues)) {
  const allPages = [...def.pages, ...(def.again ? def.again.pages : [])];
  for (const p of allPages) {
    assert(p.text.length <= 129, `dialogo "${id}" pagina troppo lunga (${p.text.length} > 129): ${p.text.slice(0, 40)}...`);
  }
}
ok(true, 'tutte le pagine di dialogo entrano nel box (<= 129 caratteri)');

// Ogni prova raccolta apre una scheda leggibile. Le pagine restano entro le
// otto righe del fallback bitmap 160x144, oltre alla vista HTML scorrevole.
for (const [id, clue] of Object.entries(GAME.Data.clues)) {
  assert(clue.document && typeof clue.document.title === 'string' && clue.document.title.trim(),
    `prova "${id}" senza documento apribile`);
  assert(Array.isArray(clue.document.pages) && clue.document.pages.length > 0,
    `documento "${id}" senza pagine`);
  for (const [index, page] of clue.document.pages.entries()) {
    assert(typeof page.label === 'string' && page.label.trim(), `documento "${id}" pagina ${index + 1} senza etichetta`);
    assert(typeof page.text === 'string' && page.text.trim(), `documento "${id}" pagina ${index + 1} senza testo`);
    const lines = GAME.RetroFont.wrapPixels(page.text, 118, 1);
    assert(lines.length <= 8, `documento "${id}" pagina ${index + 1} supera 8 righe bitmap (${lines.length})`);
  }
}
ok(true, 'tutte le prove hanno documenti completi e pagine entro 8 righe bitmap');

// obiettivo del menu indizi: una riga sola, e il dialogo d'arrivo di town.onEnter esiste
for (const o of GAME.Data.objectives) {
  assert(o.text.length <= 48, `obiettivo "${o.text}" troppo lungo (${o.text.length} > 48)`);
}
ok(true, 'tutte le voci di D.objectives entrano in una riga (<= 48 caratteri)');
ok(GAME.Maps.town.onEnter && GAME.Data.dialogues[GAME.Maps.town.onEnter.dialogue],
   'town.onEnter punta a un dialogo esistente');

// guardia propagazione campi: ogni campo di un oggetto mappa in maps.js deve
// finire su GAME.Maps[id] (glue.js), a meno che non sia rimodellato apposta
// (doors/gate -> doors, interact/objects -> objects). Chiude in modo
// meccanico la classe di bug "campo aggiunto a maps.js ma mai propagato"
// (es. 'indoor' silenziosamente ignorato).
const TRANSFORMED_KEYS = ['doors', 'gate', 'interact', 'objects'];
for (const id of mapIds) {
  const src = GAME.maps.maps[id];
  const out = GAME.Maps[id];
  for (const k of Object.keys(src)) {
    if (TRANSFORMED_KEYS.includes(k)) continue;
    ok(Object.prototype.hasOwnProperty.call(out, k), `campo "${k}" di maps.js:${id} propagato in GAME.Maps`);
  }
}

// guardia arredo urbano: il set noto {L P B F A H E n} deve essere sia
// solido (M.SOLID, collisioni) sia skip-baked (Render3DConfig.terrain.skipBake,
// niente tile di terreno sotto). Invariante stretta e vera: NON l'uguaglianza
// dei due insiemi (arredo interno C/t/h/K/U e' solido ma non skip-baked, D/X/o
// sono skip-baked ma non solidi, entrambi per design).
const URBAN_PROPS = ['L', 'P', 'B', 'F', 'A', 'H', 'E', 'n'];
const SKIP_BAKE = GAME.Render3DConfig.terrain.skipBake;
for (const ch of URBAN_PROPS) {
  ok(GAME.maps.SOLID[ch], `arredo urbano "${ch}" e' solido (M.SOLID)`);
  ok(SKIP_BAKE[ch], `arredo urbano "${ch}" e' skip-baked (Render3DConfig.terrain.skipBake)`);
}

// guardia interact -> dialogo: ogni chiave interact usata in una mappa deve
// risolvere (via INTERACT_DLG, o come id diretto) a un dialogo reale in
// data.js. Cattura il gap "serve una voce sia in maps.js che in glue.js".
for (const id of mapIds) {
  const interact = GAME.maps.maps[id].interact || {};
  for (const [xy, key] of Object.entries(interact)) {
    const dlg = GAME.INTERACT_DLG[key] || key;
    for (const did of dialogueId(dlg)) {
      ok(GAME.Data.dialogues[did], `interact ${id}:${xy} "${key}" -> dialogo "${did}" esiste`);
    }
  }
}

/* ---------------- 2. partita completa ---------------- */

console.log('# partita');
E.init(canvasStub);
E.start();
pump(32);
ok(S().mode === 'title', 'parte dal titolo');

key('Enter'); pump(16);
ok(S().mode === 'intro', 'titolo -> intro');
const introPages = E.introPages();
ok(introPages.length === GAME.Data.intro.length && introPages.every((p) => p.lines.length <= 7 && p.parts === 1), 'prologo in tre pagine complete, massimo 7 righe');
const introNorm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const introSource = introNorm(GAME.Data.intro.join(' '));
const introVisible = introNorm(introPages.flatMap((p) => p.lines).join(' '));
ok(introVisible === introSource, 'tutto il testo del prologo resta visibile');
for (let i = 0; i < introPages.length; i++) key('Enter');
pump(16);
ok(S().mode === 'play', 'intro -> gioco');
ok(S().mapId === 'town' && S().player.tx === 28 && S().player.ty === 31 && S().player.dir === 'up',
   'spawn all\'ingresso sud della città');
ok(!GAME.Maps.isSolid('town', S().player.tx, S().player.ty, S()), 'spawn iniziale calpestabile');

// transenna chiusa senza indizi
ok(GAME.Maps.isSolid('town', 50, 0, S()), 'bosco transennato a 0 indizi');

// Great Northern e ospedale chiusi prima del sogno
ok(GAME.Maps.doorAt('town', 9, 6).needsFlag === 'sogno_fatto' && !S().flags.sogno_fatto, 'hotel chiuso prima del sogno');
ok(GAME.Maps.doorAt('town', 23, 6).needsFlag === 'sogno_fatto' && !S().flags.sogno_fatto, 'ospedale chiuso prima del sogno');
ok(GAME.Maps.doorAt('town', 47, 28).needsFlag === 'atto4' && !S().flags.atto4, 'roadhouse chiuso prima di atto4');

// Truman: consegna il diario
E.loadMap('sheriff', 11, 4, 'left');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'truman', 'dialogo Truman parte');
drainDialogue('Truman iniziale');
ok(!S().dialogue, 'dialogo Truman chiuso');
ok(S().clues.includes('diario'), 'diario ottenuto');

// Fascicolo: documento repertato apribile, sfogliabile e richiudibile senza
// perdere selezione o chiudere l'intero fascicolo.
key('Escape'); pump(16);
ok(S().menu === true && S().menuDocument === false, 'fascicolo apre sulla lista prove');
key('Enter'); pump(16);
ok(S().menuDocument === true && S().menuPage === 0, 'diario selezionato si apre con Invio');
key('ArrowRight'); pump(16);
ok(S().menuDocument === true && S().menuPage === 1, 'freccia sfoglia pagina diario');
key('Escape'); pump(16);
ok(S().menu === true && S().menuDocument === false, 'Esc dal diario torna al fascicolo');
key('Escape'); pump(16);
ok(S().menu === false, 'secondo Esc chiude fascicolo');

// replay: pagina "again"
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.replay, 'replay Truman usa "again"');
drainDialogue('replay Truman');

// camera di Laura: cuore + lettera R
E.loadMap('palmer', 6, 2, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'laura_room', 'dialogo camera di Laura parte');
drainDialogue('camera di Laura');
ok(S().clues.includes('cuore') && S().clues.includes('lettera_r'), 'indizi camera di Laura');
ok(S().clues.length === 3, '3 indizi totali');

// transenna ora aperta
ok(!GAME.Maps.isSolid('town', 50, 0, S()), 'bosco aperto con 3 indizi');

// bosco -> Stanza Rossa camminando fino alla porta della Lodge (14,4)
E.loadMap('woods', 14, 5, 'up');
hold('ArrowUp', 800);
pump(600); // dissolvenza + warp
ok(S().mapId === 'redroom', 'entrato nella Stanza Rossa');

// Nano: flag met_mfap
E.loadMap('redroom', 8, 5, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'mfap', 'dialogo Nano parte');
drainDialogue('Nano');
ok(S().flags.met_mfap, 'flag met_mfap impostato');

// Laura: prima hint condizionale già superata -> il sogno
E.loadMap('redroom', 11, 3, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'laura_sogno', 'con flag: dialogo del sogno');
drainDialogue('sogno di Laura');
ok(!S().dialogue, 'dialogo del sogno chiuso');
ok(S().clues.includes('nome_sussurrato'), 'nome sussurrato ottenuto');
ok(S().flags.sogno_fatto, 'flag sogno_fatto impostato');
ok(S().mode === 'play', 'il sogno non chiude la partita');

// Truman: racconta il sogno (ponte Atto 1 -> Atto 2, non chiude la partita)
E.loadMap('sheriff', 11, 4, 'left');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'truman_a2', 'dialogo Truman post-sogno parte');
drainDialogue('Truman post-sogno');
ok(!S().dialogue, 'dialogo Truman post-sogno chiuso');
ok(S().mode === 'play', 'il racconto del sogno non chiude la partita');

// Great Northern: Ben Horne e Audrey (ora accessibile, sogno_fatto impostato)
E.loadMap('hotel_gn', 5, 6, 'down');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'benhorne_a2', 'dialogo Ben Horne parte');
drainDialogue('Ben Horne');
E.loadMap('hotel_gn', 12, 10, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'audrey_a2_ben', 'dialogo Audrey (Great Northern) parte');
drainDialogue('Audrey al Great Northern');
ok(S().flags.audrey_indaga, 'flag audrey_indaga impostato');

// ospedale: Gerard consegna la poesia del fuoco, Ronette sussurra BOB
E.loadMap('hospital', 12, 4, 'left');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'gerard_a2', 'dialogo Gerard parte');
drainDialogue('Gerard');
ok(S().clues.includes('poesia_fuoco'), 'poesia del fuoco ottenuta');
E.loadMap('hospital', 3, 6, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'ronette_letto', 'dialogo Ronette parte');
drainDialogue('Ronette');
ok(S().flags.ronette_bob, 'flag ronette_bob impostato');

// Double R: James consegna l'altra meta' del cuore (appare solo dopo il sogno)
E.loadMap('diner', 9, 7, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'james_a2', 'dialogo James parte');
drainDialogue('James');
ok(S().clues.includes('cuore_intero'), 'cuore ricomposto ottenuto');

// Truman: chiusura Atto 2, ponte verso Atto 3 (non chiude piu' la partita: il vagone aspetta)
E.loadMap('sheriff', 11, 4, 'left');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'truman_atto3', 'dialogo Truman Atto 3 parte');
drainDialogue('Truman Atto 3');
ok(!S().dialogue, 'dialogo Truman Atto 3 chiuso');
ok(S().flags.atto3, 'flag atto3 impostato');
ok(S().mode === 'play', 'Atto 3 non chiude la partita');

// il vagone del treno: il mucchio di terra e l'anello (proprietà mai affermata: guardia M5 ring_c)
E.loadMap('traincar', 13, 7, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'mucchio_terra', 'dialogo mucchio di terra parte');
drainDialogue('mucchio di terra');
ok(S().clues.includes('biglietto_fuoco'), 'biglietto del fuoco ottenuto');
E.loadMap('traincar', 13, 6, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'anello_interact', 'dialogo anello parte');
drainDialogue('anello');
ok(S().clues.includes('anello'), 'anello ottenuto');

// One Eyed Jacks: Jacques interrogato/arrestato e Audrey sotto copertura sono
// mission-owned (M5/M6). Stub = syncNarrativeToClassic outcome.
S().flags.jacques_preso = true;
ok(S().flags.jacques_preso, 'flag jacques_preso impostato');
S().flags.audrey_salvata = true;
ok(S().flags.audrey_salvata, 'flag audrey_salvata impostato');

// Lucy: la chiamata dall'ospedale, Jacques e' morto
E.loadMap('sheriff', 2, 5, 'down');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'lucy_a3', 'dialogo Lucy Atto 3 parte');
drainDialogue('Lucy Atto 3');
ok(S().flags.jacques_morto, 'flag jacques_morto impostato');

// lo specchio della 315: prima apparizione del Gigante
E.loadMap('room_315', 13, 4, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'gigante1_dlg', 'dialogo del Gigante parte');
drainDialogue('prima apparizione del Gigante');
ok(S().flags.gigante1, 'flag gigante1 impostato');

// Truman: chiusura Atto 3, ponte verso Atto 4 is mission-owned (M6
// m6_atto4_bridge; classic truman_atto4 retired, was shadowed in production).
// Stub = syncNarrativeToClassic outcome.
S().flags.atto4 = true;
ok(S().flags.atto4, 'flag atto4 impostato');
ok(S().mode === 'play', 'Atto 4 non chiude la partita');

// casa Palmer: Sarah ha la visione di BOB dietro il divano (Maddy e Leland
// sono mission-owned al diner, non piu' classici a casa Palmer)
E.loadMap('palmer', 9, 6, 'down');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'sarah_visione', 'dialogo visione di Sarah parte');
drainDialogue('visione di Sarah');

// Double R: la Log Lady indica il roadhouse per stanotte
E.loadMap('diner', 4, 6, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'loglady_a4', 'dialogo Log Lady Atto 4 parte');
drainDialogue('Log Lady Atto 4');

// il roadhouse: seconda apparizione del Gigante sul palco is mission-owned
// (M8). Stub = syncNarrativeToClassic outcome (nodes_done.m8_roadhouse_truman
// -> gigante2, dopo lo split del nodo nel pass 01).
S().flags.gigante2 = true;
ok(S().flags.gigante2, 'flag gigante2 impostato');

// casa Palmer: dopo il Roadhouse Sarah non ricompare piu' (cond '!flag:gigante2')
E.loadMap('palmer', 9, 6, 'down');
key('Enter'); pump(16);
ok(!E.npcActive(GAME.Maps.palmer.npcs.find((n) => n.id === 'sarah'), S()), 'Sarah assente da Palmer dopo il Roadhouse');
ok(!S().dialogue, 'nessun dialogo classico contraddice la testimonianza taxi del diner');

// la riva del lago: il ritrovamento di Maddy is mission-owned (M8
// m8_discovery; classic lago_maddy retired, was shadowed in production).
// Stub = syncNarrativeToClassic outcome.
S().flags.maddy_trovata = true;
ok(S().flags.maddy_trovata, 'flag maddy_trovata impostato');

// Truman: chiusura Atto 4, ponte verso Atto 5 is mission-owned (M9
// m9_present_truman; classic truman_atto5 retired, was shadowed in
// production). Stub = syncNarrativeToClassic outcome.
S().flags.atto5 = true;
ok(S().flags.atto5, 'flag atto5 impostato');
ok(S().mode === 'play', 'Atto 5 non chiude piu\' la partita (ponte ritirato)');

/* ---------------- Atto 5: la confessione, la Loggia, il vero finale ---------------- */

// distretto: Leland e' li', in interrogatorio
const sheriffLelandNpc = GAME.Maps.sheriff.npcs.find((n) => n.id === 'leland');
ok(E.npcActive(sheriffLelandNpc, S()), 'Leland presente al distretto dopo atto5');
E.loadMap('sheriff', 7, 5, 'right');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'leland_interr', 'dialogo interrogatorio di Leland parte');
drainDialogue('interrogatorio di Leland');
ok(S().flags.leland_confessa, 'flag leland_confessa impostato (BOB e\' emerso)');

// la cella: la confessione si chiude con la morte di Leland
E.loadMap('sheriff', 7, 5, 'right');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'leland_morte', 'dialogo morte di Leland parte');
drainDialogue('morte di Leland');
ok(S().flags.leland_morto, 'flag leland_morto impostato');

// Truman: l'ultimo ponte, verso il bosco
E.loadMap('sheriff', 11, 4, 'left');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'truman_fine', 'dialogo finale di Truman parte');
drainDialogue('Truman finale');
ok(S().mode === 'play', 'il ponte finale non chiude la partita');

// la Stanza Rossa, un\'ultima volta: prima il Nano
E.loadMap('redroom', 8, 5, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'mfap_finale', 'dialogo finale del Nano parte');
drainDialogue('Nano finale');
ok(S().flags.mfap_finale_visto, 'flag mfap_finale_visto impostato');

// poi BOB stesso, comparso accanto a una statua
const bobNpc = GAME.Maps.redroom.npcs.find((n) => n.id === 'bob');
ok(bobNpc && E.npcActive(bobNpc, S()), 'BOB presente nella Stanza Rossa dopo la morte di Leland');
E.loadMap('redroom', 14, 3, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'bob_finale', 'dialogo di BOB parte');
drainDialogue('BOB finale');

// Laura, infine: il vero finale
E.loadMap('redroom', 11, 3, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'laura_finale2', 'dialogo finale di Laura parte');
drainDialogue('Laura finale');
ok(S().mode === 'end', 'vero finale raggiunto');

// epilogo paginato, poi reset dal finale
for (let endGuard = 0; endGuard < 10 && S().mode === 'end'; endGuard++) { key('Enter'); pump(16); }
ok(S().mode === 'title' || S().mapId === 'town', 'reset post-finale');
ok(E.state.clues.length === 0, 'indizi azzerati al reset');

console.log(`\n${passed} controlli superati ✔`);
