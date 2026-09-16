'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-campaign-report-'));
try {
  const out = path.join(tmp, 'existing');
  fs.mkdirSync(out);
  const before = { 'campaign.json': '{"sentinel":"prior campaign"}\n', 'session.json': '{"sentinel":"prior session"}\n' };
  for (const [name, value] of Object.entries(before)) fs.writeFileSync(path.join(out, name), value);
  const result = spawnSync(process.execPath, [path.join(root, 'test/campaign-playthrough.js')], {
    encoding: 'utf8', timeout: 10000,
    // Executable discovery succeeds, but the existing output must be refused
    // BEFORE a browser process can launch. This is a Node-only fixture.
    env: { ...process.env, CHROME_BIN: process.execPath, CAMPAIGN_OUT: out }
  });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /EEXIST/);
  for (const [name, value] of Object.entries(before)) assert.equal(fs.readFileSync(path.join(out, name), 'utf8'), value);
  assert.deepEqual(fs.readdirSync(out).sort(), Object.keys(before).sort());
  const absent = path.join(tmp, 'not-created');
  const missing = spawnSync(process.execPath, [path.join(root, 'test/campaign-playthrough.js')], {
    encoding: 'utf8', timeout: 10000,
    env: { ...process.env, CHROME_BIN: path.join(tmp, 'no-browser'), CAMPAIGN_OUT: absent }
  });
  assert.equal(missing.status, 1, missing.stderr);
  assert.equal(fs.existsSync(absent), false);
  console.log('campaign-report-safety: existing evidence and preflight failures preserved; no browser run claimed');
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
