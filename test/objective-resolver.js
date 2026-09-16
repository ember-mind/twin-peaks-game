#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const path = require('node:path');

global.window = global;
global.addEventListener = () => {};
global.document = { getElementById: () => null };
global.GAME = {
  Maps: {},
  Engine: {
    state: { mode: 'play', flags: {}, clues: [], npcs: [] },
    checkCond: () => true
  },
  Data: { objectiveFor: () => 'OBIETTIVO CLASSICO' },
  NarrativeUI: {}
};

require(path.resolve(__dirname, '../js/scene-objects.gen.js'));
require(path.resolve(__dirname, '../js/narrative-runtime.js'));
require(path.resolve(__dirname, '../js/narrative-engine-adapter.js'));

const NR = GAME.NarrativeRuntime;
const A = GAME.NarrativeAdapter;
const state = NR.createState();
const mission = {
  mission: 'TEST',
  entry_condition: { flag: 'entered' },
  carryover_evidence: [],
  nodes: [],
  objectives: [{
    id: 'obj_test', priority: 1, when: { flag: 'entered' },
    text: 'OBIETTIVO NARRATIVO', optional_line: 'DETTAGLIO'
  }]
};

A.enable({ mission, missions: [mission], state, container: {} });
assert.equal(A.getObjectiveText(), 'OBIETTIVO CLASSICO', 'classic objective before mission entry');

NR.applyEffects(state, [{ set: 'entered' }]);
assert.equal(A.getObjectiveText(), 'OBIETTIVO NARRATIVO — DETTAGLIO', 'narrative objective wins after entry');

state.flags.entered = false;
assert.equal(A.getObjectiveText(), 'OBIETTIVO CLASSICO', 'resolver falls back without active narrative objective');

GAME.NarrativeFinale = { isPending: () => true, objective: () => 'OBIETTIVO FINALE' };
assert.equal(A.getObjectiveText(), 'OBIETTIVO FINALE', 'finale objective wins while adapter is disabled');

console.log('OBJECTIVE-RESOLVER-PASS 4/4');
