# tp-ui audit

Live desktop/mobile rendering could not start in this environment: required headless Chrome aborts with `SIGABRT` before navigation, even with `--no-sandbox`; `.audit/touch-preflight/{portrait,landscape}/session.json` records both failures. Therefore no screenshot, live console, or live network verdict is claimed. Static checks passed: `node test/smoke.js` (415), `node test/touch-runtime.js` (13/13), `node test/choice-prompts.js` (18/18), `node test/dialogue-presentation.js`, and `index_local_refs_missing=0`. Findings below are limited to source paths traced in the production UI.

## 1. Title instructions contradict actual touch actions

**Severity**: P1 (clearly wrong, visible to any player)

**Where**: Fresh title screen, desktop and touch; `js/engine.js:1431-1438`, `js/touch.js:516-528`, `js/engine.js:552-563`.

**What**: Touch title button A is labelled `CONTINUA` even when no save exists; its first press starts the intro. The bottom legend says `B PROVE`, but visible touch B is `NUOVA` and its handler starts a new game. Desktop copy says `INVIO: ESAMINA`, although Enter starts or resumes the game. First-time player gets mutually inconsistent answers for “what do I press first?”

**Evidence**: `drawTitle()` emits fresh `TOCCA PER INIZIARE`, then always emits `D-PAD  A ESAMINA  B PROVE`; touch sync emits A `CONTINUA` and B `NUOVA`; `pressB()` on title calls `pressN()`.

**Suggested fix**: Derive title legend/button labels from `hasSave()` and actual handlers. Fresh state should say “Nuova partita / Inizia”; saved state should say “Continua”; do not call B “Prove” on title.

## 2. “Nuova partita” deletes local progress without confirmation

**Severity**: P1 (clearly wrong, visible to any player)

**Where**: Title with an existing save; touch B `NUOVA` or keyboard `N`; `js/engine.js:552-563`, `js/engine.js:210-213`, `js/narrative-production.js:356-365`.

**What**: One activation immediately removes `tp_save`, switches to intro, and the narrative sync then clears the correlated narrative slot. No confirmation, backup choice, or undo is shown. Expected behavior: explicit confirmation before destructive reset, with Continue remaining safe.

**Evidence**: `pressB()` routes title to `pressN()`; `pressN()` calls `clearSave()` before setting intro; `clearSave()` calls `localStorage.removeItem('tp_save')`; intro reset clears the narrative slot when no classic save remains.

**Suggested fix**: Add a confirmation state (“Cancella salvataggio e inizia?”) and only clear both slots after confirm. Keep cancel/Continue path non-destructive.

## 3. Phone playfield and notebook text stay at native 256×192 / 1×

**Severity**: P2 (noticeable flaw)

**Where**: `390×844` portrait touch; `js/main.js:241-257`, `js/touch.js:197-202`, `js/narrative-engine-adapter.js:211-222`, `js/retro-ui.js:9-11`, `js/retro-ui.js:205-260`.

**What**: At 390×844, sizing computes `gameHeight=455.76`, `fit=1.5234375`, then floors scale to `1`, producing a `256×192` stage. B opens the narrative notebook through KeyT, but its visual renderer is also hard-coded to a 256×192 canvas and scale-1 bitmap glyphs. Phone uses only 256 of 390 horizontal CSS pixels; notebook/choice text remains 5×7/6px rather than gaining phone-readable display scale.

**Evidence**: Command output:

```text
{ gameHeight: 455.76000000000005, fit: 1.5234375, scale: 1, stage: [ 256, 192 ] }
```

`retro-ui.js` sets `W=256`, `H=192` and calls `RF.draw(... scale: 1)`; the semantic DOM is made transparent by `index.html:400-407`.

**Suggested fix**: Give portrait phones a deliberate display-scale mode: scale the full stage to the available width, or render notebook/dialogue text in a screen-space layer while retaining native-pixel world art.

## 4. Mobile mute control is not a semantic or keyboard-accessible button

**Severity**: P2 (noticeable flaw)

**Where**: Touch audio control; `js/audio.js:748-781`.

**What**: Mute UI is a bare `<div>` showing `♪`/`✕`. It has no role, accessible name, `tabindex`, `click` handler, or keyboard handler; only `touchstart` toggles audio. Finger touch can mute, but keyboard, switch control, and screen-reader activation cannot. Expected behavior: a real labelled button with pressed state.

**Evidence**: `buildMuteButton()` uses `document.createElement('div')`; only `touchstart` and `contextmenu` listeners are registered. `setupMuteButton()` creates it only on touch-capable devices. Desktop only registers undocumented `KeyM` at `js/audio.js:736-738`.

**Suggested fix**: Use `<button type="button" aria-label="Disattiva audio" aria-pressed="false">`, handle click/keyboard, and update label/pressed state on toggle. Expose the same control on desktop.

## 5. Narrative choices and notebook rows cannot receive keyboard focus

**Severity**: P2 (noticeable flaw)

**Where**: Narrative choice and notebook overlays; `js/narrative-ui.js:64-70`, `js/narrative-notebook.js:153-176`, `js/narrative-notebook.js:178-188`, `index.html:396-407`.

**What**: Choices, sections, rows, Back, and Close are `<div>` elements with `onclick` handlers but no `tabindex`, button role, or focus management. The semantic container is made transparent and the visible retro canvas is `aria-hidden="true"`. Window-level key listeners make arrow/Enter gameplay work, but Tab and assistive focus cannot enter or announce the actionable rows. Expected behavior: focusable labelled controls and focus return to the opener.

**Evidence**: Notebook `render()` creates `.nw-opt` divs and assigns `onclick`; narrative choices do the same. `retro-ui.js` paints the canvas and marks it `aria-hidden`, while CSS hides semantic UI.

**Suggested fix**: Render semantic controls as buttons or give actionable rows equivalent roles/tab stops, keep them discoverable to assistive tech, and restore focus when each overlay closes.

## 6. Desktop mute affordance is undiscoverable

**Severity**: P2 (noticeable flaw)

**Where**: Desktop title/gameplay; `js/audio.js:736-780`, `js/engine.js:1435-1438`.

**What**: Desktop has no mute/settings button. Audio can only be muted with undocumented `M`; title help lists movement and examine/continue actions but never mentions M. Expected behavior: first-time player can find audio control in the visible interface or help.

**Evidence**: `setupMuteButton()` returns when `isTouch` is false; only `window` KeyM handler remains. `drawTitle()` emits no audio instruction.

**Suggested fix**: Add the labelled mute button to both layouts, or add a visible settings/help affordance documenting M and current audio state.
