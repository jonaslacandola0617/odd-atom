# Channel identity: After Sign-Off

Drafted 2026-11-11 for the horror channel. Nothing has been changed on any account; posting and settings are yours to apply. No view counts are guaranteed.

## The name

**After Sign-Off**: suggested handles `@aftersignoff` (YouTube) and `@aftersignoff` (TikTok). I could not check whether they are free (no account access here). If they are taken, try `@aftersignofftv` or `@after.signoff`.

**Why this name:**
- **The concept:** every video is a broadcast that comes on *after* the station has signed off for the night, when nothing should be on. That fits what the channel already does: emergency alerts, broadcast intrusions, tapes, sonar and thermal-camera footage. The series labels in the publishing kits ("Broadcast 01", "Broadcast 02" …) slot straight in.
- **Covers both lanes:** true cases and original fiction, without promising either "true" or "fake".
- **Easy to say and spell**, short enough for a TikTok handle, and not tied to one gimmick (moon, rules, sonar).

**Alternatives, if you prefer:**

| Name | Handle | Feel |
|---|---|---|
| Dead Air Archive | `@deadairarchive` | Stronger "archive of found tapes"; slightly more true-crime |
| Channel Zero Tapes | `@channelzerotapes` | Pure analog horror; leans fiction |
| The 3 A.M. Broadcast | `@3ambroadcast` | Most mainstream-searchable; more generic |

**Odd Atom:** the existing channel has 16 posted science shorts. Renaming it keeps its subscribers, but they came for science, and many won't watch horror, which can drag down early numbers. I'd **recommend starting After Sign-Off as a fresh channel** and keeping Odd Atom as it is. If you'd rather reuse it, set the old science shorts to unlisted first, so new visitors see one consistent channel. Your call.

## Profile picture and banner

Rendered in the channel's own pixel-3D style (`src/horror/channel/ChannelArt.tsx`, `npm run render:channel`). Both are original, with no third-party art.

| Asset | File | Size | Use |
|---|---|---|---|
| Profile picture | `assets/channel/after-sign-off-avatar-800.png` | 800×800 | YouTube and TikTok profile picture: a CRT TV showing static, a figure standing in it, a red power light. It reads at 98 px, and the figure sits in the centre of the circular crop |
| Banner | `assets/channel/after-sign-off-banner-2560x1440.png` | 2560×1440 | YouTube banner: the Episode 7 town at night, a lattice mast with red lights on the hill, the TV-lit terrace below; "AFTER SIGN-OFF" and "TRUE CASES · ORIGINAL NIGHTMARES · ANALOG HORROR" sit inside the 1546×423 safe area shown on every device |

TikTok has no banner; use the profile picture there.

## YouTube channel description (paste into Customisation → Basic info)

```
Some broadcasts only come on after the station signs off.

After Sign-Off is analog horror in pixelated 3D: unsolved true cases, retold carefully, and original nightmares written for this channel. Emergency alerts. Hijacked broadcasts. Tapes nobody should have recorded. Walls that are warmer than they should be.

Every short loops. Watch it twice: there is always something you missed.

True cases are recreated: no real footage of victims, no gore, and no accusations against real people. Original stories are fiction, and they are labelled as fiction.

New broadcasts every week. Keep the sound on. Keep your curtains closed.
```

The "every week" line commits you to a rhythm; delete it if you'd rather not.

**Channel keywords** (YouTube Studio → Settings → Channel → Basic info):
`analog horror, horror shorts, unsolved mysteries, true story, broadcast intrusion, emergency alert, creepy, scary stories, found footage, liminal, pixel horror, low poly horror`

## TikTok bio (80 characters max)

```
broadcasts that come on after sign-off 📺 true cases + originals. sound on.
```
(74 characters.)

Alternative: `analog horror. true cases & original nightmares. watch it twice 📼`

## Series and playlists

- **Playlist "Season 1: After Sign-Off"**, in release order (Episodes 1–8 so far).
- **Playlist "True Cases"**: Episodes 2, 3, 5 and 7. **Playlist "Originals"**: Episodes 1, 4, 6 and 8.
- **On-screen series label in captions and descriptions:** "Broadcast 01" to "Broadcast 08". The videos themselves carry no channel branding, by design.
- **Voices:** the archive narrator (Jack) for true cases and the fiction narrator (True) for originals. Viewers learn which kind of story they are hearing.

## Posting rhythm

- **Release order:** Episodes 1 → 8 as numbered. They already alternate fiction and true cases.
- **Pace:** start with one a day for the first week, so the algorithm sees a pattern, then 3–5 a week.
- **Time:** evening to late night in your main audience's time zone.
- **Uploads:** native uploads on each platform (no TikTok watermark on YouTube, or the reverse).
- **What to read after 48 h:** share of viewers who stayed rather than swiped (the first 2 seconds), average percentage viewed (over 100 % means rewatches), shares, comments. Double down on whichever hook and title shape wins.
- **True cases:** moderate comments that name real people as culprits or joke about victims. The per-episode notes are in `docs/publishing/ep02`, `ep03`, `ep05` and `ep07`.

Paste-ready posts for every episode are in `docs/publishing/POSTS-ep01-08.md`.
