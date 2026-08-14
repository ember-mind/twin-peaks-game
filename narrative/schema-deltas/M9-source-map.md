# M9 — Source map (nodo → sezione del Lock) e dichiarazioni di provenienza

Autorità canonica: **M9-M10 v1.1.1 — CONFESSION LOCK** (file
`M9-M10 v1.1 (confession lock).md`), **§3 = unica sorgente testuale di M9**; §1 gli
atomi di P6, §2 il contratto, §7 scope/test.
**Autorità condivisa corrente: World & Story Bible v1.0.md.**
Nota storica: il pacchetto **«M9-M10 - Convocazione e Interrogatorio (pacchetti).md»
(v1.0)** vale solo come provenienza storica, **non** come autorità corrente: la sua
P6 («trasferta a Missoula», `D_REGISTRO`, il registro sul bancone) è stata
RICOSTRUITA dal Lock §0 sul beat fisico M8 `m8_leland_taxi`. Ogni testo di
pagina di M9 è trascritto dal §3. I conteggi autorevoli sono STAMPATI da
`test/narrative-validate-m9.js` a ogni run.

## Mappa nodi (4)

| Nodo | Sezione Lock | Pagine (rese) | map_id (motore) | Note |
|---|---|---|---|---|
| m9_verifica_taxi | M9-B1 | 3 | `sheriff` (attore `lucy`) | richiamo del taccuino + richiesta a Lucy; richiede `T_LELAND_TAXI`, scrive `D_TAXI`; guardia `not evidence D_TAXI` |
| m9_cmp_taxi | M9-B1 | 2 (+recall) | — (canale `notebook`) | confronto senza scelte, `node_commit`; **unico writer di P6** |
| m9_present_truman | M9-B2 | 3 di nodo (2 condizionali) + rami | `sheriff` (attore `truman`) | presentazione con **allegato manuale**; eco M8 (O / Sarah / valigia); scrive `atto5`; `repeat` |
| m9_arrivo | M9-B3 | 6 (+repeat) | `sheriff` (attore `leland`) | arrivo volontario; nessuna guardia `not node_done` (il repeat resta raggiungibile) |

`map_id` usato: **`sheriff`**, mappa reale di `js/maps.js`. Gli attori
sono NPC reali di `js/glue.js`. Nessun landmark inventato, nessuna coordinata nei
dati, **nessun `goto`**: ogni passaggio viene camminato.

## Conteggi pagine: riconciliazione col §7 del Lock (dichiarata, non pareggiata)

Il §7 dichiara **M9 = 27 pagine** (B1 7 + B2 12 + B3 8). La proposta trascrive le
righe-pagina del §3 senza inventare pagine per pareggiare i numeri (dottrina
M5/M6/M8). Il conteggio TOTALE reso è **stampato dal validatore**; la riconciliazione
per beat:

- **B1**: §7=7; §3-B1 = 1 riga di taccuino + 1 domanda di Cooper + 1 risposta di Lucy
  (3 pagine nel nodo mondo) + prompt di confronto + nota (2 pagine nel nodo taccuino).
  Le righe *«→ evidenza D_TAXI…»* e *«[FORMULA] P6 formulata»* sono **righe-effetto**,
  non pagine.
- **B2**: §7=12; il §3 rende 1 riga d'apertura di Truman + il prompt [PRESENTA] + 6
  righe del ramo accettato + i tre esiti di rifiuto («Risposte integrate»: NO_CORROBORATION,
  VALID_BUT_NOT_PROCEDURAL, la visione, ALREADY_REJECTED). La proposta aggiunge le
  **pagine condizionali** dell'eco M8, che il §7 conta come varianti.
- **B3**: §7=8; il §3-B3 rende 6 righe-pagina + il `repeat`. Le righe *«→ leland_arrival…»*
  del pacchetto v1.0 non esistono nel Lock e non sono pagine.

**Interpretazione adottata**: il §7 include righe-effetto/obiettivo e tutte le varianti
dei beat a diramazione; la proposta rende le sole righe-pagina e non fabbrica pagine.
**[L — nessuna pagina artificiale].**

## Conteggio nodi: 4

Segmentazione: la testimonianza B0 vive in M8, prima del ritrovamento. B1 è
SPEZZATO in due nodi (mondo + taccuino) perché la verifica e il
confronto sono due atti distinti del player su due canali diversi — motivazione di
source-map, ammessa dal contratto (stesso schema del beat C di M8, spezzato in 4).
`node_count.runtime_total = 4 == nodes.length` (verificato dal validatore).

## Dichiarazioni [N] / [OPEN]

1. **Entrata `{ all: [flag atto4, node_done m8_station, evidence T_LELAND_TAXI] }`** — **[N]**. Il Lock §2 dà
   la causa («il taccuino dopo il lago») ma non un gate di repository. Scelta: la
   consegna di M8 (`M8.completion.when`) + il flag d'atto reale. **NON `atto5`**:
   `atto5` è scritto dalla battuta classica `truman_atto5` su `truman@sheriff`, target
   che il layer narrativo occupa (latest-first) finché M8 è entrata — sarebbe un gate
   che può non accendersi mai. **[OPEN per il tutor]**: se si preferisce un gate di
   solo repository, va prima spostata la scrittura di `atto5`.
2. **`atto5` scritto dalla presentazione accettata** — **[N]**, unico writer. Rende
   VERO il mondo classico nel momento giusto: `leland@sheriff` acceso, `leland@palmer`
   spento (`js/glue.js`), obiettivo classico «Interroga Leland Palmer alla centrale»
   (`js/data.js`). `atto5` è già in `booleans_allowed`.
3. **`T_LELAND_TAXI` scritto da `m8_leland_taxi`** — **[N→L]** production-safe.
   Il player ascolta fisicamente la frase al diner dopo la promessa a Maddy e
   prima del Roadhouse/scelta strada/ritrovamento. M9 legge la testimonianza e non la crea mai
   retroattivamente; il support_min di P6 resta raggiungibile.
4. **`T_SARAH_VISIONE` come `carryover_evidence`** — **[N]** costrutto generico
   (schema-delta §3), da implementare in C9-B/C9-C. Nasce nel layer classico
   (`sarah_visione`, casa Palmer, Atto 4) solo dopo il flag diegetico
   `sarah_visione_ascoltata`; **mai in un `support_min`**; fail-safe (se
   il costrutto non c'è, la voce non compare e nulla si blocca). Il Lock §3 è sorgente
   unica e non contiene una scena di Sarah: **inventarne una sarebbe stato peggio**.
5. **Allegato MANUALE + `by_support`** — **[N]** costrutto (schema-delta §2), da
   implementare in C9-B. Il Lock impone «qui sbagliare conta»: senza questo, sbagliare
   è impossibile.
6. **Pagine di ramo assemblate** (`presentation_branch_assembly`) — **[N]** costrutto
   (schema-delta §2b): oggi `condition`/`pages_by_value` non hanno effetto dentro una
   presentazione, e le eco Sarah/valigia vivono nel ramo accettato.
7. **Obiettivi non canonici [N]**. Il Lock verbalizza come [L] solo:
   - **obj_m9_3** «Porta a Truman una contraddizione che regga.» (§2, obiettivo della
     missione — testo identico a `obj_m8_4`, che M8 consegna post-stazione);
   - **obj_m9_4** «Leland Palmer è alla centrale. Decidete come parlargli.» (§3-B2).
   Derivati dichiarati:
   - **obj_m9_1** (priority 100, ingresso): «Chiedi a Lucy se il taxi di Leland era
     prenotato.» — dalla domanda del taccuino del §3-B1; la testimonianza è carry-in M8.
   - **obj_m9_2** (priority 200): «Nel taccuino: metti il racconto di Leland accanto
     alla verifica.» — dalla riga «(taccuino — Confronta: …)».
   Catena priorità: **100→200→300→400**; l'obiettivo d'ingresso punta sempre a una
   root disponibile (`entry_objective_points_to_actionable_root`); l'obiettivo
   terminale è gated sul nodo che lo consegna
   (`terminal_objective_gated_on_delivering_node`).
8. **Eco M8 con gli ID esatti dei lock**: `letter_o_observation_source`
   (cooper_primary | hawk_preserved), `sarah_support_state` (none | vice),
   `warning_target` (palmer | fallback). Nessuna eco M6 in M9 (`jacques_midnight_claim`
   / `jacques_list_given` / `jacques_third_man_detail` sono di M10-B3/B5).
9. **`m9_cmp_taxi` vs `cmp_taxi`**: `propositions.json` registra
   `born_from_comparison: "cmp_taxi"` come **nome logico** del confronto; l'id di nodo
   segue la convenzione di missione `m9_*` (stessa relazione di P3A/`cmp_e8a_e8b` ↔
   `m5_cmp_ring`). Verificato dal validatore.
10. **`leland@sheriff`** esiste in `js/glue.js` condizionato a `flag:atto5 &&
    !flag:leland_morto`: la presenza fisica coincide col gate narrativo perché `atto5`
    nasce all'accettazione. Il posizionamento/cammino è C9-E; la collisione di target
    `truman@sheriff` fra M8 (`m8_station`, concluso ma con `repeat`) e M9
    (`m9_present_truman`) è risolta dall'adapter **latest-first** — da riprovare in C9-C.
11. **Continuità `m9.b2.p6.accept.p03`** — **[N→L]**. La verifica oppone i tre
    dettagli dichiarati da Leland — compagnia, casa e ora — al registro privo
    di prenotazione, senza trasformare il lutto in una regola universale.

## Correzioni v1.1.1 rispettate (checklist dal §0 e §7 del Lock)

- P6 non afferma MAI dove fosse Leland; la «trasferta di lavoro» è rimossa ovunque
  (nessun `Missoula … lavoro`, nessuna `trasferta`, nessun `registro della contea`,
  nessun `garage municipale`). ✓ (vietato dal validatore)
- `D_TAXI` acquisita SOLO su richiesta del player a Lucy; nessun documento aperto da
  solo. ✓
- P6 = sola base procedurale; P7/P8 annotate mai accettate; la visione respinta come
  atto e riconosciuta come direzione. ✓
- Il player non deve provare l'omicidio: deve provare che il colloquio è necessario.
  Nessuna riga di M9 attribuisce un omicidio. ✓
- Arrivo VOLONTARIO: nessun arresto, nessuno stato di fermo, nessuna divisa a casa
  Palmer, nessuna aura. ✓
- **Nessun segnale BOB in M9**: i due segnali (ritratto + cambio di registro) esistono
  SOLO in M10-B5. `BOB` non compare in nessun testo di M9. ✓
- `factual_status` di P6 resta `unconfirmed`: `confirmed_as_lie` è M10-B6. ✓
- M4/M5/M6 invariati; M8 possiede il beat taxi pre-ritrovamento; M9 lo legge. ✓
