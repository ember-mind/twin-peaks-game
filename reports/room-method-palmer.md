# Palmer living room — a complete design case, not a release certification

2026-09-26. Branch: `codex/room-method-palmer`. Base: main
`7a3de3fd249cc908756a269e116c597bc82f1767`. Art checkpoint: `559629e`.

Delivered: actual room redesign, before/intermediate/after native frames,
production-room walkthrough, targeted regression tests, failed-test evidence,
and a human-readable post. Human response remains untested. Full campaign
acceptance is **not green**.

## Start here

- [Post: I called it a sofa. The room didn't.](room-method-palmer-post.md)
- [Visual comparison gallery](../artifacts/room-method-palmer/index.html)
- [Design written before implementation](../artifacts/room-method-palmer/design.md)
- [Image hashes and provenance](../artifacts/room-method-palmer/manifest.json)

This room is new to our intent-driven pilot series, not historically untouched.
It already had native art and earlier art reviews (`rooms-fresh-critic-2026-09-19.md`).
Sheriff, Double R and the previous lobby post are not reused as the case.
The real existing baseline was retained; no bad “before” was manufactured.

## Intent, observation, repair

Room intent: familiar family sitting room, with readable shared seating and
room to arrive, visit Sarah and continue upstairs. Aesthetic contribution
is valid: upholstery, material warmth and visual grouping need not be new
interactions. The existing cup, cloth, newspaper and furniture were enough
ordinary-life material; no new clutter, event, clue or animation was added.

Eye-flow below is my design reading of the real entrance render, **not human
eye tracking**:

- Before: entrance → bright runner / rug border → Sarah → small furniture
  islands and the pale upper room.
- Intended lower-room flow: entrance → shared seating / Sarah → west landing.
- Final reading: broader cream sofa makes seating recognizable, subdued green
  rug supports it, bare entrance floor separates arrival from sitting.

| Stage | Actual change | Observed result / limit |
|---|---|---|
| Before | Capture registry spawn (7,10), up, Cast Presence enabled | One-tile `sofa` draws an armchair. Rug outline is a strong independent mass. |
| Massing | Three-cell wall-backed sofa, existing chair reused; quiet rug/floor; separate arrival mat | Clear shared-seat silhouette; fewer competing bright floor accents. No extra furniture definition. |
| Light | Diagonal west-window plane, visible blind slats, material-specific rug light; shallower east pool | Light joins architecture and sitting area rather than painting isolated floor cards. |
| Evening | Read existing `atto4` flag; dim lower-room window, floor and upholstery; remove day beam | Same geometry, warm sconces remain; upper-room pixels unchanged. |
| Production walk | Real `index.html` boot, keyboard doors/routes, Sarah interaction, canonical evening re-entry | 22/22 focused checks pass; actual sofa pixels verified against native art. |

Intermediate captures are live work-in-progress evidence, not separately
committed intermediate source revisions. Final art is checkpointed in `559629e`.
All full frames remain uncropped. The gallery changes display scale only.

## Ownership and scope review

- Only lower map rows 5 and 6 change. Sofa occupies (7–9,5); the existing chair
  uses (3,6). Net change: two additional solid cells, not a map enlargement.
- `js/maps.js` remains map geometry; the existing `PalmerScene` verifies its
  footprints against it. `PalmerArt` declares matching paint bounds and
  derives foreground depths from occupied cells. No new parallel registry.
- Cast Presence, story state, connection registry, interaction targets,
  lifecycle, save format and World Engine retain their canonical owners.
- Lighting only **reads** the existing story flag; no timer, state writer,
  scheduler, new ambient archetype or Room entity.
- No `environment.program` additions or edits. This pass proves design work,
  not another metadata feature. Main does not contain the research-branch
  Program pilot, and this task does not migrate it.
- Protected `js/retro.js`, `js/retro-authored.js`, `js/tiles.js`, Double R,
  registry JSON, narrative content and upstairs geometry/art remain untouched.
- Native bounds, foreign-hook delegation, half-open depth bands, Sarah body
  exclusion, entrance exclusion, keyboard routes, upstairs day/evening equality
  and render-state immutability remain tested. Changed aesthetic/layout pins
  were updated; safety assertions were not removed.

Review performed by the implementing agent. No independent art critic,
numeric quality score or human playtest is claimed.

## Remaining room-critic findings

1. **Room / camera:** the upstairs pale floor occupies a large fraction of the
   frame. It still competes with the sitting room; this pass deliberately does
   not rebuild upstairs. A separate whole-house camera/composition study is
   warranted before calling the full frame resolved.
2. **Group:** the coffee table remains left-biased. It links the west chair to
   the sofa's left end rather than centering the whole seating group. Test
   whether people read that relationship without being told.
3. **Group:** the east piano/console/phone nook is compact. Reducing its rug
   contrast helps hierarchy, but its objects can still merge at native size.
4. **Object:** the sofa is now the right broad kind of shape, but its floral
   shorthand and very shallow back are still stylized. Human recognition of
   that silhouette is a hypothesis, not certified by its ID or footprint.
5. **Light:** the diagonal beam is intentionally hard-edged. At this pixel
   scale it can read graphic rather than natural; view it in motion and on
   the intended display before doing another lighting pass.
6. **Life:** ordinary-use details exist, but this is not an ambient-life or
   temporal-naturalness study. Static room improvement does not prove that
   long observation feels lived-in. No new narrative residue was invented.

Do not automatically “fix” those with more props. Highest-value next check:
show the full entrance view to someone, then let them walk without directing
their attention. Ask what room this is, where they would go, and what felt odd.

## Test evidence

| Gate | Result | Evidence / boundary |
|---|---|---|
| Baseline Palmer native | PASS | Run before edits; original bounds, depth, keyboard routes and light-order tests green. |
| Final Palmer native | PASS | Extended tests cover real sofa footprint, blind slats, canonical evening light, unchanged upper pixels and no story-state writes. |
| Release Node commands | **126/128 PASS** | [Full report](../artifacts/room-method-palmer/validation/node/report.json); all per-command logs retained. Not an all-green release. |
| Smoke / walkthrough | PASS: 415 checks / 85 acquisitions | Included in release run. Walkthrough is a simulator. |
| Cast / doors / world / Builder | PASS | Cast continuity, cast sync, registry equality, connections, world loading, catalog and editor tests included. |
| Collision / other native rooms | PASS | Interior zoning, prop semantics, Palmer and other room-native tests included. |
| Narrative / mobile / ambient | PASS | Act flows, narrative validators, story truth, retro/mobile production and ambient/activity tests included. |
| Focused production Palmer walk | **22/22 PASS** | [Results](../artifacts/room-method-palmer/validation/palmer-browser.json), [log](../artifacts/room-method-palmer/validation/palmer-browser.log). Initial setup at town's registry door approach; subsequent crossings and routes use keyboard helpers, not teleports. |
| Act 4 Chrome `--path=all` | **434/472 reached assertions PASS; FAIL overall** | [Log](../artifacts/room-method-palmer/validation/act-4-browser.log), [assertions/transcripts](../artifacts/room-method-palmer/validation/act-4-transcripts/assertions.json). Did not reach historical 530 checks. No acceptance claim. |
| Human / unseeded campaign | NOT RUN | No claims of improved comprehension, beauty, atmosphere or campaign acceptance. |

### Pre-existing Node failures, verified on unchanged main

- `character-runtime-contract.js`: committed cast atlas differs from recipes
  for Truman, Jacoby, Audrey, Maddy and BOB; `atlasSame:false`. Same assertion
  reproduced on clean base `7a3de3f`.
- `living-town-suite.js`: `cafe-scene.js` fails “the committed sheet is what
  the recipes compile to.” Same failure reproduced on clean base. Restricted
  first run additionally hit loopback `EPERM`; unrestricted rerun passes its
  live-server 41/41 checks but retains the sprite mismatch. See
  [unrestricted log](../artifacts/room-method-palmer/validation/living-town-unrestricted.log).

These are not repaired in a Palmer art task. Reproduction identifies existing
failures; it does not excuse their release impact.

### Browser failures / rejected evidence

The full Act 4 run suffered `ERR_CONNECTION_RESET` / `ERR_SOCKET_NOT_CONNECTED`
for local resource loads. Path A reload missed `engine/ember-camera.js` and
then failed engine boot; path C missed `world-connections-production.js`,
failed to leave Roadhouse and produced downstream narrative failures. Path B
also recorded a resource error. This run is invalid as clean campaign
acceptance. **A baseline full-browser rerun was not performed**, so these are
not reported as baseline-proven browser failures.

The focused Palmer browser test reuses the already existing Node HTTP/CDP
helper and original production input probe. It verifies actual native-art
pixels as well as routes, addressing the narrower room question without
altering the campaign harness or adding a server abstraction.

One static capture timed out at `TP-RETRO-LOADING`. An initial evening capture
showed legacy art despite its ready marker. Both were rejected, not counted
as visual evidence. Runtime inspection confirmed the native module/geometry;
fresh capture and separate production pixel checks passed. The accepted files
are the ones listed in the manifest.

## Files and delivery

| File | Change |
|---|---|
| `js/maps.js` | Two lower-room rows: real sofa width and reused chair cell. |
| `js/palmer-scene.js` | Existing footprint contract updated to match. |
| `js/palmer-art.js` | Shared sofa, quiet rug/floor/mat, sourced window light and story-owned evening materials. |
| `test/palmer-native.js` | New layout expectations plus preserved safety and day/evening invariants. |
| `test/palmer-design-browser.js` | Focused real-production acceptance using existing helpers. |
| `artifacts/room-method-palmer/` | Baseline, intermediate and final frames; intent card, gallery, hashes, logs and production snapshots. |
| `reports/room-method-palmer-post.md` | First-person, practical post grounded in this actual pass, with primary-source references. |
| `reports/room-method-palmer.md` | This audit, limitations and non-green tests. |

Generated tracked Act 4 and Cast Presence artifacts were restored after their
new results were copied to this task's evidence folder. Initial dirty root
checkout was never used for changes. Task branch is pushed; no main merge,
pull request, deployment, vault write or wider room rollout.
