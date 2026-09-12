# cast-continuity-validate report

```
V1 exactly-one: PASS (624 checks)
V2 zero-overlaps: PASS (624 checks)
V3 no-implicit-absence: PASS (624 checks)
  static: characters without baseline = [] (spec expects only [jacques])
  NOTE: attuale dataset diverge dall'attesa di spec — jacques HA un baseline TERMINAL_REMOVED; l'invariante "risolvono su ogni seed" resta rispettato (verificato sopra). Non trattato come FAIL hard: riportare al lead.
V4 order-independence: PASS (360 checks)
RC8 order independence (Act 3 chain): PASS
V5 world-window-pins: PASS (24 checks)
V5b scene-required-presence: PASS (27 checks)
  node=m5_hawk_bridge (hawk@traincar) live on seeds: []
  node=m5_hawk_door (hawk@traincar) live on seeds: []
  node=m5_report_intro (truman@traincar) live on seeds: []
  node=m5_hawk_cut (hawk@traincar) live on seeds: []
  node=m6_ferry (jacques@oej) live on seeds: []
  V5b allowed (R1): m6_audrey on ACT3_AFTER_ARREST — M6 node relies on the absent body; data debt recorded in the implementation report §16
  V5b allowed (R1): m6_audrey on ACT3_GUARDED_HOSPITAL — M6 node relies on the absent body; data debt recorded in the implementation report §16
  V5b allowed (R1): m6_audrey on ACT3_NIGHT_STATION — M6 node relies on the absent body; data debt recorded in the implementation report §16
  node=m6_audrey (audrey@oej) live on seeds: [ACT3_OEJ, ACT3_AFTER_ARREST, ACT3_GUARDED_HOSPITAL, ACT3_NIGHT_STATION]
  node=m6_tactic (jacques@oej) live on seeds: [ACT3_OEJ, ACT3_OEJ_AUDREY_SEEN, ACT3_OEJ_NO_AUDREY]
  node=m6_interrogation_prova (jacques@oej) live on seeds: []
  node=m6_interrogation_pressione (jacques@oej) live on seeds: []
  node=m6_interrogation_falsa (jacques@oej) live on seeds: []
  node=m6_arrest (jacques@oej) live on seeds: []
  node=m6_return_night_early (truman@sheriff) live on seeds: [ACT3_AFTER_ARREST]
  node=m6_return_night (truman@sheriff) live on seeds: [ACT3_GUARDED_HOSPITAL]
  node=m6_news (lucy@sheriff) live on seeds: []
  node=m6_atto4_bridge (truman@sheriff) live on seeds: []
  node=m8_diner (maddy@diner) live on seeds: [ACT4_AFTERNOON]
  node=m8_leland_waiting (leland@diner) live on seeds: [ACT4_AFTERNOON]
  node=m8_roadhouse_truman (truman@roadhouse) live on seeds: [ACT4_EVENING_GATHERING]
  node=m8_giant_stage (giant@roadhouse) live on seeds: [ACT4_ROADHOUSE_PRE_PHONE]
  node=m8_leland_taxi (leland@diner) live on seeds: [ACT4_PROMISE_MADE]
  node=m8_lucy (lucy@sheriff) live on seeds: [ACT4_AFTERNOON, ACT4_PROMISE_MADE, ACT4_EVENING_GATHERING, ACT4_ROADHOUSE_PRE_PHONE, ACT4_POST_PHONE_INSIDE_PALMER, ACT4_POST_PHONE_INSIDE_CENTRALE, ACT4_POST_PHONE_INSIDE_NESSUNO, ACT4_ROUTE_PALMER, ACT4_ROUTE_DINER, ACT4_ROUTE_LAKE, ACT4_SHORE_HAWK, ACT4_SHORE_COOPER_AFTER]
  node=m8_route_diner (norma@diner) live on seeds: [ACT4_ROUTE_DINER]
  node=m8_station (truman@sheriff) live on seeds: []
V6 causal-transitions: PASS (42 checks)
V6b no-silent-vanish-entry: PASS (42 checks)
  RC7 negative (a) page removed: validator bites = true
  RC7 negative (b) entry_authored_by deleted: validator bites = true
  RC7 negative (c) page moved to roadhouse-map node: validator bites = true
  RC7 negative (d) gathering window when->promise_stance: V5(ACT4_PROMISE_MADE) bites = true [truman:sheriff@10,4/PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING], norma:diner@5,2/PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING], shelly:diner@9,7/PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING], loglady:diner@4,5/PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING], james:diner@9,6/PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING], bobby:town@31,16/PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING], donna:town@44,10/PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]]
  RC7 negative (e) C2.1 classic:truman_wait3 (wrong setFlag): validator bites = true [classic dialogue truman_wait3 setFlag=undefined does not match any positive flag in ACT3_HAWK_BRIDGE.when (atto3)]
  RC2 negative (when-> not value_set warning_target): validator bites = true
V7 single-body-owner: FAIL (41 checks)
  V7 duplicate owner: ronette adapter@hospital:ronette
  V7 duplicate owner: infermiera adapter@hospital:infermiera
  V7 duplicate owner: piantone adapter@hospital:piantone
  V7 duplicate owner: piantone_ronette adapter@hospital:piantone_ronette
  V7 duplicate owner: jacques adapter@oej:jacques
  V7 duplicate owner: audrey adapter@oej:audrey
  V7 duplicate owner: truman adapter@traincar:truman
  V7 duplicate owner: hawk adapter@traincar:hawk_bridge
  V7 duplicate owner: hawk adapter@traincar:hawk_door
  V7 duplicate owner: hawk adapter@traincar:hawk_cut
  V7 duplicate owner: maddy adapter@diner:maddy
  V7 duplicate owner: leland adapter@diner:leland
  V7 duplicate owner: truman adapter@roadhouse:truman
  V7 duplicate owner: bobby adapter@roadhouse:bobby
  V7 duplicate owner: donna adapter@roadhouse:donna
  V7 duplicate owner: james adapter@roadhouse:james
  V7 duplicate owner: shelly adapter@roadhouse:shelly
  V7 duplicate owner: norma adapter@roadhouse:norma
  V7 duplicate owner: loglady adapter@roadhouse:loglady
  V7 duplicate owner: giant adapter@roadhouse:gigante
  V7 duplicate owner: hawk adapter@town:hawk_shore_first
  V7 duplicate owner: hawk adapter@town:hawk_shore_after
  V7 duplicate owner: bobby classic@town
  V7 duplicate owner: donna classic@town
  V7 duplicate owner: jacoby classic@town
  V7 duplicate owner: truman classic@sheriff
  V7 duplicate owner: andy classic@sheriff
  V7 duplicate owner: hawk classic@sheriff
  V7 duplicate owner: lucy classic@sheriff
  V7 duplicate owner: leland classic@sheriff
  V7 duplicate owner: sarah classic@palmer
  V7 duplicate owner: benhorne classic@hotel_gn
  V7 duplicate owner: audrey classic@hotel_gn
  V7 duplicate owner: gerard classic@hospital
  V7 duplicate owner: norma classic@diner
  V7 duplicate owner: shelly classic@diner
  V7 duplicate owner: loglady classic@diner
  V7 duplicate owner: james classic@diner
  V7 duplicate owner: mfap classic@redroom
  V7 duplicate owner: laura classic@redroom
  V7 duplicate owner: bob classic@redroom
  total duplicate owners found: 41 (EXPECTED > 0 until Phase 10 removes classic/adapter owners)
V8 save-determinism: PASS (24 checks)
terminal lint: PASS (4 checks)

cast-continuity-validate: V1 exactly-one PASS · V2 zero-overlaps PASS · V3 no-implicit-absence PASS · V4 order-independence PASS · RC8 order independence (Act 3 chain) PASS · V5 world-window-pins PASS · V5b scene-required-presence PASS · V6 causal-transitions PASS · V6b no-silent-vanish-entry PASS · V7 single-body-owner FAIL · V8 save-determinism PASS · terminal lint PASS
```
