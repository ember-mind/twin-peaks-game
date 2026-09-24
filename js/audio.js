/* audio.js — colonna sonora procedurale via WebAudio, nell'idioma jazz-onirico
 * del synth-noir anni '90 (piano elettrico, pad sintetici, riverbero enorme):
 * composizione ORIGINALE, nessuna citazione melodica di brani esistenti.
 * Osserva GAME.Engine.state (.mode / .mapId) e fa dissolvenza tra 5 brani
 * a seconda di dove si trova il giocatore. File autonomo: non tocca il
 * motore, non dipende da THREE, funziona anche se rimosso da index.html.
 */
(function () {
  if (typeof window === 'undefined') return; // ambiente node (test/smoke.js): niente WebAudio

  var GAME = window.GAME = window.GAME || {};

  /* ================== tabella note -> frequenza (temperamento equabile) ================== */

  var NOTE_FREQ = {};
  (function buildNoteTable() {
    var names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (var octave = 0; octave <= 8; octave++) {
      for (var i = 0; i < names.length; i++) {
        var midi = (octave + 1) * 12 + i; // C4 (mediano) = midi 60
        NOTE_FREQ[names[i] + octave] = 440 * Math.pow(2, (midi - 69) / 12);
      }
    }
  })();

  function freq(note) { return NOTE_FREQ[note]; }
  function freqs(names) {
    var out = [];
    for (var i = 0; i < names.length; i++) out.push(freq(names[i]));
    return out;
  }

  /* ================== dati musicali (composizioni originali) ==================
   * Ogni brano: bpm, beatsPerBar, bars (durata del loop), events[].
   * Ogni evento: { bar, beat, dur, notes: [...], voice: 'pad'|'rhodes'|'bass'|'bell', vel, opts }
   * bar/beat sono coordinate musicali leggibili; vengono convertite in "t" (beat
   * assoluti dall'inizio del loop) al caricamento, così restano dati editabili
   * e non logica di riproduzione.
   *
   * NOTA COPYRIGHT: nessuna delle frasi seguenti riproduce un tema di Angelo
   * Badalamenti. Sono progressioni e melodie originali scritte per questo gioco,
   * pensate solo nello stesso linguaggio armonico (settime maggiori, colori
   * alterati, tempo lento, Rhodes/pad/riverbero) del genere "synth-noir onirico".
   */

  var CUES = {

    /* --- title: cue onirico di apertura, in La minore con colore di settima
     * maggiore. Pad lenti, melodia di Rhodes rada e sospesa, basso sui gradi
     * fondamentali. Malinconico, ampio, senza fretta. */
    title: {
      bpm: 54, beatsPerBar: 4, bars: 8, loopBeats: 32,
      events: [
        // pad — un accordo per battuta
        { bar: 0, beat: 0, dur: 4, notes: ['A3', 'C4', 'E4', 'G#4'], voice: 'pad', vel: 0.40 }, // Am(maj7)
        { bar: 1, beat: 0, dur: 4, notes: ['D3', 'F3', 'A3', 'E4'], voice: 'pad', vel: 0.40 }, // Dm9
        { bar: 2, beat: 0, dur: 4, notes: ['G3', 'B3', 'D4', 'F#4'], voice: 'pad', vel: 0.40 }, // Gmaj7
        { bar: 3, beat: 0, dur: 4, notes: ['C3', 'E3', 'G3', 'F#4'], voice: 'pad', vel: 0.40 }, // Cmaj7(#11)
        { bar: 4, beat: 0, dur: 4, notes: ['F#3', 'A3', 'C4', 'E4'], voice: 'pad', vel: 0.38 }, // F#m7b5
        { bar: 5, beat: 0, dur: 4, notes: ['B3', 'D#4', 'F#4', 'A4'], voice: 'pad', vel: 0.38 }, // B7(#9)
        { bar: 6, beat: 0, dur: 4, notes: ['E3', 'G3', 'B3', 'D4'], voice: 'pad', vel: 0.38 }, // Em7
        { bar: 7, beat: 0, dur: 4, notes: ['A3', 'C4', 'E4', 'G#4'], voice: 'pad', vel: 0.40 }, // torna Am(maj7): il loop si richiude
        // basso — fondamentali
        { bar: 0, beat: 0, dur: 4, notes: ['A2'], voice: 'bass', vel: 0.50 },
        { bar: 1, beat: 0, dur: 4, notes: ['D2'], voice: 'bass', vel: 0.50 },
        { bar: 2, beat: 0, dur: 4, notes: ['G2'], voice: 'bass', vel: 0.50 },
        { bar: 3, beat: 0, dur: 4, notes: ['C2'], voice: 'bass', vel: 0.50 },
        { bar: 4, beat: 0, dur: 4, notes: ['F#2'], voice: 'bass', vel: 0.48 },
        { bar: 5, beat: 0, dur: 4, notes: ['B2'], voice: 'bass', vel: 0.48 },
        { bar: 6, beat: 0, dur: 4, notes: ['E2'], voice: 'bass', vel: 0.48 },
        { bar: 7, beat: 0, dur: 4, notes: ['A2'], voice: 'bass', vel: 0.50 },
        // rhodes — frase originale, rada e fluttuante
        { bar: 0, beat: 2, dur: 2.5, notes: ['E5'], voice: 'rhodes', vel: 0.55 },
        { bar: 1, beat: 1.5, dur: 1.5, notes: ['C5'], voice: 'rhodes', vel: 0.50 },
        { bar: 1, beat: 3, dur: 2, notes: ['A4'], voice: 'rhodes', vel: 0.48 },
        { bar: 2, beat: 2, dur: 3, notes: ['D5'], voice: 'rhodes', vel: 0.55 },
        { bar: 3, beat: 1, dur: 1.5, notes: ['B4'], voice: 'rhodes', vel: 0.45 },
        { bar: 3, beat: 3, dur: 2, notes: ['G4'], voice: 'rhodes', vel: 0.45 },
        { bar: 4, beat: 2, dur: 2.5, notes: ['C5'], voice: 'rhodes', vel: 0.50 },
        { bar: 5, beat: 1.5, dur: 2, notes: ['A4'], voice: 'rhodes', vel: 0.45 },
        { bar: 6, beat: 2, dur: 3, notes: ['F#4'], voice: 'rhodes', vel: 0.42 },
        { bar: 7, beat: 1, dur: 2.5, notes: ['E5'], voice: 'rhodes', vel: 0.50 },
        // campana — un solo accento sparso
        { bar: 4, beat: 0, dur: 9, notes: ['A5'], voice: 'bell', vel: 0.32 }
      ]
    },

    /* --- town: stesso mondo, più chiaro e curioso. Rhodes un po' più mosso
     * su pad caldo, armonia leggermente più luminosa. Esterni (paese/vagone). */
    town: {
      bpm: 58, beatsPerBar: 4, bars: 8, loopBeats: 32,
      events: [
        { bar: 0, beat: 0, dur: 4, notes: ['C3', 'E3', 'G3', 'B3'], voice: 'pad', vel: 0.40 }, // Cmaj7
        { bar: 1, beat: 0, dur: 4, notes: ['D3', 'F3', 'A3', 'C4'], voice: 'pad', vel: 0.40 }, // Dm7
        { bar: 2, beat: 0, dur: 4, notes: ['E3', 'G3', 'B3', 'D4'], voice: 'pad', vel: 0.40 }, // Em7
        { bar: 3, beat: 0, dur: 4, notes: ['F3', 'A3', 'C4', 'B4'], voice: 'pad', vel: 0.40 }, // Fmaj7(#11)
        { bar: 4, beat: 0, dur: 4, notes: ['C3', 'E3', 'G3', 'B3'], voice: 'pad', vel: 0.40 }, // Cmaj7
        { bar: 5, beat: 0, dur: 4, notes: ['A3', 'C4', 'E4', 'G4'], voice: 'pad', vel: 0.38 }, // Am7
        { bar: 6, beat: 0, dur: 4, notes: ['D3', 'F3', 'A3', 'E4'], voice: 'pad', vel: 0.38 }, // Dm9
        { bar: 7, beat: 0, dur: 4, notes: ['G3', 'B3', 'F4', 'E5'], voice: 'pad', vel: 0.40 }, // G13 (dominante, torna al giro)
        { bar: 0, beat: 0, dur: 4, notes: ['C2'], voice: 'bass', vel: 0.50 },
        { bar: 1, beat: 0, dur: 4, notes: ['D2'], voice: 'bass', vel: 0.48 },
        { bar: 2, beat: 0, dur: 4, notes: ['E2'], voice: 'bass', vel: 0.48 },
        { bar: 3, beat: 0, dur: 4, notes: ['F2'], voice: 'bass', vel: 0.48 },
        { bar: 4, beat: 0, dur: 4, notes: ['C2'], voice: 'bass', vel: 0.50 },
        { bar: 5, beat: 0, dur: 4, notes: ['A1'], voice: 'bass', vel: 0.48 },
        { bar: 6, beat: 0, dur: 4, notes: ['D2'], voice: 'bass', vel: 0.48 },
        { bar: 7, beat: 0, dur: 4, notes: ['G1'], voice: 'bass', vel: 0.50 },
        // rhodes — figura che si muove con più curiosità
        { bar: 0, beat: 0.5, dur: 1, notes: ['E5'], voice: 'rhodes', vel: 0.50 },
        { bar: 0, beat: 2, dur: 1, notes: ['G4'], voice: 'rhodes', vel: 0.45 },
        { bar: 0, beat: 3, dur: 1, notes: ['C5'], voice: 'rhodes', vel: 0.48 },
        { bar: 1, beat: 0.5, dur: 1, notes: ['F4'], voice: 'rhodes', vel: 0.45 },
        { bar: 1, beat: 2, dur: 1, notes: ['A4'], voice: 'rhodes', vel: 0.48 },
        { bar: 2, beat: 0.5, dur: 1, notes: ['G4'], voice: 'rhodes', vel: 0.45 },
        { bar: 2, beat: 2.5, dur: 1.5, notes: ['D5'], voice: 'rhodes', vel: 0.50 },
        { bar: 3, beat: 0.5, dur: 1, notes: ['A4'], voice: 'rhodes', vel: 0.48 },
        { bar: 3, beat: 2, dur: 1.5, notes: ['B4'], voice: 'rhodes', vel: 0.50 },
        { bar: 4, beat: 0.5, dur: 1, notes: ['E5'], voice: 'rhodes', vel: 0.50 },
        { bar: 4, beat: 2.5, dur: 1.5, notes: ['G4'], voice: 'rhodes', vel: 0.42 },
        { bar: 5, beat: 0.5, dur: 1, notes: ['C5'], voice: 'rhodes', vel: 0.48 },
        { bar: 5, beat: 2, dur: 1, notes: ['E5'], voice: 'rhodes', vel: 0.50 },
        { bar: 6, beat: 0.5, dur: 1, notes: ['F4'], voice: 'rhodes', vel: 0.45 },
        { bar: 6, beat: 2.5, dur: 1.5, notes: ['A4'], voice: 'rhodes', vel: 0.48 },
        { bar: 7, beat: 0.5, dur: 1, notes: ['B4'], voice: 'rhodes', vel: 0.48 },
        { bar: 7, beat: 2, dur: 2, notes: ['E5'], voice: 'rhodes', vel: 0.50 },
        { bar: 6, beat: 0, dur: 6, notes: ['G5'], voice: 'bell', vel: 0.28 }
      ]
    },

    /* --- interior: più caldo e vicino, un tocco di lounge-jazz. Pad più morbido,
     * Rhodes con più movimento cromatico. Interni (sceriffo/Palmer/diner/hotel/
     * ospedale/OEJ/roadhouse). */
    interior: {
      bpm: 56, beatsPerBar: 4, bars: 8, loopBeats: 32,
      events: [
        { bar: 0, beat: 0, dur: 4, notes: ['D3', 'F3', 'A3', 'E4'], voice: 'pad', vel: 0.38 }, // Dm9
        { bar: 1, beat: 0, dur: 4, notes: ['G2', 'B2', 'F3', 'E4'], voice: 'pad', vel: 0.38 }, // G13
        { bar: 2, beat: 0, dur: 4, notes: ['C3', 'E3', 'G3', 'B3'], voice: 'pad', vel: 0.40 }, // Cmaj7
        { bar: 3, beat: 0, dur: 4, notes: ['A2', 'C#3', 'F3', 'G3'], voice: 'pad', vel: 0.36 }, // A7(#5)
        { bar: 4, beat: 0, dur: 4, notes: ['D3', 'F3', 'A3', 'E4'], voice: 'pad', vel: 0.38 }, // Dm9
        { bar: 5, beat: 0, dur: 4, notes: ['A#2', 'D3', 'F3', 'E4'], voice: 'pad', vel: 0.38 }, // Bbmaj7(#11)
        { bar: 6, beat: 0, dur: 4, notes: ['E3', 'G3', 'A#3', 'D4'], voice: 'pad', vel: 0.36 }, // Em7b5
        { bar: 7, beat: 0, dur: 4, notes: ['A2', 'C#3', 'G3', 'A#3'], voice: 'pad', vel: 0.36 }, // A7(b9), torna a Dm9
        { bar: 0, beat: 0, dur: 4, notes: ['D2'], voice: 'bass', vel: 0.48 },
        { bar: 1, beat: 0, dur: 4, notes: ['G1'], voice: 'bass', vel: 0.46 },
        { bar: 2, beat: 0, dur: 4, notes: ['C2'], voice: 'bass', vel: 0.48 },
        { bar: 3, beat: 0, dur: 4, notes: ['A1'], voice: 'bass', vel: 0.46 },
        { bar: 4, beat: 0, dur: 4, notes: ['D2'], voice: 'bass', vel: 0.48 },
        { bar: 5, beat: 0, dur: 4, notes: ['A#1'], voice: 'bass', vel: 0.46 },
        { bar: 6, beat: 0, dur: 4, notes: ['E2'], voice: 'bass', vel: 0.46 },
        { bar: 7, beat: 0, dur: 4, notes: ['A1'], voice: 'bass', vel: 0.46 },
        // rhodes — più cromatico, fraseggio da lounge
        { bar: 0, beat: 1, dur: 1.5, notes: ['A4'], voice: 'rhodes', vel: 0.50 },
        { bar: 0, beat: 2.5, dur: 1, notes: ['C5'], voice: 'rhodes', vel: 0.48 },
        { bar: 1, beat: 0.5, dur: 1, notes: ['E5'], voice: 'rhodes', vel: 0.50 },
        { bar: 1, beat: 2, dur: 1.5, notes: ['B4'], voice: 'rhodes', vel: 0.45 },
        { bar: 2, beat: 1, dur: 2, notes: ['G4'], voice: 'rhodes', vel: 0.50 },
        { bar: 3, beat: 0.5, dur: 1, notes: ['F4'], voice: 'rhodes', vel: 0.45 },
        { bar: 3, beat: 2.5, dur: 1, notes: ['C#5'], voice: 'rhodes', vel: 0.50 },
        { bar: 4, beat: 1, dur: 1.5, notes: ['A4'], voice: 'rhodes', vel: 0.48 },
        { bar: 5, beat: 0.5, dur: 1, notes: ['D5'], voice: 'rhodes', vel: 0.50 },
        { bar: 5, beat: 2, dur: 1.5, notes: ['F4'], voice: 'rhodes', vel: 0.45 },
        { bar: 6, beat: 1, dur: 2, notes: ['A#4'], voice: 'rhodes', vel: 0.48 },
        { bar: 7, beat: 0.5, dur: 1, notes: ['C#5'], voice: 'rhodes', vel: 0.48 },
        { bar: 7, beat: 2.5, dur: 1, notes: ['G4'], voice: 'rhodes', vel: 0.45 },
        { bar: 2, beat: 3, dur: 8, notes: ['E5'], voice: 'bell', vel: 0.30 }
      ]
    },

    /* --- woods: sparso e minaccioso. Bordone grave sostenuto, tritono che
     * si insinua a metà ciclo, campane rade e distanziate, pochissima melodia. */
    woods: {
      bpm: 50, beatsPerBar: 4, bars: 16, loopBeats: 64,
      events: [
        { bar: 0, beat: 0, dur: 64, notes: ['E2', 'B2'], voice: 'pad', vel: 0.32 }, // quinta stabile: il bordone di base
        { bar: 8, beat: 0, dur: 32, notes: ['E2', 'A#2'], voice: 'pad', vel: 0.22 }, // il tritono si affaccia a metà ciclo
        { bar: 0, beat: 0, dur: 64, notes: ['E1'], voice: 'bass', vel: 0.40 },
        { bar: 2, beat: 2, dur: 10, notes: ['A#4'], voice: 'bell', vel: 0.28 },
        { bar: 6, beat: 1, dur: 8, notes: ['F4'], voice: 'bell', vel: 0.26 },
        { bar: 11, beat: 3, dur: 12, notes: ['C5'], voice: 'bell', vel: 0.24 },
        { bar: 14, beat: 0, dur: 14, notes: ['A#4'], voice: 'bell', vel: 0.26 },
        { bar: 9, beat: 2, dur: 4, notes: ['E4'], voice: 'rhodes', vel: 0.20 } // unico, flebile accenno di melodia
      ]
    },

    /* --- lodge (Red Room): inquietante e lentissimo. Due triadi aumentate
     * (armonia simmetrica, priva di risoluzione) alternate come "swell" con
     * attacco lunghissimo e taglio secco; l'ultima porta un vibrato ampio.
     * Campane rade. */
    lodge: {
      bpm: 48, beatsPerBar: 4, bars: 12, loopBeats: 48,
      events: [
        { bar: 0, beat: 0, dur: 16, notes: ['C3', 'E3', 'G#3'], voice: 'pad', vel: 0.38,
          opts: { attack: 3.5, release: 0.25 } },
        { bar: 4, beat: 0, dur: 16, notes: ['D3', 'F#3', 'A#3'], voice: 'pad', vel: 0.38,
          opts: { attack: 3.5, release: 0.25 } }, // stessa forma un tono sopra: nessuna risoluzione
        { bar: 8, beat: 0, dur: 16, notes: ['C3', 'E3', 'G#3'], voice: 'pad', vel: 0.35,
          opts: { attack: 3.5, release: 0.25, vibrato: { rate: 5.5, depth: 28 } } }, // ritorno, vibrato ampio
        { bar: 0, beat: 0, dur: 48, notes: ['C1'], voice: 'bass', vel: 0.30 },
        { bar: 1, beat: 2, dur: 10, notes: ['F#5'], voice: 'bell', vel: 0.28 },
        { bar: 6, beat: 0, dur: 14, notes: ['A#4'], voice: 'bell', vel: 0.26 },
        { bar: 10, beat: 3, dur: 8, notes: ['C#5'], voice: 'bell', vel: 0.24 }
      ]
    }
  };

  // converte bar/beat -> t (beat assoluti dall'inizio del loop) e ordina per t
  (function prepareCues() {
    for (var name in CUES) {
      if (!CUES.hasOwnProperty(name)) continue;
      var cue = CUES[name];
      var bpb = cue.beatsPerBar || 4;
      for (var i = 0; i < cue.events.length; i++) {
        cue.events[i].t = cue.events[i].bar * bpb + cue.events[i].beat;
      }
      cue.events.sort(function (a, b) { return a.t - b.t; });
    }
  })();

  /* ================== grafo audio (creato al primo gesto utente) ================== */

  var actx = null;
  var master = null, bus = null, sfxBus = null, sfxNoiseBuffer = null;
  var lastSfxAt = {};
  var DEFAULT_VOLUME = 0.35;
  var targetVolume = DEFAULT_VOLUME;
  var muted = false;
  try { muted = window.localStorage.getItem('tp_mute') === '1'; } catch (e) { /* storage non disponibile: resta non muto */ }

  // genera una risposta all'impulso rumore-bianco + inviluppo esponenziale
  // (il riverbero cavernoso è la firma sonora di questo mondo)
  function buildImpulse(duration) {
    var rate = actx.sampleRate;
    var length = Math.round(rate * duration);
    var buf = actx.createBuffer(2, length, rate);
    for (var ch = 0; ch < 2; ch++) {
      var data = buf.getChannelData(ch);
      for (var i = 0; i < length; i++) {
        var env = Math.exp(-5.5 * (i / length)); // coda esponenziale ~3s
        data[i] = (Math.random() * 2 - 1) * env;
      }
    }
    return buf;
  }

  // coro lento: due linee di delay modulate da un LFO a ~0.25Hz, sfasate
  function buildChorus(input) {
    var output = actx.createGain();

    var dry = actx.createGain(); dry.gain.value = 0.7;
    input.connect(dry); dry.connect(output);

    var lfo = actx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.25;
    var lfoInv = actx.createGain(); lfoInv.gain.value = -1; // sfasa la seconda linea rispetto alla prima
    lfo.connect(lfoInv);

    var depth1 = actx.createGain(); depth1.gain.value = 0.003; // profondità modulazione (~3ms)
    var depth2 = actx.createGain(); depth2.gain.value = 0.003;
    lfo.connect(depth1);
    lfoInv.connect(depth2);

    var delay1 = actx.createDelay(0.05); delay1.delayTime.value = 0.018;
    var delay2 = actx.createDelay(0.05); delay2.delayTime.value = 0.024;
    depth1.connect(delay1.delayTime);
    depth2.connect(delay2.delayTime);

    var wet1 = actx.createGain(); wet1.gain.value = 0.35;
    var wet2 = actx.createGain(); wet2.gain.value = 0.35;
    input.connect(delay1); delay1.connect(wet1); wet1.connect(output);
    input.connect(delay2); delay2.connect(wet2); wet2.connect(output);

    lfo.start();
    return output;
  }

  function buildGraph() {
    bus = actx.createGain(); // somma di tutti i brani attivi (per il crossfade)

    var chorusOut = buildChorus(bus);

    var dryGain = actx.createGain(); dryGain.gain.value = 1.0;
    var wetGain = actx.createGain(); wetGain.gain.value = 0.45; // riverbero in parallelo, non a sostituzione del secco
    var convolver = actx.createConvolver();
    convolver.buffer = buildImpulse(3.0);
    chorusOut.connect(dryGain);
    chorusOut.connect(wetGain);
    wetGain.connect(convolver);

    var lowpass = actx.createBiquadFilter();
    lowpass.type = 'lowpass'; lowpass.frequency.value = 3500; lowpass.Q.value = 0.7;
    dryGain.connect(lowpass);
    convolver.connect(lowpass);

    master = actx.createGain();
    master.gain.value = 0;
    lowpass.connect(master);
    // Gli effetti hanno un bus asciutto separato, ma attraversano lo stesso
    // master: mute e volume globale valgono identici per musica e feedback.
    sfxBus = actx.createGain();
    sfxBus.gain.value = 0.62;
    sfxBus.connect(master);
    master.connect(actx.destination);

    // dissolvenza in ingresso morbida all'avvio, poi rispetta mute/volume correnti
    var now = actx.currentTime;
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(muted ? 0 : targetVolume, now + 1.5);
  }

  /* ================== SFX procedurali, originali e senza sample ================== */

  function sfxReady() {
    return !!(actx && sfxBus && actx.state === 'running' && !muted && targetVolume > 0);
  }

  function sfxLevel(options, fallback) {
    var v = options && options.gain;
    if (typeof v !== 'number' || !isFinite(v)) v = fallback;
    return Math.max(0, Math.min(1, v));
  }

  function sfxTone(type, f0, f1, duration, level, delay) {
    var t = actx.currentTime + (delay || 0);
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(Math.max(20, f0), t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1 || f0), t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), t + Math.min(0.008, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain); gain.connect(sfxBus);
    osc.onended = function () { osc.disconnect(); gain.disconnect(); };
    osc.start(t); osc.stop(t + duration + 0.01);
  }

  function getSfxNoiseBuffer() {
    if (sfxNoiseBuffer) return sfxNoiseBuffer;
    var length = Math.max(1, Math.round(actx.sampleRate * 0.18));
    sfxNoiseBuffer = actx.createBuffer(1, length, actx.sampleRate);
    var data = sfxNoiseBuffer.getChannelData(0);
    for (var i = 0; i < length; i++) {
      var env = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * env;
    }
    return sfxNoiseBuffer;
  }

  function sfxNoise(type, frequency, duration, level, delay) {
    var t = actx.currentTime + (delay || 0);
    var src = actx.createBufferSource();
    var filter = actx.createBiquadFilter();
    var gain = actx.createGain();
    src.buffer = getSfxNoiseBuffer();
    filter.type = type || 'lowpass';
    filter.frequency.setValueAtTime(frequency, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter); filter.connect(gain); gain.connect(sfxBus);
    src.onended = function () { src.disconnect(); filter.disconnect(); gain.disconnect(); };
    src.start(t); src.stop(t + duration + 0.01);
  }

  var FOOTSTEP_SURFACES = {
    grass:  { filter: 620,  noise: 0.055, tone: 82 },
    dirt:   { filter: 900,  noise: 0.065, tone: 98 },
    road:   { filter: 1750, noise: 0.040, tone: 145 },
    wood:   { filter: 1250, noise: 0.035, tone: 205 },
    carpet: { filter: 430,  noise: 0.038, tone: 72 },
    tile:   { filter: 2100, noise: 0.030, tone: 180 }
  };

  function footstepSurface(surface) {
    if (FOOTSTEP_SURFACES[surface]) return FOOTSTEP_SURFACES[surface];
    if (surface === '.' || surface === ',' || surface === 'g') return FOOTSTEP_SURFACES.grass;
    if (surface === 'p') return FOOTSTEP_SURFACES.dirt;
    if (surface === 'r' || surface === '=' || surface === '-') return FOOTSTEP_SURFACES.road;
    if (surface === 'f' || surface === 'D' || surface === 'C') return FOOTSTEP_SURFACES.wood;
    if (surface === 'c' || surface === 'Z') return FOOTSTEP_SURFACES.carpet;
    return FOOTSTEP_SURFACES.tile;
  }

  function playSfx(name, options) {
    options = options || {};
    if (!sfxReady()) return false; // prima del gesto utente: silenzio, mai side effect
    var now = actx.currentTime;
    var gap = name === 'footstep' ? 0.09 : (name === 'page' ? 0.025 : 0.045);
    if (lastSfxAt[name] != null && now - lastSfxAt[name] < gap) return false;
    var level = sfxLevel(options, 0.12);
    if (level <= 0) return false;
    lastSfxAt[name] = now;

    if (name === 'footstep') {
      var foot = footstepSurface(options.surface);
      sfxNoise('lowpass', foot.filter, 0.065, foot.noise * level / 0.12);
      sfxTone('sine', foot.tone, foot.tone * 0.72, 0.055, 0.026 * level / 0.12);
    } else if (name === 'dialogue') {
      sfxTone('triangle', 520, 430, 0.045, 0.035 * level / 0.12);
    } else if (name === 'page') {
      sfxTone('sine', 760, 620, 0.028, 0.025 * level / 0.12);
    } else if (name === 'menu_open') {
      sfxTone('triangle', 360, 510, 0.055, 0.035 * level / 0.12);
      sfxTone('triangle', 510, 650, 0.055, 0.028 * level / 0.12, 0.045);
    } else if (name === 'menu_close') {
      sfxTone('triangle', 560, 330, 0.075, 0.035 * level / 0.12);
    } else if (name === 'interact') {
      sfxTone('triangle', 280, 430, 0.085, 0.045 * level / 0.12);
    } else if (name === 'blocked') {
      sfxTone('square', 145, 112, 0.13, 0.025 * level / 0.12);
      sfxNoise('lowpass', 380, 0.11, 0.024 * level / 0.12);
    } else if (name === 'door') {
      sfxNoise('lowpass', 780, 0.16, 0.055 * level / 0.12);
      sfxTone('sine', 115, 72, 0.15, 0.04 * level / 0.12);
    } else if (name === 'acquire') {
      sfxTone('sine', 520, 650, 0.10, 0.04 * level / 0.12);
      sfxTone('sine', 720, 900, 0.14, 0.035 * level / 0.12, 0.075);
    } else {
      delete lastSfxAt[name];
      return false;
    }
    return true;
  }

  /* ================== voci (fabbrica di sintesi, tutta a oscillatori) ================== */

  // aggancia un gruppo di oscillatori a un nodo somma; alla fine dell'ultimo
  // oscillatore scollega tutto (nessuna fuga di nodi/oscillatori).
  function makeVoice(dest) {
    var sum = actx.createGain();
    sum.connect(dest);
    var pending = 0;
    var extra = [];
    function addExtra(node) { extra.push(node); }
    function track(osc, node) {
      pending++;
      osc.onended = function () {
        osc.disconnect();
        if (node) node.disconnect();
        pending--;
        if (pending <= 0) {
          sum.disconnect();
          for (var i = 0; i < extra.length; i++) extra[i].disconnect();
        }
      };
    }
    return { sum: sum, track: track, addExtra: addExtra };
  }

  // rhodes — piano elettrico: fondamentale + ottava superiore debole + "tine"
  // ad attacco rapido che decade subito; attacco percussivo, coda lunga.
  function rhodes(dest, f, t, dur, vel) {
    vel = vel || 0.6;
    var v = makeVoice(dest);
    var atk = 0.008;

    var o1 = actx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
    var o2 = actx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
    var o3 = actx.createOscillator(); o3.type = 'sine'; o3.frequency.value = f * 4;

    var g1 = actx.createGain(), g2 = actx.createGain(), g3 = actx.createGain();
    o1.connect(g1); g1.connect(v.sum); v.addExtra(g1);
    o2.connect(g2); g2.connect(v.sum); v.addExtra(g2);
    o3.connect(g3); g3.connect(v.sum); v.addExtra(g3);

    g1.gain.setValueAtTime(0.0001, t);
    g1.gain.linearRampToValueAtTime(vel, t + atk);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.linearRampToValueAtTime(vel * 0.25, t + atk);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.8);

    g3.gain.setValueAtTime(0.0001, t);
    g3.gain.linearRampToValueAtTime(vel * 0.5, t + atk * 0.5);
    g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); // il "tine": decade quasi subito

    var stopMain = t + dur + 0.1, stopTine = t + 0.3;
    o1.start(t); o1.stop(stopMain); v.track(o1, null);
    o2.start(t); o2.stop(stopMain); v.track(o2, null);
    o3.start(t); o3.stop(stopTine); v.track(o3, null);
  }

  // pad — 3 oscillatori leggermente disaccordati per nota, filtro passa-basso
  // con sweep lento, attacco e rilascio lunghi. opts opzionale: {attack,
  // release, vibrato:{rate,depth}} usato dal cue "lodge" per gli swell.
  function pad(dest, noteFreqs, t, dur, vel, opts) {
    vel = vel || 0.45;
    opts = opts || {};
    var attack = opts.attack || 1.8;
    var release = opts.release || 2.2;
    var v = makeVoice(dest);

    var lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(700, t);
    lp.frequency.linearRampToValueAtTime(2400, t + dur * 0.7);
    lp.frequency.linearRampToValueAtTime(900, t + dur + release);
    lp.connect(v.sum); v.addExtra(lp);

    var env = actx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vel, t + attack);
    env.gain.setValueAtTime(vel, t + dur); // sostiene fino al rilascio
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
    env.connect(lp); v.addExtra(env);

    var lfoGain = null;
    if (opts.vibrato) {
      var lfo = actx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = opts.vibrato.rate;
      lfoGain = actx.createGain(); lfoGain.gain.value = opts.vibrato.depth; // cent
      lfo.connect(lfoGain);
      var stopVib = t + dur + release + 0.1;
      lfo.start(t); lfo.stop(stopVib); v.track(lfo, lfoGain);
    }

    var detunes = [-7, 0, 7]; // leggero disaccordo per il corpo del pad
    var types = ['sawtooth', 'triangle', 'sawtooth'];
    var stopT = t + dur + release + 0.1;
    for (var i = 0; i < noteFreqs.length; i++) {
      for (var k = 0; k < detunes.length; k++) {
        var o = actx.createOscillator();
        o.type = types[k];
        o.frequency.value = noteFreqs[i];
        o.detune.value = detunes[k];
        if (lfoGain) lfoGain.connect(o.detune); // vibrato ampio (solo lodge)
        o.connect(env);
        o.start(t); o.stop(stopT);
        v.track(o, null);
      }
    }
  }

  // bass — sine + triangle leggermente disaccordato, attacco morbido, un'ottava
  // sotto la fondamentale dell'accordo.
  function bass(dest, f, t, dur, vel) {
    vel = vel || 0.5;
    var v = makeVoice(dest);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(v.sum); v.addExtra(g);

    var o1 = actx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
    var o2 = actx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f; o2.detune.value = -4;
    o1.connect(g); o2.connect(g);

    var stopT = t + dur + 0.1;
    o1.start(t); o1.stop(stopT); v.track(o1, null);
    o2.start(t); o2.stop(stopT); v.track(o2, null);
  }

  // bell — sine + parziale inarmonico, decadimento lungo, per accenti radi.
  function bell(dest, f, t, dur, vel) {
    vel = vel || 0.35;
    var v = makeVoice(dest);

    var g1 = actx.createGain(), g2 = actx.createGain();
    g1.gain.setValueAtTime(vel, t);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g2.gain.setValueAtTime(vel * 0.35, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.6);
    g1.connect(v.sum); v.addExtra(g1);
    g2.connect(v.sum); v.addExtra(g2);

    var o1 = actx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
    var o2 = actx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.756; // parziale inarmonico tipico delle campane
    o1.connect(g1); o2.connect(g2);

    var stop1 = t + dur + 0.1, stop2 = t + dur * 0.6 + 0.1;
    o1.start(t); o1.stop(stop1); v.track(o1, null);
    o2.start(t); o2.stop(stop2); v.track(o2, null);
  }

  function playEvent(ev, t, dur, dest) {
    if (ev.voice === 'pad') pad(dest, freqs(ev.notes), t, dur, ev.vel, ev.opts);
    else if (ev.voice === 'bass') bass(dest, freq(ev.notes[0]), t, dur, ev.vel);
    else if (ev.voice === 'rhodes') rhodes(dest, freq(ev.notes[0]), t, dur, ev.vel);
    else if (ev.voice === 'bell') bell(dest, freq(ev.notes[0]), t, dur, ev.vel);
  }

  /* ================== scheduler (lookahead su AudioContext time) ================== */

  var SCHED_INTERVAL_MS = 25;
  var LOOKAHEAD_SEC = 0.15;
  var FADE_TIME = 1.5; // dissolvenza incrociata tra brani

  var players = []; // brani attivi (durante il crossfade ce ne sono due)
  var activeCueName = null;

  function createPlayer(cue, startTime) {
    var g = actx.createGain();
    g.gain.value = 0;
    g.connect(bus);
    return {
      gainNode: g,
      events: cue.events,
      idx: 0,
      loopStart: startTime,
      secPerBeat: 60 / cue.bpm,
      loopBeats: cue.loopBeats
    };
  }

  function switchCue(name) {
    var now = actx.currentTime;
    var i;
    for (i = 0; i < players.length; i++) fadeOutAndDrop(players[i], now);
    players = [];

    var p = createPlayer(CUES[name], now);
    p.gainNode.gain.setValueAtTime(0, now);
    p.gainNode.gain.linearRampToValueAtTime(1, now + FADE_TIME);
    players.push(p);
    activeCueName = name;
  }

  function fadeOutAndDrop(p, now) {
    p.gainNode.gain.cancelScheduledValues(now);
    p.gainNode.gain.setValueAtTime(p.gainNode.gain.value, now);
    p.gainNode.gain.linearRampToValueAtTime(0, now + FADE_TIME);
    setTimeout(function () { p.gainNode.disconnect(); }, (FADE_TIME + 0.2) * 1000);
  }

  function schedulerTick() {
    if (!actx) return;
    var now = actx.currentTime;
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      var ev = p.events[p.idx];
      while (p.loopStart + ev.t * p.secPerBeat < now + LOOKAHEAD_SEC) {
        var startT = p.loopStart + ev.t * p.secPerBeat;
        var durSec = ev.dur * p.secPerBeat;
        playEvent(ev, startT, durSec, p.gainNode);
        p.idx++;
        if (p.idx >= p.events.length) { p.idx = 0; p.loopStart += p.loopBeats * p.secPerBeat; }
        ev = p.events[p.idx];
      }
    }
  }
  setInterval(schedulerTick, SCHED_INTERVAL_MS); // no-op finché actx non esiste

  /* ================== stato di gioco -> brano da riprodurre ================== */

  var CUE_BY_MAPID = {
    town: 'town', traincar: 'town',
    sheriff: 'interior', palmer: 'interior', diner: 'interior',
    hotel_gn: 'interior', hospital: 'interior', oej: 'interior', roadhouse: 'interior',
    woods: 'woods',
    redroom: 'lodge'
  };

  function desiredCueName() {
    var st = GAME.Engine && GAME.Engine.state;
    if (!st) return 'title';
    if (st.mode === 'title' || st.mode === 'intro') return 'title';
    if (st.mode === 'end') return 'lodge';
    return CUE_BY_MAPID[st.mapId] || 'town';
  }

  setInterval(function () {
    if (!actx) return;
    var name = desiredCueName();
    if (name !== activeCueName) switchCue(name);
  }, 300);

  /* ================== volume, mute, gesto iniziale ================== */

  function applyVolumeState(animate) {
    if (!master) return;
    var now = actx.currentTime;
    var target = muted ? 0 : targetVolume;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target, now + (animate ? 0.3 : 0));
  }

  function toggleMute() {
    muted = !muted;
    try { window.localStorage.setItem('tp_mute', muted ? '1' : '0'); } catch (e) { /* niente storage: pace' */ }
    applyVolumeState(true);
    updateMuteButton();
  }

  function setVolume(v) {
    targetVolume = Math.max(0, Math.min(1, v));
    if (!muted) applyVolumeState(true);
  }

  function isMuted() { return muted; }

  GAME.Audio = {
    toggleMute: toggleMute, setVolume: setVolume, isMuted: isMuted,
    playSfx: playSfx,
    // diagnostica: stato del contesto ('off' finche' non c'e' gesto utente) e brano in corso
    state: function () { return actx ? actx.state : 'off'; },
    cue: function () { return activeCueName; }
  };

  function ensureContext() {
    if (actx) return;
    var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    try { actx = new AudioContextCtor(); } catch (e) { actx = null; return; }
    buildGraph();
    switchCue(desiredCueName());
  }

  // I listener restano finche' il contesto non e' davvero 'running': su iOS
  // Safari (e quando il gesto non conferisce user-activation) il primo
  // resume() puo' fallire silenziosamente — riprovando a ogni gesto la musica
  // parte comunque, invece di restare muta per sempre.
  function releaseGestureHooks() {
    window.removeEventListener('keydown', onFirstGesture);
    window.removeEventListener('pointerdown', onFirstGesture);
    window.removeEventListener('touchstart', onFirstGesture);
  }

  function onFirstGesture() {
    ensureContext();
    if (!actx) return; // browser senza WebAudio: il gioco resta pienamente giocabile
    if (actx.state === 'running') { releaseGestureHooks(); return; }
    var p = actx.resume();
    if (p && p.then) {
      p.then(function () { if (actx.state === 'running') releaseGestureHooks(); },
             function () { /* riproveremo al prossimo gesto */ });
    } else if (actx.state === 'running') {
      releaseGestureHooks();
    }
  }
  window.addEventListener('keydown', onFirstGesture);
  window.addEventListener('pointerdown', onFirstGesture);
  window.addEventListener('touchstart', onFirstGesture);

  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyM') toggleMute();
  });

  /* ================== pulsante audio, su touch e su desktop ================== */
  /* Un vero <button>: raggiungibile da tastiera e letto dagli screen reader,
   * con lo stato premuto; su desktop ricorda il tasto M (audit 2026-09-23). */

  var muteBtn = null;

  function updateMuteButton() {
    if (!muteBtn) return;
    muteBtn.textContent = muted ? '✕' : '♪';
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', muted ? 'Riattiva audio' : 'Disattiva audio');
  }

  function buildMuteButton() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Audio (M)';
    btn.textContent = muted ? '✕' : '♪';
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.setAttribute('aria-label', muted ? 'Riattiva audio' : 'Disattiva audio');
    var style = btn.style;
    style.margin = '0'; style.padding = '0'; style.lineHeight = '1'; style.appearance = 'none'; style.cursor = 'pointer';
    style.position = 'fixed';
    style.right = '12px';
    style.bottom = '12px';
    style.width = '34px';
    style.height = '34px';
    style.borderRadius = '50%';
    style.background = 'rgba(0,0,0,0.35)';
    style.border = '1px solid rgba(255,255,255,0.35)';
    style.color = 'rgba(255,255,255,0.75)';
    style.fontFamily = 'sans-serif';
    style.fontSize = '15px';
    style.display = 'flex';
    style.alignItems = 'center';
    style.justifyContent = 'center';
    style.opacity = '0.55';
    style.zIndex = '9999';
    style.touchAction = 'none';
    style.userSelect = 'none';
    style.webkitUserSelect = 'none';
    style.webkitTouchCallout = 'none';
    btn.addEventListener('touchstart', function (e) { e.preventDefault(); toggleMute(); }, { passive: false });
    /* Mouse e tastiera: commuta, poi restituisce i tasti al gioco (Invio è il
     * tasto A e non deve continuare a commutare l'audio). */
    btn.addEventListener('click', function () { toggleMute(); btn.blur(); });
    btn.addEventListener('keydown', function (e) { e.stopPropagation(); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    return btn;
  }

  function setupMuteButton() {
    muteBtn = buildMuteButton();
    /* Su desktop in alto a destra: in basso copriva l'angolo dei dialoghi. */
    var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!isTouch) { muteBtn.style.bottom = 'auto'; muteBtn.style.top = '12px'; }
    document.body.appendChild(muteBtn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMuteButton);
  } else {
    setupMuteButton();
  }
})();
