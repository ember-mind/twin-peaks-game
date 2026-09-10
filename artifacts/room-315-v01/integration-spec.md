# Room 315 — integration spec (wiring, narrative, world, tests)

Goal: replace the placeholder wake-up destination (the top-right nook of `hotel_gn`) with the new native map `room_315`. Engine untouched. Art/scene files are built by a separate builder from `native-translation-brief.md`; this spec covers everything else. Both must agree on the rows below.

## 1. `js/maps.js`
Add after `hotel_gn`:
```js
    room_315: {
      id: 'room_315',
      indoor: true,
      rows: [
        'TTTTTTTTTTTTTTTT', // 0  muro nord (finestra, specchio, quadro)
        'TTTTTTTTTTTTTTTT', // 1
        'TTTTTTTTTTTTTTTT', // 2
        'TTTTT..TTT..TT.T', // 3  letto(1-3,3), comodino(4,3), scrittoio(7-9,3), comò+specchio(12-13,3)
        'TTTT...........T', // 4  letto(1-3,4)
        'TTTT...........T', // 5  letto(1-3,5)
        'T..............T', // 6  risveglio: spawn 2,6 giù (piedi del letto)
        'T............T.T', // 7  portavaligie(13,7)
        'T..............T', // 8
        'T..............T', // 9
        'T..............T', // 10 spawn dal corridoio 7,10 su
        'TTTTTTT.TTTTTTTT'  // 11 porta 315 -> corridoio Great Northern (7,11)
      ],
      doors: {},
      interact: { '12,3': 'specchio315', '13,3': 'specchio315', '1,5': 'letto_315', '2,5': 'letto_315', '3,5': 'letto_315', '8,3': 'scrivania_315' },
      onEnter: { dialogue: 'hotel_risveglio', once: 'intro_hotel' }
    },
```
`hotel_gn`: row 1 becomes `'ifffffffffffiiDiii'` (x14 = door glyph, old room cells removed); delete its `interact` `'15,1'` and its `onEnter`; comment row 1 "corridoio verso la stanza 315". The hall door is compiled by the LocationConnection (§3), so do not hand-write it in `doors`.
`redroom` door `'8,11'` → `{ to: 'room_315', tx: 2, ty: 6, dir: 'down' }` (keep the comment).

## 2. `js/glue.js`
- `INTERACT_DLG`: add `letto_315: 'letto_315'`, `scrivania_315: 'scrivania_315'`; the `specchio315` cascade already exists.
- `SPARKLE`: add `specchio315: 1` (the mirror is a narrative hook; it stays sparkled until read — the engine's cascade-aware sparkle handles the cascade).
- `NPCS.room_315 = []` if the NPC table requires every map (check how missing keys are handled; add only if needed).

## 3. New `js/room-315-location-data.js` (`GAME.Room315LocationConnections`) and `js/room-315-production.js`
```js
var hall = {
  id: 'great-northern-room-315-hall',
  a: { scene: 'room_315', triggers: [[7,11]], spawn: { tx: 7, ty: 10, dir: 'up' } },
  b: { scene: 'hotel_gn',  triggers: [[14,1]], spawn: { tx: 14, ty: 2, dir: 'down' } }
};
```
Production: `G.Room315Scene.install()` then install the connection. No EnvironmentReactions (stillness accepted; review later).
Script tags in `index.html` and `test/retro-scene.html`, after the sheriff block and before `character-life-scenes.js`: `room-315-art.js`, `room-315-scene.js`, `room-315-location-data.js`, `room-315-production.js`.

## 4. `js/world-catalog.js`
Add location `{ id: 'great-northern', environments: [{ id: 'room-315', sceneId: 'room_315' }, { id: 'lobby', sceneId: 'hotel_gn' }], connections: ['great-northern-room-315-hall'] }`, with a one-line comment on the `lobby` environment that it is the legacy glyph map, not a native-authored environment. `hotel_gn` IS registered as this second environment: the world-catalog invariant that both endpoints of every connection resolve to a cataloged location must not be weakened, and `hotel_gn` is pre-existing playable content (Ben Horne, Audrey, town door), so it earns the registration rather than an exemption from the check. Update `test/world-engine-v0.1-catalog.js` expected location/environment/connection lists accordingly.

## 5. `js/data.js` dialogues (prose is final, do not edit wording)
Modify `hotel_risveglio` page 1 text to: `Diane, sono le 6:20. Stanza 315, Great Northern. Ho dormito vestito, con la lampada accesa.`
Add:
```js
    letto_315: { pages: [
      { name: '', text: 'Il letto è disfatto da un lato solo. La coperta di lana è ancora piegata ai piedi.' },
      { name: 'COOPER', text: 'Mi sono steso sopra le coperte, vestito. Volevo chiudere gli occhi un minuto.' }
    ], again: { pages: [ { name: 'COOPER', text: 'Un minuto. Sono passate sette ore e un sogno.' } ] } },
    scrivania_315: { pages: [
      { name: '', text: 'Registratore, nastro a metà. Il taccuino aperto su una pagina bianca.' },
      { name: 'COOPER', text: 'La pagina è di stanotte. Volevo scrivere il nome appena sveglio. Non ci sono arrivato.' }
    ], again: { pages: [ { name: 'COOPER', text: 'Pagina bianca. Il nome non torna a guardarla.' } ] } },
```
Check how `again` is shaped on existing entries (e.g. `laura_room_andy`, `norma`) and match it exactly.

## 6. Tests to update (grep `hotel_gn`, `15,2`, `15,1`, `intro_hotel`)
- `test/smoke.js`: the Giant teleport `(15,2,up)` in `hotel_gn` → `room_315` `(12,4,'up')`; add `room_315` to the structural `mapIds`; Ben Horne/Audrey teleports stay in `hotel_gn`.
- `test/narrative-slice-01.js`: onEnter assertion → `GAME.Maps.room_315.onEnter`; add a check that `hotel_gn.onEnter` is absent and that `redroom` door `8,11` targets `room_315` at 2,6.
- `test/interior-zoning-reachability.js`: mirror mission target → `room_315` `[12,3]` from spawn `[2,6]`; `hotel_gn` protected corridor now `[13,2]..[16,4]` + door `[14,1]` reachable from `[8,10]`.
- `test/probe-acts12-pacing.js`, `test/performance-gate.js` (add `{ id:'room_315', x:2, y:6, dir:'down' }`), `test/visual-audit-matrix.json` (add a `room315` entry, same shape), `test/graphic-pass-contract.js` `interiorMaps` (add `room_315` only if the contract is generic).
- `test/walkthrough.js`: verify the finale path still reaches `gigante1` (it reads the mirror by dialogue id, not by map — confirm).
- New `test/room-315-native.js` modelled on `test/sheriffs-station-native.js` (rows == authored rows, integer rects, footprints ⇄ definitions parity, spawn tiles walkable, door trigger walkable, capture 256×192 non-black) and `test/room-315-location.js` modelled on `test/sheriffs-station-location.js` (redroom → room_315 wake spawn + onEnter once flag, room ↔ hotel_gn hall both ways, held-input no-bounce, hotel_gn → town still works, save round-trip in room_315).
- `canonical-sync.manifest.json` + `test/canonical-sync.js` count: add the 4 new js files (and any new test) to the runtime scope (86 → 90); vault sync happens at the end, not now.

## 7. Do not
Touch `js/engine.js`, `js/world-engine.js`, `js/location-connections.js`, Character Life, Ambient Life, any Coldstage command or baseline. Do not run Coldstage.
