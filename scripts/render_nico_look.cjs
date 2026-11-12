// TRANSFERS: render Nico v1 look-test stills (PS1 pipeline) into assets3d/characters/nico/look-v1/.
//   node scripts/render_nico_look.cjs
const fs = require('node:fs'), path = require('node:path');
const {bundle} = require('@remotion/bundler');
const {selectComposition, renderStill, openBrowser} = require('@remotion/renderer');
const root = path.resolve(__dirname, '..');
const pick = () => {
	const c = [process.env.REMOTION_BROWSER, '/usr/bin/chromium', ...(fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium_headless_shell')).map((d) => {
		const sub = fs.readdirSync(path.join('/opt/pw-browsers', d)).find((s) => s.startsWith('chrome-headless-shell'));
		return sub && path.join('/opt/pw-browsers', d, sub, 'chrome-headless-shell');
	}) : [])].filter(Boolean);
	return c.find((p) => fs.existsSync(p));
};
const SHOTS = [
	['lineup', 480, 'neutral'], ['lineup', 640, 'neutral'],
	['closeup', 480, 'neutral'], ['closeup', 480, 'fear'], ['closeup', 640, 'fear'], ['closeup', 480, 'focused'],
];
(async () => {
	const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), rootDir: root});
	const browser = await openBrowser('chrome', {browserExecutable: pick(), chromiumOptions: {gl: 'swangle'}});
	const dest = path.join(root, 'assets3d/characters/nico/look-v1');
	fs.mkdirSync(dest, {recursive: true});
	try {
		// warm-up: the first WebGL still in a fresh browser can come out black, so render one and discard it
		for (const [shot, lw, expression] of [SHOTS[0], ...SHOTS]) {
			const inputProps = {shot, lw, expression};
			const composition = await selectComposition({serveUrl, id: 'NicoLook', inputProps, puppeteerInstance: browser});
			const t = Date.now();
			const file = `nico-${shot}-${expression}-${lw}x${Math.round(lw * 9 / 16)}.png`;
			await renderStill({serveUrl, composition, inputProps, frame: 0, output: path.join(dest, file), puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}, logLevel: 'error', timeoutInMilliseconds: 120000});
			if (!fs.existsSync(path.join(dest, '.warm'))) { fs.writeFileSync(path.join(dest, '.warm'), ''); continue; }
			console.log('saved', file, ((Date.now() - t) / 1000).toFixed(1) + 's');
		}
	} finally {
		fs.rmSync(path.join(dest, '.warm'), {force: true});
		await browser.close({silent: true});
		fs.rmSync(serveUrl, {recursive: true, force: true});
	}
})().catch((e) => { console.error(e); process.exit(1); });
