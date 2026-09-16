'use strict';

/* Route helpers over player inputs and serialized observations only.
 * No runtime imports, state seeds, teleportation or interaction API fallback.
 */
const assert = require('node:assert/strict');
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const DIRS = [[0, -1, 'up'], [1, 0, 'right'], [0, 1, 'down'], [-1, 0, 'left']];
const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const cell = (x, y) => `${x},${y}`;
function pathTo(s, tx, ty, allowDoor = false, finalDir = null) {
  const from = [s.player.tx, s.player.ty, s.player.dir];
  const key = (p) => finalDir ? cell(p[0], p[1]) + ',' + p[2] : cell(p[0], p[1]);
  const q = [from], seen = new Map([[key(from), null]]);
  const occupied = new Set();
  for (const n of s.liveNpcs || []) {
    occupied.add(cell(n.x, n.y));
    if (n.moving) occupied.add(cell(n.mx, n.my));
  }
  const doors = s.doors[s.mapId] || {};
  for (let i = 0; i < q.length; i++) {
    const [x, y, facing] = q[i];
    if (x === tx && y === ty && (!finalDir || facing === finalDir)) {
      const result = []; let next = q[i];
      while (seen.get(key(next))) { result.unshift(next.slice(0, 2)); next = seen.get(key(next)); }
      return result;
    }
    for (const [dx, dy, dir] of DIRS) {
      const nx = x + dx, ny = y + dy, k = cell(nx, ny), target = [nx, ny, dir];
      if (seen.has(key(target)) || !s.map.solid[ny] || s.map.solid[ny][nx] !== '0' || occupied.has(k)) continue;
      if (doors[k] && !(allowDoor && nx === tx && ny === ty)) continue;
      seen.set(key(target), q[i]); q.push(target);
    }
  }
  return null;
}
function unlocked(d, s) {
  return !d.locked && (!d.needsFlag || !!s.flags[d.needsFlag]) &&
    (!d.needsClues || s.clues.length >= d.needsClues);
}
function nextMap(s, goal) {
  const q = [[s.mapId, null]], seen = new Set([s.mapId]);
  for (let i = 0; i < q.length; i++) {
    const [map, first] = q[i];
    if (map === goal) return first;
    for (const d of Object.values(s.doors[map] || {})) {
      if (!d.to || !unlocked(d, s) || seen.has(d.to)) continue;
      seen.add(d.to); q.push([d.to, first || d.to]);
    }
  }
  throw new Error(`No unlocked map route ${s.mapId} -> ${goal}`);
}
function menu(s) {
  const u = s.semanticUi;
  return u.choices.length || u.propositions.length || u.attachments.length || u.attachmentConfirm.length;
}
function idle(s) {
  return s.mode === 'play' && !s.player.moving && !s.fadePhase && !s.dialogue &&
    !s.narrativeActive && !(s.finale && s.finale.active) && !s.menu;
}
function digest(s) {
  const n = s.narrative || {};
  return { flags: n.flags, evidence: n.evidence, values: n.values, props: n.props,
    nodes_done: n.nodes_done, finale: s.finale && { stage: s.finale.stage, values: s.finale.values } };
}
function createPlayer(browser, log = () => {}) {
  const snap = () => browser.snapshot();
  async function press(code) { await browser.press(code, 20); await pause(175); }
  async function drain() {
    for (let i = 0; i < 400; i++) {
      const s = await snap();
      if (s.semanticUi.recovery) throw new Error('Production save-recovery UI appeared');
      if (menu(s) || s.mode === 'end') return s;
      if (s.dialogue || (s.semanticUi.page && !s.semanticUi.notebook)) {
        log({ type: 'page', map: s.mapId, page: s.semanticUi.pageId,
          text: s.semanticUi.page, classic: s.dialogue && { id: s.dialogue.id, i: s.dialogue.i } });
        await press('Enter');
      } else if (idle(s) || s.semanticUi.notebook) {
        await pause(220);
        const settled = await snap();
        if (menu(settled) || idle(settled) || settled.semanticUi.notebook) return settled;
      } else await pause(80);
    }
    throw new Error('Dialogue drain exceeded 400 steps');
  }
  async function start() {
    const s = await snap();
    assert.equal(s.mode, 'title', 'Fresh build must show the title');
    assert.ok(!s.flags.sogno_fatto && !s.flags.atto3, 'No seeded progress');
    await press('KeyN');
    for (let i = 0; i < 80; i++) {
      const t = await snap();
      if (t.mode === 'play') return drain();
      assert.ok(['title', 'intro'].includes(t.mode), `Unexpected opening mode ${t.mode}`);
      await press('Enter');
    }
    throw new Error('New Game did not enter play');
  }
  async function face(dir) {
    const s = await snap();
    if (s.player.dir === dir) return;
    await press(KEY[dir]);
    const t = await browser.waitFor('player settles after turning', (v) => !v.player.moving && !v.fadePhase);
    assert.deepEqual([t.player.tx, t.player.ty, t.player.dir], [s.player.tx, s.player.ty, dir],
      'A short changed-direction input must turn without stepping onto the target');
  }
  async function walk(tx, ty, allowDoor = false, finalDir = null) {
    const mapId = (await snap()).mapId;
    for (let attempt = 0; attempt < 12; attempt++) {
      let s = await snap();
      if (s.mapId !== mapId) {
        if (allowDoor) return;
        throw new Error(`Unexpected map change while walking ${mapId} -> ${s.mapId}`);
      }
      if (s.player.tx === tx && s.player.ty === ty && (!finalDir || s.player.dir === finalDir)) return;
      assert.ok(idle(s), `Cannot walk while UI owns input: ${JSON.stringify({mode:s.mode,page:s.semanticUi.page,choices:s.semanticUi.choices})}`);
      const path = pathTo(s, tx, ty, allowDoor, finalDir);
      if (!path) { await pause(400); continue; }
      let replan = false;
      for (const [nx, ny] of path) {
        s = await snap();
        const dx = nx - s.player.tx, dy = ny - s.player.ty;
        if (Math.abs(dx) + Math.abs(dy) !== 1) { replan = true; break; }
        const dir = dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        for (let taps = 0; taps < 3; taps++) {
          await press(KEY[dir]);
          await browser.waitFor('movement frame settles', (t) => !t.player.moving && !t.fadePhase);
          s = await snap();
          if (s.mapId !== mapId) {
            if (allowDoor && nx === tx && ny === ty) { await drain(); return; }
            throw new Error(`Unexpected door while walking to ${tx},${ty}`);
          }
          if (s.player.tx === nx && s.player.ty === ny) break;
          if (s.dialogue || s.narrativeActive) throw new Error(`Movement unexpectedly opened dialogue at ${s.mapId}:${nx},${ny}`);
        }
        if (s.player.tx !== nx || s.player.ty !== ny) { replan = true; break; }
      }
      if (!replan) return;
    }
    const s = await snap();
    throw new Error(`Unreachable ${mapId}:${tx},${ty} from ${s.player.tx},${s.player.ty}`);
  }
  async function go(goal) {
    for (let changes = 0; changes < 16; changes++) {
      await drain();
      const s = await snap();
      if (s.mapId === goal) return;
      const next = nextMap(s, goal);
      const candidates = Object.entries(s.doors[s.mapId] || {}).filter(([, d]) => d.to === next && unlocked(d, s))
        .map(([k, d]) => ({ xy: k.split(',').map(Number), d }))
        .map((c) => ({ ...c, path: pathTo(s, ...c.xy, true) }))
        .filter((c) => c.path).sort((a, b) => a.path.length - b.path.length);
      assert.ok(candidates.length, `No physically reachable door ${s.mapId} -> ${next}`);
      const c = candidates[0];
      log({ type: 'door', from: s.mapId, to: next, at: c.xy });
      await walk(...c.xy, true);
      await browser.waitFor(`arrival in ${next}`, (t) => t.mapId === next && !t.fadePhase && !t.player.moving);
      await drain();
    }
    throw new Error(`Too many map changes to ${goal}`);
  }
  async function reach(tx, ty) {
    const s = await snap();
    // With the production turn-input repair, an ordinary short tap can face a
    // walkable target in a recess. No collision or interaction API is bypassed.
    const candidates = DIRS.map(([dx, dy, dir]) => ({ x: tx - dx, y: ty - dy, dir }))
      .map((c) => ({ ...c, path: pathTo(s, c.x, c.y) })).filter((c) => c.path)
      .sort((a, b) => a.path.length - b.path.length);
    assert.ok(candidates.length, `Target unreachable ${s.mapId}:${tx},${ty}`);
    const c = candidates[0]; await walk(c.x, c.y); await face(c.dir);
    const t = await snap();
    assert.equal(Math.abs(t.player.tx - tx) + Math.abs(t.player.ty - ty), 1, 'Player must stand beside target');
    assert.equal(t.player.dir, c.dir, 'Player must face target');
  }
  async function interact() { await press('Enter'); return drain(); }
  async function actor(mapId, id) {
    await go(mapId); await drain();
    const s = await snap(), found = s.liveNpcs.filter((n) => n.id === id);
    assert.equal(found.length, 1, `Exactly one physical ${id} required in ${mapId}`);
    log({ type: 'actor', map: mapId, id });
    await reach(found[0].x, found[0].y); return interact();
  }
  async function target(mapId, id) {
    await go(mapId); const s = await snap();
    const t = s.targets && s.targets[mapId] && s.targets[mapId][id];
    assert.ok(t, `Missing authored narrative target ${mapId}:${id}`);
    log({ type: 'target', map: mapId, id });
    await reach(t.x, t.y); return interact();
  }
  async function select(group, id) {
    for (let i = 0; i < 100; i++) {
      const s = await snap();
      const items = group === 'attachmentAll' ? [...s.semanticUi.attachments, ...s.semanticUi.attachmentConfirm] : s.semanticUi[group];
      assert.ok(items && items.some((o) => o.id === id), `UI lacks ${group}:${id}; offered ${JSON.stringify(items)}`);
      const selected = items.find((o) => o.focused);
      assert.ok(selected, `No keyboard focus in ${group}`);
      if (selected.id === id) { log({ type: 'select', group, id }); await press('Enter'); return; }
      await press('ArrowDown');
    }
    throw new Error(`Cannot focus ${group}:${id}`);
  }
  async function choose(id) { await select('choices', id); return drain(); }
  async function closeNotebook() {
    for (let i = 0; i < 5 && (await snap()).semanticUi.notebook; i++) await press('Escape');
    assert.ok(!(await snap()).semanticUi.notebook, 'Notebook must close');
    return drain();
  }
  async function compare(first, second) {
    await press('KeyT');
    await browser.waitFor('notebook opens', (s) => s.semanticUi.notebook);
    await select('notebookSections', 'Confronta');
    await select('notebookEvidence', first); await select('notebookEvidence', second);
    return drain();
  }
  async function present(id, evidence = []) {
    await select('propositions', id);
    let s = await drain();
    if (s.semanticUi.attachmentConfirm.length) {
      for (const e of evidence) await select('attachmentAll', e);
      await select('attachmentAll', 'true'); s = await drain();
    } else assert.equal(evidence.length, 0, 'Attachments expected but no attachment menu');
    return s;
  }
  return Object.freeze({ start, drain, press, walk, go, reach, face, interact, actor, target,
    choose, select, compare, present, closeNotebook, snapshot: snap });
}
module.exports = { createPlayer, pathTo, nextMap, unlocked, digest, idle };
