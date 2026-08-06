#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const engine = read('js/engine.js');
const tone = read('js/gold-tone.js');
const authored = read('js/retro-authored.js');
const portraits = read('js/portraits.js');
const index = read('index.html');
const touch = read('js/touch.js');

global.window = global;
require(path.join(root, 'js/maps.js'));
const town = global.GAME.maps.maps.town;
const arrival = global.GAME.maps.maps.arrival;

const checks = {
  reference_is_vaulted: fs.existsSync(path.join(root, 'artifacts/retro-gauntlet/refs/reference-r69.png')),
  native_canvas_160x144: /width="160" height="144"/.test(index),
  dialogue_split_95_49: /var by = 95, bh = 49/.test(engine),
  portrait_card_40x47: /var tw = 40/.test(portraits) && /height:47/.test(portraits),
  portrait_anchor_overlaps_world: /bx \+ 9, by - 37/.test(engine),
  six_tone_reference_palette: /\['#072619', '#34572d', '#6a8a43', '#9aab69', '#dcd9a9', '#eee6b5'\]/.test(tone),
  portrait_uses_same_display_ramp: /ink: '#072619'/.test(portraits) && /paper: '#eee6b5'/.test(portraits),
  full_world_uses_reference_display: /town:true/.test(tone) && /sheriff:true/.test(tone) && /woods:true/.test(tone) && /redroom:true/.test(tone),
  no_color_family_branching: !/purple|blue material|warm material|ochre/.test(tone),
  hero_spawn_faces_arrival_tableau: /mapId: 'arrival'/.test(engine) && /tx: 4, ty: 3/.test(engine) && /loadMap\('arrival', 4, 3, 'up'\)/.test(engine),
  hero_dialogue_camera_lift: /S\.dialogue && !map\.indoor/.test(engine) && /tyy \+ 12/.test(engine),
  arrival_is_rectangular_10x9: arrival.rows.length === 9 && arrival.rows.every((row) => row.length === 10),
  arrival_has_shop_cabin_car_mailbox: arrival.rows.slice(0, 3).every((row) => row.slice(2, 4) === '99' && row.slice(6, 9) === 'JJJ') &&
    arrival.rows[1][4] === 'E' && arrival.rows[3].slice(6, 8) === 'VV',
  hero_car_is_32px_pair: town.rows[7].slice(38, 40) === 'VV' && /function parkedCar/.test(authored),
  car_collision_matches_art: global.GAME.maps.SOLID.V === 1,
  car_preserves_path_ground: town.ground['38,7'] === 'p' && town.ground['39,7'] === 'p',
  hero_forest_left_mass: town.rows[10][31] === 'T' && town.rows[11].slice(30, 32) === 'TT' && town.rows[12].slice(29, 32) === 'TTT',
  hero_forest_right_mass: town.rows[10][40] === 'T' && town.rows[11].slice(39, 41) === 'TT' && town.rows[12].slice(38, 41) === 'TTT',
  corridor_stays_open: [8, 9].every((y) => Array.from({length: 36}, (_, i) => town.rows[y][8 + i] === 'p').every(Boolean)),
  bitmap_only_portraits: !/fillText|drawImage|measureText/.test(portraits),
  integer_scale_above_one: /Math\.floor\(fit\)/.test(read('js/main.js')),
  hard_pixel_edges: /image-rendering: pixelated !important/.test(index),
  touch_controls_outside_canvas: /left: 'calc\(16px \+ env\(safe-area-inset-left/.test(touch) && /right: 20, bottom: 90/.test(touch)
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, name);
  console.log('ok - ' + name);
}
console.log('\nR69-REFERENCE-PASS ' + Object.keys(checks).length + '/' + Object.keys(checks).length);
