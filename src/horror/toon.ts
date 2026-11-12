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
	const lv = (opts.levels ?? 10).toFixed(1);
	m.onBeforeCompile = (s) => {
		s.fragmentShader = s.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
			gl_FragColor.rgb = floor(gl_FragColor.rgb * ${lv} + 0.5) / ${lv};`);
	};
	return m;
};

const outlineMat = (width: number, color: THREE.ColorRepresentation) => {
	const m = new THREE.MeshBasicMaterial({color, side: THREE.BackSide});
	m.onBeforeCompile = (s) => {
		// push the (skinned, morphed) surface out along its normal, in view space so the line is even
		s.vertexShader = s.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
			vec3 nv = normalize(normalMatrix * objectNormal);
			gl_Position = projectionMatrix * (mvPosition + vec4(nv * ${width.toFixed(4)} * -mvPosition.z, 0.0));`);
	};
	return m;
};

/** Adds an outline twin to every mesh under root. width is a fraction of view depth (0.004 ~ 1-2 px at 480 wide). */
export const addOutlines = (root: THREE.Object3D, width = 0.004, color: THREE.ColorRepresentation = '#0b0a0c', skip?: (m: THREE.Mesh) => boolean) => {
	const meshes: THREE.Mesh[] = [];
	root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.userData.isOutline && !(skip && skip(m))) meshes.push(m); });
	const mat = outlineMat(width, color);
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
