'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const guard = require('../tools/check-canonical-sync.js');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'canonical-sync.manifest.json'), 'utf8'));
assert.strictEqual(manifest.schema_version, 2);
assert.strictEqual(manifest.canonical_root, '/Users/ebuccelli/Vault/1. Projects/Twin Peaks Game');
assert.ok(/runtime mirror/.test(manifest.policy));

const report = guard.audit({ repoRoot: root, canonicalRoot: manifest.canonical_root });
assert.deepStrictEqual(report.errors, [], JSON.stringify(report.errors, null, 2));
assert.strictEqual(report.checked, 96, 'playable runtime scope changed; audit manifest before sync'); // Act 3 closure: +traincar-art/-scene/-production
assert.deepStrictEqual(manifest.known_divergences, {});
assert.strictEqual(report.known.length, 0);

const isCanonicalRoot = fs.realpathSync(root) === fs.realpathSync(manifest.canonical_root);
const strict = guard.audit({ repoRoot: root, canonicalRoot: manifest.canonical_root, strict: true });
assert.strictEqual(strict.ok, !isCanonicalRoot, JSON.stringify(strict, null, 2));
if (!isCanonicalRoot) assert.strictEqual(strict.equal.length, strict.checked);
else assert(strict.errors.some(entry => entry.error === 'strict_self_comparison_forbidden'));
const self = guard.audit({ repoRoot: manifest.canonical_root, canonicalRoot: manifest.canonical_root, strict: true });
assert.strictEqual(self.ok, false, 'strict mode must reject canonical self-comparison');
assert(self.errors.some(entry => entry.error === 'strict_self_comparison_forbidden'));
const previousOverride = process.env.TP_CANONICAL_ROOT;
process.env.TP_CANONICAL_ROOT = root;
const overridden = guard.audit({ repoRoot: root, strict: true });
if (previousOverride === undefined) delete process.env.TP_CANONICAL_ROOT;
else process.env.TP_CANONICAL_ROOT = previousOverride;
assert.strictEqual(overridden.ok, false, 'strict mode must reject environment override');
assert(overridden.errors.some(entry => entry.error === 'strict_canonical_override_forbidden'));

/* Prove CLI, non solo chiamate alla libreria. Un env override deve produrre
 * exit 1; una root canonica che confronta se stessa deve fare altrettanto. */
const tool = path.join(root, 'tools', 'check-canonical-sync.js');
const overrideCli = childProcess.spawnSync(process.execPath, [tool, '--strict', '--json'], {
  cwd: root,
  encoding: 'utf8',
  env: Object.assign({}, process.env, { TP_CANONICAL_ROOT: root })
});
assert.strictEqual(overrideCli.status, 1, overrideCli.stderr || overrideCli.stdout);
const overrideReport = JSON.parse(overrideCli.stdout);
assert(overrideReport.errors.some(entry => entry.error === 'strict_canonical_override_forbidden'),
  'strict CLI must reject TP_CANONICAL_ROOT');

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-canonical-self-'));
try {
  fs.mkdirSync(path.join(fixtureRoot, 'tools'), { recursive: true });
  fs.copyFileSync(tool, path.join(fixtureRoot, 'tools', 'check-canonical-sync.js'));
  fs.writeFileSync(path.join(fixtureRoot, 'index.html'), '<!doctype html><title>fixture</title>\n');
  fs.writeFileSync(path.join(fixtureRoot, 'canonical-sync.manifest.json'), JSON.stringify({
    schema_version: 2,
    canonical_root: fixtureRoot,
    policy: 'strict self-comparison fixture',
    runtime_asset_roots: [],
    runtime_asset_extensions: [],
    runtime_assets: [],
    always_compare: [],
    known_divergences: {}
  }, null, 2) + '\n');
  const cleanEnv = Object.assign({}, process.env);
  delete cleanEnv.TP_CANONICAL_ROOT;
  const selfCli = childProcess.spawnSync(process.execPath,
    [path.join(fixtureRoot, 'tools', 'check-canonical-sync.js'), '--strict', '--json'], {
      cwd: fixtureRoot, encoding: 'utf8', env: cleanEnv
    });
  assert.strictEqual(selfCli.status, 1, selfCli.stderr || selfCli.stdout);
  const selfReport = JSON.parse(selfCli.stdout);
  assert(selfReport.errors.some(entry => entry.error === 'strict_self_comparison_forbidden'),
    'strict CLI must reject canonical self-comparison');
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
console.log('CANONICAL-SYNC-PASS ' + report.checked + ' runtime files; exact equality; ADVERSARIAL 2/2');
