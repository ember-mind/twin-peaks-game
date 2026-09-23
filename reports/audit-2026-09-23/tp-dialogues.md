Audit found one clearly player-visible Italian grammar error, one dead M9 presentation branch, and one conflicting Gerard dialogue definition that changes wording across mission/fallback states. No untranslated player-facing English, story-truth contradiction, broken placeholder, or additional unreachable branch was confirmed. Required structural/story checks pass; browser box verification was attempted but Chrome could not start in this environment, so no visual box defect is claimed.

## Findings

### 1. M4 nurse exchange contains ungrammatical Italian

**Severity**: P1 (clearly wrong, visible to any player)

**Where**: `narrative/missions/M4.json:272-294`, optional world dialogue node `attesa-ronette`, hospital nurse; reachable when `sogno_fatto` is true and `sogno_raccontato` is false.

**What**: Cooper says: “Allora prima lo sceriffo. Lei intanto non la sveglia nessuno.” The second sentence is grammatically malformed: `Lei` as subject conflicts with `nessuno` and the verb form. Player-facing text should be grammatical Italian, for example “Intanto non la svegli nessuno.”

**Evidence**: Source trace at `narrative/missions/M4.json:288-293` contains the exact rendered page with `mode: "dialogue"` and `speaker_id: "cooper"`.

**Suggested fix**: Replace the malformed sentence with the intended grammatical construction, then regenerate narrative data if the project’s normal source-generation step requires it.

### 2. M9 exposes dead P7 presentation code, duplicated with P8

**Severity**: P2 (dead/unreachable dialogue branch)

**Where**: `narrative/missions/M9.json:519-537`, `m9_present_truman.presentation.on.P7`; option filtering is in `js/narrative-runtime.js:448-454`.

**What**: M9 defines a P7 rejection page and already-rejected page, but no mission effect ever writes `P7.formulation.status = formulated`. The runtime only returns presentation options whose proposition is already formulated, so P7 can never be selected. Its rejection text is also an exact duplicate of P8’s text at `M9.json:499-517`: “Lo tengo a mente. Ma non convoco un uomo per una teoria.”

**Evidence**: `node test/narrative-lint.js` reports:

```text
WARN [read-before-write] ... proposition_path "P7.formulation.status" is read but never written by any mission effect ... M9's m9_present_truman node ... has a presentation.on.P7 branch, but no mission node anywhere formulates P7 ... the branch is currently dead code.
narrative-lint: PASS (7 checks, 1 warnings)
```

`NR.presentationOptions()` tests `peekProp(state, pid).formulation.status === 'formulated'` at `js/narrative-runtime.js:450-453`; the M9 P7 block is at `narrative/missions/M9.json:519-537`.

**Suggested fix**: Remove P7’s M9 presentation branch if P7 is intentionally never formulated, or add an authored P7 formulation path and unique response text if it is meant to be playable.

### 3. Gerard’s `gerard_a2` dialogue has conflicting mission and fallback wording

**Severity**: P2 (noticeable continuity inconsistency)

**Where**: Mission version `narrative/missions/M4.json:762-805`; cast baseline `narrative/cast/windows.json:308-319`; classic fallback `js/data.js:472-480`.

**What**: The same logical dialogue key `gerard_a2` has two different player-facing scripts. During M4, Gerard says “Attraverso il buio del futuro passato... il mago desidera vedere.” and “Uno canta fra due mondi... FUOCO CAMMINA CON ME.” (`M4.json:792-805`). The classic definition says “...Attraverso l'oscurità del futuro passato... il mago desidera vedere.” and “Una sola occasione tra questo mondo e l'altro: FUOCO CAMMINA CON ME.” (`js/data.js:476-477`). The cast baseline points Gerard at that same key (`windows.json:318`). After M4 is not entered, `js/engine.js:749-752` falls through from the narrative adapter to the classic `startDialogue` path, so visiting Gerard can show different wording depending on mission state.

**Evidence**: The two source definitions contain the quoted conflicting lines. Runtime routing is explicit: `js/engine.js:749-752` tries narrative interaction, then calls `startDialogue(resolveDialogue(npc.dialogue))` when no narrative owner handles it; M4’s entry condition is `narrative/missions/M4.json:9-19` and is disabled by its `atto3` completion flag at `M4.json:21-28`.

**Suggested fix**: Choose one canonical Gerard script and use it in both the M4 mission node and classic fallback, or remove the fallback definition once the narrative actor owns the interaction in every intended state.

## Validation

- `node test/narrative-lint.js`: PASS, 7 checks, 1 warning; warning is Finding 2.
- `node test/narrative-validate.js`: PASS, 3,602 checks.
- `node test/story-truth-lint.js`: PASS, 1,043 checks, 0 warnings.
- Browser pagination probe: attempted under the required Chrome lock and flags; Chrome startup timed out, with direct launch logging `nice(5) failed: operation not permitted`. No screenshot was produced, and no text-box defect is reported.
