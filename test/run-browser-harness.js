// test/run-browser-harness.js — Act 5 pass 01: runs one test/*-harness.html in headless Chrome
// (mandatory swiftshader flags) and polls document.title for the PASS/FAIL line.
// usage: node test/run-browser-harness.js . m10-engine-harness.html [timeoutSec]
const path = require('path'), net = require('net'), { spawn } = require('child_process'), fs = require('fs'), os = require('os');
const [ROOT, HARNESS, TO] = [process.argv[2], process.argv[3], Number(process.argv[4] || 600)];
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const free = () => new Promise((r) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const httpPort = await free(), devPort = await free();
  const http = spawn('python3', ['-m', 'http.server', String(httpPort), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'm10h-'));
  const chrome = spawn(CHROME, ['--headless=new', '--mute-audio', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--no-first-run', '--no-default-browser-check',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    `--remote-debugging-port=${devPort}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
  const cleanup = () => { try { chrome.kill('SIGKILL'); } catch (e) {} try { http.kill(); } catch (e) {} };
  try {
    let targets;
    for (let i = 0; i < 100; i++) { try { targets = await (await fetch(`http://127.0.0.1:${devPort}/json`)).json(); if (targets.length) break; } catch (e) {} await sleep(100); }
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.onopen = r);
    let id = 0; const pend = new Map();
    ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evalJs = async (expr) => { const m = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); return m.result && m.result.result ? m.result.result.value : undefined; };
    await sleep(300);
    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/test/${HARNESS}` });
    const deadline = Date.now() + TO * 1000; let title = '';
    while (Date.now() < deadline) {
      title = await evalJs('document.title') || '';
      if (/-(PASS|FAIL|ERR)\b/.test(title)) break;
      await sleep(1000);
    }
    const res = await evalJs('JSON.stringify(window.__M10ENG_RESULT||window.__M10ST_RESULT||window.__M10PHYS_RESULT||null)');
    console.log('TITLE', title);
    const o = res ? JSON.parse(res) : null;
    if (o) { console.log('failed:', JSON.stringify(o.failed || Object.keys(o.checks).filter(k => o.checks[k] !== true), null, 1)); console.log('errors:', JSON.stringify(o.errors.slice(0, 20), null, 1)); if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify(o, null, 1)); }
  } finally { cleanup(); }
  process.exit(0);
})();
