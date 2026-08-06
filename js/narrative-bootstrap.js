/* narrative-bootstrap.js — C8-C.1 Fix 1: cablaggio GENERICO dei cataloghi
 * narrativi dentro il runtime.
 *
 * Il runtime (`narrative-runtime.js`) è un interprete PURO: non conosce i
 * cataloghi, li riceve dal chiamante (`NR.setValueDomains` / `NR.setValueTransitions`).
 * Fino a C8-C quel cablaggio viveva SOLO nel boot degli harness: un boot di
 * PRODUZIONE (runtime + narrative-data.gen.js + adapter) partiva con
 * `valueDomains = {}` e `valueTransitions = {}`, quindi la prima scelta con un
 * valore tipizzato falliva in `prepareChoice` con
 * `value_without_domain: promise_stance` e le transizioni del presagio
 * sarebbero fallite allo stesso modo.
 *
 * Questo file è l'UNICO path di cablaggio: lo chiamano sia il boot reale
 * (playtest.html) sia gli harness. Regole:
 *  - GENERICO: legge `D.enums.values_allowed` (nome valore → nome dominio) e
 *    `D.enums.enums` (nome dominio → array). Nessun dominio hardcoded, nessun
 *    `if (mission === ...)`, nessuna conoscenza di M4/M5/M6/M8.
 *  - IDEMPOTENTE: ricalcola dai cataloghi e reinstalla; due chiamate lasciano
 *    il runtime nello stesso stato. Ritorna sempre il descrittore installato.
 *  - ORDINE: va eseguito DOPO il caricamento dei dati e PRIMA di qualunque
 *    deserialize/load/interazione (deserialize valida i valori tipizzati
 *    contro i domini: senza domini installati rifiuterebbe un salvataggio
 *    legittimo).
 *  - FAIL-CLOSED: un valore dichiarato in `values_allowed` il cui dominio non
 *    esiste in `enums` è un errore di DATI e viene sollevato subito, non
 *    scoperto a metà partita. */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  var GAME = G.GAME = G.GAME || {};

  // costruisce la mappa nome-valore → dominio (array) leggendo SOLO i cataloghi
  function buildValueDomains(enums) {
    var domains = {};
    var allowed = (enums && enums.values_allowed) || {};
    var catalog = (enums && enums.enums) || {};
    Object.keys(allowed).forEach(function (valueName) {
      var domainName = allowed[valueName];
      var dom = catalog[domainName];
      if (Object.prototype.toString.call(dom) !== '[object Array]' || !dom.length) {
        throw new Error('narrative_bootstrap: dominio mancante per il valore ' + valueName + ' → ' + domainName);
      }
      domains[valueName] = dom;
    });
    return domains;
  }

  /* installNarrativeCatalogs({ data, runtime }) → { value_domains, value_transitions }
   * data/runtime sono iniettabili per i test; di default GAME.NarrativeData e
   * GAME.NarrativeRuntime. */
  GAME.installNarrativeCatalogs = function (opts) {
    opts = opts || {};
    var D = opts.data || GAME.NarrativeData;
    var NR = opts.runtime || GAME.NarrativeRuntime;
    if (!NR || typeof NR.setValueDomains !== 'function' || typeof NR.setValueTransitions !== 'function') {
      throw new Error('narrative_bootstrap: NarrativeRuntime non caricato (o troppo vecchio)');
    }
    if (!D || !D.enums) throw new Error('narrative_bootstrap: NarrativeData.enums non caricato');

    var domains = buildValueDomains(D.enums);
    var transitions = D.enums.value_transitions || {};
    NR.setValueDomains(domains);
    NR.setValueTransitions(transitions);

    var installed = {
      value_domains: Object.keys(domains).sort(),
      value_transitions: Object.keys(transitions).sort(),
      missions: D.missions ? Object.keys(D.missions).sort() : []
    };
    GAME.narrativeCatalogsInstalled = installed;
    return installed;
  };
})();
