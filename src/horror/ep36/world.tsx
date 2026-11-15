// Episode 36 world: "Sunugin Mo ang Damit" (Season 4, campus legend: the UP Ikot jeep). Composites, no
// real driver, student or dorm:
// - THE IKOT: a long jeep with two facing benches, open window bays (glazed here, so at night they
//   are dark mirrors), a fluorescent tube, the driver's cabin (his rear-view mirror turned up to the
//   roof: he is never in a mirror), the yellow roof and its IKOT board;
// - THE REFLECTION: the left windows open onto a mirrored copy of the interior (scale x −1 about the
//   window plane) with its own riders, so the reflection can disagree with the jeep; a cold tint
//   pane sits in each left window;
// - THE CAMPUS: a dark road under acacias and sodium lamps, with a puddle in the foreground that is a
//   hole in the ground onto the world mirrored in y (with its own riders);
// - HER ROOM and THE YARD: a small boarding-house room with a desk lamp; a metal can, the fire, smoke.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);
export const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep: [number, number] = [1, 1]) => {
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
const seg = (v: number) => Math.min(40, Math.max(1, Math.ceil(v / 0.3)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);
const Cyl: React.FC<{p: V3; r0: number; r1?: number; h: number; m: THREE.Material; rot?: V3; n?: number}> = ({p, r0, r1, h, m, rot, n = 8}) => (
	<mesh position={p} rotation={rot} material={m}>
		<cylinderGeometry args={[r1 ?? r0, r0, h, n, Math.max(1, Math.ceil(h / 0.3))]} />
	</mesh>
);

export const useMats = () =>
	useMemo(() => {
		const sign = tex(64, 16, (g) => {
			g.fillStyle = '#e8c020';
			g.fillRect(0, 0, 64, 16);
			g.fillStyle = '#1a1a1a';
			g.font = 'bold 13px "DejaVu Sans", sans-serif';
			g.textAlign = 'center';
			g.fillText('IKOT', 32, 13);
		});
		const vinyl = tex(8, 8, (g) => {
			g.fillStyle = '#5a1e1e';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#4a1818';
			g.fillRect(0, 3, 8, 1);
		}, [1, 6]);
		const road = tex(16, 16, (g) => {
			g.fillStyle = '#2a2a2e';
			g.fillRect(0, 0, 16, 16);
			const r = rng(36);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() < 0.5 ? '#323238' : '#24242a';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, [8, 30]);
		const grass = tex(16, 16, (g) => {
			g.fillStyle = '#1e2a1a';
			g.fillRect(0, 0, 16, 16);
			const r = rng(37);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() < 0.5 ? '#26341e' : '#1a2416';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 2);
			}
		}, [10, 30]);
		return {
			sign: bas('#ffffff', {map: sign}),
			vinyl: lam('#ffffff', {map: vinyl}),
			floor: lam('#3a3a3c'),
			body: lam('#b8bcc0'),
			bodyDark: lam('#6a6e72'),
			stripe: lam('#2a5a9a'),
			roof: lam('#e0b420'),
			ceiling: lam('#2a2a2a'),
			chrome: lam('#d8dce0'),
			tube: bas('#e8fff4'),
			tint: bas('#1a2a40', {transparent: true, opacity: 0.38, depthWrite: false}),
			darkGlass: bas('#05070c'),
			headlight: bas('#fff4d0'),
			tail: bas('#c02020'),
			tyre: lam('#141414'),
			dash: lam('#1e1e1e'),
			rosary: lam('#c8b890'),
			road: lam('#ffffff', {map: road}),
			grass: lam('#ffffff', {map: grass}),
			curb: lam('#8a8a84'),
			bark: lam('#2a221c'),
			leaves: lam('#1a2a18'),
			pole: lam('#4a4a4a'),
			sodium: bas('#ffb050'),
			puddle: bas('#0a1018', {transparent: true, opacity: 0.45, depthWrite: false}),
			night: bas('#04060a'),
			wall: lam('#a8a08c'),
			bed: lam('#5a6a8a'),
			sheet: lam('#c8c8c0'),
			desk: lam('#5a4030'),
			lampShade: lam('#d8d0a0'),
			can: lam('#5a5048'),
			canRust: lam('#6a3a20'),
			flame: bas('#ffa040', {transparent: true, opacity: 0.85, depthWrite: false}),
			flame2: bas('#ffe080', {transparent: true, opacity: 0.9, depthWrite: false}),
			ember: bas('#ff5020'),
			yard: lam('#3a3428'),
			coin: lam('#c8b878'),
			coin2: lam('#d8d8d0'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
export const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

// ------------------------------------------------------------------ people (original, blocky)
const skinM = new Map<string, THREE.Material>();
const mat = (c: string) => {
	if (!skinM.has(c)) skinM.set(c, lam(c));
	return skinM.get(c)!;
};
export type RiderLook = {shirt: string; pants: string; skin?: string; hair?: 'short' | 'long' | 'cap'; hairColor?: string; bag?: boolean};
/** A seated or standing person facing local +z. look: head yaw (rad); bow: head pitch; lean: torso tilt
 *  toward local +x (rad); hug: an arm reaching across to local +x. */
export const Rider: React.FC<{look: RiderLook; pose?: 'sit' | 'stand'; yaw?: number; bow?: number; lean?: number; hug?: number; walk?: number; position?: V3; rotation?: V3; emissive?: number}> = ({look, pose = 'sit', yaw = 0, bow = 0, lean = 0, hug = 0, walk = 0, position = [0, 0, 0], rotation = [0, 0, 0]}) => {
	const shirt = mat(look.shirt), pants = mat(look.pants), skin = mat(look.skin ?? '#a87a58'), hair = mat(look.hairColor ?? '#141210');
	const sit = pose === 'sit';
	const hip = sit ? 0.46 : 0.86;
	const sw = Math.sin(walk * Math.PI * 2) * 0.35;
	return (
		<group position={position} rotation={rotation}>
			{/* legs */}
			{sit ? (
				<>
					{[-0.09, 0.09].map((x) => (
						<group key={x}>
							<Box p={[x, hip, 0.18]} s={[0.12, 0.12, 0.38]} m={pants} />
							<Box p={[x, hip / 2, 0.36]} s={[0.11, hip, 0.12]} m={pants} />
							<Box p={[x, 0.03, 0.4]} s={[0.11, 0.06, 0.2]} m={mat('#1a1a1a')} />
						</group>
					))}
				</>
			) : (
				<>
					{[-0.09, 0.09].map((x, i) => (
						<group key={x} position={[x, hip, 0]} rotation={[(i ? sw : -sw), 0, 0]}>
							<Box p={[0, -hip / 2, 0]} s={[0.12, hip, 0.13]} m={pants} />
							<Box p={[0, -hip + 0.03, 0.05]} s={[0.11, 0.06, 0.2]} m={mat('#1a1a1a')} />
						</group>
					))}
				</>
			)}
			{/* torso, head */}
			<group position={[0, hip, 0]} rotation={[0, 0, -lean]}>
				<Box p={[0, 0.27, 0]} s={[0.36, 0.54, 0.22]} m={shirt} />
				{look.bag && <Box p={[0, 0.3, -0.16]} s={[0.28, 0.32, 0.1]} m={mat('#2a2a34')} />}
				{/* arms: hands on the knees, or one reaching across */}
				<group position={[-0.21, 0.5, 0]} rotation={[sit ? -0.7 : sw * 0.6, 0, 0]}>
					<Box p={[0, -0.24, 0]} s={[0.09, 0.48, 0.1]} m={shirt} />
					<Box p={[0, -0.5, 0]} s={[0.08, 0.08, 0.08]} m={skin} />
				</group>
				<group position={[0.21, 0.5, 0]} rotation={[sit ? -0.7 * (1 - hug) : -sw * 0.6, 0, -hug * 1.2]}>
					<Box p={[0, -0.24, 0]} s={[0.09, 0.48, 0.1]} m={shirt} />
					<Box p={[0, -0.5, 0]} s={[0.08, 0.08, 0.08]} m={skin} />
				</group>
				<group position={[0, 0.6, 0]} rotation={[bow, yaw, 0]}>
					<Box p={[0, 0.1, 0]} s={[0.19, 0.22, 0.2]} m={skin} />
					{[-0.045, 0.045].map((x) => (
						<Box key={x} p={[x, 0.12, 0.1]} s={[0.035, 0.025, 0.01]} m={mat('#141414')} />
					))}
					{look.hair === 'cap' ? (
						<>
							<Box p={[0, 0.23, -0.01]} s={[0.21, 0.06, 0.22]} m={hair} />
							<Box p={[0, 0.21, 0.14]} s={[0.18, 0.02, 0.1]} m={hair} />
						</>
					) : look.hair === 'long' ? (
						<>
							<Box p={[0, 0.21, -0.02]} s={[0.21, 0.06, 0.22]} m={hair} />
							<Box p={[0, 0.02, -0.08]} s={[0.22, 0.4, 0.08]} m={hair} />
							<Box p={[-0.105, 0.06, 0.0]} s={[0.03, 0.3, 0.16]} m={hair} />
							<Box p={[0.105, 0.06, 0.0]} s={[0.03, 0.3, 0.16]} m={hair} />
						</>
					) : (
						<Box p={[0, 0.22, -0.02]} s={[0.2, 0.05, 0.21]} m={hair} />
					)}
				</group>
			</group>
		</group>
	);
};

export const HER: RiderLook = {shirt: '#3a5a3a', pants: '#2a2e3a', hair: 'long', bag: true}; // a green jacket
export const CLINGER: RiderLook = {shirt: '#8a8a88', pants: '#6a6a68', skin: '#9a9c9c', hair: 'long', hairColor: '#0c0c0c'};
export const DRIVER: RiderLook = {shirt: '#c8b890', pants: '#2a2a2a', hair: 'cap', hairColor: '#2a3a5a'};
export const RIDERS: RiderLook[] = [
	{shirt: '#d8d8d0', pants: '#2a3a5a', hair: 'short', bag: true},
	{shirt: '#8a3a3a', pants: '#3a3a3a', hair: 'long'},
	{shirt: '#3a4a7a', pants: '#2a2a2a', hair: 'short'},
	{shirt: '#d8c890', pants: '#4a3a2a', hair: 'long', bag: true},
	{shirt: '#4a4a4a', pants: '#2a3a5a', hair: 'short'},
];

// ------------------------------------------------------------------ the Ikot
// Interior frame: floor at y 0; the aisle along z; the front (driver) at −z; the rear opening at +z;
// benches at x ±0.62 (seat top 0.44); side walls at x ±0.85 with window bays y 0.95–1.4.
export const JEEP = {halfW: 0.85, front: -2.3, rear: 2.3, seat: 0.44, winLo: 0.85, winHi: 1.45};
export const SEATS_Z = [-1.0, -0.45, 0.1, 0.65, 1.2, 1.75];
const POSTS = [-1.2, -0.4, 0.4, 1.2, 2.0];

const SideWall: React.FC<{x: number}> = ({x}) => {
	const M = useM();
	return (
		<group>
			<Box p={[x, 0.425, 0]} s={[0.04, 0.85, 4.6]} m={M.body} />
			<Box p={[x, 1.5, 0]} s={[0.04, 0.1, 4.6]} m={M.body} />
			<Box p={[x * 1.03, 0.6, 0]} s={[0.02, 0.08, 4.6]} m={M.stripe} />
			{POSTS.map((z) => (
				<Box key={z} p={[x, 1.15, z]} s={[0.05, 0.6, 0.06]} m={M.body} />
			))}
			{/* the cabin's side, solid */}
			<Box p={[x, 1.15, -1.8]} s={[0.04, 0.6, 1.0]} m={M.body} />
			<Box p={[x, 1.15, 2.17]} s={[0.04, 0.6, 0.26]} m={M.body} />
		</group>
	);
};

const Bench: React.FC<{x: number}> = ({x}) => {
	const M = useM();
	const s = Math.sign(x);
	return (
		<group>
			<Box p={[x, 0.2, 0.45]} s={[0.36, 0.4, 3.3]} m={M.bodyDark} />
			<Box p={[x, 0.42, 0.45]} s={[0.38, 0.06, 3.3]} m={M.vinyl} />
			<Box p={[x + s * 0.18, 0.7, 0.45]} s={[0.05, 0.36, 3.3]} m={M.vinyl} />
		</group>
	);
};

/** What sits inside: the riders on each bench by seat index, with per-rider pose. */
export type Occupant = {look: RiderLook; side: 1 | -1; z: number; yaw?: number; bow?: number; lean?: number; hug?: number; pose?: 'sit' | 'stand'; x?: number; walk?: number; ry?: number};

const Occupants: React.FC<{list: Occupant[]}> = ({list}) => (
	<>
		{list.map((o, i) => (
			<Rider key={i} look={o.look} pose={o.pose ?? 'sit'} yaw={o.yaw ?? 0} bow={o.bow ?? 0} lean={o.lean ?? 0} hug={o.hug ?? 0} walk={o.walk ?? 0}
				position={[o.x ?? o.side * 0.6, (o.pose ?? 'sit') === 'sit' ? -0.02 : 0, o.z]} rotation={[0, o.ry ?? -o.side * Math.PI / 2, 0]} />
		))}
	</>
);

const Interior: React.FC<{occupants: Occupant[]; leftWall: boolean; coins?: React.ReactNode; driverLean?: number}> = ({occupants, leftWall, coins, driverLean = 0}) => {
	const M = useM();
	return (
		<group>
			<Box p={[0, -0.03, 0]} s={[1.7, 0.06, 4.6]} m={M.floor} />
			<Bench x={0.62} />
			<Bench x={-0.62} />
			<SideWall x={0.85} />
			{leftWall && <SideWall x={-0.85} />}
			<Box p={[0, 1.57, 0]} s={[1.72, 0.04, 4.6]} m={M.ceiling} />
			{/* grab rails along the roof */}
			{[-0.35, 0.35].map((x) => (
				<Cyl key={x} p={[x, 1.48, 0.4]} r0={0.015} h={3.6} m={M.chrome} rot={[Math.PI / 2, 0, 0]} n={5} />
			))}
			{/* the tube */}
			<Box p={[0, 1.54, 0.4]} s={[0.05, 0.03, 0.9]} m={M.tube} />
			{/* the cabin: dash, wheel, seats, rosary, the windshield (dark), the turned-up mirror */}
			<Box p={[0, 0.55, -2.25]} s={[1.7, 0.4, 0.2]} m={M.dash} />
			<Box p={[0, 1.15, -2.33]} s={[1.6, 0.6, 0.02]} m={M.darkGlass} />
			<group position={[-0.45, 0.95, -2.05]} rotation={[-1.1, 0, 0]}>
				<mesh material={M.dash}>
					<torusGeometry args={[0.17, 0.02, 4, 12]} />
				</mesh>
			</group>
			<Box p={[-0.45, 0.25, -1.75]} s={[0.5, 0.5, 0.4]} m={M.vinyl} />
			<Box p={[-0.45, 0.75, -1.55]} s={[0.5, 0.55, 0.08]} m={M.vinyl} />
			<Box p={[0.35, 0.25, -1.75]} s={[0.5, 0.5, 0.4]} m={M.vinyl} />
			<Box p={[0.35, 0.75, -1.55]} s={[0.5, 0.55, 0.08]} m={M.vinyl} />
			<group position={[0, 1.45, -2.2]} rotation={[-1.3, 0, 0]}>
				<Box p={[0, 0, 0]} s={[0.24, 0.08, 0.02]} m={M.dash} />
			</group>
			{[0, 1, 2, 3, 4].map((i) => (
				<Box key={i} p={[0.05, 1.42 - i * 0.05, -2.2]} s={[0.02, 0.02, 0.02]} m={M.rosary} />
			))}
			<Rider look={DRIVER} position={[-0.45, 0.0, -1.85]} rotation={[0, Math.PI, 0]} bow={0.1 + driverLean} />
			<Occupants list={occupants} />
			{coins}
		</group>
	);
};

const Exterior: React.FC<{lights: boolean}> = ({lights}) => {
	const M = useM();
	return (
		<group>
			{/* the roof, wider than the body, and its board */}
			<Box p={[0, 1.64, 0]} s={[1.9, 0.1, 4.9]} m={M.roof} />
			<Box p={[0, 1.8, -2.42]} s={[1.2, 0.26, 0.04]} m={M.sign} />
			<Box p={[0, 1.8, -2.38]} s={[1.22, 0.28, 0.02]} m={M.roof} />
			{/* the hood and grille */}
			<Box p={[0, 0.45, -2.85]} s={[1.5, 0.75, 1.1]} m={M.body} />
			<Box p={[0, 0.5, -3.41]} s={[1.0, 0.45, 0.02]} m={M.chrome} />
			{[-0.55, 0.55].map((x) => (
				<Box key={x} p={[x, 0.65, -3.42]} s={[0.2, 0.16, 0.03]} m={lights ? M.headlight : M.chrome} />
			))}
			{[-0.7, 0.7].map((x) => (
				<Box key={x} p={[x, 0.25, 2.33]} s={[0.12, 0.1, 0.03]} m={M.tail} />
			))}
			{/* the step at the rear */}
			<Box p={[0, -0.25, 2.45]} s={[0.8, 0.05, 0.25]} m={M.chrome} />
			{/* the chassis and wheels */}
			<Box p={[0, -0.2, 0]} s={[1.6, 0.3, 4.6]} m={M.dash} />
			{[-2.6, 1.5].map((z) =>
				[-0.78, 0.78].map((x) => <Cyl key={`${x}${z}`} p={[x, -0.25, z]} r0={0.3} h={0.2} m={M.tyre} rot={[0, 0, Math.PI / 2]} n={10} />),
			)}
		</group>
	);
};

/** The whole Ikot. reflected: the riders seen in the left windows (a mirrored copy with its own riders). */
export const Ikot: React.FC<{occupants: Occupant[]; reflected?: Occupant[]; exterior?: boolean; lights?: boolean; coins?: React.ReactNode; driverLean?: number; tint?: boolean}> = ({occupants, reflected, exterior = false, lights = true, coins, driverLean, tint = true}) => {
	const M = useM();
	return (
		<group>
			<Interior occupants={occupants} leftWall coins={coins} driverLean={driverLean} />
			{reflected && (
				<group position={[-2 * JEEP.halfW, 0, 0]} scale={[-1, 1, 1]}>
					<Interior occupants={reflected} leftWall={false} driverLean={driverLean} />
				</group>
			)}
			{reflected && tint && (
				<mesh position={[-JEEP.halfW + 0.005, (JEEP.winLo + JEEP.winHi) / 2, 0.4]} rotation={[0, Math.PI / 2, 0]} material={M.tint}>
					<planeGeometry args={[3.2, JEEP.winHi - JEEP.winLo]} />
				</mesh>
			)}
			{exterior && <Exterior lights={lights} />}
		</group>
	);
};

// ------------------------------------------------------------------ the campus road
export const ROAD_W = 7;
export const PUDDLE = {x0: -1.6, x1: 3.2, z0: 1.0, z1: 3.4};
const Acacia: React.FC<{p: V3; s?: number; seed: number}> = ({p, s = 1, seed}) => {
	const M = useM();
	const r = rng(seed);
	return (
		<group position={p} scale={s}>
			<Cyl p={[0, 1.6, 0]} r0={0.35} r1={0.25} h={3.2} m={M.bark} n={7} />
			{[0, 1, 2, 3].map((i) => {
				const a = i * 1.6 + r();
				return <Cyl key={i} p={[Math.cos(a) * 1.2, 3.4, Math.sin(a) * 1.2]} r0={0.12} r1={0.08} h={2.4} m={M.bark} rot={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]} n={5} />;
			})}
			{[0, 1, 2, 3, 4, 5].map((i) => {
				const a = i * 1.05 + r();
				const d = 1.2 + r() * 1.6;
				return (
					<mesh key={i} position={[Math.cos(a) * d, 4.4 + r() * 0.5, Math.sin(a) * d]} scale={[2.2, 0.7, 2.2]} material={M.leaves}>
						<icosahedronGeometry args={[1, 0]} />
					</mesh>
				);
			})}
		</group>
	);
};
const Lamp: React.FC<{p: V3}> = ({p}) => {
	const M = useM();
	return (
		<group position={p}>
			<Cyl p={[0, 2.5, 0]} r0={0.06} h={5} m={M.pole} n={6} />
			<Box p={[0.5 * -Math.sign(p[0]), 5.0, 0]} s={[1.0, 0.06, 0.08]} m={M.pole} />
			<Box p={[0.95 * -Math.sign(p[0]), 4.93, 0]} s={[0.3, 0.08, 0.16]} m={M.sodium} />
		</group>
	);
};
/** Trees and lamps along both sides of the road (the road runs along z). */
export const Roadside: React.FC = () => {
	const trees = useMemo(() => {
		const out: {p: V3; s: number; seed: number}[] = [];
		for (let i = 0; i < 9; i++) {
			out.push({p: [-6.5 - (i % 2) * 1.5, 0, -40 + i * 9], s: 1.1 + (i % 3) * 0.15, seed: 360 + i});
			out.push({p: [6.8 + (i % 2) * 1.2, 0, -36 + i * 9], s: 1.0 + (i % 2) * 0.2, seed: 380 + i});
		}
		return out;
	}, []);
	return (
		<group>
			{trees.map((t, i) => (
				<Acacia key={i} p={t.p} s={t.s} seed={t.seed} />
			))}
			{[-30, -15, 0, 15].map((z) => (
				<Lamp key={z} p={[-4.2, 0, z]} />
			))}
			{[-22, -7, 8].map((z) => (
				<Lamp key={z} p={[4.2, 0, z]} />
			))}
		</group>
	);
};
/** The ground with a hole for the puddle (so the mirrored world below shows through). */
export const Ground: React.FC = () => {
	const M = useM();
	const P = PUDDLE;
	const z0 = -60, z1 = 12;
	const piece = (x0: number, x1: number, za: number, zb: number, m: THREE.Material, key: string) => (
		<mesh key={key} position={[(x0 + x1) / 2, 0, (za + zb) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={m}>
			<planeGeometry args={[x1 - x0, zb - za, Math.max(1, Math.ceil((x1 - x0) / 1)), Math.max(1, Math.ceil((zb - za) / 1))]} />
		</mesh>
	);
	return (
		<group>
			{piece(-ROAD_W / 2, ROAD_W / 2, z0, P.z0, M.road, 'a')}
			{piece(-ROAD_W / 2, ROAD_W / 2, P.z1, z1, M.road, 'b')}
			{piece(-ROAD_W / 2, P.x0, P.z0, P.z1, M.road, 'c')}
			{piece(P.x1, ROAD_W / 2, P.z0, P.z1, M.road, 'd')}
			{piece(-20, -ROAD_W / 2, z0, z1, M.grass, 'e')}
			{piece(ROAD_W / 2, 20, z0, z1, M.grass, 'f')}
			<Box p={[-ROAD_W / 2, 0.06, (z0 + z1) / 2]} s={[0.15, 0.12, z1 - z0]} m={M.curb} />
			<Box p={[ROAD_W / 2, 0.06, (z0 + z1) / 2]} s={[0.15, 0.12, z1 - z0]} m={M.curb} />
			{/* the puddle's dark film and the hole's floor far below (so nothing shows through the mirror world's gaps) */}
			<mesh position={[(P.x0 + P.x1) / 2, 0.004, (P.z0 + P.z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={M.puddle}>
				<planeGeometry args={[P.x1 - P.x0, P.z1 - P.z0]} />
			</mesh>
			<mesh position={[(P.x0 + P.x1) / 2, -30, (P.z0 + P.z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={M.night}>
				<planeGeometry args={[200, 200]} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ her room; the yard and the can
export const Room: React.FC = () => {
	const M = useM();
	return (
		<group>
			<Box p={[0, -0.03, 0]} s={[3.2, 0.06, 3.2]} m={M.floor} />
			<Box p={[0, 1.3, -1.6]} s={[3.2, 2.6, 0.06]} m={M.wall} />
			<Box p={[-1.6, 1.3, 0]} s={[0.06, 2.6, 3.2]} m={M.wall} />
			<Box p={[1.6, 1.3, 0]} s={[0.06, 2.6, 3.2]} m={M.wall} />
			<Box p={[0, 2.6, 0]} s={[3.2, 0.06, 3.2]} m={M.ceiling} />
			{/* bed, desk, lamp */}
			<Box p={[-1.0, 0.25, -0.6]} s={[1.0, 0.5, 1.9]} m={M.bed} />
			<Box p={[-1.0, 0.52, -0.6]} s={[0.96, 0.06, 1.86]} m={M.sheet} />
			<Box p={[1.15, 0.72, -1.2]} s={[0.8, 0.06, 0.6]} m={M.desk} />
			{[[0.8, -1.45], [1.5, -1.45], [0.8, -0.95], [1.5, -0.95]].map(([x, z]) => (
				<Box key={`${x}${z}`} p={[x, 0.36, z]} s={[0.05, 0.72, 0.05]} m={M.desk} />
			))}
			<Cyl p={[1.3, 0.95, -1.3]} r0={0.14} r1={0.08} h={0.16} m={M.lampShade} />
			<Cyl p={[1.3, 0.82, -1.3]} r0={0.02} h={0.2} m={M.pole} />
		</group>
	);
};

/** The jacket held up by its shoulders, back to us: two grey handprints on the back (drawn). */
export const Jacket: React.FC<{prints: number; p: V3; r?: V3; burn?: number}> = ({prints, p, r = [0, 0, 0], burn = 0}) => {
	const tx = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 32;
		c.height = 36;
		const t = new THREE.CanvasTexture(c);
		t.magFilter = THREE.NearestFilter;
		t.minFilter = THREE.NearestFilter;
		t.generateMipmaps = false;
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
	}, []);
	const g = (tx.image as HTMLCanvasElement).getContext('2d')!;
	g.clearRect(0, 0, 32, 36);
	g.fillStyle = '#3a5a3a';
	g.fillRect(4, 2, 24, 34); // body
	g.fillRect(0, 4, 5, 22); // sleeves
	g.fillRect(27, 4, 5, 22);
	g.fillStyle = '#2e4a2e';
	g.fillRect(12, 2, 8, 3); // collar
	if (prints > 0) {
		// two grey handprints, fingers up over the shoulders: someone holding on from behind
		g.fillStyle = `rgba(150,152,150,${Math.min(1, prints)})`;
		for (const cx of [10, 21]) {
			g.fillRect(cx - 3, 9, 7, 6); // palm
			for (let k = 0; k < 4; k++) g.fillRect(cx - 3 + k * 2, 4 - (k === 1 || k === 2 ? 1 : 0), 1, 5); // fingers
			g.fillRect(cx + (cx < 16 ? 4 : -5), 10, 2, 3); // thumb
		}
	}
	if (burn > 0) {
		g.globalCompositeOperation = 'destination-out';
		const r = rng(36);
		for (let i = 0; i < 120 * burn; i++) g.fillRect(Math.floor(r() * 32), 36 - Math.floor(r() * 36 * burn), 2, 2);
		g.globalCompositeOperation = 'source-over';
	}
	tx.needsUpdate = true;
	const m = useMemo(() => lam('#ffffff', {map: tx, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide}), [tx]);
	return (
		<mesh position={p} rotation={r} material={m}>
			<planeGeometry args={[0.62, 0.7, 4, 4]} />
		</mesh>
	);
};

export const Yard: React.FC = () => {
	const M = useM();
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={M.yard}>
				<planeGeometry args={[16, 16, 16, 16]} />
			</mesh>
			<Box p={[0, 1.2, -2.5]} s={[8, 2.4, 0.1]} m={M.wall} />
		</group>
	);
};

export const Can: React.FC<{t: number; fire: number}> = ({t, fire}) => {
	const M = useM();
	return (
		<group>
			<Cyl p={[0, 0.4, 0]} r0={0.3} h={0.8} m={M.can} n={10} />
			<Cyl p={[0, 0.79, 0]} r0={0.31} r1={0.31} h={0.03} m={M.canRust} n={10} />
			{fire > 0 &&
				[0, 1, 2, 3, 4, 5].map((i) => {
					const ph = t * (5 + i) + i * 1.7;
					const h = (0.35 + 0.25 * Math.sin(ph)) * fire;
					return (
						<mesh key={i} position={[Math.sin(i * 2.1) * 0.12, 0.8 + h / 2, Math.cos(i * 2.1) * 0.12]} rotation={[0, i * 0.9 + t, 0]} material={i % 2 ? M.flame : M.flame2}>
							<coneGeometry args={[0.1 + 0.03 * (i % 3), h, 4]} />
						</mesh>
					);
				})}
		</group>
	);
};
