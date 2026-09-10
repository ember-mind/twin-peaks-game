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
const Portraits = require(path.join(root, 'js/portraits.js'));
const town = global.GAME.maps.maps.town;
const arrival = global.GAME.maps.maps.arrival;

function cardRasterIsExact(key) {
  const pixels = new Set();
  const context = {
    fillStyle: '',
    fillRect(x, y, w, h) {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) pixels.add(xx + ',' + yy);
      }
    }
  };
  const meta = Portraits.drawCard(context, key, key.toUpperCase(), 9, 58);
  const points = [...pixels].map((value) => value.split(',').map(Number));
  return meta && meta.x === 9 && meta.y === 58 && meta.width === 40 && meta.height === 47 &&
    Math.min(...points.map((point) => point[0])) === 9 &&
    Math.max(...points.map((point) => point[0])) === 48 &&
    Math.min(...points.map((point) => point[1])) === 58 &&
    Math.max(...points.map((point) => point[1])) === 104 &&
    points.every(([x, y]) => x >= 9 && x <= 48 && y >= 58 && y <= 104) &&
    !Array.from({length: 40}, (_, i) => pixels.has((9 + i) + ',105')).some(Boolean);
}
const allCastCardsExact = Object.keys(Portraits.faces).length === 25 &&
  Object.keys(Portraits.faces).every(cardRasterIsExact);

const checks = {
  reference_is_vaulted: fs.existsSync(path.join(root, 'artifacts/retro-gauntlet/refs/reference-r69.png')),
  native_canvas_256x192: /width="256" height="192"/.test(index),
  /* Misure hard-pass registrate in Gauntlet Retro 2D — Progressi.md e
   * artifacts/r69-ui-mobile-round9.md. */
  dialogue_bottom_panel_53_49: /var by = VH - 53, bh = 49/.test(engine),
  portrait_card_40x47: allCastCardsExact,
  portrait_anchor_overlaps_world: /bx \+ 9, by - 37/.test(engine),
  legacy_reference_palette_remains_available: /\['#072619', '#34572d', '#6a8a43', '#9aab69', '#dcd9a9', '#eee6b5'\]/.test(tone),
  portrait_uses_same_display_ramp: /ink: '#072619'/.test(portraits) && /paper: '#eee6b5'/.test(portraits),
  production_uses_per_tile_bg_palette_banks: /limitBackgroundPalettes/.test(engine) &&
    /GAME\.Retro2D\.limitBackgroundPalettes/.test(authored),
  production_keeps_obj_palette_separate: /objTones/.test(authored) &&
    !/GAME\.GoldTone\.apply\(ctx/.test(engine),
  hero_spawn_starts_at_town_entrance: /START_MAP = 'town', START_TX = 28, START_TY = 31, START_DIR = 'up'/.test(engine) &&
    /loadMap\(START_MAP, START_TX, START_TY, START_DIR\)/.test(engine),
  hero_dialogue_camera_lift: /S\.dialogue && !map\.indoor/.test(engine) && /tyy \+ 12/.test(engine),
  arrival_is_rectangular_10x9: arrival.rows.length === 9 && arrival.rows.every((row) => row.length === 10),
  arrival_has_shop_cabin_car_mailbox: arrival.rows.slice(0, 3).every((row) => row.slice(2, 4) === '99' && row.slice(6, 9) === 'JJJ') &&
    arrival.rows[1][4] === 'E' && arrival.rows[3].slice(6, 8) === 'VV',
  hero_car_uses_large_two_tile_vehicle: town.rows[7].slice(38, 40) === 'VV' &&
    /function drawParkedCarHero/.test(authored) && /Berlina laterale 45x23/.test(authored),
  car_collision_matches_art: global.GAME.maps.SOLID.V === 1,
  car_preserves_path_ground: town.ground['38,7'] === 'p' && town.ground['39,7'] === 'p',
  hero_forest_left_mass: town.rows[10][31] === 'T' && town.rows[11].slice(30, 32) === 'TT' && town.rows[12].slice(29, 32) === 'TTT',
  hero_forest_right_mass: town.rows[10][40] === 'T' && town.rows[11].slice(39, 41) === 'TT' && town.rows[12].slice(38, 41) === 'TTT',
  /* Solo le auto V possono sovrapporsi al fondo 'p' nelle righe 7/8; la
   * riga 9 resta una corsia fisica continua, esatta e non solida. */
  corridor_stays_open: [7, 8].every((y) => Array.from({length: 36}, (_, i) => {
    const x = 8 + i;
    const tile = town.rows[y][x];
    return tile === 'p' || (tile === 'V' && town.ground[x + ',' + y] === 'p');
  }).every(Boolean)) && Array.from({length: 36}, (_, i) => {
    const tile = town.rows[9][8 + i];
    return tile === 'p' && !global.GAME.maps.isSolid(tile);
  }).every(Boolean),
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
