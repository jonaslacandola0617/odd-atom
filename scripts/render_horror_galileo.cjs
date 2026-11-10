// Render stills or the final MP4 for HorrorGalileoTape (analog-horror PS1 style test).
//   node scripts/render_horror_galileo.cjs --stills [--frames 30,120]
//   node scripts/render_horror_galileo.cjs
const fs = require('node:fs'), path = require('node:path');
const {bundle} = require('@remotion/bundler');
const {selectComposition, renderStill, renderMedia, openBrowser} = require('@remotion/renderer');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const v3 = false;
const id = 'HorrorGalileoTape';
const tag = 'horror-galileo-v1';
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
	const inputProps = {includeAudio: !stills};
	try {
		const composition = await selectComposition({serveUrl, id, inputProps, puppeteerInstance: browser});
		const outDir = path.join(root, 'out/oddatom', tag);
		fs.mkdirSync(outDir, {recursive: true});
		if (stills) {
			const i = process.argv.indexOf('--frames');
			const frames = i >= 0 ? process.argv[i + 1].split(',').map(Number) : [20, 75, 130, 165, 200, 240, 280, 300, 340, 380, 425, 450, 500, 540, 560, 620, 690];
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
		const dest = path.join(root, 'assets/videos/horror-galileo-v1');
		fs.mkdirSync(dest, {recursive: true});
		const normalize = 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p';
		execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-vf', normalize, '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-c:a', 'copy', '-movflags', '+faststart', path.join(dest, 'galileo-tape-24s.mp4')], {stdio: 'inherit'});
		await renderStill({serveUrl, composition, inputProps: {includeAudio: false}, frame: 470, output: path.join(dest, 'galileo-tape-24s-poster.png'), puppeteerInstance: browser, logLevel: 'error'});
		console.log('saved', dest);
	} finally {
		await browser.close({silent: true});
	}
})().catch((e) => { console.error(e); process.exit(1); });
