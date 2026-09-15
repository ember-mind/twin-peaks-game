/* test/act-2-flow.js — Act 2 wiring, no browser.
 * (a) runtime path through M4's guard nodes / objective ladder / present P2.
 * (b) classic path (js/engine.js resolveDialogue) for the lobby/hawk/norma/
 *     scrivania_315 cascades and the room 315 wake-up page count.
 * node test/act-2-flow.js
 */
'use strict';
const assert = require('assert');
const path = require('path');

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

/* ===================== (a) runtime path ===================== */
(function runtimePath() {
  global.window = undefined;
  require(path.join(__dirname, '..', 'js', 'narrative-runtime.js'));
  const NR = global.GAME.NarrativeRuntime;
  const ROOT = path.join(__dirname, '..', 'narrative');
  const fs = require('fs');
  const M4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'missions', 'M4.json'), 'utf8'));

  function freshState() { const s = NR.createState(); s.flags.sogno_fatto = true; return s; }
  function doNode(s, id) { const p = NR.prepareNode(s, M4, id); if (!p.ok) return p; const c = NR.commitNode(s, M4, p); return { ok: c.ok, prep: p, repeated: c.repeated }; }
  function doChoice(s, atId, choiceId) {
    const node = M4.nodes.find((n) => n.id === atId);
    const p = NR.prepareChoice(s, M4, node, choiceId);
    if (!p.ok) return p;
    const c = NR.commitChoice(s, M4, node, p);
    if (c.ok && c.goto) { const r = doNode(s, c.goto); return { ok: r.ok, goto: c.goto }; }
    return c;
  }
  function doPresent(s, propId) {
    const pres = M4.nodes.find((n) => n.id === 'present_truman_m4');
    const p = NR.preparePresentation(s, M4, pres, propId);
    const c = NR.commitPresentation(s, M4, pres, p);
    return { prep: p, commit: c };
  }
  function objectiveText(s) {
    const o = NR.activeObjective(s, M4);
    return o ? o.text : null;
  }

  console.log('# act-2-flow: runtime path (M4)');

  // fresh state, sogno_fatto ma sogno NON raccontato: i guard sono le uniche root
  {
    const s = freshState();
    const ronetteRoots = NR.worldRoots(s, M4, 'hospital', 'ronette').map((n) => n.id);
    ok(JSON.stringify(ronetteRoots) === JSON.stringify(['ronette_attesa']),
      'hospital/ronette root pre-racconto è ronette_attesa (trovato: ' + ronetteRoots.join(',') + ')');
    const jamesRoots = NR.worldRoots(s, M4, 'diner', 'james').map((n) => n.id);
    ok(JSON.stringify(jamesRoots) === JSON.stringify(['james_attesa']),
      'diner/james root pre-racconto è james_attesa (trovato: ' + jamesRoots.join(',') + ')');
    const gerardRoots = NR.worldRoots(s, M4, 'hospital', 'gerard').map((n) => n.id);
    ok(JSON.stringify(gerardRoots) === JSON.stringify(['gerard_attesa']), 'hospital/gerard root pre-racconto è gerard_attesa');
    const infRoots = NR.worldRoots(s, M4, 'hospital', 'infermiera').map((n) => n.id);
    ok(JSON.stringify(infRoots) === JSON.stringify(['infermiera_attesa']), 'hospital/infermiera root pre-racconto è infermiera_attesa');

    ok(objectiveText(s) === 'Riferisci il sogno a Truman.', 'ladder @100 pre-racconto');

    // entra e ripeti ogni guardia: la pagina repeat rende sempre (mai stub)
    for (const id of ['ronette_attesa', 'gerard_attesa', 'infermiera_attesa', 'james_attesa']) {
      const first = doNode(s, id);
      ok(first.ok && first.prep.pages.length > 0, id + ': prima entrata rende pagine');
      const again = doNode(s, id);
      ok(again.ok && again.repeated && again.prep.pages.length === 1 && again.prep.pages[0].name === 'COOPER',
        id + ': ri-entrata rende UNA pagina COOPER (repeat), mai stub');
    }
  }

  // dopo truman_a2 (sogno raccontato): i guard cadono, i nodi reali diventano root unico
  {
    const s = freshState();
    doNode(s, 'truman_a2');
    ok(s.flags.sogno_raccontato === true, 'truman_a2 imposta sogno_raccontato');
    const ronetteRoots = NR.worldRoots(s, M4, 'hospital', 'ronette').map((n) => n.id);
    ok(JSON.stringify(ronetteRoots) === JSON.stringify(['ronette_q']), 'post-racconto: unica root hospital/ronette è ronette_q');
    const jamesRoots = NR.worldRoots(s, M4, 'diner', 'james').map((n) => n.id);
    ok(JSON.stringify(jamesRoots) === JSON.stringify(['james_a2']), 'post-racconto: unica root diner/james è james_a2');
    const gerardRoots = NR.worldRoots(s, M4, 'hospital', 'gerard').map((n) => n.id);
    ok(JSON.stringify(gerardRoots) === JSON.stringify(['gerard_a2']), 'post-racconto: unica root hospital/gerard è gerard_a2');

    ok(objectiveText(s) === "Parla con Ronette all'ospedale e con James al Double R.", 'ladder @200 post-racconto, pre-James');

    // James prima di Ronette -> obj_m4_2b (ronette con 10 minuti)
    doNode(s, 'james_a2');
    ok(objectiveText(s) === "Ronette, all'ospedale: ha dieci minuti. Poi il taccuino (T).", 'ladder @225 dopo James, prima di Ronette');

    // ripetizione james_a2: repeat COOPER, non stub
    const jRepeat = doNode(s, 'james_a2');
    ok(jRepeat.ok && jRepeat.repeated && jRepeat.prep.pages.length === 1 && jRepeat.prep.pages[0].name === 'COOPER',
      'james_a2 ripetuto rende repeat COOPER');

    // Ronette dopo James: apre la visita, ma obj_m4_2b resta finché il
    // terminale (ronette_uomo) non scrive T1_RONETTE_BOB
    doNode(s, 'ronette_q');
    ok(s.flags.ronette_visita === true, 'ronette_q entry imposta ronette_visita');
    ok(objectiveText(s) === "Ronette, all'ospedale: ha dieci minuti. Poi il taccuino (T).",
      'ladder @225 ancora attivo: visita aperta ma T1_RONETTE_BOB non ancora scritta');
    doChoice(s, 'ronette_q', 'q_uomo');
    ok(s.evidence.T1_RONETTE_BOB === true, 'ronette_uomo scrive T1_RONETTE_BOB');
    ok(objectiveText(s) === "Taccuino (T): accosta le due metà del cuore alla strada di James.",
      'ladder @250 dopo James e Ronette (visita completata)');

    // infermiera_ctx e gerard_a2 disponibili/ripetibili dopo la testimonianza
    doNode(s, 'gerard_a2');
    const gRepeat = doNode(s, 'gerard_a2');
    ok(gRepeat.ok && gRepeat.repeated && gRepeat.prep.pages.length === 1 && gRepeat.prep.pages[0].name === 'COOPER',
      'gerard_a2 ripetuto rende repeat COOPER');
    doNode(s, 'infermiera_ctx');
    const iRepeat = doNode(s, 'infermiera_ctx');
    ok(iRepeat.ok && iRepeat.repeated && iRepeat.prep.pages.length === 1 && iRepeat.prep.pages[0].name === 'COOPER',
      'infermiera_ctx ripetuto rende repeat COOPER');

    // formulazione P2 e presentazione a Truman
    doNode(s, 'cmp_e6a_tjames');
    doChoice(s, 'cmp_e6a_tjames', 'b8_a');
    ok(objectiveText(s) === 'Mostra a Truman il nesso che regge.', 'ladder @300 dopo formulazione P2');

    const pres = doPresent(s, 'P2');
    ok(pres.prep.ok && pres.prep.branch && pres.prep.branch.result === 'accepted', 'presentazione P2 accettata');
    ok(pres.prep.pages.length === 6, 'presentazione P2 rende le 6 pagine nuove (trovate: ' + pres.prep.pages.length + ')');
    const ids = pres.prep.pages.map((p) => p.id);
    ok(JSON.stringify(ids) === JSON.stringify([
      'm4.b9.present_p2.p01', 'm4.b9.present_p2.p02', 'm4.b9.present_p2.p03',
      'm4.b9.present_p2.p04', 'm4.b9.present_p2.p05', 'm4.b9.present_p2.p06'
    ]), 'id pagine P2 accettata nell\'ordine atteso');
    ok(s.flags.atto3 === true, 'presentazione P2 accettata → atto3 via completion');
    ok(objectiveText(s) === 'Verifica la rotta di James: oltre il ponte, verso i binari.', 'ladder @400 dopo accettazione');
  }

  // invariante: esattamente un obiettivo vero a ogni stadio (già coperto in
  // narrative-validate.js Gate 10 con lo stesso mission file; qui solo la
  // sequenza narrativa dell'atto 2)
  console.log('act-2-flow: runtime path OK (' + checks + ' controlli finora)');
})();

/* ===================== (b) classic path ===================== */
(function classicPath() {
  delete require.cache[path.join(__dirname, '..', 'js', 'narrative-runtime.js')];
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  global.window = global;
  global.addEventListener = function () {};
  global.requestAnimationFrame = function () {};
  const J = (f) => path.join(__dirname, '..', 'js', f);
  ['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js', 'engine.js', 'scene-objects.gen.js', 'glue.js']
    .forEach((f) => require(J(f)));
  const GAME = global.GAME;
  const D = GAME.Data.dialogues;
  const E = GAME.Engine;

  console.log('# act-2-flow: classic path (js/data.js + js/glue.js)');

  function st(evidence, flags) { return { evidence: evidence || {}, flags: flags || {}, clues: [] }; }

  const audrey = GAME.NPCS ? null : null; // NPCS non esposto; leggiamo la cascata dai dati di glue tramite hotel_gn
  const hotelNpcs = GAME.Maps.hotel_gn.npcs;
  const audreyNpc = hotelNpcs.find((n) => n.id === 'audrey');
  const benhorneNpc = hotelNpcs.find((n) => n.id === 'benhorne');
  ok(!!audreyNpc && !!benhorneNpc, 'hotel_gn espone Ben Horne e Audrey');

  ok(E.resolveDialogue(audreyNpc.dialogue, st({}, {})) === 'audrey_a2', 'Audrey pre-Ben Horne risolve audrey_a2');
  ok(E.resolveDialogue(audreyNpc.dialogue, st({}, { done_benhorne_a2: true })) === 'audrey_a2_ben',
    'Audrey dopo Ben Horne risolve audrey_a2_ben');
  ok(D.audrey_a2.setFlag === 'audrey_indaga' && D.audrey_a2_ben.setFlag === 'audrey_indaga',
    'entrambe le varianti di Audrey impostano audrey_indaga');

  const hawkNpc = GAME.Maps.sheriff.npcs.find((n) => n.id === 'hawk');
  ok(E.resolveDialogue(hawkNpc.dialogue, st({}, {})) === 'hawk', 'Hawk pre-sogno risolve hawk');
  ok(E.resolveDialogue(hawkNpc.dialogue, st({}, { sogno_fatto: true })) === 'hawk_a2', 'Hawk post-sogno risolve hawk_a2');

  const normaNpc = GAME.Maps.diner.npcs.find((n) => n.id === 'norma');
  ok(E.resolveDialogue(normaNpc.dialogue, st({}, {})) === 'norma', 'Norma pre-condizioni risolve norma');
  ok(E.resolveDialogue(normaNpc.dialogue, st({}, { sogno_fatto: true })) === 'norma',
    'Norma con solo sogno_fatto (senza done_norma) resta su norma');
  ok(E.resolveDialogue(normaNpc.dialogue, st({}, { sogno_fatto: true, done_norma: true })) === 'norma_a2',
    'Norma con sogno_fatto e done_norma risolve norma_a2');

  const scrivaniaDlg = GAME.INTERACT_DLG.scrivania_315;
  ok(E.resolveDialogue(scrivaniaDlg, st({}, {})) === 'scrivania_315', 'scrivania_315 senza evidenza risolve scrivania_315');
  ok(E.resolveDialogue(scrivaniaDlg, st({ T1_RONETTE_BOB: true }, {})) === 'scrivania_315_bob',
    'scrivania_315 con evidence T1_RONETTE_BOB risolve scrivania_315_bob');

  const gerardNpc = GAME.Maps.hospital.npcs.find((n) => n.id === 'gerard');
  ok(!!gerardNpc, 'ospedale espone Gerard');
  const hospitalRows = GAME.Maps.hospital.rows;
  const bedGlyphs = [[9, 3], [10, 3], [9, 4], [10, 4], [9, 5], [10, 5]];
  const isAdjacentToBed = bedGlyphs.some(([bx, by]) =>
    Math.abs(bx - gerardNpc.x) + Math.abs(by - gerardNpc.y) === 1);
  ok(isAdjacentToBed, 'Gerard è adiacente al secondo letto (' + gerardNpc.x + ',' + gerardNpc.y + ')');
  ok(!GAME.Maps.isSolid('hospital', gerardNpc.x, gerardNpc.y, { clues: [] }), 'la tile di Gerard è calpestabile');

  const risveglio = D.hotel_risveglio;
  ok(risveglio.pages.length === 7, 'hotel_risveglio ha 7 pagine (trovate: ' + risveglio.pages.length + ')');
  ok(risveglio.pages[6].name === 'COOPER', 'ultima pagina di hotel_risveglio è di COOPER');

  console.log('act-2-flow: classic path OK');
})();

console.log(`\nACT-2-FLOW-PASS ${checks}/${checks}`);
