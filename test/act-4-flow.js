/* test/act-4-flow.js — Act 4 (M8, "Il presagio") wiring, no browser.
 * (a) runtime path: all 27 promise x warning x focus routes through the pure
 *     runtime to node_done m8_station, with the mandatory hospital-style
 *     gates (cmp_letters before cmp_diary, promise_echo never skippable),
 *     T_LELAND_TAXI written exactly once, objective partition (exactly one
 *     active objective at every checkpoint), the m8_station conditional
 *     pages (valigia/lago/hook/sarah), wording guards over every M8 page/
 *     label/objective text, save/reload round-trip.
 * (b) adapter path: NARRATIVE_ENTITIES on diner/roadhouse/town (Leland roots
 *     exclusivity, Roadhouse crowd window, the giant's when/props, the two
 *     shore Hawk placements), WORLD_TARGETS.town.town_crossroads walkable.
 * node test/act-4-flow.js */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

const ROOT = path.join(__dirname, '..', 'narrative');
const M8src = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M8.json'), 'utf8'));
const enums = JSON.parse(fs.readFileSync(path.join(ROOT, 'state-enums.json'), 'utf8'));

/* ===================== wording guards (static, on the JSON source) ===================== */
(function wordingGuards() {
  console.log('# act-4-flow: wording guards (M8.json)');

  function collect(node) {
    const out = [];
    (node.pages || []).forEach((p) => out.push({ owner: node.id, id: p.id, text: p.text }));
    (node.pages_after_branch || []).forEach((p) => out.push({ owner: node.id, id: p.id, text: p.text }));
    if (node.pages_by_value) {
      Object.values(node.pages_by_value.cases).forEach((arr) => arr.forEach((p) => out.push({ owner: node.id, id: p.id, text: p.text })));
    }
    (node.choices || []).forEach((c) => {
      out.push({ owner: node.id, id: 'choice:' + c.id, text: c.label, choiceId: c.id });
      (c.feedback_pages || []).forEach((p) => out.push({ owner: node.id, id: p.id, text: p.text, choiceId: c.id }));
    });
    if (node.repeat) out.push({ owner: node.id, id: node.repeat.id, text: node.repeat.text });
    if (node.rules && node.rules.reopen) (node.rules.reopen.pages || []).forEach((p) => out.push({ owner: node.id, id: p.id, text: p.text }));
    return out;
  }
  let items = [];
  M8src.nodes.forEach((n) => { items = items.concat(collect(n)); });
  M8src.objectives.forEach((o) => items.push({ owner: 'objectives', id: 'obj:' + o.id, text: o.text }));

  const DESIGN_ID = /\bm8_|E9A|E9B|E3_LETTERA|E1_DIARIO|PROGRESSIVE_SIGNATURE|NAME_OVERREACH|HOUSE_OVERREACH|LETTERS_SAME_METHOD/;
  const FALSE_GUILT = /salvat|troppo tardi|se fossi|bugia|mentit/i;
  const LETTER_COUNT = /sei lettere|quattro lettere|compongono/i;
  // eccezione riveduta: solo il ramo respinto «R+O compongono un nome» (diary_b,
  // label + feedback) parla esplicitamente di lettere che non compongono nulla —
  // è il punto del testo, non una fuga di conteggio verso il player.
  const LETTER_COUNT_EXEMPT_CHOICE = 'diary_b';

  items.forEach(({ owner, id, text, choiceId }) => {
    ok(!/\bBOB\b/.test(text), owner + '/' + id + ': nessun "BOB" nel testo player-facing (' + JSON.stringify(text) + ')');
    ok(!FALSE_GUILT.test(text), owner + '/' + id + ': nessuna igiene della falsa colpa violata (' + JSON.stringify(text) + ')');
    ok(!DESIGN_ID.test(text), owner + '/' + id + ': nessun id di design nel testo player-facing (' + JSON.stringify(text) + ')');
    if (choiceId !== LETTER_COUNT_EXEMPT_CHOICE) {
      ok(!LETTER_COUNT.test(text), owner + '/' + id + ': nessun conteggio di lettere fuori dal ramo respinto diary_b (' + JSON.stringify(text) + ')');
    }
  });
  console.log('act-4-flow: wording guards OK (' + items.length + ' testi controllati)');
})();

/* ===================== (a) runtime path ===================== */
(function runtimePath() {
  global.window = undefined;
  require(path.join(__dirname, '..', 'js', 'narrative-runtime.js'));
  const NR = global.GAME.NarrativeRuntime;
  {
    const domains = {};
    for (const [name, enumName] of Object.entries(enums.values_allowed)) domains[name] = enums.enums[enumName];
    NR.setValueDomains(domains);
    NR.setValueTransitions(enums.value_transitions || {}); // presagio_status active->verified (m8_discovery)
  }
  const M8 = M8src;

  function freshState() { const s = NR.createState(); s.flags.atto4 = true; return s; }
  function m8Base() {
    const s = freshState();
    NR.applyEffects(s, [{ evidence: 'E3_LETTERA_R' }, { evidence: 'E1_DIARIO' }]);
    return s;
  }
  function doNode(mission, s, id) { const p = NR.prepareNode(s, mission, id); if (!p.ok) return p; const c = NR.commitNode(s, mission, p); return { ok: c.ok, prep: p, commit: c }; }
  function doChoice(mission, s, atId, choiceId) {
    const node = mission.nodes.find((n) => n.id === atId);
    const p = NR.prepareChoice(s, mission, node, choiceId);
    if (!p.ok) return p;
    const c = NR.commitChoice(s, mission, node, p);
    if (c.ok && c.goto) { const r = doNode(mission, s, c.goto); return { ok: r.ok, goto: c.goto, prep: p }; }
    return { ok: c.ok, prep: p, commit: c };
  }
  function oneActive(s, expectId, label) {
    const active = NR.trueObjectives(s, M8);
    ok(active.length === 1 && active[0].id === expectId, label + ': esattamente un obiettivo attivo, ' + expectId + ' (trovati: ' + active.map((o) => o.id).join(',') + ')');
  }

  console.log('# act-4-flow: runtime path (M8)');

  const ROUTE_NODE = { palmer: 'm8_route_palmer', lago: 'm8_route_lake', diner: 'm8_route_diner' };
  const PROMISES = ['accompagno', 'autonomia', 'prudenza'];
  const WARNINGS = ['palmer', 'centrale', 'nessuno'];
  const FOCUSES = ['palmer', 'lago', 'diner'];

  let routesCompleted = 0;
  for (const promise of PROMISES) {
    for (const warning of WARNINGS) {
      for (const focus of FOCUSES) {
        const label = promise + '/' + warning + '/' + focus;
        const s = m8Base();
        oneActive(s, 'obj_m8_0', label + ' @entry');

        ok(doNode(M8, s, 'm8_diner').ok, label + ': m8_diner preparabile');
        ok(doChoice(M8, s, 'm8_diner', 'promise_' + promise).ok, label + ': promessa scelta');
        oneActive(s, 'obj_m8_25', label + ' @dopo la promessa');

        ok(doNode(M8, s, 'm8_leland_taxi').ok, label + ': m8_leland_taxi giocato');
        ok(s.evidence.T_LELAND_TAXI === true, label + ': T_LELAND_TAXI scritta');
        oneActive(s, 'obj_m8_1', label + ' @dopo il taxi');
        // m8_leland_taxi si chiude sulla stessa condizione che scrive: la sua
        // entrata richiede `not evidence T_LELAND_TAXI`, quindi una seconda
        // preparazione fallisce sulle SUE condizioni prima ancora di guardare
        // nodes_done — struttura, non un repeat, a garantire il write-once.
        const evidenceBefore = JSON.stringify(s.evidence);
        const flagsBefore = JSON.stringify(s.flags);
        const rep = NR.prepareNode(s, M8, 'm8_leland_taxi');
        ok(rep.ok === false && rep.error === 'conditions_not_met: m8_leland_taxi', label + ': m8_leland_taxi non è più preparabile dopo T_LELAND_TAXI (write-once strutturale)');
        ok(JSON.stringify(s.evidence) === evidenceBefore && JSON.stringify(s.flags) === flagsBefore, label + ': il tentativo bloccato non riscrive evidence/flags');

        ok(doNode(M8, s, 'm8_roadhouse_truman').ok, label + ': m8_roadhouse_truman giocato');
        ok(s.values.presagio_status === 'active', label + ': presagio_status=active dopo il tavolo');
        oneActive(s, 'obj_m8_15', label + ' @dopo il tavolo del Roadhouse (obiettivo 150)');
        ok(M8.objectives.find((o) => o.id === 'obj_m8_15').text === 'Il telefono del Roadhouse.', 'obj_m8_15: testo esatto');

        ok(doNode(M8, s, 'm8_roadhouse_phone').ok, label + ': m8_roadhouse_phone preparabile dopo il tavolo');
        ok(doChoice(M8, s, 'm8_roadhouse_phone', 'warning_' + warning).ok, label + ': avvertimento scelto');
        ok(s.values.warning_target === warning, label + ': warning_target scritto');
        oneActive(s, 'obj_m8_2', label + ' @dopo il telefono');

        ok(doNode(M8, s, 'm8_focus_choice').ok, label + ': m8_focus_choice preparabile');
        ok(doChoice(M8, s, 'm8_focus_choice', 'focus_' + focus).ok, label + ': destinazione scelta');
        ok(s.values.focus_destination === focus, label + ': focus_destination scritto');
        oneActive(s, 'obj_m8_2', label + ' @dopo il crocevia (stesso obiettivo, verso il ritrovamento)');

        // esclusività: solo la root della destinazione scelta è viva
        for (const other of FOCUSES) {
          const avail = NR.prepareNode(s, M8, ROUTE_NODE[other]).ok;
          ok(avail === (other === focus), label + ': solo m8_route_' + focus + ' ha una root viva, non ' + ROUTE_NODE[other]);
        }
        ok(doNode(M8, s, ROUTE_NODE[focus]).ok, label + ': strada percorsa (' + ROUTE_NODE[focus] + ')');
        const expectedFoundBy = focus === 'lago' ? 'cooper' : 'hawk';
        ok(s.values.body_found_by === expectedFoundBy, label + ': body_found_by=' + expectedFoundBy);

        ok(doNode(M8, s, 'm8_discovery').ok, label + ': ritrovamento giocato');
        ok(s.flags.maddy_trovata === true, label + ': maddy_trovata scritto');
        ok(s.values.presagio_status === 'verified', label + ': presagio_status active->verified al ritrovamento');
        oneActive(s, 'obj_m8_3', label + ' @dopo il ritrovamento');

        ok(doNode(M8, s, 'm8_promise_echo').ok, label + ': eco della promessa giocato');
        // cmp_letters/cmp_diary sono nascosti finché l'eco non è avvenuto: qui
        // sono già superati, il gate vero è provato a parte più sotto.
        ok(doNode(M8, s, 'm8_cmp_letters').ok, label + ': confronto lettere R/O');
        const cd = NR.prepareNode(s, M8, 'm8_cmp_diary');
        ok(cd.ok, label + ': m8_cmp_diary preparabile dopo cmp_letters');
        NR.commitNode(s, M8, cd);
        const diaryChoice = NR.prepareChoice(s, M8, M8.nodes.find((n) => n.id === 'm8_cmp_diary'), 'diary_a');
        ok(diaryChoice.ok, label + ': lettura «firma progressiva» disponibile');
        NR.commitChoice(s, M8, M8.nodes.find((n) => n.id === 'm8_cmp_diary'), diaryChoice);
        ok(NR.peekProp(s, 'P8').formulation.status === 'formulated', label + ': P8 formulata');
        oneActive(s, 'obj_m8_35', label + ' @P8 formulata, prima della stazione');

        ok(doNode(M8, s, 'm8_station').ok, label + ': m8_station giocata');
        ok(NR.checkCompletion(s, M8) === true, label + ': M8 completa');
        oneActive(s, 'obj_m8_4', label + ' @dopo la stazione');

        // m8_station: valigia/lago condizionali + hook sempre presenti dopo p03
        const stPages = NR.prepareNode(s, M8, 'm8_station').pages.map((p) => p.id); // repeat: gia' completato
        ok(stPages[0] === 'm8.repeat.station', label + ': dopo il commit, m8_station si ripete');

        routesCompleted++;
      }
    }
  }
  ok(routesCompleted === 27, '27 percorsi promessa x avvertimento x destinazione, tutti completati (' + routesCompleted + ')');

  // -- valigia/lago: le due pagine condizionali, verificate su percorsi mirati --
  function runToStation(promise, warning, focus) {
    const s = m8Base();
    doNode(M8, s, 'm8_diner'); doChoice(M8, s, 'm8_diner', 'promise_' + promise);
    doNode(M8, s, 'm8_leland_taxi');
    doNode(M8, s, 'm8_roadhouse_truman');
    doNode(M8, s, 'm8_roadhouse_phone'); doChoice(M8, s, 'm8_roadhouse_phone', 'warning_' + warning);
    doNode(M8, s, 'm8_focus_choice'); doChoice(M8, s, 'm8_focus_choice', 'focus_' + focus);
    doNode(M8, s, ROUTE_NODE[focus]);
    doNode(M8, s, 'm8_discovery');
    doNode(M8, s, 'm8_promise_echo');
    doNode(M8, s, 'm8_cmp_letters');
    const cd = NR.prepareNode(s, M8, 'm8_cmp_diary'); NR.commitNode(s, M8, cd);
    doChoice(M8, s, 'm8_cmp_diary', 'diary_a');
    return s;
  }
  {
    // warning=palmer, focus=lago (mai passato da Palmer): valigia SI, lago SI (via Truman, testo lago è sulla chiamata mentre gia' al lago)
    const s1 = runToStation('accompagno', 'palmer', 'lago');
    const p1 = NR.prepareNode(s1, M8, 'm8_station').pages.map((p) => p.id);
    ok(p1.includes('m8.f.station.p_valigia'), 'm8_station: valigia visibile con warning=palmer, focus=lago (mai passato da Palmer)');
    ok(p1.includes('m8.f.station.p_lago'), 'm8_station: eco lago visibile con focus=lago');
    ok(p1.includes('m8.f.station.hook.p01') && p1.includes('m8.f.station.hook.p02'), 'm8_station: hook sempre presente dopo p03 (warning=palmer/focus=lago)');

    // warning=palmer, focus=palmer (passato di persona): valigia vista in C, non ripetuta in F
    const s2 = runToStation('autonomia', 'palmer', 'palmer');
    const p2 = NR.prepareNode(s2, M8, 'm8_station').pages.map((p) => p.id);
    ok(!p2.includes('m8.f.station.p_valigia'), 'm8_station: valigia NON ripetuta in F se già vista in C (warning=palmer, focus=palmer)');
    ok(!p2.includes('m8.f.station.p_lago'), 'm8_station: nessun eco lago con focus=palmer');
    ok(p2.includes('m8.f.station.hook.p01'), 'm8_station: hook presente anche con warning=palmer/focus=palmer');

    // warning=centrale, focus=diner: né valigia né lago
    const s3 = runToStation('prudenza', 'centrale', 'diner');
    const p3 = NR.prepareNode(s3, M8, 'm8_station').pages.map((p) => p.id);
    ok(!p3.includes('m8.f.station.p_valigia'), 'm8_station: nessuna valigia con warning=centrale');
    ok(!p3.includes('m8.f.station.p_lago'), 'm8_station: nessun eco lago con focus=diner');
    ok(p3.includes('m8.f.station.hook.p01') && p3.includes('m8.f.station.hook.p02'), 'm8_station: hook presente su ogni percorso (warning=centrale/focus=diner)');

    // sarah case by sarah_support_state: warning=palmer -> none, warning=centrale -> vice
    ok(p1.includes('m8.f.station.sarah_truman'), 'm8_station: sarah_support_state=none -> Truman è passato di persona (warning=palmer)');
    ok(p3.includes('m8.f.station.sarah_vice'), 'm8_station: sarah_support_state=vice -> Andy è già con Sarah (warning=centrale)');
  }

  // -- gate obbligatorio: cmp_letters PRIMA di cmp_diary, promise_echo mai saltabile --
  {
    const s = m8Base();
    doNode(M8, s, 'm8_diner'); doChoice(M8, s, 'm8_diner', 'promise_accompagno');
    doNode(M8, s, 'm8_leland_taxi');
    doNode(M8, s, 'm8_roadhouse_truman');
    doNode(M8, s, 'm8_roadhouse_phone'); doChoice(M8, s, 'm8_roadhouse_phone', 'warning_palmer');
    doNode(M8, s, 'm8_focus_choice'); doChoice(M8, s, 'm8_focus_choice', 'focus_lago');
    doNode(M8, s, 'm8_route_lake');
    doNode(M8, s, 'm8_discovery');
    ok(!NR.prepareNode(s, M8, 'm8_cmp_letters').ok, 'gate D->E: cmp_letters bloccato prima dell\'eco della promessa');
    ok(!NR.prepareNode(s, M8, 'm8_cmp_diary').ok, 'gate D->E: cmp_diary bloccato prima dell\'eco della promessa');
    doNode(M8, s, 'm8_promise_echo');
    ok(!NR.prepareNode(s, M8, 'm8_cmp_diary').ok, 'gate E: cmp_diary bloccato prima di cmp_letters (anche con eco fatto)');
    doNode(M8, s, 'm8_cmp_letters');
    ok(NR.prepareNode(s, M8, 'm8_cmp_diary').ok, 'gate E: cmp_diary si apre solo dopo cmp_letters');
  }

  // -- Leland entity: presente al diner PRIMA della promessa (m8_leland_waiting) --
  {
    const s = m8Base();
    const p = NR.prepareNode(s, M8, 'm8_leland_waiting');
    ok(p.ok, 'Leland (m8_leland_waiting): root viva prima della promessa');
  }

  // -- diary_b/diary_c: letture respinte, retry, nessuna formulazione di P8 --
  {
    const s = m8Base();
    doNode(M8, s, 'm8_diner'); doChoice(M8, s, 'm8_diner', 'promise_accompagno');
    doNode(M8, s, 'm8_leland_taxi');
    doNode(M8, s, 'm8_roadhouse_truman');
    doNode(M8, s, 'm8_roadhouse_phone'); doChoice(M8, s, 'm8_roadhouse_phone', 'warning_palmer');
    doNode(M8, s, 'm8_focus_choice'); doChoice(M8, s, 'm8_focus_choice', 'focus_lago');
    doNode(M8, s, 'm8_route_lake');
    doNode(M8, s, 'm8_discovery');
    doNode(M8, s, 'm8_promise_echo');
    doNode(M8, s, 'm8_cmp_letters');
    const cd = NR.prepareNode(s, M8, 'm8_cmp_diary'); NR.commitNode(s, M8, cd);
    const cdNode = M8.nodes.find((n) => n.id === 'm8_cmp_diary');
    const badB = NR.prepareChoice(s, M8, cdNode, 'diary_b');
    ok(badB.ok && badB.retry === true, 'diary_b («R+O compongono un nome»): respinta con retry');
    NR.commitChoice(s, M8, cdNode, badB);
    ok(NR.peekProp(s, 'P8').formulation.status === 'unformulated', 'diary_b: P8 resta unformulated dopo la lettura respinta');
    const badC = NR.prepareChoice(s, M8, cdNode, 'diary_c');
    ok(badC.ok && badC.retry === true, 'diary_c (il diario accusa qualcuno di casa): respinta con retry');
    NR.commitChoice(s, M8, cdNode, badC);
    ok(NR.peekProp(s, 'P8').formulation.status === 'unformulated', 'diary_c: P8 resta unformulated dopo la lettura respinta');
  }

  // -- save/reload: dopo il telefono, promessa+avvertimento preservati --
  {
    const s = m8Base();
    doNode(M8, s, 'm8_diner'); doChoice(M8, s, 'm8_diner', 'promise_prudenza');
    doNode(M8, s, 'm8_leland_taxi');
    doNode(M8, s, 'm8_roadhouse_truman');
    doNode(M8, s, 'm8_roadhouse_phone'); doChoice(M8, s, 'm8_roadhouse_phone', 'warning_centrale');
    const afterPhone = JSON.parse(JSON.stringify(s));
    const rt1 = NR.deserialize(NR.serialize(afterPhone));
    ok(rt1.values.promise_stance === 'prudenza' && rt1.values.warning_target === 'centrale', 'round-trip dopo il telefono: promessa + avvertimento preservati');
    ok(rt1.values.presagio_status === 'active', 'round-trip dopo il telefono: presagio_status preservato');

    // -- save/reload: dopo il focus, tutti e tre i valori preservati e il gigante rivaluta la sua finestra --
    doNode(M8, s, 'm8_focus_choice'); doChoice(M8, s, 'm8_focus_choice', 'focus_diner');
    const afterFocus = JSON.parse(JSON.stringify(s));
    const rt2 = NR.deserialize(NR.serialize(afterFocus));
    ok(rt2.values.promise_stance === 'prudenza' && rt2.values.warning_target === 'centrale' && rt2.values.focus_destination === 'diner',
      'round-trip dopo il focus: promessa + avvertimento + destinazione preservati');
    // finestra del gigante: presagio_status=active AND not value_set warning_target -> FALSA dopo il telefono (warning_target scritto)
    ok(!NR.evalCond(rt2, { all: [{ value_is: { name: 'presagio_status', equals: 'active' } }, { not: { value_set: 'warning_target' } }] }, null),
      'round-trip dopo il focus: la finestra del gigante rivaluta correttamente (falsa, warning_target già scritto)');
  }

  console.log('act-4-flow: runtime path OK (' + checks + ' controlli finora)');
})();

/* ===================== (b) adapter path ===================== */
(function adapterPath() {
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  global.window = global;
  global.addEventListener = function () {};
  global.requestAnimationFrame = function () {};
  const J = (f) => path.join(__dirname, '..', 'js', f);
  ['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js', 'engine.js', 'glue.js',
    'narrative-runtime.js', 'narrative-data.gen.js', 'narrative-engine-adapter.js', 'narrative-bootstrap.js']
    .forEach((f) => require(J(f)));
  const GAME = global.GAME;
  const NR = GAME.NarrativeRuntime;
  const A = GAME.NarrativeAdapter;
  const D = GAME.NarrativeData;
  const M8d = D.missions.M8;
  GAME.installNarrativeCatalogs({ data: D, runtime: NR }); // stesso cablaggio del boot reale (js/narrative-bootstrap.js)

  console.log('# act-4-flow: adapter path (diner/roadhouse/town)');

  function doNode(mission, s, id) { const p = NR.prepareNode(s, mission, id); if (!p.ok) return p; return NR.commitNode(s, mission, p); }
  function doChoice(mission, s, atId, choiceId) {
    const node = mission.nodes.find((n) => n.id === atId);
    const p = NR.prepareChoice(s, mission, node, choiceId);
    if (!p.ok) return p;
    return NR.commitChoice(s, mission, node, p);
  }

  const state0 = NR.createState();
  state0.flags.atto4 = true;
  A.enable({ mission: M8d, missions: [M8d], state: state0, container: {} });

  const all = A._debugNarrativeEntities;
  const diner = all.filter((e) => e.map_id === 'diner');
  const roadhouse = all.filter((e) => e.map_id === 'roadhouse');
  const town = all.filter((e) => e.map_id === 'town');

  function when(e, s) { A.setState(s); return A._debugEvalWhen(e.when); }

  // -- Leland: root live PRIMA della promessa, mai insieme alle due root --
  {
    const lelandWaiting = diner.find((e) => e.npc.id === 'leland');
    ok(!!lelandWaiting, 'diner: entità Leland registrata (m8_leland_waiting/m8_leland_taxi condividono l\'attore)');
    const s = NR.createState(); s.flags.atto4 = true;
    ok(when(lelandWaiting, s) === true, 'Leland: presente al diner prima della promessa');
    doNode(M8d, s, 'm8_diner'); doChoice(M8d, s, 'm8_diner', 'promise_accompagno');
    ok(when(lelandWaiting, s) === true, 'Leland: ancora presente dopo la promessa, prima del taxi (m8_leland_taxi)');
    doNode(M8d, s, 'm8_leland_taxi');
    ok(when(lelandWaiting, s) === false, 'Leland: root chiusa dopo T_LELAND_TAXI (nessuna root ambigua)');
  }

  // -- T_LELAND_TAXI: scritta esattamente una volta --
  {
    const s = NR.createState(); s.flags.atto4 = true;
    doNode(M8d, s, 'm8_diner'); doChoice(M8d, s, 'm8_diner', 'promise_autonomia');
    doNode(M8d, s, 'm8_leland_taxi');
    const rev = s.revision;
    doNode(M8d, s, 'm8_leland_taxi'); // seconda interazione: conditions_not_met, no-op
    ok(s.evidence.T_LELAND_TAXI === true, 'T_LELAND_TAXI: scritta');
    ok(s.revision === rev, 'T_LELAND_TAXI: la seconda interazione (bloccata) non incrementa la revisione dello stato');
  }

  // -- Roadhouse: Truman + sei entità di scenografia, finestra atto4 ∧ ¬warning_target --
  {
    const CROWD_IDS = ['bobby', 'donna', 'james', 'shelly', 'norma', 'loglady'];
    const truman = roadhouse.find((e) => e.npc.id === 'truman');
    const crowd = CROWD_IDS.map((id) => roadhouse.find((e) => e.npc.id === id));
    ok(!!truman, 'roadhouse: entità Truman registrata');
    ok(crowd.every(Boolean), 'roadhouse: le sei entità di scenografia sono registrate (' + CROWD_IDS.join(',') + ')');
    const s = NR.createState(); s.flags.atto4 = true;
    ok(when(truman, s) === true, 'roadhouse: Truman presente in finestra atto4 ∧ ¬warning_target');
    crowd.forEach((e, i) => ok(when(e, s) === true, 'roadhouse: ' + CROWD_IDS[i] + ' presente nella stessa finestra'));
    s.values.warning_target = 'nessuno';
    ok(when(truman, s) === false, 'roadhouse: Truman assente dopo warning_target scritto');
    crowd.forEach((e, i) => ok(when(e, s) === false, 'roadhouse: ' + CROWD_IDS[i] + ' assente dopo warning_target scritto'));
  }

  // -- Gigante: presente solo in presagio_status=active ∧ ¬warning_target, a 8,1, dialogue:null, un solo statico --
  {
    const gigante = roadhouse.find((e) => e.npc.id === 'gigante');
    ok(!!gigante, 'roadhouse: entità Gigante registrata');
    ok(gigante.npc.x === 8 && gigante.npc.y === 1, 'Gigante: posizione (8,1)');
    ok(gigante.npc.dialogue === null, 'Gigante: dialogue null (l\'interazione appartiene al nodo m8_giant_stage, mai un NPC muto)');
    const giantNode = M8d.nodes.find((n) => n.id === 'm8_giant_stage');
    ok(!!giantNode, 'm8_giant_stage: nodo presente');
    ok((giantNode.effects || []).length === 0, 'm8_giant_stage: nessun effetto (presenza silenziosa, nessuno stato scritto qui)');
    ok(!giantNode.choices || giantNode.choices.length === 0, 'm8_giant_stage: nessuna scelta');
    ok(giantNode.pages.length === 1, 'm8_giant_stage: una sola pagina');

    const s = NR.createState(); s.flags.atto4 = true;
    ok(when(gigante, s) === false, 'Gigante: assente prima che presagio_status sia active');
    s.values.presagio_status = 'active';
    ok(when(gigante, s) === true, 'Gigante: presente con presagio_status=active e nessun warning_target');
    s.values.warning_target = 'palmer';
    ok(when(gigante, s) === false, 'Gigante: assente dopo warning_target scritto');
  }

  // -- m8_roadhouse_phone: nessuna root prima che m8_roadhouse_truman sia fatto --
  {
    const s = NR.createState(); s.flags.atto4 = true;
    doNode(M8d, s, 'm8_diner'); doChoice(M8d, s, 'm8_diner', 'promise_accompagno');
    doNode(M8d, s, 'm8_leland_taxi');
    ok(!NR.prepareNode(s, M8d, 'm8_roadhouse_phone').ok, 'm8_roadhouse_phone: nessuna root prima di m8_roadhouse_truman');
    doNode(M8d, s, 'm8_roadhouse_truman');
    ok(NR.prepareNode(s, M8d, 'm8_roadhouse_phone').ok, 'm8_roadhouse_phone: root viva dopo m8_roadhouse_truman');
  }

  // -- crocevia (town_crossroads) --
  {
    const reg = A._debugWorldTargets.town;
    ok(reg && reg.town_crossroads && reg.town_crossroads.x === 47 && reg.town_crossroads.y === 30, 'town: target narrativo town_crossroads a (47,30)');
    ok(GAME.Maps.isSolid('town', 47, 30, {}) === false, 'town: (47,30) calpestabile');
    ok(GAME.Maps.isSolid('town', 47, 29, {}) === false, 'town: (47,29) — spawn di ritorno dal Roadhouse — calpestabile');
  }

  // -- riva del lago: hawk_shore_first/hawk_shore_after, mai entrambi --
  {
    const first = town.find((e) => e.npc.id === 'hawk_shore_first');
    const after = town.find((e) => e.npc.id === 'hawk_shore_after');
    ok(!!first && !!after, 'town: le due collocazioni di Hawk sulla riva sono registrate');
    const s = NR.createState();
    ok(when(first, s) === false && when(after, s) === false, 'riva: nessun hawk prima del ritrovamento');
    s.values.body_found_by = 'hawk';
    ok(when(first, s) === true && when(after, s) === false, 'riva: hawk_shore_first iff body_found_by=hawk ∧ ¬maddy_trovata');
    s.flags.maddy_trovata = true;
    ok(when(first, s) === false && when(after, s) === true, 'riva: hawk_shore_after iff maddy_trovata ∧ ¬node_done m8_station (mai insieme al primo)');
    s.nodes_done.m8_station = true;
    ok(when(first, s) === false && when(after, s) === false, 'riva: nessun hawk dopo la stazione');
  }

  // -- classici: sarah/bobby/donna condizionati a !flag:gigante2 --
  {
    const src = fs.readFileSync(J('glue.js'), 'utf8');
    const npcBlock = (id) => {
      const re = new RegExp("id: '" + id + "'[\\s\\S]{0,200}?cond: \\[([\\s\\S]{0,80}?)\\]");
      const m = re.exec(src);
      return m ? m[1] : null;
    };
    ['sarah', 'bobby', 'donna'].forEach((id) => {
      const cond = npcBlock(id);
      ok(!!cond && cond.indexOf("'!flag:gigante2'") !== -1, 'js/glue.js: NPC ' + id + ' ha cond !flag:gigante2');
    });
    ok(GAME.Data.dialogues.sarah_visione && !/\bBOB\b/.test(GAME.Data.dialogues.sarah_visione.pages.map((p) => p.text).join(' ')),
      'sarah_visione: nessun "BOB" nel testo classico della visione');
  }

  // -- retired classic ids assenti --
  {
    const RETIRED = ['truman_atto4', 'truman_atto5', 'truman_wait5', 'lago_maddy', 'maddy_a4', 'leland_a4', 'leland_dove', 'leland_dopo', 'gerard_a4'];
    RETIRED.forEach((id) => ok(!GAME.Data.dialogues[id], 'js/data.js: dialogo ritirato "' + id + '" assente'));
    ok(!GAME.Data.clues.lettera_o, 'js/data.js: indizio ritirato lettera_o assente');
    const glueSrc = fs.readFileSync(J('glue.js'), 'utf8');
    RETIRED.forEach((id) => ok(glueSrc.indexOf("'" + id + "'") === -1, 'js/glue.js: nessun riferimento all\'id ritirato "' + id + '"'));
  }

  // -- nessuna fuga di contenuto Atto 2/3 in M8 --
  {
    ok(!M8d.nodes.some((n) => n.map_id === 'oej' || n.map_id === 'traincar'), 'M8: nessun nodo su oej/traincar (contenuto Atto 2/3)');
    ok(!all.some((e) => e.npc.id === 'audrey' && e.map_id !== 'oej'), 'entità narrative: audrey non compare fuori da oej (M8 non la usa)');
    const m8EntityIds = new Set();
    ['diner', 'roadhouse', 'town'].forEach((mapId) => all.filter((e) => e.map_id === mapId).forEach((e) => m8EntityIds.add(e.npc.id)));
    ok(!m8EntityIds.has('audrey'), 'M8: audrey non è tra le entità di diner/roadhouse/town');
  }

  console.log('act-4-flow: adapter path OK');
})();

console.log(`\nact-4-flow: ${checks}/${checks}`);
