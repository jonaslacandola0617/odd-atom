# Eerie ElevenLabs narration for Episodes 1–6 (audio only)

**Request (2026-11-10):** "i connected elevenlabs, should we change the current voiceover? its robotic … changing it into something eerie voicover will make it go viral? if so change ep1-6."

**Recommendation given:** yes, change it. A flat robotic voice works as a *diegetic* device, such as an emergency broadcast or a tape, but as a narrator it reads as cheap text-to-speech to many viewers, and they may swipe away before the hook lands. A calm, dark, human-sounding narrator is the norm on high-retention horror shorts. Nothing guarantees views.

The two diegetic episodes keep their framing:
- **Episode 1:** the new voice runs through a TV broadcast chain (band-limited, slightly driven, small room).
- **Episode 4:** the new voice runs through a tape chain. The door line is the *same* voice heard through a door (low-passed, more room). Keeping it the same voice keeps the "recognise the voice" twist.

## Voices (ElevenLabs connector, model `eleven_v4`)

| Use | Voice | Episodes |
|---|---|---|
| True cases (the archive narrator) | **Jack – Deep Dark Horror Narrator** (`BVPhWQykET1TSvfGzrUr`): deep, cold, calm | 2, 3, 5 |
| Fiction (the channel's fiction voice) | **True – Crime & Horror Narrator** (`tZssYepgGaQmegsMEXjK`): whispery, dark, calm | 1, 4, 6 |

**How the takes were made:**
- Each episode is **one performance**: the script's lines, unchanged word for word, with `[long pause]` between lines.
- Audio tags shape the delivery: `[softly]` throughout, `[whispers]` on each episode's last line and its key beat ("Us.", "This time, he speaks.", "None lead away."), and `[trembling voice]` on the Episode 6 reveal.
- "Hinterkaifeck" is given as IPA (`/ˈhɪntɐkaɪfɛk/`).
- Every prompt is in `prompts.json`, and the takes are in `public/assets/audio/eleven-takes/`.

## How the voice was fitted (`scripts/revoice_eleven.py`, `scripts/eleven_split.py`)

1. **Splitting the take into lines.** The take is split at silences chosen by dynamic programming: long silences are preferred, and each segment's length should match its share of the script.
   - Episodes 2, 5 and 6 have clean pauses of 0.8–1.8 s between lines.
   - Episode 3 was read with shorter pauses (0.3–0.8 s). Its split was cross-checked line by line: the syllable peaks in each segment match the vowel counts from espeak's phonemes (for example, 12 against 12, 4 against 4, and 20 against 17 for the Hinterkaifeck line).
2. **Placing the lines.** Every line starts at its **original start time**, so the burned-in captions and the picture stay in sync.
   - A take longer than its slot is tightened with `atempo`, by at most 1.12×. Only two lines needed it: Episode 3 l02 at 1.05× and l03 at 1.09×.
3. **Level.** Each line is matched to the old voice line's RMS, so the horror score's ducking and calibration still hold.
   - Any line left under 4.5 dB over everything else is lifted, by at most 3 dB. The largest lift is Episode 2 l06 ("This time, he speaks."), +2.1 dB, which lands on the masked man's first sounds.
4. **The mix.** The new voice is mixed with the episode's unchanged stems: sound, the old score, and the horror score from the re-score.
   - Loudness is re-targeted to −14 LUFS, with a decoded-AAC peak check.
   - The result is muxed onto the existing picture with `-c:v copy`, so frame counts are unchanged. Earlier versions are kept.

## Deliveries

| Episode | MP4 | Frames | Music during speech / in gaps (dB vs voice) | Worst line: full band / phone band (dB) | LUFS | Peak (dBFS) |
|---|---|---|---|---|---|---|
| 2 | `assets/videos/ep02-mask-v3/ep02-the-mask-on-channel-11-eerie-voice.mp4` | 1,762 | −13.7 / −4.5 | 4.5 / 4.4 | −14.0 | −1.46 |
| 3 | `assets/videos/ep03-snow-v3/ep03-footprints-in-the-snow-eerie-voice.mp4` | 1,753 | −11.6 / −5.8 | 4.5 / 5.9 | −14.0 | −1.22 |
| 5 | `assets/videos/ep05-tent-v3/ep05-nine-hikers-one-cut-tent-eerie-voice.mp4` | 1,725 | −10.4 / −5.4 | 4.5 / 6.5 | −14.0 | −1.39 |
| 6 | `assets/videos/ep06-sonar-v2/ep06-the-sound-that-matched-us-eerie-voice.mp4` | 1,668 | −7.3 / −2.6 | 4.5 / 3.2 | −14.0 | −1.22 |
| 1 | `assets/videos/ep01-moon-v4/ep01-viral-cut-eerie-voice.mp4` (TV-broadcast chain; take 1, the only one of 2 that generated) | 1,473 | −13.3 / −4.5 | 4.5 / 3.7 | −14.0 | −1.06 |
| 4 | `assets/videos/ep04-night-v3/ep04-rules-for-the-night-shift-eerie-voice.mp4` (take 2 of 2; the door line is the same voice through a door) | 1,673 | −16.8 / −6.7 | 4.5 / 6.5 | −14.0 | −1.73 |

Per-line placement, tempo, lifts, margins, presence, loop-seam levels and hashes are in `public/assets/audio/<version>/PROVENANCE.json`. The new voice stem is `stem-voice.flac`.

**Notes:**
- **Captions:** the burned-in captions are timed to the old lines and stay up until 0.35 s after each old line ends.
  - Most new lines are shorter than the robotic ones, so they finish inside the caption.
  - In Episode 3, l02's whispered "None lead away." runs 0.77 s past the old end, so its caption clears about 0.4 s before the last word ends.
  - Every other new line ends within the caption's hold.
- **Episode 6:** the new lines are shorter, so the gaps are longer and the music in them now reads 2.6 dB under the voice, slightly hotter than the −3 to −6 dB aim. Its tightest phone-band line is 3.2 dB.
- **Episode 1:** generated in the next session (one take, 632 credits; the second take of the run failed with the account warning below). l01 and l02 were tightened to 1.12× (`fit_caption`) so the speech ends inside the caption hold (0.23 s and 0.19 s past the old ends). Its tightest phone-band line, l01, is 3.7 dB because the frame-0 alert tone plays under it, as in the original. A syllable-peak count over-counts every line by a similar 1.15–1.6×, with no line short and its neighbour long, so the split assigns each line correctly.
- **Loop seams:** apart from Episode 1's designed jump back into the alert tone (first quarter-second +9.8 dB, last −3.1 dB against the mean), in every episode the first and last quarter-seconds of the mix are within 0.5 dB of each other.
- **Account warning:** ElevenLabs reported for one take: "Unusual activity has been detected on your account, so Free Tier access has been disabled. This can be triggered by using a proxy or VPN … Please upgrade to a paid subscription to continue." This environment reaches ElevenLabs through a proxy. Episodes 1 and 4 may need a paid plan, or generation from the ElevenLabs site.
- **Credits:** 755 + 733 + 823 + 803 = 3,114 credits for the first four takes used; Episode 4 used 2 × 778 and Episode 1 632 (its failed second take was priced at 632; whether it was charged is not reported). A second Episode 5 take, priced at 803 credits, failed with the account warning above; whether it was charged is not reported.
- **No listening pass** was possible in this runtime. The split, levels and margins are measured, not auditioned. **No user approval.**

## Reproduce

```
python3 scripts/revoice_eleven.py ep02 ep03 ep04 ep05 ep06
```

Episode 4 was generated after the user reconnected ElevenLabs (2 takes, 778 credits each). Take 2 is used: its line lengths and syllable counts fit the slots slightly better. Its l01, l02 and l06 run 0.29–0.36 s past the old line ends, which is within the captions' 0.35 s hold (l02 by 0.01 s more). Episode 1: `python3 scripts/revoice_eleven.py ep01` with `public/assets/audio/eleven-takes/ep01-take1.mp3`.
