# Horror re-score of Episodes 1–5 (audio only)

**Why:** on 2026-11-10 the user said: "I noticed there's no eerie or creepy background music, I think adding one will help sell it more. Make the videos more scary and horror and creepy." Measured in the phone band (200 Hz–4 kHz), the original scores sat 17–28 dB under the voice. Their drones were mostly sub-bass (31–55 Hz), which phone speakers do not reproduce.

**What changed:** each episode gets a new horror score from `scripts/horror_score.py`, added on top of its unchanged stems (voice, sound, old score). The score has:
- a mid-band drone and tremolo string clusters on each episode's own pitch cluster;
- the detuned music-box theme (A C B D♯ E · A G♯);
- reversed swells and stingers placed in the silent gaps next to each scare;
- heartbeats that race into the reveals, risers, and the existing silence holds kept silent.

The new mix is muxed onto the **existing picture, copied bit for bit** (`-c:v copy`); the frame counts match the originals. Earlier versions are unchanged. Script: `scripts/rescore_horror.py` (per-episode cue lists at the top). Provenance, cues, margins and presence for each episode are in `public/assets/audio/<version>/PROVENANCE.json`, with the new score as `stem-horror-score.flac`.

**Calibration:**
- The new score is scaled so that, in the phone band, it sits about 5 dB under the voice in the gaps.
- It ducks 7 dB under speech, and 14 dB on lines the old mix had already left tight.
- It is then backed off until every line keeps 4 dB over everything else. Where the old mix was already tighter, a line may lose at most 1 dB.
- Loudness is re-targeted to −14 LUFS, with an AAC peak check after encoding.

## Deliveries

| Episode | New version (MP4) | Stingers | Old score: speech / gaps (dB vs voice) | New score: speech / gaps | Worst line: full band / phone band (dB) | LUFS | Peak (dBFS) |
|---|---|---|---|---|---|---|---|
| 1 viral cut | `assets/videos/ep01-moon-v3/ep01-viral-cut-horror-score.mp4` | 3 | −19.4 / −21.0 | −14.2 / −5.5 | 1.7 / 2.2 | −14.0 | −1.03 |
| 2 | `assets/videos/ep02-mask-v2/ep02-the-mask-on-channel-11-horror-score.mp4` | 2 | −22.2 / −28.5 | −15.6 / −5.6 | 2.9 / 6.5 | −14.0 | −1.40 |
| 3 | `assets/videos/ep03-snow-v2/ep03-footprints-in-the-snow-horror-score.mp4` | 4 | −27.8 / −27.6 | −14.1 / −7.6 | 4.2 / 7.8 | −14.0 | −1.43 |
| 4 | `assets/videos/ep04-night-v2/ep04-rules-for-the-night-shift-horror-score.mp4` | 3 | −16.9 / −4.8 | −18.7 / −7.9 | 4.5 / 8.5 | −14.0 | −1.25 |
| 5 | `assets/videos/ep05-tent-v2/ep05-nine-hikers-one-cut-tent-horror-score.mp4` | 3 | −21.7 / −26.3 | −12.6 / −5.8 | 4.5 / 7.8 | −14.0 | −1.12 |

Notes:
- **Episode 1:** its tightest line (l01, "If you are seeing this…") was already 1.9 dB over everything in the original mix, because the frame-0 alert tone plays under it; it loses 0.2 dB. Its loop seam is a deliberate level jump: the TV switches back on into the loud alert tone of frame 0. The new score narrows that jump: the last quarter-second is −15.5 dB, against −24.9 originally.
- **Episode 2:** its tightest line (l06, "This time, he speaks.") was 3.2 dB in the original mix (it lands on the masked man's first sounds) and is now 2.9 dB.
- **Episode 4:** the old figure for the gaps (−4.8 dB) comes from its announcement chimes; the new score adds a continuous bed and stingers under and around them. The figures are for the new score alone; the old score is still in the mix.
- **Stinger placement:**
  - Episode 1: Mark in the doorway, the light over the rooftops, the TV dying.
  - Episode 2: the first mask, the mask's laugh.
  - Episode 3: the lantern rising, the window going dark (cut hard by the silence that follows), the open hatch, the hay hollow.
  - Episode 4: lights off, the filled log, before "Do not turn around".
  - Episode 5: the cedar, the file, back inside the tent.

## Checks

- All five MP4s decode with `ffmpeg -f null` without errors. Their frame counts equal the originals (1,473 / 1,762 / 1,753 / 1,673 / 1,725), and the AAC tracks run the full duration.
- **Loop seams in sound:** apart from Episode 1's designed jump, the first and last quarter-seconds of each new mix are within 0.5 dB (Episode 2: −15.0/−15.0, Episode 3: −14.4/−14.9, Episode 4: −16.3/−16.2, Episode 5: −15.3/−15.1). The drone and strings use whole-cycle frequencies over each episode.
- The captions are burned into the picture and are unchanged.
- **No listening pass** was possible in this runtime; presence and margins are measured, not auditioned. None of these versions has user approval.
