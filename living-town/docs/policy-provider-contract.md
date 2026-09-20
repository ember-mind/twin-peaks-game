# Plugging a language-model provider into Living Town

Nothing in this repository calls a model. This is what is already in place for
one to be plugged in, and what is deliberately not.

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

## Not done, on purpose

- No transport, key handling, or server. A browser page must not hold a key;
  the transport should be a call to a small relay the operator runs.
- Looking back in a world with a provider plays recorded answers instead of
  asking again: the page wraps every remote policy in a recorder from the
  moment it follows a world (`O.recordRemote`), and a replay registers players
  under the same ids until "Back to now". A replay that stops matching the
  recording says so. The recording lives in the page: it is not saved, so
  after a reload only moments since the reload can be looked back at.
- A talk has no topic of its own: what it is about is whatever the lines say.
- A budget per day. What exists is `maxInFlight` and the hybrid below.

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
