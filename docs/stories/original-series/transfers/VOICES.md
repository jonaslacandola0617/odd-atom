# TRANSFERS: voice design and the Episode 1 credit plan (draft, 2026-11-12)

## User decisions (2026-11-12)

- **The ending:** "Yes i think the ending is perfect it also setups for a possible
  second season." The Season 1 ending in `BIBLE.md` is approved.
- **Voices:** "yes for voices design each for characters". Each main character
  gets a designed voice.
- **Language:** "most filipinos speak almost in english so a good mix of english
  and tagalog well be good", then (after reading the script): "make it a good balance
  of english and tagalog not english dominated … if were doing a throwback on 90s
  use tagalog dominated". Present-day scenes are a balanced mix; the 1990s tapes are
  Tagalog-dominated. The key phrases stay in Tagalog.
- **Credits:** about 2,000 for now, more later. The user's words: "use the
  remaining 2K to generate every beats, sfx, and music we need for the film."

## What things cost (ElevenLabs estimates, 2026-11-12; nothing was generated)

| Item | Estimate |
|---|---|
| Speech, `eleven_v4`, 2 takes (the default) | about 2 credits per character (Nico's ~300 characters: 620) |
| Speech, 1 take | about 1 credit per character |
| One SFX set of 4 takes (`eleven_text_to_sound_v2`) | 200 credits (now about 50 per take; earlier sets were about 17) |
| Voice design (3 previews per call) | not priced by the tool; it charges for the preview line, which must be 100–1000 characters |
| **Music** | **not available on this ElevenLabs connector** (it refuses music). The user can add the full connector (https://api.elevenlabs.io/v1/mcp); otherwise we compose the drones ourselves for free |

Episode 1 has about 1,000 characters of dialogue: about 2,000 credits with two
takes, or 1,000 with one. Its ten new SFX sets would cost 2,000. The whole list
needs about 4,000–4,500 credits, so it does not fit in 2,000.

## Proposed plan for the 2,000 (for the user to confirm)

1. **Design four voices** (Nico, Bea, Liza, Tito Boy): about 4 × 100–250 credits.
   Mang Erning waits until Episode 3.
2. **Episode 1 dialogue, one take per line:** about 1,000 credits. Retake only
   lines that fail.
3. **The two signature SFX sets** (the camcorder autofocus "focus hunt" and the
   phone autofocus): 400 credits. The other eight new sounds wait for the next
   credits; library v1 covers the rest.
4. **One-scene tape voices** (Rudy, Lola, JoJo, a guest) use existing library
   voices, processed as tape, with no design cost.
5. **Music and drones:** composed and synthesized here at no cost. There is no
   melody score: tape party music is original and lo-fi, and the horror layer is
   drones and swells (`SOUND.md`).

## Voice proposals (the user must confirm or rewrite them)

The voice design tool requires the description and the preview line to come from
the user. These drafts come from the cast in `BIBLE.md`. Please confirm or edit
them, and I will use your words exactly. Language: Tagalog/Filipino (`fil`),
with English mixed in.

### NICO (34)
- **Description:** Filipino man in his mid-thirties, provincial, soft-spoken and
  tired, slightly hoarse, low-medium pitch. Natural Taglish, switching easily
  between English and Tagalog. Quiet, worried, never theatrical.
- **Preview line (Episode 1 lines):** "Alam ko. May papasok na pera, promise. Kumikita
  na siya, Liz. Legit. One more month lang, Liz. Shh. Huwag mo munang sasabihin kay
  Mama, ha? …Tao ba 'yan?"

### BEA (9)
- **Description:** a nine-year-old Filipino girl, quiet and serious, soft and
  clear, not cute or bubbly. She speaks politely with "po", in natural Taglish.
  Observant, slightly sleepy, a little scared.
- **Preview line:** "Pa, may box po sa labas. Nababasa na po. Pa, iba po 'yung
  itsura ng pera. Pa… sino po 'yung nakatayo sa may kusina? Kanina pa po siya
  diyan."

### LIZA (33)
- **Description:** Filipino woman in her early thirties, a night-shift nurse,
  practical and sharp, tired but warm underneath, medium pitch. Natural Taglish,
  a balanced mix of English and Tagalog. Firm without shouting.
- **Preview line:** "Nico, tumawag ulit 'yung bangko. Three months na tayong late.
  Eighteen hundred. Sa isang buwan. Nico… ibenta na lang natin 'yung shop. Please."

### TITO BOY (about 40, heard on 1990s tapes)
- **Description:** Filipino man around forty, a cheerful wedding and party
  videographer, a friendly salesman's voice, upbeat and a little too warm.
  Mostly Tagalog, the way a 1990s Filipino party videographer talks.
- **Preview line:** "O, kaway kayo! Para kay Tatay Rudy 'to! Pare, ikaw naman. Wala.
  Basta huwag mo lang papatayin. Ngiti naman diyan, lahat!"

## Status (2026-11-12)

- **Voice texts approved:** "Voices ok". The preview lines were then updated to the new
  language rule (the same lines as the revised script); Tito Boy's description now says
  mostly Tagalog.
- **Voices postponed:** "lets do sfx for now". Voices will be designed on the user's other
  ElevenLabs account (more credits) once it is reconnected here. Nothing has been generated.
- **SFX done:** library v2 (`public/assets/audio/transfers/sfx-v2/`), 20 sounds × 4 takes. It
  covers the ten new Episode 1 sounds plus ten for Episodes 2–7. The charge was about 1,333
  credits, at 16.7 per take (the estimate tool had said 50).

## Picks (user, 2026-11-12)

- Nico: preview 3, saved as `b9MLbvMviFdcnG5slWrY` ("TRANSFERS – Nico").
- Liza: preview 2, saved as `lX52sMmdCaLkml6skoI2` ("TRANSFERS – Liza").
- Tito Boy: preview 3, saved as `9KpW2mNgONHOSALtTbuF` ("TRANSFERS – Tito Boy").
- Bea: the voice design was blocked by ElevenLabs' safety filter (a child's voice), and again
  with a safer prompt. The user rejected the plain library voices and picked "Cielle B": library
  voice Cielle (`6LXO12QQcaZd6xGp9UIZ`) shifted in post (formants ×1.08, pitch ×1.1683, about
  258 Hz median).
- One-scene voices (library, no design cost): Rudy = Rezz `5Q7Prc4RWUSqufejYCQ5`; Lola = Lola
  Sela Tanda `S0erf8BY5pzZPCxzCfku`; party guest = Ro Raza `3BDtQgJQtkDnbDR0xPpK`; JoJo = Rey
  Mark `PU0XItgzyyu0BQV8GHRX` with a smaller child shift (formants ×1.12, pitch ×1.1236).

## Episode 1 dialogue (2026-11-12)

All 38 lines, one take per character on flow `XtJPkSIjDPCJz6d0shg0`, about 2,045 credits.
`public/assets/audio/transfers/ep01-dialogue/`: the raw takes, one WAV per line (`lines/`),
`lines.json` (order, text, English caption) and `PROVENANCE.json`. Lines are cut by
`scripts/transfers_ep01_dialogue.py` from word timestamps (free scribe transcripts). Not yet heard
by the user.
