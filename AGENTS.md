# Video delivery

- **Original series discussion (2026-11-12):** before making another ten videos, the user wants an original serialized horror series with "a real planned story with great plots", "generational", at the craft level of films like *The Grudge* and *Evil Dead Rise*. They supplied a reference video for the animation quality they want, and suggested a library of 3D models (characters, sets, props) with SFX and VFX.
  - **Reference video:** Drive `15GGUpCQyLE-EL4ED0TYwfUH9c24s_kIE`, re-shared by the user as viewable and studied the same day; the footage stays out of Git. It is a 104 s phone screen recording of a Facebook Reels feed: about six cute 3D animal comedy reels by one creator (not horror).
    - The frame renders at full resolution with smooth geometry, and only the textures are pixel art (nearest-filtered), unlike our whole frame at 180×320.
    - Rigged, expressive characters with 2D-painted faces whose expressions swap; prop handling.
    - Warm soft-shadowed light, depth of field, bloom, god rays, reflections, particles, moving cameras with fast cuts, and sparse outlined captions.
    - Copy techniques only, never their characters.
  - **Capability note:** `docs/stories/original-series/CAPABILITY.md`. The biggest gap is characters that act: nothing yet has a skeleton, a walk cycle or a face. The proposal is a headless Blender (`bpy` 5.3 on PyPI, not yet installed or tested) asset library: Python-built models, armatures and shape keys, exported as GLB and driven by an `AnimationMixer` set from the Remotion frame. Outside assets only with their terms checked.
  - **Concepts:** `docs/stories/original-series/CONCEPTS.md`:
    - A. "Sign-Off": a dead station's broadcast films your house, and the camera moves only while watched. It is the recommended pipeline fit.
    - B. "Ninth Night": an extra mourner at every wake, a family curse since 1974.
    - C. "The Extension": a house that makes its sleepers build it. It needs the most rigging.
  - **Status:** nothing chosen or approved. The proposed next step is a 15–20 s test with one rigged original character, rendered in both our PS1 look and a reference-style look (pixel textures at half or full resolution, soft shadows, depth of field, bloom), with render time measured, using no ElevenLabs credits, once the user agrees. No episodes are to be made until the user picks a direction.

- **Season 3: famous real ghost cases from around the world (2026-11-12):** the user asked for ten more episodes (21–30) of "famous super really scary ghost stories around the world", then (relayed) "I want real story" and "something true to life super scary".
  - **The user's criticism of Season 2:** every episode had the same shape (intro → story → mid hint → silence → one lit reveal → aftermath → loop): "too predictable … each video should be unique, not a reused template".
  - **Slate:** `docs/stories/season-3-world.md`: ten real, documented cases on six continents, each with its own form, scare placement, sound language and visual language. Order: Enfield → Okiku doll → Bell Witch → Island of the Dolls → Hampton Court CCTV → Castle of Good Hope → Waverly Hills → Brown Lady → Monte Cristo Homestead → Poveglia. Folklore-only tales are out.
  - **Rules:** real cases only, told true to life (ordinary rooms, real times, witness details, restraint); facts as reported and disputed, from search summaries; no shared template (shared helpers are fine); no film or game designs; no naming of living private people; no dares.
  - **Voice:** English, **Jack** (`BVPhWQykET1TSvfGzrUr`, `eleven_v4`) for every episode (all are reported cases), on the user's Starter account; a new flow per session; both takes generate by default.
  - **Standards that stay:** hook under 1 s, 45–60 s, hidden details, dark key, presence and margin checks (with no score, measure the whole bed), −14 LUFS, decoded peak ≤ −1 dBFS, the checked `mix.m4a` muxed over the picture; render scripts delete their bundle.
  - **The motion rule (user, after Episode 22, 2026-11-12):** "there's a lack of motion … a static video like this, only the narrator is telling the story. The video itself should be scary, the video itself should tell the story … not like the first two episodes." From Episode 23 on: every shot moves; every scene has a visible event; the picture must tell and frighten with the sound off; use ElevenLabs sound effects (`eleven_text_to_sound_v2`, about 17 credits a variation) for the sounds the picture depends on. The slate's static formats (25, 27, 28) were revised. Episodes 21 and 22 are kept; the user has not asked for them to be redone.
  - **Status:** all ten episodes are delivered (Season 3 complete with Episode 30); no user approval of the slate or any episode; no listening pass.

- **Episode 21 "Watch the Chair" (2026-11-12):** the Season 3 opener: the Enfield poltergeist (north London, 1977), a real, documented, disputed case. `Ep21WatchTheChair` / `src/horror/ep21/` is 58.95 s, in English.
  - **Form:** one unbroken, locked-off take in real time (a camera left running in the back bedroom). Misdirection: the hook says "Watch the chair"; the chair never moves while visible, only in three tape dropouts, nearer the far bed each time; at the end someone is sitting in it (a silhouette from behind against the curtains), then a dropout loops to frame 0.
  - **Sound:** diegetic only, **no score**: room tone, hum, tape hiss, a clock that stops, breathing, knocks that answer, a floorboard, a synthesized wordless rasp, a 3.2 s silence, a chair taking weight.
  - **Lessons:** with no score the narration carries the loudness, so compress the voice (the first compressor had its attack scaled per block, about 240 ms, and did nothing) or the limiter ceiling drops to −6 dBFS; hard square-modulated noise bursts overshoot after AAC encoding. In a single locked-off frame, put the hero prop's last position where its silhouette reads against a lit surface.
  - **Care:** the children are never named or shown; the skeptics' case is in the narration; no real recording; no address.
  - **Voice:** Jack, both takes at once (1,500 credits; take 1 used), no tempo change.
  - **Sound figures:** bed presence −21.6 / −9.3 dB (no score, on purpose), lines about 20 dB over everything, −14.0 LUFS, decoded peak −2.2 dBFS, seam −16.2 / −15.7 dBFS.
  - **Delivery:** `assets/videos/ep21-chair-v1/`. Notes are in `docs/production/ep21-chair/README.md`; the publishing kit is `docs/publishing/ep21/README.md` and `docs/publishing/POSTS-ep21-30.md` (US/global posting times).
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 22 "Eighty-Eight Years" (the Okiku doll; a time-lapse with no jump scare).

- **Episode 22 "Eighty-Eight Years" (2026-11-12):** the user asked for the "next ep". The Okiku doll (Mannenji temple, Iwamizawa, Hokkaido), a real reported case. `Ep22EightyEightYears` / `src/horror/ep22/` is 55.6 s, in English.
  - **Form:** a time-lapse from one fixed position, one "photograph" a year from 1938 to now (a year stamp, per-year candles, offerings, exposure and a few millimetres of tripod jitter). No jump scare: her hair grows (trimmed once in 1980) and her head turns, a little a year, from the wall to the lens; the narration only says "look" at the end; breath fogs the inside of the glass.
  - **Sound:** one instrument: a synthesized temple bell struck seven times in the gaps, and silence; one breath at the end.
  - **Lessons:** black hair is invisible against a dark case: line the case with pale silk so the hair reads in silhouette; a hanging scroll behind a doll's head with two dark blocks reads as a second face.
  - **Care:** the girl is never shown; the head turning is our dramatisation and is never claimed; an original doll design.
  - **Voice:** Jack, both takes at once (1,402 credits; take 1 used), no tempo change.
  - **Sound figures:** bell presence −13.6 / −3.2 dB, lines ≥9.6 dB, −14.0 LUFS, decoded peak −3.95 dBFS, seam −42.9 / −55.8 dBFS (both near silence).
  - **Delivery:** `assets/videos/ep22-okiku-v1/`. Notes are in `docs/production/ep22-okiku/README.md`; the publishing kit is `docs/publishing/ep22/README.md` and `docs/publishing/POSTS-ep21-30.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 23 "Backwards" (the Bell Witch; told backwards from the funeral).

- **Episode 23 "Backwards" (2026-11-12):** the user asked for the "next ep" and, before it, gave the motion note above. The Bell Witch (Adams, Tennessee, 1817–1821), a real reported case. `Ep23Backwards` / `src/horror/ep23/` is 57.7 s, in English. The first episode built to the motion rule.
  - **Form:** told backwards, scene by scene, each joined by a film rewind in which the previous scene runs backwards at 7×: the funeral (a laugh, a gust snuffs the lanterns, the mourners turn) → the sickroom (a vial rolls by itself) → supper (flames lean to an empty chair; its sitter's shadow on the wall) → the children's room (a quilt yanked off a bed) → outside in 1817 (scratches appear on the logs; something moves through the corn) → the first night (a scratch draws itself into a bedpost). Every shot moves. An old-film-print look (sepia, dust, scratches, gate weave).
  - **Sound:** ElevenLabs sound effects for the first time (laugh, gust, scratching, quilt; 272 credits, picked by measurement), synthesized foley, a drone with reversed swells into each rewind.
  - **Lessons:** see the playbook (directional lights aim at the origin; `hemisphereLight` with `args` lit nothing; point lights need 5–10 at 2 m; portrait frames are about 29° wide; `interpolate` ranges must increase).
  - **Care:** faces in shadow or turned away; no one shown harmed; the narration says the story comes from one book written 70 years later and the family's account is lost.
  - **Voice:** Jack, both takes at once (1,574 credits; take 1 used), no tempo change.
  - **Sound figures:** score presence −12.5 / −2.9 dB, lines ≥4.7 dB (l06 +4.3, l07 +2.6, l02 +0.5), −14.0 LUFS, decoded peak −1.1 dBFS, seam −18.2 / −19.1 dBFS.
  - **Delivery:** `assets/videos/ep23-bell-v2/` (v1 rejected). Notes are in `docs/production/ep23-bell/README.md`; the publishing kit is `docs/publishing/ep23/README.md` and `docs/publishing/POSTS-ep21-30.md`.
  - **Status:** no user approval and no listening pass.
  - **v2 (the user's note on v1: "what is that transition … it ruins the scariness of the video, that reverse thing transition in each clip"):** the rewinds were removed completely: hard cuts, each scene running forward to the cut, no rewind sounds or reversed swells. **No rewind, reverse or gimmick transitions in future episodes: cut hard, or cut to black and silence.** Delivery `assets/videos/ep23-bell-v2/`, audio `public/assets/audio/ep23-bell-v2/`; v1 is kept as rejected.
  - **Next in the season order:** Episode 24 "They Turn Their Heads" (the Island of the Dolls; first person in a boat).

- **Episode 24 "They Turn Their Heads" (2026-11-12):** the user asked for the "next ep". The Island of the Dolls (Xochimilco, Mexico City), a real place with a reported story. `Ep24TheyTurnTheirHeads` / `src/horror/ep24/` is 53.0 s, in English.
  - **Form:** one continuous first-person boat ride (a visitor's phone video at dusk), there and back, with no cuts or transitions. Dolls hang facing the water; one turns its head as we pass; the boat turns round; on the way back they all face the boat and one floats beside it; the camera tilts down and the water's reflection shows a doll hanging overhead; "Don't look up"; it looks up: the doll, face down, at the lens; black.
  - **Picture technique:** the reflection is the whole world mirrored (scale y −1) under translucent water, so the overhead doll is in the water before the look-up; the tilt angles are computed from the doll's position (reflection about 84° down, the doll about 68° up).
  - **Sound:** diegetic only, no score: water, the pole, the dolls on their strings, whispers, a distant band that stops dead at the island (ElevenLabs SFX, 272 credits), then near silence and one hit.
  - **Care:** the girl and Don Julián are never shown; his death is one line attributed to his family; the legend is told as unverified; a family-run site, no dares.
  - **Voice:** Jack, both takes at once (1,548 credits; take 1 used).
  - **Sound figures:** bed presence −10.1 / −9.0 dB, lines ≥6.5 dB with no lifts, −14.0 LUFS, decoded peak −1.2 dBFS, the loop restarts from black and silence.
  - **Delivery:** `assets/videos/ep24-dolls-v1/`. Notes are in `docs/production/ep24-dolls/README.md`; the publishing kit is `docs/publishing/ep24/README.md` and `docs/publishing/POSTS-ep21-30.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 25 "Camera Three" (Hampton Court, 2003; a guard's patrol cut against the CCTV).

- **Episode 25 "Camera Three" (2026-11-12):** the user asked for the "next ep". The Hampton Court Palace CCTV figure (October 2003), a real documented incident. `Ep25CameraThree` / `src/horror/ep25/` is 49.4 s, in English.
  - **Form:** a guard's handheld torch patrol (colour) cut hard against the palace CCTV (monochrome, 8 fps, names and timestamps): camera 4 full screen (the doors burst open), the guard pushes them shut, the four-camera wall (push-in), camera 4 again (a hooded, pale-faced figure steps out and pulls the doors shut, as described in the reports), the guard hurries back, the wall again (on camera 3 a figure behind him, closer; the push ends on camera 3), camera 3 full screen (right behind him), he turns: empty; the torch dies; a pale face in the EXIT sign's green.
  - **Picture technique:** each CCTV tile is its own small `ThreeCanvas` of the same world from a fixed camera, rendered at 8 fps; the wall is a CSS grid pushed in with a computed offset to land on a chosen tile; the room beyond the doors is dimly lit so a dark figure in the doorway reads.
  - **Sound:** near silence, no score: the control room's hum and a fire-door alarm that beeps while the doors are open and simply stops when the figure closes them; the doors, footsteps and keys from ElevenLabs SFX (272 credits); one low hit on the face.
  - **Care:** no staff named; no historical identity claimed; the skeptics' view in the narration; a reconstruction, not the footage.
  - **Voice:** Jack, both takes at once (1,322 credits; take 1 used).
  - **Sound figures:** bed presence −16.9 / −9.2 dB (near silence by design), lines ≥13.9 dB with no lifts, −14.0 LUFS, decoded peak −1.25 dBFS, the loop restarts from black.
  - **Delivery:** `assets/videos/ep25-hampton-v1/`. Notes are in `docs/production/ep25-hampton/README.md`; the publishing kit is `docs/publishing/ep25/README.md` and `docs/publishing/POSTS-ep21-30.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 26 "Post Three" (the Castle of Good Hope, Cape Town; a night guard's radio log).

- **Episode 26 "Post Three" (2026-11-12):** the user asked for the "next ep". It is the Castle of Good Hope (Cape Town), a real place with reported hauntings. `Ep26PostThree` / `src/horror/ep26/` is 59.76 s, in English.
  - **Form:** a night guard's radio log, first person (a composite guard, voiced by Jack), with the torch POV and his radio always in hand. The radio's LCD (a 5×7 pixel font on a canvas texture, in its own small `ThreeCanvas`) shows his post, the time and TX/RX.
  - **The scares, small and escalating, one per place:**
    - a grey woman runs out of a side door (the hook);
    - from above, a window lights;
    - two more footsteps after he stops, and a door closing behind him;
    - in the governor's room, a page turns and the chair slides back;
    - on the ramparts, a tall man straightens and turns his head;
    - in the corridor, she runs at him and the torch dies;
    - in the dungeon, the door slams, the torch dies, control's message reads "WHO IS WITH YOU?", and grey fingers curl over the radio. Black.
  - **Sound:** diegetic, no score: radio squelch, boots, a woman running and the dungeon slam (ElevenLabs SFX, 272 credits), library door, page and chair sounds, the wind off the bay (it drops dead when the tall man straightens).
  - **Lessons:**
    - a `cylinderGeometry` vault along z needs `rotation [π/2, 0, 0]` with `thetaStart π/2` (`[π/2, 0, π/2]` laid it across the corridor as a wall);
    - near-lens props get their own canvas, with readable text drawn as a bitmap font at about 1:1 texels;
    - a hand that close must be shown in part (fingertips), not whole.
  - **Care:** the soldiers and the governor are never shown; the curse is told as legend and the heart as history; the remains are not linked to the Lady in Grey; most sources are tourism pages.
  - **Voice:** Jack, both takes at once (1,776 credits). Take 2 was used, as it was shorter. The line "I walk it alone" was cut, inner pauses were capped at 0.32 s, and atempo is 1.05 to fit 60 s.
  - **Sound figures:** bed presence −12.2 / −6.8 dB, lines ≥7.3 dB with no lifts, −14.0 LUFS, decoded peak −1.28 dBFS, the loop restarts from black and silence.
  - **Delivery:** `assets/videos/ep26-castle-v1/`. Notes are in `docs/production/ep26-castle/README.md`; the publishing kit is `docs/publishing/ep26/README.md` and `docs/publishing/POSTS-ep21-30.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 27 "The Ball" (Waverly Hills Sanatorium; a night-vision walk following a ball that rolls away).

- **Episode 27 "The Ball" (2026-11-12):** the user asked for the "next ep". Waverly Hills Sanatorium (Louisville, Kentucky), a real place with reported hauntings. `Ep27TheBall` / `src/horror/ep27/` is 55.0 s, in English.
  - **Form:** an investigator's handheld black-and-white infrared camera (its own lamp, REC, timecode, corner marks; unlike Season 2's green camcorder) following the investigators' ball. There is no jump scare; the ball does everything:
    - it rolls away by itself (the hook);
    - the building on its hill, with our lamp in a window;
    - it rolls along the open porch;
    - in the body tunnel it bounces down the steps from behind us and past;
    - on the third floor it turns into a ward, stops at an iron bed and rolls back to our feet;
    - "Roll it back": it comes back, fast;
    - two points of eyeshine in the dark at a child's height blink. Black.
  - **Sound:** silence-heavy, no score: the camera fan, the building settling, the boots (Episode 26's steps reused), and the ball on concrete, bouncing and tapping the bed (ElevenLabs SFX, 272 credits). The eyes get no sound.
  - **Lessons:** solve a moving prop's path from the cue time (the tunnel ball was still behind the camera at its cue); a building on a hill needs the camera above the hill's crest; infrared makes foliage pale.
  - **Care:** no patient shown; the inflated toll is corrected in the narration; the boy is a story with no record; no Room 502 suicide material.
  - **Voice:** Jack, both takes at once (1,332 credits; take 1 used), no tempo change.
  - **Sound figures:** bed presence −14.9 / −9.9 dB (silence-heavy), lines ≥9.7 dB with no lifts, −14.0 LUFS, decoded peak −1.55 dBFS, the loop restarts from black and silence.
  - **Delivery:** `assets/videos/ep27-ball-v1/`. Notes are in `docs/production/ep27-ball/README.md`; the publishing kit is `docs/publishing/ep27/README.md` and `docs/publishing/POSTS-ep21-30.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 28 "Developing" (the Brown Lady of Raynham Hall, 1936; flash after flash on the staircase).

- **Episode 28 "Developing" (2026-11-12):** the user asked for the "next ep". The Brown Lady of Raynham Hall (Norfolk, 19 September 1936), a real documented photograph. `Ep28Developing` / `src/horror/ep28/` is 57.2 s, in English.
  - **Form:** the 1936 staircase hall (black and white, gate weave, lamp and magnesium flash) cut hard against the darkroom (red safelight, the print developing in the tray, drawn live onto a canvas texture).
    - The view camera's ground glass is shown upside down (camera roll π) under the focusing cloth with its grid.
    - Only the two flashes of the real account happen: the first flash shows nothing; on the ground glass a vapour comes down and becomes a veiled woman; the second flash lights her on the stairs; then the lamp shows the stairs empty.
    - The print comes up; a figure stands on the moonlit landing, then is gone.
    - The stop bath keeps developing, and she comes down the stairs in the print to the lens; a last flash at the lens. Black.
  - **Sound:** no score: the hall clock, the shutter and dark slide, the magnesium flash, creaking stairs, the darkroom tray (ElevenLabs SFX, 272 credits); synthesized car, owl, hum, drips.
  - **Lessons:**
    - point lights cast no shadows, but a staircase's treads face away from a lamp below them, so light the stair from above (a sconce);
    - a near-lens face must not be overexposed by a flash at full strength;
    - a ground glass reads only with a visible frame and grid.
  - **Care:** the photographers are seen from behind and not named on screen; the skeptics' view (double exposure, the lens) is in the narration; a private home, no dares; the continued developing and the face at the lens are our dramatisation.
  - **Voice:** Jack, both takes at once (1,632 credits; take 1 used), no tempo change.
  - **Sound figures:** bed presence −15.4 / −9.5 dB (quiet by design), lines ≥10.4 dB with no lifts, −14.0 LUFS, decoded peak −2.0 dBFS, the loop restarts from black and silence.
  - **Delivery:** `assets/videos/ep28-brown-v1/`. Notes are in `docs/production/ep28-brown/README.md`; the publishing kit is `docs/publishing/ep28/README.md` and `docs/publishing/POSTS-ep21-30.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 29 "Checkout Is at Ten" (Monte Cristo Homestead, Junee, New South Wales; the overnight guest, in real time).

- **Episode 29 "Checkout Is at Ten" (2026-11-12):** the user asked for the "next ep". Monte Cristo Homestead (Junee, New South Wales), a real place with reported hauntings, closed to visitors since January 2025 and private. `Ep29CheckoutIsAtTen` / `src/horror/ep29/` is 53.4 s, in English.
  - **Form:** second person, in real time on the phone's own clock (2:58 to 3:01). The frame is the phone's camera screen: torch, status bar, REC, and stop and flip buttons.
  - **The bookends:** a roaring storm cuts to dead silence (the rain hangs in the air); at the end the camera flips around and the storm slams back over the last frame and the black, so the loop restarts inside the same storm.
  - **The events:** the house with your window lit; candlelight under a far door goes out; the wardrobe creaks open; a woman in black walks the balcony behind the lace and turns to face you; pale fingers on your shoulder; the front camera shows your face and hers beside it.
  - **Sound:** no score: the storm, the balcony footsteps, the wardrobe and a breath (ElevenLabs SFX, 272 credits); drips, frogs, the candle and the phone's click synthesized.
  - **Lessons:**
    - a black figure needs a lit backdrop (the night outside the doors was raised to a moonlit blue);
    - a phone torch 15 cm from a hand overexposes it, so dim it as the camera turns;
    - mirror the front camera with `translateX(width) scale(-6, 6)`.
  - **Care:** the family is not named; the unverified tragedy stories and the 1960 killing are not used; nothing is claimed as proven; no visiting framing.
  - **Voice:** Jack, both takes at once (1,430 credits; take 1 used), no tempo change.
  - **Sound figures:** bed presence −19.7 dB during speech and +4.5 dB in the gaps (the storm bookends; near silence between them by design), lines ≥16.2 dB with no lifts, −14.0 LUFS, decoded peak −2.04 dBFS, the loop seam inside the storm (−13.9 / −8.9 dBFS).
  - **Delivery:** `assets/videos/ep29-monte-v1/`. Notes are in `docs/production/ep29-monte/README.md`; the publishing kit is `docs/publishing/ep29/README.md` and `docs/publishing/POSTS-ep21-30.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 30 "What They Tell You" (Poveglia, the Venetian Lagoon; the season finale: the legend, corrected by the record).

- **Episode 30 "What They Tell You" (2026-11-12):** the user asked for the "next ep". The Season 3 finale: Poveglia (the Venetian Lagoon), a real island with a famous legend and a quiet record. `Ep30WhatTheyTellYou` / `src/horror/ep30/` is 52.5 s, in English.
  - **Form:** an unreliable narrator. Jack tells the legend as tourists repeat it ("They say…") over an old travel film (warm, faded, gate weave, projector flicker), and each claim is struck by a stamped "RECORD:" card. At "That's what they tell you" the sound cuts dead and the picture is today (grey).
  - **The events:** the birds lift off the tower (the hook); the grass parts in a line coming towards us; a hospital shutter swings and knocks; the bell swings by itself; then today, the ruined corridor to the end window; the boat we came in leaves without us, someone standing in its stern facing us; one bell; black.
  - **Sound:** no score: bells across the lagoon, water and the boat (ElevenLabs SFX, 272 credits) build to a wall that cuts dead; then near silence, the boat leaving and one bell.
  - **Lessons:** keep trees off a façade shot's line of sight (scattered trees blacked out the hospital); a field event needs the camera looking down into it and its own light; a distant figure on water needs light-grey water and a narrowing lens.
  - **Care:** no patient shown; the doctor and his fall are named only as legend and never depicted (only the bell); the 160,000 and the ash soil are corrected on screen; the island is closed to visitors, and the first card says so.
  - **Voice:** Jack, both takes at once (1,368 credits; take 1 used), no tempo change; gaps widened for the cards.
  - **Sound figures:** bed presence −8.9 / −0.9 dB (the legend's wall is loud on purpose; the record is near silence), lines ≥4.8 dB with no lifts, −14.0 LUFS, decoded peak −1.62 dBFS, the loop restarts from black and silence into the bells.
  - **Delivery:** `assets/videos/ep30-poveglia-v1/`. Notes are in `docs/production/ep30-poveglia/README.md`; the publishing kit is `docs/publishing/ep30/README.md` and `docs/publishing/POSTS-ep21-30.md`.
  - **Status:** no user approval and no listening pass.
  - **Next:** **Season 3 is complete** (Episodes 21–30, English, Jack). What comes next is the user's call.

- **Season 2: Philippine ghost stories (2026-11-11):** the user asked for ten more episodes, mostly real Philippine ghost and horror stories, scarier than Season 1, for a Filipino audience.
  - **Slate:** `docs/stories/season-2-philippines.md`, Episodes 11–20: five reported hauntings, four folklore creatures and one original (Tik-Tik). Each has its claim versus what is documented, its sources (search summaries only), beats and hidden details. Season order: Balete Drive → Tik-Tik → Manananggal → Diplomat Hotel → Tiyanak → Clark → Tikbalang → Malacañang → Santelmo → Manila Film Center.
  - **Voice:** the user chose **Taglish narration and captions** read by the ElevenLabs library voice **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`). The user listened to the test line (`public/assets/audio/eleven-takes/s2-test-juanito-take1.mp3`) and approved it. **From 2026-11-11 (Episode 13) the user has a paid ElevenLabs Starter account (a new account):** flows from the old account (for example `L6hejcAiUNKAfyBLB3C3`) return "no access to this template", so start a new flow. Free-tier "busy" refusals should be rare now. If one happens, the user's earlier rule still applies: retry every 30 min, at most 4 times, one attempt per check-in.
  - **Horror standard:** the new "Season 2 horror standard" in `docs/production/EPISODE_PLAYBOOK.md`. Key points: a dark key (≤45/255 per shot) with motivated light, one clear lit reveal, the entity kit `src/horror/entities.tsx` (WhiteLady, `flicker`, `handheld`), Filipino settings and ambience, and long silences before stingers.
  - **Status:** none has user approval of the episode or a listening pass.

- **Episode 11 "The Passenger on Balete Drive" (2026-11-11):** the first Season 2 episode (reported urban legend: the White Lady of Balete Drive, New Manila, Quezon City). `Ep11ThePassengerOnBaleteDrive` / `src/horror/ep11/` is 54.6 s, in Taglish.
  - **World:** a Manila taxi interior and Balete Drive at night (compound walls, sodium lamps, condominiums, the balete with root curtains).
  - **Picture:** the mirror shots are a reverse camera with the scene mirrored by a negative-scale group, framed by a 2D mirror and rosary. The new entity kit is `src/horror/entities.tsx`.
  - **Story and picture:** the mirror hook; the woman at the balete; at the side window after being passed; the meter starting by itself as a karaoke far off stops; the empty mirror, then the same framing with hair over the seat; 1.3 s of held silence; one lit reveal of half a face; the empty back seat with petals; the balete ahead again; the loop.
  - **Care:** a legend with no identified victim; the taxi-driver-killer version is dropped; no night-visit framing.
  - **Voice:** Juanito, one take of two (774 credits).
  - **Sound:** presence −11.1 / −3.8 dB, lines 4.9–9.4 dB full band, −14.0 LUFS, decoded peak −1.41 dBFS.
  - **Delivery:** `assets/videos/ep11-balete-v1/`. Notes (with English subtitles) are in `docs/production/ep11-balete/README.md`; the publishing kit is `docs/publishing/ep11/README.md` and `docs/publishing/POSTS-ep11-20.md` (PH posting times, Taglish captions).
  - **Status:** no user approval of the episode and no listening pass.
  - **Next in the season order:** Episode 12 "Tik-Tik" (original, on folklore).

- **Episode 12 "Tik-Tik" (2026-11-11):** the user asked for the "next ep". It is an original built on the tiktik belief (faint means near). `Ep12TikTik` / `src/horror/ep12/` is 51.2 s, in Taglish.
  - **World:** a wooden barrio house on stilts with an open gap under the yero roof (bulb, jalousie with garlic and salt, banig, Lola, an altar), and a fiesta street (banderitas, sari-sari store, videoke tent).
  - **Entity kit:** `Aswang` (face-only or crouched: a narrow pale face, black hair, pinpoint eyeshine, a dropped jaw) and `Tongue` were added to `src/horror/entities.tsx`.
  - **Story and picture:** the dark-room hook; the tik-tik loud and far, then softer and drier, then at the ear; the videoke stopping mid-song; Lola looking up; 1.45 s of silence; the tongue in a moonlight shaft; one lit reveal of the face in the gap; a rooster; dawn with the salt scattered inward and the child safe; the loop.
  - **Care:** fiction; no town named; Lola is the hero.
  - **Voice:** Juanito; both takes generated when the user asked to try again (1,324 credits; take 1 used).
  - **Sound:** presence −10.7 / −3.2 dB, lines 5.2–11.6 dB, no lifts, −14.0 LUFS, decoded peak −1.05 dBFS, bed seam −25.8 / −25.4 dBFS.
  - **Delivery:** `assets/videos/ep12-tiktik-v1/`. Notes (with English subtitles) are in `docs/production/ep12-tiktik/README.md`; the publishing kit is `docs/publishing/ep12/README.md` and `docs/publishing/POSTS-ep11-20.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 13 "Half of Her" (manananggal, folklore).

- **Episode 13 "Half of Her" (2026-11-11):** the user asked for the "next ep" ("Even i get scared with these"). It is folklore: the manananggal. `Ep13HalfOfHer` / `src/horror/ep13/` is 59.9 s, in Taglish.
  - **World:** a nipa hut on stilts with a broken capiz window, a gasera, the wife asleep, the husband with a bolo, a banana grove and a big moon.
  - **Entity kit:** `Manananggal` (whole / lower / winged upper; the waist is a clean black void) and `Villager` were added to `src/horror/entities.tsx`.
  - **Story and picture:** the legs standing alone in the grove (the hook); the kind neighbour by day in the same patadyong; her upper half rising against the moon; the wings; the flame leaning; "Huwag kang titingala"; 1.35 s of silence and a tongue that stops above the sleeping wife; one lit reveal of her face in the broken capiz, lit from below; the run and the salt; a far shriek; the legs fallen at dawn; the wife safe; the loop.
  - **Care:** no named town (no Capiz); the pregnant woman is never harmed.
  - **Voice:** Juanito; the first take on the user's new Starter account, both takes (1,616 credits), with atempo 1.04 to fit 60 s.
  - **Sound:** presence −12.0 / −4.4 dB, lines 5.0–11.9 dB (l07 lifted 1.6 dB), −14.0 LUFS, decoded peak −1.25 dBFS, bed seam −25.9 / −25.0 dBFS.
  - **Delivery:** `assets/videos/ep13-half-v1/`. Notes (with English subtitles) are in `docs/production/ep13-half/README.md`; the publishing kit is `docs/publishing/ep13/README.md` and `docs/publishing/POSTS-ep11-20.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 14 "The Guests of Dominican Hill" (Diplomat Hotel, Baguio; reported legend).

- **Episode 14 "The Guests of Dominican Hill" (2026-11-11):** the user asked for the "next ep". It is a reported legend: the old Diplomat Hotel, Dominican Hill, Baguio. `Ep14GuestsOfDominicanHill` / `src/horror/ep14/` is 55.3 s, in Taglish.
  - **World:** the white roofless ruin among Benguet pines in fog; the dining hall with a table set for dinner; the corridor.
  - **Entity kit:** `Headless` was added (a nun's habit or priest's cassock, seated or walking, an empty dark collar: an absence, never a wound).
  - **Picture:** a flashlight (a spotlight that follows the camera).
  - **Story and picture:** the set-table hook; the hill; people sheltering in the war (no harm); fog; three knocks; plates and voices that stop when the light swings in; a priest walking away; the flashlight dies; chairs scrape in the black; one lit reveal of a nun seated at the head of the table with nothing above the collar; every chair pulled out; dawn with a candle in an upper window; the loop.
  - **Care:** the beheadings are legend, and the narration says historians have no record of them; no night-visit framing.
  - **Facts:** from search summaries only.
  - **Voice:** Juanito, both takes at once on the Starter account (1,556 credits).
  - **Sound:** presence −11.8 / −3.1 dB, lines ≥5.2 dB with no lifts, −14.0 LUFS, decoded peak −1.84 dBFS, bed seam −24.7 / −24.3 dBFS.
  - **Delivery:** `assets/videos/ep14-hill-v1/`. Notes (with English subtitles) are in `docs/production/ep14-hill/README.md`; the publishing kit is `docs/publishing/ep14/README.md` and `docs/publishing/POSTS-ep11-20.md`.
  - **Disk:** the container's disk filled with 40 leftover Remotion bundles; the user approved deleting them, and the render scripts for Episodes 11–14 now remove their own bundle.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 15 "Don't Pick Up the Baby" (tiyanak, folklore).

- **Episode 15 "Don't Pick Up the Baby" (2026-11-11):** the user asked for the "next ep". It is folklore: the tiyanak. `Ep15DontPickUpTheBaby` / `src/horror/ep15/` is 54.2 s, in Taglish.
  - **World:** an empty provincial road at night between walls of cogon grass (one triangle per blade, swaying tips), coconut palms, electric poles; a jeepney on its LAST TRIP (GOD BLESS OUR TRIP, a rosary, a fluorescent tube, facing benches); the driver; morning.
  - **Entity kit:** `Tiyanak` was added to `src/horror/entities.tsx` (a lampin bundle that cries and wriggles; opened, an old wrinkled face on a newborn's body, black eyes, a mouth crowded with small teeth; no gore).
  - **Story and picture:** the crying bundle in the grass (the hook); the jeepney slowing; its point of view on the driver walking to it; his arms sagging under the weight; the crying stops, the engine stalls, 1.5 s of silence; one lit reveal of the face under the tube; black and a giggle; eyeshine inside the dark jeepney; old rotted lampins; morning with his tsinelas on the step and his shirt inside out; handprints on the windshield and a second bundle; the loop.
  - **Care:** the creature is not a real infant; no abortion framing and no mother blamed; the driver is decent and his fate is never shown; the cry is synthesized, not a real infant recording.
  - **Voice:** Juanito, both takes at once on the Starter account (1,470 credits; take 1 used).
  - **Sound:** presence −12.4 / −3.7 dB, lines ≥5.1 dB (l05 +0.8, l06 +0.3), −14.0 LUFS, decoded peak −1.69 dBFS, bed seam −19.9 / −19.3 dBFS.
  - **Delivery:** `assets/videos/ep15-baby-v1/`. Notes (with English subtitles) are in `docs/production/ep15-baby/README.md`; the publishing kit is `docs/publishing/ep15/README.md` and `docs/publishing/POSTS-ep11-20.md`.
  - **Status:** no user approval and no listening pass (the synthesized cry is unheard).
  - **Next in the season order:** Episode 16 "Ward Three" (reported legend, Clark).

- **Episode 16 "Ward Three" (2026-11-11):** the user asked for the "next ep". It is a reported legend: the abandoned hospital of the former Clark Air Base, Angeles, Pampanga. `Ep16WardThree` / `src/horror/ep16/` is 58.8 s, in Taglish.
  - **World:** a long low hospital in tall weeds (front corridor with a wheelchair; Ward 3 with bare bed frames, peeling two-tone paint and a clock stopped at 3:07), three faceless ghost hunters, their car; the road and land are Episode 15's, with an orange city glow (`Land city`).
  - **Entity kit:** `Nurse` was added to `src/horror/entities.tsx` (an old white uniform and cap; head bowed under black hair, or lifted with the face full and eyes all white).
  - **Picture:** a camcorder night-vision viewfinder (an infrared light at the camera, an SVG green matrix, REC/NIGHT/timecode UI); the nurse is three beds closer each time the camera looks back.
  - **Lesson:** the PS1 shader lights per vertex, so a large floor box under a flashlight stays black; subdivide big surfaces that a spotlight must light. Exterior cameras must stand above or outside the 1.8 m cogon.
  - **Care:** a reported legend; the nurse is not a real person; no era is given (sources differ); no trespass call; no US–PH politics.
  - **Voice:** Juanito, both takes at once (1,694 credits; take 1 used).
  - **Sound:** presence −12.9 / −3.6 dB, lines ≥5.0 dB (l08 +0.9), −14.0 LUFS, decoded peak −1.5 dBFS, bed seam −18.7 / −17.8 dBFS.
  - **Delivery:** `assets/videos/ep16-ward-v1/`. Notes (with English subtitles) are in `docs/production/ep16-ward/README.md`; the publishing kit is `docs/publishing/ep16/README.md` and `docs/publishing/POSTS-ep11-20.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 17 "The Road That Wouldn't End" (tikbalang, folklore).

- **Episode 17 "The Road That Wouldn't End" (2026-11-11):** the user asked for the "next ep". It is folklore: the tikbalang. `Ep17TheRoadThatWouldntEnd` / `src/horror/ep17/` is 57.7 s, in Taglish.
  - **World:** a barrio dirt road between towering bamboo (merged meshes), the sari-sari store TINDAHAN NI ALING NENA (invented; its price board changes every pass), Episode 11's balete mirrored to the left with the kapre's ember, a chapel, a waiting shed, a tricycle with its rider, a big moon, rain.
  - **Entity kit:** `Tikbalang` was added to `src/horror/entities.tsx` (about 3.2 m; a horse's head on a gaunt body, hooves, mane; stand or squat with knees above the head; `lower` brings the face into the light).
  - **Story and picture:** the third pass of the store (the hook, with the figure already behind it); the long road; a figure taller than the bamboo; the chapel and shed; the store again, its bulb flickering; rain under a clear moon; the balete and its ember; he stops and cuts the engine; silence and a breath; he turns the handlebar and the beam finds it squatting; he turns his shirt inside out; dawn with hoofprints circling the tricycle; the loop.
  - **Lesson:** subdivide every large surface (the `Box` helper in `ep17/world.tsx` does it by size); single-segment bamboo culms and road planes stay black under a headlight.
  - **Care:** the beliefs save the rider; no comic tikbalang; the store's name is invented.
  - **Voice:** Juanito, both takes at once (1,650 credits; take 1 used).
  - **Sound:** presence −12.9 / −4.9 dB, lines ≥4.8 dB (l06, l07 +0.5), −14.0 LUFS, decoded peak −1.06 dBFS, bed seam −19.0 / −18.0 dBFS.
  - **Delivery:** `assets/videos/ep17-road-v1/`. Notes (with English subtitles) are in `docs/production/ep17-road/README.md`; the publishing kit is `docs/publishing/ep17/README.md` and `docs/publishing/POSTS-ep11-20.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 18 "The Light in the Quezon Room" (reported legend, Malacañang).

- **Episode 18 "The Light in the Quezon Room" (2026-11-11):** the user asked for the "next ep". It is a reported legend: Malacañang staff recollections reported in the press. `Ep18TheLightInTheQuezonRoom` / `src/horror/ep18/` is 55.6 s, in Taglish.
  - **World:** a composite historic palace by a river (capiz windows, one that lights by itself), a long hall with narra boards and portraits that are only dark landscapes, the office (green desk lamp, a chair turned to the window, a clock at 3:15, a strip of light under the door), a sitting room with an ashtray, a ball and a small shoe, a generic guard.
  - **Entity kit:** `Headless` gained a `sotana` habit (a white cassock) and swinging sleeves when walking.
  - **Story and picture:** the window lights (the hook); the river; the guard's round; light under a door; the empty office; dust falling as pacing sounds above; smoke from no one; a ball rolls out; silence; the guard turns and a headless white sotana walks away; the guard switches the lamp off (the chair now faces the desk); the dark window, which lights again just after the loop seam.
  - **Care:** no living official, no past president named or shown, no faces in portraits, nothing political; told as staff stories.
  - **Voice:** Juanito, both takes at once (1,590 credits; take 1 used).
  - **Sound:** presence −13.7 / −3.5 dB, lines ≥5.2 dB with no lifts, −14.0 LUFS, decoded peak −1.31 dBFS, bed seam −24.3 / −24.3 dBFS (3 dB tail pre-duck).
  - **Delivery:** `assets/videos/ep18-palace-v1/`. Notes (with English subtitles) are in `docs/production/ep18-palace/README.md`; the publishing kit is `docs/publishing/ep18/README.md` and `docs/publishing/POSTS-ep11-20.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 19 "Santelmo" (folklore and science).

- **Episode 19 "Santelmo" (2026-11-11):** the user asked for the "next ep". It is folklore and science: the santelmo, and the real St. Elmo's fire. `Ep19Santelmo` / `src/horror/ep19/` is 51.9 s, in Taglish.
  - **World:** flooded rice paddies at night (merged palay tufts, the pilapil grid, a canal with a pump, a nipa hut, palms), the farmer with a salakot and flashlight, the santelmo (core, glow, halo, flame tongues), and a sailing ship in a storm with St. Elmo's fire on its masts.
  - **Entity kit:** `DrownedFace` was added to `src/horror/entities.tsx` (pale blue-grey, clouded eyes, mouth open, hair floating as if under water).
  - **Story and picture:** the light pacing him (the hook); across the paddy; the wide with a glow under the canal; the ship (science); he stops, it stops; over the canal; the frogs stop and it splits into three; silence as it comes to his face; one lit reveal of a drowned face in the fire; he turns his shirt inside out and it sinks into the canal; dawn with a scorched circle and a fourth light; the loop.
  - **Lesson:** a portrait frame is only about ±15° wide; keep what matters within that cone (the light and the farmer were out of frame at first).
  - **Care:** no drowning depicted; the face is a legend image; the science is stated plainly.
  - **Voice:** Juanito, both takes at once (1,424 credits; take 1 used).
  - **Sound:** presence −12.9 / −4.5 dB, lines ≥4.7 dB (l06 +1.4, l07 +1.9, l08 +1.1), −14.0 LUFS, decoded peak −1.31 dBFS, bed seam −18.9 / −18.5 dBFS.
  - **Delivery:** `assets/videos/ep19-santelmo-v1/`. Notes (with English subtitles) are in `docs/production/ep19-santelmo/README.md`; the publishing kit is `docs/publishing/ep19/README.md` and `docs/publishing/POSTS-ep11-20.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** Episode 20 "The Theatre by the Bay" (the season finale; a reported legend over a real accident).

- **Episode 20 "The Theatre by the Bay" (2026-11-12):** the user asked for the "next ep". It is the Season 2 finale: a reported legend over a real accident (the Manila Film Center, 17 November 1981). `Ep20TheTheatreByTheBay` / `src/horror/ep20/` is 60.0 s, in Taglish.
  - **World:** composites of the white building by the bay (now, 1981 with scaffolding, work lights and a site clock at 3:00, and the festival with searchlights and an empty red carpet), the lobby's grand staircase, and the theatre (ten rows of red folding seats with independent pads, a closed curtain, dust handprints, a clock at 3:00); `DustFigure` (seated, from behind, dust-grey, no face) and `HardHat` are local to `ep20/world.tsx`.
  - **Story and picture:** a seat folds down by itself (the hook); the building; 1981, the empty scaffold sways, then black and total silence; a hard hat on a plank; the festival's empty carpet; footsteps, hammering and a trowel on the stairs; seats fold down one by one; silence; the beam sweeps rows of dust-grey backs, one turns its head; lights out; a hard hat on a seat, then gone; the loop.
  - **Care:** no worker shown at any time; no crash sounded; the toll told as disputed; entombment not stated; no officials or politics; the last line honours the workers.
  - **Voice:** Juanito, both takes at once (1,800 credits; take 1 used), atempo 1.05 to fit 60 s.
  - **Sound:** presence −14.2 / −5.2 dB (the score is silent after the black on purpose), lines ≥4.9 dB (l08 +0.7), −14.0 LUFS, decoded peak −1.32 dBFS, bed seam −17.9 / −18.6 dBFS.
  - **Delivery:** `assets/videos/ep20-theatre-v1/`. Notes (with English subtitles) are in `docs/production/ep20-theatre/README.md`; the publishing kit is `docs/publishing/ep20/README.md` and `docs/publishing/POSTS-ep11-20.md`.
  - **Status:** no user approval and no listening pass.
  - **Next:** **Season 2 is complete** (Episodes 11–20, all in Taglish with Juanito). From Episode 17 on, the delivered MP4 carries the checked `mix.m4a` muxed over Remotion's picture (`-c copy`), because Remotion's own AAC re-encode can peak just over −1 dBFS. What comes next is the user's call.

- **Eerie ElevenLabs narration (2026-11-10):** the user connected ElevenLabs and asked to change the robotic voiceover into an eerie one for Episodes 1–6.
  - **Recommendation:** a human-sounding dark narrator. The robotic voice only fits diegetic framing, so Episode 1 keeps a broadcast chain and Episode 4 a tape chain, with the door line as the same voice through a door.
  - **Voices** (ElevenLabs connector, `eleven_v4`, audio tags): **Jack – Deep Dark Horror Narrator** for true cases (Episodes 2, 3, 5) and **True – Crime & Horror Narrator** for fiction (Episodes 1, 4, 6).
  - **Method:** `scripts/revoice_eleven.py` splits one whole-episode take per episode into lines (`scripts/eleven_split.py`) and places each line on its original start time, so the captions and picture are unchanged (`-c:v copy`). Each line's level is matched to the old line, and any line under 4.5 dB over everything else is lifted.
  - **Delivered:** `ep01-moon-v4`, `ep02-mask-v3`, `ep03-snow-v3`, `ep04-night-v3`, `ep05-tent-v3` and `ep06-sonar-v2` (MP4s named `*-eerie-voice.mp4`). Episodes 4 and 1 were generated after the user reconnected ElevenLabs; for Episode 1 one of two takes generated (the other hit the account's free-tier warning).
  - **Docs:** prompts, takes, credits and limits are in `docs/production/eleven-revoice/`.
  - **Status:** no listening pass and no user approval.
  - **New episodes:** use these two voices.
- **Horror standard, from the user's note on 2026-11-10:** "there's no eerie or creepy background music … Make the videos more scary and horror and creepy."
  - **Why:** measured in the phone band (200 Hz–4 kHz), the scores of Episodes 1–5 sat 17–28 dB under the voice. Their drones were sub-bass, which phones don't reproduce.
  - **Score rule for every new episode:** build the score with `scripts/horror_score.py`, voiced in about 110 Hz–5 kHz:
    - a mid-band drone, tremolo string clusters and a detuned music-box theme;
    - reversed swells, stingers, a heartbeat, a riser and bowed metal.
  - **Presence check:** report `presence()`. Aim for about −8 to −12 dB against the voice during speech and about −3 to −6 dB in the gaps. Duck about 7 dB under speech, and keep every line at least 4 dB above everything else.
  - **Scares:** put each stinger in silence (just after or before a line, never on a word). Use silence deliberately before big moments. Add camera jolts and tape tears on scares, a point-of-view reveal where it fits, subliminal frames and red/dark grading.

- **Horror re-score of Episodes 1–5 (2026-11-10, same user note):** `scripts/rescore_horror.py` adds the new score over each episode's unchanged stems and muxes it onto the unchanged picture (`-c:v copy`). The new versions are `ep01-moon-v3`, `ep02-mask-v2`, `ep03-snow-v2`, `ep04-night-v2` and `ep05-tent-v2` (MP4s named `*-horror-score.mp4`); earlier versions are kept. In the gaps, the music now sits 5.5–7.9 dB under the voice, against 21–28 dB before. Figures, the tightest lines and loop seams are in `docs/production/horror-rescore/README.md`. None has user approval or a listening pass.

- **Episode 10 "The Night the Lake Breathed Out" (2026-11-11):** the user asked for the "next ep". It is the true story #5 and the season finale: the Lake Nyos limnic eruption, Cameroon, 21 August 1986, with 1,746 deaths and living survivors. `Ep10TheNightTheLakeBreathedOut` / `src/horror/ep10/` is 59.9 s.
  - **World:** a crater lake (a heightfield with a rim and a notch into the north valley), the village in the valley, the mist, the lake seen from underwater with its deep layer, the degassing pipe and a second lake.
  - **Story and picture:** the hook on the still night lake; the lamps in the valley; the rumble and the lake lifting; the plume; the mist pouring down the valley; one lamp going out; a held black; the same view at dawn, empty; the red lake; underwater, the deep layer letting go; the pipe today; another lake with one bubble; the loop.
  - **Care:** no people or animals are shown. The deaths are carried by the lamp, the crickets stopping and the black. The trigger is said to be still debated.
  - **Hidden details:** five (the lamp, the crickets stopping at the same moment, cold ash, the red lake, a ring on the water across the loop).
  - **Facts:** from search summaries only.
  - **Voice:** Jack. The first call was busy (not charged); on the scheduled retry one take of two generated (945 credits).
  - **Sound:** presence −11.4 / −3.3 dB, every line ≥5.9 dB with no lifts, −14.0 LUFS, decoded peak −1.26 dBFS, seam −22.7 / −23.4 dBFS.
  - **Delivery:** `assets/videos/ep10-lake-v1/`. Notes are in `docs/production/ep10-lake/README.md`; the publishing kit is `docs/publishing/ep10/README.md` (also added to `docs/publishing/POSTS-ep01-08.md`).
  - **Status:** no user approval and no listening pass.
  - **Next:** all ten season-1 stories are now produced. What comes next (a season 2 slate, long-form versions, or posting first) is the user's call.

- **Episode 9 "The Lighthouse That Went Dark" (2026-11-11):** the user asked for the "next ep". It is the true story #3: the Flannan Isles lighthouse, December 1900, with three real men never found. `Ep09TheLighthouseThatWentDark` / `src/horror/ep09/` is 54.3 s.
  - **World:** one island with an animated sea: the tower and the quarters, with the kitchen inside (its west door opens on the real island); the east landing with the bare flagstaff; the west landing with torn railings on the cliff face; a night steamer, the tender and a rowing boat.
  - **Story and picture:** the hook from the rowing boat at the dark tower; the stopped clock (one tick, then nothing); one set of oilskins; the railings; the storm reconstruction; the wave filling the frame, then the empty morning; the doorway at night.
  - **Hidden details:** five (the cold range, three hooks, the calendar crossed off to the 15th, three mugs and chairs pushed in, a two-frame lantern).
  - **Facts:** the disputed logbook entries, the overturned chair and the half-eaten meal are not used, and the keepers are not named. Facts come from search summaries only.
  - **Voice:** Jack; both takes generated this time, and take 1 is used.
  - **Sound:** presence −12.2 / −3.1 dB, every line ≥4.6 dB, −14.0 LUFS, decoded peak −1.36 dBFS; loop seam −24.4 / −24.9 dBFS after a 2.6 dB tail pre-duck.
  - **Delivery:** `assets/videos/ep09-lighthouse-v1/`. Notes are in `docs/production/ep09-lighthouse/README.md`; the publishing kit is `docs/publishing/ep09/README.md` (also added to `docs/publishing/POSTS-ep01-08.md`).
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** #5 "The Night the Lake Breathed Out" (true: Lake Nyos, 1986, about 1,700 deaths), the heaviest case and the one that needs the most care.

- **Channel identity (2026-11-11):** the user asked for the channel's name, description, profile picture and cover image, and for viral posts for Episodes 1–8 (YouTube and TikTok).
  - **Name:** the recommended name is **After Sign-Off** (`@aftersignoff`; handle availability unchecked): broadcasts that come on after the station signs off. Alternatives and the Odd Atom question (a fresh channel is recommended; it's the user's call) are in `docs/publishing/channel/README.md`, with the YouTube description, the TikTok bio, keywords, playlists and posting rhythm.
  - **Art:** rendered in the channel's own pixel-3D style (`src/horror/channel/ChannelArt.tsx`, `npm run render:channel`). The profile picture is `assets/channel/after-sign-off-avatar-800.png` (a CRT with a figure in the static). The banner is `assets/channel/after-sign-off-banner-2560x1440.png` (the Episode 7 town and mast, with the title inside the 1546×423 safe area). No image generator was available, and no third-party art is used.
  - **Posts:** `docs/publishing/POSTS-ep01-08.md` has, per episode, the upload file, YouTube title and alternative, description and pinned comment, and the TikTok caption, cover text and pinned comment. Nothing has been posted, and the user has not approved the name or the art.

- **Episode 8 "Room Zero" (2026-11-10):** the user asked for the "next ep". It is the original story #9. `Ep08RoomZero` / `src/horror/ep08/` is 57.8 s.
  - **World:** one empty two-storey house inside and out, rendered either normally or through a **thermal camera** (an ironbow material set plus a heat map drawn on the end wall), with a diegetic thermal UI.
  - **Story and picture:** a thermal hook on the blank end wall; the tape measure finds 2 m you can't reach; three knocks, two answer, and in thermal a body with its palms on the far side; the report; the buyers' photo of a new door; the loop back into the thermal hook.
  - **Hidden details:** five, including thermal-only footprints to the wall, an erased box on the floor plan, the curtained window that is lit in the evening, the reading creeping 36.8 → 37.4, and the door seam already in the hook (the new door has no handle on the hallway side).
  - **Voice:** ElevenLabs True (fiction), one take; the second take hit the free-tier warning again. Pauses inside a line were shortened to 0.35 s to fit 60 s.
  - **Sound:** presence −11.0 / −3.9 dB, every line ≥5.8 dB, −14.0 LUFS, decoded peak −1.89 dBFS.
  - **Delivery:** `assets/videos/ep08-room-v1/`. Notes are in `docs/production/ep08-room/README.md`; the publishing kit is `docs/publishing/ep08/README.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** #3 "The Lighthouse That Went Dark" (true: Flannan Isles, 1900). Do not use the fabricated logbook entries.

- **Episode 7 "This Is the Voice of Vrillon" (2026-11-10):** the user asked for the "next episode in a new session". It is the true story #2: the Southern Television broadcast interruption, 26 November 1977. `Ep07TheVoiceOfVrillon` / `src/horror/ep07/` is 59.8 s.
  - **World:** a terraced-house through-lounge with a 1970s TV on legs, the terrace and the town, the hill with the lattice mast (seen over the rooftops and through the back window), and the transmitter building's meters.
  - **Story and picture:** a hook on the newsreader's moving lips; the sound dissolves into a hum; a point of view from inside the TV; the mast; the sound snaps back; years later, the empty room; the TV switches itself on into the loop.
  - **Hidden details:** five, including the clock moving 5:10 → 5:16, the child looking at the back window, SOUND pinned while VISION reads normal, a red light on a far hill, and three people reflected in the dark screen of the empty room.
  - **Voice:** the first episode generated to the new ElevenLabs standard. Jack (true case) is one take, split, with the timeline built from the real line durations. The intruding line is MBROLA us2 through a TV-speaker chain, because the ElevenLabs fiction-voice generation failed (free-tier warning).
  - **Sound:** presence −12.2 / −4.0 dB, every line ≥4.8 dB, −14.0 LUFS, decoded peak −1.59 dBFS.
  - **Facts:** from search summaries only (Wikipedia is blocked here). Only the short opening line is quoted; no one is named or implied; it is treated as an unsolved hoax.
  - **Delivery:** `assets/videos/ep07-vrillon-v1/`. Notes, facts and margins are in `docs/production/ep07-vrillon/README.md`; the publishing kit is `docs/publishing/ep07/README.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** #9 "Room Zero" (original).

- **Episode 6 "The Sound That Matched Us" (2026-11-10):** the first episode to the new standard. It is the original story #10, next in the season order. `Ep06TheSoundThatMatchedUs` / `src/horror/ep06/` is 55.6 s.
  - **Story and picture:** a sonar waterfall hook; a match with own ship; ALL STOP silence; three knocks; a point-of-view reveal of the cook beside the operator.
  - **Loop and details:** the loop runs on a loop-continuous waterfall. There are five hidden details, including the cook already present in the wide before the reveal and a two-frame figure in the galley hatchway.
  - **Sound:** the fiction voice (us2). Music presence is −10.9 dB during speech and −5.2 dB in the gaps.
  - **Delivery:** `assets/videos/ep06-sonar-v1/`. Notes are in `docs/production/ep06-sonar/README.md`; the publishing kit is `docs/publishing/ep06/README.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** #2 "This Is the Voice of Vrillon" (true).

- **Episode 5 "Nine Hikers, One Cut Tent" (2026-11-10):** the user asked for the "next ep". It is the true story #4: the Dyatlov Pass incident, 1959, with nine real victims. `Ep05NineHikersOneCutTent` / `src/horror/ep05/` is 57.5 s, built on one scaled slope with the tent, nine trails of prints, the cedar, the ravine and the slab.
  - **Viral standard:**
    - a second-person hook from inside the tent, with a blade through the canvas;
    - a loop whose last 1.6 s replay the hook mid-cut, with one continuous tear sound across the seam;
    - four hidden details: the boots left inside, nine lines of prints, branches broken high on the cedar, and a faint light in the sky (dramatisation);
    - an open question.
  - **Victim care:** no deaths, bodies or injuries are shown or described, and no one is accused. The narrator is the us1 true-case voice.
  - **Delivery:** `assets/videos/ep05-tent-v1/`. Notes, shot list, fact-check limits and margins are in `docs/production/ep05-tent/README.md`; the publishing kit is `docs/publishing/ep05/README.md`.
  - **Before posting:** re-check the cedar fire, the May ravine discovery and the "compelling natural force" wording in a full source.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** #10 "The Sound That Matched Us" (original).

- **Episode 4 "Rules for the Night Shift" (2026-11-10):** the user asked for the "next ep". It is the original story #7, the next in the season order (8 → 1 → 6 → 7 → 4). `Ep04RulesForTheNightShift` / `src/horror/ep04/` is 55.8 s, set at a mountain weather station where the picture tests each rule.
  - **Viral standard:**
    - a second-person hook on the rule sheet;
    - a loop whose last 1.45 s replay the hook's push-in;
    - four hidden details: rule 7 on the sheet from frame 0, a log row reading +37.0, a figure in the dark monitor for four frames, and the clock reading 03:59 in the last shot;
    - an open question: who wrote the log?
  - **Voice:** fiction uses MBROLA **us2** (Episode 1's voice); true cases use us1. The voice outside the door at 4 a.m. is the same us2 voice, muffled.
  - **Delivery:** `assets/videos/ep04-night-v1/`. Notes, shot list and margins are in `docs/production/ep04-night/README.md`; the publishing kit is `docs/publishing/ep04/README.md`.
  - **Status:** no user approval and no listening pass.
  - **Next in the season order:** #4 "Nine Hikers, One Cut Tent" (true: Dyatlov Pass), which needs the same victim care as Episode 3.

- **Episode 3 "Footprints in the Snow" (2026-11-10):** the user asked for the "next ep". It is story #6 in the season release order (8 → 1 → 6 → 7): the Hinterkaifeck case, Bavaria 1922, which has six real victims including children. `Ep03FootprintsInTheSnow` / `src/horror/ep03/` is 58.4 s to the viral standard:
  - a second-person hook over the tracks to the lit door;
  - a loop whose last 1.8 s replay the hook's own camera move on negative time, with the snowfall and a crunching-step cadence continuous;
  - four hidden details, all dramatisation: the glowing attic window, the glint between the ceiling boards, the breath in the lantern light, and the key in the hay hollow;
  - an open question.

  The killings are only a window going dark, then black and silence. The family is never shown, and the farmer is shown only in shadow. No suspect is named anywhere, although web sources name one. The narrator is the us1 archive voice, as in Episode 2. Delivery is `assets/videos/ep03-snow-v1/`; notes, shot list, fact conflicts and voice margins are in `docs/production/ep03-snow/README.md`; the publishing kit is `docs/publishing/ep03/README.md`. Re-check the chimney-smoke and cattle details in a full source before posting. It has no user approval and no listening pass. The next episode in the season order is the original #7 "Rules for the Night Shift".

- **Episode 2 "The Mask on Channel 11" (2026-11-10):** the user asked for the next episode "in a new session. Same quality." `Ep02MaskOnChannel11` / `src/horror/ep02/` (`world.tsx`, `Episode02.tsx`) is a 58.7 s portrait true-story episode (the 1987 Chicago signal intrusions) to the viral standard: the mask on the CRT with the buzz and a second-person line on frame 0; a loop where the closing static resolves into frame 0 (score tones snapped to whole cycles with `qf()`); four hidden details (VCR REC CH09→CH11, the circled 11:00 listing, the clock at 9:14/11:15, a two-frame mask in the static); and an open question. One world: apartment, master control, transmitter room, and the tower seen through the window. The narrator is MBROLA **us1** (us3 drops vowels). It has an original score, foley and Curio cues at −14 LUFS. Delivery is `assets/videos/ep02-mask-v1/`; notes, shot list, fact-check limits and voice margins are in `docs/production/ep02-mask/README.md`; the publishing kit is `docs/publishing/ep02/README.md`. Never name or imply a suspect; no real broadcast footage or audio is used. Fact re-check used search summaries only (Wikipedia and WTTW fetches were blocked by network policy). It has no user approval and no listening pass.

- **Episode 1 viral cut (2026-11-10):** the user asked to build the episode as viral content. `Ep01ViralCut` / `src/horror/ep01/Episode01Viral.tsx` is 49 s with a second-person hook on frame 0, a seamless loop, hidden rewatch details and a −14 LUFS mix. Delivery is `assets/videos/ep01-moon-v2/`; paste-ready titles, captions, pinned comment and hashtags are in `docs/publishing/ep01/README.md`. Apply the same viral standard (hook in under 1 s, 45–60 s, loop, hidden details, an open question) to new episodes. Posting is the user's job, and no views are guaranteed. It has no user approval yet.

- **Episode 1 test (2026-11-10):** `Ep01DoNotLookAtTheMoon` / `src/horror/ep01/` is an 81 s portrait episode in the new format: one consistent low-poly world, a 180×320 render upscaled 6× (more pixelated than the Galileo test, as the user asked), a cinematic shot plan where the picture carries the story, a robotic broadcast voice (espeak-ng + MBROLA us2), an original score and foley. The user asked for professional cinematography and for storytelling through the picture with narration only supporting it; keep that standard. Notes, shot list and sound map are in `docs/production/ep01-moon/README.md`. Delivery is under `assets/videos/ep01-moon-v1/`. It has no user approval yet.

- **Channel pivot (2026-11-10):** the user is turning the channel into **horror storytelling in pixel 3D analog horror**: real cases, viral scary stories and our own originals, shorts first and then long-form episodes. *What if* science videos are retired. The Galileo test is the look baseline ("excellent already"); the user is gathering visual references before further look development, possibly at a lower resolution than 270×480. Season 1 scripts (ten 70-second stories: six true, four original, in Google Vids tag format, with facts and sensitivity notes) are in `docs/stories/season-1-shorts.md`. Do not adapt Reddit or creepypasta stories without the author's written permission. Re-check true-story facts before publishing, and never show victims' bodies or gore from real cases.

- **New style direction (2026-11-10): analog horror in pixelated low-poly 3D.** The user rejected the flat illustration attempts (`docs/production/odd-atom-style-v2/v3-rejected.md`: "too ugly") and proposed this style. First test: `HorrorGalileoTape` / `src/horror/GalileoTape.tsx` with PS1 helpers in `src/horror/ps1.ts`: 24 s of Galileo-probe "recovered telemetry" with VHS damage, synthesized and library sound, and no voice-over. Delivery is `assets/videos/horror-galileo-v1/`; notes, facts and limits are in `docs/production/horror-galileo/README.md`. It has no user approval yet. Rendering needs software WebGL (`gl: 'swangle'`, set in the scripts).

- **Channel context (2026-11-10):** the user's channel is **Odd Atom**: vertical 1080×1920 science shorts (67–93 s) posted to YouTube Shorts and TikTok. The user's Drive folder `1E4yubNFpmjbE9Om14TSh0yTT6TqbQvGI` holds 16 posted shorts (`posted/`), 5 unposted shorts, `POSTS_ALL.md` social drafts, 8 sample clips and the retired character SVGs. They asked for viral videos in the style of the reference channel **and** for animation quality closer to it. Read `docs/style/README.md` first: it covers the colour, light, depth, composition and character study and the audit of all 21 Odd Atom shorts, and it defines **Odd Atom visual system v2** (light first, three depths, one colour contrast per scene, camera travel instead of card cuts, text budget, acting characters). Copy techniques, never the reference channel's characters, logo or designs. The environment `odd-atom` allows Drive downloads; keep downloaded footage out of Git.
- **Latest style test:** `OddAtomJupiterV2Opening` / `src/OddAtomJupiter.tsx` with the reusable kit `src/oddatom/kit.tsx`: the first 23.5 s of the posted Jupiter short rebuilt in v2 over the unchanged v1 audio. Delivery is under `assets/videos/odd-atom-style-v2/`; notes and known shortcomings are in `docs/production/odd-atom-style-v2/README.md`. It has no user approval yet. `glassrain_v1_video.mp4` on Drive has no audio track.

- **Latest production test:** `CancerShort76` / `src/CancerShort.tsx` is an original 76-second portrait 1080×1920/30 fps cancer short. It uses newly generated separately registered cell/nucleus artwork, the unchanged approved medicine clinician source, new ElevenLabs George/v3 narration and a pause-only edit, embedded captions, 34 event-timed effects and reused original scene-mood music. Preserve the original narration/alignment, source artwork and versioned delivery under `cancer-short-v1`. No social upload was requested or performed. Do not overwrite Knox or imply user artistic approval. Reproduce with prepare/sound/check/still/render/review:cancer commands. The final clinic view preserves source body pixels; the enlarged old body deformation produced seams and is not used here. See `docs/production/cancer-short/README.md`, its actual encoded delivery audit and visual review before new changes.

- **Active animation research:** consult `animation-mastery/AGENTS.md`, `knowledge/EVIDENCE_INDEX.md`, its progress/remaining-work manifests and cited frame evidence before new production. The requested Drive archive has been acquired: five 1440p/60 fps videos totaling 65.6 minutes, inventoried separately from the eight earlier uploads. Every-frame automated measurements and cut proposals are not semantic shot analysis or artistic mastery. Research v1 has 19 selected native cases,12 evidence-backed guides, a working hybrid Remotion engine and four rendered/inspected/revised original tests under `assets/videos/animation-mastery/v1/`. Full-shot semantic review, expanded action/angle libraries and direct audio audition remain incomplete; the tests have no user artistic approval. Preserve approved artwork, the default character rig and existing films. New A/D tests opt into the extended bend mode; do not silently replace the approved default.

- The user provided their other repository’s audio library and explicitly authorized copying and reuse. Originals are now under `public/assets/audio/library/curio-bureau/`, with source commit and per-file hashes in `IMPORT.json`. Search its catalogs before generating new sounds. Any new generated audio must also be committed to this working repo with reusable names and provenance; keep derived stems/mixes as well. Do not treat source-library QA or approvals as approval of a new video mix.

- Use Remotion for video production. The user has retired and requested deletion of the four supplied character SVGs and their old rig; use original characters instead.
- Save finished MP4s and their posters under `assets/videos/`, which is tracked by Git.
- For video deliveries, include the finished MP4 with the related source changes and push to this repository, following the user's standing preference. Respect any later instruction to keep work local.
- Verify that the remote branch contains the delivery commit before sharing GitHub file and download links. Local workspace links alone do not satisfy video delivery.
- Keep temporary renders, review frames, dependency caches, and large voice-model weights out of Git.

# Visual direction

- The user clarified that SVG itself is not required: the goal is independent animation of raster artwork layers, including selected background/environment elements. Prefer approved image-generation artwork, clean plates, alpha objects/pose sheets and Remotion animation over tracing whole scenes into vector paths. `MedicineLayeredEnvironment` is an eight-second demonstration; its new background layers are under `public/assets/artwork/medicine-layers-v1/`. New layers and motion are pending user approval. `clinician-cutout.png` is a separately generated pose with changed framing, not the existing approved-art rig or an exactly registered replacement. Preserve the source-sampled clinician animation until any replacement is reviewed.

- The user requested an editable SVG reconstruction of the medicine scene. `assets/scenes/medicine-vector/medicine-scene-editable.svg` is an image-derived vector reconstruction with native paths/groups, no embedded bitmap; the original approved PNG stays unchanged. The SVG has not received user quality approval. Be explicit that it is traced/color-region geometry with approximate hidden surfaces, not a hand-drawn-from-scratch minimal vector rig. Its Remotion still is `MedicineVectorArtwork`; do not silently substitute the PNG when discussing this SVG.

- The user explicitly passed both new static scenes and artwork consistency: `assets/scenes/artwork-consistency-02/medicine-immune-defense.png` and `cyber-network-defense.png`. Animate their human, biological, object and environment layers while retaining their drawing quality. These files are approved immutable source references; add versioned animation assets rather than repainting over them. The medicine clinician is an approved new character.

- The user explicitly passed the artwork and drawing quality of `assets/videos/approved-characters-20s.mp4`. Preserve that visual baseline, including its background quality. The user later passed character animation as well; use this artwork as the comparison baseline for new subjects. The motion study and unchanged-art hash record are in `references/studies/motion-2026-10-24/`. Add matching versioned rig parts as needed rather than redesigning or overwriting approved art.
- The user approved `assets/characters/static-test-01.png` as the Mira/Sol character direction. Preserve these faces, hair, proportions, outfits and drawing quality when animating them. The approved-character test uses adapted illustrated cutout layers in `public/assets/artwork/approved-characters/`; do not silently substitute the rejected Citizen/ConnectionArt character designs.
- When extending the approved rig, preserve its drawing quality: silhouettes, head construction, pose-specific contours/hands, color/value grouping, and environment composition. Inspect additional pose artwork against the approved master before interpolating it.
- Compare human drawings with human reference crops at visible native-pixel zoom. Record concrete artwork failures; successful rigging, narration, and encoding do not establish visual quality. Do not describe downloaded reference illustrations as graphics generated by this project.
- Only add on-screen text that advances the explanation. Do not add brand names, episode badges, taglines, timers, progress bars, schematic notes, or production metadata to the video.
- Study the supplied opening frames before styling titles. Use heavy rounded lettering with several real outline passes and an offset shadow where appropriate; flat all-caps headings are not the approved title treatment.
- Opening titles should be readable from the first frame and integrated with the action. Do not fill the rest of the episode with large headings that merely repeat narration.
- Use short plain narration captions over the artwork with a thin dark edge, without dashboard panels or caption cards.
- Keep source-access limitations explicit. Do not claim to have researched a live channel when its pages could not be accessed.

# Current animation delivery

- **Latest audio correction:** The user still cannot hear v5 music and explicitly requests **80–90% of the SFX**. Target 85% of typical active SFX RMS amplitude, calibrated in simultaneous 200ms mono playback windows (SFX above −31dBFS). Raise the existing music with fixed gain and no additional ducking, retain Knox/SFX/atmosphere/picture, deliver versioned v6 audio and MP4. This ratio is a signal-level definition, not a perceived-loudness percentage. Preserve v5 as rejected audio-balance comparison and record the new feedback. No listening pass is implied by measurement.

- **Current correction: music must be perceptibly present.** The user could not hear the v4 background score. Its score averaged about 25 dB below active narration and was excessively attenuated by quiet SFX tails. Reuse the nine original music source cues; raise the music bed, make its mono playback more reliable, and duck only around speech/prominent contacts with faster recovery. Preserve the exact v4 picture, existing SFX/atmosphere and original Knox timing. Version the corrected audio/video under `singularity-v5` and record presence as well as upper-level limits; passing only “music is quiet enough” is insufficient. Direct audio audition remains unavailable, so do not claim a listening pass.


- **Current final audio request:** turn SFX up further, add purposeful effects in under-supported actions, and add music with scene-specific curious/eerie/tense/warm moods. Music must remain below narration and active focal SFX. Preserve all v3 picture/ending frames and the original Knox take; this is an audio-only revision under `assets/videos/singularity-v4/`. Reuse the imported Curio library and commit every newly composed music cue/stem with provenance. Write paste-ready YouTube upload metadata and Community post drafts under `docs/publishing/singularity/`; “write posts” authorizes drafting, not publishing to an account. No guarantee of view counts. The earlier full-animation review remains not passed; do not manufacture a new animation pass. Direct audio audition is still unavailable here; document level/sync checks accurately.


- **Current correction: stronger SFX and a curiosity-led ending for the full singularity film.** The user said the v2 animation still does not pass; its hash-bound feedback is `docs/production/singularity/rebuild/user-review.json`. A broader animation study is deferred until the user supplies long-form references. Re-analyze the existing eight uploaded clips for audiovisual event timing, with clear limits: this runtime cannot directly audition audio, and stereo/spectral measurements do not isolate SFX from speech/music. Do not claim a listening audit. User explicitly selected **keep Knox; improve visuals and sound**. Preserve the original take and v2 file; version the revision under `assets/videos/singularity-v3/`, with source `src/SingularitySoundEnding.tsx`. Keep the rest of the picture/artwork intact. No titles or end-card labels. Provide room after the last spoken question and a visual payoff that leaves origin unknown rather than asserting a previous universe.


- **Active request: recreate the entire 8:56 singularity film.** The user approved `StoryMotionSixScenes` with “Approved recreate the 8 min video”; its hash-bound approval is `docs/production/story-motion/user-review.json`. Apply purposeful interactions, reactive environments and geometry/action transitions throughout the long film. Preserve the original Knox source, approved character/artwork files, approved tests and rejected full cut. Version the new film under `assets/videos/singularity-v2/` and new source `src/SingularityRebuild.tsx`. No on-screen titles or production text. Source sprite artwork may be reused as independent actors, but never reuse the rejected universe backplates as a slide show. The v2 full-film animation did not pass the user review; see the correction above.


- **The completed and now approved recreation is the 20-second, six-scene test**, explicitly selected by the user instead of the full singularity film. `StoryMotionSixScenes` / `src/StoryMotionLab.tsx` is a separate version retaining the approved drawings and handoffs, with a recurring golden carrier, fish/bubble contact, plant activation, a wind obstacle shared by flyer/foliage/clouds, and a night-lighting payoff. Render with `npm run render:story-motion`, review with `npm run review:story-motion`, deliver under `assets/videos/story-motion/`. The user explicitly requires **no on-screen title**; this test has no on-screen text at all. Wordless with original synthesized effects; no voice credits. Preserve `TransitionLabSixScenes` and the approved MP4 unchanged. The user approved this version; see its hash-bound user-review.json. The transformations are a graphic fable, not scientific mechanisms.

- **Storytelling study and production standard:** the user wants action that helps viewers understand the story with narration removed, beyond simply moving objects. `references/studies/storytelling-2026-10-25/README.md` uses the eight supplied clips, caption-redacted excerpts, four words-off examples, before/action/after strips, an ambient-motion control and five official studio resources. Plan the viewer's question, initial state, trigger/attempt, interaction, changed state and consequence before polishing a scene. Use stable comparisons, destinations/contact, whole-body acting, purposeful holds, environmental effects and attention order. Treat mute/caption-hidden review as a diagnostic, not proof of audience comprehension; terms, quantities, uncertainty and unseen mechanisms may still need words. Preserve approved drawing quality and transitions. Do not spend speech credits or silently replace Knox.

- **The user approved the six-scene 20-second transition test** on 2026-10-25 (Asia/Manila): “Good! Thats perfect.” `TransitionLabSixScenes` / `src/TransitionLab.tsx` implements rain → fish → plant → butterfly → paper plane → night sky, with five object/action handoffs. Keep its motion/transition baseline. Its simple vector drawings were allowed for a transition exercise and do not redefine the approved full-production artwork baseline. Export via `npm run render:transitions`; review via `npm run review:transitions`. Delivery is `assets/videos/transition-lab/six-scene-transitions-20s.mp4` and poster; the hash-bound user approval is `docs/production/transition-lab/user-review.json`. Original synthesized effects only; no narration or speech-credit use. No on-screen labels/branding. Technical checks confer no automatic creative pass; this approval comes from the user.

- **The full singularity cut was rejected on 2026-10-25 (Asia/Manila): zero creative checks passed.** The user cited presentation-like movement, poor transitions and repeated universe imagery. The resulting transition study and later approved test address a separate baseline; the full singularity film remains rejected. See `references/studies/transitions-2026-10-25/README.md` and `docs/production/singularity/film/user-review.json`. All 22 major joins in the rejected cut use the same 11-frame-interval opacity ramp and freeze the outgoing stage time. Preserve the rejected film as comparison evidence; do not call a successful encode/sync check an animation pass. Future work needs purposeful scene action in addition to the approved handoffs, without masking long static scenes or repeated artwork with transition presets.

- The rejected singularity implementation, `SingularityFullFilm` in `src/Singularity.tsx`, uses the real 8:56.619 Knox recording, 16,099 frames at 30 fps, 52 speech-timed beats grouped into 23 visual sequences, generated raster plates/alpha objects and the previously passed Sol rig. Its six environment plates, five source atlases and 28 alpha exports are under `public/assets/artwork/singularity/`. Preserve them as historical comparison material, not as newly approved artwork. New work should meet the earlier passed drawing baseline and provide the additional poses/deformation/independent parts required by its action. Sparse movement and repeating the rejected universe imagery are not an acceptable substitute.
- Full singularity renders use `npm run render:singularity`, with offline audio from `public/assets/audio/singularity/final-mix.m4a`. The narration source stays immutable; the final mix only applies mix gain/peak limiting and adds the original synthesized score/effects. Do not regenerate Knox or use speech credits. `npm run review:singularity` validates actual encoded delivery and creates review boards. The delivered `assets/videos/singularity/singularity-full-8m56.mp4`, poster/subtitles and five higher-bitrate parts are on main. The user's full-film quality review is rejected, superseding the earlier pending state.
- Preserve scientific distinctions in both wording and visuals: no stars/galaxies during inflation or initial plasma; no literal established universe seed; the room/dot example is explicitly a misleading picture; time-landscape imagery is metaphorical; bounce and multiverse are hypothetical. Construct carbon/oxygen composites from the counted proton/neutron sprites rather than trusting generated nucleus counts. No claims of fresh inaccessible channel research or guaranteed views.

- Current scene studies: `MedicineArtworkMotion` and `CyberArtworkMotion`, `npm run render:artwork-motion`. Each is a 20-second 1080p/30 fps wordless motion study with original sound. No narration was requested or generated for these two visual tests. Save MP4s/posters under `assets/videos/` and push them for download.
- Artwork/motion sources and registered mattes are under `public/assets/artwork/scene-motion/`, `src/ArtworkMotion.tsx`, and `src/data/artwork-motion-registration.json`. Preserve microscope hand contact, independent cell motion, traffic/building occlusion, and contained shard landings.

- The previous character-motion comparison is `assets/videos/approved-characters-motion-20s.mp4`, rendered with `MotionCharactersTest` / `npm run render:characters-motion`. The previous approved-art movie stays unchanged.
- Use the versioned `crowd-motion` narration/audio profile for this film; `npm run narrate:characters-motion` uses ElevenLabs credits and is unnecessary for offline re-rendering.
- The character-comparison rig skins the original illustrated textures, with anchored lower legs and a rigid cup grip. Do not regress to visible cut seams or continuous unmotivated character idle loops.

# Current production requirements

- Google Vids has a user-confirmed 2,500-character limit per scene. Split narration at natural topic breaks, count audio tags, spaces and line breaks toward the limit, and provide a scene/script table plus separate paste-ready scene texts. The singularity transcript is split into five unchanged chunks under `docs/production/singularity/google-vids-scenes/`.

- Produce landscape 16:9 long-form material. Earlier animation tests are 20 seconds at 1920 × 1080 and 30 fps. The singularity project has a user-supplied Google Vids Knox recording: **536.618667 seconds (8:56.619)**. Use `public/assets/audio/singularity/narration-original.m4a` unchanged and `src/data/singularity-narration.json` for actual timing: 16,099 frames at 30 fps, five narration blocks, 241 caption cues and 52 visual beats. This supersedes the initial 10–12 minute estimate. The **first full-length cut was rendered but creatively rejected** at `assets/videos/singularity/singularity-full-8m56.mp4` (536.633333 seconds, 1080p/30 fps), alongside five higher-bitrate voiced parts. It includes original generated artwork, the previously passed Sol rig, captions, an original synthesized score and effects. Preserve the source recording and pace; do not silently synthesize a replacement, use credits or pitch-shift Knox. Historical audio-ingest reports are under `docs/production/singularity/audio/`; film encoding proof and the separate rejecting user review are under `docs/production/singularity/film/`.
- The user explicitly authorized Google Vids AI voiceover as an alternative to limited ElevenLabs credits and demonstrated inline bracketed audio tags in the spoken-script field: for example `[slow pace]`, `[thoughtful]`, `[excited]`, `[suspenseful]`, `[awe]`, `[positive]`, `[short pause]`, `[medium pause]`. Provide new Google Vids scripts in that format; do not invent a separate style-instruction field or claim access to the user's Vids account. Narration performance should be reviewed before locking Remotion animation timing. ElevenLabs remains the provider for previously delivered narrated tests; do not regenerate speech or spend credits for a script-only request. Keep API keys out of files, commands, logs, and Git.
- Keep visual previews clearly identified by filename and delivery notes if ElevenLabs narration is not yet available; do not claim such a preview is the completed narrated video.
