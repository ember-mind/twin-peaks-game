# Double R vertical slice — frozen

Double R is first completed environment/location vertical slice. Canonical route:

`town (42,20) → double_r_exterior_prototype → front entrance → diner → double_r_exterior_prototype`

No art, player scale, Ambient Life, Environment Reactions, LocationConnections, movement, collision, save, or fade behavior may change during World Engine work unless a separately scoped bug requires it.

## Golden references

- **Double R Interior Golden Reference:** `artifacts/diner-final-art/final.png`; approval `artifacts/diner-final-art/baseline-approval.json`; static baseline `test/coldstage-baselines/diner/`.
- **Double R Exterior Native Reference:** `artifacts/double-r-exterior-v02/native-clean.png`; reviewed evidence `artifacts/double-r-exterior-v02/validation/review-record.json`; runtime source `js/double-r-exterior-art.js`.
- **Ambient Life conventions:** `docs/ambient-life.md`; ambient baseline `test/coldstage-baselines/dinerAmbient/`; approval `artifacts/diner-ambient-011/baseline-approval.json`.
- **LocationConnection example:** `js/double-r-location-data.js`; production installer `js/double-r-location-production.js`; validation evidence `artifacts/double-r-location-03/`.

## Demonstrated primitives

- Environment: native rendering, collision/walkability, depth.
- Ambient Life: continuous, intermittent, signature.
- Environment Reaction: event-driven visual reaction.
- Location Connection: semantic paired endpoints, multiple physical triggers, explicit non-trigger destination spawn, optional departure reaction, connection metadata on arrival.

Exploratory artifacts remain preserved as evidence. This file identifies current authoritative references; no evidence was deleted or baseline replaced.
