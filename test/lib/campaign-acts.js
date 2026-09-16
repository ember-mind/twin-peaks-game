'use strict';
const assert = require('node:assert/strict');

/* Explicit authored route, not a search for a sequence that makes tests green.
 * Choices intentionally cover documented custody, evidence-led interrogation,
 * keeping the recording, and physically returning the ring to the case file.
 */
module.exports = async function completeCampaign(p, checkpoint, browser) {
  await p.actor('hospital', 'ronette'); await p.choose('q_uomo');
  await p.actor('diner', 'james');
  await p.compare('E6A_CUORE_INTERO', 'T_JAMES_EST'); await p.choose('b8_a'); await p.closeNotebook();
  await p.actor('sheriff', 'truman'); await p.present('P2');
  await checkpoint('act3-earned', (s) => !!s.flags.atto3);

  await p.target('traincar', 'bridge_rail');
  await p.target('traincar', 'traincar_entrance'); await p.choose('theory_withhold');
  for (const id of ['ring', 'mound', 'scene_center']) await p.target('traincar', id);
  await p.compare('E8A_ANELLO_POSIZIONE', 'E8B_ANELLO_SUPERFICIE'); await p.choose('ring_a'); await p.closeNotebook();
  await p.target('traincar', 'traincar_entrance'); await p.choose('first_open');
  await p.actor('traincar', 'truman'); await p.choose('s1_documented');
  await p.target('traincar', 'tracks_north');
  await checkpoint('east-route-earned', (s) => !!s.flags.east_route_confirmed);

  await p.actor('oej', 'jacques'); await p.choose('tactic_prova'); await p.choose('p5_present');
  if (!(await p.snapshot()).flags.jacques_preso) await p.actor('oej', 'jacques');
  await checkpoint('arrest-earned', (s) => !!s.flags.jacques_preso);
  await p.target('hospital', 'night_register');
  await p.actor('sheriff', 'truman'); await p.actor('sheriff', 'lucy');
  await checkpoint('hospital-news', (s) => !!s.narrative.flags.jacques_dead);
  await p.go('room_315'); await p.reach(13, 3); await p.interact();
  await checkpoint('giant-at-mirror', (s) => !!s.flags.gigante1);
  await p.actor('sheriff', 'truman');
  await checkpoint('act4-earned', (s) => !!s.flags.atto4);

  await p.actor('diner', 'maddy'); await p.choose('promise_autonomia');
  await p.actor('diner', 'leland');
  await checkpoint('taxi-testimony', (s) => !!s.narrative.evidence.T_LELAND_TAXI);
  await p.actor('roadhouse', 'truman'); await p.actor('roadhouse', 'giant');
  await p.target('roadhouse', 'roadhouse_phone'); await p.choose('warning_centrale');
  await p.target('town', 'town_crossroads'); await p.choose('focus_lago');
  await p.target('town', 'lago_maddy'); // The chosen route, before discovery.
  await p.target('town', 'lago_maddy'); // Discovery and its explicit continuation.
  if (!(await p.snapshot()).narrative.nodes_done.m8_promise_echo) await p.target('town', 'lago_maddy');
  await checkpoint('shore-discovery', (s) => !!s.flags.maddy_trovata && !!s.narrative.nodes_done.m8_promise_echo);
  await p.compare('E9A_LETTERA_O', 'E3_LETTERA_R'); await p.closeNotebook();
  await p.compare('E9A_LETTERA_O', 'E1_DIARIO'); await p.choose('diary_a'); await p.closeNotebook();
  await p.actor('sheriff', 'truman');
  await checkpoint('act4-report', (s) => !!s.narrative.nodes_done.m8_station);

  await p.actor('sheriff', 'lucy');
  await p.compare('T_LELAND_TAXI', 'D_TAXI'); await p.closeNotebook();
  await p.actor('sheriff', 'truman'); await p.present('P6', ['T_LELAND_TAXI', 'D_TAXI']);
  await p.actor('sheriff', 'leland');
  await checkpoint('act5-arrival', (s) => !!s.flags.atto5 && !!s.narrative.nodes_done.m9_arrivo);
  await p.actor('sheriff', 'leland'); await p.choose('method_probatorio');
  await checkpoint('admissions-before-tape', (s) =>
    ['taxi_lie', 'traincar_presence', 'laura_homicide', 'maddy_homicide', 'maddy_body_transport', 'letters']
      .every((id) => s.narrative.values['material_admissions.' + id] === 'leland_first_person') &&
    s.semanticUi.choices.some((c) => c.id === 's3_on'));
  await p.choose('s3_on');
  await checkpoint('lodge-handoff-not-ending', (s) => !!s.flags.leland_morto && s.mode === 'play' && !!s.finale && s.finale.stage === 'await_lodge');

  await p.actor('redroom', 'mfap'); await p.choose('kept');
  await p.actor('redroom', 'bob'); await p.choose('A');
  await p.actor('redroom', 'laura');
  await checkpoint('lodge-exit-earned', (s) => s.finale.stage === 'await_lodge_exit');
  await p.go('woods'); await p.choose('avvertimento');
  await p.actor('sheriff', 'truman');
  await checkpoint('epilogue-station', (s) => s.finale.stage === 'await_epilogue_exit');
  await p.go('town'); await p.reach(30, 30); await p.interact();
  await checkpoint('actual-ending', (s) => s.mode === 'end' && s.finale.stage === 'complete' && !!s.flags.end);
  const final = await p.snapshot();
  assert.equal(final.finale.consequences.ring_final_gesture, 'kept');
  assert.equal(final.finale.consequences.post_s3_record, 'recorded');
  let pages = 0;
  for (; pages < 40 && (await p.snapshot()).mode === 'end'; pages++) {
    await browser.capture('ending-page-' + pages);
    await p.press('Enter');
  }
  assert.ok(pages > 0 && pages < 40, 'All actual ending pages must be navigable');
  await checkpoint('title-after-ending', (s) => s.mode === 'title');
};
