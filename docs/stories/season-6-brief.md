# Season 6 brief: worldwide personal experiences, in English (Episodes 51–60)

**The user's direction (2026-11-16, after Season 5):**

> "lets go back now to the english videos, lets keep the personal experience while maintaining spooky and horrific story, you can also add some gore, i also noticed some of S5's sequence are lookalike, I want every story unique to one another, even though they are just scary ghosts stories each stories should be unique to one another, since our options span to wordlwide now im assume youll pick really scary people have experience and i want the animation to be improved in terms of the scariness if you measure scary 1-10 i want it to be 100 scariness. do this in a new session, make sure that the session will keep the quality of the animation, if not improve it."

The work starts in a **new session**. This brief is the handoff: what the user asked for, what went wrong in Season 5, and the rules that keep the quality at or above the Season 5 bar (Episode 41, the only approved episode).

## What the season is

- **Stories:** personal experiences people have shared online, from **anywhere in the world**, retold in our own words. Pick the scariest ones, not the most famous.
- **Language:** English narration and captions. The Season 3 English voice is Jack (`BVPhWQykET1TSvfGzrUr`, `eleven_v4`). Season 6 is first-person "I" accounts, so check one test line with the user, or default to Jack. Generate both takes, on a new flow each episode.
- **Gore is now allowed** (the user's word: "some gore"). See the care rules below for the limits.
- **Scariness:** the user wants far beyond 10/10 ("100 scariness"). Treat every episode as needing several distinct, escalating scares, not one stinger at the end.
- **Unchanged:**
  - the PSX models and kit;
  - pose by aim;
  - the motion rule;
  - hard cuts only;
  - an eerie score built per episode;
  - the seamless loop;
  - −14 LUFS and decoded peak ≤ −1 dBFS;
  - lines ≥4 dB over the bed;
  - every ElevenLabs take kept in Git;
  - commit, push and verify on the remote before sending.

## Why Season 5 looked alike (the user is right)

Measured from the Season 5 code and scripts:

| Repeated element | Where |
|---|---|
| The ending: a figure's head snaps or turns up to the lens on the stinger | 9 of 10 (41, 42, 43, 45, 46, 47, 48, 49, 50; 44 ends on Lolo nearer) |
| A head turning past human limits in held-then-snapped steps | 41, 42, 44, 45, 47, 48, 49, 50 |
| "The count" as the form | 41 (window), 46 (ticket punch), 48 (torch) |
| A reflection or mirror that disagrees with the room | 41, 43, 45 |
| A pale long-haired woman | 41, 42, 45, 46 |
| A grandmother at night | 44 (Lolo), 47, 50 |
| Someone behind me in my bed or at its foot | 48, 50 |
| **The same sound kit:** Episode 41's drone, riser, stinger, neck crack and music box | **all ten** |
| Identical structure: 8 lines, about 55 s, the hook replayed as the last shot, the stinger after the last line | all ten |
| One grade, one caption style, one vignette | all ten |

## Uniqueness rules (new for Season 6)

Before production, write a **uniqueness table** for all ten episodes in the slate, and check every new episode against it. No two episodes may share:

1. **The scare mechanism:** what the horror *does*, for example:
   - imitation (it copies a voice or a person);
   - pursuit (it follows, it gains);
   - wrong geometry (an extra room, a hallway that doesn't end);
   - possession (someone you love acts wrong);
   - transformation (a body changing);
   - something hidden in plain sight;
   - something that gets in;
   - something that was always there.
2. **The entity's design:** body, size, way of moving and face. The **head-snap-to-lens is used at most once in the season.** Other wrong motion to draw on (the rigs can do all of these):
   - crawling;
   - limbs bending the wrong way;
   - a body walking backwards or on all fours;
   - a jaw that stretches;
   - a too-tall figure;
   - a figure that never moves but is closer every cut;
   - a figure that copies the narrator's pose;
   - a spine that bends back.
3. **Where the scares land:** not always at the end. Use a cold open that is already the worst moment, a mid-point scare that resets expectations, a false calm, or a final image that is quiet but wrong.
4. **The form or camera grammar:** one per episode, never repeated:
   - a found phone video;
   - a doorbell or dashcam;
   - a baby monitor;
   - a video call;
   - a security grid;
   - a single unbroken take;
   - a top-down plan;
   - POV;
   - time-lapse;
   - photographs;
   - a text thread;
   - a 911-style call transcript (original, never a real recording).
5. **The sound palette:** generate a new signature for each episode, with its own drone or bed, its own stinger and its own motif. **Do not reuse Episode 41's drone, riser, stinger, neck crack or music box** (Season 5 leaned on them in every episode). The library and earlier takes are still for ambience and foley.
6. **The look:** a different grade or texture per episode, for example:
   - colour temperature;
   - a monochrome night camera;
   - overexposed daylight horror;
   - a red darkroom;
   - VHS;
   - a phone's compression;
   - thermal.
7. **The structure:**
   - vary the line count and rhythm;
   - let the picture carry long silent stretches;
   - not every episode needs eight lines or a 55 s run time (45–60 s);
   - the loop may join on a different element than "the hook shot again".
8. **The setting and culture:** spread the slate across countries and settings, so no two are the same kind of place (Season 5 had three night-transport and three bedroom stories).

## How to make it scarier (the "100" target)

- **Build dread before the scare:**
  - long held frames where something might be wrong;
  - the viewer spotting the figure before the narrator does;
  - sound that drops out before something appears.
- **Several scares, escalating:** at least three distinct beats per episode, each worse than the last, with the strongest not always last.
- **Proximity and realism:** keep ordinary rooms ordinary, so the wrong thing stands out. Bring the thing close to the lens. Show the face only once, and hold on it longer than is comfortable.
- **Bodies that are wrong:**
  - use the rigs for joints bending backwards, stretched limbs (`stretch`), crawling, and spines arched;
  - `reach` an arm much too far;
  - scale a head;
  - pose a body that is too still and then moves all at once.
- **Gore where the story earns it:** wounds, blood, an injury that is shown, not told. Keep it brief and purposeful, and let the cut away do half the work.
- **Sound:**
  - near-silence used as a weapon;
  - wrong sounds (a voice from a body that isn't moving, footsteps in the wrong rhythm);
  - a stinger only where it helps, and never on a word;
  - a new stinger for each episode.
- **Subliminal frames and tape or compression damage:** one or two frames only, in the right place.
- **Check scariness with the sound off** (the motion rule): the picture alone must frighten.

## Care rules (with gore now allowed)

- **Rights:** the Season 5 safeguards carry over:
  - retell the experience in our own words, never copying the poster's text;
  - no names, usernames, photos, exact addresses, employers, schools or hospitals;
  - posts say "based on experiences shared online" and claim nothing as verified;
  - if a poster objects, the user decides whether to take the video down or credit them.
- **Never** use stories tied to a real crime or a real, identifiable victim, and never put gore on a real person. Some "personal experience" posts (for example on r/LetsNotMeet) describe real crimes: leave those out.
- No sexualised content (Season 5 swapped two models for this); no minors harmed on screen; no self-harm or suicide material.
- No dares, and no "go there" framing.
- Folklore or creatures from a culture are told with respect, never mocked.

## Research notes for the new session

- Reddit, Facebook, TikTok and X could not be opened from this environment in Seasons 4 and 5; some story sites were refused by the network policy. Start with web search summaries, and record every source in the slate (never shown on screen). If a site is blocked, say so; don't guess its content.
- Candidate source types (check each for the care rules):
  - first-person paranormal subreddits (r/Thetruthishere, r/Paranormal, r/Ghoststories);
  - Your Ghost Stories;
  - Japanese 2channel / 5channel posts (for example the Kisaragi Station thread, a famous first-person post);
  - Korean, Thai, Indonesian, Mexican and Brazilian forums and blogs;
  - first-person accounts in press roundups.
- Draft the slate (`docs/stories/season-6-world.md`): Episodes 51–60, each with the experience, where it was shared, the form, the scare mechanism, the entity, the sound signature and the look, plus the uniqueness table. Show it to the user before production if they want to approve it. Season 4's approval came this way.

## Keeping the quality (Season 5's lessons, in one place)

- **Kit:** `src/horror/psx/models.tsx`:
  - `PsxCharacter`: pose steps `aim`, `scale`, `stretch`; props `reach` and `probe`;
  - `PsxProp`, `ARMS_DOWN`, `SIT`.
- **Models:**
  - the repo holds only the models in use (`public/assets/models/psx/`);
  - the full packs are on Drive (`124GZkGnO3AsaZA1aB5oyEBBmTX0UT2Im`); re-download them in the new session for new figures, especially the unused `Character_Monster_*` and `Character_Killer_*` for Season 6's entities;
  - the contact sheet is `docs/production/psx-models/sheet-characters.jpg`.
- **Plan before the first still:** cameras against the geometry, prop sizes from GLB bounds, head heights with `probe`. Two still passes should be enough.
- **Pitfalls that cost iterations:**
  - **light floor:** a night interior needs ambient about 1.5–1.8 plus a motivated source, or it goes black after the grade;
  - **backlit faces:** faces turned toward an outside camera are backlit, so add a fill;
  - **pillows:** box pillows hide lying faces;
  - **lying heads:** a lying head bone sits about 0.87 h from the feet;
  - **pose composition:** `Neck` and `Head` y rotations compose, half each for a full turn;
  - **seat behind:** a seat directly behind another hides its rider;
  - **mullions:** keep cameras off door and window mullions;
  - **crop tops:** the pack's young women mostly wear crop tops or camisoles; use `Female_12` or cover them for care;
  - **the grain's `rng` seed must stay positive:** use `Math.floor((t + 600) * 24)`; seeded from negative time, the loop shot's grain turns black and breaks the seam;
  - **always-on fog:** keep a fog attached in every shot if any shot uses fog;
  - **sequential check:** check any PSX shot with a short sequential render, not stills only.
- **Sound:**
  - pick takes by measurement;
  - when a generated bed is unsteady, compress and layer it;
  - keep foley under a line, not on top of it;
  - report presence (−8 to −12 dB in speech, −3 to −6 dB in gaps) and per-line margins;
  - mux the checked `mix.m4a` with `-c copy`.
- **Credits:** an episode costs about 1,500–1,600 credits for both narration takes and 270–570 for effects. About 5,900 of the new account's 40K were used on Episodes 48–50.

## Open item from Season 5

Episodes 40–48 carry the old grain line (the grain turns black on the loop shot). Their dark loop shots kept the seam small (≤1.4/255). Re-rendering them is the user's call.
