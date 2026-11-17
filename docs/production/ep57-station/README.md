# Episode 57 "The Station That Isn't"

`Ep57TheStationThatIsnt` / `src/horror/ep57/` (`world.tsx`, `Episode57.tsx`): 59.6 s, 1080×1920, English (Jack, three spoken lines; the rest is on screen as posts), the PSX models, a score of its own, a seamless loop.

**Story:** late one night in 2004 a woman posted to a forum, as it happened, from a train that would not stop. It stopped at a station called Kisaragi that no one could find on a map. She walked back along the line, heard drums and a small bell coming nearer, and was shouted at by a man on the tracks. A stranger offered her a lift, and her posts stopped. Retold in our own words from the 2004 thread ("Kisaragi Station"; `docs/stories/season-6-world.md`). The tunnel and the one-legged man come from retellings. The poster isn't named, nothing claims she died, and the last post and every post's wording are ours.

## Uniqueness (Season 6 table)

- **Mechanism:** wrong geometry: a station and a line that aren't on any map (the name board has no station before or after it).
- **Entities:**
  - the man on one leg, `Character_Monster_06` (a rotting ghoul, a skull face with an open mouth), standing on the rail in the tunnel mouth on his right leg, the left gone below the knee, with the bone out of the stump and blood running down (gore). He lurches at me as he shouts.
  - the driver, `Character_Killer_09` (ordinary clothes, a grinning old man's face), who stops talking and turns his head to me.
  - Both are copied from `Characters_Extras.rar` and listed in `PROVENANCE.md`.
- **Form:** a text thread. A 2004 forum's grey page shows her posts and the replies, with timestamps, each typing in with a "new post" tone. It is cut hard against the places she is posting from. Only three lines are spoken.
- **Scares:** a slow burn with long silent stretches:
  1. the name board with nothing before or after it (the hook);
  2. the drums and the bell coming nearer along the line;
  3. the man on one leg in the tunnel mouth, shouting (the stinger, then silence);
  4. the driver's silence, and his head turning to me.
- **The end:** quiet. "Battery low", then only replies, and the new-reply mark blinking.
- **Look:** the forum's grey page against mercury-vapour blue-green on the platform; a white commuter car; the phone light on the line; a dash-lit car.
- **Sound:** the thread hears where she is, quietly:
  - the train under her first posts, then the platform's lamp hum;
  - steps on ballast;
  - drums and a bell far off, nearer, cut dead by one dry shout;
  - the car, and its engine dropping when he stops talking;
  - an original two-note tone on every post.
  - Nothing from Episode 41.
- **Head-snap-to-lens:** not used (the driver's turn is slow). **Gore:** the stump.

## Shots

| Shot | Time | What happens |
|---|---|---|
| sign (hook) | 0–8.2 (and the loop, 58.0–59.6) | the name board under the mercury lamp, KISARAGI, nothing either side; a slow push in |
| thread | 8.2–14.6 | 23:14 the train hasn't stopped; "Ask the driver?"; the cab is dark |
| train | 14.6–18.4 | the empty carriage, black windows, lights sliding past; it slows |
| thread | 18.4–22.6 | it stopped: KISARAGI, not on any map; "There's no station called that." |
| platform | 22.6–26.0 | the empty platform, the lamp, the board |
| thread | 26.0–28.6 | no one, no exit; walking back along the tracks |
| tracks | 28.6–39.0 | the phone light on the line; drums nearer; the tunnel; the man on one leg; the shout (36.3) |
| thread | 39.0–45.4 | the man with one leg; then he wasn't there; a man stopped his car; DON'T GET IN |
| car | 45.4–51.6 | the driver from the passenger seat; he stops talking; his head turns to me (50.0) |
| thread | 51.6–58.0 | up into the mountains; battery low; then only replies, the new-reply mark blinking |

## Lessons

- **A forum page is a 2D overlay at 360×640:** posts laid out from the bottom up, the newest typing in; draw the title bar after the posts, or scrolled posts run over it.
- **A passenger-seat camera beside the driver sees only the windscreen:** sit it behind and to the side (0.5 m back), so his profile and his turn are in frame.
- **A leg that ends at the knee:** `['stretch', 0.02]` on the shin bone collapses the shin and the foot; a stump group placed at the knee in `useFrame` carries the gore.
- **Tube lights in a white carriage blow out:** keep the ambient near 0.5.

## Sound

`scripts/ep57_sound.py` (stems as FLAC, `PROVENANCE.json`). ElevenLabs flow `wZZL3Cd6pftFY0nBvzmw` (`docs/production/ep57-station/prompt.json`; every take and variation is in Git).

**Figures:** presence −12.6 / −7.6 dB (the long silent stretches are quiet by design), lines ≥11.2 dB with no lifts, −14.0 LUFS, decoded peak −1.43 dBFS, seam −24.4 / −23.9 dBFS, no stinger inside a line.

**Voice:** Jack, both takes (580 credits; take 1 used; three lines at fixed times; no tempo change). **Credits:** about 1,552 in all.

## Status

Delivered; no user approval and no listening pass.

## Delivery

`assets/videos/ep57-station-v1/ep57-station.mp4`, 47130370 bytes, SHA-256 `8fc8f51b28e222371e9aea9de609297aba2bb498d2cefd161691c2f83ccb9823`; 59.6 s, −14.1 LUFS (integrated, decoded), peak −1.4 dBFS; last frame against frame 0: 0.96/255 (the loop). Frames checked at 1, 10, 16, 20, 24, 30, 35, 36.5, 42, 47, 50.3 and 55 s.
