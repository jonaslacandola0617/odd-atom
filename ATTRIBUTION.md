# Current production records

## New character motion pass

`approved-characters-motion-20s.mp4` reuses the exact approved illustration files and static sheet. No new character or background drawings were generated. `src/MotionCharacters.tsx` skins the original textures through torso/elbow/wrist controls, then stages pose keys and independent steam. A fresh ElevenLabs generation uses George and `eleven_multilingual_v2`, retains native spoken timing, and adds 1.3 seconds of silence in sentence gaps. The original synthesized music/ambience were regenerated at quieter levels with a cloth cue at the arm gesture. Encoded comparisons, geometry checks, and asset hashes are recorded under `docs/production/characters-motion/`.

## Motion-study reference excerpts

`references/studies/motion-2026-10-24/` contains short silent GIF excerpts and frame sheets extracted from the eight reference videos uploaded by the user. They are labeled analytical reference material, not original channel animations or production assets. Source filenames, hashes, ranges and decoded timestamps are retained in `measurements.json`. Official production-process statements are separately linked and hashed in `process-sources.json`.

## Approved-character animation test

The user-approved `assets/characters/static-test-01.png` guides the current `approved-characters-20s.mp4`. Image generation adapted that original concept into two transparent illustration atlases and two original background plates in `public/assets/artwork/approved-characters/`. Remotion animates and composites the parts using `src/ApprovedCharacters.tsx`. Prompts, source/output hashes, comparison boards, and validation are recorded in `docs/production/approved-characters/`. The approved source PNG is unchanged. This film reuses the existing genuine ElevenLabs narration and original synthesized sound stems; no new speech request was made.

## Static character concept test

`assets/characters/static-test-01.png` is an original raster concept sheet produced with `image_gen.imagegen` in two passes. Saved official Loneliness and The Last Human images guided the character-design study; their hashes, the output hash, and the generation prompts are recorded under `docs/production/character-static-test/`. This sheet is not a hand-authored SVG or a completed animation rig.

## Original artwork and sound

Ember, its vector geometry, two-bone arm rig, face controls, stellar cutaway, and scene artwork were created for this project. The neutral SVG is exported from the editable React component. The score and effects are synthesized from deterministic oscillators and noise; they contain no sampled commercial music or effects.

Mira, Sol, their human rig, the crowd variations, street, café, furniture, plants, and cup geometry were also authored for this project. Their editable components and exported neutral/set SVGs are original production artwork. The crowd test's keyboard score and ambience were synthesized for this segment.

The artwork rebuild uses newly drawn geometry in `src/art/ConnectionArt.tsx`: distinct Mira/Sol heads, standing and seated contours, separate profile/rear views, pose-specific hands, a terrace, street, and props. Six original standalone SVGs are saved in `public/assets/artwork/connection-rebuilt/`. The rebuild reuses the existing generated ElevenLabs narration and original sound stems. Downloaded reference images are used only in explicitly labeled review boards, not in the film.

The four previously supplied character SVGs and their animation source were removed at the user's request. No paths from those characters are used in Ember. Older review MP4s and Git history remain historical records.

## Narration

ElevenLabs successfully generated the narration for **Alone in a crowd** using the official `@elevenlabs/elevenlabs-js` SDK, George (`JBFqnCBsd6RMkjVDRZzb`), and `eleven_multilingual_v2`. The returned character alignment supplies caption and story timing. A pitch-preserving 0.9 tempo adjustment was applied to the first generation. The script is original; it does not reproduce a reference episode's narration.

The earlier star segment still has pending narration and is supplied as a visual preview. Keys belong only in secure environment settings, outside project files and Git.

## Fonts

Outfit and Nunito are distributed by Google Fonts under the SIL Open Font License 1.1. Local licenses are retained:

- Outfit: `public/assets/fonts/OFL.txt`; https://github.com/google/fonts/tree/main/ofl/outfit
- Nunito: `public/assets/fonts/Nunito-OFL.txt`; https://github.com/google/fonts/tree/main/ofl/nunito

These are selected production fonts. No claim is made that they are the exact typefaces used in the reference videos.

## Reference access

The user's previously uploaded eight shorts were studied as visual references. Their footage, frames, soundtracks, and narration are not included in the current production assets.

The official website later became accessible. Its downloaded illustrations and case-study images are saved under `references/studies/`, with source URLs and hashes. Those are official Kurzgesagt reference artwork, not generated Odd Atom graphics, and are not included in the crowd film. The [expanded study](references/studies/topic-range-2026-10-23/README.md) records exactly what was inspected. YouTube episode playback remains blocked, so no completed long-form motion/audio study is claimed.

## Tooling

Remotion packages are pinned to 4.0.538. Remotion's own license applies to use of that software: https://www.remotion.dev/license.

The archived `why-astronauts-float` export used Kokoro-generated narration, public-domain Natural Earth geography, and the user's retired character assets. It is not the current ElevenLabs production and is not regenerated by the present source.
