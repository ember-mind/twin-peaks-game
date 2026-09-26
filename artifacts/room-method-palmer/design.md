# Palmer living room — design before implementation

Base: main `7a3de3fd249cc908756a269e116c597bc82f1767`.
New to our intent-driven case studies, not an untouched historical asset:
the room already has native art, eleven furniture definitions and earlier art passes.

## Actual view

Normal entrance: Palmer (7,10), up, 256×192, production Cast Presence enabled.
`00-before-entry.png` is captured before changing code.

My reading (not measured human eye tracking): entrance → bright runner/rug
border → Sarah → pale upstairs plane / little cabinets. The lower room reads
as several small objects around a framed rectangle. Its `sofa` is actually
drawn as a one-seat chair because its collision footprint is one tile.

## Intent

A family sitting room, not a reception hall. Conversation belongs around a
shared rug, with a sofa backed by architecture, a chair facing into that
group, and a low table within reach. The dining and music corners stay
secondary. A visitor can walk in, reach Sarah and choose the stairs without
crossing furniture. Familiar domestic material should carry the atmosphere;
no new clue, event or named-person activity is being invented.

Intended lower-room flow: entrance → seating group / Sarah → west landing.
Upstairs remains visibly separate and accessible: the investigation still
needs it. Its art is outside this repair, not something we conceal in crops.

## Three changes to try

1. Give the sofa a real three-tile footprint against the rear wall (7–9,5).
   Reuse its former cell (3,6) for the existing single wing-chair footprint.
   No new prop, no added cast, no changed doors or interaction targets.
2. Reduce the rug's high-contrast outline and repeated medallions. Keep its
   common floor plane, soften the separate right rug, and quiet floor seams.
3. Use cream upholstery as the main broad light mass, green as its material
   partner, and fewer isolated wall accents. Adjust light only after viewing
   this massing pass; small detail is not the cure for a missing sofa.

## Contribution / subtraction check

Sofa: shared seating plus broad welcoming visual mass. Chair: closes the
conversation group without closing the circulation route. Rug: groups seats
and Sarah; it should not look like a display frame. Table: ordinary shared
use, not evidence. Piano / record console: existing domestic identity and
secondary edge mass. Dining cloth and cup: existing ordinary use. Portrait:
existing identity cue, not a new narrative revelation. Bare entrance floor:
space to arrive, move and read the room; not a request for more decoration.

## Safety and proof

World Engine, map lifecycle, registry doors, narrative state and Cast Presence
keep their owners. Only two lower-floor map rows and matching native furniture
footprints may change. No environment.program edits or new Room system.
Protected renderer files and Double R stay unchanged.

Capture intermediate and final frames with identical entrance/cast settings.
Test native bounds/depth, keyboard traversal, canonical cast bodies, registry
doors, narrative gates and a real Act 4 browser playthrough. Report constraints
and remaining visual weaknesses; green tests cannot certify beauty.
