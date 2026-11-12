// Schedules one Reel on your Facebook Page through Meta Business Suite's Reels
// composer (business.facebook.com). Every step falls back to "please do it by
// hand" if Meta has changed the page, and a Reel is only recorded as scheduled
// once Business Suite confirms it.
import { ask, localTime, norm, stepper } from './util.mjs';

const COMPOSER = 'https://business.facebook.com/latest/reels_composer';

/** Close Meta's tips and pop-ups ("Not now", "Got it" …) that cover the page. */
async function dismissPopups(page) {
  for (let round = 0; round < 4; round++) {
    const btn = page.getByRole('button', { name: /^(not now|got it|ok|okay|close|skip|dismiss|maybe later)$/i })
      .filter({ visible: true }).first();
    if (!(await btn.count())) return;
    await btn.click({ timeout: 3_000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
}

/** Click the visible button with this name (the last one, like a dialog's footer). */
async function clickButton(page, name, timeout = 10_000) {
  const b = page.getByRole('button', { name }).filter({ visible: true }).last();
  await b.waitFor({ state: 'visible', timeout });
  await b.click({ timeout });
}

/** Paste text into a rich text box in one go (Meta's editors lose their place when typed into fast). */
async function pasteInto(page, box, text) {
  await box.click({ timeout: 5_000 }).catch(async () => { await box.focus(); });
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Delete');
  await box.evaluate((el, t) => {
    el.focus();
    const dt = new DataTransfer();
    dt.setData('text/plain', t);
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, text);
  await page.waitForTimeout(1000);
  const flat = (x) => String(x).replace(/\s+/g, '').toLowerCase();
  if (!flat(await box.innerText()).startsWith(flat(text).slice(0, 25))) {
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Delete');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) await page.keyboard.type(lines[i], { delay: 15 });
      if (i < lines.length - 1) await page.keyboard.press('Shift+Enter');
    }
    await page.waitForTimeout(600);
  }
  const shown = await box.innerText();
  if (!flat(shown).startsWith(flat(text).slice(0, 25)) || !flat(shown).includes(flat(text).slice(-15))) {
    throw new Error(`the caption box shows "${norm(shown).slice(0, 80)}"`);
  }
}

/** Find a visible input whose current value matches `re`. */
async function inputByValue(page, re) {
  const inputs = page.locator('input');
  const n = await inputs.count();
  for (let i = 0; i < n; i++) {
    const el = inputs.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    if (re.test(await el.inputValue().catch(() => ''))) return el;
  }
  return null;
}

async function setDate(page, t) {
  const box = page.getByPlaceholder(/mm\/dd\/yyyy|date/i).filter({ visible: true }).first()
    .or(page.getByRole('textbox', { name: /date/i }).filter({ visible: true }).first()).first();
  let el = (await box.count()) ? box : await inputByValue(page, /\d{1,2}\/\d{1,2}\/\d{4}|[A-Z][a-z]{2} \d{1,2}, \d{4}/);
  if (!el) throw new Error('date field not found');
  const mdY = `${String(t.month + 1).padStart(2, '0')}/${String(t.day).padStart(2, '0')}/${t.year}`;
  for (const value of [mdY, t.usDate]) {
    await el.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(value, { delay: 30 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const v = await el.inputValue();
    if (v.includes(mdY) || v.includes(t.usDate) || v.includes(`${t.month + 1}/${t.day}/${t.year}`)) return;
  }
  throw new Error(`the date field shows "${await el.inputValue()}"`);
}

async function setTime(page, t) {
  const h12 = String(((t.date.getHours() + 11) % 12) + 1);
  const ampm = t.date.getHours() < 12 ? 'AM' : 'PM';
  // Style 1: separate hour / minute / AM-PM boxes.
  const hour = page.getByRole('spinbutton', { name: /hour/i }).filter({ visible: true }).first();
  if (await hour.count()) {
    const minute = page.getByRole('spinbutton', { name: /minute/i }).filter({ visible: true }).first();
    const mer = page.getByRole('spinbutton', { name: /meridiem|am\/pm|am|pm/i }).filter({ visible: true }).first();
    await hour.click(); await page.keyboard.type(h12.padStart(2, '0'));
    await minute.click(); await page.keyboard.type(t.mm);
    if (await mer.count()) { await mer.click(); await page.keyboard.type(ampm[0]); }
    await page.waitForTimeout(400);
    const got = `${Number(await hour.textContent().catch(() => '') || await hour.inputValue().catch(() => ''))}`;
    if (got && got !== h12) throw new Error(`the hour shows ${got}`);
    return;
  }
  // Style 2: one time box such as "8:00 PM".
  const el = page.getByRole('textbox', { name: /time/i }).filter({ visible: true }).first();
  const box = (await el.count()) ? el : await inputByValue(page, /^\d{1,2}:\d{2}( ?[AP]M)?$/i);
  if (!box) throw new Error('time field not found');
  await box.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(t.time12, { delay: 30 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const v = (await box.inputValue()).toUpperCase().replace(/\s+/g, ' ');
  if (!v.includes(`${h12}:${t.mm}`)) throw new Error(`the time field shows "${v}"`);
}

/**
 * Give the video to the composer. Business Suite often has no upload box on the
 * page until you click "Add video" (and it may sit inside a frame), so: look
 * for one in every frame first; otherwise click an add/upload button and hand
 * the file to the file dialog it opens.
 */
async function attachVideo(page, file) {
  for (let i = 0; i < 8; i++) {
    for (const fr of page.frames()) {
      const inp = fr.locator('input[type="file"]').first();
      if (await inp.count().catch(() => 0)) { await inp.setInputFiles(file); return; }
    }
    await page.waitForTimeout(1000);
  }
  const names = /^(add video|add a video|upload video|upload|add reel|create reel|select video|select file|add media|browse|add)$/i;
  const candidates = [
    page.getByRole('button', { name: names }),
    page.getByText(names),
    page.getByRole('button', { name: /add video|upload|select video|add media/i }),
  ];
  for (const c of candidates) {
    const btn = c.filter({ visible: true }).first();
    if (!(await btn.count())) continue;
    const chooser = page.waitForEvent('filechooser', { timeout: 15_000 });
    await btn.click({ timeout: 10_000 }).catch(() => {});
    const fc = await chooser.catch(() => null);
    if (fc) { await fc.setFiles(file); return; }
    // The button may have revealed an upload box instead of a dialog.
    for (const fr of page.frames()) {
      const inp = fr.locator('input[type="file"]').first();
      if (await inp.count().catch(() => 0)) { await inp.setInputFiles(file); return; }
    }
  }
  throw new Error(`couldn't find where to add the video on ${page.url()}`);
}

async function saveShot(page, ep, what) {
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { DEBUG_DIR } = await import('./util.mjs');
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
    const shot = path.join(DEBUG_DIR, `facebook-ep${ep}-${what}.png`);
    await page.screenshot({ path: shot });
    console.log(`     screenshot: ${shot}`);
  } catch { /* optional */ }
}

export async function scheduleFacebook(context, ep, file, opts) {
  const page = await context.newPage();
  try {
    return await scheduleOn(page, ep, file, opts);
  } catch (err) {
    console.log(`   ✗ ${String(err.message).split('\n')[0].slice(0, 200)}`);
    console.log(`     page: ${page.url()}`);
    await saveShot(page, ep.ep, 'failed');
    throw err;
  }
}

async function scheduleOn(page, ep, file, { auto }) {
  const f = ep.facebook;
  const t = localTime(f.publishAt);
  await page.bringToFront();
  const { step, manual } = stepper('Facebook', page, ep.ep);

  await page.goto(COMPOSER, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForLoadState('load', { timeout: 30_000 }).catch(() => {});
  if (/\/login|login\.php|checkpoint/.test(page.url())) {
    throw new Error('Not signed in to Facebook / Meta Business Suite. Run 1-LOGIN.bat first.');
  }
  await dismissPopups(page);

  await page.waitForTimeout(3000);
  await dismissPopups(page);
  await attachVideo(page, file);
  console.log('   ✓ uploading the video');
  await page.waitForTimeout(2000);
  await dismissPopups(page);

  await step('write the caption', async () => {
    const box = page.locator('[contenteditable="true"][role="textbox"]').filter({ visible: true }).first()
      .or(page.locator('[contenteditable="true"]').filter({ visible: true }).first()).first();
    await box.waitFor({ state: 'visible', timeout: 60_000 });
    await pasteInto(page, box, f.caption);
  });

  if (f.aiLabel !== false) {
    await step('turn on the AI label (the narration is an AI voice)', async () => {
      const label = page.getByText(/AI[- ]generated|AI info|Add AI label|Made with AI/i).filter({ visible: true }).first();
      await label.scrollIntoViewIfNeeded({ timeout: 8_000 });
      const row = label.locator('xpath=ancestor::*[.//*[@role="switch"] or .//input[@type="checkbox"]][1]');
      const sw = row.locator('[role="switch"], input[type="checkbox"]').first();
      const on = (await sw.getAttribute('aria-checked')) === 'true' || (await sw.isChecked().catch(() => false));
      if (!on) await sw.click({ force: true });
    });
  }

  await step('go to the sharing step', async () => {
    for (let i = 0; i < 3; i++) {
      await dismissPopups(page);
      const next = page.getByRole('button', { name: /^next$/i }).filter({ visible: true }).last();
      if (!(await next.count())) break;
      if (!(await next.isEnabled())) await page.waitForTimeout(3000);
      await next.click({ timeout: 10_000 });
      await page.waitForTimeout(1500);
    }
    await page.getByText(/schedul/i).filter({ visible: true }).first().waitFor({ timeout: 15_000 });
  });

  await step('choose "Schedule"', async () => {
    const radio = page.getByRole('radio', { name: /schedule/i }).filter({ visible: true });
    const sw = page.getByRole('switch', { name: /schedule|set date and time/i }).filter({ visible: true });
    if (await radio.count()) await radio.first().check({ force: true });
    else if (await sw.count()) { if ((await sw.first().getAttribute('aria-checked')) !== 'true') await sw.first().click(); }
    else await page.getByText(/^(schedule|scheduling options|set date and time)$/i).filter({ visible: true }).first().click({ timeout: 10_000 });
    await page.waitForTimeout(800);
  });

  await step(`set the date to ${t.usDate}`, () => setDate(page, t));
  await step(`set the time to ${t.time12} (your PC's time zone)`, () => setTime(page, t));

  const finalBtn = page.getByRole('button', { name: /^schedule$/i }).filter({ visible: true }).last();
  console.log('   … waiting for the upload to finish');
  await step('wait for the upload to finish', async () => {
    await finalBtn.waitFor({ state: 'visible', timeout: 60_000 });
    for (let i = 0; i < 600 && !(await finalBtn.isEnabled()); i++) await page.waitForTimeout(3000);
    if (!(await finalBtn.isEnabled())) throw new Error('the Schedule button never became active');
  });

  console.log(`\n   Facebook is filled in for Episode ${ep.ep}: ${t.label} (your PC's time).`);
  if (manual.length) console.log(`   Do these by hand first: ${manual.join('; ')}.`);
  let answer = '';
  if (!auto || manual.length) {
    answer = (await ask('   Check the Facebook tab. Press Enter to click Schedule, type "d" if you clicked it yourself, or "s" to skip: ')).toLowerCase();
    if (answer === 's') return { status: 'skipped' };
  }

  // Only count it once Business Suite confirms (a "scheduled" message, or the
  // composer closing back to the content/planner page).
  const confirmed = async (ms) => {
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (/\/latest\/(content|posts|planner|home)|\/content_calendar/.test(page.url())) return true;
      if (await page.getByText(/(reel|post|video) (has been |was )?scheduled|scheduled (for|successfully)/i).filter({ visible: true }).count()) return true;
      await page.waitForTimeout(1000);
    }
    return false;
  };
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    if (answer !== 'd' || attempt > 0) {
      if (await finalBtn.isEnabled().catch(() => false)) await finalBtn.click({ timeout: 15_000 }).catch(() => {});
      // Meta sometimes asks to confirm.
      const again = page.getByRole('dialog').getByRole('button', { name: /^(schedule|confirm|continue)$/i }).first();
      if (await again.isVisible({ timeout: 3_000 }).catch(() => false)) await again.click().catch(() => {});
    }
    ok = await confirmed(45_000);
    if (!ok) {
      console.log('   Business Suite has not confirmed that the reel is scheduled yet.');
      const a = (await ask('   Look at the Facebook tab: finish scheduling it there if needed, then press Enter once it shows as scheduled (or type "s" if it is not): ')).toLowerCase();
      if (a === 's') return { status: 'skipped' };
      ok = await confirmed(5_000);
      if (!ok) {
        const yes = (await ask('   I can\'t see a confirmation on the page. Is it scheduled? Check Business Suite → Content → Scheduled. (y/N) ')).toLowerCase();
        if (yes === 'y') ok = true;
        else { answer = ''; console.log('   Trying the Schedule button again.'); }
      }
    }
  }
  if (!ok) {
    console.log('   Not confirmed, so it is NOT marked as scheduled. The tab is left open.');
    return { status: 'unconfirmed' };
  }
  await page.waitForTimeout(1500);
  await page.close().catch(() => {});
  return { status: 'scheduled', for: f.publishAt };
}
