#!/usr/bin/env node
'use strict';

/* test/props-render-order.js — js/props-production.js draws the registry deterministically.
 *
 * Three overlapping fake instances prove the exact order: layer, then anchor foot y, then instance id. A recording
 * 2D context captures every drawImage call, so the assertion is on the real draw sequence, not on a sort helper.
 * Also covers: the GAME.PROPS_ENABLED flag (off => nothing drawn), a scene with no instances (no-op), integer
 * scale with imageSmoothingEnabled = false, the flip origin, the camera offset, and the promise that no map row,
 * door or interact key is written.
 */

const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
let pass = 0;
function ok(cond, label, detail) { assert.ok(cond, label + (detail ? ' :: ' + detail : '')); pass++; }

global.window = global;
global.GAME = global.GAME || {};
global.Image = function () { this.width = 0; this.height = 0; };
require(path.join(ROOT, 'js', 'props.gen.js'));
const Props = require(path.join(ROOT, 'js', 'props-production.js'));

const ATLAS = 'assets/fake/atlas.png';
function recorder() {
  const calls = [];
  const ctx = {
    imageSmoothingEnabled: true,
    _t: [0, 0], _s: [1, 1],
    save() { calls.push({ op: 'save' }); },
    restore() { calls.push({ op: 'restore' }); },
    translate(x, y) { this._t = [x, y]; },
    scale(x, y) { this._s = [x, y]; },
    drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
      calls.push({ op: 'draw', frame: [sx, sy, sw, sh], dest: [dx, dy, dw, dh],
        smoothing: ctx.imageSmoothingEnabled, t: this._t.slice(), s: this._s.slice() });
      this._t = [0, 0]; this._s = [1, 1];
    }
  };
  return { ctx, calls, draws: () => calls.filter((c) => c.op === 'draw') };
}
const img = new global.Image(); img.width = 256; img.height = 96;
/* A flipped instance is drawn at 0,0 inside a translate + scale(-1, 1); an unflipped one at its destination.
 * Both describe the same top-left origin on the scene canvas. */
const originsOf = (rec) => rec.draws().map((d) => d.s[0] === -1 ? [d.t[0] - d.frame[2], d.t[1]] : [d.dest[0], d.dest[1]]);

// Three instances that overlap on the same tiles; each pair is separated by exactly one tie-breaker.
//   fake-c: layer 2                       -> last (layer wins over a lower foot)
//   fake-a / fake-b: layer 1, same foot   -> instance id breaks the tie (fake-a before fake-b)
//   fake-d: layer 1, lower foot           -> before both (foot breaks the tie before the id does)
const FAKE = {
  version: 1,
  tilePx: 16,
  scenes: { fakescene: { canvas: [256, 192] }, emptyscene: { canvas: [256, 192] } },
  definitions: {
    'fake.block': { label: 'Block', atlas: ATLAS, frame: [160, 48, 18, 30], anchor: [9, 28], footprint: [[0, 0]], defaultLayer: 1, tags: ['fake'], transforms: ['flipX'] },
    'fake.high': { label: 'High', atlas: ATLAS, frame: [0, 0, 112, 46], anchor: [56, 44], footprint: [[0, 0]], defaultLayer: 2, tags: ['fake'], transforms: [] }
  },
  instances: {
    'fake-b': { propId: 'fake.block', sceneId: 'fakescene', tx: 5.3125, ty: 7.25 },
    'fake-c': { propId: 'fake.high', sceneId: 'fakescene', tx: 5, ty: 4 },
    'fake-a': { propId: 'fake.block', sceneId: 'fakescene', tx: 5.5625, ty: 7.25 },
    'fake-d': { propId: 'fake.block', sceneId: 'fakescene', tx: 5.3125, ty: 6.25, flipX: true }
  }
};
Props._setRegistry(FAKE);
Props._setAtlas(ATLAS, img);

// ---- the flag: off by default, nothing drawn ---------------------------------------------------------------
ok(global.GAME.PROPS_ENABLED === false, 'GAME.PROPS_ENABLED defaults to false');
{
  const r = recorder();
  ok(Props.drawScene(r.ctx, 'fakescene', 0, 0) === 0 && r.calls.length === 0, 'flag off: not one call on the context');
}

global.GAME.PROPS_ENABLED = true;

// ---- the exact draw order ----------------------------------------------------------------------------------
{
  const r = recorder();
  const drawn = Props.drawScene(r.ctx, 'fakescene', 0, 0);
  ok(drawn === 4, 'four instances drawn', String(drawn));
  const order = Props.instancesFor('fakescene').map((e) => e.id);
  ok(JSON.stringify(order) === JSON.stringify(['fake-d', 'fake-a', 'fake-b', 'fake-c']),
    'order is layer, then anchor foot y, then instance id', order.join(','));
  /* Where each instance landed. A flipped instance is drawn at 0,0 inside a translate + scale(-1, 1), so its
   * origin is read from the translate; an unflipped one from the destination rectangle. Both are the same rule:
   * left = round(tx * 16) - (flipX ? frame.w - anchor.x : anchor.x), top = round(ty * 16) - anchor.y. */
  const origins = originsOf(r).map((o) => o.join(','));
  ok(JSON.stringify(origins) === JSON.stringify([
    (Math.round(5.3125 * 16) - (18 - 9)) + ',' + (Math.round(6.25 * 16) - 28), // fake-d, flipped anchor
    (Math.round(5.5625 * 16) - 9) + ',' + (Math.round(7.25 * 16) - 28),                        // fake-a
    (Math.round(5.3125 * 16) - 9) + ',' + (Math.round(7.25 * 16) - 28),                        // fake-b
    (Math.round(5 * 16) - 56) + ',' + (Math.round(4 * 16) - 44)                                // fake-c
  ]), 'every origin is the anchor rule applied, in draw order', origins.join(' | '));
  ok(Props.instancesFor('fakescene').every((e, i) => {
    const o = Props.originOf(e);
    return origins[i] === o.left + ',' + o.top;
  }), 'originOf agrees with what reached the context');
  ok(r.draws().every((d) => d.smoothing === false), 'imageSmoothingEnabled is false on every draw');
  ok(r.draws().every((d) => d.frame.every(Number.isInteger) && d.dest.every(Number.isInteger)), 'source and destination are integers (integer scale)');
  ok(r.draws().every((d, i) => d.dest[2] === (i === 3 ? 112 : 18) && d.dest[3] === (i === 3 ? 46 : 30)), 'frames are drawn 1:1, never scaled');
  ok(r.calls.filter((c) => c.op === 'save').length === 4 && r.calls.filter((c) => c.op === 'restore').length === 4, 'every draw is save/restore balanced');
}

// ---- flip, camera offset, empty scene, missing atlas --------------------------------------------------------
{
  const r = recorder();
  Props.drawScene(r.ctx, 'fakescene', 0, 0);
  const flipped = r.draws()[0]; // fake-d
  ok(JSON.stringify(flipped.s) === JSON.stringify([-1, 1]), 'a flipped instance is drawn with scale(-1, 1)', JSON.stringify(flipped.s));
  ok(flipped.t[0] === Math.round(5.3125 * 16) - (18 - 9) + 18, 'the flip translates by the frame width so the box is unchanged', JSON.stringify(flipped.t));
  ok(r.draws().slice(1).every((d) => JSON.stringify(d.s) === JSON.stringify([1, 1])), 'unflipped instances are not mirrored');
}
{
  const a = recorder(), b = recorder();
  Props.drawScene(a.ctx, 'fakescene', 0, 0);
  Props.drawScene(b.ctx, 'fakescene', 32, 16);
  const oa = originsOf(a), ob = originsOf(b);
  ok(oa.length === 4 && oa.every((o, i) => o[0] - ob[i][0] === 32 && o[1] - ob[i][1] === 16),
    'the camera offset shifts every origin by exactly cx, cy');
}
{
  const r = recorder();
  ok(Props.drawScene(r.ctx, 'emptyscene', 0, 0) === 0 && r.calls.length === 0, 'a scene with no instances is a no-op');
  ok(Props.drawScene(r.ctx, 'no-such-scene', 0, 0) === 0 && r.calls.length === 0, 'an unknown scene is a no-op');
}
{
  const r = recorder();
  Props._setAtlas(ATLAS, null);
  ok(Props.drawScene(r.ctx, 'fakescene', 0, 0) === 0 && r.calls.length === 0, 'an undecoded atlas draws nothing, never a placeholder');
  Props._setAtlas(ATLAS, img);
}
{
  // a missing definition is a validation error in tools/world-apply.js; the runtime skips it rather than guessing
  const broken = JSON.parse(JSON.stringify(FAKE));
  broken.instances['fake-e'] = { propId: 'fake.nope', sceneId: 'fakescene', tx: 1, ty: 1 };
  Props._setRegistry(broken);
  Props._setAtlas(ATLAS, img);
  const r = recorder();
  ok(Props.drawScene(r.ctx, 'fakescene', 0, 0) === 4, 'an instance with no definition is skipped, the rest still draw');
}

// ---- the real registry: no row, door or interact key is ever written ----------------------------------------
{
  Props._setRegistry(global.GAME.WorldData.props);
  Props._setAtlas(global.GAME.WorldData.props.definitions['roadhouse.chair.red'].atlas, img);
  const list = Props.instancesFor('roadhouse');
  if (!process.argv.includes('--registry-only')) ok(list.length === 26, 'the real roadhouse scene has 26 instances', String(list.length));
  else ok(list.length > 0, 'the real roadhouse scene has instances', String(list.length));
  const keys = list.map((e) => e.layer + ':' + e.foot + ':' + e.id);
  ok(JSON.stringify(keys) === JSON.stringify(keys.slice().sort((a, b) => {
    const A = a.split(':'), B = b.split(':');
    return (+A[0] - +B[0]) || (+A[1] - +B[1]) || (A[2] < B[2] ? -1 : 1);
  })), 'the real scene is sorted by the same rule', keys.join(' '));
  const map = { id: 'roadhouse', rows: ['iiii'], doors: { '7,9': {} }, objects: [], interact: { '8,5': 'x' } };
  const snapshot = JSON.stringify(map);
  const r = recorder();
  Props.drawScene(r.ctx, 'roadhouse', 0, 0);
  ok(JSON.stringify(map) === snapshot, 'drawing writes no map row, door, object or interact key');
}


/* ---- depth banding (M10a) ------------------------------------------------------------------------------------
 * Props interleave with actors by foot y. The engine paints a frame as ground -> for each actor sorted by foot y:
 * drawChar, then drawForegroundStructures with that actor's band. This drives the real installed hooks with fake
 * sprites and asserts the exact sequence of props and actors that reaches the context.
 */
global.GAME.PROPS_ENABLED = true;
{
  const ATLAS2 = 'assets/fake/depth.png';
  // Distinct frame x per definition, so a recorded drawImage names its prop.
  const NAMES = { 0: 'far', 20: 'near', 40: 'ceiling' };
  const def = (fx, layer) => ({ label: 'd' + fx, atlas: ATLAS2, frame: [fx, 0, 16, 16], anchor: [8, 16],
    footprint: [[0, 0]], defaultLayer: layer, tags: ['fake'], transforms: [] });
  const FOOT_FAR = 96, FOOT_NEAR = 192, FOOT_CEILING = 48;
  const DEPTH = {
    version: 1, tilePx: 16,
    scenes: { depthscene: { canvas: [256, 256] } },
    definitions: { 'd.far': def(0, 4), 'd.near': def(20, 4), 'd.ceiling': def(40, 8) },
    instances: {
      'p-far': { propId: 'd.far', sceneId: 'depthscene', tx: 4, ty: FOOT_FAR / 16 },
      'p-near': { propId: 'd.near', sceneId: 'depthscene', tx: 4, ty: FOOT_NEAR / 16 },
      'p-ceiling': { propId: 'd.ceiling', sceneId: 'depthscene', tx: 4, ty: FOOT_CEILING / 16 }
    }
  };
  ok(Props.ACTOR_LAYER === 6, 'ACTOR_LAYER is 6', String(Props.ACTOR_LAYER));
  ok(DEPTH.definitions['d.ceiling'].defaultLayer > Props.ACTOR_LAYER &&
     DEPTH.definitions['d.far'].defaultLayer <= Props.ACTOR_LAYER, 'the fixture has one prop above ACTOR_LAYER and two at or below it');

  const MAP = { id: 'depthscene' };
  const seq = [];
  // Fake sprite surface the installer hooks. Each records into `seq` so the real order is observed, not inferred.
  global.GAME.sprites = {
    drawStructures: function () { seq.push('ground'); },
    drawForegroundStructures: function () {}
  };
  global.GAME.Sprites = {
    drawChar: function (ctx, x, y, pal, dir, fr, alpha, moving, woods, t, meta) { seq.push('@' + meta.npcId); }
  };
  Props.uninstall();
  Props._setRegistry(DEPTH);
  const atlas2 = new global.Image(); atlas2.width = 64; atlas2.height = 16;
  ok(Props.install(), 'the installer takes the fake sprite surface');
  Props._setAtlas(ATLAS2, atlas2);

  function frame(actors) {
    seq.length = 0;
    const ctx = {
      imageSmoothingEnabled: true, save() {}, restore() {}, translate() {}, scale() {},
      drawImage(img, sx) { seq.push(NAMES[sx]); }
    };
    global.GAME.sprites.drawStructures(ctx, MAP, 0, 0, {});
    const sorted = actors.slice().sort((a, b) => (a.foot - b.foot) || (a.id < b.id ? -1 : 1));
    sorted.forEach(function (a, i) {
      const wy = a.foot - 16, wx = 64;
      global.GAME.Sprites.drawChar(ctx, wx, wy, null, null, null, null, null, null, 0, { mapId: MAP.id, wx: wx, wy: wy, npcId: a.id });
      global.GAME.sprites.drawForegroundStructures(ctx, MAP, 0, 0, {
        forestDepthMin: a.foot, forestDepthMax: i + 1 < sorted.length ? sorted[i + 1].foot : Infinity
      });
    });
    return seq.slice();
  }

  const A = (id, foot) => ({ id: id, foot: foot });
  // 1. both actors north of both props: every prop draws last
  ok(JSON.stringify(frame([A('a', 32), A('b', 48)])) === JSON.stringify(['ground', '@a', '@b', 'far', 'near', 'ceiling']),
    'both actors north of both props: props draw over them', frame([A('a', 32), A('b', 48)]).join(','));
  // 2. both actors south of both props: the floor props draw first, the ceiling prop still last
  ok(JSON.stringify(frame([A('a', 208), A('b', 224)])) === JSON.stringify(['ground', 'far', 'near', '@a', '@b', 'ceiling']),
    'both actors south of both props: props draw behind them, ceiling still on top', frame([A('a', 208), A('b', 224)]).join(','));
  // 3. one actor between the two props
  ok(JSON.stringify(frame([A('a', 128), A('b', 224)])) === JSON.stringify(['ground', 'far', '@a', 'near', '@b', 'ceiling']),
    'an actor between the props draws over the far one and behind the near one', frame([A('a', 128), A('b', 224)]).join(','));
  // 4. one actor each side, straddling both props
  ok(JSON.stringify(frame([A('a', 64), A('b', 224)])) === JSON.stringify(['ground', '@a', 'far', 'near', '@b', 'ceiling']),
    'actors either side: the north one is behind both props, the south one in front of both', frame([A('a', 64), A('b', 224)]).join(','));
  // tie: equal foot y draws the prop first, then the actor
  ok(JSON.stringify(frame([A('a', FOOT_FAR), A('b', 224)])) === JSON.stringify(['ground', 'far', '@a', 'near', '@b', 'ceiling']),
    'a tie on foot y draws the prop first, then the actor', frame([A('a', FOOT_FAR), A('b', 224)]).join(','));
  // a layer above ACTOR_LAYER ignores foot y entirely: the ceiling prop's foot (48) is north of every actor here
  ok(frame([A('a', 208), A('b', 224)]).indexOf('ceiling') === 5, 'a prop above ACTOR_LAYER draws last whatever its foot y');
  // one actor only: the single band is open-ended, and the props still split around it
  ok(JSON.stringify(frame([A('solo', 128)])) === JSON.stringify(['ground', 'far', '@solo', 'near', 'ceiling']),
    'with one actor the props still split around it', frame([A('solo', 128)]).join(','));
  // the flag still gates everything
  global.GAME.PROPS_ENABLED = false;
  ok(JSON.stringify(frame([A('a', 128)])) === JSON.stringify(['ground', '@a']), 'flag off: not one prop in the frame', frame([A('a', 128)]).join(','));
  global.GAME.PROPS_ENABLED = true;

  Props.uninstall();
}

global.GAME.PROPS_ENABLED = false;
/* One PASS line, and it stays PROPS-RENDER-ORDER-PASS: tools/world-apply.js prints this file's last line as its
 * CHECK for the props target, and test/props-changeset.js matches on that exact prefix. */
console.log('PROPS-RENDER-ORDER-PASS ' + pass + ' checks (order, flip, camera, flag, depth banding)');
