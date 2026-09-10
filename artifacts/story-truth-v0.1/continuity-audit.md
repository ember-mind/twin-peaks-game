# Continuity audit: docs/story truth layer vs Acts 1-3 runtime

## Part 1 — Acts 1-3 rendered-text conflicts

Scope note: `gerard_a4` ("Lo ospita da vent'anni") is gated `flag:atto4`, and
`leland_interr` is gated `flag:atto5` (js/glue.js:41-43,67) — both confirmed
unreachable within Acts 1-3, so no in-scope conflict from either.

| id/loc | speaker | quoted text | collides with | entry says |
|---|---|---|---|---|
| js/data.js:154-155 clue `anello` (desc) | clue desc | "L'anello di Laura" / "Sembra il monile di Laura Palmer. Perché l'assassino non l'ha preso?" | docs/story/facts/ring-identity.md | source: uncertain, status: **open**. "What the ring is (whose, from where) is not established anywhere... Nobody may say whose it is (`ring_c` overreach rule)." File itself flags this exact clue as "a legacy claim stronger than this file permits." |
| js/data.js:164 clue `anello` doc page "Aspetto" | clue doc | "Sembra il monile di Laura Palmer." | same | same |
| js/data.js:667 `anello_interact` page 2 | COOPER | "Un anello d'oro giace piatto sotto l'asse. Sembra il monile di Laura Palmer." | facts/ring-identity.md | Same OPEN status. Directly contradicts M5's own `ring_c` choice ("Che l'anello è di Laura."), coded `OWNERSHIP_OVERREACH`, feedback "Niente qui dice di chi sia." (M5.json:826-838). Classic tile is reachable independently of the M5 flow (map `traincar`, interact `13,5`, js/maps.js:381 — not gated by any `narrative_m*_owned` flag). |

**Leads checked with no conflict**: gerard_a4/bob-guest-since-childhood (out of Act 1-3 scope), leland_interr/M9-M10 (out of scope), Hawk Act 1 lines (no killer/ring claims), `truman_a2` re: Sarah (M4.json:200-231 matches facts/sarah-saw-face.md wording, stays at perceived/described), `m5.b1.bridge.p02` re: Ronette (matches facts/ronette-fled-town.md), "disposta da" attribution (no hits; only player-chosen theory-option labels in M5.json:912,1005, never attributing an agent, consistent with facts/scene-arranger.md OPEN guard), wording-guard literal-text scan across facts/*.md + characters/sarah.md (no matches), Cooper/Truman treating theory as fact (M6.json gates keep Jacques-related claims behind proper flags/feedback, e.g. `m6.b6b.p5.feedback.killed` rejects "Jacques ha ucciso" as overreach).

Note: `artifacts/act-3-design/fact-knowledge-ledger.md` records 5 historical violations in the design draft, all marked resolved in its own "Frozen corrections" section; live M5.json/M6.json text matches the corrected wording. That ledger does not cover the classic (non-mission) `anello`/`anello_interact` dialogue table, which is where the one live conflict above sits.

## Part 2(i) — System certifies more than story truth

No violation found in narrative/evidence.json, narrative/propositions.json,
narrative/state-enums.json, or any narrative/missions/*.json effect for the
watch-listed facts. All checked propositions stay at `factual_ceiling:
"unconfirmed"` or equivalent; all mission `proposition` effects across
M4/M5/M6/M8/M9 only ever write `to: "formulated"`, never `"confirmed"`.

| id/location | stored value | facts/*.md constraint | verdict |
|---|---|---|---|
| `jacques_murder_confirmed`/`attributed` (state-enums.json:180) | only in `deprecated_forbidden` list; no node sets it | facts/jacques-death-agent.md: never certifiable | No violation (M6.json:1506 invariant "MAI jacques_murder_confirmed/attributed") |
| P9 | `factual_ceiling: "unconfirmed"`, no agent named | facts/jacques-death-agent.md | No violation |
| E8A/E8B ring evidence | position/dust only, no ownership | facts/ring-identity.md OPEN | No violation (evidence.json layer clean — conflict is in classic js/data.js, see Part 1) |
| P3A/P3B | `factual_ceiling: "unconfirmed"`, P3B `hypothesis: true` | facts/scene-arranged.md, facts/scene-arranger.md (OPEN) | No violation |
| `JACQUES_THIRD_MAN_DETAIL` evidence | no name, only "guardava la stufa" | facts/third-man-identity.md | No violation |
| `dream_face_recognized_in_leland_scene` | declared, no writer found in M4-M9 | facts/dream-face.md (bridge at M10) | No violation, unused flag pending M10 |
| E3/E9A letter evidence | object only, no author field | facts/letter-r.md, letter-o.md | No violation |

## Part 2(ii) — Story requires a fact the runtime can never (yet) acquire

Correction to the task's premise: **M9 exists** (narrative/missions/M9.json,
wired at js/narrative-production.js:282) and correctly backs
facts/leland-taxi-lie.md / P6. **M10 does not exist** anywhere in the repo
(no M10.json; referenced only in a comment, js/narrative-production.js:1,338,
"avvia M10 causale"). `node tools/narrative/lint-missions.js` passes (7
checks, 0 errors, 1 warning: `P7.formulation.status` read by
`m9_present_truman` but never written — dead branch since no mission
currently formulates P7).

All of the following depend on the single missing artifact `M10.json`:

| facts/*.md or propositions.json id | quoted acquisition line |
|---|---|
| laura-killer.md | "First possible player acquisition: M10 (not built...)"; "Actual current rendered acquisition: not yet ... M10 unbuilt" |
| maddy-killer.md | "First possible player acquisition: M10." |
| bob-guest-since-childhood.md | "First possible player acquisition: M10 B7b." |
| responsibility-fractured.md | "First possible player acquisition: M10 (lived, never stated as a proposition)." |
| jacques-not-author.md | "truth only at M10" (partial truth already built at M6/P5) |
| third-man-identity.md | "identity inferable at M10" (description already built at M6) |
| letter-r.md | "author... unknown to everyone but Leland until M10" |
| maddy-body-lake.md | "the transport: M10" (discovery already built at M8) |
| propositions.json P6 | `confirmed_in: "M10-B6"` — formulation at M9 built, confirmation transition unwritten |
| propositions.json P10_R7 | `experienced_in: "M10"` |

No fact was found depending on M9 as unreachable — M9 is built and wired correctly.

## Part 2(iii) — factual_ceiling / hypothesis agreement

| Proposition | field : value | facts/*.md | agreement |
|---|---|---|---|
| P3A | `factual_ceiling: unconfirmed` | scene-arranged.md: "never fully confirmed" | agrees |
| P3B | `hypothesis: true`, `factual_ceiling: unconfirmed` | scene-arranger.md: open | agrees |
| P4B | `hypothesis: true` | fire-formula.md: "rejected as premature by Truman" | agrees |
| P6 | `factual_path: [unconfirmed, confirmed_as_lie]`, `confirmed_in: M10-B6` | leland-taxi-lie.md: "verified M9", full confirmation implied only at M10 | agrees; transition currently unreachable (see ii) |
| P7 | `hypothesis: true` | truth.md §4 open item (no dedicated facts/ file) | agrees |
| P8 | `factual_ceiling: corroborated`, identity unknown flagged separately | letter-r.md/letter-o.md: seriality established, authorship unknown until M10 | agrees |
| P9 | `factual_ceiling: unconfirmed` | jacques-death-agent.md quotes this field verbatim | agrees |

No disagreements found.

## Part 3 — Validator sanity

```
node tools/story/validate-story.js  ->  story-lint: PASS (1029 checks, 0 warnings)   exit 0
node test/story-truth-lint.js       ->  story-lint: PASS (1029 checks, 0 warnings)
                                         story-truth-lint: PASS                       exit 0
```

**canon/adaptation/project-fact files with body-level OPEN/UNKNOWN on a sub-element** (all are open sub-questions inside an otherwise-locked entry, per the README's provenance model — not full-entry misclassifications, but listed as requested):

truth.md (lines 60-65,67,83-84, multiple open sub-items: ring object/finale, ticket author, Jacques branch claims, other traincar participants, date/hour of death, S2, Giant statement-1 referent, Bible pie-vs-coach update), timeline.md (T3/T4/T6/T7/T9 — UNKNOWN dates/hands/hour), setup-payoff-overview.md (lines 20,33 — INTENTIONAL-UNRESOLVED rows), characters/jacques.md:44, characters/maddy.md:12, characters/leland.md:26, facts/third-man-identity.md:15, facts/ticket-fire.md:17, facts/scene-arranged.md:17, facts/ring-placed.md:17, relationships/cooper-truman.md:19.

**uncertain-source files asserting "Objective truth:"**: none. Checked all 6 (characters/bob.md, facts/scene-arranger.md, facts/bob-nature.md, facts/ticket-author.md, facts/ring-identity.md, facts/leland-bob-partition.md) — none contain such a line.

---
Full report path: /private/tmp/claude-501/-Users-ebuccelli-Code-solo-projects-twin-peaks-game/3236c40e-6199-4da2-b7cb-1a4bef8b66ef/scratchpad/inv-continuity.md
