'use strict';

var assert = require('assert');
global.GAME = {};
require('../js/narrative-runtime.js');
require('../js/narrative-data.gen.js');
require('../js/narrative-bootstrap.js');

var NR = global.GAME.NarrativeRuntime;
var D = global.GAME.NarrativeData;
var M9 = D.missions.M9;
global.GAME.installNarrativeCatalogs();

var warnings = ['palmer', 'centrale', 'nessuno'];
var sarahStates = ['none', 'vice'];
var letterSources = ['cooper_primary', 'hawk_preserved'];
var paths = 0;

function node(id) { return M9.nodes.filter(function (n) { return n.id === id; })[0]; }
function doNode(state, id) {
  var prep = NR.prepareNode(state, M9, id);
  assert.ok(prep.ok, prep.error);
  var commit = NR.commitNode(state, M9, prep);
  assert.ok(commit.ok, commit.error);
  return { prep: prep, commit: commit };
}
function ids(pages) { return (pages || []).map(function (p) { return p.id; }); }

warnings.forEach(function (warning) {
  sarahStates.forEach(function (sarah) {
    letterSources.forEach(function (letterSource) {
      var state = NR.createState();
      state.flags.atto4 = true;
      state.nodes_done.m8_station = true;
      state.values.warning_target = warning;
      state.values.sarah_support_state = sarah;
      state.values.letter_o_observation_source = letterSource;
      state.evidence.T_LELAND_TAXI = true;
      state.evidence.T_SARAH_VISIONE = true;

      assert.strictEqual(NR.activeObjective(state, M9).id, 'obj_m9_1');
      assert.deepStrictEqual(NR.worldRoots(state, M9, 'palmer', 'leland'), [], 'M9 non crea retroattivamente la testimonianza');
      assert.deepStrictEqual(NR.worldRoots(state, M9, 'sheriff', 'lucy').map(function (n) { return n.id; }), ['m9_verifica_taxi']);

      doNode(state, 'm9_verifica_taxi');
      assert.ok(state.evidence.D_TAXI);
      assert.strictEqual(NR.activeObjective(state, M9).id, 'obj_m9_2');
      doNode(state, 'm9_cmp_taxi');
      assert.strictEqual(NR.peekProp(state, 'P6').formulation.status, 'formulated');
      assert.strictEqual(NR.activeObjective(state, M9).id, 'obj_m9_3');

      var presentation = node('m9_present_truman');
      var intro = NR.prepareNode(state, M9, presentation.id);
      assert.ok(intro.ok);
      var introIds = ids(intro.pages);
      assert.ok(introIds.indexOf(letterSource === 'hawk_preserved' ? 'm9.b2.present.eco_o.hawk' : 'm9.b2.present.eco_o.cooper') >= 0);
      assert.strictEqual(introIds.indexOf(letterSource === 'hawk_preserved' ? 'm9.b2.present.eco_o.cooper' : 'm9.b2.present.eco_o.hawk'), -1, 'eco O partizionato');

      var beforePrepare = NR.serialize(state);
      var wrong = NR.preparePresentation(state, M9, presentation, 'P6', ['T_LELAND_TAXI']);
      assert.ok(wrong.ok && wrong.record.result === 'rejected' && wrong.record.reason_code === 'NO_CORROBORATION');
      assert.deepStrictEqual(wrong.record.evidence_attached, ['T_LELAND_TAXI']);
      assert.strictEqual(NR.serialize(state), beforePrepare, 'prepare allegato è puro');
      assert.ok(NR.commitPresentation(state, M9, presentation, wrong).ok);
      assert.ok(!state.flags.atto5 && !state.nodes_done.m9_present_truman, 'rifiuto non avanza M9');

      var historyBeforeRepeat = state.presentations.length;
      var repeatWrong = NR.preparePresentation(state, M9, presentation, 'P6', ['T_LELAND_TAXI']);
      assert.ok(repeatWrong.ok && repeatWrong.already_rejected);
      assert.strictEqual(ids(repeatWrong.pages)[0], 'm9.b2.p6.already_rejected');
      assert.ok(NR.commitPresentation(state, M9, presentation, repeatWrong).ok);
      assert.strictEqual(state.presentations.length, historyBeforeRepeat, 'ALREADY_REJECTED non duplica history');

      assert.strictEqual(NR.preparePresentation(state, M9, presentation, 'P6', ['D_TAXI', 'D_TAXI']).error, 'duplicate_attachment: D_TAXI');
      var absent = NR.createState(); absent.props.P6 = JSON.parse(JSON.stringify(state.props.P6));
      assert.strictEqual(NR.preparePresentation(absent, M9, presentation, 'P6', ['D_TAXI']).error, 'unacquired_attachment: D_TAXI');

      var correct = NR.preparePresentation(state, M9, presentation, 'P6', ['T_LELAND_TAXI', 'D_TAXI', 'T_SARAH_VISIONE']);
      assert.ok(correct.ok && correct.record.result === 'accepted');
      assert.strictEqual(correct.provenance, null, 'provenienza non auto-mostrata');
      assert.deepStrictEqual(correct.record.evidence_attached, ['T_LELAND_TAXI', 'D_TAXI', 'T_SARAH_VISIONE']);
      var correctIds = ids(correct.pages);
      assert.strictEqual(correctIds[0], 'm9.b2.p6.visione', 'risposta allegato additiva e visibile');
      assert.strictEqual(correctIds.indexOf('m9.b2.p6.accept.valigia.truman') >= 0, warning === 'palmer', 'eco valigia solo quando esiste');
      assert.strictEqual(correctIds.indexOf('m9.b2.p6.accept.valigia.andy'), -1, 'nessun fallback che inventi la valigia');
      assert.ok(correctIds.indexOf(sarah === 'vice' ? 'm9.b2.p6.accept.sarah.vice' : 'm9.b2.p6.accept.sarah.none') >= 0);

      assert.ok(NR.commitPresentation(state, M9, presentation, correct).ok);
      assert.ok(state.flags.atto5 && state.nodes_done.m9_present_truman);
      assert.deepStrictEqual(NR.peekProp(state, 'P6').social_status.accepted_by, ['truman']);
      assert.strictEqual(NR.activeObjective(state, M9).id, 'obj_m9_4');
      doNode(state, 'm9_arrivo');
      assert.ok(NR.checkCompletion(state, M9));

      var staleState = NR.createState();
      staleState.evidence.T_LELAND_TAXI = staleState.evidence.D_TAXI = true;
      staleState.props.P6 = JSON.parse(JSON.stringify(state.props.P6));
      staleState.props.P6.presentations = [];
      staleState.props.P6.social_status.accepted_by = [];
      var stalePrep = NR.preparePresentation(staleState, M9, presentation, 'P6', ['T_LELAND_TAXI', 'D_TAXI']);
      staleState.revision++;
      assert.strictEqual(NR.commitPresentation(staleState, M9, presentation, stalePrep).error, 'stale_transaction');
      paths++;
    });
  });
});

assert.strictEqual(paths, 12);
console.log('NARRATIVE-M9-RUNTIME-PASS 12 paths × reject/retry/accept + transaction gates');
