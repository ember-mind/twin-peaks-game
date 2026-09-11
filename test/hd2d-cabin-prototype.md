# HD-2D cabin — throwaway prototype

Question: can a tiny original Twin Peaks clearing demonstrate the pixel-actor / dimensional-environment grammar of Dragon Quest III HD-2D without replacing the game renderer?

Run from repository root:

```sh
python3 -m http.server 4198 --bind 127.0.0.1
```

Open http://127.0.0.1:4198/test/hd2d-cabin-prototype.html. WASD walks; R resets; Space compares flat and HD-2D lighting. Share variants with `?variant=flat` or `?variant=hd2d`; append `&capture=1` to freeze light flicker.

No persistence or production integration. Uses bundled Three.js r147 and original procedural assets.

Validation: prototype Coldstage 6/6 checks pass (load, movement, cabin/boundary collision, reset, lighting variants), zero severe console errors. Existing native baseline: 66/72 pass; six unrelated failures retained. Production Coldstage: 19 lanes / 170 checks pass.

Bounded Gauntlet result: **BAR_WINS**, scene 7/10, materials 6/10, actor/navigation 7/10; required floor 9. One builder, independent critic, one focused repair and short recheck. Actor occlusion resolved; ground/water/conifer materials and atmospheric lighting remain below the reference. Do not promote this code to production on the strength of this experiment.

Official reference: https://dragonquest.square-enix-games.com/games/en-us/dragon-quest-3-hd2d-remake/ . Detailed local evidence and source measurements: `.gauntlet/hd2d-cabin-prototype/progress.md`.

Coldstage rimosso il 2026-09-11 (decisione esplicita); validazione visiva = test/*-gates.js + capture headless.


## Quick town extension

The same prototype now connects the cabin clearing to a roadside Double R diner and sheriff office. Walk east along z=5.5, or use the Cabin / Double R / Sheriff shortcuts. The camera follows Cooper continuously. `?location=diner` and `?location=sheriff` open the other locations directly; lighting variants remain available. Buildings and parked car block movement. Location shortcuts are prototype navigation, not campaign transitions.

This is an expanded graphical study, not a replacement for the production game. New views have no independent visual score; the earlier DQIII BAR_WINS verdict remains applicable to the original study only.

Extension validation: six focused native guards pass; Coldstage 11/11 runtime checks pass, including the complete outward/return road walk and camera tracking. Visual review skipped because `pixelGate.aiReviewNeeded=false`.
