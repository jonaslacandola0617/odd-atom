// TRANSFERS: Nico v3 (the Quaternius CC0 base reshaped to the approved design sheet) in the toon look, no outlines.
// shot 'lineup': front, three-quarter, side, back on the sheet's grey, framed like the sheet for a side-by-side check.
// shot 'faces': the seven face sets. shot 'mood': the lineup in a dark shop light.
import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as skClone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {toon} from '../toon';

export type NicoExprV3 = 'tired' | 'focused' | 'forcedSmile' | 'worried' | 'fear' | 'terror' | 'blink';
export const EXPRS_V3: NicoExprV3[] = ['tired', 'focused', 'forcedSmile', 'worried', 'fear', 'terror', 'blink'];
export type NicoV3SheetProps = {shot: 'lineup' | 'faces' | 'mood' | 'closeup' | 'head' | 'headfaces'; lw: number; glb?: string};

export const useNicoV3 = (glb = 'assets/3d/nico/nico-v3.glb') => {
	const [g, setG] = useState<THREE.Group | null>(null);
	const [handle] = useState(() => delayRender('nico v3 glb'));
	useEffect(() => {
		new GLTFLoader().load(staticFile(glb), (x) => { setG(x.scene); continueRender(handle); }, undefined, (e) => { console.error(e); continueRender(handle); });
	}, [handle]);
	return g;
};

/** Toon Nico v3: toon materials (the face decals keep their pixel textures), setFace swaps the visible decal. */
export const makeNicoV3 = (src: THREE.Group) => {
	const g = skClone(src) as THREE.Group;
	const decals = new Map<string, THREE.Object3D>();
	let paintedModel = false;
	g.traverse((o) => {
		const m = o as THREE.Mesh;
		if (!m.isMesh) return;
		m.frustumCulled = false;
		const old = m.material as THREE.MeshStandardMaterial;
		const fm = /nico_face_(\w+)/.exec(m.name) || /nico_face_(\w+)/.exec(m.parent?.name ?? '');
		const painted = !!m.geometry.getAttribute('color');
		if (fm && painted) {
			// WildSignal look: the painted bands are in the vertex colours; the renderer adds only a little light
			const mat = new THREE.MeshBasicMaterial({vertexColors: true, map: old.map ?? null});
			if (old.map) { old.map.magFilter = THREE.NearestFilter; old.map.minFilter = THREE.NearestFilter; old.map.generateMipmaps = false; }
			mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2;
			m.material = mat; m.renderOrder = 2; decals.set(fm[1], m); paintedModel = true;
			return;
		}
		if (painted) { m.material = new THREE.MeshBasicMaterial({vertexColors: true}); paintedModel = true; return; }
		if (fm) {
			const mat = toon(0xffffff);
			if (old.map) { old.map.magFilter = THREE.NearestFilter; old.map.minFilter = THREE.NearestFilter; old.map.generateMipmaps = false; mat.map = old.map; }
			mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2;
			m.material = mat; m.renderOrder = 2;
			decals.set(fm[1], m);
			return;
		}
		m.material = toon(old.color);
	});
	const setFace = (e: NicoExprV3) => decals.forEach((o, k) => { o.visible = k === e; });
	setFace('tired');
	const rest = new Map<THREE.Object3D, THREE.Quaternion>();
	g.traverse((o) => { if ((o as THREE.Bone).isBone) rest.set(o, o.quaternion.clone()); });
	return {root: g, bone: (n: string) => g.getObjectByName(n)!, rest, setFace, painted: paintedModel};
};

const Scene: React.FC<{src: THREE.Group; shot: NicoV3SheetProps['shot']}> = ({src, shot}) => {
	const {camera} = useThree();
	const people = useMemo(() => {
		if (shot === 'head') return [0, -0.62, -Math.PI / 2, Math.PI * 0.8].map((t, i) => {
			const n = makeNicoV3(src); n.root.rotation.y = t; n.root.position.x = (i - 1.5) * 0.3; return n;
		});
		if (shot === 'headfaces') return EXPRS_V3.map((e, i) => {
			const n = makeNicoV3(src); n.setFace(e); n.root.rotation.y = -0.25; n.root.position.x = (i - 3) * 0.22; return n;
		});
		if (shot === 'closeup') return [0, -0.62, -Math.PI / 2].map((t, i) => {
			const n = makeNicoV3(src); n.root.rotation.y = t; n.root.position.x = (i - 1) * 0.42; return n;
		});
		if (shot !== 'faces') return [0, -0.62, -Math.PI / 2, Math.PI].map((t, i) => {
			const n = makeNicoV3(src); n.root.rotation.y = t; n.root.position.x = (i - 1.5) * 0.9; return n;
		});
		return EXPRS_V3.map((e, i) => {
			const n = makeNicoV3(src); n.setFace(e); n.root.position.x = (i - 3) * 0.36; return n;
		});
	}, [src, shot]);
	const cam = camera as THREE.PerspectiveCamera;
	if (shot === 'head') { cam.position.set(0, 1.52, 16); cam.fov = 2.4; cam.lookAt(0, 1.5, 0); }
	else if (shot === 'headfaces') { cam.position.set(0, 1.52, 16); cam.fov = 2.9; cam.lookAt(0, 1.52, 0); }
	else if (shot === 'closeup') { cam.position.set(0, 1.5, 16); cam.fov = 3.3; cam.lookAt(0, 1.5, 0); }
	else if (shot === 'faces') { cam.position.set(0, 1.5, 16); cam.fov = 5.2; cam.lookAt(0, 1.5, 0); }
	else { cam.position.set(0, 0.86, 22); cam.fov = 5.6; cam.lookAt(0, 0.86, 0); }
	cam.updateProjectionMatrix();
	const mood = shot === 'mood';
	if (people[0]?.painted) return (
		<>
			{/* WildSignal-style light: a lavender ambient carries the painted colours; a weak warm sun adds a little form */}
			<color attach="background" args={['#9c9aae']} />
			<ambientLight intensity={0.92} color="#ffffff" />
			<directionalLight position={[-3, 3.2, 6]} intensity={0.32} color="#fff0dc" />
			{people.map((p, i) => <primitive key={i} object={p.root} />)}
		</>
	);
	return (
		<>
			<color attach="background" args={[mood ? '#14191a' : '#bebebf']} />
			<ambientLight intensity={mood ? 0.35 : 0.9} color={mood ? '#6a7890' : '#ffffff'} />
			<directionalLight position={[-3, 3.2, 6]} intensity={mood ? 2.0 : 2.0} color={mood ? '#ffcf9a' : '#fff4e8'} />
			{mood && <directionalLight position={[3, 2, -3]} intensity={1.0} color="#7fa0ff" />}
			{people.map((p, i) => <primitive key={i} object={p.root} />)}
		</>
	);
};

export const NicoV3Sheet: React.FC<NicoV3SheetProps> = ({shot, lw, glb}) => {
	const src = useNicoV3(glb);
	const lh = Math.round((lw * 9) / 16);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: lw, height: lh, transform: `scale(${1920 / lw})`, transformOrigin: '0 0'}}>
				<ThreeCanvas width={lw} height={lh} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 6, near: 0.5, far: 80}} style={{imageRendering: 'pixelated'}}>
					{src && <Scene src={src} shot={shot} />}
				</ThreeCanvas>
			</div>
		</AbsoluteFill>
	);
};
