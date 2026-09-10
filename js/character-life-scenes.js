/* character-life-scenes.js — authored Character Life profiles by scene role.
 * Registrazione unica per la mappa 'sheriff': gli id coincidono con gli id
 * NPC di js/glue.js, che sono la chiave con cui engine.js risolve il profilo
 * (GAME.CharacterActivity.actorPose(npc.id)). */
(function () {
  'use strict';

  var GAME = window.GAME;
  var trumanBlinkDown = Array(9).fill('truman.blink.down');
  var trumanBlinkSide = Array(9).fill('truman.blink.right');
  var lucyBlinkDown = Array(9).fill('lucy.blink.down');
  var lucyTelephoneDown = Array(9).fill('lucy.telephone.down');
  var andyBlinkDown = Array(9).fill('andy.blink.down');
  var andyNoteDown = Array(9).fill('andy.note.down');

  GAME.CharacterActivity.registerActors('sheriff', [
    {
      id: 'truman',
      focusDirection: 'down',
      lockFocus: true,
      behaviors: [
        {
          id: 'blink',
          category: 'idle',
          animation: 'blink',
          delay: [12000, 38000],
          duration: [100, 160],
          variants: 1,
          directions: ['down', 'left', 'right'],
          frames: {
            down: trumanBlinkDown,
            left: trumanBlinkSide,
            right: trumanBlinkSide
          }
        },
        {
          id: 'read-file',
          category: 'contextual',
          animation: 'reading',
          delay: [32000, 65000],
          duration: [2400, 3400],
          variants: 1,
          directions: ['down'],
          frames: {
            down: [
              'truman.reading.fileRaised',
              'truman.reading.fileRaised',
              'truman.reading.eyesLowered',
              'truman.reading.eyesLowered',
              'truman.reading.eyesLowered',
              'truman.reading.eyesLowered',
              'truman.reading.fileRaised',
              'truman.reading.fileRaised',
              'truman.reading.fileRaised'
            ]
          }
        }
      ]
    },
    {
      id: 'lucy',
      focusDirection: 'down',
      lockFocus: true,
      behaviors: [
        {
          id: 'blink',
          category: 'idle',
          animation: 'blink',
          delay: [16000, 34000],
          duration: [110, 150],
          variants: 1,
          directions: ['down'],
          frames: { down: lucyBlinkDown }
        },
        {
          id: 'telephone',
          category: 'contextual',
          animation: 'telephone',
          delay: [26000, 44000],
          duration: [2200, 3200],
          variants: 1,
          directions: ['down'],
          frames: { down: lucyTelephoneDown }
        }
      ]
    },
    {
      id: 'andy',
      focusDirection: 'down',
      lockFocus: true,
      behaviors: [
        {
          id: 'blink',
          category: 'idle',
          animation: 'blink',
          delay: [23000, 47000],
          duration: [100, 160],
          variants: 1,
          directions: ['down'],
          frames: { down: andyBlinkDown }
        },
        {
          id: 'check-note',
          category: 'contextual',
          animation: 'check-note',
          delay: [48000, 78000],
          duration: [1300, 1900],
          variants: 1,
          directions: ['down'],
          frames: { down: andyNoteDown }
        }
      ]
    }
  ]);
}());
