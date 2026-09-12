/* test/cast-presence-sync.js — seam di popolazione GAME.CastPresence.syncMaps.
 * Verifica: corpi del registro coincidono con CP.bodiesFor su ogni mappa,
 * idempotenza, transizioni senza duplicati, re-entry Atto4 (RC2 incluso),
 * riconciliazione live (wander non tocca corpi invariati), ripiazzamento
 * cross-mappa dello stesso corpo live, e save/reload (snapshot stabile,
 * niente campi interni serializzati).
 *
 * Esegui con: node test/cast-presence-sync.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

global.window = global;
global.addEventListener = () => {};
global.requestAnimationFrame = () => {};
global.performance = { now: () => 0 };

const ctxStub = new Proxy(
   { measureText: (s) => ({ width: String(s).length * 5 }) },
   { get(t, k) { return k in t ? t[k] : () => {}; }, set() { return true; } }
);
const canvasStub = { getContext: () => ctxStub };

const root = path.resolve(__dirname, '..');
const J = (f) => path.join(root, 'js', f);
require(J('tiles.js'));
require(J('chars.js'));
require(J('houses.js'));
require(J('maps.js'));
require(J('data.js'));
require(J('retro-font.js'));
require(J('engine.js'));
require(J('glue.js'));
require(J('narrative-runtime.js'));
require(J('narrative-data.gen.js'));
require(J('narrative-bootstrap.js'));
require(J('cast-presence.js'));

const GAME = global.GAME;
const E = GAME.Engine;
E.init(canvasStub);
GAME.installNarrativeCatalogs({ data: GAME.NarrativeData, runtime: GAME.NarrativeRuntime });

const NR = GAME.NarrativeRuntime;
const CP = GAME.CastPresence;
if (!CP || !CP.syncMaps) throw new Error('GAME.CastPresence.syncMaps non disponibile');

const FIXTURE = JSON.parse(fs.readFileSync(path.join(root, 'test', 'fixtures', 'cast-pins-acts-1-4.json'), 'utf8'));

let checks = 0, failures = 0;
function ok(cond, label) {
  checks++;
  if (!cond) { failures++; console.error('   ✗ ' + label); }
}

function seedState(seed) {
  const s = NR.createState();
  Object.assign(s.flags, seed.flags || {});
  Object.assign(s.values, seed.values || {});
  Object.assign(s.evidence, seed.evidence || {});
  Object.assign(s.nodes_done, seed.nodes_done || {});
  if (seed.props) s.props = JSON.parse(JSON.stringify(seed.props));
  return s;
}

function freshMaps() {
  const maps = {};
  Object.keys(GAME.Maps).forEach((id) => {
    if (typeof GAME.Maps[id] !== 'object' || !GAME.Maps[id]) return;
    maps[id] = { npcs: [] };
  });
  maps.roadhouse.npcs.push({ id: 'folla_1', x: 6, y: 6, sprite: 'bobby', name: 'Avventore', dialogue: null });
  return maps;
}

function bodySetsEqual(mapId, maps, state) {
  const got = maps[mapId].npcs.filter((n) => GAME.NarrativeData.cast.characters[n.id]);
  const want = CP.bodiesFor(mapId, state);
  const norm = (b) => ({ id: b.id, x: b.x, y: b.y, dir: b.dir || 'down', dialogue: b.dialogue === undefined ? null : b.dialogue });
  const g = got.map(norm).sort((a, b2) => a.id < b2.id ? -1 : 1);
  const w = want.map(norm).sort((a, b2) => a.id < b2.id ? -1 : 1);
  return JSON.stringify(g) === JSON.stringify(w);
}

/* ---- 1. seed -> stato: bodiesFor coincide su ogni mappa; folla intatta; idempotente ---- */
console.log('# cast-presence-sync');
Object.keys(FIXTURE.seeds).forEach((seedName) => {
  const seed = FIXTURE.seeds[seedName];
  const state = seedState(seed);
  const maps = freshMaps();
  CP.syncMaps(maps, state, null);
  let allMatch = true;
  Object.keys(maps).forEach((mapId) => { if (!bodySetsEqual(mapId, maps, state)) allMatch = false; });
  ok(allMatch, seedName + ': bodiesFor coincide su tutte le mappe dopo syncMaps');
  const folla = maps.roadhouse.npcs.find((n) => n.id === 'folla_1');
  ok(!!folla && folla.x === 6 && folla.y === 6, seedName + ': folla_1 non toccata');
  const changes2 = CP.syncMaps(maps, state, null);
  ok(Array.isArray(changes2) && changes2.length === 0, seedName + ': secondo syncMaps idempotente');
});

/* ---- 2. sequenza di transizione: nessun id duplicato, al massimo un corpo per personaggio ---- */
const STORY_ORDER = FIXTURE.pins.map((p) => p.seed);
{
  const maps = freshMaps();
  let dupFree = true, atMostOne = true;
  STORY_ORDER.forEach((seedName) => {
    const seed = FIXTURE.seeds[seedName];
    if (!seed) return;
    const state = seedState(seed);
    CP.syncMaps(maps, state, null);
    const countByCharacter = {};
    Object.keys(maps).forEach((mapId) => {
      const seen = {};
      maps[mapId].npcs.forEach((n) => {
        if (seen[n.id]) dupFree = false;
        seen[n.id] = true;
        if (GAME.NarrativeData.cast.characters[n.id]) countByCharacter[n.id] = (countByCharacter[n.id] || 0) + 1;
      });
    });
    Object.keys(countByCharacter).forEach((id) => { if (countByCharacter[id] > 1) atMostOne = false; });
  });
  ok(dupFree, 'transizione: nessuna mappa ha id duplicati in npcs');
  ok(atMostOne, 'transizione: ogni personaggio ha al massimo un corpo su tutte le mappe');
}

/* ---- 3. re-entry Atto4 (regressione obbligatoria) ---- */
{
  const ROADHOUSE_CROWD = ['truman', 'norma', 'shelly', 'loglady', 'james', 'bobby', 'donna'];
  ['ACT4_POST_PHONE_INSIDE_PALMER', 'ACT4_POST_PHONE_INSIDE_CENTRALE', 'ACT4_POST_PHONE_INSIDE_NESSUNO'].forEach((seedName) => {
    const state = seedState(FIXTURE.seeds[seedName]);
    const maps = freshMaps();
    CP.syncMaps(maps, state, null);
    const ids = maps.roadhouse.npcs.map((n) => n.id);
    ROADHOUSE_CROWD.forEach((id) => ok(ids.indexOf(id) !== -1, seedName + ': ' + id + ' presente sul roadhouse'));
    ok(ids.indexOf('gigante') === -1 && ids.indexOf('giant') === -1, seedName + ': gigante/giant assente dal roadhouse');
  });

  {
    const state = seedState(FIXTURE.seeds.ACT4_ROADHOUSE_PRE_PHONE);
    const maps = freshMaps();
    CP.syncMaps(maps, state, null);
    const giant = maps.roadhouse.npcs.find((n) => n.id === 'giant' || n.id === 'gigante');
    ok(!!giant && giant.x === 8 && giant.y === 1, 'ACT4_ROADHOUSE_PRE_PHONE: gigante a 8,1');
  }

  {
    const state = seedState(FIXTURE.seeds.ACT4_ROUTE_PALMER);
    const maps = freshMaps();
    CP.syncMaps(maps, state, null);
    const registryOnRoadhouse = maps.roadhouse.npcs.filter((n) => GAME.NarrativeData.cast.characters[n.id]);
    ok(registryOnRoadhouse.length === 0, 'ACT4_ROUTE_PALMER: nessun corpo del registro sul roadhouse');
    const normaOnDiner = maps.diner.npcs.some((n) => n.id === 'norma');
    const trumanOnSheriff = maps.sheriff.npcs.some((n) => n.id === 'truman');
    ok(normaOnDiner, 'ACT4_ROUTE_PALMER: norma sul diner');
    ok(trumanOnSheriff, 'ACT4_ROUTE_PALMER: truman sul sheriff');
  }

  // RC2: warning_target-only state mantiene la folla
  {
    const base = FIXTURE.seeds.ACT4_ROADHOUSE_PRE_PHONE;
    const state = seedState(base);
    state.values.warning_target = 'palmer';
    state.values.sarah_support_state = 'none';
    state.values.maddy_action_after_warning = 'none';
    delete state.values.focus_destination;
    const maps = freshMaps();
    CP.syncMaps(maps, state, null);
    const ids = maps.roadhouse.npcs.map((n) => n.id);
    ok(ROADHOUSE_CROWD.every((id) => ids.indexOf(id) !== -1), 'RC2: warning_target-only mantiene la folla del roadhouse');
  }
}

/* ---- 4. riconciliazione live: hydrate, wander non tocca, cambio mappa svuota (folla viva sopravvive) ---- */
{
  const hydrate = (b) => Object.assign({ vx: b.x, vy: b.y, homeX: b.x, homeY: b.y, moving: false }, b);
  const live = { mapId: 'roadhouse', npcs: [] };
  const state1 = seedState(FIXTURE.seeds.ACT4_ROADHOUSE_PRE_PHONE);
  CP.syncMaps({}, state1, live, { hydrate });
  ok(live.npcs.length === 8, 'live: 8 corpi idratati sul roadhouse (7 folla + gigante)');
  ok(live.npcs.every((n) => n.homeX !== undefined && n.homeY !== undefined), 'live: ogni corpo ha homeX/homeY');

  live.npcs[0].x += 1; // simula wander
  const before = live.npcs.length;
  const changesWander = CP.syncMaps({}, state1, live, { hydrate });
  ok(changesWander.length === 0, 'live: wander (x spostata, home invariata) non genera cambi');
  ok(live.npcs.length === before, 'live: nessuna rimozione/riaggiunta dopo wander');

  live.npcs.push({ id: 'folla_2', x: 1, y: 1, sprite: 'bobby', name: 'Avventore', dialogue: null });
  const state2 = seedState(FIXTURE.seeds.ACT4_ROUTE_PALMER);
  CP.syncMaps({}, state2, live, { hydrate });
  const registryLive = live.npcs.filter((n) => GAME.NarrativeData.cast.characters[n.id]);
  ok(registryLive.length === 0, 'live: transizione ACT4_ROUTE_PALMER svuota il registro dal roadhouse live');
  ok(live.npcs.some((n) => n.id === 'folla_2'), 'live: folla_2 (non del registro) sopravvive');
}

/* ---- 5. ripiazzamento cross-mappa dello stesso corpo live ---- */
{
  const hydrate = (b) => Object.assign({ vx: b.x, vy: b.y, homeX: b.x, homeY: b.y, moving: false }, b);
  const live = { mapId: 'traincar', npcs: [] };
  CP.syncMaps({}, seedState(FIXTURE.seeds.ACT3_TRAINCAR_REPORT), live, { hydrate });
  const hawk1 = live.npcs.find((n) => n.id === 'hawk');
  ok(!!hawk1 && hawk1.x === 14 && hawk1.y === 8, 'ripiazzamento: hawk al vagone 14,8');

  // ACT3_NORTH_CUT ricolloca hawk sulla STESSA mappa (traincar) a coordinate diverse.
  CP.syncMaps({}, seedState(FIXTURE.seeds.ACT3_NORTH_CUT), live, { hydrate });
  const hawksNow = live.npcs.filter((n) => n.id === 'hawk');
  ok(hawksNow.length === 1, 'ripiazzamento: un solo corpo hawk dopo il cambio di finestra');
  ok(hawksNow[0] && hawksNow[0].x === 22 && hawksNow[0].homeX === 22, 'ripiazzamento: hawk a 22,3 con homeX 22 dopo il taglio a nord');
}

/* ---- 6. save/reload: snapshot stabile, campi interni non serializzati ---- */
Object.keys(FIXTURE.seeds).forEach((seedName) => {
  const seed = FIXTURE.seeds[seedName];
  const state = seedState(seed);
  const snapA = CP.snapshot(state);
  const serialized = NR.serialize ? NR.serialize(state) : JSON.stringify(state);
  const rt = JSON.parse(serialized);
  const snapB = CP.snapshot(rt);
  ok(JSON.stringify(snapA) === JSON.stringify(snapB), seedName + ': snapshot stabile dopo save/reload');
  ok(serialized.indexOf('"cast_source"') === -1, seedName + ': serializzato non contiene cast_source');
  ok(serialized.indexOf('"homeX"') === -1, seedName + ': serializzato non contiene homeX');
  ok(serialized.indexOf('"sceneId"') === -1, seedName + ': serializzato non contiene sceneId');

  const mapsA = freshMaps();
  CP.syncMaps(mapsA, state, null);
  const mapsB = freshMaps();
  CP.syncMaps(mapsB, rt, null);
  let sameBodies = true;
  Object.keys(mapsA).forEach((mapId) => {
    if (!bodySetsEqual(mapId, mapsB, rt)) sameBodies = false;
  });
  ok(sameBodies, seedName + ': syncMaps da stato rigenerato produce gli stessi corpi');
});

console.log('cast-presence-sync: ' + (checks - failures) + '/' + checks);
process.exit(failures > 0 ? 1 : 0);
