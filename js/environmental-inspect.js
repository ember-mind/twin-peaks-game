/* environmental-inspect.js — fallback d'ispezione per le tile solide.
 * Il registro resta compatto: un archetipo per simbolo, override solo dove
 * contesto o stato cambiano davvero ciò che Cooper può osservare.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : globalThis;
  var GAME = root.GAME = root.GAME || {};

  function line(slug, text) { return { id: 'env_' + slug, text: text }; }

  var ARCHETYPES = {
    T: line('evergreen', 'Conto tre livelli nella chioma e perdo il tronco sotto gli aghi: buon promemoria sui limiti della visuale.'),
    S: line('sign', 'Leggo le lettere sull’asse, poi guardo i due pali e l’erba: testo e luogo vanno tenuti insieme.'),
    w: line('water', 'Per misurare questa riva comincio dal bordo, non dai riflessi: l’acqua cambia continuamente.'),
    '0': line('mixed_use_shop', 'Tetto bordeaux, insegna crema, vetrina stretta: una piccola bottega con casa al piano superiore.'),
    '1': line('sheriff_building', 'Per orientarmi nel distretto seguo il blu della porta tra ardesia e mattoni chiari.'),
    '2': line('diner_building', 'Il tendalino crema tra tetto blu e mattoni rossi mi basta per riconoscere il Double R.'),
    '3': line('residence_building', 'Guardo scandole, assito e finestre: proporzioni da casa, non da monumento.'),
    '4': line('great_northern', 'Il Great Northern sembra metà albergo e metà bosco; confronto portico, tronchi e scandole per trovare il confine.'),
    '5': line('hospital_building', 'Guardo la croce rossa sullo stucco chiaro e abbasso la voce; funzione e stile qui hanno colori diversi.'),
    '6': line('roadhouse_building', 'Il Roadhouse sembra sparire nelle tavole scure, finché l’insegna rossa non riprende lo sguardo.'),
    '7': line('bookhouse_building', 'Noto pochissimo vetro nel grigio del Bookhouse; ingresso e finestre restano profondi nella facciata.'),
    '8': line('lodge_building', 'La Loggia sembra trattenere tutto nel tetto verde e nei mattoni viola; una sola porta rompe la simmetria.'),
    '9': line('horne_department_store', 'Una H dorata divide il tetto petrolio dalle quattro vetrine. La merce oltre il vetro resta una griglia chiara.'),
    i: line('interior_wall', 'Passo il dito lungo la cornice del muro e lascio che la stanza mi si sistemi in testa.'),
    C: line('counter', 'Appoggio due dita al bordo del bancone. Quando ascolto, preferisco occupare meno spazio possibile.'),
    t: line('table', 'Questo tavolo chiede una tazza di caffè e buona compagnia. Per ora mi basta il caffè.'),
    h: line('chair', 'Anche vuota, la sedia suggerisce una direzione; seguo schienale alto, seduta chiara e gambe corte.'),
    K: line('bed', 'Un letto vuoto conserva una forma umana senza imitarla; noto cuscino bianco, coperta rossa e telaio scuro.'),
    U: line('dresser', 'Conto due cassetti e una maniglia dorata; non apro un comò senza una ragione migliore della curiosità.'),
    Y: line('sycamore', 'Sicomoro: corteccia pallida, chioma ad anello, passo che rallenta da solo.'),
    R: line('red_curtain', 'Le pieghe del velluto scendono dritte. Non vedo una finestra, eppure continuo ad aspettarmi aria.'),
    M: line('statue', 'La statua sembra meno ferma sul pavimento a zig-zag; confronto la figura grigia con la base quadrata.'),
    v: line('void', 'Nero pieno fino al margine. Qui misurare il vuoto è più onesto che descriverlo.'),
    G: line('grave', 'La pietra ha sommità arrotondata e base corta. Quasi niente spazio per un nome.'),
    L: line('streetlamp', 'Alzo gli occhi lungo il lampione, poi torno al piede del palo. Ormai è un movimento automatico.'),
    P: line('telephone_pole', 'Due isolatori sulla traversa. Li seguo con gli occhi finché il collo mi ricorda di tornare a terra.'),
    B: line('bench', 'Una panchina vuota offre spazio senza imporre compagnia; noto due fasce di legno e gambe alle estremità.'),
    F: line('fence', 'Uso gli intervalli tra i pali bianchi per seguire il confine senza perdere di vista l’erba oltre.'),
    A: line('flowerbed', 'Mi fermo sui tre colori dei fiori, poi conto il cordolo: non tutto ciò che attira lo sguardo è urgente.'),
    H: line('hydrant', 'L’idrante rosso ha tutta l’aria di aspettare il proprio momento. Gli auguro una giornata tranquilla.'),
    E: line('mailbox', 'La bandierina rossa rende visibile perfino l’attesa di un messaggio; distinguo scatola, palo e segnale.'),
    n: line('bush', 'Mi abbasso all’altezza del cespuglio e da qui sparisce molto più mondo del previsto.'),
    q: line('crate', 'Registro ciò che vedo: tavole ocra, fasce scure, una stecca sul coperchio; il contenuto resta un’ipotesi.')
  };

  var MAP_TILE = {
    'town:T': line('town_evergreen', 'Contare tutte queste chiome sarebbe possibile e poco utile; noto invece come la luce cambia lo stesso verde.'),
    'woods:T': line('woods_evergreen', 'Distinguo il bordo blu-verde delle chiome solo perché il sottobosco vira al viola.'),
    'traincar:T': line('traincar_evergreen', 'Confronto il legno vivo degli alberi con le linee rigide del vagone e dei binari.'),
    'town:G': line('town_grave', 'Tra sei lapidi in due file, tengo i nomi separati dai numeri: è una forma minima di rispetto.'),
    'town:q': line('town_service_crate', 'Una cassa nella zona di servizio: la giro con lo sguardo e lascio il coperchio dov’è.'),
    'woods:q': line('woods_crate', 'Quattro angoli dritti in mezzo al bosco. La cassa riesce quasi a fare rumore restando immobile.'),
    'sheriff:i': line('sheriff_wall', 'Le cornici del distretto dividono bene uffici e passaggi. Il mio rapporto per Harry merita linee altrettanto pulite.'),
    'palmer:i': line('palmer_wall', 'Nella casa Palmer abbasso la voce e seguo le pareti calde lungo camere e corridoio.'),
    'hotel_gn:i': line('hotel_wall', 'I pannelli del Great Northern si ripetono lungo il corridoio, così mi oriento dal rumore dei miei passi.'),
    'hospital:i': line('hospital_wall', 'Conto pochi passi tra pareti, corridoio e camere; in ospedale anche la distanza pesa.'),
    'diner:i': line('diner_wall', 'Queste cornici appartengono al Double R quanto l’odore del caffè. Il secondo dettaglio è più persuasivo.'),
    'traincar:i': line('traincar_wall', 'Il vagone stringe le pareti attorno al passaggio e io tengo le spalle raccolte.'),
    'oej:i': line('oej_wall', 'La parete scura di One Eyed Jack’s assorbe quasi il bordo della stanza. Mi raddrizzo il bavero e resto visibile.'),
    'roadhouse:i': line('roadhouse_wall', 'Mi fermo contro la parete del Roadhouse e lascio che il palco venga a me.'),
    'sheriff:C': line('sheriff_desk', 'Due coppie di scrivanie e un passaggio centrale. Se Harry porta le mappe, so già dove stenderle.'),
    'hotel_gn:C': line('hotel_counter', 'Appoggio il taccuino al bancone del Great Northern, abbastanza largo per una chiave e una risposta breve.'),
    'diner:C': line('diner_counter', 'Sei moduli di banco al Double R. Abbastanza spazio per caffè, torta e una conversazione tenuta bassa.'),
    'oej:C': line('oej_counter', 'Poso entrambe le mani sul banco di One Eyed Jack’s, dove preferisco che ogni gesto arrivi con un istante d’anticipo.'),
    'roadhouse:C': line('roadhouse_counter', 'Dal bancone del Roadhouse il palco sembra più vicino. Mi viene da ordinare caffè, poi ricordo dove sono.'),
    'sheriff:t': line('sheriff_table', 'Due sedie ai lati del tavolo centrale. Poserei il fascicolo in mezzo e lascerei parlare Harry.'),
    'palmer:t': line('palmer_table', 'Nella zona giorno dei Palmer, il tavolo quadrato mi ricorda quanto poco spazio serva per riunire una famiglia.'),
    'diner:t': line('diner_table', 'Al tavolo del Double R c’è posto per due tazze e una fetta di torta, quindi prendo la sedia rivolta alla sala.'),
    'oej:t': line('oej_gaming_table', 'Sul tavolo da gioco il centro è libero. Istintivamente conto i posti invece delle puntate.'),
    'roadhouse:t': line('roadhouse_table', 'I tavoli del Roadhouse guardano il palco in file ordinate, ma ne sceglierei uno laterale dove la musica lascia pensare.'),
    'sheriff:h': line('sheriff_chair', 'Le due sedie ai lati del tavolo suggeriscono un confronto faccia a faccia; noto schienali chiari e legno scuro.'),
    'redroom:h': line('redroom_chair', 'La seduta color miele sembra quasi domestica; sul pavimento rosso a zig-zag non lo è più.'),
    'roadhouse:h': line('roadhouse_chair', 'Questa sedia ha già deciso: schienale al muro, occhi al palco. Per una sera accetto il suggerimento.'),
    'palmer:K': line('laura_bed', 'Guardo il letto di Laura senza cercare significati nei colori: coperta rossa, cuscino bianco, telaio scuro.'),
    'hotel_gn:K': line('hotel_bed', 'Il letto del Great Northern sembra pronto. Mi siedo sul bordo con le scarpe ai piedi.'),
    'hospital:K': line('hospital_bed', 'Conto sei letti identici e mi impongo di ricordare che chi li occupa non lo è.'),
    'palmer:U': line('laura_dresser', 'Registro il comò della camera di Laura senza aprirlo: piano chiaro, fronte bruno, maniglia dorata.'),
    'hotel_gn:U': line('hotel_dresser', 'Sul comò del Great Northern lascio il taccuino: occupa poco spazio e resta impossibile da dimenticare.')
  };

  var COORD = {
    'town:30,30': line('welcome_sign', 'Leggo due volte: «Benvenuti a Twin Peaks — popolazione: 51.201». La precisione della cifra mi resta in mente.'),
    'town:50,22': line('laura_grave', 'Leggo «LAURA PALMER, 1972-1989» e mi fermo sui diciassette anni: una voce non dovrebbe ridursi a due date.'),
    'woods:11,16': line('grove_sign', 'Leggo «GLASTONBURY GROVE» nel legno, poi guardo i sicomori: il nome delimita il luogo, non la sensazione.'),
    'traincar:20,2': line('oej_sign', 'Seguo la freccia sotto «ONE EYED JACKS — oltre il confine»; direzione chiara, giurisdizione meno semplice.'),
    'traincar:5,6': line('bridge_sign', 'Confronto il cartello di legno con il ponticello: segnaletica modesta per un confine importante.')
  };

  var COORD_CANON = {
    'town:30,30': 'sign_town',
    'town:50,22': 'tomba_laura',
    'woods:11,16': 'sign_grove',
    'traincar:20,2': 'sign_oej',
    'traincar:5,6': 'sign_ponte'
  };

  // Stesso carattere grafico, volume diverso: regioni assegnate a coordinate
  // senza duplicare decine di righe authored nel registro.
  var PALMER_HOUSE = line('palmer_house', 'Guardo scandole di cedro, assito crema e veranda; il lutto non altera la casa Palmer, altera chi la guarda.');
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

  var STATE = [
    {
      mapId: 'woods', tile: 'Y', flag: 'sogno_fatto',
      entry: line('sycamore_after_dream', 'Riconosco corteccia pallida e chioma ad anello. I sicomori sono gli stessi; è il mio sguardo a non esserlo.')
    },
    {
      mapId: 'town', tile: 'G', flag: 'leland_morto',
      entry: line('town_grave_after_leland', 'Ora conosco chi ha ucciso Laura; davanti alle lapidi, la risposta sembra ancora più piccola del danno.')
    },
    {
      mapId: 'traincar', tile: 'i', clue: 'anello',
      entry: line('traincar_after_ring', 'Ho trovato l’anello in questo vagone. Guardo di nuovo le pareti: il luogo è uguale, il significato no.')
    },
    {
      mapId: 'hospital', tile: 'K', flag: 'ronette_bob',
      entry: line('hospital_bed_after_ronette', 'Ronette ha pronunciato un nome. Conto gli altri letti identici; il suo isolamento appare ancora più netto.')
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
      scope: { kind: 'state', mapId: rule.mapId, tile: rule.tile, flag: rule.flag || null, clue: rule.clue || null }
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
      var stateMatches = rule.flag ? !!(state && state.flags && state.flags[rule.flag]) :
        !!(rule.clue && state && state.clues && state.clues.indexOf(rule.clue) >= 0);
      if (rule.mapId === mapId && rule.tile === tile && stateMatches) {
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
