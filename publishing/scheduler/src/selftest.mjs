// Dry run of the YouTube and TikTok steps against fake pages in test/.
// It never touches the real sites: every youtube.com / tiktok.com request is
// answered locally. Run: npm test (needs Chrome, or CHROME_PATH).
import fs from 'node:fs';
import path from 'node:path';
import { TOOL_DIR, loadSchedule } from './util.mjs';
import { openChrome } from './chrome.mjs';
import { scheduleYouTube } from './youtube.mjs';
import { scheduleTikTok } from './tiktok.mjs';

const mock = (f) => fs.readFileSync(path.join(TOOL_DIR, 'test', f), 'utf8');
// Same connection as a real run (your Chrome, attached over its local port).
const { context } = await openChrome();
await context.route(/youtube\.com|tiktok\.com|google\.com/, (route) => {
  const u = route.request().url();
  const body = /youtube\.com\/upload/.test(u) ? mock('mock-youtube.html')
    : /tiktokstudio\/upload/.test(u) ? mock('mock-tiktok.html') : '<html><body>ok</body></html>';
  route.fulfill({ contentType: 'text/html', body });
});
const fake = path.join(TOOL_DIR, 'test', 'fake.mp4');
fs.writeFileSync(fake, Buffer.alloc(49 * 1024 * 1024)); // as big as a real episode

const ep = structuredClone(loadSchedule().episodes[0]);
ep.tiktok.publishAt = '2026-11-16T21:30:00+08:00';
let pass = true;
const watch = (name, p) => p.then((r) => { console.log(`${name}:`, r); return r; });

const yt = await watch('youtube', scheduleYouTube(context, ep, fake, { auto: true }));
let pickedTags = '';
context.on('console', (m) => { if (m.text().startsWith('PICKED:')) pickedTags = m.text().slice(7); });
const tk = await watch('tiktok', scheduleTikTok(context, ep, fake, { auto: true }));
if (yt.status !== 'scheduled' || yt.url !== 'https://youtu.be/MOCK123') pass = false;
if (tk.status !== 'scheduled') pass = false;
const wantTags = ep.tiktok.caption.match(/#[^\s#]+/g).join(',');
console.log('hashtags picked from the list:', pickedTags);
if (pickedTags !== wantTags) pass = false;
for (const p of context.pages()) if (p.url().startsWith('http')) await p.close().catch(() => {});
fs.rmSync(fake);
await context.unrouteAll().catch(() => {});
console.log(pass ? '\nSELFTEST PASSED (fake pages only)' : '\nSELFTEST FAILED');
process.exit(pass ? 0 : 1);
