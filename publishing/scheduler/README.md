# After Sign-Off scheduler (Windows)

A free tool that schedules the horror shorts on **YouTube** and **TikTok** for you. It opens your real Google Chrome, uploads each video in YouTube Studio and TikTok Studio, pastes the title, description, tags and caption, and sets the date and time. The platforms then post the videos themselves at those times, so your PC only needs to be on while the tool uploads.

It costs nothing and needs no API keys or developer accounts. It never sees your passwords: you sign in to the accounts yourself in a Chrome window.

## What you need (one time)

1. **Google Chrome**: https://www.google.com/chrome/
2. **Node.js**: the free "LTS" version from https://nodejs.org (click through the installer with the default options).
3. **This tool**: download `after-sign-off-scheduler.zip` and extract it, for example to `Documents\after-sign-off-scheduler`.

## First time

1. Double-click **`1-SETUP.bat`**. It installs the tool (about a minute) and checks the schedule.
2. Double-click **`2-LOGIN.bat`**. A Chrome window opens with a separate "After Sign-Off" profile (your normal Chrome is untouched).
   - Sign in to **YouTube Studio** with the channel's Google account, and to **TikTok**.
   - In YouTube Studio, set the language to **English** (profile picture → Language). The tool reads the English labels and dates.
   - In YouTube Studio, create two playlists once: **Season 1: After Sign-Off** and **Season 2: Kwentong Kababalaghan**. If they don't exist, the tool skips that step.
   - Close the Chrome window. You stay signed in for next time.

## Scheduling

- **`4-SCHEDULE-EVERYTHING.bat`** schedules every episode that isn't scheduled yet: all of them on YouTube (YouTube lets you schedule as far ahead as you like), and on TikTok every episode within TikTok's limit of about 10 days ahead. Run it again around once a week to add the next TikToks; anything already scheduled is skipped.
- **`3-SCHEDULE-NEXT-7-DAYS.bat`** does only the next 7 days.

If TikTok's calendar lets you pick dates further ahead than 10 days on your account, you can try `npm run schedule -- --days 60 --tiktok-days 30`.

- It lists the episodes due in the next 7 days and downloads their videos (about 40–50 MB each).
- For each episode it opens a YouTube tab, fills everything in, and **stops before clicking Schedule** so you can look. Press **Enter** in the black window to schedule it. Type **s** to skip it, or **d** if you clicked Schedule yourself.
- Then it does the same on TikTok.
- If a step doesn't work (YouTube or TikTok sometimes change their pages), it says so with ✗ and asks you to do that one step by hand in the open tab. Then press Enter as usual.
- It remembers what is already scheduled (in `state.json`), so running it again never schedules the same video twice.

Once you trust it, you can let it click Schedule by itself: open a Command Prompt in the folder and run `npm run schedule -- --auto`. It still stops if any step failed.

Double-click **`STATUS.bat`** to see what is scheduled. Once videos are live, it also lists the comments to pin.

## The schedule

`schedule.json` holds all 20 episodes: the video file, YouTube title, description, tags and playlist, and the TikTok caption, all from the posting kits. Edit it with Notepad if you want to change any text.

It alternates Season 1 and Season 2 (1, 11, 2, 12 …), with YouTube at **8:30 pm** and TikTok at **9:30 pm**, Philippine time. Episodes 1, 11 and 2 are on 16, 17 and 18 November. The rest run from **Thursday 19 November to Wednesday 9 December**. Each week **1 or 2 random days are left out (never a Monday)**, so the channel doesn't post like a machine every single day. Episode 20 (the Manila Film Center) is never put on 17 November.

To re-plan, open a Command Prompt in the folder and run, for example:

```
npm run plan -- --start 2026-11-23
npm run plan -- --start 2026-11-23 --skip 2           (always 2 days off a week)
npm run plan -- --start 2026-11-23 --seed hello       (a different random set of days off)
npm run plan -- --start 2026-11-23 --yt 19:00 --tt 21:00
npm run plan -- --start 2026-11-23 --order 11-20,1-10  (Season 2 first)
```

Episodes that are already scheduled, or dated before the start date, keep their dates. Then run `npm run check`.

**Watched episodes:** each episode has `"watched": false`. Before scheduling, the tool asks whether to go ahead with episodes you haven't watched. Once you've watched them, mark them, for example `npm run watched -- 1 11 2 12`.

**Time zone:** the times are Philippine time. If your PC is set to another time zone, the tool converts them, and Studio shows them in your PC's time zone. Check the time on the first few.

## What stays manual

- **Pinned comments:** a scheduled video can't take comments until it goes live. After it goes live, post the pinned comment (STATUS.bat shows the text) and pin it.
- **TikTok cover text:** optional; the tool prints the suggested text for you to add in TikTok's "Edit cover".
- **TikTok's 10-day limit:** TikTok only schedules about 10 days ahead, which is why the tool works a week at a time.
- **AI labels:** the tool turns on TikTok's "AI-generated content" label (the narration is an AI voice), and answers "No" to YouTube's "Altered content" question (pixel-3D animation isn't realistic footage). Change `"aiGenerated"` or add `"alteredContent": true` in `schedule.json` if you decide otherwise.

## Be aware

- **Platform rules:** YouTube's and TikTok's terms don't allow automated use of their websites without permission. The tool uses your own signed-in Chrome, goes at a human pace, and you click the final button. Even so, YouTube or TikTok could show a CAPTCHA, ask you to sign in again, or restrict the account. This is rare for a few uploads a week, but you take that risk. The fully allowed alternatives are scheduling by hand in YouTube Studio and TikTok Studio, or a paid scheduler.
- **It can break:** when YouTube or TikTok redesign their upload pages, some steps will show ✗ until the tool is updated. You can always finish those steps by hand.
- **Views:** none are guaranteed.

## Troubleshooting

- **"Google Chrome was not found":** install Chrome, or set `CHROME_PATH` to the full path of `chrome.exe`.
- **"Chrome opened but did not accept the connection":** close every After Sign-Off Chrome window and try again.
- **"Not signed in":** run `2-LOGIN.bat` again.
- **A download fails:** run it again; it resumes episode by episode.
