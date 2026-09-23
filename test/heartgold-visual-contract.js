#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const index = read('index.html');
const main = read('js/main.js');
const engine = read('js/engine.js');
const authored = read('js/retro-authored.js');

const checks = {};
function gate(name, test) {
  assert.equal(Boolean(test), true, name);
  checks[name] = true;
}

gate('native_framebuffer_256x192', /width="256" height="192"/.test(index) &&
  /cv\.width = 256/.test(main) && /cv\.height = 192/.test(main) &&
  /VW = 256, VH = 192/.test(engine));
gate('native_aspect_4x3', /aspect-ratio:\s*4\s*\/\s*3/.test(index));
gate('tile_collision_grid_unchanged', /TILE = 16/.test(engine));
/* The overdraw moved into the shared engine (engine/ember-tilemap.js): checked
 * by what the range does, and by the game still asking for two tiles of it. */
const Tilemap = (global.window = global.window || global, require(path.join(root, 'engine', 'ember-tilemap.js')), global.EMBER.Tilemap);
const range = Tilemap.visibleRange({ tile: 16, camX: 40, camY: 40, viewW: 256, viewH: 192, overdraw: 2 });
gate('extended_tiles_have_camera_overdraw', /var overdraw = 2/.test(engine) && /overdraw: overdraw/.test(engine) &&
  range.x0 === Math.floor(40 / 16) - 2 && range.x1 === Math.floor((40 + 255) / 16) + 2);
gate('forest_layout_is_world_stable',
  /var minTx = 0, maxTx = map\.width - 1/.test(authored) &&
  /var minTy = 0, maxTy = map\.height - 1/.test(authored));
gate('forest_culling_uses_runtime_viewport',
  /viewportWidth/.test(engine) && /viewportHeight/.test(engine) &&
  /ex > viewW \+ 55/.test(authored) && /ey > viewH \+ 55/.test(authored));
gate('heartgold_cast_is_production', /heartgold-atlas-r116/.test(authored) &&
  /production:\s*true/.test(authored) && /sourceAtlas:\s*true/.test(authored));
gate('cast_atlas_preloaded', /rel="preload" as="image" href="assets\/sprites\/cast-walkcycles-hg-24\.png/.test(index));
gate('engine_waits_for_cast', /Sprites\.castReady\.then/.test(main));
gate('cast_frame_24px', /frame:\s*\[24, 24\]/.test(authored) &&
  /visibleHeight:\s*\[20, 24\]/.test(authored));
gate('four_phase_gait', /contact-stepA-contact-stepB/.test(authored));
gate('runtime_contact_shadow', /rgba\(49,90,73,\.38\)/.test(authored));

const requiredColors = [
  '#83d3a7', '#a7e2b9', '#6baa91', '#4e8067', '#315a49',
  '#e8d08f', '#f3dfa8', '#d6bc7d', '#aa8e5c',
  '#dfcb91', '#ecdca9', '#c5ac74', '#917a54'
];
for (const color of requiredColors) gate(`material_palette_${color.slice(1)}`, authored.includes(color));
gate('exterior_palette_not_gbc_quantized',
  /mapId === 'town' \|\| mapId === 'arrival' \|\| mapId === 'woods'/.test(authored));
gate('organic_road_intrusions', /Piccole intrusioni del prato/.test(authored));
gate('building_cast_shadows', /function townFoundationShadow/.test(authored) &&
  /HG\.shadowDark/.test(authored) && /HG\.shadow/.test(authored));
gate('building_landscape', /function townBuildingLandscape/.test(authored) &&
  /function townShrubCluster/.test(authored));

const atlas = path.join(root, 'assets/sprites/cast-walkcycles-hg-24.png');
gate('cast_atlas_exists', fs.existsSync(atlas));
const identify = spawnSync('magick', ['identify', '-format', '%wx%h', atlas], {
  cwd: root, encoding: 'utf8'
});
assert.equal(identify.status, 0, identify.stderr || 'cannot inspect cast atlas');
gate('cast_atlas_360x360', identify.stdout.trim() === '360x360');

const verify = spawnSync(process.execPath, [path.join(root, 'tools/build-heartgold-cast.js'), '--verify-only'], {
  cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024
});
assert.equal(verify.status, 0, verify.stderr || verify.stdout || 'cast verification failed');
const cast = JSON.parse(verify.stdout);
gate('cast_inventory_24', cast.characters === 24 && cast.frames === 216);
gate('cast_color_depth_12_to_16', cast.opaqueColorsPerFrame.min >= 12 && cast.opaqueColorsPerFrame.max <= 16);
gate('cast_height_heartgold_range', cast.visibleHeight.min >= 20 && cast.visibleHeight.max <= 25);
gate('cast_binary_alpha', cast.binaryAlpha === true && cast.magentaPixels === 0);

process.stdout.write(`${JSON.stringify({ status: 'pass', checks, cast }, null, 2)}\n`);
