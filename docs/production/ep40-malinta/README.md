# Episode 40: "Patayin ang Ilaw" (v1), the Season 4 finale

**Delivery:** `assets/videos/ep40-malinta-v1/ep40-patayin-ang-ilaw.mp4` (1080×1920, 30 fps, 59.9 s, H.264 two-pass tuned for grain, the checked `mix.m4a` muxed with `-c copy`), with its poster `ep40-patayin-ang-ilaw-poster.png`. It has **no user approval** and **no listening pass**.

**Source:** `Ep40PatayinAngIlaw` in `src/horror/ep40/`:
- `world.tsx` (a composite of the tunnel as visitors see it; no real guide, visitor or soldier):
  - **the lateral:** a narrow concrete tunnel with an arched vault (built in short sections so the flashlights, lit per vertex, read on it), sealed at its far end by rubble, with dust trickling from the top;
  - **the main tunnel:** wider, with pairs of bed bolts in the floor along both walls (the 1942 hospital), its mouth open to the night or the dawn;
  - **the island:** a dark hill over the sea, a moon, the concrete portal lit sodium-yellow;
  - **the group:** a guide and visitors (the shared `Rider`), each with a flashlight; each beam is a spotlight with a faint additive cone;
  - **the extra figure:** an old field uniform and a round helmet, head bowed, faceless, no insignia and no side.
- `Episode40.tsx`: the shot list and the key times (shared with `scripts/ep40_sound.py`); the after-images in the black are projected from the beams' last positions and drawn on a 2D overlay.

The story is #40 in `docs/stories/season-4-philippines.md`.

## Form: "the count"

The beams are the people: one beam, one visitor. The centrepiece is the channel's longest black (about seven seconds with no light at all, after the beams go out one by one), which still has a picture: after-images of the beams fading, and at its end a dim glow on the wall where no one stands. Every shot moves; hard cuts only; an eerie score that is silent in the black; **a seamless loop** (the last shot is the hook on negative time).

| Time | Shot | Event | Line (Taglish) / English |
|---|---|---|---|
| 0.0 | A lateral, from behind the group | Seven beams on the concrete; they go out one by one | "Sa Malinta, may sandaling pinapapatay ang lahat ng ilaw." / In Malinta, there is a moment when every light is switched off. |
| 5.0 | The island at night | The hill over the sea, the tunnel mouth lit | "Corregidor. Itinayo ang tunnel na ito laban sa bomba…" / Corregidor. This tunnel was built against the bombs. |
| 9.9 | The main tunnel | The group walks; beams over the walls and the bed bolts in the floor | "…Noong 1942, naging ospital ito ng mga sugatang Pilipino at Amerikano." / In 1942 it became a hospital for wounded Filipinos and Americans. |
| 16.1 | The sealed lateral | Rubble to the vault; dust trickles down in the beam | "Noong 1945, may mga sundalong Hapon na nakulong sa loob, at may mga pagsabog. May mga lagusang gumuho na hindi na binuksan." / In 1945, Japanese soldiers were trapped inside, and there were explosions. Some laterals collapsed and were never opened. |
| 26.9 | The guide | He turns to the group; the beams gather on him | "Sa night tour, may isang hiling ang gabay." / On the night tour, the guide asks one thing. |
| 30.6 | My eyes, in the group | Seven beams; then out one by one | "Patayin ang ilaw." / Switch off the lights. |
| 34.0 | Black | After-images; breathing, drips, then more steps than there are of us; a bed frame creaks; a far bell; a dim glow where no one stands | |
| 40.9 | The lights come back | The same group | "Pagbukas ng ilaw, pareho pa rin kami. Halos." / When the lights came on, we were the same. Almost. |
| 44.4 | My beam swings back | At its edge, behind me: a man in an old helmet, head bowed | |
| 45.9 | | The lights die by themselves | |
| 46.5 | The guide's beam | It counts heads: six, and over them a seventh, the helmet | "Nagbilang ang gabay. Anim kami. Pito ang sumagot." / The guide counted. There were six of us. Seven answered. |
| 51.9 | The main tunnel at dawn | The group walks out toward the pale mouth | "Para sa lahat ng namatay rito, sa lahat ng panig. Huwag natin silang kalimutan." / For everyone who died here, on every side. Let us not forget them. |
| 58.2 | The lateral | The loop: seven beams on the concrete | |

**Hidden details:** the extra figure is already in the hook, among the group by the left wall (very dark; it may not read on a phone); seven beams in the hook for a group of six and a guide; the dim glow in the black is where he stood in the hook.

**Known weaknesses (from the stills):** the figures are the blocky shared ones; the island is dark and small; the hook's hidden figure is barely visible.

## Facts and their limits

From search summaries (Wikipedia and WW2DB on Malinta Tunnel; travel accounts of the night lateral tour; a news feature on the island's ghost stories). Used: the tunnel was built as a bombproof shelter; in 1942 its laterals held a hospital for American and Filipino wounded; in February 1945, Japanese troops trapped inside set off explosions (sources differ on the dates, 16–23 February), and some laterals collapsed and were never excavated; on the night tour, guides ask visitors to switch off their flashlights. Claimed only (told as what visitors report, never as fact): figures, soldiers, the feeling of being watched. The count of "seven" is our dramatisation.

## Care

The dead of several nations: no side is villainised; the figure has no face, side or insignia; no wound or gore; the 1945 deaths are shown only as rubble, and the explosions are stated, not depicted. A legitimate guided tour: no trespass and no "go after hours". The last line honours everyone who died there.

## Voice

ElevenLabs **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`), Taglish; both takes at once, **693 credits each (1,386)**; take 1 used (54.83 s). Split into eight lines, pauses inside a line capped at 0.24 s, **atempo 1.06** so the long black fits under 60 s.

## Sound

`scripts/ep40_sound.py`. ElevenLabs sound effects (flow `UHsHawCfAljwSC64eMFR`, about 267 credits): tunnel-3 (room tone, high-passed, looped and folded **across the loop seam**), steps-2 (the walk; single steps cut from it multiply in the black), bed-1 (the bed frame in the black), cicadas-3 (the island, cut dead at the tunnel). Synthesized: flashlight clicks for every beam out and on, the lights dying with a buzz, drips (one across the seam), dust, the slab creaking, breathing, a far handbell, a rustle, low hits, the sea and wind at dawn, a breath across the seam. **Score:** a drone on E1, a detuned string cluster (E2, F2, B2) with tremolo, an original falling music-box figure (in the tunnel and, slower, at dawn), bowed metal at the rubble, a heartbeat from the lights coming back to their dying, a reversed swell and a stinger when my beam finds him, a smaller stinger on the seventh; loop-quantised, high-passed at 100 Hz, **silent in both blacks**.

Figures (`public/assets/audio/ep40-malinta-v1/PROVENANCE.json`): bed presence −12.0 dB during speech and −4.3 dB in the gaps; every line ≥9.1 dB over everything else with no lifts (phone band ≥9.5 dB); −14.0 LUFS; decoded peak −1.27 dBFS; no stinger inside a line; the loop seam −23.5 / −23.1 dBFS.

**Mix note:** the first mix sat at −14.5 dB presence with lifts up to +6.3 dB: the score's energy was under 100 Hz, where phones don't play it. High-passing the score fixed both.

## Render

`npm run sound:ep40` then `npm run render:ep40` (stills: `npm run still:ep40`). The script deletes its Remotion bundle.
