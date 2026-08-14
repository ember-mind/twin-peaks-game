# Canonical source sync

Canonical authoring home remains:

`/Users/ebuccelli/Vault/1. Projects/Twin Peaks Game`

Deploy repository is tested publication copy. Vault contains exact runtime mirror plus historical design material. Deploy was selected as more advanced runtime after semantic diff and full playthrough; stronger Vault dialogue was selectively merged before synchronization.

Exact-equality scope:

- `index.html`;
- 27 production scripts loaded by `index.html`;
- 25 high-resolution portrait PNGs loaded by speaker cards;
- production cast atlas `assets/sprites/cast-walkcycles-16.png`;
- 8 canonical source JSON files listed in manifest.

Vault-only books, gauntlet records, source portraits and 3D models remain knowledge/archive material. They are outside deployed bundle and are never deleted by sync.

Run before selective sync, commit, or deploy:

```bash
node tools/check-canonical-sync.js
```

Normal and strict modes both require complete equality. Strict form is CI/deploy gate:

```bash
node tools/check-canonical-sync.js --strict
```

Use `TP_CANONICAL_ROOT=/path/to/canonical` on another machine only in normal
diagnostic mode. Strict evidence mode rejects environment overrides and refuses
to compare the canonical root with itself. Reconciliation order:

1. inspect semantic diff;
2. choose winner per file or per isolated hunk;
3. apply selective patch;
4. regenerate derived narrative data when mission JSON changes;
5. run native and production probes;
6. copy only selected runtime files into Vault; never use `--delete`;
7. require strict guard PASS.

Guard never selects winner by timestamp. Semantic review and tests select winner first; hashes only prove equality afterward.
