---
type: project
project: Twin Peaks Game
created: 2026-07-22
status: draft
---

# Produzione narrativa 3 — M8 "Sta accadendo di nuovo"

**M5-M6 v1.1.1 applicato; Script Lock confermato. Produzione M8 iniziata.** Fonti: Bible v0.9.1, M4 v1.1.1, M5-M6 v1.1.1. Le tre testimonianze di M6 sono [N→L] (delega registrata). Sezione §9 = UNICA sorgente testuale.

==================================================
## 0. Manifesto delle dipendenze
==================================================

✅ Jacques morto; la risorsa del ramo giocato persa; le info acquisite sopravvivono; P9 formulata/non confermata; il Gigante orienta (regola: torna quando una predizione matura — causa non circolare, stabilita in M7); 2° enunciato: "sta accadendo di nuovo"; il player non sa chi/quando/dove; Maddy muore comunque; **Sarah non trova il corpo**; la lettera O si acquisisce in ogni percorso (catena variabile); nessun flag `maddy_salvabile` esiste o esisterà.
**Conflitto dichiarato (1)**: la sequenza [P] mette l'enunciato del Gigante AL Roadhouse (gigante2_dlg) — quindi nessun "avvertimento pre-Roadhouse" è possibile: la leva-avvertimento vive DOPO l'enunciato, al telefono del Roadhouse. La scena ordinaria di Maddy e la promessa (leve relazionali) stanno PRIMA, nel pomeriggio, senza alcuna conoscenza della minaccia — coerente con la mappa della conoscenza.

==================================================
## 1. Contratto della tragedia fissa
==================================================

**FISSO**: la morte di Maddy; l'autore (Leland/BOB — verità autoriale, mai scritta a sistema); il luogo del ritrovamento (il lago [P: lago_maddy, town 15,28]); la lettera O; il passaggio all'Atto 5.
**VARIABILE** (per ogni leva: info disponibile / intenzione / azione visibile / conseguenza / cosa non poteva sapere):
- `warning_target: palmer|centrale|nessuno` — dopo l'enunciato, al telefono. Info: "di nuovo" + il pattern (una ragazza vicina a Laura, o la casa). Non poteva sapere: che il fatto è GIÀ in corso.
- `maddy_action_after_warning` — se chiami casa Palmer risponde MADDY: decide di partire domattina e prepara la valigia, lascia un biglietto per Sarah («Torno lunedì. Non svegliarla.») — l'azione è SUA, visibile dopo; il gioco non collega mai la telefonata al percorso della morte.
- `sarah_support_state` — se chiami la centrale, Truman manda il vice a casa Palmer: Sarah non è sola quando la notizia arriva.
- `focus_destination: palmer|lago|diner` — geografia REALE di town (dal Roadhouse 47,28: il diner 42,20 è vicino; casa Palmer 42,6 è lontana a nord; il lago 15,28 è lontano a ovest). Costi temporali diversi, dichiarati dallo spazio, non da un countdown.
- `arrival_order` / `body_found_by: cooper|hawk|vice` (MAI Sarah).
- `letter_o_chain: in_situ|handed` — Cooper primo al lago = documentata sul posto (più forte in M9); altri primi = consegnata.
- `promise_stance: accompagno|autonomia|prudenza` + `promise_echo` (la riga torna, identica, nel monologo del lago).

==================================================
## 2. Maddy prima della tragedia (scena ordinaria autonoma)
==================================================

Sta nel gioco anche se Maddy non morisse. Vuole: TORNARE A CASA SUA (Missoula: lavoro che l'aspetta). Scelta pratica: gli orari della corriera. Rapporto con Sarah: è rimasta UN giorno in più per lei — sua scelta, già canone. Nessun indizio; nessun presagio.

==================================================
## 3. Mappa della conoscenza
==================================================

| Fatto | Player | Cooper | Truman | Sarah | Maddy | Leland/BOB | Sistema |
|---|---|---|---|---|---|---|---|
| "qualcosa si ripeterà" | S (enunciato 2) | S | ~ (riferito) | ~ (lo sente) | X | S | S |
| "una ragazza vicina a Laura è in pericolo" | ~ (inferenza ragionevole) | ~ | X | ~ | X | S | S |
| "Maddy è il bersaglio" | **X** | **X** | X | X | X | S | S |
| "la casa Palmer è coinvolta" | ~ (P7 in formazione) | ~ | ! ("il dolore") | ~ (la teme) | X | S | S |
| "Leland è responsabile" | X | X | X | X | X | S | S |
Nessuna leva presuppone conoscenza che player e Cooper non hanno: le opzioni parlano di "casa Palmer" e "la centrale", mai di "salvare Maddy".

==================================================
## 4. Suspense (tre livelli)
==================================================

1. *Minaccia generica*: l'enunciato. 2. *Restrizione ragionevole*: il pattern rende plausibili una ragazza vicina a Laura (Donna? Maddy? Ronette di nuovo?) O la casa — DUE teorie ragionevoli restano aperte; il segnale ambiguo: la valigia di Maddy (partenza = salvezza? o esposizione?). 3. *Comprensione tardiva*: solo al lago i dati convergono. Retro-significato: l'orario della corriera sul tovagliolo (da promemoria a ultima cosa scritta da viva). Anti-puzzle: nessuna opzione nomina Maddy come bersaglio; nessun testo post-evento rilegge le scelte come errori; le domande aperte del playtest (§13) verificano che il player NON creda a un salvataggio mancato.

==================================================
## 5-7. Le tre leve (progettazione)
==================================================

**L3 — la promessa (pomeriggio, diner)**: · *«Lunedì ti accompagno io alla corriera.»* (protezione pratica) · *«Missoula ti aspetta. Vai.»* (autonomia) · *«Chiama quando arrivi. Sempre.»* (prudenza). Risposta locale diversa (sotto); eco: la riga torna nel monologo del lago; nessuna promette sopravvivenza; nessuna è "giusta".
**L1 — il telefono (Roadhouse, dopo l'enunciato)**: · *casa Palmer* (risponde Maddy → la sua azione autonoma: §1) · *la centrale* (vice da Sarah) · *nessuna chiamata* ("il telefono è occupato dal juke-box dei presenti" — no: opzione esplicita "corri e basta", coerente col ruolo). Ogni opzione: risposta immediata + stato + eco post-morte.
**L2 — dove correre**: · *casa Palmer* (lontana; trovi la casa — con o senza valigia/biglietto secondo L1 — e Sarah; il corpo lo trova Hawk al lago) · *il lago* (lontano, direzione opposta; Cooper PRIMO: la scena intatta, la O in situ) · *il diner* (vicino; Norma: «Maddy? Passata verso la fermata del lago, un'ora fa» → arrivi SECONDO: il vice ha già la zona) — informata ma incompleta; il fatto fisso non si evita da nessuna strada.

==================================================
## 8. Opposizione indipendente
==================================================

Timeline di Leland/BOB (autoriale): informazione — sa della partenza imminente (vive nella stessa casa); accesso — la strada fra casa e la fermata del lago; opportunità — la sera del Roadhouse (il paese è al locale); obiettivo — la ripetizione; azione — all'ora T, fissa nel mondo, PRIMA che qualunque leva del player possa toccarla (l'enunciato del Gigante arriva quando T è già in corso: il canale AVVERTE, non anticipa); traccia — la lettera O; limite — non è ovunque: non sa delle telefonate, non reagisce al player. Il player raggiunge punti diversi del DOPO, mai il prima.

==================================================
## 9. Script completo (sorgente unica)
==================================================

### A — Il pomeriggio (diner) — 12 pagine
> (Maddy al bancone, un tovagliolo pieno di numeri. Norma le riempie la tazza senza chiedere.)
> MADDY: La corriera delle 7:40 coincide a Spokane. Quella delle 11 no — ma parte a orario.
> COOPER: Torna a casa, signorina Ferguson?
> MADDY: Torno al mio centralino. In biblioteca tengono il posto fino a lunedì — l'ho fatto promettere per iscritto.
> (Un avventore la saluta: "Ciao, Laura". Maddy non si volta subito.)
> MADDY: (senza acidità) Maddy. Con due D. Laura era mia cugina — io sono quella che porta gli occhiali nelle foto.
> MADDY: Sono rimasta un giorno in più per zia Sarah. Uno. Poi Missoula si riprende il suo centralino.
> **[SCELTA — la promessa]** · *«Lunedì ti accompagno io alla corriera.»* · *«Missoula ti aspetta. Vai.»* · *«Chiama quando arrivi. Sempre.»*
> [accompagno] MADDY: (sorride) Alle 7:10, agente. Io i federali li faccio aspettare al massimo cinque minuti.
> [autonomia] MADDY: (annuisce, piano) È la prima persona in questa città che me lo dice senza un "ma".
> [prudenza] MADDY: (ride) Lei parla come il mio centralino. Va bene: chiamerò. Sempre.
> → *promise_stance registrata* · *(nessuna voce di taccuino: questa scena non appartiene al fascicolo)*

### B — Il Roadhouse (sera) — 10 pagine
> (La banda suona. Il paese c'è tutto: birre, risate basse, il microfono che fischia una volta.)
> TRUMAN: Il tuo Gigante ha scelto il posto più rumoroso del paese per farsi sentire. Vediamo se arriva.
> (La musica non si ferma. Ma per Cooper la sala rallenta — solo per lui.)
> GIGANTE: Sta accadendo di nuovo.
> GIGANTE: (indica nulla, guarda Cooper) Sta accadendo di nuovo. E tu non puoi essere in due posti.
> (La sala riprende il suo tempo. Nessuno ha visto niente.)
> → *presagio 2: verificato nel modo peggiore — in corso.* → *obiettivo: Il telefono del Roadhouse. Poi scegli dove andare.*
> **[SCELTA — il telefono]** · *chiama casa Palmer* · *chiama la centrale* · *corri e basta*
> [Palmer] MADDY: (voce assonnata) Casa Palmer... agente? No, zia Sarah dorme. Io... senta, io parto domattina. Con la prima. Glielo dica lei a Truman, io lascio un biglietto per la zia. → *warning_target: palmer; maddy_action: partenza anticipata, valigia, biglietto*
> [centrale] LUCY: Glielo passo— no, è di pattuglia. Mando Andy a casa Palmer, agente. Ci mette dieci minuti. → *warning_target: centrale; sarah_support: vice presente*
> [corro] (Il telefono resta sulla forcella. La porta del Roadhouse è già alle spalle.) → *warning_target: nessuno*

### C — La corsa — 8 pagine
> **[SCELTA — dove?]** · *casa Palmer (a nord, lontana)* · *il lago (a ovest, lontano)* · *il Double R (vicino)*
> (La stessa town di ogni giorno. Stanotte le strade sono solo distanza.)
> [Palmer] (La casa: buio al piano di sopra. [se L1=Palmer] Sulla porta, un biglietto: "Torno lunedì. Non svegliarla." La valigia è pronta in ingresso. Di Maddy, nessuna traccia.) (Il telefono della casa squilla: è Hawk.) HAWK: (voce piatta) Cooper. Il lago. Vieni al lago.
> [lago] (L'acqua è ferma. Sulla riva, una forma che l'acqua non reclama. Cooper arriva per primo.)
> [diner] NORMA: Maddy? Passata un'ora fa — verso la fermata del lago, con la borsa piccola. (Il tempo di uscire: la radio di Hawk gracchia il nome del lago.)
> → *focus_destination registrata; body_found_by: cooper (lago) / hawk (palmer, diner)*

### D — Il ritrovamento (due versioni) — 10 pagine
**D1 — Cooper primo (lago):**
> (La riva. Maddy. Cooper si ferma a tre passi — i tre passi del mestiere.)
> COOPER: (fermo) Signorina Ferguson. Maddy. Con due D.
> (Si china senza toccare. Sotto l'unghia dell'anulare: un segno.)
> → *evidenza lettera_o: una O, incisa. Stessa mano della R.* → *letter_o_chain: in_situ — fotografata sul posto, catena integra.*
> (Arrivano le torce di Hawk e del vice. Cooper non si è mosso di un passo.)
**D2 — un altro primo (Hawk/vice):**
> (Quando Cooper arriva, il perimetro è già segnato. Hawk gli va incontro, si toglie il cappello.)
> HAWK: L'ho trovata io. Non l'ho mossa. C'è una cosa che devi vedere tu — io non la tocco.
> → *evidenza lettera_o: una O, incisa, sotto l'unghia.* → *letter_o_chain: handed — repertata dal primo arrivato, catena annotata.*
**Comune (monologo, con l'eco della promessa):**
> COOPER: (a bassa voce) Diane. Non registro. [accompagno] Le avevo detto: lunedì l'accompagno io. Era l'unica promessa che potevo mantenere, e il lunedì non è arrivato. [autonomia] Le avevo detto: Missoula ti aspetta. Missoula aspetterà per sempre. [prudenza] Le avevo detto: chiama quando arrivi. Il telefono non suonerà.
> COOPER: Ho deciso dove guardare, stanotte. Non ho deciso questo. Nessuno me l'aveva dato da decidere.
> → *flag: maddy_trovata [P]* · *(nessun testo, qui o altrove, valuta le scelte della notte)*

### E — Le lettere e il diario — 6 pagine
> *(taccuino — Confronta: lettera_o ↔ lettera_r)* → *nota: due lettere, stessa mano. Un ordine: prima la R, poi la O.*
> *(Confronta: le lettere ↔ il diario — la pagina cifrata [P, riletta])*
> DIARIO DI LAURA: «Ha un nome da persona perbene. Dice che me lo darà un pezzo alla volta — come si danno le cose che non si possono ridare indietro.»
> **Che cosa puoi formulare?**
> · **A. Le lettere seguono una firma progressiva che il diario aveva annunciato.** ✔ → **P8 formulata** *(teoria: resta ignoto se la firma sia dell'assassino, di "lui", o una messinscena)*
> · B. R+O compongono un nome. → «Due lettere non compongono niente. Un ordine e una promessa, forse.»
> · C. Il diario accusa qualcuno di casa. → «Il diario nomina "lui". Non dice chi, né dove abita.»

### F — La stazione, l'uscita — 5 pagine
> (La centrale, prima dell'alba. [se sarah_support: vice] TRUMAN: Andy è rimasto con Sarah. Non ha aperto bocca, e va bene così. [altrimenti] TRUMAN: Sarah l'ha saputo dal silenzio della casa. Ci vado io, dopo.)
> TRUMAN: Dimmi che cosa abbiamo, oltre a quello che abbiamo perso.
> COOPER: Una firma che procede, Harry. E un diario che l'aveva sentita promettere.
> → *obiettivo: Porta a Truman una contraddizione che regga.* *(→ M9)*
**Repeat**: (Il lago è recintato. L'acqua è ferma come prima: è il prima che non torna.)

==================================================
## 10. P7/P8 e passaggio a M9
==================================================

La O prova: la serialità della mano (con R + ordine). NON prova: chi. La regola del diario [frase ora canonica, scritta in §9-E: nasce dalla relazione, non è un tutorial, "lui" resta senza volto, la messinscena resta possibile]. P7 (la casa) resta ipotesi alimentata da: la vittima OSPITE di casa Palmer + T3 — mai procedurale. Parte procedurale per M9: SOLO P6 (Missoula) + accesso/opportunità. Obiettivo concreto generato: la contraddizione.

==================================================
## 11. Responsabilità (per leva)
==================================================

| Leva | Causal influence | Professional resp. | Impotence | Perceived guilt (testo di Cooper) | Actual guilt | Consequence ownership |
|---|---|---|---|---|---|---|
| telefono | zero sull'evento | di Cooper, narrata | sì | «non posso essere in due posti» | nessuna | chi era informato/presente |
| corsa | zero sull'evento | — | sì | il monologo | nessuna | chi trova, catena della O |
| promessa | zero | — | — | l'eco | nessuna | il tono del lutto |
**Riga canonica**: *Il player ha deciso dove concentrare un'attenzione insufficiente; non ha deciso se Maddy sarebbe morta.* Nessun testo certifica che una scelta diversa avrebbe salvato; nessun testo chiama errore il Roadhouse (il gioco ce l'ha mandato).

==================================================
## 12. Personaggi, luoghi, suono
==================================================

**Maddy**: obiettivo: partire; tattica: l'ironia gentile ("con due D"); azione indipendente: il giorno in più, la valigia; gesto che resta suo: il tovagliolo con gli orari; da non scrivere: presagi, paura, "sono come Laura". **Sarah**: testimone precoce, MAI oracolo (dorme; il suo sapere resta il volto già visto); da non scrivere: urla in scena. **Truman**: agisce coi vice e la procedura; il suo lutto è logistico (chi va, chi resta). **Cooper**: protagonista non onnipotente; il monologo porta la colpa PERCEPITA, il testo non la conferma.
**Sensoriale (1+1+1)**: diner — il tovagliolo degli orari (risemantizzato), il percolatore, il pranzo che continua; Roadhouse — il microfono che fischia UNA volta, la banda che NON si ferma (l'enunciato è solo per Cooper), il paese che resta; strade — i passi soli, nessuna musica, la stessa geometria con un altro significato; lago — l'acqua ferma, la recinzione dopo, il silenzio non commentato; Palmer — la valigia in ingresso (solo se L1); stazione — il centralino muto a quell'ora. Niente meteo sincronizzato, niente luce rossa, niente oggetto infantile.

==================================================
## 13. Contratto dati, scope, test
==================================================

**Dati**: `promise_stance`, `warning_target`, `maddy_action_after_warning`, `sarah_support_state`, `focus_destination`, `body_found_by`, `letter_o_chain`, `promise_echo` (deriva da stance), P8 multistato (formulation created_from: [lettera_r, lettera_o, ordine, diario_pagina]), P7 invariata (ipotesi), `maddy_trovata` [P]. Moduli, non prodotto cartesiano: la scena D è 2 versioni + 3 eco-promessa (moduli indipendenti); C è 3 moduli; B-telefono 3.
**Scope**: A 12 + B 10 + C 8 + D 10 + E 6 + F 5 = **51 pagine** (di cui 14 azione); nodi nuovi: 11; label: 3+3+3+3 (E) = 12; voci taccuino: 6; moduli combinabili scritti: 3(L1)×1 + 3(L2) + 2(D) + 3(eco) = 11 moduli (mai 3×3×2×3=54 testi: la modularità regge per costruzione). Minima: L1 a 2 opzioni (senza "corri e basta"); raccomandata: come sopra; primi tagli: la variante D2-vice (resta D2-Hawk) — MAI la scena A di Maddy.
**Test (18)**: 3 promesse × eco corretta; 3 telefonate × conseguenza (valigia/biglietto SOLO se L1=palmer; vice SOLO se centrale); 3 corse × chi trova (mai Sarah); catena O in_situ SOLO se Cooper primo; P8 solo dal doppio confronto; B/C respinte nel merito; nessun percorso salva Maddy (asserzione sull'assenza del flag); nessun testo contiene "avresti/avrebbe potuto salvarla"; la scena A presente in ogni percorso; M9 raggiungibile da tutti gli stati; nessun softlock; conteggi rigenerabili.
**Comprensione (aperte prima)**: «Che cosa pensavi stesse per accadere?» → «Che cosa hai tentato di cambiare?» → «Che cosa hai effettivamente cambiato?» → «Perché Maddy è morta?» → «Che cosa appartenevaa Maddy, non a Laura?» → «Di che cosa ti senti responsabile?» → solo dopo: «Pensavi che fosse possibile salvarla?» (soglia: >80% risponde no).

==================================================
## 14. Auto-edit (identificato → applicato in §9)
==================================================

1-5 *Falsa colpa (bozza)*: «se fossi arrivato prima» nel monologo → tagliata; «la strada sbagliata» in C → «solo distanza»; «troppo tardi» in D1 → tagliata; obiettivo-bozza "raggiungi Maddy" → "scegli dove andare"; Truman-bozza «dovevi chiamare prima» → mai esistito nel finale, sostituito da «quello che abbiamo perso» impersonale. ✎
6-8 *Maddy-doppio-di-Laura*: la bozza apriva con lei al juke-box "come faceva Laura" → tagliato; "gli stessi occhi" → mai; l'avventore che la chiama Laura RESTA (una volta) perché lei lo CORREGGE — il momento è suo. ✎
9-10 *Azioni attribuite al player ma causate dal sistema*: la bozza scriveva «la tua chiamata l'ha spinta a partire» → ELIMINATA (l'azione di Maddy è una decisione sua, il testo non la collega al percorso); «hai mandato Andy» → «Lucy manda Andy». ✎
11-12 *Oltre il supporto*: «le lettere compongono un nome» come opzione valida → è la B, respinta; «la firma è dell'assassino» → «resta ignoto se…». ✎
13-14 *Sarah onnisciente*: bozza «Sarah sapeva» → dorme; la sua visione NON viene citata in M8. ✎
15 *Gigante che risolve*: bozza «guarda verso il lago» → «indica nulla». ✎
16 *Simbolo in eccesso*: la tazza di Maddy lavata da Norma → tagliata (il tovagliolo basta). ✎
17 *Sofferenza senza funzione*: la variante Sarah-al-telefono-durante → mai scritta (vincolo). ✎
18 *Modulo tagliato*: D2-vice fuso in D2-Hawk. ✎

**Domanda centrale — risposta del pacchetto**: il player può dire che cosa ha cambiato (chi sapeva, chi c'era, che cosa si è preservato, quale promessa resta inevasa) senza credere di aver potuto salvarla — e ricorda Maddy per il tovagliolo con gli orari e il "con due D", non per il lago.
