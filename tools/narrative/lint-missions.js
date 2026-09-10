#!/usr/bin/env node
/* tools/narrative/lint-missions.js
 *
 * Deterministic studio validator for the narrative mission graph.
 * Implements docs/narrative-system-v0.1.md §16, checks 1-7. No LLM calls,
 * no network, no mutation of any narrative/js source file.
 *
 * Usage: node tools/narrative/lint-missions.js [--json] [--allow=path]
 * Exports: lint(opts) -> { errors, warnings, checksRun }
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (isPlainObject(a) || isPlainObject(b)) {
    if (!isPlainObject(a) || !isPlainObject(b)) return false;
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (!deepEqual(ka, kb)) return false;
    for (const k of ka) if (!deepEqual(a[k], b[k])) return false;
    return true;
  }
  return false;
}

const PROP_ID_RE = /^P\d+[A-Z]?$/;

function lint(opts) {
  opts = opts || {};
  const allowlistPath = opts.allowlistPath || path.join(ROOT, 'tools/narrative/lint-allowlist.json');
  let allow = { dangling: [], external_writers: [], external_writer_patterns: [], single_writer_flags: [], write_once_values: [], known_open: [], documented_multiple_writers: [] };
  if (fs.existsSync(allowlistPath)) {
    const raw = loadJSON(allowlistPath);
    allow = Object.assign({}, allow, raw);
  }
  const danglingAllow = new Set((allow.dangling || []).map((d) => (typeof d === 'string' ? d : d.key)));
  const singleWriterFlags = new Set((allow.single_writer_flags || []).map((d) => (typeof d === 'string' ? d : d.key)));
  const externalWriters = new Set((allow.external_writers || []).map((e) => `${e.kind}:${e.key}`));
  const externalWriterPatterns = (allow.external_writer_patterns || []).map((e) => ({ kind: e.kind, re: new RegExp(e.pattern) }));
  // known_open: a real, tracked defect that a milestone boundary forbids
  // fixing right now. It downgrades ONE specific (check, key) error to a
  // WARN so the sweep stays green, but the defect stays visible on every
  // run (never silent) and carries an owner_milestone. Remove the entry —
  // do not just let it rot — the moment the defect is actually fixed.
  const knownOpen = new Map();
  (allow.known_open || []).forEach((e) => knownOpen.set(`${e.check}:${e.key}`, e));
  // documented_multiple_writers: a specific flag multi-writer WARNING (never
  // an error -- single_writer_flags is the escalation path for that) that
  // is a reasoned design, e.g. mutually exclusive branches all setting the
  // same flag. Suppressed like a dangling allowlist entry, with a reason.
  const documentedMultiWriters = new Map();
  (allow.documented_multiple_writers || []).forEach((e) => documentedMultiWriters.set(e.key, e));

  const missionsDir = path.join(ROOT, 'narrative/missions');
  const missionFiles = fs.readdirSync(missionsDir).filter((f) => /^M\d+\.json$/.test(f)).sort();
  const missions = {};
  for (const f of missionFiles) {
    const id = f.replace(/\.json$/, '');
    missions[id] = loadJSON(path.join(missionsDir, f));
  }
  const missionIds = Object.keys(missions);

  const evidenceData = loadJSON(path.join(ROOT, 'narrative/evidence.json')).evidence;
  const propositionsData = loadJSON(path.join(ROOT, 'narrative/propositions.json')).propositions;
  const enumsData = loadJSON(path.join(ROOT, 'narrative/state-enums.json'));
  const valuesAllowed = enumsData.values_allowed || {};
  const enumDomains = enumsData.enums || {};

  const adapterText = fs.readFileSync(path.join(ROOT, 'js/narrative-engine-adapter.js'), 'utf8');
  const productionText = fs.readFileSync(path.join(ROOT, 'js/narrative-production.js'), 'utf8');

  const errors = [];
  const warnings = [];
  let checksRun = 0;

  function err(check, msg, extra) {
    errors.push(Object.assign({}, extra || {}, { check, message: msg }));
  }
  function warn(check, msg, extra) {
    warnings.push(Object.assign({}, extra || {}, { check, message: msg }));
  }

  // ---------------------------------------------------------------------
  // Node index per mission (for node_done existence + optional/mandatory lookup)
  // ---------------------------------------------------------------------
  const nodesByMission = {};
  for (const mid of missionIds) {
    const idx = {};
    (missions[mid].nodes || []).forEach((n) => { idx[n.id] = n; });
    nodesByMission[mid] = idx;
  }
  // node_done is evaluated by the runtime against a GLOBAL state.nodes_done
  // map (js/narrative-runtime.js evalCond: `state.nodes_done[cond.node_done]`),
  // not scoped per mission -- entry_condition routinely references the prior
  // mission's completion node (e.g. M9 entry_condition -> M8's m8_station).
  // Node ids must therefore be unique across all missions; validate existence
  // against the GLOBAL id set, not the reading mission's own node list.
  const allNodeIds = new Set();
  for (const mid of missionIds) Object.keys(nodesByMission[mid]).forEach((id) => allNodeIds.add(id));

  // ---------------------------------------------------------------------
  // WRITES — flag / evidence / value / proposition_path, from effects arrays,
  // completion.sets, carryover_evidence and presentation "accepted" results.
  // ---------------------------------------------------------------------
  // writesIndex[kind][key] = [{mission, node, optional}]
  const writesIndex = { flag: {}, evidence: {}, value: {}, proposition_path: {} };
  // writesIndexWriteOnce[key] = [{mission, node}] -- only 'value' effects that
  // are gated by the runtime's write-once guard (excludes value_transition).
  const writeOnceWriters = {};

  function recordWrite(kind, key, mid, nodeId, extra) {
    if (!writesIndex[kind][key]) writesIndex[kind][key] = [];
    writesIndex[kind][key].push(Object.assign({ mission: mid, node: nodeId }, extra || {}));
  }
  function recordWriteOnce(key, mid, nodeId) {
    if (!writeOnceWriters[key]) writeOnceWriters[key] = [];
    writeOnceWriters[key].push({ mission: mid, node: nodeId });
  }

  function nodeIsOptional(node) {
    return node && node.optional === true;
  }

  function scanEffectsArray(effs, mid, node) {
    if (!Array.isArray(effs)) return;
    const nodeId = node.id;
    const optional = nodeIsOptional(node);
    for (const e of effs) {
      if (!e || typeof e !== 'object') continue;
      if (typeof e.set === 'string') recordWrite('flag', e.set, mid, nodeId, { optional });
      if (typeof e.evidence === 'string') recordWrite('evidence', e.evidence, mid, nodeId, { optional });
      if (typeof e.proposition === 'string' && 'to' in e) {
        recordWrite('proposition_path', `${e.proposition}.formulation.status`, mid, nodeId, { optional });
      }
      if (typeof e.value === 'string') {
        recordWrite('value', e.value, mid, nodeId, { optional });
        if ('to' in e || 'from_value' in e || 'opposite_of' in e || 'from_derivation' in e) {
          recordWriteOnce(e.value, mid, nodeId);
        }
        if (typeof e.from_value === 'string') recordWrite('value', e.from_value, mid, nodeId, { readOnly: true });
        if (typeof e.opposite_of === 'string') recordWrite('value', e.opposite_of, mid, nodeId, { readOnly: true });
        if (e.from_derivation && typeof e.from_derivation.of === 'string') {
          recordWrite('value', e.from_derivation.of, mid, nodeId, { readOnly: true });
        }
      }
      if (e.value_transition && typeof e.value_transition.name === 'string') {
        recordWrite('value', e.value_transition.name, mid, nodeId, { optional, transition: true });
      }
    }
  }

  function scanPresentationWrites(node, mid) {
    const on = node.presentation && node.presentation.on;
    if (!on) return;
    for (const pid of Object.keys(on)) {
      if (!PROP_ID_RE.test(pid)) continue;
      let acceptedFound = false;
      (function walk(o) {
        if (acceptedFound || o == null || typeof o !== 'object') return;
        if (o.result === 'accepted') { acceptedFound = true; return; }
        for (const k of Object.keys(o)) walk(o[k]);
      })(on[pid]);
      if (acceptedFound) {
        recordWrite('proposition_path', `${pid}.social_status.accepted_by`, mid, node.id, { optional: nodeIsOptional(node) });
      }
    }
  }

  for (const mid of missionIds) {
    const m = missions[mid];
    if (m.completion && Array.isArray(m.completion.sets)) {
      m.completion.sets.forEach((f) => recordWrite('flag', f, mid, `${mid}:completion`, { optional: false }));
    }
    (m.carryover_evidence || []).forEach((entry) => {
      if (typeof entry.evidence === 'string') {
        recordWrite('evidence', entry.evidence, mid, `${mid}:carryover_evidence`, { optional: false, external: true });
      }
    });
    (m.nodes || []).forEach((node) => {
      scanEffectsArray(node.effects, mid, node);
      (node.choices || []).forEach((ch) => scanEffectsArray(ch.effects, mid, node));
      scanPresentationWrites(node, mid);
    });
  }

  // ---------------------------------------------------------------------
  // READS — flag / evidence / value / node_done / proposition_path, from
  // conditions, entry_condition, completion.when, objectives[].when,
  // milestones[].pending_when|resolved_when, repeat_when, completion_when,
  // page condition, pages_by_value.value, observation_groups, presentation
  // attachment_required/when_attached_all/attachment_responses keys, and
  // (separately) NARRATIVE_ENTITIES `when` in the adapter + production sync.
  // ---------------------------------------------------------------------
  const readsIndex = { flag: {}, evidence: {}, value: {}, proposition_path: {} };
  const nodeDoneReads = {}; // mission -> Set(node ids referenced)

  function recordRead(kind, key, mid, nodeId, ctx) {
    if (!readsIndex[kind][key]) readsIndex[kind][key] = [];
    readsIndex[kind][key].push({ mission: mid, node: nodeId, context: ctx });
  }

  function checkValueName(name, mid, nodeId, ctx) {
    if (!Object.prototype.hasOwnProperty.call(valuesAllowed, name)) {
      err('read-before-write', `unknown value_set/value_is name "${name}" not declared in state-enums.json values_allowed (${ctx} in ${mid}${nodeId ? '/' + nodeId : ''})`,
        { kind: 'value', key: name, mission: mid, node: nodeId });
    }
  }
  function checkValueIsEquals(name, equalsVal, mid, nodeId) {
    const enumKey = valuesAllowed[name];
    if (!enumKey) return; // already reported by checkValueName
    const domain = enumDomains[enumKey];
    if (Array.isArray(domain) && domain.indexOf(equalsVal) === -1) {
      err('read-before-write', `value_is "${name}" compares against "${equalsVal}" which is not in enums.${enumKey} (${mid}${nodeId ? '/' + nodeId : ''})`,
        { kind: 'value', key: name, mission: mid, node: nodeId });
    }
  }

  function scanReadsGeneric(obj, mid, nodeId) {
    if (Array.isArray(obj)) { obj.forEach((v) => scanReadsGeneric(v, mid, nodeId)); return; }
    if (!isPlainObject(obj)) return;

    if (typeof obj.flag === 'string') recordRead('flag', obj.flag, mid, nodeId, 'condition');
    if (typeof obj.evidence === 'string') recordRead('evidence', obj.evidence, mid, nodeId, 'condition');
    if (typeof obj.value_set === 'string') {
      recordRead('value', obj.value_set, mid, nodeId, 'condition');
      checkValueName(obj.value_set, mid, nodeId, 'value_set');
    }
    if (isPlainObject(obj.value_is) && typeof obj.value_is.name === 'string') {
      recordRead('value', obj.value_is.name, mid, nodeId, 'condition');
      checkValueName(obj.value_is.name, mid, nodeId, 'value_is');
      if ('equals' in obj.value_is) checkValueIsEquals(obj.value_is.name, obj.value_is.equals, mid, nodeId);
    }
    if (typeof obj.node_done === 'string') {
      if (!nodeDoneReads[mid]) nodeDoneReads[mid] = new Set();
      nodeDoneReads[mid].add(obj.node_done);
      if (!allNodeIds.has(obj.node_done)) {
        err('read-before-write', `node_done "${obj.node_done}" does not exist as a node id in any mission (referenced in ${mid}${nodeId ? '/' + nodeId : ' mission-level condition'})`,
          { kind: 'node_done', key: obj.node_done, mission: mid, node: nodeId });
      }
    }
    if (typeof obj.proposition_path === 'string') {
      recordRead('proposition_path', obj.proposition_path, mid, nodeId, 'condition');
      const propId = obj.proposition_path.split('.')[0];
      if (!Object.prototype.hasOwnProperty.call(propositionsData, propId)) {
        err('read-before-write', `proposition_path "${obj.proposition_path}" references unknown proposition "${propId}" (${mid}${nodeId ? '/' + nodeId : ''})`,
          { kind: 'proposition_path', key: obj.proposition_path, mission: mid, node: nodeId });
      }
    }

    for (const k of Object.keys(obj)) {
      if (k === 'effects') continue; // effects are writes, scanned separately
      if (k === 'presentation') { scanPresentationReads(obj[k], mid, nodeId); continue; }
      scanReadsGeneric(obj[k], mid, nodeId);
    }
  }

  function scanPresentationReads(pres, mid, nodeId) {
    if (!isPlainObject(pres)) return;
    const on = pres.on;
    if (isPlainObject(on)) {
      for (const pid of Object.keys(on)) {
        // NR.presentationOptions reads formulation.status for every key under
        // `on` (js/narrative-runtime.js ~line 434), regardless of accept/reject.
        if (PROP_ID_RE.test(pid)) recordRead('proposition_path', `${pid}.formulation.status`, mid, nodeId, 'presentation.on (presentationOptions)');
        (function walk(o) {
          if (o == null) return;
          if (Array.isArray(o)) { o.forEach(walk); return; }
          if (!isPlainObject(o)) return;
          if (Array.isArray(o.attachment_required)) {
            o.attachment_required.forEach((ev) => recordRead('evidence', ev, mid, nodeId, 'presentation.attachment_required'));
          }
          if (Array.isArray(o.when_attached_all)) {
            o.when_attached_all.forEach((ev) => recordRead('evidence', ev, mid, nodeId, 'presentation.when_attached_all'));
          }
          if (isPlainObject(o.attachment_responses)) {
            Object.keys(o.attachment_responses).forEach((ev) => recordRead('evidence', ev, mid, nodeId, 'presentation.attachment_responses'));
          }
          for (const k of Object.keys(o)) {
            if (k === 'effects') continue;
            if (k === 'attachment_required' || k === 'when_attached_all' || k === 'attachment_responses') continue;
            walk(o[k]);
          }
        })(on[pid]);
      }
    }
    // any other generic condition-shaped leaves under presentation (rare, but
    // stay generic) -- skip 'on' (already handled above) and 'effects'.
    for (const k of Object.keys(pres)) {
      if (k === 'on' || k === 'effects') continue;
      scanReadsGeneric(pres[k], mid, nodeId);
    }
  }

  for (const mid of missionIds) {
    const m = missions[mid];
    if (m.entry_condition) scanReadsGeneric(m.entry_condition, mid, null);
    if (m.completion && m.completion.when) scanReadsGeneric(m.completion.when, mid, null);
    (m.objectives || []).forEach((o) => { if (o.when) scanReadsGeneric(o.when, mid, o.id); });
    (m.milestones || []).forEach((ms) => {
      if (ms.pending_when) scanReadsGeneric(ms.pending_when, mid, ms.id);
      if (ms.resolved_when) scanReadsGeneric(ms.resolved_when, mid, ms.id);
    });
    (m.nodes || []).forEach((node) => {
      if (node.conditions) scanReadsGeneric(node.conditions, mid, node.id);
      if (node.completion_when) scanReadsGeneric(node.completion_when, mid, node.id);
      if (node.repeat_when) scanReadsGeneric(node.repeat_when, mid, node.id);
      if (node.pages) scanReadsGeneric(node.pages, mid, node.id); // page-level `condition`
      if (node.pages_after_branch) scanReadsGeneric(node.pages_after_branch, mid, node.id);
      if (node.presentation) scanPresentationReads(node.presentation, mid, node.id);
      (node.choices || []).forEach((ch) => {
        if (ch.feedback_pages) scanReadsGeneric(ch.feedback_pages, mid, node.id);
      });
      // pages_by_value.value is a runtime read of that value_set
      if (node.pages_by_value && typeof node.pages_by_value.value === 'string') {
        recordRead('value', node.pages_by_value.value, mid, node.id, 'pages_by_value.value');
        checkValueName(node.pages_by_value.value, mid, node.id, 'pages_by_value.value');
      }
    });
    // observation_groups: evidence ids grouped for groups_completed() reads
    if (m.observation_groups && isPlainObject(m.observation_groups.groups)) {
      Object.values(m.observation_groups.groups).forEach((arr) => {
        (arr || []).forEach((ev) => recordRead('evidence', ev, mid, null, 'observation_groups'));
      });
    }
  }

  // NARRATIVE_ENTITIES `when` in the adapter (regex over the whole file: this
  // pattern only occurs in that block in practice).
  {
    const reAdapter = /(flag|value_set|node_done|evidence):\s*'([^']+)'/g;
    let mch;
    while ((mch = reAdapter.exec(adapterText))) {
      const kind = mch[1] === 'value_set' ? 'value' : mch[1];
      if (kind === 'node_done') continue; // adapter node_done refs are not mission-scoped
      recordRead(kind, mch[2], '(adapter)', null, 'NARRATIVE_ENTITIES.when');
    }
  }

  // Production sync flags: regex on state.flags.<name> / flags.<name> in
  // js/narrative-production.js. This set is used BOTH as a read-protector
  // (dangling) and as an external-writer allowance (read-before-write).
  const productionSyncFlags = new Set();
  {
    const re = /\bflags\.(\w+)/g;
    let mch;
    while ((mch = re.exec(productionText))) productionSyncFlags.add(mch[1]);
    productionSyncFlags.forEach((f) => recordRead('flag', f, '(production-sync)', null, 'narrative-production.js flags.<name>'));
  }

  // Evidence whose `supports` proposition is itself read anywhere counts as read.
  const propositionReadIds = new Set();
  Object.keys(readsIndex.proposition_path).forEach((p) => propositionReadIds.add(p.split('.')[0]));
  Object.keys(evidenceData).forEach((evId) => {
    const supports = evidenceData[evId].supports || [];
    if (supports.some((p) => propositionReadIds.has(p))) {
      recordRead('evidence', evId, '(evidence.supports)', null, 'evidence.supports -> read proposition');
    }
  });

  checksRun++; // read/write index built (not a standalone check, but counted below per-check)

  // ---------------------------------------------------------------------
  // CHECK 1 — DANGLING STATE (warning)
  // ---------------------------------------------------------------------
  checksRun++;
  for (const kind of ['flag', 'evidence', 'value', 'proposition_path']) {
    for (const key of Object.keys(writesIndex[kind])) {
      if (danglingAllow.has(key)) continue;
      const isRead = !!(readsIndex[kind][key] && readsIndex[kind][key].length);
      if (isRead) continue;
      const writers = writesIndex[kind][key].map((w) => `${w.mission}/${w.node}`);
      warn('dangling-state', `${kind} "${key}" is written but never read`, { kind, key, writers });
    }
  }

  // ---------------------------------------------------------------------
  // CHECK 2 — READ-BEFORE-WRITE (error)
  // ---------------------------------------------------------------------
  checksRun++;
  function isExternalWriter(kind, key, mid) {
    if (mid === '(adapter)' || mid === '(production-sync)' || mid === '(evidence.supports)') return true;
    if (kind === 'flag' && productionSyncFlags.has(key)) return true;
    if (externalWriters.has(`${kind}:${key}`)) return true;
    for (const p of externalWriterPatterns) if (p.kind === kind && p.re.test(key)) return true;
    if (kind === 'evidence') {
      const ev = evidenceData[key];
      if (ev && ev.acquired_in && !missionIds.includes(ev.acquired_in)) return true;
    }
    return false;
  }

  for (const kind of ['flag', 'evidence', 'value', 'proposition_path']) {
    for (const key of Object.keys(readsIndex[kind])) {
      if (writesIndex[kind][key] && writesIndex[kind][key].length) continue;
      const occurrences = readsIndex[kind][key];
      // "external" is decided per-key: if ANY occurrence's mission marks it
      // external, or the key itself is globally external, treat as external.
      const anyExternal = occurrences.some((o) => isExternalWriter(kind, key, o.mission)) || isExternalWriter(kind, key, null);
      if (anyExternal) continue;
      const first = occurrences.find((o) => o.mission !== '(adapter)' && o.mission !== '(production-sync)' && o.mission !== '(evidence.supports)') || occurrences[0];
      err('read-before-write', `${kind} "${key}" is read but never written by any mission effect, and has no declared external writer`,
        { kind, key, mission: first.mission, node: first.node, context: first.context });
    }
  }

  // ---------------------------------------------------------------------
  // CHECK 3 — MULTIPLE WRITERS (error / warning)
  // ---------------------------------------------------------------------
  checksRun++;
  // Exclusivity helpers (also used by CHECK 5 below): a pair of writer nodes
  // whose own top-level `conditions` are provably mutually exclusive (e.g.
  // `value_is m5_initial_theory=degeneration` vs `=withheld`, or a positive
  // vs a `not` of the same key) is a legitimate branching design, not a
  // multiple-writer risk.
  function flattenTopConditions(conditions) {
    const out = [];
    (conditions || []).forEach((c) => {
      if (!isPlainObject(c)) return;
      let negated = false;
      let leaf = c;
      if (isPlainObject(c.not)) { negated = true; leaf = c.not; }
      if (typeof leaf.flag === 'string') out.push({ type: 'flag', key: leaf.flag, negated });
      else if (typeof leaf.evidence === 'string') out.push({ type: 'evidence', key: leaf.evidence, negated });
      else if (typeof leaf.node_done === 'string') out.push({ type: 'node_done', key: leaf.node_done, negated });
      else if (typeof leaf.value_set === 'string') out.push({ type: 'value_set', key: leaf.value_set, negated });
      else if (isPlainObject(leaf.value_is) && typeof leaf.value_is.name === 'string') {
        out.push({ type: 'value_is', key: leaf.value_is.name, value: leaf.value_is.equals, negated });
      }
    });
    return out;
  }
  function conditionsExclusive(condsA, condsB) {
    const flatA = flattenTopConditions(condsA);
    const flatB = flattenTopConditions(condsB);
    for (const a of flatA) {
      for (const b of flatB) {
        if (a.type !== b.type || a.key !== b.key) continue;
        if (a.type === 'value_is') {
          if (!a.negated && !b.negated && a.value !== b.value) return true;
        } else {
          if (a.negated !== b.negated) return true; // one requires X, other requires not X
        }
      }
    }
    return false;
  }
  function allWritersPairwiseExclusive(writers) {
    if (writers.length < 2) return true;
    for (let i = 0; i < writers.length; i++) {
      for (let j = i + 1; j < writers.length; j++) {
        const na = nodesByMission[writers[i].mission] && nodesByMission[writers[i].mission][writers[i].node];
        const nb = nodesByMission[writers[j].mission] && nodesByMission[writers[j].mission][writers[j].node];
        if (!na || !nb) return false; // synthetic writer (completion/carryover): can't prove exclusivity
        if (!conditionsExclusive(na.conditions || [], nb.conditions || [])) return false;
      }
    }
    return true;
  }

  // evidence: any evidence written by more than one distinct node -> error,
  // unless every pair of writer nodes is provably mutually exclusive.
  for (const key of Object.keys(writesIndex.evidence)) {
    const uniqueWriters = [];
    const seen = new Set();
    writesIndex.evidence[key].forEach((w) => {
      const id = `${w.mission}/${w.node}`;
      if (!seen.has(id)) { seen.add(id); uniqueWriters.push(w); }
    });
    if (uniqueWriters.length > 1 && !allWritersPairwiseExclusive(uniqueWriters)) {
      err('multiple-writers', `evidence "${key}" is written by more than one node: ${Array.from(seen).join(', ')}`,
        { kind: 'evidence', key, writers: Array.from(seen) });
    }
  }
  // values: write-once effects (`to`/`from_value`/`opposite_of`/`from_derivation`),
  // never `value_transition`, grouped by node. Mutually exclusive alternate
  // entry points (e.g. m5_final_theory via m5_theory_revision vs
  // m5_theory_first) are not flagged.
  const effectiveWriteOnce = (allow.write_once_values && allow.write_once_values.length)
    ? new Set(allow.write_once_values)
    : new Set(Object.keys(valuesAllowed));
  for (const key of Object.keys(writeOnceWriters)) {
    if (!effectiveWriteOnce.has(key)) continue;
    const uniqueWriters = [];
    const seen = new Set();
    writeOnceWriters[key].forEach((w) => {
      const id = `${w.mission}/${w.node}`;
      if (!seen.has(id)) { seen.add(id); uniqueWriters.push(w); }
    });
    if (uniqueWriters.length > 1 && !allWritersPairwiseExclusive(uniqueWriters)) {
      err('multiple-writers', `write-once value "${key}" is written by more than one node: ${Array.from(seen).join(', ')}`,
        { kind: 'value', key, writers: Array.from(seen) });
    }
  }
  // flags: warning if >1 writer node, error only if in single_writer_flags
  for (const key of Object.keys(writesIndex.flag)) {
    const nodeSet = new Set(writesIndex.flag[key].map((w) => `${w.mission}/${w.node}`));
    if (nodeSet.size > 1) {
      const writers = Array.from(nodeSet);
      if (singleWriterFlags.has(key)) {
        err('multiple-writers', `flag "${key}" is declared single-writer but is written by more than one node: ${writers.join(', ')}`,
          { kind: 'flag', key, writers });
      } else {
        const doc = documentedMultiWriters.get(key);
        if (doc) {
          // Suppressed like a dangling allowlist entry: this specific
          // multi-writer flag is a known, reasoned design (e.g. mutually
          // exclusive branches), not silently dropped -- the reason is
          // recorded in lint-allowlist.json.documented_multiple_writers.
        } else {
          warn('multiple-writers', `flag "${key}" is written by more than one node: ${writers.join(', ')}`,
            { kind: 'flag', key, writers });
        }
      }
    }
  }

  // ---------------------------------------------------------------------
  // CHECK 4 — REQUIRED EVIDENCE DECLARED OPTIONAL (error)
  // ---------------------------------------------------------------------
  checksRun++;
  function collectEvidenceReadsIn(condTree) {
    const found = [];
    (function walk(o) {
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (!isPlainObject(o)) return;
      if (typeof o.evidence === 'string') found.push(o.evidence);
      for (const k of Object.keys(o)) { if (k !== 'effects') walk(o[k]); }
    })(condTree);
    return found;
  }
  function checkRequiredEvidence(evList, sourceLabel, mid) {
    evList.forEach((evKey) => {
      const writers = writesIndex.evidence[evKey];
      if (!writers || !writers.length) return; // read-before-write already reports this
      const allOptional = writers.every((w) => w.optional === true);
      if (allOptional) {
        err('required-evidence-optional', `evidence "${evKey}" required by ${sourceLabel} (mission ${mid}) is written only by optional node(s): ${writers.map((w) => `${w.mission}/${w.node}`).join(', ')}`,
          { kind: 'evidence', key: evKey, mission: mid, source: sourceLabel });
      }
    });
  }
  for (const mid of missionIds) {
    const m = missions[mid];
    (m.nodes || []).forEach((node) => {
      if (node.mandatory_beat === true && node.conditions) {
        checkRequiredEvidence(collectEvidenceReadsIn(node.conditions), `mandatory node "${node.id}" conditions`, mid);
      }
    });
    (m.objectives || []).forEach((o) => {
      if (o.when) checkRequiredEvidence(collectEvidenceReadsIn(o.when), `objective "${o.id}"`, mid);
    });
    (m.milestones || []).forEach((ms) => {
      if (ms.pending_when) checkRequiredEvidence(collectEvidenceReadsIn(ms.pending_when), `milestone "${ms.id}" pending_when`, mid);
      if (ms.resolved_when) checkRequiredEvidence(collectEvidenceReadsIn(ms.resolved_when), `milestone "${ms.id}" resolved_when`, mid);
    });
    if (m.completion && m.completion.when) {
      checkRequiredEvidence(collectEvidenceReadsIn(m.completion.when), 'mission completion.when', mid);
    }
  }

  // ---------------------------------------------------------------------
  // CHECK 5 — SHADOW PAIRS (error)
  // ---------------------------------------------------------------------
  checksRun++;
  // flattenTopConditions / conditionsExclusive are defined above (CHECK 3).
  for (const mid of missionIds) {
    const m = missions[mid];
    const groups = {};
    (m.nodes || []).forEach((node) => {
      if (node.channel !== 'world' || !node.map_id) return;
      const targetKind = node.target_kind || 'actor';
      const targetId = node.target_id || node.actor_id || '';
      const key = `${node.map_id}|${targetKind}|${targetId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(node);
    });
    Object.keys(groups).forEach((key) => {
      const list = groups[key];
      if (list.length < 2) return;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i], b = list[j];
          const condsA = a.conditions || [];
          const condsB = b.conditions || [];
          if (conditionsExclusive(condsA, condsB)) continue;
          const bothEmpty = condsA.length === 0 && condsB.length === 0;
          const identical = deepEqual(condsA, condsB);
          const oneEmptyOtherNot = (condsA.length === 0 && condsB.length > 0 && b.exposed !== false)
            || (condsB.length === 0 && condsA.length > 0 && a.exposed !== false);
          if (bothEmpty || identical || oneEmptyOtherNot) {
            err('shadow-pairs', `nodes "${a.id}" and "${b.id}" in mission ${mid} shadow each other on (${key}): identical or overlapping conditions with no exclusivity`,
              { mission: mid, nodeA: a.id, nodeB: b.id, key });
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------------
  // CHECK 6 — RENDERED METADATA (error)
  // ---------------------------------------------------------------------
  checksRun++;
  const forbiddenLiterals = new Set();
  for (const mid of missionIds) (missions[mid].nodes || []).forEach((n) => forbiddenLiterals.add(n.id));
  Object.keys(evidenceData).forEach((id) => forbiddenLiterals.add(id));
  Object.keys(propositionsData).forEach((id) => forbiddenLiterals.add(id));
  {
    const reResult = /"result":\s*"([^"]+)"/g;
    for (const mid of missionIds) {
      const raw = fs.readFileSync(path.join(missionsDir, `${mid}.json`), 'utf8');
      let mch;
      while ((mch = reResult.exec(raw))) forbiddenLiterals.add(mch[1]);
    }
  }
  // literals must be reasonably specific to avoid matching ordinary words:
  // drop anything shorter than 3 chars or without a digit/underscore/uppercase run
  const literalList = Array.from(forbiddenLiterals).filter((s) => s && s.length >= 3);
  const literalRegexes = literalList.map((s) => ({
    key: s,
    re: new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
  }));

  function scanTextLeaks(obj, mid, nodeId) {
    if (Array.isArray(obj)) { obj.forEach((v) => scanTextLeaks(v, mid, nodeId)); return; }
    if (!isPlainObject(obj)) return;
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if ((k === 'text' || k === 'label' || k === 'prompt') && typeof v === 'string') {
        literalRegexes.forEach(({ key, re }) => {
          if (re.test(v)) {
            err('rendered-metadata', `${k} in ${mid}/${nodeId || '(mission)'} renders internal identifier "${key}": "${v}"`,
              { mission: mid, node: nodeId, literal: key, field: k });
          }
        });
      } else {
        scanTextLeaks(v, mid, nodeId);
      }
    }
  }
  for (const mid of missionIds) {
    const m = missions[mid];
    (m.objectives || []).forEach((o) => scanTextLeaks(o, mid, o.id));
    (m.nodes || []).forEach((node) => scanTextLeaks(node, mid, node.id));
  }

  // ---------------------------------------------------------------------
  // CHECK 7 — PAGES_BY_VALUE COVERAGE (error)
  // ---------------------------------------------------------------------
  checksRun++;
  for (const mid of missionIds) {
    const m = missions[mid];
    (m.nodes || []).forEach((node) => {
      if (!node.pages_by_value) return;
      const valueName = node.pages_by_value.value;
      const enumKey = valuesAllowed[valueName];
      if (!enumKey || !Array.isArray(enumDomains[enumKey])) return; // reported by checkValueName already
      const domain = enumDomains[enumKey];
      const cases = Object.keys(node.pages_by_value.cases || {});
      const missing = domain.filter((v) => cases.indexOf(v) === -1);
      if (missing.length && node.pages_by_value.partial !== true) {
        err('pages-by-value-coverage', `node "${node.id}" in ${mid}: pages_by_value on "${valueName}" is missing case(s) for: ${missing.join(', ')}`,
          { mission: mid, node: node.id, value: valueName, missing });
      }
    });
  }

  // Apply known_open downgrades: move matching errors to warnings, prefixed
  // so they are never mistaken for a clean pass.
  const remainingErrors = [];
  errors.forEach((e) => {
    const entry = e.key !== undefined ? knownOpen.get(`${e.check}:${e.key}`) : undefined;
    if (entry) {
      const { message, ...rest } = e; // eslint-disable-line no-unused-vars
      warn(e.check, `KNOWN-OPEN: ${message} [owner: ${entry.owner_milestone}; found ${entry.found || '?'}; ${entry.reason}]`, rest);
    } else {
      remainingErrors.push(e);
    }
  });

  return { errors: remainingErrors, warnings, checksRun: 7 };
}

module.exports = { lint };

// ---------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  const jsonOut = args.includes('--json');
  const allowArg = args.find((a) => a.startsWith('--allow='));
  const opts = {};
  if (allowArg) opts.allowlistPath = path.resolve(ROOT, allowArg.slice('--allow='.length));
  const result = lint(opts);
  if (jsonOut) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    result.warnings.forEach((w) => console.log(`WARN  [${w.check}] ${w.message}`));
    result.errors.forEach((e) => console.log(`ERROR [${e.check}] ${e.message}`));
    console.log(`\nnarrative-lint: ${result.errors.length ? 'FAIL' : 'PASS'} (${result.checksRun} checks, ${result.errors.length} errors, ${result.warnings.length} warnings)`);
  }
  process.exit(result.errors.length ? 1 : 0);
}
