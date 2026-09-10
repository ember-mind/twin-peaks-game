# Sheriff’s Station — Character Population Pass 01

**Status: not complete.** Production review rejected Lucy’s (2,6) placement: the desk telephone occludes part of her face. A move within reception is required. The reviewed run passed runtime tests, but is not a final visual pass. Concurrent external source changes prevent safely applying the correction to the shared workspace until the target version is clarified.

## Cast and placement

Three persistent staff members are sufficient for this room. Truman remains at (10,4), Lucy works behind reception at (2,6), and Andy checks a small note at (10,7), beside the west end of the north work desk. All task-facing directions are down. Furniture and named access targets remain unchanged.

Lucy’s telephone pose makes reception a communication post without introducing a telephone system. Its eight changed pixels are confined to sprite rows 5–9, above the counter redraw at row 10. The receiver and small hand mark remain visible while the counter naturally hides her lower body.

Andy’s note is smaller than Truman’s file and occurs less often. The initially considered (13,7) position would have hidden 39 opaque sprite pixels behind the chair, including part of his face. The chosen (10,7) position has zero overlap with later furniture paint and leaves the central aisle and right-desk target clear.

Hawk is omitted. Reception, sheriff work and a secondary office task already establish a functioning station. A fourth persistent actor lacks a distinct task in this pass and would add occupancy without improving the composition.

## Activity direction

Lucy blinks after independently sampled 16–34 second waits and holds the telephone for 2.2–3.2 seconds after 26–44 second waits. Andy blinks after 23–47 second waits and checks a note for 1.3–1.9 seconds after 48–78 second waits. Truman’s approved profile is copied exactly: blink waits 12–38 seconds and file-reading waits 32–65 seconds, with original durations and frame sequence. Each behavior retains the existing seeded clock.

## Authored assets

Four new 24×24 cells: Lucy blink, Lucy telephone, Andy blink, Andy note. They change 4, 8, 4 and 22 pixels respectively relative to their canonical base frames. The combined 192×24 atlas retains the decoded original 96×24 Truman prefix exactly. No scaling, deformation, locomotion edits or runtime animation architecture changes.

The source frame sheet was reviewed at nearest-neighbor enlargement. Character silhouettes, proportions and palettes remain consistent with the canonical cast. Production composition and timing evidence are recorded separately after Coldstage validation.
