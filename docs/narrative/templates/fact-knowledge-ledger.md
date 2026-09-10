# Fact & Knowledge Ledger — `artifacts/<milestone>/fact-knowledge-ledger.md`

PURPOSE: prove, fact by fact, that nobody speaks what has not been rendered to them. Schema metadata is not acquisition: a flag, an evidence id or a proposition state licenses nothing; a rendered page on every route does.
WHEN REQUIRED: any milestone that transfers a fact to Cooper, the player or an NPC. One row per load-bearing fact. Pure-atmosphere beats: skip.

FIELDS (one table):
`# | fact | OBJECTIVE TRUTH (docs/story ref) | source/status | WHO KNOWS | WHO SUSPECTS | WHO FALSELY BELIEVES | WHEN DISCOVERABLE (beat/node) | SUPPORTING EVIDENCE (ids) | RENDERED ACQUISITION (page id + quoted text) | COMMIT PHASE (prepare node / commit node) | WORDING GUARD (what no one may say before this row fires)`
Then: "Violations in the proposed text" (numbered, each with the offending line and the rule) and "Frozen corrections" (rows overridden by the audit).

PASS: every row has a page id in RENDERED ACQUISITION or the honest word "none" plus a fix in the corrections; every wording guard has a reader (a validator line or an audit check); runtime facts respected (comparison done = proposition state; choice-only node done = its value).
FAIL: a row whose acquisition is "the player knows from Act n" with no page; an NPC line asserting a fact whose row says WHO KNOWS excludes that NPC; a guard nobody checks.

WHAT NOT TO PUT HERE: story truth itself (reference docs/story), dialogue rewrites (only the guard), test code.
