# M10 — matrice di validazione

Assi: `m10_method` (3) × `s3` (2) = **6 percorsi di scena**, moltiplicati per le eco lette:
M6 tattica (3: una sola evidenza JACQUES_* per partita) × biglietto (warning_target 3 ×
focus_destination 3 → 3 rese) × promise_stance (3). Eseguiti dal runtime reale in
`test/act-5-flow.js` (tutte le 6 × 3 × 9 × 3 = 486 combinazioni) con save/load a ogni anello.

Asserzioni per percorso: metodo scritto prima della pagina del nastro; sei ammissioni committate
prima di S3, tutte `leland_first_person`; P6 `confirmed_as_lie` e P8 `corroborated` solo dopo
B6; S3-off non cancella nulla; B7b identico nei due rami; Truman esce/rientra solo
nell'intuitivo (Cast Presence); `leland_morto` a fine B10; obiettivo unico a ogni passo;
ripresa dopo interruzione a ogni anello (continuation, poi Truman dopo il fermo); nessun softlock.

Reason codes di M10: nessuno (M10 non ha presentazioni). I reason code di P6 restano quelli di M9
(`SUFFICIENT_RELEVANT_SUPPORT`, `NO_CORROBORATION`, `VALID_BUT_NOT_PROCEDURAL`, `ALREADY_REJECTED`),
coperti dal percorso M9→M10 di `test/act-5-flow.js`.

Assenze: nessuna pagina VOCE che ammetta; nessun BOB nominato; nessuna battuta assolutoria;
nessun terzo segnale BOB; nessuna foto a faccia in giù.
