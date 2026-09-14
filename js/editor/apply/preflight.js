'use strict';

// PRE-APPLY CATALOG GATE. A changeset that would corrupt the connection registry is
// far cheaper to reject than to discover in a loaded game, so any *write* (commit) must
// first pass the catalog/bijection coverage gate. apply() itself stays dry-run-only; this
// module is what enforces "the catalog test runs before any apply."
//
// Node-only: it shells out to the real catalog tests as subprocesses and inspects their
// exit codes, exactly like a CI step — so a failing gate yields ok:false and preflightThenCommit
// throws BEFORE touching disk. Kept in js/editor/apply (not js/editor/core) on purpose: it
// names game test paths, which the core's zero-game-reference invariant forbids.

const { execFileSync } = require('child_process');
const path = require('path');

// js/editor/apply -> js/editor -> js -> repo root: three levels up. The gate scripts live at
// <root>/test, so a shallower join points them at js/test (MODULE_NOT_FOUND) and makes the gate
// fail closed — apply would always be blocked. Three levels is what reaches <root> correctly.
function repoRootOf() {
  return path.join(__dirname, '..', '..', '..');
}

// Run the catalog/bijection gate as subprocesses; returns {ok, output}. Never throws on a
// failed gate — that's the caller's decision. A nonzero exit (or a missing script) is treated
// as a failure and stops the chain immediately.
function runCatalogPreflight(opts) {
  const root = (opts && opts.repoRoot) || repoRootOf();
  const scripts = (opts && opts.scripts) || ['test/world-engine-v0.1-catalog.js', 'test/world-catalog-coverage.js'];
  const out = [];
  for (const s of scripts) {
    try {
      execFileSync(process.execPath, [path.join(root, s)], { stdio: 'pipe' });
     } catch (e) {
      out.push(`${s}: FAILED\n${(e && e.stderr ? e.stderr.toString() : String(e))}`);
       return { ok: false, output: out.join('\n') };
    }
    out.push(`${s}: PASS`);
   }
  return { ok: true, output: out.join('\n') };
}

// commit gated behind the catalog preflight: if the gate fails, throw BEFORE any write so a
// broken apply can never reach disk. opts.scripts / opts.repoRoot let tests steer the gate;
// everything else is forwarded to changeset-apply.commit unchanged.
function preflightThenCommit(targetPath, registry, auditSidecarPath, opts) {
  opts = opts || {};
  const pf = runCatalogPreflight(opts);
  if (!pf.ok) throw new Error(`[preflight] catalog gate failed — refusing to apply\n${pf.output}`);
  return require('./changeset-apply.js').commit(targetPath, registry, auditSidecarPath, opts);
}

module.exports = { runCatalogPreflight, preflightThenCommit };
