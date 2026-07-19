---
type: project
status: active
started: 2026-07-18
---

# Twin Peaks Game

Mini-RPG in stile **Pokémon Nero/Bianco (DS)** ambientato a Twin Peaks: sei l'agente Cooper, indaghi sulla morte di Laura Palmer. **Motore 3D vero (THREE.js/WebGL)**: mondo in geometria 3D — terreno texturizzato con la pixel-art procedurale, edifici estrusi con tetto a padiglione, muri interni estrusi, alberi/cartelli/personaggi come sprite billboard — camera prospettica inclinata ~55° con lerp. L'architettura esatta di Pokémon B/W (mondo 3D + sprite 2D). UI (dialoghi/menu/titolo) su canvas 2D overlay. Fallback 2D automatico se WebGL manca.

## Come si gioca

Aprire `index.html` nel browser (doppio click: funziona da `file://`). Su mobile: D-pad virtuale + pulsanti A/B (touch), tap per avanzare i dialoghi.

- Frecce/WASD: muovi · Z/Invio: parla/interagisci · X/Esc: menu indizi · N (al titolo): nuova partita
- Salvataggio automatico a ogni porta (localStorage), "Continua" dal titolo.

### Campagna in 5 atti (~90 min) — arco Laura Palmer
1. **Il paese dei ciliegi** — arrivo, diario, camera di Laura, 3 indizi → bosco → il SOGNO nella Stanza Rossa (Laura sussurra il nome, al risveglio è svanito).
2. **Il rapporto dell'autopsia** — risveglio nella stanza 315 del Great Northern; Ben Horne, Audrey che indaga, Ronette in coma ("BOB!"), la poesia del fuoco di Gerard, il cuore ricomposto di James.
3. **Una notte alle Giacche** — il vagone del treno ("FUOCO CAMMINA CON ME", l'anello), One Eyed Jacks, l'arresto di Jacques, la sua morte in ospedale, il Gigante coi tre enigmi.
4. **Il gigante e la cugina** — Maddy appare e svanisce, la visione di Sarah, il Gigante al roadhouse ("Sta accadendo di nuovo"), il ritrovamento al lago, la lettera "O".
5. **Attraverso l'oscurità del futuro passato** — l'interrogatorio di Leland, BOB affiora, la confessione, la morte in cella, ritorno alla Loggia: il Nano, BOB, Laura ("Ti rivedrò fra venticinque anni").

Gating: flag/indizi su porte e dialoghi a cascata; ~12 indizi nel menu X (diario dell'indagine). Il grafo è validato da `test/walkthrough.js` (simulatore data-driven: 82 acquisizioni, finale raggiungibile, atti non saltabili).

## Architettura

| File | Ruolo |
|---|---|
| `js/tiles.js` | tile 16×16 del mondo, stile B/W (erba screziata, acqua con schiuma, alberi alti che sbordano in su) |
| `js/chars.js` | sprite personaggi chibi 16×20 (testona, contorno scuro, camminata 2 frame + bob) |
| `js/houses.js` | edifici volumetrici disegnati sopra i tile piatti (tetto trapezio a scandole, facciata a tronchi, finestre, porte incassate) |
| `js/maps.js` | 6 mappe ASCII: town, sheriff, palmer, diner, woods, redroom (API `GAME.maps`) — tutte le case guardano a sud (porte in basso, stile Pokémon) |
| `js/data.js` | dialoghi in italiano, indizi, intro, gating |
| `js/engine.js` | game loop, input, movimento a griglia, **renderer prospettico** (mondo 2x su offscreen 640×400 → composito a strisce 1px con scala 0.72→1.0), camera easing, fallback timer per tab nascoste, dialoghi, stati (API `GAME.Engine`) |
| `js/render3d.js` | **motore 3D THREE.js**: scene per mappa, bake del terreno da tiles.js, edifici hip-roof in BufferGeometry con facciate ricche (finestre/tende/portico/insegne per edificio), luci hemisphere+sole con ombre PCFSoft, blob-shadow per gli sprite, acqua/olio come mesh dedicate animate, muri estrusi, billboard (alberi, cartelli, personaggi via chars.js), camera follow, fullscreen responsive |
| `js/vendor/three.min.js` | THREE.js r147 UMD vendorizzato (self-contained, funziona da file://) |
| `js/glue.js` | ponte tra generazioni di API (`GAME.Sprites`/`GAME.Maps` per l'engine) + dati NPC + normalizzazione porte/oggetti |
| `js/main.js` | bootstrap (canvas WebGL + canvas UI overlay) |
| `test/smoke.js` | `node test/smoke.js` — 104 controlli: struttura mappe/dialoghi/NPC + partita completa simulata |

Canvas 480×320 (CSS 960×640). Storia: engine+data scritti in una prima sessione, sprites+maps riscritti in una seconda con API diversa; `glue.js` riconcilia. Restyle B/W del 2026-07-19 fatto con swarm di subagent paralleli (tiles/chars/houses), renderer prospettico nel main thread.

## Note tecniche v3D

- Mappe grandi (2026-07-19): town 56×36, woods 28×22 — generate e validate con `test/genmaps.js` (BFS: ogni porta/NPC/oggetto raggiungibile dallo spawn). Per modificarle: rigenerare con lo script, non a mano. Spawn town (28,33).
- Camera: CAM_UP 13.5 / CAM_BACK 9.2 (zoom largo, ~24 tile visibili); nebbia 38→80.

- Fullscreen: canvas WebGL = finestra intera; canvas UI logico 160px di altezza × larghezza proporzionale (`UW` dinamico in engine.js), SCALE 2.
- Luci per tipo mappa: esterni hemi 0.6 + sole 0.68 con ombre 2048; interni caldi più tenui; Stanza Rossa rossa. Somma hemi+sun ≤ ~1.3 o il Lambert clippa (prato slavato).
- Acqua: mesh dedicate y=0.03 con CanvasTexture ridipinta ogni 200ms (onde/brillii deterministici da seed).

## Idee per dopo

- [ ] Musica/effetti (WebAudio, tema di Badalamenti a onde quadre?)
- [ ] Descrizione indizi nel menu (ora solo il nome; `desc` già in data.js)
- [ ] Interno del Great Northern + Audrey quest
- [ ] Salvataggio in localStorage
- [ ] Secondo atto: BOB, il gufo, Leo Johnson

## MEMORY

- [2026-07-19] Decision: motore grafico definitivo = THREE.js r147 vendorizzato (WebGL). Le due iterazioni 2D (retexture piatto, poi warp Mode7 + billboard software) bocciate dall'utente: voleva un motore 3D vero. Le texture restano generate dalla pixel-art procedurale (tiles.js/chars.js) → zero asset, look coerente.
- [2026-07-19] Pattern: pipeline render3d — bake del terreno in una CanvasTexture per mappa (ripaint solo tile animati ogni 250ms), geometria per ciò che ha volume (edifici, muri), billboard per ciò che è "sprite" (alberi, personaggi, prop). UI su canvas 2D overlay trasparente sopra il canvas WebGL.
- [2026-07-19] Insight: primo tentativo B/W bocciato dall'utente — avevo disegnato le case in ALZATO (facciata frontale piatta). Il look B/W è proiezione obliqua top-down: si vede il PIANO del tetto (~70% dell'edificio), facciata bassa solo-porta, mobili come scatole (faccia sup. chiara + fronte scuro). Guardare la geometria del riferimento PRIMA di disegnare.
- [2026-07-19] Decision: pipeline B/W autentica in engine: terreno schiacciato (PITCH 1.25) + warp prospettico a strisce (TOP_SCALE 0.72), personaggi come billboard NON schiacciati compositati sopra, scalati con la riga (destOf lookup). Siepi dietro gli edifici per evitare glitch di occlusione (pattern Pokémon).
- [2026-07-19] Decision: grafica target = Pokémon Nero/Bianco (non GBA flat): case volumetriche in modulo separato `houses.js` sopra i tile piatti, tutte le case rivolte a sud.
- [2026-07-19] Pattern: restyle grafico fatto con swarm di 3 subagent paralleli su file separati (tiles/chars/houses), specs con vincoli di bounds + comando di verifica; il main thread tiene renderer e integrazione. Zero conflitti.
- [2026-07-19] Insight: Chrome sospende rAF nelle tab nascoste/occluse → "il gioco non si muove". Fix: fallback setInterval che chiama tick() se rAF fermo >200ms (guardato con `typeof document` per non appendere node nei test).
- [2026-07-19] Insight: Chrome memory-cache serviva JS vecchi anche dopo modifica; il server dev ora manda `Cache-Control: no-store` (scratchpad/serve.py).
- [2026-07-19] Decision: tenute entrambe le generazioni di codice (engine/data vs sprites/maps) e riconciliate con `js/glue.js` invece di riscrivere — engine+data erano già coerenti tra loro, sprites+maps avevano la grafica migliore.
- [2026-07-19] Pattern: `test/smoke.js` gioca l'intera partita in node con canvas stubbato — qualsiasi modifica a mappe/dialoghi va verificata con `node test/smoke.js` prima di aprire il browser.
