# Living Town, playable: the plan

Decided on 2026-09-22 after a question-by-question interview. This is the
reference for the next phases; each phase lands as its own PR on `main` with
the gates green. Anything not listed here is not decided.

## What it is

One town, shared by everyone who opens the page. Five residents with a written
character each live there around the clock, deciding for themselves with Jev as
their mind. Spectators watch, adopt a resident, change circumstances with a
small hand of actions, and bet on the forks that matter. Nobody chooses for a
resident: watchers change the world, Jev chooses, the simulation carries it out.

## Decisions

### One town, on a server

- A single Node process owns the authoritative `sim.state`. Browsers are
  projections. No horizontal scaling: it is *the* town.
- Plain `http` + `ws`, no framework. Static files and the WebSocket from the
  same process. Saves to a volume every town minute (the exact save format);
  the decision and intervention log as JSONL beside it.
- Deployed as one container on Coolify by the owner, `TYPESAFE_API_KEY` in the
  environment. Restart resumes from the last save; browsers reconnect.
- Production admin commands: pause / resume, restart from last save. No speed
  control in production, ever.

### The clock

- Day: one town minute = ten real seconds (6x). A town day is about four real
  hours; nobody in the audience can fast-forward.
- Night runs at the same speed. Things happen at night (see town events); a
  dark, dead hour is not acceptable.
- The developer runs the same server locally with `--speed`, pause and
  single-minute step, with Jev or a mock. The production log replays offline at
  any speed through the same mirror simulation the browser uses.

### The browser mirrors the simulation

- On connect a browser receives an exact save and the server clock, then only
  what is not deterministic: policy answers by question number (as
  `RecordedPolicy` already keeps them), interventions, town events. It runs the
  same simulation in step with the server clock and renders the true walk at
  full frame rate.
- Every town minute the browser compares a state fingerprint with the server's.
  On a mismatch it asks for a fresh save and restarts. A hidden source of
  non-determinism shows up there, not in a silently different town.
- Traffic: a save on entry, then hundreds of bytes a minute.

### Jev as the mind (hybrid, two levels)

- **Intentions.** Every 30 to 60 town minutes, and whenever an intention is
  spent, Jev picks what the person means to do with the next hour from a short
  list (work, seek company, stay in, go out to the park, see to an errand…),
  with the character sheet, needs, promises and recent memory in the state.
  The offline `UtilityPolicy` carries the intention out minute by minute.
- **Forks.** Jev decides the choices that change the story: to talk or not,
  invite / accept / decline, help someone in need, keep or return what was
  found, close a conversation, honour or break a promise, and what to do when
  woken at night. Roughly 30 to 60 a town day, on top of ~50 intentions.
- Forks are **announced** three town minutes ahead (thirty real seconds) so
  the audience can bet and latency is absorbed. A question not answered in time
  falls to the offline policy.
- Jev returns a choice with probabilities; it writes no text. No `reason`, no
  `say`.
- Budget: 800 questions per real day on the server. Beyond it, or when Jev is
  down or slow, the town goes on with the offline policy **and says so**: a
  small "mind offline" mark, predictions suspended, offline decisions marked in
  the log and timeline. Never pretend.

### Character sheets

- Authored, one per resident, in a content package (`content/cast-v01/`),
  keyed by resident id, never by name: four to six lines (character, what they
  want this year, what they fear, how they treat others, a vice) plus a couple
  of starting relations. The four numeric traits already in the world are kept
  aligned with the sheet.
- The sheet is what Jev reads as `person`, and what the page shows as "Who
  they are". Original people of an original town; nothing from Twin Peaks.

### Spectators

- Identity: a random token in the browser plus a required display name.
  Nothing else, no accounts. Tokens and scores are held per identity on the
  server; purses recharge per IP, not per token, so ten tabs are one purse.
- **Adopt a resident.** On entry you pick who to follow. The page puts you in
  their life: this hour's intention, what they lack, who owes them what. Your
  hand is aimed at them.
- **The hand, with a purse.** You enter with a full purse (5) so the first
  action is immediate; it recharges one every two real minutes of presence, cap
  5. Costs: book or note 1, parcel 2, money or bill 3, extra shift 3, a café
  dinner invitation in the house's name 2. Town-wide: at most one new
  circumstance every three town minutes, queued after that. Every action is
  attributed in the timeline by display name.
- **Predictions.** Each announced fork shows its options for thirty real
  seconds; spectators bet. Jev's choice and probabilities arrive; betting
  against the odds and winning earns tokens. No cost to us: the probabilities
  already exist. No influence on the choice.
- The hand changes circumstances, never choices. Unchanged rule, unchanged
  register (`LT.Interventions`).

### The picture

- **Outdoors becomes one continuous map** in the Twin Peaks style: street, park,
  the five house fronts and the café front, about 40×24 tiles (640×384 px).
  Travel is real walking on it; the minutes table dies, travel time is path
  length. World fingerprint, save migration and both boredom baselines change.
- **Overview**: the whole outdoor map on a larger logical canvas (640×384,
  integer CSS scale), every resident visible: outdoors as their true figure,
  indoors as a lit window with their name. Click a figure to follow.
- **Follow**: outdoors, the camera scrolls with the person on the big map;
  indoors, the room as today.
- Quality bar: the Double R for interiors (café already uses the production
  renderer), Twin Peaks exteriors (sheriff's street, Roadhouse) for the map.
  Fresh critic on screenshots only, rank + score + one gap, stop at parity with
  two fresh critics or after five rounds without movement.
- UI language: English.

### Town events

- A new source of circumstances: `world`, through the same intervention
  register (validated, in the timeline, never a choice). A seeded generator
  draws from a calendar with per-hour odds: one or two a night, two or three a
  day.
- Night set: glass breaking / alarm at the café (heard by whoever lives above),
  a storm (everyone; light changes; the park floods by morning), someone coming
  home late singing, a stray dog under the windows, a fall on the stairs (hurt;
  the others help in the morning; a shift lost).
- Day set: a wrong delivery, an hour's blackout at the café, a market in the
  park, a shared bill, a resident's birthday.
- Waking: noise above a threshold wakes light sleepers (high `caution`); the
  woken person gets new candidates (look out, go down, back to bed) and Jev
  decides it as a fork.
- Spectators may buy, with tokens, the events that hurt nobody: the dog, a
  noise, a wrong parcel. The storm and the fall belong to the world.

## Phases

0. Owner merges PR 20 (shared meal). The Jev branch (`feat/living-town-jev`)
   goes up as a PR on `main`.
1. **Playable skeleton.** `living-town/server/`: process, clock, save, log,
   Server-Sent Events (no dependency, in place of WebSocket); browser mirror
   simulation with fingerprint check; display name, purse, adoption; the
   shared hand with costs and attribution; timeline. Offline policy, today's
   graphics. Proof: two browsers see the same town and the same book.
   *Done: `test/live-mirror.js`, `test/live-server.js`, `test/page-live-browser.js`.*
2. **Continuous world.** Outdoor map, real walking, overview and follow camera,
   migration written against a real save, both baselines regenerated. Done
   before any public save exists.
3. **Jev as the mind.** Character sheets, hourly intentions, announced forks,
   predictions, transparent fallback, budget.
   *Partly done (2026-09-23, branch `feat/lt-kit-world`):* hourly intentions
   (`js/lt-intentions.js`: a one-minute `plan_hour` decision, a lean on the
   offline policy); the server's `--jev` mind (`server/town-server.js`: hybrid
   over Jev on close calls, forks and plans, `--jev-budget` per real day,
   default 100, "mind offline" said in every frame); Jev's odds kept with each
   decision; thought bubbles (`js/lt-bubbles.js`: thinking, the fork and its
   odds, the sign of what someone is doing). Not yet: character sheets, the
   three-minute announcement, predictions.
4. **Town events**, world and spectator, with the night set. Delegated to
   DeepSeek as a content package against a written task, like the shared meal.
5. **Paint rounds** on the new map against the Twin Peaks exteriors, by Astra
   with a fresh critic; starts when phase 2 lands, in parallel with 3 and 4.
6. Deploy on Coolify, by the owner.

## Not decided

- Login and a real leaderboard (later, with a migration from the anonymous
  token).
- Night-shift / insomnia content beyond the event set.
- Save growth (~37 KB a town day) for long runs.
