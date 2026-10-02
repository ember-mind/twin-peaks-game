'use strict';

// Review evidence only. The production page and renderer are unmodified.
// Placements are explicit diagnostic setups, not a campaign walkthrough.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { launch } = require('../test/lib/chrome-cdp');
const outputRoot = path.resolve(__dirname, '../.gauntlet/tv-recognition/evidence');
const sourceRoot = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const label = process.argv[3] || 'main';
const pins = require(path.join(sourceRoot, 'test/fixtures/cast-pins-acts-1-4.json'));
const shots = [
  ['diner', 'diner', 6, 8, 'ACT1_TOWN'],
  ['sheriff', 'sheriff', 7, 10, 'ACT1_TOWN'],
  ['palmer-day', 'palmer', 7, 10, 'ACT1_TOWN'],
  ['hotel-lobby', 'hotel_gn', 9, 10, 'ACT2_DAY2'],
  ['room-315', 'room_315', 7, 10, 'ACT2_DAY2'],
  ['redroom', 'redroom', 8, 9, 'ACT1_TOWN'],
  ['oej', 'oej', 8, 8, 'ACT3_OEJ'],
  ['roadhouse', 'roadhouse', 7, 8, 'ACT4_EVENING_GATHERING'],
  ['palmer-evening', 'palmer', 7, 10, 'ACT4_AFTERNOON'],
  ['double-r-exterior', 'double_r_exterior_prototype', 6, 10, 'ACT1_TOWN'],
  ['sheriff-exterior', 'sheriffs_station_exterior', 7, 10, 'ACT1_TOWN'],
  ['great-northern-exterior', 'town', 9, 8, 'ACT2_DAY2'],
  ['grove', 'woods', 13, 13, 'ACT5_THRESHOLD']
];

async function main() {
  const only = process.argv[4];
  const selected = only ? shots.filter(row => row[0] === only) : shots;
  if (!selected.length) throw new Error('Unknown shot: ' + only);
  const output = path.join(outputRoot, label);
  fs.mkdirSync(output, { recursive: true });
  const browser = await launch({ root: sourceRoot, timeoutMs: 35000 });
  const call = code => browser.evaluate(`(async()=>{${code}})()`, true, 120000);
  const records = [];
  try {
    await browser.navigate('test/act-4-playthrough-probe.html');
    await browser.waitForTitle('TP-A4-BOOT');
    await call('for(let n=0;n<150;n++){if(window.A4&&A4.boot)return;await new Promise(r=>setTimeout(r,80));}throw Error("probe unavailable");');
    await call('return await A4.boot();');
    for (const [id, map, x, y, seed] of selected) {
      // Fresh boot avoids accumulated story flags across diagnostic scenes.
      if (records.length) await call('return await A4.boot();');
      if (seed !== 'ACT1_TOWN') await call(`return await A4.seed(${JSON.stringify(pins.seeds[seed])});`);
      const data = await call(`
        const w=document.getElementById('product').contentWindow,g=w.GAME;
        if(g.Maps.isSolid(${JSON.stringify(map)},${x},${y}))throw Error('Blocked capture placement');
        await A4.travel(${JSON.stringify(map)},${x},${y},'up','explicit visual audit setup');
        await A4.wait(900);
        const c=w.document.getElementById('game'),s=g.Engine.state;
        if(s.mode!=='play'||s.mapId!==${JSON.stringify(map)})throw Error('Capture state mismatch');
        return {png:c.toDataURL('image/png'),size:[c.width,c.height],map:s.mapId,dialogueOpen:!!s.dialogue,
          player:{x:s.player.tx,y:s.player.ty,dir:s.player.dir},flags:s.flags,
          narrativeTest:g.NarrativeProduction.testMode,
          actors:(g.Maps[${JSON.stringify(map)}].npcs||[]).map(n=>({id:n.id,x:n.x,y:n.y}))};`);
      if (String(data.size) !== '256,192' || data.narrativeTest) throw new Error('Wrong production canvas or boot');
      const bytes = Buffer.from(data.png.split(',')[1], 'base64');
      const file = path.join(output, id + '.png');
      fs.writeFileSync(file, bytes);
      delete data.png;
      records.push({ id, label, seed, sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:sourceRoot,encoding:'utf8'}).trim(),
        file:path.relative(outputRoot,file),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
        capturedAt:new Date().toISOString(),placement:'explicit diagnostic loadMap at verified walkable cell',...data });
      console.log(label + '/' + id + ' 256x192 production canvas');
    }
  } finally {
    fs.writeFileSync(path.join(output, (only || 'all') + '-capture.json'), JSON.stringify({
      source:'index.html via existing act-4-playthrough-probe.html',
      camera:'production camera; diagnostic placements, not proved entry routes',
      timing:'900ms settle; ambient phase is not frozen; no temporal claims',records
    },null,2)+'\n');
    await browser.close();
  }
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
