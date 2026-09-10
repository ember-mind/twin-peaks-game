# Atto 3 — trascrizione giocata «impeto-kept»

Registrata sulla build di produzione (`index.html`) in Chrome headless.
Ogni riga è ciò che la UI ha davvero emesso: id di pagina, speaker dal DOM,
testo dal DOM, obiettivo HUD in quel momento.

## Entità presenti a ogni ingresso mappa

| mappa | arrivo | NPC |
|---|---|---|
| town | 54,14,right | bobby@31,16 · donna@44,10 · jacoby@16,25 |
| traincar | 2,7,right | (nessuno) |
| oej | 8,7,up | jacques@7,5 · audrey@13,7 |
| sheriff | 11,4,left | truman@10,4 · andy@10,7 · hawk@12,8 · lucy@2,6 · leland@8,5 |
| hospital | 13,7,down | gerard@11,4 · ronette@3,5 · infermiera@11,8 · piantone@7,3 |
| sheriff | 11,4,left | truman@10,4 · andy@10,7 · hawk@12,8 · lucy@2,6 · leland@8,5 |
| sheriff | 3,6,down | truman@10,4 · andy@10,7 · hawk@12,8 · lucy@2,6 · leland@8,5 |
| hospital | 13,7,down | gerard@11,4 · ronette@3,5 · infermiera@11,8 · piantone_ronette@3,6 |
| room_315 | 13,4,up | (nessuno) |
| sheriff | 11,4,left | truman@10,4 · andy@10,7 · hawk@12,8 · lucy@2,6 · leland@8,5 |

## Sequenza

- _viaggio_ → town 54,14,right (viaggio: strada a est)
- **porta** town → traincar
- _dialogo classico_ `oej_bloccato` su traincar: Il sentiero sale a
nord, fra gli alberi. / Non ancora. Prima
le impronte che ci / arrivano, poi
il sentiero.
- **porta** traincar → traincar — respinta: «Il sentiero sale a
nord, fra gli alberi.» (`oej_bloccato`)

> **HUD:** Verifica la rotta di James: oltre il ponte, verso i binari.

- `m5.b1.bridge.p01` [m5_bridge] _(scena)_ — (Le case finiscono dove aveva detto James. Dopo il ponte, solo la massicciata.)
- `m5.b1.bridge.p02` [m5_bridge] _(scena)_ — (Sulla sponda del paese, un paletto della contea con un nastro. Le assi sono consumate da questa parte del torrente; dall'altra, no.)
- `m5.b1.bridge.p03` [m5_bridge] **COOPER** — La rotta di James e la strada di Ronette sono la stessa strada.
- `m5.b1.bridge.p04` [m5_bridge] **HAWK** — (raggiungendolo) Truman mi manda a farti da ombra. Da qui in poi le impronte sono mie e tue.
- `m5.b1.bridge.p05` [m5_bridge] **HAWK** — Le altre sono più vecchie della pioggia. Portano a est, nessuna torna indietro.
- `m5.b1.bridge.p06` [m5_bridge] **HAWK** — Il paletto l'ha messo la contea, tre giorni fa. La terra la leggo io. Il resto lo leggi tu.
- _commit_ `m5_bridge`
- _stato_: {"evidence":["E_PONTE_DIREZIONE"],"nodes_done":["m5_bridge"]}
- _obiettivo (dopo l'interazione)_: Verifica la rotta di James: oltre il ponte, verso i binari.
- `m5.b3.discovery.p01` [m5_discovery] _(scena)_ — (Oltre la curva, fermo dove i binari muoiono: un vagone merci. Solo.)
- `m5.b3.discovery.p02` [m5_discovery] **HAWK** — Io tengo fuori gli altri. Tu fai il primo passaggio.
- `m5.b3.discovery.p03` [m5_discovery] _(scena)_ — (Dalla porta, tutto in una volta: un mucchio di terra sulla soglia. A sinistra un sedile divelto, a destra una lamiera piegata. Al centro una traversa, e sopra qualcosa di piccolo. In fondo, una stufa.)
- `m5.b3.discovery.p04` [m5_discovery] **COOPER** — Prima terra, lamiera e distanze. Il vagone può aspettare un minuto prima di diventare una storia.
- _commit_ `m5_discovery`
- `m5.b8a.theory.p01` [m5_theory_initial] _(scena)_ — Terra sulla soglia. Segni ai lati. Una cosa piccola al centro.
- _commit_ `m5_theory_initial`
- **scelte** [m5_theory_initial]: theory_degeneration · theory_withhold
- _stato_: {"flags":["vagone_scoperto"],"nodes_done":["m5_discovery","m5_theory_initial"]}
- _obiettivo (dopo l'interazione)_: Esamina il vagone senza spostare nulla: la terra, la traversa, il centro.
- **scelta presa**: `theory_degeneration`

> **HUD:** Esamina il vagone senza spostare nulla: la terra, la traversa, il centro.

- `m5.b8a.feedback.degeneration` [m5_theory_initial] _(scena)_ — (Cooper lo scrive a matita. Sotto la riga lascia spazio.)
- _stato_: {"values":{"m5_initial_theory":"degeneration"}}
- _obiettivo (dopo l'avanzamento)_: Esamina il vagone senza spostare nulla: la terra, la traversa, il centro.
- `m5.b5.mound.p01` [m5_mound] _(scena)_ — (Un mucchio di terra sulla soglia. Dentro, non fuori: il primo passo di chiunque entri.)
- `m5.b5.mound.p02` [m5_mound] _(scena)_ — Un biglietto piegato in quattro, nella terra. Pieghe interne pulite. Un lembo lasciato sopra la terra, alla luce. Nascosto a chi?
- `m5.b5.mound.p03` [m5_mound] _(scena)_ — (Cooper lo apre con la penna. Lettere maiuscole, incise più che scritte.)
- `m5.b5.mound.p04` [m5_mound] _(scena)_ — "FUOCO CAMMINA CON ME".
- `m5.b5.mound.p05` [m5_mound] **COOPER** — Sotto terra le pieghe sono pulite. Sopra, un lembo, dove passa ogni piede. Registro posizione e testo separatamente.
- _commit_ `m5_mound`
- _stato_: {"evidence":["E7A_BIGLIETTO_TESTO","E7B_BIGLIETTO_POSIZIONE"],"nodes_done":["m5_mound"]}
- _obiettivo (dopo l'interazione)_: Esamina il vagone senza spostare nulla: la terra, la traversa, il centro.
- `m5.b6.ring.p01` [m5_ring] _(scena)_ — (Su una traversa di legno, al centro esatto: un anello.)
- `m5.b6.ring.p02` [m5_ring] _(scena)_ — Un anello, in piano, al centro esatto della traversa.
- `m5.b6.ring.p03` [m5_ring] _(scena)_ — (Cooper si abbassa. Non lo tocca.)
- `m5.b6.ring.p04` [m5_ring] _(scena)_ — La polvere intorno è intatta fino al bordo. Nessuna striscia, nessun percorso di caduta. Caduto, o fermato?
- `m5.b6.ring.p05` [m5_ring] **COOPER** — Centro esatto, polvere intatta. Prima di chiedere di chi fosse, annotiamo come stava qui.
- _commit_ `m5_ring`
- _stato_: {"evidence":["E8A_ANELLO_POSIZIONE","E8B_ANELLO_SUPERFICIE"],"nodes_done":["m5_ring"]}
- _obiettivo (dopo l'interazione)_: Esamina il vagone senza spostare nulla: la terra, la traversa, il centro.
- `m5.b7.scene.p01` [m5_scene] _(scena)_ — (Dal centro: la porta, il mucchio sulla soglia, la traversa sotto i piedi. Una linea sola. Il sedile e la lamiera restano agli angoli. Fra gli angoli e qui, la polvere non ha strisce.)
- `m5.b7.scene.p02` [m5_scene] _(scena)_ — I segni ai bordi. Il centro vuoto. Nessun trascinamento fra i due. Che cosa ha attraversato questo spazio, e come?
- `m5.b7.scene.p03` [m5_scene] **COOPER** — Hawk, la soglia è tua. Io fotografo il vuoto fra questi segni.
- _commit_ `m5_scene`
- _stato_: {"evidence":["E_SCENE"],"nodes_done":["m5_scene"]}
- _obiettivo (dopo l'interazione)_: Taccuino (T): l'anello e la polvere intorno.

> **HUD:** Taccuino (T): l'anello e la polvere intorno.

- `m5.a7.stove.p01` [m5_stove] _(scena)_ — (Una stufa di ghisa contro la parete di fondo. Fredda. Dentro, la cenere è rastrellata in cerchio. Sul bordo, l'angolo bruciato di una bustina di fiammiferi.)
- `m5.a7.stove.p02` [m5_stove] _(scena)_ — Stufa fredda. Cenere in cerchio, rastrellata. Un angolo di fiammiferi bruciato. Chi l'ha guardata spegnersi?
- `m5.a7.stove.p03` [m5_stove] **COOPER** — Fuoco. Qualcuno l'ha guardato spegnersi.
- _commit_ `m5_stove`
- _stato_: {"evidence":["E_STUFA"],"nodes_done":["m5_stove"]}
- _obiettivo (dopo l'interazione)_: Taccuino (T): l'anello e la polvere intorno.
- `m5.a8.cards.p01` [m5_cards] _(scena)_ — (Sotto il sedile divelto, un mazzo di carte umido. Il taglio del mazziere è ancora squadrato. Sul pavimento, cera di candela a più strati.)
- `m5.a8.cards.p02` [m5_cards] _(scena)_ — Carte umide sotto il sedile. Il taglio ancora squadrato. Cera a strati sul pavimento. Chi teneva il banco, e quante sere?
- `m5.a8.cards.p03` [m5_cards] **COOPER** — Qui qualcuno teneva il banco.
- `m5.a8.cards.p04` [m5_cards] **COOPER** — Cenere a strati nella stufa, cera a strati qui. Più di una sera.
- _commit_ `m5_cards`
- _stato_: {"evidence":["E_CARTE"],"nodes_done":["m5_cards"]}
- _obiettivo (dopo l'interazione)_: Taccuino (T): l'anello e la polvere intorno.
- _obiettivo (prima del taccuino)_: Taccuino (T): l'anello e la polvere intorno.
- _obiettivo (nel taccuino)_: OBIETTIVO: Taccuino (T): l'anello e la polvere intorno.
- **taccuino** coppia E8A_ANELLO_POSIZIONE + E8B_ANELLO_SUPERFICIE → available (m5_cmp_ring)

> **HUD:** (nessun obiettivo)

- `m5.b8c.cmp_ring.p01` [m5_cmp_ring] _(scena)_ — Anello al centro esatto. Polvere continua fino al bordo dell'anello.
- _commit_ `m5_cmp_ring`
- **scelte** [m5_cmp_ring]: ring_a · ring_b · ring_c
- **scelta presa**: `ring_b`
- `m5.b8c.feedback.no_entry` [m5_cmp_ring] _(scena)_ — Le impronte fuori dicono altro: qualcuno è passato, prima della pioggia.
- **scelte** [m5_cmp_ring]: ring_a · ring_c
- _obiettivo (dopo l'avanzamento)_: (nessuno)
- **scelta presa**: `ring_a`
- `m5.b8c.feedback.deliberate` [m5_cmp_ring] _(scena)_ — (Cooper non lo tocca. Fotografa il bordo della polvere, poi il centro. Due scatti, nessuna parola.)
- _obiettivo (dopo l'avanzamento)_: (nessuno)

> **HUD:** Torna sulla soglia del vagone. La prima lettura regge?

- `m5.b8b.revision.p01` [m5_theory_revision] _(scena)_ — A matita: un incontro degenerato. Sotto: lembo fuori dalla terra, centro senza strisce, polvere intatta fino al bordo.
- _commit_ `m5_theory_revision`
- **scelte** [m5_theory_revision]: revision_keep · revision_switch · revision_open
- _stato_: {"nodes_done":["m5_theory_revision"]}
- _obiettivo (dopo l'interazione)_: Torna sulla soglia del vagone. La prima lettura regge?
- **scelta presa**: `revision_keep`
- `m5.b8b.feedback.keep` [m5_theory_revision] _(scena)_ — (Cooper ripassa la riga a matita. Non la cancella. Sotto, i tre fatti restano scritti.)
- _stato_: {"values":{"m5_final_theory":"degeneration"}}
- _obiettivo (dopo l'avanzamento)_: Truman è sui binari. Riferisci la scena prima che cali la luce.

> **HUD:** Truman è sui binari. Riferisci la scena prima che cali la luce.

- `m5.a14.early.p01` [m5_tracks_north_early] **COOPER** — Le impronte proseguono. Hawk è ancora alla porta: le impronte aspettano, la luce no. Prima il vagone.
- _commit_ `m5_tracks_north_early`
- _stato_: {"nodes_done":["m5_tracks_north_early"]}
- _obiettivo (dopo l'interazione)_: Truman è sui binari. Riferisci la scena prima che cali la luce.
- `m5.b9.report.p01` [m5_report_intro] _(scena)_ — (Truman arriva lungo i binari, col passo di chi non vuole arrivare.)
- `m5.b9.report.p02` [m5_report_intro] **TRUMAN** — Non avete toccato niente. Bene: adesso tocca a me guardare.
- `m5.b9.report.theory_degeneration` [m5_report_intro] **COOPER** — Una lettura: qualcuno aveva fissato un incontro qui. E qualcosa si è rotto.
- `m5.b9.report.contest.p01` [m5_report_intro] **TRUMAN** — La polvere, Cooper. L'hai scritta tu: intatta fino al bordo. Cosa la tiene al centro?
- `m5.b9.report.contest.p02` [m5_report_intro] **COOPER** — Non lo so ancora, Harry. Ho fotografato il bordo, non la risposta.
- `m5.b9.report.contest.p03` [m5_report_intro] **TRUMAN** — Allora a verbale vanno i fatti. La lettura resta tua.
- `m5.b9.report.p04` [m5_report_intro] **TRUMAN** — (guarda l'anello senza toccarlo) Questo va nella cassaforte delle prove. Stasera.
- `m5.b9.report.p05` [m5_report_intro] **COOPER** — È l'unico oggetto la cui posizione non riesco ancora a leggere come accidentale. Vorrei poterlo guardare finché non ci riesco.
- _commit_ `m5_report_intro`
- **scelte** [m5_s1]: s1_institutional · s1_documented
- _stato_: {"nodes_done":["m5_report_intro"]}
- _obiettivo (dopo l'avanzamento)_: Truman è sui binari. Riferisci la scena prima che cali la luce.
- **scelta presa**: `s1_institutional`
- `m5.b9.s1.institutional.p01` [m5_s1] _(scena)_ — (Cooper fotografa. Truman registra e deposita.)
- `m5.b9.s1.institutional.p02` [m5_s1] **TRUMAN** — Quando saprai che cos'è, sarà dove deve essere.
- `m5.b9.report.p06` [m5_report_close] **HAWK** — (dalla porta) Le impronte non si fermano al vagone. Non te lo dico da qui. Vieni.

> **HUD:** Hawk è ai binari, oltre il vagone.

- `m5.b9.report.p07` [m5_report_close] **TRUMAN** — Prima che faccia buio. Se il sentiero va dove penso, laggiù il banco lo tiene Renault. Io resto con l'anello e con il verbale.
- _commit_ `m5_report_close`
- _stato_: {"nodes_done":["m5_report_close"],"values":{"s1":"institutional"}}
- _obiettivo (dopo l'avanzamento)_: Hawk è ai binari, oltre il vagone.
- `m5.a14.tracks.p01` [m5_tracks_north] _(scena)_ — (Le impronte vecchie passano l'angolo del vagone ed entrano nel taglio fra gli alberi. Accanto, il cartello.)
- `m5.a14.tracks.p02` [m5_tracks_north] **HAWK** — Dal cartello in poi il sentiero non serve altre proprietà. Un'ora di cammino. Finisce a One Eyed Jacks.
- `m5.a14.tracks.p03` [m5_tracks_north] **COOPER** — Chi tiene il banco, allora. Cominciamo da lui.
- _commit_ `m5_tracks_north`
- _stato_: {"flags":["east_route_confirmed"],"evidence":["E_TRACCE_EST"],"nodes_done":["m5_tracks_north"]}
- _obiettivo (dopo l'interazione)_: One Eyed Jacks: siediti al tavolo di Jacques Renault.

> **HUD:** One Eyed Jacks: siediti al tavolo di Jacques Renault.

- `m5.sign_oej.p01` [m5_sign_oej] _(scena)_ — "ONE EYED JACKS — oltre il confine". Una freccia indica il sentiero a nord.
- `m5.sign_oej.p02` [m5_sign_oej] **COOPER** — Una freccia oltre confine non è una prova. È però un invito geograficamente molto preciso.
- _commit_ `m5_sign_oej`
- _stato_: {"nodes_done":["m5_sign_oej"]}
- _obiettivo (dopo l'interazione)_: One Eyed Jacks: siediti al tavolo di Jacques Renault.
- **porta** traincar → oej
- `m6.b1.ferry.p01` [m6_ferry] _(scena)_ — (Il traghetto attraversa senza registro.)
- `m6.b1.ferry.p02` [m6_ferry] _(scena)_ — (Dentro, nessuno guarda Cooper.)
- `m6.b1.ferry.p03` [m6_ferry] _(scena)_ — (Jacques controlla la passerella prima del mazzo.)
- `m6.b1.ferry.p04` [m6_ferry] **HAWK** — (fuori, piano) Io resto qui. Se chiudono il molo, restiamo dentro.
- `m6.b1.ferry.p05` [m6_ferry] **COOPER** — Tieni libera la passerella. Io vado al tavolo.
- _commit_ `m6_ferry`
- `m6.b4.tactic.p01` [m6_tactic] _(scena)_ — (Jacques mescola. Il posto di fronte a lui è vuoto: un invito e una trappola.)
- `m6.b4.tactic.p02` [m6_tactic] _(scena)_ — (Jacques spinge il mazzo al centro del tavolo.)
- `m6.b4.tactic.cards_recall` [m6_tactic] _(scena)_ — (Il mazzo è tagliato squadrato, di piatto. Come le carte sotto il sedile, nel vagone.)
- `m6.b4.tactic.p03` [m6_tactic] **COOPER** — Jacques. Prima di cominciare, il mazzo resta sul tavolo.
- _commit_ `m6_tactic`
- **scelte** [m6_tactic]: tactic_prova · tactic_pressione · tactic_falsa_sicurezza
- _stato_: {"nodes_done":["m6_ferry","m6_tactic"]}
- _obiettivo (dopo l'interazione)_: One Eyed Jacks: siediti al tavolo di Jacques Renault.
- `m6.b3.audrey.p01` [m6_audrey] **AUDREY** — (a bassa voce, senza voltarsi) Non mi saluti. Sono la nuova del guardaroba, e lei non mi ha mai vista.
- `m6.b3.audrey.p02` [m6_audrey] **COOPER** — (senza voltarsi) La nuova del guardaroba esce da quella porta entro dieci minuti. Ci vediamo dal lato giusto del fiume.
- _commit_ `m6_audrey`
- _stato_: {"flags":["audrey_vista_oej"],"nodes_done":["m6_audrey"]}
- _obiettivo (dopo l'interazione)_: One Eyed Jacks: siediti al tavolo di Jacques Renault.
- **scelte** [m6_tactic]: tactic_prova · tactic_pressione · tactic_falsa_sicurezza
- _obiettivo (dopo l'interazione)_: One Eyed Jacks: siediti al tavolo di Jacques Renault.
- **scelta presa**: `tactic_falsa_sicurezza`
- `m6.b5.falsa.p01` [m6_interrogation_falsa] **COOPER** — (si siede, posa due fiches) Mi hanno detto che il banco qui perde volentieri, con chi sa stare al tavolo.
- `m6.b5.falsa.p02` [m6_interrogation_falsa] **JACQUES** — (ride) Chi gliel'ha detto sapeva stare al tavolo?
- `m6.b5.falsa.q1` [m6_interrogation_falsa] **COOPER** — Che tavolo era, quella notte? Chi teneva il banco?
- `m6.b5.falsa.p04` [m6_interrogation_falsa] **JACQUES** — Io. Io tengo sempre il banco — anche fuori di qui. Anche al vagone si giocava, quella notte, e il banco era mio.
- `m6.b5.falsa.q2` [m6_interrogation_falsa] **COOPER** — (seconda domanda) E il terzo? Quello che non giocava.
- `m6.b5.falsa.p06` [m6_interrogation_falsa] **JACQUES** — (la risata cala) Non beveva. Guardava la stufa come si guarda una persona. (pausa) Io i tipi così li lascio guardare.
- `m6.b5.falsa.p07` [m6_interrogation_falsa] **COOPER** — Che cosa guardava, secondo te?
- `m6.b5.falsa.p08` [m6_interrogation_falsa] **JACQUES** — (raccoglie le fiches) Questa è una domanda da tavolo alto, agente. Si gioca un'altra sera.
- _commit_ `m6_interrogation_falsa`
- `m6.b6b.p5.p01` [m6_p5] _(scena)_ — Ammissione registrata: Jacques era al vagone.
- _commit_ `m6_p5`
- **scelte** [m6_p5]: p5_present · p5_killed · p5_no_third_man
- _stato_: {"flags":["jacques_admitted_presence"],"evidence":["JACQUES_THIRD_MAN_DETAIL"],"nodes_done":["m6_interrogation_falsa","m6_p5"]}
- _obiettivo (dopo l'avanzamento)_: Metti a fuoco che cosa puoi sostenere su Jacques.
- **scelta presa**: `p5_killed`

> **HUD:** Metti a fuoco che cosa puoi sostenere su Jacques.

- `m6.b6b.p5.feedback.killed` [m6_p5] _(scena)_ — Le prove collocano. Non attribuiscono.
- **scelte** [m6_p5]: p5_present · p5_no_third_man
- _obiettivo (dopo l'avanzamento)_: Metti a fuoco che cosa puoi sostenere su Jacques.
- _obiettivo (prima del taccuino)_: Metti a fuoco che cosa puoi sostenere su Jacques.
- _obiettivo (nel taccuino)_: OBIETTIVO: Metti a fuoco che cosa puoi sostenere su Jacques.
- **taccuino** coppia E_CARTE + JACQUES_THIRD_MAN_DETAIL → available (m6_cmp_cards_falsa)

> **HUD:** (nessun obiettivo)

- `m6.b4c.cmp_cards.falsa.p01` [m6_cmp_cards_falsa] _(scena)_ — Carte sotto il sedile del vagone; il mazzo di Jacques al tavolo. Taglio squadrato in entrambi.
- _commit_ `m6_cmp_cards_falsa`
- **scelte** [m6_cmp_cards_falsa]: cards_hand · cards_killer
- **scelta presa**: `cards_hand`
- `m6.b4c.cmp_cards.falsa.feedback.hand` [m6_cmp_cards_falsa] _(scena)_ — (Cooper allinea le due annotazioni. Una mano, due tavoli.)
- **scelte** [m6_cmp_cards_falsa]: cards_hand · cards_killer
- _obiettivo (dopo l'avanzamento)_: (nessuno)
- **scelte** [m6_p5]: p5_present · p5_no_third_man
- _obiettivo (dopo l'interazione)_: Metti a fuoco che cosa puoi sostenere su Jacques.
- **scelta presa**: `p5_present`

> **HUD:** Metti a fuoco che cosa puoi sostenere su Jacques.

- `m6.b6b.p5.feedback.present` [m6_p5] _(scena)_ — Jacques può essere collocato sulla scena. La sua presenza non basta ad attribuirgli l'omicidio.
- `m6.b7.arrest.p01` [m6_arrest] **COOPER** — Metti per iscritto ciò che hai ammesso. Con un avvocato, se lo vuoi.

> **HUD:** Accompagna Jacques oltre il fiume per formalizzare la dichiarazione.

- `m6.b7.arrest.p02` [m6_arrest] **JACQUES** — E se dico di no?
- `m6.b7.arrest.p03` [m6_arrest] **COOPER** — Allora torneremo con più domande e meno discrezione.
- `m6.b7.arrest.p04` [m6_arrest] _(scena)_ — (Jacques guarda la sala. Poi raccoglie il cappotto.)
- `m6.b7.arrest.p05` [m6_arrest] **JACQUES** — Un foglio. Poi torno. (al traghetto) Il fiume ha due lati, agente. Ricordatevelo quando lo riattraversate.
- `m6.b7.arrest.p06` [m6_arrest] _(scena)_ — (Sul molo della contea, Jacques spinge Hawk e prova a correre. Il piede scivola fra due assi.)
- `m6.b7.arrest.p07` [m6_arrest] _(scena)_ — (Jacques cade fra le assi. Quando Hawk lo gira, la gamba non segue.)
- _commit_ `m6_arrest`
- _stato_: {"flags":["jacques_preso"],"nodes_done":["m6_arrest"]}
- _obiettivo (dopo l'avanzamento)_: Passa dall'ospedale: Renault è piantonato.
- _viaggio_ → sheriff 11,4,left (viaggio: centrale)

> **HUD:** Passa dall'ospedale: Renault è piantonato.

- `m6.b7b.early.p01` [m6_return_night_early] **TRUMAN** — Prima l'ospedale, Cooper. Voglio che tu veda dove l'ho messo.
- `m6.b7b.early.p02` [m6_return_night_early] **COOPER** — Vado. Poi il rapporto.
- _commit_ `m6_return_night_early`
- _stato_: {"nodes_done":["m6_return_night_early"]}
- _obiettivo (dopo l'interazione)_: Passa dall'ospedale: Renault è piantonato.
- _viaggio_ → hospital 13,7,down (viaggio: reparto)
- `m6.b7c.guard.p01` [m6_hospital_guard] _(scena)_ — (Fine visite. In fondo al reparto, davanti a una porta chiusa, un agente della contea su una sedia. Non legge.)
- `m6.b7c.guard.p02` [m6_hospital_guard] _(scena)_ — (Il registro del turno è aperto sul banco. Ultima riga: la firma di Hawk, ora del ricovero.)
- `m6.b7c.guard.p03` [m6_hospital_guard] **INFERMIERA** — Piantonato. Firma domattina.
- `m6.b7c.guard.p04` [m6_hospital_guard] **COOPER** — Diane, nove e dieci. Porta chiusa, sedia occupata. La firma è domattina.
- _commit_ `m6_hospital_guard`
- _stato_: {"nodes_done":["m6_hospital_guard"]}
- _obiettivo (dopo l'avanzamento)_: Torna alla centrale e chiudi il rapporto sul fermo di Renault.

> **SALVA + RICARICA** — obiettivo prima: «Torna alla centrale e chiudi il rapporto sul fermo di Renault.» · dopo: «Torna alla centrale e chiudi il rapporto sul fermo di Renault.»
> entità prima: gerard@11,4 · infermiera@11,8 · piantone@7,3 · ronette@3,5 · dopo: gerard@11,4 · infermiera@11,8 · piantone@7,3 · ronette@3,5

- _viaggio_ → sheriff 11,4,left (viaggio: centrale)

> **HUD:** Torna alla centrale e chiudi il rapporto sul fermo di Renault.

- `m6.b7b.night.p01` [m6_return_night] _(scena)_ — (Il traghetto di ritorno è più lento. O sembra.)
- `m6.b7b.night.p02` [m6_return_night] _(scena)_ — (In centrale: il rapporto preliminare porta via la sera. Hawk scrive, Cooper firma, la finestra diventa nera.)
- `m6.b7b.night.p03` [m6_return_night] **TRUMAN** — Domattina l'ospedale, con il foglio. Adesso a casa, Cooper. Il paese ha già una notte in meno.
- `m6.b7b.night.audrey` [m6_return_night] **TRUMAN** — La nuova del guardaroba è rientrata con la barca delle otto. L'ho accompagnata io.
- `m6.b7b.night.p04` [m6_return_night] _(scena)_ — (Il telefono di Lucy squilla. Risponde, poi alza lo sguardo verso Cooper.)
- `m6.b7b.night.p05` [m6_return_night] **COOPER** — Diane, Jacques è in custodia. Firmo il rapporto prima che la memoria cominci a correggerlo.
- _commit_ `m6_return_night`
- _stato_: {"nodes_done":["m6_return_night"]}
- _obiettivo (dopo l'interazione)_: Vai da Lucy: l'ospedale è in linea.
- _viaggio_ → sheriff 3,6,down (viaggio: reception)

> **HUD:** Vai da Lucy: l'ospedale è in linea.

- `m6.b8.news.p01` [m6_news] **LUCY** — Agente Cooper? L'ospedale è in linea. È terribile.
- `m6.b8.news.p02` [m6_news] **LUCY** — Jacques Renault... soffocato nel suo letto. Un cuscino. Nessun testimone.
- `m6.b8.news.p03` [m6_news] **LUCY** — Chi entra ed esce da un ospedale senza farsi notare, agente? Chi?
- `m6.b8.news.cooper_falsa` [m6_news] **COOPER** — Sarebbe tornato al tavolo. E io non saprò mai che cosa guardava il suo terzo uomo, quando guardava la stufa.
- `m6.b8.news.cooper_impeto` [m6_news] **COOPER** — Avevo scritto impeto, Harry. Lo tengo a verbale. Ma un cuscino non è un impeto: un cuscino aspetta.
- _commit_ `m6_news`
- _stato_: {"flags":["jacques_dead","jacques_testimony_lost"],"nodes_done":["m6_news"]}
- _obiettivo (dopo l'avanzamento)_: Torna alla stanza 315.
- _viaggio_ → hospital 13,7,down (viaggio: reparto)

> **HUD:** Torna alla stanza 315.

- `m6.b8b.hospital.p01` [m6_hospital] _(scena)_ — (La porta di Jacques: sigillata da stamattina. Davanti a Ronette: il piantone è raddoppiato.)
- `m6.b8b.hospital.p02` [m6_hospital] _(scena)_ — (Il registro del turno è aperto sul banco.)
- `m6.b8b.hospital.p03` [m6_hospital] **INFERMIERA** — Nessuno ha chiesto accesso alla stanza.
- `m6.b8b.hospital.p04` [m6_hospital] **COOPER** — Nessun ingresso registrato e un uomo morto sotto sorveglianza. Il registro non spiega la stanza.
- _commit_ `m6_hospital`
- _stato_: {"flags":["jacques_death_suspicious"],"nodes_done":["m6_hospital"]}
- _obiettivo (dopo l'interazione)_: Torna alla stanza 315.
- _viaggio_ → room_315 13,4,up (viaggio: stanza 315)
- _dialogo classico_ `hotel_risveglio` su room_315: Diane, 6:20. Stanza
315, Great Northern. / Ho dormito vestito,
con la lampada accesa. / Nel sogno Laura mi ha
detto chi e stato. Lo / avevo. L'ho tenuto fino
alla porta della stanza / rossa; poi la
porta si e chiusa. / Il nome e andato.
Il resto no. / Nel fascicolo di Harry
c'e un secondo nome. / Ronette Pulaski.
Respira ancora. / Harry per
primo. Poi lei.
- _dialogo classico_ `gigante1_dlg` su room_315: Lo specchio vibra. La
stanza si fa fredda. / Un'ombra alta prende
forma nel riflesso. / Mi perdoni l'intrusione.
Le diro tre cose. / E successo di nuovo.
E accadra ancora. / I gufi non sono
cio che sembrano. / Senza sostanze
chimiche, lui torna. / Questo le apparterra
quando sara vero. / Tre avvertimenti,
nessuna istruzione. / Comincero dai gufi:
almeno lasciano tracce.
- _obiettivo (dopo l'interazione)_: Riferisci a Truman ciò che hai visto nella 315.
- _viaggio_ → sheriff 11,4,left (viaggio: centrale)

> **HUD:** Riferisci a Truman ciò che hai visto nella 315.

- `m6.b9.atto4.p01` [m6_atto4_bridge] **COOPER** — Harry, devo dirle una cosa che suonerà incredibile. Un gigante mi è apparso, allo specchio.
- `m6.b9.atto4.p02` [m6_atto4_bridge] **TRUMAN** — Un gigante non so dove metterlo. Jacques sì: qualcuno ha superato un piantone.
- `m6.b9.atto4.register` [m6_atto4_bridge] **TRUMAN** — Il registro dice nessuno. Allora era qualcuno che non firma.
- `m6.b9.atto4.p03` [m6_atto4_bridge] **COOPER** — Cominciamo dal piantone. Sul Gigante non scrivo ancora nulla.
- `m6.b9.atto4.p04` [m6_atto4_bridge] **TRUMAN** — Se qualcuno temeva ciò che Jacques sapeva, ora abbiamo perso il modo di verificarlo.
- `m6.b9.atto4.s1_safe` [m6_atto4_bridge] **TRUMAN** — L'anello è in cassaforte. Lo cito nel rapporto.
- _commit_ `m6_atto4_bridge`
- _stato_: {"flags":["atto4"],"nodes_done":["m6_atto4_bridge"]}
- _obiettivo (dopo l'avanzamento)_: Passa dal diner, questo pomeriggio.
