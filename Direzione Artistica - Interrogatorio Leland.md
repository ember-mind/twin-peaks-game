---
type: project
project: Twin Peaks Game
created: 2026-07-22
status: draft
---

# Direzione artistica narrativa — L'interrogatorio di Leland (Atto 5)

## REVISIONE VINCOLANTE post-esame (voto 25/30, tutor 2026-07-22)

Le correzioni seguenti PREVALGONO sul corpo del documento (conservato com'era per l'archivio dell'esame):

1. **Tesi corretta**: NON "da colpevole a seconda vittima" — la trasformazione è «da "esiste un colpevole unitario che il metodo può identificare" a "la responsabilità è fratturata ma non cancellata: Leland è insieme perpetratore, strumento e vittima di qualcosa che il verbale non sa separare"». Il soprannaturale complica la responsabilità, non la assolve mai.
2. **Laura resta il centro morale**: la foto NON va girata a faccia in giù (rimozione simbolica della vittima nel momento in cui la scena privilegia la sofferenza del suo assassino) — Cooper la toglie dalla linea visiva di Leland e la tiene davanti a sé: Laura non è disponibile alla richiesta di assoluzione. La domanda del perdono resta senza risposta E senza inquadratura consolatoria.
3. **Obiettivo di BOB**: "vuole essere visto e non creduto" è un'ipotesi interpretativa, non canone — va marcata come tale finché non è dimostrata da (a) forma della confessione (alternanza deliberata di dettagli verificabili e affermazioni impossibili) e (b) conseguenza (qualcuno scarta il verbale come delirio, o Cooper lo anticipa).
4. **Segnali di BOB: massimo due** — bob accelerato da seduto + registro linguistico (terza persona, sintassi corta). TAGLIATI: orientamento verso la camera (citazione riconoscibile + rischio jumpscare/bug) e aumento del fruscio del nastro (unico effetto non fisico: eliminato).
5. **Niente pagine non accelerabili** (B8): confisca del controllo di lettura (accessibilità, dislessia, replay, localizzazione). Sostituzione: tempo minimo breve per pagina + pausa sempre possibile + skip per replay; la gravità la fanno frasi corte e performance.
6. **Percolatore onesto** (B5): processo REALMENTE continuo — parte quando Cooper entra in stazione, finisce in funzione del tempo del player (può cadere in punti diversi). Mai un processo "naturale" sincronizzato di nascosto come una colonna sonora.
7. **"Diane" con rituale visibile** (B10): Cooper prende il registratore, lo guarda, non lo accende, comincia «Diane…», si interrompe, parla alla stanza — la rottura dell'abitudine dev'essere leggibile, non contraddittoria.
8. **Player attivo, non spettatore**: l'ordine degli indizi non basta. Da progettare (revisione Atto 5): tre metodi d'interrogatorio convergenti (probatorio / personale / intuitivo — cambiano quale Leland emerge prima, cosa entra nel verbale, quale confessione si porta nella Loggia) + UNA scelta giustizia/pietà sul registratore (continuare a registrare vs fermarlo: cambia prova, responsabilità, ruolo di Truman, monologo finale — mai i fatti canonici).
9. **Truman è un agente, non un accessorio**: serve la sua scheda (cosa vuole, cosa teme, quando smette di essere sceriffo e diventa amico, cosa sceglie di NON verbalizzare, cosa fa se Cooper ferma il registratore). La penna posata = "scrivere non equivale più a testimoniare", non un'immagine elegante.
10. **Regole visive: gerarchie, non dogmi** — "una sola infrazione" → «le deviazioni devono essere rare, leggibili e gerarchizzate»; "un oggetto animato per stanza" → «un solo movimento domina l'attenzione, gli altri sono fondo»; "mai marker/outline" → l'accessibilità ha SEMPRE precedenza sulla purezza diegetica; "la camera non commenta" → «la camera mantiene la grammatica stabile del gioco; solo la Loggia può alterarla»; "porte a sud" = convenzione tecnica, senza carico morale.
11. **T3 corretto**: non "il paese sa e gira alla larga" (causalmente infondato) — Truman ha liberato la zona nord, un vice copre il banco, la sala comune continua quasi normale: la normalità che NON SA è più dolorosa.
12. **T4 sfoltito**: per ogni fase di trasformazione: un cambiamento di attività + un cambiamento sonoro + UN SOLO oggetto risemantizzato (per T4: la sedia non rimessa a posto; il resto tagliato).
13. **Campione**: troppa frase memorabile; separare in produzione: AZIONE / IMMAGINE / SUONO / PERFORMANCE / DIALOGO MOSTRATO / STATO / INTENTO DI REGIA — la prosa poetica vive nella colonna "intento", mai automaticamente a schermo.
14. **Producibilità**: mai "fattibile con la pipeline" senza enumerare il lavoro — ogni elemento nuovo va in tabella (esiste / modifica / nuovo asset / rischio percettivo a scala 16×20).

---

Esercizio di progettazione narrativa e identità sensoriale. Nessuna implementazione: questo documento definisce direzione, non asset. Lavora sul gioco reale (mini-RPG THREE.js in idioma Pokémon B/W: mondo 3D, sprite chibi 16×20, texture procedurali, luci per mappa, audio WebAudio sintetico).

## Assunzioni dichiarate

1. **Scena scelta**: l'interrogatorio di Leland Palmer (Atto 5, nodi `leland_interr` → confessione → morte in cella), nella stazione dello sceriffo (mappa `sheriff`). Personaggi: Cooper (protagonista), Leland/BOB (interlocutore), Truman (terzo, testimone della legge). Cambiamento narrativo: il caso si chiude e si sfonda insieme — l'assassino è trovato, ma la categoria "assassino" non basta più a contenere ciò che affiora.
2. La stanza degli interrogatori non è oggi una sotto-mappa distinta: si assume che la scena avvenga in una zona dedicata della mappa sheriff (angolo nord, vicino alle celle). La direzione è progettata per funzionare anche senza nuova mappa.
3. Il gioco è un fan game della serie TV; questa direzione NON trascrive inquadrature, stilemi registici o palette della serie né di altri giochi: progetta per l'idioma già proprio del progetto (chibi procedurale + 3D prospettico) e per il medium-gioco (griglia, dialoghi a pagine, menu indizi).
4. Dettagli di retroterra del luogo (chi ha costruito la stazione, manutenzione, ecc.) non esistono nei dati attuali: sono inventati qui e marcati come canone di progetto proposto.
5. Vincolo produttivo assunto: tutto ciò che si propone deve essere realizzabile con la pipeline esistente (texture procedurali, palette per mappa, billboard, luci hemi+sole, WebAudio) — niente asset esterni.

==================================================
## 1. Tesi narrativa
==================================================

- **Premessa**: Cooper ha abbastanza indizi (diario→ROBERT, la lettera O, la visione di Sarah, la bugia su Missoula) per mettere Leland davanti alle proprie mani. Lo convoca nella stanza più banale della città.
- **Obiettivo del protagonista**: ottenere la verità *senza distruggerla* — far confessare Leland proteggendo, per quanto possibile, l'uomo dentro il colpevole.
- **Obiettivo della forza opposta**: BOB vuole essere *visto e non creduto* — confessare in un modo che suoni a verbale come follia, così che la verità muoia in un archivio.
- **Conflitto**: il metodo (domande, prove, registratore) contro qualcosa che le procedure possono registrare ma non contenere; e, dentro Cooper, giustizia contro pietà.
- **Valore emotivo in gioco**: la fiducia che *conoscere* equivalga a *poter proteggere*. All'ingresso Cooper la possiede; all'uscita no.
- **Informazione/interpretazione che cambia**: da "Leland è il colpevole" a "Leland è la seconda vittima". L'informazione nuova non è il nome — è la direzione della colpa.
- **Condizione narrativa all'ingresso**: il player ha il caso "risolto" nel menu X; manca solo l'ammissione.
- **Condizione narrativa all'uscita**: confessione ottenuta, Leland morto in cella, caso formalmente chiuso, comprensione spalancata: resta da tornare dove le procedure non arrivano (la Loggia).
- **Cosa deve desiderare il giocatore alla fine**: non "vincere" — *tornare nella Stanza Rossa* per chiudere il conto che il verbale non può chiudere.
- **Cosa deve ricordare ore dopo**: che la confessione è avvenuta accanto a una macchina del caffè accesa; che la stanza è rimasta identica mentre tutto cambiava.

**Promessa emotiva (una frase):** «Vedrai la verità ottenuta con gentilezza, e scoprirai che non basta a salvare nessuno.»

**Contraddizione centrale del mondo (una frase):** «Twin Peaks è un paese che si conosce per nome, casa per casa — ed è esattamente lì, nel conosciuto, che il male ha abitato indisturbato.»

**Come il luogo partecipa al conflitto (una frase):** «La stazione dello sceriffo è arredata come un soggiorno — caffè, ciambelle, bacheca dei volantini — e la scena la costringe a fare da contenitore all'inconfessabile: il conflitto è tra la stanza e ciò che le si chiede di contenere.»

*(Nota di metodo: in tutto il documento, dove servirebbe una parola come "inquietante" si descrive invece il meccanismo percettivo: quale contrasto, quale suono, quale scala produce l'effetto.)*

==================================================
## 2. Tre direzioni artistiche alternative
==================================================

Tre interpretazioni della stessa scena, non tre gradazioni della stessa idea.

### Direzione A — «La casa della legge» (il protettivo che si rivela impotente)

Lettura: la stazione è lo spazio più *domestico* della città — e la scena dimostra che la domesticità non è una difesa.

- **Forma dominante**: rettangoli orizzontali bassi (banconi, panche, mensole) — il vocabolario del soggiorno.
- **Geometria**: ortogonale, stanze ampie e poco profonde; la stanza dell'interrogatorio è l'unica *quadrata* della mappa (proporzione 1:1 = nessun "lato lungo" dove rifugiare lo sguardo).
- **Scala**: soffitti standard (muri 2.1 come gli altri interni); nessun elemento sovradimensionato — l'orrore non ottiene architettura speciale.
- **Densità visiva**: alta nella zona comune (bacheca, tazze, giacche appese), che cala progressivamente fino alla stanza dell'interrogatorio quasi vuota: tavolo, tre sedie, registratore, presa a muro. Il gradiente di densità È il percorso narrativo.
- **Pubblico/privato**: tutto pubblico tranne le celle; la stanza dell'interrogatorio è l'ambiguo in mezzo — pubblica per legge, privata per vergogna.
- **Materiali**: legno di pino locale (stesse tavole della segheria), linoleum consumato al centro dei corridoi, metallo solo dove obbligatorio (celle, schedario).
- **Manutenzione**: buona ma casalinga — riparazioni visibili (una gamba di sedia di colore diverso), non professionali.
- **Tracce d'uso**: cerchi di tazze sul bancone, volantino della fiera sotto quello delle persone scomparse, cappotti su ganci in numero maggiore dei presenti.
- **Gerarchia di luminanza**: la zona comune tiene i valori medi-alti; la stanza dell'interrogatorio ha UNA sorgente (lampada a sospensione sul tavolo) → il tavolo è la cosa più chiara del gioco in quel momento, i muri restano leggibili ma in secondo piano.
- **Colore**: la palette calda degli interni già in pipeline (WPAL), saturazione invariata — il colore NON annuncia la scena; il cambiamento sta nella distribuzione della luce, non nella tinta.
- **Sorgenti di luce credibili**: finestre (giorno grigio), lampade a sospensione, la spia rossa del registratore — unico rosso della stanza, 2×2 pixel, guadagnato (vedi grammatica, §5).
- **Ombre**: morbide e corte (PCFSoft già in motore); nessuna ombra "espressiva" — le ombre restano fisica, non commento.
- **Aria**: vapore dalla macchina del caffè nella zona comune (sprite billboard animato); aria ferma nella stanza.
- **Meteo**: pioggia fine alle finestre solo se già attiva nel sistema (town piove): il meteo è processo del mondo, non punteggiatura della scena.
- **Suono ambientale**: radiatore che ticchetta raffreddandosi, percolatore, fluorescenza solo in corridoio.
- **Suoni umani**: passi sul linoleum, la sedia di Truman che scricchiola quando lui si appoggia indietro (segnale di disagio, ricorrente).
- **Suoni meccanici**: click del registratore (avvio/stop), scatto della serratura della cella — due suoni corti, secchi, mai musicali.
- **Silenzi**: il percolatore si spegne a metà scena (ha finito il ciclo): il fondo sonoro si assottiglia SENZA intervento drammatico — il silenzio arriva per ragioni domestiche e resta per ragioni drammatiche.
- **Ritmo del movimento**: griglia normale fuori; nella stanza il player non si muove — la scena è ferma per regia di dialogo, il movimento migra nelle animazioni degli sprite.
- **Postura/animazione**: Leland siede *composto* (frame idle senza bob); il passaggio BOB non cambia lo sprite ma il TEMPO — il bob a 2 frame accelera oltre il ritmo di camminata, da seduto (una cosa che nel vocabolario chibi del gioco non accade mai: infrazione unica, riservata).
- **Protagonista/ambiente**: Cooper è ospite competente — sa dove sono le tazze; la stanza non gli oppone resistenza, e questo è il punto: nessun aiuto dall'ambiente, la difficoltà è tutta nella persona di fronte.
- **Interfaccia/mondo**: il menu X resta lo strumento: il gioco chiede di *presentare* gli indizi (già gated così); la UI è il taccuino di Cooper, non un HUD.
- **Prima impressione**: «questa è la stanza più normale del gioco».
- **Dopo la rivelazione**: «questa stanza non aveva nessun potere — l'ho creduta sicura perché è gentile».
- **Rischio narrativo principale**: la banalità può leggersi come piattezza se il gradiente di densità e il silenzio non vengono rispettati.
- **Rischio di cliché**: il "cozy che nasconde il marcio" è abusato nel genere small-town; qui regge solo se la stanza NON tradisce mai segni gotici (nessuna macchia, nessun oggetto sinistro).

### Direzione B — «L'archivio» (la legge come macchina di registrazione)

Lettura: la stazione è un dispositivo per trasformare il dolore in pratiche; la confessione è l'evento che il modulo non riesce a contenere.

- **Forma dominante**: verticali ripetute — schedari, faldoni, caselle.
- **Geometria**: corridoio spinale con stanze cieche; la stanza dell'interrogatorio in fondo, la più lontana dalla porta d'ingresso (distanza percorsa = procedura che si stringe).
- **Scala**: schedari fino al soffitto — l'unico luogo del gioco dove l'arredo supera l'altezza dei muri visibili; le persone risultano basse in rapporto alla carta accumulata.
- **Densità visiva**: uniforme e alta — pareti gremite di caselle e cornici; l'occhio non riposa: il meccanismo percettivo è la saturazione del campo, non l'oscurità.
- **Pubblico/privato**: tutto è archivio: anche la bacheca pubblica è vetrina di pratiche. Il privato non esiste, esiste il "non ancora protocollato".
- **Materiali**: metallo verniciato, vetro smerigliato sulle porte (silhouette leggibili, volti no — meccanismo: informazione parziale strutturale).
- **Manutenzione**: perfetta dove passa il pubblico, trascurata nel retro: la facciata è parte della procedura.
- **Tracce d'uso**: timbri consumati al centro, moduli compilati a metà, la data sul calendario a muro cerchiata.
- **Luminanza**: piatta e alta ovunque (fluorescenza), NESSUNA gerarchia: tutto ugualmente illuminato = niente ha diritto all'ombra, nemmeno la confessione.
- **Colore**: verdi amministrativi e avorio; il fascicolo di Laura è l'unico oggetto con una copertina scura sul tavolo chiaro (gerarchia per valore, non per tinta).
- **Luci credibili**: tubi fluorescenti con ronzio costante; la spia del registratore qui si perde tra le altre spie (fotocopiatrice, centralino) — la macchina è una tra le macchine.
- **Ombre**: quasi assenti (luce diffusa) — la scena rinuncia del tutto all'ombra come strumento.
- **Aria**: secca; polvere di carta visibile nel controluce della finestra del retro.
- **Meteo**: irrilevante e quindi assente dalle finestre principali (smerigliate).
- **Suono ambientale**: ronzio dei tubi + centralino che squilla lontano SENZA che nessuno risponda (il mondo continua a produrre casi).
- **Suoni umani**: tasti, timbri, la voce di Lucy-figura al telefono in sottofondo, sempre semi-udibile.
- **Suoni meccanici**: il nastro del registratore che *gira* (loop di fruscio) per tutta la scena — il suono-base della stanza è la registrazione stessa.
- **Silenzi**: quando Leland confessa, il centralino smette di squillare: il mondo, per un momento, non produce altri casi. (Silenzio come coincidenza amministrativa, leggibile anche come presagio: ambiguità voluta.)
- **Ritmo**: i passi dei personaggi in quest'area sono a tempo (griglia = metronomo naturale del gioco, qui assecondata).
- **Postura**: Truman compila mentre ascolta — la legge scrive sempre; smette di scrivere una sola volta (beat 9, §8): la penna posata è la performance chiave.
- **Protagonista/ambiente**: Cooper usa la macchina (registratore, fascicolo) ma la sua voce a Diane doppia il verbale con un secondo archivio, personale — due registrazioni in conflitto.
- **Interfaccia/mondo**: il menu X viene reinterpretato come *fascicolo*: presentare un indizio = mettere un foglio sul tavolo.
- **Prima impressione**: «qui ogni cosa finisce in ordine».
- **Dopo la rivelazione**: «l'ordine è il modo in cui questo posto dimentica».
- **Rischio narrativo**: freddezza — il player può disinvestire emotivamente se la scena non tiene il controcanto umano (il caffè portato comunque, la penna posata).
- **Rischio di cliché**: "banalità del male da ufficio" — scorciatoia già consumata dal cinema processuale.

### Direzione C — «La stanza porosa» (l'istituzione che confina col bosco)

Lettura: la provincia non ha muri abbastanza spessi; la stazione è fatta dello stesso pino del bosco, e ciò che è del bosco passa.

- **Forma dominante**: il tronco — travi a vista, tavole con nodi; il fuori ripetuto dentro.
- **Geometria**: ortogonale ma con UNA diagonale: la trave maestra del soffitto attraversa la stanza dell'interrogatorio in obliquo (unica diagonale strutturale del gioco).
- **Scala**: normale a terra, sproporzionata in alto — travi troppo grosse per l'edificio, come se il tetto appartenesse a una struttura più antica.
- **Densità visiva**: bassa; superfici grandi di legno con venature procedurali marcate — l'occhio, senza appigli, torna sempre sulle venature (meccanismo: pareidolia indotta dal materiale, mai da volti disegnati).
- **Pubblico/privato**: il confine debole non è tra pubblico e privato ma tra *dentro e fuori*: zerbini enormi, doppia porta, ganci per cerate — la soglia è l'arredo più ricco.
- **Materiali**: pino non trattato, resina che affiora ai nodi (pixel più chiari e "bagnati"), ferro brunito.
- **Manutenzione**: lotta continua contro l'umidità: secchi sotto due punti del tetto nel corridoio — normalissimi finché piove; il loro *toc* periodico è già nel fondo sonoro.
- **Tracce d'uso**: fango secco a rombi (suole da lavoro) sul linoleum, cerata dello sceriffo che gocciola sull'attaccapanni.
- **Luminanza**: interni caldi standard, MA la finestra della stanza dà sul retro verso la linea degli alberi: il rettangolo più scuro della stanza è la finestra (inversione del ruolo consueto della finestra come fonte di luce — meccanismo percettivo dichiarato).
- **Colore**: la palette esistente; niente virate — il bosco entra come *valore scuro nella finestra*, non come verde simbolico.
- **Luci credibili**: lampade a sospensione + la luce della veranda esterna che rientra di taglio dalla finestra del corridoio.
- **Ombre**: le travi proiettano bande larghe sul tavolo (ombra come architettura, non come umore).
- **Aria**: umida; il vetro della finestra della stanza si appanna dal basso durante la scena (CanvasTexture animata, come l'acqua già in motore).
- **Meteo**: pioggia se attiva; il *toc* dei secchi accelera quando fuori piove più forte — collegamento processo-mondo → suono interno.
- **Suono ambientale**: legno che assesta (crick radi, non a tempo), pioggia sul tetto se piove.
- **Suoni umani**: come A.
- **Suoni meccanici**: il registratore, e il gruppo elettrogeno esterno che stacca e riattacca una volta (evento raro già plausibile in provincia).
- **Silenzi**: quando il gruppo elettrogeno stacca: mezzo secondo senza fondo elettrico — si sente il bosco (vento nelle chiome, lontano).
- **Ritmo**: normale; nessun rallentamento artificiale.
- **Postura**: Leland guarda la finestra scura più spesso di quanto guardi Cooper (orientamento dello sprite: il "guardare fuori" è il suo tell).
- **Protagonista/ambiente**: Cooper legge la stanza come legge i sogni — il gioco NON conferma se la trave, la finestra, il vento significhino qualcosa (split di conoscenza del Role Contract esteso all'ambiente).
- **Interfaccia/mondo**: invariata (menu X).
- **Prima impressione**: «l'edificio è del paese, ma il tetto è del bosco».
- **Dopo la rivelazione**: «non c'è un dentro: c'è solo un fuori con le pareti».
- **Rischio narrativo**: sbilanciare il finale verso il soprannaturale PRIMA della Loggia, bruciando il ritorno alla Stanza Rossa.
- **Rischio di cliché**: horror-segnaletica (luci che sfarfallano, vetri appannati con impronte): la direzione regge solo tenendo ogni fenomeno dentro la fisica di un edificio umido di provincia.

==================================================
## 3. Selezione della direzione
==================================================

Confronto sintetico (A = casa della legge, B = archivio, C = stanza porosa):

- **Coerenza col tema** (il male abita il quotidiano): A la esprime *per costruzione*; B la sposta su "il sistema dimentica" (tema adiacente, non centrale); C la esprime ma spostando l'agente del perturbante dall'umano al bosco — e il tema del gioco è che il mostro stava *in casa*, non fuori.
- **Specificità per questo mondo**: A altissima (il paese-soggiorno è ciò che gli atti 1-4 hanno costruito: Double R, casa Palmer, la piazza); B trasferibile a qualunque poliziesco; C specifica ma ridondante col già fortissimo polo "woods/Loggia" del gioco.
- **Sostenere la scena**: tutte e tre la sostengono; B la sostiene al prezzo del calore.
- **Sostenere l'intero gioco**: A generalizza (ogni interno del gioco è già "domestico"; la regola del gradiente di densità e del silenzio guadagnato vale ovunque); B no (fuori dalla stazione non c'è burocrazia); C generalizza solo verso il bosco.
- **Compatibilità col ruolo del player** (steering di un protagonista autorizzato): A massima — Cooper ospite competente in un mondo accogliente è già il patto degli atti 1-4.
- **Leggibilità narrativa**: A e B alte; C rischia letture soprannaturali premature.
- **Originalità / rischio cliché**: A rischia il "cozy col marcio sotto" MA lo evita con la disciplina "nessun segno gotico"; B è il cliché processuale con meno margine di riscatto; C confina con l'horror-segnaletica.
- **Fattibilità produttiva**: A quasi tutta già in pipeline (palette WPAL, anchor wall, sospensioni, sprite); B chiede molti pattern nuovi (schedari, vetri smerigliati); C chiede vetri animati e diagonali strutturali (la trave obliqua rompe la griglia estrusa attuale).
- **Trasformarsi nel corso della trama**: A eccellente — la stessa stanza gentile può essere riletta quattro volte (vedi §9) senza cambiare un muro.

**Scelta: Direzione A — «La casa della legge»**, con UN prestito disciplinato da B: il registratore come co-protagonista sonoro (spia rossa + click + fruscio del nastro), perché il duello "verbale vs verità" è il motore del beat centrale.

- **Cosa comunica meglio**: che la gentilezza del mondo non è mai stata una difesa — la tesi emotiva dell'intero gioco.
- **Cosa sacrifica**: la potenza figurativa (niente diagonali, niente archivi monumentali, niente bosco alla finestra); la scena rinuncia allo spettacolo e scommette tutto su gradiente di densità, silenzio guadagnato e UN pixel rosso.
- **Perché appartiene a questo gioco**: l'idioma chibi (testone, contorni teneri, palette calda) rende OGNI cosa accogliente per default: qui il limite dello stile diventa il meccanismo della scena — l'orrore deve avvenire in un mondo che non sa smettere di essere carino. Nessun altro progetto ha questo vincolo/risorsa.
- **Perché non è trasferibile senza modifiche**: fuori da questo gioco mancherebbero (a) il patto visivo chibi che produce il contrasto, (b) i quattro atti di paese-soggiorno che caricano la stanza, (c) il Role Contract (Cooper empatico: la scena è scritta per un interrogatorio *gentile* — in un altro poliziesco la stessa direzione produrrebbe solo sottotono).

==================================================
## 4. Cultura materiale del luogo
==================================================

(Canone di progetto proposto — non ancora nei dati.)

- **Chi l'ha costruita**: la contea, fine anni '50, con legname della segheria locale (lotto identico al municipio: stesse tavole, età diversa delle vernici).
- **Funzione originaria**: presidio unico — sceriffo, archivio pratiche, due celle "per la notte del sabato".
- **Chi la possiede**: la contea; **chi la usa davvero**: lo sceriffo e due vice, la centralinista, i ragazzi del Roadhouse la domenica mattina (celle), i cittadini per denunce di smarrimenti — è più ufficio oggetti smarriti che fortezza.
- **Chi la mantiene**: il vice più giovane (riparazioni casalinghe), un idraulico chiamato due volte l'anno; la macchina del caffè la mantiene la centralinista, ed è l'apparecchio più curato dell'edificio.
- **Chi accede / chi è escluso**: porta sempre aperta in orario; esclusi di fatto — non di diritto — quelli che il paese giudica prima della legge (i ragazzi della strada entrano solo ammanettati: l'esclusione è sociale, non scritta).
- **Energia/acqua/merci/informazioni**: rete elettrica del paese + gruppo elettrogeno nel retro; acqua di acquedotto; le ciambelle arrivano dal Double R ogni mattina (rapporto economico reale tra i due luoghi); le informazioni per telefono e per bacheca — la bacheca è il vero social network del paese.
- **Rifiuti e oggetti rotti**: nel retro, accanto al generatore: sedie zoppe mai buttate ("possono servire"), una bicicletta reclamata da nessuno.
- **Cosa si ripara**: tutto ciò che si vede dall'ingresso; **cosa si nasconde**: la macchia d'umidità dietro lo schedario (spostato apposta anni fa); **cosa si lascia deteriorare**: le celle — usarle poco è un vanto, ripararle sembrerebbe un malaugurio.
- **Adattamenti degli abitanti**: cuscini portati da casa sulle sedie d'attesa; tazze personali col nome; il gancio "di Harry" che nessun altro usa.
- **Modifiche imposte dal potere**: il registratore a bobine (circolare federale), la cassaforte per le prove, il telefono diretto con la contea — tutti oggetti *nuovi* rispetto all'arredo, visibilmente di un'altra generazione tecnologica: il potere si riconosce dall'età degli oggetti.
- **Giornata normale**: caffè alle 7, ciambelle alle 7:30, bacheca aggiornata il lunedì, un ubriaco il sabato, il centralino che squilla per un cane smarrito. La scena dell'Atto 5 avviene *dentro* questa giornata, non al suo posto: fuori dalla stanza, la stazione continua.

Metà abbondante di questi dettagli (ciambelle, cuscini, tazze, bacheca, generatore, sedie zoppe) esiste per ragioni funzionali e sociali e non spiega la trama: il luogo esiste anche quando Cooper non c'è.

==================================================
## 5. Grammatica visiva
==================================================

Regole di progetto (valgono per la scena e si estendono al gioco). Formato: origine funzionale → significato possibile → effetto sul giocatore → rischio d'abuso → eccezione consentita.

**Forma**
1. *Orizzontali basse negli interni civici* — arredo nato per accogliere (banconi, panche) → il paese si dà del tu → lo sguardo scorre in piano, riposa → rischio: monotonia → eccezione: le celle (verticali delle sbarre, uniche).
2. *Una sola infrazione geometrica per mappa* — gli edifici nascono ortogonali per costruzione (estrusione a griglia) → ciò che rompe la griglia è memorabile per contrasto statistico → il player impara che le eccezioni significano → rischio: inflazione (due infrazioni = nessuna) → eccezione: la Stanza Rossa, che è TUTTA infrazione (è il fuori-griglia del mondo).
3. *Le porte sono sempre a sud* (regola motore esistente, elevata a grammatica) → leggibilità Pokémon → ogni edificio "guarda" il player → rischio: nessuno reale → eccezione: nessuna; anche la cella la rispetta (la trasgressione non è spaziale ma morale).

**Scala**
1. *Persone e arredi in rapporto costante chibi* → coerenza dell'idioma → il mondo resta "a misura di testona" → rischio: appiattire i momenti gravi → eccezione: il Gigante (già canone: la scala È il suo significato).
2. *La tecnologia federale è fuori scala rispetto all'arredo* (registratore grande sul tavolo piccolo) → oggetti imposti, non scelti (§4) → il player percepisce l'estraneità del dispositivo senza dialogo → rischio: caricatura → eccezione: il telefono di Lucy-figura, federale ma domesticato da adesivi.
3. *Niente architettura monumentale nel civico* → il potere a Twin Peaks non si mostra in altezza → il male non ottiene mai una cattedrale → rischio: perdere gerarchia tra luoghi → eccezione: il Great Northern (l'unica monumentalità è commerciale, non civica).

**Materiale**
1. *Pino locale ovunque nel civico* (stesse texture procedurali, età di vernice diversa) → economia reale del paese (segheria) → continuità casa-istituzione: la legge è fatta della stessa materia delle case → rischio: uniformità illeggibile → eccezione: metallo dove la legge coercisce (celle, cassaforte).
2. *Le superfici toccate ogni giorno sono più chiare al centro* (consumo: maniglie, bordo del bancone) → uso reale → il player legge DOVE la vita passa senza che nessuno lo dica → rischio: sporcare tutto → eccezione: il tavolo dell'interrogatorio, consumato ai bordi e MAI al centro (nessuno ci mangia, nessuno ci gioca).
3. *La tecnologia ha la palette della sua generazione, non della stanza* → gli oggetti portano la loro data → stratigrafia visiva del potere (§4) → rischio: effetto catalogo → eccezione: la radio di Truman, vecchia quanto la stanza.

**Usura e manutenzione**
1. *Riparazioni visibili e non professionali nel civico* (gamba di sedia spaiata) → manutenzione fatta dai vice → il paese si tiene insieme da sé → rischio: folklore pittoresco → eccezione: l'ospedale (riparazioni professionali: dove si muore non si brica).
2. *Ciò che si vede dall'ingresso è in ordine; il disordine sta nel retro* → decoro di provincia → il player che esplora dietro è ricompensato con verità materiale → rischio: retro-teatrino ("guarda quanto realismo") → eccezione: dopo la confessione, un oggetto fuori posto DAVANTI (la sedia di Leland non rimessa a posto — vedi §9).
3. *Le celle non si riparano* → superstizione civica (§4) → quando la cella serve DAVVERO, il suo squallore pesa → rischio: leggere "incuria = colpa" → eccezione: la branda rifatta con cura militare da Truman prima di chiudere Leland dentro — la pietà si esprime in manutenzione.

**Densità**
1. *Gradiente decrescente verso i luoghi di verità* (bacheca fitta → corridoio → stanza spoglia) → funzione: nella stanza non deve esserci nulla da guardare oltre le persone → il player, senza appigli, guarda i volti → rischio: vuoto = solennità automatica → eccezione: la Stanza Rossa (densità BASSA ma segnica altissima).
2. *La densità appartiene alla comunità, il vuoto all'individuo* (piazza e diner pieni; camera di Laura, cella, stanza interrogatori radi) → i luoghi del singolo mostrano ciò che resta quando il paese esce → contrasto strutturale pieno/vuoto → rischio: schematismo → eccezione: la camera di Audrey (individuale E fitta: il suo personaggio è accumulo).
3. *Mai più di un oggetto animato per stanza interna* (vapore O nastro O appannamento) → budget percettivo: l'occhio va dove si muove → il movimento unico è sempre significativo → rischio: staticità da diorama → eccezione: esterni (pioggia + acqua + folla coesistono).

**Composizione**
1. *La camera non commenta* (angolo e distanza fissi da motore; zoom-in dialoghi 7.0 già esistente come UNICA enfasi) → coerenza col renderer → il dramma non riceve inquadrature ad effetto: humility della camera → rischio: momenti chiave sottoesposti → eccezione: nessuna nel gameplay; solo la Loggia può alterare la camera.
2. *Il punto più chiaro della scena è dove la scena vuole le mani del player* (tavolo con lampada = dove si presentano gli indizi) → luce funzionale → guida senza marker → rischio: "follow the light" meccanico → eccezione: il sogno (la luce mente).
3. *Le soglie si vedono sempre per intero* (porte mai tagliate dall'inquadratura) → leggibilità di navigazione → entrare/uscire è sempre una scelta visibile (regola del gesto visibile) → rischio: rigidità di layout → eccezione: la cella — la sua porta si vede per intero DA FUORI, mai da dentro.

**Colore e valore**
1. *La tinta appartiene alla mappa, il valore alla scena* (palette per mappa fissa; la drammaturgia lavora SOLO su luminanza e distribuzione) → pipeline esistente (WPAL, luci per mappa) → i momenti si distinguono per luce, non per filtro → rischio: povertà espressiva percepita → eccezione: la Stanza Rossa (la tinta È il luogo).
2. *Il rosso è contingentato* — nel civico esiste solo come spia del registratore (2×2 px) finché la storia non lo guadagna → scarsità = prezzo semantico → quando il rosso arriva (Loggia), il player lo ha già imparato come "registrazione/verità che ascolta" → rischio: astinenza cromatica sterile → eccezione: le tende della Loggia e la giacca di un singolo NPC di sfondo (rumore intenzionale: il rosso non deve diventare un allarme pavloviano).
3. *Nessuna desaturazione narrativa* (flashback, lutto e sogno NON tolgono colore) → il passato a Twin Peaks non è sbiadito, è presente → il player non riceve la stampella "grigio = ricordo" → rischio: confondere i piani temporali → eccezione: nessuna; i piani si distinguono per contenuto e suono.

**Tre divieti visivi assoluti**
1. *Mai segni gotici nel domestico* (macchie, crepe "significative", quadri storti): l'orrore del gioco abita stanze in ordine.
2. *Mai marker di gameplay nel mondo* (frecce, glow, outline): la guida passa per luce funzionale, bacheca, dialogo (rifiuti diegetici già a contratto).
3. *Mai citazione visiva diretta* di inquadrature o composizioni della serie o di altri giochi: l'idioma resta chibi-procedurale; ciò che si eredita è il *tema*, mai il *quadro*.

==================================================
## 6. Identità sensoriale
==================================================

(Pipeline: tutto sintetizzabile in WebAudio come i 5 brani esistenti; nessun file audio.)

- **Suono-base del luogo**: radiatore che ticchetta + fondo del percolatore (ciclico, si esaurisce). Non loop uniforme: processi con inizio e fine.
- **Suoni intermittenti**: il centralino in lontananza (2 squilli, risposta di Lucy-figura semi-udibile), la porta d'ingresso col campanello da negozio (la stazione È un negozio di fiducia civica).
- **Attività umana**: tazze posate, la sedia di Truman, passi sul linoleum con eco corta.
- **Potere/controllo**: SOLO il registratore — click d'avvio, fruscio del nastro, click di stop. Il potere a Twin Peaks non ha sirene: ha un nastro che gira.
- **Suoni intimi**: il respiro non esiste nel motore; il suo equivalente è il *bob* dello sprite — il "respiro" chibi. Leland fermo = apnea visiva (vedi §2A).
- **Suoni che diventano importanti dopo la rivelazione**: il ticchettio del radiatore. Prima: fondo domestico. Dopo la confessione, in cella, lo stesso ticchettio è l'unico suono — ora significa "il tempo che resta". Stesso suono, significato migrato (disciplina dei motivi: il suono non cambia, il contesto sì).
- **Momenti di silenzio**: (1) il percolatore finisce il ciclo a metà interrogatorio — silenzio per cause domestiche; (2) dopo la morte di Leland, il gioco tace la musica e lascia SOLO il radiatore (l'unico "a cappella" del gioco).
- **Movimenti**: griglia standard; la qualità non cambia mai per decreto drammatico — cambia la *quantità* (la stanza ferma il movimento del player: tutta l'azione migra nel dialogo e nei tell degli sprite).
- **Animazioni quotidiane**: Lucy-figura che compila; vice che appende una giacca; vapore del caffè. Continuano durante la scena, fuori: il mondo non si mette in posa.
- **Comportamento degli oggetti**: gli oggetti non reagiscono al dramma (nessuna tazza che trema): la fisica resta fisica. L'unico oggetto "performativo" è il registratore, e solo nei limiti del suo funzionamento reale.
- **Odori/temperature/tattilità tradotti**: il caldo del radiatore = leggero heat-shimmer NO; troppo costoso semanticamente — si traduce invece con il dialogo (Cooper che si toglie il cappotto: gesto, non effetto) e con il vapore del caffè (billboard). Il freddo della cella = nessun vapore, luce più corta, Leland che tiene le mani sotto le ascelle (frame idle dedicato: UNA variante di sprite, spesa qui).

**Quattro registri di conoscenza** (estensione del Role Contract alla scena):
- *Il player percepisce*: l'accelerazione del bob di Leland, la spia rossa, il silenzio del percolatore.
- *Cooper interpreta* (voce a Diane): "il sospettato alterna due uomini" — Cooper nomina BOB prima che il gioco lo mostri, perché i suoi sogni glielo consentono (intuizione a contratto).
- *Il sistema conosce*: i flag (indizi presentati, confessione ottenuta, `leland_morto`) — il menu X resta il ledger condiviso player/personaggio.
- *Resta ambiguo*: se BOB sia dentro Leland o Leland dentro BOB; il gioco non lo risolve MAI a livello di sistema (nessun flag "posseduto"): l'ambiguità è protetta strutturalmente.

**Divieto**: niente musica di copertura. Il brano `interior` sfuma all'ingresso nella stanza e NON viene sostituito: la scena regge su radiatore, nastro e voci. La musica torna solo col monologo a Diane finale (transizione già supportata dal cross-fade esistente).

==================================================
## 7. Personaggi e mondo
==================================================

(Vincolo: sprite chibi 16×20, 2 frame + bob. La caratterizzazione lavora su silhouette, palette personale, orientamento, tempo di animazione, posizione in griglia.)

**Cooper**
- *Silhouette*: il solo NPC-scale in completo scuro con spalle definite — nel paese di flanelle e cerate, l'abito è la sua divisa di estraneo metodico.
- *Postura*: sempre frontale rispetto all'interlocutore (orientamento pulito in griglia): la frontalità è il suo rispetto.
- *Ritmo*: passo regolare, mai corsa negli interni (correre è dei ragazzi e delle emergenze).
- *Spazio personale*: si ferma a 1 tile dagli NPC, MAI adiacente-diagonale: ordine anche nella prossemica.
- *Oggetti*: registratore personale (a Diane) ≠ registratore federale sul tavolo: due macchine, due verità (§3); il caffè accettato SEMPRE — l'accettare è il suo ponte sociale.
- *Materiali indossati*: lana scura cittadina, scarpe di cuoio pulite NONOSTANTE il fango del paese (qualcuno che si pulisce le scarpe sull'ingresso: dettaglio da dialogo, non da sprite).
- *Cura/usura*: impeccabile; l'unica usura è invisibile e sta nella voce a Diane.
- *Entrare*: dalla porta sud, saluto alla centralinista PRIMA del business (una pagina di dialogo, sempre).
- *Occupare*: sceglie la sedia di lato al tavolo, non di fronte a Leland — l'interrogatorio gentile si siede ad angolo.
- *Nota per primo*: le mani di Leland. *Evita di guardare*: la foto di Laura sul fascicolo mentre Leland parla (la gira verso il tavolo: gesto chiave, beat 6).
- *Cambia durante la scena*: entra investigatore, esce testimone — nel finale non registra più: ascolta (il SUO registratore resta spento in cella).

**Leland/BOB**
- *Silhouette*: capelli grigi (il bianco improvviso è già canone di storia) sopra un completo da lutto portato da troppi giorni — l'unico adulto del paese vestito "bene" senza esserlo per lavoro.
- *Postura*: composta fino alla geometria — siede al centro esatto del tile, frontale al tavolo. Il *troppo ordine* è il primo tell.
- *Ritmo*: bob fermo (apnea) nei momenti Leland; bob accelerato oltre il ritmo di camminata nei momenti BOB — il personaggio "cammina da seduto": il motore usato contro le proprie convenzioni, una sola volta nel gioco.
- *Spazio personale*: cerca l'adiacenza — si sporge sul tavolo (1 px di offset dello sprite: percettibile, non teatrale).
- *Oggetti*: tocca la tazza SENZA bere (il caffè intatto che si raffredda: l'unico caffè rifiutato del gioco — nel paese del caffè, il rifiuto è la vera stonatura).
- *Materiali*: lana buona, stirata male; scarpe da funerale infangate (lui NON si pulisce sull'ingresso: fretta o indifferenza, il gioco non dice quale).
- *Cura/usura*: il nodo della cravatta perfetto, la barba non fatta — la manutenzione di sé ha buchi asimmetrici (chi lo cura? nessuno da settimane).
- *Entrare*: scortato da Truman, ma saluta la centralinista PER NOME e sorride — è il paese, conosce tutti: l'orrore della scena è che è in casa sua anche qui.
- *Occupare*: al centro; quando BOB affiora, lo sprite si orienta verso il player-camera (sud) invece che verso Cooper: guarda *noi* — infrazione unica dell'orientamento, il gioco non la spiega.
- *Nota per primo*: il registratore (lo fissa all'avvio del nastro). *Evita*: la porta delle celle in fondo al corridoio (visibile dalla stanza: non la guarda mai, finché non è il suo turno di attraversarla).
- *Cambia durante la scena*: dall'uomo che il paese conosce → alla voce che il verbale non può trascrivere → al padre svuotato che chiede se sua figlia lo perdonerà. Tre registri, stessa silhouette: la tragedia è che è sempre lui.

Ogni scelta sopra deriva da mestiere (avvocato in lutto), posizione sociale (notabile di paese), abitudini (il caffè, i nomi), risorse (lana buona), storia (i giorni senza cura), necessità (la scorta) e relazione col luogo (casa sua anche qui). Nessun prop è solo simbolo: il caffè intatto è prima di tutto un caffè.

==================================================
## 8. Presentazione della scena — beat
==================================================

Dieci beat. Canali: azione / ambiente / performance / suono / dialogo / silenzio / interfaccia / testo opzionale — mai la stessa informazione su due canali senza ragione.

**B1 — L'ingresso e il caffè.** *Azione*: il player entra nella stazione, la traversa. *Cooper vuole*: prendersi un minuto prima della stanza. *Truman vuole*: che tutto sia "come sempre". *Info disponibile*: la stazione in giornata normale (vapore, bacheca, Lucy-figura). *Trattenuta*: che Leland è già dentro. *Visivo*: gradiente di densità che si assottiglia verso il corridoio nord. *Sonoro*: percolatore + centralino. *Performance*: la centralinista porge la tazza col nome di Harry a Cooper (prestito d'intimità). *Spazio*: la zona comune attraversata per intero. *Dialogo*: una battuta di saluto. *Cambio*: il player, teso verso il climax, viene costretto alla normalità. *Perché non basta una battuta*: la normalità va CAMMINATA — la sua durata spaziale è l'informazione ("qui è un giorno qualunque").

**B2 — La soglia.** *Azione*: entrare nella stanza. *Cooper*: leggere la disposizione. *Leland*: essere trovato composto. *Disponibile*: Leland al centro, il registratore fuori scala, la lampada sul tavolo. *Trattenuta*: chi ha chiesto il registratore (federale? Truman? mai detto). *Visivo*: la stanza più vuota del gioco. *Sonoro*: il fondo comune si attutisce (porta chiusa: filtro lowpass, già in pipeline). *Performance*: Truman si mette in piedi, ANGOLO opposto: la legge fa da testimone, non da muro. *Dialogo*: nessuno. *Silenzio*: primo — nessuno parla finché il player non preme Z. *Interfaccia*: il gioco attende input: la scena inizia quando il player la inizia. *Cambio*: dal paese alla persona. *Insostituibile perché*: la composizione (vuoto + tre persone + macchina) è la premessa percettiva che nessuna battuta può dare.

**B3 — Il nastro parte.** *Azione*: Z per avviare. *Cooper*: aprire con gentilezza da verbale ("data, presenti"). *BOB*: che tutto sia registrato — vuole il documento (lo si capirà a B8). *Disponibile*: la spia rossa accesa: unico rosso del civico. *Trattenuta*: perché Leland fissa il nastro. *Visivo*: 2×2 px rossi sul tavolo chiaro. *Sonoro*: click + fruscio continuo (nuovo suono-base della stanza). *Performance*: Leland fissa il registratore, poi sorride alla formalità. *Dialogo*: apertura di verbale, 1 pagina. *Cambio*: c'è un secondo ascoltatore nella stanza: la macchina. *Insostituibile*: la spia rossa introduce il codice cromatico (§5) percettivamente, prima che ogni parola lo faccia.

**B4 — Le domande del metodo.** *Azione*: dialogo a scelte di ordine (il player decide QUALE indizio presentare per primo dal menu X — ordine espressivo, esito fisso: honest linearity). *Cooper*: costruire la scala di prove. *Leland*: rispondere da avvocato — preciso, collaborativo, inutile. *Disponibile*: le prove che il player ha (ledger condiviso). *Trattenuta*: la reazione vera — ogni risposta è corretta e vuota. *Visivo*: gli indizi presentati "sul tavolo" (voce di menu → conferma testuale). *Sonoro*: fruscio del nastro sotto le voci. *Performance*: bob fermo di Leland (apnea). *Cambio*: frustrazione operativa — il metodo tocca il fondo della sua utilità. *Insostituibile*: il player deve ESERCITARE il metodo per sentirne il limite; è il payoff del gating (ciò che hai raccolto è ciò che puoi giocare).

**B5 — Il percolatore tace.** *Azione*: nessuna: il beat avviene NEL fondo sonoro tra due pagine. *Info*: il ciclo del caffè è finito, fuori. *Trattenuta*: che nessuno se n'è accorto tranne il player. *Visivo*: nessun cambiamento — il vuoto della stanza regge da solo. *Sonoro*: il fondo perde uno strato; restano radiatore e nastro. *Silenzio*: guadagnato per cause domestiche, speso drammaticamente. *Cambio*: l'attenzione si serra senza alcun intervento di regia. *Insostituibile*: è un'informazione PURAMENTE percettiva: nominarla la distruggerebbe.

**B6 — La foto girata.** *Azione*: Z. *Cooper*: mostrare la foto di Laura dal fascicolo — poi la gira verso il tavolo appena Leland inizia a parlare. *Leland*: guardarla troppo a lungo. *Disponibile*: il gesto (visibile in dialogo: 1 pagina, nessun asset nuovo — descritto dalla voce a Diane in differita? NO: reso come battuta d'azione nel riquadro). *Trattenuta*: il perché del gesto di Cooper — pietà? strategia? il testo non lo dice. *Visivo*: la lampada sul tavolo, le mani. *Performance*: prima incrinatura: il bob di Leland riparte, lento. *Dialogo*: «Mia figlia si arrabbiava quando la fotografavano di sorpresa.» *Cambio*: dal caso alla famiglia. *Insostituibile*: il gesto della foto è un atto di misericordia procedurale — un dialogo espositivo direbbe "Cooper è empatico", il gesto lo FA.

**B7 — L'affioramento.** *Azione*: il player presenta l'ultimo indizio (la bugia su Missoula / il ponte ROBERT→BOB). *Cooper*: chiudere la scala. *BOB*: affiorare — ADESSO, davanti al nastro. *Disponibile*: il bob accelerato da seduto; l'orientamento a sud (guarda la camera). *Trattenuta*: qualunque conferma di sistema (nessun cambio sprite, nessun nome sopra la testa). *Visivo*: le convenzioni chibi infrante — il tenero che si muove male. *Sonoro*: il fruscio del nastro SALE di un valore percettibile (la macchina "ascolta più forte": unico effetto non-realistico concesso, ambiguo per statuto). *Dialogo*: il registro cambia — sintassi corta, presente storico, la voce che parla di Leland in terza persona. *Cambio*: il player capisce PRIMA di Cooper? No: Cooper l'ha sognato, il player l'ha visto — qui i due saperi si agganciano (chiusura del gap dell'Atto 1). *Insostituibile*: l'orrore è nel COME (tempo di animazione, orientamento), canali che il testo non possiede.

**B8 — La confessione al nastro.** *Azione*: nessun input per 2 pagine (il gioco toglie il prompt: leggere senza poter accelerare — infrazione unica del ritmo di dialogo). *BOB*: dettare il verbale — nomi, luoghi, il vagone: vuole che il documento esista e suoni folle. *Cooper*: non interrompere. *Truman*: posa la penna (la legge smette di scrivere: la performance chiave del suo personaggio). *Disponibile*: i fatti del caso, ora confessi. *Trattenuta*: se il nastro "conterà" per la contea (resterà ambiguo). *Sonoro*: voci + nastro; radiatore. *Cambio*: il caso è chiuso E la chiusura non consola. *Insostituibile*: il ritmo forzato (niente skip) è il costo che il player paga fisicamente — l'unica volta che il gioco gli tiene ferme le mani.

**B9 — La cella.** *Azione*: il player segue il corridoio, vede la porta della cella per intero, da fuori (§5). *Cooper*: accompagnare — non c'è più niente da chiedere. *Leland (di nuovo Leland)*: chiede se Laura lo perdonerà. *Disponibile*: la branda rifatta con cura (la pietà di Truman, §5). *Trattenuta*: quanto tempo resta. *Visivo*: la cella squallida e la branda perfetta. *Sonoro*: la serratura — il secondo suono secco del vocabolario del potere. *Silenzio*: la musica NON riparte. *Dialogo*: una pagina, la domanda del perdono, nessuna risposta di Cooper. *Cambio*: da colpevole a seconda vittima — la direzione della colpa è girata. *Insostituibile*: la geometria (porta vista solo da fuori) fa provare al player l'esclusione: da qui in poi Leland è dove non lo si può seguire.

**B10 — Il radiatore.** *Azione*: il player viene richiamato (grido di Truman fuori campo); torna alla cella: Leland morente/morto. *Disponibile*: il ticchettio del radiatore, ora unico suono. *Trattenuta*: la meccanica della morte (il gioco non la mostra: la cella si vede da fuori). *Visivo*: lo sprite a terra oltre le sbarre — l'immagine più ferma del gioco. *Sonoro*: SOLO radiatore ("a cappella", §6): il suono domestico ora significa il tempo che finisce. *Dialogo*: il monologo a Diane (2 pagine): Cooper non registra — parla e basta; flag `leland_morto`, l'obiettivo nel menu X cambia in "Torna dove il caso non si chiude" (formulazione diegetica da definire). *Cambio*: il desiderio del player viene esplicitamente ri-puntato verso la Loggia. *Insostituibile*: la migrazione di significato del radiatore è il compendio sensoriale dell'intera direzione — la casa resta casa, e non basta.

Distribuzione: azione (B1,4,7,9), ambiente (B1,2,5,10), performance (B2,6,7,8), suono (B3,5,7,10), dialogo (B4,6,8,9), silenzio (B2,5,10), interfaccia (B2,4,8,10), testo opzionale (bacheca in B1; riletture "di nuovo" post-scena). Nessuna informazione doppiata: dove due canali coesistono, portano dati diversi (es. B7: il testo dà il registro, l'animazione dà l'orrore).

==================================================
## 9. Trasformazione del luogo nel corso della storia
==================================================

La stessa stazione in quattro momenti. Invariante dichiarato: NESSUN muro cambia mai — la trasformazione è d'uso, luce, suono, popolazione.

**T1 — Atto 1-2 (prima che il conflitto sia compreso).** Stabile: tutto il fisico. Chi la usa: routine piena (vice, centralinista, cittadini per smarrimenti). Attività: bacheca aggiornata, ciambelle, celle vuote. Suono: il fondo completo (percolatore, centralino, radio). Luce: zone comuni ai valori medi-alti. Comportamento: tutti hanno tempo; i dialoghi offrono digressioni. Oggetto ancora muto: il registratore federale, chiuso nel suo angolo — un soprammobile burocratico. Interpretazione del player: "hub delle missioni", luogo di servizio.

**T2 — Dopo la rivelazione dell'Atto 3 (l'arresto di Jacques, la sua morte in ospedale).** Stabile: arredo, luce. Cambia: la popolazione — un cittadino in più in attesa, un vice sempre fuori; le ciambelle restano, ma qualcuno le porta a casa Palmer (detto in una battuta della centralinista). Aggiunto: il fascicolo sul bancone (sempre in vista, mai aperto davanti al player). Scompare: il volantino della fiera dalla bacheca — sotto c'era quello delle persone scomparse, ora in primo piano (nessuno l'ha messo: è stato SCOPERTO togliendo l'altro). Suono: il centralino squilla più spesso; qualche chiamata resta senza risposta. Comportamento: i dialoghi perdono le digressioni — le stesse persone, meno tempo. Oggetto risemantizzato: le celle — dopo Jacques, "cella" non significa più "sabato sera". Player: il luogo di servizio è diventato un luogo che può perdere le persone che custodisce.

**T3 — Atto 5, la scena (massima pressione).** Stabile: TUTTO il fisico — è la tesi della direzione: la pressione massima non ottiene scenografia. Cambia: la geografia d'uso — per la prima volta la porta nord (corridoio celle) è il centro gravitazionale; la zona comune, sempre piena, è semivuota (il paese sa e gira alla larga: assenza come informazione sociale). Aggiunto: il registratore SUL tavolo (l'oggetto muto di T1 ora al centro). Scompare: il ciclo delle ciambelle (nessuno ha portato niente, stamattina — una battuta di Lucy-figura, non un evento). Suono: §8. Luce: la lampada del tavolo come punto più chiaro. Comportamento: Truman formale con l'uomo che conosce da vent'anni — la formalità come lutto anticipato. Oggetto risemantizzato: la tazza col nome (a B1 prestito d'intimità; ora, intatta davanti a Leland, misura di ciò che non si può più condividere). Player: la stanza gentile come contenitore dell'inconfessabile.

**T4 — Dopo la conseguenza (post `leland_morto`, epilogo pre-Loggia).** Stabile: i muri, la bacheca, il caffè — il paese DEVE continuare, è il suo modo di sopravvivere. Cambia: la sedia di Leland nella stanza non è stata rimessa a posto (unico disordine frontale del gioco, §5 — nessuno riesce ancora a toccarla). Aggiunto: sulla bacheca, l'avviso del funerale — carta come le altre carte, in ordine con le puntine: il dolore protocollato con cura. Scompare: il registratore, di nuovo nel suo angolo, spia spenta. Attività che continuano: caffè, centralino; che cessano: nessun dialogo "di nuovo" offre più digressioni leggere nella stazione (riletture accorciate: il luogo ha perso la voglia di chiacchierare). Suono: fondo completo MA senza radio (nessuno l'ha riaccesa). Luce: invariata — il lutto non spegne le lampade. Comportamento: la centralinista saluta Cooper per nome, come sempre, una riga più piano (testo, non font: la battuta è più corta). Oggetto risemantizzato: il gancio "di Harry" — Truman non appende più la giacca, se la tiene addosso (pronto a uscire: il paese non gli sembra più un interno sicuro). Player: la normalità ricostruita è ora leggibile come scelta coraggiosa e insieme come il meccanismo che ha permesso tutto — la contraddizione centrale (§1) percepita, mai enunciata.

Nessuna delle quattro fasi usa: guardie aggiunte, luci spente, oggetti rotti, detriti, cambio palette.

==================================================
## 10. Campione di direzione (≈600 parole)
==================================================

La stazione sa di caffè finito. Cooper attraversa la sala comune contando ciò che manca: le ciambelle, due voci, il volantino della fiera. La bacheca mostra la carta che stava sotto — VI PREGHIAMO DI SEGNALARE — e nessuno l'ha appesa: è rimasta. La centralinista gli porge la tazza col nome di un altro. Lui la prende con entrambe le mani, e la porta con sé lungo il corridoio dove il linoleum è più chiaro al centro, consumato da quarant'anni di andate e ritorni brevi.

Il player preme su, su, su. La porta della stanza si vede per intero prima di entrarci.

Dentro, la stanza più vuota del gioco: un tavolo, tre sedie, la lampada che fa del piano di legno la cosa più chiara di Twin Peaks. Leland siede al centro esatto, frontale, composto come si è composti alle veglie. Truman sta nell'angolo con un blocco. Sul tavolo, troppo grande per il tavolo, la macchina federale.

Nessuno parla. Il gioco aspetta.

Z.

Click. La spia si accende: due pixel di rosso, il primo rosso del paese. Il nastro comincia il suo fruscio e Leland lo guarda partire come si guarda un ospite entrare. «Data, presenti», dice Cooper alla macchina, e intanto sceglie la sedia d'angolo, non quella di fronte.

Il player apre il taccuino. Sceglie da dove cominciare: il diario, la lettera, la sera di Missoula. L'ordine è suo. Le risposte sono di un avvocato: precise, disponibili, inutili. Il bob di Leland sta fermo — un uomo che non respira nemmeno in pixel — e da qualche parte oltre la porta il percolatore finisce il ciclo. Il fondo perde uno strato. Restano il radiatore e il nastro.

Cooper apre il fascicolo e volta la foto verso Leland. La lascia lì un momento; quando Leland comincia a parlare — «Si arrabbiava, quando la fotografavo di sorpresa» — la gira faccia in giù, piano, e il gioco non spiega il gesto.

Poi il player mette sul tavolo l'ultima carta. Missoula.

Il bob riparte. Sbagliato. Va al tempo della corsa, da seduto, e lo sprite si volta — non verso Cooper: verso sud. Verso di noi. La sintassi si accorcia, il presente si fa storico, la voce parla di Leland come di un cappotto. Il fruscio del nastro sale di un grado, che sia la macchina o l'orecchio non è detto.

Le due pagine seguenti non si possono accelerare. Il prompt sparisce. Nomi, il vagone, l'anello: la voce detta il verbale e lo vuole a verbale, perché sulla carta la verità suonerà pazza. Truman posa la penna. È l'unica cosa che si muove nell'angolo.

Quando è di nuovo Leland — e si vede da come il bob si ferma, non da ciò che dice — chiede soltanto se sua figlia lo perdonerà. La branda nella cella è rifatta con gli angoli tesi. La porta si vede per intero, da fuori. La serratura fa il suo secondo suono secco.

La musica non torna.

Il richiamo arriva che il player è a metà del corridoio. Di nuovo su, fino alle sbarre: lo sprite a terra, oltre, dove non si entra. Nella sala qualcuno ha lasciato correre il centralino. Qui c'è solo il radiatore: tic, tic, più lento del passo, più lento del bob, il suono con cui questa casa è sempre stata calda. Adesso conta un altro tempo.

Cooper non accende il suo registratore. «Diane», dice, alla stanza. La tazza col nome di Harry è rimasta sul tavolo dell'altra stanza, piena. In cima al taccuino, l'obiettivo è cambiato: il caso è chiuso. Ciò che è aperto non è un caso.

*(Cambio d'interpretazione portato dal campione: il lettore entra credendo di assistere a una vittoria del metodo e ne esce avendo assistito a un passaggio di custodia — dalla legge, che ha finito, a ciò che la legge non copre.)*

==================================================
## 11. Auto-audit
==================================================

1. **Scelta che deriva realmente dalla storia**: il registratore come co-protagonista — nasce dal duello confessione/verbale che È il contenuto dei nodi esistenti (`leland_interr`, confessione, morte).
2. **Scelta soltanto attraente**: il fruscio del nastro che "sale di un grado" a B7 — è bella, ma è l'unico effetto non fisico della direzione; da tenere in prova, tagliare se in playtest legge come "effetto horror".
3. **Elemento troppo simbolico**: la tazza intatta rischia di fare doppio lavoro (intimità negata + tempo che si raffredda); va tenuta UNA sola menzione in dialogo, nessuna inquadratura dedicata.
4. **Colore che fa il lavoro della composizione**: nessuno per disciplina (§5: tinta alla mappa, dramma al valore) — il punto di vigilanza è la spia rossa: se serve "guardala" in un dialogo, ha fallito la composizione.
5. **Suono che fa il lavoro del comportamento**: il silenzio del percolatore a B5 copre quasi il disagio di Truman; la sedia che scricchiola va mantenuta come segnale COMPORTAMENTALE indipendente, o Truman resta arredo.
6. **Dettaglio che esiste solo per il giocatore**: l'orientamento a sud dello sprite di Leland (guarda la camera) — dichiaratamente extradiegetico, unico concesso, non ripetibile altrove nel gioco.
7. **Dettaglio che prova che il mondo continua**: il centralino che squilla senza risposta durante la scena; le ciambelle che stamattina nessuno ha portato.
8. **Personaggio vestito dal reparto artistico**: rischio su Cooper (abito scuro "da agente"); mitigazione: le scarpe pulite nonostante il fango — un'abitudine, non un costume.
9. **Informazione ripetuta inutilmente**: la colpevolezza di Leland rischia tripla esposizione (menu X + dialogo B4 + confessione B8); disciplina: B4 gioca le prove SENZA mai enunciare la conclusione; solo B8 la dice, e la dice BOB.
10. **Riferimento che rischia l'imitazione**: il bianco dei capelli e il "guardare in camera" flirtano con immagini della serie; difesa: nessuna citazione di inquadratura/battuta — restano dati di storia (canone del fan game) resi nell'idioma chibi.
11. **Elemento che potrebbe stare in qualsiasi gioco del genere**: la stanza dell'interrogatorio con lampada sul tavolo — topos poliziesco puro; lo riscatta solo il contesto (soggiorno civico intorno, caffè, chibi).
12. **Cosa rende la direzione non intercambiabile**: il contrasto strutturale tra idioma chibi (tutto è tenero per costruzione) e contenuto — l'unico motore d'orrore del gioco è che lo stile NON può smettere di essere gentile.
13. **Sensazione prevista che è solo un'ipotesi**: che il bob accelerato da seduto legga come "sbagliato/perturbante" e non come bug di animazione.
14. **Verifica con giocatori reali**: playtest A/B senza spiegazioni: (a) domanda aperta post-scena "hai notato qualcosa di strano in Leland? quando?"; (b) misura del riconoscimento: % di player che descrive il cambio di animazione come intenzionale; (c) per il silenzio B5: chiedere "quando la stanza è diventata più tesa?" e vedere se il momento indicato coincide col percolatore. Soglie da definire prima del test (validazione pre-registrata, non a posteriori).
15. **Scelta da rimuovere per disciplina**: il gruppo elettrogeno/il vento (residuo della direzione C scartata) NON deve rientrare dalla finestra; e il fruscio-che-sale (punto 2) è il primo candidato al taglio.

==================================================
## 12. Output finale
==================================================

**Cinque regole da conservare per l'intero gioco**
1. La tinta appartiene alla mappa, il dramma alla luminanza e alla sua distribuzione — mai filtri, mai desaturazioni narrative.
2. Una sola infrazione per sistema: una geometria fuori griglia per mappa, una infrazione di animazione per personaggio, un rosso per il civico. Le eccezioni significano solo finché restano contate.
3. Il silenzio si guadagna con cause del mondo (un ciclo che finisce, una porta che si chiude) e si spende in drammaturgia — mai silenzi per decreto.
4. Gli oggetti non recitano: fisica sempre, performance mai (l'unico oggetto performativo per scena va scelto e motivato).
5. Il mondo continua fuori campo: ogni scena maggiore deve contenere almeno un processo che procede senza il protagonista (centralino, ciambelle, bacheca).

**Cinque cliché da evitare**
1. Il cozy con la macchia gotica sotto (la stanza in ordine È l'orrore; niente crepe significative).
2. Luci che sfarfallano / elettricità posseduta come segnale del maligno.
3. Desaturazione o pioggia "a comando" per marcare lutto e rivelazioni.
4. La confessione con primo piano e musica in crescendo — qui il climax toglie suoni invece di aggiungerne.
5. Il rosso come allarme pavloviano (il rosso del gioco è scarso, semantico e va sporcato con rumore innocuo).

**Tre domande ancora aperte**
1. Il bob accelerato da seduto regge come "perturbante intenzionale" alla scala chibi 16×20, o serve un secondo tell ridondante (orientamento) SEMPRE accoppiato? (Da playtest, punto 13-14.)
2. La stanza dell'interrogatorio merita una sotto-mappa dedicata (costo: mappa+luci nuove) o la zona nord di `sheriff` basta a sostenere il gradiente di densità?
3. Il monologo a Diane finale va musicato (cross-fade esistente) o il gioco può permettersi di arrivare alla transizione di mappa ancora "a cappella"? — dipende da quanto il radiatore da solo regge su hardware/casse reali.

**Una frase — identità sensoriale complessiva del progetto**
«Un paese disegnato per essere tenero fino all'ultimo pixel, dove la luce, il caffè e le voci continuano a funzionare mentre contengono l'orrore — e il giocatore impara ad avere paura non di ciò che appare, ma di ciò che resta in ordine.»
