// PS1-era rendering helpers for the analog-horror style:
//   - vertex snapping to a coarse screen grid (the classic "wobble")
//   - 4x4 Bayer dither + colour quantisation at the end of every fragment shader
//   - nearest-filtered tiny procedural textures
import * as THREE from 'three';

export const LOW_W = 270;
export const LOW_H = 480;
const SNAP = 'vec2(110.0, 196.0)';

/** snap: screen grid for vertex wobble as a GLSL vec2 literal (coarser = more wobble). */
export const ps1 = <M extends THREE.Material>(m: M, levels = 24, snap = SNAP): M => {
	m.onBeforeCompile = (shader) => {
		shader.vertexShader = shader.vertexShader.replace(
			'#include <project_vertex>',
			`#include <project_vertex>
			vec4 sp = gl_Position; sp.xyz /= sp.w; sp.xy = floor(sp.xy * ${snap}) / ${snap}; sp.xyz *= sp.w; gl_Position = sp;`,
		);
		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <dithering_fragment>',
			`#include <dithering_fragment>
			{
				int bx = int(mod(gl_FragCoord.x, 4.0)); int by = int(mod(gl_FragCoord.y, 4.0));
				float bayer[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
				float d = (bayer[by * 4 + bx] / 16.0 - 0.5) / ${levels.toFixed(1)};
				gl_FragColor.rgb = floor((gl_FragColor.rgb + d) * ${levels.toFixed(1)} + 0.5) / ${levels.toFixed(1)};
			}`,
		);
	};
	m.needsUpdate = true;
	return m;
};

/** Deterministic PRNG so every render is identical. */
export const rng = (seed: number) => () => {
	seed = (seed * 1664525 + 1013904223) % 4294967296;
	return seed / 4294967296;
};

const nearest = (t: THREE.Texture) => {
	t.magFilter = THREE.NearestFilter;
	t.minFilter = THREE.NearestFilter;
	t.generateMipmaps = false;
	t.colorSpace = THREE.SRGBColorSpace;
	t.needsUpdate = true;
	return t;
};

/** 64x32 banded gas-giant texture with turbulence specks. */
export const jupiterTexture = () => {
	const w = 64, h = 32;
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	const g = c.getContext('2d')!;
	const bands = ['#5a3a34', '#9c6a4a', '#d9b48a', '#b5714a', '#efd9b4', '#c98a58', '#f2e2c4', '#a4583a', '#e4c49a', '#b07a5a', '#d8b890', '#7a4e40', '#4a302c'];
	const r = rng(7);
	for (let y = 0; y < h; y++) {
		const bi = Math.min(bands.length - 1, Math.floor((y / h) * bands.length + Math.sin(y * 1.7) * 0.4));
		g.fillStyle = bands[bi];
		g.fillRect(0, y, w, 1);
	}
	for (let i = 0; i < 160; i++) {
		g.fillStyle = r() > 0.5 ? 'rgba(255,240,215,0.35)' : 'rgba(80,40,30,0.3)';
		g.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1 + Math.floor(r() * 4), 1);
	}
	// great red spot
	g.fillStyle = '#b0442c';
	g.fillRect(40, 20, 6, 3);
	g.fillStyle = '#e2a07a';
	g.fillRect(41, 21, 3, 1);
	const t = nearest(new THREE.CanvasTexture(c));
	t.wrapS = THREE.RepeatWrapping;
	return t;
};

/** Tileable cloud-deck texture with alpha holes. */
export const cloudTexture = (seed: number, tint: [number, number, number]) => {
	const w = 32, h = 32;
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	const g = c.getContext('2d')!;
	const img = g.createImageData(w, h);
	const r = rng(seed);
	const blobs = new Array(14).fill(0).map(() => ({x: r() * w, y: r() * h, s: 3 + r() * 7}));
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			let v = 0;
			for (const b of blobs)
				for (const ox of [-w, 0, w])
					for (const oy of [-h, 0, h]) {
						const d = Math.hypot(x - b.x - ox, y - b.y - oy) / b.s;
						v += Math.max(0, 1 - d);
					}
			const i = (y * w + x) * 4;
			const k = Math.min(1, v);
			const shade = 0.55 + 0.45 * k;
			img.data[i] = tint[0] * shade;
			img.data[i + 1] = tint[1] * shade;
			img.data[i + 2] = tint[2] * shade;
			img.data[i + 3] = k > 0.35 ? 255 : 0;
		}
	g.putImageData(img, 0, 0);
	const t = nearest(new THREE.CanvasTexture(c));
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	return t;
};
