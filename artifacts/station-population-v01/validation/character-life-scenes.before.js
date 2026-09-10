/* character-life-scenes.js — authored Character Life profiles by scene role. */
(function () {
  'use strict';

  var GAME = window.GAME;
  var blinkDown = Array(9).fill('truman.blink.down');
  var blinkSide = Array(9).fill('truman.blink.right');

  GAME.CharacterActivity.registerActors('sheriffs_station_main_interior', [
    {
      id: 'station-truman',
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
            down: blinkDown,
            left: blinkSide,
            right: blinkSide
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
    }
  ]);
}());
