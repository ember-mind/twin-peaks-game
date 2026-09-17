#!/usr/bin/env node
'use strict';

/* test/harness-ready-race.js — TP-RETRO-READY must be trustworthy.
 *
 * test/retro-scene.html used to declare READY on a fixed timer, independent of
 * whether the requested scene had actually been painted. Chrome gates inherited
 * the flake (props-depth-chrome.js had to reject-and-recapture title-card frames).
 * This opens the page in Chrome many times in a row and demands that the first
 * capture after READY is always the same frame, and that the frozen clock cannot
 * produce a blank frame.
 *
 * Case 1 — READY is the requested scene, deterministically:
 *   capture a reference at ?freezeMs=1000, then RUNS more; every one must be
 *   byte-identical to the reference. Two guards keep that from passing
 *   vacuously: the reference must be non-blank, and the SAME clock for two
 *   DIFFERENT maps must produce DIFFERENT frames (the title card is shared by
 *   both, a real scene is not).
 * Case 2 — ?freezeMs=0 still paints:
 *   a clock pinned to 0 used to leave lastTick at 0 so js/engine.js never ticked
 *   and the shot was the flat page background (3146 bytes). The harness clamps
 *   the frozen clock to a minimum; this asserts a painted frame.
 *
 * Chrome drivers run one at a time (spawnSync). Nothing under the repo is
 * written: every capture lands in a temp dir.
 */

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawnSync, spawn } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const CAPTURE = path.join(REPO, 'test', 'capture-chrome.js');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE = 'test/retro-scene.html';
const FREEZE_MS = 1000;
const RUNS = 20;
const SHOT_W = 960, SHOT_H = 640;
const BLANK_BYTES = 3146;          // the flat background PNG observed before the freezeMs fix
const BACKGROUND = '17,25,19';     // #111913
let pass = 0;
function ok(condition, label) { assert.ok(condition, label); pass++; }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-harness-ready-'));
let server = null;
function serve() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const port = 18000 + Math.floor(Math.random() * 40000);
    const child = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', REPO], { stdio: 'ignore' });
    child.unref();
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) break;
      const probe = spawnSync('curl', ['-fsS', '-o', '/dev/null', 'http://127.0.0.1:' + port + '/' + PAGE], { encoding: 'utf8' });
      if (probe.status === 0) { server = child; return port; }
    }
    try { child.kill(); } catch (e) { /* already gone */ }
  }
  throw new Error('no server came up for ' + REPO);
}
process.on('exit', function () {
  if (server) { try { server.kill(); } catch (e) { /* already gone */ } }
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* best effort */ }
});

const PORT = serve();
function capture(query, freezeMs, name) {
  const url = 'http://127.0.0.1:' + PORT + '/' + PAGE + '?' + query + '&freezeMs=' + freezeMs;
  const out = path.join(TMP, name + '.png');
  const r = spawnSync(process.execPath, [CAPTURE, '--chrome=' + CHROME, '--url=' + url, '--output=' + out,
    '--width=' + SHOT_W, '--height=' + SHOT_H, '--ready-prefix=TP-RETRO-READY', '--timeout-ms=25000', '--gpu=swiftshader'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('capture failed for ' + name + '\n' + (r.stdout || '') + (r.stderr || ''));
  return fs.readFileSync(out);
}
function sha(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }

/* Minimal PNG decoder: enough to read the 8-bit RGB(A) canvas captures. */
function decodePng(file) {
  const buf = fs.readFileSync(file);
  let offset = 8, width = 0, height = 0, colorType = 0;
  let idat = Buffer.alloc(0);
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.slice(offset + 8, offset + 8 + length);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === 'IDAT') idat = Buffer.concat([idat, data]);
    else if (type === 'IEND') break;
    offset += 12 + length;
  }
  const raw = zlib.inflateSync(idat);
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.slice(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const prev = y ? out.slice((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      out[y * stride + x] = v & 255;
    }
  }
  return { width, height, bpp, buf: out };
}
function nonBackgroundPixels(file) {
  const img = decodePng(file);
  let count = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * img.bpp;
      if ((img.buf[i] + ',' + img.buf[i + 1] + ',' + img.buf[i + 2]) !== BACKGROUND) count++;
    }
  }
  return count;
}

/* Same query the flaky Chrome gates use (props-depth-chrome.js), in particular
 * suppressOnEnter=0: entering without the intro flag is where READY used to
 * land before the scene. */
const COMMON = '&seed=104729&season=summer&frame=0&frames=1&stepMs=100&motion=idle&suppressOnEnter=0';
const ROADHOUSE = 'map=roadhouse&x=7&y=8&dir=down' + COMMON;
const REDROOM = 'map=redroom&x=8&y=10&dir=up' + COMMON;

/* ---- case 1: every READY capture is the same requested scene ---- */
const reference = capture(ROADHOUSE, FREEZE_MS, 'ref');
ok(reference.length > BLANK_BYTES, 'reference after READY is not the blank frame (' + reference.length + ' bytes)');
const referenceRedroom = capture(REDROOM, FREEZE_MS, 'ref-redroom');
ok(!reference.equals(referenceRedroom),
  'READY frame is the requested scene, not the title card shared by every map');

let mismatches = 0;
for (let run = 1; run <= RUNS; run++) {
  const shot = capture(ROADHOUSE, FREEZE_MS, 'run-' + run);
  if (!shot.equals(reference)) {
    mismatches++;
    console.log('  run ' + run + ' differs: ' + shot.length + ' bytes, sha ' + sha(shot).slice(0, 12));
  }
}
ok(mismatches === 0, 'all ' + RUNS + ' captures after READY are byte-identical to the reference (' + mismatches + ' differ)');
console.log('  ' + RUNS + ' READY captures, reference sha ' + sha(reference).slice(0, 12) + ', ' + reference.length + ' bytes');

/* ---- case 2: ?freezeMs=0 still paints ---- */
const frozenZero = path.join(TMP, 'freeze-0.png');
const zeroUrl = 'http://127.0.0.1:' + PORT + '/' + PAGE + '?' + ROADHOUSE + '&freezeMs=0';
const zeroRun = spawnSync(process.execPath, [CAPTURE, '--chrome=' + CHROME, '--url=' + zeroUrl, '--output=' + frozenZero,
  '--width=' + SHOT_W, '--height=' + SHOT_H, '--ready-prefix=TP-RETRO-READY', '--timeout-ms=25000', '--gpu=swiftshader'],
{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (zeroRun.status !== 0) throw new Error('capture failed for freezeMs=0\n' + (zeroRun.stdout || '') + (zeroRun.stderr || ''));
const zeroBytes = fs.readFileSync(frozenZero);
ok(zeroBytes.length > BLANK_BYTES, '?freezeMs=0 paints more than the blank frame (' + zeroBytes.length + ' bytes)');
const painted = nonBackgroundPixels(frozenZero);
ok(painted >= 100, '?freezeMs=0 paints at least 100 non-background pixels (' + painted + ')');

console.log('HARNESS-READY-RACE-PASS ' + pass + ' checks, ' + RUNS + ' captures, freezeMs=0 painted ' + painted + ' px');
