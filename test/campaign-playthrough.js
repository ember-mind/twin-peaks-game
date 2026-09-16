#!/usr/bin/env node
'use strict';

/* Unseeded production journey, including the actual final epilogue. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { openPlayableBrowser } = require('./lib/playable-browser.js');
const { createPlayer } = require('./lib/campaign-player.js');
const completeCampaign = require('./lib/campaign-acts.js');
const { createRecovery } = require('./lib/campaign-recovery.js');
const ROOT = path.resolve(__dirname, '..');
async function main() {
  const output = path.resolve(process.env.CAMPAIGN_OUT || path.join(ROOT, 'artifacts', 'playable-build-01', String(Date.now())));
  const events = [], checkpoints = [];
  const withRecovery = process.env.CAMPAIGN_RECOVERY === '1';
  if (process.env.CAMPAIGN_RECOVERY && !['0', '1'].includes(process.env.CAMPAIGN_RECOVERY)) {
    throw new Error('CAMPAIGN_RECOVERY must be 0 or 1');
  }
  let b, recovery, error = null;
  try {
    b = await openPlayableBrowser({ root: ROOT, outputDir: output,
      noSandbox: process.env.CHROME_NO_SANDBOX === '1' });
    const p = createPlayer(b, (e) => { events.push(e); if (e.type !== 'page') console.log(JSON.stringify(e)); });
    recovery = withRecovery ? createRecovery(p, b, (e) => { events.push(e); console.log(JSON.stringify(e)); }) : null;
    async function checkpoint(name, predicate) {
      const s = await b.waitFor(name, predicate);
      checkpoints.push({ name, map: s.mapId, flags: s.flags, objective: s.semanticUi.objective });
      await b.capture(name); console.log('CHECKPOINT ' + name);
      if (recovery) await recovery.checkpoint(name);
    }
    await p.start();
    await checkpoint('new-game', (s) => s.mode === 'play' && !s.flags.sogno_fatto);
    await p.actor('sheriff', 'truman');
    await checkpoint('diary-earned', (s) => s.clues.includes('diario'));
    await p.go('palmer'); await p.reach(6, 1); await p.interact();
    await checkpoint('opening-evidence', (s) => s.clues.includes('lettera_r') && s.clues.length >= 3);
    await p.go('woods'); await p.go('redroom');
    await p.actor('redroom', 'mfap'); await p.actor('redroom', 'laura');
    await checkpoint('dream-complete', (s) => !!s.flags.sogno_fatto);
    await p.go('room_315');
    await checkpoint('physical-awakening', (s) => s.mapId === 'room_315' && !!s.flags.sogno_fatto);
    await p.actor('sheriff', 'truman');
    await checkpoint('act2-entry', (s) => !!(s.narrative && s.narrative.flags.sogno_raccontato));
    await completeCampaign(p, checkpoint, b);
    assert.equal(checkpoints.at(-1).name, 'title-after-ending');
    if (recovery) recovery.finish();
  } catch (e) {
    error = String(e.stack || e); console.error(error);
    if (b) { try { await b.capture('failure'); } catch (_) {} }
    process.exitCode = 1;
  } finally {
    // Startup failure must not overwrite an existing run's report.
    if (b) {
      try { await b.close(); } catch (e) {
        process.exitCode = 1; error = (error || '') + '\nCleanup failed: ' + String(e.stack || e);
      }
      const session = await fs.readFile(path.join(output, 'session.json'), 'utf8').then(JSON.parse).catch(() => null);
      const faults = session ? session.faults.filter((f) => !(f.type === 'http' && f.status === 404 && new URL(f.url).pathname === '/favicon.ico')) : [];
      if (!session || faults.length) {
        process.exitCode = 1;
        if (!error) error = session ? 'Unexpected browser faults: ' + JSON.stringify(faults) : 'Missing browser session evidence';
      }
      const report = { milestone: 'New Game through final epilogue and return to title', automated: error ? 'FAIL' : 'PASS',
        fullCampaign: error ? 'FAIL' : 'PASS', humanPlaytest: 'NOT_RUN', source: session && session.metadata.source,
        recovery: { status: withRecovery ? (error ? 'FAIL' : 'PASS') : 'NOT_RUN',
          checks: recovery ? recovery.results() : [] },
        checkpoints, error, faults, events };
      await fs.writeFile(path.join(output, 'campaign.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
      console.log('CAMPAIGN-MILESTONE ' + report.automated + ' (unseeded full route; human playtest NOT_RUN)');
      console.log('Evidence: ' + output);
    }
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
