# Episode 54 "Monitor"

`Ep54Monitor` / `src/horror/ep54/` (`world.tsx`, `Episode54.tsx`): 46.46 s, 1080×1920, English (Jack; the voice in the speaker is Grizzy), the PSX models, a score of its own, a seamless loop.

**Story:** a babysitter's account in a thread of baby-monitor experiences (collected in a roundup with more than 200 replies): two infants asleep upstairs, and on the monitor a thin, still figure standing over a crib while a voice comes through the speaker. Retold in our own words (`docs/stories/season-6-world.md`); the country is changed to a Canadian winter; no family or town is named. Our dramatisation: the corner, the pan, the refreshes, and the monitor in my hand at the end.

## Uniqueness (Season 6 table)

- **Mechanism:** hidden in plain sight. It is in the corner from frame 0 with no sound cue; the viewer finds it before I do.
- **Entity:** `Character_Monster_04` (a gaunt figure in a dark dress, a skull face with the jaw hanging open), 2.3 m tall. It never moves on screen: between two refreshes it is bent double over the crib; between two refreshes it is behind me.
- **Form:** a baby monitor: the handheld unit in my hands, its 4:3 night-vision picture refreshing six times a second, with its temperature, signal, battery, clock, sound-level LEDs and pan buttons (lit while I hold them).
- **Scares:** (1) it is in the corner from frame 0; (2) the sound LEDs jump in a silent room, then a voice in the speaker: "Shhh… They're sleeping. Don't come up."; (3) I pan to the door and back: it is bent over the crib (a static burst); (4) I run up and switch on the light: nobody, the twins asleep and safe; on the monitor in my hand, in colour, it is bent over my shoulder, its skull face turned up to the camera (feedback and static).
- **Look:** monochrome green night vision with an infrared falloff (bright near the camera, the far corner dark), scanlines and noise; the house lamp-lit; the lit nursery warm.
- **Sound:** the monitor's hiss, the LED ticks, the speaker voice, the pan motor, the static burst, the stairs, the door and light, the feedback. Nothing from Episode 41.
- **Head-snap-to-lens:** not used. **Gore:** none (as the slate says).

## Shots

| Shot | Time | What happens |
|---|---|---|
| mon (hook) | 0–4.4 (and the loop, 45.06–46.46) | the monitor in my hands: the cribs, the mobile, the snow at the window, and something too thin standing still in the corner |
| couch | 4.4–7.9 | me on the couch in the lamp light, the monitor glowing in my hands |
| mon | 7.9–33.05 | the LEDs jump; the voice; I pan to the door and back: it is bent over the crib; held through the line |
| stairs | 33.05–34.45 | black: my feet on the stairs |
| lit | 34.45–39.15 | the door bursts open, the light: the nursery, nobody in the corner, the twins asleep |
| hand | 39.15–45.06 | the monitor in my hand, in colour: me in the room; between two refreshes, it is bent over my shoulder, looking up at the camera |

## Lessons

- **Two `ThreeCanvas` views in one frame:** the background world (my eyes) and the monitor's own small 4:3 canvas (its camera, its refresh rate). The device is a 2D overlay with the screen cut out of it (`clearRect`), drawn above the screen so its OSD and scanlines sit on the picture.
- **A refresh rate sells the monitor and hides the motion:** the screen's scene runs on time quantised to 1/6 s, so a figure that moves between two refreshes simply appears in its new pose.
- **Night vision needs an infrared falloff, not a dark grade:** a strong light at the camera with a steep decay and almost no ambient; then a faint fill where the figure stands, or a dark-dressed figure vanishes.
- **A foreground prop in night vision reads as a figure:** the rocking chair was removed.
- **For a reveal on a camera above, turn the figure's face up to it** (`lookUp`): bent over my shoulder with its face to the floor it read as a dark mass.
- **The generated monitor-hiss loops were nearly silent** (about −47 to −73 dB): the hiss is synthesized.

## Sound

`scripts/ep54_sound.py` (stems as FLAC, `PROVENANCE.json`). ElevenLabs flow `3JiSPiXPisi0ASA1us0u` (`docs/production/ep54-monitor/prompt.json`; every take and variation is in Git).

**Figures:** presence −12.6 / −4.1 dB, lines ≥9.7 dB with no lifts, −14.0 LUFS, decoded peak −1.18 dBFS, seam −25.3 / −25.4 dBFS, no stinger inside a line.

**Voice:** Jack, both takes (1,044 credits; take 1 used; inner pauses capped at 0.22 s; no tempo change); the speaker voice Grizzy, both takes (172 credits; take 1 used). **Credits:** about 2,060 in all.

## Status

Delivered; no user approval and no listening pass.

## Delivery

`assets/videos/ep54-monitor-v1/ep54-monitor.mp4`, 37164407 bytes, SHA-256 `c51820e01b5a9d7c30958910c442f384e05bc22924c75e102acdc81ec3a24482`; 46.5 s, −14.1 LUFS (integrated, decoded), true peak −1.1 dBFS; last frame against frame 0: 1.1/255 (the loop). Frames checked at 1, 6, 12, 23.4, 26, 34, 37, 40 and 42.5 s.
