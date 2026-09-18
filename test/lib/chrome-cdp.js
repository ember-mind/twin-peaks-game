'use strict';

/* Minimal headless-Chrome CDP session for the dusk diagnostics.
 * One Chrome per session; always call close(). Diagnostics only: production
 * code and the shared capture-chrome.js helper are not involved.
 */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.wav': 'audio/wav' };

function freePort() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function findChrome(explicit) {
  const candidates = [explicit, process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium',
    '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].filter(Boolean);
  for (const name of candidates) {
    const paths = name.includes(path.sep) ? [name]
      : (process.env.PATH || '').split(path.delimiter).map((entry) => path.join(entry, name));
    for (const executable of paths) {
      try { await fsp.access(executable, fs.constants.X_OK); return executable; } catch (_) { /* next */ }
    }
  }
  throw new Error('Chrome not found. Set CHROME_BIN to a Chrome/Chromium executable.');
}

function serve(root) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = (req.url || '/').split('?')[0];
      const file = path.resolve(root, '.' + (url === '/' ? '/index.html' : decodeURIComponent(url)));
      if (!file.startsWith(path.resolve(root))) { res.writeHead(403); res.end(); return; }
      const stat = await fsp.stat(file);
      if (!stat.isFile()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Content-Length': stat.size, 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    } catch (error) { if (!res.headersSent) res.writeHead(error.code === 'ENOENT' ? 404 : 500); res.end(); }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({
    url: 'http://127.0.0.1:' + server.address().port,
    close: () => new Promise((done) => { server.close(done); server.closeAllConnections(); })
  })));
}

class Cdp {
  constructor(ws, timeoutMs) {
    this.ws = ws; this.timeoutMs = timeoutMs; this.seq = 0; this.pending = new Map();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(pending.method + ': ' + message.error.message));
      else pending.resolve(message.result || {});
    });
    ws.addEventListener('close', () => this.rejectAll(new Error('Browser disconnected')));
    ws.addEventListener('error', () => this.rejectAll(new Error('Browser socket error')));
  }
  rejectAll(error) {
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(error); }
    this.pending.clear();
  }
  send(method, params = {}, timeoutMs = this.timeoutMs) {
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression, awaitPromise = false, timeoutMs = this.timeoutMs) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise }, timeoutMs);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'page evaluation failed');
    return result.result && result.result.value;
  }
  close() { this.rejectAll(new Error('Session closed')); try { this.ws.close(); } catch (_) { /* gone */ } }
}

async function launch(options = {}) {
  const root = await fsp.realpath(options.root || path.resolve(__dirname, '..', '..'));
  const chrome = await findChrome(options.chromeBin);
  const gpu = options.gpu || 'swiftshader';
  const width = options.width || 960;
  const height = options.height || 640;
  const timeoutMs = options.timeoutMs || 30000;
  const server = await serve(root);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-dusk-chrome-'));
  const logFd = fs.openSync(path.join(profile, 'chrome.log'), 'w');
  const args = ['--headless=new', '--mute-audio', '--enable-gpu', '--remote-debugging-port=0',
    '--remote-debugging-address=127.0.0.1', '--user-data-dir=' + profile, '--no-first-run',
    '--no-default-browser-check', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'];
  if (gpu === 'swiftshader') args.splice(3, 0, '--enable-unsafe-swiftshader', '--use-angle=swiftshader');
  if (gpu === 'metal') args.splice(3, 0, '--use-angle=metal');
  const child = spawn(chrome, args, { stdio: ['ignore', logFd, logFd] });
  let cdp = null, closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    if (cdp) cdp.close();
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      const deadline = Date.now() + 1500;
      while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) await sleep(25);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
    const strays = spawnSync('pgrep', ['-f', profile], { encoding: 'utf8' });
    if (strays.status === 0 && strays.stdout) for (const line of strays.stdout.split('\n')) {
      const pid = Number(line.trim());
      if (Number.isInteger(pid) && pid > 0 && pid !== process.pid) { try { process.kill(pid, 'SIGKILL'); } catch (_) { /* gone */ } }
    }
    await server.close();
    try { fs.closeSync(logFd); } catch (_) { /* gone */ }
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) { /* best effort */ }
  };
  try {
    const deadline = Date.now() + timeoutMs;
    let port = null;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error('Chrome exited during startup');
      try {
        const raw = await fsp.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8');
        const value = Number(raw.split('\n')[0]);
        if (Number.isInteger(value) && value > 0) { port = value; break; }
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
      await sleep(50);
    }
    if (port === null) throw new Error('Chrome startup timed out');
    const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list', { signal: AbortSignal.timeout(timeoutMs) })).json();
    const target = targets.find((item) => item.type === 'page');
    if (!target || !target.webSocketDebuggerUrl) throw new Error('Chrome has no page target');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP connect timeout')), timeoutMs);
      ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connect failed')); }, { once: true });
    });
    cdp = new Cdp(ws, timeoutMs);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    return {
      cdp, base: server.url, profile,
      gpu,
      evaluate: (expression, awaitPromise, timeout) => cdp.evaluate(expression, awaitPromise, timeout),
      send: (method, params, timeout) => cdp.send(method, params, timeout),
      async navigate(pathname) {
        await cdp.send('Page.navigate', { url: server.url + '/' + pathname.replace(/^\//, '') });
      },
      async waitForTitle(prefix, limit = timeoutMs) {
        const titleDeadline = Date.now() + limit;
        let title = '';
        while (Date.now() < titleDeadline) {
          title = await cdp.evaluate('document.title', false, 4000) || '';
          if (String(title).startsWith(prefix)) return title;
          if (title === 'TP-SHOT-ERROR') throw new Error('page error: ' + await cdp.evaluate('window.__TP_SHOT_ERROR__'));
          await sleep(80);
        }
        throw new Error('title timeout; expected ' + prefix + ', got ' + title);
      },
      async press(code, key, vk) {
        const params = { code, key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
        await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...params });
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
      },
      close
    };
  } catch (error) {
    await close();
    throw error;
  }
}

module.exports = { launch, findChrome, sleep };
