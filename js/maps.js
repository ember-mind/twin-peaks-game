/* maps.js — mappe ASCII, collisioni, porte, transizioni.
   Legenda tile:
   . erba        g erba scura (bosco)  r strada      p sentiero terra
   w acqua(X)    T sempreverde(X)      Y sicomoro(X) S cartello(X)
   0 bottega/casa(X) 1 distretto(X) 2 DoubleR(X) 3 casaPalmer(X) 4 hotel(X)
   5 ospedale(X) 6 roadhouse(X) 9 grandi magazzini Horne(X) -> muri edifici
   i muro int.(X) D porta              f parquet     c tappeto
   C bancone(X)  t tavolo(X)  h sedia(X)  K letto(X)  U comò(X)
   o olio        R tenda rossa(X)      Z zig-zag     M statua(X)
   v vuoto(X)    X transenna (apre con 3 indizi -> gate)
   arredo urbano (town): = marciapiede    u piazza in ghiaia  - strisce N-S
   : strisce E-O sulla strada verticale   , erba fiorita
   L lampione(X)  P palo telefono(X)  B panchina(X)  F staccionata(X)
   A aiuola fiorita(X)  H idrante(X)  E cassetta postale(X)  n cespuglio(X)
   (X) = solido
   Town/woods generate e validate con test/genmaps.js (BFS su porte/npc). */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  var GAME = G.GAME;
  var M = {};
  GAME.maps = M;

  M.SOLID = {
    T: 1, S: 1, w: 1,
    '0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1,
    i: 1, C: 1, t: 1, h: 1, K: 1, U: 1,
    Y: 1, R: 1, M: 1, v: 1, G: 1,
    L: 1, P: 1, B: 1, F: 1, A: 1, H: 1, E: 1, n: 1, q: 1, V: 1, J: 1
  };
  M.isSolid = function (ch) { return !ch || !!M.SOLID[ch]; };

  M.maps = {
    arrival: {
      id: 'arrival',
      rows: [
        'TT99..JJJT',
        'TT99E.JJJT',
        'T.99..JJJT',
        'T.....VV.T',
        'T........T',
        'TT......TT',
        'TTT....TTT',
        'TTTT..TTTT',
        'TTTTpTTTTT'
      ],
      ground: { '4,1': '.', '6,3': '.', '7,3': '.' },
      /* La radura continua nel margine sud della cittadina. Prima Cooper
       * compariva direttamente sull'asfalto civico: salto visivo netto. */
      doors: {},
      onEnter: { dialogue: 'town_arrivo', once: 'intro_town' }
    },

    town: {
      id: 'town',
      rows: [
        //         1111111111222222222233333333334444444444555555
        //01234567890123456789012345678901234567890123456789012345
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTXTTTTT', // 0  X = sentiero bosco
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTpTT..T', // 1 ferrovia libera dentro il landmark
        'Twwwww.......T..............777pp...B........T....p....T', // 2 bacino reale sotto cascata
        'TTwwww..4444......T.555555..777pp999......T.......p....T', // 3 ansa del bacino + coppia street
        'Twwww.444444........555555..777pp999....3333.T....p.,..T', // 4 bacino profondo, hotel 6-wide, ospedale a L
        'T.www.444444..T.......5555..ppppp999.T..3333......p.n..T', // 5 Bookhouse 3-high; vicolo e forecourt leggibili
        'T.....444D44..........5D55.E...ppppp....33D3......p....T', // 6 Horne 3-high; porte storiche invariate
        'T.......ppppppppppppppppppppppppppppppVVpppp......p....T', // 7 berlina FBI sul bordo nord della corsia
        'T.......ppppVVpppppppppppVVppppppppppppppppp......p....T', // 8 auto hotel + ambulanza ospedale
        'T....Tn.pppppppppppppppppppppppppppppppppppp......p..,.T', // 9 bordo sud corsia e tre bocche d'accesso
        'T.....B.ppp.T..000.00.pppB.T...T........Tppp.T000.p....T', // 10 pharmacy 3x3, hardware 2x3, newsstand 3x2
        'T.......ppp.T..000.00.ppp..T..TT.......TTppp..000.p....T', // 11 masse davvero diverse, corridoi invariati
        'T.......ppp....000.00.ppp....TTT.T....TTTppp......p....T', // 12 edicola bassa, hardware stretto
        'T===L===ppp===========ppp===L==..=======Lppp======p=L==T', // 13 bocche 3-wide verso i crosswalk
        'Trrrrrrr---rrrrrrrrrrr---rrrrrrrrrrrrrrrr---rrrrrrrrrrrr', // 14 crosswalk solo centrati sugli accessi reali
        'Trrrrrrr---rrrrrrrrrrr---rrrrrrrrrrrrrrrr---rrrrrrrrrrrr', // 15
        'T=====PpppL=======P===L====rrr==============Pppp=======T', // 16 bocche ovest/est larghe tre tile
        'T......ppp11111...........=rrr=..............ppp.......T', // 17 sheriff 5-wide: scala Gen II, piazzale libero a est
        'T.T....ppp11111....T......=rrr=....T...222222ppp..T....T', // 18 Double R affiancato al corridoio est
        'T......ppp11111...........=rrr=........222222ppp.......T', // 19
        'T......ppp11D11...........=rrr=........222D22ppp.......T', // 20 porte storiche 12 / 42
        'T......ppppp===============rrr=..........pppppppFFpFF..T', // 21 marciapiede Sheriff-porta-strada continuo
        'T.....Bppppppp.VV.q.......=rrr=.......VV.pppppppG.G.G..T', // 22 pattuglia sheriff + auto diner
        'T==========================rrr==============ppppT.p.p..T', // 23 bordo nord passeggiata civica 3-high
        'T==========================rrr===============pppG=G=G==T', // 24 interno passeggiata senza effetto trincea
        'T==========================rrr==============666666.....T', // 25 bordo sud fino a Roadhouse
        'T.....wwwwwwwwwwF.....T...=rrr=.......T..ppp666666..T..T', // 26 sponda nord arretrata
        'T....wwwwwwwwwwF..........=rrruuuuu=.....ppp666666.....T', // 27 ansa nord-est
        'T...wwwwwwwwwwwF..........=:::uuuAuE.....ppp666D66.....T', // 28 riva/interazione storica invariata
        'T...wwwwwwwwwwwwF.......B.=:::uuuuBu.....pppppppp......T', // 29 ansa più larga
        'T....wwwwwwwwwwF.........L=rrrSuuHuu.....pppppppp..S...T', // 30 rientro sud
        'T......wwwwwwwwwF....TTTTT=rrrppp.TTTTT..pppppppp......T', // 31 sponda + prime quinte forestali fisiche
        'T..................TTTTTTT=rrr=...TTTTTTT..............T', // 32 ingresso boscoso: strada centrale sempre libera
        'T.................TTTTTTTT=rrr=...TTTTTTTTT............T', // 33 spawn libero, foresta addensata ai lati
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTrrrTTTTTTTTTTTTTTTTTTTTTTTTTT', // 34 varco stradale fra gli alberi
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'  // 35
      ],
      /* Sottofondo esplicito per ogni prop urbano e per i volumi compatti.
       * Il glifo descrive collisione/oggetto; questa tabella conserva la
       * superficie della proprietà senza generare carrier verdi 1x1. */
      ground: {
        '36,2': '.', '27,6': '.', '38,7': 'p', '39,7': 'p',
        '6,10': '.', '15,10': '.', '16,10': '.', '17,10': '.', '19,10': '.', '20,10': '.', '25,10': '.', '46,10': '.', '47,10': '.', '48,10': '.',
        '15,11': '.', '16,11': '.', '17,11': '.', '19,11': '.', '20,11': '.', '46,11': '.', '47,11': '.', '48,11': '.',
        '15,12': '.', '16,12': '.', '17,12': '.', '19,12': '.', '20,12': '.',
        '4,13': '=', '28,13': '=', '40,13': '=', '52,13': '=',
        '6,16': '=', '10,16': '=', '18,16': '=', '22,16': '=', '44,16': '=',
        '6,22': '.', '15,22': '=', '16,22': '=', '18,22': '.',
        '38,22': '.', '39,22': '.', '12,8': 'p', '13,8': 'p', '25,8': 'p', '26,8': 'p',
        '48,22': '.', '50,22': '.', '52,22': '.',
        '48,24': '=', '50,24': '=', '52,24': '=',
        '33,28': 'u', '35,28': '=', '24,29': '.', '34,29': 'u',
        '25,30': '.', '30,30': 'u', '33,30': 'u', '51,30': '.'
      },
      doors: {},
      onEnter: { dialogue: 'town_arrivo', once: 'intro_town' }
    },

    /* Distretto: geometria nativa 16x12 (js/sheriffs-station-scene.js).
     * I glifi sono solo collisione: l'arte e' authored in
     * js/sheriffs-station-art.js, che sostituisce drawTile/drawStructures
     * per questa mappa. 'T' = solido (muri + arredo), '.' = calpestabile.
     * Le celle 7,11 e 8,11 sono l'ingresso (trigger della connessione
     * sheriffs-station-front-entrance). */
    sheriff: {
      id: 'sheriff',
      indoor: true,
      rows: [
        'TTTTTTTTTTTTTTTT', // 0  muro nord
        'TTTTTTTTTTTTTTTT', // 1  muro nord
        'TTTTTTTTTTTTTTTT', // 2  muro nord
        'TTTT...TT......T', // 3  schedari(1-3,3), poltrona sceriffo(7-8,3)
        'TTTT..TTTT.....T', // 4  schedari(1-3,4), scrivania sceriffo(6-9,4); Truman(10,4)
        'T..............T', // 5  corridoio libero; Leland(8,5) in atto 5
        'T...T......TTT.T', // 6  ritorno reception(4,6), scrivania destra nord(11-13,6); Lucy(2,6)
        'TTTTT.......T..T', // 7  bancone reception(1-4,7), sedia(12,7); Andy(10,7)
        'T..............T', // 8  fascia di transito
        'T..........TTT.T', // 9  scrivania destra sud(11-13,9)
        'TTTT........T..T', // 10 panca d'attesa(1-3,10), sedia(12,10); spawn ingresso 7,10
        'TTTTTTT..TTTTTTT'  // 11 ingresso 7,11 / 8,11
      ],
      doors: {}
    },

    palmer: {
      id: 'palmer',
      indoor: true,
      rows: [
        'iiiiiiiiiiiiiiii', // 0
        'iKKfffUffffffffi', // 1 camera di Laura: letto, comò (6,1) da ispezionare
        'iffffffffffffffi', // 2
        'iffffffffffffffi', // 3
        'iiiiffiiiiiiiiii', // 4 corridoio c4-5
        'iffffffhfffffffi', // 5 poltrona alta a nord del tappeto (7,5)
        'ifftffcccccffUUi', // 6 poltrona verde, pianoforte (13,6), consolle (14,6)
        'ifffftcccccffffi', // 7 tavolino basso sul tappeto (5,7); Sarah(9,7)
        'ifttffcccccfhtfi', // 8 tavolo domestico; poltrona (12,8) e tavolino del telefono (13,8)
        'ifhhfffffffffffi', // 9 sedute, corridoio porta ancora libero
        'iffffffffffffffi', // 10 (spawn 7,10)
        'iiiiiiiDDiiiiiii'  // 11
      ],
      doors: {}
    },

    room_315: {
      id: 'room_315',
      indoor: true,
      rows: [
        'TTTTTTTTTTTTTTTT', // 0  muro nord (finestra, specchio, quadro)
        'TTTTTTTTTTTTTTTT', // 1
        'TTTTTTTTTTTTTTTT', // 2
        'TTTTT..TTT..TT.T', // 3  letto(1-3,3), comodino(4,3), scrittoio(7-9,3), comò+specchio(12-13,3)
        'TTTT...........T', // 4  letto(1-3,4)
        'TTTT...........T', // 5  letto(1-3,5)
        'T..............T', // 6  risveglio: spawn 2,6 giù (piedi del letto)
        'T............T.T', // 7  portavaligie(13,7)
        'T..............T', // 8
        'T..............T', // 9
        'T..............T', // 10 spawn dal corridoio 7,10 su
        'TTTTTTT.TTTTTTTT'  // 11 porta 315 -> corridoio Great Northern (7,11)
      ],
      doors: {},
      onEnter: { dialogue: 'hotel_risveglio', once: 'intro_hotel' }
    },

    hotel_gn: {
      id: 'hotel_gn',
      indoor: true,
      rows: [
        'iiiiiiiiiiiiiiiiiiii', // 0  timber wall
        'ifffffffffffffffDffi', // 1  hall door at 16,1
        'iffffffffffffffffffi', // 2  rear receiving floor
        'iffffffffffffffffffi', // 3  rear receiving floor
        'ifCCCCfffffffffffffi', // 4  built-in hearth, west four cells (2..5)
        'iffffffffffffffffffi', // 5  clear cross-room circulation
        'ifffhthffffffffffUfi', // 6  chair/table/chair lounge; luggage bay at 17,6
        'iffffffffffffffffffi', // 7  continuous staff-side aisle; Ben at 12,7
        'iffffffffffCCCCffffi', // 8  guest-facing reception counter (11..14)
        'iffffffffffffffffffi', // 9  public guest floor; Audrey at 15,9
        'iffffffffffffffffffi', // 10 south threshold approach; spawn 9,10
        'iiiiiiiiiDDiiiiiiiii'  // 11 paired south entrance (9,11),(10,11)
      ],
      doors: {}
    },

    hospital: {
      id: 'hospital',
      indoor: true,
      // Ward nativo 16x12 (Act 2 closure): parete nord righe 0-2, pavimento 3-10,
      // porta doppia sud 7-8,11. Ingombri: stand monitor (1-2,3), letto Ronette
      // (3-4,3-5; attrice a 3,5), sedia (1,6), tenda (8,3-5), letto Gerard
      // (9-10,3-5; Gerard a 11,4), bancone infermiera (12-14,8; registro 13,8;
      // infermiera a 11,8). Spawn 7,10 su.
      rows: [
        'TTTTTTTTTTTTTTTT', // 0
        'TTTTTTTTTTTTTTTT', // 1
        'TTTTTTTTTTTTTTTT', // 2
        'TTTTT...TTT....T', // 3
        'T..TT...TTT....T', // 4
        'T..TT...TTT....T', // 5
        'TT.............T', // 6
        'T..............T', // 7
        'T...........TTTT', // 8
        'T..............T', // 9
        'T..............T', // 10
        'TTTTTTT..TTTTTTT'  // 11
      ],
      doors: {}
    },

    diner: {
      id: 'diner',
      indoor: true,
      interior: {"material":"diner","counter":[2,3,9],"stools":[[2,4],[4,4],[6,4],[8,4],[10,4]],"booths":[[1,6,3],[10,6,3],[1,8,3],[10,8,3]],"guests":[null,{"hair":"#634337","hairHi":"#936550","hairStyle":"bob","seat":"right","coat":"#997082","coatHi":"#bd94a0","coatShadow":"#654a61"},{"hair":"#353730","hairHi":"#606052","hairStyle":"swept","seat":"left","coat":"#476352","coatHi":"#78917a","coatShadow":"#31483b"},null],"plant":[12,2],"coatRack":[12,4],"specials":[8,6,1,1],"islandPlant":[6,6]},
      rows: [
        'iiiiiiiiiiiiii',
        'iffffffffffffi',
        'ifffffffffffhi',
        'ifCCCCCCCCCffi',
        'ifhfhfhfhfhfhi',
        'ihhfffffffffhi',
        'itttffhftfttti',
        'ihhfffffffffhi',
        'itttffffffttti',
        'iiiiiiDDiiiiii'
      ],
      doors: {}
    },

    woods: {
      id: 'woods',
      rows: [
        //         111111111122222222
        //0123456789012345678901234567
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0 alberi dietro Lodge
        'TTTTTTTTTTT888888TTTTTTTTTTT', // 1 tetto Lodge, 96 px come reference Gold
        'TTTTTTTTTTT888888TTTTTTTTTTT', // 2 tetto Lodge
        'TTTTTTTTTTq888888TTTTTTTTTTT', // 3 facciata Lodge, cassa alta sinistra
        'TTTTTTTTTTT888D88TTTTTTTTTTT', // 4 porta -> Red Room (14,4)
        'TTTTTTTTTggggpppggggTTTTTTTT', // 5 cortile
        'TTTTTTTTTggggpppggqgTTTTTTTT', // 6 cortile, cassa destra
        'TTTTTTTTTggggpppggggTTTTTTTT', // 7 cortile
        'TTTTTTTTTTTgTpppggTTTTTTTTTT', // 8
        'TTTTTTTTTTgggpYpgggTTTTTTTTT', // 9 cerchio di sicomori
        'TTTTTTTTTTggYpppYggTTTTTTTTT', // 10
        'TTTTTTTTTTgggooogggTTTTTTTTT', // 11 olio 3×2
        'TTTTTTTTTTgYooopgYgTTTTTTTTT', // 12 olio 3×2 sfalsato
        'TTTTTTTTTTgggpppgggTTTTTTTTT', // 13
        'TTTTTTTTTTggYpppYggTTTTTTTTT', // 14
        'TTTTTTTTTTgggpYpgggTTTTTTTTT', // 15
        'TTTTTTTTTTTSggppTTTTTTTTTTTT', // 16 cartello Glastonbury Grove (11,16)
        'TTTTTTTTTTTTTpppTTTTTTTTTTTT', // 17
        'TTTTTTTTTTTTgpppTTTTTTTTTTTT', // 18
        'TTTTTTTTTTTTgpppTTTTTTTTTTTT', // 19
        'TTTTTTTTTTTTTpppnTTTTTTTTTTT', // 20 (spawn 14,20), cespuglio al sentiero
        'TTTTTTTTTTTTTTpTTTTTTTTTTTTT'  // 21 uscita sud -> città
      ],
      doors: {}
    },

    redroom: {
      id: 'redroom',
      indoor: true,
      rows: [
        'RRRRRRRRRRRRRRRR', // 0
        'RZZZZZZZZZZZZZZR', // 1
        'RZZMZZZZZZZZZMZR', // 2 statue, Ombra di Laura (11,2)
        'RZZZZZZhZZhZZZZR', // 3
        'RZZZZZZZZZZZZZZR', // 4 Uomo in Rosso (8,4)
        'RZZZZZZZZZZZZZZR', // 5
        'RZZZZZhZZhZZZZZR', // 6
        'RZZZZZZZZZZZZZZR', // 7
        'RZZZZZZZZZZZZZZR', // 8
        'RZZZZZZZZZZZZZZR', // 9 (spawn 8,9)
        'RZZZZZZZZZZZZZZR', // 10
        'RRRRRRRRDRRRRRRR'  // 11 uscita tra le tende -> bosco
      ],
      doors: {},
      onEnter: 'redroom'
    },

    /* ---------------- Atto 3: il confine ---------------- */

    traincar: {
      id: 'traincar',
      /* Act 3 pass 01 — geometria nativa 24x12 (radura del ponte e del vagone).
       * La sorgente authored e' js/traincar-scene.js: le due devono coincidere
       * riga per riga, e la scena fallisce rumorosamente se divergono.
       * Legenda: T albero, g erba secca, p sentiero, w torrente (solido),
       * b asse del ponte, r rotaia, i sponda del vagone (solida), f pavimento
       * del vagone, D porta, S cartello (solido). */
      rows: [
        //         111111111122
        //0123456789012345678901234
        'TTTTTTTTTTTTTTTTTTTTTDTT', //  0  D = varco verso One Eyed Jacks
        'TTTTTTTTTTTTTTTTTTTTTpTT', //  1  il varco fra gli alberi
        'TTTwwTTTTiiiiiiiiiTTSpTT', //  2  facce nord 48 px: chioma + vagone
        'TggwwggggiiiiiiiiigggpgT', //  3  sponda nord del vagone (stufa 12,3)
        'TggwwggggifffffffigggpgT', //  4  interno, lamiera piegata (16,4)
        'TggwwggggifffffffigggpgT', //  5  traversa 12..14, anello (13,5)
        'TggwwggggifffffffigggpgT', //  6  sedile+carte (10,6), mucchio (13,6)
        'pppbbprrriiiiDDiiigggpgT', //  7  ponte, binari, porta sud (13-14,7)
        'TggwwggggggggggggggggpgT', //  8  massicciata aperta
        'TggwwggggggggggggggggpgT', //  9
        'TggwwggggggggggggggggpgT', // 10
        'TTTTTTTTTTTTTTTTTTTTTTTT'  // 11  linea di alberi a sud
      ],
      doors: {}
    },

    oej: {
      id: 'oej',
      indoor: true,
      rows: [
        'iiiiiiiiiiiiiiii', // 0
        'iffhfffffffhfffi', // 1  avventori seduti al drappo nord (3,1 e 11,1)
        'iftttffffftthfUi', // 2  craps lungo (2-4), blackjack (10-11) col suo sgabello (12), mobile servizio
        'iffffffffffhfffi', // 3  croupier in piedi davanti al blackjack (11,3)
        'iffffCCCCCCffffi', // 4  bancone del casinò
        'iffffhfffffffUfi', // 5  Jacques (7,5); avventore della roulette (5,5); piantana (13,5)
        'ifffKKKffffffffi', // 6  roulette al centro del tappeto (4-6)
        'iUffffffftthfffi', // 7  slot (1), poker (9-10), sgabello libero (11)
        'iUfthfffffffffFi', // 8  slot (1), tavolino cocktail (3) e suo sgabello (4), cordone (14); corsia libera: porta -> Hawk (6,8) -> Audrey (13,7)
        'iiiiiiiDDiiiiiii'  // 9  porta sud -> vagone del treno
      ],
      doors: {}
    },

    /* ---------------- Atto 4: il roadhouse ---------------- */

    roadhouse: {
      id: 'roadhouse',
      indoor: true,
      rows: [
        'iiiiiiiiiiiiiiii', // 0
        'iCCCCCCCCCCCCCCi', // 1  palco, bordo solido (Gigante, seconda apparizione: 8,1)
        'iffffffffffffffi', // 2
        'ifftthhtthhttffi', // 3  tavoli e sedie
        'iffffffffffffffi', // 4
        'iffhCCCCfhfffffi', // 5  bancone + sgabelli; telefono (8,5) libero
        'iffffffffffffffi', // 6
        'ifftthhtthhttffi', // 7  tavoli e sedie
        'iffffffffffffffi', // 8  (spawn 7,8 / 8,8)
        'iiiiiiiDDiiiiiii'  // 9  uscita -> città
      ],
      doors: {}
    }
  };

  for (var k in M.maps) {
    var m = M.maps[k];
    m.height = m.rows.length;
    m.width = m.rows[0].length;
  }
})();
