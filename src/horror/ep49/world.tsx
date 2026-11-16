// Episode 49 world: "Bukas Pa Kagabi" (Season 5, a delivery rider's experience shared online and retold).
// A composite street corner and milk tea shop (no real shop, brand, street or barangay):
// - THE SHOP: x −2..2, z −4.6..0, 2.7 m high, its glass front on z = 0 facing the street (+z), the glass
//   door at x 1.2..1.9. The counter runs across at z −4.1..−3.6 (top 1.0), the crew behind it at z −4.35,
//   the menu board and cup shelves on the back wall (z −4.6). The queue stands at x 0.1, z −3.1 … −0.7.
// - THE STREET: sidewalk z 0..1.6, road z 1.6..8, the far kerb; shuttered shops on either side of ours and
//   two dark storeys above; one street lamp.
// - DAY: the same front with its rolling shutter down, a chain and padlock, a FOR RENT sheet, dust.
import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {PsxProp} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const SHOP = {x0: -2, x1: 2, z0: -4.6, z1: 0, h: 2.7};
export const COUNTER = {z0: -4.1, z1: -3.6, top: 1.0};
export const CREW_P: V3 = [0.15, 0, -4.35];
/** the queue, front to back: five, and the place behind them */
export const QUEUE: {name: string; p: V3}[] = [
	{name: 'Character_03', p: [0.15, 0, -3.1]},
	{name: 'Character_29_Female', p: [-0.3, 0, -2.5]},
	{name: 'Character_30', p: [0.42, 0, -1.9]},
	{name: 'Character_31_Female', p: [-0.25, 0, -1.3]},
	{name: 'Character_05', p: [0.3, 0, -0.7]},
];

const text = (w: number, h: number, bg: string, rows: [string, number, string, string?][]) =>
	tex(w, h, (g) => {
		g.fillStyle = bg;
		g.fillRect(0, 0, w, h);
		g.textBaseline = 'top';
		for (const [s, y, color, font] of rows) {
			g.font = font ?? '7px monospace';
			g.fillStyle = color;
			g.textAlign = 'center';
			g.fillText(s, w / 2, y);
		}
	});

const useMatsInner = () =>
	useMemo(() => {
		const tiles = tex(16, 16, (g) => {
			g.fillStyle = '#c8bca8';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#9a8e7a';
			g.fillRect(0, 0, 16, 1);
			g.fillRect(0, 0, 1, 16);
		}, [8, 9]);
		const wood = tex(16, 16, (g) => {
			g.fillStyle = '#7a5a3e';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 16; i += 4) {
				g.fillStyle = '#5e432e';
				g.fillRect(0, i, 16, 1);
			}
			g.fillStyle = 'rgba(255,230,190,0.12)';
			g.fillRect(3, 6, 6, 1);
		}, [4, 1]);
		const shutter = tex(16, 16, (g) => {
			g.fillStyle = '#8a8c88';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y += 2) {
				g.fillStyle = '#5c5e5a';
				g.fillRect(0, y, 16, 1);
			}
			g.fillStyle = 'rgba(120,70,30,0.45)';
			g.fillRect(2, 9, 3, 5);
			g.fillRect(11, 3, 2, 6);
		}, [3, 6]);
		const rollup = tex(16, 16, (g) => {
			g.fillStyle = '#4a4c4a';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y += 2) {
				g.fillStyle = '#2a2c2a';
				g.fillRect(0, y, 16, 1);
			}
		}, [3, 6]);
		const facade = tex(16, 16, (g) => {
			g.fillStyle = '#7a7468';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 14; i++) {
				g.fillStyle = 'rgba(30,26,20,0.35)';
				g.fillRect((i * 5) % 16, (i * 9) % 16, 1, 3 + (i % 3));
			}
		}, [3, 2]);
		const grille = tex(16, 16, (g) => {
			g.fillStyle = '#0c0e12';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#3a3a36';
			for (let i = 0; i < 16; i += 3) {
				g.fillRect(i, 0, 1, 16);
				g.fillRect(0, i, 16, 1);
			}
		});
		const menu = text(64, 40, '#2a1e16', [
			['MILK TEA', 2, '#f0e0b0', 'bold 8px monospace'],
			['WINTERMELON  89', 13, '#e8d8c0'],
			['OKINAWA      89', 21, '#e8d8c0'],
			['TARO        99', 29, '#e8d8c0'],
		]);
		const sign = text(64, 16, '#f4ead4', [['MILK TEA', 3, '#6a3e22', 'bold 10px monospace']]);
		const signOff = text(64, 16, '#6a645a', [['MILK TEA', 3, '#3a3026', 'bold 10px monospace']]);
		const rent = text(32, 24, '#e8e4d8', [
			['FOR', 2, '#a01818', 'bold 8px monospace'],
			['RENT', 11, '#a01818', 'bold 8px monospace'],
		]);
		const receipt = text(48, 112, '#ece8dc', [
			['MILK TEA', 4, '#202020', 'bold 8px monospace'],
			['--------', 14, '#404040'],
			['2 MILK TEA', 24, '#202020'],
			['WINTERMELON', 33, '#202020'],
			['TOTAL 178', 46, '#202020'],
			['--------', 56, '#404040'],
			['11/15', 66, '#101010', 'bold 8px monospace'],
			['02:00 AM', 76, '#101010', 'bold 8px monospace'],
			['SALAMAT PO', 92, '#303030'],
		]);
		const receiptBack = text(48, 112, '#ece8dc', [
			['Balik ka,', 18, '#1a1a40', 'italic bold 9px serif'],
			['sir.', 32, '#1a1a40', 'italic bold 9px serif'],
			['Kulang pa', 56, '#1a1a40', 'italic bold 9px serif'],
			['ang pila.', 70, '#1a1a40', 'italic bold 9px serif'],
		]);
		return {
			floor: lam('#ffffff', {map: tiles}),
			wallIn: lam('#e4d6bc'),
			wallBack: lam('#c8a882'),
			ceil: lam('#d8d0c0'),
			wood: lam('#ffffff', {map: wood}),
			counterTop: lam('#e8e0d0'),
			steel: lam('#9aa0a4'),
			cupA: lam('#e8d8b8'),
			cupB: lam('#b89870'),
			cupC: lam('#8a6a9a'),
			lid: bas('#f8f8f0', {transparent: true, opacity: 0.6}),
			menu: bas('#ffffff', {map: menu}),
			tube: bas('#f4fff8'),
			tubeOff: lam('#8a8a86'),
			glass: bas('#9ab0b8', {transparent: true, opacity: 0.12, depthWrite: false}),
			frame: lam('#2a2c2e'),
			sign: bas('#ffffff', {map: sign}),
			signOff: lam('#ffffff', {map: signOff}),
			shutter: lam('#ffffff', {map: shutter}),
			rollup: lam('#ffffff', {map: rollup}),
			facade: lam('#ffffff', {map: facade}),
			grille: bas('#ffffff', {map: grille}),
			road: lam('#2c2c2e'),
			walk: lam('#6a665e'),
			kerb: lam('#8a8680'),
			chain: lam('#5a5a58'),
			lock: lam('#c09a40'),
			rent: lam('#ffffff', {map: rent}),
			dust: bas('#c8bca0', {transparent: true, opacity: 0.35, depthWrite: false}),
			receipt: lam('#ffffff', {map: receipt, side: THREE.FrontSide}),
			receiptBack: lam('#ffffff', {map: receiptBack, side: THREE.FrontSide}),
			skin: lam('#9a6e50'),
			scooter: lam('#3a4a5a'),
			tyre: lam('#141414'),
			bag: lam('#5a2a26'),
			head: bas('#fff4d0'),
			black: bas('#000000'),
			beam: bas('#fff0d0', {transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false}),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

/** the inside of the shop; lit: the tubes on (night); off: dark and dusty (never seen in full by day) */
const Interior: React.FC<{lit: boolean; t: number}> = ({lit, t}) => {
	const M = useM();
	const flick = lit ? 1 - 0.18 * (Math.sin(t * 37) > 0.97 ? 1 : 0) : 0;
	return (
		<group>
			<Box p={[0, -0.02, -2.3]} s={[4, 0.04, 4.6]} m={M.floor} />
			<Box p={[0, SHOP.h, -2.3]} s={[4, 0.04, 4.6]} m={M.ceil} />
			<Box p={[-2.02, SHOP.h / 2, -2.3]} s={[0.04, SHOP.h, 4.6]} m={M.wallIn} />
			<Box p={[2.02, SHOP.h / 2, -2.3]} s={[0.04, SHOP.h, 4.6]} m={M.wallIn} />
			<Box p={[0, SHOP.h / 2, -4.62]} s={[4, SHOP.h, 0.04]} m={M.wallBack} />
			{/* the counter, its top, the register, the sealer */}
			<Box p={[0, COUNTER.top / 2, -3.85]} s={[3.2, COUNTER.top, 0.5]} m={M.wood} />
			<Box p={[0, COUNTER.top + 0.02, -3.85]} s={[3.3, 0.04, 0.56]} m={M.counterTop} />
			<Box p={[-0.9, COUNTER.top + 0.12, -3.9]} s={[0.3, 0.2, 0.25]} m={M.frame} />
			<Box p={[0.9, COUNTER.top + 0.18, -3.95]} s={[0.24, 0.32, 0.3]} m={M.steel} />
			<Box p={[0.9, COUNTER.top + 0.36, -3.95]} s={[0.12, 0.06, 0.12]} m={M.frame} />
			{/* the menu board and the shelves of cups */}
			<mesh position={[0, 2.05, -4.59]} material={M.menu}>
				<planeGeometry args={[1.8, 1.1]} />
			</mesh>
			{[1.25, 1.6].map((y) => (
				<group key={y}>
					<Box p={[-1.45, y, -4.48]} s={[0.9, 0.03, 0.2]} m={M.wood} />
					<Box p={[1.45, y, -4.48]} s={[0.9, 0.03, 0.2]} m={M.wood} />
					{[-1.75, -1.55, -1.35, -1.15, 1.15, 1.35, 1.55, 1.75].map((x, i) => (
						<mesh key={x} position={[x, y + 0.1, -4.48]} material={[M.cupA, M.cupB, M.cupC][i % 3]}>
							<cylinderGeometry args={[0.045, 0.035, 0.17, 6]} />
						</mesh>
					))}
				</group>
			))}
			{/* two little tables on the left wall */}
			{[-2.6, -1.2].map((z) => (
				<group key={z}>
					<Box p={[-1.6, 0.72, z]} s={[0.6, 0.04, 0.6]} m={M.counterTop} />
					<Box p={[-1.6, 0.36, z]} s={[0.06, 0.72, 0.06]} m={M.frame} />
				</group>
			))}
			{/* the tubes */}
			{[-3.4, -2.0, -0.6].map((z) => (
				<Box key={z} p={[0, SHOP.h - 0.05, z]} s={[1.2, 0.05, 0.1]} m={lit ? M.tube : M.tubeOff} />
			))}
			{lit && (
				<>
					<pointLight position={[0, 2.4, -3.3]} intensity={5 * flick} distance={6} decay={1} color="#f0fff4" />
					<pointLight position={[0, 2.4, -1.2]} intensity={4.5 * flick} distance={6} decay={1} color="#f0fff4" />
				</>
			)}
		</group>
	);
};

/** the front on z = 0: glass panes and door by night; the rolling shutter by day */
const Front: React.FC<{day: boolean}> = ({day}) => {
	const M = useM();
	return (
		<group>
			{/* the frame and the sign box */}
			<Box p={[0, 2.55, 0.03]} s={[4.1, 0.3, 0.1]} m={M.frame} />
			<mesh position={[0, 2.55, 0.09]} material={day ? M.signOff : M.sign}>
				<planeGeometry args={[2.4, 0.5]} />
			</mesh>
			<Box p={[-2.03, 1.2, 0.03]} s={[0.08, 2.4, 0.1]} m={M.frame} />
			<Box p={[2.03, 1.2, 0.03]} s={[0.08, 2.4, 0.1]} m={M.frame} />
			{!day && (
				<>
					<Box p={[1.15, 1.2, 0.03]} s={[0.06, 2.4, 0.08]} m={M.frame} />
					<Box p={[-0.45, 1.2, 0.03]} s={[0.05, 2.4, 0.08]} m={M.frame} />
					<Box p={[0, 0.06, 0.03]} s={[4.0, 0.12, 0.1]} m={M.frame} />
					<mesh position={[0, 1.2, 0.0]} material={M.glass}>
						<planeGeometry args={[4, 2.4]} />
					</mesh>
				</>
			)}
			{day && (
				<>
					<mesh position={[0, 1.2, 0.06]} material={M.shutter}>
						<planeGeometry args={[4, 2.4, 4, 6]} />
					</mesh>
					<Box p={[0, 0.06, 0.1]} s={[4.0, 0.08, 0.08]} m={M.frame} />
					{/* chain and padlock at the bottom rail, the FOR RENT sheet */}
					{[-0.18, -0.09, 0, 0.09, 0.18].map((x, i) => (
						<Box key={x} p={[0.6 + x, 0.14 + (i % 2) * 0.03, 0.12]} s={[0.07, 0.03, 0.02]} m={M.chain} />
					))}
					<Box p={[0.6, 0.05, 0.15]} s={[0.1, 0.11, 0.05]} m={M.lock} />
					<Box p={[0.57, 0.13, 0.15]} s={[0.015, 0.06, 0.015]} m={M.chain} />
					<Box p={[0.63, 0.13, 0.15]} s={[0.015, 0.06, 0.015]} m={M.chain} />
					<Box p={[0.6, 0.16, 0.15]} s={[0.075, 0.015, 0.015]} m={M.chain} />
					<mesh position={[-0.9, 1.45, 0.08]} rotation={[0, 0, 0.05]} material={M.rent}>
						<planeGeometry args={[0.6, 0.45]} />
					</mesh>
					{/* dust and dead leaves along the rail */}
					{Array.from({length: 14}, (_, i) => (
						<Box key={i} p={[-1.9 + i * 0.29, 0.015, 0.22 + ((i * 7) % 5) * 0.05]} s={[0.18, 0.01, 0.1]} m={M.dust} />
					))}
				</>
			)}
		</group>
	);
};

/** the street: sidewalk, road, neighbours shuttered, two dark storeys, a lamp */
const Street: React.FC<{day: boolean}> = ({day}) => {
	const M = useM();
	return (
		<group>
			<Box p={[0, -0.04, 0.8]} s={[30, 0.08, 1.6]} m={M.walk} />
			<Box p={[0, 0.0, 1.62]} s={[30, 0.14, 0.12]} m={M.kerb} />
			<Box p={[0, -0.08, 5]} s={[30, 0.08, 6.8]} m={M.road} />
			<Box p={[0, -0.04, 9.2]} s={[30, 0.08, 1.6]} m={M.walk} />
			{/* the neighbours: shuttered fronts */}
			{[-6.2, -4.1, 4.1, 6.2].map((x) => (
				<group key={x}>
					<mesh position={[x, 1.2, 0.04]} material={M.rollup}>
						<planeGeometry args={[2, 2.4, 2, 4]} />
					</mesh>
					<Box p={[x, 2.55, 0.03]} s={[2.05, 0.3, 0.1]} m={M.frame} />
				</group>
			))}
			{/* the storeys above, the whole row */}
			<Box p={[0, 4.6, -0.3]} s={[16.6, 3.8, 0.5]} m={M.facade} />
			{[-6, -3, 0, 3, 6].map((x) => (
				<mesh key={x} position={[x, 4.3, -0.03]} material={M.grille}>
					<planeGeometry args={[1.2, 1.1]} />
				</mesh>
			))}
			{/* the far side of the road: a wall */}
			<Box p={[0, 1.6, 10.2]} s={[30, 3.2, 0.3]} m={M.facade} />
			<group position={[-3.2, 0, 1.3]} rotation={[0, Math.PI / 2, 0]}>
				<PsxProp path="assets/models/psx/props/urban/street_light.glb" s={1.15} />
			</group>
			{!day && <pointLight position={[-2.6, 5.2, 1.6]} intensity={3} distance={9} decay={1} color="#ffcc88" />}
		</group>
	);
};

export const Shop: React.FC<{day: boolean; t: number}> = ({day, t}) => (
	<group>
		<Interior lit={!day} t={t} />
		<Front day={day} />
		<Street day={day} />
	</group>
);

/** a delivery scooter (no brand): body, seat, wheels, the insulated box on the back */
export const Scooter: React.FC<{p: V3; ry: number; light: boolean}> = ({p, ry, light}) => {
	const M = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			{[-0.62, 0.62].map((z) => (
				<mesh key={z} position={[0, 0.25, z]} rotation={[0, 0, Math.PI / 2]} material={M.tyre}>
					<cylinderGeometry args={[0.25, 0.25, 0.1, 10]} />
				</mesh>
			))}
			<Box p={[0, 0.5, 0.05]} s={[0.32, 0.34, 1.0]} m={M.scooter} />
			<Box p={[0, 0.74, -0.15]} s={[0.3, 0.1, 0.6]} m={M.tyre} />
			<Box p={[0, 0.95, 0.62]} s={[0.12, 0.6, 0.12]} m={M.scooter} />
			<Box p={[0, 1.22, 0.62]} s={[0.66, 0.04, 0.05]} m={M.frame} />
			<Box p={[0, 1.08, 0.7]} s={[0.16, 0.12, 0.06]} m={light ? M.head : M.frame} />
			<Box p={[0, 1.02, -0.62]} s={[0.46, 0.44, 0.42]} m={M.bag} />
			{light && <pointLight position={[0, 1.0, 1.4]} intensity={2.5} distance={4} decay={1} color="#fff4d8" />}
		</group>
	);
};

/** the receipt in my fingers: front and back, flipping about its long axis */
export const Receipt: React.FC<{p: V3; flip: number; sway: number}> = ({p, flip, sway}) => {
	const M = useM();
	return (
		<group position={p} rotation={[0.05 + sway * 0.03, Math.PI * flip, sway * 0.02]}>
			<mesh material={M.receipt}>
				<planeGeometry args={[0.08, 0.186]} />
			</mesh>
			<mesh rotation={[0, Math.PI, 0]} material={M.receiptBack}>
				<planeGeometry args={[0.08, 0.186]} />
			</mesh>
			{/* finger and thumb at the bottom corners */}
			<Box p={[-0.03, -0.095, 0.006]} s={[0.022, 0.05, 0.016]} m={M.skin} />
			<Box p={[0.032, -0.09, -0.006]} s={[0.02, 0.045, 0.016]} m={M.skin} />
		</group>
	);
};

/** two milk teas, sealed (the order), in the crew's hand */
export const Cup: React.FC<{p: V3}> = ({p}) => {
	const M = useM();
	return (
		<group position={p}>
			<mesh material={M.cupA}>
				<cylinderGeometry args={[0.045, 0.036, 0.16, 6]} />
			</mesh>
			<mesh position={[0, 0.082, 0]} material={M.lid}>
				<cylinderGeometry args={[0.046, 0.046, 0.005, 6]} />
			</mesh>
		</group>
	);
};
