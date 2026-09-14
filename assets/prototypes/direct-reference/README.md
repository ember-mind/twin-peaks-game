# Roadhouse direct-reference prop prototype

Throwaway test: generate clean, transparent prop masters from `assets/ref/roadhouse-B.png`, then reduce them into a small indexed-color runtime atlas. Masters preserve reference detail; runtime images expose how much readability survives native pixel scale.

Open `world-builder.html?propPrototype=A|B|C` over HTTP. Variants compare dining atoms, architecture kit, and full composition. Catalog and placements are memory-only. Map rows remain sole collision/walkability owner.

Open `test/roadhouse-prop-prototype.html?variant=A|B|C` to compare current procedural art, Blender combined prefab, and full atomic reference kit on native 256×192 canvas.

## ImageGen prompts

Built-in ImageGen used with `assets/ref/roadhouse-B.png` as reference. One generation per atomic prop:

- Chair: isolated Roadhouse dining chair matching reference; tall dark-walnut slatted back, red upholstered seat, warm amber rim light; transparent background; three-quarter game view; no table, people, floor, text, shadow, or extra objects; centered; readable at 12×18 logical pixels; maximum eight opaque colors plus transparency; hard pixel edges; no antialiasing.
- Table: isolated dark-walnut round pedestal dining table matching reference; transparent background; three-quarter game view; no chairs, candle, people, floor, text, shadow, or extra objects; centered; readable at 24×16 logical pixels; maximum eight opaque colors plus transparency; hard pixel edges; no antialiasing.
- Candle: isolated small lit table candle in short brass holder matching reference; transparent background; no table, people, floor, text, shadow, or extra objects; centered; readable at 6×10 logical pixels; maximum six opaque colors plus transparency; hard pixel edges; no antialiasing.
- Pendant: isolated warm brass hanging pendant lamp matching reference; cord, brass shade, amber pool glow contained inside silhouette; transparent background; no ceiling, wall, people, text, shadow, or extra objects; centered; readable at 12×18 logical pixels; maximum eight opaque colors plus transparency; hard pixel edges; no antialiasing.

Expansion pass used built-in ImageGen, one generation per atomic prop. `roadhouse-B.png` guided booth, bar, stage, door, and pay phone; `roadhouse-A.png` guided piano, neon, and deer trophy:

- Booth: isolated deep-burgundy channel-tufted booth with dark-walnut frame; transparent; three-quarter top-down; no table, people, floor, wall, text, shadow, or extras; crisp GBC-era clusters; target 48×32.
- Bar: isolated modular amber-walnut counter segment with dark paneled front and brass foot rail; transparent; no stools, bottles, bartender, floor, wall, text, shadow, or extras; target 64×28.
- Stage: isolated wide burgundy-curtain stage backdrop with warm wooden floor and dark apron; transparent; empty; no microphone, speakers, piano, people, wall, text, shadow, or extras; target 96×48.
- Door: isolated dark-walnut double entrance, two burgundy leaves, amber glass panes, brass handles; transparent; no wall, plants, floor, people, text, shadow, or extras; target 32×32.
- Piano: isolated compact black upright piano with warm wood highlights and visible keyboard; transparent; three-quarter top-down; no stage, curtain, player, floor, wall, text, shadow, or extras; target 40×28.
- Neon: isolated framed red neon sign reading exactly `ROADHOUSE`; transparent; contained halo; no wall, ceiling, people, floor, other text, shadow, or extras; target 64×20.
- Trophy: isolated mounted deer-head trophy on walnut shield plaque; transparent; symmetrical antlers; no wall, people, floor, text, shadow, gore, or extras; target 20×24.
- Pay phone: isolated vintage black wall pay phone with handset, coin slot, and keypad; transparent; no wall, people, floor, text, shadow, or extras; target 14×26.

Generated masters are source material, not final native sprites. Runtime pass uses alpha threshold, nearest-neighbour resize, and palette quantization. Expansion keeps 16 opaque colors plus transparency to preserve identity; production palette policy remains unresolved. Chair and candle still benefit from manual pixel cleanup.
