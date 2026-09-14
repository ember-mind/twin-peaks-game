# Roadhouse direct-reference prop prototype

Throwaway test: generate clean, transparent prop masters from `assets/ref/roadhouse-B.png`, then reduce them into a small indexed-color runtime atlas. Masters preserve reference detail; runtime images expose how much readability survives native pixel scale.

Open `world-builder.html?propPrototype=1` over HTTP. Catalog and placements are memory-only. Map rows remain sole collision/walkability owner.

## ImageGen prompts

Built-in ImageGen used with `assets/ref/roadhouse-B.png` as reference. One generation per atomic prop:

- Chair: isolated Roadhouse dining chair matching reference; tall dark-walnut slatted back, red upholstered seat, warm amber rim light; transparent background; three-quarter game view; no table, people, floor, text, shadow, or extra objects; centered; readable at 12×18 logical pixels; maximum eight opaque colors plus transparency; hard pixel edges; no antialiasing.
- Table: isolated dark-walnut round pedestal dining table matching reference; transparent background; three-quarter game view; no chairs, candle, people, floor, text, shadow, or extra objects; centered; readable at 24×16 logical pixels; maximum eight opaque colors plus transparency; hard pixel edges; no antialiasing.
- Candle: isolated small lit table candle in short brass holder matching reference; transparent background; no table, people, floor, text, shadow, or extra objects; centered; readable at 6×10 logical pixels; maximum six opaque colors plus transparency; hard pixel edges; no antialiasing.
- Pendant: isolated warm brass hanging pendant lamp matching reference; cord, brass shade, amber pool glow contained inside silhouette; transparent background; no ceiling, wall, people, text, shadow, or extra objects; centered; readable at 12×18 logical pixels; maximum eight opaque colors plus transparency; hard pixel edges; no antialiasing.

Generated masters are source material, not final native sprites. Current runtime pass uses alpha threshold, nearest-neighbour resize, and palette quantization. Chair and candle need manual pixel cleanup before production use.
