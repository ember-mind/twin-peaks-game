# Astra refinement packet — one production booth

Read this and listed PNGs, not whole repo. All captures renderer-native 256×192 at diner entrance `(6,8)` facing up, same canonical base Cast, with 64×48 crop at screen `(24,128)` from lower-left occupied booth. Nearest 4× is inspection only. Approved golden is `packet/booth-table-reference-final-5x.png`; current baseline `packet/booth-table-populated-native.png` / `-4x.png` and `packet/normal-populated-native.png`.

Independent actual art studies, each started from baseline helper:

- **A** `A/booth-2-occupied-native.png`, `A/booth-2-occupied-4x.png`, `A/study-A-populated-native.png`: table's wood rim and visible floor under distinct supports improve table/booth causal relation. Seat wings only ~3px and backrest reads like flat wood panels; whole-room burgundy fine rib rhythm weakens. Lead: promising, under-refined.
- **B** `B/booth-2-occupied-native.png`, `B/booth-2-occupied-4x.png`, `B/study-B-populated-native.png`: thick end-cheek silhouette survives at 1×; excessive dark wood framing and large cream face evoke cabinet. Table props edge fixed and supported. Lead: promising, under-refined.
- **D** `D/booth-2-occupied-native.png`, `D/booth-2-occupied-4x.png`, `D/study-D-populated-native.png`: independent tabletop + central pedestal show physical idea; opening too shallow and original booth still frontal. Lead: reject as complete booth, retain thinner-slab principle.

Review empty ready/cleared states too: `A/B/D/booth-0-ready-4x.png`, `A/B/D/booth-3-cleared-4x.png`. Act4 whole-room frames in those directories. All targeted gameplay/renderer gates pass; geometry ownership unchanged. Source revisions A `e096ed0`, B `b8146bb`, D `bb11057`; their `js/retro-authored.js` diffs against base `7472a39` only if a precise paint-order question requires it. `packet/ART_PACKET.md` contains palette and canonical constraints.

## Lead critique and production brief

Refine **A's exposed-seat and independent-table idea**. Borrow B's sense of forward padded cheek, but **not** its dark wooden box. Borrow D's slim tabletop/underside only, not weak single pedestal. Make one booth read as actual upholstered diner seating plus separate table at native size. Do not reinvent room or add props. Baseline still has stronger crafted fine rhythm than A/B/D; production candidate must recover coherent, moody burgundy identity while improving several of volume/contact/planes/material separation.

Specific issues to solve:

1. Backrest A's three broad red rectangles look flat millwork. Construct cushion face with 2–3 broad clusters and lower roll/shadow; no six-to-eight bright 1px ribs, but enough vertical rhythm to feel diner, not sofa.
2. A's 3px side seat slivers insufficient at 1×. Shape end cheeks/seat returns as 4–5px coherent padded masses. Keep guest head/shoulders unobscured; no broad rose highlights.
3. Cream top A y+1..10 plus rim y+11..13 still reads somewhat like 10px frontal plank. Can reduce top depth to ~8–9px and increase visible knee space while keeping all authored props supported. Table span x+6..41 currently carries ready menu x+6 and plate to x+41, occupied right prop shifted x+6. If reducing span, specify exact prop relocations.
4. Grounded foot/contact must be local and believable, not 48px cabinet border, floating table, or black understripe. Prefer two restrained table supports that communicate front legs rather than tiny solitary pedestal. No extra collision.

We need exact implementable pixel construction **relative to x,y, w=48**: large rectangle planes, silhouette bounds, draw order (back/seat/guest/table/props/hands/support), 1–2px shadows/caps, palette roles (existing `red`, `redDark`, `redHi`, `woodDark`, `woodHi`, `cream`, `creamShade`), and any prop offsets. Respect envelope `x..x+48`, `y−16..18`, integer clusters, no new hue/gradient/texture. Then state what should read differently in whole room at 1× and main remaining risk. One production candidate; no code edit/test/repo exploration.
