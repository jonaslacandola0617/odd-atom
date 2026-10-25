import type {MiraActingPose} from '../../../src/MotionCharacters';
import {keys,track} from '../timeline/curves';
import {settle} from './dynamics';

/** Original wind-response performance on the approved connected Mira skin.
 * Shoulder/forearm and head use different starts, spacing and recovery phases.
 * Feet stay in their registered ground pose; this is not a locomotion rig. */
export function windActing(frame:number):MiraActingPose {
  const lean=track(frame,keys([[0,.3],[17,.3],[24,1.8,'smooth'],[34,-4.3,'accelerate'],[46,1.5,'decelerate'],[63,-.25,'smooth'],[92,0,'smooth']]));
  const head=track(frame-3,keys([[0,6],[21,6],[31,-8,'accelerate'],[46,4.6,'decelerate'],[65,.1,'smooth'],[92,.3,'smooth']]));
  const shoulder=track(frame,keys([[0,0],[21,0],[27,1.4,'smooth'],[39,-3.5,'decelerate'],[66,.6,'smooth'],[92,.3,'smooth']]));
  const elbow=track(frame,keys([[0,0],[24,0],[34,-20,'accelerate'],[47,-5.3,'decelerate'],[72,-1.3,'smooth'],[92,-1.2,'smooth']]));
  const wrist=-shoulder*.35-elbow*.12;
  return {lean,head,cup:0,happy:frame>=69,shoulder,elbow,wrist};
}
export function gardenActing(frame:number):MiraActingPose {
  const p=windActing(frame-80);
  return {...p,happy:frame>=216,
    head:p.head+track(frame,keys([[0,0],[145,0],[172,2.3,'smooth'],[193,-.5,'smooth'],[216,-.5],[231,1.8,'smooth'],[248,-.2,'smooth'],[359,-.2]]))
      +settle(frame,150,30,.35,1.5,5)};
}
export const windBlink=(frame:number)=>[[29,33],[67,71]].some(([a,b])=>frame>=a&&frame<b);
export const gardenBlink=(frame:number)=>windBlink(frame-80)||(frame>=212&&frame<217);
