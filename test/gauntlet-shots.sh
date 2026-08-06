#!/usr/bin/env bash
# test/gauntlet-shots.sh <round-tag> — set completo di catture native 160x144
# per un round del Gauntlet Retro 2D. Esce != 0 se una sola cattura fallisce.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
TAG="${1:?uso: gauntlet-shots.sh r52}"
OUT="artifacts/retro-gauntlet"
FAILED=0
# Una cattura puo' uscire vuota per flakiness della pipeline headless: in quel
# caso native-shot.js esce 3 e il frame NON va accettato fra le prove. Riprova
# due volte, poi dichiara FAIL invece di consegnare un frame bianco.
shot() { # map x y dir name [extra]
  local attempt
  for attempt in 1 2 3; do
    if node test/native-shot.js --map="$1" --x="$2" --y="$3" --dir="$4" \
        ${6:+--dialogue=1} --out="$OUT/${TAG}-$5-native.png" >/dev/null 2>&1; then
      [ "$attempt" -eq 1 ] && echo "ok   $5" || echo "ok   $5 (tentativo $attempt)"
      return
    fi
  done
  echo "FAIL $5"; FAILED=1
}
# Y = riga della porta + 1 (il tile calpestabile subito a sud dell'ingresso,
# verificato su tutti e sei gli edifici). Con VH=144 e la camera che segue il
# giocatore, ogni riga in piu' di distanza dalla porta sposta la finestra
# visibile verso sud e ritaglia altrettanti px dalla riga tetto (che sta a
# nord): a Y = porta+2 (usato fino a R55) il tetto restava SEMPRE fuori
# schermo, contratto R56 o non contratto R56 -- non e' una regressione di
# questo round, era gia' cosi'. Solo Y = porta+1 mantiene il tetto intero in
# quadro con ROOF_LIFT=16 (contratto R56, tetto ~50% dell'edificio).
shot town 9  7  up hotel
shot town 42 7  up palmer
shot town 12 21 up sheriff-ext
shot town 42 21 up diner
shot town 47 29 up roadhouse
shot town 23 7  up hospital
# Bookhouse 3x4 + Horne's 3x4, separati da due tile di vicolo reale e
# sfalsati di una riga sopra la corsia nord. Il punto x32,y6 contiene i due
# volumi interi e nessuna terza facciata; e' sentiero connesso, non teleport.
shot town 32 5 up street-two-buildings
shot town 30 31 up plaza
shot woods 14 14 up woods-oil
shot sheriff 6 8 up sheriff-int
# Inquadrature di avvicinamento: stessa riga porta+1 delle sei sopra (e'
# l'unica che tiene il tetto intero in quadro), dialogo escluso.
shot town 9  10 up hotel-approach
shot town 42 24 up diner-approach
# Sprite: vista frontale del protagonista e confronto diretto con un NPC
# sullo stesso pavimento (richiesti dai critici sprite).
shot town 30 29 down cooper-front
shot sheriff 4 6  up  cooper-npc
shot woods   14 20 up cooper-night
# R62: la notte va giudicata su un frame che contenga la PELLE. Con dir=up il
# viso non e' in quadro e il gate "contrasto pelle/terreno" non e' verificabile.
shot woods   14 20 down  cooper-night-front
shot woods   14 20 right cooper-night-side
# La chiusura del contorno "in tutte le direzioni" finora era verificata solo
# di fronte e di spalle: mancava del tutto il profilo.
shot sheriff 4 6  left  cooper-side-left
shot sheriff 4 6  right cooper-side-right
shot town 30 31 up dialogue 1
exit "$FAILED"
