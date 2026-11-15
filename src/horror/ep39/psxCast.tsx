// Episode 39, PSX-model test: the same scene acted by the user's licensed PS1-style characters
// (public/assets/models/psx/, see its PROVENANCE.md) instead of our blocky figures.
// Tatay: Character_29 (an older man); me: Character_08 (teal polo, jeans); Nanay: Character_29_Female
// (white hair, lilac cardigan), tinted pale. Chairs and mattress: the Derelict Furniture pack.
import React from 'react';
import {ARMS_DOWN, merge, PsxCharacter, PsxProp, SIT} from '../psx/models';
import {DOOR, FAR_CHAIR0, MY_CHAIR, V3} from './world';

const PALE = {color: '#c8d2d8', emissive: '#1c2428'};

/** Tatay lying on his back, head at −z on the pillow. look: 0 still, >0 toward my chair; lift: head up
 *  toward the doorway (his smile, night 1); reach: his left hand out toward mine. */
export const PsxTatay: React.FC<{t: number; look: number; lift: number; reach: number; breathe?: number}> = ({t, look, lift, reach, breathe = 1}) => {
	const b = Math.sin(t * 1.4) * 0.03 * breathe;
	return (
		<PsxCharacter
			name="Character_29"
			height={1.62}
			position={[0, 0.83, 0.86]}
			rotation={[-Math.PI / 2, 0, 0]}
			pose={merge(ARMS_DOWN, {
				Spine2: [['x', b]],
				Neck: [['x', 0.25 + 0.3 * lift]],
				Head: [['y', 0.7 * look], ['x', 0.15 * lift]],
				LeftArm: [['z', 0.55 * reach], ['y', -0.6 * reach]],
				LeftForeArm: [['x', -0.4 * reach]],
			})}
		/>
	);
};

/** Me, in my chair beside the bed, facing it; asleep bows the head. */
export const PsxMe: React.FC<{asleep: number}> = ({asleep}) => (
	<PsxCharacter
		name="Character_08"
		height={1.66}
		position={[MY_CHAIR[0] + 0.08, -0.33, MY_CHAIR[2]]}
		rotation={[0, -Math.PI / 2, 0]}
		pose={merge(SIT, {Spine1: [['x', 0.18 * asleep]], Neck: [['x', 0.55 * asleep]], Head: [['x', 0.2 * asleep]]})}
	/>
);

/** Nanay: seated in the far chair (the hook) or standing in the doorway (the end). */
export const PsxNanay: React.FC<{pose: 'sit' | 'stand'; bow?: number}> = ({pose, bow = 0}) =>
	pose === 'sit' ? (
		<PsxCharacter name="Character_29_Female" height={1.52} tint={PALE} position={[FAR_CHAIR0[0] - 0.08, -0.3, FAR_CHAIR0[2]]} rotation={[0, Math.PI / 2, 0]} pose={merge(SIT, {Neck: [['x', bow]]})} />
	) : (
		<PsxCharacter name="Character_29_Female" height={1.52} tint={PALE} position={[DOOR[0], 0, DOOR[2] - 0.1]} rotation={[0, Math.PI, 0]} pose={merge(ARMS_DOWN, {Neck: [['x', bow]]})} />
	);

export const PsxChair: React.FC<{p: V3; ry: number}> = ({p, ry}) => <PsxProp path="assets/models/psx/props/derelict-chair.glb" position={p} rotation={[0, ry, 0]} />;
export const PsxMattress: React.FC = () => <PsxProp path="assets/models/psx/props/derelict-mattress.glb" position={[0, 0.53, 0]} rotation={[0, Math.PI / 2, 0]} s={1.05} />;
