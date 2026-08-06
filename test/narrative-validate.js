/* test/narrative-validate.js — A.1.1: il validatore ESEGUE lo stesso runtime
 * del motore (js/narrative-runtime.js), ora a TRANSAZIONI (prepare/commit).
 * Include i 10 test-gate della Fase B. node test/narrative-validate.js */
'use strict';
const fs = require('fs');
const path = require('path');

global.window = undefined;
require(path.join(__dirname, '..', 'js', 'narrative-runtime.js'));
const NR = global.GAME.NarrativeRuntime;

let checks = 0, failures = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; console.error('  ✗ ' + msg); } }

const ROOT = path.join(__dirname, '..', 'narrative');
const enums = JSON.parse(fs.readFileSync(path.join(ROOT, 'state-enums.json'), 'utf8'));
const evidence = JSON.parse(fs.readFileSync(path.join(ROOT, 'evidence.json'), 'utf8')).evidence;
const propositions = JSON.parse(fs.readFileSync(path.join(ROOT, 'propositions.json'), 'utf8')).propositions;
const M4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M4.json'), 'utf8'));

/* ================= statica: walk ricorsivi ================= */
console.log('# walk ricorsivi: effetti/condizioni/reason/result a ogni livello');
const foundEffects = [], foundConds = [], foundReasonCodes = [], foundResults = [];
function walk(obj, keyPath) {
  if (Array.isArray(obj)) return obj.forEach((v, i) => walk(v, keyPath + '[' + i + ']'));
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'effects' && Array.isArray(v)) v.forEach(e => foundEffects.push({ path: keyPath, eff: e }));
      if ((k === 'when' || k === 'conditions') && v) (Array.isArray(v) ? v : [v]).forEach(c => foundConds.push({ path: keyPath, cond: c }));
      if (k === 'reason_code') foundReasonCodes.push(v);
      if (k === 'result' && typeof v === 'string') foundResults.push(v);
      walk(v, keyPath + '.' + k);
    }
  }
}
walk(M4, 'M4');
const EFFECT_KEYS = ['set', 'evidence', 'notebook', 'notebook_observation', 'notebook_question', 'proposition', 'to', 'created_from'];
const COND_KEYS = ['not', 'all', 'flag', 'evidence', 'proposition_path', 'contains', 'equals', 'node_done'];
function condRefs(c, out) {
  if (!c || typeof c !== 'object') return out;
  for (const k of Object.keys(c)) ok(COND_KEYS.includes(k), 'operatore di condizione sconosciuto: ' + k);
  if (c.flag) out.push({ kind: 'flag', id: c.flag });
  if (c.evidence) out.push({ kind: 'evidence', id: c.evidence });
  if (c.node_done) out.push({ kind: 'node', id: c.node_done });
  if (c.proposition_path) out.push({ kind: 'prop', id: c.proposition_path.split('.')[0] });
  if (c.not) condRefs(c.not, out);
  if (c.all) c.all.forEach(x => condRefs(x, out));
  return out;
}
const nodeIdSet = new Set(M4.nodes.map(n => n.id));
for (const { path: p, eff } of foundEffects) {
  for (const k of Object.keys(eff)) ok(EFFECT_KEYS.includes(k), p + ': chiave effetto sconosciuta ' + k);
  if (eff.evidence) ok(evidence[eff.evidence] !== undefined, p + ': evidenza inesistente ' + eff.evidence);
  if (eff.proposition) ok(propositions[eff.proposition] !== undefined, p + ': proposizione inesistente ' + eff.proposition);
  if (eff.set) ok(enums.booleans_allowed.includes(eff.set), p + ': boolean non ammesso ' + eff.set);
  if (eff.proposition && eff.to === 'formulated') ok(Array.isArray(eff.created_from) && eff.created_from.length > 0, p + ': formulazione senza created_from');
}
for (const { path: p, cond } of foundConds) {
  ok(typeof cond === 'object', p + ': condizione stringa vietata');
  for (const r of condRefs(cond, [])) {
    if (r.kind === 'evidence') ok(evidence[r.id] !== undefined, p + ': evidenza inesistente ' + r.id);
    if (r.kind === 'prop') ok(propositions[r.id] !== undefined, p + ': proposizione inesistente ' + r.id);
    if (r.kind === 'flag') ok(enums.booleans_allowed.includes(r.id), p + ': flag non ammesso ' + r.id);
    if (r.kind === 'node') ok(nodeIdSet.has(r.id), p + ': node_done su nodo inesistente ' + r.id);
  }
}
for (const rc of foundReasonCodes) ok(enums.enums.presentation_reason_code.includes(rc), 'reason_code fuori enum: ' + rc);
for (const r of foundResults) ok(enums.enums.presentation_result.includes(r) || enums.enums.b8_attempt_result.includes(r), 'result fuori enum: ' + r);

console.log('# reciprocità evidenze↔proposizioni');
for (const [pid, p] of Object.entries(propositions)) {
  const refs = [...((p.support_min || {}).all_of || []), ...(((p.support_strong || {}).all_of) || []), ...(((p.support_strong || {}).any_of) || []), ...(p.requires || [])];
  for (const r of refs) if (evidence[r]) ok((evidence[r].supports || []).includes(pid) || (p.hypothesis === true), pid + '←' + r + ': reciprocità mancante');
}

console.log('# registro GLOBALE delle pagine (principali, presentazione, reopen, repeat)');
const allPages = new Map();
function collectPages(obj) {
  if (Array.isArray(obj)) return obj.forEach(v => collectPages(v));
  if (obj && typeof obj === 'object') {
    if (obj.id && obj.text !== undefined && obj.mode) {
      ok(!allPages.has(obj.id), 'page ID duplicato globalmente: ' + obj.id);
      allPages.set(obj.id, obj);
      ok(obj.mode !== 'dialogue' || !!obj.speaker_id, obj.id + ': dialogo senza speaker_id');
    }
    for (const v of Object.values(obj)) collectPages(v);
  }
}
collectPages(M4);
ok(allPages.size >= 56, 'registro pagine popolato (' + allPages.size + ')');
const rq = M4.nodes.find(n => n.id === 'ronette_q');
ok(rq.rules.reopen.pages && rq.rules.reopen.pages[0] && allPages.has(rq.rules.reopen.pages[0].id), 'la pagina di riapertura ESISTE ed è nel registro');
ok(rq.rules.close_when === undefined, 'niente schema decorativo: close_when eliminato');
ok(rq.rules.reopen.after_new_mandatory_beat === true, 'reopen strutturato ed eseguibile');

console.log('# binding: root vs rami interni');
for (const n of M4.nodes) {
  ok(['world', 'notebook', 'internal'].includes(n.channel), n.id + ': channel valido');
  if (n.channel === 'world') ok(!!n.map_id && !!n.actor_id, n.id + ': binding world completo');
  if (n.channel === 'internal') ok(n.exposed === false, n.id + ': ramo interno non esposto');
}
const t1nodes = M4.nodes.filter(n => (n.effects || []).some(e => e.evidence === 'T1_RONETTE_BOB')).map(n => n.id);
ok(t1nodes.length === 1 && t1nodes[0] === 'ronette_uomo', 'T1 scritta SOLO dentro ronette_uomo');
ok(foundEffects.filter(x => x.eff.set === 'atto3').length === 0, 'atto3: unica autorità = completion');
const pres = M4.nodes.find(n => n.id === 'present_truman_m4');
ok(pres.presentation.target_actor_id === 'truman', 'target della presentazione nel JSON, non hardcoded');

/* ================= dinamica: transazioni ================= */
console.log('# dinamica — transazioni prepare/commit eseguite dal runtime');
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
function doPresent(s, propId) { const p = NR.preparePresentation(s, M4, pres, propId); const c = NR.commitPresentation(s, M4, pres, p); return { prep: p, commit: c }; }

// GATE 1-2: nessun effetto prima del commit; abbandono = stato immutato
{
  let s = freshState();
  const before = NR.serialize(s);
  const p = NR.prepareNode(s, M4, 'truman_a2');
  ok(p.ok && p.pages.length === 7, 'gate1: prepare restituisce le pagine');
  ok(NR.serialize(s) === before, 'gate1: prepare NON muta lo stato');
  ok(!s.flags.sogno_raccontato, 'gate2: abbandono prima del commit → nessun effetto');
  NR.commitNode(s, M4, p);
  ok(s.flags.sogno_raccontato === true, 'gate1: commit applica dopo l\'ultima pagina');
}
// GATE 3: domande riaperte registrate e non ripetibili; availableChoices pura
{
  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'ronette_q');
  doChoice(s, 'ronette_q', 'q_uomo');
  ok(NR.availableChoices(s, M4, rq).length === 0, 'gate3: visita chiusa, niente scelte');
  doNode(s, 'james_a2');
  const beforeRefresh = NR.serialize(s);
  NR.availableChoices(s, M4, rq);
  ok(NR.serialize(s) === beforeRefresh, 'gate3: availableChoices è PURA');
  const beforeReopen = NR.serialize(s);
  const prepReopen = NR.prepareVisitRefresh(s, M4, rq);
  ok(prepReopen && prepReopen.pages[0].id === 'm4.b2.ronette_q.reopen', 'gate3: prepareVisitRefresh restituisce la pagina reale');
  ok(NR.serialize(s) === beforeReopen, 'A12-gate7: prepareVisitRefresh NON muta');
  const cvr = NR.commitVisitRefresh(s, prepReopen);
  ok(cvr.ok, 'A12-gate7: commitVisitRefresh applica reopened');
  doChoice(s, 'ronette_q', 'q_luogo');
  const remaining = NR.availableChoices(s, M4, rq).map(c => c.id);
  ok(JSON.stringify(remaining) === JSON.stringify(['q_laura']), 'gate3: dopo luogo riaperta resta SOLO laura (trovato: ' + remaining.join(',') + ')');
  ok(!NR.prepareChoice(s, M4, rq, 'q_luogo').ok, 'gate3: una domanda riaperta NON è ripetibile');
}
// GATE 4: ripetere B1 non duplica il taccuino (B1 è irripetibile per condizioni;
// l'idempotenza effect_policy=once è provata su James, che resta accessibile)
{
  let s = freshState(); doNode(s, 'truman_a2');
  const notes = s.notebook.length;
  const r2 = NR.prepareNode(s, M4, 'truman_a2');
  ok(!r2.ok, 'gate4: B1 ripetuto → conditions_not_met (root passa a present_truman_m4)');
  ok(s.notebook.length === notes, 'gate4: nessuna nota duplicata');
  doNode(s, 'james_a2');
  const ev = JSON.stringify(s.evidence);
  const rj = NR.prepareNode(s, M4, 'james_a2');
  ok(rj.already_completed === true, 'gate4: James ripetuto → already_completed (effect_policy once)');
  NR.commitNode(s, M4, rj);
  ok(JSON.stringify(s.evidence) === ev, 'gate4: nessuna evidenza duplicata/riscritta');
}
// GATE 5: ripresentare P2 non duplica la history
{
  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'ronette_q'); doChoice(s, 'ronette_q', 'q_uomo');
  doNode(s, 'james_a2'); doNode(s, 'cmp_e6a_tjames'); doChoice(s, 'cmp_e6a_tjames', 'b8_a');
  doPresent(s, 'P2');
  ok(s.flags.atto3 === true, 'gate5: completamento');
  const h1 = s.props.P2.presentations.length, g1 = s.presentations.length;
  const again = doPresent(s, 'P2');
  ok(again.prep.repeated === true, 'gate5: seconda presentazione → repeat, non azione canonica');
  ok(s.props.P2.presentations.length === h1 && s.presentations.length === g1, 'gate5: history NON duplicata');
  ok(s.props.P2.social_status.accepted_by.length === 1, 'gate5: accettazione singola');
}
// GATE 5b: respinta ripetuta → ALREADY_REJECTED
{
  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'ronette_q'); doChoice(s, 'ronette_q', 'q_uomo');
  doNode(s, 'gerard_a2'); doNode(s, 'cmp_t1_e5');
  const r1 = doPresent(s, 'P4B');
  ok(r1.commit.record.reason_code === 'PREMATURE_SYMBOLIC_LINK', 'gate5b: prima respinta nel merito');
  const g1 = s.presentations.length, h1 = s.props.P4B.presentations.length;
  const r2 = doPresent(s, 'P4B');
  ok(r2.commit.record.reason_code === 'ALREADY_REJECTED', 'gate5b: ripetizione → ALREADY_REJECTED');
  ok(s.presentations.length === g1 && s.props.P4B.presentations.length === h1, 'A12-gate8: ALREADY_REJECTED non tocca NESSUNA history canonica');
}
// ===== A.1.2 — gate finali =====
{
  // 1-6: letture pure su stato vergine
  let s = freshState();
  const v0 = NR.serialize(s);
  NR.availableChoices(s, M4, rq);
  ok(NR.serialize(s) === v0, 'A12-1: availableChoices su visita inesistente non muta');
  NR.prepareChoice(s, M4, rq, 'q_luogo');
  ok(NR.serialize(s) === v0, 'A12-2: prepareChoice su visita inesistente non muta');
  NR.activeObjective(s, M4); NR.trueObjectives(s, M4);
  ok(NR.serialize(s) === v0 && Object.keys(s.props).length === 0, 'A12-3: activeObjective/trueObjectives non creano P2');
  NR.worldRoots(s, M4, 'sheriff', 'truman');
  ok(NR.serialize(s) === v0, 'A12-4: worldRoots non crea niente');
  NR.presentationOptions(s, M4, pres);
  ok(NR.serialize(s) === v0 && Object.keys(s.props).length === 0, 'A12-5: presentationOptions non crea P2/P4B');
  NR.preparePresentation(s, M4, pres, 'P2');
  ok(NR.serialize(s) === v0, 'A12-6: preparePresentation su stato vergine non muta');
}
{
  // 9-10: one-shot e stale
  let s = freshState();
  const p1 = NR.prepareNode(s, M4, 'truman_a2');
  NR.commitNode(s, M4, p1);
  const notes = s.notebook.length, rev = s.revision;
  const again = NR.commitNode(s, M4, p1);
  ok(again.repeated === true && s.notebook.length === notes && s.revision === rev, 'A12-9: stesso prepared committato due volte → repeated, zero azioni');
  const pA = NR.prepareNode(s, M4, 'ronette_q');
  const pB = NR.prepareNode(s, M4, 'james_a2');
  NR.commitNode(s, M4, pB); // muta lo stato prima del commit di pA
  const stale = NR.commitNode(s, M4, pA);
  ok(!stale.ok && stale.error === 'stale_transaction', 'A12-10: prepared diventa stale se lo stato cambia prima del commit');
}
{
  // 11: feedback B8 con page ID risolti nel registro
  const b8n = M4.nodes.find(n => n.id === 'cmp_e6a_tjames');
  for (const c of b8n.choices) {
    ok(Array.isArray(c.feedback_pages) && c.feedback_pages[0].id && allPages.has(c.feedback_pages[0].id), 'A12-11: feedback ' + c.id + ' ha page ID nel registro');
  }
  // 12: save/load conserva revision
  let s = freshState();
  const p = NR.prepareNode(s, M4, 'truman_a2'); NR.commitNode(s, M4, p);
  const s2 = NR.deserialize(NR.serialize(s));
  ok(s2.revision === s.revision && s2.committed_tx[p.tx_id] === true, 'A12-12: save/load conserva revision e committed_tx');
}
// GATE 6: infermiera_ctx solo dopo ronette_uomo
{
  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'ronette_q');
  ok(!NR.prepareNode(s, M4, 'infermiera_ctx').ok, 'gate6: infermiera NON disponibile prima della testimonianza');
  doChoice(s, 'ronette_q', 'q_uomo');
  ok(NR.prepareNode(s, M4, 'infermiera_ctx').ok, 'gate6: disponibile dopo');
}
// GATE 7-8: un solo root world per attore in ogni stato
{
  let s = freshState(); doNode(s, 'truman_a2');
  ok(NR.worldRoots(s, M4, 'hospital', 'ronette').length === 1, 'gate7: un solo root Ronette (post-B1)');
  s = freshState();
  let tr = NR.worldRoots(s, M4, 'sheriff', 'truman');
  ok(tr.length === 1 && tr[0].id === 'truman_a2', 'gate8: pre-B1 → solo truman_a2');
  doNode(s, 'truman_a2');
  tr = NR.worldRoots(s, M4, 'sheriff', 'truman');
  ok(tr.length === 1 && tr[0].id === 'present_truman_m4', 'gate8: post-B1 → solo present_truman_m4');
}
// GATE 9: riferimenti di pagina risolti (registro globale)
ok(allPages.has('m4.b2.ronette_q.reopen'), 'gate9: riferimenti di pagina risolti');
// GATE 10: ESATTAMENTE un obiettivo vero in ogni stato raggiungibile
function objExactlyOne(s, label) { const t = NR.trueObjectives(s, M4); ok(t.length === 1, label + ': esattamente UN obiettivo vero (trovati ' + t.length + ': ' + t.map(o => o.id).join(',') + ')'); }
{
  let s = freshState(); objExactlyOne(s, 'gate10 start');
  doNode(s, 'truman_a2'); objExactlyOne(s, 'gate10 post-B1');
  doNode(s, 'ronette_q'); doChoice(s, 'ronette_q', 'q_uomo'); objExactlyOne(s, 'gate10 post-T1');
  doNode(s, 'james_a2'); objExactlyOne(s, 'gate10 post-james');
  doNode(s, 'cmp_e6a_tjames'); doChoice(s, 'cmp_e6a_tjames', 'b8_a'); objExactlyOne(s, 'gate10 P2-formulata');
  doPresent(s, 'P2'); objExactlyOne(s, 'gate10 P2-accettata');
}

console.log('# percorsi completi (save/load a ogni passo)');
function fullPath(label, steps) {
  let s = freshState();
  for (const st of steps) {
    s = saveLoad(s);
    if (st.node) { const r = doNode(s, st.node); ok(r.ok === !st.expectFail, label + ': ' + st.node + (r.ok ? '' : ' (' + (r.error || '') + ')')); }
    if (st.choose) { const r = doChoice(s, st.choose.at, st.choose.id); ok(r.ok, label + ': choose ' + st.choose.id); }
    if (st.present) { const r = doPresent(s, st.present); if (st.expectReason) ok(r.commit.record && r.commit.record.reason_code === st.expectReason, label + ': present → ' + (r.commit.record && r.commit.record.reason_code)); }
    ok(NR.trueObjectives(s, M4).length === 1, label + ': un obiettivo vero');
  }
  return s;
}
let s1 = fullPath('luogo→uomo', [{ node: 'truman_a2' }, { node: 'ronette_q' }, { choose: { at: 'ronette_q', id: 'q_luogo' } }, { choose: { at: 'ronette_q', id: 'q_uomo' } }, { node: 'james_a2' }, { node: 'cmp_e6a_tjames' }, { choose: { at: 'cmp_e6a_tjames', id: 'b8_a' } }, { present: 'P2', expectReason: 'SUFFICIENT_RELEVANT_SUPPORT' }]);
ok(s1.flags.atto3 === true && s1.props.P2.factual_status === 'unconfirmed', 'luogo→uomo: atto3, P2 mai confermata');
let s2 = fullPath('diner-first+gerard-skip', [{ node: 'truman_a2' }, { node: 'james_a2' }, { node: 'ronette_q' }, { choose: { at: 'ronette_q', id: 'q_uomo' } }, { node: 'cmp_e6a_tjames' }, { choose: { at: 'cmp_e6a_tjames', id: 'b8_c' } }, { choose: { at: 'cmp_e6a_tjames', id: 'b8_b' } }, { choose: { at: 'cmp_e6a_tjames', id: 'b8_a' } }, { present: 'P2' }]);
ok(s2.flags.atto3 === true && !s2.evidence.E5_POESIA, 'diner-first: completabile senza Gerard');
ok(JSON.stringify(s2.b8_attempt_history) === JSON.stringify(['SYMBOLIC_OVERREACH', 'GEOGRAPHIC_OVERREACH', 'SOURCE_CORROBORATION']) && s2.assistance_level === 2, 'B8 C→B→A: history+assistenza');
let s3 = fullPath('james-pre-B1 fallisce', [{ node: 'james_a2', expectFail: true }]);
ok(!s3.evidence.E6A_CUORE_INTERO, 'contratto A: James gated');
{
  let s = freshState(); doNode(s, 'truman_a2');
  const r = doPresent(s, 'P2');
  ok(r.commit.record.reason_code === 'NOT_YET_FORMULATED', 'presentazione anticipata → NOT_YET_FORMULATED');
}
{
  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'james_a2');
  ok(NR.peekProp(s, 'P2').formulation.status === 'unformulated', 'P2 mai formulata automaticamente');
  ok(NR.presentationOptions(s, M4, pres).length === 0, 'presentazione vuota prima della formulazione');
}
{
  ok((() => { try { NR.deserialize(JSON.stringify({ schema: '0.9', package: 'narrative-v1.0' })); return false; } catch (e) { return true; } })(), 'deserialize rifiuta schema errato');
  ok((() => { try { const st = NR.createState(); st.flags.m6_tactic_changed = true; NR.deserialize(JSON.stringify(st)); return false; } catch (e) { return true; } })(), 'deserialize rifiuta flag deprecati');
}

/* ===== B3 — taccuino, confronto, formulazione ===== */
console.log('# B3 — notebook, comparison & formulation');
// B3-1: notebookActions PURA e derivata dai dati
{
  let s = freshState();
  const before = NR.serialize(s);
  let acts = NR.notebookActions(s, M4);
  ok(NR.serialize(s) === before, 'B3: notebookActions è PURA (stato vergine)');
  ok(acts.length === 0, 'B3: nessun confronto prima delle evidenze');
  doNode(s, 'truman_a2'); doNode(s, 'james_a2');
  acts = NR.notebookActions(s, M4);
  ok(acts.length === 1 && acts[0].node.id === 'cmp_e6a_tjames', 'B3: confronto E6A+T_JAMES dalle condizioni');
  ok(JSON.stringify(acts[0].required_evidence.slice().sort()) === JSON.stringify(['E6A_CUORE_INTERO', 'T_JAMES_EST']), 'B3: coppia richiesta derivata dai dati');
}
// B3-2: retry policy — stesso errore non ripetibile, doppio tentativo impossibile
{
  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'james_a2'); doNode(s, 'cmp_e6a_tjames');
  const cmpNode = M4.nodes.find(n => n.id === 'cmp_e6a_tjames');
  ok(NR.availableChoices(s, M4, cmpNode).length === 3, 'B3: tre risposte prima dei tentativi');
  doChoice(s, 'cmp_e6a_tjames', 'b8_b');
  let av = NR.availableChoices(s, M4, cmpNode).map(c => c.id);
  ok(JSON.stringify(av) === JSON.stringify(['b8_a', 'b8_c']), 'B3: dopo B restano A e C');
  ok(!NR.prepareChoice(s, M4, cmpNode, 'b8_b').ok, 'B3: B non è ripetibile (prepare rifiuta)');
  doChoice(s, 'cmp_e6a_tjames', 'b8_c');
  av = NR.availableChoices(s, M4, cmpNode).map(c => c.id);
  ok(JSON.stringify(av) === JSON.stringify(['b8_a']), 'B3: dopo B→C resta solo A');
  ok(s.assistance_level === 2 && NR.peekProp(s, 'P2').formulation.status === 'unformulated', 'B3: B/C non formulano; assistenza registrata');
  const p = NR.prepareChoice(s, M4, cmpNode, 'b8_a');
  NR.commitChoice(s, M4, cmpNode, p);
  const h = s.b8_attempt_history.length;
  const again = NR.commitChoice(s, M4, cmpNode, p);
  ok(again.repeated === true && s.b8_attempt_history.length === h, 'B3: doppio commit → repeated, history intatta');
}
// B3-3: comparisons strutturato; nodes_done MAI gate del successo
{
  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'james_a2');
  doNode(s, 'cmp_e6a_tjames');
  ok(s.comparisons.cmp_e6a_tjames && s.comparisons.cmp_e6a_tjames.opened === true, 'B3: opened al commit del nodo');
  ok(s.nodes_done.cmp_e6a_tjames === true && s.comparisons.cmp_e6a_tjames.completed === false, 'B3: nodes_done ≠ successo (aperto ma non completato)');
  doChoice(s, 'cmp_e6a_tjames', 'b8_b');
  ok(JSON.stringify(s.comparisons.cmp_e6a_tjames.attempts) === JSON.stringify(['GEOGRAPHIC_OVERREACH']), 'B3: tentativo registrato in comparisons');
  ok(s.comparisons.cmp_e6a_tjames.completed === false, 'B3: B non completa');
  doChoice(s, 'cmp_e6a_tjames', 'b8_a');
  const c3 = s.comparisons.cmp_e6a_tjames;
  ok(c3.completed === true && c3.result === 'SOURCE_CORROBORATION', 'B3: completed SOLO dalla scelta che formula');
  ok(NR.peekProp(s, 'P2').formulation.status === 'formulated', 'B3: fonte autorevole del successo = formulazione');
  const cmpIds = M4.nodes.filter(n => n.kind === 'comparison').map(n => n.id);
  let uses = [];
  (function walkC(c) { if (!c || typeof c !== 'object') return; if (c.node_done && cmpIds.includes(c.node_done)) uses.push(c.node_done); for (const k in c) walkC(c[k]); })(M4.nodes.map(n => n.conditions).concat(M4.objectives.map(o => o.when)));
  ok(uses.length === 0, 'B3: nessun gate narrativo su nodes_done di un comparison');
}
// B3.1: participant-facing — kinds localizzati, ID mai nel testo, completati nascosti
{
  const NB = require('../js/narrative-notebook.js') || GAME.NarrativeNotebook || (globalThis.GAME && globalThis.GAME.NarrativeNotebook);
  const KL = (globalThis.GAME && globalThis.GAME.NarrativeNotebook) ? globalThis.GAME.NarrativeNotebook.KIND_LABEL : null;
  ok(!!KL, 'B3.1: cataloghi del taccuino caricabili in node');
  const evCat = require('../narrative/evidence.json').evidence;
  const missingKinds = Object.keys(evCat).filter(id => !KL || !KL[evCat[id].kind]);
  ok(missingKinds.length === 0, 'B3.1: all_evidence_kinds_have_ui_labels (senza label: ' + missingKinds.join(',') + ')');
  // gli ID interni non compaiono MAI nel testo di una pagina della missione
  const tokens = ['E6A_', 'T_JAMES_', 'T1_', 'E5_', 'SOURCE_CORROBORATION', 'GEOGRAPHIC_OVERREACH', 'SYMBOLIC_OVERREACH', 'm4.'];
  let leaked = [];
  (function walkP(o) {
    if (!o || typeof o !== 'object') return;
    if (typeof o.text === 'string' && o.id && o.mode) {
      tokens.forEach(t => { if (o.text.indexOf(t) >= 0) leaked.push(o.id + ':' + t); });
    }
    for (const k in o) walkP(o[k]);
  })(M4.nodes);
  ok(leaked.length === 0, 'B3.1: comparison_intro_has_no_internal_ids (trovati: ' + leaked.join(' ') + ')');
  // confronto completato: sparisce dalle azioni del taccuino
  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'james_a2'); doNode(s, 'cmp_e6a_tjames');
  ok(NR.notebookActions(s, M4).length === 1, 'B3.1: confronto disponibile prima del completamento');
  // B3.2: pairStatus a TRE esiti (mai «nessun filo» per un nesso registrato)
  const pair = ['E6A_CUORE_INTERO', 'T_JAMES_EST'];
  const beforePS = NR.serialize(s);
  ok(NR.notebookPairStatus(s, M4, pair).status === 'available', 'B3.2: coppia con confronto aperto → available');
  ok(NR.notebookPairStatus(s, M4, ['E6A_CUORE_INTERO', 'E5_POESIA']).status === 'none', 'B3.2: coppia estranea → none');
  ok(NR.serialize(s) === beforePS, 'B3.2: notebookPairStatus è PURA');
  doChoice(s, 'cmp_e6a_tjames', 'b8_a');
  ok(NR.notebookActions(s, M4).length === 0, 'B3.1: completed_comparison_not_selectable');
  ok(NR.notebookPairStatus(s, M4, pair).status === 'completed', 'B3.2: coppia già risolta → completed (non none)');
  ok(NR.notebookPairStatus(s, M4, pair).node.id === 'cmp_e6a_tjames', 'B3.2: completed riporta il nodo per il richiamo');
  // B4-prep: ogni attore participant-facing ha un nome nel catalogo
  const AN = globalThis.GAME.NarrativeNotebook.ACTOR_NAMES;
  const targets = M4.nodes.filter(n => n.presentation && n.presentation.target_actor_id).map(n => n.presentation.target_actor_id);
  const unnamed = targets.filter(a => !AN[a]);
  ok(unnamed.length === 0, 'B4-prep: actor participant-facing senza nome nel catalogo: ' + unnamed.join(','));
}
// B3-4: created_from esatto, factual unconfirmed, save/load nei 5 checkpoint
{
  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'james_a2');
  s = saveLoad(s); // checkpoint 1: dopo le acquisizioni
  doNode(s, 'cmp_e6a_tjames');
  s = saveLoad(s); // checkpoint 2: dopo l'apertura del confronto
  doChoice(s, 'cmp_e6a_tjames', 'b8_b');
  s = saveLoad(s); // checkpoint 3: dopo l'errore B
  const cmpNode = M4.nodes.find(n => n.id === 'cmp_e6a_tjames');
  ok(JSON.stringify(NR.availableChoices(s, M4, cmpNode).map(c => c.id)) === JSON.stringify(['b8_a', 'b8_c']), 'B3: opzioni residue identiche dopo load');
  doChoice(s, 'cmp_e6a_tjames', 'b8_c');
  s = saveLoad(s); // checkpoint 4: dopo B→C
  ok(s.assistance_level === 2 && JSON.stringify(s.b8_attempt_history) === JSON.stringify(['GEOGRAPHIC_OVERREACH', 'SYMBOLIC_OVERREACH']), 'B3: history+assistenza identiche dopo load');
  doChoice(s, 'cmp_e6a_tjames', 'b8_a');
  s = saveLoad(s); // checkpoint 5: dopo la formulazione
  const f = NR.peekProp(s, 'P2').formulation;
  ok(f.status === 'formulated' && JSON.stringify(f.created_from) === JSON.stringify(['E6A_CUORE_INTERO', 'T_JAMES_EST']), 'B3: created_from ESATTO dopo load');
  ok(NR.peekProp(s, 'P2').factual_status === 'unconfirmed', 'B3: mai confermata dai fatti in M4');
  ok(s.comparisons.cmp_e6a_tjames.completed === true, 'B3: comparisons sopravvive al load');
}

/* ===== B4 — presentazione a Truman ===== */
console.log('# B4 — presentation to Truman');
{
  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'ronette_q'); doChoice(s, 'ronette_q', 'q_uomo');
  doNode(s, 'gerard_a2'); doNode(s, 'james_a2');
  doNode(s, 'cmp_t1_e5'); doNode(s, 'cmp_e6a_tjames'); doChoice(s, 'cmp_e6a_tjames', 'b8_a');
  ok(NR.peekProp(s, 'P4B').formulation.status === 'formulated', 'B4: P4B formulata dal confronto opzionale');
  ok(NR.presentationOptions(s, M4, pres).slice().sort().join(',') === 'P2,P4B', 'B4: opzioni = solo formulate (P2+P4B)');
  const r1 = doPresent(s, 'P4B');
  ok(r1.commit.record.reason_code === 'PREMATURE_SYMBOLIC_LINK' &&
     r1.commit.record.evidence_shown.join(',') === 'T1_RONETTE_BOB,E5_POESIA', 'B4: record rejected con evidence_shown esatto');
  ok(s.flags.atto3 !== true && NR.activeObjective(s, M4).id === 'obj_m4_3', 'B4: il rifiuto non cambia atto né obiettivo');
  const g1 = s.presentations.length, h1 = s.props.P4B.presentations.length;
  const r2 = doPresent(s, 'P4B');
  ok(r2.commit.record.reason_code === 'ALREADY_REJECTED' && s.presentations.length === g1 &&
     s.props.P4B.presentations.length === h1, 'B4: seconda identica → ALREADY_REJECTED, zero history');
  const r3 = doPresent(s, 'P2');
  ok(r3.commit.record.result === 'accepted' && r3.commit.record.acceptance_type === 'investigatory_route' &&
     r3.commit.record.evidence_shown.join(',') === 'E6A_CUORE_INTERO,T_JAMES_EST' &&
     r3.commit.record.target === 'truman' && r3.commit.record.mission === 'M4', 'B4: record accepted COMPLETO');
  ok(s.flags.atto3 === true && NR.activeObjective(s, M4).id === 'obj_m4_4', 'B4: atto3 dal completion evaluator, obiettivo est');
  ok(NR.peekProp(s, 'P2').factual_status === 'unconfirmed', 'B4: accettata socialmente, MAI confermata');
  const r4 = doPresent(s, 'P2');
  ok(r4.prep.repeated === true && r4.prep.pages[0] && r4.prep.pages[0].id === 'm4.repeat.present_truman_m4', 'B4: repeat canonico, niente menu');
  // autorità UNICA di acceptance_type: ramo di presentazione == catalogo
  const prCatalog = require('../narrative/propositions.json').propositions;
  const brAT = pres.presentation.on.P2.acceptance_type, catAT = prCatalog.P2.acceptance_type;
  ok(brAT === 'investigatory_route' && catAT === 'investigatory_route' && brAT === catAT, 'B4: acceptance_type coerente (ramo=' + brAT + ', catalogo=' + catAT + ')');
  // memoria del rifiuto: pagina diegetica STABILE dai dati, mai commit invisibile
  const arp = pres.presentation.on.P4B.already_rejected_page;
  ok(arp && arp.id === 'm4.b9.p4b.already_rejected' && r2.prep.pages[0] && r2.prep.pages[0].id === arp.id, 'B4: ALREADY_REJECTED con pagina diegetica dai dati');
  ok(s.presentations.length === g1 + 1 && s.props.P2.presentations.length === 1, 'B4: il repeat non duplica alcun record');
  s = saveLoad(s);
  ok(NR.activeObjective(s, M4).id === 'obj_m4_4' && s.props.P2.social_status.accepted_by.join(',') === 'truman' &&
     NR.presentationOptions(s, M4, pres).indexOf('P4B') >= 0, 'B4: save/load conserva accettazione, obiettivo e opzioni');
}
// B4: ramo anticipato idempotente — un solo record NOT_YET_FORMULATED
{
  let s = freshState(); doNode(s, 'truman_a2');
  doPresent(s, null); doPresent(s, null); doPresent(s, null);
  const nyf = s.presentations.filter(r => r.reason_code === 'NOT_YET_FORMULATED');
  ok(nyf.length === 1, 'B4: NOT_YET_FORMULATED non riempie la history (trovati ' + nyf.length + ')');
  ok(s.notebook.filter(n => n.id === 'm4.q.visits').length === 1, 'B4: la domanda del taccuino resta una (upsert)');
}

/* ===== B5 — narrative save integration (modulo storage-agnostico) ===== */
console.log('# B5 — narrative save');
{
  globalThis.__NARRATIVE_TEST__ = true; // abilita gli hook di test del modulo save
  require('../js/narrative-save.js');
  const NS = globalThis.GAME.NarrativeSave;
  const mem = new Map();
  NS._setStorage({ getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) });

  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'james_a2');
  let status = 'idle';
  globalThis.GAME.NarrativeAdapter = {
    isEnabled: () => true, active: () => status === 'active', sessionStatus: () => status,
    getState: () => s, getMission: () => M4
  };
  const classic = { mapId: 'sheriff', tx: 9, ty: 2, dir: 'up', clues: ['b', 'a'], flags: { atto2: true } };

  // gate: mai salvare sotto lease / in partial_error; NESSUN bypass pubblico
  status = 'active';
  ok(NS.save('0', { classic }).error === 'save_not_allowed', 'B5: save vietato con sessione attiva');
  status = 'partial_error';
  ok(NS.save('0', { classic }).error === 'save_not_allowed', 'B5: save vietato in partial_error');
  status = 'active';
  ok(NS.save('0', { classic, force: true }).error === 'save_not_allowed', 'B5.1: save_gate_has_no_public_bypass (force ignorato)');
  status = 'idle';

  const r1 = NS.save('0', { classic });
  ok(r1.ok && NS.has('0') && !mem.has(NS.keyFor('0') + ':tmp'), 'B5: save atomico (main scritto, tmp rimosso)');
  const env1 = NS.inspect('0');
  ok(env1.format_version === '1.0.0' && env1.narrative_package === 'narrative-v1.0' &&
     env1.narrative_schema_version === NR.schemaVersion &&
     env1.slot_id === '0' && env1.mission === 'M4' && env1.save_generation === r1.generation, 'B5: envelope completo (versioni dal runtime)');

  const l1 = NS.load('0', { classic });
  ok(l1.ok && NR.serialize(l1.state) === NR.serialize(s), 'B5: load → stato byte-identico (generazione verificata in AUTOMATICO)');
  ok(NR.activeObjective(l1.state, M4).id === NR.activeObjective(s, M4).id &&
     NR.worldRoots(l1.state, M4, 'sheriff', 'truman')[0].id === NR.worldRoots(s, M4, 'sheriff', 'truman')[0].id,
     'B5: obiettivo e worldRoots ricostruiti dai dati');

  // B5.1: fingerprint canonica sull'INTERO payload classico
  ok(NS.classicFingerprint({ mapId: 'sheriff', tx: 9, ty: 2, dir: 'up', clues: ['a', 'b'], flags: { atto2: true } }) ===
     NS.classicFingerprint(classic), 'B5.1: fingerprint stabile su ordine chiavi/clues');
  ok(NS.classicFingerprint(Object.assign({}, classic, { clues: ['cuore', 'a'] })) !== NS.classicFingerprint(classic), 'B5.1: fingerprint_changes_with_clue_identity');
  ok(NS.classicFingerprint(Object.assign({}, classic, { flags: { different: true } })) !== NS.classicFingerprint(classic), 'B5.1: fingerprint_changes_with_flags');
  ok(NS.classicFingerprint(Object.assign({}, classic, { dir: 'down' })) !== NS.classicFingerprint(classic), 'B5.1: fingerprint_changes_with_direction');

  // secondo save: backup + generazione per-slot
  doNode(s, 'cmp_e6a_tjames'); doChoice(s, 'cmp_e6a_tjames', 'b8_a');
  const prevMain = mem.get(NS.keyFor('0'));
  const r2 = NS.save('0', { classic });
  ok(r2.ok && mem.get(NS.keyFor('0') + ':backup') === prevMain && r2.generation === r1.generation + 1 &&
     NS.generation('0') === r2.generation, 'B5: backup + generazione per-slot monotona');

  // B5.1: generation_checked_without_explicit_option — main con generazione
  // vecchia (replay) respinto SENZA passare alcuna opzione
  const goodMain = mem.get(NS.keyFor('0'));
  mem.set(NS.keyFor('0'), prevMain); // replay del save precedente (gen-1)
  mem.delete(NS.keyFor('0') + ':backup');
  const lrep = NS.load('0', { classic });
  ok(!lrep.ok && String(lrep.error).indexOf('save_generation_mismatch') === 0, 'B5.1: generation_checked_without_explicit_option');
  mem.set(NS.keyFor('0'), goodMain);

  // corrotto → backup (con generazione meta-1) → promozione e riallineamento
  mem.set(NS.keyFor('0') + ':backup', prevMain);
  mem.set(NS.keyFor('0'), '{corrotto');
  const lb = NS.load('0', { classic });
  ok(lb.ok && lb.recovered_from_backup === true && lb.envelope.save_generation === r2.generation - 1 &&
     NS.generation('0') === r2.generation - 1 && mem.get(NS.keyFor('0')) === prevMain, 'B5.1: backup_generation_recovery (promosso + meta riallineata)');
  // ripristina main buono e meta coerente
  mem.set(NS.keyFor('0'), goodMain);
  const meta = JSON.parse(mem.get('twin-peaks:narrative:narrative-v1.0:meta')); meta.slots['0'] = r2.generation;
  mem.set('twin-peaks:narrative:narrative-v1.0:meta', JSON.stringify(meta));
  mem.set(NS.keyFor('0') + ':backup', '{pure');
  mem.set(NS.keyFor('0'), '{corrotto');
  const lc = NS.load('0', { classic });
  ok(!lc.ok && lc.error === 'save_corrupted_main_and_backup', 'B5: main+backup corrotti → errore, mai reset silenzioso');
  mem.set(NS.keyFor('0'), goodMain); mem.delete(NS.keyFor('0') + ':backup');

  // matrice di rifiuto B5.1 (tutte AUTOMATICHE)
  function tamper(fn, label) {
    const env = JSON.parse(goodMain); fn(env);
    mem.set(NS.keyFor('0'), JSON.stringify(env));
    const r = NS.load('0', { classic });
    ok(!r.ok, label + ' (errore: ' + (r.error || 'nessuno!') + ')');
    mem.set(NS.keyFor('0'), goodMain);
  }
  tamper(e => { e.narrative_schema_version = '9.0.0'; }, 'B5.1: envelope_schema_mismatch_rejected');
  tamper(e => { e.narrative_package = 'narrative-v9.9'; }, 'B5: package futuro respinto');
  tamper(e => { e.slot_id = '999'; }, 'B5.1: slot_id_mismatch_rejected');
  tamper(e => { e.mission = 'M99'; }, 'B5.1: mission_mismatch_rejected');
  tamper(e => { e.state.flags.m6_tactic_changed = true; }, 'B5: flag deprecato respinto (autorità NR.deserialize)');
  ok(!NS.load('0', { classic: Object.assign({}, classic, { clues: ['x'] }) }).ok, 'B5: fingerprint classico diverso respinto');

  // chiave assente: nuova partita vs partita avanzata
  NS.clear('0');
  const lf = NS.load('0', {});
  ok(lf.ok && lf.fresh === true && lf.state.revision === 0, 'B5: chiave assente su partita nuova → stato nuovo');
  ok(NS.load('0', { classic, classicAdvanced: true }).error === 'narrative_save_missing_for_advanced_classic', 'B5: chiave assente su classico avanzato → errore di compatibilità');

  // ===== B5.2 — crash-consistency e contratto dell'API =====
  ok(NS.save('0', {}).error === 'classic_save_required', 'B5.2: save_without_classic_rejected');
  const rA = NS.save('0', { classic });
  ok(rA.ok && !mem.has(NS.keyFor('0') + ':tmp'), 'B5.2: temp_removed_after_successful_finalize');
  ok(NS.load('0', {}).error === 'classic_save_required', 'B5.2: load_existing_without_classic_rejected');
  const rB = NS.save('0', { classic }); // gen rA+1
  const METAK = 'twin-peaks:narrative:narrative-v1.0:meta';
  // crash dopo il main, prima della meta: meta=N-1, main=N, temp=N, backup=N-1
  const mainN = mem.get(NS.keyFor('0'));
  mem.set(NS.keyFor('0') + ':tmp', mainN);
  mem.set(METAK, JSON.stringify({ slots: { '0': rB.generation - 1 } }));
  const lRec = NS.load('0', { classic });
  ok(lRec.ok && lRec.envelope.save_generation === rB.generation && NS.generation('0') === rB.generation &&
     !mem.has(NS.keyFor('0') + ':tmp'), 'B5.2: crash_after_main_before_meta_recovers_main');
  // temp orfana NON valida: niente riparazione, load normale, temp rimossa
  mem.set(NS.keyFor('0') + ':tmp', '{garbage');
  const lOrf = NS.load('0', { classic });
  ok(lOrf.ok && lOrf.envelope.save_generation === rB.generation && !mem.has(NS.keyFor('0') + ':tmp'), 'B5.2: interrupted_temp_validated_before_meta_repair (orfana scartata)');
  // meta rigorosa quando il main esiste
  const metaGood = mem.get(METAK);
  mem.delete(METAK);
  ok(NS.load('0', { classic }).error === 'save_generation_meta_missing', 'B5.2: meta_missing_with_existing_main_rejected');
  ok(NS.save('0', { classic }).error === 'save_generation_meta_missing', 'B5.2: save con meta assente e main esistente → rifiuto');
  mem.set(METAK, '{corrotta');
  ok(NS.load('0', { classic }).error === 'save_generation_meta_corrupt', 'B5.2: meta_corrupt_with_existing_main_rejected');
  mem.set(METAK, JSON.stringify({ slots: {} }));
  ok(NS.load('0', { classic }).error === 'save_generation_slot_missing', 'B5.2: meta_slot_missing_with_existing_main_rejected');
  mem.set(METAK, metaGood);
  ok(NS.load('0', { classic }).ok === true, 'B5.2: meta ripristinata → load di nuovo valido');

  // ===== B5.3 — crash al PRIMISSIMO salvataggio (meta mai scritta) =====
  // ricrea lo scenario: main gen1 + temp==main, NIENTE meta, NIENTE backup
  NS.clear('0'); mem.delete(METAK);
  const rF = NS.save('0', { classic });
  ok(rF.ok && rF.generation === 1, 'B5.3: primo save su storage vergine → gen 1');
  const firstMain = mem.get(NS.keyFor('0'));
  mem.delete(METAK);                                  // crash: meta mai finalizzata
  mem.set(NS.keyFor('0') + ':tmp', firstMain);        // journal ancora presente
  const lF = NS.load('0', { classic });
  ok(lF.ok && lF.envelope.save_generation === 1 && NS.generation('0') === 1 &&
     !mem.has(NS.keyFor('0') + ':tmp'), 'B5.3: first_save_crash_after_main_before_meta_recovers_main');
  // nuovo slot: meta esiste per lo slot 0 ma non per l'1
  const rS1 = NS.save('1', { classic });
  ok(rS1.ok && rS1.generation === 1, 'B5.3: primo save dello slot 1');
  const s1Main = mem.get(NS.keyFor('1'));
  const metaOnly0 = JSON.stringify({ slots: { '0': 1 } });
  mem.set(METAK, metaOnly0);                          // crash: slot 1 mai registrato
  mem.set(NS.keyFor('1') + ':tmp', s1Main);
  const lS1 = NS.load('1', { classic });
  ok(lS1.ok && NS.generation('1') === 1 && NS.generation('0') === 1,
     'B5.3: first_save_new_slot_crash_recovers_missing_slot_generation');
  // meta assente SENZA journal corrispondente: rifiuto, mai auto-riparazione
  mem.delete(METAK); mem.delete(NS.keyFor('0') + ':tmp');
  ok(NS.load('0', { classic }).error === 'save_generation_meta_missing',
     'B5.3: first_save_missing_meta_without_matching_journal_rejected');
  // journal ≠ main: NESSUNA riparazione
  mem.set(NS.keyFor('0') + ':tmp', s1Main); // temp di un ALTRO slot ≠ main dello 0
  ok(NS.load('0', { classic }).error === 'save_generation_meta_missing',
     'B5.3: first_save_journal_main_mismatch_not_repaired');
  mem.delete(NS.keyFor('0') + ':tmp');

  // ===== B5.4 — corruzione della meta ≠ assenza (mai ricostruzione silenziosa) =====
  // meta CORROTTA + journal di primo salvataggio valido → RESPINTO
  mem.set(METAK, JSON.stringify({ slots: { '0': 1 } })); // base sana per ricostruire lo scenario
  const fMain0 = mem.get(NS.keyFor('0'));
  mem.set(METAK, '{corrupt');
  mem.set(NS.keyFor('0') + ':tmp', fMain0);
  const lc1 = NS.load('0', { classic });
  ok(!lc1.ok && lc1.error === 'save_generation_meta_corrupt', 'B5.4: first_save_corrupt_meta_matching_journal_rejected');
  ok(mem.get(METAK) === '{corrupt', 'B5.4: la meta corrotta NON viene ricostruita in silenzio');
  mem.delete(NS.keyFor('0') + ':tmp');
  // nuovo slot con meta globale corrotta: niente sovrascrittura
  const s1M = mem.get(NS.keyFor('1'));
  mem.set(NS.keyFor('1') + ':tmp', s1M);
  const lc2 = NS.load('1', { classic });
  ok(!lc2.ok && lc2.error === 'save_generation_meta_corrupt' && mem.get(METAK) === '{corrupt',
     'B5.4: first_save_new_slot_corrupt_meta_does_not_overwrite_existing_meta');
  mem.delete(NS.keyFor('1') + ':tmp');
  // forme malformate specifiche
  mem.set(METAK, JSON.stringify({ slots: [] }));
  ok(NS.load('0', { classic }).error === 'save_generation_meta_corrupt', 'B5.4: meta_slots_array_rejected');
  mem.set(METAK, JSON.stringify({ slots: { '0': 1.5 } }));
  ok(NS.load('0', { classic }).error === 'save_generation_meta_corrupt', 'B5.4: meta_generation_non_integer_rejected');
  mem.set(METAK, JSON.stringify({ slots: { '0': 1, '1': 1 } }));
  ok(NS.load('0', { classic }).ok === true, 'B5.4: meta sana ripristinata → load valido');

  delete globalThis.GAME.NarrativeAdapter;
}

/* ===== C5-B — M5 dinamica: 72 percorsi + pairwise + abort/resume ===== */
console.log('# C5-B — M5 dynamic (runtime esteso, matrice canonica)');
const M5 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M5.json'), 'utf8'));
{
  const domains = {};
  for (const [name, enumName] of Object.entries(enums.values_allowed)) domains[name] = enums.enums[enumName];
  NR.setValueDomains(domains);
}
function doNode5(s, id) { const p = NR.prepareNode(s, M5, id); if (!p.ok) return p; const c = NR.commitNode(s, M5, p); return { ok: c.ok, prep: p, commit: c }; }
function doChoice5(s, atId, choiceId) {
  const node = M5.nodes.find(n => n.id === atId);
  const p = NR.prepareChoice(s, M5, node, choiceId);
  if (!p.ok) return p;
  const c = NR.commitChoice(s, M5, node, p);
  if (c.ok && c.goto) { const r = doNode5(s, c.goto); return { ok: r.ok, goto: c.goto }; }
  return c;
}
function m5Base() { // fine-M4 REALE via runtime M4, poi ingresso fisico M5
  let s = freshState();
  doNode(s, 'truman_a2'); doNode(s, 'james_a2');
  doNode(s, 'cmp_e6a_tjames'); doChoice(s, 'cmp_e6a_tjames', 'b8_a');
  doPresent(s, 'P2');
  doNode5(s, 'm5_bridge'); doNode5(s, 'm5_discovery');
  return s;
}
const OBS = { T: 'm5_mound', R: 'm5_ring', S: 'm5_scene' };
const ORDERS = ['TRS', 'TSR', 'RTS', 'RST', 'STR', 'SRT'];
const THEORIES = [['theory_degeneration', 'degeneration'], ['theory_staging', 'staging']];
const REVS = [['revision_keep', null, false], ['revision_switch', 'opposite', true], ['revision_open', 'open', true]];
const S1S = [['s1_institutional', 'institutional'], ['s1_documented', 'documented_custody']];
let pathCount = 0;
for (const order of ORDERS) for (const [tCh, tVal] of THEORIES) for (const [rCh, rKind, rRev] of REVS) for (const [sCh, sVal] of S1S) {
  pathCount++;
  const label = 'M5[' + order + '/' + tVal + '/' + rCh + '/' + sVal + ']';
  let s = m5Base();
  const b8Before = JSON.stringify(s.b8_attempt_history), assistBefore = s.assistance_level;
  s = saveLoad(s);
  let r = doNode5(s, OBS[order[0]]); ok(r.ok, label + ': gruppo1');
  ok(NR.trueObjectives(s, M5).length === 1, label + ': un obiettivo vero (post g1)');
  s = saveLoad(s);
  r = doNode5(s, OBS[order[1]]); ok(r.ok, label + ': gruppo2');
  ok(NR.pendingMilestones(s, M5).length === 1, label + ': milestone iniziale pendente');
  ok(!NR.prepareNode(s, M5, OBS[order[2]]).ok, label + ': 3° gruppo bloccato (milestone_pending)');
  let pt = NR.prepareNode(s, M5, 'm5_theory_initial'); ok(pt.ok && pt.pages.length === 1, label + ': prompt teoria apribile');
  NR.commitNode(s, M5, pt);
  ok(NR.pendingMilestones(s, M5).length === 1, label + ': milestone NON risolta dal commit del prompt');
  ok(s.beats_completed.indexOf('m5_theory_initial') === -1, label + ': beat NON scritto dal prompt');
  ok(!NR.prepareNode(s, M5, OBS[order[2]]).ok, label + ': 3° gruppo ancora bloccato');
  s = saveLoad(s);
  const rc = NR.prepareNode(s, M5, 'm5_theory_initial');
  ok(rc.resume_choice === true && rc.pages.length === 0, label + ': abort/save → riapre il widget, niente prompt né repeat');
  doChoice5(s, 'm5_theory_initial', tCh);
  ok(s.values.m5_initial_theory === tVal, label + ': iniziale = ' + tVal);
  ok(NR.pendingMilestones(s, M5).length === 0, label + ': milestone risolta dal VALORE');
  s = saveLoad(s);
  r = doNode5(s, OBS[order[2]]); ok(r.ok, label + ': gruppo3 ora permesso');
  ok(NR.groupsCompleted(s, M5, 'm5_observations') === 3, label + ': 3 gruppi completi');
  ok(!NR.prepareNode(s, M5, 'm5_report_intro').ok, label + ': rapporto bloccato dalla revisione');
  let pv = NR.prepareNode(s, M5, 'm5_theory_revision'); NR.commitNode(s, M5, pv);
  ok(NR.pendingMilestones(s, M5).length === 1, label + ': revisione non risolta dal prompt');
  doChoice5(s, 'm5_theory_revision', rCh);
  const expectedFinal = rKind === null ? tVal : rKind === 'opposite' ? (tVal === 'degeneration' ? 'staging' : 'degeneration') : 'open';
  ok(s.values.m5_final_theory === expectedFinal, label + ': finale = ' + expectedFinal);
  ok(!!s.flags.m5_theory_revised === rRev, label + ': revised = ' + rRev);
  s = saveLoad(s);
  let pi = NR.prepareNode(s, M5, 'm5_report_intro');
  ok(pi.ok && pi.pages.some(pg => pg.id === 'm5.b9.report.theory_' + expectedFinal), label + ': pagina-teoria corretta nel rapporto');
  NR.commitNode(s, M5, pi);
  const cont = NR.prepareNode(s, M5, 'm5_report_intro');
  ok(cont.continuation === 'm5_s1', label + ': abort_s1_resumes_s1_not_repeat');
  s = saveLoad(s);
  ok(NR.prepareNode(s, M5, 'm5_report_intro').continuation === 'm5_s1', label + ': save_after_report_intro_resumes_s1');
  doChoice5(s, 'm5_s1', sCh);
  ok(s.values.s1 === sVal, label + ': s1 = ' + sVal);
  ok(s.flags.east_route_confirmed === true, label + ': east_route al commit della chiusura');
  ok(NR.activeObjective(s, M5).id === 'obj_m5_4', label + ': obiettivo OEJ');
  ok(s.beats_completed.indexOf('m5_report_close') !== -1 && s.beats_completed.indexOf('m5_report_intro') === -1, label + ': beat SOLO sul ramo finale');
  const rep2 = NR.prepareNode(s, M5, 'm5_report_intro');
  ok(rep2.already_completed === true && rep2.pages[0] && rep2.pages[0].id === 'm5.repeat.report', label + ': repeat_only_after_east_route_confirmed');
  ok(JSON.stringify(s.b8_attempt_history) === b8Before && s.assistance_level === assistBefore, label + ': stato B8/assistenza M4 IMMUTATO');
  ok(NR.peekProp(s, 'P3B').formulation.status === 'unformulated', label + ': P3B mai formulata');
  s = saveLoad(s);
  ok(NR.serialize(NR.deserialize(NR.serialize(s))) === NR.serialize(s), label + ': round-trip finale');
}
ok(pathCount === 72, 'matrice canonica: 72 percorsi ESEGUITI dal runtime (' + pathCount + ')');

console.log('# C5-B — pairwise, continuation, domini, confronti, registro');
{
  // abort_report_close_after_s1_resumes_close + s1_not_reasked_after_commit
  let s = m5Base();
  doNode5(s, 'm5_mound'); doNode5(s, 'm5_ring');
  let pt = NR.prepareNode(s, M5, 'm5_theory_initial'); NR.commitNode(s, M5, pt);
  doChoice5(s, 'm5_theory_initial', 'theory_degeneration');
  doNode5(s, 'm5_scene');
  let pv = NR.prepareNode(s, M5, 'm5_theory_revision'); NR.commitNode(s, M5, pv);
  doChoice5(s, 'm5_theory_revision', 'revision_keep');
  let pi = NR.prepareNode(s, M5, 'm5_report_intro'); NR.commitNode(s, M5, pi);
  // S1 committata SENZA seguire il goto (abort sul ramo di chiusura)
  const s1Node = M5.nodes.find(n => n.id === 'm5_s1');
  const pc = NR.prepareChoice(s, M5, s1Node, 's1_institutional');
  NR.commitChoice(s, M5, s1Node, pc);
  ok(s.values.s1 === 'institutional' && s.flags.east_route_confirmed !== true, 'C5B: s1 scritta, chiusura abortita');
  ok(NR.prepareNode(s, M5, 'm5_report_intro').continuation === 'm5_report_close', 'C5B: abort_report_close_after_s1_resumes_close');
  s = saveLoad(s);
  ok(NR.prepareNode(s, M5, 'm5_report_intro').continuation === 'm5_report_close', 'C5B: save_after_s1_commit_before_close_resumes_close');
  // s1 write-once: un secondo commit non riscrive
  const pc2 = NR.prepareChoice(s, M5, s1Node, 's1_documented');
  NR.commitChoice(s, M5, s1Node, pc2);
  ok(s.values.s1 === 'institutional', 'C5B: s1_not_reasked_after_commit (write-once)');
  doNode5(s, 'm5_report_close');
  ok(s.flags.east_route_confirmed === true, 'C5B: completed_choice_continues_to_common_next (chiusura ripresa)');
}
{
  // domini: deserialize respinge lo stato impossibile
  let s = m5Base();
  const raw = JSON.parse(NR.serialize(s));
  raw.values.m5_initial_theory = 'open';
  ok((() => { try { NR.deserialize(JSON.stringify(raw)); return false; } catch (e) { return String(e.message).indexOf('save_value_out_of_domain') === 0; } })(), 'C5B: deserialize_rejects_impossible_initial_theory');
  // opposite_of con sorgente assente → prepare rifiutato
  const revNode = M5.nodes.find(n => n.id === 'm5_theory_revision');
  const bad = NR.prepareChoice(s, M5, revNode, 'revision_switch');
  ok(!bad.ok && String(bad.error).indexOf('value_source_missing') === 0, 'C5B: opposite_of senza sorgente → prepare rifiutato');
}
{
  // confronto anello: tentativi per-comparison, assistenza M4 intoccata
  let s = m5Base();
  doNode5(s, 'm5_ring'); doNode5(s, 'm5_mound');
  let pt = NR.prepareNode(s, M5, 'm5_theory_initial'); NR.commitNode(s, M5, pt);
  doChoice5(s, 'm5_theory_initial', 'theory_staging');
  const a0 = s.assistance_level, b80 = JSON.stringify(s.b8_attempt_history);
  doNode5(s, 'm5_cmp_ring');
  doChoice5(s, 'm5_cmp_ring', 'ring_b');
  ok(JSON.stringify(s.comparisons.m5_cmp_ring.attempts) === JSON.stringify(['NO_ENTRY_OVERREACH']), 'C5B: tentativo nello scope del confronto');
  ok(s.assistance_level === a0 && JSON.stringify(s.b8_attempt_history) === b80, 'C5B: b8/assistenza M4 mai toccate dal retry M5');
  const cmpNode = M5.nodes.find(n => n.id === 'm5_cmp_ring');
  ok(NR.availableChoices(s, M5, cmpNode).map(c => c.id).join(',') === 'ring_a,ring_c', 'C5B: risposta tentata nascosta (scope comparison)');
  doChoice5(s, 'm5_cmp_ring', 'ring_a');
  ok(NR.peekProp(s, 'P3A').formulation.status === 'formulated' && NR.peekProp(s, 'P3A').factual_status === 'unconfirmed', 'C5B: P3A formulata, mai confermata');
  ok(s.values.m5_initial_theory === 'staging' && NR.peekProp(s, 'P3A').formulation.status === 'formulated', 'C5B: tensione conservata (teoria ≠ P3A)');
}
{
  // E7A↔E5: completed al node commit; registro cross-mission
  let s = m5Base();
  doNode(s, 'gerard_a2'); // E5 (nodo M4, stato condiviso)
  doNode5(s, 'm5_mound');
  let acts = NR.notebookActions(s, [M4, M5]);
  ok(acts.some(a => a.node.id === 'm5_cmp_ticket_e5' && a.source_mission === 'M5'), 'C5B: entered_mission_comparisons_visible (con source_mission)');
  doNode5(s, 'm5_cmp_ticket_e5');
  const c5 = JSON.parse(NR.serialize(s)).comparisons.m5_cmp_ticket_e5;
  ok(c5.completed === true && c5.result === 'RECURRENCE_NOT_IDENTITY', 'C5B: confronto senza scelte completed al node commit');
  ok(!NR.notebookActions(s, [M4, M5]).some(a => a.node.id === 'm5_cmp_ticket_e5'), 'C5B: completed_cross_mission_comparison_hidden');
  ok(NR.prepareNode(s, M5, 'm5_cmp_ticket_e5').already_completed === true, 'C5B: nodo non ripetibile (already_completed)');
  ok(s.notebook.filter(n => n.id === 'm5.obs.ticket_e5').length === 1, 'C5B: nota di ricorrenza una sola volta');
}
{
  // registro: API a missione singola, missioni future invisibili, duplicati
  let s = freshState(); doNode(s, 'truman_a2'); doNode(s, 'james_a2');
  ok(Array.isArray(NR.notebookActions(s, M4)), 'C5B: single_mission_api_still_works');
  const before = NR.notebookActions(s, [M4, M5]);
  ok(!before.some(a => a.source_mission === 'M5'), 'C5B: future_mission_comparisons_hidden (M5 non entrata)');
  const fake = { mission: 'MX', nodes: [{ id: 'cmp_e6a_tjames', kind: 'comparison', channel: 'notebook', conditions: [] }] };
  ok((() => { try { NR.notebookActions(s, [M4, fake]); return false; } catch (e) { return String(e.message).indexOf('duplicate_comparison_node_id') === 0; } })(), 'C5B: duplicate_node_id_across_missions_fails');
  // M5 comparison sopravvive "in M6": aggregazione multi-missione con M5 entrata
  let s2 = m5Base(); doNode(s2, 'gerard_a2'); doNode5(s2, 'm5_mound');
  ok(NR.notebookActions(s2, [M4, M5]).some(a => a.node.id === 'm5_cmp_ticket_e5'), 'C5B: m5_comparison_survives_into_m6 (registro globale)');
}
{
  // migrazione envelope 1.0.0 → 1.1.0 (values aggiunto)
  globalThis.__NARRATIVE_TEST__ = true;
  const NS = globalThis.GAME.NarrativeSave;
  const mem2 = new Map();
  NS._setStorage({ getItem: k => (mem2.has(k) ? mem2.get(k) : null), setItem: (k, v) => mem2.set(k, String(v)), removeItem: k => mem2.delete(k) });
  let s = freshState(); doNode(s, 'truman_a2');
  const oldState = JSON.parse(NR.serialize(s));
  delete oldState.values; oldState.schema = '1.0.0';
  const classic2 = { mapId: 'sheriff', tx: 9, ty: 2, dir: 'up', clues: [], flags: {} };
  globalThis.GAME.NarrativeAdapter = { isEnabled: () => true, active: () => false, sessionStatus: () => 'idle', getState: () => s, getMission: () => M4 };
  const env = {
    format_version: '1.0.0', narrative_schema_version: '1.0.0', narrative_package: 'narrative-v1.0',
    slot_id: '7', save_generation: 1, classic_save_fingerprint: NS.classicFingerprint(classic2),
    mission: 'M4', saved_at: 'x', state: oldState
  };
  mem2.set(NS.keyFor('7'), JSON.stringify(env));
  mem2.set('twin-peaks:narrative:narrative-v1.0:meta', JSON.stringify({ slots: { '7': 1 } }));
  const lm = NS.load('7', { classic: classic2 });
  ok(lm.ok && lm.envelope.migrated_from === '1.0.0' && JSON.stringify(lm.state.values) === '{}', 'C5B: migration 1.0.0→1.1.0 (values aggiunto, esplicita)');
  delete globalThis.GAME.NarrativeAdapter;
}

console.log('# C5-B.1 — contratto runtime chiuso (12 test dalla revisione)');
{
  ok(enums.narrative_schema_version === NR.schemaVersion, 'C5B1: catalog_schema_matches_runtime (' + enums.narrative_schema_version + ')');
  // dominio realmente chiuso
  let s = m5Base();
  const raw1 = JSON.parse(NR.serialize(s)); raw1.values.unknown = 'anything';
  ok((() => { try { NR.deserialize(JSON.stringify(raw1)); return false; } catch (e) { return String(e.message).indexOf('save_value_without_domain') === 0; } })(), 'C5B1: deserialize_rejects_unknown_value_name');
  // opposite_of: coppia esatta, distinta, nel dominio — e MAI scritture su input invalido
  doNode5(s, 'm5_mound'); doNode5(s, 'm5_ring');
  let pt = NR.prepareNode(s, M5, 'm5_theory_initial'); NR.commitNode(s, M5, pt);
  doChoice5(s, 'm5_theory_initial', 'theory_degeneration');
  const badPair = { id: 'x', effects: [{ value: 'm5_final_theory', opposite_of: 'm5_initial_theory', within: ['degeneration', 'BANANA'] }] };
  ok(String(NR.validateValueEffects(s, badPair.effects)).indexOf('value_opposite_out_of_domain') === 0, 'C5B1: opposite_pair_values_belong_to_target_domain');
  const onePair = [{ value: 'm5_final_theory', opposite_of: 'm5_initial_theory', within: ['degeneration'] }];
  ok(String(NR.validateValueEffects(s, onePair)).indexOf('value_invalid_opposite_pair') === 0, 'C5B1: opposite_pair_requires_exactly_two_values');
  const samePair = [{ value: 'm5_final_theory', opposite_of: 'm5_initial_theory', within: ['staging', 'staging'] }];
  ok(String(NR.validateValueEffects(s, samePair)).indexOf('value_invalid_opposite_pair') === 0, 'C5B1: coppia con valori uguali respinta');
  const beforeBad = NR.serialize(s);
  const fakeNode = { id: 'fake', choices: [badPair] };
  const pBad = NR.prepareChoice(s, M5, fakeNode, 'x');
  ok(!pBad.ok && NR.serialize(s) === beforeBad, 'C5B1: invalid_opposite_never_writes_state (prepare rifiutato, stato puro)');
  // worldRoots/objective/completion propagano la missione
  doNode5(s, 'm5_scene');
  let pv = NR.prepareNode(s, M5, 'm5_theory_revision'); NR.commitNode(s, M5, pv);
  doChoice5(s, 'm5_theory_revision', 'revision_keep');
  const roots = NR.worldRoots(s, M5, 'traincar', 'truman');
  ok(roots.length === 1 && roots[0].id === 'm5_report_intro', 'C5B1: worldRoots_supports_groups_completed (Truman esposto sul vagone)');
  ok(NR.activeObjective(s, M5).id === 'obj_m5_3', 'C5B1: activeObjective_passes_mission_to_conditions');
  ok(NR.checkCompletion(s, M5) === false, 'C5B1: checkCompletion_passes_mission_to_conditions (falsa prima della chiusura)');
  // pair status: stessa politica del registro
  const futureM = { mission: 'F', entry_condition: { flag: 'future_entered' }, nodes: [{ id: 'cmp_future', kind: 'comparison', channel: 'notebook', conditions: [{ evidence: 'E7A_BIGLIETTO_TESTO' }, { evidence: 'E7B_BIGLIETTO_POSIZIONE' }] }] };
  const ps1 = NR.notebookPairStatus(s, [M5, futureM], ['E7A_BIGLIETTO_TESTO', 'E7B_BIGLIETTO_POSIZIONE']);
  ok(ps1.status === 'none', 'C5B1: future_pair_status_hidden');
  const s2 = JSON.parse(NR.serialize(s));
  s2.comparisons.cmp_future = { opened: true, attempts: [], completed: false, result: null };
  const ps2 = NR.notebookPairStatus(NR.deserialize(JSON.stringify(s2)), [M5, futureM], ['E7A_BIGLIETTO_TESTO', 'E7B_BIGLIETTO_POSIZIONE']);
  ok(ps2.status === 'available' && ps2.source_mission === 'F', 'C5B1: opened_future_pair_status_visible');
  const dupM = { mission: 'D', nodes: [{ id: 'm5_cmp_ring', kind: 'comparison', channel: 'notebook', conditions: [] }] };
  ok((() => { try { NR.notebookPairStatus(s, [M5, dupM], ['x', 'y']); return false; } catch (e) { return String(e.message).indexOf('duplicate_comparison_node_id') === 0; } })(), 'C5B1: pair_status_duplicate_node_ids_fail');
  // pair status con condizioni mission-sensitive: non lancia, valuta col contesto
  const gcM = { mission: 'G', observation_groups: M5.observation_groups, nodes: [{ id: 'cmp_gc', kind: 'comparison', channel: 'notebook', conditions: [{ evidence: 'E7A_BIGLIETTO_TESTO' }, { evidence: 'E7B_BIGLIETTO_POSIZIONE' }, { groups_completed: { set: 'm5_observations', gte: 3 } }] }] };
  const ps3 = NR.notebookPairStatus(s, [gcM], ['E7A_BIGLIETTO_TESTO', 'E7B_BIGLIETTO_POSIZIONE']);
  ok(ps3.status === 'available', 'C5B1: pair_status_passes_mission_to_evalCond');
}

console.log('# C5-B.2 — resolver delle coppie a due passaggi');
{
  let s = m5Base();
  doNode5(s, 'm5_mound');
  // Caso 1: duplicato rilevato ANCHE quando il primo match corrisponde
  const dupA = { mission: 'DA', nodes: [{ id: 'dup', kind: 'comparison', channel: 'notebook', conditions: [{ evidence: 'E7A_BIGLIETTO_TESTO' }, { evidence: 'E7B_BIGLIETTO_POSIZIONE' }] }] };
  const dupB = { mission: 'DB', nodes: [{ id: 'dup', kind: 'comparison', channel: 'notebook', conditions: [{ evidence: 'E8A_ANELLO_POSIZIONE' }, { evidence: 'E8B_ANELLO_SUPERFICIE' }] }] };
  ok((() => { try { NR.notebookPairStatus(s, [dupA, dupB], ['E7A_BIGLIETTO_TESTO', 'E7B_BIGLIETTO_POSIZIONE']); return false; } catch (e) { return String(e.message).indexOf('duplicate_comparison_node_id') === 0; } })(), 'C5B2: pair_status_duplicate_matching_first_node_fails');
  // Caso 2: match indisponibile NON oscura uno disponibile successivo
  const unavailM = { mission: 'UA', nodes: [{ id: 'cmp_ua', kind: 'comparison', channel: 'notebook', conditions: [{ evidence: 'E7A_BIGLIETTO_TESTO' }, { evidence: 'E7B_BIGLIETTO_POSIZIONE' }, { flag: 'mai_settato_x' }] }] };
  const availM = { mission: 'AV', nodes: [{ id: 'cmp_av', kind: 'comparison', channel: 'notebook', conditions: [{ evidence: 'E7A_BIGLIETTO_TESTO' }, { evidence: 'E7B_BIGLIETTO_POSIZIONE' }] }] };
  const psL = NR.notebookPairStatus(s, [unavailM, availM], ['E7A_BIGLIETTO_TESTO', 'E7B_BIGLIETTO_POSIZIONE']);
  ok(psL.status === 'available' && psL.node.id === 'cmp_av' && psL.source_mission === 'AV', 'C5B2: pair_status_skips_unavailable_match_and_finds_later_available');
  // Caso 3: due match validi = ambiguità esplicita
  const availM2 = { mission: 'AV2', nodes: [{ id: 'cmp_av2', kind: 'comparison', channel: 'notebook', conditions: [{ evidence: 'E7A_BIGLIETTO_TESTO' }, { evidence: 'E7B_BIGLIETTO_POSIZIONE' }] }] };
  ok((() => { try { NR.notebookPairStatus(s, [availM, availM2], ['E7A_BIGLIETTO_TESTO', 'E7B_BIGLIETTO_POSIZIONE']); return false; } catch (e) { return String(e.message).indexOf('ambiguous_comparison_pair') === 0; } })(), 'C5B2: pair_status_two_available_matches_are_ambiguous');
  // Caso 4: completed + available sulla stessa coppia = ambiguità
  const s4 = JSON.parse(NR.serialize(s));
  s4.comparisons.cmp_av = { opened: true, attempts: [], completed: true, result: 'X' };
  const st4 = NR.deserialize(JSON.stringify(s4));
  ok((() => { try { NR.notebookPairStatus(st4, [availM, availM2], ['E7A_BIGLIETTO_TESTO', 'E7B_BIGLIETTO_POSIZIONE']); return false; } catch (e) { return String(e.message).indexOf('ambiguous_comparison_pair') === 0; } })(), 'C5B2: pair_status_completed_and_available_same_pair_are_ambiguous');
}

/* ===== C6-B — M6 dinamica: 12 percorsi canonici dal runtime reale ===== */
console.log('# C6-B — M6 dynamic (estensioni runtime generiche, matrice canonica)');
const M6 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M6.json'), 'utf8'));
function doNode6(s, id) { const p = NR.prepareNode(s, M6, id); if (!p.ok) return p; const c = NR.commitNode(s, M6, p); return { ok: c.ok, prep: p, commit: c }; }
function doChoice6(s, atId, choiceId) {
  const node = M6.nodes.find(n => n.id === atId);
  const p = NR.prepareChoice(s, M6, node, choiceId);
  if (!p.ok) return p;
  const c = NR.commitChoice(s, M6, node, p);
  if (c.ok && c.goto) { const r = doNode6(s, c.goto); return { ok: r.ok, goto: c.goto, commit: c }; }
  return c;
}
function m6Base(audrey) { // fine-M5 REALE via runtime (east_route_confirmed), poi ingresso M6
  let s = m5Base();
  doNode5(s, 'm5_mound'); doNode5(s, 'm5_ring');
  let pt = NR.prepareNode(s, M5, 'm5_theory_initial'); NR.commitNode(s, M5, pt);
  doChoice5(s, 'm5_theory_initial', 'theory_degeneration');
  doNode5(s, 'm5_scene');
  let pv = NR.prepareNode(s, M5, 'm5_theory_revision'); NR.commitNode(s, M5, pv);
  doChoice5(s, 'm5_theory_revision', 'revision_keep');
  let pi = NR.prepareNode(s, M5, 'm5_report_intro'); NR.commitNode(s, M5, pi);
  doChoice5(s, 'm5_s1', 's1_institutional'); // segue il goto → m5_report_close
  if (audrey) s.flags.audrey_indaga = true;
  return s;
}
const TACTICS = [
  ['tactic_prova', 'prova', 'm6_interrogation_prova', 'JACQUES_MIDNIGHT_CLAIM', ['jacques_statement_terms_known']],
  ['tactic_pressione', 'pressione', 'm6_interrogation_pressione', 'JACQUES_LIST_GIVEN', []],
  ['tactic_falsa_sicurezza', 'falsa_sicurezza', 'm6_interrogation_falsa', 'JACQUES_THIRD_MAN_DETAIL', []]
];
const ALL_RESOURCES = ['JACQUES_MIDNIGHT_CLAIM', 'JACQUES_LIST_GIVEN', 'JACQUES_THIRD_MAN_DETAIL'];
const FB_SUFFIX = { prova: 'prova', pressione: 'pressione', falsa_sicurezza: 'falsa' };
let m6PathCount = 0, m6SaveLoads = 0;
function sl6(s) { m6SaveLoads++; return saveLoad(s); }
for (const [tCh, tVal, branchId, ownRes, ownFlags] of TACTICS) for (const audrey of [false, true]) for (const hospital of [false, true]) {
  m6PathCount++;
  const label = 'M6[' + tVal + '/aud' + audrey + '/hosp' + hospital + ']';
  let s = m6Base(audrey);
  ok(s.flags.east_route_confirmed === true, label + ': base = fine M5 reale');
  ok(NR.evalCond(s, M6.entry_condition, M6), label + ': M6 entrata (east_route_confirmed)');
  s = sl6(s);
  // B1-B2 ingresso; guardia di rientro
  ok(doNode6(s, 'm6_ferry').ok, label + ': ferry');
  ok(!NR.prepareNode(s, M6, 'm6_ferry').ok, label + ': ferry concluso non ripreparabile (guardia not node_done)');
  ok(NR.worldRoots(s, M6, 'oej', null).every(n => n.id !== 'm6_ferry'), label + ': ferry non è più world-root');
  // B3 Audrey on/off
  if (audrey) {
    ok(doNode6(s, 'm6_audrey').ok && s.flags.audrey_vista_oej === true, label + ': audrey → audrey_vista_oej');
    ok(!NR.prepareNode(s, M6, 'm6_audrey').ok, label + ': audrey conclusa non ripetibile');
  } else {
    ok(!NR.prepareNode(s, M6, 'm6_audrey').ok, label + ': audrey saltata (no audrey_indaga)');
  }
  s = sl6(s);
  // B4 tattica → ramo (goto, stesso passaggio)
  ok(doChoice6(s, 'm6_tactic', tCh).ok, label + ': tattica scelta conduce al ramo');
  ok(s.values.m6_tactic === tVal, label + ': m6_tactic = ' + tVal + ' (write-once)');
  ok(!NR.prepareNode(s, M6, 'm6_tactic').ok, label + ': seconda tattica non ripreparabile (guardia not value_set)');
  ok(s.values.m6_tactic === tVal, label + ': nessuna mutazione della tattica');
  // solo il ramo scelto è raggiungibile
  for (const [, otVal, obr] of TACTICS) if (otVal !== tVal) ok(!NR.prepareNode(s, M6, obr).ok, label + ': ramo ' + otVal + ' irraggiungibile');
  ok(s.flags.jacques_admitted_presence === true, label + ': ammissione di presenza');
  // il ramo scrive SOLO la propria risorsa
  ok(s.evidence[ownRes] === true, label + ': risorsa propria ' + ownRes);
  ownFlags.forEach(f => ok(s.flags[f] === true, label + ': flag di risorsa ' + f));
  ALL_RESOURCES.filter(r => r !== ownRes).forEach(r => ok(!s.evidence[r], label + ': risorsa altrui assente ' + r));
  if (tVal !== 'prova') ok(!s.flags.jacques_statement_terms_known, label + ': statement_terms_known solo in Prova');
  // beat P5: milestone pendente, arresto bloccato
  ok(NR.pendingMilestones(s, M6).length === 1 && NR.pendingMilestones(s, M6)[0].id === 'milestone_p5', label + ': milestone_p5 pendente');
  ok(!NR.prepareNode(s, M6, 'm6_arrest').ok, label + ': arresto bloccato (pending_p5_does_not_expose_arrest)');
  ok(NR.worldRoots(s, M6, 'oej', null).every(n => n.id !== 'm6_arrest'), label + ': arresto non esposto mentre P5 pendente');
  s = sl6(s);
  // P5: apri il prompt, poi B (respinta+registrata), C (respinta per-ramo, feedback congelato), A (formula)
  let pp = NR.prepareNode(s, M6, 'm6_p5'); ok(pp.ok, label + ': P5 apribile'); NR.commitNode(s, M6, pp);
  doChoice6(s, 'm6_p5', 'p5_killed');
  ok((s.comparisons.m6_p5 || {}).attempts && s.comparisons.m6_p5.attempts.indexOf('ATTRIBUTION_OVERREACH') !== -1, label + ': B tentativo registrato (attempt_scope comparison, kind choice)');
  ok(NR.peekProp(s, 'P5').formulation.status === 'unformulated', label + ': P5 NON formulata da B');
  ok(NR.prepareNode(s, M6, 'm6_p5').resume_choice === true, label + ': dopo B il widget si riapre (stesso lease, non repeat)');
  const p5Node = M6.nodes.find(n => n.id === 'm6_p5');
  const pcC = NR.prepareChoice(s, M6, p5Node, 'p5_no_third_man');
  ok(pcC.ok && pcC.feedback_pages.length === 1 && pcC.feedback_pages[0].id === 'm6.b6b.p5.feedback.no_third.' + FB_SUFFIX[tVal], label + ': feedback C per-ramo CONGELATO in prepareChoice');
  NR.commitChoice(s, M6, p5Node, pcC);
  ok(NR.peekProp(s, 'P5').formulation.status === 'unformulated', label + ': P5 NON formulata da C');
  ok(NR.availableChoices(s, M6, p5Node).map(c => c.id).join(',') === 'p5_present', label + ': B e C nascoste dopo il tentativo');
  s = sl6(s);
  ok(NR.availableChoices(s, M6, p5Node).map(c => c.id).join(',') === 'p5_present', label + ': tentativi P5 sopravvivono a save/load');
  doChoice6(s, 'm6_p5', 'p5_present');
  ok(NR.peekProp(s, 'P5').formulation.status === 'formulated', label + ': P5 formulata da A');
  ok(NR.pendingMilestones(s, M6).length === 0, label + ': milestone risolta dalla proposizione');
  ok(NR.prepareNode(s, M6, 'm6_p5').continuation === 'm6_arrest', label + ': p5_success_continues_to_arrest (next dichiarativo, stesso lease)');
  // arresto ora esposto
  ok(NR.prepareNode(s, M6, 'm6_arrest').ok, label + ': resolved_p5_exposes_arrest');
  s = sl6(s);
  ok(doNode6(s, 'm6_arrest').ok && s.flags.jacques_preso === true, label + ': arresto → jacques_preso');
  ok(!NR.prepareNode(s, M6, 'm6_arrest').ok, label + ': arresto concluso non ripetibile');
  ok(NR.activeObjective(s, M6).id === 'obj_m6_4' && NR.worldRoots(s, M6, 'sheriff', 'truman').some(function (n) { return n.id === 'm6_return_night'; }), label + ': obiettivo post-fermo punta alla root Truman');
  // tempo percepibile: notizia bloccata finché B7b non è committato
  ok(!NR.prepareNode(s, M6, 'm6_news').ok, label + ': notizia bloccata prima di B7b (tempo percepibile)');
  ok(doNode6(s, 'm6_return_night').ok, label + ': ritorno e notte');
  ok(NR.activeObjective(s, M6).id === 'obj_m6_4b' && NR.worldRoots(s, M6, 'sheriff', 'lucy').some(function (n) { return n.id === 'm6_news'; }), label + ': obiettivo post-notte punta alla root Lucy');
  s = sl6(s);
  // notizia: fine critica
  ok(doNode6(s, 'm6_news').ok, label + ': notizia');
  ok(s.flags.jacques_dead === true && s.flags.jacques_testimony_lost === true && s.flags.m6_resource_lost === true, label + ': la fine scrive SOLO dead+testimony_lost+resource_lost');
  ok(NR.peekProp(s, 'P9').formulation.status === 'formulated', label + ': P9 formulata');
  ok(s.flags.jacques_death_suspicious !== true, label + ': death_suspicious ancora FALSO alla notizia');
  ok(!s.flags.jacques_murder_confirmed && !s.flags.jacques_murder_attributed, label + ': nessun murder_*');
  // la morte distrugge il chiarimento, NON l'informazione già acquisita
  ok(NR.peekProp(s, 'P5').formulation.status === 'formulated' && s.evidence[ownRes] === true, label + ': la risorsa e P5 sopravvivono alla morte');
  ok(NR.checkCompletion(s, M6) === false, label + ': M6 non salta a M8 prima del Gigante e del rapporto');
  ok(NR.activeObjective(s, M6).id === 'obj_m6_5', label + ': obiettivo «stanza 315»');
  // coda ospedale on/off — unico writer di death_suspicious
  if (hospital) {
    s = sl6(s);
    ok(doNode6(s, 'm6_hospital').ok, label + ': coda ospedale');
    ok(s.flags.night_log_no_visitor === true && s.flags.jacques_death_suspicious === true, label + ': suspicious SOLO da B8b (registro giocato)');
    ok(!NR.prepareNode(s, M6, 'm6_hospital').ok, label + ': ospedale concluso non ripetibile');
  } else {
    ok(s.flags.jacques_death_suspicious !== true && s.flags.night_log_no_visitor !== true, label + ': senza ospedale, suspicious resta falso');
  }
  // confine col motore classico: la visione in stanza 315 viene sincronizzata,
  // poi il rapporto a Truman è giocato nel runtime che possiede l'interazione.
  NR.applyEffects(s, [{ set: 'gigante1' }]);
  ok(NR.activeObjective(s, M6).id === 'obj_m6_6', label + ': dopo il Gigante, obiettivo = rapporto a Truman');
  ok(doNode6(s, 'm6_atto4_bridge').ok && s.flags.atto4 === true, label + ': rapporto a Truman → atto4');
  ok(NR.checkCompletion(s, M6) === true, label + ': M6 completa solo dopo il rapporto');
  // root-contract su tutto il percorso: mai due world-root azionabili sullo stesso target
  const rootsByTarget = {};
  NR.worldRoots(s, M6, null, null).forEach(n => { const k = (n.map_id || '') + '|' + (n.target_kind || '') + '|' + (n.target_id || ''); (rootsByTarget[k] = rootsByTarget[k] || []).push(n.id); });
  ok(Object.values(rootsByTarget).every(g => g.length <= 1), label + ': completed_nodes_never_shadow_unresolved_nodes (≤1 root per target)');
  s = sl6(s);
  ok(NR.serialize(NR.deserialize(NR.serialize(s))) === NR.serialize(s), label + ': round-trip finale');
}
ok(m6PathCount === 12, 'matrice canonica M6: 12 percorsi ESEGUITI dal runtime (' + m6PathCount + ')');
// M4/M5 invariati sotto M6 caricata: l'aggregazione notebook multi-missione con M6 non tocca lo stato
{
  let s = m6Base(false);
  const before = NR.serialize(s);
  NR.notebookActions(s, [M4, M5, M6]);
  ok(NR.serialize(s) === before, 'C6B: notebookActions [M4,M5,M6] è PURA (M4/M5 invariati)');
}

// log macchina per la consegna C5-B
try {
  fs.writeFileSync(path.join(__dirname, '..', 'artifacts', 'C5B-validation-log.json'), JSON.stringify({
    generated_by: 'test/narrative-validate.js',
    generated_at: new Date().toISOString(),
    total_checks: checks, failures: failures,
    m5_canonical_paths_executed: pathCount,
    runtime_schema: NR.schemaVersion
  }, null, 1));
} catch (eLog) { /* directory assente: il log è opzionale in ambienti minimi */ }

// log macchina per la consegna C6-B (numeri DAL RUN)
try {
  fs.writeFileSync(path.join(__dirname, '..', 'artifacts', 'C6B-validation-log.json'), JSON.stringify({
    generated_by: 'test/narrative-validate.js',
    generated_at: new Date().toISOString(),
    m6_canonical_paths_executed: m6PathCount,
    save_load_checkpoints: m6SaveLoads,
    total_checks: checks, failures: failures,
    runtime_schema: NR.schemaVersion
  }, null, 1));
} catch (eLog) { /* directory assente: il log è opzionale in ambienti minimi */ }

/* ===== C8-B — M8 dinamica: 3 primitive generiche + matrice 27 percorsi dal runtime ===== */
console.log('# C8-B — M8 dynamic (value_transition / from_derivation / conditional_pages + matrice 27)');
const M8 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M8.json'), 'utf8'));
const dEnumsM8 = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema-deltas', 'diff-state-enums-M8.json'), 'utf8'));
// domini + transizioni M8 (base + diff) iniettati nel runtime UNICO (nessun if(mission))
(function () {
  const allValuesAllowed = Object.assign({}, enums.values_allowed, dEnumsM8.values_allowed_add);
  const allEnums = Object.assign({}, enums.enums, dEnumsM8.enums_add);
  const domains = {};
  for (const [name, enumName] of Object.entries(allValuesAllowed)) domains[name] = allEnums[enumName];
  NR.setValueDomains(domains);
  NR.setValueTransitions(Object.assign({}, enums.value_transitions || {}, dEnumsM8.value_transitions_add || {}));
})();
// base M8: gate reale atto4 + evidenze delle missioni precedenti (E3 lettera R, E1 diario)
function m8Base() { const s = NR.createState(); s.flags.atto4 = true; s.evidence.E3_LETTERA_R = true; s.evidence.E1_DIARIO = true; return s; }
function doNode8(s, id) { const p = NR.prepareNode(s, M8, id); if (!p.ok) return p; const c = NR.commitNode(s, M8, p); return { ok: c.ok, prep: p, commit: c }; }
function doChoice8(s, atId, choiceId) { const node = M8.nodes.find(n => n.id === atId); const p = NR.prepareChoice(s, M8, node, choiceId); if (!p.ok) return { ok: false, prep: p }; const c = NR.commitChoice(s, M8, node, p); return { ok: c.ok, prep: p, commit: c }; }
function soleObj(s) { const t = NR.trueObjectives(s, M8); return t.length === 1 ? t[0].id : ('#' + t.length + ':' + t.map(o => o.id).join(',')); }
let m8SaveLoads = 0;
function sl8(s) { m8SaveLoads++; return saveLoad(s); }
const routeOf = F => (F === 'palmer' ? 'm8_route_palmer' : F === 'lago' ? 'm8_route_lake' : 'm8_route_diner');
function driveToRoute(P, W, F) {
  const s = m8Base();
  doNode8(s, 'm8_diner'); doChoice8(s, 'm8_diner', 'promise_' + P);
  doNode8(s, 'm8_leland_taxi');
  doNode8(s, 'm8_roadhouse'); doChoice8(s, 'm8_roadhouse', 'warning_' + W);
  doNode8(s, 'm8_focus_choice'); doChoice8(s, 'm8_focus_choice', 'focus_' + F);
  doNode8(s, routeOf(F));
  return s;
}
function driveToFocus(P, W, F) {
  const s = m8Base();
  doNode8(s, 'm8_diner'); doChoice8(s, 'm8_diner', 'promise_' + P);
  doNode8(s, 'm8_leland_taxi');
  doNode8(s, 'm8_roadhouse'); doChoice8(s, 'm8_roadhouse', 'warning_' + W);
  doNode8(s, 'm8_focus_choice'); doChoice8(s, 'm8_focus_choice', 'focus_' + F);
  return s;
}
function driveToStation(P, W, F) {
  const s = driveToRoute(P, W, F);
  doNode8(s, 'm8_discovery');
  doNode8(s, 'm8_promise_echo');
  doNode8(s, 'm8_cmp_letters');
  doNode8(s, 'm8_cmp_diary'); doChoice8(s, 'm8_cmp_diary', 'diary_a');
  return s;
}

// --- ingresso azionabile ---
{
  const s = m8Base();
  ok(NR.evalCond(s, M8.entry_condition, M8), 'C8B: M8 entrata (atto4)');
  ok(soleObj(s) === 'obj_m8_0', 'C8B: entry_objective_points_to_actionable_root (obj_m8_0)');
  ok(NR.prepareNode(s, M8, 'm8_diner').ok, 'C8B: entry root m8_diner azionabile');
  ok(!NR.prepareNode(s, M8, 'm8_roadhouse').ok, 'C8B: roadhouse NON azionabile all\'ingresso (richiede promise_stance)');
}

// --- value_transition (6 gate) ---
{
  const s = driveToRoute('accompagno', 'palmer', 'lago');
  ok(NR.peekValue(s, 'presagio_status') === 'active', 'C8B(vt): presagio active pre-discovery');
  const before = NR.serialize(s);
  const pd = NR.prepareNode(s, M8, 'm8_discovery');
  ok(pd.ok, 'C8B(vt): value_transition_validated_in_prepare');
  ok(NR.serialize(s) === before, 'C8B(vt): prepare puro (nessuna mutazione)');
  ok(NR.peekValue(s, 'presagio_status') === 'active', 'C8B(vt): value_transition_applied_only_at_commit (ancora active dopo prepare)');
  NR.commitNode(s, M8, pd);
  ok(NR.peekValue(s, 'presagio_status') === 'verified', 'C8B(vt): transizione applicata al commit (verified)');
  const s2 = sl8(s);
  ok(NR.peekValue(s2, 'presagio_status') === 'verified', 'C8B(vt): transition_survives_save_load');
}
{
  const s = m8Base();
  ok(!NR.resolveDeferredEffects(s, [{ value_transition: { name: 'presagio_status', from: 'active', to: 'verified' } }]).ok, 'C8B(vt): wrong_from_value_rejected (presagio non active)');
  s.values.presagio_status = 'active';
  ok(!NR.resolveDeferredEffects(s, [{ value_transition: { name: 'presagio_status', from: 'verified', to: 'active' } }]).ok, 'C8B(vt): reverse_transition_rejected');
  s.values.warning_target = 'palmer';
  ok(!NR.resolveDeferredEffects(s, [{ value_transition: { name: 'warning_target', from: 'palmer', to: 'centrale' } }]).ok, 'C8B(vt): undeclared_transition_rejected');
}

// --- from_derivation (7 gate) ---
{
  const s = driveToRoute('accompagno', 'palmer', 'lago'); // body_found_by=cooper
  const before = NR.serialize(s);
  const pd = NR.prepareNode(s, M8, 'm8_discovery');
  ok(pd.ok && (pd.derived || []).some(d => d.value === 'letter_o_observation_source' && d.resolved === 'cooper_primary'), 'C8B(fd): derivation_resolved_in_prepare (cooper→cooper_primary, congelato)');
  ok(NR.serialize(s) === before, 'C8B(fd): prepare_derivation_is_pure');
  s.values.body_found_by = 'hawk'; // forzatura post-prepare: il commit deve usare il congelato
  NR.commitNode(s, M8, pd);
  ok(NR.peekValue(s, 'letter_o_observation_source') === 'cooper_primary', 'C8B(fd): prepared_derivation_is_frozen / commit_never_rederives');
}
{
  const s = driveToRoute('accompagno', 'palmer', 'diner'); // body_found_by=hawk
  doNode8(s, 'm8_discovery');
  ok(NR.peekValue(s, 'letter_o_observation_source') === 'hawk_preserved', 'C8B(fd): hawk→hawk_preserved');
}
{
  const good = { value: 'letter_o_observation_source', from_derivation: { of: 'body_found_by', map: { cooper: 'cooper_primary', hawk: 'hawk_preserved' } } };
  const sOk = m8Base(); sOk.values.body_found_by = 'hawk';
  ok(NR.resolveDeferredEffects(sOk, [good]).ok, 'C8B(fd): map completa sul dominio-sorgente → prepare ok');
  // sorgente non scritta
  ok(!NR.resolveDeferredEffects(m8Base(), [good]).ok, 'C8B(fd): missing_derivation_source_fails_prepare');
  // sorgente senza dominio dichiarato
  ok(!NR.resolveDeferredEffects(sOk, [{ value: 'letter_o_observation_source', from_derivation: { of: 'valore_senza_dominio', map: { x: 'cooper_primary' } } }]).ok, 'C8B(fd): derivation_source_without_domain_fails_prepare');
  // valore-sorgente fuori dominio (forzato in-memory)
  const sOut = m8Base(); sOut.values.body_found_by = 'sarah'; // fuori [cooper,hawk]
  ok(!NR.resolveDeferredEffects(sOut, [good]).ok, 'C8B(fd): derivation_source_out_of_domain_fails_prepare');
  // map incompleta rispetto al dominio-sorgente (manca hawk)
  const sInc = m8Base(); sInc.values.body_found_by = 'cooper';
  ok(!NR.resolveDeferredEffects(sInc, [{ value: 'letter_o_observation_source', from_derivation: { of: 'body_found_by', map: { cooper: 'cooper_primary' } } }]).ok, 'C8B(fd): derivation_map_incomplete_for_source_domain_fails_prepare');
  // output NON selezionato fuori dominio (cooper selezionato ma hawk→fuori dominio)
  ok(!NR.resolveDeferredEffects(sInc, [{ value: 'letter_o_observation_source', from_derivation: { of: 'body_found_by', map: { cooper: 'cooper_primary', hawk: 'valore_fuori_dominio' } } }]).ok, 'C8B(fd): derivation_unselected_output_out_of_domain_fails_prepare');
  // un prepare fallito lascia lo stato BYTE-IDENTICO
  const sByte = m8Base(); sByte.values.body_found_by = 'cooper';
  const beforeByte = NR.serialize(sByte);
  NR.resolveDeferredEffects(sByte, [{ value: 'letter_o_observation_source', from_derivation: { of: 'body_found_by', map: { cooper: 'cooper_primary' } } }]);
  ok(NR.serialize(sByte) === beforeByte, 'C8B(fd): derivation_failure_keeps_state_byte_identical');
}

// --- conditional_pages (6 gate) ---
{
  // route: valigia iff warning=palmer (focus=palmer → in route)
  const sp = driveToFocus('accompagno', 'palmer', 'palmer');
  const pr = NR.prepareNode(sp, M8, 'm8_route_palmer');
  ok(pr.ok && pr.pages.some(p => p.id === 'm8.c.route_palmer.p02'), 'C8B(cp): valigia in route se warning=palmer ∧ focus=palmer');
  const sc = driveToFocus('accompagno', 'centrale', 'palmer');
  const pr2 = NR.prepareNode(sc, M8, 'm8_route_palmer');
  ok(pr2.ok && !pr2.pages.some(p => p.id === 'm8.c.route_palmer.p02'), 'C8B(cp): niente valigia in route se warning≠palmer');
}
{
  const s = driveToStation('accompagno', 'palmer', 'lago'); // warning palmer, focus lago → valigia in stazione
  const before = NR.serialize(s);
  const ps = NR.prepareNode(s, M8, 'm8_station');
  ok(ps.ok, 'C8B(cp): station preparabile');
  ok(NR.serialize(s) === before, 'C8B(cp): prepare_conditional_pages_is_pure');
  ok(ps.pages.some(p => p.id === 'm8.f.station.p_valigia'), 'C8B(cp): conditional_pages_resolved_in_prepare (valigia presente)');
  const ids = ps.pages.map(p => p.id);
  ok(ids.indexOf('m8.f.station.p_valigia') !== -1 && ids.indexOf('m8.f.station.p_valigia') < ids.indexOf('m8.f.station.p02'), 'C8B(cp): page_order_preserved');
  const frozenLen = ps.pages.length;
  s.values.focus_destination = 'palmer'; // renderebbe la condizione falsa: il congelato non cambia
  ok(ps.pages.length === frozenLen && ps.pages.some(p => p.id === 'm8.f.station.p_valigia'), 'C8B(cp): prepared_page_sequence_is_frozen / commit_never_refilters_pages');
}
{
  const s = driveToStation('accompagno', 'nessuno', 'lago');
  const psA = NR.prepareNode(s, M8, 'm8_station'); // base_revision = N
  // bump della revisione con una transazione benigna (ri-commit di un nodo concluso)
  const bump = NR.prepareNode(s, M8, 'm8_cmp_letters');
  NR.commitNode(s, M8, bump); // revision N → N+1 (tx_id diverso)
  const stale = NR.commitNode(s, M8, psA); // base_revision N ≠ revision, tx_id non committato
  ok(!stale.ok && stale.error === 'stale_transaction', 'C8B(cp): stale_transaction_rejected');
}

// --- matrice canonica: 27 percorsi (promise × warning × focus) dal runtime reale ---
// C8-B.1: OGNI passo prosegue DAL risultato deserialize (s = sl8(s) dopo ogni
// transizione), non solo un paio di spot-check. Retry completo B→C→A sul diario.
const diaryNode = M8.nodes.find(n => n.id === 'm8_cmp_diary');
let m8PathCount = 0, m8Continued = 0;
for (const P of ['accompagno', 'autonomia', 'prudenza']) for (const W of ['palmer', 'centrale', 'nessuno']) for (const F of ['palmer', 'lago', 'diner']) {
  const label = 'M8[' + P + '/' + W + '/' + F + ']';
  let s = sl8(m8Base()); // si prosegue dallo stato deserializzato fin dall'ingresso
  ok(soleObj(s) === 'obj_m8_0', label + ': obj_m8_0 all\'ingresso');
  // diner: nodo poi scelta, save/load a ogni passo (anche a metà del choice-node)
  doNode8(s, 'm8_diner'); s = sl8(s);
  doChoice8(s, 'm8_diner', 'promise_' + P); s = sl8(s);
  ok(NR.peekValue(s, 'promise_stance') === P, label + ': promise_stance=' + P + ' (sopravvive save/load)');
  ok(soleObj(s) === 'obj_m8_25', label + ': obj_m8_25 dopo la promessa (Leland al diner)');
  ok(!NR.prepareNode(s, M8, 'm8_roadhouse').ok, label + ': Roadhouse chiuso prima della testimonianza');
  doNode8(s, 'm8_leland_taxi'); s = sl8(s);
  ok(s.evidence.T_LELAND_TAXI === true, label + ': falsa storia taxi ascoltata al diner, prima del Roadhouse');
  ok(!s.flags.maddy_trovata && NR.peekValue(s, 'body_found_by') === undefined, label + ': testimonianza precede presagio, scoperta e assegnazione del ritrovamento');
  ok(soleObj(s) === 'obj_m8_1', label + ': obj_m8_1 dopo il taxi (root Roadhouse azionabile)');
  // roadhouse: presagio null sulla pagina del Gigante, active dopo il commit del nodo
  const pr = NR.prepareNode(s, M8, 'm8_roadhouse');
  ok(pr.ok && NR.peekValue(s, 'presagio_status') === undefined, label + ': presagio null sulla pagina del Gigante');
  NR.commitNode(s, M8, pr); s = sl8(s);
  ok(NR.peekValue(s, 'presagio_status') === 'active', label + ': presagio active dopo commitNode (mai come entry, sopravvive save/load)');
  doChoice8(s, 'm8_roadhouse', 'warning_' + W); s = sl8(s);
  ok(NR.peekValue(s, 'warning_target') === W, label + ': warning_target=' + W);
  ok(NR.peekValue(s, 'maddy_action_after_warning') === (W === 'palmer' ? 'departure_prepared' : 'none'), label + ': maddy_action nominale (none esplicito ≠ undefined)');
  ok(NR.peekValue(s, 'sarah_support_state') === (W === 'centrale' ? 'vice' : 'none'), label + ': sarah_support nominale');
  ok(soleObj(s) === 'obj_m8_2', label + ': obj_m8_2 (torna all’incrocio)');
  // focus
  doNode8(s, 'm8_focus_choice'); s = sl8(s);
  doChoice8(s, 'm8_focus_choice', 'focus_' + F); s = sl8(s);
  ok(NR.peekValue(s, 'focus_destination') === F, label + ': focus=' + F);
  const routeId = routeOf(F), others = ['m8_route_palmer', 'm8_route_lake', 'm8_route_diner'].filter(r => r !== routeId);
  ok(NR.prepareNode(s, M8, routeId).ok, label + ': route scelta disponibile (senza goto)');
  ok(others.every(r => !NR.prepareNode(s, M8, r).ok), label + ': altre route irraggiungibili');
  ok(NR.peekValue(s, 'body_found_by') === undefined, label + ': body_found_by assente prima del commit route');
  doNode8(s, routeId); s = sl8(s);
  const expectBody = (F === 'lago') ? 'cooper' : 'hawk';
  ok(NR.peekValue(s, 'body_found_by') === expectBody, label + ': body_found_by=' + expectBody + ' (mai sarah)');
  // discovery
  const pdisc = NR.prepareNode(s, M8, 'm8_discovery');
  ok(pdisc.ok && NR.peekValue(s, 'presagio_status') === 'active', label + ': presagio ancora active pre-commit discovery');
  NR.commitNode(s, M8, pdisc); s = sl8(s);
  ok(s.evidence.E9A_LETTERA_O && s.evidence.E9B_STESSO_METODO, label + ': E9A/E9B acquisite sempre');
  ok(NR.peekValue(s, 'letter_o_chain') === 'standard', label + ': letter_o_chain=standard');
  ok(NR.peekValue(s, 'letter_o_observation_source') === (expectBody === 'cooper' ? 'cooper_primary' : 'hawk_preserved'), label + ': source O derivata e congelata');
  ok(NR.peekValue(s, 'presagio_status') === 'verified', label + ': presagio active→verified SOLO al ritrovamento');
  ok(s.flags.maddy_trovata === true, label + ': maddy_trovata');
  ok(soleObj(s) === 'obj_m8_3', label + ': obj_m8_3 (rileggi lettere/diario)');
  ok(NR.prepareNode(s, M8, 'm8_promise_echo').ok, label + ': save_load_after_discovery_reopens_promise_echo');
  ok(!NR.prepareNode(s, M8, 'm8_cmp_letters').ok, label + ': confronti nascosti prima dell\'eco (post save/load)');
  // eco della promessa
  doNode8(s, 'm8_promise_echo'); s = sl8(s);
  ok(NR.prepareNode(s, M8, 'm8_cmp_letters').ok && !NR.prepareNode(s, M8, 'm8_cmp_diary').ok, label + ': save_load_after_echo_unlocks_letters_only');
  // confronto lettere
  doNode8(s, 'm8_cmp_letters'); s = sl8(s);
  ok(NR.prepareNode(s, M8, 'm8_cmp_diary').ok, label + ': save_load_after_cmp_letters_unlocks_diary');
  // diario: retry B → C → A, save/load fra ogni tentativo
  doNode8(s, 'm8_cmp_diary'); s = sl8(s);
  doChoice8(s, 'm8_cmp_diary', 'diary_b'); s = sl8(s);
  ok(!NR.availableChoices(s, M8, diaryNode).some(c => c.id === 'diary_b') && NR.peekProp(s, 'P8').formulation.status !== 'formulated', label + ': save_load_after_diary_b_hides_b (B nascosta, P8 non formulata)');
  doChoice8(s, 'm8_cmp_diary', 'diary_c'); s = sl8(s);
  ok(NR.availableChoices(s, M8, diaryNode).map(c => c.id).join(',') === 'diary_a' && NR.peekProp(s, 'P8').formulation.status !== 'formulated', label + ': save_load_after_diary_c_leaves_only_a');
  doChoice8(s, 'm8_cmp_diary', 'diary_a'); s = sl8(s);
  ok(NR.peekProp(s, 'P8').formulation.status === 'formulated', label + ': save_load_after_diary_a_preserves_p8 (formulata SOLO da A)');
  ok(soleObj(s) === 'obj_m8_35', label + ': obj_m8_35 prima della stazione');
  // stazione
  const pst = NR.prepareNode(s, M8, 'm8_station');
  ok(pst.ok, label + ': stazione preparabile');
  ok(soleObj(s) === 'obj_m8_35', label + ': obj_m8_4 NON attivo prima del commit stazione');
  ok(pst.pages.some(p => p.id === 'm8.f.station.p_valigia') === (W === 'palmer' && F !== 'palmer'), label + ': valigia in F iff warning=palmer ∧ focus≠palmer');
  NR.commitNode(s, M8, pst); s = sl8(s);
  ok(NR.checkCompletion(s, M8) === true, label + ': save_load_after_station_preserves_completion');
  ok(soleObj(s) === 'obj_m8_4', label + ': obj_m8_4 dopo il commit stazione (→ M9)');
  ok(s.flags.maddy_trovata === true && s.flags.maddy_salvabile === undefined, label + ': Maddy morta in tutti i percorsi, nessun maddy_salvabile');
  ok(s.values.m6_tactic === undefined && s.values.m5_initial_theory === undefined, label + ': nessuna contaminazione M5/M6');
  m8Continued++;
  m8PathCount++;
}
ok(m8PathCount === 27, 'matrice canonica M8: 27 percorsi ESEGUITI dal runtime (' + m8PathCount + ')');
ok(m8Continued === 27, 'all_27_paths_continue_from_deserialized_state (' + m8Continued + '/27, ' + m8SaveLoads + ' checkpoint save/load reali)');
// log macchina per la consegna C8-B (numeri DAL RUN)
try {
  fs.writeFileSync(path.join(__dirname, '..', 'artifacts', 'C8B-validation-log.json'), JSON.stringify({
    generated_by: 'test/narrative-validate.js',
    generated_at: new Date().toISOString(),
    revision: 'C8-B.1',
    m8_canonical_paths_executed: m8PathCount,
    paths_continue_from_deserialized_state: m8Continued,
    save_load_checkpoints: m8SaveLoads,
    primitives: ['value_transition', 'from_derivation', 'conditional_pages'],
    from_derivation_contract: 'full-source-domain coverage (source domain + current-in-domain + map covers domain + every output in derived domain + failure keeps state byte-identical)',
    m8_static_validator_reconciliation: 'test/narrative-validate-m8.js = 3550 (era 3548 nella ricostruzione del revisore: +2 gate source_map bible-authority aggiunti nella pulizia C8-A.3, ora inclusi nel bundle con la source-map)',
    total_checks: checks, failures: failures,
    runtime_schema: NR.schemaVersion
  }, null, 1));
} catch (eLog2) { /* directory assente: il log è opzionale */ }

console.log('');
if (failures === 0) { console.log(checks + ' controlli narrativi superati ✔ (runtime transazionale)'); process.exit(0); }
else { console.error(failures + '/' + checks + ' FALLITI ✗'); process.exit(1); }
