#!/usr/bin/env node
/* town-server.js — Living Town: the one town, and the door to it.
 *
 *   node living-town/server/town-server.js [--port=8787] [--data=<dir>] [--speed=6] [--seed=N] [--paused]
 *
 * One process runs one simulation on a real clock: at --speed=6 a town minute
 * is ten real seconds. It serves the page, and to every browser that opens it
 * a stream of what happened (see js/lt-live.js): an exact save on arrival,
 * then a frame a minute. The town is saved to --data every ten town minutes
 * and on exit, and every frame is appended to a log there for replay.
 *
 * Nobody can speed the town up from outside. The only commands from outside
 * are a spectator's hand (paid for from a purse) and, with LT_ADMIN_TOKEN set,
 * pause / resume / save. `--dev` is for a developer's own machine: it adds
 * speed, pause and single-minute step to the page and the API, for anyone
 * who can reach it. Never start the public town with it.
 *
 * No dependencies: node:http and Server-Sent Events.
 */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const LT_DIR = path.resolve(__dirname, '..');
require(path.join(LT_DIR, 'js', 'lt-scenario.js'));
require(path.join(LT_DIR, 'js', 'lt-save.js'));
require(path.join(LT_DIR, 'js', 'lt-story.js'));
require(path.join(LT_DIR, 'js', 'lt-hand.js'));
require(path.join(LT_DIR, 'js', 'lt-live.js'));
const Spectators = require('./spectators.js');
const LT = global.LT, Live = LT.Live, H = LT.Hand, U = LT.Util;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8' };

const POLICIES = { resident_a: 'utility', resident_b: 'utility', resident_c: 'utility', resident_d: 'utility', resident_e: 'utility' };
const SAVE_EVERY_MINUTES = 10;
const CATCH_UP_MAX = 30;        // minutes the clock may be behind before it gives up catching up and re-anchors
const STEPS_PER_TURN = 12;      // never more than this many minutes in one go, so requests get a turn
const TOWN_GAP_MINUTES = 3;     // between two circumstances from the hand, town-wide
const COOKIE = 'lt';

/* ---------------- options ---------------- */

function parseArgs(argv) {
  const o = { port: 8787, data: path.join(LT_DIR, 'data'), speed: 6, seed: null, paused: false, host: '127.0.0.1', dev: false };
  argv.forEach((a) => {
    const m = /^--([a-z-]+)(?:=(.*))?$/.exec(a);
    if (!m) return;
    if (m[1] === 'port') o.port = Number(m[2]);
    else if (m[1] === 'data') o.data = path.resolve(m[2]);
    else if (m[1] === 'speed') o.speed = Number(m[2]);
    else if (m[1] === 'seed') o.seed = Number(m[2]);
    else if (m[1] === 'paused') o.paused = true;
    else if (m[1] === 'dev') o.dev = true;
    else if (m[1] === 'host') o.host = m[2];
  });
  if (!(o.speed > 0)) throw new Error('--speed must be a positive number of town minutes per real minute');
  return o;
}

/* ---------------- the town ---------------- */

function createTown(opts) {
  const dataDir = opts.data;
  fs.mkdirSync(dataDir, { recursive: true });
  const savePath = path.join(dataDir, 'town.json');
  const logPath = path.join(dataDir, 'frames.jsonl');
  const peoplePath = path.join(dataDir, 'spectators.json');

  let sim, origin;
  if (fs.existsSync(savePath)) {
    sim = LT.Save.fromJSON(fs.readFileSync(savePath, 'utf8'), { policies: POLICIES });
    origin = 'resumed from ' + savePath + ' at ' + sim.stamp();
  } else {
    sim = LT.Scenario.town({ seed: opts.seed === null ? ((Date.now() % 2147483647) || 1) : opts.seed, policies: POLICIES });
    origin = 'new world, seed ' + sim.state.seed;
  }
  const host = Live.host(sim);
  const spectators = Spectators.create({});
  if (fs.existsSync(peoplePath)) {
    try { spectators.load(JSON.parse(fs.readFileSync(peoplePath, 'utf8'))); } catch (e) { /* a spectator file that cannot be read is not worth stopping for */ }
  }

  const msPerMinute = 60000 / opts.speed;
  const clock = { msPerMinute, anchorReal: Date.now(), anchorAbs: sim.absMinute(), paused: !!opts.paused, behind: 0, dev: !!opts.dev };
  const streams = new Set();   // { res, token }
  const attributions = {};     // intervention id -> spectator name, for those who join later
  let lastHandAbs = -Infinity, busy = false, lastSavedAbs = sim.absMinute(), closed = false;

  function targetAbs(now) {
    if (clock.paused) return sim.absMinute();
    return clock.anchorAbs + Math.floor((now - clock.anchorReal) / clock.msPerMinute);
  }
  function anchor(now) { clock.anchorReal = now; clock.anchorAbs = sim.absMinute(); }

  function writeAtomic(file, text) {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, file);
  }
  function save(reason) {
    writeAtomic(savePath, host.save());
    writeAtomic(peoplePath, JSON.stringify(spectators.toJSON()));
    lastSavedAbs = sim.absMinute();
    return { at: sim.stamp(), reason };
  }

  function send(stream, event, data) {
    try { stream.res.write('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n'); } catch (e) { streams.delete(stream); }
  }
  function broadcast(event, data) { streams.forEach((s) => send(s, event, data)); }

  function presence() {
    return { watching: streams.size, people: spectators.present() };
  }

  function onFrame(frame) {
    frame.itv.forEach((i) => { if (attributions[i.id]) i.by = attributions[i.id]; });
    fs.appendFileSync(logPath, JSON.stringify(frame) + '\n');
    broadcast('frame', frame);
    const credited = spectators.recharge();
    if (credited.length) streams.forEach((s) => { const who = spectators.get(s.token); if (who && credited.indexOf(who.ip) >= 0) send(s, 'you', spectators.describe(who)); });
    if (sim.absMinute() - lastSavedAbs >= SAVE_EVERY_MINUTES) save('interval');
  }

  /* The loop: every so often, as many minutes as the real clock says are
   * due, one at a time with a turn between them. */
  function turn() {
    if (busy || closed) return;
    const now = Date.now();
    let due = targetAbs(now) - sim.absMinute();
    if (due <= 0) return;
    if (due > CATCH_UP_MAX) { clock.behind += due; anchor(now); due = 1; }   // asleep for long: the town lost that time rather than living it in a blur
    busy = true;
    host.stepMany(Math.min(due, STEPS_PER_TURN), onFrame).then(() => { busy = false; }, (e) => { busy = false; console.error('tick failed', e); });
  }

  /* ---------------- what a spectator may do ---------------- */

  function hand(token, body) {
    const who = spectators.get(token);
    if (!who) return { ok: false, error: 'not_joined', said: 'join with a name first' };
    const entry = H.entry(body && body.id);
    if (!entry || H.offered().indexOf(entry) < 0) return { ok: false, error: 'unknown_intervention', said: 'that is not something the hand can do' };
    if (sim.absMinute() - lastHandAbs < TOWN_GAP_MINUTES) {
      const wait = Math.ceil((TOWN_GAP_MINUTES - (sim.absMinute() - lastHandAbs)) * clock.msPerMinute / 1000);
      return { ok: false, error: 'town_busy', said: 'something was just arranged; the town takes a breath first (' + wait + ' s)', purse: spectators.describe(who).purse };
    }
    const paid = spectators.spend(token, entry.id);
    if (!paid.ok) return { ok: false, error: paid.error, said: 'that costs ' + paid.cost + ' and you have ' + paid.purse, purse: paid.purse, cost: paid.cost };
    const made = H.make(sim, entry.id, body.answers || {}, body.when || 'now');
    if (!made.ok) {
      spectators.refund(token, paid.cost);
      return { ok: false, error: made.error, said: made.said, purse: spectators.describe(who).purse };
    }
    lastHandAbs = sim.absMinute();
    attributions[made.record.id] = who.name;
    host.pendingItv.forEach((i) => { if (i.id === made.record.id) i.by = who.name; });
    return { ok: true, cost: paid.cost, purse: paid.purse, record: { id: made.record.id, at: U.stamp(made.record.atDay, made.record.atMinute), label: entry.label } };
  }

  function status() {
    return { day: sim.state.day, minute: sim.state.minute, clock: U.clock(sim.state.minute), abs: sim.absMinute(), paused: clock.paused,
      msPerMinute: clock.msPerMinute, dev: clock.dev, watching: streams.size, frames: host.frames, savedAt: lastSavedAbs, origin, world: LT.World.fingerprint(), behind: clock.behind };
  }

  const town = {
    sim, host, spectators, clock, streams, attributions, origin, dataDir,
    hand, status, save, presence,
    step: () => host.stepMany(1, onFrame),
    hello(token) {
      const who = spectators.get(token);
      return { save: host.save(), at: sim.absMinute(), msPerMinute: clock.msPerMinute, now: Date.now(), paused: clock.paused, dev: clock.dev,
        you: who ? spectators.describe(who) : null, costs: spectators.costs, purseMax: spectators.purseMax, attributions, presence: presence() };
    },
    pause() { if (!clock.paused) { clock.paused = true; broadcast('clock', { paused: true, msPerMinute: clock.msPerMinute }); } return status(); },
    resume() { if (clock.paused) { clock.paused = false; anchor(Date.now()); broadcast('clock', { paused: false, msPerMinute: clock.msPerMinute }); } return status(); },
    /* Developer's machine only (--dev): the pace, or one minute by hand. */
    setSpeed(speed) {
      if (!clock.dev) return { ok: false, error: 'not_dev' };
      if (!(speed >= 0) || speed > 3600) return { ok: false, error: 'bad_speed' };
      if (speed === 0) return Object.assign({ ok: true }, town.pause());
      clock.msPerMinute = 60000 / speed;
      anchor(Date.now());
      if (clock.paused) clock.paused = false;
      broadcast('clock', { paused: false, msPerMinute: clock.msPerMinute });
      return Object.assign({ ok: true }, status());
    },
    stepOnce() {
      if (!clock.dev) return Promise.resolve({ ok: false, error: 'not_dev' });
      if (busy) return Promise.resolve({ ok: false, error: 'busy' });
      busy = true;
      return host.stepMany(1, onFrame).then(() => { busy = false; anchor(Date.now()); return Object.assign({ ok: true }, status()); }, (e) => { busy = false; throw e; });
    },
    start() { anchor(Date.now()); town.timer = setInterval(turn, 100); town.beat = setInterval(() => { streams.forEach((s) => { try { s.res.write(': beat\n\n'); } catch (e) { streams.delete(s); } }); }, 15000); },
    stop() { closed = true; clearInterval(town.timer); clearInterval(town.beat); const r = save('stop'); streams.forEach((s) => { try { s.res.end(); } catch (e) { /* gone */ } }); streams.clear(); return r; }
  };
  return town;
}

/* ---------------- HTTP ---------------- */

function readJSON(req, limit) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > (limit || 8192)) { resolve(null); req.destroy(); } });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}
function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((c) => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return out;
}
function addressOf(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.socket.remoteAddress || '?';
}
function json(res, code, data, headers) {
  const h = Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, headers || {});
  res.writeHead(code, h);
  res.end(JSON.stringify(data));
}

function serveStatic(res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') { res.writeHead(302, { location: '/living-town/' }); res.end(); return; }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep) || rel.indexOf('/.') >= 0 || rel.indexOf('/living-town/data/') === 0 || rel.indexOf('/living-town/server/') === 0) { res.writeHead(404); res.end('not found'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    const ext = path.extname(file).toLowerCase();
    let body = buf;
    if (rel === '/living-town/index.html') {
      /* The same page as on static hosting, told where the town is. */
      body = Buffer.from(buf.toString('utf8').replace('</head>', '  <meta name="lt-live" content="/api">\n</head>'), 'utf8');
    }
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(body);
  });
}

function createServer(town, opts) {
  const adminToken = process.env.LT_ADMIN_TOKEN || null;
  return http.createServer(async (req, res) => {
    const p = new URL(req.url, 'http://x').pathname;
    if (!p.startsWith('/api/')) return serveStatic(res, p);
    const token = cookies(req)[COOKIE] || null;

    if (req.method === 'GET' && p === '/api/town') return json(res, 200, town.status());
    if (req.method === 'GET' && p === '/api/me') {
      const who = town.spectators.get(token);
      return who ? json(res, 200, { ok: true, you: town.spectators.describe(who) }) : json(res, 401, { ok: false, error: 'not_joined' });
    }
    if (req.method === 'POST' && p === '/api/join') {
      const body = await readJSON(req);
      if (!body) return json(res, 400, { ok: false, error: 'bad_json' });
      const r = town.spectators.join(body.name, addressOf(req));
      if (!r.ok) return json(res, 400, r);
      const cookie = COOKIE + '=' + encodeURIComponent(r.token) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + (180 * 24 * 3600);
      return json(res, 200, { ok: true, you: r.you }, { 'set-cookie': cookie });
    }
    if (req.method === 'GET' && p === '/api/stream') {
      if (!town.spectators.get(token)) return json(res, 401, { ok: false, error: 'not_joined' });
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' });
      const stream = { res, token };
      town.streams.add(stream);
      town.spectators.connect(token, +1);
      res.write('event: hello\ndata: ' + JSON.stringify(town.hello(token)) + '\n\n');
      const here = town.presence();
      town.streams.forEach((s) => { try { s.res.write('event: presence\ndata: ' + JSON.stringify(here) + '\n\n'); } catch (e) { town.streams.delete(s); } });
      req.on('close', () => {
        town.streams.delete(stream);
        town.spectators.connect(token, -1);
        const now = town.presence();
        town.streams.forEach((s) => { try { s.res.write('event: presence\ndata: ' + JSON.stringify(now) + '\n\n'); } catch (e) { town.streams.delete(s); } });
      });
      return undefined;
    }
    if (req.method === 'POST' && p === '/api/hand') {
      const body = await readJSON(req);
      if (!body) return json(res, 400, { ok: false, error: 'bad_json' });
      const r = town.hand(token, body);
      return json(res, r.ok ? 200 : (r.error === 'not_joined' ? 401 : 409), r);
    }
    if (req.method === 'POST' && p === '/api/adopt') {
      const body = await readJSON(req);
      if (!body) return json(res, 400, { ok: false, error: 'bad_json' });
      const id = body.actorId === null ? null : String(body.actorId || '');
      if (id && !town.sim.state.characters[id]) return json(res, 400, { ok: false, error: 'unknown_character' });
      const r = town.spectators.adopt(token, id);
      if (r.ok) { const here = town.presence(); town.streams.forEach((s) => { try { s.res.write('event: presence\ndata: ' + JSON.stringify(here) + '\n\n'); } catch (e) { town.streams.delete(s); } }); }
      return json(res, r.ok ? 200 : 401, r);
    }
    if (req.method === 'POST' && p.startsWith('/api/dev/')) {
      if (!town.clock.dev) return json(res, 404, { ok: false, error: 'not_dev' });
      const cmd = p.slice('/api/dev/'.length);
      if (cmd === 'speed') { const body = await readJSON(req); const r = town.setSpeed(Number(body && body.speed)); return json(res, r.ok ? 200 : 400, r); }
      if (cmd === 'step') { const r = await town.stepOnce(); return json(res, r.ok ? 200 : 409, r); }
      return json(res, 404, { ok: false, error: 'unknown_command' });
    }
    if (req.method === 'POST' && p.startsWith('/api/admin/')) {
      if (!adminToken || req.headers['x-lt-admin'] !== adminToken) return json(res, 403, { ok: false, error: 'not_admin' });
      const cmd = p.slice('/api/admin/'.length);
      if (cmd === 'pause') return json(res, 200, town.pause());
      if (cmd === 'resume') return json(res, 200, town.resume());
      if (cmd === 'save') return json(res, 200, town.save('admin'));
      return json(res, 404, { ok: false, error: 'unknown_command' });
    }
    return json(res, 404, { ok: false, error: 'not_found' });
  });
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const town = createTown(opts);
  const server = createServer(town, opts);
  server.listen(opts.port, opts.host, () => {
    console.log('Living Town: ' + town.origin);
    console.log('  http://' + opts.host + ':' + server.address().port + '/living-town/  (' + opts.speed + 'x: a town minute every ' + Math.round(town.clock.msPerMinute / 100) / 10 + ' s' + (opts.paused ? ', paused' : '') + ')');
    console.log('  data in ' + town.dataDir + (process.env.LT_ADMIN_TOKEN ? '; admin enabled' : '; no LT_ADMIN_TOKEN, admin off') + (opts.dev ? '; --dev: speed controls on the page, do not expose this' : ''));
    town.start();
  });
  function leave(signal) {
    const r = town.stop();
    console.log('saved at ' + r.at + ' on ' + signal);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  }
  process.on('SIGINT', () => leave('SIGINT'));
  process.on('SIGTERM', () => leave('SIGTERM'));
}

module.exports = { createTown, createServer, parseArgs, POLICIES, TOWN_GAP_MINUTES, SAVE_EVERY_MINUTES };
if (require.main === module) main();
