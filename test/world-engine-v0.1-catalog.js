#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const engineSource = fs.readFileSync(path.join(root, 'js/world-engine.js'), 'utf8');
const catalogSource = fs.readFileSync(path.join(root, 'js/world-catalog.js'), 'utf8');

let canonicalFixture;
{
  const context = vm.createContext({ GAME: { World: { register(catalog) { canonicalFixture = catalog; } } } });
  context.window = context;
  vm.runInContext(catalogSource, context, { filename: 'world-catalog.js' });
}

function isolated(maps) {
  const context = vm.createContext({ console, GAME: maps === undefined ? {} : { Maps: maps } });
  context.window = context;
  vm.runInContext(engineSource, context, { filename: 'world-engine.js' });
  return context;
}
function validCatalog() {
  return JSON.parse(JSON.stringify(canonicalFixture));
}

// Optional environment.program contract used by the authored Sheriff environment. Keep the fixture
// intentionally JSON-only: this is the same shape that must survive World.register() and the Builder
// snapshot boundary (functions would be dropped by the canonical JSON/export pipeline).
function programFixture() {
  return {
    intent: {
      function: 'orient the investigation through the station',
      playerExperience: 'read the station as a working place before it becomes a case surface',
      tone: 'procedural pressure'
    },
    visualGoals: [
      { id: 'front-desk', aim: 'make the public threshold immediately legible' },
      { id: 'evidence-wall', aim: 'give the room a visible investigative anchor' }
    ],
    activities: [
      { id: 'intake', description: 'deputies receive people and information' },
      { id: 'review', description: 'the team compares clues at the wall' }
    ],
    groups: [
      {
        id: 'station-team',
        role: 'working deputies',
        anchors: ['front-desk', 'evidence-wall'],
        activities: ['intake', 'review'],
        visual: 'clustered around the public and investigative anchors'
      }
    ]
  };
}
function m2ProgramFixture() {
  const program = programFixture();
  program.contributions = [
    {
      anchor: 'front-desk',
      contributesTo: ['function', 'gameplay', 'narrative', 'character', 'atmosphere', 'composition', 'spatial_readability', 'world_building', 'ambient_life'],
      reason: 'The threshold makes the station legible as an active workplace.'
    },
    {
      anchor: 'evidence-wall',
      contributesTo: ['narrative', 'world_building'],
      reason: 'The investigative anchor supports clue review and local history.'
    }
  ];
  program.relationships = [
    { kind: 'NEAR', from: 'front-desk', to: 'evidence-wall', reason: 'Public intake stays close to the working investigation.' },
    { kind: 'REACHABLE', from: 'entrance', to: 'front-desk', reason: 'Arrival retains a readable path into the station.' }
  ];
  return program;
}
function m3ProgramFixture() {
  const program = m2ProgramFixture();
  program.residue = {
    ambient: [
      { anchor: 'front-desk', detail: 'a mug with a cooling ring', reason: 'Small signs of ordinary work keep the threshold lived-in.' },
      { anchor: 'evidence-wall', detail: 'a clipped stack of copies', reason: 'The working surface reads as maintained without asserting a story event.' }
    ]
  };
  return program;
}
function firstEnvironment(catalog) {
  const location = catalog.locations.find((l) => l.id === 'sheriffs-station') || catalog.locations[0];
  const environment = location && location.environments[0];
  assert(location && environment, 'fixture must contain at least one environment');
  return { location, environment };
}
function attachProgram(catalog) {
  const target = firstEnvironment(catalog);
  if (!target.environment.program) target.environment.program = programFixture();
  return target;
}
function sheriffLayoutFixture() {
  return {
    footprints: {
      sheriffDesk: {}, sheriffChair: {}, files: {}, reception: {}, receptionReturn: {}, bench: {},
      rightDeskNorth: {}, rightChairNorth: {}, rightDeskSouth: {}, rightChairSouth: {}
    },
    targets: { entrance: {}, sheriffDesk: {} }
  };
}
function mapsForCatalog(catalog, sheriffLayout) {
  const maps = {};
  catalog.locations.forEach((location) => location.environments.forEach((environment) => {
    maps[environment.sceneId] = environment.sceneId === 'sheriff' ? { layout: sheriffLayout } : {};
  }));
  return maps;
}
function expectRejectedSheriffAnchor(mutator, label) {
  const fixture = validCatalog();
  const target = fixture.locations.find((location) => location.id === 'sheriffs-station')
    .environments.find((environment) => environment.sceneId === 'sheriff');
  assert(target && target.program, 'canonical fixture must carry the Sheriff program');
  mutator(target.program);
  const context = isolated(mapsForCatalog(fixture, sheriffLayoutFixture()));
  assert.throws(() => context.GAME.World.register(fixture), /references unknown anchor/, label);
  assert.equal(context.GAME.World.catalog, undefined, label + ': rejected registration leaves no catalog');
}
function assertFrozenProgram(program, label) {
  assert(Object.isFrozen(program), label + ' program frozen');
  assert(Object.isFrozen(program.intent), label + ' intent frozen');
  assert(Object.isFrozen(program.visualGoals), label + ' visualGoals frozen');
  assert(Object.isFrozen(program.activities), label + ' activities frozen');
  assert(Object.isFrozen(program.groups), label + ' groups frozen');
  program.visualGoals.forEach((goal) => assert(Object.isFrozen(goal), label + ' visual goal frozen'));
  program.activities.forEach((activity) => assert(Object.isFrozen(activity), label + ' activity frozen'));
  program.groups.forEach((group) => {
    assert(Object.isFrozen(group), label + ' group frozen');
    assert(Object.isFrozen(group.anchors), label + ' group anchors frozen');
    assert(Object.isFrozen(group.activities), label + ' group activities frozen');
  });
  if (Object.prototype.hasOwnProperty.call(program, 'contributions')) {
    assert(Object.isFrozen(program.contributions), label + ' contributions frozen');
    program.contributions.forEach((contribution) => {
      assert(Object.isFrozen(contribution), label + ' contribution frozen');
      assert(Object.isFrozen(contribution.contributesTo), label + ' contribution categories frozen');
    });
  }
  if (Object.prototype.hasOwnProperty.call(program, 'relationships')) {
    assert(Object.isFrozen(program.relationships), label + ' relationships frozen');
    program.relationships.forEach((relationship) => assert(Object.isFrozen(relationship), label + ' relationship frozen'));
  }
  if (Object.prototype.hasOwnProperty.call(program, 'residue')) {
    assert(Object.isFrozen(program.residue), label + ' residue frozen');
    assert(Object.isFrozen(program.residue.ambient), label + ' ambient residue frozen');
    program.residue.ambient.forEach((item) => assert(Object.isFrozen(item), label + ' ambient residue item frozen'));
  }
}
function expectRejectedProgram(mutator, label, m2) {
  const context = isolated();
  const fixture = validCatalog();
  const target = attachProgram(fixture);
  if (m2) target.environment.program = m2ProgramFixture();
  mutator(target.environment.program);
  assert.throws(() => context.GAME.World.register(fixture), label);
  assert.equal(context.GAME.World.catalog, undefined, label + ': rejected registration leaves no catalog');
}
function expectRejectedM3Program(mutator, label) {
  const context = isolated();
  const fixture = validCatalog();
  const target = firstEnvironment(fixture);
  target.environment.program = m3ProgramFixture();
  mutator(target.environment.program);
  assert.throws(() => context.GAME.World.register(fixture), label);
  assert.equal(context.GAME.World.catalog, undefined, label + ': rejected registration leaves no catalog');
}
function expectRejected(mutator, maps) {
  const context = isolated(maps);
  const fixture = validCatalog();
  mutator(fixture);
  assert.throws(() => context.GAME.World.register(fixture));
  assert.equal(context.GAME.World.catalog, undefined, 'failed registration leaves no catalog');
  assert.equal(context.GAME.World.getLocation('double-r'), undefined, 'failed registration leaves no lookup state');
  assert.equal(context.GAME.World.getConnections(), undefined, 'failed registration leaves no connection state');
  if (maps === undefined) assert.doesNotThrow(() => context.GAME.World.register(validCatalog()), 'rejected registration leaves engine usable');
}

{
  const World = isolated().GAME.World;
  assert(Object.isFrozen(World), 'GAME.World API is frozen');
  assert.equal(World.catalog, undefined, 'catalog starts unregistered');
  assert.equal(World.getLocation('missing'), undefined);
  assert.equal(World.getEnvironment('missing', 'outside'), undefined);
  assert.equal(World.getLocationForScene('missing'), undefined);
  assert.equal(World.getConnections(), undefined);
  assert.equal(World.getConnections('missing'), undefined);
  const input = validCatalog();
  const authoredProgramTarget = attachProgram(input);
  const authoredProgram = authoredProgramTarget.environment.program;
  const authoredFunction = authoredProgram.intent.function;
  const authoredGoal = authoredProgram.visualGoals[0].aim;
  const registered = World.register(input);
  assert.strictEqual(registered, World.catalog, 'register returns stored catalog');
  assert.notStrictEqual(registered, input, 'catalog is copied');
  for (const value of [registered, registered.locations, registered.locations[0], registered.locations[0].environments, registered.locations[0].environments[0], registered.locations[0].connections]) assert(Object.isFrozen(value));
  const registeredProgram = World.getEnvironment(authoredProgramTarget.location.id, authoredProgramTarget.environment.id).program;
  assert.deepEqual(JSON.parse(JSON.stringify(registeredProgram)), authoredProgram, 'optional environment.program survives registration');
  assert.notStrictEqual(registeredProgram, authoredProgram, 'environment.program is cloned');
  assertFrozenProgram(registeredProgram, 'registered environment.program');
  input.id = 'mutated'; input.locations[0].id = 'mutated'; input.locations[0].environments[0].sceneId = 'mutated'; input.locations[0].connections.push('mutated');
  authoredProgram.intent.function = 'mutated after register';
  authoredProgram.visualGoals[0].aim = 'mutated after register';
  assert.equal(registered.id, 'twin-peaks', 'source mutations cannot alter registered catalog');
  assert.equal(registeredProgram.intent.function, authoredFunction, 'program intent is isolated from source mutation');
  assert.equal(registeredProgram.visualGoals[0].aim, authoredGoal, 'program nested records are isolated from source mutation');
  assert.equal(World.getLocation('double-r').id, 'double-r');
  assert.equal(World.getEnvironment('double-r', 'exterior').sceneId, 'double_r_exterior_prototype');
  assert.equal(World.getEnvironment('double-r', 'interior').sceneId, 'diner', 'environment IDs are location-scoped');
  assert.equal(World.getEnvironment('double-r', 'missing'), undefined);
  assert.equal(World.getLocationForScene('diner').id, 'double-r');
  // M6: membership is derived from js/world-catalog.js itself (tools/world-apply.js rewrites it on create/delete),
  // so this runs green on a repo copy after an apply. The exact id set on the real repo is pinned by
  // test/test-world-registry.js; the bijection with world/connections.json is checked below.
  const authorOrder = [];
  canonicalFixture.locations.forEach(location => location.connections.forEach(id => { if (!authorOrder.includes(id)) authorOrder.push(id); }));
  assert.deepEqual(Array.from(World.getConnections()), Array.from(authorOrder), 'world connections deduplicate in author order');
  for (const location of canonicalFixture.locations) {
    assert.deepEqual(Array.from(World.getConnections(location.id)), Array.from(location.connections), location.id + ' connections keep author order');
  }
  for (const id of ['double-r-front-entrance', 'town-double-r-lot', 'town-traincar-east', 'traincar-oej-entrance', 'arrival-town']) {
    assert(World.getConnections().includes(id), id + ' is cataloged');
  }
  assert.throws(() => World.register(validCatalog()), 'only one catalog may be registered');
}

// `program` is optional: legacy environments without one remain valid and expose no synthetic default.
{
  const World = isolated().GAME.World;
  const fixture = validCatalog();
  const target = firstEnvironment(fixture);
  delete target.environment.program;
  World.register(fixture);
  assert.equal(World.getEnvironment(target.location.id, target.environment.id).program, undefined,
    'environment without program remains valid and has no default program');
}

// Program shape validation: malformed records, duplicate ids, and dangling activity references fail before
// any catalog/index state is installed. The exact diagnostic is implementation-owned; this gate is about
// rejecting the invalid authored shape and preserving the one-shot registration boundary.
expectRejectedProgram((p) => { p.intent = null; }, 'program intent must be an object');
expectRejectedProgram((p) => { p.intent.function = ''; }, 'program intent.function must be non-empty');
expectRejectedProgram((p) => { p.visualGoals = {}; }, 'program visualGoals must be an array');
expectRejectedProgram((p) => { p.visualGoals[0].id = ''; }, 'program visual goal id must be non-empty');
expectRejectedProgram((p) => { p.activities[0].description = null; }, 'program activity description must be a string');
expectRejectedProgram((p) => { p.groups[0].anchors = 'front-desk'; }, 'program group anchors must be an array');
expectRejectedProgram((p) => { p.visualGoals.push({ id: 'front-desk', aim: 'duplicate id' }); }, 'program visual goal ids must be unique');
expectRejectedProgram((p) => { p.activities.push({ id: 'intake', description: 'duplicate id' }); }, 'program activity ids must be unique');
expectRejectedProgram((p) => { p.groups.push({ id: 'station-team', role: 'duplicate id', anchors: [], activities: [], visual: 'duplicate id' }); }, 'program group ids must be unique');
expectRejectedProgram((p) => { p.groups[0].activities = ['missing-activity']; }, 'program group activity references must resolve');
expectRejectedProgram((p) => { p.unexpected = 'must not be silently dropped'; }, 'program unknown fields must be rejected');

// M2 optional metadata keeps the same immutable boundary and accepts only the published semantic vocabulary.
{
  const World = isolated().GAME.World;
  const fixture = validCatalog();
  const target = firstEnvironment(fixture);
  target.environment.program = m2ProgramFixture();
  const authoredProgram = target.environment.program;
  const registered = World.register(fixture);
  const registeredProgram = World.getEnvironment(target.location.id, target.environment.id).program;
  assert.deepEqual(JSON.parse(JSON.stringify(registeredProgram)), authoredProgram, 'M2 program metadata survives registration');
  assert.notStrictEqual(registeredProgram, authoredProgram, 'M2 program is cloned');
  assert.notStrictEqual(registeredProgram.contributions, authoredProgram.contributions, 'contributions are cloned');
  assert.notStrictEqual(registeredProgram.contributions[0].contributesTo, authoredProgram.contributions[0].contributesTo, 'contribution categories are cloned');
  assert.notStrictEqual(registeredProgram.relationships, authoredProgram.relationships, 'relationships are cloned');
  assertFrozenProgram(registeredProgram, 'registered M2 program');
  authoredProgram.contributions[0].reason = 'mutated after register';
  authoredProgram.contributions[0].contributesTo[0] = 'mutated after register';
  authoredProgram.relationships[0].reason = 'mutated after register';
  assert.equal(registeredProgram.contributions[0].reason, 'The threshold makes the station legible as an active workplace.', 'contribution reason is isolated from source mutation');
  assert.equal(registeredProgram.contributions[0].contributesTo[0], 'function', 'contribution categories are isolated from source mutation');
  assert.equal(registeredProgram.relationships[0].reason, 'Public intake stays close to the working investigation.', 'relationship reason is isolated from source mutation');
  assert.strictEqual(registered, World.catalog, 'M2 registration returns the stored catalog');
}

// M2 optional fields and validation failures remain isolated from the one-shot registration state.
{
  const World = isolated().GAME.World;
  const fixture = validCatalog();
  const target = firstEnvironment(fixture);
  if (target.environment.program) {
    delete target.environment.program.contributions;
    delete target.environment.program.relationships;
  }
  World.register(fixture);
  const program = World.getEnvironment(target.location.id, target.environment.id).program;
  assert.equal(program && program.contributions, undefined, 'program contributions remain optional');
  assert.equal(program && program.relationships, undefined, 'program relationships remain optional');
}
expectRejectedProgram((p) => { p.contributions = {}; }, 'program contributions must be an array', true);
expectRejectedProgram((p) => { p.contributions[0].contributesTo = []; }, 'contribution categories must be non-empty', true);
expectRejectedProgram((p) => { p.contributions[0].contributesTo[0] = 'unknown-category'; }, 'unknown contribution category must be rejected', true);
expectRejectedProgram((p) => { p.contributions[0].anchor = ''; }, 'contribution anchor must be non-empty', true);
expectRejectedProgram((p) => { p.relationships = {}; }, 'program relationships must be an array', true);
expectRejectedProgram((p) => { p.relationships[0].kind = 'TOUCHES'; }, 'relationship kind must be recognized', true);
expectRejectedProgram((p) => { p.relationships[0].from = ''; }, 'relationship from must be non-empty', true);
expectRejectedProgram((p) => { p.relationships[0].to = p.relationships[0].from; }, 'relationship must not reference itself', true);
expectRejectedProgram((p) => { p.relationships[0].unexpected = 'must not be silently dropped'; }, 'relationship unknown fields must be rejected', true);

// M3 ambient residue is optional authored texture: it remains JSON-only, immutable, and separate from narrative state.
{
  const World = isolated().GAME.World;
  const fixture = validCatalog();
  const target = firstEnvironment(fixture);
  target.environment.program = m3ProgramFixture();
  const authoredProgram = target.environment.program;
  const registered = World.register(fixture);
  const registeredProgram = World.getEnvironment(target.location.id, target.environment.id).program;
  assert.deepEqual(JSON.parse(JSON.stringify(registeredProgram)), authoredProgram, 'M3 residue survives registration');
  assert.notStrictEqual(registeredProgram.residue, authoredProgram.residue, 'residue is cloned');
  assert.notStrictEqual(registeredProgram.residue.ambient, authoredProgram.residue.ambient, 'ambient residue list is cloned');
  assert.notStrictEqual(registeredProgram.residue.ambient[0], authoredProgram.residue.ambient[0], 'ambient residue item is cloned');
  assertFrozenProgram(registeredProgram, 'registered M3 program');
  authoredProgram.residue.ambient[0].detail = 'mutated after register';
  assert.equal(registeredProgram.residue.ambient[0].detail, 'a mug with a cooling ring', 'ambient residue is isolated from source mutation');
  assert.strictEqual(registered, World.catalog, 'M3 registration returns the stored catalog');
}

// Residue is optional, while narrative residue and unknown residue fields are deliberately rejected.
{
  const World = isolated().GAME.World;
  const fixture = validCatalog();
  const target = attachProgram(fixture);
  if (target.environment.program) delete target.environment.program.residue;
  World.register(fixture);
  const program = World.getEnvironment(target.location.id, target.environment.id).program;
  assert(program, 'program remains present when only residue is omitted');
  assert.equal(program.residue, undefined,
    'program residue remains optional');
}
expectRejectedM3Program((p) => { p.residue = null; }, 'program residue must be an object');
expectRejectedM3Program((p) => { p.residue.ambient = {}; }, 'residue ambient must be an array');
expectRejectedM3Program((p) => { p.residue.ambient[0] = null; }, 'ambient residue item must be an object');
expectRejectedM3Program((p) => { p.residue.ambient[0].anchor = ''; }, 'ambient residue anchor must be non-empty');
expectRejectedM3Program((p) => { p.residue.ambient[0].detail = ''; }, 'ambient residue detail must be non-empty');
expectRejectedM3Program((p) => { p.residue.ambient[0].reason = ''; }, 'ambient residue reason must be non-empty');
expectRejectedM3Program((p) => { p.residue.ambient[0].unexpected = 'must not be silently dropped'; }, 'ambient residue unknown fields must be rejected');
expectRejectedM3Program((p) => { p.residue.unexpected = true; }, 'residue unknown fields must be rejected');
expectRejectedM3Program((p) => { p.residue.narrative = []; }, 'narrative residue must remain absent');

// A map-owned layout validates authored Sheriff anchors at registration while keeping legacy maps
// layout-agnostic. The real program must pass; each anchor-bearing section must reject a dangling id.
{
  const fixture = validCatalog();
  const maps = mapsForCatalog(fixture, sheriffLayoutFixture());
  maps.sheriff.rows = ['unchanged collision'];
  maps.sheriff.doors = { entrance: { tx: 7, ty: 11 } };
  const beforeMap = JSON.stringify(maps.sheriff);
  const context = isolated(maps);
  context.GAME.CastPresence = { bodiesFor() { throw new Error('Program must not query Cast Presence'); } };
  context.GAME.AmbientLife = { step() { throw new Error('Program must not step Ambient Life'); } };
  assert.doesNotThrow(() => context.GAME.World.register(fixture),
    'real Sheriff program registers against its map layout');
  assert.equal(JSON.stringify(maps.sheriff), beforeMap,
    'Program registration does not mutate collision, doors, or native scene layout');
}
expectRejectedSheriffAnchor((p) => { p.groups[0].anchors[0] = 'missing-group-footprint'; },
  'unknown group footprint anchor is rejected');
expectRejectedSheriffAnchor((p) => { p.contributions[0].anchor = 'missing-contribution-footprint'; },
  'unknown contribution footprint anchor is rejected');
expectRejectedSheriffAnchor((p) => { p.relationships[0].from = 'missing-near-footprint'; },
  'unknown NEAR footprint anchor is rejected');
expectRejectedSheriffAnchor((p) => { p.relationships[2].to = 'missing-reachable-target'; },
  'unknown REACHABLE target anchor is rejected');
expectRejectedSheriffAnchor((p) => { p.residue.ambient[0].anchor = 'missing-residue-footprint'; },
  'unknown residue footprint anchor is rejected');
{
  const fixture = validCatalog();
  const context = isolated(mapsForCatalog(fixture));
  assert.throws(() => context.GAME.World.register(fixture), /native map layout is missing/,
    'program anchors require a native map layout when the map is loaded');
}
{
  const fixture = validCatalog();
  const layout = sheriffLayoutFixture();
  delete layout.footprints;
  const context = isolated(mapsForCatalog(fixture, layout));
  assert.throws(() => context.GAME.World.register(fixture), /native layout\.footprints/,
    'present native layout must expose footprint anchors');
}

{
  const World = isolated().GAME.World;
  const fixture = validCatalog();
  fixture.locations[0].id = '__proto__';
  fixture.locations[0].environments[0].id = 'constructor';
  fixture.locations[0].environments[0].sceneId = 'toString';
  World.register(fixture);
  assert.equal(World.getLocation('__proto__').id, '__proto__');
  assert.equal(World.getEnvironment('__proto__', 'constructor').sceneId, 'toString');
  assert.equal(World.getLocationForScene('toString').id, '__proto__');
}

expectRejected(c => { c.locations.push({ ...c.locations[0], environments: [{ id: 'other', sceneId: 'other' }] }); });
expectRejected(c => { c.locations[0].environments.push({ id: 'exterior', sceneId: 'other' }); });
expectRejected(c => { c.locations[1].environments[0].sceneId = 'double_r_exterior_prototype'; });
expectRejected(c => { c.locations[0].connections.push('double-r-front-entrance'); });
expectRejected(c => { c.id = ''; });
expectRejected(c => { delete c.locations; });
expectRejected(c => { delete c.locations[0].id; });
expectRejected(c => { c.locations[0].environments = []; });
expectRejected(c => { delete c.locations[0].environments[0].sceneId; });
expectRejected(c => { c.locations[0].connections[0] = ''; });
expectRejected(c => { c.locations[0].connections[0] = { id: 'alpha-door' }; });
expectRejected(c => { delete c.locations[0]; });
expectRejected(c => { delete c.locations[0].environments[0]; });
expectRejected(c => { delete c.locations[0].connections[0]; });
expectRejected(() => {}, { double_r_exterior_prototype: {}, diner: {} });
expectRejected(c => { c.locations[0].environments[0].sceneId = 'constructor'; }, {});
expectRejected(c => { c.locations[0].environments[0].sceneId = 'toString'; }, {});
assert.doesNotThrow(() => isolated({
  double_r_exterior_prototype: {},
  diner: {},
  town: {},
  sheriffs_station_exterior: {},
  sheriff: { layout: sheriffLayoutFixture() },
  traincar: {},
  oej: {},
  room_315: {},
  hotel_gn: {},
  hospital: {},
  palmer: {},
  roadhouse: {},
  woods: {},
  redroom: {},
  arrival: {}
}).GAME.World.register(validCatalog()));

global.window = global;
global.GAME = {};
require('../js/tiles.js'); require('../js/chars.js'); require('../js/houses.js'); require('../js/maps.js'); require('../js/data.js'); require('../js/scene-objects.gen.js'); require('../js/glue.js');
require('../js/location-connections.js'); require('../js/double-r-exterior-scene.js'); require('../js/world-connections.gen.js');
require('../js/sheriffs-station-art.js'); require('../js/sheriffs-station-exterior-art.js');
require('../js/sheriffs-station-scene.js'); require('../js/sheriffs-station-exterior-scene.js');
require('../js/environment-reactions.js');
GAME.DoubleRExteriorScene.install();
    // Registry must exist before the production installers, which source records from GAME.WorldData.
    require('../js/world-connections.gen.js');
   require('../js/sheriffs-station-production.js');
require('../js/world-connections-production.js');
require('../js/world-engine.js'); require('../js/world-catalog.js');
const World = GAME.World;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scriptOrder = [
  'double-r-location-production.js',
  'sheriffs-station-production.js',
  'room-315-production.js',
  'hospital-production.js',
  'traincar-production.js',
  'world-connections-production.js',
  'world-engine.js',
  'world-catalog.js',
  'main.js'
].map(name => html.indexOf(name));
assert(scriptOrder.every(index => index >= 0), 'production includes location installers and World scripts');
assert.equal(html.indexOf('traincar-location-production.js'), -1, 'the per-location traincar installer is gone');
assert.equal(html.split('world-connections-production.js').length - 1, 1, 'production loads the single door installer exactly once');
assert(scriptOrder.every((index, position) => position === 0 || scriptOrder[position - 1] < index), 'production loads installers before World engine, catalog, and main');
assert.equal(World.catalog.id, 'twin-peaks');
assert.deepEqual(World.catalog.locations.map(location => location.id), ['double-r', 'town', 'sheriffs-station', 'traincar-crossing', 'one-eyed-jacks', 'great-northern', 'hospital', 'palmer-house', 'roadhouse', 'ghostwood', 'red-room', 'arrival']);
for (const [loc, scene] of [['palmer-house', 'palmer'], ['roadhouse', 'roadhouse'], ['ghostwood', 'woods'], ['red-room', 'redroom'], ['arrival', 'arrival']]) {
  assert.equal(World.getLocationForScene(scene).id, loc, scene + ' belongs to ' + loc);
}
assert(World.getConnections('hospital').includes('town-hospital'));
assert(World.getConnections('red-room').includes('woods-redroom-dream') && World.getConnections('red-room').includes('redroom-room-315-wake'));
assert.deepEqual(World.getLocation('sheriffs-station').environments.map(environment => environment.id), ['exterior', 'interior']);
assert.equal(World.getEnvironment('sheriffs-station', 'exterior').sceneId, 'sheriffs_station_exterior');
assert.equal(World.getEnvironment('sheriffs-station', 'interior').sceneId, 'sheriff');
assert.strictEqual(GAME.Maps.sheriff.layout, GAME.SheriffsStationScene.layout,
  'installed Sheriff map exposes the native scene layout by reference');
assert.strictEqual(GAME.Maps.sheriff.layout.footprints, GAME.SheriffsStationScene.layout.footprints,
  'installed Sheriff map shares native footprint anchors');
assert.strictEqual(GAME.Maps.sheriff.layout.targets, GAME.SheriffsStationScene.layout.targets,
  'installed Sheriff map shares native target anchors');
assert.equal(Object.prototype.propertyIsEnumerable.call(GAME.Maps.sheriff, 'layout'), false,
  'native layout alias does not enter full-map serialization');
assert.equal(Object.getOwnPropertyDescriptor(GAME.Maps.sheriff, 'layout').writable, false,
  'native layout alias cannot be replaced through the map');
const sheriffProgramEnvironment = World.getLocation('sheriffs-station').environments.find(environment => environment.program);
assert(sheriffProgramEnvironment, 'real Sheriff catalog carries an environment.program');
assertFrozenProgram(sheriffProgramEnvironment.program, 'real Sheriff environment.program');
assert.strictEqual(World.getEnvironment('sheriffs-station', sheriffProgramEnvironment.id).program, sheriffProgramEnvironment.program,
  'getEnvironment exposes the canonical Sheriff program');
assert.equal(World.getLocationForScene('sheriff').id, 'sheriffs-station');
assert.deepEqual(World.getLocation('double-r').environments.map(environment => environment.id), ['exterior', 'interior']);
assert.equal(World.getEnvironment('double-r', 'exterior').sceneId, 'double_r_exterior_prototype');
assert.equal(World.getEnvironment('double-r', 'interior').sceneId, 'diner');
assert.equal(World.getLocationForScene('traincar').id, 'traincar-crossing');
assert(World.getConnections('traincar-crossing').includes('traincar-oej-entrance'));
assert(World.getConnections('town').includes('town-traincar-east'));
assert(World.getConnections('traincar-crossing').includes('town-traincar-east'), 'shared connection belongs to both endpoint locations');
assert(World.getConnections('one-eyed-jacks').includes('traincar-oej-entrance'));
assert.deepEqual(World.getLocation('great-northern').environments.map(environment => environment.id), ['room-315', 'lobby']);
assert.equal(World.getEnvironment('great-northern', 'room-315').sceneId, 'room_315');
assert.equal(World.getEnvironment('great-northern', 'lobby').sceneId, 'hotel_gn');
assert.equal(World.getLocationForScene('room_315').id, 'great-northern');
assert.equal(World.getLocationForScene('hotel_gn').id, 'great-northern');
assert(World.getConnections('great-northern').includes('great-northern-room-315-hall'));
const connections = GAME.WorldData.connections;
const recordById = new Map(connections.map(record => [record.id, record]));
for (const connectionId of World.getConnections()) {
  const record = recordById.get(connectionId);
  assert(record, `${connectionId} resolves to existing authored connection`);
  for (const endpoint of [record.a, record.b]) {
    const location = World.getLocationForScene(endpoint.scene);
    assert(location, `${connectionId} endpoint ${endpoint.scene} is cataloged`);
    if (endpoint.spawn) assert(!endpoint.triggers.some(([x, y]) => x === endpoint.spawn.tx && y === endpoint.spawn.ty), `${connectionId} spawn is non-trigger`);
    else assert(record.one_way === true && endpoint === record.a, `${connectionId} only a one-way source endpoint has no spawn`);
    assert(GAME.Maps[endpoint.scene].doors, `${connectionId} references authored map doors`);
       assert(World.getConnections(location.id).includes(connectionId), `${connectionId} belongs to endpoint location`);
      }
  // ...and to no other location: catalog membership is exactly the set of endpoint locations
  const endpointLocations = new Set([record.a, record.b].map(endpoint => World.getLocationForScene(endpoint.scene).id));
  const listedIn = World.catalog.locations.filter(location => location.connections.includes(connectionId)).map(location => location.id);
  assert.deepEqual(listedIn.slice().sort(), [...endpointLocations].sort(), `${connectionId} is listed exactly in its endpoint locations`);
    }

     // ---- SINGLE REGISTRY (Phase 1): connection RECORDS now live in GAME.WorldData (js/world-connections.gen.js),
    // replacing the four *-location-data groups as the authoritative source. Bijection between the catalog's id
     // membership and the registry record set, checked BOTH ways, is what makes deleting the group globals safe:
      //    - every catalog connection id resolves to exactly one registry record (no missing record);
      //    - every registry record id is referenced by at least one location (no orphan record).
     require('../js/world-connections.gen.js');
      var registry = GAME.WorldData.connections;
    assert.equal(registry.length, World.getConnections().length, 'registry record count equals catalog connection count');
     assert(Object.isFrozen(registry), 'registry array is frozen — editors work on drafts, never the source');
      var regIds = new Map(registry.map(record => [record.id, record]));
      for (const cid of World.getConnections()) {
      const record = regIds.get(cid);
       assert(record, `catalog id ${cid} resolves to a registry record`);
       for (const endpoint of [record.a, record.b]) {
         assert(GAME.World.getLocationForScene(endpoint.scene), `${cid}.${endpoint.scene} is a cataloged scene`);
          }
        }
  var referencedIds = new Set([...World.getConnections()]);
for (const record of registry) {
  assert(referencedIds.has(record.id), `registry record ${record.id} is referenced by a catalog location`);
 }

// ---- PRODUCTION CAN FILTER THE REGISTRY: location-connections.connectionRecordsFor() resolves a location's
 // id-list to its exact records, and fails loud (never silent) when an id is unknown or the registry is not
  // loaded yet. This is what lets the production installers survive the *-location-data deletion: they call this
   // filter instead of reading a group global. A silent skip would let a missing record masquerade as "no doors".
    assert(typeof GAME.LocationConnections.connectionRecordsFor === 'function',
     'LocationConnections.connectionRecordsFor must exist so production can filter the registry');
    var tcIds = World.getConnections('traincar-crossing');
     var filtered = GAME.LocationConnections.connectionRecordsFor(tcIds);
      assert.deepEqual(filtered.map(r => r.id), tcIds, 'connectionRecordsFor filters the registry by a location id-list in order');
       for (const cid of World.getConnections()) {
        const one = GAME.LocationConnections.connectionRecordsFor([cid]);
         assert.equal(one.length, 1, `${cid} resolves to exactly one record via the filter`);
          assert.equal(one[0].id, cid, `${cid} filter returns its own record`);
           }
            assert.throws(() => GAME.LocationConnections.connectionRecordsFor(['no-such-connection']),
             'filtering an unknown id fails loud rather than skipping silently');

// ---- LEGACY-DOOR REPORT: which GAME.Maps still carry classic js/maps.js-authored doors, i.e. door descriptors
 // that are NOT produced by any connection record. The registry owns a fixed key set (built fresh, exactly like
  // world-door-equality's "B"); every live door outside that set is a classic authoring that a future migration
   // could express as a connection record. This is observability, not a gate — it must not assert a count we do
    // not control, only report it and prove the diff itself ran.
     var registryOwnedKeys = {};
      var freshDoors = {};
       GAME.WorldData.connections.forEach(function (record) {
         ['a', 'b'].forEach(function (side) {
           const sceneId = record[side].scene;
            if (!freshDoors[sceneId]) {
              const real = GAME.Maps[sceneId];
               freshDoors[sceneId] = { id: sceneId, width: real.width, height: real.height, doors: {},
                 isSolid: function () { return false; } };
                  }
                });
              });
               GAME.WorldData.connections.forEach(function (record) { GAME.LocationConnections.install(record, freshDoors); });
                Object.keys(freshDoors).forEach(function (sceneId) {
                  Object.keys(freshDoors[sceneId].doors).forEach(function (key) { registryOwnedKeys[sceneId + '|' + key] = true; });
                    });
                   const classicDoors = [];
                     let scenesStillClassic = 0;
                      Object.keys(GAME.Maps).forEach(function (sceneId) {
                        const map = GAME.Maps[sceneId];
                         if (!map || !map.doors) return;
                          const sceneKeys = Object.keys(map.doors);
                           if (!sceneKeys.length) return;
                            let classicCount = 0;
                             sceneKeys.forEach(function (key) { if (!registryOwnedKeys[sceneId + '|' + key]) classicCount++; });
                              if (classicCount > 0) { scenesStillClassic++; classicDoors.push(`${sceneId}:${classicCount}`); }
                                });
                                 console.log('LEGACY-DOOR-REPORT registry-owned doors across ' + Object.keys(registryOwnedKeys).length + ' key(s); '
                                  + 'classic js/maps.js-authored doors still in GAME.Maps: ' + classicDoors.length + ' descriptor(s) in '
                                   + scenesStillClassic + ' scene(s) -> ' + (classicDoors.join(', ') || 'none'));

console.log('WORLD-ENGINE-V0.1-CATALOG-PASS registration, immutable catalog, scoped lookups, shared connections, validation, authored references, single registry bijection, filter load-order, legacy-door report');
