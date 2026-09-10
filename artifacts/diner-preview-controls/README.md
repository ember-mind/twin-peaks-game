# Preview: restore and expose existing ambient effects

Found a preview-only control bug: Static/Reactive only disabled AmbientLife, while Prova sorso/pulizia re-enabled CharacterActivity alone. A user could therefore see the new gestures while the old ambient effects remained disabled.

All explicit preview actions now restore all animation layers and unpause them. The selected mode is visible as text. New Prova luci, Prova insegna and Prova riflesso buttons seek to the corresponding real scheduled event, preserving production duration and intensity. The page explains that lamps vary subtly in brightness rather than physically swinging.

Production engine, artwork, timings and effect strengths are unchanged. The live browser state from before the fix was unavailable, so the disabled-layer path is a reproduced control defect, not a claim about the user's exact prior selection.

`test/ambient-preview-controls.js` executes the actual preview handler source against layer stubs, covering every explicit preview action after both disabled modes, unpause, mode indication and seeking to the correct scheduled effect. Full native suite:59 scripts pass. Browser run evidence: `coldstage.json`.

Coldstage: 105/105 runtime checks pass. All four diner pixel scenarios are unchanged, so no diner screenshots were opened. The unrelated town visual scenario still requests review: its returned overview shows the title screen against an entrance-dialogue baseline. No baseline was approved or replaced. Preview controls were also exercised through browser accessibility: Static → Prova sorso restores Tutto attivo; Prova insegna seeks to its scheduled event.
