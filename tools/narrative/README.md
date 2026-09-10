# Narrative mission lint

Deterministic studio validator, docs/narrative-system-v0.1.md §16. No LLM calls.

## Checks

1. **Dangling state** (warning) — a flag/evidence/value/proposition written by
   an effect and read nowhere. Caught: `m5_theory_revised`,
   `jacques_statement_terms_known`, `audrey_salvata`, `jacques_death_suspicious`.
2. **Read-before-write** (error) — a condition key no mission effect writes
   and no declared external writer supplies. Protects the Act 3 single-writer
   moves.
3. **Multiple writers** (error/warning) — one evidence id or write-once value
   written by more than one node, unless the writer nodes' own top-level
   `conditions` are provably mutually exclusive (e.g. two `value_is` branches
   on the same enum with different values). Flags are warning-only unless
   listed in `single_writer_flags`. Caught: `east_route_confirmed` (O3).
4. **Required evidence declared optional** (error) — evidence required by a
   mandatory node/objective/milestone/completion, written only by `optional`
   nodes. Caught: Ronette optional (Act 2), ring comparison optional (Act 3).
5. **Shadow pairs** (error) — two world nodes on the same (map, target) with
   identical or overlapping conditions and no provable exclusivity. Protects
   the anti-shadow rule from `narrative-validate-m6`.
6. **Rendered metadata** (error) — node ids, evidence ids, proposition ids or
   `result` codes leaking into any rendered `text`/`label`/`prompt`. Caught:
   result ids in feedback (Act 3 pass 01 gate).
7. **`pages_by_value` domain coverage** (error) — every enum value has a case,
   or the node declares `pages_by_value.partial: true`.

## Run

```
node tools/narrative/lint-missions.js [--json] [--allow=path/to/allowlist.json]
node test/narrative-lint.js   # wrapper used by the test/*.js sweep
```

## Allowlist

`tools/narrative/lint-allowlist.json`:

- `dangling` — keys, each with a `reason` string, exempt from check 1.
- `external_writers` / `external_writer_patterns` — keys (or regexes) whose
  writer lives outside the mission JSON (classic layer sync, etc.), exempt
  from check 2.
- `single_writer_flags` — flags that must error (not warn) on a second writer.
- `write_once_values` — value names checked for multiple writers in check 3;
  defaults to every name in `state-enums.json values_allowed`.
- `documented_multiple_writers` — a specific flag multiple-writer WARNING
  (never an error) that is a reasoned design (e.g. mutually exclusive
  branches), suppressed with a citation.
- `known_open` — a **real, tracked defect** a milestone boundary forbids
  fixing right now: `{ key, check, reason, owner_milestone, found }`. It
  downgrades that one (check, key) error to a `KNOWN-OPEN:` warning so the
  sweep stays green, but the defect is printed on every run, never silent.
  An error may be downgraded this way only with an `owner_milestone`; the
  entry must be deleted the moment the defect is actually fixed — never let
  it rot as permanent cover.

Allowlisting needs a reason string; never allowlist to make a real defect
pass.
