// Episode 43 world: "Si Jun-Jun" (Season 5, call-center agents' experiences shared online, retold).
// Composite call-center floors (no real company, building or account):
// - FLOOR A: the old building at 2 a.m.: rows of cubicle desks facing −z, maroon dividers, a few
//   monitors on, most ceiling panels off, the city through the windows on the right (x = +5.2).
// - FLOOR B: the new company: the same desks with blue-grey dividers and brighter panels.
// Every desk has side panels and a back modesty panel, so the space under it is a dark cave that
// opens toward the agent's chair (+z). The boy is only ever under a desk, in a reflection, or feet.
import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {PsxProp} from '../psx/models';
import {Box, tex} from '../ep41/world';
import {useLiveTex} from '../ep42/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const DESK = {w: 1.4, d: 0.75, top: 0.74, panel: 1.3};
export const ROWS = [0, -2.2];
export const COLS = [-3.0, -1.5, 0, 1.5, 3.0];
export const CHAIR_DZ = 0.72; // the agent's chair, in front (+z) of the desk centre

const useMatsInner = () =>
	useMemo(() => {
		const carpet = tex(16, 16, (g) => {
			g.fillStyle = '#34363c';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = i % 2 ? '#3c3e46' : '#2c2e34';
				g.fillRect((i * 7) % 16, (i * 11) % 16, 1, 1);
			}
		}, [10, 10]);
		const city = tex(64, 32, (g) => {
			g.fillStyle = '#06080e';
			g.fillRect(0, 0, 64, 32);
			for (let i = 0; i < 140; i++) {
				g.fillStyle = i % 5 ? '#ffd890' : '#a8d0ff';
				g.fillRect((i * 37) % 64, 6 + ((i * 13) % 26), 1, 1);
			}
		});
		const ui = tex(32, 24, (g) => {
			g.fillStyle = '#1a3a6a';
			g.fillRect(0, 0, 32, 24);
			g.fillStyle = '#e8f0ff';
			g.fillRect(0, 0, 32, 4);
			g.fillStyle = '#7aa0d8';
			for (let i = 0; i < 5; i++) g.fillRect(2, 7 + i * 3, 10 + ((i * 7) % 14), 1);
		});
		return {
			carpet: lam('#ffffff', {map: carpet}),
			ceil: lam('#8e8c86'),
			wall: lam('#7a766e'),
			top: lam('#b8b0a0'),
			panelA: lam('#5a2a2e'),
			panelB: lam('#3a4656'),
			dark: lam('#141416'),
			bezel: lam('#18181a'),
			key: lam('#2a2a2e'),
			lightOn: bas('#e8f0ff'),
			lightOff: lam('#5a5a5e'),
			city: bas('#ffffff', {map: city}),
			ui: bas('#ffffff', {map: ui}),
			glossy: bas('#05070c'),
			cable: lam('#101012'),
			cushion: lam('#2a2a30'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

/** my call software, drawn live */
const CallScreen: React.FC<{t: number; state: 'ready' | 'call'}> = ({t, state}) => {
	const map = useLiveTex(64, 48, (g) => {
		g.fillStyle = '#0e2440';
		g.fillRect(0, 0, 64, 48);
		g.fillStyle = '#d8e8ff';
		g.fillRect(0, 0, 64, 7);
		g.fillStyle = '#0e2440';
		g.font = 'bold 6px "DejaVu Sans Mono", monospace';
		g.fillText('AGENT 0214', 2, 6);
		g.font = 'bold 9px "DejaVu Sans Mono", monospace';
		if (state === 'call') {
			g.fillStyle = '#5aff9a';
			g.fillText('ON CALL', 4, 20);
			const s = Math.max(0, Math.floor(t)) % 60;
			g.fillText('00:' + String(s).padStart(2, '0'), 4, 32);
		} else {
			g.fillStyle = '#ffd25a';
			g.fillText('READY', 4, 20);
			g.font = '6px "DejaVu Sans Mono", monospace';
			g.fillStyle = '#9ab8e0';
			g.fillText('QUEUE: 0', 4, 31);
		}
		g.fillStyle = '#6a8ab8';
		g.fillRect(4, 38, 56, 1);
		g.fillRect(4, 42, 40, 1);
	});
	return (
		<mesh position={[0, 0, 0.026]}>
			<planeGeometry args={[0.46, 0.3]} />
			<meshBasicMaterial map={map} />
		</mesh>
	);
};

/** one desk at (x, z): top, side panels, back modesty panel and divider, two monitors on arms */
export const Desk: React.FC<{x: number; z: number; panel: 'panelA' | 'panelB'; on?: boolean; mine?: {t: number; state: 'ready' | 'call'}; cleared?: boolean}> = ({x, z, panel, on = false, mine, cleared}) => {
	const M = useM();
	const {w, d, top, panel: ph} = DESK;
	return (
		<group position={[x, 0, z]}>
			<Box p={[0, top - 0.02, 0]} s={[w, 0.04, d]} m={M.top} />
			<Box p={[-w / 2, ph / 2, 0]} s={[0.04, ph, d + 0.05]} m={M[panel]} />
			<Box p={[w / 2, ph / 2, 0]} s={[0.04, ph, d + 0.05]} m={M[panel]} />
			<Box p={[0, ph / 2, -d / 2]} s={[w, ph, 0.04]} m={M[panel]} />
			{!cleared && (
				<>
					{/* the main monitor (left) and the dark second one (right), on raised arms */}
					<group position={[-0.28, 1.0, -0.22]} rotation={[-0.08, 0.12, 0]}>
						<Box p={[0, 0, 0]} s={[0.5, 0.34, 0.04]} m={M.bezel} />
						{mine ? <CallScreen t={mine.t} state={mine.state} /> : on ? (
							<mesh position={[0, 0, 0.026]} material={M.ui}>
								<planeGeometry args={[0.46, 0.3]} />
							</mesh>
						) : null}
					</group>
					<group position={[0.3, 1.15, -0.22]} rotation={[-0.12, -0.12, 0]}>
						<Box p={[0, 0, 0]} s={[0.5, 0.34, 0.04]} m={M.bezel} />
						<mesh position={[0, 0, 0.026]} material={M.glossy}>
							<planeGeometry args={[0.46, 0.3]} />
						</mesh>
					</group>
					<Box p={[0, 0.8, -0.3]} s={[0.04, 0.22, 0.04]} m={M.dark} />
					<Box p={[-0.1, top + 0.01, 0.12]} s={[0.42, 0.02, 0.14]} m={M.key} />
				</>
			)}
			{(on || mine) && <pointLight position={[-0.25, 1.05, 0.15]} intensity={0.9} distance={1.8} decay={1} color="#9ac0ff" />}
		</group>
	);
};

/** an office chair (PSX OFFICE pack) at (x, z), turned ry */
const CHAIR_TINT = {color: '#6a6a74'};
export const Chair: React.FC<{x: number; z: number; ry?: number}> = ({x, z, ry = 0}) => (
	<group position={[x, 0.16, z]} rotation={[0, ry, 0]}>
		<PsxProp path="assets/models/psx/props/office/office_chair_black.glb" tint={CHAIR_TINT} />
	</group>
);

/** the floor: carpet, ceiling panels (lit by `lit`), walls, the city through the right-hand windows */
export const Floor: React.FC<{b?: boolean; lit: number[][]}> = ({b, lit}) => {
	const M = useM();
	return (
		<group>
			<Box p={[0.5, -0.05, 0]} s={[10, 0.1, 8]} m={M.carpet} />
			<Box p={[0.5, 2.85, 0]} s={[10, 0.1, 8]} m={M.ceil} />
			<Box p={[-4.5, 1.4, 0]} s={[0.1, 2.8, 8]} m={M.wall} />
			<Box p={[0.5, 1.4, -4]} s={[10, 2.8, 0.1]} m={M.wall} />
			<Box p={[0.5, 1.4, 4]} s={[10, 2.8, 0.1]} m={M.wall} />
			<mesh position={[5.45, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} material={M.city}>
				<planeGeometry args={[8, 2.2]} />
			</mesh>
			<Box p={[5.5, 0.2, 0]} s={[0.1, 0.4, 8]} m={M.wall} />
			{[-2.4, 0.2, 2.6].map((x) =>
				[-2.8, -0.8, 1.4].map((z) => {
					const on = lit.some(([a, c]) => a === x && c === z);
					return (
						<group key={`${x}${z}`}>
							<mesh position={[x, 2.795, z]} rotation={[Math.PI / 2, 0, 0]} material={on ? M.lightOn : M.lightOff}>
								<planeGeometry args={[1.2, 0.6]} />
							</mesh>
							{on && <pointLight position={[x, 2.5, z]} intensity={b ? 1.8 : 1.2} distance={5} decay={1} color="#dfe8ff" />}
						</group>
					);
				}),
			)}
		</group>
	);
};

/** my headset on the desk (local: desk top), its cable running to the front edge and down */
export const Headset: React.FC<{p: V3; fall?: number}> = ({p, fall = 0}) => {
	const M = useM();
	const curve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(...p), new THREE.Vector3(p[0] + 0.05, DESK.top + 0.01, DESK.d / 2 - 0.02), new THREE.Vector3(p[0] + 0.05, DESK.top - 0.12, DESK.d / 2 - 0.05), new THREE.Vector3(p[0], 0.25, 0.0)]), [p]);
	return (
		<group>
			<group position={p} rotation={[fall * 1.2, 0, 0]}>
				<mesh rotation={[0, 0, 0]} material={M.dark}>
					<torusGeometry args={[0.08, 0.012, 4, 10, Math.PI]} />
				</mesh>
				<Box p={[-0.08, -0.01, 0]} s={[0.03, 0.06, 0.06]} m={M.cushion} />
				<Box p={[0.08, -0.01, 0]} s={[0.03, 0.06, 0.06]} m={M.cushion} />
			</group>
			<mesh material={M.cable}>
				<tubeGeometry args={[curve, 16, 0.006, 4, false]} />
			</mesh>
		</group>
	);
};
