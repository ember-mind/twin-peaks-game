# Double R — exact-grid booth lip

**Verdetto:** nessun miglioramento visibile ottenuto. Sei mockup nativi conservati; nessun pixel di produzione modificato. Questo riguarda soltanto il bordo frontale di questo booth, non dimostra che base o AI siano incapaci di migliorare.

## Tavole

Ordine colonne: **BASE | A | B | C | D | E | F**. Ogni pannello è un crop 64×48; il 4× usa solo nearest-neighbor.

![Tavola 1: base e sei varianti native](../artifacts/intent-room-double-r-grid/contact-sheet-native.png)

![Tavola 1: stesso confronto a 4×](../artifacts/intent-room-double-r-grid/contact-sheet-4x.png)

![Tavola 2: maschera bianca e diff magenta, 4×](../artifacts/intent-room-double-r-grid/contact-sheet-mask-diff-4x.png)

![Tavola 3: frame intero BASE, B, D; B/D sono MOCKUP, non render nuovi del gioco](../artifacts/intent-room-double-r-grid/MOCKUP-whole-room-before-B-D-native.png)

[Maschera sovrapposta al booth](../artifacts/intent-room-double-r-grid/occupied-mask-overlay-4x.png) · [manifest e verifiche A–F](../artifacts/intent-room-double-r-grid/manifest.json) · [diff esatto B/D nel frame](../artifacts/intent-room-double-r-grid/MOCKUP-whole-room-verification.json). I file `A.json`–`F.json` registrano **ogni** coordinata, colore prima/dopo e bounding box.

## Difetto e protezione

Nel booth occupato, il bordo in legno continuo sopra il labbro rosso può far leggere tavolo e seduta come una singola fascia frontale. È un difetto **lieve**: al nativo tavolo, ospite e schienale sono già leggibili. Maschera binaria: bianco solo x=13–50, y=28–30 nel crop 64×48 (114 pixel); nero altrove. Restano protetti ospite, mani, stoviglie, menu, schienale, pareti, pavimento e parete frontale sotto y=31. Lo scopo è attenuare quel bordo senza perdere sagoma, ritmo verticale, palette e integrazione ospite.

## Sei ipotesi, tutte dalla BASE

| Variante | Pixel cambiati | Gesto locale | Lettura a 1× |
|---|---:|---|---|
| A | 8 | Smorza un breve tratto centrale della riga legno superiore. | Invisibile. |
| B | 16 | Stessa attenuazione su due righe. | Debole nel crop; invisibile nel locale. |
| C | 8 | Interruzione tonale decentrata a sinistra. | Invisibile. |
| D | 8 | Interruzione tonale decentrata a destra. | Invisibile nel locale. |
| E | 6 | Piccola sovrapposizione legno/rosso a sinistra. | Dentino artificiale a 4×; peggiora. |
| F | 6 | Stessa sovrapposizione a destra. | Dentino artificiale a 4×; peggiora. |

B e D sono stati scelti **solo per prova di contesto**: B è il più leggibile nel crop, D testa l'asimmetria. Non sono vincitori. Il confronto 256×192 non mostra gerarchia, contatto o chiarezza migliori. A–D = **invisibile a scala di gioco**, E/F = **peggioramento**. Nessuna candidata merita rifinitura o integrazione. Nessuna review indipendente: il gate visivo è già netto; ripeterla sprecherebbe costo.

## Stato tecnico

Branch `codex/intent-room-double-r-grid`, nato dal checkpoint approvato `05de0a2` perché `main` non contiene ancora quel pass Double R. Checkout principale sporco non toccato. Base statica approvata: `js/retro-authored.js` invariato, come mappe, collisioni, porte, camera, Cast, narrativa, animazioni, Program, illuminazione e palette autoriale. I mockup modificano **solo** pixel finali catturati: non sono asset implementabili direttamente. Nessun codice renderer scritto, nessuna promessa di render reale dopo. Niente bancone/fondale, merge o push.

Verifiche raster eseguite dal generatore riproducibile: dimensioni 64×48, maschera binaria 114/3072 pixel, varianti indipendenti dalla BASE, massimo 16 pixel diversi, zero diff fuori maschera, colori nuovi solo dalla famiglia legno già presente in zona, PNG round-trip identico, 4× point-filter. Compositi B/D: esattamente 16/8 pixel diversi nel frame 256×192, tutti al booth atteso; resto del frame identico. Nessuna suite gameplay eseguita: production non è cambiata. I test baseline del pass precedente non sono spacciati per test freschi di questo pass.

Modelli: lead ha scelto difetto/maschera e giudicato 1×; Astra `gpt-6-astra` high **una** consultazione su PNG, senza image generation; Luna `gpt-5.6-luna` xhigh ha tracciato renderer/capture e creato raster/diff/compositi deterministici. Nessuna seconda Astra, nessun reviewer indipendente, nessun costo token inventato.
