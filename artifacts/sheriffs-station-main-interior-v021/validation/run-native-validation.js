#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../../..');
const commands = [
  ['node', ['test/sheriffs-station-native.js'], '01-sheriffs-station-native.log'],
  ['node', ['test/sheriffs-station-native.js', '--audit-frozen'], '02-sheriffs-station-audit-frozen.log'],
  ['node', ['test/smoke.js'], '03-smoke.log'],
  ['node', ['test/walkthrough.js'], '04-walkthrough.log'],
  ['node', ['test/world-engine-v0.1-catalog.js'], '05-world-catalog.log']
];
const startedAt = new Date().toISOString();
const results = [];

for (const [program, args, logName] of commands) {
  const command = [program, ...args].join(' ');
  const commandStartedAt = new Date().toISOString();
  const start = process.hrtime.bigint();
  const run = spawnSync(program, args, { cwd: root, encoding: 'utf8' });
  const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
  const output = (run.stdout || '') + (run.stderr || '');
  fs.writeFileSync(path.join(__dirname, logName), output);
  process.stdout.write(`$ ${command}\n${output}`);
  const result = {
    command,
    startedAt: commandStartedAt,
    durationMs: Math.round(durationMs),
    exitCode: run.status,
    signal: run.signal,
    log: path.posix.join('artifacts/sheriffs-station-main-interior-v021/validation', logName)
  };
  results.push(result);
  if (run.status !== 0) break;
}

const report = {
  startedAt,
  finishedAt: new Date().toISOString(),
  workingDirectory: root,
  commands: results,
  allPassed: results.length === commands.length && results.every((result) => result.exitCode === 0)
};
fs.writeFileSync(path.join(__dirname, 'native-results.json'), JSON.stringify(report, null, 2) + '\n');
if (!report.allPassed) process.exitCode = 1;
