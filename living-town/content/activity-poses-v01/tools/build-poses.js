#!/usr/bin/env node
/* build-poses.js — compile the activity-pose sheet.
 *
 * Every look in living-town/js/lt-appearance.js (and its `_work` apron
 * variant) gets one row of pose cells, in the order activity-poses.table.js
 * declares. Same 24px cell, same bottom alignment, same palette slots and the
 * same PNG writer as the walk atlas: the pose sheet is the walk atlas's
 * sibling, not a second asset library.
 *
 *   node living-town/content/activity-poses-v01/tools/build-poses.js
 *   node living-town/content/activity-poses-v01/tools/build-poses.js --check
 *   node .../build-poses.js --ascii look_teal_bob/seated/down/0   (one cell, as text)
 *
 * `--check` writes nothing and exits non-zero if the committed sheet or its
 * frame index is not byte-for-byte what this compiler produces now.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { HEADS, OVERLAYS, pal } = require('../../../../tools/cast-authored-frames.js');
const { encodePng } = require('../../../../tools/build-cast-authored.js');
const { PAPER, APRON, art } = require('./pose-frames.js');

global.window = global;
require('../../../js/lt-appearance.js');
require('../activity-poses.table.js');
const A = global.LT.Appearance;
const AP = global.LT.ActivityPoses;

const DIR = path.resolve(__dirname, '..');
const ROOT = path.resolve(DIR, '..', '..', '..', '..');
const PNG_OUT = path.join(DIR, 'assets', 'activity-poses-v01.png');
const JSON_OUT = path.join(DIR, 'assets', 'activity-poses-v01.frames.json');
const CELL = AP.CELL;
/* Square because the production PNG writer writes squares; 14 columns of
 * poses by 12 looks is 336x288, so two cell rows at the bottom stay empty. */
const ATLAS = 360;   // 15 columns of poses by 12 looks (360x288); was 336 before the guitar

const problems = [];
function bad(message) { problems.push(message); }

/* One cell, as slot letters: head matrix (if any) stacked on the body rows,
 * then the look's overlays applied at the rows they were authored for. */
function cellRows(sheetId, poseId, dir, frame) {
  const spec = A.spec(sheetId);
  if (!spec) throw new Error('unknown sheetId: ' + sheetId);
  const a = art(poseId, dir, frame);
  if (!a) throw new Error('no art for ' + poseId + '/' + dir);
  const body = a.body[spec.body];
  if (!body) throw new Error('no ' + spec.body + ' body for ' + poseId + '/' + dir);
  const gap = '.'.repeat(a.pad || 0);
  let head = a.head ? HEADS[spec.head][a.head] : [];
  /* A head tipped forward shows less of itself: keep the crown, drop the rows
   * that have rotated out of sight. */
  if (a.headRows) head = head.slice(0, a.headRows);
  head = head.map((row) => gap + row + gap);
  const stacked = head.concat(body);
  const width = stacked.length ? stacked[0].length : 0;
  const rows = [];
  for (let i = 0; i < (a.blankTop || 0); i++) rows.push([...'.'.repeat(width)]);
  stacked.forEach((row) => rows.push([...row]));
  const where = sheetId + '/' + poseId + '/' + dir + '/' + frame;
  if (rows.some((row) => row.length !== width)) bad(where + ': ragged rows');
  if (rows.length > CELL) bad(where + ': ' + rows.length + ' rows');
  if (width > CELL) bad(where + ': ' + width + ' columns');
  /* Overlays were authored against the standing stack, so they move with the
   * two geometry levers and with nothing else. An explicit apron entry is
   * already in this pose's own coordinates. */
  const apronKey = poseId + '/' + dir;
  for (const name of spec.overlays || []) {
    const own = name === 'apron' && APRON[apronKey] !== undefined;
    const ops = own ? APRON[apronKey] : (OVERLAYS[name] && OVERLAYS[name][a.overlayDir]);
    if (!ops) continue;
    const dr = own ? 0 : (a.blankTop || 0), dc = own ? 0 : (a.pad || 0);
    for (const [row, col, ch] of ops) {
      if (rows[row + dr] && col + dc < width) rows[row + dr][col + dc] = ch;
    }
  }
  return rows.map((row) => row.join(''));
}

function hexToRgb(hex) { return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); }

/* What the cell actually covers, measured off the matrix: a pose that paints
 * outside its declared box will clip into the furniture beside it. */
function extent(rows) {
  let minX = 99, maxX = -1, minY = 99, maxY = -1;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }));
  return { w: maxX - minX + 1, h: maxY - minY + 1 };
}

function build() {
  const pixels = Buffer.alloc(ATLAS * ATLAS * 4, 0);
  const frames = [];
  A.ORDER.forEach((sheetId, sheetIndex) => {
    const colors = pal(Object.assign({}, A.spec(sheetId).colors, PAPER));
    AP.ORDER.forEach(([poseId, dir, frame], column) => {
      const rows = cellRows(sheetId, poseId, dir, frame);
      const width = rows[0].length;
      const box = AP.POSES[poseId].box;
      const size = extent(rows);
      if (size.w > box[0] || size.h > box[1]) {
        bad(sheetId + '/' + poseId + '/' + dir + '/' + frame + ': paints ' +
            size.w + 'x' + size.h + ', declared box ' + box.join('x'));
      }
      const ox = column * CELL + Math.floor((CELL - width) / 2);
      const oy = sheetIndex * CELL + (CELL - rows.length);
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') return;
        const hex = colors[ch];
        if (!hex) { bad(sheetId + '/' + poseId + ': no colour for slot ' + ch); return; }
        const [r, g, b] = hexToRgb(hex);
        const at = ((oy + y) * ATLAS + ox + x) * 4;
        pixels[at] = r; pixels[at + 1] = g; pixels[at + 2] = b; pixels[at + 3] = 255;
      }));
      if (sheetIndex === 0) {
        frames.push({ poseId, dir, frame, column, x: column * CELL, cell: CELL });
      }
    });
  });
  return { pixels, frames };
}

function index(frames) {
  return {
    version: AP.VERSION,
    note: 'Compiled by living-town/content/activity-poses-v01/tools/build-poses.js from ' +
          'living-town/js/lt-appearance.js and tools/pose-frames.js. One row per sheetId, ' +
          'one column per (pose, direction, frame). Cells are the production 24px actor cell, ' +
          'bottom-aligned on the standing sprite ground line.',
    cell: CELL, atlas: ATLAS, columns: AP.COLUMNS,
    rows: A.ORDER.map((id, i) => ({ sheetId: id, y: i * CELL })),
    frames,
    poses: AP.POSE_IDS.map((id) => AP.POSES[id])
  };
}

const argv = process.argv.slice(2);
const asciiAt = argv.indexOf('--ascii');
if (asciiAt >= 0) {
  const [sheetId, poseId, dir, frame] = String(argv[asciiAt + 1] || '').split('/');
  const rows = cellRows(sheetId, poseId, dir, Number(frame || 0));
  console.log(rows.map((r, i) => String(i + (CELL - rows.length)).padStart(2) + ' ' + r).join('\n'));
  process.exit(problems.length ? 1 : 0);
}

const { pixels, frames } = build();
if (problems.length) {
  console.error('pose contract problems:\n- ' + problems.join('\n- '));
  process.exit(1);
}
const png = encodePng(pixels, ATLAS);
const json = Buffer.from(JSON.stringify(index(frames), null, 2) + '\n');

if (argv.includes('--check')) {
  const stale = [];
  if (!fs.existsSync(PNG_OUT) || !fs.readFileSync(PNG_OUT).equals(png)) stale.push(path.relative(ROOT, PNG_OUT));
  if (!fs.existsSync(JSON_OUT) || !fs.readFileSync(JSON_OUT).equals(json)) stale.push(path.relative(ROOT, JSON_OUT));
  console.log(JSON.stringify({ status: stale.length ? 'fail' : 'pass', stale }));
  process.exit(stale.length ? 1 : 0);
}
fs.mkdirSync(path.dirname(PNG_OUT), { recursive: true });
fs.writeFileSync(PNG_OUT, png);
fs.writeFileSync(JSON_OUT, json);
console.log(JSON.stringify({ status: 'pass', looks: A.ORDER.length, columns: AP.ORDER.length,
  cells: A.ORDER.length * AP.ORDER.length, atlas: path.relative(ROOT, PNG_OUT) }));
