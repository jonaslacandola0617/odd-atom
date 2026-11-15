// TRANSFERS PSX: PS1-style face swapping. Like PS1-era games, a character's expression is a whole
// texture swap: the body texture stays the same and only the face region differs between files
// (public/assets/3d/psx-local/<who>/tex_<expr>.png, built by assets3d/characters/psx/restyle_textures.py,
// or the hand-painted ChatGPT faces once they are composited in).
import * as THREE from 'three';
import {staticFile} from 'remotion';
import {nearest} from '../../psx';

export const EXPRESSIONS = ['neutral', 'focused', 'worried', 'fear', 'smile', 'sleepy', 'shh', 'talk'] as const;
export type Expr = (typeof EXPRESSIONS)[number];
export type Who = 'nico' | 'bea';

export type FaceSet = Record<Expr, THREE.Texture> & {source: THREE.Texture};

/** Load every expression texture for a character (resolves once all are decoded). */
export const loadFaces = (who: Who): Promise<FaceSet> => {
	const loader = new THREE.TextureLoader();
	const names = [...EXPRESSIONS, 'source'] as const;
	return Promise.all(names.map((n) => loader.loadAsync(staticFile(`assets/3d/psx-local/${who}/tex_${n}.png`)))).then((ts) => {
		const set = {} as FaceSet;
		ts.forEach((t, i) => {
			t.flipY = false; // glTF UV convention
			t.colorSpace = THREE.SRGBColorSpace;
			nearest(t);
			(set as Record<string, THREE.Texture>)[names[i]] = t;
		});
		return set;
	});
};

/** setFace: point every body material of a character at the expression's texture. */
export const setFace = (root: THREE.Object3D, faces: FaceSet, expr: Expr | 'source') => {
	const t = faces[expr];
	root.traverse((o) => {
		const m = o as THREE.Mesh;
		if (!m.isMesh || m.userData.noFace) return;
		const mat = m.material as THREE.MeshLambertMaterial;
		if (mat.map !== t) {
			mat.map = t;
			mat.needsUpdate = true;
		}
	});
};
