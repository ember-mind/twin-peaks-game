# Playable Build 01: final checkpoint deadlock

The unseeded production run 35104963254 passed all act boundaries, M10, the actual Lodge and the post-Lodge station. It stopped on `nf.epilogue.exit.03`: every A press attempted completion, the persistence callback returned `finale_not_pending`, and the transaction restored the last page. Browser evidence and 20 earned checkpoints are retained in the run artifact. This run is not a completion pass.

Root cause: `NarrativeFinale.complete()` changes stage to `complete` before calling the final checkpoint callback. `NarrativeSave.rebindClassicForFinale()` only allowed `isPending()`, which is already false at that instant. No amount of ordinary player input could commit the final transition.

The repair grants synchronous completion-checkpoint authority only around that one callback. It is cleared in `finally` on both success and failure. Ordinary writes when no finale is pending, including after a completed game, remain refused. The final save must still pass validation and commit before the completion callback opens the ending/clears saves. This is not a force-save option or a new public mutation shortcut.

The focused test uses the actual finale interpreter, actual save layer and validated narrative state, with explicitly labelled fixture storage/adapter. It traverses the Lodge to the last page, injects one storage write failure, checks rollback of state/end flag/envelope/generation, retries successfully, and verifies completion is emitted once and terminal authority does not leak. It fails on the original code before reaching the injected write. With the repair it passes locally, as do the existing 27 finale cases, 41 Act 5 ownership checks, smoke (415) and walkthrough (85 acquisitions). Hosted validation and the unseeded full-route rerun must also pass before campaign acceptance.

No narrative wording, plot choice, save schema, main merge, deployment, Vault write or human test. Human playtest: NOT_RUN.
