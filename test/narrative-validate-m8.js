/* test/narrative-validate-m8.js — C8-A: validazione STATICA della proposta M8.
 *
 * Perimetro dichiarato: C8-A è DATA-ONLY. Il runtime NON è esteso (value_transition
 * presagio active→verified, letter_o_observation_source derivato, conditional_pages
 * sono PROPOSTE in narrative/schema-deltas/M8.md). Prova tutto ciò che è provabile
 * senza eseguire i nuovi costrutti: fedeltà al Lock §9, provenienza, registro pagine
 * globale, igiene participant-facing + FALSA COLPA, writer unici, i 9 assi
 * warning×focus, partizione obiettivi, tragedia fissa (nessun maddy_salvabile).
 * La copertura DINAMICA (M8-validation-matrix.md) sarà eseguita DAL runtime esteso
 * in C8-B — mai da una simulazione parallela.
 * node test/narrative-validate-m8.js */
'use strict';
const fs = require('fs');
const path = require('path');
let checks = 0, failures = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; console.error('  ✗ ' + msg); } }

const ROOT = path.join(__dirname, '..', 'narrative');
const M4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M4.json'), 'utf8'));
const M5 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M5.json'), 'utf8'));
const M6 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M6.json'), 'utf8'));
const M8 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M8.json'), 'utf8'));
const enums = JSON.parse(fs.readFileSync(path.join(ROOT, 'state-enums.json'), 'utf8'));
const evidence = JSON.parse(fs.readFileSync(path.join(ROOT, 'evidence.json'), 'utf8')).evidence;
const propositions = JSON.parse(fs.readFileSync(path.join(ROOT, 'propositions.json'), 'utf8')).propositions;
const dEnums = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema-deltas', 'diff-state-enums-M8.json'), 'utf8'));
const dEvid = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema-deltas', 'diff-evidence-M8.json'), 'utf8'));
const dProp = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema-deltas', 'diff-propositions-M8.json'), 'utf8'));

function node(id) { return M8.nodes.find(n => n.id === id); }
function effectsOf(n) { const e = [].concat(n.effects || []); (n.choices || []).forEach(c => e.push(...(c.effects || []))); return e; }
const ROUTES = ['m8_route_palmer', 'm8_route_lake', 'm8_route_diner'];

console.log('# autorità canonica e provenienza');
ok(M8.source.document === 'M8 v1.1 LOCK.md', 'sorgente = M8 v1.1 LOCK.md');
ok(M8.schema_delta === 'narrative/schema-deltas/M8.md', 'schema-delta referenziato');
for (const n of M8.nodes) ok(typeof n.source_section === 'string' && n.source_section.indexOf('M8-') === 0, n.id + ': source_section M8-*');
ok(JSON.stringify(M8.entry_condition) === JSON.stringify({ flag: 'atto4' }), 'entrata = atto4 (mai presagio active, mai M6 diretto)');
ok(M8.completion.when.node_done === 'm8_station', 'completamento = m8_station concluso (dopo l\'indagine, non maddy_trovata)');

console.log('# registro pagine (globale M4+M5+M6+M8)');
const allPages = new Map();
function collect(o, src) {
  if (Array.isArray(o)) return o.forEach(v => collect(v, src));
  if (o && typeof o === 'object') {
    if (o.id && o.text !== undefined && o.mode) {
      ok(!allPages.has(o.id), 'page ID duplicato globalmente: ' + o.id);
      allPages.set(o.id, o);
      ok(o.mode !== 'dialogue' || !!o.speaker_id, o.id + ': dialogo senza speaker_id');
      if (src === 'M8') ok(o.id.indexOf('m8.') === 0, o.id + ': prefisso m8. stabile');
    }
    for (const v of Object.values(o)) collect(v, src);
  }
}
[M4, M5, M6].forEach(m => collect(m, 'x'));
const pre = allPages.size;
collect(M8, 'M8');
const m8pages = allPages.size - pre;
ok(m8pages > 40, 'pagine M8 registrate, uniche anche vs M4+M5+M6 (' + m8pages + ')');

console.log('# igiene participant-facing (nessun token interno)');
const TOK = ['E9A_', 'E9B_', 'E3_LETTERA', 'E1_DIARIO', 'promise_stance', 'warning_target', 'focus_destination', 'body_found_by', 'letter_o_', 'presagio_status', 'maddy_action_after_warning', 'sarah_support_state', 'maddy_trovata', 'maddy_salvabile', 'authorial_timeline', 'LETTERS_SAME_METHOD', 'PROGRESSIVE_SIGNATURE', 'NAME_OVERREACH', 'HOUSE_OVERREACH', 'm8_', 'P8.', 'P7.', 'value_transition'];
function eachText(fn) {
  (function walk(o, p) {
    if (Array.isArray(o)) return o.forEach((v, i) => walk(v, p + '[' + i + ']'));
    if (o && typeof o === 'object') {
      if (typeof o.text === 'string' && o.id) fn(o.text, o.id);
      if (typeof o.label === 'string' && o.id) fn(o.label, p + '.label(' + o.id + ')');
      for (const [k, v] of Object.entries(o)) walk(v, p + '.' + k);
    }
  })(M8, 'M8');
  M8.objectives.forEach(o => fn(o.text, 'objective:' + o.id));
}
eachText((t, w) => TOK.forEach(tok => ok(t.indexOf(tok) === -1, w + ': token interno «' + tok + '»')));

console.log('# IGIENE DELLA FALSA COLPA (Lock §4/§14)');
const BANNED = [/avresti potuto salvarla/i, /avrebbe potuto salvarla/i, /se fossi arrivato prima/i, /strada sbagliata/i, /dovevi chiamare/i, /raggiungi maddy/i, /salva maddy/i, /troppo tardi/i, /avresti dovuto/i, /potuto salvarla/i];
eachText((t, w) => BANNED.forEach(re => ok(!re.test(t), w + ': frase di FALSA COLPA vietata (' + re + ')')));
// nessuna opzione (label) nomina Maddy come BERSAGLIO della minaccia
M8.nodes.forEach(n => (n.choices || []).forEach(c => ok(!/maddy/i.test(c.label) || !/(salva|bersaglio|pericolo|uccis|mor[ti])/i.test(c.label), n.id + '/' + c.id + ': opzione non nomina Maddy come bersaglio')));

console.log('# tragedia fissa: nessun maddy_salvabile operativo');
ok(enums.deprecated_forbidden.includes('maddy_salvabile'), 'maddy_salvabile deprecato a catalogo');
const operative = new Set();
(function scan() {
  function conds(cs) { for (const c of (cs || [])) { if (c.flag) operative.add(c.flag); if (c.set) operative.add(c.set); if (c.value_is) operative.add(c.value_is.name); if (c.value_set) operative.add(c.value_set); if (c.not) conds([c.not]); if (c.all) conds(c.all); } }
  for (const n of M8.nodes) { conds(n.conditions); for (const e of effectsOf(n)) { if (e.set) operative.add(e.set); if (e.value) operative.add(e.value); if (e.value_transition) operative.add(e.value_transition.name); } }
  M8.objectives.forEach(o => conds([o.when]));
})();
ok(!operative.has('maddy_salvabile'), 'maddy_salvabile mai operativo in effetti/condizioni');
ok(!(effectsOf({ effects: [], choices: M8.nodes.flatMap(n => n.choices || []) }).some(e => e.set === 'maddy_salvabile')), 'nessuna scelta scrive maddy_salvabile');

console.log('# writer unici');
function writers(pred) { const o = []; for (const n of M8.nodes) if (effectsOf(n).some(pred)) o.push(n.id); return o; }
ok(JSON.stringify(writers(e => e.value === 'promise_stance')) === '["m8_diner"]', 'promise_stance: unico writer = diner');
ok(JSON.stringify(writers(e => e.value === 'warning_target')) === '["m8_roadhouse"]', 'warning_target: unico writer = roadhouse');
ok(JSON.stringify(writers(e => e.value === 'presagio_status')) === '["m8_roadhouse"]', 'presagio_status (to active): unico writer = roadhouse');
ok(JSON.stringify(writers(e => e.value_transition && e.value_transition.name === 'presagio_status')) === '["m8_discovery"]', 'presagio active→verified: SOLO al ritrovamento (value_transition)');
ok(JSON.stringify(writers(e => e.value === 'focus_destination')) === '["m8_focus_choice"]', 'focus_destination: unico writer = focus_choice');
ok(JSON.stringify(writers(e => e.value === 'body_found_by').sort()) === JSON.stringify(ROUTES.slice().sort()), 'body_found_by: scritto dai 3 route');
ok(JSON.stringify(writers(e => e.evidence === 'E9A_LETTERA_O')) === '["m8_discovery"]', 'E9A: unico writer = ritrovamento');
ok(JSON.stringify(writers(e => e.evidence === 'E9B_STESSO_METODO')) === '["m8_discovery"]', 'E9B: unico writer = ritrovamento');
ok(JSON.stringify(writers(e => e.evidence === 'T_LELAND_TAXI')) === '["m8_leland_taxi"]', 'T_LELAND_TAXI: unico writer = Leland, pre-ritrovamento');
ok(JSON.stringify(writers(e => e.value === 'letter_o_chain')) === '["m8_discovery"]', 'letter_o_chain: unico writer = ritrovamento');
ok(JSON.stringify(writers(e => e.set === 'maddy_trovata')) === '["m8_discovery"]', 'maddy_trovata: unico writer = ritrovamento');
ok(JSON.stringify(writers(e => e.value === 'maddy_action_after_warning')) === '["m8_roadhouse"]', 'maddy_action_after_warning: valore, unico writer = roadhouse');
ok(JSON.stringify(writers(e => e.value === 'sarah_support_state')) === '["m8_roadhouse"]', 'sarah_support_state: valore, unico writer = roadhouse');
ok(JSON.stringify(writers(e => e.value === 'letter_o_observation_source')) === '["m8_discovery"]', 'letter_o_observation_source: effetto derivato, unico writer = ritrovamento');
ok(JSON.stringify(writers(e => e.proposition === 'P8')) === '["m8_cmp_diary"]', 'P8: unico writer = cmp_diary');
// body_found_by mai sarah
ok(!M8.nodes.some(n => effectsOf(n).some(e => e.value === 'body_found_by' && e.to === 'sarah')), 'body_found_by mai = sarah (Sarah non trova mai il corpo)');
ok(!enums.enums.body_found_by.includes('sarah'), 'dominio body_found_by senza sarah');

console.log('# valori tipizzati e transizione controllata (contro i domini + il diff)');
const VA = Object.assign({}, enums.values_allowed, dEnums.values_allowed_add);
const ENUMS = Object.assign({}, enums.enums, dEnums.enums_add);
const M8VALS = ['promise_stance', 'warning_target', 'focus_destination', 'body_found_by', 'letter_o_chain', 'presagio_status'];
M8VALS.forEach(v => ok(dEnums.values_allowed_add[v] === v && enums.enums[v], 'delta: ' + v + ' → dominio a catalogo (values_allowed)'));
ok(dEnums.values_allowed_add.letter_o_observation_source === 'letter_o_observation_source', 'delta: letter_o_observation_source in values_allowed (derivato)');
const BOOL = enums.booleans_allowed.concat(dEnums.booleans_allowed_add);
for (const n of M8.nodes) {
  for (const e of effectsOf(n)) {
    if (e.value && !e.from_derivation) {
      const dom = ENUMS[VA[e.value]];
      ok(!!dom, n.id + ': valore senza dominio ' + e.value);
      if (e.to !== undefined) ok(dom.includes(e.to), n.id + ': assegnazione fuori dominio ' + e.value + '=' + e.to);
    }
    if (e.value && e.from_derivation) {
      const dom = ENUMS[VA[e.value]], src = ENUMS[VA[e.from_derivation.of]];
      ok(!!dom && !!src, n.id + ': effetto derivato ' + e.value + ' ← ' + e.from_derivation.of + ' (domini presenti)');
      ok(Object.keys(e.from_derivation.map).every(k => src.includes(k)) && Object.values(e.from_derivation.map).every(v => dom.includes(v)), n.id + ': mappa di derivazione dentro i domini (chiavi ∈ ' + e.from_derivation.of + ', valori ∈ ' + e.value + ')');
    }
    if (e.value_transition) {
      const vt = e.value_transition, dom = enums.enums[VA[vt.name]];
      ok(!!dom && dom.includes(vt.from) && dom.includes(vt.to), n.id + ': transizione dentro il dominio ' + vt.name);
      const allowed = (dEnums.value_transitions_add[vt.name] || []).some(p => p[0] === vt.from && p[1] === vt.to);
      ok(allowed, n.id + ': transizione [' + vt.from + '→' + vt.to + '] dichiarata in value_transitions_add');
    }
    if (e.set) { ok(BOOL.includes(e.set), n.id + ': boolean non ammesso ' + e.set); ok(!enums.deprecated_forbidden.includes(e.set), n.id + ': flag deprecato ' + e.set); }
    if (e.evidence) ok(evidence[e.evidence] !== undefined, n.id + ': evidenza inesistente ' + e.evidence);
    if (e.proposition) ok(propositions[e.proposition] !== undefined, n.id + ': proposizione inesistente ' + e.proposition);
  }
}
// value_transitions_add copre SOLO presagio active→verified
ok(JSON.stringify(dEnums.value_transitions_add) === JSON.stringify({ presagio_status: [['active', 'verified']] }), 'diff: value_transitions_add = presagio active→verified soltanto');
// la transizione inversa NON è dichiarata (fail-closed)
ok(!(dEnums.value_transitions_add.presagio_status || []).some(p => p[0] === 'verified' && p[1] === 'active'), 'nessuna transizione inversa dichiarata');
// M8.json dichiara la stessa transizione a livello di missione
ok(M8.value_transitions.some(t => t.value_transition.name === 'presagio_status' && t.value_transition.from === 'active' && t.value_transition.to === 'verified'), 'M8.json dichiara la transizione presagio');

console.log('# authorial_timeline: dato dichiarativo, mai scritto da effetti/condizioni');
ok(M8.authorial_timeline && M8.authorial_timeline.steps && Object.keys(M8.authorial_timeline.steps).length === 8, 'authorial_timeline T0-T7 presente (8 passi)');
const timelineTokens = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
ok(timelineTokens.every(t => !operative.has(t)), 'nessun effetto/condizione referenzia T0-T7 (timeline non è stato runtime)');

console.log('# le 9 combinazioni warning × focus + derivazioni');
ok(JSON.stringify(enums.enums.warning_target) === JSON.stringify(['palmer', 'centrale', 'nessuno']), 'dominio warning_target');
ok(JSON.stringify(enums.enums.focus_destination) === JSON.stringify(['palmer', 'lago', 'diner']), 'dominio focus_destination');
let combos = 0; for (const w of enums.enums.warning_target) for (const f of enums.enums.focus_destination) combos++;
ok(combos === 9, '9 combinazioni warning×focus (' + combos + ')');
// derivazioni: palmer→maddy_action, centrale→sarah_support, nessuno→nessuna
const rh = node('m8_roadhouse');
const wPalmer = rh.choices.find(c => c.effects.some(e => e.value === 'warning_target' && e.to === 'palmer'));
const wCentr = rh.choices.find(c => c.effects.some(e => e.value === 'warning_target' && e.to === 'centrale'));
const wNess = rh.choices.find(c => c.effects.some(e => e.value === 'warning_target' && e.to === 'nessuno'));
// C8-A.1: stati NOMINALI a dominio chiuso, scritti ESPLICITAMENTE da OGNI scelta
function val(choice, name) { const e = choice.effects.find(x => x.value === name); return e ? e.to : undefined; }
ok(val(wPalmer, 'maddy_action_after_warning') === 'departure_prepared' && val(wPalmer, 'sarah_support_state') === 'none', 'palmer → maddy_action=departure_prepared, sarah_support=none');
ok(val(wCentr, 'maddy_action_after_warning') === 'none' && val(wCentr, 'sarah_support_state') === 'vice', 'centrale → maddy_action=none, sarah_support=vice');
ok(val(wNess, 'maddy_action_after_warning') === 'none' && val(wNess, 'sarah_support_state') === 'none', 'nessuno → maddy_action=none, sarah_support=none');
ok([wPalmer, wCentr, wNess].every(c => val(c, 'maddy_action_after_warning') !== undefined && val(c, 'sarah_support_state') !== undefined), 'maddy_and_sarah_states_are_typed: ogni scelta telefonica scrive ENTRAMBI (mai «non deciso»)');
ok(JSON.stringify(ENUMS.maddy_action_after_warning) === JSON.stringify(['none', 'departure_prepared']) && JSON.stringify(ENUMS.sarah_support_state) === JSON.stringify(['none', 'vice']), 'domini nominali: maddy_action [none,departure_prepared], sarah_support [none,vice]');
ok(!dEnums.booleans_allowed_add.includes('maddy_action_after_warning') && !dEnums.booleans_allowed_add.includes('sarah_support_state'), 'maddy_action/sarah_support NON più booleani (rimossi da booleans_allowed_add)');
// le 3 route partizionano focus e scrivono body_found_by coerente
const bfbByRoute = { m8_route_palmer: 'hawk', m8_route_lake: 'cooper', m8_route_diner: 'hawk' };
const focusByRoute = { m8_route_palmer: 'palmer', m8_route_lake: 'lago', m8_route_diner: 'diner' };
ROUTES.forEach(r => {
  const n = node(r);
  ok(n.conditions.some(c => c.value_is && c.value_is.name === 'focus_destination' && c.value_is.equals === focusByRoute[r]), r + ': condizione focus corretta');
  ok(effectsOf(n).some(e => e.value === 'body_found_by' && e.to === bfbByRoute[r]), r + ': body_found_by = ' + bfbByRoute[r]);
});

console.log('# pages_by_value: copertura totale del dominio');
(function () {
  function scan(o, w) {
    if (Array.isArray(o)) return o.forEach((v, i) => scan(v, w + '[' + i + ']'));
    if (o && typeof o === 'object') {
      if (o.pages_by_value && o.pages_by_value.value) {
        const v = o.pages_by_value.value, dom = ENUMS[VA[v]];
        ok(!!dom && JSON.stringify(Object.keys(o.pages_by_value.cases).sort()) === JSON.stringify(dom.slice().sort()), w + '.pages_by_value copre il dominio di ' + v);
      }
      for (const [k, val] of Object.entries(o)) scan(val, w + '.' + k);
    }
  }
  scan(M8.nodes, 'nodes');
})();
// C8-A.1 B4: letter_o_observation_source è un EFFETTO derivato (from_derivation),
// unica autorità eseguibile, non un metadato laterale né «adapter».
const disc = node('m8_discovery');
const lo = effectsOf(disc).find(e => e.value === 'letter_o_observation_source');
ok(lo && lo.from_derivation && lo.from_derivation.of === 'body_found_by' && lo.from_derivation.map.cooper === 'cooper_primary' && lo.from_derivation.map.hawk === 'hawk_preserved', 'letter_o_source_has_executable_derived_effect (from_derivation nel ritrovamento)');
ok(!disc.letter_o_observation_source_by_value, 'letter_o: nessun metadato laterale (autorità unica = l\'effetto)');

console.log('# beat E: confronti e P8');
const cmpL = node('m8_cmp_letters');
ok(cmpL.kind === 'comparison' && cmpL.comparison_completion === 'node_commit' && cmpL.result === 'LETTERS_SAME_METHOD' && !(cmpL.choices || []).length, 'cmp_letters: comparison senza scelte, node_commit');
ok(!effectsOf(cmpL).some(e => e.proposition), 'cmp_letters: nessuna proposizione (solo nota metodo/ordine)');
const cmpD = node('m8_cmp_diary');
ok(cmpD.kind === 'comparison' && cmpD.role === 'proposition' && cmpD.rules.attempt_scope === 'comparison', 'cmp_diary: comparison, tentativi per-comparison');
const dA = cmpD.choices.find(c => c.id === 'diary_a'), dB = cmpD.choices.find(c => c.id === 'diary_b'), dC = cmpD.choices.find(c => c.id === 'diary_c');
ok(dA.effects.length === 1 && dA.effects[0].proposition === 'P8' && dA.effects[0].to === 'formulated', 'diary_a: formula P8');
ok(JSON.stringify(dA.effects[0].created_from.slice().sort()) === JSON.stringify(['E1_DIARIO', 'E3_LETTERA_R', 'E9A_LETTERA_O', 'E9B_STESSO_METODO']), 'P8: created_from dal doppio confronto (lettere+diario)');
ok(dB.retry === true && !dB.effects && dC.retry === true && !dC.effects, 'diary_b/c: retry, nessun effetto (respinte nel merito)');
ok(cmpD.completion_when && cmpD.completion_when.proposition_path === 'P8.formulation.status' && cmpD.completion_when.equals === 'formulated', 'cmp_diary: completion_when = P8 formulated');
// P8 factual ceiling ≤ corroborated (chi resta ignoto); P7 ipotesi
ok(propositions.P8.factual_ceiling === 'corroborated', 'P8 factual_ceiling = corroborated (chi resta ignoto)');
ok(propositions.P7.hypothesis === true, 'P7 resta ipotesi (non-procedurale)');
ok(!!dProp.ui_short_add.P8 && !!dProp.ui_short_add.P7, 'diff-propositions: ui_short su P8/P7');
ok(!!dEvid.ui_origin_add.E9A_LETTERA_O && !!dEvid.ui_origin_add.E9B_STESSO_METODO, 'diff-evidence: ui_origin su E9A/E9B');

console.log('# C8-A.1: contratto di esecuzione (movimento, completamento, repeat, condizionali)');
// B1: le scelte del crocevia NON hanno goto-world (la destinazione si CAMMINA)
const fc = node('m8_focus_choice');
ok(fc.choices.every(c => !c.goto), 'focus_choices_have_no_world_goto (nessun goto: la route si cammina)');
// la route scelta è una world-root gated dal valore focus_destination
ROUTES.forEach(r => { const n = node(r); ok(n.channel === 'world' && n.conditions.some(c => c.value_is && c.value_is.name === 'focus_destination'), r + ': world-root gated da focus_destination (chosen_route_available dopo il cammino)'); });
// B5: il completamento NON precede l'indagine — richiede la stazione conclusa
ok(JSON.stringify(M8.completion.when) === JSON.stringify({ node_done: 'm8_station' }), 'completion_requires_station_done (mai maddy_trovata da solo — che precede P8/stazione/M9)');
// B6: il repeat della stazione è RAGGIUNGIBILE — nessuna guardia not node_done su m8_station
const st = node('m8_station');
ok(!st.conditions.some(c => c.not && c.not.node_done === 'm8_station'), 'station: nessuna guardia not-node_done (il repeat sarebbe irraggiungibile)');
ok(!!st.repeat && st.mandatory_beat === true, 'station_repeat presente (il runtime restituisce il repeat al 2° accesso)');
ok(!(st.repeat.effects) && st.repeat.mode === 'dialogue' && st.repeat.speaker_id === 'cooper' &&
  /lago/i.test(st.repeat.text) && /scena|sentiero/i.test(st.repeat.text),
  'station_repeat_writes_no_state (battuta COOPER specifica del lago)');
// B3: pagine condizionali della valigia (congelate in prepareNode — dichiarato in schema-delta §3)
function condPages(n) { const out = []; (function w(o) { if (Array.isArray(o)) return o.forEach(w); if (o && typeof o === 'object') { if (o.id && o.text !== undefined && o.mode && o.condition) out.push(o); for (const k in o) w(o[k]); } })(n); return out; }
const cpRoute = condPages(node('m8_route_palmer'));
ok(cpRoute.length === 1 && JSON.stringify(cpRoute[0].condition) === JSON.stringify({ value_is: { name: 'warning_target', equals: 'palmer' } }), 'valigia in C (route_palmer): condizione warning=palmer');
const cpStation = condPages(st);
ok(cpStation.length === 1 && cpStation[0].condition.all && cpStation[0].condition.all.some(c => c.value_is && c.value_is.equals === 'palmer') && cpStation[0].condition.all.some(c => c.not && c.not.value_is && c.not.value_is.name === 'focus_destination'), 'valigia in F (station): condizione warning=palmer ∧ focus≠palmer');
ok(cpRoute[0].id === 'm8.c.route_palmer.p02' && cpStation[0].id === 'm8.f.station.p_valigia', 'conditional_pages: le due pagine valigia hanno un `condition` esplicito (congelate in prepareNode, mai al commit)');

console.log('# C8-A.2: precedenza D→E dei confronti + eco della promessa non saltabile');
// B2: il ritrovamento continua obbligatoriamente all'eco della promessa
const discN = node('m8_discovery');
ok(discN.next === 'm8_promise_echo', 'discovery_continues_to_promise_echo (m8_discovery.next = m8_promise_echo)');
const echoN = node('m8_promise_echo');
ok(echoN.mandatory_beat === true && echoN.channel === 'world', 'promise_echo resta beat obbligatorio world-root');
// i confronti del taccuino sono nascosti finché l'eco non è avvenuta (robusto anche dopo load)
const clN = node('m8_cmp_letters');
const cdN = node('m8_cmp_diary');
ok(clN.conditions.some(c => c.node_done === 'm8_promise_echo'), 'comparisons_hidden_before_promise_echo (cmp_letters gated su node_done:m8_promise_echo)');
ok(cdN.conditions.some(c => c.node_done === 'm8_promise_echo'), 'promise_echo_cannot_be_skipped_after_load (cmp_diary gated su node_done:m8_promise_echo)');
// B1: P8 non può saltare il primo confronto (R↔O): il diario è gated sul commit di cmp_letters
ok(cdN.conditions.some(c => c.node_done === 'm8_cmp_letters'), 'P8_cannot_bypass_first_comparison (cmp_diary gated su node_done:m8_cmp_letters)');
ok(!clN.conditions.some(c => c.node_done === 'm8_cmp_diary'), 'cmp_diary_hidden_before_cmp_letters (nessuna dipendenza inversa: le lettere non dipendono dal diario)');
// il diario è l'UNICO writer di P8 e resta gated: cmp_letters_commit_unlocks_cmp_diary
ok(cdN.choices.some(ch => (ch.effects || []).some(e => e.proposition === 'P8')), 'cmp_diary è l\'unico writer di P8 (a valle di cmp_letters)');

console.log('# obiettivi: esattamente uno vero in ogni combinazione raggiungibile');
const combos2 = [
  { promiseSet: false, warningSet: false, taxi: false, presagioSet: false, presagioVal: null, mt: false, p8: false, stationDone: false, expect: 'obj_m8_0' },
  { promiseSet: true, warningSet: false, taxi: false, presagioSet: false, presagioVal: null, mt: false, p8: false, stationDone: false, expect: 'obj_m8_25' },
  { promiseSet: true, warningSet: false, taxi: true, presagioSet: false, presagioVal: null, mt: false, p8: false, stationDone: false, expect: 'obj_m8_1' },
  { promiseSet: true, warningSet: true, taxi: true, presagioSet: true, presagioVal: 'active', mt: false, p8: false, stationDone: false, expect: 'obj_m8_2' },
  { promiseSet: true, warningSet: true, taxi: true, presagioSet: true, presagioVal: 'verified', mt: true, p8: false, stationDone: false, expect: 'obj_m8_3' },
  { promiseSet: true, warningSet: true, taxi: true, presagioSet: true, presagioVal: 'verified', mt: true, p8: true, stationDone: false, expect: 'obj_m8_35' },
  { promiseSet: true, warningSet: true, taxi: true, presagioSet: true, presagioVal: 'verified', mt: true, p8: true, stationDone: true, expect: 'obj_m8_4' }
];
function evalObj(c, env) {
  if (c.value_set === 'presagio_status') return env.presagioSet;
  if (c.value_set === 'promise_stance') return env.promiseSet;
  if (c.value_set === 'warning_target') return env.warningSet;
  if (c.evidence === 'T_LELAND_TAXI') return env.taxi;
  if (c.value_is && c.value_is.name === 'presagio_status') return env.presagioVal === c.value_is.equals;
  if (c.flag === 'maddy_trovata') return env.mt;
  if (c.proposition_path === 'P8.formulation.status') return c.equals === 'formulated' && env.p8;
  if (c.node_done === 'm8_station') return env.stationDone;
  if (c.not) return !evalObj(c.not, env);
  if (c.all) return c.all.every(x => evalObj(x, env));
  throw new Error('cond obj? ' + JSON.stringify(c));
}
for (const env of combos2) {
  const t = M8.objectives.filter(o => evalObj(o.when, env)).map(o => o.id);
  ok(t.length === 1 && t[0] === env.expect, 'obiettivi (' + JSON.stringify(env) + '): atteso ' + env.expect + ', trovato ' + t.join(','));
}
// B3 (C8-A.2): la «contraddizione a Truman» (→ M9) è consegnata DOPO la stazione, mai prima
const o4 = M8.objectives.find(o => o.id === 'obj_m8_4');
ok(o4.when.all.some(c => c.node_done === 'm8_station'), 'obj_m8_4_gated_after_station (l\'obiettivo M9 non è attivo prima del commit della stazione)');
const o35 = M8.objectives.find(o => o.id === 'obj_m8_35');
ok(!!o35 && o35.when.all.some(c => c.not && c.not.node_done === 'm8_station') && o35.when.all.some(c => c.proposition_path === 'P8.formulation.status'), 'obj_m8_35_directs_to_station (obiettivo intermedio: P8 formulata, stazione non ancora fatta)');
ok(!evalObj(o4.when, { mt: true, p8: true, stationDone: false }) && evalObj(o4.when, { mt: true, p8: true, stationDone: true }), 'station_objective_not_active_before_commit (matrice C8-D)');
ok(M8.objectives.find(o => o.id === 'obj_m8_4').text === 'Porta a Truman una contraddizione che regga.', 'obj_m8_4: testo esatto Lock §9-F');
ok(M8.objectives.find(o => o.id === 'obj_m8_2').text === 'Torna all’incrocio: casa Palmer, lago o diner.', 'obj_m8_2: istruzione post-taxi nomina le tre destinazioni azionabili');
ok(M8.objectives.every(o => !!o.provenance_note), 'ogni obiettivo dichiara la provenienza');

console.log('# C8-A.3: obiettivo d\'ingresso azionabile + contratto valigia + coerenza documentale');
// B1: l'obiettivo d'ingresso punta a una root DAVVERO disponibile all'ingresso
// stato d'ingresso: atto4 true, nessun valore scritto, nessun flag, nessun nodo concluso
function nodeCondAtEntry(c) {
  if (c.value_set) return false;              // nessun valore ancora scritto
  if (c.value_is) return false;               // idem
  if (c.flag) return c.flag === 'atto4';      // solo l'entry gate è vero
  if (c.node_done) return false;              // nessun nodo concluso
  if (c.evidence) return false;               // nessuna evidenza raccolta
  if (c.proposition_path) return false;       // nessuna proposizione formulata
  if (c.not) return !nodeCondAtEntry(c.not);
  if (c.all) return c.all.every(nodeCondAtEntry);
  if (c.any) return c.any.some(nodeCondAtEntry);
  return false;
}
function nodeAvailableAtEntry(id) { const n = node(id); return (n.conditions || []).every(nodeCondAtEntry); }
const entryEnv = { promiseSet: false, presagioSet: false, presagioVal: null, mt: false, p8: false, stationDone: false };
const entryActive = M8.objectives.filter(o => evalObj(o.when, entryEnv)).sort((a, b) => b.priority - a.priority);
ok(entryActive.length >= 1 && entryActive[0].id === 'obj_m8_0', 'entry_objective_points_to_actionable_root: obiettivo d\'ingresso = obj_m8_0');
ok(nodeAvailableAtEntry('m8_diner'), 'entry_objective_points_to_actionable_root: m8_diner (target di obj_m8_0) è azionabile all\'ingresso');
ok(!nodeAvailableAtEntry('m8_roadhouse'), 'entry_objective_points_to_actionable_root: m8_roadhouse NON è azionabile all\'ingresso (richiede promise_stance)');
const oj0 = M8.objectives.find(o => o.id === 'obj_m8_0');
const oj1 = M8.objectives.find(o => o.id === 'obj_m8_1');
ok(oj0 && oj1 && oj0.priority < oj1.priority, 'diner_precedes_roadhouse_in_objective_chain: obj_m8_0 (pre-diner) precede obj_m8_1 (Roadhouse) in priorità');
ok(JSON.stringify(oj1.when).indexOf('"value_set":"promise_stance"') !== -1, 'diner_precedes_roadhouse_in_objective_chain: l\'obiettivo Roadhouse richiede value_set promise_stance');
// B2: contratto valigia — visibile IFF warning=palmer (mai «in ogni percorso»)
ok(cpRoute[0].condition.value_is.equals === 'palmer' && cpStation[0].condition.all.some(c => c.value_is && c.value_is.equals === 'palmer'), 'contract_valigia_visible_iff_warning_palmer (entrambe le pagine gated su warning=palmer)');
const allInvariants = M8.nodes.map(n => n.invariant || '').join('  ');
ok(!/valigia[^]*visibile in ogni percorso/.test(allInvariants), 'json_invariants_do_not_claim_universal_valigia (nessun invariant dichiara «valigia visibile in ogni percorso»)');
ok(node('m8_station').invariant.indexOf('warning_target=palmer') !== -1, 'json_invariants_do_not_claim_universal_valigia: m8_station.invariant dichiara valigia iff warning=palmer');
// Coerenza documentale (matrice + source-map): stessa semantica dei dati
const MATRIX = fs.readFileSync(path.join(ROOT, 'schema-deltas', 'M8-validation-matrix.md'), 'utf8');
const SRCMAP = fs.readFileSync(path.join(ROOT, 'schema-deltas', 'M8-source-map.md'), 'utf8');
const SDELTA = fs.readFileSync(path.join(ROOT, 'schema-deltas', 'M8.md'), 'utf8');
ok(/entrambi i valori sono sempre scritti/.test(MATRIX) && /\biff\b/.test(MATRIX) && /altrimenti/.test(MATRIX) && !/maddy_action_after_warning` SOLO se/.test(MATRIX) && !/sarah_support_state` SOLO se/.test(MATRIX), 'matrix_nominal_states_use_explicit_none (stati nominali: «iff … none altrimenti», mai «SOLO se»)');
ok(/commit del nodo Roadhouse/.test(MATRIX) && !/active dopo la scelta\)/.test(MATRIX), 'matrix_presagio_timing_matches_node_commit (presagio active al commit del nodo, mai «dopo la scelta»)');
ok(/50→250→100→200→300→350→400/.test(MATRIX), 'matrix_objective_chain_matches_json (catena raggiungibile documentata)');
const prioSet = M8.objectives.map(o => o.priority).sort((a, b) => a - b).join(',');
ok(prioSet === '50,100,200,250,300,350,400', 'matrix_objective_chain_matches_json: priorità JSON = 50,100,200,250,300,350,400 (' + prioSet + ')');
ok(!/valigia\/biglietto visibile in ogni percorso/.test(MATRIX) && !/valigia\/biglietto visibile in ogni percorso/.test(SDELTA), 'contract_valigia_visible_iff_warning_palmer: matrice/schema-delta non dichiarano «valigia visibile in ogni percorso»');
const inSituOcc = (SRCMAP.match(/in_situ solo se Cooper primo/g) || []).length;
const inSituNeg = (SRCMAP.match(/nessun\s+«in_situ solo se Cooper primo»/g) || []).length;
ok(/letter_o_chain=standard/.test(SRCMAP) && inSituOcc === inSituNeg, 'source_map_uses_consolidated_bible (letter_o_chain=standard; ogni «in_situ solo se Cooper primo» è negato, ' + inSituNeg + '/' + inSituOcc + ')');
ok(/sarah_support_state/.test(SRCMAP) && !/pages_by_value su warning_target; obiettivo/.test(SRCMAP), 'source_map_station_uses_sarah_support_state');
ok(['obj_m8_0', 'obj_m8_1', 'obj_m8_25', 'obj_m8_3', 'obj_m8_35'].every(id => SRCMAP.indexOf(id) !== -1), 'source_map_declares_all_noncanonical_objectives (incluso taxi pre-ritrovamento)');
ok(/World & Story Bible v1\.0/.test(SRCMAP) && /[Aa]utorità condivisa corrente/.test(SRCMAP), 'source_map_names_world_story_bible_v1_as_current_authority');
ok(/[Nn]ota storica/.test(SRCMAP) && /v0\.9\.1[^]*?(storica|provenienza)/.test(SRCMAP), 'source_map_marks_bible_v0_9_1_as_historical_only');

console.log('# binding, kind, node_done, conteggio');
for (const n of M8.nodes.filter(n => n.channel === 'world')) {
  ok(!!n.map_id && !!n.target_kind && !!n.target_id, n.id + ': binding world completo');
  ok(['actor', 'object', 'landmark', 'sign'].includes(n.target_kind), n.id + ': target_kind valido');
  ok(n.x === undefined && n.y === undefined, n.id + ': nessuna coordinata');
  if (n.target_kind === 'actor') ok(!!n.actor_id, n.id + ': actor target con actor_id');
}
const KINDS = ['dialogue', 'choice', 'comparison'];
for (const n of M8.nodes) ok(KINDS.includes(n.kind), n.id + ': kind nello schema (' + n.kind + ')');
ok(M8.node_count.runtime_total === M8.nodes.length && M8.nodes.length === 12, 'node_count == nodi reali == 12 (' + M8.nodes.length + ')');

console.log('# M4/M5/M6 invariati: i diff solo AGGIUNGONO');
ok(Object.keys(dEvid.ui_origin_add).every(k => k.indexOf('E9') === 0 && evidence[k]), 'diff-evidence tocca SOLO E9A/E9B');
ok(Object.keys(dProp.ui_short_add).every(k => k === 'P7' || k === 'P8'), 'diff-propositions tocca SOLO P7/P8');
ok(dEnums.booleans_allowed_add.every(b => !enums.booleans_allowed.includes(b)), 'diff-state-enums: booleani nuovi (maddy_action/sarah_support) non già presenti');
ok(M6.node_count && M6.node_count.runtime_total === 12 && M5.node_count.runtime_total === 13, 'M5 (13) / M6 (12, incluso ponte atto4) coerenti');

console.log('');
if (failures === 0) { console.log(checks + ' controlli statici M8 superati ✔ (proposta C8-A — copertura dinamica in C8-B); ' + m8pages + ' pagine M8, ' + M8.nodes.length + ' nodi'); process.exit(0); }
console.error(failures + ' fallimenti su ' + checks);
process.exit(1);
