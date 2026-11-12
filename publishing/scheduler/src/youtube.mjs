// Schedules one Short in YouTube Studio (studio.youtube.com) through the
// normal upload dialog. Every step falls back to "please do it by hand" if
// YouTube has changed its page, and nothing is published until Schedule is
// clicked (by you in review mode, or by the script with --auto).
import { ask, localTime, norm, replaceText, stepper } from './util.mjs';

export async function scheduleYouTube(context, ep, file, { auto }) {
  const y = ep.youtube;
  const t = localTime(y.publishAt);
  const page = await context.newPage();
  await page.bringToFront();
  const { step, manual } = stepper('YouTube');

  await page.goto('https://www.youtube.com/upload', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForLoadState('load', { timeout: 30_000 }).catch(() => {});
  if (/accounts\.google\.com|ServiceLogin/.test(page.url())) {
    throw new Error('Not signed in to YouTube. Run 2-LOGIN.bat (npm run login) first.');
  }

  const input = page.locator('input[type="file"]').first();
  await input.waitFor({ state: 'attached', timeout: 90_000 });
  await input.setInputFiles(file);
  console.log('   ✓ uploading the video');

  const title = page.locator('#title-textarea #textbox');
  await title.waitFor({ timeout: 180_000 });

  await step('set the title', async () => {
    await replaceText(page, title, y.title);
    if (norm(await title.innerText()) !== norm(y.title)) throw new Error('title text did not match');
  });

  await step('set the description', async () => {
    const box = page.locator('#description-textarea #textbox');
    await replaceText(page, box, y.description);
    if (!norm(await box.innerText()).startsWith(norm(y.description).slice(0, 40))) throw new Error('description did not match');
  });

  if (y.playlist) {
    await step(`add it to the playlist "${y.playlist}"`, async () => {
      await page.locator('ytcp-video-metadata-playlists ytcp-dropdown-trigger, ytcp-video-metadata-playlists .dropdown').first().click({ timeout: 10_000 });
      const dialog = page.locator('ytcp-playlist-dialog');
      await dialog.waitFor({ timeout: 10_000 });
      const item = dialog.locator('label, ytcp-ve, li', { hasText: y.playlist }).first();
      if (!(await item.count())) {
        await dialog.getByRole('button', { name: /done|close/i }).first().click().catch(() => page.keyboard.press('Escape'));
        throw new Error('no playlist with that name yet (create it once in YouTube Studio)');
      }
      const box = item.locator('[role="checkbox"], #checkbox').first();
      const checked = (await box.getAttribute('aria-checked').catch(() => null)) === 'true';
      if (!checked) await item.click();
      await dialog.getByRole('button', { name: /done/i }).first().click();
    });
  }

  await step('choose "No, it\'s not made for kids"', async () => {
    const r = page.locator('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]');
    if (await r.count()) await r.click();
    else await page.getByRole('radio', { name: /not made for kids/i }).click({ timeout: 10_000 });
  });

  await step('open "Show more"', async () => {
    const b = page.locator('#toggle-button').first();
    if (await b.isVisible()) await b.click();
    else await page.getByRole('button', { name: /show more|show advanced/i }).first().click({ timeout: 10_000 });
  });

  const altered = y.alteredContent ?? false;
  await step(`set "Altered content" to ${altered ? 'Yes' : 'No'}`, async () => {
    const r = page.locator(`tp-yt-paper-radio-button[name="VIDEO_HAS_ALTERED_CONTENT_${altered ? 'YES' : 'NO'}"]`);
    await r.first().click({ timeout: 10_000 });
  });

  if (y.tags?.length) {
    await step('add the tags', async () => {
      const box = page.locator('#tags-container input, input[aria-label="Tags"]').first();
      await box.click({ timeout: 10_000 });
      await page.keyboard.insertText(y.tags.join(',') + ',');
    });
  }

  await step('go to the Visibility page', async () => {
    for (let i = 0; i < 3; i++) {
      await page.locator('#next-button').click({ timeout: 15_000 });
      await page.waitForTimeout(1500);
    }
    await page.locator('#second-container-expand-button, #schedule-radio-button, #datepicker-trigger').first().waitFor({ timeout: 15_000 });
  });

  await step(`set the schedule to ${t.usDate}, ${t.time12} (your PC's time zone)`, async () => {
    const expand = page.locator('#second-container-expand-button');
    if (await expand.isVisible().catch(() => false)) await expand.click();
    await page.locator('#datepicker-trigger').click({ timeout: 10_000 });
    const dateBox = page.locator('ytcp-date-picker tp-yt-paper-input input, ytcp-date-picker input').first();
    await dateBox.fill(t.usDate, { timeout: 10_000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    const timeBox = page.locator('#time-of-day-container input, #time-of-day-trigger input').first();
    await timeBox.click({ timeout: 10_000 });
    await timeBox.fill(t.time12);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    const shownDate = norm(await page.locator('#datepicker-trigger').innerText());
    const shownTime = norm(await timeBox.inputValue());
    if (!shownDate.includes(t.usDate) || shownTime.toUpperCase() !== t.time12) {
      throw new Error(`Studio shows "${shownDate} ${shownTime}"`);
    }
  });

  console.log('   … waiting for the upload to finish');
  await step('wait for the upload to finish', async () => {
    await page.waitForFunction(() => {
      const el = document.querySelector('ytcp-video-upload-progress');
      const txt = el ? el.innerText : '';
      return !/Uploading|%/i.test(txt);
    }, null, { timeout: 30 * 60_000, polling: 3000 });
  });

  console.log(`\n   YouTube is filled in for Episode ${ep.ep}: ${t.label} (your PC's time).`);
  if (manual.length) console.log(`   Do these by hand first: ${manual.join('; ')}.`);
  let answer = '';
  if (!auto || manual.length) {
    answer = (await ask('   Check the YouTube tab. Press Enter to click Schedule, type "d" if you clicked it yourself, or "s" to skip: ')).toLowerCase();
    if (answer === 's') { await page.close().catch(() => {}); return { status: 'skipped' }; }
  }
  if (answer !== 'd') await page.locator('#done-button').click({ timeout: 15_000 });

  let url = null;
  try {
    const share = page.locator('ytcp-video-share-dialog, ytcp-uploads-still-processing-dialog').first();
    await share.waitFor({ timeout: 60_000 });
    url = await page.locator('a[href*="youtu.be"], a[href*="/shorts/"], a[href*="watch?v="]').first().getAttribute('href', { timeout: 10_000 });
  } catch { /* the link is optional */ }
  await page.locator('#close-button').first().click({ timeout: 5_000 }).catch(() => page.keyboard.press('Escape'));
  await page.waitForTimeout(1500);
  await page.close().catch(() => {});
  return { status: 'scheduled', url, for: y.publishAt };
}
