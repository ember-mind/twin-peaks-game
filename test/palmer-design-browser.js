#!/usr/bin/env node
'use strict';

// Bounded production-room acceptance, not a campaign or human quality test.
// Reuse the existing Act 4 probe's real keyboard/door helpers and CDP server.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launch } = require('./lib/chrome-cdp');
const pins = require('./fixtures/cast-pins-acts-1-4.json');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'artifacts/room-method-palmer/validation');
const results = [];

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await launch({ root, timeoutMs: 30000 });
  const call = (code) => browser.evaluate(`(async()=>{${code}})()`, true, 120000);
  const check = (name, value) => { results.push({ name, pass: !!value }); assert(value, name); };
  try {
    await browser.navigate('test/act-4-playthrough-probe.html');
    await browser.waitForTitle('TP-A4-BOOT');
    await call('for(let n=0;n<125;n++){if(window.A4&&A4.boot)return;await new Promise(r=>setTimeout(r,80));}throw new Error("probe boot timeout");');
    const boot = await call('return await A4.boot();');
    check('normal production boot, not narrativeTest mode', boot.mode === 'play' && !boot.testMode);
    await call('return await A4.travel("town",42,7,"up","test setup: canonical Palmer door approach");');
    let door = await call('return await A4.enterDoor(42,6,42,7);');
    check('enter from town by real keyboard door', door.ok && door.map === 'palmer');

    async function capture(name) {
      const data = await call(`
        const w=document.getElementById('product').contentWindow,g=w.GAME;
        await A4.wait(600);
        const canvas=w.document.getElementById('game');
        const probe=w.document.createElement('canvas');probe.width=256;probe.height=192;
        g.PalmerArt.draw(probe.getContext('2d'),0,0);
        const points=[[114,80],[136,89],[120,83]];
        return {size:[canvas.width,canvas.height],
          nativeMatches:points.every(([x,y])=>
            String(canvas.getContext('2d').getImageData(x,y,1,1).data)===
            String(probe.getContext('2d').getImageData(x,y,1,1).data)),
          png:canvas.toDataURL('image/png'),rows:g.Maps.palmer.rows,
          evening:!!g.Engine.state.flags.atto4};`);
      check(name + ': full native canvas', String(data.size) === '256,192');
      check(name + ': production sofa pixels match native art', data.nativeMatches);
      fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(data.png.split(',')[1], 'base64'));
      return data;
    }
    const day = await capture('production-day-entry');
    check('normal first visit is daytime', !day.evening);
    for (const target of ['rugCenter','coffeeSide','sideboard','nookSouth','stairFoot','landing','lauraDresser']) {
      const walked = await call(`
        const t=document.getElementById('product').contentWindow.GAME.PalmerScene.targets[${JSON.stringify(target)}];
        return await A4.walkTo(t.x,t.y);`);
      check('real keyboard route: ' + target, walked);
    }
    const sarah = await call('return await A4.reach(9,7);');
    check('Sarah can be reached from upstairs', sarah.ok);
    const talk = await call('return await A4.interact();');
    check('Sarah interaction uses rendered classic dialogue', (talk.rows || []).some((r) => r.kind === 'classic'));
    door = await call('return await A4.enterDoor(7,11,7,10);');
    check('leave through registry door by keyboard', door.ok && door.map === 'town');

    await call(`return await A4.seed(${JSON.stringify(pins.seeds.ACT4_AFTERNOON)});`);
    door = await call('return await A4.enterDoor(42,6,42,7);');
    check('re-enter after canonical Act 4 seed', door.ok && door.map === 'palmer');
    const evening = await capture('production-evening-entry');
    check('production reads canonical evening flag', evening.evening);
    check('state change does not move collision geometry', String(day.rows) === String(evening.rows));
    check('evening approach to Sarah remains open', (await call('return await A4.reach(9,7);')).ok);
    door = await call('return await A4.enterDoor(7,11,7,10);');
    check('evening exit remains traversable', door.ok && door.map === 'town');
    console.log(`PALMER-DESIGN-BROWSER ${results.length}/${results.length}: normal index.html boot, native-art pixel proof, keyboard routes, Sarah dialogue, registry doors and canonical evening re-entry`);
  } finally {
    fs.writeFileSync(path.join(output, 'palmer-browser.json'), JSON.stringify({
      source: 'index.html via existing act-4-playthrough-probe.html',
      seed: 'ACT4_AFTERNOON from test/fixtures/cast-pins-acts-1-4.json',
      setup: 'One explicit placement at town door approach; subsequent indoor movement and door crossings use keyboard helpers.',
      results, passed: results.filter((r) => r.pass).length, human: 'NOT_RUN'
    }, null, 2) + '\n');
    await browser.close();
  }
}
main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
