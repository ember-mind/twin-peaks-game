#!/usr/bin/env node
'use strict';

/* Real Chrome/CDP evidence for the production Double R location slice.
 * This deliberately captures the 256x192 game canvas, not a scaled page
 * screenshot. Movement is sent through CDP Input.dispatchKeyEvent and the
 * stationary reel is sampled while the normal requestAnimationFrame loop runs.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { keyParams } = require('./lib/playable-browser.js');

const DEFAULT_ROOT = path.resolve(__dirname, '..');
const ROUTE_PAGE = '/test/double-r-location.html?clean=1';
const CANONICAL_PAGE = '/test/retro-scene.html?map=diner&x=6&y=8&dir=up&narrative=1';
const DEFAULT_OUTPUT = path.join(DEFAULT_ROOT, 'artifacts', 'intent-room-double-r-art', 'cdp-real-01');
const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'
].filter(Boolean);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json'
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parse(argv) {
  const out = { root: DEFAULT_ROOT, output: DEFAULT_OUTPUT, durationMs: 30000, sampleMs: 1000, chrome: null, noVideo: false, canonicalOnly: false, rebuildVideo: null };
  for (const arg of argv) {
    if (arg.startsWith('--root=')) out.root = path.resolve(arg.slice(7));
    else if (arg.startsWith('--output=')) out.output = path.resolve(arg.slice(9));
    else if (arg.startsWith('--duration-ms=')) out.durationMs = Number(arg.slice(14));
    else if (arg.startsWith('--sample-ms=')) out.sampleMs = Number(arg.slice(12));
    else if (arg.startsWith('--chrome=')) out.chrome = arg.slice(9);
    else if (arg === '--no-video') out.noVideo = true;
    else if (arg === '--canonical-only') out.canonicalOnly = true;
    else if (arg.startsWith('--rebuild-video=')) out.rebuildVideo = path.resolve(arg.slice(16));
    else if (arg === '--help' || arg === '-h') {
      console.log('node test/double-r-real-cdp-capture.js [--root=DIR] [--output=DIR] [--duration-ms=30000] [--sample-ms=1000] [--chrome=PATH] [--no-video] [--canonical-only]');
      process.exit(0);
    } else throw new Error(`unknown option: ${arg}`);
  }
  if (!Number.isInteger(out.durationMs) || out.durationMs < 30000 || out.durationMs > 45000) {
    throw new Error('--duration-ms must be an integer in 30000..45000');
  }
  if (!Number.isInteger(out.sampleMs) || out.sampleMs < 250 || out.sampleMs > 5000) {
    throw new Error('--sample-ms must be an integer in 250..5000');
  }
  return out;
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function serve(root) {
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent((req.url || '/').split('?')[0]);
      if (pathname.includes('..') || pathname.includes('\\')) { res.writeHead(403).end(); return; }
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      const stat = await fsp.stat(file);
      if (!stat.isFile()) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Content-Length': stat.size, 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    } catch (_) { if (!res.headersSent) res.writeHead(404); res.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

function findChrome(explicit) {
  const names = explicit ? [explicit] : CHROME_CANDIDATES;
  for (const name of names) if (fs.existsSync(name)) return name;
  throw new Error('Chrome not found; pass --chrome=/path/to/Google Chrome');
}

class Cdp {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP connect timeout')), 15000);
      this.ws.onopen = () => { clearTimeout(timer); resolve(); };
      this.ws.onerror = () => { clearTimeout(timer); reject(new Error('CDP socket error')); };
    });
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const item = this.pending.get(message.id); this.pending.delete(message.id); clearTimeout(item.timer);
      if (message.error) item.reject(new Error(`${item.method}: ${message.error.message}`));
      else item.resolve(message.result || {});
    };
    this.ws.onclose = () => this.rejectPending(new Error('CDP socket closed'));
  }
  rejectPending(error) {
    for (const item of this.pending.values()) { clearTimeout(item.timer); item.reject(error); }
    this.pending.clear();
  }
  send(method, params = {}, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression, timeoutMs = 15000) {
    const result = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true, allowUnsafeEvalBlockedByCSP: true
    }, timeoutMs);
    if (result.exceptionDetails) throw new Error(`page evaluation failed: ${result.exceptionDetails.text || 'exception'}`);
    return result.result && result.result.value;
  }
  close() { this.rejectPending(new Error('CDP closed')); try { this.ws.close(); } catch (_) {} }
}

async function waitForJson(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { const response = await fetch(url); if (response.ok) return await response.json(); } catch (_) {}
    await sleep(60);
  }
  throw new Error(`DevTools endpoint timeout: ${url}`);
}

function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }
function pngSize(buffer) {
  if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw new Error('capture is not PNG');
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}
function assertDetailedFrame(file) {
  const result = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'frame-gates', 'pixel-gates.js'),
    file, '--rect=0,0,255,191'], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`pixel gate failed: ${(result.stderr || '').trim()}`);
  const measure = JSON.parse(result.stdout);
  if (measure.colors < 20 || measure.nonBasePct < 5) {
    throw new Error(`flat/blank canonical frame: ${JSON.stringify(measure)}`);
  }
  return { colors: measure.colors, nonBasePct: measure.nonBasePct };
}
function renderMeasuredVideo(output, frames, fallbackMs) {
  if (frames.length < 2 || spawnSync('which', ['ffmpeg'], { encoding: 'utf8' }).status !== 0) return null;
  const stationaryDir = path.join(output, 'stationary');
  const list = path.join(stationaryDir, 'frames.ffconcat');
  const entries = frames.map((frame, index) => {
    const next = frames[index + 1];
    const previous = frames[index - 1];
    const intervalMs = next ? next.elapsedMs - frame.elapsedMs
      : previous ? frame.elapsedMs - previous.elapsedMs : fallbackMs;
    return `file '${path.resolve(output, frame.file).replace(/'/g, "'\\''")}'\nduration ${(intervalMs / 1000).toFixed(3)}`;
  }).join('\n');
  const lastFile = path.resolve(output, frames[frames.length - 1].file).replace(/'/g, "'\\''");
  fs.writeFileSync(list, `ffconcat version 1.0\n${entries}\nfile '${lastFile}'\n`);
  const video = path.join(stationaryDir, 'stationary.mp4');
  const result = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
    '-vsync', 'vfr', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', video], { encoding: 'utf8' });
  if (result.status !== 0 || !fs.existsSync(video) || fs.statSync(video).size <= 1000) {
    throw new Error(`ffmpeg failed: ${(result.stderr || '').trim()}`);
  }
  return path.relative(output, video);
}
function snapshotExpression() {
  return `(() => {
    const api = window.__LOCATION_PREVIEW__, s = api && api.snapshot();
    const map = s && window.GAME && GAME.Maps && GAME.Maps[s.mapId];
    const rows = map && map.rows || [];
    const solid = rows.map((row, y) => Array.from(row, (_, x) => GAME.Maps.isSolid(s.mapId, x, y, GAME.Engine.state) ? 1 : 0));
    const canvas = document.getElementById('game');
    return { snapshot: s, rows, solid,
      canvas: canvas ? { width: canvas.width, height: canvas.height,
        css: (() => { const r = canvas.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })() } : null,
      viewport: [innerWidth, innerHeight], hidden: document.hidden, perfNow: performance.now() };
  })()`;
}
function canonicalSnapshotExpression() {
  return `(() => {
    const s = window.GAME && GAME.Engine && GAME.Engine.state;
    const p = s && s.player;
    const canvas = document.getElementById('game');
    let cast = null;
    try { if (GAME.CastPresence && GAME.CastPresence.where) cast = GAME.CastPresence.where(); } catch (_) {}
    return { ready: /TP-RETRO-READY diner/.test(document.title), title: document.title,
      mapId: s && s.mapId, mode: s && s.mode, fadePhase: s && s.fadePhase,
      player: p && {tx: p.tx, ty: p.ty, dir: p.dir, moving: !!p.moving},
      npcs: (s && s.npcs || []).map((n) => ({id: n.id, x: n.x, y: n.y, dir: n.dir, moving: !!n.moving,
        homeX: n.homeX, homeY: n.homeY})), cast,
      canvas: canvas ? {width: canvas.width, height: canvas.height,
        css: (() => { const r = canvas.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })() } : null,
      viewport: [innerWidth, innerHeight], hidden: document.hidden, perfNow: performance.now() };
  })()`;
}
function runtimeSummaryExpression() {
  return `(() => {
    const observer = window.__DOUBLE_R_CDP_RAF__ || {};
    const ambient = window.GAME && GAME.AmbientLife && GAME.AmbientLife.snapshot
      ? GAME.AmbientLife.snapshot('diner') : {time: 0, items: []};
    const character = window.GAME && GAME.CharacterActivity && GAME.CharacterActivity.snapshot
      ? GAME.CharacterActivity.snapshot() : {time: 0, items: []};
    const compact = (items) => (items || []).map((item) => ({id: item.id, active: !!item.active,
      frame: item.frame, events: item.events || 0, cycles: item.cycles || 0}));
    return { raf: { count: observer.count || 0, first: observer.first || null, last: observer.last || null },
      ambient: { time: ambient.time || 0, items: compact(ambient.items) },
      character: { time: character.time || 0, items: compact(character.items) } };
  })()`;
}
function nativeFrameExpression(mode = 'route') {
  return `(() => {
    const canvas = document.getElementById('game');
    const value = ${mode === 'canonical' ? canonicalSnapshotExpression() : 'window.__LOCATION_PREVIEW__.snapshot()'};
    const runtime = (${runtimeSummaryExpression()});
    return { png: canvas.toDataURL('image/png'), state: value, runtime, perfNow: performance.now(),
      hidden: document.hidden, canvas: [canvas.width, canvas.height], viewport: [innerWidth, innerHeight] };
  })()`;
}

async function main() {
  const options = parse(process.argv.slice(2));
  if (options.rebuildVideo) {
    const manifestFile = path.join(options.rebuildVideo, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    if (manifest.status !== 'PASS') throw new Error(`cannot rebuild failed capture: ${manifestFile}`);
    manifest.stationary.video = renderMeasuredVideo(options.rebuildVideo, manifest.stationary.frames,
      manifest.stationary.sampleMs);
    manifest.stationary.videoTiming = 'measured elapsedMs per native frame';
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
    console.log(JSON.stringify({ output: options.rebuildVideo, video: manifest.stationary.video }));
    return;
  }
  const root = options.root;
  if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error(`root has no index.html: ${root}`);
  const output = options.output;
  if (fs.existsSync(output)) throw new Error(`refusing existing output directory: ${output}`);
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.mkdirSync(output);
  const stationaryDir = path.join(output, 'stationary'); fs.mkdirSync(stationaryDir);
  const routeDir = path.join(output, 'route'); fs.mkdirSync(routeDir);
  const canonicalDir = path.join(output, 'canonical'); fs.mkdirSync(canonicalDir);
  const manifest = {
    format: 'double-r-real-cdp-evidence.v2', status: 'running', source: {},
    pages: { route: ROUTE_PAGE, canonical: CANONICAL_PAGE },
    viewport: { css: [256, 192], native: [256, 192], deviceScaleFactor: 1 },
    chromeFlags: ['--headless=new', '--mute-audio', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
    stationary: { durationRequestedMs: options.durationMs, sampleMs: options.sampleMs, frames: [], uniqueFrameCount: 0 },
    route: { input: 'CDP Input.dispatchKeyEvent', events: [], milestones: [], skipped: options.canonicalOnly },
    limits: ['Route proof uses the existing test/double-r-location.html slice; canonical stationary proof uses retro-scene.html with the narrative stack.',
      'Frames are direct #game canvas.toDataURL PNGs; no compositor scaling or seeking is used.',
      'Video is optional and only created when ffmpeg is available.']
  };
  manifest.source.root = root;
  manifest.source.head = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  manifest.source.status = spawnSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' }).stdout;
  const chrome = findChrome(options.chrome);
  const http = await serve(root);
  const devPort = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-double-r-cdp-'));
  const chromeLog = path.join(profile, 'chrome.log');
  const logFd = fs.openSync(chromeLog, 'w');
  const child = spawn(chrome, [
    '--headless=new', '--mute-audio', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    `--remote-debugging-port=${devPort}`, '--remote-debugging-address=127.0.0.1', `--user-data-dir=${profile}`,
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'
  ], { stdio: ['ignore', logFd, logFd] });
  let cdp;
  const startedAt = Date.now();
  const now = () => Date.now() - startedAt;
  const saveManifest = () => fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const readState = () => cdp.evaluate(snapshotExpression());
  const readCanonicalState = () => cdp.evaluate(canonicalSnapshotExpression());
  async function waitFor(label, predicate, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs; let last;
    while (Date.now() < deadline) { last = await readState(); if (predicate(last)) return last; await sleep(50); }
    throw new Error(`timeout waiting for ${label}: ${JSON.stringify(last && last.snapshot)}`);
  }
  async function waitForCanonical(label, predicate, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs; let last;
    while (Date.now() < deadline) { last = await readCanonicalState(); if (predicate(last)) return last; await sleep(50); }
    throw new Error(`timeout waiting for ${label}: ${JSON.stringify(last)}`);
  }
  async function installRafObserver() {
    await cdp.evaluate(`(() => {
      if (window.__DOUBLE_R_CDP_RAF__) return true;
      const observer = { count: 0, first: null, last: null };
      function tick(timestamp) {
        observer.count++;
        if (observer.first === null) observer.first = timestamp;
        observer.last = timestamp;
        requestAnimationFrame(tick);
      }
      window.__DOUBLE_R_CDP_RAF__ = observer;
      requestAnimationFrame(tick);
      return true;
    })()`);
  }
  // A changed direction spends a short turn-in-place window before walking.
  // Keep the real key held long enough for that window; retry a tap if Chrome
  // delivers keyup just before the next game tick under renderer load.
  async function press(code, holdMs = 220) {
    const params = keyParams(code);
    for (let attempt = 1; attempt <= 3; attempt++) {
      const before = await readState();
      await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...params });
      await sleep(holdMs);
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
      try {
        const after = await waitFor(`movement after ${code}`, (state) => {
          const a = state.snapshot, b = before.snapshot;
          return a && b && (a.mapId !== b.mapId || a.player.tx !== b.player.tx || a.player.ty !== b.player.ty) &&
            !a.player.moving && a.fadePhase === 0;
        }, 2500);
        manifest.route.events.push({ elapsedMs: now(), type: 'input', code, holdMs, attempts: attempt,
          before: before.snapshot, after: after.snapshot });
        return after;
      } catch (error) {
        if (attempt === 3) throw error;
        await sleep(80);
      }
    }
    throw new Error(`unreachable input retry: ${code}`);
  }
  async function captureNative(label, dir, prefix = '', mode = 'route') {
    const value = await cdp.evaluate(nativeFrameExpression(mode));
    const buffer = Buffer.from(String(value.png).split(',')[1], 'base64');
    const size = pngSize(buffer); if (size[0] !== 256 || size[1] !== 192) throw new Error(`${label}: native canvas is ${size}`);
    const name = `t+${String(now()).padStart(6, '0')}ms-${prefix}${label}.png`;
    fs.writeFileSync(path.join(dir, name), buffer, { flag: 'wx' });
    return { file: path.relative(output, path.join(dir, name)), sha256: sha256(buffer), bytes: buffer.length,
      size, capturedAt: new Date().toISOString(), elapsedMs: now(), state: value.state,
      canvas: value.canvas, viewport: value.viewport, hidden: value.hidden, pagePerfNow: value.perfNow,
      runtime: value.runtime };
  }
  async function walkTo(target) {
    const directions = [['ArrowUp', 0, -1], ['ArrowRight', 1, 0], ['ArrowDown', 0, 1], ['ArrowLeft', -1, 0]];
    let state = await readState(); const start = state.snapshot.player;
    const queue = [[start.tx, start.ty]], seen = new Set([`${start.tx},${start.ty}`]), prev = new Map();
    while (queue.length) {
      const [x, y] = queue.shift(); if (x === target[0] && y === target[1]) break;
      for (const [code, dx, dy] of directions) {
        const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
        if (ny < 0 || nx < 0 || ny >= state.solid.length || nx >= (state.solid[ny] || []).length ||
            state.solid[ny][nx] || seen.has(key)) continue;
        seen.add(key); prev.set(key, { from: `${x},${y}`, code }); queue.push([nx, ny]);
      }
    }
    const goal = `${target[0]},${target[1]}`; if (!seen.has(goal)) throw new Error(`target unreachable: ${goal}`);
    const codes = []; let key = goal;
    while (key !== `${start.tx},${start.ty}`) { const step = prev.get(key); codes.push(step.code); key = step.from; }
    codes.reverse();
    for (const code of codes) state = await press(code);
    return state;
  }
  async function settleCapture(label, state, prefix = '') {
    await sleep(450);
    const entry = await captureNative(label, routeDir, prefix);
    manifest.route.milestones.push({ label, elapsedMs: now(), state: state.snapshot, frame: entry.file });
    return entry;
  }
  try {
    await cdp?.close?.();
    const targets = await waitForJson(`http://127.0.0.1:${devPort}/json/list`, 20000);
    const page = targets.find((item) => item.type === 'page'); if (!page) throw new Error('no Chrome page target');
    cdp = new Cdp(page.webSocketDebuggerUrl); await cdp.connect();
    await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 256, height: 192, screenWidth: 256, screenHeight: 192, deviceScaleFactor: 1, mobile: false });
    if (!options.canonicalOnly) {
      await cdp.send('Page.navigate', { url: `${http.url}${ROUTE_PAGE}` });
      await waitFor('Double R controller boot', (state) => state.snapshot && state.snapshot.ready && state.canvas &&
        state.canvas.width === 256 && state.canvas.height === 192 && state.viewport[0] === 256 && state.viewport[1] === 192);
      await installRafObserver();
      let state = await cdp.evaluate('window.__LOCATION_PREVIEW__.reset()').then(() => readState());
      await settleCapture('exterior', state, 'canonical-');
      for (let i = 0; i < 8 && state.snapshot.mapId !== 'diner'; i++) state = await press('ArrowUp');
      if (state.snapshot.mapId !== 'diner') throw new Error('real CDP entrance did not reach diner');
      await settleCapture('entrance', state, 'canonical-');
      state = await walkTo([6, 5]);
      await settleCapture('counter', state);
      // [4,7] is the walkable aisle directly south/east of the left booths;
      // [2,7] is the authored solid booth backrest.
      state = await walkTo([4, 7]);
      await settleCapture('booths', state);
      state = await walkTo([6, 8]);
      state = await press('ArrowDown');
      await waitFor('real CDP exit to exterior', (s) => s.snapshot.mapId === 'double_r_exterior_prototype' && !s.snapshot.player.moving && s.snapshot.fadePhase === 0);
      state = await readState(); await settleCapture('exit', state, 'canonical-');
      manifest.route.finalState = state.snapshot;
    }

    // The route slice intentionally has no Cast Presence bootstrap. Switch to
    // the production retro-scene harness for the canonical populated diner
    // reel, while retaining the same real CDP canvas capture and rAF probe.
    await cdp.send('Page.navigate', { url: `${http.url}${CANONICAL_PAGE}` });
    let canonicalState = await waitForCanonical('canonical populated diner', (s) =>
      s.ready && s.mapId === 'diner' && s.mode === 'play' && s.canvas &&
      s.canvas.width === 256 && s.canvas.height === 192);
    if (!canonicalState.npcs.length) throw new Error('canonical retro-scene diner has no Cast Presence bodies');
    await installRafObserver();
    await sleep(750);
    canonicalState = await readCanonicalState();
    const canonicalFrame = await captureNative('diner', canonicalDir, 'canonical-', 'canonical');
    manifest.canonical = { page: CANONICAL_PAGE, state: canonicalState, frame: canonicalFrame.file,
      castBodies: canonicalState.npcs,
      pixelGate: assertDetailedFrame(path.join(output, canonicalFrame.file)) };

    const stationaryStartedAt = now();
    const stationaryStart = await readCanonicalState();
    const runtimeStart = await cdp.evaluate(runtimeSummaryExpression());
    await sleep(450);
    const stationary = []; const deadline = Date.now() + options.durationMs;
    while (Date.now() < deadline) {
      const remaining = Math.min(options.sampleMs, Math.max(0, deadline - Date.now()));
      await sleep(remaining || 1);
      const frame = await captureNative('stationary', stationaryDir, '', 'canonical');
      stationary.push(frame);
    }
    const stationaryEndedAt = now();
    const stationaryEnd = await readCanonicalState();
    const runtimeEnd = await cdp.evaluate(runtimeSummaryExpression());
    const hashes = new Set(stationary.map((frame) => frame.sha256));
    manifest.stationary.frames = stationary; manifest.stationary.uniqueFrameCount = hashes.size;
    manifest.stationary.startState = stationaryStart; manifest.stationary.endState = stationaryEnd;
    manifest.stationary.startedAtElapsedMs = stationaryStartedAt;
    manifest.stationary.endedAtElapsedMs = stationaryEndedAt;
    manifest.stationary.durationMeasuredMs = stationaryEndedAt - stationaryStartedAt;
    manifest.stationary.runtime = { start: runtimeStart, end: runtimeEnd,
      rAF: { countDelta: runtimeEnd.raf.count - runtimeStart.raf.count,
        elapsedMs: (runtimeEnd.raf.last || 0) - (runtimeStart.raf.last || 0) } };
    manifest.stationary.invariant = {
      sameMap: stationary.every((frame) => frame.state.mapId === 'diner'),
      stationaryPlayer: stationary.every((frame) => frame.state.player.tx === stationaryStart.player.tx && frame.state.player.ty === stationaryStart.player.ty && !frame.state.player.moving),
      noFade: stationary.every((frame) => frame.state.fadePhase === 0),
      nativeSize: stationary.every((frame) => frame.size[0] === 256 && frame.size[1] === 192),
      visible: stationary.every((frame) => frame.hidden === false),
      changedPixels: hashes.size > 1,
      rAFAdvanced: runtimeEnd.raf.count > runtimeStart.raf.count,
      ambientClockAdvanced: runtimeEnd.ambient.time > runtimeStart.ambient.time,
      characterClockAdvanced: runtimeEnd.character.time > runtimeStart.character.time
    };
    if (!manifest.stationary.invariant.sameMap || !manifest.stationary.invariant.stationaryPlayer ||
        !manifest.stationary.invariant.noFade || !manifest.stationary.invariant.changedPixels ||
        !manifest.stationary.invariant.rAFAdvanced || !manifest.stationary.invariant.ambientClockAdvanced ||
        !manifest.stationary.invariant.characterClockAdvanced) {
      throw new Error(`stationary invariant failed: ${JSON.stringify(manifest.stationary.invariant)}`);
    }
    if (!options.noVideo) {
      try {
        manifest.stationary.video = renderMeasuredVideo(output, stationary, options.sampleMs);
        manifest.stationary.videoTiming = 'measured elapsedMs per native frame';
      } catch (error) { manifest.stationary.videoError = String(error.message || error); }
    }
    manifest.status = 'PASS'; manifest.finishedAt = new Date().toISOString(); saveManifest();
    console.log(JSON.stringify({ status: manifest.status, output, stationaryFrames: stationary.length,
      uniqueStationaryFrames: hashes.size, routeMilestones: manifest.route.milestones.map((m) => m.label),
      video: manifest.stationary.video || null }, null, 2));
  } catch (error) {
    manifest.status = 'FAIL'; manifest.error = String(error.stack || error); manifest.finishedAt = new Date().toISOString(); saveManifest();
    throw error;
  } finally {
    if (cdp) cdp.close();
    try { child.kill('SIGTERM'); } catch (_) {}
    try { fs.closeSync(logFd); } catch (_) {}
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch (_) {}
    await new Promise((resolve) => http.server.close(resolve));
  }
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
