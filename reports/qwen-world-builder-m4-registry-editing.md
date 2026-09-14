# World Builder M4 — Registry Editing

This report documents the STEP 6 manual-verification outcome for the registry-editing
milestone: what the shared, browser-independent code path proves on its own, and what
genuinely requires a driven browser that this environment does not provide. The end-to-end
flow is exercised headlessly by `test/step6-driver.js`; every claim below cites the exact
test or function that backs it so a reader can re-run and confirm without a browser.

## STEP 6 — manual verification

### A. Confirmed via shared code paths

These behaviours are what world-builder.html's buttons would *eventually* call, so they are
verifiable now even though the UI is read-only (M3). Each is asserted by a named test:

- **Scene selection incl. traincar + sheriff scenes.** Selection resolves over the real
  catalog and reaches every core scene — `test/world-builder.js:78` asserts all 7 core scenes
  (`town, diner, sheriff, traincar, oej, room_315, hospital`) exist in `snap.scenes`, and
  `:100–101` pins `sheriff` as interior 16×12 with 4 npc overlays. `step6-driver.js` reports
  "scene selection x3 (incl traincar+sheriff)".
- **Endpoint edit → diff.** An endpoint edit becomes a versioned changeset operation:
  `js/editor/core/draft.js` (`Draft.upsertConnection` / `createDraft` / `toChangeset`) feeds
  `Changeset.addUpsert`, which appends a frozen, version-bumped operation; reducing it is
  `Changeset.applyChangeset`. Proven by `test/editor/changeset.js` (PASS 9), including the
  negative case at L51–52 where a record naming a non-existent endpoint scene is rejected
  ("scene must name a scene").
- **Accept / cancel.** Accept = a dry-run `apply()` that bumps the version and, for a real
  commit, writes an atomic registry + audit sidecar then reloads frozen; cancel = history undo
  back to the baseline snapshot. Source: `js/editor/apply/changeset-apply.js`
  (`CA.apply`, dry-run default) and the history layer that expresses cancel as an undo-to-
  baseline. Proven by `test/apply-changeset.js` (PASS 14 — dry-run version bump, add/remove,
  atomic commit + audit sidecar, frozen reload, loud rejection, cast view, idempotence) and
  `test/editor-apply-preflight.js` (PASS 9).
- **Cast snapshot read-only.** The story-moment cast view is a projection of the world snapshot
  rendered read-only: `WB.buildWorldSnapshot(source)` feeds the CAST VIEW in
  `step6-driver.js:153–154`, backed by `CastPresence.resolve` / `CastPresence.where` in
  `js/cast-presence.js`. No mutation path reaches back into the authored cast data.

All four groups are exercised end-to-end by `node test/step6-driver.js`, whose summary prints:
**PASS — scene selection x3 (incl traincar+sheriff), endpoint edit→diff, accept+cancel, and
read-only cast snapshot all exercised with concrete before/after values.**

### B. Blocked (requires a driven browser, unavailable here)

The following cannot be confirmed in this environment. The exact limitation:

> This env has NO browser-automation tooling — no Playwright, no Puppeteer, no CDP client;
> `Chrome.app` is installed but undriven — and `world-builder.html` is a READ-ONLY M3 UI (a scene
> dropdown + canvas + click-to-inspect) with **no clickable accept/cancel endpoint editor yet**.
> So pixel rendering on the canvas and genuine mouse clicks cannot be confirmed here.

What is therefore *not* verified by STEP 6:

- Actual pixel rendering of overlays onto a real canvas (the render plan is pure, but no
  `getContext`/paint path is driven — see `test/editor-runtime-isolation.js`, which asserts the
  core stays UI-free).
- Real user clicks driving selection or an accept/cancel button, because that clickable
  accept/cancel editor does not exist in M3 yet — `world-builder.html:8,27–28` state "No save
  UI, no tile editing … M3 click to inspect."

These two items are deferred to a milestone that wires the interactive endpoint editor onto the
UI; everything behind those buttons (selection, draft, changeset, apply, history, cast view) is
already proven by the shared code paths in §A.

---

## STEP 6 — manual verification (this pass: end-to-end chain + full gate sweep)

The primary §A/§B above predate this pass; the milestone's shared-path proof was then extended
with an end-to-end chain assertion and a full editor-gate re-run. Every claim below is backed by a
named test that passed `exit 0` on this pass; the §B limitation string is restated verbatim because
nothing about what a browser adds (or cannot, here) changed.

### A. Confirmed via shared code paths (added this pass — each cites its test)

- **`adaptWorld(GAME) → snapshot → buildWorldModel(snapshot)` end-to-end, by reference not shape.**
   `test/world-builder.js` "CHAIN:" asserts (6 of them; suite now 83/83) prove the returned
    `snapshot` IS, by object identity, the exact input `Editor.model.buildWorldModel` consumes; that
  the model is a single `Object.isFrozen` tree whose `scenes` / `connectionsById` / `locationsById`
  are mutually consistent sub-trees (location refs reused by identity, no second cloned tree); and
   that a real scene (`diner`) and a real connection each resolve through BOTH the snapshot layer and
  the model layer with stable endpoint ids. `node --check test/world-builder.js` is clean.
- **Full editor core suite green.** All eight `test/editor/*` files pass `exit 0`: changeset=9,
  history=19, hit-test=14, identity=34, inspector=30, interaction=31, model=8, world-builder-core=26.
- **Runtime isolation holds over the full core set.** `test/editor-runtime-isolation.js` (PASS 6)
  scans and asserts game-free + UI-free across the complete 11-module core: changeset, draft, history,
  hit-test, identity, index, inspector, interaction, model, selection, validation — so the editor core
  never reaches into runtime or DOM.
- **Cross-gates unchanged.** `test/smoke.js`=415 and `test/walkthrough.js`=85 both pass `exit 0`,
  confirming the registry-editing changes introduced no regression to the authored game runtime.

### B. Blocked (requires a driven browser, unavailable here) — exact limitation string, restated

> This env has NO browser-automation tooling — no Playwright, no Puppeteer, no CDP client;
> `Chrome.app` is installed but undriven — and `world-builder.html` is a READ-ONLY M3 UI (a scene
> dropdown + canvas + click-to-inspect) with **no clickable accept/cancel endpoint editor yet**.
> So pixel rendering on the canvas and genuine mouse clicks cannot be confirmed here.

The two items therefore *not* verified this pass are the same two as primary §B, deferred to a
milestone that wires the interactive endpoint editor onto the UI:

- **Actual pixel rendering** of overlays onto a real canvas — no `getContext`/paint path is driven;
   the render plan is pure and the core stays UI-free per `test/editor-runtime-isolation.js`.
- **Genuine user clicks** driving selection or an accept/cancel button — that clickable editor does
   not exist in M3 yet (`world-builder.html:8,27–28` read "No save UI, no tile editing … M3 click to inspect").

Everything behind those two un-driven surfaces (discovery, chain wiring, draft, changeset, apply,
history, selection, cast view, and the end-to-end model build proven in §A above) is confirmed by the
shared code paths re-run this pass.
