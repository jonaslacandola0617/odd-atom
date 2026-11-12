// Nico's pixel face, painted onto the face decal of nico-v2-toon.glb. Drawn from the approved design sheet
// (assets3d/characters/nico/design/nico-sheet-chatgpt-v1.png): heavy straight brows, tired eyes with bags,
// stubble, a simple nose and mouth. One canvas texel = one "pixel" of the face; the texture is nearest-filtered.
import * as THREE from 'three';

export type NicoExpr = 'tired' | 'focused' | 'forcedSmile' | 'worried' | 'fear' | 'terror' | 'blink';
export const FACE_W = 48, FACE_H = 60;

const C = {
	brow: '#141011', lid: '#1a1213', white: '#e6dfd2', iris: '#3a2416', pupil: '#0a0707', bag: '#7a4c34',
	nose: '#80523a', mouth: '#5c2e28', lip: '#8c5240', teeth: '#e8e1d2', inside: '#2a0e0e', stub: '#5a3a28', crease: '#8a5a40',
};

type UV = {eyeL: [number, number]; eyeR: [number, number]; mouth: [number, number]};

/** Draw one expression. uv comes from the GLB extras (u to the character's left, v up). */
export const drawNicoFace = (g: CanvasRenderingContext2D, expr: NicoExpr, uv: UV) => {
	g.clearRect(0, 0, FACE_W, FACE_H);
	const px = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
	const X = (u: number) => u * FACE_W, Y = (v: number) => (1 - v) * FACE_H;
	// stubble: a fixed dither on the jaw, chin and upper lip (deterministic, same every frame)
	const mx = X(uv.mouth[0]), my = Y(uv.mouth[1]);
	let seed = 7;
	const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
	for (let y = Math.round(my - 3); y < FACE_H - 3; y++) for (let x = 8; x < FACE_W - 8; x++) {
		const dx = Math.abs(x - mx), dy = y - my;
		// light stubble: chin and the jawline below the mouth, a thin line on the upper lip
		const chin = dy > 3 && dy < 12 && dx < 9 - (dy - 3) * 0.3;
		const jaw = dy > 1 && dy < 9 && dx >= 9 && dx < 15 && dy > (dx - 9) * 0.6;
		const lip = dy === -2 && dx < 5;
		if ((chin || jaw || lip) && rnd() < (lip ? 0.5 : 0.22)) px(x, y, 1, 1, C.stub);
	}
	// nose: a side shadow line and two nostril dots
	px(mx + 1, my - 10, 1, 5, C.nose); px(mx - 2, my - 5, 1, 1, C.nose); px(mx + 2, my - 5, 1, 1, C.nose);
	for (const [side, e] of [[-1, uv.eyeR], [1, uv.eyeL]] as const) {
		const ex = X(e[0]), ey = Y(e[1]);
		const inner = side === 1 ? -1 : 1;                    // towards the nose
		// brows (2 px thick, 10 wide); tilt by expression
		const tilt = expr === 'focused' ? 2 : expr === 'worried' || expr === 'fear' || expr === 'terror' ? -2 : 0;
		const lift = expr === 'fear' || expr === 'terror' ? -3 : expr === 'forcedSmile' ? -1 : expr === 'focused' ? 1 : 0;
		for (let i = 0; i < 10; i++) {
			const x = ex - 5 + i;
			const t = side === 1 ? (9 - i) / 9 : i / 9;          // 1 at the inner end
			const yy = ey - 6 + lift + Math.round(t * tilt) - (i > 2 && i < 7 && expr === 'tired' ? 0 : 0);
			px(x, yy, 1, 2, C.brow);
		}
		if (expr === 'blink') {
			px(ex - 3, ey, 7, 1, C.lid); px(ex - 3, ey + 2, 6, 1, C.bag);
			continue;
		}
		const wide = expr === 'fear' || expr === 'terror';
		const narrow = expr === 'focused' || expr === 'forcedSmile';
		const h = wide ? 5 : narrow ? 2 : 3;
		const w = wide ? 7 : 7;
		const top = ey - (wide ? 3 : 1);
		px(ex - 3, top, w, h, C.white);
		// iris and pupil: small in fear (pinpoint), larger otherwise
		if (wide) { px(ex - 1 + inner * 0, top + 1, 2, 2, C.iris); px(ex, top + 2, 1, 1, C.pupil); }
		else { px(ex - 1, top, 3, h, C.iris); px(ex, top + (h > 2 ? 1 : 0), 1, 1, C.pupil); }
		// heavy upper lid; tired droops over the eye
		px(ex - 4, top - 1, w + 2, 1, C.lid);
		if (expr === 'tired' || expr === 'worried') px(ex - 3, top, w, 1, C.lid);
		// under-eye bags (two lines, the second fainter)
		px(ex - 3, top + h + 1, 6, 1, C.bag);
		if (!wide) px(ex - 2, top + h + 2, 4, 1, C.crease);
	}
	// mouth
	if (expr === 'terror') {
		px(mx - 4, my - 1, 9, 6, C.inside); px(mx - 3, my - 1, 7, 1, C.teeth); px(mx - 4, my + 5, 9, 1, C.lip);
	} else if (expr === 'fear') {
		px(mx - 2, my, 5, 3, C.inside); px(mx - 2, my, 5, 1, C.teeth);
	} else if (expr === 'forcedSmile') {
		px(mx - 3, my + 1, 7, 1, C.mouth); px(mx - 4, my, 1, 1, C.mouth); px(mx + 4, my, 1, 1, C.mouth);
	} else if (expr === 'worried') {
		px(mx - 3, my, 7, 1, C.mouth); px(mx - 4, my + 1, 1, 1, C.mouth); px(mx + 4, my + 1, 1, 1, C.mouth); px(mx - 1, my + 1, 3, 1, C.lip);
	} else {
		px(mx - 3, my, 7, 1, C.mouth); px(mx - 4, my + 1, 1, 1, C.mouth); px(mx + 4, my + 1, 1, 1, C.mouth);
	}
};

export const makeFaceTexture = () => {
	const c = document.createElement('canvas'); c.width = FACE_W; c.height = FACE_H;
	const t = new THREE.CanvasTexture(c);
	t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
	t.flipY = false;   // glTF UVs are already flipped
	return {canvas: c, ctx: c.getContext('2d')!, texture: t};
};
