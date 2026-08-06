/* test/narrative-validate-m5.js — C5-A: validazione STATICA della proposta M5.
 *
 * Perimetro dichiarato: il runtime NON è ancora esteso (typed values, gruppi,
 * milestone, pages_by_value sono PROPOSTE in narrative/schema-deltas/M5.md).
 * Questo validatore prova tutto ciò che è provabile senza eseguire i nuovi
 * costrutti: fedeltà al Lock, invarianti di scrittura, igiene participant-facing,
 * coerenza di gruppi/milestone/obiettivi. La copertura DINAMICA (72 percorsi +
 * pairwise, M5-validation-matrix.md) sarà eseguita DAL runtime esteso in C5-B —
 * mai da una simulazione parallela (dottrina anti-greybox).
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
for (const n of M5.nodes) {
  ok(typeof n.source_section === 'string' && n.source_section.indexOf('M5-') === 0, n.id + ': source_section M5-*');
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
const TOKENS = ['E7A_', 'E7B_', 'E8A_', 'E8B_', 'E_SCENE', 'E5_', 'P3A', 'P3B', 'P4B', 'm5_', 'T1_', 'DELIBERATE_PLACEMENT', 'NO_ENTRY_OVERREACH', 'OWNERSHIP_OVERREACH'];
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
ok(JSON.stringify(writersOf(e => e.proposition === 'P3A')) === '["m5_cmp_ring"]', 'P3A: SOLO dal confronto');
ok(JSON.stringify(writersOf(e => e.value === 's1')) === '["m5_s1"]', 's1: unico writer = nodo S1');
ok(JSON.stringify(writersOf(e => e.set === 'east_route_confirmed')) === '["m5_report_close"]', 'east_route_confirmed: unico writer = chiusura del rapporto');
ok(writersOf(e => e.set === 'atto3').length === 0, 'nessun nodo M5 scrive flag di atto');
ok(writersOf(e => e.proposition === 'P3B').length === 0, 'P3B mai generata automaticamente (resta ipotesi)');

console.log('# valori tipizzati (contro i domini del delta)');
const VA = dEnums.values_allowed_add;
// C5-A.2: domini DISTINTI — open impossibile nel valore iniziale
ok(VA.m5_initial_theory === 'm5_initial_theory_domain' && VA.m5_final_theory === 'm5_final_theory_domain' && VA.s1 === 's1', 'delta: mapping valore→dominio (iniziale ≠ finale)');
ok(JSON.stringify(dEnums.enums_add.m5_initial_theory_domain) === JSON.stringify(['degeneration', 'staging']), 'dominio iniziale: SOLO degeneration|staging (initial_theory_open_rejected)');
ok(JSON.stringify(dEnums.enums_add.m5_final_theory_domain) === JSON.stringify(['degeneration', 'staging', 'open']), 'dominio finale: include open (final_theory_open_accepted)');
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
    }
    if (e.set) ok(enums.booleans_allowed.includes(e.set) || dEnums.booleans_allowed_add.includes(e.set), n.id + ': boolean non ammesso ' + e.set);
    if (e.evidence) ok(evidence[e.evidence] !== undefined, n.id + ': evidenza inesistente ' + e.evidence);
    if (e.proposition) ok(propositions[e.proposition] !== undefined, n.id + ': proposizione inesistente ' + e.proposition);
  }
}

console.log('# macchina della teoria (B8a/B8b, transizioni esatte del Lock)');
const tInit = M5.nodes.find(n => n.id === 'm5_theory_initial');
const tRev = M5.nodes.find(n => n.id === 'm5_theory_revision');
ok(tInit.choices.length === 2, 'B8a: due letture');
ok(tInit.choices.every(c => c.effects.length === 1 && c.effects[0].value === 'm5_initial_theory'), 'B8a: scrive SOLO la teoria iniziale');
ok(new Set(tInit.choices.map(c => c.effects[0].to)).size === 2, 'B8a: degeneration e staging distinte');
const keep = tRev.choices.find(c => c.id === 'revision_keep');
const sw = tRev.choices.find(c => c.id === 'revision_switch');
const open = tRev.choices.find(c => c.id === 'revision_open');
ok(keep.effects.length === 1 && keep.effects[0].from_value === 'm5_initial_theory', 'Mantengo: final = initial, revised NON scritto (false di default)');
ok(sw.effects.some(e => e.opposite_of === 'm5_initial_theory') && sw.effects.some(e => e.set === 'm5_theory_revised'), 'La rivedo: opposta + revised=true');
ok(open.effects.some(e => e.to === 'open') && open.effects.some(e => e.set === 'm5_theory_revised'), 'Entrambe: open + revised=true (aprire È una revisione)');
ok(tRev.conditions.some(c => c.value_set === 'm5_initial_theory'), 'la revisione esige la teoria iniziale');

console.log('# gruppi di osservazione e milestone');
const G = M5.observation_groups.groups;
const groupEvs = [].concat(G.ticket, G.ring, G.scene).sort();
ok(JSON.stringify(groupEvs) === JSON.stringify(['E7A_BIGLIETTO_TESTO', 'E7B_BIGLIETTO_POSIZIONE', 'E8A_ANELLO_POSIZIONE', 'E8B_ANELLO_SUPERFICIE', 'E_SCENE'].sort()), 'i 3 gruppi coprono ESATTAMENTE le 5 evidenze');
const obsNodes = M5.nodes.filter(n => n.observation_group);
ok(obsNodes.length === 3 && new Set(obsNodes.map(n => n.observation_group)).size === 3, 'tre nodi-osservazione, un gruppo ciascuno');
for (const n of obsNodes) {
  const evs = (n.effects || []).filter(e => e.evidence).map(e => e.evidence).sort();
  ok(JSON.stringify(evs) === JSON.stringify(G[n.observation_group].slice().sort()), n.id + ': scrive esattamente il suo gruppo');
}
const ms = M5.milestones;
ok(ms.length === 2 && ms[0].after_groups === 2 && ms[1].after_groups === 3, 'milestone dopo 2 e dopo 3');
ok(M5.nodes.some(n => n.id === ms[0].node) && M5.nodes.some(n => n.id === ms[1].node), 'i nodi-milestone esistono');
// B1 (review): la milestone si risolve dai VALORI, mai dal commit del prompt
ok(ms[0].resolved_when && ms[0].resolved_when.value_set === 'm5_initial_theory', 'milestone iniziale: resolved_when = value_set(initial) — mai milestones_done');
ok(ms[1].resolved_when && ms[1].resolved_when.value_set === 'm5_final_theory', 'milestone revisione: resolved_when = value_set(final)');
ok(ms[0].blocks.kind === 'observation_group_prepare' && ms[1].blocks.kind === 'node_prepare' && ms[1].blocks.nodes.includes('m5_report_intro'), 'blocchi: 3° gruppo dietro la teoria; rapporto dietro la revisione');
ok(tInit.conditions.some(c => c.groups_completed && c.groups_completed.gte === 2), 'teoria: condizione sui gruppi, non sulle evidenze atomiche');

console.log('# rapporto B9 (split: intro → S1 → chiusura — widget B1 davvero invariato)');
const repI = M5.nodes.find(n => n.id === 'm5_report_intro');
const repS = M5.nodes.find(n => n.id === 'm5_s1');
const repC = M5.nodes.find(n => n.id === 'm5_report_close');
ok(JSON.stringify(Object.keys(repI.pages_by_value.cases).sort()) === JSON.stringify(['degeneration', 'open', 'staging']), 'pages_by_value copre TUTTO il dominio della teoria');
ok(repI.conditions.some(c => c.value_set === 'm5_final_theory') && repI.conditions.some(c => c.groups_completed && c.groups_completed.gte === 3), 'rapporto: 3 gruppi + teoria finale');
ok(repI.next === 'm5_s1' && repI.kind === 'dialogue' && (repI.effects || []).length === 0, 'intro: dialogo puro, nessun effetto, prosegue in m5_s1');
ok(repS.kind === 'choice' && repS.channel === 'internal' && repS.exposed === false, 'm5_s1: nodo-scelta interno (mai root world)');
ok(repS.choices.length === 2 && repS.choices.every(c => c.effects.length === 1 && c.effects[0].value === 's1' && c.goto === 'm5_report_close'), 'S1: un solo valore tipizzato, due opzioni, goto comune');
ok(repS.choices.every(c => (c.feedback_pages || []).length >= 2), 'S1: entrambe le opzioni hanno pagine autoriali (both-cost, mai giudicate)');
ok(!repS.choices.some(c => /good|bad|correct/.test(c.id)), 'S1: nessun s1_good/s1_bad/ring_correct_choice');
ok(repC.kind === 'dialogue' && repC.channel === 'internal' && repC.exposed === false, 'chiusura: ramo interno');
ok((repC.effects || []).some(e => e.set === 'east_route_confirmed') && repC.pages.length === 2, 'east_route SOLO al commit del ramo di chiusura (dopo p06-p07)');
ok(!!repI.repeat && repI.repeat.id === 'm5.repeat.report', 'repeat canonico del vagone sigillato');
const rep = repI; // alias per i controlli comuni a valle

console.log('# confronto anello e confronto latente E5');
const cmp = M5.nodes.find(n => n.id === 'm5_cmp_ring');
// B3 (review): tentativi PER-COMPARISON — mai lo stato privato di M4
ok(cmp.rules.attempt_scope === 'comparison' && cmp.rules.hide_attempted_results === true && cmp.rules.track_assistance === false, 'retry policy per-comparison, assistenza M4 intoccata');
ok(cmp.choices.find(c => c.id === 'ring_a').effects[0].created_from.join(',') === 'E8A_ANELLO_POSIZIONE,E8B_ANELLO_SUPERFICIE', 'P3A: created_from esatto');
ok(cmp.choices.filter(c => c.retry).length === 2, 'B e C sono retry');
const cmpE5 = M5.nodes.find(n => n.id === 'm5_cmp_ticket_e5');
ok(cmpE5.optional === true && cmpE5.cross_mission_latency.policy === 'global_notebook_registry' && cmpE5.cross_mission_latency.dedup_by === 'node_id', 'E7A↔E5: registro globale con source_mission + dedup per node_id');
// B4 (review): confronto senza scelte → completed al node commit
ok(cmpE5.comparison_completion === 'node_commit' && cmpE5.result === 'RECURRENCE_NOT_IDENTITY', 'E7A↔E5: completion policy dichiarata (node_commit)');
ok(cmpE5.effects.length === 1 && !!cmpE5.effects[0].notebook_observation, 'E7A↔E5: produce SOLO la nota di ricorrenza');
ok(!cmpE5.effects.some(e => e.proposition), 'E7A↔E5: nessuna conferma di P4B, nessuna identità');
eachText((t, w) => ok(t.indexOf('Gerard') === -1 || w.indexOf('cmp_ticket_e5') >= 0, w + ': nessun rimando pendente a Gerard fuori dal confronto'));
ok(!M5.objectives.some(o => o.text.toLowerCase().indexOf('gerard') >= 0), 'nessun obiettivo rimanda a Gerard');

console.log('# obiettivi: esattamente uno vero in ogni combinazione raggiungibile');
// predicati: v=vagone_scoperto, f=m5_final_theory valorizzata, e=east_route_confirmed
// vincoli di raggiungibilità: e→f (l\'obiettivo OEJ arriva solo dopo il rapporto), f→v
const combos = [
  { v: false, f: false, e: false, expect: 'obj_m5_1' },
  { v: true, f: false, e: false, expect: 'obj_m5_2' },
  { v: true, f: true, e: false, expect: 'obj_m5_3' },
  { v: true, f: true, e: true, expect: 'obj_m5_4' }
];
function evalObjCond(c, env) {
  if (c.flag === 'vagone_scoperto') return env.v;
  if (c.flag === 'east_route_confirmed') return env.e;
  if (c.value_set === 'm5_final_theory') return env.f;
  if (c.not) return !evalObjCond(c.not, env);
  if (c.all) return c.all.every(x => evalObjCond(x, env));
  throw new Error('condizione obiettivo non riconosciuta: ' + JSON.stringify(c));
}
for (const env of combos) {
  const truthy = M5.objectives.filter(o => evalObjCond(o.when, env)).map(o => o.id);
  ok(truthy.length === 1 && truthy[0] === env.expect, 'obiettivi (' + JSON.stringify(env) + '): atteso ' + env.expect + ', trovato ' + truthy.join(','));
}
ok(M5.objectives.find(o => o.id === 'obj_m5_4').text === 'Segui la rotta oltre il confine: One Eyed Jacks.', 'obiettivo OEJ: testo ESATTO del Lock (la variante del contratto è segnalata in source-map)');
ok(!!M5.objectives.find(o => o.id === 'obj_m5_3').provenance_note, 'obj_m5_3: provenienza [N→L] registrata');
ok(!M5.objectives.some(o => o.text.toLowerCase().indexOf('vagone') >= 0 && o.id === 'obj_m5_1'), 'il vagone non compare nell\'obiettivo prima della scoperta');

console.log('# binding ambientali');
for (const n of M5.nodes.filter(n => n.channel === 'world')) {
  ok(!!n.map_id && !!n.target_kind && !!n.target_id, n.id + ': binding world completo (kind+id)');
  ok(['actor', 'object', 'landmark', 'sign'].includes(n.target_kind), n.id + ': target_kind valido');
  ok(n.x === undefined && n.y === undefined, n.id + ': nessuna coordinata nel nodo narrativo');
}
const kinds = new Set(M5.nodes.filter(n => n.channel === 'world').map(n => n.target_kind));
ok(kinds.has('object') && kinds.has('landmark') && kinds.has('actor') && kinds.has('sign'), 'tutti e quattro i target_kind rappresentati');

console.log('# nodes_done mai come sostituto di teoria/proposizione');
for (const n of M5.nodes) {
  for (const c of (n.conditions || [])) {
    if (c.node_done) ok(['m5_bridge', 'm5_discovery'].includes(c.node_done), n.id + ': node_done solo per il gating fisico (' + c.node_done + ')');
  }
}

console.log('# C5-A.2: completion_when, repeat_when, beat sul ramo finale');
for (const nid of ['m5_theory_initial', 'm5_theory_revision', 'm5_s1']) {
  const n = M5.nodes.find(x => x.id === nid);
  ok(!!n.completion_when && !!n.completion_when.value_set, nid + ': completion_when sul valore che il nodo esiste per produrre');
  ok(n.mandatory_beat !== true, nid + ': nessun mandatory_beat sui prompt/choice (beat solo a catena conclusa)');
}
{
  const ri = M5.nodes.find(x => x.id === 'm5_report_intro');
  ok(!!ri.repeat_when && ri.repeat_when.flag === 'east_route_confirmed', 'm5_report_intro: repeat SOLO con east_route_confirmed (repeat_when)');
  ok(ri.mandatory_beat !== true, 'm5_report_intro: beat spostato sul ramo finale');
  const rc = M5.nodes.find(x => x.id === 'm5_report_close');
  ok(rc.mandatory_beat === true, 'm5_report_close: mandatory_beat sul nodo che CONCLUDE la catena');
  const s1n = M5.nodes.find(x => x.id === 'm5_s1');
  ok(s1n.completion_when.value_set === 's1', 'm5_s1: completion_when = s1 (abort → riapre la scelta, mai il repeat)');
}

// C5-B gate: continuation esplicita — ogni goto di un choice-node con next comune
for (const n of M5.nodes.filter(n => n.next && (n.choices || []).length)) {
  ok(n.choices.every(c => c.goto === n.next), n.id + ': ogni choices[].goto == node.next (ripresa dichiarativa)');
}

console.log('# controlli aggiunti dalla revisione C5-A');
ok(M5.node_count.runtime_total === M5.nodes.length, 'node_count dichiarato == nodi reali (' + M5.nodes.length + ')');
const KINDS = ['dialogue', 'choice', 'comparison'];
for (const n of M5.nodes) ok(KINDS.includes(n.kind), n.id + ': kind nello schema (' + n.kind + ')');
// nessun nodo M5 tocca lo stato privato di M4 (controllo STRUTTURALE su
// rules/effects — gli invariant testuali possono citarne i nomi per documentare)
for (const n of M5.nodes) {
  ok(!(n.rules && n.rules.attempt_history), n.id + ': nessun attempt_history globale (scope per-comparison)');
  const effs = [].concat(n.effects || []);
  (n.choices || []).forEach(c => effs.push(...(c.effects || [])));
  ok(!effs.some(e => JSON.stringify(e).indexOf('assistance') >= 0), n.id + ': nessun effetto sull\'assistenza');
  ok(!(n.choices || []).some(c => c.retry === true) || n.rules.track_assistance === false, n.id + ': retry senza assistenza globale');
}
// i result M5 vivono nel loro scope, NON nell'enum b8 di M4
const m5results = [];
for (const n of M5.nodes) (n.choices || []).forEach(c => { if (c.result) m5results.push(c.result); });
if (M5.nodes.find(n => n.id === 'm5_cmp_ticket_e5').result) m5results.push(M5.nodes.find(n => n.id === 'm5_cmp_ticket_e5').result);
for (const r of m5results) ok(!(enums.enums.b8_attempt_result || []).includes(r), 'result M5 fuori dall\'enum b8 di M4: ' + r);
// ogni comparison senza scelte dichiara la completion policy
for (const n of M5.nodes.filter(n => n.kind === 'comparison' && !(n.choices || []).length)) {
  ok(n.comparison_completion === 'node_commit', n.id + ': comparison senza scelte con completion policy');
}
// C5-C.2 (Blocker 1): OGNI comparison (M4+M5) dichiara nei DATI il richiamo del
// confronto completato — sezione + pagina. L'adapter lo legge, non deduce dagli
// effetti (l'euristica choice-vs-node sbagliava cmp_t1_e5: P4B è formulata dagli
// effetti del NODO ma va in PROPOSIZIONI). Richiamo participant-facing = dato.
for (const M of [M4, M5]) {
  for (const n of M.nodes.filter(n => n.kind === 'comparison')) {
    const cr = n.completed_recall;
    ok(!!cr && (cr.section === 'propositions' || cr.section === 'notes') && !!cr.page && !!cr.page.id && !!cr.page.text,
      n.id + ': completed_recall dichiarato (section propositions|notes + pagina)');
  }
}
// una comparison senza scelte che formula una proposizione deve completarsi al
// commit (node_commit), altrimenti il richiamo non è mai raggiungibile
for (const n of M4.nodes.filter(n => n.kind === 'comparison' && !(n.choices || []).length)) {
  const formulatesProp = (n.effects || []).some(e => e.proposition);
  if (formulatesProp) ok(n.comparison_completion === 'node_commit', n.id + ': comparison-nodo che formula una proposizione si completa al commit');
}
// ogni milestone ha resolved_when
for (const mm of M5.milestones) ok(!!mm.resolved_when, mm.id + ': resolved_when presente');
// la migrazione del delta copre SOLO values{} (milestones_done eliminato)
const delta = fs.readFileSync(path.join(ROOT, 'schema-deltas', 'M5.md'), 'utf8');
ok(delta.indexOf('state.milestones_done') === -1 && delta.indexOf('resolved_when') >= 0, 'delta: nessun milestones_done nello STATO; risoluzione derivata (resolved_when)');
ok(delta.indexOf('values') >= 0 && delta.indexOf('1.1.0') >= 0, 'delta: migrazione 1.0.0→1.1.0 limitata a values{}');

console.log('');
if (failures === 0) { console.log(checks + ' controlli statici M5 superati ✔ (proposta C5-A v1.2 — copertura dinamica in C5-B)'); process.exit(0); }
console.error(failures + ' fallimenti su ' + checks);
process.exit(1);
