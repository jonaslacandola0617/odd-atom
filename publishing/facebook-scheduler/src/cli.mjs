#!/usr/bin/env node
// After Sign-Off Facebook scheduler. Commands:
//   login                      open Chrome so you can sign in to Facebook / Meta Business Suite (once)
//   download [--all]           download the videos that are due (or all 20)
//   plan --start YYYY-MM-DD [--order 11-20,1-10] [--skip 1-2] [--seed text] [--time 20:00]
//   check                      check the schedule for mistakes
//   schedule [--days 60] [--max-days 28] [--ep N] [--auto]
//   status                     show what is scheduled
//   watched N [N ...]          mark episodes as watched by you
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

const DAY = 86400e3;
// How far ahead Business Suite lets you schedule. Meta's limit can differ by
// account; if a date is refused, the date step shows ✗ and you can lower this.
const MAX_DAYS = Number(flags['max-days'] || 28);

const when = (e) => e.facebook.publishAt;

function upcoming(schedule, days) {
  const now = Date.now();
  return schedule.episodes
    .filter((e) => !flags.ep || String(e.ep) === String(flags.ep))
    .filter((e) => when(e) && Date.parse(when(e)) > now && Date.parse(when(e)) <= now + days * DAY)
    .sort((a, b) => Date.parse(when(a)) - Date.parse(when(b)));
}

// ---------- check ----------
function problems(schedule) {
  const out = [];
  const warn = [];
  for (const e of schedule.episodes) {
    const tag = `Episode ${e.ep}`;
    const f = e.facebook;
    if (!f.caption) out.push(`${tag}: no caption.`);
    else if (f.caption.length > 2200) out.push(`${tag}: caption over 2,200 characters (${f.caption.length}).`);
    if (!f.publishAt) warn.push(`${tag}: no time yet (run plan).`);
    else if (Number.isNaN(Date.parse(f.publishAt))) out.push(`${tag}: time "${f.publishAt}" is not a valid date/time.`);
    else if ((e.notOn || []).includes(phDate(f.publishAt).slice(5))) out.push(`${tag}: falls on ${phDate(f.publishAt)}. ${e.note || ''}`);
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
  return String(spec || '11-20,1-10').split(',').flatMap((part) => {
    const [a, b] = part.split('-').map(Number);
    if (!b) return [a];
    const step = a <= b ? 1 : -1;
    return Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => a + i * step);
  });
}

function rng(seedText) {
  let h = 2166136261;
  for (const c of String(seedText)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One Reel per posting day from --start, Philippine stories first (11–20),
 * then Season 1 (1–10). Each week (Monday–Sunday) leaves out 1–2 random days
 * (--skip), never a Monday. Episodes already scheduled, or dated before
 * --start, keep their dates.
 */
function plan() {
  const schedule = loadSchedule();
  const start = flags.start;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '')) throw new Error('Give a start date: --start 2026-11-16');
  const order = parseOrder(flags.order);
  const time = flags.time || schedule.defaults.facebookTime;
  const [skipMin, skipMax = skipMin] = String(flags.skip ?? '1-2').split('-').map(Number);
  const random = rng(flags.seed ?? `facebook-${start}`);
  const state = loadState();
  const byEp = new Map(schedule.episodes.map((e) => [e.ep, e]));
  const fixed = (e) => state[e.ep]?.facebook || (when(e) && phDate(when(e)) < start);
  const queue = order.filter((n) => byEp.has(n) && !fixed(byEp.get(n)));
  for (const e of schedule.episodes.filter(fixed).sort((x, y) => Date.parse(when(x)) - Date.parse(when(y)))) {
    console.log(`${phDate(when(e))}      Episode ${String(e.ep).padStart(2)}  ${e.story}   (kept)`);
  }
  const offDays = new Map();
  const daysOff = (mondayKey) => {
    if (!offDays.has(mondayKey)) {
      const n = skipMin + Math.floor(random() * (skipMax - skipMin + 1));
      const chosen = new Set();
      while (chosen.size < Math.min(n, 6)) chosen.add(1 + Math.floor(random() * 6)); // Tue..Sun
      offDays.set(mondayKey, chosen);
    }
    return offDays.get(mondayKey);
  };
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let day = new Date(`${start}T00:00:00Z`);
  let lastWeek = '';
  while (queue.length) {
    const ymd = day.toISOString().slice(0, 10);
    const dow = (day.getUTCDay() + 6) % 7;
    const mondayKey = new Date(day.getTime() - dow * DAY).toISOString().slice(0, 10);
    const off = daysOff(mondayKey);
    if (mondayKey !== lastWeek) {
      console.log(`\nWeek of ${mondayKey}: days off ${[...off].sort().map((d) => names[d]).join(' and ')}`);
      lastWeek = mondayKey;
    }
    if (!off.has(dow)) {
      const idx = queue.findIndex((n) => !(byEp.get(n).notOn || []).includes(ymd.slice(5)));
      if (idx >= 0) {
        const e = byEp.get(queue.splice(idx, 1)[0]);
        e.facebook.publishAt = `${ymd}T${time}:00${schedule.defaults.utcOffset}`;
        console.log(`${ymd} ${names[dow]}  Episode ${String(e.ep).padStart(2)}  ${e.story}`);
      }
    }
    day = new Date(day.getTime() + DAY);
  }
  saveSchedule(schedule);
  console.log('\nSaved schedule.json (Philippine time). Run "npm run check" to double-check it.');
}

// ---------- status ----------
function status() {
  const schedule = loadSchedule();
  const state = loadState();
  const rows = [...schedule.episodes].sort((a, b) => Date.parse(when(a) || 0) - Date.parse(when(b) || 0));
  console.log('Date (PH)   Ep  Watched  Facebook    Story');
  for (const e of rows) {
    const d = when(e) ? phDate(when(e)) : '—'.padEnd(10);
    console.log(`${d}  ${String(e.ep).padStart(2)}  ${(e.watched ? 'yes' : 'no').padEnd(7)}  ${(state[e.ep]?.facebook?.status || '-').padEnd(10)}  ${e.story}`);
  }
}

// ---------- schedule ----------
async function schedule() {
  const sched = loadSchedule();
  const { out } = problems(sched);
  if (out.length) { console.log(out.join('\n')); throw new Error('Fix the schedule first (npm run check).'); }
  const days = Number(flags.days || 60);
  const auto = Boolean(flags.auto);
  const state = loadState();
  const todo = upcoming(sched, days).filter((e) => !state[e.ep]?.facebook);
  if (!todo.length) { console.log(`Nothing left to schedule in the next ${days} days.`); return; }

  console.log(`To schedule on Facebook (next ${days} days):`);
  for (const e of todo) console.log(`  ${phDate(when(e))}  Episode ${e.ep}  ${e.story}${e.watched ? '' : '   (not marked watched)'}`);
  const unwatched = todo.filter((e) => !e.watched);
  if (unwatched.length) {
    const a = await ask(`\n${unwatched.length} of these are not marked as watched. Schedule them anyway? (y/N) `);
    if (a.toLowerCase() !== 'y') { console.log('Stopped. Watch them, then run: npm run watched -- <episode numbers>'); return; }
  }
  const inWindow = todo.filter((e) => Date.parse(when(e)) <= Date.now() + MAX_DAYS * DAY);
  await download(inWindow);

  const { openChrome } = await import('./chrome.mjs');
  const { scheduleFacebook } = await import('./facebook.mjs');
  const { context } = await openChrome();
  let failsInARow = 0;
  for (const e of todo) {
    const at = Date.parse(when(e));
    if (at > Date.now() + MAX_DAYS * DAY) { console.log(`\nEpisode ${e.ep}: more than ${MAX_DAYS} days ahead; run again closer to the date.`); continue; }
    if (at < Date.now() + 30 * 60e3) { console.log(`\nEpisode ${e.ep}: too close to now, skipped.`); continue; }
    console.log(`\n▶ Episode ${e.ep} on Facebook: ${localTime(when(e)).label}`);
    try {
      const r = await scheduleFacebook(context, e, videoPath(e), { auto });
      if (r.status === 'scheduled') markState(e.ep, 'facebook', r);
      failsInARow = 0;
      console.log(`   → ${r.status}`);
    } catch (err) {
      console.log(`   ✗ Facebook failed: ${err.message.split('\n')[0]}`);
      if (/signed in/.test(err.message) || ++failsInARow >= 2) {
        console.log('\nStopping here so the same problem doesn\'t repeat for every episode. Nothing after this was touched.');
        break;
      }
    }
    await humanPause(3000, 6000);
  }
  console.log('\nDone. Check Meta Business Suite → Content → Scheduled to see them.');
}

// ---------- main ----------
try {
  if (cmd === 'login') {
    const { openChrome, PROFILE_DIR } = await import('./chrome.mjs');
    await openChrome(['https://business.facebook.com/latest/home']);
    console.log(`Chrome is open with the After Sign-Off profile (${PROFILE_DIR}).`);
    console.log('Sign in to Facebook with the account that manages your Page, and open your Page in Meta Business Suite.');
    console.log('If you manage more than one Page, switch to the After Sign-Off Page (top left). Set Facebook\'s language to English.');
    console.log('Then close Chrome. You only need to do this once.');
  } else if (cmd === 'download') {
    const s = loadSchedule();
    await download(flags.all ? s.episodes : upcoming(s, Number(flags.days || 60)));
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
