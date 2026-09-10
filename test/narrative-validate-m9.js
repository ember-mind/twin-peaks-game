/* test/narrative-validate-m9.js — C9-A: validazione STATICA della proposta M9.
 *
 * Perimetro dichiarato: C9-A è DATA-ONLY. Il runtime NON è esteso (allegato MANUALE
 * + by_support, pagine di ramo assemblate, attachment_responses, carryover_evidence
 * sono PROPOSTE in narrative/schema-deltas/M9.md). Prova tutto ciò che è provabile
 * senza eseguire i nuovi costrutti: FEDELTÀ AL LOCK (testi verbatim letti dal file
 * del Lock), provenienza, registro pagine globale, igiene participant-facing +
 * igiene del lutto/falsa colpa/nessuna attribuzione d'omicidio, writer unici,
 * partizione degli obiettivi, condizioni d'ingresso/uscita, map_id REALI dal motore,
 * e coerenza DOCUMENTALE (schema-delta / source-map / matrice devono dire ciò che i
 * dati fanno). La copertura DINAMICA (M9-validation-matrix.md) sarà eseguita DAL
 * runtime esteso in C9-B — mai da una simulazione parallela.
 * node test/narrative-validate-m9.js */
'use strict';
const fs = require('fs');
const path = require('path');
let checks = 0, failures = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; console.error('  ✗ ' + msg); } }

const PROJ = path.join(__dirname, '..');
const ROOT = path.join(PROJ, 'narrative');
const M4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M4.json'), 'utf8'));
const M5 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M5.json'), 'utf8'));
const M6 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M6.json'), 'utf8'));
const M8 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M8.json'), 'utf8'));
const M9 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M9.json'), 'utf8'));
const enums = JSON.parse(fs.readFileSync(path.join(ROOT, 'state-enums.json'), 'utf8'));
const evidence = JSON.parse(fs.readFileSync(path.join(ROOT, 'evidence.json'), 'utf8')).evidence;
const propositions = JSON.parse(fs.readFileSync(path.join(ROOT, 'propositions.json'), 'utf8')).propositions;
const dEnums = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema-deltas', 'diff-state-enums-M9.json'), 'utf8'));
const dEvid = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema-deltas', 'diff-evidence-M9.json'), 'utf8'));
const dProp = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema-deltas', 'diff-propositions-M9.json'), 'utf8'));
const SDELTA = fs.readFileSync(path.join(ROOT, 'schema-deltas', 'M9.md'), 'utf8');
const SRCMAP = fs.readFileSync(path.join(ROOT, 'schema-deltas', 'M9-source-map.md'), 'utf8');
const MATRIX = fs.readFileSync(path.join(ROOT, 'schema-deltas', 'M9-validation-matrix.md'), 'utf8');
const MAPSJS = fs.readFileSync(path.join(PROJ, 'js', 'maps.js'), 'utf8');
const GLUEJS = fs.readFileSync(path.join(PROJ, 'js', 'glue.js'), 'utf8');
const LOCK = fs.readFileSync(path.join(PROJ, M9.source.file), 'utf8');

function node(id) { return M9.nodes.find(n => n.id === id); }
// effetti REALI di un nodo: nodo + scelte + rami di presentazione (compreso by_support)
function effectsOf(n) {
  const e = [].concat(n.effects || []);
  (n.choices || []).forEach(c => e.push(...(c.effects || [])));
  const on = (n.presentation && n.presentation.on) || {};
  for (const br of Object.values(on)) {
    e.push(...(br.effects || []));
    for (const sub of Object.values(br.by_support || {})) e.push(...(sub.effects || []));
  }
  return e;
}
function allEffects() { const o = []; M9.nodes.forEach(n => o.push(...effectsOf(n))); return o; }
const NODE_IDS = ['m9_verifica_taxi', 'm9_cmp_taxi', 'm9_present_truman', 'm9_arrivo'];

console.log('# autorità canonica e provenienza');
ok(M9.mission === 'M9' && M9.narrative_package === 'narrative-v1.0', 'missione M9, pacchetto narrative-v1.0');
ok(M9.source.document === 'M9-M10 v1.1.1 CONFESSION LOCK.md', 'sorgente = CONFESSION LOCK v1.1.1');
ok(M9.source.document === evidence.T_LELAND_TAXI.source.document && M9.source.document === evidence.D_TAXI.source.document,
  'la sorgente dichiarata coincide con quella dei due atomi a catalogo (T_LELAND_TAXI / D_TAXI)');
ok(fs.existsSync(path.join(PROJ, M9.source.file)), 'source.file punta a un file REALE del progetto (' + M9.source.file + ')');
ok(/CONFESSION LOCK/.test(LOCK) && /M9-M10 v1\.1\.1/.test(LOCK), 'il file sorgente è davvero il CONFESSION LOCK v1.1.1');
ok(M9.schema_delta === 'narrative/schema-deltas/M9.md', 'schema-delta referenziato');
for (const n of M9.nodes) ok(typeof n.source_section === 'string' && n.source_section.indexOf('M9-B') === 0, n.id + ': source_section M9-B*');
ok(JSON.stringify(M9.nodes.map(n => n.id)) === JSON.stringify(NODE_IDS), 'i 4 nodi M9: verifica B1→confronto/presentazione B2→arrivo B3');

console.log('# ingresso / uscita');
ok(JSON.stringify(M9.entry_condition) === JSON.stringify({ all: [{ flag: 'atto4' }, { node_done: 'm8_station' }, { evidence: 'T_LELAND_TAXI' }] }),
  'entrata = atto4 ∧ consegna M8 ∧ testimonianza taxi acquisita pre-ritrovamento');
ok(JSON.stringify(M8.completion.when) === JSON.stringify({ node_done: 'm8_station' }),
  'entry_condition_matches_m8_handoff: il node_done richiesto è ESATTAMENTE il completamento di M8');
ok(!JSON.stringify(M9.entry_condition).includes('atto5'), 'entrata NON gatata su atto5 (che M9 stessa scrive: sarebbe un gate che non si accende)');
ok(JSON.stringify(M9.completion.when) === JSON.stringify({ node_done: 'm9_arrivo' }), 'completamento = arrivo di Leland concluso');
ok(Array.isArray(M9.completion.sets) && M9.completion.sets.length === 0, 'il completamento non scrive flag (atto5 nasce all\'accettazione, non all\'uscita)');
ok(M9.node_count.runtime_total === M9.nodes.length && M9.nodes.length === 4, 'node_count == nodi reali == 4 (' + M9.nodes.length + ')');

console.log('# registro pagine (globale M4+M5+M6+M8+M9)');
const allPages = new Map();
function collect(o, src) {
  if (Array.isArray(o)) return o.forEach(v => collect(v, src));
  if (o && typeof o === 'object') {
    if (o.id && o.text !== undefined && o.mode) {
      ok(!allPages.has(o.id), 'page ID duplicato globalmente: ' + o.id);
      allPages.set(o.id, o);
      ok(o.mode !== 'dialogue' || !!o.speaker_id, o.id + ': dialogo senza speaker_id');
      if (src === 'M9') ok(o.id.indexOf('m9.') === 0, o.id + ': prefisso m9. stabile');
    }
    for (const v of Object.values(o)) collect(v, src);
  }
}
[M4, M5, M6, M8].forEach(m => collect(m, 'x'));
const pre = allPages.size;
collect(M9, 'M9');
const m9pages = allPages.size - pre;
ok(m9pages > 20, 'pagine M9 registrate, uniche anche vs M4+M5+M6+M8 (' + m9pages + ')');
const MODES = ['action', 'dialogue', 'notebook'];
for (const [id, p] of allPages) if (id.indexOf('m9.') === 0) ok(MODES.includes(p.mode), id + ': mode nello schema (' + p.mode + ')');

console.log('# FEDELTÀ AL LOCK: testi verbatim (letti dal file del Lock, non da una copia)');
const lockN = LOCK.replace(/\s+/g, ' ');
function verbatim(pageId, why) {
  const p = allPages.get(pageId);
  ok(!!p, 'pagina esistente: ' + pageId);
  if (!p) return;
  ok(lockN.indexOf(p.text.replace(/\s+/g, ' ')) !== -1, 'VERBATIM ' + pageId + ' (' + why + ') non trovato nel Lock');
}
[
  ['m9.b1.verifica.p01', 'taccuino: chi l\'ha vista partire'],
  ['m9.b1.verifica.p02', 'la richiesta a Lucy'],
  ['m9.b1.verifica.p03', 'la verifica di Lucy'],
  ['m9.b1.cmp_taxi.p02', 'la nota del confronto'],
  ['m9.b2.present.p01', 'apertura di Truman'],
  ['m9.b2.p6.accept.p01', 'Cooper: la partenza'],
  ['m9.b2.p6.accept.p02', 'Truman: il lutto confonde'],
  ['m9.b2.p6.accept.p04', 'Truman: la compagnia'],
  ['m9.b2.p6.accept.p05', 'Cooper: è il suo diritto'],
  ['m9.b2.p6.accept.sarah.vice', 'eco Sarah (vice)'],
  ['m9.b2.p6.accept.p06', 'Truman: lo chiamo io'],
  ['m9.b2.p6.no_corroboration.p01', 'NO_CORROBORATION'],
  ['m9.b2.p8.p01', 'VALID_BUT_NOT_PROCEDURAL'],
  ['m9.b2.p6.visione', 'la visione di Sarah'],
  ['m9.b2.p6.already_rejected', 'ALREADY_REJECTED'],
  ['m9.b3.arrivo.p01', 'arrivo: a piedi, da solo'],
  ['m9.b3.arrivo.p02', 'la grondaia'],
  ['m9.b3.arrivo.p03', 'Lucy risponde'],
  ['m9.b3.arrivo.p04', 'le partenze'],
  ['m9.b3.arrivo.p05', 'Truman ringrazia'],
  ['m9.b3.arrivo.p06', 'il centro esatto della sedia']
].forEach(([id, why]) => verbatim(id, why));
// Il repeat resta semanticamente fedele al Lock, ma la nuova regola d'interazione
// lo rende una battuta di Cooper anziché una didascalia muta.
const arrivalRepeat = allPages.get('m9.repeat.arrivo');
ok(arrivalRepeat && /panca/i.test(arrivalRepeat.text) && /cornetta/i.test(arrivalRepeat.text) &&
  /Leland/i.test(arrivalRepeat.text) && /stanza/i.test(arrivalRepeat.text),
  'Repeat M9 conserva panca/cornetta e situa Leland nella stanza');
const continuityOverride = allPages.get('m9.b2.p6.accept.p03');
ok(continuityOverride.text === 'Ha nominato la compagnia, casa Palmer e le sette. Il registro non ha la prenotazione.',
  'override di continuità: Cooper oppone dettagli dichiarati e registro, senza universalizzare il lutto');
ok(/cronologia re-lockata/.test(continuityOverride.provenance_note || '') && lockN.indexOf(continuityOverride.text) !== -1,
  'correzione di continuità re-lockata nella sorgente, mai riscrittura silenziosa');
// frammenti esatti dichiarati dal Lock §1/§3/§6 per le righe condizionali derivate
const FRAG = [
  ['m9.b2.present.eco_o.cooper', "l'ho vista io, sotto l'unghia"],
  ['m9.b2.present.eco_o.hawk', "Hawk me l'ha descritta come si descrive una ferita"],
  ['m9.b2.p6.accept.sarah.none', 'prende il cappello come si prende un peso']
];
FRAG.forEach(([id, frag]) => {
  ok(lockN.indexOf(frag) !== -1, 'frammento del Lock presente nel Lock: «' + frag + '»');
  const p = allPages.get(id);
  ok(!!p && p.text.indexOf(frag) !== -1, id + ': la riga derivata contiene il frammento esatto del Lock');
});
ok(lockN.indexOf('la valigia e il biglietto erano ancora in casa') !== -1 && lockN.indexOf('nessuna valigia viene inventata') !== -1,
  'eco valigia dichiarata dal Lock §1 (solo warning palmer; nessuna valigia inventata altrove)');
// obiettivi [L]: testo esatto
const objText = id => M9.objectives.find(o => o.id === id).text;
ok(objText('obj_m9_3') === 'Porta a Truman una contraddizione che regga.' && lockN.indexOf(objText('obj_m9_3')) !== -1,
  'obj_m9_3: testo esatto del Lock §2 (obiettivo della missione)');
ok(objText('obj_m9_4') === 'Leland Palmer è alla centrale. Decidete come parlargli.' && lockN.indexOf(objText('obj_m9_4')) !== -1,
  'obj_m9_4: testo esatto del Lock §3-B2');
ok(M9.objectives.every(o => !!o.provenance_note), 'ogni obiettivo dichiara la provenienza');

console.log('# igiene participant-facing (nessun token interno a schermo)');
const TOK = ['T_LELAND_TAXI', 'T_LELAND_MISSOULA', 'D_TAXI', 'D_REGISTRO', 'T_SARAH_VISIONE',
  'E9A_', 'E9B_', 'E3_LETTERA', 'E1_DIARIO', 'P6.', 'P7.', 'P8.', 'm9_', 'm8_',
  'letter_o_', 'sarah_support_state', 'warning_target', 'promise_stance', 'presagio_status',
  'body_found_by', 'focus_destination', 'maddy_action_after_warning',
  'acceptance_type', 'colloquio_necessario', 'factual_status', 'confirmed_as_lie',
  'SUFFICIENT_RELEVANT_SUPPORT', 'NO_CORROBORATION', 'VALID_BUT_NOT_PROCEDURAL',
  'ALREADY_REJECTED', 'NOT_YET_FORMULATED', 'TAXI_CLAIM_UNVERIFIED',
  'atto4', 'atto5', 'node_done', 'by_support', 'attachment', 'carryover_evidence',
  'material_admissions', 'm10_method', 'truman_testimony_state', 'laura_moral_presence',
  'jacques_', 'dream_face_recognized'];
function eachText(fn) {
  (function walk(o, p) {
    if (Array.isArray(o)) return o.forEach((v, i) => walk(v, p + '[' + i + ']'));
    if (o && typeof o === 'object') {
      if (typeof o.text === 'string' && o.id) fn(o.text, o.id);
      if (typeof o.label === 'string' && o.id) fn(o.label, p + '.label(' + o.id + ')');
      for (const [k, v] of Object.entries(o)) walk(v, p + '.' + k);
    }
  })(M9.nodes, 'M9.nodes');
  M9.objectives.forEach(o => fn(o.text, 'objective:' + o.id));
}
eachText((t, w) => TOK.forEach(tok => ok(t.indexOf(tok) === -1, w + ': token interno «' + tok + '»')));

console.log('# IGIENE DEL LUTTO: nessuna attribuzione d\'omicidio, nessun arresto, nessun BOB (Lock §2/§3)');
// M9 deve provare che il COLLOQUIO è necessario, mai che Leland sia l'assassino
const BANNED = [
  /assassin/i, /omicid/i, /\buccis/i, /\bha ucciso\b/i, /colpevol/i, /confess/i,
  /stato di fermo/i, /arrest/i, /manette/i, /in custodia/i,
  /\bBOB\b/, /possess(ione|o da)/i, /\bposseduto\b/i,
  // semantica RIMOSSA dal Lock §0 (la P6 «trasferta» inventata dalla v1.0)
  /trasferta/i, /garage municipale/i, /registro della contea/i,
  // falsa colpa ereditata da M8 (M9 mostra il lutto, non lo usa come accusa)
  /avresti potuto/i, /avrebbe potuto salvarla/i, /se fossi arrivato prima/i,
  /dovevi chiamare/i, /troppo tardi/i, /avresti dovuto/i, /è colpa (tua|sua)/i
];
eachText((t, w) => BANNED.forEach(re => ok(!re.test(t), w + ': frase vietata dall\'igiene M9 (' + re + ')')));
// nessuna scelta a schermo: M9 non offre opzioni fuori dalla presentazione
ok(M9.nodes.every(n => !(n.choices || []).length), 'nessun choice-node in M9 (il Lock §3 non offre alternative di formulazione)');
// nessun goto: in M9 non ci si sposta
ok(JSON.stringify(M9).indexOf('"goto"') === -1, 'no_goto_anywhere (nessuna destinazione consumata da un widget; in M9 non ci si sposta)');
// nessun `if (mission)`: nessun nodo/condizione referenzia una missione
ok(JSON.stringify(M9.nodes).indexOf('"mission"') === -1, 'nessuna condizione/effetto referenzia una missione (no if(mission) nei dati)');

console.log('# writer unici (effetti di nodo + rami di presentazione)');
function writers(pred) { const o = []; for (const n of M9.nodes) if (effectsOf(n).some(pred)) o.push(n.id); return o; }
ok(JSON.stringify(writers(e => e.evidence === 'T_LELAND_TAXI')) === '[]', 'M9 non scrive T_LELAND_TAXI retroattivamente');
const m8Writers = M8.nodes.filter(n => (n.effects || []).some(e => e.evidence === 'T_LELAND_TAXI')).map(n => n.id);
ok(JSON.stringify(m8Writers) === '["m8_leland_taxi"]', 'T_LELAND_TAXI: unico writer globale = incontro M8 pre-ritrovamento');
ok(JSON.stringify(writers(e => e.evidence === 'D_TAXI')) === '["m9_verifica_taxi"]', 'D_TAXI: unico writer = la verifica CHIESTA a Lucy');
ok(JSON.stringify(writers(e => e.proposition === 'P6')) === '["m9_cmp_taxi"]', 'P6: unico writer = il confronto');
ok(JSON.stringify(writers(e => e.set === 'atto5')) === '["m9_present_truman"]', 'atto5: unico writer = la presentazione accettata');
ok(allEffects().filter(e => e.set === 'atto5').length === 1, 'atto5 scritto UNA sola volta in tutta la missione');
// D_TAXI nasce solo dalla richiesta del player a Lucy — mai da un documento «aperto da solo»
const ver = node('m9_verifica_taxi');
ok(ver.channel === 'world' && ver.target_kind === 'actor' && ver.actor_id === 'lucy',
  'd_taxi_only_from_player_request: l\'acquisizione è un\'interazione con Lucy, non un oggetto/landmark');
ok(!/registro|bancone|scartoffi|faldone/i.test(ver.pages.map(p => p.text).join(' ')),
  'd_taxi_only_from_player_request: nessun «registro sul bancone» (registro di comodo rimosso dal Lock §8-3)');
ok(ver.conditions.some(c => c.not && c.not.evidence === 'D_TAXI'), 'm9_verifica_taxi: guardia di rientro sull\'effetto proprio');

console.log('# M9 non scrive stato tipizzato: LEGGE M8 e basta');
const eff = allEffects();
ok(eff.every(e => !e.value && !e.value_transition && !e.from_derivation), 'no_typed_value_written_in_m9 (nessun valore/transizione/derivazione)');
const bools = eff.filter(e => e.set).map(e => e.set);
ok(JSON.stringify(bools) === '["atto5"]', 'unico booleano scritto = atto5 (' + bools.join(',') + ')');
ok(enums.booleans_allowed.includes('atto5'), 'atto5 già in booleans_allowed (nessuna aggiunta di catalogo)');
ok(bools.every(b => !enums.deprecated_forbidden.includes(b)), 'nessun flag deprecato scritto');
// simboli OPERATIVI (condizioni + effetti): le note di provenienza non contano
const operative = new Set();
(function scanOperative() {
  function conds(cs) {
    for (const c of (cs || [])) {
      if (!c) continue;
      if (c.flag) operative.add(c.flag);
      if (c.evidence) operative.add(c.evidence);
      if (c.value_is) operative.add(c.value_is.name);
      if (c.value_set) operative.add(c.value_set);
      if (c.proposition_path) operative.add(c.proposition_path);
      if (c.equals) operative.add(c.equals);
      if (c.node_done) operative.add(c.node_done);
      if (c.not) conds([c.not]);
      if (c.all) conds(c.all);
      if (c.any) conds(c.any);
    }
  }
  for (const n of M9.nodes) {
    conds(n.conditions); conds(n.completion_when ? [n.completion_when] : []);
    (function pages(o) {
      if (Array.isArray(o)) return o.forEach(pages);
      if (o && typeof o === 'object') { if (o.condition) conds([o.condition]); for (const k in o) pages(o[k]); }
    })(n);
    for (const e of effectsOf(n)) { if (e.set) operative.add(e.set); if (e.value) operative.add(e.value); if (e.evidence) operative.add(e.evidence); if (e.proposition) operative.add(e.proposition); if (e.to) operative.add(e.to); }
  }
  M9.objectives.forEach(o => conds([o.when]));
  conds([M9.entry_condition, M9.completion.when]);
})();
ok(!operative.has('leland_morto') && !operative.has('leland_confessa'), 'M9 non tocca leland_morto/leland_confessa in condizioni/effetti (sono di M10)');
['material_admissions', 's3', 'm10_method', 'truman_testimony_state', 'dream_face_recognized_in_leland_scene', 'laura_moral_presence']
  .forEach(t => ok(!operative.has(t), 'nessuno stato di M10 è operativo in M9: ' + t));
// ogni evidenza/proposizione referenziata esiste (catalogo reale + diff)
const EVID = Object.assign({}, evidence, dEvid.evidence_add);
for (const n of M9.nodes) for (const e of effectsOf(n)) {
  if (e.evidence) ok(EVID[e.evidence] !== undefined, n.id + ': evidenza inesistente ' + e.evidence);
  if (e.proposition) ok(propositions[e.proposition] !== undefined, n.id + ': proposizione inesistente ' + e.proposition);
}

console.log('# eco M8: valori LETTI, domini chiusi, copertura totale');
const READS = M9.reads_only_from_m8.values;
ok(READS.length === 4, 'quattro valori M8 letti dichiarati');
const condValues = [];
(function scan(o) {
  if (Array.isArray(o)) return o.forEach(scan);
  if (o && typeof o === 'object') {
    if (o.value_is && o.value_is.name) condValues.push(o.value_is.name);
    for (const v of Object.values(o)) scan(v);
  }
})(M9.nodes);
const uniqRead = [...new Set(condValues)].sort();
ok(JSON.stringify(uniqRead) === JSON.stringify(READS.map(r => r.name).sort()),
  'i valori letti nei dati coincidono con quelli DICHIARATI (' + uniqRead.join(',') + ')');
READS.forEach(r => {
  const dom = enums.enums[enums.values_allowed[r.name]];
  ok(!!dom, r.name + ': dominio a catalogo (già in values_allowed, nessuna aggiunta)');
  ok(JSON.stringify(dom) === JSON.stringify(r.domain), r.name + ': dominio dichiarato == dominio a catalogo');
});
// copertura: pagine condizionali per valore
function condPagesFor(name) {
  const out = [];
  (function w(o) {
    if (Array.isArray(o)) return o.forEach(w);
    if (o && typeof o === 'object') {
      if (o.id && o.text !== undefined && o.mode && o.condition && JSON.stringify(o.condition).includes('"' + name + '"')) out.push(o);
      for (const k in o) w(o[k]);
    }
  })(M9.nodes);
  return out;
}
const loPages = condPagesFor('letter_o_observation_source');
ok(loPages.length === 2 && ['cooper_primary', 'hawk_preserved'].every(v => loPages.some(p => JSON.stringify(p.condition).includes(v))),
  'eco letter_o: copertura TOTALE del dominio (cooper_primary + hawk_preserved)');
const ssPages = condPagesFor('sarah_support_state');
ok(ssPages.length === 2 && ['"none"', '"vice"'].every(v => ssPages.some(p => JSON.stringify(p.condition).includes(v))),
  'eco Sarah: copertura TOTALE del dominio (none + vice)');
const wtPages = condPagesFor('warning_target');
ok(wtPages.length === 1, 'eco valigia: una pagina, solo dove la valigia esiste');
ok(wtPages.some(p => p.condition.value_is && p.condition.value_is.equals === 'palmer'), 'eco valigia: ramo warning=palmer (Truman lo sa e lo dice)');
ok(!wtPages.some(p => p.condition.not), 'eco valigia: nessun fallback non-palmer che inventi un fatto');
const psPages = condPagesFor('promise_stance');
ok(psPages.length === 1 && psPages[0].condition.value_is.equals === 'accompagno',
  'eco promessa: solo accompagno registra il conflitto 7:00/7:10');
ok(/discrepanza è una sola/i.test(psPages[0].text) && /mai stato prenotato/i.test(psPages[0].text), 'eco promessa chiude il falso conflitto orario e isola la prenotazione inesistente');
// nessuna eco cambia il gate: le pagine condizionali non portano effetti
[...loPages, ...ssPages, ...wtPages, ...psPages].forEach(p => ok(!p.effects, p.id + ': una pagina d\'eco non scrive stato (cambia una riga, mai il gate)'));

console.log('# P6: contratto di formulazione');
const cmp = node('m9_cmp_taxi');
ok(cmp.kind === 'comparison' && cmp.channel === 'notebook' && cmp.comparison_completion === 'node_commit', 'cmp_taxi: comparison su taccuino, node_commit');
ok(!(cmp.choices || []).length, 'cmp_taxi: nessuna scelta (il Lock §3-B1 formula direttamente)');
const p6eff = effectsOf(cmp).find(e => e.proposition === 'P6');
ok(!!p6eff && p6eff.to === 'formulated', 'cmp_taxi: formula P6');
const SUPPORT = propositions.P6.support_min.all_of.slice().sort();
ok(JSON.stringify(p6eff.created_from.slice().sort()) === JSON.stringify(SUPPORT),
  'p6_requires_both_atoms: created_from == support_min a catalogo (' + SUPPORT.join('+') + ')');
ok(cmp.conditions.some(c => c.evidence === 'T_LELAND_TAXI') && cmp.conditions.some(c => c.evidence === 'D_TAXI'),
  'cmp_taxi: nascosto finché mancano gli atomi (entrambe le condizioni)');
ok(cmp.completion_when && cmp.completion_when.proposition_path === 'P6.formulation.status' && cmp.completion_when.equals === 'formulated',
  'cmp_taxi: completion_when = P6 formulata');
ok(propositions.P6.born_from_comparison === 'cmp_taxi' && typeof cmp.catalog_name_note === 'string' && cmp.catalog_name_note.includes('cmp_taxi'),
  'catalog_comparison_name_reconciled: il nome logico a catalogo (cmp_taxi) è dichiarato sul nodo m9_cmp_taxi');
ok(propositions.P6.formulable_in === 'M9' && propositions.P6.acceptance_type === 'colloquio_necessario', 'P6 a catalogo: formulabile in M9, accettazione colloquio_necessario');
ok(propositions.P6.text.indexOf('taxi') !== -1 && propositions.P6.text.indexOf('Missoula') === -1,
  'P6 a catalogo è la versione TAXI del Lock §0 (la P6 «trasferta» è rimossa)');
// factual_status resta unconfirmed in M9
ok(!operative.has('confirmed_as_lie') && !operative.has('corroborated') && allEffects().every(e => e.factual_status === undefined),
  'p6_factual_status_unconfirmed_in_m9: nessun effetto/condizione tocca il factual_status (confirmed_as_lie è M10-B6)');
ok(allEffects().filter(e => e.proposition).every(e => e.to === 'formulated'),
  'l\'unica scrittura su una proposizione in M9 è `formulated` (l\'accettazione passa dal record di presentazione)');
ok(JSON.stringify(propositions.P6.factual_path) === JSON.stringify(['unconfirmed', 'confirmed_as_lie']) && propositions.P6.confirmed_in === 'M10-B6',
  'catalogo: il percorso fattuale di P6 si chiude in M10-B6, non in M9');

console.log('# presentazione: allegato MANUALE, partizione totale, reason code a dominio');
const pres = node('m9_present_truman').presentation;
ok(pres.target_actor_id === 'truman', 'presentazione a Truman');
ok(pres.auto_show_provenance === false, 'auto_show_provenance disattivato: la provenienza non si mostra da sola (qui sbagliare conta)');
ok(pres.attachment && pres.attachment.mode === 'manual', 'attachment.mode = manual [Lock §3-B2]');
ok(pres.attachment.declared_for === 'C9-B', 'l\'allegato manuale è DICHIARATO per C9-B (C9-A è data-only)');
const P6b = pres.on.P6;
ok(JSON.stringify(P6b.attachment_required.slice().sort()) === JSON.stringify(SUPPORT), 'attachment_required == support_min di P6');
const comp = P6b.by_support.complete, miss = P6b.by_support.missing_corroboration;
ok(JSON.stringify(comp.when_attached_all.slice().sort()) === JSON.stringify(SUPPORT), 'ramo complete: richiede TUTTI gli atomi');
ok(JSON.stringify(miss.when_missing_any.slice().sort()) === JSON.stringify(SUPPORT),
  'attachment_partition_is_total: «ne manca almeno uno» è il complemento esatto di «li ha tutti» (nessun allegato senza ramo)');
ok(comp.result === 'accepted' && comp.reason_code === 'SUFFICIENT_RELEVANT_SUPPORT' && comp.acceptance_type === 'colloquio_necessario',
  'ramo complete: accettato, colloquio necessario');
ok(miss.result === 'rejected' && miss.reason_code === 'NO_CORROBORATION' && miss.retry === true, 'ramo incompleto: NO_CORROBORATION, ripresentabile');
ok(!miss.effects || !miss.effects.length, 'un rifiuto non scrive stato (nessun atto5 senza accettazione)');
['P7', 'P8'].forEach(p => {
  ok(pres.on[p] && pres.on[p].result === 'rejected' && pres.on[p].reason_code === 'VALID_BUT_NOT_PROCEDURAL',
    p + ': orientamento, mai base procedurale');
  ok(!!pres.on[p].already_rejected_page, p + ': memoria del rifiuto (ALREADY_REJECTED) dai dati');
  ok(!pres.on[p].effects || !pres.on[p].effects.length, p + ': nessun effetto (non autorizza niente)');
});
ok(!!P6b.already_rejected_page, 'P6: memoria del rifiuto dai dati');
ok(pres.on._none_formulated && pres.on._none_formulated.reason_code === 'NOT_YET_FORMULATED', 'ramo _none_formulated presente');
// la visione: risposta ADDITIVA, mai un verdetto, mai in un support_min
const vis = P6b.attachment_responses && P6b.attachment_responses.T_SARAH_VISIONE;
ok(!!vis && !!vis.page, 'la visione di Sarah ha una risposta dedicata');
ok(!vis.result && !vis.reason_code && !vis.effects, 'la visione NON cambia ramo/risultato/reason_code (risposta additiva)');
ok(Object.values(propositions).every(p => !((p.support_min && p.support_min.all_of) || []).includes('T_SARAH_VISIONE')),
  'T_SARAH_VISIONE non compare in NESSUN support_min (mai procedurale)');
ok(dEvid.evidence_add.T_SARAH_VISIONE && dEvid.evidence_add.T_SARAH_VISIONE.procedural === false, 'diff-evidence: la visione è dichiarata non procedurale');
ok((M9.carryover_evidence || []).some(c => c.evidence === 'T_SARAH_VISIONE' && c.never_in_support_min === true && c.attachable_only === true),
  'carryover_evidence: la visione è allegabile e mai base (fail-safe se il costrutto non c\'è)');
ok((M9.carryover_evidence || []).some(c => c.evidence === 'T_SARAH_VISIONE' && c.when && c.when.flag === 'sarah_visione_ascoltata'),
  'carryover_evidence: atto4 non concede la visione; serve aver parlato con Sarah');
ok(!M9.carryover_evidence.some(c => c.evidence === 'T_LELAND_TAXI'),
  'T_LELAND_TAXI entra tramite entry gate da M8, non tramite concessione automatica');
// reason code / acceptance_type dentro i domini a catalogo
const CODES = [];
(function w(o) { if (Array.isArray(o)) return o.forEach(w); if (o && typeof o === 'object') { if (o.reason_code) CODES.push(o.reason_code); for (const k in o) w(o[k]); } })(M9.nodes);
CODES.forEach(c => ok(enums.enums.presentation_reason_code.includes(c), 'reason_code a dominio: ' + c));
ok(enums.enums.acceptance_type.includes(comp.acceptance_type), 'acceptance_type a dominio: ' + comp.acceptance_type);
// il rifiuto è ripresentabile: il nodo si riapre finché non è accettato
const pn = node('m9_present_truman');
ok(pn.completion_when && pn.completion_when.proposition_path === 'P6.social_status.accepted_by' && pn.completion_when.contains === 'truman',
  'presentation_reopens_after_rejection: completion_when = accettazione (non il commit)');
ok(!pn.conditions.some(c => c.not && c.not.node_done), 'presentazione: nessuna guardia not-node_done (il rifiuto deve poter essere ripresentato)');
ok(!!pn.repeat, 'presentazione: pagina repeat presente');

console.log('# arrivo: volontario, gated sull\'accettazione, repeat raggiungibile');
const arr = node('m9_arrivo');
ok(arr.conditions.some(c => c.proposition_path === 'P6.social_status.accepted_by' && c.contains === 'truman'), 'arrival_requires_acceptance');
ok(arr.conditions.some(c => c.flag === 'atto5'), 'atto5_gates_arrival: la presenza NPC e il gate narrativo coincidono');
ok(!arr.conditions.some(c => c.not && c.not.node_done === 'm9_arrivo'), 'arrivo: nessuna guardia not-node_done (il repeat sarebbe irraggiungibile — lezione C8-A.1 B6)');
ok(!!arr.repeat && arr.repeat.mode === 'dialogue' && arr.repeat.speaker_id === 'cooper' &&
  arr.repeat.display_name === 'COOPER' && !arr.repeat.effects,
  'arrival_repeat_writes_no_state (battuta COOPER specifica dell\'arrivo)');
ok(!effectsOf(arr).length, 'l\'arrivo non scrive stato: il completamento è node_done (nessun flag di «arrivo volontario»)');
ok(arr.mandatory_beat === true, 'arrivo: beat obbligatorio');

console.log('# obiettivi: esattamente uno vero in ogni combinazione raggiungibile');
const combos = [
  { tleland: true, dtaxi: false, p6: false, acc: false, presDone: false, expect: 'obj_m9_1' },
  { tleland: true, dtaxi: true, p6: false, acc: false, presDone: false, expect: 'obj_m9_2' },
  { tleland: true, dtaxi: true, p6: true, acc: false, presDone: false, expect: 'obj_m9_3' },
  { tleland: true, dtaxi: true, p6: true, acc: false, presDone: true, expect: 'obj_m9_3' },
  { tleland: true, dtaxi: true, p6: true, acc: true, presDone: true, expect: 'obj_m9_4' },
  { tleland: true, dtaxi: true, p6: true, acc: true, presDone: true, arrDone: true, expect: 'obj_m9_4' }
];
function evalObj(c, env) {
  if (c.evidence === 'D_TAXI') return !!env.dtaxi;
  if (c.evidence === 'T_LELAND_TAXI') return !!env.tleland;
  if (c.proposition_path === 'P6.formulation.status') return c.equals === 'formulated' && !!env.p6;
  if (c.proposition_path === 'P6.social_status.accepted_by') return c.contains === 'truman' && !!env.acc;
  if (c.node_done === 'm9_present_truman') return !!env.presDone;
  if (c.node_done === 'm9_arrivo') return !!env.arrDone;
  if (c.flag === 'atto5') return !!env.acc;
  if (c.not) return !evalObj(c.not, env);
  if (c.all) return c.all.every(x => evalObj(x, env));
  throw new Error('cond obj? ' + JSON.stringify(c));
}
for (const env of combos) {
  const t = M9.objectives.filter(o => evalObj(o.when, env)).map(o => o.id);
  ok(t.length === 1 && t[0] === env.expect, 'obiettivi (' + JSON.stringify(env) + '): atteso ' + env.expect + ', trovato ' + t.join(','));
}
const prio = M9.objectives.map(o => o.priority).sort((a, b) => a - b).join(',');
ok(prio === '100,200,300,400', 'catena priorità = 100,200,300,400 (' + prio + ')');
// l'obiettivo terminale è gated sul NODO che lo consegna
const o4 = M9.objectives.find(o => o.id === 'obj_m9_4');
ok(o4.when.all.some(c => c.node_done === 'm9_present_truman'),
  'terminal_objective_gated_on_delivering_node (obj_m9_4 gated su node_done m9_present_truman, non sul solo stato)');
ok(!evalObj(o4.when, { acc: true, presDone: false }) && evalObj(o4.when, { acc: true, presDone: true }),
  'terminal_objective_not_active_before_commit');
// l'obiettivo dopo un RIFIUTO resta quello di portare la contraddizione (mai un vicolo)
ok(evalObj(M9.objectives.find(o => o.id === 'obj_m9_3').when, { p6: true, acc: false, presDone: true }),
  'no_dead_end_after_rejection: dopo un rifiuto l\'obiettivo torna a «porta a Truman una contraddizione che regga»');

console.log('# obiettivo d\'ingresso: punta a una root DAVVERO azionabile');
function nodeCondAtEntry(c) {
  if (c.flag) return c.flag === 'atto4';             // solo il flag d'atto è vero
  if (c.node_done) return c.node_done === 'm8_station';
  if (c.evidence) return c.evidence === 'T_LELAND_TAXI';
  if (c.value_set || c.value_is) return false;
  if (c.proposition_path) return false;
  if (c.not) return !nodeCondAtEntry(c.not);
  if (c.all) return c.all.every(nodeCondAtEntry);
  if (c.any) return c.any.some(nodeCondAtEntry);
  return false;
}
function availableAtEntry(id) { return (node(id).conditions || []).every(nodeCondAtEntry); }
const entryEnv = { tleland: true, dtaxi: false, p6: false, acc: false, presDone: false };
const entryActive = M9.objectives.filter(o => evalObj(o.when, entryEnv)).sort((a, b) => b.priority - a.priority);
ok(entryActive.length === 1 && entryActive[0].id === 'obj_m9_1', 'entry_objective_points_to_actionable_root: obiettivo d\'ingresso = obj_m9_1');
ok(availableAtEntry('m9_verifica_taxi'), 'entry_objective_points_to_actionable_root: Lucy è azionabile subito');
ok(!availableAtEntry('m9_cmp_taxi'), 'm9_cmp_taxi NON azionabile all\'ingresso (mancano gli atomi)');
ok(!availableAtEntry('m9_present_truman'), 'm9_present_truman NON azionabile all\'ingresso (P6 non formulata)');
ok(!availableAtEntry('m9_arrivo'), 'm9_arrivo NON azionabile all\'ingresso (P6 non accettata, atto5 falso)');
ok(/Lucy/.test(M9.objectives.find(o => o.id === 'obj_m9_1').text), 'l\'obiettivo d\'ingresso nomina il bersaglio reale (Lucy)');

console.log('# binding world: map_id e attori REALI del motore');
const worldNodes = M9.nodes.filter(n => n.channel === 'world');
function isRealMap(id) { return MAPSJS.indexOf('\n    ' + id + ': {') !== -1; }
const sheriffBlock = GLUEJS.slice(GLUEJS.indexOf('sheriff: ['), GLUEJS.indexOf('palmer: ['));
ok(sheriffBlock.length > 100, 'blocco NPC sheriff estratto da js/glue.js');
for (const n of worldNodes) {
  ok(!!n.map_id && !!n.target_kind && !!n.target_id, n.id + ': binding world completo');
  ok(isRealMap(n.map_id), n.id + ': map_id REALE del motore (' + n.map_id + ')');
  ok(['actor', 'object', 'landmark', 'sign'].includes(n.target_kind), n.id + ': target_kind valido');
  ok(n.x === undefined && n.y === undefined, n.id + ': nessuna coordinata nei dati');
  if (n.target_kind === 'actor') {
    ok(!!n.actor_id && n.actor_id === n.target_id, n.id + ': attore coerente');
    ok(sheriffBlock.indexOf("id: '" + n.actor_id + "'") !== -1, n.id + ': l\'attore ' + n.actor_id + ' è un NPC REALE di sheriff (js/glue.js)');
  }
}
ok(worldNodes.every(n => n.map_id === 'sheriff') && JSON.stringify(M9).indexOf('"goto"') === -1, 'M9 si svolge alla centrale; testimonianza Palmer già acquisita in M8');
// gli speaker delle pagine sono attori reali della scena (o Cooper)
const SPEAKERS = ['cooper', 'truman', 'lucy', 'leland', 'andy'];
for (const [id, p] of allPages) if (id.indexOf('m9.') === 0 && p.speaker_id) ok(SPEAKERS.includes(p.speaker_id), id + ': speaker della scena (' + p.speaker_id + ')');
['lucy', 'truman', 'leland', 'andy'].forEach(a => ok(sheriffBlock.indexOf("id: '" + a + "'") !== -1, 'NPC reale su sheriff: ' + a));
ok(/leland[^]{0,200}flag:atto5/.test(sheriffBlock), 'leland@sheriff è condizionato ad atto5 in js/glue.js: gate narrativo e presenza fisica coincidono');
const KINDS = ['dialogue', 'comparison'];
for (const n of M9.nodes) ok(KINDS.includes(n.kind), n.id + ': kind nello schema (' + n.kind + ')');

console.log('# diff: M4/M5/M6 invariati; carry-in taxi posseduto da M8');
ok(JSON.stringify(dEnums.values_allowed_add) === '{}' && JSON.stringify(dEnums.enums_add) === '{}' &&
  JSON.stringify(dEnums.booleans_allowed_add) === '["sarah_visione_ascoltata"]' && JSON.stringify(dEnums.value_transitions_add) === '{}',
  'diff-state-enums-M9: solo flag diegetico Sarah, nessun valore tipizzato nuovo');
ok(JSON.stringify(dEnums.presentation_attachment_modes_add) === '["manual"]',
  'diff-state-enums-M9: l\'unica aggiunta è di FORMA (modo di allegato manuale, dichiarato per C9-B)');
ok(Object.keys(dEvid.ui_origin_add).every(k => evidence[k] && (k === 'T_LELAND_TAXI' || k === 'D_TAXI')), 'diff-evidence: ui_origin solo sui due atomi di P6');
ok(Object.keys(dEvid.evidence_add).length === 1 && !!dEvid.evidence_add.T_SARAH_VISIONE, 'diff-evidence: UNA sola evidenza nuova (la visione)');
ok(!evidence.T_SARAH_VISIONE, 'diff-evidence: la visione non è ancora nel catalogo reale (i diff non sono applicati in C9-A)');
ok(Object.keys(dProp.ui_short_add).length === 1 && !!dProp.ui_short_add.P6, 'diff-propositions: solo ui_short su P6');
ok(!propositions.P6.ui_short, 'diff-propositions: P6 non ha ancora ui_short a catalogo (diff non applicato)');
ok(M8.node_count.runtime_total === 16 && M6.node_count.runtime_total === 17 && M5.node_count.runtime_total === 21,
  'M5 (21) / M6 (17, M6 stitch: +3 confronti carte, +piantone, +rifiuto notturno) / M8 (16) coerenti');
ok(M8.nodes.some(n => n.id === 'm8_leland_taxi'), 'M8 contiene ponte taxi pre-ritrovamento senza nodo m9_');

console.log('# coerenza DOCUMENTALE (schema-delta / source-map / matrice == dati)');
// UNA sola semantica viva: la P6 rimossa vive SOLO nel changelog (§8) e nel riquadro d'apertura
const liveStart = SDELTA.indexOf('## 0.'), liveEnd = SDELTA.indexOf('## 8. Changelog');
ok(liveStart > 0 && liveEnd > liveStart, 'schema-delta: sezioni §0-§7 e changelog §8 individuabili');
const live = SDELTA.slice(liveStart, liveEnd);
['T_LELAND_MISSOULA', 'D_REGISTRO', 'trasferta', 'registro della contea', 'm9_objection_history'].forEach(t =>
  ok(live.indexOf(t) === -1, 'one_live_semantics: «' + t + '» non compare nelle sezioni VIVE dello schema-delta'));
['T_LELAND_MISSOULA', 'D_REGISTRO', 'trasferta', 'm9_objection_history'].forEach(t =>
  ok(SDELTA.slice(liveEnd).indexOf(t) !== -1, 'changelog: «' + t + '» registrata come RIMOSSA'));
ok(/non va(nno)? implementat/.test(SDELTA) || /NON va implementata/.test(SDELTA), 'schema-delta: il changelog dichiara «non implementare»');
// i costrutti dichiarati nello schema-delta sono ESATTAMENTE quelli usati dai dati
const CONSTRUCTS = ['manual', 'by_support', 'presentation_branch_assembly', 'attachment_responses', 'carryover_evidence'];
CONSTRUCTS.forEach(c => ok(SDELTA.indexOf(c) !== -1, 'schema-delta dichiara il costrutto: ' + c));
['by_support', 'attachment_responses', 'carryover_evidence'].forEach(c =>
  ok(JSON.stringify(M9).indexOf('"' + c + '"') !== -1, 'il costrutto ' + c + ' è realmente presente nei dati'));
ok(/data-only/.test(SDELTA) && /C9-B/.test(SDELTA), 'schema-delta: perimetro data-only + rinvio a C9-B dichiarati');
ok(/M4\/M5\/M6 restano invariati; M8 espone il beat taxi pre-ritrovamento/.test(SDELTA), 'schema-delta: ownership taxi M8 dichiarata');
// source-map: nodi, obiettivi derivati, autorità, map_id reali
NODE_IDS.forEach(id => ok(SRCMAP.indexOf(id) !== -1, 'source-map registra il nodo ' + id));
['obj_m9_1', 'obj_m9_2'].forEach(id => ok(SRCMAP.indexOf(id) !== -1, 'source_map_declares_all_noncanonical_objectives: ' + id));
ok(/CONFESSION LOCK/.test(SRCMAP) && /Nota storica/.test(SRCMAP), 'source_map_names_confession_lock_as_current_authority');
ok(/non\*\* come autorità corrente/.test(SRCMAP), 'source_map_marks_packet_v1_0_as_historical_only');
const trasfOcc = (SRCMAP.match(/trasferta/g) || []).length;
const trasfNeg = (SRCMAP.match(/(?:«trasferta a Missoula»|nessuna `trasferta`|«trasferta di lavoro» è rimossa)/g) || []).length;
ok(trasfOcc > 0 && trasfOcc === trasfNeg, 'source_map_uses_confession_lock_p6 (ogni «trasferta» è storica o negata, ' + trasfNeg + '/' + trasfOcc + ')');
ok(/World & Story Bible v1\.0/.test(SRCMAP), 'source_map_names_world_story_bible_v1_as_current_authority');
ok(SRCMAP.indexOf('`sheriff`') !== -1 && !/map_id.*centrale/.test(SRCMAP), 'source_map_uses_only_engine_map_ids (sheriff, mai «centrale»)');
// matrice: catena obiettivi e conteggio percorsi coerenti col JSON
ok(/100→200→300→400/.test(MATRIX), 'matrix_objective_chain_matches_json (catena priorità documentata)');
ok(/12 percorsi/.test(MATRIX) && /2 × 2 × 3/.test(MATRIX), 'matrix_declares_12_paths (letter_o × sarah × warning)');
ok(/24 combinazioni/.test(MATRIX), 'matrix_declares_attachment_axis (12 × 2 esiti di allegato)');
ok(/NO_CORROBORATION/.test(MATRIX) && /ALREADY_REJECTED/.test(MATRIX), 'matrice: i reason code dell\'asse di allegato documentati');
ok(/Nessun arresto in M9/.test(MATRIX) && /Nessuna comparsa di BOB/.test(MATRIX), 'matrice: asserzioni sull\'ASSENZA (arresto, BOB)');
ok(!/valore tipizzato nuovo/.test(MATRIX) || /legge/.test(MATRIX), 'matrice: M9 dichiarata come lettrice dello stato M8');
ok(MATRIX.indexOf('m9_present_truman') !== -1 && MATRIX.indexOf('m9_arrivo') !== -1, 'matrice: i record screen-truth nominano nodi reali');
// ogni page-id citato dalla matrice esiste davvero (niente ID inventati nei documenti)
const cited = (MATRIX.match(/m9\.[a-z0-9_]+\.[a-z0-9_.]+/g) || []).filter(id => !/\.js$/.test(id));
cited.forEach(id => ok(allPages.has(id), 'matrix_cites_only_real_page_ids: ' + id));

console.log('');
if (failures === 0) {
  console.log(checks + ' controlli statici M9 superati ✔ (proposta C9-A — copertura dinamica in C9-B); '
    + m9pages + ' pagine M9, ' + M9.nodes.length + ' nodi');
  process.exit(0);
}
console.error(failures + ' fallimenti su ' + checks);
process.exit(1);
