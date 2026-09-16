# Playable Build 01: short-turn input regression

## Reproduction

The unseeded full journey on 595279b reached Act 4 and failed at the Roadhouse phone (8,5). Evidence: Actions run 35090500579, artifact campaign-35090500579-1. The opening, M4, M5/M6 and Act 4 taxi testimony had been earned with normal inputs. There were no browser faults. This is not a full-campaign pass.

The north/south approaches to the phone cannot be entered while already facing it because the next tiles behind those approaches contain tables; both lateral tiles are solid. A short directional tap is intended to turn Cooper, but engine.js retained queuedDirection after changing facing. Key release did not consume that queue, so the engine then forced a movement step after its 60 ms turn delay. The driver correctly refused to teleport or invoke the phone's narrative API.

## Narrow repair

Consume queuedDirection when the changed-direction input turns Cooper. Held input remains in the held stack and still walks after the existing delay. A second same-direction tap still moves one tile; a between-frame changed-direction tap is preserved as a turn. No gate, story state, collision geometry, movement speed or persistence policy changes.

`test/turn-in-place.js` exercises real input handlers with actual map geometry and a controlled clock: short turns, second-tap movement, between-frame input, holding through the delay, Roadhouse phone targeting and blur. It is explicitly a unit fixture, not a seeded substitute for the complete browser journey.

## Evidence and limitations

The short-turn assertion fails on the original engine and passes with the repair. Before pushing the engine repair, hosted validation ran the new fixture, movement-feel, smoke (415 checks) and walkthrough (85 acquisitions) successfully. The permanent read-only CI job reruns these contracts, and the complete browser route must be rerun with this repair before claiming game completion.

The one-use branch-only mechanical patch workflow has been removed from the final diff. No merge, deployment, local Vault write, narrative edit, or human testing was performed. This is a proposed input bug fix, not a claim that every remaining campaign or save/recovery issue is solved.
