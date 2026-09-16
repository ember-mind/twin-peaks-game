#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const path = require('node:path');

const listeners = {};
global.window = global;
global.addEventListener = (type, fn) => { (listeners[type] ||= []).push(fn); };
global.removeEventListener = () => {};
global.setInterval = () => 1;
global.clearInterval = () => {};

const objective = { style: { display: '' }, textContent: '' };
global.document = {
  getElementById(id) { return id === 'objective' ? objective : null; }
};
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

let closeNotebook;
GAME.NarrativeNotebook = {
  open() { return new Promise(resolve => { closeNotebook = resolve; }); }
};

require(path.resolve(__dirname, '../js/narrative-engine-adapter.js'));
require(path.resolve(__dirname, '../js/narrative-production.js'));

(async function () {
  const NR = GAME.NarrativeRuntime;
  const A = GAME.NarrativeAdapter;
  const NP = GAME.NarrativeProduction;
  const state = NR.createState();
  const mission = {
    mission: 'TEST', entry_condition: { flag: 'entered' },
    carryover_evidence: [], nodes: [], objectives: []
  };

  A.enable({ mission, missions: [mission], state, container: {} });
  NP.renderObjective(NR, A);
  assert.equal(objective.style.display, '', 'objective visible before notebook');
  assert.match(objective.textContent, /OBIETTIVO CLASSICO/);

  const pending = A.openNotebook();
  assert.equal(A.isNotebookOpen(), true, 'adapter owns notebook-open state');
  assert.equal(objective.style.display, 'none', 'external objective hidden on open');

  // Simula il tick reale di narrative-production mentre notebook resta aperto.
  NP.renderObjective(NR, A);
  assert.equal(objective.style.display, 'none', 'sync tick cannot reopen duplicate');

  closeNotebook({ closed: true });
  await pending;
  assert.equal(A.isNotebookOpen(), false, 'notebook-open state released');

  NP.renderObjective(NR, A);
  assert.equal(objective.style.display, '', 'objective restored after close');

  GAME.NarrativeNotebook.open = () => { throw new Error('fault:notebook_open'); };
  const failed = await A.openNotebook();
  assert.deepEqual(failed, { ok: false, error: 'notebook_open_failed' }, 'sync fault becomes controlled result');
  assert.equal(A.isNotebookOpen(), false, 'sync fault releases notebook-open state');
  assert.equal(objective.style.display, '', 'sync fault restores objective');
  assert.equal(A.active(), false, 'sync fault releases input lease');

  console.log('OBJECTIVE-NOTEBOOK-VISIBILITY-PASS 11/11');
})().catch(err => {
  console.error(err.stack || err);
  process.exit(1);
});
