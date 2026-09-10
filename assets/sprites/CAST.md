# Generated overworld cast R77

## Runtime R128 (2026-09-07)

- Produzione usa l'atlante `cast-walkcycles-hg-24.png` (360×360, 25 blocchi
  72×72 su 25 slot, frame 24×24) via `drawCastWalkSheet` in
  `js/retro-authored.js` (`CAST_RENDERER = 'heartgold-atlas-r116'`).
  Cache tag `?v=r129-cast` (bumped con il 25º blocco: il tag è letterale in
  `index.html` e `js/retro-authored.js`, nessuno lo deriva dal contenuto). L'atlante è ora **pieno**: 5×5 slot, 25 occupati.
- **Tutto il cast è disegnato a mano**: sorgente `tools/cast-authored-frames.js`
  (7 teste: short/neat/bob/long/bun/hat/cap; 2 corpi: jacket/skirt; overlay:
  glasses/log/hairShoulders/beard/badge/apron; palette per personaggio),
  compilato da `tools/build-cast-authored.js` in `cast-hg-24/<key>.png` e
  nell'atlante. `--check` verifica senza scrivere, `--preview out.png` monta
  il foglio di controllo. Riferimenti di design:
  `cooper-redesign-reference-2026-09-07.png`, `cast-redesign-guide-2026-09-07.png`.
  Evidenza: `artifacts/cast-r128/`.
- `tools/build-heartgold-cast.js` resta solo come audit (`--verify-only`):
  non lanciarlo senza flag, rigenererebbe i fogli dai master legacy.
- Gate: `test/heartgold-visual-contract.js`, `test/character-runtime-contract.js`
  (riscritto R127/R128 per l'atlante hg-24; la versione precedente pinnava il
  renderer 16 px ritirato).

## R129 (2026-09-09) — `infermiera`, 25º attore

- Cast di produzione: **25** attori (`js/chars.js` `CHARS`,
  `CAST_SHEET_ORDER`, `ORDER` in `tools/build-cast-authored.js` — stesso
  ordine in tutti e tre). `infermiera` = testa `cap` (nuova) + corpo `skirt`
  + overlay `apron`, palette bianca/ardesia: legge come personale di reparto
  accanto al letto di Ronette nell'ospedale.
- Matrici 16×16 in `js/retro-cast-matrices-b.js` (3 viste × 2 pose), come per
  ogni chiave di `CHARS`: senza, `authoredCharacterPattern` lancia.
- **L'archivio 16 px è congelato a 24.** `cast-walkcycles-16.png` (240×240),
  `cast-manifest.json`, `cast-16/<key>.png` e `tools/audit-cast-atlas.sh`
  restano fermi: è archivio comparativo, non produzione, e non ha slot liberi.
  Di conseguenza `tools/build-heartgold-cast.js --verify-only` e il gate
  `cast_inventory_24` in `test/heartgold-visual-contract.js` continuano a
  contare 24 attori / 216 frame: leggono il manifest congelato, non l'ORDER
  di produzione. `test/cast-sprite-sheet.js` verifica che il manifest resti un
  prefisso esatto del registro runtime.

## Runtime R101 (ritirato con R103–R126)

- Produzione usa `native-authored-r101f` in `js/retro-authored.js`: costruzione
  diretta sulla griglia `16×16`, tre toni opachi, nessun caricamento asincrono.
- `cast-walkcycles-16.png`: archivio comparativo `240×240`, non produzione.
- Each character block: `48×48`, with nine `16×16` frames.
- Character order: `cast-manifest.json`.
- Runtime e mirror sinistro: `js/retro-authored.js`.
- Nessun cambio grafico dopo il load: test e utente vedono stessi pixel.

## Sources

- Layout/style reference: `cooper-walkcycle-master-r2.png`.
- Identity references: `assets/portraits/hires/<key>.png`.
- Generator: built-in ImageGen, stylized-concept mode, one independent call per character.
- Prompt template and design rationale: `Game Boy Character Sprite Pipeline.md` in Vault `Game Development`.
- Exact subject descriptions: `cast-manifest.json`.

Twenty-three generated masters live in `cast-masters/`; Cooper reuses approved existing master. Repository masters are losslessly useful production masters quantized to six project colors plus magenta chroma, reducing them from 26 MB to about 600 KB. Original ImageGen outputs remain in Codex generated-image storage.

## Rebuild

```bash
# Rebuild completo da master già presenti
tools/rebuild-generated-cast.sh

# Import non distruttivo di un nuovo master + rebuild completo
tools/rebuild-generated-cast.sh truman /path/to/raw-truman.png
```

Comando unico: valida chiave, quantizza copia del raw, preserva raw originale, compila 24×9 frame, costruisce atlante, verifica palette/alpha, deriva cache tag SHA-256, aggiorna HTML/renderer e lancia test. `cast-manifest.json` governa ordine e sole eccezioni geometriche.

Master grid contract:

- row 1: down/front — idle, step A, step B;
- row 2: up/back — idle, step A, step B;
- row 3: right profile — idle, step A, step B;
- left profile mirrors right at runtime.
