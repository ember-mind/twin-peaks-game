# Great Northern — room repair, first checkpoint

[ELI17 walkthrough and evidence](../../reports/room-method-lobby-case-01.md) · [Visual comparison](index.html)

This is a reconstruction of three existing historical revisions, not a fresh art candidate. Current production and Double R remain untouched.

1. `00-baseline-entry.png`: flawed arrival/reception relationships (`3929eca`).
2. `01-layout-entry.png`: recorded room-use repair (`111f924`).
3. `02-layout-hall.png`: the wider layout crops the left hearth at hall return (`111f924`).
4. `03-framing-hall.png`: recorded camera correction, same hall tile (`734215c`).

All are fresh 256×192 game-canvas exports. The comparison page enlarges them with nearest-neighbor CSS; it does not repaint their pixels. [Manifest](manifest.json) records source revisions, commands, provenance and hashes.

## Reproduce without checking out or overwriting production

Run from the repository root. macOS Chrome and the repository's existing native capture dependencies are required. Run only one game screenshot driver at a time.

```sh
case_output="$(pwd)/artifacts/room-method-lobby-case-replay"
mkdir -p "$case_output"
capture_revision() {
  case_snapshot="$(mktemp -d /private/tmp/tp-lobby-replay-XXXXXX)"
  git archive "$1" js assets world narrative test tools index.html |
    tar -x -C "$case_snapshot" || return 1
  (cd "$case_snapshot" && node test/native-shot.js --map=hotel_gn \
    --x="$2" --y="$3" --dir="$4" --narrative=1 --out="$case_output/$5")
}
capture_revision 3929eca907c0b6dff0067d0c3dea41f96f4e8c8a 8 10 up 00-baseline-entry.png
capture_revision 111f924a6380e09e43c886a212ed7c848078e2e0 9 10 up 01-layout-entry.png
capture_revision 111f924a6380e09e43c886a212ed7c848078e2e0 16 2 down 02-layout-hall.png
capture_revision 734215c427cb736ff3161edab0b30b4ea92bc42c 16 2 down 03-framing-hall.png
```

Temporary snapshots are retained for inspection. Live ambient timing can change PNG hashes; these are equivalent-view static layout comparisons, not frame-identical animation tests. If capture times out, record the failure rather than treating a missing or flat PNG as evidence.
