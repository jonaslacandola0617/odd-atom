// Render stills or the final MP4 for the Episode 4 "Rules for the Night Shift" (v1).
//   node scripts/render_ep04.cjs --stills [--frames 30,120]
//   node scripts/render_ep04.cjs [--audio-only-remux]
const fs = require('node:fs'), path = require('node:path');
const {bundle} = require('@remotion/bundler');
const {selectComposition, renderStill, renderMedia, openBrowser} = require('@remotion/renderer');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const id = 'Ep04RulesForTheNightShift';
const tag = 'ep04-night-v1';
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
	const stills = process.argv.includes('--stills');
	const inputProps = {includeAudio: !stills, captions: true};
	try {
		const composition = await selectComposition({serveUrl, id, inputProps, puppeteerInstance: browser});
		const outDir = path.join(root, 'out/oddatom', tag);
		fs.mkdirSync(outDir, {recursive: true});
		if (stills) {
			const i = process.argv.indexOf('--frames');
			const frames = i >= 0 ? process.argv[i + 1].split(',').map(Number) : [0, 160, 250, 320, 400, 470, 540, 640, 770, 820, 900, 980, 1080, 1180, 1260, 1290, 1400, 1520, 1570, 1640, 1662];
			for (const frame of frames) {
				await renderStill({serveUrl, composition, inputProps, frame, output: path.join(outDir, `f${String(frame).padStart(3, '0')}.png`), puppeteerInstance: browser, logLevel: 'error'});
				console.log('still', frame);
			}
			return;
		}
		const tmp = path.join(outDir, 'render.mp4');
		let mark = -1;
		await renderMedia({serveUrl, composition, inputProps, codec: 'h264', pixelFormat: 'yuv420p', crf: 16, audioBitrate: '192k', outputLocation: tmp, puppeteerInstance: browser, concurrency: 3, chromiumOptions: {gl: 'swangle'}, logLevel: 'error',
			onProgress: ({renderedFrames}) => { const n = Math.floor(renderedFrames / 100); if (n !== mark) { mark = n; console.log('rendered', renderedFrames, '/', composition.durationInFrames); } }});
		const dest = path.join(root, 'assets/videos/ep04-night-v1');
		fs.mkdirSync(dest, {recursive: true});
		const normalize = 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p';
		// Two-pass 6.2 Mbit/s: the full-screen static and tape noise made CRF 22 come out at 148 MB
		// (over GitHub's 100 MB file limit); two-pass lands around 46 MB.
		const enc = ['-vf', normalize, '-c:v', 'libx264', '-preset', 'slow', '-b:v', '6200k', '-maxrate', '9000k', '-bufsize', '12000k', '-tune', 'grain', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-passlogfile', path.join(outDir, 'p2')];
		execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, ...enc, '-pass', '1', '-an', '-f', 'mp4', '/dev/null'], {stdio: 'inherit'});
		execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, ...enc, '-pass', '2', '-c:a', 'copy', '-movflags', '+faststart', path.join(dest, 'ep04-rules-for-the-night-shift.mp4')], {stdio: 'inherit'});
		await renderStill({serveUrl, composition, inputProps: {includeAudio: false, captions: false}, frame: 1330, output: path.join(dest, 'ep04-rules-for-the-night-shift-poster.png'), puppeteerInstance: browser, logLevel: 'error'});
		console.log('saved', dest);
	} finally {
		await browser.close({silent: true});
	}
})().catch((e) => { console.error(e); process.exit(1); });
