/* maps.js — mappe ASCII, collisioni, porte, transizioni.
   Legenda tile:
   . erba        g erba scura (bosco)  r strada      p sentiero terra
   w acqua(X)    T sempreverde(X)      Y sicomoro(X) S cartello(X)
   1 distretto(X) 2 DoubleR(X) 3 casaPalmer(X) 4 hotel(X)  -> muri edifici
   5 ospedale(X) 6 roadhouse(X)                            -> muri edifici
   i muro int.(X) D porta              f parquet     c tappeto
   C bancone(X)  t tavolo(X)  h sedia(X)  K letto(X)  U comò(X)
   o olio        R tenda rossa(X)      Z zig-zag     M statua(X)
   v vuoto(X)    X transenna (apre con 3 indizi -> gate)
   (X) = solido
   Town/woods generate e validate con scratchpad/genmaps.js (BFS su porte/npc). */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  var GAME = G.GAME;
  var M = {};
  GAME.maps = M;

  M.SOLID = {
    T: 1, S: 1, w: 1,
    '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
    i: 1, C: 1, t: 1, h: 1, K: 1, U: 1,
    Y: 1, R: 1, M: 1, v: 1
  };
  M.isSolid = function (ch) { return !ch || !!M.SOLID[ch]; };

  M.maps = {
    town: {
      id: 'town',
      rows: [
        //         1111111111222222222233333333334444444444555555
        //01234567890123456789012345678901234567890123456789012345
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTXTTTTT', // 0  X = sentiero bosco
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTpTTTTT', // 1
        'T.................................................p....T', // 2
        'T....TTTTTTTTTT....TTTTTTTTTT........TTTTTTTTTT...p....T', // 3  siepi dietro hotel/ospedale/palmer
        'T....4444444444.....55555555.........3333333333...p....T', // 4
        'T....4444444444.....55555555.........3333333333...p....T', // 5
        'T....4444D44444.....555D5555.........33333D3333...p....T', // 6  hotel / ospedale / casa Palmer
        'T........p.............p..................p.......p....T', // 7
        'T........p.............p..................p.......p....T', // 8
        'T........p..........T..p.........T........p.......p....T', // 9
        'T........p.............p..................p.......p....T', // 10
        'T........p.............p..................p.......p....T', // 11
        'T........p.............p..................p.......p....T', // 12
        'T........p.............p..................p.......p....T', // 13
        'Trrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', // 14 uscita est -> vagone (Atto 3)
        'Trrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', // 15 uscita est -> vagone (Atto 3)
        'T..........................rr..........................T', // 16
        'T......TTTTTTTTTTT.........rr........TTTTTTTTTTT.......T', // 17 siepi dietro distretto/diner
        'T......11111111111.........rr........22222222222.......T', // 18
        'T......11111111111.........rr........22222222222.......T', // 19
        'T......11111D11111.........rr........22222D22222.......T', // 20 distretto / Double R
        'T...........p...........T..rr.............p............T', // 21
        'T..T........p..............rr.............p.........T..T', // 22
        'T...........p..............rr.............p............T', // 23
        'T..........................rr..........................T', // 24
        'T....................T.....rr..........................T', // 25
        'T...wwwwwwwwww.............rr...............66666666...T', // 26 lago / roadhouse
        'T...wwwwwwwwww.............rr......T........66666666...T', // 27
        'T...wwwwwwwwww.............rr...............666D6666...T', // 28 porta roadhouse
        'T...wwwwwwwwww.............rr..................p.......T', // 29
        'T...wwwwwwwwww....T........rr.S................p..T....T', // 30 cartello Benvenuti
        'T...wwwwwwwwww.............rr..........................T', // 31
        'T..........................rr..........................T', // 32
        'T..........................rr..........................T', // 33
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 34
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'  // 35
      ],
      doors: {
        '9,6':  { to: 'hotel_gn', tx: 8, ty: 10, dir: 'up', needsFlag: 'sogno_fatto', blockedMsg: 'hotel_locked' },
        '23,6': { to: 'hospital', tx: 5, ty: 8, dir: 'up', needsFlag: 'sogno_fatto', blockedMsg: 'hospital_locked' },
        '42,6': { to: 'palmer', tx: 7, ty: 10, dir: 'up' },
        '12,20': { to: 'sheriff', tx: 6, ty: 8, dir: 'up' },
        '42,20': { to: 'diner', tx: 6, ty: 8, dir: 'up' },
        '47,28': { to: 'roadhouse', tx: 7, ty: 8, dir: 'up', needsFlag: 'atto4', blockedMsg: 'roadhouse_chiuso' },
        '55,14': { to: 'traincar', tx: 2, ty: 7, dir: 'right', needsFlag: 'atto3', blockedMsg: 'est_bloccato' },
        '55,15': { to: 'traincar', tx: 2, ty: 7, dir: 'right', needsFlag: 'atto3', blockedMsg: 'est_bloccato' }
      },
      interact: { '30,30': 'cartello', '15,28': 'lago_riva' },
      gate: { x: 50, y: 0, to: 'woods', tx: 14, ty: 20, dir: 'up' }
    },

    sheriff: {
      id: 'sheriff',
      rows: [
        'iiiiiiiiiiiiii', // 0
        'iffffffffffffi', // 1 Andy(2,1) Truman(9,1)
        'ifCCffffCCfffi', // 2 scrivanie
        'iffffffffffffi', // 3
        'iffffffffffffi', // 4 Hawk(11,4)
        'iffCCCCffffffi', // 5 bancone Lucy
        'iffffffffffffi', // 6 Lucy(4,6)
        'iffffffffffffi', // 7
        'iffffffffffffi', // 8 (spawn 6,8)
        'iiiiiiDDiiiiii'  // 9
      ],
      doors: {
        '6,9': { to: 'town', tx: 12, ty: 21, dir: 'down' },
        '7,9': { to: 'town', tx: 12, ty: 21, dir: 'down' }
      },
      interact: {}
    },

    palmer: {
      id: 'palmer',
      rows: [
        'iiiiiiiiiiiiiiii', // 0
        'iKKfffUffffffffi', // 1 camera di Laura: letto, comò (6,1) da ispezionare
        'iffffffffffffffi', // 2
        'iffffffffffffffi', // 3
        'iiiiffiiiiiiiiii', // 4 corridoio c4-5
        'iffffffffffffffi', // 5
        'ifftffcccccffffi', // 6
        'ifffffcccccffffi', // 7 Sarah(9,7)
        'ifffffcccccffffi', // 8 Leland(12,8)
        'iffffffffffffffi', // 9
        'iffffffffffffffi', // 10 (spawn 7,10)
        'iiiiiiiDDiiiiiii'  // 11
      ],
      doors: {
        '7,11': { to: 'town', tx: 42, ty: 7, dir: 'down' },
        '8,11': { to: 'town', tx: 42, ty: 7, dir: 'down' }
      },
      interact: { '6,1': 'cameraLaura' }
    },

    hotel_gn: {
      id: 'hotel_gn',
      rows: [
        'iiiiiiiiiiiiiiiiii', // 0
        'ifffffffffffiKKUfi', // 1  stanza 315: letto, comò (15,1) da ispezionare
        'ifffffffffffiffffi', // 2
        'ifffffffffffiffffi', // 3
        'iffffffffffffffffi', // 4  corridoio si apre sulla stanza
        'iffffffffffffffffi', // 5
        'iffffffffffffffffi', // 6
        'iffffffffffffffffi', // 7  Ben Horne(5,7)
        'ifffCCCCfffffffffi', // 8  bancone reception
        'iffffffffffffffffi', // 9  Audrey(12,9)
        'iffffffffffffffffi', // 10 (spawn 8,10)
        'iiiiiiiiDDiiiiiiii'  // 11
      ],
      doors: {
        '8,11': { to: 'town', tx: 9, ty: 7, dir: 'down' },
        '9,11': { to: 'town', tx: 9, ty: 7, dir: 'down' }
      },
      interact: { '15,1': 'specchio315' }
    },

    hospital: {
      id: 'hospital',
      rows: [
        'iiiiiiiiiiii', // 0
        'iKKffffffffi', // 1  letto di Ronette (2,1) da ispezionare
        'iffffffffffi', // 2
        'iffffKKffffi', // 3
        'iffffffffffi', // 4
        'iffffffffKKi', // 5
        'iffffffffffi', // 6  Gerard(7,6)
        'iffffffffffi', // 7
        'iffffffffffi', // 8  (spawn 5,8)
        'iiiiiDDiiiii'  // 9
      ],
      doors: {
        '5,9': { to: 'town', tx: 23, ty: 7, dir: 'down' },
        '6,9': { to: 'town', tx: 23, ty: 7, dir: 'down' }
      },
      interact: { '2,1': 'ronette_letto' }
    },

    diner: {
      id: 'diner',
      rows: [
        'iiiiiiiiiiiiii', // 0
        'iffffffffffffi', // 1 Norma(5,1)
        'iffCCCCCCffffi', // 2 bancone
        'iffffffffffffi', // 3
        'iffffffffffffi', // 4 Shelly(8,4)
        'ifttffffttfffi', // 5 Log Lady(4,5)
        'iffffffffffffi', // 6
        'ifttffffttfffi', // 7
        'iffffffffffffi', // 8 (spawn 6,8)
        'iiiiiiDDiiiiii'  // 9
      ],
      doors: {
        '6,9': { to: 'town', tx: 42, ty: 21, dir: 'down' },
        '7,9': { to: 'town', tx: 42, ty: 21, dir: 'down' }
      },
      interact: {}
    },

    woods: {
      id: 'woods',
      rows: [
        //         111111111122222222
        //0123456789012345678901234567
        'TTTTTTTTTTTTRRDRTTTTTTTTTTTT', // 0  tende -> Red Room (14,0)
        'TgggggTggggggTpgggggTggggggT', // 1
        'TggggTggggggTgpggggTggggggTT', // 2
        'TgggTggggggTggpgggTggggggTgT', // 3
        'TggTggggggTgggpggTggggggTggT', // 4
        'TgTggggggTggggpgTggggggTgggT', // 5
        'TTggggggTgggggpTggggggTggggT', // 6
        'TggggggTggggggYggggggTgggggT', // 7  cerchio di sicomori
        'TgggggTgggggYgpgYgggTggggggT', // 8
        'TggggTgggggggooggggTggggggTT', // 9  olio (13-14, 9-10)
        'TgggTggggggYgooggYgggggggTgT', // 10
        'TggTggggggggggpgggggggggTggT', // 11
        'TgTggggggTggYgpgYggggggTgggT', // 12
        'TTggggggTgggggYgggggggTggggT', // 13
        'TggggggTgggSggpggggggTgggggT', // 14 cartello Glastonbury Grove (11,14)
        'TgggggTggggggTpgggggTggggggT', // 15
        'TggggTggggggTgpggggTggggggTT', // 16
        'TgggTggggggTggpgggTggggggTgT', // 17
        'TggTggggggTgggpggTggggggTggT', // 18
        'TgTggggggTggggpgTggggggTgggT', // 19
        'TTggggggTgggggpTggggggTggggT', // 20 (spawn 14,20)
        'TTTTTTTTTTTTTTpTTTTTTTTTTTTT'  // 21 uscita sud -> città
      ],
      doors: {
        '14,0': { to: 'redroom', tx: 8, ty: 9, dir: 'up' },
        '14,21': { to: 'town', tx: 50, ty: 1, dir: 'down' }
      },
      interact: { '14,10': 'olio', '11,14': 'cartelloBosco' }
    },

    redroom: {
      id: 'redroom',
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
      doors: {
        '8,11': { to: 'hotel_gn', tx: 14, ty: 2, dir: 'down' } // risveglio: Cooper si sveglia nella stanza 315 del Great Northern
      },
      interact: {},
      onEnter: 'redroom'
    },

    /* ---------------- Atto 3: il confine ---------------- */

    traincar: {
      id: 'traincar',
      rows: [
        //         111111111122
        //0123456789012345678901234
        'TTTTTTTTTTTTTTTTTTTTTDTT', // 0  D = sentiero verso One Eyed Jacks
        'TggggggggggggggggggggpgT', // 1
        'TggTggggggggggggggggSpgT', // 2  cartello One Eyed Jacks
        'TgggggTgiiiiiiiiTggggpgT', // 3  parete nord del vagone
        'TgggTgggiffffffigggTgpgT', // 4  interno: mucchio (10,4) hawk (12,4)
        'TgggggggiffffffigggggpTT', // 5  interno: anello (13,5)
        'TggggSggiiiDiiiigggggpgT', // 6  cartello ponte, porta sud del vagone (11,6)
        'ppppppppppppppppppppppgT', // 7  sentiero est-ovest, uscita a ovest -> città (0,7)
        'TggggggggggggggggggggggT', // 8
        'TgTggggggggggggggTggggTT', // 9
        'TggTgggggTgggggggggggggT', // 10
        'TgggggTggggggggggggggggT', // 11
        'TggggggggggggggggggggggT', // 12
        'TTTTTTTTTTTTTTTTTTTTTTTT'  // 13
      ],
      doors: {
        '0,7': { to: 'town', tx: 54, ty: 14, dir: 'left' },
        '21,0': { to: 'oej', tx: 8, ty: 8, dir: 'up' }
      },
      interact: {
        '5,6': 'sign_ponte',
        '20,2': 'sign_oej',
        '10,4': 'mucchio_terra',
        '13,5': 'anello_interact'
      }
    },

    oej: {
      id: 'oej',
      rows: [
        'iiiiiiiiiiiiiiii', // 0
        'iffffffffffffffi', // 1
        'iffttffffffttffi', // 2  tavoli da gioco
        'iffffffffffffffi', // 3
        'iffffCCCCCCffffi', // 4  bancone del casinò
        'iffffffffffffffi', // 5  Jacques (7,5)
        'iffffffffffffffi', // 6
        'iffttffffffttffi', // 7  tavoli, Audrey (13,7)
        'iffffffffffffffi', // 8  (spawn 8,8)
        'iiiiiiiDDiiiiiii'  // 9  porta sud -> vagone del treno
      ],
      doors: {
        '7,9': { to: 'traincar', tx: 21, ty: 1, dir: 'down' },
        '8,9': { to: 'traincar', tx: 21, ty: 1, dir: 'down' }
      },
      interact: {}
    },

    /* ---------------- Atto 4: il roadhouse ---------------- */

    roadhouse: {
      id: 'roadhouse',
      rows: [
        'iiiiiiiiiiiiiiii', // 0
        'iCCCCCCCCCCCCCCi', // 1  palco, bordo solido (Gigante, seconda apparizione: 8,1)
        'iffffffffffffffi', // 2
        'ifftthhtthhttffi', // 3  tavoli e sedie
        'iffffffffffffffi', // 4
        'ifffCCCCfffffffi', // 5  bancone
        'iffffffffffffffi', // 6
        'ifftthhtthhttffi', // 7  tavoli e sedie
        'iffffffffffffffi', // 8  (spawn 7,8 / 8,8)
        'iiiiiiiDDiiiiiii'  // 9  uscita -> città
      ],
      doors: {
        '7,9': { to: 'town', tx: 47, ty: 29, dir: 'down' },
        '8,9': { to: 'town', tx: 47, ty: 29, dir: 'down' }
      },
      interact: { '8,1': 'palco_gigante' }
    }
  };

  for (var k in M.maps) {
    var m = M.maps[k];
    m.height = m.rows.length;
    m.width = m.rows[0].length;
  }
})();
