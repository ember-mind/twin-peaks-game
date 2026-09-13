/* world-connections.gen.js — GENERATED from world/connections.json by test/gen-world-data.js.
 * DO NOT EDIT BY HAND. Change world/connections.json and run `node test/gen-world-data.js`.
 * GAME.WorldData is the canonical runtime binding of the connection registry; it is deep-frozen so
 * the World Builder can only mutate drafts, never this array. The stale-guard test fails if this file
 * drifts from its source.
 */
(function () {
  'use strict';
  var G = (typeof window !== "undefined") ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  function freezeDeep(v) {
    if (v && typeof v === "object") { Object.freeze(v); for (var k in v) freezeDeep(v[k]); }
    return v;
  }
  var connections =
[
      {
        "id": "double-r-front-entrance",
        "a": {
          "scene": "double_r_exterior_prototype",
          "triggers": [
            [
              6,
              6
            ],
            [
              7,
              6
            ]
          ],
          "spawn": {
            "tx": 6,
            "ty": 7,
            "dir": "down"
          }
        },
        "b": {
          "scene": "diner",
          "triggers": [
            [
              6,
              9
            ],
            [
              7,
              9
            ]
          ],
          "spawn": {
            "tx": 6,
            "ty": 8,
            "dir": "up"
          },
          "departureReaction": "front-door"
        }
      },
      {
        "id": "great-northern-room-315-hall",
        "a": {
          "scene": "room_315",
          "triggers": [
            [
              7,
              11
            ]
          ],
          "spawn": {
            "tx": 7,
            "ty": 10,
            "dir": "up"
          }
        },
        "b": {
          "scene": "hotel_gn",
          "triggers": [
            [
              14,
              1
            ]
          ],
          "spawn": {
            "tx": 14,
            "ty": 2,
            "dir": "down"
          }
        }
      },
      {
        "id": "sheriffs-station-front-entrance",
        "a": {
          "scene": "sheriffs_station_exterior",
          "triggers": [
            [
              7,
              6
            ],
            [
              8,
              6
            ]
          ],
          "spawn": {
            "tx": 7,
            "ty": 7,
            "dir": "down"
          }
        },
        "b": {
          "scene": "sheriff",
          "triggers": [
            [
              7,
              11
            ],
            [
              8,
              11
            ]
          ],
          "spawn": {
            "tx": 7,
            "ty": 10,
            "dir": "up"
          }
        }
      },
      {
        "id": "town-double-r-lot",
        "a": {
          "scene": "town",
          "triggers": [
            [
              42,
              20
            ]
          ],
          "spawn": {
            "tx": 42,
            "ty": 21,
            "dir": "down"
          }
        },
        "b": {
          "scene": "double_r_exterior_prototype",
          "triggers": [
            [
              2,
              11
            ],
            [
              3,
              11
            ],
            [
              4,
              11
            ],
            [
              5,
              11
            ],
            [
              6,
              11
            ],
            [
              7,
              11
            ],
            [
              8,
              11
            ],
            [
              9,
              11
            ],
            [
              10,
              11
            ],
            [
              11,
              11
            ],
            [
              12,
              11
            ],
            [
              13,
              11
            ]
          ],
          "spawn": {
            "tx": 6,
            "ty": 10,
            "dir": "up"
          }
        }
      },
      {
        "id": "town-sheriffs-station-lot",
        "a": {
          "scene": "town",
          "triggers": [
            [
              12,
              20
            ]
          ],
          "spawn": {
            "tx": 12,
            "ty": 21,
            "dir": "down"
          }
        },
        "b": {
          "scene": "sheriffs_station_exterior",
          "triggers": [
            [
              2,
              11
            ],
            [
              3,
              11
            ],
            [
              4,
              11
            ],
            [
              5,
              11
            ],
            [
              6,
              11
            ],
            [
              7,
              11
            ],
            [
              8,
              11
            ],
            [
              9,
              11
            ],
            [
              10,
              11
            ],
            [
              11,
              11
            ],
            [
              12,
              11
            ],
            [
              13,
              11
            ]
          ],
          "spawn": {
            "tx": 7,
            "ty": 10,
            "dir": "up"
          }
        }
      },
      {
        "id": "town-traincar-east",
        "a": {
          "scene": "town",
          "triggers": [
            [
              22,
              0
            ]
          ],
          "spawn": {
            "tx": 22,
            "ty": 1,
            "dir": "down"
          },
          "door": {
            "needsFlag": "atto3",
            "blockedMsg": "train_bloccato"
          }
        },
        "b": {
          "scene": "traincar",
          "triggers": [
            [
              14,
              5
            ],
            [
              15,
              5
            ]
          ],
          "spawn": {
            "tx": 14,
            "ty": 6,
            "dir": "up"
          }
        }
      },
      {
        "id": "traincar-oej-entrance",
        "a": {
          "scene": "traincar",
          "triggers": [
            [
              21,
              0
            ]
          ],
          "spawn": {
            "tx": 21,
            "ty": 1,
            "dir": "down"
          },
          "door": {
            "needsFlag": "east_route_confirmed",
            "blockedMsg": "oej_bloccato"
          }
        },
        "b": {
          "scene": "oej",
          "triggers": [
            [
              13,
              6
            ],
            [
              14,
              6
            ]
          ],
          "spawn": {
            "tx": 13,
            "ty": 7,
            "dir": "up"
          }
        }
      }
    ];
  GAME.WorldData = GAME.WorldData || {};
  GAME.WorldData.version = 1;
  GAME.WorldData.connections = freezeDeep(connections);
}());
