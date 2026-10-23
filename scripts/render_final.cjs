const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const profile = process.argv[2] || 'star';
const profiles = {star: {composition: 'StarBalance', output: 'star-balance-20s'}, crowd: {composition: 'AloneInACrowd', output: 'alone-in-a-crowd-20s'}};
if (!Object.hasOwn(profiles, profile)) {console.error('Choose a known render profile: star or crowd.'); process.exit(1);}
const target = profiles[profile];
const narration = JSON.parse(fs.readFileSync(path.join(root, `src/data/${profile}-narration.json`), 'utf8'));
if (narration.provider !== 'elevenlabs' || narration.status !== 'generated' || !narration.audioFile || !fs.existsSync(path.join(root, 'public', narration.audioFile))) {
  console.error(`Final render blocked: ElevenLabs narration is missing. Configure the secure API key and network access, then run npm run ${profile === 'crowd' ? 'narrate:crowd' : 'narrate'}. Unvoiced preview compositions are for visual review only.`);
  process.exit(1);
}
const temporary = path.join(root, 'out');
fs.mkdirSync(temporary, {recursive: true});
const rendered = path.join(temporary, `${target.output}.render.mp4`);
const candidate = path.join(temporary, `${target.output}.delivery.mp4`);
const result = spawnSync(path.join(root, 'node_modules/.bin/remotion'), ['render', 'src/index.ts', target.composition, rendered, '--browser-executable=/usr/bin/chromium', '--concurrency=3', '--crf=16', '--pixel-format=yuv420p'], {cwd: root, stdio: 'inherit'});
if (result.status !== 0) process.exit(result.status ?? 1);
// Mix original PCM stems once, preserving picture and exact audio/video timing.
const audio = path.join(root, 'public/assets/audio', profile === 'star' ? 'star-balance' : 'crowd');
const remuxed = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', rendered,
  '-i', path.join(audio, 'music.wav'), '-i', path.join(audio, 'sfx.wav'), '-i', path.join(root, 'public', narration.audioFile),
  '-filter_complex', '[1:a][2:a][3:a]amix=inputs=3:normalize=0,atrim=duration=20[a]',
  '-map', '0:v:0', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-t', '20', '-movflags', '+faststart', candidate], {stdio: 'inherit'});
if (remuxed.status !== 0) process.exit(remuxed.status ?? 1);
fs.mkdirSync(path.join(root, 'assets/videos'), {recursive: true});
fs.renameSync(candidate, path.join(root, `assets/videos/${target.output}.mp4`));
console.log(`Saved ${target.output}.mp4 with 20-second container timing and fast-start metadata.`);
