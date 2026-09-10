#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/opt/homebrew/lib/node_modules/coldstage/node_modules/sharp');

const root = path.resolve(__dirname, '../../..');
const artifactDir = path.resolve(__dirname, '..');
const sourcePath = path.join(artifactDir, 'native-after.png');
const outputPath = path.join(artifactDir, 'native-after-256.png');
const expectedWidth = 1280;
const expectedHeight = 960;
const blockSize = 5;
const nativeWidth = 256;
const nativeHeight = 192;

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

(async () => {
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([info.width, info.height, info.channels], [expectedWidth, expectedHeight, 4], 'clean capture is 1280x960 RGBA');
  const native = Buffer.alloc(nativeWidth * nativeHeight * 4);
  let verifiedBlocks = 0;
  for (let nativeY = 0; nativeY < nativeHeight; nativeY += 1) {
    for (let nativeX = 0; nativeX < nativeWidth; nativeX += 1) {
      const sourceX = nativeX * blockSize;
      const sourceY = nativeY * blockSize;
      const firstOffset = (sourceY * expectedWidth + sourceX) * 4;
      const nativeOffset = (nativeY * nativeWidth + nativeX) * 4;
      for (let channel = 0; channel < 4; channel += 1) native[nativeOffset + channel] = data[firstOffset + channel];
      for (let dy = 0; dy < blockSize; dy += 1) {
        for (let dx = 0; dx < blockSize; dx += 1) {
          const offset = ((sourceY + dy) * expectedWidth + sourceX + dx) * 4;
          for (let channel = 0; channel < 4; channel += 1) {
            assert.equal(data[offset + channel], data[firstOffset + channel], `nonuniform 5x5 block at native ${nativeX},${nativeY}`);
          }
        }
      }
      verifiedBlocks += 1;
    }
  }
  assert.equal(verifiedBlocks, nativeWidth * nativeHeight, 'every native pixel block verified');
  await sharp(native, { raw: { width: nativeWidth, height: nativeHeight, channels: 4 } }).png().toFile(outputPath);
  const outputInfo = await sharp(outputPath).metadata();
  assert.deepEqual([outputInfo.width, outputInfo.height], [nativeWidth, nativeHeight], 'exact native output dimensions');
  const report = {
    generatedAt: new Date().toISOString(),
    method: 'Verified each clean-capture 5x5 RGBA block is uniform, then copied its top-left pixel into the 256x192 framebuffer. No resize filter was used.',
    source: path.relative(root, sourcePath),
    sourceSha256: sha256(sourcePath),
    sourceDimensions: { width: expectedWidth, height: expectedHeight, channels: 4 },
    blockSize,
    verifiedBlocks,
    allBlocksUniform: true,
    output: path.relative(root, outputPath),
    outputSha256: sha256(outputPath),
    outputDimensions: { width: nativeWidth, height: nativeHeight }
  };
  fs.writeFileSync(path.join(__dirname, 'pixel-audit.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'pass', verifiedBlocks, allBlocksUniform: true, output: report.output }));
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
