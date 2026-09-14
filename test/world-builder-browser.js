#!/usr/bin/env node
'use strict';

/* test/world-builder-browser.js — WORLD BUILDER M4b + M5 browser proof on the real page.
 *
 *   node test/world-builder-browser.js
 *
 * Serves the repo on loopback, opens world-builder.html in headless Chrome (same flags as test/shot.sh:
 * --headless=new --enable-unsafe-swiftshader --use-angle=swiftshader), drives it with real CDP mouse
 * clicks on canvas tiles and DOM button clicks, and records screenshots in artifacts/world-builder-m5/
 * (the M4b run's screenshots stay in artifacts/world-builder-m4b/ as its record).
 * world/connections.json is hashed before and after every case: the editor must never touch it.
 *
 *   1  double-r-front-entrance / b  (diner): EDIT, MOVE SPAWN -> 8,8, facing left, ADD trigger 8,9
 *   2  sheriffs-station-front-entrance / a  (sheriffs_station_exterior): same workflow
 *   3  invalid: spawn x=19 on diner -> red marker + error text, export blocked
 *   4  story moment ACT4_EVENING_GATHERING: diner without Norma/Shelly, roadhouse with them
 *   5  M5: town-roadhouse / b (roadhouse, a migrated classic door): MOVE SPAWN -> 6,8, export, CLI dry-run
 *   6  M5: one-way arrival-town: inspector shows ONE-WAY, endpoint b offers no ADD TRIGGER
 *   7  M5: every scene header reports legacy doors 0
 */

const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts', 'world-builder-m5');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const REGISTRY = path.join(ROOT, 'world', 'connections.json');

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond });
  console.log(`  ${cond ? 'PASS' : 'FAIL'} - ${name}${cond ? '' : '  ::  ' + JSON.stringify(detail)}`);
  return !!cond;
}
const sha = () => crypto.createHash('sha256').update(fs.readFileSync(REGISTRY)).digest('hex');

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
  const shaStart = sha();
  const port = await freePort();
  const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
  const devPort = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-wb-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    `--remote-debugging-port=${devPort}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  const cleanup = () => { try { chrome.kill(); } catch (_) {} try { server.kill(); } catch (_) {} };
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
  async function load() {
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/world-builder.html` });
    await sleep(300);
    await waitFor("document.body && (document.body.getAttribute('data-wb-ready') === '1' || !!document.getElementById('wb-fatal'))");
    const fatal = await cdp.eval("document.getElementById('wb-fatal') && document.getElementById('wb-fatal').textContent");
    if (fatal) throw new Error(fatal);
    await waitFor('WB.state().momentsLoaded');
  }
  async function shot(name) {
    await sleep(120);
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const file = path.join(OUT, name);
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
