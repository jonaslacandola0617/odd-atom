# The battle inside a star — 20-second landscape test

## Deliverable status

The visual test is a 1920 × 1080, 30 fps, 600-frame Remotion segment. The original character, layout, cutaway, explanatory motion, provisional captions, score, and effects can be reviewed independently of ElevenLabs. The narrated deliverable is pending service access and a secure API key. The preview filename and README identify this distinction; no production-status labels are burned into the film.

## Scope and reference limitations

The user requested a switch from shorts to long-form, an original character, deletion of the supplied character assets, ElevenLabs narration, and continued study of Kurzgesagt's long-form topics and craft.

The official channel's `/videos` page, the official studio website, and the ElevenLabs voices endpoint were requested for this turn. All three failed at the network proxy with `CONNECT tunnel failed, response 403`. The actual process had none of the standard ElevenLabs API-key variable names set. Environment configuration metadata also contained no existing secret bindings. No missing credential was inferred solely from a CLI login prompt.

The available uploads are eight vertical shorts. Their observations remain in the historical reference-study notes. They do not establish the channel's long-form composition, timing, soundtrack, or typography. The current scene is an original proposal for a long-form segment; closer live reference study remains outstanding.

## Story and timing

| Approximate time | Story action | Animation |
|---|---|---|
| 0–3.7 s | A Sun-like star fights gravity for billions of years | Original star acts beside the opening title; camera/layout leaves room for the landscape frame |
| 3.7–6.2 s | Gravity squeezes inward | Cool-colored arrows converge; the character braces, compresses, and changes expression |
| 6.2–10.6 s | Hydrogen nuclei fuse and release energy | The surface becomes a cutaway; a connected core-detail view brings nuclei together and emits light accents |
| 10.6–15.2 s | Energy maintains heat and outward pressure | Energy travels through the interior; warm arrows emerge as the character opens its arms and relaxes |
| 15.2–20 s | Gravity and pressure balance during most of the star's life | Equal-length opposing vectors and a stable body pose resolve the visual argument |

These are provisional timing anchors for the unvoiced preview. ElevenLabs character timestamps will replace caption timing and supply the principal story-beat anchors. The animation maps its authored timing to those returned anchors.

## Scientific meaning

The claim is explicitly about a Sun-like star, rather than all stars having billion-year lifetimes. Gravity is countered by a pressure gradient; nuclear fusion supplies energy that helps maintain the hot interior. The long stable hydrogen-burning stage occupies most of a Sun-like star's lifetime. The cartoon's arms and expressions are personification, not a proposed physical mechanism.

The fusion detail is an overview of hydrogen-to-helium processing, not a literal one-step depiction of the proton-proton chain. Four initial proton symbols converge toward a helium-like four-nucleon cluster, with two proton colors and two neutron colors. Intermediate nuclei, positrons, neutrinos, transport times, stellar dimensions, and numerical force values are outside this 20-second test. The animation does not assert that fusion products reach the surface immediately.

## Original character and rig

Ember is a star with independent procedural corona, convection-like surface strokes, eyes, masked highlights, brows, cheeks, mouth, and two articulated arms. Arm endpoints are solved with two-bone inverse kinematics. Palms rotate around the wrist; the arm joints remain connected. The same body transform applies to the surface and attached limbs during compression. Cutaway and face visibility are separate controls, so the scientific detail does not require replacing the character with unrelated art.

No user-supplied SVG geometry or old clip-mask rig is used. `npm run character` exports the neutral vector asset from the component, preserving one source of geometry for future edits.

## Visual choices

- Warm orange and cream identify the star and energy source. Cool purple identifies inward gravity; warm yellow identifies outward pressure. The color roles persist through the scene.
- A low-contrast navy/violet background leaves the bright character and nucleus readable. Small stars and broad nebula color fields support depth without introducing labels.
- The opening uses the user's requested layered lettering at a reduced contour scale suited to the horizontal frame. Diagram labels use plain rounded type rather than repeating the decorative title treatment.
- The core-detail scene uses the horizontal space for a whole-object view and a connected close-up. It avoids a vertical short cropped into a wide canvas.
- Captions are short white phrases with a thin dark edge at a fixed lower baseline. No caption cards, logos, episode numbers, progress indicators, or taglines appear.
- Character acting supports the mechanism: brace under compression, focus during the cutaway, then open and relax as the opposing pressure appears.

These are production choices for this test, not measured claims about inaccessible long-form reference footage.

## Required access before the narrated deliverable

The saved draft adds the secure `ELEVENLABS_API_KEY` requirement for `api.elevenlabs.io` and custom destinations for ElevenLabs, YouTube pages/media, and the official studio site. Existing package-manager presets were preserved. The save returned `status: saved` and `requires_publish: true`.

The user must review and save the settings, enter the key securely, and publish the environment. The save did not inject a key, alter the running proxy policy, generate narration, or establish live-channel access. After the settings apply, recheck the actual operation before treating it as verified.

The narration script uses HTTPS through the environment's configured route. It does not print the key, save it, or send it to any other destination. Missing credentials fail before a generation request. The final-render command and narrated composition reject missing ElevenLabs output. The visual preview is the only render permitted while narration remains pending.
