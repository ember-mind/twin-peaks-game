# Environment Program / Room Critic pilot

`environment.program` is read-only authoring intent on a World Engine environment. It owns no geometry, actors, doors, scene lifecycle, art, or narrative state. The first pilot is `sheriffs-station/interior` only. Compare its Program to a **real native frame and playable route**; metadata compliance alone is not success.

World Engine validates Program shape and, when the native scene exposes its existing layout through the map, resolves anchor names at registration. Loaded maps with anchor-bearing Programs must provide that layout. The alias is non-enumerable and non-replaceable; it references scene-owned layout, not a new geometry registry. Current Sheriff pilot tests separately check `NEAR` adjacency and `REACHABLE` map traversal; other scenes without a Program are unchanged.

## Review pass

1. Capture the same scene, spawn, direction, story state, and native resolution before and after a visual change. Name any capture limitation (for example, a static frame cannot prove animation quality).
2. Read Program intent, visual goals, activities, groups, contributions, relationships, and residue from the canonical World Engine record. Resolve footprint and target names against the scene's canonical layout, not a copied coordinate table.
3. Check room: intended identity and feeling; focal hierarchy; density and negative space; material and light character; controlled asymmetry; navigation; signs of use; generic or procedural appearance.
4. Check each group: visible role and distinct visual character; contribution to or competition with main focus; cluster coherence; circulation; whether its stated activities are legible without assuming a named actor is present.
5. Check selected objects or visual elements: **what would the room lose if removed?** Function, gameplay, narrative, character, atmosphere, composition, rhythm, silhouette, warmth, or depth all count. If answer is “nothing,” flag possible clutter; do not auto-delete.
6. Classify baseline everyday traces as ambient residue. A detail implying a specific event is narrative residue and must be tied to existing canonical Narrative Runtime state; never infer event truth from appearance alone.

## Finding contract

Use concrete findings, not automatic scores. Each finding has:

```text
level: ROOM | GROUP | OBJECT
target: environment, group ID, or named existing element
observation: what actual frame/playthrough shows
why: effect on stated intent/composition/use
suggestedChange: smallest plausible next action (or keep)
evidence: capture/test/source and frame limitation
confidence: high | medium | low
```

Separate observation from recommendation. A `MATCH` may be recorded when important intent already succeeds. Claims about motion require a timed capture or animation test; claims about route require gameplay/path evidence. The critic cannot change canon, place NPCs, edit collision, or delete objects by itself.

For this pilot, static relationship checks are deliberately narrow: `NEAR` means footprint tile adjacency; `REACHABLE` means a walkable map route between named scene targets. Neither proves visual clearance, actor occupancy, sightline, or a direct corridor. Visual inspection and walkthrough fill that gap.
