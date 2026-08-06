/* Prova di percorso: il nome BOB non appare in nessuna schermata producibile
 * prima della testimonianza di Ronette. Copre sia il percorso classico sia M4,
 * inclusi gli ordini alternativi delle domande. */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
global.addEventListener = function () {};
global.requestAnimationFrame = function () {};

const ROOT = path.join(__dirname, '..');
const J = (file) => path.join(ROOT, 'js', file);
[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js',
  'retro-font.js', 'engine.js', 'glue.js', 'narrative-runtime.js'
].forEach((file) => require(J(file)));

const GAME = global.GAME;
const D = GAME.Data;
const E = GAME.Engine;
const NR = GAME.NarrativeRuntime;
const M4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'narrative', 'missions', 'M4.json'), 'utf8'));
const evidence = JSON.parse(fs.readFileSync(path.join(ROOT, 'narrative', 'evidence.json'), 'utf8')).evidence;
const BOB = /\bBOB\b/;

let checks = 0;
function ok(value, label) {
  assert(value, label);
  checks++;
}

function pageTexts(pages) {
  return (pages || []).map((page) => typeof page === 'string' ? page : page.text);
}

function noBob(screens, label) {
  const leak = screens.find((screen) => BOB.test(screen.text));
  ok(!leak, `${label}: BOB anticipato in ${leak ? leak.label + ' → ' + leak.text : 'nessuna schermata'}`);
}

function addDialogue(screens, label, id) {
  const def = D.dialogues[id];
  ok(!!def, `${label}: dialogo ${id} esistente`);
  for (const text of pageTexts(def.pages)) screens.push({ label: `${label}:${id}:first`, text });
  for (const text of pageTexts(def.again && def.again.pages)) screens.push({ label: `${label}:${id}:again`, text });
}

// Il diario conserva la traccia seriale Laura/Robert, ma non può introdurre T1.
ok(/ROBERT/.test(D.clues.diario.desc), 'il diario visibile conserva ROBERT');
ok(/nome un pezzo alla volta/.test(D.clues.diario.desc), 'il diario visibile conserva la regola seriale');
ok(!BOB.test(D.clues.diario.desc), 'il diario visibile non introduce BOB');
ok(D.dialogues.truman.pages.some((page) => /ROBERT/.test(page.text)), 'il primo Truman espone la traccia ROBERT');
ok(!D.dialogues.truman.pages.some((page) => BOB.test(page.text)), 'il primo Truman non introduce BOB');

// Schermate classiche producibili in cinque snapshot legali prima di Ronette.
// Ogni snapshot enumera i target attivi e usa lo stesso resolver del motore.
const classicBefore = [
  ...D.intro.map((text, index) => ({ label: `intro:${index}`, text })),
  { label: 'menu:clue:diario', text: D.clues.diario.desc }
];
const snapshots = [
  { label: 'arrivo', clues: [], flags: {} },
  { label: 'dopo-diario', clues: ['diario'], flags: {} },
  { label: 'prima-del-sogno', clues: ['diario', 'cuore', 'lettera_r'], flags: {} },
  { label: 'dopo-il-sogno', clues: ['diario', 'cuore', 'lettera_r', 'nome_sussurrato'], flags: { met_mfap: true, sogno_fatto: true } },
  { label: 'massimo-pre-ronette', clues: ['diario', 'cuore', 'lettera_r', 'nome_sussurrato', 'poesia_fuoco', 'cuore_intero'], flags: { met_mfap: true, sogno_fatto: true, sogno_raccontato: true, audrey_indaga: true } }
];
const classicIds = new Set();
for (const snapshot of snapshots) {
  const state = { clues: snapshot.clues, flags: snapshot.flags };
  for (const [mapId, map] of Object.entries(GAME.Maps)) {
    for (const npc of map.npcs || []) {
      if (!E.npcActive(npc, state)) continue;
      const id = E.resolveDialogue(npc.dialogue, state);
      if (id && id !== 'ronette_letto') classicIds.add(`${mapId}|${id}`);
    }
    for (const object of map.objects || []) {
      const id = E.resolveDialogue(object.dialogue, state);
      if (id && id !== 'ronette_letto') classicIds.add(`${mapId}|${id}`);
    }
  }
}
for (const key of classicIds) {
  const [mapId, id] = key.split('|');
  addDialogue(classicBefore, `classic:${mapId}`, id);
}
addDialogue(classicBefore, 'classic:on-enter', GAME.Maps.town.onEnter.dialogue);
noBob(classicBefore, 'percorso classico pre-Ronette');

const classicT1Writers = Object.entries(D.dialogues)
  .filter(([, def]) => def.setFlag === 'ronette_bob')
  .map(([id]) => id);
ok(classicT1Writers.length === 1 && classicT1Writers[0] === 'ronette_letto', 'classico: Ronette è l\'unica writer di ronette_bob');
const classicSourcePages = D.dialogues.ronette_letto.pages.filter((page) => BOB.test(page.text));
ok(classicSourcePages.length === 1 && classicSourcePages[0].name === 'RONETTE', 'classico: la prima fonte a schermo è Ronette');
const diaryAndBobPages = Object.values(D.dialogues).flatMap((def) => [
  ...(def.pages || []), ...((def.again && def.again.pages) || [])
]).filter((page) => /diario/i.test(page.text) && BOB.test(page.text));
ok(diaryAndBobPages.every((page) => /ROBERT/.test(page.text) && /Ronette/.test(page.text) &&
  page.text.indexOf('Ronette') < page.text.indexOf('BOB')),
  'classico: ogni richiamo successivo diario/BOB separa ROBERT e attribuisce BOB a Ronette');

function prepareNode(state, id) {
  const prepared = NR.prepareNode(state, M4, id);
  ok(prepared.ok, `M4:${id} preparabile`);
  return prepared;
}

function commitNode(state, prepared) {
  const result = NR.commitNode(state, M4, prepared);
  ok(result.ok, `M4:${prepared.node.id} committabile`);
}

function prepareChoice(state, nodeId, choiceId) {
  const node = M4.nodes.find((item) => item.id === nodeId);
  const prepared = NR.prepareChoice(state, M4, node, choiceId);
  ok(prepared.ok, `M4:${nodeId}.${choiceId} preparabile`);
  return { node, prepared };
}

function routeBeforeRonette(firstChoice) {
  const screens = [];
  const state = NR.createState();
  state.flags.sogno_fatto = true;

  let prepared = prepareNode(state, 'truman_a2');
  prepared.pages.forEach((page) => screens.push({ label: page.id, text: page.text }));
  commitNode(state, prepared);

  prepared = prepareNode(state, 'ronette_q');
  prepared.pages.forEach((page) => screens.push({ label: page.id, text: page.text }));
  commitNode(state, prepared);

  if (firstChoice) {
    const choice = prepareChoice(state, 'ronette_q', firstChoice);
    const committed = NR.commitChoice(state, M4, choice.node, choice.prepared);
    ok(committed.ok && committed.goto, `M4:${firstChoice} porta al ramo`);
    prepared = prepareNode(state, committed.goto);
    prepared.pages.forEach((page) => screens.push({ label: page.id, text: page.text }));
    commitNode(state, prepared);
  }

  const terminal = prepareChoice(state, 'ronette_q', 'q_uomo');
  const terminalCommit = NR.commitChoice(state, M4, terminal.node, terminal.prepared);
  ok(terminalCommit.ok && terminalCommit.goto === 'ronette_uomo', 'M4:q_uomo porta sempre a Ronette-uomo');
  const source = prepareNode(state, terminalCommit.goto);
  return { screens, source: source.pages };
}

for (const firstChoice of [null, 'q_luogo', 'q_laura']) {
  const route = routeBeforeRonette(firstChoice);
  noBob(route.screens, `M4 pre-Ronette (${firstChoice || 'domanda uomo immediata'})`);
  const firstBob = route.source.find((page) => BOB.test(page.text));
  ok(firstBob && firstBob.speaker_id === 'ronette', `M4 ${firstChoice || 'diretta'}: BOB appare prima con Ronette`);
}

function effectsWithOwner(obj, owner, out) {
  if (Array.isArray(obj)) {
    for (const item of obj) effectsWithOwner(item, owner, out);
    return out;
  }
  if (!obj || typeof obj !== 'object') return out;
  const nextOwner = obj.id && M4.nodes.some((node) => node.id === obj.id) ? obj.id : owner;
  if (Array.isArray(obj.effects) && obj.effects.some((effect) => effect.evidence === 'T1_RONETTE_BOB')) out.push(nextOwner);
  for (const value of Object.values(obj)) effectsWithOwner(value, nextOwner, out);
  return out;
}

const t1Writers = [...new Set(effectsWithOwner(M4, null, []))];
ok(t1Writers.length === 1 && t1Writers[0] === 'ronette_uomo', 'M4: ronette_uomo è l\'unica writer di T1_RONETTE_BOB');
ok(/Ronette/.test(evidence.T1_RONETTE_BOB.label) && evidence.T1_RONETTE_BOB.invariant === 'pronunciata SOLO da Ronette',
  'catalogo T1: Ronette è l\'unica fonte dichiarata');

const laterBobNodes = M4.nodes.filter((node) => node.id !== 'ronette_uomo' &&
  JSON.stringify(node.pages || []).match(/\bBOB\b/));
ok(laterBobNodes.every((node) => (node.conditions || []).some((condition) => condition.evidence === 'T1_RONETTE_BOB')),
  'ogni citazione M4 successiva di BOB richiede già T1');

console.log(`RONETTE-BOB-PROVENANCE-PASS ${checks} controlli; ${classicBefore.length} schermate classiche pre-T1; 3 rotte M4`);
