'use strict';

var assert = require('assert');
global.GAME = {};
require('../js/data.js');
var ClassicData = global.GAME.Data;
var NF = require('../js/narrative-finale.js');

var methods = ['probatorio', 'personale', 'intuitivo'];
var s3Values = ['on', 'off'];
var orders = [['mfap', 'bob'], ['bob', 'mfap']];
var custody = ['documented_custody', 'institutional'];
var facts = ['taxi_lie', 'traincar_presence', 'laura_homicide', 'maddy_homicide', 'maddy_body_transport', 'letters'];
var passes = 0;
var autoParts = new Set();
var voiceFamilies = new Set();
var blockedVoiceForms = new Set();

var ABSOLUTION_CLAIMS = [
  /non (lo )?sapeva/i,
  /\b(mio padre|Leland)\b[^.]{0,40}\b(sapeva|ignorava|ricordava|capiva)\b/i,
  /\bLUI\s+s[ìi]\b/,
  /\binnocent/i,
  /non (era|è) (colpa|responsabil)/i,
  /non (fu|è stato) (lui|mio padre)/i,
  /BOB (ha fatto|faceva) tutto/i
];

function assertLauraAntiAbsolution(text, label) {
  ABSOLUTION_CLAIMS.forEach(function (claim) {
    assert.ok(!claim.test(text), label + ': Laura certifica ignoranza/innocenza con ' + claim);
  });
  assert.ok(/mio padre/i.test(text) && /\bBOB\b/.test(text), label + ': Leland e BOB restano entrambi nella domanda');
  assert.ok(/Non chiedermi dove finiva mio padre e dove cominciava BOB/i.test(text), label + ': Laura non rifiuta la separazione comoda');
  assert.ok(/Separarli non cancella ciò che mi è stato fatto/i.test(text), label + ': BOB viene usato per assolvere Leland');
}

var classicLauraPages = ClassicData.dialogues.laura_finale2.pages;
var classicLauraText = classicLauraPages.filter(function (page) { return page.name === 'OMBRA DI LAURA'; })
  .map(function (page) { return page.text; }).join(' ');
assert.ok(ClassicData.dialogues.laura_finale2.end === true, 'finale classico Laura resta raggiungibile e conclusivo');
assertLauraAntiAbsolution(classicLauraText, 'finale classico');

function assertGoldPage(screen) {
  if (!screen || screen.kind !== 'page') return;
  var lines = screen.page.text.split('\n');
  if (/\.part\d+$/.test(screen.page.id)) autoParts.add(screen.page.id);
  assert.ok(lines.length <= 4, screen.page.id + ': oltre quattro righe');
  lines.forEach(function (line) { assert.ok(line.length <= 24, screen.page.id + ': riga oltre 24 caratteri: ' + line); });
}

function drainToChoice(id) {
  var guard = 0;
  while (NF.isActive()) {
    var screen = NF.currentScreen();
    assert.ok(screen, 'screen mancante durante ' + NF.getState().stage);
    if (screen.kind === 'choice') break;
    assertGoldPage(screen);
    assert.ok(NF.advance().ok);
    if (++guard > 500) throw new Error('drainToChoice guard');
  }
  var current = NF.currentScreen();
  assert.ok(current && current.kind === 'choice');
  assert.strictEqual(current.id, id);
}

function drainToPauseOrComplete() {
  var guard = 0;
  while (NF.isActive()) {
    var screen = NF.currentScreen();
    assert.ok(screen && screen.kind === 'page', 'pagina attesa a ' + NF.getState().stage);
    assertGoldPage(screen);
    assert.ok(NF.advance().ok);
    if (++guard > 500) throw new Error('drainToPause guard');
  }
}

function isCooperScreen(screen) {
  return !!(screen && screen.kind === 'page' && screen.page &&
    (screen.page.display_name === 'COOPER' || /^COOPER:/.test(screen.page.text)));
}

function assertCooperSince(screens, start, family) {
  assert.ok(screens.slice(start).some(isCooperScreen), family + ': nessuna battuta COOPER nella transizione resa');
  voiceFamilies.add(family);
}

function doEncounter(actor, ringChoice, bobChoice, screens) {
  var voiceStart = screens.length;
  assert.ok(NF.beginLodge(actor).ok);
  if (actor === 'mfap' && NF.getState().values.s1 === 'documented_custody') {
    drainToChoice('ring_final_gesture');
    assertCooperSince(screens, voiceStart, 'nano');
    assert.ok(NF.choose(ringChoice).ok);
    assert.strictEqual(NF.currentScreen().page.id, 'nf.lodge.ring.feedback.' + ringChoice + '.01');
    drainToPauseOrComplete();
  } else if (actor === 'bob') {
    drainToChoice('bob_response_stance');
    assertCooperSince(screens, voiceStart, 'bob');
    var reactionStart = screens.length;
    assert.ok(NF.choose(bobChoice).ok);
    drainToPauseOrComplete();
    if (bobChoice === 'B') assert.ok(!screens.slice(reactionStart).some(isCooperScreen), 'stance B conserva il silenzio deliberato dopo l\'osservazione iniziale');
  } else {
    drainToPauseOrComplete();
    assertCooperSince(screens, voiceStart, 'nano');
  }
}

methods.forEach(function (method, mi) {
  s3Values.forEach(function (s3, si) {
    orders.forEach(function (order, oi) {
      custody.forEach(function (s1, ci) {
        var screens = [], complete = null;
        var ringChoice = ((mi + si + oi) % 2) ? 'left' : 'kept';
        var bobChoice = ['A', 'B', 'C'][(mi + si + oi + ci) % 3];
        var s4 = ['avvertimento', 'istruzione', 'diagnosi'][(mi + si + oi + ci) % 3];
        function roundTrip(expectedStage) {
          var serialized = NF.serialize();
          assert.ok(NF.deserialize(serialized, { onScreen: function (screen) { screens.push(screen); assertGoldPage(screen); }, onComplete: function (state) { complete = state; } }).ok);
          assert.strictEqual(NF.getState().stage, expectedStage);
        }
        var started = NF.start({
          carryover: {
            values: {
              promise_stance: ['accompagno', 'autonomia', 'prudenza'][mi],
              warning_target: mi === 0 ? 'palmer' : 'centrale',
              m6_tactic: mi === 1 ? 'pressione' : 'prova',
              s1: s1,
              letter_o_observation_source: 'cooper_primary',
              focus_destination: oi ? 'lago' : 'palmer',
              sarah_support_state: si ? 'vice' : 'none',
              maddy_action_after_warning: ci ? 'departure_prepared' : 'none'
            },
            flags: { atto5: true, maddy_trovata: true },
            m4_m9_marker: 'preserved'
          },
          onScreen: function (screen) { screens.push(screen); assertGoldPage(screen); },
          onComplete: function (state) { complete = state; }
        });
        assert.ok(started.ok);
        assert.strictEqual(started.screen.page.id, 'nf.m10.threshold.01');

        drainToChoice('m10_method');
        var beforeMethod = NF.getState().history.map(function (e) { return e.id || ''; });
        assert.ok(beforeMethod.indexOf('nf.m10.threshold.02') >= 0, 'Diane precede scelta metodo');
        assert.ok(NF.choose(method).ok);

        roundTrip('m10_open');
        assert.strictEqual(NF.getState().carryover.m4_m9_marker, 'preserved');

        drainToChoice('s3');
        var m10Transcript = screens.map(function (screen) { return screen.kind === 'page' ? screen.page.text : ''; }).join(' ').replace(/\s+/g, ' ');
        if (method === 'personale') {
          assert.ok(/Per lei — non per noi\./.test(m10Transcript) && /Voleva solo il suo centralino/.test(m10Transcript) && /Volevo che fosse partita\. Che fosse vero\./.test(m10Transcript),
            'ramo personale conserva tattica, desiderio di Maddy e movente difensivo del lock');
        }
        if (method === 'personale' && ci && oi === 0) assert.ok(/Torno lunedì/.test(m10Transcript) && !/La valigia era pronta/.test(m10Transcript));
        if (method === 'personale' && ci && oi !== 0) assert.ok(/Truman ha trovato un biglietto per Sarah/.test(m10Transcript) && !/Torno lunedì/.test(m10Transcript));
        if (method === 'personale' && !ci) assert.ok(/corriera delle 7:40/.test(m10Transcript) && !/La valigia era pronta/.test(m10Transcript) && !/Torno lunedì/.test(m10Transcript));
        if (method === 'intuitivo') {
          assert.ok(/Sono parole che non le ho dato/.test(m10Transcript) && !/Non gliel'ho detta tutta/.test(m10Transcript),
            'ramo intuitivo non presume conoscenza dei versi facoltativi');
          assert.ok(/Il vagone canta ancora\. Chiedete alla terra/.test(m10Transcript) && /La piccola voleva volare a ovest\. L'acqua l'ha tenuta\./.test(m10Transcript),
            'ramo intuitivo conserva le due provocazioni VOCE del lock');
          var m10Ids = screens.map(function (screen) { return screen.kind === 'page' ? screen.page.id : ''; });
          var trumanExit = m10Ids.indexOf('nf.m10.intuitive.06');
          var voiceTraincar = m10Ids.indexOf('nf.m10.admit.intuitive.00');
          var firstAdmission = m10Ids.indexOf('nf.m10.admit.intuitive.02');
          var voiceMaddy = m10Ids.indexOf('nf.m10.admit.intuitive.02a');
          var firstHomicide = m10Ids.indexOf('nf.m10.admit.intuitive.04');
          var trumanReturn = m10Ids.indexOf('nf.m10.admit.intuitive.04b');
          var taxiLine = m10Ids.indexOf('nf.m10.admit.intuitive.05');
          assert.ok(trumanExit >= 0 && trumanExit < voiceTraincar && voiceTraincar < firstAdmission && firstAdmission < voiceMaddy && voiceMaddy < firstHomicide && firstHomicide < trumanReturn && trumanReturn < taxiLine,
            'ramo intuitivo: uscita Truman < VOCE/vagone < ammissione < VOCE/Maddy < omicidio < rientro < taxi');
        }
        var atS3 = NF.getState();
        facts.forEach(function (fact) { assert.deepStrictEqual(atS3.material_admissions[fact], { recorded: true, speaker_register: 'leland_first_person' }); });
        assert.ok(atS3.history.some(function (e) { return e.id === 'nf.m10.s3.threshold.01'; }), 'soglia S3 visibile');
        assert.ok(NF.choose(s3).ok);
        drainToPauseOrComplete();
        assert.strictEqual(NF.getState().stage, 'await_lodge');
        roundTrip('await_lodge');
        assert.strictEqual(NF.resumeLaura().error, 'laura_before_required_encounters');
        var voiceStart = screens.length;
        assert.ok(NF.blockLodgeInteraction('laura').ok);
        assert.strictEqual(NF.currentScreen().page.id, 'nf.lodge.blocked.laura_early');
        assertCooperSince(screens, voiceStart, 'blocked');
        blockedVoiceForms.add('laura_early');
        roundTrip('lodge_blocked');
        drainToPauseOrComplete();
        assert.strictEqual(NF.getState().stage, 'await_lodge');

        doEncounter(order[0], ringChoice, bobChoice, screens);
        assert.strictEqual(NF.getState().stage, 'await_lodge_second');
        roundTrip('await_lodge_second');
        assert.strictEqual(NF.beginLodge(order[0]).error, 'lodge_actor_already_seen');
        voiceStart = screens.length;
        assert.ok(NF.blockLodgeInteraction(order[0] === 'nano' ? 'mfap' : 'bob').ok);
        assert.strictEqual(NF.currentScreen().page.id, 'nf.lodge.blocked.repeat');
        assertCooperSince(screens, voiceStart, 'blocked');
        blockedVoiceForms.add('repeat');
        drainToPauseOrComplete();
        voiceStart = screens.length;
        assert.ok(NF.blockLodgeInteraction('laura').ok);
        assertCooperSince(screens, voiceStart, 'blocked');
        blockedVoiceForms.add('laura_early');
        drainToPauseOrComplete();
        assert.strictEqual(NF.getState().stage, 'await_lodge_second');
        doEncounter(order[1], ringChoice, bobChoice, screens);
        assert.strictEqual(NF.getState().stage, 'await_laura');
        roundTrip('await_laura');
        voiceStart = screens.length;
        assert.ok(NF.blockLodgeInteraction(order[0] === 'nano' ? 'mfap' : 'bob').ok);
        assert.strictEqual(NF.currentScreen().page.id, 'nf.lodge.blocked.after_two');
        assertCooperSince(screens, voiceStart, 'blocked');
        blockedVoiceForms.add('after_two');
        drainToPauseOrComplete();

        voiceStart = screens.length;
        assert.ok(NF.resumeLaura().ok);
        drainToPauseOrComplete();
        assertCooperSince(screens, voiceStart, 'laura');
        assert.strictEqual(NF.getState().stage, 'await_lodge_exit');
        roundTrip('await_lodge_exit');
        voiceStart = screens.length;
        assert.ok(NF.blockLodgeInteraction('laura').ok);
        assert.strictEqual(NF.currentScreen().page.id, 'nf.lodge.blocked.exit');
        assertCooperSince(screens, voiceStart, 'blocked');
        blockedVoiceForms.add('exit');
        drainToPauseOrComplete();
        assert.ok(NF.resumeWoods().ok);
        drainToChoice('s4_interpretation');
        assert.ok(NF.choose(s4).ok);
        assert.strictEqual(NF.getState().stage, 'await_epilogue_station');
        roundTrip('await_epilogue_station');

        voiceStart = screens.length;
        assert.ok(NF.resumeEpilogueStation().ok);
        drainToPauseOrComplete();
        assertCooperSince(screens, voiceStart, 'truman');
        assert.strictEqual(NF.getState().stage, 'await_epilogue_exit');
        roundTrip('await_epilogue_exit');
        voiceStart = screens.length;
        assert.ok(NF.resumeEpilogueOptional('sarah').ok);
        drainToPauseOrComplete();
        assertCooperSince(screens, voiceStart, 'sarah');
        voiceStart = screens.length;
        assert.ok(NF.resumeEpilogueOptional('ronette').ok);
        drainToPauseOrComplete();
        assertCooperSince(screens, voiceStart, 'ronette');
        var seenBeforeRepeat = JSON.stringify(NF.getState().epilogue_seen);
        voiceStart = screens.length;
        assert.ok(NF.resumeEpilogueOptional('sarah').repeated);
        drainToPauseOrComplete();
        assertCooperSince(screens, voiceStart, 'sarah');
        assert.strictEqual(JSON.stringify(NF.getState().epilogue_seen), seenBeforeRepeat, 'repeat Sarah non cambia echo/stato visita');
        voiceStart = screens.length;
        assert.ok(NF.resumeEpilogueOptional('ronette').repeated);
        drainToPauseOrComplete();
        assertCooperSince(screens, voiceStart, 'ronette');
        assert.strictEqual(JSON.stringify(NF.getState().epilogue_seen), seenBeforeRepeat, 'repeat Ronette non cambia echo/stato visita');
        voiceStart = screens.length;
        assert.ok(NF.resumeEpilogueExit().ok);
        drainToPauseOrComplete();
        assertCooperSince(screens, voiceStart, 'exit');

        assert.ok(complete && complete.flags.end && complete.flags.leland_morto);
        assert.strictEqual(complete.values.m10_method, method);
        assert.strictEqual(complete.values.s3, s3);
        assert.strictEqual(complete.values.encounter_order, order[0] === 'mfap' ? 'nano_first' : 'bob_first');
        assert.strictEqual(complete.values.bob_response_stance, bobChoice);
        assert.strictEqual(complete.values.s4_interpretation, s4);
        assert.strictEqual(complete.values.ring_final_gesture, s1 === 'documented_custody' ? ringChoice : 'none');
        assert.strictEqual(complete.values.final_ring_location, s1 === 'documented_custody' && ringChoice === 'left' ? 'lodge' : 'evidence_vault');
        assert.deepStrictEqual(complete.epilogue_seen, { sarah: true, ronette: true });
        assert.ok(complete.history.some(function (e) { return (e.id || '').indexOf('nf.lodge.laura.05') === 0; }), 'Laura ultima immagine Loggia');
        if (s1 === 'documented_custody') {
          assert.ok(complete.history.some(function (e) { return e.id === 'nf.lodge.ring.feedback.' + ringChoice + '.01'; }), 'gesto anello mostrato, non solo scritto nello stato');
        }
        assert.ok(complete.history.findIndex(function (e) { return e.id === 'nf.lodge.laura.01'; }) > complete.history.findIndex(function (e) { return e.type === 'lodge_encounter_complete' && e.actor === order[1]; }), 'Laura dopo entrambe presenze');

        var flat = screens.map(function (screen) { return screen.kind === 'page' ? screen.page.text : screen.prompt; }).join(' ').replace(/\s+/g, ' ');
        assert.ok(/L'ho uccisa io/.test(flat) && /taxi/i.test(flat) && /lettere/i.test(flat), 'ammissioni materiali esplicite');
        assert.ok(/Il volto cambia/.test(flat), 'cambio ritratto dichiarato');
        assertLauraAntiAbsolution(flat.match(/Non chiedermi dove finiva mio padre[\s\S]*?La parte che spetta a ciascuno non la posso misurare per te\./)[0], 'finale narrativo');
        assert.ok(/Separarli non cancella ciò che mi è stato fatto/.test(flat) && /La parte che spetta a ciascuno non la posso misurare per te/.test(flat),
          'Laura rifiuta la separazione assolutoria e non quantifica la responsabilità');
        if (bobChoice === 'A') assert.ok(/Per Laura, Leland ha detto: «L'ho uccisa io»/.test(flat) && /Per Maddy, Leland ha detto: «L'ho uccisa io»/.test(flat) && /La sua voce è sul nastro/.test(flat), 'stance A attribuisce entrambe le ammissioni a Leland senza ambiguità di pagina');
        assert.ok(!/epilogue\.promise/.test(complete.history.map(function (e) { return e.id || ''; }).join(' ')), 'nessun secondo payoff promise_stance');
        passes++;
      });
    });
  });
});

// Fault checkpoint: nessuna transizione può restare solo in RAM. Stato,
// history, screen e participant esterno tornano byte-identici; retry avanza
// una volta sola e le scelte write-once non restano sporche.
NF.reset();
var externalPage = -1, failCheckpoint = false, rollbackCount = 0;
var faultOpts = {
  carryover: { values: { s1: 'institutional' }, flags: {} },
  onBeforeMutation: function () { return externalPage; },
  onState: function (state) {
    externalPage = state.page_index;
    return failCheckpoint ? { ok: false, error: 'fault_checkpoint' } : { ok: true };
  },
  onRollback: function (snapshot) { externalPage = snapshot; rollbackCount++; }
};
assert.ok(NF.start(faultOpts).ok);
var beforeFaultState = NF.serialize();
var beforeFaultScreen = NF.currentScreen();
var beforeExternal = externalPage;
failCheckpoint = true;
var failedAdvance = NF.advance();
assert.deepStrictEqual(failedAdvance, { ok: false, error: 'fault_checkpoint', rolled_back: true });
assert.strictEqual(NF.serialize(), beforeFaultState, 'checkpoint fault: stato/history byte-identici');
assert.deepStrictEqual(NF.currentScreen(), beforeFaultScreen, 'checkpoint fault: screen ripristinato');
assert.strictEqual(externalPage, beforeExternal, 'checkpoint fault: participant esterno ripristinato');
assert.strictEqual(rollbackCount, 1);
failCheckpoint = false;
assert.ok(NF.advance().ok);
assert.strictEqual(NF.getState().page_index, 1, 'retry avanza esattamente una pagina');
drainToChoice('m10_method');
beforeFaultState = NF.serialize();
failCheckpoint = true;
var failedChoice = NF.choose('personale');
assert.strictEqual(failedChoice.ok, false);
assert.strictEqual(failedChoice.rolled_back, true);
assert.strictEqual(NF.serialize(), beforeFaultState, 'choice fault: write-once e history rollback');
assert.strictEqual(NF.getState().values.m10_method, undefined);
assert.strictEqual(NF.currentScreen().id, 'm10_method');
NF.reset();
passes++;

assert.strictEqual(NF.deserialize('{bad json').error, 'invalid_finale_save');
assert.strictEqual(NF.deserialize({ version: 2, active: false, stage: 'bogus_stage', page_index: 0, values: {}, flags: {}, material_admissions: {}, history: [], encounters: [], epilogue_seen: {} }).error, 'invalid_finale_save');
assert.strictEqual(NF.deserialize({ version: 2, active: false, stage: 'm10_threshold', page_index: 0, values: {}, flags: {}, material_admissions: {}, history: [], encounters: [], epilogue_seen: {} }).error, 'invalid_finale_save');
assert.strictEqual(NF.deserialize({ version: 2, active: false, stage: 'await_laura', page_index: 0, values: {}, flags: {}, material_admissions: {}, history: [], encounters: [], epilogue_seen: {} }).error, 'invalid_finale_save');
assert.strictEqual(NF.deserialize({ version: 2, active: true, stage: 'm10_threshold', page_index: 999, values: {}, flags: {}, material_admissions: {}, history: [], encounters: [], epilogue_seen: {} }).error, 'invalid_finale_save');
assert.strictEqual(NF.deserialize({ version: 2, active: true, stage: 'm10_open', page_index: 0, values: {}, flags: {}, material_admissions: {}, history: [], encounters: [], epilogue_seen: {} }).error, 'invalid_finale_save');
assert.strictEqual(NF.deserialize({ version: 2, active: false, stage: 'await_lodge_second', page_index: 0, values: { m10_method: 'personale', s3: 'on' }, flags: {}, material_admissions: {}, history: [], encounters: ['bob'], epilogue_seen: {} }).error, 'invalid_finale_save');
assert.deepStrictEqual(Array.from(autoParts).sort(), [], 'nessuna pagina Gold automatica/orfana: spezzare i beat lunghi in pagine autoriali (' + Array.from(autoParts).sort().join(', ') + ')');
assert.deepStrictEqual(Array.from(voiceFamilies).sort(), ['blocked', 'bob', 'exit', 'laura', 'nano', 'ronette', 'sarah', 'truman'], 'otto famiglie finali con voce Cooper');
assert.deepStrictEqual(Array.from(blockedVoiceForms).sort(), ['after_two', 'exit', 'laura_early', 'repeat'], 'quattro forme blocked/repeat con voce Cooper');
passes++;

// Migrazione checkpoint v2: l'indice non è autorità. Il page id precedente
// viene risolto nella sequenza corrente; la vecchia pagina Truman rimossa
// riparte dalla nuova provocazione VOCE, mai da un indice semanticamente falso.
NF.reset();
assert.ok(NF.start({ carryover: { values: {}, flags: {} } }).ok);
drainToChoice('m10_method');
assert.ok(NF.choose('intuitivo').ok);
while (NF.getState().stage !== 'm10_admissions') assert.ok(NF.advance().ok);
while (NF.currentScreen().page.id !== 'nf.m10.admit.intuitive.03') assert.ok(NF.advance().ok);
var legacyById = NF.getState();
legacyById.version = 2;
legacyById.page_index = 3;
legacyById.last_screen = 'nf.m10.admit.intuitive.03';
delete legacyById.page_id;
var migratedById = NF.deserialize(legacyById);
assert.strictEqual(migratedById.ok, true);
assert.strictEqual(migratedById.migrated, true);
assert.strictEqual(NF.getState().version, 3);
assert.strictEqual(NF.currentScreen().page.id, 'nf.m10.admit.intuitive.03');
assert.strictEqual(NF.getState().page_id, 'nf.m10.admit.intuitive.03');
var legacyRemovedPage = JSON.parse(JSON.stringify(legacyById));
legacyRemovedPage.version = 2;
legacyRemovedPage.page_index = 2;
legacyRemovedPage.last_screen = 'nf.m10.admit.intuitive.02b';
delete legacyRemovedPage.page_id;
var migratedRemovedPage = NF.deserialize(legacyRemovedPage);
assert.strictEqual(migratedRemovedPage.ok, true);
assert.strictEqual(NF.currentScreen().page.id, 'nf.m10.admit.intuitive.02a');
NF.reset();
passes++;
console.log('NARRATIVE-FINALE-PASS ' + passes + '/27; COOPER 8/8 famiglie, blocked 4/4');
