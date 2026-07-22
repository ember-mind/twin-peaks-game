/* Twin Peaks — Il Mistero di Laura Palmer
 * data.js — dialoghi (in italiano), indizi, testo introduttivo, logica di gating.
 *
 * Struttura dialoghi:
 *   id: { pages: [{name, text}, ...], give: [clueId...], setFlag: 'flag',
 *         end: true|false, again: { pages: [...] } }
 * - 'give' e 'setFlag' si applicano solo alla prima lettura.
 * - 'again' (opzionale) viene mostrato dalle volte successive.
 * - Nei testi, il carattere § viene sostituito col numero di indizi raccolti.
 * - NPC/oggetti possono avere dialogue: {cond, then, else}
 *     cond 'clues3'     -> vero se il giocatore ha >= 3 indizi
 *     cond 'flag:nome'  -> vero se il flag e' attivo
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var GAME = root.GAME = root.GAME || {};

  var D = GAME.Data = {};

  D.intro = [
    'Diane, sono le 11:30 del 24 febbraio. Entro nella cittadina di Twin Peaks, stato di Washington. Non ho mai visto cosi\' tanti alberi in vita mia.',
    'Una ragazza di diciassette anni, Laura Palmer, e\' stata trovata morta sulla riva del lago, avvolta nella plastica. Lo sceriffo locale mi aspetta.',
    'Diane, ricordami di chiedere dove fanno la torta di ciliegie. Ho il presentimento che qui sia dannatamente buona. E il caffe\'... ne sento gia\' il profumo.'
  ];

  D.clues = {
    diario:    { name: 'Diario di Laura Palmer', desc: 'L\'ultima pagina parla di un certo "BOB".' },
    cuore:     { name: 'Meta\' cuore spezzato',  desc: 'Un ciondolo a meta\'. Qualcuno conserva l\'altra meta\'.' },
    lettera_r: { name: 'Lettera "R"',            desc: 'Un frammento trovato sotto l\'unghia di Laura.' },
    nome_sussurrato: { name: 'Il nome sussurrato nel sogno', desc: 'Laura ha detto il nome dell\'assassino. Al risveglio, era svanito.' },
    poesia_fuoco: { name: 'La poesia del fuoco', desc: '"Fuoco cammina con me." Il monco l\'ha recitata in trance.' },
    cuore_intero: { name: 'Il cuore ricomposto', desc: 'James custodiva l\'altra meta\' del ciondolo di Laura.' },
    biglietto_fuoco: { name: '"FUOCO CAMMINA CON ME"', desc: 'Un brandello di carta nel vagone, accanto a un mucchio di terra.' },
    anello: { name: 'L\'anello di Laura', desc: 'Era sotto un\'asse del vagone. Perche\' l\'assassino non l\'ha preso?' },
    lettera_o: { name: 'Lettera "O"', desc: 'Sotto l\'unghia di Maddy. R... O... lettera per lettera, sta componendo ROBERT.' }
  };

  D.endText = [
    'Diane, sono le 2:30 del mattino. Il caso Palmer e\' ufficialmente chiuso.',
    'Ma alcune porte, una volta aperte, non si richiudono mai del tutto.',
    'Il gufo osserva ancora. Ora so cosa vede.',
    'Twin Peaks tornera\'.'
  ];

  D.dialogues = {

    /* ---------------- citta' ---------------- */

    // monologo d'arrivo, una tantum (vedi onEnter su town in maps.js): niente
    // give/setFlag qui, il flag "una volta sola" lo mette l'hook dell'engine.
    town_arrivo: { pages: [
      { name: 'COOPER', text: 'Diane, sono arrivato. Prima tappa: la centrale dello sceriffo, a ovest. Harry Truman mi aspetta col fascicolo.' }
    ] },

    sign_town: { pages: [
      { name: 'COOPER', text: '"Benvenuti a Twin Peaks. Popolazione: 51.201".' },
      { name: 'COOPER', text: 'Diane, annota: cinquantunomiladuecentuno abitanti. Una cifra sospettosamente precisa.' }
    ] },

    sign_hotel: { pages: [
      { name: 'COOPER', text: 'Great Northern Hotel. Dalla veranda si vedono le cascate, dice la guida. Peccato sia chiuso.' }
    ] },

    sign_woods: { pages: [
      { name: '', text: '"SENTIERO PER IL BOSCO". Il cartello e\' sbiadito, quasi divorato dai rovi.' },
      { name: 'COOPER', text: 'Il bosco e\' troppo fitto, ora. Servono altri indizi prima di inoltrarmi. (Indizi: §/3)' }
    ] },

    sign_woods_open: { pages: [
      { name: '', text: 'I rovi si sono diradati. Il sentiero ora sembra... percorribile.' },
      { name: 'COOPER', text: 'Diane, qualcosa mi chiama laggiu\', tra gli alberi.' }
    ] },

    woods_blocked: { pages: [
      { name: 'COOPER', text: 'Il bosco qui e\' troppo fitto. Mi servono altri indizi prima di addentrarmi. (Indizi: §/3)' }
    ] },

    hotel_locked: { pages: [
      { name: '', text: 'La porta del Great Northern e\' chiusa a chiave.' },
      { name: 'COOPER', text: 'Il concierge mi fissa dalla finestra. Meglio non disturbare. Per ora.' }
    ] },

    roadhouse_chiuso: { pages: [
      { name: '', text: 'Chiuso. Dalla porta filtra un giro di basso... "Stasera niente musica", dice un cartello.' }
    ] },

    landmark_waterfall: { pages: [
      { name: 'COOPER', text: 'Le cascate dietro il Great Northern. L\'acqua cade come un respiro lungo, bianca e fredda.' },
      { name: 'COOPER', text: 'Laura fu vista qui, l\'ultima pomeriggio. Diane, il luogo sa di addio.' }
    ] },

    landmark_cemetery: { pages: [
      { name: '', text: 'Cimitero di Twin Peaks. Le lapidi sono piccole, umide, inclinate come domande.' },
      { name: 'COOPER', text: 'Qui riposa Laura Palmer. O almeno, ciò che ne hanno trovato.' }
    ] },

    landmark_tracks: { pages: [
      { name: '', text: 'I binari tagliano il paese verso est, oltre il confine.' },
      { name: 'COOPER', text: 'Da questa parte, il 12 febbraio, un vagone. E un cuore.' }
    ] },

    hospital_locked: { pages: [
      { name: '', text: 'L\'ingresso e\' presidiato.' },
      { name: '', text: '"Nessuna visita, per ora. Ordini dello sceriffo," dice l\'infermiera al banco.' }
    ] },

    est_bloccato: { pages: [
      { name: '', text: 'La strada prosegue a est, verso il confine.' },
      { name: 'COOPER', text: 'Truman e\' stato chiaro: "Prima il quadro completo, agente. Poi il confine."' }
    ] },

    bobby: { pages: [
      { name: 'BOBBY', text: 'Ehi, cosa vuole, agente? Io non c\'entro NIENTE, chiaro?!' },
      { name: 'BOBBY', text: 'Chieda a Donna chi vedeva Laura di nascosto. Io ero con Shelly, quella notte. Con Shelly.' }
    ] },

    donna: { pages: [
      { name: 'DONNA', text: 'Le persone continuano a chiedermi se sapevo. Io dico sempre di no.' },
      { name: 'DONNA', text: 'Ho un video del picnic: Laura che ride, per l\'obiettivo di James. Lo guardi. Prima di chiedermi altro.' }
    ] },

    jacoby: { pages: [
      { name: 'JACOBY', text: 'Aloha, agente Cooper! Le piace il mio cocco? E\' un ascoltatore eccellente.' },
      { name: 'JACOBY', text: 'Laura era mia paziente. Aveva segreti che nemmeno io ho scoperto. E io sono un professionista.' }
    ] },

    audrey: { pages: [
      { name: 'AUDREY', text: 'Un agente dell\'FBI, qui a Twin Peaks? Che fascino. Audrey Horne, piacere.' },
      { name: 'AUDREY', text: 'Se le serve aiuto, mi trovi al Great Northern. Io so essere... molto convincente.' }
    ] },

    tomba_laura: {
      pages: [
        { name: '', text: 'Una lapide nuova. La terra e\' ancora smossa. "LAURA PALMER, 1972-1989".' },
        { name: '', text: 'Qualcuno ha lasciato una rosa. Non c\'e\' biglietto.' },
        { name: 'COOPER', text: 'Diane... diciassette anni. Chiunque sia stato, la risposta e\' in questa citta\'.' }
      ],
      again: { pages: [
        { name: 'COOPER', text: 'Riposa, Laura. Ci penso io.' }
      ] }
    },

    /* ---------------- distretto dello sceriffo ---------------- */

    truman: {
      pages: [
        { name: 'TRUMAN', text: 'Agente Cooper? Benvenuto a Twin Peaks. Sono Harry Truman, lo sceriffo. La stavamo aspettando.' },
        { name: 'TRUMAN', text: 'Laura Palmer e\' stata trovata stamattina sulla riva del lago, avvolta nella plastica. Uccisa altrove.' },
        { name: 'TRUMAN', text: 'Tenga: il diario di Laura. L\'ultima pagina parla di un certo "BOB". Ci faccia buon uso, agente.' }
      ],
      give: ['diario'],
      again: { pages: [
        { name: 'TRUMAN', text: 'Hawk sta perlustrando i sentieri. Quando avra\' abbastanza indizi, il bosco l\'aspetta, agente.' }
      ] }
    },

    lucy: { pages: [
      { name: 'LUCY', text: 'Agente Cooper! Tutte le chiamate dello sceriffo passano dal mio centralino. TUTTE. Anche quelle strane.' },
      { name: 'LUCY', text: 'Stamattina il telefono ha squillato tre volte, ma non rispondeva nessuno. Si sentiva solo... un respiro.' }
    ] },

    andy: { pages: [
      { name: 'ANDY', text: 'A-agente Cooper... m-mi scusi se piango.' },
      { name: 'ANDY', text: 'E\' che Laura era tanto giovane. E... e io non reggo queste cose. *snif*' }
    ] },

    hawk: { pages: [
      { name: 'HAWK', text: 'Il mio popolo dice: gli spiriti del bosco parlano a chi sa ascoltare.' },
      { name: 'HAWK', text: 'Qualcosa di antico si muove tra quegli alberi, agente Cooper. Qualcosa che ha fame.' }
    ] },

    /* ---------------- casa Palmer ---------------- */

    sarah: { pages: [
      { name: 'SARAH', text: 'L\'ho visto! Un uomo coi capelli lunghi, in fondo al corridoio... era chino sul letto di Laura!' },
      { name: 'SARAH', text: 'Nessuno mi crede. Ma io l\'ho VISTO. L\'ho visto!' }
    ] },

    leland: { pages: [
      { name: 'LELAND', text: 'La mia piccola Laura... la mia bambina...' },
      { name: 'LELAND', text: 'Sa cosa faccio, agente? Ballo. Da solo, in salotto. Ballare mi aiuta a non pensare.' }
    ] },

    laura_room: {
      pages: [
        { name: 'COOPER', text: 'La stanza di Laura. Ordinata. Troppo ordinata. Cerco meglio...' },
        { name: 'COOPER', text: 'Sotto il cuscino: un ciondolo a forma di mezzo cuore. Qualcuno conserva l\'altra meta\'.' },
        { name: 'COOPER', text: 'E il rapporto dell\'autopsia: sotto l\'unghia di Laura, un frammento di lettera. La lettera "R".' }
      ],
      give: ['cuore', 'lettera_r'],
      again: { pages: [
        { name: 'COOPER', text: 'Non c\'e\' altro qui. Solo il silenzio di una stanza che non ha piu\' futuro.' }
      ] }
    },

    /* ---------------- Great Northern (Atto 2) ---------------- */

    benhorne_a2: { pages: [
      { name: 'BEN HORNE', text: 'Agente Cooper! Che onore. Il Great Northern e\' sempre lieto di ospitare la legge.' },
      { name: 'BEN HORNE', text: 'Il Great Northern e\' un luogo rispettabile, agente. Chieda pure in giro.' },
      { name: 'BEN HORNE', text: 'Se cercasse... intrattenimenti piu\' vivaci, oltre confine c\'e\' un certo casino\'. Ma non ho detto nulla.' },
      { name: 'BEN HORNE', text: 'Laura Palmer? Una ragazza perbene. Della sua vita notturna non so nulla. Nulla.' }
    ] },

    audrey_a2: { pages: [
      { name: 'AUDREY', text: 'Agente Cooper. L\'ho seguita fin qui, al Great Northern. Ho scoperto qualcosa.' },
      { name: 'AUDREY', text: 'Laura lavorava al banco profumi, qui in hotel. Nessuno lo sapeva, tranne mio padre.' },
      { name: 'AUDREY', text: 'C\'e\' dell\'altro, agente, ma mi serve tempo per scoprirlo senza farmi notare.' },
      { name: 'AUDREY', text: 'Indaghero\' io. So essere invisibile, agente.' }
    ], setFlag: 'audrey_indaga' },

    specchio315: { pages: [
      { name: '', text: 'Uno specchio ovale sul como\'. Il riflesso sembra restare un istante di troppo.' },
      { name: 'COOPER', text: 'Diane... a volte mi chiedo se sia davvero il mio riflesso, quello che vedo.' }
    ] },

    /* ---------------- ospedale (Atto 2) ---------------- */

    ronette_letto: {
      pages: [
        { name: '', text: 'Ronette Pulaski. In coma. Il monitor scandisce un respiro incerto.' },
        { name: '', text: 'Si agita, improvvisamente. Le labbra si muovono, un sussurro...' },
        { name: 'RONETTE', text: '...BOB... BOB!' }
      ],
      setFlag: 'ronette_bob',
      again: { pages: [
        { name: '', text: 'Dorme. Le dita si muovono, come se scrivesse.' }
      ] }
    },

    gerard_a2: {
      pages: [
        { name: 'GERARD', text: 'Salve, agente. Mi chiamo Gerard. Vendo scarpe, di porta in porta.' },
        { name: 'GERARD', text: 'Le scarpe raccontano molto di una persona, sa? Dove va, da dove viene.' },
        { name: 'GERARD', text: '...Attraverso l\'oscurita\' del futuro passato... il mago desidera vedere.' },
        { name: 'GERARD', text: 'Un solo occasione tra questo mondo e l\'altro: FUOCO CAMMINA CON ME.' },
        { name: 'COOPER', text: 'Diane... quest\'uomo ha appena recitato una poesia. O una profezia. Annotalo, parola per parola.' }
      ],
      give: ['poesia_fuoco']
    },

    /* ---------------- Double R Diner ---------------- */

    norma: { pages: [
      { name: 'NORMA', text: 'Benvenuto al Double R. Si accomodi, le porto subito un caffe\'.' },
      { name: 'COOPER', text: 'Diane... questo e\' un caffe\' DANNATAMENTE BUONO. E la torta di ciliegie e\' eccezionale.' },
      { name: 'NORMA', text: 'Laura faceva volontariato qui, coi pasti a domicilio. Tutti le volevano bene. O quasi.' }
    ] },

    shelly: { pages: [
      { name: 'SHELLY', text: 'Bobby, il mio ragazzo... usciva con Laura. Di nascosto da tutti. Anche da me.' },
      { name: 'SHELLY', text: 'Laura aveva dei segreti, agente. Segreti che facevano paura persino a lei.' }
    ] },

    loglady: { pages: [
      { name: 'LOG LADY', text: 'Il mio ceppo ha visto qualcosa, quella notte. Lui vede sempre tutto.' },
      { name: 'LOG LADY', text: 'Chieda al bosco. Gli alberi ricordano. Attenzione al fuoco che cammina con me.' }
    ] },

    james_a2: {
      pages: [
        { name: 'JAMES', text: 'Agente Cooper... sapevo che sarebbe venuto. Ho un video. Il picnic, quello di cui parla Donna.' },
        { name: 'JAMES', text: 'Laura rideva, quel giorno. Ma dopo, tra noi, tutto e\' cambiato. Non gliel\'ho mai detto.' },
        { name: 'JAMES', text: 'Laura ne portava meta\'. L\'altra meta\' e\' mia. La prenda, agente.' },
        { name: 'JAMES', text: 'Forse se gliela avessi data prima... forse sarebbe ancora viva. Mi creda.' }
      ],
      give: ['cuore_intero']
    },

    /* ---------------- bosco ---------------- */

    olio: {
      pages: [
        { name: 'COOPER', text: 'Una pozza scura in mezzo al cerchio di sicomori. Olio di motore... bruciato.' },
        { name: 'COOPER', text: 'Diane, la Log Lady parlava di un fuoco che cammina. Annotalo: "olio bruciato". Sembra una porta.' }
      ]
    },

    sign_grove: { pages: [
      { name: '', text: '"GLASTONBURY GROVE". Dodici sicomori in cerchio, inciso nel legno.' },
      { name: 'COOPER', text: 'Glastonbury... come la tomba di Re Artu\'. Diane, questo posto non compare su nessuna mappa.' }
    ] },

    /* ---------------- Stanza Rossa ---------------- */

    mfap: {
      pages: [
        { name: '???', text: 'Andiamo a rockeggiare!' },
        { name: '???', text: 'Quando mi vedrai, non saro\' io.' },
        { name: '???', text: 'Dove veniamo noi, gli uccelli cantano una bella canzone. E c\'e\' sempre musica nell\'aria.' },
        { name: 'COOPER', text: 'Diane... se mi stai ascoltando: sono in una stanza rossa, e non so come uscirne.' }
      ],
      setFlag: 'met_mfap',
      again: { pages: [
        { name: '???', text: 'Di nuovo lei! Ricordi: i gufi vedono anche quando dorme.' }
      ] }
    },

    laura_hint: { pages: [
      { name: 'OMBRA', text: '...prima... parla con lui... il piccolo uomo... poi sussurrero\'...' }
    ] },

    laura_sogno: {
      pages: [
        { name: 'OMBRA DI LAURA', text: 'Si avvicina piano, nel bagliore rosso. I suoi occhi non sono piu\' gli stessi.' },
        { name: 'OMBRA DI LAURA', text: 'Sono io... eppure non sono io.' },
        { name: '', text: '(Laura si avvicina e sussurra un nome all\'orecchio di Cooper...)' },
        { name: 'OMBRA DI LAURA', text: 'Ti rivedro\' fra venticinque anni.' }
      ],
      give: ['nome_sussurrato'],
      setFlag: 'sogno_fatto',
      again: { pages: [
        { name: 'COOPER', text: '...il sussurro e\' gia\' svanito, come tutti i sogni.' }
      ] }
    },

    /* ponte Atto 1 -> Atto 2: il racconto del sogno */
    truman_a2: {
      pages: [
        { name: 'COOPER', text: 'Harry, ho fatto un sogno. Una stanza rossa. Un ometto che parlava a ritroso.' },
        { name: 'COOPER', text: 'Laura era li\'. Mi ha sussurrato un nome... ma al risveglio l\'avevo gia\' perso.' },
        { name: 'TRUMAN', text: 'Un nome sussurrato che non ricorda... Agente, intanto la scientifica ha finito.' },
        { name: 'TRUMAN', text: 'Ronette e\' all\'ospedale, in coma. E c\'e\' un testimone strano: un venditore di scarpe.' }
      ]
    },

    truman_atto3: {
      pages: [
        { name: 'COOPER', text: 'Harry, ascolti: un monco recita poesie sul fuoco, e James custodisce l\'altra meta\' del cuore di Laura.' },
        { name: 'TRUMAN', text: 'Un venditore di scarpe che recita poesie in trance? Qui le cose non sono mai semplici.' },
        { name: 'TRUMAN', text: 'One Eyed Jacks... e il vagone del treno. Domani si va oltre confine.' },
        { name: 'COOPER', text: 'Diane, la lista dei sospetti cresce piu\' in fretta di quanto io riesca a scriverla.' }
      ],
      setFlag: 'atto3'
    },

    truman_wait3: { pages: [
      { name: 'TRUMAN', text: 'La strada a est, agente. Il vagone l\'aspetta.' }
    ] },

    /* ---------------- il vagone del treno ---------------- */

    sign_ponte: { pages: [
      { name: '', text: 'Un vecchio ponticello di legno, accanto al sentiero.' },
      { name: 'COOPER', text: 'Qui hanno trovato Ronette Pulaski, la notte del delitto: errante, insanguinata, muta.' }
    ] },

    sign_oej: { pages: [
      { name: '', text: '"ONE EYED JACKS — oltre il confine". Una freccia indica il sentiero a nord.' },
      { name: 'COOPER', text: 'Diane, un casino\' clandestino appena oltre la linea di stato. Interessante giurisdizione.' }
    ] },

    mucchio_terra: {
      pages: [
        { name: 'COOPER', text: 'Un mucchio di terra smossa, qui nel vagone. Qualcuno ha scavato, di recente.' },
        { name: 'COOPER', text: 'Tra la terra, un brandello di carta strappata da un giornale.' },
        { name: '', text: 'Vi e\' scritto, a mano: "FUOCO CAMMINA CON ME". Macchie scure sui bordi.' },
        { name: 'COOPER', text: 'Diane... sembra sangue. Conservo tutto in una busta, per la scientifica.' }
      ],
      give: ['biglietto_fuoco'],
      again: { pages: [
        { name: 'COOPER', text: 'Non c\'e\' altro, sotto la terra smossa.' }
      ] }
    },

    anello_interact: {
      pages: [
        { name: 'COOPER', text: 'Un\'asse del pavimento cede sotto il mio peso. Sotto, qualcosa luccica.' },
        { name: 'COOPER', text: 'Un anello d\'oro, nascosto con cura. Sembra il monile di Laura Palmer.' },
        { name: 'COOPER', text: 'Diane, perche\' l\'assassino non l\'ha preso? Forse non sapeva fosse li\'.' }
      ],
      give: ['anello'],
      again: { pages: [
        { name: 'COOPER', text: 'L\'asse e\' di nuovo al suo posto. Non c\'e\' altro, ora.' }
      ] }
    },

    hawk_vagone: { pages: [
      { name: 'HAWK', text: 'Il treno era il suo tempio, agente. Qui veniva a pregare, o a fuggire.' },
      { name: 'HAWK', text: 'Qui il fuoco ha camminato davvero. Lo sento ancora, nell\'aria.' },
      { name: 'HAWK', text: 'Trovi cio\' che e\' stato lasciato. Non tutto, in questo posto, e\' sparito.' }
    ] },

    /* ---------------- One Eyed Jacks ---------------- */

    jacques_a3: {
      pages: [
        { name: 'JACQUES', text: 'Agente... FBI? Io non so niente. Vendo solo drink, qui. Niente di piu\'.' },
        { name: 'COOPER', text: 'La notte in cui Laura Palmer e\' morta, Jacques. Alla baita. Ci racconti.' },
        { name: 'JACQUES', text: 'Laura? Venne alla baita. C\'era Leo, c\'era Ronette... e un terzo uomo che non ho mai visto in faccia.' },
        { name: 'JACQUES', text: 'Poi il buio. Io ero TROPPO ubriaco, agente. TROPPO per ricordare qualcosa.' },
        { name: 'COOPER', text: 'Jacques Renault, la dichiaro in arresto per concorso in omicidio.' },
        { name: 'JACQUES', text: 'No, no! Io non ho toccato quella ragazza, lo giuri! NIENTE!' }
      ],
      setFlag: 'jacques_preso',
      again: { pages: [
        { name: 'JACQUES', text: 'Voglio un avvocato. E un whisky.' }
      ] }
    },

    audrey_oej: {
      pages: [
        { name: 'AUDREY', text: 'Agente Cooper! Cosa ci fa qui? Shh, sto lavorando sotto copertura...' },
        { name: 'AUDREY', text: 'Ho trovato il registro del banco profumi. Collega il Great Northern a questo posto.' },
        { name: 'AUDREY', text: 'E\' emozionante, e terrificante insieme. Ma ho paura, agente. Davvero paura.' },
        { name: 'COOPER', text: 'Vai a casa, Audrey. Subito. Questo non e\' un gioco, per te.' }
      ],
      setFlag: 'audrey_salvata'
    },

    /* ponte: Jacques muore in ospedale */
    lucy_a3: {
      pages: [
        { name: 'LUCY', text: 'Agente Cooper! E\' appena arrivata una chiamata dall\'ospedale. E\' terribile.' },
        { name: 'LUCY', text: 'Jacques Renault... soffocato nel suo letto. Un cuscino. Nessun testimone.' },
        { name: 'LUCY', text: 'Chi entra e esce da un ospedale senza farsi notare, agente? Chi?' }
      ],
      setFlag: 'jacques_morto'
    },

    /* ---------------- prima apparizione del Gigante ---------------- */

    specchio_dopo: { pages: [
      { name: '', text: 'Lo specchio riflette solo la stanza. Ma l\'aria... vibra ancora.' }
    ] },

    gigante1_dlg: {
      pages: [
        { name: '', text: 'Lo specchio vibra. La stanza si fa fredda. Un\'ombra alta prende forma nel riflesso.' },
        { name: 'GIGANTE', text: 'Mi perdoni l\'intrusione. Le diro\' tre cose.' },
        { name: 'GIGANTE', text: 'E\' successo di nuovo. E accadra\' ancora.' },
        { name: 'GIGANTE', text: 'I gufi non sono cio\' che sembrano.' },
        { name: 'GIGANTE', text: 'Senza sostanze chimiche, lui torna.' },
        { name: 'GIGANTE', text: 'Questo le apparterra\' quando sara\' vero.' }
      ],
      setFlag: 'gigante1'
    },

    /* ponte Atto 3 -> Atto 4: il gigante, la morte di Jacques */
    truman_atto4: {
      pages: [
        { name: 'COOPER', text: 'Harry, devo dirle una cosa che suonera\' incredibile. Un gigante mi e\' apparso, allo specchio.' },
        { name: 'TRUMAN', text: 'Un gigante? Agente, con lei succede sempre qualcosa di strano.' },
        { name: 'COOPER', text: 'E c\'e\' dell\'altro: Jacques Renault e\' morto in ospedale. Soffocato, nel suo letto.' },
        { name: 'TRUMAN', text: 'Qualcuno ha paura di cio\' che Jacques sapeva. E ora... anche io.' }
      ],
      setFlag: 'atto4'
    },

    truman_wait4: { pages: [
      { name: 'TRUMAN', text: 'Vada a riposare, agente. Domani sara\' peggio.' },
      { name: 'TRUMAN', text: 'A proposito: Audrey Horne e\' tornata a casa sana e salva. Ci ho pensato io, di persona.' }
    ] },

    /* ---------------- Atto 4: il gigante e la cugina ---------------- */

    maddy_a4: {
      pages: [
        { name: 'MADDY', text: 'Sono Maddy. La cugina di Laura.' },
        { name: 'MADDY', text: 'Tutti mi fissano. Come se vedessero... lei.' },
        { name: 'MADDY', text: 'Zia Sarah urla di notte. Zio Leland balla. Io ho paura di questa casa.' },
        { name: 'COOPER', text: 'Diane, per un istante ho chiamato Maddy "Laura". Lei non mi ha corretto subito.' }
      ],
      again: { pages: [
        { name: 'MADDY', text: 'Con questi occhiali vedo poco. Ma certe cose... le sento.' }
      ] }
    },

    sarah_visione: {
      pages: [
        { name: 'SARAH', text: '...(urla) Il divano! Qualcosa striscia sul divano!' },
        { name: 'SARAH', text: 'Ha un viso... e dietro il suo viso, un altro viso!' },
        { name: 'SARAH', text: 'BOB! E\' LUI! DIO, E\' ANCORA QUI!' },
        { name: 'COOPER', text: 'Diane... lo stesso nome del diario. Una madre lo vede. Io le credo.' }
      ]
    },

    leland_a4: {
      pages: [
        { name: 'LELAND', text: 'Agente Cooper! Entri, entri, si accomodi!' },
        { name: 'LELAND', text: 'Balliamo, agente! La musica non si ferma MAI.' },
        { name: 'COOPER', text: 'Diane... i suoi capelli sono diventati bianchi. E non smette di canticchiare.' }
      ]
    },

    leland_dove: {
      pages: [
        { name: 'LELAND', text: 'Maddy? E\' partita stamattina per Missoula. Le ho chiamato io il taxi.' },
        { name: 'COOPER', text: 'Diane... lo ha detto sorridendo. Troppo, forse.' }
      ]
    },

    leland_dopo: {
      pages: [
        { name: 'LELAND', text: 'Anche lei, adesso... anche Maddy... *ride, poi piange, poi ride ancora*' },
        { name: 'COOPER', text: 'Diane, il suo dolore suona... quasi recitato. Come una nota fuori tono.' }
      ]
    },

    gerard_a4: {
      pages: [
        { name: 'GERARD', text: 'Agente... sento di nuovo la trance arrivare...' },
        { name: 'GERARD', text: 'BOB e\' vicino. Una casa di legno, circondata da alberi. Lo ospita da vent\'anni.' },
        { name: 'COOPER', text: 'Diane, una casa nel bosco. Dobbiamo restringere il cerchio.' }
      ]
    },

    loglady_a4: {
      pages: [
        { name: 'LOG LADY', text: 'Il mio ceppo ha ripreso a parlare, agente.' },
        { name: 'LOG LADY', text: 'Il mio ceppo dice: stanotte, al roadhouse. Le civette sono gia\' li\'.' },
        { name: 'LOG LADY', text: 'Vada, agente. Prima che la musica cominci.' }
      ]
    },

    /* ---------------- il roadhouse: seconda apparizione del Gigante ---------------- */

    gigante2_dlg: {
      pages: [
        { name: '', text: 'La musica si interrompe. Il palco si illumina, vuoto... poi non piu\' vuoto.' },
        { name: 'GIGANTE', text: 'Sta accadendo di nuovo.' },
        { name: 'GIGANTE', text: 'Sta accadendo... DI NUOVO. Poi svanisce, in un lampo bianco.' },
        { name: 'COOPER', text: 'Diane. Casa Palmer. SUBITO.' }
      ],
      setFlag: 'gigante2'
    },

    palco_dopo: { pages: [
      { name: '', text: 'Il palco e\' vuoto. L\'eco no.' }
    ] },

    /* ---------------- la riva del lago ---------------- */

    lago_sguardo: { pages: [
      { name: '', text: 'L\'acqua e\' immobile. In lontananza, il fumo della segheria sale dritto nel cielo.' },
      { name: 'COOPER', text: 'Diane, questo lago custodisce piu\' segreti di quanti ne rifletta.' }
    ] },

    lago_maddy: {
      pages: [
        { name: '', text: 'Qualcosa galleggia tra i giunchi. Plastica trasparente. La stessa del 24 febbraio.' },
        { name: '', text: 'Non guardo oltre il necessario. Gli agenti della scientifica coprono, sollevano, misurano.' },
        { name: 'COOPER', text: 'Diane... e\' Maddy Ferguson.' },
        { name: 'COOPER', text: 'Sotto l\'unghia: una lettera. La "O".' },
        { name: 'COOPER', text: 'R... O... lettera per lettera, sta componendo ROBERT.' }
      ],
      give: ['lettera_o'],
      setFlag: 'maddy_trovata'
    },

    lago_dopo: { pages: [
      { name: 'COOPER', text: 'L\'acqua e\' tornata immobile. Io no.' }
    ] },

    /* ponte Atto 4 -> Atto 5: le lettere compongono ROBERT, il diario lo lega a BOB, Maddy e' morta */
    truman_atto5: {
      pages: [
        { name: 'COOPER', text: 'Harry... le lettere. R... O... lettera per lettera, componevano ROBERT. E nel diario di Laura, Robert ha un diminutivo: BOB.' },
        { name: 'TRUMAN', text: 'BOB. Il nome del diario di Laura. Il nome che Ronette ha sussurrato in coma.' },
        { name: 'COOPER', text: 'Jacques morto. Ora Maddy. Il gigante lo aveva detto: "E\' successo di nuovo".' },
        { name: 'TRUMAN', text: 'Chiunque sia, era a casa Palmer ieri notte.' },
        { name: 'COOPER', text: 'Domani chiudo questo cerchio, Harry.' }
      ],
      setFlag: 'atto5'
    },

    truman_wait5: { pages: [
      { name: 'TRUMAN', text: 'Quando e\' pronto, agente. Il distretto e\' con lei.' },
      { name: 'COOPER', text: 'Diane, un\'ultima cosa: l\'anello di Laura. Chi lo porta appartiene gia\' alla Loggia. Ecco perche\' fu lasciato.' }
    ] },

    /* ---------------- Atto 5: la confessione, la Loggia ---------------- */

    leland_interr: {
      pages: [
        { name: 'COOPER', text: 'Sala interrogatori. Leland Palmer siede immobile, le mani strette sul tavolo.' },
        { name: 'COOPER', text: 'Le lettere, Leland: R... O... lettera per lettera componevano ROBERT. Nel diario, Laura lo chiamava con un nome piu\' breve: BOB.' },
        { name: '', text: 'Il volto di Leland si irrigidisce. Qualcosa, sotto la pelle, cambia forma.' },
        { name: 'BOB', text: '"Hai il tuo bavaglio, agente? Vuoi giocare... col FUOCO?"' },
        { name: '', text: 'Una risata si alza dal petto di Leland. Non e\' la sua. Non e\' di nessuno.' },
        { name: 'BOB', text: '"Mi piace questa stanza. Cosi\' tante ombre in cui nascondersi..."' },
        { name: 'LELAND', text: 'Da quando avevo sei anni, agente. Quando LUI entra... io non ci sono.' },
        { name: 'COOPER', text: 'Diane... lo stesso volto che descriveva Sarah. Ora l\'ho visto io.' }
      ],
      setFlag: 'leland_confessa'
    },

    leland_morte: {
      pages: [
        { name: '', text: 'La cella e\' fredda. Leland e\' seduto a terra, la schiena contro il muro.' },
        { name: '', text: 'L\'impianto antincendio si apre. Piove, dentro.' },
        { name: 'LELAND', text: 'La vedo... Laura. E\' bellissima... mi... perdona?' },
        { name: 'COOPER', text: 'Vada verso la luce, Leland.' },
        { name: 'LELAND', text: '*Il respiro si spegne, piano, come una candela nel vento.*' },
        { name: 'COOPER', text: 'Diane... e\' morto tra le mie braccia. Il caso... non e\' chiuso. Non ancora.' }
      ],
      setFlag: 'leland_morto',
      again: { pages: [
        { name: '', text: 'La cella e\' vuota. L\'acqua evapora.' }
      ] }
    },

    truman_fine: {
      pages: [
        { name: 'TRUMAN', text: 'BOB e\' ancora la\' fuori, vero?' },
        { name: 'COOPER', text: 'Il bosco, Harry. Il cerchio si chiude dove si e\' aperto.' },
        { name: 'TRUMAN', text: 'Glastonbury Grove. Vada, agente. La aspetteremo qui.' }
      ]
    },

    mfap_finale: {
      pages: [
        { name: '???', text: 'E\' LUI che stai cercando?' },
        { name: '???', text: 'Quando mi vedrai di nuovo, non saro\' io.' },
        { name: '???', text: 'Andiamo a rockeggiare!' },
        { name: 'COOPER', text: 'Diane... la stanza ride di nuovo. O forse sono io, che ho smesso di capire.' }
      ],
      setFlag: 'mfap_finale_visto'
    },

    bob_finale: { pages: [
      { name: '', text: 'Il sorriso di BOB si allarga. Troppo. Rimane cosi\', troppo a lungo.' },
      { name: 'BOB', text: 'Leland era solo un guanto. La mano... e\' ancora qui.' },
      { name: 'BOB', text: 'Ci rivedremo, agente. Noi ci rivediamo SEMPRE.' }
    ] },

    laura_finale2: {
      pages: [
        { name: 'OMBRA DI LAURA', text: 'Sono calma, adesso. Il fuoco non brucia piu\', qui dentro.' },
        { name: 'OMBRA DI LAURA', text: 'Mio padre non lo sapeva. LUI si\'.' },
        { name: 'OMBRA DI LAURA', text: 'Ti rivedro\' fra venticinque anni. Nel frattempo...' },
        { name: '', text: '(Laura sorride. Le tende si muovono senza vento.)' },
        { name: 'COOPER', text: 'Diane... il caso Palmer e\' chiuso. Ma Twin Peaks non chiude mai.' }
      ],
      end: true
    }
  };

  /* ---------------- obiettivo corrente (menu indizi) ----------------
   * Scala dall'alto: vince la prima condizione vera (stessa sintassi di
   * checkCond: 'flag:nome' / 'cluesN'), rispecchia la cascata di Truman
   * in glue.js (NPCS.sheriff.truman) cosi' l'obiettivo indica sempre il
   * prossimo passo verso il ponte narrativo successivo. L'ultima voce,
   * senza cond, e' il default di inizio partita. */
  D.objectives = [
    { cond: 'flag:leland_morto', text: 'Torna alla Loggia (Glastonbury Grove).' },
    { cond: 'flag:atto5', text: 'Interroga Leland Palmer alla centrale.' },
    { cond: 'flag:maddy_trovata', text: 'Riferisci a Truman alla centrale.' },
    { cond: 'flag:gigante2', text: 'Casa Palmer. Poi il lago.' },
    { cond: 'flag:atto4', text: 'Stasera: il Roadhouse.' },
    { cond: 'flag:gigante1', text: 'Riferisci a Truman alla centrale.' },
    { cond: 'flag:atto3', text: 'La strada a est: il vagone del treno.' },
    { cond: 'clues6', text: 'Riferisci a Truman alla centrale.' },
    // corretto rispetto alla bozza originale: il sesto indizio (cuore_intero)
    // lo da' James al Double R, non l'hotel. Senza "diner" qui il giocatore
    // rischia di girare a vuoto tra Truman e Great Northern senza raggiungere
    // mai i 6 indizi che sbloccano l'Atto 3.
    { cond: 'flag:sogno_fatto', text: 'Ospedale, diner e hotel. Poi Truman.' },
    { cond: null, text: 'Parla con lo sceriffo Truman (a ovest).' }
  ];

  D.objectiveFor = function (st, checkCond) {
    for (var i = 0; i < D.objectives.length; i++) {
      var o = D.objectives[i];
      if (!o.cond || checkCond(o.cond, st)) return o.text;
    }
    return '';
  };
})();
