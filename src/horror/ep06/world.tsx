// Episode 6 world: "The Sound That Matched Us" (original). One submarine, inside and out.
//
// Layout (metres, y up). Inside: one compartment (sonar and control together),
// x[-2.6,2.6] z[-1.4,1.4], deck at y 0, curved overhead at ~2.1. The sonar console runs
// along the north side (z = -1.2) with the waterfall CRT at (-0.6, 1.15, -1.15); the
// operator sits at (-0.6, 0, -0.5) facing north (-z). The engine-order telegraph stands
// at (1.4, 0, -0.9). The loose panel is on the north bulkhead at (0.9, 1.5, -1.3). The
// round galley hatch is in the east bulkhead (x = 2.6). Pipes and frames overhead.
// Outside (a separate space at x = 300): the hull lies along x, bow +x, stern -x; the
// sail amidships. Underwater it hangs in black water; at dawn it lies surfaced.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {tex} from '../ep02/world';

const M = (color: string, opts: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...opts}), 20, SNAP6);
const B = (color: string, opts: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...opts}), 20, SNAP6);

const useMats = () =>
	useMemo(() => {
		const plate = tex(16, 16, (g, r) => {
			g.fillStyle = '#6a6e68';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#56594f';
			g.fillRect(0, 15, 16, 1);
			g.fillRect(15, 0, 1, 16);
			g.fillStyle = '#7a7e76';
			for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) g.fillRect(x, y, 1, 1);
			for (let i = 0; i < 16; i++) {
				g.fillStyle = r() > 0.5 ? '#626660' : '#707470';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
		}, 61, [4, 2]);
		const deck = tex(16, 16, (g) => {
			g.fillStyle = '#3a3c3a';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#2c2e2c';
			for (let x = 0; x < 16; x += 2) g.fillRect(x, 0, 1, 16);
		}, 62, [8, 4]);
		const hull = tex(16, 16, (g, r) => {
			g.fillStyle = '#6a6e72';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() > 0.5 ? '#5e6266' : '#44484c';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 3, 1);
			}
		}, 63, [20, 3]);
		return {
			plate: M('#ffffff', {map: plate, side: THREE.DoubleSide}),
			deck: M('#ffffff', {map: deck}),
			pipe: M('#8a7a5a'),
			pipeDark: M('#4a4a44'),
			console: M('#4a5048'),
			consoleDark: M('#22261f'),
			crt: M('#2a2e28'),
			brass: M('#a08848'),
			red: M('#7a1a14'),
			white: M('#c8c4b4'),
			hull: M('#ffffff', {map: hull, side: THREE.DoubleSide}),
			hullWet: M('#3a3e42'),
			gouge: B('#9aa0a0'),
			gougeDark: B('#0a0c0e'),
			water: M('#7a8a94'),
			lampRed: B('#ff3020'),
			lampOff: M('#3a1010'),
			black: B('#000000'),
			drip: B('#a8b8c0'),
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

const Screen: React.FC<{p: [number, number, number]; w: number; h: number; map: THREE.Texture; r?: [number, number, number]}> = ({p, w, h, map, r = [0, 0, 0]}) => {
	const m = useMemo(() => ps1(new THREE.MeshBasicMaterial({map}), 20, SNAP6), [map]);
	return (
		<mesh position={p} rotation={r} material={m}>
			<planeGeometry args={[w, h]} />
		</mesh>
	);
};

export const OPERATOR = {skin: '#c09878', hair: '#2a2420', top: '#3a4458', legs: '#2a2e3a'};
export const CAPTAIN = {skin: '#a8846a', hair: '#5a5a58', top: '#2a2e3a', legs: '#22242c'};
export const CREW = {skin: '#b08a70', hair: '#1a1410', top: '#4a5060', legs: '#2a2e3a'};
export const COOK = {skin: '#b8a090', hair: '#1a1816', top: '#c8c4b4', legs: '#3a3a3a'};

// ------------------------------------------------------------------ inside

export const Compartment: React.FC<{display: THREE.Texture; side: THREE.Texture; panel: number; telegraph: number; lamps: number; knock: number; t: number}> = ({display, side, panel, telegraph, lamps, knock, t}) => {
	const mm = useM();
	const frames = useMemo(() => [-2.2, -1.4, -0.6, 0.2, 1.0, 1.8], []);
	return (
		<group>
			<Box p={[0, -0.05, 0]} s={[5.4, 0.1, 3.0]} m={mm.deck} />
			{/* walls and the curved overhead, built from angled plates */}
			<Box p={[0, 0.9, -1.45]} s={[5.4, 1.8, 0.08]} m={mm.plate} />
			<Box p={[0, 0.9, 1.45]} s={[5.4, 1.8, 0.08]} m={mm.plate} />
			<Box p={[0, 1.95, -1.15]} s={[5.4, 0.08, 0.8]} m={mm.plate} r={[-0.6, 0, 0]} />
			<Box p={[0, 1.95, 1.15]} s={[5.4, 0.08, 0.8]} m={mm.plate} r={[0.6, 0, 0]} />
			<Box p={[0, 2.18, 0]} s={[5.4, 0.08, 1.7]} m={mm.plate} />
			<Box p={[-2.65, 1.1, 0]} s={[0.08, 2.2, 3.0]} m={mm.plate} />
			{/* east bulkhead with the round galley hatch */}
			<Box p={[2.65, 1.1, -1.05]} s={[0.08, 2.2, 0.9]} m={mm.plate} />
			<Box p={[2.65, 1.1, 1.05]} s={[0.08, 2.2, 0.9]} m={mm.plate} />
			<Box p={[2.65, 0.2, 0]} s={[0.08, 0.4, 1.2]} m={mm.plate} />
			<Box p={[2.65, 1.95, 0]} s={[0.08, 0.5, 1.2]} m={mm.plate} />
			<mesh position={[2.62, 1.05, 0]} rotation={[0, Math.PI / 2, 0]} material={mm.consoleDark}>
				<circleGeometry args={[0.62, 10]} />
			</mesh>
			<mesh position={[2.6, 1.05, 0]} rotation={[0, Math.PI / 2, 0]} material={mm.brass}>
				<torusGeometry args={[0.62, 0.05, 4, 10]} />
			</mesh>
			<Box p={[2.58, 1.05, 0.28]} s={[0.04, 0.24, 0.04]} m={mm.brass} r={[0.5, 0, 0]} />
			{/* frames and pipes overhead; they shake when something knocks on the hull */}
			<group position={[0, knock * 0.008, 0]}>
				{frames.map((x) => (
					<Box key={x} p={[x, 1.9, 0]} s={[0.1, 0.12, 2.9]} m={mm.pipeDark} />
				))}
				{[-0.5, -0.2, 0.25, 0.55].map((z, i) => (
					<mesh key={z} position={[0, 2.05 - (i % 2) * 0.08, z]} rotation={[0, 0, Math.PI / 2]} material={i % 2 ? mm.pipe : mm.pipeDark}>
						<cylinderGeometry args={[0.045, 0.045, 5.3, 6]} />
					</mesh>
				))}
				{/* condensation drops hanging from the pipes */}
				{[[-1.8, 0.25], [-0.9, -0.5], [0.3, 0.55], [1.2, -0.2], [-0.3, -0.2]].map(([x, z], i) => (
					<Box key={i} p={[x, 1.98 - ((t * 0.6 + i * 0.37) % 1) * (1.9 * Math.min(1, knock * 3 + 0.15)), z]} s={[0.018, 0.03, 0.018]} m={mm.drip} />
				))}
			</group>
			{/* red battle lamps */}
			{[-1.8, 0.0, 1.8].map((x) => (
				<Box key={x} p={[x, 2.1, -0.5]} s={[0.18, 0.06, 0.12]} m={lamps > 0.5 ? mm.lampRed : mm.lampOff} />
			))}
			{/* the sonar console along the north side */}
			<Box p={[-0.6, 0.45, -1.2]} s={[2.4, 0.9, 0.4]} m={mm.console} />
			<Box p={[-0.6, 0.93, -1.08]} s={[2.4, 0.06, 0.6]} m={mm.consoleDark} r={[0.2, 0, 0]} />
			<Box p={[-0.6, 1.3, -1.35]} s={[2.4, 0.9, 0.18]} m={mm.console} />
			<Box p={[-0.6, 1.17, -1.24]} s={[0.62, 0.5, 0.06]} m={mm.crt} />
			<Screen p={[-0.6, 1.17, -1.205]} w={0.52} h={0.42} map={display} />
			<Box p={[0.3, 1.25, -1.24]} s={[0.42, 0.36, 0.06]} m={mm.crt} />
			<Screen p={[0.3, 1.25, -1.205]} w={0.36} h={0.3} map={side} />
			{new Array(8).fill(0).map((_, i) => (
				<mesh key={i} position={[-1.5 + i * 0.24, 0.98, -0.92]} rotation={[Math.PI / 2 - 0.2, 0, 0]} material={i % 3 ? mm.brass : mm.white}>
					<cylinderGeometry args={[0.03, 0.03, 0.03, 6]} />
				</mesh>
			))}
			{/* the loose panel: one screw missing, it rattles */}
			<group position={[1.05, 1.55, -1.4]} rotation={[0, 0, panel * 0.04]}>
				<Box p={[0, 0, 0]} s={[0.4, 0.3, 0.02]} m={mm.white} />
				<Box p={[-0.17, 0.12, 0.015]} s={[0.025, 0.025, 0.01]} m={mm.pipeDark} />
				<Box p={[0.17, 0.12, 0.015]} s={[0.025, 0.025, 0.01]} m={mm.pipeDark} />
				<Box p={[-0.17, -0.12, 0.015]} s={[0.025, 0.025, 0.01]} m={mm.pipeDark} />
			</group>
			{/* the engine-order telegraph */}
			<group position={[1.5, 0, -0.8]}>
				<Box p={[0, 0.5, 0]} s={[0.12, 1.0, 0.12]} m={mm.brass} />
				<mesh position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]} material={mm.brass}>
					<cylinderGeometry args={[0.22, 0.22, 0.1, 10]} />
				</mesh>
				<mesh position={[0, 1.15, 0.055]} material={mm.white}>
					<circleGeometry args={[0.19, 10]} />
				</mesh>
				<Box p={[0, 1.15, 0.07]} s={[0.012, 0.012, 0.01]} m={mm.red} />
				<group position={[0, 1.15, 0.08]} rotation={[0, 0, -1.0 + telegraph * 1.0]}>
					<Box p={[0, 0.14, 0]} s={[0.02, 0.28, 0.02]} m={mm.consoleDark} />
				</group>
				<Box p={[0.26, 1.15, 0]} s={[0.04, 0.3, 0.04]} m={mm.brass} r={[0, 0, -0.6 + telegraph * 0.6]} />
			</group>
			{/* the operator's chair */}
			<Box p={[-0.6, 0.45, -0.45]} s={[0.5, 0.06, 0.5]} m={mm.consoleDark} />
			<Box p={[-0.6, 0.22, -0.45]} s={[0.06, 0.44, 0.06]} m={mm.pipeDark} />
		</group>
	);
};

/** Headphones on the operator's head (the head at hp). */
export const Headphones: React.FC<{p: [number, number, number]}> = ({p}) => {
	const mm = useM();
	return (
		<group position={p}>
			<mesh rotation={[0, 0, 0]} material={mm.consoleDark}>
				<torusGeometry args={[0.15, 0.015, 3, 8, Math.PI]} />
			</mesh>
			<Box p={[0.15, -0.02, 0]} s={[0.05, 0.1, 0.1]} m={mm.consoleDark} />
			<Box p={[-0.15, -0.02, 0]} s={[0.05, 0.1, 0.1]} m={mm.consoleDark} />
		</group>
	);
};

// ------------------------------------------------------------------ outside

export const SUB_X = 300;
/** The hull: a long cylinder with tapered ends, the sail, planes and rudder. scrape: show the gouges on the stern. */
export const Submarine: React.FC<{p: [number, number, number]; dark?: boolean; scrape?: boolean}> = ({p, dark, scrape}) => {
	const mm = useM();
	const m = dark ? mm.black : mm.hull;
	return (
		<group position={p}>
			<mesh rotation={[0, 0, Math.PI / 2]} material={m}>
				<cylinderGeometry args={[1.6, 1.6, 30, 10]} />
			</mesh>
			<mesh position={[16.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={m}>
				<coneGeometry args={[1.6, 3.2, 10]} />
			</mesh>
			<mesh position={[-18.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m}>
				<coneGeometry args={[1.6, 7, 10]} />
			</mesh>
			<Box p={[4, 2.4, 0]} s={[5, 2.4, 1.0]} m={m} />
			<Box p={[4, 2.6, 0]} s={[2.4, 0.12, 3.2]} m={m} />
			<Box p={[-21, 0, 0]} s={[1.6, 3.4, 0.15]} m={m} />
			<Box p={[-21, 0, 0]} s={[1.6, 0.15, 3.4]} m={m} />
			{/* the screw */}
			<group position={[-22.2, 0, 0]}>
				{[0, 1, 2, 3, 4, 5, 6].map((i) => (
					<Box key={i} p={[0, Math.cos((i / 7) * Math.PI * 2) * 0.45, Math.sin((i / 7) * Math.PI * 2) * 0.45]} s={[0.12, 0.7, 0.3]} m={m} r={[(i / 7) * Math.PI * 2, 0, 0]} />
				))}
			</group>
			{/* the scrape: long parallel gouges down the stern on the hull's flank, ending in three dents */}
			{scrape && (
				<group>
					{[0, 1, 2, 3].map((i) => {
						const a = 0.82 + i * 0.07;
						return (
							<mesh key={i} position={[-8, Math.sin(a) * 1.63, Math.cos(a) * 1.63]} rotation={[-a, 0, 0]} material={mm.gouge}>
								<boxGeometry args={[12 - i * 1.1, 0.035, 0.02]} />
							</mesh>
						);
					})}
					{[0, 1, 2].map((i) => (
						<group key={i} position={[-13.5 + i * 0.3, Math.sin(0.72) * 1.62, Math.cos(0.72) * 1.62]} rotation={[-0.72, 0, 0]}>
							<mesh material={mm.gouge}>
								<circleGeometry args={[0.1, 8]} />
							</mesh>
							<mesh material={mm.gougeDark} position={[0, 0, 0.004]}>
								<circleGeometry args={[0.065, 8]} />
							</mesh>
						</group>
					))}
				</group>
			)}
		</group>
	);
};

export const Sea: React.FC<{surface: boolean}> = ({surface}) => {
	const mm = useM();
	return (
		<group position={[SUB_X, 0, 0]}>
			{surface && <Box p={[0, 0.9, 0]} s={[400, 0.1, 400]} m={mm.water} />}
			{/* the sea floor, far below */}
			<Box p={[0, -60, 0]} s={[600, 1, 600]} m={mm.water} />
		</group>
	);
};
