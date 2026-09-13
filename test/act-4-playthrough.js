#!/usr/bin/env node
'use strict';

/* test/act-4-playthrough.js — giocata dell'Atto 4 (M8) sulla build REALE
 * (index.html) in Chrome headless, guidata dai tasti veri del gioco.
 *
 *   node test/act-4-playthrough.js [--path=A|B|C|D|all]
 *
 *   A = promessa «accompagno» → avviso a casa Palmer → focus Palmer;
 *       Sarah visitata PRIMA del diner, Lucy visitata alla centrale.
 *   B = «autonomia» → avviso alla centrale → focus lago;
 *       Log Lady al diner, Sarah visitata FRA il diner e il Roadhouse.
 *   C = «prudenza» → nessun avviso → focus diner; nessuna visita facoltativa.
 *   D = «accompagno» → avviso Palmer → focus lago; nessuna visita facoltativa
 *       (la valigia arriva alla stazione per rapporto: p_valigia + p_lago).
 *
 * Stesso schema di test/act-3-playthrough.js: nessun file di produzione viene
 * toccato; si apre test/act-4-playthrough-probe.html, che carica ../index.html
 * in un iframe ed espone le primitive di input. Lo stato di partenza è quello
 * lasciato dall'Atto 3 (seme = test/m8-engine-harness.html::seedBase + i flag
 * di confine), Cooper alla centrale davanti a Truman. Le rotte scelte al
 * crocevia si camminano coi tasti veri, mai in teletrasporto.
 * Trascrizioni: artifacts/act-4-implementation/transcripts/<nome>.{json,md};
 * screenshot: artifacts/act-4-implementation/*.png.
 */

const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'artifacts', 'act-4-implementation');
const TX_DIR = path.join(OUT_DIR, 'transcripts');
const CHROME = process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const argPath = (process.argv.find((a) => a.startsWith('--path=')) || '--path=all').slice(7);

/* ------------------------------- CDP ------------------------------- */
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
      last = `HTTP ${r.status}`;
    } catch (e) { last = e.message; }
    await new Promise((res) => setTimeout(res, 60));
  }
  throw new Error(`DevTools endpoint timeout (${last})`);
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
  send(method, params = {}, timeoutMs = 600000) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression, timeoutMs = 600000) {
    const r = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true, allowUnsafeEvalBlockedByCSP: true
    }, timeoutMs);
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('page: ' + (d.exception && (d.exception.description || d.exception.value) || d.text));
    }
    return r.result && r.result.value;
  }
  close() { try { this.ws.close(); } catch (_) {} }
}

/* --------------------------- assertion ledger --------------------------- */
const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: cond ? null : (detail === undefined ? null : detail) });
  console.log(`  ${cond ? 'PASS' : 'FAIL'} - ${name}${cond ? '' : '  ::  ' + JSON.stringify(detail)}`);
  return !!cond;
}
const notesOut = [];

/* ------------------------------- main ------------------------------- */
async function main() {
  fs.mkdirSync(TX_DIR, { recursive: true });
  const port = 18400 + (process.pid % 12000);
  const server = spawn('python3',
    ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', ROOT],
    { stdio: 'ignore' });
  const stopServer = () => { try { server.kill(); } catch (_) {} };
  process.on('exit', stopServer);
  for (let i = 0; i < 200; i++) {
    if (spawnSync('curl', ['-fsS', `http://127.0.0.1:${port}/index.html`], { stdio: 'ignore' }).status === 0) break;
    spawnSync('sleep', ['0.05']);
  }

  const devPort = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-a4-chrome-'));
  const logFd = fs.openSync(path.join(profile, 'chrome.log'), 'w');
  const child = spawn(CHROME, [
    '--headless=new',
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader',
    `--remote-debugging-port=${devPort}`,
    `--user-data-dir=${profile}`,
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    'about:blank'
  ], { stdio: ['ignore', logFd, logFd] });

  let cdp;
  const consoleErrors = [];
  try {
    const pages = await waitForJson(`http://127.0.0.1:${devPort}/json/list`, 20000);
    const page = pages.find((p) => p.type === 'page');
    cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 980, height: 700, screenWidth: 980, screenHeight: 700, deviceScaleFactor: 1, mobile: false });

    await cdp.send('Log.enable').catch(() => {});
    cdp.ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') consoleErrors.push(m.params.entry.text + (m.params.entry.url ? '  <' + m.params.entry.url + '>' : ''));
      if (m.method === 'Runtime.exceptionThrown') {
        const d = m.params.exceptionDetails;
        consoleErrors.push('exception: ' + (d.exception && (d.exception.description || d.exception.value) || d.text));
      }
    });

    const paths = argPath === 'all' ? ['A', 'B', 'C', 'D'] : [argPath];
    for (const name of paths) if (!PATHS[name]) throw new Error('percorso sconosciuto: ' + name);

    for (const name of paths) {
      console.log(`\n=== PATH ${name} (${PATHS[name].label}) ===`);
      await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/test/act-4-playthrough-probe.html` });
      await waitReady(cdp);
      const errMark = consoleErrors.length;
      const shot = (file) => screenshot(cdp, path.join(OUT_DIR, file));
      let dump;
      try {
        dump = await runPath(cdp, name, shot);
      } catch (e) {
        check(`[${name}] guida: il percorso arriva in fondo senza eccezioni del driver`, false, e.stack || e.message);
        try { dump = await ev(cdp).dump(); } catch (_) { dump = { transcript: [], classic: [], mapEntries: [], fallbacks: [], notes: [] }; }
        try { auditTranscript(name, dump, PATHS[name]); } catch (e2) { console.log('  audit abortito: ' + e2.message); }
      }
      dump.console_errors = consoleErrors.slice(errMark);
      // il 404 di favicon.ico è un artefatto dell'http.server di prova, non della build
      const realErrors = dump.console_errors.filter((e) => !/favicon\.ico/.test(e));
      if (realErrors.length !== dump.console_errors.length) notesOut.push({ path: name, kind: 'console (harness)', text: 'favicon.ico 404 dal server di prova' });
      check(`[${name}] console: nessun errore del browser durante il percorso`, realErrors.length === 0, realErrors.slice(0, 6));
      writeTranscript(name, dump);
    }

    fs.writeFileSync(path.join(TX_DIR, 'assertions.json'),
      JSON.stringify({ results, observations: notesOut, console_errors: consoleErrors.slice(0, 80) }, null, 2));
    if (notesOut.length) console.log('\nosservazioni: ' + JSON.stringify(notesOut));
    writeCastPresenceArtifacts();

    const failed = results.filter((r) => !r.pass);
    console.log(`\nact-4-playthrough: ${results.length - failed.length}/${results.length} assertions passed`);
    if (consoleErrors.length) console.log(`console errors: ${consoleErrors.length}\n  ` + consoleErrors.slice(0, 10).join('\n  '));
    if (failed.length) process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    try { child.kill('SIGTERM'); } catch (_) {}
    stopServer();
    try { fs.closeSync(logFd); } catch (_) {}
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (_) {}
  }
}

async function waitReady(cdp) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const ok = await cdp.evaluate('typeof window.A4 !== "undefined"').catch(() => false);
    if (ok) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('probe page never exposed A4');
}

async function screenshot(cdp, file) {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
  console.log(`  shot -> ${path.relative(ROOT, file)}`);
}

/* --------------------------- page-side helpers --------------------------- */
function ev(cdp) {
  const call = (expr) => cdp.evaluate(`(async () => { ${expr} })()`);
  const J = JSON.stringify;
  return {
    raw: (expr) => cdp.evaluate(expr),
    call,
    boot: () => call('return await A4.boot();'),
    // il seme è il pin ACT4_AFTERNOON della fixture (storia intera fino alla
    // soglia dell'Atto 4, raggiungibile): il set minimo di confine usato prima
    // lasciava finestre di M5/M6 in overlap (CastPresence OVERLAP su hawk).
    seed: () => call(`return await A4.seed(${J(CAST_FIXTURE.seeds.ACT4_AFTERNOON)});`),
    reload: () => call('return await A4.reload();'),
    travel: (m, x, y, d, why) => call(`return await A4.travel(${J(m)},${x},${y},${J(d)},${J(why || '')});`),
    walkTo: (x, y) => call(`var r = await A4.walkTo(${x},${y}); return { ok: r, diag: A4.walkDiag(), pos: A4.pos() };`),
    reach: (x, y) => call(`return await A4.reach(${x},${y});`),
    reachFrom: (x, y, d) => call(`return await A4.reachFrom(${x},${y},${J(d)});`),
    face: (d) => call(`return await A4.face(${J(d)});`),
    press: (code, n) => call(`await A4.press(${J(code)},${n || 1}); return A4.pos();`),
    interact: () => call('return await A4.interact();'),
    advance: () => call('return await A4.advance();'),
    choose: (id) => call(`return await A4.choose(${J(id)});`),
    chooseAndHold: (id) => call(`return await A4.chooseAndHold(${J(id)});`),
    drain: (l) => call(`return await A4.drainClassic(${J(l || '')});`),
    enterDoor: (dx, dy, sx, sy) => call(`return await A4.enterDoor(${dx},${dy},${sx},${sy});`),
    compare: (a, b) => call(`return await A4.compare(${J(a)},${J(b)});`),
    closeNotebook: () => call('return await A4.closeNotebook();'),
    abortWidget: () => call('return await A4.abortWidget();'),
    interactUntilPage: (p) => call(`return await A4.interactUntilPage(${J(p)});`),
    advanceUntilPage: (p) => call(`return await A4.advanceUntilPage(${J(p)});`),
    apiInteract: (m, a, why) => call(`return await A4.apiInteract(${J(m)},${J(a)},${J(why)});`),
    wait: (ms) => call(`await A4.wait(${ms}); return true;`),
    state: () => cdp.evaluate('A4.stateDigest()'),
    propStatus: (id) => cdp.evaluate(`A4.propStatus(${J(id)})`),
    pos: () => cdp.evaluate('A4.pos()'),
    objective: () => cdp.evaluate('A4.objective()'),
    objectiveOf: (m) => cdp.evaluate(`A4.objectiveOf(${J(m)})`),
    npcsHere: () => cdp.evaluate('A4.npcsHere()'),
    npcActive: (m, id) => cdp.evaluate(`A4.npcActive(${J(m)},${J(id)})`),
    worldTarget: (m, id) => cdp.evaluate(`A4.worldTarget(${J(m)},${J(id)})`),
    entityDefs: (m) => cdp.evaluate(`A4.entityDefs(${J(m)})`),
    entityDef: (m, id) => cdp.evaluate(`A4.entityDef(${J(m)},${J(id)})`),
    castWhere: () => cdp.evaluate('A4.castWhere()'),
    castResolve: (id) => cdp.evaluate(`A4.castResolve(${J(id)})`),
    bodiesOn: (m) => cdp.evaluate(`A4.bodiesOn(${J(m)})`),
    doorAt: (m, x, y) => cdp.evaluate(`A4.doorAt(${J(m)},${x},${y})`),
    doorsOf: (m) => cdp.evaluate(`A4.doorsOf(${J(m)})`),
    isSolid: (m, x, y) => cdp.evaluate(`A4.isSolid(${J(m)},${x},${y})`),
    missionNodeIds: (m) => cdp.evaluate(`A4.missionNodeIds(${J(m)})`),
    classicFlags: () => cdp.evaluate('A4.classicFlags()'),
    widgetOpts: () => cdp.evaluate('A4.widgetOpts()'),
    savedNow: () => cdp.evaluate('A4.savedNow()'),
    savedRaw: () => cdp.evaluate('A4.savedRaw()'),
    dump: () => cdp.evaluate('A4.dump()'),
    note: (t, d) => cdp.evaluate(`A4.note(${J(t)},${J(d === undefined ? null : d)})`),
    reset: () => cdp.evaluate('A4.reset()'),
    status: (t) => cdp.evaluate(`A4.status(${J(t)})`)
  };
}

function pageIds(rows) { return (rows || []).filter((r) => r.kind === 'page').map((r) => r.page_id); }
function hasWidget(rows) { return (rows || []).some((r) => r.kind === 'widget'); }
// «nessun effetto» = nessun flag/valore/evidenza; il commit del nodo (nodes_done) è fisiologico
function noEffects(delta) { const d = Object.assign({}, delta || {}); delete d.nodes_done; return Object.keys(d).length === 0; }

/* interagisce col target ambientale (x,y) camminandoci accanto e premendo A */
async function useTarget(P, x, y, label, until, shot, file) {
  const r = await P.reach(x, y);
  if (!r.ok) return { ok: false, error: 'unreachable', label, detail: r, rows: [], choices: [] };
  if (until) {
    const first = await P.interactUntilPage(until);
    if (shot && first.reached) await shot(file);
    const rest = await P.advance();
    return { ok: true, label, rows: [...first.rows, ...rest.rows], choices: rest.choices, reachedShot: first.reached, at: first.at };
  }
  const out = await P.interact();
  return { ok: true, label, ...out };
}
/* interagisce con un ATTORE presente sulla mappa; se l'attore non esiste come
   NPC, ripiega sull'API pubblica e lo dichiara (conta come fallback) */
async function useActor(P, map, actorId, label, until, shot, file) {
  const npcs = await P.npcsHere();
  const npc = npcs.find((n) => n.id === actorId);
  if (!npc) {
    const out = await P.apiInteract(map, actorId, `nessun NPC "${actorId}" sulla mappa ${map}: impossibile guardarlo e premere A`);
    return { ok: true, viaApi: true, label, ...out };
  }
  const r = await P.reach(npc.x, npc.y);
  if (!r.ok) {
    const out = await P.apiInteract(map, actorId, `NPC "${actorId}" a ${npc.x},${npc.y} presente ma nessuna casella adiacente raggiungibile: ${JSON.stringify(r)} · NPC: ${JSON.stringify(npcs.map((n) => n.id + '@' + n.x + ',' + n.y))}`);
    return { ok: true, viaApi: true, label, ...out };
  }
  if (until) {
    const first = await P.interactUntilPage(until);
    if (shot && first.reached) await shot(file);
    const rest = await P.advance();
    return { ok: true, label, rows: [...first.rows, ...rest.rows], choices: rest.choices, reachedShot: first.reached, at: first.at };
  }
  const out = await P.interact();
  return { ok: true, label, ...out };
}

/* ------------------------------ percorsi ------------------------------ */
const PATHS = {
  A: {
    label: 'accompagno → avviso Palmer → focus Palmer; Sarah prima del diner, Lucy',
    promise: 'accompagno', warning: 'palmer', focus: 'palmer',
    sarahBeforeDiner: true, sarahBetween: false, lucy: true, loglady: false,
    wrongDiaryFirst: ['diary_b'],
    reloadAfterFocus: true,
    shots: true
  },
  B: {
    label: 'autonomia → avviso centrale → focus lago; Log Lady, Sarah fra diner e Roadhouse',
    promise: 'autonomia', warning: 'centrale', focus: 'lago',
    sarahBeforeDiner: false, sarahBetween: true, lucy: false, loglady: true,
    wrongDiaryFirst: ['diary_c'],
    reloadAfterFocus: false,
    shots: false
  },
  C: {
    label: 'prudenza → nessun avviso → focus diner; nessuna visita facoltativa',
    promise: 'prudenza', warning: 'nessuno', focus: 'diner',
    sarahBeforeDiner: false, sarahBetween: false, lucy: false, loglady: false,
    wrongDiaryFirst: [],
    reloadAfterFocus: false,
    shots: false
  },
  // la valigia arriva PER RAPPORTO alla stazione: avviso a casa Palmer, ma
  // Cooper sceglie il lago (warning=palmer ∧ focus≠palmer) → p_valigia + p_lago
  D: {
    label: 'accompagno → avviso Palmer → focus lago; nessuna visita facoltativa (valigia per rapporto)',
    promise: 'accompagno', warning: 'palmer', focus: 'lago',
    sarahBeforeDiner: false, sarahBetween: false, lucy: false, loglady: false,
    wrongDiaryFirst: [],
    reloadAfterFocus: false,
    shots: false
  }
};
/* --------------------- Cast Continuity: pin comparator --------------------- */
/* Verità di prova (mai dati di produzione):
   test/fixtures/cast-pins-acts-1-4.json §4 (tabelle pin V5). Ogni "seme" della
   fixture NON è lo stato reale del percorso giocato: è uno stato sintetico
   costruito per validare il resolver. Un pin si applica a un momento reale
   solo quando le combinazioni di valori che contano per la collocazione
   (warning_target, focus_destination, body_found_by — mai promise_stance: nessuna
   finestra del registro la legge) coincidono; altrimenti si cattura lo
   scatto senza confrontarlo (nessun pin adatto), ma si controlla comunque
   che nessuna mappa viva abbia due corpi con lo stesso id. */
const CAST_FIXTURE = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'fixtures', 'cast-pins-acts-1-4.json'), 'utf8'));
const castCaptures = [];   // { path, moment, pinId, snapshot, mismatches } per gli artefatti
const reloadResults = [];  // { path, moment, digestEqual, castEqual, saveLeaks } per il report salva+ricarica
function parseActualPresence(s) {
  let m;
  if ((m = /^PLACED@([a-z0-9_]+) (-?\d+),(-?\d+) (\w+) \[(.*)\]$/i.exec(s || ''))) return { status: 'PLACED', map: m[1], x: Number(m[2]), y: Number(m[3]), dir: m[4], source: m[5] };
  if ((m = /^OFFSCREEN\(([^)]*)\) \[(.*)\]$/.exec(s || ''))) return { status: 'OFFSCREEN', label: m[1] || null, source: m[2] };
  if ((m = /^TERMINAL_REMOVED\(([^)]*)\) \[(.*)\]$/.exec(s || ''))) return { status: 'TERMINAL_REMOVED', event: m[1] || null, source: m[2] };
  return { status: 'UNKNOWN', raw: s };
}
function parsePinExpect(exp) {
  if (exp === 'TERMINAL_REMOVED') return { status: 'TERMINAL_REMOVED' };
  if (exp === 'OFFSCREEN') return { status: 'OFFSCREEN' };
  if (exp.indexOf('OFFSCREEN:') === 0) return { status: 'OFFSCREEN', label: exp.slice('OFFSCREEN:'.length) };
  const m = /^([a-z0-9_]+)(?:@(-?\d+),(-?\d+))?$/i.exec(exp);
  if (!m) throw new Error('pin illeggibile: ' + exp);
  return { status: 'PLACED', map: m[1], x: m[2] !== undefined ? Number(m[2]) : undefined, y: m[3] !== undefined ? Number(m[3]) : undefined };
}
function matchesPin(actual, expect) {
  if (actual.status !== expect.status) return false;
  if (expect.status === 'PLACED') {
    if (expect.map !== undefined && actual.map !== expect.map) return false;
    if (expect.x !== undefined && actual.x !== expect.x) return false;
    if (expect.y !== undefined && actual.y !== expect.y) return false;
  } else if (expect.status === 'OFFSCREEN' && expect.label !== undefined) {
    if (actual.label !== expect.label) return false;
  }
  return true;
}
function pinPostPhone(opts) {
  return { palmer: 'ACT4_POST_PHONE_INSIDE_PALMER', centrale: 'ACT4_POST_PHONE_INSIDE_CENTRALE', nessuno: 'ACT4_POST_PHONE_INSIDE_NESSUNO' }[opts.warning] || null;
}
function pinRoute(opts) {
  if (opts.warning === 'palmer' && opts.focus === 'palmer') return 'ACT4_ROUTE_PALMER';
  if (opts.warning === 'nessuno' && opts.focus === 'diner') return 'ACT4_ROUTE_DINER';
  if (opts.warning === 'centrale' && opts.focus === 'lago') return 'ACT4_ROUTE_LAKE';
  return null;
}
function pinShore(opts) {
  if (opts.warning === 'palmer' && opts.focus === 'palmer') return 'ACT4_SHORE_HAWK';
  if (opts.warning === 'centrale' && opts.focus === 'lago') return 'ACT4_SHORE_COOPER_AFTER';
  return null;
}
function pinStation(opts) {
  if (opts.warning === 'palmer' && opts.focus === 'palmer') return 'ACT4_STATION_BEFORE_DAWN';
  return null;
}
// nessuna mappa viva ha due corpi del registro con lo stesso id
async function assertNoDuplicateBodies(P, name, moment, cw) {
  const maps = new Set();
  for (const id of Object.keys(cw)) { const a = parseActualPresence(cw[id]); if (a.status === 'PLACED') maps.add(a.map); }
  const dups = [];
  for (const map of maps) {
    const bodies = await P.bodiesOn(map);
    const counts = {};
    for (const b of bodies) counts[b.id] = (counts[b.id] || 0) + 1;
    for (const [id, n] of Object.entries(counts)) if (n > 1) dups.push({ map, id, n });
  }
  check(`[${name}] presenza (${moment}): nessuna mappa viva ha due corpi con lo stesso id`, dups.length === 0, dups);
}
// scatto del registro Cast Continuity in un momento chiave: confronta col pin
// (se ne esiste uno per la combinazione warning/focus/foundBy di questo
// percorso), controlla i doppioni, e lo registra per gli artefatti.
async function captureCast(P, name, moment, pinId) {
  const cw = await P.castWhere();
  const mismatches = [];
  if (pinId) {
    const pin = CAST_FIXTURE.pins.find((p) => p.id === pinId);
    if (!pin) mismatches.push({ error: 'pin_not_found', pinId });
    else {
      for (const [id, expect] of Object.entries(pin.expect)) {
        const actualRaw = cw[id];
        if (actualRaw === undefined) { mismatches.push({ id, error: 'missing_from_snapshot' }); continue; }
        const parsed = parseActualPresence(actualRaw);
        const expObj = parsePinExpect(expect);
        if (!matchesPin(parsed, expObj)) mismatches.push({ id, expect, actual: actualRaw });
      }
    }
  }
  check(`[${name}] presenza (${moment}): il registro combacia col pin${pinId ? ' ' + pinId : ' (nessun pin adatto: solo cattura + doppioni)'}`,
    mismatches.length === 0, mismatches);
  await assertNoDuplicateBodies(P, name, moment, cw);
  await P.note('scatto registro Cast Continuity: ' + moment + (pinId ? ' (pin ' + pinId + ')' : ''), cw);
  castCaptures.push({ path: name, moment, pinId, snapshot: cw, mismatches });
  return cw;
}

const RETIRED_CLASSIC = ['truman_atto4', 'truman_atto5', 'lago_maddy', 'maddy_a4', 'leland_a4', 'leland_dove', 'leland_dopo', 'gerard_a4'];
const OBJ_M8 = (() => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'narrative', 'missions', 'M8.json'), 'utf8'));
  const out = {};
  for (const o of m.objectives || []) out[o.id] = o.text;
  return out;
})();
const SHERIFF = { truman: [11, 4, 'left'], lucy: [3, 6, 'down'], spawn: [7, 10, 'up'] };
const DINER_SPAWN = [6, 8, 'up'];
const PALMER_SPAWN = [7, 10, 'up'];

/* ------------------------ Sarah / Log Lady / Lucy ------------------------ */
async function visitSarah(P, name, where) {
  await P.travel('palmer', PALMER_SPAWN[0], PALMER_SPAWN[1], PALMER_SPAWN[2], 'viaggio: casa Palmer (' + where + ')');
  const active = await P.npcActive('palmer', 'sarah');
  check(`[${name}] Sarah: attiva a casa Palmer ${where}`, active.active, active);
  const sarah = await useActor(P, 'palmer', 'sarah', 'sarah_visione (' + where + ')');
  const classic = (sarah.rows || []).filter((r) => r.kind === 'classic');
  const pages = classic.length ? classic[0].pages : [];
  check(`[${name}] Sarah: il dialogo classico rende almeno le pagine 1–2 (${where})`,
    classic.length === 1 && classic[0].id === 'sarah_visione' && pages.length >= 2, sarah.rows);
  check(`[${name}] Sarah: mai il token «BOB» nella visione (${where})`,
    !pages.some((t) => /\bBOB\b/.test(t)), pages);
  const flags = await P.classicFlags();
  check(`[${name}] Sarah: sarah_visione_ascoltata scritto (${where})`, !!flags.sarah_visione_ascoltata, flags);
  return sarah;
}
async function visitLogLady(P, name) {
  const ll = await useActor(P, 'diner', 'loglady', 'loglady_a4');
  const classic = (ll.rows || []).filter((r) => r.kind === 'classic');
  check(`[${name}] Log Lady: il ceppo indica il Roadhouse (classico loglady_a4)`,
    classic.length === 1 && classic[0].id === 'loglady_a4', ll.rows);
  check(`[${name}] Log Lady: nessuna pagina narrativa né rifiuto dell'adapter`,
    pageIds(ll.rows).length === 0 && !(ll.rows || []).some((r) => r.kind === 'no_roots'), ll.rows);
}
async function visitLucy(P, name, phase, expectPages, forbidPages) {
  await P.travel('sheriff', SHERIFF.lucy[0], SHERIFF.lucy[1], SHERIFF.lucy[2], 'viaggio: reception (' + phase + ')');
  const lucy = await useActor(P, 'sheriff', 'lucy', 'm8_lucy (' + phase + ')');
  const ids = pageIds(lucy.rows);
  check(`[${name}] Lucy (${phase}): esattamente le pagine ${JSON.stringify(expectPages)}`,
    ids.join(',') === expectPages.join(',') && !lucy.viaApi,
    { got: ids, viaApi: !!lucy.viaApi });
  check(`[${name}] Lucy (${phase}): nessun widget, nessun effetto`, !hasWidget(lucy.rows) && noEffects(lucy.delta), lucy.delta);
  return lucy;
}

/* --------------------------------- diner --------------------------------- */
async function playDiner(P, name, opts, shot) {
  await P.travel('diner', DINER_SPAWN[0], DINER_SPAWN[1], DINER_SPAWN[2], 'viaggio: Double R');
  await captureCast(P, name, 'pomeriggio al diner (prima della promessa)', 'ACT4_AFTERNOON');
  const maddyR = await P.castResolve('maddy');
  const lelandR = await P.castResolve('leland');
  let npcs = await P.npcsHere();
  check(`[${name}] diner: Maddy e Leland presenti al bancone prima della promessa`,
    npcs.some((n) => n.id === 'maddy') && npcs.some((n) => n.id === 'leland') &&
    maddyR.status === 'PLACED' && maddyR.sceneId === 'diner' && lelandR.status === 'PLACED' && lelandR.sceneId === 'diner',
    { npcs, maddyR, lelandR });
  const m = npcs.find((n) => n.id === 'maddy'), l = npcs.find((n) => n.id === 'leland');
  check(`[${name}] diner: Maddy e Leland alle caselle del registro (${maddyR.x},${maddyR.y} / ${lelandR.x},${lelandR.y})`,
    m && l && m.x === maddyR.x && m.y === maddyR.y && l.x === lelandR.x && l.y === lelandR.y, { m, l });
  if (shot) await shot('diner-maddy-leland.png');

  // Leland PRIMA della promessa: attende che Maddy finisca
  const waiting = await useActor(P, 'diner', 'leland', 'm8_leland_waiting');
  const wIds = pageIds(waiting.rows);
  check(`[${name}] diner: Leland prima della promessa rende esattamente m8.a.leland_waiting.p01 + p02`,
    wIds.join(',') === 'm8.a.leland_waiting.p01,m8.a.leland_waiting.p02' && !waiting.viaApi, { got: wIds, viaApi: !!waiting.viaApi });
  check(`[${name}] diner: l'attesa di Leland non scrive nulla`, noEffects(waiting.delta), waiting.delta);
  const objBefore = await P.objective();
  check(`[${name}] HUD: prima della promessa l'obiettivo è obj_m8_0`, objBefore === OBJ_M8.obj_m8_0, { got: objBefore, want: OBJ_M8.obj_m8_0 });

  // Maddy: la promessa
  const maddy = await useActor(P, 'diner', 'maddy', 'm8_diner');
  check(`[${name}] diner: la promessa apre le tre opzioni`,
    ['promise_accompagno', 'promise_autonomia', 'promise_prudenza'].every((c) => (maddy.choices || []).includes(c)), maddy.choices);
  const chosen = await P.choose('promise_' + opts.promise);
  check(`[${name}] diner: il feedback della promessa «${opts.promise}» è la sua pagina`,
    chosen.ok && pageIds(chosen.rows).includes('m8.a.diner.feedback.' + opts.promise), chosen.rows && pageIds(chosen.rows));
  let st = await P.state();
  check(`[${name}] diner: promise_stance = ${opts.promise}`, st.values.promise_stance === opts.promise, st.values);
  npcs = await P.npcsHere();
  const maddyAfterPromise = await P.castResolve('maddy');
  check(`[${name}] diner: Maddy resta al bancone dopo la promessa (lascia solo a T_LELAND_TAXI), Leland resta`,
    npcs.some((n) => n.id === 'maddy') && npcs.some((n) => n.id === 'leland') &&
    maddyAfterPromise.status === 'PLACED' && maddyAfterPromise.sceneId === 'diner', { npcs, maddyAfterPromise });
  await captureCast(P, name, 'diner dopo la promessa', 'ACT4_PROMISE_MADE');
  const obj25 = await P.objective();
  check(`[${name}] HUD: dopo la promessa l'obiettivo è obj_m8_25`, obj25 === OBJ_M8.obj_m8_25, { got: obj25, want: OBJ_M8.obj_m8_25 });

  // Log Lady: PRIMA del taxi — dopo la chiusura del Double R (T_LELAND_TAXI) è al Roadhouse (Cast Continuity D7/B1)
  if (opts.loglady) await visitLogLady(P, name);

  // Leland: il taxi
  const taxi = await useActor(P, 'diner', 'leland', 'm8_leland_taxi');
  const tIds = pageIds(taxi.rows);
  check(`[${name}] diner: la testimonianza del taxi rende le pagine della promessa «${opts.promise}»`,
    tIds.includes('m8.b0.leland_taxi.p01') && tIds.includes('m8.b0.leland_taxi.' + opts.promise + '.p01') &&
    ['accompagno', 'autonomia', 'prudenza'].filter((v) => v !== opts.promise).every((v) => !tIds.includes('m8.b0.leland_taxi.' + v + '.p01')) &&
    !taxi.viaApi, { got: tIds, viaApi: !!taxi.viaApi });
  st = await P.state();
  check(`[${name}] diner: T_LELAND_TAXI acquisita`, st.evidence.includes('T_LELAND_TAXI'), st.evidence);
  npcs = await P.npcsHere();
  const maddyAfterTaxi = await P.castResolve('maddy');
  check(`[${name}] diner: Leland e Maddy spariscono dopo la testimonianza (T_LELAND_TAXI)`,
    !npcs.some((n) => n.id === 'leland') && !npcs.some((n) => n.id === 'maddy') &&
    maddyAfterTaxi.status === 'OFFSCREEN' && maddyAfterTaxi.label === 'home', { npcs, maddyAfterTaxi });
  const obj1 = await P.objective();
  check(`[${name}] HUD: dopo il taxi l'obiettivo è obj_m8_1`, obj1 === OBJ_M8.obj_m8_1, { got: obj1, want: OBJ_M8.obj_m8_1 });
  // Cast Continuity (B1): con la chiusura del Double R i quattro habitué sono già al Roadhouse
  const regulars = ['norma', 'shelly', 'loglady', 'james'];
  const regularsAfter = {};
  for (const id of regulars) regularsAfter[id] = await P.castResolve(id);
  check(`[${name}] diner: dopo la chiusura (T_LELAND_TAXI) Norma, Shelly, Log Lady e James sono al Roadhouse, non più al diner`,
    regulars.every((id) => !npcs.some((n) => n.id === id) && regularsAfter[id].status === 'PLACED' && regularsAfter[id].sceneId === 'roadhouse'), { npcs, regularsAfter });
}

/* ------------------------------- Roadhouse ------------------------------- */
async function playRoadhouse(P, name, opts, shot) {
  // ingresso REALE dalla porta di città (47,28 needsFlag atto4)
  const rhDoor = Object.entries(await P.doorsOf('town')).find(([, d]) => d.to === 'roadhouse');
  check(`[${name}] Roadhouse: la città ha una porta per il Roadhouse`, !!rhDoor, await P.doorsOf('town'));
  const [dx, dy] = rhDoor ? rhDoor[0].split(',').map(Number) : [47, 28];
  await P.travel('town', dx, dy + 1, 'up', 'viaggio: davanti al Roadhouse');
  const door = await P.enterDoor(dx, dy, dx, dy + 1);
  check(`[${name}] Roadhouse: la porta si apre con atto4`, door.ok && door.map === 'roadhouse', door);

  const cwArrival = await captureCast(P, name, 'ingresso al Roadhouse (raduno serale)', 'ACT4_EVENING_GATHERING');
  const crowdIds = Object.keys(cwArrival).filter((id) => id !== 'truman' && id !== 'giant' &&
    parseActualPresence(cwArrival[id]).status === 'PLACED' && parseActualPresence(cwArrival[id]).map === 'roadhouse');
  let npcs = await P.npcsHere();
  const ids = npcs.map((n) => n.id);
  check(`[${name}] Roadhouse: Truman e la folla presenti all'arrivo, Gigante assente`,
    ids.includes('truman') && crowdIds.length > 0 && crowdIds.every((c) => ids.includes(c)) && !ids.includes('giant'),
    { npcs: ids, crowdIds, cast: cwArrival });
  const phone = (await P.worldTarget('roadhouse', 'roadhouse_phone')) || { x: 8, y: 5 };
  check(`[${name}] Roadhouse: nessuna entità sul telefono o sulle caselle sopra/sotto`,
    !npcs.some((n) => n.x === phone.x && Math.abs(n.y - phone.y) <= 1), { phone, npcs });
  if (shot) await shot('roadhouse-populated.png');

  // Truman: la dichiarazione (solo per Cooper, nessuna destinazione, nessun widget)
  const tr = await useActor(P, 'roadhouse', 'truman', 'm8_roadhouse_truman');
  const trIds = pageIds(tr.rows);
  check(`[${name}] Roadhouse: la dichiarazione al tavolo rende m8.b.truman.p01…p05`,
    ['p01', 'p02', 'p03', 'p04', 'p05'].every((p) => trIds.includes('m8.b.truman.' + p)) && !tr.viaApi, { got: trIds, viaApi: !!tr.viaApi });
  check(`[${name}] Roadhouse: la dichiarazione non apre il telefono nello stesso lease`,
    !hasWidget(tr.rows) && !trIds.some((p) => p.startsWith('m8.b.phone')), trIds);
  let st = await P.state();
  check(`[${name}] Roadhouse: presagio_status = active dopo la dichiarazione`, st.values.presagio_status === 'active', st.values);
  check(`[${name}] Roadhouse: m8_roadhouse_truman committato`, st.nodes_done.includes('m8_roadhouse_truman'), st.nodes_done);
  await P.wait(500);
  npcs = await P.npcsHere();
  const giant = npcs.find((n) => n.id === 'giant');
  const giantR = await P.castResolve('giant');
  check(`[${name}] Roadhouse: il Gigante è sul palco (${giantR.x},${giantR.y}) dopo la dichiarazione`,
    !!giant && giantR.status === 'PLACED' && giantR.sceneId === 'roadhouse' && giant.x === giantR.x && giant.y === giantR.y, { giant, giantR, npcs });
  const obj15 = await P.objective();
  check(`[${name}] HUD: dopo la dichiarazione il testo è esattamente «Il telefono del Roadhouse.»`,
    obj15 === 'Il telefono del Roadhouse.', obj15);
  const cf = await P.classicFlags();
  check(`[${name}] mondo: gigante2 classico derivato dalla dichiarazione`, cf.gigante2 === true, cf.gigante2);
  const sarah = await P.npcActive('palmer', 'sarah');
  // Cast Presence: Sarah è OFFSCREEN (dorme di sopra) da presagio_status=active — nessun corpo, non un corpo spento
  check(`[${name}] mondo: Sarah non è più a casa Palmer dopo la dichiarazione (nessun corpo: OFFSCREEN asleep)`, !sarah.present, sarah);
  const bobby = await P.npcActive('town', 'bobby'), donna = await P.npcActive('town', 'donna');
  check(`[${name}] mondo: bobby e donna assenti dalla città dopo la dichiarazione`, !bobby.active && !donna.active, { bobby, donna });
  await captureCast(P, name, 'Roadhouse dopo la dichiarazione (pre-telefono)', 'ACT4_ROADHOUSE_PRE_PHONE');
  if (name === 'A') {
    const cwPreBefore = await P.castWhere();
    const rlPre = await P.reload();
    check(`[${name}] reload prima del telefono: registro narrativo identico`,
      JSON.stringify(rlPre.before.digest) === JSON.stringify(rlPre.after.digest), { before: rlPre.before.digest, after: rlPre.after.digest });
    const cwPreAfter = await captureCast(P, name, 'pre-telefono: dopo il reload', 'ACT4_ROADHOUSE_PRE_PHONE');
    check(`[${name}] reload prima del telefono: il registro Cast Continuity è identico prima e dopo`,
      JSON.stringify(cwPreBefore) === JSON.stringify(cwPreAfter), { before: cwPreBefore, after: cwPreAfter });
    reloadResults.push({ path: name, moment: 'Roadhouse pre-telefono', digestEqual: JSON.stringify(rlPre.before.digest) === JSON.stringify(rlPre.after.digest), castEqual: JSON.stringify(cwPreBefore) === JSON.stringify(cwPreAfter) });
    if (rlPre.after.map !== 'roadhouse') {
      await P.note(`reload pre-telefono: la build ha ripristinato ${rlPre.after.map} invece del Roadhouse`, rlPre.after);
      await P.travel('roadhouse', 7, 8, 'up', 'ritorno al Roadhouse dopo il reload pre-telefono');
    }
  }

  // il Gigante: una sola pagina, mai un secondo enunciato
  const g1 = await useActor(P, 'roadhouse', 'giant', 'm8_giant_stage');
  if (shot) await shot('roadhouse-giant-stage.png');
  const g1Ids = pageIds(g1.rows);
  check(`[${name}] Roadhouse: il Gigante rende solo m8.b.giant.p01`,
    g1Ids.join(',') === 'm8.b.giant.p01' && !hasWidget(g1.rows) && !g1.viaApi, { got: g1Ids, viaApi: !!g1.viaApi });
  const g2 = await useActor(P, 'roadhouse', 'giant', 'm8_giant_stage (ripetizione)');
  const g2Ids = pageIds(g2.rows);
  check(`[${name}] Roadhouse: la ripetizione del Gigante non aggiunge enunciati`,
    g2Ids.length >= 1 && g2Ids.every((p) => p === 'm8.b.giant.p01' || p === 'm8.b.giant.repeat') && !hasWidget(g2.rows), g2Ids);
  check(`[${name}] Roadhouse: il Gigante non scrive nulla`,
    noEffects(g1.delta) && noEffects(g2.delta), { d1: g1.delta, d2: g2.delta });

  // il telefono
  const ph = await useTarget(P, phone.x, phone.y, 'm8_roadhouse_phone');
  check(`[${name}] Roadhouse: il telefono si raggiunge e apre le tre opzioni`,
    ph.ok && ['warning_palmer', 'warning_centrale', 'warning_nessuno'].every((c) => (ph.choices || []).includes(c)), ph);
  const phIds = pageIds(ph.rows);
  check(`[${name}] Roadhouse: il telefono rende m8.b.phone.p01 e p02`,
    phIds.includes('m8.b.phone.p01') && phIds.includes('m8.b.phone.p02'), phIds);
  if (shot) await shot('roadhouse-phone-widget.png');
  const wc = await P.choose('warning_' + opts.warning);
  const wcIds = pageIds(wc.rows);
  const feedbackWant = opts.warning === 'palmer'
    ? ['m8.b.roadhouse.feedback.palmer.p01', 'm8.b.roadhouse.feedback.palmer.p02']
    : ['m8.b.roadhouse.feedback.' + opts.warning];
  check(`[${name}] Roadhouse: il feedback dell'avviso «${opts.warning}» è quello scritto`,
    wc.ok && feedbackWant.every((p) => wcIds.includes(p)) && !wcIds.some((p) => p.includes('feedback') && !feedbackWant.includes(p)), wcIds);
  st = await P.state();
  check(`[${name}] Roadhouse: warning_target = ${opts.warning}`, st.values.warning_target === opts.warning, st.values);
  await P.wait(400);
  npcs = await P.npcsHere();
  check(`[${name}] Roadhouse: dopo la telefonata il Gigante non c'è più, Truman e la folla restano (fino a focus_destination)`,
    !npcs.some((n) => n.id === 'giant') && npcs.some((n) => n.id === 'truman') && crowdIds.every((c) => npcs.some((n) => n.id === c)),
    npcs.map((n) => n.id));
  const cwPostPhone = await captureCast(P, name, 'Roadhouse dopo il telefono (dentro la sala)', pinPostPhone(opts));
  const obj2 = await P.objective();
  check(`[${name}] HUD: dopo la telefonata l'obiettivo è obj_m8_2`, obj2 === OBJ_M8.obj_m8_2, { got: obj2, want: OBJ_M8.obj_m8_2 });

  // regressione di rientro: si esce e si rientra dal Roadhouse fra il
  // telefono e il crocevia — la folla e Truman devono esserci ancora, il
  // Gigante no (era solo per la finestra della dichiarazione).
  const doorsRH = await P.doorsOf('roadhouse');
  const exitEntry = Object.entries(doorsRH).find(([, d]) => d.to === 'town');
  const [rex, rey] = exitEntry ? exitEntry[0].split(',').map(Number) : [7, 9];
  const outAgain = await P.enterDoor(rex, rey, rex, rey - 1);
  check(`[${name}] Roadhouse: regressione di rientro — si esce a piedi prima del crocevia`, outAgain.ok && outAgain.map === 'town', outAgain);
  const doorsTownAgain = await P.doorsOf('town');
  const rhDoorAgain = Object.entries(doorsTownAgain).find(([, d]) => d.to === 'roadhouse');
  const [rdx, rdy] = rhDoorAgain ? rhDoorAgain[0].split(',').map(Number) : [dx, dy];
  const backIn = await P.enterDoor(rdx, rdy, rdx, rdy + 1);
  check(`[${name}] Roadhouse: regressione di rientro — si rientra a piedi`, backIn.ok && backIn.map === 'roadhouse', backIn);
  const npcsBackIn = await P.npcsHere();
  const cwBackIn = await captureCast(P, name, 'Roadhouse: rientro dopo il telefono, prima del crocevia', pinPostPhone(opts));
  check(`[${name}] Roadhouse: al rientro Truman e la folla ci sono ancora, il Gigante no`,
    npcsBackIn.some((n) => n.id === 'truman') && crowdIds.every((c) => npcsBackIn.some((n) => n.id === c)) && !npcsBackIn.some((n) => n.id === 'giant'),
    { npcs: npcsBackIn.map((n) => n.id), cast: cwBackIn });
  check(`[${name}] Roadhouse: il registro Cast Continuity è identico prima e dopo il rientro`,
    JSON.stringify(cwPostPhone) === JSON.stringify(cwBackIn), { before: cwPostPhone, after: cwBackIn });

  // salva + ricarica (persistenza reale di produzione)
  const cwBeforeReload = await P.castWhere();
  const rl = await P.reload();
  check(`[${name}] reload dopo il telefono: promessa e avviso persistono`,
    rl.after.digest.values.promise_stance === opts.promise && rl.after.digest.values.warning_target === opts.warning,
    { before: rl.before.digest.values, after: rl.after.digest.values, saved: rl.before.saved });
  check(`[${name}] reload dopo il telefono: stato narrativo identico`,
    JSON.stringify(rl.before.digest) === JSON.stringify(rl.after.digest), { before: rl.before.digest, after: rl.after.digest });
  check(`[${name}] reload dopo il telefono: obiettivo HUD identico`, rl.before.objective === rl.after.objective, { before: rl.before.objective, after: rl.after.objective });
  check(`[${name}] reload dopo il telefono: il Gigante NON ricompare (fuori finestra)`,
    !rl.after.npcs.some((n) => n.startsWith('giant@')), rl.after.npcs);
  check(`[${name}] reload dopo il telefono: entità identiche`, JSON.stringify(rl.before.npcs) === JSON.stringify(rl.after.npcs), { before: rl.before.npcs, after: rl.after.npcs });
  const cwAfterReload = await P.castWhere();
  check(`[${name}] reload dopo il telefono: il registro Cast Continuity è identico prima e dopo`,
    JSON.stringify(cwBeforeReload) === JSON.stringify(cwAfterReload), { before: cwBeforeReload, after: cwAfterReload });
  const saveRaw = await P.savedRaw();
  const saveText = (saveRaw.narrative || '') + '\n' + (saveRaw.classic || '');
  const leakedKeys = ['cast_source', 'sceneId', 'homeX'].filter((k) => saveText.indexOf(k) >= 0);
  check(`[${name}] reload dopo il telefono: il salvataggio persistito non contiene chiavi di posizione (cast_source/sceneId/homeX)`,
    leakedKeys.length === 0, leakedKeys);
  reloadResults.push({
    path: name, moment: 'Roadhouse dopo il telefono',
    digestEqual: JSON.stringify(rl.before.digest) === JSON.stringify(rl.after.digest),
    castEqual: JSON.stringify(cwBeforeReload) === JSON.stringify(cwAfterReload),
    saveLeaks: leakedKeys
  });
  if (rl.after.map !== 'roadhouse') {
    await P.note(`reload: la build ha ripristinato ${rl.after.map} ${rl.after.x},${rl.after.y} invece del Roadhouse`, rl.after);
    await P.travel('roadhouse', 7, 8, 'up', 'ritorno al Roadhouse dopo il reload (posizione non ripristinata)');
  } else if (rl.before.x !== rl.after.x || rl.before.y !== rl.after.y) {
    await P.note(`reload: la casella ripristinata (${rl.after.x},${rl.after.y}) non è quella lasciata (${rl.before.x},${rl.before.y})`);
  }
}

/* ------------------------------- soglia ------------------------------- */
async function playThreshold(P, name, opts, shot) {
  const exitDoor = Object.entries(await P.doorsOf('roadhouse')).find(([, d]) => d.to === 'town');
  const [ex, ey] = exitDoor ? exitDoor[0].split(',').map(Number) : [7, 9];
  const out = await P.enterDoor(ex, ey, ex, ey - 1);
  check(`[${name}] soglia: si esce dal Roadhouse in città`, out.ok && out.map === 'town', out);
  const pos = await P.pos();
  const target = (await P.worldTarget('town', 'town_crossroads')) || { x: 47, y: 30 };
  check(`[${name}] soglia: town_crossroads è a 47,30`, target.x === 47 && target.y === 30, target);
  // la casella d'arrivo è quella letta al cambio mappa (prima di ogni altro tasto)
  const arr = out.arrival || [pos.x, pos.y, pos.dir];
  check(`[${name}] soglia: si arriva sulla casella sopra il crocevia, rivolti in basso`,
    out.map === 'town' && arr[0] === target.x && arr[1] === target.y - 1 && arr[2] === 'down', { arrival: arr, pos, target });
  if (pos.x !== arr[0] || pos.y !== arr[1]) await P.note('soglia: dopo l\'arrivo Cooper si è mosso di una casella prima del tasto', { arrival: arr, pos });
  let fc;
  if (pos.map === 'town' && pos.x === target.x && pos.y === target.y - 1 && pos.dir === 'down') {
    fc = await P.interact();       // UN solo tasto, rivolti in basso
  } else {
    await P.note('soglia: posizione d\'uscita diversa dall\'attesa, si raggiunge il crocevia camminando', pos);
    fc = await useTarget(P, target.x, target.y, 'm8_focus_choice');
  }
  const widget = (fc.rows || []).find((r) => r.kind === 'widget');
  check(`[${name}] soglia: un tasto in basso apre il crocevia (m8_focus_choice)`,
    !!widget && ['focus_palmer', 'focus_lago', 'focus_diner'].every((c) => widget.choices.includes(c)), fc);
  check(`[${name}] soglia: il widget si apre a ${target.x},${target.y - 1} guardando ${target.x},${target.y}`,
    !!widget && widget.map === 'town' && widget.at[0] === target.x && widget.at[1] === target.y - 1 && widget.at[2] === 'down', widget && widget.at);
  const fcIds = pageIds(fc.rows);
  check(`[${name}] soglia: le pagine del crocevia precedono la scelta`,
    ['m8.c.focus.p01', 'm8.c.focus.p02', 'm8.c.focus.p03'].every((p) => fcIds.includes(p)), fcIds);
  if (shot) await shot('threshold-widget-47-30.png');
  const ch = await P.choose('focus_' + opts.focus);
  const st = await P.state();
  check(`[${name}] soglia: focus_destination = ${opts.focus}`, ch.ok && st.values.focus_destination === opts.focus, st.values);

  if (opts.reloadAfterFocus) {
    const cwFocusBefore = await P.castWhere();
    const rl = await P.reload();
    check(`[${name}] reload dopo il crocevia: promessa, avviso e focus persistono`,
      rl.after.digest.values.promise_stance === opts.promise && rl.after.digest.values.warning_target === opts.warning &&
      rl.after.digest.values.focus_destination === opts.focus, rl.after.digest.values);
    const cwFocusAfter = await P.castWhere();
    check(`[${name}] reload dopo il crocevia: il registro Cast Continuity è identico prima e dopo`,
      JSON.stringify(cwFocusBefore) === JSON.stringify(cwFocusAfter), { before: cwFocusBefore, after: cwFocusAfter });
    reloadResults.push({ path: name, moment: 'crocevia dopo la scelta di focus', digestEqual: true, castEqual: JSON.stringify(cwFocusBefore) === JSON.stringify(cwFocusAfter) });
    if (rl.after.map !== 'town') {
      await P.note(`reload: la build ha ripristinato ${rl.after.map} invece della città`, rl.after);
      await P.travel('town', target.x, target.y - 1, 'down', 'ritorno al crocevia dopo il reload (posizione non ripristinata)');
    }
  }
  return target;
}

/* -------------------------------- rotte -------------------------------- */
// dal crocevia (47,29) fino al target scelto, SOLO coi tasti
async function walkRoute(P, name, opts, shot, crossroads) {
  await captureCast(P, name, 'dopo la scelta di focus, al crocevia', pinRoute(opts));
  const lake = (await P.worldTarget('town', 'lago_maddy')) || { x: 15, y: 28 };
  if (opts.focus === 'palmer') {
    const pd = Object.entries(await P.doorsOf('town')).find(([, d]) => d.to === 'palmer');
    const [px, py] = pd ? pd[0].split(',').map(Number) : [42, 6];
    const d1 = await P.enterDoor(px, py, px, py + 1);
    check(`[${name}] rotta Palmer: si cammina dal crocevia fino alla porta dei Palmer`, d1.ok && d1.map === 'palmer', d1);
    const entrance = (await P.worldTarget('palmer', 'palmer_entrance')) || { x: 8, y: 10 };
    const r = await useTarget(P, entrance.x, entrance.y, 'm8_route_palmer');
    if (shot) await shot('route-arrival-' + name + '.png');
    const ids = pageIds(r.rows);
    check(`[${name}] rotta Palmer: la casa vuota, la valigia (avviso=palmer), la chiamata di Lucy`,
      ['m8.c.route_palmer.p01', 'm8.c.route_palmer.p03', 'm8.c.route_palmer.p04', 'm8.c.route_palmer.p05'].every((p) => ids.includes(p)) &&
      ids.includes('m8.c.route_palmer.p02') === (opts.warning === 'palmer'), ids);
    const st = await P.state();
    check(`[${name}] rotta Palmer: body_found_by = hawk`, st.values.body_found_by === 'hawk', st.values);
    // verso il lago, ancora a piedi: fuori dalla casa, giù per la città
    const exitD = Object.entries(await P.doorsOf('palmer')).find(([, d]) => d.to === 'town');
    const [ox, oy] = exitD ? exitD[0].split(',').map(Number) : [7, 11];
    const back = await P.enterDoor(ox, oy, ox, oy - 1);
    check(`[${name}] rotta Palmer: si torna in città a piedi`, back.ok && back.map === 'town', back);
  } else if (opts.focus === 'lago') {
    const r = await useTarget(P, lake.x, lake.y, 'm8_route_lake');
    if (shot) await shot('route-arrival-' + name + '.png');
    const ids = pageIds(r.rows);
    check(`[${name}] rotta lago: si cammina dal crocevia alla riva e la rotta risponde`,
      r.ok && ids.includes('m8.c.route_lake.p01') && ids.includes('m8.c.route_lake.p02'), { ok: r.ok, ids, err: r.error, detail: r.detail });
    const st = await P.state();
    check(`[${name}] rotta lago: body_found_by = cooper`, st.values.body_found_by === 'cooper', st.values);
  } else {
    const dd = Object.entries(await P.doorsOf('town')).find(([, d]) => d.to === 'double_r_exterior_prototype' || d.to === 'diner');
    const [qx, qy] = dd ? dd[0].split(',').map(Number) : [42, 20];
    const d1 = await P.enterDoor(qx, qy, qx, qy + 1);
    check(`[${name}] rotta diner: si cammina dal crocevia al piazzale del Double R`, d1.ok, d1);
    if (d1.ok && d1.map !== 'diner') {
      const inner = Object.entries(await P.doorsOf(d1.map)).find(([, d]) => d.to === 'diner');
      const [ix, iy] = inner ? inner[0].split(',').map(Number) : [6, 6];
      const d2 = await P.enterDoor(ix, iy, ix, iy + 1);
      check(`[${name}] rotta diner: dal piazzale si entra nel Double R`, d2.ok && d2.map === 'diner', d2);
    }
    const r = await useActor(P, 'diner', 'norma', 'm8_route_diner');
    if (shot) await shot('route-arrival-' + name + '.png');
    const ids = pageIds(r.rows);
    check(`[${name}] rotta diner: Norma, il locale vuoto, la chiamata`,
      ['m8.c.route_diner.p01', 'm8.c.route_diner.p02', 'm8.c.route_diner.p03'].every((p) => ids.includes(p)) && !r.viaApi, { ids, viaApi: !!r.viaApi });
    const st = await P.state();
    check(`[${name}] rotta diner: body_found_by = hawk`, st.values.body_found_by === 'hawk', st.values);
    // ritorno in città a piedi
    const exitD = Object.entries(await P.doorsOf('diner')).find(([, d]) => d.to !== 'diner');
    const [ox, oy] = exitD ? exitD[0].split(',').map(Number) : [6, 9];
    const b1 = await P.enterDoor(ox, oy, ox, oy - 1);
    check(`[${name}] rotta diner: si esce dal Double R a piedi`, b1.ok, b1);
    if (b1.ok && b1.map !== 'town') {
      const lot = Object.entries(await P.doorsOf(b1.map)).find(([, d]) => d.to === 'town');
      const [lx, ly] = lot ? lot[0].split(',').map(Number) : [6, 11];
      const b2 = await P.enterDoor(lx, ly, lx, ly - 1);
      check(`[${name}] rotta diner: dal piazzale si torna in città`, b2.ok && b2.map === 'town', b2);
    }
  }
  const objRoute = await P.objective();
  check(`[${name}] HUD: dopo la rotta l'obiettivo resta obj_m8_2 (fino al ritrovamento)`, objRoute === OBJ_M8.obj_m8_2, { got: objRoute, want: OBJ_M8.obj_m8_2 });
  return lake;
}

/* ------------------------------- la riva ------------------------------- */
async function playShore(P, name, opts, shot, lake) {
  const st0 = await P.state();
  const foundBy = st0.values.body_found_by;
  const hawkR0 = await P.castResolve('hawk');
  check(`[${name}] riva: la collocazione di Hawk prima del ritrovamento è quella del registro`,
    foundBy === 'hawk'
      ? (hawkR0.status === 'PLACED' && hawkR0.sceneId === 'town' && hawkR0.x === 16 && hawkR0.y === 27)
      : (hawkR0.status === 'OFFSCREEN' && hawkR0.label === 'patrol'),
    { hawkR0, foundBy });
  // si cammina fino alla riva (per lago si è già lì)
  const rr = await P.reach(lake.x, lake.y);
  check(`[${name}] riva: la riva del lago si raggiunge a piedi`, rr.ok, rr);
  let npcs = await P.npcsHere();
  const hawksBefore = npcs.filter((n) => n.id.startsWith('hawk'));
  check(`[${name}] riva: Hawk sulla riva PRIMA del ritrovamento ${foundBy === 'hawk' ? 'presente' : 'assente'} (body_found_by=${foundBy})`,
    (foundBy === 'hawk') === (hawksBefore.length === 1) && (foundBy === 'hawk' || hawksBefore.length === 0), { hawksBefore, foundBy });
  if (foundBy === 'hawk' && hawksBefore.length === 1) {
    check(`[${name}] riva: Hawk non blocca l'approccio alla riva`, rr.ok && !(hawksBefore[0].x === rr.from[0] && hawksBefore[0].y === rr.from[1]), { hawk: hawksBefore[0], from: rr.from });
  }
  if (shot) await shot('shore-before-discovery.png');

  const disc = await P.interact();
  const ids = pageIds(disc.rows);
  const wantDisc = foundBy === 'cooper'
    ? ['m8.d.discovery.cooper.p01', 'm8.d.discovery.cooper.p02', 'm8.d.discovery.cooper.p03', 'm8.d.discovery.cooper.p04']
    : ['m8.d.discovery.hawk.p01', 'm8.d.discovery.hawk.p02', 'm8.d.discovery.hawk.p03'];
  const otherDisc = foundBy === 'cooper' ? 'm8.d.discovery.hawk.' : 'm8.d.discovery.cooper.';
  check(`[${name}] riva: il ritrovamento rende la versione «${foundBy}»`,
    wantDisc.every((p) => ids.includes(p)) && !ids.some((p) => p.startsWith(otherDisc)), ids);
  // l'eco della promessa: next obbligatorio; se non è nella stessa sessione si preme di nuovo
  let echoIds = ids;
  if (!ids.includes('m8.d.echo.p01')) {
    await P.note('riva: l\'eco della promessa non è arrivata nella stessa sessione del ritrovamento, seconda pressione', ids);
    const echo = await P.interact();
    echoIds = pageIds(echo.rows);
  }
  check(`[${name}] riva: l'eco della promessa è la versione «${opts.promise}»`,
    echoIds.includes('m8.d.echo.p01') && echoIds.includes('m8.d.echo.' + opts.promise) &&
    ['accompagno', 'autonomia', 'prudenza'].filter((v) => v !== opts.promise).every((v) => !echoIds.includes('m8.d.echo.' + v)) &&
    echoIds.includes('m8.d.echo.p02') && echoIds.includes('m8.d.echo.p03'), echoIds);
  const st = await P.state();
  check(`[${name}] riva: maddy_trovata, E9A/E9B, presagio verified, eco committata`,
    st.flags.includes('maddy_trovata') && st.evidence.includes('E9A_LETTERA_O') && st.evidence.includes('E9B_STESSO_METODO') &&
    st.values.presagio_status === 'verified' && st.nodes_done.includes('m8_discovery') && st.nodes_done.includes('m8_promise_echo'), st);
  check(`[${name}] riva: letter_o_observation_source deriva da body_found_by`,
    st.values.letter_o_observation_source === (foundBy === 'cooper' ? 'cooper_primary' : 'hawk_preserved'), st.values);
  await P.wait(400);
  npcs = await P.npcsHere();
  const hawksAfter = npcs.filter((n) => n.id.startsWith('hawk'));
  const hawkR1 = await P.castResolve('hawk');
  check(`[${name}] riva: dopo il ritrovamento un solo Hawk, PLACED@town 16,27 dal registro`,
    hawksAfter.length === 1 && hawkR1.status === 'PLACED' && hawkR1.sceneId === 'town' && hawkR1.x === 16 && hawkR1.y === 27 &&
    hawksAfter[0].x === hawkR1.x && hawksAfter[0].y === hawkR1.y, { hawksAfter, hawkR1 });
  if (shot) await shot('shore-after-discovery.png');
  await captureCast(P, name, 'riva dopo il ritrovamento', pinShore(opts));
  const obj3 = await P.objective();
  check(`[${name}] HUD: dopo il ritrovamento l'obiettivo è obj_m8_3`, obj3 === OBJ_M8.obj_m8_3, { got: obj3, want: OBJ_M8.obj_m8_3 });
  const cf = await P.classicFlags();
  check(`[${name}] mondo: maddy_trovata attraversa al classico`, cf.maddy_trovata === true, cf.maddy_trovata);
}

/* ------------------------------- taccuino ------------------------------- */
async function playNotebook(P, name, opts) {
  const c1 = await P.compare('E9A_LETTERA_O', 'E3_LETTERA_R');
  const c1Ids = pageIds(c1.rows);
  check(`[${name}] taccuino: lettere R + O → m8_cmp_letters`,
    c1.ok && c1Ids.includes('m8.e.cmp_letters.p01') && (c1.rows || []).some((r) => r.kind === 'pair' && r.matched === 'm8_cmp_letters'), c1);
  await P.closeNotebook();
  let st = await P.state();
  check(`[${name}] taccuino: m8_cmp_letters committato`, st.nodes_done.includes('m8_cmp_letters'), st.nodes_done);

  const c2 = await P.compare('E9A_LETTERA_O', 'E1_DIARIO');
  check(`[${name}] taccuino: lettera O + diario → m8_cmp_diary con tre letture`,
    c2.ok && ['diary_a', 'diary_b', 'diary_c'].every((c) => (c2.choices || []).includes(c)), c2);
  const c2Ids = pageIds(c2.rows);
  check(`[${name}] taccuino: le pagine del diario precedono la scelta`,
    ['m8.e.cmp_diary.p01', 'm8.e.cmp_diary.p02', 'm8.e.cmp_diary.p03'].every((p) => c2Ids.includes(p)), c2Ids);
  for (const wrong of opts.wrongDiaryFirst) {
    const w = await P.choose(wrong);
    const wIds = pageIds(w.rows);
    check(`[${name}] taccuino: la lettura «${wrong}» risponde col suo feedback e resta ritentabile`,
      w.ok && wIds.includes('m8.e.cmp_diary.feedback.' + wrong.slice(-1)) && (w.after.choices || []).includes('diary_a') && !(w.after.choices || []).includes(wrong),
      { rows: wIds, choices: w.after && w.after.choices });
    check(`[${name}] taccuino: P8 non formulata dopo «${wrong}»`, (await P.propStatus('P8')) !== 'formulated', await P.propStatus('P8'));
  }
  const a = await P.choose('diary_a');
  check(`[${name}] taccuino: «diary_a» rende il suo feedback`, a.ok && pageIds(a.rows).includes('m8.e.cmp_diary.feedback.a'), pageIds(a.rows));
  await P.closeNotebook();
  check(`[${name}] taccuino: P8 formulata solo al commit di diary_a`, (await P.propStatus('P8')) === 'formulated', await P.propStatus('P8'));
  const obj35 = await P.objective();
  check(`[${name}] HUD: con P8 formulata l'obiettivo è obj_m8_35`, obj35 === OBJ_M8.obj_m8_35, { got: obj35, want: OBJ_M8.obj_m8_35 });
}

/* ------------------------------- stazione ------------------------------- */
async function playStation(P, name, opts, shot) {
  await P.travel('sheriff', SHERIFF.truman[0], SHERIFF.truman[1], SHERIFF.truman[2], 'viaggio: centrale');
  const st0 = await P.state();
  const sarahState = st0.values.sarah_support_state;
  const tr = await useActor(P, 'sheriff', 'truman', 'm8_station', shot ? 'm8.f.station.hook.p01' : null, shot, 'station-hook.png');
  const ids = pageIds(tr.rows);
  check(`[${name}] stazione: Truman risponde con m8_station (p01…p03), mai con M4/M6`,
    ids.includes('m8.f.station.p01') && ids.includes('m8.f.station.p02') && ids.includes('m8.f.station.p03') &&
    !ids.some((p) => /^m[46]\./.test(p)) && !tr.viaApi, { got: ids, viaApi: !!tr.viaApi });
  const wantSarah = sarahState === 'vice' ? 'm8.f.station.sarah_vice' : 'm8.f.station.sarah_truman';
  const otherSarah = sarahState === 'vice' ? 'm8.f.station.sarah_truman' : 'm8.f.station.sarah_vice';
  check(`[${name}] stazione: il caso Sarah è «${sarahState}» (${wantSarah})`, ids.includes(wantSarah) && !ids.includes(otherSarah), ids);
  const valigiaExpected = opts.warning === 'palmer' && opts.focus !== 'palmer';
  check(`[${name}] stazione: p_valigia ${valigiaExpected ? 'presente' : 'assente'} (avviso=${opts.warning}, focus=${opts.focus})`,
    ids.includes('m8.f.station.p_valigia') === valigiaExpected, ids);
  check(`[${name}] stazione: p_lago ${opts.focus === 'lago' ? 'presente' : 'assente'} (focus=${opts.focus})`,
    ids.includes('m8.f.station.p_lago') === (opts.focus === 'lago'), ids);
  check(`[${name}] stazione: l'aggancio dell'orario (hook p01/p02) chiude la scena`,
    ids.includes('m8.f.station.hook.p01') && ids.includes('m8.f.station.hook.p02') &&
    ids.indexOf('m8.f.station.hook.p01') > ids.indexOf('m8.f.station.p03'), ids);
  const st = await P.state();
  check(`[${name}] stazione: m8_station committato, T_LELAND_TAXI ancora una sola acquisizione`,
    st.nodes_done.includes('m8_station') && st.evidence.includes('T_LELAND_TAXI'), st.nodes_done);
  const o4 = await P.objectiveOf('M8');
  check(`[${name}] obiettivo M8 dopo la stazione: obj_m8_4 «${OBJ_M8.obj_m8_4}»`,
    !!o4 && o4.id === 'obj_m8_4' && o4.text === OBJ_M8.obj_m8_4, o4);
  const hud = await P.objective();
  await P.note('HUD dopo la stazione (M9 diventa corrente)', { hud, m8: o4, m9: await P.objectiveOf('M9') });
  const bobby = await P.npcActive('town', 'bobby'), donna = await P.npcActive('town', 'donna');
  check(`[${name}] mondo: bobby e donna ancora assenti dalla città dopo la stazione`, !bobby.active && !donna.active, { bobby, donna });
  const sarah = await P.npcActive('palmer', 'sarah');
  // Cast Presence (D1): Sarah resta OFFSCREEN fino ad atto5, poi torna alla baseline (casa Palmer)
  const stAfter = await P.state();
  const atto5Now = !!(stAfter && stAfter.flags && stAfter.flags.includes('atto5'));
  check(`[${name}] mondo: Sarah ${atto5Now ? 'di nuovo a casa Palmer (atto5 aperto)' : 'ancora assente da casa Palmer (prima di atto5)'} dopo la stazione`, sarah.present === atto5Now, { sarah, atto5Now });
  await captureCast(P, name, 'centrale prima dell\'alba (fine giocata)', pinStation(opts));
}

/* ------------------------------ un percorso ------------------------------ */
async function runPath(cdp, name, shot) {
  const P = ev(cdp);
  const opts = PATHS[name];
  const S = opts.shots ? shot : null;
  const routeShot = shot;   // l'arrivo della rotta si fotografa su ogni percorso

  await P.status('boot-' + name);
  const boot = await P.boot();
  check(`[${name}] setup: build reale in partita (testMode=${boot.testMode})`, boot.mode === 'play' && boot.testMode === false, boot);
  const seed = await P.seed();
  check(`[${name}] setup: seme di fine Atto 3 installato (atto4, gigante1, jacques_dead, E3, E1) e M8 corrente`,
    seed.refreshed && seed.refreshed.mission === 'M8' && seed.digest.flags.includes('atto4') && seed.digest.flags.includes('gigante1') &&
    seed.digest.flags.includes('jacques_dead') && seed.digest.evidence.includes('E3_LETTERA_R') && seed.digest.evidence.includes('E1_DIARIO'), seed);
  const nodeIds = await P.missionNodeIds('M8');
  check(`[${name}] setup: M8 caricata con i nodi dello split`,
    ['m8_roadhouse_truman', 'm8_roadhouse_phone', 'm8_giant_stage', 'm8_leland_waiting', 'm8_lucy', 'm8_station'].every((n) => (nodeIds || []).includes(n)), nodeIds);
  await P.travel('sheriff', SHERIFF.truman[0], SHERIFF.truman[1], SHERIFF.truman[2], 'partenza: alla centrale davanti a Truman');
  await P.reset();                       // la trascrizione registra SOLO l'Atto 4
  await P.status('act4-' + name);
  const obj0 = await P.objective();
  check(`[${name}] HUD: all'apertura dell'Atto 4 l'obiettivo è obj_m8_0`, obj0 === OBJ_M8.obj_m8_0, { got: obj0, want: OBJ_M8.obj_m8_0 });

  if (opts.lucy) await visitLucy(P, name, 'prima del presagio', ['m8.lucy.p01', 'm8.lucy.p02'], ['m8.lucy.p03', 'm8.lucy.p04']);
  if (opts.sarahBeforeDiner) await visitSarah(P, name, 'prima del diner');

  await playDiner(P, name, opts, S);
  if (opts.sarahBetween) await visitSarah(P, name, 'fra il diner e il Roadhouse');
  await playRoadhouse(P, name, opts, S);
  const crossroads = await playThreshold(P, name, opts, S);
  const lake = await walkRoute(P, name, opts, routeShot, crossroads);
  await playShore(P, name, opts, S, lake);
  await playNotebook(P, name, opts);
  await playStation(P, name, opts, S);

  const dump = await P.dump();
  auditTranscript(name, dump, opts);
  return dump;
}

/* --------------------------- controlli sul testo --------------------------- */
const MISSIONS = ['M4', 'M5', 'M6', 'M8', 'M9'];
function loadMission(id) { return JSON.parse(fs.readFileSync(path.join(ROOT, 'narrative', 'missions', id + '.json'), 'utf8')); }
const AUTHORED = (() => {
  const out = {};
  for (const id of MISSIONS) {
    const m = loadMission(id);
    for (const n of m.nodes) {
      const all = [].concat(n.pages || [], n.pages_after_branch || []);
      if (n.pages_by_value) for (const c of Object.values(n.pages_by_value.cases || {})) all.push(...c);
      for (const c of n.choices || []) all.push(...(c.feedback_pages || []));
      if (n.presentation) for (const b of Object.values(n.presentation.on || {})) all.push(...(b.pages || []));
      if (n.repeat && n.repeat.id) all.push(n.repeat);
      for (const p of all) out[p.id] = p;
    }
  }
  return out;
})();
const OBJECTIVE_TEXTS = (() => {
  const set = new Set(['']);
  for (const id of MISSIONS) {
    const m = loadMission(id);
    for (const o of m.objectives || []) {
      set.add(o.text);
      if (o.optional_line) set.add(o.text + ' — ' + o.optional_line);
    }
  }
  return set;
})();
/* ordine di gioco dei pioli dell'obiettivo M8 (poi M9 prende l'HUD) */
const RUNGS = ['obj_m8_0', 'obj_m8_25', 'obj_m8_1', 'obj_m8_15', 'obj_m8_2', 'obj_m8_3', 'obj_m8_35', 'obj_m8_4']
  .map((id) => OBJ_M8[id]).filter(Boolean);

const METADATA_RE = /\[|\bm[4-9]_[a-z0-9_]+\b|\bm8\.[a-z0-9_.]+\b|E9A|E9B|E3_|E1_|P8\b|T_LELAND|LETTERS_SAME_METHOD|NAME_OVERREACH|hawk_preserved|cooper_primary/;
const A4_WORDING_RE = /\bBOB\b|sei lettere|quattro lettere|salvat|troppo tardi|se fossi|\bbugia\b|\bmentito\b/i;

function auditTranscript(name, dump, opts) {
  const pages = dump.transcript.filter((r) => r.kind === 'page');
  check(`[${name}] trascrizione: pagine registrate`, pages.length > 40, pages.length);

  // 1. lo speaker emesso è quello scritto
  const mismatched = pages.filter((p) => {
    const a = AUTHORED[p.page_id];
    if (!a) return false;
    return (a.speaker_id || null) !== (p.speaker_id || null) ||
           (a.display_name || null) !== (p.display_name || null);
  }).map((p) => ({ page: p.page_id, emitted: [p.speaker_id, p.display_name], authored: [AUTHORED[p.page_id].speaker_id, AUTHORED[p.page_id].display_name] }));
  check(`[${name}] voce: lo speaker emesso coincide con quello scritto su ogni pagina`, mismatched.length === 0, mismatched);
  const unknownPages = pages.filter((p) => !AUTHORED[p.page_id]).map((p) => p.page_id);
  check(`[${name}] voce: ogni pagina emessa è una pagina scritta in una missione`, unknownPages.length === 0, unknownPages);

  // 2. il testo emesso è quello scritto
  const textDrift = pages.filter((p) => {
    const a = AUTHORED[p.page_id];
    return a && a.text !== p.text;
  }).map((p) => ({ page: p.page_id, emitted: p.text, authored: AUTHORED[p.page_id].text }));
  check(`[${name}] testo: nessuna deriva fra pagina scritta e pagina emessa`, textDrift.length === 0, textDrift.slice(0, 4));

  // 3. nessun id/metadato a schermo, nessuna parola vietata dell'Atto 4
  const leaks = pages.filter((p) => METADATA_RE.test(p.text || '')).map((p) => ({ page: p.page_id, text: p.text }));
  check(`[${name}] testo: nessun id di risultato/nodo o metadato «[…]» a schermo`, leaks.length === 0, leaks.slice(0, 4));
  const wording = pages.filter((p) => p.page_id.startsWith('m8.') && A4_WORDING_RE.test(p.text || '')).map((p) => ({ page: p.page_id, text: p.text }));
  check(`[${name}] testo: nessun «BOB», conteggio di lettere, «salvat», «troppo tardi», «se fossi», «bugia/mentito» nelle pagine M8 emesse`, wording.length === 0, wording);

  // 4. obiettivi: solo testi autorizzati, e cambiano solo ai pioli scritti
  const objSeq = [];
  const sampled = dump.transcript.filter((r) => r.kind === 'page' || r.kind === 'objective')
    .map((r) => (r.kind === 'page' ? r.objective : String(r.text || '').replace(/^OBIETTIVO:\s*/, '')));
  for (const t of sampled) if (!objSeq.length || objSeq[objSeq.length - 1] !== t) objSeq.push(t);
  const unknown = objSeq.filter((t) => !OBJECTIVE_TEXTS.has(t));
  check(`[${name}] HUD: ogni testo di obiettivo osservato è un obiettivo scritto`, unknown.length === 0, unknown);
  const seen = objSeq.filter((t) => RUNGS.includes(t));
  const backwards = [];
  let cursor = -1;
  for (const t of seen) {
    const at = RUNGS.indexOf(t);
    if (at < cursor) backwards.push({ objective: t, after: RUNGS[cursor] });
    else cursor = at;
  }
  check(`[${name}] HUD: i pioli M8 si susseguono nell'ordine scritto, mai all'indietro`, backwards.length === 0, backwards);
  const skipped = seen.length ? RUNGS.slice(RUNGS.indexOf(seen[0]), RUNGS.indexOf(seen[seen.length - 1]) + 1).filter((t) => !seen.includes(t)) : [];
  if (skipped.length) notesOut.push({ path: name, kind: 'obiettivo mai mostrato', objectives: skipped });

  // 5. nessun dialogo classico ritirato, mai
  const classicIds = [].concat(
    dump.classic.map((c) => c.id),
    dump.transcript.filter((r) => r.kind === 'door' && r.blocked).map((r) => r.blocked.id),
    dump.transcript.filter((r) => r.kind === 'classic').map((r) => r.id)
  );
  const retired = classicIds.filter((id) => RETIRED_CLASSIC.includes(id));
  check(`[${name}] mondo: nessun dialogo classico ritirato (${RETIRED_CLASSIC.join(', ')})`, retired.length === 0, retired);
  const classicLeak = dump.classic.filter((c) => /maddy|leland|gigante|giant|norma|truman/i.test(c.id) && !/truman_(a2|fine|wait)/.test(c.id) &&
    ['diner', 'roadhouse', 'town', 'sheriff', 'palmer'].includes(c.map));
  check(`[${name}] mondo: nessun dialogo classico di Maddy/Leland/Gigante/Norma/Truman sulle mappe dell'Atto 4`, classicLeak.length === 0, classicLeak);

  // 6. nessun rifiuto dell'adapter, nessun ripiego sull'API, nessuna root ambigua
  const noRoots = dump.transcript.filter((r) => r.kind === 'no_roots' || (r.kind === 'page' && /^adapter\.no_roots/.test(r.page_id)));
  check(`[${name}] adapter: nessuna pagina adapter.no_roots, nessun rifiuto`, noRoots.length === 0, noRoots);
  check(`[${name}] guida: nessun ripiego sull'API dell'adapter, tutto coi tasti`, dump.fallbacks.length === 0, dump.fallbacks);
  const amb = dump.transcript.filter((r) => r.kind === 'ERROR_ambiguous_roots');
  check(`[${name}] adapter: nessuna root ambigua`, amb.length === 0, amb);
  const tp = dump.transcript.filter((r) => r.kind === 'travel');
  const routeTeleports = tp.filter((r) => /rotta|crocevia \(|riva/.test(r.why || ''));
  check(`[${name}] guida: nessun teletrasporto lungo la rotta scelta o verso la riva`, routeTeleports.length === 0, routeTeleports);

  // 7. T_LELAND_TAXI scritta UNA volta; nessun commit doppio dei nodi one-shot
  const taxiWrites = dump.transcript.filter((r) => r.kind === 'delta' && r.delta.evidence && r.delta.evidence.includes('T_LELAND_TAXI'));
  check(`[${name}] stato: T_LELAND_TAXI scritta una sola volta`, taxiWrites.length === 1, taxiWrites.length);
  const commits = {};
  for (const r of dump.transcript) if (r.kind === 'commit' && !r.repeated && !r.branch) commits[r.node_id] = (commits[r.node_id] || 0) + 1;
  const doubled = Object.entries(commits).filter(([id, n]) => n > 1 && !['m8_giant_stage', 'm8_leland_waiting', 'm8_lucy', 'm8_cmp_diary'].includes(id));
  check(`[${name}] stato: nessun nodo one-shot committato due volte`, doubled.length === 0, doubled);

  // 8. attori mai raddoppiati sulle mappe dell'Atto 4
  const dup = dump.mapEntries.map((e) => ({ map: e.map, hawks: e.npcs.filter((n) => n.startsWith('hawk')), maddy: e.npcs.filter((n) => n.startsWith('maddy@')), leland: e.npcs.filter((n) => n.startsWith('leland@')), giants: e.npcs.filter((n) => n.startsWith('giant@')) }))
    .filter((e) => e.hawks.length > 1 || e.maddy.length > 1 || e.leland.length > 1 || e.giants.length > 1);
  check(`[${name}] mondo: mai due Hawk, due Maddy, due Leland o due Giganti sulla stessa mappa`, dup.length === 0, dup);
  // Maddy mai a casa Palmer (il duplicato classico è ritirato)
  const maddyPalmer = dump.mapEntries.filter((e) => e.map === 'palmer' && e.npcs.some((n) => n.startsWith('maddy@') || n.startsWith('leland@')));
  check(`[${name}] mondo: Maddy e Leland mai a casa Palmer nell'Atto 4`, maddyPalmer.length === 0, maddyPalmer);

}

/* ---------------- artefatti Cast Continuity (v0.1) ---------------- */
const CP_DIR = path.join(ROOT, 'artifacts', 'cast-presence-v0.1');
function writeCastPresenceArtifacts() {
  if (!fs.existsSync(CP_DIR)) return;   // artefatto non ancora inizializzato: nulla da appendere
  const stamp = new Date().toISOString().slice(0, 10);
  const L = [];
  L.push('');
  L.push(`## Real-build capture (Chrome headless, ${stamp})`);
  L.push('');
  L.push('Scatti presi con `node test/act-4-playthrough.js` sulla build reale');
  L.push('(`index.html`), leggendo `GAME.CastPresence.where()` (js/cast-presence.js)');
  L.push('nei momenti chiave della giocata. Confrontati coi pin di');
  L.push('`test/fixtures/cast-pins-acts-1-4.json` quando la combinazione');
  L.push('avviso/focus/ritrovamento del percorso coincide con quella del pin;');
  L.push('altrimenti solo catturati (nessun pin adatto) e controllati per doppioni.');
  L.push('');
  for (const c of castCaptures) {
    L.push(`### ${c.path} — ${c.moment}`);
    L.push('');
    L.push(c.pinId ? `Pin di riferimento: \`${c.pinId}\` — ${c.mismatches.length === 0 ? 'combacia' : 'DISCREPANZE: ' + JSON.stringify(c.mismatches)}` : '_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_');
    L.push('');
    L.push('| personaggio | presenza |');
    L.push('|---|---|');
    for (const id of Object.keys(c.snapshot).sort()) L.push(`| ${id} | \`${c.snapshot[id]}\` |`);
    L.push('');
  }
  fs.appendFileSync(path.join(CP_DIR, 'act4-presence-trace.md'), L.join('\n') + '\n');
  console.log(`  cast-presence trace -> ${path.relative(ROOT, path.join(CP_DIR, 'act4-presence-trace.md'))} (appended)`);

  const R = [];
  R.push('');
  R.push(`## Browser reloads (Chrome headless, ${stamp})`);
  R.push('');
  R.push('Ricariche reali dell\'iframe di produzione durante `act-4-playthrough.js`.');
  R.push('«registro» = `GAME.CastPresence.where()`; «narrativo» = lo stato serializzato');
  R.push('(flags/values/evidence/nodes_done) letto da `A4.stateDigest()`.');
  R.push('');
  R.push('| percorso | momento | stato narrativo identico | registro Cast Continuity identico | salvataggio senza chiavi di posizione |');
  R.push('|---|---|---|---|---|');
  for (const r of reloadResults) {
    R.push(`| ${r.path} | ${r.moment} | ${r.digestEqual ? 'sì' : 'NO'} | ${r.castEqual ? 'sì' : 'NO'} | ${r.saveLeaks === undefined ? '—' : (r.saveLeaks.length === 0 ? 'sì' : 'NO: ' + r.saveLeaks.join(', '))} |`);
  }
  R.push('');
  fs.appendFileSync(path.join(CP_DIR, 'save-reload-report.md'), R.join('\n') + '\n');
  console.log(`  save-reload report -> ${path.relative(ROOT, path.join(CP_DIR, 'save-reload-report.md'))} (appended)`);
}

/* ------------------------------ artefatti ------------------------------ */
function writeTranscript(name, dump) {
  fs.writeFileSync(path.join(TX_DIR, name + '.json'), JSON.stringify(dump, null, 2));
  const L = [];
  L.push(`# Atto 4 — trascrizione giocata «${name}» (${PATHS[name].label})`);
  L.push('');
  L.push('Registrata sulla build di produzione (`index.html`) in Chrome headless.');
  L.push('Ogni riga è ciò che la UI ha davvero emesso: id di pagina, speaker dal DOM,');
  L.push('testo dal DOM, obiettivo HUD in quel momento. Stato di partenza: fine Atto 3');
  L.push('(seme), Cooper alla centrale davanti a Truman.');
  L.push('');
  if (dump.fallbacks.length) {
    L.push('## Ripieghi sull\'API (nessun tasto possibile)');
    L.push('');
    for (const f of dump.fallbacks) L.push(`- \`${f.where}\` — ${f.why}`);
    L.push('');
  }
  if ((dump.console_errors || []).length) {
    L.push('## Errori di console');
    L.push('');
    for (const e of dump.console_errors) L.push(`- ${e}`);
    L.push('');
  }
  if (dump.notes.length) {
    L.push('## Osservazioni del driver');
    L.push('');
    for (const n of dump.notes) L.push(`- ${n.text}${n.data ? ' — `' + JSON.stringify(n.data) + '`' : ''}`);
    L.push('');
  }
  L.push('## Entità presenti a ogni ingresso mappa');
  L.push('');
  L.push('| mappa | arrivo | NPC |');
  L.push('|---|---|---|');
  for (const e of dump.mapEntries) L.push(`| ${e.map} | ${e.at.join(',')} | ${e.npcs.join(' · ') || '(nessuno)'} |`);
  L.push('');
  L.push('## Sequenza');
  L.push('');
  let obj = null;
  for (const r of dump.transcript) {
    if (r.kind === 'page') {
      if (r.objective !== obj) { obj = r.objective; L.push(''); L.push(`> **HUD:** ${obj || '(nessun obiettivo)'}`); L.push(''); }
      const who = r.display_name ? `**${r.display_name}**` : '_(scena)_';
      L.push(`- \`${r.page_id}\` [${r.node_id || '?'}] ${who} — ${r.text}`);
    } else if (r.kind === 'widget') {
      L.push(`- **scelte** [${r.node_id}] @${r.map} ${r.at.join(',')}: ${r.choices.join(' · ')}`);
    } else if (r.kind === 'choice') {
      L.push(`- **scelta presa**: \`${r.choice_id}\``);
    } else if (r.kind === 'commit') {
      L.push(`- _commit_ \`${r.node_id}\`${r.repeated ? ' (ripetizione)' : ''}`);
    } else if (r.kind === 'delta') {
      L.push(`- _stato_: ${JSON.stringify(r.delta)}`);
    } else if (r.kind === 'door') {
      L.push(`- **porta** ${r.from} → ${r.to}${r.blocked ? ` — respinta: «${r.blocked.text}» (\`${r.blocked.id}\`)` : ''}`);
    } else if (r.kind === 'travel') {
      L.push(`- _viaggio_ → ${r.to} ${r.at.join(',')}${r.why ? ` (${r.why})` : ''}`);
    } else if (r.kind === 'press') {
      L.push(`- _tasto A_ @${r.at[0]} ${r.at[1]},${r.at[2]} ${r.at[3]}`);
    } else if (r.kind === 'classic') {
      L.push(`- _dialogo classico_ \`${r.id}\` su ${r.map}: ${r.pages.join(' / ')}`);
    } else if (r.kind === 'pair') {
      L.push(`- **taccuino** coppia ${r.pair.join(' + ')} → ${r.status}${r.matched ? ' (' + r.matched + ')' : ''}`);
    } else if (r.kind === 'no_roots') {
      L.push(`- **rifiuto** su \`${r.target}\` (${r.map})`);
    } else if (r.kind === 'reload') {
      L.push('');
      L.push(`> **SALVA + RICARICA** — ${r.before.map} ${r.before.x},${r.before.y} → ${r.after.map} ${r.after.x},${r.after.y}`);
      L.push(`> obiettivo prima: «${r.before.objective}» · dopo: «${r.after.objective}»`);
      L.push(`> entità prima: ${r.before.npcs.join(' · ') || '(nessuna)'} · dopo: ${r.after.npcs.join(' · ') || '(nessuna)'}`);
      L.push(`> valori dopo: ${JSON.stringify(r.after.digest.values)}`);
      L.push('');
    } else if (r.kind === 'api_interact') {
      L.push(`- ⚠️ **API** \`${r.map}/${r.actor}\` — ${r.why}`);
    } else if (r.kind === 'objective') {
      L.push(`- _obiettivo (${r.where})_: ${r.text || '(nessuno)'}`);
    } else if (r.kind === 'adapter_event') {
      L.push(`- _adapter_ ${r.event}: ${JSON.stringify(r.detail)}`);
    } else if (r.kind === 'ERROR_ambiguous_roots') {
      L.push(`- ❌ **root ambigue** su ${r.map}/${r.target}: ${r.roots.join(', ')}`);
    }
  }
  fs.writeFileSync(path.join(TX_DIR, name + '.md'), L.join('\n') + '\n');
  console.log(`  transcript -> artifacts/act-4-implementation/transcripts/${name}.{json,md}`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(2); });
