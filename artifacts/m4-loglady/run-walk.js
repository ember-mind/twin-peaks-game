#!/usr/bin/env node
'use strict';
/* artifacts/m4-loglady/run-walk.js — CDP driver for loglady-harness.html.
 * Boots the real game in headless Chrome (mandatory swiftshader flags), walks
 * to the Log Lady, advances page by page and screenshots every page, then flips
 * to Act 3 and screenshots the classic voice. Read-only on production files.
 *   node artifacts/m4-loglady/run-walk.js
 */
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'artifacts', 'm4-loglady');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.once('error', rej);
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
  });
}
async function waitForJson(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last = 'no response';
  while (Date.now() < deadline) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(1000) }); if (r.ok) return await r.json(); last = 'HTTP ' + r.status; }
    catch (e) { last = e.message; }
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new Error('DevTools endpoint timeout (' + last + ')');
}
class Cdp {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); }
  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('CDP connect timeout')), 15000);
      this.ws.onopen = () => { clearTimeout(t); res(); };
      this.ws.onerror = (e) => { clearTimeout(t); rej(new Error(e && e.message || 'CDP error')); };
    });
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (!m.id || !this.pending.has(m.id)) return;
      const p = this.pending.get(m.id); this.pending.delete(m.id); clearTimeout(p.timer);
      if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result || {});
    };
  }
  send(method, params = {}, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression, timeoutMs = 120000) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, allowUnsafeEvalBlockedByCSP: true }, timeoutMs);
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('page: ' + (d.exception && (d.exception.description || d.exception.value) || d.text));
    }
    return r.result && r.result.value;
  }
  close() { try { this.ws.close(); } catch (_) {} }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(cdp, name) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const file = path.join(OUT, name);
  fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  console.log('  shot ' + name);
  return file;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const httpPort = await freePort();
  const http = spawn('python3', ['-m', 'http.server', String(httpPort), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
  const stopHttp = () => { try { http.kill(); } catch (_) {} };
  process.on('exit', stopHttp);
  for (let i = 0; i < 200; i++) {
    if (spawnSync('curl', ['-fsS', `http://127.0.0.1:${httpPort}/artifacts/m4-loglady/loglady-harness.html`], { stdio: 'ignore' }).status === 0) break;
    spawnSync('sleep', ['0.05']);
  }

  const devPort = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-hl-chrome-'));
  const logFd = fs.openSync(path.join(profile, 'chrome.log'), 'w');
  const child = spawn(CHROME, [
    '--headless=new', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    `--remote-debugging-port=${devPort}`, `--user-data-dir=${profile}`,
    '--window-size=960,640',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'
  ], { stdio: ['ignore', logFd, logFd] });
  const stopChrome = () => { try { child.kill('SIGKILL'); } catch (_) {} };
  process.on('exit', stopChrome);

  let cdp;
  const transcript = [];
  try {
    const pages = await waitForJson(`http://127.0.0.1:${devPort}/json/list`, 20000);
    const page = pages.find((p) => p.type === 'page');
    cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/artifacts/m4-loglady/loglady-harness.html` });

    await sleep(1200);
    await cdp.evaluate('HL.boot()', 60000);
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const t = await cdp.evaluate('document.title');
      if (t === 'HL-BOOTED' || /ERR/.test(t || '')) break;
      await sleep(300);
    }
    console.log('boot title:', await cdp.evaluate('document.title'));

    await cdp.evaluate('HL.approach()', 120000);
    console.log('approach:', JSON.stringify(await cdp.evaluate('HL.state()')));

    // --- ACT 2: the optional node, one screenshot per page ---
    async function pressAndShot(name) {
      await cdp.evaluate("HL.press('Enter')");
      const st = await cdp.evaluate('HL.state()');
      transcript.push({ name, page: st.page && st.page.id, dialogueId: st.dialogueId });
      await shot(cdp, name);
      return st;
    }
    const A2 = ['page-01.png', 'page-02.png', 'page-03.png', 'page-04.png', 'page-05.png'];
    for (const f of A2) await pressAndShot(f);
    await cdp.evaluate("HL.press('Enter')"); // confirm last page -> commit
    transcript.push({ name: 'commit', state: await cdp.evaluate('HL.state()') });

    // repeat page (second interaction)
    await pressAndShot('page-06-repeat.png');
    await cdp.evaluate("HL.press('Enter')"); // acknowledge repeat

    // --- ACT 3: classic voice returns ---
    const a3 = await cdp.evaluate('HL.enterAct3()');
    transcript.push({ name: 'act3-enter', state: a3 });
    for (const f of ['act3-classic-01.png', 'act3-classic-02.png']) await pressAndShot(f);

    const results = await cdp.evaluate('HL.finish()');
    fs.writeFileSync(path.join(OUT, 'walkthrough.json'), JSON.stringify({ transcript, results }, null, 1));
    console.log('done. results:', JSON.stringify({ asc: results.asc, atto3: results.atto3 }));
    const errs = await cdp.evaluate('JSON.stringify(HL_RESULTS.errors)');
    console.log('page errors:', errs);
  } catch (e) {
    console.error('DRIVER ERROR:', e && e.stack || e);
    if (cdp) { try { console.error('state:', JSON.stringify(await cdp.evaluate('HL.state()'))); } catch (_) {} }
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    stopChrome(); stopHttp();
    await sleep(200);
  }
})();
