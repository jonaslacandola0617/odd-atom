// "What if you fell into Jupiter?" opening (0-23.5 s), v3: same shots and
// timing as v2, redrawn with the flat cel kit (src/oddatom/flat.tsx) studied
// in docs/style/drawing-study.md. Same narration and timing as the published v1 short so the
// two can be compared directly. See docs/production/odd-atom-style-v2/.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, random, staticFile, useCurrentFrame} from 'remotion';
import {FlatAstronaut, FlatBall, FlatCloudBank, FlatGiant, FlatStars} from './oddatom/flat';
import {
	Caption,
	Cue,
	H,
	Pose,
	POSE_FLOAT,
	Title,
	W,
	easeIn,
	easeOut,
	keys,
	ramp,
	smooth,
} from './oddatom/kit';

export const oddAtomJupiterV3Config = {durationInFrames: 705, fps: 30, width: W, height: H};

// Timed against the burned-in captions of jupiter-fall_v1.mp4 (sampled at 4-10 fps).
const JUPITER_CUES: Cue[] = [
	{start: 2.7, end: 3.7, text: 'First problem:'},
	{start: 3.7, end: 5.8, text: "there's nothing to land on."},
	{start: 5.8, end: 8.8, text: 'Jupiter is a giant ball of gas,'},
	{start: 8.8, end: 10.75, text: 'mostly hydrogen and helium.'},
	{start: 10.75, end: 12.0, text: 'No ground.'},
	{start: 12.0, end: 14.55, text: 'Just… down.'},
	{start: 14.6, end: 15.9, text: "You'd hit the top of the atmosphere"},
	{start: 15.9, end: 18.4, text: 'at about 60 km/s.'},
	{start: 18.4, end: 21.3, text: 'Fast enough to cross the entire'},
	{start: 21.3, end: 23.4, text: 'United States in just over a minute.'},
];

const SHOT = {space: [0, 206], gas: [186, 330], dive: [318, 437], fall: [437, 560], map: [548, 705]} as const;
const SUN = -138; // light direction for the whole Jupiter system (upper-left)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
	armL: [lerp(a.armL[0], b.armL[0], t), lerp(a.armL[1], b.armL[1], t)],
	armR: [lerp(a.armR[0], b.armR[0], t), lerp(a.armR[1], b.armR[1], t)],
	legL: [lerp(a.legL[0], b.legL[0], t), lerp(a.legL[1], b.legL[1], t)],
	legR: [lerp(a.legR[0], b.legR[0], t), lerp(a.legR[1], b.legR[1], t)],
	head: lerp(a.head ?? 0, b.head ?? 0, t),
	mouth: t < 0.5 ? a.mouth : b.mouth,
	look: [lerp(a.look?.[0] ?? 0, b.look?.[0] ?? 0, t), lerp(a.look?.[1] ?? 0, b.look?.[1] ?? 0, t)],
});
const POSE_SHRUG: Pose = {armL: [200, -70], armR: [-20, 70], legL: [104, 10], legR: [76, -10], head: 8, mouth: 'flat', look: [0.1, 0.9]};
const POSE_LOOK_DOWN: Pose = {armL: [130, 30], armR: [50, -30], legL: [98, 18], legR: [82, -18], head: 12, mouth: 'o', look: [0.15, 1]};
const POSE_DIVE: Pose = {armL: [-112, -8], armR: [-68, 8], legL: [96, 6], legR: [84, -6], head: 0, mouth: 'o', look: [0, -1]};

// ------------------------------------------------------------------ shot 1-2

const SpaceBackdrop: React.FC<{f: number; px: number; py: number}> = ({f, px, py}) => (
	<>
		<defs>
			<linearGradient id="sky" x1="0" y1="0" x2="0.3" y2="1">
				<stop offset="0" stopColor="#0a0a24" />
				<stop offset="0.55" stopColor="#15123d" />
				<stop offset="1" stopColor="#2b1749" />
			</linearGradient>
			<radialGradient id="sunglow" cx="0" cy="0" r="1">
				<stop offset="0" stopColor="#fff2cf" stopOpacity="0.55" />
				<stop offset="0.35" stopColor="#ffb36b" stopOpacity="0.16" />
				<stop offset="1" stopColor="#ffb36b" stopOpacity="0" />
			</radialGradient>
		</defs>
		<rect width={W} height={H} fill="url(#sky)" />
		{/* faint nebula shapes give the void some colour depth */}
		<g style={{filter: 'blur(60px)'}} opacity={0.5}>
			<ellipse cx={200 + px * 0.05} cy={420 + py * 0.05} rx={420} ry={220} fill="#3d1f6e" />
			<ellipse cx={900 + px * 0.05} cy={250 + py * 0.05} rx={300} ry={160} fill="#183a6e" />
		</g>
		<FlatStars f={f} seed="sp" w={W} h={H} count={170} ox={px * 0.08} oy={py * 0.08} />
		{/* key light enters from the upper-left, off screen */}
		<circle cx={-120} cy={-160} r={1300} fill="url(#sunglow)" />
	</>
);

const SpaceShot: React.FC<{f: number}> = ({f}) => {
	// Camera expressed as planet-centre screen position and zoom.
	const z = Math.exp(f < 174 ? keys(f, [[0, Math.log(1)], [78, Math.log(0.92)], [150, Math.log(0.36)], [174, Math.log(0.37)]]) : keys(f, [[174, Math.log(0.37)], [206, Math.log(6)]], easeIn));
	// zoom-through: keep a point in the cut interior (614, 430) locked while it slides to screen centre
	const zt = ramp(f, 174, 206, easeIn);
	const fx = 530 + 614 * 0.37 + (540 - (530 + 614 * 0.37)) * zt;
	const fy = 1000 + 430 * 0.37 + (960 - (1000 + 430 * 0.37)) * zt;
	const cy = f < 174 ? keys(f, [[0, 2050], [78, 2010], [150, 1020], [174, 1000]]) : fy - 430 * z;
	const cx = f < 174 ? keys(f, [[0, 900], [78, 880], [150, 540], [174, 530]]) : fx - 614 * z;
	const tilt = keys(f, [[0, -62], [78, -56], [150, 0]]);
	const R = 1000;
	const cut = ramp(f, 116, 168, easeOut);
	// astronaut drifts in world space above the north limb
	const up = ((-90 - tilt) * Math.PI) / 180; // screen-up expressed in planet space
	const dist = 1300 + Math.sin(f / 33) * 10 + keys(f, [[0, 0], [150, 40]]);
	const ax = Math.cos(up) * dist + Math.sin(f / 40) * 14 - 60;
	const ay = Math.sin(up) * dist;
	const pose = f < 84 ? mixPose(POSE_FLOAT, POSE_LOOK_DOWN, ramp(f, 30, 70)) : f < 110 ? POSE_LOOK_DOWN : mixPose(POSE_LOOK_DOWN, POSE_SHRUG, ramp(f, 112, 132, easeOut));
	const titleO = 1 - ramp(f, 70, 92);
	return (
		<svg width={W} height={H}>
			<SpaceBackdrop f={f} px={cx} py={cy} />
			<g transform={`translate(${cx} ${cy}) scale(${z}) rotate(${tilt})`}>
				<FlatGiant id="jup" r={R} f={f} light={SUN - tilt} cutaway={cut} />
				<g transform={`translate(${ax} ${ay}) rotate(${-tilt - 8 + Math.sin(f / 50) * 6}) scale(1.5)`}>
					<FlatAstronaut id="astro1" f={f} pose={pose} />
				</g>
			</g>
			<Title
				x={W / 2}
				y={300 - (1 - ramp(f, 0, 14, easeOut)) * 30}
				opacity={titleO}
				lines={[
					{text: 'What If You Fell', size: 104, fill: '#fff7e8'},
					{text: 'Into Jupiter?', size: 128, fill: '#ffd15c'},
				]}
			/>
			{/* "nothing to land on": the cut interior shows layers that blend, with no surface line */}
		</svg>
	);
};

// ------------------------------------------------------------------ shot 3

const GasShot: React.FC<{f: number}> = ({f}) => {
	const local = f - SHOT.gas[0];
	const zoomIn = 1 - ramp(f, 186, 214, easeOut); // arrives from the zoom-through
	const fall = ramp(f, 312, 330, easeIn); // camera starts to fall at the end
	const hPulse = Math.exp(-(((f - 266) / 9) ** 2));
	const hePulse = Math.exp(-(((f - 294) / 9) ** 2));
	const heFocus = ramp(f, 290, 304);
	const layers = [
		{n: 30, s: 0.6, blur: 1.5, par: 0.5, o: 0.45},
		{n: 26, s: 1.25, blur: 0, par: 1, o: 1},
		{n: 6, s: 2.6, blur: 7, par: 1.8, o: 0.9},
	];
	return (
		<svg width={W} height={H}>
			<defs>
				<radialGradient id="gasbg" cx="0.45" cy="0.35" r="0.9">
					<stop offset="0" stopColor="#5a6fe0" />
					<stop offset="0.55" stopColor="#3236a8" />
					<stop offset="1" stopColor="#1a1458" />
				</radialGradient>
			</defs>
			<rect width={W} height={H} fill="url(#gasbg)" />
			<g style={{filter: 'blur(50px)'}} opacity={0.45}>
				<ellipse cx={300} cy={600 - local * 0.4} rx={380} ry={200} fill="#6f7ff0" />
				<ellipse cx={850} cy={1400 - local * 0.4} rx={320} ry={220} fill="#6a3db8" />
			</g>
			<g transform={`translate(${W / 2} ${H / 2}) scale(${1 + zoomIn * 1.6}) translate(${-W / 2} ${-H / 2 - fall * 900})`}>
				{layers.map((L, li) => (
					<g key={li} style={L.blur ? {filter: `blur(${L.blur}px)`} : undefined} opacity={L.o}>
						{new Array(L.n).fill(0).map((_, i) => {
							const isHe = li === 1 ? i % 7 === 3 : i % 9 === 4; // roughly 1 helium atom per 9 hydrogen molecules
							const sx = random(`g${li}x${i}`) * (W + 300) - 150;
							const sy = random(`g${li}y${i}`) * (H + 300) - 150;
							const x = sx + Math.sin(local / (30 + i) + i) * 30 * L.par + local * 0.25 * L.par;
							const y = sy + Math.cos(local / (26 + i) + i * 2) * 26 * L.par - local * 0.6 * L.par;
							const rot = random(`g${li}r${i}`) * 360 + local * (random(`g${li}w${i}`) - 0.5) * 2;
							const s = L.s * (0.8 + random(`g${li}s${i}`) * 0.4);
							const pulse = isHe ? hePulse : hPulse;
							const dim = isHe ? 1 : 1 - heFocus * 0.35 * (1 - hPulse);
							const wrapX = ((x % (W + 300)) + W + 300) % (W + 300) - 150;
							const wrapY = ((y % (H + 300)) + H + 300) % (H + 300) - 150;
							return (
								<g key={i} transform={`translate(${wrapX} ${wrapY}) rotate(${rot}) scale(${s * (1 + pulse * 0.18)})`} opacity={dim}>
									{isHe ? (
										<>{pulse + heFocus * 0.4 > 0.02 && <circle r={70} fill="#ff6fb0" opacity={0.4 * (pulse + heFocus * 0.4)} style={{filter: 'blur(18px)'}} />}<FlatBall id={`he${li}-${i}`} r={44} base="#ff5fa2" shade="#c42a7c" hi="#ffd0e6" /></>
									) : (
										<>
											<rect x={-22} y={-8} width={44} height={16} rx={8} fill="#2f8fd6" />
											<g transform="translate(-24 0)">
												<>{pulse > 0.02 && <circle r={48} fill="#7fe3ff" opacity={0.45 * pulse} style={{filter: 'blur(14px)'}} />}<FlatBall id={`ha${li}-${i}`} r={30} base="#6fd8ff" shade="#2f8fd6" hi="#e8fbff" /></>
											</g>
											<g transform="translate(24 0)">
												<>{pulse > 0.02 && <circle r={48} fill="#7fe3ff" opacity={0.45 * pulse} style={{filter: 'blur(14px)'}} />}<FlatBall id={`hb${li}-${i}`} r={30} base="#6fd8ff" shade="#2f8fd6" hi="#e8fbff" /></>
											</g>
										</>
									)}
								</g>
							);
						})}
					</g>
				))}
			</g>
			<rect width={W} height={H} fill="#fff6e8" opacity={zoomIn * 0.6} />
		</svg>
	);
};

// ------------------------------------------------------------------ shot 4

const DECKS = [
	{y: 700, c: '#ffe2b4', s: '#f2b77c'},
	{y: 1500, c: '#f5a660', s: '#e0743f'},
	{y: 2350, c: '#e0603f', s: '#b8384a'},
	{y: 3250, c: '#b8385e', s: '#86266a'},
	{y: 4150, c: '#7e2a78', s: '#561f6e'},
	{y: 5050, c: '#4c2178', s: '#331a5e'},
	{y: 5950, c: '#2d1860', s: '#1d1246'},
];
const BG = ['#ffd9a0', '#f8b276', '#ec7d55', '#c9476a', '#8c2e7a', '#4e2276', '#27145a', '#150c3a'];

const DiveShot: React.FC<{f: number}> = ({f}) => {
	const local = f - SHOT.dive[0];
	// accelerate downward: no ground ever appears
	const cam = keys(local, [[0, 0], [45, 1100], [80, 3300], [119, 6400]], (x) => x ** 1.35);
	const depth = Math.min(BG.length - 1.001, Math.max(0, cam / 850));
	const i0 = Math.floor(depth);
	const shake = local > 70 ? Math.sin(local * 2.3) * 3 : 0;
	const bank = (i: number, par: number, dy: number, sc: number, tag: string, tone: number) => {
		const d = DECKS[i];
		const y = d.y + dy - cam * par;
		if (y < -500 || y > H + 400) return null;
		const k = Math.min(DECKS.length - 1, i + tone);
		const k2 = Math.min(DECKS.length - 1, i + tone + 1);
		const hiC = tone === 0 ? (i === 0 ? '#fff6e2' : DECKS[i - 1].c) : DECKS[k].c;
		return <FlatCloudBank key={tag + i} seed={tag + i} y={y} base={tone === 0 ? d.c : DECKS[k].s} shade={tone === 0 ? d.s : DECKS[k2].s} hi={hiC} w={W} scale={sc} />;
	};
	return (
		<svg width={W} height={H}>
			<rect width={W} height={H} fill={BG[i0]} />
			<rect width={W} height={H} fill={BG[i0 + 1]} opacity={depth - i0} />
			<g transform={`translate(${shake} 0)`}>
				{DECKS.map((_, i) => bank(i, 0.55, 320, 0.7, 'b', 1))}
				{DECKS.map((_, i) => bank(i, 1, 0, 1, 'm', 0))}
			</g>
			{/* foreground banks rush past: darker tone, slight defocus */}
			<g style={{filter: 'blur(4px)'}}>{DECKS.map((_, i) => bank(i, 1.8, 620, 1.5, 'f', 2))}</g>
			<ellipse cx={W / 2} cy={H + 200} rx={900} ry={600} fill="#ff6a3d" opacity={ramp(local, 70, 119) * 0.22} style={{filter: 'blur(80px)'}} />
		</svg>
	);
};

// ------------------------------------------------------------------ shot 5

const FallShot: React.FC<{f: number}> = ({f}) => {
	const local = f - SHOT.fall[0];
	const heat = ramp(f, 474, 520);
	const horizon = keys(local, [[0, 1780], [123, 1180]], (x) => smooth(x));
	const R = 2300;
	const shake = heat * Math.sin(local * 3.1) * 4;
	const streak = 12 + heat * 120;
	return (
		<svg width={W} height={H}>
			<SpaceBackdrop f={f} px={0} py={local * 4} />
			<g opacity={0.9}>
				<FlatStars f={f} seed="fs" w={W} h={H} count={70} oy={-local * (8 + heat * 30)} streak={streak} />
			</g>
			<g transform={`translate(${W / 2 + 260} ${horizon + R}) rotate(-78)`}>
				<FlatGiant id="jfall" r={R} f={f * 0.3} light={SUN + 40 + 70} lit={0.8} redSpot={false} />
			</g>
			<g opacity={heat} transform={`translate(${540 + shake} ${880 + Math.sin(local / 12) * 8})`}>
					<ellipse cx={0} cy={240} rx={220} ry={170} fill="#ff7a2e" opacity={0.45} style={{filter: 'blur(40px)'}} />
					{[
						{c: '#ff4f3c', s: 1},
						{c: '#ff8f3a', s: 0.8},
						{c: '#ffd166', s: 0.6},
						{c: '#fff5d8', s: 0.42},
					].map((l, i) => {
						const fl = 1 + Math.sin(local * 0.9 + i * 1.7) * 0.06;
						const b = 300 * l.s + 30;
						return (
							<path
								key={i}
								d={`M0,${b} C${170 * l.s},${b} ${200 * l.s},${80 * l.s} ${110 * l.s},${-240 * l.s * fl} C${70 * l.s},${-520 * l.s * fl} ${-70 * l.s},${-520 * l.s * fl} ${-110 * l.s},${-240 * l.s * fl} C${-200 * l.s},${80 * l.s} ${-170 * l.s},${b} 0,${b} Z`}
								transform={`translate(0 ${190 - 190 * l.s})`}
								fill={l.c}
							/>
						);
					})}
				</g>
<g transform={`translate(${540 + shake} ${880 + Math.sin(local / 12) * 8}) rotate(${172 + Math.sin(local / 20) * 4}) scale(1.6)`}>
				<FlatAstronaut id="astro2" f={f} pose={POSE_DIVE} heat={heat} />
			</g>
			{/* speed streaks past camera */}
			<g opacity={0.25 + heat * 0.6}>
				{new Array(16).fill(0).map((_, i) => {
					const x = random(`ss${i}`) * W;
					const y = ((random(`sy${i}`) * H - local * (30 + heat * 60) * (0.6 + random(`sv${i}`))) % H + H) % H;
					return <line key={i} x1={x} y1={y} x2={x} y2={y + 80 + heat * 220} stroke={heat > 0.3 ? '#ffd2a0' : '#cfd8ff'} strokeWidth={3 + random(`sw${i}`) * 4} strokeLinecap="round" opacity={0.6} />;
				})}
			</g>
			<rect width={W} height={H} fill="#ff7a2e" opacity={heat * 0.08} />
		</svg>
	);
};

// ------------------------------------------------------------------ shot 6

// Simplified contiguous-US coastline/border (lon, lat), stylised on purpose.
const US: [number, number][] = [
	[-124.7, 48.4], [-122.8, 49], [-95.2, 49], [-95.2, 49.4], [-89.6, 48], [-84.8, 46.5], [-82.5, 45.3], [-83, 42], [-79, 42.8], [-76.2, 44.2], [-74.7, 45], [-71.5, 45],
	[-69.2, 47.4], [-67.8, 47], [-67, 44.8], [-70.2, 43.6], [-70.6, 42.6], [-69.9, 41.7], [-71.4, 41.4], [-73.9, 40.6], [-74, 39.4], [-75.5, 38.4], [-76, 36.9], [-75.5, 35.2],
	[-77.9, 33.9], [-80.8, 32], [-81.4, 30.4], [-80, 26.8], [-80.4, 25.2], [-81.8, 26.1], [-82.8, 27.9], [-83.6, 29.9], [-85.4, 29.7], [-88, 30.4], [-89.6, 30.2], [-89.4, 29],
	[-91.3, 29.3], [-93.8, 29.7], [-95, 29.2], [-97.2, 27.6], [-97.4, 25.9], [-99.5, 27.5], [-101.4, 29.8], [-103, 29], [-104.5, 29.6], [-106.5, 31.8], [-108.2, 31.8],
	[-111.1, 31.3], [-114.8, 32.5], [-117.1, 32.5], [-118.5, 34], [-120.6, 34.6], [-121.9, 36.6], [-122.5, 37.8], [-123.8, 39.8], [-124.2, 41.9], [-124.5, 43.5], [-124, 46.3],
];
const K = 19.5;
const proj = ([lon, lat]: [number, number]) => [(lon + 95.5) * Math.cos((39 * Math.PI) / 180) * K, -(lat - 37.5) * K] as const;
const US_PATH = 'M' + US.map((p) => proj(p).map((v) => v.toFixed(1)).join(',')).join(' L') + ' Z';

const MapShot: React.FC<{f: number}> = ({f}) => {
	const local = f - SHOT.map[0];
	const z = keys(local, [[0, 1.25], [157, 1.05]]);
	const t = ramp(f, 584, 690, (x) => x); // constant speed: 60 km/s
	const A = proj([-122.2, 37.6]);
	const B = proj([-76.2, 38.8]);
	const px = A[0] + (B[0] - A[0]) * t;
	const py = A[1] + (B[1] - A[1]) * t - Math.sin(t * Math.PI) * 26;
	const tail = Math.max(0, t - 0.32);
	const tx = A[0] + (B[0] - A[0]) * tail;
	const ty = A[1] + (B[1] - A[1]) * tail - Math.sin(tail * Math.PI) * 26;
	const on = ramp(f, 578, 590);
	return (
		<svg width={W} height={H}>
			<defs>
				<radialGradient id="ocean" cx="0.5" cy="0.45" r="0.8">
					<stop offset="0" stopColor="#2f6fd0" />
					<stop offset="1" stopColor="#13235e" />
				</radialGradient>
				<linearGradient id="land" x1="0" y1="0" x2="0.4" y2="1">
					<stop offset="0" stopColor="#7fdc8a" />
					<stop offset="0.6" stopColor="#3fb37a" />
					<stop offset="1" stopColor="#2a8a6a" />
				</linearGradient>
				<linearGradient id="trail" x1={tx} y1={ty} x2={px} y2={py} gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor="#ff8a3d" stopOpacity="0" />
					<stop offset="1" stopColor="#fff2cf" stopOpacity="1" />
				</linearGradient>
			</defs>
			<rect width={W} height={H} fill="url(#ocean)" />
			<g transform={`translate(${W / 2 + 10} ${880}) scale(${z})`}>
				{/* flat construction: shallow-shelf band, hard drop shadow, land, lit inner shape */}
				<path d={US_PATH} fill="none" stroke="#3f8ee8" strokeWidth={34} strokeLinejoin="round" />
				<path d={US_PATH} fill="#123a7a" transform="translate(9 14)" />
				<path d={US_PATH} fill="#2f9c78" />
				<path d={US_PATH} fill="#4fc98a" transform="translate(-5 -7) scale(0.985)" />
				<g opacity={0.9}>
					<path d="M-260,-120 C-240,-60 -250,40 -230,120 C-200,60 -210,-40 -200,-130 Z" fill="#c9b26a" />
					<path d="M-252,-100 C-236,-50 -244,30 -228,96 C-214,40 -220,-30 -212,-108 Z" fill="#e4d08a" />
					<path d="M250,-40 C240,20 220,80 200,130 C230,90 250,30 262,-30 Z" fill="#2f9c78" />
					<ellipse cx={-40} cy={20} rx={160} ry={60} fill="#62d494" />
				</g>
				{/* drifting cloud wisps above the map for depth */}
				<g opacity={0.85}>
					{[0, 1, 2, 3].map((i) => (
						<g key={i} transform={`translate(${-420 + i * 280 + local * 0.6} ${-260 + (i % 2) * 420})`}>
							<rect x={-110} y={-14} width={220} height={30} rx={15} fill="#c9d8ff" />
							<rect x={-120} y={-20} width={200} height={28} rx={14} fill="#ffffff" />
						</g>
					))}
				</g>
				<g opacity={on}>
					<line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={4} strokeDasharray="6 14" strokeLinecap="round" />
					<circle cx={A[0]} cy={A[1]} r={9} fill="#ffffff" />
					<circle cx={B[0]} cy={B[1]} r={9} fill="#ffffff" opacity={0.6 + 0.4 * ramp(f, 686, 694)} />
					<line x1={tx} y1={ty} x2={px} y2={py} stroke="url(#trail)" strokeWidth={14} strokeLinecap="round" />
					<circle cx={px} cy={py} r={34} fill="#ffb066" opacity={0.45} style={{filter: 'blur(12px)'}} />
					<circle cx={px} cy={py} r={11} fill="#fff7e0" />
				</g>
			</g>
			<rect width={W} height={H} fill="#fff1d6" opacity={0.75 * (1 - ramp(f, 549, 557))} />
		</svg>
	);
};

// ------------------------------------------------------------------ assembly

const inShot = (f: number, s: readonly [number, number]) => f >= s[0] && f < s[1];

export const OddAtomJupiterV3: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const [handle] = useState(() => delayRender('Load fonts'));
	useEffect(() => {
		const font = new FontFace('Nunito', `url(${staticFile('assets/fonts/Nunito.ttf')})`, {weight: '200 1000'});
		font
			.load()
			.then((ff) => {
				document.fonts.add(ff);
				continueRender(handle);
			})
			.catch(cancelRender);
	}, [handle]);
	const gasIn = ramp(f, 196, 210);
	const diveIn = ramp(f, 318, 332);
	return (
		<AbsoluteFill style={{background: '#0a0a24'}}>
			{inShot(f, SHOT.space) && <AbsoluteFill><SpaceShot f={f} /></AbsoluteFill>}
			{inShot(f, SHOT.gas) && <AbsoluteFill style={{opacity: gasIn}}><GasShot f={f} /></AbsoluteFill>}
			{inShot(f, SHOT.dive) && <AbsoluteFill style={{opacity: diveIn}}><DiveShot f={f} /></AbsoluteFill>}
			{inShot(f, SHOT.fall) && <AbsoluteFill><FallShot f={f} /></AbsoluteFill>}
			{inShot(f, SHOT.map) && <AbsoluteFill style={{opacity: ramp(f, 548, 551)}}><MapShot f={f} /></AbsoluteFill>}
			{/* gentle vignette unifies the shots */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(6,4,20,0.45) 100%)'}} />
			{captions && <Caption t={f / 30} cues={JUPITER_CUES} />}
			{includeAudio && <Audio src={staticFile('assets/audio/odd-atom-jupiter-v2/jupiter-fall-v1-opening-23s.m4a')} />}
		</AbsoluteFill>
	);
};
