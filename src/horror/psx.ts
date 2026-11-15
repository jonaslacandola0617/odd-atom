// PSX / PS1 survival-horror rendering for TRANSFERS (2026-11-15). Stricter than ps1.ts:
//   - vertex snapping to the internal pixel grid (half-res grid in clip space)
//   - affine texture mapping (no perspective correction): UVs carried as (uv*w, w) and divided per pixel
//   - 15-bit colour (31 levels per channel) with a 4x4 Bayer dither, applied after the colour-space step
//   - nearest-filtered textures with no mipmaps (see `nearestAll`)
// Fog comes from the scene (THREE.Fog) and is honoured by Lambert materials.
import * as THREE from 'three';

export type PsxOpts = {snap?: [number, number]; levels?: number; affine?: boolean; dither?: boolean};

export const psx = <M extends THREE.Material>(m: M, o: PsxOpts = {}): M => {
	const [sx, sy] = o.snap ?? [160, 90];
	const lv = (o.levels ?? 31).toFixed(1);
	const affine = o.affine ?? true;
	const dither = o.dither ?? true;
	m.onBeforeCompile = (sh) => {
		sh.vertexShader = 'varying vec3 vAff;\n' + sh.vertexShader.replace(
			'#include <project_vertex>',
			`#include <project_vertex>
			{ vec4 sp = gl_Position; sp.xyz /= sp.w; sp.xy = floor(sp.xy * vec2(${sx}.0, ${sy}.0) + 0.5) / vec2(${sx}.0, ${sy}.0); sp.xyz *= sp.w; gl_Position = sp; }
			#ifdef USE_MAP
			vAff = vec3(vMapUv * gl_Position.w, gl_Position.w);
			#else
			vAff = vec3(0.0, 0.0, 1.0);
			#endif`,
		);
		let fs = 'varying vec3 vAff;\n' + sh.fragmentShader;
		if (affine)
			fs = fs.replace('#include <map_fragment>', `#ifdef USE_MAP
				vec4 sampledDiffuseColor = texture2D(map, vAff.xy / vAff.z);
				diffuseColor *= sampledDiffuseColor;
				#endif`);
		if (dither)
			fs = fs.replace('#include <dithering_fragment>', `#include <dithering_fragment>
				{
					int bx = int(mod(gl_FragCoord.x, 4.0)); int by = int(mod(gl_FragCoord.y, 4.0));
					float bayer[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
					float d = (bayer[by * 4 + bx] / 16.0 - 0.5) / ${lv};
					gl_FragColor.rgb = floor((gl_FragColor.rgb + d) * ${lv} + 0.5) / ${lv};
				}`);
		sh.fragmentShader = fs;
	};
	m.customProgramCacheKey = () => `psx-${sx}-${sy}-${lv}-${affine}-${dither}`;
	m.needsUpdate = true;
	return m;
};

export const nearest = (t: THREE.Texture | null | undefined) => {
	if (!t) return t;
	t.magFilter = THREE.NearestFilter;
	t.minFilter = THREE.NearestFilter;
	t.generateMipmaps = false;
	t.anisotropy = 1;
	t.needsUpdate = true;
	return t;
};

/** Replace every material under `root` with a PSX Lambert that keeps its colour and texture. */
export const psxify = (root: THREE.Object3D, o: PsxOpts & {tint?: THREE.ColorRepresentation; emissive?: (name: string) => THREE.ColorRepresentation | null} = {}) => {
	root.traverse((ob) => {
		const mesh = ob as THREE.Mesh;
		if (!mesh.isMesh) return;
		const conv = (old: THREE.Material) => {
			const s = old as THREE.MeshStandardMaterial;
			const map = nearest(s.map ?? null) ?? null;
			if (map) map.colorSpace = THREE.SRGBColorSpace;
			const mat = new THREE.MeshLambertMaterial({color: s.color ? s.color.clone() : new THREE.Color(1, 1, 1), map, transparent: s.transparent, alphaTest: s.alphaTest || (s.transparent ? 0.4 : 0), side: s.side});
			if (o.tint) mat.color.multiply(new THREE.Color(o.tint));
			const em = o.emissive?.(s.name ?? '');
			if (em) mat.emissive = new THREE.Color(em);
			mat.name = s.name;
			return psx(mat, o);
		};
		mesh.material = Array.isArray(mesh.material) ? mesh.material.map(conv) : conv(mesh.material);
	});
	return root;
};

/** Deterministic PRNG. */
export const prng = (seed: number) => () => {
	seed = (seed * 1664525 + 1013904223) % 4294967296;
	return seed / 4294967296;
};

/** A small nearest-filtered canvas texture painted by `draw`. */
export const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number]) => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d')!, w, h);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	nearest(t);
	if (repeat) {
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.repeat.set(repeat[0], repeat[1]);
	}
	return t;
};

/** Noisy surface texture (plaster, concrete, metal): base colour plus speckle, stains and grime. */
export const grimeTex = (seed: number, base: string, opts: {w?: number; h?: number; speck?: number; stains?: number; streaks?: boolean; slats?: number} = {}) =>
	canvasTex(opts.w ?? 64, opts.h ?? 64, (g, w, h) => {
		const r = prng(seed);
		g.fillStyle = base;
		g.fillRect(0, 0, w, h);
		for (let i = 0; i < (opts.speck ?? 500); i++) {
			const v = r();
			g.fillStyle = v > 0.5 ? `rgba(255,255,255,${0.04 + r() * 0.06})` : `rgba(0,0,0,${0.05 + r() * 0.12})`;
			g.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1 + Math.floor(r() * 2), 1);
		}
		for (let i = 0; i < (opts.stains ?? 6); i++) {
			g.fillStyle = `rgba(40,30,20,${0.08 + r() * 0.12})`;
			const x = r() * w, y = r() * h, s = 4 + r() * 14;
			g.fillRect(Math.floor(x), Math.floor(y), Math.floor(s), Math.floor(s * (0.4 + r())));
		}
		if (opts.streaks)
			for (let i = 0; i < 10; i++) {
				g.fillStyle = `rgba(30,22,16,${0.1 + r() * 0.15})`;
				g.fillRect(Math.floor(r() * w), Math.floor(r() * h * 0.3), 1, Math.floor(h * (0.3 + r() * 0.6)));
			}
		if (opts.slats)
			for (let y = 0; y < h; y += opts.slats) {
				g.fillStyle = 'rgba(0,0,0,0.45)';
				g.fillRect(0, y, w, 1);
				g.fillStyle = 'rgba(255,255,255,0.12)';
				g.fillRect(0, y + 1, w, 1);
			}
	});
