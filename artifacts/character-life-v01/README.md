# Character Life v0.1

Character Life adds rare, authored changes of state to stationary NPCs while leaving the existing locomotion system in charge of walking and movement frames. The production prototype is Truman at the Sheriff's Station. Cooper, the campaign's legacy `sheriff` map, dialogue, collision geometry, and the existing cast atlas remain unchanged.

## Vocabulary

**GENERIC** behavior can be reused across characters. v0.1 proves one generic behavior: an infrequent blink. Truman waits 12–38 seconds between opportunities, and the blink lasts 100–160 milliseconds. Unsupported facing directions use the normal cast frame.

**CONTEXTUAL** behavior belongs to a role or location profile. Truman occasionally reads a file at his station desk. The opportunity delay is 32–65 seconds and the authored action lasts 2.4–3.4 seconds. The profile declares frame names and timing; the generic activity runtime contains no Sheriff's Station drawing code.

**REACTIVE** behavior is caused by a world event. The existing action-key interaction already turns an adjacent NPC toward Cooper. Character Life gives that facing change priority over idle and contextual activity, holds it briefly, then returns Truman to his down-facing desk focus. It adds no dialogue or interaction framework.

**STILLNESS IS A VALID CHARACTER STATE.** Character Life does not require every NPC to animate constantly. Normal production timing spends most of the minute in the still state. Timers belong to each registered actor, use independent seeded phases, and do not create a repeated blink/read loop.

## Authored prototype

`js/character-life-scenes.js` registers the `station-truman` profile for `sheriffs_station_main_interior`. The scene contains exactly one non-wandering Truman NPC at tile 10,4. His profile allows blink and file-reading only: no random look, posture shift, breathing loop, schedule, dialogue animation, object system, or social behavior.

`assets/sprites/character-life-v01.png` is a 96×24 native sheet with four 24×24 frames derived from the unchanged production Truman atlas: down blink, side blink, file raised, and eyes lowered. The renderer preserves the existing integer position, baseline, left/right mirroring, depth pass, and nearest-neighbor scale. Locomotion always uses the original walk atlas.

## Preview and review controls

Open `test/character-life.html`. Reset uses seed 1989 and production timing at rate 1. The debug panel shows the current state, animation, selected authored frame, direction, next idle event, contextual/reactive status, real observation time, still time, and transition history.

The accelerated review toggle shortens only waiting intervals. It does not change active blink or reading durations and never changes the production profile. Manual pose buttons are explicitly review-only: they pause the activity clock and hold a chosen frame for inspection. “Walk + interact” moves Cooper with the real engine keyboard path to tile 11,4, faces left, presses the existing action key, verifies that Truman faces right, and waits for his task-facing direction to return.

## Scope boundary

Character Life v0.1 has three responsibilities: schedule rare per-actor activities, arbitrate still/contextual/reactive priority, and select an authored frame name for the renderer. It does not own locomotion, collision, dialogue, narrative state, environment reactions, sprite scaling, or interpolation. Future characters can reuse the generic blink and add a small scene profile without adding character-specific branches to the runtime.

Validation records live in `artifacts/character-life-v01/validation/`. The one-minute review measures real elapsed time separately from logical activity timing, records state transitions, and reports the fraction of time spent still.

## Validation evidence

The focused Character Life test passed its seeded scheduling, stillness, interruption, map-scoping, reaction, renderer-fallback, geometry, and locomotion checks. Nine affected native regression commands also passed. The final `coldstage run changed --json` report passed all 148 runtime checks; the Character Life scenario passed 15/15 checks with no severe console errors.

The production-rate observation covered 61 seconds at rate 1. Truman remained still for 94.2638% of the observed interval and produced two blink events plus one file-reading event without moving from tile 10,4.

The evidence pack includes six 256×192 native-canvas captures: `character-life-still-native.png`, `character-life-blink-native.png`, `character-life-reading-raised-native.png`, `character-life-reading-lowered-native.png`, `character-life-reaction-right-native.png`, and `character-life-restored-native.png`. `npc-crop-strip-8x.png` presents the exact `[156,56,24,24]` Truman crop from all six captures at 8× nearest-neighbor scale.

The numerical pixel audit is recorded in `validation/pixel-audit.json`. Relative to the initial still frame, the native Truman crop changes by 4 pixels for blink, 49 for file raised, 51 for eyes lowered, and 177 for the right-facing reaction. The restored crop changes by zero pixels, proving that the task-facing pose returns exactly. Its 254 full-canvas background changes come from the pre-existing Sheriff's Station Ambient Life mug, lamp, and glass animations, which remained enabled during capture.

The scoped Character Life and Sheriff's Station visual reviews both recorded `pass-with-notes` for the final run. No pixel baseline was approved, replaced, or advanced. The first Coldstage attempt is retained as harness evidence: it exposed an NPC-occupancy omission in the Sheriff's Station preview route and a setup/wait ordering error in the Character Life scenario. Both harness issues were corrected before the final all-green run.

## Final visual and runtime review

Model art-direction review: **pass with notes**, after the required overview and exact native/cropped pixel inspection. A real 61.0245-second observation recorded two blinks, one file-reading action and 94.2638% stillness. All 148 Coldstage runtime checks passed; Character Life passed 15/15 with zero severe console errors. Existing smoke tests retained 368 checks and walkthrough retained 86 acquisitions.

Posture shift is intentionally omitted: the available vocabulary already communicates life without moving the whole sprite. Optional brief looks can use existing cardinal frames on explicitly unlocked profiles; Truman’s task focus disables them.

The first browser attempt exposed preview-route occupancy and test observation-order mistakes. Both were corrected before the passing run. No failed-run screenshots were inspected. Pixel baselines remain unchanged.

Scoped canonical sources were synced, and eight missing existing preview dependencies were restored byte-for-byte. No World Engine or catalog logic changed; unrelated canonical entrypoint differences were preserved.

Canonical check limitation: the canonical mirror still has a pre-existing `js/maps.js` difference from the workspace preservation receipt. Its copied test stops at that hash assertion; the map was preserved rather than overwritten. The passing native and browser results above apply to the linked local production-backed preview.
