#!/usr/bin/env node
/* gen-narrative-data.js — genera js/narrative-data.gen.js dai JSON canonici
 * in narrative/. La dottrina: markdown = canone umano, JSON = sorgente
 * implementabile, il file .gen.js è GENERATO — mai una terza sorgente a mano.
 * Uso: node test/gen-narrative-data.js */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const m4 = JSON.parse(fs.readFileSync(path.join(root, 'narrative/missions/M4.json'), 'utf8'));
const m5 = JSON.parse(fs.readFileSync(path.join(root, 'narrative/missions/M5.json'), 'utf8'));
const m6 = JSON.parse(fs.readFileSync(path.join(root, 'narrative/missions/M6.json'), 'utf8'));
const m8 = JSON.parse(fs.readFileSync(path.join(root, 'narrative/missions/M8.json'), 'utf8'));
const m9 = JSON.parse(fs.readFileSync(path.join(root, 'narrative/missions/M9.json'), 'utf8'));
const enums = JSON.parse(fs.readFileSync(path.join(root, 'narrative/state-enums.json'), 'utf8'));
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'narrative/evidence.json'), 'utf8'));
const propositions = JSON.parse(fs.readFileSync(path.join(root, 'narrative/propositions.json'), 'utf8'));
const cast = JSON.parse(fs.readFileSync(path.join(root, 'narrative/cast/windows.json'), 'utf8'));
const m9EvidenceDiff = JSON.parse(fs.readFileSync(path.join(root, 'narrative/schema-deltas/diff-evidence-M9.json'), 'utf8'));
Object.keys(m9EvidenceDiff.ui_origin_add || {}).forEach(id => {
  if (!evidence.evidence[id]) throw new Error('M9 ui_origin target missing: ' + id);
  evidence.evidence[id].ui_origin = m9EvidenceDiff.ui_origin_add[id];
});
Object.keys(m9EvidenceDiff.evidence_add || {}).forEach(id => {
  if (evidence.evidence[id]) throw new Error('M9 evidence already exists: ' + id);
  evidence.evidence[id] = m9EvidenceDiff.evidence_add[id];
});

const out = [
  '/* narrative-data.gen.js — FILE GENERATO da test/gen-narrative-data.js.',
  ' * NON MODIFICARE A MANO: la sorgente implementabile sono i JSON in narrative/,',
  ' * il canone umano sono i markdown del pacchetto narrative-v1.0.',
  ' * Rigenerare con: node test/gen-narrative-data.js */',
  '(function () {',
  "  var G = (typeof window !== 'undefined' ? window : globalThis);",
  '  var GAME = G.GAME = G.GAME || {};',
  '  var D = GAME.NarrativeData = GAME.NarrativeData || {};',
  '  D.missions = D.missions || {};',
  '  D.missions.M4 = ' + JSON.stringify(m4, null, 1).replace(/\n/g, '\n  ') + ';',
  '  D.missions.M5 = ' + JSON.stringify(m5, null, 1).replace(/\n/g, '\n  ') + ';',
  '  D.missions.M6 = ' + JSON.stringify(m6, null, 1).replace(/\n/g, '\n  ') + ';',
  '  D.missions.M8 = ' + JSON.stringify(m8, null, 1).replace(/\n/g, '\n  ') + ';',
  '  D.missions.M9 = ' + JSON.stringify(m9, null, 1).replace(/\n/g, '\n  ') + ';',
  '  D.enums = ' + JSON.stringify(enums, null, 1).replace(/\n/g, '\n  ') + ';',
  '  D.evidence = ' + JSON.stringify(evidence, null, 1).replace(/\n/g, '\n  ') + ';',
  '  D.propositions = ' + JSON.stringify(propositions, null, 1).replace(/\n/g, '\n  ') + ';',
  '  D.cast = ' + JSON.stringify(cast, null, 1).replace(/\n/g, '\n  ') + ';',
  '})();',
  ''
].join('\n');

fs.writeFileSync(path.join(root, 'js/narrative-data.gen.js'), out);
console.log('generated js/narrative-data.gen.js (' + out.length + ' bytes)');
