---
type: project-note
created: 2026-07-20
---

# Piano: grafica moderna & world building

Obiettivo: portare il gioco da "demake DS onesto" a un look **moderno da indie diorama** (riferimenti: *Link's Awakening remake*, *Pokémon BDSP*, *Octopath HD-2D* per l'atmosfera), mantenendo i vincoli attuali: **zero asset esterni** (tutto procedurale), funziona da `file://`, mobile-friendly, test node verdi.

## Art direction (decidere prima di toccare codice)

- **Look target**: diorama chibi 3D — il mondo come un presepe fotografato con tilt-shift. Questo giustifica DOF, color grading, fog atmosferica: è la via più "moderna" compatibile col motore attuale.
- **Mood Twin Peaks**: il Pacific Northwest è umido, coperto, verde scuro. Oggi il prato è giallo-verde Pokémon allegro → palette più satura e fredda negli esterni, calda negli interni (contrasto sicuro/minaccioso = cuore della serie).
- **Regola d'oro già imparata**: guardare la geometria del riferimento PRIMA di disegnare (v. MEMORY 2026-07-19). Per ogni fase: screenshot di riferimento nella nota, poi implementazione.

## Fase 0 — Tooling di verifica (1 sera)

Senza feedback visivo rapido ogni fase degenera. Formalizzare ciò che è stato improvvisato il 2026-07-20:

- [ ] `test/shot.html` + `test/shot.sh`: harness headless permanente (Chrome `--headless=new --screenshot`, blit WebGL→canvas 2D overlay perché il layer GL non è composto negli screenshot). Parametri: map/x/y/dir/flags. N shot di regressione in `test/shots/` confrontati a occhio prima/dopo ogni fase.
- [ ] Checklist "scene di riferimento": town piazza, town lago, woods, redroom, diner, palmer.

## Fase 1 — Pipeline colore e luce (1-2 sere) — *impatto altissimo, rischio basso*

Tutto in `render3d.js`:

- [ ] `renderer.outputEncoding = THREE.sRGBEncoding` + `texture.encoding = sRGBEncoding` sulle CanvasTexture: colori corretti, fine del look slavato. **Attenzione**: i colori hex dei materiali Lambert cambiano resa → ritoccare palette edifici/luci dopo il cambio (è il grosso del lavoro della fase).
- [ ] Tone mapping `ACESFilmic` + exposure ~1.1.
- [ ] Palette esterni PNW: erba più scura/fredda (ritoccare i parametri `grass()` in `tiles.js` per '.'/'g'), cielo/nebbia grigio-verde invece di `0x101820`.
- [ ] Nebbia più vicina e densa nel bosco (fog 18→45) = mistero; leggera in town.
- [ ] Luce sole più radente e fredda; interni caldi con punto luce arancio (PointLight) su lampadari/camini.

Verifica: shot A/B delle 6 scene, smoke 261 ✔.

## Fase 2 — Dal billboard al volume (2-3 sere) — *il salto di qualità percepito*

Oggi alberi/cartelli/statue sono sprite piatti: è la cosa che tradisce di più il "non moderno".

- [ ] **Alberi 3D**: sempreverde = 3-4 coni sovrapposti (ConeGeometry, 2 toni di verde, neve zero) + tronco cilindro; sicomoro = sfera schiacciata icosaedro perturbato. Geometria condivisa + InstancedMesh per le foreste (perf). Varianti deterministiche da (x,y). Eliminare `treeTexture` billboard.
- [ ] **Props 3D**: cartello (2 pali + tavola con scritta su canvas), panchina, idrante, lampioni (con PointLight calda la sera? no ciclo giorno/notte → luce sempre accesa soffusa), staccionate come box sottili invece di tile piatti.
- [ ] Personaggi: restano billboard chibi (è il tratto B/W da tenere) ma: scala 1.15×, blob-shadow più morbida (gradiente radiale invece di disco piatto), **idle bob** anche da fermi.
- [ ] Edifici: gronda con fascia scura sotto (fake AO), pluviali agli angoli (box sottili), soglia porta in pietra, vasi/fioriere davanti alle case (box + sfera verde).

## Fase 3 — Atmosfera e post-processing (2 sere)

- [ ] **Pioggia leggera in town/woods** (è Twin Peaks: piove): ~300 streaks come LineSegments o sprite sottili in un volume attorno alla camera, ciclo infinito; pozzanghere = patch scure lucide sul terreno (decal canvas nel bake) con "rinfresco" onda. Audio fuori scope per ora.
- [ ] **DOF tilt-shift**: senza pipeline post di THREE (pesante): fake con due passate? Valutare `EffectComposer` da vendorizzare (r147 ha examples/js? No — r147 UMD non include composer; servirebbe porting manuale di UnrealBloom/BOKEH: medio-sbatti). Alternativa cheap: **vignettatura + gradiente sfuocato** come overlay CSS/canvas sui bordi alti/bassi (effetto diorama credibile a costo zero).
- [ ] Color grade leggero via overlay (multiply teal/arancio + lift neri) su canvas UI.
- [ ] Foglie/polline/pioggia di aghi nel bosco: particelle drift lento.
- [ ] Acqua: shader-ish fake — seconda mesh sopra con highlight animato + riflesso speculare del cielo (gradiente), riva con schiuma animata già presente: aumentare frequenza repaint a 100ms se la perf regge.

## Fase 4 — World building: riempire la mappa (2-4 sere, parallelo a Fase 2/3)

La town 56×36 ha troppo prato vuoto. Priorità agli **landmark della serie** (riconoscibilità immediata):

- [ ] **Le cascate** (Great Northern ci sta costruito sopra!): parete rocciosa estrusa a nord dell'hotel + acqua animata a cascata (mesh verticale con texture scrolling) + foam pool. Impatto scenico enorme, costo medio.
- [ ] **La segheria Packard** a est: edificio lungo con camino grande, cataste di tronchi (cilindri orizzontali impilati), nastro trasportatore.
- [ ] **Cimitero** (tomba di Laura, atto 4-5): recinto + lapidi (box piccoli) su prato a nord-ovest.
- [ ] **Ponte ferroviario / binari** verso est (già narrativamente il vagone dell'atto 3): rotaie come due strisce scure + traversine nel bake, cartello ferroviario.
- [ ] **Cartello stradale grande "Welcome to Twin Peaks — Population 51,201"** all'ingresso del paese: è IL momento iconico. Billboard 3D con tavola doppia.
- [ ] Densità: riempire i prati con cespugli (sfere verdi basse), ceppi, massi (icosaedri grigi), fiori già presenti → aumentare densità; sentieri secondari che collegano i landmark.
- [ ] Vita ambientale: corvi che attraversano lo schermo ogni tanto (sprite in volo alto), auto parcheggiate davanti al distretto/diner (box + cabina, 2 colori), fumo dai camini ✔ già fatto.
- [ ] NPC ambientali senza dialogo (passanti che camminano su percorsi fissi) — anche solo 2-3 in town cambiano tutto. Il sistema NPC esiste: serve un flag "wanders" con waypoints.

Metodo mappe: town/woods vanno rigenerate con `test/genmaps.js` esteso (nuovi landmark come vincoli), mai a mano (v. nota tecnica).

## Fase 5 — Dettagli UI/feel (1 sera)

- [ ] Camera: leggera rotazione/sway quando il player è fermo? No — meglio: **zoom-in lento durante i dialoghi** (lerp CAM_BACK 9.2→7.5) = cinematica.
- [ ] Transizioni porta: fade già presente → aggiungere "iris wipe" alla Pokémon? Opzionale.
- [ ] Titolo: logo con le montagne gemelle (due triangoli) + cascata animata dietro, invece di testo piatto.

## Ordine consigliato e stima

| Fase | Contenuto | Impatto | Sforzo |
|---|---|---|---|
| 0 | Screenshot harness | abilitante | 1 sera |
| 1 | sRGB + ACES + palette PNW | ★★★★ | 1-2 sere |
| 2 | Alberi/props 3D | ★★★★★ | 2-3 sere |
| 4 | Landmark (cascate, segheria, cartello) | ★★★★★ | 2-4 sere |
| 3 | Pioggia + vignetta/DOF fake | ★★★★ | 2 sere |
| 5 | UI/feel | ★★ | 1 sera |

Se si fa una sola cosa: **Fase 1 + alberi 3D** — quelle due da sole cambiano la percezione del gioco.

## Vincoli da non rompere

- `node test/smoke.js` (261) + `node test/walkthrough.js` (82) verdi a fine di OGNI fase.
- Niente asset esterni: tutto da canvas/geometry procedurali.
- `file://` compatibile: niente moduli ES, niente fetch.
- Mobile: instancing per foreste, particelle budgetate, ombre 2048 già ok; testare su telefono dopo Fase 2-3.
- Deploy: rsync → `~/Code/solo/projects/twin-peaks-game` → push → Coolify (manuale).
