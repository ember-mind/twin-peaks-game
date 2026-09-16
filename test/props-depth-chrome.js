#!/usr/bin/env node
'use strict';

/* test/props-depth-chrome.js — props interleave with actors in the REAL browser, not just in the unit harness.
 *
 * Camera: the Roadhouse, prop flag ON, ?freezeMs so the frame is reproducible. Three captures, all with the same
 * camera (the map is smaller than the viewport, so it never scrolls):
 *
 *   REF    Cooper parked away from the table          -> the table, unoccluded
 *   NORTH  the tile whose foot y is one row NORTH of  -> his foot y is SMALLER than the table's anchor foot,
 *          the table's anchor foot                       so the table must draw OVER him
 *   SOUTH  the tile whose foot y is one row SOUTH of  -> his foot y is GREATER, so he must draw OVER the table
 *          it (see COOPER_SPRITE_H for why that is
 *          the anchor tile itself, not the one below)
 *
 * Every coordinate is computed from world/props.json (the atlas frame and anchor of roadhouse-table-01) and from
 * the map size — none of it is read off a screenshot by eye. The sample points are the pixels where Cooper's
 * sprite box and the table's frame overlap, which is a different strip in each case.
 *
 * Asserted:
 *   NORTH == REF at the north samples                 the table is intact, Cooper is behind it
 *   NORTH != NORTH-with-props-off at the same samples the samples really are pixels Cooper would paint, so the
 *                                                     first assertion is not vacuous
 *   SOUTH != REF at the south samples                 Cooper is painted over the table
 *
 * Chrome flags are the mandatory ones from test/shot.sh, via test/capture-chrome.js --gpu=swiftshader.
 * The repo is never written: the flag-on tree and every capture live in a temp dir.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawnSync, spawn } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const CAPTURE = path.join(REPO, 'test', 'capture-chrome.js');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE_REL = 'test/retro-scene.html';
const SCENE = 'roadhouse';
const INSTANCE = 'roadhouse-table-01';
const FREEZE_MS = 1000;
const SHOT_W = 960, SHOT_H = 640;
const NATIVE_W = 256, NATIVE_H = 192, TILE = 16;
let pass = 0;
function ok(cond, label, detail) { assert.ok(cond, label + (detail ? ' :: ' + detail : '')); pass++; }

// ---- geometry, all derived ---------------------------------------------------------------------------------
const REG = JSON.parse(fs.readFileSync(path.join(REPO, 'world', 'props.json'), 'utf8'));
const inst = REG.instances[INSTANCE];
const def = REG.definitions[inst.propId];
ok(!!inst && !!def, INSTANCE + ' and its definition are in world/props.json');
ok(inst.sceneId === SCENE, INSTANCE + ' is in the ' + SCENE + ' scene');

// js/props-production.js originOf(): the anchor names the foot, the frame hangs off it.
const TABLE = {
  left: Math.round(inst.tx * TILE) - def.anchor[0] + (inst.ox || 0),
  top: Math.round(inst.ty * TILE) - def.anchor[1] + (inst.oy || 0),
  w: def.frame[2],
  h: def.frame[3],
  foot: Math.round(inst.ty * TILE),
  tileX: Math.floor(inst.tx),
  tileY: Math.floor(inst.ty)
};
TABLE.right = TABLE.left + TABLE.w;
TABLE.bottom = TABLE.top + TABLE.h;

/* The engine draws an actor's 16px cell with its TOP at y * TILE and its foot at (y + 1) * TILE, and the sprite
 * rises COOPER_SPRITE_H above that foot (24px, measured: the bounding box of the pixels that change when Cooper
 * moves between two tiles, with the props off, is exactly 24 rows tall above his foot).
 *
 * NORTH and SOUTH are the two tiles whose FOOT Y straddles the table's anchor foot — one row north of it and one
 * row south of it on the foot-y axis, which is the axis under test. They are the anchor tile's northern
 * neighbour and the anchor tile itself: a table 22px tall anchored at foot 102 is simply not reached by an actor
 * standing a whole tile further south (his sprite starts at 128 - 24 = 104, the table's last row), so the tile
 * below the anchor tile has no pixels to compare and cannot show occlusion either way. */
const COOPER_SPRITE_H = 24;
const COOPER_X = TABLE.tileX;
const footOf = (ty) => (ty + 1) * TILE;
const NORTH_Y = TABLE.tileY - 1;
const SOUTH_Y = TABLE.tileY;
const REF_XY = [TABLE.tileX + 6, TABLE.tileY + 2]; // far enough east and south to touch none of the samples
ok(footOf(NORTH_Y) < TABLE.foot && footOf(SOUTH_Y) > TABLE.foot,
  'the two tiles straddle the table anchor foot (' + footOf(NORTH_Y) + ' < ' + TABLE.foot + ' < ' + footOf(SOUTH_Y) + ')');

/* Sample points: inside the table frame AND inside the actor's sprite box, insetting 4px from the frame edges so
 * a transparent margin of the round table is never sampled. The sprite box of the tile at (COOPER_X, ty) is
 * x [COOPER_X*16, +16), y [foot - COOPER_SPRITE_H, foot). */
function samplesFor(ty) {
  const x0 = Math.max(TABLE.left + 4, COOPER_X * TILE + 4);
  const x1 = Math.min(TABLE.right - 4, COOPER_X * TILE + TILE - 4);
  const y0 = Math.max(TABLE.top + 4, footOf(ty) - COOPER_SPRITE_H);
  const y1 = Math.min(TABLE.bottom - 2, footOf(ty));
  assert.ok(x1 > x0 && y1 > y0, 'row ' + ty + ' does not overlap the table frame');
  const xs = [x0, x1 - 1], ys = [y0, y1 - 1];
  const out = [];
  xs.forEach((x) => ys.forEach((y) => out.push([x, y])));
  return out;
}
const SAMPLES_NORTH = samplesFor(NORTH_Y);
const SAMPLES_SOUTH = samplesFor(SOUTH_Y);
ok(SAMPLES_NORTH.length === 4 && SAMPLES_SOUTH.length === 4, '4 sample pixels per case');
ok(JSON.stringify(SAMPLES_NORTH) !== JSON.stringify(SAMPLES_SOUTH), 'the two cases sample different strips of the frame');

/* Page transform: the harness fits the 256x192 canvas into the window at an integer scale and centres it, and the
 * engine centres a map smaller than the viewport, so a scene pixel maps to a SCALE x SCALE block. */
const SCALE = Math.max(1, Math.floor(Math.min(SHOT_W / NATIVE_W, SHOT_H / NATIVE_H)));
const STAGE_X = Math.floor((SHOT_W - NATIVE_W * SCALE) / 2);
const STAGE_Y = Math.floor((SHOT_H - NATIVE_H * SCALE) / 2);
const MAP_H = 10 * TILE; // js/roadhouse-scene.js authored rows
const CAM_Y = -Math.floor((NATIVE_H - MAP_H) / 2);
const toShot = (sx, sy) => [STAGE_X + (sx) * SCALE + 1, STAGE_Y + (sy - CAM_Y) * SCALE + 1];

// ---- minimal PNG reader (zlib only; capture-chrome writes 8-bit RGB/RGBA) ----------------------------------
function readPng(file) {
  const b = fs.readFileSync(file);
  if (b.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(file + ' is not a PNG');
  let i = 8, w = 0, h = 0, depth = 0, ctype = 0;
  const idat = [];
  while (i < b.length) {
    const len = b.readUInt32BE(i), type = b.slice(i + 4, i + 8).toString('ascii'), data = b.slice(i + 8, i + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    i += 12 + len;
  }
  if (depth !== 8 || (ctype !== 6 && ctype !== 2)) throw new Error('unsupported PNG (depth ' + depth + ', colour type ' + ctype + ')');
  const ch = ctype === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch;
  const out = Buffer.alloc(h * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0, up = prev[x], c = x >= ch ? prev[x - ch] : 0, v = line[x];
      let val;
      if (f === 0) val = v;
      else if (f === 1) val = v + a;
      else if (f === 2) val = v + up;
      else if (f === 3) val = v + ((a + up) >> 1);
      else {
        const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c);
        val = v + (pa <= pb && pa <= pc ? a : pb <= pc ? up : c);
      }
      cur[x] = val & 255;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return { w: w, h: h, at: function (x, y) { const o = y * stride + x * ch; return out[o] + ',' + out[o + 1] + ',' + out[o + 2]; } };
}
const sample = (img, pts) => pts.map((p) => img.at.apply(img, toShot(p[0], p[1])));

/* The harness sometimes declares itself ready while the title card is still on screen (a race in
 * test/retro-scene.html between GAME.Engine.start and prepareScene — out of this milestone's fence). The title
 * card is a green outdoor illustration and the Roadhouse interior is a dark room, so a frame is rejected and
 * recaptured when green-dominant pixels are anything but rare. Measured: 0.587 on the title card, 0.008 on the
 * Roadhouse. */
const GREEN_MAX = 0.1;
function greenFraction(img) {
  let n = 0, t = 0;
  for (let y = 0; y < img.h; y += 3) {
    for (let x = 0; x < img.w; x += 3) {
      const p = img.at(x, y).split(',');
      t++;
      if (+p[1] > +p[0] + 20) n++;
    }
  }
  return n / t;
}

// ---- trees and servers -------------------------------------------------------------------------------------
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-props-depth-'));
const SERVERS = [];
process.on('exit', function () {
  SERVERS.forEach((p) => { try { p.kill(); } catch (e) { /* already gone */ } });
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* best effort */ }
});
const PAGE_DIRS = ['js', 'test', 'assets', 'world', 'narrative'];
function copyTree(name, mutatePage) {
  const root = path.join(TMP, name);
  fs.mkdirSync(root);
  PAGE_DIRS.forEach((d) => fs.cpSync(path.join(REPO, d), path.join(root, d), { recursive: true }));
  fs.copyFileSync(path.join(REPO, 'index.html'), path.join(root, 'index.html'));
  const page = path.join(root, PAGE_REL);
  if (mutatePage) fs.writeFileSync(page, mutatePage(fs.readFileSync(page, 'utf8')));
  return root;
}
let nextPort = 18000 + (process.pid % 20000);
function serve(root) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const port = 18000 + ((nextPort++) % 40000);
    const p = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', root], { stdio: 'ignore' });
    p.unref();
    SERVERS.push(p);
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      if (p.exitCode !== null) break;
      if (spawnSync('curl', ['-fsS', '-o', '/dev/null', 'http://127.0.0.1:' + port + '/' + PAGE_REL], { encoding: 'utf8' }).status === 0) return port;
    }
    try { p.kill(); } catch (e) { /* already gone */ }
  }
  throw new Error('no server came up for ' + root);
}
const FLAG_ON = (html) => html.replace('<script src="../js/props.gen.js"></script>',
  '<script>window.GAME = window.GAME || {}; window.GAME.PROPS_ENABLED = true;</script>\n<script src="../js/props.gen.js"></script>');

const onPort = serve(copyTree('flag-on', FLAG_ON));
const offPort = serve(copyTree('flag-off', null));

function shot(port, x, y, name) {
  const url = 'http://127.0.0.1:' + port + '/' + PAGE_REL +
    '?map=' + SCENE + '&x=' + x + '&y=' + y + '&dir=down&seed=104729&season=summer' +
    '&frame=0&frames=1&stepMs=100&motion=idle&suppressOnEnter=0&freezeMs=' + FREEZE_MS;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const out = path.join(TMP, name + '.png');
    const r = spawnSync(process.execPath, [CAPTURE, '--chrome=' + CHROME, '--url=' + url, '--output=' + out,
      '--width=' + SHOT_W, '--height=' + SHOT_H, '--ready-prefix=TP-RETRO-READY', '--timeout-ms=25000', '--gpu=swiftshader'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) throw new Error('capture failed for ' + name + '\n' + (r.stdout || '') + (r.stderr || ''));
    const img = readPng(out);
    const green = greenFraction(img);
    if (green <= GREEN_MAX) { img.green = green; return img; }
    if (attempt === 6) throw new Error(name + ': the harness kept declaring ready on the title card (green ' + green.toFixed(3) + ')');
  }
  throw new Error('unreachable');
}

const REF = shot(onPort, REF_XY[0], REF_XY[1], 'ref');
const NORTH = shot(onPort, COOPER_X, NORTH_Y, 'north');
const SOUTH = shot(onPort, COOPER_X, SOUTH_Y, 'south');
const NORTH_NO_PROPS = shot(offPort, COOPER_X, NORTH_Y, 'north-no-props');
ok([REF, NORTH, SOUTH, NORTH_NO_PROPS].every((i) => i.w === SHOT_W && i.h === SHOT_H), 'four captures at ' + SHOT_W + 'x' + SHOT_H);

const refNorth = sample(REF, SAMPLES_NORTH);
const gotNorth = sample(NORTH, SAMPLES_NORTH);
const offNorth = sample(NORTH_NO_PROPS, SAMPLES_NORTH);
const refSouth = sample(REF, SAMPLES_SOUTH);
const gotSouth = sample(SOUTH, SAMPLES_SOUTH);

ok(JSON.stringify(gotNorth) === JSON.stringify(refNorth),
  'NORTH: the table draws over Cooper — every sample is the unoccluded table pixel',
  SAMPLES_NORTH.map((p, i) => p.join(',') + ' ref ' + refNorth[i] + ' got ' + gotNorth[i]).join(' | '));
ok(offNorth.some((v, i) => v !== gotNorth[i]),
  'NORTH is not vacuous: with the props off, Cooper paints those same pixels',
  SAMPLES_NORTH.map((p, i) => p.join(',') + ' props-off ' + offNorth[i] + ' props-on ' + gotNorth[i]).join(' | '));
ok(gotSouth.every((v, i) => v !== refSouth[i]),
  'SOUTH: Cooper draws over the table — every sample changed',
  SAMPLES_SOUTH.map((p, i) => p.join(',') + ' ref ' + refSouth[i] + ' got ' + gotSouth[i]).join(' | '));

console.log('PROPS-DEPTH-CHROME-PASS ' + pass + ' checks · ' + INSTANCE + ' frame ' + JSON.stringify(def.frame) +
  ' anchor ' + JSON.stringify(def.anchor) + ' foot y ' + TABLE.foot +
  ' · Cooper ' + COOPER_X + ',' + NORTH_Y + ' (foot ' + footOf(NORTH_Y) + ') vs ' + COOPER_X + ',' + SOUTH_Y +
  ' (foot ' + footOf(SOUTH_Y) + ')');
