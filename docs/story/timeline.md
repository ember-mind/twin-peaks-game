---
id: timeline
source: adaptation
status: locked
owner: lead
since: 2026-09-10 (story-truth-v0.1)
---

# True event timeline (author-only)

Order of events as they happened, not as the player discovers them. T-ids are ordinal; times are given only where a source fixes them. Columns: time · place · participants · event · witnessed by · learned later by (beat) · source · provenance (source/status). `after:` names a hard ordering constraint the validator checks.

## A. Events before game start

| T | time | place | participants | event | witnessed by | learned later by | source | provenance | after |
|---|---|---|---|---|---|---|---|---|---|
| T1 | Leland aged twelve | a white house by the grandparents' lake | Leland, "un uomo che chiedeva di giocare" | The guest enters Leland's life ("ho un nome da persona perbene, piccolo. Come il tuo"). | Leland | Cooper, Truman at M10 (B7b, all methods) | M9–M10 lock §5 B7b | canon / locked | |
| T2 | years before | Twin Peaks | Laura | Laura's double life: a public serene register and a ciphered frightened one; she meets James and others in places east of town. | James, Donna (partly) | Cooper: P1 at the diary (M2), P2 at M4 | Bible §4 P1–P2 | adaptation / locked | T1 |
| T3 | repeated nights before the murder | the traincar | Laura, Jacques, others UNKNOWN | The car is a chosen, repeated place: cards dealt, a stove tended, planks worn toward town. | Jacques | Cooper by inference (M5 stove/cards, Hawk on the planks) | act-3-design-report §4; fact ledger row 7 | adaptation / locked | T2 |
| T4 | before the murder, date UNKNOWN | Palmer house | Laura | Laura hides the true diary and breaks the heart pendant (half kept, half given): deliberate custody. | nobody | Cooper: diary (M1–M2), heart halves (M2, M4) | Bible §8 Laura | adaptation / locked | T2 |
| T5 | before the murder | Palmer house | Laura | The cipher diary records the serial rule (canonical wording per facts/diary-serial-rule) and the name ROBERT. | nobody | Cooper: M2 (rule), the Robert/BOB diminutive "acquisito a parte" | Bible §4 E1 | adaptation / locked | T2 |
| T6 | before the murder, date UNKNOWN | Palmer house | Sarah | Sarah sees the stranger's face inside the house (the vision, T3 in the Bible's evidence list). | Sarah | Cooper at Act 1 (classic `sarah`: the corridor, long hair, the smile) and again at Act 4 (`sarah_visione`); Truman relays it in M4 (`truman_a2`) | Bible §4 T3, §8 Sarah | adaptation / locked | T1 |
| T7 | the night of the murder, hour UNKNOWN | the traincar | Laura, Ronette, Jacques, Leland (the third man) | Cards are dealt; the third man does not drink and watches the stove. Jacques's claim of a "midnight freight" is UNVERIFIED. | Jacques, Ronette, Laura | Cooper: Jacques's admission (M6, per tactic) | Bible §6 M6; M6 lock; facts/third-man-identity | adaptation / locked (participants) · uncertain (hour) | T3 |
| T8 | same night | the traincar | Leland, Laura | Leland kills Laura. The letter R is left under her nail. | Ronette (partly; consciousness never certified) | Cooper: R at M2 (fascicolo); the author at M10 | M9–M10 §5 B6; Bible §4 E3 | canon / locked | T7 |
| T9 | same night | the traincar | UNKNOWN hand (author OPEN) | The scene is arranged: ring centred, dust unbroken, ticket "FUOCO CAMMINA CON ME" half buried with a flap showing. | nobody | Cooper: M5 observations + ring↔dust comparison (P3) | Bible §4 E7/E8; fact ledger rows 1–2 | adaptation / locked (state) · uncertain (agent) | T8 |
| T10 | same night | footbridge over the creek, town side | Ronette | Ronette flees the car westward toward town across the planks and is found on the footbridge, alive. | the county (found) | Cooper: M5 bridge (Hawk), hospital (M4) | fact ledger row 3; Bible §8 Ronette | canon / locked | T8 |
| T11 | after the murder | Twin Peaks | the county | Investigation opens: Laura's body, the fascicolo with the letter R; Ronette hospitalised in coma. | Truman, Hawk, nurse | Cooper on arrival | Architettura §2 Atto 1 | project-fact / locked | T10 |
| T12 | three days before Cooper stands on the bridge | footbridge, town bank | the county | The county survey stake is planted on the town bank. | Hawk | Cooper: M5 bridge | M5.json m5.b1.bridge.p06 (Hawk) | project-fact / locked | T11 |

## B. Events during Acts 1–3 (player-witnessed spine; order of the frozen beat maps)

| T | time | place | participants | event | witnessed by | learned later by | source | provenance | after |
|---|---|---|---|---|---|---|---|---|---|
| T20 | day 1 | town | Cooper | Cooper arrives; Truman becomes operational ally. | player | — | Architettura §2 Atto 1 | project-fact / locked | T12 |
| T21 | day 1 | Palmer house, Laura's room | Cooper | Diary (two registers, the bosco line, the serial rule), half heart, letter R in the fascicolo: R1 double life, R2 Laura feared. | player | — | Bible §6 M1–M2 | project-fact / locked | T20 |
| T22 | night 1 | the Red Room (dream) | Cooper, Laura, the stranger at the margins | Laura whispers the name; Cooper wakes in Room 315 having forgotten it; the face is remembered. `sogno_fatto`. | player | — | Bible §6 M3, §20 decision 1 | adaptation / locked | T21 |
| T23 | day 2 (Act 2) | hospital ward | Cooper, Ronette, nurse, Gerard | Ronette's scream "BOB" when the man is spoken of; Gerard recites the fire formula; the nurse's lateral reading ("urla solo quando qualcuno le entra alle spalle"). | player | — | act-2-closure-report §2; Bible §6 M4 | adaptation / locked | T22 |
| T24 | day 2 | diner | Cooper, James | James gives the other half of the heart and the testimony "ci vedevamo nei posti oltre la strada est". | player | — | Bible §4 E6 | adaptation / locked | T22 |
| T25 | day 2 | sheriff station | Cooper, Truman | P2 presented and accepted → `atto3`; the east road opens. Ronette's visit is a hard prerequisite. | player | — | act-2-closure-report §1, §10 | project-fact / locked | T23 |
| T26 | day 2, late afternoon (Act 3) | footbridge | Cooper, Hawk | The bridge: county stake, planks worn toward town, old prints east and none returning. | player | — | M5.json m5_bridge | project-fact / locked | T25 |
| T27 | same | traincar | Cooper (Hawk outside) | Discovery; preliminary theory (impeto / withheld); mound + ticket; ring; centre; optional stove and cards; ring↔dust comparison (P3); revision. | player | — | M5.json; act-3-closure §1 | project-fact / locked | T26 |
| T28 | same, before dark | traincar | Cooper, Truman, Hawk | Truman on site: the reading contested/accepted/open; custody S1 (safe or documented pocket); Truman signs either way. | player | — | M5.json m5_report_intro, m5_s1 | project-fact / locked | T27 |
| T29 | same | north cut | Cooper, Hawk | The old prints pass the car and enter the cut; the sign beside them; `east_route_confirmed`. | player | — | M5.json m5_tracks_north | project-fact / locked | T28 |
| T30 | same evening | One Eyed Jacks | Cooper, Jacques, (Audrey) | The table; tactic; interrogation (presence admitted; one branch fact); P5; arrest attempt; Jacques breaks his leg on the county dock. | player | — | M6.json | project-fact / locked | T29 |
| T31 | ~21:10 | hospital ward | Cooper, nurse, the guard | Jacques's room guarded; the register open with Hawk's signature; "Piantonato. Firma domattina." | player | — | M6.json m6_hospital_guard | project-fact / locked | T30 |
| T32 | that night | sheriff station | Cooper, Truman, Hawk, Lucy | Night report; Cooper sent home; Lucy's phone rings. | player | — | M6.json m6_return_night | project-fact / locked | T31 |
| T33 | that night, between midnight and the shift change | hospital, Jacques's room | Leland/BOB, Jacques | **Offscreen (see C).** | nobody | Cooper via Lucy (T34) | — | — | T32 |
| T34 | that night | sheriff station | Lucy, Cooper | Lucy's call: smothered, a pillow, no witness. `jacques_dead`, P9 formulated. | player | — | M6.json m6_news | project-fact / locked | T33 |
| T35 | that night | Room 315, the mirror | Cooper, the Giant | The Giant appears (cause: trauma + mirror + method failure) and gives the three statements. `gigante1`. | player | — | Bible §6 M7; gigante1_dlg | canon (text) / locked | T34 |
| T36 | next morning | sheriff station | Cooper, Truman | Act 4 bridge: the guard is a case, the giant is not; register variant; S1 echo. `atto4`. | player | — | M6.json m6_atto4_bridge | project-fact / locked | T35 |

## C. Offscreen events occurring while the player acts

| T | time | place | participants | event | witnessed by | learned later by | source | provenance | after |
|---|---|---|---|---|---|---|---|---|---|
| T40 | Acts 1–2 | Palmer house, town | Leland | Leland "collaborates" with public mourning, too composed; he knows the investigation has restarted; he does NOT know of Cooper's dream. | Sarah (exhausted) | never as such | Architettura §3 timeline | project-fact / locked | T20 |
| T41 | Act 3 night (= T33) | hospital | Leland/BOB, Jacques | Leland/BOB passes the guard unseen and smothers Jacques; no signature in the register. He does not know the ring was found. | nobody | Cooper: the death (T34), the empty register (optional B10); the agent NEVER | Bible §6 M6, §8 BOB; Architettura §3 | adaptation / locked (author) · never certified (runtime) | T32 |
| T42 | Act 3, evening | One Eyed Jacks → town | Audrey, Truman | If Audrey went to OEJ: she returns on the eight o'clock boat, accompanied by Truman. | Truman | Cooper at the night report (variant) | M6.json m6.b7b.night.audrey | project-fact / locked | T30 |

## D. Future events already locked by existing material (not implemented in Acts 1–3; M8/M9/M10/Loggia scripts)

| T | time | place | participants | event | witnessed by | learned later by | source | provenance | after |
|---|---|---|---|---|---|---|---|---|---|
| T50 | Act 4, afternoon | diner | Maddy, Cooper, Leland | Maddy decides on the first morning coach (lake stop); Cooper's promise; Leland declares he booked the taxi (never called). | player | the lie: M9 | M8 package §0 R12, §8 T0–T0.5 | project-fact / locked | T36 |
| T51 | Act 4, evening | Palmer house | Maddy, Sarah, Leland | Maddy home; Leland/BOB already inside the house: the danger is internal, never a stranger on the road. | Sarah (senses) | — | M8 §8 T1–T2 | adaptation / locked | T50 |
| T52 | Act 4, night | Roadhouse | Cooper, the Giant | "Sta accadendo di nuovo" (`gigante2`). The player chooses whom to warn and where to run; every warning changes an action of Maddy, never the murder's path. | player | — | M8 §8 T3–T4; Bible §6 M8 | project-fact / locked | T51 |
| T53 | same night | Palmer house | Leland, Maddy | Leland kills Maddy in the house before anyone can arrive. | nobody | Cooper at M10 | M8 §1, §8 T5 | adaptation / locked | T52 |
| T54 | same night | the lake | Leland | The body is carried to the lake; the letter O is left. An anonymous civil call reports something on the shore; the station sends Hawk. Sarah does not find the body. | nobody (then Hawk / the first arriver) | Cooper: `maddy_trovata`, E9 | M8 §0, §8 T6–T7 | adaptation / locked | T53 |
| T55 | Act 4→5 | sheriff station | Cooper, Truman | The taxi register contradicts Leland (P6); P7/P8 only orient; voluntary interview as informed person, no warrant. | player | — | M9–M10 §0, §3; Bible §20 decision 5 | project-fact / locked | T54 |
| T56 | Act 5 | sheriff station, interview room | Cooper, Truman, Leland | Confession under the chosen method; the portrait shows the stranger's face while the body stays Leland; material admissions (taxi lie, traincar presence, Laura, Maddy, body transport, letters) on tape BEFORE S3; the childhood white house. | player, Truman | — | M9–M10 §5–§6; Bible §13 | adaptation / locked | T55 |
| T57 | Act 5 | the cell | Leland, Cooper | Leland dies in the cell (radiator); Cooper's closing interpretation. `leland_morto`. | player | — | Bible §13 beat 12 | adaptation / locked | T56 |
| T58 | after | Glastonbury Grove, the Lodge | Cooper, the Man from Another Place, BOB, Laura | The Lodge awake: order of encounters (player), the ring gesture if present, the answer to BOB; Laura always last ("Ti rivedrò fra venticinque anni"). | player | — | Loggia package §2, §4 | canon (Laura's line) · adaptation / locked | T57 |
| T59 | dawn | Twin Peaks | Cooper, the town, Ronette (awake, one line), Sarah (does not ask) | Epilogue; the game's last image is the town at dawn. | player | — | Loggia §2, §4 B9 | adaptation / locked | T58 |
