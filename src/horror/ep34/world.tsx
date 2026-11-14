// Episode 34 world: "Paatras" (Season 4, Visayan and Mindanao folklore: the sigbin). Composites:
// - THE FARM (origin): a mud yard at night; a nipa house on stilts at the back (z -6) with the child's
//   window lit; a bamboo goat pen (x +4); a dog's kennel (x -3); banana trees; a field going away
//   (+z) into the dark; a trail of cloven hoofprints from the house wall out into the field, every
//   print pointing AWAY from the house;
// - THE ROOM (x 200): inside the house: the child asleep on a banig (safe), a kerosene lamp, the
//   bamboo wall and the window onto the night;
// - THE SIGBIN: hornless, goat- or dog-like, long hind legs, short forelegs, huge ears that drag,
//   and its head hanging upside down between its hind legs, looking where it is backing to.
// - the farmer (a salakot, a kerosene lamp), the goats, the dog.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

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
const seg = (v: number) => Math.min(40, Math.max(1, Math.ceil(v / 0.35)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);
const Cyl: React.FC<{p: V3; r0: number; r1?: number; h: number; m: THREE.Material; rot?: V3; n?: number}> = ({p, r0, r1, h, m, rot, n = 7}) => (
	<mesh position={p} rotation={rot} material={m}>
		<cylinderGeometry args={[r1 ?? r0, r0, h, n, Math.max(1, Math.ceil(h / 0.35))]} />
	</mesh>
);

export const useMats = () =>
	useMemo(() => {
		const mud = tex(16, 16, (g) => {
			g.fillStyle = '#5a4a3a';
			g.fillRect(0, 0, 16, 16);
			const r = rng(7);
			for (let i = 0; i < 50; i++) {
				g.fillStyle = r() < 0.4 ? '#46382a' : r() < 0.7 ? '#6a5a46' : '#6a6a72';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1 + Math.floor(r() * 3), 1);
			}
		}, [20, 20]);
		const bamboo = tex(16, 16, (g) => {
			g.fillStyle = '#8a7a50';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#6a5a38';
			for (let x = 0; x < 16; x += 3) g.fillRect(x, 0, 1, 16);
			g.fillStyle = '#5a4a2c';
			for (let y = 0; y < 16; y += 7) g.fillRect(0, y, 16, 1);
		}, [3, 2]);
		const nipa = tex(16, 16, (g) => {
			g.fillStyle = '#5a4a34';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#3e3224';
			for (let y = 0; y < 16; y += 2) g.fillRect(0, y, 16, 1);
		}, [4, 3]);
		const hide = tex(16, 16, (g) => {
			g.fillStyle = '#3a3430';
			g.fillRect(0, 0, 16, 16);
			const r = rng(17);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() < 0.5 ? '#2a2420' : '#4a423a';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 2 + Math.floor(r() * 3));
			}
		}, [2, 2]);
		return {
			mud: lam('#ffffff', {map: mud}),
			bamboo: lam('#ffffff', {map: bamboo}),
			nipa: lam('#ffffff', {map: nipa}),
			hide: lam('#ffffff', {map: hide}),
			hideDark: lam('#221e1a'),
			print: bas('#120e0a'),
			water: bas('#4a5a70'),
			win: bas('#ffc070'),
			eye: bas('#e8d070'),
			goat: lam('#c8c0b0'),
			goat2: lam('#3a3430'),
			dog: lam('#8a6a4a'),
			wood: lam('#4a3624'),
			leaf: lam('#2a3a22', {side: THREE.DoubleSide}),
			trunk: lam('#4a4a3a'),
			sky: bas('#141c30', {side: THREE.BackSide}),
			moon: bas('#d0d8e8'),
			shirt: lam('#7a6a5a'),
			pants: lam('#2a2a30'),
			skin: lam('#8a5e44'),
			salakot: lam('#a08a5a'),
			flame: bas('#ffd890'),
			glass: bas('#ffe0a0', {transparent: true, opacity: 0.4}),
			banig: lam('#a8885a'),
			blanket: lam('#7a4a4a'),
			hair: lam('#141210'),
			wall: lam('#ffffff', {map: bamboo, side: THREE.BackSide}),
			floor: lam('#5a4a34'),
			night: bas('#2a3450'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
export const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

export const HOUSE: V3 = [0, 0, -6];
export const WIN: V3 = [0.8, 1.9, -4.48]; // the child's window, on the yard side
export const PEN: V3 = [4.2, 0, -1.5];
export const KENNEL: V3 = [-3.4, 0, -2.2];
export const ROOM: V3 = [200, 0, 0];
// the trail: from under the child's window straight out into the field (+z)
export const trailZ = (i: number) => -4.2 + i * 0.42;
export const trailX = (i: number) => 0.8 + 0.12 * Math.sin(i * 0.7) + (i % 2 ? 0.12 : -0.12);
export const N_PRINTS = 60;

// ------------------------------------------------------------------ the sigbin (local forward = +z, the way its body faces)
export const Sigbin: React.FC<{p: V3; ry: number; t: number; walk: number; look?: number; eyes?: number; scale?: number}> = ({p, ry, t, walk, look = 0, eyes = 1, scale = 1}) => {
	const M = useM();
	const ph = t * 4.2;
	const s = walk * 0.35;
	return (
		<group position={p} rotation={[0, ry, 0]} scale={scale}>
			{/* the body slopes down from high hips to low shoulders */}
			<mesh position={[0, 0.78, 0.1]} rotation={[0.42, 0, 0]} scale={[0.55, 0.5, 1.15]} material={M.hide}>
				<sphereGeometry args={[0.45, 10, 8]} />
			</mesh>
			{/* long hind legs, bent backwards */}
			{[-1, 1].map((k) => (
				<group key={k} position={[k * 0.2, 0.95, -0.35]} rotation={[0.35 + k * Math.sin(ph) * s, 0, 0]}>
					<Cyl p={[0, -0.28, 0.08]} r0={0.07} r1={0.1} h={0.6} m={M.hide} rot={[0.5, 0, 0]} />
					<Cyl p={[0, -0.68, -0.05]} r0={0.035} r1={0.05} h={0.5} m={M.hideDark} rot={[-0.3, 0, 0]} />
				</group>
			))}
			{/* short forelegs */}
			{[-1, 1].map((k) => (
				<group key={k} position={[k * 0.16, 0.5, 0.55]} rotation={[-k * Math.sin(ph) * s, 0, 0]}>
					<Cyl p={[0, -0.25, 0]} r0={0.035} r1={0.05} h={0.5} m={M.hideDark} />
				</group>
			))}
			{/* the neck curls down under the belly and the head hangs upside down between the hind legs,
			    looking backwards (-z), the way it walks */}
			<Cyl p={[0, 0.48, 0.05]} r0={0.07} r1={0.09} h={0.6} m={M.hide} rot={[1.2, 0, 0]} />
			<group position={[0, 0.32 + 0.04 * Math.sin(t * 1.3), -0.38]} rotation={[Math.PI - 0.3 - look, 0, 0]}>
				<mesh scale={[0.75, 0.8, 1.3]} material={M.hide}>
					<sphereGeometry args={[0.16, 8, 6]} />
				</mesh>
				{/* the muzzle */}
				<mesh position={[0, -0.02, 0.2]} scale={[0.6, 0.6, 1]} material={M.hideDark}>
					<sphereGeometry args={[0.1, 7, 5]} />
				</mesh>
				{/* eyes: pinpoints that catch the light */}
				{[-1, 1].map((k) => (
					<mesh key={k} position={[k * 0.075, 0.06, 0.1]} material={M.eye} scale={eyes}>
						<sphereGeometry args={[0.022, 5, 4]} />
					</mesh>
				))}
				{/* huge ears, dragging */}
				{[-1, 1].map((k) => (
					<mesh key={k} position={[k * 0.14, 0.08, -0.25]} rotation={[0.3, k * 0.4, k * 0.9]} material={M.hideDark}>
						<boxGeometry args={[0.06, 0.5, 0.18, 1, 3, 1]} />
					</mesh>
				))}
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ other animals and the farmer
export const Goat: React.FC<{p: V3; ry: number; t: number; dark?: boolean; head?: number}> = ({p, ry, t, dark, head = 0}) => {
	const M = useM();
	const m = dark ? M.goat2 : M.goat;
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<Box p={[0, 0.5, 0]} s={[0.28, 0.3, 0.7]} m={m} />
			{[[-0.1, 0.25], [0.1, 0.25], [-0.1, -0.25], [0.1, -0.25]].map(([x, z], i) => (
				<Cyl key={i} p={[x, 0.18, z]} r0={0.03} h={0.36} m={m} />
			))}
			<group position={[0, 0.7, 0.4]} rotation={[0.3 + head + 0.08 * Math.sin(t * 3 + p[0]), 0, 0]}>
				<Box p={[0, 0, 0.08]} s={[0.15, 0.17, 0.25]} m={m} />
				<Box p={[0.05, 0.13, -0.02]} s={[0.03, 0.12, 0.03]} m={M.hideDark} r={[-0.5, 0, 0.2]} />
				<Box p={[-0.05, 0.13, -0.02]} s={[0.03, 0.12, 0.03]} m={M.hideDark} r={[-0.5, 0, -0.2]} />
			</group>
		</group>
	);
};
export const Dog: React.FC<{p: V3; ry: number; t: number; cower: number}> = ({p, ry, t, cower}) => {
	const M = useM();
	const shiver = 0.01 * cower * Math.sin(t * 40);
	return (
		<group position={[p[0] + shiver, p[1], p[2]]} rotation={[0, ry, 0]}>
			<Box p={[0, 0.4 - 0.12 * cower, 0]} s={[0.26, 0.26, 0.62]} m={M.dog} />
			{[[-0.09, 0.22], [0.09, 0.22], [-0.09, -0.22], [0.09, -0.22]].map(([x, z], i) => (
				<Cyl key={i} p={[x, 0.15 - 0.05 * cower, z]} r0={0.03} h={0.32 - 0.12 * cower} m={M.dog} />
			))}
			<group position={[0, 0.52 - 0.2 * cower, 0.38]} rotation={[0.3 * cower, 0, 0]}>
				<Box p={[0, 0, 0.06]} s={[0.17, 0.17, 0.22]} m={M.dog} />
				{[-1, 1].map((k) => (
					<Box key={k} p={[k * 0.07, 0.06, -0.04]} s={[0.04, 0.1, 0.06]} m={M.hideDark} r={[1.2 * cower, 0, k * (0.3 + 1.0 * cower)]} />
				))}
			</group>
		</group>
	);
};
export const Farmer: React.FC<{p: V3; ry: number; t: number; walk: number; turn?: number}> = ({p, ry, t, walk, turn = 0}) => {
	const M = useM();
	const s = Math.sin(t * 5) * walk * 0.5;
	return (
		<group position={p} rotation={[0, ry + turn, 0]}>
			{[-1, 1].map((k) => (
				<group key={k} position={[k * 0.1, 0.9, 0]} rotation={[k * s, 0, 0]}>
					<Box p={[0, -0.45, 0]} s={[0.13, 0.9, 0.13]} m={M.pants} />
				</group>
			))}
			<Box p={[0, 1.25, 0]} s={[0.4, 0.62, 0.24]} m={M.shirt} />
			<mesh position={[0, 1.68, 0]} material={M.skin}>
				<sphereGeometry args={[0.11, 7, 5]} />
			</mesh>
			<mesh position={[0, 1.78, 0]} material={M.salakot}>
				<coneGeometry args={[0.3, 0.16, 10, 1]} />
			</mesh>
			{/* his arm holds the lamp out in front */}
			<group position={[0.24, 1.42, 0.05]} rotation={[-1.1, 0, 0]}>
				<Box p={[0, -0.25, 0]} s={[0.09, 0.5, 0.09]} m={M.shirt} />
				<group position={[0, -0.55, 0]} rotation={[1.1 + 0.15 * Math.sin(t * 5), 0, 0]}>
					<Cyl p={[0, -0.08, 0]} r0={0.05} h={0.1} m={M.wood} />
					<Cyl p={[0, -0.18, 0]} r0={0.045} h={0.12} m={M.glass} />
					<mesh position={[0, -0.18, 0]} material={M.flame}>
						<sphereGeometry args={[0.02, 5, 4]} />
					</mesh>
				</group>
			</group>
		</group>
	);
};

const Banana: React.FC<{p: V3; s?: number; t: number}> = ({p, s = 1, t}) => {
	const M = useM();
	return (
		<group position={p} scale={s}>
			<Cyl p={[0, 1.2, 0]} r0={0.12} r1={0.09} h={2.4} m={M.trunk} />
			{[0, 1.3, 2.5, 3.8, 5.0].map((a, i) => (
				<mesh key={i} position={[Math.cos(a) * 0.6, 2.35, Math.sin(a) * 0.6]} rotation={[0.5 * Math.sin(a), -a, 0.9 + 0.05 * Math.sin(t * 0.8 + i)]} material={M.leaf}>
					<planeGeometry args={[1.4, 0.4, 3, 1]} />
				</mesh>
			))}
		</group>
	);
};

// ------------------------------------------------------------------ the farm
export const Farm: React.FC<{t: number; goats: number; gate: number; dogCower: number; winLit: number; prints: number}> = ({t, goats, gate, dogCower, winLit, prints}) => {
	const M = useM();
	const winM = useMemo(() => new THREE.MeshBasicMaterial({color: '#ffc070'}), []);
	winM.color.set('#ffc070').multiplyScalar(winLit);
	return (
		<group>
			<mesh position={[0, 0, 0]} material={M.sky}>
				<sphereGeometry args={[300, 10, 8]} />
			</mesh>
			<mesh position={[70, 80, 160]} material={M.moon}>
				<sphereGeometry args={[7, 10, 8]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 6]} material={M.mud}>
				<planeGeometry args={[60, 60, 40, 40]} />
			</mesh>
			{/* puddles */}
			{[[2.2, 3], [-1.5, 6], [1.0, 10]].map(([x, z], i) => (
				<mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, z]} material={M.water}>
					<circleGeometry args={[0.6 + 0.2 * i, 10]} />
				</mesh>
			))}
			{/* the trail of prints: cloven hooves, every print pointing away from the house (+z) */}
			{Array.from({length: Math.min(N_PRINTS, Math.round(prints))}, (_, i) => (
				<group key={i} position={[trailX(i), 0.008, trailZ(i)]}>
					{[-0.025, 0.025].map((dx) => (
						<mesh key={dx} rotation={[-Math.PI / 2, 0, 0]} position={[dx, 0, 0]} scale={[0.6, 1.4, 1]} material={M.print}>
							<circleGeometry args={[0.045, 6, 0, Math.PI]} />
						</mesh>
					))}
				</group>
			))}
			{/* the nipa house on stilts */}
			<group position={HOUSE}>
				{[[-2, -1.4], [2, -1.4], [-2, 1.4], [2, 1.4]].map(([x, z], i) => (
					<Cyl key={i} p={[x, 0.6, z]} r0={0.1} h={1.2} m={M.wood} />
				))}
				<Box p={[0, 2.0, 0]} s={[4.2, 1.6, 3.0]} m={M.bamboo} />
				<mesh position={[0, 3.4, 0]} rotation={[0, Math.PI / 4, 0]} material={M.nipa}>
					<coneGeometry args={[3.6, 1.6, 4, 2]} />
				</mesh>
				<Box p={[-1.0, 1.6, 1.52]} s={[0.7, 0.8, 0.04]} m={M.wood} />
				{/* the ladder */}
				{[0, 0.3, 0.6, 0.9].map((y, i) => (
					<Box key={i} p={[-1.0, 0.15 + y, 1.8 + 0.12 * i]} s={[0.6, 0.04, 0.06]} m={M.wood} />
				))}
			</group>
			<mesh position={WIN} material={winM}>
				<planeGeometry args={[0.8, 0.6]} />
			</mesh>
			{[-0.2, 0.2].map((x) => (
				<Box key={x} p={[WIN[0] + x, WIN[1], WIN[2] + 0.02]} s={[0.03, 0.6, 0.03]} m={M.wood} />
			))}
			<pointLight position={[WIN[0], WIN[1], WIN[2] + 0.8]} intensity={2.2 * winLit} distance={6} decay={1} color="#ffb060" />
			{/* the pen, its gate and the goats */}
			<group position={PEN}>
				{Array.from({length: 26}, (_, i) => {
					const a = (i / 26) * Math.PI * 2;
					const x = Math.cos(a) * 1.4, z = Math.sin(a) * 1.0;
					if (a > 2.6 && a < 3.3) return null; // the gate's gap, facing the yard
					return <Cyl key={i} p={[x, 0.5, z]} r0={0.03} h={1.0} m={M.bamboo} />;
				})}
				<group position={[-1.35, 0, -0.2]} rotation={[0, -gate * 1.4, 0]}>
					{[0, 0.13, 0.26, 0.39].map((z) => (
						<Cyl key={z} p={[0, 0.48, z]} r0={0.025} h={0.95} m={M.bamboo} />
					))}
				</group>
				{[[0.6, 0.3, 0.6], [0.8, -0.3, 0.9], [0.3, 0.1, 1.2], [0.0, -0.4, 1.0]].slice(0, Math.max(0, Math.round(goats))).map(([x, z, ry], i) => (
					<Goat key={i} p={[x, 0, z]} ry={ry + Math.PI} t={t} dark={i === 1} head={-0.3} />
				))}
			</group>
			{/* the kennel and the dog */}
			<group position={KENNEL} rotation={[0, 0.6, 0]}>
				<Box p={[0, 0.4, -0.5]} s={[0.8, 0.8, 0.8]} m={M.wood} />
				<mesh position={[0, 0.95, -0.5]} rotation={[0, Math.PI / 4, 0]} material={M.nipa}>
					<coneGeometry args={[0.7, 0.4, 4, 1]} />
				</mesh>
				<Box p={[0, 0.35, -0.09]} s={[0.4, 0.5, 0.02]} m={M.hideDark} />
				<Dog p={[0, 0, 0.35 - 0.55 * dogCower]} ry={0} t={t} cower={dogCower} />
			</group>
			{[[-4, -4], [-5.5, 1], [5.8, -4.5], [6.2, 2.5], [-6, 6], [5, 8]].map(([x, z], i) => (
				<Banana key={i} p={[x, 0, z]} s={1 + 0.15 * (i % 3)} t={t} />
			))}
		</group>
	);
};

// ------------------------------------------------------------------ the child's room
export const Room: React.FC<{t: number; lamp: number; rise: number; press: number}> = ({t, lamp, rise, press}) => {
	const M = useM();
	return (
		<group position={ROOM}>
			{/* the walls (thin boxes, so they read from inside), with an opening for the window */}
			<Box p={[0, 1.2, 1.5]} s={[3, 2.4, 0.06]} m={M.bamboo} />
			<Box p={[-1.5, 1.2, 0]} s={[0.06, 2.4, 3]} m={M.bamboo} />
			<Box p={[1.5, 1.2, 0]} s={[0.06, 2.4, 3]} m={M.bamboo} />
			<Box p={[0, 2.4, 0]} s={[3, 0.06, 3]} m={M.bamboo} />
			<Box p={[0, 0.5, -1.5 + 0.02 * press]} s={[3, 1.0, 0.06]} m={M.bamboo} />
			<Box p={[0, 2.05, -1.5]} s={[3, 0.7, 0.06]} m={M.bamboo} />
			<Box p={[-0.97, 1.35, -1.5]} s={[1.06, 0.7, 0.06]} m={M.bamboo} />
			<Box p={[0.97, 1.35, -1.5]} s={[1.06, 0.7, 0.06]} m={M.bamboo} />
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={M.floor}>
				<planeGeometry args={[3, 3, 8, 8]} />
			</mesh>
			{/* the night beyond, banana leaves and the moon's glow */}
			<mesh position={[0, 1.4, -4.5]} material={M.night}>
				<planeGeometry args={[8, 5]} />
			</mesh>
			<pointLight position={[0.6, 2.2, -3.2]} intensity={2.4} distance={4} decay={1} color="#9aa8d0" />
			{[-0.22, 0.22].map((x) => (
				<Box key={x} p={[x, 1.35, -1.46]} s={[0.04, 0.7, 0.04]} m={M.wood} />
			))}
			{/* outside the window: its back, its ears, rising */}
			<group position={[0.05, 0.75 + 0.45 * rise, -1.95]}>
				<mesh scale={[0.6, 0.55, 0.45]} material={M.hide}>
					<sphereGeometry args={[0.5, 10, 8]} />
				</mesh>
				{[-1, 1].map((k) => (
					<mesh key={k} position={[k * 0.25, 0.32, 0.12]} rotation={[0.2, 0, k * 0.5]} material={M.hideDark}>
						<boxGeometry args={[0.06, 0.45, 0.16]} />
					</mesh>
				))}
			</group>
			{/* the child asleep on the banig, under a blanket, safe */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.2]} material={M.banig}>
				<planeGeometry args={[0.9, 1.6]} />
			</mesh>
			<mesh position={[0, 0.12, 0.35]} scale={[1, 0.6, 1]} material={M.blanket}>
				<boxGeometry args={[0.5, 0.2, 0.9]} />
			</mesh>
			<mesh position={[0, 0.12, -0.25]} material={M.hair}>
				<sphereGeometry args={[0.1, 8, 6]} />
			</mesh>
			{/* the kerosene lamp */}
			<group position={[0.9, 0, -0.6]}>
				<Cyl p={[0, 0.06, 0]} r0={0.06} h={0.12} m={M.wood} />
				<Cyl p={[0, 0.2, 0]} r0={0.05} h={0.16} m={M.glass} />
				<mesh position={[0, 0.2, 0]} material={M.flame}>
					<sphereGeometry args={[0.02 * lamp + 0.005, 5, 4]} />
				</mesh>
				<pointLight position={[0, 0.3, 0]} intensity={2.4 * lamp} distance={4} decay={1} color="#ffb060" />
			</group>
		</group>
	);
};
