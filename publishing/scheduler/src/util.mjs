import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

export const TOOL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SCHEDULE_PATH = path.join(TOOL_DIR, 'schedule.json');
export const STATE_PATH = path.join(TOOL_DIR, 'state.json');
export const VIDEOS_DIR = path.join(TOOL_DIR, 'videos');

export function readJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
export function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
export const loadSchedule = () => readJson(SCHEDULE_PATH);
export const saveSchedule = (s) => writeJson(SCHEDULE_PATH, s);
export const loadState = () => readJson(STATE_PATH, {});
export function markState(ep, platform, info) {
  const s = loadState();
  s[ep] ??= {};
  s[ep][platform] = { ...info, recordedAt: new Date().toISOString() };
  writeJson(STATE_PATH, s);
}

export const videoPath = (ep) => path.join(VIDEOS_DIR, path.basename(ep.file));

export async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(question)).trim(); } finally { rl.close(); }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** A short, slightly random pause so the pages are used at a human pace. */
export const humanPause = (min = 700, max = 1800) => sleep(min + Math.random() * (max - min));

/** The schedule's time, converted to this PC's own time zone (what Studio shows by default). */
export function localTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Bad date/time: ${iso}`);
  const p2 = (n) => String(n).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h = d.getHours();
  return {
    date: d,
    ymd: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`,
    year: d.getFullYear(), month: d.getMonth(), day: d.getDate(),
    hh: p2(h), mm: p2(d.getMinutes()),
    hm24: `${p2(h)}:${p2(d.getMinutes())}`,
    usDate: `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
    time12: `${((h + 11) % 12) + 1}:${p2(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`,
    label: d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
  };
}

/** Philippine date (YYYY-MM-DD) of an ISO time, whatever this PC's time zone is. */
export function phDate(iso) {
  return new Date(new Date(iso).getTime() + 8 * 3600e3).toISOString().slice(0, 10);
}

/**
 * Runs one form step. If it fails (the site changed, a pop-up got in the way),
 * it records the step so you can do it by hand instead of crashing.
 */
export const DEBUG_DIR = path.join(TOOL_DIR, 'debug');

export function stepper(platform, page, epNo) {
  const manual = [];
  const step = async (what, fn) => {
    try {
      await fn();
      console.log(`   ✓ ${what}`);
      await humanPause();
      return true;
    } catch (e) {
      const why = String(e?.message || e).split('\n')[0].slice(0, 300);
      console.log(`   ✗ couldn't ${what} automatically (${why})`);
      if (page) {
        try {
          fs.mkdirSync(DEBUG_DIR, { recursive: true });
          const shot = path.join(DEBUG_DIR, `${platform}-ep${epNo}-${what.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.png`.toLowerCase());
          await page.screenshot({ path: shot });
          console.log(`     screenshot: ${shot}`);
        } catch { /* screenshots are optional */ }
      }
      console.log(`     → please do this yourself in the ${platform} tab.`);
      manual.push(what);
      return false;
    }
  };
  return { step, manual };
}

/** Select everything in a text box and type new text (line by line). */
export async function replaceText(page, box, text) {
  await box.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) await page.keyboard.insertText(lines[i]);
    if (i < lines.length - 1) await page.keyboard.press('Enter');
  }
}

export const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
