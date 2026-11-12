// Toon / pixel-art helpers: banded toon shading, palette-snapped colour, and inverted-hull outlines that
// follow skinning and morph targets (the outline mesh shares the geometry, skeleton and influence array).
import * as THREE from 'three';

const ramp = (steps: number[]) => {
	const data = new Uint8Array(steps.length * 4);
	steps.forEach((v, i) => { data.set([v, v, v, 255], i * 4); });
	const t = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
	t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
	return t;
};
/** three light bands: shadow, mid, lit */
export const RAMP3 = ramp([70, 165, 255]);

/** Toon material; `levels` snaps the final colour to a coarse palette (no dither: clean pixel-art flats). */
export const toon = (color: THREE.ColorRepresentation, opts: {vertexColors?: boolean; levels?: number} = {}) => {
	const m = new THREE.MeshToonMaterial({color, gradientMap: RAMP3, vertexColors: !!opts.vertexColors});
	const lv = (opts.levels ?? 40).toFixed(1);
	m.onBeforeCompile = (s) => {
		s.fragmentShader = s.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
			gl_FragColor.rgb = floor(gl_FragColor.rgb * ${lv} + 0.5) / ${lv};`);
	};
	return m;
};

const outlineMat = (px: number, lh: number, color: THREE.ColorRepresentation) => {
	const m = new THREE.MeshBasicMaterial({color, side: THREE.BackSide});
	const ndc = ((px * 2) / lh).toFixed(5);
	m.onBeforeCompile = (s) => {
		// screen-space extrusion of the (skinned, morphed) back faces: a constant line width in pixels at any lens
		s.vertexShader = s.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
			vec4 cn = projectionMatrix * vec4(normalize(normalMatrix * objectNormal), 0.0);
			vec2 dir = length(cn.xy) > 1e-5 ? normalize(cn.xy) : vec2(0.0);
			gl_Position.xy += dir * ${ndc} * gl_Position.w * vec2(${(9 / 16).toFixed(5)}, 1.0);`);
	};
	return m;
};

/** Adds an outline twin to every mesh under root: px is the line width in render pixels, lh the render height (16:9 frame). */
export const addOutlines = (root: THREE.Object3D, px = 1.5, color: THREE.ColorRepresentation = '#0b0a0c', skip?: (m: THREE.Mesh) => boolean, lh = 360) => {
	const meshes: THREE.Mesh[] = [];
	root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.userData.isOutline && !(skip && skip(m))) meshes.push(m); });
	const mat = outlineMat(px, lh, color);
	for (const m of meshes) {
		let o: THREE.Mesh;
		if ((m as THREE.SkinnedMesh).isSkinnedMesh) {
			const sm = m as THREE.SkinnedMesh;
			const so = new THREE.SkinnedMesh(sm.geometry, mat);
			so.bind(sm.skeleton, sm.bindMatrix);
			o = so;
		} else o = new THREE.Mesh(m.geometry, mat);
		if (m.morphTargetInfluences) { o.morphTargetInfluences = m.morphTargetInfluences; o.morphTargetDictionary = m.morphTargetDictionary; }
		o.userData.isOutline = true;
		o.frustumCulled = false;
		o.position.copy(m.position); o.quaternion.copy(m.quaternion); o.scale.copy(m.scale);
		m.parent!.add(o);
	}
};
