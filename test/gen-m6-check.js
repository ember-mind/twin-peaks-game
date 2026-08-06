#!/usr/bin/env node
/* gen-m6-check.js — C6-C.1: prova che il dato generato M6 coincide con la
 * sorgente e che il generatore è DETERMINISTICO (byte-identico a due run).
 * Il confronto deep-equals è puro; la prova di determinismo RIGENERA
 * narrative-data.gen.js due volte (riscrittura deterministica) e confronta gli
 * SHA-256 — il file finisce identico a com'era. node test/gen-m6-check.js */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');

let checks = 0, fail = 0;
function ok(c, m) { checks++; if (!c) { fail++; console.error('  ✗ ' + m); } }

// 1) generated_m6_deep_equals_source: D.missions.M6 nel file generato ===
//    (deep-equal) la sorgente narrative/missions/M6.json.
const source = JSON.parse(fs.readFileSync(path.join(root, 'narrative/missions/M6.json'), 'utf8'));
// carica il file generato in una sandbox e leggi GAME.NarrativeData.missions.M6
const genPath = path.join(root, 'js/narrative-data.gen.js');
const sandbox = { window: {} };
sandbox.window.GAME = undefined;
const gen = fs.readFileSync(genPath, 'utf8');
new Function('window', gen)(sandbox.window);
const generatedM6 = sandbox.window.GAME.NarrativeData.missions.M6;
ok(JSON.stringify(generatedM6) === JSON.stringify(source), 'generated_m6_deep_equals_source (deep-equal sorgente↔generato)');

// 2) second_generation_hash_identical: due rigenerazioni producono lo STESSO hash.
function genHash() {
  execFileSync('node', [path.join(root, 'test/gen-narrative-data.js')], { cwd: root, stdio: 'ignore' });
  return crypto.createHash('sha256').update(fs.readFileSync(genPath)).digest('hex');
}
const h1 = genHash();
const h2 = genHash();
ok(h1 === h2, 'second_generation_hash_identical (' + h1.slice(0, 12) + ' == ' + h2.slice(0, 12) + ')');

console.log(fail === 0 ? checks + ' controlli gen-M6 superati ✔ (deep-equal + determinismo)' : fail + '/' + checks + ' FALLITI');
process.exit(fail === 0 ? 0 : 1);
