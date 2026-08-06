# C5-C — Manifest degli hook del motore

| File | Funzione | Modifica | Perché è generica (non M5-specifica) |
|---|---|---|---|
| js/engine.js | interact() | 1 riga: `NarrativeAdapter.tryInteractAt(mapId, fx, fy)` prima di objectAt | qualunque missione può registrare target ambientali (object/landmark/sign) nel registro dell'adapter; il motore non conosce né id né missioni |
| js/engine.js | (invariati) | gli hook B2 (onKeyDown/update/interact-NPC) restano identici | già generici |
| js/narrative-engine-adapter.js | WORLD_TARGETS | registro coords→target_id per mappa | le coordinate stanno nel registro (proprietà della mappa), MAI nel nodo narrativo; nessun `if (targetId === 'ring')` |
| js/narrative-engine-adapter.js | enable/tryInteract/genericNodeSession | multi-missione (enteredMissions), sessione generica con resume_choice/continuation/milestone-redirect | guidata SOLO da dati runtime (prepareNode esiti, pendingMilestones); vale per ogni missione futura |
| js/narrative-notebook.js | buildSections/confirmPair | registro multi-missione + errori di sviluppo (duplicate/ambiguous → pair_resolver_error, stato intatto, mai «nessun filo») | contratto C5-C §7 |

Limiti dichiarati C5-C (per C5-D/E): Truman visibile nel traincar dall'inizio
(gating narrativo corretto via worldRoots; l'arrivo scenico è rifinitura
C5-D); posizionamenti via loadMap nel harness (percorsi fisici = C5-E);
confronto P3A eseguito via runtime nel harness (la UI del confronto è
già validata in B3, l'azione M5 è provata visibile nel registro).
