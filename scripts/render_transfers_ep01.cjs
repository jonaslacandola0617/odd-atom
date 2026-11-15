// TRANSFERS Episode 1, PSX draft: review stills and the full render.
//   node scripts/render_transfers_ep01.cjs --stills 2,20,45,...     (seconds)  -> assets3d/psx-local/ep01/stills/
//   node scripts/render_transfers_ep01.cjs --full [--chunk 60]                  -> assets3d/psx-local/ep01/ (silent chunks + joined)
// The picture is rendered muted; the draft mix is muxed afterwards with ffmpeg (-c:v copy).
const fs = require('node:fs'), path = require('node:path'), {execFileSync} = require('node:child_process');
const {bundle} = require('@remotion/bundler');
const {selectComposition, renderStill, renderMedia, openBrowser} = require('@remotion/renderer');
const root = path.resolve(__dirname, '..');
const pick = () => {
	const c = [process.env.REMOTION_BROWSER, '/usr/bin/chromium', ...(fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium_headless_shell')).map((d) => {
		const sub = fs.readdirSync(path.join('/opt/pw-browsers', d)).find((s) => s.startsWith('chrome-headless-shell'));
		return sub && path.join('/opt/pw-browsers', d, sub, 'chrome-headless-shell');
	}) : [])].filter(Boolean);
	return c.find((p) => fs.existsSync(p));
};
const argv = process.argv;
const val = (k) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : null; };
const OUT = path.join(root, 'assets3d/psx-local/ep01');
const FPS = 30;
(async () => {
	fs.mkdirSync(path.join(OUT, 'stills'), {recursive: true});
	const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), rootDir: root});
	const browser = await openBrowser('chrome', {browserExecutable: pick(), chromiumOptions: {gl: 'swangle'}});
	const inputProps = {audio: false};
	try {
		const composition = await selectComposition({serveUrl, id: 'TransfersEp01', inputProps, puppeteerInstance: browser});
		if (val('--stills')) {
			const ts = val('--stills').split(',').map(Number);
			await renderStill({serveUrl, composition, inputProps, frame: Math.round(ts[0] * FPS), output: path.join(OUT, 'stills', '.warm.png'), puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}, logLevel: 'error', timeoutInMilliseconds: 180000});
			for (const t of ts) {
				const t0 = Date.now();
				const name = `ep01-${t.toFixed(1).padStart(5, '0')}s.png`;
				await renderStill({serveUrl, composition, inputProps, frame: Math.round(t * FPS), output: path.join(OUT, 'stills', name), puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}, logLevel: 'error', timeoutInMilliseconds: 180000});
				console.log('still', name, ((Date.now() - t0) / 1000).toFixed(1) + 's');
			}
			fs.rmSync(path.join(OUT, 'stills', '.warm.png'), {force: true});
		}
		if (argv.includes('--full')) {
			const chunk = Number(val('--chunk') || 60) * FPS;
			const parts = [];
			const startAt = Number(val('--from') || 0) * FPS;
			for (let f0 = startAt; f0 < composition.durationInFrames; f0 += chunk) {
				const f1 = Math.min(composition.durationInFrames, f0 + chunk) - 1;
				const out = path.join(OUT, `part-${String(f0).padStart(5, '0')}.mp4`);
				parts.push(out);
				if (fs.existsSync(out) && !argv.includes('--force')) { console.log('skip', out); continue; }
				const t0 = Date.now();
				await renderMedia({serveUrl, composition, inputProps, codec: 'h264', crf: 16, frameRange: [f0, f1], outputLocation: out, puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}, concurrency: 2, muted: true, logLevel: 'error', timeoutInMilliseconds: 300000});
				console.log('part', f0, f1, ((Date.now() - t0) / 1000).toFixed(1) + 's');
			}
			const list = path.join(OUT, 'parts.txt');
			fs.writeFileSync(list, fs.readdirSync(OUT).filter((f) => /^part-\d+\.mp4$/.test(f)).sort().map((f) => `file '${path.join(OUT, f)}'`).join('\n'));
			execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(OUT, 'ep01-psx-draft-silent.mp4')]);
			console.log('joined');
		}
	} finally {
		await browser.close({silent: true});
		fs.rmSync(serveUrl, {recursive: true, force: true});
	}
})().catch((e) => { console.error(e); process.exit(1); });
