#!/usr/bin/env node
'use strict';

/* test/props-flag-off.js — with GAME.PROPS_ENABLED false (the default), the Roadhouse renders exactly as it did
 * before M9. Proof: headless Chrome shots of the same camera, byte-compared.
 *
 *   A  this tree, which registers js/props.gen.js + js/props-production.js in test/retro-scene.html
 *   B  the baseline without the prop layer:
 *        - a git worktree of `main` when git and the ref are available ("a shot from main"), and
 *        - always, a copy of this tree with the two <script> tags and js/props*.js removed, so the test keeps
 *          proving something once main carries M9 too.
 *   C  this tree with the flag forced ON — it must DIFFER, otherwise A == B would pass for the wrong reason.
 *
 * Both baselines are given this branch's test/retro-scene.html (minus the two prop <script> tags), because the
 * byte-compare needs its ?freezeMs= clock: the live Roadhouse animates, and two unfrozen captures of it differ
 * from each other, let alone across trees. That page difference is the ONLY one between A and B.
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

// ---- A: this tree, flag at its default ---------------------------------------------------------------------
const A = shot(REPO, 'a');
ok(A.length > 0, 'shot A captured (' + A.length + ' bytes)');
{
  const again = shot(REPO, 'a2');
  ok(A.equals(again), 'the frozen capture is reproducible: two runs of A are byte-identical', A.length + ' vs ' + again.length);
}

// ---- B1: a copy of this tree with the prop layer removed ---------------------------------------------------
{
  const root = copyTree('stripped');
  fs.writeFileSync(path.join(root, PAGE_REL), PAGE_NO_PROPS);
  fs.rmSync(path.join(root, 'js', 'props.gen.js'));
  fs.rmSync(path.join(root, 'js', 'props-production.js'));
  const B = shot(root, 'b1');
  ok(A.equals(B), 'flag off: byte-identical to a tree with no prop layer at all (' + A.length + ' vs ' + B.length + ' bytes)');
}

// ---- B2: a git worktree of main ------------------------------------------------------------------------------
{
  const rev = spawnSync('git', ['-C', REPO, 'rev-parse', '--verify', 'main'], { encoding: 'utf8' });
  if (rev.status !== 0) {
    console.log('props-flag-off: no `main` ref, skipping the worktree comparison');
  } else {
    const root = path.join(TMP, 'main-tree');
    const add = spawnSync('git', ['-C', REPO, 'worktree', 'add', '--detach', root, 'main'], { encoding: 'utf8' });
    if (add.status !== 0) throw new Error('git worktree add failed\n' + add.stdout + add.stderr);
    WORKTREES.push(root);
    fs.writeFileSync(path.join(root, PAGE_REL), PAGE_NO_PROPS);
    const B = shot(root, 'b2');
    ok(A.equals(B), 'flag off: byte-identical to a shot from main (' + rev.stdout.trim().slice(0, 7) + ', ' + A.length + ' vs ' + B.length + ' bytes)');
  }
}

// ---- C: the comparison is not vacuous ------------------------------------------------------------------------
{
  const root = copyTree('flagon');
  const page = path.join(root, PAGE_REL);
  fs.writeFileSync(page, PAGE.replace('<script src="../js/props.gen.js"></script>',
    '<script>window.GAME = window.GAME || {}; window.GAME.PROPS_ENABLED = true;</script>\n<script src="../js/props.gen.js"></script>'));
  const C = shot(root, 'c');
  ok(!A.equals(C), 'flag on: the shot DIFFERS, so the byte-compare above is not vacuous (' + A.length + ' vs ' + C.length + ' bytes)');
}

ok(fs.readFileSync(path.join(REPO, PAGE_REL), 'utf8') === PAGE, 'the repo page is untouched');
console.log('PROPS-FLAG-OFF-PASS ' + pass + ' checks, roadhouse ' + CAMERA.x + ',' + CAMERA.y + ' ' + CAMERA.dir + ', ' + A.length + ' byte shot');
