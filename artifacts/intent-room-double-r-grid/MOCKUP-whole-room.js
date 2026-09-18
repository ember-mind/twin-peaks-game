#!/usr/bin/env node

// Deterministic review-only whole-room composites for the B/D crop probes.
// Patches only the exact changed RGB pixels from each 64x48 crop at (24,128).

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const OUT = __dirname;
const PACKET = path.resolve(OUT, '../intent-room-double-r-visual/packet');
const BASELINE = path.join(PACKET, 'baseline-populated-native.png');
const OCCUPIED = path.join(PACKET, 'booth-lower-left-occupied-native.png');
const VARIANTS = {
  B: path.join(OUT, 'B-native.png'),
  D: path.join(OUT, 'D-native.png'),
};
const ROOM_W = 256;
const ROOM_H = 192;
const CROP_W = 64;
const CROP_H = 48;
const ORIGIN = { x: 24, y: 128 };

function fail(message) {
  throw new Error(message);
}

function magick(args, input) {
  const result = spawnSync('magick', args, { input, encoding: null });
  if (result.error) fail(`magick failed to start: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`magick ${args.join(' ')} failed (${result.status}): ${(result.stderr || '').toString()}`);
  }
  return result.stdout || Buffer.alloc(0);
}

function readRgb(file) {
  return magick([file, '-depth', '8', 'rgb:-']);
}

function writeRgb(file, raw, width, height) {
  magick([
    '-size', `${width}x${height}`,
    '-depth', '8',
    'rgb:-',
    '-define', 'png:color-type=2',
    '-strip',
    file,
  ], raw);
}

function hash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function pixelOffset(x, y, width) {
  return (y * width + x) * 3;
}

function hexAt(raw, offset) {
  return `#${[raw[offset], raw[offset + 1], raw[offset + 2]]
    .map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function changedPixels(before, after, width, height) {
  const records = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = pixelOffset(x, y, width);
      if (before[offset] !== after[offset]
        || before[offset + 1] !== after[offset + 1]
        || before[offset + 2] !== after[offset + 2]) {
        records.push({
          x,
          y,
          old: hexAt(before, offset),
          new: hexAt(after, offset),
        });
      }
    }
  }
  return records;
}

function samePixel(a, aOffset, b, bOffset) {
  return a[aOffset] === b[bOffset]
    && a[aOffset + 1] === b[bOffset + 1]
    && a[aOffset + 2] === b[bOffset + 2];
}

function relativeKey(x, y) {
  return `${x},${y}`;
}

function absoluteKey(x, y) {
  return `${ORIGIN.x + x},${ORIGIN.y + y}`;
}

function makeMockup(base, crop, variant, label, expectedCount) {
  const cropDiff = changedPixels(crop, variant, CROP_W, CROP_H);
  if (cropDiff.length !== expectedCount) {
    fail(`${label}: expected ${expectedCount} crop changes, got ${cropDiff.length}`);
  }

  const output = Buffer.from(base);
  for (const record of cropDiff) {
    const sourceOffset = pixelOffset(record.x, record.y, CROP_W);
    const targetOffset = pixelOffset(ORIGIN.x + record.x, ORIGIN.y + record.y, ROOM_W);
    output[targetOffset] = variant[sourceOffset];
    output[targetOffset + 1] = variant[sourceOffset + 1];
    output[targetOffset + 2] = variant[sourceOffset + 2];
  }

  const wholeDiff = changedPixels(base, output, ROOM_W, ROOM_H);
  const expectedKeys = new Set(cropDiff.map((record) => absoluteKey(record.x, record.y)));
  const actualKeys = new Set(wholeDiff.map((record) => absoluteKey(record.x - ORIGIN.x, record.y - ORIGIN.y)));
  if (wholeDiff.length !== expectedCount) {
    fail(`${label}: expected ${expectedCount} whole-room changes, got ${wholeDiff.length}`);
  }
  for (const record of wholeDiff) {
    const key = `${record.x},${record.y}`;
    if (!expectedKeys.has(key)) fail(`${label}: unexpected whole-room change at ${key}`);
  }
  if (actualKeys.size !== expectedKeys.size) fail(`${label}: changed-position set mismatch`);

  for (let i = 0; i < base.length; i += 3) {
    const x = (i / 3) % ROOM_W;
    const y = Math.floor((i / 3) / ROOM_W);
    const insidePatch = x >= ORIGIN.x && x < ORIGIN.x + CROP_W
      && y >= ORIGIN.y && y < ORIGIN.y + CROP_H;
    if (!insidePatch && !samePixel(base, i, output, i)) {
      fail(`${label}: pixel changed outside crop at ${x},${y}`);
    }
  }

  return { output, cropDiff, wholeDiff };
}

const base = readRgb(BASELINE);
const crop = readRgb(OCCUPIED);
const b = readRgb(VARIANTS.B);
const d = readRgb(VARIANTS.D);
if (base.length !== ROOM_W * ROOM_H * 3) fail(`baseline RGB size ${base.length}`);
if (crop.length !== CROP_W * CROP_H * 3) fail(`occupied crop RGB size ${crop.length}`);
if (b.length !== crop.length || d.length !== crop.length) fail('B/D crop RGB size mismatch');

const baselineCrop = magick([
  BASELINE, '-crop', `${CROP_W}x${CROP_H}+${ORIGIN.x}+${ORIGIN.y}`,
  '+repage', '-depth', '8', 'rgb:-',
]);
if (Buffer.compare(baselineCrop, crop) !== 0) fail('baseline crop does not equal occupied source crop');

const bResult = makeMockup(base, crop, b, 'B', 16);
const dResult = makeMockup(base, crop, d, 'D', 8);
const bPath = path.join(OUT, 'MOCKUP-whole-room-B-native.png');
const dPath = path.join(OUT, 'MOCKUP-whole-room-D-native.png');
writeRgb(bPath, bResult.output, ROOM_W, ROOM_H);
writeRgb(dPath, dResult.output, ROOM_W, ROOM_H);

const comparisonPath = path.join(OUT, 'MOCKUP-whole-room-before-B-D-native.png');
magick([BASELINE, bPath, dPath, '+append', '-strip', comparisonPath]);

const verification = {
  kind: 'MOCKUP_ONLY',
  selectorVerdict: null,
  sources: {
    baseline: { path: path.relative(process.cwd(), BASELINE), sha256: hash(BASELINE) },
    occupiedCrop: { path: path.relative(process.cwd(), OCCUPIED), sha256: hash(OCCUPIED) },
    B: { path: path.relative(process.cwd(), VARIANTS.B), sha256: hash(VARIANTS.B) },
    D: { path: path.relative(process.cwd(), VARIANTS.D), sha256: hash(VARIANTS.D) },
  },
  cropOrigin: { ...ORIGIN, width: CROP_W, height: CROP_H },
  checks: {
    baselineCropEqualsOccupiedSource: true,
    changedPixelsAppliedExactlyAtOffset: true,
    outsideCropUnchanged: true,
    nativeDimensions: '256x192',
    comparisonOrder: ['baseline', 'B', 'D'],
  },
  patches: {
    B: {
      expectedDiffPixels: 16,
      actualCropDiffPixels: bResult.cropDiff.length,
      actualWholeRoomDiffPixels: bResult.wholeDiff.length,
      relativeCoordinates: bResult.cropDiff.map(({ x, y }) => relativeKey(x, y)),
      absoluteCoordinates: bResult.cropDiff.map(({ x, y }) => absoluteKey(x, y)),
    },
    D: {
      expectedDiffPixels: 8,
      actualCropDiffPixels: dResult.cropDiff.length,
      actualWholeRoomDiffPixels: dResult.wholeDiff.length,
      relativeCoordinates: dResult.cropDiff.map(({ x, y }) => relativeKey(x, y)),
      absoluteCoordinates: dResult.cropDiff.map(({ x, y }) => absoluteKey(x, y)),
    },
  },
  outputs: {
    B: { path: path.relative(process.cwd(), bPath), sha256: hash(bPath), dimensions: '256x192' },
    D: { path: path.relative(process.cwd(), dPath), sha256: hash(dPath), dimensions: '256x192' },
    comparison: { path: path.relative(process.cwd(), comparisonPath), sha256: hash(comparisonPath), dimensions: '768x192' },
  },
};
const verificationPath = path.join(OUT, 'MOCKUP-whole-room-verification.json');
fs.writeFileSync(verificationPath, `${JSON.stringify(verification, null, 2)}\n`);
console.log(JSON.stringify(verification, null, 2));
