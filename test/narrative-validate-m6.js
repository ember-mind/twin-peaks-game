/* test/narrative-validate-m6.js — C6-A: validazione STATICA della proposta M6.
 *
 * Perimetro dichiarato: C6-A è DATA-ONLY. Il runtime NON è esteso (m6_tactic come
 * valore tipizzato, milestone con pending_when, la condizione «P5 formulata» via
 * proposition_path/equals — primitiva ESISTENTE, non nuova —, feedback_pages_by_value
 * risolto in prepareChoice sono PROPOSTE in narrative/schema-deltas/M6.md).
 * Questo validatore prova tutto ciò che è provabile senza eseguire i nuovi
 * costrutti: fedeltà al Lock §5, provenienza, registro pagine globale (M4+M5+M6),
 * igiene participant-facing, writer unici, le tre tattiche davvero diverse sui 7
 * assi, partizione degli obiettivi a tabella di verità, nessun murder_*, nessun
 * cambio tattica. La copertura DINAMICA (M6-validation-matrix.md) sarà eseguita
 * DAL runtime esteso in C6-B — mai da una simulazione parallela.
 * node test/narrative-validate-m6.js */
'use strict';
const fs = require('fs');
const path = require('path');

let checks = 0, failures = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; console.error('  ✗ ' + msg); } }

const ROOT = path.join(__dirname, '..', 'narrative');
const M4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M4.json'), 'utf8'));
const M5 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M5.json'), 'utf8'));
const M6 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M6.json'), 'utf8'));
const enums = JSON.parse(fs.readFileSync(path.join(ROOT, 'state-enums.json'), 'utf8'));
const evidence = JSON.parse(fs.readFileSync(path.join(ROOT, 'evidence.json'), 'utf8')).evidence;
const propositions = JSON.parse(fs.readFileSync(path.join(ROOT, 'propositions.json'), 'utf8')).propositions;
const dEnums = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema-deltas', 'diff-state-enums-M6.json'), 'utf8'));
const dEvid = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema-deltas', 'diff-evidence-M6.json'), 'utf8'));
const dProp = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema-deltas', 'diff-propositions-M6.json'), 'utf8'));

const BRANCHES = ['m6_interrogation_prova', 'm6_interrogation_pressione', 'm6_interrogation_falsa'];
function node(id) { return M6.nodes.find(n => n.id === id); }
// tutti gli effetti di un nodo (nodo + scelte + feedback per-valore non producono effetti)
function effectsOf(n) {
  const effs = [].concat(n.effects || []);
  (n.choices || []).forEach(c => effs.push(...(c.effects || [])));
  return effs;
}
// C6-A.1: la formulazione di P5 si esprime con la condizione GENERICA già usata in
// M4/M5 (proposition_path/equals), non con un operatore inventato.
function isP5Formulated(c) { return c && c.proposition_path === 'P5.formulation.status' && c.equals === 'formulated'; }

console.log('# autorità canonica e provenienza');
ok(M6.source.document === 'M5-M6 v1.1.1 LOCK.md', 'sorgente = Lock consolidato');
ok(M6.schema_delta === 'narrative/schema-deltas/M6.md', 'schema-delta referenziato');
for (const n of M6.nodes) {
  ok(typeof n.source_section === 'string' && n.source_section.indexOf('M6-') === 0, n.id + ': source_section M6-*');
}
ok(JSON.stringify(M6.entry_condition) === JSON.stringify({ flag: 'east_route_confirmed' }), 'gate d\'ingresso M6 = fine M5 (east_route_confirmed)');
ok(M6.completion.when.node_done === 'm6_atto4_bridge', 'completamento M6: rapporto a Truman concluso (ponte esplicito verso M8)');

console.log('# registro pagine (globale, incluso M4+M5)');
const allPages = new Map();
function collectPages(obj, src) {
  if (Array.isArray(obj)) return obj.forEach(v => collectPages(v, src));
  if (obj && typeof obj === 'object') {
    if (obj.id && obj.text !== undefined && obj.mode) {
      ok(!allPages.has(obj.id), 'page ID duplicato globalmente: ' + obj.id);
      allPages.set(obj.id, obj);
      ok(obj.mode !== 'dialogue' || !!obj.speaker_id, obj.id + ': dialogo senza speaker_id');
      if (src === 'M6') ok(obj.id.indexOf('m6.') === 0, obj.id + ': prefisso m6. stabile');
    }
    for (const v of Object.values(obj)) collectPages(v, src);
  }
}
collectPages(M4, 'M4');
collectPages(M5, 'M5');
const preCount = allPages.size;
collectPages(M6, 'M6');
const m6pages = allPages.size - preCount;
ok(m6pages > 30, 'pagine M6 registrate, uniche anche vs M4+M5 (' + m6pages + ')');

console.log('# igiene participant-facing (nessun token interno nei testi/label)');
const TOKENS = [
  'JACQUES_MIDNIGHT_CLAIM', 'JACQUES_LIST_GIVEN', 'JACQUES_THIRD_MAN_DETAIL',
  'jacques_admitted_presence', 'jacques_statement_terms_known', 'jacques_preso',
  'jacques_dead', 'jacques_testimony_lost', 'jacques_death_suspicious',
  'jacques_murder', 'm6_tactic_changed', 'night_log_no_visitor', 'm6_resource_lost', 'audrey_vista_oej',
  'audrey_indaga', 'east_route_confirmed', 'm6_tactic', 'm6_', 'm5_',
  'PRESENCE_SUPPORTED', 'ATTRIBUTION_OVERREACH', 'UNSUPPORTED_BY_TACTIC',
  'proposition_formulated', 'value_is', 'milestone_pending'
];
function eachText(fn) {
  (function walk(o, p) {
    if (Array.isArray(o)) return o.forEach((v, i) => walk(v, p + '[' + i + ']'));
    if (o && typeof o === 'object') {
      // pagine E testi del taccuino (notebook effect: {id,text} senza mode) sono a schermo
      if (typeof o.text === 'string' && o.id) fn(o.text, o.id);
      if (typeof o.label === 'string' && o.id) fn(o.label, p + '.label(' + o.id + ')');
      for (const [k, v] of Object.entries(o)) walk(v, p + '.' + k);
    }
  })(M6, 'M6');
  M6.objectives.forEach(o => fn(o.text, 'objective:' + o.id));
}
eachText((text, where) => {
  TOKENS.forEach(t => ok(text.indexOf(t) === -1, where + ': token interno nel testo (' + t + ')'));
});

console.log('# nessuna attribuzione dell\'omicidio (fuori dall\'opzione respinta di P5)');
// "ha ucciso" = asserzione di omicidio: ammessa SOLO come label dell'opzione respinta p5_killed
eachText((text, where) => {
  // ammessa SOLO come label di un'opzione RESPINTA con retry: p5_killed (P5) e
  // cards_killer (confronto carte, M6 stitch C1b) — entrambe non formulano nulla
  if (/ha ucciso/i.test(text)) ok(where.indexOf('p5_killed') >= 0 || where.indexOf('cards_killer') >= 0, where + ': asserzione d\'omicidio fuori da un\'opzione respinta');
});
// nessun testo pronuncia i flag deprecati di attribuzione
eachText((text, where) => {
  ok(text.indexOf('murder_confirmed') === -1 && text.indexOf('murder_attributed') === -1, where + ': flag di attribuzione deprecato nel testo');
});

console.log('# flag deprecati mai OPERATIVI (effetti/condizioni) — le invarianti li citano solo per documentare');
// raccoglie ogni nome di stato REFERENZIATO da un effetto o da una condizione (mai dalle stringhe-documentazione invariant/note)
const operative = new Set();
function scanConds(conds) {
  for (const c of (conds || [])) {
    if (c.flag) operative.add(c.flag);
    if (c.set) operative.add(c.set);
    if (c.value_is && c.value_is.name) operative.add(c.value_is.name);
    if (c.value_set) operative.add(c.value_set);
    if (c.proposition_path) operative.add(c.proposition_path.split('.')[0]);
    if (c.not) scanConds([c.not]);
    if (c.all) scanConds(c.all);
  }
}
for (const n of M6.nodes) {
  scanConds(n.conditions);
  for (const e of effectsOf(n)) { if (e.set) operative.add(e.set); if (e.value) operative.add(e.value); }
}
M6.objectives.forEach(o => scanConds([o.when]));
M6.milestones.forEach(m => { scanConds([m.pending_when, m.resolved_when]); });
for (const dep of ['jacques_murder_confirmed', 'jacques_murder_attributed', 'm6_tactic_changed']) {
  ok(enums.deprecated_forbidden.includes(dep), dep + ': deprecato a catalogo');
  ok(!operative.has(dep), dep + ': mai operativo in effetti/condizioni di M6');
}

console.log('# writer unici (mappa scrittura → nodi)');
function writersOf(pred) {
  const out = [];
  for (const n of M6.nodes) if (effectsOf(n).some(pred)) out.push(n.id);
  return out;
}
ok(JSON.stringify(writersOf(e => e.value === 'm6_tactic')) === '["m6_tactic"]', 'm6_tactic: unico writer = nodo tattica');
ok(JSON.stringify(writersOf(e => e.set === 'jacques_admitted_presence').sort()) === JSON.stringify(BRANCHES.slice().sort()), 'jacques_admitted_presence: scritto ESATTAMENTE dai 3 rami');
// M6 stitch C4: jacques_statement_terms_known TAGLIATO (nessun lettore) — il
// costo persistente del ramo Prova resta nella nota del taccuino, non in un flag
ok(writersOf(e => e.set === 'jacques_statement_terms_known').length === 0, 'jacques_statement_terms_known: TAGLIATO, nessuno scrittore');
ok(!enums.booleans_allowed.includes('jacques_statement_terms_known'), 'jacques_statement_terms_known: fuori dal catalogo booleani');
ok(JSON.stringify(writersOf(e => e.evidence === 'JACQUES_MIDNIGHT_CLAIM')) === '["m6_interrogation_prova"]', 'JACQUES_MIDNIGHT_CLAIM: solo Prova');
ok(JSON.stringify(writersOf(e => e.evidence === 'JACQUES_LIST_GIVEN')) === '["m6_interrogation_pressione"]', 'JACQUES_LIST_GIVEN: solo Pressione');
ok(JSON.stringify(writersOf(e => e.evidence === 'JACQUES_THIRD_MAN_DETAIL')) === '["m6_interrogation_falsa"]', 'JACQUES_THIRD_MAN_DETAIL: solo Falsa sicurezza');
ok(JSON.stringify(writersOf(e => e.proposition === 'P5')) === '["m6_p5"]', 'P5: unico writer = beat B6b (mai automatica)');
ok(JSON.stringify(writersOf(e => e.set === 'jacques_preso')) === '["m6_arrest"]', 'jacques_preso: unico writer = arresto');
ok(JSON.stringify(writersOf(e => e.set === 'jacques_dead')) === '["m6_news"]', 'jacques_dead: unico writer = notizia');
ok(JSON.stringify(writersOf(e => e.set === 'jacques_testimony_lost')) === '["m6_news"]', 'jacques_testimony_lost: unico writer = notizia');
// M6 stitch C4: m6_resource_lost FUSO in jacques_testimony_lost (unico superstite,
// letto da P9.created_from)
ok(writersOf(e => e.set === 'm6_resource_lost').length === 0, 'm6_resource_lost: FUSO in jacques_testimony_lost, nessuno scrittore');
ok(!enums.booleans_allowed.includes('m6_resource_lost'), 'm6_resource_lost: fuori dal catalogo booleani');
ok(JSON.stringify(writersOf(e => e.proposition === 'P9')) === '["m6_news"]', 'P9: unico writer = notizia');
// M6 stitch C4: night_log_no_visitor FUSO in jacques_death_suspicious, che ha ora
// un lettore reale (la variante del ponte Atto 4, m6.b9.atto4.register)
ok(writersOf(e => e.set === 'night_log_no_visitor').length === 0, 'night_log_no_visitor: FUSO in jacques_death_suspicious, nessuno scrittore');
ok(!enums.booleans_allowed.includes('night_log_no_visitor'), 'night_log_no_visitor: fuori dal catalogo booleani');
ok(JSON.stringify(M6).indexOf('m6.b9.atto4.register') >= 0, 'jacques_death_suspicious ha un lettore: la variante «registro» del ponte Atto 4');
ok(JSON.stringify(writersOf(e => e.set === 'jacques_death_suspicious')) === '["m6_hospital"]', 'jacques_death_suspicious: SOLO coda ospedale (B8b giocata)');
ok(JSON.stringify(writersOf(e => e.set === 'audrey_vista_oej')) === '["m6_audrey"]', 'audrey_vista_oej: solo nodo Audrey');
ok(writersOf(e => e.set === 'jacques_murder_confirmed' || e.set === 'jacques_murder_attributed').length === 0, 'nessun nodo scrive jacques_murder_*');
ok(JSON.stringify(writersOf(e => /^atto\d$/.test(e.set || ''))) === '["m6_atto4_bridge"]', 'atto4: unico writer M6 = ponte esplicito verso M8');
// la notizia NON scrive suspicious
ok(!effectsOf(node('m6_news')).some(e => e.set === 'jacques_death_suspicious'), 'm6_news: NON scrive jacques_death_suspicious');

console.log('# valori tipizzati e cataloghi (contro i domini)');
const VA = Object.assign({}, enums.values_allowed, dEnums.values_allowed_add);
ok(dEnums.values_allowed_add.m6_tactic === 'm6_tactic', 'delta: m6_tactic → dominio m6_tactic (valore tipizzato)');
ok(JSON.stringify(enums.enums.m6_tactic) === JSON.stringify(['prova', 'pressione', 'falsa_sicurezza']), 'dominio m6_tactic già a catalogo [prova,pressione,falsa_sicurezza]');
ok(dEnums.booleans_allowed_add.length === 0, 'delta: nessun booleano nuovo (i due proposti in C6-A sono stati tagliati in C4)');
const BOOL = enums.booleans_allowed.concat(dEnums.booleans_allowed_add);
for (const n of M6.nodes) {
  for (const e of effectsOf(n)) {
    if (e.value) {
      const dom = enums.enums[VA[e.value]];
      ok(!!dom, n.id + ': valore senza dominio ' + e.value);
      if (e.to !== undefined) ok(dom.includes(e.to), n.id + ': assegnazione fuori dominio ' + e.value + '=' + e.to);
      ok(['to', 'from_value', 'opposite_of'].some(k => e[k] !== undefined), n.id + ': effetto value senza operatore');
    }
    if (e.set) {
      ok(BOOL.includes(e.set), n.id + ': boolean non ammesso ' + e.set);
      ok(!enums.deprecated_forbidden.includes(e.set), n.id + ': scrive un flag DEPRECATO ' + e.set);
    }
    if (e.evidence) ok(evidence[e.evidence] !== undefined, n.id + ': evidenza inesistente ' + e.evidence);
    if (e.proposition) ok(propositions[e.proposition] !== undefined, n.id + ': proposizione inesistente ' + e.proposition);
  }
}
// i diff non toccano M4/M5: solo aggiunte
ok(Object.keys(dEnums.enums_add || {}).length === 0, 'diff-state-enums-M6: nessun enum nuovo (m6_tactic esiste già)');
ok(!!dEvid.ui_origin_add.JACQUES_MIDNIGHT_CLAIM && !!dEvid.ui_origin_add.JACQUES_LIST_GIVEN && !!dEvid.ui_origin_add.JACQUES_THIRD_MAN_DETAIL, 'diff-evidence-M6: ui_origin sulle 3 testimonianze');
ok(!!dProp.ui_short_add.P5 && !!dProp.ui_short_add.P9, 'diff-propositions-M6: ui_short su P5 e P9');
ok(propositions.P5 !== undefined && propositions.P9 !== undefined, 'P5 e P9 già a catalogo');
for (const ev of ['JACQUES_MIDNIGHT_CLAIM', 'JACQUES_LIST_GIVEN', 'JACQUES_THIRD_MAN_DETAIL']) ok(evidence[ev] !== undefined, ev + ' già a catalogo');

console.log('# nodo tattica (B4): una tattica, write-once, nessuna corretta');
const tac = node('m6_tactic');
ok(tac.kind === 'choice' && tac.role === 'tactic', 'm6_tactic: choice, role tactic');
ok(tac.choices.length === 3, 'tre tattiche');
ok(tac.choices.every(c => c.effects.length === 1 && c.effects[0].value === 'm6_tactic'), 'ogni scelta scrive SOLO m6_tactic');
ok(new Set(tac.choices.map(c => c.effects[0].to)).size === 3, 'tre valori distinti');
ok(tac.choices.every(c => enums.enums.m6_tactic.includes(c.effects[0].to)), 'valori dentro il dominio');
ok(tac.completion_when && tac.completion_when.value_set === 'm6_tactic', 'completion_when = value_set(m6_tactic)');
ok(!tac.choices.some(c => /good|bad|correct|right|wrong/.test(c.id)), 'nessuna tattica marcata corretta');
ok(tac.mandatory_beat !== true, 'nessun mandatory_beat sul prompt di scelta');

console.log('# tre rami: value_is esclusivo, 2 domande esclusive, ammissione');
for (const bid of BRANCHES) {
  const b = node(bid);
  const cond = (b.conditions || []).find(c => c.value_is);
  ok(cond && cond.value_is.name === 'm6_tactic', bid + ': condizione value_is su m6_tactic');
  ok(enums.enums.m6_tactic.includes(cond.value_is.equals), bid + ': tattica valida (' + (cond && cond.value_is.equals) + ')');
  const exq = (b.pages || []).filter(p => p.question && p.question.exclusive === true);
  ok(exq.length === 2, bid + ': esattamente 2 domande esclusive (' + exq.length + ')');
  ok(effectsOf(b).some(e => e.set === 'jacques_admitted_presence'), bid + ': scrive jacques_admitted_presence');
}
// i value_is dei tre rami coprono TUTTO il dominio, senza sovrapposizioni
const branchVals = BRANCHES.map(bid => node(bid).conditions.find(c => c.value_is).value_is.equals).sort();
ok(JSON.stringify(branchVals) === JSON.stringify(['falsa_sicurezza', 'pressione', 'prova']), 'i 3 rami partizionano il dominio m6_tactic');
// domande esclusive disgiunte fra i rami (per id e per testo)
const exText = {};
for (const bid of BRANCHES) exText[bid] = node(bid).pages.filter(p => p.question && p.question.exclusive).map(p => p.text);
const allExTexts = [].concat(...Object.values(exText));
ok(allExTexts.length === 6, '6 domande esclusive in totale (2×3)');
ok(new Set(allExTexts).size === 6, 'le 6 domande esclusive sono testi distinti (disgiunte fra i rami)');

console.log('# differenziazione delle tattiche sui 7 assi (contratto §6)');
const TD = M6.tactic_differentiation;
ok(JSON.stringify(TD.axes) === JSON.stringify(['exclusive_questions', 'jacques_tactic', 'own_verifiable_info', 'specific_resource', 'admission_form', 'persistent_cost', 'future_echo']), 'i 7 assi del contratto sono dichiarati');
const TAC = ['prova', 'pressione', 'falsa_sicurezza'];
for (const axis of TD.axes) {
  const vals = TAC.map(t => JSON.stringify(TD.by_tactic[t][axis]));
  ok(new Set(vals).size === 3, 'asse «' + axis + '»: i tre rami sono pairwise distinti');
}
// own_verifiable_info == l'evidenza scritta dal ramo
const infoToNode = { prova: 'm6_interrogation_prova', pressione: 'm6_interrogation_pressione', falsa_sicurezza: 'm6_interrogation_falsa' };
for (const t of TAC) {
  const info = TD.by_tactic[t].own_verifiable_info;
  ok(effectsOf(node(infoToNode[t])).some(e => e.evidence === info), t + ': own_verifiable_info (' + info + ') == evidenza scritta dal ramo');
  // le domande esclusive dichiarate esistono come pagine con question.exclusive
  const decl = TD.by_tactic[t].exclusive_questions;
  ok(decl.length === 2 && decl.every(qid => node(infoToNode[t]).pages.some(p => p.id === qid && p.question && p.question.exclusive)), t + ': exclusive_questions dichiarate == pagine-domanda del ramo');
}

console.log('# beat P5 (B6b): giocato, A/B/C, feedback per-ramo, milestone');
const p5 = node('m6_p5');
ok(p5.kind === 'choice' && p5.role === 'proposition', 'm6_p5: choice, role proposition');
ok(p5.milestone === 'milestone_p5' && p5.conditions.some(c => c.flag === 'jacques_admitted_presence'), 'm6_p5: milestone + condizione sull\'ammissione');
const pA = p5.choices.find(c => c.id === 'p5_present');
const pB = p5.choices.find(c => c.id === 'p5_killed');
const pC = p5.choices.find(c => c.id === 'p5_no_third_man');
ok(pA && pA.effects.length === 1 && pA.effects[0].proposition === 'P5' && pA.effects[0].to === 'formulated', 'A: formula P5');
ok(JSON.stringify(pA.effects[0].created_from) === JSON.stringify(['jacques_admitted_presence']), 'A: P5 created_from jacques_admitted_presence');
ok(pB && pB.retry === true && !pB.effects, 'B: retry, nessun effetto (respinta nel merito)');
ok(pC && pC.retry === true && !pC.effects, 'C: retry, nessun effetto');
ok(pC.feedback_pages_by_value && pC.feedback_pages_by_value.value === 'm6_tactic', 'C: feedback per-valore su m6_tactic');
ok(JSON.stringify(Object.keys(pC.feedback_pages_by_value.cases).sort()) === JSON.stringify(['falsa_sicurezza', 'pressione', 'prova']), 'C: feedback per-ramo copre TUTTO il dominio m6_tactic');
ok(p5.completion_when && isP5Formulated(p5.completion_when), 'm6_p5: completion_when = proposition_path P5.formulation.status=formulated (convenzione M4/M5)');
ok(p5.rules && p5.rules.attempt_scope === 'comparison' && p5.rules.track_assistance === false, 'm6_p5: tentativi per-comparison, nessuna assistenza globale');
ok(p5.mandatory_beat !== true, 'm6_p5: nessun mandatory_beat sul prompt');
// milestone
const mp5 = M6.milestones.find(m => m.id === 'milestone_p5');
ok(mp5 && isP5Formulated(mp5.resolved_when), 'milestone_p5: resolved_when = proposition_path P5 formulated, mai milestones_done');
ok(mp5.pending_when && mp5.pending_when.flag === 'jacques_admitted_presence', 'milestone_p5: pending_when = ammissione (trigger dichiarativo)');
ok(mp5.blocks.kind === 'node_prepare' && mp5.blocks.nodes.includes('m6_arrest'), 'milestone_p5: blocca la preparazione di m6_arrest');

console.log('# catena arresto → notte → notizia → Gigante → rapporto → ospedale');
ok(node('m6_arrest').conditions.some(c => isP5Formulated(c)), 'm6_arrest: preparabile solo con P5 formulata (proposition_path)');
ok(node('m6_return_night').conditions.some(c => c.flag === 'jacques_preso'), 'm6_return_night: dopo il fermo');
ok(node('m6_news').conditions.some(c => c.node_done === 'm6_return_night'), 'm6_news: SEMPRE dopo B7b (tempo percepibile)');
ok(node('m6_hospital').conditions.some(c => c.flag === 'jacques_dead') && node('m6_hospital').optional === true, 'm6_hospital: coda FACOLTATIVA dopo la notizia');
const bridge = node('m6_atto4_bridge');
ok(bridge.conditions.some(c => c.flag === 'jacques_dead') && bridge.conditions.some(c => c.flag === 'gigante1') && bridge.conditions.some(c => c.not && c.not.flag === 'atto4'),
  'm6_atto4_bridge: richiede notizia + Gigante e impedisce il replay prima di M8');
ok(JSON.stringify(effectsOf(bridge).filter(e => e.set).map(e => e.set)) === '["atto4"]', 'm6_atto4_bridge: unico effetto = atto4');
// la notizia rende la battuta per tattica
const news = node('m6_news');
ok(news.pages_by_value && JSON.stringify(Object.keys(news.pages_by_value.cases).sort()) === JSON.stringify(['falsa_sicurezza', 'pressione', 'prova']), 'm6_news: pages_by_value copre TUTTO il dominio (battuta di Cooper per tattica)');
const newsSets = effectsOf(news).filter(e => e.set).map(e => e.set).sort();
ok(JSON.stringify(newsSets) === JSON.stringify(['jacques_dead', 'jacques_testimony_lost']), 'm6_news: scrive SOLO dead + testimony_lost (resource_lost fuso in C4)');

console.log('# obiettivi: esattamente uno vero in ogni combinazione raggiungibile');
// predicati: a=jacques_admitted_presence, p=P5 formulata, preso=jacques_preso,
// dead=jacques_dead, night=m6_return_night concluso, giant=gigante1, atto4=atto4.
// Reachability: atto4→giant→dead→night→guard→preso→p→a (M6 stitch C2c: il
// passaggio dall'ospedale, `guard`, sta fra il fermo e il rapporto notturno).
const combos = [
  { a: false, p: false, preso: false, dead: false, guard: false, giant: false, atto4: false, expect: 'obj_m6_1' },
  { a: true, p: false, preso: false, dead: false, guard: false, giant: false, atto4: false, expect: 'obj_m6_2' },
  { a: true, p: true, preso: false, dead: false, guard: false, giant: false, atto4: false, expect: 'obj_m6_3' },
  { a: true, p: true, preso: true, dead: false, guard: false, night: false, giant: false, atto4: false, expect: 'obj_m6_3b' },
  { a: true, p: true, preso: true, dead: false, guard: true, night: false, giant: false, atto4: false, expect: 'obj_m6_4' },
  { a: true, p: true, preso: true, dead: false, guard: true, night: true, giant: false, atto4: false, expect: 'obj_m6_4b' },
  { a: true, p: true, preso: true, dead: true, guard: true, night: true, giant: false, atto4: false, expect: 'obj_m6_5' },
  { a: true, p: true, preso: true, dead: true, guard: true, night: true, giant: true, atto4: false, expect: 'obj_m6_6' }
];
function evalObjCond(c, env) {
  if (c.flag === 'jacques_admitted_presence') return env.a;
  if (c.flag === 'jacques_preso') return env.preso;
  if (c.flag === 'jacques_dead') return env.dead;
  if (c.flag === 'gigante1') return env.giant;
  if (c.flag === 'atto4') return env.atto4;
  if (c.node_done === 'm6_return_night') return !!env.night;
  if (c.node_done === 'm6_hospital_guard') return !!env.guard;
  if (isP5Formulated(c)) return env.p;
  if (c.not) return !evalObjCond(c.not, env);
  if (c.all) return c.all.every(x => evalObjCond(x, env));
  throw new Error('condizione obiettivo non riconosciuta: ' + JSON.stringify(c));
}
for (const env of combos) {
  const truthy = M6.objectives.filter(o => evalObjCond(o.when, env)).map(o => o.id);
  ok(truthy.length === 1 && truthy[0] === env.expect, 'obiettivi (' + JSON.stringify(env) + '): atteso ' + env.expect + ', trovato ' + truthy.join(','));
}
ok(M6.objectives.find(o => o.id === 'obj_m6_3b').text === "Passa dall'ospedale: Renault è piantonato.", 'obj_m6_3b: il gradino ospedale precede il rapporto notturno');
ok(M6.objectives.find(o => o.id === 'obj_m6_3b').priority === 350, 'obj_m6_3b: priorità 350 (fra il fermo e il rapporto)');
ok(M6.objectives.find(o => o.id === 'obj_m6_4').text === 'Torna alla centrale e chiudi il rapporto sul fermo di Renault.', 'obj_m6_4: orienta alla root Truman');
ok(M6.objectives.find(o => o.id === 'obj_m6_4b').text === "Vai da Lucy: l'ospedale è in linea.", 'obj_m6_4b: orienta alla root Lucy dopo uno squillo già visibile');
ok(node('m6_return_night').pages.some(p => p.id === 'm6.b7b.night.p04' && /telefono di Lucy squilla/.test(p.text)), 'm6_return_night: chiamata esiste nel mondo prima dell’interazione');
ok(M6.objectives.find(o => o.id === 'obj_m6_5').text === 'Torna alla stanza 315.', 'obj_m6_5: testo esatto del Lock B8');
ok(M6.objectives.find(o => o.id === 'obj_m6_6').text === 'Riferisci a Truman ciò che hai visto nella 315.', 'obj_m6_6: ponte leggibile verso M8');
ok(M6.objectives.every(o => !!o.provenance_note), 'ogni obiettivo dichiara la provenienza [L]/[N]');

console.log('# binding ambientali e kind');
for (const n of M6.nodes.filter(n => n.channel === 'world')) {
  ok(!!n.map_id && !!n.target_kind && !!n.target_id, n.id + ': binding world completo (map+kind+id)');
  ok(['actor', 'object', 'landmark', 'sign'].includes(n.target_kind), n.id + ': target_kind valido');
  ok(n.x === undefined && n.y === undefined, n.id + ': nessuna coordinata nel nodo narrativo');
}
const KINDS = ['dialogue', 'choice', 'comparison']; // comparison: confronto carte C1b, stessa forma di m5_cmp_ring
for (const n of M6.nodes) ok(KINDS.includes(n.kind), n.id + ': kind nello schema (' + n.kind + ')');

console.log('# nodes_done mai come gate narrativo (solo fisico)');
for (const n of M6.nodes) {
  for (const c of (n.conditions || [])) {
    if (c.node_done) ok(['m6_ferry', 'm6_return_night', 'm6_hospital_guard'].includes(c.node_done), n.id + ': node_done solo per il gating fisico (' + c.node_done + ')');
  }
}
// nessuna contaminazione con lo stato privato di M4 (b8_attempt_history/assistance)
for (const n of M6.nodes) {
  ok(!(n.rules && n.rules.attempt_history), n.id + ': nessun attempt_history globale (scope per-comparison)');
  ok(JSON.stringify(effectsOf(n)).indexOf('assistance') === -1, n.id + ': nessun effetto sull\'assistenza');
}

console.log('# C6-A.1: binding contro il catalogo reale del motore');
// map_id reali: estratti da maps.js (chiavi top-level, indentate 4 spazi)
const MAP_IDS = [...fs.readFileSync(path.join(__dirname, '..', 'js', 'maps.js'), 'utf8').matchAll(/^    ([a-z_0-9]+): \{$/gm)].map(m => m[1]);
const ACTOR_IDS = [...fs.readFileSync(path.join(__dirname, '..', 'js', 'chars.js'), 'utf8').matchAll(/^    ([a-z_]+): *\{/gm)].map(m => m[1]);
ok(MAP_IDS.includes('oej') && MAP_IDS.includes('sheriff') && MAP_IDS.includes('hospital'), 'catalogo mappe estratto (' + MAP_IDS.length + ' mappe)');
for (const n of M6.nodes.filter(n => n.channel === 'world')) {
  ok(MAP_IDS.includes(n.map_id), n.id + ': all_map_ids_exist_in_engine_catalog (' + n.map_id + ')');
  if (n.target_kind === 'actor') {
    ok(!!n.actor_id, n.id + ': all_actor_targets_have_actor_id (actor_id presente)');
    ok(ACTOR_IDS.includes(n.actor_id), n.id + ': actor_id è un attore reale del motore (' + n.actor_id + ')');
    ok(n.actor_id === n.target_id, n.id + ': actor_id == target_id (coerenza binding)');
  }
}

console.log('# C6-A.1: continuazione tattica→ramo (goto per valore selezionato)');
for (const c of tac.choices) {
  const val = c.effects[0].to;
  const branch = BRANCHES.map(node).find(b => b.conditions.find(x => x.value_is) && b.conditions.find(x => x.value_is).value_is.equals === val);
  ok(!!c.goto && !!branch && c.goto === branch.id, 'tactic_choice_goto_matches_selected_value: ' + c.id + ' → ' + (c.goto || '∅') + ' (atteso ' + (branch && branch.id) + ')');
}

console.log('# C6-A.1: feedback/pagine per-valore coprono il dominio m6_tactic');
(function () {
  const DOM = enums.enums.m6_tactic.slice().sort();
  function scanByValue(o, where) {
    if (Array.isArray(o)) return o.forEach((v, i) => scanByValue(v, where + '[' + i + ']'));
    if (o && typeof o === 'object') {
      for (const key of ['pages_by_value', 'feedback_pages_by_value']) {
        if (o[key] && o[key].value === 'm6_tactic') {
          ok(JSON.stringify(Object.keys(o[key].cases).sort()) === JSON.stringify(DOM), 'feedback_by_value_covers_domain: ' + where + '.' + key + ' copre m6_tactic');
        }
      }
      for (const [k, v] of Object.entries(o)) scanByValue(v, where + '.' + k);
    }
  }
  scanByValue(M6.nodes, 'nodes');
})();

console.log('# C6-A.1: nessun world-root oscura un nodo irrisolto (softlock del root contract)');
// valutatore di condizioni su uno stato simulato (le stesse primitive del runtime C6-B)
function condTrue(c, S) {
  if (c.flag !== undefined) return S.flags.has(c.flag);
  if (c.set !== undefined) return S.flags.has(c.set);
  if (c.node_done !== undefined) return S.done.has(c.node_done);
  if (c.value_set !== undefined) return S.values[c.value_set] !== undefined;
  if (c.value_is !== undefined) return S.values[c.value_is.name] === c.value_is.equals;
  if (c.proposition_path !== undefined) return c.equals === 'formulated' && S.props.has(c.proposition_path.split('.')[0]);
  if (c.not !== undefined) return !condTrue(c.not, S);
  if (c.all !== undefined) return c.all.every(x => condTrue(x, S));
  throw new Error('cond non riconosciuta nel simulatore: ' + JSON.stringify(c));
}
const worldNodes = M6.nodes.filter(n => n.channel === 'world');
const tgtKey = n => (n.map_id || '') + '::' + (n.target_kind || '') + '::' + (n.target_id || '');
function assertNoShadow(S, label) {
  const byT = {};
  for (const n of worldNodes) if ((n.conditions || []).every(c => condTrue(c, S))) (byT[tgtKey(n)] = byT[tgtKey(n)] || []).push(n.id);
  for (const k in byT) ok(byT[k].length <= 1, 'exactly_one_actionable_root_per_target: ' + label + ' — ' + byT[k].join(',') + ' su ' + k);
}
function applyNode(S, nid, eff) {
  for (const e of (eff || node(nid).effects || [])) {
    if (e.set) S.flags.add(e.set);
    if (e.value) S.values[e.value] = e.to;
    if (e.proposition && e.to === 'formulated') S.props.add(e.proposition);
  }
  S.done.add(nid);
}
const branchOf = { prova: 'm6_interrogation_prova', pressione: 'm6_interrogation_pressione', falsa_sicurezza: 'm6_interrogation_falsa' };
let simStates = 0;
for (const t of ['prova', 'pressione', 'falsa_sicurezza']) for (const aud of [false, true]) for (const hosp of [false, true]) {
  const S = { flags: new Set(['east_route_confirmed']), values: {}, done: new Set(), props: new Set() };
  if (aud) S.flags.add('audrey_indaga');
  const seq = [['m6_ferry']];
  if (aud) seq.push(['m6_audrey']);
  seq.push(['m6_tactic', [{ value: 'm6_tactic', to: t }]]);
  seq.push([branchOf[t]]);
  seq.push(['m6_p5', [{ proposition: 'P5', to: 'formulated' }]]);
  seq.push(['m6_arrest'], ['m6_hospital_guard'], ['m6_return_night'], ['m6_news']);
  if (hosp) seq.push(['m6_hospital']);
  seq.push(['m6_atto4_bridge']);
  const lbl = t + '/aud' + aud + '/hosp' + hosp;
  assertNoShadow(S, lbl + ' @start'); simStates++;
  for (const [nid, eff] of seq) {
    if (nid === 'm6_atto4_bridge') S.flags.add('gigante1');
    ok((node(nid).conditions || []).every(c => condTrue(c, S)), 'progress: ' + nid + ' azionabile quando atteso (' + lbl + ')');
    applyNode(S, nid, eff);
    assertNoShadow(S, lbl + ' dopo ' + nid); simStates++;
  }
}
ok(simStates === 12 * 11, 'simulazione root-contract su tutti gli stati canonici + piantone + ponte M8 (' + simStates + ')');

console.log('# C6-A.1: M4/M5 stato e dati invariati (i diff solo AGGIUNGONO)');
ok(Object.keys(dEvid.ui_origin_add).every(k => k.indexOf('JACQUES_') === 0 && evidence[k]), 'diff-evidence tocca SOLO le testimonianze M6');
ok(Object.keys(dProp.ui_short_add).every(k => k === 'P5' || k === 'P9'), 'diff-propositions tocca SOLO P5/P9');
// C6-B: il delta è stato APPLICATO al catalogo — i booleani M6 e m6_tactic ora vivono in state-enums.json
ok(dEnums.booleans_allowed_add.every(b => enums.booleans_allowed.includes(b)), 'diff-state-enums applicato in C6-B: booleani M6 nel catalogo (additivo, M4/M5 intatti)');
ok(Object.keys(dEnums.values_allowed_add).join(',') === 'm6_tactic' && Object.keys(dEnums.enums_add || {}).length === 0, 'diff-state-enums: solo m6_tactic in values_allowed, nessun enum nuovo');
ok(M5.node_count && M5.node_count.runtime_total === 21 && M5.nodes.length === 21, 'M5 invariata (21 nodi, act-3 pass 01)');
ok(M4.mission === 'M4' && Array.isArray(M4.nodes), 'M4 presente e integra');

console.log('# C6-A.2: continuazione P5→arresto + pulizia contrattuale (semantica unica)');
ok(p5.next === 'm6_arrest', 'p5_success_has_declarative_continuation (m6_p5.next == m6_arrest)');
// una sola semantica per «P5 formulata»: proposition_formulated ammesso SOLO come voce di changelog (abolito)
const deltaTxt = fs.readFileSync(path.join(ROOT, 'schema-deltas', 'M6.md'), 'utf8');
// vietato solo l'OPERATORE vivo (`proposition_formulated`:/backtick), non il nome-gate né una frase di changelog
const livePF = deltaTxt.split('\n').filter(l => /`proposition_formulated`|proposition_formulated:/.test(l) && !/abol|superat|inventat|v1\.0|changelog|no_live/i.test(l));
ok(livePF.length === 0, 'contract_contains_no_live_proposition_formulated_operator (' + livePF.length + ' righe vive residue)');
ok(JSON.stringify(M6).indexOf('proposition_formulated') === -1, 'M6.json: nessun proposition_formulated nei dati eseguibili (solo proposition_path)');
// source-map: «centrale» come MAP-ID (in backtick `centrale`) è vietato; la parola in prosa («la centrale dello sceriffo») è ammessa
const smTxt = fs.readFileSync(path.join(ROOT, 'schema-deltas', 'M6-source-map.md'), 'utf8');
const badMapLines = smTxt.split('\n').filter(l => /`centrale`/.test(l) && !/sheriff/i.test(l));
ok(badMapLines.length === 0, 'source_map_uses_only_engine_map_ids (nessun «centrale» come mappa elencata; ' + badMapLines.length + ' righe)');
ok(/\boej\b/.test(smTxt) && /\bsheriff\b/.test(smTxt) && /\bhospital\b/.test(smTxt), 'source-map elenca le mappe reali oej/sheriff/hospital');
// tutti i map_id usati sono reali (ri-affermato con la prova diretta sul catalogo)
ok([...new Set(M6.nodes.filter(n => n.map_id).map(n => n.map_id))].every(m => MAP_IDS.includes(m)), 'ogni map_id di M6.json esiste nel catalogo del motore');

console.log('# C6-A.3: chiusura del contratto documentale (feedback in prepareChoice, obj_m6_3 allineato)');
// la sezione DEFINITORIA di feedback_pages_by_value (§3) risolve in prepareChoice, MAI in prepareNode
const sec3 = (deltaTxt.split(/^## 3\. /m)[1] || '').split(/^## 4\. /m)[0];
ok(/prepareChoice/.test(sec3), 'feedback_value_contract_uses_prepare_choice_only (§3 cita prepareChoice)');
ok(!/prepareNode/.test(sec3), 'feedback_value_contract_contains_no_prepare_node_selection (§3 senza direttiva prepareNode)');
// obj_m6_3: la source map riporta lo STESSO testo di M6.json (una sola autorità), nessun testo storico superseded
const obj3 = M6.objectives.find(o => o.id === 'obj_m6_3').text;
ok(smTxt.indexOf(obj3) >= 0, 'source_map_obj_m6_3_matches_mission_json (testo della source map == M6.json)');
ok(smTxt.indexOf('Procedi al fermo') === -1, 'source_map_obj_m6_3_matches_mission_json (nessun testo storico «Procedi al fermo» residuo)');

console.log('# conteggio nodi e completamento');
ok(M6.node_count.runtime_total === M6.nodes.length && M6.nodes.length === 17, 'node_count dichiarato == nodi reali == 17 (' + M6.nodes.length + ')');
ok(BRANCHES.every(b => !!node(b)) && !!node('m6_p5') && !!node('m6_arrest') && !!node('m6_return_night') && !!node('m6_news') && !!node('m6_atto4_bridge') && !!node('m6_hospital'), 'nodi chiave esistono (3 rami + P5 + arresto + notte + notizia + ponte M8 + ospedale)');

console.log('');
if (failures === 0) { console.log(checks + ' controlli statici M6 superati ✔ (proposta C6-A — copertura dinamica in C6-B); ' + m6pages + ' pagine M6 registrate, ' + M6.nodes.length + ' nodi'); process.exit(0); }
console.error(failures + ' fallimenti su ' + checks);
process.exit(1);
