# Timeline + Character Knowledge Extraction — Story Truth Layer

ZERO-INVENTION extraction. Quotes are verbatim or near-verbatim from the named source; no reconciliation performed. Vault dir = `/Users/ebuccelli/Vault/1. Projects/Twin Peaks Game/`. Repo = `/Users/ebuccelli/Code/solo/projects/twin-peaks-game/`.

Sources read in full/near-full: `Bible - Twin Peaks Game.md` (§0,§3,§4,§8,§9,§13), `Architettura Causale - Twin Peaks Game.md` (§2,§3,§4,§8,§9,§10,§11), `Grammatica Indagine - Twin Peaks Game.md` (§1,§2,§3,§4,§11,§12,§13,§14), `M9-M10 v1.1 (confession lock).md` §5, `Loggia-Epilogo (pacchetto finale).md` §4 (B5/B6/B7), `M8 - Sta accadendo di nuovo (pacchetto).md` §0-§8; repo `docs/act-2-closure-report.md` (full), `docs/act-3-design-report.md` §4-7,§10-11, `artifacts/act-3-design/fact-knowledge-ledger.md` (full), `artifacts/act-3-design/scene-contracts.md` (full), `artifacts/act-3-design/doctrine-audit.md` (full). Not read in full due to volume/budget: `M4 - I Frammenti v1.1.md` §7 script text, `M5-M6 v1.1.md` §3/§5 script text, `M9-M10` §3 (M9 script), `Loggia-Epilogo` §4 B1-B4/B8-B9, `M8` §9 (A-F script) — these are covered instead via their design-doc summaries (Bible §6, Grammatica §6, Architettura §5) which quote/paraphrase the same beats. `Piano Personaggi.md` was checked and is NOT character-knowledge content — it is a sprite/graphics dev plan; contains no story facts, skipped.

---

## A. EVENT STATEMENTS

### A1. Pre-game / canonical backstory (design intent, tagged [L]=locked, [P]=project-existing, [C]=series canon)

| Quote | Source | Tag |
|---|---|---|
| "Laura conduceva una vita doppia" (P1) | Bible.md:112 (table); Grammatica.md:104 | design-locked proposition, confirmed only "dalla confessione" |
| "Laura incontrava James o altri in luoghi a est" (P2) | Bible.md:113 | confirmed "dal vagone" |
| Laura: "DUE atti pre-gioco (fatti): nascose il diario vero, spezzò il cuore — custodia deliberata: il caso è risolvibile perché LEI ha agito" | Bible.md:191 (Character Bible, Laura row) | marked [fact] within char-bible row |
| "Laura — azione pre-gioco: ha NASCOSTO il diario vero e spezzato il cuore — due atti deliberati di custodia (agency prima del gioco)" | Grammatica.md:248 | same fact, restated |
| Diario, riga canonica (b): "Dice che lascerà il suo nome un pezzo alla volta." + il nome "ROBERT" nel registro cifrato | Bible.md:95 (E1) | [P+L] |
| "esiste una riga del diario che stabilisce la regola seriale (vedi §4, E1). R+O+ordine+diario = TEORIA di firma, mai verità pre-M10" | Bible.md:43 | design decision (conflict #2 resolution) |
| Sogno: "player e Cooper vedono e RICORDANO entrambi il volto dello sconosciuto; solo il nome sussurrato è perduto (per entrambi)" | Bible.md:42 | [L] design decision |
| "il volto di BOB entra come *sconosciuto* — appare nella visione di Sarah... e nel sogno come presenza ai margini della Stanza Rossa" | Grammatica.md:59 | [N] design |
| "Nessun NPC del paese ha quel volto: la domanda 'chi lo ospita?' è il whodunit." | Grammatica.md:59 | design assertion |
| Canon fact [C]: "nella serie il pubblico NON sente il nome sussurrato nel sogno e NON sa che l'ospite è Leland fino al reveal; però VEDE il volto di BOB — uno sconosciuto ferale — fin dalle prime visioni (Sarah)" | Grammatica.md:43 | explicit [C] series-canon citation |

### A2. Act 1 — "Il paese dei ciliegi"

| Quote/fact | Source | Notes |
|---|---|---|
| "Cooper arriva; monologo (town_arrivo, once)" ... "il SOGNO: la Stanza Rossa, Laura sussurra il nome" ... "Cooper si sveglia al Great Northern e HA DIMENTICATO (split)" | Architettura Causale.md:84-92 (audit table Atto 1) | project state as-built |
| Canon-lock table row 1: ingresso "arrivo [P]"; causa "l'omicidio"; rivelazione "il diario doppio; il SOGNO (volto sconosciuto + nome perduto) [L]"; transizione class "causale (il sogno È la pista)" | Bible.md:79 | table row |
| "[N-R1] una riga nel dialogo del diario: il diario cita il bosco/Glastonbury come luogo che Laura temeva — l'apertura diventa inseguimento di una pista" | Architettura Causale.md:111 | repair note re: bosco transition |

### A3. Act 2 — "Il rapporto dell'autopsia" (M4)

| Quote/fact | Source |
|---|---|
| "Ronette in coma ('BOB!' → ronette_bob), la poesia del fuoco (Gerard), il cuore ricomposto (James — SOLO dopo il sogno: gate sociale corretto), Audrey che indaga... Svolta: sei frammenti che non compongono ancora un nome. Conseguenza: Truman apre la strada a est." | Architettura Causale.md:97 |
| M4 completed through P2 alone before fix; `cmp_e6a_tjames` needed only James's two evidence atoms — "a player could reach `atto3` without hearing BOB" | docs/act-2-closure-report.md §1 |
| Fix: comparison "additionally requires `node_done: ronette_uomo`, the terminal node of Ronette's visit and the sole writer of evidence `T1_RONETTE_BOB`" | act-2-closure-report.md §1 |
| Dependency graph: Truman dream report → {Ronette visit (ronette_q → ronette_uomo → T1_RONETTE_BOB) ‖ James (james_a2 → E6A_CUORE_INTERO, T_JAMES_EST)} → notebook cmp_e6a_tjames → P2 → Truman accepts → atto3 → M5 footbridge | act-2-closure-report.md §2 |
| Hospital rebuilt native (4th native room); "variant B is the Golden Concept": "all-cool palette (mint upper wall, ivory rail, blue-gray linoleum, chrome), no walnut" | act-2-closure-report.md §3 |
| "Ronette lies in bed as part of the bed art... Gerard stands at 11,4 beside the second bed" | act-2-closure-report.md §6 |
| Act 2 verdict: "Frozen: pass with notes. The act has one required spine (wake → Truman → Ronette + James → notebook → Truman → east road)... the act cannot be completed without hearing BOB." | act-2-closure-report.md §10 |

### A4. Act 3 — "Una notte alle Giacche" (M5/M6, traincar)

**M5 — the car (established facts, per fact-knowledge-ledger.md, status FROZEN 2026-09-09):**

| # | Fact | Objective truth as stated | Rendered acquisition |
|---|---|---|---|
| 1 | Ring placed, not dropped | "Placed deliberately at the exact centre (report §5A/§9 table)" | `m5.b8c.feedback.deliberate`: "La posizione non è compatibile con una caduta casuale: una collocazione deliberata è la lettura più forte." |
| 2 | Scene arranged to be read | "Ring at centre + flap of ticket left showing + no drag marks edges→centre = staged for discovery, not concealment" | `m5.b7.scene.p02`: "La violenza ha i suoi segni ai bordi. Fra i bordi e il centro: nessun passaggio." |
| 3 | Ronette fled toward town | "The county stake/worn planks are on the town bank; she ran from the car toward town, confirming James's 'veniva da est'" | `m5.b1.bridge.p02`: "(Il ponticello di legno: qui hanno trovato Ronette, la notte del delitto.)" |
| 4 | Old tracks continue north past the car | "Rails end at the car for wagons, but foot tracks (old, pre-rain) pass the car and enter the cut toward OEJ; none return" | `m5.b1.bridge.p05` (Hawk): "Le altre sono più vecchie della pioggia. Portano a est, nessuna torna indietro." |
| 5 | Cards were dealt in the car | "A damp deck under the torn seat, dealer's cut still squared: someone held the bank there, more than once" | Jacques's testimony `m6.b5.falsa.p04`: "Anche al vagone si giocava, quella notte, e il banco era mio." |
| 6 | The stove / someone watched the fire | "Cold stove, ash raked into a ring, a burnt matchbook: someone tended a fire here... one man only watched it" | Jacques `m6.b5.falsa.p06`: "(la risata cala) Non beveva. Guardava la stufa come si guarda una persona." |
| 7 | Laura came here more than once | "The worn planks (town side), the stove ash 'more than one night,' the cards' wax buildup — a repeated, chosen place" | Cooper's inference, not yet a written page |
| 8 | Jacques was present at the car | "Jacques admits presence (all three tactics); never admits authorship" | `m6.b5.prova.p04`: "C'ero. Giocavamo. Questo è tutto quello che dico." |
| 9 | Jacques's third-man claim (per tactic) | "midnight freight (prova) / matches man in a list of four (pressione) / third man watching the stove (falsa) — three different partial disclosures, none confirming an identity" | `m6.b5.pressione.p07`: "Uno che accendeva e spegneva. Accendeva e spegneva. Senza mai fumare." |
| 10 | Jacques is not the author | "Presence ≠ authorship (bible §5 'Evidence rigor')" | `m6.b6b.p5.feedback.present`: "Jacques può essere collocato sulla scena. La sua presenza non basta ad attribuirgli l'omicidio." |
| 11 | The guarded bed was breached | "Someone entered a piantonato hospital room and smothered Jacques with a pillow, unseen" | `m6.b8.news.p02`: "Jacques Renault... soffocato nel suo letto. Un cuscino. Nessun testimone." |
| 12 | The register shows no entry | "The night registry has no signature between midnight and shift change" | `m6.b8b.hospital.p04`: "Nessun ingresso registrato e un uomo morto sotto sorveglianza. Il registro non spiega la stanza." |
| 13 | The Giant's three things | delivered at Room 315 mirror (`gigante1_dlg`) — text out of scope of this ledger, "content confirmed only by report reference" | — |
| 14 | "It will happen again" | report §4 quotes verbatim: "È successo di nuovo. E accadrà ancora." | bridge line: `m6.b9.atto4.p02` (Truman): "Un gigante non so dove metterlo. Jacques sì: qualcuno ha superato un piantone." |
| 15 | The ring's custody (S1) | "Player-chosen: institutional safe vs. Cooper's documented personal custody; Truman signs either while objecting to the second" | institutional `m5.b9.s1.institutional.p02` (Truman): "Quando saprai che cos'è, sarà dove deve essere." / documented `m5.b9.s1.documented.p02`: "Metto a verbale che non sono d'accordo. E che ti conosco abbastanza da firmare lo stesso." |

Act 3 dramatic-purpose statement (act-3-design-report.md §4): "Act 3 must give the *crime* a shape: not a stranger's outburst but a prepared, local, repeatable act — and prove it is still active by taking the witness away under the county's own guard." HUMAN REVELATION: "Laura came here more than once and not by force (the stove, the cards, the worn planks): the hidden life had an address. Jacques is a coward who dealt cards to a girl he did not save, not a killer." MYSTERY REVELATION: "the ring was placed at the exact centre... 'fire' is a procedure, not a metaphor (ticket, stove, the matches man); the threat can pass a guard, so it is local and active (P9)." END HOOK: "'È successo di nuovo. E accadrà ancora.' The Giant's three things arrive *because* the method failed the witness; Truman files the guard, not the giant."

Opposition timeline offscreen (Architettura Causale.md:133-139, table "Timeline offscreen dell'opposizione"):
- Atto 1-2: BOB/Leland "sa che l'indagine riparte" → "Leland 'collabora' al lutto pubblico" → traccia "leland (palmer) troppo composto; sarah esausta" → "NON sa del sogno di Cooper"
- Atto 3: "sa che Jacques può collocarlo al vagone" → "eliminare il testimone" → "morte in ospedale" → traccia "lucy_a3 (fuori scena, riferita)" → "non sa che l'anello è stato trovato"
- Atto 4: "sente Maddy come 'di nuovo Laura'" → "uccide Maddy MENTRE il player è al Roadhouse" → "'sta accadendo di nuovo' (gigante2), poi il lago" → limite: "non può essere ovunque: agisce solo dove il player non guarda (regola: mai onnisciente, mai due azioni nello stesso atto)"
- Atto 5: "sa che le prove convergono" → "governare la forma della resa" → "confessione 'inutilizzabile' [?]"

### A5. Act 4 — "Il gigante e la cugina" (M8, Maddy's murder — TRAGEDY FIXED)

From `M8 - Sta accadendo di nuovo (pacchetto).md`:

**Manifesto §0** (M8.md:18-20): "Jacques morto; la risorsa del ramo giocato persa; le info acquisite sopravvivono; P9 formulata/non confermata; il Gigante orienta... 2° enunciato: 'sta accadendo di nuovo'; il player non sa chi/quando/dove; Maddy muore comunque; **Sarah non trova il corpo**; la lettera O si acquisisce in ogni percorso (catena variabile); nessun flag `maddy_salvabile` esiste o esisterà."

"Re-lock cronologico R12 (2026-08-06): subito dopo la promessa a Maddy, ancora al diner, Cooper parla fisicamente con Leland. Leland dichiara di aver prenotato il taxi per la prima corriera. Se Cooper ha offerto di accompagnarla alle 7:10, verifica che il taxi delle 7:00 aspetterà; Leland conferma. I due orari sono compatibili: la sola discrepanza investigativa futura sarà la prenotazione inesistente." (M8.md:20) — this taxi lie is later confessed as false in M10 (§B6): "LELAND: Mai chiamato. Ho mentito io."

**§1 Contratto (M8.md:26)**: "FISSO: la morte di Maddy; l'autore (Leland/BOB — verità autoriale, mai scritta a sistema); il luogo del ritrovamento (il lago [P: lago_maddy, town 15,28]); la lettera O; il passaggio all'Atto 5."

**§2 (M8.md:41)**: Maddy "Vuole: TORNARE A CASA SUA (Missoula: lavoro che l'aspetta). Scelta pratica: gli orari della corriera. Rapporto con Sarah: è rimasta UN giorno in più per lei — sua scelta, già canone."

**§3 Mappa della conoscenza (M8.md:47-53, table)** — "chi sa cosa": for fact "'la casa Palmer è coinvolta'": Player "~ (P7 in formazione)", Cooper "~", Truman "! ('il dolore')", Sarah "~ (la teme)", Maddy "X", Leland/BOB "S", Sistema "S". For "'Leland è responsabile'": everyone but Leland/BOB and Sistema is "X" (does not know).

**§8 Timeline autoriale unica (M8.md:74)**: "T0 pomeriggio — Maddy al diner decide: prima corriera del mattino (fermata del lago). T0.5 — Maddy esce; al diner Leland dichiara di averle prenotato il taxi. T1 sera — torna a casa Palmer. **T2 — Leland/BOB è GIÀ DENTRO la casa: il pericolo è interno, mai un estraneo sulla strada** (coerente con P7). T3 — il Gigante appare al Roadhouse... T4 — la telefonata (se fatta) trova Maddy in casa: cambia ciò che fa NELLA casa, mai il percorso dell'omicidio. T5 — l'attacco avviene in casa, prima che chiunque possa arrivare... T6 — il corpo viene portato al lago. T7 — una chiamata civile anonima segnala qualcosa sulla riva: la centrale manda Hawk... Nessun percorso può intercettare Leland/BOB; nessuna strada era quella giusta."

Bible mission-bible entry for M8 (Bible.md:164): leve (1) chi avvertire — "OGNI avvertimento cambia un'azione di Maddy (avvertita: prova a partire, TORNA per Sarah, lascia la valigia pronta — visibile al lago; Sarah avvertita: il vice c'è quando arriva la notizia; nessuno: nessuna presenza)"; (2) dove correre dopo gigante2; (3) la promessa. "Prima di M8: il **momento ordinario di Maddy** [L]: al diner ordina la torta che Laura odiava, ridendo ('almeno su questo non eravamo parenti')."

Act 3→4 revelation chain, Architettura Causale §8 (R6, lines 245): "il mostro era in casa" — inference: "ROBERT→(diario)→BOB→casa Palmer" — reinterpreted: "leland_a4/dove/dopo, sarah_visione, la compostezza."

### A6. Act 5 — confession (M10) and death

From `M9-M10 v1.1 (confession lock).md` §5 (M9-M10.md:82-200), the confession script (three method-branches, same underlying admissions):

- Probatorio branch, Cooper: "Il taxi." → LELAND: "Mai chiamato. Ho mentito io. Questo è mio." → `material_admissions.taxi_lie: recorded, leland_first_person` (M9-M10.md:144-145)
- "COOPER: Chi ha ucciso Maddy Ferguson? LELAND: Io. (la precisione non trema) Dopo, l'ho portata al lago." → `maddy_homicide + maddy_body_transport: recorded, leland_first_person` (M9-M10.md:146-147)
- "COOPER: Laura Palmer? LELAND: (la voce di un uomo che detta un atto) Io. Al vagone." → `laura_homicide + traincar_presence: recorded, leland_first_person` (M9-M10.md:148-149)
- "COOPER: Le lettere. LELAND: R. O. Le ho lasciate io. Un pezzo alla volta." → `material_admissions.letters: recorded` → `P6: confirmed_as_lie; P8: corroborated` (M9-M10.md:150-151)
- Personale branch, Leland: "L'ho uccisa io. Al vagone." (Laura); "Voleva solo il suo centralino. Conoscevo il suo orario e io... L'ho uccisa io. Poi l'ho portata al lago." (Maddy) (M9-M10.md:158-160)
- Intuitivo branch: same admissions delivered "flat" ("piatto, come chi legge") (M9-M10.md:166-177)
- B7b post-S3 segment (spoken in ALL paths regardless of tape state): "LELAND: Avevo dodici anni. C'era una casa bianca, vicino al lago dei nonni. E un uomo che chiedeva di giocare." / "Diceva: ho un nome da persona perbene, piccolo. Come il tuo." / VOCE (portrait shifts): "I pezzi del nome sono nostri. Li abbiamo lasciati perché qualcuno contasse." / LELAND: "Quando dormo, lui non dorme. Questo lo so. Il resto... il resto non so più di chi sia." (M9-M10.md:188-193)
- B8, Cooper's closing notebook line: "Maddy Ferguson aveva scelto la corriera delle 7:40. Laura Palmer aveva nascosto un secondo diario. Le loro azioni restano nel fascicolo. Il perdono non è materia nostra." (M9-M10.md:199)
- M10 beat-12 closing line (Bible.md:266): "«So ciò che ha fatto. Non so più dire dove finisse la sua volontà. Una cosa non cancella l'altra.»"

### A7. Loggia / Finale

From `Loggia-Epilogo (pacchetto finale).md` §4:
- Nano, S1-institutional: "(Il Nano apre la mano. Vuota.) ???: L'hai lasciato dove tutti potevano trovarlo. E dove nessuno avrebbe saputo che cosa cercare." (Loggia.md:83)
- Nano, S1-documented, gesture "mostra": "???: L'hai portato con te. Adesso sai quanto pesa una cosa che solo tu puoi perdere." → `ring_final_gesture: kept` → epilogue: "riconsegna con la firma → final_ring_location: evidence_vault" (Loggia.md:85)
- Nano, gesture "depone": "(L'anello resta sul tavolino. Il Nano non lo tocca.) ???: Qui le cose non si perdono. Nemmeno si restituiscono." → `final_ring_location: lodge` — "il registro di trasferimento esiste, l'oggetto no — la perdita è nominata, mai spiegata; il costo è di Cooper" (Loggia.md:86)
- BOB module opening: "[N, cornice anti-assoluzione] Sul tavolino compare il verbale. Due righe restano cerchiate: «L'ho uccisa io.» «Ho mentito io.»" (Loggia.md:90)
- BOB: "Leland era solo un guanto. La mano... è ancora qui." [P] (Loggia.md:91)
- BOB, S3=on: "(la voce cambia: è la SUA voce dal nastro) «Quando dormo, lui non dorme.» ... L'avete inciso. Io non dimentico ciò che viene inciso." (Loggia.md:92)
- BOB, S3=off: "La macchina si è fermata. Adesso la stanza pesa su due uomini: te e lo sceriffo. Quanto regge una verità senza nastro?" (Loggia.md:93)
- BOB closing: "Ci rivedremo, agente. Noi ci rivediamo SEMPRE." [P] (Loggia.md:98)
- Laura (B7, always last): "Sono calma, adesso. Il fuoco non brucia più, qui dentro." [P] (Loggia.md:104)
- Laura: "Mio padre non lo sapeva. LUI sì." — marked "*(interpretazione di Laura [I], protetta: il sistema non la conferma né la corregge)*" (Loggia.md:106)
- Laura, re-lock R12 note: "Non sapere non cancella ciò che ha scelto. Quanto fosse suo, non posso dirlo." — "*(la vittima nega l'assoluzione e rifiuta di quantificare la frattura; P10/R7 resta aperta)*" (Loggia.md:107)
- Laura closing: "Ti rivedrò fra venticinque anni. Nel frattempo..." [C — attributed to canon] (Loggia.md:109); "L'ultima immagine della Loggia è SUA" (Loggia.md:111)
- Presagio (3rd Giant utterance, read in the woods before S4): "Senza sostanze chimiche, lui torna." [P] (Loggia.md:118)

R7 statement (Grammatica.md:227, §11): "Modello precedente: 'esiste un colpevole unitario che il fascicolo può contenere'. Nuovo modello: gli atti sono di Leland; la confessione manifesta una discontinuità che il gioco non sa (e rifiuta di) quantificare." Guard: "i fatti restano elencati a nastro PRIMA di ogni pietà (beat 9); la frase di Cooper è interpretazione; Laura e Maddy restano presenti."

---

## B. CHARACTER KNOWLEDGE STATEMENTS

### Cooper
- Bible.md:189 (Character Bible row, info(±) field): "sa il sogno, il nome no" / "fallisce la protezione (Jacques, Maddy)"
- Architettura Causale.md:279: "sa il sogno che non ricorda (negato: il nome)"
- Bible.md:210 (relations table, Cooper–Truman): info asimmetrica "il sogno (S2)"
- Bible.md:211 (Cooper–Leland): info asimmetrica "il volto (fino a M10)"
- Bible.md:212 (Cooper–Sarah): "debito di Cooper (non l'ha creduta abbastanza presto [I])" — marked [I], interpretation not fact
- fact-knowledge-ledger row 1: Cooper knows "Ring placed, not dropped" only "(after comparison)"; "player (pre-comparison)" only suspects
- fact-knowledge-ledger row 8: "Cooper/Truman may not say 'Jacques era al vagone' as confirmed before B4 completes; before that it is only Truman's lead... a hypothesis, not a fact."
- scene-contracts.md S4 (Truman report, K/S/F/W): "Cooper knows E7–E8, P3A; may falsely believe 'impeto' if he kept it."
- scene-contracts.md S6 (Jacques table): "Cooper knows the car, the ring, the cards (if A8), the stove (if A7); suspects a third; withholds the ring."
- scene-contracts.md S11 (Giant/mirror): "Cooper knows he has lost a witness under guard; falsely believes the material method still suffices (this scene ends that belief — the Bible's cause)."
- M8 knowledge map (M8.md:47-53): Cooper does NOT know "Maddy è il bersaglio" (X) or "Leland è responsabile" (X); only "~" (reasonable inference) on "una ragazza vicina a Laura è in pericolo" and "la casa Palmer è coinvolta" (P7 in formazione)

### Truman
- Bible.md:190 (Character Bible): "sa il paese; il soprannaturale solo se S2 / vuole sbagliarsi su Leland"
- Architettura Causale.md:280: "sa il paese, gli è negato il soprannaturale (o gli è negato finché S2 non lo apre)"; "**Agente, non accompagnatore**: in M9 OPPONE attrito al mandato; in M10 decide cosa verbalizzare; con S3-OFF decide se testimoniare."
- scene-contracts.md S4 (K/S/F/W): "Truman knows what a filed scene needs; suspects Cooper's reading will not fit a form; falsely believes nothing; withholds his own reading (he has one: 'Questo va nella cassaforte' shows he thinks the ring is the point)." self_image = "the man who files what can be filed" · declared = "facts ours, reading yours" · leak = "'Questo va nella cassaforte. Stasera.' reveals he thinks the ring is the case" · protected_truth = "he wants the ring away from Cooper" · exit_cost = "if Cooper keeps it, Truman signs against himself."
- scene-contracts.md S6 (Jacques table): "Truman (post `east_route_confirmed`, before B4)" only suspects Jacques was there.
- scene-contracts.md S8: "Truman knows the guard is his; falsely believes the guard is enough; withholds nothing."
- scene-contracts.md S12 (Act 4 bridge): "Truman knows a guard was passed; suspects it was someone who does not need to sign; withholds 'I believe you' (the classic version said it; the mission version rightly does not)." Unsaid: "Truman *does* believe him."
- M8 knowledge map: Truman on "la casa Palmer è coinvolta": "! ('il dolore')" — i.e., resists/rationalizes, does not accept
- M9-M10.md:113: "TRUMAN: (si sporge) Cooper. Piano. C'è un limite anche qui dentro." — reactive line during Personale branch questioning

### Leland / BOB
- Bible.md:192 (Character Bible): "sa; nega; forse non ricorda"; voce BOB: "presente storico, sintassi corta, Leland in terza persona"
- Architettura Causale.md:281 ("separazione obbligatoria"): "*azioni compiute*: gli omicidi, la bugia su Missoula (fatti, mai relativizzati). *Memoria*: lacunosa (il gioco non certifica quanto). *Responsabilità*: FRATTURATA non cancellata — perpetratore, strumento e vittima insieme."
- Bible.md:193 (BOB as forza): "agisce per accesso/opportunità (Jacques: unico che può collocare il terzo uomo; Maddy: la ripetizione), MAI per copione; limiti: non onnisciente, non ubiquo"
- M8 knowledge map: Leland/BOB is "S" (sa/knows) on every row: "qualcosa si ripeterà", "una ragazza vicina a Laura è in pericolo", "Maddy è il bersaglio", "la casa Palmer è coinvolta", "Leland è responsabile" — the only character who knows all of it
- Leland's own admission (M9-M10.md:193): "Quando dormo, lui non dorme. Questo lo so. Il resto... il resto non so più di chi sia." — self-reported partial/uncertain knowledge of his own acts

### Sarah
- Bible.md:194 (Character Bible): "percepisce PRIMA (T3) / ha visto il volto; NON conosce fatti e ripartizioni [L]"; "nell'epilogo non chiede 'chi è stato' — aveva SOSPETTATO la casa [L: mai 'sapeva']"
- M8 knowledge map: Sarah "~ (la teme)" on "la casa Palmer è coinvolta"; "X" on "Maddy è il bersaglio" and "Leland è responsabile"
- Grammatica.md:251 (Sarah scheda): "desiderio: essere creduta; azione indipendente: chiama la centrale PRIMA che il player scelga (M8: la sua telefonata esiste in ogni ramo)"; "payoff: in T4/epilogo è l'unica che NON chiede a Cooper 'chi è stato' — sapeva." [note: this "sapeva" phrasing conflicts with Bible.md:194's explicit "mai 'sapeva'" — see Conflicts §E]

### Ronette
- Bible.md:196 (Character Bible): "sa il volto/il nome"; "il grido: **atto comunicativo significativo, senza certificarne la piena coscienza [L]**"
- Grammatica.md:250: "la sua unica parola è una SCELTA (grida il nome per avvertire, non per delirio — la lettura la offre l'infermiera: 'urla solo quando qualcuno le entra in stanza alle spalle')"

### Maddy
- Bible.md:195 (Character Bible): "resta un giorno per Sarah (SUA scelta, offscreen, detta)"
- M8.md:41 (§2): "Vuole: TORNARE A CASA SUA (Missoula: lavoro che l'aspetta)"
- M8.md:30 (§1 variables): "se avverti casa Palmer risponde MADDY: resta con Sarah, porta la valigia nell'ingresso, lascia un biglietto («Torno lunedì. Non svegliarla.»)"
- M8 knowledge map: Maddy is "X" (does not know) on every threat-related row including her own targeting

### Jacques
- Bible.md:199 (Character Bible): "sa il terzo uomo (mezzo)"
- fact-knowledge-ledger row 8/9: Jacques "author of the fact" for cards/stove; knows "he was there, who else, and what the third man did" (scene-contracts S6)
- scene-contracts.md S6: "Jacques knows he was there, who else, and what the third man did; suspects Cooper has the car (the photo proves it in *prova*); falsely believes the river protects him; withholds every name (pressione: one true name hidden in a list)." self_image = "the house always wins" · declared = "I carry cards, not messages" · leak = "hands/laugh/photo" · protected_truth = "the third man frightens him" · exit_cost = "to leave the table he must leave the room (arrest)."

### Hawk
- scene-contracts.md S1 (bridge): "Hawk knows the prints' age and direction, where the county stake is; suspects the prints go somewhere with a name; withholds where (he will only say it standing there)." self_image = "the one who does not need the story" · declared = "prints, mine and yours" · leak = "he says 'nessuna torna indietro' before Cooper asks, so he has already followed them" · protected_truth = "he knows the trail ends at a place with a name and will not say it here" · exit_cost = "if Cooper walks ahead of him he loses the ground."
- scene-contracts.md S2 (car door): "Hawk knows the dust inside is undisturbed (he looked from the door); withholds his own reading of the mound."
- scene-contracts.md S3 (north cut): "Hawk knows the trail ends at OEJ ('dal cartello in poi il sentiero non serve altre proprietà'); withholds until Cooper stands beside him."
- act-3-design-report.md §7: Hawk "Notices what Cooper does not: the planks are worn on the town side (people came *back*); the old tracks go past the car, not to it." "Refuses to interpret: asked what the mound means, 'La terra la leggo. Perché l'hanno messa lì lo leggi tu.'"

### James / Donna
- Bible.md:198: "trattengono E6" (the intact heart pendant/testimony)
- Grammatica.md:99: "testimonianza James (i luoghi a est) → P2"

### Laura (postuma)
- Bible.md:191 already cited in A1.
- Grammatica.md:248: "rapporto con Cooper: lo raggiunge solo nel sogno — l'unico teste che parla per enigmi; con Leland/BOB: il gioco NON la racconta come segreto svelabile — le pagine cifrate del diario restano cifrate anche alla fine"
- Loggia B7: her stated belief "Mio padre non lo sapeva. LUI sì." is explicitly flagged in-source as her own interpretation, "protetta: il sistema non la conferma né la corregge" — i.e., the game does NOT assert this is objectively true, only that Laura believes/says it.

### Audrey
- Architettura Causale.md:283: "salvata (o no: l'arco resta laterale ma il suo esito è letto [P])"

### Nano/Gigante and BOB (entity-level knowledge)
- Bible.md:202: "il Nano parla nel registro del metodo del player" — regola pubblica [L]: "1° enunciato verificabile all'apparizione"

---

## C. RELATIONSHIP STATEMENTS

From Bible.md §9 "Rete delle relazioni" (Bible.md:205-217, table, columns: Coppia/Stato iniziale/Tensione extra-caso/Fiducia-debito/Info asimmetrica/Svolta/Stato finale/Scelte che la modificano):

| Coppia | Stato iniziale | Tensione extra-caso | Svolta | Stato finale |
|---|---|---|---|---|
| Cooper–Truman | ospite/ospitante | metodo federale vs protezione locale | la penna posata | segnata da S3 |
| Cooper–Leland | investigatore/notabile in lutto | l'empatia estesa al carnefice | l'affioramento | la pietà senza assoluzione |
| Cooper–Sarah | agente/testimone non creduta | il credito dell'inascoltata | il lago | lei non chiede |
| Cooper–Audrey | agente/alleata non richiesta | contare vs proteggere | OEJ | letta da Truman |
| Truman–Leland | vent'anni di amicizia | l'arresto dell'amico | la convocazione | la branda rifatta |
| Sarah–Maddy | zia/nipote-àncora | Maddy vuole partire | la scelta di restare | il lutto doppio |
| James–Donna | il lutto conteso | chi ha diritto al segreto | la consegna | il lutto sporco di prova |
| Laura–le sue versioni | (postuma) | ogni persona ne ha una diversa | il caso le mette in fila | nessuna versione vince [L] |

Additional relationship notes:
- Architettura Causale.md:288 "Rete dei conflitti": "Cooper–Truman: metodo federale vs protezione locale (S2 la modula). Truman–Leland: vent'anni di amicizia vs il mandato. Cooper–Sarah: il testimone attendibile che nessun verbale accetta. Audrey–Ben: contare per il padre. James–Donna: il lutto conteso. Log Lady–paese: la credibilità dell'inascoltata. Cooper–Leland: l'empatia estesa al carnefice (il conflitto più caro al tema)."
- Bible.md:190/280: Truman–paese: "AGENTE / che il paese resti suo"; Truman "vuole sbagliarsi su Leland"
- Grammatica.md:249 (Maddy scheda): "rapporto specifico: per Sarah è un'àncora, per Leland uno specchio insopportabile"
- scene-contracts.md S6: Jacques–Cooper table dynamic: "Jacques: self_image = the house always wins... exit_cost = to leave the table he must leave the room (arrest)."
- act-3-design-report.md §7: Hawk–Cooper: "partner on the same line of prints, not a guide; uses 'tu'."
- act-3-design-report.md §11 (Truman voice): "To Cooper now: partner who signs what he disagrees with."
- act-3-design-report.md §11 (Jacques voice): "To Cooper: another player at his table."
- act-3-design-report.md §11 (Audrey voice): "To Cooper: an equal running her own operation; last word hers."

---

## D. ADAPTATION / CANON MARKERS

| Quote | Source |
|---|---|
| "Fonti**: repo... i tre documenti di design con le loro revisioni vincolanti; i quattro verbali d'esame; le decisioni umane registrate" — authority hierarchy: "(1) decisioni esplicite dell'autore umano; (2) fatti del repository; (3) canone della serie adottato; (4) adattamenti già approvati; (5) nuove proposte; (6) interpretazioni." | Bible.md:37,39 |
| Conflict resolution #1: sogno — "la matrice dava a Cooper 'non può sapere' il volto. DECISO [L]: player e Cooper vedono e RICORDANO entrambi il volto... solo il nome sussurrato è perduto" | Bible.md:42 |
| Conflict #2: "P8 lettere — Architettura Causale la trattava come deduzione; l'esame l'ha bocciata. DECISO [L]: esiste una riga del diario che stabilisce la regola seriale" | Bible.md:43 |
| Conflict #3: "'Colpa condivisa' M8 (Architettura) vs 'impotenza' (esame). DECISO [L]: impotenza; leve solo sulla distribuzione dei costi." | Bible.md:44 |
| Conflict #6: "Conteggio mappe — '10' era errore: sono **11** [P]" | Bible.md:47 |
| "Questioni ancora aperte: S2, terzo metodo M10, epilogo esteso, momento ordinario di Maddy (posizione), budget finale di scrittura." | Bible.md:49 |
| Canon lock §2: "**Canone coperto**: l'arco Laura Palmer fino alla morte di Leland + Loggia [P]; contenuti esclusi [L]: tutto il post-arco (25 anni dopo giocati), FWWM, sottotrame della serie senza funzione qui (Josie, la segheria come intrigo, Windom Earle)." | Bible.md:62 |
| "Cooper come *authored protagonist* [P — Role Contract]: fissi motivazione, voce (Diane), valori... espressivi: ordine, opzionale, ritmo, riletture, metodo d'interrogatorio, gestione delle prove, 4 stance [L]." | Bible.md:63 |
| "'Questo gioco non è…': un sandbox, un whodunit a finali multipli, un horror a jumpscare, un quiz di indizi, una riproduzione scena-per-scena della serie." | Bible.md:71 |
| Sogno decision, explicit canon-vs-project comparison table (versione A "fedele" scelta vs versione B "Leland riconoscibile") with rationale: "SCELTA: Versione A, nella forma fedele alla serie" | Grammatica.md:47-59 |
| "**Fatto di canone [C]**: nella serie il pubblico NON sente il nome sussurrato... però VEDE il volto di BOB... fin dalle prime visioni (Sarah)." | Grammatica.md:43 |
| Laura's line "Ti rivedrò fra venticinque anni" explicitly tagged [C] (series canon quote reused) | Loggia.md:109, M9-M10.md (Bible.md:271 also tags it [C]) |
| Vault reference for future migration: "Sources of existing truth to migrate here (later): vault `Bible - Twin Peaks Game.md`, `Grammatica Indagine - Twin Peaks Game.md`, `M5-M6 v1.1.1 LOCK.md` and the Act 2/3 ledgers. Migration is inventory + tagging, never rewriting the mystery." | repo docs/story/README.md (system context, not separately re-fetched) |
| "Nessun sistema è lore inerte" / "Nessuna transizione 'perché nella serie succede': ognuna è classificata sopra." | Bible.md:86, 234 |
| doctrine-audit.md: "Doctrine source: `docs/narrative-craft-bible-v0.1.md`... It is authoring/review doctrine, not canon, not a runtime spec." | doctrine-audit.md:3 |
| R7 model explicitly framed as departure from a simpler "canon" reading: "Modello precedente: 'esiste un colpevole unitario che il fascicolo può contenere'. Nuovo modello: gli atti sono di Leland; la confessione manifesta una discontinuità che il gioco non sa (e rifiuta di) quantificare." | Grammatica.md:227 |
| "mai detto" / never-stated markers: Laura's protected interpretation ("LUI sì") is "protetta: il sistema non la conferma né la corregge"; the cipher pages "NON si decifrano mai del tutto" (Bible.md:191 non-scrivere list); "la natura di BOB" listed as permanently "irrisolto" (Grammatica.md:227) | Loggia.md:106; Bible.md:191; Grammatica.md:227 |
| BOB's question to Cooper receives no system answer: "La domanda di BOB non riceve risposta del gioco." | Loggia.md:240 (per earlier Bible §13 read) |
| Deliberately unrepaired items (Act 3 doctrine audit): "the reactive timing of Jacques's death (Bible-declared), Audrey's thinness..., the Giant's text (frozen)." | doctrine-audit.md §14 closing line |

---

## E. CONFLICTS (same event/knowledge described differently by two sources)

1. **Sarah "sapeva" vs "mai sapeva".** Bible.md:194 (Character Bible, Sarah row): "nell'epilogo non chiede 'chi è stato' — aveva SOSPETTATO la casa **[L: mai 'sapeva']**" (explicit [L]-locked guard against the word "sapeva"). But Grammatica.md §13 (Grammatica.md:251, Sarah scheda): "payoff: in T4/epilogo è l'unica che NON chiede a Cooper 'chi è stato' — **sapeva**." These two design documents use opposite verbs for the same fact (Sarah's epilogue non-question) — Bible.md explicitly forbids "sapeva," Grammatica.md uses it.

2. **Ronette's grido as P4 support strength.** Bible.md:104 (evidence T1 row) lists T1 ronette_bob as supporting P4 only "min" (minimum support) and notes reading alternative "il LEGAME BOB-fuoco (senza ponte) [L]" is NOT automatic. Grammatica.md:93 (indizio 5, poesia_fuoco) cross-references the same link as requiring a bridge/ponte. Both agree the bond is not automatic, but Bible.md frames confirmation timing as "M10" (Bible.md:115, P4 row) while Grammatica.md's P4 entry (Grammatica.md:107) states confirmation "Da: M4" for the *proposition's formulation* (not confirmation) — i.e. the two documents place P4's origin at different missions unless "Da" (M4) is read strictly as "where formulable" versus Bible's "Confermata quando" (M10) as final confirmation. Flagged as a possible terminology mismatch rather than a hard contradiction; both docs are cited since neither reconciles the other.

3. **M5 theory-offering gate ("disposizione").** The frozen fact-knowledge-ledger (row 1, row 2) documents this AS a violation in the pre-repair state: "**Violation today: comparison is optional... so the report's own theory prompt can be answered 'disposizione' without it**" and "**Violation today: `m5_theory_initial` fires at `groups_completed:2`, i.e. can fire before the ring comparison**." The doctrine-audit.md (§5, F1; §14 R1) treats the same fact as a "FAIL" requiring repair R1, and the ledger's own "Frozen corrections" section (fact-knowledge-ledger.md, "Frozen corrections" block) states it as "resolved by R1." So two states of the same fact exist side by side in the same file: the violation record (pre-repair, "today") and the frozen correction (post-repair) — both are quoted above since the source itself preserves both for audit purposes, not reconciled into a single state.

4. **`east_route_confirmed` writer.** fact-knowledge-ledger row 4 states as a live violation: "**Violation today: `east_route_confirmed`... is committed by a door-side line (`m5_report_close`), not by visiting the north cut**." doctrine-audit.md O3 and act-3-design-report.md §12 (row A14) both describe the *fix* ("sole writer, moved from the report close") as the design decision, i.e. two different states of the same flag-writer fact appear across sibling documents — pre-repair (ledger's "today") vs. post-repair (report's final beat map, doctrine-audit's O-list).

5. **Truman's belief expressed vs. withheld ("I believe you").** scene-contracts.md S12 states: "Truman... withholds 'I believe you' (the classic version said it; the mission version rightly does not)" and separately "Unsaid: Truman *does* believe him." This is an internal statement (not a cross-source conflict) that the design explicitly narrates a canon/series difference: the classic (M6 v1.0 or series-adjacent) version had Truman voice belief aloud; the current v1.1/M6 mission version withholds it while still intending it as true — logged here as a self-declared adaptation delta within a single document (Difference marker, category D) rather than a true inter-source factual conflict.
