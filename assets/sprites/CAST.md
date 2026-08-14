# Generated overworld cast R77

## Runtime R101

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
