/* test/act-3-flow.js — Act 3 (M5, "Il vagone") wiring, no browser.
 * (a) runtime path through the observation orders, theory machine, the ring
 *     comparison, stove/cards, S1/report split, east_route_confirmed.
 * (b) adapter path: NARRATIVE_ENTITIES hawk placements on the traincar map.
 * (c) M6 stitch: mandatory hospital guard before the night report, the
 *     conditional variants (Audrey, «impeto», night register, S1 echo), the
 *     optional cards comparison, and the classic→narrative audrey_indaga bridge.
 * (d) M6 stitch: the two county-deputy placements on the hospital ward.
 * node test/act-3-flow.js */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

const ROOT = path.join(__dirname, '..', 'narrative');
const M4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M4.json'), 'utf8'));
const M5 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M5.json'), 'utf8'));
const M6 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M6.json'), 'utf8'));
const M8 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M8.json'), 'utf8'));
const M9path = path.join(ROOT, 'missions', 'M9.json');
const M9 = fs.existsSync(M9path) ? JSON.parse(fs.readFileSync(M9path, 'utf8')) : null;
const enums = JSON.parse(fs.readFileSync(path.join(ROOT, 'state-enums.json'), 'utf8'));

/* ===================== (a) runtime path ===================== */
(function runtimePath() {
  global.window = undefined;
  require(path.join(__dirname, '..', 'js', 'narrative-runtime.js'));
  const NR = global.GAME.NarrativeRuntime;
  {
    const domains = {};
    for (const [name, enumName] of Object.entries(enums.values_allowed)) domains[name] = enums.enums[enumName];
    NR.setValueDomains(domains);
  }

  function freshState() { const s = NR.createState(); s.flags.sogno_fatto = true; return s; }
  function doNode(mission, s, id) { const p = NR.prepareNode(s, mission, id); if (!p.ok) return p; const c = NR.commitNode(s, mission, p); return { ok: c.ok, prep: p, commit: c }; }
  function doChoice(mission, s, atId, choiceId) {
    const node = mission.nodes.find(n => n.id === atId);
    const p = NR.prepareChoice(s, mission, node, choiceId);
    if (!p.ok) return p;
    const c = NR.commitChoice(s, mission, node, p);
    if (c.ok && c.goto) { const r = doNode(mission, s, c.goto); return { ok: r.ok, goto: c.goto, prep: p }; }
    return { ok: c.ok, prep: p, commit: c };
  }
  function m5Base() {
    const s = freshState();
    doNode(M4, s, 'truman_a2'); doNode(M4, s, 'james_a2');
    doNode(M4, s, 'ronette_q'); doChoice(M4, s, 'ronette_q', 'q_uomo');
    doNode(M4, s, 'cmp_e6a_tjames'); doChoice(M4, s, 'cmp_e6a_tjames', 'b8_a');
    const presN = M4.nodes.find(n => n.id === 'present_truman_m4');
    const pp = NR.preparePresentation(s, M4, presN, 'P2');
    NR.commitPresentation(s, M4, pp);
    doNode(M5, s, 'm5_bridge'); doNode(M5, s, 'm5_discovery');
    return s;
  }

  console.log('# act-3-flow: runtime path (M5)');

  const RESULT_TOKEN = /DELIBERATE_PLACEMENT|OVERREACH|m5_|E8A|E8B|E7A|E7B|E_SCENE|P3A|R1|R2|A1[0-4]/;
  function scanRendered(pages, where) {
    (pages || []).forEach(pg => ok(!RESULT_TOKEN.test(pg.text), where + ': pagina «' + pg.id + '» senza id di design (' + pg.text + ')'));
  }

  // -- static scan: east_route_confirmed ha un solo writer in tutto il progetto, ed è in M5 --
  function writersOf(mission, pred) {
    const out = [];
    for (const n of mission.nodes) {
      const effs = [].concat(n.effects || []);
      (n.choices || []).forEach(c => effs.push(...(c.effects || [])));
      if (effs.some(pred)) out.push(n.id);
    }
    return out;
  }
  {
    const writesEast = e => e.set === 'east_route_confirmed';
    ok(JSON.stringify(writersOf(M5, writesEast)) === '["m5_tracks_north"]', 'east_route_confirmed: unico writer in M5 (m5_tracks_north)');
    ok(writersOf(M4, writesEast).length === 0, 'east_route_confirmed: nessun writer in M4');
    ok(writersOf(M6, writesEast).length === 0, 'east_route_confirmed: nessun writer in M6');
    ok(writersOf(M8, writesEast).length === 0, 'east_route_confirmed: nessun writer in M8');
    if (M9) ok(writersOf(M9, writesEast).length === 0, 'east_route_confirmed: nessun writer in M9');
    const mapsSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'maps.js'), 'utf8');
    ok(mapsSrc.indexOf("needsFlag: 'east_route_confirmed'") >= 0, 'js/maps.js: la porta OEJ richiede east_route_confirmed');
  }

  // -- preliminare: due sole opzioni, mai «disposizione»/staging --
  {
    const s = m5Base();
    const node = M5.nodes.find(n => n.id === 'm5_theory_initial');
    const avail = NR.availableChoices(s, M5, node);
    ok(avail.length === 2, 'prompt preliminare: esattamente due scelte');
    ok(!avail.some(c => /staging/i.test(c.id) || /disposizione/i.test(c.label)), 'prompt preliminare: nessuna opzione «staging»/«disposizione»');
    scanRendered(NR.prepareNode(s, M5, 'm5_theory_initial').pages, 'm5_theory_initial');
  }

  // -- 6 ordini di osservazione completano tutti la mission --
  function permutations3(arr) {
    const out = [];
    for (let i = 0; i < arr.length; i++) for (let j = 0; j < arr.length; j++) for (let k = 0; k < arr.length; k++) {
      if (i === j || j === k || i === k) continue;
      out.push([arr[i], arr[j], arr[k]]);
    }
    return out;
  }
  const ORDERS = permutations3(['m5_mound', 'm5_ring', 'm5_scene']);
  let ordersCompleted = 0;
  for (const order of ORDERS) {
    const s = m5Base();
    let pt = NR.prepareNode(s, M5, 'm5_theory_initial'); NR.commitNode(s, M5, pt);
    doChoice(M5, s, 'm5_theory_initial', 'theory_degeneration');
    // -- la revisione è irraggiungibile prima del gate, provata DOPO ogni passo --
    for (const nodeId of order) {
      doNode(M5, s, nodeId);
      const gateMet = s.nodes_done.m5_mound && s.nodes_done.m5_scene && NR.peekProp(s, 'P3A').formulation.status === 'formulated';
      if (!gateMet) ok(!NR.prepareNode(s, M5, 'm5_theory_revision').ok, order.join('/') + ': revisione bloccata dopo ' + nodeId);
    }
    doNode(M5, s, 'm5_cmp_ring'); doChoice(M5, s, 'm5_cmp_ring', 'ring_a');
    ok(NR.peekProp(s, 'P3A').formulation.created_from.join(',') === 'E8A_ANELLO_POSIZIONE,E8B_ANELLO_SUPERFICIE', order.join('/') + ': P3A created_from esatto');
    let pv = NR.prepareNode(s, M5, 'm5_theory_revision'); NR.commitNode(s, M5, pv);
    doChoice(M5, s, 'm5_theory_revision', 'revision_keep');
    doNode(M5, s, 'm5_report_intro');
    doChoice(M5, s, 'm5_s1', 's1_institutional');
    doNode(M5, s, 'm5_tracks_north');
    ok(NR.checkCompletion(s, M5) === true, order.join('/') + ': M5 completa');
    ordersCompleted++;
  }
  ok(ordersCompleted === 6, '6 ordini di osservazione, tutti completati (' + ordersCompleted + ')');

  // -- confronto obbligatorio: teoria finale forzata via scrittura diretta del
  //    valore NON basta, il gate del rapporto è sulla proposizione P3A --
  {
    const s = m5Base();
    doNode(M5, s, 'm5_mound'); doNode(M5, s, 'm5_scene');
    s.values.m5_final_theory = 'degeneration'; // scrittura diretta, aggira la macchina della teoria
    ok(NR.peekProp(s, 'P3A').formulation.status === 'unformulated', 'confronto obbligatorio: P3A ancora unformulated');
    const blocked = NR.prepareNode(s, M5, 'm5_report_intro');
    ok(!blocked.ok, 'confronto obbligatorio: rapporto bloccato anche con teoria finale forzata, senza P3A');
  }

  // -- impeto (degeneration): contestato, mai confutato, nessun loop --
  {
    const s = m5Base();
    let pt = NR.prepareNode(s, M5, 'm5_theory_initial'); NR.commitNode(s, M5, pt);
    doChoice(M5, s, 'm5_theory_initial', 'theory_degeneration');
    doNode(M5, s, 'm5_mound'); doNode(M5, s, 'm5_scene');
    doNode(M5, s, 'm5_cmp_ring'); doChoice(M5, s, 'm5_cmp_ring', 'ring_a');
    let pv = NR.prepareNode(s, M5, 'm5_theory_revision'); NR.commitNode(s, M5, pv);
    doChoice(M5, s, 'm5_theory_revision', 'revision_keep');
    const pi = NR.prepareNode(s, M5, 'm5_report_intro');
    scanRendered(pi.pages, 'm5_report_intro/degeneration');
    ok(pi.pages.some(pg => pg.id === 'm5.b9.report.contest.p01') && pi.pages.some(pg => pg.id === 'm5.b9.report.contest.p02') && pi.pages.some(pg => pg.id === 'm5.b9.report.contest.p03'), 'impeto: le 3 pagine di contestazione appaiono');
    ok(!pi.pages.some(pg => pg.id === 'm5.b9.report.accept.p01'), 'impeto: nessuna pagina «come tua»');
    NR.commitNode(s, M5, pi);
    ok(s.values.m5_final_theory === 'degeneration', 'impeto: teoria finale resta degeneration (contestata, non refutata)');
    ok(s.nodes_done.m5_report_intro === true, 'impeto: rapporto committato, nessun loop');
    doChoice(M5, s, 'm5_s1', 's1_institutional');
    ok(NR.prepareNode(s, M5, 'm5_report_intro').continuation === 'm5_s1', 'impeto: senza east_route ancora nessun repeat (continuation, non already_completed)');
    doNode(M5, s, 'm5_tracks_north');
    const rep = NR.prepareNode(s, M5, 'm5_report_intro');
    ok(rep.already_completed === true && rep.pages[0].id === 'm5.repeat.report', 'impeto: repeat SOLO dopo east_route_confirmed');
  }

  // -- sospensione (withheld): first_staging → «come tua» --
  {
    const s = m5Base();
    let pt = NR.prepareNode(s, M5, 'm5_theory_initial'); NR.commitNode(s, M5, pt);
    doChoice(M5, s, 'm5_theory_initial', 'theory_withhold');
    doNode(M5, s, 'm5_mound'); doNode(M5, s, 'm5_scene');
    doNode(M5, s, 'm5_cmp_ring'); doChoice(M5, s, 'm5_cmp_ring', 'ring_a');
    let pf = NR.prepareNode(s, M5, 'm5_theory_first'); NR.commitNode(s, M5, pf);
    doChoice(M5, s, 'm5_theory_first', 'first_staging');
    const pi = NR.prepareNode(s, M5, 'm5_report_intro');
    scanRendered(pi.pages, 'm5_report_intro/staging');
    ok(pi.pages.some(pg => pg.id === 'm5.b9.report.accept.p01'), 'sospensione→staging: pagina «come tua» presente');
    ok(!pi.pages.some(pg => pg.id === 'm5.b9.report.contest.p01'), 'sospensione→staging: nessuna pagina di contestazione');
  }

  // -- open: entrambe le letture portate --
  {
    const s = m5Base();
    let pt = NR.prepareNode(s, M5, 'm5_theory_initial'); NR.commitNode(s, M5, pt);
    doChoice(M5, s, 'm5_theory_initial', 'theory_withhold');
    doNode(M5, s, 'm5_mound'); doNode(M5, s, 'm5_scene');
    doNode(M5, s, 'm5_cmp_ring'); doChoice(M5, s, 'm5_cmp_ring', 'ring_a');
    let pf = NR.prepareNode(s, M5, 'm5_theory_first'); NR.commitNode(s, M5, pf);
    doChoice(M5, s, 'm5_theory_first', 'first_open');
    const pi = NR.prepareNode(s, M5, 'm5_report_intro');
    scanRendered(pi.pages, 'm5_report_intro/open');
    ok(pi.pages.some(pg => pg.id === 'm5.b9.report.open.p01'), 'open: entrambe le letture portate a verbale');
  }

  // -- stufa/carte: saltate, prese in ordine, riga condizionata una sola volta --
  {
    const s = m5Base();
    ok(NR.checkCompletion(s, M5) === false, 'stufa/carte facoltative: base non completa');
    // saltate: M5 completa comunque
    let s2 = m5Base();
    doNode(M5, s2, 'm5_mound'); doNode(M5, s2, 'm5_ring'); doNode(M5, s2, 'm5_scene');
    let pt2 = NR.prepareNode(s2, M5, 'm5_theory_initial'); NR.commitNode(s2, M5, pt2);
    doChoice(M5, s2, 'm5_theory_initial', 'theory_degeneration');
    doNode(M5, s2, 'm5_cmp_ring'); doChoice(M5, s2, 'm5_cmp_ring', 'ring_a');
    let pv2 = NR.prepareNode(s2, M5, 'm5_theory_revision'); NR.commitNode(s2, M5, pv2);
    doChoice(M5, s2, 'm5_theory_revision', 'revision_keep');
    doNode(M5, s2, 'm5_report_intro');
    doChoice(M5, s2, 'm5_s1', 's1_institutional');
    doNode(M5, s2, 'm5_tracks_north');
    ok(NR.checkCompletion(s2, M5) === true, 'stufa/carte saltate: M5 completa comunque');
    ok(!s2.evidence.E_STUFA && !s2.evidence.E_CARTE, 'stufa/carte saltate: nessuna evidenza facoltativa scritta');
    // trovate: la riga «non una sera sola» appare SOLO sulla seconda, mai su entrambe se se ne osserva una sola
    let s3 = m5Base();
    const onlyStove = NR.prepareNode(s3, M5, 'm5_stove');
    ok(!onlyStove.pages.some(pg => pg.id === 'm5.a7.stove.p04'), 'stufa presa da sola: nessuna riga condizionata');
    NR.commitNode(s3, M5, onlyStove);
    const cardsAfterStove = NR.prepareNode(s3, M5, 'm5_cards');
    ok(cardsAfterStove.pages.filter(pg => pg.id === 'm5.a8.cards.p04').length === 1, 'stufa poi carte: riga condizionata esattamente una volta');
    NR.commitNode(s3, M5, cardsAfterStove);
    ok(s3.evidence.E_STUFA === true && s3.evidence.E_CARTE === true, 'stufa+carte: entrambe le evidenze scritte');
  }

  // -- save/reload: revisione e taglio nord preservano lo stato --
  {
    const s = m5Base();
    doNode(M5, s, 'm5_mound'); doNode(M5, s, 'm5_ring'); doNode(M5, s, 'm5_scene');
    let pt = NR.prepareNode(s, M5, 'm5_theory_initial'); NR.commitNode(s, M5, pt);
    doChoice(M5, s, 'm5_theory_initial', 'theory_degeneration');
    doNode(M5, s, 'm5_cmp_ring'); doChoice(M5, s, 'm5_cmp_ring', 'ring_a');
    let pv = NR.prepareNode(s, M5, 'm5_theory_revision'); NR.commitNode(s, M5, pv);
    doChoice(M5, s, 'm5_theory_revision', 'revision_keep');
    const afterRevision = JSON.parse(JSON.stringify(s));
    const rt1 = JSON.parse(JSON.stringify(afterRevision));
    ok(JSON.stringify(rt1) === JSON.stringify(afterRevision), 'round-trip dopo la revisione: valori/flag/evidenze/nodes_done/comparisons/obiettivi preservati');
    ok(rt1.values.m5_final_theory === 'degeneration' && rt1.comparisons.m5_cmp_ring.completed === true, 'round-trip dopo la revisione: contenuto verificato');
    doNode(M5, s, 'm5_report_intro');
    doChoice(M5, s, 'm5_s1', 's1_institutional');
    doNode(M5, s, 'm5_tracks_north');
    const afterTracks = JSON.parse(JSON.stringify(s));
    const rt2 = JSON.parse(JSON.stringify(afterTracks));
    ok(JSON.stringify(rt2) === JSON.stringify(afterTracks), 'round-trip dopo il taglio nord: stato preservato');
    ok(rt2.flags.east_route_confirmed === true && rt2.evidence.E_TRACCE_EST === true, 'round-trip dopo il taglio nord: east_route + evidenza preservati');
    const objs = NR.trueObjectives(NR.deserialize(NR.serialize(s)), M5);
    ok(objs.length === 1 && objs[0].id === 'obj_m5_7', 'round-trip: obiettivo finale invariato dopo deserialize del runtime');
  }

  console.log('act-3-flow: runtime path OK (' + checks + ' controlli finora)');
})();

/* ===================== (b) adapter path ===================== */
(function adapterPath() {
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  global.window = global;
  global.addEventListener = function () {};
  global.requestAnimationFrame = function () {};
  const J = (f) => path.join(__dirname, '..', 'js', f);
  ['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js', 'engine.js', 'glue.js',
    'narrative-runtime.js', 'narrative-data.gen.js', 'narrative-engine-adapter.js']
    .forEach((f) => require(J(f)));
  const GAME = global.GAME;
  const NR = GAME.NarrativeRuntime;
  const A = GAME.NarrativeAdapter;
  const M5d = GAME.NarrativeData.missions.M5;
  const M4d = GAME.NarrativeData.missions.M4;

  console.log('# act-3-flow: adapter path (Hawk placements on traincar)');

  const state = NR.createState();
  A.enable({ mission: M5d, missions: [M4d, M5d], state: state, container: {} });
  const entities = A._debugNarrativeEntities.filter(e => e.map_id === 'traincar');
  const hawkBridge = entities.find(e => e.npc.id === 'hawk_bridge');
  const hawkDoor = entities.find(e => e.npc.id === 'hawk_door');
  const hawkCut = entities.find(e => e.npc.id === 'hawk_cut');
  const truman = entities.find(e => e.npc.id === 'truman');
  ok(!!hawkBridge && !!hawkDoor && !!hawkCut, 'traincar: tre collocazioni di Hawk registrate');
  ok(hawkBridge.npc.x === 5 && hawkBridge.npc.y === 6, 'hawk_bridge: (5,6) sulla sponda est, prima della scoperta');
  // Playthrough E1: la riga 7 fra il ponte (x<=4) e il vagone (x>=9) è l'unico
  // attraversamento del torrente; un attore lì chiude Cooper sulle assi.
  entities.filter(e => e.map_id === 'traincar').forEach(e => {
    ok(!(e.npc.y === 7 && e.npc.x >= 3 && e.npc.x <= 8), e.npc.id + ': mai sulla riga 7 dell\'attraversamento (softlock)');
  });
  ok(hawkDoor.npc.x === 14 && hawkDoor.npc.y === 8, 'hawk_door: (14,8) fuori dalla porta, dopo la scoperta e prima di S1');
  ok(hawkCut.npc.x === 22 && hawkCut.npc.y === 3, 'hawk_cut: (22,3) dopo S1');
  ok(truman.npc.x === 9 && truman.npc.y === 8, 'truman: (9,8) sul bordo sud dei binari');

  function evalWhen(when) { return A._debugEvalWhen(when); }
  // Playthrough E1 (2026-09-10): One Eyed Jacks arrivava senza NPC (il pass 01
  // aveva ritirato i classici senza registrare i sostituti narrativi).
  const allEntities = A._debugNarrativeEntities;
  const jq = allEntities.find(e => e.npc.id === 'jacques' && e.map_id === 'oej');
  const au = allEntities.find(e => e.npc.id === 'audrey' && e.map_id === 'oej');
  ok(!!jq && jq.npc.x === 7 && jq.npc.y === 5, 'oej: Jacques narrativo al banco (7,5)');
  ok(!!au && au.npc.x === 13 && au.npc.y === 7, 'oej: Audrey narrativa al tavolo (13,7)');

  const HAWKS = [hawkBridge, hawkDoor, hawkCut];
  function hawksPresent(s) { A.setState(s); return HAWKS.filter(e => evalWhen(e.when)); }
  function assertExactlyOneHawk(s, label) {
    const present = hawksPresent(s);
    ok(present.length === 1, label + ': esattamente un hawk_* presente (trovati: ' + present.map(e => e.npc.id).join(',') + ')');
    return present[0];
  }
  {
    const s = NR.createState();
    A.setState(s);
    ok(hawksPresent(s).length === 0, 'stato vergine (m5_bridge non fatto): nessun hawk_* presente');
    ok(evalWhen(hawkBridge.when) === false, 'hawk_bridge: assente su stato vergine (m5_bridge non fatto)');
    doNode(M5d, s, 'm5_bridge');
    ok(assertExactlyOneHawk(s, 'dopo il ponte').npc.id === 'hawk_bridge', 'dopo il ponte: solo hawk_bridge presente');
    ok(evalWhen(hawkDoor.when) === false, 'hawk_door: assente prima della scoperta');
    doNode(M5d, s, 'm5_discovery');
    ok(assertExactlyOneHawk(s, 'dopo la scoperta').npc.id === 'hawk_door', 'dopo la scoperta: solo hawk_door presente');
    ok(evalWhen(hawkCut.when) === false, 'hawk_cut: assente prima di S1');
    ok(evalWhen(truman.when) === false, 'truman: assente senza teoria finale');
    s.values.m5_final_theory = 'degeneration';
    ok(evalWhen(truman.when) === true, 'truman: presente con teoria finale, prima di east_route');
    s.flags.east_route_confirmed = true;
    ok(evalWhen(truman.when) === false, 'truman: assente dopo east_route_confirmed');
    ok(evalWhen(hawkCut.when) === false, 'hawk_cut: ancora assente senza s1');
    s.values.s1 = 'institutional';
    ok(assertExactlyOneHawk(s, 'dopo s1').npc.id === 'hawk_cut', 'dopo s1: solo hawk_cut presente');
    ok(evalWhen(hawkDoor.when) === false, 'hawk_door: assente dopo s1');
    ok(evalWhen(hawkCut.when) === true, 'hawk_cut: presente dopo s1');
  }
  // Maintenance 2026-09-10 (story-truth v0.1, issue 1): la traversa (13,5) è
  // un target narrativo di M5 (`ring`) e coincide con l'interact classico
  // `anello_interact`; l'adapter consuma la casella ogni volta che M5 è entrata
  // (anche a missione completa e dopo la custodia S1: ramo completed/no_roots
  // di tryInteractAt), quindi il testo classico non è raggiungibile in
  // produzione. Il testo classico stesso non afferma più la proprietà.
  {
    const reg = A._debugWorldTargets.traincar;
    ok(reg && reg.ring && reg.ring.x === 13 && reg.ring.y === 5, 'traincar: target narrativo ring a (13,5)');
    const classicObj = GAME.Maps.objectAt('traincar', 13, 5);
    ok(!!classicObj && classicObj.dialogue === 'anello_interact', 'traincar: interact classico anello_interact a (13,5) (stessa casella del target ring)');
    ok(M5d.nodes.some(n => n.map_id === 'traincar' && n.target_id === 'ring'), 'M5 possiede nodi sul target ring: tryInteractAt consuma sempre la casella');
    ok(JSON.stringify(M5d.entry_condition).includes('"atto3"'), 'M5 entra con atto3: nessuna finestra classica prima della missione');
    const dl = GAME.Data.dialogues.anello_interact.pages.map(p => p.text).join(' ');
    const cl = GAME.Data.clues.anello;
    const cd = cl.document.pages.map(p => p.text).join(' ') + ' ' + cl.name + ' ' + cl.desc;
    ok(!/Laura|monile/.test(dl) && !/Laura|monile/.test(cd), 'indizio classico anello: nessuna attribuzione di proprietà (guardia ring_c)');
  }
  function doNode(mission, s, id) { const p = NR.prepareNode(s, mission, id); if (!p.ok) return p; return NR.commitNode(s, mission, p); }

  console.log('act-3-flow: adapter path OK');
})();

/* ============ (c) M6 stitch — piantone, varianti condizionali, carte ============
 * Stesso modulo caricato da (b): window=global, tutti gli script di gioco
 * presenti, quindi qui vivono sia il runtime puro sia il ponte di produzione. */
(function m6Stitch() {
  const GAME = global.GAME;
  const NR = GAME.NarrativeRuntime;
  const M6 = GAME.NarrativeData.missions.M6;
  {
    const domains = {};
    for (const [name, enumName] of Object.entries(enums.values_allowed)) domains[name] = enums.enums[enumName];
    NR.setValueDomains(domains);
  }

  console.log('# act-3-flow: M6 stitch (runtime)');

  function node6(id) { return M6.nodes.find(n => n.id === id); }
  function prep(s, id) { return NR.prepareNode(s, M6, id); }
  function run(s, id) { const p = prep(s, id); if (!p.ok) return p; const c = NR.commitNode(s, M6, p); return { ok: c.ok, prep: p }; }
  function pick(s, atId, choiceId) {
    const n = node6(atId);
    const p = NR.prepareChoice(s, M6, n, choiceId);
    if (!p.ok) return p;
    const c = NR.commitChoice(s, M6, n, p);
    if (c.ok && c.goto) run(s, c.goto);
    return { ok: c.ok, prep: p, commit: c };
  }
  /* Stato d'ingresso M6: l'uscita REALE di M5 è già provata dal percorso (a) e
   * dalla matrice canonica di narrative-validate.js; qui la si sintetizza per
   * isolare le varianti del cucito. */
  function m6Entry(opts) {
    const o = opts || {};
    const s = NR.createState();
    const effects = [
      { set: 'east_route_confirmed' },
      { value: 'm5_final_theory', to: o.theory || 'degeneration' },
      { value: 's1', to: o.s1 || 'institutional' }
    ];
    if (o.cards) effects.push({ evidence: 'E_CARTE' });
    if (o.audreyIndaga) effects.push({ set: 'audrey_indaga' });
    NR.applyEffects(s, effects);
    return s;
  }
  // fino al fermo di Renault (tattica scelta, P5 formulata, arresto committato)
  function toArrest(s, tactic) {
    run(s, 'm6_ferry');
    pick(s, 'm6_tactic', 'tactic_' + (tactic || 'prova'));
    run(s, 'm6_p5');
    pick(s, 'm6_p5', 'p5_present');
    run(s, 'm6_arrest');
    return s;
  }

  // -- C2/C2b/C2c: il passaggio dall'ospedale è OBBLIGATORIO e il rifiuto parla --
  {
    const s = toArrest(m6Entry({}), 'prova');
    ok(s.flags.jacques_preso === true, 'piantone: base = Renault fermato');
    ok(!prep(s, 'm6_return_night').ok, 'piantone: rapporto notturno NON preparabile senza il registro di turno');
    ok(prep(s, 'm6_return_night_early').ok, 'piantone: al suo posto è preparabile il rinvio di Truman');
    ok(NR.activeObjective(s, M6).id === 'obj_m6_3b', 'piantone: obiettivo = passa dall\'ospedale');
    const flagsBefore = JSON.stringify(s.flags);
    ok(run(s, 'm6_return_night_early').ok, 'piantone: il rinvio si gioca');
    ok(JSON.stringify(s.flags) === flagsBefore, 'piantone: il rinvio non scrive nessun flag');
    ok(prep(s, 'm6_return_night_early').already_completed === true &&
       prep(s, 'm6_return_night_early').pages[0].id === 'm6.repeat.return_night_early',
      'piantone: tornando da Truman prima dell\'ospedale il rinvio si ripete');
    ok(!prep(s, 'm6_return_night').ok, 'piantone: il rapporto resta chiuso anche dopo il rinvio');
    const guardPrep = prep(s, 'm6_hospital_guard');
    ok(guardPrep.ok && guardPrep.pages.map(p => p.id).join(',') ===
      'm6.b7c.guard.p01,m6.b7c.guard.p02,m6.b7c.guard.p03,m6.b7c.guard.p04',
      'piantone: le quattro pagine del registro di turno');
    NR.commitNode(s, M6, guardPrep);
    ok(s.notebook.some(nt => nt.id === 'm6.note.guard'), 'piantone: sola annotazione, nessun flag di registro');
    ok(Object.keys(s.flags).length === 3, 'piantone: nessun flag nuovo (preso + east_route + admitted)');
    ok(!prep(s, 'm6_return_night_early').ok, 'piantone: visto il piantone, il rinvio sparisce dalla root Truman');
    ok(prep(s, 'm6_return_night').ok, 'piantone: ora il rapporto notturno è preparabile');
    ok(NR.activeObjective(s, M6).id === 'obj_m6_4', 'piantone: obiettivo torna alla centrale');
    // esclusività sul registro: la coda B8b vive solo dopo la morte
    ok(!prep(s, 'm6_hospital').ok, 'piantone: la coda B8b resta chiusa finché Renault è vivo');
  }

  // -- C3a: la variante Audrey del rapporto notturno --
  for (const seen of [false, true]) {
    const s = m6Entry({ audreyIndaga: seen });
    run(s, 'm6_ferry');
    if (seen) ok(run(s, 'm6_audrey').ok && s.flags.audrey_vista_oej === true, 'Audrey: vista a One Eyed Jacks');
    pick(s, 'm6_tactic', 'tactic_prova');
    run(s, 'm6_p5'); pick(s, 'm6_p5', 'p5_present');
    run(s, 'm6_arrest'); run(s, 'm6_hospital_guard');
    const pages = prep(s, 'm6_return_night').pages.map(p => p.id);
    ok(pages.includes('m6.b7b.night.audrey') === seen,
      'Audrey: la riga di Truman sulla barca delle otto compare SOLO se è stata vista (' + seen + ')');
  }

  // -- C3b: la correzione «impeto» solo con la teoria degeneration --
  for (const theory of ['degeneration', 'staging', 'open']) {
    const s = m6Entry({ theory });
    toArrest(s, 'prova');
    run(s, 'm6_hospital_guard');
    run(s, 'm6_return_night');
    const pages = prep(s, 'm6_news').pages.map(p => p.id);
    ok(pages.includes('m6.b8.news.cooper_impeto') === (theory === 'degeneration'),
      'impeto: la correzione a verbale compare SOLO con teoria finale degeneration (' + theory + ')');
    ok(pages.includes('m6.b8.news.cooper_prova'), 'impeto: la battuta per tattica resta sempre resa (' + theory + ')');
    if (theory === 'degeneration') {
      ok(pages.indexOf('m6.b8.news.cooper_impeto') > pages.indexOf('m6.b8.news.cooper_prova'),
        'impeto: la correzione segue la battuta per tattica');
    }
  }

  // -- C3c: registro + eco S1 nel ponte verso l'Atto 4 --
  for (const hospital of [false, true]) for (const s1 of ['institutional', 'documented_custody']) {
    const s = m6Entry({ s1 });
    toArrest(s, 'pressione');
    run(s, 'm6_hospital_guard'); run(s, 'm6_return_night'); run(s, 'm6_news');
    if (hospital) run(s, 'm6_hospital');
    NR.applyEffects(s, [{ set: 'gigante1' }]);
    const pages = prep(s, 'm6_atto4_bridge').pages.map(p => p.id);
    ok(pages.includes('m6.b9.atto4.register') === hospital,
      'ponte Atto 4: la riga sul registro compare SOLO dopo la coda B8b (hosp' + hospital + ')');
    ok(pages.includes('m6.b9.atto4.s1_safe') === (s1 === 'institutional'), 'ponte Atto 4: eco S1 cassaforte solo con custodia istituzionale (' + s1 + ')');
    ok(pages.includes('m6.b9.atto4.s1_pocket') === (s1 === 'documented_custody'), 'ponte Atto 4: eco S1 tasca solo con custodia documentata (' + s1 + ')');
    ok(pages.filter(id => id.indexOf('m6.b9.atto4.s1_') === 0).length === 1, 'ponte Atto 4: le due eco S1 sono esclusive (' + s1 + ')');
  }

  // -- C1a/C1b: richiamo delle carte e confronto facoltativo --
  {
    const CMP = { prova: 'm6_cmp_cards_prova', pressione: 'm6_cmp_cards_pressione', falsa_sicurezza: 'm6_cmp_cards_falsa' };
    const ALL = Object.values(CMP);
    // senza E_CARTE: nessun richiamo al tavolo, nessun confronto
    {
      const s = m6Entry({});
      run(s, 'm6_ferry');
      ok(!prep(s, 'm6_tactic').pages.some(p => p.id === 'm6.b4.tactic.cards_recall'),
        'carte: senza il mazzo del vagone Cooper non fa il richiamo al tavolo');
      pick(s, 'm6_tactic', 'tactic_prova');
      ALL.forEach(id => ok(!prep(s, id).ok, 'carte: senza E_CARTE il confronto ' + id + ' è chiuso'));
      ok(NR.notebookActions(s, [M6]).every(a => ALL.indexOf(a.node.id) === -1), 'carte: senza E_CARTE nessun confronto carte nel taccuino');
    }
    for (const [tactic, cmpId] of Object.entries(CMP)) {
      const s = m6Entry({ cards: true });
      run(s, 'm6_ferry');
      ok(prep(s, 'm6_tactic').pages.some(p => p.id === 'm6.b4.tactic.cards_recall'),
        'carte: con E_CARTE il richiamo al mazzo precede il prompt (' + tactic + ')');
      ALL.forEach(id => ok(!prep(s, id).ok, 'carte: prima dell\'ammissione il confronto ' + id + ' è chiuso (' + tactic + ')'));
      pick(s, 'm6_tactic', 'tactic_' + tactic);
      const open = NR.notebookActions(s, [M6]).filter(a => ALL.indexOf(a.node.id) !== -1);
      ok(open.length === 1 && open[0].node.id === cmpId,
        'carte: nel taccuino UN solo confronto carte, quello della testimonianza raccolta (' + tactic + ')');
      ok(open[0].required_evidence.length === 2 && open[0].required_evidence.indexOf('E_CARTE') !== -1,
        'carte: la coppia richiesta è E_CARTE + la testimonianza del ramo (' + tactic + ')');
      ok(NR.notebookPairStatus(s, [M6], open[0].required_evidence).status === 'available',
        'carte: la coppia si risolve senza ambiguità (' + tactic + ')');
      ALL.filter(id => id !== cmpId).forEach(id => ok(!prep(s, id).ok, 'carte: gli altri due confronti restano chiusi (' + id + ')'));
      // lettura respinta: nessuna attribuzione, retry
      const cmpNode = node6(cmpId);
      const bad = NR.prepareChoice(s, M6, cmpNode, 'cards_killer');
      ok(bad.ok && bad.retry === true, 'carte: «ha ucciso lui» è una lettura respinta con retry (' + tactic + ')');
      NR.commitChoice(s, M6, cmpNode, bad);
      ok(NR.peekProp(s, 'P5').formulation.status === 'unformulated', 'carte: la lettura respinta non formula P5 (' + tactic + ')');
      // lettura accettata: sola annotazione, P5 resta di m6_p5
      const good = NR.prepareChoice(s, M6, cmpNode, 'cards_hand');
      ok(good.ok, 'carte: la lettura sulla mano al banco è disponibile (' + tactic + ')');
      NR.commitChoice(s, M6, cmpNode, good);
      ok(NR.peekProp(s, 'P5').formulation.status === 'unformulated',
        'carte: nemmeno la lettura accettata formula P5 — m6_p5 resta l\'unico formulatore (' + tactic + ')');
      ok(s.notebook.some(nt => nt.id === 'm6.note.cards_bank.' + (tactic === 'falsa_sicurezza' ? 'falsa' : tactic)),
        'carte: il confronto lascia SOLO un\'annotazione (' + tactic + ')');
      ok(Object.keys(s.flags).indexOf('m6_cards_compared') === -1, 'carte: nessun flag nuovo (' + tactic + ')');
      // il runtime marca `completed` solo un confronto che FORMULA una proposizione:
      // questo non lo fa mai, quindi resta riconsultabile e non deve mai restare muto
      const still = NR.notebookActions(s, [M6]).filter(a => ALL.indexOf(a.node.id) !== -1);
      ok(still.length === 1 && still[0].node.id === cmpId, 'carte: il confronto resta riconsultabile, mai «nessun filo» (' + tactic + ')');
      ok(NR.availableChoices(s, M6, cmpNode).length === 2, 'carte: alla seconda visita entrambe le letture restano offerte, mai un\'interazione muta (' + tactic + ')');
      ok(NR.notebookPairStatus(s, [M6], open[0].required_evidence).status === 'available', 'carte: la coppia resta risolvibile, mai «nessun filo» (' + tactic + ')');
      const notesBefore = s.notebook.length;
      const again = NR.prepareChoice(s, M6, cmpNode, 'cards_hand');
      NR.commitChoice(s, M6, cmpNode, again);
      ok(s.notebook.length === notesBefore, 'carte: rigiocare non duplica l\'annotazione (upsert per id) (' + tactic + ')');
      // P5 nasce comunque solo dal suo beat
      run(s, 'm6_p5'); pick(s, 'm6_p5', 'p5_present');
      ok(NR.peekProp(s, 'P5').formulation.status === 'formulated' &&
         NR.peekProp(s, 'P5').formulation.created_from.join(',') === 'jacques_admitted_presence',
        'carte: P5 nasce ancora e solo dal beat B6b (' + tactic + ')');
    }
  }

  // -- C4: audrey_indaga passa davvero dal layer classico al runtime --
  {
    require(path.join(__dirname, '..', 'js', 'narrative-production.js'));
    const NP = GAME.NarrativeProduction;
    const D = GAME.Data;
    ok(D.audrey_a2 === undefined, 'sync Audrey: i dialoghi classici vivono in GAME.Data.dialogues');
    const classicFlags = {};
    // l'azione classica dell'Atto 2: parlare con Audrey al Great Northern
    [D.dialogues.audrey_a2, D.dialogues.audrey_a2_ben].forEach(dlg => {
      ok(dlg.setFlag === 'audrey_indaga', 'sync Audrey: il dialogo classico scrive audrey_indaga');
      classicFlags[dlg.setFlag] = true;
    });
    const s = m6Entry({});
    ok(!s.flags.audrey_indaga, 'sync Audrey: lo stato narrativo parte senza il flag');
    run(s, 'm6_ferry');
    ok(!NR.prepareNode(s, M6, 'm6_audrey').ok, 'sync Audrey: senza ponte il nodo facoltativo è irraggiungibile');
    NP.syncClassicToNarrative(NR, s, classicFlags);
    ok(s.flags.audrey_indaga === true, 'sync Audrey: syncClassicToNarrative porta il flag nel runtime');
    ok(NR.prepareNode(s, M6, 'm6_audrey').ok, 'sync Audrey: dopo il ponte m6_audrey è preparabile');
    ok(run(s, 'm6_audrey').ok && s.flags.audrey_vista_oej === true, 'sync Audrey: il nodo si gioca e scrive audrey_vista_oej');
  }

  console.log('act-3-flow: M6 stitch runtime OK');
})();

/* ============ (d) M6 stitch — piantoni sulla mappa dell'ospedale ============ */
(function m6Guards() {
  const GAME = global.GAME;
  const NR = GAME.NarrativeRuntime;
  const A = GAME.NarrativeAdapter;
  const D = GAME.NarrativeData;
  A.enable({ mission: D.missions.M6, missions: [D.missions.M4, D.missions.M5, D.missions.M6], state: NR.createState(), container: {} });

  console.log('# act-3-flow: M6 stitch (piantoni, adapter)');
  const ward = A._debugNarrativeEntities.filter(e => e.map_id === 'hospital');
  const piantone = ward.find(e => e.npc.id === 'piantone');
  const doubled = ward.find(e => e.npc.id === 'piantone_ronette');
  const ronette = ward.find(e => e.npc.id === 'ronette');
  ok(!!piantone && !!doubled, 'ospedale: le due collocazioni del piantone sono registrate');
  ok(piantone.npc.id !== doubled.npc.id, 'ospedale: id distinti (la sync identifica per npc.id)');
  ok(piantone.npc.dialogue === null && doubled.npc.dialogue === null, 'ospedale: i piantoni sono scenografia, mai attori con dialogo');
  ok(piantone.npc.sprite === 'andy' && doubled.npc.sprite === 'andy', 'ospedale: sprite da vice della contea, mai hawk/truman');
  ok(!!GAME.sprites.CHARS.andy, 'ospedale: lo sprite del piantone esiste nel catalogo chars.js');
  const rows = GAME.Maps.hospital.rows;
  const walkable = (x, y) => rows[y][x] === '.';
  ok(walkable(piantone.npc.x, piantone.npc.y), 'piantone: casella calpestabile (7,3), davanti alla porta doppia nord');
  // Playthrough E1: il testo dice "in fondo al reparto, davanti a una porta
  // chiusa" — l'unica porta interna disegnata e' la doppia porta nord (6-7,1-2).
  ok(rows[piantone.npc.y - 1][piantone.npc.x] === 'T' && piantone.npc.dir === 'up',
    'piantone: contro la parete nord, rivolto alla porta chiusa');
  ok(Math.abs(piantone.npc.x - ronette.npc.x) >= 4, 'piantone: lontano dal letto di Ronette (' + piantone.npc.x + ' vs ' + ronette.npc.x + ')');
  ok(walkable(2, 5), 'piantone: la casella d\'accesso al letto di Ronette resta libera');
  ok(doubled.npc.x === ronette.npc.x && doubled.npc.y === ronette.npc.y + 1, 'piantone raddoppiato: davanti al letto di Ronette');
  ok(walkable(doubled.npc.x, doubled.npc.y), 'piantone raddoppiato: casella calpestabile');

  const when = (e, s) => { A.setState(s); return A._debugEvalWhen(e.when); };
  {
    const s = NR.createState();
    ok(when(piantone, s) === false && when(doubled, s) === false, 'ospedale: nessun piantone prima del fermo');
    NR.applyEffects(s, [{ set: 'jacques_preso' }]);
    ok(when(piantone, s) === true && when(doubled, s) === false, 'ospedale: con Renault in custodia, un piantone davanti alla porta');
    NR.applyEffects(s, [{ set: 'jacques_dead' }]);
    ok(when(piantone, s) === false && when(doubled, s) === true, 'ospedale: morto Renault, la sorveglianza si sposta su Ronette');
  }
  console.log('act-3-flow: M6 stitch guards OK');
})();

console.log(`\nact-3-flow: ${checks}/${checks}`);
