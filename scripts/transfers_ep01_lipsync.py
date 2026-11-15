"""TRANSFERS Ep1 (PSX draft): PS1-style lip flap. For each dialogue cue in the draft mix
(public/assets/audio/transfers/ep01-mix/cues.json), mark the 30 fps frames where the speaker's
mouth is open, from the line's loudness envelope. Output: src/horror/transfers/ep01/lipsync.json
  {speaker: [[startFrame, endFrame], ...]}   (open intervals, end exclusive)
"""
import json
import subprocess
import numpy as np

FPS = 30
SR = 16000
cues = json.load(open('public/assets/audio/transfers/ep01-mix/cues.json'))
lines = {f"l{l['n']:02d}": l for l in json.load(open('public/assets/audio/transfers/ep01-dialogue/lines.json'))['lines']}
out = {}
for c in cues:
	if c['layer'] != 'dlg':
		continue
	lid, who = c['note'].split()[:2]
	path = 'public/assets/audio/transfers/ep01-dialogue/' + lines[lid]['file']
	raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
	x = np.frombuffer(raw, np.int16).astype(float) / 32768
	hop = SR // FPS
	n = len(x) // hop
	rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
	thr = max(rms.max() * 0.22, 0.008)
	open_ = rms > thr
	# PS1 flap: hold each state at least 2 frames, and close briefly inside long vowels every 5 frames
	f0 = int(round(c['t'] * FPS))
	spans, i = [], 0
	while i < n:
		if open_[i]:
			j = i
			while j < n and open_[j]:
				j += 1
			k = i
			while k < j:
				e = min(j, k + 4)
				if e - k >= 2:
					spans.append([f0 + k, f0 + e])
				k = e + 1
			i = j
		else:
			i += 1
	out.setdefault(who, []).extend(spans)
json.dump(out, open('src/horror/transfers/ep01/lipsync.json', 'w'), separators=(',', ':'))
print({k: len(v) for k, v in out.items()})
