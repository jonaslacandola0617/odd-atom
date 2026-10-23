import React from 'react';

export type CitizenColors = {skin: string; shade: string; hair: string; coat: string; coatShade: string; trousers: string; shoes: string; accent: string};
export const MIRA: CitizenColors = {skin: '#D88B62', shade: '#B85B56', hair: '#281936', coat: '#F7B744', coatShade: '#D9803E', trousers: '#3C3372', shoes: '#E87E78', accent: '#7AD2C6'};
export const SOL: CitizenColors = {skin: '#A96A4E', shade: '#804850', hair: '#35283C', coat: '#5CA99C', coatShade: '#387F82', trousers: '#422B58', shoes: '#E9BD89', accent: '#F4DCB0'};
export const EXTRAS: CitizenColors[] = [
  {skin: '#A66CA9', shade: '#684282', hair: '#29204C', coat: '#4D367C', coatShade: '#382658', trousers: '#28224E', shoes: '#7A5C9F', accent: '#936BAD'},
  {skin: '#A47FB4', shade: '#755694', hair: '#33214C', coat: '#665092', coatShade: '#493769', trousers: '#34264E', shoes: '#7B669C', accent: '#AA80BB'},
  {skin: '#B478A7', shade: '#805383', hair: '#3B2153', coat: '#573475', coatShade: '#3B2959', trousers: '#30244C', shoes: '#81628C', accent: '#A088B8'},
];

type Point = [number, number];
function joint(a: Point, b: Point, upper: number, lower: number, bend: number): Point {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const d = Math.max(0.01, Math.min(Math.hypot(dx, dy), upper + lower - 0.01));
  const angle = Math.atan2(dy, dx) + bend * Math.acos(Math.max(-1, Math.min(1, (upper * upper + d * d - lower * lower) / (2 * upper * d))));
  return [a[0] + Math.cos(angle) * upper, a[1] + Math.sin(angle) * upper];
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Original human rig. Local origin is at the feet; the seated pelvis lowers physically. */
export const Citizen: React.FC<{
  id: string; frame: number; colors?: CitizenColors; facing?: number; seated?: boolean | number;
  walking?: boolean; mood?: number; attention?: number; gesture?: number; cup?: boolean; sip?: number;
  variant?: 'sweep' | 'curls' | 'bun'; opacity?: number;
}> = ({id, frame, colors = MIRA, facing = 1, seated = false, walking = false, mood = .3, attention = 0, gesture = 0, cup = false, sip = 0, variant = 'sweep', opacity = 1}) => {
  const p = colors;
  const cycle = frame / 7.8;
  const sitAmount = typeof seated === 'number' ? seated : seated ? 1 : 0;
  const stride = walking ? Math.sin(cycle) * (1 - sitAmount) : 0;
  const bob = walking ? Math.abs(Math.sin(cycle)) * 4 : 0;
  const hipY = lerp(-160, -80, sitAmount) + bob * (1 - sitAmount);
  const lean = lerp(5, -2, attention) + (walking ? -3 : 0);
  const leftFoot: Point = [lerp(-24 - stride * 25, 31, sitAmount), -Math.max(0, stride) * 12];
  const rightFoot: Point = [lerp(24 + stride * 25, 74, sitAmount), -Math.max(0, -stride) * 12];
  const leftHip: Point = [-19, hipY + 8], rightHip: Point = [19, hipY + 8];
  const leftStanding = joint(leftHip, leftFoot, 77, 77, -1), rightStanding = joint(rightHip, rightFoot, 77, 77, -1);
  const leftKnee: Point = [lerp(leftStanding[0], 34, sitAmount), lerp(leftStanding[1], -76, sitAmount)];
  const rightKnee: Point = [lerp(rightStanding[0], 71, sitAmount), lerp(rightStanding[1], -77, sitAmount)];
  const leftShoulder: Point = [-43, -120], rightShoulder: Point = [43, -120];
  const leftHand: Point = [-48 - (walking ? stride * 20 : 0), lerp(-4 + (walking ? stride * 12 : 0), -8, sitAmount)];
  const rightHand: Point = [lerp(lerp(lerp(50 + (walking ? stride * 22 : 0), 75, sitAmount), 101, gesture), 10, sip), lerp(lerp(lerp(-5 - (walking ? stride * 12 : 0), -44, sitAmount), -66 + Math.sin(frame / 14) * 4, gesture), -125, sip)];
  const leftElbow = joint(leftShoulder, leftHand, 62, 61, -1);
  const rightElbow = joint(rightShoulder, rightHand, 62, 61, 1);
  const blinkSeed = [...id].reduce((n, c) => n + c.charCodeAt(0), 0);
  const blinkPhase = ((frame + blinkSeed * 17) % 143 + 143) % 143;
  const blink = blinkPhase < 5 ? .09 + .91 * Math.abs(blinkPhase - 2.5) / 2.5 : 1;
  const headTilt = lerp(10, -3, attention) + sip*3 + (walking ? Math.sin(cycle) * 1.5 : Math.sin(frame / 51) * .5);
  const gaze = lerp(lerp(-1.5, 4, attention), 0, sip);
  const hand = (point: Point, side: number) => <g transform={`translate(${point}) rotate(${side * 8 - gesture * 19})`}>
    <path d="M-9-8Q-8-14-2-12L7-9Q14-5 11 2L6 10Q2 14-4 9L-10 2Z" fill={p.skin} />
    <path d="M6-6Q17-10 16-4L10 3" fill={p.skin} />
    <path d="M-3 7L4 9M1 3L8 5" stroke={p.shade} strokeWidth="1.4" strokeLinecap="round" fill="none" />
  </g>;
  const leg = (a: Point, b: Point, c: Point, front: boolean) => <g>
    <path d={`M${a}L${b}L${c}`} fill="none" stroke={front ? p.trousers : '#292345'} strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M${b[0]+5} ${b[1]+7}L${c[0]+5} ${c[1]-10}`} stroke={front ? '#574680' : '#392B59'} strokeWidth="7" strokeLinecap="round" />
    <g transform={`translate(${c})`}><path d="M-15-10Q-6-13 5-9L17-2Q26 1 25 8H-17Q-21 0-15-10Z" fill={p.shoes} /><path d="M-18 7H25" stroke="#281F40" strokeWidth="5" strokeLinecap="round" /><path d="M4-7L10-4M0-4L6-1" stroke="#FFF0D2" strokeWidth="2" strokeLinecap="round" /></g>
  </g>;

  return <g opacity={opacity} transform={`scale(${facing} 1)`}>
    <defs>
      <clipPath id={`${id}-eye-left`}><ellipse cx="-15" cy="-186" rx="8.5" ry={9 * blink} /></clipPath>
      <clipPath id={`${id}-eye-right`}><ellipse cx="17" cy="-186" rx="8.5" ry={9 * blink} /></clipPath>
    </defs>
    {leg(leftHip, leftKnee, leftFoot, false)}
    {leg(rightHip, rightKnee, rightFoot, true)}
    <g transform={`translate(0 ${hipY}) rotate(${lean} 0 0)`}>
      <path d={`M${leftShoulder}L${leftElbow}L${leftHand}`} stroke={p.coatShade} strokeWidth="28" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {hand(leftHand, -1)}
      <path d="M-39-127Q-21-137 0-132Q25-137 44-122L53-85L38 8Q5 18-41 7L-49-79Z" fill={p.coat} />
      <path d="M-39-126L-26-109L-24-35L-32 10L-43 7L-49-79Z" fill={p.coatShade} />
      <path d="M7-126L12 8" stroke={p.coatShade} strokeWidth="4" />
      <path d="M22-39L42-43L39-15L23-11Z" fill={p.coatShade} opacity=".65" />
      <path d="M-17-141L17-141L19-122Q0-107-18-123Z" fill={p.shade} />
      {variant === 'curls' ? <g><path d="M-20-129L0-117L-12-105L-28-122ZM0-117L20-129L26-116L10-103Z" fill={p.accent} />{[-88,-60,-32].map(y=><circle key={y} cx="10" cy={y} r="3" fill={p.accent} />)}</g> : <g>
        <path d="M-20-131Q-4-118 20-128L24-112Q2-100-24-114Z" fill={p.accent} />
        <path d="M-4-113L8-110L4-72L-12-75Z" fill={p.accent} />
        <path d="M-10-95L3-93M-11-87L2-85" stroke={p.coatShade} strokeWidth="2" opacity=".35" />
      </g>}
      <path d={`M${rightShoulder}L${rightElbow}L${rightHand}`} stroke={p.coat} strokeWidth="27" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${rightElbow[0]+4} ${rightElbow[1]+5}L${rightHand[0]+2} ${rightHand[1]-9}`} stroke={p.coatShade} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d={`M${rightHand[0]-9} ${rightHand[1]-11}L${rightHand[0]+11} ${rightHand[1]-8}`} stroke={p.accent} strokeWidth="10" strokeLinecap="round" />
      {hand(rightHand, 1)}
      <g transform={`rotate(${headTilt} 0 -145)`}>
        <path d="M-39-190Q-43-235-11-242Q34-249 44-215L41-178Q20-163 0-163Q-38-164-39-190Z" fill={p.hair} />
        {variant === 'bun' && <><circle cx="-28" cy="-231" r="26" fill={p.hair} /><circle cx="-33" cy="-236" r="16" fill="#473045" /></>}
        {variant === 'curls' && [-30,-10,11,30].map((x,i)=><circle key={x} cx={x} cy={-222-(i%2)*9} r="21" fill={p.hair} />)}
        <ellipse cx="-36" cy="-178" rx="11" ry="15" fill={p.shade} /><ellipse cx="38" cy="-178" rx="10" ry="15" fill={p.skin} />
        <path d="M-34-208Q0-229 35-208L34-173Q30-145 4-141Q-24-144-33-169Z" fill={p.skin} />
        <path d="M-34-208L-21-211L-21-174Q-19-151 3-143Q-24-144-33-169Z" fill={p.shade} opacity=".6" />
        <path d="M-38-206Q-45-238-12-243Q28-249 42-221L38-194L28-207Q10-207 8-225Q-1-207-20-204L-30-185Z" fill={p.hair} />
        {variant === 'curls' && <path d="M-30-216Q-10-228 9-218Q22-214 32-223" stroke="#57404C" strokeWidth="7" fill="none" strokeLinecap="round" />}
        <path d={`M-25 -202 Q-16 ${-207+mood*4} -7 -201 M8 -201 Q17 ${-206+mood*4} 26 -199`} stroke={p.hair} strokeWidth="4" strokeLinecap="round" fill="none" />
        <ellipse cx="-15" cy="-186" rx="8.5" ry={9*blink} fill="#FFF2DD" />
        <ellipse cx="17" cy="-186" rx="8.5" ry={9*blink} fill="#FFF2DD" />
        <g clipPath={`url(#${id}-eye-left)`}><ellipse cx={-15+gaze} cy="-184" rx="4.4" ry="6.5" fill="#30233D" /><circle cx={-17+gaze} cy="-187" r="1.5" fill="white" /></g>
        <g clipPath={`url(#${id}-eye-right)`}><ellipse cx={17+gaze} cy="-184" rx="4.4" ry="6.5" fill="#30233D" /><circle cx={15+gaze} cy="-187" r="1.5" fill="white" /></g>
        <path d="M4-181L10-171Q7-167 2-169" stroke={p.shade} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={`M-9 -157 Q2 ${lerp(-162,-150,mood)} 13 -158`} stroke="#713E48" strokeWidth="3" strokeLinecap="round" fill="none" opacity={1-sip} />
        <ellipse cx="-24" cy="-170" rx="7" ry="3.5" fill={p.shade} opacity=".3" />
        <ellipse cx="25" cy="-169" rx="6" ry="3" fill={p.shade} opacity=".3" />
      </g>
      {cup && <g transform={`translate(${rightHand[0]+5} ${rightHand[1]-22}) rotate(${-sip*8})`}>
        <path d="M12-13Q32-15 30-2Q29 8 15 7" fill="none" stroke="#F7DEC2" strokeWidth="6" />
        <path d="M-15-15H17L14 10Q1 17-12 10Z" fill="#F6D9B7" />
        <ellipse cx="1" cy="-15" rx="16" ry="4" fill="#FFF0D4" /><ellipse cx="1" cy="-15" rx="12" ry="2.5" fill="#845253" />
        <path d={`M-3-28Q${4+Math.sin(frame/15)*3}-35-1-43`} stroke="#FFEDC8" strokeWidth="3" opacity=".5" fill="none" strokeLinecap="round" />
      </g>}
    </g>
  </g>;
};
