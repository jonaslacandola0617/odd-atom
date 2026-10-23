import {ElevenLabsClient} from '@elevenlabs/elevenlabs-js';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const profiles = {star: 'star', crowd: 'crowd'};

async function main() {
  if (!process.env.ELEVENLABS_API_KEY) {
    console.error('ElevenLabs narration is blocked: add ELEVENLABS_API_KEY securely in environment settings. No alternative narrator was used.');
    return 1;
  }
  const profile = process.argv[2] || 'star';
  if (!Object.hasOwn(profiles, profile)) {
    console.error('Choose an existing narration profile: star or crowd.');
    return 1;
  }
  const data = JSON.parse(await readFile(path.join(root, `src/data/${profile}-narration.json`), 'utf8'));
  const voice = process.env.ELEVENLABS_VOICE_ID || data.voiceId;
  if (!/^[a-zA-Z0-9]+$/.test(voice)) {
    console.error('ELEVENLABS_VOICE_ID must be an ElevenLabs voice identifier.');
    return 1;
  }

  // This build-time client reads the secure environment binding automatically.
  // It is never imported into the Remotion browser bundle.
  const client = new ElevenLabsClient();
  let result;
  try {
    result = await client.textToSpeech.convertWithTimestamps(voice, {
      text: data.script,
      modelId: data.modelId,
      outputFormat: 'mp3_44100_128',
      voiceSettings: {
        stability: 0.55,
        similarityBoost: 0.75,
        style: 0.08,
        useSpeakerBoost: true,
        speed: 1.04,
      },
    }, {maxRetries: 0, timeoutInSeconds: 90});
  } catch (error) {
    // SDK error objects can include request headers. Never log the object/body.
    const status = Number(error.statusCode);
    const reason = status >= 100 && status <= 599 ? `HTTP ${status}` : 'network or service error';
    console.error(`ElevenLabs request failed (${reason}). Check the secure key, account permissions, and network access. No narration file was replaced.`);
    return 1;
  }

  const alignment = result.normalizedAlignment || result.alignment;
  if (!result.audioBase64 || !alignment) {
    console.error('ElevenLabs did not return audio and character alignment. No narration file was replaced.');
    return 1;
  }
  const temporary = await mkdtemp(path.join(tmpdir(), 'odd-atom-narration-'));
  try {
    const responsePath = path.join(temporary, 'response.json');
    // Only generated media/timestamps cross into the existing audio processor.
    await writeFile(responsePath, JSON.stringify({
      audio_base64: result.audioBase64,
      alignment: {
        characters: alignment.characters,
        character_start_times_seconds: alignment.characterStartTimesSeconds,
        character_end_times_seconds: alignment.characterEndTimesSeconds,
      },
    }), {mode: 0o600});
    const processed = spawnSync('python', [path.join(root, 'scripts/elevenlabs_narration.py'), responsePath, profile], {
      cwd: root,
      stdio: 'inherit',
    });
    if (processed.error) console.error('Could not start the Python audio processor. Check Python and FFmpeg installation.');
    return processed.status ?? 1;
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
}

try {
  process.exitCode = await main();
} catch {
  console.error('Narration setup failed. Check the script manifest and local file permissions.');
  process.exitCode = 1;
}
