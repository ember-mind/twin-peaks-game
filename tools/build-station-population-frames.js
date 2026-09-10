#!/usr/bin/env node
'use strict';

/**
 * Build Sheriff's Station population frames at native 24 px.
 *
 * Output extends Character Life v0.1 horizontally. Decoded pixels x=0..95
 * remain identical so existing Truman rectangles stay stable.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const BASE_CAST = path.join(ROOT, 'assets/sprites/cast-walkcycles-hg-24.png');
const CHARACTER_LIFE = path.join(ROOT, 'assets/sprites/character-life-v01.png');
const OUTPUT = path.join(ROOT, 'assets/sprites/station-population-v01.png');
const MANIFEST = path.join(ROOT, 'assets/sprites/station-population-v01.manifest.json');
const REVIEW_SHEET = path.join(ROOT, 'artifacts/station-population-v01/frame-sheet-12x.png');

const BASE_CAST_SHA256 = 'dcc9e00ad1370606b039ee6039b955720d711d04f521d601169eebe97eb4d770';
const CHARACTER_LIFE_SHA256 = 'c7ee161139c445fe5ca8e61badb658d7f69fdbe1adfd69f69bc9949b04af19cb';
const FRAME = 24;
const OUTPUT_WIDTH = 192;
const LEGACY_WIDTH = 96;

const COLORS = Object.freeze({
  ink: '241e22ff',
  lucySkin: 'f2dcc2ff',
  andySkin: 'e8caa8ff',
  andyJacket: '8a6e45ff',
  noteEdge: 'b8a886ff',
  notePaper: 'f5ebd2ff',
  noteMark: '8a6e45ff'
});

const SOURCE_RECTS = Object.freeze({
  lucyDown: { x: 144, y: 0, width: 24, height: 24 },
  andyDown: { x: 216, y: 0, width: 24, height: 24 }
});

function fail(message) {
  process.stderr.write(`build-station-population-frames: ${message}\n`);
  process.exit(1);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function offset(x, y, width = FRAME) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= width || y >= FRAME) {
    fail(`pixel outside ${width}x${FRAME}: ${x},${y}`);
  }
  return ((y * width) + x) * 4;
}

function getPixel(frame, x, y) {
  const start = offset(x, y);
  return frame.subarray(start, start + 4).toString('hex');
}

function setPixel(frame, x, y, color, expected) {
  const actual = getPixel(frame, x, y);
  if (expected && actual !== expected) fail(`source drift at ${x},${y}: expected ${expected}, found ${actual}`);
  Buffer.from(color, 'hex').copy(frame, offset(x, y));
}

function setRun(frame, y, x0, x1, color) {
  for (let x = x0; x <= x1; x += 1) setPixel(frame, x, y, color);
}

function changedPixels(base, variant) {
  let count = 0;
  for (let start = 0; start < base.length; start += 4) {
    if (!base.subarray(start, start + 4).equals(variant.subarray(start, start + 4))) count += 1;
  }
  return count;
}

function assertRowsUnchanged(base, variant, rows, label) {
  for (const y of rows) {
    const start = y * FRAME * 4;
    const end = start + (FRAME * 4);
    if (!base.subarray(start, end).equals(variant.subarray(start, end))) fail(`${label}: protected row ${y} changed`);
  }
}

function assertAlphaUnchanged(base, variant, label) {
  for (let start = 3; start < base.length; start += 4) {
    if (base[start] !== variant[start]) fail(`${label}: alpha changed at pixel ${(start - 3) / 4}`);
  }
}

function assertAlphaChanges(base, variant, allowed, label) {
  const allowedSet = new Set(allowed.map(point => `${point[0]},${point[1]}`));
  const seen = new Set();
  for (let y = 0; y < FRAME; y += 1) {
    for (let x = 0; x < FRAME; x += 1) {
      const alphaOffset = offset(x, y) + 3;
      if (base[alphaOffset] === variant[alphaOffset]) continue;
      const key = `${x},${y}`;
      if (!allowedSet.has(key)) fail(`${label}: unexpected alpha change at ${key}`);
      seen.add(key);
    }
  }
  if (seen.size !== allowedSet.size) fail(`${label}: expected ${allowedSet.size} alpha additions, found ${seen.size}`);
}

async function readRaw(file, rect) {
  let image = sharp(file);
  if (rect) image = image.extract({ left: rect.x, top: rect.y, width: rect.width, height: rect.height });
  return image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

function buildBlink(base) {
  const frame = Buffer.from(base);
  setPixel(frame, 7, 8, COLORS.lucySkin, COLORS.ink);
  setPixel(frame, 13, 8, COLORS.lucySkin, COLORS.ink);
  setPixel(frame, 8, 9, COLORS.ink, COLORS.lucySkin);
  setPixel(frame, 12, 9, COLORS.ink, COLORS.lucySkin);
  return frame;
}

function buildAndyBlink(base) {
  const frame = Buffer.from(base);
  setPixel(frame, 7, 8, COLORS.andySkin, COLORS.ink);
  setPixel(frame, 13, 8, COLORS.andySkin, COLORS.ink);
  setPixel(frame, 8, 9, COLORS.ink, COLORS.andySkin);
  setPixel(frame, 12, 9, COLORS.ink, COLORS.andySkin);
  return frame;
}

function buildLucyTelephone(base) {
  const frame = Buffer.from(base);
  // Compact receiver brackets right ear. Every changed pixel is above local
  // row 10, where reception-front redraw begins for Lucy's station placement.
  setPixel(frame, 19, 5, COLORS.ink, '00000000');
  setPixel(frame, 20, 5, COLORS.ink, '00000000');
  setPixel(frame, 19, 6, COLORS.ink, '00000000');
  setPixel(frame, 19, 7, COLORS.ink, '00000000');
  setPixel(frame, 19, 8, COLORS.ink, '00000000');
  setPixel(frame, 18, 9, COLORS.lucySkin, COLORS.ink);
  setPixel(frame, 19, 9, COLORS.ink, '00000000');
  setPixel(frame, 20, 9, COLORS.ink, '00000000');
  return frame;
}

function buildAndyNote(base) {
  const frame = Buffer.from(base);

  // Lowered lids point attention toward note without moving head.
  setPixel(frame, 7, 8, COLORS.andySkin, COLORS.ink);
  setPixel(frame, 13, 8, COLORS.andySkin, COLORS.ink);

  // Clear lowered hands, then place both hands beside a compact 5x4 note.
  setPixel(frame, 6, 17, COLORS.andyJacket, COLORS.andySkin);
  setPixel(frame, 6, 18, COLORS.andyJacket, 'c8a080ff');
  setPixel(frame, 16, 18, COLORS.andyJacket, 'c8a080ff');
  setPixel(frame, 9, 17, COLORS.andySkin, COLORS.andyJacket);
  setPixel(frame, 15, 17, COLORS.andySkin, COLORS.andyJacket);

  setRun(frame, 15, 10, 14, COLORS.noteEdge);
  setPixel(frame, 12, 15, COLORS.ink);
  for (let y = 16; y <= 17; y += 1) {
    setPixel(frame, 10, y, COLORS.noteEdge);
    setRun(frame, y, 11, 13, COLORS.notePaper);
    setPixel(frame, 14, y, COLORS.noteEdge);
  }
  setPixel(frame, 12, 17, COLORS.noteMark);
  setRun(frame, 18, 10, 14, COLORS.noteEdge);
  return frame;
}

function copyFrame(target, targetWidth, targetX, source) {
  const sourceStride = FRAME * 4;
  const targetStride = targetWidth * 4;
  for (let y = 0; y < FRAME; y += 1) {
    source.copy(target, (y * targetStride) + (targetX * 4), y * sourceStride, (y + 1) * sourceStride);
  }
}

function copyImage(target, targetWidth, targetX, source, sourceWidth) {
  const sourceStride = sourceWidth * 4;
  const targetStride = targetWidth * 4;
  for (let y = 0; y < FRAME; y += 1) {
    source.copy(target, (y * targetStride) + (targetX * 4), y * sourceStride, (y + 1) * sourceStride);
  }
}

function extractRaw(source, sourceWidth, left, width) {
  const result = Buffer.alloc(width * FRAME * 4);
  const sourceStride = sourceWidth * 4;
  const targetStride = width * 4;
  for (let y = 0; y < FRAME; y += 1) {
    source.copy(result, y * targetStride, (y * sourceStride) + (left * 4), (y * sourceStride) + ((left + width) * 4));
  }
  return result;
}

function manifestFor(counts, outputHash) {
  return {
    schemaVersion: 1,
    id: 'station-population-v0.1',
    asset: 'assets/sprites/station-population-v01.png',
    outputSha256: outputHash,
    nativeFrame: { width: 24, height: 24 },
    inheritedPrefix: {
      asset: 'assets/sprites/character-life-v01.png',
      sha256: CHARACTER_LIFE_SHA256,
      sourceRect: { x: 0, y: 0, width: 96, height: 24 },
      outputRect: { x: 0, y: 0, width: 96, height: 24 },
      decodedPixelsIdentical: true
    },
    source: {
      asset: 'assets/sprites/cast-walkcycles-hg-24.png',
      sha256: BASE_CAST_SHA256,
      immutable: true,
      frames: {
        'lucy.down': SOURCE_RECTS.lucyDown,
        'andy.down': SOURCE_RECTS.andyDown
      }
    },
    frames: {
      'lucy.blink.down': {
        rect: { x: 96, y: 0, width: 24, height: 24 },
        actor: 'lucy',
        baseDirection: 'down',
        behavior: 'generic',
        changedPixels: counts.lucyBlink
      },
      'lucy.telephone.down': {
        rect: { x: 120, y: 0, width: 24, height: 24 },
        actor: 'lucy',
        baseDirection: 'down',
        behavior: 'contextual',
        context: 'sheriffs-station.reception',
        pose: 'receiverToEar',
        changedPixels: counts.lucyTelephone,
        occlusionContract: {
          receptionFrontStartsAtLocalRow: 10,
          authoredPixelRows: [5, 9],
          fullyVisibleAboveReceptionFront: true
        }
      },
      'andy.blink.down': {
        rect: { x: 144, y: 0, width: 24, height: 24 },
        actor: 'andy',
        baseDirection: 'down',
        behavior: 'generic',
        changedPixels: counts.andyBlink
      },
      'andy.note.down': {
        rect: { x: 168, y: 0, width: 24, height: 24 },
        actor: 'andy',
        baseDirection: 'down',
        behavior: 'contextual',
        context: 'sheriffs-station.right-desk',
        pose: 'checkingNote',
        changedPixels: counts.andyNote
      }
    },
    animations: {
      'lucy.blink': {
        behavior: 'generic',
        oneShot: true,
        framesByDirection: { down: 'lucy.blink.down' },
        unsupportedDirections: ['up', 'left', 'right'],
        fallback: 'base-frame',
        restore: 'base-frame'
      },
      'lucy.telephone': {
        behavior: 'contextual',
        context: 'sheriffs-station.reception',
        requiredDirection: 'down',
        oneShot: true,
        frames: ['lucy.telephone.down'],
        restore: 'base-frame'
      },
      'andy.blink': {
        behavior: 'generic',
        oneShot: true,
        framesByDirection: { down: 'andy.blink.down' },
        unsupportedDirections: ['up', 'left', 'right'],
        fallback: 'base-frame',
        restore: 'base-frame'
      },
      'andy.note': {
        behavior: 'contextual',
        context: 'sheriffs-station.right-desk',
        requiredDirection: 'down',
        oneShot: true,
        frames: ['andy.note.down'],
        restore: 'base-frame'
      }
    },
    constraints: {
      timingOwner: 'runtime-character-life-profile',
      stillnessDefault: true,
      nativePixelsOnly: true,
      interpolation: false,
      translation: false,
      deformation: false,
      continuousLoop: false
    }
  };
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  if (process.argv.length > (checkOnly ? 3 : 2)) fail('usage: node tools/build-station-population-frames.js [--check]');

  const baseCastFile = fs.readFileSync(BASE_CAST);
  const characterLifeFile = fs.readFileSync(CHARACTER_LIFE);
  if (sha256(baseCastFile) !== BASE_CAST_SHA256) fail(`base cast hash changed: ${sha256(baseCastFile)}`);
  if (sha256(characterLifeFile) !== CHARACTER_LIFE_SHA256) fail(`Character Life atlas hash changed: ${sha256(characterLifeFile)}`);

  const [legacyResult, lucyResult, andyResult] = await Promise.all([
    readRaw(CHARACTER_LIFE),
    readRaw(BASE_CAST, SOURCE_RECTS.lucyDown),
    readRaw(BASE_CAST, SOURCE_RECTS.andyDown)
  ]);
  if (legacyResult.info.width !== 96 || legacyResult.info.height !== 24) fail('Character Life atlas dimensions changed');

  const lucyBlink = buildBlink(lucyResult.data);
  const lucyTelephone = buildLucyTelephone(lucyResult.data);
  const andyBlink = buildAndyBlink(andyResult.data);
  const andyNote = buildAndyNote(andyResult.data);

  assertAlphaUnchanged(lucyResult.data, lucyBlink, 'Lucy blink');
  assertAlphaChanges(lucyResult.data, lucyTelephone, [[19,5],[20,5],[19,6],[19,7],[19,8],[19,9],[20,9]], 'Lucy telephone');
  assertAlphaUnchanged(andyResult.data, andyBlink, 'Andy blink');
  assertAlphaUnchanged(andyResult.data, andyNote, 'Andy note');
  assertRowsUnchanged(lucyResult.data, lucyTelephone, [10,11,12,13,14,15,16,17,18,19,20,21,22,23], 'Lucy telephone');
  assertRowsUnchanged(lucyResult.data, lucyBlink, [0,1,2,3,4,5,6,7,10,11,12,13,14,15,16,17,18,19,20,21,22,23], 'Lucy blink');
  assertRowsUnchanged(andyResult.data, andyNote, [0,1,2,3,4,5,6,7,9,10,11,12,13,19,20,21,22,23], 'Andy note');

  const combinedRaw = Buffer.alloc(OUTPUT_WIDTH * FRAME * 4);
  copyImage(combinedRaw, OUTPUT_WIDTH, 0, legacyResult.data, LEGACY_WIDTH);
  copyFrame(combinedRaw, OUTPUT_WIDTH, 96, lucyBlink);
  copyFrame(combinedRaw, OUTPUT_WIDTH, 120, lucyTelephone);
  copyFrame(combinedRaw, OUTPUT_WIDTH, 144, andyBlink);
  copyFrame(combinedRaw, OUTPUT_WIDTH, 168, andyNote);

  const prefix = extractRaw(combinedRaw, OUTPUT_WIDTH, 0, LEGACY_WIDTH);
  if (!prefix.equals(legacyResult.data)) fail('legacy decoded prefix changed');

  const outputBuffer = await sharp(combinedRaw, { raw: { width: OUTPUT_WIDTH, height: FRAME, channels: 4 } })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  const decodedOutput = await sharp(outputBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (decodedOutput.info.width !== OUTPUT_WIDTH || decodedOutput.info.height !== FRAME) fail('encoded output dimensions changed');
  const decodedPrefix = extractRaw(decodedOutput.data, OUTPUT_WIDTH, 0, LEGACY_WIDTH);
  if (!decodedPrefix.equals(legacyResult.data)) fail('encoded output changed legacy decoded prefix');
  const newFramesRaw = extractRaw(decodedOutput.data, OUTPUT_WIDTH, LEGACY_WIDTH, LEGACY_WIDTH);
  const reviewBuffer = await sharp(newFramesRaw, { raw: { width: LEGACY_WIDTH, height: FRAME, channels: 4 } })
    .resize(LEGACY_WIDTH * 12, FRAME * 12, { kernel: 'nearest' })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  const counts = {
    lucyBlink: changedPixels(lucyResult.data, lucyBlink),
    lucyTelephone: changedPixels(lucyResult.data, lucyTelephone),
    andyBlink: changedPixels(andyResult.data, andyBlink),
    andyNote: changedPixels(andyResult.data, andyNote)
  };
  const expectedCounts = { lucyBlink: 4, lucyTelephone: 8, andyBlink: 4, andyNote: 22 };
  if (JSON.stringify(counts) !== JSON.stringify(expectedCounts)) fail(`unexpected pixel diffs: ${JSON.stringify(counts)}`);
  const manifestText = `${JSON.stringify(manifestFor(counts, sha256(outputBuffer)), null, 2)}\n`;

  if (checkOnly) {
    if (!fs.existsSync(OUTPUT) || !fs.readFileSync(OUTPUT).equals(outputBuffer)) fail('generated PNG is stale');
    if (!fs.existsSync(MANIFEST) || fs.readFileSync(MANIFEST, 'utf8') !== manifestText) fail('generated manifest is stale');
    if (!fs.existsSync(REVIEW_SHEET) || !fs.readFileSync(REVIEW_SHEET).equals(reviewBuffer)) fail('generated review sheet is stale');
    process.stdout.write(`Station population frames verified: ${JSON.stringify(counts)}\n`);
    return;
  }

  fs.mkdirSync(path.dirname(REVIEW_SHEET), { recursive: true });
  fs.writeFileSync(OUTPUT, outputBuffer);
  fs.writeFileSync(MANIFEST, manifestText);
  fs.writeFileSync(REVIEW_SHEET, reviewBuffer);
  process.stdout.write(`Built ${path.relative(ROOT, OUTPUT)} ${JSON.stringify(counts)}\n`);
}

main().catch(error => fail(error.stack || error.message));
