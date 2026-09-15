/* test/narrative-validate-m10.js — Act 5 pass 01: validazione STATICA di M10
 * «L'interrogatorio» contro il CONFESSION LOCK v1.1.1 (§4 ordine, §5 script, §6 dati,
 * §7 test testuali). La copertura dinamica (tutti i rami eseguiti dal runtime) è in
 * test/act-5-flow.js. node test/narrative-validate-m10.js */
'use strict';
const fs = require('fs');
const path = require('path');
let checks = 0, failures = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; console.error('  ✗ ' + msg); } }

const PROJ = path.join(__dirname, '..');
const ROOT = path.join(PROJ, 'narrative');
const M10 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M10.json'), 'utf8'));
const M9 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M9.json'), 'utf8'));
const M6 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M6.json'), 'utf8'));
const M8 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M8.json'), 'utf8'));
const enums = JSON.parse(fs.readFileSync(path.join(ROOT, 'state-enums.json'), 'utf8'));
const cast = JSON.parse(fs.readFileSync(path.join(ROOT, 'cast', 'windows.json'), 'utf8'));
const LOCK = fs.readFileSync(path.join(PROJ, M10.source.file), 'utf8');
const S5 = LOCK.slice(LOCK.indexOf('## 5. M10'), LOCK.indexOf('## 6. Dati'));
const lockN = S5.replace(/\*/g, '').replace(/\s+/g, ' ');

const ADMISSIONS = ['taxi_lie', 'traincar_presence', 'laura_homicide', 'maddy_homicide', 'maddy_body_transport', 'letters'];
const METHODS = ['probatorio', 'personale', 'intuitivo'];
const node = (id) => M10.nodes.find((n) => n.id === id);
function pagesOf(n) {
  const out = [].concat(n.pages || []);
  if (n.pages_by_value) Object.values(n.pages_by_value.cases).forEach((c) => out.push(...c));
  (n.choices || []).forEach((c) => out.push(...(c.feedback_pages || [])));
  return out;
}
const allPages = [];
M10.nodes.forEach((n) => pagesOf(n).forEach((p) => allPages.push({ node: n, page: p })));

console.log('# autorità e forma');
ok(M10.mission === 'M10' && M10.narrative_package === 'narrative-v1.0', 'missione M10, pacchetto narrative-v1.0');
ok(M10.source.document === M9.source.document && M10.source.file === M9.source.file, 'stessa sorgente del CONFESSION LOCK di M9');
ok(/CONFESSION LOCK/.test(LOCK) && /M9-M10 v1\.1\.1/.test(LOCK), 'source.file è il CONFESSION LOCK v1.1.1');
ok(fs.existsSync(path.join(PROJ, M10.schema_delta)), 'schema_delta dichiarato esiste (' + M10.schema_delta + ')');
ok(JSON.stringify(M10.entry_condition) === JSON.stringify({ all: [{ flag: 'atto5' }, { node_done: 'm9_arrivo' }] }), 'ingresso = consegna di M9 (atto5 + node_done m9_arrivo)');
ok(JSON.stringify(M9.completion.when) === JSON.stringify({ node_done: 'm9_arrivo' }), 'M9.completion.when coincide con il gate M10');
ok(M10.node_count.runtime_total === M10.nodes.length, 'node_count coerente');

console.log('# FEDELTÀ AL LOCK §5: ogni pagina è una riga del Lock, mai parafrasata');
const ids = new Set();
allPages.forEach(({ page }) => {
  ok(!ids.has(page.id), 'page id unico: ' + page.id); ids.add(page.id);
  ok(/^m10\./.test(page.id), 'page id nel namespace m10.: ' + page.id);
  if (page.lock_composite) {
    ok(page.lock_composite.join(' ') === page.text, 'composita = pezzi del Lock uniti: ' + page.id);
    page.lock_composite.forEach((x) => ok(lockN.indexOf(x) !== -1, 'VERBATIM pezzo di ' + page.id + ': «' + x + '»'));
  } else {
    ok(lockN.indexOf(page.text.replace(/\s+/g, ' ')) !== -1, 'VERBATIM ' + page.id + ': «' + page.text.slice(0, 60) + '»');
  }
});
M10.objectives.forEach((o) => ok(LOCK.replace(/\s+/g, ' ').indexOf(o.text) !== -1, 'obiettivo ' + o.id + ' = testo del Lock'));
[['m10_soglia', node('m10_soglia').prompt], ['m10_s3', node('m10_s3').prompt]].forEach(([id, t]) => {
  ok(t.length <= 48 && lockN.toLowerCase().indexOf('[scelta — ' + t.replace(/\.$/, '').toLowerCase() + ']') !== -1, id + ': prompt ≤48 = intestazione [SCELTA — …] del Lock («' + t + '»)');
});
[].concat(node('m10_soglia').choices, node('m10_s3').choices).forEach((c) => ok(lockN.indexOf(c.label) !== -1 || lockN.toLowerCase().indexOf(c.label.toLowerCase()) !== -1, 'etichetta dal Lock: ' + c.label));

console.log('# igiene participant-facing');
const DESIGN = /\b(m10_|m9_|P6|P8|material_admissions|speaker_register|leland_first_person|s3|truman_testimony_state|bob_surface)\b/;
// probatorio/personale/intuitivo sono anche parole italiane («registratore personale»): vietate solo come tag tra parentesi
const METHOD_TAG = /\((probatorio|personale|intuitivo)\)/;
allPages.forEach(({ page }) => ok(!DESIGN.test(page.text) && !METHOD_TAG.test(page.text), 'nessun ID di design a schermo: ' + page.id));
[].concat(node('m10_soglia').choices, node('m10_s3').choices).forEach((c) => ok(!DESIGN.test(c.label) && !METHOD_TAG.test(c.label) && !/probatorio|personale|intuitivo/.test(c.label), 'etichetta senza ID di design: ' + c.id));
const ABSOLUTION = [/il fuoco non ha bisogno del permesso/i, /non è colpa (sua|tua|mia)/i, /ti perdono/i, /la perdona/i, /non era lui/i, /è stato bob/i, /innocente/i, /assolt/i];
allPages.forEach(({ page }) => ABSOLUTION.forEach((re) => ok(!re.test(page.text), 'lista nera assolutoria (' + re + '): ' + page.id)));
allPages.forEach(({ page }) => ok(!/faccia in giù/i.test(page.text), 'la foto di Laura mai a faccia in giù: ' + page.id));

console.log('# §4 ordine definitivo (asserzione d\'ordine)');
const ORDER = ['m10_soglia', 'm10_apertura', 'm10_domande', 'm10_affioramento', 'm10_confessione', 'm10_s3', 'm10_post_s3', 'm10_vittime', 'm10_fermo', 'm10_morte'];
ok(JSON.stringify(M10.nodes.map((n) => n.id)) === JSON.stringify(ORDER), 'nodi nell\'ordine del Lock §4/§5');
for (let i = 0; i < ORDER.length - 1; i++) ok(node(ORDER[i]).next === ORDER[i + 1], ORDER[i] + ' → next ' + ORDER[i + 1]);
ok(!node('m10_morte').next, 'la catena finisce a m10_morte');
const soglia = node('m10_soglia');
ok(soglia.choices.every((c) => c.effects.some((e) => e.value === 'm10_method')), 'metodo scelto sulla SOGLIA');
ok(pagesOf(soglia).every((p) => p.recorded_on !== 'tape') && pagesOf(soglia).some((p) => p.recorded_on === 'personal_recorder'),
  'l\'ipotesi vive nel registratore personale, prima del nastro');
const tapeStart = pagesOf(node('m10_apertura')).findIndex((p) => p.recorded_on === 'tape');
const consent = pagesOf(node('m10_apertura')).findIndex((p) => /vorremmo registrare/.test(p.text));
ok(consent !== -1 && tapeStart > consent, 'consenso al colloquio PRIMA dell\'avvio del nastro');
const opening = pagesOf(node('m10_apertura'))[tapeStart];
ok(opening && opening.tape_opening === 'neutral' && !/letto|ipotesi|scena|ucciso|assassin/i.test(opening.text), 'apertura del verbale NEUTRA (nessuna ipotesi a nastro)');
M10.nodes.slice(1, 9).forEach((n) => ok(n.exposed === false, n.id + ': nodo di catena non esposto (una sola root sulla scena)'));
ok(soglia.exposed !== false && soglia.actor_id === 'leland' && node('m10_morte').exposed !== false && node('m10_morte').actor_id === 'truman',
  'root esposte: m10_soglia su Leland, m10_morte su Truman (ripresa dopo il fermo)');
M10.nodes.forEach((n) => ok(n.map_id === 'sheriff' && n.channel === 'world', n.id + ': sulla centrale (sheriff)'));

console.log('# §6 material_admissions per-fatto (mai un booleano)');
ADMISSIONS.forEach((f) => ok(enums.values_allowed['material_admissions.' + f] === 'speaker_register', 'values_allowed material_admissions.' + f + ' → speaker_register'));
ok(JSON.stringify(enums.enums.speaker_register) === JSON.stringify(['leland_first_person', 'voice']), 'dominio speaker_register');
ok(!enums.booleans_allowed.some((b) => /admission|confess/.test(b)), 'nessun booleano di confessione a catalogo');
const conf = node('m10_confessione');
ADMISSIONS.forEach((f) => ok(conf.effects.some((e) => e.value === 'material_admissions.' + f && e.to === 'leland_first_person'), 'm10_confessione registra ' + f + ' in prima persona'));
ok(conf.effects.some((e) => e.proposition === 'P6' && e.factual_status === 'confirmed_as_lie') && conf.effects.some((e) => e.proposition === 'P8' && e.factual_status === 'corroborated'),
  'P6 confirmed_as_lie + P8 corroborated SOLO in confessione');
M10.nodes.filter((n) => n !== conf).forEach((n) => ok(!(n.effects || []).some((e) => e.factual_status || /material_admissions/.test(e.value || '')), n.id + ': nessuna ammissione/stato fattuale fuori da B6'));
[M6, M8, M9].forEach((m) => ok(!JSON.stringify(m).includes('confirmed_as_lie"') || m === M9, m.mission + ': nessun writer di stati fattuali'));
METHODS.forEach((meth) => {
  const pages = conf.pages_by_value.cases[meth];
  const admitted = new Set();
  pages.forEach((p) => (p.admits || []).forEach((a) => admitted.add(a)));
  ok(ADMISSIONS.every((a) => admitted.has(a)), meth + ': TUTTE e sei le ammissioni rese a schermo prima di S3 (' + [...admitted].join(',') + ')');
  pages.filter((p) => p.admits).forEach((p) => ok(p.speaker_id === 'leland' && !p.portrait, meth + ': ' + p.id + ' ammissione in PRIMA PERSONA di Leland (mai VOCE)'));
  ['taxi_lie', 'laura_homicide', 'maddy_homicide', 'traincar_presence'].forEach((a) => {
    const p = pages.find((x) => (x.admits || []).includes(a));
    ok(!!p && /\b(io|ho|mia|c'ero|l'ho)\b/i.test(p.text), meth + ': ' + a + ' in prima persona verificata sul testo');
  });
  ['maddy_homicide'].forEach((a) => {
    const i = pages.findIndex((x) => (x.admits || []).includes(a));
    const explicit = /uccis/i.test(pages[i].text) || (i > 0 && /Chi ha ucciso/.test(pages[i - 1].text));
    ok(explicit, meth + ': omicidio di Maddy ESPLICITO (uccisa / «Chi ha ucciso…?» + «Io»)');
  });
});
const s3 = node('m10_s3');
ADMISSIONS.forEach((f) => ok(s3.conditions.some((c) => c.value_set === 'material_admissions.' + f), 'S3 gated sul record ' + f));
ok(s3.choices.map((c) => c.effects.map((e) => e.value + '=' + e.to).join('|')).join(' / ') === 's3=on|truman_testimony_state=not_needed / s3=off|truman_testimony_state=voluntary_witness',
  'S3: on→not_needed, off→voluntary_witness');
ok(s3.choices.every((c) => !(c.effects || []).some((e) => /material_admissions/.test(e.value || ''))), 'S3-off conserva le ammissioni (nessuna scrittura sulle ammissioni in S3)');

console.log('# §5 tre operazioni diverse VERIFICATE SUL TESTO');
const dom = node('m10_domande').pages_by_value.cases;
const txt = (arr) => arr.map((p) => p.text).join(' ');
ok(/taxi/i.test(txt(dom.probatorio)) && /prenotazioni/.test(txt(dom.probatorio)), 'probatorio: le carte (taxi, prenotazioni)');
ok(/dormire/.test(txt(dom.personale)) && /Nella terra/.test(txt(dom.personale)), 'personale: il sonno e il ponte killer-only');
ok(/FUOCO CAMMINA CON ME/.test(txt(dom.intuitivo)) && /mago desidera vedere/.test(txt(dom.intuitivo)), 'intuitivo: versi pronunciati da Leland, non da Cooper');
ok(!dom.intuitivo.some((p) => p.speaker_id === 'cooper' && /mago desidera/.test(p.text)), 'intuitivo: Cooper non pronuncia i versi');
const cf = conf.pages_by_value.cases;
ok(/Come lo sa\?/.test(txt(cf.probatorio)) && /Questo è mio/.test(txt(cf.probatorio)), 'B6 probatorio: precisazioni forzate');
ok(/Cominci da Laura/.test(txt(cf.personale)) && /Non "tutte"/.test(txt(cf.personale)), 'B6 personale: ritorno ai nomi');
ok(/In forma semplice/.test(txt(cf.intuitivo)) && cf.intuitivo.some((p) => p.speaker_id === 'voce'), 'B6 intuitivo: distillazione dell\'impossibile');
ok(txt(dom.probatorio) !== txt(dom.personale) && txt(cf.probatorio) !== txt(cf.intuitivo), 'i tre rami sono testi diversi');

console.log('# Truman esce e rientra SOLO nell\'intuitivo');
METHODS.forEach((m) => {
  const exits = dom[m].filter((p) => /\(esce\)/.test(p.text)).length;
  const back = cf[m].filter((p) => /Truman rientra/.test(p.text)).length;
  ok(m === 'intuitivo' ? exits === 1 && back === 1 : exits === 0 && back === 0, m + ': uscite ' + exits + ', rientri ' + back);
});
const out = cast.windows.find((w) => w.id === 'ACT5_TRUMAN_OUT_INTUITIVE');
ok(!!out && JSON.stringify(out.when).includes('"equals":"intuitivo"') && out.entry_authored_by.truman === 'm10.b3.intuitivo.p09' && out.exit_authored_by.truman === 'm10.b6.intuitivo.p07',
  'finestra ACT5_TRUMAN_OUT_INTUITIVE con pagine autorali di uscita e rientro');
ok(ids.has('m10.b3.intuitivo.p09') && ids.has('m10.b6.intuitivo.p07') && ids.has('m10.b9.fermo.p03'), 'pagine autorali delle finestre esistono in M10');

console.log('# eco M6/M8: ID esatti dei lock (3+3 condizioni + fallback)');
const condStr = JSON.stringify(M10.nodes);
['JACQUES_MIDNIGHT_CLAIM', 'JACQUES_LIST_GIVEN', 'JACQUES_THIRD_MAN_DETAIL'].forEach((ev) => {
  ok(condStr.includes('"evidence":"' + ev + '"'), 'M10 legge l\'evidenza ' + ev);
  ok(JSON.stringify(M6).includes('"evidence": "' + ev + '"') || JSON.stringify(M6).includes('"evidence":"' + ev + '"'), ev + ' ha un writer in M6');
});
ok(condStr.includes('"value_set":"promise_stance"'), 'M10 legge promise_stance');
// il biglietto: le tre varianti di Cooper e le due di Leland partizionano warning_target × focus_destination
const pers = dom.personale;
const NR = { value_is: (st, c) => st[c.name] === c.equals };
function ev(c, st) {
  if (!c) return true;
  if (c.all) return c.all.every((x) => ev(x, st));
  if (c.not) return !ev(c.not, st);
  if (c.value_is) return NR.value_is(st, c.value_is);
  throw new Error('cond ' + JSON.stringify(c));
}
enums.enums.warning_target.forEach((w) => enums.enums.focus_destination.forEach((f) => {
  const st = { warning_target: w, focus_destination: f };
  const q = pers.filter((p) => p.speaker_id === 'cooper' && p.condition && ev(p.condition, st));
  const a = pers.filter((p) => p.speaker_id === 'leland' && p.condition && ev(p.condition, st));
  ok(q.length === 1 && a.length === 1, 'biglietto warning=' + w + ' focus=' + f + ': una domanda (' + q.map((p) => p.id) + ') e una risposta (' + a.map((p) => p.id) + ')');
  if (w !== 'palmer') ok(!/biglietto/.test(q[0].text), 'fallback senza biglietto: nessun biglietto inventato (' + w + '/' + f + ')');
}));
ok(M8.nodes.some((n) => JSON.stringify(n).includes('m8.f.station.p_valigia')) && M8.nodes.some((n) => JSON.stringify(n).includes('m8.c.route_palmer.p02')),
  'le due rese M8 del biglietto (Palmer / via Truman) esistono');

console.log('# BOB: due segnali esatti, nessun altro');
allPages.forEach(({ page }) => {
  if (page.portrait) ok(page.portrait === 'bob' && ['portrait_shown', 'register_shift'].includes(page.bob_surface), 'ritratto BOB solo come segnale dichiarato: ' + page.id);
  if (page.bob_surface) ok(['portrait_shown', 'register_shift'].includes(page.bob_surface), 'bob_surface nel dominio a due segnali: ' + page.id);
  if (page.speaker_id === 'voce') ok(page.portrait === 'bob' && page.display_name === 'VOCE', 'VOCE = cambio di registro col ritratto del sogno: ' + page.id);
  ok(!/\bBOB\b/.test(page.text), 'BOB mai nominato a schermo in M10: ' + page.id);
});
const kinds = new Set(allPages.map(({ page }) => page.bob_surface).filter(Boolean));
ok(kinds.size === 2, 'esattamente due tipi di segnale BOB (' + [...kinds].join(',') + ')');
ok(node('m10_affioramento').effects.some((e) => e.set === 'dream_face_recognized_in_leland_scene'), 'dream_face_recognized_in_leland_scene scritta in B5 (osservazione)');
ok(!enums.booleans_allowed.some((b) => /possess|host|bob_true/.test(b)), 'nessun flag di possessione a catalogo');

console.log('# B7b identico nei due rami S3; vittime dopo il perdono; morte umana poi composta');
const post = node('m10_post_s3');
ok(post.spoken_in_all_paths === true && post.witnessed_by_truman === true && JSON.stringify(post.recorded_if).includes('"on"') && JSON.stringify(post.formal_testimony_if).includes('"off"'), 'B7b: metadati del Lock (spoken_in_all_paths / recorded_if / formal_testimony_if)');
ok(post.pages.every((p) => !p.condition) && !post.pages_by_value, 'B7b: nessuna pagina dipende da s3');
ok(/Potrà mai/.test(txt(post.pages)) && post.pages[post.pages.length - 1].laura_photo === 'kept_before_cooper', 'la domanda del perdono resta senza risposta; la foto resta davanti a Cooper');
ok(ORDER.indexOf('m10_vittime') > ORDER.indexOf('m10_post_s3'), 'beat-vittime DOPO la domanda del perdono');
const morte = node('m10_morte').pages;
const human = morte.findIndex((p) => /due dita sul collo/.test(p.text));
const composed = morte.findIndex((p) => /Una cosa non cancella l'altra/.test(p.text));
ok(human !== -1 && composed > human && morte.findIndex((p) => /Lucy — il dottore/.test(p.text)) < composed, 'morte umana (Truman apre, conta, chiama) PRIMA della composizione');
ok(/Truman apre la porta lui stesso/.test(txt(node('m10_fermo').pages)), 'Truman apre la cella e agisce');
ok(node('m10_morte').effects.length === 1 && node('m10_morte').effects[0].set === 'leland_morto', 'leland_morto scritto solo alla fine di B10');
ok(JSON.stringify(M10.completion) === JSON.stringify({ when: { flag: 'leland_morto' }, sets: [] }), 'completion = leland_morto');

console.log('# obiettivi: partizione');
function evalObj(c, st) {
  if (c.all) return c.all.every((x) => evalObj(x, st));
  if (c.not) return !evalObj(c.not, st);
  if (c.flag) return !!st.flags[c.flag];
  if (c.node_done) return !!st.nodes_done[c.node_done];
  throw new Error('obj cond');
}
[{ flags: {}, nodes_done: { m9_arrivo: true } }, { flags: { leland_morto: true }, nodes_done: { m9_arrivo: true } }].forEach((st, i) => {
  const t = M10.objectives.filter((o) => evalObj(o.when, st));
  ok(t.length === 1, 'stato ' + i + ': esattamente un obiettivo vero (' + t.map((o) => o.id) + ')');
});

console.log('');
if (failures === 0) {
  console.log(checks + ' controlli statici M10 superati ✔; ' + allPages.length + ' pagine M10, ' + M10.nodes.length + ' nodi');
  process.exit(0);
}
console.error(failures + ' fallimenti su ' + checks);
process.exit(1);
