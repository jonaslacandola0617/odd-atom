# Episode 47 "Sa Pader ng Bahay ni Lola": production notes

`Ep47SaPaderNgBahayNiLola` / `src/horror/ep47/` (`world.tsx`, `Episode47.tsx`) is 55.78 s, 1080×1920 at 30 fps, in Taglish (Juanito). It retells, in our own words, a kind of childhood experience people have shared online: on holiday in a grandmother's old wooden house up north, a child hears small voices talking inside the plank wall at night; the grown-ups say engkanto, and not to answer. No real house, town or family is used.

## Form: "the wall"

A child's height, the old planks close, and what moves behind the gaps.

| Shot | What happens |
|---|---|
| hook | the plank wall at a child's height: small lights pass behind it, each gap glowing as one goes by; dust sifts out |
| house | the old house up north at night, one capiz window lit |
| room | Lola and me on the floor bed by the wall; the gasera goes out; the lights begin moving behind the planks |
| lola | up at Lola from my pillow: a finger to her lips, shaking her head |
| call | my eyes on the wall: a light steps gap to gap toward my head, held then snapped, as my name is called |
| ear | my ear against the planks; the gap at my ear glows; I answer; everything stops |
| dark | silence, close on the split plank at my ear; Lola's voice whispers through it, and an eye opens in the hole |
| turn | I turn: Lola beside me, eyes open, her head turned round to me further than a head turns; it comes up at the lens (stinger) |
| loop | the hook again |

## Picture technique

- **The wall:** 18 vertical planks with 3 cm gaps over a dark hollow. Each light behind it is a small glowing box with a point light, plus a lit slit on its nearest gap, so "the gaps light up" reads at 180×320.
- **The split plank:** the plank by my ear is broken away low down, leaving a hole the width of an eye.
- **The child:** `Character_10` at 1.15 m with the head ×1.35 (the Episode 43 method).
- **Lying figures:** a character rotated −π/2 about x; turning a lying head is still the neck's y in character space. Lola's turns about 105°, and more on the snap.
- **Cast:** me `Character_10`, Lola `Character_29_Female`; the bed is the derelict mattress; the house and room are box-built.

## Lessons

- A wall that leaks light needs the glow drawn in the gap itself, not only a light behind it. Lambert lighting has no occlusion, so a light behind planks lights the floor in front but not the gap.
- An eye behind a 3 cm gap shows as a sliver: give it a hole.
- Box pillows at head height hide lying faces from low cameras; leave them out.
- A wooden room at night needs ambient about 1.5 plus a motivated moon fill, or the planks go black.

## Sound (`scripts/ep47_sound.py`)

- **Generated:** ElevenLabs flow `WfXJhVQWB87PTxsPKNQr`, 2 prompts × 4 variations, about 267 credits: voices chattering inside a wooden wall (a 15 s loop) and an old woman whispering through a wall (5 s). All variations are in Git (`public/assets/audio/eleven-sfx/ep47-*`).
- **Picked by measurement:** chatter-1 (the narrowest range), whisper-2 (the only clear one).
- **Reused (the library first):** Episode 44's house-1, Episode 35's tuko-1, Episode 40's cicadas-1, and Episode 41's drone-2, stinger-4, riser-3, musicbox-2, whispers-3 and neck-4.
- **The mix:**
  - The voices in the wall sit on the left (the wall's side). They run whenever lights move behind the planks, louder at the call, and stop dead when I answer.
  - In the near silence after that, the house drops away too, until Lola's voice comes through the boards.
  - Scratches on the boards play at my ear; the gasera is blown out.
  - The score drops out in the silence.
  - The neck crack and the stinger fall after the last line.
- **Figures:**
  - presence −10.8 dB in speech and −3.3 dB in the gaps;
  - lines ≥7.9 dB over everything else (phone band ≥6.9 dB), with no lifts (line 7 sits in the silence, 34 dB clear);
  - −14.0 LUFS; decoded peak −1.79 dBFS;
  - seam −23.8 / −23.2 dBFS.

## Voice

Juanito, `eleven_v4`, both takes at once (1,368 credits; take 1 used, 52.3 s), inner pauses capped at 0.32 s, no tempo change. Prompts are in `prompt.json`.

## Care

- The child is never harmed or threatened on screen.
- Lola is loving; what wears her voice is not her.
- The engkanto are never shown: only lights, dust and one eye.
- No real house, town or family; told as an experience shared online.

## Status

No user approval and no listening pass.
