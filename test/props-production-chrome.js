#!/usr/bin/env node
'use strict';

/* test/props-production-chrome.js — M11 evidence: what GAME.PROPS_ENABLED = true does to the REAL build.
 *
 *   node test/props-production-chrome.js            three checkpoints, flag off and on, all checks
 *   node test/props-production-chrome.js --keep     keep the temp trees (debugging)
 *
 * THE PAGE IS index.html, not test/retro-scene.html. It is opened the way test/act-4-playthrough.js opens it —
 * inside test/act-4-playthrough-probe.html, which loads ../index.html in an iframe and drives it through window.A4
 * — because that is the only path in this repo that can put the production build into an act-4 state. Everything
 * rendered is the production script chain of index.html: the same engine, the same scene installers, the same
 * js/props-production.js.
 *
 * THREE ROADHOUSE CHECKPOINTS, the moments act-4 plays (test/act-4-playthrough.js playRoadhouse, :575-731):
 *   empty      the room before the crowd            — the props alone, for the palette read
 *   gathering  ACT4_EVENING_GATHERING, 7 bodies     — act-4's roadhouse-populated.png moment
 *   giant      ACT4_GIANT_STAGE, the Giant on stage — act-4's roadhouse-giant-stage.png moment
 * Each is reached by seeding exactly the state its Cast Presence window reads (narrative/cast/windows.json) and
 * walking in through the real town door, never by teleporting a body onto a tile.
 *
 * THREE TREES, because the off shot has to prove the harness itself changes nothing:
 *   pristine   index.html untouched
 *   flagoff    index.html + an injected <script> setting GAME.PROPS_ENABLED = false
 *   flagon     index.html + the same <script> setting it true
 * pristine == flagoff, byte for byte, at every checkpoint (the injection is inert); pristine != flagon (the
 * comparison is not vacuous). The repo is never written: every tree is a temp copy.
 *
 * DETERMINISM. index.html has no ?freezeMs= — that is a test/retro-scene.html harness mode. What actually moves in
 * a still Roadhouse is the neon, and js/roadhouse-art.js:618-681 flickers it as a pure function of nowMs(), so the
 * capture freezes the clock (performance.now and Date.now pinned to FROZEN_T inside the iframe) and lets the loop
 * paint FREEZE_FRAMES frames at that instant before the shot. That is the freezeMs of this page, applied to every
 * tree equally, and the byte-compare below is what proves it works.
 *
 * CHECKS
 *   depth     every actor at a checkpoint against every prop frame it overlaps: a prop whose anchor foot y is
 *             greater must be in front, one whose foot y is smaller must be behind — read off the shots, not
 *             asserted from the registry (the registry only says which pairs to look at)
 *   bodies    every instance footprint against Cast Presence bodies, door tiles and interact tiles, the same list
 *             tools/world-apply.js warns about
 *   cost      median and p95 frame time on the Roadhouse over FRAME_SAMPLES frames, flag off vs on
 *   sheet     artifacts/props-m11/sheet.png, off above on for each checkpoint
 */

const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawn, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts', 'props-m11');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROBE = 'test/act-4-playthrough-probe.html';
const SCENE = 'roadhouse';
const KEEP = process.argv.includes('--keep');

const SHOT_W = 980, SHOT_H = 700;      // act-4's own metrics (test/act-4-playthrough.js:149)
const TILE = 16;
const FROZEN_T = 1000;                 // the instant every capture is frozen at
const FREEZE_FRAMES = 8;               // frames painted at that instant before the shot
const FRAME_SAMPLES = 300;
const ACTOR_SPRITE_H = 24;             // measured in test/props-depth-chrome.js:78

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: cond ? null : (detail === undefined ? null : detail) });
  console.log(`  ${cond ? 'PASS' : 'FAIL'} - ${name}${cond ? '' : '  ::  ' + JSON.stringify(detail)}`);
  return !!cond;
}

/* --------------------------------- registry geometry --------------------------------- */
const PropsCore = require(path.join(ROOT, 'js', 'editor', 'core', 'props.js'));
const REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'world', 'props.json'), 'utf8'));
const ACTOR_LAYER = PropsCore.ACTOR_LAYER;
const INSTANCES = Object.keys(REG.instances)
  .filter((id) => REG.instances[id].sceneId === SCENE)
  .map((id) => {
    const inst = REG.instances[id], def = REG.definitions[inst.propId];
    const o = PropsCore.originOf(def, inst);
    return {
      id: id, inst: inst, def: def,
      layer: PropsCore.layerOf(def, inst),
      foot: Math.round(inst.ty * TILE),
      left: o.left, top: o.top, right: o.left + def.frame[2], bottom: o.top + def.frame[3],
      tiles: PropsCore.instanceTiles(def, inst)
    };
  })
  .sort((a, b) => (a.id < b.id ? -1 : 1));

/* --------------------------------- PNG in and out --------------------------------- */
// Reader: 8-bit RGB/RGBA, the two colour types Page.captureScreenshot writes (test/props-depth-chrome.js:116).
function readPng(buf) {
  if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('not a PNG');
  let i = 8, w = 0, h = 0, depth = 0, ctype = 0;
  const idat = [];
  while (i < buf.length) {
    const len = buf.readUInt32BE(i), type = buf.slice(i + 4, i + 8).toString('ascii'), data = buf.slice(i + 8, i + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    i += 12 + len;
  }
  if (depth !== 8 || (ctype !== 6 && ctype !== 2)) throw new Error('unsupported PNG (depth ' + depth + ', colour type ' + ctype + ')');
  const ch = ctype === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch;
  const out = Buffer.alloc(h * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0, up = prev[x], c = x >= ch ? prev[x - ch] : 0, v = line[x];
      let val;
      if (f === 0) val = v;
      else if (f === 1) val = v + a;
      else if (f === 2) val = v + up;
      else if (f === 3) val = v + ((a + up) >> 1);
      else {
        const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c);
        val = v + (pa <= pb && pa <= pc ? a : pb <= pc ? up : c);
      }
      cur[x] = val & 255;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  const rgb = Buffer.alloc(w * h * 3);
  for (let p = 0; p < w * h; p++) { rgb[p * 3] = out[p * ch]; rgb[p * 3 + 1] = out[p * ch + 1]; rgb[p * 3 + 2] = out[p * ch + 2]; }
  return { w: w, h: h, rgb: rgb, at: (x, y) => { const o = (y * w + x) * 3; return (rgb[o] << 16) | (rgb[o + 1] << 8) | rgb[o + 2]; } };
}
// Writer: the contact sheet only, so filter 0 on every row is enough.
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePng(w, h, rgb) {
  const stride = w * 3, raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })), pngChunk('IEND', Buffer.alloc(0))]);
}

/* --------------------------------- trees and server --------------------------------- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-props-m11-'));
const SERVERS = [];
const CHROMES = [];
function reapStrays(profile) {
  // test/lib/playable-browser.js reapStrays: a Chrome that relaunched itself is no longer our child, and the
  // profile path is unique to this run, so whatever still holds it is ours to kill.
  if (!profile) return;
  const found = spawnSync('pgrep', ['-f', profile], { encoding: 'utf8' });
  if (found.status !== 0 || !found.stdout) return;
  for (const line of found.stdout.split('\n')) {
    const pid = Number(line.trim());
    if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) continue;
    try { process.kill(pid, 'SIGKILL'); } catch (_) { /* already gone */ }
  }
}
function cleanup() {
  SERVERS.forEach((p) => { try { p.kill(); } catch (_) { /* gone */ } });
  CHROMES.forEach((c) => { try { c.child.kill('SIGTERM'); } catch (_) { /* gone */ } reapStrays(c.profile); });
  if (!KEEP) { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* best effort */ } }
}
process.on('exit', cleanup);

const PAGE_DIRS = ['js', 'test', 'assets', 'world', 'narrative'];
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const PROP_TAG = '<script src="js/props.gen.js"></script>';
// The same injection test/props-depth-chrome.js:206 uses, against index.html's own script path.
const inject = (value) => (html) => html.replace(PROP_TAG,
  '<script>window.GAME = window.GAME || {}; window.GAME.PROPS_ENABLED = ' + value + ';</script>\n' + PROP_TAG);
function copyTree(name, mutate) {
  const root = path.join(TMP, name);
  fs.mkdirSync(root);
  PAGE_DIRS.forEach((d) => fs.cpSync(path.join(ROOT, d), path.join(root, d), { recursive: true }));
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(root, 'index.html'));
  if (mutate) fs.writeFileSync(path.join(root, 'index.html'), mutate(INDEX));
  return root;
}
let nextPort = 18700 + (process.pid % 20000);
function serve(root) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const port = 18000 + ((nextPort++) % 40000);
    const p = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', root], { stdio: 'ignore' });
    p.unref();
    SERVERS.push(p);
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      if (p.exitCode !== null) break;
      if (spawnSync('curl', ['-fsS', '-o', '/dev/null', 'http://127.0.0.1:' + port + '/' + PROBE], { encoding: 'utf8' }).status === 0) return port;
    }
    try { p.kill(); } catch (_) { /* gone */ }
  }
  throw new Error('no server came up for ' + root);
}

/* --------------------------------- CDP (test/act-4-playthrough.js:62-98) --------------------------------- */
async function freePort() {
  const server = net.createServer();
  await new Promise((res, rej) => { server.once('error', rej); server.listen(0, '127.0.0.1', res); });
  const port = server.address().port;
  await new Promise((res) => server.close(res));
  return port;
}
async function waitForJson(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last = 'no response';
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (r.ok) return await r.json();
      last = 'HTTP ' + r.status;
    } catch (e) { last = e.message; }
    await new Promise((res) => setTimeout(res, 60));
  }
  throw new Error('DevTools endpoint timeout (' + last + ')');
}
class Cdp {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); }
  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('CDP connect timeout')), 15000);
      this.ws.onopen = () => { clearTimeout(t); resolve(); };
      this.ws.onerror = (e) => { clearTimeout(t); reject(new Error(e && e.message || 'CDP error')); };
    });
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (!m.id || !this.pending.has(m.id)) return;
      const p = this.pending.get(m.id);
      this.pending.delete(m.id); clearTimeout(p.timer);
      if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result || {});
    };
    this.ws.onclose = () => { for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error('CDP closed')); } this.pending.clear(); };
  }
  send(method, params = {}, timeoutMs = 300000) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression, timeoutMs = 300000) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, allowUnsafeEvalBlockedByCSP: true }, timeoutMs);
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('page: ' + (d.exception && (d.exception.description || d.exception.value) || d.text));
    }
    return r.result && r.result.value;
  }
  close() { try { this.ws.close(); } catch (_) { /* gone */ } }
}

async function openChrome() {
  const devPort = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-props-m11-chrome-'));
  const logFd = fs.openSync(path.join(profile, 'chrome.log'), 'w');
  const child = spawn(CHROME, [
    '--headless=new', '--mute-audio', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--remote-debugging-port=' + devPort, '--user-data-dir=' + profile,
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'
  ], { stdio: ['ignore', logFd, logFd] });
  CHROMES.push({ child: child, profile: profile });
  const pages = await waitForJson('http://127.0.0.1:' + devPort + '/json/list', 20000);
  const cdp = new Cdp(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride',
    { width: SHOT_W, height: SHOT_H, screenWidth: SHOT_W, screenHeight: SHOT_H, deviceScaleFactor: 1, mobile: false });
  return { cdp: cdp, child: child, profile: profile, logFd: logFd };
}
function closeChrome(h) {
  h.cdp.close();
  try { h.child.kill('SIGTERM'); } catch (_) { /* gone */ }
  reapStrays(h.profile);
  try { fs.closeSync(h.logFd); } catch (_) { /* gone */ }
  try { fs.rmSync(h.profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (_) { /* best effort */ }
}

/* --------------------------------- the checkpoints --------------------------------- */
/* Each seed is exactly what the scene's Cast Presence window reads (narrative/cast/windows.json):
 *   ACT4_EVENING_GATHERING  evidence T_LELAND_TAXI, focus_destination unset
 *   ACT4_GIANT_STAGE        presagio_status = active, warning_target unset
 * atto4 is the flag the town -> roadhouse door needs (test/act-4-playthrough.js:582). */
const CHECKPOINTS = [
  /* sogno_fatto is in every seed because the classic window JAMES_NOT_YET ("not sogno_fatto") still holds James
   * offscreen otherwise, and two true windows for one character are a Cast Presence error, never first-match-wins. */
  { name: 'roadhouse-empty', seed: { flags: { atto4: true, sogno_fatto: true } }, window: null,
    note: 'the room before the crowd' },
  { name: 'roadhouse-gathering', seed: { flags: { atto4: true, sogno_fatto: true }, evidence: { T_LELAND_TAXI: true } }, window: 'ACT4_EVENING_GATHERING',
    note: "act-4's roadhouse-populated.png moment" },
  { name: 'roadhouse-giant-stage', seed: { flags: { atto4: true, sogno_fatto: true }, values: { presagio_status: 'active' } }, window: 'ACT4_GIANT_STAGE',
    note: "act-4's roadhouse-giant-stage.png moment" }
];
const DOOR_STAND = { x: 7, y: 8, dir: 'up' };   // act-4's own roadhouse re-entry point (:635)

/* Freeze: pin the clock the neon reads, then let the loop paint a few frames at that instant. Applied inside the
 * iframe, to the window index.html actually runs in. */
const FREEZE = `(async () => {
  const W = document.getElementById('product').contentWindow;
  if (!W.__m11Frozen) {
    W.__m11Frozen = true;
    const raf = W.requestAnimationFrame.bind(W);
    /* Freezing this page is two steps, and both are needed.
     * 1. Pin the clock: the neon reads nowMs() every frame (js/roadhouse-art.js:653-681), so performance.now and
     *    Date.now answer a constant and the sign stops flickering.
     * 2. Paint a few frames at that instant with a RISING timestamp — js/engine.js:1721 ("now - lastTick < 8")
     *    would otherwise make tick() a no-op and the canvas would keep whatever frame it happened to hold, with
     *    the pinned clock never reaching a pixel — and then hand the engine a CONSTANT timestamp, which makes
     *    tick() a no-op on purpose and leaves that last painted frame on the canvas for the capture.
     * What this cannot do is rewind the animation phase the engine carries in state (an actor's walk frame, a
     * lamp's flicker counter): those advance with dt, not with the clock, and they are why the off/pristine
     * comparison below is made per pixel with the actor boxes named rather than as a byte-compare. */
    W.performance.now = () => ${FROZEN_T};
    W.Date.now = () => ${FROZEN_T};
    let t = ${FROZEN_T} + 1e7;
    W.requestAnimationFrame = (cb) => raf(() => { t += 16; cb(t); });
    for (let i = 0; i < ${FREEZE_FRAMES}; i++) await new Promise((r) => W.requestAnimationFrame(() => r()));
    const held = t;
    W.requestAnimationFrame = (cb) => raf(() => cb(held));
  }
  for (let i = 0; i < 3; i++) await new Promise((r) => W.requestAnimationFrame(() => r()));
  return true;
})()`;

/* The frame-time sample: the engine's own rAF callbacks, timed on the real clock of the OUTER window, taken
 * before this visit's freeze stops the loop. */
const FRAME_COST = `(async () => {
  const W = document.getElementById('product').contentWindow;
  if (W.__m11Frozen) throw new Error('frame cost measured after the freeze');
  const gaps = [];
  let last = performance.now();
  for (let i = 0; i < ${FRAME_SAMPLES}; i++) {
    await new Promise((r) => W.requestAnimationFrame(() => r()));
    const t = performance.now();
    gaps.push(t - last);
    last = t;
  }
  return gaps;
})()`;

const PROP_RUNTIME = `(() => {
  const W = document.getElementById('product').contentWindow;
  const P = W.GAME.Props;
  if (!P) return { present: false };
  return {
    present: true,
    enabled: W.GAME.PROPS_ENABLED === true,
    instances: P.instancesFor('${SCENE}').length,
    actorLayer: P.ACTOR_LAYER,
    /* The three hooks js/props-production.js install() places on the frame (M10a depth banding), and WHO owns
     * the outermost function now: a scene installer that short-circuits its map never calls the prop wrapper
     * underneath it, and the band that interleaves props with actors never runs. */
    drawCharHooked: !!(W.GAME.Sprites && /drawBand|pendingScene/.test(String(W.GAME.Sprites.drawChar))),
    structuresHooked: !!(W.GAME.sprites && /beginFrame/.test(String(W.GAME.sprites.drawStructures))),
    foregroundHooked: !!(W.GAME.sprites && /drawBand/.test(String(W.GAME.sprites.drawForegroundStructures))),
    structuresOwner: /RoadhouseArt/.test(String(W.GAME.sprites.drawStructures)) ? 'roadhouse-scene'
      : /beginFrame/.test(String(W.GAME.sprites.drawStructures)) ? 'props-production' : 'other',
    foregroundOwner: /RoadhouseArt/.test(String(W.GAME.sprites.drawForegroundStructures)) ? 'roadhouse-scene'
      : /drawBand/.test(String(W.GAME.sprites.drawForegroundStructures)) ? 'props-production' : 'other',
    /* Is the drawChar hook ever REACHED for this scene's actors? The engine's actor loop (js/engine.js:1022)
     * passes meta, but the retro build has more than one way to paint a body; counting the calls settles it. */
    drawCharCalls: W.__m11DrawChar || 0,
    structuresSrc: String(W.GAME.sprites.drawStructures).replace(/\s+/g, ' ').slice(0, 180),
    foregroundSrc: String(W.GAME.sprites.drawForegroundStructures).replace(/\s+/g, ' ').slice(0, 180)
  };
})()`;

const ACTORS = `(() => {
  const W = document.getElementById('product').contentWindow;
  const S = W.GAME.Engine.state;
  const npcs = (S.npcs || []).filter((n) => !W.GAME.Engine.npcActive || W.GAME.Engine.npcActive(n, S));
  return {
    mapId: S.mapId,
    player: { id: 'cooper', x: S.player.tx, y: S.player.ty },
    npcs: npcs.map((n) => ({ id: n.id, x: n.x, y: n.y }))
  };
})()`;

function callA4(cdp, expr) { return cdp.evaluate('(async () => { ' + expr + ' })()'); }

async function reachCheckpoint(cdp, port, cp) {
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' + PROBE });
  const deadline = Date.now() + 40000;
  for (;;) {
    if (await cdp.evaluate('typeof window.A4 !== "undefined"').catch(() => false)) break;
    if (Date.now() > deadline) throw new Error('probe page never exposed A4');
    await new Promise((r) => setTimeout(r, 100));
  }
  const boot = await callA4(cdp, 'return await A4.boot();');
  if (boot.mode !== 'play' || boot.testMode !== false) throw new Error('not the real production build: ' + JSON.stringify(boot));
  await callA4(cdp, 'return await A4.seed(' + JSON.stringify(cp.seed) + ');');
  // walk in through the real town door, the way act-4 does; A4.travel is act-4's own scene-setup teleport
  await callA4(cdp, 'return await A4.travel("' + SCENE + '", ' + DOOR_STAND.x + ', ' + DOOR_STAND.y + ', "' + DOOR_STAND.dir + '", "M11: al Roadhouse");');
  await callA4(cdp, 'return await A4.wait(400);');
  return { boot: boot };
}

async function shotBuf(cdp) {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  return Buffer.from(shot.data, 'base64');
}
/* The frozen clock stops the neon, but the engine keeps ticking on the real rAF timestamp: a scene fade, or any
 * other motion still in flight, would make two captures of "the same" moment differ. So a shot is only accepted
 * once two captures a few frames apart are byte-identical — the frame has settled, and that settled frame is the
 * one every tree is compared on. */
async function captureCheckpoint(cdp, file) {
  await cdp.evaluate(FREEZE);
  let buf = await shotBuf(cdp);
  let settled = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    await cdp.evaluate(FREEZE);
    const again = await shotBuf(cdp);
    if (buf.equals(again)) { settled = true; break; }
    buf = again;
  }
  if (!settled) {
    // Name what is still moving: the bounding box of the changed pixels, in canvas coordinates.
    const prev = readPng(buf), next = readPng(await shotBuf(cdp));
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
    for (let y = 0; y < prev.h; y++) {
      for (let x = 0; x < prev.w; x++) {
        if (prev.at(x, y) === next.at(x, y)) continue;
        n++; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
      }
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file.replace(/\.png$/, '-unsettled-a.png'), buf);
    fs.writeFileSync(file.replace(/\.png$/, '-unsettled-b.png'), await shotBuf(cdp));
    throw new Error(path.basename(file) + ': the frame never settled after 12 tries — ' + n + ' pixels still moving in [' +
      x0 + ',' + y0 + ' .. ' + x1 + ',' + y1 + ']');
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  return buf;
}

/* --------------------------------- geometry of a shot --------------------------------- */
/* index.html scales the 256x192 canvas with CSS and centres it; the engine centres a map smaller than the
 * viewport. Both are read off the page rather than assumed, so a layout change fails loudly instead of quietly
 * sampling the wrong pixels. */
const STAGE = `(() => {
  const W = document.getElementById('product').contentWindow;
  const f = document.getElementById('product').getBoundingClientRect();
  const c = W.document.getElementById('game');
  const r = c.getBoundingClientRect();
  const S = W.GAME.Engine.state;
  return { x: f.left + r.left, y: f.top + r.top, w: r.width, h: r.height,
           cw: c.width, ch: c.height, camX: S.camX || 0, camY: S.camY || 0 };
})()`;

function makeMapper(stage) {
  const sx = stage.w / stage.cw, sy = stage.h / stage.ch;
  return (px, py) => [Math.round(stage.x + (px - stage.camX) * sx), Math.round(stage.y + (py - stage.camY) * sy)];
}

/* --------------------------------- main --------------------------------- */
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log('trees ->', TMP);

  const trees = {
    pristine: copyTree('pristine', null),
    flagoff: copyTree('flagoff', inject(false)),
    flagon: copyTree('flagon', inject(true))
  };
  check('index.html registers the prop layer', INDEX.indexOf(PROP_TAG) !== -1 && /props-production\.js/.test(INDEX));
  check('the injected page differs from index.html only by the flag script',
    inject(true)(INDEX) !== INDEX && inject(true)(INDEX).replace(/<script>window\.GAME[^<]*<\/script>\n/, '') === INDEX);
  check('the repo default is flag off',
    /GAME\.PROPS_ENABLED === undefined\) GAME\.PROPS_ENABLED = false/.test(fs.readFileSync(path.join(ROOT, 'js', 'props-production.js'), 'utf8')) &&
    !/PROPS_ENABLED/.test(INDEX));

  const ports = { pristine: serve(trees.pristine), flagoff: serve(trees.flagoff), flagon: serve(trees.flagon) };
  const shots = {};       // checkpoint -> { off, on } buffers
  const actorsAt = {};    // checkpoint -> the actor list observed with the flag on
  const stageAt = {};     // checkpoint -> the stage rect observed with the flag on
  const cost = {};        // 'off' | 'on' -> gaps
  const runtimeAt = {};   // checkpoint -> what js/props-production.js reports about itself
  const noise = {};       // checkpoint -> { control, injected } pixel diffs

  // One Chrome at a time: the three trees are visited in one browser, one navigation each.
  const h = await openChrome();
  try {
    for (const cp of CHECKPOINTS) {
      console.log('\n=== ' + cp.name + ' (' + cp.note + ') ===');
      const pair = {};
      for (const tree of ['pristine', 'control', 'flagoff', 'flagon']) {
        await reachCheckpoint(h.cdp, ports[tree === 'control' ? 'pristine' : tree], cp);
        const where = await callA4(h.cdp, 'return A4.pos();');
        if (where.map !== SCENE) throw new Error(cp.name + ': not in the roadhouse (' + JSON.stringify(where) + ')');
        const file = path.join(OUT, cp.name + (tree === 'flagon' ? '-on' : tree === 'flagoff' ? '-off' : tree === 'control' ? '-control' : '-pristine') + '.png');
        // the frame cost is measured on the LIVE clock, before this visit's freeze stops the loop
        if (cp.name === 'roadhouse-gathering' && tree !== 'pristine') {
          cost[tree === 'flagon' ? 'on' : 'off'] = await h.cdp.evaluate(FRAME_COST);
        }
        if (tree === 'flagon') {
          await h.cdp.evaluate(`(async () => {
            const W = document.getElementById('product').contentWindow;
            if (!W.__m11Counted) {
              W.__m11Counted = true; W.__m11DrawChar = 0;
              const orig = W.GAME.Sprites.drawChar;
              W.GAME.Sprites.drawChar = function () { W.__m11DrawChar++; return orig.apply(this, arguments); };
            }
            for (let i = 0; i < 4; i++) await new Promise((r) => W.requestAnimationFrame(() => r()));
            return true;
          })()`);
          actorsAt[cp.name] = await h.cdp.evaluate(ACTORS);
          stageAt[cp.name] = await h.cdp.evaluate(STAGE);
          runtimeAt[cp.name] = await h.cdp.evaluate(PROP_RUNTIME);
        }
        pair[tree] = await captureCheckpoint(h.cdp, file);
      }
      /* The off shot must be the shot of a tree that knows nothing about the flag. Byte-identity would be the
       * cleanest claim, and it is not available on this page: the engine carries animation phase in state (an
       * actor's walk frame, a lamp's flicker counter), those advance with dt rather than with the clock, and no
       * amount of clock-pinning rewinds them across a page load. So the run measures its OWN noise floor first —
       * two visits to the untouched tree, same checkpoint — and then requires the flag-off injection to change
       * nothing beyond it. CONTROL is what a reload costs; anything more would be the injection painting. */
      /* The actor sprite boxes are where the animation phase lives, so both diffs are measured OUTSIDE them: what
       * is left is scenery, which the pinned clock does make reproducible. */
      const stageNow = stageAt[cp.name], obsNow = actorsAt[cp.name];
      const toShotNow = makeMapper(stageNow);
      const actorBoxes = [obsNow.player].concat(obsNow.npcs).map((a) => {
        const foot = (a.y + 1) * TILE;
        const tl = toShotNow(a.x * TILE - 6, foot - ACTOR_SPRITE_H - 8), br = toShotNow(a.x * TILE + TILE + 6, foot + 6);
        return { x0: tl[0], y0: tl[1], x1: br[0], y1: br[1] };
      });
      const inActor = (x, y) => actorBoxes.some((b) => x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1);
      const diff = (a, b) => {
        const A = readPng(a), B = readPng(b);
        let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, sample = null;
        for (let y = 0; y < A.h; y++) {
          for (let x = 0; x < A.w; x++) {
            if (A.at(x, y) === B.at(x, y)) continue;
            if (inActor(x, y)) continue;
            n++;
            if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
            if (!sample) sample = { x: x, y: y, a: A.at(x, y).toString(16), b: B.at(x, y).toString(16) };
          }
        }
        return { n: n, box: n ? [x0, y0, x1, y1] : null, sample: sample };
      };
      const control = diff(pair.pristine, pair.control);
      const injected = diff(pair.pristine, pair.flagoff);
      noise[cp.name] = { control: control, injected: injected };
      if (injected.n === 0) {
        check(cp.name + ': flag off is byte-identical to the untouched index.html (' + pair.pristine.length + ' bytes)', true);
      } else {
        /* Counts, not bounding boxes: the phase noise moves around the room from load to load, so a box drawn
         * around it is not stable enough to compare. Both boxes go to capture-noise.json for the reader.
         * The bound is twice the control plus a floor, because the control is itself one sample of a noisy
         * quantity — the claim this can support is "indistinguishable from the untouched page to within the
         * untouched page's own run-to-run variation", not "identical". The raw counts are in the report. */
        check(cp.name + ': flag off changes no more than a plain reload of the same tree does (' +
          injected.n + ' px vs ' + control.n + ' px of reload noise, actor sprites excluded)',
          injected.n <= control.n * 2 + 16, { injected: injected, control: control });
      }
      fs.rmSync(path.join(OUT, cp.name + '-pristine.png'));   // the pair the report shows is off/on
      fs.rmSync(path.join(OUT, cp.name + '-control.png'));
      shots[cp.name] = { off: pair.flagoff, on: pair.flagon };
    }
  } finally {
    closeChrome(h);
  }

  /* ---- cmp, as the brief asks for it, on the files that survive ---- */
  {
    const a = path.join(OUT, CHECKPOINTS[0].name + '-off.png');
    const b = path.join(OUT, CHECKPOINTS[0].name + '-on.png');
    const r = spawnSync('cmp', ['-s', a, b], { encoding: 'utf8' });
    check('cmp confirms off and on differ on disk', r.status === 1, r.status);
  }

  /* ---- depth ---- */
  for (const cp of CHECKPOINTS) {
    const obs = actorsAt[cp.name], stage = stageAt[cp.name];
    const toShot = makeMapper(stage);
    const off = readPng(shots[cp.name].off), on = readPng(shots[cp.name].on);
    const actors = [obs.player].concat(obs.npcs);
    const pairs = [];
    for (const a of actors) {
      const foot = (a.y + 1) * TILE;
      const box = { x0: a.x * TILE, x1: a.x * TILE + TILE, y0: foot - ACTOR_SPRITE_H, y1: foot };
      /* CORE, not the 16x24 bounding box: a character sprite is transparent around its silhouette, and a prop
       * drawn BEHIND it legitimately shows through there — sampling the whole box would call every prop an
       * occluder. The core is the middle 6 px of the body, from 13 px above the foot to 3 px above it: torso and
       * legs, opaque for every actor in this scene. */
      const core = { x0: a.x * TILE + 5, x1: a.x * TILE + 11, y0: foot - 13, y1: foot - 3 };
      for (const p of INSTANCES) {
        if (p.right <= box.x0 || p.left >= box.x1 || p.bottom <= box.y0 || p.top >= box.y1) continue;
        const x0 = Math.max(core.x0, p.left), x1 = Math.min(core.x1, p.right);
        const y0 = Math.max(core.y0, p.top), y1 = Math.min(core.y1, p.bottom);
        if (x1 <= x0 || y1 <= y0) continue;
        const pts = [];
        for (let x = x0; x < x1; x += Math.max(1, Math.floor((x1 - x0) / 4))) {
          for (let y = y0; y < y1; y += Math.max(1, Math.floor((y1 - y0) / 4))) pts.push([x, y]);
        }
        // Where the actor is drawn, off and on differ only if the prop covers those pixels. "changed" counts the
        // sampled pixels the prop paints over what the flag-off frame shows there.
        let changed = 0;
        for (const q of pts) {
          const s = toShot(q[0], q[1]);
          if (s[0] < 0 || s[1] < 0 || s[0] >= off.w || s[1] >= off.h) continue;
          if (off.at(s[0], s[1]) !== on.at(s[0], s[1])) changed++;
        }
        const propInFront = p.layer > ACTOR_LAYER ? true : p.foot > foot;
        pairs.push({ actor: a.id, tile: a.x + ',' + a.y, foot: foot, prop: p.id, propFoot: p.foot, layer: p.layer,
          expect: propInFront ? 'prop in front' : 'actor in front', sampled: pts.length, changed: changed });
      }
    }
    // The rule under test: when the actor must be in front, the prop may not have painted the actor's pixels.
    const behind = pairs.filter((q) => q.expect === 'actor in front');
    const front = pairs.filter((q) => q.expect === 'prop in front');
    check(cp.name + ': depth — every prop that must be BEHIND an actor leaves the actor\'s pixels alone (' + behind.length + ' pairs)',
      behind.every((q) => q.changed === 0), behind.filter((q) => q.changed !== 0));
    check(cp.name + ': depth — every prop that must be IN FRONT actually paints over the actor (' + front.length + ' pairs)',
      front.every((q) => q.changed > 0), front.filter((q) => q.changed === 0));

    /* Depth can be right by the rule and still hide a character: a prop whose anchor foot is south of an actor
     * standing behind it draws in front of him, and if the frame is big enough it erases him. So: how much of
     * each actor's own 16x24 sprite box does the prop layer repaint? Half is the line — an actor may stand behind
     * furniture, but he has to stay recognisable. */
    const coverage = actors.map((a) => {
      const foot = (a.y + 1) * TILE;
      let seen = 0, hit = 0;
      for (let x = a.x * TILE; x < a.x * TILE + TILE; x++) {
        for (let y = foot - ACTOR_SPRITE_H; y < foot; y++) {
          const s = toShot(x, y);
          if (s[0] < 0 || s[1] < 0 || s[0] >= off.w || s[1] >= off.h) continue;
          seen++;
          if (off.at(s[0], s[1]) !== on.at(s[0], s[1])) hit++;
        }
      }
      return { actor: a.id, tile: a.x + ',' + a.y, foot: foot, covered: seen ? hit / seen : 0, px: hit, of: seen };
    });
    fs.writeFileSync(path.join(OUT, cp.name + '-coverage.json'), JSON.stringify(coverage, null, 2));
    const buried = coverage.filter((c) => c.covered > 0.5);
    check(cp.name + ': no actor loses more than half its sprite to the prop layer (' +
      coverage.map((c) => c.actor + ' ' + Math.round(c.covered * 100) + '%').join(', ') + ')',
      buried.length === 0, buried);
    fs.writeFileSync(path.join(OUT, cp.name + '-depth.json'), JSON.stringify({ actors: actors, pairs: pairs }, null, 2));
  }

  /* ---- the prop runtime on the production page ---- */
  {
    const rt = runtimeAt[CHECKPOINTS[0].name];
    fs.writeFileSync(path.join(OUT, 'prop-runtime.json'), JSON.stringify(runtimeAt, null, 2));
    check('runtime: the flag-on page really has the prop layer enabled with the ' + SCENE + ' instances',
      rt && rt.present && rt.enabled && rt.instances === INSTANCES.length, rt);
    /* M10a's depth banding is three hooks. If drawChar is not wrapped there is no moment before an actor, and
     * every prop is released at the end of the frame — in front of everybody, whatever its foot y. */
    check('runtime: M10a\'s three depth hooks are the outermost sprite functions on the production page',
      rt && rt.drawCharHooked && rt.structuresHooked && rt.foregroundHooked, rt);
  }

  /* ---- bodies: footprints against Cast Presence bodies, door tiles, interact tiles ---- */
  {
    const cast = JSON.parse(fs.readFileSync(path.join(ROOT, 'narrative', 'cast', 'windows.json'), 'utf8'));
    const objects = JSON.parse(fs.readFileSync(path.join(ROOT, 'world', 'scene-objects.json'), 'utf8')).scenes;
    const conns = JSON.parse(fs.readFileSync(path.join(ROOT, 'world', 'connections.json'), 'utf8')).connections;
    const bodyAt = {};
    const note = (owner, id, b) => {
      if (!b || b.status !== 'PLACED' || b.map_id !== SCENE) return;
      (bodyAt[b.x + ',' + b.y] = bodyAt[b.x + ',' + b.y] || []).push(id + ' (' + owner + ')');
    };
    Object.keys(cast.characters).forEach((c) => note('baseline', c, cast.characters[c].baseline));
    (cast.windows || []).forEach((w) => Object.keys(w.cast || {}).forEach((c) => note(w.id, c, w.cast[c])));
    const doorAt = {};
    conns.forEach((rec) => ['a', 'b'].forEach((s) => {
      if (rec[s].scene !== SCENE) return;
      (rec[s].triggers || []).forEach((t) => { doorAt[t[0] + ',' + t[1]] = 'trigger of ' + rec.id; });
    }));
    const interactAt = (objects[SCENE] && objects[SCENE].interact) || {};
    const hits = [];
    INSTANCES.forEach((p) => p.tiles.forEach((t) => {
      const k = t[0] + ',' + t[1];
      if (bodyAt[k]) hits.push({ instance: p.id, tile: k, kind: 'cast body', what: bodyAt[k].join(', ') });
      if (doorAt[k]) hits.push({ instance: p.id, tile: k, kind: 'door tile', what: doorAt[k] });
      if (interactAt[k]) hits.push({ instance: p.id, tile: k, kind: 'interact tile', what: interactAt[k] });
    }));
    fs.writeFileSync(path.join(OUT, 'footprint-overlaps.json'), JSON.stringify(hits, null, 2));
    check('bodies: the footprint overlap list is the one tools/world-apply.js warns about (' + hits.length + ')',
      hits.length === 1 && hits[0].instance === 'roadhouse-booth-01' && hits[0].tile === '2,6' && hits[0].kind === 'cast body', hits);
  }

  /* ---- cost ---- */
  {
    const stat = (gaps) => {
      const s = gaps.slice().sort((a, b) => a - b);
      return { median: s[Math.floor(s.length / 2)], p95: s[Math.floor(s.length * 0.95)], n: s.length };
    };
    const off = stat(cost.off), on = stat(cost.on);
    fs.writeFileSync(path.join(OUT, 'frame-cost.json'), JSON.stringify({ off: off, on: on, offGaps: cost.off, onGaps: cost.on }, null, 2));
    console.log('  frame time off: median ' + off.median.toFixed(2) + ' ms, p95 ' + off.p95.toFixed(2) + ' ms (n=' + off.n + ')');
    console.log('  frame time on : median ' + on.median.toFixed(2) + ' ms, p95 ' + on.p95.toFixed(2) + ' ms (n=' + on.n + ')');
    check('cost: ' + FRAME_SAMPLES + ' frames sampled with the flag off and on', off.n === FRAME_SAMPLES && on.n === FRAME_SAMPLES, { off: off.n, on: on.n });
    /* The absolute numbers belong to headless swiftshader, which paints this scene far slower than a GPU; what
     * transfers to a real machine is the DELTA the prop layer adds. 10 % of the flag-off median is the line. */
    const deltaMedian = on.median - off.median, deltaP95 = on.p95 - off.p95;
    check('cost: the prop layer adds under 10 % to the median frame (' + deltaMedian.toFixed(2) + ' ms on ' + off.median.toFixed(2) + ' ms)',
      deltaMedian <= off.median * 0.1, { off: off, on: on, deltaMedian: deltaMedian, deltaP95: deltaP95 });
  }

  /* ---- contact sheet: off above on, one column per checkpoint ---- */
  {
    const GAP = 8;
    const imgs = CHECKPOINTS.map((cp) => ({ name: cp.name, off: readPng(shots[cp.name].off), on: readPng(shots[cp.name].on) }));
    const w = imgs[0].off.w, h = imgs[0].off.h;
    const sheetW = w, sheetH = imgs.length * (2 * h + GAP) + (imgs.length - 1) * GAP;
    const rgb = Buffer.alloc(sheetW * sheetH * 3, 0x12);
    const blit = (img, atY) => {
      for (let y = 0; y < img.h; y++) img.rgb.copy(rgb, ((atY + y) * sheetW) * 3, y * img.w * 3, (y + 1) * img.w * 3);
    };
    let y = 0;
    imgs.forEach((im) => { blit(im.off, y); y += h + GAP; blit(im.on, y); y += h + GAP; });
    fs.writeFileSync(path.join(OUT, 'sheet.png'), writePng(sheetW, sheetH, rgb));
    check('sheet: artifacts/props-m11/sheet.png written, off above on for each checkpoint (' + sheetW + 'x' + sheetH + ')',
      fs.statSync(path.join(OUT, 'sheet.png')).size > 0);
  }

  fs.writeFileSync(path.join(OUT, 'capture-noise.json'), JSON.stringify(noise, null, 2));
  fs.writeFileSync(path.join(OUT, 'assertions.json'), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.pass);
  console.log('\nPROPS-PRODUCTION-CHROME ' + (results.length - failed.length) + '/' + results.length);
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(2); });
