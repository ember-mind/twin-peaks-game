#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const beforeHashesPath = path.join(__dirname, 'protected-before.json');
const beforeGeometryPath = path.join(__dirname, 'geometry-before.json');
const outputPath = path.join(__dirname, 'preservation-report.json');

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const expectedHashes = JSON.parse(fs.readFileSync(beforeHashesPath, 'utf8'));
const protectedFiles = Object.entries(expectedHashes).map(([file, expected]) => {
  const actual = sha256(path.join(root, file));
  return { file, expected, actual, unchanged: actual === expected };
});

global.GAME = {};
delete require.cache[require.resolve(path.join(root, 'js/sheriffs-station-art.js'))];
delete require.cache[require.resolve(path.join(root, 'js/sheriffs-station-scene.js'))];
const art = require(path.join(root, 'js/sheriffs-station-art.js'));
const scene = require(path.join(root, 'js/sheriffs-station-scene.js'));
const currentGeometry = {
  props: art.props,
  rows: scene.map.rows,
  targets: scene.layout.targets
};
const expectedGeometry = JSON.parse(fs.readFileSync(beforeGeometryPath, 'utf8'));
const geometryUnchanged = JSON.stringify(currentGeometry) === JSON.stringify(expectedGeometry);

const report = {
  generatedAt: new Date().toISOString(),
  inputs: {
    protectedBefore: path.relative(root, beforeHashesPath),
    geometryBefore: path.relative(root, beforeGeometryPath)
  },
  protectedFiles,
  protectedFilesUnchanged: protectedFiles.every((entry) => entry.unchanged),
  geometryUnchanged,
  currentGeometry
};
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');

assert.equal(report.protectedFilesUnchanged, true, 'all protected file hashes remain unchanged');
assert.deepEqual(currentGeometry, expectedGeometry, 'prop metadata, rows, and targets remain unchanged');
console.log(JSON.stringify({
  status: 'pass',
  protectedFiles: protectedFiles.length,
  protectedFilesUnchanged: true,
  geometryUnchanged: true,
  report: path.relative(root, outputPath)
}));
