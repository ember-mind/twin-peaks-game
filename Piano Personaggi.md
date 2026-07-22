---
type: project-note
created: 2026-07-20
---

# Piano: grafica e movimento dei personaggi

**Stato: COMPLETATO 2026-07-22** — tutte le fasi A-E implementate, smoke 356 ✔ / walkthrough 85 ✔, verifica visiva headless fatta (screenshot poi rimossi; rigenerabili con `test/shot.sh`).

Obiettivo: portare i personaggi da "chibi a 2 frame" a un livello da indie moderno (riferimenti: *Link's Awakening remake*, *Octopath*, *Eastward*), mantenendo i vincoli: zero asset, procedurale da canvas, `file://`, mobile, test node verdi.

## Stato attuale

- `js/chars.js` — sprite 16×20 chibi, 1 funzione `drawChar` per tutti i 23 personaggi, **2 frame** di camminata + bob 1px, 4 direzioni.
- `js/render3d.js` — personaggi come `THREE.Sprite` billboard (scala 1.0×1.5), blob-shadow a disco piatto, texture da `charTex()` (canvas 32×48).
- `js/engine.js` — movimento a griglia, frame = `moving ? (t/120 % 2) : 0`.
- NPC: fermi, frame 0, nessuna idle animation, nessun movimento autonomo.

## Art direction

- Tenere il chibi B/W (è la firma del gioco), ma alzare la risoluzione **logica** a 24×30: più spazio per volti (occhi/sopracciglia), mani e dettagli iconici (trench e cravatta di Cooper, cappello di Truman, occhiali 3D di Jacoby, tronco della Log Lady).
- Palette: 4-5 toni per area (skin/hair/shirt/pants) con ombreggiatura a 2 livelli, non solo riempimento piatto.
- Regola d'oro: guardare i riferimenti prima di disegnare (MEMORY 2026-07-19).

## Fase A — Redesign sprite (1-2 sere) — `js/chars.js`

- [x] Griglia logica 16×20 → **24×30** (canvas 48×60 in `charTex`); `drawChar` rifattorizzata in helper per pezzi: `drawHead`, `drawBody`, `drawArms(frame)`, `drawLegs(frame)`.
- [x] **4 frame di camminata** (contatto, passaggio, contatto, passaggio — gambe alternate) invece di 2: il ciclo diventa fluido.
- [x] Volto: occhi 2px + bocca + sopracciglia per direzione; capelli con silhouette uniche per personaggio (Laura/Lucy lunghi, Donna coda, Hawk piuma, Giant canuto).
- [x] Accessori: cravatta rossa di Cooper leggibile a 24px, badge, cappello di Truman con visiera, occhiali (Jacoby rosso/blu, Maddy), tronco della Log Lady come prop laterale.
- [x] **Idle frame**: respiro (bob verticale ±0.5px su ciclo 2s), blink (occhi chiusi 100ms ogni ~3-5s, deterministico su t+id).
- [x] NPC "turn": frame extra guardando a sinistra/destra per l'idle look-around.

## Fase B — Movimento player (1 sera) — `js/engine.js` + `render3d.js`

- [x] Ciclo frame da `t/120 % 2` → **t/90 % 4** (4 frame) + bob verticale continuo.
- [x] **Turn-in-place**: cambio direzione senza passo mostra un micro-frame di rotazione (50ms) prima dello step.
- [x] Accelerazione/decelerazione: i primi/ultimi 60ms dello step rallentano (easing `1-(1-t)^2`) invece di velocità costante — cancella l'effetto "scivolata".
- [x] **Dust puff** ai piedi a ogni passo (2-3 particelle, fade 300ms) — solo su erba/terra.
- [x] Camera **lead**: la camera anticipa la direzione di marcia di ~1 tile (lerp lento), invece di essere sempre centrata — sensazione moderna immediata.

## Fase C — Vita degli NPC (1-2 sere) — `js/engine.js` + `js/glue.js`

- [x] **Idle look-around**: ogni NPC cambia `dir` ogni 3-6s (seed per id), torna al player quando si parla (già gestito con `opposite()`).
- [x] **Wander**: flag `wander: true` in `data.js` per 3-4 NPC in town (Bobby, Donna, Audrey) con waypoint piccoli (raggio 3-5 tile dalla base); camminata con gli stessi frame del player, collisioni disattivate verso il player (gli NPC si scostano di 1 tile se il player entra nella loro cella — oppure si fermano e guardano).
- [x] Ombra morbida: blob-shadow a disco → **gradiente radiale** (canvas con alpha decrescente) per player e NPC.
- [x] Bob di camminata anche per gli NPC che si muovono.

## Fase D — Polish 3D (1 sera) — `js/render3d.js`

- [x] Sprite characters: scala 1.15× (con la nuova risoluzione la figura resta proporzionata al mondo), `center` tarato sui piedi.
- [x] Y-bob in `render3d.js` durante la camminata (sprite Y += |sin(t)|×0.03) in aggiunta al bob pixelato — più fluido.
- [x] "Sun rim": seconda sprite pass con alpha 0.08 bianca sopra? NO — meglio: pixel di rim-light sul lato sole dentro `drawChar` (1px chiaro sul bordo nord-ovest), zero costo GPU.
- [x] Ombra: anche il personaggio fermo proietta su gronda/acqua coerentemente (già blob; aggiornare a gradiente Fase C).

## Fase E — Speciale Black Lodge (mezza sera) — `js/data.js` + `render3d.js`

- [x] Laura/BOB/Gigante/MFAP: **animazioni non-umane** — Laura con fade/slide "a scatti" (frame teleport ogni 90ms, stile Twin Peaks), il Nano che balla (ciclo 4 pose alternate), BOB con jitter orizzontale 1px + luminosità pulsante, il Gigante con slow-fade in/out.
- [x] Effetto "reverse speech": durante i dialoghi Lodge, i personaggi si muovono al contrario (frame camminata inversa) per 1-2 secondi all'ingresso.

## Ordine e stima

| Fase | Contenuto | Impatto | Sforzo |
|---|---|---|---|
| A | Redesign sprite 24×30, 4 frame, volti | ★★★★★ | 1-2 sere |
| B | Movimento player fluido + dust + camera lead | ★★★★ | 1 sera |
| C | NPC idle/wander + ombre morbide | ★★★★ | 1-2 sere |
| D | Polish rendering | ★★ | 1 sera |
| E | Animazioni Lodge | ★★★ | mezza sera |

Se si fa una sola cosa: **Fase A + B** — sprite nuovi e movimento fluido coprono l'80% della percezione.

## Vincoli e verifica

- `node test/smoke.js` + `node test/walkthrough.js` verdi a ogni fase; se si toccano i frame, lo smoke test che usa `frame` va aggiornato di conseguenza.
- A/B screenshot: il vecchio harness (`test/shot.html`) è stato rimosso — ricrearlo prima di Fase A (15 minuti, copiare dalla history git `fc01e93^`).
- Fallback 2D (engine senza WebGL) usa gli stessi sprite: le fasi A/B devono funzionare identiche lì (il 2D disegna via `drawChar`).
- Mobile: 4 frame = 2× texture cache rispetto a ora; `charTexCache` resta gestibile (~23 personaggi × 4 dir × 4-5 frame ≈ 400 texture 48×60, ok).
