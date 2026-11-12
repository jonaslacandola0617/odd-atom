// TRANSFERS: Nico v1 look test (stills). The CC0-based rigged GLB rendered through our PS1 pipeline:
// vertex snap, Bayer dither, quantised colour, low internal resolution upscaled with nearest filtering.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as skClone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {ps1} from '../ps1';
import {toon, addOutlines} from '../toon';

type Shot = 'lineup' | 'closeup';
export type NicoLookProps = {shot: Shot; lw: number; expression: string; style?: 'ps1' | 'toon'};

const EXPR: Record<string, Record<string, number>> = {
	neutral: {},
	fear: {'eyebrows-left-inner-up': 0.9, 'eyebrows-right-inner-up': 0.9, 'eye-left-opened-up': 0.8, 'eye-right-opened-up': 0.8, 'mouth-open': 0.3, 'neck-platysma': 0.4},
	focused: {'eye-left-slit': 0.55, 'eye-right-slit': 0.55, 'eyebrows-left-down': 0.45, 'eyebrows-right-down': 0.45},
};

const useNico = () => {
	const [gltf, setGltf] = useState<THREE.Group | null>(null);
	const [handle] = useState(() => delayRender('nico glb'));
	useEffect(() => {
		new GLTFLoader().load(staticFile('assets/3d/nico/nico-v1.glb'), (g) => {
			setGltf(g.scene);
			continueRender(handle);
		}, undefined, (e) => { console.error(e); continueRender(handle); });
	}, [handle]);
	return gltf;
};

// rotate a bone about a WORLD axis (keeps the rig's own bone rolls out of the way)
const rotateWorld = (bone: THREE.Object3D, axis: THREE.Vector3, angle: number) => {
	bone.updateWorldMatrix(true, false);
	const pq = new THREE.Quaternion();
	bone.parent!.getWorldQuaternion(pq);
	const d = new THREE.Quaternion().setFromAxisAngle(axis, angle);
	const local = pq.clone().invert().multiply(d).multiply(pq);
	bone.quaternion.premultiply(local);
	bone.updateMatrixWorld(true);
};

const prepare = (src: THREE.Group, expression: string, turn: number, style: 'ps1' | 'toon' = 'ps1') => {
	const g = skClone(src) as THREE.Group;
	g.traverse((o) => {
		const m = o as THREE.Mesh;
		if (!m.isMesh) return;
		const old = m.material as THREE.MeshStandardMaterial;
		const hasCol = old.name === 'skin' && !!m.geometry.getAttribute('color');
		const mat = style === 'toon' ? toon(hasCol ? 0xffffff : old.color, {vertexColors: hasCol}) : ps1(new THREE.MeshLambertMaterial({color: hasCol ? 0xffffff : old.color, vertexColors: hasCol, side: THREE.FrontSide}), 22, 'vec2(150.0, 84.0)');
		m.material = mat;
		const dict = m.morphTargetDictionary;
		if (dict && m.morphTargetInfluences) {
			m.morphTargetInfluences.fill(0);
			for (const [k, v] of Object.entries(EXPR[expression] ?? {})) if (k in dict) m.morphTargetInfluences[dict[k]] = v;
		}
		m.frustumCulled = false;
	});
	// relaxed pose: arms down from the A-pose, slight elbow bend, head turned a touch
	const Z = new THREE.Vector3(0, 0, 1), Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
	const b = (n: string) => g.getObjectByName(n)!;
	g.updateMatrixWorld(true);
	rotateWorld(b('upperarm_l'), Z, -0.72); rotateWorld(b('upperarm_r'), Z, 0.72);
	rotateWorld(b('lowerarm_l'), X, -0.04); rotateWorld(b('lowerarm_r'), X, -0.04);
	rotateWorld(b('spine_03'), X, 0.06);            // tired, slightly rounded shoulders
	rotateWorld(b('head'), X, 0.08);
	if (style === 'toon') {
		b('head').scale.setScalar(1.18);              // first hint of stylized proportions
		addOutlines(g, 1.5, '#0b0a0c', (m) => m.name.includes('glasses'));
	}
	g.rotation.y = turn;
	return g;
};

const floorMat = ps1(new THREE.MeshLambertMaterial({color: '#2a2622'}), 22);
const wallMat = ps1(new THREE.MeshLambertMaterial({color: '#26282a'}), 22);
const floorToon = toon('#3a3029');
const wallToon = toon('#2f3236');

const Scene: React.FC<{nico: THREE.Group; shot: Shot; expression: string; style: 'ps1' | 'toon'}> = ({nico, shot, expression, style}) => {
	const {camera} = useThree();
	const people = React.useMemo(() => {
		if (shot === 'closeup') return [prepare(nico, expression, -0.45, style)];
		return [0, 0.62, Math.PI / 2, Math.PI].map((t) => prepare(nico, expression, t, style));
	}, [nico, shot, expression, style]);
	// set the camera during render: a still render does not wait for effects
	const cam = camera as THREE.PerspectiveCamera;
	if (shot === 'lineup') { cam.position.set(0, 0.95, 4.6); cam.fov = 34; cam.lookAt(0, 0.86, 0); }
	else { cam.position.set(0.12, 1.56, 0.62); cam.fov = 30; cam.lookAt(0.0, 1.52, 0); }
	cam.updateProjectionMatrix();
	return (
		<>
			<color attach="background" args={['#050506']} />
			<ambientLight intensity={0.25} color="#6a7088" />
			{/* warm desk lamp, camera left and above */}
			<pointLight position={[-1.4, 1.9, 1.6]} intensity={14} distance={9} decay={1.6} color="#ffb070" />
			{/* cool CRT glow, low and right, as if he faces a monitor */}
			<pointLight position={[0.9, 1.25, 1.1]} intensity={9} distance={5} decay={1.6} color="#7fa8ff" />
			<pointLight position={[0, 2.2, -1.6]} intensity={5} distance={5} decay={1.6} color="#8a90a8" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
				<planeGeometry args={[12, 8, 24, 16]} />
				<primitive attach="material" object={style === 'toon' ? floorToon : floorMat} />
			</mesh>
			<mesh position={[0, 2, -1.2]}>
				<planeGeometry args={[12, 4, 24, 8]} />
				<primitive attach="material" object={style === 'toon' ? wallToon : wallMat} />
			</mesh>
			{people.map((p, i) => (
				<primitive key={i} object={p} position={shot === 'lineup' ? [(i - 1.5) * 0.82, 0, 0] : [0, 0, 0]} />
			))}
		</>
	);
};

export const NicoLook: React.FC<NicoLookProps> = ({shot, lw, expression, style = 'ps1'}) => {
	const nico = useNico();
	const lh = Math.round((lw * 9) / 16);
	const scale = 1920 / lw;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: lw, height: lh, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
				<ThreeCanvas width={lw} height={lh} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 34, near: 0.03, far: 60}} style={{imageRendering: 'pixelated'}}>
					{nico && <Scene nico={nico} shot={shot} expression={expression} style={style} />}
				</ThreeCanvas>
			</div>
		</AbsoluteFill>
	);
};
