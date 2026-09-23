Three-day default town trace (`LT.Scenario.town({})`, D1 06:00–D4 00:00) found four behavior defects: Mira can repeat an impossible food plan while waiting at home for 13h43, then oscillate through town while hungry; accepted shared-meal promises break four times while both people are in the café; and all five residents start their night sleep by 21:34, with some still above 60 energy. Trace also found 52 talks, all 52 adjacent/near, 0 broken work-shift commitments, and 0 policy-factor/selected-action mismatches. Chrome CDP could not start in this runner (`nice(5) failed: operation not permitted`), so evidence comes from identical headless Node execution of project simulation API.

## Findings

### 1. Mira’s food-hour plans become an all-day wait loop

**Severity**: P1 (clearly wrong, visible to any player)

**Where**: Living Town default world, Mira (`resident_e`), D2 06:46–20:29. `living-town/js/lt-intentions.js:95`, `living-town/js/policy/lt-utility-policy.js:329-337`.

**What**: Mira sets 14 consecutive hour plans on D2. Eight plans from 12:52 through 19:59 are `intent_food`, but every activity in those eight hours is another 10-minute `wait`; she remains at `flat_e`. She eats zero meals on D2 and reaches `WENT_HUNGRY` at D2 21:19 with hunger 88.01. A food intention should produce a feasible food/help action or change plan when no food exists, not repeatedly declare food and stand still.

**Evidence**: `node .audit/lt-behaviour-node-run.js` → [.audit/lt-behaviour/trace.json](lt-behaviour/trace.json). Trace excerpts:

```text
D2 12:52 INTENDED ... intent_food; D2 12:52, 13:02, 13:12, 13:22, 13:32, 13:42 wait
D2 13:53 INTENDED ... intent_food; D2 13:53–14:43 wait
D2 14:54, 15:55, 16:56, 17:57, 18:58, 19:59 INTENDED ... intent_food; each window starts with wait
D2 21:19 WENT_HUNGRY Mira ... hunger 88.01; money 3; pantry 0
```

The same run records 81 Mira `wait` starts on D2 (810 wait minutes), with no `ATE` event for her that day. `offlineScore` makes food planning positive once hunger reaches 55 (`lt-intentions.js:95`), while `fits` only recognizes actual food actions or travel to café (`lt-intentions.js:76`); `wait` has a positive baseline (`lt-utility-policy.js:329-331`).

**Suggested fix**: Do not offer/select `intent_food` unless a food or help route is currently feasible. Add a persistent resource-recovery action (ask a nearby person, withdraw savings, or schedule help) and cap repeated waits before replanning.

### 2. Hungry fallback sends Mira into a public-place pacing loop

**Severity**: P1 (clearly wrong, visible to any player)

**Where**: Living Town default world, Mira, D3 18:11–21:03. `living-town/js/policy/lt-utility-policy.js:306-317`.

**What**: Mira makes 17 departures in 172 minutes while her active intention is food. She cycles café → home → café → home → park → café → home → park → café → home → park, with short waits/talks but no meal. She goes hungry at D3 19:20 while still at the café (`hunger: 88.04`, `money: 5`, `pantry: 0`). This is pacing, not believable help-seeking: each public destination receives the same `find_help` score, but no helper or resolution is selected.

**Evidence**: Trace departure sequence in `.audit/lt-behaviour/trace.json`:

```text
D3 18:11 cafe>flat_e
D3 18:38 flat_e>cafe
D3 18:55 cafe>flat_e
D3 19:02 flat_e>park
D3 19:12 park>cafe
D3 19:21 cafe>flat_e
D3 19:28 flat_e>park
D3 19:37 park>cafe
D3 19:41 cafe>flat_e
D3 19:48 flat_e>park
D3 19:57 park>cafe
D3 20:01 cafe>flat_e
D3 20:08 flat_e>park
D3 20:18 park>cafe
D3 20:22 cafe>flat_e
D3 20:29 flat_e>park
D3 21:03 park>flat_e
D3 19:20 WENT_HUNGRY Mira ... hunger 88.04
```

The selected decision at D3 19:12 is `travel:cafe`, score 18.2, with factors `find_help:16`, `intention:4`, `travel_cost:-1.8`; subsequent selected travel decisions alternate destinations. Policy code grants `find_help` to any open public destination when hungry, broke, and alone (`lt-utility-policy.js:312-317`), but does not bind travel to a specific available helper or stop retrying failed searches.

**Suggested fix**: Resolve help-seeking to a known person and remember failed/no-help locations. After one failed search, keep Mira in one place or route to home/food recovery instead of scoring every public destination equally.

### 3. Accepted shared meals break at deadline while both people are in the café

**Severity**: P1 (clearly wrong, visible to any player)

**Where**: Living Town default world, Sanne (`resident_c`) and Laleh (`resident_d`), D2 13:31 and D3 13:31. `living-town/js/lt-sim.js:630-643`.

**What**: Four `COMMITMENT_BROKEN` events cover two accepted café meals, two people per day. At each break both Sanne and Laleh are in `cafe`; Sanne is working the counter and Laleh is waiting, about five tiles apart. They never start a talk with each other in the meal window, then both commitments expire at 13:31. A committed shared meal should reserve/coordinate a meeting or visibly decline before the deadline, not silently let both parties remain in the same room until the promise is broken.

**Evidence**:

```text
D3-day trace summary: MEAL_ACCEPTED 8; COMMITMENT_BROKEN 4
D2 12:03 Sanne selected work_shift; factors include commitment_conflict:-21.51
D2 12:24 Laleh selected wait; D2 12:34, 12:44, 12:54, 13:05, 13:15, 13:25 wait
D2 13:31 Sanne COMMITMENT_BROKEN ... Eat with Laleh ... deadline_passed
D2 13:31 Laleh COMMITMENT_BROKEN ... Eat with Sanne ... deadline_passed
D3 13:31 same two COMMITMENT_BROKEN events
```

At each break trace state is `resident_c: cafe/work_shift`, `resident_d: cafe/wait`, Manhattan distance 5. `evaluateCommitments` breaks every still-open commitment once `now > due + grace` (`lt-sim.js:630-643`); no meal-specific action or stronger near-deadline coordination overrides ordinary work/wait choices.

**Suggested fix**: Make an accepted meal create a concrete café meeting action/route with near-deadline priority, or explicitly decline/reschedule when work makes it unreachable. Do not leave both characters in café with no action that can settle the commitment.

### 4. Night sleep starts too early, including when energy is high

**Severity**: P2 (noticeable flaw)

**Where**: Living Town default world, all residents, evenings D1–D3. `living-town/js/lt-actions.js:75-91`, `living-town/js/policy/lt-utility-policy.js:108-112`.

**What**: Exactly 15 evening sleep activities start between 20:30 and 21:34: all five residents on each of three days. Examples: Teodora starts D3 20:34 with energy 64.16; Laleh starts D2 20:37 with energy 65.20. Each is planned for about 540 minutes. Configured planning wake window runs until 22:30, so the town visibly shuts down roughly two hours early.

**Evidence**: Trace list: D1 starts at 20:31, 20:33, 20:39, 20:50, 21:34; D2 at 20:30, 20:32, 20:37, 20:40, 21:33; D3 at 20:34, 20:35, 20:53, 21:16, 21:23. Sleep eligibility stops penalizing sleep after 20:30 (`lt-actions.js:84-89`), and policy applies no `wrong_hour` penalty after 20:00 while its `night` bonus begins only at 21:30 (`lt-utility-policy.js:108-112`).

**Suggested fix**: Align sleep eligibility/scoring with intended 22:30 awake boundary, or add an evening-time penalty until later bedtime unless energy is genuinely low.

## Negative checks

- Work: 24 `WORKED`/`WORKED_EXTRA` events; 0 broken `cmt_shift` commitments. Nadia worked 13 blocks, Sanne 12.
- Meetings/proximity: 52 `TALK_BEGAN` events; 0 non-near starts in captured event-state checks.
- Decision explanations: all 1,187 decisions had selected candidate score equal to maximum diagnostic factor score.
