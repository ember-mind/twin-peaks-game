#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
const retro = fs.readFileSync(path.join(root, 'js', 'retro.js'), 'utf8');
const authored = fs.readFileSync(path.join(root, 'js', 'retro-authored.js'), 'utf8');
const retroUi = fs.readFileSync(path.join(root, 'js', 'retro-ui.js'), 'utf8');
const adapter = fs.readFileSync(path.join(root, 'js', 'narrative-engine-adapter.js'), 'utf8');
const notebook = fs.readFileSync(path.join(root, 'js', 'narrative-notebook.js'), 'utf8');
const production = fs.readFileSync(path.join(root, 'js', 'narrative-production.js'), 'utf8');
const engine = fs.readFileSync(path.join(root, 'js', 'engine.js'), 'utf8');
const retroFont = fs.readFileSync(path.join(root, 'js', 'retro-font.js'), 'utf8');
const portraits = fs.readFileSync(path.join(root, 'js', 'portraits.js'), 'utf8');
const goldTone = fs.readFileSync(path.join(root, 'js', 'gold-tone.js'), 'utf8');
const castSheet = fs.readFileSync(path.join(root, 'assets', 'sprites', 'cast-walkcycles-16.png'));
const castVersion = 'cast-' + crypto.createHash('sha256').update(castSheet).digest('hex').slice(0, 12);

const checks = {
  gold_native_resolution_160x144: /width="160" height="144"/.test(index) &&
    /cv\.width = 160/.test(main) && /cv\.height = 144/.test(main),
  engine_repairs_and_locks_native_buffer: /canvas\.width !== VW/.test(engine) &&
    /canvas\.height !== VH/.test(engine) && /UW = VW;/.test(engine),
  intro_header_uses_fitting_native_scale: /FEBBRAIO, 1989'[\s\S]*bold 8px monospace/.test(engine) &&
    /titleFits: titleWidth <= l\.boxW - 20/.test(engine),
  intro_uses_three_complete_pages: /Math\.ceil\(lines\.length \/ 7\)/.test(engine) &&
    /lines\.slice\(part \* 7, part \* 7 \+ 7\)/.test(engine),
  production_cache_busts_layout_fix: /js\/engine\.js\?v=r77qa3/.test(index) &&
    /js\/touch\.js\?v=r77qa1/.test(index) && /js\/data\.js\?v=12qa4/.test(index) &&
    /js\/narrative-data\.gen\.js\?v=13qa3/.test(index) &&
    /js\/narrative-finale\.js\?v=gold54p5/.test(index) &&
    /js\/narrative-finale-production\.js\?v=13/.test(index),
  production_cache_busts_objective_notebook_fix:
    /js\/narrative-notebook\.js\?v=5/.test(index) &&
    /js\/narrative-engine-adapter\.js\?v=10/.test(index) &&
    /js\/narrative-production\.js\?v=21/.test(index),
  css_stage_preserves_native_aspect: /aspect-ratio: 10 \/ 9/.test(index) &&
    /max-width: 100vw; max-height: 100dvh/.test(index),
  production_loads_retro_renderer: /js\/retro\.js/.test(index),
  production_loads_shared_bitmap_font_first: /js\/retro-font\.js/.test(index) &&
    index.indexOf('js/retro-font.js') < index.indexOf('js/engine.js'),
  production_loads_speaker_cards_before_engine: /js\/portraits\.js/.test(index) &&
    index.indexOf('js/portraits.js') < index.indexOf('js/engine.js') &&
    /Portraits\.drawCard/.test(engine) && /Portraits\.drawCard/.test(retroUi),
  speaker_cards_use_native_pixel_faces_and_names: /function drawPortrait\(/.test(portraits) &&
    /function drawCard\(/.test(portraits) && !/drawImage|fillText|measureText/.test(portraits),
  production_uses_approved_master_palette: /js\/gold-tone\.js/.test(index) &&
    /GAME\.GoldTone\.apply/.test(engine) && /#072619/.test(goldTone) && /#eee6b5/i.test(goldTone),
  production_loads_authored_tileset: /js\/retro-authored\.js/.test(index),
  production_loads_generated_cast_walkcycles: new RegExp('retro-authored\\.js\\?v=' + castVersion).test(index) &&
    new RegExp('cast-walkcycles-16\\.png\\?v=' + castVersion).test(authored) &&
    /drawCastWalkSheet/.test(authored) && /dir === 'left'/.test(authored) &&
    castSheet.readUInt32BE(16) === 240 && castSheet.readUInt32BE(20) === 240,
  production_loads_continuous_town_art: /maps\.js\?v=r76town1/.test(index) &&
    /function townGround/.test(authored) && /function townRoad/.test(authored) && /paleGround/.test(authored),
  production_does_not_load_three: !/three\.min\.js/.test(index) && !/render3d\.js/.test(index),
  engine_boots_without_webgl: /GAME\.Engine\.init\(cv, null\)/.test(main),
  fixed_pixel_scaling: /image-rendering: pixelated !important/.test(index),
  integer_viewport_scaling: /Math\.floor\(fit\)/.test(main),
  integer_viewport_origin: /Math\.floor\(\(viewport\.width - stageWidth\) \/ 2\)/.test(main) &&
    /stage\.style\.transform = 'none'/.test(main),
  retro_overrides_tiles: /Spr\.drawTile = function/.test(retro),
  retro_overrides_characters: /Spr\.drawChar = function/.test(retro),
  authored_matrix_tiles_and_sprites: /var GRASS_8 = \[/.test(authored) && /var DOWN0 = \[/.test(authored) && /var SIDE1 = \[/.test(authored),
  authored_sprite_archetypes: /var BODY = \{/.test(authored) && /narrow: \[/.test(authored) &&
    /broad: \[/.test(authored) && /dress: \[/.test(authored) && /short: \[/.test(authored),
  gold_overlapping_conifers: /Conifera 16x24/.test(authored) && /TREE_CANOPY_B/.test(authored) &&
    /TREE_CANOPY_C/.test(authored) && /var TREE_DX = \[/.test(authored) && /var TREE_DY = \[/.test(authored),
  gold_authored_ground_clusters: /var GRASS_8_VARIANTS = \[GRASS_8, GRASS_8_H, GRASS_8_V, GRASS_8_HV\]/.test(authored) &&
    /paint\(ctx, TALL_GRASS/.test(authored),
  gold_continuous_roofs_and_facades: /var facade = bottom !== ch && bottom !== 'D'/.test(authored) &&
    /var upperFacade = !facade/.test(authored) && /for \(i = 2; i < 16; i \+= 4\)/.test(authored),
  gold_world_transition_modules: /function sidewalk\(/.test(authored) && /function water\(/.test(authored) &&
    /function fence\(/.test(authored) && /cell\(rows, tx, ty - 1\)/.test(authored),
  gold_window_modules: /x \+ 2, y \+ 4, 12, 8, C\.ink\);/.test(authored) &&
    /x \+ 3, y \+ 5, 4, 6, ch === '5'/.test(authored),
  gold_interior_wall_and_floor_modules: /function interiorWall/.test(authored) &&
    /for \(yy = 0; yy < 16; yy \+= 4\)/.test(authored),
  gold_chibi_cooper_contrast: /shirtCol = name === 'cooper'/.test(authored) &&
    /name === 'cooper' && dir !== 'up'/.test(authored),
  gold_native_16px_actors: /var GOLD_DOWN0 = \[/.test(authored) &&
    /GAME\.Retro2D\.spriteSize = \[16, 16\]/.test(authored),
  gold_flat_world_projection: /var SCALE = 1/.test(engine) && /viewport GBC: 10x9 metatile/.test(engine),
  gold_gameplay_has_no_quest_overlay: /Pokémon Oro non sovrappone quest banner/.test(retroUi),
  notebook_renders_single_resolved_objective:
    /A\.getObjectiveText = currentObjectiveText/.test(adapter) &&
    /getObjectiveText: currentObjectiveText/.test(adapter) &&
    /data-nb-objective/.test(notebook),
  title_and_intro_footer_stay_inside_frames:
    /Mistero di Laura Palmer', UW \/ 2, 69, '#31543a', '7px monospace'/.test(engine) &&
    /promptY: 126/.test(engine) &&
    /text\('PAG\.[\s\S]*var advanceLabel[\s\S]*if \(Math\.floor\(tGlobal \/ 500\) % 2 === 0\) \{\s*text\('>'/.test(engine),
  gold_dialogue_reference_bottom_49px: /var by = 95, bh = 49/.test(engine) &&
    /var bw = Math\.min\(UW, 160\)/.test(engine),
  retro_disables_oblique_structures: /Sp\.drawStructures = function \(\) \{\}/.test(retro),
  music_remains_loaded: /js\/audio\.js/.test(index),
  production_loads_narrative_runtime: /js\/narrative-runtime\.js/.test(index) &&
    /js\/narrative-engine-adapter\.js/.test(index),
  production_loads_notebook_and_save: /js\/narrative-notebook\.js/.test(index) &&
    /js\/narrative-save\.js/.test(index),
  production_boots_narrative_bridge: /js\/narrative-production\.js/.test(index),
  production_loads_causal_finale: /js\/narrative-finale\.js/.test(index) &&
    /js\/narrative-finale-production\.js/.test(index),
  production_uses_canvas_bitmap_ui: /js\/retro-ui\.js/.test(index) && /bitmapFont: true/.test(retroUi)
  ,case_file_uses_readable_screen_font: /id="case-ui"/.test(index) &&
    /font-family: Verdana, Geneva, Tahoma, sans-serif/.test(index) && /function syncCaseUi\(\)/.test(engine)
  ,case_file_explains_controls: /FRECCE ↑ \/ ↓/.test(engine) &&
    /ESC oppure X/.test(engine) && /chiude fascicolo/.test(engine)
  ,case_file_opens_reperted_documents: /id="case-document"/.test(index) &&
    /function openSelectedClue\(\)/.test(engine) && /INVIO oppure Z/.test(engine) &&
    /document:\s*\{/.test(fs.readFileSync(path.join(root, 'js', 'data.js'), 'utf8'))
  ,finale_keeps_notebook_read_only: /notebookOnly = !!\(opts && opts\.keepNotebook\)/.test(adapter) &&
    /readOnly: notebookOnly/.test(adapter) && /opts\.readOnly \? \['Evidenze', 'Appunti', 'Proposizioni'\]/.test(notebook) &&
    /A\.disable\(\{ keepNotebook: true \}\)/.test(production),
  all_production_text_is_bitmap: !/fillText|measureText|strokeText/.test(engine) &&
    !/fillText|measureText|strokeText/.test(retroUi) && /GAME\.RetroFont/.test(retroFont),
  finale_has_single_canvas_owner: /setEngineOwned\(S\.mode === 'end'\)/.test(engine) &&
    /canvas\.style\.display = owned \? 'none' : ''/.test(retroUi),
  canvas_frame_state_is_atomic: /ctx\.globalAlpha = 1/.test(engine) &&
    /ctx\.globalCompositeOperation = 'source-over'/.test(engine) &&
    /ctx\.clearRect\(0, 0, canvas\.width, canvas\.height\)/.test(engine)
  ,high_resolution_dialogue_typography: /id="speaker-name-hires"/.test(index) &&
    /id="speaker-dialogue-hires"/.test(index) && /id="speaker-advance-hires"/.test(index) &&
    /function syncSpeakerTypography\(\)/.test(engine) &&
    /RF\.wrapFixed\(raw, 144, 1\)/.test(engine) && /--native-scale/.test(index)
  ,dialogue_copy_has_breathing_room_and_balance: /top: 77\.083333%/.test(index) &&
    /left: 6\.875%/.test(index) && /by \+ 16 \+ i \* 11/.test(engine) &&
    /function balanceFixedPair\(/.test(retroFont) && /RF\.balanceFixedPair/.test(engine)
  ,dialogue_shows_advance_control: /INVIO AVANTI >/.test(engine) && /A AVANTI >/.test(engine) &&
    /INVIO · AVANTI/.test(engine) && /A · AVANTI/.test(engine)
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, name);
  console.log(`ok - ${name}`);
}
console.log(`\nRETRO-PROD-PASS ${Object.keys(checks).length}/${Object.keys(checks).length}`);
