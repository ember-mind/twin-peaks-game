/* Twin Peaks — Il Mistero di Laura Palmer
 * data.js — dialoghi (in italiano), indizi, testo introduttivo, logica di gating.
 *
 * Struttura dialoghi:
 *   id: { pages: [{name, text}, ...], give: [clueId...], setFlag: 'flag',
 *         end: true|false, again: { pages: [...] } }
 * - 'give' e 'setFlag' si applicano solo alla prima lettura.
 * - 'again' (opzionale) viene mostrato dalle volte successive.
 * - Nei testi, il carattere § viene sostituito col numero di indizi raccolti.
 * - NPC/oggetti possono avere dialogue: {cond, then, else}; un array di
 *   condizioni richiede che siano tutte vere.
 *     cond 'clues3'          -> almeno 3 indizi classici
 *     cond 'flag:nome'       -> flag classico attivo
 *     cond 'evidence:nome'   -> evidenza narrativa acquisita
 *     cond 'nflag:nome'      -> flag narrativo attivo
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var GAME = root.GAME = root.GAME || {};

  var D = GAME.Data = {};

  D.intro = [
    'Diane, sono le 11:30 del 24 febbraio. Entro nella cittadina di Twin Peaks, stato di Washington. Non ho mai visto così tanti alberi in vita mia.',
    'Laura Palmer, diciassette anni, è stata trovata sulla riva del lago, avvolta nella plastica. Lo sceriffo mi aspetta.',
    'Diane, ricordami di chiedere dove fanno la torta di ciliegie. Ho il presentimento che qui sia dannatamente buona. E il caffè... ne sento già il profumo.'
  ];

  D.clues = {
    diario:    {
      name: 'Diario di Laura Palmer',
      desc: 'Nel registro cifrato: "Dice che lascerà il suo nome un pezzo alla volta." Ricorre il nome ROBERT.',
      document: {
        title: 'Diario di Laura Palmer',
        pages: [
          {
            label: 'Registro pubblico',
            text: 'Norma mi ha tenuto la fetta con più ciliegie. Donna ne ha rubata una; James ha riso col caffè in mano. Sono arrivata tardi a scuola.'
          },
          {
            label: 'Registro cifrato',
            text: 'Nel bosco sento che qualcuno mi guarda. Non voglio tornarci da sola. Le parole cambiano quando provo a scrivere di lui.'
          },
          {
            label: 'Registro cifrato',
            text: 'Dice che lascerà il suo nome un pezzo alla volta. Nel margine ricorre una parola, premuta così forte da segnare il foglio: ROBERT.'
          }
        ]
      }
    },
    cuore:     {
      name: 'Metà cuore spezzato',
      desc: 'Un ciondolo a metà. Qualcuno conserva l\'altra metà.',
      document: {
        title: 'Metà cuore spezzato',
        pages: [
          {
            label: 'Camera di Laura',
            text: 'Sotto il cuscino c\'era un ciondolo a forma di mezzo cuore.'
          },
          {
            label: 'Nota',
            text: 'Il ciondolo è soltanto una metà. Qualcuno conserva l\'altra.'
          }
        ]
      }
    },
    lettera_r: {
      name: 'Lettera "R"',
      desc: 'Un frammento trovato sotto l\'unghia di Laura.',
      document: {
        title: 'Lettera "R"',
        pages: [
          {
            label: 'Rapporto medico-legale',
            text: 'Carta trovata sotto un\'unghia di Laura: un frammento della lettera R.'
          }
        ]
      }
    },
    nome_sussurrato: {
      name: 'Il nome sussurrato nel sogno',
      desc: 'Laura ha detto il nome dell\'assassino. Al risveglio, era svanito.',
      document: {
        title: 'Il nome sussurrato',
        pages: [
          {
            label: 'Stanza Rossa',
            text: 'L\'ombra di Laura si è avvicinata e ha sussurrato un nome all\'orecchio di Cooper.'
          },
          {
            label: 'Al risveglio',
            text: 'Cooper ricorda di aver udito un nome, ma non riesce più a richiamarlo.'
          },
          {
            label: 'Stato',
            text: 'Il sussurro appartiene al sogno. Non è una prova verificata.'
          }
        ]
      }
    },
    poesia_fuoco: {
      name: 'La poesia del fuoco',
      desc: '"Fuoco cammina con me." Il monco l\'ha recitata in trance.',
      document: {
        title: 'La poesia del fuoco',
        pages: [
          {
            label: 'Gerard — ospedale',
            text: 'Gerard recita in trance: «Attraverso l\'oscurità del futuro passato... FUOCO CAMMINA CON ME.»'
          }
        ]
      }
    },
    cuore_intero: {
      name: 'Il cuore ricomposto',
      desc: 'James custodiva l\'altra metà del ciondolo di Laura.',
      document: {
        title: 'Il cuore ricomposto',
        pages: [
          {
            label: 'Testimonianza di James',
            text: 'James dice che Laura portava una metà del ciondolo. L\'altra era sua.'
          },
          {
            label: 'Consegna',
            text: 'James consegna la sua metà a Cooper.'
          }
        ]
      }
    },
    biglietto_fuoco: {
      name: '"FUOCO CAMMINA CON ME"',
      desc: 'Un brandello di carta nel vagone, accanto a un mucchio di terra.',
      document: {
        title: '"FUOCO CAMMINA CON ME"',
        pages: [
          {
            label: 'Vagone',
            text: 'Un brandello strappato da un giornale era tra la terra smossa.'
          },
          {
            label: 'Scritta',
            text: 'Sul foglio, a mano: «FUOCO CAMMINA CON ME».'
          },
          {
            label: 'Macchie',
            text: 'I bordi hanno macchie scure. Sembrano sangue; il foglio è sigillato in attesa della scientifica.'
          }
        ]
      }
    },
    anello: {
      name: 'L\'anello di Laura',
      desc: 'Era sotto un\'asse del vagone. Perché l\'assassino non l\'ha preso?',
      document: {
        title: 'Anello trovato nel vagone',
        pages: [
          {
            label: 'Ritrovamento',
            text: 'Sotto un\'asse del pavimento c\'era un anello d\'oro.'
          },
          {
            label: 'Aspetto',
            text: 'Sembra il monile di Laura Palmer.'
          },
          {
            label: 'Posizione',
            text: 'L\'anello era disteso quasi al centro del vano.'
          },
          {
            label: 'Polvere',
            text: 'La polvere attorno era interrotta. Non c\'erano tracce di rotolamento.'
          },
          {
            label: 'Ipotesi',
            text: 'L\'anello potrebbe essere stato posato.'
          }
        ]
      }
    },
    lettera_o: {
      name: 'Lettera "O"',
      desc: 'Sotto l\'unghia di Maddy: una O, dopo la R di Laura. Potrebbe essere una sequenza; non prova un nome né un\'identità.',
      document: {
        title: 'Lettera "O"',
        pages: [
          {
            label: 'Riva del lago',
            text: 'Sotto un\'unghia di Maddy c\'era la lettera O.'
          },
          {
            label: 'Sequenza',
            text: 'La O viene dopo la R trovata sotto un\'unghia di Laura.'
          },
          {
            label: 'Cautela',
            text: 'R, poi O: forse l\'inizio di una firma. È un\'ipotesi, non un nome né un\'identità.'
          }
        ]
      }
    }
  };

  D.endText = [
    'Diane, sono le 7:12. Il sole è sopra gli alberi. Le ammissioni di Leland sono agli atti.',
    'Alla centrale, la nota della Twin Peaks Taxi resta agganciata al verbale firmato.',
    'Alle 7:40 la corriera per Missoula parte in orario. Il posto di Maddy resta vuoto.',
    'Hawk chiama da Glastonbury Grove: dodici sicomori, nessuna impronta in uscita.'
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
      { name: 'COOPER', text: 'Cinquantunomiladuecentuno. Una cifra così precisa merita una domanda semplice: chi continua a contarli?' }
    ] },

    sign_hotel: { pages: [
      { name: 'COOPER', text: 'Great Northern Hotel. Dalla veranda si vedono le cascate, dice la guida. Peccato sia chiuso.' }
    ] },

    sign_woods: { pages: [
      { name: '', text: '"SENTIERO PER IL BOSCO". Il cartello è sbiadito, quasi divorato dai rovi.' },
      { name: 'COOPER', text: 'Il bosco è troppo fitto, ora. Servono altri indizi prima di inoltrarmi. (Indizi: §/3)' }
    ] },

    sign_woods_open: { pages: [
      { name: '', text: 'I rovi si sono diradati. Il sentiero ora sembra... percorribile.' },
      { name: 'COOPER', text: 'Diane, qualcosa mi chiama laggiù, tra gli alberi.' }
    ] },

    woods_blocked: { pages: [
      { name: 'COOPER', text: 'Il bosco qui è troppo fitto. Mi servono altri indizi prima di addentrarmi. (Indizi: §/3)' }
    ] },

    hotel_locked: { pages: [
      { name: '', text: 'La porta del Great Northern è chiusa a chiave.' },
      { name: 'COOPER', text: 'Il concierge mi fissa dalla finestra. Meglio non disturbare. Per ora.' }
    ] },

    roadhouse_chiuso: { pages: [
      { name: '', text: 'Chiuso. Dalla porta filtra un giro di basso... "Stasera niente musica", dice un cartello.' }
    ] },

    landmark_waterfall: { pages: [
      { name: 'COOPER', text: 'Le cascate dietro il Great Northern. L\'acqua cade come un respiro lungo, bianca e fredda.' },
      { name: 'COOPER', text: 'Laura fu vista qui, l\'ultimo pomeriggio. L\'acqua continua a cadere; il tempo dell\'alibi, invece, si può misurare.' }
    ] },

    landmark_cemetery: { pages: [
      { name: '', text: 'Accanto alla cappella, una fotografia di Laura è circondata da fiori e biglietti.' },
      { name: 'COOPER', text: 'Laura Palmer, diciassette anni. Segno le date nel fascicolo. Non ridurrò una vita a quelle date: nella foto ride con la torta.' }
    ] },

    landmark_tracks: { pages: [
      { name: '', text: 'I binari tagliano il paese verso est, oltre il confine.' },
      { name: 'COOPER', text: 'Segno est. Prima voglio sapere chi usa questi binari.' }
    ] },

    landmark_tracks_route: { pages: [
      { name: 'COOPER', text: 'James ha indicato l\'est; il ciondolo dice perché la sua memoria conta.' },
        { name: 'COOPER', text: 'Proseguo a est lungo i binari.' }
    ] },

    landmark_tracks_vagone: { pages: [
      { name: 'COOPER', text: 'Il vagone è oltre la curva dei binari. Adesso posso controllare il luogo descritto da James.' }
    ] },

    hospital_locked: { pages: [
      { name: '', text: 'L\'ingresso è presidiato.' },
      { name: '', text: '"Nessuna visita, per ora. Ordini dello sceriffo," dice l\'infermiera al banco.' }
    ] },

    est_bloccato: { pages: [
      { name: '', text: 'La strada prosegue a est, verso il confine.' },
      { name: 'COOPER', text: 'Truman è stato chiaro: "Prima il quadro completo, agente. Poi il confine."' }
    ] },

    bobby: { pages: [
      { name: 'BOBBY', text: 'Ehi, cosa vuole, agente? Io non c\'entro NIENTE, chiaro?!' },
      { name: 'BOBBY', text: 'Chieda a Donna chi vedeva Laura di nascosto. Io ero con Shelly, quella notte. Con Shelly.' },
      { name: 'COOPER', text: 'Bobby, guardi me. Dove si trovava, senza mettere Shelly fra noi?' },
      { name: 'BOBBY', text: 'Chieda a Shelly. Se le do io l\'orario, dirà che gliel\'ho messo in bocca.' }
    ] },

    donna: { pages: [
      { name: 'DONNA', text: 'Le persone continuano a chiedermi se sapevo. Io dico sempre di no.' },
      { name: 'DONNA', text: 'Ho un video del picnic: Laura che ride, per l\'obiettivo di James. Lo guardi. Prima di chiedermi altro.' },
      { name: '', text: 'Nel video Laura ruba una ciliegia dalla fetta di Donna. Donna prova a riprenderla; Laura ride con la bocca piena.' },
      { name: 'COOPER', text: 'Donna, guarderò il film prima di un\'altra domanda. Voglio vedere Laura quando nessuno le chiede di spiegarsi.' }
    ] },

    jacoby: { pages: [
      { name: 'JACOBY', text: 'Aloha, agente Cooper. Il cocco non interrompe e non mente. Due qualità rare, nel mio studio.' },
      { name: 'JACOBY', text: 'Laura mentiva bene. Non per gioco: cambiava risposta appena prendevo la penna.' },
      { name: 'COOPER', text: 'Quale domanda le faceva guardare la penna, dottore?' },
      { name: 'JACOBY', text: 'Quella resta tra medico e paziente. La penna no: appena la prendevo, Laura cambiava versione.' }
    ] },

    audrey: { pages: [
      { name: 'AUDREY', text: 'Un agente dell\'FBI, qui a Twin Peaks? Che fascino. Audrey Horne, piacere.' },
      { name: 'AUDREY', text: 'Se le serve aiuto, mi trovi al Great Northern. Io so essere... molto convincente.' }
    ] },

    tomba_laura: {
      pages: [
        { name: '', text: 'Una foto di Laura è fissata a un leggio della cappella. Sotto: "LAURA PALMER, 1972-1989".' },
        { name: '', text: 'Qualcuno ha lasciato una rosa nel bicchiere dell\'acqua. Non c\'è biglietto.' },
        { name: 'COOPER', text: 'Tre biglietti ricordano la torta, i pasti a domicilio e una risata al picnic. Trascrivo i nomi e lascio la rosa dov\'è.' }
      ],
      again: { pages: [
        { name: 'COOPER', text: 'La rosa è nel bicchiere. I tre biglietti sono registrati; non sposto altro.' }
      ] }
    },

    /* ---------------- distretto dello sceriffo ---------------- */

    truman: {
      pages: [
        { name: 'TRUMAN', text: 'Agente Cooper? Benvenuto a Twin Peaks. Sono Harry Truman, lo sceriffo. La stavamo aspettando.' },
        { name: 'TRUMAN', text: 'Laura Palmer è stata trovata stamattina sulla riva del lago, avvolta nella plastica. Uccisa altrove.' },
        { name: 'TRUMAN', text: 'Tenga: il diario di Laura. Nel registro cifrato ricorrono un «lui» e il nome «ROBERT». Ci faccia buon uso, agente.' },
        { name: 'COOPER', text: 'Comincio dal diario, Harry. Quando trovo una domanda, torno da lei per i fatti.' }
      ],
      give: ['diario'],
      again: { pages: [
        { name: 'TRUMAN', text: 'Hawk sta perlustrando i sentieri. Quando avrà abbastanza indizi, il bosco l\'aspetta, agente.' },
        { name: 'COOPER', text: 'Harry, lei non dice che il bosco è pericoloso. Dice che mi aspetta. È una distinzione utile.' }
      ] }
    },

    lucy: { pages: [
      { name: 'LUCY', text: 'Agente Cooper! Tutte le chiamate dello sceriffo passano dal mio centralino. TUTTE. Anche quelle strane.' },
      { name: 'LUCY', text: 'Stamattina il telefono ha squillato tre volte, ma non rispondeva nessuno. Si sentiva solo... un respiro.' },
      { name: 'COOPER', text: 'Mi scriva gli orari, Lucy. Un guasto non sceglie quando respirare.' }
    ] },

    andy: { pages: [
      { name: 'ANDY', text: 'Agente Cooper... mi scusi. Credevo di essere pronto.' },
      { name: 'ANDY', text: 'Laura aveva diciassette anni. Scriverlo nel rapporto non lo rende più sopportabile.' },
      { name: 'COOPER', text: 'Finisca il rapporto, Andy. Poi si prenda cinque minuti. In quest\'ordine.' }
    ] },

    hawk: { pages: [
      { name: 'HAWK', text: 'Nel bosco distingui un animale da qualcuno che vuole essere sentito.' },
      { name: 'HAWK', text: 'Stanotte non ho sentito animali. Solo passi che si fermavano quando mi fermavo io.' },
      { name: 'COOPER', text: 'Fammi vedere dove ti sei fermato. Da lì cerchiamo il passo in più.' },
      { name: 'HAWK', text: 'Ti porto fino al punto. Da lì cammini davanti: voglio sentire se i passi scelgono te.' }
    ] },

    /* ---------------- casa Palmer ---------------- */

    sarah: { pages: [
      { name: 'SARAH', text: 'Era in fondo al corridoio. Capelli lunghi. Chino sul letto di Laura.' },
      { name: 'SARAH', text: 'Quando ho acceso la luce non c\'era nessuno. Ma il sorriso è rimasto.' },
      { name: 'COOPER', text: 'Quando ha acceso la luce, cosa ha visto per primo: il letto, la finestra o la porta?' },
      { name: 'SARAH', text: 'La porta. No, il letto. Vede? Se mi fa scegliere, una cosa cancella l\'altra.' }
    ] },

    leland: { pages: [
      { name: 'LELAND', text: 'La mia piccola Laura... la mia bambina...' },
      { name: 'LELAND', text: 'Sa cosa faccio, agente? Ballo. Da solo, in salotto. Ballare mi aiuta a non pensare.' },
      { name: 'COOPER', text: 'Che disco mette, signor Palmer, quando deve smettere di pensare?' },
      { name: 'LELAND', text: 'Non importa quale. Prima chiudo le tende. Non voglio che Sarah mi veda così.' }
    ] },

    laura_room: {
      pages: [
        { name: 'COOPER', text: 'La stanza di Laura. Ordinata. Troppo ordinata. Cerco meglio...' },
        { name: 'COOPER', text: 'Sotto il cuscino: un ciondolo a forma di mezzo cuore. Qualcuno conserva l\'altra metà.' },
        { name: '', text: 'La radio di Cooper gracchia. È Andy, dalla centrale.' },
        { name: 'ANDY', text: 'Agente, il medico legale ha trovato carta sotto un\'unghia di Laura: un frammento della lettera R.' }
      ],
      give: ['cuore', 'lettera_r'],
      again: { pages: [
        { name: 'COOPER', text: 'Non c\'è altro qui. Solo il silenzio di una stanza che non ha più futuro.' }
      ] }
    },

    /* ---------------- Great Northern (Atto 2) ---------------- */

    benhorne_a2: { pages: [
      { name: 'BEN HORNE', text: 'Agente Cooper! Che onore. Il Great Northern è sempre lieto di ospitare la legge.' },
      { name: 'BEN HORNE', text: 'Il Great Northern è un luogo rispettabile, agente. Chieda pure in giro.' },
      { name: 'BEN HORNE', text: 'Se cercasse... intrattenimenti più vivaci, oltre confine c\'è un certo casinò. Ma non ho detto nulla.' },
      { name: 'BEN HORNE', text: 'Laura Palmer? Una ragazza perbene. Della sua vita notturna non so nulla. Nulla.' },
      { name: 'COOPER', text: 'Non avevo ancora chiesto se l\'hotel fosse rispettabile, signor Horne. Adesso sì.' }
    ] },

    audrey_a2: { pages: [
      { name: 'AUDREY', text: 'Agente Cooper. L\'ho seguita fin qui, al Great Northern. Ho scoperto qualcosa.' },
      { name: 'AUDREY', text: 'Laura lavorava al banco profumi, qui in hotel. Nessuno lo sapeva, tranne mio padre.' },
      { name: 'AUDREY', text: 'C\'è dell\'altro, agente, ma mi serve tempo per scoprirlo senza farmi notare.' },
      { name: 'AUDREY', text: 'Indagherò io. So essere invisibile, agente.' },
      { name: 'COOPER', text: 'Audrey: un nome, un luogo, poi torna alla hall. Se salta l\'ultimo passaggio, chiamo suo padre.' }
    ], setFlag: 'audrey_indaga' },

    specchio315: { pages: [
      { name: '', text: 'Uno specchio ovale sul comò. Il riflesso sembra restare un istante di troppo.' },
      { name: 'COOPER', text: 'Il riflesso arriva tardi. Una frazione di secondo, ma abbastanza da farmi contare due volte.' }
    ] },

    /* ---------------- ospedale (Atto 2) ---------------- */

    ronette_letto: {
      pages: [
        { name: '', text: 'Ronette Pulaski. In coma. Il monitor scandisce un respiro incerto.' },
        { name: '', text: 'Si agita, improvvisamente. Le labbra si muovono, un sussurro...' },
        { name: 'RONETTE', text: '...BOB... BOB!' },
        { name: 'COOPER', text: 'Signorina Pulaski, ha detto un nome. Registro il momento e il battito; non presumo ancora cosa ricordi.' }
      ],
      setFlag: 'ronette_bob',
      again: { pages: [
        { name: '', text: 'Dorme. Le dita si muovono, come se scrivesse.' },
        { name: 'COOPER', text: 'Le dita ripetono un gesto. Non lo chiamerò messaggio finché non saprò leggerlo.' }
      ] }
    },

    gerard_a2: {
      pages: [
        { name: 'GERARD', text: 'Salve, agente. Mi chiamo Gerard. Vendo scarpe, di porta in porta.' },
        { name: 'GERARD', text: 'Le scarpe raccontano molto di una persona, sa? Dove va, da dove viene.' },
        { name: 'GERARD', text: '...Attraverso l\'oscurità del futuro passato... il mago desidera vedere.' },
        { name: 'GERARD', text: 'Una sola occasione tra questo mondo e l\'altro: FUOCO CAMMINA CON ME.' },
        { name: 'COOPER', text: 'Signor Gerard, la poesia resta parola sua finché non trova un fatto. La ripeta lentamente.' }
      ],
      give: ['poesia_fuoco']
    },

    /* ---------------- Double R Diner ---------------- */

    norma: { pages: [
      { name: 'NORMA', text: 'Benvenuto al Double R. Si accomodi, le porto subito un caffè.' },
      { name: 'COOPER', text: 'Norma, questo è un caffè DANNATAMENTE BUONO. E la torta di ciliegie è eccezionale.' },
      { name: 'NORMA', text: 'Laura faceva volontariato qui, coi pasti a domicilio. Tutti le volevano bene. O quasi.' }
    ] },

    shelly: { pages: [
      { name: 'SHELLY', text: 'Bobby veniva da me quando diceva di essere con Laura. E da Laura quando diceva di essere con me.' },
      { name: 'SHELLY', text: 'Quando gli chiedevo di lei, controllava prima la porta. Poi diceva che non c\'era niente da sapere.' },
      { name: 'COOPER', text: 'Cominci dalle prime parole che Bobby usava quando entrava.' },
      { name: 'SHELLY', text: 'Prima mi dica se lo proteggete. Se torna qui dopo che parlo, la porta la controllo io.' }
    ] },

    loglady: { pages: [
      { name: 'LOG LADY', text: 'Il mio ceppo ha visto qualcosa, quella notte. Lui vede sempre tutto.' },
      { name: 'LOG LADY', text: 'Chieda al bosco. Gli alberi ricordano. Attenzione al fuoco che cammina con me.' },
      { name: 'COOPER', text: 'Dov\'era lei quando il ceppo ha visto, signora?' },
      { name: 'LOG LADY', text: 'A casa. Il ceppo era sul tavolo. Non lo porto in centrale, se è questo che sta chiedendo.' }
    ] },

    james_a2: {
      pages: [
        { name: 'JAMES', text: 'Agente Cooper... sapevo che sarebbe venuto. Ho un video. Il picnic, quello di cui parla Donna.' },
        { name: 'JAMES', text: 'Laura rideva, quel giorno. Ma dopo, tra noi, tutto è cambiato. Non gliel\'ho mai detto.' },
        { name: 'JAMES', text: 'Laura ne portava metà. L\'altra metà è mia. La prenda, agente.' },
        { name: 'JAMES', text: 'Forse se gliela avessi data prima... forse sarebbe ancora viva. Mi creda.' },
        { name: 'COOPER', text: 'James, il rimorso altera i ricordi. Il ciondolo no. Mi dica dove incontrava Laura, senza indovinare il perché.' }
      ],
      give: ['cuore_intero']
    },

    /* ---------------- bosco ---------------- */

    olio: {
      pages: [
        { name: 'COOPER', text: 'Una pozza scura in mezzo al cerchio di sicomori. Olio di motore... bruciato.' },
        { name: 'COOPER', text: 'Olio bruciato. Prelevo un campione.' }
      ]
    },

    sign_grove: { pages: [
      { name: '', text: '"GLASTONBURY GROVE". Dodici sicomori in cerchio, inciso nel legno.' },
      { name: 'COOPER', text: 'Glastonbury, come la tomba di Re Artù. Dodici sicomori e nessun segno sulla mappa: conto entrambi.' }
    ] },

    /* ---------------- Stanza Rossa ---------------- */

    mfap: {
      pages: [
        { name: '???', text: 'Andiamo a rockeggiare!' },
        { name: '???', text: 'Quando mi vedrai, non sarò io.' },
        { name: '???', text: 'Dove veniamo noi, gli uccelli cantano una bella canzone. E c\'è sempre musica nell\'aria.' },
        { name: 'COOPER', text: 'Se il registratore riceve: stanza rossa, nessuna uscita visibile. Io resto fermo; le tende no.' }
      ],
      setFlag: 'met_mfap',
      again: { pages: [
        { name: '???', text: 'Di nuovo lei! Ricordi: i gufi vedono anche quando dorme.' },
        { name: 'COOPER', text: 'Un secondo incontro che si comporta come il primo. Il Nano, almeno, ammette di riconoscermi.' }
      ] }
    },

    laura_hint: { pages: [
      { name: 'OMBRA', text: '...prima... parla con lui... il piccolo uomo... poi sussurrerò...' },
      { name: 'COOPER', text: 'Prima l\'uomo piccolo. In questo sogno, almeno qualcuno rispetta una procedura.' }
    ] },

    laura_sogno: {
      pages: [
        { name: 'OMBRA DI LAURA', text: 'Si avvicina piano, nel bagliore rosso. I suoi occhi non sono più gli stessi.' },
        { name: 'OMBRA DI LAURA', text: 'Sono io... eppure non sono io.' },
        { name: '', text: 'Alle sue spalle appare un uomo dai capelli lunghi e grigi. Sorride. Laura non si volta.' },
        { name: '', text: '(Laura si avvicina e sussurra un nome all\'orecchio di Cooper...)' },
        { name: 'OMBRA DI LAURA', text: 'Ti rivedrò fra venticinque anni.' },
        { name: 'COOPER', text: 'Diane, ho udito un nome e già ne sento i contorni svanire. Registrarlo non basterà, ma ci provo.' }
      ],
      give: ['nome_sussurrato'],
      setFlag: 'sogno_fatto',
      again: { pages: [
        { name: 'COOPER', text: '...il sussurro è già svanito, come tutti i sogni.' }
      ] }
    },

    /* ponte Atto 1 -> Atto 2: il racconto del sogno */
    truman_a2: {
      pages: [
        { name: 'COOPER', text: 'Harry, nel sogno c\'era una stanza rossa. Un uomo piccolo parlava come se le parole arrivassero al contrario.' },
        { name: 'COOPER', text: 'Laura mi ha detto un nome. Al risveglio restava solo la certezza di averlo sentito.' },
        { name: 'TRUMAN', text: 'Un nome che non abbiamo. Va bene. Le do qualcosa che abbiamo: la scientifica ha finito.' },
        { name: 'TRUMAN', text: 'Ronette è in coma all\'ospedale. Un venditore di scarpe ha chiesto di lei.' }
      ]
    },

    truman_atto3: {
      pages: [
        { name: 'COOPER', text: 'Harry, Gerard ha recitato una frase sul fuoco. James aveva l\'altra metà del ciondolo. Due fatti; il legame manca.' },
        { name: 'TRUMAN', text: 'E il luogo?' },
        { name: 'TRUMAN', text: 'One Eyed Jacks. Poi il vagone del treno. Domani passiamo il confine.' },
        { name: 'COOPER', text: 'Diane, domani: al vagone partiamo dalla scena; al casinò, da chi mente.' }
      ],
      setFlag: 'atto3'
    },

    truman_wait3: { pages: [
      { name: 'TRUMAN', text: 'La strada a est, agente. Il vagone l\'aspetta.' },
      { name: 'COOPER', text: 'Harry, nel vagone comincerò da ciò che non si è mosso: polvere, assi, oggetti fuori posto.' }
    ] },

    /* ---------------- il vagone del treno ---------------- */

    sign_ponte: { pages: [
      { name: '', text: 'Un vecchio ponticello di legno, accanto al sentiero.' },
      { name: 'COOPER', text: 'Qui hanno trovato Ronette Pulaski, la notte del delitto: errante, insanguinata, muta.' }
    ] },

    sign_oej: { pages: [
      { name: '', text: '"ONE EYED JACKS — oltre il confine". Una freccia indica il sentiero a nord.' },
      { name: 'COOPER', text: 'Un casinò clandestino oltre la linea di stato. La freccia conosce la giurisdizione meglio del cartello.' }
    ] },

    mucchio_terra: {
      pages: [
        { name: 'COOPER', text: 'Un mucchio di terra smossa, qui nel vagone. Qualcuno ha scavato, di recente.' },
        { name: 'COOPER', text: 'Tra la terra, un brandello di carta strappata da un giornale.' },
        { name: '', text: 'Vi è scritto, a mano: "FUOCO CAMMINA CON ME". Macchie scure sui bordi.' },
        { name: 'COOPER', text: 'Sembra sangue. Lo sigillo e lascio che sia la scientifica a dargli un nome.' }
      ],
      give: ['biglietto_fuoco'],
      again: { pages: [
        { name: 'COOPER', text: 'Non c\'è altro, sotto la terra smossa.' }
      ] }
    },

    anello_interact: {
      pages: [
        { name: 'COOPER', text: 'Un\'asse del pavimento cede sotto il mio peso. Sotto, qualcosa luccica.' },
        { name: 'COOPER', text: 'Un anello d\'oro giace piatto sotto l\'asse. Sembra il monile di Laura Palmer.' },
        { name: 'COOPER', text: 'È quasi al centro del vano; polvere interrotta intorno, nessuna traccia di rotolamento. Potrebbe essere stato posato.' }
      ],
      give: ['anello'],
      again: { pages: [
        { name: 'COOPER', text: 'Il vano sotto l\'asse è vuoto. Posizione e polvere sono registrate; qui non c\'è altro.' }
      ] }
    },

    hawk_vagone: { pages: [
      { name: 'HAWK', text: 'Il treno era il suo tempio, agente. Qui veniva a pregare, o a fuggire.' },
      { name: 'HAWK', text: 'Qui il fuoco ha camminato davvero. Lo sento ancora, nell\'aria.' },
      { name: 'HAWK', text: 'Trovi ciò che è stato lasciato. Non tutto, in questo posto, è sparito.' },
      { name: 'COOPER', text: 'Hawk, tu ascolta il vagone. Io misuro terra e assi; vediamo dove i due metodi si incontrano.' }
    ] },

    /* ---------------- One Eyed Jacks ---------------- */

    jacques_a3: {
      pages: [
        { name: 'JACQUES', text: 'Agente... FBI? Io non so niente. Vendo solo drink, qui. Niente di più.' },
        { name: 'COOPER', text: 'La notte in cui Laura Palmer è morta, Jacques. Alla baita. Ci racconti.' },
        { name: 'JACQUES', text: 'Laura? Venne alla baita. C\'era Leo, c\'era Ronette... e un terzo uomo che non ho mai visto in faccia.' },
        { name: 'JACQUES', text: 'Poi il buio. Io ero TROPPO ubriaco, agente. TROPPO per ricordare qualcosa.' },
        { name: 'COOPER', text: 'Jacques Renault, la dichiaro in arresto per concorso in omicidio.' },
        { name: 'JACQUES', text: 'No, no! Io non ho toccato quella ragazza, lo giuri! NIENTE!' }
      ],
      setFlag: 'jacques_preso',
      again: { pages: [
        { name: 'JACQUES', text: 'Voglio un avvocato. E un whisky.' },
        { name: 'COOPER', text: 'Jacques, avvocato e whisky sono due forme di protezione. La Costituzione garantisce soltanto la prima.' }
      ] }
    },

    audrey_oej: {
      pages: [
        { name: 'AUDREY', text: 'Agente Cooper! Cosa ci fa qui? Shh, sto lavorando sotto copertura...' },
        { name: 'AUDREY', text: 'Ho trovato il registro del banco profumi. Collega il Great Northern a questo posto.' },
        { name: 'AUDREY', text: 'È emozionante, e terrificante insieme. Ma ho paura, agente. Davvero paura.' },
        { name: 'COOPER', text: 'Mi dia il registro. Poi resti dietro di me fino alla porta. Per una volta, Audrey, essere vista è il piano.' }
      ],
      setFlag: 'audrey_salvata'
    },

    /* ponte: Jacques muore in ospedale */
    lucy_a3: {
      pages: [
        { name: 'LUCY', text: 'Agente Cooper! È appena arrivata una chiamata dall\'ospedale. È terribile.' },
        { name: 'LUCY', text: 'Jacques Renault... soffocato nel suo letto. Un cuscino. Nessun testimone.' },
        { name: 'LUCY', text: 'Chi entra ed esce da un ospedale senza farsi notare, agente? Chi?' },
        { name: 'COOPER', text: 'Lucy, controlli ingressi, turni e registri. Chi non si fa notare lascia spesso che siano gli orari a notarlo.' }
      ],
      setFlag: 'jacques_morto'
    },

    /* ---------------- prima apparizione del Gigante ---------------- */

    specchio_dopo: { pages: [
      { name: '', text: 'Lo specchio riflette solo la stanza. Ma l\'aria... vibra ancora.' },
      { name: 'COOPER', text: 'Il riflesso adesso segue ogni movimento. Provo tre volte; il ritardo non torna.' }
    ] },

    gigante1_dlg: {
      pages: [
        { name: '', text: 'Lo specchio vibra. La stanza si fa fredda. Un\'ombra alta prende forma nel riflesso.' },
        { name: 'GIGANTE', text: 'Mi perdoni l\'intrusione. Le dirò tre cose.' },
        { name: 'GIGANTE', text: 'È successo di nuovo. E accadrà ancora.' },
        { name: 'GIGANTE', text: 'I gufi non sono ciò che sembrano.' },
        { name: 'GIGANTE', text: 'Senza sostanze chimiche, lui torna.' },
        { name: 'GIGANTE', text: 'Questo le apparterrà quando sarà vero.' },
        { name: 'COOPER', text: 'Tre avvertimenti, nessuna istruzione. Comincerò dai gufi: almeno lasciano tracce.' }
      ],
      setFlag: 'gigante1'
    },

    /* ponte Atto 3 -> Atto 4: il gigante, la morte di Jacques */
    truman_atto4: {
      pages: [
        { name: 'COOPER', text: 'Harry, nello specchio è apparso un uomo alto. Mi ha detto che sarebbe accaduto di nuovo.' },
        { name: 'TRUMAN', text: 'Le credo. Non so cosa farne, ma le credo.' },
        { name: 'COOPER', text: 'Facciamo qualcosa con questo: Jacques è stato soffocato nel suo letto d\'ospedale.' },
        { name: 'TRUMAN', text: 'Allora qualcuno teme ciò che Jacques sapeva. Questo so dove metterlo.' }
      ],
      setFlag: 'atto4'
    },

    truman_wait4: { pages: [
      { name: 'TRUMAN', text: 'Vada a riposare, agente. Domani sarà peggio.' },
      { name: 'TRUMAN', text: 'A proposito: Audrey Horne è tornata a casa sana e salva. Ci ho pensato io, di persona.' },
      { name: 'COOPER', text: 'Harry, riposerò quando il caffè smetterà di funzionare. Su Audrey: grazie. Era la cosa giusta da fare.' }
    ] },

    /* ---------------- Atto 4: il gigante e la cugina ---------------- */

    maddy_a4: {
      pages: [
        { name: 'MADDY', text: 'Sono Maddy. Non Laura. La somiglianza rende tutti maleducati senza volerlo.' },
        { name: 'MADDY', text: 'Zia Sarah non dorme. Zio Leland balla quando crede che nessuno lo senta.' },
        { name: 'MADDY', text: 'Io conto i giorni prima di tornare a Missoula. In questa casa è più facile contarli che viverli.' },
        { name: 'COOPER', text: 'Maddy, con due D. Comincerò da lì, e non dalla somiglianza.' }
      ],
      again: { pages: [
        { name: 'MADDY', text: 'Gli occhiali mi aiutano a vedere. Uscire da questa casa aiuterebbe di più.' },
        { name: 'COOPER', text: 'Maddy, Missoula ha un buon suono. Terrò libera la porta mentre lei decide quando attraversarla.' }
      ] }
    },

    sarah_visione: {
      pages: [
        { name: 'SARAH', text: 'Il divano era vuoto. Poi c\'era un uomo accovacciato, come se aspettasse che lo guardassi.' },
        { name: 'SARAH', text: 'Capelli grigi. Lo stesso sorriso che vedo quando chiudo gli occhi.' },
        { name: 'SARAH', text: 'BOB. È il nome che mi viene. Non so da dove.' },
        { name: 'COOPER', text: 'Signora Palmer, descriva ancora il sorriso. Questa volta io scrivo e lei non deve difendersi.' }
      ],
      setFlag: 'sarah_visione_ascoltata'
    },

    leland_a4: {
      pages: [
        { name: 'LELAND', text: 'Agente Cooper! Entri, entri, si accomodi!' },
        { name: 'LELAND', text: 'Balliamo, agente! La musica non si ferma MAI.' },
        { name: 'COOPER', text: 'Signor Palmer, i suoi capelli sono diventati bianchi. Da quanto tempo non riesce a smettere di canticchiare?' }
      ]
    },

    leland_dove: {
      pages: [
        { name: 'LELAND', text: 'Maddy prende la prima corriera domattina. Ho chiamato la Twin Peaks Taxi: passa da casa alle sette.' },
        { name: 'COOPER', text: 'Una compagnia e un orario. Signor Palmer, sono due cose che posso verificare.' }
      ]
    },

    leland_dopo: {
      pages: [
        { name: 'LELAND', text: 'Anche lei, adesso... anche Maddy...' },
        { name: '', text: 'Leland ride. Il suono si spezza in pianto, poi torna risata.' },
        { name: 'COOPER', text: 'Signor Palmer, non giudico come suona il dolore. Devo capire perché cambia quando nominiamo Maddy.' }
      ]
    },

    gerard_a4: {
      pages: [
        { name: 'GERARD', text: 'Agente... sento di nuovo la trance arrivare...' },
        { name: 'GERARD', text: 'BOB è vicino. Una casa di legno, circondata da alberi. Lo ospita da vent\'anni.' },
        { name: 'COOPER', text: 'Gerard, «una casa nel bosco» è un inizio. Mi dia un suono, un odore, qualcosa che una pattuglia riconosca.' }
      ]
    },

    loglady_a4: {
      pages: [
        { name: 'LOG LADY', text: 'Il mio ceppo ha ripreso a parlare, agente.' },
        { name: 'LOG LADY', text: 'Il mio ceppo dice: stanotte, al roadhouse. Le civette sono già lì.' },
        { name: 'LOG LADY', text: 'Vada, agente. Prima che la musica cominci.' },
        { name: 'COOPER', text: 'Margaret, questo basta: luogo e ora. Ci sarò.' }
      ]
    },

    /* ---------------- il roadhouse: seconda apparizione del Gigante ---------------- */

    gigante2_dlg: {
      pages: [
        { name: '', text: 'La musica si interrompe. Il palco si illumina, vuoto... poi non più vuoto.' },
        { name: 'GIGANTE', text: 'Sta accadendo di nuovo.' },
        { name: 'GIGANTE', text: 'Sta accadendo... DI NUOVO.' },
        { name: '', text: 'Il Gigante svanisce in un lampo bianco.' },
        { name: 'COOPER', text: 'Diane. Casa Palmer. SUBITO.' }
      ],
      setFlag: 'gigante2'
    },

    palco_dopo: { pages: [
      { name: '', text: 'Il palco è vuoto. L\'eco no.' },
      { name: 'COOPER', text: 'Il palco è vuoto. Cronometro e pubblico concordano; ciò che ho visto resta fuori dal verbale, per ora.' }
    ] },

    /* ---------------- la riva del lago ---------------- */

    lago_sguardo: { pages: [
      { name: '', text: 'L\'acqua è immobile. In lontananza, il fumo della segheria sale dritto nel cielo.' },
      { name: 'COOPER', text: 'L\'acqua non si muove. Quel fumo sì: almeno uno dei due accetta di indicare il vento.' }
    ] },

    lago_maddy: {
      pages: [
        { name: '', text: 'Qualcosa galleggia tra i giunchi. Plastica trasparente. La stessa del 24 febbraio.' },
        { name: '', text: 'Non guardo oltre il necessario. Gli agenti della scientifica coprono, sollevano, misurano.' },
        { name: 'COOPER', text: 'Maddy Ferguson. Con due D.' },
        { name: 'COOPER', text: 'Sotto l\'unghia: una lettera. La "O".' },
        { name: 'COOPER', text: 'R, poi O. Potrebbe essere l\'inizio di una firma. Per ora è un\'ipotesi, non un nome né un\'identità.' }
      ],
      give: ['lettera_o'],
      setFlag: 'maddy_trovata'
    },

    lago_dopo: { pages: [
      { name: 'COOPER', text: 'L\'acqua è tornata immobile. Io no.' }
    ] },

    /* ponte Atto 4 -> Atto 5: il diario annuncia ROBERT, le lettere iniziano R-O, Ronette e' l'unica fonte di BOB */
    truman_atto5: {
      pages: [
        { name: 'COOPER', text: 'Nel diario, ROBERT. Sotto le unghie, R e O. Ronette dice BOB. Possono toccarsi; non posso ancora unirli.' },
        { name: 'TRUMAN', text: 'Allora non li uniamo. Dove portano i fatti?' },
        { name: 'COOPER', text: 'Jacques morto. Ora Maddy. Il gigante lo aveva detto: "È successo di nuovo".' },
        { name: 'TRUMAN', text: 'E Maddy era a casa Palmer.' },
        { name: 'COOPER', text: 'Portiamo Leland qui. Gli faccio le domande prima che il cerchio scelga per noi.' }
      ],
      setFlag: 'atto5'
    },

    truman_wait5: { pages: [
      { name: 'TRUMAN', text: 'Quando è pronto, agente. Il distretto è con lei.' },
      { name: 'COOPER', text: 'Prima Leland, Harry. Poi il bosco. In quest\'ordine, finché i fatti reggono.' }
    ] },

    /* ---------------- Atto 5: la confessione, la Loggia ---------------- */

    leland_interr: {
      pages: [
        { name: '', text: 'Sala interrogatori. Leland Palmer siede immobile, le mani strette sul tavolo.' },
        { name: 'COOPER', text: "Leland, guardi: R, O. Dov'era lei quando ha ucciso Laura Palmer e Maddy Ferguson?" },
        { name: '', text: 'Il volto di Leland si irrigidisce. Qualcosa, sotto la pelle, cambia forma.' },
        { name: 'BOB', text: '"Hai il tuo bavaglio, agente? Vuoi giocare... col FUOCO?"' },
        { name: '', text: 'Una risata si alza dal petto di Leland. Non è la sua. Non è di nessuno.' },
        { name: 'BOB', text: '"Mi piace questa stanza. Così tante ombre in cui nascondersi..."' },
        { name: 'LELAND', text: 'Laura e Maddy le ho uccise io. BOB è dentro di me dall\'infanzia; il mio nome resta sul verbale.' },
        { name: 'COOPER', text: 'Diane... lo stesso volto che descriveva Sarah. Ora l\'ho visto io.' }
      ],
      setFlag: 'leland_confessa'
    },

    leland_morte: {
      pages: [
        { name: '', text: 'La cella è fredda. Leland è seduto a terra, la schiena contro il muro.' },
        { name: '', text: 'Leland si lancia contro la parete. Il tubo cede all\'urto; l\'acqua invade la cella.' },
        { name: 'LELAND', text: 'La vedo... Laura. È bellissima... mi... perdona?' },
        { name: '', text: 'Cooper non risponde. Tiene la foto di Laura davanti a sé.' },
        { name: '', text: 'Il respiro di Leland si spezza. Poi non riprende.' },
        { name: 'COOPER', text: "Diane. Ora del decesso, 2:30. Sigilliamo la cella; l'acqua resta parte della scena." }
      ],
      setFlag: 'leland_morto',
      again: { pages: [
        { name: '', text: 'La cella è vuota. L\'acqua evapora.' },
        { name: 'COOPER', text: 'Una cella vuota è ancora una scena. Misureremo l\'acqua, poi lasceremo in pace il silenzio.' }
      ] }
    },

    truman_fine: {
      pages: [
        { name: 'TRUMAN', text: 'BOB è ancora là fuori, vero?' },
        { name: 'COOPER', text: 'Non lo so. Ma il bosco ricorre in ogni racconto. Vado a Glastonbury Grove.' },
        { name: 'TRUMAN', text: 'Glastonbury Grove. Vada, agente. La aspetteremo qui.' }
      ]
    },

    mfap_finale: {
      pages: [
        { name: '???', text: 'È LUI che stai cercando?' },
        { name: '???', text: 'Quando mi vedrai di nuovo, non sarò io.' },
        { name: '???', text: 'Andiamo a rockeggiare!' },
        { name: 'COOPER', text: 'Ripete il gesto del sogno. Nel taccuino scrivo soltanto: «Mi riconosce».' }
      ],
      setFlag: 'mfap_finale_visto'
    },

    bob_finale: { pages: [
      { name: '', text: 'Il sorriso di BOB si allarga. Troppo. Rimane così, troppo a lungo.' },
      { name: 'BOB', text: 'Leland era solo un guanto. La mano... è ancora qui.' },
      { name: 'BOB', text: 'Ci rivedremo, agente. Noi ci rivediamo SEMPRE.' },
      { name: 'COOPER', text: 'Diane. La firma sotto le ammissioni dice Leland Palmer.' }
    ] },

    laura_finale2: {
      pages: [
        { name: '', text: 'Laura apre il taccuino. Copre BOB con una mano e indica la firma: Leland Palmer.' },
        { name: 'OMBRA DI LAURA', text: 'Non cancellare quel nome.' },
        { name: 'OMBRA DI LAURA', text: 'Ti rivedrò fra venticinque anni. Nel frattempo...' },
        { name: '', text: '(Laura sorride. Le tende si muovono senza vento.)' },
        { name: 'COOPER', text: 'Diane. Le ammissioni di Leland sono agli atti. Il resto rimane aperto.' }
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
    { cond: 'flag:gigante2', text: 'Parla con Sarah a casa Palmer; poi vai al lago.' },
    { cond: 'flag:atto4', text: 'Stasera: il Roadhouse.' },
    { cond: 'flag:gigante1', text: 'Riferisci a Truman alla centrale.' },
    { cond: 'flag:atto3', text: 'La strada a est: il vagone del treno.' },
    { cond: 'clues6', text: 'Riferisci a Truman alla centrale.' },
    // corretto rispetto alla bozza originale: il sesto indizio (cuore_intero)
    // lo da' James al Double R, non l'hotel. Senza "diner" qui il giocatore
    // rischia di girare a vuoto tra Truman e Great Northern senza raggiungere
    // mai i 6 indizi che sbloccano l'Atto 3.
    { cond: 'flag:sogno_fatto', text: 'Parla con Ronette in ospedale e James al diner.' },
    { cond: 'clues3', text: 'Segui il sentiero nel bosco.' },
    { cond: 'clues1', text: 'Casa Palmer: esamina la camera di Laura.' },
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
