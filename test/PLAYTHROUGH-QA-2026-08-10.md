# QA playthrough — 2026-08-10

## Esito

Percorso narrativo completo raggiunto fino a `E.state.mode === "end"`.
Nessun blocco funzionale confermato nel runtime retro 2D.

La sessione ha usato:

- partita nuova su origine locale pulita;
- percorso titolo → prologo → arrivo → mondo di gioco;
- controllo browser desktop e viewport verticale 390×844;
- walkthrough data-driven delle mappe e dei gate;
- probe di salvataggio, persistenza, finale e UI narrativa.

## Copertura verificata

| Area | Risultato |
|---|---:|
| Cammino completo | PASS — 12 mappe, 86 acquisizioni, finale raggiunto |
| Runtime narrativo | PASS — 4.354 controlli |
| Finale produzione | PASS — confessione, Loggia, epilogo, reset |
| Salvataggio porta | PASS |
| Recupero salvataggio danneggiato | PASS — 23/23 |
| Persistenza fault | PASS — 28/28 |
| Voce/dialoghi classici e missioni | PASS — 77/77 rami, 240 pagine, 52 varianti narrative |
| Mobile production | PASS — 20/20 |
| Touch runtime | PASS — 13/13 |
| Mappa cittadina | PASS — 87/87 |
| Interazioni ambientali | PASS — 95 controlli, 971/971 tile affrontabili |
| Cast bitmap | PASS — 24 attori, 4 direzioni, camminata a 3 frame |
| Audit visivo retro | PASS — 22/22 catture |
| Coldstage | PASS — desktop 14/14, gameplay 9/9, mobile 14/14, visual 3/3 |

## Correzioni applicate e retest

Tutti i problemi del primo giro sono chiusi:

| Problema iniziale | Correzione | Prova finale |
|---|---|---|
| Matrice visiva legata a GLB 3D assente | Catture migrate al renderer retro 2D | 22/22 catture |
| Contratto personaggi legato a GLB 3D assente | Contratto riscritto sul cast bitmap reale | 24 attori, 4 direzioni, 3 frame |
| Lock M9 assente | Ripristinato documento canonico confessione | 3.779 controlli M9 |
| Harness dialogo attendeva `Render3D` | Harness collegato a `Retro2D`, ritratto e tipografia attuali | `TP-DIALOGUE-READY-600` desktop e mobile |
| Prologo diviso in 6 pagine | Un blocco narrativo per pagina, massimo 7 righe | 3/3 pagine, testo completo |
| Grande vuoto tra stage e controlli mobile | Controlli agganciati al bordo dello stage con safe area | viewport reale 390×844 verificato |
| Avanzamento dialogo ambiguo | Hint persistente ad alta risoluzione | `INVIO · AVANTI` / `A · AVANTI` |
| Obiettivi poco operativi | Luoghi e interlocutori nominati entro limite UI | limite 48 caratteri + percorso completo |
| Auto e baita iniziali senza ispezione | Riutilizzate osservazioni canoniche del Vault | 971/971 tile solide affrontabili |

La verifica browser successiva alle correzioni ha confermato:

- `TP-INTRO-MOBILE-PASS`;
- `TP-PROD-NARRATIVE-PASS` per M8, inclusa serializzazione;
- `TP-SAVE-RECOVERY-PASS` — 23/23;
- `TP-PROD-FINALE-PASS` — stato `complete`;
- dialogo desktop senza glifi residui o testo sul bordo;
- dialogo mobile 390×844 con ritratto, nome, due righe e hint leggibili;
- controlli mobile senza sovrapposizione, a 76 px dal bordo inferiore dello stage.

Coldstage ha riportato `pixelGate.status = pass`, diff entro tolleranza e
`aiReviewNeeded = false`; come richiesto dal workflow, non sono state aperte
le immagini Coldstage.

## Diagnosi iniziali chiuse

Le sezioni seguenti conservano causa e sintomo del primo giro. Non descrivono
più lo stato corrente.

### P1 — QA visiva non eseguibile con matrice attuale

`node test/visual-audit-capture.js --profile=gameplay` si interrompe con:

```text
authored architecture failed: fetch for
assets/models/twin-peaks-architecture-slice.glb responded with 404
```

Il build di produzione usa retro 2D e non carica `render3d.js`; quindi errore non blocca partita retro. Blocca però catture visive e harness che pretendono asset 3D.

**Risolto:** matrice e harness ora catturano il renderer retro 2D.

### P1 — Test personaggi legacy punta a GLB assente

`node test/character-runtime-contract.js` fallisce prima dei controlli:

```text
ENOENT assets/models/twin-peaks-character-pack-rigged.glb
```

È debito di test dopo passaggio al cast bitmap. Non è un difetto visibile del gioco retro.

**Risolto:** test convertito al contratto bitmap usato in produzione.

### P1 — Validator M9 incompleto

`node test/narrative-validate-m9.js` non parte perché cerca file assente:

```text
M9-M10 v1.1 (confession lock).md
```

Il finale production passa con il runtime JSON generato, ma questo validator non è una prova utilizzabile.

**Risolto:** lock documentale canonico ripristinato.

### P1 — Harness transizione dialogo obsoleto

`test/dialogue-transition-harness.html?at=600` termina con `TP-DIALOGUE-ERROR`: attende `GAME.Render3D`, non presente nel build retro.

**Risolto:** harness verifica canvas retro, ritratto, nome, testo e hint.

### P2 — Prologo frammentato e con molto spazio vuoto

Tre blocchi narrativi diventano 6 pagine. Pagine 2, 4 e 6 contengono solo continuazione di 2–3 righe, con grande area vuota e intestazione `FEBBRAIO, 1989` ripetuta.

Non tronca testo, ma può sembrare pagination rotta e rallenta ingresso al gioco.

**Risolto:** tre blocchi, tre pagine complete, massimo sette righe.

### P2 — Spazio morto su mobile verticale

A 390×844 il gioco resta leggibile e controlli touch funzionano, ma rimane una fascia nera molto ampia tra schermo di gioco e controlli. D-pad e pulsanti sono lontani dal contenuto.

**Risolto:** controlli seguono lo stage e mantengono safe-area e scala intera.

### P2 — Avanzamento dialogo desktop poco esplicito

Durante dialoghi desktop compare soprattutto freccia lampeggiante; non viene ripetuto `Invio/A per avanzare`. Titolo spiega `INVIO ESAMINA`, ma dopo l’apertura il controllo non è più visibile.

**Risolto:** micro-label ad alta risoluzione separata dalle due righe narrative.

### P2 — Obiettivi sintetici in alcuni passaggi

Copie corrette ma poco operative per chi non conosce Twin Peaks:

- `Ospedale, diner e hotel. Poi Truman.`
- `Casa Palmer. Poi il lago.`
- `Torna all’incrocio. Scegli dove andare.`

Gate runtime dimostrano che esiste sempre un root raggiungibile; resta rischio di wayfinding umano e ordine percepito ambiguo.

**Risolto:** obiettivi nominano azione, persone e destinazioni rispettando il limite UI.

## Problemi non confermati

- Nessun soft-lock narrativo rilevato.
- Nessuna perdita di indizi/flag dopo salvataggio o reload.
- Nessun overflow testo nei controlli finale (`no_gold_overflow = true`).
- Nessun problema touch su dialoghi, scelte, taccuino o finale.
- Nessun mismatch di cast, ritratto o sprite rilevato dai gate bitmap.

## Stato finale

Nessun problema aperto emerso dal percorso completo, dai probe produzione,
dalla suite nativa o dal quality gate visivo. Prossimo giro può concentrarsi
su playtest umano e ritmo, non su blocchi tecnici noti.
