// Dry run of the Facebook steps against a fake Business Suite page in test/.
// It never touches the real site: every facebook.com request is answered
// locally. Run: npm test (needs Chrome, or CHROME_PATH).
import fs from 'node:fs';
import path from 'node:path';
import { TOOL_DIR, loadSchedule, localTime } from './util.mjs';
import { openChrome } from './chrome.mjs';
import { scheduleFacebook } from './facebook.mjs';

const { context } = await openChrome();
await context.route(/facebook\.com/, (route) => {
  const u = route.request().url();
  const body = /reels_composer/.test(u) ? fs.readFileSync(path.join(TOOL_DIR, 'test', 'mock-facebook.html'), 'utf8') : '<html><body>ok</body></html>';
  route.fulfill({ contentType: 'text/html', body });
});
const fake = path.join(TOOL_DIR, 'test', 'fake.mp4');
fs.writeFileSync(fake, Buffer.alloc(49 * 1024 * 1024));
let seen = null;
let sharedNow = false;
context.on('console', (m) => { const x = m.text(); if (x === 'FB:SHARED-NOW') sharedNow = true; else if (x.startsWith('FB:')) seen = JSON.parse(x.slice(3)); });

const ep = structuredClone(loadSchedule().episodes.find((e) => e.ep === 11));
ep.facebook.publishAt = '2026-11-16T20:00:00+08:00';
const r = await scheduleFacebook(context, ep, fake, { auto: true });
console.log('facebook:', r, seen);
const t = localTime(ep.facebook.publishAt);
const flat = (x) => String(x).replace(/\s+/g, '');
const pass = !sharedNow && r.status === 'scheduled' && seen && flat(seen.cap) === flat(ep.facebook.caption)
  && seen.d === `${String(t.month + 1).padStart(2, '0')}/${String(t.day).padStart(2, '0')}/${t.year}`
  && seen.t === `${String(((t.date.getHours() + 11) % 12) + 1).padStart(2, '0')}:${t.mm} ${t.date.getHours() < 12 ? 'AM' : 'PM'}`;
fs.rmSync(fake);
for (const p of context.pages()) if (p.url().startsWith('http')) await p.close().catch(() => {});
console.log(pass ? '\nSELFTEST PASSED (fake page only)' : '\nSELFTEST FAILED');
process.exit(pass ? 0 : 1);
