# Plugging a language-model provider into Living Town

The town, its tests and the page call no model. One transport is shipped for
whoever wants one — TypeSafe's Jev, below — and it is only ever run on purpose.
This is what is in place for a provider, and what is deliberately not.

## The boundary (unchanged)

`living-town/js/policy/lt-policy.js`. A policy is `{ id, decide(request) -> Promise<response> }`.
It may choose only among `request.candidates`; the simulation re-derives the
chosen candidate from the present world, so a stale, superseded, illegal or
late answer is refused by rules that already exist and are tested
(`test/async-safety.js`, `test/policies.js`).

## What a wordy provider gets

`LT.PolicyBrief.render(request)` → `{ system, user, schema, chars }`: the same
request as plain text, about 600 tokens in a five-person town, hard-capped at
`MAX_CHARS` (memories are trimmed first, the option list never). It contains
what the request contains and nothing else: no other person's money or hunger,
only "looks unwell" for someone in the room.

Reply: JSON anywhere in the text, `{"choose": "<option id or number>", "reason": "...", "say": "..."}`.
`LT.PolicyBrief.parse(request, raw, source)` never guesses: anything that does
not name an option on offer becomes an error response, and the simulation's
fallback (the person waits, tagged `fallback:policy_error`) takes over.

## Words

`response.words = { reason?, say? }` — optional, the provider's own, cleaned to
one capped line each (`LT.Policy.cleanWords`: 160 / 240 characters, no control
characters or markup). They change no mechanic: the same two people with and
without words do exactly the same things (`test/remote-policy.js`).

- `reason` is kept on the decision record and shown as
  `<provider> gave this reason: "..."` — quoted and attributed, never presented
  as the page's own account, and never invented when absent.
- `say` exists only for `talk_with`, `join_conversation` and
  `decline_conversation`. It is spoken at the moment it would be — walking up,
  joining, declining — stored on the conversation (`conv.lines`, with the
  provider's id) and emitted as a `SAID` event, so whoever is in the room hears
  it and remembers it, and it reaches later requests through `memories`. If the
  moment never comes, the line is dropped.
- The offline `UtilityPolicy` has no words, and nothing is ever said for it.

## Turns within a talk

Nine and seventeen minutes into a talk, each of the two is asked — through
their own policy, while the talk goes on — whether to carry on. The request's
`context.reason` is `conversation_turn` and its only candidates are
`keep_talking:<conv>` and `wind_down:<conv>`; nothing else can be chosen
mid-talk, and the two are offered at no other time. Each candidate's `meta`
carries who the talk is with, the minutes so far and left, and the last lines
said (`said: [{ byId, text }]`), so a provider answers what it was just told.
`say` on either answer is spoken at once. So a talk is up to six lines:
opening, reply, and two exchanges.

Either person winding down ends the talk with that minute. It is still one
talk with one settlement, for the minutes it lasted. A turn has three town
minutes to be answered; no answer, an error or an unavailable provider all
mean "carry on", are recorded (`turn_lapsed`), and never drop anyone into
waiting mid-talk. The offline policy carries on for company and closes for
hunger, tiredness, a shift that has begun, or a promise the rest of the talk
would squeeze out. A save taken with a turn open re-asks it on load.

## Slow and unreliable

`LT.RemotePolicy.create({ id, label, transport, timeoutMs, maxInFlight, patienceMs })`.
`transport(brief) -> Promise<string|object>` is supplied by whoever wires a
provider; this repository ships none. The adapter bounds requests in flight,
bounds real time per request, drops a reply that arrives after its timeout, and
turns a throw, a rejection, a timeout and an unusable reply into ordinary
responses. `policy.stats()` gives asked / answered / timeouts / errors /
unusable and p50 / p95 latency.

The page holds the town's clock while a question is out with a `remote` policy,
for at most `patienceMs` from when it first saw the question, and says whom it
is waiting for. It stops holding the moment the answer is in. After that the
simulation's own timeout (`decisionTimeoutMinutes`, town minutes) applies as before.

## Jev

`living-town/tools/jev-transport.js` (Node). Jev does not write: it returns one
option and a probability for each. So the question is a single Choice whose
options are exactly the request's candidates, in words (`brief.options`, with
`brief.situation` as the state); what comes back is a candidate id plus the
distribution, or an error. There is no `reason` and no `say`: nothing is put in
anybody's mouth. The key is read from `TYPESAFE_API_KEY` or
`~/.config/typesafe/.env`, goes in the Authorization header and nowhere else,
and is never in the repository or a page. `test/jev-transport.js` covers all of
it with a stand-in for the network.

`node living-town/tools/run-with-jev.js --days=1 --budget=40 --gap=3` lives a
town day with close calls sent to Jev and prints cost and the boredom numbers
beside the same day offline. It makes real, billed calls. First measurement
(2026-09-21, jev-1.13.0): 40 questions, 0 errors, p50 252 ms, p95 644 ms,
36k tokens in / 3k out, 11 s of wall time for the day; at `closeGap` 3 the day
is much the same as offline, because near-ties are mostly "wait or not".

## Not done, on purpose

- No relay for the page yet. A browser page must not hold a key; the page will
  reach Jev through a small local relay the operator runs.
- Looking back in a world with a provider plays recorded answers instead of
  asking again: the page wraps every remote policy in a recorder from the
  moment it follows a world (`O.recordRemote`), and a replay registers players
  under the same ids until "Back to now". A replay that stops matching the
  recording says so. The recording lives in the page: it is not saved, so
  after a reload only moments since the reload can be looked back at.
- A talk has no topic of its own: what it is about is whatever the lines say.

## A budget

`perTownDay: N` on `LT.RemotePolicy.create` caps how many questions are sent in
one day of the town's own calendar. Past it a question is answered
`unavailable: budget_spent` without being sent; one that expired in the queue
is not sent either. `stats()` reports `sent`, `overBudget` and `sentByTownDay`.
Inside a hybrid, a spent budget means the offline answer stands in for the rest
of that day — the town goes on, more plainly. A five-person town asks about 300
questions a day, a third of them mid-talk; with `closeGap` 3 roughly one in ten
is close enough to go to the provider.

## Asking only when it matters

`LT.HybridPolicy.create({ id, fast: 'utility', slow: '<remote id>', closeGap })`
asks the offline policy first. A clear choice (its lead over the next different
thing to do is more than `closeGap`) is answered there and the provider is
never asked whether to sleep at midnight. A close call goes to the provider;
if that fails in any way, the offline answer stands in, so a provider outage
degrades to the offline town instead of to people standing about waiting.
Every choice carries its source (`hybrid:utility:clear`, `hybrid:<remote>`,
`hybrid:utility:stood_in`). In the default day about half of one person's
choices are close at `closeGap` 15, and one in ten at 3.
