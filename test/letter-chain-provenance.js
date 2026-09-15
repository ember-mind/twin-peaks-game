/* R19J — La O al lago resta osservazione/ipotesi. P8 nasce soltanto quando il
 * giocatore apre volontariamente i due confronti nel taccuino. */
'use strict';

const assert = require('assert');
const path = require('path');

let now = 0;
let rafQueue = [];
const handlers = {};
global.window = global;
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.requestAnimationFrame = (fn) => { rafQueue.push(fn); };
global.performance = { now: () => now };

const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
const canvas = { getContext: () => ctx };
const ROOT = path.join(__dirname, '..');
const J = (file) => path.join(ROOT, 'js', file);
[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js',
  'engine.js', 'scene-objects.gen.js', 'glue.js', 'narrative-runtime.js', 'narrative-data.gen.js',
  'narrative-bootstrap.js'
].forEach((file) => require(J(file)));

const GAME = global.GAME;
const E = GAME.Engine;
const D = GAME.Data;
const NR = GAME.NarrativeRuntime;
const M8 = GAME.NarrativeData.missions.M8;
let checks = 0;

function ok(value, label) {
  assert(value, label);
  checks++;
  console.log('  ok - ' + label);
}

function key(code) {
  handlers.keydown({ code, preventDefault() {}, repeat: false });
  handlers.keyup({ code });
}

function pump(ms) {
  for (let i = 0; i < Math.ceil(ms / 16); i++) {
    now += 16;
    const batch = rafQueue.splice(0);
    batch.forEach((fn) => fn(now));
  }
}

function commitNode(state, id) {
  const prepared = NR.prepareNode(state, M8, id);
  ok(prepared.ok, `${id}: apertura volontaria preparabile`);
  const result = NR.commitNode(state, M8, prepared);
  ok(result.ok, `${id}: commit volontario riuscito`);
}

const identityAssertion = /\bROBERT\b|sta(?:nno)? componendo|compone(?:re)? (?:il )?nome|forma(?:no)? (?:il )?nome|identifica|(?:e|è) (?:la )?firma/i;

// Il ritrovamento classico al lago (`lago_maddy`, dialogo + `give: ['lettera_o']`)
// e' stato ritirato dal layer classico: era gia' SHADOWED in produzione (M8
// `m8_discovery` possiede il target condiviso `lago_maddy`/tile 15,28 da
// `flag:atto4` in poi) e non produceva piu' l'indizio nel gioco reale. L'unico
// path che raggiunge il giocatore e' quello mission-owned verificato sotto:
// l'invariante R19J (osservazione/ipotesi, mai identita' affermata) resta
// coperta li' via `P8.formulation.status` e `evidence.E9A_LETTERA_O`.

console.log('# confronto narrativo resta volontario');
GAME.installNarrativeCatalogs();
const state = NR.createState();
state.values.body_found_by = 'cooper';
state.values.promise_stance = 'autonomia';
state.values.presagio_status = 'active';
state.evidence.E1_DIARIO = true;
state.evidence.E3_LETTERA_R = true;

commitNode(state, 'm8_discovery');
ok(NR.peekProp(state, 'P8').formulation.status === 'unformulated', 'ritrovamento non formula P8');
ok(!state.nodes_done.m8_cmp_letters && !state.nodes_done.m8_cmp_diary, 'ritrovamento non auto-esegue confronti');
commitNode(state, 'm8_promise_echo');
ok(NR.peekProp(state, 'P8').formulation.status === 'unformulated', 'eco obbligatoria non formula P8');
ok(!state.nodes_done.m8_cmp_letters && !state.nodes_done.m8_cmp_diary, 'dopo eco, confronti disponibili ma non eseguiti');

commitNode(state, 'm8_cmp_letters');
ok(NR.peekProp(state, 'P8').formulation.status === 'unformulated', 'confronto R/O annota metodo, non identità');
commitNode(state, 'm8_cmp_diary');
ok(NR.peekProp(state, 'P8').formulation.status === 'unformulated', 'aprire confronto col diario non sceglie teoria');

const diaryNode = M8.nodes.find((node) => node.id === 'm8_cmp_diary');
const preparedChoice = NR.prepareChoice(state, M8, diaryNode, 'diary_a');
ok(preparedChoice.ok, 'teoria progressiva richiede scelta esplicita diary_a');
ok(NR.peekProp(state, 'P8').formulation.status === 'unformulated', 'prepare della scelta resta puro');
ok(NR.commitChoice(state, M8, diaryNode, preparedChoice).ok, 'scelta volontaria committata');
ok(NR.peekProp(state, 'P8').formulation.status === 'formulated', 'solo scelta volontaria formula P8');
ok(NR.peekProp(state, 'P8').factual_status !== 'confirmed', 'P8 non diventa identità confermata');

console.log(`letter-chain-provenance: PASS (${checks} checks)`);
