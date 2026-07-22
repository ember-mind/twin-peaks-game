---
type: project
project: Twin Peaks Game
created: 2026-07-22
status: draft
---

# Produzione narrativa 2 — M5 "Il vagone" + M6 "One Eyed Jacks"

Fonti canoniche: Bible v0.9.1 + M4 v1.1.1 Script Lock. Due pacchetti candidati allo Script Lock. Nessuna implementazione.

==================================================
## 0. Manifesto delle dipendenze (confermate)
==================================================

- ✅ P2 = rotta investigativa accettata (`acceptance_type: investigatory_route`), non fatto confermato.
- ✅ M5 scopre il vagone; M4 non lo conosceva (geografia versione A).
- ✅ E6A = rapporto Laura–James; T_JAMES_EST = la rotta.
- ✅ Gerard/E5 e P4b possono essere presenti o assenti: M5 funziona in tutti e quattro gli stati.
- ✅ Player e Cooper ricordano il volto sconosciuto; il nome resta perduto (da entrambi).
- ✅ Verità autoriale: Leland/BOB causa la morte di Jacques; Cooper e player non possono provarlo; stati player-facing: `jacques_dead`, `jacques_testimony_lost`, `jacques_death_suspicious`; `jacques_murder_confirmed` MAI scritto.
- Conflitti trovati: NESSUNO — eccetto una nota: il gradino-obiettivo [P] "La strada a est: il vagone del treno" resta abolito come da M4 v1.1.1 (sostituito dalla rotta); segnalato per il futuro aggiornamento di data.js.

==================================================
## 1. Contratto canonico di M5
==================================================

- **Causa**: P2 accettata — la rotta di James. **Ingresso**: atto3; l'est si apre.
- **Obiettivo iniziale**: "Verifica la rotta di James: oltre il ponte, verso i binari." Cambia SOLO alla scoperta: "Il vagone. Leggi la scena prima che il tempo la legga per te."→ dopo: "Riferisci: la radio di Hawk."
- **Domanda narrativa**: che cosa c'è in fondo alla rotta — e la scena dirà com'è andata, o come qualcuno VOLEVA che sembrasse?
- **Durata**: ~12'. **Beat (9)**: B1 il ponte · B2 i binari · B3 la scoperta · B4 l'ingresso · B5-B7 le tre osservazioni (ordine libero) · B8 il confronto scelto + la teoria provvisoria · B9 il rapporto a Truman + S1 + nuovo obiettivo.
- **Obbligatorio**: B1-B4, due delle tre osservazioni, B8 (teoria), B9. **Facoltativo**: la terza osservazione, il confronto E7A↔E5 (solo se E5), Hawk oltre le sue tre battute.
- **Completamento**: teoria registrata (una delle due) + rapporto a Truman → obiettivo OEJ.
- **Uscita**: E7A, E7B, E8A, E8B, E_SCENE (acquisite per esame); P3A formulabile/formulata; teoria provvisoria registrata; S1 decisa; `east_route: confirmed_location`.
- **Conoscenze**: player/Cooper — la scena letta coi propri occhi; Truman — il rapporto radio; Hawk — il perimetro e ciò che ha visto arrivando.
- **Audience-state**: ingresso — la rotta da provare (fiducia guadagnata in M4); uscita — la rotta era vera MA la scena non chiude: qualcosa è stato disposto. Prima incrinatura: trovare non basta a capire.

==================================================
## 2. Evidenze atomiche di M5
==================================================

| ID | Fatto letterale | Come si acquisisce | Affidabilità | Supporta | NON supporta | Letture alternative | Descrizione al player |
|---|---|---|---|---|---|---|---|
| E7A | il testo scritto: "FUOCO CAMMINA CON ME" | esaminare il biglietto | alta (testo fisico) | ricorrenza della formula (con E5); P3B-ipotesi | identità di mano con la poesia ORALE (nessun campione) | scherzo macabro; rituale; firma | «Un biglietto. Lettere maiuscole, incise più che scritte: FUOCO CAMMINA CON ME.» |
| E7B | il biglietto era semi-sepolto nel mucchio di terra, piegato in quattro, asciutto | esaminare il mucchio | alta | P3A (la terra è smossa DOPO la pioggia: il biglietto è asciutto) | chi l'ha sepolto | nascosto in fretta; sepolto perché fosse TROVATO | «La terra è smossa. Il biglietto è asciutto — la pioggia di due notti fa non l'ha toccato.» |
| E8A | l'anello sta al centro di una traversa di legno, in piano | esaminare l'anello | alta | P3A | proprietà dell'anello | caduto e rimbalzato (contraddetto da E8B) | «Un anello. Al centro esatto della traversa, in piano.» |
| E8B | la polvere intorno è intatta; nessun solco, nessun segno di rotolamento | esaminare l'anello (seconda pagina) | alta | P3A | — | — | «La polvere intorno non è graffiata. Niente solchi. Le cose che cadono non si fermano così.» |
| E_SCENE | il vagone: sedile divelto in un angolo, MA il centro è sgombro; il mucchio di terra è accanto alla porta, non fuori | attraversare + esaminare | alta | P3A (disordine ai bordi, ordine al centro) | la dinamica esatta | lotta avvenuta ai bordi; centro ripulito; o mai toccato | «Ai bordi, il disordine di una violenza. Al centro, un ordine che non c'entra niente.» |

Regole rispettate: nessuna "stessa grafia" con la poesia orale; E5↔E7A condividono un TESTO, mai una mano; "posato deliberatamente" resta inferenza; i fatti sono posizione, polvere, asciuttezza, disposizione.

==================================================
## 3. Proposizioni di M5
==================================================

- **P3A — "Almeno alcuni elementi del vagone sono stati collocati deliberatamente."** Supporto minimo: E8A+E8B. Forte: +E7B (+E_SCENE). Contraddizioni: nessuna acquisibile qui. Stato iniziale: unformulated; nasce dal confronto `cmp_e8a_e8b` (o E8↔E7B). Permette: la teoria "disposizione" e la domanda giusta a Jacques. Rischio di sovrainferenza: attribuire CHI ha collocato — la proposizione non lo dice.
- **P3B — [IPOTESI] "Il vagone è stato usato come scena preparata, non solo come luogo di una violenza improvvisa."** Supporto attuale insufficiente (E_SCENE ambigua: il centro sgombro può essere pulizia posteriore). Resta ipotesi del taccuino; conferma rimandata a M6/M10. Il taccuino la marca: «Ipotesi. La scena può essere stata disposta prima — o riordinata dopo.»

==================================================
## 4. La falsa teoria
==================================================

**"Un incontro organizzato è degenerato."** (Jacques era presente; qualcuno aveva APPUNTAMENTO qui; la violenza è esplosa sul posto.)
- Due elementi reali a sostegno: E7B (un biglietto консegnato/nascosto = un messaggio fra persone che si davano appuntamento); la rotta di James (il posto ERA un luogo di incontri privati: P2 lo ha appena stabilito).
- Spiegazione coerente: luogo appartato noto a chi lo frequentava; un incontro; la degenerazione spiega il disordine ai bordi.
- Debolezza non risolutiva: non spiega l'ordine al centro né l'anello in posa (E8A/E8B) — ma il player può non averli ancora letti, o pesarli meno.
- Ordine d'ispezione che la modula: chi esamina PRIMA il mucchio (biglietto=appuntamento) la trova naturale; chi esamina prima l'anello arriva già insospettito.
- Confutazione parziale (M6): Jacques ammette la presenza e l'incontro — e proprio la sua versione non spiega gli oggetti in posa: la teoria era giusta sulla PRESENZA, sbagliata sull'improvvisazione. Nessun colpo di scena arbitrario.
- MAI dichiarato: che l'anello fosse di Jacques o un pegno (il repository non lo stabilisce).

**Registrazione della teoria (B8, scelta del taccuino)**: «Come leggi la scena?» · A. "Un incontro qui è degenerato." · B. "Qualcuno ha disposto la scena perché fosse letta." → entrambe registrate come TEORIA PROVVISORIA (flag `m5_theory: degeneration|staging`); nessuna delle due è "giusta" a sistema: A è la falsa pista ragionevole, B anticipa P3B come lettura. La differenza paga in M6 (le domande d'apertura cambiano colore) e nel playtest.

==================================================
## 5. Drammaturgia spaziale di M5 (9 beat)
==================================================

**B1 — Il ponte.** Posizione: est di town, fine delle case. Obiettivo: seguire la rotta. Azione: muoversi. Info visibile: le case che finiscono davvero dove James ha detto. Taccuino: —. Domanda: quanto è lontano "oltre"? Variante: nessuna.
**B2 — I binari.** Azione: seguire i binari (la mappa incanala senza forzare). Hawk raggiunge Cooper (Truman l'ha mandato [M4 repeat]). HAWK: «Da qui in poi le impronte sono mie e tue. Le altre sono più vecchie della pioggia.» (fatto osservato da lui, suo mestiere). Info: qualcuno è passato PRIMA della pioggia; nessuno dopo. Stato: nota.
**B3 — La scoperta.** Il vagone appare oltre la curva dei binari. (Nessun commento: la geografia parla.) → obiettivo: "Il vagone. Leggi la scena prima che il tempo la legga per te." Stato: `east_route: confirmed_location`. *(La rotta di James portava QUI: P2 factual_status → corroborated — non confirmed: che fosse il luogo DEGLI INCONTRI resta testimonianza.)*
**B4 — L'ingresso.** Azione: entrare. Info: E_SCENE a colpo d'occhio (disordine ai bordi, centro sgombro — descritto senza aggettivi di intenzione). HAWK: «Io tengo la porta. Quello che c'è dentro, è meglio che lo leggano occhi soli.» (perimetro: non entra).
**B5-B7 — Le tre osservazioni (ordine libero).** Il mucchio (E7B→E7A: prima la posizione, poi il testo); l'anello (E8A→E8B: prima la posizione, poi la superficie); la scena (E_SCENE, seconda lettura: il sedile divelto, il centro). Ogni esame: 2 pagine, fatti prima, zero intenzioni. Variante d'ordine: chi finisce con l'anello riceve la pagina «(Cooper resta un momento in più. Le cose che cadono non si fermano così.)» — chi ci inizia la riceve uguale ma la porta addosso per tutta la scena.
**B8 — Confronto + teoria.** Confronti disponibili: `cmp_e8a_e8b` (→ P3A formulabile: «Che cosa dice la polvere intatta sulla posizione dell'anello?» · A. Che l'anello non è caduto lì: qualcuno l'ha posato. ✔ → P3A · B. Che nessuno entra qui da anni. → «Le impronte di Hawk dicono altro: qualcuno è passato prima della pioggia.» · C. Che l'anello è di Laura. → «Niente qui dice di chi sia.») ; `cmp_e7a_e5` (SOLO se E5: → nota «La stessa formula, detta in un letto e incisa in un vagone. Ricorrenza — non ancora identità.» Se E5 assente: E7A resta formula autonoma; il confronto comparirà se mai il player acquisirà E5, anche dopo M5). Poi la TEORIA (§4).
**B9 — Il rapporto + S1.** Truman arriva («Non avete toccato niente. Bene: adesso tocca a me guardare.»). Cooper riferisce per teoria scelta (una pagina diversa di colore, stessi fatti). S1 (§7). Nuovo obiettivo: «Il biglietto parla la lingua di un posto solo, da queste parti. Oltre il fiume: One Eyed Jacks.» *(aggancio [P]: sign_oej/il confine — nessun indizio nuovo: è Truman che riconosce il registro del "gioco d'azzardo e fiammiferi" del posto — colore locale già stabilito dalla mappa.)*
Nessun NPC spiega la scena completa: Hawk dà UN fatto (impronte) e UNA obiezione (in B8-B, sopra); Truman riceve.

==================================================
## 6. Stato E5 presente/assente
==================================================

Presente: `cmp_e7a_e5` disponibile in B8 → nota di ricorrenza testuale (MAI identità BOB=fuoco; P4b resta dov'era). Assente: M5 completabile identica; nessun obiettivo rimanda a Gerard; il confronto resta latente e si sblocca retroattivamente all'acquisizione di E5 (nessuna penalizzazione irreversibile).

==================================================
## 7. S1 — Custodia dell'anello (scena completa)
==================================================

> TRUMAN: (guarda l'anello senza toccarlo) Questo va nella cassaforte delle prove. Stasera.
> COOPER: È l'unico oggetto della scena che qualcuno voleva farci trovare. Non so ancora che cosa sia — e vorrei poterlo guardare finché non lo so.
> **[SCELTA]** · *A. Cassaforte: custodia istituzionale.* · *B. Custodia investigativa personale, documentata.*

**A — Istituzionale.** Cooper fotografa, Truman registra e deposita. TRUMAN: «Quando saprai che cos'è, sarà dove deve essere.» Stato: `s1: institutional`. Conseguenza probatoria: catena pulita — in M9 la voce "anello" è citabile senza attriti. Relazionale: nessun attrito. Eco Loggia: la mano vuota del Nano («l'avete messo dove le cose si dimenticano con cura»).
**B — Personale documentata.** (Cooper fotografa l'anello sul posto, compila il modulo di trasferimento, lo firma, lo porge a Truman perché controfirmi.) TRUMAN: (firma, senza fretta) «Lo metto a verbale che non sono d'accordo. E che ti conosco abbastanza da firmare lo stesso.» Stato: `s1: documented_custody`. Probatoria: catena annotata "in custodia investigativa" — in M9 Truman può citarla con una riga di riserva. Relazionale: un'incrinatura ONESTA (non sfiducia: disaccordo firmato). Eco Loggia: l'anello sul tavolino («l'hai trattato come ciò che non era ancora finito»).
Riconvergenza: M6 e M9 avvengono comunque; cambia la forma delle citazioni e il gesto finale. Nessuna opzione è "quella corretta": il testo non premia — registra. Cooper NON nasconde nulla in nessun ramo.

==================================================
## 8. Script completo M5 (pagine)
==================================================

### B1-B2 — il ponte e i binari — 6 pagine
> (Le case finiscono dove aveva detto James. Dopo il ponte, solo la massicciata.)
> HAWK: (raggiungendolo) Truman mi manda a farti da ombra. Da qui in poi le impronte sono mie e tue.
> HAWK: Le altre sono più vecchie della pioggia. Due notti, forse tre.
> COOPER: Qualcuno è venuto prima dell'acqua. E nessuno dopo.
> HAWK: I binari non raccontano in che direzione. Il fango sì: verso est.
> → *nota: impronte precedenti alla pioggia, dirette a est. Nessun passaggio dopo.*

### B3-B4 — la scoperta e l'ingresso — 5 pagine
> (Oltre la curva, fermo dove i binari muoiono: un vagone merci. Solo.)
> → *obiettivo: Il vagone. Leggi la scena prima che il tempo la legga per te.*
> HAWK: Io tengo la porta. Quello che c'è dentro, è meglio che lo leggano occhi soli.
> (Dentro: ai bordi, il disordine di una violenza. Al centro, un ordine che non c'entra niente.)
> → *evidenza E_SCENE: disordine ai bordi — un sedile divelto, lamiera piegata. Il centro: sgombro.*

### B5 — il mucchio — 4 pagine
> (Un mucchio di terra, accanto alla porta. Dentro, non fuori.)
> → *evidenza E7B: terra smossa. Qualcosa affiora: un biglietto piegato in quattro. Asciutto — la pioggia non l'ha mai toccato.*
> (Cooper lo apre con la penna. Lettere maiuscole, incise più che scritte.)
> → *evidenza E7A: "FUOCO CAMMINA CON ME".*

### B6 — l'anello — 4 pagine
> (Su una traversa di legno, al centro esatto: un anello.)
> → *evidenza E8A: un anello, in piano, al centro della traversa.*
> (Cooper si abbassa. Non lo tocca.)
> → *evidenza E8B: la polvere intorno è intatta. Niente solchi, niente segni di rotolamento.*

### B7 — la scena, seconda lettura — 2 pagine
> (Il sedile divelto è nell'angolo. Da lì al centro, niente: né trascinamenti, né schegge.)
> → *osservazione: la violenza ha i suoi segni ai bordi. Il centro non ne ha nessuno.*

### B8 — confronti e teoria — (testi in §5/§4; 6 pagine equivalenti)

### B9 — il rapporto, S1, l'uscita — 9 pagine
> (Truman arriva col passo di chi non vuole arrivare.)
> TRUMAN: Non avete toccato niente. Bene: adesso tocca a me guardare.
> [se teoria A] COOPER: Qui c'era un appuntamento, Harry. Il biglietto passava di mano. Poi qualcosa si è rotto.
> [se teoria B] COOPER: Guarda il centro, Harry. La violenza è ai bordi. Il centro è di qualcuno che voleva farci leggere.
> TRUMAN: (in entrambi) La lettura la verbalizziamo come tua. I fatti come nostri.
> (S1 — vedi §7)
> TRUMAN: Il biglietto parla la lingua di un posto solo, da queste parti. Oltre il fiume: One Eyed Jacks.
> → *obiettivo: Oltre il fiume: One Eyed Jacks.*
**Repeat**: (Il vagone è sigillato col nastro della centrale. Hawk fa un cenno: niente di nuovo.)

==================================================
## 9. Contratto canonico di M6
==================================================

- **Causa**: il registro del biglietto/il confine (B9). **Obiettivo**: "Oltre il fiume: One Eyed Jacks." **Opposizione**: Jacques (menzogna opportunista), il luogo (fuori giurisdizione — linguaggio del progetto: «di là dal fiume comanda il fiume», mai diritto simulato).
- **Posta**: un testimone vivo; Audrey se `audrey_indaga` [P].
- **Durata**: ~12'. **Beat (8)**: B1 il fiume/l'ingresso · B2 la sala (il luogo funziona: tavoli veri) · B3 (se audrey_indaga) Audrey compatta · B4 la scelta della tattica · B5-B6 l'interrogatorio (2 domande esclusive + risposta) · B7 l'arresto · B8 il ritorno e la notizia.
- **Arresto fisso** (jacques_preso); **morte fissa offscreen** (lucy, [P]); variabili: tattica, cambio di tattica (una volta, con costo), ordine Audrey.
- **Uscita**: P5 formulata; risorsa di tattica costruita; poi (B8) distrutta; P9; obiettivo → "Riferisci a Truman."
- **Nuova domanda**: chi arriva ai testimoni prima di noi?

==================================================
## 10. Matrice delle tattiche (test di distinzione — PRIMA dei dialoghi)
==================================================

| | PROVA | PRESSIONE | FALSA SICUREZZA |
|---|---|---|---|
| Domande esclusive | «Questo biglietto passava di mano: la tua?» / «A che ora sei andato via?» | «Chi c'era con te? I nomi, adesso.» / «Chi paga il tuo silenzio?» | «Che tavolo era? Chi teneva il banco?» / «E il terzo, quello che non giocava?» |
| Tattica di Jacques | l'avvocato di se stesso: ammette il minimo verificabile | il panico rumoroso: inonda di nomi | il giocatore: si vanta, e nel vanto si contraddice |
| Info verificabile UNICA | l'orario: «col merci di mezzanotte me ne sono andato» (incrociabile coi binari) | nella lista di soprannomi UNO è ricorrente altrove ("quello dei fiammiferi") | il dettaglio del terzo: «non beveva. Guardava la stufa come si guarda una persona» |
| Info ambigua | "giocavamo e basta" (quanto minimo?) | quali nomi sono rumore? | quanto del vanto è vero? |
| Reazione Cooper/Hawk | Cooper annota; Hawk verifica l'orario del merci | Hawk: «Metà di questi nomi sono fumo. L'altra metà è paura.» | Cooper regge la parte; Hawk resta fuori (il tavolo è per due) |
| Costo persistente | Jacques si chiude su TUTTO il resto ("parlo col foglio davanti") | l'informazione è inquinata: la lista va scremata | se il player rompe il registro (cambia tattica), Jacques si chiude DEFINITIVAMENTE |
| Risorsa costruita | una dichiarazione formalizzabile che richiedeva un secondo colloquio (voleva garanzie) | la lista non ancora scremata — Jacques avrebbe distinto il vero | il canale aperto: sarebbe tornato a parlare "da giocatore a giocatore" — e solo lui poteva interpretare il suo stesso dettaglio |
| Cosa distrugge la morte | la firma mai apposta: la dichiarazione muore non formalizzata | chi distingue il vero dal fumo | il canale, e l'interprete del dettaglio |
| Forma del taccuino | «Dichiarazione resa, non firmata.» | «Quattro nomi. Uno vero. Quale, lo sapeva solo lui.» | «Il terzo uomo guardava la stufa. Che cosa volesse dire, lo sapeva solo chi l'ha visto.» |
Verifica di sinonimia: le tre colonne differiscono su TUTTI i criteri richiesti → nessuna fusione. **Regole**: la tattica si sceglie a B4 (prima di sedersi, con Hawk); si può cambiare UNA volta (costo: Jacques «Cambi faccia, agente? Allora anch'io» — perde la seconda domanda della nuova tattica); dopo due registri, o all'arresto, si chiude definitivamente. Impossibile esaurirle tutte.

==================================================
## 11. P5 e ciò che resta ignoto
==================================================

Fatti ammessi (ogni tattica, forme diverse): la presenza al vagone; il gioco/lo scambio. Negati: qualunque violenza («quando me ne sono andato, respirava»). Contraddizioni: l'orario contro il vanto (falsa sicurezza) o contro i nomi (pressione). Testimonianza incompleta: il terzo uomo — sempre evocato, mai nominato.
**P5 (formulabile in ogni percorso, dal confronto ammissione↔E_SCENE/P3A)**: «Jacques può essere collocato sulla scena. La sua presenza non basta ad attribuirgli l'omicidio.» — MAI "Jacques è innocente". Resta ignoto: chi era il terzo; chi ha disposto gli oggetti; cosa successe dopo il merci di mezzanotte.

==================================================
## 12-13. Morte di Jacques e P9
==================================================

**Comunicazione (sheriff, al ritorno — lucy [P], una pagina in più):**
> LUCY: (senza il suo tono) Agente. L'ospedale ha chiamato due volte. La seconda per dire di non correre.
> TRUMAN: Jacques Renault è morto stanotte. In custodia. Nella nostra custodia.
**Reazione di Cooper per tattica (callback specifico):**
> [PROVA] COOPER: Aveva una dichiarazione da firmare, Harry. La firma non arriverà.
> [PRESSIONE] COOPER: Mi ha lasciato quattro nomi. L'unico che poteva dirmi quale contava è appena uscito dalla lista.
> [FALSA SICUREZZA] COOPER: Sarebbe tornato a parlarmi. E io non saprò mai che cosa guardava il suo terzo uomo, quando guardava la stufa.
**Taccuino**: `jacques_dead`, `jacques_testimony_lost` (+ la risorsa specifica marcata PERSA), `jacques_death_suspicious` («nessun ingresso registrato nel turno di notte. Nessuno visto. La porta era chiusa.»).
**P9**: «La perdita di Jacques favorisce chiunque protegga il segreto, indipendentemente dalla causa precisa della morte.» — mai "eliminato da BOB".
**L'ospedale cambia**: la porta di Jacques sigillata; piantone raddoppiato davanti a Ronette (visibile al prossimo ingresso — la conseguenza vive nel luogo giusto, non a OEJ).
**Nuovo obiettivo**: "Riferisci a Truman. Poi la stanza 315." *(aggancio [P] al flusso specchio/gigante)*.
**Emozione progettata**: rimpianto SPECIFICO ("ho perso QUESTO"), mai "avrei dovuto scegliere meglio" — il testo non paragona mai le tattiche.

==================================================
## 14. Script completo M6 (pagine)
==================================================

### B1-B2 — il fiume e la sala — 6 pagine
> (Il traghetto non chiede documenti. È il suo mestiere, non chiederne.)
> (Dentro: tavoli veri, fumo vero. Nessuno alza lo sguardo — alzarlo costa.)
> (Un uomo grosso ride a un tavolo di carte. La risata è di chi perde e vuole farlo sapere poco.)
**B3 — Audrey (solo se `audrey_indaga`) — 4 pagine, compatta [P]**
> AUDREY: (a bassa voce, senza voltarsi) Non mi saluti. Sono la nuova del guardaroba, e lei non mi ha mai vista.
> COOPER: (senza voltarsi) La nuova del guardaroba esce da quella porta entro dieci minuti. Ci vedremo dal lato giusto del fiume.
> → *flag: audrey_vista_oej [letto dall'arco esistente]*
### B4 — la tattica — 3 pagine
> HAWK: (fuori) Di là dal fiume comanda il fiume. Dentro, comanda chi tiene il tono giusto.
> **[SCELTA — Come ti siedi davanti a Jacques?]** · *Prova* · *Pressione* · *Falsa sicurezza*
### B5-B6 — l'interrogatorio (per tattica; 8-10 pagine ciascuna, due domande + risposte come da matrice §10)
Estratto (FALSA SICUREZZA):
> COOPER: (siede, posa due fiches) Mi hanno detto che il banco qui perde volentieri, con chi sa stare al tavolo.
> JACQUES: (ride) Chi gliel'ha detto sapeva stare al tavolo?
> COOPER: Che tavolo era, quella notte? Chi teneva il banco?
> JACQUES: Io. Io tengo sempre il banco. Il francese dà le carte e la fortuna se la tiene.
> COOPER: E il terzo? Quello che non giocava.
> JACQUES: (la risata cala) Non beveva. Guardava la stufa come si guarda una persona. (pausa) Io i tipi così li lascio guardare.
Estratto (PROVA):
> COOPER: (posa la foto del biglietto) Questo passava di mano. La tua?
> JACQUES: (la guarda a lungo) Io porto le carte, non i messaggi. (pausa) C'ero. Giocavamo. È tutto quello che firmo.
> COOPER: A che ora sei andato via?
> JACQUES: Col merci di mezzanotte. Chiedete ai binari, se sanno l'ora.
### B7 — l'arresto — 4 pagine
> COOPER: Jacques Renault, dal lato giusto del fiume c'è una cella che ti aspetta.
> JACQUES: (si alza piano) Il fiume ha due lati, agente. Ricordatevelo quando lo riattraversate.
> → *flag: jacques_preso [P]*
### B8 — il ritorno e la notizia — (testi in §12-13; 8 pagine)

==================================================
## 15. Contratto dati
==================================================

Evidenze: E7A, E7B, E8A, E8B, E_SCENE (+ E5/P4b ereditate, opzionali). Osservazioni: impronte-pioggia, centro-sgombro. Ipotesi: P3B, teoria `m5_theory: degeneration|staging`. Proposizioni (multistato Bible): P3A `{formulation{created_from:[E8A,E8B]}, …}`; P5 `{created_from:[ammissione, P3A|E_SCENE]}`; P9 `{created_from:[jacques_dead, testimony_lost]}`. Tattica: `m6_tactic`, `m6_tactic_changed`, `m6_questions_asked[]`. S1: `s1: institutional|documented_custody`. Risorsa: `m6_resource_built`, `m6_resource_lost`. Stati Jacques: `jacques_present`(autoriale, non mostrato), `jacques_admitted_presence`, `jacques_testimony_lost`, `jacques_death_suspicious`; `jacques_murder_attributed` MAI scritto; `jacques_murder_confirmed` MAI scritto. Accessi: `east_route: confirmed_location`, porta OEJ [P].

==================================================
## 16. Regia sensoriale
==================================================

**M5**: suono dominante = il metallo che si assesta (processo continuo, mai sincronizzato ai beat); oggetto risemantizzato = il mucchio di terra (da terra a *fretta di qualcuno* — o *messa in scena*: la teoria decide la lettura, non il gioco); attività = il merci che passa una volta, senza fermarsi (il mondo continua). Niente musica che spieghi la teoria; il silenzio del vagone non è commentato.
**M6**: suono = le carte e i bicchieri (il luogo FUNZIONA: l'attività continua durante tutto l'interrogatorio); oggetto = il tavolo da gioco (da arredo a strumento della tattica: la falsa sicurezza lo usa, la pressione lo ignora, la prova ci posa la foto); cambiamento = la sala si svuota ATTORNO all'arresto (esclusione sociale attiva: nessuno guarda, tutti si spostano). La morte cambia l'OSPEDALE (porta sigillata, piantone), non OEJ.

==================================================
## 17. Scope (taratura M4)
==================================================

M5: 30 pagine dialogo + 8 azione; 9 voci taccuino; 5 label (2 confronto + 2 teoria + 1 S1... [dettaglio: cmp 3 opzioni, teoria 2, S1 2 = 7 label]); nodi: 8 nuovi; sottorami: confronto 3, teoria 2, S1 2, rapporto 2. M6: 38 pagine dialogo (di cui 26 nei tre rami tattici) + 4 azione; 8 voci; label: 3 tattiche + 4 domande; nodi: 9 nuovi; sottorami: 3×(2 domande) + cambio tattica + Audrey on/off + 3 callback. Casi di test: 21 (§18). E5 on/off: +2 pagine condizionali. **Totale ~80 pagine — sopra la proiezione lineare da M4 (2 missioni ≈ 118 attese, quindi SOTTO: −32%), dichiarato: M5 spende meno in dialogo perché la scena parla per disposizione.** Nessun taglio necessario; l'ordine di taglio resta quello del prompt (Hawk opzionale → Audrey cosmetica → terza tattica → teoria come scelta).

==================================================
## 18. Casi di test
==================================================

M5: 1-3 ogni ordine delle tre osservazioni → stesse evidenze, varianti di pagina corrette; 4 E5 presente → cmp disponibile; 5 E5 assente → completabile, cmp latente; 6 P4b assente → nessun riferimento pendente; 7 nessuna inferenza di grafia in nessun testo; 8 anello: fatti (E8A/E8B) acquisibili senza mai la parola "posato" prima del confronto; 9 teoria A e B entrambe registrabili, nessuna marcata giusta; 10 P3A non formulabile senza E8A+E8B; 11 S1 entrambe le opzioni + eco M9 coerente; 12 nessun softlock (2 osservazioni bastano).
M6: 13-15 ogni tattica → 2 domande esclusive + info unica + risorsa; 16 cambio tattica → costo applicato (la seconda domanda persa), chiusura definitiva dopo; 17 P5 formulabile in ogni percorso; 18 arresto sempre raggiungibile; 19 Audrey on/off; 20 callback post-morte coerente con la tattica giocata; 21 P9 non attribuisce; morte mai testo-punizione ("avresti dovuto" non esiste nel corpus).
**Comprensione (aperte prima)**: «Che cosa hai osservato nel vagone?» → «Che cosa ti ha fatto pensare che qualcosa fosse stato collocato?» → «Che cosa sapevi di Jacques prima di parlargli?» → «Che cosa ha ammesso?» → «Che cosa non hai mai provato?» → «Che cosa hai perso quando è morto?» **Test centrale**: il player spiega la presenza di Jacques senza concludere l'attribuzione E nomina la risorsa specifica perduta.

==================================================
## 19. Auto-edit (identificato → applicato nel testo sopra)
==================================================

1-5 *Deduzioni oltre il supporto (bozza)*: «la terra nasconde in fretta» → solo fatti (smossa/asciutto) ✎; «l'anello è stato posato» in E8B → spostato nel confronto come opzione A ✎; «la scena è pulita» → «il centro non ha segni» ✎; «il biglietto è un invito» → vive SOLO dentro la teoria A come lettura ✎; «Jacques mente» → «il vanto e l'orario non stanno insieme» (contraddizione, non verdetto) ✎.
6-10 *Righe espositive*: Hawk in bozza spiegava il centro sgombro («qualcuno ha ripulito») — VIOLAZIONE risolve-per-il-player: ridotto a impronte+obiezione ✎; Truman in B9 riassumeva le tre osservazioni → «I fatti come nostri.» ✎; Lucy in bozza dava dettagli clinici → due telefonate ✎; Audrey spiegava il suo piano → quattro righe ✎; il cartello OEJ descritto → tagliato ✎.
11-13 *Troppo poetiche*: «il vagone dorme dove muoiono i binari» → «fermo dove i binari muoiono» (una sola immagine) ✎; «la polvere ricorda» → «la polvere intorno è intatta» ✎; «il fiume non fa domande» → «Il traghetto non chiede documenti. È il suo mestiere, non chiederne.» (tenuta: è la voce del luogo, UNA volta).
14-15 *Hawk risolve*: (vedi 6) + in bozza indicava l'anello per primo → l'ordine è del player ✎.
16-17 *Jacques caricatura*: la risata continua in bozza → «la risata cala» al terzo uomo (paura vera) ✎; «francese maiale» stereotipo → tagliato ✎.
18-19 *Info non guadagnate*: in bozza la PROVA otteneva anche il dettaglio-stufa → riservato alla falsa sicurezza ✎; la PRESSIONE otteneva l'orario → riservato alla prova ✎.
20 *Callback invisibile*: il rimpianto in bozza era solo nel monologo → ora anche il taccuino marca `m6_resource_lost` con testo visibile ✎. *Falsa teoria troppo debole?* No: due appigli reali (E7B + P2). *Tattica sinonimica?* No: matrice §10 completa. *Pagina facoltativa tagliata*: la terza pagina della sala OEJ (colore in eccesso) ✎.

==================================================
## 20. Nota finale
==================================================

Versioni finali pulite: §8 (M5) e §14 (M6) sono le UNICHE sorgenti testuali; §4-5 e §10-13 sono razionali e matrici. Risposta alla domanda centrale: il player ricostruisce (fatti → confronto scelto → teoria SUA, anche sbagliata con dignità) e interroga (tattica scelta, domande esclusive, risorsa che costruisce e che la morte gli toglie PER NOME). La falsa pista non gli viene consegnata né tolta: la costruisce lui, e M6 gliela smonta solo a metà — la metà sbagliata.
