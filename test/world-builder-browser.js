#!/usr/bin/env node
'use strict';

/* test/world-builder-browser.js — WORLD BUILDER M4b + M5 + M6 browser proof on the real page.
 *
 *   node test/world-builder-browser.js
 *
 * Serves the repo on loopback, opens world-builder.html in headless Chrome (same flags as test/shot.sh:
 * --headless=new --enable-unsafe-swiftshader --use-angle=swiftshader), drives it with real CDP mouse
 * clicks on canvas tiles and DOM button clicks, and records screenshots in artifacts/world-builder-m6/
 * (the M4b and M5 runs' screenshots stay in artifacts/world-builder-m4b/ and artifacts/world-builder-m5/).
 * world/connections.json is hashed before and after every case: the editor must never touch it.
 *
 *   1  double-r-front-entrance / b  (diner): EDIT, MOVE SPAWN -> 8,8, facing left, ADD trigger 8,9
 *   2  sheriffs-station-front-entrance / a  (sheriffs_station_exterior): same workflow
 *   3  invalid: spawn x=19 on diner -> red marker + error text, export blocked
 *   4  story moment ACT4_EVENING_GATHERING: diner without Norma/Shelly, roadhouse with them
 *   5  M5: town-roadhouse / b (roadhouse, a migrated classic door): MOVE SPAWN -> 6,8, export, CLI dry-run
 *   6  M5: one-way arrival-town: inspector shows ONE-WAY, endpoint b offers no ADD TRIGGER
 *   7  M5: every scene header reports legacy doors 0
 *   8  M6: NEW CONNECTION paired town 30,9 <-> hospital 14,9, id edited to the town + hospital side-door id, MOVE SPAWN b,
 *          undo/redo, export v2, tools/world-apply.js --dry-run prints VALID 16 record(s) + the catalog diff
 *   9  M6: NEW CONNECTION one-way town 34,9 -> hospital 1,9: inspector ONE-WAY, no spawn on a, no ADD TRIGGER on b
 *  10  M6: a temp repo copy gets case 8's changeset applied for real (--root=); the Builder served from that copy
 *          deletes the record (confirm step), the v2 delete is applied, and test/world-engine-v0.1-catalog.js +
 *          test/legacy-door-inventory.js pass on the copy; the real repo's registry and catalog hashes never change
 *  11  M7: great-northern-room-315-hall / a (room_315): door fields set + cleared in EDIT, CONVERT TO ONE-WAY with the
 *          dropped-field list and CONFIRM, export upsert, tools/world-apply.js --dry-run VALID; double-r-front-entrance
 *          (2 triggers on b) asks for the source side before CONFIRM is enabled
 *  12  M7: one-way arrival-town: CONVERT TO PAIRED stays disabled until a.spawn (arrival 4,7) and a b trigger
 *          (town 29,34) are placed, CONFIRM, inspector paired, export upsert, --dry-run VALID
 *  13  M7: story moment ACT3_TRAINCAR_REPORT, traincar: Truman's inspector names window ACT3_TRUMAN_REPORT (owner M5); EDIT,
 *          MOVE to 10,8, arrow keys set facing, export a cast-windows-changeset; --dry-run's windows.json diff is that
 *          window's x line only, and the run fails on the V6 transitions that pin Truman (never repinned)
 *  14  M7: ACT4_AFTERNOON, sheriff: MOVE Truman (baseline) onto Lucy's tile 2,6 is refused with a message
 *  15  M7: same body onto the station door trigger 7,11 and onto a wall refused; then Lucy MOVE 3,6 plus a door field on
 *          sheriffs-station-front-entrance exports a world-builder-bundle; --dry-run --repin on it exits 0
 *          with one repin per V5 pin that expects Lucy on her baseline tile (counted from the fixture)
 *  16  M8: town welcome sign: the click on 30,30 lands on the cartello interact key, ON THIS TILE selects the sign; EDIT, MOVE
 *          to 31,30, export a scene-objects-changeset; --dry-run shows one x line
 *  17  M8: town tracks landmark (rect): RESIZE to 2x30, the cascade is copied untouched, --dry-run VALID
 *  18  M8: traincar 20,2 sign_oej interact key: MISSION REFS names M5 m5_sign_oej, DELETE disabled with the refusal; an
 *          unreferenced key (sign_ponte 4,6) deletes with a confirm step and undoes
 *  19  M8: NEW INTERACT on woods with the INTERACT_DLG id olio: a tile already holding a key is refused, a free tile confirms,
 *          the entry is a sparkle, export + --dry-run VALID
 *  20  M10b: roadhouse props: the PROPS layer is off until asked for, then the header counts them, a click selects a
 *          prop instance (not the tile under it), the inspector names its definition/anchor/layer/footprint, MOVE keeps
 *          the sub-tile fraction of the anchor, FLIP X toggles, arrow keys nudge by a pixel, export + --dry-run VALID
 *  21  M10b: NEW PROP: the catalog filters by label/id/tag, the instance id is suggested from the definition, CONFIRM
 *          creates it, MOVE keeps it a single create op, --dry-run accepts it, REVERT on a created prop removes it
 *  22  M10b: DELETE with a confirm step and undo/redo; a table moved onto the south door tile 7,9 is refused by
 *          tools/world-apply.js with the Roadhouse lock (exit 1, nothing written)
 * WB_ONLY_M8=1 runs cases 16-19 only (M8 iteration); WB_ONLY_M10B=1 runs cases 20-22; the committed proof runs every case.
 * world/scene-objects.json is hashed before and after every M8 case: the editor never writes it.
 * Ids created here are assembled at runtime: a literal id in this file would count as a reference to world-apply.
 */

const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts', 'world-builder-m6');
const OUT7 = path.join(ROOT, 'artifacts', 'world-builder-m7');
const OUT8 = path.join(ROOT, 'artifacts', 'world-builder-m8');
const OUT10 = path.join(ROOT, 'artifacts', 'world-builder-m10b');
const PROPS = path.join(ROOT, 'world', 'props.json');
const OBJECTS = path.join(ROOT, 'world', 'scene-objects.json');
const ONLY_M8 = process.env.WB_ONLY_M8 === '1';
const ONLY_M10B = process.env.WB_ONLY_M10B === '1';
const CATALOG = path.join(ROOT, 'js', 'world-catalog.js');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const REGISTRY = path.join(ROOT, 'world', 'connections.json');

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond });
  console.log(`  ${cond ? 'PASS' : 'FAIL'} - ${name}${cond ? '' : '  ::  ' + JSON.stringify(detail)}`);
  return !!cond;
}
const sha = (file = REGISTRY) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const SIDE_DOOR = ['town', 'hospital', 'side', 'door'].join('-');
const DROP = ['town', 'hospital', 'drop'].join('-');

async function freePort() {
  const s = net.createServer();
  await new Promise((res, rej) => { s.once('error', rej); s.listen(0, '127.0.0.1', res); });
  const p = s.address().port;
  await new Promise((res) => s.close(res));
  return p;
}
async function waitForJson(url, ms) {
  const end = Date.now() + ms;
  let last = '';
  while (Date.now() < end) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(1000) }); if (r.ok) return await r.json(); last = 'HTTP ' + r.status; }
    catch (e) { last = e.message; }
    await new Promise((r) => setTimeout(r, 60));
  }
  throw new Error('DevTools timeout ' + last);
}
class Cdp {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); this.logs = []; }
  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = () => rej(new Error('CDP connect failed')); });
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Runtime.exceptionThrown') this.logs.push('EXCEPTION ' + JSON.stringify(m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description));
      if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) this.logs.push(m.params.type + ' ' + m.params.args.map((a) => a.value || a.description).join(' '));
      if (!m.id || !this.pending.has(m.id)) return;
      const p = this.pending.get(m.id); this.pending.delete(m.id);
      if (m.error) p.rej(new Error(m.error.message)); else p.res(m.result || {});
    };
  }
  send(method, params = {}) {
    return new Promise((res, rej) => { const id = ++this.id; this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('page: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    return r.result && r.result.value;
  }
  close() { try { this.ws.close(); } catch (_) {} }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(OUT7, { recursive: true });
  fs.mkdirSync(OUT8, { recursive: true });
  fs.mkdirSync(OUT10, { recursive: true });
  const objectsShaStart = sha(OBJECTS);
  const shaStart = sha();
  const catalogShaStart = sha(CATALOG);
  const port = await freePort();
  const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
  const devPort = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-wb-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', '--mute-audio', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    `--remote-debugging-port=${devPort}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  const extraServers = [];
  const tempRoots = [];
  const cleanup = () => {
    try { chrome.kill(); } catch (_) {} try { server.kill(); } catch (_) {}
    extraServers.forEach((sv) => { try { sv.kill(); } catch (_) {} });
    tempRoots.forEach((r) => { try { fs.rmSync(r, { recursive: true, force: true }); } catch (_) {} });
  };
  process.on('exit', cleanup);
  for (let i = 0; i < 200; i++) {
    if (spawnSync('curl', ['-fsS', `http://127.0.0.1:${port}/world-builder.html`], { stdio: 'ignore' }).status === 0) break;
    spawnSync('sleep', ['0.05']);
  }

  const targets = await waitForJson(`http://127.0.0.1:${devPort}/json/list`, 15000);
  const page = targets.find((t) => t.type === 'page');
  const cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const state = () => cdp.eval('WB.state()');
  async function waitFor(expr, ms = 20000) {
    const end = Date.now() + ms;
    while (Date.now() < end) { try { if (await cdp.eval(expr)) return true; } catch (_) {} await sleep(80); }
    throw new Error('timeout waiting for ' + expr + '\n' + cdp.logs.join('\n'));
  }
  async function load(base = `http://127.0.0.1:${port}`) {
    await cdp.send('Page.navigate', { url: `${base}/world-builder.html` });
    await sleep(300);
    await waitFor("document.body && (document.body.getAttribute('data-wb-ready') === '1' || !!document.getElementById('wb-fatal'))");
    const fatal = await cdp.eval("document.getElementById('wb-fatal') && document.getElementById('wb-fatal').textContent");
    if (fatal) throw new Error(fatal);
    await waitFor('WB.state().momentsLoaded');
  }
  async function shot(name, dir = OUT) {
    await sleep(120);
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const file = path.join(dir, name);
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    console.log('  shot ' + path.relative(ROOT, file));
    return file;
  }
  async function clickTile(tx, ty) {
    const p = await cdp.eval(`WB.tileToClient(${tx}, ${ty})`);
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
      await cdp.send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });
    }
    await sleep(60);
  }
  async function clickAction(action) {
    const ok = await cdp.eval(`(() => { const b = document.querySelector('[data-action="${action}"]'); if (!b || b.disabled) return false; b.click(); return true; })()`);
    if (!ok) throw new Error('button not clickable: ' + action);
    await sleep(60);
  }
  async function setSelect(id, value) {
    await cdp.eval(`(() => { const s = document.getElementById('${id}'); s.value = ${JSON.stringify(value)}; s.dispatchEvent(new Event('change')); })()`);
    await sleep(80);
  }
  async function setInput(id, value) {
    await cdp.eval(`(() => { const s = document.getElementById('${id}'); s.value = ${JSON.stringify(String(value))}; s.dispatchEvent(new Event('change')); })()`);
    await sleep(80);
  }
  async function pressUndo() {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'z', code: 'KeyZ', modifiers: 2, windowsVirtualKeyCode: 90 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'z', code: 'KeyZ', modifiers: 2, windowsVirtualKeyCode: 90 });
    await sleep(80);
  }
  async function typeInput(id, value) {
    await cdp.eval(`(() => { const s = document.getElementById('${id}'); s.value = ${JSON.stringify(String(value))}; s.dispatchEvent(new Event('input')); })()`);
    await sleep(80);
  }
  async function pressKey(key, code, vk) {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
    await sleep(80);
  }
  const text = (id) => cdp.eval(`(() => { const e = document.getElementById('${id}'); return e ? e.innerText : null; })()`);
  const enabled = (action) => cdp.eval(`(() => { const b = document.querySelector('[data-action="${action}"]'); return !!b && !b.disabled; })()`);
  const registryRecord = (id) => JSON.parse(fs.readFileSync(REGISTRY, 'utf8')).connections.find((c) => c.id === id);

  // Shared workflow for cases 1 and 2.
  async function editWorkflow(n, scene, connId, sideName) {
    console.log(`\ncase ${n}: ${connId} endpoint ${sideName}`);
    await load();
    const rec = registryRecord(connId);
    const ep = rec[sideName];
    await setSelect('wb-scene', scene);
    await clickTile(ep.spawn.tx, ep.spawn.ty);
    let s = await state();
    check(`case ${n}: click on spawn selects connection-endpoint:${connId}:${sideName}`, s.selectedId === `connection-endpoint:${connId}:${sideName}`, s.selectedId);
    const inspector = await cdp.eval("document.getElementById('wb-inspector').innerText");
    check(`case ${n}: inspector shows CONNECTION/ENDPOINT/SCENE/TRIGGERS/SPAWN/FACING/PAIRED`,
      ['CONNECTION', 'ENDPOINT', 'SCENE', 'TRIGGERS', 'SPAWN x/y', 'FACING', 'PAIRED ENDPOINT'].every((k) => inspector.includes(k)) && inspector.includes(connId), inspector);
    const before = await shot(`case${n}-before.png`);

    await clickAction('mode-edit');
    await clickAction('move-spawn');
    s = await state();
    check(`case ${n}: MOVE SPAWN arms a pending tile pick`, s.pending === 'move-spawn', s.pending);
    await clickTile(8, 8);
    await setSelect('wb-facing', 'left');
    await clickAction('add-trigger');
    await clickTile(8, 9);
    s = await state();
    const d = s.draft[connId][sideName];
    check(`case ${n}: draft spawn is 8,8 facing left`, d.spawn.tx === 8 && d.spawn.ty === 8 && d.spawn.dir === 'left', d.spawn);
    check(`case ${n}: draft has trigger 8,9 appended`, JSON.stringify(d.triggers[d.triggers.length - 1]) === '[8,9]' && d.triggers.length === ep.triggers.length + 1, d.triggers);
    check(`case ${n}: selection is the new trigger id`, s.selectedId === `trigger:${connId}:${sideName}:${ep.triggers.length}`, s.selectedId);
    check(`case ${n}: header counts 1 unsaved change`, (await cdp.eval("document.getElementById('wb-title').textContent")) === 'WORLD BUILDER · 1 unsaved change');
    await clickAction('export');
    s = await state();
    const draftShot = await shot(`case${n}-draft.png`);
    check(`case ${n}: world/connections.json unchanged`, sha() === shaStart);
    return { s, before, draftShot, ep };
  }

  try {
   if (!ONLY_M8 && !ONLY_M10B) {
    // ---------------- case 1
    {
      const { s } = await editWorkflow(1, 'diner', 'double-r-front-entrance', 'b');
      // 8,9 in the diner is the wall row ('i'): the runtime validator rejects it and export must block.
      const errs = s.errors['double-r-front-entrance'] || [];
      check('case 1: runtime validator rejects trigger 8,9 (diner wall) verbatim', errs.includes('b.triggers[2] must be walkable'), errs);
      check('case 1: export blocked with visible warning', s.exportBlocked && !!(await cdp.eval("!!document.getElementById('wb-export-blocked')")));
      await shot('case1-export-blocked.png');
      await pressUndo();
      const u = await state();
      check('case 1: Ctrl+Z removes the added trigger, spawn edit stays', u.draft['double-r-front-entrance'].b.triggers.length === 2 && u.draft['double-r-front-entrance'].b.spawn.tx === 8 && Object.keys(u.errors).length === 0, u.draft['double-r-front-entrance'].b);
      const text = await cdp.eval("document.getElementById('wb-export-text') && document.getElementById('wb-export-text').value");
      const cs = text ? JSON.parse(text) : null;
      check('case 1: export textarea holds only double-r-front-entrance', cs && cs.operations.length === 1 && cs.operations[0].id === 'double-r-front-entrance' && cs.operations[0].endpoints.join() === 'b', cs);
      await shot('case1-export.png');
      await clickAction('revert-all');
      const r = await state();
      check('case 1: REVERT ALL clears drafts', r.unsaved === 0, r.unsaved);
      check('case 1: world/connections.json unchanged', sha() === shaStart);
    }

    // ---------------- case 2
    {
      const { s } = await editWorkflow(2, 'sheriffs_station_exterior', 'sheriffs-station-front-entrance', 'a');
      check('case 2: draft valid', Object.keys(s.errors).length === 0, s.errors);
      const text = await cdp.eval("document.getElementById('wb-export-text') && document.getElementById('wb-export-text').value");
      const cs = text ? JSON.parse(text) : null;
      const op = cs && cs.operations[0];
      check('case 2: export textarea has exactly the edited connection',
        cs && cs.operations.length === 1 && op.id === 'sheriffs-station-front-entrance' && op.connection.a.spawn.dir === 'left' &&
        JSON.stringify(op.connection.a.triggers) === '[[7,6],[8,6],[8,9]]', cs);
      fs.writeFileSync(path.join(OUT, 'case2-changeset.json'), text || '');
      await shot('case2-export.png');
      // drafts survive a scene switch; jump selects the pair
      await setSelect('wb-scene', 'town');
      await setSelect('wb-scene', 'sheriffs_station_exterior');
      await clickTile(8, 8);
      let j = await state();
      check('case 2: draft survives scene switch and moved spawn stays selectable by id', j.unsaved === 1 && j.selectedId === 'connection-endpoint:sheriffs-station-front-entrance:a', j);
      await clickAction('jump');
      j = await state();
      check('case 2: jump switches to paired scene and selects endpoint b', j.sceneId === 'sheriff' && j.selectedId === 'connection-endpoint:sheriffs-station-front-entrance:b', j);
      check('case 2: world/connections.json unchanged', sha() === shaStart);
    }

    // ---------------- case 3
    {
      console.log('\ncase 3: invalid spawn x=19 on diner');
      await load();
      await setSelect('wb-scene', 'diner');
      await clickTile(6, 8);
      await clickAction('mode-edit');
      await setInput('wb-spawn-x', 19);
      await clickAction('export');
      const s = await state();
      const errs = s.errors['double-r-front-entrance'] || [];
      check('case 3: error text lists out-of-bounds spawn verbatim', errs.includes('b.spawn is outside map bounds'), errs);
      const errText = await cdp.eval("document.getElementById('wb-validation').innerText");
      check('case 3: validation panel shows the error', errText.includes('b.spawn is outside map bounds'), errText);
      check('case 3: export blocked', s.exportBlocked && !(await cdp.eval("!!document.getElementById('wb-export-text')")));
      const red = await cdp.eval(`(() => { const c = document.getElementById('wb-canvas'); const p = WB.tileToClient(13, 8); const r = c.getBoundingClientRect();
        const k = c.width / r.width; const d = c.getContext('2d').getImageData(Math.round((p.x - r.left) * k), Math.round((p.y - r.top) * k) + 6, 1, 1).data; return [d[0], d[1], d[2]]; })()`);
      check('case 3: invalid spawn marker drawn red at the clamped edge tile', red[0] > 180 && red[1] < 90 && red[2] < 90, red);
      await shot('case3-invalid.png');
      check('case 3: world/connections.json unchanged', sha() === shaStart);
    }

    // ---------------- case 4
    {
      console.log('\ncase 4: story moment ACT4_EVENING_GATHERING');
      await load();
      await setSelect('wb-scene', 'diner');
      let s = await state();
      check('case 4: baseline diner has norma + shelly', s.npcIds.includes('norma') && s.npcIds.includes('shelly'), s.npcIds);
      await setSelect('wb-moment', 'ACT4_EVENING_GATHERING');
      s = await state();
      check('case 4: diner at ACT4_EVENING_GATHERING has no norma/shelly', s.momentKey === 'ACT4_EVENING_GATHERING' && !s.npcIds.includes('norma') && !s.npcIds.includes('shelly'), s.npcIds);
      await shot('case4-diner.png');
      await setSelect('wb-scene', 'roadhouse');
      s = await state();
      check('case 4: roadhouse at ACT4_EVENING_GATHERING has norma + shelly', s.npcIds.includes('norma') && s.npcIds.includes('shelly'), s.npcIds);
      // M5: the roadhouse doors are registry items (town-roadhouse endpoint b), no longer read-only legacy doors
      const legacy = s.items.filter((i) => i.kind === 'legacy-door');
      const roadTriggers = s.items.filter((i) => i.kind === 'trigger' && /^trigger:town-roadhouse:b:\d+$/.test(i.id));
      check('case 4: roadhouse doors are town-roadhouse registry triggers, no legacy-door items', legacy.length === 0 && roadTriggers.length === 2, s.items);
      await clickTile(roadTriggers[0].tx, roadTriggers[0].ty);
      const insp = await cdp.eval("document.getElementById('wb-inspector').innerText");
      check('case 4: roadhouse door inspector names town-roadhouse, paired with town', insp.includes('town-roadhouse') && insp.includes('PAIRED ENDPOINT') && insp.includes('town'), insp);
      await setSelect('wb-scene', 'roadhouse');
      await clickTile(5, 6);
      await shot('case4-roadhouse.png');
      check('case 4: world/connections.json unchanged', sha() === shaStart);
    }

    // ---------------- case 5 (M5): edit a migrated classic door and export it
    {
      console.log('\ncase 5: town-roadhouse endpoint b spawn');
      await load();
      const rec = registryRecord('town-roadhouse');
      await setSelect('wb-scene', 'roadhouse');
      await clickTile(rec.b.spawn.tx, rec.b.spawn.ty);
      let s = await state();
      check('case 5: click on roadhouse spawn selects connection-endpoint:town-roadhouse:b', s.selectedId === 'connection-endpoint:town-roadhouse:b', s.selectedId);
      const insp = await cdp.eval("document.getElementById('wb-inspector').innerText");
      check('case 5: inspector shows a paired record with its town door flag endpoint', insp.includes('paired') && insp.includes('town-roadhouse') && insp.includes('a · town @ 47,29 down'), insp);
      await shot('case5-before.png');
      await clickAction('mode-edit');
      await clickAction('move-spawn');
      await clickTile(6, 8);
      s = await state();
      const d = s.draft['town-roadhouse'];
      check('case 5: draft b.spawn is 6,8 up, triggers untouched', d.b.spawn.tx === 6 && d.b.spawn.ty === 8 && d.b.spawn.dir === 'up' && JSON.stringify(d.b.triggers) === JSON.stringify(rec.b.triggers), d.b);
      check('case 5: draft valid, 1 unsaved change', Object.keys(s.errors).length === 0 && s.unsaved === 1, s);
      await clickAction('export');
      const text = await cdp.eval("document.getElementById('wb-export-text') && document.getElementById('wb-export-text').value");
      const cs = text ? JSON.parse(text) : null;
      const op = cs && cs.operations[0];
      check('case 5: export holds only town-roadhouse endpoint b; a keeps atto4/roadhouse_chiuso',
        cs && cs.operations.length === 1 && op.id === 'town-roadhouse' && op.endpoints.join() === 'b' &&
        JSON.stringify(op.connection.b.spawn) === '{"tx":6,"ty":8,"dir":"up"}' && JSON.stringify(op.connection.a) === JSON.stringify(rec.a), cs);
      const csFile = path.join(OUT, 'case5-changeset.json');
      fs.writeFileSync(csFile, text || '');
      await shot('case5-export.png');
      const cli = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'world-apply.js'), csFile, '--dry-run'], { encoding: 'utf8' });
      check('case 5: tools/world-apply.js --dry-run accepts the exported changeset', cli.status === 0 && cli.stdout.includes('VALID 15 record(s)') && cli.stdout.includes('TARGET world/connections.json :: town-roadhouse') && cli.stdout.includes('DRY-RUN 1 endpoint change'), cli.stdout + cli.stderr);
      check('case 5: world/connections.json unchanged', sha() === shaStart);
    }

    // ---------------- case 6 (M5): one-way record
    {
      console.log('\ncase 6: one-way arrival-town');
      await load();
      await setSelect('wb-scene', 'arrival');
      await clickTile(4, 8);
      let s = await state();
      check('case 6: arrival 4,8 selects trigger:arrival-town:a:0', s.selectedId === 'trigger:arrival-town:a:0', s.selectedId);
      check('case 6: one-way source has no endpoint item in arrival', !s.items.some((i) => i.id === 'connection-endpoint:arrival-town:a'), s.items);
      let dirText = await cdp.eval("document.getElementById('wb-direction').textContent");
      check('case 6: inspector shows ONE-WAY arrival → town', dirText === 'ONE-WAY arrival → town', dirText);
      await clickAction('mode-edit');
      check('case 6: one-way source offers no MOVE SPAWN', !(await cdp.eval("!!document.querySelector('[data-action=\"move-spawn\"]')")));
      await shot('case6-arrival-source.png');
      await clickAction('jump');
      s = await state();
      check('case 6: jump lands on town endpoint b', s.sceneId === 'town' && s.selectedId === 'connection-endpoint:arrival-town:b', s);
      await clickTile(30, 33);
      s = await state();
      check('case 6: town 30,33 selects connection-endpoint:arrival-town:b', s.selectedId === 'connection-endpoint:arrival-town:b', s.selectedId);
      const noAdd = await cdp.eval("!document.querySelector('[data-action=\"add-trigger\"]') && !!document.getElementById('wb-oneway-note')");
      check('case 6: endpoint b of a one-way record offers no ADD TRIGGER', noAdd);
      await shot('case6-town-arrival.png');
      check('case 6: world/connections.json unchanged', sha() === shaStart);
    }

    // ---------------- case 7 (M5): no legacy doors anywhere
    {
      console.log('\ncase 7: legacy door count in every scene header');
      await load();
      const scenes = await cdp.eval("Array.from(document.getElementById('wb-scene').options).map((o) => o.value)");
      const bad = [];
      for (const sc of scenes) {
        await setSelect('wb-scene', sc);
        const info = await cdp.eval("document.getElementById('wb-stage-info').textContent");
        if (!/ · legacy doors 0 · /.test(info)) bad.push(sc + ': ' + info);
      }
      check('case 7: every scene header reports legacy doors 0 (' + scenes.length + ' scenes)', scenes.length >= 15 && bad.length === 0, bad);
      await setSelect('wb-scene', 'town');
      await shot('case7-town-header.png');
    }

    // ---------------- case 8 (M6): create a paired connection
    let case8File = null;
    {
      console.log('\ncase 8: NEW CONNECTION paired town <-> hospital');
      await load();
      await clickAction('mode-edit');
      await clickAction('new-connection');
      await setSelect('wb-scene', 'town');
      let s = await state();
      check('case 8: NEW CONNECTION waits for the scene A tile', s.creating && s.creating.step === 'a' && (await text('wb-create-step')).includes('scene A'), s.creating);
      await clickTile(30, 9);
      s = await state();
      check('case 8: tile A recorded, waiting for B', s.creating.step === 'b' && JSON.stringify(s.creating.a) === '{"scene":"town","tx":30,"ty":9}', s.creating);
      await setSelect('wb-scene', 'hospital');
      await clickTile(14, 9);
      s = await state();
      check('case 8: id prefilled <sceneA>-<sceneB>', s.creating.step === 'confirm' && s.creating.id === 'town-hospital' && (await cdp.eval("document.getElementById('wb-create-id').value")) === 'town-hospital', s.creating);
      check('case 8: candidate spawns default to the tile in front of each trigger',
        JSON.stringify(s.creating.candidate.a) === '{"scene":"town","triggers":[[30,9]],"spawn":{"tx":30,"ty":10,"dir":"down"}}' &&
        JSON.stringify(s.creating.candidate.b) === '{"scene":"hospital","triggers":[[14,9]],"spawn":{"tx":13,"ty":9,"dir":"left"}}', s.creating.candidate);
      check('case 8: prefilled id collides with the registry, CONFIRM disabled', s.creating.errors.includes('connection id "town-hospital" already exists in the registry') && !(await enabled('create-confirm')), s.creating.errors);
      await shot('case8-id-collision.png');
      await typeInput('wb-create-id', 'Town Side');
      s = await state();
      check('case 8: live validation flags a non-kebab id', s.creating.errors.some((e) => /kebab-case/.test(e)) && !(await enabled('create-confirm')), s.creating.errors);
      await typeInput('wb-create-id', SIDE_DOOR);
      s = await state();
      check('case 8: edited id is valid, CONFIRM enabled', s.creating.errors.length === 0 && (await enabled('create-confirm')) && !!(await cdp.eval("!!document.getElementById('wb-create-valid')")), s.creating.errors);
      await clickAction('create-move-spawn-b');
      await clickTile(12, 9);
      s = await state();
      check('case 8: MOVE SPAWN b on the candidate -> 12,9 left, still valid', JSON.stringify(s.creating.candidate.b.spawn) === '{"tx":12,"ty":9,"dir":"left"}' && s.creating.errors.length === 0, s.creating);
      await shot('case8-create-confirm.png');
      check('case 8: world/connections.json unchanged before confirm', sha() === shaStart);
      await clickAction('create-confirm');
      s = await state();
      const expected = { id: SIDE_DOOR, a: { scene: 'town', triggers: [[30, 9]], spawn: { tx: 30, ty: 10, dir: 'down' } },
        b: { scene: 'hospital', triggers: [[14, 9]], spawn: { tx: 12, ty: 9, dir: 'left' } } };
      check('case 8: CONFIRM puts the record in the draft store', !s.creating && JSON.stringify(s.draft[SIDE_DOOR]) === JSON.stringify(expected), s.draft[SIDE_DOOR]);
      check('case 8: Builder shows the new record at once (town trigger + spawn items, selected)', s.sceneId === 'town' && s.selectedId === `connection-endpoint:${SIDE_DOOR}:a` &&
        s.items.some((i) => i.id === `trigger:${SIDE_DOOR}:a:0` && i.tx === 30 && i.ty === 9) && s.items.some((i) => i.id === `connection-endpoint:${SIDE_DOOR}:a` && i.tx === 30 && i.ty === 10), s.items.filter((i) => i.id.includes(SIDE_DOOR)));
      const insp = await text('wb-inspector');
      check('case 8: inspector marks the record new (create), paired', insp.includes('new (create)') && insp.includes('paired') && insp.includes(SIDE_DOOR), insp);
      check('case 8: header counts 1 unsaved change, legacy doors 0', (await text('wb-title')) === 'WORLD BUILDER · 1 unsaved change' && / · legacy doors 0 · /.test(await text('wb-stage-info')));
      check('case 8: validation lists "create" and the draft is valid', JSON.stringify(s.ops) === JSON.stringify([{ id: SIDE_DOOR, op: 'create' }]) && Object.keys(s.errors).length === 0, s);
      await shot('case8-created-town.png');
      await pressUndo();
      s = await state();
      check('case 8: Ctrl+Z removes the created record', !s.draft[SIDE_DOOR] && s.unsaved === 0 && s.canRedo, s.unsaved);
      await clickAction('redo');
      s = await state();
      check('case 8: REDO brings it back', JSON.stringify(s.draft[SIDE_DOOR]) === JSON.stringify(expected) && s.unsaved === 1, s.draft[SIDE_DOOR]);
      await setSelect('wb-scene', 'hospital');
      s = await state();
      check('case 8: hospital shows endpoint b of the new record', s.items.some((i) => i.id === `trigger:${SIDE_DOOR}:b:0`) && s.items.some((i) => i.id === `connection-endpoint:${SIDE_DOOR}:b` && i.tx === 12 && i.ty === 9), s.items);
      await shot('case8-created-hospital.png');
      await clickAction('export');
      const exported = await cdp.eval("document.getElementById('wb-export-text') && document.getElementById('wb-export-text').value");
      const cs = exported ? JSON.parse(exported) : null;
      check('case 8: export is a version-2 changeset with one create op', cs && cs.version === 2 && cs.operations.length === 1 && cs.operations[0].op === 'create' &&
        cs.operations[0].id === SIDE_DOOR && JSON.stringify(cs.operations[0].connection) === JSON.stringify(expected), cs);
      case8File = path.join(OUT, 'case8-changeset.json');
      fs.writeFileSync(case8File, exported || '');
      await shot('case8-export.png');
      const cli = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'world-apply.js'), case8File, '--dry-run'], { encoding: 'utf8' });
      fs.writeFileSync(path.join(OUT, 'case8-dry-run.txt'), cli.stdout + cli.stderr);
      check('case 8: world-apply --dry-run prints VALID 16 record(s)', cli.status === 0 && cli.stdout.includes('VALID 16 record(s) against real maps') && cli.stdout.includes('CREATE ' + SIDE_DOOR + ' (paired)'), cli.stdout + cli.stderr);
      check('case 8: dry-run prints the catalog diff for town + hospital', cli.stdout.includes('CATALOG js/world-catalog.js create ' + SIDE_DOOR + ' -> town + hospital') &&
        cli.stdout.includes("+         connections: ['town-hospital', '" + SIDE_DOOR + "']") && cli.stdout.includes("'arrival-town', '" + SIDE_DOOR + "']") && cli.stdout.includes('DRY-RUN'), cli.stdout);
      check('case 8: real registry + catalog unchanged', sha() === shaStart && sha(CATALOG) === catalogShaStart);
    }

    // ---------------- case 9 (M6): create a one-way connection
    {
      console.log('\ncase 9: NEW CONNECTION one-way town -> hospital');
      await load();
      await clickAction('mode-edit');
      await clickAction('new-connection');
      await setSelect('wb-scene', 'town');
      await clickTile(34, 9);
      await setSelect('wb-scene', 'hospital');
      await clickTile(1, 9);
      await clickAction('create-one-way');
      await typeInput('wb-create-id', DROP);
      let s = await state();
      check('case 9: ONE-WAY candidate: a trigger only, b spawn only', s.creating.oneWay && JSON.stringify(s.creating.candidate) ===
        JSON.stringify({ id: DROP, one_way: true, a: { scene: 'town', triggers: [[34, 9]] }, b: { scene: 'hospital', triggers: [], spawn: { tx: 2, ty: 9, dir: 'right' } } }) && s.creating.errors.length === 0, s.creating);
      check('case 9: candidate offers MOVE SPAWN for b only', !(await cdp.eval("!!document.querySelector('[data-action=\"create-move-spawn-a\"]')")) && (await enabled('create-move-spawn-b')));
      await shot('case9-create-one-way.png');
      await clickAction('create-confirm');
      s = await state();
      check('case 9: confirmed one-way record selected by its a trigger', s.draft[DROP] && s.draft[DROP].one_way === true && s.draft[DROP].a.spawn === undefined && s.selectedId === `trigger:${DROP}:a:0`, s);
      check('case 9: no spawn item for a in town', !s.items.some((i) => i.id === `connection-endpoint:${DROP}:a`) && s.items.some((i) => i.id === `trigger:${DROP}:a:0`), s.items);
      const dirText = await cdp.eval("document.getElementById('wb-direction').textContent");
      check('case 9: inspector shows ONE-WAY town → hospital', dirText === 'ONE-WAY town → hospital', dirText);
      check('case 9: one-way source offers no MOVE SPAWN', !(await cdp.eval("!!document.querySelector('[data-action=\"move-spawn\"]')")));
      await shot('case9-one-way-source.png');
      await clickAction('jump');
      s = await state();
      check('case 9: jump lands on hospital endpoint b', s.sceneId === 'hospital' && s.selectedId === `connection-endpoint:${DROP}:b`, s);
      check('case 9: endpoint b offers no ADD TRIGGER', await cdp.eval("!document.querySelector('[data-action=\"add-trigger\"]') && !!document.getElementById('wb-oneway-note')"));
      await shot('case9-one-way-arrival.png');
      await clickAction('export');
      const cs = JSON.parse(await cdp.eval("document.getElementById('wb-export-text').value"));
      check('case 9: export carries the one-way create', cs.version === 2 && cs.operations.length === 1 && cs.operations[0].op === 'create' && cs.operations[0].connection.one_way === true, cs);
      fs.writeFileSync(path.join(OUT, 'case9-changeset.json'), JSON.stringify(cs, null, 2) + '\n');
      check('case 9: world/connections.json unchanged', sha() === shaStart);
    }

    // ---------------- case 10 (M6): delete, on a temp repo copy after a real apply
    {
      console.log('\ncase 10: DELETE CONNECTION on a temp copy');
      const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-wb-m6-copy-'));
      tempRoots.push(copy);
      for (const d of ['js', 'test', 'world', 'narrative']) fs.cpSync(path.join(ROOT, d), path.join(copy, d), { recursive: true });
      for (const f of ['index.html', 'world-builder.html']) fs.copyFileSync(path.join(ROOT, f), path.join(copy, f));
      fs.symlinkSync(path.join(ROOT, 'assets'), path.join(copy, 'assets'));
      const three = () => ['world/connections.json', 'js/world-connections.gen.js', 'js/world-catalog.js'].map((rel) => fs.readFileSync(path.join(copy, rel)));
      const original = three();
      const applyCreate = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'world-apply.js'), case8File, '--root=' + copy], { encoding: 'utf8' });
      fs.writeFileSync(path.join(OUT, 'case10-apply-create.txt'), applyCreate.stdout + applyCreate.stderr);
      check('case 10: case 8 changeset applied for real on the copy', applyCreate.status === 0 && applyCreate.stdout.includes('WROTE js/world-catalog.js') && applyCreate.stdout.includes('CHECK WORLD-ENGINE-V0.1-CATALOG-PASS') &&
        JSON.parse(fs.readFileSync(path.join(copy, 'world', 'connections.json'), 'utf8')).connections.length === 16, applyCreate.stdout + applyCreate.stderr);

      const copyPort = await freePort();
      const sv = spawn('python3', ['-m', 'http.server', String(copyPort), '--bind', '127.0.0.1', '--directory', copy], { stdio: 'ignore' });
      extraServers.push(sv);
      for (let i = 0; i < 200; i++) {
        if (spawnSync('curl', ['-fsS', `http://127.0.0.1:${copyPort}/world-builder.html`], { stdio: 'ignore' }).status === 0) break;
        spawnSync('sleep', ['0.05']);
      }
      await load(`http://127.0.0.1:${copyPort}`);
      await setSelect('wb-scene', 'town');
      let s = await state();
      check('case 10: Builder on the copy loads the applied record from the registry', s.items.some((i) => i.id === `trigger:${SIDE_DOOR}:a:0`) && s.unsaved === 0 && / · legacy doors 0 · /.test(await text('wb-stage-info')), s.items.filter((i) => i.id.includes(SIDE_DOOR)));
      await clickTile(30, 10);
      await clickAction('mode-edit');
      s = await state();
      check('case 10: its town spawn selects the endpoint', s.selectedId === `connection-endpoint:${SIDE_DOOR}:a`, s.selectedId);
      await shot('case10-before-delete.png');
      await clickAction('delete-connection');
      s = await state();
      check('case 10: DELETE CONNECTION asks for confirmation first', s.confirmDelete === SIDE_DOOR && !!s.draft[SIDE_DOOR] && (await text('wb-delete-confirm')).includes('Delete ' + SIDE_DOOR), s.confirmDelete);
      await shot('case10-delete-confirm.png');
      await clickAction('delete-cancel');
      s = await state();
      check('case 10: CANCEL keeps the record', !s.confirmDelete && !!s.draft[SIDE_DOOR] && s.unsaved === 0, s);
      await clickAction('delete-connection');
      await clickAction('delete-confirm');
      s = await state();
      check('case 10: CONFIRM DELETE drops the record from the draft and the canvas', !s.draft[SIDE_DOOR] && !s.items.some((i) => i.id.includes(SIDE_DOOR)) && s.selectedId === null, s.items.filter((i) => i.id.includes(SIDE_DOOR)));
      check('case 10: validation lists "delete", draft valid, legacy doors 0', JSON.stringify(s.ops) === JSON.stringify([{ id: SIDE_DOOR, op: 'delete' }]) && Object.keys(s.errors).length === 0 && / · legacy doors 0 · /.test(await text('wb-stage-info')), s);
      await shot('case10-deleted.png');
      await pressUndo();
      s = await state();
      check('case 10: Ctrl+Z restores the deleted record', !!s.draft[SIDE_DOOR] && s.unsaved === 0, s.unsaved);
      await clickAction('redo');
      await clickAction('export');
      const exported = await cdp.eval("document.getElementById('wb-export-text') && document.getElementById('wb-export-text').value");
      const cs = exported ? JSON.parse(exported) : null;
      check('case 10: export is a version-2 delete op', cs && cs.version === 2 && JSON.stringify(cs.operations) === JSON.stringify([{ op: 'delete', id: SIDE_DOOR }]), cs);
      const delFile = path.join(OUT, 'case10-changeset.json');
      fs.writeFileSync(delFile, exported || '');
      await shot('case10-export.png');
      const applyDelete = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'world-apply.js'), delFile, '--root=' + copy], { encoding: 'utf8' });
      fs.writeFileSync(path.join(OUT, 'case10-apply-delete.txt'), applyDelete.stdout + applyDelete.stderr);
      check('case 10: world-apply deletes on the copy (catalog diff + catalog check)', applyDelete.status === 0 && applyDelete.stdout.includes('VALID 15 record(s)') &&
        applyDelete.stdout.includes("-         connections: ['town-hospital', '" + SIDE_DOOR + "']") && applyDelete.stdout.includes('CHECK WORLD-ENGINE-V0.1-CATALOG-PASS'), applyDelete.stdout + applyDelete.stderr);
      const cat = spawnSync(process.execPath, [path.join(copy, 'test', 'world-engine-v0.1-catalog.js')], { cwd: copy, encoding: 'utf8' });
      check('case 10: node test/world-engine-v0.1-catalog.js green on the copy', cat.status === 0 && cat.stdout.includes('WORLD-ENGINE-V0.1-CATALOG-PASS'), cat.stdout + cat.stderr);
      const inv = spawnSync(process.execPath, [path.join(copy, 'test', 'legacy-door-inventory.js')], { cwd: copy, encoding: 'utf8' });
      check('case 10: node test/legacy-door-inventory.js green on the copy', inv.status === 0 && inv.stdout.includes('LEGACY-DOOR-INVENTORY-PASS sources=0 live=0 shadowed=0 conflict=0'), inv.stdout + inv.stderr);
      fs.writeFileSync(path.join(OUT, 'case10-copy-checks.txt'), cat.stdout.trim().split('\n').pop() + '\n' + inv.stdout.trim().split('\n').pop() + '\n');
      check('case 10: copy registry, gen and catalog are byte-identical to before the create', three().every((b, i) => b.equals(original[i])));
      check('case 10: real repo world/connections.json and js/world-catalog.js hashes unchanged', sha() === shaStart && sha(CATALOG) === catalogShaStart);
    }

    // ---------------- case 11 (M7): door gating fields + PAIRED -> ONE-WAY
    {
      console.log('\ncase 11: door fields + CONVERT TO ONE-WAY on great-northern-room-315-hall');
      await load();
      const HALL = 'great-northern-room-315-hall';
      const orig = registryRecord(HALL);
      await setSelect('wb-scene', 'room_315');
      await clickTile(orig.a.spawn.tx, orig.a.spawn.ty);
      let s = await state();
      check('case 11: VIEW inspector shows the endpoint ungated', s.selectedId === `connection-endpoint:${HALL}:a` && (await text('wb-door')) === 'ungated', s.selectedId);
      await clickAction('mode-edit');
      check('case 11: EDIT shows the three door fields', await cdp.eval("['needsFlag','blockedMsg','needsClues'].every((k) => !!document.getElementById('wb-door-' + k))"));
      await setInput('wb-door-needsFlag', 'atto3');
      await setInput('wb-door-needsClues', '2');
      s = await state();
      check('case 11: needsFlag + needsClues land on endpoint a as an upsert', JSON.stringify(s.draft[HALL].a.door) === '{"needsFlag":"atto3","needsClues":2}' && JSON.stringify(s.ops) === JSON.stringify([{ id: HALL, op: 'upsert' }]) && Object.keys(s.errors).length === 0, s.draft[HALL].a);
      await setInput('wb-door-needsClues', '0');
      s = await state();
      check('case 11: needsClues 0 refused with a message, draft unchanged', /needsClues must be an integer >= 1/.test(s.notice || '') && s.draft[HALL].a.door.needsClues === 2, s.notice);
      await shot('case11-door-fields.png', OUT7);
      await setInput('wb-door-needsClues', '');
      s = await state();
      check('case 11: clearing a field removes the key', JSON.stringify(s.draft[HALL].a.door) === '{"needsFlag":"atto3"}', s.draft[HALL].a);
      await setInput('wb-door-needsFlag', '');
      s = await state();
      check('case 11: clearing the last field removes door and the draft', !('door' in s.draft[HALL].a) && s.unsaved === 0, s.draft[HALL].a);

      await clickAction('convert-one-way');
      s = await state();
      check('case 11: CONVERT TO ONE-WAY lists what it drops and is valid', s.converting && s.converting.to === 'one-way' && s.converting.errors.length === 0 &&
        JSON.stringify(s.converting.dropped) === JSON.stringify([`a.spawn ${orig.a.spawn.tx},${orig.a.spawn.ty} ${orig.a.spawn.dir}`, `b.triggers ${orig.b.triggers.map((t) => t.join(',')).join(' ')}`]) && (await enabled('convert-confirm')), s.converting);
      check('case 11: world/connections.json unchanged before confirm', sha() === shaStart);
      await shot('case11-convert-one-way.png', OUT7);
      await clickAction('convert-confirm');
      s = await state();
      const ow = s.draft[HALL];
      check('case 11: CONFIRM makes the record one-way in the draft', !s.converting && ow.one_way === true && !ow.a.spawn && ow.b.triggers.length === 0 && JSON.stringify(ow.b.spawn) === JSON.stringify(orig.b.spawn) && Object.keys(s.errors).length === 0, ow);
      const insp = await text('wb-inspector');
      check('case 11: inspector shows ONE-WAY room_315 → hotel_gn at once', insp.includes('ONE-WAY room_315 → hotel_gn') && !s.items.some((i) => i.id === `connection-endpoint:${HALL}:a`), insp);
      await shot('case11-one-way.png', OUT7);
      await clickAction('export');
      const exported = await cdp.eval("document.getElementById('wb-export-text').value");
      const cs = JSON.parse(exported);
      check('case 11: export is one upsert naming a and b', cs.version === 2 && cs.operations.length === 1 && cs.operations[0].op === 'upsert' && cs.operations[0].endpoints.join() === 'a,b' && cs.operations[0].connection.one_way === true, cs);
      const file = path.join(OUT7, 'case11-changeset.json');
      fs.writeFileSync(file, exported);
      const dry = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'world-apply.js'), file, '--dry-run'], { encoding: 'utf8' });
      fs.writeFileSync(path.join(OUT7, 'case11-dry-run.txt'), dry.stdout + dry.stderr);
      check('case 11: world-apply --dry-run VALID 15, catalog unchanged', dry.status === 0 && dry.stdout.includes('VALID 15 record(s)') && dry.stdout.includes('CATALOG js/world-catalog.js unchanged'), dry.stdout + dry.stderr);

      // two triggers on the arrival side: the author has to pick the source
      await clickAction('revert-all');
      await setSelect('wb-scene', 'diner');
      const dr = registryRecord('double-r-front-entrance');
      await clickTile(dr.b.spawn.tx, dr.b.spawn.ty);
      await clickAction('convert-one-way');
      s = await state();
      check('case 11: 2 triggers on b -> pick the source first, CONFIRM disabled', s.converting.needsChoice && /endpoint b of double-r-front-entrance has 2 triggers/.test(s.converting.errors[0]) && !(await enabled('convert-confirm')), s.converting);
      await shot('case11-pick-source.png', OUT7);
      await clickAction('convert-source-b');
      s = await state();
      check('case 11: source b keeps b triggers as the one-way source, CONFIRM enabled once valid', s.converting.record && s.converting.record.a.scene === 'diner' && s.converting.record.a.triggers.length === 2 && s.converting.errors.length === 0 && (await enabled('convert-confirm')), s.converting);
      await clickAction('convert-cancel');
      s = await state();
      check('case 11: CANCEL leaves the draft untouched', !s.converting && s.unsaved === 0, s.unsaved);
      check('case 11: world/connections.json unchanged', sha() === shaStart);
    }

    // ---------------- case 12 (M7): ONE-WAY -> PAIRED
    {
      console.log('\ncase 12: CONVERT TO PAIRED on arrival-town');
      await load();
      const AT = 'arrival-town';
      await setSelect('wb-scene', 'arrival');
      await clickTile(4, 8);
      await clickAction('mode-edit');
      let s = await state();
      check('case 12: one-way source trigger selected, CONVERT TO PAIRED offered', s.selectedId === `trigger:${AT}:a:0` && (await enabled('convert-paired')), s.selectedId);
      await clickAction('convert-paired');
      s = await state();
      check('case 12: CONFIRM disabled until a.spawn and b trigger are placed', s.converting.to === 'paired' && s.converting.errors.join('|') === 'place a.spawn in arrival|place a b trigger in town' && !(await enabled('convert-confirm')), s.converting);
      await clickAction('convert-place-a-spawn');
      await clickTile(4, 7);
      s = await state();
      check('case 12: a.spawn placed at arrival 4,7, still waiting for the b trigger', JSON.stringify(s.converting.aSpawn) === '{"tx":4,"ty":7}' && s.converting.errors.join('|') === 'place a b trigger in town' && !(await enabled('convert-confirm')), s.converting);
      await shot('case12-a-spawn-placed.png', OUT7);
      await clickAction('convert-place-b-trigger');
      s = await state();
      check('case 12: PLACE B TRIGGER switches to town', s.sceneId === 'town' && s.converting.placing === 'bTrigger', s.sceneId);
      await clickTile(29, 34);
      s = await state();
      check('case 12: both placed -> valid, CONFIRM enabled', JSON.stringify(s.converting.bTrigger) === '[29,34]' && s.converting.errors.length === 0 && (await enabled('convert-confirm')), s.converting);
      await shot('case12-b-trigger-placed.png', OUT7);
      check('case 12: world/connections.json unchanged before confirm', sha() === shaStart);
      await clickAction('convert-confirm');
      s = await state();
      const pr = s.draft[AT];
      check('case 12: CONFIRM makes arrival-town paired in the draft', !s.converting && !('one_way' in pr) && JSON.stringify(pr.a.spawn) === '{"tx":4,"ty":7,"dir":"up"}' && JSON.stringify(pr.b.triggers) === '[[29,34]]' && Object.keys(s.errors).length === 0, pr);
      check('case 12: inspector shows paired and the a spawn marker at once', (await text('wb-direction')) === 'paired' && s.sceneId === 'arrival' && s.items.some((i) => i.id === `connection-endpoint:${AT}:a` && i.tx === 4 && i.ty === 7), s.items);
      await shot('case12-paired.png', OUT7);
      await clickAction('export');
      const exported = await cdp.eval("document.getElementById('wb-export-text').value");
      const cs = JSON.parse(exported);
      check('case 12: export is one upsert naming a and b without one_way', cs.operations.length === 1 && cs.operations[0].op === 'upsert' && cs.operations[0].endpoints.join() === 'a,b' && !('one_way' in cs.operations[0].connection), cs);
      const file = path.join(OUT7, 'case12-changeset.json');
      fs.writeFileSync(file, exported);
      const dry = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'world-apply.js'), file, '--dry-run'], { encoding: 'utf8' });
      fs.writeFileSync(path.join(OUT7, 'case12-dry-run.txt'), dry.stdout + dry.stderr);
      check('case 12: world-apply --dry-run VALID 15', dry.status === 0 && dry.stdout.includes('VALID 15 record(s)') && dry.stdout.includes('DRY-RUN 2 endpoint change(s)'), dry.stdout + dry.stderr);
      await clickAction('undo');
      s = await state();
      check('case 12: UNDO restores the one-way record', s.draft[AT].one_way === true && s.unsaved === 0, s.draft[AT]);
      check('case 12: world/connections.json unchanged', sha() === shaStart);
    }

    // ---------------- case 13 (M7): move Truman inside his story window, export, dry-run
    const windowsSha = () => sha(path.join(ROOT, 'narrative', 'cast', 'windows.json'));
    const windowsShaStart = windowsSha();
    {
      console.log('\ncase 13: MOVE Truman at ACT3_TRAINCAR_REPORT');
      await load();
      await setSelect('wb-moment', 'ACT3_TRAINCAR_REPORT');
      await setSelect('wb-scene', 'traincar');
      await clickTile(9, 8);
      let s = await state();
      const truman = s.npcs.find((n) => n.characterId === 'truman');
      check('case 13: Truman resolves at traincar 9,8 through window ACT3_TRUMAN_REPORT (owner M5)', s.selectedId === 'npc:truman:traincar' && truman && truman.source === 'ACT3_TRUMAN_REPORT' && truman.owner === 'M5' && truman.editable, truman);
      check('case 13: inspector names the source window and owner', (await text('wb-npc-source')) === 'window ACT3_TRUMAN_REPORT · owner M5', await text('wb-npc-source'));
      check('case 13: VIEW offers no MOVE', !(await cdp.eval("!!document.querySelector('[data-action=\"move-npc\"]')")));
      await shot('case13-truman-view.png', OUT7);
      await clickAction('mode-edit');
      await clickAction('move-npc');
      s = await state();
      check('case 13: MOVE arms a tile pick for truman', s.pendingNpc && s.pendingNpc.character === 'truman' && s.pendingNpc.window === 'ACT3_TRUMAN_REPORT', s.pendingNpc);
      await clickTile(10, 8);
      s = await state();
      let t = s.npcs.find((n) => n.characterId === 'truman');
      check('case 13: Truman drawn at 10,8 at once, still selected, 1 unsaved change', t.tx === 10 && t.ty === 8 && s.selectedId === 'npc:truman:traincar' && s.unsaved === 1 && !s.pendingNpc, t);
      await pressKey('ArrowUp', 'ArrowUp', 38);
      s = await state();
      check('case 13: ArrowUp sets facing up', s.npcs.find((n) => n.characterId === 'truman').dir === 'up' && s.castOps[0].dir === 'up', s.castOps);
      await pressKey('ArrowRight', 'ArrowRight', 39);
      s = await state();
      check('case 13: ArrowRight sets facing back to right; one place op, x only', JSON.stringify(s.castOps) === JSON.stringify([{ op: 'place', window: 'ACT3_TRUMAN_REPORT', character: 'truman', map_id: 'traincar', x: 10, y: 8, dir: 'right' }]), s.castOps);
      check('case 13: validation lists the place op', (await text('wb-draft-ops')).includes('place ACT3_TRUMAN_REPORT / truman → traincar 10,8 right'), await text('wb-draft-ops'));
      await shot('case13-truman-moved.png', OUT7);
      await pressUndo();
      s = await state();
      check('case 13: Ctrl+Z undoes the facing change', s.castOps[0].dir === 'up', s.castOps);
      await clickAction('redo');
      await clickAction('export');
      const exported = await cdp.eval("document.getElementById('wb-export-text').value");
      const cs = JSON.parse(exported);
      check('case 13: export is a bare cast-windows-changeset (no connection drafts)', cs.format === 'cast-windows-changeset' && cs.version === 1 && cs.target === 'narrative/cast/windows.json' && cs.operations.length === 1 && cs.operations[0].x === 10, cs);
      await shot('case13-export.png', OUT7);
      const file = path.join(OUT7, 'case13-changeset.json');
      fs.writeFileSync(file, exported);
      const dry = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'world-apply.js'), file, '--dry-run'], { encoding: 'utf8' });
      fs.writeFileSync(path.join(OUT7, 'case13-dry-run.txt'), dry.stdout + dry.stderr);
      const diff = dry.stdout.split('\n').filter((l) => /^ {2}(@@|-|\+)/.test(l));
      const windowsLines = fs.readFileSync(path.join(ROOT, 'narrative', 'cast', 'windows.json'), 'utf8').split('\n');
      const hunk = diff[0] ? Number(/@@ line (\d+)/.exec(diff[0])[1]) : -1;
      const owner = windowsLines.slice(0, hunk).reverse().find((l) => /"id": "/.test(l));
      check('case 13: dry-run diff is one hunk: that window\'s "x": 9 -> 10', diff.length === 3 && /^-\s+"x": 9,$/.test(diff[1].trim()) && /^\+\s+"x": 10,$/.test(diff[2].trim()) && owner && owner.includes('"id": "ACT3_TRUMAN_REPORT"'), diff);
      check('case 13: dry-run fails on the V6 transitions that pin Truman (C3.1/C3.2/C3.3), nothing written', dry.status === 1 && /TRANSITION .* C3\.1 character=truman/.test(dry.stderr) && /C3\.3 character=truman/.test(dry.stderr) && windowsSha() === windowsShaStart, dry.stderr);
      check('case 13: world/connections.json and narrative/cast/windows.json unchanged', sha() === shaStart && windowsSha() === windowsShaStart);
    }

    // ---------------- case 14 (M7): refuse a move onto Lucy
    {
      console.log('\ncase 14: MOVE Truman onto Lucy refused');
      await load();
      await setSelect('wb-moment', 'ACT4_AFTERNOON');
      await setSelect('wb-scene', 'sheriff');
      await clickTile(10, 4);
      await clickAction('mode-edit');
      let s = await state();
      check('case 14: Truman at ACT4_AFTERNOON is the baseline body', s.selectedId === 'npc:truman:sheriff' && (await text('wb-npc-source')) === 'baseline (PERSISTENT)', await text('wb-npc-source'));
      const lucy = s.npcs.find((n) => n.characterId === 'lucy');
      check('case 14: Lucy stands at sheriff 2,6', lucy && lucy.tx === 2 && lucy.ty === 6, lucy);
      await clickAction('move-npc');
      await clickTile(2, 6);
      s = await state();
      check('case 14: MOVE onto Lucy refused with a message, draft unchanged, pick still armed', /MOVE refused: sheriff 2,6 is occupied by lucy/.test(s.notice || '') && s.castOps.length === 0 && s.unsaved === 0 && s.pendingNpc && s.pendingNpc.character === 'truman', s.notice);
      await shot('case14-refused-lucy.png', OUT7);
    }

    // ---------------- case 15 (M7): refuse door tile and wall; bundle export
    {
      console.log('\ncase 15: MOVE onto a door refused; bundle export');
      await clickTile(7, 11);
      let s = await state();
      check('case 15: MOVE onto the station door trigger 7,11 refused', /MOVE refused: sheriff 7,11 is a door trigger tile \(trigger of sheriffs-station-front-entrance\)/.test(s.notice || '') && s.castOps.length === 0, s.notice);
      await shot('case15-refused-door.png', OUT7);
      await clickTile(0, 0);
      s = await state();
      check('case 15: MOVE onto a wall refused', /MOVE refused: sheriff 0,0 is not walkable/.test(s.notice || '') && s.castOps.length === 0, s.notice);
      await pressKey('Escape', 'Escape', 27);
      s = await state();
      check('case 15: Escape disarms the pick', !s.pendingNpc, s.pendingNpc);

      await clickTile(2, 6);
      await clickAction('move-npc');
      await clickTile(3, 6);
      s = await state();
      check('case 15: Lucy (baseline) moves to 3,6', JSON.stringify(s.castOps) === JSON.stringify([{ op: 'place', window: 'baseline', character: 'lucy', map_id: 'sheriff', x: 3, y: 6, dir: 'down' }]), s.castOps);
      await clickTile(7, 11);
      s = await state();
      check('case 15: the door trigger selects its endpoint', s.selectedId === 'trigger:sheriffs-station-front-entrance:b:0', s.selectedId);
      await setInput('wb-door-needsFlag', 'sogno_fatto');
      s = await state();
      check('case 15: 2 unsaved changes across connections and cast', s.unsaved === 2 && s.ops.length === 1 && s.castOps.length === 1, s);
      await clickAction('export');
      const exported = await cdp.eval("document.getElementById('wb-export-text').value");
      const bundle = JSON.parse(exported);
      check('case 15: export is a world-builder-bundle with one changeset per target', bundle.format === 'world-builder-bundle' && bundle.version === 1 && bundle.changesets.length === 2 &&
        bundle.changesets[0].target === 'world/connections.json' && bundle.changesets[1].target === 'narrative/cast/windows.json' && (await text('wb-export-summary')).includes('(bundle)'), bundle);
      await shot('case15-bundle-export.png', OUT7);
      const file = path.join(OUT7, 'case15-bundle.json');
      fs.writeFileSync(file, exported);
      const dry = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'world-apply.js'), file, '--dry-run', '--repin'], { encoding: 'utf8' });
      fs.writeFileSync(path.join(OUT7, 'case15-dry-run.txt'), dry.stdout + dry.stderr);
      /* The repin count is DERIVED, never hardcoded: moving Lucy off her baseline tile disagrees with exactly
       * those V5 pins that expect her there, so the fixture decides how many. It was pinned at 24 and the
       * fixture has since grown to 28 with the Act 5 pins — a hardcoded number silently ages out. */
      const pinsFixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'fixtures', 'cast-pins-acts-1-4.json'), 'utf8'));
      const expectedRepins = pinsFixture.pins.filter((pin) => pin.expect && pin.expect.lucy === 'sheriff@2,6').length;
      check('case 15: every V5 pin that expects Lucy on her baseline tile is a repin candidate', expectedRepins > 0 && expectedRepins <= pinsFixture.pins.length,
        expectedRepins + ' of ' + pinsFixture.pins.length + ' pins');
      check('case 15: --dry-run --repin on the bundle exits 0 with both parts and ' + expectedRepins + ' repins previewed', dry.status === 0 && dry.stdout.includes('TARGET world/connections.json :: sheriffs-station-front-entrance') &&
        dry.stdout.includes('TARGET narrative/cast/windows.json :: baseline / lucy') && (dry.stdout.match(/^REPIN /gm) || []).length === expectedRepins && dry.stdout.includes('DRY-RUN 1 cast placement change(s), ' + expectedRepins + ' repin(s); nothing written'), dry.stdout + dry.stderr);
      await clickAction('revert-all');
      s = await state();
      check('case 15: REVERT ALL clears both drafts', s.unsaved === 0 && s.castOps.length === 0, s.unsaved);
      check('case 15: world/connections.json and narrative/cast/windows.json unchanged', sha() === shaStart && windowsSha() === windowsShaStart);
    }
   }

    const dryRun = (file, name, dir = OUT8) => {
      const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'world-apply.js'), file, '--dry-run'], { encoding: 'utf8' });
      fs.writeFileSync(path.join(dir, name), r.stdout + r.stderr);
      return r;
    };
    const exportText = async () => { await clickAction('export'); return cdp.eval("document.getElementById('wb-export-text').value"); };

   if (!ONLY_M10B) {
    // ---------------- case 16 (M8): move the welcome sign
    {
      console.log('\ncase 16: MOVE the town welcome sign');
      await load();
      await setSelect('wb-scene', 'town');
      await clickTile(30, 30);
      let s = await state();
      const here = s.objectItems.filter((o) => o.tx === 30 && o.ty === 30 && o.w === 1);
      check('case 16: town 30,30 holds the welcome-sign object and the cartello interact key, both registry entries',
        here.map((o) => o.entry + ':' + (o.sourceId || o.interactId)).join() === 'object:welcome-sign,interact:cartello' && here.every((o) => !o.readOnly), here);
      check('case 16: the click lands on the topmost item, the cartello key', s.selectedId === 'object:town:interact-30-30', s.selectedId);
      const stack = await text('wb-stack');
      check('case 16: ON THIS TILE lists both', stack && stack.includes('object:town:welcome-sign') && stack.includes('object:town:interact-30-30'), stack);
      await cdp.eval("document.querySelector('[data-stack=\"object:town:welcome-sign\"]').click()");
      await sleep(80);
      s = await state();
      const insp = await cdp.eval("document.getElementById('wb-inspector').innerText");
      check('case 16: the chip selects the sign; inspector shows source id, kind, tile, dialogue, no mission refs',
        s.selectedId === 'object:town:welcome-sign' && insp.includes('welcome-sign') && insp.includes('landmark / welcomesign') && (await text('wb-obj-tile')) === '30,30' &&
        (await text('wb-obj-dialogue')) === 'sign_town' && (await text('wb-obj-refs')) === 'none', insp);
      check('case 16: VIEW offers no MOVE', !(await cdp.eval("!!document.querySelector('[data-action=\"move-object\"]')")));
      await shot('case16-before.png', OUT8);
      await clickAction('mode-edit');
      await clickAction('move-object');
      s = await state();
      check('case 16: MOVE arms a tile pick', s.pending === 'move-object', s.pending);
      await clickTile(31, 30);
      s = await state();
      check('case 16: one upsert, only x changed, sign still selected, 1 unsaved change',
        JSON.stringify(s.objectOps) === JSON.stringify([{ op: 'upsert', scene: 'town', sourceId: 'welcome-sign', object: { sourceId: 'welcome-sign', type: 'landmark', kind: 'welcomesign', x: 31, y: 30, dialogue: 'sign_town' } }]) &&
        s.selectedId === 'object:town:welcome-sign' && s.unsaved === 1 && !s.pending, s.objectOps);
      check('case 16: inspector and validation show the move', (await text('wb-obj-draft')) === 'changed (was 30,30)' && (await text('wb-draft-ops')).includes('upsert town object welcome-sign → 31,30'), await text('wb-draft-ops'));
      await shot('case16-moved.png', OUT8);
      const exported = await exportText();
      const cs = JSON.parse(exported);
      check('case 16: export is a bare scene-objects-changeset', cs.format === 'scene-objects-changeset' && cs.version === 1 && cs.target === 'world/scene-objects.json' && cs.operations.length === 1 &&
        (await text('wb-export-summary')).includes('1 scene object change(s)'), cs);
      await shot('case16-export.png', OUT8);
      const file = path.join(OUT8, 'case16-changeset.json');
      fs.writeFileSync(file, exported);
      const dry = dryRun(file, 'case16-dry-run.txt');
      const diff = dry.stdout.split('\n').filter((l) => /^ {2}(@@|-|\+)/.test(l)).map((l) => l.trim());
      check('case 16: --dry-run exits 0 and its diff is one x,y line: "x": 30 -> 31', dry.status === 0 && diff.length === 3 && /^@@ line \d+$/.test(diff[0]) && /^-\s+"x": 30,$/.test(diff[1]) && /^\+\s+"x": 31,$/.test(diff[2]) &&
        dry.stdout.includes('DRY-RUN 1 scene object change(s); nothing written'), dry.stdout + dry.stderr);
      await pressUndo();
      s = await state();
      check('case 16: Ctrl+Z puts the sign back', s.objectOps.length === 0 && s.unsaved === 0, s.objectOps);
      check('case 16: world/scene-objects.json unchanged', sha(OBJECTS) === objectsShaStart);
    }

    // ---------------- case 17 (M8): resize the tracks landmark
    {
      console.log('\ncase 17: RESIZE the tracks landmark');
      await load();
      await setSelect('wb-scene', 'town');
      await clickTile(53, 10);
      let s = await state();
      check('case 17: a click inside the rect selects object:town:tracks', s.selectedId === 'object:town:tracks', s.selectedId);
      check('case 17: inspector shows the 2x33 rect and marks the cascade hand-edited', (await text('wb-obj-size')) === '2×33' && (await text('wb-obj-dialogue')).includes('(cascade: conditions are hand-edited)'), await text('wb-obj-dialogue'));
      await clickAction('mode-edit');
      await setInput('wb-obj-h', 30);
      s = await state();
      const tracks = JSON.parse(fs.readFileSync(OBJECTS, 'utf8')).scenes.town.objects.find((o) => o.sourceId === 'tracks');
      const op = s.objectOps[0];
      check('case 17: one upsert with h 30, x/y/w and the cascade untouched', s.objectOps.length === 1 && op.op === 'upsert' && op.object.h === 30 && op.object.w === 2 && op.object.x === 53 && op.object.y === 1 &&
        JSON.stringify(op.object.dialogue) === JSON.stringify(tracks.dialogue), s.objectOps);
      check('case 17: inspector size follows at once', (await text('wb-obj-size')) === '2×30' && (await text('wb-obj-draft')) === 'changed (was 53,1 2×33)', await text('wb-obj-draft'));
      await setInput('wb-obj-h', 40);
      s = await state();
      check('case 17: a rect past the map edge is an invalid draft and blocks export', s.errors['scene-objects:town'] && /town tracks: 53,1 2x40 falls outside town \(56x36\)/.test(s.errors['scene-objects:town'].join()), s.errors);
      await clickAction('export');
      check('case 17: EXPORT BLOCKED names the scene', (await text('wb-export-blocked') || '').includes('scene-objects:town'), await text('wb-export-blocked'));
      await shot('case17-invalid.png', OUT8);
      await setInput('wb-obj-h', 30);
      const exported = await exportText();
      await shot('case17-resized.png', OUT8);
      const file = path.join(OUT8, 'case17-changeset.json');
      fs.writeFileSync(file, exported);
      const dry = dryRun(file, 'case17-dry-run.txt');
      check('case 17: --dry-run VALID, one h line', dry.status === 0 && dry.stdout.includes('VALID 1 scene object change(s)') && /-\s+"h": 33,\n\s+\+\s+"h": 30,/.test(dry.stdout), dry.stdout + dry.stderr);
      check('case 17: world/scene-objects.json unchanged', sha(OBJECTS) === objectsShaStart);
    }

    // ---------------- case 18 (M8): delete refused for a mission-referenced entry
    {
      console.log('\ncase 18: DELETE refused for sign_oej');
      await load();
      await setSelect('wb-scene', 'traincar');
      await clickTile(20, 2);
      let s = await state();
      check('case 18: traincar 20,2 selects the sign_oej interact key', s.selectedId === 'object:traincar:interact-20-2', s.selectedId);
      check('case 18: MISSION REFS names M5 node m5_sign_oej', (await text('wb-obj-refs')) === 'M5 m5_sign_oej (sign_oej)', await text('wb-obj-refs'));
      await clickAction('mode-edit');
      check('case 18: DELETE is disabled and the refusal is explained', !(await enabled('delete-object')) &&
        /DELETE refused: M5 node m5_sign_oej references "sign_oej"/.test(await text('wb-obj-delete-refused')), await text('wb-obj-delete-refused'));
      await shot('case18-delete-refused.png', OUT8);
      await clickTile(4, 6);
      s = await state();
      check('case 18: sign_ponte (4,6) has no mission reference, DELETE enabled', s.selectedId === 'object:traincar:interact-4-6' && (await text('wb-obj-refs')) === 'none' && (await enabled('delete-object')), s.selectedId);
      await clickAction('delete-object');
      s = await state();
      check('case 18: DELETE asks for confirmation first', s.confirmObjectDelete === 'object:traincar:interact-4-6' && s.objectOps.length === 0, s.confirmObjectDelete);
      await clickAction('delete-object-confirm');
      s = await state();
      check('case 18: CONFIRM DELETE drops the key from the draft', JSON.stringify(s.objectOps) === JSON.stringify([{ op: 'delete', scene: 'traincar', interact: '4,6' }]) && !s.objectItems.some((o) => o.id === 'object:traincar:interact-4-6'), s.objectOps);
      await pressUndo();
      s = await state();
      check('case 18: Ctrl+Z restores it in key order', s.objectOps.length === 0 && s.objectItems.filter((o) => o.entry === 'interact').map((o) => o.interactId).join() === 'sign_ponte,sign_oej,mucchio_terra,anello_interact', s.objectItems);
      check('case 18: world/scene-objects.json unchanged', sha(OBJECTS) === objectsShaStart);
    }

    // ---------------- case 19 (M8): NEW INTERACT with an INTERACT_DLG id
    {
      console.log('\ncase 19: NEW INTERACT on woods');
      await load();
      await setSelect('wb-scene', 'woods');
      check('case 19: NEW INTERACT needs EDIT', !(await enabled('new-interact')));
      await clickAction('mode-edit');
      await clickAction('new-interact');
      let s = await state();
      const ids = await cdp.eval("Array.from(document.querySelectorAll('#wb-new-interact-id option')).map((o) => o.value)");
      check('case 19: the id list is glue\'s INTERACT_DLG keys', JSON.stringify(ids) === JSON.stringify(['bacheca', 'cameraLaura', 'cartello', 'cartelloBosco', 'lago_riva', 'letto_315', 'olio', 'scrivania_315', 'specchio315', 'tomba_laura']) && s.newInteract.placing, ids);
      await setSelect('wb-new-interact-id', 'olio');
      await clickTile(14, 12);
      s = await state();
      check('case 19: a tile that already holds a key is refused, CONFIRM disabled', s.newInteract.errors.join() === 'woods: two interact keys on 14,12' && !(await enabled('new-interact-confirm')), s.newInteract.errors);
      await clickAction('new-interact-pick');
      await clickTile(13, 12);
      s = await state();
      check('case 19: a free tile is valid, CONFIRM enabled', s.newInteract.errors.length === 0 && JSON.stringify(s.newInteract.tile) === '{"tx":13,"ty":12}' && (await enabled('new-interact-confirm')), s.newInteract);
      await shot('case19-new-interact.png', OUT8);
      await clickAction('new-interact-confirm');
      s = await state();
      const insp = await cdp.eval("document.getElementById('wb-inspector').innerText");
      check('case 19: CONFIRM creates the key, selects it, shows it as a sparkle bound to olio',
        !s.newInteract && s.selectedId === 'object:woods:interact-new-1' && JSON.stringify(s.objectOps) === JSON.stringify([{ op: 'create', scene: 'woods', interact: '13,12', id: 'olio' }]) &&
        /SPARKLE\s+yes/.test(insp) && (await text('wb-obj-draft')) === 'new (create)', s.objectOps);
      const exported = await exportText();
      await shot('case19-export.png', OUT8);
      const file = path.join(OUT8, 'case19-changeset.json');
      fs.writeFileSync(file, exported);
      const dry = dryRun(file, 'case19-dry-run.txt');
      check('case 19: --dry-run VALID, one added key line', dry.status === 0 && dry.stdout.includes('CREATE world/scene-objects.json :: woods interact 13,12') && dry.stdout.includes('VALID 1 scene object change(s)') &&
        /\+\s+"13,12": "olio"/.test(dry.stdout), dry.stdout + dry.stderr);
      await clickAction('revert-object');
      s = await state();
      check('case 19: REVERT on a created key removes it', s.objectOps.length === 0 && s.selectedId === null, s.objectOps);
      check('case 19: world/scene-objects.json and world/connections.json unchanged', sha(OBJECTS) === objectsShaStart && sha() === shaStart);
    }
   }

    // ================ M10b: the props editor =====================================================================
    const propsShaStart = sha(PROPS);
    const PROP_CHAIR = ['roadhouse', 'chair', '02'].join('-');   // a literal id here would count as a reference
    const PROP_TABLE = ['roadhouse', 'table', '02'].join('-');
    async function clickPixel(px, py) {
      const p = await cdp.eval(`WB.pixelToClient(${px}, ${py})`);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
      await sleep(120);
    }

    // ---------------- case 20 (M10b): the props layer, selection, MOVE, FLIP, nudge
    {
      console.log('\ncase 20: roadhouse props layer');
      await load();
      await setSelect('wb-scene', 'roadhouse');
      let s = await state();
      check('case 20: props are available but the layer starts off', s.propsAvailable && !s.propsOn, { on: s.propsOn, av: s.propsAvailable });
      check('case 20: NEW PROP needs the layer and EDIT', !(await enabled('new-prop')));
      await clickPixel(120, 95);
      s = await state();
      check('case 20: with the layer off a prop is not selectable', s.selectedProp === null, s.selectedProp);
      await clickAction('toggle-props');
      s = await state();
      const reg = JSON.parse(fs.readFileSync(PROPS, 'utf8'));
      const inRoadhouse = Object.keys(reg.instances).filter((k) => reg.instances[k].sceneId === 'roadhouse');
      check('case 20: PROPS on draws every roadhouse instance', s.propsOn && s.propItems.length === inRoadhouse.length, s.propItems.length);
      check('case 20: the header counts them', (await cdp.eval("document.getElementById('wb-stage-info').textContent")).includes('props ' + inRoadhouse.length));
      await shot('case20-layer-on.png', OUT10);

      // 120,95 is inside the chair frame (116,88 18x30) and outside every other frame
      await clickPixel(120, 95);
      s = await state();
      check('case 20: a click on a prop selects the instance, not the tile marker', s.selectedProp === PROP_CHAIR && s.selectedId === null, { p: s.selectedProp, i: s.selectedId });
      const insp = await cdp.eval("document.getElementById('wb-inspector').innerText");
      check('case 20: the inspector names the definition, anchor, layer and footprint',
        (await text('wb-prop-def')).includes('roadhouse.chair.red') && (await text('wb-prop-anchor')) === '7.8125,7.25' &&
        (await text('wb-prop-layer')).startsWith('6 (definition default)') && (await text('wb-prop-footprint')) === '7,7', insp);
      check('case 20: VIEW offers no MOVE', !(await cdp.eval("!!document.querySelector('[data-action=\"move-prop\"]')")));

      await clickAction('mode-edit');
      await clickAction('move-prop');
      s = await state();
      check('case 20: MOVE arms a pending tile pick', s.pending === 'move-prop', s.pending);
      await clickTile(4, 7);
      s = await state();
      const moved = s.propItems.find((p) => p.id === PROP_CHAIR);
      check('case 20: MOVE keeps the sub-tile fraction of the anchor', moved.tx === 4.8125 && moved.ty === 7.25, moved);
      check('case 20: one prop change, and it is an upsert', s.propChangeCount === 1 && s.propOps.length === 1 && s.propOps[0].op === 'upsert' && s.propOps[0].id === PROP_CHAIR, s.propOps);
      await clickAction('flip-prop');
      s = await state();
      check('case 20: FLIP X sets flipX and keeps the anchor', s.propOps[0].instance.flipX === true && s.propItems.find((p) => p.id === PROP_CHAIR).tx === 4.8125, s.propOps[0].instance);
      await pressKey('ArrowLeft', 'ArrowLeft', 37);
      s = await state();
      check('case 20: an arrow key nudges by one pixel (ox)', s.propOps[0].instance.ox === -1, s.propOps[0].instance);
      check('case 20: the header counts the prop change', (await cdp.eval("document.getElementById('wb-title').textContent")) === 'WORLD BUILDER · 1 unsaved change');
      await shot('case20-moved.png', OUT10);
      const exported = await exportText();
      const cs = JSON.parse(exported);
      check('case 20: the export is a props-changeset v2 for world/props.json', cs.format === 'props-changeset' && cs.version === 2 && cs.target === 'world/props.json' && cs.operations.length === 1, cs);
      const file = path.join(OUT10, 'case20-changeset.json');
      fs.writeFileSync(file, exported);
      const dry = dryRun(file, 'case20-dry-run.txt', OUT10);
      check('case 20: --dry-run VALID, the tx line changes', dry.status === 0 && dry.stdout.includes('TARGET world/props.json :: ' + PROP_CHAIR) &&
        dry.stdout.includes('VALID 19 prop instance(s)') && /-\s+"tx": 7\.8125,/.test(dry.stdout) && /\+\s+"tx": 4\.8125,/.test(dry.stdout) &&
        /\+\s+"flipX": true/.test(dry.stdout), dry.stdout + dry.stderr);
      await clickAction('revert-prop');
      s = await state();
      check('case 20: REVERT clears the prop draft', s.propChangeCount === 0 && s.unsaved === 0, s.propOps);
      check('case 20: world/props.json unchanged', sha(PROPS) === propsShaStart);
    }

    // ---------------- case 21 (M10b): NEW PROP from the catalog
    {
      console.log('\ncase 21: NEW PROP on the roadhouse');
      await load();
      await setSelect('wb-scene', 'roadhouse');
      await clickAction('toggle-props');
      await clickAction('mode-edit');
      await clickAction('new-prop');
      let s = await state();
      const all = await cdp.eval("Array.from(document.querySelectorAll('#wb-prop-catalog [data-prop]')).map((b) => b.getAttribute('data-prop'))");
      const reg = JSON.parse(fs.readFileSync(PROPS, 'utf8'));
      check('case 21: the catalog lists every definition and asks for a tile', all.length === Object.keys(reg.definitions).length && s.newProp.placing, all);
      await typeInput('wb-new-prop-search', 'candle');
      const filtered = await cdp.eval("Array.from(document.querySelectorAll('#wb-prop-catalog [data-prop]')).map((b) => b.getAttribute('data-prop'))");
      check('case 21: the search filters the catalog', JSON.stringify(filtered) === JSON.stringify(['roadhouse.candle.brass']), filtered);
      await cdp.eval("document.querySelector('[data-prop=\"roadhouse.candle.brass\"]').click()");
      await sleep(80);
      s = await state();
      check('case 21: picking a definition suggests a free instance id', s.newProp.propId === 'roadhouse.candle.brass' && s.newProp.id === ['roadhouse', 'candle', '03'].join('-'), s.newProp);
      await clickAction('new-prop-pick');
      await clickTile(1, 1);
      s = await state();
      check('case 21: a tile pick makes it valid and enables CONFIRM', s.newProp.errors.length === 0 && (await enabled('new-prop-confirm')), s.newProp);
      await shot('case21-ghost.png', OUT10);
      await clickAction('new-prop-confirm');
      s = await state();
      check('case 21: CONFIRM creates the instance and selects it', !s.newProp && s.selectedProp === s.propOps[0].id && s.propOps.length === 1 && s.propOps[0].op === 'create' &&
        s.propOps[0].instance.propId === 'roadhouse.candle.brass' && s.propOps[0].instance.tx === 1 && s.propOps[0].instance.ty === 1, s.propOps);
      check('case 21: the new prop cannot be flipped (its definition allows no transform)', !(await enabled('flip-prop')));
      check('case 21: the inspector shows it as a create', (await text('wb-prop-draft')) === 'new (create)', await text('wb-prop-draft'));
      // MOVE a created prop: still one create, at the new anchor. Done before EXPORT, because the export panel grows
      // the side column and the canvas moves out from under the recorded click point.
      await clickAction('move-prop');
      s = await state();
      check('case 21: MOVE arms on the created prop', s.pending === 'move-prop', s.pending);
      await clickTile(11, 6);
      s = await state();
      const far = s.propItems.find((p) => p.id === s.propOps[0].id);
      check('case 21: the created prop moves and stays one create', s.propOps.length === 1 && s.propOps[0].op === 'create' && far.tx === 11 && far.ty === 6, s.propOps);
      const exported = await exportText();
      const file = path.join(OUT10, 'case21-changeset.json');
      fs.writeFileSync(file, exported);
      const dry = dryRun(file, 'case21-dry-run.txt', OUT10);
      check('case 21: --dry-run accepts the create', dry.status === 0 && dry.stdout.includes('CREATE world/props.json :: ') && dry.stdout.includes('VALID 20 prop instance(s)'), dry.stdout + dry.stderr);

      await clickAction('revert-prop');
      s = await state();
      check('case 21: REVERT on a created prop removes it', s.propOps.length === 0 && s.selectedProp === null && s.unsaved === 0, s.propOps);
      check('case 21: world/props.json unchanged', sha(PROPS) === propsShaStart);
    }

    // ---------------- case 22 (M10b): DELETE, undo/redo, and the Roadhouse lock
    {
      console.log('\ncase 22: DELETE and the Roadhouse lock');
      await load();
      await setSelect('wb-scene', 'roadhouse');
      await clickAction('toggle-props');
      await clickAction('mode-edit');
      // 124,120 is inside the table frame (120,110 21x22) and outside the candle above it
      await clickPixel(124, 120);
      let s = await state();
      check('case 22: the click selects the table instance', s.selectedProp === PROP_TABLE, s.selectedProp);
      await clickAction('delete-prop');
      s = await state();
      check('case 22: DELETE asks for confirmation first', s.confirmPropDelete === PROP_TABLE && s.propOps.length === 0, s.confirmPropDelete);
      await clickAction('delete-prop-confirm');
      s = await state();
      check('case 22: CONFIRM DELETE drops it from the draft', JSON.stringify(s.propOps) === JSON.stringify([{ op: 'delete', id: PROP_TABLE }]) &&
        !s.propItems.some((p) => p.id === PROP_TABLE), s.propOps);
      await pressUndo();
      s = await state();
      check('case 22: Ctrl+Z restores it', s.propOps.length === 0 && s.propItems.some((p) => p.id === PROP_TABLE), s.propOps);

      // the south door tiles are a hard Roadhouse lock: the Builder lets the move happen, the tool refuses it
      await clickPixel(124, 120);
      await clickAction('move-prop');
      await clickTile(7, 9);
      s = await state();
      const onDoor = s.propItems.find((p) => p.id === PROP_TABLE);
      check('case 22: the table sits on the south door tile in the draft', onDoor.tx === 7.125 && onDoor.ty === 9.125, onDoor);
      check('case 22: the Builder reports no error (the lock is the tool\'s, not the schema\'s)', !s.errors['props:roadhouse'], s.errors);
      await shot('case22-on-door.png', OUT10);
      const exported = await exportText();
      const file = path.join(OUT10, 'case22-changeset.json');
      fs.writeFileSync(file, exported);
      const dry = dryRun(file, 'case22-dry-run.txt', OUT10);
      check('case 22: tools/world-apply.js refuses it with the Roadhouse lock, nothing written',
        dry.status === 1 && (dry.stderr + dry.stdout).includes('LOCK roadhouse: south door tile 7,9 is claimed by ' + PROP_TABLE) &&
        (dry.stderr + dry.stdout).includes('problem(s); nothing written'), dry.stdout + dry.stderr);
      await clickAction('revert-all');
      s = await state();
      check('case 22: REVERT ALL clears the prop draft too', s.unsaved === 0 && s.propChangeCount === 0, s.unsaved);
      check('case 22: world/props.json and world/connections.json unchanged', sha(PROPS) === propsShaStart && sha() === shaStart);
    }
  } catch (e) {
    check('driver completed without exception', false, String(e && e.stack || e));
  } finally {
    if (cdp.logs.length) console.log('page console:\n  ' + cdp.logs.join('\n  '));
    cdp.close();
    cleanup();
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\nWORLD-BUILDER-BROWSER ${results.length - failed.length}/${results.length}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
