/* scene-objects.gen.js — GENERATED from world/{scene-objects,narrative-targets}.json by test/gen-world-data.js.
 * DO NOT EDIT BY HAND. Change world/scene-objects.json and run `node test/gen-world-data.js`.
 * GAME.WorldData.sceneObjects is the only source of scene objects and interact keys: js/glue.js reads it and
 * refuses a js/maps.js map that still carries objects/interact. Deep-frozen; glue copies every entry.
 */
(function () {
  'use strict';
  var G = (typeof window !== "undefined") ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  function freezeDeep(v) {
    if (v && typeof v === "object") { Object.freeze(v); for (var k in v) freezeDeep(v[k]); }
    return v;
  }
  var scenes =
{
      "arrival": {
        "objects": [],
        "interact": {}
      },
      "town": {
        "objects": [
          {
            "sourceId": "waterfall",
            "type": "landmark",
            "kind": "waterfall",
            "x": 1,
            "y": 0,
            "w": 5,
            "h": 6,
            "dialogue": "landmark_waterfall"
          },
          {
            "sourceId": "cemetery",
            "type": "landmark",
            "kind": "cemetery",
            "x": 48,
            "y": 21,
            "w": 6,
            "h": 4,
            "dialogue": "landmark_cemetery"
          },
          {
            "sourceId": "tracks",
            "type": "landmark",
            "kind": "tracks",
            "x": 53,
            "y": 1,
            "w": 2,
            "h": 33,
            "dialogue": [
              {
                "cond": "nflag:vagone_scoperto",
                "then": "landmark_tracks_vagone"
              },
              {
                "cond": [
                  "evidence:E6A_CUORE_INTERO",
                  "evidence:T_JAMES_EST"
                ],
                "then": "landmark_tracks_route"
              },
              "landmark_tracks"
            ]
          },
          {
            "sourceId": "welcome-sign",
            "type": "landmark",
            "kind": "welcomesign",
            "x": 30,
            "y": 30,
            "dialogue": "sign_town"
          }
        ],
        "interact": {
          "30,30": "cartello",
          "15,28": "lago_riva",
          "50,22": "tomba_laura"
        }
      },
      "sheriff": {
        "objects": [],
        "interact": {}
      },
      "palmer": {
        "objects": [],
        "interact": {
          "6,1": "cameraLaura"
        }
      },
      "room_315": {
        "objects": [],
        "interact": {
          "13,3": "specchio315",
          "1,5": "letto_315",
          "2,5": "letto_315",
          "3,5": "letto_315",
          "8,3": "scrivania_315"
        }
      },
      "hotel_gn": {
        "objects": [],
        "interact": {}
      },
      "hospital": {
        "objects": [],
        "interact": {
          "3,5": "ronette_letto"
        }
      },
      "diner": {
        "objects": [],
        "interact": {}
      },
      "woods": {
        "objects": [],
        "interact": {
          "14,12": "olio",
          "11,16": "cartelloBosco"
        }
      },
      "redroom": {
        "objects": [],
        "interact": {}
      },
      "traincar": {
        "objects": [],
        "interact": {
          "4,6": "sign_ponte",
          "20,2": "sign_oej",
          "13,6": "mucchio_terra",
          "13,5": "anello_interact"
        }
      },
      "oej": {
        "objects": [],
        "interact": {}
      },
      "roadhouse": {
        "objects": [],
        "interact": {}
      }
    };
  GAME.WorldData = GAME.WorldData || {};
  GAME.WorldData.sceneObjects = freezeDeep({ version: 1, scenes: scenes });
  GAME.WorldData.narrativeTargets = freezeDeep({
  "traincar": {
    "bridge_rail": {
      "x": 4,
      "y": 6,
      "kind": "landmark"
    },
    "sign_oej": {
      "x": 20,
      "y": 2,
      "kind": "sign"
    },
    "mound": {
      "x": 13,
      "y": 6,
      "kind": "object"
    },
    "ring": {
      "x": 13,
      "y": 5,
      "kind": "object"
    },
    "scene_center": {
      "x": 12,
      "y": 5,
      "kind": "landmark"
    },
    "traincar_entrance": {
      "x": 13,
      "y": 7,
      "kind": "landmark"
    },
    "stove": {
      "x": 12,
      "y": 3,
      "kind": "object"
    },
    "cards": {
      "x": 10,
      "y": 6,
      "kind": "object"
    },
    "tracks_north": {
      "x": 21,
      "y": 2,
      "kind": "landmark"
    }
  },
  "hospital": {
    "night_register": {
      "x": 13,
      "y": 8,
      "kind": "object"
    }
  },
  "roadhouse": {
    "roadhouse_phone": {
      "x": 8,
      "y": 5,
      "kind": "object"
    }
  },
  "town": {
    "town_crossroads": {
      "x": 47,
      "y": 30,
      "kind": "landmark"
    },
    "lago_maddy": {
      "x": 15,
      "y": 28,
      "kind": "landmark"
    }
  },
  "palmer": {
    "palmer_entrance": {
      "x": 8,
      "y": 10,
      "kind": "landmark"
    }
  }
});
}());
