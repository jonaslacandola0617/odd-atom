# TRANSFERS: sound standard (draft, 2026-11-12)

The user rated the sound of the acting test the worst part ("in horror films those are one of the most
important"). Sound is a first-class department for this series, not an afterthought.

## Rules

1. **Purpose-made foley for every visible action.**
   - Each action the picture shows gets its own sound, made for it: the cassette
     case, the VCR door flap, the loading mechanism, tape spooling, CRT power-on
     and whine, chair, cloth, footsteps on this floor, a hand on a desk.
   - These come from ElevenLabs sound effects (`eleven_text_to_sound_v2`, about
     17 credits a variation), with several variations per prompt. Synthesized
     placeholders and sounds borrowed from other episodes are only a last resort.
2. **Three layers in every scene:**
   - room tone and ambience that belong to the place: a provincial street at
     night, rain on GI sheet, a distant tricycle or karaoke, a fan;
   - foley in sync with the action;
   - a designed horror layer: a low tension drone or tone cluster, sub swells,
     and the series' own motif.
3. **Silence as a weapon.** Before a reveal, the world's sounds drop out one by
   one (fan, rain, hum) rather than all at once, so the audience feels the
   room go wrong.
4. **The entity has a sound signature.** It's recognizable across episodes,
   designed once and reused. For example, a tape-warble breath, or the hiss of a
   tape when the figure is near.
5. **Tape audio sounds like tape:** wow and flutter, dropouts, a camcorder
   microphone's handling noise, and voices compressed and hissy.
6. **Dialogue first** (Taglish, designed voices), at −14 LUFS for the episodes.
7. **Picking takes:** generated variations are picked by measurement, and the
   user hears the key ones. Until the user listens, nothing is "approved".
   This runtime cannot audition audio.

## Variation rule (user, 2026-11-12)

The user listened to all 60 takes of sound library v1 and approved them all ("excellent").
- Every generated sound keeps its 4 takes as variations; nothing is discarded.
- Repeated actions rotate takes deterministically: take = 1 + (cue index mod 4), offset per sound, so one cue never repeats the same take twice in a row.
- New sounds are generated as 4-take sets for the same reason.

## Library v2 (2026-11-12)

`public/assets/audio/transfers/sfx-v2/`: 20 prompts × 4 takes (80 files, about 160 s). It holds the entity signature (`focus-hunt` for tapes, `phone-focus` for phones), the rest of Episode 1's foley and beds, and sounds for Episodes 2–7. Prompts, hashes and durations are in `PROVENANCE.json`. The user has not heard it yet.

## Status

Credits are approved by the user for reusable sound. Library v1 has been heard and approved by the user.
