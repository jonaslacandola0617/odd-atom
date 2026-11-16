// Episode 51: "Po Po Po" (Season 6 opener: a teenager's summer at his grandparents' farmhouse in the Japanese
// countryside, retold in our own words from a 2ch post; no real village, family or shrine). English, Jack.
// The PSX models; hard cuts only; a score of this episode's own; a seamless loop (the last shot is the first
// shot, on negative time).
// Form: "daylight bookends and a sealed room". Overexposed summer outside (the hat gliding along the top of
// a hedge taller than a man); inside, the upstairs room sealed with newspaper and salt, one bulb, held
// locked-off through the night. The scare mechanism is imitation: it borrows Grandpa's voice at the door
// while Grandpa sits beside me, shaking his head. Wrong motion: a figure 2.75 m tall who folds at the waist,
// her neck stretching down to bring her head to a man's height. The face is shown once (the window).
// Cast: me Character_10; Grandpa Character_29; Grandma Character_29_Female; her Character_Monster_03 (hollow eyes, black hair), pale,
// stretched, in a built dress and hat.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep51-popo-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARMS_DOWN, merge, Pose, PsxCharacter} from '../psx/models';
import {Box} from '../ep41/world';
import {Car, DOOR, drawShadow, Garden, HEDGE, Her, MatsProvider, Road, Room, SaltBowl, shadowCanvas, SlidingDoor, useM, V3, W1} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep51Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep51_sound.py reads the same rules)
export const K = {
	hatStop: 4.2, // the hat stops in front of me
	peek: 5.6, // she rises: a pale forehead and two dark eyes over the hedge
	cutGrandpa: L.l02.start - 0.35,
	grandpaTurn: L.l02.start + 0.5,
	cutSeal: L.l02.start + 3.5,
	cutSalt: L.l02.start + 7.0,
	cutDoor: L.l03.start - 0.3,
	shut: L.l03.end - 0.6, // the door slides shut (a clack)
	cutNight: L.l03.end + 0.3,
	subliminal: L.l03.end + 5.45, // two frames of her shadow, in the silence
	taps: [0.6, 1.5, 2.0].map((d) => L.l04.start + 3.3 + d), // single taps, W1, W2, W1
	tapsAll: L.l04.start + 5.1, // every window at once
	popo: L.l04.end + 0.25, // "po po po" outside, in the gap
	cutShadow: L.l04.end + 1.0,
	fold: [L.d01.start + 0.1, L.d01.start + 2.6], // she folds down at the waist
	drop: [L.d01.start + 2.6, L.d01.start + 4.2], // her neck stretches her head down to my height
	tilt: L.d01.end + 0.35, // her head tips to listen
	cutTwo: L.l06.start - 0.4,
	cutTear: L.l06.end + 0.15,
	tear: L.l06.end + 0.3, // the newspaper rips off the window (the stinger)
	cutRoad: L.l07.start - 0.25,
	cutCar: L.l07.start + 4.0,
	loopShot: DUR - 1.8,
};
export const STINGERS = [K.tear];

type Shot = 'hook' | 'grandpa' | 'seal' | 'salt' | 'door' | 'night' | 'shadow' | 'two' | 'tear' | 'road' | 'car';
const CUTS: [number, Shot][] = [
	[K.cutGrandpa, 'hook'],
	[K.cutSeal, 'grandpa'],
	[K.cutSalt, 'seal'],
	[K.cutDoor, 'salt'],
	[K.cutNight, 'door'],
	[K.cutShadow, 'night'],
	[K.cutTwo, 'shadow'],
	[K.cutTear, 'two'],
	[K.cutRoad, 'tear'],
	[K.cutCar, 'road'],
	[K.loopShot, 'car'],
];
const shotOf = (t: number): Shot => (t < 0 ? 'hook' : CUTS.find(([c]) => t < c)?.[1] ?? 'hook');
type Look = 'day' | 'dusk' | 'night' | 'dawn';
const lookOf = (s: Shot): Look => (s === 'hook' || s === 'grandpa' ? 'day' : s === 'seal' || s === 'salt' || s === 'door' ? 'dusk' : s === 'road' || s === 'car' ? 'dawn' : 'night');

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number};
const aim = (camera: THREE.Camera, pose: CamPose) => {
	camera.position.set(...pose.p);
	camera.up.set(0, 1, 0);
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.02;
	c.far = 200;
	c.updateProjectionMatrix();
};
const Cam: React.FC<{get: () => CamPose}> = ({get}) => {
	const {camera} = useThree();
	useFrame(() => aim(camera, get()));
	aim(camera, get());
	return null;
};
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const move = (t: number, t0: number, t1: number, a: V3, b: V3, la: V3, lb: V3, fov: number, shake = 0.2): CamPose => {
	const k = ease(lin(t, t0, t1));
	const hh = handheld(t, shake);
	const p = mix3(a, b, k);
	return {p: [p[0] + hh.dp[0] * 0.2, p[1] + hh.dp[1] * 0.2, p[2]], l: mix3(la, lb, k), fov};
};
const carZ = (t: number) => -3.2 * (t - K.cutRoad);

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			// standing on the engawa, looking up at the hedge top; a slow push across the whole hook
			return move(t, -1.8, K.cutGrandpa, [0.25, 1.85, 0.2], [0.18, 1.88, -0.7], [-0.1, 2.45, HEDGE.z], [-0.05, 2.62, HEDGE.z], 46, 0.08);
		case 'grandpa':
			return move(t, K.cutGrandpa, K.cutSeal, [0.3, 1.52, -0.35], [0.32, 1.53, -0.6], [0.4, 1.5, -1.3], [0.4, 1.5, -1.3], 44, 0.06);
		case 'seal':
			return move(t, K.cutSeal, K.cutSalt, [0.55, 1.55, -0.55], [0.45, 1.5, -0.75], [-0.55, 1.3, -1.75], [-0.55, 1.28, -1.8], 50, 0.08);
		case 'salt':
			return move(t, K.cutSalt, K.cutDoor, [0.95, 0.62, -0.95], [1.05, 0.55, -1.05], [1.7, 0.12, -1.7], [1.7, 0.1, -1.7], 46, 0.03);
		case 'door':
			return move(t, K.cutDoor, K.cutNight, [0.0, 1.15, 0.2], [0.25, 1.12, 0.15], [2, 1.05, 0], [2, 1.05, 0], 50, 0.05);
		case 'night':
			// locked off in the far corner, low, the near salt bowl in the foreground
			return {p: [1.75, 0.55, 1.75], l: [-0.75, 0.48, -1.15], fov: 52};
		case 'shadow':
			return move(t, K.cutShadow, K.cutTwo, [0.1, 0.95, 0.05], [0.35, 0.95, 0.03], [2, 0.95, 0], [2, 0.95, 0], 58, 0.03);
		case 'two':
			return move(t, K.cutTwo, K.cutTear, [0.55, 0.95, 0.7], [0.4, 0.92, 0.5], [-0.62, 0.8, -0.38], [-0.62, 0.8, -0.38], 50, 0.04);
		case 'tear': {
			const c = move(t, K.cutTear, K.cutRoad, [W1[0], 1.33, -1.25], [W1[0], 1.34, -1.33], [W1[0], 1.35, -2], [W1[0], 1.35, -2], 52, 0.02);
			const jolt = lin(t, K.tear, K.tear + 0.06) * (1 - lin(t, K.tear + 0.06, K.tear + 0.5));
			return {...c, p: [c.p[0] + 0.02 * jolt, c.p[1] - 0.02 * jolt, c.p[2] + 0.05 * jolt]};
		}
		case 'road': {
			const z = carZ(t);
			const c = move(t, K.cutRoad, K.cutCar, [-3.8, 2.4, z + 7.5], [-3.6, 2.3, z + 6.6], [-0.2, 1.0, z - 0.5], [-0.2, 1.0, z - 0.5], 44, 0.25);
			return c;
		}
		case 'car':
			return move(t, K.cutCar, K.loopShot, [0.66, 1.28, -0.05], [0.6, 1.26, -0.02], [-0.9, 1.3, 0.22], [-0.9, 1.3, 0.22], 54, 0.15);
	}
};

// ------------------------------------------------------------------ the family
/** sitting on the floor hugging my knees */
const KNEES: Pose = {
	LeftUpLeg: [['aim', [0.12, 0.42, 1]]],
	RightUpLeg: [['aim', [-0.12, 0.42, 1]]],
	LeftLeg: [['aim', [0, -1, 0.12]]],
	RightLeg: [['aim', [0, -1, 0.12]]],
	LeftArm: [['aim', [0.18, -0.45, 1]]],
	RightArm: [['aim', [-0.18, -0.45, 1]]],
	LeftForeArm: [['aim', [-0.75, 0.05, 0.6]]],
	RightForeArm: [['aim', [0.75, 0.05, 0.6]]],
	Spine: [['x', 0.3]],
};
/** kneeling, sitting back on the heels */
const SEIZA: Pose = {
	LeftUpLeg: [['aim', [0.1, -0.6, 0.85]]],
	RightUpLeg: [['aim', [-0.1, -0.6, 0.85]]],
	LeftLeg: [['aim', [0, -0.05, -1]]],
	RightLeg: [['aim', [0, -0.05, -1]]],
	LeftArm: [['aim', [0.25, -1, 0.35]]],
	RightArm: [['aim', [-0.25, -1, 0.35]]],
	LeftForeArm: [['aim', [0.0, -0.25, 1]]],
	RightForeArm: [['aim', [0.0, -0.25, 1]]],
};
const ME_AT: V3 = [-0.3, -0.74, -0.5];
const SHOULDER = {r: [0, 0, 0] as V3};
const Me: React.FC<{t: number; bow?: number}> = ({t, bow = 0}) => (
	<PsxCharacter
		name="Character_10"
		height={1.62}
		position={ME_AT}
		rotation={[0, 0.5, 0]}
		probe={(w) => {
			SHOULDER.r = w('RightShoulder').toArray() as V3;
		}}
		pose={merge(KNEES, {Spine1: [['x', 0.03 * Math.sin(t * 2.3)]], Neck: [['x', 0.15 + 0.35 * bow]], Head: [['x', 0.1 + 0.25 * bow]]})}
	/>
);
const Grandpa: React.FC<{t: number; shake?: number; hand?: boolean}> = ({t, shake = 0, hand}) => {
	const sh = shake * 0.32 * Math.sin((t - K.cutTwo) * Math.PI * 1.6);
	return (
		<PsxCharacter
			name="Character_29"
			height={1.64}
			position={[-0.95, -0.49, -0.22]}
			rotation={[0, 0.9, 0]}
			pose={merge(SEIZA, {Spine2: [['x', 0.02 * Math.sin(t * 1.9)]], Neck: [['y', sh * 0.5], ['x', 0.12]], Head: [['y', sh * 0.5]]})}
		/>
	);
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const look = lookOf(shot);
	const cam = (
		<>
			<Cam get={() => poseAt(t, shot)} />
			<color attach="background" args={[look === 'day' ? '#a9bccb' : look === 'dawn' ? '#c2c8ce' : '#000000']} />
		</>
	);
	// one fog, always attached (three.js compiles it into each material), pushed out of range where unused
	const fog = look === 'dawn' ? <fog attach="fog" args={['#b8bec4', 6, 46]} /> : look === 'day' ? <fog attach="fog" args={['#c8d2d8', 18, 70]} /> : <fog attach="fog" args={['#000000', 400, 500]} />;

	if (shot === 'hook' || shot === 'grandpa') {
		const x = -2.7 + 2.7 * ease(lin(t, -1.8, K.hatStop));
		const walking = t < K.hatStop;
		const y = 0.12 + 0.4 * ease(lin(t, K.peek, K.peek + 1.2));
		const roll = 0.32 * ease(lin(t, K.peek + 1.6, K.peek + 2.4));
		const pale = shot === 'grandpa' ? ease(lin(t, K.grandpaTurn + 1.2, K.grandpaTurn + 2.6)) : 0;
		return (
			<>
				{cam}
				{fog}
				<ambientLight intensity={2.6 - 0.8 * pale} color={pale > 0 ? '#d8dce8' : '#fff4e0'} />
				<directionalLight position={[4, 9, 3]} intensity={1.6 - 0.6 * pale} color="#fff8e8" />
				<Garden />
				{shot === 'hook' && <Her p={[x, y, HEDGE.z - 0.95]} ry={0} t={t} pose={{fold: 0, stride: walking ? t * 2.4 : 0, headRoll: roll}} />}
				{shot === 'grandpa' && (
					<>
						<pointLight position={[0.3, 1.6, -0.6]} intensity={1.2 * (1 - pale)} distance={2.5} decay={1} color="#ffd8a8" />
						<PsxCharacter
							name="Character_29"
							height={1.64}
							position={[0.4, 0, -1.3]}
							rotation={[0, 0, 0]}
							pose={merge(ARMS_DOWN, {
								Neck: [['y', 0.55 * ease(lin(t, K.grandpaTurn, K.grandpaTurn + 0.5)) * (1 - ease(lin(t, K.grandpaTurn + 1.6, K.grandpaTurn + 2.0)))]],
								Head: [['y', 0.55 * ease(lin(t, K.grandpaTurn, K.grandpaTurn + 0.5)) * (1 - ease(lin(t, K.grandpaTurn + 1.6, K.grandpaTurn + 2.0)))], ['x', -0.05]],
							})}
						/>
					</>
				)}
			</>
		);
	}
	if (shot === 'road' || shot === 'car') {
		const z = shot === 'road' ? carZ(t) : 0;
		const bump = Math.sin(t * 9.3) * 0.5 + Math.sin(t * 5.1) * 0.5;
		return (
			<>
				{cam}
				{fog}
				<ambientLight intensity={2.2} color="#c8d0d8" />
				<directionalLight position={[-6, 5, -10]} intensity={0.8} color="#e8e0d8" />
				{shot === 'road' ? (
					<>
						<Road z={z} />
						<Car z={z} bump={bump} />
						<Her p={[-0.62, 0, z + 0.55]} ry={Math.PI} t={t} pose={{fold: 1, stride: t * 2.6, headYaw: -1.25, drop: 0.55}} />
					</>
				) : (
					<CarInside t={t} />
				)}
			</>
		);
	}
	// the room: dusk (sealing it) or night
	const night = look === 'night';
	const salt = shot === 'seal' || shot === 'salt' || shot === 'door' ? 0 : lin(t, K.cutNight + 2.5, K.taps[0]);
	const nearSalt = shot === 'night' ? ease(lin(t, K.cutNight + 1.3, K.taps[0] - 0.8)) : shot === 'seal' || shot === 'salt' || shot === 'door' ? 0 : 1;
	const tapAt = (at: number) => Math.max(0, 1 - Math.abs(t - at) / 0.09);
	const all = t > K.tapsAll && t < K.tapsAll + 0.9 ? 0.6 + 0.4 * Math.abs(Math.sin((t - K.tapsAll) * 38)) : 0;
	const press = [Math.max(tapAt(K.taps[0]), tapAt(K.taps[2]), all), Math.max(tapAt(K.taps[1]), all * 0.9)];
	const tear = shot === 'tear' ? ease(lin(t, K.tear, K.tear + 0.18)) : 0;
	const doorOpen = shot === 'door' ? 1 - ease(lin(t, K.shut - 1.0, K.shut)) : 0;
	const lampBoost = all > 0 ? 0.25 * Math.sin(t * 60) : 0;
	return (
		<>
			{cam}
			{fog}
			<ambientLight intensity={night ? 1.3 : 1.9} color={night ? '#5a5040' : '#8a7458'} />
			<pointLight position={[-0.2, 1.62, -0.2]} intensity={(night ? 2.6 : 1.0) + lampBoost} distance={5.5} decay={1} color="#ffd89a" />
			{!night && <pointLight position={[W1[0], 1.4, -1.4]} intensity={1.2} distance={3.5} decay={1} color="#ff9a50" />}
			<Room press={press} tear={tear} salt={salt} nearSalt={nearSalt} doorOpen={doorOpen} t={t} dusk={!night} cover={shot === 'seal' ? ease(lin(t, K.cutSeal + 0.4, K.cutSalt - 0.6)) : 1} hideDoor={shot === 'shadow'} />
			{shot === 'seal' && (
				<PsxCharacter
					name="Character_29_Female"
					height={1.5}
					tint={{color: '#6e6470'}}
					position={[W1[0] + 0.1, 0, -1.55]}
					rotation={[0, Math.PI, 0]}
					pose={merge(ARMS_DOWN, {
						LeftArm: [['aim', [0.5, 0.75, 0.7]]],
						RightArm: [['aim', [-0.5, 0.75, 0.7]]],
						LeftForeArm: [['aim', [0.1, 0.9, 0.6]]],
						RightForeArm: [['aim', [-0.1, 0.9, 0.6]]],
						Neck: [['x', -0.25]],
					})}
				/>
			)}
			{shot === 'salt' && <SaltPour t={t} />}
			{shot === 'door' && (
				<>
					<Hall />
					<PsxCharacter
						name="Character_29_Female"
						height={1.5}
						position={[2.55, 0, 0.02]}
						rotation={[0, -Math.PI / 2, 0]}
						pose={merge(ARMS_DOWN, {RightArm: [['aim', [-0.35, -0.2, 1]]], RightForeArm: [['aim', [-0.6, 0.2, 0.6]]], Neck: [['x', 0.12]], Head: [['x', 0.06]]})}
					/>
				</>
			)}
			{(shot === 'night' || shot === 'two') && (
				<>
					<Me t={t} bow={shot === 'two' ? 0.2 : 0.6} />
					<Grandpa t={t} shake={shot === 'two' ? ease(lin(t, L.l06.start + 2.0, L.l06.start + 2.6)) : 0} hand={shot === 'two'} />
				</>
			)}
			{shot === 'shadow' && <ShadowDoor t={t} />}
			{shot === 'tear' && <Face t={t} />}
		</>
	);
};

/** salt poured into the corner bowl from above (Grandma's dish just out of frame) */
const SaltPour: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const k = ease(lin(t, K.cutSalt + 0.2, K.cutDoor - 0.4));
	const pouring = t < K.cutDoor - 0.4;
	return (
		<>
			<group position={[1.7, 0, -1.7]}>
				<mesh position={[0, 0.03, 0]} material={M.bowl}>
					<cylinderGeometry args={[0.09, 0.055, 0.06, 10]} />
				</mesh>
				<mesh position={[0, 0.055 + 0.03 * k, 0]} scale={[0.3 + 0.7 * k, 0.15 + 0.85 * k, 0.3 + 0.7 * k]} material={M.white}>
					<coneGeometry args={[0.08, 0.07, 10]} />
				</mesh>
			</group>
			{pouring && <Box p={[1.7, 0.7, -1.7]} s={[0.006, 1.2, 0.006]} m={M.white} />}
		</>
	);
};
/** the corridor outside the sliding door: dark boards and one lamp */
const Hall: React.FC = () => {
	const M = useM();
	return (
		<group>
			<Box p={[2.9, -0.02, 0]} s={[1.8, 0.04, 4]} m={M.darkwood} />
			<Box p={[3.8, 1.2, 0]} s={[0.06, 2.4, 4]} m={M.plaster} />
			<Box p={[2.9, 2.4, 0]} s={[1.8, 0.04, 4]} m={M.ceil} />
			<pointLight position={[3.2, 2.0, 0.6]} intensity={1.6} distance={3.5} decay={1} color="#ffcf8a" />
		</group>
	);
};
/** her shadow on the door's paper (a canvas drawn every frame) */
const ShadowDoor: React.FC<{t: number}> = ({t}) => {
	const {canvas, texture, mat} = useMemo(() => {
		const canvas = shadowCanvas();
		const texture = new THREE.CanvasTexture(canvas);
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
		texture.generateMipmaps = false;
		texture.colorSpace = THREE.SRGBColorSpace;
		const mat = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
		return {canvas, texture, mat};
	}, []);
	const fold = ease(lin(t, K.fold[0], K.fold[1]));
	const drop = ease(lin(t, K.drop[0], K.drop[1]));
	const tilt = 0.55 * ease(lin(t, K.tilt, K.tilt + 0.5));
	const speaking = t > L.d01.start && t < L.d01.end ? Math.abs(Math.sin((t - L.d01.start) * 9.5)) : 0;
	const lamp = 0.85 + 0.15 * Math.sin(t * 7.1) * Math.sin(t * 2.3);
	drawShadow(canvas, fold, drop, tilt, speaking, lamp);
	texture.needsUpdate = true;
	return <SlidingDoor open={0} paperMat={mat} />;
};
/** her face at the window, the paper torn away: her body lies along the outside of the wall (out of sight),
 *  so the head comes in sideways; Monster_03's own hollow eyes and open mouth, and black blood that runs
 *  straight down (world down, across her sideways face) from both eyes and the mouth, longer the longer we hold */
const FB = {head: new THREE.Vector3(), top: new THREE.Vector3(), ok: false};
// measured on Monster_03 with markers: its sockets and open mouth in the face frame
const BLOOD_SRC: V3[] = [[0.1, 0.15, 0.21], [0.0, 0.12, 0.21], [0.069, -0.01, 0.21]];
const Face: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const head: V3 = [W1[0] + 0.12, 1.36, -2.24];
	const breathe = 0.004 * Math.sin(t * 3);
	const slide = 0.06 * (1 - ease(lin(t, K.tear - 0.1, K.tear + 0.9))); // she settles to the glass
	const feat = React.useRef<THREE.Group>(null);
	const drips = React.useRef<(THREE.Mesh | null)[]>([]);
	const ooze = [0.01 + 0.075 * ease(lin(t, K.tear + 0.2, K.tear + 2.4)), 0.01 + 0.09 * ease(lin(t, K.tear + 0.5, K.tear + 2.6)), 0.015 + 0.11 * ease(lin(t, K.tear + 0.1, K.tear + 2.2))];
	const beads = React.useRef<(THREE.Mesh | null)[]>([]);
	const place = () => {
		const g = feat.current;
		if (!g || !FB.ok) return;
		const up = FB.top.clone().sub(FB.head);
		const len = up.length();
		up.normalize();
		const front = new THREE.Vector3(0, 0, 1);
		const side = new THREE.Vector3().crossVectors(up, front).normalize();
		const m = new THREE.Matrix4().makeBasis(side, up, front);
		g.quaternion.setFromRotationMatrix(m);
		g.position.copy(FB.head).addScaledVector(up, 0.35 * len);
		g.scale.setScalar(len / 0.276);
		g.visible = true;
		g.updateMatrixWorld(true);
		BLOOD_SRC.forEach((src, i) => {
			const d = drips.current[i];
			if (!d) return;
			const w = g.localToWorld(new THREE.Vector3(...src));
			const parent = d.parent!;
			parent.updateMatrixWorld(true);
			const l = parent.worldToLocal(w.clone());
			d.position.set(l.x, l.y - ooze[i] / 2, l.z + 0.002);
			d.scale.set(1, ooze[i], 1);
			d.visible = true;
			const bd = beads.current[i];
			if (bd) {
				bd.position.set(l.x, l.y - ooze[i], l.z + 0.003);
				bd.visible = true;
			}
		});
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<>
			<pointLight position={[W1[0], 1.36, -1.7]} intensity={1.6} distance={1.4} decay={1} color="#e8e0d0" />
			<group position={[0, breathe, slide]}>
				<PsxCharacter
					name="Character_Monster_03"
					height={2.75}
					tint={{color: '#e8e6de', emissive: '#22221e'}}
					position={[head[0] + 2.432, head[1], head[2]]}
					rotation={[0, 0, Math.PI / 2]}
					pose={ARMS_DOWN}
					probe={(w) => {
						FB.head.copy(w('Head'));
						FB.top.copy(w('HeadTop_End'));
						FB.ok = true;
					}}
				/>
				{/* in the face's own frame: x across, y up the head, z out of the face */}
				<group ref={feat} visible={false}>
					{/* her hat brim, crushed against the glass above her head */}
					<mesh position={[0, 0.2, -0.02]} material={M.hat}>
						<cylinderGeometry args={[0.36, 0.36, 0.025, 14]} />
					</mesh>
				</group>
				{/* the blood, in world down */}
				{BLOOD_SRC.map((_, i) => (
					<mesh key={i} ref={(r) => (drips.current[i] = r)} visible={false} material={M.blood}>
						<boxGeometry args={[i === 2 ? 0.011 : 0.007, 1, 0.004]} />
					</mesh>
				))}
				{BLOOD_SRC.map((_, i) => (
					<mesh key={'b' + i} ref={(r) => (beads.current[i] = r)} visible={false} material={M.blood}>
						<boxGeometry args={[i === 2 ? 0.018 : 0.012, 0.014, 0.005]} />
					</mesh>
				))}
			</group>
		</>
	);
};
/** inside the car at dawn: the back seat, me by the left window, and her outside keeping pace */
const CarInside: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const z = -3.2 * (t - K.cutCar);
	const bob = 0.01 * Math.sin(t * 9.3);
	return (
		<>
			<group position={[0, 0, -z]}>
				<group position={[0, 0, z]}>
					<Road z={z} />
				</group>
			</group>
			<group position={[0, 0.25 + bob, 0]}>
				{/* the cabin: floor, roof, the back of the front seats, the seat behind me, the left door and window */}
				<Box p={[0, 0.05, 0]} s={[1.7, 0.06, 1.8]} m={M.trim} />
				<Box p={[0, 1.5, 0]} s={[1.7, 0.04, 1.8]} m={M.trim} />
				<Box p={[0, 0.55, 0.45]} s={[1.5, 0.95, 0.15]} m={M.seat} />
				<Box p={[0, 0.3, 0.1]} s={[1.5, 0.12, 0.55]} m={M.seat} />
				<Box p={[-0.84, 0.35, 0]} s={[0.06, 0.6, 1.8]} m={M.trim} />
				<Box p={[-0.84, 1.45, 0]} s={[0.06, 0.12, 1.8]} m={M.trim} />
				<Box p={[-0.84, 1.02, -0.62]} s={[0.07, 0.9, 0.1]} m={M.trim} />
				<Box p={[-0.84, 1.02, 0.62]} s={[0.07, 0.9, 0.1]} m={M.trim} />
			</group>
			<PsxCharacter name="Character_10" height={1.62} position={[-0.38, -0.2 + 0.25 + bob, 0.32]} rotation={[0, Math.PI, 0]} pose={merge(ARMS_DOWN, {
				LeftUpLeg: [['aim', [0.06, -0.08, 1]]],
				RightUpLeg: [['aim', [-0.06, -0.08, 1]]],
				LeftLeg: [['aim', [0, -1, 0.06]]],
				RightLeg: [['aim', [0, -1, 0.06]]],
				LeftArm: [['aim', [0.2, -1, 0.3]]],
				RightArm: [['aim', [-0.2, -1, 0.3]]],
				LeftForeArm: [['aim', [-0.3, -0.3, 1]]],
				RightForeArm: [['aim', [0.3, -0.3, 1]]],
				Neck: [['x', 0.55]],
				Head: [['x', 0.35]],
			})} />
			{/* her, outside the window, bent double and keeping pace; her hand flat on the glass */}
			<Her p={[-1.25, 0, 0.9]} ry={Math.PI} t={t} pose={{fold: 1, stride: t * 2.6, headYaw: -1.3, drop: 0.75}} reach={{arm: 'Right', target: [-0.88, 1.12, 0.3]}} />
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, grain, the subliminal frames
const Overlay: React.FC<{t: number; captions: boolean; look: Look}> = ({t, captions, look}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	const flash = useRef<HTMLCanvasElement>(null);
	const sub = t >= K.subliminal && t < K.subliminal + 2 / 30;
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = cap.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		const line = timeline.lines.find((l) => t >= l.start - 0.05 && t < l.end + 0.35);
		if (captions && line) {
			const door = line.kind === 'door';
			const words = (door ? `"${line.text}"` : line.text).split(' ');
			const rows: string[] = [];
			let cur = '';
			for (const w of words) {
				if ((cur + ' ' + w).trim().length > 28) {
					rows.push(cur.trim());
					cur = w;
				} else cur += ' ' + w;
			}
			rows.push(cur.trim());
			const nPages = Math.ceil(rows.length / 2);
			const per = Math.ceil(rows.length / nPages);
			const pages: string[][] = [];
			for (let i = 0; i < rows.length; i += per) pages.push(rows.slice(i, i + per));
			const total = pages.reduce((n, pg) => n + pg.join(' ').length, 0);
			let acc = 0;
			let show = pages[pages.length - 1];
			for (const pg of pages) {
				const pageEnd = line.start + ((acc + pg.join(' ').length) / total) * (line.end - line.start);
				acc += pg.join(' ').length;
				if (t < pageEnd) {
					show = pg;
					break;
				}
			}
			// this episode's captions: a serif, in lower case of weight, a soft dark halo; the voice at the door in pale yellow italics
			g.font = door ? 'italic 15px "DejaVu Serif", serif' : '15px "DejaVu Serif", serif';
			g.textAlign = 'center';
			show.forEach((r, i) => {
				const y = 470 + i * 20 - (show.length - 1) * 10;
				g.fillStyle = 'rgba(0,0,0,0.85)';
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) g.fillText(r, CW / 2 + dx, y + dy);
				g.fillStyle = door ? '#f0e2a0' : '#f4f0e6';
				g.fillText(r, CW / 2, y);
			});
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 110 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor((t + 600) * 24) * 7919 + 51); // the seed stays positive on the loop shot's negative time
		const amt = look === 'night' ? 26 : look === 'day' ? 12 : 18;
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = amt * (r() < 0.5 ? 1 : 0.4);
		}
		n.putImageData(ni, 0, 0);
		const f = flash.current!;
		const fg = f.getContext('2d')!;
		fg.clearRect(0, 0, f.width, f.height);
		if (sub) drawShadow(f, 1, 1, 0.55, 0, 0.7);
	}, [t, captions, look, sub]);
	return (
		<>
			<canvas ref={flash} width={72} height={144} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: sub ? 0.55 : 0, mixBlendMode: 'multiply', imageRendering: 'pixelated'}} />
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
const GRADE: Record<Look, string> = {
	// overexposed summer: bleached, warm, highlights blown
	day: 'brightness(1.32) contrast(0.86) saturate(0.62) sepia(0.12)',
	dusk: 'sepia(0.35) saturate(0.85) contrast(1.05)',
	// yellowed newspaper under one bulb
	night: 'sepia(0.55) saturate(0.9) contrast(1.18) brightness(0.92)',
	// cold valley mist at dawn
	dawn: 'saturate(0.35) contrast(0.95) brightness(1.06) hue-rotate(-10deg)',
};
const EDGE: Record<Look, string> = {
	day: 'radial-gradient(ellipse at 50% 45%, rgba(255,250,236,0) 55%, rgba(255,250,236,0.42) 100%)',
	dusk: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(30,16,4,0.6) 100%)',
	night: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 38%, rgba(10,6,2,0.82) 100%)',
	dawn: 'linear-gradient(rgba(220,228,236,0.18), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(20,24,30,0.35))',
};
(globalThis as any).EP51_PROBE = false;
export const Episode51: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = t >= K.loopShot ? t - DUR : t;
	const look = lookOf(shotOf(tv));
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: GRADE[look]}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 200}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} look={look} />
			<AbsoluteFill style={{background: EDGE[look]}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep51-popo-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
