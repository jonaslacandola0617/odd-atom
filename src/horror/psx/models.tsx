// PSX model kit: loads the user's licensed PS1-style models (public/assets/models/psx/, see PROVENANCE.md)
// inside Remotion, gives them our PS1 look (vertex snap, dither, per-vertex lambert), and poses the
// Mixamo-rigged characters bone by bone (their only animation is a one-frame A-pose).
//
// Posing: each entry rotates a bone about an axis of the character's own space (the rest pose: facing
// +z, up +y, its left hand toward +x), applied root-to-leaf, so no bone's local axes need to be known.
import React, {useEffect, useMemo, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';

const cache = new Map<string, Promise<THREE.Group>>();
const texCache = new Map<string, Promise<THREE.Texture>>();
const loadFile = (path: string): Promise<THREE.Group> => {
	if (!cache.has(path)) {
		const url = staticFile(path);
		cache.set(
			path,
			new Promise((res, rej) => {
				if (path.endsWith('.glb')) new GLTFLoader().load(url, (g) => res(g.scene), undefined, rej);
				else new FBXLoader().load(url, res, undefined, rej);
			}),
		);
	}
	return cache.get(path)!;
};
const loadTex = (path: string): Promise<THREE.Texture> => {
	if (!texCache.has(path)) {
		texCache.set(
			path,
			new THREE.TextureLoader().loadAsync(staticFile(path)).then((t) => {
				t.colorSpace = THREE.SRGBColorSpace;
				t.magFilter = THREE.NearestFilter;
				t.minFilter = THREE.NearestFilter;
				t.generateMipmaps = false;
				return t;
			}),
		);
	}
	return texCache.get(path)!;
};

/** Load once per page (Remotion waits for it), then hand back a private clone. */
const useAsset = (path: string, tex?: string, tint?: {color?: string; emissive?: string}): THREE.Object3D | null => {
	const [obj, setObj] = useState<THREE.Object3D | null>(null);
	const [handle] = useState(() => delayRender(`psx ${path}`));
	// release the frame only once the model is in the scene (after React has re-rendered with it)
	const advance = useThree((st) => st.advance);
	useEffect(() => {
		if (!obj) return;
		// ThreeCanvas only redraws on frame changes: draw now that the model is in, then release
		requestAnimationFrame(() => {
			advance(performance.now());
			requestAnimationFrame(() => continueRender(handle));
		});
	}, [obj, handle, advance]);
	useEffect(() => {
		let live = true;
		Promise.all([loadFile(path), tex ? loadTex(tex) : Promise.resolve(null)])
			.then(([src, t]) => {
				const o = SkeletonUtils.clone(src);
				o.traverse((m) => {
					const mesh = m as THREE.Mesh;
					if (!mesh.isMesh) return;
					const old = [].concat(mesh.material as never) as THREE.MeshStandardMaterial[];
					const mats = old.map((om) =>
						ps1(
							new THREE.MeshLambertMaterial({
								map: t ?? om.map ?? null,
								color: tint?.color ?? (om.map || t ? '#ffffff' : om.color),
								emissive: tint?.emissive ?? '#000000',
								transparent: false,
							}),
							64,
							SNAP6,
						),
					);
					mesh.material = mats.length === 1 ? mats[0] : mats;
					mesh.frustumCulled = false; // skinned bounds don't follow our poses
				});
				if (live) setObj(o);
			})
			.catch((e) => {
				console.error('psx load failed', path, String(e));
				continueRender(handle);
			});
		return () => {
			live = false;
		};
	}, [path, tex, tint?.color, tint?.emissive, handle]);
	return obj;
};

// ------------------------------------------------------------------ posing
export type Axis = 'x' | 'y' | 'z';
/** bone name (without the "mixamorig" prefix) -> rotations about the character's own axes, in order */
export type Pose = Record<string, [Axis, number][]>;
const AX = {x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1)};

const applyPose = (root: THREE.Object3D, pose: Pose) => {
	const rest = (root.userData.rest ??= (() => {
		const m = new Map<THREE.Bone, THREE.Quaternion>();
		root.traverse((b) => (b as THREE.Bone).isBone && m.set(b as THREE.Bone, b.quaternion.clone()));
		return m;
	})()) as Map<THREE.Bone, THREE.Quaternion>;
	rest.forEach((q, b) => b.quaternion.copy(q));
	// work in the character's own space: undo the root's own transform
	const rootInv = new THREE.Quaternion();
	root.updateMatrixWorld(true);
	root.getWorldQuaternion(rootInv).invert();
	const pq = new THREE.Quaternion(), qs = new THREE.Quaternion(), tmp = new THREE.Quaternion();
	root.traverse((o) => {
		const b = o as THREE.Bone;
		if (!b.isBone) return;
		const spec = pose[b.name.replace(/^mixamorig:?/, '')];
		if (!spec) return;
		b.parent!.getWorldQuaternion(pq);
		pq.premultiply(rootInv); // parent orientation in character space
		qs.identity();
		for (const [a, ang] of spec) qs.premultiply(tmp.setFromAxisAngle(AX[a], ang));
		// local' = parent^-1 * q * parent * local
		b.quaternion.copy(pq.clone().invert().multiply(qs).multiply(pq).multiply(rest.get(b)!));
		b.updateMatrixWorld(true);
	});
};

/** Arms hanging at the sides from the A-pose. */
export const ARMS_DOWN: Pose = {LeftArm: [['z', -0.85]], RightArm: [['z', 0.85]]};
/** Seated on a chair: thighs forward, shins down, forearms on the thighs. */
export const SIT: Pose = {
	LeftUpLeg: [['x', -1.5]],
	RightUpLeg: [['x', -1.5]],
	LeftLeg: [['x', 1.5]],
	RightLeg: [['x', 1.5]],
	LeftArm: [['z', -1.0], ['x', -0.25]],
	RightArm: [['z', 1.0], ['x', -0.25]],
	LeftForeArm: [['x', -1.1]],
	RightForeArm: [['x', -1.1]],
};
export const merge = (...ps: Pose[]): Pose => {
	const out: Pose = {};
	for (const p of ps) for (const [k, v] of Object.entries(p)) out[k] = [...(out[k] ?? []), ...v];
	return out;
};

/**
 * A posed character. height normalises the model (metres); position is where its feet (origin) go;
 * rotation turns the whole body (the rest pose faces +z).
 */
export const PsxCharacter: React.FC<{
	name: string;
	height: number;
	pose?: Pose;
	position?: [number, number, number];
	rotation?: [number, number, number];
	tint?: {color?: string; emissive?: string};
}> = ({name, height, pose = ARMS_DOWN, position = [0, 0, 0], rotation = [0, 0, 0], tint}) => {
	const obj = useAsset(`assets/models/psx/characters/${name}.fbx`, `assets/models/psx/characters/${name}.png`, tint);
	const scale = useMemo(() => {
		if (!obj) return 1;
		const b = new THREE.Box3().setFromObject(obj);
		return height / (b.max.y - b.min.y);
	}, [obj, height]);
	if (!obj) return null;
	applyPose(obj, pose);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<primitive object={obj} />
		</group>
	);
};

/** A static prop (GLB/FBX) scaled by s. */
export const PsxProp: React.FC<{path: string; s?: number; position?: [number, number, number]; rotation?: [number, number, number]; tint?: {color?: string; emissive?: string}}> = ({
	path,
	s = 1,
	position = [0, 0, 0],
	rotation = [0, 0, 0],
	tint,
}) => {
	const obj = useAsset(path, undefined, tint);
	if (!obj) return null;
	return (
		<group position={position} rotation={rotation} scale={s}>
			<primitive object={obj} />
		</group>
	);
};
