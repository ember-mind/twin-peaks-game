#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(REPO_ROOT, 'canonical-sync.manifest.json');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function productionScripts(indexHtml) {
  const out = [];
  const re = /<script\s+src=["']([^"'?]+)(?:\?[^"']*)?["']/g;
  let match;
  while ((match = re.exec(indexHtml))) out.push(match[1]);
  return out;
}

function recursiveFiles(root, relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];
  const out = [];
  fs.readdirSync(absoluteDir, { withFileTypes: true }).forEach(function (entry) {
    const relative = path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) out.push.apply(out, recursiveFiles(root, relative));
    else if (entry.isFile()) out.push(relative);
  });
  return out;
}

function scopeFor(manifest, repoRoot) {
  const index = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
  const assetRoots = manifest.runtime_asset_roots || [];
  const assetExtensions = manifest.runtime_asset_extensions || [];
  const runtimeAssets = assetRoots.reduce(function (all, relativeDir) {
    return all.concat(recursiveFiles(repoRoot, relativeDir).filter(function (relative) {
      return !assetExtensions.length || assetExtensions.indexOf(path.extname(relative)) >= 0;
    }));
  }, []);
  return Array.from(new Set(['index.html'].concat(
    productionScripts(index),
    runtimeAssets,
    manifest.runtime_assets || [],
    manifest.always_compare || []
  ))).sort();
}

function audit(options) {
  options = options || {};
  const repoRoot = options.repoRoot || REPO_ROOT;
  const manifestPath = options.manifestPath || path.join(repoRoot, 'canonical-sync.manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const strict = !!options.strict;
  const configuredCanonical = options.canonicalRoot || process.env.TP_CANONICAL_ROOT || manifest.canonical_root;
  /* Evidence mode usa solo root pinata dal manifest: nessun override env e
   * nessuna auto-comparazione del deploy puo produrre un falso PASS. */
  const canonicalRoot = strict ? manifest.canonical_root : configuredCanonical;
  const files = scopeFor(manifest, repoRoot);
  const known = manifest.known_divergences || {};
  const report = { canonical_root: canonicalRoot, checked: files.length, equal: [], known: [], errors: [] };
  if (strict && process.env.TP_CANONICAL_ROOT) {
    report.errors.push({ error: 'strict_canonical_override_forbidden' });
  }
  try {
    if (strict && fs.realpathSync(repoRoot) === fs.realpathSync(canonicalRoot)) {
      report.errors.push({ error: 'strict_self_comparison_forbidden' });
    }
  } catch (_) {
    report.errors.push({ error: 'strict_root_resolution_failed' });
  }

  files.forEach(function (relative) {
    const deployFile = path.join(repoRoot, relative);
    const canonicalFile = path.join(canonicalRoot, relative);
    if (!fs.existsSync(deployFile)) { report.errors.push({ file: relative, error: 'deploy_missing' }); return; }
    if (!fs.existsSync(canonicalFile)) { report.errors.push({ file: relative, error: 'canonical_missing' }); return; }
    const deployHash = sha256(deployFile), canonicalHash = sha256(canonicalFile);
    if (deployHash === canonicalHash) {
      if (known[relative]) report.errors.push({ file: relative, error: 'manifest_stale_divergence_resolved' });
      else report.equal.push(relative);
      return;
    }
    const entry = known[relative];
    if (!entry) { report.errors.push({ file: relative, error: 'unaudited_divergence', canonical_sha256: canonicalHash, deploy_sha256: deployHash }); return; }
    if (entry.canonical_sha256 !== canonicalHash || entry.deploy_sha256 !== deployHash) {
      report.errors.push({ file: relative, error: 'audited_hash_changed', expected: { canonical: entry.canonical_sha256, deploy: entry.deploy_sha256 }, actual: { canonical: canonicalHash, deploy: deployHash } });
      return;
    }
    report.known.push({ file: relative, disposition: entry.disposition });
  });

  Object.keys(known).forEach(function (relative) {
    if (files.indexOf(relative) < 0) report.errors.push({ file: relative, error: 'manifest_entry_outside_scope' });
  });
  report.ok = report.errors.length === 0 && report.known.length === 0;
  if (report.known.length) report.strict_error = 'known_divergences_remain';
  return report;
}

function print(report, asJson) {
  if (asJson) { console.log(JSON.stringify(report, null, 2)); return; }
  console.log('canonical-sync: ' + (report.ok ? 'PASS' : 'FAIL'));
  console.log('  checked=' + report.checked + ' equal=' + report.equal.length + ' known=' + report.known.length + ' errors=' + report.errors.length);
  report.known.forEach(function (entry) { console.log('  KNOWN ' + entry.file + ' [' + entry.disposition + ']'); });
  report.errors.forEach(function (entry) { console.error('  ERROR ' + entry.file + ' [' + entry.error + ']'); });
  if (report.strict_error) console.error('  ERROR ' + report.strict_error);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const report = audit({ strict: args.indexOf('--strict') >= 0 });
  print(report, args.indexOf('--json') >= 0);
  process.exitCode = report.ok ? 0 : 1;
}

module.exports = { audit, productionScripts, recursiveFiles, scopeFor, sha256 };
