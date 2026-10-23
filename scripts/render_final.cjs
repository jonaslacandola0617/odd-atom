const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const narration = JSON.parse(fs.readFileSync(path.join(root, 'src/data/star-narration.json'), 'utf8'));
if (narration.provider !== 'elevenlabs' || narration.status !== 'generated' || !narration.audioFile || !fs.existsSync(path.join(root, 'public', narration.audioFile))) {
  console.error('Final render blocked: ElevenLabs narration is missing. Configure the secure API key and network access, then run npm run narrate. npm run render:preview creates the explicitly unvoiced visual preview.');
  process.exit(1);
}
const result = spawnSync(path.join(root, 'node_modules/.bin/remotion'), ['render', 'src/index.ts', 'StarBalance', 'assets/videos/star-balance-20s.mp4', '--browser-executable=/usr/bin/chromium', '--concurrency=3', '--crf=16', '--pixel-format=yuv420p'], {cwd: root, stdio: 'inherit'});
process.exit(result.status ?? 1);
