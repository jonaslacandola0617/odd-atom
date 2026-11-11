// Episode 10 world: "The Night the Lake Breathed Out" (true: Lake Nyos, Cameroon, 21 August
// 1986). One consistent low-poly crater, its lake, the valley and a village below it.
//
// Layout (metres, y up; scaled down from the real crater, which is about 1.8 km across).
// The lake surface is y = 0, centre (0, 0), radius ~55. The crater rim rises around it to
// ~25 m, with a NOTCH to the north (+z) where the valley begins; the valley floor falls away
// northward to the village at VILLAGE (about 80 m below the lake). All of it is one heightfield
// (terrainH), so the mist can hug the ground as it flows. A second, wide lake for the last shot
// sits far away at OTHER_X.
// Care: a real disaster with living survivors. Nothing here depicts a person or an animal
// harmed: the village has huts, lamps, paths and a cooking place, and at dawn it is empty.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

const M = (color: string, opts: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...opts}), 20, SNAP6);
const B = (color: string, opts: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...opts}), 20, SNAP6);

export const LAKE_R = 55;
export const OTHER_X = 3000;
const smooth = (a: number, b: number, x: number) => {
	const k = Math.max(0, Math.min(1, (x - a) / (b - a)));
	return k * k * (3 - 2 * k);
};

/** Ground height: the crater bowl and rim, falling away outside, with the valley cut north. */
export const terrainH = (x: number, z: number) => {
	const r = Math.hypot(x, z);
	let h = r < LAKE_R ? -10 + (r / LAKE_R) * 8 : 25 * Math.exp(-(((r - 78) / 22) ** 2)) - 0.22 * Math.max(0, r - 85) + (r < 70 ? (r - LAKE_R) * 0.9 - 2 : 0);
	if (r >= LAKE_R && r < 70) h = Math.max(h, (r - LAKE_R) * 1.4 - 1);
	// the valley: a channel cut through the rim to the north, sloping down
	const w = 12 + Math.max(0, z - 60) * 0.12 + 14 * Math.exp(-(((z - 200) / 40) ** 2));
	const carve = smooth(48, 72, z) * (26 + Math.max(0, z - 80) * 0.3);
	h -= carve * Math.exp(-(((x - Math.sin(z * 0.012) * 18) / w) ** 2));
	return h;
};

export const VILLAGE: [number, number, number] = [Math.sin(200 * 0.012) * 18, 0, 200];
VILLAGE[1] = terrainH(VILLAGE[0], VILLAGE[2]);

const useMats = () =>
	useMemo(() => {
		return {
			ground: ps1(new THREE.MeshLambertMaterial({vertexColors: true, flatShading: true}), 20, SNAP6),
			water: M('#2e4a64'),
			waterRed: M('#5a2a1e'),
			waterDay: M('#2a5a6a'),
			mud: M('#7a5a3e'),
			thatch: M('#8a7444'),
			tin: M('#8a8c8a'),
			wood: M('#4a3424'),
			door: B('#050403'),
			lamp: B('#ffb050'),
			lampOff: M('#2a2420'),
			ash: M('#4a4644'),
			star: B('#e8eaf0'),
			raft: M('#c8c4b4'),
			pipe: M('#3a5a8a'),
			spray: B('#e8f0f4', {transparent: true, opacity: 0.75}),
			boatLight: B('#ffd27a'),
			hill: M('#1a2418'),
			deep: M('#6a4228'),
		};
	}, []);

export type Mats = ReturnType<typeof useMats>;
const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

export const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={s} />
	</mesh>
);

// ------------------------------------------------------------------ terrain
export const Terrain: React.FC<{tone: 'night' | 'dawn' | 'day'}> = ({tone}) => {
	const mm = useM();
	const geo = useMemo(() => {
		const g = new THREE.PlaneGeometry(520, 560, 104, 112).rotateX(-Math.PI / 2);
		g.translate(0, 0, 110);
		const pos = g.attributes.position as THREE.BufferAttribute;
		const col = new Float32Array(pos.count * 3);
		const r = rng(101);
		for (let i = 0; i < pos.count; i++) {
			const x = pos.getX(i), z = pos.getZ(i);
			const h = terrainH(x, z);
			pos.setY(i, h);
			// grass on the slopes, bare rock on the steep inner crater wall, a little noise
			const rr = Math.hypot(x, z);
			const rock = rr > LAKE_R - 2 && rr < 70 ? 1 : 0;
			const n = 0.85 + r() * 0.3;
			const c = rock ? [0.32, 0.3, 0.27] : [0.24, 0.34, 0.18];
			col.set([c[0] * n, c[1] * n, c[2] * n], i * 3);
		}
		g.setAttribute('color', new THREE.BufferAttribute(col, 3));
		g.computeVertexNormals();
		return g;
	}, []);
	return <mesh geometry={geo} material={mm.ground} />;
};

/** The lake surface; a bulge when it "breathes out"; stars reflected at night. */
export const Lake: React.FC<{t: number; bulge: number; tone: 'night' | 'dawn' | 'day'; red: number}> = ({t, bulge, tone, red}) => {
	const mm = useM();
	const geo = useMemo(() => new THREE.CircleGeometry(LAKE_R + 2, 40, 0, Math.PI * 2).rotateX(-Math.PI / 2), []);
	const pos = geo.attributes.position as THREE.BufferAttribute;
	const base = useMemo(() => Float32Array.from(pos.array as Float32Array), [pos]);
	for (let i = 0; i < pos.count; i++) {
		const x = base[i * 3], z = base[i * 3 + 2];
		const d = Math.hypot(x, z);
		pos.setY(i, Math.sin(x * 0.2 + t * 0.6) * 0.05 + Math.sin(z * 0.17 - t * 0.5) * 0.05 + bulge * 6 * Math.exp(-((d / 16) ** 2)));
	}
	pos.needsUpdate = true;
	geo.computeVertexNormals();
	const mat = tone === 'day' ? mm.waterDay : red > 0.5 ? mm.waterRed : mm.water;
	const stars = useMemo(() => {
		const r = rng(55);
		return new Array(40).fill(0).map(() => [(r() - 0.5) * 90, (r() - 0.5) * 90] as [number, number]).filter(([x, z]) => Math.hypot(x, z) < LAKE_R - 4);
	}, []);
	return (
		<group>
			<mesh geometry={geo} material={mat} />
			{tone === 'night' &&
				stars.map(([x, z], i) => (
					<mesh key={i} position={[x, 0.08, z]} material={mm.star} rotation={[-Math.PI / 2, 0, 0]}>
						<planeGeometry args={[0.35, 0.35]} />
					</mesh>
				))}
		</group>
	);
};

// ------------------------------------------------------------------ the village
const HUTS: {p: [number, number]; r: number; kind: 'round' | 'tin'; lamp: boolean}[] = (() => {
	const r = rng(303);
	const out: {p: [number, number]; r: number; kind: 'round' | 'tin'; lamp: boolean}[] = [];
	for (let i = 0; i < 16; i++) {
		const a = r() * Math.PI * 2, d = 6 + r() * 20;
		out.push({p: [VILLAGE[0] + Math.cos(a) * d * 0.55, VILLAGE[2] + Math.sin(a) * d], r: r() * 6, kind: r() > 0.6 ? 'tin' : 'round', lamp: r() > 0.45});
	}
	return out;
})();
/** The world-space point in front of a hut's window, `d` metres out, and the window itself. */
export const hutWindow = (i: number, d: number): [[number, number, number], [number, number, number]] => {
	const [x, y, z] = hutPos(i);
	const h = HUTS[i];
	const wz = h.kind === 'round' ? 1.95 : 1.82;
	const c = Math.cos(h.r), sn = Math.sin(h.r);
	const wx = x + 1.2 * c + wz * sn, wzz = z - 1.2 * sn + wz * c;
	return [[wx + sn * d, y + 1.5, wzz + c * d], [wx, y + 1.5, wzz]];
};
export const hutPos = (i: number): [number, number, number] => {
	const [x, z] = HUTS[i].p;
	const y = Math.min(...[[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5], [0, 0]].map(([dx, dz]) => terrainH(x + dx, z + dz)));
	return [x, y - 0.3, z];
};
/** The lit hut the camera watches: the lamp hut whose window looks downhill, with the most open ground in front of it. */
export const LAMP_HUT = HUTS.map((h, i) => i)
	.filter((i) => HUTS[i].lamp)
	.sort((a, b) => {
		const clear = (i: number) => {
			const [e] = hutWindow(i, 10);
			return e[1] - terrainH(e[0], e[2]);
		};
		return clear(b) - clear(a);
	})[0];

export const Village: React.FC<{lamps: number; lampOut: number; dawn: boolean}> = ({lamps, lampOut, dawn}) => {
	const mm = useM();
	return (
		<group>
			{HUTS.map((h, i) => {
				const [x, y, z] = hutPos(i);
				const lit = !dawn && h.lamp && lamps > 0.5 && !(i === LAMP_HUT && lampOut > 0.5);
				return (
					<group key={i} position={[x, y, z]} rotation={[0, h.r, 0]}>
						{h.kind === 'round' ? (
							<>
								<mesh position={[0, 1.2, 0]} material={mm.mud}>
									<cylinderGeometry args={[2.2, 2.3, 2.4, 9]} />
								</mesh>
								<mesh position={[0, 3.4, 0]} material={mm.thatch}>
									<coneGeometry args={[3.0, 2.4, 9]} />
								</mesh>
							</>
						) : (
							<>
								<Box p={[0, 1.3, 0]} s={[5, 2.6, 3.6]} m={mm.mud} />
								<Box p={[0, 2.9, 0]} s={[5.6, 0.2, 4.2]} m={mm.tin} r={[0.15, 0, 0]} />
							</>
						)}
						{/* the door: shut at night, standing open at dawn */}
						<Box p={[0, 0.95, h.kind === 'round' ? 2.25 : 1.82]} s={[0.9, 1.9, 0.06]} m={dawn ? mm.door : mm.wood} />
						{/* a small window with a kerosene lamp behind it */}
						<Box p={[1.2, 1.5, h.kind === 'round' ? 1.95 : 1.82]} s={[0.5, 0.4, 0.06]} m={lit ? mm.lamp : mm.lampOff} />
						{lit && <pointLight position={[1.2, 1.6, (h.kind === 'round' ? 1.95 : 1.82) + 1.2]} intensity={1.6} distance={9} decay={1.4} color="#ffb050" />}
					</group>
				);
			})}
			{/* the cooking place in the middle: embers at night, cold grey ash at dawn */}
			<group position={[VILLAGE[0], VILLAGE[1], VILLAGE[2]]}>
				{[0, 1, 2].map((i) => (
					<Box key={i} p={[Math.cos(i * 2.1) * 0.5, 0.2, Math.sin(i * 2.1) * 0.5]} s={[0.4, 0.4, 0.4]} m={mm.wood} />
				))}
				<Box p={[0, 0.1, 0]} s={[1.0, 0.15, 1.0]} m={dawn ? mm.ash : mm.lamp} />
			</group>
		</group>
	);
};

/** The gas cloud: ground-hugging mist. k: 0 rising from the lake -> 1 spilled through the notch and down to the village. */
export const Mist: React.FC<{k: number; t: number; fade: number}> = ({k, t, fade}) => {
	const mat = useMemo(() => new THREE.MeshBasicMaterial({color: '#dfe6ea', transparent: true, opacity: 0.32, depthWrite: false, fog: false}), []);
	mat.opacity = 0.32 * fade;
	const parts = useMemo(() => {
		const r = rng(808);
		return new Array(90).fill(0).map(() => ({lag: r() * 0.35, side: (r() - 0.5) * 2, s: 4 + r() * 7, ph: r() * 6}));
	}, []);
	return (
		<group>
			{parts.map((p, i) => {
				const u = Math.max(0, Math.min(1, (k - p.lag) / (1 - p.lag)));
				let x: number, y: number, z: number;
				if (u < 0.3) {
					// the plume rising out of the lake, spreading
					const v = u / 0.3;
					x = p.side * 8 * v;
					z = p.side * 5 * v * Math.sin(p.ph);
					y = 2 + v * 40;
				} else if (u < 0.5) {
					// falling back, pooling on the water, drifting to the notch
					const v = (u - 0.3) / 0.2;
					x = p.side * (8 + v * 10);
					z = v * 60;
					y = 42 - v * 36;
				} else {
					// pouring through the notch and down the valley floor, hugging it
					const v = (u - 0.5) / 0.5;
					z = 60 + v * 150;
					x = Math.sin(z * 0.012) * 18 + p.side * (8 + v * 10);
					y = terrainH(x, z) + 2.5;
				}
				const wob = Math.sin(t * 0.7 + p.ph) * 1.5;
				return u > 0 ? (
					<mesh key={i} position={[x + wob, y, z]} material={mat} scale={[p.s * (1 + u), p.s * 0.45, p.s * (1 + u)]}>
						<icosahedronGeometry args={[1, 0]} />
					</mesh>
				) : null;
			})}
		</group>
	);
};

/** The modern degassing raft: a pipe from the bottom, a fountain of water and gas. */
export const Degasser: React.FC<{t: number}> = ({t}) => {
	const mm = useM();
	return (
		<group position={[4, 0, -6]}>
			<Box p={[0, 0.3, 0]} s={[4, 0.6, 4]} m={mm.raft} />
			<mesh position={[0, 4, 0]} material={mm.pipe}>
				<cylinderGeometry args={[0.18, 0.18, 8, 6]} />
			</mesh>
			{new Array(10).fill(0).map((_, i) => {
				const k = ((t * 0.9 + i / 10) % 1);
				return (
					<mesh key={i} position={[Math.sin(i * 2.4) * k * 1.6, 8 + Math.sin(k * Math.PI) * 30 * (0.7 + (i % 3) * 0.15), Math.cos(i * 2.4) * k * 1.6]} material={mm.spray} scale={0.6 + k * 1.4}>
						<icosahedronGeometry args={[1, 0]} />
					</mesh>
				);
			})}
		</group>
	);
};

/** Under the water: a column to the lake bed; the deep layer, dense and dark, holding its gas. */
export const Deep: React.FC<{t: number; rise: number}> = ({t, rise}) => {
	const bub = useMemo(() => B('#c8dce0', {transparent: true, opacity: 0.9}), []);
	const deepGlow = useMemo(() => B('#5a3a24', {transparent: true, opacity: 0.6, depthWrite: false}), []);
	const edge = useMemo(() => B('#8a6a48', {transparent: true, opacity: 0.6}), []);
	const r = useMemo(() => {
		const g = rng(909);
		return new Array(60).fill(0).map(() => [(g() - 0.5) * 30, g(), (g() - 0.5) * 30, g()] as [number, number, number, number]);
	}, []);
	return (
		<group>
			{/* the dense bottom layer: a dark red-brown slab above the bed */}
			<Box p={[0, -7.5, 0]} s={[100, 4, 100]} m={deepGlow} />
			{/* the boundary between the light water above and the dense layer */}
			<Box p={[0, -5.45, 0]} s={[100, 0.06, 100]} m={edge} />
			{r.map(([x, y0, z, ph], i) => {
				// held: tiny bubbles that jitter in the deep layer; then, when it is disturbed, rising
				const held = -8.5 + y0 * 2.5 + Math.sin(t * 2 + ph * 9) * 0.1;
				const y = rise > 0 ? held + ((rise * 10 + ph) % 1) * 9 * rise : held;
				return (
					<mesh key={i} position={[x * 0.4, y, z * 0.4]} material={bub} scale={0.14 + ph * 0.16}>
						<icosahedronGeometry args={[1, 0]} />
					</mesh>
				);
			})}
		</group>
	);
};

/** Another lake, wide and calm at night, low hills, a fishing boat's light; one bubble rising. */
export const OtherLake: React.FC<{t: number; bubble: number}> = ({t, bubble}) => {
	const mm = useM();
	return (
		<group position={[OTHER_X, 0, 0]}>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mm.water}>
				<planeGeometry args={[1600, 1600]} />
			</mesh>
			{[[-200, 400, 260], [150, 520, 300], [420, 300, 200], [-480, 260, 180]].map(([x, z, s], i) => (
				<mesh key={i} position={[x, -s * 0.55, z]} material={mm.hill}>
					<sphereGeometry args={[s, 10, 6]} />
				</mesh>
			))}
			<Box p={[60, 0.6, 260]} s={[3, 0.8, 1]} m={mm.wood} />
			<Box p={[60, 2.0, 260]} s={[0.4, 0.4, 0.4]} m={mm.boatLight} />
			{bubble > 0 && (
				<mesh position={[0, 0.2, 40]} rotation={[-Math.PI / 2, 0, 0]} material={mm.spray} scale={0.4 + bubble * 3}>
					<ringGeometry args={[0.8, 1, 16]} />
				</mesh>
			)}
		</group>
	);
};
