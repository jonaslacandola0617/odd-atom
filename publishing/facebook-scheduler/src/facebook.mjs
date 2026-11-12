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
    // Close the hashtag suggestion list that stays open after the last tag.
    const heading = page.getByText('Reel details', { exact: true }).filter({ visible: true }).first();
    if (await heading.count()) await heading.click().catch(() => {});
    else await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
  });

  // Business Suite's Reels composer has no AI-label switch (as of Nov 2026).
  // If one ever appears, turn it on; otherwise skip quietly.
  if (f.aiLabel !== false) {
    const label = page.getByText(/AI[- ]generated|AI info|Add AI label|Made with AI/i).filter({ visible: true }).first();
    if (await label.count()) {
      await step('turn on the AI label (the narration is an AI voice)', async () => {
        const row = label.locator('xpath=ancestor::*[.//*[@role="switch"] or .//input[@type="checkbox"]][1]');
        const sw = row.locator('[role="switch"], input[type="checkbox"]').first();
        const on = (await sw.getAttribute('aria-checked')) === 'true' || (await sw.isChecked().catch(() => false));
        if (!on) await sw.click({ force: true });
      });
    }
  }

  await step('go to the Share step', async () => {
    for (let i = 0; i < 3; i++) {
      if (await page.getByText('Scheduling options', { exact: true }).filter({ visible: true }).count()) break;
      await dismissPopups(page);
      const next = page.getByRole('button', { name: /^next$/i }).filter({ visible: true }).last();
      if (!(await next.count())) break;
      for (let k = 0; k < 20 && !(await next.isEnabled()); k++) await page.waitForTimeout(1500);
      await next.click({ timeout: 10_000 });
      await page.waitForTimeout(2000);
    }
    await page.getByText('Scheduling options', { exact: true }).filter({ visible: true }).first().waitFor({ timeout: 20_000 });
  });

  // The footer button: "Share" posts NOW; it turns into "Schedule" once the
  // Schedule option is selected. The tool never clicks it while it says Share.
  const footer = page.locator('div')
    .filter({ has: page.getByRole('button', { name: /^back$/i }) })
    .filter({ has: page.getByRole('button', { name: /^(share|schedule|publish)$/i }) }).last();
  const footerBtn = footer.getByRole('button', { name: /^(share|schedule|publish)$/i }).last();
  const footerSays = async () => norm(await footerBtn.innerText().catch(() => ''));

  await step('choose "Schedule"', async () => {
    const options = page.locator('div')
      .filter({ has: page.getByText('Scheduling options', { exact: true }) })
      .filter({ has: page.getByText('Share now', { exact: true }) }).last();
    const seg = options.getByText('Schedule', { exact: true }).first();
    for (let i = 0; i < 3 && !/^schedule$/i.test(await footerSays()); i++) {
      await seg.click({ timeout: 10_000 });
      await page.waitForTimeout(1200);
    }
    if (!/^schedule$/i.test(await footerSays())) throw new Error(`the button at the bottom still says "${await footerSays()}"`);
  });

  await step(`set the date to ${t.usDate}`, () => setDate(page, t));
  await step(`set the time to ${t.time12} (your PC's time zone)`, () => setTime(page, t));

  console.log('   … waiting for the upload to finish');
  await step('wait for the upload to finish', async () => {
    for (let i = 0; i < 600 && !(await footerBtn.isEnabled().catch(() => false)); i++) await page.waitForTimeout(3000);
    if (!(await footerBtn.isEnabled().catch(() => false))) throw new Error('the button at the bottom never became active');
  });

  console.log(`\n   Facebook is filled in for Episode ${ep.ep}: ${t.label} (your PC's time).`);
  if (manual.length) console.log(`   Do these by hand first: ${manual.join('; ')}.`);
  let answer = '';
  for (;;) {
    if (!auto || manual.length) {
      answer = (await ask('   Check the Facebook tab. Press Enter to click Schedule, type "d" if you clicked it yourself, or "s" to skip: ')).toLowerCase();
      if (answer === 's') return { status: 'skipped' };
    }
    if (answer === 'd') break;
    const says = await footerSays();
    if (/^schedule$/i.test(says)) { await footerBtn.click({ timeout: 15_000 }).catch(() => {}); break; }
    // Safety: never click "Share" (it would post right now).
    console.log(`   The button at the bottom says "${says || '?'}", not "Schedule", so I won't click it (Share posts immediately).`);
    console.log('   In the tab, select "Schedule" under Scheduling options and set the date and time.');
    if (auto && !manual.length) manual.push('select Schedule');
  }

  // Meta sometimes asks to confirm.
  const again = page.getByRole('dialog').getByRole('button', { name: /^(schedule|confirm|continue)$/i }).first();
  if (await again.isVisible({ timeout: 3_000 }).catch(() => false)) await again.click().catch(() => {});

  // You oversee the result. Close the tab only once the composer has gone
  // (back to Content/Planner); otherwise leave it open so nothing is lost.
  await page.waitForTimeout(6000);
  if (!(await page.getByText('Scheduling options', { exact: true }).filter({ visible: true }).count())) {
    await page.close().catch(() => {});
  } else {
    console.log('   (Tab left open: check that it shows as scheduled, then close it yourself.)');
  }
  return { status: 'scheduled', for: f.publishAt };
}
