'use strict';

// STABLE IDENTITY SCHEME for the editor core. A selectable item (a connection
// endpoint, a trigger cell, an npc placement, or a legacy classic-door tile) must
// carry a deterministic id so selection, undo/redo and changesets can refer to it
// without depending on array position or object identity — which shift when the
// model is rebuilt from a fresh snapshot. The scheme is pure: it knows nothing of
// the game, catalog, or registry; callers feed it plain fields.
//
// INvariant that makes parsing unambiguous: every component fed to a generator must
// be COLON-FREE (connection ids use dashes, scenes/npc-ids too), so each id splits
// cleanly on its FIRST ':' into <kind> : <rest>. The four kind prefixes are also
// prefix-disjoint at the first colon, so parse() can tell the kind apart by looking
// at the segment before that first colon alone.
//
// Grammar (one line per kind):
//   connection-endpoint:<connId>:<a|b>      endpoint of a connection record
//   trigger:<connId>:<n>                    the n-th trigger pair of a connection
//   npc:<npcId>:<scene>                     an npc placement on a scene
//   legacy-door:<scene>:<x>,<y>             a classic js/maps.js door tile not yet
//                                           owned by any connection record

const KINDS = {
  ENDPOINT: 'connection-endpoint',
  TRIGGER: 'trigger',
  NPC: 'npc',
  LEGACY_DOOR: 'legacy-door'
};

function isNonNegativeInt(v) {
  return Number.isInteger(v) && v >= 0;
}

// A component must be a non-empty colon-free string. This is what keeps split-on-
// first-colon unambiguous, so every generator asserts it up front (fail loud rather
// than emitting an id parse() could not re-derive).
function requireComponent(value, name) {
  if (typeof value !== 'string' || value.length === 0 || value.indexOf(':') !== -1) {
    throw new Error(`identity: ${name} must be a non-empty colon-free string, got ${JSON.stringify(value)}`);
  }
  return value;
}

function endpointId(connId, side) {
  const id = requireComponent(connId, 'connId');
  if (side !== 'a' && side !== 'b') throw new Error(`identity: endpoint side must be 'a' or 'b', got ${JSON.stringify(side)}`);
  return `${KINDS.ENDPOINT}:${id}:${side}`;
}

function triggerId(connId, n) {
  const id = requireComponent(connId, 'connId');
  if (!isNonNegativeInt(n)) throw new Error(`identity: trigger index must be a non-negative integer, got ${JSON.stringify(n)}`);
  return `${KINDS.TRIGGER}:${id}:${n}`;
}

function npcId(npcIdValue, scene) {
  const id = requireComponent(npcIdValue, 'npcId');
  const sc = requireComponent(scene, 'scene');
  return `${KINDS.NPC}:${id}:${sc}`;
}

function legacyDoorId(scene, x, y) {
  const sc = requireComponent(scene, 'scene');
  if (!isNonNegativeInt(x) || !isNonNegativeInt(y)) {
    throw new Error(`identity: legacy-door tile must be non-negative integer coords, got (${JSON.stringify(x)}, ${JSON.stringify(y)})`);
  }
  return `${KINDS.LEGACY_DOOR}:${sc}:${x},${y}`;
}

// Parse an id into {kind, ...fields}. Returns null (never throws) when the string is
// not a well-formed editor id of any known kind. Callers wanting fail-loud use
// validate() instead.
function parse(id) {
  if (typeof id !== 'string' || id.length === 0) return null;
  const sep = id.indexOf(':');
  if (sep <= 0) return null;
  const kind = id.slice(0, sep);
  const rest = id.slice(sep + 1);

  if (kind === KINDS.ENDPOINT) {
    // rest is "<connId>:<a|b>" — split on the LAST colon; side must be a or b.
    const last = rest.lastIndexOf(':');
    if (last <= 0 || last === rest.length - 1) return null;
    const connId = rest.slice(0, last);
    const side = rest.slice(last + 1);
    if (side !== 'a' && side !== 'b') return null;
    if (connId.indexOf(':') !== -1) return null; // colon leaked into the component
    return { kind: KINDS.ENDPOINT, connId, side };
  }

  if (kind === KINDS.TRIGGER) {
    // rest is "<connId>:<n>" — last segment must be a non-negative integer.
    const last = rest.lastIndexOf(':');
    if (last <= 0 || last === rest.length - 1) return null;
    const connId = rest.slice(0, last);
    const nStr = rest.slice(last + 1);
    if (connId.indexOf(':') !== -1 || !/^\d+$/.test(nStr)) return null;
    return { kind: KINDS.TRIGGER, connId, n: Number(nStr) };
  }

  if (kind === KINDS.NPC) {
    // rest is "<npcId>:<scene>" — split on the LAST colon so scene names with no
    // embedded colon parse even when npcId carries dashes.
    const last = rest.lastIndexOf(':');
    if (last <= 0 || last === rest.length - 1) return null;
    const npcIdValue = rest.slice(0, last);
    const scene = rest.slice(last + 1);
    if (npcIdValue.indexOf(':') !== -1 || scene.indexOf(':') !== -1) return null;
    return { kind: KINDS.NPC, npcId: npcIdValue, scene };
  }

  if (kind === KINDS.LEGACY_DOOR) {
    // rest is "<scene>:<x>,<y>" — split on the LAST colon to isolate "x,y", then
    // on the comma. Scene and coords must each be colon/field-clean.
    const last = rest.lastIndexOf(':');
    if (last <= 0 || last === rest.length - 1) return null;
    const scene = rest.slice(0, last);
    const xy = rest.slice(last + 1);
    const comma = xy.indexOf(',');
    if (scene.indexOf(':') !== -1 || comma <= 0 || comma === xy.length - 1) return null;
    const xStr = xy.slice(0, comma);
    const yStr = xy.slice(comma + 1);
    if (!/^\d+$/.test(xStr) || !/^\d+$/.test(yStr)) return null;
    return { kind: KINDS.LEGACY_DOOR, scene, x: Number(xStr), y: Number(yStr) };
  }

  return null;
}

// Fail-loud twin of parse(): throws when the string is not a well-formed id.
function validate(id) {
  const parsed = parse(id);
  if (parsed === null) throw new Error(`identity: not a well-formed editor id: ${JSON.stringify(id)}`);
  return parsed;
}

// kindOf without parsing fields — cheap dispatch used by selection/inspector routing.
function kindOf(id) {
  const p = parse(id);
  return p === null ? null : p.kind;
}

// Stable-identity safety net: a model in which two distinct selectable items share an
// id is a bug that silently mis-routes selection and undo/redo. dedupe() returns the
// collision-free list preserving first occurrence AND throws naming every duplicate so
// the defect surfaces at construction rather than later as a phantom selection.
function dedupe(ids) {
  const seen = new Set();
  const collisions = [];
  const out = [];
  for (const id of ids) {
    if (seen.has(id)) {
      if (!collisions.includes(id)) collisions.push(id);
      continue;
    }
    seen.add(id);
    out.push(id);
  }
  if (collisions.length > 0) throw new Error(`identity: duplicate ids: ${collisions.join(', ')}`);
  return out;
}

function factory() {
  return Object.freeze({
    KINDS,
    endpointId, triggerId, npcId, legacyDoorId,
    parse, validate, kindOf, dedupe
  });
}

const identity = factory();

// Neutral 'Editor' namespace (deliberately NOT a game global) so the core stays
// browser+node loadable while the grep guard for game references still passes over
// js/editor/core/.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = identity;
} else if (typeof globalThis !== 'undefined') {
  globalThis.Editor = globalThis.Editor || Object.create(null);
  globalThis.Editor.identity = identity;
}
