# Episode 11: "The Passenger on Balete Drive" (v1)

**Delivery:** `assets/videos/ep11-balete-v1/ep11-the-passenger-on-balete-drive.mp4` (1080×1920, 30 fps, 1,639 frames, 54.6 s, H.264 two-pass tuned for grain, AAC 192k) with its poster `ep11-the-passenger-on-balete-drive-poster.png` (frame 576: the woman in white under the balete). Size and hash are in "Review of the encoded file". It has **no user approval** of the episode and **no listening pass**. The user did listen to and approve the voice test line.

**Source:** `Ep11ThePassengerOnBaleteDrive` in `src/horror/ep11/`:
- `world.tsx`:
  - **the taxi:** a white Manila taxi (left-hand drive). Inside are the dashboard and its green glow, the meter, the driver, the seats, the rear-view mirror with a rosary, sampaguita petals on the back seat and the wet mark.
  - **Balete Drive:** a two-lane road between the high walls and gates of old New Manila compounds, mango and acacia trees, old roofs, newer condominiums, and sodium lamps every 24 m.
  - **the balete:** a strangler fig with tapered trunks and curtains of aerial roots, kept off the road.
- `src/horror/entities.tsx` (new, reusable for Season 2):
  - **WhiteLady:** a ragged white dress, sloped shoulders, a neck a little too long, arms past the knees, a pale low-poly mask with unlit eye sockets and a point of light in one eye, and about 60 thin, ragged hair strands that sway, part on one side and turn the head for the reveal;
  - **`flicker()`:** seeded light dropouts, never a sine;
  - **`handheld()`:** layered camera noise.
- `Episode11.tsx`:
  - the shot list;
  - the **mirror shots**: a camera at the glass looking back, the scene mirrored by a negative-scale group (three.js flips the winding), framed by a 2D mirror with the rosary hanging in front;
  - the meter, the flicker, the reveal light, captions and the tape layer.

The story is #11 in `docs/stories/season-2-philippines.md`, the first of Season 2 (Philippine ghost stories), the first episode to the **Season 2 horror standard** (`docs/production/EPISODE_PLAYBOOK.md`) and the first in Taglish.

## Care

- A **widely reported urban legend**, told as legend ("iisa ang kuwento ng mga driver", "sabi ng iba").
- **No victim is named or shown.** No real person has ever been identified, and the video says so.
- **No violence.** The popular version in which a taxi driver kills her is dropped: it slanders a real trade, and there is no case.
- **The driver is an ordinary working man**, never a figure of fun.
- Balete Drive is a real residential street: no "go there at night" framing anywhere.

## Facts and their limits

These were checked on 2026-11-11 from web-search summaries only (Inquirer opinion pieces, ABS-CBN News opinion 2021, and Wikipedia-derived pages on Balete Drive). Wikipedia itself and the newspaper archives were not read in full.

| Claim in the video | Status |
|---|---|
| The street is named after a balete tree that once stood in the middle of the road | Consistent across sources |
| Drivers have told the same story since at least the 1950s | A 2013 Inquirer column recalls a 1950s newspaper investigation of the "white lady of Balete Drive". Other sources date the legend to the 1970s, so "mula pa noong dekada singkwenta" is the earliest reported date, not a proven origin |
| Some say she died on this road; some say she has been here since the war | Both are reported origin versions; neither is documented |
| No one has found out who she was | Consistent: no identified person |
| The tree is gone; the houses are new | Consistent: the street is now lined with newer homes and condominiums |

**Dramatisation:** the taxi, the meter starting by itself, the rosary, the petals, the wet mark, the karaoke, and the balete ahead again in the last shot.

## Story told by the picture

| # | Time (s) | Shot | What the picture says |
|---|---|---|---|
| A | 0.0 | The rear-view mirror at night: an empty back seat, petals on it, the rosary swinging | **Hook on frame 0**: "Kung dadaan ka sa Balete Drive pagkalipas ng hatinggabi, huwag kang titingin sa salamin." |
| B | 5.97 | From the back seat, between the front seats: the windshield, the sodium-lit road, the rosary in silhouette | "Ipinangalan ang kalyeng ito sa isang puno ng balete…" |
| C | 12.71 | The driver's view: the road, the walls, a balete far ahead | "Mula pa noong dekada singkwenta…" |
| C2 | 17.71 | Outside, low: a woman in white at the curb, in front of a curtain of roots, raising her hand; the taxi passes | "Isang babaeng nakaputi, sa tabi ng puno, pumapara." |
| D | 22.57 | Through the side window: she slides past; **then she is at the glass** (26.20), after the taxi has passed her | "May mga humihinto. Karamihan, hindi." |
| E | 26.50 | The meter: **it starts by itself** (26.83); the karaoke far off stops mid-song; the rosary hangs pulled back | |
| F | 27.68 | The mirror: empty | "Hindi na mahalaga. Pagtingin nila sa salamin," |
| F2 | 30.80 | The road (a glance) | |
| F3 | 31.18 | **The same mirror framing: black hair over the seat** | "…may nakaupo na sa likod." |
| G | 33.21 | **Held silence (1.3 s).** A slow push into the mirror as the dash light flickers and dies | |
| G2 | 34.51 | **The reveal (stinger in silence):** the dash light comes back on her; the hair parts on half a pale face as the head turns to the mirror | |
| H | 35.51 | The driver turns: **the back seat is empty**, a wet mark, sampaguita petals | "Sabi ng iba, dito siya namatay…" |
| I | 39.16 | High over Balete Drive: the taxi, the walls, the condominiums | "…Walang nakaalam kung sino talaga siya." / "Wala na ang puno. Bago na ang mga bahay." |
| J | 49.13 | The driver's view: **the balete ahead again**, her under it; the meter running again | "Pero hanggang ngayon, umiikot pa rin ang mga driver." |
| A | 53.02 | The hook's mirror move on negative time | **Loop** |

## Season 2 horror standard: how this episode meets it

- **Dark key:** the shots measure 7–23/255 average luma at review size (Season 1 often ran at 90–140), except the reveal (34). The light is motivated: dashboard, meter, sodium lamps (one stands under the balete), headlights.
- **Withhold, then one reveal:** a small figure at the roadside, then hair over the seat, then the one clear, lit, held reveal in the mirror (about 1 s), with the dash light rising on her face.
- **Moves when you look away:** the mirror empty (F), a glance at the road (F2), the same framing with her in the back (F3).
- **Handheld** inside the cab, a seeded flicker on the dash light, silence before the reveal, and a stinger only in silence.
- **Filipino setting and sound:** a Manila taxi with a rosary on the mirror, sampaguita, old New Manila compound walls, the balete, sodium lamps; kuliglig, a tuko, distant dogs, and a karaoke that stops.

## Viral standard

- **Hook (frame 0):** the mirror and the first line, under 1 s.
- **Length:** 54.6 s.
- **Seamless loop:**
  - the street repeats every 24 m, and the taxi travels a whole number of periods;
  - the rosary swings on a snapped period;
  - the last 1.6 s replay the hook's mirror move on negative time.
- **Hidden rewatch details:** petals from frame 0; her at the side window after she was passed; the meter starting by itself and running again at the end; the rosary pulled towards the back seat; the karaoke stopping; the balete ahead again.
- **Open question:** who was she, before she was a story?

## Sound (`scripts/ep11_voice.py`, `scripts/ep11_sound.py`, `scripts/horror_score.py`)

- **Narrator:** ElevenLabs `eleven_v4`, library voice **Juanito** (`u1CVBnSUn9JiL8ssgd2v`), in Taglish. The user chose it and approved a test line first.
  - **Test line:** four attempts were refused as "busy" (nothing charged); the fifth generated one of two takes (267 credits).
  - **Episode take:** one of two takes generated (774 credits).
  - **Processing:** split into 10 lines, with pauses inside a line capped at 0.45 s and no tempo change. The timeline was built from the real line lengths.
- **Score:**
  - a mid-band drone on G#;
  - tremolo string clusters;
  - the music-box theme, detuned from the start;
  - a reversed swell into **one stinger in silence (the reveal, 34.51 s)**;
  - a heartbeat at 70→112 bpm from "Pagtingin nila sa salamin" that **stops for the held silence**;
  - a riser and bowed metal.
- **Balete Drive:**
  - the taxi's engine and road inside, quieter outside;
  - kuliglig behind the walls;
  - a tuko calling twice; dogs far off;
  - a **karaoke far off that stops mid-song when the meter starts**, and is playing again at the end.
- **Foley:**
  - the taxi passing the balete;
  - a swell and a whip as she is at the window;
  - the meter's flag-down clack and ticks;
  - the rosary's beads;
  - the dash light crackling as it flickers;
  - a breath at the reveal;
  - the driver turning (a whip and a seat creak).
- **Library (Curio, user-authorised):** `low_cinematic_hit`, `perspective_whip`, `steel_latch` and `wood_stress`. Paths and hashes are in `public/assets/audio/ep11-balete-v1/PROVENANCE.json`. Stems are FLAC.
- **Mix:**
  - **−14.0 LUFS**; the decoded AAC peaks at **−1.41 dBFS** (limiter ceiling −1.2 dBFS).
  - **Music presence** (phone band): **−11.1 dB during speech and −3.8 dB in the gaps**, with a 7 dB duck.
  - **Line margins:** every line is 4.9–9.4 dB over everything else (full band) and 6.8–11.5 dB in the phone band. One line was lifted: l07, the whispered "may nakaupo na sa likod", by 0.4 dB.
  - **Loop seam:** the bed (score, ambience and foley) measures −24.7 / −24.8 dBFS in the first and last quarter-second. The whole mix reads −19.2 / −22.6 only because the first line starts at 0.15 s.

**No listening pass was possible in this runtime**; presence and margins are measured.

## English subtitles (for YouTube, so viewers abroad can follow)

1. If you drive Balete Drive after midnight, don't look at the mirror.
2. This street was named after a balete tree that once stood in the middle of the road.
3. Since the fifties, drivers have told the same story.
4. A woman in white, by the tree, waving down a ride.
5. Some stop. Most don't.
6. It doesn't matter. When they look in the mirror,
7. someone is already sitting in the back.
8. Some say she died here. Some say she has been here since the war. No one ever found out who she really was.
9. The tree is gone. The houses are new.
10. But to this day, drivers still take the long way around.

## Reproduce

```
npm run voice:ep11      # needs public/assets/audio/eleven-takes/ep11-take1.mp3
npm run sound:ep11
npm run still:ep11
npm run render:ep11
python3 scripts/caption_check.py src/data/ep11-balete-v1-timeline.json assets/videos/ep11-balete-v1/ep11-the-passenger-on-balete-drive.mp4 out/oddatom/ep11-captions
```

## Still review passes

1. **Everything near black** (average luma about 5/255): the materials were near-black, and the lights were too weak. The interior and street materials were lightened, the ambient and sodium lights raised, and a lamp put under the balete.
2. **The mirror glass showed nothing:**
   - a CSS flip blanked the WebGL canvas, so the scene is now mirrored by a negative-scale group;
   - the frame overlay's cut-out used a near-transparent fill style, so it removed nothing, and it now uses an opaque fill.
3. **The entity read as a chess piece** (a solid block of hair on a glowing cylinder):
   - the hair was rebuilt as thin, ragged strands with gaps;
   - the shoulders are sloped and the dress duller;
   - the neck is shaded, and a nose ridge and cheek shading were added;
   - the parted hair falls back instead of splaying like a broom;
   - the reveal camera pulls back, and the head turns towards the mirror as the hair parts.
4. **The balete read as planks,** and its roots hid the woman: the trunks are now tapered, the roots hang in clusters and stay off the road, and she stands at the curb in front of them.
5. **Camera placement:**
   - the back-seat shot was filled by a seat back, so the camera is now raised and centred;
   - the turn to the back seat put the camera inside the passenger seat, so it now sits between the front seats;
   - the wet mark looked like a hole, so it is fainter and smaller;
   - the meter's digits showed on the top face too, so the display is now a thin plate.

## Review of the encoded file

(Filled in after the render.)

## Known limits

- The street is a generic New Manila composite (walls, gates, trees, condos), not a survey of Balete Drive.
- The White Lady is low-poly by design. At phone size the reveal reads as a pale half-face with an unlit eye and an open mouth under black hair, but up close the face is simple geometry.
- The taxi interior is simplified (no doors modelled from inside, no seat belts).
- The TTS Taglish was checked by the user on the test line only; the full take has not been listened to here.
- No listening pass; no user approval of the episode.
