# Speaker portraits R72

## Pipeline

- Generator: built-in ImageGen tool, one independent call per identity.
- Style reference: generated Cooper master `exec-f989e6cc-1528-4698-8d0b-77ade3cc14b1.png`.
- Runtime output: `256×264` indexed PNG, maximum six colors.
- Palette: `#072619`, `#34572D`, `#6A8A43`, `#9AAB69`, `#DCD9A9`, `#EEE6B5`.
- Post-process: box resize to `256×264`, no dithering, remap to fixed palette.
- Background stays opaque because image fills the card well; no transparency path used.

## Common prompt

> Use case: stylized-concept. Asset type: in-game speaker portrait for a Game Boy Color mystery adventure. Input image: style and framing reference only; do not preserve its identity. Create the specified Twin Peaks character, recognizably inspired by the original performer. Match reference exactly: highly detailed late-Game-Boy-Color pixel-art portrait, large deliberate pixel clusters, subtle dither only where useful, serious character art rather than chibi. Identical head-and-shoulders crop, three-quarter view, face centered, shoulders reach both lower corners, no frame. Quiet Pacific Northwest mystery, neutral studio light. Monochrome olive and warm cream only; near-black green outlines, six tonal steps maximum. Flat muted olive background; one person only; no text, nameplate, watermark, UI border or scenery; clear at 256×264.

## Subject prompt set

| Key | Identity / performer reference | Distinguishing anchors |
|---|---|---|
| `cooper` | Dale Cooper / Kyle MacLachlan | swept dark hair, composed eyes, FBI suit and tie |
| `truman` | Harry S. Truman / Michael Ontkean | square face, side-part, calm eyes, sheriff uniform |
| `lucy` | Lucy Moran / Kimmy Robertson | heart-shaped face, alert eyes, high curly bun, rounded collar |
| `andy` | Andy Brennan / Harry Goaz | long soft face, worried eyes, deputy shirt and tie |
| `hawk` | Hawk / Michael Horse | high cheekbones, long straight hair, calm uniformed presence |
| `sarah` | Sarah Palmer / Grace Zabriskie | tired haunted eyes, short dark waves, grief held inward |
| `leland` | Leland Palmer / Ray Wise | long expressive face, swept silver hair, dark suit |
| `norma` | Norma Jennings / Peggy Lipton | gentle knowing eyes, soft light-brown waves, diner blouse |
| `shelly` | Shelly Johnson / Mädchen Amick | large dark eyes, full lips, long dark waves, waitress collar |
| `loglady` | Margaret Lanterman / Catherine E. Coulson | angular face, square glasses, long hair, cardigan and plaid |
| `bobby` | Bobby Briggs / Dana Ashbrook | broad cheekbones, pompadour, defiant eyes, leather jacket |
| `donna` | Donna Hayward / Lara Flynn Boyle | fine oval face, searching eyes, long dark waves, necklace |
| `jacoby` | Lawrence Jacoby / Russ Tamblyn | receding hair, beard, mismatched round glasses, open collar |
| `audrey` | Audrey Horne / Sherilyn Fenn | heart-shaped face, arched brows, curled bob, poised expression |
| `mfap` | Man from Another Place / Michael J. Anderson | compact round face, slick hair, enigmatic smile, bow tie |
| `laura` | Laura Palmer / Sheryl Lee | luminous oval face, sad eyes, long blonde waves, calm apparition |
| `gerard` | Philip Gerard / Al Strobel | gaunt face, receding curls, beard, frightened eyes, waistcoat |
| `benhorne` | Benjamin Horne / Richard Beymer | broad face, slick hair, calculating eyes, expensive suit |
| `giant` | Giant / Carel Struycken | extremely long narrow face, high forehead, solemn bow tie |
| `maddy` | Maddy Ferguson / Sheryl Lee | Laura-like structure, dark bob, round glasses, worried gaze |
| `bob` | BOB / Frank Silva | weathered face, long wild hair, uncanny eyes, broad theatrical smile |
| `james` | James Hurley / James Marshall | angular face, high pompadour, brooding eyes, biker jacket |
| `jacques` | Jacques Renault / Walter Olkewicz | wide heavy face, beard and mustache, narrowed eyes, dark vest |
| `ronette` | Ronette Pulaski / Phoebe Augustine | delicate face, exhausted eyes, disordered blonde hair, hospital collar |
| `nurse` | original supporting nurse | practical face, tucked dark hair, white nurse cap and uniform |

## Runtime contract

`GAME.Portraits.resolve(name, hint)` selects key. `js/engine.js` requests `assets/portraits/hires/<key>.png`, hides compositor image while it loads, then reveals it only inside native `32×33` portrait well. Procedural canvas portrait remains fallback on missing or delayed asset.
