/* lt-appearance.js — Living Town: what inhabitants look like.
 *
 * Appearance is content, and it is not identity. A person has a stable id, a
 * generated name, and — separately — one of these looks, drawn once at world
 * creation and kept in state. Nothing here names anyone.
 *
 * Each look is a recipe for the shared paper-doll sprite system (heads, bodies,
 * overlays, tone slots) that the production cast is built with; the sheet is
 * compiled by living-town/tools/build-inhabitants.js into
 * living-town/assets/inhabitants-hg-24.png. The order below IS the sheet
 * order. `_work` variants add the apron and are chosen by the view while
 * someone is working a shift.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var A = LT.Appearance = LT.Appearance || {};

  var SKIN = { S: '#E8CAA8', s: '#C8A080' }, SKIN_DARK = { S: '#C99A72', s: '#A5764F' },
      SKIN_PALE = { S: '#F2DCC2', s: '#D4B292' };
  var BROWN_SHOES = { B: '#4B3527', b: '#6E4E38' }, BLACK_SHOES = { B: '#26232A', b: '#3E3A44' };

  function look(head, body, overlays, tones) {
    var colors = {}, i, k;
    for (i = 0; i < tones.length; i++) for (k in tones[i]) colors[k] = tones[i][k];
    return { head: head, body: body, overlays: overlays, colors: colors };
  }

  A.LOOKS = {
    look_teal_bob: look('bob', 'skirt', [], [{ H: '#54403E', h: '#705039' }, SKIN,
      { W: '#EDE6D6', w: '#CFC6B4', T: '#2F6F6A', J: '#3F8580', j: '#5FA39C', K: '#2B5C58', P: '#4A4458', p: '#5F586E' }, BROWN_SHOES]),
    look_ochre_short: look('short', 'jacket', [], [{ H: '#1F1B22', h: '#3B343C' }, SKIN_DARK,
      { W: '#E9E2D2', w: '#CBC3B0', T: '#7A5A2A', J: '#B98A3A', j: '#D2A556', K: '#8A6428', P: '#38404E', p: '#4C5566' }, BLACK_SHOES]),
    look_plum_long: look('long', 'skirt', ['hairShoulders'], [{ H: '#8E4A2E', h: '#B36A44' }, SKIN_PALE,
      { W: '#EFE8DC', w: '#D1C8BA', T: '#5E3A66', J: '#77508A', j: '#9570A6', K: '#553866', P: '#3E3A48', p: '#545062' }, BLACK_SHOES]),
    look_moss_neat: look('neat', 'jacket', [], [{ H: '#8A8A88', h: '#B0B0AC' }, SKIN,
      { W: '#E6DFCC', w: '#C8C0AA', T: '#6A3A2E', J: '#566B45', j: '#728A5C', K: '#3E5032', P: '#4A4238', p: '#5F564A' }, BROWN_SHOES]),
    look_rust_bun: look('bun', 'skirt', [], [{ H: '#33262A', h: '#54403E' }, SKIN_DARK,
      { W: '#F0E6D6', w: '#D2C6B2', T: '#8A3A24', J: '#A8512F', j: '#C47048', K: '#7C3A20', P: '#3A4450', p: '#4E5A68' }, BROWN_SHOES]),
    look_slate_short: look('short', 'jacket', ['beard'], [{ H: '#4E3526', h: '#705039' }, SKIN_PALE,
      { W: '#E4E0D8', w: '#C6C2BA', T: '#C9A25A', J: '#4C5E78', j: '#667A96', K: '#36465C', P: '#2E3038', p: '#42444E' }, BLACK_SHOES])
  };

  A.BASE_IDS = Object.keys(A.LOOKS);
  /* Sheet order: every look, then every look in an apron. */
  A.ORDER = A.BASE_IDS.concat(A.BASE_IDS.map(function (id) { return id + '_work'; }));

  A.spec = function (sheetId) {
    var work = /_work$/.test(sheetId);
    var base = A.LOOKS[work ? sheetId.replace(/_work$/, '') : sheetId];
    if (!base) return null;
    if (!work) return base;
    return { head: base.head, body: base.body, overlays: base.overlays.concat(['apron']), colors: base.colors };
  };

  /* Which block of the sheet shows this person right now. Reads activity; it
   * never writes anything. */
  A.sheetIdFor = function (character) {
    var act = character.activity && character.activity.actionId;
    /* The apron goes on at the counter, not at the door. */
    var doing = character.activity && character.activity.phase === 'executing';
    var working = doing && (act === 'work_shift' || act === 'work_extra_shift' || act === 'take_break');
    return character.appearanceId + (working ? '_work' : '');
  };

  /* The shape someone is in right now, as a pose id the pose package draws, or
   * null for the ordinary standing and walking sprite. A pose id is a shape;
   * which activity takes which shape is decided here, by activity and phase,
   * never by who the person is. Only while they are really doing it: someone
   * still walking over walks. Working the counter and opening a parcel have
   * no pose yet — the ones drawn did not read to a cold viewer. */
  var POSE = { sleep: 'sleeping', read_book: 'reading', sit_and_rest: 'seated', take_break: 'seated',
               talk_with: 'talking', join_conversation: 'talking' };
  var POSE_DIRS = { sleeping: ['right', 'left'], reading: ['down'], seated: ['down', 'right', 'left'], talking: ['down', 'right', 'left'] };
  A.poseFor = function (character) {
    var act = character.activity;
    if (!act || act.phase !== 'executing' || character.transit || character.walkTarget) return null;
    var poseId = POSE[act.actionId];
    if (!poseId) return null;
    /* A talk has a pose once the two are actually talking, not while one waits for an answer. */
    if (poseId === 'talking' && !act.conversationId) return null;
    var dirs = POSE_DIRS[poseId], facing = character.pos && character.pos.dir;
    return { poseId: poseId, dir: dirs.indexOf(facing) >= 0 ? facing : dirs[0] };
  };

  /* Draws distinct looks from a stream of their own, like names. */
  A.generator = function (rng) {
    var pool = A.BASE_IDS.slice();
    return function () {
      if (!pool.length) pool = A.BASE_IDS.slice();
      return pool.splice(Math.floor(rng() * pool.length), 1)[0];
    };
  };
})();
