#!/usr/bin/env node
'use strict';

/* Normal production browser. Progress is earned through real input.
 * Default is the opening milestone; --full must finish the actual epilogue.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { openPlayableBrowser } = require('./lib/playable-browser.js');
const { createPlayer } = require('./lib/campaign-player.js');
const ROOT = path.resolve(__dirname, '..');
async function main() {
  const full = process.argv.includes('--full');
  if (process.argv.slice(2).some((a) => a !== '--full')) throw new Error('usage: node test/campaign-playthrough.js [--full]');
  const output = path.resolve(process.env.CAMPAIGN_OUT || path.join(ROOT, 'artifacts', 'playable-build-01', String(Date.now())));
  const events = [], checkpoints = [];
  let b, error = null;
  try {
    b = await openPlayableBrowser({ root: ROOT, outputDir: output,
      noSandbox: process.env.CHROME_NO_SANDBOX === '1' });
    const p = createPlayer(b, (e) => { events.push(e); if (e.type !== 'page') console.log(JSON.stringify(e)); });
    async function checkpoint(name, predicate) {
      const s = await b.waitFor(name, predicate);
      checkpoints.push({ name, map: s.mapId, flags: s.flags, objective: s.semanticUi.objective });
      await b.capture(name); console.log('CHECKPOINT ' + name);
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
    assert.ok(checkpoints.length >= 6);
    if (full) await require('./lib/campaign-full-route.js').runFullRoute(p, checkpoint);
  } catch (e) {
    error = String(e.stack || e); console.error(error);
    if (b) { try { await b.capture('failure'); } catch (_) {} }
    process.exitCode = 1;
  } finally {
    if (b) await b.close();
    await fs.mkdir(output, { recursive: true });
    const session = await fs.readFile(path.join(output, 'session.json'), 'utf8').then(JSON.parse).catch(() => null);
    const faults = session ? session.faults.filter((f) => !(f.type === 'http' && f.status === 404 && new URL(f.url).pathname === '/favicon.ico')) : [];
    if (faults.length) { process.exitCode = 1; if (!error) error = 'Unexpected browser faults: ' + JSON.stringify(faults); }
    const report = { milestone: full ? 'New Game through final epilogue and return to title' : 'New Game to Act 2 entry', automated: error ? 'FAIL' : 'PASS',
      fullCampaign: full ? (error ? 'FAIL' : 'PASS') : 'NOT_RUN', humanPlaytest: 'NOT_RUN', source: session && session.metadata.source,
      checkpoints, error, faults, events };
    await fs.writeFile(path.join(output, 'campaign.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('CAMPAIGN-MILESTONE ' + report.automated + ' (full campaign ' + report.fullCampaign + ')');
    console.log('Evidence: ' + output);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
