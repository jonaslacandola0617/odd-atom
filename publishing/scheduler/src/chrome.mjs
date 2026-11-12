// Opens your real Google Chrome with a separate "After Sign-Off" profile and
// connects to it. Chrome is started normally (no automation flags), so Google
// and TikTok sign-in work as usual; the script attaches over Chrome's local
// debugging port, which only this computer can reach.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';
import { sleep } from './util.mjs';

export const PROFILE_DIR = process.env.ASO_PROFILE_DIR || path.join(os.homedir(), 'AfterSignOff-Chrome-Profile');
const PORT = Number(process.env.ASO_DEBUG_PORT || 9333);

export function findChrome() {
  const env = process.env.CHROME_PATH;
  if (env && fs.existsSync(env)) return env;
  const c = [];
  if (process.platform === 'win32') {
    for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
      if (base) c.push(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    c.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser');
  }
  const found = c.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error('Google Chrome was not found. Install it from https://www.google.com/chrome/ or set CHROME_PATH to chrome.exe.');
  }
  return found;
}

async function debuggerUp() {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    return r.ok;
  } catch { return false; }
}

/** Start (or reuse) the After Sign-Off Chrome window and connect to it. */
export async function openChrome(urls = []) {
  if (!(await debuggerUp())) {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
    const exe = findChrome();
    const child = spawn(exe, [
      `--user-data-dir=${PROFILE_DIR}`,
      `--remote-debugging-port=${PORT}`,
      '--remote-debugging-address=127.0.0.1',
      '--no-first-run',
      '--no-default-browser-check',
      ...(process.env.ASO_EXTRA_ARGS ? process.env.ASO_EXTRA_ARGS.split(' ') : []),
      ...urls,
    ], { detached: true, stdio: 'ignore' });
    child.unref();
    for (let i = 0; i < 60 && !(await debuggerUp()); i++) await sleep(500);
    if (!(await debuggerUp())) {
      throw new Error('Chrome opened but did not accept the connection. Close every "After Sign-Off" Chrome window and try again.');
    }
    urls = [];
  }
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
  const context = browser.contexts()[0] ?? (await browser.newContext());
  for (const u of urls) {
    const p = await context.newPage();
    await p.goto(u).catch(() => {});
  }
  return { browser, context };
}
