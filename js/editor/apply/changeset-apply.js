// js/editor/apply/changeset-apply.js — WORLD REGISTRY EDITING, STEP 4 (node-only).
//
// A "changeset" is a list of audited operations against the connection registry
// ({version, connections[]}). apply() returns the NEXT registry WITHOUT touching disk
// (dry-run is the default): callers must pass {write:true} AND a target path to persist.
// This separation is the whole point — the authoritative world/connections.json is never
// mutated by a mere "apply"; it can only grow on an explicit, logged commit.
//
// Contract (kept deliberately small — see the audit trail in this module's git history for
// why nested-path patches were rejected: they are hard to validate and easy to mis-audit):
//   changeset = { operations: [ {op:'upsert', connection:{id,a,b}}, {op:'remove', id},
//                               {op:'create', connection:{id,a,b}}, {op:'delete', id} ] }
// Upsert replaces-or-adds a whole record by id; create adds a NEW id only; remove/delete drop one. No partial paths.
//
// The audit log lives in a SEPARATE append-only sidecar (world/connections.audit.jsonl),
// not inside the registry: consumers (gen-world-data, world-engine) parse only {version,
// connections}, and embedding editor metadata there would pollute that shape.

'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function fail(msg) { throw new Error('[changeset-apply] ' + msg); }

// ---- registry / record validation: mirrors the checks in test/gen-world-data.js so a
 // changeset can never put the registry in a state gen would reject.
function validateRecord(c, where) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) fail(where + ': connection is not an object');
  if (typeof c.id !== 'string' || !c.id) fail(where + ': connection has no non-empty id');
  if (c.one_way !== undefined && c.one_way !== true) fail(where + ': one_way must be true when present');
  const oneWay = c.one_way === true;
  for (const key of ['a', 'b']) {
    const ep = c[key];
    if (!ep || typeof ep !== 'object') fail(`${where}.${key}: endpoint missing`);
    if (typeof ep.scene !== 'string' || !ep.scene) fail(`${where}.${key}.scene must name a scene`);
    if (!Array.isArray(ep.triggers)) fail(`${where}.${key}.triggers must be an array`);
    if (oneWay && key === 'a') { if (ep.spawn !== undefined) fail(`${where}.a.spawn is not allowed on a one-way connection`); continue; }
    if (oneWay && key === 'b' && ep.triggers.length) fail(`${where}.b.triggers must be empty on a one-way connection`);
    if (!ep.spawn || typeof ep.spawn.tx !== 'number') fail(`${where}.${key}.spawn.tx must be numeric`);
  }
  return c;
}

function validateRegistry(registry) {
  if (!registry || typeof registry !== 'object' || !Array.isArray(registry.connections)) {
    fail('registry must be an object with a connections[] array');
  }
  const version = (registry.version == null) ? 1 : registry.version;
  if (typeof version !== 'number') fail('registry.version must be numeric');
  const seen = new Set();
  for (let i = 0; i < registry.connections.length; i++) {
    validateRecord(registry.connections[i], `registry[${i}]`);
    if (seen.has(registry.connections[i].id)) fail(`duplicate connection id: ${registry.connections[i].id}`);
    seen.add(registry.connections[i].id);
  }
  return registry;
}

function validateChangeset(changeset) {
  if (!changeset || typeof changeset !== 'object' || !Array.isArray(changeset.operations)) {
    fail('changeset must be an object with an operations[] array');
  }
  changeset.operations.forEach(function (op, i) {
    if (!op || typeof op !== 'object') fail(`operations[${i}] is not an object`);
    if (op.op === 'upsert' || op.op === 'create') validateRecord(op.connection, `operations[${i}].connection`);
    else if (op.op === 'remove' || op.op === 'delete') {
      if (typeof op.id !== 'string' || !op.id) fail(`operations[${i}].id must be a non-empty string`);
    } else {
      fail(`operations[${i}].op is unknown: ${String(op.op)}`);
    }
  });
  return changeset;
}

// ---- apply (PURE, dry-run by default): returns the next registry + an audit entry, no I/O.
function apply(registry, changeset, opts) {
  opts = opts || {};
  validateRegistry(registry);
  validateChangeset(changeset);
  const fromVersion = (registry.version == null) ? 1 : registry.version;

  // Work on a shallow-cloned record list; upsert/remove operate by id so the source registry is
  // never mutated. A deep copy keeps apply side-effect-free even for nested fields.
  const byId = {};
  const nextConnections = registry.connections.map(function (c) {
    byId[c.id] = JSON.parse(JSON.stringify(c));
    return byId[c.id];
  });

  const changes = [];
  changeset.operations.forEach(function (op, i) {
    if (op.op === 'upsert') {
      const rec = JSON.parse(JSON.stringify(op.connection)); // owned copy of the validated record
      const existed = Object.prototype.hasOwnProperty.call(byId, op.connection.id);
      byId[rec.id] = rec;
      // Maintain insertion order: replace in place if present, else append.
      if (existed) {
        const idx = nextConnections.findIndex(function (c) { return c.id === rec.id; });
        nextConnections[idx] = rec;
      } else {
        nextConnections.push(rec);
      }
      changes.push({ op: 'upsert', id: rec.id, existed: existed });
    } else if (op.op === 'create') {
      // M6 (changeset v2): create never overwrites an existing record.
      if (Object.prototype.hasOwnProperty.call(byId, op.connection.id)) fail(`operations[${i}] creates existing id "${op.connection.id}"`);
      const rec = JSON.parse(JSON.stringify(op.connection));
      byId[rec.id] = rec;
      nextConnections.push(rec);
      changes.push({ op: 'create', id: rec.id });
    } else if (op.op === 'remove' || op.op === 'delete') {
      // Fail loud on an unknown id: a silent no-op here would let a typo masquerade as success.
      if (!Object.prototype.hasOwnProperty.call(byId, op.id)) fail(`operations[${i}] removes unknown id "${op.id}"`);
      delete byId[op.id];
      for (let j = nextConnections.length - 1; j >= 0; j--) {
        if (nextConnections[j].id === op.id) nextConnections.splice(j, 1);
      }
      changes.push({ op: op.op, id: op.id });
    }
  });

  const toVersion = fromVersion + 1;
  const auditEntry = {
    fromVersion: fromVersion,
    toVersion: toVersion,
    stamp: opts.stamp == null ? null : opts.stamp, // deterministic by default; caller may pin one
    changes: changes
  };

  // The next registry carries the bumped version + the new record list. Audit stays a sidecar
  // (see module header) — we return it so the caller can append it without polluting {version,connections}.
  const next = { version: toVersion, connections: nextConnections };
  validateRegistry(next); // the result must itself be a legal registry
  return { dryRun: true, next: next, auditEntry: auditEntry, fromVersion: fromVersion, toVersion: toVersion };
}

// ---- commit: atomic write of the bumped registry + append-only audit sidecar.
 // Never called by apply(); only when a caller explicitly asks for a persisted change.
function commit(targetPath, registry, auditSidecarPath, opts) {
  const result = apply(registry, opts.changeset || { operations: [] }, opts);
  const tmp = targetPath + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(result.next, null, 2) + '\n');
  if (auditSidecarPath) {
    // append-only jsonl: one audit entry per line, newest last.
    fs.appendFileSync(auditSidecarPath, JSON.stringify(result.auditEntry) + '\n');
  }
  fs.renameSync(tmp, targetPath); // atomic on POSIX
  return Object.assign({}, result, { dryRun: false, wrote: targetPath });
}

// ---- regenerate the runtime binding from the (just written) source. Delegates to the canonical
 // generator so gen-world-data.js stays the single source of truth for the .gen.js format.
// js/editor/apply -> repo root is three levels up; the generator lives at <root>/test. The
// default is only a convenience — callers that know their root should pass it explicitly, and
// apply-changeset.js isolates correctness without ever invoking this for real commits.
function regenerate(repoRoot) {
  const gen = path.join(repoRoot || path.join(__dirname, '..', '..', '..'), 'test', 'gen-world-data.js');
  execFileSync(process.execPath, [gen], { stdio: 'inherit' });
}

// ---- read-only story-moment cast view: which connections are "live" when a moment makes a set of
 // scenes present. Pure; derived from the registry alone, no narrative mutation. A connection is live
 // when at least one endpoint sits on an active scene (a step is possible if either side is present).
function buildCastView(registry, activeScenes) {
  validateRegistry(registry);
  const active = new Set((activeScenes || []).map(String));
  return registry.connections.map(function (c) {
    const aActive = active.has(String(c.a.scene));
    const bActive = active.has(String(c.b.scene));
    return { id: c.id, aScene: c.a.scene, bScene: c.b.scene, live: aActive || bActive, bothEndsLive: aActive && bActive };
  });
}

module.exports = {
  validateRegistry: validateRegistry,
  validateChangeset: validateChangeset,
  apply: apply,
  commit: commit,
  regenerate: regenerate,
  buildCastView: buildCastView
};
