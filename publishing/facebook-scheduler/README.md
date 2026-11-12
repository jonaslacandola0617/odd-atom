# After Sign-Off Facebook scheduler (Windows)

A free tool that schedules the horror shorts as **Reels on your Facebook Page**. It opens your real Google Chrome, uploads each video in **Meta Business Suite**'s Reels composer, pastes the caption, turns on the AI label and sets the date and time. Facebook then posts each Reel itself at that time, so your PC only needs to be on while the tool uploads.

It is separate from the YouTube/TikTok tool, with its own schedule and its own progress file. It uses the same After Sign-Off Chrome profile, so if you're already signed in there you stay signed in. It never sees your password: you sign in yourself.

## What you need (one time)

1. **Google Chrome** and **Node.js** (the free "LTS" version from https://nodejs.org). You already have both from the YouTube/TikTok tool.
2. **A Facebook Page** for the channel, managed by your Facebook account.
3. **This tool**: download `after-sign-off-facebook-scheduler.zip` and extract it, for example to `Documents\after-sign-off-facebook-scheduler`.

## First time

1. Double-click **`0-SETUP.bat`**. It installs the tool and checks the schedule.
2. Double-click **`1-LOGIN.bat`**. Chrome opens Meta Business Suite.
   - Sign in to Facebook with the account that manages the Page.
   - If you manage more than one Page, pick the After Sign-Off Page at the top left. The tool uses whichever Page Business Suite has open.
   - Set Facebook's language to **English**, because the tool reads the English labels.
   - Close Chrome.

## Scheduling

Double-click **`2-SCHEDULE-EVERYTHING.bat`**.

- It lists the Reels not yet scheduled, downloads their videos (about 40–50 MB each) and opens Business Suite for each one.
- It fills everything in and **stops before clicking Schedule**. Press **Enter** to schedule, type **s** to skip, or **d** if you clicked Schedule yourself.
- A Reel only counts as scheduled once Business Suite confirms it. If the tool can't see the confirmation, it asks you and leaves the tab open.
- If a step shows **✗**, do that one step by hand in the tab, then press Enter. The tool saves a screenshot of the page in the `debug` folder; send it to Claude so the step can be fixed.
- Business Suite only schedules a limited time ahead (the tool assumes about 28 days). Reels further out are skipped for now; run the tool again later to add them. Everything already scheduled is skipped.

Double-click **`STATUS.bat`** to see what is scheduled.

## The schedule

`schedule.json` holds all 20 episodes. Each caption is the YouTube title, a blank line, then the YouTube description, with `#shorts` changed to `#reels`. You can edit any of them in Notepad.

The order is **the Philippine stories first (Episodes 11–20), then Season 1 (Episodes 1–10)**, one Reel per posting day at **8:00 pm Philippine time**. Each week, **1 or 2 random days are left out, never a Monday**. It starts **Monday 16 November 2026**:

- 11–20: 16 to 29 November
- 1–10: 30 November to 13 December

If your Page will be ready later, re-plan from that date. Open a Command Prompt in the folder and run, for example:

```
npm run plan -- --start 2026-11-23
npm run plan -- --start 2026-11-23 --time 19:00
npm run plan -- --start 2026-11-23 --seed hello      (different random days off)
```

Then run `npm run check`. Reels that are already scheduled keep their dates.

## What stays manual

- **Pinned comment:** posting and pinning it after a Reel goes live is up to you.
- **Cover image:** optional; Business Suite picks a frame unless you choose one.
- **The AI label:** the tool turns on Meta's AI label because the narration is an AI voice, which Meta asks you to disclose. If it can't find the switch, turn it on yourself (✗ shows which step).

## Be aware

- **Untested on the real site:** this tool has only been tested on a fake copy of Business Suite. Meta's pages change often, so expect a few ✗ steps on the first run. Do them by hand and send the screenshots.
- **Platform rules:** Meta's terms don't allow automated use of its websites without permission. The tool uses your own signed-in Chrome, goes at a human pace, and you click the final button. Even so, Facebook could ask you to sign in again or restrict the account. The fully allowed alternative is scheduling by hand in Business Suite.
- **Views:** none are guaranteed.
