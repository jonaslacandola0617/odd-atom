// Episode 3 world: "Footprints in the Snow" (Hinterkaifeck, 1922). One consistent set.
//
// Layout (metres, y up). One long building, house and barn under one roof:
//   x[-6,10], z[-4,4]; ground floor 2.7 m, attic under the roof (ridge at y 6.2).
//   House part x[-6,3.2]: the main room ("Stube") x[-6,-1], the hall x[-1,1] with the
//   front door on the south wall (z = 4) and the attic hatch at (0, 2.7, -1.5), the
//   maid's chamber x[1,3.2] z[-4,0]. The barn x[3.2,10] with the cattle stalls.
//   The attic spans the whole length; a small gable window at the west end (x = -6).
//   The forest rings the clearing; the footprints come out of it from the south-west
//   (around (-24, 0, 26)) straight to the front door. None lead away.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';
import {tex} from '../ep02/world';

const M = (color: string, opts: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...opts}), 20, SNAP6);
const B = (color: string, opts: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...opts}), 20, SNAP6);

const useMats = () =>
	useMemo(() => {
		const snow = tex(32, 32, (g, r) => {
			g.fillStyle = '#d8dce4';
			g.fillRect(0, 0, 32, 32);
			for (let i = 0; i < 160; i++) {
				g.fillStyle = r() > 0.5 ? '#e4e8ee' : '#c8ccd6';
				g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 2, 1);
			}
		}, 31, [40, 40]);
		const plaster = tex(16, 16, (g, r) => {
			g.fillStyle = '#b8b0a0';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() > 0.5 ? '#aaa292' : '#c2baaa';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
		}, 32, [6, 2]);
		const planks = tex(16, 32, (g, r) => {
			g.fillStyle = '#5a4030';
			g.fillRect(0, 0, 16, 32);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#3e2c20';
				g.fillRect(x, 0, 1, 32);
				if (r() > 0.5) {
					g.fillStyle = '#4a3426';
					g.fillRect(x + 2, Math.floor(r() * 28), 1, 4);
				}
			}
		}, 33, [6, 1]);
		const boards = tex(32, 16, (g, r) => {
			g.fillStyle = '#5e4632';
			g.fillRect(0, 0, 32, 16);
			for (let y = 0; y < 16; y += 4) {
				g.fillStyle = '#3a2a1e';
				g.fillRect(0, y, 32, 1);
				g.fillStyle = r() > 0.5 ? '#664c36' : '#54402e';
				g.fillRect(Math.floor(r() * 24), y + 1, 8, 2);
			}
		}, 34, [3, 3]);
		const roof = tex(16, 16, (g, r) => {
			g.fillStyle = '#e0e4ea';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 20; i++) {
				g.fillStyle = r() > 0.5 ? '#ccd0d8' : '#eef0f4';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 3, 1);
			}
		}, 35, [8, 3]);
		const hay = tex(16, 16, (g, r) => {
			g.fillStyle = '#7a6a3a';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 60; i++) {
				g.fillStyle = r() > 0.5 ? '#9a8648' : '#5e5028';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1 + Math.floor(r() * 3), 1);
			}
		}, 36, [2, 2]);
		const tiles = tex(8, 8, (g) => {
			g.fillStyle = '#3e5a46';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#2e4434';
			g.fillRect(0, 3, 8, 1);
			g.fillRect(3, 0, 1, 8);
			g.fillStyle = '#5a7a62';
			g.fillRect(1, 1, 1, 1);
		}, 37, [3, 3]);
		return {
			snow: M('#ffffff', {map: snow}),
			plaster: M('#ffffff', {map: plaster, side: THREE.DoubleSide}),
			planks: M('#ffffff', {map: planks, side: THREE.DoubleSide}),
			boards: M('#ffffff', {map: boards, side: THREE.DoubleSide}),
			roofSnow: M('#ffffff', {map: roof, side: THREE.DoubleSide}),
			roofUnder: M('#3a2c22', {side: THREE.DoubleSide}),
			hay: M('#ffffff', {map: hay}),
			tiles: M('#ffffff', {map: tiles}),
			wood: M('#4a3424'),
			woodDark: M('#2e2018'),
			beam: M('#3a2a1e'),
			iron: M('#3a3a3c'),
			linen: M('#a8a294'),
			mattress: M('#6a6050'),
			hollow: M('#4e4228'),
			paper: M('#d4ccb4'),
			bread: M('#8a5a2a'),
			brass: M('#b0904a'),
			trunk: M('#2a2018'),
			pine: M('#1a2a22'),
			pineSnow: M('#c8d0d8'),
			cow: M('#6a4a34'),
			cowLight: M('#c8bca8'),
			cowSpot: M('#8a7058'),
			print: B('#2e3448'),
			windowLit: B('#ffc070'),
			windowDark: B('#141820'),
			black: B('#000000'),
			smoke: B('#9aa0a8', {transparent: true, opacity: 0.35, depthWrite: false}),
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

export const FARMER = {skin: '#a88a70', hair: '#6a6660', top: '#2e2a26', legs: '#24221e'};

// ------------------------------------------------------------------ the footprints

export const DOOR: [number, number, number] = [0, 0, 4.0];
export const TRACK_START: [number, number, number] = [-24, 0, 26];
/** Step positions from the forest edge to the door: one line in, none out. */
export const steps = (() => {
	const out: {x: number; z: number; a: number; side: number}[] = [];
	const dx = DOOR[0] - TRACK_START[0], dz = DOOR[2] + 0.5 - TRACK_START[2];
	const len = Math.hypot(dx, dz);
	const a = Math.atan2(dx, dz);
	const n = Math.floor(len / 0.38);
	const r = rng(91);
	for (let i = 0; i <= n; i++) {
		const k = i / n;
		const side = i % 2 ? 1 : -1;
		const bend = Math.sin(k * Math.PI * 1.3) * 1.2;
		const px = TRACK_START[0] + dx * k + Math.cos(a) * (side * 0.12 + bend);
		const pz = TRACK_START[2] + dz * k - Math.sin(a) * (side * 0.12 + bend);
		out.push({x: px + (r() - 0.5) * 0.03, z: pz, a: a + (r() - 0.5) * 0.15, side});
	}
	return out;
})();

const Footprints: React.FC = () => {
	const mm = useM();
	const geo = useMemo(() => new THREE.PlaneGeometry(0.13, 0.3), []);
	return (
		<group>
			{steps.map((s, i) => (
				<mesh key={i} geometry={geo} material={mm.print} position={[s.x, 0.012, s.z]} scale={1.25} rotation={[-Math.PI / 2, 0, s.a]} />
			))}
		</group>
	);
};

// ------------------------------------------------------------------ the long house

const gableGeo = (w: number, h: number) => {
	const sh = new THREE.Shape();
	sh.moveTo(-w / 2, 0);
	sh.lineTo(w / 2, 0);
	sh.lineTo(0, h);
	sh.lineTo(-w / 2, 0);
	return new THREE.ShapeGeometry(sh);
};

export type HouseState = {stubeLit: number; maidLit: number; atticGlow: number; hatchOpen: number; smoke: number; t: number};

export const Farm: React.FC<{st: HouseState}> = ({st}) => {
	const mm = useM();
	const gable = useMemo(() => gableGeo(8.0, 3.5), []);
	const slope = Math.atan2(3.5, 4.0);
	const slopeLen = Math.hypot(4.6, 3.5 * 4.6 / 4.0);
	const litM = useMemo(() => B('#ffc070'), []);
	litM.color.setRGB(0.08 + st.stubeLit * 0.92, 0.07 + st.stubeLit * 0.68, 0.08 + st.stubeLit * 0.36);
	const atticM = useMemo(() => B('#ffb060'), []);
	atticM.color.setRGB(0.05 + st.atticGlow * 0.35, 0.05 + st.atticGlow * 0.22, 0.06 + st.atticGlow * 0.08);
	const smokePuffs = useMemo(() => new Array(14).fill(0).map((_, i) => i), []);
	return (
		<group>
			{/* ground floor outer walls: house plastered, barn timber */}
			<Box p={[-2.6, 1.35, -4]} s={[11.6, 2.7, 0.25]} m={mm.plaster} />
			<Box p={[6.6, 1.35, -4]} s={[6.8, 2.7, 0.25]} m={mm.planks} />
			{/* south wall with door (x[-0.5,0.5]) and Stube windows (x -4.5, -2.5; y 1.0-1.8) */}
			<Box p={[-5.6, 1.35, 4]} s={[0.8, 2.7, 0.25]} m={mm.plaster} />
			<Box p={[-3.5, 1.35, 4]} s={[1.4, 2.7, 0.25]} m={mm.plaster} />
			<Box p={[-1.35, 1.35, 4]} s={[1.7, 2.7, 0.25]} m={mm.plaster} />
			<Box p={[1.85, 1.35, 4]} s={[2.7, 2.7, 0.25]} m={mm.plaster} />
			<Box p={[0, 2.35, 4]} s={[1.0, 0.7, 0.25]} m={mm.plaster} />
			{[-4.5, -2.5].map((x) => (
				<group key={x}>
					<Box p={[x, 0.5, 4]} s={[0.6, 1.0, 0.25]} m={mm.plaster} />
					<Box p={[x, 2.25, 4]} s={[0.6, 0.9, 0.25]} m={mm.plaster} />
					<mesh position={[x, 1.4, 4.0]} material={litM}>
						<planeGeometry args={[0.6, 0.8]} />
					</mesh>
					<Box p={[x, 1.4, 4.13]} s={[0.04, 0.8, 0.03]} m={mm.woodDark} />
					<Box p={[x, 1.4, 4.13]} s={[0.6, 0.04, 0.03]} m={mm.woodDark} />
				</group>
			))}
			<Box p={[6.6, 1.35, 4]} s={[6.8, 2.7, 0.25]} m={mm.planks} />
			<Box p={[-6, 1.35, 0]} s={[0.25, 2.7, 8.2]} m={mm.plaster} />
			<Box p={[10, 1.35, 0]} s={[0.25, 2.7, 8.2]} m={mm.planks} />
			{/* the front door, shut */}
			<Box p={[0, 1.0, 4.02]} s={[0.98, 2.0, 0.1]} m={mm.wood} />
			<Box p={[0.32, 1.0, 4.09]} s={[0.06, 0.06, 0.05]} m={mm.iron} />
			<Box p={[0, 0.06, 4.35]} s={[1.3, 0.12, 0.5]} m={mm.woodDark} />
			{/* interior walls */}
			<Box p={[-1, 1.35, -1.6]} s={[0.15, 2.7, 4.8]} m={mm.plaster} />
			<Box p={[-1, 1.35, 3.0]} s={[0.15, 2.7, 2.0]} m={mm.plaster} />
			<Box p={[-1, 2.35, 1.5]} s={[0.15, 0.7, 1.0]} m={mm.plaster} />
			<Box p={[1, 1.35, -2]} s={[0.15, 2.7, 4.0]} m={mm.plaster} />
			<Box p={[2.1, 1.35, 0]} s={[2.2, 2.7, 0.15]} m={mm.plaster} />
			<Box p={[3.2, 1.35, 0]} s={[0.15, 2.7, 8.0]} m={mm.planks} />
			{/* floors and the ceiling (attic floor) with the hatch hole x[-0.4,0.4] z[-1.9,-1.1] */}
			<Box p={[2, -0.02, 0]} s={[16, 0.04, 8]} m={mm.boards} />
			<Box p={[-3.2, 2.75, 0]} s={[5.6, 0.1, 8]} m={mm.boards} />
			<Box p={[5.7, 2.75, 0]} s={[8.6, 0.1, 8]} m={mm.boards} />
			<Box p={[0, 2.75, 1.45]} s={[0.8, 0.1, 5.1]} m={mm.boards} />
			<Box p={[0, 2.75, -2.95]} s={[0.8, 0.1, 2.1]} m={mm.boards} />
			{/* the hatch lid, hinged on its north edge */}
			<group position={[0, 2.8, -1.9]} rotation={[st.hatchOpen * 1.7, 0, 0]}>
				<Box p={[0, 0.02, 0.4]} s={[0.78, 0.05, 0.8]} m={mm.wood} />
			</group>
			{/* ladder to the hatch */}
			{[-0.22, 0.22].map((x) => (
				<Box key={x} p={[x, 1.35, -1.2]} s={[0.06, 2.9, 0.06]} m={mm.wood} r={[-0.25, 0, 0]} />
			))}
			{[0.3, 0.75, 1.2, 1.65, 2.1, 2.55].map((y) => (
				<Box key={y} p={[0, y, -1.2 + (y - 1.35) * 0.255]} s={[0.46, 0.04, 0.05]} m={mm.wood} />
			))}
			{/* ceiling beams in the Stube */}
			{[-5, -3.6, -2.2].map((x) => (
				<Box key={x} p={[x, 2.62, 0]} s={[0.18, 0.18, 8]} m={mm.beam} />
			))}
			{/* roof: two snowy slopes, dark underside, gables */}
			{[1, -1].map((side) => (
				<group key={side} position={[2, 6.2 - (3.5 * 2.3) / 4.0, side * 2.3]} rotation={[side * slope, 0, 0]}>
					<Box p={[0, 0.06, 0]} s={[17, 0.12, slopeLen]} m={mm.roofSnow} />
					<Box p={[0, -0.06, 0]} s={[16.8, 0.08, slopeLen - 0.1]} m={mm.roofUnder} />
				</group>
			))}
			<mesh geometry={gable} material={mm.plaster} position={[-6, 2.7, 0]} rotation={[0, -Math.PI / 2, 0]} />
			<mesh geometry={gable} material={mm.planks} position={[10, 2.7, 0]} rotation={[0, Math.PI / 2, 0]} />
			{/* the small attic gable window, west end */}
			<mesh position={[-6.14, 4.2, 0]} rotation={[0, -Math.PI / 2, 0]} material={atticM}>
				<planeGeometry args={[0.5, 0.4]} />
			</mesh>
			<Box p={[-6.16, 4.2, 0]} s={[0.03, 0.04, 0.5]} m={mm.woodDark} />
			{/* chimney + smoke */}
			<Box p={[-3, 5.6, -0.8]} s={[0.6, 2.2, 0.6]} m={mm.plaster} />
			{st.smoke > 0 &&
				smokePuffs.map((i) => {
					const k = ((st.t * 0.18 + i / smokePuffs.length) % 1);
					return (
						<mesh key={i} position={[-3 + k * 2.2 + Math.sin(i * 2 + st.t) * 0.2, 6.9 + k * 5, -0.8 - k * 0.6]} material={mm.smoke} scale={0.4 + k * 1.6}>
							<icosahedronGeometry args={[0.5, 0]} />
						</mesh>
					);
				})}
		</group>
	);
};

// ------------------------------------------------------------------ interiors

const Crucifix: React.FC<{p: [number, number, number]; r?: number}> = ({p, r = 0}) => {
	const mm = useM();
	return (
		<group position={p} rotation={[0, r, 0]}>
			<Box p={[0, 0, 0]} s={[0.03, 0.3, 0.03]} m={mm.woodDark} />
			<Box p={[0, 0.06, 0]} s={[0.18, 0.03, 0.03]} m={mm.woodDark} />
		</group>
	);
};

export const Interiors: React.FC<{paper: THREE.Texture; keys: number; lampSwing: number}> = ({paper, keys, lampSwing}) => {
	const mm = useM();
	const paperM = useMemo(() => ps1(new THREE.MeshLambertMaterial({map: paper}), 20, SNAP6), [paper]);
	return (
		<group>
			{/* Stube: table, benches, the green tiled stove, the corner crucifix */}
			<Box p={[-3.6, 0.76, -1.8]} s={[1.6, 0.06, 0.9]} m={mm.wood} />
			{[[-4.3, -2.15], [-2.9, -2.15], [-4.3, -1.45], [-2.9, -1.45]].map(([x, z], i) => (
				<Box key={i} p={[x, 0.37, z]} s={[0.07, 0.74, 0.07]} m={mm.woodDark} />
			))}
			<Box p={[-5.7, 0.45, -1.2]} s={[0.4, 0.06, 5.0]} m={mm.wood} />
			<Box p={[-3.4, 0.45, -3.7]} s={[4.6, 0.06, 0.4]} m={mm.wood} />
			<Box p={[-1.75, 0.8, 2.9]} s={[1.1, 1.6, 1.0]} m={mm.tiles} />
			<Box p={[-1.75, 1.7, 2.9]} s={[1.0, 0.2, 0.9]} m={mm.tiles} />
			<Crucifix p={[-5.8, 1.9, -3.8]} r={Math.PI / 4} />
			{/* the paper on the table */}
			<mesh position={[-3.4, 0.795, -1.7]} rotation={[-Math.PI / 2, 0, 0.3]} material={paperM}>
				<planeGeometry args={[0.36, 0.48]} />
			</mesh>
			{/* hanging oil lamp */}
			<group position={[-3.6, 2.6, -1.8]} rotation={[lampSwing, 0, lampSwing * 0.6]}>
				<Box p={[0, -0.3, 0]} s={[0.01, 0.6, 0.01]} m={mm.iron} />
				<mesh position={[0, -0.68, 0]} material={mm.brass}>
					<cylinderGeometry args={[0.09, 0.12, 0.14, 6]} />
				</mesh>
				<mesh position={[0, -0.56, 0]}>
					<cylinderGeometry args={[0.04, 0.05, 0.12, 6]} />
					<meshBasicMaterial color="#ffd890" />
				</mesh>
			</group>
			{/* the key board by the door, Stube side of the hall wall: four hooks, one bunch missing */}
			<group position={[-1.09, 1.55, -0.3]}>
				<Box p={[0, 0, 0]} s={[0.04, 0.2, 0.62]} m={mm.wood} />
				{[-0.22, -0.07, 0.08, 0.23].map((z, i) => (
					<group key={z}>
						<Box p={[-0.05, -0.03, z]} s={[0.07, 0.015, 0.015]} m={mm.iron} />
						{i !== 2 && (
							<group position={[-0.08, -0.1, z]}>
								<mesh material={mm.brass} rotation={[0, Math.PI / 2, 0]}>
									<torusGeometry args={[0.035, 0.008, 4, 8]} />
								</mesh>
								<Box p={[0, -0.07, 0]} s={[0.01, 0.09, 0.025]} m={mm.brass} />
							</group>
						)}
					</group>
				))}
				{keys > 0 && <Box p={[-0.03, -0.12, 0.08]} s={[0.005, 0.12, 0.05]} m={mm.wood} />}
			</group>
			{/* the maid's chamber: iron bed, bare mattress, a crucifix, nothing else */}
			<Box p={[2.2, 0.35, -3.0]} s={[0.9, 0.12, 1.9]} m={mm.mattress} />
			<Box p={[2.2, 0.55, -3.98 + 0.08]} s={[0.95, 0.7, 0.05]} m={mm.iron} />
			<Box p={[2.2, 0.4, -2.02]} s={[0.95, 0.4, 0.05]} m={mm.iron} />
			{[[1.78, -3.9], [2.62, -3.9], [1.78, -2.1], [2.62, -2.1]].map(([x, z], i) => (
				<Box key={i} p={[x, 0.15, z]} s={[0.04, 0.3, 0.04]} m={mm.iron} />
			))}
			<Box p={[2.2, 0.43, -2.4]} s={[0.7, 0.04, 0.5]} m={mm.linen} />
			<Crucifix p={[1.6, 1.5, -3.85]} />
			<Box p={[1.4, 0.3, -0.5]} s={[0.4, 0.6, 0.4]} m={mm.wood} />
			<mesh position={[2.75, 1.75, -3.86]}>
				<planeGeometry args={[0.45, 0.5]} />
				<meshBasicMaterial color="#5a6474" />
			</mesh>
			{/* the barn: stalls, the manger along the north wall, hay, a fork */}
			<Box p={[6.6, 0.45, -3.55]} s={[6.4, 0.9, 0.6]} m={mm.wood} />
			<Box p={[6.6, 0.85, -3.55]} s={[6.2, 0.15, 0.45]} m={mm.hay} />
			{[4.6, 6.6, 8.6].map((x) => (
				<Box key={x} p={[x + 1, 0.6, -2.2]} s={[0.08, 1.2, 2.2]} m={mm.wood} />
			))}
			<Box p={[8.6, 0.6, 2.4]} s={[2.4, 1.2, 2.4]} m={mm.hay} />
			<Box p={[5.0, 0.8, 1.2]} s={[0.04, 1.6, 0.04]} m={mm.wood} r={[0.3, 0, 0.2]} />
			{/* attic: rafters, hay piles, the hollow in the hay (dressed separately) */}
			{[-5, -3, -1, 1, 3, 5, 7, 9].map((x) => (
				<group key={x}>
					<Box p={[x, 4.45, 2]} s={[0.12, 0.12, 5.3]} m={mm.beam} r={[Math.atan2(3.5, 4.0), 0, 0]} />
					<Box p={[x, 4.45, -2]} s={[0.12, 0.12, 5.3]} m={mm.beam} r={[-Math.atan2(3.5, 4.0), 0, 0]} />
				</group>
			))}
			<Box p={[2, 6.1, 0]} s={[16, 0.14, 0.14]} m={mm.beam} />
			<mesh position={[-3.6, 2.8, 1.8]} material={mm.hay} scale={[1.6, 0.5, 1.2]}>
				<icosahedronGeometry args={[1, 1]} />
			</mesh>
			<mesh position={[4.5, 2.8, -1.5]} material={mm.hay} scale={[2.4, 0.8, 1.6]}>
				<icosahedronGeometry args={[1, 1]} />
			</mesh>
			<mesh position={[1.6, 2.8, 2.6]} material={mm.hay} scale={[1.2, 0.6, 1.0]}>
				<icosahedronGeometry args={[1, 1]} />
			</mesh>
		</group>
	);
};

/** The hollow in the attic hay where someone could have lain: crusts, and a ring of keys. */
export const Hollow: React.FC = () => {
	const mm = useM();
	return (
		<group position={[-3.6, 2.8, 1.8]}>
			{/* a pressed-down hollow: a darker, flattened patch shaped like a lying body */}
			<mesh position={[0.15, 0.53, 0.05]} material={mm.hollow} scale={[0.75, 0.03, 0.3]}>
				<icosahedronGeometry args={[1, 1]} />
			</mesh>
			<Box p={[-0.5, 0.56, 0.3]} s={[0.16, 0.07, 0.1]} m={mm.bread} r={[0, 0.4, 0]} />
			<Box p={[-0.35, 0.56, 0.45]} s={[0.1, 0.06, 0.07]} m={mm.bread} r={[0, -0.3, 0]} />
			<group position={[0.5, 0.57, 0.3]} rotation={[-Math.PI / 2, 0, 0.6]}>
				<mesh material={mm.brass}>
					<torusGeometry args={[0.04, 0.009, 4, 8]} />
				</mesh>
				<Box p={[0.07, 0, 0]} s={[0.1, 0.02, 0.01]} m={mm.brass} />
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ forest + cattle + snowfall

export const Forest: React.FC = () => {
	const mm = useM();
	const trees = useMemo(() => {
		const r = rng(57);
		const out: {x: number; z: number; s: number}[] = [];
		for (let i = 0; i < 260; i++) {
			const a = r() * Math.PI * 2;
			const d = 26 + r() * 50;
			const x = Math.cos(a) * d + 2, z = Math.sin(a) * d;
			// keep the gap where the tracks come out of the forest
			const ta = Math.atan2(TRACK_START[2], TRACK_START[0] - 2);
			if (Math.abs(((a - ta + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.07 && d < 34) continue;
			out.push({x, z, s: 0.8 + r() * 0.8});
		}
		return out;
	}, []);
	return (
		<group>
			<Box p={[2, -0.05, 0]} s={[300, 0.1, 300]} m={mm.snow} />
			{trees.map((t, i) => (
				<group key={i} position={[t.x, 0, t.z]} scale={t.s}>
					<Box p={[0, 1, 0]} s={[0.35, 2, 0.35]} m={mm.trunk} />
					<mesh position={[0, 4.2, 0]} material={mm.pine}>
						<coneGeometry args={[2.0, 5.5, 6]} />
					</mesh>
					<mesh position={[0, 7.2, 0]} material={mm.pineSnow}>
						<coneGeometry args={[1.1, 2.6, 6]} />
					</mesh>
				</group>
			))}
			{/* a woodpile and a fence post by the farm, for scale */}
			<Box p={[-7.2, 0.5, 2.5]} s={[0.8, 1.0, 2.4]} m={mm.wood} />
			<Box p={[-7.2, 1.04, 2.5]} s={[0.9, 0.1, 2.5]} m={mm.roofSnow} />
			{[12, 14, 16, 18].map((x) => (
				<Box key={x} p={[x, 0.6, 6]} s={[0.12, 1.2, 0.12]} m={mm.wood} />
			))}
			<Footprints />
		</group>
	);
};

export const Cattle: React.FC<{t: number}> = ({t}) => {
	const mm = useM();
	return (
		<group>
			{[5.6, 7.6, 9.2].map((x, i) => {
				const chew = Math.sin(t * 3 + i * 1.7) * 0.04;
				return (
					<group key={x} position={[x - 0.6, 0, -1.6]} rotation={[0, Math.PI, 0]}>
						<Box p={[0, 1.0, 0]} s={[0.7, 0.75, 1.6]} m={i === 1 ? mm.cowSpot : mm.cow} />
						{[[-0.25, -0.6], [0.25, -0.6], [-0.25, 0.6], [0.25, 0.6]].map(([dx, dz], k) => (
							<Box key={k} p={[dx, 0.32, dz]} s={[0.14, 0.64, 0.14]} m={mm.cow} />
						))}
						<group position={[0, 1.05 + chew, 1.0]} rotation={[0.5 + chew, 0, 0]}>
							<Box p={[0, 0, 0.2]} s={[0.36, 0.36, 0.52]} m={i === 1 ? mm.cowLight : mm.cow} />
							<Box p={[0.2, 0.18, 0.05]} s={[0.12, 0.05, 0.05]} m={mm.cowLight} />
							<Box p={[-0.2, 0.18, 0.05]} s={[0.12, 0.05, 0.05]} m={mm.cowLight} />
						</group>
					</group>
				);
			})}
		</group>
	);
};

/** Falling snow around a point: deterministic, wraps in a box, 1-pixel flakes. */
export const Snowfall: React.FC<{centre: THREE.Vector3; t: number; amount: number}> = ({centre, t, amount}) => {
	const N = 1400;
	const base = useMemo(() => {
		const r = rng(404);
		return new Array(N).fill(0).map(() => [r() * 24 - 12, r() * 14, r() * 24 - 12, 0.6 + r() * 0.8, r() * 6] as const);
	}, []);
	const geo = useMemo(() => {
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
		return g;
	}, []);
	const mat = useMemo(() => new THREE.PointsMaterial({color: '#e8ecf4', size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.9, fog: true}), []);
	mat.opacity = 0.9 * amount;
	const pos = geo.getAttribute('position') as THREE.BufferAttribute;
	for (let i = 0; i < N; i++) {
		const [x, y, z, sp, ph] = base[i];
		const wrap = (v: number, c: number, w: number) => c - w / 2 + ((((v - c + w / 2) % w) + w) % w);
		pos.setXYZ(
			i,
			wrap(x + Math.sin(t * 0.7 + ph) * 0.3 + t * 0.25, centre.x, 24),
			wrap(y - t * sp, centre.y + 4, 14),
			wrap(z + Math.cos(t * 0.5 + ph) * 0.3, centre.z, 24),
		);
	}
	pos.needsUpdate = true;
	return <points geometry={geo} material={mat} frustumCulled={false} />;
};
