#!/usr/bin/env node
'use strict';

/* test/act-3-playthrough.js — giocata dell'Atto 3 (M5 + M6) sulla build REALE
 * (index.html) in Chrome headless, guidata dai tasti veri del gioco.
 *
 *   node test/act-3-playthrough.js [--path=impeto-kept|withhold-open|withhold-staging|all]
 *
 * Non tocca nessun file di produzione: apre test/act-3-playthrough-probe.html,
 * che carica ../index.html in un iframe ed espone le primitive di input.
 * Le trascrizioni finiscono in artifacts/act-3-closure/transcripts/<nome>.json
 * e <nome>.md; gli screenshot in artifacts/act-3-closure/.
 */

const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'artifacts', 'act-3-closure');
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-a3-chrome-'));
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
  try {
    const pages = await waitForJson(`http://127.0.0.1:${devPort}/json/list`, 20000);
    const page = pages.find((p) => p.type === 'page');
    cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 980, height: 700, screenWidth: 980, screenHeight: 700, deviceScaleFactor: 1, mobile: false });

    const consoleErrors = [];
    await cdp.send('Log.enable').catch(() => {});
    cdp.ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') consoleErrors.push(m.params.entry.text);
    });

    if (argPath === 'walkdebug') {
      await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/test/act-3-playthrough-probe.html` });
      await waitReady(cdp);
      const P = ev(cdp);
      await P.boot();
      // SOLO diagnostica del camminatore: forza il flag classico e teletrasporta
      await cdp.evaluate('document.getElementById("product").contentWindow.GAME.Engine.state.flags.atto3 = true');
      await P.travel('town', 54, 14, 'right', 'debug');
      console.log('door', JSON.stringify(await P.enterDoor(55, 14, 54, 14)));
      console.log('pos', JSON.stringify(await P.pos()));
      console.log('walk 21,1 ->', await cdp.evaluate('(async()=>{var r=await A3.walkTo(21,1); return JSON.stringify({r:r,d:A3.walkDiag(),pos:A3.pos()});})()'));
      console.log('walk 13,8 ->', await cdp.evaluate('(async()=>{var r=await A3.walkTo(13,8); return JSON.stringify({r:r,d:A3.walkDiag(),pos:A3.pos()});})()'));
      return;
    }

    const paths = argPath === 'all'
      ? ['impeto-kept', 'withhold-open', 'withhold-staging']
      : [argPath];

    const summary = {};
    for (const name of paths) {
      console.log(`\n=== PATH ${name} ===`);
      await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/test/act-3-playthrough-probe.html` });
      await waitReady(cdp);
      const shot = (file) => screenshot(cdp, path.join(OUT_DIR, file));
      const res = await runPath(cdp, name, shot);
      summary[name] = res;
      writeTranscript(name, res);
    }

    fs.writeFileSync(path.join(TX_DIR, 'assertions.json'),
      JSON.stringify({ results, observations: notesOut, console_errors: consoleErrors.slice(0, 40) }, null, 2));
    if (notesOut.length) console.log('\nosservazioni: ' + JSON.stringify(notesOut));
    writeCastPresenceArtifacts();

    const failed = results.filter((r) => !r.pass);
    console.log(`\nact-3-playthrough: ${results.length - failed.length}/${results.length} assertions passed`);
    if (consoleErrors.length) console.log(`console errors: ${consoleErrors.length}`);
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
    const ok = await cdp.evaluate('typeof window.A3 !== "undefined"').catch(() => false);
    if (ok) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('probe page never exposed A3');
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
  return {
    raw: (expr) => cdp.evaluate(expr),
    call,
    boot: () => call('return await A3.boot();'),
    reload: () => call('return await A3.reload();'),
    travelNoDrain: (m, x, y, d, why) => call(`return await A3.travelNoDrain(${JSON.stringify(m)},${x},${y},${JSON.stringify(d)},${JSON.stringify(why || '')});`),
    travel: (m, x, y, d, why) => call(`return await A3.travel(${JSON.stringify(m)},${x},${y},${JSON.stringify(d)},${JSON.stringify(why || '')});`),
    reach: (x, y) => call(`return await A3.reach(${x},${y});`),
    reachFrom: (x, y, d) => call(`return await A3.reachFrom(${x},${y},${JSON.stringify(d)});`),
    canReach: (x, y) => cdp.evaluate(`A3.canReach(${x},${y})`),
    interact: () => call('return await A3.interact();'),
    advance: () => call('return await A3.advance();'),
    choose: (id) => call(`return await A3.choose(${JSON.stringify(id)});`),
    drain: (l) => call(`return await A3.drainClassic(${JSON.stringify(l || '')});`),
    enterDoor: (dx, dy, sx, sy) => call(`return await A3.enterDoor(${dx},${dy},${sx},${sy});`),
    compare: (a, b) => call(`return await A3.compare(${JSON.stringify(a)},${JSON.stringify(b)});`),
    closeNotebook: () => call('return await A3.closeNotebook();'),
    abortWidget: () => call('return await A3.abortWidget();'),
    interactUntilPage: (p) => call(`return await A3.interactUntilPage(${JSON.stringify(p)});`),
    advanceUntilPage: (p) => call(`return await A3.advanceUntilPage(${JSON.stringify(p)});`),
    chooseAndHold: (id) => call(`return await A3.chooseAndHold(${JSON.stringify(id)});`),
    present: (p) => call(`return await A3.presentProposition(${JSON.stringify(p)});`),
    apiInteract: (m, a, why) => call(`return await A3.apiInteract(${JSON.stringify(m)},${JSON.stringify(a)},${JSON.stringify(why)});`),
    state: () => cdp.evaluate('A3.stateDigest()'),
    pos: () => cdp.evaluate('A3.pos()'),
    objective: () => cdp.evaluate('A3.objective()'),
    npcsHere: () => cdp.evaluate('A3.npcsHere()'),
    mapNpcs: (m) => cdp.evaluate(`A3.mapNpcs(${JSON.stringify(m)})`),
    ringHidden: () => cdp.evaluate('A3.ringHidden()'),
    castWhere: () => cdp.evaluate('A3.castWhere()'),
    castResolve: (id) => cdp.evaluate(`A3.castResolve(${JSON.stringify(id)})`),
    bodiesOn: (m) => cdp.evaluate(`A3.bodiesOn(${JSON.stringify(m)})`),
    savedRaw: () => cdp.evaluate('A3.savedRaw()'),
    classicFlags: () => cdp.evaluate('A3.classicFlags()'),
    dialogueNow: () => cdp.evaluate('A3.dialogueNow()'),
    unreachable: () => cdp.evaluate('A3.unreachableTiles()'),
    dump: () => cdp.evaluate('A3.dump()'),
    note: (t, d) => cdp.evaluate(`A3.note(${JSON.stringify(t)},${JSON.stringify(d === undefined ? null : d)})`),
    reset: () => cdp.evaluate('A3.reset()'),
    status: (t) => cdp.evaluate(`A3.status(${JSON.stringify(t)})`)
  };
}

/* interagisce col target ambientale (x,y) camminandoci accanto e premendo A */
async function useTarget(P, x, y, label, until, shot, file) {
  const r = await P.reach(x, y);
  if (!r.ok) return { ok: false, error: 'unreachable', label, detail: r };
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
   NPC, ripiega sull'API pubblica e lo dichiara */
async function useActor(P, map, actorId, label, until, shot, file) {
  const npcs = await P.npcsHere();
  const npc = npcs.find((n) => n.id === actorId);
  if (!npc) {
    const out = await P.apiInteract(map, actorId, `nessun NPC "${actorId}" sulla mappa ${map}: impossibile guardarlo e premere A`);
    if (until && shot) { const r2 = await P.advanceUntilPage(until); if (r2.reached) await shot(file); const rest = await P.advance(); return { ok: true, viaApi: true, label, rows: [...(out.rows || []), ...rest.rows], choices: rest.choices, reachedShot: r2.reached }; }
    return { ok: true, viaApi: true, label, ...out };
  }
  const r = await P.reach(npc.x, npc.y);
  if (!r.ok) {
    const out = await P.apiInteract(map, actorId, `NPC "${actorId}" presente ma nessuna casella adiacente raggiungibile`);
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

/* ------------------------- Atto 1 + Atto 2 reali ------------------------- */
const TRAINCAR = {
  bridge_rail: [4, 6], traincar_entrance: [13, 7], mound: [13, 6], ring: [13, 5],
  scene_center: [12, 5], stove: [12, 3], cards: [10, 6], tracks_north: [21, 2], sign_oej: [20, 2]
};

async function playActs12(P, name) {
  await P.status('acts12-' + name);
  await P.boot();

  // Atto 1 classico
  await P.travel('sheriff', 11, 4, 'left', 'viaggio: centrale');
  await useActor(P, 'sheriff', 'truman', 'truman diario');
  await P.drain('truman diario');
  await P.travel('palmer', 6, 2, 'up', 'viaggio: casa Palmer');
  await P.interact(); await P.drain('camera di Laura');
  await P.travel('woods', 14, 5, 'up', 'viaggio: bosco');
  await P.call('for (var i=0;i<24 && A3.pos().map==="woods";i++) await A3.press("ArrowUp"); return A3.pos();');
  await P.call('await A3.wait(900); return A3.pos();');
  await P.drain('arrivo Stanza Rossa');
  await P.travel('redroom', 8, 5, 'up', 'viaggio: Stanza Rossa');
  await P.interact(); await P.drain('Nano');
  await P.travel('redroom', 11, 3, 'up', 'viaggio: Laura');
  await P.interact(); await P.drain('sogno di Laura');
  await P.call('await A3.wait(700); return true;');   // il sync classico→narrativo gira ogni 180 ms

  const afterDream = await P.state();
  check(`[${name}] setup: sogno_fatto raggiunto col gioco reale`, afterDream.flags.includes('sogno_fatto'), afterDream.flags);

  // Atto 2 narrativo (M4)
  await P.travel('sheriff', 11, 4, 'left', 'viaggio: centrale');
  await useActor(P, 'sheriff', 'truman', 'truman_a2');
  await P.travel('hotel_gn', 5, 6, 'down', 'viaggio: Great Northern');
  await P.interact(); await P.drain('Ben Horne');
  await P.travel('hotel_gn', 12, 10, 'up', 'viaggio: Audrey');
  await P.interact(); await P.drain('Audrey al Great Northern');
  await P.travel('hospital', 12, 4, 'left', 'viaggio: ospedale');
  await useActor(P, 'hospital', 'gerard', 'gerard_a2');
  await P.travel('hospital', 3, 6, 'up', 'viaggio: letto di Ronette');
  const ron = await useActor(P, 'hospital', 'ronette', 'ronette_q');
  if (ron.choices && ron.choices.length) await P.choose('q_uomo');
  await P.travel('diner', 9, 7, 'up', 'viaggio: Double R');
  await useActor(P, 'diner', 'james', 'james_a2');

  // confronto del taccuino: cuore intero + rotta di James
  const cmp = await P.compare('E6A_CUORE_INTERO', 'T_JAMES_EST');
  check(`[${name}] setup: confronto M4 disponibile nel taccuino reale`, cmp.ok && cmp.choices.includes('b8_a'), cmp);
  if (cmp.ok && cmp.choices.includes('b8_a')) await P.choose('b8_a');
  await P.closeNotebook();

  // presentazione di P2 a Truman → completamento M4 → atto3
  await P.travel('sheriff', 11, 4, 'left', 'viaggio: centrale');
  const tr = await useActor(P, 'sheriff', 'truman', 'present_truman_m4');
  await P.present('P2');
  await P.call('await A3.wait(700); return true;');

  const st = await P.state();
  check(`[${name}] setup: Atto 3 aperto dal gioco (atto3 + P2 accettata)`,
    st.flags.includes('atto3'), { flags: st.flags, truman: tr });
  return st;
}

/* --------------------------------- M5 --------------------------------- */
async function enterTraincar(P) {
  await P.travel('town', 54, 14, 'right', 'viaggio: strada a est');
  return P.enterDoor(55, 14, 54, 14);
}

async function playM5(P, name, opts, shot) {
  const T = TRAINCAR;
  const door = await enterTraincar(P);
  check(`[${name}] M5: la porta est di città porta al vagone`, door.ok && door.map === 'traincar', door);

  // porta OEJ chiusa prima della rotta a est
  const oejEarly = await P.enterDoor(21, 0, 21, 1);
  check(`[${name}] M5: la porta di One Eyed Jacks è chiusa prima di east_route_confirmed (oej_bloccato)`,
    !oejEarly.ok && oejEarly.blocked && oejEarly.blocked.id === 'oej_bloccato', oejEarly);

  // approccio NATURALE: si arriva da ovest lungo la riga 7 e si guarda il
  // parapetto dalle assi del ponte (4,7). È da lì che un giocatore interagisce.
  const side = await P.reachFrom(4, 7, 'up');
  check(`[${name}] M5: il parapetto del ponte si raggiunge dalle assi (4,7)`, side.ok, side);
  await P.interact();
  const trapped = !(await P.canReach(T.traincar_entrance[0], T.traincar_entrance[1]));
  check(`[${name}] M5: dopo la scena del ponte il vagone resta raggiungibile a piedi`,
    !trapped, { note: 'hawk_bridge (5,7) chiude l\'unico varco fra le assi del ponte e la radura', pos: await P.pos() });
  const hawks1 = (await P.npcsHere()).filter((n) => n.sprite === 'hawk');
  const hawkR1 = await P.castResolve('hawk');
  check(`[${name}] M5: un solo Hawk sul vagone dopo il ponte, PLACED@traincar 5,6 dal registro`,
    hawks1.length === 1 && hawkR1.status === 'PLACED' && hawkR1.sceneId === 'traincar' && hawkR1.x === 5 && hawkR1.y === 6 &&
    hawks1[0].x === hawkR1.x && hawks1[0].y === hawkR1.y, { hawks1, hawkR1 });

  // scoperta + prompt della teoria preliminare (stessa sessione)
  const disc = await useTarget(P, T.traincar_entrance[0], T.traincar_entrance[1], 'm5_discovery');
  check(`[${name}] M5: la soglia del vagone apre il prompt della teoria preliminare`,
    disc.choices && disc.choices.length === 2, disc.choices);
  check(`[${name}] M5: il prompt preliminare non offre «disposizione»`,
    (disc.choices || []).every((c) => !/staging/i.test(c)), disc.choices);
  await P.choose(opts.initialTheory);

  const hawks2 = (await P.npcsHere()).filter((n) => n.sprite === 'hawk');
  const hawkR2 = await P.castResolve('hawk');
  check(`[${name}] M5: un solo Hawk dopo la scoperta, PLACED@traincar 14,8 dal registro`,
    hawks2.length === 1 && hawkR2.status === 'PLACED' && hawkR2.sceneId === 'traincar' && hawkR2.x === 14 && hawkR2.y === 8 &&
    hawks2[0].x === hawkR2.x && hawks2[0].y === hawkR2.y, { hawks2, hawkR2 });

  for (const step of opts.observationOrder) {
    await useTarget(P, T[step][0], T[step][1], 'm5_' + step);
  }
  if (opts.stove) await useTarget(P, T.stove[0], T.stove[1], 'm5_stove');
  if (opts.cards) await useTarget(P, T.cards[0], T.cards[1], 'm5_cards');

  // confronto anello ↔ polvere nel taccuino reale
  const cmp = await P.compare('E8A_ANELLO_POSIZIONE', 'E8B_ANELLO_SUPERFICIE');
  check(`[${name}] M5: il confronto dell'anello si apre dal taccuino reale`,
    cmp.ok && (cmp.choices || []).includes('ring_a'), cmp);
  if (opts.wrongRingFirst) {
    const held = await P.chooseAndHold('ring_b');
    check(`[${name}] M5: la lettura sbagliata dell'anello risponde con la sua pagina`,
      held.ok && held.page === 'm5.b8c.feedback.no_entry', held);
    if (shot) await shot('comparison-ring-feedback.png');
    const wrong = await P.advance();
    check(`[${name}] M5: la lettura sbagliata dell'anello resta ritentabile`,
      (wrong.choices || []).includes('ring_a'), wrong);
  }
  await P.choose('ring_a');
  await P.closeNotebook();

  // milestone della teoria: si riapre da qualsiasi interazione M5 (soglia)
  const rev = await useTarget(P, T.traincar_entrance[0], T.traincar_entrance[1], 'milestone teoria');
  check(`[${name}] M5: la milestone della teoria si riapre dalla soglia`,
    (rev.choices || []).length >= 2, rev.choices);
  await P.choose(opts.theoryChoice);

  // taglio nord PRIMA di S1: rifiuto diegetico
  const early = await useTarget(P, T.tracks_north[0], T.tracks_north[1], 'm5_tracks_north_early');
  const earlyPages = (early.rows || []).filter((r) => r.kind === 'page').map((r) => r.page_id);
  check(`[${name}] M5: il taglio nord prima di S1 risponde col rinvio, non con la rotta`,
    earlyPages.includes('m5.a14.early.p01') && !earlyPages.includes('m5.a14.tracks.p01'), earlyPages);

  // rapporto a Truman sul posto + S1
  // NOTA: il pin ACT3_TRAINCAR_REPORT della fixture semina audrey_indaga=false,
  // ma nella giocata reale quel flag è già vero da playActs12 (audrey_a2,
  // js/data.js) — prima ancora che l'Atto 3 inizi. La combinazione del pin è
  // irraggiungibile per questo percorso: si cattura senza confrontare con quel
  // pin (nessun pin adatto), il controllo doppioni resta.
  await captureCast(P, name, 'vagone: prima del rapporto a Truman', null);
  await P.note('presenza: il pin ACT3_TRAINCAR_REPORT non è applicabile qui — audrey_indaga è già vero dall\'Atto 2 reale, il pin lo semina falso', null);
  const ringBefore = await P.ringHidden();
  const rep = await useActor(P, 'traincar', 'truman', 'm5_report_intro',
    shot ? 'm5.b9.report.contest.p01' : null, shot, 'truman-contest-impeto.png');
  const repPages = (rep.rows || []).filter((r) => r.kind === 'page').map((r) => r.page_id);
  check(`[${name}] M5: il rapporto porta le pagine attese per la teoria «${opts.finalTheory}»`,
    opts.expectReportPages.every((p) => repPages.includes(p)) &&
    (opts.forbidReportPages || []).every((p) => !repPages.includes(p)),
    { got: repPages, want: opts.expectReportPages, forbid: opts.forbidReportPages });
  check(`[${name}] M5: il prompt S1 arriva nella stessa sessione del rapporto`,
    (rep.choices || []).includes('s1_institutional'), rep.choices);
  await P.choose(opts.s1);

  const ringAfter = await P.ringHidden();
  check(`[${name}] M5: l'anello sparisce dalla scena dopo S1`, ringBefore === false && ringAfter === true,
    { before: ringBefore, after: ringAfter });

  const hawks3 = (await P.npcsHere()).filter((n) => n.sprite === 'hawk');
  const hawkR3 = await P.castResolve('hawk');
  check(`[${name}] M5: un solo Hawk dopo S1, al taglio a nord, PLACED@traincar 22,3 dal registro`,
    hawks3.length === 1 && hawkR3.status === 'PLACED' && hawkR3.sceneId === 'traincar' && hawkR3.x === 22 && hawkR3.y === 3 &&
    hawks3[0].x === hawkR3.x && hawks3[0].y === hawkR3.y, { hawks3, hawkR3 });

  await useTarget(P, T.tracks_north[0], T.tracks_north[1], 'm5_tracks_north');
  const afterTracks = await P.state();
  check(`[${name}] M5: il taglio a nord conferma la rotta est`,
    afterTracks.flags.includes('east_route_confirmed'), afterTracks.flags);

  if (opts.reloadAtNorthCut) {
    const rl = await P.reload();
    check(`[${name}] M5: reload al taglio nord — obiettivo HUD identico`,
      rl.before.objective === rl.after.objective, { before: rl.before.objective, after: rl.after.objective });
    check(`[${name}] M5: reload al taglio nord — entità identiche`,
      JSON.stringify(rl.before.npcs) === JSON.stringify(rl.after.npcs), { before: rl.before.npcs, after: rl.after.npcs });
    check(`[${name}] M5: reload al taglio nord — mappa e stato narrativo identici`,
      rl.before.map === rl.after.map &&
      JSON.stringify(rl.before.digest) === JSON.stringify(rl.after.digest),
      { before_map: rl.before.map, after_map: rl.after.map });
    if (rl.before.x !== rl.after.x || rl.before.y !== rl.after.y) {
      await P.note(`reload: la casella ripristinata (${rl.after.x},${rl.after.y}) non è quella lasciata (${rl.before.x},${rl.before.y})`);
    }
  }

  await useTarget(P, T.sign_oej[0], T.sign_oej[1], 'm5_sign_oej');
  const oej = await P.enterDoor(21, 0, 21, 1);
  check(`[${name}] M5: con la rotta confermata la porta di One Eyed Jacks si apre`,
    oej.ok && oej.map === 'oej', oej);
}

/* --------------------------------- M6 --------------------------------- */
async function playM6(P, name, opts, shot) {
  const npcs = await P.npcsHere();
  check(`[${name}] M6: Jacques e Audrey esistono come NPC sulla sala di One Eyed Jacks`,
    npcs.some((n) => n.id === 'jacques') && npcs.some((n) => n.id === 'audrey'), npcs.map((n) => n.id));

  const ferry = await useActor(P, 'oej', 'jacques', 'm6_ferry');
  check(`[${name}] M6: il tavolo di Jacques risponde all'ingresso in sala`,
    (ferry.rows || []).some((r) => r.page_id === 'm6.b1.ferry.p01'), (ferry.rows || []).map((r) => r.page_id));

  let tac = ferry;
  if (opts.audrey) {
    // il prompt della tattica si apre nella stessa sessione dell'ingresso in
    // sala: Escape lo abbandona senza committare, si va da Audrey, si torna.
    await P.abortWidget();
    const aud = await useActor(P, 'oej', 'audrey', 'm6_audrey');
    const st = await P.state();
    check(`[${name}] M6: Audrey vista sotto copertura a One Eyed Jacks`,
      st.flags.includes('audrey_vista_oej'), (aud.rows || []).map((r) => r.page_id));
    tac = await useActor(P, 'oej', 'jacques', 'm6_tactic');
  }
  // NOTA: i pin ACT3_OEJ / ACT3_OEJ_NO_AUDREY seminano audrey_indaga=false, ma
  // nella giocata reale quel flag è già vero dall'Atto 2 (stessa causa del
  // rapporto al vagone sopra): irraggiungibili quando Audrey non è ancora
  // stata vista a One Eyed Jacks. Solo ACT3_OEJ_AUDREY_SEEN (che richiede
  // audrey_indaga=true) è raggiungibile e si confronta.
  if (opts.audrey) {
    await captureCast(P, name, 'One Eyed Jacks (prima del fermo)', 'ACT3_OEJ_AUDREY_SEEN');
  } else {
    await captureCast(P, name, 'One Eyed Jacks (prima del fermo)', null);
    await P.note('presenza: ACT3_OEJ_NO_AUDREY non applicabile qui — audrey_indaga è già vero dall\'Atto 2 reale, il pin lo semina falso', null);
  }
  const tacPages = [...(ferry.rows || []), ...(tac === ferry ? [] : tac.rows || [])]
    .filter((r) => r.kind === 'page').map((r) => r.page_id);
  check(`[${name}] M6: richiamo alle carte del vagone ${opts.cards ? 'presente' : 'assente'} al tavolo`,
    tacPages.includes('m6.b4.tactic.cards_recall') === !!opts.cards, tacPages);
  check(`[${name}] M6: tre tattiche offerte`, (tac.choices || []).length === 3, tac.choices);
  const branch = await P.choose('tactic_' + opts.tactic);

  // P5 nel taccuino, prima una lettura respinta
  let widget = branch.after && branch.after.choices || [];
  check(`[${name}] M6: la catena tattica→interrogatorio→P5 gira sotto un solo lease`,
    widget.includes('p5_present'), widget);
  if (opts.wrongP5First) {
    const wrong = await P.choose('p5_killed');
    check(`[${name}] M6: «ha ucciso Laura» è respinta e ritentabile`,
      wrong.ok && (wrong.after.choices || []).includes('p5_present'), wrong);
  }
  if (opts.cardsCompare) {
    // il confronto facoltativo carte ↔ testimonianza vive nel taccuino: chiude
    // prima il widget P5 aperto (Escape non committa nulla).
    await P.call('for (var i=0;i<4 && A3.widgetOpts().length;i++) await A3.press("Escape"); return A3.widgetOpts();');
    const cc = await P.compare('E_CARTE', opts.cardsTestimony);
    check(`[${name}] M6: confronto carte ↔ testimonianza disponibile`,
      cc.ok && (cc.choices || []).includes('cards_hand'), cc);
    if (cc.ok && (cc.choices || []).includes('cards_hand')) await P.choose('cards_hand');
    await P.closeNotebook();
    const back = await useActor(P, 'oej', 'jacques', 'm6_p5 (ripresa)');
    widget = back.choices || [];
  }
  if (widget.includes('p5_present')) await P.choose('p5_present');
  else {
    const again = await useActor(P, 'oej', 'jacques', 'm6_p5');
    if ((again.choices || []).includes('p5_present')) await P.choose('p5_present');
  }
  let st = await P.state();
  if (!st.flags.includes('jacques_preso')) {
    await useActor(P, 'oej', 'jacques', 'm6_arrest');
    st = await P.state();
  }
  check(`[${name}] M6: fermo di Renault committato`, st.flags.includes('jacques_preso'), st.flags);
  await captureCast(P, name, 'One Eyed Jacks: dopo il fermo', 'ACT3_AFTER_ARREST');

  if (opts.trumanBeforeHospital) {
    await P.travel('sheriff', 11, 4, 'left', 'viaggio: centrale');
    const earlyT = await useActor(P, 'sheriff', 'truman', 'm6_return_night_early');
    const pages = (earlyT.rows || []).filter((r) => r.kind === 'page').map((r) => r.page_id);
    check(`[${name}] M6: prima dell'ospedale Truman rinvia il rapporto`,
      pages.includes('m6.b7b.early.p01') && !pages.includes('m6.b7b.night.p01'), pages);
  }

  // registro di turno all'ospedale (obbligatorio)
  await P.travel('hospital', 13, 7, 'down', 'viaggio: reparto');
  const ward0 = await P.npcsHere();
  const piantone = ward0.find((n) => n.id === 'piantone');
  check(`[${name}] M6: il piantone è in fondo al reparto, davanti alla porta nord (7,3)`,
    !!piantone && piantone.x === 7 && piantone.y === 3 && piantone.sprite === 'andy', piantone || ward0.map((n) => n.id));
  const blocked = await P.unreachable();
  check(`[${name}] M6: il piantone non chiude nessun percorso del reparto`,
    blocked.length === 0, blocked);
  const guard = await useTarget(P, 13, 8, 'm6_hospital_guard',
    shot ? 'm6.b7c.guard.p03' : null, shot, 'hospital-guard.png');
  const guardPages = (guard.rows || []).filter((r) => r.kind === 'page').map((r) => r.page_id);
  check(`[${name}] M6: il registro di turno rende le quattro pagine del piantone`,
    guardPages.join(',') === 'm6.b7c.guard.p01,m6.b7c.guard.p02,m6.b7c.guard.p03,m6.b7c.guard.p04', guardPages);
  const wardNpcs = await P.npcsHere();
  check(`[${name}] M6: un piantone davanti alla stanza, nessun doppione`,
    wardNpcs.filter((n) => n.id === 'piantone').length === 1 &&
    wardNpcs.filter((n) => n.id === 'piantone_ronette').length === 0, wardNpcs.map((n) => n.id));
  await captureCast(P, name, 'ospedale sorvegliato (dopo il registro di turno)', 'ACT3_GUARDED_HOSPITAL');

  if (opts.reloadAfterArrest) {
    const cwGuardBefore = await P.castWhere();
    const rl = await P.reload();
    check(`[${name}] M6: reload dopo il fermo — obiettivo HUD identico`,
      rl.before.objective === rl.after.objective, { before: rl.before.objective, after: rl.after.objective });
    check(`[${name}] M6: reload dopo il fermo — entità identiche`,
      JSON.stringify(rl.before.npcs) === JSON.stringify(rl.after.npcs), { before: rl.before.npcs, after: rl.after.npcs });
    check(`[${name}] M6: reload dopo il fermo — stato narrativo identico`,
      JSON.stringify(rl.before.digest) === JSON.stringify(rl.after.digest), 'digest diverso');
    const cwGuardAfter = await P.castWhere();
    check(`[${name}] M6: reload nell'ospedale sorvegliato — il registro Cast Continuity è identico prima e dopo`,
      JSON.stringify(cwGuardBefore) === JSON.stringify(cwGuardAfter), { before: cwGuardBefore, after: cwGuardAfter });
    const saveRaw = await P.savedRaw();
    const saveText = (saveRaw.narrative || '') + '\n' + (saveRaw.classic || '');
    const leakedKeys = ['cast_source', 'sceneId', 'homeX'].filter((k) => saveText.indexOf(k) >= 0);
    check(`[${name}] M6: reload nell'ospedale sorvegliato — il salvataggio non contiene chiavi di posizione`,
      leakedKeys.length === 0, leakedKeys);
    reloadResults.push({
      path: name, moment: 'ospedale sorvegliato (dopo il fermo)',
      digestEqual: JSON.stringify(rl.before.digest) === JSON.stringify(rl.after.digest),
      castEqual: JSON.stringify(cwGuardBefore) === JSON.stringify(cwGuardAfter),
      saveLeaks: leakedKeys
    });
  }

  // rapporto notturno
  await P.travel('sheriff', 11, 4, 'left', 'viaggio: centrale');
  const night = await useActor(P, 'sheriff', 'truman', 'm6_return_night');
  const nightPages = (night.rows || []).filter((r) => r.kind === 'page').map((r) => r.page_id);
  check(`[${name}] M6: la riga di Truman su Audrey ${opts.audrey ? 'compare' : 'non compare'}`,
    nightPages.includes('m6.b7b.night.audrey') === !!opts.audrey, nightPages);

  // Lucy: la chiamata dall'ospedale
  await P.travel('sheriff', 3, 6, 'down', 'viaggio: reception');
  const lucy = await useActor(P, 'sheriff', 'lucy', 'm6_news',
    shot && opts.impeto ? 'm6.b8.news.cooper_impeto' : null, shot, 'lucy-impeto.png');
  const lucyPages = (lucy.rows || []).filter((r) => r.kind === 'page').map((r) => r.page_id);
  check(`[${name}] M6: la correzione «impeto» ${opts.impeto ? 'compare' : 'non compare'} da Lucy`,
    lucyPages.includes('m6.b8.news.cooper_impeto') === !!opts.impeto, lucyPages);
  const afterLucy = await P.state();
  check(`[${name}] M6: la morte di Renault è registrata`, afterLucy.flags.includes('jacques_dead'), afterLucy.flags);
  await captureCast(P, name, 'centrale, notte (dopo la chiamata di Lucy)', 'ACT3_NIGHT_STATION');

  if (opts.revisitRegister) {
    await P.travel('hospital', 13, 7, 'down', 'viaggio: reparto');
    const rev = await useTarget(P, 13, 8, 'm6_hospital');
    const revPages = (rev.rows || []).filter((r) => r.kind === 'page').map((r) => r.page_id);
    check(`[${name}] M6: il registro riletto dopo la morte rende la coda B8b`,
      revPages.includes('m6.b8b.hospital.p01'), revPages);
    const ward = await P.npcsHere();
    check(`[${name}] M6: morto Renault la sorveglianza si sposta su Ronette`,
      ward.filter((n) => n.id === 'piantone_ronette').length === 1 &&
      ward.filter((n) => n.id === 'piantone').length === 0, ward.map((n) => n.id));
  }

  // specchio della 315: il Gigante
  const beforeGiant = await P.classicFlags();
  check(`[${name}] M6: il Gigante non è ancora apparso prima della 315`, !beforeGiant.gigante1, beforeGiant.gigante1);
  await P.note('315: intro_hotel prima dell\'arrivo notturno', { intro_hotel: !!beforeGiant.intro_hotel });
  await P.travelNoDrain('room_315', 13, 4, 'up', 'viaggio: stanza 315');
  const onEnter = await P.dialogueNow();
  await P.note('315: dialogo d\'ingresso notturno', onEnter);
  if (shot && onEnter) await shot('room-315-onenter-night.png');
  const afterEnterFlags = await P.classicFlags();
  await P.note('315: intro_hotel dopo l\'arrivo', { intro_hotel: !!afterEnterFlags.intro_hotel });
  await P.drain('ingresso 315');
  await P.interact();
  await P.drain('specchio 315');
  const giant = await P.classicFlags();
  check(`[${name}] M6: la prima apparizione del Gigante arriva SOLO dallo specchio della 315`,
    giant.gigante1 === true, giant.gigante1);

  // ponte verso l'Atto 4
  await P.travel('sheriff', 11, 4, 'left', 'viaggio: centrale');
  const bridge = await useActor(P, 'sheriff', 'truman', 'm6_atto4_bridge',
    shot ? opts.expectS1Echo : null, shot, 'atto4-s1-echo.png');
  const bridgePages = (bridge.rows || []).filter((r) => r.kind === 'page').map((r) => r.page_id);
  check(`[${name}] Atto 4: la riga sul registro ${opts.revisitRegister ? 'compare' : 'non compare'}`,
    bridgePages.includes('m6.b9.atto4.register') === !!opts.revisitRegister, bridgePages);
  check(`[${name}] Atto 4: eco S1 corretta (${opts.expectS1Echo})`,
    bridgePages.includes(opts.expectS1Echo) &&
    bridgePages.filter((p) => p.startsWith('m6.b9.atto4.s1_')).length === 1, bridgePages);
}

/* --------------------- Cast Continuity: pin comparator --------------------- */
/* Stessa logica di test/act-4-playthrough.js: test/fixtures/cast-pins-acts-1-4.json
   §4 è verità di prova, non stato reale del percorso. Un pin si applica a un
   momento quando la combinazione di valori che conta per la collocazione
   (qui: le fasi dell'Atto 3 — teoria, S1, fermo, ospedale) coincide con quella
   della semina sintetica; altrimenti si cattura senza confronto. */
const CAST_FIXTURE = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'fixtures', 'cast-pins-acts-1-4.json'), 'utf8'));
const castCaptures = [];
const reloadResults = [];
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

/* ------------------------------ percorsi ------------------------------ */
const PATHS = {
  'impeto-kept': {
    initialTheory: 'theory_degeneration',
    observationOrder: ['mound', 'ring', 'scene_center'],
    stove: true, cards: true,
    wrongRingFirst: true,
    theoryChoice: 'revision_keep',
    finalTheory: 'degeneration',
    expectReportPages: ['m5.b9.report.theory_degeneration', 'm5.b9.report.contest.p01', 'm5.b9.report.contest.p02', 'm5.b9.report.contest.p03'],
    forbidReportPages: ['m5.b9.report.accept.p01', 'm5.b9.report.open.p01'],
    s1: 's1_institutional',
    reloadAtNorthCut: false,
    audrey: true,
    tactic: 'falsa_sicurezza',
    cardsCompare: true, cardsTestimony: 'JACQUES_THIRD_MAN_DETAIL',
    wrongP5First: true,
    trumanBeforeHospital: true,
    reloadAfterArrest: true,
    impeto: true,
    revisitRegister: true,
    expectS1Echo: 'm6.b9.atto4.s1_safe'
  },
  'withhold-open': {
    initialTheory: 'theory_withhold',
    observationOrder: ['ring', 'mound', 'scene_center'],
    stove: false, cards: false,
    wrongRingFirst: false,
    theoryChoice: 'first_open',
    finalTheory: 'open',
    expectReportPages: ['m5.b9.report.theory_open', 'm5.b9.report.open.p01'],
    forbidReportPages: ['m5.b9.report.contest.p01', 'm5.b9.report.accept.p01'],
    s1: 's1_documented',
    reloadAtNorthCut: true,
    audrey: false,
    tactic: 'prova',
    cardsCompare: false,
    wrongP5First: false,
    trumanBeforeHospital: false,
    reloadAfterArrest: false,
    impeto: false,
    revisitRegister: false,
    expectS1Echo: 'm6.b9.atto4.s1_pocket'
  },
  'withhold-staging': {
    initialTheory: 'theory_withhold',
    observationOrder: ['scene_center', 'mound', 'ring'],
    stove: false, cards: false,
    wrongRingFirst: false,
    theoryChoice: 'first_staging',
    finalTheory: 'staging',
    expectReportPages: ['m5.b9.report.theory_staging', 'm5.b9.report.accept.p01'],
    forbidReportPages: ['m5.b9.report.contest.p01', 'm5.b9.report.open.p01'],
    s1: 's1_documented',
    reloadAtNorthCut: false,
    audrey: false,
    tactic: 'pressione',
    cardsCompare: false,
    wrongP5First: false,
    trumanBeforeHospital: false,
    reloadAfterArrest: false,
    impeto: false,
    revisitRegister: true,
    expectS1Echo: 'm6.b9.atto4.s1_pocket'
  }
};

async function runPath(cdp, name, shot) {
  const P = ev(cdp);
  const opts = PATHS[name];
  await playActs12(P, name);
  await P.reset();                      // la trascrizione registra SOLO l'Atto 3
  await P.status('act3-' + name);
  await playM5(P, name, opts, name === 'impeto-kept' ? shot : null);
  await playM6(P, name, opts, name === 'impeto-kept' ? shot : null);
  const dump = await P.dump();
  auditTranscript(name, dump, opts);
  return dump;
}

/* --------------------------- controlli sul testo --------------------------- */
const AUTHORED = (() => {
  const out = {};
  for (const id of ['M4', 'M5', 'M6']) {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'narrative', 'missions', id + '.json'), 'utf8'));
    for (const n of m.nodes) {
      const all = [].concat(n.pages || []);
      if (n.pages_by_value) for (const c of Object.values(n.pages_by_value.cases || {})) all.push(...c);
      for (const c of n.choices || []) all.push(...(c.feedback_pages || []));
      if (n.presentation) for (const b of Object.values(n.presentation.on || {})) all.push(...(b.pages || []));
      for (const p of all) out[p.id] = p;
    }
    for (const [oid, o] of Object.entries(m.objectives ? {} : {})) out[oid] = o;
  }
  return out;
})();
const OBJECTIVE_TEXTS = (() => {
  const set = new Set(['']);
  for (const id of ['M4', 'M5', 'M6', 'M8']) {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'narrative', 'missions', id + '.json'), 'utf8'));
    for (const o of m.objectives || []) {
      set.add(o.text);
      if (o.optional_line) set.add(o.text + ' — ' + o.optional_line);
    }
  }
  return set;
})();

/* ordine di gioco dei pioli dell'obiettivo (M4 → M5 → M6) */
const RUNGS = (() => {
  const byId = {};
  for (const id of ['M4', 'M5', 'M6', 'M8']) {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'narrative', 'missions', id + '.json'), 'utf8'));
    for (const o of m.objectives || []) byId[o.id] = o.text;
  }
  return ['obj_m4_1', 'obj_m4_2', 'obj_m4_3', 'obj_m4_4', 'obj_m4_5',
    'obj_m5_1', 'obj_m5_2', 'obj_m5_3', 'obj_m5_4', 'obj_m5_5', 'obj_m5_6', 'obj_m5_7',
    'obj_m6_1', 'obj_m6_2', 'obj_m6_3', 'obj_m6_3b', 'obj_m6_4', 'obj_m6_4b', 'obj_m6_5', 'obj_m6_6',
    'obj_m8_0']   // primo piolo dell'Atto 4: chiude la giocata
    .map((id) => byId[id]).filter(Boolean);
})();
const notesOut = [];

const METADATA_RE = /\[|\bm[456]_[a-z0-9_]+\b|E8A|E8B|E7A|E7B|P3A|P5\b|DELIBERATE_PLACEMENT|OVERREACH|UNSUPPORTED_BY_TACTIC|ATTRIBUTION_/;

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

  // 2. il testo emesso è quello scritto
  const textDrift = pages.filter((p) => {
    const a = AUTHORED[p.page_id];
    return a && a.text !== p.text;
  }).map((p) => ({ page: p.page_id, emitted: p.text, authored: AUTHORED[p.page_id].text }));
  check(`[${name}] testo: nessuna deriva fra pagina scritta e pagina emessa`, textDrift.length === 0, textDrift.slice(0, 4));

  // 3. nessun id/metadato a schermo
  const leaks = pages.filter((p) => METADATA_RE.test(p.text || '')).map((p) => ({ page: p.page_id, text: p.text }));
  check(`[${name}] testo: nessun id di risultato/nodo o metadato «[…]» a schermo`, leaks.length === 0, leaks.slice(0, 4));

  // 4. obiettivi: solo testi autorizzati, e cambiano solo ai pioli scritti
  const objSeq = [];
  const sampled = dump.transcript.filter((r) => r.kind === 'page' || r.kind === 'objective')
    .map((r) => (r.kind === 'page' ? r.objective : String(r.text || '').replace(/^OBIETTIVO:\s*/, '')));
  for (const t of sampled) if (!objSeq.length || objSeq[objSeq.length - 1] !== t) objSeq.push(t);
  const unknown = objSeq.filter((t) => !OBJECTIVE_TEXTS.has(t));
  check(`[${name}] HUD: ogni testo di obiettivo osservato è un obiettivo scritto`, unknown.length === 0, unknown);

  // 4b. l'obiettivo avanza SOLO lungo i pioli scritti, mai all'indietro
  const seen = objSeq.filter((t) => t !== '');
  const order = RUNGS.filter((t) => seen.includes(t));
  const backwards = [];
  let cursor = -1;
  for (const t of seen) {
    const at = RUNGS.indexOf(t);
    if (at < cursor) backwards.push({ objective: t, after: RUNGS[cursor] });
    else cursor = at;
  }
  check(`[${name}] HUD: gli obiettivi si susseguono nell'ordine scritto, mai all'indietro`,
    backwards.length === 0, backwards);
  const skipped = RUNGS.slice(RUNGS.indexOf(seen[0]), RUNGS.indexOf(seen[seen.length - 1]) + 1)
    .filter((t) => !seen.includes(t));
  if (skipped.length) notesOut.push({ path: name, kind: 'obiettivo mai mostrato', objectives: skipped });

  // 5. nessun dialogo classico per gli attori narrativi su traincar/oej
  const classicLeak = dump.classic.filter((c) => ['traincar', 'oej'].includes(c.map) &&
    /hawk|jacques|audrey|truman/i.test(c.id));
  check(`[${name}] mondo: nessun dialogo classico di hawk/jacques/audrey/truman su vagone o One Eyed Jacks`,
    classicLeak.length === 0, classicLeak);

  // 6. attori mai raddoppiati sulle mappe dell'Atto 3
  const dup = dump.mapEntries.filter((e) => ['traincar', 'hospital'].includes(e.map))
    .map((e) => ({ map: e.map, hawks: e.npcs.filter((n) => n.startsWith('hawk')), guards: e.npcs.filter((n) => n.startsWith('piantone')) }))
    .filter((e) => e.hawks.length > 1 || e.guards.length > 1);
  check(`[${name}] mondo: mai due Hawk o due piantoni sulla stessa mappa`, dup.length === 0, dup);

  // 6b. nessun ripiego sull'API: ogni interazione è passata dai tasti
  check(`[${name}] guida: nessun ripiego sull'API dell'adapter, tutto coi tasti`,
    dump.fallbacks.length === 0, dump.fallbacks);

  // 7. errori d'ambiguità delle root
  const amb = dump.transcript.filter((r) => r.kind === 'ERROR_ambiguous_roots');
  check(`[${name}] adapter: nessuna root ambigua`, amb.length === 0, amb);
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
  L.push('Scatti presi con `node test/act-3-playthrough.js` sulla build reale');
  L.push('(`index.html`), leggendo `GAME.CastPresence.where()` (js/cast-presence.js)');
  L.push('nei momenti chiave della giocata. Confrontati coi pin di');
  L.push('`test/fixtures/cast-pins-acts-1-4.json` quando la fase (teoria/S1/fermo/');
  L.push('ospedale) coincide con quella della semina sintetica; altrimenti solo');
  L.push('catturati (nessun pin adatto) e controllati per doppioni.');
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
  fs.appendFileSync(path.join(CP_DIR, 'act3-presence-trace.md'), L.join('\n') + '\n');
  console.log(`  cast-presence trace -> ${path.relative(ROOT, path.join(CP_DIR, 'act3-presence-trace.md'))} (appended)`);

  const R = [];
  R.push('');
  R.push(`## Browser reloads — Atto 3 (Chrome headless, ${stamp})`);
  R.push('');
  R.push('Ricariche reali dell\'iframe di produzione durante `act-3-playthrough.js`.');
  R.push('«registro» = `GAME.CastPresence.where()`; «narrativo» = lo stato serializzato');
  R.push('(flags/values/evidence/nodes_done) letto da `A3.stateDigest()`.');
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
  L.push(`# Atto 3 — trascrizione giocata «${name}»`);
  L.push('');
  L.push('Registrata sulla build di produzione (`index.html`) in Chrome headless.');
  L.push('Ogni riga è ciò che la UI ha davvero emesso: id di pagina, speaker dal DOM,');
  L.push('testo dal DOM, obiettivo HUD in quel momento.');
  L.push('');
  if (dump.fallbacks.length) {
    L.push('## Ripieghi sull\'API (nessun tasto possibile)');
    L.push('');
    for (const f of dump.fallbacks) L.push(`- \`${f.where}\` — ${f.why}`);
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
      L.push(`- **scelte** [${r.node_id}]: ${r.choices.join(' · ')}`);
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
    } else if (r.kind === 'classic') {
      L.push(`- _dialogo classico_ \`${r.id}\` su ${r.map}: ${r.pages.join(' / ')}`);
    } else if (r.kind === 'pair') {
      L.push(`- **taccuino** coppia ${r.pair.join(' + ')} → ${r.status}${r.matched ? ' (' + r.matched + ')' : ''}`);
    } else if (r.kind === 'no_roots') {
      L.push(`- **rifiuto** su \`${r.target}\``);
    } else if (r.kind === 'reload') {
      L.push('');
      L.push(`> **SALVA + RICARICA** — obiettivo prima: «${r.before.objective}» · dopo: «${r.after.objective}»`);
      L.push(`> entità prima: ${r.before.npcs.join(' · ')} · dopo: ${r.after.npcs.join(' · ')}`);
      L.push('');
    } else if (r.kind === 'api_interact') {
      L.push(`- ⚠️ **API** \`${r.map}/${r.actor}\` — ${r.why}`);
    } else if (r.kind === 'objective') {
      L.push(`- _obiettivo (${r.where})_: ${r.text || '(nessuno)'}`);
    } else if (r.kind === 'presentation') {
      L.push(`- **presentazione**: ${r.result} (${r.reason})`);
    }
  }
  fs.writeFileSync(path.join(TX_DIR, name + '.md'), L.join('\n') + '\n');
  console.log(`  transcript -> artifacts/act-3-closure/transcripts/${name}.{json,md}`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(2); });
