/* test/act-5-flow.js — Act 5 (M9 «La convocazione» → M10 «L'interrogatorio»), no browser.
 * Runtime reale (js/narrative-runtime.js + narrative-data.gen.js + bootstrap), mai una
 * simulazione parallela. Matrice (narrative/schema-deltas/M10-validation-matrix.md):
 *   m10_method (3) × s3 (2) × tattica M6 (3) × warning_target (3) × focus_destination (3)
 *   × promise_stance (3) = 486 percorsi completi da M8 consegnata a leland_morto.
 * Per ogni percorso: M9 con tutti i reason code (VALID_BUT_NOT_PROCEDURAL, NO_CORROBORATION,
 * ALREADY_REJECTED, SUFFICIENT_RELEVANT_SUPPORT); M10 anello per anello con save/load,
 * ripresa dopo interruzione (continuation da Leland, Truman dopo il fermo), gate di S3,
 * fase semantica degli effetti, pagine attese per stato, Cast Presence, obiettivo unico,
 * ingresso del finale sulla Loggia. Poi sonde distruttive (fail-closed).
 * node test/act-5-flow.js */
'use strict';
const assert = require('assert');
const path = require('path');

let checks = 0;
const counters = {};
function ok(cond, msg) { checks++; if (!cond) { console.error('  not ok - ' + msg); assert(cond, msg); } }
function count(key) { counters[key] = (counters[key] || 0) + 1; }

global.window = global;
const J = (f) => path.join(__dirname, '..', 'js', f);
require(J('narrative-runtime.js'));
require(J('narrative-data.gen.js'));
require(J('narrative-bootstrap.js'));
require(J('cast-presence.js'));
require(J('narrative-finale.js'));
const GAME = global.GAME;
GAME.installNarrativeCatalogs();
const NR = GAME.NarrativeRuntime, D = GAME.NarrativeData, CP = GAME.CastPresence, NF = GAME.NarrativeFinale;
const M9 = D.missions.M9, M10 = D.missions.M10;
const PINS = require(path.join(__dirname, 'fixtures', 'cast-pins-acts-1-4.json'));
const ADMISSIONS = ['taxi_lie', 'traincar_presence', 'laura_homicide', 'maddy_homicide', 'maddy_body_transport', 'letters'];
const CHAIN = ['m10_soglia', 'm10_apertura', 'm10_domande', 'm10_affioramento', 'm10_confessione', 'm10_s3', 'm10_post_s3', 'm10_vittime', 'm10_fermo', 'm10_morte'];
const TACTIC_EVIDENCE = { prova: 'JACQUES_MIDNIGHT_CLAIM', pressione: 'JACQUES_LIST_GIVEN', falsa_sicurezza: 'JACQUES_THIRD_MAN_DETAIL' };
const DESIGN_TEXT = /\b(m10_|m9_|P6|P8|material_admissions|speaker_register|leland_first_person|truman_testimony_state|bob_surface|SUFFICIENT_RELEVANT_SUPPORT|NO_CORROBORATION|ALREADY_REJECTED|VALID_BUT_NOT_PROCEDURAL)\b|\bBOB\b/;

const node = (m, id) => m.nodes.find((n) => n.id === id);
function reload(state) { return NR.deserialize(NR.serialize(state)); }
function ids(pages) { return pages.map((p) => p.id); }

function seedState(combo) {
  const st = NR.createState();
  const seed = JSON.parse(JSON.stringify(PINS.seeds.ACT4_STATION_BEFORE_DAWN));
  Object.keys(seed).forEach((k) => { st[k] = Object.assign(st[k] || {}, seed[k]); });
  st.values.promise_stance = combo.promise;
  st.values.warning_target = combo.warning;
  st.values.focus_destination = combo.focus;
  st.values.m6_tactic = combo.tactic;
  st.evidence[TACTIC_EVIDENCE[combo.tactic]] = true;
  // M8 consegnata: P8 formulata (m8_cmp_diary) e presentabile a Truman in M9
  st.props.P8 = { formulation: { status: 'formulated', created_from: ['E3_LETTERA_R', 'E9A_LETTERA_O', 'E9B_STESSO_METODO', 'E1_DIARIO'] }, presentations: [], social_status: { accepted_by: [] }, factual_status: 'unconfirmed' };
  st.values.letter_o_observation_source = 'cooper_primary';
  return st;
}

function prepCommit(state, mission, id, label) {
  const p = NR.prepareNode(state, mission, id);
  ok(p.ok && !p.continuation && !p.already_completed, label + ': prepare ' + id + ' (' + (p.error || 'ok') + ')');
  const c = NR.commitNode(state, mission, p);
  ok(c.ok && !c.repeated, label + ': commit ' + id);
  return p;
}
function choose(state, mission, nodeId, choiceId, label) {
  const n = node(mission, nodeId);
  const pc = NR.prepareChoice(state, mission, n, choiceId);
  ok(pc.ok, label + ': prepareChoice ' + choiceId + ' (' + (pc.error || 'ok') + ')');
  const cc = NR.commitChoice(state, mission, n, pc);
  ok(cc.ok, label + ': commitChoice ' + choiceId);
  return pc;
}
function oneObjective(state, mission, label) {
  const t = NR.trueObjectives(state, mission);
  ok(t.length === 1, label + ': esattamente un obiettivo vero in ' + mission.mission + ' (' + t.map((o) => o.id) + ')');
  return t[0];
}
function presence(state, c) { return CP.resolveCharacterPresence(c, state); }
function placedSheriff(r) { return r.status === 'PLACED' && r.sceneId === 'sheriff'; }

/* ===================== M9: tutti i reason code ===================== */
function runM9(state, label) {
  ok(NR.evalCond(state, M9.entry_condition, M9), label + ': ingresso M9');
  oneObjective(state, M9, label + ' M9 ingresso');
  prepCommit(state, M9, 'm9_verifica_taxi', label);
  prepCommit(state, M9, 'm9_cmp_taxi', label);
  ok(state.props.P6.formulation.status === 'formulated' && state.props.P6.factual_status === 'unconfirmed', label + ': P6 formulata, unconfirmed');
  const pres = node(M9, 'm9_present_truman');
  prepCommit(state, M9, 'm9_present_truman', label);
  // P8 come base → VALID_BUT_NOT_PROCEDURAL
  let pp = NR.preparePresentation(state, M9, pres, 'P8', []);
  ok(pp.ok && pp.record.reason_code === 'VALID_BUT_NOT_PROCEDURAL', label + ': P8 → VALID_BUT_NOT_PROCEDURAL');
  NR.commitPresentation(state, M9, pres, pp); count('reason:VALID_BUT_NOT_PROCEDURAL');
  // P6 senza la verifica → NO_CORROBORATION, poi ALREADY_REJECTED
  pp = NR.preparePresentation(state, M9, pres, 'P6', ['T_LELAND_TAXI']);
  ok(pp.ok && pp.record.reason_code === 'NO_CORROBORATION', label + ': P6 incompleta → NO_CORROBORATION');
  NR.commitPresentation(state, M9, pres, pp); count('reason:NO_CORROBORATION');
  state = reload(state);
  pp = NR.preparePresentation(state, M9, pres, 'P6', ['T_LELAND_TAXI']);
  ok(pp.ok && pp.record.reason_code === 'ALREADY_REJECTED' && ids(pp.pages)[0] === 'm9.b2.p6.already_rejected', label + ': ripetizione → ALREADY_REJECTED');
  NR.commitPresentation(state, M9, pres, pp); count('reason:ALREADY_REJECTED');
  ok(!state.flags.atto5 && !NR.evalCond(state, M10.entry_condition, M10), label + ': rifiuti non aprono M10');
  pp = NR.preparePresentation(state, M9, pres, 'P6', ['T_LELAND_TAXI', 'D_TAXI']);
  ok(pp.ok && pp.record.reason_code === 'SUFFICIENT_RELEVANT_SUPPORT' && pp.record.acceptance_type === 'colloquio_necessario', label + ': P6 completa → accettata (colloquio_necessario)');
  NR.commitPresentation(state, M9, pres, pp); count('reason:SUFFICIENT_RELEVANT_SUPPORT');
  ok(state.flags.atto5 && state.props.P6.factual_status === 'unconfirmed', label + ': atto5 scritto; P6 resta unconfirmed in M9');
  ok(placedSheriff(presence(state, 'leland')), label + ': Leland alla centrale (ACT5_LELAND_STATION)');
  prepCommit(state, M9, 'm9_arrivo', label);
  ok(NR.checkCompletion(state, M9), label + ': M9 completata');
  return state;
}

/* ===================== M10: una catena, anello per anello ===================== */
function expectedDomande(combo) {
  const out = [];
  if (combo.method === 'probatorio') {
    if (combo.tactic === 'prova') out.push('m10.b3.probatorio.midnight');
  } else if (combo.method === 'personale') {
    if (combo.warning === 'palmer' && combo.focus === 'palmer') out.push('m10.b3.personale.biglietto_letto', 'm10.b3.personale.visto');
    else if (combo.warning === 'palmer') out.push('m10.b3.personale.biglietto_truman', 'm10.b3.personale.visto');
    else out.push('m10.b3.personale.corriera', 'm10.b3.personale.orario');
  }
  return out;
}
function runM10(state, combo, label) {
  ok(NR.evalCond(state, M10.entry_condition, M10), label + ': ingresso M10 = consegna M9');
  ok(ids(NR.worldRoots(state, M10, 'sheriff', 'leland')).join() === 'm10_soglia', label + ': unica root su Leland = m10_soglia');
  ok(oneObjective(state, M10, label + ' M10 ingresso').id === 'obj_m10_1', label + ': obiettivo obj_m10_1');
  ok(NR.prepareNode(state, M10, 'm10_s3').ok === false, label + ': S3 non preparabile prima delle ammissioni');
  const rendered = [];

  // B1 soglia: pagine, commit, widget del metodo PRIMA del nastro
  const pSoglia = prepCommit(state, M10, 'm10_soglia', label);
  rendered.push(...pSoglia.pages);
  ok(!pSoglia.pages.some((p) => p.recorded_on === 'tape'), label + ': nessuna pagina del nastro prima del metodo');
  state = reload(state);
  // interruzione sul widget: la root riapre la scelta
  const resumeChoice = NR.prepareNode(state, M10, 'm10_soglia');
  ok(resumeChoice.ok && resumeChoice.resume_choice, label + ': widget del metodo riapribile dopo interruzione');
  choose(state, M10, 'm10_soglia', 'method_' + combo.method, label);
  ok(state.values.m10_method === combo.method, label + ': m10_method write-once = ' + combo.method);
  const reopen = NR.prepareNode(state, M10, 'm10_soglia');
  ok(reopen.ok && !reopen.resume_choice && reopen.continuation === 'm10_apertura', label + ': a metodo scelto il widget non si riapre (continuation)');
  const probe = reload(state); NR.applyEffects(probe, [{ value: 'm10_method', to: combo.method === 'intuitivo' ? 'probatorio' : 'intuitivo' }]);
  ok(probe.values.m10_method === combo.method, label + ': metodo write-once (un secondo effetto non lo riscrive)');

  for (let i = 1; i < CHAIN.length; i++) {
    const id = CHAIN[i];
    state = reload(state);
    // ripresa: da quale target riparte una sessione interrotta prima di questo anello?
    const beforeFermo = !state.nodes_done.m10_fermo;
    const actor = beforeFermo ? 'leland' : 'truman';
    const roots = NR.worldRoots(state, M10, 'sheriff', actor);
    ok(roots.length === 1, label + ': una root su ' + actor + ' prima di ' + id + ' (' + ids(roots) + ')');
    const r = NR.prepareNode(state, M10, roots[0].id);
    if (roots[0].id === id) ok(r.ok && !r.continuation, label + ': ' + id + ' è la root esposta');
    else ok(r.ok && r.continuation === id, label + ': ripresa da ' + roots[0].id + ' → continuation ' + id + ' (' + (r.continuation || r.error) + ')');
    if (!beforeFermo) ok(!placedSheriff(presence(state, 'leland')) && placedSheriff(presence(state, 'truman')), label + ': dopo il fermo Leland in cella, Truman presente per la ripresa');
    else ok(placedSheriff(presence(state, 'leland')), label + ': Leland alla centrale prima di ' + id);

    if (id === 'm10_s3') {
      ADMISSIONS.forEach((f) => ok(state.values['material_admissions.' + f] === 'leland_first_person', label + ': ' + f + ' registrata prima di S3'));
      const pS3 = prepCommit(state, M10, 'm10_s3', label);
      rendered.push(...pS3.pages);
      const pc = choose(state, M10, 'm10_s3', 's3_' + combo.s3, label);
      rendered.push(...pc.feedback_pages);
      ok(state.values.s3 === combo.s3 && state.values.truman_testimony_state === (combo.s3 === 'on' ? 'not_needed' : 'voluntary_witness'), label + ': s3/truman_testimony_state');
      ADMISSIONS.forEach((f) => ok(state.values['material_admissions.' + f] === 'leland_first_person', label + ': S3-' + combo.s3 + ' conserva ' + f));
      continue;
    }
    const prep = NR.prepareNode(state, M10, id);
    ok(prep.ok, label + ': prepare ' + id + ' (' + (prep.error || 'ok') + ')');
    if (id === 'm10_confessione') {
      ADMISSIONS.forEach((f) => ok(state.values['material_admissions.' + f] === undefined, label + ': ' + f + ' NON scritta in prepare (fase semantica)'));
      ok(state.props.P6.factual_status === 'unconfirmed', label + ': P6 unconfirmed fino al commit di B6');
      const admitted = new Set();
      prep.pages.forEach((p) => (p.admits || []).forEach((a) => admitted.add(a)));
      ok(ADMISSIONS.every((a) => admitted.has(a)), label + ': sei ammissioni rese a schermo');
      ok(prep.pages.filter((p) => p.admits).every((p) => p.speaker_id === 'leland'), label + ': ammissioni in prima persona di Leland');
    }
    if (id === 'm10_domande') {
      const got = ids(prep.pages.filter((p) => p.condition));
      ok(JSON.stringify(got) === JSON.stringify(expectedDomande(combo)), label + ': pagine condizionate B3-B4 ' + JSON.stringify(got));
      ok(prep.pages.every((p) => p.id.indexOf('m10.b3.' + combo.method + '.') === 0), label + ': solo il ramo ' + combo.method);
    }
    if (id === 'm10_apertura') ok(prep.pages.some((p) => p.id === 'm10.b2.apertura.promise'), label + ': eco promise_stance (taccuino chiuso)');
    if (id === 'm10_affioramento') {
      const echoes = ids(prep.pages.filter((p) => p.condition));
      const want = combo.tactic === 'pressione' && combo.method !== 'intuitivo' ? ['m10.b5.affioramento.list'] : combo.tactic === 'falsa_sicurezza' ? ['m10.b5.affioramento.stove'] : [];
      ok(JSON.stringify(echoes) === JSON.stringify(want), label + ': eco M6 in B5 ' + JSON.stringify(echoes));
      ok(prep.pages.filter((p) => p.bob_surface).map((p) => p.bob_surface).join() === 'portrait_shown,register_shift', label + ': due segnali BOB');
    }
    rendered.push(...prep.pages);
    const c = NR.commitNode(state, M10, prep);
    ok(c.ok, label + ': commit ' + id);
    if (id === 'm10_domande') {
      const tr = presence(state, 'truman');
      ok(combo.method === 'intuitivo' ? tr.status === 'OFFSCREEN' && tr.label === 'corridor' : placedSheriff(tr), label + ': Truman fuori SOLO nell\'intuitivo (' + tr.status + ')');
    }
    if (id === 'm10_confessione') {
      ok(state.props.P6.factual_status === 'confirmed_as_lie' && state.props.P8.factual_status === 'corroborated', label + ': P6 confirmed_as_lie, P8 corroborated dopo B6');
      ok(placedSheriff(presence(state, 'truman')), label + ': Truman di nuovo nella stanza dopo B6');
    }
    if (id !== 'm10_morte') oneObjective(state, M10, label + ' dopo ' + id);
  }
  ok(state.flags.leland_morto && NR.checkCompletion(state, M10), label + ': leland_morto → M10 completata');
  ok(oneObjective(state, M10, label + ' fine').id === 'obj_m10_2', label + ': obiettivo Loggia');
  ok(presence(state, 'leland').status === 'TERMINAL_REMOVED', label + ': Leland TERMINAL_REMOVED');
  ok(NR.worldRoots(state, M10, 'sheriff', 'truman').length === 0 && NR.worldRoots(state, M10, 'sheriff', 'leland').length === 0, label + ': nessuna root dopo leland_morto');
  rendered.forEach((p) => ok(!DESIGN_TEXT.test(p.text), label + ': testo senza ID di design ' + p.id));
  const post = rendered.filter((p) => p.id.indexOf('m10.b7b.') === 0).map((p) => p.text).join('|');
  return { state, rendered, post };
}

/* ===================== matrice ===================== */
console.log('# act-5-flow: matrice M9 → M10 (runtime reale, save/load a ogni anello)');
const E = D.enums.enums;
const postByMethod = {};
let paths = 0;
let pageTotal = 0;
for (const method of E.m10_method) for (const s3 of E.s3) for (const tactic of E.m6_tactic) for (const warning of E.warning_target) for (const focus of E.focus_destination) for (const promise of E.promise_stance) {
  const combo = { method, s3, tactic, warning, focus, promise };
  const label = [method, s3, tactic, warning, focus, promise].join('/');
  let state = seedState(combo);
  state = runM9(state, label);
  const res = runM10(state, combo, label);
  pageTotal += res.rendered.length;
  (postByMethod[method] = postByMethod[method] || new Set()).add(res.post);
  // il finale entra sulla Loggia con i fatti del ledger
  NF.reset();
  const started = NF.startAtLodge({ carryover: { values: res.state.values, flags: res.state.flags, p6_status: res.state.props.P6.factual_status } });
  ok(started.ok && started.stage === 'await_lodge' && NF.getState().values.m10_method === method && NF.getState().values.s3 === s3, label + ': finale armato sulla Loggia con metodo e nastro');
  ok(Object.keys(NF.getState().material_admissions).length === 6, label + ': il finale riceve sei record per-fatto');
  NF.reset();
  paths++;
  count('method:' + method); count('s3:' + s3);
}
ok(paths === 3 * 2 * 3 * 3 * 3 * 3, 'percorsi completi: ' + paths);
ok(Object.values(postByMethod).every((s) => s.size === 1) && new Set(Object.values(postByMethod).map((s) => [...s][0])).size === 1, 'B7b identico in tutti i metodi e in entrambi i rami S3');
['VALID_BUT_NOT_PROCEDURAL', 'NO_CORROBORATION', 'ALREADY_REJECTED', 'SUFFICIENT_RELEVANT_SUPPORT'].forEach((rc) => ok(counters['reason:' + rc] === paths, 'reason code ' + rc + ' esercitato su ogni percorso (' + counters['reason:' + rc] + ')'));

/* ===================== sonde distruttive (fail-closed) ===================== */
console.log('# act-5-flow: sonde distruttive');
{
  const combo = { method: 'probatorio', s3: 'off', tactic: 'prova', warning: 'palmer', focus: 'lago', promise: 'accompagno' };
  let st = runM9(seedState(combo), 'probe');
  // S3 senza una sola ammissione: condizioni false
  const partial = reload(st);
  CHAIN.slice(0, 5).forEach((id) => { partial.nodes_done[id] = true; });
  partial.values.m10_method = 'probatorio';
  ADMISSIONS.slice(0, 5).forEach((f) => { partial.values['material_admissions.' + f] = 'leland_first_person'; });
  ok(/conditions_not_met/.test(NR.prepareNode(partial, M10, 'm10_s3').error), 'S3 rifiutata con 5 ammissioni su 6');
  // effetto factual_status: dominio, proposizione non formulata, doppio stato
  const bad = reload(st);
  ok(/factual_status_out_of_domain/.test(NR.validateValueEffects(bad, [{ proposition: 'P6', factual_status: 'forse' }])), 'factual_status fuori dominio rifiutato');
  ok(/factual_status_unformulated/.test(NR.validateValueEffects(bad, [{ proposition: 'P99', factual_status: 'confirmed' }])), 'factual_status su proposizione non formulata rifiutato');
  bad.props.P6.factual_status = 'refuted';
  ok(/factual_status_already_set/.test(NR.validateValueEffects(bad, [{ proposition: 'P6', factual_status: 'confirmed_as_lie' }])), 'factual_status non sovrascrive uno stato diverso');
  // salvataggio con admission fuori dominio rifiutato al load
  const tampered = reload(st); tampered.values['material_admissions.letters'] = 'yes';
  let threw = null; try { reload(tampered); } catch (e) { threw = String(e.message); }
  ok(/save_value_out_of_domain: material_admissions.letters=yes/.test(threw || ''), 'save con ammissione booleana/fuori dominio rifiutato');
  // finale: ingresso senza fatti → errore esplicito
  NF.reset();
  ok(NF.startAtLodge({ carryover: { values: {}, flags: {} } }).error === 'lodge_entry_without_leland_morto', 'finale rifiuta Loggia senza leland_morto');
  const res = runM10(st, combo, 'probe');
  const v = JSON.parse(JSON.stringify(res.state.values)); delete v['material_admissions.maddy_body_transport'];
  NF.reset();
  ok(NF.startAtLodge({ carryover: { values: v, flags: res.state.flags, p6_status: 'confirmed_as_lie' } }).error === 'lodge_entry_missing_admission_maddy_body_transport', 'finale rifiuta Loggia con un\'ammissione mancante');
  NF.reset();
  ok(NF.startAtLodge({ carryover: { values: res.state.values, flags: res.state.flags, p6_status: 'unconfirmed' } }).error === 'lodge_entry_p6_not_confirmed_as_lie', 'finale rifiuta Loggia con P6 non confermata');
  NF.reset();
  ok(Array.isArray(NF.RETIRED_M10_STAGES) && NF.RETIRED_M10_STAGES.indexOf('m10_threshold') >= 0 && NF.RETIRED_M10_STAGES.indexOf('death') >= 0, 'fasi M10 retro dichiarate ritirate');
}

console.log('act-5-flow: ' + paths + ' percorsi, ' + pageTotal + ' pagine rese, metodi ' + E.m10_method.map((m) => m + '=' + counters['method:' + m]).join(' '));
console.log('act-5-flow: ' + checks + '/' + checks);
