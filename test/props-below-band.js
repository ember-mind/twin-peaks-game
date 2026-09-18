#!/usr/bin/env node
'use strict';

/* test/props-below-band.js — the below-actors band, proven on the real Roadhouse registry.
 *
 * roadhouse-stage-01 is a 112x46 velvet frame, and the Giant stands ON it at the m8_giant_stage moment. The
 * stage's anchor foot y (46) is south of the Giant's (32), so the old foot-y interleave drew the frame OVER him.
 * A backdrop is not a floor object: layer < ACTOR_LAYER must draw once, before every actor, whatever the foot y.
 *
 * world/props.json is NOT edited. It is loaded and roadhouse-stage-01's layer is overridden in memory to
 * ACTOR_LAYER - 1, the highest layer that must still sit behind every actor. The fake sprite surface of
 * test/props-render-order.js then drives one real frame through the installed hooks and asserts the Giant's
 * sprite reaches the canvas after the stage frame.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
let pass = 0;
function ok(cond, label, detail) { assert.ok(cond, label + (detail ? ' :: ' + detail : '')); pass++; }

global.window = global;
global.GAME = global.GAME || {};
global.Image = function () { this.width = 0; this.height = 0; };
const Props = require(path.join(ROOT, 'js', 'props-production.js'));

const STAGE = 'roadhouse-stage-01';
const REGISTRY = JSON.parse(fs.readFileSync(path.join(ROOT, 'world', 'props.json'), 'utf8'));
const STAGE_DEF = REGISTRY.definitions[REGISTRY.instances[STAGE].propId];
const STAGE_FRAME = STAGE_DEF.frame.slice();
const BELOW_LAYER = Props.ACTOR_LAYER - 1;
const GIANT = { id: 'giant', tileX: 8, foot: 32 };   // stage tile 8,2.875 anchor foot 46 > giant foot 32

ok(REGISTRY.instances[STAGE] && REGISTRY.instances[STAGE].sceneId === 'roadhouse', STAGE + ' is a roadhouse instance');
ok(REGISTRY.instances[STAGE].layer === undefined && STAGE_DEF.defaultLayer < Props.ACTOR_LAYER,
  'the seeded stage has no instance override and a below-actor definition default', String(STAGE_DEF.defaultLayer));
ok(Math.round(REGISTRY.instances[STAGE].ty * 16) > GIANT.foot,
  'the stage anchor foot is south of the Giant, which is why the old interleave drew it in front',
  'stage ' + Math.round(REGISTRY.instances[STAGE].ty * 16) + ' > giant ' + GIANT.foot);

/* The override: in memory only, the file on disk is untouched. */
REGISTRY.instances[STAGE].layer = BELOW_LAYER;
ok(REGISTRY.instances[STAGE].layer === BELOW_LAYER, 'the stage layer is overridden to ACTOR_LAYER - 1 in memory');
ok(Props.bandOf(BELOW_LAYER) === Props.BANDS.BELOW_ACTORS, 'bandOf(ACTOR_LAYER - 1) is the below-actors band');
ok(Props.bandOf(Props.ACTOR_LAYER) === Props.BANDS.ACTOR_BAND, 'bandOf(ACTOR_LAYER) is the interleaved band');
ok(Props.bandOf(Props.ACTOR_LAYER + 1) === Props.BANDS.ABOVE_ACTORS, 'bandOf(ACTOR_LAYER + 1) is the above-actors band');

/* The render-order fixture: a fake sprite surface, and a recording 2D context whose every drawImage names its frame. */
global.GAME.PROPS_ENABLED = true;
const seq = [];
global.GAME.sprites = {
  drawStructures: function () { seq.push('ground'); },
  drawForegroundStructures: function () {}
};
global.GAME.Sprites = {
  drawChar: function (ctx, x, y, pal, dir, fr, alpha, moving, woods, t, meta) { seq.push('@' + meta.npcId); }
};
Props.uninstall();
Props._setRegistry(REGISTRY);
const atlas = new global.Image(); atlas.width = 1024; atlas.height = 512;
ok(Props.install(), 'the installer takes the fake sprite surface');
Props._setAtlas(STAGE_DEF.atlas, atlas);

const MAP = { id: 'roadhouse' };
const ctx = {
  imageSmoothingEnabled: true, save() {}, restore() {}, translate() {}, scale() {},
  drawImage(img, sx, sy, sw, sh) { seq.push('draw:' + [sx, sy, sw, sh].join(',')); }
};
/* One production frame: ground, then the one actor the scene is about, then the open end band. */
global.GAME.sprites.drawStructures(ctx, MAP, 0, 0, {});
const wx = GIANT.tileX * 16, wy = GIANT.foot - 16;
global.GAME.Sprites.drawChar(ctx, wx, wy, null, null, null, null, null, null, 0,
  { mapId: MAP.id, wx: wx, wy: wy, npcId: GIANT.id });
global.GAME.sprites.drawForegroundStructures(ctx, MAP, 0, 0, { forestDepthMin: GIANT.foot, forestDepthMax: Infinity });

const stageAt = seq.indexOf('draw:' + STAGE_FRAME.join(','));
const giantAt = seq.indexOf('@' + GIANT.id);
ok(stageAt >= 0, 'the stage frame reached the canvas', seq.join(' '));
ok(giantAt >= 0, 'the Giant sprite reached the canvas', seq.join(' '));
ok(stageAt < giantAt, 'the Giant sprite draws AFTER the stage frame', 'stage@' + stageAt + ' giant@' + giantAt + ' :: ' + seq.join(' '));

/* Boundary: a prop on ACTOR_LAYER with the same south foot still interleaves in front of the actor, so the
 * assertion above is about the band and not about the foot y. */
ok(Props.bandOf(Props.ACTOR_LAYER) === Props.BANDS.ACTOR_BAND && BELOW_LAYER < Props.ACTOR_LAYER,
  'the band is the only difference between the stage and an interleaved floor prop at the same foot y');

Props.uninstall();
global.GAME.PROPS_ENABLED = false;
console.log('PROPS-BELOW-BAND-PASS ' + pass + ' checks');
