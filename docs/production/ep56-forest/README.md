# Episode 56 "The Music in the Forest"

`Ep56TheMusicInTheForest` / `src/horror/ep56/` (`world.tsx`, `Episode56.tsx`): 56.1 s, 1080×1920, English (Jack), the PSX models, a score of its own (an original gamelan phrase), a seamless loop.

**Story:** students on a six-week village posting in East Java are given one rule: never go past the stone gate into the forest. At midnight gamelan plays out there, where no one lives, and a friend follows it, and a dancer who is not from the village. Retold in our own words from the 2019 thread *KKN di Desa Penari*, which its poster said was a family friend's experience (`docs/stories/season-6-world.md`). No village is named. The thread's claimed deaths are not stated, and the friend's fate is left open. Javanese belief is treated with respect: the students broke the rule, not the village. Our dramatisation: the single torch walk, her nearer each time the beam returns, the stream.

## Uniqueness (Season 6 table)

- **Mechanism:** the lure. The music calls you to it: my friend walks in time to it, and so does the camera.
- **Entity:** `Character_Monster_07` (a skull face on a dark ragged body), dressed as a court dancer: a headdress, a green scarf from her shoulders and a batik cloth from her hips. She floats a hand's width above the leaves, in a slow dance pose. Her arms reach for the light and stretch far too long. She is a guardian of the forest and is never mocked.
- **Form:** a single unbroken take. One torch walk: my eyes and the beam are the same view. There are no cuts until the loop.
- **Scares:**
  1. the gamelan starts where no one lives; past the gate, in the black, she holds a dance pose (the hook);
  2. my friend ahead doesn't answer, and walks in time with his head tilting;
  3. each time the torch swings into the trees and back, she is in the path, nearer;
  4. the torch drops to her feet hanging above the ground, then rises as her arms reach, too long; the torch dies and the music stops dead;
  5. at the stream, the gong: my friend sitting in the water, his arm swollen black with bites, snakes coming out from under his sarong (gore);
  6. the torch rises from him to her, standing over him; on the last beat she comes forward at the light as the whole ensemble crashes in.
- **Look:** one torch cone in green-black jungle haze, fog at 15 m, the dark closing in round the beam.
- **Sound:**
  - humid night insects that thin as the music nears and fall silent while she is in the light;
  - my steps in wet leaves;
  - an original gamelan phrase (synthesized), far and wet at first and nearer with every swing;
  - the stream, one bronze gong struck close, snakes, the torch switch.
  - Nothing from Episode 41.
- **Head-snap-to-lens:** not used. **Gore:** the bitten arm and the snakes; never a real person.

## The walk (one take)

| Time | What happens |
|---|---|
| 0–10.5 (and the loop, 54.5–56.1) | at the stone gate; past it in the black, a dancer holding a pose; the gamelan starts at 8.0 |
| 10.5–19.0 | through the gate: my friend ahead on the path, walking in time, his head tilting |
| 19.0–27.5 | three times the torch swings into the trees and back; each time she is in the path, nearer (11, 7.5, 4.8 m) |
| 27.5–34.8 | I stop: the torch drops to her feet above the ground, rises as her arms reach; the torch flickers and dies; she is gone, the music stops |
| 35.3–47.3 | on to the stream; the gong (37.0): my friend in the water, his swollen arm; the torch moves to the sarong and the snakes |
| 47.3–54.5 | the torch rises from him to her, standing over him; on the last beat (52.95) she comes forward at the light |

## Lessons

- **A walk in one take is a distance table:** the camera's distance is integrated from a walking speed (stopped while she is in the light) and scaled to reach the stream bank on the gong; her positions are set against that distance at each return of the beam.
- **Check every position helper over the whole take:** the third return's position ran on into the next beat, so she stood 2.8 m away instead of 4.4.
- **A torch walk needs a light at what the torch is on:** the spot light alone left her a silhouette at 4 m; a small point light at the look target, in front of it, lights her face.
- **A batik pattern at 180 px turns into letters:** small staggered dots in two close tones read as cloth.
- **Bright green scarf boxes under a torch read as planks:** keep them thin and dark.
- **Music in the ElevenLabs connector is out of reach** (the restricted connector refuses music), so the gamelan is synthesized: inharmonic partials, paired detuning for the shimmer, the bonang at double time.

## Sound

`scripts/ep56_sound.py` (stems as FLAC, `PROVENANCE.json`). ElevenLabs flow `BoVFiRL9l7kX81Lmck7B` (`docs/production/ep56-forest/prompt.json`; every take and variation is in Git).

**Figures:** presence −8.8 / −2.8 dB, lines ≥5.3 dB with no lifts, −14.0 LUFS, decoded peak −1.76 dBFS, seam −28.1 / −27.0 dBFS, no stinger inside a line.

**Voice:** Jack, both takes (1,526 credits; take 1 used; inner pauses capped at 0.22 s; no tempo change). **Credits:** about 2,206 in all.

## Status

Delivered; no user approval and no listening pass.

## Delivery

`assets/videos/ep56-forest-v1/ep56-forest.mp4`, 44352423 bytes, SHA-256 `2ff875dc5765575cb1893c689b6bdc8594d1a54860d75213f0474267d8be85a7`; 56.1 s, −14.1 LUFS (integrated, decoded), peak −1.8 dBFS; last frame against frame 0: 0.4/255 (the loop). Frames checked at 1, 14, 21, 24, 29, 33, 35 (the torch dead), 38, 44, 49 and 53.1 s.
