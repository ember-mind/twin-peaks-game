# Playable Build 01: earned classic evidence bridge

The full fresh-profile journey in Actions run 35092763323 earned the opening diary and letter, reached Act 4, then failed because E3_LETTERA_R was absent from the narrative notebook. E1_DIARIO was absent too. Seeded act fixtures explicitly supplied these facts and therefore did not test their production handoff.

Production now imports only actual `diario` and `lettera_r` inventory entries into their existing narrative aliases. Neither entering an act nor opening a dialogue grants these facts. The player still performs every comparison and chooses the interpretation. No story source, wording, source ownership or save schema changed.

Both loaded and live inventory are processed. The import is idempotent and increases revision once when facts are added. At boot the saved-revision cursor retains the durable pre-import value, so an older save repaired from its genuine classic inventory can be saved again without a changed classic fingerprint. No evidence is invented to salvage an invalid save.

A focused fixture uses actual classic dialogue acquisition and the real narrative runtime: 26 local contracts passed, including premature-grant rejection, serialization, duplicate polling and voluntary P8 formulation. Act 3 flow (280) and Act 4 mirror gates (49) also passed locally. Hosted patch validation ran the new fixture, Act 3/4/5 flows, provenance, narrative/story lint, smoke and walkthrough before committing the production change. Permanent CI reruns those checks. Full browser completion is owned by PR #6 and must be verified on the combined changes.

The temporary branch-only patch workflow is removed from the reviewed tree. No merge, deployment, local Vault synchronization or human playtest. Human playtest: NOT_RUN.
