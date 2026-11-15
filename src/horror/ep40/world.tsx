// Episode 40 world: "Patayin ang Ilaw" (Season 4 finale: Malinta Tunnel, Corregidor). A composite of the
// tunnel as visitors see it on the night lateral tour; no real guide, visitor or soldier is depicted:
// - THE LATERAL: a narrow concrete tunnel with an arched vault, sealed at its far end by rubble;
// - THE MAIN TUNNEL: wider, with pairs of old bed bolts in the floor along both walls (the 1942 hospital),
//   its mouth open to the night (or to the dawn);
// - THE ISLAND: a dark hill over the sea at night, the tunnel mouth lit sodium-yellow;
// - THE GROUP: a guide and visitors (shared blocky `Rider` figures) with flashlights; the beams are
//   spotlights with faint visible cones;
// - THE EXTRA FIGURE: a man in an old field uniform and a round helmet, head bowed, faceless, no insignia,
//   no side: only ever at the edge of a beam.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {Rider, RiderLook} from '../ep36/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);
const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep: [number, number] = [1, 1]) => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d')!);
	const t = new THREE.CanvasTexture(c);
	t.magFilter = THREE.NearestFilter;
	t.minFilter = THREE.NearestFilter;
	t.generateMipmaps = false;
	t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(rep[0], rep[1]);
	return t;
};
const seg = (v: number, unit: number) => Math.min(24, Math.max(1, Math.ceil(v / unit)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3; unit?: number}> = ({p, s, m, r, unit = 0.35}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0], unit), seg(s[1], unit), seg(s[2], unit)]} />
	</mesh>
);

// a deterministic random
const rnd = (seed: number) => {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 4294967296;
	};
};

export const useMats = () =>
	useMemo(() => {
		const concrete = tex(32, 32, (g) => {
			const r = rnd(40);
			g.fillStyle = '#8c8a82';
			g.fillRect(0, 0, 32, 32);
			for (let i = 0; i < 260; i++) {
				const v = 110 + Math.floor(r() * 50);
				g.fillStyle = `rgb(${v},${v - 2},${v - 8})`;
				g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 1, 1);
			}
			// water stains running down
			for (let i = 0; i < 5; i++) {
				const x = Math.floor(r() * 32);
				g.fillStyle = 'rgba(60,56,48,0.35)';
				g.fillRect(x, 0, 1 + Math.floor(r() * 2), 10 + Math.floor(r() * 22));
			}
			g.fillStyle = 'rgba(40,38,34,0.5)';
			g.fillRect(0, 31, 32, 1); // a form-work seam
		}, [1, 1]);
		const floor = tex(16, 16, (g) => {
			const r = rnd(41);
			g.fillStyle = '#6a665e';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 80; i++) {
				const v = 80 + Math.floor(r() * 40);
				g.fillStyle = `rgb(${v},${v - 3},${v - 9})`;
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, [1, 1]);
		return {
			concrete: lam('#ffffff', {map: concrete, side: THREE.DoubleSide}),
			floor: lam('#ffffff', {map: floor}),
			rubble: lam('#7a746a'),
			rubbleDark: lam('#4a463e'),
			bolt: lam('#2a2622'),
			black: bas('#000000'),
			hill: lam('#2a3a2c'),
			hillDark: lam('#1c261e'),
			tree: lam('#0e160e'),
			sea: lam('#14202e'),
			moon: bas('#e8ecd8'),
			sodium: bas('#ffb860'),
			mouthGlow: bas('#c88a40'),
			dawn: bas('#8a9aa8'),
			dust: bas('#c8b898'),
			olive: lam('#3e4232'),
			helmet: lam('#50543e'),
			bulb: bas('#ffc880'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
export const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

// ------------------------------------------------------------------ a tunnel section (walls, vault, floor), along -z
/** A concrete tunnel of width w from z0 down to z1 (z1 < z0): straight walls of height wh and a
 *  half-cylinder vault, built in short sections so spotlights (lit per vertex) read on it. */
export const Tunnel: React.FC<{w: number; wh: number; z0: number; z1: number; bolts?: boolean; sealed?: boolean}> = ({w, wh, z0, z1, bolts, sealed}) => {
	const m = useM();
	const L = 1.2;
	const n = Math.ceil((z0 - z1) / L);
	const r = w / 2;
	return (
		<group>
			{Array.from({length: n}, (_, i) => {
				const zc = z0 - (i + 0.5) * L;
				return (
					<group key={i}>
						<Box p={[0, -0.05, zc]} s={[w, 0.1, L]} m={m.floor} unit={0.4} />
						<Box p={[-r - 0.05, wh / 2, zc]} s={[0.1, wh, L]} m={m.concrete} unit={0.4} />
						<Box p={[r + 0.05, wh / 2, zc]} s={[0.1, wh, L]} m={m.concrete} unit={0.4} />
						<mesh position={[0, wh, zc]} rotation={[Math.PI / 2, 0, 0]} material={m.concrete}>
							<cylinderGeometry args={[r + 0.02, r + 0.02, L, 14, 2, true, Math.PI / 2, Math.PI]} />
						</mesh>
					</group>
				);
			})}
			{/* the vault seen from inside: a black outer shell so nothing leaks */}
			{bolts &&
				Array.from({length: Math.floor((z0 - z1) / 1.0)}, (_, i) => z0 - 0.6 - i * 1.0).flatMap((z) =>
					[-r + 0.55, r - 0.55].flatMap((x) =>
						[-0.28, 0.28].map((dz) => <Box key={`${x}:${z}:${dz}`} p={[x, 0.01, z + dz]} s={[0.07, 0.03, 0.07]} m={m.bolt} unit={1} />),
					),
				)}
			{sealed && <Rubble w={w} z={z1} />}
			{sealed && <Box p={[0, wh, z1 - 0.6]} s={[w + 0.4, wh * 2 + r, 0.2]} m={m.black} unit={2} />}
		</group>
	);
};

/** A collapse of concrete slabs and broken rock filling the tunnel at z, piled to the vault. */
export const Rubble: React.FC<{w: number; z: number}> = ({w, z}) => {
	const m = useM();
	const pieces = useMemo(() => {
		const r = rnd(4040);
		return Array.from({length: 46}, () => {
			const x = (r() - 0.5) * w;
			const y = r() * 3.2;
			const s = 0.25 + r() * 0.7;
			return {p: [x, y, z + 0.2 + r() * 1.4 - y * 0.25] as V3, s: [s, s * (0.4 + r() * 0.6), s * (0.5 + r() * 0.8)] as V3, r: [r() * 1.5, r() * 3, r() * 1.5] as V3, dark: r() < 0.35};
		});
	}, [w, z]);
	return (
		<group>
			{pieces.map((p, i) => (
				<Box key={i} p={p.p} s={p.s} r={p.r} m={p.dark ? m.rubbleDark : m.rubble} unit={0.3} />
			))}
			{/* a slab leaning in from the vault */}
			<Box p={[0.3, 2.4, z + 0.9]} s={[w * 0.8, 0.2, 1.6]} r={[0.7, 0.1, 0.15]} m={m.rubble} unit={0.3} />
		</group>
	);
};

/** Dust trickling from the top of the rubble: a thin falling stream of motes; k fades it in. */
export const Dust: React.FC<{t: number; p: V3; k: number}> = ({t, p, k}) => {
	const m = useM();
	if (k <= 0) return null;
	const motes = Array.from({length: 18}, (_, i) => {
		const ph = (t * 0.9 + i / 18) % 1;
		return [p[0] + Math.sin(i * 7.3) * 0.05, p[1] - ph * 2.2, p[2] + Math.cos(i * 3.1) * 0.05] as V3;
	});
	return (
		<group>
			{motes.map((q, i) => (i / 18 < k ? <Box key={i} p={q} s={[0.025, 0.05, 0.025]} m={m.dust} unit={1} /> : null))}
		</group>
	);
};

// ------------------------------------------------------------------ people
export const VISITORS: RiderLook[] = [
	{shirt: '#d8d4c8', pants: '#2a3a5a', hair: 'short', bag: true},
	{shirt: '#8a3a3a', pants: '#3a3a3a', hair: 'long'},
	{shirt: '#3a5a8a', pants: '#2a2a2a', hair: 'cap', hairColor: '#2a2a2a'},
	{shirt: '#c8b080', pants: '#4a3a2a', hair: 'long', bag: true},
	{shirt: '#5a7a5a', pants: '#2a2e3a', hair: 'short'},
	{shirt: '#4a4a52', pants: '#2a2a2e', hair: 'short'}, // me (seen only from the guide)
];
export const GUIDE: RiderLook = {shirt: '#c8a848', pants: '#2a2a2a', hair: 'cap', hairColor: '#1a1a1a'};

/** A small flashlight held at the hand, pointing along local +z. */
const torchM = new THREE.MeshLambertMaterial({color: '#202020'});
const Torch: React.FC = () => <Box p={[0, 0, 0]} s={[0.05, 0.05, 0.16]} m={torchM} unit={1} />;

export const Person: React.FC<{look: RiderLook; p: V3; ry: number; walk?: number; bow?: number; yaw?: number}> = ({look, p, ry, walk = 0, bow = 0, yaw = 0}) => (
	<group position={p} rotation={[0, ry, 0]}>
		<Rider look={look} pose="stand" walk={walk} bow={bow} yaw={yaw} />
		<group position={[0.21, 0.88, 0.12]}>
			<Torch />
		</group>
	</group>
);

/** The extra figure: an old field uniform, a round helmet, head bowed, faceless; faces local +z. */
export const Soldier: React.FC<{p: V3; ry: number; bow?: number}> = ({p, ry, bow = 0.55}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<Rider look={{shirt: '#62664c', pants: '#525440', skin: '#6e6456', hair: 'short', hairColor: '#1a1a14'}} pose="stand" bow={bow} />
			<group position={[0, 1.46, 0]} rotation={[bow, 0, 0]}>
				<mesh position={[0, 0.2, 0]} material={m.helmet}>
					<sphereGeometry args={[0.15, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
				</mesh>
				<mesh position={[0, 0.2, 0]} material={m.helmet}>
					<cylinderGeometry args={[0.2, 0.2, 0.02, 10]} />
				</mesh>
				{/* the face is shadow under the brim */}
				<Box p={[0, 0.1, 0.1]} s={[0.17, 0.16, 0.02]} m={m.black} unit={1} />
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the beams
const coneGeo = (() => {
	const g = new THREE.ConeGeometry(1, 1, 10, 1, true);
	g.translate(0, -0.5, 0);
	g.rotateX(-Math.PI / 2);
	return g;
})();
const coneMat = new THREE.MeshBasicMaterial({color: '#ffd8a0', transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide});

/** A flashlight beam from p toward target: a spotlight and a faint visible cone. on: 0..1. */
export const Beam: React.FC<{p: V3; target: V3; on: number; cone?: boolean; power?: number}> = ({p, target, on, cone = true, power = 1}) => {
	const light = useMemo(() => new THREE.SpotLight('#ffe0b0', 9, 16, 0.32, 0.55, 1), []);
	const obj = useMemo(() => new THREE.Object3D(), []);
	light.position.set(...p);
	light.target.position.set(...target);
	light.intensity = 9 * on * power;
	light.target.updateMatrixWorld();
	const d = Math.hypot(target[0] - p[0], target[1] - p[1], target[2] - p[2]);
	const len = Math.min(d, 7);
	obj.position.set(...p);
	obj.lookAt(...target);
	return (
		<>
			<primitive object={light} />
			<primitive object={light.target} />
			{cone && on > 0.02 && (
				<mesh geometry={coneGeo} material={coneMat} position={p} quaternion={obj.quaternion} scale={[len * 0.33, len * 0.33, len]} />
			)}
		</>
	);
};

// ------------------------------------------------------------------ the island at night
export const Island: React.FC<{t: number}> = ({t}) => {
	const m = useM();
	const trees = useMemo(() => {
		const r = rnd(4041);
		return Array.from({length: 40}, () => {
			const a = r() * Math.PI - Math.PI / 2;
			const rr = 6 + r() * 14;
			return {p: [Math.sin(a) * rr, 0, -Math.cos(a) * rr * 0.6 - 4] as V3, h: 1.2 + r() * 2};
		});
	}, []);
	return (
		<group>
			{/* the sea, with a moon path */}
			<Box p={[0, -0.6, 20]} s={[80, 0.1, 50]} m={m.sea} unit={4} />
			{Array.from({length: 14}, (_, i) => (
				<Box key={i} p={[-6 + Math.sin(i * 2.1 + t * 0.8) * 0.4, -0.54, 40 - i * 2.4]} s={[0.6 + (i % 3) * 0.3, 0.02, 0.12]} m={m.moon} unit={2} />
			))}
			<mesh position={[-9, 14, -40]} material={m.moon}>
				<sphereGeometry args={[1.6, 10, 8]} />
			</mesh>
			{/* the hill */}
			<mesh position={[0, -1, -10]} scale={[22, 9, 12]} material={m.hill}>
				<sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
			</mesh>
			<mesh position={[10, -1, -16]} scale={[14, 12, 10]} material={m.hillDark}>
				<sphereGeometry args={[1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
			</mesh>
			{trees.map((tr, i) => (
				<mesh key={i} position={[tr.p[0], 4 + tr.h * 0.5 - Math.abs(tr.p[0]) * 0.18, tr.p[2]]} material={m.tree}>
					<coneGeometry args={[0.8, tr.h * 1.6, 5]} />
				</mesh>
			))}
			{/* the portal: a concrete face cut into the hill, the arched mouth lit sodium inside */}
			<group position={[0, 0, 1.6]}>
				<Box p={[0, 2.2, 0]} s={[8, 4.6, 0.6]} m={m.concrete} unit={0.5} />
				<Box p={[0, 1.4, 0.32]} s={[3.4, 2.8, 0.05]} m={m.mouthGlow} unit={1} />
				<mesh position={[0, 2.8, 0.33]} rotation={[0, 0, 0]} material={m.mouthGlow}>
					<circleGeometry args={[1.7, 14, 0, Math.PI]} />
				</mesh>
				<Box p={[0, 3.0, 0.36]} s={[0.25, 0.15, 0.08]} m={m.bulb} unit={1} />
				{/* the path down to the mouth */}
				<Box p={[0, -0.02, 4]} s={[3, 0.1, 8]} m={m.floor} unit={0.5} />
			</group>
		</group>
	);
};
