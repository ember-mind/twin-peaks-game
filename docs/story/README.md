# Story truth (author-only)

What is objectively true in this game, kept apart from what any character knows and from what the player has seen. The runtime never reads this directory; the ledgers cite it. Populating it is a story-owned milestone; this README fixes ownership, schema and update rules only.

## Layout
- `truth.md` — the case: what happened, when, who did what, what the ring is. Author-only; never quoted in a page.
- `timeline.md` — ordered events including off-screen ones; every trace, dating and lie in the game must agree with it.
- `characters/<id>.md` — per character, at each act boundary: knows · suspects · falsely believes · withholds · wants · protected truth. This is the source of leaks and lies.
- `facts/<fact-id>.md` — one file per load-bearing fact across acts: statement, source/status, the ledger rows that acquire it, wording guards.
- `revelations/` — the order truths reach Cooper and the player; what each revelation retires; which remain deliberately open (with the act that pays them, or "finale", or "never").
- `relationships/` — who owes / fears / protects whom, and what each relationship is for dramatically.

## Provenance: two independent dimensions on every entry
- `source`: `canon` (the series) · `adaptation` (changed on purpose) · `project-fact` (invented for consistency) · `new-proposal` · `interpretation` (a reading, not a fact) · `uncertain`.
- `status`: `locked` · `open` · `deprecated`.
Only `canon`, `adaptation` and `project-fact` may be objective truth. A locked `interpretation` stays an interpretation: locking freezes the wording we commit to, never the truth-value. Nothing here is ever "confirmed" by the runtime; the runtime tracks rendered acquisition, not truth.

## Four things never collapsed
objective truth (`truth.md`) · what Cooper knows (fact ledger WHO KNOWS, advanced only by a rendered page) · what an NPC knows / falsely believes / withholds (`characters/`) · what the player has actually seen (pages on the player's route). A line may use only the third and fourth for its speaker; a deduction may be built only on the fourth.

## Update rules
- Changing `truth.md` or any `status: locked` entry requires an entry in `docs/narrative/CHANGELOG.md` (OLD · NEW · EVIDENCE · WHY) and a pass over every ledger row and wording guard that cites it.
- `new-proposal` becomes `project-fact` only by the lead's decision recorded in the proposing milestone's report.
- `deprecated` entries are kept (never deleted) with the date and the replacing entry.
- Sources of existing truth to migrate here (later): vault `Bible - Twin Peaks Game.md`, `Grammatica Indagine - Twin Peaks Game.md`, `M5-M6 v1.1.1 LOCK.md` and the Act 2/3 ledgers. Migration is inventory + tagging, never rewriting the mystery. The Bible's PATCH v0.9.1 prevails over its v0.9 body; body passages it supersedes are listed in `truth.md` §7 and are never a competing authority. Canonical narrative sources live in vault `Twin Peaks Narrative Production v1.0/` (see its `source_manifest.md`); repo-root copies with historical names are deploy mirrors, not authority.

## Entry skeleton
```
---
id: <fact-id>
source: canon | adaptation | project-fact | new-proposal | interpretation | uncertain
status: locked | open | deprecated
owner: lead
since: <date> (<milestone>)
---
Statement (one paragraph, author voice, no page text).
Known by: … Suspected by: … Falsely believed by: … Withheld by: …
Acquired in game: <ledger rows / page ids> (or "not yet")
Wording guard: …
```

Before any change, run `node tools/story/validate-story.js` (wrapped by
`node test/story-truth-lint.js`). It expects: required frontmatter fields
(`id`, `source`, `status`, `owner`, `since`); `id` equal to the filename stem
for files under `characters/`, `facts/`, `revelations/`, `relationships/`;
unique ids across the tree; `source`/`status` from the enums above; a
`deprecated` entry carries `replaced_by:`; a `facts/` entry that declares
objective truth (a body line starting `Objective truth:`, or frontmatter
`truth: objective`) must have `source` in `canon`/`adaptation`/`project-fact`;
`[[wiki]]` and `facts/`·`characters/`·`revelations/`·`relationships/` path
references must resolve; `revelations/` entries cite at least one `facts/`
reference; `relationships/` entries cite two `characters/` references;
`timeline.md` rows (`| T<n> |`) increase strictly per section and an
`after: T<n>` cell must not name a row that appears later; every bullet under
"Knows"/"Suspects"/"Falsely believes"/"Withholds" in a `characters/` file ends
with `(src: …)`; `setup-payoff-overview.md` rows use class
`PAID`/`INTENTIONAL-UNRESOLVED`/`UNPAID` with a non-empty `OWNER` on `UNPAID`.

## Story truth update contract
1. Read `docs/story/README.md` and the relevant truth/fact/character files.
2. Check provenance (`source`) and status before relying on an entry.
3. Update truth only if the current milestone owns that decision (lead).
4. Update the affected Fact & Knowledge and Setup–Payoff ledgers in the same change.
5. Record every truth change in `docs/story/CHANGELOG.md` with the full record.
6. Never promote interpretation to truth implicitly (a locked interpretation is still an interpretation).
7. Never use player uncertainty as an excuse for author uncertainty.
8. Never let series canon override an intentional adaptation silently; record provenance.

## Model economy for story work
FABLE/LEAD REQUIRED: objective truth decisions, hidden truth, ambiguity, motive,
relationship truth, revelation design, source conflicts, canon-vs-adaptation decisions.
CHEAP AGENT SAFE: extracting statements, building timelines from locked material,
locating sources, collecting state writers/readers, filling ledger columns
mechanically, continuity diffing, duplicate detection, provenance indexing.
Cheap agents never resolve conflicting truth; they report both sides.
