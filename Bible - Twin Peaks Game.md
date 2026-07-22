---
type: project
project: Twin Peaks Game
created: 2026-07-22
status: draft
---

# Twin Peaks Game — World & Story Identity Bible (Canon Lock)

## PATCH v0.9.1 (obbligatorio, dal verdetto 25/30 — GO condizionato alla scrittura di M4)

Il patch PREVALE sul corpo (v0.9, conservato per archivio). Recepisce le correzioni bloccanti e le importanti:

1. **Provenienza ≠ approvazione**: due dimensioni separate — `source: C|P|A|N|I|?` + `status: locked|open|deprecated`. Notazione breve: `[N→L]` proposta approvata, `[A→L]` adattamento approvato, `[P][L]` fatto bloccato, `[I][OPEN]` interpretazione protetta MAI canonizzata. Riclassificazioni chiave: la frase del diario (regola seriale) = `[N→L]` sulla FUNZIONE, `[OPEN]` sulla formulazione esatta (va riscritta prima di M8: deve nascere dalla relazione Laura-Robert, non sembrare un tutorial, non fare di Laura l'autrice della soluzione, permettere ancora la messinscena); momento ordinario di Maddy = `[N→L]`; ritratto BOB = `[N→L]`; struttura Loggia = `[N→L]`; TUTTE le interpretazioni di Cooper = `[I][OPEN]`.
2. **Autosufficienza**: i rimandi "come da Grammatica §6" / "grammatica integrale della Direzione Artistica" / "T1→T4" diventano riferimenti VERSIONATI: `{reference_id, source_file, source_version: 2026-07-22-rev, locked_sections}` — un file modificato dopo non cambia in silenzio il significato della Bible. Per il lock v1.0: o i contenuti si copiano dentro, o i riferimenti restano immutabili.
3. **S2 TAGLIATA da M4 v1** (decisione chiusa): il sogno viene riferito in forma autoriale coerente con Cooper; la relazione Cooper-Truman cresce attraverso la qualità delle deduzioni. S2 esce anche dall'Agency Ledger v1 (righe marcate deprecated). Restano aperti SOLO: terzo metodo M10 (fino al suo pacchetto) e ampiezza epilogo (fino al suo).
4. **Evidenze ATOMICHE**: E6 → `E6A` (cuore_intero: prova la RELAZIONE) + `T_JAMES_EST` (testimonianza: prova la GEOGRAFIA). T2 → `T_LELAND_MISSOULA` (Leland afferma X) + `D_REGISTRO_MISSOULA` (il documento registra Y) + `C_MISSOULA_CONTRADICTION` (confronto SCELTO dal player: non coincidono). E8 → `E8A` (posizione fisica) + `E8B` (assenza segni di rotolamento/polvere) + `I8` (IPOTESI: collocato deliberatamente). Il sistema registra ciò che il player OSSERVA prima dell'inferenza che ne ricava.
5. **Modello dati proposizioni** (contratto per il programmatore): per ogni proposizione — `formulation{status: unformulated|formulated, created_from[]}`, `presentations[{target, mission, evidence_used[], result, reason_code}]`, `factual_status: unconfirmed|corroborated|confirmed|contested|refuted`, `social_status{accepted_by[], contested_by[]}`, `unlocks[]`. Accettata-da-Truman e confermata-dai-fatti sono INDIPENDENTI (può essere accettata e falsa; vera e respinta). Supporto formalizzato: `support_min{all_of[]}`, `support_strong{all_of[], any_of[]}` — mai formule testuali da interpretare.
6. **M4 corretta**: NOVE beat (definitivo); nodi nuovi ≥8 (ronette_q, ronette_luogo/uomo/laura, infermiera_ctx, cmp_t1_e5, cmp_e6a_tjames, present_truman_m4) + ritorni/fail-forward nel budget; **T1 "BOB" proviene SEMPRE da Ronette** (l'infermiera regola durata e dà contesto/routine, MAI il nome — se la visita si interrompe, si torna dopo Gerard e il nome arriva ancora da lei); la reazione fisica genera OSSERVAZIONE+ipotesi ("Alla parola 'vagone' guarda oltre Cooper, verso la porta. Forse teme qualcuno più del luogo."), mai certezza; **P4b facoltativa** (mai richiesta per completare); P2 unica proposizione obbligatoria. Struttura canonica: B1 Truman (senza S2) / B2 Ronette / B3 Gerard / B4 James / B5 Norma-LogLady opz. / B6 315 opz. / B7 confronto Ronette-Gerard opz. → P4b / B8 confronto E6A+T_JAMES_EST → P2 formulata / B9 presentazione P2.
7. **Anti-brute-force realistico**: risposte per `proposizione × reason_code` (INSUFFICIENT_SUPPORT, IRRELEVANT_EVIDENCE, CONTRADICTORY_EVIDENCE, PREMATURE_PROPOSITION, ALREADY_REJECTED, VALID_BUT_NOT_PROCEDURAL), non per ogni combinazione; la memoria conserva i set respinti e riusa la risposta della classe.
8. **Ritocchi di canone e stile**: (a) pitch: "la Stanza Rossa aspetta chi ha fatto l'aritmetica" → "la Stanza Rossa aspetta chi ha imparato dove il fascicolo smette di bastare"; (b) Laura: le azioni (nascondere il diario, spezzare il cuore) sono FATTI; la finalità ("custodia deliberata per un futuro investigatore") NON è canone — le tracce permettono la ricostruzione, il gioco non stabilisce che le abbia predisposte; (c) Maddy: il momento ordinario non si definisce in opposizione a Laura — mostra "Maddy vuole vivere altrove" (controlla gli orari della corriera, parla di un posto dove vuole andare, corregge chi la chiama Laura), non "Maddy non è Laura"; (d) **verità interna sulla morte di Jacques [A→L, criterio fedeltà-serie]**: Leland/BOB la causa davvero; il player non può provarlo (jacques_murder_confirmed resta non assegnato a sistema; lo SCRITTORE lo sa per costruire tracce, tempi, menzogne); (e) style guide: "non più di UN fatto portante nuovo per pagina; una pagina può contenere zero fatti quando fa lavoro emotivo/relazionale/ritmico"; l'esempio sulla grafia sostituito con: «l'ipotesi peggiore è l'unica che spiega perché lo stesso nome continui a tornare. Non la scrivo ancora.»; (f) template scena/dialogo esteso con: source_status, player/character_knowledge_in, speaker_goal/tactic, subtext, information_given/withheld, audience_state in/out, later_echo, canali (primario/secondario/accessibilità), budget parole, failure/retry, semantic_test; il template missione aggiunge stato-mondo in/out, fail-forward, condizioni esatte, contenuti per configurazione, provenance+status.

**Percorso autorizzato**: M4 completa → revisione severa → test semantico → lock dello stile operativo → M5-6 → M8 → M9-10 → Loggia+epilogo. Integrazione nel repo SOLO dopo approvazione dei pacchetti.

---

UNA fonte di verità. Input: repository reale, "Direzione Artistica — Interrogatorio Leland" (25/30), "Architettura Causale" (24/30), "Grammatica dell'Indagine" (25/30), tutte le correzioni d'esame. I conflitti fra documenti sono decisi QUI, con motivazione, mai in silenzio.

Marcatura: **[C]** canone serie adottato · **[P]** fatto già nel progetto · **[A]** adattamento approvato · **[L]** decisione bloccata in questa Bible · **[N]** proposta non ancora approvata · **[I]** interpretazione · **[?]** incerto. Una decisione [L] non può essere contraddetta più avanti.

==================================================
## 0. Gerarchia delle fonti
==================================================

Autorità, in ordine: (1) decisioni esplicite dell'autore umano; (2) fatti del repository; (3) canone della serie adottato; (4) adattamenti già approvati; (5) nuove proposte; (6) interpretazioni.

**Fonti**: repo (`js/data.js`, `js/glue.js`, `js/maps.js`, `js/engine.js`, `test/walkthrough.js`); i tre documenti di design con le loro revisioni vincolanti; i quattro verbali d'esame; le decisioni umane registrate (2026-07-22: sogno = fedeltà alla serie; scope = raccomandato).

**Conflitti risolti** (registrati):
1. *Matrice della conoscenza vs decisione sogno* — la matrice dava a Cooper "non può sapere" il volto. DECISO [L]: player e Cooper vedono e RICORDANO entrambi il volto dello sconosciuto; solo il nome sussurrato è perduto (per entrambi). Motivo: elimina un'asimmetria non necessaria; Cooper può interrogare sul "uomo visto"; l'unica asimmetria che resta è zero — lo split storico del Role Contract si riduce al nome, ed è condiviso.
2. *P8 lettere* — Architettura Causale la trattava come deduzione; l'esame l'ha bocciata. DECISO [L]: esiste una riga del diario che stabilisce la regola seriale (vedi §4, E1). R+O+ordine+diario = TEORIA di firma, mai verità pre-M10.
3. *"Colpa condivisa" M8* (Architettura) vs "impotenza" (esame). DECISO [L]: impotenza; leve solo sulla distribuzione dei costi.
4. *Fallback clues6* (Architettura lo teneva) vs Grammatica. DECISO [L]: eliminato; fail-forward a precisione crescente.
5. *Segnali di BOB* — Direzione Artistica ne aveva 4; ridotti a 2 dagli esami. DECISO [L]: 2, con ponte volto→ospite realizzato (vedi §13).
6. *Conteggio mappe* — "10" era errore: sono **11** [P] (town, sheriff, palmer, hotel_gn, hospital, diner, woods, redroom, traincar, oej, roadhouse).

**Questioni ancora aperte** (→ §20): S2, terzo metodo M10, epilogo esteso, momento ordinario di Maddy (posizione), budget finale di scrittura.

==================================================
## 1. Correzioni obbligatorie — recepimento
==================================================

Tutte le 16 correzioni del verbale precedente sono recepite come [L] e integrate nelle sezioni indicate: sogno coerente (§0.1, §7), P2 (§4), P3 (§4), P4 (§4), P5 (§4), P7 (§4), P8 (§0.2, §4), P9 (§4), stati multipli di proposizione (§5), equità Ronette (§6-M4, §18), leve M8 che cambiano azioni di Maddy + taglio variante Sarah (§6-M8), M9 colloquio non mandato (§6-M9), ponte volto→ospite max 2 segnali (§13), Loggia con ≥2 azioni (§13), schede senza onniscienza (§8), scope del sistema proposizioni come funzionalità maggiore + domande aperte prima delle orientate (§16-17).

==================================================
## 2. Identità del gioco [L]
==================================================

- **Titolo di lavoro**: Twin Peaks Game. **Formato**: browser, THREE.js r147, file://-safe, griglia + dialoghi a pagine [P]. **Durata**: 90-110 min primo playthrough, 70-85 replay. **Pubblico**: chi conosce la serie (fan game dichiarato) e chi ama l'investigativo narrativo; testo in italiano [P].
- **Canone coperto**: l'arco Laura Palmer fino alla morte di Leland + Loggia [P]; contenuti esclusi [L]: tutto il post-arco (25 anni dopo giocati), FWWM, sottotrame della serie senza funzione qui (Josie, la segheria come intrigo, Windom Earle).
- **Punto di vista / ruolo**: Cooper come *authored protagonist* [P — Role Contract]: fissi motivazione, voce (Diane), valori (metodo+intuizione+empatia), 5 atti e finale; espressivi: ordine, opzionale, ritmo, riletture, **metodo d'interrogatorio, gestione delle prove, 4 stance** [L].
- **Verbi** [L]: muoversi, esaminare, consultare il taccuino, confrontare, formulare, presentare, interrogare (con tattica), registrare, scegliere stance, interpretare. (Definizioni operative in §5.)
- **Tema**: il male abita il quotidiano; conoscere non equivale a proteggere. **Conflitto di valori**: giustizia contro pietà (giocato in S3). **Domanda drammatica**: chi ha ucciso Laura Palmer — e la categoria "chi" basta?
- **Promessa emotiva**: vedrai la verità ottenuta con gentilezza, e scoprirai che non basta a salvare nessuno.
- **Promessa giocabile (una frase)**: «Farai davvero il lavoro dell'investigatore — leggere, confrontare, sostenere una conclusione davanti a chi vorrebbe sbagliarsi, scegliere metodo e costo — e la verità avrà la forma delle tue mani.»
- **Linearità**: gated-lineare onesta [P]: macro fissa, libertà locale reale (ordine, stance, metodo), nessun finale alternativo.
- **Logline**: Un agente federale gentile indaga sull'omicidio di una ragazza in un paese che si conosce per nome — e scopre che il metodo può chiudere il caso ma non contenere ciò che trova.
- **Pitch (100 parole)**: Twin Peaks Game è un mini-RPG investigativo in stile Pokémon B/W: griglia, sprite chibi, un paese gentile fino all'ultimo pixel. Sei l'agente Cooper: raccogli indizi veri, confrontali nel taccuino, sostieni le tue conclusioni davanti allo sceriffo Truman, interroga con il metodo che scegli. Il sogno ti mostra il volto di uno sconosciuto che non abita il paese; le lettere sotto le unghie compongono una firma che il diario di Laura conosce. Quando il caso si chiude — perché si chiude — resta aperto ciò che nessun verbale contiene. E la Stanza Rossa aspetta chi ha fatto l'aritmetica, per parlargli nel registro delle sue stesse scelte.
- **"Questo gioco non è…"**: un sandbox, un whodunit a finali multipli, un horror a jumpscare, un quiz di indizi, una riproduzione scena-per-scena della serie.

==================================================
## 3. Canon lock della trama (spina degli atti)
==================================================

| Atto | Ingresso | Causa | Domanda | Obiettivo | Strategia | Missioni | Rivelazione | Successo incompleto | Conseguenza | Luogo che cambia | Relazione che cambia | Domanda d'uscita | Transizione |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | arrivo [P] | l'omicidio | chi era Laura? | ricostruire la vittima | ascolto | M1, M2, M3 | il diario doppio; il SOGNO (volto sconosciuto + nome perduto) [L] | il nome svanisce | sogno_fatto; hotel/ospedale aperti | la camera di Laura (prova→reliquia) | Truman: da ospite a partner | cosa dice il corpo? | **causale** (il sogno È la pista) |
| 2 | sogno_fatto | il sogno da decifrare | chi è "BOB"? | dare corpo al nome | prove+testimoni | M4 | i frammenti non chiudono; P2 presentata | nessun volto DEL PAESE corrisponde | atto3 (per presentazione, non contatore) [L] | l'ospedale (chi custodisce, perde) | James: il lutto si sporca di prova | dov'è successo? | **causale per scelta** (la presentazione del player) |
| 3 | atto3 | la deduzione dell'est | cosa accadde quella notte? | la scena primaria | ricostruzione+pressione | M5, M6, M7 | la scena PREPARATA; Jacques presente-non-autore (P5) | Jacques muore in custodia | P9; gli enigmi | il vagone (sigillato) | Truman: il paese può perdere chi custodisce | perché il Gigante avverte me? | **causale per opposizione** (la perdita del teste) + apparizione Gigante per causa stabilita [L: trauma+specchio+fallimento del solo metodo materiale] |
| 4 | atto4 | il 2° enigma | "di nuovo" — a chi? | proteggere la prossima | presagio | M8 | il lago; la O; la teoria della firma (P8) | la protezione arriva dopo | maddy_trovata | il lago (landmark→ferita) | Sarah: da "confusa" a testimone precoce | quanto vicino a casa Palmer? | **causale per mondo** (l'opposizione agisce per suo conto) |
| 5 | atto5 | la contraddizione presentata (M9) | può il metodo contenere ciò che trova? | la verità a verbale | confronto (metodo a scelta) | M9, M10 | R7: responsabilità fratturata; volto→ospite | confessione senza salvezza | leland_morto | la stazione (T3/T4) | Truman: la penna posata; S3 decide il resto | cosa resta aperto? | **causale** |
| Loggia | leland_morto | ciò che il verbale non contiene | — | attraversare | interpretare | Finale | l'aritmetica salda; l'ambiguità resta | — | fine | la Stanza Rossa (a due direzioni) | tutte, spese | — | **deliberatamente misteriosa** [L: unica ammessa] |

Nessuna transizione "perché nella serie succede": ognuna è classificata sopra.

==================================================
## 4. Bibbia dell'indagine
==================================================

### Evidenze (indizi + testimonianze + presagi)
Formato: fatto letterale / provenienza / affidabilità / chi la conosce / azione che la acquisisce / supporta / NON supporta / letture alternative / uso procedurale / intuitivo / payoff.

**E1 diario [P+L]**: due registri (pubblico sereno, cifrato spaventato) + [L] DUE righe canoniche: (a) nomina il bosco come luogo temuto (motiva la transenna — R1); (b) **la regola seriale**: "Dice che lascerà il suo nome un pezzo alla volta." + il nome "ROBERT" nel registro cifrato / Truman / alta / Cooper+Truman / leggere dopo il paese / P1, ponte per P8 / l'identità dell'ospite / "dramma adolescenziale" / sì / il "lui" senza volto / la firma seriale in M8-dopo.
**E2 cuore (metà) [P]**: metà pendaglio spezzato / camera / alta / Cooper / esaminare / P1, relazione-con-qualcuno / GEOGRAFIA (correzione [L]: un oggetto identifica una relazione, mai un luogo) / rottura d'amicizia / sì / — / si ricompone con E6.
**E3 lettera_r [P]**: R sotto l'unghia / scena (fascicolo) / alta / Cooper+Truman / fascicolo in M2 / P8-min / P5 (nessun campione di grafia di Jacques ESISTE nel fascicolo: la lettera NON conta contro di lui — correzione [L]) / iniziale di un nome / sì / sì / la serie con E9.
**E4 nome_sussurrato [P+L]**: un nome pronunciato e perduto DA ENTRAMBI / sogno / nulla proceduralmente / player+Cooper (esistenza) / M3 / P4 (esiste UN nome) / — / — / no / sì / voce di menu: "un nome dimenticato al risveglio".
**E5 poesia_fuoco [P]**: formula "FUOCO CAMMINA CON ME" RECITATA da Gerard (nessun campione grafico — correzione [L]) / ospedale / media (testimone alterato) / Cooper / dialogo / P3-corroborazione tematica / P2 (non è geografia), identità BOB=fuoco (serve ponte) / delirio / debole / sì / il biglietto la ripete.
**E6 cuore_intero + testimonianza-James [P]**: l'altra metà + "ci vedevamo nei posti oltre la strada est" / diner post-sogno / alta / Cooper / dialogo (gate sociale [P]) / P2 (oggetto=relazione, TESTIMONIANZA=luogo [L]) / — / — / sì / — / apre l'est.
**E7 biglietto_fuoco [P]**: biglietto scritto, semi-sepolto, che RIPETE la formula di Gerard / vagone / alta / Cooper / esaminare / P3 (ripetizione TESTUALE, non grafia [L]) / — / — / sì / — / il rituale è scritto, non solo detto.
**E8 anello [P]**: anello CENTRATO su una superficie, niente segni di rotolamento, polvere interrotta intorno [L: i segnali osservabili sono nel testo descrittivo] / vagone / alta come oggetto / Cooper(+Truman per S1) / esaminare / P3 (posato⇒scena disposta) / P5-innocenza (NON la prova) / pegno di Jacques (falsa lettura OFFERTA) / sì / il suo significato non esaurito (S1) / la Loggia.
**E9 lettera_o [P]**: O, coerente con la R / lago / alta (catena migliore se il player arriva primo — leva M8) / Cooper+Truman / M8 / P8 (con E1b) / — / — / sì / — / la teoria della firma.
**T1 ronette_bob [P]**: il grido "BOB" quando si parla dell'uomo / ospedale / media / Cooper / la domanda scelta (M4) / P4-min / il LEGAME BOB-fuoco (senza ponte) [L] / trauma non indirizzato / debole / sì / il verbale di M10 lo cita [L].
**T2 bugia-Missoula [P]**: dichiarazione di Leland smentita dal registro / M8-dopo / alta (contraddizione documentale) / Cooper+Truman / confronto nel taccuino / P6 / — / "il lutto confonde" (obiezione VIVA di Truman) / **sì: l'unica base procedurale** / — / la convocazione.
**T3 sarah_visione [P]**: "l'uomo sconosciuto in casa" — lo STESSO volto del sogno [L] / casa Palmer / nulla proceduralmente / Cooper / dialogo Atto 4 / P7-ipotesi / P7-procedurale [L] / incubo / NO [L] / sì / la casa entra nel sospetto.
**Presagi (taccuino, sezione dedicata [L])**: i 3 enunciati del Gigante — 1° GIÀ verificabile all'apparizione (stabilisce la regola del canale [L: niente causalità circolare]), 2° suspense ("sta accadendo di nuovo"), 3° pagato nella Loggia. Mai prove.

### Le proposizioni (10) — con stati multipli (§5)
| # | Formulazione [L] | Supporto minimo | Forte | Contraddizioni | Come si FORMULA | Dove si presenta | Chi accetta | Confermata quando | Cosa permette |
|---|---|---|---|---|---|---|---|---|---|
| P1 | Laura conduceva una vita doppia | E1 | +E2 | — | lettura del diario | (contesto, non presentabile) | — | dalla confessione | dare senso a bosco/James |
| P2 | Laura incontrava James o altri in luoghi a est | E2+E6 (oggetto=relazione, testimonianza=luogo) | +riferimento del diario | — | confronto E2↔E6 | M4 a Truman | Truman | dal vagone | atto3 |
| P3 | Il vagone è la scena, ed era DISPOSTA | E7 (+segnali osservabili di E8) | E7+E8+mucchio | teoria dell'impeto | confronto E7↔E5 + esame E8 | M5 (radio/ritorno) | Truman | mai del tutto (resta "disposta da chi?") | incalzare Jacques su presenza |
| P4 | L'aggressore è associato al nome "BOB" | T1 | +E4(esistenza)+E5 | "delirio" | confronto T1↔E5 → genera P4b, NON accettazione [L] | M4 (come ipotesi) | Truman (annota, non accetta) | M10 | la domanda giusta a Jacques |
| P4b | [ipotesi] il nome e la formula del fuoco riguardano lo stesso uomo | confronto volontario T1↔E5 | ponte reale (biglietto+confessione) | — | SOLO da confronto scelto | — | — | M10 | orienta |
| P5 | La presenza di Jacques non basta ad attribuirgli l'atto [L: mai "è innocente"] | ammissione (M6) | +elementi disposti PRIMA del suo arrivo+incongruenze orarie+il "terzo uomo" | la sua fuga | dalle tattiche M6 | (interna al fascicolo) | Truman (a fatica) | dalla confessione | non chiudere su Jacques |
| P6 | Leland ha mentito su Missoula | T2 | +comportamento | "il lutto confonde" | confronto dichiarazione↔registro | M9 | Truman | dalla confessione | la convocazione |
| P7 | [ipotesi] la ripetizione è legata alla famiglia Palmer | E9+T3 | +leland_dopo | "il dolore spiega" | confronto E9↔T3 | M9 (SOLO come orientamento [L]) | nessuno formalmente | M10 | orienta le domande |
| P8 | Le lettere seguono una firma seriale che il diario associa a "Robert" [L] | E3+E9+ordine temporale+E1b (regola seriale) | +legame Robert/BOB (diminutivo, acquisito a parte nel diario) | messinscena (resta ignoto se firma dell'assassino, di BOB, o regia) | confronto lettere↔pagina del diario | M9 (investigativa) | Truman (come teoria) | M10 la complica, non la chiude | saldare P4 a P7 |
| P9 | La perdita di Jacques favorisce chi protegge il segreto, qualunque sia la causa della morte [L] | jacques_dead+testimony_lost | +death_suspicious (accessi non registrati) | — | subita, poi formulata | (interna) | — | MAI (murder_confirmed resta non assegnato [L]) | la minaccia è locale e attiva |
| P10/R7 | La responsabilità è fratturata, non cancellata | la FORMA della confessione | +la serie delle visioni verificate | "Leland simula" | vissuta in M10 | — | — | mai quantificata [L] | la Loggia come necessità |

Regola aurea [L]: **nessuna conclusione riceve dal supporto più di quanto il supporto contenga.**

### False piste (con meccanismo e uscita)
1. *La R come iniziale di un nome nuovo* — offerta dal menu finché E9+E1b non la ribaltano (uscita: il confronto col diario).
2. *La teoria dell'impeto di Jacques* — presentabile in M5; smontata dai segnali dell'anello e dalle tattiche M6.
3. *Jacques colpevole* — per il paese E per il player (versione A del sogno: nessun volto lo esclude); uscita: P5 + la sua morte.

### Rivelazioni maggiori (7)
R1 vita doppia (M2) → R2 Laura sapeva e temeva (M2-3) → R3 esiste un canale non ordinario (M3, con regola stabilita in M7) → R4 il crimine è locale, rituale, DISPOSTO (M5) → R5 il testimone eliminato/perso: l'opposizione agisce nel mondo (M6-dopo) → R6 la firma punta alla casa (M8-9: P8+P6, inferenza DEL PLAYER) → **R7 responsabilità fratturata (M10)** — ognuna cambia l'obiettivo corrente, non solo la posta.

==================================================
## 5. Grammatica investigativa definitiva
==================================================

Catena semantica [L]: **domanda → ipotesi → proposizione formulata → presentata → accettata da un personaggio → confermata dai fatti** (e in parallelo: contestata / smentita). L'accettazione è sociale, la conferma è fattuale, l'interpretazione resta di chi la fa. **La UI non elenca mai una proposizione appena gli indizi bastano** [L]: la formulazione nasce SOLO da un confronto volontario del player (o, per le più semplici, da una domanda aperta che il taccuino pone e il player risolve confrontando).

| Verbo | Input | Target | Precondizione | Feedback | Stato | Fallimento | Retry | Costo | Missioni | Accessibilità |
|---|---|---|---|---|---|---|---|---|---|---|
| esaminare | Z | oggetto | prossimità | pagine + sparkle spento | done_*, evidenza | — | 'again' | — | M2,M5 | testo = canale completo |
| confrontare | dal taccuino: due voci | evidenze/testimonianze | averle | nota di confronto nel merito ("non coincidono su…" / "nessun legame visibile") | nota; può generare ipotesi/proposizione formulabile | accostamento muto | sempre | — | M4,M8-dopo,M9 | lista navigabile da tastiera |
| formulare | conferma su nota emergente | proposizione | confronto riuscito | la proposizione entra nel taccuino come "formulata" | prop:formulata | — | — | — | M4,M9 | — |
| presentare | in dialogo: conclusione → prove (1-3) | proposizione | formulata | risposta SPECIFICA sul nesso; se respinta: domanda investigativa nel taccuino | prop:presentata/accettata/contestata | nesso insufficiente | sì, con escalation di precisione [L]; coppie respinte → risposta di memoria | tempo scena | M4,M9 | mai limiti di tempo |
| interrogare | Z + scelta tattica/domanda | NPC | contesto | ramo DIVERSO per tattica | flag tattica | info parziale, MAI filo centrale perso [L] | vedi equità (M4/M6) | relazionale | M4,M6,M10 | — |
| scegliere metodo | widget (2-3 opzioni) | M10 | ingresso scena | il ramo intero | metodo | — | no | dichiarato | M10 | — |
| registrare | widget on/off, UNA volta | il nastro | beat 10 M10 | spia+click | S3 | — | no (dichiarato irreversibile) | vedi §13 | M10 | — |
| interpretare | scelta S4 + risposta a BOB | il congedo | Loggia | l'ultima riga / la reazione | S4, stance-BOB | — | no | — | Finale | — |

==================================================
## 6. Mission Bible (schede canoniche)
==================================================

Formato compresso; azioni minuto-per-minuto nei beat già bloccati dai documenti revisionati (citati). Tipo: INV=investigazione, REL=relazione, TRAG=tragedia fissa, FALSA=falsa soluzione, ASC=ascolto, CLIMAX, AFTER=aftermath.

- **M1 "Il paese dei ciliegi"** (Atto 1, ~10', INV/ASC) [P]: causa: arrivo; obiettivo: "Parla con lo sceriffo Truman (a ovest)"; verbo: muoversi/parlare; luogo: town; svolta: il diario; stato: diario; nuova domanda: la camera; opzionale: landmark/cimitero [P]; comprensione: il paese come metro. Scope: esistente.
- **M2 "La camera di Laura"** (Atto 1, ~10', INV) [P]: causa: il diario; opposizione: il lutto dei Palmer; verbi: esaminare; svolta: E2+E3; R1-R2; stato: cuore, lettera_r; il diario (E1a) motiva il bosco [L]; comprensione: P1.
- **M3 "Il sogno"** (Atto 1→2, ~5', ASC) [P+L]: la Stanza Rossa; il volto sconosciuto ai margini (sprite bob [P], una pagina aggiunta); il nome perduto DA ENTRAMBI; one-way [P]; stato: sogno_fatto, E4; comprensione: l'ironia è "quest'uomo non abita il paese".
- **M4 "I frammenti"** (Atto 2, ~15', INV/REL): 8 beat bloccati (Grammatica §6 + correzioni): S2 al racconto; la domanda a Ronette con EQUITÀ [L: ogni domanda apre un filo che porta agli altri — luogo→"teme qualcuno che entra"→domanda sull'uomo; uomo→"BOB"; Laura→la seconda presenza; + l'infermiera come via laterale: "ripete un nome quando un uomo entra alle sue spalle"]; Gerard col cuscino (momento umano); James (oggetto=relazione, testimonianza=luogo); confronto T1↔E5 → P4b ipotesi; presentazione P2 a Truman con fail-forward. Comprensione: presentare ≠ collezionare.
- **M5 "Il vagone"** (Atto 3, ~10', INV): 3 osservazioni con segnali OSSERVABILI (E7 semi-sepolto; la formula ripetuta; E8 centrato/senza rotolamento/polvere interrotta); il confronto E7↔E5; la teoria dell'impeto PRESENTABILE (falsa pista onesta); S1 custodia dell'anello (istituzionale vs personale documentata, costo con Truman); stato: P3. Comprensione: scena disposta ≠ scena subita.
- **M6 "One Eyed Jacks"** (Atto 3, ~10', FALSA): tre tattiche (prova/pressione/falsa sicurezza — Grammatica §7) con risposte, rischi e monconi diversi; arresto; la morte in custodia (offscreen, per il REGISTRO dell'opposizione: Jacques è l'unico che può collocare il terzo uomo — eliminarlo/perderlo serve al piano, non al copione [L]); P9 con stati distinti; la tattica giocata determina QUALE risorsa muore. Comprensione: collocare ≠ attribuire.
- **M7 "Gli enigmi"** (Atto 3→4, ~7', ASC): il Gigante appare per causa stabilita [L]; 3 enunciati (verificabile/suspense/Loggia); annotazione nei presagi. Comprensione: il canale orienta, la regola è pubblica.
- **M8 "Sta accadendo di nuovo"** (Atto 4, ~12', TRAG): morte fissa; leve [L]: (1) chi avvertire — e OGNI avvertimento cambia un'azione di Maddy (avvertita: prova a partire, TORNA per Sarah, lascia la valigia pronta — visibile al lago; Sarah avvertita: il vice c'è quando arriva la notizia; nessuno: nessuna presenza); (2) dove correre dopo gigante2 (geografia REALE della mappa, distanze asimmetriche [L] — la scelta costa in tempo diverso e determina chi trova Maddy e la catena della E9); (3) la promessa (pagina in maddy_a4 con scelta); variante Sarah-trova-il-corpo TAGLIATA [L]. Prima di M8: il **momento ordinario di Maddy** [L]: al diner ordina la torta che Laura odiava, ridendo ("almeno su questo non eravamo parenti") — una scelta di gusto propria, nessuna funzione di trama. Comprensione: "dove concentro attenzione incompleta", mai "potevo salvarla".
- **M9 "La convocazione"** (Atto 4→5, ~5', INV/REL): P6 presentata (T2); obiezione di Truman; P7 SOLO orientamento; esito: **colloquio volontario come persona informata** [L]; l'arresto avviene solo DOPO la confessione (chiarito [L]). Comprensione: sospetto ≠ procedura.
- **M10 "L'interrogatorio"** (Atto 5, ~12', CLIMAX): 12 beat bloccati (§13).
- **M11 arco Audrey** (Atti 2-3, facoltativo, REL) [P]: due contatti, esito letto da Truman [P]; compatta, non si espande [L].
- **Finale "La Loggia" + epilogo** (~10', AFTER): §13.

==================================================
## 7. Architettura della suspense
==================================================

| Domanda | Nasce | Credenza iniziale | Teoria ragionevole | Falsi indizi | Trattenuta | Complicazione | Risposta | Nuova domanda | Azione resa possibile |
|---|---|---|---|---|---|---|---|---|---|
| Q1 chi ha ucciso Laura? | titolo [C] | "un estraneo" | Jacques (Atto 3) | R-iniziale; l'impeto | l'identità dell'ospite | Jacques muore da non-autore | M10 (completa) | Q4 | tutto il grafo |
| Q2 chi è l'uomo del sogno — e come può non esistere nel paese? [L] | M3 | "lo troverò tra gli NPC" | nessuna: il paese non lo contiene | — | il legame col paese | T3: è stato DENTRO una casa | M10: volto→ospite (completa) | Q4 | il confronto dei volti (interno al player) |
| Q3 gli avvertimenti vanno creduti? | M7 | scetticismo | "il 1° era vero" | — | il 3° enunciato | il 2° si avvera nel modo peggiore | parziale | cosa paga il 3°? | i presagi come orientamento |
| Q4 cosa è BOB? | T1 | "un uomo" | un nome per il trauma | — | tutto | la confessione | **MAI data [L: ambiguità protetta]** | come si convive? | S3/S4 |
| Q5 il paese sopravvive alla verità? | T4 stazione | "tornerà normale" | — | — | — | l'epilogo la rigira | parziale (al player) | — | la rilettura dell'epilogo |
Registri: curiosità (vagone), suspense (enigma 2), sorpresa (morte di Jacques), ironia (Q2 — condivisa da player e Cooper [L]), ambiguità protetta (Q4, ripartizione R7, enigma 3).

==================================================
## 8. Character Bible
==================================================

Formato: funzione / desiderio / paura / convinzione / agenda / info(±) / errore / tattica / voce / spazi / offscreen / arco / stato finale / rischio di riduzione / da NON scrivere. Ogni riga distingue fatto vs [I].

- **Cooper**: protagonista autorizzato / chiudere proteggendo / che l'intuizione sia vera / "conoscere=proteggere" (cade) / il doppio metodo / sa il sogno, il nome no / fallisce la protezione (Jacques, Maddy) / gentilezza metodica / voce: understatement + lampi surreali, monologhi a Diane / frontale, 1 tile di distanza / — / da investigatore a custode / esce dalla Loggia con la SUA versione / rischio: santo infallibile / non scrivere: cinismo, battute sopra le righe.
- **Truman**: la legge locale, AGENTE / che il paese resti suo / arrestare un amico / "qui ci conosciamo tutti" / proteggere le persone prima del caso / sa il paese; il soprannaturale solo se S2 / vuole sbagliarsi su Leland / obiezioni concrete / voce: piana, poche parole, mai gergo federale / la stazione; il gancio della giacca / manda i vice, riceve la contea / la penna posata; S3-spento lo mette davanti alla scelta di testimoniare / sceriffo che non appende più la giacca / rischio: spalla muta / non scrivere: comic relief.
- **Laura (presenza postuma)**: il centro morale / [I, ricostruzione dichiarata [L]] "essere due persone e sopravvivere a entrambe" — ipotesi di lettura, mai testo canonico della sua interiorità / — / — / DUE atti pre-gioco (fatti): nascose il diario vero, spezzò il cuore — custodia deliberata: il caso è risolvibile perché LEI ha agito / versioni per persona: figlia (Sarah), santa (necrologio), ragazza (James), quella che aveva paura (diario) / — / — / — / camera, diner (la tazza non riassegnata), vagone / — / — / l'ultima immagine del gioco è sua [L] / rischio: angelo/strumento / non scrivere [L]: le pagine cifrate NON si decifrano mai del tutto; il gioco non parla per lei; mai usarla per perdonare Leland.
- **Leland/BOB**: il notabile e l'ospite / [fatti] gli atti, la bugia; [?] memoria; [I] tutte le ripartizioni / — / il decoro come guscio / — / sa; nega; forse non ricorda / il troppo ordine / avvocato→padre→voce / voce Leland: formale, affettuosa a scatti; voce BOB [L]: presente storico, sintassi corta, Leland in terza persona / casa e stazione / la timeline dell'opposizione (§ sotto) / la frattura / morto in cella; nella Loggia: presente, né dannato né assolto / rischio: mostro O vittima (i due errori simmetrici) / non scrivere: spiegazioni di BOB, assoluzioni, il momento dell'omicidio in scena.
- **BOB (forza)**: obiettivo necessario: continuare a esistere/nutrirsi senza essere fermato; ponte causale per M10 [L]: la convocazione chiude quella forma di esistenza → la confessione come contaminazione/provocazione [I di Cooper, marcata nel testo]; agisce per accesso/opportunità (Jacques: unico che può collocare il terzo uomo; Maddy: la ripetizione), MAI per copione; limiti: non onnisciente, non ubiquo / da non scrivere: il suo punto di vista.
- **Sarah**: testimone precoce non creduta / essere creduta / la propria casa / — / percepisce PRIMA (T3) / ha visto il volto; NON conosce fatti e ripartizioni [L] / — / — / voce: frasi che si fermano prima del nome / casa / la telefonata alla centrale (M8, in ogni ramo) / — / nell'epilogo non chiede "chi è stato" — aveva SOSPETTATO la casa [L: mai "sapeva"] / rischio: madre-urlo / non scrivere: scene di dolore come spettacolo.
- **Maddy**: arco breve CON agency / andarsene (fatto: la corriera) / — / — / resta un giorno per Sarah (SUA scelta, offscreen, detta) / — / — / — / il momento ordinario [L: la torta] / casa, diner / decide di restare / la promessa (leva M8) / morta al lago / rischio: "Laura di nuovo"/dispositivo / non scrivere: la sua morte in scena.
- **Ronette**: catena testimoniale con dignità di soggetto / sopravvivere al ricordo / l'uomo che entra alle spalle / — / — / sa il volto/il nome / — / — / il grido: **atto comunicativo significativo, senza certificarne la piena coscienza [L]** / ospedale / — / il verbale di M10 la cita / sveglia nell'epilogo, UNA riga, nessuna intervista / rischio: corpo-indizio / non scrivere: interviste alla sua guarigione.
- **Audrey**: la sottotrama / contare per il padre / l'invisibilità / "posso da sola" / indaga in proprio / OEJ / il rischio corso / charme + ostinazione / hotel→OEJ / va a OEJ comunque / salvata (se il player ha aperto il filo) / a casa, letta da Truman [P] / rischio: fanservice / non scrivere: romance con Cooper.
- **James/Donna**: arco di lutto / un lutto pulito / il segreto sporchi la memoria / "proteggiamo Laura" / trattengono E6 / — / — / — / diner / — / la reazione al sospetto su Leland (M9, una pagina) / — / rischio: distributori / non scrivere: triangoli.
- **Jacques**: la falsa soluzione / farla franca / la giurisdizione / "sono solo un contrabbandiere" / nega, patteggia, si vanta (per tattica) / sa il terzo uomo (mezzo) / — / tre registri (M6) / OEJ / — / arrestato; morto in custodia / rischio: cattivo di comodo / non scrivere: la sua morte in scena.
- **Log Lady**: filo di mistero / essere creduta prima che serva / — / — / dice le stesse cose comunque / — / — / enigmi / diner / — / la scala dei gufi [P] / — / non scrivere: spiegazioni del ceppo.
- **Gerard**: testimone alterato / — / — / — / la formula (E5) / — / — / trance / ospedale / — / — / — / non scrivere: lore dell'ospite di Gerard (fuori scope).
- **Nano/Gigante**: il canale / — / — / — / regola pubblica [L]: 1° enunciato verificabile all'apparizione / — / — / il Nano parla nel registro del metodo del player (§13) / Stanza Rossa / — / — / — / non scrivere: spiegazioni.

==================================================
## 9. Rete delle relazioni
==================================================

| Coppia | Stato iniziale | Tensione extra-caso | Fiducia/debito | Info asimmetrica | Svolta | Stato finale | Scelte che la modificano |
|---|---|---|---|---|---|---|---|
| Cooper–Truman | ospite/ospitante | metodo federale vs protezione locale | cresce per prove presentate | il sogno (S2) | la penna posata | segnata da S3 | S2, S3, S1-personale |
| Cooper–Leland | investigatore/notabile in lutto | l'empatia estesa al carnefice | — | il volto (fino a M10) | l'affioramento | la pietà senza assoluzione | metodo M10 |
| Cooper–Sarah | agente/testimone non creduta | il credito dell'inascoltata | debito di Cooper (non l'ha creduta abbastanza presto [I]) | T3 | il lago | lei non chiede | leva M8-1 |
| Cooper–Audrey | agente/alleata non richiesta | contare vs proteggere | — | audrey_indaga | OEJ | letta da Truman | aprire o no il filo |
| Truman–Leland | vent'anni di amicizia | l'arresto dell'amico | — | — | la convocazione | la branda rifatta | S3 (chi testimonia) |
| Sarah–Maddy | zia/nipote-àncora | Maddy vuole partire | il giorno in più (dono di Maddy) | — | la scelta di restare | il lutto doppio | leva M8-1 |
| James–Donna | il lutto conteso | chi ha diritto al segreto | il cuore | E6 | la consegna | il lutto sporco di prova | ordine M4 |
| Laura–le sue versioni | (postuma) | ogni persona ne ha una diversa | — | il diario vero | il caso le mette in fila | nessuna versione vince [L] | — |

==================================================
## 10. World Bible funzionale
==================================================

| Sistema | Chi lo controlla | Chi ne dipende | Come appare/suona | Missione che tocca | Cambia durante la trama |
|---|---|---|---|---|---|
| Legge | contea via Truman | tutto il paese | la stazione-soggiorno; il campanello da negozio | M1,M9,M10 | T1→T4 (Direzione Artistica) |
| Diner/commercio | Norma | il rito quotidiano; le ciambelle alla centrale (economia reale) | percolatore, tazze col nome | M4, momento-Maddy | i dialoghi si accorciano |
| Ospedale | contea | i fragili del caso | monitor, giri di flebo A ORARIO | M4, M6-dopo | il piantone raddoppiato |
| Segheria/lavoro | (sfondo [P]) | il legno di TUTTO il civico (stessa materia case/istituzioni) | pino, riparazioni casalinghe | texture ovunque | — |
| Trasporti | la corriera; i binari | Maddy (partire); il vagone (relitto) | il merci che passa e non si ferma | M5, M8 | il vagone sigillato |
| Contrabbando | Jacques (oltre fiume) | OEJ | l'esclusione sociale attiva | M6 | decapitato |
| Informazione | il centralino; la bacheca | il paese intero | squilli, carte con puntine | M1,M9,T2-T4 | il volantino scoperto; il funerale protocollato |
| Paese/bosco | — | il confine dentro/fuori | la transenna; Glastonbury | M3, Finale | la transenna non serve più |
| Decoro | tutti | Leland (guscio); l'esclusione informale | i saluti per nome | M9 (il notabile non può rifiutare) | l'epilogo lo rigira |
Nessun sistema è lore inerte: ognuno tocca almeno una missione, un personaggio, un luogo.

==================================================
## 11. Location & Sensory Bible
==================================================

Regole ereditate dalla Direzione Artistica COME GERARCHIE [L]: deviazioni rare/leggibili/gerarchizzate (non "una sola"); guida diegetica di base MA accessibilità sopra la purezza; UN movimento che domina (gli altri = fondo); camera stabile (solo la Loggia la altera); tinta alla mappa, dramma alla luminanza; max 2 motivi simbolici dominanti per luogo; sincronie solo come performance umane [L: Lucy sente→si ferma→guarda→riprende o no] o processi onesti (percolatore continuo reale).

Per mappa (funzione/routine/identità/oggetto risemantizzato/suono dominante/cambio attività per atto — 1+1+1 [L]):
**town**: connettivo civico; routine: strade, piazza, bacheca; risemantizzato: il lago; suono: il paese diurno; per atto: vetrina→corsa notturna (M8)→alba dell'epilogo. **sheriff**: "La casa della legge" (grammatica integrale della Direzione Artistica revisionata); radiatore; T1→T4. **palmer**: il decoro come teatro; la camera di Laura (prova→reliquia); il silenzio del salotto; lutto composto→sfaldamento→vuoto. **hotel_gn**: commercio che ospita il caso; lo specchio della 315; il brusio della hall; la 315 da stanza a soglia. **hospital**: riparare i vivi; la porta di Jacques (vuota→sigillata); il monitor; il piantone. **diner**: il sociale non istituzionale; la tazza non riassegnata; il percolatore; i tavoli di James/Log Lady. **woods**: il confine; la transenna; il vento alto; da chiusa ad aperta a irrilevante. **redroom**: il fuori-griglia (TUTTA infrazione, unica [L]); le tende; il silenzio a pattern; a due direzioni nel finale. **traincar**: l'unico luogo senza routine [L: il suo significato]; il mucchio di terra; il metallo che si assesta; da scena a luogo sigillato. **oej**: l'esclusione oltre il fiume; il tavolo da carte; la musica ovattata; decapitato dopo M6. **roadhouse**: il palco del paese; il microfono; la banda che suona comunque; l'annuncio nel luogo dello svago.

==================================================
## 12. Agency & Consequence Ledger
==================================================

Tassonomia dichiarata per scelta: *local response / persistence / global influence / expressive / interpretive*.

| Scelta | Intenzione | Azione | Risposta | Stato | Eco | Conseg. informativa | Relazionale | Spaziale | Riconvergenza | Significato conservato | Classe |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 anello | come trattare una prova non esaurita | custodia istituzionale vs personale DOCUMENTATA | Truman usa/contesta | S1 | M9 (catena), Loggia beat-anello | catena di custodia | attrito o fiducia | l'anello nella Loggia o no | la Loggia si attraversa comunque | chi ha pagato cosa | persistence+interpretive |
| S2 sogno | fiducia | tutto vs solo fatti | Truman cambia registro | S2 | quale Truman entra in M10 | la difesa "il federale sogna" | profonda o formale | — | M10 avviene comunque | il peso della penna posata | persistence (SE regge in scrittura; altrimenti tagliata [→§20]) |
| S3 nastro | giustizia/pietà | on/off al beat 10 | il verbale o la memoria di Truman | S3 | epilogo (la contea), Loggia beat-BOB | cosa esiste agli atti | Cooper–Truman | — | morte e Loggia comunque | cosa chiami vittoria | global-lite+interpretive |
| S4 enigma 3 | interpretare | promessa/minaccia/appuntamento | l'ultima riga a Diane | S4 | — | — | — | — | — | l'uscita che possiedi | interpretive |
| M8 leve | attenzione incompleta | avvertire/correre/promettere | le azioni di Maddy cambiano [L] | leve | il lago, M9, epilogo | catena E9 | Sarah, il vice | chi è dove | la morte resta | la distribuzione dei costi | local+persistence |
| M6 tattica | come pressare | prova/pressione/falsa sicurezza | tre Jacques | tattica | QUALE risorsa muore | il mezzo-nome o il teste | — | — | l'arresto comunque | il tuo rimpianto specifico | local+persistence |
| M10 metodo | come si parla a un padre sospettato | probatorio/personale(/intuitivo) | tre scene | metodo | il registro del Nano | la forma del verbale | Truman | — | confessione comunque | la versione della verità | expressive+persistence |
Nessuna scelta è "significativa perché scrive un flag": ogni riga ha risposta+eco+significato conservato, o si taglia.

==================================================
## 13. M10 e Finale — LOCK
==================================================

**M10 (12 beat, bloccati)**: 1-3 ingresso/soglia/nastro con IPOTESI dichiarata di Cooper; 4 scelta del metodo con Truman; 5-6 domande del metodo (2 esclusive per metodo); 7-9 affioramento + fatti materiali a nastro (elenco: vagone, accesso, lettere, atti); 10 **S3**; 11 la cella (la domanda del perdono senza risposta; il beat dopo è di Laura); 12 morte, radiatore, "Diane" col rituale visibile, chiusura-interpretazione: «So ciò che ha fatto. Non so più dire dove finisse la sua volontà. Una cosa non cancella l'altra.»
**Metodi** [L]: il Probatorio è bloccato; Personale e Intuitivo sopravvivono SOLO se ciascuno dimostra: 2 domande esclusive, 1 dettaglio verificabile proprio, tattica di Leland distinta, reazione di Truman distinta, costo persistente, forma del verbale diversa — altrimenti si fondono in "Personale" (decisione rimandata alla scrittura, criterio bloccato).
**Ponte volto→ospite** [L]: **ritratto di dialogo** — per la durata dell'affioramento il riquadro-nome/ritratto della battuta mostra il volto dello sconosciuto (asset: il ritratto già derivabile dallo sprite bob [P]), mentre il corpo in stanza resta Leland. Segnali totali: ritratto + registro linguistico. (Il bob accelerato retrocede a dettaglio non conteggiato oppure sostituisce il ritratto SE la pipeline ritratti non regge — in quel caso il collegamento è dichiarato interpretativo con la riga di Cooper: "L'uomo del sogno sta parlando attraverso di lui.")
**Fatti PRIMA di S3** [L]: elenco verificabile completo a nastro; S3 governa solo il materiale metafisico/intimo. Conseguenze acceso: il delirio agli atti (la contea, epilogo); spento: Truman sceglie se testimoniare (pagina propria).
**R7**: vissuta qui; mai quantificata a sistema.
**Loggia (8 beat, con DUE azioni [L])**: 1 Glastonbury; 2 la soglia; 3 il corridoio; **4 l'ORDINE degli incontri** (il player sceglie chi raggiungere: Nano/BOB/Laura — ciascuno può citare solo ciò che è già avvenuto: 6 ordinamenti, testo modulare); 5 il Nano nel registro del metodo; **5b il gesto dell'anello** (se presente: deporlo/mostrarlo/tenerlo — gesto interpretativo, mai puzzle); **6 la risposta a BOB** (parlare/silenzio/ripetere una riga del verbale — determina la reazione e il registro dell'uscita); 7 Laura: "Ti rivedrò fra venticinque anni" [C] — l'ultima immagine è sua [L]; S4; 8 il ritorno: town all'alba, epilogo (dialoghi accorciati, il lago, la stazione T4, Ronette sveglia UNA riga, Sarah che non chiede). Niente quiz; nessun verbo nuovo; ciò che resta ambiguo: Q4, la ripartizione, l'enigma 3.

==================================================
## 14. Content Style Guide
==================================================

- **Prosa/dialogo**: pagine brevi (≤2 frasi per pagina di dialogo [P: formato motore]); una informazione nuova per pagina; il sottotesto prima della dichiarazione (bobby/donna già riscritti così [P]).
- **Voci**: Cooper = understatement, seconda persona a Diane, mai gergo hard-boiled; Truman = concreto, poche subordinate; Leland = formale con scatti d'affetto; BOB = presente storico, sintassi corta, Leland in terza persona, MAI spiegazioni; Sarah = frasi che si fermano prima del nome; Log Lady = enigmi con UN sostantivo concreto.
- **Diane**: apre o chiude le missioni, mai durante un'azione; una osservazione + una incertezza; MAI riassunti di ciò che il player ha appena visto.
- **Descrizioni ambientali**: segnali osservabili, mai intenzioni ("l'anello è centrato sulla trave, la polvere intorno è intatta" — MAI "l'anello fu posato con cura").
- **Silenzio**: guadagnato da cause del mondo; l'unico "a cappella" è il radiatore post-mortem.
- **Umorismo**: solo diegetico e gentile (Lucy, Andy), mai nel raggio di una vittima.
- **Accessibilità**: nessuna pagina non skippabile; tempo minimo breve; caption a parità di fatti [P].
- **Vietati** [L]: "come sai…", esposizione reciproca, personaggi che spiegano la propria personalità, aforisma in ogni riga, imitazione del dialogo TV, poesia continua, soprannaturale che assolve, Laura usata per perdonare, "non tutto ciò che ha fatto era suo" e ogni equivalente certificativo.
- **Esempi** (debole → corretto): «LELAND: Il dolore mi ha reso un altro uomo, agente.» → «LELAND: Sarah rifà il letto due volte, adesso. Dice che la prima non conta.» · «COOPER: Ho capito tutto: BOB usa Leland!» → «COOPER: Diane, l'ipotesi peggiore è anche l'unica che spiega la grafia. Non la scrivo ancora.» · «(La stanza è inquietante)» → «(La lampada lascia i muri leggibili e scuri. La spia del registratore è l'unico rosso della stanza.)»

==================================================
## 15. Production Templates
==================================================

**MISSIONE**: `id / titolo / atto / tipo / durata / causa / obiettivo-mostrato / opposizione / beat[] / stati-scritti / conseguenze / scope / test-comprensione`.
**SCENA/BEAT**: `id / luogo / obiettivo-minuto / azione-player / risposta / info(+trattenuta) / canale dominante / stato / domanda-dopo`.
**NODO DIALOGO** [formato motore P]: `id / pages[{name,text}] / cond / give / setFlag / again` + NUOVO `choice[{label, goto, setFlag}]` (widget) e `present{proposizioni-accettate, risposte-per-nesso, memoria-respinti}`.
**SCELTA**: `id / intenzione / opzioni / risposta-locale / stato / eco[] / classe-agency / test`.
**INDIZIO/EVIDENZA**: `id / fatto-letterale / provenienza / affidabilità / chi-sa / supporta[] / non-supporta[] / payoff`.
**PROPOSIZIONE**: `id / formulazione / supporto-min[] / forte[] / contraddizioni[] / stato(formulata→…) / nasce-da(confronto) / presentabile-in / permette`.
**PERSONAGGIO**: la scheda §8. **LUOGO**: la riga §11. **SUONO**: `id / fonte diegetica / processo(inizio-fine) / missioni / migrazione di significato`. **CALLBACK**: `setup(id,dove) / payoff(id,dove) / canale / se-mancante`. **TEST DI COMPRENSIONE**: `domanda-aperta[] → orientata[] / comportamento / soglia`.
Ogni istanza: ID, funzione, precondizioni, stato, contenuto, conseguenze, scope, test.

==================================================
## 16. Scope & Version Lock
==================================================

**Sistemi necessari** (il sistema-proposizioni è FUNZIONALITÀ MAGGIORE [L]): (a) widget scelta; (b) modello dati proposizioni (strutturato, NON 44 boolean [L]: `props: {id: {state, evidence[]}}` + `stances{}` in save); (c) confronta/formula nel taccuino; (d) presentazione in dialogo con risposte-per-nesso + memoria dei respinti; (e) sezione presagi (testuale); (f) ritratto di dialogo (1 asset + 1 campo nodo); (g) branching M10/Loggia/epilogo (dati); (h) test: validatore proposizioni (raggiungibilità, anti-brute-force), walkthrough esteso ai percorsi (2 metodi × 2 nastro × leve M8 principali), smoke length-agnostic PRIMA di tutto [P: pattern noto].
**Budget per combinazione di stato** (non per missione): M8 = 3(avviso)×3(corsa)×2(promessa) = 18 combinazioni MA testo modulare: 8 moduli; M10 = 2-3 metodi × 2 nastro = 4-6 percorsi COMPLETI da scrivere e testare; Loggia = ordine(6, modulare per figura: 3×3 moduli) × S1(2) × S3(2) × metodo → moduli per figura, non prodotti cartesiani. **Stima onesta**: 900-1200 righe di dialogo nuove totali (non 570-760), ~30 nodi nuovi, 1 asset ritratto, 0 mappe nuove.
**Versione minima**: 2 metodi, senza S2, presagi negli indizi, Loggia con 1 azione (ordine), epilogo 6 righe. **Raccomandata [bloccata]**: tutto il documento tranne: terzo metodo (condizionale), S2 (condizionale). **Primi tagli se sfora**: (1) S2; (2) metodo Intuitivo; (3) varianti del Nano ridotte a 2; (4) modulo "vice al banco" di M8; (5) epilogo esteso→breve.

==================================================
## 17. Continuità & QA
==================================================

**Validazione automatica** (node): cronologia stati (validate-chronology pattern [P]); ogni evidenza referenziata esiste; ogni proposizione raggiungibile (dal grafo, per ogni ordine legale); anti-brute-force (le risposte-di-memoria coprono ogni coppia respinta); ogni flag scritto è letto (no orfani — `mfap_finale_visto` risolto: letto in laura_finale2 [L]); walkthrough su TUTTI i percorsi bloccati; obiettivo mai vuoto [P].
**Revisione semantica** (checklist umana/LLM): nessuna conclusione oltre il supporto; interpretazioni marcate; Laura/Maddy/Ronette presenti come soggetti nelle scene che le riguardano; interiorità = ricostruzione; sincronie = performance.
**Playtest di comprensione** (domande APERTE prima delle orientate [L]): M4 "come hai deciso cosa presentare?"; M8 "cosa pensavi di poter cambiare? cosa hai cambiato? perché è morta?" e SOLO DOPO "pensavi fosse possibile salvarla?"; M10 "chi ha ucciso Laura?" (aperta); finale "cosa hai portato fuori?". Test dedicati: equità Ronette, leggibilità volto→ospite, formulata≠confermata, sequenza R-O, falsa pista≠innocenza, Maddy-persona, presenza di Laura in M10.
**Playtest emotivo**: separato, mai prima di quello di comprensione.

==================================================
## 18. Pacchetto produttivo di prova — M4 "I frammenti"
==================================================

**Struttura (9 beat)**: B1 sheriff/racconto+S2 → B2-B3 ospedale (Ronette, Gerard) → B4-B5 diner (James; Norma/LogLady opz.) → B6 hotel (315, opz.) → B7 confronto T1↔E5 → B8 confronto E2↔E6 → B9 presentazione P2. Ordine B2-B6 libero; B7-B8 quando le coppie sono in mano; B9 chiude.
**Obiettivi minuto-per-minuto**: "Riferisci il sogno a Truman" → "Ronette è sveglia: l'ospedale" / "Il diner e l'hotel sanno cose diverse" → "Il taccuino ha due confronti che aspettano" → "Mostra a Truman cosa punta a est".
**Nodi proposti (ID)**: `truman_a2` [P, +S2 choice], `ronette_q` [N: choice 3 domande], `ronette_luogo/uomo/laura` [N], `infermiera_bob` [N: via laterale], `gerard_a2` [P, +pagina cuscino], `james_a2` [P, +testimonianza-luoghi esplicita], `specchio315` [P], `cmp_t1_e5` [N: nota confronto → P4b], `cmp_e2_e6` [N → P2 formulabile], `present_truman_m4` [N: presentazione].
**Ronette con fail-forward (equità)**: domanda-luogo → reagisce alla parola "vagone", guarda DIETRO Cooper; taccuino: "Non teme il luogo; teme qualcuno che potrebbe entrare." → si apre la domanda-uomo. Domanda-uomo → "BOB!" (T1). Domanda-Laura → stringe il lenzuolo, indica DUE presenze; taccuino: "C'era qualcun altro." Ogni percorso raggiunge T1 entro due passi; il costo varia: dopo due domande l'infermiera chiude la visita — la terza informazione arriva da lei in corridoio (`infermiera_bob`).
**Stati scritti**: sogno_raccontato(S2), ronette_bob, ronette_percorso, poesia_fuoco, cuore_intero, testimonianza_james, P4b:ipotesi, P2:formulata→presentata→accettata, atto3.
**Contenuti opzionali**: Norma (la tazza di Laura), Log Lady (1° gufo), la 315 muta.
**Regia sensoriale**: ospedale = monitor come suono dominante, il giro delle flebo continua; diner = percolatore; 1 oggetto risemantizzato per luogo (la porta di Jacques ancora anonima — pagherà dopo).
**Scope**: ~28 pagine dialogo, 6 nodi nuovi, widget per `ronette_q`, 2 confronti, 1 presentazione; test: raggiungibilità T1 per tutti i percorsi, anti-brute-force su present_truman_m4, walkthrough con i 6 ordini di visita.
**Completamento**: P2 accettata da Truman (flag atto3), con qualunque percorso.
**Campione 1 — Ronette/infermiera** (stile: segnali osservabili, niente intenzioni):
> (Il monitor tiene il suo tempo. Ronette guarda la porta, non la finestra.)
> COOPER: Signorina Pulaski. Posso chiederle del posto dove l'hanno trovata?
> (Il tracciato non cambia. Le dita di Ronette si fermano sul bordo del lenzuolo.)
> INFERMIERA: Le parole non la raggiungono tutte, agente.
> COOPER: E se le chiedessi dell'uomo?
> (Il tracciato si impenna prima che la parola finisca.)
> RONETTE: BOB. BOB. BOB.
> INFERMIERA: (piano) Lo fa anche quando qualcuno entra senza farsi sentire. Sempre alle sue spalle.
> — taccuino: *Non teme il luogo. Teme qualcuno che entra.*
**Campione 2 — Cooper/Truman, presentazione** (fail-forward nel merito):
> COOPER: Harry. Laura vedeva qualcuno fuori dal paese. A est.
> TRUMAN: Me lo dici col cuore spezzato di una collana?
> COOPER: Il cuore dice con chi. (posa l'altra metà) James l'ha tenuta da febbraio. I posti li ha detti lui: oltre la strada est.
> TRUMAN: (guarda la bacheca, poi il registro) Un oggetto e un testimone. Va bene. La contea non deve saperlo prima che io ci abbia camminato.
> — obiettivo: *La strada a est: il vagone del treno.*
> (Se il player presenta SOLO la poesia:) TRUMAN: Il fuoco cammina. D'accordo. Ma chi camminava con Laura? Portami una persona, non un verso. — taccuino: *Chi conosceva i posti di Laura fuori dal centro?*

==================================================
## 19. Self-audit
==================================================

1. **Fatto che è ancora deduzione travestita**: "la scena era disposta" — mitigato dai segnali osservabili di E8, ma resta un'inferenza che il testo descrittivo deve reggere da solo; da testare (§17).
2. **Proposizione che riceve troppo**: P7 se la scrittura la lascia scivolare da ipotesi a movente — guardia: mai presentabile come procedurale.
3. **Menu che anticipa**: il rischio residuo è l'elenco delle conclusioni in `present_truman_m4` — contiene SOLO le formulate (nate da confronti), mai le formulabili.
4. **Personaggio femminile ancora strumentale**: Donna (esiste solo nell'arco di James) — accettato e dichiarato: arco di lutto, non promossa.
5. **Scelta che resta una riga**: S2 — condizionale, primo taglio.
6. **Scena che parla per Laura**: il necrologio/le "versioni" — la guardia è §8 (nessuna versione vince).
7. **Interpretazione che appare canonica**: l'ipotesi di Cooper sul nastro (beat 3 M10) — marcata nel testo, da vigilare in scrittura.
8. **Luogo ancora scenografia**: OEJ fuori da M6 — accettato, dichiarato.
9. **Missione soprattutto pagine**: M7 — dichiarata ascolto, breve.
10. **Stato che esplode in combinazioni**: la Loggia (ordine×S1×S3×metodo) — risolto coi moduli per figura (§16), da validare in scrittura.
11. **Elemento passivo della Loggia**: i beat 1-3 (soglia/corridoio) — accettati come respiro; le due azioni stanno in 4-6.
12. **Sistema sottostimato**: il validatore delle proposizioni (test di raggiungibilità per ordini) — stimato, ma è il candidato a sorprese.
13. **Contenuto da tagliare**: lista bloccata in §16.
14. **Ambiguità da proteggere**: Q4 (cosa è BOB), la ripartizione R7, l'enigma 3, le pagine cifrate di Laura.
15. **Decisione che richiede l'autore umano**: vedi §20 — S2, terzo metodo, epilogo, e l'autorizzazione a INIZIARE la scrittura di M4.

==================================================
## 20. Chiusura
==================================================

**Dieci decisioni canoniche bloccate [L]**
1. Sogno versione A: volto-sconosciuto ricordato da entrambi; solo il nome è perduto (da entrambi).
2. La regola seriale del diario ("il suo nome un pezzo alla volta" + ROBERT nel registro cifrato) è l'unico ponte delle lettere.
3. Nessuna conclusione riceve più di quanto il supporto contenga; proposizioni a stati multipli; la formulazione nasce da confronti scelti dal player; niente contatori-fallback.
4. M8: morte fissa, leve sulla distribuzione dei costi, ogni avvertimento cambia un'azione di Maddy, variante Sarah-trova-corpo tagliata, mai colpa indotta.
5. M9: colloquio volontario su P6+accesso; visioni mai procedurali; arresto solo post-confessione.
6. M10: fatti materiali a nastro PRIMA di S3; ponte volto→ospite = ritratto di dialogo + registro (2 segnali); chiusura di Cooper come interpretazione.
7. R7 formalizzata; la ripartizione Leland/BOB mai scritta a sistema; il soprannaturale non assolve; Laura ha l'ultima immagine.
8. Loggia: 8 beat, due azioni (ordine degli incontri + risposta a BOB, più il gesto dell'anello se presente), niente quiz, nessun verbo nuovo.
9. Regole visive/sonore come gerarchie; sincronie solo come performance o processi onesti; accessibilità sopra la purezza diegetica.
10. Scope raccomandato bloccato con budget per combinazione di stato e tagli ordinati; smoke length-agnostic prima dei contenuti.

**Cinque elementi ancora aperti**: (1) S2 dentro o fuori; (2) due o tre metodi M10 (criterio bloccato, verifica in scrittura); (3) ampiezza dell'epilogo; (4) posizione esatta del momento ordinario di Maddy (diner Atto 4 proposto); (5) budget finale di scrittura (900-1200 righe: confermare).

**Cinque primi tagli**: S2 → Intuitivo → varianti Nano a 2 → modulo vice-al-banco M8 → epilogo breve.

**Cinque criteri per autorizzare la scrittura**: (1) Bible approvata dal tutor e dall'autore umano; (2) smoke reso length-agnostic; (3) modello dati proposizioni validato a vuoto (node) prima dei testi; (4) template §15 usati per OGNI contenuto nuovo; (5) ogni pacchetto missione passa validazione automatica + revisione semantica PRIMA dell'integrazione nel repo.

**Frase definitiva**: «Twin Peaks Game è il paese disegnato per essere tenero fino all'ultimo pixel, dove indagare significa scegliere che cosa guardare, che cosa sostenere e che cosa registrare — e dove la verità, una volta ottenuta con gentilezza, ha la forma delle tue mani e il peso di ciò che non ha salvato.»
