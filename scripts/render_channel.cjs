// Render the channel identity stills ("After Sign-Off"): profile picture and YouTube banner.
//   node scripts/render_ep08.cjs --stills [--frames 30,120]
//   node scripts/render_ep08.cjs [--audio-only-remux]
const fs = require('node:fs'), path = require('node:path');
const {bundle} = require('@remotion/bundler');
const {selectComposition, renderStill, renderMedia, openBrowser} = require('@remotion/renderer');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const pick = () => {
	const c = [process.env.REMOTION_BROWSER, '/usr/bin/chromium', ...(fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium_headless_shell')).map((d) => {
		const sub = fs.readdirSync(path.join('/opt/pw-browsers', d)).find((s) => s.startsWith('chrome-headless-shell'));
		return sub && path.join('/opt/pw-browsers', d, sub, 'chrome-headless-shell');
	}) : [])].filter(Boolean);
	return c.find((p) => fs.existsSync(p));
};
(async () => {
	const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), rootDir: root});
	const browser = await openBrowser('chrome', {browserExecutable: pick(), chromiumOptions: {gl: 'swangle'}});
	const dest = path.join(root, 'assets/channel');
	fs.mkdirSync(dest, {recursive: true});
	try {
		for (const [id, file] of [['ChannelAvatar', 'after-sign-off-avatar-800.png'], ['ChannelBanner', 'after-sign-off-banner-2560x1440.png']]) {
			const composition = await selectComposition({serveUrl, id, inputProps: {}, puppeteerInstance: browser});
			await renderStill({serveUrl, composition, inputProps: {}, frame: 0, output: path.join(dest, file), puppeteerInstance: browser, logLevel: 'error'});
			console.log('saved', file);
		}
	} finally {
		await browser.close({silent: true});
	}
})().catch((e) => { console.error(e); process.exit(1); });
