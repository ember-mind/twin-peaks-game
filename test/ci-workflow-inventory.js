#!/usr/bin/env node
'use strict';

/* CI workflow inventory and consolidation gate.
 *
 *   node test/ci-workflow-inventory.js --inventory
 *     Prints one TAB-separated line per workflow `run:` command:
 *       <workflow-file>\t<job>\t<normalised-command>
 *     Multi-line `run: |` blocks are split into one command per line. The one
 *     JSON-formatted workflow (notebook-touch.yml) is parsed as JSON.
 *
 *   node test/ci-workflow-inventory.js
 *     Gate mode. Fails if any workflow file besides .github/workflows/tests.yml
 *     and .github/workflows/browser.yml exists, or if any command recorded in
 *     reports/ci-inventory-before.txt is missing from the live workflows.
 *
 * No dependencies: a small line parser for YAML, JSON.parse for the JSON file.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const WORKFLOW_DIR = path.join(ROOT, '.github/workflows');
const BEFORE = path.join(ROOT, 'reports/ci-inventory-before.txt');
const CONSOLIDATED = ['browser.yml', 'tests.yml'];

function normalise(command) {
  return command.replace(/\s+/g, ' ').trim();
}

function parseJsonWorkflow(text, file) {
  const data = JSON.parse(text);
  const entries = [];
  for (const [job, definition] of Object.entries(data.jobs || {})) {
    for (const step of (definition && definition.steps) || []) {
      if (typeof step.run !== 'string') continue;
      for (const line of step.run.split(/\r?\n/)) {
        if (line.trim()) entries.push({ file, job, command: normalise(line) });
      }
    }
  }
  return entries;
}

function parseYamlWorkflow(text, file) {
  const lines = text.split(/\r?\n/);
  const entries = [];
  let currentJob = null;
  let inJobs = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) {
      inJobs = /^jobs:\s*$/.test(line);
      currentJob = inJobs ? currentJob : null;
      continue;
    }
    const job = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (inJobs && job) { currentJob = job[1]; continue; }
    const run = /^(\s+)(?:-\s+)?run:\s*(.*?)\s*$/.exec(line);
    if (!run) continue;
    const indent = run[1].length;
    const value = run[2];
    if (/^[|>]/.test(value)) {
      for (let j = i + 1; j < lines.length; j++) {
        const body = lines[j];
        if (body.trim() === '') continue;
        const bodyIndent = body.length - body.replace(/^\s*/, '').length;
        if (bodyIndent <= indent) break;
        entries.push({ file, job: currentJob || '(unknown)', command: normalise(body) });
        i = j;
      }
      continue;
    }
    entries.push({ file, job: currentJob || '(unknown)', command: normalise(value) });
  }
  return entries;
}

function parseWorkflow(file) {
  const text = fs.readFileSync(path.join(WORKFLOW_DIR, file), 'utf8');
  return text.trimStart().startsWith('{') ? parseJsonWorkflow(text, file) : parseYamlWorkflow(text, file);
}

function inventory() {
  const files = fs.readdirSync(WORKFLOW_DIR).filter((name) => /\.ya?ml$/i.test(name)).sort();
  const entries = [];
  for (const file of files) entries.push(...parseWorkflow(file));
  return entries;
}

function readBefore() {
  const lines = fs.readFileSync(BEFORE, 'utf8').split(/\r?\n/).filter((line) => line.length);
  return lines.map((line) => line.split('\t').slice(2).join('\t'));
}

function gate() {
  const files = fs.readdirSync(WORKFLOW_DIR).filter((name) => /\.ya?ml$/i.test(name)).sort();
  const problems = [];
  const extras = files.filter((name) => !CONSOLIDATED.includes(name));
  if (extras.length) problems.push('unexpected workflow file(s): ' + extras.join(', '));
  for (const name of CONSOLIDATED) if (!files.includes(name)) problems.push('missing consolidated workflow: ' + name);

  const afterCommands = new Set(inventory().map((entry) => entry.command));
  const before = [...new Set(readBefore())];
  const missing = before.filter((command) => !afterCommands.has(command));
  if (missing.length) problems.push('missing command(s):\n  ' + missing.join('\n  '));

  console.log(`workflows: ${files.join(', ')}`);
  console.log(`commands: before ${before.length} distinct, after ${afterCommands.size} distinct`);
  if (problems.length) {
    console.error('\nCI workflow consolidation gate FAILED\n' + problems.join('\n'));
    return 1;
  }
  console.log('CI workflow consolidation gate PASS');
  return 0;
}

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--inventory') {
  for (const entry of inventory()) console.log(`${entry.file}\t${entry.job}\t${entry.command}`);
} else if (args.length === 0) {
  process.exitCode = gate();
} else {
  console.error('Usage: node test/ci-workflow-inventory.js [--inventory]');
  process.exitCode = 2;
}
