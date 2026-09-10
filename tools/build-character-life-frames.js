#!/usr/bin/env node
'use strict';

/**
 * Build authored Character Life v0.1 frames from immutable production pixels.
 *
 * Output stays at native 24 px. Runtime owns timing and restores base atlas
 * frames after each one-shot animation.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'assets/sprites/cast-walkcycles-hg-24.png');
const OUTPUT = path.join(ROOT, 'assets/sprites/character-life-v01.png');
const MANIFEST = path.join(ROOT, 'assets/sprites/character-life-v01.manifest.json');
const SOURCE_SHA256 = 'dcc9e00ad1370606b039ee6039b955720d711d04f521d601169eebe97eb4d770';
const FRAME_SIZE = 24;

const COLORS = Object.freeze({
  ink: '241e22ff',
  skin: 'e8caa8ff',
  jacket: '8a6e45ff',
  paperEdge: 'b8a886ff',
  paper: 'f1e9d0ff',
  paperMark: '8a6e45ff'
});

const SOURCE_RECTS = Object.freeze({
  down: { x: 72, y: 0, width: 24, height: 24 },
  right: { x: 72, y: 48, width: 24, height: 24 }
});

function fail(message) {
  process.stderr.write(`build-character-life-frames: ${message}\n`);
  process.exit(1);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function rgba(hex) {
  return Buffer.from(hex, 'hex');
}

function pixelOffset(x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= FRAME_SIZE || y >= FRAME_SIZE) {
    fail(`pixel outside ${FRAME_SIZE}x${FRAME_SIZE}: ${x},${y}`);
  }
  return ((y * FRAME_SIZE) + x) * 4;
}

function getPixel(frame, x, y) {
  const offset = pixelOffset(x, y);
  return frame.subarray(offset, offset + 4).toString('hex');
}

function setPixel(frame, x, y, color, expected) {
  const actual = getPixel(frame, x, y);
  if (expected && actual !== expected) {
    fail(`source drift at ${x},${y}: expected ${expected}, found ${actual}`);
  }
  rgba(color).copy(frame, pixelOffset(x, y));
}

function setRun(frame, y, x0, x1, color) {
  for (let x = x0; x <= x1; x += 1) setPixel(frame, x, y, color);
}

function changedPixels(base, variant) {
  let count = 0;
  for (let offset = 0; offset < base.length; offset += 4) {
    if (!base.subarray(offset, offset + 4).equals(variant.subarray(offset, offset + 4))) count += 1;
  }
  return count;
}

function assertRowsUnchanged(base, variant, rows, label) {
  for (const y of rows) {
    const start = y * FRAME_SIZE * 4;
    const end = start + (FRAME_SIZE * 4);
    if (!base.subarray(start, end).equals(variant.subarray(start, end))) {
      fail(`${label}: protected row ${y} changed`);
    }
  }
}

function assertAlphaUnchanged(base, variant, label) {
  for (let offset = 3; offset < base.length; offset += 4) {
    if (base[offset] !== variant[offset]) fail(`${label}: alpha silhouette changed at pixel ${(offset - 3) / 4}`);
  }
}

async function readFrame(rect) {
  return sharp(SOURCE)
    .extract({ left: rect.x, top: rect.y, width: rect.width, height: rect.height })
    .ensureAlpha()
    .raw()
    .toBuffer();
}

function buildBlinkDown(base) {
  const frame = Buffer.from(base);
  // Two 2 px horizontal lid marks replace two 2 px vertical open eyes.
  setPixel(frame, 7, 8, COLORS.skin, COLORS.ink);
  setPixel(frame, 13, 8, COLORS.skin, COLORS.ink);
  setPixel(frame, 8, 9, COLORS.ink, COLORS.skin);
  setPixel(frame, 12, 9, COLORS.ink, COLORS.skin);
  return frame;
}

function buildBlinkRight(base) {
  const frame = Buffer.from(base);
  // Profile eye becomes one 2 px horizontal lid mark.
  setPixel(frame, 14, 8, COLORS.skin, COLORS.ink);
  setPixel(frame, 15, 9, COLORS.ink, COLORS.skin);
  return frame;
}

function buildReadingFileRaised(base) {
  const frame = Buffer.from(base);

  // Remove lowered hands, then raise them inside original body silhouette.
  setPixel(frame, 6, 17, COLORS.jacket, COLORS.skin);
  setPixel(frame, 6, 18, COLORS.jacket, 'c8a080ff');
  setPixel(frame, 16, 18, COLORS.jacket, 'c8a080ff');
  setPixel(frame, 7, 16, COLORS.skin, 'a88a5aff');
  setPixel(frame, 7, 17, COLORS.skin, COLORS.jacket);
  setPixel(frame, 16, 16, COLORS.skin, COLORS.jacket);

  // Authored case-file shape. Entire file remains inside base torso bounds.
  setRun(frame, 14, 9, 14, COLORS.paperEdge);
  for (let y = 15; y <= 18; y += 1) {
    setPixel(frame, 8, y, COLORS.paperEdge);
    setRun(frame, y, 9, 14, COLORS.paper);
    setPixel(frame, 15, y, COLORS.paperEdge);
  }
  setRun(frame, 19, 9, 14, COLORS.paperEdge);
  setRun(frame, 16, 10, 13, COLORS.paperMark);
  setRun(frame, 18, 10, 12, COLORS.paperMark);

  return frame;
}

function buildReadingEyesLowered(fileRaised) {
  const frame = Buffer.from(fileRaised);
  // Open eyes are 2 px tall. Clear upper pixels; lower pixels stay as gaze.
  setPixel(frame, 7, 8, COLORS.skin, COLORS.ink);
  setPixel(frame, 13, 8, COLORS.skin, COLORS.ink);
  return frame;
}

function copyFrame(target, targetX, source) {
  const stride = FRAME_SIZE * 4;
  const targetStride = FRAME_SIZE * 4 * 4;
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    source.copy(target, (y * targetStride) + (targetX * 4), y * stride, (y + 1) * stride);
  }
}

function manifestFor(counts, outputSha256) {
  return {
    schemaVersion: 1,
    id: 'character-life-v0.1',
    asset: 'assets/sprites/character-life-v01.png',
    outputSha256,
    nativeFrame: { width: 24, height: 24 },
    source: {
      asset: 'assets/sprites/cast-walkcycles-hg-24.png',
      sha256: SOURCE_SHA256,
      immutable: true,
      character: 'truman',
      frames: SOURCE_RECTS
    },
    frames: {
      'truman.blink.down': {
        rect: { x: 0, y: 0, width: 24, height: 24 },
        baseDirection: 'down',
        behavior: 'generic',
        changedPixels: counts.blinkDown
      },
      'truman.blink.right': {
        rect: { x: 24, y: 0, width: 24, height: 24 },
        baseDirection: 'right',
        behavior: 'generic',
        mirrorForDirection: 'left',
        changedPixels: counts.blinkRight
      },
      'truman.reading.fileRaised': {
        rect: { x: 48, y: 0, width: 24, height: 24 },
        baseDirection: 'down',
        behavior: 'contextual',
        context: 'sheriffs-station.office',
        pose: 'fileRaised',
        changedPixels: counts.fileRaised
      },
      'truman.reading.eyesLowered': {
        rect: { x: 72, y: 0, width: 24, height: 24 },
        baseDirection: 'down',
        behavior: 'contextual',
        context: 'sheriffs-station.office',
        pose: 'eyesLowered',
        changedPixels: counts.eyesLowered
      }
    },
    animations: {
      'truman.blink': {
        behavior: 'generic',
        oneShot: true,
        framesByDirection: {
          down: { frame: 'truman.blink.down', mirrorX: false },
          right: { frame: 'truman.blink.right', mirrorX: false },
          left: { frame: 'truman.blink.right', mirrorX: true }
        },
        unsupportedDirections: ['up'],
        fallback: 'base-frame',
        restore: 'base-frame'
      },
      'truman.reading': {
        behavior: 'contextual',
        context: 'sheriffs-station.office',
        requiredDirection: 'down',
        oneShot: true,
        frames: ['truman.reading.fileRaised', 'truman.reading.eyesLowered'],
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
  if (process.argv.length > (checkOnly ? 3 : 2)) fail('usage: node tools/build-character-life-frames.js [--check]');

  const sourceBuffer = fs.readFileSync(SOURCE);
  const sourceHash = sha256(sourceBuffer);
  if (sourceHash !== SOURCE_SHA256) fail(`source atlas hash changed: ${sourceHash}`);

  const [down, right] = await Promise.all([
    readFrame(SOURCE_RECTS.down),
    readFrame(SOURCE_RECTS.right)
  ]);
  const blinkDown = buildBlinkDown(down);
  const blinkRight = buildBlinkRight(right);
  const fileRaised = buildReadingFileRaised(down);
  const eyesLowered = buildReadingEyesLowered(fileRaised);

  assertRowsUnchanged(down, blinkDown, [0, 1, 2, 3, 4, 5, 19, 20, 21, 22, 23], 'blink down');
  assertRowsUnchanged(right, blinkRight, [0, 1, 2, 3, 4, 5, 19, 20, 21, 22, 23], 'blink right');
  assertRowsUnchanged(down, fileRaised, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 20, 21, 22, 23], 'reading file raised');
  assertRowsUnchanged(down, eyesLowered, [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 20, 21, 22, 23], 'reading eyes lowered');

  const rawAtlas = Buffer.alloc(FRAME_SIZE * 4 * FRAME_SIZE * 4);
  [blinkDown, blinkRight, fileRaised, eyesLowered].forEach((frame, index) => copyFrame(rawAtlas, index * FRAME_SIZE, frame));
  const outputBuffer = await sharp(rawAtlas, { raw: { width: 96, height: 24, channels: 4 } })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  const counts = {
    blinkDown: changedPixels(down, blinkDown),
    blinkRight: changedPixels(right, blinkRight),
    fileRaised: changedPixels(down, fileRaised),
    eyesLowered: changedPixels(down, eyesLowered)
  };
  const expectedCounts = { blinkDown: 4, blinkRight: 2, fileRaised: 49, eyesLowered: 51 };
  if (JSON.stringify(counts) !== JSON.stringify(expectedCounts)) fail(`unexpected pixel diffs: ${JSON.stringify(counts)}`);
  assertAlphaUnchanged(down, blinkDown, 'blink down');
  assertAlphaUnchanged(right, blinkRight, 'blink right');
  assertAlphaUnchanged(down, fileRaised, 'reading file raised');
  assertAlphaUnchanged(down, eyesLowered, 'reading eyes lowered');
  const manifestText = `${JSON.stringify(manifestFor(counts, sha256(outputBuffer)), null, 2)}\n`;

  if (checkOnly) {
    if (!fs.existsSync(OUTPUT) || !fs.readFileSync(OUTPUT).equals(outputBuffer)) fail('generated PNG is stale');
    if (!fs.existsSync(MANIFEST) || fs.readFileSync(MANIFEST, 'utf8') !== manifestText) fail('generated manifest is stale');
    process.stdout.write(`Character Life frames verified: ${JSON.stringify(counts)}\n`);
    return;
  }

  fs.writeFileSync(OUTPUT, outputBuffer);
  fs.writeFileSync(MANIFEST, manifestText);
  process.stdout.write(`Built ${path.relative(ROOT, OUTPUT)} ${JSON.stringify(counts)}\n`);
}

main().catch(error => fail(error.stack || error.message));
