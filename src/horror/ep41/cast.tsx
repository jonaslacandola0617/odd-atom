// Episode 41 cast: the user's PSX characters (public/assets/models/psx/characters, PROVENANCE.md).
// Nobody is a real person. Everyone in the van sways with the road; the two women do not.
//   me            Character_14 (black tee, khaki shorts), rear bench by the left window
//   the women     Character_Female_13 (pink blouse) and Character_Female_12 (navy long sleeve), pale
//   in the glass  Character_Monster_05 (long hair over the face) takes the nearer woman's place, once
//   driver        Character_30; front passenger Character_03; the benches: 05, Female_05, 10,
//                 31_Female / 11, 29_Female, 08 / and a man asleep against the right window, 29
import React from 'react';
import {ARMS_DOWN, merge, Pose, PsxCharacter, SIT} from '../psx/models';
import {ROW, SEAT_TOP, SEATX, V3} from './world';

export const PALE = {color: '#d4dce0', emissive: '#20282c'};
const SIT_Y = SEAT_TOP - 0.79; // root height that puts the seat of the trousers on the vinyl

// ------------------------------------------------------------------ the road
/** bump times (s): each sets the van rocking. The big one is the line's "lubak". */
export const BUMPS: number[] = [];
export const setBumps = (b: number[]) => {
	BUMPS.length = 0;
	BUMPS.push(...b);
};
/** the cabin's response to the road at t: a jolt (y, m) and a roll (rad), plus a constant fine shiver */
export const road = (t: number, lag = 0) => {
	let y = 0, roll = 0;
	for (const b of BUMPS) {
		const d = t - b - lag;
		if (d < 0 || d > 2.5) continue;
		const e = Math.exp(-d * 3.2);
		y += 0.045 * e * Math.sin(d * 19);
		roll += 0.06 * e * Math.sin(d * 9 + 0.6);
	}
	y += 0.003 * Math.sin(t * 41 + lag * 7) * Math.sin(t * 5.3);
	return {y, roll};
};

// ------------------------------------------------------------------ a passenger who rides with the road
export const Rider: React.FC<{name: string; at: [number, number]; t: number; seed: number; height?: number; extra?: Pose; doze?: number; front?: boolean}> = ({
	name,
	at,
	t,
	seed,
	height = 1.68,
	extra = {},
	doze = 0,
	front,
}) => {
	const lag = 0.04 + (seed % 5) * 0.025;
	const r = road(t, lag);
	const breath = Math.sin(t * (1.3 + (seed % 3) * 0.1) + seed) * 0.025;
	const pose = merge(
		SIT,
		{
			Spine: [['z', r.roll * 1.6]],
			Spine2: [['x', breath]],
			Neck: [['z', r.roll * 2.2], ['x', 0.15 + doze * 0.45]],
			Head: [['z', r.roll * 1.4 + doze * 0.25 * Math.sign(seed % 2 - 0.5)]],
		},
		extra,
	);
	return <PsxCharacter name={name} height={height} position={[at[0], SIT_Y + r.y * 0.6 + (front ? 0.02 : 0), at[1] + 0.06]} rotation={[0, Math.PI, 0]} pose={pose} />;
};

// ------------------------------------------------------------------ the two women
/** turn: 0 facing ahead, 1 their faces toward me (the head past where a neck can go); near: 0 in
 *  their seats, 1 pressed up against me; breathe: one breath (0..1..0). tilt: the head tips toward
 *  the lens. */
export type WomanState = {turn: number; near: number; breathe?: number; tilt?: number};
const womanPose = (s: WomanState, k: number): Pose => {
	const turn = s.turn * k;
	return merge(SIT, {
		Spine2: [['x', -0.06 * (s.breathe ?? 0)]],
		// her left is toward me: the neck takes 70°, the head the rest, up to about 150°
		Neck: [['x', 0.08], ['y', 1.2 * turn]],
		Head: [['y', 1.4 * turn], ['z', (s.tilt ?? 0) * 0.4], ['x', 0.2 * turn]],
		// hands flat on the thighs, never moving
		LeftForeArm: [['aim', [0.02, -0.25, 1]]],
		RightForeArm: [['aim', [-0.02, -0.25, 1]]],
	});
};
export const Women: React.FC<{s: WomanState; monster?: boolean}> = ({s, monster}) => {
	// seat places 1 and 2, sliding toward me (seat 0) with near
	const x1 = SEATX[1] + (SEATX[0] + 0.3 - SEATX[1]) * s.near;
	const x2 = SEATX[2] + (SEATX[1] + 0.12 - SEATX[2]) * s.near;
	return (
		<>
			<PsxCharacter
				name={monster ? 'Character_Monster_05' : 'Character_Female_13'}
				height={monster ? 1.62 : 1.58}
				tint={PALE}
				position={[x1, SIT_Y + 0.02, ROW.rear + 0.06]}
				rotation={[0, Math.PI, 0]}
				pose={womanPose(s, 1)}
			/>
			<PsxCharacter name="Character_Female_12" height={1.6} tint={PALE} position={[x2, SIT_Y + 0.02, ROW.rear + 0.06]} rotation={[0, Math.PI, 0]} pose={womanPose(s, 1.08)} />
		</>
	);
};

// ------------------------------------------------------------------ me
/** phone: holding it at the chest, head bowed to it; reach: my right hand out onto the seat beside
 *  me; look: head toward the window (−1) or toward the seats (+1). */
/** where my hands are (filled in while I am drawn; the phone follows them) */
export const HANDS = {l: [0, 0, 0] as V3, r: [0, 0, 0] as V3, head: [0, 0, 0] as V3};
export const Me: React.FC<{t: number; phone?: number; reach?: number; look?: number}> = ({t, phone = 0, reach = 0, look = 0}) => {
	const r = road(t, 0.03);
	const hold: Pose = phone
		? {
				LeftArm: [['aim', [0.12, -1, 0.22]]],
				RightArm: [['aim', [-0.12, -1, 0.22]]],
				LeftForeArm: [['aim', [-0.3, 0.02, 1]]],
				RightForeArm: [['aim', [0.3, 0.02, 1]]],
			}
		: {};
	const hand: Pose = reach
		? {
				RightArm: [['aim', [-0.6 - 0.3 * reach, -1, 0.35]]],
				RightForeArm: [['aim', [-0.5 - 0.5 * reach, -0.9, 0.5]]],
			}
		: {};
	return (
		<PsxCharacter
			name="Character_14"
			height={1.7}
			position={[SEATX[0], SIT_Y + r.y * 0.6, ROW.rear + 0.06]}
			rotation={[0, Math.PI, 0]}
			probe={(w) => {
				HANDS.l = w('LeftHand').toArray() as V3;
				HANDS.r = w('RightHand').toArray() as V3;
				HANDS.head = w('Head').toArray() as V3;
			}}
			pose={merge(SIT, hold, hand, {
				Spine: [['z', r.roll * 1.6]],
				Neck: [['x', 0.1 + 0.4 * phone], ['y', -0.6 * look]],
				Head: [['x', 0.15 * phone], ['y', -0.5 * look]],
			})}
		/>
	);
};

// ------------------------------------------------------------------ everybody else (nine), as in the van
export const Others: React.FC<{t: number; rearMan?: boolean; front?: boolean; hideB2Left?: boolean}> = ({t, rearMan = true, front = true, hideB2Left}) => (
	<>
		{front && (
			<>
				<Rider name="Character_30" at={[-0.45, ROW.front]} t={t} seed={1} front extra={{LeftArm: [['aim', [0.35, -0.7, 0.7]]], RightArm: [['aim', [-0.35, -0.7, 0.7]]], LeftForeArm: [['aim', [-0.2, 0.2, 1]]], RightForeArm: [['aim', [0.2, 0.2, 1]]]}} />
				<Rider name="Character_03" at={[0.45, ROW.front]} t={t} seed={2} doze={0.6} front />
			</>
		)}
		<Rider name="Character_05" at={[SEATX[0], ROW.b1]} t={t} seed={3} doze={0.3} />
		<Rider name="Character_Female_05" at={[SEATX[1], ROW.b1]} t={t} seed={4} height={1.58} doze={0.8} />
		<Rider name="Character_10" at={[SEATX[2], ROW.b1]} t={t} seed={5} />
		<Rider name="Character_31_Female" at={[SEATX[3], ROW.b1]} t={t} seed={6} height={1.55} doze={0.5} />
		{!hideB2Left && <Rider name="Character_11" at={[SEATX[0], ROW.b2]} t={t} seed={7} doze={0.7} />}
		<Rider name="Character_29_Female" at={[SEATX[1] + 0.05, ROW.b2]} t={t} seed={8} height={1.52} doze={0.9} />
		<Rider name="Character_08" at={[SEATX[3], ROW.b2]} t={t} seed={9} />
		{rearMan && <Rider name="Character_29" at={[SEATX[3], ROW.rear]} t={t} seed={10} height={1.62} doze={1} extra={{Head: [['z', -0.3]]}} />}
	</>
);
export {ARMS_DOWN};
