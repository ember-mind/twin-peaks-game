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
  const registered = World.register(input);
  assert.strictEqual(registered, World.catalog, 'register returns stored catalog');
  assert.notStrictEqual(registered, input, 'catalog is copied');
  for (const value of [registered, registered.locations, registered.locations[0], registered.locations[0].environments, registered.locations[0].environments[0], registered.locations[0].connections]) assert(Object.isFrozen(value));
  input.id = 'mutated'; input.locations[0].id = 'mutated'; input.locations[0].environments[0].sceneId = 'mutated'; input.locations[0].connections.push('mutated');
  assert.equal(registered.id, 'twin-peaks', 'source mutations cannot alter registered catalog');
  assert.equal(World.getLocation('double-r').id, 'double-r');
  assert.equal(World.getEnvironment('double-r', 'exterior').sceneId, 'double_r_exterior_prototype');
  assert.equal(World.getEnvironment('double-r', 'interior').sceneId, 'diner', 'environment IDs are location-scoped');
  assert.equal(World.getEnvironment('double-r', 'missing'), undefined);
  assert.equal(World.getLocationForScene('diner').id, 'double-r');
  assert.deepEqual(Array.from(World.getConnections()), ['double-r-front-entrance', 'town-double-r-lot', 'town-traincar-east', 'town-sheriffs-station-lot', 'sheriffs-station-front-entrance', 'traincar-oej-entrance', 'great-northern-room-315-hall'], 'world connections deduplicate in author order');
  assert.deepEqual(Array.from(World.getConnections('town')), ['town-traincar-east', 'town-sheriffs-station-lot', 'town-double-r-lot']);
  assert.deepEqual(Array.from(World.getConnections('traincar-crossing')), ['town-traincar-east', 'traincar-oej-entrance']);
  assert.throws(() => World.register(validCatalog()), 'only one catalog may be registered');
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
  sheriff: {},
  traincar: {},
  oej: {},
  room_315: {},
  hotel_gn: {},
  hospital: {}
}).GAME.World.register(validCatalog()));

global.window = global;
global.GAME = {};
require('../js/tiles.js'); require('../js/chars.js'); require('../js/houses.js'); require('../js/maps.js'); require('../js/data.js'); require('../js/glue.js');
require('../js/location-connections.js'); require('../js/double-r-exterior-scene.js'); require('../js/double-r-location-data.js'); require('../js/traincar-location-data.js');
require('../js/sheriffs-station-art.js'); require('../js/sheriffs-station-exterior-art.js');
require('../js/sheriffs-station-scene.js'); require('../js/sheriffs-station-exterior-scene.js');
require('../js/sheriffs-station-location-data.js');
require('../js/room-315-location-data.js');
require('../js/environment-reactions.js');
GAME.DoubleRExteriorScene.install();
require('../js/sheriffs-station-production.js');
require('../js/world-engine.js'); require('../js/world-catalog.js');
const World = GAME.World;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scriptOrder = [
  'double-r-location-production.js',
  'sheriffs-station-production.js',
  'traincar-location-production.js',
  'world-engine.js',
  'world-catalog.js',
  'main.js'
].map(name => html.indexOf(name));
assert(scriptOrder.every(index => index >= 0), 'production includes location installers and World scripts');
assert(scriptOrder.every((index, position) => position === 0 || scriptOrder[position - 1] < index), 'production loads installers before World engine, catalog, and main');
assert.equal(World.catalog.id, 'twin-peaks');
assert.deepEqual(World.catalog.locations.map(location => location.id), ['double-r', 'town', 'sheriffs-station', 'traincar-crossing', 'one-eyed-jacks', 'great-northern', 'hospital']);
assert.deepEqual(World.getLocation('sheriffs-station').environments.map(environment => environment.id), ['exterior', 'interior']);
assert.equal(World.getEnvironment('sheriffs-station', 'exterior').sceneId, 'sheriffs_station_exterior');
assert.equal(World.getEnvironment('sheriffs-station', 'interior').sceneId, 'sheriff');
assert.equal(World.getLocationForScene('sheriff').id, 'sheriffs-station');
assert.deepEqual(World.getLocation('double-r').environments.map(environment => environment.id), ['exterior', 'interior']);
assert.equal(World.getEnvironment('double-r', 'exterior').sceneId, 'double_r_exterior_prototype');
assert.equal(World.getEnvironment('double-r', 'interior').sceneId, 'diner');
assert.equal(World.getLocationForScene('traincar').id, 'traincar-crossing');
assert.deepEqual(World.getConnections('traincar-crossing'), ['town-traincar-east', 'traincar-oej-entrance']);
assert(World.getConnections('town').includes('town-traincar-east'));
assert(World.getConnections('traincar-crossing').includes('town-traincar-east'), 'shared connection belongs to both endpoint locations');
assert(World.getConnections('one-eyed-jacks').includes('traincar-oej-entrance'));
assert.deepEqual(World.getLocation('great-northern').environments.map(environment => environment.id), ['room-315', 'lobby']);
assert.equal(World.getEnvironment('great-northern', 'room-315').sceneId, 'room_315');
assert.equal(World.getEnvironment('great-northern', 'lobby').sceneId, 'hotel_gn');
assert.equal(World.getLocationForScene('room_315').id, 'great-northern');
assert.equal(World.getLocationForScene('hotel_gn').id, 'great-northern');
assert(World.getConnections('great-northern').includes('great-northern-room-315-hall'));
const connections = [].concat(GAME.DoubleRLocationConnections, GAME.TraincarLocationConnections, GAME.SheriffsStationLocationConnections, GAME.Room315LocationConnections);
const recordById = new Map(connections.map(record => [record.id, record]));
for (const connectionId of World.getConnections()) {
  const record = recordById.get(connectionId);
  assert(record, `${connectionId} resolves to existing authored connection`);
  for (const endpoint of [record.a, record.b]) {
    const location = World.getLocationForScene(endpoint.scene);
    assert(location, `${connectionId} endpoint ${endpoint.scene} is cataloged`);
    assert(!endpoint.triggers.some(([x, y]) => x === endpoint.spawn.tx && y === endpoint.spawn.ty), `${connectionId} spawn is non-trigger`);
    assert(GAME.Maps[endpoint.scene].doors, `${connectionId} references authored map doors`);
       assert(World.getConnections(location.id).includes(connectionId), `${connectionId} belongs to endpoint location`);
      }
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

    console.log('WORLD-ENGINE-V0.1-CATALOG-PASS registration, immutable catalog, scoped lookups, shared connections, validation, authored references, single registry bijection');
