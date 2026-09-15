/* narrative-slice-01.js — controlli mirati per la narrative-vertical-slice-01:
 * cascate Bobby/Shelly, variante laura_room_andy, obiettivo Double R, cascata
 * lago_riva estesa, onEnter dell'hotel, id dei nuovi dialoghi, bacheca esterna.
 * Stessa catena di require di test/walkthrough.js. Esegui con: node test/narrative-slice-01.js
 */
'use strict';
const assert = require('assert');
const path = require('path');

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
require(J('retro-font.js'));
require(J('engine.js'));
require(J('scene-objects.gen.js'));
require(J('glue.js'));
require(J('location-connections.js'));
require(J('world-connections.gen.js'));
require(J('double-r-exterior-art.js'));
require(J('double-r-exterior-scene.js'));
require(J('sheriffs-station-exterior-scene.js'));
require(J('sheriffs-station-scene.js'));
global.GAME.DoubleRExteriorScene.install();
global.GAME.SheriffsStationExteriorScene.install();
global.GAME.SheriffsStationScene.install();
require(J('world-connections-production.js')); // every registry door (js/maps.js carries none)
// Named bodies come from the Cast Presence registry since b529711 (glue.js NPCS is empty); null state = authored baseline.
['narrative-runtime.js', 'narrative-data.gen.js', 'cast-presence.js'].forEach((f) => require(J(f)));
Object.keys(global.GAME.Maps).forEach((m) => { if (global.GAME.Maps[m] && global.GAME.Maps[m].rows) global.GAME.Maps[m].npcs = global.GAME.CastPresence.bodiesFor(m, null); });

const GAME = global.GAME;
const E = GAME.Engine;
const D = GAME.Data;

let failures = 0;
function ok(cond, label) {
  if (cond) { console.log('  ok - ' + label); }
  else { failures++; console.error('  FAIL - ' + label); }
}
function eq(a, b, label) {
  ok(JSON.stringify(a) === JSON.stringify(b), label + ' (got ' + JSON.stringify(a) + ')');
}

/* (a) cascata Shelly <-> Bobby */
const bobbyNpc = GAME.Maps.town.npcs.find((n) => n.id === 'bobby');
const shellyNpc = GAME.Maps.diner.npcs.find((n) => n.id === 'shelly');
ok(!!bobbyNpc && !!shellyNpc, 'bobby (town) e shelly (diner) trovati in GAME.Maps');

eq(E.resolveDialogue(shellyNpc.dialogue, { clues: [], flags: { done_bobby: true } }), 'shelly_bobby',
  'shelly risolve a shelly_bobby dopo done_bobby');
eq(E.resolveDialogue(shellyNpc.dialogue, { clues: [], flags: {} }), 'shelly',
  'shelly risolve al dialogo base senza done_bobby');

eq(E.resolveDialogue(bobbyNpc.dialogue, { clues: [], flags: { done_shelly: true } }), 'bobby_shelly',
  'bobby risolve a bobby_shelly dopo done_shelly');
eq(E.resolveDialogue(bobbyNpc.dialogue, { clues: [], flags: { done_shelly_bobby: true } }), 'bobby_shelly',
  'bobby risolve a bobby_shelly dopo done_shelly_bobby');
eq(E.resolveDialogue(bobbyNpc.dialogue, { clues: [], flags: {} }), 'bobby',
  'bobby risolve al dialogo base senza flag');

/* (b) laura_room_andy: cascata + stesso give di laura_room */
eq(E.resolveDialogue(GAME.INTERACT_DLG.cameraLaura, { clues: [], flags: { done_andy: true } }), 'laura_room_andy',
  'cameraLaura risolve a laura_room_andy dopo done_andy');
eq(E.resolveDialogue(GAME.INTERACT_DLG.cameraLaura, { clues: [], flags: {} }), 'laura_room',
  'cameraLaura risolve al dialogo base senza done_andy');
eq(D.dialogues.laura_room_andy.give, D.dialogues.laura_room.give,
  'laura_room_andy da\' lo stesso set di indizi di laura_room');

/* (c) obiettivo: Double R -> camera di Laura */
const stObj = { clues: ['diario'], flags: {} };
eq(D.objectiveFor(stObj, E.checkCond), 'Il Double R, poi casa Palmer.',
  'obiettivo prima della visita al Double R');
stObj.flags.double_r_visitato = true;
eq(D.objectiveFor(stObj, E.checkCond), 'Casa Palmer: la camera di Laura.',
  'obiettivo dopo double_r_visitato');

/* (d) cascata lago_riva */
eq(E.resolveDialogue(GAME.INTERACT_DLG.lago_riva, { clues: [], flags: {} }), 'lago_laura',
  'lago_riva risolve a lago_laura di default');
eq(E.resolveDialogue(GAME.INTERACT_DLG.lago_riva, { clues: [], flags: { sogno_fatto: true } }), 'lago_sguardo',
  'lago_riva risolve a lago_sguardo con sogno_fatto');
eq(E.resolveDialogue(GAME.INTERACT_DLG.lago_riva, { clues: [], flags: { gigante2: true } }), 'lago_laura',
  'lago_riva non risolve piu\' a lago_maddy con gigante2 (branch ritirato: il ritrovamento e\' mission-owned in M8)');
eq(E.resolveDialogue(GAME.INTERACT_DLG.lago_riva, { clues: [], flags: { maddy_trovata: true } }), 'lago_dopo',
  'lago_riva risolve a lago_dopo con maddy_trovata (cascata pre-esistente intatta)');

/* (e) onEnter dell'hotel: risveglio spostato dalla lobby alla stanza 315 */
eq(GAME.Maps.room_315.onEnter, { dialogue: 'hotel_risveglio', once: 'intro_hotel' },
  'room_315.onEnter ha la forma attesa');
ok(!GAME.Maps.hotel_gn.onEnter, 'hotel_gn.onEnter assente (spostato su room_315)');
ok(GAME.Maps.redroom.doors['8,11'] && GAME.Maps.redroom.doors['8,11'].to === 'room_315'
  && GAME.Maps.redroom.doors['8,11'].tx === 2 && GAME.Maps.redroom.doors['8,11'].ty === 6,
  'redroom porta 8,11 punta a room_315 (2,6)');

/* (f) tutti i nuovi id di dialogo referenziati risolvono in D.dialogues */
['shelly_bobby', 'bobby_shelly', 'laura_room_andy', 'lago_laura', 'bacheca_centrale', 'hotel_risveglio']
  .forEach((id) => ok(!!D.dialogues[id], 'D.dialogues.' + id + ' esiste'));

/* (g) interact bacheca sull'esterno del distretto (se implementato) */
const EXT = 'sheriffs_station_exterior';
const obj = GAME.Maps.objectAt(EXT, 9, 6);
if (obj) {
  eq(E.resolveDialogue(obj.dialogue, { clues: [], flags: {} }), 'bacheca_centrale',
    'oggetto bacheca a (9,6) risolve a bacheca_centrale');
  ok(!GAME.Maps.isSolid(EXT, 9, 7, { clues: [] }), 'la cella (9,7) da cui affrontare la bacheca e\' percorribile');
} else {
  console.log('  (bacheca non implementata come oggetto interagibile: nessun controllo (g) da eseguire)');
}

console.log(failures === 0 ? '\nOK: narrative-vertical-slice-01, tutti i controlli superati ✔'
  : '\n' + failures + ' controlli falliti ✘');
process.exit(failures === 0 ? 0 : 1);
