// js/editor/apply/catalog-write.js — WORLD BUILDER M6 (node-only): keep js/world-catalog.js bijective with
// world/connections.json when a changeset creates or deletes a connection.
//
// The catalog is hand-authored JS (comments, wrapped arrays), so it is edited as TEXT, surgically: only the
// `connections: [...]` array of the affected location changes, and only by appending `, '<id>'` before its `]`
// (create) or cutting `'<id>'` with its separating comma (delete). A create followed by a delete of the same
// id gives back the original bytes. Every rewrite is re-evaluated in a vm and its membership compared with
// the planned membership for EVERY location; any difference fails loudly.
//
// Rules (no guessing, no first-match-wins):
//   - an endpoint scene resolves to its catalog location through environments[].sceneId; zero or several
//     locations for a scene is an error that lists the locations so the author picks;
//   - create adds the id to each endpoint location (once when both endpoints share a location); the id must
//     not already be listed anywhere in the catalog;
//   - delete removes the id from each endpoint location; the id must be listed exactly there.

'use strict';
const vm = require('node:vm');

function fail(msg) { throw new Error('[catalog-write] ' + msg); }

// readCatalog(text) -> the plain catalog object js/world-catalog.js registers.
function readCatalog(text) {
  let catalog = null;
  const context = vm.createContext({ GAME: { World: { register(c) { if (catalog) fail('catalog registers twice'); catalog = c; } } } });
  context.window = context;
  vm.runInContext(text, context, { filename: 'world-catalog.js' });
  if (!catalog || !Array.isArray(catalog.locations)) fail('js/world-catalog.js did not register a catalog with locations[]');
  return JSON.parse(JSON.stringify(catalog));
}

function describeLocations(catalog) {
  return catalog.locations.map((l) => l.id + ' (' + (l.environments || []).map((e) => e.sceneId).join(', ') + ')').join('; ');
}

// locationForScene(catalog, sceneId) -> location id; throws with the full location list otherwise.
function locationForScene(catalog, sceneId) {
  const hits = catalog.locations.filter((l) => (l.environments || []).some((e) => e.sceneId === sceneId));
  if (hits.length === 1) return hits[0].id;
  if (hits.length === 0) fail('scene "' + sceneId + '" has no catalog location; add it to a location in js/world-catalog.js first. Locations: ' + describeLocations(catalog));
  fail('scene "' + sceneId + '" belongs to ' + hits.length + ' catalog locations (' + hits.map((l) => l.id).join(', ') + '); the catalog is ambiguous');
}

function membership(catalog) {
  const out = {};
  catalog.locations.forEach((l) => { out[l.id] = (l.connections || []).slice(); });
  return out;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// The [start, end) span of the connections array body of one location (between its `[` and `]`).
function arraySpan(text, locationId) {
  const head = new RegExp("\\bid:\\s*'" + escapeRe(locationId) + "',\\s*environments:", 'g');
  const heads = [];
  let m;
  while ((m = head.exec(text))) heads.push(m.index);
  if (heads.length !== 1) fail('location "' + locationId + '" appears ' + heads.length + ' time(s) as a location block in js/world-catalog.js');
  const anyHead = /\bid:\s*'[^']*',\s*environments:/g;
  anyHead.lastIndex = heads[0] + 1;
  const nextHead = anyHead.exec(text);
  const blockEnd = nextHead ? nextHead.index : text.length;
  const block = text.slice(heads[0], blockEnd);
  const arr = /connections:\s*\[/g.exec(block);
  if (!arr) fail('location "' + locationId + '" has no connections: [...] array to edit');
  const start = heads[0] + arr.index + arr[0].length;
  const end = text.indexOf(']', start);
  if (end === -1 || end > blockEnd) fail('location "' + locationId + '" connections array is not closed inside its block');
  const body = text.slice(start, end);
  if (!/^(\s*'[a-z0-9-]+'\s*,?)*\s*$/.test(body)) fail('location "' + locationId + '" connections array holds something other than quoted ids; edit it by hand');
  return { start, end, body };
}

function addId(text, locationId, id) {
  const span = arraySpan(text, locationId);
  if (new RegExp("'" + escapeRe(id) + "'").test(span.body)) fail('"' + id + '" is already listed in location ' + locationId);
  const trimmed = span.body.replace(/\s+$/, '');
  const insertAt = span.start + trimmed.length;
  const piece = /'\s*$/.test(trimmed) ? ", '" + id + "'" : "'" + id + "'";
  return text.slice(0, insertAt) + piece + text.slice(insertAt);
}

function removeId(text, locationId, id) {
  const span = arraySpan(text, locationId);
  const tok = "'" + id + "'";
  const at = span.body.indexOf(tok);
  if (at === -1 || span.body.indexOf(tok, at + 1) !== -1) fail('"' + id + '" is not listed exactly once in location ' + locationId);
  const before = span.body.slice(0, at), after = span.body.slice(at + tok.length);
  let body;
  const lead = /,\s*$/.exec(before);
  if (lead) body = before.slice(0, lead.index) + after;
  else body = before + after.replace(/^\s*,\s*/, '');
  return text.slice(0, span.start) + body + text.slice(span.end);
}

// planCatalog(text, ops) -> { text, changed, before, after, touched } for ops [{op:'create'|'delete', record}].
// record is the created record (create) or the registry record being deleted (delete).
function planCatalog(text, ops) {
  const catalog = readCatalog(text);
  const want = membership(catalog);
  const allIds = () => Object.keys(want).reduce((acc, k) => acc.concat(want[k]), []);
  let next = text;
  const touched = [];
  ops.forEach(({ op, record }) => {
    const locs = [];
    ['a', 'b'].forEach((side) => {
      const loc = locationForScene(catalog, record[side].scene);
      if (locs.indexOf(loc) === -1) locs.push(loc);
    });
    if (op === 'create') {
      if (allIds().indexOf(record.id) !== -1) {
        fail('connection id "' + record.id + '" is already listed in js/world-catalog.js (' + Object.keys(want).filter((k) => want[k].includes(record.id)).join(', ') + ')');
      }
      locs.forEach((loc) => { next = addId(next, loc, record.id); want[loc].push(record.id); });
    } else if (op === 'delete') {
      const listed = Object.keys(want).filter((k) => want[k].includes(record.id));
      const extra = listed.filter((k) => locs.indexOf(k) === -1), missing = locs.filter((k) => listed.indexOf(k) === -1);
      if (extra.length || missing.length) {
        fail('connection id "' + record.id + '" is listed in [' + listed.join(', ') + '] but its endpoints belong to [' + locs.join(', ') + ']; fix js/world-catalog.js by hand');
      }
      locs.forEach((loc) => { next = removeId(next, loc, record.id); want[loc] = want[loc].filter((x) => x !== record.id); });
    } else {
      fail('unknown catalog op ' + op);
    }
    touched.push({ op, id: record.id, locations: locs });
  });
  const got = membership(readCatalog(next));
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    fail('rewritten js/world-catalog.js does not evaluate to the planned membership:\n  planned ' + JSON.stringify(want) + '\n  got     ' + JSON.stringify(got));
  }
  return { text: next, changed: next !== text, before: membership(catalog), after: got, touched };
}

// diffLines(a, b) -> printable "@@ line N" hunks of -/+ lines (LCS; the catalog is ~100 lines).
function diffLines(a, b) {
  const A = a.split('\n'), B = b.split('\n');
  const n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0, hunk = null;
  const flush = () => { if (hunk) { out.push('@@ line ' + hunk.line); hunk.lines.forEach((l) => out.push(l)); hunk = null; } };
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) { flush(); i++; j++; continue; }
    if (!hunk) hunk = { line: i + 1, lines: [] };
    if (i < n && (j === m || L[i + 1][j] >= L[i][j + 1])) hunk.lines.push('- ' + A[i++]);
    else hunk.lines.push('+ ' + B[j++]);
  }
  flush();
  return out;
}

module.exports = { readCatalog, locationForScene, membership, addId, removeId, planCatalog, diffLines };
