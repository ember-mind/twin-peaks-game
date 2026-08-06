/* narrative-finale.js — M9/M10/Loggia/epilogo retro, callback-driven.
 *
 * Nessun cambio mappa o teletrasporto: il chiamante decide quando avviare il
 * flow e come applicare i flag finali. Se viene passato un container DOM, il
 * modulo usa le classi .nw-* gia' condivise dalla UI narrativa; in headless
 * mode espone gli stessi screen tramite onScreen.
 */
(function (root) {
  'use strict';
  if (!root) return;

  var GAME = root.GAME = root.GAME || {};
  var NF = GAME.NarrativeFinale = {};
  var VERSION = 3;
  var LEGACY_VERSION = 2;
  var run = null;
  var ui = null;

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function checkpointFailure(error) {
    var e = new Error(error || 'finale_checkpoint_failed');
    e.finale_checkpoint_failure = true;
    return e;
  }
  function notifyState(state) {
    if (!run.opts.onState) return;
    var result;
    try { result = run.opts.onState(clone(state)); }
    catch (e) { throw checkpointFailure(String(e && e.message || e)); }
    if (result === false || (result && result.ok === false)) {
      throw checkpointFailure(result && result.error || 'finale_checkpoint_failed');
    }
  }
  function transaction(action, initialOpts) {
    var previous = run ? { opts: run.opts, state: clone(run.state), ui_selected: ui ? ui.selected : null } : null;
    var hooks = run && run.opts ? run.opts : (initialOpts || {});
    var token = hooks.onBeforeMutation ? hooks.onBeforeMutation() : null;
    try { return action(); }
    catch (e) {
      if (!e || !e.finale_checkpoint_failure) throw e;
      if (run && run.state.active) finishInput(); else removeUI();
      run = previous ? { opts: previous.opts, state: previous.state } : null;
      if (hooks.onRollback) {
        try { hooks.onRollback(token); }
        catch (rollbackError) {
          return { ok: false, error: 'finale_checkpoint_rollback_failed: ' + String(rollbackError && rollbackError.message || rollbackError) };
        }
      }
      if (run && run.state.active) {
        if (run.opts.inputContext && run.opts.inputContext.suspend) run.opts.inputContext.suspend();
        var restored = currentScreen();
        if (restored) {
          renderDOM(restored);
          if (ui && previous && Number.isInteger(previous.ui_selected)) {
            ui.selected = previous.ui_selected;
            renderDOM(restored);
          }
        }
      }
      return { ok: false, error: String(e.message || e), rolled_back: true };
    }
  }
  function page(id, name, text, meta) {
    var out = { id: id, display_name: name || '', text: text };
    if (meta && meta.portrait) out.portrait = meta.portrait;
    return out;
  }

  /* Il renderer Gold mostra quattro righe da circa 24 caratteri. Spezzare qui
   * conserva tutto il testo anche nella build 160x144: nessuna pagina puo'
   * essere troncata dal canvas pur restando un singolo beat semantico. */
  function wrapChars(text, width) {
    var paragraphs = String(text || '').split(/\n/), out = [], p, words, line, word, i;
    for (p = 0; p < paragraphs.length; p++) {
      words = paragraphs[p].trim().split(/\s+/).filter(Boolean); line = '';
      if (!words.length) { out.push(''); continue; }
      for (i = 0; i < words.length; i++) {
        word = words[i];
        if (!line) line = word;
        else if ((line + ' ' + word).length <= width) line += ' ' + word;
        else { out.push(line); line = word; }
      }
      if (line) out.push(line);
    }
    return out;
  }

  function paginate(raw) {
    var out = [], i, combined, lines, offset, chunk, prefix, copy;
    for (i = 0; i < raw.length; i++) {
      prefix = raw[i].display_name ? raw[i].display_name + ': ' : '';
      combined = prefix + raw[i].text;
      lines = wrapChars(combined, 24);
      for (offset = 0; offset < lines.length; offset += 4) {
        chunk = lines.slice(offset, offset + 4);
        copy = page(raw[i].id + (offset ? '.part' + (offset / 4 + 1) : ''), '', chunk.join('\n'), { portrait: raw[i].portrait });
        out.push(copy);
      }
    }
    return out;
  }

  function valuesFrom(carryover) {
    var source = carryover && carryover.values ? carryover.values : (carryover || {});
    return clone(source);
  }

  function carryValue(name) {
    return run && own(run.state.values, name) ? run.state.values[name] : undefined;
  }

  function setFlag(name) {
    if (!run.state.flags[name]) {
      run.state.flags[name] = true;
      run.state.history.push({ type: 'flag', name: name });
      if (run.opts.onFlag) run.opts.onFlag(name, true);
    }
  }

  function writeOnce(name, value) {
    if (own(run.state.values, name)) {
      return run.state.values[name] === value ? { ok: true, repeated: true } : { ok: false, error: name + '_write_once' };
    }
    run.state.values[name] = value;
    run.state.history.push({ type: 'value', name: name, value: value });
    return { ok: true, repeated: false };
  }

  function thresholdPages() {
    return [
      page('nf.m10.threshold.01', '', 'Prima della porta. Il corridoio nord è vuoto.'),
      page('nf.m10.threshold.02', 'COOPER', 'Diane. Ipotesi da non verbalizzare: chi ha disposto la scena voleva essere letto.')
    ];
  }

  function openingPages() {
    var pages = [
      page('nf.m10.open.03', '', 'La stanza: tavolo, lampada, registratore troppo grande. Leland al centro.'),
      page('nf.m10.open.04', 'COOPER', 'Signor Palmer, vorremmo registrare. È un colloquio: può fermarci quando vuole.'),
      page('nf.m10.open.05', 'LELAND', 'Registrate. Le parole scritte male sono l\'unica cosa che temo.'),
      page('nf.m10.open.06', 'COOPER', 'Verbale di colloquio. Oggetto: partenza di Madeleine Ferguson.'),
      page('nf.m10.open.07', 'COOPER', 'Circostanze connesse: taxi dichiarato, destinazione e orari.')
    ];
    if (carryValue('promise_stance')) {
      pages.push(page('nf.m10.open.promise', '', 'Il taccuino di Cooper resta chiuso su una pagina con tre orari.'));
    }
    return pages;
  }

  function methodPages(method) {
    if (method === 'personale') {
      var readMaddyNote = carryValue('maddy_action_after_warning') === 'departure_prepared' &&
        carryValue('focus_destination') === 'palmer';
      return [
        page('nf.m10.personal.01', 'COOPER', 'Quando ha smesso di dormire, Leland?'),
        page('nf.m10.personal.02', 'LELAND', 'Da febbraio. Sarah dice che parlo di notte. Non ricordo mai con chi.'),
        page('nf.m10.personal.03', 'COOPER', readMaddyNote ? 'Ha visto il biglietto? «Torno lunedì. Non svegliarla.»' : (carryValue('maddy_action_after_warning') === 'departure_prepared' ? 'Truman ha trovato un biglietto per Sarah. Lei lo aveva visto?' : 'Maddy parlava della corriera delle 7:40. Lei conosceva il suo piano?')),
        page('nf.m10.personal.04', 'LELAND', carryValue('maddy_action_after_warning') === 'departure_prepared' ? 'L\'ho visto.' : 'Conoscevo l\'orario.'),
        page('nf.m10.personal.04b', 'LELAND', 'Ho pensato: anche lei. Da quella casa vogliono andarsene tutte.'),
        page('nf.m10.personal.05', 'TRUMAN', 'Cooper. Piano. C\'è un limite anche qui dentro.'),
        page('nf.m10.personal.06', 'COOPER', 'Laura nascondeva le cose dove pensava che lei non guardasse.'),
        page('nf.m10.personal.06b', 'COOPER', 'Il biglietto era sul sedile divelto.'),
        page('nf.m10.personal.07', 'LELAND', 'No. Nella terra.'),
        page('nf.m10.personal.08', 'COOPER', 'Questo non gliel\'ho detto.')
      ];
    }
    if (method === 'intuitivo') {
      return [
        page('nf.m10.intuitive.01', 'COOPER', 'Le dice niente: FUOCO CAMMINA CON ME?'),
        page('nf.m10.intuitive.02', 'LELAND', '...il mago desidera vedere. Uno canta fra due mondi.'),
        page('nf.m10.intuitive.03', 'COOPER', 'Sono parole che non le ho dato. Continui.'),
        page('nf.m10.intuitive.04', 'COOPER', 'Ho visto un uomo. Capelli lunghi, grigi. Sorrideva. Le è familiare?'),
        page('nf.m10.intuitive.05', 'LELAND', 'E lei dov\'era, agente? Da che parte del sonno?'),
        page('nf.m10.intuitive.05b', 'LELAND', 'Il vagone canta ancora. Il biglietto dorme nella terra.'),
        page('nf.m10.intuitive.05c', 'COOPER', 'Il biglietto era nella terra. Dettaglio mai reso pubblico.'),
        page('nf.m10.intuitive.06', 'TRUMAN', 'Ho bisogno che quello che sento abbia un ordine. Torno quando ce l\'ha.'),
        page('nf.m10.intuitive.07', '', 'Truman esce. Il fruscio del nastro è l\'unico terzo.')
      ];
    }
    return [
      page('nf.m10.probatory.01', 'COOPER', 'Il taxi. Ci dia il nome dell\'autista e l\'ora della corsa.'),
      page('nf.m10.probatory.02', 'LELAND', 'Eddie, credo. Le sette, le sette e un quarto. Il dolore archivia male.'),
      page('nf.m10.probatory.03', 'COOPER', 'La compagnia non ha prenotazioni per casa Palmer. Né oggi né per domattina.'),
      page('nf.m10.probatory.03b', 'LELAND', 'Allora ho sbagliato compagnia. O sbaglia il registro. Quale mette a verbale?'),
      page('nf.m10.probatory.04', 'COOPER', 'Mi mostri il viaggio: un biglietto o una telefonata che provi la partenza di Maddy.'),
      page('nf.m10.probatory.05', 'LELAND', 'Le telefonate le faccio dal mio studio. Casa mia non si tocca.'),
      page('nf.m10.probatory.06', 'TRUMAN', carryValue('jacques_midnight_claim') ? 'La finestra è stretta, Leland. Il merci di mezzanotte l\'ha stretta.' : 'La precisione finisce sempre sulla soglia di casa tua.')
    ];
  }

  function surfacePages() {
    var pages = [
      page('nf.m10.surface.01', '', 'Il volto cambia. Il corpo resta Leland.', { portrait: 'bob' }),
      page('nf.m10.surface.02', 'VOCE', 'Leland dice che dorme. Leland dice molte cose.', { portrait: 'bob' })
    ];
    if (carryValue('jacques_list_given')) pages.push(page('nf.m10.surface.list', 'COOPER', 'Accendeva e spegneva. Senza fumare.'));
    if (carryValue('jacques_third_man_detail')) pages.push(page('nf.m10.surface.stove', 'COOPER', 'Ricorrenza a verbale: la stufa, guardata come si guarda una persona.'));
    pages.push(page('nf.m10.surface.03', '', 'Osservazione: il volto del sogno appare mentre parla Leland. Non so nominare il rapporto.'));
    return pages;
  }

  function admissionPages(method) {
    if (method === 'personale') {
      return [
        page('nf.m10.admit.personal.00', 'LELAND', 'Volevano andarsene tutte. Laura. Maddy. Tutte.'),
        page('nf.m10.admit.personal.01', 'COOPER', 'Non tutte. Laura. Cominci da Laura.'),
        page('nf.m10.admit.personal.02', 'LELAND', 'Laura aveva paura di me. Da febbraio. Aveva ragione.'),
        page('nf.m10.admit.personal.02b', 'COOPER', 'Dica che cosa ha fatto a Laura. Per lei — non per noi.'),
        page('nf.m10.admit.personal.02c', 'LELAND', 'L\'ho uccisa io. Al vagone.'),
        page('nf.m10.admit.personal.03', 'COOPER', 'Maddy.'),
        page('nf.m10.admit.personal.04', 'LELAND', 'Voleva solo il suo centralino. Conoscevo il suo orario e io...'),
        page('nf.m10.admit.personal.04b', 'LELAND', 'L\'ho uccisa io. Poi l\'ho portata al lago.'),
        page('nf.m10.admit.personal.05', 'COOPER', 'Il taxi.'),
        page('nf.m10.admit.personal.06', 'LELAND', 'Mai chiamato. Ho mentito.'),
        page('nf.m10.admit.personal.06b', 'LELAND', 'Volevo che fosse partita. Che fosse vero.'),
        page('nf.m10.admit.personal.07', 'COOPER', 'Le lettere.'),
        page('nf.m10.admit.personal.08', 'LELAND', 'R sotto Laura. O sotto Maddy. Le ho lasciate io.')
      ];
    }
    if (method === 'intuitivo') {
      return [
        page('nf.m10.admit.intuitive.00', 'VOCE', 'Il vagone canta ancora. Chiedete alla terra che cosa le abbiamo dato.', { portrait: 'bob' }),
        page('nf.m10.admit.intuitive.01', 'COOPER', 'Con parole sue. Dov\'era la notte del vagone?'),
        page('nf.m10.admit.intuitive.02', 'LELAND', 'Al vagone. C\'ero io.'),
        page('nf.m10.admit.intuitive.02a', 'VOCE', 'La piccola voleva volare a ovest. L\'acqua l\'ha tenuta.', { portrait: 'bob' }),
        page('nf.m10.admit.intuitive.03', 'COOPER', 'Chi ha ucciso Maddy Ferguson?'),
        page('nf.m10.admit.intuitive.04', 'LELAND', 'Io. Poi l\'ho portata al lago.'),
        page('nf.m10.admit.intuitive.04b', '', 'Cooper apre la porta. Truman rientra e resta in piedi.'),
        page('nf.m10.admit.intuitive.05', 'TRUMAN', 'Il taxi, Leland. A verbale.'),
        page('nf.m10.admit.intuitive.06', 'LELAND', 'Mai chiamato. La bugia è mia.'),
        page('nf.m10.admit.intuitive.07', 'COOPER', 'Le lettere. Parole sue.'),
        page('nf.m10.admit.intuitive.08', 'LELAND', 'R sotto Laura. O sotto Maddy. Le ho lasciate io.'),
        page('nf.m10.admit.intuitive.09', 'COOPER', 'E Laura?'),
        page('nf.m10.admit.intuitive.10', 'LELAND', 'L\'ho uccisa io.')
      ];
    }
    return [
      page('nf.m10.admit.probatory.01', 'COOPER', 'Il biglietto era sul sedile divelto.'),
      page('nf.m10.admit.probatory.02', 'LELAND', 'Nella terra. Era nella terra.'),
      page('nf.m10.admit.probatory.03', 'COOPER', 'Dettaglio mai uscito dalla centrale. Come lo sa?'),
      page('nf.m10.admit.probatory.04', 'LELAND', 'Perché ce l\'ho messa io. Al vagone c\'ero io.'),
      page('nf.m10.admit.probatory.05', 'COOPER', 'Il taxi.'),
      page('nf.m10.admit.probatory.06', 'LELAND', 'Mai chiamato. Ho mentito io.'),
      page('nf.m10.admit.probatory.07', 'COOPER', 'Chi ha ucciso Maddy Ferguson?'),
      page('nf.m10.admit.probatory.08', 'LELAND', 'L\'ho uccisa io. Dopo, l\'ho portata al lago.'),
      page('nf.m10.admit.probatory.09', 'COOPER', 'Laura Palmer?'),
      page('nf.m10.admit.probatory.10', 'LELAND', 'L\'ho uccisa io. Al vagone.'),
      page('nf.m10.admit.probatory.11', 'COOPER', 'Le lettere.'),
      page('nf.m10.admit.probatory.12', 'LELAND', 'R. O. Le ho lasciate io. Un pezzo alla volta.')
    ];
  }

  function postS3Pages() {
    return [
      page('nf.m10.posts3.01', 'LELAND', 'Avevo dodici anni. Nella casa bianca dei nonni, un uomo chiedeva di giocare.'),
      page('nf.m10.posts3.02', 'LELAND', 'Diceva: ho un nome da persona perbene, piccolo. Come il tuo.'),
      page('nf.m10.posts3.03', 'VOCE', 'I pezzi del nome sono nostri. Li abbiamo lasciati perché qualcuno contasse.'),
      page('nf.m10.posts3.04', 'LELAND', 'Quando dormo, lui non dorme. Il resto non so più di chi sia.'),
      page('nf.m10.posts3.05', 'LELAND', 'Agente. Mia figlia... Laura. Potrà mai—'),
      page('nf.m10.posts3.06', '', 'Cooper non risponde. Tiene la foto di Laura davanti a sé, mai a faccia in giù.')
    ];
  }

  function s3FeedbackPages() {
    if (carryValue('s3') === 'off') {
      return [
        page('nf.m10.s3.off.01', 'TRUMAN', 'Click. Il nastro si ferma.'),
        page('nf.m10.s3.off.02', 'TRUMAN', 'Da qui in poi porto io il resto. Se servirà, lo giuro a voce.')
      ];
    }
    return [page('nf.m10.s3.on', '', 'La spia resta accesa. I fatti sono sul nastro; cambia solo chi porta il resto.')];
  }

  function victimsPages() {
    return [
      page('nf.m10.victims.01', 'COOPER', 'Maddy aveva scelto la corriera delle 7:40.'),
      page('nf.m10.victims.01b', 'COOPER', 'Laura aveva affidato a un diario ciò che temeva.'),
      page('nf.m10.victims.02', 'COOPER', 'Le loro azioni restano nel fascicolo. Il perdono non è materia nostra.'),
      page('nf.m10.victims.03', 'TRUMAN', 'Da questo momento sei in stato di fermo, Leland. Per i fatti che hai ammesso.'),
      page('nf.m10.victims.04', '', 'Truman apre la cella. La porta si vede per intero; la serratura fa il suo suono.')
    ];
  }

  function deathPages() {
    return [
      page('nf.m10.death.01', '', 'Il grido arriva dal corridoio. Truman apre la cella in un secondo.'),
      page('nf.m10.death.02', '', 'Due dita sul collo. Conta. Poi smette di contare.'),
      page('nf.m10.death.03', 'TRUMAN', 'Lucy: il dottore. E Andy alla porta.'),
      page('nf.m10.death.04', '', 'Dottore, firme, barella. Poi restano la stanza e il radiatore.'),
      page('nf.m10.death.05', 'COOPER', 'So cosa ha fatto. Non so dove finisse la sua volontà.'),
      page('nf.m10.death.05b', 'COOPER', 'Una cosa non cancella l\'altra.'),
      page('nf.m10.death.06', 'TRUMAN', 'La contea lo chiamerà chiuso.'),
      page('nf.m10.death.07', 'COOPER', 'Non lo è. C\'è un posto che non è in nessun fascicolo.')
    ];
  }

  function nanoPages(position) {
    var method = carryValue('m10_method'), pages = [
      page('nf.lodge.nano.open.01', '', 'Il Nano balla piano, poi si ferma. Parla al contrario; si capisce lo stesso.'),
      page('nf.lodge.nano.open.02', '???', 'È LUI che stai cercando?')
    ];
    if (method === 'personale') {
      pages.push(page('nf.lodge.method.personal.01', '???', 'Hai chiamato Laura, Maddy e Leland per nome.'));
      pages.push(page('nf.lodge.method.personal.02', '???', 'I nomi pesano. Qui ne manca uno che nessuno pronuncia.'));
      pages.push(page('nf.lodge.method.personal.03', '???', 'Hai pagato coi nomi. Si paga sempre coi nomi, da voi.'));
    } else if (method === 'intuitivo') {
      pages.push(page('nf.lodge.method.intuitive.01', '', 'Cooper apre la bocca. Il Nano risponde prima della domanda.'));
      pages.push(page('nf.lodge.method.intuitive.02', '???', 'Tu ascolti già così.'));
      pages.push(page('nf.lodge.method.intuitive.03', '???', 'Quando mi vedrai di nuovo, non sarò io.'));
      pages.push(page('nf.lodge.method.intuitive.04', '???', 'Non chiedere come è entrato. Chiedi da quanto ascoltava.'));
    } else {
      pages.push(page('nf.lodge.method.probatory.01', '???', 'Hai contato bene. Le date. Le corse mai fatte. Le lettere: due.'));
      pages.push(page('nf.lodge.method.probatory.02', '???', 'L\'elenco è giusto. Che cosa conta, quando conta fino in fondo?'));
      pages.push(page('nf.lodge.method.probatory.03', '???', 'C\'è una riga che il tuo foglio non ha. Non te la dico: non è mia.'));
    }
    pages.push(position === 'first'
      ? page('nf.lodge.nano.position.first', '???', 'Vai pure di là. Adesso hai un modo per guardarlo.')
      : page('nf.lodge.nano.position.after', '???', 'L\'hai già visto. E sei ancora della tua misura. Bene.'));
    if (carryValue('s1') === 'documented_custody') {
      pages.push(page('nf.lodge.ring.documented', '', 'L\'anello è nella tasca di Cooper. Il modulo firmato dice come ci è arrivato.'));
    } else {
      pages.push(page('nf.lodge.ring.institutional.01', '', 'Il Nano apre la mano. Vuota.'));
      pages.push(page('nf.lodge.ring.institutional.02', '???', 'L\'hai lasciato dove tutti potevano trovarlo. E nessuno sapeva che cosa cercare.'));
    }
    return pages;
  }

  function bobPages(position) {
    var pages = [];
    if (position === 'first') pages.push(page('nf.lodge.bob.position.first', '', 'Cooper non ha ancora il linguaggio del Nano. La provocazione arriva nuda.'));
    else pages.push(page('nf.lodge.bob.position.after', '', 'Il Nano gli ha dato una misura. Cooper non esita.'));
    pages.push(page('nf.lodge.bob.01', '', 'Il buio smette di essere buio. Il sorriso arriva prima del resto.'));
    pages.push(page('nf.lodge.bob.record.01', '', 'Sul tavolino compare il verbale.'));
    pages.push(page('nf.lodge.bob.record.02', '', 'Due righe restano cerchiate: «L\'ho uccisa io.»'));
    pages.push(page('nf.lodge.bob.record.03', '', '«Ho mentito io.»'));
    pages.push(page('nf.lodge.bob.02', 'BOB', 'Leland era solo un guanto. La mano... è ancora qui.'));
    if (carryValue('s3') === 'on') {
      pages.push(page('nf.lodge.s3.on.01', 'BOB', '«Quando dormo, lui non dorme.» L\'avete inciso.'));
      pages.push(page('nf.lodge.s3.on.02', 'BOB', 'Io non dimentico ciò che viene inciso.'));
    } else {
      pages.push(page('nf.lodge.s3.off.01', 'BOB', 'La macchina si è fermata. Ora la stanza pesa su di te e sullo sceriffo.'));
      pages.push(page('nf.lodge.s3.off.02', 'BOB', 'Quanto regge una verità senza nastro?'));
    }
    return pages;
  }

  function bobReactionPages() {
    var stance = carryValue('bob_response_stance'), pages = [];
    if (stance === 'A') {
      pages.push(page('nf.lodge.bob.response.a.01', 'COOPER', 'Per Laura, Leland ha detto: «L\'ho uccisa io».'));
      pages.push(page('nf.lodge.bob.response.a.02', 'COOPER', 'Per Maddy, Leland ha detto: «L\'ho uccisa io».'));
      pages.push(page('nf.lodge.bob.response.a.03', 'COOPER', 'La sua voce è sul nastro.'));
      pages.push(page('nf.lodge.bob.response.a.04', 'BOB', 'Un guanto che parla. Tienitelo, il tuo verbale.'));
    } else if (stance === 'B') {
      pages.push(page('nf.lodge.bob.response.b.01', '', 'Cooper apre il taccuino sulle ammissioni. Non parla.'));
      pages.push(page('nf.lodge.bob.response.b.02', '', 'BOB guarda i fogli. Guardarli gli costa.'));
      pages.push(page('nf.lodge.bob.response.b.03', 'BOB', 'I fogli non mi piacciono.'));
    } else {
      pages.push(page('nf.lodge.bob.response.c.01', 'COOPER', '«Il resto non so più di chi sia.» Parole sue.'));
      pages.push(page('nf.lodge.bob.response.c.02', 'COOPER', 'Ma Laura e Maddy le ha nominate lui.'));
      pages.push(page('nf.lodge.bob.response.c.03', 'BOB', '...di chi sia. Divertente.'));
    }
    pages.push(page('nf.lodge.bob.goodbye', 'BOB', 'Ci rivedremo, agente. Noi ci rivediamo SEMPRE.'));
    return pages;
  }

  function ringFeedbackPages() {
    if (carryValue('ring_final_gesture') === 'left') {
      return [
        page('nf.lodge.ring.feedback.left.01', '', 'Cooper posa la busta sul tavolino. L\'anello scivola fuori e resta lì.'),
        page('nf.lodge.ring.feedback.left.02', '???', 'Adesso sai dove lo hai lasciato. Non dire che è perduto.')
      ];
    }
    return [
      page('nf.lodge.ring.feedback.kept.01', '', 'Cooper mostra l\'anello, lo risigilla e ripone la busta nella tasca interna.'),
      page('nf.lodge.ring.feedback.kept.02', '???', 'Lo riporti indietro. Ma non torna uguale.')
    ];
  }

  function lauraPages() {
    return [
      page('nf.lodge.laura.01', '', 'Laura è dove era nel sogno. Ma stavolta nessuno dorme.'),
      page('nf.lodge.laura.02', 'OMBRA DI LAURA', 'Sono calma, adesso. Il fuoco non brucia più, qui dentro.'),
      page('nf.lodge.laura.record.01', '', 'Fra loro, il verbale resta aperto sulle ammissioni di Leland.'),
      page('nf.lodge.laura.record.02', '', 'La Loggia non cancella una riga.'),
      page('nf.lodge.laura.03', 'OMBRA DI LAURA', 'Mio padre non lo sapeva. LUI sì.'),
      page('nf.lodge.laura.03b', 'OMBRA DI LAURA', 'Non sapere non cancella ciò che ha scelto.'),
      page('nf.lodge.laura.03c', 'OMBRA DI LAURA', 'Quanto fosse suo, non posso dirlo.'),
      page('nf.lodge.laura.order', '', carryValue('encounter_order') === 'nano_first' ? 'Laura guarda il taccuino chiuso, poi Cooper.' : 'Laura guarda Cooper. Il taccuino rimane chiuso.'),
      page('nf.lodge.laura.04', 'OMBRA DI LAURA', 'Ti rivedrò fra venticinque anni. Nel frattempo...'),
      page('nf.lodge.laura.05', '', 'Laura sorride. Le tende si muovono senza vento. L\'ultima immagine della Loggia è sua.')
    ];
  }

  function blockedLodgePages() {
    var actor = run.state.blocked_actor, back = run.state.blocked_return_stage;
    if (actor === 'laura' && (back === 'await_lodge' || back === 'await_lodge_second')) {
      return [page('nf.lodge.blocked.laura_early', '', 'Laura guarda oltre Cooper. Due presenze aspettano ancora fra le tende.')];
    }
    if ((actor === 'mfap' || actor === 'bob') && back === 'await_lodge_second') {
      return [page('nf.lodge.blocked.repeat', '', 'Questa presenza ha già parlato. L\'altra aspetta nella stanza.')];
    }
    if ((actor === 'mfap' || actor === 'bob') && back === 'await_laura') {
      return [page('nf.lodge.blocked.after_two', '', 'Le due presenze tacciono. Ora resta Laura.')];
    }
    return [page('nf.lodge.blocked.exit', '', 'Le sedie sono vuote. Resta l\'uscita fra le tende.')];
  }

  function woodsPages() {
    var stance = carryValue('bob_response_stance'), echo = stance === 'A'
      ? 'Cooper attraversa senza voltarsi.'
      : stance === 'B' ? 'Cooper si ferma un istante fra i tronchi.' : 'Cooper tocca il registratore, senza accenderlo.';
    return [
      page('nf.woods.01', '', 'Il bosco. I dodici sicomori alle spalle. L\'alba non è ancora un colore.'),
      page('nf.woods.bob_echo.' + String(stance || 'A').toLowerCase(), '', echo),
      page('nf.woods.omen', '', 'Taccuino: «Senza sostanze chimiche, lui torna.»')
    ];
  }

  function stationPages() {
    var pages = [page('nf.epilogue.station.01', '', 'Twin Peaks prima del caffè. La segheria fuma dritta.')];
    if (carryValue('s3') === 'on') pages.push(page('nf.epilogue.s3.on', 'TRUMAN', 'Il nastro è sigillato. La contea discute come chiamarlo. È agli atti.'));
    else pages.push(page('nf.epilogue.s3.off', 'TRUMAN', 'Ho firmato la mia testimonianza sul resto. La pagina più pesante è a mio nome.'));
    if (carryValue('s1') === 'documented_custody' && carryValue('ring_final_gesture') === 'kept') {
      pages.push(page('nf.epilogue.ring.kept', '', 'Cooper posa anello e modulo sul bancone. Truman controfirma. Nessuno commenta.'));
    } else if (carryValue('s1') === 'documented_custody' && carryValue('ring_final_gesture') === 'left') {
      pages.push(page('nf.epilogue.ring.left.01', 'TRUMAN', 'C\'è la firma. Non c\'è l\'oggetto.'));
      pages.push(page('nf.epilogue.ring.left.02', 'COOPER', 'Lo so. È mio, questo peso.'));
    }
    pages.push(page('nf.epilogue.station.02', 'LUCY', 'No, signora. Il cane era sotto il portico. Come sempre.'));
    pages.push(page('nf.epilogue.station.03', '', 'Fuori, il volantino delle scomparse non c\'è più. Restano i buchi delle puntine.'));
    pages.push(page('nf.epilogue.station.04', '', 'Alla fermata, il tabellone indica Missoula. La 7:40 parte in orario.'));
    return pages;
  }

  function sarahEpiloguePages() {
    if (carryValue('sarah_support_state') === 'vice') return [page('nf.epilogue.sarah.vice', '', 'Andy esce da casa Palmer con due tazze vuote. Qualcuno dorme; qualcuno veglia.')];
    return [page('nf.epilogue.sarah.truman', '', 'L\'auto di Truman è ancora davanti a casa Palmer. La luce del portico è accesa.')];
  }

  function ronetteEpiloguePages() {
    return [page('nf.epilogue.ronette', 'INFERMIERA', 'Stamattina ha chiesto dell\'acqua. Con le parole.')];
  }

  function exitPages() {
    var reading = carryValue('s4_interpretation'), last;
    if (reading === 'istruzione') last = 'Non è una prova. Come istruzione: forse qualcosa lo tiene lontano.';
    else if (reading === 'diagnosi') last = 'Non è una prova. La leggo come diagnosi tardiva: forse parlava di Leland.';
    else last = 'Non è una prova. La porto fuori come avvertimento: potrebbe tornare.';
    return [
      page('nf.epilogue.exit.01', '', 'La strada verso sud. Il cartello: BENVENUTI A TWIN PEAKS.'),
      page('nf.epilogue.exit.02', 'COOPER', 'Diane. Il caso Palmer è chiuso. Ma Twin Peaks non chiude mai.'),
      page('nf.epilogue.exit.s4.' + reading, 'COOPER', last),
      page('nf.epilogue.exit.03', '', 'Cooper esce dall\'inquadratura. La camera resta sul paese nell\'alba.')
    ];
  }

  function s3ThresholdPages() {
    return [
      page('nf.m10.s3.threshold.01', 'LELAND', 'Prima che continui: il nastro resta acceso?'),
      page('nf.m10.s3.threshold.02', 'TRUMAN', 'Gli omicidi, il vagone, il taxi e le lettere sono già registrati.'),
      page('nf.m10.s3.threshold.03', 'TRUMAN', 'Da qui in poi scegliamo soltanto chi porta il resto.')
    ];
  }

  function rawPagesFor(stage) {
    if (stage === 'm10_threshold') return thresholdPages();
    if (stage === 'm10_open') return openingPages();
    if (stage === 'm10_questions') return methodPages(carryValue('m10_method'));
    if (stage === 'm10_surface') return surfacePages();
    if (stage === 'm10_admissions') return admissionPages(carryValue('m10_method'));
    if (stage === 's3_threshold') return s3ThresholdPages();
    if (stage === 's3_feedback') return s3FeedbackPages();
    if (stage === 'post_s3') return postS3Pages();
    if (stage === 'victims') return victimsPages();
    if (stage === 'death') return deathPages();
    if (stage === 'lodge_nano') return nanoPages(run.state.encounters.length ? 'after' : 'first');
    if (stage === 'ring_feedback') return ringFeedbackPages();
    if (stage === 'lodge_bob') return bobPages(run.state.encounters.length ? 'after' : 'first');
    if (stage === 'bob_reaction') return bobReactionPages();
    if (stage === 'lodge_laura') return lauraPages();
    if (stage === 'lodge_blocked') return blockedLodgePages();
    if (stage === 'woods') return woodsPages();
    if (stage === 'epilogue_station') return stationPages();
    if (stage === 'epilogue_sarah') return sarahEpiloguePages();
    if (stage === 'epilogue_ronette') return ronetteEpiloguePages();
    if (stage === 'epilogue_exit') return exitPages();
    return [];
  }

  function pagesFor(stage) { return paginate(rawPagesFor(stage)); }

  function currentScreen() {
    var stage = run.state.stage;
    if (stage === 'method_choice') {
      return { kind: 'choice', id: 'm10_method', prompt: 'Da che parte lo prendiamo, Cooper?', choices: [
        { id: 'probatorio', label: 'Dalle carte.' },
        { id: 'personale', label: 'Dalla famiglia.' },
        { id: 'intuitivo', label: 'Da ciò che ho visto.' }
      ] };
    }
    if (stage === 's3_choice') {
      return { kind: 'choice', id: 's3', prompt: 'I fatti sono registrati. Il nastro continua?', choices: [
        { id: 'on', label: 'Lascia girare.' },
        { id: 'off', label: 'Ferma il registratore.' }
      ] };
    }
    if (stage === 'ring_choice') {
      return { kind: 'choice', id: 'ring_final_gesture', prompt: 'L\'anello è nella tua mano.', choices: [
        { id: 'kept', label: 'Riportalo agli atti.' },
        { id: 'left', label: 'Lascialo alla Loggia.' }
      ] };
    }
    if (stage === 'bob_choice') {
      return { kind: 'choice', id: 'bob_response_stance', prompt: 'BOB aspetta una risposta.', choices: [
        { id: 'A', label: 'Ribadisci le ammissioni.' },
        { id: 'B', label: 'Mostra il verbale.' },
        { id: 'C', label: 'Ripeti Leland.' }
      ] };
    }
    if (stage === 's4_choice') {
      return { kind: 'choice', id: 's4_interpretation', prompt: 'Come annoti la frase?', choices: [
        { id: 'avvertimento', label: 'Avvertimento.' },
        { id: 'istruzione', label: 'Istruzione.' },
        { id: 'diagnosi', label: 'Diagnosi.' }
      ] };
    }
    var pages = pagesFor(stage);
    return pages.length ? { kind: 'page', stage: stage, page: pages[run.state.page_index] } : null;
  }

  function recordAdmissions() {
    var names = ['taxi_lie', 'traincar_presence', 'laura_homicide', 'maddy_homicide', 'maddy_body_transport', 'letters'];
    var i;
    for (i = 0; i < names.length; i++) {
      run.state.material_admissions[names[i]] = { recorded: true, speaker_register: 'leland_first_person' };
    }
    run.state.p6_status = 'confirmed_as_lie';
    run.state.history.push({ type: 'admissions_recorded', names: names.slice() });
    if (run.opts.onAdmissions) run.opts.onAdmissions({
      names: names.slice(),
      p6_status: run.state.p6_status,
      p8_status: 'corroborated'
    });
  }

  function allAdmissionsRecorded() {
    var names = ['taxi_lie', 'traincar_presence', 'laura_homicide', 'maddy_homicide', 'maddy_body_transport', 'letters'];
    var i, fact;
    for (i = 0; i < names.length; i++) {
      fact = run.state.material_admissions[names[i]];
      if (!fact || fact.recorded !== true) return false;
    }
    return true;
  }

  function markScreen(screen) {
    var key = screen.kind === 'page' ? screen.page.id : 'choice:' + screen.id;
    run.state.page_id = key;
    if (run.state.last_screen !== key) {
      run.state.last_screen = key;
      run.state.history.push({ type: 'screen', id: key, stage: run.state.stage });
    }
  }

  function removeUI() {
    if (!ui) return;
    if (root.removeEventListener && ui.keyHandler) root.removeEventListener('keydown', ui.keyHandler, true);
    if (ui.el && ui.el.parentNode) ui.el.parentNode.removeChild(ui.el);
    ui = null;
  }

  function finishInput() {
    removeUI();
    if (run && run.opts.inputContext && run.opts.inputContext.restore) run.opts.inputContext.restore();
  }

  function renderDOM(screen) {
    var doc = root.document;
    var container = run.opts.container;
    if (!doc || !container) return;
    if (!ui) {
      ui = { el: doc.createElement('div'), selected: 0, keyHandler: null };
      ui.el.className = 'nw-root';
      ui.el.setAttribute('role', 'dialog');
      container.appendChild(ui.el);
      ui.keyHandler = function (event) {
        if (!run || !run.state.active || event.repeat) return;
        if (GAME.NarrativeAdapter && GAME.NarrativeAdapter.active && GAME.NarrativeAdapter.active()) return;
        var s = currentScreen();
        if (!s) return;
        if (event.code === 'Enter' || event.code === 'KeyE') {
          event.preventDefault(); event.stopPropagation();
          if (s.kind === 'choice') NF.choose(s.choices[ui.selected].id); else NF.advance();
        } else if (s.kind === 'choice' && (event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'ArrowDown' || event.code === 'KeyS')) {
          event.preventDefault(); event.stopPropagation();
          ui.selected = (ui.selected + (event.code === 'ArrowUp' || event.code === 'KeyW' ? s.choices.length - 1 : 1)) % s.choices.length;
          renderDOM(s);
        }
      };
      root.addEventListener('keydown', ui.keyHandler, true);
    }
    while (ui.el.firstChild) ui.el.removeChild(ui.el.firstChild);
    if (screen.kind === 'page') {
      var box = doc.createElement('div');
      box.className = 'nw-page';
      box.setAttribute('data-page-id', screen.page.id);
      if (screen.page.portrait) box.setAttribute('data-portrait', screen.page.portrait);
      if (screen.page.display_name) {
        var name = doc.createElement('span');
        name.className = 'nw-name';
        name.textContent = screen.page.display_name + ': ';
        box.appendChild(name);
      }
      box.appendChild(doc.createTextNode(screen.page.text));
      ui.el.appendChild(box);
      var hint = doc.createElement('div'); hint.className = 'nw-hint'; hint.textContent = '▼'; ui.el.appendChild(hint);
      ui.el.onclick = function () { NF.advance(); };
    } else {
      ui.selected = Math.min(ui.selected, screen.choices.length - 1);
      var title = doc.createElement('div'); title.className = 'nw-title'; title.textContent = screen.prompt; ui.el.appendChild(title);
      var i;
      for (i = 0; i < screen.choices.length; i++) {
        (function (choice, index) {
          var option = doc.createElement('div');
          option.className = 'nw-opt' + (index === ui.selected ? ' nw-focus' : '');
          option.textContent = (index === ui.selected ? '▶ ' : '  ') + choice.label;
          option.setAttribute('data-choice-id', choice.id);
          option.onclick = function () { ui.selected = index; NF.choose(choice.id); };
          ui.el.appendChild(option);
        })(screen.choices[i], i);
      }
      ui.el.onclick = null;
    }
  }

  function emit() {
    if (!run || !run.state.active) return null;
    var screen = currentScreen();
    if (!screen) {
      run.state.active = false;
      run.state.history.push({ type: 'fatal', error: 'missing_screen', stage: run.state.stage });
      finishInput();
      notifyState(run.state);
      return null;
    }
    markScreen(screen);
    renderDOM(screen);
    if (run.opts.onScreen) run.opts.onScreen(clone(screen), clone(run.state));
    notifyState(run.state);
    return clone(screen);
  }

  function complete() {
    setFlag('end');
    run.state.active = false;
    run.state.stage = 'complete';
    run.state.page_index = 0;
    run.state.page_id = null;
    run.state.consequences = {
      confession_register: carryValue('m10_method'),
      post_s3_record: carryValue('s3') === 'on' ? 'recorded' : 'truman_voluntary_witness',
      encounter_order: carryValue('encounter_order'),
      ring_final_gesture: carryValue('ring_final_gesture'),
      final_ring_location: carryValue('final_ring_location'),
      bob_response_stance: carryValue('bob_response_stance'),
      s4_interpretation: carryValue('s4_interpretation'),
      optional_epilogue_seen: clone(run.state.epilogue_seen)
    };
    run.state.history.push({ type: 'complete' });
    finishInput();
    var outcome = clone(run.state);
    notifyState(outcome);
    if (run.opts.onComplete) run.opts.onComplete(outcome);
    return { ok: true, complete: true, state: outcome };
  }

  function pauseAt(stage) {
    run.state.active = false;
    run.state.stage = stage;
    run.state.page_index = 0;
    run.state.page_id = null;
    run.state.history.push({ type: 'pause', stage: stage });
    finishInput();
    var snapshot = clone(run.state);
    notifyState(snapshot);
    if (run.opts.onPause) run.opts.onPause(stage, snapshot);
    return { ok: true, paused: true, stage: stage, state: snapshot };
  }

  function finishEncounter(kind) {
    if (run.state.encounters.indexOf(kind) < 0) run.state.encounters.push(kind);
    if (kind === 'nano') setFlag('mfap_finale_visto');
    run.state.history.push({ type: 'lodge_encounter_complete', actor: kind, order: run.state.encounters.slice() });
    return pauseAt(run.state.encounters.length < 2 ? 'await_lodge_second' : 'await_laura');
  }

  function nextStage() {
    var stage = run.state.stage;
    if (stage === 'm10_threshold') run.state.stage = 'method_choice';
    else if (stage === 'm10_open') run.state.stage = 'm10_questions';
    else if (stage === 'm10_questions') run.state.stage = 'm10_surface';
    else if (stage === 'm10_surface') run.state.stage = 'm10_admissions';
    else if (stage === 'm10_admissions') { recordAdmissions(); run.state.stage = 's3_threshold'; }
    else if (stage === 's3_threshold') run.state.stage = 's3_choice';
    else if (stage === 's3_feedback') run.state.stage = 'post_s3';
    else if (stage === 'post_s3') run.state.stage = 'victims';
    else if (stage === 'victims') run.state.stage = 'death';
    else if (stage === 'death') { setFlag('leland_morto'); return pauseAt('await_lodge'); }
    else if (stage === 'lodge_nano') {
      if (carryValue('s1') === 'documented_custody') run.state.stage = 'ring_choice';
      else {
        writeOnce('ring_final_gesture', 'none');
        writeOnce('ring_location_after_lodge', 'evidence_vault');
        writeOnce('final_ring_location', 'evidence_vault');
        return finishEncounter('nano');
      }
    }
    else if (stage === 'lodge_bob') run.state.stage = 'bob_choice';
    else if (stage === 'ring_feedback') return finishEncounter('nano');
    else if (stage === 'bob_reaction') return finishEncounter('bob');
    else if (stage === 'lodge_laura') return pauseAt('await_lodge_exit');
    else if (stage === 'lodge_blocked') {
      var blockedReturn = run.state.blocked_return_stage;
      delete run.state.blocked_actor;
      delete run.state.blocked_return_stage;
      return pauseAt(blockedReturn);
    }
    else if (stage === 'woods') run.state.stage = 's4_choice';
    else if (stage === 'epilogue_station') return pauseAt('await_epilogue_exit');
    else if (stage === 'epilogue_sarah') { run.state.epilogue_seen.sarah = true; return pauseAt('await_epilogue_exit'); }
    else if (stage === 'epilogue_ronette') { run.state.epilogue_seen.ronette = true; return pauseAt('await_epilogue_exit'); }
    else if (stage === 'epilogue_exit') return complete();
    run.state.page_index = 0;
    return { ok: true, screen: emit() };
  }

  function start(opts) {
    opts = opts || {};
    if (run && run.state.active) return { ok: false, error: 'finale_already_active' };
    if (run && run.state.stage !== 'complete') return { ok: false, error: 'finale_already_pending' };
    var carryover = clone(opts.carryover || {});
    run = {
      opts: opts,
      state: {
        version: VERSION,
        active: true,
        stage: 'm10_threshold',
        page_index: 0,
        page_id: null,
        values: valuesFrom(carryover),
        carryover: carryover,
        flags: clone(carryover.flags || {}),
        p6_status: 'unconfirmed',
        material_admissions: {},
        encounters: [],
        epilogue_seen: {},
        history: [],
        last_screen: null,
        consequences: null
      }
    };
    if (opts.inputContext && opts.inputContext.suspend) opts.inputContext.suspend();
    return { ok: true, screen: emit() };
  }
  NF.start = function (opts) { return transaction(function () { return start(opts); }, opts || {}); };

  function advance() {
    if (!run || !run.state.active) return { ok: false, error: 'finale_not_active' };
    var screen = currentScreen();
    if (!screen) { emit(); return { ok: false, error: 'missing_screen' }; }
    if (screen.kind === 'choice') return { ok: false, error: 'choice_required', choice: screen.id };
    var pages = pagesFor(run.state.stage);
    if (run.state.page_index < pages.length - 1) {
      run.state.page_index++;
      return { ok: true, screen: emit() };
    }
    return nextStage();
  }
  NF.advance = function () { return transaction(advance); };

  function choose(choiceId) {
    if (!run || !run.state.active) return { ok: false, error: 'finale_not_active' };
    var stage = run.state.stage, allowed, result;
    if (stage === 'method_choice') {
      allowed = ['probatorio', 'personale', 'intuitivo'];
      if (allowed.indexOf(choiceId) < 0) return { ok: false, error: 'invalid_m10_method' };
      result = writeOnce('m10_method', choiceId);
      if (!result.ok) return result;
      run.state.stage = 'm10_open';
      run.state.page_index = 0;
      return { ok: true, repeated: result.repeated, screen: emit() };
    }
    if (stage === 's3_choice') {
      if (!allAdmissionsRecorded()) return { ok: false, error: 's3_before_material_admissions' };
      allowed = ['on', 'off'];
      if (allowed.indexOf(choiceId) < 0) return { ok: false, error: 'invalid_s3' };
      if (own(run.state.values, 'truman_testimony_state') && run.state.values.truman_testimony_state !== (choiceId === 'on' ? 'not_needed' : 'voluntary_witness')) {
        return { ok: false, error: 'truman_testimony_state_write_once' };
      }
      result = writeOnce('s3', choiceId);
      if (!result.ok) return result;
      result = writeOnce('truman_testimony_state', choiceId === 'on' ? 'not_needed' : 'voluntary_witness');
      if (!result.ok) return result;
      run.state.history.push({ type: 's3_gate', admissions_complete: true });
      run.state.stage = 's3_feedback';
      run.state.page_index = 0;
      return { ok: true, repeated: result.repeated, screen: emit() };
    }
    if (stage === 'ring_choice') {
      allowed = ['kept', 'left'];
      if (allowed.indexOf(choiceId) < 0) return { ok: false, error: 'invalid_ring_final_gesture' };
      result = writeOnce('ring_final_gesture', choiceId);
      if (!result.ok) return result;
      result = writeOnce('ring_location_after_lodge', choiceId === 'kept' ? 'cooper' : 'lodge');
      if (!result.ok) return result;
      result = writeOnce('final_ring_location', choiceId === 'kept' ? 'evidence_vault' : 'lodge');
      if (!result.ok) return result;
      run.state.stage = 'ring_feedback';
      run.state.page_index = 0;
      return { ok: true, repeated: result.repeated, screen: emit() };
    }
    if (stage === 'bob_choice') {
      allowed = ['A', 'B', 'C'];
      if (allowed.indexOf(choiceId) < 0) return { ok: false, error: 'invalid_bob_response_stance' };
      result = writeOnce('bob_response_stance', choiceId);
      if (!result.ok) return result;
      run.state.stage = 'bob_reaction'; run.state.page_index = 0;
      return { ok: true, repeated: result.repeated, screen: emit() };
    }
    if (stage === 's4_choice') {
      allowed = ['avvertimento', 'istruzione', 'diagnosi'];
      if (allowed.indexOf(choiceId) < 0) return { ok: false, error: 'invalid_s4_interpretation' };
      result = writeOnce('s4_interpretation', choiceId);
      if (!result.ok) return result;
      return pauseAt('await_epilogue_station');
    }
    return { ok: false, error: 'no_choice_expected' };
  }
  NF.choose = function (choiceId) { return transaction(function () { return choose(choiceId); }); };

  NF.serialize = function () {
    if (!run) return null;
    return JSON.stringify(run.state);
  };

  var ACTIVE_STAGES = {
    m10_threshold: 1, method_choice: 1, m10_open: 1, m10_questions: 1,
    m10_surface: 1, m10_admissions: 1, s3_threshold: 1, s3_choice: 1,
    s3_feedback: 1, post_s3: 1, victims: 1, death: 1,
    lodge_nano: 1, ring_choice: 1, ring_feedback: 1, lodge_bob: 1, bob_choice: 1,
    bob_reaction: 1, lodge_laura: 1, lodge_blocked: 1, woods: 1,
    s4_choice: 1, epilogue_station: 1, epilogue_sarah: 1,
    epilogue_ronette: 1, epilogue_exit: 1
  };
  var PAUSED_STAGES = {
    await_lodge: 1, await_lodge_second: 1, await_laura: 1,
    await_lodge_exit: 1, await_epilogue_station: 1, await_epilogue_exit: 1
  };
  var CHOICE_STAGES = { method_choice: 1, s3_choice: 1, ring_choice: 1, bob_choice: 1, s4_choice: 1 };
  var METHOD_REQUIRED = {
    m10_open: 1, m10_questions: 1, m10_surface: 1, m10_admissions: 1,
    s3_threshold: 1, s3_choice: 1, s3_feedback: 1, post_s3: 1, victims: 1,
    death: 1, await_lodge: 1, await_lodge_second: 1, await_laura: 1,
    await_lodge_exit: 1, lodge_nano: 1, ring_choice: 1, ring_feedback: 1, lodge_bob: 1,
    bob_choice: 1, bob_reaction: 1, lodge_laura: 1, lodge_blocked: 1,
    woods: 1, s4_choice: 1, await_epilogue_station: 1, epilogue_station: 1,
    await_epilogue_exit: 1, epilogue_sarah: 1, epilogue_ronette: 1,
    epilogue_exit: 1, complete: 1
  };
  var S3_REQUIRED = {
    s3_feedback: 1, post_s3: 1, victims: 1, death: 1, await_lodge: 1,
    await_lodge_second: 1, await_laura: 1, await_lodge_exit: 1, lodge_nano: 1,
    ring_choice: 1, ring_feedback: 1, lodge_bob: 1, bob_choice: 1, bob_reaction: 1,
    lodge_laura: 1, lodge_blocked: 1, woods: 1, s4_choice: 1,
    await_epilogue_station: 1, epilogue_station: 1, await_epilogue_exit: 1,
    epilogue_sarah: 1, epilogue_ronette: 1, epilogue_exit: 1, complete: 1
  };
  function pageCountForSavedState(state) {
    var previous = run, count = 0;
    try { run = { state: state, opts: {} }; count = pagesFor(state.stage).length; }
    catch (_) { count = 0; }
    run = previous;
    return count;
  }
  function screenIdForSavedState(state) {
    var previous = run, screen = null, key = null;
    try {
      run = { state: state, opts: {} };
      screen = currentScreen();
      if (screen && screen.kind === 'page' && screen.page && screen.page.id) key = screen.page.id;
      else if (screen && screen.kind === 'choice' && screen.id) key = 'choice:' + screen.id;
    } catch (_) { key = null; }
    run = previous;
    return key;
  }
  function pageIndexForSavedId(state, pageId) {
    var previous = run, pages = [], index = -1, i;
    try {
      run = { state: state, opts: {} };
      pages = pagesFor(state.stage);
      for (i = 0; i < pages.length; i++) {
        if (pages[i].id === pageId) { index = i; break; }
      }
    } catch (_) { index = -1; }
    run = previous;
    return index;
  }
  function migrateSavedState(state) {
    if (!state || state.version === VERSION) return { state: state, migrated: false };
    if (state.version !== LEGACY_VERSION) return { state: null, migrated: false };
    state = clone(state);
    if (!Array.isArray(state.history)) return { state: null, migrated: false };
    if (state.active) {
      var savedId = state.last_screen;
      // R15 ha spostato il rientro di Truman dopo l'ammissione su Maddy.
      // Un checkpoint sulla vecchia pagina riparte dalla nuova battuta VOCE
      // immediatamente successiva, senza usare l'indice ormai ambiguo.
      if (savedId === 'nf.m10.admit.intuitive.02b') savedId = 'nf.m10.admit.intuitive.02a';
      if (typeof savedId !== 'string') return { state: null, migrated: false };
      if (savedId.indexOf('choice:') === 0) {
        state.page_index = 0;
        state.page_id = savedId;
      } else {
        var mappedIndex = pageIndexForSavedId(state, savedId);
        if (mappedIndex < 0) return { state: null, migrated: false };
        state.page_index = mappedIndex;
        state.page_id = savedId;
      }
    } else {
      state.page_index = 0;
      state.page_id = null;
    }
    state.version = VERSION;
    state.history.push({ type: 'save_migrated', from_version: LEGACY_VERSION, to_version: VERSION, page_id: state.page_id });
    return { state: state, migrated: true };
  }
  function validSavedState(state) {
    var i, seen = {};
    if (!state || state.version !== VERSION || !state.values || !state.flags ||
        !state.material_admissions || !state.history || !Array.isArray(state.history) ||
        !Array.isArray(state.encounters) || !state.epilogue_seen ||
        typeof state.active !== 'boolean' || !Number.isInteger(state.page_index) || state.page_index < 0) return false;
    if (!ACTIVE_STAGES[state.stage] && !PAUSED_STAGES[state.stage] && state.stage !== 'complete') return false;
    if (state.active !== !!ACTIVE_STAGES[state.stage]) return false;
    for (i = 0; i < state.encounters.length; i++) {
      if ((state.encounters[i] !== 'nano' && state.encounters[i] !== 'bob') || seen[state.encounters[i]]) return false;
      seen[state.encounters[i]] = true;
    }
    if (state.encounters.length > 2) return false;
    if (state.stage === 'await_lodge' && state.encounters.length !== 0) return false;
    if (state.stage === 'await_lodge_second' && state.encounters.length !== 1) return false;
    if ((state.stage === 'await_laura' || state.stage === 'lodge_laura' || state.stage === 'await_lodge_exit') &&
        (state.encounters.length !== 2 || !state.flags.mfap_finale_visto)) return false;
    if (state.stage === 'lodge_blocked' &&
        ((state.blocked_actor !== 'mfap' && state.blocked_actor !== 'bob' && state.blocked_actor !== 'laura') ||
         !PAUSED_STAGES[state.blocked_return_stage] || state.blocked_return_stage.indexOf('await_lodge') !== 0)) return false;
    if (METHOD_REQUIRED[state.stage] && ['probatorio', 'personale', 'intuitivo'].indexOf(state.values.m10_method) < 0) return false;
    if (S3_REQUIRED[state.stage] && ['on', 'off'].indexOf(state.values.s3) < 0) return false;
    if (state.encounters.length && ['nano_first', 'bob_first'].indexOf(state.values.encounter_order) < 0) return false;
    if (state.encounters.indexOf('bob') >= 0 && ['A', 'B', 'C'].indexOf(state.values.bob_response_stance) < 0) return false;
    if ((state.stage === 'await_epilogue_station' || state.stage === 'epilogue_station' || state.stage === 'await_epilogue_exit' ||
         state.stage === 'epilogue_sarah' || state.stage === 'epilogue_ronette' || state.stage === 'epilogue_exit' || state.stage === 'complete') &&
        ['avvertimento', 'istruzione', 'diagnosi'].indexOf(state.values.s4_interpretation) < 0) return false;
    if (CHOICE_STAGES[state.stage] || PAUSED_STAGES[state.stage] || state.stage === 'complete') {
      if (state.page_index !== 0) return false;
    } else if (state.page_index >= pageCountForSavedState(state)) return false;
    if (state.active) {
      if (typeof state.page_id !== 'string' || state.page_id !== screenIdForSavedState(state)) return false;
    } else if (state.page_id !== null) return false;
    if (state.stage === 'complete' && !state.consequences) return false;
    return true;
  }

  NF.deserialize = function (serialized, opts) {
    var state, migration;
    try { state = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized); }
    catch (_) { return { ok: false, error: 'invalid_finale_save' }; }
    migration = migrateSavedState(state);
    state = migration.state;
    if (!validSavedState(state)) {
      return { ok: false, error: 'invalid_finale_save' };
    }
    if (run && run.state.active) finishInput();
    run = { opts: opts || {}, state: state };
    if (state.active && run.opts.inputContext && run.opts.inputContext.suspend) run.opts.inputContext.suspend();
    return { ok: true, screen: state.active ? emit() : null, state: clone(state), migrated: migration.migrated };
  };

  function resume(expected, next, opts) {
    if (!run || run.state.active || run.state.stage !== expected) return { ok: false, error: 'finale_not_at_' + expected };
    if (opts) run.opts = opts;
    run.state.active = true;
    run.state.stage = next;
    run.state.page_index = 0;
    run.state.history.push({ type: 'resume', from: expected, to: next });
    if (run.opts.inputContext && run.opts.inputContext.suspend) run.opts.inputContext.suspend();
    return { ok: true, screen: emit() };
  }

  function beginLodge(actorId, opts) {
    if (!run || run.state.active || (run.state.stage !== 'await_lodge' && run.state.stage !== 'await_lodge_second')) {
      return { ok: false, error: 'finale_not_at_lodge_encounter' };
    }
    var kind = actorId === 'mfap' ? 'nano' : actorId === 'bob' ? 'bob' : null;
    if (!kind) return { ok: false, error: 'invalid_lodge_actor' };
    if (run.state.encounters.indexOf(kind) >= 0) return { ok: false, error: 'lodge_actor_already_seen' };
    if (!run.state.encounters.length) {
      var order = writeOnce('encounter_order', kind === 'nano' ? 'nano_first' : 'bob_first');
      if (!order.ok) return order;
    }
    return resume(run.state.stage, 'lodge_' + kind, opts);
  }
  NF.beginLodge = function (actorId, opts) { return transaction(function () { return beginLodge(actorId, opts); }); };
  function resumeLaura(opts) {
    if (!run || run.state.encounters.length !== 2 || !run.state.flags.mfap_finale_visto) return { ok: false, error: 'laura_before_required_encounters' };
    return resume('await_laura', 'lodge_laura', opts);
  }
  NF.resumeLaura = function (opts) { return transaction(function () { return resumeLaura(opts); }); };
  function blockLodgeInteraction(actorId, opts) {
    var allowedStages = ['await_lodge', 'await_lodge_second', 'await_laura', 'await_lodge_exit'];
    if (!run || run.state.active || allowedStages.indexOf(run.state.stage) < 0) return { ok: false, error: 'finale_not_at_lodge_pause' };
    if (actorId !== 'mfap' && actorId !== 'bob' && actorId !== 'laura') return { ok: false, error: 'invalid_lodge_actor' };
    if (opts) run.opts = opts;
    run.state.blocked_return_stage = run.state.stage;
    run.state.blocked_actor = actorId;
    run.state.active = true;
    run.state.stage = 'lodge_blocked';
    run.state.page_index = 0;
    run.state.history.push({ type: 'lodge_interaction_blocked', actor: actorId, returns_to: run.state.blocked_return_stage });
    if (run.opts.inputContext && run.opts.inputContext.suspend) run.opts.inputContext.suspend();
    return { ok: true, screen: emit() };
  }
  NF.blockLodgeInteraction = function (actorId, opts) { return transaction(function () { return blockLodgeInteraction(actorId, opts); }); };
  NF.resumeWoods = function (opts) { return transaction(function () { return resume('await_lodge_exit', 'woods', opts); }); };
  NF.resumeEpilogueStation = function (opts) { return transaction(function () { return resume('await_epilogue_station', 'epilogue_station', opts); }); };
  function resumeEpilogueOptional(kind, opts) {
    if (kind !== 'sarah' && kind !== 'ronette') return { ok: false, error: 'invalid_epilogue_optional' };
    if (run && run.state.epilogue_seen[kind]) return { ok: true, repeated: true, state: clone(run.state) };
    return resume('await_epilogue_exit', 'epilogue_' + kind, opts);
  }
  NF.resumeEpilogueOptional = function (kind, opts) { return transaction(function () { return resumeEpilogueOptional(kind, opts); }); };
  NF.resumeEpilogueExit = function (opts) { return transaction(function () { return resume('await_epilogue_exit', 'epilogue_exit', opts); }); };

  NF.isActive = function () { return !!(run && run.state.active); };
  NF.isPending = function () { return !!(run && run.state.stage !== 'complete'); };
  NF.objective = function () {
    if (!run || run.state.stage === 'complete') return '';
    if (run.state.stage === 'await_lodge') return 'Nella Loggia: scegli chi affrontare per primo.';
    if (run.state.stage === 'await_lodge_second') return 'Nella Loggia: affronta l\'altra presenza.';
    if (run.state.stage === 'await_laura') return 'Nella Loggia: parla infine con Laura.';
    if (run.state.stage === 'await_lodge_exit') return 'Esci dalla Loggia e attraversa il bosco.';
    if (run.state.stage === 'await_epilogue_station') return 'Torna da Truman alla centrale.';
    if (run.state.stage === 'await_epilogue_exit') return 'Visite facoltative; poi raggiungi il cartello sud.';
    if (run.state.stage.indexOf('m10') === 0 || run.state.stage === 'method_choice' || run.state.stage.indexOf('s3') === 0 || run.state.stage === 'post_s3' || run.state.stage === 'victims' || run.state.stage === 'death') return 'Porta il colloquio fino ai fatti.';
    return 'Segui il caso fino alla strada sud.';
  };
  NF.getState = function () { return run ? clone(run.state) : null; };
  NF.currentScreen = function () { var s = run && run.state.active ? currentScreen() : null; return s ? clone(s) : null; };
  NF.reset = function () { if (run && run.state.active) finishInput(); else removeUI(); run = null; };

  if (typeof module !== 'undefined' && module.exports) module.exports = NF;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
