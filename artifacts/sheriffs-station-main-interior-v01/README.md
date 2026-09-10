# Sheriff's Station main interior — visual concept v01

This folder records one first visual iteration for the world intent
`sheriffs-station/main-interior`. The concept is generated with the built-in
ImageGen workflow. The final raster and its exact generation prompt belong
alongside this README as `final.png` and `prompt.txt`. The generated output is
a concept reference, not a native pixel asset.

## Scene intent

The room uses muted sage painted walls, oak wainscot and desks, cool gray
steel filing cabinets, gray linoleum, and a frosted rear door. Fixed cool
fluorescent ambient light establishes the station; a sheriff's desk lamp adds
one warm practical pool. The south-center public entrance opens onto a strong
central aisle. On the left are a waiting bench and an L-shaped reception
boundary. The sheriff's desk and map form the primary focal point in the
center. Two work desks occupy the right side, files sit rear-left, and a
closed, nonfunctional door sits rear-right.

These are visual intentions only. Routes have not been collision- or depth-
validated. Before implementation, test the central aisle, the reception
boundary's north/right gap, and clearances behind chairs against 16px tiles.

## Runtime and style boundary

The current runtime framebuffer is 256×192 (`js/main.js:237-239`), with 16px
world tiles (`js/retro-authored.js:6931`). The character presentation uses a
24px-derived HeartGold atlas on the same 16px tile baseline
(`js/retro-authored.js:22-25`), while the public sprite-size field remains
16×16 (`js/retro-authored.js:6932`). The project's established reference
workflow calls for one static environment study, nearest-neighbor integer
pixels, and no anti-aliasing, blur, gradients, or painterly noise
(`artifacts/double-r-exterior-v01/prompt.txt:1-12`). This Sheriff's Station
output is a generated concept and does not claim native-pixel parity.

## Review record

Author review finds a coherent composition and clear station identity. It
does not yet prove Double R commercial-quality or native parity: soft
gradients, finer and variable pixel density, extra plants and frames, and a
second mug add minor clutter. Stop at iteration 1. No second image was
requested or generated.

Possible future anchors are optional only: a small intermittent radio
indicator (no audio), a steady continuous desk lamp, an intermittent paper
edge, and a reactive entrance door on real traversal. No category is forced
and no signature effect is required.

No `sceneId`, connections, or future environments are invented. There is no
runtime record until an authored playable scene exists. Reusable conventions
remain the one-environment/empty-connections world shape, map collision and
depth, integer-pixel rendering, and atlas/player anchors. The station palette,
material clusters, furniture layout, authored light masks, and anchors are
location-specific. Visual-only work demonstrates no pressure on the existing
system; current map-ID coupling matters only if a real installer conflict or
impossible material policy appears.

No engine, native implementation, ambient, audio, or narrative changes were
made. No tests, browser, or Coldstage run was performed. No baseline was
approved or replaced.
