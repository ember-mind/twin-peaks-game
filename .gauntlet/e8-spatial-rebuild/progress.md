# Gauntlet — e8-spatial-rebuild

## Goal

Functional Great Northern lobby with believable check-in, waiting, upper-floor circulation and source-linked ambience

## External bar

assets/ref/great-northern-lobby-sheet.png bottom panel plus playable hotel circulation

## Scope and inventory

User approved expanding lobby geometry and coordinated lobby-side door/Cast positions. Room 315 interior, Town-side endpoint, protected renderer files, and actor ownership remain unchanged. Spatial program: `docs/great-northern-lobby-spatial-study.md`.

| Unit | Baseline /10 | Floor | Current |
|---|---:|---:|---|
| Arrival and circulation | 4 | 8 | 8, pass |
| Reception and service | 5 | 8 | 8.5, pass |
| Hearth lounge | 4 | 8 | 8 entry; more visible from hall in round 2 |
| Stairs and hall | 7 | 8 | 9, pass |
| Light and ambient | 4 temporal | 8 | selected R3 6.5; R4 3 rejected; below floor |
| Integrated world | 5 | 8 | 8 entry, 8.1 hall; pass |

## Evidence

Reference: `evidence/reference-bottom.png`, supplied bottom panel. Baseline: `evidence/baseline.png`, prior production Cast-present capture. Fixed new entry capture: `test/shot.sh hotel_gn 9 10 up <out> --retro --narrative`; hall: `test/shot.sh hotel_gn 16 2 down <out> --retro --narrative`. Native viewport 256×192; map becomes 320×192 and pans.

## Latest verdict

Round 1 judged by fresh Luna/xhigh critic on PNGs only. Entry integrated 8; hall integrated 7 because hearth lounge is cropped. Round 2 moved hotel hall camera one tile west. Fresh Luna/xhigh critic ranked it better, hall 8.1. Round 3 added source-driven receiving-plane pulses; fresh temporal critic ranked it better but 6.5, below floor. Round 4 focused desk/bell; fresh temporal critic scored 3 and tied it against R3. R3 retained as best. Four-round cap reached. No transferred visual pass from prior run.

## Gap queue

Desk/counter and bell still lack PNG-proven source-linked motion. Remaining non-blocking visual gap: hall frame is right-heavy versus reference. No further visual round authorized under cap.

## Final gate

Native gates pass; Chrome Act 4 all paths 530/530 and Act 3 189/189 pass on
selected Round 3 build. Tracked test-generated artifacts restored. Release
audit remains FAIL solely on ambient visual floor 6.5/10 and unresolved
source-linked desk/bell light gap.
