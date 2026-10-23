"""Generate the required ElevenLabs narration through the configured HTTPS route.

API key: ELEVENLABS_API_KEY in environment settings. Optional ELEVENLABS_VOICE_ID.
No keys are printed, saved, or passed on a command line. Requires Python 3 and FFmpeg.
"""
import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'src/data/star-narration.json'
DEST = ROOT / 'public/assets/audio/star-balance/narration.wav'

def main():
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        sys.exit('ElevenLabs narration is blocked: add ELEVENLABS_API_KEY securely in environment settings. No alternative narrator was used.')
    data = json.loads(MANIFEST.read_text())
    voice = os.environ.get('ELEVENLABS_VOICE_ID', data['voiceId'])
    if not voice.isalnum():
        sys.exit('ELEVENLABS_VOICE_ID must be an ElevenLabs voice identifier.')
    payload = {
        'text': data['script'], 'model_id': data['modelId'],
        'voice_settings': {'stability': .55, 'similarity_boost': .75, 'style': .08, 'use_speaker_boost': True, 'speed': 1.04},
    }
    request = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128',
        data=json.dumps(payload).encode(),
        headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        sys.exit(f'ElevenLabs returned HTTP {error.code}. Check API access, the secure key binding, and account permissions. No narration file was replaced.')
    except urllib.error.URLError:
        sys.exit('Cannot reach ElevenLabs through the configured network route. No narration file was replaced.')
    alignment = result.get('normalized_alignment') or result.get('alignment')
    if not alignment or not result.get('audio_base64'):
        sys.exit('ElevenLabs response did not include audio and alignment. No narration file was replaced.')
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / 'speech.mp3'
        raw.write_bytes(base64.b64decode(result['audio_base64'], validate=True))
        duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', str(raw)], text=True))
        factor = max(1., duration / 19.45)
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
            boundary = char in '.!?,;' or (char.isspace() and words >= 6) or i == len(chars) - 1
            if boundary and text.strip() and phrase_start is not None:
                captions.append({'start': round(phrase_start, 3), 'end': round(min(19.95, ends[i] / factor + .27), 3), 'text': text.strip()})
                text, phrase_start, words = '', None, 0
        aligned_text = ''.join(alignment['characters']).lower()
        beats = {}
        for name, phrase in [('gravity', 'gravity squeezes'), ('fusion', 'deep inside'), ('energy', 'that energy'), ('balance', 'for most')]:
            index = aligned_text.find(phrase)
            if index < 0:
                sys.exit('Narration alignment did not contain an expected story beat; no final file was replaced.')
            beats[name] = round(alignment['character_start_times_seconds'][index] / factor + .15, 4)
        if not 0 < beats['gravity'] < beats['fusion'] < beats['energy'] < beats['balance'] < 19.9:
            sys.exit('Story beat alignment was not valid for this segment; no final file was replaced.')
        DEST.parent.mkdir(parents=True, exist_ok=True)
        DEST.write_bytes(fitted.read_bytes())
    data.update({'status': 'generated', 'audioFile': 'assets/audio/star-balance/narration.wav', 'voiceId': voice, 'captions': captions, 'beats': beats, 'timingSource': 'ElevenLabs character alignment', 'speedAdjustment': round(factor, 6)})
    MANIFEST.write_text(json.dumps(data, indent=2) + '\n')
    print('Saved ElevenLabs narration and aligned captions. Ready for the narrated composition.')

if __name__ == '__main__':
    main()
