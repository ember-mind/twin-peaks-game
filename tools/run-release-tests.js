#!/usr/bin/env node
'use strict';

/* Run the single-file Node commands maintained by test.yml. This is a strict
 * reader of the workflow's current command subset, not a general YAML parser.
 * Unsupported commands fail loudly instead of silently dropping test gates.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function commandsFromWorkflow(text) {
  const commands = [];
  for (const line of text.split(/\r?\n/)) {
    // GitHub permits both a named step followed by run: and an unnamed - run:.
    const run = /^\s+(?:-\s+)?run:\s*(.*?)\s*$/.exec(line);
    if (!run) continue;
    const match = /^node (test\/[A-Za-z0-9_./-]+\.js)$/.exec(run[1]);
    if (!match || match[1].split('/').some((s) => s === '..' || s === '.' || !s)) throw new Error('Unsupported release command: ' + run[1]);
    if (commands.includes(match[1])) throw new Error('Duplicate release command: ' + match[1]);
    commands.push(match[1]);
  }
  if (!commands.length) throw new Error('No release commands found');
  return commands;
}
function runRelease({ root, out, timeoutMs = 180000 }) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 600000) throw new Error('timeoutMs must be 100..600000');
  root = fs.realpathSync(root);
  const workflow = path.join(root, '.github/workflows/test.yml');
  const commands = commandsFromWorkflow(fs.readFileSync(workflow, 'utf8'));
  for (const name of commands) {
    const file = fs.realpathSync(path.join(root, name));
    const relative = path.relative(path.join(root, 'test'), file);
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error('Test escapes repository: ' + name);
  }
  const git = (...args) => {
    const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
    return r.status === 0 ? r.stdout.trim() : null;
  };
  const report = { format: 'release-node-run', version: 1, source: git('rev-parse', 'HEAD'),
    dirty: git('status', '--porcelain'), node: process.version, startedAt: new Date().toISOString(),
    workflow: '.github/workflows/test.yml', automatedNode: 'RUNNING', campaign: 'NOT_RUN', human: 'NOT_RUN', results: [] };
  out = path.resolve(out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.mkdirSync(out);
  const save = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  save();
  for (const [i, file] of commands.entries()) {
    const started = Date.now();
    const r = spawnSync(process.execPath, [file], { cwd: root, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 });
    const log = `${String(i + 1).padStart(3, '0')}-${path.basename(file)}.log`;
    fs.writeFileSync(path.join(out, log), (r.stdout || '') + (r.stderr || ''));
    const result = { file, status: r.status === 0 && !r.error ? 'PASS' : 'FAIL', exitCode: r.status,
      signal: r.signal || null, error: r.error ? r.error.message : null, elapsedMs: Date.now() - started, log };
    report.results.push(result); save();
    console.log(`${result.status} ${file}`);
  }
  report.automatedNode = report.results.every((r) => r.status === 'PASS') ? 'PASS' : 'FAIL';
  report.finishedAt = new Date().toISOString(); save();
  return report;
}
function main(args) {
  const root = path.resolve(__dirname, '..');
  if (args.length === 1 && args[0] === '--list') {
    console.log(commandsFromWorkflow(fs.readFileSync(path.join(root, '.github/workflows/test.yml'), 'utf8')).join('\n'));
    return;
  }
  let out, timeoutMs = 180000;
  for (const arg of args) {
    if (arg.startsWith('--out=') && !out) out = arg.slice(6);
    else if (arg.startsWith('--timeout-ms=')) timeoutMs = Number(arg.slice(13));
    else throw new Error('Usage: node tools/run-release-tests.js --list | --out=<new-directory> [--timeout-ms=180000]');
  }
  if (!out) throw new Error('--out must name a new evidence directory');
  const report = runRelease({ root, out, timeoutMs });
  console.log(`${report.automatedNode}: ${report.results.filter((r) => r.status === 'PASS').length}/${report.results.length} Node commands. Campaign and human tests NOT_RUN.`);
  if (report.automatedNode !== 'PASS') process.exitCode = 1;
}
module.exports = { commandsFromWorkflow, runRelease };
if (require.main === module) { try { main(process.argv.slice(2)); } catch (e) { console.error(e.stack || e); process.exitCode = 1; } }
