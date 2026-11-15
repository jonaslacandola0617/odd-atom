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
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
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
					else if (path.endsWith('.obj')) new OBJLoader().load(url, res, undefined, rej);
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
/** One step for a bone, in the character's own space: a rotation about an axis, or 'aim', which turns
 *  the bone so it points (toward its first child bone) along a direction, whatever its rest angle. */
export type Step = [Axis, number] | ['aim', [number, number, number]];
/** bone name (without the "mixamorig" prefix) -> steps, applied in order */
export type Pose = Record<string, Step[]>;
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
	const a = new THREE.Vector3(), c = new THREE.Vector3();
	root.traverse((o) => {
		const b = o as THREE.Bone;
		if (!b.isBone) return;
		const spec = pose[b.name.replace(/^mixamorig:?/, '')];
		if (!spec) return;
		b.parent!.getWorldQuaternion(pq);
		pq.premultiply(rootInv); // parent orientation in character space
		qs.identity();
		const child = b.children.find((k) => (k as THREE.Bone).isBone);
		for (const [kind, v] of spec) {
			if (kind === 'aim') {
				if (!child) continue;
				// where the bone points now (rest, under its posed parents), in character space
				b.getWorldPosition(a);
				child.getWorldPosition(c);
				const d = c.sub(a).applyQuaternion(rootInv).normalize().applyQuaternion(qs);
				qs.premultiply(tmp.setFromUnitVectors(d, new THREE.Vector3(...(v as [number, number, number])).normalize()));
			} else qs.premultiply(tmp.setFromAxisAngle(AX[kind], v as number));
		}
		// local' = parent^-1 * q * parent * local
		b.quaternion.copy(pq.clone().invert().multiply(qs).multiply(pq).multiply(rest.get(b)!));
		b.updateMatrixWorld(true);
	});
};

// Presets by aim (character space: +x its left, +y up, +z forward), so they hold for any rest pose.
/** Arms hanging at the sides, slightly out from the hips, elbows a touch bent. */
export const ARMS_DOWN: Pose = {
	LeftArm: [['aim', [0.2, -1, 0]]],
	RightArm: [['aim', [-0.2, -1, 0]]],
	LeftForeArm: [['aim', [0.1, -1, 0.12]]],
	RightForeArm: [['aim', [-0.1, -1, 0.12]]],
};
/** Seated on a chair: thighs forward, shins down, upper arms down at the sides, forearms resting
 *  forward along the thighs (hands on the knees). */
export const SIT: Pose = {
	LeftUpLeg: [['aim', [0.06, -0.08, 1]]],
	RightUpLeg: [['aim', [-0.06, -0.08, 1]]],
	LeftLeg: [['aim', [0, -1, 0.06]]],
	RightLeg: [['aim', [0, -1, 0.06]]],
	LeftArm: [['aim', [0.28, -1, 0.2]]],
	RightArm: [['aim', [-0.28, -1, 0.2]]],
	LeftForeArm: [['aim', [0.05, -0.3, 1]]],
	RightForeArm: [['aim', [-0.05, -0.3, 1]]],
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
	/** called after posing with a lookup of a bone's world position (e.g. to put a phone in a hand) */
	probe?: (where: (bone: string) => THREE.Vector3) => void;
}> = ({name, height, pose = ARMS_DOWN, position = [0, 0, 0], rotation = [0, 0, 0], tint, probe}) => {
	const obj = useAsset(`assets/models/psx/characters/${name}.fbx`, `assets/models/psx/characters/${name}.png`, tint);
	const scale = useMemo(() => {
		if (!obj) return 1;
		const b = new THREE.Box3().setFromObject(obj);
		return height / (b.max.y - b.min.y);
	}, [obj, height]);
	if (!obj) return null;
	applyPose(obj, pose);
	if (probe) {
		const parent = obj.parent;
		obj.parent = null; // measure in the model's own space, then apply our group's transform
		obj.updateMatrixWorld(true);
		const eul = new THREE.Euler(...rotation);
		probe((bone) => {
			let b: THREE.Object3D | undefined;
			obj.traverse((o) => {
				if (!b && (o as THREE.Bone).isBone && o.name.replace(/^mixamorig:?/, '') === bone) b = o;
			});
			const v = new THREE.Vector3();
			b?.getWorldPosition(v);
			return v.multiplyScalar(scale).applyEuler(eul).add(new THREE.Vector3(...position));
		});
		obj.parent = parent;
		obj.updateMatrixWorld(true);
	}
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<primitive object={obj} />
		</group>
	);
};

/** A static prop (GLB/FBX/OBJ) scaled by s; tex replaces its texture (OBJs from the car pack need one). */
export const PsxProp: React.FC<{path: string; tex?: string; s?: number; position?: [number, number, number]; rotation?: [number, number, number]; tint?: {color?: string; emissive?: string}}> = ({
	path,
	tex,
	s = 1,
	position = [0, 0, 0],
	rotation = [0, 0, 0],
	tint,
}) => {
	const obj = useAsset(path, tex, tint);
	if (!obj) return null;
	return (
		<group position={position} rotation={rotation} scale={s}>
			<primitive object={obj} />
		</group>
	);
};
