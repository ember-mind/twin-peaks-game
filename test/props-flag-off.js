#!/usr/bin/env node
'use strict';

/* test/props-flag-off.js — the prop layer is still a switch, and turning it off still leaves a coherent room.
 *
 * Until M12 this test pinned "flag off renders exactly as before M9". M12 made the props the Roadhouse furniture
 * and stripped the duplicates out of js/roadhouse-art.js, so the flag now defaults to TRUE and there is nothing
 * pre-M9 to be identical to. What is still worth pinning, and is what this test now proves:
 *
 *   A  this tree with the flag FORCED OFF — the painted shell on its own
 *   B  a copy with the prop layer deleted outright (both <script> tags and js/props*.js gone)
 *        A == B, byte for byte: with the flag off the prop layer contributes nothing at all
 *   C  this tree as it ships (the flag is on) — it must DIFFER from A, or the switch does nothing
 *   D  this tree with the flag FORCED ON — it must equal C, i.e. the shipped default really is on
 *
 * Every shot uses test/retro-scene.html's ?freezeMs= clock: the live Roadhouse animates, and two unfrozen
 * captures of it differ from each other, let alone across trees.
 *
 * Chrome flags are the mandatory ones from test/shot.sh, passed through test/capture-chrome.js
 * (--headless=new --enable-unsafe-swiftshader --use-angle=swiftshader via --gpu=swiftshader); without them WebGL
 * fails silently and every shot is the same black frame — which the C check catches.
 * Nothing under the repo is written: every shot and every copy lands in a temp dir.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync, spawn } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const CAPTURE = path.join(REPO, 'test', 'capture-chrome.js');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE_REL = 'test/retro-scene.html';
const CAMERA = { map: 'roadhouse', x: 7, y: 6, dir: 'up' };
const FREEZE_MS = 1000;
let pass = 0;
function ok(cond, label, detail) { assert.ok(cond, label + (detail ? ' :: ' + detail : '')); pass++; }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-props-flag-off-'));
const SERVERS = [];
const WORKTREES = [];
function cleanup() {
  SERVERS.forEach((p) => { try { p.kill(); } catch (e) { /* already gone */ } });
  WORKTREES.forEach((w) => spawnSync('git', ['-C', REPO, 'worktree', 'remove', '--force', w], { encoding: 'utf8' }));
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* best effort */ }
}
process.on('exit', cleanup);

// One server per root, on a port derived as test/shot.sh does; a port already taken just fails to come up and the
// next candidate is tried.
let nextPort = 18000 + (process.pid % 20000);
function serve(root) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const port = 18000 + ((nextPort++) % 40000);
    const p = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', root], { stdio: 'ignore' });
    p.unref(); // a live child handle would keep this process alive after the last assertion
    SERVERS.push(p);
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      if (p.exitCode !== null) break; // port taken: python3 exited
      if (spawnSync('curl', ['-fsS', '-o', '/dev/null', 'http://127.0.0.1:' + port + '/' + PAGE_REL], { encoding: 'utf8' }).status === 0) return port;
    }
    try { p.kill(); } catch (e) { /* already gone */ }
  }
  throw new Error('no server came up for ' + root);
}
function shot(root, name) {
  const port = serve(root);
  const url = 'http://127.0.0.1:' + port + '/' + PAGE_REL +
    '?map=' + CAMERA.map + '&x=' + CAMERA.x + '&y=' + CAMERA.y + '&dir=' + CAMERA.dir +
    '&seed=104729&season=summer&frame=0&frames=1&stepMs=100&motion=idle&suppressOnEnter=0&freezeMs=' + FREEZE_MS;
  const out = path.join(TMP, name + '.png');
  const r = spawnSync(process.execPath, [CAPTURE, '--chrome=' + CHROME, '--url=' + url, '--output=' + out,
    '--width=960', '--height=640', '--ready-prefix=TP-RETRO-READY', '--timeout-ms=25000', '--gpu=swiftshader'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('capture failed for ' + name + '\n' + (r.stdout || '') + (r.stderr || ''));
  return fs.readFileSync(out);
}
/* The baseline gets this branch's harness page minus the prop <script> tags: same frozen clock, no prop layer. */
const PAGE = fs.readFileSync(path.join(REPO, PAGE_REL), 'utf8');
const PAGE_NO_PROPS = PAGE.split('\n').filter((l) => !/js\/props(\.gen|-production)\.js/.test(l)).join('\n');
/* Only what the page loads: the repo also carries ~400MB of artifacts and git objects no capture touches. */
const PAGE_DIRS = ['js', 'test', 'assets', 'world', 'narrative'];
function copyTree(name) {
  const root = path.join(TMP, name);
  fs.mkdirSync(root);
  PAGE_DIRS.forEach((d) => fs.cpSync(path.join(REPO, d), path.join(root, d), { recursive: true }));
  fs.copyFileSync(path.join(REPO, 'index.html'), path.join(root, 'index.html'));
  return root;
}

ok(/props\.gen\.js/.test(PAGE) && /props-production\.js/.test(PAGE), PAGE_REL + ' registers the prop layer');
ok(/freezeMs/.test(PAGE), PAGE_REL + ' has the frozen-clock harness mode the byte-compare needs');
ok(PAGE_NO_PROPS !== PAGE, 'the baseline page differs from this one only by the prop script tags');
ok(/PROPS_ENABLED = true/.test(PAGE) && /PROPS_ENABLED = true/.test(fs.readFileSync(path.join(REPO, 'index.html'), 'utf8')),
  'M12: the flag ships ON in index.html and in ' + PAGE_REL);

/* Forcing the flag: the page sets it true before js/props-production.js runs, so a forced value has to replace
 * that line rather than precede it. */
const force = (value) => PAGE.replace(/window\.GAME\.PROPS_ENABLED = true;/, 'window.GAME.PROPS_ENABLED = ' + value + ';');
ok(force(false) !== PAGE && /PROPS_ENABLED = false/.test(force(false)), 'the harness can force the flag off');

// ---- A: this tree with the flag FORCED OFF -------------------------------------------------------------------
const OFF_ROOT = copyTree('flagoff');
fs.writeFileSync(path.join(OFF_ROOT, PAGE_REL), force(false));
const A = shot(OFF_ROOT, 'a');
ok(A.length > 0, 'shot A (flag forced off) captured (' + A.length + ' bytes)');
{
  const again = shot(OFF_ROOT, 'a2');
  ok(A.equals(again), 'the frozen capture is reproducible: two runs of A are byte-identical', A.length + ' vs ' + again.length);
}

// ---- B: a copy of this tree with the prop layer removed outright -------------------------------------------
{
  const root = copyTree('stripped');
  fs.writeFileSync(path.join(root, PAGE_REL), PAGE_NO_PROPS.replace(/.*PROPS_ENABLED.*\n/, ''));
  fs.rmSync(path.join(root, 'js', 'props.gen.js'));
  fs.rmSync(path.join(root, 'js', 'props-production.js'));
  const B = shot(root, 'b1');
  ok(A.equals(B), 'flag off: byte-identical to a tree with no prop layer at all (' + A.length + ' vs ' + B.length + ' bytes)');
}

// ---- C: the page as it ships, and D: the same thing forced on ------------------------------------------------
{
  const C = shot(REPO, 'c');
  ok(!A.equals(C), 'the shipped page DIFFERS from the flag-off shell, so the switch does something (' + A.length + ' vs ' + C.length + ' bytes)');
  const root = copyTree('flagon');
  fs.writeFileSync(path.join(root, PAGE_REL), force(true));
  const D = shot(root, 'd');
  ok(C.equals(D), 'the shipped default is the flag ON (' + C.length + ' vs ' + D.length + ' bytes)');
}

ok(fs.readFileSync(path.join(REPO, PAGE_REL), 'utf8') === PAGE, 'the repo page is untouched');
console.log('PROPS-FLAG-OFF-PASS ' + pass + ' checks, roadhouse ' + CAMERA.x + ',' + CAMERA.y + ' ' + CAMERA.dir + ', ' + A.length + ' byte shot');
