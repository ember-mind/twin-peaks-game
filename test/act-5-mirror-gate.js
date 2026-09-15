/* test/act-5-mirror-gate.js — Atto 5 (M10) cross-layer gate: missione ↔ classico ↔ finale.
 * Copre: (a) la produzione entra in M10 dopo M9 e arma il finale SOLO a leland_morto
 * (m10_morte), mai a m9_arrivo; (b) su ogni seme Act 5 in cui Leland o Truman sono in
 * centrale, un'interazione è posseduta da una missione (M9/M10) con UNA root o un repeat:
 * i dialoghi classici leland_interr / leland_morte non sono raggiungibili; (c) il ponte
 * narrativo→classico scrive leland_morto + leland_confessa + done_leland_interr e l'obiettivo
 * classico della Loggia legge leland_morto; (d) il finale retro non possiede più M10:
 * startAtLodge fail-closed, fasi M10 ritirate, restore rifiuta un checkpoint dentro M10;
 * (e) nessuna porta / mappa / oggetto nuovo per la scena; (f) index.html cache tag aggiornati.
 * node test/act-5-mirror-gate.js */
'use strict';
const fs = require('fs');
const path = require('path');

global.window = global;
global.addEventListener = () => {};
global.requestAnimationFrame = () => {};
global.performance = { now: () => 0 };
const ctxStub = new Proxy({ measureText: (s) => ({ width: String(s).length * 5 }) }, { get(t, k) { return k in t ? t[k] : () => {}; }, set() { return true; } });
const canvasStub = { getContext: () => ctxStub };

const root = path.resolve(__dirname, '..');
const J = (f) => path.join(root, 'js', f);
['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js', 'engine.js', 'scene-objects.gen.js', 'glue.js',
  'narrative-runtime.js', 'narrative-data.gen.js', 'narrative-bootstrap.js', 'narrative-engine-adapter.js', 'narrative-production.js',
  'cast-presence.js', 'narrative-finale.js'].forEach((f) => require(J(f)));
const GAME = global.GAME;
GAME.Engine.init(canvasStub);
GAME.installNarrativeCatalogs({ data: GAME.NarrativeData, runtime: GAME.NarrativeRuntime });
const NR = GAME.NarrativeRuntime, D = GAME.NarrativeData, CP = GAME.CastPresence, NF = GAME.NarrativeFinale, NP = GAME.NarrativeProduction;

let checks = 0, failures = 0;
function ok(cond, label) { checks++; if (!cond) { failures++; console.error('  ✗ ' + label); } }
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const PROD = read('js/narrative-production.js');
const FPROD = read('js/narrative-finale-production.js');
const INDEX = read('index.html');
const PINS = JSON.parse(read('test/fixtures/cast-pins-acts-1-4.json'));

console.log('# act-5-mirror-gate: (a) produzione M9 → M10 → finale');
ok(/\['M4', 'M5', 'M6', 'M8', 'M9', 'M10'\]/.test(PROD), 'narrative-production registra M10 dopo M9 (ordine di entrata)');
ok(/state\.flags\.leland_morto && state\.nodes_done\.m10_morte && !A\.active\(\)/.test(PROD), 'il finale viene armato a leland_morto scritto da m10_morte');
ok(!/nodes_done\.m9_arrivo && !A\.active\(\)/.test(PROD), 'nessun arm del finale alla consegna di M9');
ok(/NF\.startAtLodge\(opts\)/.test(FPROD) && !/var started = NF\.start\(opts\)/.test(FPROD), 'FP.arm usa startAtLodge, mai la M10 retro');
ok(/finale_arm_before_leland_morto/.test(FPROD), 'FP.arm rifiuta prima di leland_morto');

console.log('# (b) ownership degli attori in centrale (Leland, Truman) sui semi Act 5');
const missions = ['M4', 'M5', 'M6', 'M8', 'M9', 'M10'].map((id) => D.missions[id]);
function stateFromSeed(seed) {
  const st = NR.createState();
  const s = JSON.parse(JSON.stringify(seed));
  Object.keys(s).forEach((k) => { st[k] = Object.assign(st[k] || {}, s[k]); });
  return st;
}
// stessa regola di A.tryInteract: latest-first fra le missioni entrate con nodi sull'attore
function ownerOf(st, mapId, actorId) {
  const ent = missions.filter((m) => !m.entry_condition || NR.evalCond(st, m.entry_condition, m));
  for (let i = ent.length - 1; i >= 0; i--) {
    const m = ent[i];
    if (!m.nodes.some((n) => n.channel === 'world' && n.map_id === mapId && n.actor_id === actorId)) continue;
    const roots = NR.worldRoots(st, m, mapId, actorId);
    if (roots.length) return { mission: m.mission, roots: roots.map((n) => n.id) };
    if (i === 0 || !ent.slice(0, i).some((x) => x.nodes.some((n) => n.map_id === mapId && n.actor_id === actorId))) return { mission: m.mission, roots: [] };
  }
  const any = ent.slice().reverse().find((m) => m.nodes.some((n) => n.channel === 'world' && n.map_id === mapId && n.actor_id === actorId));
  return any ? { mission: any.mission, roots: [] } : null;
}
['ACT5_THRESHOLD', 'ACT5_TRUMAN_OUT_INTUITIVE', 'ACT5_LELAND_CELL', 'ACT5_LELAND_DEAD'].forEach((seedId) => {
  const st = stateFromSeed(PINS.seeds[seedId]);
  ['leland', 'truman'].forEach((actor) => {
    const r = CP.resolveCharacterPresence(actor, st);
    if (!(r.status === 'PLACED' && r.sceneId === 'sheriff')) return;
    const own = ownerOf(st, 'sheriff', actor);
    ok(!!own, seedId + ': ' + actor + ' in centrale è posseduto da una missione (classico mai consultato)');
    ok(own && own.roots.length <= 1, seedId + ': ' + actor + ' al più una root (' + (own && own.roots) + ')');
    if (actor === 'leland') ok(own && own.mission === 'M10' && own.roots.join() === 'm10_soglia', seedId + ': Leland → M10 m10_soglia');
    if (actor === 'truman' && seedId === 'ACT5_LELAND_CELL') ok(own && own.mission === 'M10' && own.roots.join() === 'm10_morte', seedId + ': Truman → M10 m10_morte (ripresa dopo il fermo)');
    if (actor === 'truman' && seedId !== 'ACT5_LELAND_CELL') ok(own && own.mission === 'M9' && own.roots.length === 1 && own.roots[0] === 'm9_present_truman', seedId + ': Truman → repeat della convocazione M9 (M10 non ha root su Truman prima del fermo)');
  });
});
const stationWin = D.cast.windows.find((w) => w.id === 'ACT5_LELAND_STATION');
ok(stationWin && stationWin.owner === 'M10', 'ACT5_LELAND_STATION posseduta da M10');
ok(GAME.Data.dialogues.leland_interr && GAME.Data.dialogues.leland_morte, 'dialoghi classici leland_interr/leland_morte presenti solo come fallback del motore classico senza layer narrativo');
ok(missions.some((m) => m.nodes.some((n) => n.map_id === 'sheriff' && n.actor_id === 'leland')) && D.missions.M9.nodes.some((n) => n.id === 'm9_arrivo' && n.actor_id === 'leland'),
  'da atto5 in poi un nodo di missione su Leland@sheriff esiste sempre (M9 m9_arrivo, poi M10): la preemption del classico è garantita');

console.log('# (c) ponte narrativo → classico');
{
  const classic = {};
  NP.syncNarrativeToClassic(stateFromSeed(PINS.seeds.ACT5_LELAND_DEAD), classic);
  ok(classic.leland_morto && classic.leland_confessa && classic.done_leland_interr && classic.atto5, 'leland_morto (M10) → leland_morto + leland_confessa + done_leland_interr nel classico');
  const before = {};
  NP.syncNarrativeToClassic(stateFromSeed(PINS.seeds.ACT5_LELAND_CELL), before);
  ok(!before.leland_morto && !before.leland_confessa, 'nessun flag classico di confessione prima di leland_morto');
  const obj = (GAME.Data.objectives || GAME.Data.objective || []).find ? (GAME.Data.objectives || []).find((o) => o.cond === 'flag:leland_morto') : null;
  ok(/cond: 'flag:leland_morto', text: 'Torna alla Loggia \(Glastonbury Grove\)\.'/.test(read('js/data.js')), 'obiettivo classico della Loggia legge leland_morto con lo stesso testo del Lock');
  ok(D.missions.M10.objectives.some((o) => o.text === 'Torna alla Loggia (Glastonbury Grove).'), 'M10 obj_m10_2 = obiettivo classico (una sola formulazione)');
  void obj;
}

console.log('# (d) il finale non possiede più M10');
NF.reset();
ok(NF.startAtLodge({ carryover: { values: {}, flags: {} } }).error === 'lodge_entry_without_leland_morto', 'startAtLodge fail-closed senza leland_morto');
ok(Array.isArray(NF.RETIRED_M10_STAGES) && NF.RETIRED_M10_STAGES.length === 13, 'tredici fasi M10 retro dichiarate ritirate');
ok(/finale_save_in_retired_m10_stage/.test(FPROD), 'restore rifiuta un checkpoint dentro la M10 retro (fail loud)');
{
  const dead = stateFromSeed(PINS.seeds.ACT5_LELAND_DEAD);
  dead.props.P6.factual_status = 'confirmed_as_lie';
  const r = NF.startAtLodge({ carryover: { values: dead.values, flags: dead.flags, p6_status: 'confirmed_as_lie' } });
  ok(r.ok && NF.getState().stage === 'await_lodge' && !NF.isActive(), 'dal seme ACT5_LELAND_DEAD il finale parte in pausa sulla Loggia');
  ok(NF.objective() === 'Nella Loggia: scegli chi affrontare per primo.', 'obiettivo del finale alla Loggia');
  NF.reset();
}

console.log('# (e) nessuna porta, mappa od oggetto nuovo per la scena');
ok(JSON.stringify(GAME.Maps.sheriff.doors) === '{}', 'sheriff: nessuna porta classica aggiunta');
ok(read('js/maps.js').indexOf("'TTTT..TTTT.....T', // 4  schedari(1-3,4), scrivania sceriffo(6-9,4); Truman(10,4)") !== -1, 'sheriff: righe della mappa invariate');
ok(!/sheriff[\s\S]{0,40}interrog/i.test(read('world/scene-objects.json')), 'nessun oggetto scena «interrogatorio» nel registro');
ok(D.missions.M10.nodes.every((n) => n.map_id === 'sheriff' && n.target_kind === 'actor'), 'M10 usa solo attori sulla centrale (nessun target ambientale nuovo)');

console.log('# (f) cache tag');
['js/narrative-runtime.js?v=3act5', 'js/narrative-data.gen.js?v=21act5', 'js/narrative-finale.js?v=gold54p6act5',
  'js/narrative-finale-production.js?v=15act5', 'js/narrative-production.js?v=23act5'].forEach((tag) => ok(INDEX.indexOf(tag) !== -1, 'index.html carica ' + tag));

console.log('');
if (failures) { console.error(failures + ' fallimenti su ' + checks); process.exit(1); }
console.log(checks + ' controlli superati ✔');
console.log('ACT-5-MIRROR-GATE-PASS ' + checks + '/' + checks);
