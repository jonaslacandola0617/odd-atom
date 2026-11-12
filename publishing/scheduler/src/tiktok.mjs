// Schedules one video in TikTok Studio (tiktok.com/tiktokstudio/upload).
// TikTok only lets you schedule up to about 10 days ahead. Every step falls
// back to "please do it by hand" if the page has changed.
import { ask, localTime, norm, replaceText, stepper } from './util.mjs';

async function findInput(page, re) {
  const inputs = page.locator('input');
  const n = await inputs.count();
  for (let i = 0; i < n; i++) {
    const el = inputs.nth(i);
    const v = await el.inputValue().catch(() => '');
    if (re.test(v) && (await el.isVisible().catch(() => false))) return el;
  }
  throw new Error('field not found');
}

/**
 * TikTok's caption box pre-fills the file name and pops up suggestions while
 * you type a hashtag. Clear it, type the words, and type each hashtag slowly,
 * closing its suggestion list with a space.
 */
async function typeCaption(page, editor, caption) {
  await editor.click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);
    if (!norm(await editor.innerText())) break;
  }
  const left = norm(await editor.innerText()).length;
  for (let i = 0; i < left + 5 && norm(await editor.innerText()); i++) await page.keyboard.press('Backspace');
  const parts = caption.split(/(\s+)/);
  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) { await page.keyboard.press('Space'); continue; }
    if (part.startsWith('#')) {
      await page.keyboard.type(part, { delay: 60 });
      await page.waitForTimeout(900);
    } else {
      await page.keyboard.insertText(part);
    }
  }
  await page.keyboard.press('Space');       // closes the last hashtag's suggestion list
  await page.waitForTimeout(600);
  await page.keyboard.press('Escape').catch(() => {});
}

async function clickOption(page, text, which) {
  const opts = page.getByText(text, { exact: true }).filter({ visible: true });
  const n = await opts.count();
  if (!n) throw new Error(`option ${text} not found`);
  await (which === 'last' ? opts.nth(n - 1) : opts.first()).click();
}

export async function scheduleTikTok(context, ep, file, { auto }) {
  const tk = ep.tiktok;
  const t = localTime(tk.publishAt);
  const page = await context.newPage();
  await page.bringToFront();
  const { step, manual } = stepper('TikTok', page, ep.ep);

  await page.goto('https://www.tiktok.com/tiktokstudio/upload?from=webapp', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForLoadState('load', { timeout: 30_000 }).catch(() => {});
  if (/\/login/.test(page.url())) throw new Error('Not signed in to TikTok. Run 2-LOGIN.bat (npm run login) first.');

  const input = page.locator('input[type="file"]').first();
  await input.waitFor({ state: 'attached', timeout: 90_000 });
  await input.setInputFiles(file);
  console.log('   ✓ uploading the video');

  // The caption box appears once the upload starts. Prefer TikTok's own editor;
  // fall back to any editable box on the page.
  let editor = page.locator('.public-DraftEditor-content[contenteditable="true"]').first();
  try { await editor.waitFor({ timeout: 180_000 }); }
  catch { editor = page.locator('[contenteditable="true"]').first(); await editor.waitFor({ timeout: 10_000 }); }

  await step('set the caption', async () => {
    await typeCaption(page, editor, tk.caption);
    const flat = (x) => String(x).replace(/\s+/g, '').toLowerCase();
    const shown = await editor.innerText();
    if (!flat(shown).startsWith(flat(tk.caption).slice(0, 25))) {
      throw new Error(`the caption box shows "${norm(shown).slice(0, 80)}"`);
    }
  });

  if (tk.aiGenerated) {
    await step('turn on "AI-generated content"', async () => {
      const more = page.getByText(/^Show more$/).first();
      if (await more.isVisible().catch(() => false)) await more.click();
      const label = page.getByText('AI-generated content', { exact: true }).first();
      await label.scrollIntoViewIfNeeded({ timeout: 10_000 });
      const row = label.locator('xpath=ancestor::*[.//*[@role="switch"] or .//input[@type="checkbox"]][1]');
      const sw = row.locator('[role="switch"], input[type="checkbox"]').first();
      const on = (await sw.getAttribute('aria-checked')) === 'true' || (await sw.isChecked().catch(() => false));
      if (!on) {
        await sw.click({ force: true });
        const turnOn = page.getByRole('button', { name: /^turn on$/i });
        if (await turnOn.isVisible({ timeout: 3_000 }).catch(() => false)) await turnOn.click();
      }
    });
  }

  await step('choose "Schedule"', async () => {
    const radio = page.getByRole('radio', { name: /schedule/i });
    if (await radio.count()) await radio.first().check({ force: true });
    else await page.getByText('Schedule', { exact: true }).first().click({ timeout: 10_000 });
    const allow = page.getByRole('button', { name: /^allow$/i });
    if (await allow.isVisible({ timeout: 3_000 }).catch(() => false)) await allow.click();
    await findInput(page, /^\d{1,2}:\d{2}$/);
  });

  await step(`set the time to ${t.hm24} (your PC's time zone)`, async () => {
    const box = await findInput(page, /^\d{1,2}:\d{2}$/);
    await box.click();
    await page.waitForTimeout(600);
    await clickOption(page, t.hh, 'first');   // hour column comes first
    await page.waitForTimeout(400);
    await clickOption(page, t.mm, 'last');    // minute column comes second
    await page.waitForTimeout(400);
    await page.mouse.click(5, 5);
    if ((await box.inputValue()) !== t.hm24) throw new Error(`TikTok shows ${await box.inputValue()}`);
  });

  await step(`set the date to ${t.ymd}`, async () => {
    const box = await findInput(page, /^\d{4}-\d{2}-\d{2}$/);
    if ((await box.inputValue()) === t.ymd) return;
    await box.click();
    await page.waitForTimeout(600);
    for (let i = 0; i < 2; i++) {
      const days = page.getByText(String(t.day), { exact: true }).filter({ visible: true });
      const n = await days.count();
      for (let k = 0; k < n && (await box.inputValue()) !== t.ymd; k++) {
        await days.nth(k).click().catch(() => {});
        await page.waitForTimeout(400);
        if ((await box.inputValue()) !== t.ymd) await box.click().catch(() => {});
      }
      if ((await box.inputValue()) === t.ymd) break;
      // Maybe next month: try the calendar's "next" arrow once.
      await page.locator('[class*="arrow"]:visible, [class*="next"]:visible').last().click().catch(() => {});
      await page.waitForTimeout(400);
    }
    await page.mouse.click(5, 5);
    if ((await box.inputValue()) !== t.ymd) throw new Error(`TikTok shows ${await box.inputValue()}`);
  });

  const postBtn = page.locator('button[data-e2e="post_video_button"]').or(page.getByRole('button', { name: /^schedule$/i })).last();
  console.log('   … waiting for the upload to finish');
  await step('wait for the upload to finish', async () => {
    await postBtn.waitFor({ timeout: 60_000 });
    for (let i = 0; i < 600 && !(await postBtn.isEnabled()); i++) await page.waitForTimeout(3000);
    if (!(await postBtn.isEnabled())) throw new Error('the Schedule button never became active');
  });

  console.log(`\n   TikTok is filled in for Episode ${ep.ep}: ${t.label} (your PC's time).`);
  console.log(`   Optional by hand: cover with text "${tk.coverText}".`);
  if (manual.length) console.log(`   Do these by hand first: ${manual.join('; ')}.`);
  let answer = '';
  if (!auto || manual.length) {
    answer = (await ask('   Check the TikTok tab. Press Enter to click Schedule, type "d" if you clicked it yourself, or "s" to skip: ')).toLowerCase();
    if (answer === 's') { await page.close().catch(() => {}); return { status: 'skipped' }; }
  }
  if (answer !== 'd') {
    await postBtn.click({ timeout: 15_000 });
    // TikTok sometimes asks to confirm (for example while its content check runs).
    const confirm = page.getByRole('dialog').getByRole('button', { name: /schedule|post now|continue/i }).first();
    if (await confirm.isVisible({ timeout: 4_000 }).catch(() => false)) await confirm.click();
  }
  await page.waitForURL(/tiktokstudio\/content|manage/, { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.close().catch(() => {});
  return { status: 'scheduled', for: tk.publishAt };
}
