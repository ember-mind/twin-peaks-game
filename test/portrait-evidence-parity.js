#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = fs.realpathSync(path.resolve(__dirname, '..'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'canonical-sync.manifest.json'), 'utf8'));
const canonicalRoot = fs.realpathSync(manifest.canonical_root);
const deployRoot = fs.realpathSync('/Users/ebuccelli/Code/solo/projects/twin-peaks-game');
assert.notStrictEqual(canonicalRoot, deployRoot, 'canonical and deploy roots must be distinct');
assert(root === canonicalRoot || root === deployRoot, 'run from the canonical or deploy Twin Peaks root');

const files = [
  'js/portraits.js',
  'test/r69-reference-gates.js',
  'test/portrait-gates.js',
  'test/smoke.js',
  'test/retro-font.js',
  'portrait-progress.html',
  'test/portrait-evidence-parity.js',
  'canonical-sync.manifest.json',
  'tools/check-canonical-sync.js',
  'test/canonical-sync.js',
  'CANONICAL-SYNC.md'
];
function auditEvidence(canonical, deploy) {
  const hashes = [];
  const errors = [];
  for (const relative of files) {
    const canonicalFile = path.join(canonical, relative);
    const deployFile = path.join(deploy, relative);
    if (!fs.existsSync(canonicalFile)) { errors.push({ file: relative, error: 'canonical_missing' }); continue; }
    if (!fs.existsSync(deployFile)) { errors.push({ file: relative, error: 'deploy_missing' }); continue; }
    const canonicalStat = fs.lstatSync(canonicalFile);
    const deployStat = fs.lstatSync(deployFile);
    if (!canonicalStat.isFile() || canonicalStat.isSymbolicLink()) {
      errors.push({ file: relative, error: 'canonical_not_regular' }); continue;
    }
    if (!deployStat.isFile() || deployStat.isSymbolicLink()) {
      errors.push({ file: relative, error: 'deploy_not_regular' }); continue;
    }
    const canonicalBytes = fs.readFileSync(canonicalFile);
    const deployBytes = fs.readFileSync(deployFile);
    hashes.push(crypto.createHash('sha256').update(canonicalBytes).digest('hex'));
    if (!canonicalBytes.equals(deployBytes)) errors.push({ file: relative, error: 'byte_drift' });
  }
  return { ok: errors.length === 0, errors, hashes };
}

const report = auditEvidence(canonicalRoot, deployRoot);
assert.deepStrictEqual(report.errors, [], 'portrait evidence drift:\n' + JSON.stringify(report.errors, null, 2));
console.log('PORTRAIT-EVIDENCE-PARITY-PASS ' + files.length + '/' + files.length);
files.forEach((relative, i) => console.log('  ' + report.hashes[i] + '  ' + relative));

/* Le mutazioni restano in fixture temporanee: il test dimostra che anche un
 * solo byte nei tre punti critici rende il verdetto negativo. */
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-portrait-parity-'));
try {
  const fixtureCanonical = path.join(fixtureRoot, 'canonical');
  const fixtureDeploy = path.join(fixtureRoot, 'deploy');
  for (const relative of files) {
    for (const fixture of [fixtureCanonical, fixtureDeploy]) {
      const target = path.join(fixture, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(canonicalRoot, relative), target);
    }
  }
  for (const relative of ['js/portraits.js', 'test/r69-reference-gates.js', 'tools/check-canonical-sync.js']) {
    const target = path.join(fixtureDeploy, relative);
    fs.appendFileSync(target, '\n/* adversarial drift */\n');
    const drift = auditEvidence(fixtureCanonical, fixtureDeploy);
    assert.strictEqual(drift.ok, false, relative + ': mutated fixture must fail parity');
    assert.deepStrictEqual(drift.errors, [{ file: relative, error: 'byte_drift' }]);
    fs.copyFileSync(path.join(fixtureCanonical, relative), target);
  }
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
console.log('PORTRAIT-EVIDENCE-ADVERSARIAL-PASS 3/3');

module.exports = { auditEvidence, files };
