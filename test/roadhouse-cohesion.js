/* One-frame evidence harness. It composes existing production painters and
 * atomic-kit pixels at native scale; it does not replace Roadhouse scene art. */
(function () {
  'use strict';

  var canvas = document.getElementById('cohesion');
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function fail(error) {
    document.body.dataset.error = error && error.message ? error.message : String(error);
    document.title = 'TP-COHESION-ERROR';
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.decoding = 'sync';
      image.onload = function () { resolve(image); };
      image.onerror = function () { reject(new Error('image failed: ' + src)); };
      image.src = src;
    });
  }

  function currentRoadhouseFloor() {
    var p = GAME.RoadhouseArt.palette;
    var row, col, x, y, worldRow, worldCol;
    ctx.fillStyle = p.floorDeep;
    ctx.fillRect(0, 0, 160, 144);
    /* Exact checker/grain grammar from roadhouse-art.js, cropped from its
     * open aisle (world origin 48,32) into a native 160x144 evidence frame. */
    for (row = 0; row < 18; row++) {
      y = row * 8;
      worldRow = row + 4;
      for (col = 0; col < 20; col++) {
        x = col * 8;
        worldCol = col + 6;
        ctx.fillStyle = ((worldRow + worldCol) & 1) ? p.floorDark : p.floor;
        ctx.fillRect(x, y, 8, 8);
        if (((worldRow * 5 + worldCol * 3) & 7) === 0) {
          ctx.fillStyle = p.floorMid;
          ctx.fillRect(x + 2, y + 5, 4, 1);
        }
      }
    }
  }

  function propById(manifest, id) {
    for (var i = 0; i < manifest.props.length; i++) {
      if (manifest.props[i].id === id) return manifest.props[i];
    }
    throw new Error('missing prop: ' + id);
  }

  function drawProp(atlas, prop, x, y) {
    var f = prop.frame;
    /* Destination dimensions equal source dimensions: true runtime scale. */
    ctx.drawImage(atlas, f[0], f[1], f[2], f[3], x, y, f[2], f[3]);
  }

  Promise.all([
    fetch('../assets/prototypes/direct-reference/roadhouse-props.prototype.json').then(function (r) {
      if (!r.ok) throw new Error('manifest HTTP ' + r.status);
      return r.json();
    }),
    GAME.Sprites.castReady
  ]).then(function (values) {
    var manifest = values[0];
    if (GAME.Retro2D.castRenderer.id !== 'heartgold-atlas-r116') {
      throw new Error('wrong cast renderer: ' + GAME.Retro2D.castRenderer.id);
    }
    return loadImage('../' + manifest.atlas).then(function (atlas) {
      currentRoadhouseFloor();

      var chair = propById(manifest, 'roadhouse.chair.red');
      var table = propById(manifest, 'roadhouse.table.round');
      var candle = propById(manifest, 'roadhouse.candle.brass');
      var maddy = GAME.Sprites.CHARS.maddy;

      /* Rear-to-front ordering grounds seated cast in chair and behind table. */
      drawProp(atlas, chair, 47, 72);
      GAME.Retro2D.interiorKit.seatedGuest(ctx, 48, 69, {
        hair: maddy.hair,
        hairHi: '#765044',
        skin: maddy.skin,
        coat: maddy.shirt,
        coatHi: '#b66a7d',
        coatShadow: '#653347',
        hairStyle: maddy.hairStyle,
        seat: 'left'
      }, -1);
      drawProp(atlas, table, 68, 87);
      drawProp(atlas, candle, 74, 79);

      /* Production atlas, idle right-facing frame, native 24x24 cell. */
      GAME.Sprites.drawChar(
        ctx, 103, 84, GAME.Sprites.CHARS.cooper,
        'left', 0, 1, false, false, 0, { mapId: 'roadhouse' }
      );

      document.body.dataset.nativeFrame = canvas.toDataURL('image/png');
      document.body.dataset.provenance = JSON.stringify({
        canvas: [160, 144],
        propScale: 1,
        props: [chair.id, table.id, candle.id],
        standingCast: 'cooper',
        seatedCast: 'maddy',
        castRenderer: GAME.Retro2D.castRenderer.id
      });
      document.title = 'TP-COHESION-READY';
    });
  }).catch(fail);
})();
