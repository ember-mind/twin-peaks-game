/* persistence.js — Living Town: the page's rules around a save, without a page.
 * node living-town/test/persistence.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-persistence.js'));
const LT = global.LT, Pz = LT.Persistence;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

function fakeStorage() {
  const store = {}, writes = [];
  global.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); writes.push(k); },
    removeItem: (k) => { delete store[k]; }
  };
  return { store, writes };
}
const KEY = LT.Save.DEFAULT_KEY;

async function fourStartingSituations() {
  console.log('# start: four situations, told apart');
  let s = fakeStorage();
  let c = Pz.create({ tabId: 'A' });
  ok(c.boot().status === 'none' && !c.protectedReason, 'nothing stored: none — a new world may simply begin');

  const world = LT.Scenario.day1({});
  await world.runUntil(1, 700);
  ok(c.save(world).ok, 'a first save succeeds');
  c.release();                              // the page is closed
  c = Pz.create({ tabId: 'A2' });
  const booted = c.boot();
  ok(booted.status === 'loaded' && booted.sim.state.minute === 700 && booted.sim.state.characters.resident_a.name === world.state.characters.resident_a.name,
     'a usable save: loaded, the same town at the same minute');

  c.release();                              // that tab is closed
  const kept = s.store[KEY].replace(/"world":"[0-9a-f]{8}"/, '"world":"deadbeef"');
  s.store[KEY] = kept;
  c = Pz.create({ tabId: 'A3' });
  const refused = c.boot();
  ok(refused.status === 'refused' && /different version of the town/.test(refused.reason) && !!c.protectedReason, 'a save this build refuses: refused, with the reason');
  const blockedSave = c.save(LT.Scenario.day1({}));
  ok(blockedSave.ok === false && blockedSave.status === 'protected' && s.store[KEY] === kept, 'saving over it is not allowed by default, and it is byte for byte where it was');
  ok(c.autosave(LT.Scenario.day1({})) === null && s.store[KEY] === kept, 'autosave never touches it either');
  const replaced = c.save(LT.Scenario.day1({}), { replaceProtected: true });
  ok(replaced.ok && s.store[KEY + '.set-aside'] === kept && s.store[KEY] !== kept, 'told explicitly to replace it, the refused save is moved aside, not destroyed');

  global.localStorage = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } };
  c = Pz.create({ tabId: 'A4' });
  const un = c.boot();
  ok(un.status === 'unavailable' && /could not be read/.test(un.reason), 'unreadable storage: unavailable — not "no save"');
  const w = c.save(LT.Scenario.day1({}));
  ok(w.ok === false && /refused the write|blocked|could not/.test(w.reason), 'and a save attempt reports its failure: ' + w.reason);
}

function addressAsksForANewWorld() {
  console.log('# start: a new world asked for by address leaves the stored save alone');
  const s = fakeStorage();
  Pz.create({ tabId: 'B' }).save(LT.Scenario.day1({}));
  const kept = s.store[KEY];
  const c = Pz.create({ tabId: 'B2' });
  const b = c.boot({ fresh: true });
  ok(b.status === 'set_aside' && b.sim === null && s.store[KEY] === kept, 'the save is not loaded and not touched');
  ok(c.save(LT.Scenario.day1({})).status === 'protected' && c.newWorldReplaces(), 'and is protected from being written over until the person says so');
}

function oneTabSavesAtATime() {
  console.log('# tabs: one tab saves a world at a time');
  const s = fakeStorage();
  let clock = 1000;
  const first = Pz.create({ tabId: 'first', now: () => clock }), second = Pz.create({ tabId: 'second', now: () => clock });
  const w1 = LT.Scenario.day1({}), w2 = LT.Scenario.day1({ seed: 7 });
  ok(first.boot().status === 'none' && first.save(w1).ok, 'the first tab saves and holds the lease');
  const after1 = s.store[KEY];
  second.boot();
  const blocked = second.save(w2);
  ok(blocked.ok === false && blocked.status === 'other_tab' && s.store[KEY] === after1, 'the second tab does not write over it: ' + blocked.reason);
  ok(second.autosave(w2) === null, 'nor does its autosave');
  ok(second.save(w2, { takeOver: true }).ok && first.heldElsewhere(), 'told to take over, it does, and the first tab now sees the lease elsewhere');
  ok(first.save(w1).status === 'other_tab', 'so the first tab stops writing instead of fighting over it');
  clock += Pz.LEASE_MS + 1;
  ok(first.save(w1).ok, 'a lease that is no longer renewed (a closed tab) lapses after ' + Pz.LEASE_MS / 1000 + ' s');
  first.release();
  ok(!s.store[KEY + '.owner'], 'leaving the page releases the lease');
}

async function autosaveCadence() {
  console.log('# autosave: between ticks, by town time, never per frame');
  const s = fakeStorage();
  let clock = 0;
  const c = Pz.create({ tabId: 'C', now: () => clock });
  c.boot();
  const sim = LT.Scenario.day1({});
  let saves = 0;
  for (let i = 0; i < 300; i++) {            // five hours of town time at a tick every 12 ms (20x)
    sim.tick(); clock += 12;
    const r = c.autosave(sim);
    if (r) { assert(r.ok && r.auto); saves++; }
  }
  ok(saves === 1, '300 ticks in 3.6 s of real time: ' + saves + ' autosave, held back by the ' + Pz.AUTOSAVE_REAL_MS / 1000 + ' s floor');
  saves = 0;
  for (let i = 0; i < 300; i++) { sim.tick(); clock += 250; if (c.autosave(sim)) saves++; }   // 1x
  ok(saves === 7, '300 minutes at 1x (75 s): ' + saves + ' autosaves — due every ' + Pz.AUTOSAVE_SIM_MINUTES + ' town minutes, and never inside ' + Pz.AUTOSAVE_REAL_MS / 1000 + ' s of the last');
  ok(s.writes.filter((k) => k === KEY).length === 8, 'and exactly that many writes of the world reached storage');
}

(async function main() {
  await fourStartingSituations();
  addressAsksForANewWorld();
  oneTabSavesAtATime();
  await autosaveCadence();
  delete global.localStorage;
  console.log('\npersistence: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
