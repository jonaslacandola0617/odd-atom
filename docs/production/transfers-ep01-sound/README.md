# TRANSFERS Episode 1 "Bayad Na": sound-only draft mix v1 (2026-11-12)

The whole episode as sound, before any picture: the 38 dialogue lines, the SFX libraries
(v1, v2, v2-long, v3) and music composed here. No credits were spent on the mix.

- **Mix:** `public/assets/audio/transfers/ep01-mix/transfers-ep01-mix-v1.m4a` (AAC 256k, stereo, 48 kHz).
- **Captions:** `transfers-ep01-captions-en.srt` (tape lines in brackets, as in the script).
- **Every placement:** `cues.json`; loudness and per-line margins: `report.json`.
- **Rebuild:** `python3 scripts/transfers_ep01_mix.py` (deterministic, about a minute).

## Timing (the picture will follow this)

The screenplay's estimate was 5:20. With every line, action and held silence given room, the
sound runs **5:57**.

| Section | Start | End |
|---|---|---|
| Cold open (the 1991 tape) | 0:00 | 0:41, hard cut to silence; title until 0:44 |
| Scene 1: the call and the box | 0:44 | 2:07 |
| Scene 2: Tape 01 | 2:07 | 4:09 |
| Scene 3: the search and the upload | 4:09 | 5:03 |
| Scene 4: the phone clip | 5:03 | 5:57 |

## What is in it

- **Tape chain** (cold open and Tape 01): 150 Hz–4.8 kHz, wow, saturation, hiss. In Scene 2 the
  tape is heard through the shop's CRT speaker (narrower band and a little room).
- **Liza's call:** speakerphone band (300 Hz–3.4 kHz) with the hospital loop behind her.
- **Composed:** an original lo-fi pop song on a cassette player at the party (I–vi–IV–V,
  plucked chords, bass, a little organ line, a drum box), the drone layer (`horror_score.drone_mid`
  plus the library drone), tape hiss, phone beeps and clicks, and the fast-forward picture search.
- **Silence shaping (as scripted):** all sound cuts with the tape at 0:41; the shop fan drops out
  when the figure is seen (2:50) and returns when Bea lies down (4:06); in Scene 4 the fan, then
  the rain, drop away; the CRT whine stops at 5:25 for total silence; one tape-breath; "Bea.";
  the shutter; four seconds of silence; the focus hunt in the black.
- **Entity signature:** `focus-hunt-long8` through the tape (2:38), `phone-focus-long6` through
  the phone (5:09), `focus-hunt-2` in the final black.

## Figures

- −14.6 LUFS integrated, decoded peak −1.29 dBFS.
- Every line is at least 3.7 dB over everything else in its window (the tightest: Nico's "Hm?"
  3.7, Tito Boy's buried "Pare, ikaw naman" 4.1, a deliberate plant, and Bea's "Pa." 4.1 over the
  focus hunt).
- The party open plays about 3 dB hotter than the shop scenes, on purpose.

## Status

Not heard by the user. These measurements are not a listening pass.
