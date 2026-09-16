'use strict';

/* Browser boundary for an unseeded campaign run. Node >=22 and Chrome only.
 * Routes receive player inputs and JSON observations, never CDP, an evaluator,
 * the profile directory, or the game's mutable state. Normal index.html only.
 */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const KEYS = Object.freeze({
  ArrowUp: ['ArrowUp', 38], ArrowDown: ['ArrowDown', 40],
  ArrowLeft: ['ArrowLeft', 37], ArrowRight: ['ArrowRight', 39],
  Enter: ['Enter', 13], Escape: ['Escape', 27], Space: [' ', 32],
  KeyW: ['w', 87], KeyA: ['a', 65], KeyS: ['s', 83], KeyD: ['d', 68],
  KeyZ: ['z', 90], KeyX: ['x', 88], KeyT: ['t', 84], KeyM: ['m', 77], KeyN: ['n', 78]
});
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.wav': 'audio/wav' };

function integer(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new TypeError(`${name} must be an integer in ${min}..${max}`);
  }
  return value;
}
function inside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
function keyParams(code) {
  if (typeof code !== 'string' || !Object.prototype.hasOwnProperty.call(KEYS, code)) throw new TypeError(`Unsupported player key: ${code}`);
  return { code, key: KEYS[code][0], windowsVirtualKeyCode: KEYS[code][1], nativeVirtualKeyCode: KEYS[code][1] };
}

// Loopback only: reject traversal, external symlinks and hidden directories.
async function serve(root) {
  root = await fsp.realpath(root);
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
      const raw = (req.url || '/').split('?')[0];
      let decoded;
      try { decoded = decodeURIComponent(raw); } catch (_) { res.writeHead(400); res.end(); return; }
      if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').some((s) => s.startsWith('.'))) {
        res.writeHead(403); res.end(); return;
      }
      const file = await fsp.realpath(path.resolve(root, '.' + (decoded === '/' ? '/index.html' : decoded)));
      if (!inside(root, file)) { res.writeHead(403); res.end(); return; }
      const stat = await fsp.stat(file);
      if (!stat.isFile()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Content-Length': stat.size, 'Cache-Control': 'no-store' });
      if (req.method === 'HEAD') { res.end(); return; }
      const stream = fs.createReadStream(file);
      stream.on('error', () => res.destroy());
      stream.pipe(res);
    } catch (error) { if (!res.headersSent) res.writeHead(error.code === 'ENOENT' ? 404 : 500); res.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${server.address().port}/index.html`,
    close: () => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }) };
}

class Cdp {
  constructor(ws) {
    this.ws = ws; this.seq = 0; this.pending = new Map(); this.listeners = new Set();
    ws.addEventListener('message', (event) => {
      let m;
      try { m = JSON.parse(event.data); } catch (e) { this.rejectPending(e); return; }
      if (m.id && this.pending.has(m.id)) {
        const p = this.pending.get(m.id); this.pending.delete(m.id); clearTimeout(p.timer);
        if (m.error) p.reject(new Error(`${p.method}: ${m.error.message}`)); else p.resolve(m.result || {});
      } else if (m.method) for (const listener of this.listeners) listener(m);
    });
    ws.addEventListener('close', () => this.rejectPending(new Error('Browser disconnected')));
    ws.addEventListener('error', () => this.rejectPending(new Error('Browser socket error')));
  }
  rejectPending(error) {
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(error); }
    this.pending.clear();
  }
  static async connect(url, timeoutMs) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { ws.close(); reject(new Error('CDP connection timed out')); }, timeoutMs);
      ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connection failed')); }, { once: true });
    });
    return new Cdp(ws);
  }
  send(method, params = {}, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState !== WebSocket.OPEN) { reject(new Error('Browser disconnected')); return; }
      const id = ++this.seq;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async loaded(action, timeoutMs) {
    let listener, timer;
    const loaded = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Page load timed out')), timeoutMs);
      listener = (event) => { if (event.method === 'Page.loadEventFired') resolve(); };
      this.listeners.add(listener);
    });
    loaded.catch(() => {});
    try { await action(); await loaded; }
    finally { clearTimeout(timer); this.listeners.delete(listener); }
  }
  close() { this.rejectPending(new Error('Session closed')); this.ws.close(); }
}

/* The ONLY page expression: route-supplied code is never evaluated.
 * Semantic text is diagnostic evidence, NOT proof of canvas readability.
 */
function observeGame() {
  const g = window.GAME, s = g && g.Engine && g.Engine.state;
  const np = g && g.NarrativeProduction;
  const a = g && g.NarrativeAdapter;
  const clone = (value) => value === undefined ? null : JSON.parse(JSON.stringify(value));
  const text = (selector) => { const el = document.querySelector(selector); return el ? el.textContent : null; };
  let narrative = null, observationError = null;
  try { if (a && a.getState) narrative = clone(a.getState()); }
  catch (e) { observationError = String(e.message || e); }
  const saves = {};
  let storageError = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key === 'tp_save' || /^twin-peaks:(narrative:|finale:)/.test(key)) saves[key] = localStorage.getItem(key);
    }
  } catch (e) { storageError = String(e.message || e); }
  const populations = {};
  if (g && g.Maps) Object.keys(g.Maps).forEach((id) => {
    const map = g.Maps[id];
    if (map && Array.isArray(map.npcs)) populations[id] = map.npcs.map((n) => ({
      id: n.id, x: n.x, y: n.y, homeX: n.homeX, homeY: n.homeY, source: n.cast_source
    }));
  });
  return {
    ready: !!(s && np && np.ready), url: location.href,
    testMode: np ? !!np.testMode : null,
    mode: s ? s.mode : null, mapId: s ? s.mapId : null,
    player: s ? clone(s.player) : null, flags: s ? clone(s.flags) : null, clues: s ? clone(s.clues) : null,
    dialogue: s ? clone(s.dialogue) : null,
    menu: s ? !!s.menu : null, fadePhase: s ? s.fadePhase : null,
    liveNpcs: s ? clone(s.npcs) : null, populations,
    narrative, narrativeActive: !!(a && a.active && a.active()),
    semanticUi: { objective: text('#objective'), page: text('#narrative .nw-page'),
      choices: Array.from(document.querySelectorAll('#narrative .nw-opt[data-choice-id]'), (el) => ({
        id: el.getAttribute('data-choice-id'), text: el.textContent, focused: el.classList.contains('nw-focus')
      })), recovery: !!document.querySelector('#narrative .nw-save-recovery') },
    saves, storageError, observationError
  };
}
const OBSERVE = `(${observeGame.toString()})()`;

async function findChrome(explicit) {
  const candidates = explicit ? [explicit] : [process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium',
    '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/opt/google/chrome/chrome'].filter(Boolean);
  for (const name of candidates) {
    const paths = name.includes(path.sep) ? [name] : (process.env.PATH || '').split(path.delimiter).map((p) => path.join(p, name));
    for (const executable of paths) {
      try { await fsp.access(executable, fs.constants.X_OK); return executable; } catch (_) {}
    }
  }
  throw new Error('Chrome not found. Set CHROME_BIN to a Chrome/Chromium executable.');
}

async function openPlayableBrowser(options) {
  if (!options || typeof options.root !== 'string' || typeof options.outputDir !== 'string') {
    throw new TypeError('root and outputDir are required');
  }
  if (typeof WebSocket !== 'function') throw new Error('This driver requires Node 22 or newer (global WebSocket).');
  for (const name of ['mobile', 'noSandbox']) {
    if (options[name] !== undefined && typeof options[name] !== 'boolean') throw new TypeError(`${name} must be boolean`);
  }
  const timeoutMs = integer(options.timeoutMs === undefined ? 20000 : options.timeoutMs, 'timeoutMs', 50, 120000);
  const width = integer(options.width === undefined ? 980 : options.width, 'width', 240, 4096);
  const height = integer(options.height === undefined ? 700 : options.height, 'height', 240, 4096);
  const chrome = await findChrome(options.chromeBin);
  const root = await fsp.realpath(options.root);
  await fsp.access(path.join(root, 'index.html'));
  const gitHead = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  const gitStatus = spawnSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' });
  const source = { sha: gitHead.status === 0 ? gitHead.stdout.trim() : null,
    status: gitStatus.status === 0 ? gitStatus.stdout : null };
  const out = path.resolve(options.outputDir);
  await fsp.mkdir(path.dirname(out), { recursive: true });
  await fsp.mkdir(out); // Refuse overwriting an existing run.
  let server, child, profile, cdp, logFd, closed = false;
  const started = Date.now(), events = [], faults = [];
  const record = (type, detail = {}) => events.push({ elapsedMs: Date.now() - started, type, ...detail });
  const metadata = { format: 'playable-browser-run', version: 1, root, source, startedAt: new Date().toISOString(),
    browser: null, viewport: { width, height, mobile: !!options.mobile }, freshProfile: true,
    campaignVerdict: 'NOT_EVALUATED', lastFailure: null };
  const writeEvidence = async () => {
    await fsp.writeFile(path.join(out, 'session.json'), JSON.stringify({ metadata, events, faults }, null, 2) + '\n');
  };
  async function close() {
    if (closed) return;
    closed = true;
    record('close');
    if (cdp) { try { await cdp.send('Browser.close', {}, 1500); } catch (_) {} cdp.close(); }
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      const deadline = Date.now() + 2000;
      while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) await sleep(25);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
    if (server) await server.close();
    if (logFd !== undefined) fs.closeSync(logFd);
    if (profile) await fsp.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    metadata.closedAt = new Date().toISOString();
    await writeEvidence();
  }
  function assertOpen() { if (closed) throw new Error('Playable browser is closed'); }
  async function snapshot() {
    assertOpen();
    const result = await cdp.send('Runtime.evaluate', { expression: OBSERVE, returnByValue: true });
    if (result.exceptionDetails) throw new Error('Read-only observation failed: ' + JSON.stringify(result.exceptionDetails));
    const value = result.result && result.result.value;
    if (!value || typeof value !== 'object') throw new Error('Read-only observation returned no snapshot');
    return value;
  }
  async function capture(label) {
    assertOpen();
    if (typeof label !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(label)) throw new TypeError('Invalid capture label');
    const prefix = String(events.length).padStart(5, '0') + '-' + label;
    let state = null, observationError = null;
    try { state = await snapshot(); } catch (e) { observationError = e.message; }
    const image = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    await fsp.writeFile(path.join(out, prefix + '.png'), Buffer.from(image.data, 'base64'), { flag: 'wx' });
    await fsp.writeFile(path.join(out, prefix + '.json'), JSON.stringify({ state, observationError }, null, 2) + '\n', { flag: 'wx' });
    record('capture', { label, prefix });
    await writeEvidence();
    return { prefix, state, observationError };
  }
  async function waitFor(label, predicate, limit = timeoutMs) {
    assertOpen();
    if (typeof label !== 'string' || !label || typeof predicate !== 'function') throw new TypeError('waitFor requires a label and predicate');
    integer(limit, 'wait timeout', 50, 120000);
    const deadline = Date.now() + limit;
    let last = null;
    while (Date.now() < deadline) {
      last = await snapshot();
      const result = predicate(last); // Host-side JSON, never live game state.
      if (typeof result !== 'boolean') {
        if (result && typeof result.then === 'function') Promise.resolve(result).catch(() => {});
        throw new TypeError('waitFor predicate must return a synchronous boolean');
      }
      if (result) { record('wait-passed', { label }); return last; }
      await sleep(50);
    }
    metadata.lastFailure = { kind: 'timeout', label, timeoutMs: limit };
    record('wait-failed', { label, timeoutMs: limit });
    try { await capture('timeout'); } catch (e) { record('capture-failed', { error: e.message }); }
    await writeEvidence();
    throw new Error(`Timed out waiting for ${label}; mode=${last && last.mode}, map=${last && last.mapId}`);
  }
  const keyDown = new Set();
  async function press(code, holdMs = 35) {
    assertOpen();
    const params = keyParams(code);
    integer(holdMs, 'holdMs', 0, 2000);
    if (keyDown.has(code)) throw new Error(`Concurrent press of ${code} is not allowed`);
    keyDown.add(code); record('press', { code, holdMs });
    try { await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...params }); await sleep(holdMs); }
    finally { keyDown.delete(code); await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...params }); }
  }
  async function tap(x, y) {
    assertOpen();
    integer(x, 'x', 0, width - 1); integer(y, 'y', 0, height - 1);
    record('tap', { x, y, pointer: options.mobile ? 'touch' : 'mouse' });
    if (options.mobile) {
      try { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 0 }] }); }
      finally { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    } else {
      try { await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); }
      finally { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); }
    }
  }
  async function reload() {
    assertOpen(); record('reload');
    await cdp.loaded(() => cdp.send('Page.reload', { ignoreCache: true }), timeoutMs);
    return waitFor('production boot after reload', (s) => s.ready && s.testMode === false);
  }
  try {
    server = await serve(root);
    profile = await fsp.mkdtemp(path.join(os.tmpdir(), 'tp-playable-'));
    logFd = fs.openSync(path.join(out, 'chrome.log'), 'wx');
    const args = ['--headless=new', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
      '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${profile}`,
      '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'];
    if (options.noSandbox === true) args.unshift('--no-sandbox'); // Explicit opt-in, never automatic.
    metadata.sandboxDisabled = options.noSandbox === true;
    child = spawn(chrome, args, { stdio: ['ignore', logFd, logFd] });
    let spawnError = null;
    child.on('error', (error) => { spawnError = error; });
    const deadline = Date.now() + timeoutMs;
    let port = null;
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Chrome exited during startup (${child.exitCode || child.signalCode}); see chrome.log`);
      try {
        const raw = await fsp.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8');
        const value = Number(raw.split('\n')[0]);
        if (Number.isInteger(value) && value > 0 && value <= 65535) { port = value; break; }
      } catch (e) { if (e.code !== 'ENOENT') throw e; }
      await sleep(50);
    }
    if (port === null) throw new Error('Chrome startup timed out; see chrome.log');
    const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(`CDP target discovery failed: HTTP ${response.status}`);
    const target = (await response.json()).find((p) => p.type === 'page');
    if (!target || !target.webSocketDebuggerUrl) throw new Error('Chrome has no page target');
    cdp = await Cdp.connect(target.webSocketDebuggerUrl, timeoutMs);
    cdp.listeners.add((event) => {
      if (event.method === 'Runtime.exceptionThrown') faults.push({ type: 'exception', detail: event.params.exceptionDetails });
      if (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error') faults.push({ type: 'console',
        text: event.params.args.map((a) => a.value === undefined ? a.description : String(a.value)).join(' ') });
      if (event.method === 'Network.responseReceived' && event.params.response.status >= 400) {
        faults.push({ type: 'http', url: event.params.response.url, status: event.params.response.status });
      }
      if (event.method === 'Network.loadingFailed') faults.push({ type: 'network', detail: event.params });
    });
    await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable');
    metadata.browser = await cdp.send('Browser.getVersion');
    metadata.url = server.url;
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: !!options.mobile });
    if (options.mobile) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    record('navigate', { url: server.url });
    await cdp.loaded(async () => {
      const result = await cdp.send('Page.navigate', { url: server.url });
      if (result.errorText) throw new Error(`Navigation failed: ${result.errorText}`);
    }, timeoutMs);
    await waitFor('normal production boot', (s) => s.ready && s.testMode === false);
    await writeEvidence();
    return Object.freeze({ snapshot, press, tap, reload, waitFor, capture, close });
  } catch (error) {
    metadata.lastFailure = { kind: 'startup', error: String(error.stack || error) };
    try { await close(); } catch (cleanupError) { error.message += `; cleanup: ${cleanupError.message}`; }
    throw error;
  }
}

module.exports = { openPlayableBrowser, keyParams };
