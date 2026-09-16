#!/usr/bin/env node
'use strict';

/* test/act-5-playthrough.js — Act 5 pass 01: giocata di M9 → M10 sulla build REALE
 * (index.html) in Chrome headless, guidata dai tasti veri del gioco.
 *
 *   node test/act-5-playthrough.js [--path=P1|P2|P3|P4|P5|P6|all]
 *
 * Partenza: stato di COMPLETAMENTO dell'Atto 4 (seme ACT4_STATION_BEFORE_DAWN della
 * fixture Cast Continuity, installato e poi SALVATO e RICARICATO dalla build, così la
 * partita riparte davvero da un salvataggio), Cooper alla centrale. Sei percorsi =
 * metodo (3) × nastro (2), con eco M6/M8 diverse. Asserzioni: pagine emesse = pagine di
 * M10.json per quello stato (screen truth), metodo prima del nastro, ammissioni prima di
 * S3, Truman fuori solo nell'intuitivo, ripresa dopo interruzione e ricarica, finale
 * armato sulla Loggia a leland_morto e ripristinato dopo ricarica.
 * Trascrizioni: artifacts/act-5-implementation/transcripts/<nome>.{json,md}.
 *
 * Testo originale (driver dell'Atto 4 da cui l'infrastruttura CDP è copiata):
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
 * toccato; si apre test/act-5-playthrough-probe.html, che carica ../index.html
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
const OUT_DIR = path.join(ROOT, 'artifacts', 'act-5-implementation');
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-a5-chrome-'));
  const logFd = fs.openSync(path.join(profile, 'chrome.log'), 'w');
  const child = spawn(CHROME, [
    '--headless=new', '--mute-audio',
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

    const paths = argPath === 'all' ? Object.keys(PATHS) : [argPath];
    for (const name of paths) if (!PATHS[name]) throw new Error('percorso sconosciuto: ' + name);

    for (const name of paths) {
      console.log(`\n=== PATH ${name} (${PATHS[name].label}) ===`);
      await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/test/act-5-playthrough-probe.html` });
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

    const failed = results.filter((r) => !r.pass);
    console.log(`\nact-5-playthrough: ${results.length - failed.length}/${results.length} assertions passed`);
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
    const ok = await cdp.evaluate('typeof window.A5 !== "undefined"').catch(() => false);
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
    seed: (s) => call(`return await A4.seed(${J(s)});`),
    reload: () => call('return await A4.reload();'),
    present: (p, e) => call(`return await A4.present(${J(p)},${J(e)});`),
    propOptions: () => cdp.evaluate('A4.propOptions()'),
    menuOpen: () => cdp.evaluate('A4.menuOpen()'),
    cast: (ids) => cdp.evaluate(`A4.cast(${J(ids)})`),
    finale: () => cdp.evaluate('A4.finale()'),
    values: () => cdp.evaluate('A4.narrativeValues()'),
    escapePages: () => call('return await A4.escapePages();'),
    currentPage: () => cdp.evaluate('A4.currentPageId()'),
    factual: (id) => cdp.evaluate(`A4.factual(${J(id)})`),
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
const CAST_FIXTURE = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'fixtures', 'cast-pins-acts-1-4.json'), 'utf8'));
const SHERIFF = { truman: [11, 4, 'left'], lucy: [3, 6, 'down'], leland: [8, 6, 'up'], spawn: [7, 10, 'up'] };
const TACTIC_EVIDENCE = { prova: 'JACQUES_MIDNIGHT_CLAIM', pressione: 'JACQUES_LIST_GIVEN', falsa_sicurezza: 'JACQUES_THIRD_MAN_DETAIL' };
const PATHS = {
  P1: { label: 'probatorio · nastro acceso · tattica prova · biglietto letto a Palmer · tutti i reason code di M9 nella UI',
    method: 'probatorio', s3: 'on', tactic: 'prova', warning: 'palmer', focus: 'palmer', promise: 'accompagno', m9Rejections: true, shots: true },
  P2: { label: 'probatorio · nastro fermato · interruzione in B5 + ricarica, ripresa da Leland',
    method: 'probatorio', s3: 'off', tactic: 'prova', warning: 'centrale', focus: 'lago', promise: 'autonomia', interrupt: { node: 'm10_affioramento', page: 'm10.b5.affioramento.p02', reload: true } },
  P3: { label: 'personale · nastro acceso · tattica pressione · biglietto riferito da Truman',
    method: 'personale', s3: 'on', tactic: 'pressione', warning: 'palmer', focus: 'lago', promise: 'prudenza' },
  P4: { label: 'personale · nastro fermato · falsa sicurezza · fallback corriera · ricarica dopo la morte (finale sulla Loggia)',
    method: 'personale', s3: 'off', tactic: 'falsa_sicurezza', warning: 'nessuno', focus: 'diner', promise: 'accompagno', reloadAfterDeath: true },
  P5: { label: 'intuitivo · nastro acceso · falsa sicurezza · interruzione in B5: Truman fuori nel mondo',
    method: 'intuitivo', s3: 'on', tactic: 'falsa_sicurezza', warning: 'palmer', focus: 'palmer', promise: 'autonomia', interrupt: { node: 'm10_affioramento', page: 'm10.b5.affioramento.p01', truman: true } },
  P6: { label: 'intuitivo · nastro fermato · pressione (eco fiammiferi esclusa) · interruzione dopo il fermo, ripresa da Truman',
    method: 'intuitivo', s3: 'off', tactic: 'pressione', warning: 'centrale', focus: 'diner', promise: 'prudenza', interrupt: { node: 'm10_morte', page: 'm10.b10.morte.p03', resumeActor: 'truman', reload: true } }
};

/* ---- verità attesa: il runtime reale in node assembla le pagine per lo stato del percorso ---- */
global.window = global;
require(path.join(ROOT, 'js', 'narrative-runtime.js'));
require(path.join(ROOT, 'js', 'narrative-data.gen.js'));
require(path.join(ROOT, 'js', 'narrative-bootstrap.js'));
global.GAME.installNarrativeCatalogs();
const NRn = global.GAME.NarrativeRuntime, Dn = global.GAME.NarrativeData;
const M10n = Dn.missions.M10;
const PAGE_TEXT = {};
(function index(o) { if (Array.isArray(o)) return o.forEach(index); if (o && typeof o === 'object') { if (o.id && typeof o.text === 'string' && o.mode) PAGE_TEXT[o.id] = o; Object.values(o).forEach(index); } })(M10n);
function pathSeed(opts) {
  const seed = JSON.parse(JSON.stringify(CAST_FIXTURE.seeds.ACT4_STATION_BEFORE_DAWN));
  Object.assign(seed.values, { promise_stance: opts.promise, warning_target: opts.warning, focus_destination: opts.focus, m6_tactic: opts.tactic, letter_o_observation_source: 'cooper_primary', sarah_support_state: 'none' });
  Object.values(TACTIC_EVIDENCE).forEach((e) => { delete seed.evidence[e]; });
  seed.evidence[TACTIC_EVIDENCE[opts.tactic]] = true;
  seed.props.P8 = { formulation: { status: 'formulated' } };
  return seed;
}
function expectedM10(opts) {
  const st = NRn.createState();
  const seed = pathSeed(opts);
  Object.keys(seed).forEach((k) => { st[k] = Object.assign(st[k] || {}, JSON.parse(JSON.stringify(seed[k]))); });
  Object.assign(st.evidence, { D_TAXI: true });
  st.props.P6 = { formulation: { status: 'formulated', created_from: ['T_LELAND_TAXI', 'D_TAXI'] }, presentations: [], social_status: { accepted_by: ['truman'] }, factual_status: 'unconfirmed' };
  st.props.P8 = { formulation: { status: 'formulated', created_from: [] }, presentations: [], social_status: { accepted_by: [] }, factual_status: 'unconfirmed' };
  Object.assign(st.flags, { atto5: true }); Object.assign(st.nodes_done, { m9_verifica_taxi: true, m9_present_truman: true, m9_arrivo: true });
  const byNode = [];
  const run = (id) => { const p = NRn.prepareNode(st, M10n, id); if (!p.ok) throw new Error('expected: ' + id + ' ' + p.error); byNode.push({ node: id, ids: p.pages.map((x) => x.id) }); NRn.commitNode(st, M10n, p); };
  const pick = (id, choice) => { const n = M10n.nodes.find((x) => x.id === id); const pc = NRn.prepareChoice(st, M10n, n, choice); byNode[byNode.length - 1].ids.push(...pc.feedback_pages.map((x) => x.id)); NRn.commitChoice(st, M10n, n, pc); };
  run('m10_soglia'); pick('m10_soglia', 'method_' + opts.method);
  ['m10_apertura', 'm10_domande', 'm10_affioramento', 'm10_confessione'].forEach(run);
  run('m10_s3'); pick('m10_s3', 's3_' + opts.s3);
  ['m10_post_s3', 'm10_vittime', 'm10_fermo', 'm10_morte'].forEach(run);
  return byNode;
}
function flatIds(byNode) { return byNode.reduce((a, n) => a.concat(n.ids), []); }
function expectedWithInterruption(byNode, intr) {
  const all = flatIds(byNode);
  const nodeIdx = byNode.findIndex((n) => n.node === intr.node);
  const startOfNode = byNode.slice(0, nodeIdx).reduce((c, n) => c + n.ids.length, 0);
  const cut = all.indexOf(intr.page);
  return all.slice(0, cut + 1).concat(all.slice(startOfNode));
}

async function interactUntil(P, map, actorId, pageId) {
  const npcs = await P.npcsHere();
  const npc = npcs.find((n) => n.id === actorId);
  if (!npc) return { ok: false, error: 'actor_absent', npcs };
  const r = await P.reach(npc.x, npc.y);
  if (!r.ok) return { ok: false, error: 'unreachable', r };
  return P.interactUntilPage(pageId);
}

async function playM9(P, name, opts, shot) {
  const lucy = await useActor(P, 'sheriff', 'lucy', 'm9_verifica_taxi');
  let st = await P.state();
  check(`[${name}] M9: Lucy verifica il taxi (D_TAXI dalla richiesta del player)`, st.evidence.includes('D_TAXI') && st.nodes_done.includes('m9_verifica_taxi') && !lucy.viaApi, { viaApi: lucy.viaApi, ev: st.evidence });
  const cmp = await P.compare('T_LELAND_TAXI', 'D_TAXI');
  await P.closeNotebook();
  check(`[${name}] M9: confronto nel taccuino → P6 formulata`, cmp.ok && (await P.propStatus('P6')) === 'formulated', { cmp: cmp.ok, p6: await P.propStatus('P6') });
  const presentOnce = async (prop, evidence, label) => {
    const tr = await useActor(P, 'sheriff', 'truman', label);
    const menu = await P.propOptions();
    if (!menu.length) return { ok: false, error: 'no_prop_menu', tr };
    return P.present(prop, evidence);
  };
  const reasons = [];
  if (opts.m9Rejections) {
    let r = await presentOnce('P8', [], 'P8');
    const ids1 = pageIds(r.rows);
    check(`[${name}] M9 UI: P8 → Truman «Lo tengo a mente…» (VALID_BUT_NOT_PROCEDURAL, prima era un errore silenzioso)`, ids1.includes('m9.b2.p8.p01'), r);
    r = await presentOnce('P6', ['T_LELAND_TAXI'], 'P6 incompleta');
    check(`[${name}] M9 UI: P6 senza la verifica → NO_CORROBORATION`, pageIds(r.rows).includes('m9.b2.p6.no_corroboration.p01'), pageIds(r.rows));
    r = await presentOnce('P6', ['T_LELAND_TAXI'], 'P6 ripetuta');
    check(`[${name}] M9 UI: stesso allegato → ALREADY_REJECTED`, pageIds(r.rows).includes('m9.b2.p6.already_rejected'), pageIds(r.rows));
    reasons.push('VALID_BUT_NOT_PROCEDURAL', 'NO_CORROBORATION', 'ALREADY_REJECTED');
  }
  const acc = await presentOnce('P6', ['T_LELAND_TAXI', 'D_TAXI'], 'P6 completa');
  st = await P.state();
  check(`[${name}] M9 UI: P6 completa → accettata, atto5`, pageIds(acc.rows).includes('m9.b2.p6.accept.p06') && st.flags.includes('atto5'), { ids: pageIds(acc.rows), flags: st.flags });
  await P.wait(500);
  const lel = await useActor(P, 'sheriff', 'leland', 'm9_arrivo');
  st = await P.state();
  check(`[${name}] M9: Leland alla centrale (corpo reale), arrivo committato`, !lel.viaApi && st.nodes_done.includes('m9_arrivo'), { viaApi: lel.viaApi, nd: st.nodes_done.filter((n) => /m9_/.test(n)) });
  if (shot) await shot('m9-arrivo-done.png');
}

async function playM10(P, name, opts, shot) {
  const expByNode = expectedM10(opts);
  await P.wait(400);
  const finale0 = await P.finale();
  check(`[${name}] M10: dopo M9 il finale NON è armato (M10 possiede l'interrogatorio)`, !finale0.pending && finale0.adapterEnabled, finale0);
  const castThreshold = await P.cast(['truman', 'leland', 'lucy', 'andy', 'hawk']);
  const pin = CAST_FIXTURE.pins.find((p) => p.id === 'ACT5_THRESHOLD').expect;
  check(`[${name}] Cast Presence alla soglia = pin ACT5_THRESHOLD (truman, leland, lucy, andy, hawk)`, ['truman', 'leland', 'lucy', 'andy', 'hawk'].every((c) => castThreshold[c] === pin[c]), { got: castThreshold });
  const obj1 = await P.objective();
  check(`[${name}] HUD alla soglia: testo del Lock`, obj1 === 'Leland Palmer è alla centrale. Decidete come parlargli.', obj1);

  const first = await interactUntil(P, 'sheriff', 'leland', 'm10.b1.soglia.p03');
  check(`[${name}] M10-B1: A su Leland apre la soglia (pagine del Lock)`, first.reached, first);
  if (shot) await shot('m10-soglia.png');
  let r = await P.advance();
  check(`[${name}] M10-B1: widget del metodo con tre scelte`, JSON.stringify(r.choices) === JSON.stringify(['method_probatorio', 'method_personale', 'method_intuitivo']), r.choices);
  const vals0 = await P.values();
  check(`[${name}] M10: nessun metodo scritto prima della scelta`, vals0.m10_method === undefined, vals0);
  const intr = opts.interrupt;
  // scelta del metodo, poi pagine fino all'interruzione o al widget S3
  await P.chooseAndHold('method_' + opts.method);
  if (intr) {
    let until = await P.advanceUntilPage(intr.page, 200);
    for (let g = 0; g < 3 && !until.reached; g++) {
      const w = await P.widgetOpts();
      if (w.includes('s3_on')) { await P.chooseAndHold('s3_' + opts.s3); until = await P.advanceUntilPage(intr.page, 200); }
      else break;
    }
    check(`[${name}] interruzione: raggiunta ${intr.page}`, until.reached, until);
    const esc = await P.escapePages();
    check(`[${name}] interruzione: Escape chiude la sessione senza lease residui`, !esc.active && !esc.open, esc);
    const stI = await P.state();
    const nd = stI.nodes_done;
    check(`[${name}] interruzione: ${intr.node} NON committato, l'anello precedente sì`, !nd.includes(intr.node), nd.filter((n) => /m10_/.test(n)));
    if (intr.truman) {
      const c = await P.cast(['truman', 'leland']);
      const bodies = (await P.npcsHere()).map((n) => n.id);
      check(`[${name}] intuitivo: Truman OFFSCREEN:corridor nel mondo (corpo assente), Leland in centrale`, c.truman === 'OFFSCREEN:corridor' && !bodies.includes('truman') && bodies.includes('leland'), { c, bodies });
    }
    if (intr.resumeActor === 'truman') {
      const c = await P.cast(['truman', 'leland']);
      const bodies = (await P.npcsHere()).map((n) => n.id);
      check(`[${name}] dopo il fermo: Leland in cella (OFFSCREEN:cell, nessun corpo), Truman presente`, c.leland === 'OFFSCREEN:cell' && !bodies.includes('leland') && bodies.includes('truman'), { c, bodies });
    }
    if (intr.reload) {
      const rl = await P.reload();
      check(`[${name}] ricarica a metà scena: stato identico (digest)`, JSON.stringify(rl.before.digest) === JSON.stringify(rl.after.digest), { before: rl.before.digest.nodes_done, after: rl.after.digest.nodes_done });
    }
    const actor = intr.resumeActor || 'leland';
    const resumeFirst = byFirstPage(expByNode, intr.node);
    const res = await interactUntil(P, 'sheriff', actor, resumeFirst);
    check(`[${name}] ripresa: A su ${actor} riprende da ${intr.node} (${resumeFirst})`, res.reached, res);
  }
  // avanza fino al widget S3 (se non già superato)
  let st = await P.state();
  if (!st.values || st.values.s3 === undefined) {
    r = await P.advance(300);
    check(`[${name}] M10-B7: widget del nastro dopo le ammissioni`, JSON.stringify(r.choices) === JSON.stringify(['s3_on', 's3_off']), r.choices);
    const vals = await P.values();
    check(`[${name}] M10-B6: sei material_admissions registrate prima di S3, in prima persona`,
      ['taxi_lie', 'traincar_presence', 'laura_homicide', 'maddy_homicide', 'maddy_body_transport', 'letters'].every((f) => vals['material_admissions.' + f] === 'leland_first_person'), vals);
    const fs6 = await P.factual('P6'), fs8 = await P.factual('P8');
    check(`[${name}] M10-B6: P6 confirmed_as_lie, P8 corroborated`, fs6 === 'confirmed_as_lie' && fs8 === 'corroborated', { fs6, fs8 });
    if (shot) await shot('m10-s3.png');
    await P.chooseAndHold('s3_' + opts.s3);
  }
  r = await P.advance(300);
  await P.wait(900);   // due giri del poll di produzione: arm del finale
  st = await P.state();
  check(`[${name}] M10-B10: leland_morto scritto`, st.flags.includes('leland_morto'), st.flags);
  const vals = await P.values();
  check(`[${name}] M10: m10_method=${opts.method}, s3=${opts.s3}, truman_testimony_state coerente`, vals.m10_method === opts.method && vals.s3 === opts.s3 &&
    vals.truman_testimony_state === (opts.s3 === 'on' ? 'not_needed' : 'voluntary_witness'), vals);
  const fin = await P.finale();
  check(`[${name}] finale armato SOLO ora, in pausa sulla Loggia, con metodo e nastro dal ledger`, fin.pending && !fin.active && fin.stage === 'await_lodge' &&
    fin.values.m10_method === opts.method && fin.values.s3 === opts.s3 && fin.admissions === 6 && !fin.adapterEnabled, fin);
  check(`[${name}] HUD dopo la morte: obiettivo della Loggia`, /Loggia/.test(fin.domObjective || ''), fin.domObjective);
  const castEnd = await P.cast(['leland', 'truman', 'bob']);
  check(`[${name}] Cast Presence dopo la morte: leland TERMINAL_REMOVED, truman in centrale, bob nella Loggia`, castEnd.leland === 'TERMINAL_REMOVED' && castEnd.truman === 'sheriff@10,4' && castEnd.bob === 'redroom@14,2', castEnd);
  const flags = await P.classicFlags();
  check(`[${name}] classico: leland_morto + leland_confessa + done_leland_interr`, flags.leland_morto && flags.leland_confessa && flags.done_leland_interr, { lm: flags.leland_morto, lc: flags.leland_confessa });
  if (shot) await shot('m10-morte.png');
  if (opts.reloadAfterDeath) {
    const rl = await P.reload();
    await P.wait(600);
    const fin2 = await P.finale();
    check(`[${name}] ricarica dopo la morte: finale ripristinato sulla Loggia, M10 non rigiocata`, fin2.pending && fin2.stage === 'await_lodge' && !fin2.adapterEnabled, { fin2, after: rl.after.objective });
  }

  // screen truth: sequenza e testi emessi == M10.json per lo stato del percorso
  const dump = await P.dump();
  const rows = dump.transcript.filter((x) => x.kind === 'page' && /^m10\./.test(x.page_id));
  const got = rows.map((x) => x.page_id);
  const want = intr ? expectedWithInterruption(expByNode, intr) : flatIds(expByNode);
  check(`[${name}] screen truth: sequenza delle pagine M10 emesse = runtime per questo stato (${want.length})`, JSON.stringify(got) === JSON.stringify(want), { got: got.length, want: want.length, firstDiff: got.findIndex((g, i) => g !== want[i]), gotAt: got[got.findIndex((g, i) => g !== want[i])], wantAt: want[got.findIndex((g, i) => g !== want[i])] });
  const textBad = rows.filter((x) => !PAGE_TEXT[x.page_id] || x.text !== PAGE_TEXT[x.page_id].text || (x.display_name || null) !== (PAGE_TEXT[x.page_id].display_name || null));
  check(`[${name}] screen truth: ogni testo e speaker a schermo = M10.json (verbatim dal Lock)`, textBad.length === 0, textBad.slice(0, 3));
  const voce = rows.filter((x) => x.display_name === 'VOCE');
  check(`[${name}] BOB: le battute VOCE mostrano il ritratto del sogno`, voce.length > 0 && voce.every((x) => x.portrait === 'bob'), voce.map((x) => [x.page_id, x.portrait]));
  check(`[${name}] nessun ID di design a schermo`, rows.every((x) => !/\b(m10_|P6|P8|material_admissions|leland_first_person)\b/.test(x.dom_text || x.text)), null);
  const widgets = dump.transcript.filter((x) => x.kind === 'widget').map((x) => (x.choices || []).join(','));
  const tapeIdx = dump.transcript.findIndex((x) => x.kind === 'page' && x.page_id === 'm10.b2.apertura.p04');
  const methodIdx = dump.transcript.findIndex((x) => x.kind === 'widget' && (x.choices || []).includes('method_probatorio'));
  check(`[${name}] ordine: widget del metodo PRIMA della pagina del nastro`, methodIdx >= 0 && tapeIdx > methodIdx, { methodIdx, tapeIdx, widgets });
  const s3Idx = dump.transcript.findIndex((x) => x.kind === 'widget' && (x.choices || []).includes('s3_on'));
  const lastAdmission = Math.max(...dump.transcript.map((x, i) => (x.kind === 'page' && PAGE_TEXT[x.page_id] && PAGE_TEXT[x.page_id].admits ? i : -1)));
  check(`[${name}] ordine: widget del nastro DOPO l'ultima ammissione resa`, s3Idx > lastAdmission && lastAdmission > 0, { s3Idx, lastAdmission });
  const truOut = got.includes('m10.b3.intuitivo.p09'), truBack = got.includes('m10.b6.intuitivo.p07');
  check(`[${name}] Truman esce e rientra solo nell'intuitivo`, (opts.method === 'intuitivo') === truOut && truOut === truBack, { truOut, truBack });
  check(`[${name}] nessuna radice ambigua e nessun ripiego API`, !dump.transcript.some((x) => x.kind === 'ERROR_ambiguous_roots') && dump.fallbacks.length === 0, dump.fallbacks);
  return dump;
}
function byFirstPage(byNode, nodeId) { const n = byNode.find((x) => x.node === nodeId); return n.ids[0]; }

async function runPath(cdp, name, shot) {
  const P = ev(cdp);
  const opts = PATHS[name];
  const S = opts.shots ? shot : null;
  await P.status('boot-' + name);
  const boot = await P.boot();
  check(`[${name}] setup: build reale in partita (testMode=${boot.testMode})`, boot.mode === 'play' && boot.testMode === false, boot);
  const seed = await P.seed(pathSeed(opts));
  check(`[${name}] setup: stato di completamento dell'Atto 4 installato (m8_station, T_LELAND_TAXI, ${TACTIC_EVIDENCE[opts.tactic]})`,
    seed.digest.nodes_done.includes('m8_station') && seed.digest.evidence.includes('T_LELAND_TAXI') && seed.digest.evidence.includes(TACTIC_EVIDENCE[opts.tactic]), seed.digest);
  await P.travel('sheriff', SHERIFF.spawn[0], SHERIFF.spawn[1], SHERIFF.spawn[2], 'partenza: ingresso della centrale');
  const saved = await P.reload();
  check(`[${name}] setup: la partita riparte dal SALVATAGGIO di fine Atto 4 (digest identico dopo ricarica)`, JSON.stringify(saved.before.digest) === JSON.stringify(saved.after.digest) && saved.after.map === 'sheriff', { before: saved.before.digest.nodes_done.length, after: saved.after.digest.nodes_done.length, map: saved.after.map });
  await P.reset();
  await P.status('act5-' + name);
  await playM9(P, name, opts, S);
  return playM10(P, name, opts, S);
}

function writeTranscript(name, dump) {
  fs.writeFileSync(path.join(TX_DIR, name + '.json'), JSON.stringify(dump, null, 2));
  const L = [];
  L.push(`# Atto 5 — trascrizione giocata «${name}» (${PATHS[name].label})`);
  L.push('');
  L.push('Build di produzione (`index.html`) in Chrome headless, tasti veri. Partenza dal salvataggio di fine Atto 4.');
  L.push('Ogni riga è ciò che la UI ha emesso: id di pagina, speaker e testo dal DOM, obiettivo HUD.');
  L.push('');
  if ((dump.console_errors || []).length) { L.push('## Errori di console'); L.push(''); dump.console_errors.forEach((e) => L.push('- ' + e)); L.push(''); }
  if (dump.fallbacks.length) { L.push('## Ripieghi API'); L.push(''); dump.fallbacks.forEach((f) => L.push(`- \`${f.where}\` — ${f.why}`)); L.push(''); }
  L.push('## Sequenza'); L.push('');
  let obj = null;
  for (const r of dump.transcript) {
    if (r.kind === 'page') {
      if (r.objective !== obj) { obj = r.objective; L.push(''); L.push(`> **HUD:** ${obj || '(nessun obiettivo)'}`); L.push(''); }
      L.push(`- \`${r.page_id}\` ${r.display_name ? '**' + r.display_name + '**' : '_(scena)_'}${r.portrait ? ' [ritratto: ' + r.portrait + ']' : ''}: ${r.text}`);
    } else if (r.kind === 'widget') L.push(`- **scelta aperta:** ${(r.choices || []).join(' · ')}`);
    else if (r.kind === 'choice') L.push(`- **scelto:** \`${r.choice_id}\``);
    else if (r.kind === 'attachment_menu') L.push(`- **presenta** ${r.proposition}; allegabili: ${r.candidates.join(', ') || '(nessuno)'}`);
    else if (r.kind === 'attached') L.push(`- **allegati:** ${r.evidence.join(', ') || '(nessuno)'}`);
    else if (r.kind === 'reload') L.push(`- **ricarica** (${r.before.map} → ${r.after.map}; HUD «${r.after.objective}»)`);
    else if (r.kind === 'delta') L.push(`  - _stato:_ \`${JSON.stringify(r.delta)}\``);
    else if (r.kind === 'travel') L.push(`- _viaggio:_ ${r.to} ${r.at.join(',')} (${r.why})`);
  }
  fs.writeFileSync(path.join(TX_DIR, name + '.md'), L.join('\n') + '\n');
  console.log(`  transcript -> artifacts/act-5-implementation/transcripts/${name}.{json,md}`);
}
function auditTranscript() { /* le asserzioni vivono in playM10 */ }

main().catch((e) => { console.error(e.stack || e.message); process.exit(2); });
