'use strict';
const assert = require('node:assert/strict');
const { pathTo, nextMap, unlocked, createPlayer } = require('./lib/campaign-player.js');
const source = require('node:fs').readFileSync(require.resolve('./lib/campaign-player.js'), 'utf8');
const s = { mapId: 'a', player: { tx: 0, ty: 1 }, flags: {}, clues: [],
  map: { solid: ['0000', '0000', '0000'] }, liveNpcs: [{x:1,y:1}],
  doors: { a: { '3,1': { to: 'b' } }, b: {'0,1':{to:'c',needsFlag:'ready'}} } };
assert.deepEqual(pathTo(s,0,1), []);
assert.equal(pathTo(s,1,1), null);
assert.equal(pathTo(s,3,1), null);
assert.equal(pathTo(s,3,1,true).length,5);
assert.equal(nextMap(s,'b'),'b');
assert.throws(()=>nextMap(s,'c'),/No unlocked/);
assert.equal(unlocked({needsClues:1},s),false);
s.flags.ready=true;
assert.equal(nextMap(s,'c'),'b');
const api = createPlayer({snapshot:()=>s});
assert.equal(api.travel,undefined);
assert.equal(api.seed,undefined);
assert.equal(api.evaluate,undefined);
assert.ok(!/\b(?:loadMap|applyEffects|commitNode|setState)\s*\(/.test(source));
// A queued direction is movement, not a reliable turn-in-place. The final
// approach must end with the intended facing without standing on the target.
s.player.dir = 'right';
const oriented = pathTo(s, 0, 1, false, 'down');
assert.ok(oriented.length > 0);
assert.deepEqual(oriented.at(-1), [0, 1]);
assert.deepEqual(oriented.at(-2), [0, 0]);
assert.deepEqual(pathTo(s, 0, 1, false, 'right'), []);
console.log('campaign-player: 16 contracts passed; no browser or game completion claimed');
