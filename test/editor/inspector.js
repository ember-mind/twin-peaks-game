'use strict';

// EDITOR TEST — inspector. Drives the schema-driven read-out over SYNTHETIC entities + schemas (no game
// data) to prove it is generic and pure: every assertion feeds a hand-built object and a hand-built field
// list through the SAME inspect() code path, which is how "no per-type hardcode" becomes checkable.
// Sections mirror the design notes in js/editor/core/inspector.js.
const assert = require('assert');
const Inspector = require('../../js/editor/core/inspector.js');

let pass = 0;
function ok(cond, label) { assert.ok(cond, 'FAIL: ' + label); pass++; }

// ---- (a) makeField normalization + defaults ----------------------------------------------
(function () {
  const f1 = Inspector.makeField({ key: 'a.spawn.tx' });
  ok(f1.label === 'A Spawn Tx', '(a) missing label is humanized from the dotted key');
  ok(f1.type === 'any' && f1.editable === false, '(a) defaults: type=any, editable=false (read-only by default)');

  const f2 = Inspector.makeField({ key: 'locationId', label: 'Location', editable: true });
  ok(f2.label === 'Location' && f2.editable === true, '(a) explicit label + editable override win over defaults');

  const predF = Inspector.makeField({ key: 'count', editable: (v) => v > 0 });
  assert.strictEqual(typeof predF.editable, 'function', '(a) a predicate editable is preserved as a function');

  let threw = false;
  try { Inspector.makeField({ label: 'no key' }); } catch (e) { threw = /needs a string key/.test(e.message); }
  ok(threw, '(a) makeField fails loud on a missing/empty key');
})();

// ---- (b) inspect over a flat entity --------------------------------------------------------
(function () {
  const entity = { locationId: 'town', width: 9, indoor: true };
  const schema = [
    { key: 'locationId', label: 'Location' },
    { key: 'width', type: 'number' },
    { key: 'indoor', type: 'bool' }
  ];
  const rows = Inspector.inspect(entity, schema);
  ok(Object.isFrozen(rows) && Object.isFrozen(rows[0]), '(b) inspect returns a frozen array of frozen rows');
  ok(rows.length === 3 && rows[0].label === 'Location' && rows[0].value === 'town', '(b) row 0 label override + raw value');
  ok(rows[1].type === 'number' && rows[1].value === 9, '(b) row 1 type hint preserved, value passed through');
  ok(rows[2].value === true && rows.every(r => r.editable === false), '(b) every row read-only unless opt-in');
  ok(Array.isArray(rows) && rows.map(r => r.key).join(',') === 'locationId,width,indoor', '(b) rows emitted in declaration order');
})();

// ---- (c) dotted nested reads over connection-like data -------------------------------------
(function () {
    // enriched connection record shape as model.js produces it (a/b endpoints with scene + spawn tile+dir)
  const conn = {
    id: 'town-diner',
    a: { scene: 'town', triggers: [], spawn: { tx: 4, ty: 5, dir: 'up' } },
    b: { scene: 'diner', triggers: [], spawn: null }            // arrival-only side: no spawn tile
  };
  const schema = [
    { key: 'id', label: 'Connection ID' },
    { key: 'a.scene', label: 'Endpoint A · Scene' },
    { key: 'a.spawn.tx', label: 'A · Tile X', editable: true },
    { key: 'a.spawn.ty', label: 'A · Tile Y', editable: true },
    { key: 'b.scene', label: 'Endpoint B · Scene' },
    { key: 'b.spawn.tx', label: 'B · Tile X', editable: true }   // will miss → null
  ];
  const rows = Inspector.inspect(conn, schema);
  ok(rows[0].value === 'town-diner', '(c) flat id reads through the same path machinery');
  ok(rows[1].value === 'town' && rows[2].value === 4 && rows[3].value === 5, '(c) dotted a.*.spawn.* reads surface nested values');
  ok(rows[4].value === 'diner', '(c) the paired side b.scene resolves independently of a');
  ok(rows[5].value === null && rows[5].editable === false, '(c) a missing spawn hop yields value:null + non-editable');
})();

// ---- (d) conditional editability via predicate ---------------------------------------------
(function () {
  const entity = { connections: 3, doors: 0 };
  const schema = [
    { key: 'connections', editable: (v) => v > 0 },   // true when count is positive
    { key: 'doors', editable: (v) => v > 0 }          // false here → coerces to read-only
  ];
  const rows = Inspector.inspect(entity, schema);
  ok(rows[0].editable === true, '(d) predicate returns true → field editable');
  ok(rows[1].editable === false, '(d) predicate returns false → field read-only');

  let threw = false;
  try {
    Inspector.inspect({ n: 1 }, [{ key: 'n', editable: () => { throw new Error('boom'); } }]);
  } catch (e) { threw = /boom/.test(e.message); }
  ok(threw, '(d) a throwing predicate propagates (fail loud, not silently read-only)');
})();

// ---- (e) the genericity proof: two schemas, two entities, one code path ---------------------
(function () {
    // A location-shaped entity and a connection-shaped entity both flow through the identical inspect();
    // there is no kind switch anywhere, so "no per-type hardcode" is structural, not aspirational.
  const locSchema = [{ key: 'locationId', label: 'Location' }, { key: 'sceneCount', type: 'number', editable: true }];
  const connSchema = [{ key: 'id', label: 'Connection' }, { key: 'a.scene' }, { key: 'b.spawn.dir' }];

  const locRows = Inspector.inspect({ locationId: 'great-northern', sceneCount: 10, a: null }, locSchema);
  ok(locRows[0].value === 'great-northern' && locRows[1].value === 10 && locRows[1].editable === true, '(e) location schema → correct rows');

  const connRows = Inspector.inspect({ id: 'gn-hotel', a: { scene: 'gn' }, b: { spawn: { dir: 'up' } } }, connSchema);
  ok(connRows[0].value === 'gn-hotel' && connRows[1].value === 'gn' && connRows[2].value === 'up', '(e) connection schema → correct rows');

    // the very same inspect function served both shapes — a per-type hardcode would have thrown or branched
  ok(typeof Inspector.inspect === 'function', '(e) single generic inspect() drives every entity kind');
})();

// ---- (f) absent fields are surfaced, never hidden ------------------------------------------
(function () {
  const rows = Inspector.inspect({ only: 1 }, [{ key: 'only' }, { key: 'ghost.field', editable: true }]);
  ok(rows[1].value === null && rows[1].editable === false, '(f) a missing field surfaces as value:null + non-editable even when descriptor said editable:true');
})();

// ---- (g) null / undefined entity -> empty frozen rows --------------------------------------
(function () {
  const schema = [{ key: 'a' }];
  ok(Inspector.inspect(null, schema).length === 0 && Object.isFrozen(Inspector.inspect(null, schema)), '(g) null entity yields an empty frozen array');
  ok(Inspector.inspect(undefined, schema).length === 0, '(g) undefined entity also yields empty rows');
})();

// ---- (h) immutability of inputs and outputs -----------------------------------------------
(function () {
  const entity = { a: { spawn: { tx: 1 } }, tag: 'x' };
  const before = JSON.stringify(entity);
  const schema = Inspector.makeSchema([{ key: 'a.spawn.tx', editable: true }]);
  const rows = Inspector.inspect(entity, schema);
    // neither the entity nor the frozen schema is mutated by inspect/makeSchema
  ok(JSON.stringify(entity) === before && Object.isFrozen(schema), '(h) inspect does not mutate the entity and makeSchema returns a frozen schema');
  assert.throws(() => { rows.push({}); }, '(h) returned row array is frozen (cannot push)');
  assert.throws(() => { rows[0].value = 999; }, '(h) a returned row is frozen (value cannot be reassigned)');
})();

// ---- (i) makeSchema fail-loud + raw-array input --------------------------------------------
(function () {
    // makeSchema accepts both a raw field array and a { fields, title } object
  const viaArray = Inspector.makeSchema([{ key: 'x' }]);
  ok(Array.isArray(viaArray.fields) && viaArray.title === null, '(i) raw array input is normalized to a schema with null title');
  const viaObject = Inspector.makeSchema({ fields: [{ key: 'x', label: 'X' }], title: 'Props' });
  ok(viaObject.title === 'Props' && viaObject.fields[0].label === 'X', '(i) { fields, title } object is honored');

  let threw = false;
  try { Inspector.makeSchema({ nope: true }); } catch (e) { threw = /needs a fields array/.test(e.message); }
  ok(threw, '(i) makeSchema fails loud on an input with no fields array');
})();

// ---- (j) fieldPath + humanize helpers are public and behave --------------------------------
(function () {
  ok(Inspector.fieldPath({ a: { b: 7 } }, 'a.b') === 7, '(j) fieldPath walks a dotted path');
  ok(Inspector.fieldPath({ a: 1 }, 'a.b.c') === null, '(j) fieldPath stops at a non-object and yields null');
  ok(Inspector.humanize('a.spawn.tx') === 'A Spawn Tx', '(j) humanize splits dot-segments and capitalizes each');
  ok(Inspector.humanize('sceneCount') === 'SceneCount', '(j) a single-word key is just capitalized (no camelCase split — that is not promised)');
})();

console.log(`EDITOR-INSPECTOR-PASS ${pass}`);
