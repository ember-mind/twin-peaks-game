# tools/story

Deterministic validator for the Story Truth Layer (`docs/story/`). No LLM
calls, no network, no mutation of source files.

`validate-story.js` parses every `.md` under `docs/story/` (recursively,
skipping `README.md` files) as `--- key: value ---` frontmatter + body, and
checks: required frontmatter fields, id-matches-filename under
`characters/facts/revelations/relationships`, id uniqueness, `source`/`status`
enums, `deprecated` → `replaced_by`, objective-truth provenance in `facts/`,
cross-reference resolution (`[[wiki]]` warns, `path/id` errors), `revelations/`
→ `facts/` and `relationships/` → two `characters/` citations, `timeline.md`
ordering (including `after: T<n>` constraints), sourced knowledge-claim
bullets in `characters/`, the README/CLAUDE.md pointer contract, and
`setup-payoff-overview.md` row classes.

Run: `node tools/story/validate-story.js` (`--json` for machine output), or
via `node test/story-truth-lint.js`. See `docs/story/README.md` for the full
field/check reference and the update contract.
