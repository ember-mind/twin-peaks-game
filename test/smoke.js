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
const mapIds = ['town', 'sheriff', 'palmer', 'hotel_gn', 'hospital', 'diner', 'woods', 'redroom', 'traincar', 'oej', 'roadhouse'];
const fake3 = { clues: ['a', 'b', 'c'] };

for (const id of mapIds) {
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
ok(introPages.length > GAME.Data.intro.length && introPages.every((p) => p.lines.length <= 5), 'prologo impaginato senza troncare oltre 5 righe');
const introNorm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const introSource = introNorm(GAME.Data.intro.join(' '));
const introVisible = introNorm(introPages.flatMap((p) => p.lines).join(' '));
ok(introVisible === introSource, 'tutto il testo del prologo resta visibile');
for (let i = 0; i < introPages.length; i++) key('Enter');
pump(16);
ok(S().mode === 'play', 'intro -> gioco');
ok(S().mapId === 'town', 'spawn in città');
ok(!GAME.Maps.isSolid('town', S().player.tx, S().player.ty, S()), 'spawn calpestabile');

// transenna chiusa senza indizi
ok(GAME.Maps.isSolid('town', 50, 0, S()), 'bosco transennato a 0 indizi');

// Great Northern e ospedale chiusi prima del sogno
ok(GAME.Maps.doorAt('town', 9, 6).needsFlag === 'sogno_fatto' && !S().flags.sogno_fatto, 'hotel chiuso prima del sogno');
ok(GAME.Maps.doorAt('town', 23, 6).needsFlag === 'sogno_fatto' && !S().flags.sogno_fatto, 'ospedale chiuso prima del sogno');
ok(GAME.Maps.doorAt('town', 47, 28).needsFlag === 'atto4' && !S().flags.atto4, 'roadhouse chiuso prima di atto4');

// Truman: consegna il diario
E.loadMap('sheriff', 6, 3, 'right');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'truman', 'dialogo Truman parte');
key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(!S().dialogue, 'dialogo Truman chiuso');
ok(S().clues.includes('diario'), 'diario ottenuto');

// replay: pagina "again"
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.replay, 'replay Truman usa "again"');
key('Enter'); pump(16);

// camera di Laura: cuore + lettera R
E.loadMap('palmer', 6, 2, 'up');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
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
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().flags.met_mfap, 'flag met_mfap impostato');

// Laura: prima hint condizionale già superata -> il sogno
E.loadMap('redroom', 11, 3, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'laura_sogno', 'con flag: dialogo del sogno');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(!S().dialogue, 'dialogo del sogno chiuso');
ok(S().clues.includes('nome_sussurrato'), 'nome sussurrato ottenuto');
ok(S().flags.sogno_fatto, 'flag sogno_fatto impostato');
ok(S().mode === 'play', 'il sogno non chiude la partita');

// Truman: racconta il sogno (ponte Atto 1 -> Atto 2, non chiude la partita)
E.loadMap('sheriff', 6, 3, 'right');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'truman_a2', 'dialogo Truman post-sogno parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(!S().dialogue, 'dialogo Truman post-sogno chiuso');
ok(S().mode === 'play', 'il racconto del sogno non chiude la partita');

// Great Northern: Ben Horne e Audrey (ora accessibile, sogno_fatto impostato)
E.loadMap('hotel_gn', 5, 6, 'down');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'benhorne_a2', 'dialogo Ben Horne parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
E.loadMap('hotel_gn', 12, 10, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'audrey_a2', 'dialogo Audrey (Great Northern) parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().flags.audrey_indaga, 'flag audrey_indaga impostato');

// ospedale: Gerard consegna la poesia del fuoco, Ronette sussurra BOB
E.loadMap('hospital', 7, 7, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'gerard_a2', 'dialogo Gerard parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().clues.includes('poesia_fuoco'), 'poesia del fuoco ottenuta');
E.loadMap('hospital', 2, 2, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'ronette_letto', 'dialogo Ronette parte');
key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().flags.ronette_bob, 'flag ronette_bob impostato');

// Double R: James consegna l'altra meta' del cuore (appare solo dopo il sogno)
E.loadMap('diner', 10, 7, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'james_a2', 'dialogo James parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().clues.includes('cuore_intero'), 'cuore ricomposto ottenuto');

// Truman: chiusura Atto 2, ponte verso Atto 3 (non chiude piu' la partita: il vagone aspetta)
E.loadMap('sheriff', 6, 3, 'right');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'truman_atto3', 'dialogo Truman Atto 3 parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(!S().dialogue, 'dialogo Truman Atto 3 chiuso');
ok(S().flags.atto3, 'flag atto3 impostato');
ok(S().mode === 'play', 'Atto 3 non chiude la partita');

// il vagone del treno: il mucchio di terra e l'anello di Laura
E.loadMap('traincar', 10, 5, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'mucchio_terra', 'dialogo mucchio di terra parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().clues.includes('biglietto_fuoco'), 'biglietto del fuoco ottenuto');
E.loadMap('traincar', 13, 4, 'down');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'anello_interact', 'dialogo anello parte');
key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().clues.includes('anello'), 'anello ottenuto');

// One Eyed Jacks: Jacques viene interrogato e arrestato
E.loadMap('oej', 7, 6, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'jacques_a3', 'dialogo Jacques parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().flags.jacques_preso, 'flag jacques_preso impostato');

// Audrey sotto copertura al casinò, poi rimandata a casa
E.loadMap('oej', 13, 8, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'audrey_oej', 'dialogo Audrey (OEJ) parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().flags.audrey_salvata, 'flag audrey_salvata impostato');

// Lucy: la chiamata dall'ospedale, Jacques e' morto
E.loadMap('sheriff', 2, 7, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'lucy_a3', 'dialogo Lucy Atto 3 parte');
key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().flags.jacques_morto, 'flag jacques_morto impostato');

// lo specchio della 315: prima apparizione del Gigante
E.loadMap('hotel_gn', 15, 2, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'gigante1_dlg', 'dialogo del Gigante parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().flags.gigante1, 'flag gigante1 impostato');

// Truman: chiusura Atto 3, ponte verso Atto 4 (non chiude piu' la partita: il gigante e Maddy aspettano)
E.loadMap('sheriff', 6, 3, 'right');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'truman_atto4', 'dialogo Truman Atto 4 parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(!S().dialogue, 'dialogo Truman Atto 4 chiuso');
ok(S().flags.atto4, 'flag atto4 impostato');
ok(S().mode === 'play', 'Atto 4 non chiude la partita');

// casa Palmer: Maddy e' apparsa; Sarah ha la visione di BOB dietro il divano
const maddyNpc = GAME.Maps.palmer.npcs.find((n) => n.id === 'maddy');
ok(maddyNpc && E.npcActive(maddyNpc, S()), 'Maddy presente dopo atto4');
E.loadMap('palmer', 9, 6, 'down');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'sarah_visione', 'dialogo visione di Sarah parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);

// Double R: la Log Lady indica il roadhouse per stanotte
E.loadMap('diner', 4, 6, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'loglady_a4', 'dialogo Log Lady Atto 4 parte');
key('Enter'); key('Enter'); key('Enter'); pump(16);

// il roadhouse: seconda apparizione del Gigante sul palco
E.loadMap('roadhouse', 8, 2, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'gigante2_dlg', 'dialogo del Gigante (roadhouse) parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().flags.gigante2, 'flag gigante2 impostato');
ok(!E.npcActive(maddyNpc, S()), 'Maddy scomparsa dopo la seconda apparizione');

// casa Palmer: dopo il Roadhouse Leland non ricompare; la testimonianza taxi
// appartiene al diner narrativo prima del ritrovamento.
E.loadMap('palmer', 12, 9, 'up');
key('Enter'); pump(16);
ok(!E.npcActive(GAME.Maps.palmer.npcs.find((n) => n.id === 'leland'), S()), 'Leland assente da Palmer dopo il Roadhouse');
ok(!S().dialogue, 'nessun dialogo classico contraddice la testimonianza taxi del diner');

// la riva del lago: il ritrovamento di Maddy
E.loadMap('town', 15, 29, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'lago_maddy', 'dialogo ritrovamento di Maddy parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().clues.includes('lettera_o'), 'lettera "O" ottenuta');
ok(S().flags.maddy_trovata, 'flag maddy_trovata impostato');

// Truman: chiusura Atto 4, ponte verso Atto 5 (non chiude piu' la partita: il ponte e' stato ritirato)
E.loadMap('sheriff', 6, 3, 'right');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'truman_atto5', 'dialogo Truman Atto 5 parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().mode === 'play', 'Atto 5 non chiude piu\' la partita (ponte ritirato)');
ok(S().flags.atto5, 'flag atto5 impostato');

/* ---------------- Atto 5: la confessione, la Loggia, il vero finale ---------------- */

// casa Palmer: Leland se n'e' trasferito al distretto
const palmerLelandNpc = GAME.Maps.palmer.npcs.find((n) => n.id === 'leland');
ok(!E.npcActive(palmerLelandNpc, S()), 'Leland assente da casa Palmer dopo atto5');

// distretto: Leland e' li', in interrogatorio
const sheriffLelandNpc = GAME.Maps.sheriff.npcs.find((n) => n.id === 'leland');
ok(E.npcActive(sheriffLelandNpc, S()), 'Leland presente al distretto dopo atto5');
E.loadMap('sheriff', 4, 3, 'right');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'leland_interr', 'dialogo interrogatorio di Leland parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().flags.leland_confessa, 'flag leland_confessa impostato (BOB e\' emerso)');

// la cella: la confessione si chiude con la morte di Leland
E.loadMap('sheriff', 4, 3, 'right');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'leland_morte', 'dialogo morte di Leland parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().flags.leland_morto, 'flag leland_morto impostato');

// Truman: l'ultimo ponte, verso il bosco
E.loadMap('sheriff', 6, 3, 'right');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'truman_fine', 'dialogo finale di Truman parte');
key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().mode === 'play', 'il ponte finale non chiude la partita');

// la Stanza Rossa, un\'ultima volta: prima il Nano
E.loadMap('redroom', 8, 5, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'mfap_finale', 'dialogo finale del Nano parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().flags.mfap_finale_visto, 'flag mfap_finale_visto impostato');

// poi BOB stesso, comparso accanto a una statua
const bobNpc = GAME.Maps.redroom.npcs.find((n) => n.id === 'bob');
ok(bobNpc && E.npcActive(bobNpc, S()), 'BOB presente nella Stanza Rossa dopo la morte di Leland');
E.loadMap('redroom', 14, 3, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'bob_finale', 'dialogo di BOB parte');
key('Enter'); key('Enter'); key('Enter'); pump(16);

// Laura, infine: il vero finale
E.loadMap('redroom', 11, 3, 'up');
key('Enter'); pump(16);
ok(S().dialogue && S().dialogue.id === 'laura_finale2', 'dialogo finale di Laura parte');
key('Enter'); key('Enter'); key('Enter'); key('Enter'); key('Enter'); pump(16);
ok(S().mode === 'end', 'vero finale raggiunto');

// epilogo paginato, poi reset dal finale
for (let endGuard = 0; endGuard < 10 && S().mode === 'end'; endGuard++) { key('Enter'); pump(16); }
ok(S().mode === 'title' || S().mapId === 'town', 'reset post-finale');
ok(E.state.clues.length === 0, 'indizi azzerati al reset');

console.log(`\n${passed} controlli superati ✔`);
