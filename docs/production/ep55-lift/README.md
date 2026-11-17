# Episode 55 "The Lift"

`Ep55TheLift` / `src/horror/ep55/` (`world.tsx`, `Episode55.tsx`): 59.28 s, 1080×1920, English (Jack), the PSX models, a score of its own, a seamless loop.

**Story:** a taxi driver's account of a woman in a shawl asking for a lift on a hill road in Himachal at night, her feet turned backwards in his headlights (the roadside "Chudail Baudi" account, a driver's story retold locally), and churel/chudail folklore: feet turned back, a woman who died badly, never stop for her and never look back. Retold in our own words (`docs/stories/season-6-world.md`). No real road, village or shrine is named as hers. Our dramatisation: the three-channel dashcam, the hit, her getting up, the window, and the hand on the seat.

## Uniqueness (Season 6 table)

- **Mechanism:** pursuit. She gains whatever the speed: at 55 km/h on all fours behind the car, at 80 km/h at the window, and in the end she was in the car all the way down.
- **Entity:** `Character_Monster_05` (long black hair over the face, a pale body, a shirt bloodied down the front), with:
  - a built dark red shawl with a worn gold border;
  - brass ankle bells;
  - her feet turned backwards in every shot;
  - after the hit, knees that bend the wrong way, and the bones of both shins out through the skin, bleeding.
- **Form:** a three-channel taxi dashcam (CH1 FRONT, CH2 CABIN, CH3 REAR) with REC, a date stamp, a speed readout, GPS and G-sensor marks, and a fisheye vignette:
  - the zoomed playback on her feet (`▶ PLAYBACK ×4`);
  - "G-SENSOR EVENT FILE LOCKED" on the hit;
  - the cabin channel in infrared grey at night;
  - the dawn cabin footage played back.
- **Scares:**
  1. the hook: on the rear camera in red tail-light, something on all fours gaining at 55 km/h, eyes catching the light;
  2. the zoomed playback of her feet, heels first, before the line says it;
  3. the hit, cracks and blood across the windscreen, then on the rear camera she gets up on backward knees with her shins broken through;
  4. at 80 km/h she is at the window, and her palm slams the glass;
  5. at dawn, a pale hand with long nails on the back of my seat, and her face comes out from behind it.
- **Look:**
  - halogen warmth and blown highlights on the front camera;
  - the rear camera all red;
  - infrared grey in the cabin;
  - a cold dawn with the dried blood still on the glass, smeared by the wipers.
- **Sound:**
  - the diesel taxi and the wind, rising with the speed;
  - the hillside when the car stands;
  - her ankle bells (the motif; the loop joins on them);
  - the brakes and the skid, the impact, the bones, the G-sensor beep;
  - her palm on the glass and the nails on the vinyl.
  - Nothing from Episode 41.
- **Head-snap-to-lens:** not used (the last scare is a slow lean out from behind the seat). **Gore:** yes, as the slate allows: broken shins and blood on the windscreen; never a real person.

## Shots

| Shot | Time | What happens |
|---|---|---|
| rear (hook) | 0–8.38 (and the loop, 57.68–59.28) | CH3 REAR at 55 km/h: she runs on all fours in the tail-light red, gaining, her eyes catching the light |
| front | 8.38–16.05 | CH1 FRONT down the ghat road (parapets, the rock wall, deodars); she waves on the verge; I slow and stop |
| zoom | 16.05–23.29 | `▶ PLAYBACK ×4`: her feet as she walks across into the light, the toes behind, the bells on her ankles |
| front | 23.29–28.62 | she stands in the beam, her head tilting; I put my foot down; the impact: the windscreen cracks, blood runs down the glass, the G-sensor event |
| rear | 28.62–36.44 | she lies on the road behind; she gets up, knees bending backwards, bones out of her shins; she runs |
| cabin | 36.44–44.53 | CH2 CABIN in infrared at 60, 70, 80 km/h: I look left; she is at the rear window beside me; her palm and face slam the glass |
| front (dawn) | 44.53–50.39 | the road at dawn through the dried, smeared blood |
| seat | 50.39–57.68 | `▶ PLAYBACK` of the cabin at dawn: me driving; a pale hand with long nails on the top of my seat; her face comes out from behind it |

## Lessons

- **A driving car can sit still:** the taxi stays at the origin and the road passes it (a road distance `s` integrated from the speed readout, a bend `c·z²` applied to every segment, pine and parapet), so the speed readout, the picture and the sound share one speed profile.
- **A cabin camera at the mirror sees almost nothing of the side windows in portrait:** a front seat back and the B-pillar hid her at the window until the passenger seat was folded flat and she was moved behind the B-pillar. Check the sight line against every pillar and seat back.
- **Infrared for a night cabin:** grey, lit by a lamp at the lens with a steep falloff; the colour dash glow lit only the roof.
- **Feet turned backwards read only side-on:** she walks across the road in profile in the zoom; seen head-on the reversed feet looked like boots.
- **A tail light inside the figure blacks her out:** put the red light between the car and her.
- **Shawl ends hung in front from the shoulders read as a vest at full width:** keep them narrow.

## Sound

`scripts/ep55_sound.py` (stems as FLAC, `PROVENANCE.json`). ElevenLabs flow `7vtshxktumFRFK2EHMoJ` (`docs/production/ep55-lift/prompt.json`; every take and variation is in Git).

**Figures:** presence −11.0 / −3.2 dB, lines ≥6.5 dB with no lifts, −14.0 LUFS, decoded peak −2.33 dBFS, seam −21.7 / −21.7 dBFS, no stinger inside a line.

**Voice:** Jack, both takes (1,978 credits). Take 2 is used (inner pauses capped at 0.16 s, atempo 1.07); two sentences were left out to fit 60 s. **Credits:** about 2,762 in all.

## Status

Delivered; no user approval and no listening pass.

## Delivery

Rendering; the MP4 follows in the next commit.
