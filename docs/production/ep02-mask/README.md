# Episode 2: "The Mask on Channel 11" (v1)

**Delivery:** `assets/videos/ep02-mask-v1/ep02-the-mask-on-channel-11.mp4` (1080×1920, 30 fps, 1,762 frames, 58.7 s, H.264 CRF 22 tuned for grain, AAC) with its poster `ep02-the-mask-on-channel-11-poster.png` (the mask on the CRT, second intrusion). Encoded-file figures and the sha256 are in the review section below. It has **no user approval** yet.

**Source:** `Ep02MaskOnChannel11` in `src/horror/ep02/` (`world.tsx` holds the sets; `Episode02.tsx` holds the shot list, the TV feeds, lighting cues, captions and the tape layer). The people reuse `Human` from `src/horror/ep01/world.tsx`. The story is the true script #1 in `docs/stories/season-1-shorts.md`, rewritten as 11 shorter present-tense lines for the viral standard.

## The true story and how its facts were checked

On Sunday 22 November 1987, an unknown person in a rubber mask hijacked two Chicago TV signals. About 9:14 pm, WGN-TV's sports report cut to black, and a man in a mask swayed in front of a turning sheet of corrugated metal for roughly 25 seconds, with no voice, only a buzz. WGN's engineers switched the signal and the anchor came back. About two hours later (widely reported as around 11:15 pm), the intruder took over WTTW, Chicago's channel 11, during a *Doctor Who* rerun. This time there was distorted audio: laughing, moaning, humming a cartoon theme, a soda can held up, and finally the masked man bent over and swatted with a flyswatter by a hand from off screen. It lasted about 90 seconds; nobody was at the transmitter to stop it. The FCC investigated, and no one has ever been identified or charged.

- **Re-checked on 2026-11-10** with web search summaries of Wikipedia, the A.V. Club, Mental Floss, InsideHook, the Chicago Sun-Times and WTTW's own 30th-anniversary article. The page fetches for `en.wikipedia.org` and `news.wttw.com` were **blocked by this environment's network policy**, so the check rests on search-result summaries, not full articles. The date, stations, channel 11, the sports report, the rough 25 s and 90 s durations, the two-hour gap, the *Doctor Who* rerun, the distorted audio, the flyswatter, the FCC investigation and the unsolved outcome were corroborated by more than one summary. **Before publishing, re-read the primary articles for the soda-can and flyswatter details**: the summaries mentioned them, but only one gave the surrounding text.
- **No suspect is named or implied.** The video, the publishing kit and this README name nobody. Pinned-comment guidance asks the channel to hide comments that name people.
- **Nothing violent is shown.** The flyswatter scene is a prank: the masked man drops out of frame and only a silhouetted hand and swatter swing in from the edge. You hear three light plastic thwacks through the TV speaker.
- **No real broadcast footage or audio is used.** The intruder is an original low-resolution drawing of a pale mask with dark glasses, never a real face. All his sounds are synthesised. His hummed tune is an **original** melody, not the cartoon theme. The soda can has no brand. The sports anchor, the sci-fi show (a lighthouse in fog) and the TV listing are generic inventions.
- **Fictional touches** (cinematic, not presented as fact): the man in the armchair, his apartment, the engineer at the switch, the empty transmitter room and the two-frame mask hidden in the closing static. The station rooms are not models of WGN's or WTTW's real facilities.

## Story told by the picture

The archive voice confirms; the picture carries the story. Each line below gives its time in seconds.

| # | Time | Shot | What the picture says |
|---|---|---|---|
| A | 0.0 | ECU on the CRT: the mask sways in front of the turning metal | **Hook on frame 0**: he is already in your TV. "This face cut into your television. Twice." |
| B | 4.4 | Wide over the Chicago rooftops to the transmitter tower | Where we are; the tower that will carry him |
| C | 6.9 | Wide from behind the armchair: a man's silhouette against the Sunday sports | Ordinary night; the wall clock reads 9:14 |
| D | 9.9 | Slow push on the TV past the chair | The report cuts to black, then he is there. Buzz |
| E | 13.4 | MCU of the viewer from the TV's side | He leans in |
| F | 16.3 | Master control: the engineer's back, a wall of monitors (on-air mask, preview anchor) | He throws the switch |
| G | 19.3 | Low TV shot that includes the VCR: the anchor is back and looks around | **REC CH09**: someone was taping |
| H | 22.6 | The tower top: dishes, mast, red beacon | "Two hours later" |
| I | 25.4 | ECU wall clock | 11:15 |
| J | 26.9 | Insert of the listing: **11:00 · 11 · DR.WHO** circled | What he is about to interrupt |
| K | 28.2 | ECU CRT: a lighthouse sci-fi show → black → the mask, now speaking | "This time, he speaks." Warped laugh, humming |
| L | 32.6 | Push in: he holds up a can | Escalation |
| M | 34.4 | Side wide: the viewer gets up and backs away from the TV | Fear, without words |
| N | 36.4 | The transmitter room: the mask on the air monitor, an empty chair, a flickering tube, the beacon through the window | "Nobody can stop him": nobody is there |
| O | 39.4 | ECU CRT, slight dutch angle: he bends out of frame; a hand with a flyswatter swings in from off screen | The ending of the intrusion, implied and off-screen |
| P | 44.4 | Through the blinds: the tower blinking over the city | Searched, never charged; he is still out there |
| Q | 49.0 | Same framing as C: the armchair is empty, the TV is static | The viewer has gone; the clock reads 11:17 |
| R | 53.7 | Slow push into the static, landing on frame 0's framing | "Or how easily he got into yours." The static resolves into the mask: **loop** |

## Viral standard

- **Hook (frame 0):** the mask, the buzz and a second-person first line ("This face cut into your television. Twice.").
- **Length:** 58.7 s (the target is 45–60 s).
- **Seamless loop:** from 58.13 s the static resolves into the mask, drawn on "negative" time, with the camera on frame 0's exact position. The last frame flows into frame 0. In sound, every continuous tone, the beat between the drone's two detuned partials and the slow LFOs are snapped to a whole number of cycles over the episode (`qf()` in `scripts/ep02_sound.py`), so the last sample has the same phase as the first. The buzz is running at both ends.
- **Hidden rewatch details:**
  1. The VCR is recording the whole time (**REC**), switching from **CH09** to **CH11**. Home tapes are why this broadcast survives.
  2. The listing on the coffee table already has **11:00 · channel 11** circled before the second intrusion.
  3. The wall clock reads the reported times: **9:14** during the first intrusion and **11:15** during the second.
  4. A **two-frame mask** flashes in the closing static at 55.3 s, with a two-frame buzz.
- **Open question:** who was under the mask? And, for the pinned comment, what would you have done if it was your TV?

## Cinematography

- **One world:** the apartment's east window looks at the same tower seen in shots B, H and P. The TV, the clock, the chair and the VCR keep their places across every cut. The CRT texture is the same canvas on the living-room TV, the master-control monitors and the transmitter-room monitor, so what is "on the air" agrees everywhere.
- **Shot sizes by purpose:** ECUs of the screen for information, inserts (clock, listing, VCR) for the hidden details, wides for geography and absence (C and Q are the same frame, with and without the man).
- **Motivated light:** the TV is the key in the apartment and changes colour with the feed (blue for sports, green for the sci-fi show, white for the mask and static). There are cool fluorescents in master control, and one flickering tube and the red beacon in the transmitter room.
- **Movement:** slow pushes and dollies with hard cuts; one slight dutch angle on the flyswatter shot.
- **Text:** only diegetic text (the SPORTS lower third, the listing, the VCR display) plus narration captions above the Shorts interface zone.

## Look

180×320 render, upscaled 6× nearest-neighbour; PS1 vertex snapping, Bayer dither and 32 px procedural textures (wallpaper, wood panelling, carpet, brick, facades). The TV feeds are 128×96 canvases with a rolling sync bar, line tearing and dropouts. The tape layer (chromatic offset, overlay noise with a tracking band, scanlines, vignette) is heavier on the black and roll moments.

## Sound (`scripts/ep02_voice.py`, `scripts/ep02_sound.py`)

- **Voice:** espeak-ng with MBROLA **us1** (rate 150, pitch 28), a second, distinct voice from Episode 1's us2 alert voice. It is an archive narrator: light band-limit, soft saturation and a small room, not a TV speaker. MBROLA us3 was tried and rejected because it lacks the `O2` phoneme and silently drops the vowels in "gone", "on" and "off".
- **The TV:** the intruder's carrier buzz (59.94 Hz square harmonics plus noise), generic sports-anchor murmur (us2, invented words), a sci-fi show bed (sea and a theremin-like tone), clicks into black, static, a flyback whine. His second-intrusion sounds are espeak-ng moans and laughter put through modulated varispeed, a bit-crusher and a TV-speaker band-pass. There is an original hummed tune, a ring-pull hiss and three flyswatter thwacks. His sounds duck 8 dB under narration.
- **Original score:** a beating E1/B1 drone; an E3–F3–B3 cluster pad (minor second plus tritone) joined by a C4 after the intrusion; a six-note chime "station ident" motif over the city that returns slower and a quarter-tone flat over the empty chair. The score drops to near silence on both cuts to black.
- **Foley:** apartment room tone and a wall clock (apartment shots only), city traffic and a far siren, chair creaks when he leans in and gets up, three backward footsteps, a fluorescent tube buzz.
- **Library (Curio, user-authorised):** `cavern_lowwind` (tower), `mission_control` (master control), `steel_latch` (the switch), `radio_noise_bed` (transmitter room), `wood_stress` (chair), `heartbeat_breath` (the viewer backing away), `low_cinematic_hit` (first appearance), `suspense_riser` and `restrained_boom` (second appearance), `lost_signal` (static). Paths and hashes are in `public/assets/audio/ep02-mask-v1/PROVENANCE.json`; stems are committed as FLAC.
- **Mix:** loudness-targeted to **−14.0 LUFS** integrated with a soft limiter; the decoded AAC peaks at **−1.5 dBFS** (checked after encoding, because AAC overshot the limiter on the clipped buzz in the first pass). Voice margins are measured from the stems in each line's window:

| Line | Voice − score (dB) | Voice − all other stems (dB) |
|---|---|---|
| l01 | 12.8 | 10.8 |
| l02 | 8.5 | 8.2 |
| l03 | 6.7 | 5.9 |
| l04 | 8.4 | 7.0 |
| l05 | 8.3 | 5.3 |
| l06 | 5.7 | 3.2 |
| l07 | 9.6 | 6.4 |
| l08 | 11.5 | 9.9 |
| l09 | 12.4 | 8.5 |
| l10 | 10.3 | 8.7 |
| l11 | 10.5 | 9.0 |

Every line is at least 5.7 dB above the score. Against everything else, l06 ("This time, he speaks.") is the closest at 3.2 dB, because it deliberately lands on the restrained boom and his first moan. Its caption carries it. **No listening pass was possible in this runtime**; the balance is measured, not auditioned.

## Reproduce

```
npm ci
apt-get install -y espeak-ng mbrola mbrola-us1
npm run voice:ep02      # python3 scripts/ep02_voice.py
npm run sound:ep02      # python3 scripts/ep02_sound.py
npm run still:ep02      # review stills in out/oddatom/ep02-mask-v1/
npm run render:ep02     # MP4 + poster into assets/videos/ep02-mask-v1/
python3 scripts/caption_check.py src/data/ep02-mask-v1-timeline.json assets/videos/ep02-mask-v1/ep02-the-mask-on-channel-11.mp4 out/oddatom/ep02-captions
```

Rendering uses software WebGL (`gl: 'swangle'`, set in the script).

## Still review passes

1. The CRT picture was hidden behind its own bezel (the screen plane was behind the front face of the box). Moved it in front.
2. The viewer and engineer were in place but lost in silhouette. A debug render with a red shirt and a top-down camera confirmed the viewer was seated correctly. The wide (C/Q) was reframed so his head sits beside the glowing screen. A cool back fill was added. The over-the-shoulder shot D became a push past the chair, because his head filled the frame at that distance. The master-control camera moved behind the engineer's shoulder.
3. City shot B was raised so the tower reads against the sky, with larger beacons and a glow. The tower top (H) was lit. The blinds (P) hid the city behind a glow plane, and the camera saw wall above the window: the glow plane is now hidden for that shot, the slats are thinner, and the camera sits low and close, looking up at the beacon.
4. The clock insert was widened and the listing raised so **11:00 · 11 · DR.WHO** reads in full. The flyswatter shot was pulled back so the whole screen is in frame.

## Known limits

- Faces are deliberately minimal (PS1 style); the viewer's face in E reads as uncanny.
- In P, the blinds are bold dark bands and the tower is small; it reads as a mood shot, not as information.
- The engineer in F is mostly a shape at the frame edge; the switch and the monitors carry the beat.
- The intruder's sounds are synthesised approximations; they are not, and do not try to be, the real audio.
- Fact check limits are above: the primary article fetches were blocked.
- No listening pass; no user approval.
