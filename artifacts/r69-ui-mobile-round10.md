# R69 — UI/mobile targeted regression audit, round 10

## Verdetto

**HARD PASS — 95.3/100.** Soglia: **95/100**.  
La regressione `cooperBack` di round 9 è chiusa; nessuna courtesy inflation.

Reference: `artifacts/retro-gauntlet/refs/reference-r69.png`  
Candidate: `artifacts/retro-gauntlet/r69-final-arrival-native.png`  
5×: `artifacts/retro-gauntlet/r69-final-arrival-5x.png`

SHA-256 native: `240e2343891552c2e77fbfc3dd2130b646338d940a553eb78ee4a616b1a8bbb7`  
SHA-256 5×: `0e134c58bdadb2af53bade4db79f91257b0fe74732c8aea2581f5e426111ea1e`

## Score severo

| Area | Score | Esito |
|---|---:|---|
| Cooper portrait / actor likeness | 9.3/10 | PASS |
| Cooper up/back sprite | 9.1/10 | PASS |
| Portrait card / nameplate | 9.4/10 | PASS |
| Dialogue frame | 9.4/10 | PASS |
| Text readability / clearance | 9.6/10 | PASS |
| Mobile 390×844 | 9.8/10 | PASS |
| Mobile 844×390 | 9.7/10 | PASS |
| Integer pixel scale | 10.0/10 | PASS |

Media: **95.375/100 → 95.3/100**, troncata per severità.

## Regressione round 9 — chiusa

Output `node test/sprite-gates.js`:

- `NO`: **0**;
- collo/testa minimo: **80.0%** (gate ≥71%);
- massa tono scuro minima: **50.0%** (gate ≥50%);
- stacco interno retro minimo: **0.367** (gate ≥0.300);
- toni minimi nel tile 8×8: **3** (gate =3);
- righe interamente nere: **3/16** (gate ≤3);
- contorno chiuso minimo: **100.0%** (gate ≥95%).

Visivamente Cooper torna leggibile di spalle: testa/nuca centrali, massa capelli non piatta, collo separato, spalle e gambe distinguibili. Il dettaglio interno usa tre toni senza rumore casuale.

## UI e leggibilità — invariati

- Card ritratto e targa `COOPER` non collidono col testo.
- Il volto riempie il well e conserva silhouette, orecchio, zigomo e busto leggibili.
- Due righe di dialogo complete, alto contrasto, freccia entro il box.
- Split mondo/dialogo netto; nessun overflow fuori dal buffer nativo `160×144`.
- Capture native e 5× mostrano nearest-neighbour pulito, senza pixel frazionari.

## Mobile — hard pass invariato

Geometria deterministica corrente:

- `390×844`: stage `(35,83) 320×288`, scala intera 2×; D-pad `(16,684) 144×144`; A `(298,682) 72×72`; B `(222,752) 72×72`;
- `844×390`: stage `(262,51) 320×288`, scala intera 2×; D-pad `(59,123) 144×144`; A `(681,119) 64×64`; B `(623,213) 64×64`;
- nessuna sovrapposizione fra stage e controlli; controlli nei gutter/settori dedicati.

## Gate automatici

- `R69-REFERENCE-PASS 23/23`
- `PORTRAIT-GOLD-PASS 9/9`
- `GOLD-TONE-PASS 9/9`
- `MOBILE-PROD-PASS 19/19`
- `TOUCH-RUNTIME-PASS 13/13`
- `RETRO-PROD-PASS 45/45`
- sprite gates: **0 `NO`**

## Caveat separato

`test/dialogue-presentation.js` resta rosso prima del render perché la sua fixture legacy WebGL non apre più l'interazione hard-coded nella mappa `sheriff`. Non misura il renderer retro R69, la card o il layout mobile e non è causato dal fix `cooperBack`; resta debito di aggiornamento del test legacy, non blocker di questo audit mirato.

## Chiusura

**Blocker R69 UI/mobile: nessuno.** Round 9 è riparato e lo stop condition torna raggiunto.
