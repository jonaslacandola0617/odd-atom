// TRANSFERS: Nico v2 toon character sheet (stills): turnaround and the expression set, in the toon pixel look.
import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as skClone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {toon, addOutlines} from '../toon';
import {drawNicoFace, makeFaceTexture, NicoExpr} from './nicoFace';

export type NicoToonSheetProps = {shot: 'lineup' | 'faces'; lw: number};
const EXPRS: NicoExpr[] = ['tired', 'focused', 'forcedSmile', 'worried', 'fear', 'terror', 'blink'];

const rotateWorld = (bone: THREE.Object3D, axis: THREE.Vector3, angle: number) => {
	bone.updateWorldMatrix(true, false);
	const pq = new THREE.Quaternion(); bone.parent!.getWorldQuaternion(pq);
	bone.quaternion.premultiply(pq.clone().invert().multiply(new THREE.Quaternion().setFromAxisAngle(axis, angle)).multiply(pq));
	bone.updateMatrixWorld(true);
};

export const useNicoToon = () => {
	const [g, setG] = useState<THREE.Group | null>(null);
	const [handle] = useState(() => delayRender('nico toon glb'));
	useEffect(() => {
		new GLTFLoader().load(staticFile('assets/3d/nico/nico-v2-toon.glb'), (x) => { setG(x.scene); continueRender(handle); }, undefined, (e) => { console.error(e); continueRender(handle); });
	}, [handle]);
	return g;
};

/** A ready-to-pose toon Nico: toon materials, outlines, a face texture with setFace(expr). */
export const makeToonNico = (src: THREE.Group) => {
	const g = skClone(src) as THREE.Group;
	const face = makeFaceTexture();
	let uv = {eyeL: [0.72, 0.6] as [number, number], eyeR: [0.28, 0.6] as [number, number], mouth: [0.5, 0.4] as [number, number]};
	g.traverse((o) => {
		const m = o as THREE.Mesh;
		if (!m.isMesh) return;
		m.frustumCulled = false;
		const old = m.material as THREE.MeshStandardMaterial;
		if (m.name.includes('face')) {
			const ex = (m.userData ?? {}) as Record<string, number[]>;
			const pe = (m.parent?.userData ?? {}) as Record<string, number[]>;
			const src2 = ex.eye_l_uv ? ex : pe;
			if (src2.eye_l_uv) uv = {eyeL: src2.eye_l_uv as [number, number], eyeR: src2.eye_r_uv as [number, number], mouth: src2.mouth_uv as [number, number]};
			const mat = toon(0xffffff); mat.map = face.texture; mat.transparent = true; mat.alphaTest = 0.5; mat.depthWrite = false;
			m.material = mat; m.renderOrder = 2;
			return;
		}
		m.material = toon(old.color);
	});
	if (!(globalThis as any).__noOutline) addOutlines(g, 1.6, '#0b0a0c', (m) => m.name.includes('face') || m.name.includes('glasses'));
	const b = (n: string) => g.getObjectByName(n)!;
	const rest = new Map<THREE.Object3D, THREE.Quaternion>();
	g.traverse((o) => { if ((o as THREE.Bone).isBone) rest.set(o, o.quaternion.clone()); });
	return {
		root: g, bone: b, rest,
		setFace: (expr: NicoExpr) => { drawNicoFace(face.ctx, expr, uv); face.texture.needsUpdate = true; },
		relaxed: () => {
			rest.forEach((q, bn) => bn.quaternion.copy(q)); g.updateMatrixWorld(true);
			const Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0);
			rotateWorld(b('upperarm_l'), Z, -0.72); rotateWorld(b('upperarm_r'), Z, 0.72);
			rotateWorld(b('lowerarm_l'), X, -0.04); rotateWorld(b('lowerarm_r'), X, -0.04);
			rotateWorld(b('spine_03'), X, 0.07);
			rotateWorld(b('head'), X, 0.06);
		},
	};
};

const BG = toon('#2c3431');
const Scene: React.FC<{src: THREE.Group; shot: 'lineup' | 'faces'}> = ({src, shot}) => {
	const {camera} = useThree();
	const people = useMemo(() => {
		if (shot === 'lineup') return [0, 0.62, Math.PI / 2, Math.PI].map((t, i) => {
			const n = makeToonNico(src); n.relaxed(); n.setFace('tired'); n.root.rotation.y = t; n.root.position.x = (i - 1.5) * 0.85; return n;
		});
		return EXPRS.map((e, i) => {
			const n = makeToonNico(src); n.relaxed(); n.setFace(e); n.root.rotation.y = -0.2; n.root.position.x = (i - 3) * 0.34; return n;
		});
	}, [src, shot]);
	const cam = camera as THREE.PerspectiveCamera;
	if (shot === 'lineup') { cam.position.set(0, 0.98, 4.9); cam.fov = 34; cam.lookAt(0, 0.9, 0); }
	else { cam.position.set(0, 1.45, 6.2); cam.fov = 14; cam.lookAt(0, 1.45, 0); }
	cam.updateProjectionMatrix();
	return (
		<>
			<color attach="background" args={['#1d2321']} />
			<ambientLight intensity={0.55} color="#8a96a8" />
			<directionalLight position={[2.2, 3.2, 3.6]} intensity={2.4} color="#ffd9b0" />
			<directionalLight position={[-3, 2, -2.5]} intensity={1.1} color="#7fa0ff" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={BG}><planeGeometry args={[14, 8]} /></mesh>
			{people.map((p, i) => <primitive key={i} object={p.root} />)}
		</>
	);
};

export const NicoToonSheet: React.FC<NicoToonSheetProps & {noOutline?: boolean}> = ({shot, lw, noOutline}) => {
	(globalThis as any).__noOutline = !!noOutline;
	const src = useNicoToon();
	const lh = Math.round((lw * 9) / 16);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: lw, height: lh, transform: `scale(${1920 / lw})`, transformOrigin: '0 0'}}>
				<ThreeCanvas width={lw} height={lh} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 34, near: 0.05, far: 60}} style={{imageRendering: 'pixelated'}}>
					{src && <Scene src={src} shot={shot} />}
				</ThreeCanvas>
			</div>
		</AbsoluteFill>
	);
};
