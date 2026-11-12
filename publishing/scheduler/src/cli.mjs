#!/usr/bin/env node
// After Sign-Off scheduler. Commands:
//   login                      open Chrome so you can sign in to YouTube and TikTok (once)
//   download [--all]           download the videos for the next 7 days (or all 20)
//   plan --start YYYY-MM-DD [--order mixed|1-20|11-20,1-10] [--yt 20:30] [--tt 21:30] [--every 1]
//   check                      check the schedule for mistakes
//   schedule [--days 7] [--only youtube|tiktok] [--ep N] [--auto]
//   status                     show what is scheduled, and what to do by hand
//   watched N [N ...]          mark episodes as watched/approved by you
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
  VIDEOS_DIR, ask, humanPause, loadSchedule, loadState, localTime, markState, phDate,
  saveSchedule, videoPath,
} from './util.mjs';

const [, , cmd = 'help', ...rest] = process.argv;
const flags = {};
const positional = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) {
    const k = rest[i].slice(2);
    flags[k] = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
  } else positional.push(rest[i]);
}

const TIKTOK_MAX_DAYS = 10;
const DAY = 86400e3;

function upcoming(schedule, days) {
  const now = Date.now();
  const end = now + days * DAY;
  return schedule.episodes
    .filter((e) => !flags.ep || String(e.ep) === String(flags.ep))
    .filter((e) => [e.youtube.publishAt, e.tiktok.publishAt].some((t) => t && Date.parse(t) > now && Date.parse(t) <= end))
    .sort((a, b) => Date.parse(a.youtube.publishAt || a.tiktok.publishAt) - Date.parse(b.youtube.publishAt || b.tiktok.publishAt));
}

// ---------- check ----------
function problems(schedule) {
  const out = [];
  const warn = [];
  for (const e of schedule.episodes) {
    const tag = `Episode ${e.ep}`;
    const y = e.youtube, t = e.tiktok;
    if (!y.title || y.title.length > 100) out.push(`${tag}: YouTube title must be 1–100 characters (${y.title?.length ?? 0}).`);
    if (/[<>]/.test(y.title + y.description)) out.push(`${tag}: YouTube does not allow < or > in titles/descriptions.`);
    if ((y.description || '').length > 5000) out.push(`${tag}: YouTube description over 5,000 characters.`);
    if ((y.tags || []).join(',').length > 500) out.push(`${tag}: YouTube tags over 500 characters in total.`);
    if (!t.caption || t.caption.length > 2200) out.push(`${tag}: TikTok caption must be 1–2,200 characters.`);
    for (const [name, iso] of [['YouTube', y.publishAt], ['TikTok', t.publishAt]]) {
      if (!iso) { warn.push(`${tag}: no ${name} time yet (run plan).`); continue; }
      if (Number.isNaN(Date.parse(iso))) out.push(`${tag}: ${name} time "${iso}" is not a valid date/time.`);
      else if ((e.notOn || []).includes(phDate(iso).slice(5))) out.push(`${tag}: ${name} time falls on ${phDate(iso)}. ${e.note || ''}`);
    }
    if (!e.watched) warn.push(`${tag}: not marked as watched by you yet.`);
  }
  return { out, warn };
}

// ---------- download ----------
async function download(eps) {
  const schedule = loadSchedule();
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  for (const e of eps) {
    const dest = videoPath(e);
    const url = schedule.videoSource + e.file.split('/').map(encodeURIComponent).join('/');
    const head = await fetch(url, { method: 'HEAD' });
    const size = Number(head.headers.get('content-length'));
    if (fs.existsSync(dest) && fs.statSync(dest).size === size) { console.log(`✓ have Episode ${e.ep}`); continue; }
    process.stdout.write(`↓ Episode ${e.ep} (${(size / 1e6).toFixed(0)} MB)… `);
    const r = await fetch(url);
    if (!r.ok) throw new Error(`download failed (${r.status}) for ${url}`);
    await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(dest + '.part'));
    fs.renameSync(dest + '.part', dest);
    if (fs.statSync(dest).size !== size) throw new Error(`Episode ${e.ep}: download incomplete, run again`);
    console.log('done');
  }
}

// ---------- plan ----------
function parseOrder(spec) {
  if (!spec || spec === 'mixed') return [1, 11, 2, 12, 3, 13, 4, 14, 5, 15, 6, 16, 7, 17, 8, 18, 9, 19, 10, 20];
  return spec.split(',').flatMap((part) => {
    const [a, b] = part.split('-').map(Number);
    if (!b) return [a];
    const step = a <= b ? 1 : -1;
    return Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => a + i * step);
  });
}

function plan() {
  const schedule = loadSchedule();
  const start = flags.start;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '')) throw new Error('Give a start date: --start 2026-11-16');
  const order = parseOrder(flags.order);
  const every = Number(flags.every || 1);
  const off = schedule.defaults.utcOffset;
  const yt = flags.yt || schedule.defaults.youtubeTime;
  const tt = flags.tt || schedule.defaults.tiktokTime;
  const state = loadState();
  const byEp = new Map(schedule.episodes.map((e) => [e.ep, e]));
  let day = new Date(`${start}T00:00:00Z`);
  const queue = order.filter((n) => byEp.has(n) && !state[n]?.youtube && !state[n]?.tiktok);
  while (queue.length) {
    const ymd = day.toISOString().slice(0, 10);
    const idx = queue.findIndex((n) => !(byEp.get(n).notOn || []).includes(ymd.slice(5)));
    if (idx >= 0) {
      const e = byEp.get(queue.splice(idx, 1)[0]);
      e.youtube.publishAt = `${ymd}T${yt}:00${off}`;
      e.tiktok.publishAt = `${ymd}T${tt}:00${off}`;
      console.log(`${ymd}  Episode ${String(e.ep).padStart(2)}  ${e.story}`);
    }
    day = new Date(day.getTime() + every * DAY);
  }
  saveSchedule(schedule);
  console.log('\nSaved schedule.json (Philippine time). Episodes already scheduled were left alone.');
}

// ---------- status ----------
function status() {
  const schedule = loadSchedule();
  const state = loadState();
  const rows = [...schedule.episodes].sort((a, b) => Date.parse(a.youtube.publishAt || 0) - Date.parse(b.youtube.publishAt || 0));
  console.log('Date (PH)   Ep  Watched  YouTube     TikTok      Story');
  for (const e of rows) {
    const s = state[e.ep] || {};
    const d = e.youtube.publishAt ? phDate(e.youtube.publishAt) : '—'.padEnd(10);
    console.log(`${d}  ${String(e.ep).padStart(2)}  ${(e.watched ? 'yes' : 'no').padEnd(7)}  ${(s.youtube?.status || '-').padEnd(10)}  ${(s.tiktok?.status || '-').padEnd(10)}  ${e.story}`);
  }
  const now = Date.now();
  const live = rows.filter((e) => state[e.ep]?.youtube?.status === 'scheduled' && Date.parse(e.youtube.publishAt) <= now);
  if (live.length) {
    console.log('\nBy hand, once live: pin these comments');
    for (const e of live) {
      console.log(`  Ep ${e.ep} YouTube ${state[e.ep].youtube.url || ''}\n     ${e.youtube.pinnedComment}`);
      if (state[e.ep]?.tiktok) console.log(`  Ep ${e.ep} TikTok\n     ${e.tiktok.pinnedComment}`);
    }
  }
}

// ---------- schedule ----------
async function schedule() {
  const sched = loadSchedule();
  const { out } = problems(sched);
  if (out.length) { console.log(out.join('\n')); throw new Error('Fix the schedule first (npm run check).'); }
  const days = Number(flags.days || 7);
  const only = flags.only;
  const auto = Boolean(flags.auto);
  const eps = upcoming(sched, days);
  const state = loadState();
  const todo = eps.filter((e) => (only !== 'tiktok' && !state[e.ep]?.youtube) || (only !== 'youtube' && !state[e.ep]?.tiktok));
  if (!todo.length) { console.log(`Nothing left to schedule in the next ${days} days.`); return; }

  console.log(`To schedule (next ${days} days):`);
  for (const e of todo) console.log(`  ${phDate(e.youtube.publishAt)}  Episode ${e.ep}  ${e.story}${e.watched ? '' : '   (not marked watched)'}`);
  const unwatched = todo.filter((e) => !e.watched);
  if (unwatched.length) {
    const a = await ask(`\n${unwatched.length} of these are not marked as watched. Schedule them anyway? (y/N) `);
    if (a.toLowerCase() !== 'y') { console.log('Stopped. Watch them, then run: npm run watched -- <episode numbers>'); return; }
  }
  await download(todo);

  const { openChrome } = await import('./chrome.mjs');
  const { scheduleYouTube } = await import('./youtube.mjs');
  const { scheduleTikTok } = await import('./tiktok.mjs');
  const { context } = await openChrome();
  let failsInARow = 0;
  const failed = (where, err) => {
    console.log(`   ✗ ${where} failed: ${err.message.split('\n')[0]}`);
    if (/signed in/.test(err.message) || ++failsInARow >= 2) {
      console.log('\nStopping here so the same problem doesn\'t repeat for every episode. Nothing after this was touched.');
      return true;
    }
    return false;
  };

  for (const e of todo) {
    const file = videoPath(e);
    const s = loadState()[e.ep] || {};
    if (only !== 'tiktok' && !s.youtube) {
      if (Date.parse(e.youtube.publishAt) < Date.now() + 30 * 60e3) console.log(`\nEpisode ${e.ep} YouTube: too close to now, skipped.`);
      else {
        console.log(`\n▶ Episode ${e.ep} on YouTube: ${localTime(e.youtube.publishAt).label}`);
        try {
          const r = await scheduleYouTube(context, e, file, { auto });
          if (r.status === 'scheduled') markState(e.ep, 'youtube', r);
          failsInARow = 0;
          console.log(`   → ${r.status}${r.url ? ' ' + r.url : ''}`);
        } catch (err) { if (failed('YouTube', err)) break; }
        await humanPause(3000, 6000);
      }
    }
    if (only !== 'youtube' && !s.tiktok) {
      const when = Date.parse(e.tiktok.publishAt);
      if (when > Date.now() + TIKTOK_MAX_DAYS * DAY) console.log(`\nEpisode ${e.ep} TikTok: more than ${TIKTOK_MAX_DAYS} days ahead; run again closer to the date.`);
      else if (when < Date.now() + 30 * 60e3) console.log(`\nEpisode ${e.ep} TikTok: too close to now, skipped.`);
      else {
        console.log(`\n▶ Episode ${e.ep} on TikTok: ${localTime(e.tiktok.publishAt).label}`);
        try {
          const r = await scheduleTikTok(context, e, file, { auto });
          if (r.status === 'scheduled') markState(e.ep, 'tiktok', r);
          failsInARow = 0;
          console.log(`   → ${r.status}`);
        } catch (err) { if (failed('TikTok', err)) break; }
        await humanPause(3000, 6000);
      }
    }
  }
  console.log('\nDone. Check YouTube Studio → Content and TikTok Studio → Posts to see the scheduled videos.');
}

// ---------- main ----------
try {
  if (cmd === 'login') {
    const { openChrome, PROFILE_DIR } = await import('./chrome.mjs');
    await openChrome(['https://studio.youtube.com', 'https://www.tiktok.com/tiktokstudio/upload']);
    console.log(`Chrome is open with the After Sign-Off profile (${PROFILE_DIR}).`);
    console.log('Sign in to YouTube (the channel\'s Google account) and to TikTok in that window.');
    console.log('In YouTube Studio, set Settings → General → language to English. Then close Chrome.');
    console.log('You only need to do this once; the profile remembers you.');
  } else if (cmd === 'download') {
    const s = loadSchedule();
    await download(flags.all ? s.episodes : upcoming(s, Number(flags.days || 7)));
  } else if (cmd === 'plan') plan();
  else if (cmd === 'check') {
    const { out, warn } = problems(loadSchedule());
    for (const w of warn) console.log('note: ' + w);
    for (const o of out) console.log('PROBLEM: ' + o);
    console.log(out.length ? `\n${out.length} problem(s) to fix.` : '\nSchedule OK.');
    if (out.length) process.exitCode = 1;
  } else if (cmd === 'schedule') await schedule();
  else if (cmd === 'status') status();
  else if (cmd === 'watched') {
    const s = loadSchedule();
    for (const n of positional.map(Number)) {
      const e = s.episodes.find((x) => x.ep === n);
      if (e) { e.watched = true; console.log(`Episode ${n} marked as watched.`); }
    }
    saveSchedule(s);
  } else {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 10).join('\n'));
  }
} catch (err) {
  console.error('\nError: ' + err.message);
  process.exitCode = 1;
}
process.exit();
