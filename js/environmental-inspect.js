/* environmental-inspect.js — fallback d'ispezione per le tile solide.
 * Il registro resta compatto: un archetipo per simbolo, override solo dove
 * contesto o stato cambiano davvero ciò che Cooper può osservare.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : globalThis;
  var GAME = root.GAME = root.GAME || {};

  function line(slug, text) { return { id: 'env_' + slug, text: text }; }

  var ARCHETYPES = {
    T: line('evergreen', 'Gli aghi serrano la chioma fino a nascondere il tronco; fra questi alberi la distanza sa mentire.'),
    S: line('sign', 'Le lettere sull’asse hanno perso vernice, i due pali no: il cartello resiste meglio del messaggio.'),
    w: line('water', 'Al bordo della riva il riflesso si spezza in acqua scura e ricomincia un poco più in là.'),
    '0': line('mixed_use_shop', 'Una bottega sotto casa: insegna crema, vetrina stretta, due finestre che prendono la luce del tetto.'),
    '1': line('sheriff_building', 'Porta blu fra ardesia e mattoni chiari: il distretto ha l’aria di un posto dove ogni passo viene sentito.'),
    '2': line('diner_building', 'Il tendalino crema taglia i mattoni rossi del Double R, e già da fuori il caffè vince la discussione.'),
    '3': line('residence_building', 'Scandole, assito, finestre basse: dalla casa il calore arriva al vetro e le voci fino alla strada.'),
    '4': line('great_northern', 'Il Great Northern alza il portico fra grossi tronchi, come se l’albergo avesse imparato a stare nel bosco.'),
    '5': line('hospital_building', 'La croce rossa sullo stucco chiaro basta a farmi rallentare ogni volta che riconosco l’ospedale.'),
    '6': line('roadhouse_building', 'Le tavole scure inghiottono il Roadhouse quasi tutto; resta accesa l’insegna rossa.'),
    '7': line('bookhouse_building', 'L\u2019insegna dice BOOK HOUSE. La porta del luogo di riunione è chiusa; oltre il vetro, una lampada resta accesa.'),
    '8': line('lodge_building', 'Tetto verde, mattoni viola, facciata chiusa: la Loggia concede una porta sola.'),
    '9': line('horne_department_store', 'HORNE STORE. La porta \u00e8 chiusa; nelle due vetrine la merce degli Horne aspetta in file troppo dritte.'),
    i: line('interior_wall', 'La cornice corre lungo il muro e torna al punto di partenza. Così imparo la misura della stanza.'),
    C: line('counter', 'Il bordo del bancone è liscio nel punto dove si appoggiano le mani durante le risposte difficili.'),
    t: line('table', 'Sul tavolo ci starebbero due tazze, il mio fascicolo e una conversazione tenuta abbastanza bassa.'),
    h: line('chair', 'Schienale alto, seduta chiara, gambe corte: la sedia vuota guarda già dalla parte giusta.'),
    K: line('bed', 'Cuscino bianco, coperta rossa, telaio scuro: il letto vuoto conserva il peso al centro.'),
    U: line('dresser', 'Due cassetti e una maniglia dorata; il comò resta chiuso sotto il palmo della mia mano.'),
    Y: line('sycamore', 'Il sicomoro porta corteccia pallida e chioma ad anello. Ai suoi piedi il mio passo perde velocità.'),
    R: line('red_curtain', 'Le tende di velluto scendono dritte, ma una piega continua a muoversi dove l’aria dovrebbe finire.'),
    M: line('statue', 'La statua grigia poggia su una base quadrata, e il pavimento a zig-zag le ruba ogni equilibrio.'),
    v: line('void', 'Nero pieno fino al margine: il vuoto comincia esattamente dove finiscono le mie scarpe.'),
    G: line('grave', 'La lapide arrotondata lascia al nome più spazio che alle date, ed è ancora troppo poco.'),
    L: line('streetlamp', 'Il lampione sale diritto e la luce si ferma nel vetro, piccola come una stanza vista da fuori.'),
    P: line('telephone_pole', 'Due isolatori sul palo tengono i fili separati. In alto il vento li fa parlare insieme.'),
    B: line('bench', 'La panchina ha due fasce di legno consumate in modo diverso e un sedile abbastanza lungo per il silenzio.'),
    F: line('fence', 'Fra i pali bianchi della staccionata l’erba passa senza chiedere il permesso.'),
    A: line('flowerbed', 'Tre colori di fiori dentro un cordolo basso: una piccola ostinazione contro tutto quel verde.'),
    H: line('hydrant', 'L’idrante rosso aspetta sul bordo della strada con la pazienza delle cose utili.'),
    E: line('mailbox', 'La bandierina rossa della cassetta è abbassata, ma il metallo conserva il suono di ogni messaggio.'),
    n: line('bush', 'All’altezza del cespuglio, la chioma di foglie chiude quasi tutto il mondo sotto il cielo.'),
    q: line('crate', 'La cassa ha tavole ocra, fasce scure e una sola stecca sul coperchio; il resto rimane dentro.'),
    V: line('parked_car', 'L’auto parcheggiata trattiene il cielo sul parabrezza; sotto il cofano il metallo perde calore.'),
    J: line('arrival_cabin', 'La cabina di legno ha una finestra accesa e un tetto basso. La porta è serrata; nessuna soglia promette un ingresso.')
  };

  var MAP_TILE = {
    'arrival:9': line('arrival_shop', 'Il piccolo emporio è chiuso. Vetrina e porta sono serrate; il telefono nero sull’insegna sembra aspettare una chiamata.'),
    'arrival:J': line('arrival_cabin_closed', 'La veranda finisce contro una porta serrata. Dalla finestra accesa non arriva nessun movimento.'),
    'town:T': line('town_evergreen', 'Fra le chiome del paese la luce cambia verde a ogni passo e lascia i tronchi nella stessa ombra.'),
    'woods:T': line('woods_evergreen', 'Nel bosco il bordo blu-verde delle chiome emerge soltanto sopra il viola del sottobosco.'),
    'traincar:T': line('traincar_evergreen', 'Gli alberi crescono storti attorno al vagone, mentre binari e assi insistono a restare diritti.'),
    'town:G': line('town_grave', 'Sei lapidi in due file; leggo i nomi, lascio passare un respiro, poi le date.'),
    'town:q': line('town_service_crate', 'La cassa di servizio porta una scheggia chiara sul coperchio, proprio dove la mano cercherebbe presa.'),
    'woods:q': line('woods_crate', 'La cassa mette quattro angoli dritti in mezzo al bosco e per questo sembra più rumorosa degli alberi.'),
    'sheriff:T': line('sheriff_wall', 'Le cornici del distretto separano uffici e passaggi. Lucy batte un tasto e il suono attraversa il muro.'),
    'palmer:i': line('palmer_wall', 'Le pareti calde di casa Palmer accompagnano il corridoio fino alla camera di Laura.'),
    'hotel_gn:i': line('hotel_wall', 'I pannelli del Great Northern si ripetono lungo il corridoio. Ogni passo ritorna con voce più bassa.'),
    'hospital:T': line('hospital_wall', 'Fra le pareti dell’ospedale il corridoio è corto, ma nessuna porta sembra vicina.'),
    'room_315:T': line('room315_wall', 'Pannelli di pino sopra la boiserie. Il Great Northern non lascia vedere i chiodi.'),
    'diner:i': line('diner_wall', 'Al Double R, le cornici hanno assorbito tanto caffè da sembrare più scure vicino ai tavoli.'),
    'traincar:i': line('traincar_wall', 'Le pareti del vagone stringono il passaggio finché le mie spalle sfiorano il metallo.'),
    'oej:i': line('oej_wall', 'La parete scura di One Eyed Jack’s mangia il bordo della stanza. Il mio bavero chiaro resta in vista.'),
    'roadhouse:i': line('roadhouse_wall', 'Contro la parete del Roadhouse, il basso passa nel legno e il palco vibra ai margini.'),
    'sheriff:C': line('sheriff_desk', 'Due coppie di scrivanie nel distretto lasciano al centro un passaggio largo quanto le mappe di Harry.'),
    'hotel_gn:C': line('hotel_counter', 'Sul bancone del Great Northern una chiave e una domanda occupano quasi lo stesso spazio.'),
    'diner:C': line('diner_counter', 'Il banco del Double R tiene caffè, torta e gomiti senza costringere nessuna voce ad alzarsi.'),
    'oej:C': line('oej_counter', 'Sul banco di One Eyed Jack’s tengo le mani aperte, con ogni gesto visibile fino alla punta delle dita.'),
    'roadhouse:C': line('roadhouse_counter', 'Dal bancone del Roadhouse il palco sembra a portata di mano e il caffè molto più lontano.'),
    'sheriff:t': line('sheriff_table', 'Il tavolo centrale lascia una sedia per Harry e una per me, con il fascicolo esattamente in mezzo.'),
    'palmer:t': line('palmer_table', 'Il tavolo quadrato dei Palmer porta quattro sedie vicine e un segno chiaro lasciato da un piatto.'),
    'diner:t': line('diner_table', 'Sul tavolo del Double R c’è posto per due tazze, una fetta di torta e il mio taccuino ancora chiuso.'),
    'oej:t': line('oej_gaming_table', 'Il centro del tavolo da gioco è libero. I posti attorno sono consumati da molte attese.'),
    'roadhouse:t': line('roadhouse_table', 'I tavoli del Roadhouse guardano il palco. Da quello laterale la musica lascia ancora spazio ai pensieri.'),
    'sheriff:h': line('sheriff_chair', 'Le sedie del distretto stanno faccia a faccia, schienali chiari sopra il legno scuro.'),
    'redroom:h': line('redroom_chair', 'La sedia color miele potrebbe stare in un salotto, finché il pavimento rosso le passa sotto a zig-zag.'),
    'roadhouse:h': line('roadhouse_chair', 'La sedia del Roadhouse tiene lo schienale al muro e la seduta rivolta al palco.'),
    'palmer:K': line('laura_bed', 'Il letto di Laura: coperta rossa, cuscino bianco, telaio scuro, una piega corta sul lato della parete.'),
    'hotel_gn:K': line('hotel_bed', 'Il letto del Great Northern è teso e pronto. Mi siedo sul bordo senza slacciare le scarpe.'),
    'palmer:U': line('laura_dresser', 'Il comò di Laura resta chiuso: piano chiaro, fronte bruno, maniglia dorata fredda al tatto.'),
    'hotel_gn:U': line('hotel_dresser', 'Lascio il taccuino sul comò del Great Northern e la maniglia dorata scompare sotto il suo bordo.')
  };

  var COORD = {
    'town:30,30': line('welcome_sign', '«Benvenuti a Twin Peaks — popolazione: 51.201.» La cifra precisa occupa più spazio del benvenuto.'),
    'town:50,22': line('laura_grave', '«LAURA PALMER, 1972-1989.» Diciassette anni compressi fra un nome e due date.'),
    'woods:11,16': line('grove_sign', '«GLASTONBURY GROVE.» Il nome è inciso nel legno; i sicomori lo tengono stretto in cerchio.'),
    'traincar:20,2': line('oej_sign', 'Sotto «ONE EYED JACKS — oltre il confine», la freccia indica bene la strada e tace sulla giurisdizione.'),
    'traincar:4,6': line('bridge_sign', 'Dal parapetto del ponticello la riva scivola sotto le assi, e il paletto della contea resta piantato di là dall’acqua.'),
    'traincar:12,3': line('traincar_stove', 'Contro la parete del vagone, una stufa di ghisa fredda sotto il palmo.'),
    'traincar:10,6': line('traincar_cards', 'Un sedile divelto. Sotto, qualcosa di chiaro.'),
    'traincar:21,2': line('traincar_tracks_north', 'Il terreno segna un varco stretto fra gli alberi.')
  };

  var COORD_CANON = {
    'town:30,30': 'sign_town',
    'town:50,22': 'tomba_laura',
    'woods:11,16': 'sign_grove',
    'traincar:20,2': 'sign_oej',
    'traincar:4,6': 'sign_ponte'
  };

  // Stesso carattere grafico, volume diverso: regioni assegnate a coordinate
  // senza duplicare decine di righe authored nel registro.
  var PALMER_HOUSE = line('palmer_house', 'Scandole di cedro, assito crema, veranda: casa Palmer è intatta fino alla finestra della camera di Laura.');
  PALMER_HOUSE.scope = { kind: 'region', mapId: 'town', tile: '3', x0: 40, y0: 4, x1: 44, y1: 6 };
  var ROADHOUSE_STAGE = line('roadhouse_stage', 'Sfioro il bordo del palco del Roadhouse con la punta della scarpa. Preferisco restare nel pubblico.');
  ROADHOUSE_STAGE.scope = { kind: 'region', mapId: 'roadhouse', tile: 'C', x0: 1, y0: 1, x1: 14, y1: 1 };
  var cx, cy;
  for (cy = PALMER_HOUSE.scope.y0; cy <= PALMER_HOUSE.scope.y1; cy++) {
    for (cx = PALMER_HOUSE.scope.x0; cx <= PALMER_HOUSE.scope.x1; cx++) {
      if (GAME.maps.maps.town.rows[cy].charAt(cx) === '3') COORD['town:' + cx + ',' + cy] = PALMER_HOUSE;
    }
  }
  for (cx = 1; cx <= 14; cx++) COORD['roadhouse:' + cx + ',1'] = ROADHOUSE_STAGE;

  // Ospedale nativo: letti resi in glifo T solido, distinti solo per coordinata.
  var HOSPITAL_BED = line('hospital_bed', 'Due letti uguali in corsia, due coperte tirate fino alla stessa altezza.');
  var RONETTE_BED_CELLS = [];
  var GERARD_BED_CELLS = [];
  for (cy = 3; cy <= 5; cy++) {
    for (cx = 3; cx <= 4; cx++) { COORD['hospital:' + cx + ',' + cy] = HOSPITAL_BED; RONETTE_BED_CELLS.push(cx + ',' + cy); }
    for (cx = 9; cx <= 10; cx++) { COORD['hospital:' + cx + ',' + cy] = HOSPITAL_BED; GERARD_BED_CELLS.push(cx + ',' + cy); }
  }
  HOSPITAL_BED.scope = { kind: 'coords', mapId: 'hospital', tile: 'T', keys: RONETTE_BED_CELLS.concat(GERARD_BED_CELLS) };

  var STATE = [
    {
      mapId: 'woods', tile: 'Y', flag: 'sogno_fatto',
      entry: line('sycamore_after_dream', 'Riconosco corteccia pallida e chioma ad anello. Stavolta conto anche lo spazio fra un sicomoro e l’altro.')
    },
    {
      mapId: 'town', tile: 'G', flag: 'leland_morto',
      entry: line('town_grave_after_leland', 'Conosco il nome che finirà nel fascicolo. Davanti alle lapidi, non riesco a pronunciarlo.')
    },
    {
      mapId: 'traincar', tile: 'i', clue: 'anello',
      entry: line('traincar_after_ring', 'L’anello non è più sulla traversa. Sulla parete del vagone, la sua ombra continua a sembrarmi al centro.')
    },
    {
      mapId: 'hospital', tile: 'T', coords: RONETTE_BED_CELLS, evidence: 'T1_RONETTE_BOB',
      entry: line('hospital_bed_after_ronette', 'Ronette ha pronunciato un nome. Gli altri letti restano uguali; il suo adesso ha una voce.')
    }
  ];

  function register(entry, meta) {
    if (!entry || !GAME.Data || !GAME.Data.dialogues) return;
    var existing = GAME.Data.dialogues[entry.id];
    if (existing && existing.environmental) return;
    GAME.Data.dialogues[entry.id] = {
      pages: [{ name: 'COOPER', text: entry.text }],
      transient: true,
      environmental: true,
      environmentalMeta: {
        sourceClass: meta.sourceClass,
        scope: entry.scope || meta.scope,
        canonDialogue: meta.canonDialogue || null,
        coordinateSpecific: !!meta.coordinateSpecific
      }
    };
  }

  Object.keys(ARCHETYPES).forEach(function (key) {
    register(ARCHETYPES[key], { sourceClass: 'rendered-tile', scope: { kind: 'tile', tile: key } });
  });
  Object.keys(MAP_TILE).forEach(function (key) {
    var parts = key.split(':');
    register(MAP_TILE[key], {
      sourceClass: 'reviewed-map-tile',
      scope: { kind: 'map-tile', mapId: parts[0], tile: parts[1] }
    });
  });
  Object.keys(COORD).forEach(function (key) {
    var colon = key.indexOf(':'), mapId = key.slice(0, colon), xy = key.slice(colon + 1).split(',');
    var canonDialogue = COORD_CANON[key] || null;
    register(COORD[key], {
      sourceClass: canonDialogue ? 'authored-canon' : 'reviewed-coordinate',
      scope: { kind: 'coord', mapId: mapId, x: +xy[0], y: +xy[1] },
      canonDialogue: canonDialogue,
      coordinateSpecific: true
    });
  });
  STATE.forEach(function (rule) {
    register(rule.entry, {
      sourceClass: 'state-context',
      scope: { kind: 'state', mapId: rule.mapId, tile: rule.tile, coords: rule.coords || null, flag: rule.flag || null, clue: rule.clue || null, evidence: rule.evidence || null }
    });
  });

  function resolve(mapId, x, y, state) {
    var maps = GAME.maps && GAME.maps.maps;
    var map = maps && maps[mapId];
    if (!map || y < 0 || x < 0 || y >= map.rows.length || x >= map.rows[y].length) return null;
    var tile = map.rows[y].charAt(x);
    if (!GAME.maps.SOLID[tile] || !ARCHETYPES[tile]) return null;

    for (var i = 0; i < STATE.length; i++) {
      var rule = STATE[i];
      var stateMatches = rule.evidence ? !!(state && state.evidence && state.evidence[rule.evidence]) :
        rule.flag ? !!(state && state.flags && state.flags[rule.flag]) :
        !!(rule.clue && state && state.clues && state.clues.indexOf(rule.clue) >= 0);
      var coordMatches = !rule.coords || rule.coords.indexOf(x + ',' + y) >= 0;
      if (rule.mapId === mapId && rule.tile === tile && coordMatches && stateMatches) {
        return rule.entry.id;
      }
    }
    var entry = COORD[mapId + ':' + x + ',' + y] || MAP_TILE[mapId + ':' + tile] || ARCHETYPES[tile];
    return entry ? entry.id : null;
  }

  GAME.EnvironmentalInspect = {
    resolve: resolve,
    archetypes: ARCHETYPES,
    overrides: { mapTile: MAP_TILE, coord: COORD, state: STATE }
  };
})();
