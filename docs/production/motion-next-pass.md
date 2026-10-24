# Next motion pass: preserve the approved drawings

The user passed the artwork in [approved-characters-20s.mp4](../../assets/videos/approved-characters-20s.mp4). Its character sheet, atlases and background plates are the approved visual baseline. [The motion study](../../references/studies/motion-2026-10-24/README.md) records which techniques were observed in the uploaded references and which improvements below are proposed for our own animation.

## Preserve

Keep Mira's and Sol's faces, hair, colors, body proportions, garments, hands, and illustration finish. Keep the quality, palette and lighting of the plaza and terrace. The [visual lock](../../references/studies/motion-2026-10-24/visual-lock.json) records unchanged source assets and the current export as comparison material.

Use versioned additional parts when a new action needs them. Match the existing drawings at the same viewing size; retain the approved files as the baseline. A rigging shortcut that changes the character's anatomy, produces tube shoulders, turns the face into a different design, or visibly stretches clothing is a regression.

## Prepare only the parts the performance needs

- **Body:** pelvis/torso controls or a small set of matching leaning, turning, and settling poses. The current body-and-legs PNG is too rigid for expressive weight transfer.
- **Gesture arm:** matching upper arm, forearm, wrist, and a few hands. Maintain sleeve/cuff overlap and the approved hand design as the elbow changes angle. Use a drawn pose replacement when an extreme bend cannot preserve the silhouette.
- **Cup arm:** keep the grip registered to the cup, with forearm/wrist control. Preserve the approved cup shape; animate emitted steam separately in scene space.
- **Head and attention:** coordinated neck/torso connections, eye/brow/mouth variants, and matching head views where a real turn is needed. Keep eye-area blinks; avoid whole-head ghosting or a feature change that shifts the hair unexpectedly.
- **Legs/feet:** add contact, down, passing, and up poses if a shot shows actual travel. Pin the support foot to the ground during its contact. If travel is unnecessary, use a convincing stationary weight shift instead of adding a walk merely to demonstrate rigging.
- **Environment:** a few source-matched foreground leaf/branch cutouts, their restrained cast-shadow behavior, and optional depth layers. Keep the architecture and most set dressing held while the actors carry the scene.

New parts must continue the same illustration. Extend hidden fabric or hair behind joints cleanly, keep enough resolution for the chosen close-up, and inspect overlaps at the extreme poses before interpolating them. Do not replace the approved art with the older rejected vector rigs.

## Proposed 20-second acting structure

This is a plan, not a claim to have completed a new video. Exact timings should be adjusted after the intended ElevenLabs performance is available. The existing story can remain the comparison script.

| Approximate time | Acting objective | Body/action treatment |
|---|---|---|
| 0–3 s | Mira is near people but withdrawn | A clear initial pose, a glance, then a shoulder/weight settle; keep the cup grip credible and the support foot stable |
| 3–7.5 s | Attention is absent despite proximity | Hold a readable pose, make one motivated eye/head change, and let a foreground figure pass; avoid continuous idle oscillation |
| 7.5–10 s | Sol notices Mira | Attention shifts first, then chest/shoulders lean or turn, then the hand begins its invitation |
| 10–12.5 s | Sol listens; Mira registers the attention | Give the gesture a clear stroke and pause. Mira's eyes, head and shoulders respond as one connected action |
| 12.5–15.5 s | The conversation has a measured, limited effect | Hand/wrist settle, torso counter-motion, then Mira's expression eases. Preserve a quiet beat for the narration's qualification |
| 15.5–20 s | A small response resolves the scene | Mira's cup/hand response follows the body, then settles. Leave the final expression readable; keep environmental movement subordinate |

A useful starting experiment for a conversational gesture is a brief 3–6-frame anticipation, a 10–18-frame main stroke, and a longer readable hold/settle. These are proposed blocking values, not timings measured as universal Kurzgesagt rules. The reference lift's approximately 11-frame central travel is a different physical action and should not be copied indiscriminately.

## Background movement

Use the approved background paintings as held base layers. Add movement with a specific job:

- A nearby leaf cluster can sway slightly and create a corresponding soft shadow change.
- Steam rises and dissolves from the cup while the cup itself follows the hand.
- Foreground foliage can move differently from the distant city during a camera move to establish depth.
- A subtle window-light change can support the atmosphere without making the window compete with the faces.

Avoid warping the whole background to simulate life. The study shows that a held setting is often appropriate; independent environmental motion is useful when it clarifies the world or the explanation. Maintain the approved color/value hierarchy.

## Narration and final timing

Continue with ElevenLabs. Prepare the intended emphasis, sentence grouping and pauses before detailed animation, then use the actual performance to place recognition, gesture, response and holds. Keep a clear, conversational explanatory delivery and preserve the script's qualification about loneliness. The previous read's 0.9 tempo fit is a baseline fact, not the target performance.

Caption timestamps and acting beats should come from the same final read. Spot sound effects at meaningful contacts or movements—such as a foot plant or cup contact—rather than adding a whoosh to every small change. Music should support speech and the emotional beat. No new voice generation was made during the study.

## Review the motion while protecting the art

Inspect key poses beside the approved sheet before reviewing in-betweens. Watch the action silently to check intention, weight, arcs, contacts, overlaps and settling; then assess the narration alone and combine the two. Check normal-speed playback and selected frames around contacts, pose changes, blinks and cuts. Compare the final close-up with the approved art for facial identity, hair silhouette, garment construction and edge quality. Record specific motion failures rather than treating a successful render as acceptance.
