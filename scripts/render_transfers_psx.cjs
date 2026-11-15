// TRANSFERS PSX look test: stills, character sheets and the 13 s clip, with render times.
// The scenes use the user's PSX packs (licences unconfirmed), so output goes to the git-ignored
// assets3d/psx-local/renders/ and is shared privately, not committed.
//   node scripts/render_transfers_psx.cjs [--stills] [--sheets] [--clip] [--only name]
const fs = require('node:fs'), path = require('node:path');
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
const arg = (k) => process.argv.includes(k);
const onlyI = process.argv.indexOf('--only');
const only = onlyI > 0 ? process.argv[onlyI + 1].split(',') : null;
const OUT = path.join(root, 'assets3d/psx-local/renders');
const STILLS = [
	['shop-wide', 'TransfersPsxStill', {shot: 'wide', f: 40}],
	['shop-nico-neutral', 'TransfersPsxStill', {shot: 'nico', f: 10}],
	['shop-nico-fear', 'TransfersPsxStill', {shot: 'nico', f: 85}],
	['shop-door', 'TransfersPsxStill', {shot: 'door', f: 80}],
	['tape-1991-wide', 'TransfersPsxStill', {shot: 'tape', f: 5}],
	['tape-1991-push', 'TransfersPsxStill', {shot: 'tape', f: 85}],
];
const SHEETS = [
	['sheet-turnaround', 'TransfersPsxSheet', {mode: 'turn'}],
	['sheet-before', 'TransfersPsxSheet', {mode: 'before'}],
	...['nico', 'bea'].flatMap((who) => ['neutral', 'focused', 'worried', 'fear', 'smile', 'sleepy', 'shh'].map((expr) => [`face-${who}-${expr}`, 'TransfersPsxSheet', {mode: 'faces', who, expr}])),
];
(async () => {
	fs.mkdirSync(OUT, {recursive: true});
	const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), rootDir: root});
	const browser = await openBrowser('chrome', {browserExecutable: pick(), chromiumOptions: {gl: 'swangle'}});
	const times = {};
	try {
		const jobs = [...(arg('--stills') ? STILLS : []), ...(arg('--sheets') ? SHEETS : [])].filter(([n]) => !only || only.includes(n));
		let warm = false;
		for (const [name, id, props] of jobs) {
			const composition = await selectComposition({serveUrl, id, inputProps: props, puppeteerInstance: browser});
			if (!warm) { // the first WebGL still in a fresh browser can come out black
				await renderStill({serveUrl, composition, inputProps: props, frame: 0, output: path.join(OUT, '.warm.png'), puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}, logLevel: 'error', timeoutInMilliseconds: 180000});
				warm = true;
			}
			const t = Date.now();
			await renderStill({serveUrl, composition, inputProps: props, frame: 0, output: path.join(OUT, name + '.png'), puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}, logLevel: 'error', timeoutInMilliseconds: 180000});
			times[name] = (Date.now() - t) / 1000;
			console.log('saved', name, times[name].toFixed(1) + 's');
		}
		if (arg('--clip')) {
			const composition = await selectComposition({serveUrl, id: 'TransfersPsxTest', inputProps: {}, puppeteerInstance: browser});
			const t = Date.now();
			await renderMedia({serveUrl, composition, codec: 'h264', crf: 16, outputLocation: path.join(OUT, 'transfers-psx-test-v1-silent.mp4'), puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}, concurrency: 2, logLevel: 'error', timeoutInMilliseconds: 240000, muted: true});
			times.clip = (Date.now() - t) / 1000;
			console.log('clip', times.clip.toFixed(1) + 's for', composition.durationInFrames, 'frames');
		}
	} finally {
		fs.rmSync(path.join(OUT, '.warm.png'), {force: true});
		fs.writeFileSync(path.join(OUT, 'times.json'), JSON.stringify(times, null, 1));
		await browser.close({silent: true});
		fs.rmSync(serveUrl, {recursive: true, force: true});
	}
})().catch((e) => { console.error(e); process.exit(1); });
