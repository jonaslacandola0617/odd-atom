// Episode 4 world: "Rules for the Night Shift" (original). Kestrel Ridge weather station.
//
// Layout (metres, y up). One room, x[-3,3] z[-2.5,2.5], 2.5 m high.
//   North wall (z = -2.5): the desk with the CRT at (0.4, 1.0, -2.2); the rule sheet taped
//   right of it at (1.15, 1.3); a small window right of the sheet x[1.7,2.6] y[1.2,2.0];
//   the digital clock high on the wall at (-1.0, 2.25).
//   East wall (x = 3): the window z[-1.6,-0.4] y[1.1,2.0] and the steel door z[0.6,1.6]
//   with a bolt and a peephole at 1.6 m. The outside lamp hangs over the door.
//   West wall: the phone (cord cut), the bunk. South wall: lockers, the light switch.
//   Outside: the hut on a ridge, the anemometer mast on the roof, the cable-car
//   platform to the west with the cable running down the slope.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';
import {tex} from '../ep02/world';

const M = (color: string, opts: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...opts}), 20, SNAP6);
const B = (color: string, opts: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...opts}), 20, SNAP6);

const useMats = () =>
	useMemo(() => {
		const paint = tex(16, 16, (g, r) => {
			g.fillStyle = '#7a8a7a';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() > 0.5 ? '#72826f' : '#829282';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
			g.fillStyle = '#5e6c5e';
			g.fillRect(0, 12, 16, 4);
		}, 41, [6, 2]);
		const lino = tex(16, 16, (g, r) => {
			g.fillStyle = '#4a4438';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#3e392f';
			g.fillRect(0, 7, 16, 1);
			g.fillRect(7, 0, 1, 16);
			for (let i = 0; i < 20; i++) {
				g.fillStyle = '#544d40';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, 42, [8, 6]);
		const snow = tex(32, 32, (g, r) => {
			g.fillStyle = '#c8ccd6';
			g.fillRect(0, 0, 32, 32);
			for (let i = 0; i < 140; i++) {
				g.fillStyle = r() > 0.5 ? '#d4d8e2' : '#b8bcc8';
				g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 2, 1);
			}
		}, 43, [50, 50]);
		const concrete = tex(16, 16, (g, r) => {
			g.fillStyle = '#6a6a68';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() > 0.5 ? '#727270' : '#5e5e5c';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
			g.fillStyle = '#585856';
			g.fillRect(0, 15, 16, 1);
		}, 44, [4, 2]);
		return {
			paint: M('#ffffff', {map: paint, side: THREE.DoubleSide}),
			lino: M('#ffffff', {map: lino}),
			ceiling: M('#8a8a84', {side: THREE.DoubleSide}),
			snow: M('#ffffff', {map: snow}),
			concrete: M('#ffffff', {map: concrete, side: THREE.DoubleSide}),
			steel: M('#5a6066'),
			steelDark: M('#2e3236'),
			desk: M('#6a6458'),
			crt: M('#c8c0a8'),
			crtDark: M('#18181a'),
			beige: M('#c8b890'),
			black: B('#000000'),
			red: M('#9a2a22'),
			cable: M('#1a1a1c'),
			wood: M('#5a4030'),
			blanket: M('#3a4a5a'),
			locker: M('#5a6a5a'),
			lampOn: B('#ffe0a0'),
			tubeOn: B('#e8f0ff'),
			tubeOff: M('#606468'),
			rock: M('#3a3c40'),
			skin: M('#c09070'),
			glass: B('#1a2a3a', {transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false}),
			print: B('#2e3448'),
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

const Plane: React.FC<{p: [number, number, number]; w: number; h: number; map: THREE.Texture; r?: [number, number, number]; lit?: boolean}> = ({p, w, h, map, r = [0, 0, 0], lit}) => {
	const m = useMemo(() => ps1(lit ? new THREE.MeshLambertMaterial({map}) : new THREE.MeshBasicMaterial({map}), 20, SNAP6), [map, lit]);
	return (
		<mesh position={p} rotation={r} material={m}>
			<planeGeometry args={[w, h]} />
		</mesh>
	);
};

export const WORKER = {skin: '#c09070', hair: '#3a3a44', top: '#a8402a', legs: '#2a2e36'};

// ------------------------------------------------------------------ the room

export type RoomState = {lightsOn: number; phone: number; doorShake: number; bolt: number; receiverOff: number; t: number};
export type RoomTex = {sheet: THREE.Texture; monitor: THREE.Texture; log: THREE.Texture; clock: THREE.Texture};

export const Room: React.FC<{st: RoomState; tx: RoomTex}> = ({st, tx}) => {
	const mm = useM();
	const ring = st.phone ? Math.sin(st.t * 90) * 0.012 * st.phone : 0;
	return (
		<group>
			<Box p={[0, -0.05, 0]} s={[6.2, 0.1, 5.2]} m={mm.lino} />
			<Box p={[0, 2.55, 0]} s={[6.2, 0.1, 5.2]} m={mm.ceiling} />
			{/* north wall with window x[1.7,2.6] y[1.2,2.0] */}
			<Box p={[-0.725, 1.25, -2.55]} s={[4.55, 2.5, 0.1]} m={mm.paint} />
			<Box p={[2.675, 1.25, -2.55]} s={[0.65, 2.5, 0.1]} m={mm.paint} />
			<Box p={[1.95, 0.6, -2.55]} s={[0.8, 1.2, 0.1]} m={mm.paint} />
			<Box p={[1.95, 2.25, -2.55]} s={[0.8, 0.5, 0.1]} m={mm.paint} />
			<Box p={[1.95, 1.6, -2.56]} s={[0.8, 0.8, 0.02]} m={mm.glass} />
			<Box p={[1.95, 1.6, -2.5]} s={[0.03, 0.8, 0.04]} m={mm.steelDark} />
			{/* south + west walls */}
			<Box p={[0, 1.25, 2.55]} s={[6.2, 2.5, 0.1]} m={mm.paint} />
			<Box p={[-3.05, 1.25, 0]} s={[0.1, 2.5, 5.2]} m={mm.paint} />
			{/* east wall: window z[-1.6,-0.4] y[1.1,2.0], door z[0.6,1.6] */}
			<Box p={[3.05, 1.25, -2.05]} s={[0.1, 2.5, 0.9]} m={mm.paint} />
			<Box p={[3.05, 1.25, 0.1]} s={[0.1, 2.5, 1.0]} m={mm.paint} />
			<Box p={[3.05, 1.25, 2.05]} s={[0.1, 2.5, 0.9]} m={mm.paint} />
			<Box p={[3.05, 0.55, -1.0]} s={[0.1, 1.1, 1.2]} m={mm.paint} />
			<Box p={[3.05, 2.25, -1.0]} s={[0.1, 0.5, 1.2]} m={mm.paint} />
			<Box p={[3.06, 1.55, -1.0]} s={[0.02, 0.9, 1.2]} m={mm.glass} />
			<Box p={[3.05, 2.3, 1.1]} s={[0.1, 0.4, 1.0]} m={mm.paint} />
			{/* the steel door, its bolt and peephole */}
			<group position={[3.02, 1.05, 1.1]} rotation={[0, 0, st.doorShake * 0.004]}>
				<Box p={[0, 0, 0]} s={[0.06, 2.1, 0.98]} m={mm.steel} />
				<Box p={[-0.04, 0.55, 0]} s={[0.02, 0.05, 0.05]} m={mm.steelDark} />
				<Box p={[-0.05, 0.0, -0.36]} s={[0.04, 0.08, 0.16]} m={mm.steelDark} />
				<Box p={[-0.07, 0.0, -0.36 + 0.08 - st.bolt * 0.12]} s={[0.03, 0.03, 0.22]} m={mm.beige} />
			</group>
			{/* the lamp outside leaks under the door and through the peephole */}
			<Box p={[2.98, 0.012, 1.1]} s={[0.04, 0.012, 0.9]} m={mm.lampOn} />
			<Box p={[2.985, 1.6, 1.1]} s={[0.01, 0.012, 0.012]} m={mm.lampOn} />
			{/* desk, CRT, keyboard, log book */}
			<Box p={[0.3, 0.74, -2.15]} s={[2.4, 0.06, 0.7]} m={mm.desk} />
			<Box p={[-0.8, 0.37, -2.15]} s={[0.06, 0.74, 0.65]} m={mm.steelDark} />
			<Box p={[1.45, 0.37, -2.15]} s={[0.06, 0.74, 0.65]} m={mm.steelDark} />
			<Box p={[0.4, 1.05, -2.25]} s={[0.5, 0.42, 0.42]} m={mm.crt} />
			<Box p={[0.4, 1.06, -2.035]} s={[0.4, 0.32, 0.02]} m={mm.crtDark} />
			<Plane p={[0.4, 1.06, -2.022]} w={0.36} h={0.27} map={tx.monitor} />
			<Box p={[0.4, 0.785, -1.95]} s={[0.42, 0.03, 0.15]} m={mm.beige} />
			<Plane p={[-0.35, 0.775, -2.0]} w={0.3} h={0.38} map={tx.log} r={[-Math.PI / 2, 0, 0.08]} lit />
			{/* the rule sheet, taped beside the monitor */}
			<Plane p={[1.1, 1.32, -2.49]} w={0.3} h={0.42} map={tx.sheet} lit />
			<Box p={[0.97, 1.525, -2.485]} s={[0.07, 0.02, 0.005]} m={mm.beige} />
			<Box p={[1.23, 1.525, -2.485]} s={[0.07, 0.02, 0.005]} m={mm.beige} />
			{/* the digital clock */}
			<Box p={[-1.0, 2.27, -2.48]} s={[0.4, 0.15, 0.06]} m={mm.crtDark} />
			<Plane p={[-1.0, 2.27, -2.445]} w={0.36} h={0.12} map={tx.clock} />
			{/* the wall phone on the west wall, its cord cut and hanging */}
			<group position={[-2.98, 1.4, -0.9]}>
				<Box p={[0.05, 0, 0]} s={[0.08, 0.26, 0.16]} m={mm.beige} />
				<group position={[0.12, 0.02 - st.receiverOff * 0.6, ring + st.receiverOff * Math.sin(st.t * 2.4) * 0.05]} rotation={[st.receiverOff * 0.2, 0, st.receiverOff * 0.3]}>
					<Box p={[0, 0, 0]} s={[0.06, 0.24, 0.07]} m={mm.beige} />
				</group>
				{/* the coiled cord: a few loops, then cut */}
				{[0, 1, 2, 3, 4].map((i) => (
					<mesh key={i} position={[0.1, -0.16 - i * 0.05, 0.05]} material={mm.beige} rotation={[0, Math.PI / 2, 0]}>
						<torusGeometry args={[0.018, 0.005, 3, 6]} />
					</mesh>
				))}
				<Box p={[0.1, -0.43, 0.05]} s={[0.006, 0.04, 0.006]} m={mm.red} />
				{/* the bell on top shakes when it rings */}
				<mesh position={[0.05, 0.17 + Math.abs(ring) * 2, ring]} material={mm.steel}>
					<sphereGeometry args={[0.04, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
				</mesh>
			</group>
			{/* bunk, lockers, heater, light switch */}
			<Box p={[-2.6, 0.4, 1.4]} s={[0.8, 0.12, 1.9]} m={mm.blanket} />
			<Box p={[-2.6, 0.2, 1.4]} s={[0.82, 0.4, 1.92]} m={mm.steelDark} />
			<Box p={[0.4, 0.9, 2.3]} s={[1.4, 1.8, 0.4]} m={mm.locker} />
			{[0, 0.47, 0.94].map((x) => (
				<Box key={x} p={[-0.05 + x, 0.9, 2.09]} s={[0.01, 1.7, 0.02]} m={mm.steelDark} />
			))}
			<Box p={[1.95, 0.35, -2.35]} s={[0.8, 0.5, 0.15]} m={mm.steel} />
			<Box p={[2.7, 1.3, 2.47]} s={[0.08, 0.12, 0.03]} m={mm.beige} />
			{/* fluorescent tubes */}
			{[-1.2, 1.2].map((x) => (
				<Box key={x} p={[x, 2.47, 0]} s={[0.12, 0.05, 1.6]} m={st.lightsOn > 0.5 ? mm.tubeOn : mm.tubeOff} />
			))}
		</group>
	);
};

/** A hand with a pen, writing in the log. */
export const PenHand: React.FC<{t: number; on: boolean}> = ({t, on}) => {
	const mm = useM();
	if (!on) return null;
	const x = -0.42 + ((t * 0.09) % 0.12);
	const y = 0.79 + Math.max(0, Math.sin(t * 22)) * 0.006;
	return (
		<group position={[x, y, -1.92]} rotation={[0, 0.5, 0]}>
			<Box p={[0.02, 0.04, 0.05]} s={[0.08, 0.05, 0.1]} m={mm.skin} />
			<Box p={[0.08, 0.05, 0.14]} s={[0.1, 0.08, 0.12]} m={mm.red} />
			<Box p={[-0.02, 0.06, -0.01]} s={[0.012, 0.012, 0.14]} m={mm.steelDark} r={[0.6, 0, 0]} />
		</group>
	);
};

/** The hand on the bolt. */
export const BoltHand: React.FC<{off: number}> = ({off}) => {
	const mm = useM();
	return (
		<group position={[2.9 - off * 0.12, 1.06 - off * 0.05, 0.74 + off * 0.1]}>
			<Box p={[0, 0, 0]} s={[0.07, 0.08, 0.1]} m={mm.skin} />
			<Box p={[-0.12, -0.02, 0.04]} s={[0.18, 0.1, 0.11]} m={mm.red} />
		</group>
	);
};

// ------------------------------------------------------------------ outside

export const DOOR_OUT: [number, number, number] = [3.4, 0, 1.1];
export const PRINT_FROM: [number, number, number] = [16, 0, -9];
export const prints = (() => {
	const out: {x: number; z: number; a: number}[] = [];
	const dx = DOOR_OUT[0] + 0.5 - PRINT_FROM[0], dz = DOOR_OUT[2] - PRINT_FROM[2];
	const len = Math.hypot(dx, dz);
	const a = Math.atan2(dx, dz);
	const n = Math.floor(len / 0.4);
	for (let i = 0; i <= n; i++) {
		const k = i / n;
		const side = i % 2 ? 1 : -1;
		out.push({x: PRINT_FROM[0] + dx * k + Math.cos(a) * side * 0.12, z: PRINT_FROM[2] + dz * k - Math.sin(a) * side * 0.12, a});
	}
	return out;
})();

export const Outside: React.FC<{t: number; printsShown: number; cups: number; carPos: number}> = ({t, printsShown, cups, carPos}) => {
	const mm = useM();
	const mountains = useMemo(() => {
		const r = rng(71);
		return new Array(26).fill(0).map(() => {
			const a = r() * Math.PI * 2;
			const d = 120 + r() * 160;
			return {x: Math.cos(a) * d, z: Math.sin(a) * d, h: 40 + r() * 70, w: 50 + r() * 60};
		});
	}, []);
	const pgeo = useMemo(() => new THREE.PlaneGeometry(0.2, 0.4), []);
	void t;
	// the cable runs from the platform (x -8) down the slope to the west
	const cableA = new THREE.Vector3(-8, 4.2, 0), cableB = new THREE.Vector3(-120, -55, 8);
	const car = cableA.clone().lerp(cableB, carPos);
	const cableLen = cableA.distanceTo(cableB);
	const cableMid = cableA.clone().lerp(cableB, 0.5);
	const cableRot = Math.atan2(cableB.y - cableA.y, Math.hypot(cableB.x - cableA.x, cableB.z - cableA.z));
	return (
		<group>
			{/* the ridge: a snowy shelf, falling away to the west and north */}
			<Box p={[15, -0.05, 0]} s={[50, 0.1, 50]} m={mm.snow} />
			<mesh position={[-60, -30, 0]} rotation={[0, 0, 0.45]} material={mm.snow}>
				<boxGeometry args={[110, 2, 120]} />
			</mesh>
			{mountains.map((m, i) => (
				<mesh key={i} position={[m.x, m.h / 2 - 50, m.z]} material={i % 3 ? mm.snow : mm.rock}>
					<coneGeometry args={[m.w, m.h + 40, 5]} />
				</mesh>
			))}
			{/* the hut shell */}
			<Box p={[-0.825, 1.4, -2.65]} s={[4.75, 2.8, 0.2]} m={mm.concrete} />
			<Box p={[2.775, 1.4, -2.65]} s={[0.85, 2.8, 0.2]} m={mm.concrete} />
			<Box p={[1.95, 0.6, -2.65]} s={[0.8, 1.2, 0.2]} m={mm.concrete} />
			<Box p={[1.95, 2.4, -2.65]} s={[0.8, 0.8, 0.2]} m={mm.concrete} />
			<Box p={[0, 1.4, 2.65]} s={[6.4, 2.8, 0.2]} m={mm.concrete} />
			<Box p={[-3.15, 1.4, 0]} s={[0.2, 2.8, 5.5]} m={mm.concrete} />
			<Box p={[0, 2.85, 0]} s={[6.8, 0.3, 5.9]} m={mm.snow} />
			{/* the east face around the window and door */}
			<Box p={[3.15, 1.4, -2.1]} s={[0.2, 2.8, 1.0]} m={mm.concrete} />
			<Box p={[3.15, 1.4, 0.1]} s={[0.2, 2.8, 1.0]} m={mm.concrete} />
			<Box p={[3.15, 1.4, 2.1]} s={[0.2, 2.8, 1.0]} m={mm.concrete} />
			<Box p={[3.15, 0.55, -1.0]} s={[0.2, 1.1, 1.2]} m={mm.concrete} />
			<Box p={[3.15, 2.4, -1.0]} s={[0.2, 0.8, 1.2]} m={mm.concrete} />
			<Box p={[3.15, 2.4, 1.1]} s={[0.2, 0.8, 1.0]} m={mm.concrete} />
			{/* the lamp over the door */}
			<Box p={[3.4, 2.3, 1.1]} s={[0.25, 0.08, 0.25]} m={mm.steelDark} />
			<Box p={[3.4, 2.24, 1.1]} s={[0.16, 0.04, 0.16]} m={mm.lampOn} />
			{/* the anemometer mast on the roof: three cups and a vane */}
			<Box p={[-1.8, 4.5, 1.6]} s={[0.1, 3.3, 0.1]} m={mm.steelDark} />
			<group position={[-1.8, 6.2, 1.6]} rotation={[0, cups, 0]}>
				{[0, 1, 2].map((i) => (
					<group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
						<Box p={[0.25, 0, 0]} s={[0.5, 0.025, 0.025]} m={mm.steelDark} />
						<mesh position={[0.5, 0, 0.05]} material={mm.beige} rotation={[0, 0, Math.PI / 2]}>
							<sphereGeometry args={[0.08, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
						</mesh>
					</group>
				))}
			</group>
			<Box p={[-1.8, 5.8, 1.6]} s={[0.5, 0.08, 0.02]} m={mm.steelDark} />
			{/* the cable-car platform and the line down the slope */}
			<Box p={[-6, 1.2, 0]} s={[4, 0.3, 4]} m={mm.concrete} />
			{[[-7.8, -1.6], [-7.8, 1.6], [-4.2, -1.6], [-4.2, 1.6]].map(([x, z], i) => (
				<Box key={i} p={[x, 2.8, z]} s={[0.2, 3.2, 0.2]} m={mm.steelDark} />
			))}
			<Box p={[-6, 4.5, 0]} s={[4.2, 0.3, 3.6]} m={mm.steelDark} />
			{[-0.3, 0.3].map((z) => (
				<mesh key={z} position={[cableMid.x, cableMid.y, cableMid.z + z]} rotation={[0, -Math.atan2(cableB.z - cableA.z, cableB.x - cableA.x), cableRot]} material={mm.cable}>
					<boxGeometry args={[cableLen, 0.04, 0.04]} />
				</mesh>
			))}
			<group position={[car.x, car.y - 1.3, car.z]}>
				<Box p={[0, 1.15, 0]} s={[0.06, 0.9, 0.06]} m={mm.steelDark} />
				<Box p={[0, 0, 0]} s={[2.2, 1.6, 1.6]} m={mm.red} />
				<Box p={[0, 0.25, 0.81]} s={[1.8, 0.5, 0.02]} m={mm.lampOn} />
			</group>
			{/* footprints, appearing one by one towards the door */}
			{prints.slice(0, Math.floor(printsShown * prints.length)).map((p, i) => (
				<mesh key={i} geometry={pgeo} material={mm.print} position={[p.x, 0.012, p.z]} rotation={[-Math.PI / 2, 0, p.a]} />
			))}
		</group>
	);
};

/** Falling snow around a point, with wind. Deterministic, wrapped, 1-pixel flakes. */
export const Snow: React.FC<{centre: [number, number, number]; t: number; wind: number; amount: number}> = ({centre, t, wind, amount}) => {
	const N = 1300;
	const base = useMemo(() => {
		const r = rng(77);
		return new Array(N).fill(0).map(() => [r() * 20 - 10, r() * 12, r() * 20 - 10, 0.8 + r() * 0.8, r() * 6] as const);
	}, []);
	const geo = useMemo(() => {
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
		return g;
	}, []);
	const mat = useMemo(() => new THREE.PointsMaterial({color: '#e8ecf4', size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.9}), []);
	mat.opacity = 0.9 * amount;
	const pos = geo.getAttribute('position') as THREE.BufferAttribute;
	const wrap = (v: number, c: number, w: number) => c - w / 2 + ((((v - c + w / 2) % w) + w) % w);
	for (let i = 0; i < N; i++) {
		const [x, y, z, sp, ph] = base[i];
		pos.setXYZ(i, wrap(x + t * wind * sp * 6 + Math.sin(t * 0.7 + ph) * 0.2, centre[0], 20), wrap(y - t * sp * (1 + wind * 1.5), centre[1] + 3, 12), wrap(z + t * wind * 2 + Math.cos(t * 0.5 + ph) * 0.2, centre[2], 20));
	}
	pos.needsUpdate = true;
	return <points geometry={geo} material={mat} frustumCulled={false} />;
};
