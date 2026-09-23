/* live-server.js — Living Town: the door to the one town, over real HTTP.
 * A server is started on a free port with a fast clock and a scratch data
 * directory. A spectator joins with a name, receives the town as a save and
 * then frames, mirrors it exactly, pays for a circumstance from a purse, is
 * refused when the town has just had one or the purse is short, adopts
 * someone, and sees the page served with the live marker. Admin commands
 * need the token. Saves and the frame log land on disk. No model is called.
 * node living-town/test/live-server.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const http = require('node:http');
process.env.LT_ADMIN_TOKEN = 'test-admin';
const Server = require(path.resolve(__dirname, '..', 'server', 'town-server.js'));
const LT = global.LT, Live = LT.Live;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function request(base, method, p, body, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(p, base);
    const req = http.request({ host: u.hostname, port: u.port, path: u.pathname + u.search, method, headers: Object.assign({ 'content-type': 'application/json' }, headers || {}) }, (res) => {
      let text = '';
      res.on('data', (c) => { text += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text, json: (() => { try { return JSON.parse(text); } catch (e) { return null; } })() }));
    });
    req.on('error', reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

/* A Server-Sent Events reader: events by name, and a way to wait for one. */
function sse(base, p, headers) {
  const u = new URL(p, base);
  const out = { events: [], closed: false, close: null, waitFor: null };
  const waiters = [];
  const req = http.request({ host: u.hostname, port: u.port, path: u.pathname, method: 'GET', headers: headers || {} }, (res) => {
    out.status = res.statusCode;
    let buf = '';
    res.on('data', (c) => {
      buf += c;
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, i); buf = buf.slice(i + 2);
        let event = 'message', data = '';
        block.split('\n').forEach((line) => {
          if (line.startsWith('event: ')) event = line.slice(7);
          else if (line.startsWith('data: ')) data += line.slice(6);
        });
        if (!data) return;
        const ev = { event, data: JSON.parse(data) };
        out.events.push(ev);
        waiters.slice().forEach((w) => { if (w.pred(ev)) { waiters.splice(waiters.indexOf(w), 1); w.resolve(ev); } });
      }
    });
    res.on('end', () => { out.closed = true; });
  });
  req.end();
  out.close = () => req.destroy();
  out.waitFor = (pred, ms) => new Promise((resolve, reject) => {
    const hit = out.events.find(pred);
    if (hit) return resolve(hit);
    const w = { pred, resolve };
    waiters.push(w);
    setTimeout(() => { if (waiters.indexOf(w) >= 0) { waiters.splice(waiters.indexOf(w), 1); reject(new Error('no such event in ' + ms + ' ms')); } }, ms || 3000);
  });
  return out;
}

(async function () {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-live-'));
  const town = Server.createTown({ data: dataDir, speed: 1200, seed: 20260922, paused: false });   // a town minute every 50 ms
  const server = Server.createServer(town, {});
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  town.start();

  console.log('# the door: status is public, the stream needs a name');
  const st = await request(base, 'GET', '/api/town');
  ok(st.status === 200 && st.json.day === 1 && st.json.msPerMinute === 50, 'GET /api/town says day 1 and the clock rate');
  const noName = await request(base, 'POST', '/api/join', { name: '   ' });
  ok(noName.status === 400 && noName.json.error === 'name_required', 'joining without a name is refused');
  const anon = sse(base, '/api/stream');
  await sleep(100);
  ok(anon.status === 401, 'the stream is refused without a name');
  const joined = await request(base, 'POST', '/api/join', { name: 'Ada' });
  const cookie = String(joined.headers['set-cookie'][0]).split(';')[0];
  ok(joined.status === 200 && joined.json.you.name === 'Ada' && joined.json.you.purse === 5 && /HttpOnly/.test(joined.headers['set-cookie'][0]), 'Ada joins with a full purse and an HttpOnly cookie');
  ok(!/lt=/.test(joined.text), 'the token is not in the response body');
  const me = await request(base, 'GET', '/api/me', undefined, { cookie });
  ok(me.status === 200 && me.json.you.name === 'Ada', 'GET /api/me knows her by the cookie');

  console.log('# the stream: a save, then frames, mirrored exactly');
  const s = sse(base, '/api/stream', { cookie });
  const hello = await s.waitFor((e) => e.event === 'hello');
  ok(hello.data.save && hello.data.you.name === 'Ada' && hello.data.msPerMinute === 50 && hello.data.costs.leave_book === 1, 'hello carries the save, who you are, the clock rate and the prices');
  const mirror = Live.mirror(hello.data.save);
  ok(mirror.sim.absMinute() === hello.data.at, 'the mirror stands at the minute of the hello');
  await sleep(1200);
  let applied = 0, failed = null;
  s.events.filter((e) => e.event === 'frame').forEach((e) => { const r = mirror.apply(e.data); if (!r.ok) failed = failed || r; else if (!r.skipped) applied++; });
  ok(!failed && applied >= 15, 'every frame so far applied and matched (' + applied + ')');
  const presence = s.events.filter((e) => e.event === 'presence').pop();
  ok(presence && presence.data.watching === 1 && presence.data.people[0].name === 'Ada', 'presence says one person is watching');

  console.log('# the hand: paid for, attributed, rate-limited');
  const book = await request(base, 'POST', '/api/hand', { id: 'leave_book', answers: { spot: 'park_lawn_w' }, when: 'now' }, { cookie });
  ok(book.status === 200 && book.json.ok && book.json.cost === 1 && book.json.purse === 4 && /^itv_/.test(book.json.record.id), 'a book costs 1; the purse is 4');
  const carried = await s.waitFor((e) => e.event === 'frame' && e.data.itv.length > 0, 2000);
  ok(carried.data.itv[0].id === book.json.record.id && carried.data.itv[0].by === 'Ada', 'the next frame carries the book, by Ada');
  const again = await request(base, 'POST', '/api/hand', { id: 'refund', answers: { who: 'resident_b' } }, { cookie });
  ok(again.status === 409 && again.json.error === 'town_busy' && again.json.purse === 4, 'a second circumstance right away is refused, nothing charged');
  await sleep(Server.TOWN_GAP_MINUTES * 50 + 100);
  const bill = await request(base, 'POST', '/api/hand', { id: 'bill', answers: { who: 'resident_c' } }, { cookie });
  ok(bill.status === 200 && bill.json.purse === 1, 'after the gap a bill costs 3; the purse is 1');
  await sleep(Server.TOWN_GAP_MINUTES * 50 + 100);
  const short = await request(base, 'POST', '/api/hand', { id: 'bill', answers: { who: 'resident_c' } }, { cookie });
  ok(short.status === 409 && short.json.error === 'purse_short' && short.json.purse === 1, 'a purse of 1 cannot pay 3');
  const taken = await request(base, 'POST', '/api/hand', { id: 'leave_book', answers: { spot: 'park_lawn_w' } }, { cookie });
  ok(taken.status === 409 && taken.json.error === 'spot_taken' && taken.json.purse === 1, 'a refused circumstance is refunded');
  const stranger = await request(base, 'POST', '/api/hand', { id: 'leave_book', answers: { spot: 'park_jetty' } });
  ok(stranger.status === 401, 'no cookie, no hand');
  const bo = await request(base, 'POST', '/api/join', { name: 'Bo' });
  const boCookie = String(bo.headers['set-cookie'][0]).split(';')[0];
  ok(bo.json.you.purse === 1, 'Bo, from the same address, shares the purse');

  console.log('# adopting, and the mirror still matching');
  const adopt = await request(base, 'POST', '/api/adopt', { actorId: 'resident_b' }, { cookie });
  ok(adopt.status === 200 && adopt.json.you.adopted === 'resident_b', 'Ada adopts resident_b');
  const seen = await s.waitFor((e) => e.event === 'presence' && e.data.people.some((p) => p.name === 'Ada' && p.adopted === 'resident_b'), 2000);
  ok(!!seen, 'everyone is told');
  const badAdopt = await request(base, 'POST', '/api/adopt', { actorId: 'nobody' }, { cookie });
  ok(badAdopt.status === 400, 'adopting nobody is refused');
  await sleep(600);
  failed = null;
  s.events.filter((e) => e.event === 'frame').forEach((e) => { const r = mirror.apply(e.data); if (!r.ok) failed = failed || r; else if (!r.skipped) applied++; });
  /* The town may have moved a minute since the last frame arrived: the same
   * minute is compared, and every applied frame already matched its fingerprint. */
  const sameMinute = (m) => m.sim.absMinute() !== town.sim.absMinute() || Live.fingerprint(m.sim) === Live.fingerprint(town.sim);
  ok(!failed && sameMinute(mirror) && mirror.attributions[book.json.record.id] === 'Ada',
     'after the book, the bill and ' + applied + ' frames the mirror is the town, and knows who left the book');

  console.log('# a late joiner is handed the attributions');
  const t2 = sse(base, '/api/stream', { cookie: boCookie });
  const hello2 = await t2.waitFor((e) => e.event === 'hello');
  ok(hello2.data.attributions[book.json.record.id] === 'Ada' && hello2.data.presence.watching === 2, 'Bo\'s hello names Ada for the book and counts two watching');
  const mirror2 = Live.mirror(hello2.data.save);
  await sleep(400);
  failed = null;
  t2.events.filter((e) => e.event === 'frame').forEach((e) => { const r = mirror2.apply(e.data); if (!r.ok) failed = failed || r; });
  ok(!failed && mirror2.applied > 0 && sameMinute(mirror2), 'Bo\'s mirror matches too (' + mirror2.applied + ' frames)');
  t2.close();

  console.log('# the page, and what is not served');
  const page = await request(base, 'GET', '/living-town/');
  ok(page.status === 200 && page.text.indexOf('<meta name="lt-live" content="/api">') > 0 && page.text.indexOf('js/lt-live-client.js') > 0, 'the page is served with the live marker and the live client');
  const plain = await request(base, 'GET', '/living-town/js/lt-live.js');
  ok(plain.status === 200 && /text\/javascript/.test(plain.headers['content-type']), 'scripts are served');
  const engine = await request(base, 'GET', '/engine/ember-pixel.js');
  ok(engine.status === 200, 'the engine next door is served');
  const secret = await request(base, 'GET', '/living-town/server/town-server.js');
  const data = await request(base, 'GET', '/living-town/data/town.json');
  const up = await request(base, 'GET', '/living-town/../package.json');
  ok(secret.status === 404 && data.status === 404 && up.status === 404, 'the server, the data and anything above the root are not');

  console.log('# admin');
  const noAdmin = await request(base, 'POST', '/api/admin/pause');
  ok(noAdmin.status === 403, 'pause without the admin token is refused');
  const paused = await request(base, 'POST', '/api/admin/pause', {}, { 'x-lt-admin': 'test-admin' });
  ok(paused.status === 200 && paused.json.paused === true, 'pause with it works');
  const absPaused = town.sim.absMinute();
  await sleep(300);
  ok(town.sim.absMinute() === absPaused, 'the clock stood still');
  const resumed = await request(base, 'POST', '/api/admin/resume', {}, { 'x-lt-admin': 'test-admin' });
  await sleep(300);
  ok(resumed.json.paused === false && town.sim.absMinute() > absPaused, 'and moved again after resume');

  console.log('# --dev only: pace and step from outside');
  const noDev = await request(base, 'POST', '/api/dev/speed', { speed: 60 });
  ok(noDev.status === 404 && town.status().dev === false, 'without --dev the pace endpoints do not exist');
  const devTown = Server.createTown({ data: fs.mkdtempSync(path.join(os.tmpdir(), 'lt-dev-')), speed: 1200, seed: 1, paused: true, dev: true });
  const devServer = Server.createServer(devTown, {});
  await new Promise((r) => devServer.listen(0, '127.0.0.1', r));
  const devBase = 'http://127.0.0.1:' + devServer.address().port;
  devTown.start();
  const devAbs = devTown.sim.absMinute();
  const stepped = await request(devBase, 'POST', '/api/dev/step', {});
  ok(stepped.status === 200 && stepped.json.abs === devAbs + 1 && devTown.clock.paused, 'a step moves one minute and leaves the town paused');
  const faster = await request(devBase, 'POST', '/api/dev/speed', { speed: 600 });
  ok(faster.status === 200 && faster.json.msPerMinute === 100 && faster.json.paused === false, 'a speed unpauses and sets the pace');
  await sleep(450);
  ok(devTown.sim.absMinute() >= devAbs + 3, 'and the town moves at it');
  const bad = await request(devBase, 'POST', '/api/dev/speed', { speed: -1 });
  ok(bad.status === 400, 'a nonsense speed is refused');
  devTown.stop(); await new Promise((r) => devServer.close(r));
  fs.rmSync(devTown.dataDir, { recursive: true, force: true });

  console.log('# on disk');
  s.close();
  const stopped = town.stop();
  await new Promise((r) => server.close(r));
  const saved = JSON.parse(fs.readFileSync(path.join(dataDir, 'town.json'), 'utf8'));
  ok(saved.state.day === town.sim.state.day && saved.state.minute === town.sim.state.minute, 'town.json is the town as it stopped (' + stopped.at + ')');
  const lines = fs.readFileSync(path.join(dataDir, 'frames.jsonl'), 'utf8').trim().split('\n');
  ok(lines.length === town.host.frames && JSON.parse(lines[lines.length - 1]).abs === town.sim.absMinute(), 'frames.jsonl has one line per frame (' + lines.length + ')');
  const people = JSON.parse(fs.readFileSync(path.join(dataDir, 'spectators.json'), 'utf8'));
  ok(people.spectators.length === 2 && people.spectators.every((p) => p.name === 'Ada' || p.name === 'Bo'), 'spectators.json keeps the two names');
  const resumedTown = Server.createTown({ data: dataDir, speed: 1200, paused: true });
  ok(resumedTown.sim.absMinute() === town.sim.absMinute() && /resumed/.test(resumedTown.origin) && resumedTown.spectators.get(cookie.slice(3)) !== null,
     'a server started on that directory resumes the town and still knows Ada');
  fs.rmSync(dataDir, { recursive: true, force: true });

  console.log('# ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
