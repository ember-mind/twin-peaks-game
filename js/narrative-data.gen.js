/* narrative-data.gen.js — FILE GENERATO da test/gen-narrative-data.js.
 * NON MODIFICARE A MANO: la sorgente implementabile sono i JSON in narrative/,
 * il canone umano sono i markdown del pacchetto narrative-v1.0.
 * Rigenerare con: node test/gen-narrative-data.js */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  var GAME = G.GAME = G.GAME || {};
  var D = GAME.NarrativeData = GAME.NarrativeData || {};
  D.missions = D.missions || {};
  D.missions.M4 = {
   "narrative_package": "narrative-v1.0",
   "mission": "M4",
   "title": "I frammenti",
   "source": {
    "document": "M4 v1.1.1 LOCK.md",
    "package": "narrative-v1.0"
   },
   "entry_condition": {
    "all": [
     {
      "flag": "sogno_fatto"
     },
     {
      "not": {
       "flag": "atto3"
      }
     }
    ]
   },
   "completion": {
    "when": {
     "proposition_path": "P2.social_status.accepted_by",
     "contains": "truman"
    },
    "sets": [
     "atto3"
    ]
   },
   "objectives": [
    {
     "id": "obj_m4_4",
     "priority": 400,
     "when": {
      "proposition_path": "P2.social_status.accepted_by",
      "contains": "truman"
     },
     "text": "Verifica la rotta di James: oltre il ponte, verso i binari."
    },
    {
     "id": "obj_m4_3",
     "priority": 300,
     "when": {
      "all": [
       {
        "proposition_path": "P2.formulation.status",
        "equals": "formulated"
       },
       {
        "not": {
         "proposition_path": "P2.social_status.accepted_by",
         "contains": "truman"
        }
       }
      ]
     },
     "text": "Mostra a Truman il nesso che regge."
    },
    {
     "id": "obj_m4_2",
     "priority": 200,
     "when": {
      "all": [
       {
        "flag": "sogno_raccontato"
       },
       {
        "not": {
         "proposition_path": "P2.formulation.status",
         "equals": "formulated"
        }
       },
       {
        "not": {
         "node_done": "james_a2"
        }
       },
       {
        "not": {
         "evidence": "T1_RONETTE_BOB"
        }
       }
      ]
     },
     "text": "Parla con Ronette all'ospedale e con James al Double R.",
     "optional_line": "Facoltativo: la stanza 315; il vicino di stanza che recita versi."
    },
    {
     "id": "obj_m4_2a",
     "priority": 210,
     "when": {
      "all": [
       {
        "flag": "sogno_raccontato"
       },
       {
        "not": {
         "proposition_path": "P2.formulation.status",
         "equals": "formulated"
        }
       },
       {
        "not": {
         "node_done": "james_a2"
        }
       },
       {
        "evidence": "T1_RONETTE_BOB"
       }
      ]
     },
     "text": "James, al Double R. Norma dice che non tocca il caffè."
    },
    {
     "id": "obj_m4_2b",
     "priority": 225,
     "when": {
      "all": [
       {
        "flag": "sogno_raccontato"
       },
       {
        "not": {
         "proposition_path": "P2.formulation.status",
         "equals": "formulated"
        }
       },
       {
        "node_done": "james_a2"
       },
       {
        "not": {
         "evidence": "T1_RONETTE_BOB"
        }
       }
      ]
     },
     "text": "Ronette, all'ospedale: ha dieci minuti. Poi il taccuino (T)."
    },
    {
     "id": "obj_m4_2c",
     "priority": 250,
     "when": {
      "all": [
       {
        "flag": "sogno_raccontato"
       },
       {
        "not": {
         "proposition_path": "P2.formulation.status",
         "equals": "formulated"
        }
       },
       {
        "node_done": "james_a2"
       },
       {
        "evidence": "T1_RONETTE_BOB"
       }
      ]
     },
     "text": "Taccuino (T): accosta le due metà del cuore alla strada di James."
    },
    {
     "id": "obj_m4_1",
     "priority": 100,
     "when": {
      "not": {
       "flag": "sogno_raccontato"
      }
     },
     "text": "Riferisci il sogno a Truman."
    }
   ],
   "nodes": [
    {
     "id": "truman_a2",
     "modified": true,
     "beat": "B1",
     "source_section": "B1",
     "conditions": [
      {
       "flag": "sogno_fatto"
      },
      {
       "not": {
        "flag": "sogno_raccontato"
       }
      }
     ],
     "pages": [
      {
       "name": "COOPER",
       "text": "Harry. Stanotte ho sognato una stanza rossa. Laura era lì.",
       "id": "m4.b1.truman_a2.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      },
      {
       "name": "COOPER",
       "text": "Mi ha detto un nome all'orecchio. L'ho portato fino alla porta. Poi niente.",
       "id": "m4.b1.truman_a2.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      },
      {
       "name": "TRUMAN",
       "text": "Se torna, lo mettiamo a verbale. Per ora abbiamo persone sveglie.",
       "id": "m4.b1.truman_a2.p03",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN"
      },
      {
       "name": "COOPER",
       "text": "C'era anche un uomo. Capelli lunghi, grigi. Sorrideva mentre nessun altro lo faceva.",
       "id": "m4.b1.truman_a2.p04",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      },
      {
       "name": "TRUMAN",
       "text": "Sarah ha detto capelli lunghi. E il sorriso. Se fosse di qui, avrei già un nome.",
       "id": "m4.b1.truman_a2.p05",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN"
      },
      {
       "name": "TRUMAN",
       "text": "Ronette si è svegliata stanotte. Non parla — ma è sveglia.",
       "id": "m4.b1.truman_a2.p06",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN"
      },
      {
       "name": "TRUMAN",
       "text": "E James è al Double R da stamattina. Norma dice che non tocca il caffè.",
       "id": "m4.b1.truman_a2.p07",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN"
      }
     ],
     "effects": [
      {
       "set": "sogno_raccontato"
      },
      {
       "notebook": {
        "id": "m4.note.truman_a2",
        "text": "L'uomo del sogno: capelli lunghi, grigi. Nessun volto del paese corrisponde."
       }
      }
     ],
     "next": null,
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "actor_id": "truman",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "ronette_attesa",
     "new": true,
     "beat": "attesa",
     "source_section": "attesa-ronette",
     "optional": true,
     "conditions": [
      {
       "flag": "sogno_fatto"
      },
      {
       "not": {
        "flag": "sogno_raccontato"
       }
      }
     ],
     "pages": [
      {
       "name": "INFERMIERA",
       "text": "Non ancora, agente. Lo sceriffo ha chiesto di sapere prima di chiunque.",
       "id": "m4.attesa.ronette_attesa.p01",
       "mode": "dialogue",
       "speaker_id": "infermiera",
       "display_name": "INFERMIERA"
      },
      {
       "name": "COOPER",
       "text": "Allora prima lo sceriffo. Lei intanto non la sveglia nessuno.",
       "id": "m4.attesa.ronette_attesa.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      }
     ],
     "repeat": {
      "name": "COOPER",
      "text": "Prima Harry. L'infermiera non ha bisogno di ripeterlo.",
      "id": "m4.repeat.ronette_attesa",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER"
     },
     "kind": "dialogue",
     "channel": "world",
     "map_id": "hospital",
     "actor_id": "ronette",
     "interaction_slot": "primary"
    },
    {
     "id": "loglady_ceppo",
     "new": true,
     "beat": "attesa",
     "source_section": "attesa-loglady",
     "optional": true,
     "conditions": [
      {
       "flag": "sogno_fatto"
      },
      {
       "not": {
        "flag": "atto3"
       }
      }
     ],
     "pages": [
      {
       "name": "LOG LADY",
       "text": "Il mio ceppo ha visto qualcosa, quella notte. Si è voltato verso la porta. La porta era chiusa.",
       "id": "m4.attesa.loglady_ceppo.p01",
       "mode": "dialogue",
       "speaker_id": "loglady",
       "display_name": "LOG LADY"
      },
      {
       "name": "LOG LADY",
       "text": "A casa mia non ci sono correnti. Da allora si volta ancora: due volte, poi si ferma.",
       "id": "m4.attesa.loglady_ceppo.p02",
       "mode": "dialogue",
       "speaker_id": "loglady",
       "display_name": "LOG LADY"
      },
      {
       "name": "COOPER",
       "text": "Margaret, il ceppo lo lascio a lei. Mi dica cosa vuole da me.",
       "id": "m4.attesa.loglady_ceppo.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      },
      {
       "name": "LOG LADY",
       "text": "Vuole il nome che le è stato detto stanotte. Quello che non ha più.",
       "id": "m4.attesa.loglady_ceppo.p04",
       "mode": "dialogue",
       "speaker_id": "loglady",
       "display_name": "LOG LADY"
      },
      {
       "name": "",
       "text": "(La signora si alza e prende il ceppo. Va verso la porta senza salutare. Il tavolo resta vuoto.)",
       "id": "m4.attesa.loglady_ceppo.p05",
       "mode": "action"
      }
     ],
     "effects": [
      {
       "set": "loglady_ceppo_ascoltato"
      }
     ],
     "repeat": {
      "name": "COOPER",
      "text": "Il ceppo aspetta un nome che non ho più. Non c'è altro da chiedere, qui.",
      "id": "m4.repeat.loglady_ceppo",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER"
     },
     "repeat_when": {
      "flag": "loglady_ceppo_ascoltato"
     },
     "kind": "dialogue",
     "channel": "world",
     "map_id": "diner",
     "actor_id": "loglady",
     "interaction_slot": "primary"
    },
    {
     "id": "ronette_q",
     "new": true,
     "beat": "B2",
     "source_section": "B2",
     "prompt": "Dieci minuti. Da cosa inizi?",
     "conditions": [
      {
       "flag": "sogno_raccontato"
      }
     ],
     "pages": [
      {
       "name": "",
       "text": "(Il monitor tiene il suo tempo. Ronette guarda la porta, non il soffitto.)",
       "id": "m4.b2.ronette_q.p01",
       "mode": "action"
      },
      {
       "name": "INFERMIERA",
       "text": "Dieci minuti, agente. Si è svegliata alle due. È sveglia, non è tornata.",
       "id": "m4.b2.ronette_q.p02",
       "mode": "dialogue",
       "speaker_id": "infermiera",
       "display_name": "INFERMIERA"
      },
      {
       "name": "COOPER",
       "text": "Signorina Pulaski, una domanda alla volta. Se vuole fermarmi, guardi l'infermiera.",
       "id": "m4.b2.ronette_q.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      }
     ],
     "choices": [
      {
       "id": "q_luogo",
       "label": "Indicale la porta: ricorda il luogo?",
       "goto": "ronette_luogo"
      },
      {
       "id": "q_uomo",
       "label": "Nomina l'uomo: termina la visita.",
       "goto": "ronette_uomo"
      },
      {
       "id": "q_laura",
       "label": "Mostrale la foto di Laura.",
       "goto": "ronette_laura"
      }
     ],
     "rules": {
      "visit_state": "ronette_visit",
      "terminal_choice": "q_uomo",
      "max_questions": 2,
      "second_question_policy": "force_terminal",
      "reopen": {
       "after_new_mandatory_beat": true,
       "pages": [
        {
         "id": "m4.b2.ronette_q.reopen",
         "mode": "dialogue",
         "speaker_id": "infermiera",
         "display_name": "INFERMIERA",
         "text": "Ha riposato. Dieci minuti, come prima."
        },
        {
         "id": "m4.b2.ronette_q.reopen.cooper",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Signorina Pulaski, ripartiamo da ciò che ricorda lei. Il mio taccuino può aspettare."
        }
       ]
      }
     },
     "effects": [
      {
       "set": "ronette_visita"
      }
     ],
     "kind": "dialogue",
     "channel": "world",
     "map_id": "hospital",
     "actor_id": "ronette",
     "interaction_slot": "primary"
    },
    {
     "id": "ronette_luogo",
     "new": true,
     "beat": "B2",
     "source_section": "B2-luogo",
     "pages": [
      {
       "name": "",
       "text": "Cooper indica la porta senza avvicinarsi al letto.",
       "id": "m4.b2.ronette_luogo.p01",
       "mode": "action"
      },
      {
       "name": "",
       "text": "(Alla parola \"posto\", Ronette guarda verso la porta.)",
       "id": "m4.b2.ronette_luogo.p02",
       "mode": "action"
      },
      {
       "name": "COOPER",
       "text": "Va bene. Restiamo qui.",
       "id": "m4.b2.ronette_luogo.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      }
     ],
     "effects": [
      {
       "notebook_observation": {
        "id": "m4.obs.ronette_luogo",
        "text": "alla parola \"posto\" guarda verso la porta."
       }
      }
     ],
     "next": "ronette_q",
     "kind": "dialogue",
     "channel": "internal",
     "exposed": false
    },
    {
     "id": "ronette_laura",
     "new": true,
     "beat": "B2",
     "source_section": "B2-laura",
     "pages": [
      {
       "name": "",
       "text": "Cooper posa la foto di Laura sul comodino, rivolta verso Ronette.",
       "id": "m4.b2.ronette_laura.p01",
       "mode": "action"
      },
      {
       "name": "",
       "text": "(Ronette alza due dita. Le guarda a lungo.)",
       "id": "m4.b2.ronette_laura.p02",
       "mode": "action"
      },
      {
       "name": "COOPER",
       "text": "Due?",
       "id": "m4.b2.ronette_laura.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      }
     ],
     "effects": [
      {
       "notebook_observation": {
        "id": "m4.obs.ronette_laura",
        "text": "due dita. Non è chiaro chi stia contando."
       }
      }
     ],
     "next": "ronette_q",
     "kind": "dialogue",
     "channel": "internal",
     "exposed": false
    },
    {
     "id": "ronette_uomo",
     "new": true,
     "beat": "B2",
     "source_section": "B2-uomo",
     "terminal": true,
     "pages": [
      {
       "name": "COOPER",
       "text": "E l'uomo? C'era un uomo, quella notte.",
       "id": "m4.b2.ronette_uomo.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      },
      {
       "name": "",
       "text": "(Il tracciato si impenna prima che la frase finisca.)",
       "id": "m4.b2.ronette_uomo.p02",
       "mode": "action"
      },
      {
       "name": "RONETTE",
       "text": "BOB. BOB. BOB.",
       "id": "m4.b2.ronette_uomo.p03",
       "mode": "dialogue",
       "speaker_id": "ronette",
       "display_name": "RONETTE"
      },
      {
       "name": "",
       "text": "(Le mani stringono il lenzuolo. Poi, piano, lo lasciano.)",
       "id": "m4.b2.ronette_uomo.p04",
       "mode": "action"
      },
      {
       "name": "COOPER",
       "text": "Grazie. Per oggi basta.",
       "id": "m4.b2.ronette_uomo.p05",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      },
      {
       "name": "INFERMIERA",
       "text": "Quando si stanca, ricomincia dal soffitto. Adesso deve riposare.",
       "id": "m4.b2.ronette_uomo.p06",
       "mode": "dialogue",
       "speaker_id": "infermiera",
       "display_name": "INFERMIERA"
      }
     ],
     "effects": [
      {
       "evidence": "T1_RONETTE_BOB"
      }
     ],
     "next": null,
     "invariant": "unico nodo che scrive T1_RONETTE_BOB",
     "kind": "dialogue",
     "channel": "internal",
     "exposed": false
    },
    {
     "id": "infermiera_attesa",
     "new": true,
     "beat": "attesa",
     "source_section": "attesa-infermiera",
     "optional": true,
     "conditions": [
      {
       "flag": "sogno_fatto"
      },
      {
       "not": {
        "flag": "sogno_raccontato"
       }
      }
     ],
     "pages": [
      {
       "name": "INFERMIERA",
       "text": "Il reparto apre alle visite quando lo dice lo sceriffo. Oggi non l'ha ancora detto.",
       "id": "m4.attesa.infermiera_attesa.p01",
       "mode": "dialogue",
       "speaker_id": "infermiera",
       "display_name": "INFERMIERA"
      },
      {
       "name": "COOPER",
       "text": "Torno quando lo sceriffo avrà detto la sua.",
       "id": "m4.attesa.infermiera_attesa.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      }
     ],
     "repeat": {
      "name": "COOPER",
      "text": "Il reparto aspetta la parola dello sceriffo. Anch'io.",
      "id": "m4.repeat.infermiera_attesa",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER"
     },
     "kind": "dialogue",
     "channel": "world",
     "map_id": "hospital",
     "actor_id": "infermiera",
     "interaction_slot": "primary"
    },
    {
     "id": "infermiera_ctx",
     "new": true,
     "beat": "ctx",
     "source_section": "infermiera_ctx",
     "optional": true,
     "conditions": [
      {
       "node_done": "ronette_uomo"
      }
     ],
     "pages": [
      {
       "name": "INFERMIERA",
       "text": "Non chiedo cosa le ha chiesto. Le dico cosa vedo io.",
       "id": "m4.ctx.infermiera_ctx.p01",
       "mode": "dialogue",
       "speaker_id": "infermiera",
       "display_name": "INFERMIERA"
      },
      {
       "name": "INFERMIERA",
       "text": "Quando un uomo entra senza farsi sentire, lei ripete la stessa parola. Sempre alle sue spalle.",
       "id": "m4.ctx.infermiera_ctx.p02",
       "mode": "dialogue",
       "speaker_id": "infermiera",
       "display_name": "INFERMIERA"
      },
      {
       "name": "COOPER",
       "text": "Non le chiedo di ripetermela.",
       "id": "m4.ctx.infermiera_ctx.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      },
      {
       "name": "INFERMIERA",
       "text": "Il resto, se può, deve dirglielo lei.",
       "id": "m4.ctx.infermiera_ctx.p04",
       "mode": "dialogue",
       "speaker_id": "infermiera",
       "display_name": "INFERMIERA"
      }
     ],
     "effects": [
      {
       "notebook_observation": {
        "id": "m4.obs.infermiera_ctx",
        "text": "la routine dell'infermiera: la parola arriva quando qualcuno entra alle sue spalle."
       }
      }
     ],
     "invariant": "l'infermiera non pronuncia mai il nome",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "hospital",
     "actor_id": "infermiera",
     "interaction_slot": "primary",
     "repeat": {
      "name": "COOPER",
      "text": "L'infermiera ha detto quello che vede. Il resto lo deve dire lei, se può.",
      "id": "m4.repeat.infermiera_ctx",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER"
     }
    },
    {
     "id": "gerard_attesa",
     "new": true,
     "beat": "attesa",
     "source_section": "attesa-gerard",
     "optional": true,
     "conditions": [
      {
       "flag": "sogno_fatto"
      },
      {
       "not": {
        "flag": "sogno_raccontato"
       }
      }
     ],
     "pages": [
      {
       "name": "",
       "text": "(Gerard è in piedi accanto al letto, girato verso la tenda. La manica sinistra è vuota.)",
       "id": "m4.attesa.gerard_attesa.p01",
       "mode": "action"
      },
      {
       "name": "COOPER",
       "text": "Guarda la tenda, non me. Non è lui che devo sentire per primo.",
       "id": "m4.attesa.gerard_attesa.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      }
     ],
     "repeat": {
      "name": "COOPER",
      "text": "Gerard dorme. La manica vuota non si è mossa.",
      "id": "m4.repeat.gerard_attesa",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER"
     },
     "kind": "dialogue",
     "channel": "world",
     "map_id": "hospital",
     "actor_id": "gerard",
     "interaction_slot": "primary"
    },
    {
     "id": "gerard_a2",
     "modified": true,
     "beat": "B3",
     "source_section": "B3",
     "optional": true,
     "guided": "letto accanto a Ronette",
     "pages": [
      {
       "name": "",
       "text": "(Gerard è girato verso la tenda. Il braccio sinistro manca dalla manica.)",
       "id": "m4.b3.gerard_a2.p01",
       "mode": "action"
      },
      {
       "name": "GERARD",
       "text": "Quella sedia la usano tutti quelli che vogliono sapere.",
       "id": "m4.b3.gerard_a2.p02",
       "mode": "dialogue",
       "speaker_id": "gerard",
       "display_name": "GERARD"
      },
      {
       "name": "COOPER",
       "text": "Mi hanno detto che di notte recita. Sempre gli stessi versi.",
       "id": "m4.b3.gerard_a2.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      },
      {
       "name": "GERARD",
       "text": "Attraverso il buio del futuro passato... il mago desidera vedere.",
       "id": "m4.b3.gerard_a2.p04",
       "mode": "dialogue",
       "speaker_id": "gerard",
       "display_name": "GERARD"
      },
      {
       "name": "GERARD",
       "text": "Uno canta fra due mondi... FUOCO CAMMINA CON ME.",
       "id": "m4.b3.gerard_a2.p05",
       "mode": "dialogue",
       "speaker_id": "gerard",
       "display_name": "GERARD"
      },
      {
       "name": "",
       "text": "(Si interrompe. Guarda il cuscino, storto sotto la spalla.)",
       "id": "m4.b3.gerard_a2.p06",
       "mode": "action"
      },
      {
       "name": "GERARD",
       "text": "Le spiacerebbe? Con un braccio solo, il sonno è una trattativa.",
       "id": "m4.b3.gerard_a2.p07",
       "mode": "dialogue",
       "speaker_id": "gerard",
       "display_name": "GERARD"
      },
      {
       "name": "",
       "text": "(Cooper sistema il cuscino. Gerard chiude gli occhi prima di dire grazie.)",
       "id": "m4.b3.gerard_a2.p08",
       "mode": "action"
      },
      {
       "name": "GERARD",
       "text": "Non l'ho imparata. Mi viene.",
       "id": "m4.b3.gerard_a2.p09",
       "mode": "dialogue",
       "speaker_id": "gerard",
       "display_name": "GERARD"
      }
     ],
     "effects": [
      {
       "evidence": "E5_POESIA"
      }
     ],
     "kind": "dialogue",
     "channel": "world",
     "map_id": "hospital",
     "actor_id": "gerard",
     "interaction_slot": "primary",
     "conditions": [
      {
       "flag": "sogno_raccontato"
      }
     ],
     "repeat": {
      "name": "COOPER",
      "text": "Gerard dorme. Le labbra continuano da sole; non lo sveglio per una seconda recita.",
      "id": "m4.repeat.gerard_a2",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER"
     }
    },
    {
     "id": "james_attesa",
     "new": true,
     "beat": "attesa",
     "source_section": "attesa-james",
     "optional": true,
     "conditions": [
      {
       "flag": "sogno_fatto"
      },
      {
       "not": {
        "flag": "sogno_raccontato"
       }
      }
     ],
     "pages": [
      {
       "name": "",
       "text": "(James guarda la tazza. Non alza gli occhi.)",
       "id": "m4.attesa.james_attesa.p01",
       "mode": "action"
      },
      {
       "name": "JAMES",
       "text": "Non ancora. Non so ancora cosa dirle.",
       "id": "m4.attesa.james_attesa.p02",
       "mode": "dialogue",
       "speaker_id": "james",
       "display_name": "JAMES"
      },
      {
       "name": "COOPER",
       "text": "Va bene. Prima parlo con Harry, poi torno qui.",
       "id": "m4.attesa.james_attesa.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      }
     ],
     "repeat": {
      "name": "COOPER",
      "text": "James non alza gli occhi. Prima Harry.",
      "id": "m4.repeat.james_attesa",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER"
     },
     "kind": "dialogue",
     "channel": "world",
     "map_id": "diner",
     "actor_id": "james",
     "interaction_slot": "primary"
    },
    {
     "id": "james_a2",
     "modified": true,
     "beat": "B4",
     "source_section": "B4",
     "conditions": [
      {
       "flag": "sogno_raccontato"
      }
     ],
     "pages": [
      {
       "name": "",
       "text": "(James tiene la tazza con due mani. Piena.)",
       "id": "m4.b4.james_a2.p01",
       "mode": "action"
      },
      {
       "name": "COOPER",
       "text": "Sono venuto a restituirle una metà.",
       "id": "m4.b4.james_a2.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      },
      {
       "name": "",
       "text": "(James non lo tocca. Tira fuori una catenina dal collo: l'altra metà.)",
       "id": "m4.b4.james_a2.p03",
       "mode": "action"
      },
      {
       "name": "JAMES",
       "text": "Gliel'avevo data a febbraio. Al lago. Aveva riso — ha detto che i cuori interi portano sfortuna.",
       "id": "m4.b4.james_a2.p04",
       "mode": "dialogue",
       "speaker_id": "james",
       "display_name": "JAMES"
      },
      {
       "name": "",
       "text": "(Le unisce; le due metà combaciano. Per un momento nessuno dei due parla. La tazza resta piena.)",
       "id": "m4.b4.james_a2.p05",
       "mode": "action"
      },
      {
       "name": "JAMES",
       "text": "Non l'ho più vista ridere così, dopo.",
       "id": "m4.b4.james_a2.p06",
       "mode": "dialogue",
       "speaker_id": "james",
       "display_name": "JAMES"
      },
      {
       "name": "COOPER",
       "text": "Non devo sapere cosa vi siete detti. Devo sapere dove ve lo dicevate.",
       "id": "m4.b4.james_a2.p07",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      },
      {
       "name": "JAMES",
       "text": "Non in paese. Qui una macchina parcheggiata diventa una storia prima di sera.",
       "id": "m4.b4.james_a2.p08",
       "mode": "dialogue",
       "speaker_id": "james",
       "display_name": "JAMES"
      },
      {
       "name": "JAMES",
       "text": "Oltre la strada a est. Dopo il ponte — dove finiscono le case e cominciano i binari.",
       "id": "m4.b4.james_a2.p09",
       "mode": "dialogue",
       "speaker_id": "james",
       "display_name": "JAMES"
      },
      {
       "name": "JAMES",
       "text": "Se là fuori c'è qualcosa, agente... io gliel'ho indicato. Non me lo racconti mai.",
       "id": "m4.b4.james_a2.p10",
       "mode": "dialogue",
       "speaker_id": "james",
       "display_name": "JAMES"
      }
     ],
     "effects": [
      {
       "evidence": "E6A_CUORE_INTERO"
      },
      {
       "evidence": "T_JAMES_EST"
      }
     ],
     "invariant": "James non formula mai P2",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "diner",
     "actor_id": "james",
     "interaction_slot": "primary",
     "mandatory_beat": true,
     "repeat": {
      "name": "COOPER",
      "text": "Ha detto un posto, non un nome. Per oggi mi basta il posto.",
      "id": "m4.repeat.james_a2",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER"
     }
    },
    {
     "id": "cmp_t1_e5",
     "new": true,
     "beat": "B7",
     "source_section": "B7",
     "optional": true,
     "conditions": [
      {
       "evidence": "T1_RONETTE_BOB"
      },
      {
       "evidence": "E5_POESIA"
      }
     ],
     "pages": [
      {
       "name": "",
       "text": "(Confronta: Ronette pronuncia «BOB» ↔ la formula recitata da Gerard)",
       "id": "m4.b7.cmp_t1_e5.p01",
       "mode": "action"
      },
      {
       "name": "TACCUINO",
       "text": "Un nome gridato in un letto. Una formula recitata in quello accanto. Stesso filo — o due livelli del caso.",
       "id": "m4.b7.cmp_t1_e5.p02",
       "mode": "notebook"
      }
     ],
     "effects": [
      {
       "proposition": "P4B",
       "to": "formulated",
       "created_from": [
        "T1_RONETTE_BOB",
        "E5_POESIA"
       ]
      }
     ],
     "kind": "comparison",
     "channel": "notebook",
     "interaction_slot": "primary",
     "comparison_completion": "node_commit",
     "completed_recall": {
      "section": "propositions",
      "page": {
       "id": "m4.notebook.cmp_t1_e5.already_recorded",
       "mode": "notebook",
       "text": "(Questo nesso è già registrato nelle Proposizioni.)"
      }
     }
    },
    {
     "id": "cmp_e6a_tjames",
     "new": true,
     "beat": "B8",
     "source_section": "B8",
     "prompt": "Che cosa dimostra il confronto?",
     "conditions": [
      {
       "evidence": "E6A_CUORE_INTERO"
      },
      {
       "evidence": "T_JAMES_EST"
      },
      {
       "node_done": "ronette_uomo"
      }
     ],
     "pages": [
      {
       "name": "",
       "text": "(Confronta: le due metà combaciano ↔ James: «oltre il ponte, verso i binari»)",
       "id": "m4.b8.cmp_e6a_tjames.p01",
       "mode": "action"
      },
      {
       "name": "TACCUINO",
       "text": "Un confronto accosta due voci; il taccuino conserva entrambe senza fonderle.",
       "first_time_only": true,
       "id": "m4.b8.cmp_e6a_tjames.p02",
       "mode": "notebook"
      },
      {
       "name": "TACCUINO",
       "text": "Nel taccuino, il pendaglio ricomposto è affiancato alla rotta indicata da James.",
       "id": "m4.b8.cmp_e6a_tjames.p03",
       "mode": "notebook"
      }
     ],
     "choices": [
      {
       "id": "b8_a",
       "label": "Conferma che James parlava da un rapporto privato realmente esistito.",
       "result": "SOURCE_CORROBORATION",
       "effects": [
        {
         "proposition": "P2",
         "to": "formulated",
         "created_from": [
          "E6A_CUORE_INTERO",
          "T_JAMES_EST"
         ]
        }
       ],
       "feedback_pages": [
        {
         "id": "m4.b8.feedback.source_corroboration",
         "mode": "notebook",
         "text": "Il pendaglio conferma il rapporto. La geografia resta una testimonianza da verificare."
        }
       ]
      },
      {
       "id": "b8_b",
       "label": "Dimostra che tutti gli incontri segreti di Laura avvenivano presso i binari.",
       "result": "GEOGRAPHIC_OVERREACH",
       "retry": true,
       "feedback_pages": [
        {
         "id": "m4.b8.feedback.geographic_overreach",
         "mode": "notebook",
         "text": "James descrive alcuni incontri con lui. Non l'intera vita privata di Laura."
        }
       ]
      },
      {
       "id": "b8_c",
       "label": "Collega James all'uomo del sogno.",
       "result": "SYMBOLIC_OVERREACH",
       "retry": true,
       "feedback_pages": [
        {
         "id": "m4.b8.feedback.symbolic_overreach",
         "mode": "notebook",
         "text": "Niente nelle due fonti riguarda l'uomo del sogno."
        }
       ]
      }
     ],
     "tracks": [
      "b8_attempt_history",
      "assistance_level"
     ],
     "rules": {
      "attempt_history": "b8_attempt_history",
      "hide_attempted_results": true
     },
     "kind": "comparison",
     "channel": "notebook",
     "interaction_slot": "primary",
     "mandatory_beat": true,
     "completed_recall": {
      "section": "propositions",
      "page": {
       "id": "m4.notebook.cmp_e6a_tjames.already_recorded",
       "mode": "notebook",
       "text": "(Questo nesso è già registrato nelle Proposizioni.)"
      }
     }
    },
    {
     "id": "present_truman_m4",
     "new": true,
     "beat": "B9",
     "source_section": "B9",
     "pages": [
      {
       "name": "TRUMAN",
       "text": "Dimmi quale nesso regge, Cooper.",
       "id": "m4.b9.present_truman_m4.p01",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN"
      },
      {
       "name": "COOPER",
       "text": "Harry, separo ciò che sospetto da ciò su cui possiamo camminare. Cominciamo dal nesso più solido.",
       "id": "m4.b9.present_truman_m4.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER"
      }
     ],
     "presentation": {
      "options_from": "formulated_propositions_only",
      "auto_show_provenance": {
       "from": "formulation.created_from",
       "template": "Formulata da: {evidence_labels}"
      },
      "on": {
       "P2": {
        "result": "accepted",
        "reason_code": "SUFFICIENT_RELEVANT_SUPPORT",
        "acceptance_type": "investigatory_route",
        "pages": [
         {
          "name": "COOPER",
          "text": "Il pendaglio conferma che quel rapporto esisteva. Il paese non lo vedeva, e James non l'ha mai messo in piazza.",
          "id": "m4.b9.present_p2.p01",
          "mode": "dialogue",
          "speaker_id": "cooper",
          "display_name": "COOPER"
         },
         {
          "name": "COOPER",
          "text": "I posti li ha detti lui: oltre il ponte, verso i binari.",
          "id": "m4.b9.present_p2.p02",
          "mode": "dialogue",
          "speaker_id": "cooper",
          "display_name": "COOPER"
         },
         {
          "name": "TRUMAN",
          "text": "Il pendaglio dice che James parlava da dentro. La strada resta da controllare.",
          "id": "m4.b9.present_p2.p03",
          "mode": "dialogue",
          "speaker_id": "truman",
          "display_name": "TRUMAN"
         },
         {
          "name": "TRUMAN",
          "text": "Dopo il ponte non ci sono case. C'è il ponticello di legno dove hanno raccolto Ronette, la notte di Laura.",
          "id": "m4.b9.present_p2.p04",
          "mode": "dialogue",
          "speaker_id": "truman",
          "display_name": "TRUMAN"
         },
         {
          "name": "COOPER",
          "text": "Veniva da est.",
          "id": "m4.b9.present_p2.p05",
          "mode": "dialogue",
          "speaker_id": "cooper",
          "display_name": "COOPER"
         },
         {
          "name": "TRUMAN",
          "text": "Da est. Hawk è già al ponte. Non toccate niente, nessuno dei due.",
          "id": "m4.b9.present_p2.p06",
          "mode": "dialogue",
          "speaker_id": "truman",
          "display_name": "TRUMAN"
         }
        ],
        "effects": []
       },
       "P4B": {
        "result": "rejected",
        "reason_code": "PREMATURE_SYMBOLIC_LINK",
        "already_rejected_page": {
         "id": "m4.b9.p4b.already_rejected",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "Me l'hai già mostrato. Non è cambiato niente."
        },
        "pages": [
         {
          "name": "TRUMAN",
          "text": "Un nome in un letto e dei versi in quello accanto. Lo tengo a mente — ma non ci cammino sopra.",
          "id": "m4.b9.p4b.p01",
          "mode": "dialogue",
          "speaker_id": "truman",
          "display_name": "TRUMAN"
         }
        ]
       },
       "_none_formulated": {
        "result": "rejected",
        "reason_code": "NOT_YET_FORMULATED",
        "pages": [
         {
          "name": "TRUMAN",
          "text": "Non ho ancora un nesso da giudicare. Cosa collega le tue visite?",
          "id": "m4.b9.none_formulated.p01",
          "mode": "dialogue",
          "speaker_id": "truman",
          "display_name": "TRUMAN"
         }
        ],
        "effects": [
         {
          "notebook_question": {
           "id": "m4.q.visits",
           "text": "Che cosa aggiunge una visita alle altre?"
          }
         }
        ]
       }
      },
      "target_actor_id": "truman"
     },
     "repeat": {
      "name": "COOPER",
      "text": "Diane, Harry manda me e Hawk ai binari. Il verbo importante è «non toccare».",
      "id": "m4.repeat.present_truman_m4",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER"
     },
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "actor_id": "truman",
     "interaction_slot": "primary",
     "mandatory_beat": true,
     "conditions": [
      {
       "flag": "sogno_raccontato"
      }
     ]
    }
   ],
   "node_count": {
    "new": 13,
    "modified": 3,
    "runtime_total": 16
   }
  };
  D.missions.M5 = {
   "narrative_package": "narrative-v1.0",
   "mission": "M5",
   "title": "Il vagone",
   "source": {
    "document": "M5-M6 v1.1.1 LOCK.md",
    "package": "narrative-v1.0",
    "revision": "act-3-implementation-pass-01 (docs/act-3-design-report.md §12 A1–A14, doctrine-audit R1/R2, O1–O4, O8, O11)"
   },
   "schema_delta": "narrative/schema-deltas/M5.md",
   "entry_condition": {
    "all": [
     {
      "flag": "atto3"
     },
     {
      "proposition_path": "P2.social_status.accepted_by",
      "contains": "truman"
     }
    ]
   },
   "observation_groups": {
    "set_id": "m5_observations",
    "groups": {
     "ticket": [
      "E7A_BIGLIETTO_TESTO",
      "E7B_BIGLIETTO_POSIZIONE"
     ],
     "ring": [
      "E8A_ANELLO_POSIZIONE",
      "E8B_ANELLO_SUPERFICIE"
     ],
     "scene": [
      "E_SCENE"
     ]
    }
   },
   "milestones": [
    {
     "id": "milestone_theory_revision",
     "node": "m5_theory_revision",
     "pending_when": {
      "all": [
       {
        "value_is": {
         "name": "m5_initial_theory",
         "equals": "degeneration"
        }
       },
       {
        "node_done": "m5_mound"
       },
       {
        "node_done": "m5_scene"
       },
       {
        "proposition_path": "P3A.formulation.status",
        "equals": "formulated"
       }
      ]
     },
     "resolved_when": {
      "value_set": "m5_final_theory"
     },
     "blocks": {
      "kind": "node_prepare",
      "nodes": [
       "m5_report_intro"
      ]
     }
    },
    {
     "id": "milestone_theory_first",
     "node": "m5_theory_first",
     "pending_when": {
      "all": [
       {
        "value_is": {
         "name": "m5_initial_theory",
         "equals": "withheld"
        }
       },
       {
        "node_done": "m5_mound"
       },
       {
        "node_done": "m5_scene"
       },
       {
        "proposition_path": "P3A.formulation.status",
        "equals": "formulated"
       }
      ]
     },
     "resolved_when": {
      "value_set": "m5_final_theory"
     },
     "blocks": {
      "kind": "node_prepare",
      "nodes": [
       "m5_report_intro"
      ]
     }
    }
   ],
   "completion": {
    "when": {
     "flag": "east_route_confirmed"
    },
    "sets": []
   },
   "objectives": [
    {
     "id": "obj_m5_7",
     "priority": 400,
     "when": {
      "flag": "east_route_confirmed"
     },
     "text": "Segui la rotta oltre il confine: One Eyed Jacks."
    },
    {
     "id": "obj_m5_6",
     "priority": 350,
     "when": {
      "all": [
       {
        "value_set": "s1"
       },
       {
        "not": {
         "flag": "east_route_confirmed"
        }
       }
      ]
     },
     "text": "Hawk è ai binari, oltre il vagone."
    },
    {
     "id": "obj_m5_5",
     "priority": 300,
     "when": {
      "all": [
       {
        "value_set": "m5_final_theory"
       },
       {
        "not": {
         "value_set": "s1"
        }
       }
      ]
     },
     "text": "Truman è sui binari. Riferisci la scena prima che cali la luce."
    },
    {
     "id": "obj_m5_4",
     "priority": 275,
     "when": {
      "all": [
       {
        "node_done": "m5_mound"
       },
       {
        "node_done": "m5_scene"
       },
       {
        "proposition_path": "P3A.formulation.status",
        "equals": "formulated"
       },
       {
        "not": {
         "value_set": "m5_final_theory"
        }
       }
      ]
     },
     "text": "Torna sulla soglia del vagone. La prima lettura regge?"
    },
    {
     "id": "obj_m5_3",
     "priority": 250,
     "when": {
      "all": [
       {
        "node_done": "m5_mound"
       },
       {
        "node_done": "m5_ring"
       },
       {
        "node_done": "m5_scene"
       },
       {
        "not": {
         "proposition_path": "P3A.formulation.status",
         "equals": "formulated"
        }
       }
      ]
     },
     "text": "Taccuino (T): l'anello e la polvere intorno."
    },
    {
     "id": "obj_m5_2",
     "priority": 200,
     "when": {
      "all": [
       {
        "flag": "vagone_scoperto"
       },
       {
        "not": {
         "all": [
          {
           "node_done": "m5_mound"
          },
          {
           "node_done": "m5_ring"
          },
          {
           "node_done": "m5_scene"
          }
         ]
        }
       }
      ]
     },
     "text": "Esamina il vagone senza spostare nulla: la terra, la traversa, il centro."
    },
    {
     "id": "obj_m5_1",
     "priority": 100,
     "when": {
      "not": {
       "flag": "vagone_scoperto"
      }
     },
     "text": "Verifica la rotta di James: oltre il ponte, verso i binari."
    }
   ],
   "nodes": [
    {
     "id": "m5_bridge",
     "beat": "A2",
     "source_section": "M5-B1-B2",
     "conditions": [],
     "pages": [
      {
       "id": "m5.b1.bridge.p01",
       "mode": "action",
       "text": "(Le case finiscono dove aveva detto James. Dopo il ponte, solo la massicciata.)"
      },
      {
       "id": "m5.b1.bridge.p02",
       "mode": "action",
       "text": "(Sulla sponda del paese, un paletto della contea con un nastro. Le assi sono consumate da questa parte del torrente; dall'altra, no.)"
      },
      {
       "id": "m5.b1.bridge.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "La rotta di James e la strada di Ronette sono la stessa strada."
      },
      {
       "id": "m5.b1.bridge.p04",
       "mode": "dialogue",
       "speaker_id": "hawk",
       "display_name": "HAWK",
       "text": "(raggiungendolo) Truman mi manda a farti da ombra. Da qui in poi le impronte sono mie e tue."
      },
      {
       "id": "m5.b1.bridge.p05",
       "mode": "dialogue",
       "speaker_id": "hawk",
       "display_name": "HAWK",
       "text": "Le altre sono più vecchie della pioggia. Portano a est, nessuna torna indietro."
      },
      {
       "id": "m5.b1.bridge.p06",
       "mode": "dialogue",
       "speaker_id": "hawk",
       "display_name": "HAWK",
       "text": "Il paletto l'ha messo la contea, tre giorni fa. La terra la leggo io. Il resto lo leggi tu."
      }
     ],
     "effects": [
      {
       "evidence": "E_PONTE_DIREZIONE"
      },
      {
       "notebook": {
        "id": "m5.note.bridge",
        "text": "Paletto della contea sulla sponda del paese. Assi consumate solo da quella parte. Impronte più vecchie della pioggia, verso est. Chi ha consumato le assi, e da dove veniva?"
       }
      }
     ],
     "invariant": "unico writer di E_PONTE_DIREZIONE; nessuno dice «scappava verso il paese»: la direzione resta inferenza del giocatore",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "target_kind": "landmark",
     "target_id": "bridge_rail",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m5_discovery",
     "beat": "A3",
     "source_section": "M5-B3-B4",
     "conditions": [
      {
       "node_done": "m5_bridge"
      }
     ],
     "pages": [
      {
       "id": "m5.b3.discovery.p01",
       "mode": "action",
       "text": "(Oltre la curva, fermo dove i binari muoiono: un vagone merci. Solo.)"
      },
      {
       "id": "m5.b3.discovery.p02",
       "mode": "dialogue",
       "speaker_id": "hawk",
       "display_name": "HAWK",
       "text": "Io tengo fuori gli altri. Tu fai il primo passaggio."
      },
      {
       "id": "m5.b3.discovery.p03",
       "mode": "action",
       "text": "(Dalla porta, tutto in una volta: un mucchio di terra sulla soglia. A sinistra un sedile divelto, a destra una lamiera piegata. Al centro una traversa, e sopra qualcosa di piccolo. In fondo, una stufa.)"
      },
      {
       "id": "m5.b3.discovery.p04",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Prima terra, lamiera e distanze. Il vagone può aspettare un minuto prima di diventare una storia."
      }
     ],
     "effects": [
      {
       "set": "vagone_scoperto"
      }
     ],
     "next": "m5_theory_initial",
     "invariant": "il prompt della prima lettura (next) parte SOLO dopo che tutto l'interno è stato reso dalla porta (p03); nessuna nota di Cooper che spieghi la lettura",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "target_kind": "landmark",
     "target_id": "traincar_entrance",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m5_hawk_bridge",
     "beat": "A2",
     "source_section": "scene-contracts S1/S2/S3 (Hawk fuori dal vagone)",
     "conditions": [
      {
       "node_done": "m5_bridge"
      },
      {
       "not": {
        "flag": "vagone_scoperto"
       }
      }
     ],
     "pages": [
      {
       "id": "m5.hawk.hawk_bridge.p01",
       "mode": "dialogue",
       "speaker_id": "hawk",
       "display_name": "HAWK",
       "text": "Le impronte sono di là, sulla massicciata. Non le calpesto io, non le calpesti tu."
      },
      {
       "id": "m5.hawk.hawk_bridge.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Tre passi dietro di te. Non uno di più."
      }
     ],
     "effects": [],
     "repeat": {
      "id": "m5.hawk.hawk_bridge.repeat",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Hawk resta sulle impronte. Io vado dove muoiono i binari."
     },
     "invariant": "riga di collocazione (sprite hawk_bridge), nessun effetto; Hawk parla di distanze e direzioni, mai di motivi",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "actor_id": "hawk_bridge",
     "target_kind": "actor",
     "target_id": "hawk_bridge",
     "interaction_slot": "primary",
     "mandatory_beat": false
    },
    {
     "id": "m5_theory_initial",
     "beat": "A3",
     "source_section": "M5-B8a (R1)",
     "prompt": "Prima lettura?",
     "pages": [
      {
       "id": "m5.b8a.theory.p01",
       "mode": "notebook",
       "text": "Terra sulla soglia. Segni ai lati. Una cosa piccola al centro."
      }
     ],
     "choices": [
      {
       "id": "theory_degeneration",
       "label": "Un incontro degenerato.",
       "effects": [
        {
         "value": "m5_initial_theory",
         "to": "degeneration"
        }
       ],
       "feedback_pages": [
        {
         "id": "m5.b8a.feedback.degeneration",
         "mode": "action",
         "text": "(Cooper lo scrive a matita. Sotto la riga lascia spazio.)"
        }
       ]
      },
      {
       "id": "theory_withhold",
       "label": "Non scrivo ancora.",
       "effects": [
        {
         "value": "m5_initial_theory",
         "to": "withheld"
        }
       ],
       "feedback_pages": [
        {
         "id": "m5.b8a.feedback.withhold",
         "mode": "action",
         "text": "(La pagina resta bianca. La data, sì.)"
        }
       ]
      }
     ],
     "invariant": "SOLO due opzioni: impeto o sospensione; «disposizione» non è offerta prima delle sue premesse (R1); nessuna opzione marcata corretta",
     "kind": "choice",
     "channel": "internal",
     "exposed": false,
     "interaction_slot": "primary",
     "role": "theory",
     "completion_when": {
      "value_set": "m5_initial_theory"
     }
    },
    {
     "id": "m5_mound",
     "beat": "A4",
     "source_section": "M5-B5",
     "observation_group": "ticket",
     "conditions": [
      {
       "node_done": "m5_discovery"
      }
     ],
     "pages": [
      {
       "id": "m5.b5.mound.p01",
       "mode": "action",
       "text": "(Un mucchio di terra sulla soglia. Dentro, non fuori: il primo passo di chiunque entri.)"
      },
      {
       "id": "m5.b5.mound.p02",
       "mode": "notebook",
       "text": "Un biglietto piegato in quattro, nella terra. Pieghe interne pulite. Un lembo lasciato sopra la terra, alla luce. Nascosto a chi?"
      },
      {
       "id": "m5.b5.mound.p03",
       "mode": "action",
       "text": "(Cooper lo apre con la penna. Lettere maiuscole, incise più che scritte.)"
      },
      {
       "id": "m5.b5.mound.p04",
       "mode": "notebook",
       "text": "\"FUOCO CAMMINA CON ME\"."
      },
      {
       "id": "m5.b5.mound.p05",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Sotto terra le pieghe sono pulite. Sopra, un lembo, dove passa ogni piede. Registro posizione e testo separatamente."
      }
     ],
     "effects": [
      {
       "evidence": "E7B_BIGLIETTO_POSIZIONE"
      },
      {
       "evidence": "E7A_BIGLIETTO_TESTO"
      }
     ],
     "invariant": "unico writer di E7A/E7B; nessuna datazione tramite pioggia; il lembo visibile è detto, non interpretato",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "target_kind": "object",
     "target_id": "mound",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m5_ring",
     "beat": "A5",
     "source_section": "M5-B6",
     "observation_group": "ring",
     "conditions": [
      {
       "node_done": "m5_discovery"
      }
     ],
     "pages": [
      {
       "id": "m5.b6.ring.p01",
       "mode": "action",
       "text": "(Su una traversa di legno, al centro esatto: un anello.)"
      },
      {
       "id": "m5.b6.ring.p02",
       "mode": "notebook",
       "text": "Un anello, in piano, al centro esatto della traversa."
      },
      {
       "id": "m5.b6.ring.p03",
       "mode": "action",
       "text": "(Cooper si abbassa. Non lo tocca.)"
      },
      {
       "id": "m5.b6.ring.p04",
       "mode": "notebook",
       "text": "La polvere intorno è intatta fino al bordo. Nessuna striscia, nessun percorso di caduta. Caduto, o fermato?"
      },
      {
       "id": "m5.b6.ring.p05",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Centro esatto, polvere intatta. Prima di chiedere di chi fosse, annotiamo come stava qui."
      }
     ],
     "effects": [
      {
       "evidence": "E8A_ANELLO_POSIZIONE"
      },
      {
       "evidence": "E8B_ANELLO_SUPERFICIE"
      }
     ],
     "invariant": "unico writer di E8A/E8B; nessuna identità del proprietario; nessuno dice «posato» qui",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "target_kind": "object",
     "target_id": "ring",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m5_scene",
     "beat": "A6",
     "source_section": "M5-B7",
     "observation_group": "scene",
     "conditions": [
      {
       "node_done": "m5_discovery"
      }
     ],
     "pages": [
      {
       "id": "m5.b7.scene.p01",
       "mode": "action",
       "text": "(Dal centro: la porta, il mucchio sulla soglia, la traversa sotto i piedi. Una linea sola. Il sedile e la lamiera restano agli angoli. Fra gli angoli e qui, la polvere non ha strisce.)"
      },
      {
       "id": "m5.b7.scene.p02",
       "mode": "notebook",
       "text": "I segni ai bordi. Il centro vuoto. Nessun trascinamento fra i due. Che cosa ha attraversato questo spazio, e come?"
      },
      {
       "id": "m5.b7.scene.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Hawk, la soglia è tua. Io fotografo il vuoto fra questi segni."
      }
     ],
     "effects": [
      {
       "evidence": "E_SCENE"
      }
     ],
     "invariant": "E_SCENE scritta SOLO qui, dal punto centrale (osservazione posizionale), mai entrando nel vagone",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "target_kind": "landmark",
     "target_id": "scene_center",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m5_stove",
     "beat": "A7",
     "source_section": "act-3-design-report §12 A7",
     "optional": true,
     "conditions": [
      {
       "node_done": "m5_discovery"
      }
     ],
     "pages": [
      {
       "id": "m5.a7.stove.p01",
       "mode": "action",
       "text": "(Una stufa di ghisa contro la parete di fondo. Fredda. Dentro, la cenere è rastrellata in cerchio. Sul bordo, l'angolo bruciato di una bustina di fiammiferi.)"
      },
      {
       "id": "m5.a7.stove.p02",
       "mode": "notebook",
       "text": "Stufa fredda. Cenere in cerchio, rastrellata. Un angolo di fiammiferi bruciato. Chi l'ha guardata spegnersi?"
      },
      {
       "id": "m5.a7.stove.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Fuoco. Qualcuno l'ha guardato spegnersi."
      },
      {
       "id": "m5.a7.stove.p04",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Cera a strati sotto il sedile, cenere a strati qui. Non è stata una sera sola.",
       "condition": {
        "node_done": "m5_cards"
       }
      }
     ],
     "effects": [
      {
       "evidence": "E_STUFA"
      }
     ],
     "invariant": "unico writer di E_STUFA; facoltativo; la riga «non una sera sola» esiste SOLO con stufa ∧ carte (pagina condizionata), mai Hawk, mai Truman",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "target_kind": "object",
     "target_id": "stove",
     "interaction_slot": "primary",
     "mandatory_beat": false
    },
    {
     "id": "m5_cards",
     "beat": "A8",
     "source_section": "act-3-design-report §12 A8",
     "optional": true,
     "conditions": [
      {
       "node_done": "m5_discovery"
      }
     ],
     "pages": [
      {
       "id": "m5.a8.cards.p01",
       "mode": "action",
       "text": "(Sotto il sedile divelto, un mazzo di carte umido. Il taglio del mazziere è ancora squadrato. Sul pavimento, cera di candela a più strati.)"
      },
      {
       "id": "m5.a8.cards.p02",
       "mode": "notebook",
       "text": "Carte umide sotto il sedile. Il taglio ancora squadrato. Cera a strati sul pavimento. Chi teneva il banco, e quante sere?"
      },
      {
       "id": "m5.a8.cards.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Qui qualcuno teneva il banco."
      },
      {
       "id": "m5.a8.cards.p04",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Cenere a strati nella stufa, cera a strati qui. Più di una sera.",
       "condition": {
        "node_done": "m5_stove"
       }
      }
     ],
     "effects": [
      {
       "evidence": "E_CARTE"
      }
     ],
     "invariant": "unico writer di E_CARTE; facoltativo; nessuna testimonianza di Jacques qui: solo l'oggetto",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "target_kind": "object",
     "target_id": "cards",
     "interaction_slot": "primary",
     "mandatory_beat": false
    },
    {
     "id": "m5_hawk_door",
     "beat": "A3",
     "source_section": "scene-contracts S1/S2/S3 (Hawk fuori dal vagone)",
     "conditions": [
      {
       "flag": "vagone_scoperto"
      },
      {
       "not": {
        "value_set": "s1"
       }
      }
     ],
     "pages": [
      {
       "id": "m5.hawk.hawk_door.p01",
       "mode": "dialogue",
       "speaker_id": "hawk",
       "display_name": "HAWK",
       "text": "(senza voltarsi) La soglia la tengo io. Dentro ci sei tu."
      },
      {
       "id": "m5.hawk.hawk_door.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Bene. Dentro conto i passi, non le storie."
      }
     ],
     "effects": [],
     "repeat": {
      "id": "m5.hawk.hawk_door.repeat",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Hawk tiene la soglia. Il vagone è mio finché non ho finito."
     },
     "invariant": "riga di collocazione (sprite hawk_door), nessun effetto; Hawk non entra mai nel vagone",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "actor_id": "hawk_door",
     "target_kind": "actor",
     "target_id": "hawk_door",
     "interaction_slot": "primary",
     "mandatory_beat": false
    },
    {
     "id": "m5_cmp_ring",
     "beat": "A9",
     "source_section": "M5-B8c (R1: ultima osservazione obbligatoria)",
     "prompt": "Polvere intatta fino al bordo. Che dice?",
     "conditions": [
      {
       "evidence": "E8A_ANELLO_POSIZIONE"
      },
      {
       "evidence": "E8B_ANELLO_SUPERFICIE"
      }
     ],
     "pages": [
      {
       "id": "m5.b8c.cmp_ring.p01",
       "mode": "notebook",
       "text": "Anello al centro esatto. Polvere continua fino al bordo dell'anello."
      }
     ],
     "choices": [
      {
       "id": "ring_a",
       "label": "Che non è caduto. È stato posato.",
       "result": "DELIBERATE_PLACEMENT",
       "effects": [
        {
         "proposition": "P3A",
         "to": "formulated",
         "created_from": [
          "E8A_ANELLO_POSIZIONE",
          "E8B_ANELLO_SUPERFICIE"
         ]
        }
       ],
       "feedback_pages": [
        {
         "id": "m5.b8c.feedback.deliberate",
         "mode": "action",
         "text": "(Cooper non lo tocca. Fotografa il bordo della polvere, poi il centro. Due scatti, nessuna parola.)"
        }
       ]
      },
      {
       "id": "ring_b",
       "label": "Che nessuno entra qui da anni.",
       "result": "NO_ENTRY_OVERREACH",
       "retry": true,
       "feedback_pages": [
        {
         "id": "m5.b8c.feedback.no_entry",
         "mode": "notebook",
         "text": "Le impronte fuori dicono altro: qualcuno è passato, prima della pioggia."
        }
       ]
      },
      {
       "id": "ring_c",
       "label": "Che l'anello è di Laura.",
       "result": "OWNERSHIP_OVERREACH",
       "retry": true,
       "feedback_pages": [
        {
         "id": "m5.b8c.feedback.ownership",
         "mode": "notebook",
         "text": "Niente qui dice di chi sia."
        }
       ]
      }
     ],
     "rules": {
      "attempt_scope": "comparison",
      "hide_attempted_results": true,
      "track_assistance": false
     },
     "invariant": "P3A nasce SOLO da questo confronto (unconfirmed); il feedback della lettura giusta è un'azione, mai un verdetto; tentativi in comparisons[node].attempts — MAI b8_attempt_history di M4, MAI assistance_level",
     "kind": "comparison",
     "channel": "notebook",
     "interaction_slot": "primary",
     "mandatory_beat": true,
     "completed_recall": {
      "section": "propositions",
      "page": {
       "id": "m5.notebook.cmp_ring.already_recorded",
       "mode": "notebook",
       "text": "(Questo nesso è già registrato nelle Proposizioni.)"
      }
     }
    },
    {
     "id": "m5_theory_revision",
     "beat": "A10",
     "source_section": "M5-B8b (R1: revisione sotto pressione, impeto scritto)",
     "prompt": "La polvere è intatta. Regge ancora?",
     "milestone": "milestone_theory_revision",
     "conditions": [
      {
       "value_is": {
        "name": "m5_initial_theory",
        "equals": "degeneration"
       }
      },
      {
       "node_done": "m5_mound"
      },
      {
       "node_done": "m5_scene"
      },
      {
       "proposition_path": "P3A.formulation.status",
       "equals": "formulated"
      }
     ],
     "pages": [
      {
       "id": "m5.b8b.revision.p01",
       "mode": "notebook",
       "text": "A matita: un incontro degenerato. Sotto: lembo fuori dalla terra, centro senza strisce, polvere intatta fino al bordo."
      }
     ],
     "choices": [
      {
       "id": "revision_keep",
       "label": "Regge. Un incontro degenerato.",
       "effects": [
        {
         "value": "m5_final_theory",
         "from_value": "m5_initial_theory"
        }
       ],
       "feedback_pages": [
        {
         "id": "m5.b8b.feedback.keep",
         "mode": "action",
         "text": "(Cooper ripassa la riga a matita. Non la cancella. Sotto, i tre fatti restano scritti.)"
        }
       ]
      },
      {
       "id": "revision_switch",
       "label": "La rivedo: qualcuno ha disposto il centro perché fosse letto.",
       "effects": [
        {
         "value": "m5_final_theory",
         "to": "staging"
        }
       ],
       "feedback_pages": [
        {
         "id": "m5.b8b.feedback.switch",
         "mode": "action",
         "text": "(Cooper cancella. Scrive la nuova riga a penna.)"
        }
       ]
      },
      {
       "id": "revision_open",
       "label": "La scena regge ancora entrambe.",
       "effects": [
        {
         "value": "m5_final_theory",
         "to": "open"
        }
       ],
       "feedback_pages": [
        {
         "id": "m5.b8b.feedback.open",
         "mode": "action",
         "text": "(Due righe, una sotto l'altra. Nessuna cancellata.)"
        }
       ]
      }
     ],
     "invariant": "raggiungibile SOLO con mucchio ∧ centro ∧ confronto anello risolto = P3A formulata (O1; il confronto non scrive nodes_done: si legge la proposizione); scrive SOLO m5_final_theory (m5_theory_revised eliminato); nessuna opzione marcata corretta",
     "kind": "choice",
     "channel": "notebook",
     "interaction_slot": "primary",
     "role": "theory",
     "completion_when": {
      "value_set": "m5_final_theory"
     }
    },
    {
     "id": "m5_theory_first",
     "beat": "A10",
     "source_section": "M5-B8b (R1: prima scrittura, lettura sospesa alla porta)",
     "prompt": "Ora scrivi?",
     "milestone": "milestone_theory_first",
     "conditions": [
      {
       "value_is": {
        "name": "m5_initial_theory",
        "equals": "withheld"
       }
      },
      {
       "node_done": "m5_mound"
      },
      {
       "node_done": "m5_scene"
      },
      {
       "proposition_path": "P3A.formulation.status",
       "equals": "formulated"
      }
     ],
     "pages": [
      {
       "id": "m5.b8b.first.p01",
       "mode": "notebook",
       "text": "La pagina è ancora bianca. Sotto la data: lembo fuori dalla terra, centro senza strisce, polvere intatta fino al bordo."
      }
     ],
     "choices": [
      {
       "id": "first_degeneration",
       "label": "Un incontro degenerato.",
       "effects": [
        {
         "value": "m5_final_theory",
         "to": "degeneration"
        }
       ],
       "feedback_pages": [
        {
         "id": "m5.b8b.feedback.first_degeneration",
         "mode": "action",
         "text": "(Cooper scrive la riga a matita. Sotto, i tre fatti restano scritti.)"
        }
       ]
      },
      {
       "id": "first_staging",
       "label": "Qualcuno ha disposto il centro perché fosse letto.",
       "effects": [
        {
         "value": "m5_final_theory",
         "to": "staging"
        }
       ],
       "feedback_pages": [
        {
         "id": "m5.b8b.feedback.first_staging",
         "mode": "action",
         "text": "(Cooper scrive la riga a penna.)"
        }
       ]
      },
      {
       "id": "first_open",
       "label": "La scena regge entrambe.",
       "effects": [
        {
         "value": "m5_final_theory",
         "to": "open"
        }
       ],
       "feedback_pages": [
        {
         "id": "m5.b8b.feedback.first_open",
         "mode": "action",
         "text": "(Due righe, una sotto l'altra. Nessuna cancellata.)"
        }
       ]
      }
     ],
     "invariant": "controparte di m5_theory_revision per chi ha sospeso alla porta; condizioni mutuamente esclusive via value_is; scrive SOLO m5_final_theory",
     "kind": "choice",
     "channel": "notebook",
     "interaction_slot": "primary",
     "role": "theory",
     "completion_when": {
      "value_set": "m5_final_theory"
     }
    },
    {
     "id": "m5_cmp_ticket_e5",
     "beat": "A11",
     "source_section": "M5-B8c",
     "optional": true,
     "cross_mission_latency": {
      "policy": "global_notebook_registry",
      "keep": [
       "source_mission"
      ],
      "dedup_by": "node_id"
     },
     "conditions": [
      {
       "evidence": "E7A_BIGLIETTO_TESTO"
      },
      {
       "evidence": "E5_POESIA"
      }
     ],
     "pages": [
      {
       "id": "m5.b8c.cmp_ticket_e5.p01",
       "mode": "notebook",
       "text": "(Confronta: la formula incisa nel biglietto ↔ la formula recitata da Gerard)"
      }
     ],
     "effects": [
      {
       "notebook_observation": {
        "id": "m5.obs.ticket_e5",
        "text": "La stessa formula, detta in un letto e incisa in un vagone. Ricorrenza — non ancora identità."
       }
      }
     ],
     "invariant": "nessuna identità di mano/autore; P4B non confermata; M5 completabile senza E5 e senza rimandi pendenti",
     "kind": "comparison",
     "channel": "notebook",
     "interaction_slot": "primary",
     "comparison_completion": "node_commit",
     "result": "RECURRENCE_NOT_IDENTITY",
     "completed_recall": {
      "section": "notes",
      "page": {
       "id": "m5.notebook.cmp_ticket_e5.note_recorded",
       "mode": "notebook",
       "text": "(Questo confronto è già annotato negli Appunti.)"
      }
     }
    },
    {
     "id": "m5_report_intro",
     "beat": "A12",
     "source_section": "M5-B9 (R2: Truman contesta, non confuta)",
     "conditions": [
      {
       "value_set": "m5_final_theory"
      },
      {
       "proposition_path": "P3A.formulation.status",
       "equals": "formulated"
      }
     ],
     "pages": [
      {
       "id": "m5.b9.report.p01",
       "mode": "action",
       "text": "(Truman arriva lungo i binari, col passo di chi non vuole arrivare.)"
      },
      {
       "id": "m5.b9.report.p02",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "Non avete toccato niente. Bene: adesso tocca a me guardare."
      }
     ],
     "pages_by_value": {
      "value": "m5_final_theory",
      "cases": {
       "degeneration": [
        {
         "id": "m5.b9.report.theory_degeneration",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Una lettura: qualcuno aveva fissato un incontro qui. E qualcosa si è rotto."
        },
        {
         "id": "m5.b9.report.contest.p01",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "La polvere, Cooper. L'hai scritta tu: intatta fino al bordo. Cosa la tiene al centro?"
        },
        {
         "id": "m5.b9.report.contest.p02",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Non lo so ancora, Harry. Ho fotografato il bordo, non la risposta."
        },
        {
         "id": "m5.b9.report.contest.p03",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "Allora a verbale vanno i fatti. La lettura resta tua."
        }
       ],
       "staging": [
        {
         "id": "m5.b9.report.theory_staging",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Il centro è stato lasciato così perché venisse letto. Lo firmo io, Harry."
        },
        {
         "id": "m5.b9.report.accept.p01",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "La lettura la verbalizziamo come tua. I fatti come nostri."
        }
       ],
       "open": [
        {
         "id": "m5.b9.report.theory_open",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Ho due letture, Harry, e la scena le regge entrambe. Le porto tutte e due."
        },
        {
         "id": "m5.b9.report.open.p01",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "Due letture, tutte e due a nome tuo. I fatti, uno solo: il nostro."
        }
       ]
      }
     },
     "pages_after_branch": [
      {
       "id": "m5.b9.report.p04",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "(guarda l'anello senza toccarlo) Questo va nella cassaforte delle prove. Stasera."
      },
      {
       "id": "m5.b9.report.p05",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "È l'unico oggetto la cui posizione non riesco ancora a leggere come accidentale. Vorrei poterlo guardare finché non ci riesco."
      }
     ],
     "next": "m5_s1",
     "effects": [],
     "repeat": {
      "id": "m5.repeat.report",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Il vagone è sigillato. Hawk non vede nulla di nuovo. Nemmeno io, per ora."
     },
     "invariant": "condizioni: teoria finale ∧ confronto anello (O2) — Truman cita la polvere solo perché Cooper l'ha scritta; sotto impeto contesta con memoria e non confuta (R2), nessun loop; P3A: presentata ⇔ nodes_done[m5_report_intro], contestata ⇔ m5_final_theory=degeneration, accettata-come-tua ⇔ staging, entrambe ⇔ open (mappatura di stato documentata, nessuna nuova primitiva); già committata con continuation incompleta → riprende next (m5_s1), MAI il repeat; repeat SOLO con east_route_confirmed (repeat_when)",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "actor_id": "truman",
     "target_kind": "actor",
     "target_id": "truman",
     "interaction_slot": "primary",
     "repeat_when": {
      "flag": "east_route_confirmed"
     }
    },
    {
     "id": "m5_s1",
     "beat": "A13",
     "source_section": "M5-B9",
     "prompt": "L'anello: dove va stanotte?",
     "provenance_note": "[N→L] prompt approvato dal revisore (C5-A v1.1 review, 2026-07-23)",
     "choices": [
      {
       "id": "s1_institutional",
       "label": "Cassaforte: custodia istituzionale.",
       "effects": [
        {
         "value": "s1",
         "to": "institutional"
        }
       ],
       "feedback_pages": [
        {
         "id": "m5.b9.s1.institutional.p01",
         "mode": "action",
         "text": "(Cooper fotografa. Truman registra e deposita.)"
        },
        {
         "id": "m5.b9.s1.institutional.p02",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "Quando saprai che cos'è, sarà dove deve essere."
        }
       ],
       "goto": "m5_report_close"
      },
      {
       "id": "s1_documented",
       "label": "Custodia investigativa personale, documentata.",
       "effects": [
        {
         "value": "s1",
         "to": "documented_custody"
        }
       ],
       "feedback_pages": [
        {
         "id": "m5.b9.s1.documented.p01",
         "mode": "action",
         "text": "(Cooper fotografa l'anello sul posto e compila il trasferimento.)"
        },
        {
         "id": "m5.b9.s1.documented.p01b",
         "mode": "action",
         "text": "(Sigilla l'anello in una busta. Firma e la ripone nella tasca interna.)"
        },
        {
         "id": "m5.b9.s1.documented.p02",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "(firma, senza fretta) Metto a verbale che non sono d'accordo. E che ti conosco abbastanza da firmare lo stesso."
        }
       ],
       "goto": "m5_report_close"
      }
     ],
     "invariant": "s1 write-once, mai giudicata; il significato dell'anello non è detto; widget B1 invariato; continuation esplicita: ogni choices[].goto == node.next; letto più tardi da m6_atto4_bridge (R3)",
     "kind": "choice",
     "channel": "internal",
     "exposed": false,
     "completion_when": {
      "value_set": "s1"
     },
     "next": "m5_report_close"
    },
    {
     "id": "m5_report_close",
     "beat": "A13",
     "source_section": "M5-B9 (O3/O11: nessun writer di east_route qui)",
     "pages": [
      {
       "id": "m5.b9.report.p06",
       "mode": "dialogue",
       "speaker_id": "hawk",
       "display_name": "HAWK",
       "text": "(dalla porta) Le impronte non si fermano al vagone. Non te lo dico da qui. Vieni."
      },
      {
       "id": "m5.b9.report.p07",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "Prima che faccia buio. Se il sentiero va dove penso, laggiù il banco lo tiene Renault. Io resto con l'anello e con il verbale."
      }
     ],
     "effects": [],
     "invariant": "NESSUN effetto: east_route_confirmed ha UN solo writer, m5_tracks_north (O3); la riga di Hawk sul cartello vive nel nodo del taglio nord (O11)",
     "kind": "dialogue",
     "channel": "internal",
     "exposed": false,
     "mandatory_beat": true
    },
    {
     "id": "m5_tracks_north_early",
     "beat": "A14 (stub pre-rapporto)",
     "source_section": "scene-contracts S3 §10",
     "conditions": [
      {
       "not": {
        "value_set": "s1"
       }
      }
     ],
     "pages": [
      {
       "id": "m5.a14.early.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Le impronte proseguono. Hawk è ancora alla porta: le impronte aspettano, la luce no. Prima il vagone."
      }
     ],
     "effects": [],
     "repeat": {
      "id": "m5.a14.early.repeat",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Prima il vagone. Poi Hawk mi porta qui."
     },
     "invariant": "condizioni mutuamente esclusive con m5_tracks_north (¬node_done m5_s1); nessun effetto; voce di Cooper, mai rifiuto muto",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "target_kind": "landmark",
     "target_id": "tracks_north",
     "interaction_slot": "primary",
     "mandatory_beat": false
    },
    {
     "id": "m5_tracks_north",
     "beat": "A14",
     "source_section": "act-3-design-report §12 A14 (O3/O8/O11)",
     "conditions": [
      {
       "value_set": "s1"
      }
     ],
     "pages": [
      {
       "id": "m5.a14.tracks.p01",
       "mode": "action",
       "text": "(Le impronte vecchie passano l'angolo del vagone ed entrano nel taglio fra gli alberi. Accanto, il cartello.)"
      },
      {
       "id": "m5.a14.tracks.p02",
       "mode": "dialogue",
       "speaker_id": "hawk",
       "display_name": "HAWK",
       "text": "Dal cartello in poi il sentiero non serve altre proprietà. Un'ora di cammino. Finisce a One Eyed Jacks."
      },
      {
       "id": "m5.a14.tracks.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Chi tiene il banco, allora. Cominciamo da lui."
      }
     ],
     "effects": [
      {
       "evidence": "E_TRACCE_EST"
      },
      {
       "set": "east_route_confirmed"
      },
      {
       "notebook": {
        "id": "m5.note.tracks_north",
        "text": "Le impronte passano il vagone ed entrano nel taglio a nord. Dal cartello in poi, una sola proprietà: One Eyed Jacks."
       }
      }
     ],
     "invariant": "UNICO writer di east_route_confirmed e di E_TRACCE_EST; aggiunge SOLO il fatto specifico del vagone, mai «nessuna torna indietro» (O8); la porta oej si apre solo dopo questa camminata",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "target_kind": "landmark",
     "target_id": "tracks_north",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m5_hawk_cut",
     "beat": "A14",
     "source_section": "scene-contracts S1/S2/S3 (Hawk fuori dal vagone)",
     "conditions": [
      {
       "value_set": "s1"
      }
     ],
     "pages": [
      {
       "id": "m5.hawk.hawk_cut.p01",
       "mode": "dialogue",
       "speaker_id": "hawk",
       "display_name": "HAWK",
       "text": "Guarda per terra, non il cartello. Le impronte passano il vagone e salgono."
      },
      {
       "id": "m5.hawk.hawk_cut.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Un'ora. Stasera senza luce, o domani con la luce e con un banco già chiuso."
      }
     ],
     "effects": [],
     "repeat": {
      "id": "m5.hawk.hawk_cut.repeat",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Hawk viene fino alla riva. Dalla riva in poi, io."
     },
     "invariant": "riga di collocazione (sprite hawk_cut), nessun effetto e NESSUN writer di east_route_confirmed (solo m5_tracks_north); la riva, non la stanza (pagato in m6.b1.ferry.p04)",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "actor_id": "hawk_cut",
     "target_kind": "actor",
     "target_id": "hawk_cut",
     "interaction_slot": "primary",
     "mandatory_beat": false
    },
    {
     "id": "m5_sign_oej",
     "beat": "A14",
     "source_section": "M5-B9",
     "optional": true,
     "conditions": [
      {
       "flag": "east_route_confirmed"
      }
     ],
     "pages": [
      {
       "id": "m5.sign_oej.p01",
       "mode": "action",
       "text": "\"ONE EYED JACKS — oltre il confine\". Una freccia indica il sentiero a nord."
      },
      {
       "id": "m5.sign_oej.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Una freccia oltre confine non è una prova. È però un invito geograficamente molto preciso."
      }
     ],
     "effects": [],
     "invariant": "[P] cartello fisico dal repository; nessuna prova collega il cartello a Jacques",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "traincar",
     "target_kind": "sign",
     "target_id": "sign_oej",
     "interaction_slot": "primary"
    }
   ],
   "node_count": {
    "runtime_total": 21
   }
  };
  D.missions.M6 = {
   "narrative_package": "narrative-v1.0",
   "mission": "M6",
   "title": "One Eyed Jacks",
   "source": {
    "document": "M5-M6 v1.1.1 LOCK.md",
    "package": "narrative-v1.0"
   },
   "schema_delta": "narrative/schema-deltas/M6.md",
   "entry_condition": {
    "flag": "east_route_confirmed"
   },
   "tactic": {
    "value": "m6_tactic",
    "domain": "m6_tactic",
    "chosen_in": "m6_tactic",
    "write_once": true,
    "note": "Una sola tattica per playthrough (immutabile). Valore tipizzato come m5_theory; il cambio tattica (m6_tactic_changed) resta DEPRECATO e non compare mai."
   },
   "tactic_differentiation": {
    "axes": [
     "exclusive_questions",
     "jacques_tactic",
     "own_verifiable_info",
     "specific_resource",
     "admission_form",
     "persistent_cost",
     "future_echo"
    ],
    "by_tactic": {
     "prova": {
      "node": "m6_interrogation_prova",
      "exclusive_questions": [
       "m6.b5.prova.q1",
       "m6.b5.prova.q2"
      ],
      "jacques_tactic": "rifiuta la firma; rimanda a un avvocato e al foglio",
      "own_verifiable_info": "JACQUES_MIDNIGHT_CLAIM",
      "specific_resource": "l'orario dichiarato: il merci di mezzanotte, verificabile ai binari",
      "admission_form": "dichiarazione resa, NON firmata",
      "persistent_cost": "i termini della dichiarazione mai formalizzati (nessun flag: la nota del taccuino è l'unica traccia)",
      "future_echo": "M9: l'orario restringe la finestra della notte — utilizzabile senza identificare nessuno"
     },
     "pressione": {
      "node": "m6_interrogation_pressione",
      "exclusive_questions": [
       "m6.b5.pressione.q1",
       "m6.b5.pressione.q2"
      ],
      "jacques_tactic": "annega il nome in una lista di quattro figure",
      "own_verifiable_info": "JACQUES_LIST_GIVEN",
      "specific_resource": "quattro figure e la voce che cala sui fiammiferi",
      "admission_form": "ammissione dentro la protesta: «quella notte c'ero»",
      "persistent_cost": "QUALE figura contava: la scrematura mai fatta",
      "future_echo": "M10: chi «accende e spegne senza fumare» torna riconoscibile nella confessione — mai probatoria"
     },
     "falsa_sicurezza": {
      "node": "m6_interrogation_falsa",
      "exclusive_questions": [
       "m6.b5.falsa.q1",
       "m6.b5.falsa.q2"
      ],
      "jacques_tactic": "si vanta del banco e si colloca da solo",
      "own_verifiable_info": "JACQUES_THIRD_MAN_DETAIL",
      "specific_resource": "il terzo uomo che guardava la stufa «come si guarda una persona»",
      "admission_form": "il vanto che lo colloca: «anche al vagone... il banco era mio»",
      "persistent_cost": "il significato dello sguardo: l'interprete è morto",
      "future_echo": "M10: la ricorrenza comportamentale nell'affioramento — evocativa, proceduralmente muta"
     }
    },
    "invariant": "i tre rami differiscono REALMENTE sui 7 assi (pairwise distinti); own_verifiable_info == l'evidenza scritta dal nodo; tutti scrivono jacques_admitted_presence, mai l'omicidio"
   },
   "milestones": [
    {
     "id": "milestone_p5",
     "node": "m6_p5",
     "pending_when": {
      "flag": "jacques_admitted_presence"
     },
     "resolved_when": {
      "proposition_path": "P5.formulation.status",
      "equals": "formulated"
     },
     "blocks": {
      "kind": "node_prepare",
      "nodes": [
       "m6_arrest"
      ]
     }
    }
   ],
   "completion": {
    "when": {
     "node_done": "m6_atto4_bridge"
    },
    "sets": []
   },
   "objectives": [
    {
     "id": "obj_m6_5",
     "priority": 500,
     "when": {
      "all": [
       {
        "flag": "jacques_dead"
       },
       {
        "not": {
         "flag": "gigante1"
        }
       }
      ]
     },
     "text": "Torna alla stanza 315.",
     "provenance_note": "[L] testo esatto del Lock §5 B8"
    },
    {
     "id": "obj_m6_6",
     "priority": 600,
     "when": {
      "all": [
       {
        "flag": "jacques_dead"
       },
       {
        "flag": "gigante1"
       },
       {
        "not": {
         "flag": "atto4"
        }
       }
      ]
     },
     "text": "Riferisci a Truman ciò che hai visto nella 315.",
     "provenance_note": "[P/N] ponte eseguibile da data.js truman_atto4: dopo il Gigante, Truman deve ricevere sia la visione sia la notizia di Jacques prima che M8 entri."
    },
    {
     "id": "obj_m6_3b",
     "priority": 350,
     "when": {
      "all": [
       {
        "flag": "jacques_preso"
       },
       {
        "not": {
         "flag": "jacques_dead"
        }
       },
       {
        "not": {
         "node_done": "m6_hospital_guard"
        }
       }
      ]
     },
     "text": "Passa dall'ospedale: Renault è piantonato.",
     "provenance_note": "[N] M6 stitch C2c: la battuta di Truman («Domattina l'ospedale, con il foglio») diventa un passaggio fisico obbligatorio; l'obiettivo orienta al registro di turno prima del rapporto notturno."
    },
    {
     "id": "obj_m6_4",
     "priority": 400,
     "when": {
      "all": [
       {
        "flag": "jacques_preso"
       },
       {
        "not": {
         "flag": "jacques_dead"
        }
       },
       {
        "node_done": "m6_hospital_guard"
       },
       {
        "not": {
         "node_done": "m6_return_night"
        }
       }
      ]
     },
     "text": "Torna alla centrale e chiudi il rapporto sul fermo di Renault.",
     "provenance_note": "[N] orientamento fisico verso la root Truman che rende B7b; il testo Lock sull'ospedale resta nella battuta di Truman."
    },
    {
     "id": "obj_m6_4b",
     "priority": 450,
     "when": {
      "all": [
       {
        "flag": "jacques_preso"
       },
       {
        "node_done": "m6_return_night"
       },
       {
        "not": {
         "flag": "jacques_dead"
        }
       }
      ]
     },
     "text": "Vai da Lucy: l'ospedale è in linea.",
     "provenance_note": "[N] orientamento fisico verso la root Lucy che consegna B8; lo squillo e la risposta sono già visibili alla fine del rapporto, quindi la chiamata esiste nel mondo prima dell'interazione."
    },
    {
     "id": "obj_m6_3",
     "priority": 300,
     "when": {
      "all": [
       {
        "proposition_path": "P5.formulation.status",
        "equals": "formulated"
       },
       {
        "not": {
         "flag": "jacques_preso"
        }
       }
      ]
     },
     "text": "Accompagna Jacques oltre il fiume per formalizzare la dichiarazione.",
     "provenance_note": "[N] derivato dalla catena d'arresto B7 (non verbalizzato come obiettivo nel Lock); testo corretto in C6-A.2 su nota del revisore — il fermo avviene solo DOPO l'attraversamento volontario e il tentativo di fuga, l'obiettivo non deve anticiparlo"
    },
    {
     "id": "obj_m6_2",
     "priority": 200,
     "when": {
      "all": [
       {
        "flag": "jacques_admitted_presence"
       },
       {
        "not": {
         "proposition_path": "P5.formulation.status",
         "equals": "formulated"
        }
       }
      ]
     },
     "text": "Metti a fuoco che cosa puoi sostenere su Jacques.",
     "provenance_note": "[N] derivato dal beat P5 B6b (non verbalizzato come obiettivo nel Lock)"
    },
    {
     "id": "obj_m6_1",
     "priority": 100,
     "when": {
      "not": {
       "flag": "jacques_admitted_presence"
      }
     },
     "text": "One Eyed Jacks: siediti al tavolo di Jacques Renault.",
     "provenance_note": "[N] obiettivo d'ingresso M6 (il Lock M5 lascia «Segui la rotta oltre il confine: One Eyed Jacks.»)"
    }
   ],
   "nodes": [
    {
     "id": "m6_ferry",
     "beat": "B1-B2",
     "source_section": "M6-B1-B2",
     "conditions": [
      {
       "not": {
        "node_done": "m6_ferry"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b1.ferry.p01",
       "mode": "action",
       "text": "(Il traghetto attraversa senza registro.)"
      },
      {
       "id": "m6.b1.ferry.p02",
       "mode": "action",
       "text": "(Dentro, nessuno guarda Cooper.)"
      },
      {
       "id": "m6.b1.ferry.p03",
       "mode": "action",
       "text": "(Jacques controlla la passerella prima del mazzo.)"
      },
      {
       "id": "m6.b1.ferry.p04",
       "mode": "dialogue",
       "speaker_id": "hawk",
       "display_name": "HAWK",
       "text": "(fuori, piano) Io resto qui. Se chiudono il molo, restiamo dentro."
      },
      {
       "id": "m6.b1.ferry.p05",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Tieni libera la passerella. Io vado al tavolo."
      }
     ],
     "effects": [],
     "next": "m6_tactic",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "oej",
     "target_kind": "actor",
     "target_id": "jacques",
     "actor_id": "jacques",
     "interaction_slot": "primary",
     "mandatory_beat": true,
     "provenance_note": "[P] Jacques è attore reale e visibile a One Eyed Jacks; [N→L] il beat d'ingresso parte dalla prima interazione con lui e continua nello stesso lease verso la scelta della tattica. Nessun tile invisibile obbligatorio."
    },
    {
     "id": "m6_audrey",
     "beat": "B3",
     "source_section": "M6-B3",
     "optional": true,
     "conditions": [
      {
       "flag": "audrey_indaga"
      },
      {
       "node_done": "m6_ferry"
      },
      {
       "not": {
        "flag": "audrey_vista_oej"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b3.audrey.p01",
       "mode": "dialogue",
       "speaker_id": "audrey",
       "display_name": "AUDREY",
       "text": "(a bassa voce, senza voltarsi) Non mi saluti. Sono la nuova del guardaroba, e lei non mi ha mai vista."
      },
      {
       "id": "m6.b3.audrey.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(senza voltarsi) La nuova del guardaroba esce da quella porta entro dieci minuti. Ci vediamo dal lato giusto del fiume."
      }
     ],
     "effects": [
      {
       "set": "audrey_vista_oej"
      }
     ],
     "invariant": "solo con audrey_indaga; unico writer di audrey_vista_oej; M6 completabile senza (nodo facoltativo)",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "oej",
     "target_kind": "actor",
     "target_id": "audrey",
     "actor_id": "audrey",
     "interaction_slot": "primary"
    },
    {
     "id": "m6_tactic",
     "beat": "B4",
     "source_section": "M6-B4",
     "prompt": "Quale metodo usi con Jacques?",
     "conditions": [
      {
       "node_done": "m6_ferry"
      },
      {
       "not": {
        "value_set": "m6_tactic"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b4.tactic.p01",
       "mode": "action",
       "text": "(Jacques mescola. Il posto di fronte a lui è vuoto: un invito e una trappola.)"
      },
      {
       "id": "m6.b4.tactic.p02",
       "mode": "action",
       "text": "(Jacques spinge il mazzo al centro del tavolo.)"
      },
      {
       "id": "m6.b4.tactic.cards_recall",
       "mode": "action",
       "condition": {
        "evidence": "E_CARTE"
       },
       "text": "(Il mazzo è tagliato squadrato, di piatto. Come le carte sotto il sedile, nel vagone.)"
      },
      {
       "id": "m6.b4.tactic.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Jacques. Prima di cominciare, il mazzo resta sul tavolo."
      }
     ],
     "choices": [
      {
       "id": "tactic_prova",
       "label": "Prova.",
       "effects": [
        {
         "value": "m6_tactic",
         "to": "prova"
        }
       ],
       "goto": "m6_interrogation_prova"
      },
      {
       "id": "tactic_pressione",
       "label": "Pressione.",
       "effects": [
        {
         "value": "m6_tactic",
         "to": "pressione"
        }
       ],
       "goto": "m6_interrogation_pressione"
      },
      {
       "id": "tactic_falsa_sicurezza",
       "label": "Falsa sicurezza.",
       "effects": [
        {
         "value": "m6_tactic",
         "to": "falsa_sicurezza"
        }
       ],
       "goto": "m6_interrogation_falsa"
      }
     ],
     "invariant": "unico writer di m6_tactic; scelta write-once, una per playthrough; nessuna opzione marcata corretta; nessun cambio tattica",
     "kind": "choice",
     "channel": "world",
     "map_id": "oej",
     "target_kind": "actor",
     "target_id": "jacques",
     "actor_id": "jacques",
     "interaction_slot": "primary",
     "role": "tactic",
     "completion_when": {
      "value_set": "m6_tactic"
     }
    },
    {
     "id": "m6_interrogation_prova",
     "beat": "B5-B6",
     "source_section": "M6-PROVA",
     "conditions": [
      {
       "value_is": {
        "name": "m6_tactic",
        "equals": "prova"
       }
      },
      {
       "not": {
        "flag": "jacques_admitted_presence"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b5.prova.q1",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(si siede, posa la foto del biglietto) Questo passava di mano, al vagone. La tua?",
       "question": {
        "exclusive": true
       }
      },
      {
       "id": "m6.b5.prova.p02",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "(la guarda a lungo, poi la gira a faccia in giù) Io porto le carte, non i messaggi."
      },
      {
       "id": "m6.b5.prova.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Non ho chiesto dei messaggi. Ho chiesto del vagone."
      },
      {
       "id": "m6.b5.prova.p04",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "C'ero. Giocavamo. Questo è tutto quello che dico."
      },
      {
       "id": "m6.b5.prova.p05",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "Se volete una firma, portatemi un avvocato e riportatemi il foglio."
      },
      {
       "id": "m6.b5.prova.q2",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(seconda domanda) A che ora te ne sei andato?",
       "question": {
        "exclusive": true
       }
      },
      {
       "id": "m6.b5.prova.p07",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "Col merci di mezzanotte. Chiedete ai binari, se sanno l'ora."
      },
      {
       "id": "m6.b5.prova.p08",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "E chi restava, quando il merci è passato?",
       "question": {
        "exclusive": false,
        "color": true
       }
      },
      {
       "id": "m6.b5.prova.p09",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "(mescola) L'avvocato, agente. Poi il foglio. Poi vediamo chi restava."
      }
     ],
     "effects": [
      {
       "set": "jacques_admitted_presence"
      },
      {
       "evidence": "JACQUES_MIDNIGHT_CLAIM"
      },
      {
       "notebook": {
        "id": "m6.note.prova.admission",
        "text": "Jacques ammette la presenza al vagone. Dichiarazione resa, NON firmata."
       }
      },
      {
       "notebook": {
        "id": "m6.note.prova.midnight",
        "text": "L'orario dichiarato: il merci di mezzanotte. Verificabile ai binari."
       }
      },
      {
       "notebook": {
        "id": "m6.note.prova.negotiate",
        "text": "Oltre l'orario non va. Vuole negoziare la dichiarazione: termini suoi, foglio davanti."
       }
      }
     ],
     "invariant": "ammissione di PRESENZA (mai omicidio); scrive jacques_admitted_presence + JACQUES_MIDNIGHT_CLAIM; 2 domande esclusive (q1,q2) + 1 di colore; effetti SOLO dopo l'ultima pagina",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "oej",
     "target_kind": "actor",
     "target_id": "jacques",
     "actor_id": "jacques",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m6_interrogation_pressione",
     "beat": "B5-B6",
     "source_section": "M6-PRESSIONE",
     "conditions": [
      {
       "value_is": {
        "name": "m6_tactic",
        "equals": "pressione"
       }
      },
      {
       "not": {
        "flag": "jacques_admitted_presence"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b5.pressione.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(resta in piedi) Jacques Renault. Stanotte dormi dal lato giusto del fiume. Quanto comoda sarà la cella, dipende dai prossimi due minuti."
      },
      {
       "id": "m6.b5.pressione.p02",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "(alza le mani, ride male) Piano, agente. Piano. Quella notte al vagone c'ero, sì — ma c'era mezzo mondo."
      },
      {
       "id": "m6.b5.pressione.q1",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "I nomi del mezzo mondo. Adesso.",
       "question": {
        "exclusive": true
       }
      },
      {
       "id": "m6.b5.pressione.p04",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "Il camionista della birra, quello del Roadhouse. Il barista, quello nuovo. Un ragazzo del paese che non nomino — ha una madre. E quello dei fiammiferi."
      },
      {
       "id": "m6.b5.pressione.p05",
       "mode": "action",
       "text": "(Sulla parola \"fiammiferi\" la voce cala. Le mani smettono di muoversi.)"
      },
      {
       "id": "m6.b5.pressione.p06",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Quello dei fiammiferi."
      },
      {
       "id": "m6.b5.pressione.p07",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "Uno che accendeva e spegneva. Accendeva e spegneva. Senza mai fumare."
      },
      {
       "id": "m6.b5.pressione.q2",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(seconda domanda) Chi dei quattro c'era QUELLA notte?",
       "question": {
        "exclusive": true
       }
      },
      {
       "id": "m6.b5.pressione.p09",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "(le mani ferme) Quella notte... (si riprende) Quella notte io tenevo il banco e guardavo le carte. Le facce, chiedetele alle carte."
      }
     ],
     "effects": [
      {
       "set": "jacques_admitted_presence"
      },
      {
       "evidence": "JACQUES_LIST_GIVEN"
      },
      {
       "notebook": {
        "id": "m6.note.pressione.admission",
        "text": "L'ammissione arriva dentro la protesta: \"quella notte c'ero\"."
       }
      },
      {
       "notebook": {
        "id": "m6.note.pressione.list",
        "text": "Possibile copertura: quattro figure. Sui fiammiferi la voce cala; le mani si fermano."
       }
      },
      {
       "notebook": {
        "id": "m6.note.pressione.narrow",
        "text": "Alla domanda giusta ha esitato. Restringere la lista si può — ma non oggi, non urlando. Servirà tornarci con calma."
       }
      }
     ],
     "invariant": "ammissione di PRESENZA (mai omicidio); scrive jacques_admitted_presence + JACQUES_LIST_GIVEN; 2 domande esclusive (q1,q2); il sistema NON certifica quale figura sia vera; effetti SOLO dopo l'ultima pagina",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "oej",
     "target_kind": "actor",
     "target_id": "jacques",
     "actor_id": "jacques",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m6_interrogation_falsa",
     "beat": "B5-B6",
     "source_section": "M6-FALSA_SICUREZZA",
     "conditions": [
      {
       "value_is": {
        "name": "m6_tactic",
        "equals": "falsa_sicurezza"
       }
      },
      {
       "not": {
        "flag": "jacques_admitted_presence"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b5.falsa.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(si siede, posa due fiches) Mi hanno detto che il banco qui perde volentieri, con chi sa stare al tavolo."
      },
      {
       "id": "m6.b5.falsa.p02",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "(ride) Chi gliel'ha detto sapeva stare al tavolo?"
      },
      {
       "id": "m6.b5.falsa.q1",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Che tavolo era, quella notte? Chi teneva il banco?",
       "question": {
        "exclusive": true
       }
      },
      {
       "id": "m6.b5.falsa.p04",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "Io. Io tengo sempre il banco — anche fuori di qui. Anche al vagone si giocava, quella notte, e il banco era mio."
      },
      {
       "id": "m6.b5.falsa.q2",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(seconda domanda) E il terzo? Quello che non giocava.",
       "question": {
        "exclusive": true
       }
      },
      {
       "id": "m6.b5.falsa.p06",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "(la risata cala) Non beveva. Guardava la stufa come si guarda una persona. (pausa) Io i tipi così li lascio guardare."
      },
      {
       "id": "m6.b5.falsa.p07",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Che cosa guardava, secondo te?",
       "question": {
        "exclusive": false,
        "color": true
       }
      },
      {
       "id": "m6.b5.falsa.p08",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "(raccoglie le fiches) Questa è una domanda da tavolo alto, agente. Si gioca un'altra sera."
      }
     ],
     "effects": [
      {
       "set": "jacques_admitted_presence"
      },
      {
       "evidence": "JACQUES_THIRD_MAN_DETAIL"
      },
      {
       "notebook": {
        "id": "m6.note.falsa.admission",
        "text": "Il vanto lo colloca: \"anche al vagone... il banco era mio\"."
       }
      },
      {
       "notebook": {
        "id": "m6.note.falsa.third_man",
        "text": "Il terzo uomo — non beveva, guardava la stufa \"come si guarda una persona\"."
       }
      },
      {
       "notebook": {
        "id": "m6.note.falsa.gaze",
        "text": "Sarebbe tornato a parlare, da giocatore a giocatore. Il senso di quello sguardo lo sa solo chi l'ha visto."
       }
      }
     ],
     "invariant": "ammissione di PRESENZA (mai omicidio); scrive jacques_admitted_presence + JACQUES_THIRD_MAN_DETAIL; 2 domande esclusive (q1,q2) + 1 di colore; effetti SOLO dopo l'ultima pagina",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "oej",
     "target_kind": "actor",
     "target_id": "jacques",
     "actor_id": "jacques",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m6_cmp_cards_prova",
     "beat": "B4c",
     "source_section": "M6-B4c",
     "optional": true,
     "prompt": "Stesso taglio. Che cosa collega?",
     "conditions": [
      {
       "evidence": "E_CARTE"
      },
      {
       "evidence": "JACQUES_MIDNIGHT_CLAIM"
      },
      {
       "flag": "jacques_admitted_presence"
      }
     ],
     "pages": [
      {
       "id": "m6.b4c.cmp_cards.prova.p01",
       "mode": "notebook",
       "text": "Carte sotto il sedile del vagone; il mazzo di Jacques al tavolo. Taglio squadrato in entrambi."
      }
     ],
     "choices": [
      {
       "id": "cards_hand",
       "label": "La stessa mano teneva il banco lì e qui.",
       "result": "PRESENCE_STRENGTHENED",
       "effects": [
        {
         "notebook": {
          "id": "m6.note.cards_bank.prova",
          "text": "Il taglio del mazzo è lo stesso, al vagone e al tavolo. Jacques al vagone: sostenuto due volte."
         }
        }
       ],
       "feedback_pages": [
        {
         "id": "m6.b4c.cmp_cards.prova.feedback.hand",
         "mode": "notebook",
         "text": "(Cooper allinea le due annotazioni. Una mano, due tavoli.)"
        }
       ]
      },
      {
       "id": "cards_killer",
       "label": "Le carte dicono che ha ucciso lui.",
       "result": "ATTRIBUTION_OVERREACH",
       "retry": true,
       "feedback_pages": [
        {
         "id": "m6.b4c.cmp_cards.prova.feedback.killer",
         "mode": "notebook",
         "text": "Le carte collocano una mano a un tavolo. Non a un corpo."
        }
       ]
      }
     ],
     "rules": {
      "attempt_scope": "comparison",
      "hide_attempted_results": false,
      "track_assistance": false
     },
     "invariant": "PRESENZA ≠ PATERNITÀ: il confronto NON formula mai P5 (m6_p5 resta l'unico formulatore); nessun flag, sola annotazione (upsert per id, idempotente); tre nodi mutuamente esclusivi, uno per testimonianza di ramo. hide_attempted_results FALSE di proposito: senza una scelta che formula una proposizione il runtime non marca mai `completed` un confronto, e nascondere i risultati già tentati lascerebbe l'interazione MUTA alla seconda visita; così le due letture restano sempre riconsultabili e la coppia non risponde mai «nessun filo».",
     "kind": "comparison",
     "channel": "notebook",
     "interaction_slot": "primary",
     "completed_recall": {
      "section": "propositions",
      "page": {
       "id": "m6.notebook.cmp_cards.prova.already_recorded",
       "mode": "notebook",
       "text": "(Questo nesso è già registrato nelle Proposizioni.)"
      }
     }
    },
    {
     "id": "m6_cmp_cards_pressione",
     "beat": "B4c",
     "source_section": "M6-B4c",
     "optional": true,
     "prompt": "Stesso taglio. Che cosa collega?",
     "conditions": [
      {
       "evidence": "E_CARTE"
      },
      {
       "evidence": "JACQUES_LIST_GIVEN"
      },
      {
       "flag": "jacques_admitted_presence"
      }
     ],
     "pages": [
      {
       "id": "m6.b4c.cmp_cards.pressione.p01",
       "mode": "notebook",
       "text": "Carte sotto il sedile del vagone; il mazzo di Jacques al tavolo. Taglio squadrato in entrambi."
      }
     ],
     "choices": [
      {
       "id": "cards_hand",
       "label": "La stessa mano teneva il banco lì e qui.",
       "result": "PRESENCE_STRENGTHENED",
       "effects": [
        {
         "notebook": {
          "id": "m6.note.cards_bank.pressione",
          "text": "Il taglio del mazzo è lo stesso, al vagone e al tavolo. Jacques al vagone: sostenuto due volte."
         }
        }
       ],
       "feedback_pages": [
        {
         "id": "m6.b4c.cmp_cards.pressione.feedback.hand",
         "mode": "notebook",
         "text": "(Cooper allinea le due annotazioni. Una mano, due tavoli.)"
        }
       ]
      },
      {
       "id": "cards_killer",
       "label": "Le carte dicono che ha ucciso lui.",
       "result": "ATTRIBUTION_OVERREACH",
       "retry": true,
       "feedback_pages": [
        {
         "id": "m6.b4c.cmp_cards.pressione.feedback.killer",
         "mode": "notebook",
         "text": "Le carte collocano una mano a un tavolo. Non a un corpo."
        }
       ]
      }
     ],
     "rules": {
      "attempt_scope": "comparison",
      "hide_attempted_results": false,
      "track_assistance": false
     },
     "invariant": "PRESENZA ≠ PATERNITÀ: il confronto NON formula mai P5 (m6_p5 resta l'unico formulatore); nessun flag, sola annotazione (upsert per id, idempotente); tre nodi mutuamente esclusivi, uno per testimonianza di ramo. hide_attempted_results FALSE di proposito: senza una scelta che formula una proposizione il runtime non marca mai `completed` un confronto, e nascondere i risultati già tentati lascerebbe l'interazione MUTA alla seconda visita; così le due letture restano sempre riconsultabili e la coppia non risponde mai «nessun filo».",
     "kind": "comparison",
     "channel": "notebook",
     "interaction_slot": "primary",
     "completed_recall": {
      "section": "propositions",
      "page": {
       "id": "m6.notebook.cmp_cards.pressione.already_recorded",
       "mode": "notebook",
       "text": "(Questo nesso è già registrato nelle Proposizioni.)"
      }
     }
    },
    {
     "id": "m6_cmp_cards_falsa",
     "beat": "B4c",
     "source_section": "M6-B4c",
     "optional": true,
     "prompt": "Stesso taglio. Che cosa collega?",
     "conditions": [
      {
       "evidence": "E_CARTE"
      },
      {
       "evidence": "JACQUES_THIRD_MAN_DETAIL"
      },
      {
       "flag": "jacques_admitted_presence"
      }
     ],
     "pages": [
      {
       "id": "m6.b4c.cmp_cards.falsa.p01",
       "mode": "notebook",
       "text": "Carte sotto il sedile del vagone; il mazzo di Jacques al tavolo. Taglio squadrato in entrambi."
      }
     ],
     "choices": [
      {
       "id": "cards_hand",
       "label": "La stessa mano teneva il banco lì e qui.",
       "result": "PRESENCE_STRENGTHENED",
       "effects": [
        {
         "notebook": {
          "id": "m6.note.cards_bank.falsa",
          "text": "Il taglio del mazzo è lo stesso, al vagone e al tavolo. Jacques al vagone: sostenuto due volte."
         }
        }
       ],
       "feedback_pages": [
        {
         "id": "m6.b4c.cmp_cards.falsa.feedback.hand",
         "mode": "notebook",
         "text": "(Cooper allinea le due annotazioni. Una mano, due tavoli.)"
        }
       ]
      },
      {
       "id": "cards_killer",
       "label": "Le carte dicono che ha ucciso lui.",
       "result": "ATTRIBUTION_OVERREACH",
       "retry": true,
       "feedback_pages": [
        {
         "id": "m6.b4c.cmp_cards.falsa.feedback.killer",
         "mode": "notebook",
         "text": "Le carte collocano una mano a un tavolo. Non a un corpo."
        }
       ]
      }
     ],
     "rules": {
      "attempt_scope": "comparison",
      "hide_attempted_results": false,
      "track_assistance": false
     },
     "invariant": "PRESENZA ≠ PATERNITÀ: il confronto NON formula mai P5 (m6_p5 resta l'unico formulatore); nessun flag, sola annotazione (upsert per id, idempotente); tre nodi mutuamente esclusivi, uno per testimonianza di ramo. hide_attempted_results FALSE di proposito: senza una scelta che formula una proposizione il runtime non marca mai `completed` un confronto, e nascondere i risultati già tentati lascerebbe l'interazione MUTA alla seconda visita; così le due letture restano sempre riconsultabili e la coppia non risponde mai «nessun filo».",
     "kind": "comparison",
     "channel": "notebook",
     "interaction_slot": "primary",
     "completed_recall": {
      "section": "propositions",
      "page": {
       "id": "m6.notebook.cmp_cards.falsa.already_recorded",
       "mode": "notebook",
       "text": "(Questo nesso è già registrato nelle Proposizioni.)"
      }
     }
    },
    {
     "id": "m6_p5",
     "beat": "B6b",
     "source_section": "M6-B6b",
     "prompt": "Che cosa puoi sostenere?",
     "milestone": "milestone_p5",
     "conditions": [
      {
       "flag": "jacques_admitted_presence"
      }
     ],
     "pages": [
      {
       "id": "m6.b6b.p5.p01",
       "mode": "notebook",
       "text": "Ammissione registrata: Jacques era al vagone."
      }
     ],
     "choices": [
      {
       "id": "p5_present",
       "label": "Jacques era presente al vagone.",
       "result": "PRESENCE_SUPPORTED",
       "effects": [
        {
         "proposition": "P5",
         "to": "formulated",
         "created_from": [
          "jacques_admitted_presence"
         ]
        }
       ],
       "feedback_pages": [
        {
         "id": "m6.b6b.p5.feedback.present",
         "mode": "notebook",
         "text": "Jacques può essere collocato sulla scena. La sua presenza non basta ad attribuirgli l'omicidio."
        }
       ]
      },
      {
       "id": "p5_killed",
       "label": "Jacques ha ucciso Laura.",
       "result": "ATTRIBUTION_OVERREACH",
       "retry": true,
       "feedback_pages": [
        {
         "id": "m6.b6b.p5.feedback.killed",
         "mode": "notebook",
         "text": "Le prove collocano. Non attribuiscono."
        }
       ]
      },
      {
       "id": "p5_no_third_man",
       "label": "Jacques non sa nulla del terzo uomo.",
       "result": "UNSUPPORTED_BY_TACTIC",
       "retry": true,
       "feedback_pages_by_value": {
        "value": "m6_tactic",
        "cases": {
         "prova": [
          {
           "id": "m6.b6b.p5.feedback.no_third.prova",
           "mode": "notebook",
           "text": "Non posso sostenerlo. Non gli ho ancora chiesto di un terzo uomo."
          }
         ],
         "pressione": [
          {
           "id": "m6.b6b.p5.feedback.no_third.pressione",
           "mode": "notebook",
           "text": "Sa di altre presenze e prova a nasconderle in una lista. Non so ancora quale fosse al vagone."
          }
         ],
         "falsa_sicurezza": [
          {
           "id": "m6.b6b.p5.feedback.no_third.falsa",
           "mode": "notebook",
           "text": "Ha descritto il terzo uomo. Questa conclusione contraddice ciò che ha appena detto."
          }
         ]
        }
       }
      }
     ],
     "rules": {
      "attempt_scope": "comparison",
      "hide_attempted_results": true,
      "track_assistance": false
     },
     "invariant": "P5 nasce SOLO da questo beat (mai automatica); A accettata (formulata da jacques_admitted_presence), B respinta nel merito, C respinta con testo per-ramo; nessuna scelta marcata corretta; tentativi in comparisons[node].attempts",
     "kind": "choice",
     "channel": "notebook",
     "interaction_slot": "primary",
     "role": "proposition",
     "completion_when": {
      "proposition_path": "P5.formulation.status",
      "equals": "formulated"
     },
     "next": "m6_arrest"
    },
    {
     "id": "m6_arrest",
     "beat": "B7",
     "source_section": "M6-B7",
     "conditions": [
      {
       "proposition_path": "P5.formulation.status",
       "equals": "formulated"
      },
      {
       "not": {
        "flag": "jacques_preso"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b7.arrest.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Metti per iscritto ciò che hai ammesso. Con un avvocato, se lo vuoi."
      },
      {
       "id": "m6.b7.arrest.p02",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "E se dico di no?"
      },
      {
       "id": "m6.b7.arrest.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Allora torneremo con più domande e meno discrezione."
      },
      {
       "id": "m6.b7.arrest.p04",
       "mode": "action",
       "text": "(Jacques guarda la sala. Poi raccoglie il cappotto.)"
      },
      {
       "id": "m6.b7.arrest.p05",
       "mode": "dialogue",
       "speaker_id": "jacques",
       "display_name": "JACQUES",
       "text": "Un foglio. Poi torno. (al traghetto) Il fiume ha due lati, agente. Ricordatevelo quando lo riattraversate."
      },
      {
       "id": "m6.b7.arrest.p06",
       "mode": "action",
       "text": "(Sul molo della contea, Jacques spinge Hawk e prova a correre. Il piede scivola fra due assi.)"
      },
      {
       "id": "m6.b7.arrest.p07",
       "mode": "action",
       "text": "(Jacques cade fra le assi. Quando Hawk lo gira, la gamba non segue.)"
      }
     ],
     "effects": [
      {
       "set": "jacques_preso"
      },
      {
       "notebook": {
        "id": "m6.note.arrest",
        "text": "Fermo sul lato della contea, dopo il tentativo di fuga. Renault in ospedale per la frattura, piantonato. La dichiarazione si formalizza domattina."
       }
      }
     ],
     "invariant": "catena: colloquio → uscita controllata → attraversamento volontario → fermo lato contea → tentativo di fuga/ferimento → ricovero; unico writer di jacques_preso; nessuna attribuzione dell'omicidio",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "oej",
     "target_kind": "actor",
     "target_id": "jacques",
     "actor_id": "jacques",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m6_hospital_guard",
     "beat": "B7c",
     "source_section": "M6-B7c",
     "conditions": [
      {
       "flag": "jacques_preso"
      },
      {
       "not": {
        "flag": "jacques_dead"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b7c.guard.p01",
       "mode": "action",
       "text": "(Fine visite. In fondo al reparto, davanti a una porta chiusa, un agente della contea su una sedia. Non legge.)"
      },
      {
       "id": "m6.b7c.guard.p02",
       "mode": "action",
       "text": "(Il registro del turno è aperto sul banco. Ultima riga: la firma di Hawk, ora del ricovero.)"
      },
      {
       "id": "m6.b7c.guard.p03",
       "mode": "dialogue",
       "speaker_id": "infermiera",
       "display_name": "INFERMIERA",
       "text": "Piantonato. Firma domattina."
      },
      {
       "id": "m6.b7c.guard.p04",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Diane, nove e dieci. Porta chiusa, sedia occupata. La firma è domattina."
      }
     ],
     "effects": [
      {
       "notebook": {
        "id": "m6.note.guard",
        "text": "Renault piantonato, stanza in fondo al reparto. Registro aperto sul banco, ultima firma di Hawk. Dichiarazione domattina."
       }
      }
     ],
     "repeat": {
      "id": "m6.repeat.hospital_guard",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Domattina. Con il foglio."
     },
     "invariant": "osservazione OBBLIGATORIA prima del rapporto notturno (m6_return_night la richiede con node_done); nessun flag scritto, sola annotazione; esclusiva con m6_hospital sullo stesso target (jacques_dead)",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "hospital",
     "target_kind": "object",
     "target_id": "night_register",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m6_return_night_early",
     "beat": "B7b",
     "source_section": "M6-B7b",
     "conditions": [
      {
       "flag": "jacques_preso"
      },
      {
       "not": {
        "node_done": "m6_hospital_guard"
       }
      },
      {
       "not": {
        "flag": "jacques_dead"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b7b.early.p01",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "Prima l'ospedale, Cooper. Voglio che tu veda dove l'ho messo."
      },
      {
       "id": "m6.b7b.early.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Vado. Poi il rapporto."
      }
     ],
     "effects": [],
     "repeat": {
      "id": "m6.repeat.return_night_early",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Prima l'ospedale. Poi il rapporto."
     },
     "invariant": "il rifiuto parla nella finzione: nessun rapporto notturno prima dell'ospedale; nessun effetto, nessun flag; esclusivo con m6_return_night sul node_done della guardia",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "actor_id": "truman",
     "target_kind": "actor",
     "target_id": "truman",
     "interaction_slot": "primary"
    },
    {
     "id": "m6_return_night",
     "beat": "B7b",
     "source_section": "M6-B7b",
     "conditions": [
      {
       "flag": "jacques_preso"
      },
      {
       "node_done": "m6_hospital_guard"
      },
      {
       "not": {
        "node_done": "m6_return_night"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b7b.night.p01",
       "mode": "action",
       "text": "(Il traghetto di ritorno è più lento. O sembra.)"
      },
      {
       "id": "m6.b7b.night.p02",
       "mode": "action",
       "text": "(In centrale: il rapporto preliminare porta via la sera. Hawk scrive, Cooper firma, la finestra diventa nera.)"
      },
      {
       "id": "m6.b7b.night.p03",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "Domattina l'ospedale, con il foglio. Adesso a casa, Cooper. Il paese ha già una notte in meno."
      },
      {
       "id": "m6.b7b.night.audrey",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "condition": {
        "flag": "audrey_vista_oej"
       },
       "text": "La nuova del guardaroba è rientrata con la barca delle otto. L'ho accompagnata io."
      },
      {
       "id": "m6.b7b.night.p04",
       "mode": "action",
       "text": "(Il telefono di Lucy squilla. Risponde, poi alza lo sguardo verso Cooper.)"
      },
      {
       "id": "m6.b7b.night.p05",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Diane, Jacques è in custodia. Firmo il rapporto prima che la memoria cominci a correggerlo."
      }
     ],
     "effects": [],
     "invariant": "passaggio dall'ospedale OBBLIGATORIO (node_done m6_hospital_guard); tempo percepibile: SEMPRE presente prima della notizia (gate di m6_news); nessun flag scritto; prima del commit l'obiettivo punta a Truman, dopo il commit punta alla root Lucy",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "actor_id": "truman",
     "target_kind": "actor",
     "target_id": "truman",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m6_news",
     "beat": "B8",
     "source_section": "M6-B8",
     "conditions": [
      {
       "node_done": "m6_return_night"
      },
      {
       "not": {
        "flag": "jacques_dead"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b8.news.p01",
       "mode": "dialogue",
       "speaker_id": "lucy",
       "display_name": "LUCY",
       "text": "Agente Cooper? L'ospedale è in linea. È terribile."
      },
      {
       "id": "m6.b8.news.p02",
       "mode": "dialogue",
       "speaker_id": "lucy",
       "display_name": "LUCY",
       "text": "Jacques Renault... soffocato nel suo letto. Un cuscino. Nessun testimone."
      },
      {
       "id": "m6.b8.news.p03",
       "mode": "dialogue",
       "speaker_id": "lucy",
       "display_name": "LUCY",
       "text": "Chi entra ed esce da un ospedale senza farsi notare, agente? Chi?"
      }
     ],
     "pages_by_value": {
      "value": "m6_tactic",
      "cases": {
       "prova": [
        {
         "id": "m6.b8.news.cooper_prova",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Aveva una dichiarazione da firmare, Harry. Termini suoi, foglio davanti. La firma non arriverà mai."
        }
       ],
       "pressione": [
        {
         "id": "m6.b8.news.cooper_pressione",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Quattro nomi sul suo elenco, Harry. Sui fiammiferi ha abbassato la voce. Ora non posso chiedergli perché."
        }
       ],
       "falsa_sicurezza": [
        {
         "id": "m6.b8.news.cooper_falsa",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Sarebbe tornato al tavolo. E io non saprò mai che cosa guardava il suo terzo uomo, quando guardava la stufa."
        }
       ]
      }
     },
     "effects": [
      {
       "set": "jacques_dead"
      },
      {
       "set": "jacques_testimony_lost"
      },
      {
       "proposition": "P9",
       "to": "formulated",
       "created_from": [
        "jacques_dead",
        "jacques_testimony_lost"
       ]
      }
     ],
     "invariant": "la fine critica scrive SOLO jacques_dead + jacques_testimony_lost (+ P9); MAI jacques_death_suspicious, MAI jacques_murder_confirmed/attributed; lucy_a3 [P] invariata; effetti SOLO dopo l'ultima pagina",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "lucy",
     "actor_id": "lucy",
     "interaction_slot": "primary",
     "mandatory_beat": true,
     "provenance_note": "[P] lucy_a3 conservata integralmente (Lock §5 B8): «un cuscino, nessun testimone» è la domanda di Lucy, non un fatto di sistema",
     "pages_after_branch": [
      {
       "id": "m6.b8.news.cooper_impeto",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "condition": {
        "value_is": {
         "name": "m5_final_theory",
         "equals": "degeneration"
        }
       },
       "text": "Avevo scritto impeto, Harry. Lo tengo a verbale. Ma un cuscino non è un impeto: un cuscino aspetta."
      }
     ]
    },
    {
     "id": "m6_atto4_bridge",
     "beat": "B9",
     "source_section": "M6-B9 / data.js — truman_atto4",
     "conditions": [
      {
       "flag": "jacques_dead"
      },
      {
       "flag": "gigante1"
      },
      {
       "not": {
        "flag": "atto4"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b9.atto4.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Harry, devo dirle una cosa che suonerà incredibile. Un gigante mi è apparso, allo specchio."
      },
      {
       "id": "m6.b9.atto4.p02",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "Un gigante non so dove metterlo. Jacques sì: qualcuno ha superato un piantone."
      },
      {
       "id": "m6.b9.atto4.register",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "condition": {
        "flag": "jacques_death_suspicious"
       },
       "text": "Il registro dice nessuno. Allora era qualcuno che non firma."
      },
      {
       "id": "m6.b9.atto4.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Cominciamo dal piantone. Sul Gigante non scrivo ancora nulla."
      },
      {
       "id": "m6.b9.atto4.p04",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "Se qualcuno temeva ciò che Jacques sapeva, ora abbiamo perso il modo di verificarlo."
      },
      {
       "id": "m6.b9.atto4.s1_safe",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "condition": {
        "value_is": {
         "name": "s1",
         "equals": "institutional"
        }
       },
       "text": "L'anello è in cassaforte. Lo cito nel rapporto."
      },
      {
       "id": "m6.b9.atto4.s1_pocket",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "condition": {
        "value_is": {
         "name": "s1",
         "equals": "documented_custody"
        }
       },
       "text": "L'anello ce l'hai tu, con la mia firma sotto. Non lo cito."
      }
     ],
     "effects": [
      {
       "set": "atto4"
      }
     ],
     "repeat": {
      "id": "m6.repeat.atto4_bridge",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Diane, Truman ha ragione: domani sarà peggio. Per stanotte, caffè e rapporto."
     },
     "invariant": "jacques_dead e gigante1 sono conoscenza acquisita prima del rapporto; atto4 nasce solo dopo l'ultima pagina e apre M8 senza fallback legacy.",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "truman",
     "actor_id": "truman",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m6_hospital",
     "beat": "B8b",
     "source_section": "M6-B8b",
     "optional": true,
     "conditions": [
      {
       "flag": "jacques_dead"
      },
      {
       "not": {
        "flag": "jacques_death_suspicious"
       }
      }
     ],
     "pages": [
      {
       "id": "m6.b8b.hospital.p01",
       "mode": "action",
       "text": "(La porta di Jacques: sigillata da stamattina. Davanti a Ronette: il piantone è raddoppiato.)"
      },
      {
       "id": "m6.b8b.hospital.p02",
       "mode": "action",
       "text": "(Il registro del turno è aperto sul banco.)"
      },
      {
       "id": "m6.b8b.hospital.p03",
       "mode": "dialogue",
       "speaker_id": "infermiera",
       "display_name": "INFERMIERA",
       "text": "Nessuno ha chiesto accesso alla stanza."
      },
      {
       "id": "m6.b8b.hospital.p04",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Nessun ingresso registrato e un uomo morto sotto sorveglianza. Il registro non spiega la stanza."
      }
     ],
     "effects": [
      {
       "set": "jacques_death_suspicious"
      },
      {
       "notebook": {
        "id": "m6.note.hospital.register",
        "text": "Nessuna firma fra mezzanotte e il cambio turno. Il registro non spiega la stanza."
       }
      }
     ],
     "invariant": "coda FACOLTATIVA; unico writer di jacques_death_suspicious (formulated, factual_status unconfirmed — SOLO qui); la porta sigillata è lo stato di STAMATTINA, mai lo stato della notte; nessuna attribuzione dell'omicidio",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "hospital",
     "target_kind": "object",
     "target_id": "night_register",
     "interaction_slot": "primary"
    }
   ],
   "node_count": {
    "runtime_total": 17
   }
  };
  D.missions.M8 = {
   "narrative_package": "narrative-v1.0",
   "mission": "M8",
   "title": "Sta accadendo di nuovo",
   "source": {
    "document": "M8 v1.1 LOCK.md",
    "package": "narrative-v1.0"
   },
   "schema_delta": "narrative/schema-deltas/M8.md",
   "entry_condition": {
    "flag": "atto4"
   },
   "authorial_timeline": {
    "note": "Timeline autoriale UNICA (Lock §8). DATO DICHIARATIVO, mai stato runtime, mai contatore, mai ramo: nessun effetto scrive T0..T7. Nessun percorso del player intercetta Leland/BOB.",
    "steps": {
     "T0": "pomeriggio — Maddy al diner decide la prima corriera del mattino (fermata del lago)",
     "T1": "sera — torna a casa Palmer",
     "T2": "Leland/BOB è GIÀ dentro la casa: il pericolo è interno, mai un estraneo sulla strada",
     "T3": "il Gigante appare al Roadhouse: il processo è avviato, l'aggressione non ancora",
     "T4": "la telefonata (se fatta) trova Maddy in casa: cambia ciò che fa NELLA casa, mai il percorso dell'omicidio",
     "T5": "l'attacco avviene in casa, prima che chiunque possa arrivare",
     "T6": "il corpo viene portato al lago",
     "T7": "una chiamata civile anonima segnala la riva: la centrale manda Hawk (processo del mondo, indipendente dalla scelta del player)"
    }
   },
   "value_transitions": [
    {
     "value_transition": {
      "name": "presagio_status",
      "from": "active",
      "to": "verified"
     },
     "note": "active nasce al Roadhouse (m8_roadhouse), verified nasce SOLO al ritrovamento (m8_discovery); mai inversa. Primitiva generica DICHIARATA nello schema-delta, da implementare in C8-B."
    }
   ],
   "completion": {
    "when": {
     "node_done": "m8_station"
    },
    "sets": []
   },
   "objectives": [
    {
     "id": "obj_m8_4",
     "priority": 400,
     "when": {
      "all": [
       {
        "flag": "maddy_trovata"
       },
       {
        "proposition_path": "P8.formulation.status",
        "equals": "formulated"
       },
       {
        "node_done": "m8_station"
       }
      ]
     },
     "text": "Porta a Truman una contraddizione che regga.",
     "provenance_note": "[L] testo esatto del Lock §9-F. Il Lock consegna questo obiettivo DOPO la conversazione alla stazione, come passaggio a M9 (gate node_done:m8_station); prima della stazione è attivo obj_m8_35"
    },
    {
     "id": "obj_m8_35",
     "priority": 350,
     "when": {
      "all": [
       {
        "flag": "maddy_trovata"
       },
       {
        "proposition_path": "P8.formulation.status",
        "equals": "formulated"
       },
       {
        "not": {
         "node_done": "m8_station"
        }
       }
      ]
     },
     "text": "Porta il nesso a Truman, alla centrale.",
     "provenance_note": "[N] derivato: obiettivo intermedio (P8 formulata, stazione non ancora fatta) che indirizza alla centrale; la consegna della «contraddizione a Truman» (obj_m8_4) resta post-stazione per rispettare la cronologia del Lock §9-F e la matrice C8-D"
    },
    {
     "id": "obj_m8_3",
     "priority": 300,
     "when": {
      "all": [
       {
        "flag": "maddy_trovata"
       },
       {
        "not": {
         "proposition_path": "P8.formulation.status",
         "equals": "formulated"
        }
       }
      ]
     },
     "text": "Rileggi le lettere e il diario di Laura.",
     "provenance_note": "[N] derivato dal beat E (le lettere e il diario)"
    },
    {
     "id": "obj_m8_25",
     "priority": 250,
     "when": {
      "all": [
       {
        "value_set": "promise_stance"
       },
       {
        "not": {
         "evidence": "T_LELAND_TAXI"
        }
       }
      ]
     },
     "text": "Prima di uscire dal diner, parla con Leland.",
     "provenance_note": "[N→L] rende obbligatoria la falsa storia del taxi richiesta dal lock M9 nel pomeriggio: dopo la promessa a Maddy, prima del Roadhouse e del presagio."
    },
    {
     "id": "obj_m8_2",
     "priority": 200,
     "when": {
      "all": [
       {
        "evidence": "T_LELAND_TAXI"
       },
       {
        "value_is": {
         "name": "presagio_status",
         "equals": "active"
        }
       },
       {
        "not": {
         "flag": "maddy_trovata"
        }
       },
       {
        "value_set": "warning_target"
       }
      ]
     },
     "text": "Torna all’incrocio: casa Palmer, lago o diner.",
     "provenance_note": "[L] testo esatto del Lock §9-B. Guardia aggiunta nel pass 01 del nodo split (B1): warning_target set, cosi' l'obiettivo non precede il telefono (obj_m8_15 copre la finestra fra la dichiarazione al tavolo e la telefonata)"
    },
    {
     "id": "obj_m8_15",
     "priority": 150,
     "when": {
      "all": [
       {
        "value_is": {
         "name": "presagio_status",
         "equals": "active"
        }
       },
       {
        "not": {
         "value_set": "warning_target"
        }
       }
      ]
     },
     "text": "Il telefono del Roadhouse.",
     "provenance_note": "[L] Lock §9-B"
    },
    {
     "id": "obj_m8_1",
     "priority": 100,
     "when": {
      "all": [
       {
        "value_set": "promise_stance"
       },
       {
        "evidence": "T_LELAND_TAXI"
       },
       {
        "not": {
         "value_set": "presagio_status"
        }
       },
       {
        "not": {
         "node_done": "m8_roadhouse_truman"
        }
       }
      ]
     },
     "text": "Il paese si ritrova al Roadhouse, stasera.",
     "provenance_note": "[N] obiettivo del Roadhouse (pre-enunciato del Gigante): attivo SOLO dopo la promessa al diner (value_set promise_stance), perché m8_roadhouse_truman richiede promise_stance — altrimenti l'obiettivo punterebbe a una root non ancora azionabile. Guardia not node_done m8_roadhouse_truman aggiunta nel pass 01 (ridondante con not value_set presagio_status, ma esplicita dopo lo split del nodo — O9)"
    },
    {
     "id": "obj_m8_0",
     "priority": 50,
     "when": {
      "not": {
       "value_set": "promise_stance"
      }
     },
     "text": "Passa dal diner, questo pomeriggio.",
     "provenance_note": "[N] obiettivo d'ingresso M8 (pre-diner): punta alla root azionabile m8_diner (dove nasce promise_stance) prima del Roadhouse — chiude il softlock semantico/wayfinding del verdetto C8-A.2. Testo di sola direzione (nessuna «raggiungi/salva Maddy»: igiene falsa colpa)"
    }
   ],
   "nodes": [
    {
     "id": "m8_diner",
     "beat": "A",
     "source_section": "M8-A",
     "prompt": "Che cosa prometti a Maddy?",
     "conditions": [
      {
       "not": {
        "value_set": "promise_stance"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.a.diner.p01",
       "mode": "action",
       "text": "(Maddy al bancone, un tovagliolo pieno di numeri. Norma le riempie la tazza senza chiedere.)"
      },
      {
       "id": "m8.a.diner.p02",
       "mode": "dialogue",
       "speaker_id": "maddy",
       "display_name": "MADDY",
       "text": "La 7:40 prende la coincidenza a Spokane. Passa alla fermata del lago — quella delle 11 no, ma parte a orario."
      },
      {
       "id": "m8.a.diner.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Torna a casa, signorina Ferguson?"
      },
      {
       "id": "m8.a.diner.p04",
       "mode": "dialogue",
       "speaker_id": "maddy",
       "display_name": "MADDY",
       "text": "Torno al centralino della biblioteca. Mi tengono il posto fino a lunedì — l'ho fatto promettere per iscritto."
      },
      {
       "id": "m8.a.diner.p05",
       "mode": "action",
       "text": "(Un avventore la saluta: \"Ciao, Laura\". Maddy non si volta subito.)"
      },
      {
       "id": "m8.a.diner.p06",
       "mode": "dialogue",
       "speaker_id": "maddy",
       "display_name": "MADDY",
       "text": "(senza acidità) Maddy. Con due D. Laura era mia cugina — io sono quella che porta gli occhiali nelle foto."
      },
      {
       "id": "m8.a.diner.p07",
       "mode": "dialogue",
       "speaker_id": "maddy",
       "display_name": "MADDY",
       "text": "Sono rimasta un giorno in più per zia Sarah. Uno. Poi Missoula si riprende il suo centralino."
      },
      {
       "id": "m8.a.diner.p08",
       "mode": "action",
       "text": "(Maddy piega il tovagliolo sugli orari e aspetta.)"
      }
     ],
     "choices": [
      {
       "id": "promise_accompagno",
       "label": "«Lunedì ti accompagno io alla corriera.»",
       "effects": [
        {
         "value": "promise_stance",
         "to": "accompagno"
        }
       ],
       "feedback_pages": [
        {
         "id": "m8.a.diner.feedback.accompagno",
         "mode": "dialogue",
         "speaker_id": "maddy",
         "display_name": "MADDY",
         "text": "(sorride) Alle 7:10, agente. Io i federali li faccio aspettare al massimo cinque minuti."
        }
       ]
      },
      {
       "id": "promise_autonomia",
       "label": "«Missoula ti aspetta. Vai.»",
       "effects": [
        {
         "value": "promise_stance",
         "to": "autonomia"
        }
       ],
       "feedback_pages": [
        {
         "id": "m8.a.diner.feedback.autonomia",
         "mode": "dialogue",
         "speaker_id": "maddy",
         "display_name": "MADDY",
         "text": "(annuisce, piano) È la prima persona in questa città che me lo dice senza un \"ma\"."
        }
       ]
      },
      {
       "id": "promise_prudenza",
       "label": "«Chiama quando arrivi. Sempre.»",
       "effects": [
        {
         "value": "promise_stance",
         "to": "prudenza"
        }
       ],
       "feedback_pages": [
        {
         "id": "m8.a.diner.feedback.prudenza",
         "mode": "dialogue",
         "speaker_id": "maddy",
         "display_name": "MADDY",
         "text": "(ride) Lei parla come il mio centralino. Va bene: chiamerò. Sempre."
        }
       ]
      }
     ],
     "invariant": "scena ordinaria autonoma (starebbe nel gioco anche senza la tragedia); nessuna voce di taccuino (non appartiene al fascicolo); nessun presagio/paura/«sono come Laura»; promise_stance write-once; nessuna opzione «giusta»",
     "kind": "choice",
     "channel": "world",
     "map_id": "diner",
     "target_kind": "actor",
     "target_id": "maddy",
     "actor_id": "maddy",
     "interaction_slot": "primary",
     "role": "promise",
     "completion_when": {
      "value_set": "promise_stance"
     }
    },
    {
     "id": "m8_leland_waiting",
     "beat": "A0",
     "source_section": "M8-A0",
     "conditions": [
      {
       "flag": "atto4"
      },
      {
       "not": {
        "value_set": "promise_stance"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.a.leland_waiting.p01",
       "mode": "action",
       "text": "(Leland al bancone, accanto a Maddy. Il conto è già sotto la sua mano; aspetta che lei finisca.)"
      },
      {
       "id": "m8.a.leland_waiting.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Aspetto che lei finisca."
      }
     ],
     "effects": [],
     "repeat": {
      "id": "m8.repeat.leland_waiting",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Il conto è già sotto la sua mano. Aspetto che lei finisca."
     },
     "invariant": "presenza opzionale prima della promessa (R1: il pomeriggio è uno sguardo, non un fetch — chiude il rifiuto meta di O10); nessun effetto, nessuno stato scritto; esclusivo con m8_leland_taxi sul write-once di promise_stance (le due condizioni sono l'una la negazione dell'altra: mai due root vive sullo stesso attore)",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "diner",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary"
    },
    {
     "id": "m8_roadhouse_truman",
     "beat": "B",
     "source_section": "M8-B",
     "conditions": [
      {
       "value_set": "promise_stance"
      },
      {
       "evidence": "T_LELAND_TAXI"
      },
      {
       "not": {
        "value_set": "presagio_status"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.b.truman.p01",
       "mode": "action",
       "text": "(La banda suona. Il paese c'è tutto: birre, risate basse, il microfono che fischia una volta.)"
      },
      {
       "id": "m8.b.truman.p02",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "Se i tuoi enigmi avevano un seguito, questo è il posto che mi hai chiesto di aspettare."
      },
      {
       "id": "m8.b.truman.p03",
       "mode": "action",
       "text": "(La musica non si ferma. Ma per Cooper la sala rallenta — solo per lui.)"
      },
      {
       "id": "m8.b.truman.p04",
       "mode": "dialogue",
       "speaker_id": "gigante",
       "display_name": "GIGANTE",
       "text": "Sta accadendo di nuovo."
      },
      {
       "id": "m8.b.truman.p05",
       "mode": "action",
       "text": "(La sala riprende il suo tempo. Nessuno ha visto niente.)"
      }
     ],
     "effects": [
      {
       "value": "presagio_status",
       "to": "active"
      },
      {
       "notebook": {
        "id": "m8.note.presagio",
        "text": "Il secondo enunciato del Gigante: «Sta accadendo di nuovo». Significato ancora irrisolto."
       }
      }
     ],
     "invariant": "presagio_status: active nasce QUI (write iniziale, mai entry-gate); l'enunciato è solo per Cooper (la banda non si ferma); nessuna opzione, nessuna destinazione nominata; gigante2 (sync classico) deriva da QUESTO nodo (node_done:m8_roadhouse_truman); nessun `next` verso il telefono — il giocatore CAMMINA fino a 8,5 (nodo split B1)",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "roadhouse",
     "target_kind": "actor",
     "target_id": "truman",
     "actor_id": "truman",
     "interaction_slot": "primary"
    },
    {
     "id": "m8_giant_stage",
     "beat": "B",
     "source_section": "M8-B",
     "conditions": [
      {
       "value_is": {
        "name": "presagio_status",
        "equals": "active"
       }
      },
      {
       "not": {
        "value_set": "warning_target"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.b.giant.p01",
       "mode": "action",
       "text": "(Sul palco, dietro la banda, un uomo alto. Nessuno lo guarda. Non indica niente.)"
      }
     ],
     "effects": [],
     "repeat": {
      "id": "m8.b.giant.repeat",
      "mode": "action",
      "text": "(Sul palco, dietro la banda, un uomo alto. Nessuno lo guarda. Non indica niente.)"
     },
     "invariant": "mai una seconda dichiarazione, mai una direzione; presenza silenziosa fra l'enunciato al tavolo e la telefonata (finestra presagio_status=active ∧ ¬warning_target); il nodo esiste perché un'entità con dialogue:null non è mai un NPC muto (O4/O5): il palco (8,1) è tessera solida ma faceable da 8,2, interact() risolve npcAt prima di ogni test di solidità",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "roadhouse",
     "target_kind": "actor",
     "target_id": "gigante",
     "actor_id": "gigante",
     "interaction_slot": "primary"
    },
    {
     "id": "m8_roadhouse_phone",
     "beat": "B",
     "source_section": "M8-B",
     "prompt": "Chi deve ricevere l'avvertimento?",
     "conditions": [
      {
       "value_is": {
        "name": "presagio_status",
        "equals": "active"
       }
      },
      {
       "not": {
        "value_set": "warning_target"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.b.phone.p01",
       "mode": "notebook",
       "text": "Il telefono del Roadhouse."
      },
      {
       "id": "m8.b.phone.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Harry, non so ancora cosa si ripeta. La linea è libera; quello che dico adesso farà muovere qualcuno."
      }
     ],
     "choices": [
      {
       "id": "warning_palmer",
       "label": "Avverti casa Palmer.",
       "effects": [
        {
         "value": "warning_target",
         "to": "palmer"
        },
        {
         "value": "maddy_action_after_warning",
         "to": "departure_prepared"
        },
        {
         "value": "sarah_support_state",
         "to": "none"
        }
       ],
       "feedback_pages": [
        {
         "id": "m8.b.roadhouse.feedback.palmer.p01",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Maddy. Sono Cooper. Svegli Sarah — restate insieme e non aprite a nessuno. Mando qualcuno."
        },
        {
         "id": "m8.b.roadhouse.feedback.palmer.p02",
         "mode": "dialogue",
         "speaker_id": "maddy",
         "display_name": "MADDY",
         "text": "Le porte sono già chiuse, agente. Resto con lei. La valigia la porto nell'ingresso, così domattina non la sveglio."
        }
       ]
      },
      {
       "id": "warning_centrale",
       "label": "Chiedi alla centrale di mandare un vice.",
       "effects": [
        {
         "value": "warning_target",
         "to": "centrale"
        },
        {
         "value": "maddy_action_after_warning",
         "to": "none"
        },
        {
         "value": "sarah_support_state",
         "to": "vice"
        }
       ],
       "feedback_pages": [
        {
         "id": "m8.b.roadhouse.feedback.centrale",
         "mode": "dialogue",
         "speaker_id": "lucy",
         "display_name": "LUCY",
         "text": "Glielo passo— no, è di pattuglia. Mando Andy a casa Palmer, agente. Ci mette dieci minuti."
        }
       ]
      },
      {
       "id": "warning_nessuno",
       "label": "Non perdere altro tempo: esci.",
       "effects": [
        {
         "value": "warning_target",
         "to": "nessuno"
        },
        {
         "value": "maddy_action_after_warning",
         "to": "none"
        },
        {
         "value": "sarah_support_state",
         "to": "none"
        }
       ],
       "feedback_pages": [
        {
         "id": "m8.b.roadhouse.feedback.nessuno",
         "mode": "action",
         "text": "(Il telefono resta sulla forcella. La porta del Roadhouse è già alle spalle.)"
        }
       ]
      }
     ],
     "effects": [],
     "invariant": "presagio_status è già active (scritto da m8_roadhouse_truman); questo nodo scrive SOLO warning_target/maddy_action_after_warning/sarah_support_state; la label è INTENZIONE non comando; nessuna opzione nomina Maddy come bersaglio; maddy_departure_plan (prima corriera) invariato dal pomeriggio",
     "kind": "choice",
     "channel": "world",
     "map_id": "roadhouse",
     "target_kind": "object",
     "target_id": "roadhouse_phone",
     "interaction_slot": "primary",
     "role": "warning",
     "completion_when": {
      "value_set": "warning_target"
     }
    },
    {
     "id": "m8_leland_taxi",
     "beat": "B0",
     "source_section": "M8-B0 / contratto M9 pre-ritrovamento",
     "conditions": [
      {
       "value_set": "promise_stance"
      },
      {
       "not": {
        "evidence": "T_LELAND_TAXI"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.b0.leland_taxi.p00",
       "mode": "action",
       "text": "(Maddy saluta ed esce. Leland posa il conto sul bancone.)"
      },
      {
       "id": "m8.b0.leland_taxi.p01",
       "mode": "dialogue",
       "speaker_id": "leland",
       "display_name": "LELAND",
       "text": "Maddy prende la prima corriera domattina. Ho chiamato la Twin Peaks Taxi: passa da casa alle sette."
      },
      {
       "id": "m8.b0.leland_taxi.accompagno.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Con Maddy ci siamo accordati: la accompagno alle sette e dieci. Il taxi aspetterà?",
       "condition": {
        "value_is": {
         "name": "promise_stance",
         "equals": "accompagno"
        }
       }
      },
      {
       "id": "m8.b0.leland_taxi.autonomia.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Maddy ha scelto Missoula. Non aggiungo un «ma»: verifico gli orari e le lascio la partenza.",
       "condition": {
        "value_is": {
         "name": "promise_stance",
         "equals": "autonomia"
        }
       }
      },
      {
       "id": "m8.b0.leland_taxi.prudenza.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Ho chiesto a Maddy una telefonata. Il taxi delle sette aggiunge un orario, non una garanzia.",
       "condition": {
        "value_is": {
         "name": "promise_stance",
         "equals": "prudenza"
        }
       }
      },
      {
       "id": "m8.b0.leland_taxi.accompagno.p02",
       "mode": "dialogue",
       "speaker_id": "leland",
       "display_name": "LELAND",
       "text": "Sarah si tranquillizza se c'è un'auto davanti. Aspetterà fino alle sette e dieci. Il suo accompagnamento resta, agente.",
       "condition": {
        "value_is": {
         "name": "promise_stance",
         "equals": "accompagno"
        }
       }
      },
      {
       "id": "m8.b0.leland_taxi.chiusura.p01",
       "mode": "action",
       "text": "(Norma gira il cartello sulla porta e spegne l'insegna. Sedie sui tavoli, cappotti dagli attaccapanni: il Double R chiude alle sei, stasera si va al Roadhouse.)"
      },
      {
       "id": "m8.b0.leland_taxi.p02",
       "mode": "notebook",
       "text": "Prima del Roadhouse, al diner: Leland dice di aver prenotato il taxi di Maddy."
      }
     ],
     "effects": [
      {
       "evidence": "T_LELAND_TAXI"
      }
     ],
     "repeat": {
      "id": "m8.repeat.leland_taxi",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Taxi alle sette, corriera alle 7:40. Ripeto gli orari finché non compare una prenotazione."
     },
     "invariant": "La falsa storia nasce fisicamente al diner DOPO la promessa e PRIMA del Roadhouse/presagio/ritrovamento. Se Cooper ha offerto di accompagnare Maddy, verifica subito la compatibilità 7:00/7:10 e Leland conferma che il taxi aspetterà: nessuna contraddizione fabbricata o ignorata. M9 può solo verificare la prenotazione, mai creare la storia retroattivamente né usare gli orari come prova d'omicidio.",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "diner",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m8_lucy",
     "beat": "X",
     "source_section": "M8-X (trasversale)",
     "conditions": [
      {
       "flag": "atto4"
      },
      {
       "not": {
        "node_done": "m8_station"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.lucy.p01",
       "mode": "dialogue",
       "speaker_id": "lucy",
       "display_name": "LUCY",
       "text": "Stasera il paese è tutto al Roadhouse, agente. Norma chiude alle sei per andarci. Lei ci va?",
       "condition": {
        "not": {
         "value_set": "presagio_status"
        }
       }
      },
      {
       "id": "m8.lucy.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Ci sarò, Lucy. Prima passo dal Double R.",
       "condition": {
        "not": {
         "value_set": "presagio_status"
        }
       }
      },
      {
       "id": "m8.lucy.p03",
       "mode": "dialogue",
       "speaker_id": "lucy",
       "display_name": "LUCY",
       "text": "Linea libera, agente. Hawk è di pattuglia, il resto del paese è al Roadhouse. Le serve qualcuno?",
       "condition": {
        "all": [
         {
          "value_is": {
           "name": "presagio_status",
           "equals": "active"
          }
         },
         {
          "not": {
           "flag": "maddy_trovata"
          }
         }
        ]
       }
      },
      {
       "id": "m8.lucy.p03b",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Non ancora. Se squilla, segnati l'ora.",
       "condition": {
        "all": [
         {
          "value_is": {
           "name": "presagio_status",
           "equals": "active"
          }
         },
         {
          "not": {
           "flag": "maddy_trovata"
          }
         }
        ]
       }
      },
      {
       "id": "m8.lucy.p04",
       "mode": "action",
       "text": "(Lucy al centralino. Nessuna luce accesa sul quadro: a quest'ora non chiama nessuno.)",
       "condition": {
        "flag": "maddy_trovata"
       }
      },
      {
       "id": "m8.lucy.p04b",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "condition": {
        "flag": "maddy_trovata"
       },
       "text": "Niente da passare. Segna l'ora comunque."
      }
     ],
     "effects": [],
     "effect_policy": "always",
     "repeat": {
      "id": "m8.lucy.repeat",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Il quadro è tuo, Lucy. Il taccuino è mio."
     },
     "invariant": "Lucy instrada, mai interpreta; mai nomina il gigante, Maddy o il taxi; le pagine coprono per `condition` l'intero dominio presagio_status×maddy_trovata (mai vuoto), quindi effect_policy=always (primitiva generica già letta dal runtime, non locked dal primo commit) rivaluta la finestra corretta a ogni visita — nessun effetto, quindi la rivalutazione ripetuta è priva di rischio; ogni finestra porta anche una riga COOPER (voce Cooper obbligatoria su ogni root, test/interaction-voice.js), il repeat resta un fallback puramente difensivo",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "lucy",
     "actor_id": "lucy",
     "interaction_slot": "primary"
    },
    {
     "id": "m8_focus_choice",
     "beat": "C",
     "source_section": "M8-C",
     "prompt": "Dove vai?",
     "conditions": [
      {
       "evidence": "T_LELAND_TAXI"
      },
      {
       "value_set": "warning_target"
      },
      {
       "not": {
        "value_set": "focus_destination"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.c.focus.p01",
       "mode": "action",
       "text": "(Lo stesso paese di ogni giorno. Stanotte le strade sono solo distanza.)"
      },
      {
       "id": "m8.c.focus.p02",
       "mode": "notebook",
       "text": "Sul taccuino, tre luoghi restano senza segni di priorità."
      },
      {
       "id": "m8.c.focus.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Nessun fatto ne preferisce uno. Il primo costo è la distanza."
      }
     ],
     "choices": [
      {
       "id": "focus_palmer",
       "label": "casa Palmer — la casa continua a tornare (a nord, lontana)",
       "effects": [
        {
         "value": "focus_destination",
         "to": "palmer"
        }
       ]
      },
      {
       "id": "focus_lago",
       "label": "la fermata del lago — la corriera di Maddy (a ovest, lontana)",
       "effects": [
        {
         "value": "focus_destination",
         "to": "lago"
        }
       ]
      },
      {
       "id": "focus_diner",
       "label": "il Double R — Norma sa se è partita (vicino)",
       "effects": [
        {
         "value": "focus_destination",
         "to": "diner"
        }
       ]
      }
     ],
     "invariant": "focus_destination write-once; NESSUN goto: il commit scrive focus_destination, chiude il widget e restituisce il gameplay — la world-root della destinazione scelta si CAMMINA (C8-E); ogni destinazione ha una ragione disponibile al player (geografia reale di town); i costi sono distanza dichiarata dallo spazio, mai countdown; nessuna opzione è «giusta»",
     "kind": "choice",
     "channel": "world",
     "map_id": "town",
     "target_kind": "landmark",
     "target_id": "town_crossroads",
     "interaction_slot": "primary",
     "role": "focus",
     "completion_when": {
      "value_set": "focus_destination"
     },
     "repeat": {
      "id": "m8.c.focus.repeat",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Il Roadhouse ha chiuso. Da qui, le strade sono solo distanza."
     }
    },
    {
     "id": "m8_route_palmer",
     "beat": "C",
     "source_section": "M8-C",
     "conditions": [
      {
       "value_is": {
        "name": "focus_destination",
        "equals": "palmer"
       }
      },
      {
       "not": {
        "value_set": "body_found_by"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.c.route_palmer.p01",
       "mode": "action",
       "text": "(La casa: buio al piano di sopra.)"
      },
      {
       "id": "m8.c.route_palmer.p02",
       "mode": "action",
       "text": "(In ingresso, la valigia. Sotto la porta di Sarah, un biglietto: \"Torno lunedì. Non svegliarla.\" Di Maddy, nessuna traccia.)",
       "condition": {
        "value_is": {
         "name": "warning_target",
         "equals": "palmer"
        }
       },
       "conditional_note": "valigia/biglietto = azione autonoma di Maddy, visibile QUI solo se warning=palmer (e focus=palmer, cioè si è a casa); altrimenti la riga arriva via Truman in F"
      },
      {
       "id": "m8.c.route_palmer.p03",
       "mode": "action",
       "text": "(Il telefono squilla: è la centrale.)"
      },
      {
       "id": "m8.c.route_palmer.p04",
       "mode": "dialogue",
       "speaker_id": "lucy",
       "display_name": "LUCY",
       "text": "Agente — una chiamata anonima, qualcosa sulla riva del lago. Hawk è già in strada."
      },
      {
       "id": "m8.c.route_palmer.p05",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Lucy, ricevuto. Non tocco nulla qui; raggiungo Hawk al lago."
      }
     ],
     "effects": [
      {
       "value": "body_found_by",
       "to": "hawk"
      }
     ],
     "invariant": "la casa NON è la scena del corpo (T2/T5: l'attacco è interno, il corpo è al lago); a Palmer arriva la chiamata della centrale → Hawk; la valigia/biglietto di Maddy sono la SUA azione, mai collegata al percorso della morte",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "palmer",
     "target_kind": "landmark",
     "target_id": "palmer_entrance",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m8_route_lake",
     "beat": "C",
     "source_section": "M8-C",
     "conditions": [
      {
       "value_is": {
        "name": "focus_destination",
        "equals": "lago"
       }
      },
      {
       "not": {
        "value_set": "body_found_by"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.c.route_lake.p01",
       "mode": "action",
       "text": "(L'acqua è ferma. Sulla riva, una forma che l'acqua non reclama. Cooper arriva per primo.)"
      },
      {
       "id": "m8.c.route_lake.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Fermo al perimetro. Prima proteggo la scena; poi troverò le parole per Maddy."
      }
     ],
     "effects": [
      {
       "value": "body_found_by",
       "to": "cooper"
      }
     ],
     "invariant": "al lago Cooper è primo (cooper_primary); il fatto fisso non si evita da nessuna strada",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "town",
     "target_kind": "landmark",
     "target_id": "lago_maddy",
     "interaction_slot": "primary",
     "mandatory_beat": true,
     "provenance_note": "[P] lago_maddy (town 15,28) dal repository"
    },
    {
     "id": "m8_route_diner",
     "beat": "C",
     "source_section": "M8-C",
     "conditions": [
      {
       "value_is": {
        "name": "focus_destination",
        "equals": "diner"
       }
      },
      {
       "not": {
        "value_set": "body_found_by"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.c.route_diner.p01",
       "mode": "dialogue",
       "speaker_id": "norma",
       "display_name": "NORMA",
       "text": "Maddy? Ha chiesto della fermata del lago. Poi è tornata dai Palmer. Non era ancora partita."
      },
      {
       "id": "m8.c.route_diner.p02",
       "mode": "action",
       "text": "(Il tempo di uscire: la radio di Hawk gracchia il nome del lago — una chiamata anonima ha segnalato qualcosa sulla riva.)"
      },
      {
       "id": "m8.c.route_diner.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Hawk ha il lago. Norma conferma che Maddy è tornata dai Palmer; porto con me questo ordine."
      }
     ],
     "effects": [
      {
       "value": "body_found_by",
       "to": "hawk"
      }
     ],
     "invariant": "al diner Norma non sa più dell'orario; la chiamata anonima manda Hawk (processo del mondo); body_found_by=hawk",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "diner",
     "target_kind": "actor",
     "target_id": "norma",
     "actor_id": "norma",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m8_discovery",
     "beat": "D",
     "source_section": "M8-D",
     "conditions": [
      {
       "value_set": "body_found_by"
      },
      {
       "not": {
        "flag": "maddy_trovata"
       }
      }
     ],
     "pages_by_value": {
      "value": "body_found_by",
      "cases": {
       "cooper": [
        {
         "id": "m8.d.discovery.cooper.p01",
         "mode": "action",
         "text": "(Sulla riva: Maddy. Cooper si ferma prima del perimetro.)"
        },
        {
         "id": "m8.d.discovery.cooper.p02",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "(fermo) Signorina Ferguson. Maddy. Con due D."
        },
        {
         "id": "m8.d.discovery.cooper.p03",
         "mode": "action",
         "text": "(Si china senza toccare. Sotto l'unghia dell'anulare: un segno.)"
        },
        {
         "id": "m8.d.discovery.cooper.p04",
         "mode": "action",
         "text": "(Arrivano le torce di Hawk e del vice. Cooper non si è mosso di un passo.)"
        }
       ],
       "hawk": [
        {
         "id": "m8.d.discovery.hawk.p01",
         "mode": "action",
         "text": "(Quando Cooper arriva, il perimetro è già segnato. Hawk gli va incontro, si toglie il cappello.)"
        },
        {
         "id": "m8.d.discovery.hawk.p02",
         "mode": "dialogue",
         "speaker_id": "hawk",
         "display_name": "HAWK",
         "text": "L'ho trovata io. Non l'ho mossa. Non ho toccato le mani. Guarda l'anulare."
        },
        {
         "id": "m8.d.discovery.hawk.p03",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Hawk, hai fatto bene. Osservo da dove ti sei fermato; una scena preservata ha due paia d'occhi."
        }
       ]
      }
     },
     "effects": [
      {
       "evidence": "E9A_LETTERA_O"
      },
      {
       "evidence": "E9B_STESSO_METODO"
      },
      {
       "value": "letter_o_chain",
       "to": "standard"
      },
      {
       "value": "letter_o_observation_source",
       "from_derivation": {
        "of": "body_found_by",
        "map": {
         "cooper": "cooper_primary",
         "hawk": "hawk_preserved"
        }
       }
      },
      {
       "value_transition": {
        "name": "presagio_status",
        "from": "active",
        "to": "verified"
       }
      },
      {
       "set": "maddy_trovata"
      },
      {
       "notebook": {
        "id": "m8.note.letter_o",
        "text": "Una O, incisa sotto l'unghia dell'anulare — stessa posizione e stesso tipo di incisione della R."
       }
      }
     ],
     "letter_o_source_note": "letter_o_observation_source è un EFFETTO derivato (from_derivation) del ritrovamento: unico writer eseguibile (Cooper primo → cooper_primary; altrimenti Hawk preserva → hawk_preserved). Disciplina runtime (schema-delta §3, C8-B): prepareNode legge body_found_by, valida dominio e copertura, risolve cooper_primary|hawk_preserved e CONGELA il risultato nel prepared; commitNode consuma il valore risolto — NON rilegge il sorgente al commit. Arrivare secondi NON indebolisce la prova — cambia una riga di M9, mai il gate. Mai adapter.",
     "invariant": "E9A/E9B scritte in OGNI percorso (unico writer = discovery); letter_o_chain=standard sempre; presagio active→verified SOLO qui (value_transition); maddy_trovata [P] unico writer; nessun testo valuta le scelte della notte; effetti SOLO dopo l'ultima pagina",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "town",
     "target_kind": "landmark",
     "target_id": "lago_maddy",
     "interaction_slot": "primary",
     "next": "m8_promise_echo",
     "next_note": "il ritrovamento continua obbligatoriamente all'eco della promessa (Lock: il monologo comune è parte del ritrovamento); i confronti del taccuino sono gated su node_done:m8_promise_echo, così l'eco non è saltabile nemmeno dopo load",
     "mandatory_beat": true
    },
    {
     "id": "m8_promise_echo",
     "beat": "D",
     "source_section": "M8-D",
     "conditions": [
      {
       "flag": "maddy_trovata"
      },
      {
       "not": {
        "node_done": "m8_promise_echo"
       }
      }
     ],
     "pages": [
      {
       "id": "m8.d.echo.p01",
       "mode": "action",
       "text": "(Cooper prende il registratore. Non lo accende.)"
      }
     ],
     "pages_by_value": {
      "value": "promise_stance",
      "cases": {
       "accompagno": [
        {
         "id": "m8.d.echo.accompagno",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Diane. Aveva fissato le 7:10. Disse che un federale poteva aspettare cinque minuti."
        }
       ],
       "autonomia": [
        {
         "id": "m8.d.echo.autonomia",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Diane. Disse che Missoula l'aspettava senza un \"ma\"."
        }
       ],
       "prudenza": [
        {
         "id": "m8.d.echo.prudenza",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Diane. Rise della mia voce da centralino. Disse che avrebbe chiamato."
        }
       ]
      }
     },
     "pages_after_branch": [
      {
       "id": "m8.d.echo.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Sul tovagliolo aveva scritto tre partenze. Ne aveva scelta una."
      },
      {
       "id": "m8.d.echo.p03",
       "mode": "action",
       "text": "(Silenzio.)"
      }
     ],
     "effects": [],
     "invariant": "l'eco della promessa deriva da promise_stance (pages_by_value, copertura totale del dominio); il monologo porta la colpa PERCEPITA, il testo non la conferma; nessun testo qui valuta le scelte della notte",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "town",
     "target_kind": "landmark",
     "target_id": "lago_maddy",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m8_cmp_letters",
     "beat": "E",
     "source_section": "M8-E",
     "conditions": [
      {
       "evidence": "E9A_LETTERA_O"
      },
      {
       "evidence": "E3_LETTERA_R"
      },
      {
       "node_done": "m8_promise_echo"
      }
     ],
     "gate_note": "i confronti del taccuino sono nascosti finché l'eco della promessa non è avvenuta (node_done:m8_promise_echo): protegge l'ordine drammaturgico D→E del Lock anche dopo crash/load, senza fare della promessa una causa della tragedia",
     "pages": [
      {
       "id": "m8.e.cmp_letters.p01",
       "mode": "notebook",
       "text": "(Confronta: la O incisa sotto l'unghia ↔ la lettera R)"
      }
     ],
     "effects": [
      {
       "notebook_observation": {
        "id": "m8.obs.letters",
        "text": "Le due lettere sembrano appartenere allo stesso metodo. Un ordine: prima la R, poi la O."
       }
      }
     ],
     "invariant": "confronto senza scelte, completed al node commit (result LETTERS_SAME_METHOD); produce SOLO la nota di ordine/metodo, nessuna proposizione; nessuna identità della mano",
     "kind": "comparison",
     "channel": "notebook",
     "interaction_slot": "primary",
     "comparison_completion": "node_commit",
     "result": "LETTERS_SAME_METHOD",
     "completed_recall": {
      "section": "notes",
      "page": {
       "id": "m8.notebook.cmp_letters.recorded",
       "mode": "notebook",
       "text": "(Questo confronto è già annotato negli Appunti.)"
      }
     }
    },
    {
     "id": "m8_cmp_diary",
     "beat": "E",
     "source_section": "M8-E",
     "prompt": "Che cosa puoi formulare?",
     "conditions": [
      {
       "evidence": "E9A_LETTERA_O"
      },
      {
       "evidence": "E1_DIARIO"
      },
      {
       "node_done": "m8_promise_echo"
      },
      {
       "node_done": "m8_cmp_letters"
      }
     ],
     "gate_note": "P8 non può saltare il primo confronto: il diario (che formula P8) è nascosto finché il confronto lettere R↔O non è committato (node_done:m8_cmp_letters). Gate: cmp_diary_hidden_before_cmp_letters, cmp_letters_commit_unlocks_cmp_diary, P8_cannot_bypass_first_comparison. Anche gated su m8_promise_echo (ordine D→E robusto dopo load).",
     "pages": [
      {
       "id": "m8.e.cmp_diary.p01",
       "mode": "notebook",
       "text": "(Confronta: le lettere ↔ il diario di Laura)"
      },
      {
       "id": "m8.e.cmp_diary.p02",
       "mode": "notebook",
       "display_name": "DIARIO DI LAURA",
       "text": "«Ha un nome da persona perbene.»"
      },
      {
       "id": "m8.e.cmp_diary.p02b",
       "mode": "notebook",
       "display_name": "DIARIO DI LAURA",
       "text": "«Dice che me lo darà un pezzo alla volta, come le cose che non si possono restituire.»"
      },
      {
       "id": "m8.e.cmp_diary.p03",
       "mode": "notebook",
       "text": "Cooper affianca la promessa del diario alla sequenza R–O."
      }
     ],
     "choices": [
      {
       "id": "diary_a",
       "label": "Le lettere seguono una firma progressiva che il diario aveva annunciato.",
       "result": "PROGRESSIVE_SIGNATURE",
       "effects": [
        {
         "proposition": "P8",
         "to": "formulated",
         "created_from": [
          "E3_LETTERA_R",
          "E9A_LETTERA_O",
          "E9B_STESSO_METODO",
          "E1_DIARIO"
         ]
        }
       ],
       "feedback_pages": [
        {
         "id": "m8.e.cmp_diary.feedback.a",
         "mode": "notebook",
         "text": "Le lettere seguono una firma progressiva che il diario aveva annunciato. Resta ignoto se la firma sia dell'assassino, di \"lui\", o una messinscena."
        }
       ]
      },
      {
       "id": "diary_b",
       "label": "R+O compongono un nome.",
       "result": "NAME_OVERREACH",
       "retry": true,
       "feedback_pages": [
        {
         "id": "m8.e.cmp_diary.feedback.b",
         "mode": "notebook",
         "text": "Due lettere non compongono niente. Un ordine e una promessa, forse."
        }
       ]
      },
      {
       "id": "diary_c",
       "label": "Il diario accusa qualcuno di casa.",
       "result": "HOUSE_OVERREACH",
       "retry": true,
       "feedback_pages": [
        {
         "id": "m8.e.cmp_diary.feedback.c",
         "mode": "notebook",
         "text": "Il diario nomina \"lui\". Non dice chi, né dove abita."
        }
       ]
      }
     ],
     "rules": {
      "attempt_scope": "comparison",
      "hide_attempted_results": true,
      "track_assistance": false
     },
     "invariant": "P8 nasce SOLO dal doppio confronto (A); factual_status ≤ corroborated (chi resta ignoto: assassino/«lui»/messinscena); B respinta (le due lettere non compongono un nome), C respinta (il diario non nomina chi né dove — P7 resta ipotesi non-procedurale); tentativi in comparisons[node].attempts",
     "kind": "comparison",
     "channel": "notebook",
     "interaction_slot": "primary",
     "role": "proposition",
     "completion_when": {
      "proposition_path": "P8.formulation.status",
      "equals": "formulated"
     },
     "completed_recall": {
      "section": "propositions",
      "page": {
       "id": "m8.notebook.cmp_diary.recorded",
       "mode": "notebook",
       "text": "(Questo nesso è già registrato nelle Proposizioni.)"
      }
     }
    },
    {
     "id": "m8_station",
     "beat": "F",
     "source_section": "M8-F",
     "conditions": [
      {
       "proposition_path": "P8.formulation.status",
       "equals": "formulated"
      }
     ],
     "pages_by_value": {
      "value": "sarah_support_state",
      "cases": {
       "vice": [
        {
         "id": "m8.f.station.sarah_vice",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "Andy era già con Sarah quando è arrivata la chiamata."
        }
       ],
       "none": [
        {
         "id": "m8.f.station.sarah_truman",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "Sono passato io da Sarah prima di tornare qui. Adesso Andy resta con lei."
        }
       ]
      },
      "note": "la logistica di Sarah deriva dallo STATO NOMINALE sarah_support_state (vice = il vice è già con Sarah; none = Truman ci è passato). pages_by_value su un valore tipizzato: copertura totale del dominio [none, vice]. M9/epilogo leggono sarah_support_state come stato nominale."
     },
     "pages": [
      {
       "id": "m8.f.station.p01",
       "mode": "action",
       "text": "(La centrale, prima dell'alba.)"
      }
     ],
     "pages_after_branch": [
      {
       "id": "m8.f.station.p_lago",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "La chiamata sulla riva è arrivata qui mentre tu eri già al lago. Un civile, senza nome; Hawk è partito subito.",
       "condition": {
        "value_is": {
         "name": "focus_destination",
         "equals": "lago"
        }
       },
       "conditional_note": "B7 (pass 01): chiude l'informazione mancante su chi ha ricevuto la chiamata anonima quando Cooper era già al lago (focus_destination=lago); congelata in prepareNode (conditional_pages, schema-delta §3), indipendente dalla condizione della valigia"
      },
      {
       "id": "m8.f.station.p_valigia",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "In ingresso c'era la valigia pronta, e un biglietto per Sarah. Voleva partire domattina.",
       "condition": {
        "all": [
         {
          "value_is": {
           "name": "warning_target",
           "equals": "palmer"
          }
         },
         {
          "not": {
           "value_is": {
            "name": "focus_destination",
            "equals": "palmer"
           }
          }
         }
        ]
       },
       "conditional_note": "rende visibile la valigia/biglietto a chi NON è passato da casa (warning=palmer ∧ focus≠palmer); congelata in prepareNode (conditional_pages, schema-delta §3)"
      },
      {
       "id": "m8.f.station.p02",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "Dimmi che cosa abbiamo, oltre a quello che abbiamo perso."
      },
      {
       "id": "m8.f.station.p03",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Una firma che procede, Harry. Il diario dice che qualcuno le prometteva il proprio nome a pezzi."
      },
      {
       "id": "m8.f.station.hook.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "E un orario. Ieri al diner Leland ha detto di aver chiamato la Twin Peaks Taxi per le sette, da casa. L'ho scritto io, alla luce del giorno."
      },
      {
       "id": "m8.f.station.hook.p02",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "Allora abbiamo un'ora. Prima delle sette, Lucy chiama la compagnia: una corsa prenotata, o niente."
      }
     ],
     "effects": [],
     "repeat": {
      "id": "m8.repeat.station",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Il lago è recintato. Nessuno usa più quel sentiero; la scena, almeno, può restare ferma."
     },
     "invariant": "Sarah non è mai oracolo (dorme; il vice la sostiene, non scopre corpi); la valigia/biglietto è visibile SE E SOLO SE warning_target=palmer (di persona in C se focus=palmer, via Truman qui se focus=lago|diner; con warning=centrale|nessuno nessuna pagina valigia in alcun percorso); il lutto di Truman è logistico; obiettivo «contraddizione a Truman» → M9; M8 NON completa la funzione procedurale di M9, non tratta P8 come base della convocazione",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "actor_id": "truman",
     "target_kind": "actor",
     "target_id": "truman",
     "interaction_slot": "primary",
     "mandatory_beat": true
    }
   ],
   "node_count": {
    "runtime_total": 16
   }
  };
  D.missions.M9 = {
   "narrative_package": "narrative-v1.0",
   "mission": "M9",
   "title": "La convocazione",
   "source": {
    "document": "M9-M10 v1.1.1 CONFESSION LOCK.md",
    "file": "M9-M10 v1.1 (confession lock).md",
    "sections": "§1 (atomi P6) + §2 (contratto) + §3 (script, sorgente unica) + §7 (scope/test)",
    "package": "narrative-v1.0"
   },
   "schema_delta": "narrative/schema-deltas/M9.md",
   "entry_condition": {
    "all": [
     {
      "flag": "atto4"
     },
     {
      "node_done": "m8_station"
     },
     {
      "evidence": "T_LELAND_TAXI"
     }
    ]
   },
   "entry_note": "[N] M9 comincia dove M8 finisce. T_LELAND_TAXI è stato ascoltato fisicamente al diner DOPO la promessa a Maddy e PRIMA del Roadhouse; M9 lo verifica, non lo crea retroattivamente. Il gate è la CONSEGNA di M8 (node_done m8_station, == M8.completion.when), il flag atto4 e quella testimonianza. NON è `atto5`: atto5 viene scritto dalla presentazione accettata (m9_present_truman), quando Leland passa alla centrale.",
   "reads_only_from_m8": {
    "note": "M9 LEGGE tre valori tipizzati scritti da M8 e non ne scrive nessuno. Le eco O e Sarah hanno copertura totale; warning_target produce una riga sulla valigia solo quando quella valigia esiste davvero (palmer), con silenzio intenzionale negli altri rami.",
    "values": [
     {
      "name": "letter_o_observation_source",
      "domain": [
       "cooper_primary",
       "hawk_preserved"
      ],
      "used_in": "m9_present_truman (pagine di nodo, prima del widget)",
      "coverage": "totale"
     },
     {
      "name": "sarah_support_state",
      "domain": [
       "none",
       "vice"
      ],
      "used_in": "m9_present_truman (ramo accettato)",
      "coverage": "totale"
     },
     {
      "name": "warning_target",
      "domain": [
       "palmer",
       "centrale",
       "nessuno"
      ],
      "used_in": "m9_present_truman (ramo accettato, eco valigia)",
      "coverage": "palmer + assenza intenzionale non-palmer (nessuna valigia inventata)"
     },
     {
      "name": "promise_stance",
      "domain": [
       "accompagno",
       "autonomia",
       "prudenza"
      ],
      "used_in": "m9_verifica_taxi (eco investigativa solo per accompagno) + m9_present_truman (taccuino degli orari)",
      "coverage": "totale; accompagno registra la doppia organizzazione, gli altri rami non inventano un accordo"
     }
    ]
   },
   "carryover_evidence": [
    {
     "evidence": "T_SARAH_VISIONE",
     "diegetic_source": "data.js — sarah_visione (palmer, Atto 4)",
     "when": {
      "flag": "sarah_visione_ascoltata"
     },
     "attachable_only": true,
     "never_in_support_min": true,
     "note": "[N] evidenza nata nel layer classico solo dopo la conversazione fisica con Sarah (flag sarah_visione_ascoltata), allegabile come ORIENTAMENTO e mai base procedurale. Nessun atto4 implicito concede conoscenza al player."
    }
   ],
   "completion": {
    "when": {
     "node_done": "m9_arrivo"
    },
    "sets": []
   },
   "objectives": [
    {
     "id": "obj_m9_4",
     "priority": 400,
     "when": {
      "all": [
       {
        "proposition_path": "P6.social_status.accepted_by",
        "contains": "truman"
       },
       {
        "node_done": "m9_present_truman"
       }
      ]
     },
     "text": "Leland Palmer è alla centrale. Decidete come parlargli.",
     "provenance_note": "[L] testo esatto del Lock §3-B2. Obiettivo TERMINALE di M9 (passaggio a M10): gated sul nodo che lo CONSEGNA (node_done m9_present_truman), non sul solo stato di accettazione."
    },
    {
     "id": "obj_m9_3",
     "priority": 300,
     "when": {
      "all": [
       {
        "proposition_path": "P6.formulation.status",
        "equals": "formulated"
       },
       {
        "not": {
         "proposition_path": "P6.social_status.accepted_by",
         "contains": "truman"
        }
       }
      ]
     },
     "text": "Porta a Truman una contraddizione che regga.",
     "provenance_note": "[L] testo esatto del Lock §2 (obiettivo della missione; identico a obj_m8_4, che M8 consegna post-stazione). Resta attivo anche dopo una presentazione RESPINTA (allegato incompleto): la ripresentazione è il rimedio, mai un vicolo."
    },
    {
     "id": "obj_m9_2",
     "priority": 200,
     "when": {
      "all": [
       {
        "evidence": "D_TAXI"
       },
       {
        "not": {
         "proposition_path": "P6.formulation.status",
         "equals": "formulated"
        }
       }
      ]
     },
     "text": "Nel taccuino: metti il racconto di Leland accanto alla verifica.",
     "provenance_note": "[N] derivato dal Lock §3-B1 (la riga «(taccuino — Confronta: T_LELAND_TAXI ↔ D_TAXI)»); punta al taccuino, root sempre azionabile."
    },
    {
     "id": "obj_m9_1",
     "priority": 100,
     "when": {
      "all": [
       {
        "evidence": "T_LELAND_TAXI"
       },
       {
        "not": {
         "evidence": "D_TAXI"
        }
       }
      ]
     },
     "text": "Chiedi a Lucy se il taxi di Leland era prenotato.",
     "provenance_note": "[N] derivato dalla domanda del taccuino nel Lock §3-B1. Si attiva solo dopo che il player ha ascoltato fisicamente la dichiarazione di Leland: nessun ricordo fantasma."
    }
   ],
   "nodes": [
    {
     "id": "m9_verifica_taxi",
     "beat": "B1",
     "source_section": "M9-B1",
     "conditions": [
      {
       "evidence": "T_LELAND_TAXI"
      },
      {
       "not": {
        "evidence": "D_TAXI"
       }
      }
     ],
     "pages": [
      {
       "id": "m9.b1.verifica.p01",
       "mode": "notebook",
       "text": "Prima del ritrovamento, Leland ha detto: «Ho chiamato la Twin Peaks Taxi: passa da casa alle sette.» Quella corsa era prenotata?"
      },
      {
       "id": "m9.b1.verifica.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Lucy. Leland dice di aver prenotato la Twin Peaks Taxi per le sette, a casa Palmer. Può verificare?"
      },
      {
       "id": "m9.b1.verifica.p03",
       "mode": "dialogue",
       "speaker_id": "lucy",
       "display_name": "LUCY",
       "text": "(solleva la cornetta. Tre minuti dopo:) Ho chiamato la Twin Peaks Taxi. Nessuna corsa per casa Palmer alle sette. Nessuna prenotazione di Leland, né oggi né per domattina."
      },
      {
       "id": "m9.b1.verifica.accompagno.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "L'orario era compatibile col mio accompagnamento. La discrepanza è una sola: quel taxi non è mai stato prenotato.",
       "condition": {
        "value_is": {
         "name": "promise_stance",
         "equals": "accompagno"
        }
       }
      }
     ],
     "effects": [
      {
       "evidence": "D_TAXI"
      },
      {
       "notebook": {
        "id": "m9.note.taxi",
        "text": "Twin Peaks Taxi: nessuna corsa per casa Palmer alle sette; nessuna prenotazione di Leland, né oggi né per domattina."
       }
      }
     ],
     "invariant": "D_TAXI nasce SOLO dalla richiesta del player a Lucy e solo dopo la dichiarazione fisicamente ascoltata da Leland; nel ramo accompagno Cooper chiude il falso conflitto 7:00/7:10 e isola l'unica discrepanza: la prenotazione inesistente; nessun documento aperto da solo; nessuna riga afferma DOVE fosse Leland; nessuna riga attribuisce un omicidio; guardia di rientro sull'effetto proprio (not evidence D_TAXI)",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "lucy",
     "actor_id": "lucy",
     "interaction_slot": "primary",
     "mandatory_beat": true
    },
    {
     "id": "m9_cmp_taxi",
     "beat": "B1",
     "source_section": "M9-B1",
     "conditions": [
      {
       "evidence": "T_LELAND_TAXI"
      },
      {
       "evidence": "D_TAXI"
      }
     ],
     "pages": [
      {
       "id": "m9.b1.cmp_taxi.p01",
       "mode": "notebook",
       "text": "(Confronta: il racconto della partenza ↔ la verifica della corsa)"
      },
      {
       "id": "m9.b1.cmp_taxi.p02",
       "mode": "notebook",
       "text": "\"Ho chiamato la Twin Peaks Taxi\" — e la compagnia non ha ricevuto alcuna prenotazione."
      }
     ],
     "effects": [
      {
       "proposition": "P6",
       "to": "formulated",
       "created_from": [
        "T_LELAND_TAXI",
        "D_TAXI"
       ]
      }
     ],
     "invariant": "P6 nasce SOLO da questo confronto (dichiarazione ↔ verifica), con ENTRAMBI gli atomi; nessuna scelta: il Lock §3-B1 non offre alternative di formulazione; factual_status resta unconfirmed (confirmed_as_lie è M10-B6, mai qui); il confronto non prova l'omicidio — prova che il colloquio è necessario",
     "kind": "comparison",
     "channel": "notebook",
     "interaction_slot": "primary",
     "comparison_completion": "node_commit",
     "result": "TAXI_CLAIM_UNVERIFIED",
     "role": "proposition",
     "completion_when": {
      "proposition_path": "P6.formulation.status",
      "equals": "formulated"
     },
     "catalog_name_note": "propositions.json registra `born_from_comparison: \"cmp_taxi\"` come NOME LOGICO del confronto; l'id di nodo segue la convenzione di missione m9_* (stessa relazione di P3A/cmp_e8a_e8b ↔ m5_cmp_ring).",
     "completed_recall": {
      "section": "propositions",
      "page": {
       "id": "m9.notebook.cmp_taxi.recorded",
       "mode": "notebook",
       "text": "(Questo nesso è già registrato nelle Proposizioni.)"
      }
     }
    },
    {
     "id": "m9_present_truman",
     "beat": "B2",
     "source_section": "M9-B2",
     "conditions": [
      {
       "proposition_path": "P6.formulation.status",
       "equals": "formulated"
      }
     ],
     "pages": [
      {
       "id": "m9.b2.present.p01",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "(non alza gli occhi dal fascicolo) Dimmi che non sei qui per la casa Palmer."
      },
      {
       "id": "m9.b2.present.eco_o.cooper",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "La O di Maddy: l'ho vista io, sotto l'unghia.",
       "condition": {
        "value_is": {
         "name": "letter_o_observation_source",
         "equals": "cooper_primary"
        }
       },
       "conditional_note": "eco M8 [Lock §6]: una riga di Cooper in B2-M9, versione cooper_primary"
      },
      {
       "id": "m9.b2.present.eco_o.hawk",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "La O di Maddy: Hawk me l'ha descritta come si descrive una ferita.",
       "condition": {
        "value_is": {
         "name": "letter_o_observation_source",
         "equals": "hawk_preserved"
        }
       },
       "conditional_note": "eco M8 [Lock §6]: versione hawk_preserved. Arrivare secondi cambia UNA riga, mai il gate."
      }
     ],
     "presentation": {
      "target_actor_id": "truman",
      "options_from": "formulated_propositions_only",
      "auto_show_provenance": false,
      "attachment": {
       "mode": "manual",
       "from": "acquired_evidence",
       "declared_for": "C9-B",
       "note": "[Lock §3-B2] «P6: allegato MANUALE — T_LELAND_TAXI + D_TAXI; qui sbagliare conta». La provenienza NON si mostra da sola (auto_show_provenance false): la selezione è del player e determina il ramo."
      },
      "on": {
       "P6": {
        "attachment_required": [
         "T_LELAND_TAXI",
         "D_TAXI"
        ],
        "by_support": {
         "complete": {
          "when_attached_all": [
           "T_LELAND_TAXI",
           "D_TAXI"
          ],
          "result": "accepted",
          "reason_code": "SUFFICIENT_RELEVANT_SUPPORT",
          "acceptance_type": "colloquio_necessario",
          "pages": [
           {
            "id": "m9.b2.p6.accept.p01",
            "mode": "dialogue",
            "speaker_id": "cooper",
            "display_name": "COOPER",
            "text": "Prima del ritrovamento, Leland disse che Maddy sarebbe partita domattina e che aveva chiamato lui il taxi. Non esiste alcuna prenotazione."
           },
           {
            "id": "m9.b2.p6.accept.p02",
            "mode": "dialogue",
            "speaker_id": "truman",
            "display_name": "TRUMAN",
            "text": "Il lutto confonde, Cooper. Un uomo che ha perso la figlia—"
           },
           {
            "id": "m9.b2.p6.accept.p03",
            "mode": "dialogue",
            "speaker_id": "cooper",
            "display_name": "COOPER",
            "text": "Ha nominato la compagnia, casa Palmer e le sette. Il registro non ha la prenotazione.",
            "provenance_note": "[N→L] cronologia re-lockata dopo il carryover fisico da Atto 4; revisione craft: Cooper oppone fatti verificabili senza generalizzare il lutto."
           },
           {
            "id": "m9.b2.p6.accept.valigia.truman",
            "mode": "dialogue",
            "speaker_id": "truman",
            "display_name": "TRUMAN",
            "text": "E la valigia era ancora nell'ingresso, con il biglietto per Sarah. Questo lo so io.",
            "condition": {
             "value_is": {
              "name": "warning_target",
              "equals": "palmer"
             }
            },
            "conditional_note": "eco M8 [Lock §1]: se warning_target=palmer la valigia e il biglietto erano ancora in casa — Truman lo sa e lo dice"
           },
           {
            "id": "m9.b2.p6.accept.p04",
            "mode": "dialogue",
            "speaker_id": "truman",
            "display_name": "TRUMAN",
            "text": "(pausa lunga) La compagnia può aver perso la corsa."
           },
           {
            "id": "m9.b2.p6.accept.p05",
            "mode": "dialogue",
            "speaker_id": "cooper",
            "display_name": "COOPER",
            "text": "Può. Allora lo chiariamo: di persona, con calma, da persona informata. È il suo diritto — ed è il nostro lavoro."
           },
           {
            "id": "m9.b2.p6.accept.sarah.vice",
            "mode": "dialogue",
            "speaker_id": "lucy",
            "display_name": "LUCY",
            "text": "Andy è ancora con Sarah. Dice che non ha ancora chiesto \"chi\".",
            "condition": {
             "value_is": {
              "name": "sarah_support_state",
              "equals": "vice"
             }
            },
            "conditional_note": "eco M8 [Lock §3-B2]: ramo sarah_support_state = vice, testo esatto"
           },
           {
            "id": "m9.b2.p6.accept.sarah.none",
            "mode": "dialogue",
            "speaker_id": "truman",
            "display_name": "TRUMAN",
            "text": "(si alza; prende il cappello come si prende un peso)",
            "condition": {
             "value_is": {
              "name": "sarah_support_state",
              "equals": "none"
             }
            },
            "conditional_note": "eco M8 [Lock §3-B2]: ramo «altrimenti», testo e speaker esatti del Lock (Act 5 pass 01: era didascalia)"
           },
           {
            "id": "m9.b2.p6.accept.p06",
            "mode": "dialogue",
            "speaker_id": "truman",
            "display_name": "TRUMAN",
            "text": "Lo chiamo io. A casa sua non mando nessuno con la divisa."
           }
          ],
          "effects": [
           {
            "set": "atto5"
           },
           {
            "notebook": {
             "id": "m9.note.convocazione",
             "text": "Leland Palmer è atteso alla centrale. Un colloquio da persona informata: nessun provvedimento, nessuna divisa a casa sua."
            }
           }
          ]
         },
         "missing_corroboration": {
          "when_missing_any": [
           "T_LELAND_TAXI",
           "D_TAXI"
          ],
          "partition_note": "il Lock §3-B2 nomina esplicitamente il caso «P6 senza D_TAXI»; la condizione è generalizzata a MANCA UNO QUALUNQUE degli atomi richiesti, così `complete` (li ha tutti) e `missing_corroboration` (ne manca almeno uno) partizionano TOTALMENTE lo spazio degli allegati — nessuna combinazione senza ramo.",
          "result": "rejected",
          "reason_code": "NO_CORROBORATION",
          "retry": true,
          "pages": [
           {
            "id": "m9.b2.p6.no_corroboration.p01",
            "mode": "dialogue",
            "speaker_id": "truman",
            "display_name": "TRUMAN",
            "text": "Una frase detta nel dolore non è una contraddizione. Fammi vedere la verifica."
           }
          ]
         }
        },
        "already_rejected_page": {
         "id": "m9.b2.p6.already_rejected",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "Me l'hai già mostrato. Non è cambiato niente."
        },
        "attachment_responses": {
         "T_SARAH_VISIONE": {
          "page": {
           "id": "m9.b2.p6.visione",
           "mode": "dialogue",
           "speaker_id": "truman",
           "display_name": "TRUMAN",
           "text": "Questo non entra in un fascicolo, Cooper. Ma capisco perché guardi da quella parte."
          },
          "note": "risposta ADDITIVA a un allegato non procedurale: non cambia il ramo né il verdetto, non entra in nessun support_min. Costrutto dichiarato (schema-delta §2c)."
         }
        }
       },
       "P8": {
        "result": "rejected",
        "reason_code": "VALID_BUT_NOT_PROCEDURAL",
        "pages": [
         {
          "id": "m9.b2.p8.p01",
          "mode": "dialogue",
          "speaker_id": "truman",
          "display_name": "TRUMAN",
          "text": "Lo tengo a mente. Ma non convoco un uomo per una teoria."
         }
        ],
        "already_rejected_page": {
         "id": "m9.b2.p8.already_rejected",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "Me l'hai già mostrato. Non è cambiato niente."
        }
       },
       "P7": {
        "result": "rejected",
        "reason_code": "VALID_BUT_NOT_PROCEDURAL",
        "pages": [
         {
          "id": "m9.b2.p7.p01",
          "mode": "dialogue",
          "speaker_id": "truman",
          "display_name": "TRUMAN",
          "text": "Lo tengo a mente. Ma non convoco un uomo per una teoria."
         }
        ],
        "already_rejected_page": {
         "id": "m9.b2.p7.already_rejected",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "Me l'hai già mostrato. Non è cambiato niente."
        }
       },
       "_none_formulated": {
        "result": "rejected",
        "reason_code": "NOT_YET_FORMULATED",
        "pages": [
         {
          "id": "m9.b2.none_formulated.p01",
          "mode": "dialogue",
          "speaker_id": "truman",
          "display_name": "TRUMAN",
          "text": "Non ho una contraddizione da giudicare, Cooper. Portamene una che regga."
         }
        ]
       }
      }
     },
     "repeat": {
      "id": "m9.repeat.present",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "Leland verrà a piedi. Preparo domande e un tavolo libero: questa resta una convocazione volontaria."
     },
     "effects": [],
     "invariant": "P6 è l'UNICA base procedurale: P7/P8 sono annotate e mai accettate come base (VALID_BUT_NOT_PROCEDURAL); la visione di Sarah è respinta come atto e riconosciuta come direzione, mai come prova; l'allegato è MANUALE e sbagliarlo COSTA (NO_CORROBORATION, ripresentabile); Truman VUOLE sbagliarsi e obietta una volta sola (il lutto), poi firma la convocazione dell'amico; nessuna riga attribuisce un omicidio, nessun arresto, nessuna divisa a casa Palmer; l'eco M8 (letter_o_observation_source / sarah_support_state / warning_target) cambia RIGHE, mai il gate; atto5 nasce QUI (unico writer): il mondo classico diventa vero — Leland alla centrale",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "truman",
     "actor_id": "truman",
     "interaction_slot": "primary",
     "completion_when": {
      "proposition_path": "P6.social_status.accepted_by",
      "contains": "truman"
     },
     "mandatory_beat": true
    },
    {
     "id": "m9_arrivo",
     "beat": "B3",
     "source_section": "M9-B3",
     "conditions": [
      {
       "proposition_path": "P6.social_status.accepted_by",
       "contains": "truman"
      },
      {
       "flag": "atto5"
      }
     ],
     "pages": [
      {
       "id": "m9.b3.arrivo.p01",
       "mode": "action",
       "text": "(Leland arriva da solo, a piedi. Saluta Lucy per nome. Il nodo della cravatta è perfetto; la barba, di tre giorni.)"
      },
      {
       "id": "m9.b3.arrivo.p02",
       "mode": "dialogue",
       "speaker_id": "leland",
       "display_name": "LELAND",
       "text": "Lucy. Tuo padre ha poi sistemato la grondaia?"
      },
      {
       "id": "m9.b3.arrivo.p03",
       "mode": "dialogue",
       "speaker_id": "lucy",
       "display_name": "LUCY",
       "text": "(la macchina si ferma; guarda la stanza in fondo; riprende) Sì, signor Palmer. A ottobre."
      },
      {
       "id": "m9.b3.arrivo.p04",
       "mode": "dialogue",
       "speaker_id": "leland",
       "display_name": "LELAND",
       "text": "(a Truman) Harry. Mi hai chiesto di chiarire una partenza. Le partenze, di questi tempi, sono la cosa più difficile da chiarire."
      },
      {
       "id": "m9.b3.arrivo.p05",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "Ti ringrazio di essere venuto, Leland. È una formalità che dobbiamo a tutti."
      },
      {
       "id": "m9.b3.arrivo.p06",
       "mode": "dialogue",
       "speaker_id": "leland",
       "display_name": "LELAND",
       "text": "(posa il cappotto, siede al centro esatto della sedia) Allora facciamola bene."
      },
      {
       "id": "m9.b3.arrivo.p07",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Diane. Nodo perfetto, barba di tre giorni. Due righe separate."
      }
     ],
     "effects": [],
     "repeat": {
      "id": "m9.repeat.arrivo",
      "mode": "dialogue",
      "speaker_id": "cooper",
      "display_name": "COOPER",
      "text": "La panca è vuota e la cornetta ancora calda. Leland è già nella stanza in fondo."
     },
     "invariant": "arrivo VOLONTARIO: da solo, a piedi, senza scorta — nessun arresto, nessun provvedimento, nessuna aura; Leland è persona informata, cordiale, esatto (il nodo della cravatta perfetto, la barba di tre giorni); NESSUN segnale BOB in M9 (i due segnali — ritratto e cambio di registro — esistono SOLO in M10-B5); nessuna battuta assolve nessuno; nessuna guardia `not node_done` (renderebbe il repeat irraggiungibile — lezione C8-A.1 B6)",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary",
     "mandatory_beat": true,
     "provenance_note": "[P] leland è NPC reale di sheriff (js/glue.js), condizionato a `flag:atto5` && `!flag:leland_morto`: la presenza fisica combacia con il gate narrativo perché atto5 è scritto dalla presentazione accettata. Il posizionamento/cammino è C9-E."
    }
   ],
   "node_count": {
    "runtime_total": 4
   }
  };
  D.missions.M10 = {
   "narrative_package": "narrative-v1.0",
   "mission": "M10",
   "title": "L'interrogatorio",
   "source": {
    "document": "M9-M10 v1.1.1 CONFESSION LOCK.md",
    "file": "M9-M10 v1.1 (confession lock).md",
    "sections": "§4 (ordine della scena e matrice) + §5 (script, sorgente unica; B1-B10 come sezioni) + §6 (dati) + §7 (scope/test)",
    "package": "narrative-v1.0"
   },
   "schema_delta": "narrative/schema-deltas/M10.md",
   "entry_condition": {
    "all": [
     {
      "flag": "atto5"
     },
     {
      "node_done": "m9_arrivo"
     }
    ]
   },
   "entry_note": "[N] M10 comincia dove M9 consegna Leland alla centrale (node_done m9_arrivo == M9.completion.when) con atto5 scritto dall'unica presentazione accettata. La scena vive su sheriff, attore leland (ACT5_LELAND_STATION): una sola root (m10_soglia), il resto della scena è una catena `next` di nodi non esposti.",
   "reads_from_earlier": {
    "note": "M10 legge valori/evidenze scritti prima e non ne riscrive nessuno.",
    "values": [
     {
      "name": "promise_stance",
      "used_in": "m10_apertura (taccuino chiuso sugli orari)",
      "coverage": "totale (value_set; M8 lo scrive sempre)"
     },
     {
      "name": "warning_target",
      "used_in": "m10_domande personale (biglietto)",
      "coverage": "palmer (letto / riferito da Truman) + fallback"
     },
     {
      "name": "focus_destination",
      "used_in": "m10_domande personale (chi ha reso il biglietto)",
      "coverage": "palmer | altro"
     }
    ],
    "evidence": [
     {
      "id": "JACQUES_MIDNIGHT_CLAIM",
      "used_in": "m10_domande probatorio",
      "writer": "M6 (tattica prova)"
     },
     {
      "id": "JACQUES_LIST_GIVEN",
      "used_in": "m10_affioramento",
      "writer": "M6 (tattica pressione)"
     },
     {
      "id": "JACQUES_THIRD_MAN_DETAIL",
      "used_in": "m10_affioramento",
      "writer": "M6 (tattica falsa sicurezza)"
     }
    ]
   },
   "material_admissions": {
    "record_shape": "{ recorded, speaker_register } per fatto: `recorded` = value_set, `speaker_register` = il valore (dominio speaker_register)",
    "facts": [
     {
      "fact": "taxi_lie",
      "value": "material_admissions.taxi_lie",
      "domain": "speaker_register"
     },
     {
      "fact": "traincar_presence",
      "value": "material_admissions.traincar_presence",
      "domain": "speaker_register"
     },
     {
      "fact": "laura_homicide",
      "value": "material_admissions.laura_homicide",
      "domain": "speaker_register"
     },
     {
      "fact": "maddy_homicide",
      "value": "material_admissions.maddy_homicide",
      "domain": "speaker_register"
     },
     {
      "fact": "maddy_body_transport",
      "value": "material_admissions.maddy_body_transport",
      "domain": "speaker_register"
     },
     {
      "fact": "letters",
      "value": "material_admissions.letters",
      "domain": "speaker_register"
     }
    ],
    "never_boolean": true
   },
   "completion": {
    "when": {
     "flag": "leland_morto"
    },
    "sets": []
   },
   "objectives": [
    {
     "id": "obj_m10_2",
     "priority": 200,
     "when": {
      "flag": "leland_morto"
     },
     "text": "Torna alla Loggia (Glastonbury Grove).",
     "provenance_note": "[L] testo esatto del Lock §5-B10 («obiettivo: Torna alla Loggia (Glastonbury Grove).»)."
    },
    {
     "id": "obj_m10_1",
     "priority": 100,
     "when": {
      "all": [
       {
        "node_done": "m9_arrivo"
       },
       {
        "not": {
         "flag": "leland_morto"
        }
       }
      ]
     },
     "text": "Leland Palmer è alla centrale. Decidete come parlargli.",
     "provenance_note": "[L] testo esatto del Lock §3-B2 (obiettivo consegnato da M9, identico a obj_m9_4). Il Lock non scrive un obiettivo per il colloquio già iniziato: SCRIPT GAP dichiarato nel report; l'obiettivo resta questo fino a leland_morto."
    }
   ],
   "nodes": [
    {
     "id": "m10_soglia",
     "beat": "B1",
     "source_section": "M10-B1",
     "prompt": "Il metodo.",
     "conditions": [
      {
       "node_done": "m9_arrivo"
      },
      {
       "flag": "atto5"
      },
      {
       "not": {
        "node_done": "m10_fermo"
       }
      }
     ],
     "pages": [
      {
       "id": "m10.b1.soglia.p01",
       "mode": "action",
       "text": "(Prima della porta. Il corridoio nord è vuoto: Truman l'ha voluto così.)"
      },
      {
       "id": "m10.b1.soglia.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(al registratore personale, a voce bassissima) Diane. Ipotesi da non verbalizzare: chi ha disposto quella scena voleva essere letto. Vado a vedere se vale anche per le parole.",
       "recorded_on": "personal_recorder"
      },
      {
       "id": "m10.b1.soglia.p03",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "Da che parte lo prendiamo, Cooper? Dalle carte, dalla famiglia — o da quello che tu sai e io no?"
      }
     ],
     "choices": [
      {
       "id": "method_probatorio",
       "label": "Dalle carte",
       "effects": [
        {
         "value": "m10_method",
         "to": "probatorio"
        }
       ]
      },
      {
       "id": "method_personale",
       "label": "Dalla famiglia",
       "effects": [
        {
         "value": "m10_method",
         "to": "personale"
        }
       ]
      },
      {
       "id": "method_intuitivo",
       "label": "Da ciò che ho visto",
       "effects": [
        {
         "value": "m10_method",
         "to": "intuitivo"
        }
       ]
      }
     ],
     "next": "m10_apertura",
     "completion_when": {
      "value_set": "m10_method"
     },
     "role": "tactic",
     "mandatory_beat": true,
     "invariant": "unico writer di m10_method (write-once); la scelta avviene sulla SOGLIA, prima dell'ingresso, del consenso e del nastro (Lock §4 ordine definitivo); l'ipotesi di Cooper vive SOLO nel registratore personale, mai sul verbale; nessuna guardia `not value_set` sulle condizioni: a scelta fatta il nodo resta la root e riprende la catena (continuation) fino al fermo; guardia `not node_done m10_fermo` su tutti i nodi di Leland: dopo il fermo il corpo non c'è (V5b) e la ripresa passa a m10_morte su Truman",
     "kind": "choice",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary",
     "provenance_note": "[L] prompt = intestazione del Lock «[SCELTA — il metodo]» (la battuta di Truman è già l'ultima pagina: test/choice-prompt-dedup vieta di ripeterla); etichette = i tre sintagmi della stessa battuta / del Lock «[SCELTA — il metodo]» senza il tag tra parentesi (probatorio/personale/intuitivo sono valori di dominio, mai testo a schermo)."
    },
    {
     "id": "m10_apertura",
     "beat": "B2",
     "source_section": "M10-B2",
     "conditions": [
      {
       "value_set": "m10_method"
      },
      {
       "not": {
        "node_done": "m10_fermo"
       }
      }
     ],
     "pages": [
      {
       "id": "m10.b2.apertura.p01",
       "mode": "action",
       "text": "(La stanza: il tavolo, la lampada, il registratore troppo grande. Leland al centro esatto.)"
      },
      {
       "id": "m10.b2.apertura.p02",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Signor Palmer, vorremmo registrare. È un colloquio, non un interrogatorio: può fermarci quando vuole."
      },
      {
       "id": "m10.b2.apertura.p03",
       "mode": "dialogue",
       "speaker_id": "leland",
       "display_name": "LELAND",
       "text": "Registrate. Le parole scritte male sono l'unica cosa che temo."
      },
      {
       "id": "m10.b2.apertura.p04",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(avvia. La spia: due pixel rossi.) Verbale di colloquio. Presenti: l'interessato, lo sceriffo Truman, l'agente Cooper. Oggetto: chiarire il resoconto della partenza di Madeleine Ferguson e le circostanze connesse.",
       "recorded_on": "tape",
       "tape_opening": "neutral"
      },
      {
       "id": "m10.b2.apertura.promise",
       "mode": "action",
       "text": "(Il taccuino di Cooper resta chiuso su una pagina con tre orari.)",
       "condition": {
        "value_set": "promise_stance"
       },
       "conditional_note": "eco M8 promise_stance [Lock §5-B2, §6]: il taccuino chiuso sugli orari"
      }
     ],
     "effects": [],
     "next": "m10_domande",
     "exposed": false,
     "mandatory_beat": true,
     "invariant": "consenso al colloquio PRIMA dell'avvio del nastro; l'apertura del verbale è NEUTRA (presenti + oggetto, nessuna ipotesi a nastro); il metodo è già scritto (value_set m10_method)",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary"
    },
    {
     "id": "m10_domande",
     "beat": "B3-B4",
     "source_section": "M10-B3-B4",
     "conditions": [
      {
       "node_done": "m10_apertura"
      },
      {
       "not": {
        "node_done": "m10_fermo"
       }
      }
     ],
     "pages": [],
     "pages_by_value": {
      "value": "m10_method",
      "cases": {
       "probatorio": [
        {
         "id": "m10.b3.probatorio.p01",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Il taxi, signor Palmer. Ci dia il nome dell'autista e l'ora della corsa."
        },
        {
         "id": "m10.b3.probatorio.p02",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "Eddie, credo. O il ragazzo nuovo. Le sette, le sette e un quarto. Il dolore archivia male, agente."
        },
        {
         "id": "m10.b3.probatorio.p03",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "La compagnia non ha prenotazioni per casa Palmer. Né oggi né per domattina."
        },
        {
         "id": "m10.b3.probatorio.p04",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(una pausa da avvocato) Allora ho sbagliato compagnia. O il registro ha un difetto. Quale preferisce mettere a verbale?"
        },
        {
         "id": "m10.b3.probatorio.p05",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "(seconda domanda) Mi mostri il viaggio, allora. Un biglietto, una telefonata a Missoula — qualcosa che dica che Maddy è partita davvero."
        },
        {
         "id": "m10.b3.probatorio.p06",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(le mani si fermano sul tavolo) Le telefonate le faccio dal mio studio. Lo studio è casa mia. Casa mia non si tocca."
        },
        {
         "id": "m10.b3.probatorio.midnight",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "(piatto, dal suo angolo) La finestra di quella notte è stretta, Leland. Il merci di mezzanotte l'ha stretta lui.",
         "condition": {
          "evidence": "JACQUES_MIDNIGHT_CLAIM"
         },
         "conditional_note": "eco M6 jacques_midnight_claim [Lock §4, §5-B3-B4]: finestra via Truman"
        },
        {
         "id": "m10.b3.probatorio.nota",
         "mode": "notebook",
         "text": "la precisione si incrina dove finiscono le carte e comincia la casa."
        }
       ],
       "personale": [
        {
         "id": "m10.b3.personale.p01",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Quando ha smesso di dormire, Leland?"
        },
        {
         "id": "m10.b3.personale.p02",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(la cordialità si ferma) Si vede così tanto? (pausa) Da febbraio. Sarah dice che parlo, di notte. Io non ricordo mai con chi."
        },
        {
         "id": "m10.b3.personale.biglietto_letto",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Ha visto il biglietto? «Torno lunedì. Non svegliarla.»",
         "condition": {
          "all": [
           {
            "value_is": {
             "name": "warning_target",
             "equals": "palmer"
            }
           },
           {
            "value_is": {
             "name": "focus_destination",
             "equals": "palmer"
            }
           }
          ]
         },
         "conditional_note": "[Lock §5] «[se il player ha letto il biglietto a Palmer]»: warning_target=palmer ∧ focus_destination=palmer (m8.c.route_palmer.p02 rende il biglietto)"
        },
        {
         "id": "m10.b3.personale.biglietto_truman",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Truman ha trovato un biglietto per Sarah. Lei lo aveva visto?",
         "condition": {
          "all": [
           {
            "value_is": {
             "name": "warning_target",
             "equals": "palmer"
            }
           },
           {
            "not": {
             "value_is": {
              "name": "focus_destination",
              "equals": "palmer"
             }
            }
           }
          ]
         },
         "conditional_note": "[Lock §5] «[biglietto riferito da Truman]»: warning_target=palmer ∧ focus_destination≠palmer (m8.f.station.p_valigia rende il biglietto)"
        },
        {
         "id": "m10.b3.personale.corriera",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Maddy parlava della corriera delle 7:40. Lei conosceva il suo piano?",
         "condition": {
          "not": {
           "value_is": {
            "name": "warning_target",
            "equals": "palmer"
           }
          }
         },
         "conditional_note": "[Lock §4, §5] «[fallback senza biglietto]»: warning_target≠palmer — nessuna valigia inventata"
        },
        {
         "id": "m10.b3.personale.visto",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(guarda le proprie mani) L'ho visto.",
         "condition": {
          "value_is": {
           "name": "warning_target",
           "equals": "palmer"
          }
         },
         "lock_composite": [
          "(guarda le proprie mani)",
          "L'ho visto."
         ],
         "conditional_note": "[Lock §5] «[se biglietto]»: didascalia comune della riga + variante"
        },
        {
         "id": "m10.b3.personale.orario",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(guarda le proprie mani) Conoscevo l'orario. Ho pensato: anche lei. Da quella casa vogliono andarsene tutte.",
         "condition": {
          "not": {
           "value_is": {
            "name": "warning_target",
            "equals": "palmer"
           }
          }
         },
         "lock_composite": [
          "(guarda le proprie mani)",
          "Conoscevo l'orario. Ho pensato: anche lei. Da quella casa vogliono andarsene tutte."
         ],
         "conditional_note": "[Lock §5] «[fallback]»: lettura letterale — «Ho pensato: anche lei…» appartiene al fallback (vedi report, ambiguità di script)"
        },
        {
         "id": "m10.b3.personale.p05",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "(si sporge) Cooper. Piano. C'è un limite anche qui dentro."
        },
        {
         "id": "m10.b3.personale.p06",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Laura nascondeva le cose dove pensava che lei non guardasse. Il biglietto era sul sedile divelto."
        },
        {
         "id": "m10.b3.personale.p07",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "No. Nella terra.",
         "killer_only_bridge": true
        },
        {
         "id": "m10.b3.personale.p08",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Questo non gliel'ho detto."
        },
        {
         "id": "m10.b3.personale.nota",
         "mode": "notebook",
         "text": "la casa risponde prima dell'uomo."
        }
       ],
       "intuitivo": [
        {
         "id": "m10.b3.intuitivo.p01",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Le dice niente: \"FUOCO CAMMINA CON ME\"?"
        },
        {
         "id": "m10.b3.intuitivo.p02",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(senza pausa) ...il mago desidera vedere. Uno canta fra due mondi. (si ferma, come svegliato) Che cosa stavo..."
        },
        {
         "id": "m10.b3.intuitivo.p03",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Sono parole che non le ho dato. Continui.",
         "recorded_as": "behaviour_not_evidence"
        },
        {
         "id": "m10.b3.intuitivo.p04",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "(seconda domanda) Ho visto un uomo. Capelli lunghi, grigi. Sorrideva. Le è familiare?"
        },
        {
         "id": "m10.b3.intuitivo.p05",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(la testa si inclina, lentamente) E lei dov'era, agente, quando l'ha visto? Da che parte del sonno?"
        },
        {
         "id": "m10.b3.intuitivo.p06",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(la voce si abbassa, ma il volto non cambia) Il vagone canta ancora. Il biglietto dorme nella terra.",
         "killer_only_bridge": true
        },
        {
         "id": "m10.b3.intuitivo.p07",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Il biglietto era nella terra. Dettaglio mai reso pubblico."
        },
        {
         "id": "m10.b3.intuitivo.p08",
         "mode": "action",
         "text": "(Truman posa la penna. Si alza.)"
        },
        {
         "id": "m10.b3.intuitivo.p09",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "(sulla porta, senza alzare la voce) Ho bisogno che quello che sento abbia un ordine. Torno quando ce l'ha. (esce)",
         "cast_exit": "truman"
        },
        {
         "id": "m10.b3.intuitivo.p10",
         "mode": "action",
         "text": "(La stanza resta in due. Il fruscio del nastro è l'unico terzo.)"
        },
        {
         "id": "m10.b3.intuitivo.nota",
         "mode": "notebook",
         "text": "risponde a domande che non ho fatto. Completa quelle che non finisco."
        }
       ]
      }
     },
     "effects": [],
     "next": "m10_affioramento",
     "exposed": false,
     "mandatory_beat": true,
     "invariant": "tre operazioni diverse sul TESTO: probatorio = le carte fino alla soglia di casa; personale = il biglietto (tre varianti, mai valigia inventata) e il ponte killer-only «Nella terra»; intuitivo = versi non forniti da Cooper, il ponte killer-only e il COSTO scritto (Truman esce: ACT5_TRUMAN_OUT_INTUITIVE); nessuna ammissione qui",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary"
    },
    {
     "id": "m10_affioramento",
     "beat": "B5",
     "source_section": "M10-B5",
     "conditions": [
      {
       "node_done": "m10_domande"
      },
      {
       "not": {
        "node_done": "m10_fermo"
       }
      }
     ],
     "pages": [
      {
       "id": "m10.b5.affioramento.p01",
       "mode": "action",
       "text": "(Il ritratto della battuta cambia: il volto è quello dello sconosciuto del sogno. Il corpo sulla sedia resta Leland.)",
       "portrait": "bob",
       "bob_surface": "portrait_shown"
      },
      {
       "id": "m10.b5.affioramento.p02",
       "mode": "dialogue",
       "speaker_id": "voce",
       "display_name": "VOCE",
       "text": "Leland dice che dorme. Leland dice molte cose.",
       "portrait": "bob",
       "bob_surface": "register_shift"
      },
      {
       "id": "m10.b5.affioramento.list",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(piano, a Truman) Accendeva e spegneva. Senza fumare. (nessuna risposta: la ricorrenza resta un appunto)",
       "condition": {
        "all": [
         {
          "evidence": "JACQUES_LIST_GIVEN"
         },
         {
          "not": {
           "value_is": {
            "name": "m10_method",
            "equals": "intuitivo"
           }
          }
         }
        ]
       },
       "conditional_note": "eco M6 jacques_list_given [Lock §5-B5]. La riga è rivolta «a Truman»: nell'intuitivo Truman è FUORI dalla stanza (B3-B4), quindi la pagina è esclusa da quel ramo invece di contraddire la presenza — SCRIPT GAP, vedi report"
      },
      {
       "id": "m10.b5.affioramento.stove",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(al nastro) Ricorrenza a verbale: la stufa, guardata come si guarda una persona.",
       "condition": {
        "evidence": "JACQUES_THIRD_MAN_DETAIL"
       },
       "conditional_note": "eco M6 jacques_third_man_detail [Lock §5-B5]: ricorrenza, mai diagnosi"
      },
      {
       "id": "m10.b5.affioramento.osservazione",
       "mode": "notebook",
       "text": "il volto del sogno appare nel ritratto mentre parla Leland. Il corpo nella stanza resta il suo. Non so ancora come nominare il rapporto fra i due."
      }
     ],
     "effects": [
      {
       "set": "dream_face_recognized_in_leland_scene"
      }
     ],
     "next": "m10_confessione",
     "exposed": false,
     "mandatory_beat": true,
     "invariant": "DUE segnali soltanto (bob_surface: portrait_shown + register_shift), identici in tutti i metodi; osservazione, mai possessione: nessun flag di ospite, nessuna percentuale; dream_face_recognized_in_leland_scene è un'osservazione di Cooper",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary"
    },
    {
     "id": "m10_confessione",
     "beat": "B6",
     "source_section": "M10-B6",
     "conditions": [
      {
       "node_done": "m10_affioramento"
      },
      {
       "not": {
        "node_done": "m10_fermo"
       }
      }
     ],
     "pages": [],
     "pages_by_value": {
      "value": "m10_method",
      "cases": {
       "probatorio": [
        {
         "id": "m10.b6.probatorio.p01",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Torniamo alla scena. Il biglietto era appoggiato sul sedile divelto."
        },
        {
         "id": "m10.b6.probatorio.p02",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "Nella terra. (silenzio) Era nella terra."
        },
        {
         "id": "m10.b6.probatorio.p03",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Questo dettaglio non è mai uscito da questa centrale, signor Palmer. Come lo sa?"
        },
        {
         "id": "m10.b6.probatorio.p04",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(guarda le mani, a lungo. Quando parla, la voce è precisa — ed è peggio del tremito.) Perché ce l'ho messa io."
        },
        {
         "id": "m10.b6.probatorio.p05",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Il taxi."
        },
        {
         "id": "m10.b6.probatorio.p06",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "Mai chiamato. Ho mentito io. Questo è mio.",
         "admits": [
          "taxi_lie"
         ]
        },
        {
         "id": "m10.b6.probatorio.p07",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Chi ha ucciso Maddy Ferguson?"
        },
        {
         "id": "m10.b6.probatorio.p08",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "Io. (la precisione non trema) Dopo, l'ho portata al lago.",
         "admits": [
          "maddy_homicide",
          "maddy_body_transport"
         ]
        },
        {
         "id": "m10.b6.probatorio.p09",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Laura Palmer?"
        },
        {
         "id": "m10.b6.probatorio.p10",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(la voce di un uomo che detta un atto) Io. Al vagone.",
         "admits": [
          "laura_homicide",
          "traincar_presence"
         ]
        },
        {
         "id": "m10.b6.probatorio.p11",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Le lettere."
        },
        {
         "id": "m10.b6.probatorio.p12",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "R. O. Le ho lasciate io. Un pezzo alla volta. (il registro cambia a metà frase: il ritratto, per tre parole, non è il suo)",
         "admits": [
          "letters"
         ],
         "bob_surface": "register_shift"
        },
        {
         "id": "m10.b6.probatorio.p13",
         "mode": "action",
         "text": "(Truman scrive fitto. Il verbale, in questo metodo, è il più completo che la contea vedrà mai.)"
        }
       ],
       "personale": [
        {
         "id": "m10.b6.personale.p01",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "Volevano andarsene tutte, agente. Da quella casa se ne vanno tutte."
        },
        {
         "id": "m10.b6.personale.p02",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Non \"tutte\", signor Palmer. Laura. Cominci da Laura."
        },
        {
         "id": "m10.b6.personale.p03",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(piange senza rumore) Laura aveva paura di me. Da febbraio. Aveva ragione."
        },
        {
         "id": "m10.b6.personale.p04",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Dica che cosa ha fatto a Laura. Per lei — non per noi."
        },
        {
         "id": "m10.b6.personale.p05",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "L'ho uccisa io. Al vagone.",
         "admits": [
          "laura_homicide",
          "traincar_presence"
         ]
        },
        {
         "id": "m10.b6.personale.p06",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Maddy."
        },
        {
         "id": "m10.b6.personale.p07",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "Voleva solo il suo centralino. Conoscevo il suo orario e io... L'ho uccisa io. Poi l'ho portata al lago.",
         "admits": [
          "maddy_homicide",
          "maddy_body_transport"
         ]
        },
        {
         "id": "m10.b6.personale.p08",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Il taxi che ci ha raccontato."
        },
        {
         "id": "m10.b6.personale.p09",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "Mai chiamato. Ho mentito. Volevo che fosse partita. Che fosse vero.",
         "admits": [
          "taxi_lie"
         ]
        },
        {
         "id": "m10.b6.personale.p10",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Le lettere."
        },
        {
         "id": "m10.b6.personale.p11",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "R. O. Le ho lasciate io.",
         "admits": [
          "letters"
         ]
        },
        {
         "id": "m10.b6.personale.p12",
         "mode": "action",
         "text": "(Il blocco di Truman ha righe più corte, qui. Il verbale è vero e fragile insieme: emozioni agli atti.)"
        }
       ],
       "intuitivo": [
        {
         "id": "m10.b6.intuitivo.p01",
         "mode": "dialogue",
         "speaker_id": "voce",
         "display_name": "VOCE",
         "text": "Il vagone canta ancora. Chiedete alla terra che cosa le abbiamo dato.",
         "portrait": "bob",
         "bob_surface": "register_shift"
        },
        {
         "id": "m10.b6.intuitivo.p02",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Con parole sue, signor Palmer. Dov'era, la notte del vagone?"
        },
        {
         "id": "m10.b6.intuitivo.p03",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(piatto, come chi legge) Al vagone. C'ero io.",
         "admits": [
          "traincar_presence"
         ]
        },
        {
         "id": "m10.b6.intuitivo.p04",
         "mode": "dialogue",
         "speaker_id": "voce",
         "display_name": "VOCE",
         "text": "La piccola voleva volare a ovest. L'acqua l'ha tenuta.",
         "portrait": "bob",
         "bob_surface": "register_shift"
        },
        {
         "id": "m10.b6.intuitivo.p05",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "In forma semplice. Chi ha ucciso Maddy?"
        },
        {
         "id": "m10.b6.intuitivo.p06",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "Io. (piatto) Poi l'ho portata al lago.",
         "admits": [
          "maddy_homicide",
          "maddy_body_transport"
         ]
        },
        {
         "id": "m10.b6.intuitivo.p07",
         "mode": "action",
         "text": "(Truman rientra. Il blocco è aperto.)",
         "cast_entry": "truman"
        },
        {
         "id": "m10.b6.intuitivo.p08",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "Il taxi, Leland. A verbale."
        },
        {
         "id": "m10.b6.intuitivo.p09",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "Mai chiamato. La bugia è mia.",
         "admits": [
          "taxi_lie"
         ]
        },
        {
         "id": "m10.b6.intuitivo.p10",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "Le lettere. Parole sue, signor Palmer."
        },
        {
         "id": "m10.b6.intuitivo.p11",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "R sotto Laura. O sotto Maddy. Le ho lasciate io.",
         "admits": [
          "letters"
         ]
        },
        {
         "id": "m10.b6.intuitivo.p12",
         "mode": "dialogue",
         "speaker_id": "cooper",
         "display_name": "COOPER",
         "text": "E Laura?"
        },
        {
         "id": "m10.b6.intuitivo.p13",
         "mode": "dialogue",
         "speaker_id": "leland",
         "display_name": "LELAND",
         "text": "(un silenzio lungo; poi, semplicemente) Io.",
         "admits": [
          "laura_homicide"
         ]
        },
        {
         "id": "m10.b6.intuitivo.p14",
         "mode": "action",
         "text": "(Il verbale alterna il semplice e l'impossibile: la contea leggerà, e deciderà come chiamarlo.)"
        }
       ]
      }
     },
     "effects": [
      {
       "value": "material_admissions.taxi_lie",
       "to": "leland_first_person"
      },
      {
       "value": "material_admissions.traincar_presence",
       "to": "leland_first_person"
      },
      {
       "value": "material_admissions.laura_homicide",
       "to": "leland_first_person"
      },
      {
       "value": "material_admissions.maddy_homicide",
       "to": "leland_first_person"
      },
      {
       "value": "material_admissions.maddy_body_transport",
       "to": "leland_first_person"
      },
      {
       "value": "material_admissions.letters",
       "to": "leland_first_person"
      },
      {
       "proposition": "P6",
       "factual_status": "confirmed_as_lie"
      },
      {
       "proposition": "P8",
       "factual_status": "corroborated"
      }
     ],
     "next": "m10_s3",
     "exposed": false,
     "mandatory_beat": true,
     "invariant": "stessi SEI fatti fissi in ogni metodo, tre operazioni (precisazioni forzate / ritorno ai nomi / distillazione); ogni ammissione materiale in PRIMA PERSONA di Leland (speaker LELAND, mai VOCE); effetti (sei record material_admissions per-fatto con speaker_register, P6 confirmed_as_lie, P8 corroborated) committati SOLO dopo l'ultima pagina; nessuna battuta assolve",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary"
    },
    {
     "id": "m10_s3",
     "beat": "B7",
     "source_section": "M10-B7",
     "prompt": "Il nastro.",
     "conditions": [
      {
       "value_set": "material_admissions.taxi_lie"
      },
      {
       "value_set": "material_admissions.traincar_presence"
      },
      {
       "value_set": "material_admissions.laura_homicide"
      },
      {
       "value_set": "material_admissions.maddy_homicide"
      },
      {
       "value_set": "material_admissions.maddy_body_transport"
      },
      {
       "value_set": "material_admissions.letters"
      },
      {
       "node_done": "m10_confessione"
      },
      {
       "not": {
        "node_done": "m10_fermo"
       }
      }
     ],
     "pages": [
      {
       "id": "m10.b7.s3.p01",
       "mode": "action",
       "text": "(Leland si ferma. Quando riprende, la voce cerca qualcosa che non è nella stanza.)"
      },
      {
       "id": "m10.b7.s3.p02",
       "mode": "dialogue",
       "speaker_id": "leland",
       "display_name": "LELAND",
       "text": "Adesso viene la parte che nessun foglio sa tenere, agente. Vuole che continui?"
      },
      {
       "id": "m10.b7.s3.p03",
       "mode": "action",
       "text": "(Truman rilegge il blocco: i fatti ci sono tutti. Guarda Cooper.)"
      }
     ],
     "choices": [
      {
       "id": "s3_on",
       "label": "Lascia girare.",
       "effects": [
        {
         "value": "s3",
         "to": "on"
        },
        {
         "value": "truman_testimony_state",
         "to": "not_needed"
        }
       ],
       "feedback_pages": [
        {
         "id": "m10.b7.s3.on.p01",
         "mode": "action",
         "text": "(La spia resta accesa.)"
        }
       ]
      },
      {
       "id": "s3_off",
       "label": "Ferma il registratore.",
       "effects": [
        {
         "value": "s3",
         "to": "off"
        },
        {
         "value": "truman_testimony_state",
         "to": "voluntary_witness"
        }
       ],
       "feedback_pages": [
        {
         "id": "m10.b7.s3.off.p01",
         "mode": "action",
         "text": "(Click. La spia muore.)"
        },
        {
         "id": "m10.b7.s3.off.p02",
         "mode": "dialogue",
         "speaker_id": "truman",
         "display_name": "TRUMAN",
         "text": "(chiude il blocco) Quello che sento da qui in poi, lo porto io. Se servirà, lo giuro a voce."
        }
       ]
      }
     ],
     "next": "m10_post_s3",
     "completion_when": {
      "value_set": "s3"
     },
     "exposed": false,
     "mandatory_beat": true,
     "invariant": "S3 disponibile SOLO con TUTTE e sei le material_admissions registrate (gate per-fatto, mai un booleano); unico writer di s3 e truman_testimony_state (write-once); S3-off NON cancella nulla: le ammissioni sono già committate in m10_confessione",
     "kind": "choice",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary",
     "role": "stance",
     "provenance_note": "[L] prompt = intestazione del Lock «[SCELTA — il nastro]» (la domanda di Leland è già una pagina); etichette testuali del Lock «[SCELTA — il nastro]»."
    },
    {
     "id": "m10_post_s3",
     "beat": "B7b",
     "source_section": "M10-B7b",
     "conditions": [
      {
       "value_set": "s3"
      },
      {
       "not": {
        "node_done": "m10_fermo"
       }
      }
     ],
     "spoken_in_all_paths": true,
     "recorded_if": {
      "value_is": {
       "name": "s3",
       "equals": "on"
      }
     },
     "witnessed_by_truman": true,
     "formal_testimony_if": {
      "value_is": {
       "name": "s3",
       "equals": "off"
      }
     },
     "pages": [
      {
       "id": "m10.b7b.segmento.p01",
       "mode": "dialogue",
       "speaker_id": "leland",
       "display_name": "LELAND",
       "text": "Avevo dodici anni. C'era una casa bianca, vicino al lago dei nonni. E un uomo che chiedeva di giocare."
      },
      {
       "id": "m10.b7b.segmento.p02",
       "mode": "dialogue",
       "speaker_id": "leland",
       "display_name": "LELAND",
       "text": "Diceva: ho un nome da persona perbene, piccolo. Come il tuo."
      },
      {
       "id": "m10.b7b.segmento.p03",
       "mode": "action",
       "text": "(Il ritratto della battuta cambia, per una frase sola.)",
       "portrait": "bob",
       "bob_surface": "portrait_shown"
      },
      {
       "id": "m10.b7b.segmento.p04",
       "mode": "dialogue",
       "speaker_id": "voce",
       "display_name": "VOCE",
       "text": "I pezzi del nome sono nostri. Li abbiamo lasciati perché qualcuno contasse.",
       "portrait": "bob",
       "bob_surface": "register_shift"
      },
      {
       "id": "m10.b7b.segmento.p05",
       "mode": "dialogue",
       "speaker_id": "leland",
       "display_name": "LELAND",
       "text": "(di nuovo il suo ritratto; la voce è stanca) Quando dormo, lui non dorme. Questo lo so. Il resto... il resto non so più di chi sia."
      },
      {
       "id": "m10.b7b.segmento.p06",
       "mode": "dialogue",
       "speaker_id": "leland",
       "display_name": "LELAND",
       "text": "Agente. Mia figlia... Laura. Potrà mai—"
      },
      {
       "id": "m10.b7b.segmento.p07",
       "mode": "action",
       "text": "(Cooper non risponde. Sposta la foto di Laura fuori dalla linea degli occhi di Leland: la tiene davanti a sé.)",
       "laura_photo": "kept_before_cooper"
      }
     ],
     "effects": [],
     "next": "m10_vittime",
     "exposed": false,
     "mandatory_beat": true,
     "invariant": "le STESSE parole in entrambi i rami S3 (nessuna pagina condizionata a s3); cambia solo se il nastro lo registra (recorded_if) e se Truman ne fa testimonianza formale (formal_testimony_if); la foto di Laura non va mai a faccia in giù; la domanda del perdono resta senza risposta",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary"
    },
    {
     "id": "m10_vittime",
     "beat": "B8",
     "source_section": "M10-B8",
     "conditions": [
      {
       "node_done": "m10_post_s3"
      },
      {
       "not": {
        "node_done": "m10_fermo"
       }
      }
     ],
     "pages": [
      {
       "id": "m10.b8.vittime.p01",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(al taccuino, dopo) Maddy Ferguson aveva scelto la corriera delle 7:40. Laura Palmer aveva nascosto un secondo diario. Le loro azioni restano nel fascicolo. Il perdono non è materia nostra."
      }
     ],
     "effects": [],
     "next": "m10_fermo",
     "exposed": false,
     "mandatory_beat": true,
     "invariant": "il beat-vittime viene DOPO la domanda del perdono: le due vittime nominate per le loro azioni; nessuna assoluzione",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary"
    },
    {
     "id": "m10_fermo",
     "beat": "B9",
     "source_section": "M10-B9",
     "conditions": [
      {
       "node_done": "m10_vittime"
      },
      {
       "not": {
        "node_done": "m10_fermo"
       }
      }
     ],
     "pages": [
      {
       "id": "m10.b9.fermo.p01",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "(in piedi, formale per la prima volta in vent'anni) Da questo momento sei in stato di fermo, Leland. Per i fatti che hai ammesso."
      },
      {
       "id": "m10.b9.fermo.p02",
       "mode": "action",
       "text": "(La cella: la branda rifatta con gli angoli tesi. Truman apre la porta lui stesso.)"
      },
      {
       "id": "m10.b9.fermo.p03",
       "mode": "action",
       "text": "(La porta si vede per intero, da fuori. La serratura fa il suo suono.)",
       "cast_exit": "leland"
      }
     ],
     "effects": [],
     "next": "m10_morte",
     "exposed": false,
     "mandatory_beat": true,
     "invariant": "Truman agisce da sceriffo: il fermo è per i fatti AMMESSI; Leland passa in cella (ACT5_LELAND_CELL, OFFSCREEN: la stazione non ha una cella giocabile)",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "leland",
     "actor_id": "leland",
     "interaction_slot": "primary"
    },
    {
     "id": "m10_morte",
     "beat": "B10",
     "source_section": "M10-B10",
     "conditions": [
      {
       "node_done": "m10_fermo"
      },
      {
       "not": {
        "flag": "leland_morto"
       }
      }
     ],
     "pages": [
      {
       "id": "m10.b10.morte.p01",
       "mode": "action",
       "text": "(Il grido di Truman arriva dal corridoio. Le chiavi le ha lui: la cella è aperta in un secondo.)"
      },
      {
       "id": "m10.b10.morte.p02",
       "mode": "action",
       "text": "(Truman in ginocchio, due dita sul collo. Conta. Poi smette di contare.)"
      },
      {
       "id": "m10.b10.morte.p03",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "(senza voltarsi) Lucy — il dottore. E Andy alla porta."
      },
      {
       "id": "m10.b10.morte.p04",
       "mode": "action",
       "text": "(Cooper resta sulla soglia: due persone nella cella sono già una di troppo.)"
      },
      {
       "id": "m10.b10.morte.p05",
       "mode": "action",
       "text": "(Poi il dottore, le firme, la barella. L'ambulanza se ne va senza fretta — che è il modo peggiore.)"
      },
      {
       "id": "m10.b10.morte.p06",
       "mode": "action",
       "text": "(Restano la stanza e il radiatore. Solo il radiatore.)"
      },
      {
       "id": "m10.b10.morte.p07",
       "mode": "action",
       "text": "(Cooper prende il proprio registratore. Lo guarda. Non lo accende.)"
      },
      {
       "id": "m10.b10.morte.p08",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Diane... (si ferma. Abbassa la mano.)"
      },
      {
       "id": "m10.b10.morte.p09",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "(alla stanza) So ciò che ha fatto. Non so più dire dove finisse la sua volontà. Una cosa non cancella l'altra."
      },
      {
       "id": "m10.b10.morte.p10",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "La contea lo chiamerà chiuso."
      },
      {
       "id": "m10.b10.morte.p11",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Non lo è."
      },
      {
       "id": "m10.b10.morte.p12",
       "mode": "dialogue",
       "speaker_id": "truman",
       "display_name": "TRUMAN",
       "text": "E adesso?"
      },
      {
       "id": "m10.b10.morte.p13",
       "mode": "dialogue",
       "speaker_id": "cooper",
       "display_name": "COOPER",
       "text": "Un posto. Non è in nessun fascicolo."
      }
     ],
     "effects": [
      {
       "set": "leland_morto"
      }
     ],
     "mandatory_beat": true,
     "invariant": "la morte è UMANA prima che composta: Truman apre, controlla, chiama; Cooper resta sulla soglia; la composizione DOPO; il rituale «Diane» interrotto è visibile; unico writer mission di leland_morto, committato dopo l'ultima pagina; ogni percorso arriva qui; root esposta su TRUMAN (non su Leland): dopo il fermo Leland è in cella (ACT5_LELAND_CELL, nessun corpo), quindi una sessione interrotta fra B9 e B10 riprende da Truman — nessun softlock (V5b)",
     "kind": "dialogue",
     "channel": "world",
     "map_id": "sheriff",
     "target_kind": "actor",
     "target_id": "truman",
     "actor_id": "truman",
     "interaction_slot": "primary"
    }
   ],
   "node_count": {
    "runtime_total": 10
   }
  };
  D.enums = {
   "narrative_schema_version": "1.1.0",
   "narrative_package": "narrative-v1.0",
   "enums": {
    "m5_theory": [
     "degeneration",
     "staging",
     "open"
    ],
    "m6_tactic": [
     "prova",
     "pressione",
     "falsa_sicurezza"
    ],
    "m10_method": [
     "probatorio",
     "personale",
     "intuitivo"
    ],
    "s1": [
     "institutional",
     "documented_custody"
    ],
    "ring_final_gesture": [
     "none",
     "kept",
     "left"
    ],
    "ring_location_after_lodge": [
     "evidence_vault",
     "cooper",
     "lodge"
    ],
    "final_ring_location": [
     "evidence_vault",
     "lodge"
    ],
    "s3": [
     "on",
     "off"
    ],
    "truman_testimony_state": [
     "not_needed",
     "voluntary_witness"
    ],
    "letter_o_observation_source": [
     "cooper_primary",
     "hawk_preserved"
    ],
    "letter_o_chain": [
     "standard"
    ],
    "warning_target": [
     "palmer",
     "centrale",
     "nessuno"
    ],
    "focus_destination": [
     "palmer",
     "lago",
     "diner"
    ],
    "body_found_by": [
     "cooper",
     "hawk"
    ],
    "promise_stance": [
     "accompagno",
     "autonomia",
     "prudenza"
    ],
    "encounter_order": [
     "nano_first",
     "bob_first"
    ],
    "bob_response_stance": [
     "A",
     "B",
     "C"
    ],
    "s4_interpretation": [
     "avvertimento",
     "istruzione",
     "diagnosi"
    ],
    "presagio_status": [
     "active",
     "verified"
    ],
    "formulation_status": [
     "unformulated",
     "formulated"
    ],
    "factual_status": [
     "unconfirmed",
     "corroborated",
     "confirmed",
     "confirmed_as_lie",
     "contested",
     "refuted"
    ],
    "presentation_result": [
     "accepted",
     "rejected"
    ],
    "acceptance_type": [
     "investigatory_route",
     "colloquio_necessario"
    ],
    "presentation_reason_code": [
     "SUFFICIENT_RELEVANT_SUPPORT",
     "NO_CORROBORATION",
     "NO_GEOGRAPHIC_SUPPORT",
     "VALID_BUT_NOT_PROCEDURAL",
     "PREMATURE_SYMBOLIC_LINK",
     "NOT_YET_FORMULATED",
     "ALREADY_REJECTED"
    ],
    "b8_attempt_result": [
     "SOURCE_CORROBORATION",
     "GEOGRAPHIC_OVERREACH",
     "SYMBOLIC_OVERREACH"
    ],
    "assistance_level": [
     0,
     1,
     2,
     3
    ],
    "speaker_register": [
     "leland_first_person",
     "voice"
    ],
    "m5_initial_theory_domain": [
     "degeneration",
     "withheld"
    ],
    "m5_final_theory_domain": [
     "degeneration",
     "staging",
     "open"
    ],
    "maddy_action_after_warning": [
     "none",
     "departure_prepared"
    ],
    "sarah_support_state": [
     "none",
     "vice"
    ]
   },
   "booleans_allowed": [
    "mfap_finale_visto",
    "leland_morto",
    "maddy_trovata",
    "jacques_preso",
    "jacques_dead",
    "jacques_testimony_lost",
    "sogno_fatto",
    "sogno_raccontato",
    "atto3",
    "atto4",
    "atto5",
    "gigante1",
    "gigante2",
    "audrey_indaga",
    "audrey_vista_oej",
    "dream_face_recognized_in_leland_scene",
    "jacques_admitted_presence",
    "jacques_death_suspicious",
    "ronette_visita",
    "east_route_confirmed",
    "vagone_scoperto"
   ],
   "deprecated_forbidden": [
    "clues6_gate",
    "material_facts_recorded",
    "m6_tactic_changed",
    "maddy_salvabile",
    "jacques_murder_confirmed",
    "jacques_murder_attributed",
    "leland_is_host",
    "bob_true",
    "leland_possession_percentage",
    "correct_interpretation",
    "forgiven",
    "good_ending",
    "bad_ending",
    "s4_correct",
    "laura_moral_presence"
   ],
   "values_allowed": {
    "m5_initial_theory": "m5_initial_theory_domain",
    "m5_final_theory": "m5_final_theory_domain",
    "s1": "s1",
    "m6_tactic": "m6_tactic",
    "promise_stance": "promise_stance",
    "warning_target": "warning_target",
    "focus_destination": "focus_destination",
    "body_found_by": "body_found_by",
    "letter_o_observation_source": "letter_o_observation_source",
    "letter_o_chain": "letter_o_chain",
    "presagio_status": "presagio_status",
    "maddy_action_after_warning": "maddy_action_after_warning",
    "sarah_support_state": "sarah_support_state",
    "m10_method": "m10_method",
    "s3": "s3",
    "truman_testimony_state": "truman_testimony_state",
    "material_admissions.taxi_lie": "speaker_register",
    "material_admissions.traincar_presence": "speaker_register",
    "material_admissions.laura_homicide": "speaker_register",
    "material_admissions.maddy_homicide": "speaker_register",
    "material_admissions.maddy_body_transport": "speaker_register",
    "material_admissions.letters": "speaker_register"
   },
   "value_transitions": {
    "presagio_status": [
     [
      "active",
      "verified"
     ]
    ]
   }
  };
  D.evidence = {
   "narrative_package": "narrative-v1.0",
   "evidence": {
    "E1_DIARIO": {
     "label": "il diario di Laura",
     "kind": "document",
     "source": {
      "document": "World & Story Bible v1.0.md",
      "section": "§4-E1"
     },
     "acquired_in": "M2",
     "supports": [
      "P1",
      "P2",
      "P8"
     ],
     "bridge_for": [
      "P8"
     ]
    },
    "E2_CUORE": {
     "label": "metà del pendaglio",
     "kind": "object",
     "source": {
      "document": "World & Story Bible v1.0.md",
      "section": "§4-E2"
     },
     "acquired_in": "M2",
     "supports": [
      "P1",
      "P2"
     ]
    },
    "E3_LETTERA_R": {
     "label": "la lettera R",
     "kind": "object",
     "source": {
      "document": "World & Story Bible v1.0.md",
      "section": "§4-E3"
     },
     "acquired_in": "M2",
     "supports": [
      "P8"
     ]
    },
    "E4_NOME": {
     "label": "un nome dimenticato al risveglio",
     "kind": "phantom",
     "source": {
      "document": "World & Story Bible v1.0.md",
      "section": "§4-E4"
     },
     "acquired_in": "M3",
     "supports": [
      "P4"
     ]
    },
    "E5_POESIA": {
     "label": "la formula recitata da Gerard",
     "kind": "testimony_recited",
     "source": {
      "document": "M4 v1.1.1 LOCK.md",
      "section": "B3"
     },
     "acquired_in": "M4",
     "optional": true,
     "supports": [
      "P4"
     ],
     "notes": "nessun campione grafico: recitata"
    },
    "E6A_CUORE_INTERO": {
     "label": "le due metà combaciano",
     "kind": "object",
     "source": {
      "document": "M4 v1.1.1 LOCK.md",
      "section": "B4"
     },
     "acquired_in": "M4",
     "supports": [
      "P2"
     ],
     "function": "corroborazione della fonte (relazione)",
     "ui_origin": "Double R — il pendaglio ricomposto"
    },
    "T_JAMES_EST": {
     "label": "James: oltre il ponte, verso i binari",
     "kind": "testimony",
     "source": {
      "document": "M4 v1.1.1 LOCK.md",
      "section": "B4"
     },
     "acquired_in": "M4",
     "supports": [
      "P2"
     ],
     "function": "geografia",
     "ui_origin": "Double R — testimonianza di James"
    },
    "T1_RONETTE_BOB": {
     "label": "Ronette grida BOB alla domanda sull'uomo",
     "kind": "testimony",
     "source": {
      "document": "M4 v1.1.1 LOCK.md",
      "section": "B2-ronette_uomo"
     },
     "acquired_in": "M4",
     "supports": [
      "P4"
     ],
     "invariant": "pronunciata SOLO da Ronette"
    },
    "E7A_BIGLIETTO_TESTO": {
     "label": "FUOCO CAMMINA CON ME (inciso)",
     "kind": "object",
     "source": {
      "document": "M5-M6 v1.1.1 LOCK.md",
      "section": "M5-B5"
     },
     "acquired_in": "M5",
     "supports": [
      "P3A"
     ],
     "ui_origin": "Il vagone — il biglietto nel mucchio"
    },
    "E7B_BIGLIETTO_POSIZIONE": {
     "label": "piegato in quattro, inserito nel mucchio, pieghe pulite",
     "kind": "observation",
     "source": {
      "document": "M5-M6 v1.1.1 LOCK.md",
      "section": "M5-B5"
     },
     "acquired_in": "M5",
     "supports": [
      "P3A"
     ],
     "ui_origin": "Il vagone — il mucchio presso la porta"
    },
    "E8A_ANELLO_POSIZIONE": {
     "label": "anello in piano al centro della traversa",
     "kind": "observation",
     "source": {
      "document": "M5-M6 v1.1.1 LOCK.md",
      "section": "M5-B6"
     },
     "acquired_in": "M5",
     "supports": [
      "P3A"
     ],
     "ui_origin": "Il vagone — la traversa centrale"
    },
    "E8B_ANELLO_SUPERFICIE": {
     "label": "polvere intatta, nessun segno di rotolamento",
     "kind": "observation",
     "source": {
      "document": "M5-M6 v1.1.1 LOCK.md",
      "section": "M5-B6"
     },
     "acquired_in": "M5",
     "supports": [
      "P3A"
     ],
     "ui_origin": "Il vagone — la polvere intorno all'anello"
    },
    "E_SCENE": {
     "label": "violenza ai bordi, centro senza passaggi",
     "kind": "observation",
     "source": {
      "document": "M5-M6 v1.1.1 LOCK.md",
      "section": "M5-B7"
     },
     "acquired_in": "M5",
     "supports": [
      "P3A"
     ],
     "ui_origin": "Il vagone — la disposizione della scena"
    },
    "JACQUES_MIDNIGHT_CLAIM": {
     "label": "l'orario del merci di mezzanotte",
     "kind": "testimony",
     "source": {
      "document": "M5-M6 v1.1.1 LOCK.md",
      "section": "M6-PROVA"
     },
     "acquired_in": "M6",
     "conditional": "m6_tactic=prova",
     "provenance": "N→L (delega 2026-07-22)",
     "ui_origin": "One Eyed Jacks — Jacques al banco"
    },
    "JACQUES_LIST_GIVEN": {
     "label": "quattro figure; la voce cala sui fiammiferi",
     "kind": "testimony",
     "source": {
      "document": "M5-M6 v1.1.1 LOCK.md",
      "section": "M6-PRESSIONE"
     },
     "acquired_in": "M6",
     "conditional": "m6_tactic=pressione",
     "provenance": "N→L",
     "ui_origin": "One Eyed Jacks — la lista di Jacques"
    },
    "JACQUES_THIRD_MAN_DETAIL": {
     "label": "il terzo uomo guardava la stufa",
     "kind": "testimony",
     "source": {
      "document": "M5-M6 v1.1.1 LOCK.md",
      "section": "M6-FALSA_SICUREZZA"
     },
     "acquired_in": "M6",
     "conditional": "m6_tactic=falsa_sicurezza",
     "provenance": "N→L",
     "ui_origin": "One Eyed Jacks — il terzo uomo al tavolo"
    },
    "E9A_LETTERA_O": {
     "label": "una O incisa sotto l'unghia",
     "kind": "object",
     "source": {
      "document": "M8 v1.1 LOCK.md",
      "section": "D"
     },
     "acquired_in": "M8",
     "ui_origin": "Il lago — la O sotto l'unghia di Maddy",
     "supports": [
      "P8"
     ]
    },
    "E9B_STESSO_METODO": {
     "label": "stessa posizione e tipo di incisione della R",
     "kind": "observation",
     "source": {
      "document": "M8 v1.1 LOCK.md",
      "section": "D"
     },
     "acquired_in": "M8",
     "ui_origin": "Il lago — stessa incisione della R",
     "supports": [
      "P8"
     ]
    },
    "T_LELAND_TAXI": {
     "label": "«Ho chiamato la Twin Peaks Taxi» (Leland, prima del Roadhouse)",
     "kind": "testimony",
     "source": {
      "document": "M9-M10 v1.1.1 CONFESSION LOCK.md",
      "section": "§1"
     },
     "acquired_in": "M8",
     "provenance": "N→L (m8_leland_taxi, diner, prima del Roadhouse e del ritrovamento)",
     "supports": [
      "P6"
     ],
     "ui_origin": "Diner — «Ho chiamato la Twin Peaks Taxi»"
    },
    "D_TAXI": {
     "label": "Twin Peaks Taxi: nessuna corsa prenotata per casa Palmer",
     "kind": "document",
     "source": {
      "document": "M9-M10 v1.1.1 CONFESSION LOCK.md",
      "section": "M9-B1"
     },
     "acquired_in": "M9",
     "provenance": "N→L",
     "supports": [
      "P6"
     ],
     "ui_origin": "La centrale — Lucy verifica con Twin Peaks Taxi"
    },
    "E_PONTE_DIREZIONE": {
     "label": "paletto della contea sulla sponda del paese, assi consumate da quella parte",
     "kind": "observation",
     "source": {
      "document": "docs/act-3-design-report.md",
      "section": "§12 A2"
     },
     "acquired_in": "M5",
     "supports": [],
     "ui_origin": "Il ponte — la sponda del paese"
    },
    "E_TRACCE_EST": {
     "label": "le impronte passano il vagone ed entrano nel taglio a nord",
     "kind": "observation",
     "source": {
      "document": "docs/act-3-design-report.md",
      "section": "§12 A14"
     },
     "acquired_in": "M5",
     "supports": [],
     "ui_origin": "Il taglio a nord — oltre il vagone"
    },
    "E_STUFA": {
     "label": "stufa fredda, cenere rastrellata in cerchio, un angolo di fiammiferi bruciato",
     "kind": "object",
     "source": {
      "document": "docs/act-3-design-report.md",
      "section": "§12 A7"
     },
     "acquired_in": "M5",
     "supports": [],
     "ui_origin": "Il vagone — la stufa sulla parete di fondo"
    },
    "E_CARTE": {
     "label": "mazzo umido sotto il sedile, taglio del mazziere ancora squadrato",
     "kind": "object",
     "source": {
      "document": "docs/act-3-design-report.md",
      "section": "§12 A8"
     },
     "acquired_in": "M5",
     "supports": [
      "P5"
     ],
     "ui_origin": "Il vagone — sotto il sedile divelto"
    },
    "T_SARAH_VISIONE": {
     "label": "ciò che Sarah ha visto",
     "kind": "testimony",
     "source": {
      "document": "M9-M10 v1.1.1 CONFESSION LOCK.md",
      "section": "§3-B2"
     },
     "acquired_in": "Atto4",
     "provenance": "P (data.js sarah_visione, casa Palmer)",
     "procedural": false,
     "supports": [],
     "ui_origin": "Casa Palmer — ciò che Sarah ha visto",
     "invariant": "MAI in un support_min: allegabile come orientamento, mai come base. Truman la respinge come atto e la riconosce come direzione («Questo non entra in un fascicolo, Cooper.»)."
    }
   }
  };
  D.propositions = {
   "narrative_package": "narrative-v1.0",
   "propositions": {
    "P1": {
     "text": "Laura conduceva una vita doppia.",
     "support_min": {
      "all_of": [
       "E1_DIARIO"
      ]
     },
     "support_strong": {
      "all_of": [
       "E1_DIARIO",
       "E2_CUORE"
      ]
     },
     "formulable_in": "M2",
     "presentable": false
    },
    "P2": {
     "text": "Il pendaglio conferma che James aveva con Laura un rapporto privato. James colloca alcuni dei loro incontri oltre il ponte, verso i binari: una rotta investigativa da verificare.",
     "ui_short": "James colloca alcuni incontri oltre il ponte, verso i binari. Il pendaglio conferma il rapporto da cui parla.",
     "support_min": {
      "all_of": [
       "E6A_CUORE_INTERO",
       "T_JAMES_EST"
      ]
     },
     "support_strong": {
      "all_of": [
       "E6A_CUORE_INTERO",
       "T_JAMES_EST"
      ],
      "any_of": [
       "E1_DIARIO"
      ]
     },
     "born_from_comparison": "cmp_e6a_tjames",
     "formulable_in": "M4",
     "presented_to": "truman",
     "presented_in": "M4",
     "acceptance_type": "investigatory_route",
     "unlocks": [
      "east_route",
      "M5"
     ]
    },
    "P3A": {
     "text": "La posizione non è compatibile con una caduta casuale: una collocazione deliberata è la lettura più forte.",
     "support_min": {
      "all_of": [
       "E8A_ANELLO_POSIZIONE",
       "E8B_ANELLO_SUPERFICIE"
      ]
     },
     "support_strong": {
      "all_of": [
       "E8A_ANELLO_POSIZIONE",
       "E8B_ANELLO_SUPERFICIE",
       "E7B_BIGLIETTO_POSIZIONE"
      ]
     },
     "born_from_comparison": "cmp_e8a_e8b",
     "formulable_in": "M5",
     "factual_ceiling": "unconfirmed",
     "ui_short": "La posizione dell'anello non è compatibile con una caduta casuale: collocazione deliberata come lettura più forte."
    },
    "P3B": {
     "text": "[IPOTESI] Il vagone è stato usato come scena preparata.",
     "hypothesis": true,
     "formulable_in": "M5",
     "factual_ceiling": "unconfirmed",
     "ui_short": "[Ipotesi] Il vagone come scena preparata."
    },
    "P4": {
     "text": "L'aggressore è associato al nome BOB.",
     "support_min": {
      "all_of": [
       "T1_RONETTE_BOB"
      ]
     },
     "support_strong": {
      "all_of": [
       "T1_RONETTE_BOB",
       "E4_NOME",
       "E5_POESIA"
      ]
     },
     "formulable_in": "M4",
     "presentable": true,
     "acceptance": "annotata, mai accettata come base"
    },
    "P4B": {
     "text": "[IPOTESI] Il nome e il fuoco potrebbero riguardare lo stesso uomo.",
     "hypothesis": true,
     "born_from_comparison": "cmp_t1_e5",
     "requires": [
      "T1_RONETTE_BOB",
      "E5_POESIA"
     ],
     "formulable_in": "M4",
     "optional": true,
     "presentation_reason_code_if_presented": "PREMATURE_SYMBOLIC_LINK"
    },
    "P5": {
     "text": "Jacques può essere collocato sulla scena. La sua presenza non basta ad attribuirgli l'omicidio.",
     "ui_short": "Jacques può essere collocato sulla scena. La sua presenza non basta ad attribuirgli l'omicidio.",
     "support_min": {
      "all_of": [
       "jacques_admitted_presence"
      ]
     },
     "formulable_in": "M6",
     "never": "Jacques è innocente"
    },
    "P6": {
     "text": "Il racconto di Leland sulla partenza prevista di Maddy non trova riscontro: il taxi che dice di aver chiamato non risulta prenotato. Una discrepanza che riguarda la vittima e va chiarita di persona.",
     "support_min": {
      "all_of": [
       "T_LELAND_TAXI",
       "D_TAXI"
      ]
     },
     "born_from_comparison": "cmp_taxi",
     "formulable_in": "M9",
     "presented_to": "truman",
     "acceptance_type": "colloquio_necessario",
     "factual_path": [
      "unconfirmed",
      "confirmed_as_lie"
     ],
     "confirmed_in": "M10-B6"
    },
    "P7": {
     "text": "[IPOTESI] La ripetizione è legata alla famiglia Palmer.",
     "ui_short": "[Ipotesi] La ripetizione è legata alla famiglia Palmer.",
     "hypothesis": true,
     "formulable_in": "M8",
     "procedural": false
    },
    "P8": {
     "text": "Le lettere seguono una firma seriale che il diario associa a Robert.",
     "ui_short": "Le lettere seguono una firma progressiva che il diario aveva annunciato. Resta ignoto se sia dell'assassino, di «lui», o una messinscena.",
     "support_min": {
      "all_of": [
       "E3_LETTERA_R",
       "E9A_LETTERA_O",
       "E9B_STESSO_METODO",
       "E1_DIARIO"
      ]
     },
     "formulable_in": "M8",
     "factual_ceiling": "corroborated",
     "unknown": "se la firma sia dell'assassino, di BOB, o una messinscena"
    },
    "P9": {
     "text": "La perdita di Jacques favorisce chiunque protegga il segreto, qualunque ne sia la causa.",
     "ui_short": "La perdita di Jacques favorisce chiunque protegga il segreto, qualunque ne sia la causa.",
     "support_min": {
      "all_of": [
       "jacques_dead",
       "jacques_testimony_lost"
      ]
     },
     "formulable_in": "M6",
     "factual_ceiling": "unconfirmed"
    },
    "P10_R7": {
     "text": "La responsabilità è fratturata, non cancellata.",
     "experienced_in": "M10",
     "never_quantified": true
    }
   }
  };
  D.cast = {
   "version": "cast-continuity-v0.1",
   "source": "artifacts/world-character-audit/cast-windows-acts-1-4.md",
   "characters": {
    "truman": {
     "class": "PERSISTENT",
     "sprite": "truman",
     "name": "Truman",
     "baseline": {
      "status": "PLACED",
      "map_id": "sheriff",
      "x": 10,
      "y": 4,
      "dir": "down",
      "dialogue": [
       {
        "cond": "flag:leland_morto",
        "then": "truman_fine"
       },
       {
        "cond": "flag:atto3",
        "then": "truman_wait3"
       },
       {
        "cond": "clues6",
        "then": "truman_atto3"
       },
       {
        "cond": "flag:sogno_fatto",
        "then": "truman_a2"
       },
       "truman"
      ],
      "wander": false
     },
     "authority": "T20, T25, T32, T36, T55"
    },
    "hawk": {
     "class": "PERSISTENT",
     "sprite": "hawk",
     "name": "Hawk",
     "baseline": {
      "status": "PLACED",
      "map_id": "sheriff",
      "x": 12,
      "y": 8,
      "dir": "down",
      "dialogue": [
       {
        "cond": "flag:sogno_fatto",
        "then": "hawk_a2"
       },
       "hawk"
      ],
      "wander": false
     },
     "authority": "T11, T32 (\"Hawk scrive\"), M8 Lucy routes calls from the station"
    },
    "lucy": {
     "class": "PERSISTENT",
     "sprite": "lucy",
     "name": "Lucy",
     "baseline": {
      "status": "PLACED",
      "map_id": "sheriff",
      "x": 2,
      "y": 6,
      "dir": "down",
      "dialogue": [
       {
        "cond": "flag:jacques_preso",
        "then": "lucy_a3"
       },
       "lucy"
      ],
      "wander": false
     },
     "authority": "T32, T34; M8 Lucy pages"
    },
    "andy": {
     "class": "PERSISTENT",
     "sprite": "andy",
     "name": "Andy",
     "baseline": {
      "status": "PLACED",
      "map_id": "sheriff",
      "x": 10,
      "y": 7,
      "dir": "down",
      "dialogue": "andy",
      "wander": false
     },
     "authority": "scene-contracts S3"
    },
    "sarah": {
     "class": "PERSISTENT",
     "sprite": "sarah",
     "name": "Sarah",
     "baseline": {
      "status": "PLACED",
      "map_id": "palmer",
      "x": 9,
      "y": 7,
      "dir": "down",
      "dialogue": [
       {
        "cond": "flag:atto4",
        "then": "sarah_visione"
       },
       "sarah"
      ],
      "wander": false
     },
     "authority": "Act 1 witness; L3"
    },
    "leland": {
     "class": "PERSISTENT",
     "sprite": "leland",
     "name": "Leland",
     "baseline": {
      "status": "OFFSCREEN",
      "label": "mourning"
     },
     "authority": "T40; D9"
    },
    "maddy": {
     "class": "STORY_BOUND",
     "sprite": "maddy",
     "name": "Maddy",
     "baseline": {
      "status": "OFFSCREEN",
      "label": "not_in_town"
     },
     "authority": "arrives Act 4"
    },
    "norma": {
     "class": "PERSISTENT",
     "sprite": "norma",
     "name": "Norma",
     "baseline": {
      "status": "PLACED",
      "map_id": "diner",
      "x": 5,
      "y": 2,
      "dir": "down",
      "dialogue": [
       {
        "cond": [
         "flag:sogno_fatto",
         "flag:done_norma"
        ],
        "then": "norma_a2"
       },
       "norma"
      ],
      "wander": false
     },
     "authority": "environment-requirements; `m8_route_diner`"
    },
    "shelly": {
     "class": "PERSISTENT",
     "sprite": "shelly",
     "name": "Shelly",
     "baseline": {
      "status": "PLACED",
      "map_id": "diner",
      "x": 9,
      "y": 7,
      "dir": "down",
      "dialogue": [
       {
        "cond": "flag:done_bobby",
        "then": "shelly_bobby"
       },
       "shelly"
      ],
      "wander": false
     },
     "authority": "works there"
    },
    "loglady": {
     "class": "PERSISTENT",
     "sprite": "loglady",
     "name": "Log Lady",
     "baseline": {
      "status": "PLACED",
      "map_id": "diner",
      "x": 4,
      "y": 5,
      "dir": "down",
      "dialogue": [
       {
        "cond": "flag:atto4",
        "then": "loglady_a4"
       },
       "loglady"
      ],
      "wander": false
     },
     "authority": "the regular; classic `atto4 → a4`"
    },
    "james": {
     "class": "PERSISTENT",
     "sprite": "james",
     "name": "James",
     "baseline": {
      "status": "PLACED",
      "map_id": "diner",
      "x": 9,
      "y": 6,
      "dir": "down",
      "dialogue": "james_a2",
      "wander": false
     },
     "authority": "T24"
    },
    "bobby": {
     "class": "PERSISTENT",
     "sprite": "bobby",
     "name": "Bobby",
     "baseline": {
      "status": "PLACED",
      "map_id": "town",
      "x": 31,
      "y": 16,
      "dir": "down",
      "dialogue": [
       {
        "cond": "flag:done_shelly",
        "then": "bobby_shelly"
       },
       {
        "cond": "flag:done_shelly_bobby",
        "then": "bobby_shelly"
       },
       "bobby"
      ],
      "wander": true
     },
     "authority": "Act 1 classic"
    },
    "donna": {
     "class": "PERSISTENT",
     "sprite": "donna",
     "name": "Donna",
     "baseline": {
      "status": "PLACED",
      "map_id": "town",
      "x": 44,
      "y": 10,
      "dir": "down",
      "dialogue": "donna",
      "wander": true
     },
     "authority": "Act 1 classic (`js/data.js:283`)"
    },
    "jacoby": {
     "class": "PERSISTENT",
     "sprite": "jacoby",
     "name": "Jacoby",
     "baseline": {
      "status": "PLACED",
      "map_id": "town",
      "x": 16,
      "y": 25,
      "dir": "down",
      "dialogue": "jacoby",
      "wander": false
     },
     "authority": "Act 1 classic (`js/data.js:290`)"
    },
    "audrey": {
     "class": "PERSISTENT",
     "sprite": "audrey",
     "name": "Audrey",
     "baseline": {
      "status": "PLACED",
      "map_id": "hotel_gn",
      "x": 12,
      "y": 9,
      "dir": "down",
      "dialogue": [
       {
        "cond": "flag:done_benhorne_a2",
        "then": "audrey_a2_ben"
       },
       "audrey_a2"
      ],
      "wander": true
     },
     "authority": "Act 1 classic (`js/data.js:297`)"
    },
    "benhorne": {
     "class": "PERSISTENT",
     "sprite": "benhorne",
     "name": "Ben Horne",
     "baseline": {
      "status": "PLACED",
      "map_id": "hotel_gn",
      "x": 5,
      "y": 7,
      "dir": "down",
      "dialogue": "benhorne_a2",
      "wander": false
     },
     "authority": "Act 2 classic"
    },
    "gerard": {
     "class": "PERSISTENT",
     "sprite": "gerard",
     "name": "Gerard",
     "baseline": {
      "status": "PLACED",
      "map_id": "hospital",
      "x": 11,
      "y": 4,
      "dir": "left",
      "dialogue": "gerard_a2",
      "wander": false
     },
     "authority": "T23"
    },
    "ronette": {
     "class": "PERSISTENT",
     "sprite": "ronette",
     "name": "Ronette",
     "baseline": {
      "status": "PLACED",
      "map_id": "hospital",
      "x": 3,
      "y": 5,
      "dir": "up",
      "dialogue": null,
      "wander": false
     },
     "authority": "T11"
    },
    "infermiera": {
     "class": "PERSISTENT",
     "sprite": "infermiera",
     "name": "Infermiera",
     "baseline": {
      "status": "PLACED",
      "map_id": "hospital",
      "x": 11,
      "y": 8,
      "dir": "down",
      "dialogue": null,
      "wander": false
     },
     "authority": "T23"
    },
    "jacques": {
     "class": "STORY_BOUND",
     "sprite": "jacques",
     "name": "Jacques",
     "baseline": {
      "status": "TERMINAL_REMOVED",
      "event": "jacques_dead"
     },
     "authority": "T30–T34"
    },
    "giant": {
     "class": "STORY_BOUND",
     "sprite": "giant",
     "name": "Gigante",
     "baseline": {
      "status": "OFFSCREEN",
      "label": "offscreen"
     },
     "authority": "T35 mirror; T52 window"
    },
    "laura": {
     "class": "STORY_BOUND",
     "sprite": "laura",
     "name": "Ombra",
     "baseline": {
      "status": "PLACED",
      "map_id": "redroom",
      "x": 11,
      "y": 2,
      "dir": "down",
      "dialogue": [
       {
        "cond": "flag:leland_morto",
        "then": "laura_finale2"
       },
       {
        "cond": "flag:met_mfap",
        "then": "laura_sogno"
       },
       "laura_hint"
      ],
      "wander": false
     },
     "authority": "T22, T58"
    },
    "mfap": {
     "class": "STORY_BOUND",
     "sprite": "mfap",
     "name": "???",
     "baseline": {
      "status": "PLACED",
      "map_id": "redroom",
      "x": 8,
      "y": 4,
      "dir": "down",
      "dialogue": [
       {
        "cond": "flag:leland_morto",
        "then": "mfap_finale"
       },
       "mfap"
      ],
      "wander": false
     },
     "authority": "T22, T58"
    },
    "bob": {
     "class": "STORY_BOUND",
     "sprite": "bob",
     "name": "BOB",
     "baseline": {
      "status": "OFFSCREEN",
      "label": "force"
     },
     "authority": "a force, no body in Acts 1–4"
    },
    "piantone": {
     "class": "STORY_BOUND_SCENOGRAPHY",
     "sprite": "andy",
     "name": "Agente",
     "baseline": {
      "status": "OFFSCREEN",
      "label": "scenography"
     },
     "authority": "M6 \"SCENOGRAFIA\""
    },
    "piantone_ronette": {
     "class": "STORY_BOUND_SCENOGRAPHY",
     "sprite": "andy",
     "name": "Agente",
     "baseline": {
      "status": "OFFSCREEN",
      "label": "scenography"
     },
     "authority": "M6 \"SCENOGRAFIA\""
    }
   },
   "windows": [
    {
     "id": "JAMES_NOT_YET",
     "owner": "classic",
     "when": {
      "not": {
       "flag": "sogno_fatto"
      }
     },
     "cast": {
      "james": {
       "status": "OFFSCREEN",
       "label": "not_met"
      }
     },
     "cause": "james → OFFSCREEN (not met)",
     "exit": "player is in Room 315; James appears at the diner"
    },
    {
     "id": "ACT3_HAWK_BRIDGE",
     "owner": "M5",
     "when": {
      "all": [
       {
        "flag": "atto3"
       },
       {
        "not": {
         "flag": "vagone_scoperto"
        }
       }
      ]
     },
     "cast": {
      "hawk": {
       "status": "PLACED",
       "map_id": "traincar",
       "x": 5,
       "y": 6,
       "dir": "left",
       "dialogue": null,
       "wander": false,
       "actor_ids": [
        "hawk_bridge"
       ]
      }
     },
     "cause": "hawk → traincar 5,6 (leads Cooper to the footbridge, T26; \"Hawk resta sulle impronte\")",
     "exit": "the discovery; the door node's own line \"La soglia la tengo io\" authors his new post",
     "exit_authored_by": {
      "hawk": "m5.hawk.hawk_door.p01"
     },
     "entry_authored_by": {
      "hawk": "classic:truman_atto3"
     }
    },
    {
     "id": "ACT3_HAWK_DOOR",
     "owner": "M5",
     "when": {
      "all": [
       {
        "flag": "vagone_scoperto"
       },
       {
        "not": {
         "node_done": "m5_report_close"
        }
       }
      ]
     },
     "cast": {
      "hawk": {
       "status": "PLACED",
       "map_id": "traincar",
       "x": 14,
       "y": 8,
       "dir": "down",
       "dialogue": null,
       "wander": false,
       "actor_ids": [
        "hawk_door"
       ]
      }
     },
     "cause": "hawk → traincar 14,8 (holds the threshold, T27; \"(dalla porta) … Non te lo dico da qui. Vieni.\")",
     "exit": "Hawk himself says he leads on",
     "exit_authored_by": {
      "hawk": "m5.b9.report.p06"
     }
    },
    {
     "id": "ACT3_HAWK_CUT",
     "owner": "M5",
     "when": {
      "all": [
       {
        "node_done": "m5_report_close"
       },
       {
        "not": {
         "flag": "east_route_confirmed"
        }
       }
      ]
     },
     "cast": {
      "hawk": {
       "status": "PLACED",
       "map_id": "traincar",
       "x": 22,
       "y": 3,
       "dir": "up",
       "dialogue": null,
       "wander": false,
       "actor_ids": [
        "hawk_cut"
       ]
      }
     },
     "cause": "hawk → traincar 22,3 (north cut; T29; Cooper's own line: \"Hawk viene fino alla riva. Dalla riva in poi, io.\")",
     "exit": "authored by the line above: he goes ahead to the bank",
     "exit_authored_by": {
      "hawk": "m5.hawk.hawk_cut.repeat"
     }
    },
    {
     "id": "ACT3_HAWK_OEJ_DOCK",
     "owner": "M6",
     "when": {
      "all": [
       {
        "flag": "east_route_confirmed"
       },
       {
        "not": {
         "flag": "jacques_preso"
        }
       }
      ]
     },
     "cast": {
      "hawk": {
       "status": "PLACED",
       "map_id": "oej",
       "x": 6,
       "y": 8,
       "dir": "up",
       "dialogue": null,
       "wander": false
      }
     },
     "cause": "hawk → oej 6,8 (the landing by the south door; \"(fuori, piano) Io resto qui. Se chiudono il molo, restiamo dentro.\")",
     "exit": "the arrest pages",
     "exit_authored_by": {
      "hawk": "m6.b7.arrest.p06"
     }
    },
    {
     "id": "ACT3_HAWK_ESCORT",
     "owner": "M6",
     "when": {
      "all": [
       {
        "flag": "jacques_preso"
       },
       {
        "not": {
         "node_done": "m6_hospital_guard"
        }
       }
      ]
     },
     "cast": {
      "hawk": {
       "status": "OFFSCREEN",
       "label": "escort"
      }
     },
     "cause": "hawk → OFFSCREEN (escorts Jacques to the ward, signs him in, T31; the register: \"Ultima riga: la firma di Hawk, ora del ricovero\")",
     "exit": "Cooper is at OEJ/town/station; the signature is the rendered trace; back at the station for \"Hawk scrive\" (m6_return_night)"
    },
    {
     "id": "ACT3_TRUMAN_REPORT",
     "owner": "M5",
     "when": {
      "all": [
       {
        "value_set": "m5_final_theory"
       },
       {
        "proposition_path": "P3A.formulation.status",
        "equals": "formulated"
       },
       {
        "not": {
         "flag": "jacques_preso"
        }
       },
       {
        "not": {
         "flag": "audrey_vista_oej"
        }
       }
      ]
     },
     "cast": {
      "truman": {
       "status": "PLACED",
       "map_id": "traincar",
       "x": 9,
       "y": 8,
       "dir": "right",
       "dialogue": null,
       "wander": false
      }
     },
     "cause": "truman → traincar 9,8 (comes to receive the report, T28; stays: \"Io resto con l'anello e con il verbale\", m5_report_close)",
     "exit": "jacques_preso (the site closes; he is at the station with the file for m6_return_night_early) or audrey_vista_oej (→ BOAT)"
    },
    {
     "id": "ACT3_TRUMAN_BOAT",
     "owner": "M6",
     "when": {
      "all": [
       {
        "flag": "audrey_vista_oej"
       },
       {
        "not": {
         "flag": "jacques_preso"
        }
       }
      ]
     },
     "cast": {
      "truman": {
       "status": "OFFSCREEN",
       "label": "boat"
      }
     },
     "cause": "truman → OFFSCREEN (meets the eight o'clock boat and walks Audrey home: \"La nuova del guardaroba è rientrata con la barca delle otto. L'ho accompagnata io.\", T42)",
     "exit": "Cooper is at OEJ"
    },
    {
     "id": "ACT3_JACQUES_AT_OEJ",
     "owner": "M6",
     "when": {
      "not": {
       "flag": "jacques_preso"
      }
     },
     "cast": {
      "jacques": {
       "status": "PLACED",
       "map_id": "oej",
       "x": 7,
       "y": 5,
       "dir": "down",
       "dialogue": null,
       "wander": false
      }
     },
     "cause": "jacques → oej 7,5",
     "exit": "the arrest pages (he falls between the planks)",
     "exit_authored_by": {
      "jacques": "m6.b7.arrest.p06"
     }
    },
    {
     "id": "ACT3_JACQUES_GUARDED",
     "owner": "M6",
     "when": {
      "all": [
       {
        "flag": "jacques_preso"
       },
       {
        "not": {
         "flag": "jacques_dead"
        }
       }
      ]
     },
     "cast": {
      "jacques": {
       "status": "OFFSCREEN",
       "label": "guarded"
      }
     },
     "cause": "jacques → OFFSCREEN (\"piantonato, stanza in fondo al reparto\" — alive, in custody, deliberately not a body; the guard, the door and the register render it)",
     "exit": "Cooper is at the station when Lucy's call lands"
    },
    {
     "id": "JACQUES_DEAD",
     "owner": "M6",
     "when": {
      "flag": "jacques_dead"
     },
     "cast": {
      "jacques": {
       "status": "TERMINAL_REMOVED",
       "event": "jacques_dead"
      }
     },
     "cause": "jacques → TERMINAL_REMOVED",
     "exit": "never"
    },
    {
     "id": "ACT3_AUDREY_AT_OEJ",
     "owner": "M6",
     "when": {
      "all": [
       {
        "flag": "audrey_indaga"
       },
       {
        "not": {
         "flag": "audrey_vista_oej"
        }
       },
       {
        "not": {
         "flag": "jacques_preso"
        }
       }
      ]
     },
     "cast": {
      "audrey": {
       "status": "PLACED",
       "map_id": "oej",
       "x": 13,
       "y": 7,
       "dir": "down",
       "dialogue": null,
       "wander": false
      }
     },
     "cause": "audrey → oej 13,7 (\"esce da quella porta entro dieci minuti\")",
     "exit": "her own line; at the arrest the visit is over (residual R1, §8)",
     "exit_authored_by": {
      "audrey": "m6.b3.audrey.p02"
     },
     "exit_residual": {
      "audrey": "R1"
     },
     "entry_authored_by": {
      "audrey": "classic:audrey_a2"
     }
    },
    {
     "id": "ACT3_GUARD_JACQUES",
     "owner": "M6",
     "when": {
      "all": [
       {
        "flag": "jacques_preso"
       },
       {
        "not": {
         "flag": "jacques_dead"
        }
       }
      ]
     },
     "cast": {
      "piantone": {
       "status": "PLACED",
       "map_id": "hospital",
       "x": 7,
       "y": 3,
       "dir": "up",
       "dialogue": null,
       "wander": false
      }
     },
     "cause": "piantone → hospital 7,3",
     "exit": "—"
    },
    {
     "id": "ACT3_GUARD_RONETTE",
     "owner": "M6",
     "when": {
      "all": [
       {
        "flag": "jacques_dead"
       },
       {
        "not": {
         "flag": "leland_morto"
        }
       }
      ]
     },
     "cast": {
      "piantone_ronette": {
       "status": "PLACED",
       "map_id": "hospital",
       "x": 3,
       "y": 6,
       "dir": "up",
       "dialogue": null,
       "wander": false
      }
     },
     "cause": "piantone_ronette → hospital 3,6 (D11)",
     "exit": "—"
    },
    {
     "id": "ACT4_MADDY_DINER",
     "owner": "M8",
     "when": {
      "all": [
       {
        "flag": "atto4"
       },
       {
        "not": {
         "evidence": "T_LELAND_TAXI"
        }
       }
      ]
     },
     "cast": {
      "maddy": {
       "status": "PLACED",
       "map_id": "diner",
       "x": 10,
       "y": 1,
       "dir": "down",
       "dialogue": null,
       "wander": false
      }
     },
     "cause": "maddy → diner 10,1 (T50)",
     "exit": "her exit is the first page of the node that sets the exit state",
     "exit_authored_by": {
      "maddy": "m8.b0.leland_taxi.p00"
     }
    },
    {
     "id": "ACT4_MADDY_HOME",
     "owner": "M8",
     "when": {
      "all": [
       {
        "evidence": "T_LELAND_TAXI"
       },
       {
        "not": {
         "flag": "maddy_trovata"
        }
       }
      ]
     },
     "cast": {
      "maddy": {
       "status": "OFFSCREEN",
       "label": "home"
      }
     },
     "cause": "maddy → OFFSCREEN (home; the house with Leland inside, HIDDEN)",
     "exit": "—"
    },
    {
     "id": "ACT4_MADDY_GONE",
     "owner": "M8",
     "when": {
      "flag": "maddy_trovata"
     },
     "cast": {
      "maddy": {
       "status": "TERMINAL_REMOVED",
       "event": "maddy_trovata"
      }
     },
     "cause": "maddy → TERMINAL_REMOVED (T54)",
     "exit": "never"
    },
    {
     "id": "ACT4_LELAND_DINER",
     "owner": "M8",
     "when": {
      "all": [
       {
        "flag": "atto4"
       },
       {
        "not": {
         "evidence": "T_LELAND_TAXI"
        }
       }
      ]
     },
     "cast": {
      "leland": {
       "status": "PLACED",
       "map_id": "diner",
       "x": 11,
       "y": 1,
       "dir": "down",
       "dialogue": null,
       "wander": false
      }
     },
     "cause": "leland → diner 11,1 (pays, states the taxi, leaves: T0.5)",
     "exit": "the bill caption",
     "exit_authored_by": {
      "leland": "m8.b0.leland_taxi.p00"
     }
    },
    {
     "id": "ACT4_LELAND_HIDDEN",
     "owner": "M8",
     "when": {
      "all": [
       {
        "evidence": "T_LELAND_TAXI"
       },
       {
        "not": {
         "flag": "atto5"
        }
       }
      ]
     },
     "cast": {
      "leland": {
       "status": "OFFSCREEN",
       "label": "hidden"
      }
     },
     "cause": "leland → OFFSCREEN (HIDDEN)",
     "exit": "—"
    },
    {
     "id": "ACT5_LELAND_STATION",
     "owner": "M10",
     "when": {
      "all": [
       {
        "flag": "atto5"
       },
       {
        "not": {
         "node_done": "m10_fermo"
        }
       },
       {
        "not": {
         "flag": "leland_morto"
        }
       }
      ]
     },
     "cast": {
      "leland": {
       "status": "PLACED",
       "map_id": "sheriff",
       "x": 8,
       "y": 5,
       "dir": "down",
       "dialogue": [
        {
         "cond": "flag:leland_confessa",
         "then": "leland_morte"
        },
        "leland_interr"
       ],
       "wander": false
      }
     },
     "cause": "leland → sheriff 8,5 (atto5: Truman calls him in, M9 m9_present_truman; he walks in alone, m9.b3.arrivo.p01)",
     "exit": "m10_fermo: Truman opens the cell himself (M10-B9)",
     "exit_authored_by": {
      "leland": "m10.b9.fermo.p03"
     }
    },
    {
     "id": "ACT5_LELAND_CELL",
     "owner": "M10",
     "when": {
      "all": [
       {
        "node_done": "m10_fermo"
       },
       {
        "not": {
         "flag": "leland_morto"
        }
       }
      ]
     },
     "cast": {
      "leland": {
       "status": "OFFSCREEN",
       "label": "cell"
      }
     },
     "cause": "leland → OFFSCREEN (cell): fermo per i fatti ammessi, Truman apre la cella (M10-B9). The station map has no playable cell: the cell is authored on screen by m10.b9.fermo.p02-p03 and stays offscreen.",
     "exit": "leland_morto (M10-B10, m10_morte)"
    },
    {
     "id": "ACT5_TRUMAN_OUT_INTUITIVE",
     "owner": "M10",
     "when": {
      "all": [
       {
        "value_is": {
         "name": "m10_method",
         "equals": "intuitivo"
        }
       },
       {
        "node_done": "m10_domande"
       },
       {
        "not": {
         "node_done": "m10_confessione"
        }
       }
      ]
     },
     "cast": {
      "truman": {
       "status": "OFFSCREEN",
       "label": "corridor"
      }
     },
     "cause": "truman → OFFSCREEN (corridor): intuitive method only, he puts the pen down and leaves the room (M10-B3-B4 cost)",
     "exit": "m10_confessione: «(Truman rientra. Il blocco è aperto.)» (M10-B6 intuitivo)",
     "entry_authored_by": {
      "truman": "m10.b3.intuitivo.p09"
     },
     "exit_authored_by": {
      "truman": "m10.b6.intuitivo.p07"
     }
    },
    {
     "id": "LELAND_DEAD",
     "owner": "story",
     "when": {
      "flag": "leland_morto"
     },
     "cast": {
      "leland": {
       "status": "TERMINAL_REMOVED",
       "event": "leland_morto"
      }
     },
     "cause": "leland → TERMINAL_REMOVED",
     "exit": "never"
    },
    {
     "id": "ACT4_EVENING_GATHERING",
     "owner": "M8",
     "when": {
      "all": [
       {
        "evidence": "T_LELAND_TAXI"
       },
       {
        "not": {
         "value_set": "focus_destination"
        }
       }
      ]
     },
     "cast": {
      "truman": {
       "status": "PLACED",
       "map_id": "roadhouse",
       "x": 4,
       "y": 8,
       "dir": "up",
       "dialogue": null,
       "wander": false
      },
      "norma": {
       "status": "PLACED",
       "map_id": "roadhouse",
       "x": 5,
       "y": 6,
       "dir": "up",
       "dialogue": null,
       "wander": false
      },
      "shelly": {
       "status": "PLACED",
       "map_id": "roadhouse",
       "x": 3,
       "y": 6,
       "dir": "down",
       "dialogue": null,
       "wander": false
      },
      "loglady": {
       "status": "PLACED",
       "map_id": "roadhouse",
       "x": 2,
       "y": 6,
       "dir": "up",
       "dialogue": null,
       "wander": false
      },
      "james": {
       "status": "PLACED",
       "map_id": "roadhouse",
       "x": 2,
       "y": 4,
       "dir": "down",
       "dialogue": null,
       "wander": false
      },
      "bobby": {
       "status": "PLACED",
       "map_id": "roadhouse",
       "x": 3,
       "y": 4,
       "dir": "down",
       "dialogue": null,
       "wander": false
      },
      "donna": {
       "status": "PLACED",
       "map_id": "roadhouse",
       "x": 5,
       "y": 4,
       "dir": "down",
       "dialogue": null,
       "wander": false
      }
     },
     "cause": "truman → roadhouse 4,8; norma, shelly, loglady, james, bobby, donna → roadhouse (the town gathers, T52)",
     "exit": "the departure is visible before the state commits; the Roadhouse closes after Cooper has left it",
     "entry_authored_by": {
      "norma": "m8.b0.leland_taxi.chiusura.p01",
      "shelly": "m8.b0.leland_taxi.chiusura.p01",
      "loglady": "m8.b0.leland_taxi.chiusura.p01",
      "james": "m8.b0.leland_taxi.chiusura.p01"
     }
    },
    {
     "id": "ACT4_GIANT_STAGE",
     "owner": "M8",
     "when": {
      "all": [
       {
        "value_is": {
         "name": "presagio_status",
         "equals": "active"
        }
       },
       {
        "not": {
         "value_set": "warning_target"
        }
       }
      ]
     },
     "cast": {
      "giant": {
       "status": "PLACED",
       "map_id": "roadhouse",
       "x": 8,
       "y": 1,
       "dir": "down",
       "dialogue": null,
       "wander": false,
       "actor_ids": [
        "gigante"
       ]
      }
     },
     "cause": "giant → roadhouse 8,1",
     "exit": "supernatural narrow window; accepted",
     "exit_residual": {
      "giant": "R2"
     }
    },
    {
     "id": "ACT4_HAWK_PATROL",
     "owner": "M8",
     "when": {
      "all": [
       {
        "evidence": "T_LELAND_TAXI"
       },
       {
        "not": {
         "value_is": {
          "name": "body_found_by",
          "equals": "hawk"
         }
        }
       },
       {
        "not": {
         "all": [
          {
           "value_is": {
            "name": "body_found_by",
            "equals": "cooper"
           }
          },
          {
           "flag": "maddy_trovata"
          }
         ]
        }
       }
      ]
     },
     "cast": {
      "hawk": {
       "status": "OFFSCREEN",
       "label": "patrol"
      }
     },
     "cause": "hawk → OFFSCREEN (patrol; D6)",
     "exit": "the anonymous call"
    },
    {
     "id": "ACT4_HAWK_SHORE_FOUND_BY_HAWK",
     "owner": "M8",
     "when": {
      "all": [
       {
        "value_is": {
         "name": "body_found_by",
         "equals": "hawk"
        }
       },
       {
        "not": {
         "flag": "atto5"
        }
       }
      ]
     },
     "cast": {
      "hawk": {
       "status": "PLACED",
       "map_id": "town",
       "x": 16,
       "y": 27,
       "dir": "down",
       "dialogue": null,
       "wander": false
      }
     },
     "cause": "hawk → town 16,27 (T7; keeps the scene until dawn, D5)",
     "exit": "—"
    },
    {
     "id": "ACT4_HAWK_SHORE_COOPER",
     "owner": "M8",
     "when": {
      "all": [
       {
        "value_is": {
         "name": "body_found_by",
         "equals": "cooper"
        }
       },
       {
        "flag": "maddy_trovata"
       },
       {
        "not": {
         "flag": "atto5"
        }
       }
      ]
     },
     "cast": {
      "hawk": {
       "status": "PLACED",
       "map_id": "town",
       "x": 16,
       "y": 27,
       "dir": "down",
       "dialogue": null,
       "wander": false
      }
     },
     "cause": "hawk → town 16,27 (T7; keeps the scene until dawn, D5)",
     "exit": "—"
    },
    {
     "id": "ACT4_SARAH_ASLEEP",
     "owner": "M8",
     "when": {
      "all": [
       {
        "value_set": "presagio_status"
       },
       {
        "not": {
         "flag": "atto5"
        }
       }
      ]
     },
     "cast": {
      "sarah": {
       "status": "OFFSCREEN",
       "label": "asleep"
      }
     },
     "cause": "sarah → OFFSCREEN (asleep upstairs; D1) — predicate corrected 2026-09-13 on the real build: presagio_status becomes \"verified\" at m8_discovery (the shore), so the window keys on value_set, not on =active",
     "exit": "Cooper at the Roadhouse"
    },
    {
     "id": "ACT4_ANDY_WITH_SARAH_VICE",
     "owner": "M8",
     "when": {
      "all": [
       {
        "value_is": {
         "name": "sarah_support_state",
         "equals": "vice"
        }
       },
       {
        "not": {
         "flag": "atto5"
        }
       }
      ]
     },
     "cast": {
      "andy": {
       "status": "OFFSCREEN",
       "label": "with_sarah"
      }
     },
     "cause": "andy → OFFSCREEN (dispatched, T4′; D2)",
     "exit": "Cooper at the Roadhouse"
    },
    {
     "id": "ACT4_ANDY_WITH_SARAH_LATE",
     "owner": "M8",
     "when": {
      "all": [
       {
        "value_is": {
         "name": "sarah_support_state",
         "equals": "none"
        }
       },
       {
        "flag": "maddy_trovata"
       },
       {
        "not": {
         "flag": "atto5"
        }
       }
      ]
     },
     "cast": {
      "andy": {
       "status": "OFFSCREEN",
       "label": "with_sarah"
      }
     },
     "cause": "andy → OFFSCREEN (Truman left him with Sarah, T7′; D2)",
     "exit": "Cooper at the shore"
    },
    {
     "id": "ACT4_TOWN_HOME_NIGHT",
     "owner": "M8",
     "when": {
      "all": [
       {
        "value_set": "focus_destination"
       },
       {
        "not": {
         "flag": "atto5"
        }
       }
      ]
     },
     "cast": {
      "shelly": {
       "status": "OFFSCREEN",
       "label": "home"
      },
      "loglady": {
       "status": "OFFSCREEN",
       "label": "home"
      },
      "james": {
       "status": "OFFSCREEN",
       "label": "home"
      },
      "bobby": {
       "status": "OFFSCREEN",
       "label": "home"
      },
      "donna": {
       "status": "OFFSCREEN",
       "label": "home"
      }
     },
     "cause": "shelly, loglady, james, bobby, donna → OFFSCREEN (home; D7b). Norma → baseline diner and Truman → baseline sheriff by the gathering's exit",
     "exit": "—"
    },
    {
     "id": "ACT4_JACOBY_HOME_NIGHT",
     "owner": "M8",
     "when": {
      "all": [
       {
        "evidence": "T_LELAND_TAXI"
       },
       {
        "not": {
         "flag": "atto5"
        }
       }
      ]
     },
     "cast": {
      "jacoby": {
       "status": "OFFSCREEN",
       "label": "home"
      }
     },
     "cause": "jacoby → OFFSCREEN (D4)",
     "exit": "Cooper at the diner"
    },
    {
     "id": "BOB_FINALE",
     "owner": "classic",
     "when": {
      "flag": "leland_morto"
     },
     "cast": {
      "bob": {
       "status": "PLACED",
       "map_id": "redroom",
       "x": 14,
       "y": 2,
       "dir": "down",
       "dialogue": "bob_finale",
       "wander": false
      }
     },
     "cause": "bob → redroom 14,2 (classic leland_morto reveal)",
     "exit": "never"
    }
   ]
  };
})();
