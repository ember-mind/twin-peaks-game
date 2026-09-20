/* ember-interior-kit.js — Ember Engine: the interior room kit.
 *
 * Native-pixel furniture, floors, walls, light and lettering for a room seen
 * from inside, and the registry of rooms composed out of them. Moved here
 * unchanged from the Twin Peaks renderer (js/retro-authored.js). The Double R
 * is still composed there, because it is that game's room, out of these same
 * pieces; Living Town's café registers a composition of its own.
 *
 * Game-independent by construction: no GAME namespace, no map ids, no story
 * state. What a host owns it hands over:
 *   activityOf()         -> the host's seated-gesture provider, or null
 *   setDefaultSignage(s) -> what a sign says when a piece is given none
 *   setMonogram(text)    -> the house mark painted on menus during a pass
 * Needs engine/ember-pixel.js.
 */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : global;
  var EMBER = root.EMBER = root.EMBER || {};
  if (!EMBER.Pixel && typeof require === 'function') require('./ember-pixel.js');
  if (!EMBER.Pixel) throw new Error('ember-interior-kit.js needs engine/ember-pixel.js loaded first');
  var K = EMBER.InteriorKit = EMBER.InteriorKit || {};
  var PX = EMBER.Pixel, R = PX.rect;
  var TOWN_FONT_5X7 = PX.font5x7, TOWN_FONT_5X7_EXT = PX.font5x7Ext, UNSUPPORTED_5X7 = PX.missing5x7,
      unsupportedGlyphs = PX.unsupportedGlyphs, kitGlyph = PX.glyph, kitUnsupported = PX.unsupported,
      interiorSignWord = PX.signWord, interiorWord = PX.word, townMicroWord = PX.microWord;

  var houseMonogram = '';
  var defaultSignage = null;
  K.activityOf = K.activityOf || null;
  function activity() { return K.activityOf ? K.activityOf() : null; }
  K.setMonogram = function (text) { houseMonogram = text || ''; };
  K.setDefaultSignage = function (signage) { defaultSignage = signage; };

  /* Pieces shared by both kinds of room letter themselves the way their room
   * does: the Double R with the town font as ever, a composed room with the
   * complete one. */
  var composedRoomPass = false;
  function roomWord(g, value, x, y, color) {
    return composedRoomPass ? interiorWord(g, value, x, y, color) : townMicroWord(g, value, x, y, color);
  }

  /* Shared interior kit: native pixel coordinates, world-space anchors.
   * Furniture rises above its existing collision footprint; decorative wall
   * pieces never introduce invisible obstacles. Palettes are per room. */
  var INTERIOR_MATERIALS = {
    diner: { ink:'#292b26', cream:'#f4e6c8', creamShade:'#cfbc92', gold:'#e9bd5d',
      red:'#8c2f3e', redHi:'#c45a61', redLight:'#e28b80', redDark:'#501f29',
      wood:'#5b3a28', woodHi:'#946345', woodLight:'#b88759', woodDark:'#35271f',
      green:'#223b2f', leaf:'#567345', leafHi:'#879452', metal:'#81918b',
      metalHi:'#d9dfc9',
      /* Checker. The board calls for a warm cream/red floor; the round-1
       * grey-green read cold and muddy against the wood. A lightening pass
       * washed the floor out on 2026-09-19 and was reverted, so these move
       * hue at matched luma: tile 136 -> 133, tileShade 128 -> 122,
       * floorLight 188 -> 188.5, floorShade 176 -> 175.7. */
      tile:'#b9706a', tileShade:'#ab6660', floorLight:'#cebb96', floorShade:'#c2ae89' }
  };
  function interiorContact(g,x,y,w,p) {
    // Three crisp native rows: diffuse footprint, tight occlusion, tapered edge.
    R(g,x+1,y,w-2,1,'rgba(41,43,38,.28)');
    R(g,x,y+1,w,1,'rgba(41,43,38,.36)');
    R(g,x+2,y+1,w-4,1,'rgba(53,39,31,.45)');
    R(g,x+2,y+2,w-4,1,'rgba(41,43,38,.20)');
  }
  function interiorActorLight(wx,wy,lights) {
    var px=wx+8,py=wy+7,best=0;
    (lights || [[38,22],[68,22],[188,22],[7,83],[216,83],[7,134],[216,134]]).forEach(function(l){
      var dx=px-l[0],dy=py-l[1],d=dx*dx+dy*dy;
      best=Math.max(best,d<900?.24:d<2304?.13:0);
    });
    return best;
  }
  function interiorPanel(g,x,y,w,h,p) {
    R(g,x,y,w,h,p.woodDark);
    for(var i=1;i<w-1;i+=9) {
      R(g,x+i,y+1,7,h-2,p.wood); R(g,x+i,y+1,1,h-2,p.woodHi);
      R(g,x+i+5,y+3,1,h-5,'#654632');
      if(i%27===10) R(g,x+i+2,y+8,1,5,p.woodDark);
    }
    R(g,x,y,w,2,p.woodLight); R(g,x,y+h-3,w,2,p.woodHi);
  }
  function interiorCup(g,x,y,p) {
    R(g,x,y+5,7,1,'rgba(53,39,31,.27)');
    R(g,x-1,y+4,8,1,p.metalHi); R(g,x,y,5,4,p.cream);
    R(g,x+1,y,3,1,p.woodDark); R(g,x+5,y+1,2,2,p.cream);
    R(g,x+1,y+3,3,1,p.creamShade); R(g,x+1,y+1,1,2,p.metalHi);
  }
  function interiorDinerMenu(g,x,y,p) {
    // One recurring house detail: burgundy menus with the Double R monogram.
    R(g,x,y,11,8,p.woodDark); R(g,x+1,y,9,7,p.redDark);
    R(g,x+1,y,1,7,p.redHi); interiorChalk(g,houseMonogram,x+3,y+2,p.creamShade);
  }
  function interiorTableProps(g,x,y,p,variant) {
    if(variant===3) {
      // Recently cleared: empty plate, folded napkin, one faint coffee ring.
      R(g,x+19,y+4,10,5,p.metal); R(g,x+20,y+3,8,5,p.cream);
      R(g,x+22,y+4,4,2,p.creamShade);
      R(g,x+5,y+5,5,3,p.metalHi); R(g,x+6,y+6,3,1,p.cream);
      R(g,x+32,y+4,4,1,p.creamShade); R(g,x+31,y+5,1,2,p.creamShade);
      R(g,x+35,y+5,1,2,p.creamShade); R(g,x+32,y+7,3,1,p.creamShade);
      return;
    }
    interiorDinerMenu(g,x+1,y+3,p);
    interiorCup(g,x+17,y+3,p);
    R(g,x+28,y+4,9,5,p.metal); R(g,x+29,y+3,7,5,p.cream);
    R(g,x+31,y+3,4,3,p.gold); R(g,x+32,y+4,2,1,p.redDark);
  }
  function interiorSeatedGuest(g,x,y,guest,gesture) {
    // A complete 16x20 seated pose. Tabletop intersects below the chest at row 17,
    // leaving the head, neck, shoulders and chest visible at cast scale.
    var c={ outline:'#302927', hair:guest.hair, hairHi:guest.hairHi || '#89644d',
      skin:guest.skin || '#e0b48e', skinHi:'#f0c9a1', skinShadow:'#bd876c',
      coat:guest.coat, coatHi:guest.coatHi || '#b78476', coatShadow:guest.coatShadow || '#754f4e',
      shirt:'#e9ddbb', eye:'#342c2b' };
    var pose={x:x,y:y,gesture:gesture===undefined?-1:gesture,mirror:guest.seat==='right',skin:c.skin,skinHi:c.skinHi,
      skinShadow:c.skinShadow,coat:c.coat,coatHi:c.coatHi,shirt:c.shirt};
    function P(px,py,w,h,color) { interiorPoseRect(g,pose,px,py,w,h,color); }
    // Three-quarter face turns toward the aisle. Hair wraps the far cheek.
    P(4,0,8,1,c.outline); P(2,1,12,2,c.outline);
    P(1,3,14,7,c.outline); P(3,10,10,2,c.outline);
    P(3,1,10,4,c.hair); P(4,1,7,1,c.hairHi);
    P(2,3,3,7,c.hair); P(12,3,2,3,c.hair);
    P(5,4,8,6,c.skin); P(6,4,6,2,c.skinHi);
    P(4,6,2,3,c.skinShadow); P(5,6,1,2,c.skin);
    P(6,10,6,1,c.skinShadow);
    P(7,6,1,2,c.eye); P(11,6,1,2,c.eye);
    P(13,7,1,2,c.skin); P(11,9,2,1,'#996953');
    if(guest.hairStyle==='bob') {
      P(2,5,2,7,c.hair); P(3,2,8,2,c.hair);
      P(4,2,4,1,c.hairHi); P(4,9,1,3,c.hairHi);
    } else {
      P(3,2,8,1,c.hairHi); P(3,3,6,2,c.hair);
      P(4,3,3,1,c.hairHi);
    }
    P(7,11,4,2,c.skinShadow); P(8,11,2,2,c.skin);
    // Sloped shoulders and diagonal collar follow the turned upper body.
    P(4,12,4,1,c.outline); P(3,13,10,5,c.outline);
    P(2,14,12,3,c.outline); P(4,13,8,5,c.coat);
    P(4,13,3,1,c.coatHi); P(7,13,3,1,c.shirt);
    P(8,14,3,1,c.shirt); P(9,15,2,1,c.shirt);
    P(5,14,2,3,c.coatHi); P(11,14,1,4,c.coatShadow);
    P(3,14,2,3,c.coat); P(12,14,2,2,c.coat);
    P(4,18,8,2,c.coatShadow);
    interiorSeatedHands(g,pose);
    return pose;
  }
  function interiorPoseRect(g,pose,x,y,w,h,color) {
    R(g,pose.x+(pose.mirror?16-x-w:x),pose.y+y,w,h,color);
  }
  function interiorSeatedHands(g,pose) {
    if(pose.gesture>=0 && activity() && activity().drawSip(g,pose,INTERIOR_MATERIALS.diner))return;
    // One elbow supports a horizontal forearm; the far hand rests near the rim.
    // Redraw these same arm pixels over the tabletop, never another torso.
    function P(x,y,w,h,color) { interiorPoseRect(g,pose,x,y,w,h,color); }
    P(3,16,3,2,pose.coat); P(4,17,4,2,pose.coat);
    P(4,17,3,1,pose.coatHi); P(7,17,1,2,pose.shirt);
    P(8,17,3,2,pose.skinShadow); P(8,17,3,1,pose.skinHi);
    P(12,15,2,1,pose.shirt); P(12,16,2,2,pose.skinShadow);
    P(12,16,2,1,pose.skinHi);
  }

  function interiorOccupiedTable(g,x,y,w,p,guest,gesture) {
    // The first three table rows are reserved for cuffs and resting hands.
    var propX=guest.seat==='left' ? x+w-11 : x+5;
    R(g,propX,y+4,4,6,p.ink); R(g,propX+1,y+5,2,4,p.metalHi);
    R(g,propX+1,y+6,2,1,p.metal);
    if(guest.seat==='left') {
      R(g,x+22,y+4,11,6,'#dfd4b4');
      R(g,x+23,y+5,4,1,'#7e7966'); R(g,x+28,y+5,4,1,'#7e7966');
      R(g,x+23,y+7,8,1,'#a49b7f'); R(g,x+23,y+9,6,1,'#a49b7f');
      interiorCup(g,x+7,y+5,p);
    } else {
      interiorDinerMenu(g,x+12,y+4,p);
      if(activity() && activity().sipLiftsCup(gesture)) {
        R(g,x+w-16,y+9,8,1,p.metalHi);R(g,x+w-15,y+10,7,1,'rgba(53,39,31,.27)');
      } else interiorCup(g,x+w-15,y+5,p);
    }
  }
  function interiorBooth(g,x,y,w,p,variant,guest) {
    // Base occupies the table's two solid tiles; backrest projects north.
    R(g,x+1,y+13,w,5,'rgba(30,26,20,.32)');
    interiorContact(g,x+1,y+16,w-1,p);
    R(g,x+w-1,y-9,2,25,'rgba(41,43,38,.23)');
    R(g,x,y-15,w,31,p.woodDark); R(g,x+1,y-14,w-2,28,p.redDark);
    R(g,x+2,y-15,w-4,1,p.woodLight);
    for(var i=3;i<w-3;i+=6) {
      // Rounded vertical channels roll into shadow toward the seat pocket.
      R(g,x+i,y-13,5,16,p.red); R(g,x+i+1,y-13,3,1,'#b35359');
      R(g,x+i+1,y-12,3,2,p.redHi);
      R(g,x+i,y-11,1,7,p.redHi); R(g,x+i+4,y-10,1,13,p.redDark);
      R(g,x+i,y-4,4,3,'#762b39');
      R(g,x+i+2,y-3,1,1,p.redDark);
      R(g,x+i+2,y-2,1,1,'#aa4650');
      if((i+variant)%3===0) R(g,x+i+1,y-11,2,1,'#cf7770');
    }
    // Shared upholstery, different lived light: the cleared table recedes;
    // occupied seats give pale faces a quieter, broad burgundy background.
    R(g,x+3,y-13,w-6,16,variant===3?'rgba(23,37,30,.29)':
      guest?'rgba(35,27,29,.16)':'rgba(35,27,29,.07)');
    R(g,x+2,y-1,w-4,6,p.redDark); R(g,x+3,y,w-6,3,p.red);
    R(g,x+4,y,w-8,1,p.redHi); R(g,x+2,y+5,w-4,2,p.redDark);
    R(g,x+1,y+7,w-2,2,p.woodLight);
    if(guest) {
      var seatX=guest.seat==='left'?x+8:x+w-25;
      // Contact follows the seated shoulders and hips, leaving the head clear.
      R(g,seatX+2,y-5,13,4,'rgba(41,24,28,.14)');
      R(g,seatX+4,y-1,10,2,'rgba(41,24,28,.20)');
    }
    var gesture=variant===1 && activity() ? activity().seatedFrame() : -1;
    var seatedPose=guest ? interiorSeatedGuest(g,guest.seat==='left'?x+8:x+w-25,y-16,guest,gesture) : null;
    // Broad horizontal laminate plane, a turned front lip, then a recessed base.
    R(g,x+3,y+1,w-6,13,p.woodDark);
    R(g,x+3,y+2,1,9,'#8a6548');
    R(g,x+4,y+1,1,1,'#8a6548');
    R(g,x+4,y+2,w-8,8,variant===3?'#b9ae90':guest?'#c7b187':'#e4d2a9');
    if(guest) {
      // A broad lamp-side working patch places hands, cup and face together;
      // the unoccupied half remains the same laminate in quieter light.
      var litTableX=guest.seat==='left'?x+5:x+w-25;
      R(g,litTableX,y+2,20,8,'#dfcca4');
      R(g,litTableX+(guest.seat==='left'?0:6),y+2,14,6,'#e4d2a9');
    }
    R(g,x+5,y+1,w-10,1,p.creamShade);
    R(g,x+4,y+2,1,8,p.cream); R(g,x+w-6,y+2,2,8,'#c7b187');
    R(g,x+5,y+10,w-10,1,variant===3?p.creamShade:p.cream);
    R(g,x+5,y+11,w-10,1,'#b59a72');
    // Warm reflected wood in the recess keeps the base from becoming a black bar.
    R(g,x+5,y+12,w-10,1,'#76533f');
    R(g,x+10,y+12,w-20,1,'#50392e');
    R(g,x+6,y+13,w-12,3,'#654936');
    R(g,x+10,y+13,w-20,1,'#533c30');
    R(g,x+10,y+15,w-20,1,'#573e30');
    R(g,x+7,y+13,3,3,p.woodHi); R(g,x+w-10,y+13,3,3,p.wood);
    R(g,x+7,y+13,1,3,p.woodLight);
    R(g,x+6,y+16,6,1,p.woodDark); R(g,x+w-11,y+16,6,1,p.woodDark);
    R(g,x+1,y-12,2,27,p.redHi); R(g,x+w-3,y-12,2,27,p.redDark);
    R(g,x+3,y+13,3,2,p.red); R(g,x+w-6,y+13,3,2,p.redDark);
    if(guest) interiorOccupiedTable(g,x,y,w,p,guest,gesture);
    else interiorTableProps(g,x+5,y,p,variant);
    if(seatedPose) {
      // Soft, broken contact sits directly below the resting skin and cuff.
      if(!(activity() && activity().sipLiftsCup(gesture))) {
        interiorPoseRect(g,seatedPose,5,19,2,1,'rgba(75,53,37,.10)');
        interiorPoseRect(g,seatedPose,8,19,3,1,'rgba(75,53,37,.17)');
      }
      interiorPoseRect(g,seatedPose,12,18,2,1,'rgba(75,53,37,.12)');
      interiorSeatedHands(g,seatedPose);
      interiorPoseRect(g,seatedPose,4,1,3,1,guest.hairHi);
      interiorPoseRect(g,seatedPose,4,13,2,1,guest.coatHi);
      // Small lamp-side highlights use existing warm material tones.
      interiorPoseRect(g,seatedPose,4,2,2,1,'rgba(244,230,200,.18)');
      interiorPoseRect(g,seatedPose,3,14,1,1,'rgba(244,230,200,.18)');
    }
  }
  function interiorStool(g,x,y,p) {
    interiorContact(g,x+2,y+13,12,p);
    R(g,x+3,y+12,10,2,p.ink); R(g,x+5,y+11,6,1,p.metalHi);
    R(g,x+7,y+4,3,8,p.metal); R(g,x+7,y+5,1,6,p.metalHi);
    R(g,x+2,y,12,5,p.ink); R(g,x+3,y-1,10,6,p.redDark);
    R(g,x+3,y,10,3,p.red); R(g,x+4,y,8,1,p.redHi);
    R(g,x+4,y+4,8,1,p.metalHi);
    R(g,x+8,y+6,1,4,p.ink); R(g,x+5,y+12,3,1,p.metalHi);
  }
  function interiorLamp(g,x,y,p) {
    R(g,x-7,y+5,15,15,'rgba(241,171,58,.07)');
    R(g,x-5,y+7,11,12,'rgba(255,190,79,.13)');
    R(g,x,y,1,8,p.ink); R(g,x+1,y,1,7,p.woodLight); R(g,x-3,y+8,7,1,p.gold);
    R(g,x-4,y+9,9,7,p.woodDark); R(g,x-3,y+9,7,6,p.gold);
    R(g,x-2,y+10,5,4,'#ffdc82'); R(g,x-1,y+10,3,3,'#fff4ce');
    R(g,x-2,y+16,5,1,p.woodLight);
    R(g,x-5,y+10,1,4,p.woodLight); R(g,x+5,y+10,1,4,p.woodLight);
  }
  function interiorPicture(g,x,y,w,h,p,kind) {
    /* One image per frame, built from two or three masses. The round-1
     * version drew a nest of four borders and a few 1px marks inside a 13x16
     * box, which a fresh critic read at 1x as speckle down the side walls. */
    R(g,x,y,w,h,p.ink); R(g,x+1,y+1,w-2,h-2,p.woodLight);
    R(g,x+2,y+2,w-4,h-4,p.woodDark);
    var ix=x+3, iy=y+3, iw=w-6, ih=h-6;
    if(kind==='clock') {
      R(g,ix,iy,iw,ih,p.cream); R(g,x+w/2,y+4,1,4,p.ink);
      R(g,x+w/2,y+7,3,1,p.ink);
      return;
    }
    if(kind==='portrait') {
      /* A head and shoulders: one lit ground, one dark hair mass, one cream
       * face, one red collar. Four values, no 1px detail. */
      R(g,ix,iy,iw,ih,p.creamShade);
      R(g,ix,iy,iw,2,p.cream);
      var hw=Math.max(6,iw-2), hx=ix+((iw-hw)>>1);
      R(g,hx,iy+3,hw,7,p.woodDark);
      R(g,hx+1,iy+5,hw-2,5,p.cream);
      R(g,hx+2,iy+7,2,1,p.ink);
      R(g,hx+hw-4,iy+7,2,1,p.ink);
      R(g,hx-1,iy+11,hw+2,ih-12,p.redDark);
      R(g,hx+1,iy+12,hw-2,2,p.red);
      R(g,ix,iy+ih-1,iw,1,p.woodDark);
      return;
    }
    /* A landscape: a lit sky, a dark ridge with a zigzag crest, a green
     * foreground. Three masses that survive a 1x read. */
    var sky=Math.max(4,Math.floor(ih*0.42));
    R(g,ix,iy,iw,sky,p.cream);
    R(g,ix,iy+sky-2,iw,2,p.creamShade);
    var ridge=[1,3,2,5,3,2,4,2,1];
    for(var c=0;c<iw;c++) {
      var lift=ridge[c%ridge.length];
      R(g,ix+c,iy+sky-lift,1,lift,p.woodDark);
    }
    R(g,ix,iy+sky,iw,1,p.ink);
    R(g,ix,iy+sky+1,iw,ih-sky-1,p.leaf);
    R(g,ix,iy+sky+1,iw,1,p.leafHi);
    R(g,ix+1,iy+ih-4,iw-2,2,p.green);
    R(g,ix,iy+ih-1,iw,1,p.woodDark);
  }

  function interiorPlant(g,x,y,p) {
    R(g,x+3,y+12,10,2,p.ink); R(g,x+4,y+6,8,7,p.woodHi);
    R(g,x+5,y+8,6,1,p.gold); R(g,x+7,y-4,2,12,p.woodDark);
    [[0,0],[7,-3],[2,-6],[10,2],[0,5],[6,4]].forEach(function(a,i){
      R(g,x+a[0],y+a[1],6,4,p.green); R(g,x+a[0]+1,y+a[1],4,2,i%2?p.leaf:p.leafHi);
    });
  }
  function interiorCoffeeMachine(g,x,y,p) {
    /* One tall chrome mass with a dark head band and two group heads, rather
     * than a 16x16 box of 1px details that dissolves at 1x. The ambient
     * coffee-machine marks anchor at y+4 and y+7, which stay on the body. */
    interiorContact(g,x,y+15,17,p);
    R(g,x,y-5,16,21,p.ink);
    R(g,x+1,y-4,14,4,p.metalHi);
    R(g,x+2,y-3,12,2,p.cream);
    /* A dark body, so the machine silhouettes against the pale back bar
     * instead of merging into it. */
    R(g,x+1,y,14,12,p.woodDark);
    R(g,x+2,y+1,12,4,p.ink);
    R(g,x+3,y+2,4,2,p.gold);
    R(g,x+9,y+2,4,2,p.creamShade);
    R(g,x+2,y+6,5,6,p.ink);
    R(g,x+9,y+6,5,6,p.ink);
    R(g,x+3,y+7,3,3,p.metalHi);
    R(g,x+10,y+7,3,3,p.metalHi);
    R(g,x+1,y+12,14,2,p.metalHi);
    R(g,x+2,y+14,12,2,p.woodDark);
    R(g,x+1,y,1,12,p.metalHi);
    R(g,x+14,y,1,12,p.woodDark);
  }

  function interiorPieCase(g,x,y,w,p) {
    interiorContact(g,x+1,y+17,w-1,p);
    R(g,x,y,w,18,p.ink); R(g,x+1,y+1,w-2,15,p.metal);
    R(g,x+2,y+2,w-4,5,'#adc0b0'); R(g,x+2,y+8,w-4,7,p.woodHi);
    /* Three whole pies per shelf instead of five slivers: at 1x a pie has to
     * be a mass with a crust edge, not a two-pixel tick. */
    for(var row=0;row<2;row++) for(var i=4;i<w-9;i+=14) {
      R(g,x+i-1,y+7+row*7,11,1,p.cream);
      R(g,x+i,y+3+row*7,9,4,p.woodDark);
      R(g,x+i+1,y+4+row*7,7,3,'#d89345');
      R(g,x+i+2,y+4+row*7,5,1,'#edb96b');
      R(g,x+i+3,y+3+row*7,3,1,(i+row)%2===0?p.creamShade:p.gold);
      R(g,x+i+1,y+6+row*7,7,1,p.woodHi);
    }
    R(g,x+1,y+8,w-2,1,p.metalHi); R(g,x+1,y+16,w-2,1,p.gold);
    R(g,x+3,y+2,2,5,'#e5e6cd'); R(g,x+w-5,y+2,1,12,p.metalHi);
    R(g,x+7,y+2,w-14,1,p.metalHi);
    // Front glass differs from warm pastry mass without hiding it.
    R(g,x+2,y+9,w-5,6,'rgba(129,145,139,.13)');
    R(g,x+10,y+3,3,1,p.metalHi); R(g,x+9,y+4,2,1,p.metalHi);
    R(g,x+27,y+10,3,1,p.metalHi); R(g,x+26,y+11,2,1,p.metalHi);
    R(g,x+2,y+9,1,5,p.metalHi); R(g,x+w-3,y+9,1,6,p.ink);
    R(g,x+3,y+15,w-7,1,'rgba(41,43,38,.22)');
  }
  function interiorPendant(g,x,y,p) {
    R(g,x,y,2,17,p.ink); R(g,x+1,y,1,16,p.woodHi);
    interiorPool(g,x-12,y+10,26,27,'rgba(249,169,49,.10)');
    interiorPool(g,x-8,y+14,18,20,'rgba(255,192,70,.26)');
    R(g,x-5,y+16,12,2,p.woodDark); R(g,x-4,y+16,10,1,p.gold);
    R(g,x-6,y+18,14,7,p.woodDark); R(g,x-5,y+18,12,8,'#c88d36');
    R(g,x-4,y+18,10,9,'#efb84d'); R(g,x-3,y+19,8,7,'#ffdb7d');
    R(g,x-1,y+19,4,6,'#fff1b9'); R(g,x-5,y+19,1,5,p.woodHi);
    R(g,x+6,y+19,1,5,p.woodHi); R(g,x-2,y+27,6,1,p.gold);
  }
  function interiorFloorPlant(g,x,y,p) {
    R(g,x+1,y+12,17,4,'rgba(28,28,20,.3)');
    interiorContact(g,x,y+15,19,p);
    R(g,x+1,y+6,15,10,p.woodDark); R(g,x+2,y+7,13,7,p.woodHi);
    R(g,x+3,y+8,11,1,p.woodLight); R(g,x+3,y+13,11,1,p.woodDark);
    R(g,x+7,y-9,2,18,p.woodDark);
    [[-3,-3],[0,-10],[6,-13],[11,-8],[13,-1],[6,-3],[1,3]].forEach(function(a,n) {
      var lx=x+a[0],ly=y+a[1];
      R(g,lx,ly+2,7,4,p.green); R(g,lx+2,ly,5,6,p.green);
      R(g,lx+1,ly+1,5,3,n%2?p.leaf:p.leafHi);
      R(g,lx+2,ly+2,1,4,p.leaf); R(g,lx+3,ly+1,3,1,'#a4a55c');
    });
  }

  /* DOUBLE on a 4x6 grid with one-pixel spacing. The earlier sign sheared each
   * glyph by (6-row)/3 and then painted a +1,+1 glow pass under it, which
   * filled the one-pixel gaps: a fresh critic read the D and B as collapsing
   * into the board. Upright glyphs, cream on the dark board, one straight
   * drop row below each stroke, and the big looped R left as the red accent. */
  var NEON_FONT_4X6 = {
    D: ['1110', '1001', '1001', '1001', '1001', '1110'],
    O: ['0110', '1001', '1001', '1001', '1001', '0110'],
    U: ['1001', '1001', '1001', '1001', '1001', '0110'],
    B: ['1110', '1001', '1110', '1001', '1001', '1110'],
    L: ['1000', '1000', '1000', '1000', '1000', '1111'],
    E: ['1111', '1000', '1110', '1000', '1000', '1111']
  };
  function interiorNeon(g,x,y,p,sign) {
    sign = sign || defaultSignage;
    R(g,x,y,68,26,p.woodDark); R(g,x+1,y+1,66,24,p.woodLight);
    R(g,x+3,y+2,62,22,p.green); R(g,x+4,y+3,60,19,'#26312b');
    /* A brand with a letter the upright 4x6 face lacks takes that letter from
     * the kit's 5x7 face — upright too, with the same straight drop row. */
    var word=sign.brand, c, row, col, glyphs=[], width=0;
    for(c=0;c<word.length;c++) {
      var face=NEON_FONT_4X6[word[c]] || TOWN_FONT_5X7[word[c]] || kitGlyph(word[c], TOWN_FONT_5X7, TOWN_FONT_5X7_EXT, UNSUPPORTED_5X7);
      glyphs.push({ rows: face, at: width }); width += face[0].length + 1;
    }
    var neonX=sign.mark ? 6 : Math.max(4, Math.round((62 - width)/2));
    for(c=0;c<glyphs.length;c++) {
      var glyph=glyphs[c].rows;
      for(row=0;row<glyph.length;row++) for(col=0;col<glyph[row].length;col++) {
        if(glyph[row][col]!=='1') continue;
        R(g,x+neonX+glyphs[c].at+col,y+8+row,1,1,'#713740');
      }
    }
    for(c=0;c<glyphs.length;c++) {
      var lit=glyphs[c].rows;
      for(row=0;row<lit.length;row++) for(col=0;col<lit[row].length;col++) {
        if(lit[row][col]!=='1') continue;
        R(g,x+neonX+glyphs[c].at+col,y+7+row,1,1,p.cream);
      }
    }
    var pattern=['...RRRRRR..','..RR....RR.','..RR....RR.','..RR...RR..','..RRRRRR...','..RR.RR....','.RR...RR...','.RR....RR..','RR......RR.'];
    if(sign.mark) for(var ry=0;ry<pattern.length;ry++) for(var rx=0;rx<pattern[ry].length;rx++) if(pattern[ry][rx]==='R') {
      R(g,x+43+rx,y+5+ry*2,2,2,p.redHi); R(g,x+43+rx,y+5+ry*2,1,1,p.redLight);
    }
    R(g,x+6,y+15,29,1,p.redHi); R(g,x+8,y+16,25,1,p.redDark);
    // Reflected neon only on adjacent wood; the sign itself is unchanged.
    R(g,x+7,y+26,52,1,'rgba(196,90,97,.20)');
    R(g,x+14,y+27,38,1,'rgba(196,90,97,.12)');
    R(g,x-2,y+9,2,9,'rgba(196,90,97,.12)');
  }

  function interiorPool(g,x,y,w,h,color) {
    // Stepped pixel ellipse: translucent light retains checker/material texture.
    for(var row=0;row<h;row+=2) {
      var edge=Math.abs((row+1)/h*2-1), inset=Math.round(w*.32*edge*edge);
      R(g,x+inset,y+row,w-inset*2,2,color);
    }
  }
  function interiorChalk(g,text,x,y,color) {
    var letters={A:['010','101','111','101'],C:['011','100','100','011'],E:['111','110','100','111'],
      H:['101','111','101','101'],L:['100','100','100','111'],N:['101','111','111','101'],
      P:['110','101','110','100'],R:['110','101','110','101'],Y:['101','101','010','010'],
      M:['111','111','101','101'],B:['110','111','101','110'],D:['110','101','101','110'],O:['111','101','101','111'],
      S:['011','110','011','110'],T:['111','010','010','010']};
    for(var i=0;i<text.length;i++) {
      var glyph=letters[text[i]];
      if(!glyph) { if(!composedRoomPass) continue; unsupportedGlyphs[text[i]]=(unsupportedGlyphs[text[i]]||0)+1; glyph=['111','101','101','111']; }
      for(var row=0;row<4;row++) for(var col=0;col<3;col++) if(glyph[row][col]==='1') R(g,x+i*4+col,y+row,1,1,color);
    }
  }
  function interiorWarmLight(g,x,y,w,h,strength) {
    var k=strength===undefined?1:strength;
    interiorPool(g,x,y,w,h,'rgba(255,183,61,'+(.08*k)+')');
    interiorPool(g,x+3,y+2,w-6,h-4,'rgba(255,195,87,'+(.10*k)+')');
    interiorPool(g,x+7,y+4,w-14,h-8,'rgba(255,217,130,'+(.13*k)+')');
  }
  function interiorSpecials(g,x,y,p,lines) {
    lines = lines || defaultSignage.specials;
    // Compact 23x26 board; one collision cell, set beside the right booths.
    R(g,x-2,y+12,24,4,'rgba(28,25,18,.28)');
    interiorContact(g,x-2,y+14,23,p);
    R(g,x-3,y-11,23,25,p.woodDark); R(g,x-2,y-10,21,22,p.woodHi);
    R(g,x-1,y-9,19,20,p.green);
    roomWord(g,lines[0],x-1,y-7,p.creamShade);
    roomWord(g,lines[1],x+3-Math.max(0,lines[1].length-3)*2,y,p.cream);
    roomWord(g,lines[2],x+2,y+6,p.gold);
    R(g,x-2,y+12,3,3,p.woodDark); R(g,x+16,y+12,3,3,p.woodDark);
  }
  function interiorServiceCluster(g,x,y,p,kind) {
    if(kind==='coffee') {
      interiorCoffeeMachine(g,x,y,p);
      R(g,x+19,y+4,9,11,p.ink); R(g,x+20,y+6,7,6,p.woodDark);
      R(g,x+21,y+7,5,3,'#906744'); R(g,x+20,y+12,7,1,p.metalHi);
      R(g,x+21,y+2,5,3,p.metal); R(g,x+22,y+1,3,1,p.ink);
      R(g,x+27,y+6,3,6,p.ink); R(g,x+28,y+7,1,3,p.metal);
    } else if(kind==='plates') {
      for(var i=0;i<3;i++) { R(g,x,y+9-i*2,9,2,p.metal); R(g,x+1,y+8-i*2,7,1,p.cream); }
      interiorCup(g,x+12,y+5,p); interiorCup(g,x+19,y+5,p);
    } else if(kind==='register') {
      interiorContact(g,x,y+15,16,p);
      R(g,x,y+6,15,10,p.ink); R(g,x+1,y+7,13,7,p.metal);
      R(g,x+3,y,10,9,p.ink); R(g,x+4,y+1,8,5,p.metalHi);
      R(g,x+5,y+2,6,3,p.green); R(g,x+2,y+11,10,1,p.metalHi);
      R(g,x+3,y+13,2,1,p.ink); R(g,x+7,y+13,2,1,p.ink);
    }
  }


  /* A service counter of any length: shadow, fascia panels, laminate top. */
  function interiorCounterSlab(g,counterX,counterY,counterW,p,trimFascia) {
    /* The Double R's last fascia panel runs a few pixels past the end of its
     * counter. That is how that room looks and it is left alone; a room
     * composed elsewhere asks for panels trimmed to the slab. */
    var i, trim = trimFascia ? function (n, left) { return Math.max(0, Math.min(n, left)); } : function (n) { return n; };
    R(g,counterX+2,counterY+16,counterW-2,5,'rgba(32,26,19,.28)');
    interiorContact(g,counterX+1,counterY+18,counterW-2,p);
    R(g,counterX,counterY,counterW,17,p.ink); R(g,counterX+1,counterY+6,counterW-2,8,p.redDark);
    R(g,counterX+2,counterY+6,counterW-4,6,p.red); R(g,counterX+3,counterY+6,counterW-6,1,p.redHi);
    for(i=4;i<counterW-5;i+=22) { R(g,counterX+i,counterY+8,trim(18,counterW-5-i),3,p.redDark); R(g,counterX+i+1,counterY+8,trim(16,counterW-7-i),1,p.redHi); }
    R(g,counterX,counterY-2,counterW,7,p.creamShade); R(g,counterX+1,counterY-2,counterW-2,4,p.cream);
    R(g,counterX+1,counterY+4,counterW-2,1,p.metalHi); R(g,counterX+2,counterY+15,counterW-4,1,p.metal);
    // Broken specular strips keep polished laminate distinct from matte wood.
    if(counterW>=34) R(g,counterX+10,counterY-1,20,1,p.metalHi);
    if(counterW>=72) R(g,counterX+53,counterY,16,1,p.metalHi);
    if(counterW>=124) R(g,counterX+94,counterY-1,26,1,p.gold);
  }

  /* 8px checker tiles over a room-local rectangle. `aisleSheen` is the Double
   * R's worn centre aisle and belongs to that room only. */
  function interiorCheckerFloor(g,x,y,x0,y0,x1,y1,p,aisleSheen) {
    for(var fy=y0;fy<y1;fy+=8) for(var fx=x0;fx<x1;fx+=8) {
      /* Phased on the tile grid: each 16px room tile carries one complete
       * light/dark quad, so the floor lines up with booth fronts, counter and door. */
      var dark=((fx+fy)/8)&1;
      R(g,x+fx,y+fy,8,8,dark?p.tile:p.floorLight);
      R(g,x+fx,y+fy+7,8,1,dark?p.tileShade:p.floorShade);
      // Sparse, deterministic value changes; no random dirt or per-frame noise.
      var tileKey=(fx/8*7+fy/8*11)%19;
      if(tileKey===3) R(g,x+fx+1,y+fy+1,6,5,'rgba(207,188,146,.055)');
      if(tileKey===12) R(g,x+fx+1,y+fy+2,5,4,'rgba(41,43,38,.035)');
      if(aisleSheen && fx>=104 && fx<=120 && fy>=80 && fy%24===8)
        R(g,x+fx+2,y+fy+3,4,1,'rgba(244,230,200,.09)');
      /* Grout on the 16px boundaries: the line the eye uses to see that the
       * floor grid and the room grid are the same grid. */
      if(fx%16===0) R(g,x+fx,y+fy,1,8,'rgba(41,43,38,.16)');
      if(fy%16===0) R(g,x+fx,y+fy,8,1,'rgba(41,43,38,.16)');
    }
  }
  /* Long boards with staggered butt joints; same deterministic, noise-free
   * value discipline as the checker floor. */
  function interiorPlankFloor(g,x,y,x0,y0,x1,y1,p) {
    for(var fy=y0,row=0;fy<y1;fy+=8,row++) {
      R(g,x+x0,y+fy,x1-x0,8,row%2?p.floorLight:p.tile);
      R(g,x+x0,y+fy+7,x1-x0,1,row%2?p.floorShade:p.tileShade);
      for(var fx=x0+((row*19)%40);fx<x1;fx+=40) {
        R(g,x+fx,y+fy,1,7,row%2?p.floorShade:p.tileShade);
        if((fx+row)%3===0 && fx+9<x1) R(g,x+fx+3,y+fy+2,6,1,'rgba(244,230,200,.07)');
      }
      if(row%5===2) R(g,x+x0+((row*31)%(x1-x0-14)),y+fy+3,9,1,'rgba(41,43,38,.05)');
    }
  }
  /* A wall window seen from inside: frame, mullions, sill, and the daylight it
   * lays on the floor in front of it. */
  function interiorWindow(g,x,y,w,h,p) {
    R(g,x-2,y-2,w+4,h+5,p.woodDark); R(g,x-1,y-1,w+2,h+2,p.woodLight);
    R(g,x,y,w,h,p.ink); R(g,x+1,y+1,w-2,h-2,p.glass||'#9db7b4');
    R(g,x+1,y+1,w-2,Math.floor((h-2)*.45),p.glassHi||'#c3d4c9');
    for(var mx=Math.round(w/3);mx<w-4;mx+=Math.round(w/3)) R(g,x+mx,y+1,1,h-2,p.woodLight);
    R(g,x+1,y+Math.floor(h*.55),w-2,1,p.woodLight);
    R(g,x+3,y+2,Math.max(3,Math.floor(w*.18)),1,'rgba(255,255,255,.45)');
    R(g,x+w-7,y+4,3,1,'rgba(255,255,255,.30)');
    R(g,x-3,y+h+1,w+6,2,p.woodHi); R(g,x-2,y+h+3,w+4,1,'rgba(41,43,38,.30)');
  }
  function interiorDaylight(g,x,y,w,h,strength) {
    var k=strength==null?1:strength;
    interiorPool(g,x,y,w,h,'rgba(214,226,214,'+(.10*k)+')');
    interiorPool(g,x+6,y+3,w-12,h-5,'rgba(236,240,222,'+(.09*k)+')');
  }
  function interiorCoatRack(g,coatX,coatY,p) {
    R(g,coatX+7,coatY,2,14,p.woodHi); R(g,coatX+3,coatY+13,10,2,p.ink);
    R(g,coatX+2,coatY+1,12,2,p.woodLight); R(g,coatX+2,coatY+3,4,7,p.redDark); R(g,coatX+11,coatY+3,3,9,p.green);
  }
  /* Low cutaway front wall with a two-leaf door wherever the room has one. */
  function interiorFrontWall(g,wallX,wallY,wallW,doorX,p) {
    var i;
    R(g,wallX,wallY,wallW,16,p.redDark); R(g,wallX,wallY+1,wallW,8,p.cream);
    for(i=0;i<wallW;i+=8) R(g,wallX+i,wallY,4,3,p.redHi);
    R(g,wallX,wallY+10,wallW,2,p.red); R(g,wallX,wallY+15,wallW,1,p.woodLight);
    R(g,doorX,wallY,32,16,p.woodDark); R(g,doorX+1,wallY+1,30,14,p.red);
    R(g,doorX+15,wallY+2,2,13,p.woodDark);
    [3,19].forEach(function(dx){R(g,doorX+dx,wallY+3,10,6,p.gold);R(g,doorX+dx+1,wallY+4,8,4,p.cream);});
  }
  function interiorMenuBoard(g,bx,by,p,menu) {
    R(g,bx,by,39,31,p.woodDark); R(g,bx+2,by+2,35,27,p.ink);
    roomWord(g,menu[0][0],bx+4,by+5,p.cream); roomWord(g,menu[0][1],bx+21,by+11,p.gold);
    roomWord(g,menu[1][0],bx+4,by+17,p.cream); roomWord(g,menu[1][1],bx+21,by+23,p.gold);
  }

  /* ---- rooms composed elsewhere ----------------------------------------
   * A room its game composes in place (the Double R, in the renderer) uses the
   * pieces above directly. A
   * room that belongs to something else registers a composition instead: it
   * gets the kit, draws with it, and says which of its pieces must be painted
   * again in front of an actor standing behind them. Nothing about the kit's
   * drawing is duplicated; only the arrangement lives with its owner. */
  var INTERIOR_SCENES = {};

  function drawRegisteredInterior(g,map,cx,cy) {
    var scene = INTERIOR_SCENES[map.id], p = INTERIOR_MATERIALS[scene.material];
    var previous = houseMonogram;
    houseMonogram = scene.monogram || '';
    composedRoomPass = true;
    try {
      R(g,0,0,g.canvas ? g.canvas.width : 256,g.canvas ? g.canvas.height : 192,scene.backdrop || '#17251e');
      scene.draw(g, map, -cx, -cy, p, K.pieces);
    } finally { composedRoomPass = false; houseMonogram = previous; }
  }
  function drawRegisteredForeground(g,map,cx,cy,min,max) {
    var scene = INTERIOR_SCENES[map.id], p = INTERIOR_MATERIALS[scene.material];
    if (!scene.foreground) return;
    var previous = houseMonogram;
    houseMonogram = scene.monogram || '';
    composedRoomPass = true;
    try { scene.foreground(g, map, -cx, -cy, p, K.pieces, min, max); }
    finally { composedRoomPass = false; houseMonogram = previous; }
  }
  /* What a composed room is handed. */
  K.pieces = {
    materials: INTERIOR_MATERIALS, contactShadow: interiorContact, actorLight: interiorActorLight,
    pendant: interiorPendant, floorPlant: interiorFloorPlant, lightPool: interiorPool, specials: interiorSpecials, serviceCluster: interiorServiceCluster,
    occupiedTable: interiorOccupiedTable, seatedGuest: interiorSeatedGuest, seatedHands: interiorSeatedHands,
    panel: interiorPanel, booth: interiorBooth, stool: interiorStool,
    cup: interiorCup, tableProps: interiorTableProps, lamp: interiorLamp,
    picture: interiorPicture, plant: interiorPlant,
    coffeeMachine: interiorCoffeeMachine, pieCase: interiorPieCase,
    /* Pieces a room composed elsewhere needs; the Double R uses the same ones. */
    counterSlab: interiorCounterSlab, checkerFloor: interiorCheckerFloor, plankFloor: interiorPlankFloor,
    frontWall: interiorFrontWall, window: interiorWindow, daylight: interiorDaylight, warmLight: interiorWarmLight,
    coatRack: interiorCoatRack, menuBoard: interiorMenuBoard, neon: interiorNeon, word: interiorWord, signWord: interiorSignWord, rect: R,
    unsupported: kitUnsupported
  };
  K.materials = INTERIOR_MATERIALS;
  K.scenes = INTERIOR_SCENES;
  K.drawScene = drawRegisteredInterior;
  K.drawSceneForeground = drawRegisteredForeground;
  /* Every piece by its own name, for a host that composes its room in place. */
  K.parts = {
    roomWord: roomWord,
    interiorContact: interiorContact,
    interiorActorLight: interiorActorLight,
    interiorPanel: interiorPanel,
    interiorCup: interiorCup,
    interiorDinerMenu: interiorDinerMenu,
    interiorTableProps: interiorTableProps,
    interiorSeatedGuest: interiorSeatedGuest,
    interiorPoseRect: interiorPoseRect,
    interiorSeatedHands: interiorSeatedHands,
    interiorOccupiedTable: interiorOccupiedTable,
    interiorBooth: interiorBooth,
    interiorStool: interiorStool,
    interiorLamp: interiorLamp,
    interiorPicture: interiorPicture,
    interiorPlant: interiorPlant,
    interiorCoffeeMachine: interiorCoffeeMachine,
    interiorPieCase: interiorPieCase,
    interiorPendant: interiorPendant,
    interiorFloorPlant: interiorFloorPlant,
    NEON_FONT_4X6: NEON_FONT_4X6,
    interiorNeon: interiorNeon,
    interiorPool: interiorPool,
    interiorChalk: interiorChalk,
    interiorWarmLight: interiorWarmLight,
    interiorSpecials: interiorSpecials,
    interiorServiceCluster: interiorServiceCluster,
    interiorCounterSlab: interiorCounterSlab,
    interiorCheckerFloor: interiorCheckerFloor,
    interiorPlankFloor: interiorPlankFloor,
    interiorWindow: interiorWindow,
    interiorDaylight: interiorDaylight,
    interiorCoatRack: interiorCoatRack,
    interiorFrontWall: interiorFrontWall,
    interiorMenuBoard: interiorMenuBoard
  };
})();
