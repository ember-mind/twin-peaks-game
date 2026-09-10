# Act 4 — destructive probes: precomputed evidence (no verdicts)

Sources: `narrative/missions/M8.json` (16 nodes, live), `narrative/missions/M9.json`, `js/narrative-engine-adapter.js`, `js/narrative-production.js`, `js/glue.js`, `js/data.js`, `js/maps.js`, `test/act-4-flow.js`, `test/act-4-playthrough.js`, `artifacts/act-4-design/doctrine-audit.md` §11. Lint run: `node test/narrative-lint.js` → `PASS (7 checks, 1 warnings)`.

## 1. WORLD SUBSTITUTION — the Roadhouse

**As world.** Nine registry entities, `js/narrative-engine-adapter.js:253–295`, all `map_id: 'roadhouse'`, all `dialogue: null`:

| id | tile | `when` |
|---|---|---|
| truman | 4,8 | `atto4 ∧ ¬value_set warning_target` |
| bobby 3,2 · donna 5,2 · james 9,2 · shelly 11,2 | row 2 | same window |
| norma 3,6 · loglady 11,6 | row 6 | same window |
| gigante (sprite `giant`) | 8,1 | `presagio_status=active ∧ ¬value_set warning_target` |

Phone target: `WORLD_TARGETS.roadhouse.roadhouse_phone = { x: 8, y: 5, kind: 'object' }` (`js/narrative-engine-adapter.js:101–103`) — resolved by coordinate through `tryInteractAt`, not by entity. Stage tile: `js/maps.js:414` row 1 `'iCCCCCCCCCCCCCCi'` (solid `C`, faceable from 8,2); phone tile 8,5 free (`js/maps.js:418`). `js/glue.js` has **no `roadhouse` key** in `NPCS`: the room's entire population is the registry.

**As pages.** `m8_roadhouse_truman` p01–p05; `m8_giant_stage` p01 + `m8.b.giant.repeat`; `m8_roadhouse_phone` p01, p02 + three feedback sets.

**Substitution: delete all nine roadhouse entities.** What remains mechanically: the 16×10 room, the two exit doors 7,9 / 8,9, and the phone target at 8,5. `m8_roadhouse_truman` is `target_kind: actor, target_id: truman` — with no NPC there is no root, so `presagio_status` is never written; `m8_roadhouse_phone` conditions (`presagio_status=active`) then never hold, `obj_m8_15` never fires, and `classicFlags.gigante2` (gated on `nodes_done.m8_roadhouse_truman`) never flips.

Assertions that fail, by name — `test/act-4-flow.js` (adapter block):
- `roadhouse: entità Truman registrata`
- `roadhouse: le sei entità di scenografia sono registrate (bobby,donna,james,shelly,norma,loglady)`
- execution then throws at `when(truman, s)` (undefined `e.when`), so these are never reached: `roadhouse: Truman presente in finestra atto4 ∧ ¬warning_target`, `roadhouse: <id> presente nella stessa finestra` ×6, `roadhouse: Truman assente dopo warning_target scritto`, `roadhouse: <id> assente dopo warning_target scritto` ×6, `roadhouse: entità Gigante registrata`, `Gigante: posizione (8,1)`, `Gigante: dialogue null (…)`, `Gigante: assente prima che presagio_status sia active`, `Gigante: presente con presagio_status=active e nessun warning_target`, `Gigante: assente dopo warning_target scritto`.
- The mission-path block (`test/act-4-flow.js:132–138`, `m8_roadhouse_truman` → `m8_roadhouse_phone` → `warning_*`) reads state only and stays green.

`test/act-4-playthrough.js`:
- `Roadhouse: Truman e la folla presenti all'arrivo, Gigante assente` (`crowdIds.length > 0` is false)
- `useActor(P,'roadhouse','truman',…)` aborts to the api fallback ("NPC \"truman\" … assente"), taking with it: `Roadhouse: la dichiarazione al tavolo rende m8.b.truman.p01…p05`, `Roadhouse: la dichiarazione non apre il telefono nello stesso lease`, `Roadhouse: presagio_status = active dopo la dichiarazione`, `Roadhouse: m8_roadhouse_truman committato`, `Roadhouse: il Gigante è sul palco (8,1) dopo la dichiarazione`, `HUD: dopo la dichiarazione il testo è esattamente «Il telefono del Roadhouse.»`, `mondo: gigante2 classico derivato dalla dichiarazione`, `mondo: Sarah non è più a casa Palmer dopo la dichiarazione (npcActive)`, `mondo: bobby e donna assenti dalla città dopo la dichiarazione`, `Roadhouse: il Gigante rende solo m8.b.giant.p01`, `Roadhouse: la ripetizione del Gigante non aggiunge enunciati`, `Roadhouse: il Gigante non scrive nulla`.
- Passing **vacuously** after the deletion: `Roadhouse: nessuna entità sul telefono o sulle caselle sopra/sotto`, `Roadhouse: dopo la telefonata Gigante e folla non ci sono più`, `reload dopo il telefono: il Gigante NON ricompare (fuori finestra)`, `reload dopo il telefono: entità identiche`.

Page text that still asserts a crowd after the deletion (`quote`):
- `m8.b.truman.p01` — "(La banda suona. Il paese c'è tutto: birre, risate basse, il microfono che fischia una volta.)"
- `m8.b.truman.p03` — "(La musica non si ferma. Ma per Cooper la sala rallenta — solo per lui.)"
- `m8.b.truman.p05` — "(La sala riprende il suo tempo. Nessuno ha visto niente.)"
- `m8.b.giant.p01` / `m8.b.giant.repeat` — "(Sul palco, dietro la banda, un uomo alto. Nessuno lo guarda. Non indica niente.)"
- `m8.b.phone.p02` — "Harry, non so ancora cosa si ripeta. La linea è libera; quello che dico adesso farà muovere qualcuno."
- `m8.lucy.p01` — "Stasera il paese è tutto al Roadhouse, agente. Norma chiude alle sei per andarci. Lei ci va?"
- `m8.lucy.p03` — "Linea libera, agente. Hawk è di pattuglia, il resto del paese è al Roadhouse. Le serve qualcuno?"

## 2. PAYOFF ABLATION — Maddy's ordinary beat (`m8_diner`)

**Writer of `promise_stance`:** `m8_diner` choices `promise_accompagno` / `promise_autonomia` / `promise_prudenza`. Sole writer; write-once.

**Readers of `promise_stance`.**

| node | page / element | quoted text or condition |
|---|---|---|
| `obj_m8_0` | objective | `¬value_set promise_stance` → "Passa dal diner, questo pomeriggio." |
| `obj_m8_25` | objective | `value_set promise_stance ∧ ¬T_LELAND_TAXI` → "Prima di uscire dal diner, parla con Leland." |
| `obj_m8_1` | objective | `value_set promise_stance` → "Il paese si ritrova al Roadhouse, stasera." |
| `m8_diner` | `conditions` / `completion_when` | `¬value_set` / `value_set promise_stance` |
| `m8_leland_waiting` | `conditions` | `atto4 ∧ ¬value_set promise_stance` |
| `m8_roadhouse_truman` | `conditions` | `value_set promise_stance` |
| `m8_leland_taxi` | `conditions` | `value_set promise_stance` |
| `m8_leland_taxi` | `m8.b0.leland_taxi.accompagno.p01` | "Con Maddy ci siamo accordati: la accompagno alle sette e dieci. Il taxi aspetterà?" |
| `m8_leland_taxi` | `m8.b0.leland_taxi.autonomia.p01` | "Maddy ha scelto Missoula. Non aggiungo un «ma»: verifico gli orari e le lascio la partenza." |
| `m8_leland_taxi` | `m8.b0.leland_taxi.prudenza.p01` | "Ho chiesto a Maddy una telefonata. Il taxi delle sette aggiunge un orario, non una garanzia." |
| `m8_leland_taxi` | `m8.b0.leland_taxi.accompagno.p02` | "Sarah si tranquillizza se c'è un'auto davanti. Aspetterà fino alle sette e dieci. Il suo accompagnamento resta, agente." |
| `m8_promise_echo` | `m8.d.echo.accompagno` | "Diane. Aveva fissato le 7:10. Disse che un federale poteva aspettare cinque minuti." |
| `m8_promise_echo` | `m8.d.echo.autonomia` | "Diane. Disse che Missoula l'aspettava senza un \"ma\"." |
| `m8_promise_echo` | `m8.d.echo.prudenza` | "Diane. Rise della mia voce da centralino. Disse che avrebbe chiamato." |
| M9 `carryover_values` | declaration (`M9.json:57–65`) | `used_in: "m9_verifica_taxi (eco investigativa solo per accompagno) + m9_present_truman (taccuino degli orari)"` |
| M9 `m9_verifica_taxi` | `m9.b1.verifica.accompagno.p01` | "L'orario era compatibile col mio accompagnamento. La discrepanza è una sola: quel taxi non è mai stato prenotato." |

**Readers of the napkin / diner content.** Napkin: `m8.a.diner.p01` "(Maddy al bancone, un tovagliolo pieno di numeri. Norma le riempie la tazza senza chiedere.)"; `m8.a.diner.p08` "(Maddy piega il tovagliolo sugli orari e aspetta.)"; `m8.d.echo.p02` "Sul tovagliolo aveva scritto tre partenze. Ne aveva scelta una."

**Pages quoting Maddy's words.**

| trigger | node | page | quote |
|---|---|---|---|
| 7:40 | `m8_diner` | `m8.a.diner.p02` | "La 7:40 prende la coincidenza a Spokane. Passa alla fermata del lago — quella delle 11 no, ma parte a orario." |
| 7:40 | `m8_leland_taxi` | `m8.repeat.leland_taxi` | "Taxi alle sette, corriera alle 7:40. Ripeto gli orari finché non compare una prenotazione." |
| corriera | `m8_focus_choice` | `focus_lago` label | "la fermata del lago — la corriera di Maddy (a ovest, lontana)" |
| corriera | `m8_leland_taxi` | `m8.b0.leland_taxi.p01` | "Maddy prende la prima corriera domattina. Ho chiamato la Twin Peaks Taxi: passa da casa alle sette." |
| "con due D" | `m8_diner` | `m8.a.diner.p06` | "(senza acidità) Maddy. Con due D. Laura era mia cugina — io sono quella che porta gli occhiali nelle foto." |
| "con due D" | `m8_discovery` | `m8.d.discovery.cooper.p02` | "(fermo) Signorina Ferguson. Maddy. Con due D." |
| Missoula | `m8_diner` | `m8.a.diner.p07` | "Sono rimasta un giorno in più per zia Sarah. Uno. Poi Missoula si riprende il suo centralino." |
| Missoula | `m8_diner` | `promise_autonomia` label | "«Missoula ti aspetta. Vai.»" |
| Missoula | `m8_leland_taxi` | `m8.b0.leland_taxi.autonomia.p01` | (above) |
| Missoula | `m8_promise_echo` | `m8.d.echo.autonomia` | (above) |
| centralino | `m8_diner` | `m8.a.diner.p04` | "Torno al centralino della biblioteca. Mi tengono il posto fino a lunedì — l'ho fatto promettere per iscritto." |
| centralino | `m8_diner` | `m8.a.diner.feedback.prudenza` | "(ride) Lei parla come il mio centralino. Va bene: chiamerò. Sempre." |
| centralino | `m8_promise_echo` | `m8.d.echo.prudenza` | (above) |
| "cinque minuti" | `m8_diner` | `m8.a.diner.feedback.accompagno` | "(sorride) Alle 7:10, agente. Io i federali li faccio aspettare al massimo cinque minuti." |
| "cinque minuti" | `m8_promise_echo` | `m8.d.echo.accompagno` | (above) |
| "senza un ma" | `m8_diner` | `m8.a.diner.feedback.autonomia` | "(annuisce, piano) È la prima persona in questa città che me lo dice senza un \"ma\"." |
| "senza un ma" | `m8_promise_echo` | `m8.d.echo.autonomia` | (above) |
| "avrebbe chiamato" | `m8_promise_echo` | `m8.d.echo.prudenza` | (above) |
| her voice, warned | `m8_roadhouse_phone` | `m8.b.roadhouse.feedback.palmer.p02` | "Le porte sono già chiuse, agente. Resto con lei. La valigia la porto nell'ingresso, così domattina non la sveglio." |

**Mechanical dependency list if `m8_diner` is removed.** `promise_stance` loses its only writer, so every row above that reads it becomes unreachable: the three `m8_leland_taxi` stance pages plus `accompagno.p02`, all three `m8_promise_echo` `pages_by_value` cases (the branch has no case to select, and its declared total-domain coverage no longer holds), and `m9.b1.verifica.accompagno.p01`. `obj_m8_25` and `obj_m8_1` never fire; `obj_m8_0` stays true permanently at priority 50. `m8_leland_taxi` never opens (`value_set promise_stance`), so `T_LELAND_TAXI` is never written, so `m8_roadhouse_truman` never opens and the act does not advance. The two diner entities never leave: `maddy@diner` (`when: atto4 ∧ ¬value_set promise_stance`) and `leland@diner` (`when: atto4 ∧ ¬evidence T_LELAND_TAXI`), `js/narrative-engine-adapter.js:229–243`. Napkin lines `m8.a.diner.p01` and `p08` disappear with the node; `m8.d.echo.p02` still renders and quotes an object never shown. M9's `carryover_values` entry for `promise_stance` becomes a declared value with no writer — the same class the lint already reports for `P7.formulation.status`.

## 3. ROUTE CAUSALITY — writer → reader chains

| reader | exact condition | writer(s) |
|---|---|---|
| entity `hawk_shore_first` (adapter:303–306) | `body_found_by = 'hawk' ∧ ¬flag maddy_trovata` | `body_found_by`: `m8_route_palmer.effects` → `hawk`; `m8_route_lake.effects` → `cooper`; `m8_route_diner.effects` → `hawk`. `maddy_trovata`: `m8_discovery.effects` `{set: maddy_trovata}` (sole writer) |
| entity `hawk_shore_after` (adapter:308–311) | `flag maddy_trovata ∧ ¬node_done m8_station` | `maddy_trovata` as above; `node_done m8_station` written by the commit of `m8_station` |
| `m8.c.route_palmer.p02` (valise) | `warning_target = 'palmer'` | `m8_roadhouse_phone` choice `warning_palmer` |
| `m8.f.station.p_valigia` | `warning_target = 'palmer' ∧ ¬(focus_destination = 'palmer')` | `warning_target`: `m8_roadhouse_phone` choices; `focus_destination`: `m8_focus_choice` choices `focus_palmer` / `focus_lago` / `focus_diner` |
| `m8.f.station.p_lago` | `focus_destination = 'lago'` | `m8_focus_choice` choice `focus_lago` |
| `m8.f.station.sarah_vice` / `sarah_truman` | `pages_by_value` on `sarah_support_state` ∈ {vice, none} | `m8_roadhouse_phone`: `warning_centrale` → `vice`; `warning_palmer` and `warning_nessuno` → `none` |
| classic NPC `sarah` (`js/glue.js:47`) | `cond: ['!flag:gigante2']`, dialogue `{cond: 'flag:atto4', then: 'sarah_visione'}` | `gigante2`: `js/narrative-production.js:166`; `atto4`: act entry |
| classic NPC `bobby` (`js/glue.js:16`) | `cond: ['!flag:gigante2']` | same |
| classic NPC `donna` (`js/glue.js:23`) | `cond: ['!flag:gigante2']` | same |

`node test/narrative-lint.js` → `PASS (7 checks, 1 warnings)`. The single warning is `[read-before-write] KNOWN-OPEN: proposition_path "P7.formulation.status" is read but never written by any mission effect` (owner M9). None of the values above appears in the read-before-write report.

**`gigante2` chain.** Writer: `js/narrative-production.js:166` — `if (state.nodes_done.m8_roadhouse_truman) classicFlags.gigante2 = true;`. Readers: `js/glue.js:16` (bobby `cond`), `js/glue.js:23` (donna `cond`), `js/glue.js:47` (sarah `cond`). Adjacent consumers outside `glue.js`: `js/data.js:809` (`{ cond: 'flag:gigante2', text: 'Parla con Sarah a casa Palmer; poi vai al lago.' }`) and `js/engine.js:340` (the AND evaluator for `cond` arrays).

## 4. SPEAKER SWAP — anonymised clusters

Names replaced with "—"; `agente` / `sceriffo` / `centralino` / `Lucy` / `Harry` / `Diane` / `signorina Ferguson` replaced with "…". Order shuffled. Key at the end.

### Cluster A

1. "(annuisce, piano) È la prima persona in questa città che me lo dice senza un \"ma\"."
2. "Torno al mio lavoro. Mi tengono il posto ancora un po' — l'ho fatto promettere."
3. "La 7:40 prende la coincidenza a Spokane. Passa alla fermata del lago — quella delle 11 no, ma parte a orario."
4. "(sorride) Presto, …. Io i federali li faccio aspettare al massimo poco."
5. "Le porte sono già chiuse, …. Resto con lei. La valigia la porto nell'ingresso, così domattina non la sveglio."
6. "(senza acidità) —. Con due D. — era mia cugina — io sono quella che porta gli occhiali nelle foto."
7. "La prima corriera del mattino prende la coincidenza. Passa alla fermata — quella dopo no, ma parte a orario."
8. "(ride) Lei parla come il mio …. Va bene: chiamerò. Sempre."
9. "Sono rimasta un giorno in più per zia —. Uno. Poi — si riprende il suo …."
10. "Torno al … della biblioteca. Mi tengono il posto fino a lunedì — l'ho fatto promettere per iscritto."
11. "(sorride) Alle 7:10, …. Io i federali li faccio aspettare al massimo cinque minuti."

### Cluster B

1. "Se i tuoi enigmi avevano un seguito, questo è il posto che mi hai chiesto di aspettare."
2. "…, non so ancora cosa si ripeta. La linea è libera; quello che dico adesso farà muovere qualcuno."
3. "Sono passato io da — prima di tornare qui. Adesso — resta con lei."
4. "Nessun fatto ne preferisce uno. Il primo costo è la distanza."
5. "Allora abbiamo un'ora. Prima delle sette, … chiama la compagnia: una corsa prenotata, o niente."
6. "…. Aveva fissato le 7:10. Disse che un federale poteva aspettare cinque minuti."
7. "Ci sarò, …. Prima passo dal Double R."
8. "Dimmi che cosa abbiamo, oltre a quello che abbiamo perso."
9. "…. Disse che — l'aspettava senza un \"ma\"."
10. "In ingresso c'era la valigia pronta, e un biglietto per —. Voleva partire domattina."
11. "Una firma che procede, …. Il diario dice che qualcuno le prometteva il proprio nome a pezzi."
12. "Non ancora, …. Tieni la linea libera."
13. "— era già con — quando è arrivata la chiamata."
14. "…. Rise della mia voce da …. Disse che avrebbe chiamato."
15. "E un orario. Ieri al diner — ha detto di aver chiamato la Twin Peaks Taxi per le sette, da casa. L'ho scritto io, alla luce del giorno."
16. "La chiamata sulla riva è arrivata qui mentre tu eri già al lago. Un civile, senza nome; — è partito subito."
17. "Niente da passare, …. Resta qui."

### Cluster C

1. "Il divano era vuoto. Poi c'era — accovacciato, come se aspettasse che lo guardassi."
2. "Ha un nome, so che ce l'ha. Mi arriva fino ai denti e poi—"
3. "Signora —, descriva ancora il sorriso. Questa volta io scrivo e lei non deve difendersi."
4. "Il divano era vuoto. Poi c'era un uomo accovacciato, come se aspettasse che lo guardassi."
5. "Capelli grigi. Lo stesso sorriso che vedo quando chiudo gli occhi."
6. "Ha un nome: comincia per B. Mi arriva fino ai denti e lo dico."

<details>
<summary>Key</summary>

**Cluster A** — Maddy's M8 lines vs a control built by stripping numbers and institutions from three of her own lines (no new content authored).
1 `m8.a.diner.feedback.autonomia` (Maddy) · 2 CONTROL, from `m8.a.diner.p04` · 3 `m8.a.diner.p02` (Maddy) · 4 CONTROL, from `m8.a.diner.feedback.accompagno` · 5 `m8.b.roadhouse.feedback.palmer.p02` (Maddy) · 6 `m8.a.diner.p06` (Maddy) · 7 CONTROL, from `m8.a.diner.p02` · 8 `m8.a.diner.feedback.prudenza` (Maddy) · 9 `m8.a.diner.p07` (Maddy) · 10 `m8.a.diner.p04` (Maddy) · 11 `m8.a.diner.feedback.accompagno` (Maddy).

**Cluster B** — Truman's Act 4 lines vs Cooper's Act 4 lines.
TRUMAN: 1 `m8.b.truman.p02` · 3 `m8.f.station.sarah_truman` · 5 `m8.f.station.hook.p02` · 8 `m8.f.station.p02` · 10 `m8.f.station.p_valigia` · 13 `m8.f.station.sarah_vice` · 16 `m8.f.station.p_lago`.
COOPER: 2 `m8.b.phone.p02` · 4 `m8.c.focus.p03` · 6 `m8.d.echo.accompagno` · 7 `m8.lucy.p02` · 9 `m8.d.echo.autonomia` · 11 `m8.f.station.p03` · 12 `m8.lucy.p03b` · 14 `m8.d.echo.prudenza` · 15 `m8.f.station.hook.p01` · 17 `m8.lucy.p04b`.

**Cluster C** — the four `sarah_visione` pages (`js/data.js:694–701`; the fourth is a COOPER page) vs an oracle control made by mechanically rewriting two of her lines so they name or point.
2 SARAH page 3 (live text) · 3 COOPER page 4 (live text) · 4 SARAH page 1 (live text) · 5 SARAH page 2 (live text) · 1 CONTROL, oracle rewrite of page 1 (names Leland) · 6 CONTROL, oracle rewrite of page 3 (points at the initial).
</details>

## 5. AUTHOR-THESIS CANDIDATES

| page | text | staging / entity already carrying the same information |
|---|---|---|
| `m8.c.focus.p01` | "(Lo stesso paese di ogni giorno. Stanotte le strade sono solo distanza.)" | the three choice labels state direction and distance: "a nord, lontana" / "a ovest, lontana" / "(vicino)"; the town map supplies the tiles |
| `m8.c.focus.p02` | "Sul taccuino, tre luoghi restano senza segni di priorità." | same three labels; duplicates `p03` in the notebook channel |
| `m8.c.focus.p03` | "Nessun fatto ne preferisce uno. Il primo costo è la distanza." | same three labels |
| `m8.b.phone.p02` | "Harry, non so ancora cosa si ripeta. La linea è libera; quello che dico adesso farà muovere qualcuno." | the three intention labels, and the feedbacks that show someone moving: Maddy's closed doors, Lucy's "Ci mette dieci minuti", the handset left on the hook |
| `m8.d.echo.p03` | "(Silenzio.)" | `m8.d.echo.p01` "(Cooper prende il registratore. Non lo accende.)" |
| `m8.b.truman.p01` | "(La banda suona. Il paese c'è tutto: birre, risate basse, il microfono che fischia una volta.)" | the six crowd entities bobby/donna/james/shelly/norma/loglady (doctrine-audit §3 F7) |
| `m8.b.truman.p03` | "(La musica non si ferma. Ma per Cooper la sala rallenta — solo per lui.)" | none: the crowd entities are static, nothing renders the slowdown |
| `m8.f.station.p02` | "Dimmi che cosa abbiamo, oltre a quello che abbiamo perso." | none; the only staging is `m8.f.station.p01` "(La centrale, prima dell'alba.)" |
| `m8.d.echo.p03`-adjacent: `m8.d.discovery.cooper.p04` | "(Arrivano le torce di Hawk e del vice. Cooper non si è mosso di un passo.)" | `hawk_shore_after` entity at 16,27 carries Hawk; no deputy sprite exists, so the torches stay in the caption (doctrine-audit §3 F8) |
| `m8.b.giant.p01` | "(Sul palco, dietro la banda, un uomo alto. Nessuno lo guarda. Non indica niente.)" | the `gigante` entity at 8,1 with `dialogue: null`, present exactly in `presagio_status=active ∧ ¬warning_target` |
