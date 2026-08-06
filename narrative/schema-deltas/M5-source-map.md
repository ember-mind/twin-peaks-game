# M5 — Source map (nodo → sezione del Lock) e dichiarazioni di provenienza

Autorità canonica: **M5-M6 v1.1.1 LOCK.md, §3** (unica sorgente testuale).
Ogni testo di pagina è trascritto dal Lock; le trasformazioni sono elencate qui.

## Mappa nodi

| Nodo | Sezione Lock | Pagine | Note di trascrizione |
|---|---|---|---|
| m5_bridge | M5-B1-B2 | 5 | la riga «→ nota:» è EFFETTO taccuino, non pagina |
| m5_discovery | M5-B3-B4 | 3 | «→ obiettivo» = flag vagone_scoperto (obiettivi derivati); «nota di Cooper» = effetto taccuino |
| m5_mound | M5-B5 | 4 | le righe «→ evidenza» diventano pagine-osservazione + effetti POST-ultima-pagina |
| m5_ring | M5-B6 | 4 | idem |
| m5_scene | M5-B7 | 2 | esame scelto: E_SCENE SOLO qui |
| m5_theory_initial | M5-B8a | 1+2fb | il feedback identico delle due scelte ha DUE page id distinti (registro pagine) |
| m5_theory_revision | M5-B8b | 1 | «(scelta dell'altra)» = effetto `opposite_of` (con 2 teorie la scelta è determinata: nessun sotto-menu) |
| m5_cmp_ring | M5-B8c | 1+3fb | il ✔ del Lock NON è renderizzato (nessun segno di correttezza) |
| m5_cmp_ticket_e5 | M5-B8c | 1 | facoltativo; latenza cross-mission: registro globale (delta §5) |
| m5_report_intro | M5-B9 | 2+1(per teoria)+3 | dialogo; pages_by_value (delta §4); next: m5_s1 |
| m5_s1 | M5-B9 | 2fb×2 | nodo-scelta INTERNO (widget B1 invariato); prompt [N→L] APPROVATO |
| m5_report_close | M5-B9 | 2 | ramo interno; east_route_confirmed al commit |
| m5_sign_oej | M5-B9 | 1 | [P] testo dal repository (data.js `sign_oej`), citato dal Lock §1.5 |

## Conteggi pagine: riconciliazione col §8 del Lock

B5 (4), B6 (4), B7 (2), B8a (3 = 1 prompt + 2 feedback), B8c (4 = 1 + 3 feedback)
coincidono. **Discrepanze da riconciliare col revisore**:
- B1-B2: Lock dichiara 7, il testo di §3 contiene 5 righe-pagina + 1 nota-effetto.
- B3-B4: Lock dichiara 5, il testo contiene 3 righe-pagina + obiettivo + nota.
- B8b: Lock dichiara 3, il testo contiene 1 prompt (le tre scelte non hanno
  pagine di feedback nel testo).
- B9: Lock dichiara 12; la proposta ne rende 10 per percorso (2 + 1 variante +
  3 + 2 feedback S1 + 2 chiusura) — 12 contando entrambe le varianti S1.
Interpretazione adottata: il conteggio del Lock include righe-effetto/obiettivo;
la proposta non inventa pagine per pareggiare i numeri. **[L — interpretazione APPROVATA in revisione v1.1: nessuna pagina artificiale]**

## Dichiarazioni [N] / [OPEN]

1. **obj_m5_3 «Riferisci la scena a Truman.»** — **[N→L] APPROVATO** dal
   revisore (C5-A review, 2026-07-23).
2. **Obiettivo OEJ** — il Lock dice «Segui la rotta oltre il confine: One Eyed
   Jacks.»; il contratto C5-A citava «Oltre il fiume: One Eyed Jacks.».
   **Prevale il Lock** (dottrina dell'autorità canonica); segnalato.
3. **`vagone_scoperto`** — **[N→L] APPROVATO** come flag semantico (più
   leggibile di nodes_done.m5_discovery negli obiettivi).
4. **Hawk come interazione autonoma** — **RISOLTO** in revisione: nessun nodo
   autonomo (contenuto artificiale); Hawk agisce come accompagnatore al ponte,
   custode del perimetro e voce della rotta OEJ dentro i beat.
5. **`target_id` ambientali** (`mound`, `ring`, `scene_center`,
   `traincar_entrance`, `sign_ponte`, `sign_oej`) — [N] identificatori logici;
   la risoluzione verso le mappe reali è compito dell'adapter in C5-C
   (`sign_oej` e `sign_ponte` sono [P]: già oggetti del repository).
6. **Eco Loggia S1** — le due battute S1 del Lock appartengono alla Loggia
   (missione finale): NON sono in M5.json; verranno consumate dalla conversione
   della Loggia leggendo `values.s1`.

## Correzioni v1.1.1 rispettate (checklist dal §1 del Lock)

- E7B senza cronologia della pioggia (testo esatto; validatore lo impone). ✓
- Tre osservazioni obbligatorie; ordine libero; teoria dopo la 2ª; revisione
  dopo la 3ª; `open` scrive `m5_theory_revised: true`. ✓
- P3A = inferenza formulata, `factual_status: unconfirmed`, SOLO dal confronto. ✓
- Il cartello apre la ROTTA (obiettivo), nessuna prova contro Jacques;
  Renault solo nella battuta di rotta di Truman. ✓
- S1 neutrale: both-cost, nessun giudizio, un solo valore tipizzato. ✓
- Falsa pista prudente: nessuna pagina dice «il vagone era il luogo
  d'appuntamento». ✓ (vietato dal validatore participant-facing)


## Revisione C5-A (24/30) — correzioni v1.1 applicate

- Milestone risolte da `resolved_when` sui VALORI (mai dal commit del prompt).
- Rapporto B9 diviso: m5_report_intro → m5_s1 (interno) → m5_report_close;
  prompt del widget S1: [SUPERSEDED → vedi C5-A.2: N→L APPROVATO].
- Tentativi del confronto anello in `comparisons[node].attempts`
  (attempt_scope: comparison, track_assistance: false) — lo stato B8/M4 resta
  privato del tutorial.
- E7A↔E5: `comparison_completion: node_commit`, result RECURRENCE_NOT_IDENTITY.
- P3B fuori dalla matrice (stato irraggiungibile) → invariante globale.
- node_count corretto: 13 nodi.
- Kind normalizzati: dialogue / choice (+role theory) / comparison.
- Registro cross-mission: APPROVATO con source_mission + dedup per node_id.


## Revisione C5-A v1.1 (27/30) — correzioni C5-A.2 applicate

- Domini distinti iniziale/finale (open impossibile nell'iniziale a livello di schema).
- completion_when sui tre choice-node composti; repeat_when sul rapporto
  (done+incompleto → riprende m5_s1, mai il repeat); mandatory_beat su
  m5_report_close soltanto.
- Prompt S1 «L'anello: dove va stanotte?» APPROVATO [N→L].
- Interpretazione dei conteggi pagina APPROVATA (nessuna pagina artificiale).
- Registro cross-mission approvato e indurito (API compat, filtro missioni entrate).
- Conteggio controlli: prodotto dal validatore, mai a mano nei documenti.
