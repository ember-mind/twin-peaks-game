/* test/narrative-validate-m5.js — validazione STATICA di M5 (act-3 pass 01).
 *
 * Riferimento: narrative/schema-deltas/M5.md §10, docs/act-3-design-report.md
 * §12 (A1–A14), doctrine-audit R1/R2. La copertura DINAMICA (matrice canonica,
 * milestone, pages_by_value) è eseguita DAL runtime in test/narrative-validate.js
 * (sezione C5-B) e test/act-3-flow.js — mai da una simulazione parallela.
 * node test/narrative-validate-m5.js */
'use strict';
const fs = require('fs');
const path = require('path');

let checks = 0, failures = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; console.error('  ✗ ' + msg); } }

const ROOT = path.join(__dirname, '..', 'narrative');
const M5 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M5.json'), 'utf8'));
const M4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M4.json'), 'utf8'));
const enums = JSON.parse(fs.readFileSync(path.join(ROOT, 'state-enums.json'), 'utf8'));
const evidence = JSON.parse(fs.readFileSync(path.join(ROOT, 'evidence.json'), 'utf8')).evidence;
const propositions = JSON.parse(fs.readFileSync(path.join(ROOT, 'propositions.json'), 'utf8')).propositions;
const dEnums = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema-deltas', 'diff-state-enums.json'), 'utf8'));

console.log('# autorità canonica e provenienza');
ok(M5.source.document === 'M5-M6 v1.1.1 LOCK.md', 'sorgente = Lock consolidato');
ok(M5.schema_delta === 'narrative/schema-deltas/M5.md', 'schema-delta referenziato');
const SOURCE_SECTION_OK = /^(M5-|act-3-design-report|scene-contracts)/;
for (const n of M5.nodes) {
  ok(typeof n.source_section === 'string' && SOURCE_SECTION_OK.test(n.source_section), n.id + ': source_section riconducibile al Lock/report/contratti (' + n.source_section + ')');
}
ok(JSON.stringify(M5.entry_condition) === JSON.stringify({ all: [{ flag: 'atto3' }, { proposition_path: 'P2.social_status.accepted_by', contains: 'truman' }] }), 'entrata: atto3 + P2 accettata da Truman');

console.log('# registro pagine (globale, incluso M4)');
const allPages = new Map();
function collectPages(obj, src) {
  if (Array.isArray(obj)) return obj.forEach(v => collectPages(v, src));
  if (obj && typeof obj === 'object') {
    if (obj.id && obj.text !== undefined && obj.mode) {
      ok(!allPages.has(obj.id), 'page ID duplicato: ' + obj.id);
      allPages.set(obj.id, obj);
      ok(obj.mode !== 'dialogue' || !!obj.speaker_id, obj.id + ': dialogo senza speaker_id');
      if (src === 'M5') ok(obj.id.indexOf('m5.') === 0, obj.id + ': prefisso m5. stabile');
    }
    for (const v of Object.values(obj)) collectPages(v, src);
  }
}
collectPages(M4, 'M4');
const m4count = allPages.size;
collectPages(M5, 'M5');
ok(allPages.size > m4count + 30, 'pagine M5 registrate (' + (allPages.size - m4count) + ')');

console.log('# igiene participant-facing');
const TOKENS = ['E7A_', 'E7B_', 'E8A_', 'E8B_', 'E_SCENE', 'E_PONTE_', 'E_TRACCE_', 'E_STUFA', 'E_CARTE', 'E5_', 'P3A', 'P3B', 'P4B', 'm5_', 'T1_', 'DELIBERATE_PLACEMENT', 'NO_ENTRY_OVERREACH', 'OWNERSHIP_OVERREACH'];
function eachText(fn) {
  (function walk(o, p) {
    if (Array.isArray(o)) return o.forEach((v, i) => walk(v, p + '[' + i + ']'));
    if (o && typeof o === 'object') {
      if (typeof o.text === 'string' && o.id && o.mode) fn(o.text, o.id);
      if (typeof o.label === 'string' && o.id) fn(o.label, p + '.label(' + o.id + ')');
      for (const [k, v] of Object.entries(o)) walk(v, p + '.' + k);
    }
  })(M5, 'M5');
  M5.objectives.forEach(o => fn(o.text, 'objective:' + o.id));
}
eachText((text, where) => {
  TOKENS.forEach(t => ok(text.indexOf(t) === -1, where + ': token interno nel testo (' + t + ')'));
});

console.log('# vocabolario vietato prima del confronto (fatti non ancora tali)');
const FORBIDDEN_AS_FACT = ['posato', 'messo in scena', 'deliberat'];
eachText((text, where) => {
  const low = text.toLowerCase();
  FORBIDDEN_AS_FACT.forEach(w => {
    if (low.indexOf(w) >= 0) {
      const allowed = where.indexOf('m5.b8c.feedback.deliberate') >= 0 || where.indexOf('ring_a') >= 0;
      ok(allowed, where + ': parola-fatto «' + w + '» fuori dal confronto B8c');
    }
  });
});
// E7B non data col tempo: le pagine del mucchio non parlano di pioggia
const mound = M5.nodes.find(n => n.id === 'm5_mound');
mound.pages.forEach(pg => ok(pg.text.toLowerCase().indexOf('pioggia') === -1, 'm5_mound: nessuna datazione tramite pioggia (' + pg.id + ')'));
// nessuna pagina attribuisce la proprietà dell'anello (la scelta C è l'ERRORE, ammessa come opzione)
const ring = M5.nodes.find(n => n.id === 'm5_ring');
ring.pages.forEach(pg => ok(pg.text.indexOf('Laura') === -1, 'm5_ring: nessuna identità del proprietario (' + pg.id + ')'));
// nessuna pagina collega il cartello a Jacques come prova
eachText((text, where) => {
  if (text.indexOf('Renault') >= 0) ok(where.indexOf('m5.b9.report.p07') >= 0, where + ': Renault solo nella battuta di rotta di Truman');
});
// nessun segno di correttezza sulle teorie
eachText((text, where) => ok(text.indexOf('✔') === -1 && text.indexOf('corrett') === -1 || where.indexOf('b8c') >= 0, where + ': nessun marcatore di correttezza sulle teorie'));
// il ring_a feedback (azione) non anticipa il verdetto con parole-fatto
{
  const cmp = M5.nodes.find(n => n.id === 'm5_cmp_ring');
  const ringA = cmp.choices.find(c => c.id === 'ring_a');
  ok(ringA.feedback_pages[0].mode === 'action', 'ring_a: feedback in modalità action, non verdetto');
  const low = ringA.feedback_pages[0].text.toLowerCase();
  ['deliberata', 'collocazione', 'posato'].forEach(w => ok(low.indexOf(w) === -1, 'ring_a feedback: nessuna parola-fatto «' + w + '»'));
}

console.log('# writer unici');
function writersOf(pred) {
  const out = [];
  for (const n of M5.nodes) {
    const effs = [].concat(n.effects || []);
    (n.choices || []).forEach(c => effs.push(...(c.effects || [])));
    if (effs.some(pred)) out.push(n.id);
  }
  return out;
}
ok(JSON.stringify(writersOf(e => e.evidence === 'E7A_BIGLIETTO_TESTO')) === '["m5_mound"]', 'E7A: unico writer = mucchio');
ok(JSON.stringify(writersOf(e => e.evidence === 'E7B_BIGLIETTO_POSIZIONE')) === '["m5_mound"]', 'E7B: unico writer = mucchio');
ok(JSON.stringify(writersOf(e => e.evidence === 'E8A_ANELLO_POSIZIONE')) === '["m5_ring"]', 'E8A: unico writer = anello');
ok(JSON.stringify(writersOf(e => e.evidence === 'E8B_ANELLO_SUPERFICIE')) === '["m5_ring"]', 'E8B: unico writer = anello');
ok(JSON.stringify(writersOf(e => e.evidence === 'E_SCENE')) === '["m5_scene"]', 'E_SCENE: unico writer = B7 (mai l\'ingresso)');
ok(JSON.stringify(writersOf(e => e.evidence === 'E_PONTE_DIREZIONE')) === '["m5_bridge"]', 'E_PONTE_DIREZIONE: unico writer = ponte');
ok(JSON.stringify(writersOf(e => e.evidence === 'E_TRACCE_EST')) === '["m5_tracks_north"]', 'E_TRACCE_EST: unico writer = taglio nord');
ok(JSON.stringify(writersOf(e => e.evidence === 'E_STUFA')) === '["m5_stove"]', 'E_STUFA: unico writer = stufa');
ok(JSON.stringify(writersOf(e => e.evidence === 'E_CARTE')) === '["m5_cards"]', 'E_CARTE: unico writer = carte');
ok(JSON.stringify(writersOf(e => e.proposition === 'P3A')) === '["m5_cmp_ring"]', 'P3A: SOLO dal confronto');
ok(JSON.stringify(writersOf(e => e.value === 's1')) === '["m5_s1"]', 's1: unico writer = nodo S1');
ok(JSON.stringify(writersOf(e => e.set === 'east_route_confirmed')) === '["m5_tracks_north"]', 'east_route_confirmed: unico writer = taglio nord (mai la chiusura del rapporto)');
ok(!(M5.nodes.find(n => n.id === 'm5_report_close').effects || []).length, 'm5_report_close: nessun effetto');
ok(writersOf(e => e.set === 'atto3').length === 0, 'nessun nodo M5 scrive flag di atto');
ok(writersOf(e => e.proposition === 'P3B').length === 0, 'P3B mai generata automaticamente (resta ipotesi)');
// l'id ereditato dalla proposta precedente (nota di Cooper sulla lettura) non esiste più
const m5DataStr = JSON.stringify(M5);
ok(m5DataStr.indexOf('m5.note.cooper_reading') === -1, 'id ereditato m5.note.cooper_reading rimosso');

console.log('# valori tipizzati (contro i domini del delta)');
const VA = dEnums.values_allowed_add;
ok(VA.m5_initial_theory === 'm5_initial_theory_domain' && VA.m5_final_theory === 'm5_final_theory_domain' && VA.s1 === 's1', 'delta: mapping valore→dominio (iniziale ≠ finale)');
ok(JSON.stringify(dEnums.enums_add.m5_initial_theory_domain) === JSON.stringify(['degeneration', 'withheld']), 'dominio iniziale: SOLO degeneration|withheld (R1: mai «disposizione» alla porta)');
ok(JSON.stringify(dEnums.enums_add.m5_final_theory_domain) === JSON.stringify(['degeneration', 'staging', 'open']), 'dominio finale: include open (final_theory_open_accepted)');
ok(!(dEnums.booleans_allowed_add || []).includes('m5_theory_revised'), 'm5_theory_revised eliminato dal delta');
ok(!(enums.booleans_allowed || []).includes('m5_theory_revised'), 'm5_theory_revised eliminato dallo state-enums canonico');
for (const n of M5.nodes) {
  const effs = [].concat(n.effects || []);
  (n.choices || []).forEach(c => effs.push(...(c.effects || [])));
  for (const e of effs) {
    if (e.value) {
      const dom = (dEnums.enums_add && dEnums.enums_add[VA[e.value]]) || enums.enums[VA[e.value]];
      ok(!!dom, n.id + ': valore senza dominio ' + e.value);
      if (e.to !== undefined) ok(dom.includes(e.to), n.id + ': assegnazione fuori dominio ' + e.value + '=' + e.to);
      if (e.within) ok(e.within.every(x => dom.includes(x)) && e.within.length === 2, n.id + ': within = coppia dentro il dominio');
      ok(['to', 'from_value', 'opposite_of'].some(k => e[k] !== undefined), n.id + ': effetto value senza operatore');
      ok(e.opposite_of === undefined, n.id + ': m5_final_theory non usa più opposite_of (act-3 pass 01: to/from_value diretti)');
    }
    if (e.set) ok(enums.booleans_allowed.includes(e.set) || dEnums.booleans_allowed_add.includes(e.set), n.id + ': boolean non ammesso ' + e.set);
    if (e.evidence) ok(evidence[e.evidence] !== undefined, n.id + ': evidenza inesistente ' + e.evidence);
    if (e.proposition) ok(propositions[e.proposition] !== undefined, n.id + ': proposizione inesistente ' + e.proposition);
  }
}

console.log('# macchina della teoria: due nodi mutuamente esclusivi (m5_theory_initial → revision|first)');
const tInit = M5.nodes.find(n => n.id === 'm5_theory_initial');
const tRev = M5.nodes.find(n => n.id === 'm5_theory_revision');
const tFirst = M5.nodes.find(n => n.id === 'm5_theory_first');
ok(tInit.choices.length === 2, 'B8a: due letture');
ok(tInit.choices.every(c => c.effects.length === 1 && c.effects[0].value === 'm5_initial_theory'), 'B8a: scrive SOLO la teoria iniziale');
ok(new Set(tInit.choices.map(c => c.effects[0].to)).size === 2, 'B8a: degeneration e withheld distinte');
ok(JSON.stringify(tInit.choices.map(c => c.effects[0].to).sort()) === JSON.stringify(['degeneration', 'withheld']), 'B8a: NESSUNA opzione «staging» alla porta (R1)');
for (const [node, expectInitial] of [[tRev, 'degeneration'], [tFirst, 'withheld']]) {
  ok(node.choices.length === 3, node.id + ': tre opzioni');
  ok(node.choices.every(c => c.effects.length === 1 && c.effects[0].value === 'm5_final_theory'), node.id + ': scrive SOLO la teoria finale');
  ok(node.choices.every(c => !c.effects.some(e => e.set === 'm5_theory_revised')), node.id + ': nessun effetto m5_theory_revised');
  ok(node.conditions.some(c => c.value_is && c.value_is.name === 'm5_initial_theory' && c.value_is.equals === expectInitial), node.id + ': condizione value_is=' + expectInitial);
  ok(node.conditions.some(c => c.node_done === 'm5_mound') && node.conditions.some(c => c.node_done === 'm5_scene'), node.id + ': gate su mucchio+centro');
  ok(node.conditions.some(c => c.proposition_path === 'P3A.formulation.status' && c.equals === 'formulated'), node.id + ': gate su P3A formulata');
}
ok(tRev.choices.find(c => c.id === 'revision_keep').effects[0].from_value === 'm5_initial_theory', 'revision_keep: final = initial (from_value)');
ok(tRev.choices.find(c => c.id === 'revision_switch').effects[0].to === 'staging', 'revision_switch: final = staging');
ok(tRev.choices.find(c => c.id === 'revision_open').effects[0].to === 'open', 'revision_open: final = open');
ok(tFirst.choices.map(c => c.effects[0].to).sort().join(',') === 'degeneration,open,staging', 'm5_theory_first: copre tutto il dominio finale');
ok(!tInit.choices.some(c => /good|bad|correct/.test(c.id)) && !tRev.choices.some(c => /good|bad|correct/.test(c.id)) && !tFirst.choices.some(c => /good|bad|correct/.test(c.id)), 'nessuna opzione marcata corretta nella macchina della teoria');

console.log('# milestone (pending_when, mai after_groups)');
const ms = M5.milestones;
ok(ms.length === 2, 'due milestone: revisione (degeneration) e prima scrittura (withheld)');
for (const m of ms) {
  ok(m.after_groups === undefined && !!m.pending_when, m.id + ': pending_when (non after_groups)');
  ok(m.resolved_when && m.resolved_when.value_set === 'm5_final_theory', m.id + ': resolved_when = value_set(final)');
  ok(m.blocks && m.blocks.kind === 'node_prepare' && (m.blocks.nodes || []).includes('m5_report_intro'), m.id + ': blocca il node_prepare del rapporto');
  ok(M5.nodes.some(n => n.id === m.node), m.id + ': nodo-milestone esiste');
}
ok(ms.find(m => m.id === 'milestone_theory_revision').pending_when.all.some(c => c.value_is && c.value_is.equals === 'degeneration'), 'milestone_theory_revision: pending su initial=degeneration');
ok(ms.find(m => m.id === 'milestone_theory_first').pending_when.all.some(c => c.value_is && c.value_is.equals === 'withheld'), 'milestone_theory_first: pending su initial=withheld');

console.log('# rapporto B9 (intro → S1 → chiusura)');
const repI = M5.nodes.find(n => n.id === 'm5_report_intro');
const repS = M5.nodes.find(n => n.id === 'm5_s1');
const repC = M5.nodes.find(n => n.id === 'm5_report_close');
ok(JSON.stringify(Object.keys(repI.pages_by_value.cases).sort()) === JSON.stringify(['degeneration', 'open', 'staging']), 'pages_by_value copre TUTTO il dominio della teoria finale');
ok(repI.conditions.some(c => c.value_set === 'm5_final_theory') && repI.conditions.some(c => c.proposition_path === 'P3A.formulation.status' && c.equals === 'formulated'), 'rapporto: teoria finale ∧ P3A formulata');
ok(repI.next === 'm5_s1' && repI.kind === 'dialogue' && (repI.effects || []).length === 0, 'intro: dialogo puro, nessun effetto, prosegue in m5_s1');
ok(repS.kind === 'choice' && repS.channel === 'internal' && repS.exposed === false, 'm5_s1: nodo-scelta interno (mai root world)');
ok(repS.choices.length === 2 && repS.choices.every(c => c.effects.length === 1 && c.effects[0].value === 's1' && c.goto === 'm5_report_close'), 'S1: un solo valore tipizzato, due opzioni, goto comune');
ok(!repS.choices.some(c => /good|bad|correct/.test(c.id)), 'S1: nessun s1_good/s1_bad/ring_correct_choice');
ok(repC.kind === 'dialogue' && repC.channel === 'internal' && repC.exposed === false, 'chiusura: ramo interno');
ok(!(repC.effects || []).length && repC.pages.length === 2, 'm5_report_close: NESSUN effetto (east_route vive SOLO nel taglio nord), 2 pagine');
ok(!!repI.repeat && repI.repeat.id === 'm5.repeat.report', 'repeat canonico del vagone sigillato');
// pagine per-valore: la degenerazione contesta con memoria, mai «disposto/posato» (Truman non porge la risposta)
{
  const deg = repI.pages_by_value.cases.degeneration.map(p => p.text).join(' ');
  ok(deg.indexOf("L'hai scritta tu") >= 0, 'degeneration: Truman cita la polvere («L\'hai scritta tu»)');
  ok(deg.indexOf('Non lo so ancora') >= 0, 'degeneration: Cooper non confuta («Non lo so ancora…»)');
  ['disposto', 'disposta', 'posato'].forEach(w => ok(deg.toLowerCase().indexOf(w) === -1, 'degeneration: Truman non porge la risposta («' + w + '» assente)'));
  const stag = repI.pages_by_value.cases.staging.map(p => p.text).join(' ');
  ok(stag.indexOf('come tua') >= 0, 'staging: verbalizzata «come tua»');
}

console.log('# confronto anello e confronto latente E5');
const cmp = M5.nodes.find(n => n.id === 'm5_cmp_ring');
ok(JSON.stringify(cmp.conditions) === JSON.stringify([{ evidence: 'E8A_ANELLO_POSIZIONE' }, { evidence: 'E8B_ANELLO_SUPERFICIE' }]), 'm5_cmp_ring: conditions ESATTAMENTE [E8A, E8B] (mai groups_completed)');
ok(cmp.mandatory_beat === true, 'm5_cmp_ring: mandatory_beat (ultima osservazione obbligatoria, R1)');
ok(cmp.rules.attempt_scope === 'comparison' && cmp.rules.hide_attempted_results === true && cmp.rules.track_assistance === false, 'retry policy per-comparison, assistenza M4 intoccata');
ok(cmp.choices.find(c => c.id === 'ring_a').effects[0].created_from.join(',') === 'E8A_ANELLO_POSIZIONE,E8B_ANELLO_SUPERFICIE', 'P3A: created_from esatto');
ok(cmp.choices.find(c => c.id === 'ring_a').feedback_pages[0].mode === 'action', 'ring_a: feedback = azione, mai verdetto');
ok(cmp.choices.filter(c => c.retry).length === 2, 'B e C sono retry');
const cmpE5 = M5.nodes.find(n => n.id === 'm5_cmp_ticket_e5');
ok(cmpE5.optional === true && cmpE5.cross_mission_latency.policy === 'global_notebook_registry' && cmpE5.cross_mission_latency.dedup_by === 'node_id', 'E7A↔E5: registro globale con source_mission + dedup per node_id');
ok(cmpE5.comparison_completion === 'node_commit' && cmpE5.result === 'RECURRENCE_NOT_IDENTITY', 'E7A↔E5: completion policy dichiarata (node_commit)');
ok(cmpE5.effects.length === 1 && !!cmpE5.effects[0].notebook_observation, 'E7A↔E5: produce SOLO la nota di ricorrenza');
ok(!cmpE5.effects.some(e => e.proposition), 'E7A↔E5: nessuna conferma di P4B, nessuna identità');
eachText((t, w) => ok(t.indexOf('Gerard') === -1 || w.indexOf('cmp_ticket_e5') >= 0, w + ': nessun rimando pendente a Gerard fuori dal confronto'));
ok(!M5.objectives.some(o => o.text.toLowerCase().indexOf('gerard') >= 0), 'nessun obiettivo rimanda a Gerard');

console.log('# stufa e carte (osservazioni facoltative, pagina condizionata reciproca)');
for (const [id, otherId] of [['m5_stove', 'm5_cards'], ['m5_cards', 'm5_stove']]) {
  const n = M5.nodes.find(x => x.id === id);
  ok(n.optional === true && n.mandatory_beat !== true, id + ': facoltativo, non mandatory_beat');
  const conditional = n.pages.filter(p => !!p.condition);
  ok(conditional.length === 1 && conditional[0].condition.node_done === otherId, id + ': una pagina condizionata su node_done ' + otherId);
  ok(n.effects.length === 1 && n.effects[0].evidence === (id === 'm5_stove' ? 'E_STUFA' : 'E_CARTE'), id + ': scrive esattamente la sua evidenza');
}

console.log('# collocazioni Hawk (nodi-attore muti, nessun effetto)');
for (const id of ['m5_hawk_bridge', 'm5_hawk_door', 'm5_hawk_cut']) {
  const n = M5.nodes.find(x => x.id === id);
  ok(!!n, id + ': nodo presente');
  ok((n.effects || []).length === 0, id + ': nessun effetto (riga di collocazione, mai stato)');
  ok(n.kind === 'dialogue' && n.channel === 'world' && n.target_kind === 'actor', id + ': dialogo world su actor');
  ok(n.mandatory_beat !== true, id + ': non mandatory_beat');
}
ok(new Set(['m5_hawk_bridge', 'm5_hawk_door', 'm5_hawk_cut'].map(id => M5.nodes.find(x => x.id === id).target_id)).size === 3,
  'le tre collocazioni Hawk hanno target_id (e quindi npc.id) distinti — mai una sola entità "hawk" che si auto-rimuove');

console.log('# obiettivi: esattamente uno vero in ogni combinazione raggiungibile (7 soglie)');
ok(JSON.stringify(M5.objectives.map(o => o.priority).sort((a, b) => a - b)) === JSON.stringify([100, 200, 250, 275, 300, 350, 400]), 'priorità obiettivi ESATTAMENTE [100,200,250,275,300,350,400]');
// predicati: v=vagone_scoperto, mo=mound done, sc=scene done, p3=P3A formulata, f=final_theory scritta, s=s1 scritta, e=east_route_confirmed
const combos = [
  { v: false, mo: false, sc: false, p3: false, f: false, s: false, e: false, expect: 'obj_m5_1' },
  { v: true, mo: false, sc: false, p3: false, f: false, s: false, e: false, expect: 'obj_m5_2' },
  { v: true, mo: true, sc: true, p3: false, f: false, s: false, e: false, expect: 'obj_m5_3' },
  { v: true, mo: true, sc: true, p3: true, f: false, s: false, e: false, expect: 'obj_m5_4' },
  { v: true, mo: true, sc: true, p3: true, f: true, s: false, e: false, expect: 'obj_m5_5' },
  { v: true, mo: true, sc: true, p3: true, f: true, s: true, e: false, expect: 'obj_m5_6' },
  { v: true, mo: true, sc: true, p3: true, f: true, s: true, e: true, expect: 'obj_m5_7' }
];
function evalObjCond(c, env) {
  if (c.flag === 'vagone_scoperto') return env.v;
  if (c.flag === 'east_route_confirmed') return env.e;
  if (c.node_done === 'm5_mound') return env.mo;
  if (c.node_done === 'm5_ring') return env.mo; // ring implicato dal confronto nella matrice raggiungibile
  if (c.node_done === 'm5_scene') return env.sc;
  if (c.proposition_path === 'P3A.formulation.status' && c.equals === 'formulated') return env.p3;
  if (c.value_set === 'm5_final_theory') return env.f;
  if (c.value_set === 's1') return env.s;
  if (c.not) return !evalObjCond(c.not, env);
  if (c.all) return c.all.every(x => evalObjCond(x, env));
  throw new Error('condizione obiettivo non riconosciuta: ' + JSON.stringify(c));
}
for (const env of combos) {
  const truthy = M5.objectives.filter(o => evalObjCond(o.when, env)).map(o => o.id);
  ok(truthy.length === 1 && truthy[0] === env.expect, 'obiettivi (' + JSON.stringify(env) + '): atteso ' + env.expect + ', trovato ' + truthy.join(','));
}
ok(M5.objectives.find(o => o.id === 'obj_m5_7').text === 'Segui la rotta oltre il confine: One Eyed Jacks.', 'obiettivo OEJ: testo ESATTO del Lock');

console.log('# binding ambientali');
for (const n of M5.nodes.filter(n => n.channel === 'world')) {
  ok(!!n.map_id && !!n.target_kind && !!n.target_id, n.id + ': binding world completo (kind+id)');
  ok(['actor', 'object', 'landmark', 'sign'].includes(n.target_kind), n.id + ': target_kind valido');
  ok(n.x === undefined && n.y === undefined, n.id + ': nessuna coordinata nel nodo narrativo');
}
const kinds = new Set(M5.nodes.filter(n => n.channel === 'world').map(n => n.target_kind));
ok(kinds.has('object') && kinds.has('landmark') && kinds.has('actor') && kinds.has('sign'), 'tutti e quattro i target_kind rappresentati');
// taglio nord: due nodi mutuamente esclusivi sullo stesso target
const early = M5.nodes.find(n => n.id === 'm5_tracks_north_early');
const late = M5.nodes.find(n => n.id === 'm5_tracks_north');
ok(early.target_kind === 'landmark' && early.target_id === 'tracks_north' && late.target_kind === 'landmark' && late.target_id === 'tracks_north', 'm5_tracks_north{,_early}: stesso target (tracks_north)');
ok(JSON.stringify(early.conditions) === JSON.stringify([{ not: { value_set: 's1' } }]), 'm5_tracks_north_early: condizione ESATTA not value_set(s1)');
ok(JSON.stringify(late.conditions) === JSON.stringify([{ value_set: 's1' }]), 'm5_tracks_north: condizione ESATTA value_set(s1)');
ok(early.effects === undefined || early.effects.length === 0, 'm5_tracks_north_early: nessun effetto');

console.log('# nodes_done mai come sostituto di teoria/proposizione');
for (const n of M5.nodes) {
  for (const c of (n.conditions || [])) {
    if (c.node_done) ok(['m5_bridge', 'm5_discovery', 'm5_mound', 'm5_scene'].includes(c.node_done), n.id + ': node_done solo per il gating fisico (' + c.node_done + ')');
  }
}
// m5_s1 non ha effect_policy che dipenda da node_done: il beat di custodia si legge da s1
ok(!M5.nodes.some(n => (n.conditions || []).some(c => c.node_done === 'm5_s1')), 'm5_s1: nessuna condizione altrove su node_done m5_s1 (choice-only, si legge value_set s1)');

console.log('# completion_when, repeat_when, beat sul ramo finale');
for (const nid of ['m5_theory_initial', 'm5_theory_revision', 'm5_theory_first', 'm5_s1']) {
  const n = M5.nodes.find(x => x.id === nid);
  ok(!!n.completion_when && !!n.completion_when.value_set, nid + ': completion_when sul valore che il nodo esiste per produrre');
  ok(n.mandatory_beat !== true, nid + ': nessun mandatory_beat sui prompt/choice (beat solo a catena conclusa)');
}
ok(!!repI.repeat_when && repI.repeat_when.flag === 'east_route_confirmed', 'm5_report_intro: repeat SOLO con east_route_confirmed (repeat_when)');
ok(repI.mandatory_beat !== true, 'm5_report_intro: beat spostato sul ramo finale');
ok(repC.mandatory_beat === true, 'm5_report_close: mandatory_beat sul nodo che CONCLUDE la catena');
ok(repS.completion_when.value_set === 's1', 'm5_s1: completion_when = s1 (abort → riapre la scelta, mai il repeat)');
ok(M5.nodes.find(n => n.id === 'm5_tracks_north').mandatory_beat === true, 'm5_tracks_north: mandatory_beat (chiude la mission)');

// continuation esplicita — ogni goto di un choice-node con next comune
for (const n of M5.nodes.filter(n => n.next && (n.choices || []).length)) {
  ok(n.choices.every(c => c.goto === n.next), n.id + ': ogni choices[].goto == node.next (ripresa dichiarativa)');
}

console.log('# controlli generici (invarianti strutturali)');
ok(M5.node_count.runtime_total === M5.nodes.length, 'node_count dichiarato == nodi reali (' + M5.nodes.length + ')');
ok(M5.nodes.length === 21, 'M5: 21 nodi runtime (act-3 pass 01, incl. 3 nodi di collocazione Hawk)');
const KINDS = ['dialogue', 'choice', 'comparison'];
for (const n of M5.nodes) ok(KINDS.includes(n.kind), n.id + ': kind nello schema (' + n.kind + ')');
for (const n of M5.nodes) {
  ok(!(n.rules && n.rules.attempt_history), n.id + ': nessun attempt_history globale (scope per-comparison)');
  const effs = [].concat(n.effects || []);
  (n.choices || []).forEach(c => effs.push(...(c.effects || [])));
  ok(!effs.some(e => JSON.stringify(e).indexOf('assistance') >= 0), n.id + ': nessun effetto sull\'assistenza');
  ok(!(n.choices || []).some(c => c.retry === true) || n.rules.track_assistance === false, n.id + ': retry senza assistenza globale');
}
const m5results = [];
for (const n of M5.nodes) (n.choices || []).forEach(c => { if (c.result) m5results.push(c.result); });
if (M5.nodes.find(n => n.id === 'm5_cmp_ticket_e5').result) m5results.push(M5.nodes.find(n => n.id === 'm5_cmp_ticket_e5').result);
for (const r of m5results) ok(!(enums.enums.b8_attempt_result || []).includes(r), 'result M5 fuori dall\'enum b8 di M4: ' + r);
for (const n of M5.nodes.filter(n => n.kind === 'comparison' && !(n.choices || []).length)) {
  ok(n.comparison_completion === 'node_commit', n.id + ': comparison senza scelte con completion policy');
}
for (const M of [M4, M5]) {
  for (const n of M.nodes.filter(n => n.kind === 'comparison')) {
    const cr = n.completed_recall;
    ok(!!cr && (cr.section === 'propositions' || cr.section === 'notes') && !!cr.page && !!cr.page.id && !!cr.page.text,
      n.id + ': completed_recall dichiarato (section propositions|notes + pagina)');
  }
}
for (const n of M4.nodes.filter(n => n.kind === 'comparison' && !(n.choices || []).length)) {
  const formulatesProp = (n.effects || []).some(e => e.proposition);
  if (formulatesProp) ok(n.comparison_completion === 'node_commit', n.id + ': comparison-nodo che formula una proposizione si completa al commit');
}
for (const mm of M5.milestones) ok(!!mm.resolved_when, mm.id + ': resolved_when presente');
const delta = fs.readFileSync(path.join(ROOT, 'schema-deltas', 'M5.md'), 'utf8');
ok(delta.indexOf('state.milestones_done') === -1 && delta.indexOf('resolved_when') >= 0, 'delta: nessun milestones_done nello STATO; risoluzione derivata (resolved_when)');
ok(delta.indexOf('values') >= 0 && delta.indexOf('1.1.0') >= 0, 'delta: migrazione 1.0.0→1.1.0 limitata a values{}');
ok(delta.indexOf('Act 3 pass 01') >= 0, 'delta: documenta il pass 01 (act-3)');

console.log('');
if (failures === 0) { console.log(checks + ' controlli statici M5 superati ✔ (act-3 pass 01)'); process.exit(0); }
console.error(failures + ' fallimenti su ' + checks);
process.exit(1);
