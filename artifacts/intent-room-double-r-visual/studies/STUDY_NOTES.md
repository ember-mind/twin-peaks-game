# Five image-first booth studies

Five separate built-in image generation/editing calls returned actual bitmap images. No production code was changed; no winner was selected. Each raw output is preserved unmodified.

## Tool and provenance

- Tool: built-in `image_gen.imagegen` (`image_gen__imagegen` orchestration entry), edit requests with the same three local reference paths.
- Tool does not expose a model-selection parameter. Embedded C2PA software-agent metadata in raw A identifies `gpt-image`, version `2.0`.
- Input 1: `../packet/booth-lower-left-occupied-4x.png`, edit target.
- Input 2: `../packet/approved-golden-booth-lower-left-5x.png`, approved style reference.
- Input 3: `../packet/baseline-populated-native.png`, full-room context.
- Original generated files remain under `/Users/ebuccelli/.codex/generated_images/01a0b43e-5347-7190-9cbe-2f9679972c62/`; copies are below.
- Each study folder contains `PROMPT.md` with its exact prompt.

## Artifacts and visible results

| Study | Raw image | Visible construction | Raw colors | 64×48 colors |
|---|---|---|---:|---:|
| A | [raw](A/raw-generated.png) | Narrow vertical upholstery channels, rolled cap, separate rectangular table with two dark legs and an open gap below. | 53222 | 1467 |
| B | [raw](B/raw-generated.png) | Two broad back cushions, raised side bolsters, clipped table corners and central pedestal. Center menu was lost. | 51713 | 1412 |
| C | [raw](C/raw-generated.png) | Three wood-framed upholstery panels, square wood end posts, thin rectangular tabletop and paired trestle feet. | 44336 | 1282 |
| D | [raw](D/raw-generated.png) | Horizontal padded back rolls, wood side cheeks, rounded table ends and pale metal feet. | 49713 | 1239 |
| E | [raw](E/raw-generated.png) | Upholstered side wings turn inward around the seat, narrower squared tabletop, wood T pedestal and recessed base. | 45151 | 1338 |

Every raw image is 1448×1086 (4:3). Native proxies are direct point-filter samples at 64×48, followed by a point-filter enlargement to 256×192. They are **approximate visual studies, not faithful game pixels**.

Per study:
- `raw-generated.png`: unmodified generated output.
- `approximate-native-64x48.png`: direct nearest/point sample only.
- `approximate-native-4x.png`: nearest 4× of that sample.

Mechanical derivation:

```sh
magick raw-generated.png -filter point -resize 64x48! approximate-native-64x48.png
magick approximate-native-64x48.png -filter point -resize 400% approximate-native-4x.png
```

No palette remapping, pixel cleanup, hand painting, compositing, or background restoration was applied.

## Limits observed in the actual images

The generator returned recognizable furniture construction alternatives, preserving the broad crop framing and palette family. It did not satisfy the strict game-asset constraints:

- Raw surfaces contain smoothly varying colors despite flat-color/no-gradient requests; high unique-color counts substantiate that.
- Guest face, hair, clothing, hands and props were regenerated, not kept pixel-identical.
- Wall and floor context drifted. Surrounding non-booth pixels are not preserved.
- B omits the center menu; other props also change shapes or positions.
- Geometry is not aligned to the original 64×48 grid. Direct point sampling can lose or reshape details.
- Perspective reads more frontally than the source room, and exact 48px module bounds/contact rows are not established.
- Repetition across four booths and alternate guest occupancy were not rendered or validated.

These are image-first exploration artifacts for review, not implementation-ready assets, approved selections, or proof of native parity.
