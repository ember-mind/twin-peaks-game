#!/usr/bin/env node
'use strict';

/* Hard contract for final hand-authored cast data. No renderer post-process
 * may rescue malformed art: these checks run on source matrices themselves. */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { GAME: {} };
const reference = JSON.parse(fs.readFileSync(path.join(
  root, '.gauntlet/character-sprite-fidelity-r101/evidence/reference/pokecrystal-metrics.json'
), 'utf8'));
assert.equal(reference.source.commit, '7a7881d0d62e0ddbd82dcf10e7116807487ac651', 'pinned reference commit');
for (const file of ['js/chars.js', 'js/retro-cast-matrices-a.js', 'js/retro-cast-matrices-b.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const cast = Object.keys(context.GAME.sprites.CHARS);
const authored = context.GAME.RetroCastMatrices;
assert.deepEqual(Object.keys(authored), cast, 'authored inventory/order must match production cast');

function stats(rows) {
  let mass = 0, minX = 16, maxX = -1, minY = 16, maxY = -1;
  const opaque = new Set(), mask = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const token = rows[y][x], on = token !== '.';
    mask.push(on ? 1 : 0);
    if (!on) continue;
    opaque.add(token); mass++;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const seen = new Uint8Array(256); let components = 0;
  for (let start = 0; start < 256; start++) {
    if (!mask[start] || seen[start]) continue;
    components++; seen[start] = 1; const stack = [start];
    while (stack.length) {
      const pos = stack.pop(), y = Math.floor(pos / 16), x = pos % 16;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy, next = ny * 16 + nx;
        if (nx >= 0 && nx < 16 && ny >= 0 && ny < 16 && mask[next] && !seen[next]) {
          seen[next] = 1; stack.push(next);
        }
      }
    }
  }
  const width = maxX - minX + 1, height = maxY - minY + 1;
  const split = minY + Math.ceil(height / 2);
  let upper = 0, lower = 0;
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    if (rows[y][x] === '.') continue;
    if (y < split) upper++; else lower++;
  }
  return {
    mass, width, height, minY, maxY, opaque, components, mask,
    fill: mass / (width * height), upperLower: lower ? upper / lower : Infinity
  };
}

function diffCount(a, b, fromRow = 0, toRow = 16) {
  let count = 0;
  for (let y = fromRow; y < toRow; y++) for (let x = 0; x < 16; x++) if (a[y][x] !== b[y][x]) count++;
  return count;
}

function maskDiffCount(a, b, fromRow = 0, toRow = 16) {
  let count = 0;
  for (let y = fromRow; y < toRow; y++) for (let x = 0; x < 16; x++) {
    if ((a[y][x] === '.') !== (b[y][x] === '.')) count++;
  }
  return count;
}

const failures = [];
for (const name of cast) for (const view of ['down', 'up', 'side']) {
  const poses = authored[name] && authored[name][view];
  if (!poses) { failures.push(`${name}/${view}:missing`); continue; }
  for (const pose of ['idle', 'step']) {
    const rows = poses[pose];
    if (!Array.isArray(rows) || rows.length !== 16 || rows.some((row) => typeof row !== 'string' || row.length !== 16 || /[^.osc]/.test(row))) {
      failures.push(`${name}/${view}/${pose}:grid`); continue;
    }
    const s = stats(rows);
    if (s.opaque.size < 2 || s.opaque.size > 3) failures.push(`${name}/${view}/${pose}:tones=${[...s.opaque].join('')}`);
    if (s.maxY !== 15) failures.push(`${name}/${view}/${pose}:baseline=${s.maxY}`);
    /* Local cast includes MFAP and other short semantic silhouettes, so the
     * pinned Crystal 15–16px interval widens only to 14px at the lower edge. */
    if (s.height < 14 || s.height > 16) failures.push(`${name}/${view}/${pose}:height=${s.height}`);
    if (s.components !== 1) failures.push(`${name}/${view}/${pose}:components=${s.components}`);
    if (view === 'side' ? (s.width < 12 || s.width > 15) : (s.width < 12 || s.width > 16)) {
      failures.push(`${name}/${view}/${pose}:width=${s.width}`);
    }
  }
  const toneDelta = diffCount(poses.idle, poses.step);
  const maskDelta = maskDiffCount(poses.idle, poses.step);
  const headToneDelta = diffCount(poses.idle, poses.step, 0, 10);
  const lowerToneDelta = diffCount(poses.idle, poses.step, 10, 16);
  /* Pinned Crystal walking frames redraw the whole pose. Stable heads were a
   * false proxy: 68/69 reference direction pairs change rows 0–9. These
   * lower bounds preserve short local actors while rejecting four-pixel
   * foot toggles and procedural mannequins. */
  const minTone = view === 'side' ? 45 : 40;
  const minMask = view === 'side' ? 15 : 14;
  const minHead = view === 'up' ? 0 : 29;
  if (toneDelta < minTone) failures.push(`${name}/${view}:tone-delta=${toneDelta}`);
  if (maskDelta < minMask) failures.push(`${name}/${view}:mask-delta=${maskDelta}`);
  if (headToneDelta < minHead) failures.push(`${name}/${view}:head-tone-delta=${headToneDelta}`);
  if (lowerToneDelta < 4) failures.push(`${name}/${view}:weak-contact=${lowerToneDelta}`);
}
for (const name of cast) {
  const front = stats(authored[name].down.idle), side = stats(authored[name].side.idle);
  const ratio = side.mass / front.mass;
  const back = stats(authored[name].up.idle), backRatio = back.mass / front.mass;
  const sideRange = reference.idleRatios.sideFront;
  if (ratio < sideRange[0] - 0.01 || ratio > sideRange[2] + 0.01) failures.push(`${name}:side-mass=${ratio.toFixed(3)}`);
  if (backRatio < 0.90 || backRatio > 1.08) failures.push(`${name}:back-mass=${backRatio.toFixed(3)}`);
  for (const [view, s] of [['down', front], ['up', back], ['side', side]]) {
    if (s.fill < 0.60 || s.fill > 0.90) failures.push(`${name}/${view}:fill=${s.fill.toFixed(3)}`);
    if (s.upperLower < 0.65 || s.upperLower > 1.85) failures.push(`${name}/${view}:upper-lower=${s.upperLower.toFixed(3)}`);
  }
}

assert.equal(failures.length, 0, 'authored matrix failures:\n' + failures.join('\n'));
console.log('AUTHORED-CAST-PASS — 25 actors × 3 views × 2 poses, source matrices clean');
