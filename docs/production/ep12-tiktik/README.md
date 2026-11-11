# Episode 12: "Tik-Tik" (v1)

**Delivery:** `assets/videos/ep12-tiktik-v1/ep12-tik-tik.mp4` (1080×1920, 30 fps, 1,536 frames, 51.2 s, H.264 two-pass tuned for grain, AAC 192k) with its poster `ep12-tik-tik-poster.png` (frame 467: the garlic at the jalousie window). Size and hash are in "Review of the encoded file". It has **no user approval** and **no listening pass**.

**Source:** `Ep12TikTik` in `src/horror/ep12/`:
- `world.tsx`:
  - **the house:** a wooden barrio house on stilts, one room inside and out. It has sawali walls and a yero gable roof with an **open gap between the top of the back wall and the roof**. Inside are one bulb on a cord, a jalousie window with garlic and a line of salt on its sill (with a gap), a child asleep on a banig under a kumot, Lola on a stool by the window, and a small altar with a Santo Niño and a candle.
  - **the street on a fiesta night:** houses on both sides, banderitas, a sari-sari store with a lit grille and a hand-painted sign, a videoke tent far off, street bulbs, coconut trees and the moon.
- `src/horror/entities.tsx`, additions to the Season 2 kit:
  - **Aswang:** a gaunt crouched figure, or its face alone. The face is long, narrow and pale, framed by long black hair, with deep sockets and pinpoint eyeshine, hollow cheeks, a jaw hanging open further than a jaw should, and long uneven teeth.
  - **Tongue:** long, thin and wet, in swaying segments.
- `Episode12.tsx`:
  - the shot list;
  - the seeded bulb flicker and its dropout for the silence;
  - the moonlight shaft through the gap;
  - the tongue, the face reveal and fingers gripping the wall top;
  - three subliminal frames of the face;
  - captions and the tape layer.

The story is #12 in `docs/stories/season-2-philippines.md`: an **original**, built on the tiktik belief (the fainter the sound, the closer it is). It is labelled fiction.

## The belief, and our story

- **Folklore (not ours):** the tiktik is an aswang-type creature named after its sound at night. **When it sounds faint it is close; when it sounds loud it is far.** Households protect themselves with salt, garlic and a light kept burning, and dogs bark at what people can't see. This is widely recorded in Tagalog and Visayan lore; checked from search summaries only.
- **Ours (fiction):** a fiesta night in an unnamed barrio, a lola, her grandchild, the sound coming closer, the videoke stopping, and the salt scattered from the inside.
- **Care:** no town is named. Lola is wise and right, and the camera takes her seriously. The child is never harmed: asleep and safe at dawn. The scattered salt says something was inside, not that anyone was hurt.

## Story told by the picture

| # | Time (s) | Shot | What the picture says |
|---|---|---|---|
| A | 0.0 | Inside: the bulb, the sawali back wall, the dark gap under the roof, the child asleep on the banig | **Hook on frame 0**: "Pag humihina ang tunog, hindi siya lumalayo. Lumalapit siya." |
| B | 5.55 | The street: banderitas, houses on both sides, the videoke far off, the store; a shape crouched on a neighbour's roof | "Sabi ng lola ko, nangangaso raw siya tuwing pista…" |
| C | 14.57 | The jalousie window: garlic hanging | "Nagtali siya ng bawang sa bintana." |
| C2 | 17.17 | The sill: the salt line poured, **with a gap** | "Nagbuhos siya ng asin sa pasimano." |
| D | 20.28 | The roofs from the street, a coconut tree, the moon | "Tapos narinig namin. Tik-tik. Malakas. 'Malayo pa,' sabi niya." |
| E | 27.14 | The room: Lola by the window, the child, the bulb starting to sway | "Tik… tik. Mahina na." |
| F | 29.73 | A tilt from the child up to the gap; the bulb flickers | "tik." |
| F2 | 31.86 | **Three frames of the face** (subliminal, between lines) | |
| G | 31.96 | The videoke tent: **the screen goes dark mid-song** (32.61); the dogs have stopped | "Tumigil ang videoke, sa gitna ng kanta." |
| H | 37.63 | Behind Lola: she slowly looks up at the roof | "Hindi gumalaw si Lola. Nakatingin siya sa bubong." |
| I | 41.24 | **Held silence (1.45 s)**: the bulb almost out; a long tongue lowers from the gap, in a cold shaft of moonlight | |
| J | 42.69 | **The reveal (stinger in silence)**: the bulb comes back on **the face in the gap**, sideways, jaw dropping, fingers gripping the wall top | |
| K | 43.69 | Black; a rooster crows, too early | |
| L | 44.34 | Dawn: the sill, the salt scattered | "Kinaumagahan, nakakalat ang asin sa pasimano." |
| M | 48.28 | The floor: **the salt scattered inward**, from the window across the room; the child asleep | "Mula sa loob." |
| A | 49.60 | The hook's move on negative time (night again) | **Loop** |

## Season 2 horror standard

- **Dark key:** the night shots measure 7–43/255 average luma at review size. The light is motivated: the bulb, the moon through the jalousie and the gap, the candle, the store, the street bulbs and the videoke screen.
- **Withhold, then reveal:** a shape on a far roof, a dark gap, a tongue in silhouette, then one lit reveal of the face (1.0 s) with the stinger in silence.
- **Silence:** everything stops for 1.45 s before the face (the videoke, the dogs, the crickets, the hum, the score).
- **Subliminal:** one three-frame insert, between lines.
- **Filipino setting and sound:** sawali, yero, jalousie, banig, kumot, Santo Niño altar, garlic and salt; a fiesta street with banderitas, a sari-sari store and a videoke; kuliglig, frogs, dogs, a rooster and maya birds.

## Viral standard

- **Hook (frame 0):** the dark room and the first line, under 1 s.
- **Length:** 51.2 s.
- **Seamless loop:**
  - the last 1.6 s replay the hook's move on negative time;
  - the bulb's swing and the crickets, frogs and hum are on whole cycles;
  - the videoke is playing again for the loop;
  - a soft, close tik sits just before the seam.
- **Hidden rewatch details:**
  - the gap in the salt line from its first close-up;
  - the shape crouched on a neighbour's roof in the street wide;
  - the neighbour's open, dark window;
  - the three-frame face before the videoke stops;
  - the salt scattered inward at dawn.
- **Open question:** who opened the window?

## Sound (`scripts/ep12_voice.py`, `scripts/ep12_sound.py`, `scripts/horror_score.py`)

- **Narrator:** ElevenLabs `eleven_v4`, **Juanito** (`u1CVBnSUn9JiL8ssgd2v`), in Taglish.
  - The first call was refused as busy (nothing charged). When the user asked to try again, **both takes generated** (1,324 credits). Take 1 is used.
  - Processing: split into 10 lines, with pauses inside a line capped at 0.45 s and no tempo change. The timeline was built from the real line lengths.
- **The tiktik (sound design of the belief):** a hard, wet double click, always in a gap and never on a word.
  - **loud and far** (heavy distance reverb) before "Tapos narinig namin";
  - softer and drier after each line;
  - **very soft, dry and at the left ear** after "tik.";
  - once in the silence;
  - once just before the loop seam.
- **The barrio:**
  - kuliglig and frogs;
  - dogs barking all over, until just before the videoke stops;
  - **a videoke far off that stops mid-song**, and plays again for the loop;
  - the bulb's mains hum and its crackle as it flickers.
- **Score:**
  - a mid-band drone on G;
  - tremolo clusters;
  - the music-box theme, detuned;
  - a heartbeat at 68→116 bpm from "Tik… tik" to the silence;
  - a riser;
  - **one stinger in silence (the face, 42.69 s)**;
  - bowed metal at dawn.
- **Foley:**
  - garlic tied and salt poured;
  - Lola's stool creaking;
  - wet clicks as the tongue lowers;
  - a swell and a whip on the subliminal face;
  - a breath at the face;
  - a rooster in the black;
  - maya birds at dawn.
- **Library (Curio, user-authorised):** `wood_stress`, `perspective_whip` and `low_cinematic_hit`. Paths and hashes are in `public/assets/audio/ep12-tiktik-v1/PROVENANCE.json`. Stems are FLAC.
- **Mix:**
  - **−14.0 LUFS**; the decoded AAC peaks at **−1.05 dBFS**.
  - **Music presence** (phone band): **−10.7 dB during speech and −3.2 dB in the gaps**, with a 7 dB duck.
  - **Line margins:** every line is 5.2–11.6 dB over everything else (full band) and 5.7–13.1 dB in the phone band. No line needed a lift.
  - **Loop seam:** the bed (score, ambience and foley) measures −25.8 / −25.4 dBFS in the first and last quarter-second.

**No listening pass was possible in this runtime**; presence and margins are measured.

## English subtitles (for YouTube)

1. If the sound is getting quieter, it isn't leaving. It's getting closer.
2. My lola said it hunts on fiesta nights, when the videoke is loud and nobody hears the dogs.
3. She tied garlic to the window. She poured salt on the sill.
4. Then we heard it. Tik-tik. Loud. "Still far," she said.
5. Tik… tik. Quieter now.
6. tik.
7. The videoke stopped, in the middle of the song.
8. Lola didn't move. She was looking at the roof.
9. In the morning, the salt on the sill was scattered.
10. From the inside.

## Reproduce

```
npm run voice:ep12      # needs public/assets/audio/eleven-takes/ep12-take1.mp3
npm run sound:ep12
npm run still:ep12
npm run render:ep12
python3 scripts/caption_check.py src/data/ep12-tiktik-v1-timeline.json assets/videos/ep12-tiktik-v1/ep12-tik-tik.mp4 out/oddatom/ep12-captions
```

## Still review passes

1. **First pass (provisional timeline):**
   - the hook showed only sawali and the roof;
   - the street, roofs and videoke were near black;
   - the tongue read as a red-and-white candy cane;
   - the face sat straight over the wall like a cartoon;
   - Lola and the tongue went black when the bulb dropped out.

   The fixes:
   - the hook was reframed from the front of the room;
   - exterior ambient and moon were raised, with street bulbs and a brighter store;
   - the tongue now uses dark flesh tones;
   - the bulb dropout keeps 20 %, with a cold shaft of moonlight through the gap and a candle on the altar.
2. **The face** was hidden behind the wall plate, then read as a goofy potato with glowing square eyes and zipper teeth. Rebuilt:
   - a narrow pale face framed by long black hair;
   - pinpoint eyeshine in deep sockets and hollow cheeks;
   - a dropped jaw with a few long, uneven teeth;
   - raised into the gap and tilted sideways;
   - the camera higher, the yero darkened behind it.
3. **The street was empty** (the houses were off-frame): houses now line both sides, and the videoke tent has string lights. Lola was reframed behind her shoulder, and the tongue thickened.
4. **On the real timeline**, every shot reads.

## Review of the encoded file

(Filled in after the render.)

## Known limits

- The shape on the neighbour's roof is very small at phone size: a rewatch detail at best.
- Lola and the tongue in silhouette are deliberately dark; on a dim phone screen they may read as black.
- The face is still low-poly; it is frightening by framing (sideways in a gap, the jaw too far open), not by detail.
- No listening pass; no user approval.
