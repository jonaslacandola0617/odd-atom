"""TRANSFERS PSX look test v1: a sound bed for the 13 s clip from the existing TRANSFERS libraries
(no new credits). Shop: rain on tin, the fan, the CRT whine. Tape: hiss, fluorescent hum, the
focus-hunt entity signature. Back on the doorway: the fan drops out, the rain thins, the CRT clicks off.

  python3 scripts/transfers_psx_test_sound.py <silent.mp4> <out.mp4>
"""
import subprocess
import sys

A = 'public/assets/audio/transfers/'
# (file, start s, end s, gain dB, fade in s, fade out s, offset into file s)
LAYERS = [
	('sfx-v2-long/rain-tin-loop20.mp3', 0.0, 6.5, -14, 0.0, 0.05, 0),
	('sfx-v2-long/fan-loop20.mp3', 0.0, 6.5, -20, 0.0, 0.05, 2),
	('sfx-v2-long/crt-idle-loop20.mp3', 0.0, 6.5, 2, 0.0, 0.05, 0),
	('sfx-v3/vhs-dropout-1.mp3', 6.45, 7.3, -10, 0.0, 0.2, 0),
	('sfx-v2-long/fluorescent-hum-loop20.mp3', 6.5, 9.5, -20, 0.0, 0.05, 0),
	('sfx-v2-long/tape-breath-long8.mp3', 6.5, 9.5, -16, 0.3, 0.05, 0),
	('sfx-v2-long/focus-hunt-long8.mp3', 7.1, 9.5, -6, 0.1, 0.05, 0),
	('sfx-v2-long/rain-tin-loop20.mp3', 9.5, 12.5, -18, 0.0, 2.6, 6),
	('sfx-v2-long/crt-idle-loop20.mp3', 9.5, 12.45, 4, 0.0, 0.02, 3),
	('sfx-v2-long/breath-nervous-long8.mp3', 5.2, 6.5, -18, 0.3, 0.05, 0),
	('sfx-v3/crt-off-1.mp3', 12.4, 13.0, -8, 0.0, 0.2, 0),
]


def main():
	silent, out = sys.argv[1], sys.argv[2]
	args = ['ffmpeg', '-y', '-v', 'error', '-i', silent]
	parts = []
	for i, (f, s, e, g, fi, fo, off) in enumerate(LAYERS):
		args += ['-i', A + f]
		d = e - s
		parts.append(f'[{i + 1}:a]atrim={off}:{off + d},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,'
			f'volume={g}dB,afade=t=in:d={fi or 0.005},afade=t=out:st={max(0, d - fo)}:d={fo},adelay={int(s * 1000)}|{int(s * 1000)}[l{i}]')
	n = len(LAYERS)
	mix = ''.join(f'[l{i}]' for i in range(n))
	fc = ';'.join(parts) + f';{mix}amix=inputs={n}:normalize=0,apad=whole_dur=13,atrim=0:13,loudnorm=I=-18:TP=-2:LRA=11[a]'
	args += ['-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', out]
	subprocess.run(args, check=True)


if __name__ == '__main__':
	main()
