'use strict';

/* Continuation of the earned opening route. No production-code imports,
 * state injection, teleportation, choice fallback, or direct commits.
 * One explicit route is technical coverage, not all-branch or usability proof.
 */
const assert = require('node:assert/strict');
async function runFullRoute(p, checkpoint) {
  // M4: testimony, evidence, deduction, then a justified presentation.
  await p.actor('hospital', 'gerard');
  await p.actor('hospital', 'ronette'); await p.choose('q_uomo');
  await p.actor('diner', 'james');
  await p.compare('E6A_CUORE_INTERO', 'T_JAMES_EST');
  await p.choose('b8_a'); await p.closeNotebook();
  await p.actor('sheriff', 'truman'); await p.present('P2');
  await checkpoint('act3-earned', (s) => !!s.flags.atto3 && !!s.narrative.flags.atto3);

  // M5: examine the physical scene and compare in the notebook.
  await p.target('traincar', 'bridge_rail');
  await p.target('traincar', 'traincar_entrance'); await p.choose('theory_degeneration');
  for (const id of ['mound', 'ring', 'scene_center', 'stove', 'cards']) await p.target('traincar', id);
  await p.compare('E8A_ANELLO_POSIZIONE', 'E8B_ANELLO_SUPERFICIE');
  await p.choose('ring_a'); await p.closeNotebook();
  await p.target('traincar', 'traincar_entrance'); await p.choose('revision_keep');
  await p.actor('traincar', 'truman'); await p.choose('s1_documented');
  await p.target('traincar', 'tracks_north');
  await checkpoint('east-route-earned', (s) => !!s.flags.east_route_confirmed);
  await p.target('traincar', 'sign_oej');

  // M6: investigation, custody record and night report happen in-world.
  await p.actor('oej', 'jacques'); await p.choose('tactic_prova'); await p.choose('p5_present');
  await checkpoint('jacques-arrested', (s) => !!s.narrative.flags.jacques_preso);
  await p.target('hospital', 'night_register');
  await p.actor('sheriff', 'truman'); await p.actor('sheriff', 'lucy');
  await checkpoint('night-report-earned', (s) => !!s.narrative.flags.jacques_dead);
  await p.go('room_315'); await p.reach(13, 3); await p.interact();
  await checkpoint('giant-at-mirror', (s) => !!s.flags.gigante1);
  await p.actor('sheriff', 'truman');
  await checkpoint('act4-earned', (s) => !!s.flags.atto4 && !!s.narrative.flags.atto4);

  // M8: promise, departure, gathering, warning and chosen physical route.
  await p.actor('diner', 'maddy'); await p.choose('promise_accompagno');
  await p.actor('diner', 'leland');
  await checkpoint('taxi-testimony-earned', (s) => !!s.narrative.evidence.T_LELAND_TAXI);
  await p.actor('roadhouse', 'truman'); await p.actor('roadhouse', 'giant');
  await p.target('roadhouse', 'roadhouse_phone'); await p.choose('warning_centrale');
  await p.target('town', 'town_crossroads'); await p.choose('focus_lago');
  await p.target('town', 'lago_maddy'); // route_lake
  await p.target('town', 'lago_maddy'); // discovery and mandatory promise echo
  await checkpoint('maddy-discovered', (s) => !!s.narrative.nodes_done.m8_promise_echo && !!s.narrative.evidence.E9A_LETTERA_O);
  await p.compare('E9A_LETTERA_O', 'E3_LETTERA_R'); await p.closeNotebook();
  await p.compare('E9A_LETTERA_O', 'E1_DIARIO'); await p.choose('diary_a'); await p.closeNotebook();
  await p.actor('sheriff', 'truman');
  await checkpoint('act4-report-complete', (s) => !!s.narrative.nodes_done.m8_station);

  // M9 -> M10: verify the taxi, present support, then talk to Leland.
  await p.actor('sheriff', 'lucy');
  await p.compare('T_LELAND_TAXI', 'D_TAXI'); await p.closeNotebook();
  await p.actor('sheriff', 'truman'); await p.present('P6', ['T_LELAND_TAXI', 'D_TAXI']);
  await checkpoint('act5-earned', (s) => !!s.narrative.flags.atto5);
  await p.actor('sheriff', 'leland');
  await checkpoint('leland-arrived', (s) => !!s.narrative.nodes_done.m9_arrivo);
  await p.actor('sheriff', 'leland'); await p.choose('method_probatorio');
  await checkpoint('admissions-before-recorder', (s) => ['taxi_lie', 'traincar_presence', 'laura_homicide',
    'maddy_homicide', 'maddy_body_transport', 'letters'].every((id) =>
    s.narrative.values['material_admissions.' + id] === 'leland_first_person') &&
    s.semanticUi.choices.some((c) => c.id === 's3_on'));
  await p.choose('s3_on');
  await checkpoint('lodge-handoff', (s) => !!s.flags.leland_morto && !!s.finale && s.finale.stage === 'await_lodge');

  // The handoff is NOT the ending. Walk through the complete physical finale.
  await p.actor('redroom', 'mfap'); await p.choose('kept');
  await p.actor('redroom', 'bob'); await p.choose('A');
  await p.actor('redroom', 'laura');
  await checkpoint('lodge-complete', (s) => !!s.finale && s.finale.stage === 'await_lodge_exit');
  await p.go('woods'); await p.choose('avvertimento');
  await p.actor('sheriff', 'truman');
  await checkpoint('epilogue-report', (s) => !!s.finale && s.finale.stage === 'await_epilogue_exit');
  await p.go('town'); await p.reach(30, 30); await p.interact();
  await checkpoint('final-epilogue-complete', (s) => s.mode === 'end' && !!s.finale && s.finale.stage === 'complete');

  // Read every actual terminal page; normal input must return to the title.
  // This bound is a failure guard, not an invented page count or skipped ending.
  for (let i = 0; i < 40; i++) {
    const before = await p.snapshot();
    assert.equal(before.mode, 'end', 'Expected the terminal screen');
    await checkpoint('terminal-page-' + before.endPage, (s) => s.mode === 'end' && s.endPage === before.endPage);
    await p.press('Enter');
    const after = await p.snapshot();
    if (after.mode === 'title') {
      await checkpoint('returned-to-title', (s) => s.mode === 'title');
      return;
    }
    assert.equal(after.mode, 'end', 'Ending input must page or return to title');
    assert.equal(after.endPage, before.endPage + 1, 'Ending pages must advance exactly once');
  }
  throw new Error('Ending did not return to title within 40 pages');
}
module.exports = { runFullRoute };
