"""Process the timestamped ElevenLabs response supplied by the official JS SDK.

Run npm run narrate, not this internal processor directly. No API key is read here.
Requires Python 3 and FFmpeg.
"""
import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]

def main():
    if len(sys.argv) != 3 or sys.argv[2] not in ('star', 'crowd', 'crowd-motion'):
        sys.exit('Use npm run narrate to generate speech with the ElevenLabs SDK.')
    profile = sys.argv[2]
    manifest = ROOT / f'src/data/{profile}-narration.json'
    audio_dir = 'star-balance' if profile == 'star' else profile
    audio_file = f'assets/audio/{audio_dir}/narration.wav'
    destination = ROOT / 'public' / audio_file
    data = json.loads(manifest.read_text())
    voice = os.environ.get('ELEVENLABS_VOICE_ID', data['voiceId'])
    if not voice.isalnum():
        sys.exit('ELEVENLABS_VOICE_ID must be an ElevenLabs voice identifier.')
    result = json.loads(Path(sys.argv[1]).read_text())
    alignment = result.get('normalized_alignment') or result.get('alignment')
    if not alignment or not result.get('audio_base64'):
        sys.exit('ElevenLabs response did not include audio and alignment. No narration file was replaced.')
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / 'speech.mp3'
        raw.write_bytes(base64.b64decode(result['audio_base64'], validate=True))
        duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', str(raw)], text=True))
        factor = 1.0 if data.get('preserveNativeTiming') else max(.9, duration / 19.0)
        if data.get('preserveNativeTiming') and duration > 19.3:
            sys.exit('Native narration exceeds the performance window; revise the voice settings. No file replaced.')
        if factor > 1.15:
            sys.exit('Narration is too long for a natural 20-second read. Revise the script or voice speed and generate again; no final file was replaced.')
        fitted = Path(tmp) / 'narration.wav'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-af', f'atempo={factor:.8f},adelay=150|150,apad,loudnorm=I=-16:TP=-2:LRA=7', '-t', '20', '-ar', '48000', '-ac', '2', str(fitted)], check=True)
        captions = []
        chars = alignment['characters']
        starts = alignment['character_start_times_seconds']
        ends = alignment['character_end_times_seconds']
        text, phrase_start, words = '', None, 0
        for i, char in enumerate(chars):
            if phrase_start is None and not char.isspace():
                phrase_start = starts[i] / factor + .15
            text += char
            if char.isspace() and text.strip():
                words += 1
            boundary = char in '.!?;' or (char.isspace() and words >= 6) or i == len(chars) - 1
            if boundary and text.strip() and phrase_start is not None:
                captions.append({'start': round(phrase_start, 3), 'end': round(min(19.95, ends[i] / factor + .27), 3), 'text': text.strip()})
                text, phrase_start, words = '', None, 0
        for current, following in zip(captions, captions[1:]):
            current['end'] = min(current['end'], following['start'])
        aligned_text = ''.join(alignment['characters']).lower()
        beats = {}
        phrases = data.get('beatPhrases', {'gravity': 'gravity squeezes', 'fusion': 'deep inside', 'energy': 'that energy', 'balance': 'for most'})
        for name, phrase in phrases.items():
            index = aligned_text.find(phrase)
            if index < 0:
                sys.exit('Narration alignment did not contain an expected story beat; no final file was replaced.')
            beats[name] = round(alignment['character_start_times_seconds'][index] / factor + .15, 4)
        ordered = list(beats.values())
        if not ordered or not 0 < ordered[0] or not ordered[-1] < 19.9 or any(a >= b for a, b in zip(ordered, ordered[1:])):
            sys.exit('Story beat alignment was not valid for this segment; no final file was replaced.')
        # Extend sentence gaps without changing the speed of spoken phonemes.
        pauses = data.get('performancePauses', [])
        cuts = sorted((beats[p['beforeBeat']] - .1, p['seconds']) for p in pauses)
        if cuts:
            with wave.open(str(fitted)) as file:
                params = file.getparams()
                samples = file.readframes(file.getnframes())
            stride = params.nchannels * params.sampwidth
            chunks, last = [], 0
            for cut, seconds in cuts:
                index = round(cut * params.framerate) * stride
                chunks.extend([samples[last:index], bytes(round(seconds * params.framerate) * stride)])
                last = index
            chunks.append(samples[last:])
            with wave.open(str(fitted), 'wb') as file:
                file.setparams(params)
                file.writeframes(b''.join(chunks)[:20 * params.framerate * stride])
            def shifted(time):
                return round(time + sum(seconds for cut, seconds in cuts if time >= cut), 4)
            for caption in captions:
                caption.update(start=shifted(caption['start']), end=shifted(caption['end']))
            beats = {name: shifted(time) for name, time in beats.items()}
            if captions[-1]['end'] > 19.8:
                sys.exit('Edited performance exceeds the ending hold; no final file replaced.')
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(fitted.read_bytes())
    data.update({'status': 'generated', 'audioFile': audio_file, 'voiceId': voice, 'captions': captions, 'beats': beats, 'timingSource': 'ElevenLabs character alignment', 'speedAdjustment': round(factor, 6)})
    manifest.write_text(json.dumps(data, indent=2) + '\n')
    print('Saved ElevenLabs narration and aligned captions. Ready for the narrated composition.')

if __name__ == '__main__':
    main()
