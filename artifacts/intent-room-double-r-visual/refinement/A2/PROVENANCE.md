# A2 — one image-first refinement

Exactly one built-in `image_gen.imagegen` edit call. No retry, code painting, recoloring or manual cleanup.

## Files

- [Unmodified raw generation](raw-generated.png): 1448×1086, 48,765 unique colors.
- [Direct point-filter 64×48 proxy](approximate-native-64x48.png): 1,372 unique colors.
- [Nearest 4× proxy](approximate-native-4x.png): 256×192.
- [Exact prompt](PROMPT.md).

Tool: built-in image generation/editing; no CLI fallback or model-selection argument. Earlier output's embedded C2PA identified gpt-image 2.0; the tool uses its default model.

Original preserved: `/Users/ebuccelli/.codex/generated_images/01a0b43e-5347-7190-9cbe-2f9679972c62/exec-53fc8f35-3e5b-4009-a89c-42017cb4fae6.png`.

Raw SHA-256: `7bb3fc324e3891fad74996c7809ca4144b7c560612d83de7b3d79d3beb6c2f99`.

## Inputs, in order

1. `../../studies/A/approximate-native-4x.png` — edit target.
2. `../../packet/booth-lower-left-occupied-4x.png` — exact guest, props and background restoration reference.
3. `../../comparison/whole-room-A-mockup.png` — room context.
4. `../../packet/approved-golden-booth-lower-left-5x.png` — approved style reference.

## Visually observed result

The dark under-table mass is reduced: a burgundy horizontal seat edge sits behind the two shorter wood supports, with gray-green floor now visible between them. The table stays visibly independent and the vertical upholstery rhythm survives. Supports have broader feet and more visible ground contact. All three table props remain recognizable.

The refinement still does **not** produce a native-consistent target. The raw output contains gradients and smooth color variations. Actor face/pose and props remain regenerated rather than restored to baseline pixels. Surrounding wall/floor pixels drift. A direct 64×48 sample is an approximate design proxy, not a faithful native sprite. Enlarging the proxy gives hard edges but does not cure source palette and alignment defects.

## Mechanical derivation

```sh
magick raw-generated.png -filter point -resize 64x48! approximate-native-64x48.png
magick approximate-native-64x48.png -filter point -resize 400% approximate-native-4x.png
```

Stopped after the authorized single refinement call. No production changes or claim of strict pixel acceptance.
