# Imported Knox narration and animation timing

The user supplied `VoiceOver_Singularity.mp4`, generated in Google Vids using **Knox**. The uploaded media contains **536.618667 seconds of AAC narration**, or **8:56.619**. This recording supersedes the earlier script-only 10–12 minute estimate.

**[Download extracted original narration](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/audio/singularity/narration-original.m4a)** · [Original uploaded voiceover video](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/audio/singularity/voiceover-source.mp4) · [Draft SRT captions](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/audio/singularity/singularity-captions-draft.srt) · [Timed visual/animation cues](timed-visual-beats.md)

## What is preserved

The runtime M4A was extracted by **AAC stream copy**. No new voice was synthesized, no credits were used, and no pitch, speed, gain or pause change was applied. Decoding the source and extracted narration produces identical 24 kHz mono, 16-bit PCM. The original uploaded MP4 is also saved unchanged.

The sample video frame inspected was blank white. It is a source voiceover export, not a finished illustrated film. No full-length film, final music, sound effects, new artwork or subjective listening approval is claimed by this ingestion step.

## Five voiceover blocks

The text boundaries from the user's five Google Vids scripts were located by known-script acoustic alignment. Audio cuts sit halfway through the gap between the last word of one block and the first word of the next; they are editorial cuts derived from speech, not claimed Google Vids scene metadata. Exact cuts use native audio samples.

| Block | Start | End | Duration | Separate audio |
|---|---|---|---|---|
| 1 | 00:00:00.000 | 00:01:53.215 | 1:53.215 | [Scene 1 FLAC](../../../../assets/audio/singularity/scenes/scene-01.flac) |
| 2 | 00:01:53.215 | 00:04:01.990 | 2:08.775 | [Scene 2 FLAC](../../../../assets/audio/singularity/scenes/scene-02.flac) |
| 3 | 00:04:01.990 | 00:05:31.605 | 1:29.615 | [Scene 3 FLAC](../../../../assets/audio/singularity/scenes/scene-03.flac) |
| 4 | 00:05:31.605 | 00:06:54.495 | 1:22.890 | [Scene 4 FLAC](../../../../assets/audio/singularity/scenes/scene-04.flac) |
| 5 | 00:06:54.495 | 00:08:56.619 | 2:02.124 | [Scene 5 FLAC](../../../../assets/audio/singularity/scenes/scene-05.flac) |

FLAC cuts store the source decoded 16-bit audio losslessly. Decoding and concatenating all five reproduces the complete decoded source PCM exactly, with no missing, repeated or added samples. They are convenient for per-block editing; the continuous original M4A remains the production narration source.

## Timing and review status

- **1,177 lexical word tokens** were aligned locally with PocketSphinx. This count splits hyphenated terms; the earlier ~1,170 spoken-word count uses a different word convention.
- **241 draft caption cues** preserve script wording and punctuation, omit audio tags, remain inside the recording, and do not overlap. Captions use compact phrases rather than full paragraph cards.
- **52 visual beats** resolve authored visual/layer/sound directions to actual spoken cues. They cover the complete timeline without frame gaps. A beat is not necessarily a hard cut or a single static illustration; several actions/compositions may occur within a beat.
- At **30 fps**, the animation timeline needs **16,099 frames**, or **536.633333 seconds**. The final frame adds about **14.7 ms** beyond the audio end. Do not force the narration back to the initial runtime estimate.
- A separate, unprompted local Whisper transcription closely matched the supplied script. Its normalized word-sequence similarity is **0.998726**, a machine content-agreement figure, not an audio-quality or pronunciation score. It identified no spoken audio tags. Two recognition differences—`cooled` versus `cool`, and an unrecognized `scale`—remain review flags. They do not establish recording errors or justify silently replacing the user's wording.
- Acoustic word times are **model estimates**. Full manual listening, phoneme-level verification, subtitle review and subjective performance assessment have not been completed. The stored scores from PocketSphinx are raw decoder values, not normalized confidence percentages.

Measured source loudness is approximately **−17.8 LUFS integrated**, **5.1 LU loudness range**, and **−0.6 dBFS true peak**, using FFmpeg's EBU R128 filter. This step preserves the recording. Establish final voice/music headroom when mixing the film, without changing Knox's pitch or speech speed.

[Scene timing CSV](scene-timing.csv) · [Word alignment](word-alignment.json) · [Recognition/content comparison](content-crosscheck.json) · [Pause map](pauses.json) · [Validation](validation.json)

## Reproduce

The source MP4, original extracted M4A, alignment and timing data are committed. Packaging/caption/cue regeneration works offline:

```sh
python scripts/prepare_singularity_audio.py
```

This command uses Python, NumPy and FFmpeg. It uses the committed alignment only after confirming both script and narration hashes; it does not call a speech API or regenerate the voice.

To independently regenerate recognition/alignment, install the optional local analysis dependencies into ignored `.cache/singularity-audio/` using `requirements-audio-analysis.txt`. The recognition model is downloaded from:

`https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-base.en.tar.bz2`

Archive SHA-256: `475bc7052ce299c007f6d5d5407ba8601f819a2867f6eecee510ed17df581542`. Extract it under ignored `.cache/singularity-models/`. Before recognition, decode the committed source to `out/singularity-audio/alignment-16k.wav`, mono PCM 16-bit at 16 kHz. The analysis log is produced with FFmpeg `silencedetect=noise=-42dB:d=0.5,ebur128=peak=true` on the committed source. These are analysis inputs only; the production recording remains at its original 24 kHz.

```sh
python scripts/transcribe_singularity.py
python scripts/transcribe_singularity.py --plain
python scripts/align_singularity.py
python scripts/prepare_singularity_audio.py
```

Speech recognition and forced alignment run locally; no recording is sent to an external transcription provider. Large model weights and scratch analysis audio stay outside Git.
