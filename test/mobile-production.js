#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('index.html');
const main = read('js/main.js');
const touch = read('js/touch.js');
const adapter = read('js/narrative-engine-adapter.js');
const notebook = read('js/narrative-notebook.js');

const checks = {
  viewport_covers_notch: /viewport-fit=cover/.test(index),
  dynamic_viewport_height: /100dvh/.test(index),
  no_page_overscroll: /overscroll-behavior:\s*none/.test(index),
  touch_action_disabled: /touch-action:\s*none/.test(index),
  mobile_uses_visual_viewport: /window\.visualViewport/.test(main),
  mobile_audit_override: /touch=1/.test(main) && /touch=1/.test(touch),
  portrait_reserves_controls_region: /viewport\.height \* 0\.54/.test(main),
  mobile_keeps_integer_scale: /var scale = fit >= 1 \? Math\.max\(1, Math\.floor\(fit\)\) : fit/.test(main),
  desktop_keeps_integer_scale: /Math\.floor\(fit\)/.test(main),
  orientation_resizes_stage: /orientationchange/.test(main),
  touch_dpad_available: /buildDpad/.test(touch),
  touch_ab_available: /buildButton/.test(touch),
  controls_use_safe_areas: /safe-area-inset-left/.test(touch) && /safe-area-inset-right/.test(touch) && /safe-area-inset-bottom/.test(touch),
  controls_resize_for_orientation: /function playLayout/.test(touch) && /landscape/.test(touch),
  portrait_controls_follow_stage: /var stageBottom =/.test(touch) && /controlTop: controlTop/.test(touch) &&
    /function placePortraitButton/.test(touch),
  mobile_notebook_shows_active_objective_in_one_press:
    /getObjectiveText: currentObjectiveText/.test(adapter) &&
    /data-nb-objective/.test(notebook) && /OBIETTIVO: /.test(notebook),
  objective_has_one_shared_resolver:
    /A\.getObjectiveText = currentObjectiveText/.test(adapter) &&
    /var narrative = NR\.activeObjective/.test(adapter) &&
    /GAME\.Data\.objectiveFor/.test(adapter),
  notebook_hides_duplicate_semantic_objective:
    /objectiveEl\.style\.display = 'none'/.test(adapter) &&
    /objectiveEl\.style\.display = objectiveDisplay/.test(adapter),
  narrative_owns_its_tap: /interactionMode\(\)\.indexOf\('narrative'\) === 0\) return/.test(touch),
  narrative_choice_has_dpad: /mode === 'narrative-choice'/.test(touch) && /showControl\(uiDpad, true/.test(touch),
  narrative_choice_has_confirm: /Conferma scelta/.test(touch) && /buttonFace\(uiA, 'A', 'SCEGLI'\)/.test(touch),
  held_direction_released_on_blur: /addEventListener\('blur'/.test(touch) && /setDpadDir\(null\)/.test(touch),
  hidden_page_releases_direction: /visibilitychange/.test(touch) && /document\.hidden/.test(touch)
};

let passed = 0;
for (const [name, ok] of Object.entries(checks)) {
  console.log(`${ok ? 'ok' : 'not ok'} - ${name}`);
  if (ok) passed++;
}
console.log(`\nMOBILE-PROD-${passed === Object.keys(checks).length ? 'PASS' : 'FAIL'} ${passed}/${Object.keys(checks).length}`);
if (passed !== Object.keys(checks).length) process.exit(1);
