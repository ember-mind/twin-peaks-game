# E3 Roadhouse — Gauntlet progress

Status: stopped by budget amendment received after 16 shared full-scene rounds. No post-amendment build/critic round ran. Checkpoint commit: `59dbb7a8930b4f3dda88c58fe1fae11e67da9ec9`.

Goal: native Roadhouse matching `roadhouse-B.png`; borrow from A only neon sign, upright piano, wall trophies. Hard floor: 7/10 per unit.

## Locked evidence

| Artifact | SHA-256 |
|---|---|
| Baseline `baseline.png` | `c48a416cd523d4cb4fee9491c89fb93d1d8a5358a9ff17e200946a92aa6475f0` |
| Latest scored `round-16.png` | `8abebc19ae5ea36e4dbb0156670a3b74ec38c387ea337f057d4f8ddfcaa2e9b1` |
| Shipped cap checkpoint `final.png` | `9aed59c81cc0648791e0a5f27e52fc6e2c9bd83eab50d04b5e85737578101fa9` |
| Gathering `final-gathering.png` | `d49ec7525f272d24247b88b8df000a82a0c996ec7f2eb40539c6623d8baf4450` |
| Giant `final-giant-stage.png` | `9632d0bbe4e8edcd1cf22fe2df95ee96f40f7648b1ead99dbd5cf15ed08f45a0` |
| Phone `final-phone-widget.png` | `7e60fbded5dbcd9fecc11c21ef8931a0fd66e3120878e989ff860a08dfacf5ce` |

Capture remained fixed: `test/shot.sh roadhouse 7 8 up <path> --retro`.

## Scores

| Unit | Baseline | Latest scored | Best | Floor | Status |
|---|---:|---:|---:|---:|---|
| Floor + walls | 2 | 6.5 | 7.0 | 7 | best reached floor; latest below |
| Stage | 1 | 6.5 | 7.2 | 7 | best reached floor; latest below |
| Bar | 1 | 7.0 | 7.1 | 7 | pass |
| Booths + tables | 2 | 6.5 | 7.1 | 7 | best reached floor; latest below |
| Lighting | 1 | 6.0 | 6.5 | 7 | **below floor** |
| Door | 6 | 7.0 | 7.8 | 7 | pass |

Latest scored verdict: `BAR_WINS`. Shipped cap checkpoint contains one already-started material polish completed before amendment receipt; no critic score assigned to that delta.

## Gates on shipped checkpoint

- Smoke: 415 PASS
- Walkthrough: 85 PASS
- Retro production: 54/54 PASS
- Mobile production: 20/20 PASS
- Cast continuity: PASS
- Act 4 flow: 1611/1611 PASS
- Act 4 Chrome headless SwiftShader playthrough: 530/530 PASS across A/B/C/D; only harness favicon 404 observation

Map rows, door, phone, stage/body coordinates, `js/retro.js`, `js/retro-authored.js`, and `js/tiles.js` unchanged. Ambient uses existing archetypes only.
