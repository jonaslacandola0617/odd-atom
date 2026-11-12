# Episode 27: "The Ball" (v1)

**Delivery:** `assets/videos/ep27-ball-v1/ep27-the-ball.mp4` (1080×1920, 30 fps, 55.0 s, H.264 two-pass tuned for grain, AAC 192k) with its poster `ep27-the-ball-poster.png` (frame 60: the ball rolling away down the corridor). Size and hash are in "Review of the encoded file". It has **no user approval** and **no listening pass**.

**The case:** Waverly Hills Sanatorium, Louisville, Kentucky (#27 in `docs/stories/season-3-world.md`). It is a real tuberculosis hospital, now abandoned, where investigators report voices, shadow figures and a child who plays with a ball.

## Why this episode looks and sounds like this

- **Rules:** it is built to the motion rule and the no-gimmick-transitions rule (hard cuts only).
- **Form:** an investigator's handheld **black-and-white infrared camera**, with its own IR lamp, REC, a timecode and corner marks. This is unlike Season 2's green camcorder night vision. The camera follows **the investigators' ball** through the building.
- **Scare design:** there is no jump scare; the ball does everything. The scares are small and grow (the slate's plan was "the scare never comes"; the motion rule added visible events):
  1. **The third floor (the hook):** the ball starts rolling away from us by itself, in the first half-second.
  2. **From outside:** the long five-storey block on its hill, pale trees in infrared, and our camera's lamp moving in one window.
  3. **The open-air porch:** the ball rolls ahead of us past the open bays.
  4. **The body tunnel:** walking down the steps, **the ball comes bouncing down the steps from behind us**, past us and away into the dark.
  5. **The third floor again:** the ball rolls ahead and **turns into a ward by itself**. It stops against an iron bed with a small hollow tap. Then **it rolls back to our feet**.
  6. "Roll it back." The boot nudges it into the dark. Nothing. **It comes back, fast**, and bumps the boot.
  7. The camera lifts: **two small points of eyeshine in the dark, at a child's height**. A blink. Black.
- **Sound language:** silence-heavy, no score:
  - the camera's fan;
  - the building settling;
  - the boots;
  - the ball on concrete, which carries the story.
  - The eyes get no sound at all.
- **Visual language:** handheld infrared, black and white. Foliage reads pale, as it does in real IR.

## Facts and their limits

Checked from **web-search summaries only**: Wikipedia, Asylum Projects, Mental Floss, The Vintage News, and paranormal and tour sites. Most ghost sources are tours or blogs.

| Claim in the video | Status |
|---|---|
| Waverly Hills Sanatorium, Louisville, Kentucky; a hospital for tuberculosis | Consistent: the first building opened in 1910; the large building was built 1924–1926 and opened on 17 October 1926; it closed in 1961 |
| Before there was a cure, thousands of patients died here | Consistent: streptomycin made sanatoria obsolete; the toll is in the thousands by the lower estimates |
| The bodies went down a tunnel under the hill, 500 feet long, so the living would not see them leave | Consistent with the reports: the "body chute" or "death tunnel", about 500 ft, used to move the dead (and supplies) out of sight |
| Ghost stories say 63,000 died; the records point to far fewer; still, thousands | Consistent: 63,000–64,000 is legend. One account cites an assistant medical director's autobiography for a highest yearly toll of 152, and other accounts give about 6,000 between 1926 and 1961. Figures are disputed |
| Investigators bring a ball up here; they say a little boy plays with it; they call him Timmy | Reported: investigators leave a ball on the third floor for "Timmy" |
| No record of him has ever been found | Consistent with the summaries: no record of the boy is cited |

**Not used:** the Room 502 suicide legends, inflated death tolls stated as fact, and any patient's name.

## Care

- **No patient is ever shown**, and no death is depicted.
- The tunnel is shown empty.
- The boy is told as a story with no record.
- No suicide material is used.
- The building is private property with paid tours: no trespass framing, no dares.
- The investigator is a composite.

## The cut

| Time (s) | Shot | What the picture shows | Line |
|---|---|---|---|
| 0.0 | Third floor (IR) | **The ball starts rolling away by itself** (0.45 s) | "We set the ball down on the third floor. Nobody touched it." |
| 4.8 | Outside | The block on its hill; our lamp in a window | "Waverly Hills Sanatorium…" |
| 11.3 | The porch | The ball rolling ahead past the open bays | "Before there was a cure…" |
| 16.4 | The tunnel | Walking down the steps; **the ball bounces down past us from behind** (about 23 s) | "The bodies went down a tunnel…" / "Ghost stories say…" |
| 32.9 | Third floor | The ball ahead; **it turns into a ward and stops at a bed**; **it rolls back to our feet** | "Investigators bring a ball…" / "No record of him…" |
| 46.5 | | The boot nudges it into the dark; silence; **it comes back fast**; **eyeshine at a child's height**; a blink | "Roll it back." |
| 54.6 | Black | Silence → loop | |

## Hidden rewatch details

1. **The camera's lamp in the window** of the building from outside is on the third floor.
2. **The ball turns into the ward by itself**, before the camera does.
3. **The timecode** runs on through the black of the cut to the tunnel; nobody stopped recording.
4. **The ball comes back faster** than it was sent.
5. **The eyes are at the height of a child**, about 90 cm, and they blink once.

**Open question (pinned comment):** who rolled it back?

## Sound (`scripts/ep27_voice.py`, `scripts/ep27_sound.py`)

- **Narrator:** ElevenLabs `eleven_v4`, **Jack**, English; one call on a new flow (`gvoreYbflgjzJZnEPUp1`) generated both takes (1,332 credits). Take 1 (41.5 s) is used; pauses inside a line are capped at 0.32 s; no tempo change.
- **ElevenLabs sound effects** (`eleven_text_to_sound_v2`, 4 prompts × 4 variations, 272 credits): the ball rolling on concrete, the ball bouncing down tunnel steps, the building settling, and the ball against an iron bed. They were **picked by measurement, not listening** (`prompt.json`). Episode 26's boot steps are reused, quieter.
- **Synthesized:** the camera fan, the corridor and tunnel air, the porch wind, crickets, the iron tap, the boot scuff, the bump, two soft low hits.
- **No score.**
- **Mix:**
  - **Loudness:** −14.0 LUFS; decoded AAC peak −1.55 dBFS.
  - **Bed presence** (phone band; the whole non-voice bed): −14.9 dB during speech, −9.9 dB in the gaps (silence-heavy by design).
  - **Line margins:** every line at least 9.7 dB over everything else, no lifts.
  - **Loop seam:** −15.2 dBFS at the head. The last 0.45 s is black and digital silence.

**No listening pass was possible in this runtime.**

## Reproduce

```
npm run voice:ep27      # needs public/assets/audio/eleven-takes/ep27-take1.mp3
npm run sound:ep27      # needs public/assets/audio/eleven-sfx/ep27-*.mp3 (and ep26-boots-*.mp3)
npm run still:ep27
npm run render:ep27
python3 scripts/caption_check.py src/data/ep27-ball-v1-timeline.json assets/videos/ep27-ball-v1/ep27-the-ball.mp4 out/oddatom/ep27-captions
```

## Still review passes

1. **The hook lost the ball:** the camera looked too high, so the ball rolled out of the bottom of the frame. The opening tilt is now lower.
2. **The building from outside was hidden behind its own hill**, and from too close it read as a wall. It now stands on the hill, seen from higher and further back, with no trees in front.
3. **The ball in the tunnel passed the camera too late:** it was still behind us at the moment the scene needs it. Its path is now solved so that it is level with the camera at the cue. The tunnel lamp was also strengthened.
4. **The eyes** were enlarged slightly and moved nearer the opening so they read at 180×320.

## Review of the encoded file

(filled after the render)

## Known limits

- The corridor, ward, porch, tunnel and building are composites, not a survey of Waverly Hills.
- The infrared look is a grade, not a simulation of a real sensor.
- The effects were chosen without listening.
- No user approval. Re-check every claim in a full source before posting; death-toll figures are disputed.
