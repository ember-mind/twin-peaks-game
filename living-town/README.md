# Living Town

An experiment that shares the Ember Engine with the Twin Peaks game: a small
street whose inhabitants decide for themselves, minute by minute, and a page for
watching them. Plain script tags, `LT` / `EMBER` / `GAME` globals, a 256×192
canvas, no build step. Nothing here calls a language model.

Serve the repository root over HTTP and open `living-town/index.html`.
`?world=new` starts a new world without touching the stored one; `?cast=pair`
makes it the original two-person world instead of the five-person street.

## The rules it is built on

- **One authoritative state** (`sim.state`). The page, the view, the story
  readings and every capture tool are projections: they read, they never write.
- **One way the world changes**: an action from the catalogue (`js/lt-actions.js`),
  chosen by a person's own policy from the candidates perception offers them,
  walked to, and only then done. Nobody acts from across the room, and nobody
  is decided for — a conversation is proposed by one policy and joined or
  declined by the other's.
- **A policy sees only its request** (`js/policy/lt-policy.js`). It cannot see
  the world, invent an action, or learn what its person could not perceive.
- **A watcher changes circumstances, never choices** (`js/lt-interventions.js`,
  `js/lt-hand.js`): one register, validated when scheduled and again when applied.
- **Saves are exact** (`js/lt-save.js`): a loaded world evolves identically to
  one that never stopped, or the save is refused by name. Format and town
  changes go through migrations written against real old saves.
- **Names and looks are generated once from the seed** and kept in state. The
  world's content names nobody.

## Where things are

| | |
|---|---|
| `js/lt-world.js` | rooms, furniture, who lives here (ids only), travel times, the town fingerprint |
| `js/lt-sim.js` | the simulation: tick, activities and their phases, conversations, promises, goals, hunger, settling old days |
| `js/lt-perception.js` | what a person can see, and the candidates they are offered |
| `js/policy/` | the boundary, the offline `UtilityPolicy`, mock and recorded policies, the text brief, the remote adapter, the hybrid |
| `js/lt-story.js` | what a watcher is told: why, what is at stake, the day looked back on, bonds, pace, beats |
| `js/lt-view.js`, `js/lt-appearance.js` | the picture: rooms, inhabitants by look, poses by activity and phase, the hour's light |
| `js/lt-observer.js`, `js/lt-persistence.js` | the page: speeds and Auto, save / resume / new world, make something happen, timeline and looking back |
| `content/` | packages: everyday opportunities (book, parcel), lost wallet, everyday props, activity poses and daylight, town places (park, street, homes) |
| `docs/policy-provider-contract.md` | what is in place for a language-model provider, and what is not |
| `docs/boredom-baseline*.json` | how watchable three days are, as numbers; gated |

## Checking it

```
node living-town/test/run-all.js                    # the Node suite, no browser
node living-town/tools/measure-boredom.js [--cast=town] [--write-baseline]
node living-town/test/page-story-browser.js         # real Chrome
node living-town/test/page-persistence-browser.js   # real Chrome
node living-town/tools/capture-poses.js             # and capture-cafe / -everyday / -interaction
```

One Chrome driver at a time on a machine: take `mkdir /tmp/lt-chrome.lock`
first and `rmdir` it after. Anything that changes how the town behaves must
regenerate both boredom baselines on purpose, or the suite fails.
