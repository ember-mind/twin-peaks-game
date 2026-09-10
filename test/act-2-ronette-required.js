/* test/act-2-ronette-required.js — Ronette obbligatoria per il confronto finale.
 * La visita COMPLETATA (evidence T1_RONETTE_BOB, scritta dal terminale
 * ronette_uomo) deve essere prerequisito di cmp_e6a_tjames, non la semplice
 * apertura della visita (flag ronette_visita). Copre: James-prima, Ronette-
 * prima, entrambi gli ordini fino a atto3, salto di Ronette (blocco fermo),
 * ritentabilità di b8_b/b8_c dopo Ronette, save/reload a metà percorso,
 * ed esattamente-un-obiettivo-vero a ogni passo campionato.
 * node test/act-2-ronette-required.js */
'use strict';
const fs = require('fs');
const path = require('path');

global.window = undefined;
require(path.join(__dirname, '..', 'js', 'narrative-runtime.js'));
const NR = global.GAME.NarrativeRuntime;

const ROOT = path.join(__dirname, '..', 'narrative');
const M4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M4.json'), 'utf8'));

let checks = 0, failures = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; console.error('  ✗ ' + msg); } }

function freshState() { const s = NR.createState(); s.flags.sogno_fatto = true; return s; }
function saveLoad(s) { return NR.deserialize(NR.serialize(s)); }
function doNode(s, id) { const p = NR.prepareNode(s, M4, id); if (!p.ok) return p; const c = NR.commitNode(s, M4, p); return { ok: c.ok, prep: p, repeated: c.repeated }; }
function doChoice(s, atId, choiceId) {
  const node = M4.nodes.find(n => n.id === atId);
  const p = NR.prepareChoice(s, M4, node, choiceId);
  if (!p.ok) return p;
  const c = NR.commitChoice(s, M4, node, p);
  if (c.ok && c.goto) { const r = doNode(s, c.goto); return { ok: r.ok, goto: c.goto }; }
  return c;
}
const pres = M4.nodes.find(n => n.id === 'present_truman_m4');
function doPresent(s, propId) { const p = NR.preparePresentation(s, M4, pres, propId); const c = NR.commitPresentation(s, M4, pres, p); return { prep: p, commit: c }; }
function objId(s) { const o = NR.activeObjective(s, M4); return o ? o.id : null; }
function cmpAvailable(s) { return NR.notebookActions(s, M4).some(a => a.node.id === 'cmp_e6a_tjames'); }
function assertSoleObjective(s, label) {
  const t = NR.trueObjectives(s, M4);
  ok(t.length === 1, label + ': esattamente un obiettivo vero (trovati ' + t.length + ': ' + t.map(o => o.id).join(',') + ')');
}

console.log('# act-2-ronette-required: la visita COMPLETATA (T1_RONETTE_BOB) è prerequisito del confronto');

/* ===== JAMES FIRST ===== */
{
  let s = freshState();
  doNode(s, 'truman_a2'); assertSoleObjective(s, 'james-first post-B1');
  doNode(s, 'james_a2');
  ok(!cmpAvailable(s), 'james-first: cmp_e6a_tjames NON disponibile prima di Ronette');
  ok(objId(s) === 'obj_m4_2b', 'james-first: obiettivo @225 dopo James, prima di Ronette (trovato: ' + objId(s) + ')');
  assertSoleObjective(s, 'james-first post-james');

  s = saveLoad(s); // round-trip a metà percorso: la ripresa deve proseguire identica
  ok(objId(s) === 'obj_m4_2b', 'james-first: obiettivo identico dopo save/load');

  doNode(s, 'ronette_q');
  doChoice(s, 'ronette_q', 'q_luogo'); // una domanda non terminale...
  doChoice(s, 'ronette_q', 'q_uomo');  // ...poi il terminale forzato scrive T1_RONETTE_BOB
  ok(s.evidence.T1_RONETTE_BOB === true, 'james-first: ronette_uomo scrive T1_RONETTE_BOB');
  ok(cmpAvailable(s), 'james-first: cmp_e6a_tjames disponibile dopo Ronette completata');
  ok(objId(s) === 'obj_m4_2c', 'james-first: obiettivo @250 dopo James e Ronette (trovato: ' + objId(s) + ')');
  assertSoleObjective(s, 'james-first post-ronette');

  s = saveLoad(s);
  ok(objId(s) === 'obj_m4_2c', 'james-first: obiettivo @250 identico dopo save/load');

  doNode(s, 'cmp_e6a_tjames'); doChoice(s, 'cmp_e6a_tjames', 'b8_a');
  ok(NR.peekProp(s, 'P2').formulation.status === 'formulated', 'james-first: P2 formulata');
  ok(objId(s) === 'obj_m4_3', 'james-first: obiettivo @300 dopo formulazione (trovato: ' + objId(s) + ')');
  assertSoleObjective(s, 'james-first post-formulazione');

  s = saveLoad(s);
  const r = doPresent(s, 'P2');
  ok(r.commit.record.reason_code === 'SUFFICIENT_RELEVANT_SUPPORT', 'james-first: presentazione accettata dopo reload');
  ok(s.flags.atto3 === true, 'james-first: atto3 raggiunto');
  ok(objId(s) === 'obj_m4_4', 'james-first: obiettivo @400 dopo accettazione (trovato: ' + objId(s) + ')');
  assertSoleObjective(s, 'james-first finale');
}

/* ===== RONETTE FIRST ===== */
{
  let s = freshState();
  doNode(s, 'truman_a2');
  doNode(s, 'ronette_q'); doChoice(s, 'ronette_q', 'q_uomo');
  ok(s.evidence.T1_RONETTE_BOB === true, 'ronette-first: T1_RONETTE_BOB scritta');
  ok(!cmpAvailable(s), 'ronette-first: cmp_e6a_tjames NON disponibile prima di James (manca E6A/T_JAMES_EST)');
  ok(objId(s) === 'obj_m4_2a', 'ronette-first: obiettivo @210 dopo Ronette, prima di James (trovato: ' + objId(s) + ')');
  assertSoleObjective(s, 'ronette-first post-ronette');

  doNode(s, 'james_a2');
  ok(cmpAvailable(s), 'ronette-first: cmp_e6a_tjames disponibile dopo James');
  // la UI del taccuino confronta COPPIE: il gate Ronette non deve entrare nel tuple
  ok(NR.notebookPairStatus(s, M4, ['E6A_CUORE_INTERO', 'T_JAMES_EST']).status === 'available',
    'ronette-first: la coppia E6A+T_JAMES risolve "available" nel taccuino (gate via node_done)');
  ok(objId(s) === 'obj_m4_2c', 'ronette-first: obiettivo @250 dopo entrambi (trovato: ' + objId(s) + ')');
  assertSoleObjective(s, 'ronette-first post-james');

  doNode(s, 'cmp_e6a_tjames'); doChoice(s, 'cmp_e6a_tjames', 'b8_a');
  doPresent(s, 'P2');
  ok(s.flags.atto3 === true, 'ronette-first: atto3 raggiunto (ordine invertito, stesso esito)');
  assertSoleObjective(s, 'ronette-first finale');
}

/* ===== SKIP RONETTE: blocco fermo, mai un percorso alternativo ===== */
{
  let s = freshState();
  doNode(s, 'truman_a2'); doNode(s, 'james_a2');
  ok(!s.evidence.T1_RONETTE_BOB, 'skip-ronette: T1_RONETTE_BOB assente (Ronette mai visitata)');
  ok(NR.notebookPairStatus(s, M4, ['E6A_CUORE_INTERO', 'T_JAMES_EST']).status === 'none',
    'skip-ronette: la coppia E6A+T_JAMES resta "none" nel taccuino senza la visita completata');

  const prepFail = NR.prepareNode(s, M4, 'cmp_e6a_tjames');
  ok(!prepFail.ok && String(prepFail.error).indexOf('conditions_not_met') === 0,
    'skip-ronette: prepareNode su cmp_e6a_tjames respinto con conditions_not_met (trovato: ' + (prepFail.error || 'ok') + ')');

  const r = doPresent(s, 'P2');
  ok(r.commit.record.reason_code === 'NOT_YET_FORMULATED', 'skip-ronette: presentazione → NOT_YET_FORMULATED, P2 non formulabile senza Ronette');
  ok(s.flags.atto3 !== true, 'skip-ronette: atto3 NON raggiunto');
  ok(objId(s) === 'obj_m4_2b', 'skip-ronette: resta incagliato su obj_m4_2b (trovato: ' + objId(s) + ')');
  assertSoleObjective(s, 'skip-ronette fermo');
}

/* ===== retry b8_b/b8_c ancora possibile DOPO Ronette ===== */
{
  let s = freshState();
  doNode(s, 'truman_a2'); doNode(s, 'james_a2');
  doNode(s, 'ronette_q'); doChoice(s, 'ronette_q', 'q_uomo');
  doNode(s, 'cmp_e6a_tjames');
  const cmpNode = M4.nodes.find(n => n.id === 'cmp_e6a_tjames');
  ok(NR.availableChoices(s, M4, cmpNode).length === 3, 'retry-post-ronette: tre risposte disponibili');
  doChoice(s, 'cmp_e6a_tjames', 'b8_b');
  ok(!NR.prepareChoice(s, M4, cmpNode, 'b8_b').ok, 'retry-post-ronette: b8_b non ripetibile');
  doChoice(s, 'cmp_e6a_tjames', 'b8_c');
  ok(!NR.prepareChoice(s, M4, cmpNode, 'b8_c').ok, 'retry-post-ronette: b8_c non ripetibile');
  ok(NR.peekProp(s, 'P2').formulation.status === 'unformulated', 'retry-post-ronette: B/C non formulano P2');
  doChoice(s, 'cmp_e6a_tjames', 'b8_a');
  ok(NR.peekProp(s, 'P2').formulation.status === 'formulated', 'retry-post-ronette: A formula P2 dopo i due errori');
  ok(JSON.stringify(s.b8_attempt_history) === JSON.stringify(['GEOGRAPHIC_OVERREACH', 'SYMBOLIC_OVERREACH', 'SOURCE_CORROBORATION']),
    'retry-post-ronette: history B→C→A intatta anche con Ronette come prerequisito');
}

console.log(checks + ' controlli superati' + (failures ? (', ' + failures + ' FALLITI ✗') : ' ✔'));
if (failures > 0) { console.error('ACT-2-RONETTE-REQUIRED-FAIL ' + failures + '/' + checks); process.exit(1); }
console.log('ACT-2-RONETTE-REQUIRED-PASS ' + checks + '/' + checks);
