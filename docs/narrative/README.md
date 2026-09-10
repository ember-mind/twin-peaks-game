# How we create narrative in this project

Read in this order, once: this page → `docs/narrative-system-v0.1.md` (the operating system, ~20 short sections) → `docs/narrative-craft-bible-v0.1.md` (the doctrine behind it, consult by section). Templates: `docs/narrative/templates/`. Validators: `tools/narrative/` (`node test/narrative-lint.js`). Story truth (author-only): `docs/story/`.

## Three layers
- **Story knowledge** — what is true in this game (`docs/story/`, `Twin Peaks Game.md` §Role Contract). Objective truth ≠ what Cooper knows ≠ what an NPC believes ≠ what the player has seen.
- **Authoring system** — how we design, review and validate (system doc + templates). Reusable for any game.
- **Runtime** — missions (`narrative/missions/M*.json` → `js/narrative-data.gen.js`), runtime (`js/narrative-runtime.js`), adapter (`js/narrative-engine-adapter.js`), classic layer (`js/data.js`, `js/glue.js`). Documented, not redesigned (system §20).

## An act, end to end (system §2)
experience promise + dramatic engine → topology audit (cheap) → current beat map → diagnosis → **Fact & Knowledge Ledger** → **Setup–Payoff Ledger** → evidence map → proposed beat map → **scene contracts** (+ voice contracts for new speakers) → agency / channel / order audits → **doctrine audit with exactly three repairs** → wording → implementation spec (FABLE/CHEAP tags) → implementation (cheap, bounded) → validators + mission tests → destructive probes → **played transcript in the real UI** → pacing → human test → freeze report + vault sync.
Scale down honestly: an examine-only beat needs a lightweight contract, one ledger row, a channel decision and tests; not the whole pipeline.

## Story truth
Any story-design work (facts, timeline, character knowledge, revelations) starts at
`docs/story/README.md`, not here. That page owns objective truth, provenance and the
change-record contract; the narrative process below stays about beats, scenes and wiring.

## Non-negotiables (system §3 hard gates)
Nothing is spoken before it is rendered to the speaker on every route. Observations a system depends on are mandatory (freedom is in order, not coverage). Objectives, gates and optional/mandatory declarations are one contract; refusals speak in the fiction. The UI never offers a conclusion before its premises; feedback gives the link or an action, never the verdict; the notebook asks, does not explain. Every state write has a reader or an INTENTIONAL-UNRESOLVED tag. One owner per actor/target. NPC acceptance is not world truth; the player's theory is never graded by the system. No design ids in player text. No new engine primitive without repeated production pressure.

Heuristics (aphorism budget, enter late / leave early, NPC budget, rhythm) are diagnostics: report a violation, argue it, do not auto-fix.

## Who does what (system §19)
Fable / lead: engine, truth, beat structure, evidence interpretation, scene and voice contracts, all wording, repairs, final review. Cheap agents: discovery, topology, ledger filling, route tracing, wiring from a frozen spec, tests, captures, docs mechanics. Hybrid: cheap evidence → Fable decides. Fable never greps; a cheap agent never chooses a word.

## What can be certified
Validators and audits certify **structural validity**. Fun, natural, memorable, moving, suspenseful: hypotheses until `templates/human-test.md` is run with real people (five fixed questions, raw answers kept verbatim).

## Paste-able contract
See system §17 ("NARRATIVE AUTHORING CONTRACT"). Doctrine changes: `docs/narrative/CHANGELOG.md` (OLD · NEW · EVIDENCE · WHY).
