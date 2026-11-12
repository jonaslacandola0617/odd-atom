// TRANSFERS 20 s acting test.
//   node scripts/render_transfers_test.cjs --stills 0,60,120,200,330,400,480,560   (review frames into the scratch dir given by --out)
//   node scripts/render_transfers_test.cjs                                          (full render, picture only; audio is muxed by the sound script)
const fs = require('node:fs'), path = require('node:path');
const {bundle} = require('@remotion/bundler');
const {selectComposition, renderStill, renderMedia, openBrowser} = require('@remotion/renderer');
const root = path.resolve(__dirname, '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
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
	const inputProps = {withAudio: false};
	try {
		const composition = await selectComposition({serveUrl, id: 'TransfersActingTest', inputProps, puppeteerInstance: browser});
		const stills = arg('--stills');
		if (stills) {
			const out = arg('--out'); fs.mkdirSync(out, {recursive: true});
			const frames = stills.split(',').map(Number);
			for (const frame of [frames[0], ...frames]) {   // first still is a discarded warm-up
				const t = Date.now();
				await renderStill({serveUrl, composition, inputProps, frame, output: path.join(out, `f${String(frame).padStart(4, '0')}.png`), puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}, logLevel: 'error', timeoutInMilliseconds: 120000});
				console.log('still', frame, ((Date.now() - t) / 1000).toFixed(1) + 's');
			}
		} else {
			const out = arg('--out') || path.join(root, 'assets/videos/transfers-acting-test-v1/picture.mp4');
			fs.mkdirSync(path.dirname(out), {recursive: true});
			const t = Date.now();
			await renderMedia({serveUrl, composition, inputProps, codec: 'h264', crf: 16, pixelFormat: 'yuv420p', muted: true, outputLocation: out, puppeteerInstance: browser, concurrency: 3, chromiumOptions: {gl: 'swangle'}, logLevel: 'error', timeoutInMilliseconds: 120000});
			console.log('rendered', out, ((Date.now() - t) / 1000).toFixed(0) + 's');
		}
	} finally {
		await browser.close({silent: true});
		fs.rmSync(serveUrl, {recursive: true, force: true});
	}
})().catch((e) => { console.error(e); process.exit(1); });
