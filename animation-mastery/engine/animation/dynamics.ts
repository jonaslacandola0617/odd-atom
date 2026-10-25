import {phase} from '../timeline/curves';

/** Analytic response: arbitrary frame access never depends on playback history. */
export function settle(frame:number, contactFrame:number, fps:number, amplitude:number, frequencyHz=2.5, decay=5) {
  const t=(frame-contactFrame)/fps;
  return t<0?0:amplitude*Math.sin(t*Math.PI*2*frequencyHz)*Math.exp(-decay*t);
}
export function gust(frame:number, start:number, peak:number, end:number) {
  return phase(frame,start,peak,'smooth')*(1-phase(frame,peak,end,'decelerate'));
}
export const seeded = (id:number) => {
  let x=(id+1)|0;
  x=Math.imul(x^(x>>>16),0x7feb352d);
  x=Math.imul(x^(x>>>15),0x846ca68b);
  return ((x^(x>>>16))>>>0)/4294967296;
};
/** Delayed, finite responses; do not attach clock-driven idles to every actor. */
export function responseChain(frame:number, contactFrame:number, count:number, delayFrames:number, amplitude:number) {
  return Array.from({length:count},(_,i)=>settle(frame,contactFrame+i*delayFrames,30,amplitude/(1+i*.3),2.1,4.7));
}
