# Twin Peaks Pokémon — agent workflow

Read `CLAUDE.md` for project structure, constraints, and native test order; rules
apply to every coding agent.

After native tests, run `coldstage run changed --json`.

- If `pixelGate.aiReviewNeeded` is `false`, do not open screenshots.
- If true, inspect only returned `reviewSheet` first; escalate to original crop
  only when overview cannot resolve defect.
- Never approve or replace pixel baseline without matching scoped visual-review
  record whose verdict is `pass` or `pass-with-notes`.
- Run `coldstage stop` only for Coldstage-owned leftovers. Never broadly kill
  Chrome or unrelated project servers.
