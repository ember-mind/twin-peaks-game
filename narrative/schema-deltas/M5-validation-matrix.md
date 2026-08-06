# M5 — Matrice di validazione (contratto dei test dinamici per C5-B)

Perimetro: questa matrice è il CONTRATTO della copertura dinamica. I percorsi
saranno eseguiti DAL runtime esteso (prepare/commit reali, save/load a ogni
passo) dentro `test/narrative-validate.js`, come per M4 — mai da una
simulazione parallela. In C5-A esiste la copertura STATICA
(`test/narrative-validate-m5.js` — il numero dei controlli è STAMPATO dal
validatore a ogni esecuzione; questo documento non mantiene conteggi a mano).

## 1. La matrice canonica: 72 percorsi

```
6 ordini delle osservazioni  ×  2 teorie iniziali  ×  3 revisioni  ×  2 stati S1  =  72
```

**Ordini** (gruppi: T=ticket/mucchio, R=ring/anello, S=scene/disposizione):
`TRS · TSR · RTS · RST · STR · SRT`

**Teorie iniziali**: `degeneration · staging`
**Revisioni**: `keep · switch · open`
**S1**: `institutional · documented_custody`

### Asserzioni per OGNI percorso (11, dal contratto C5-A)

1. Esattamente tre gruppi acquisiti (5 evidenze, mai duplicate).
2. La teoria iniziale si apre SOLO dopo il commit del 2° gruppo — e prima il
   nodo del 3° gruppo NON è preparabile (`milestone_pending`).
3. La revisione si apre SOLO dopo il commit del 3° gruppo — e prima il
   rapporto NON è preparabile.
4. `m5_final_theory` finale corretta:
   - keep → uguale alla iniziale;
   - switch → l'opposta (degeneration↔staging);
   - open → `open`.
5. `m5_theory_revised`: false per keep; true per switch E per open.
6. `s1` valorizzata esattamente una volta (write-once; secondo tentativo = repeated).
7. Obiettivo UNIVOCO a ogni passo (catena 100→200→300→400, mai due veri).
8. Nessun softlock: da ogni stato intermedio esiste un'azione che avanza.
9. Nessuna teoria marcata corretta (né a schermo né nello stato).
10. Nessun effetto prima dell'ultima pagina del nodo che lo produce
    (evidenze, valori, east_route_confirmed).
11. Save/load a ogni passo: serialize→deserialize→serialize identico,
    obiettivo/gruppi/milestone-pending ricostruiti dai dati.

### Asserzioni aggiunte dalla revisione C5-A (per OGNI percorso)

12. Milestone iniziale NON risolta finché `m5_initial_theory` è null (il
    commit del prompt non risolve nulla).
13. Milestone revisione NON risolta finché `m5_final_theory` è null.
14. `b8_attempt_history` di M4 IMMUTATA per tutto il percorso.
15. `assistance_level` di M4 IMMUTATO.
16. Nessun confronto direct-effect ripetibile (E7A↔E5 completed al node
    commit, sparisce dalle azioni — anche cross-mission).
17. `m5_report_close` unico writer di `east_route_confirmed`.

## 2. Copertura pairwise aggiuntiva (dal contratto)

| Dimensione | Valori |
|---|---|
| E5 | presente / assente |
| Teoria finale | degeneration / staging / open |
| P3A | formulata / non formulata |
| Ordine P3A | prima della revisione / dopo la revisione / mai |

**P3B rimossa come dimensione** (revisione C5-A): non ha writer, «P3B
presente» non è uno stato raggiungibile di M5. Al suo posto, INVARIANTE
GLOBALE su tutti i 72 percorsi: `P3B.formulation.status == unformulated`.

Coppie da coprire (selezione pairwise, ≥7 run aggiuntivi):
- E5 assente × P3A formulata × cmp anello prima della revisione;
- E5 assente × P3A non formulata × cmp mai eseguito → M5 comunque completabile;
- E5 presente × cmp E7A↔E5 eseguito in M5 → SOLO nota di ricorrenza, poi
  completed (mai riproponibile);
- E5 presente × cmp E7A↔E5 NON eseguito in M5 → resta disponibile dopo
  l'ingresso in M6 (registro globale con source_mission, dedup per node_id);
- P3A formulata × teoria finale degeneration (la tensione si conserva:
  nessuna correzione nascosta);
- P3A non formulata × teoria finale staging (idem, direzione opposta);
- P3A formulata × teoria finale open (la terza combinazione di tensione).

## 3. Record critici screen-truth (C5-D)

| Momento a schermo | Stato che DEVE essere ancora falso/nullo |
|---|---|
| ultima pagina del mucchio (m5.b5.mound.p04) | E7A, E7B |
| ultima pagina dell'anello (m5.b6.ring.p04) | E8A, E8B |
| ultima pagina B7 (m5.b7.scene.p02) | E_SCENE |
| teoria iniziale visibile (m5.b8a.theory.p01) | m5_initial_theory = null |
| revisione visibile (m5.b8b.revision.p01) | m5_final_theory = null |
| feedback P3A visibile (m5.b8c.feedback.deliberate) | P3A unformulated |
| feedback S1 visibile (m5.b9.s1.*.p02) | s1 = null (widget B1: commit dopo il feedback) |
| ultima pagina finale (m5.b9.report.p07, ramo di chiusura) | east_route_confirmed = false, obiettivo ≠ OEJ (commit del ramo dopo) |

## 4. Percorso fisico (C5-E)

Almeno DUE ordini ambientali completi camminati nel motore
(`mucchio → anello → scena` e `scena → mucchio → anello`), più la copertura
runtime di tutti e sei gli ordini nel validatore. Unica semina ammessa: lo
stato di fine M4 (atto3 + P2 accettata), prodotto dal percorso M4 già validato.

## 5. Invarianti statiche (GIÀ coperte in C5-A: numero stampato dal run)

writer unici (5 evidenze, s1, east_route, P3A) · E_SCENE solo da B7 · P3A solo
dal confronto · nessuna datazione-pioggia su E7B · nessuna prova cartello→Jacques ·
nessun booleano mutuamente esclusivo per le teorie · nessun nodes_done come
sostituto di teoria/proposizione · page ID stabili e globalmente unici (M4+M5) ·
nessun token interno nei testi · obiettivi a partizione esatta (tabella di
verità) · pages_by_value copre il dominio intero · S1 senza giudizio ·
binding ambientali senza coordinate.


## 6. Test C5-A.2 (abort/resume, domini, beat, registro)

**Abort/resume e save intermedi** (dinamici, C5-B):
abort_initial_theory_resumes_choices · abort_revision_resumes_choices ·
abort_s1_resumes_s1_not_repeat · save_after_initial_intro_resumes_choice ·
save_after_report_intro_resumes_s1 · repeat_only_after_east_route_confirmed ·
beats_completed_not_written_prematurely.

**Domini tipizzati**:
initial_theory_open_rejected · final_theory_open_accepted ·
deserialize_rejects_impossible_initial_theory · from_value_initial_to_final_valid.

**Beat**:
initial_prompt_commit_does_not_complete_theory_beat ·
revision_prompt_commit_does_not_complete_revision_beat ·
report_intro_commit_does_not_complete_report_beat ·
report_close_commit_completes_report_beat.

**Registro cross-mission**:
single_mission_api_still_works · future_mission_comparisons_hidden ·
entered_mission_comparisons_visible · m5_comparison_survives_into_m6 ·
duplicate_node_id_across_missions_fails · completed_cross_mission_comparison_hidden.
