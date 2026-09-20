# Double R — temporal naturalness stress test

Status: **candidate art/runtime unchanged**. QA only. Browser observations ran against commit `2a2677e` with real rAF clocks, real door transitions and direct 256×192 canvas captures. No seek, time acceleration or manual animation trigger.

## Method

- Five independent canonical entries: fresh browser/runtime each run; test page stepped out through diner door, cleared unvisited-scene clocks while outside, then entered through real exterior door. This compensates for the capture page starting inside the diner; it reproduces first initialization rather than a reload choreography.
- Three stationary observations: 90.6 s wall time each; baseline, Act 4 home-night and Act 4 evening gathering.
- Three leave/re-enter cycles in one canonical session: no reset between cycles.
- Entry sampling: ~250 ms. Long sampling: ~1.2 s including lossless PNG capture cost.
- Quiet means no visible human gesture and no intermittent major beat. Continuous steam and clock tick remain background and do not invalidate quiet.

Canonical Cast states:

- `baseline`: Log Lady, Norma, Shelly in diner;
- `home-night`: Norma in diner; Shelly, Log Lady and James canonically home;
- `gathering`: diner named cast absent; Norma, Shelly, Log Lady and James canonically at Roadhouse.

## 1. Compact entry table

Times are seconds after crossing into diner.

| Run | State / owners | Visible staff | Visible guest | Percolator | Relevant overlap | Quiet / verdict |
| --- | --- | --- | --- | --- | --- | --- |
| E1 | baseline | 8.1–13.4 | — in 25 s | 14.6–17.2 | none | 0.3–8.1; 17.2–23.0; natural but wipe leads |
| E2 | baseline | 6.3–9.8 | 20.7–24.7 | 12.4–13.4; 24.0–25.0 | guest + machine 24.0–24.7 | several 4–5 s quiet pockets; readable |
| E3 | baseline | 8.6–12.6 | 22.0–25.0 | 11.6–13.1 | wipe + machine 11.6–12.6 | overlap coherent service activity |
| E4 | home-night; Norma only | 8.3–12.4 | 20.9–24.7 | 9.6–11.1; 22.7–24.5 | machine overlaps each human beat | no competition; machine stays subordinate |
| E5 | gathering; named cast absent | **none** | 21.7–25.0 | 10.3–11.9; 23.2–24.5 | guest + machine 23.2–24.5 | raw wipe clock 7.1–10.6, but renderer suppresses it without Norma |

Evidence: [E1](../artifacts/intent-room-double-r-grid/temporal-naturalness/canonical-entries/run-1-baseline-reentry/manifest.json), [E2](../artifacts/intent-room-double-r-grid/temporal-naturalness/canonical-entries/run-2-baseline/manifest.json), [E3](../artifacts/intent-room-double-r-grid/temporal-naturalness/canonical-entries/run-3-baseline/manifest.json), [E4](../artifacts/intent-room-double-r-grid/temporal-naturalness/canonical-entries/run-4-home-night/manifest.json), [E5](../artifacts/intent-room-double-r-grid/temporal-naturalness/canonical-entries/run-5-gathering-absent/manifest.json).

No staff/guest overlap was sampled in five opening windows. Native inspection of machine/human overlap frames found them plausible and readable; none looked synchronized or competitive. [Overlap samples](../artifacts/intent-room-double-r-grid/temporal-naturalness/review/overlap-samples.png).

## 2. One 90-second timeline

Baseline L1, 90.64 s wall time, 76/76 unique captured frames:

| Time | Visible event |
| --- | --- |
| 0.0–7.5 | human quiet; background steam/clock and sparse lamps |
| 7.5–11.2 | Norma wipes; percolator joins 9.9–11.2 |
| 11.2–20.7 | human quiet; glass 14.8–18.3 |
| 20.7–24.3 | guest drinks |
| 24.3–25.5 | percolator beat after guest action |
| 25.5–41.0 | human quiet; scattered lamps/glass only |
| 41.0–45.7 | Norma wipes; percolator overlaps 41.0–42.2 |
| 45.7–61.2 | human quiet; neon 52.9–54.0; machine 55.3–56.4 |
| 61.2–64.8 | guest drinks |
| 64.8–74.4 | human quiet; machine 67.3–68.4; glass 69.6–73.2 |
| 74.4–78.0 | Norma wipes |
| 78.0–90.6 | human quiet; neon/machine coincide briefly 81.6–82.8 |

[L1 manifest](../artifacts/intent-room-double-r-grid/temporal-naturalness/long/run-1-baseline/manifest.json)

Long-run comparison:

| Run | State | Staff starts | Guest starts | Percolator starts | Longest human-quiet span | Owner check |
| --- | --- | --- | --- | --- | --- | --- |
| L1 | baseline | 7.5, 41.0, 74.4 | 20.7, 61.2 | 9.9, 24.3, 41.0, 55.3, 67.3, 81.6 | 16.7 s | pass |
| L2 | home-night | 6.4, 41.2, 75.7 | 20.7, 66.2 | 8.8, 25.6, 39.9, 53.2, 63.8, 73.4, 86.4 | 21.4 s | pass |
| L3 | gathering | none visible | 20.5, 57.0 | 12.3, 24.0, 34.6, 45.2, 57.0, 69.9, 83.0 | 33.0 s | raw wipe fires 5.1, 39.3, 73.4; always suppressed |

All long runs retained quiet intervals. No frame repetition across sampled reels. Native contact-sheet inspection confirms long observation never becomes visually noisy. Wipe cadence is noticeable under deliberate 90-second surveillance—roughly every 33–35 s—but only three occurrences, separated by long human quiet. It is mildly cyclic, not a blocker. [L1 contact sheet](../artifacts/intent-room-double-r-grid/temporal-naturalness/review/long-baseline-contact.png).

## 3. Re-entry comparison

Same baseline session; no reset after fresh entry.

| Observation | Character clock on entry | Staff | Guest | Major ambient | Reading |
| --- | ---: | --- | --- | --- | --- |
| fresh entry | ~0 s | wipe 8.1–13.4 | none in 25 s | machine 14.6–17.2 | authored opening window |
| re-entry 1 | 17.3 s | none | sip 2.3–8.3 | glass 1.5–5.6; machine 2.8–5.3 | clocks resume; no wipe restart |
| re-entry 2 | 23.0 s | none | none | lamps, then glass 6.1–10.0 | genuinely quiet return |
| re-entry 3 | 30.1 s | none | none | machine 0.3–2.0; neon 7.1–8.3 | different immediate beat; no opening replay |

[Re-entry manifest](../artifacts/intent-room-double-r-grid/temporal-naturalness/canonical-entries/run-1-baseline-reentry/manifest.json)

Result: leaving freezes diner clocks; returning resumes them. `firstDelay` does not restart on map re-entry. No unnatural replay.

## 4. Repeated-pattern finding

Meaningful pattern found on **fresh scene initialization**:

- owner-present wipe starts: 8.1, 6.3, 8.6, 8.3 s;
- spread: only 2.3 s;
- guest action, when observed inside 25 s: 20.7, 22.0, 20.9 s;
- staff always leads guest in observed owner-present openings;
- ambient context varies enough that exact composite sequence does not repeat.

Thus `firstDelay` creates recognizable opening choreography across independent fresh sessions. Normal leave/re-enter play does not repeat it. No human-human overlap was sampled over 270 s of long observation; this is not itself a defect, but machine evidence does not prove that actions feel fully independent.

No accidental clock synchronization found. Percolator sometimes overlaps staff/guest, then drifts away in later cycles and other seeds. Lamp/glass/neon coincidences vary. These are natural coincidences, not locked phase.

## 5. `firstDelay` recommendation

**ADJUST — recommendation only; not implemented.**

Do not remove `firstDelay`: room benefits from early life. Smallest future experiment, only if human test notices rehearsal:

```text
counter-wipe firstDelay: 5000–12000 ms
booth-sip firstDelay:    10000–24000 ms
```

This changes two numeric ranges, permits occasional overlap/order variation and keeps an early readable action. Do not alter recurrence or add scheduling logic from current evidence.

## 6. Human-playtest readiness

**YES — candidate can proceed to human playtest while frozen.**

No owner leak, re-entry reset, implausible overlap, visual-noise buildup or mechanical multi-clock synchronization blocks playtest. Human test should target one question: does first fresh visit feel rehearsed because Norma reliably wipes around 6–9 seconds? Keep current candidate until player evidence answers it.
