import {clamp, mix, type Point} from '../timeline/curves';

export type Cubic = readonly [Point, Point, Point, Point];
export const cubicAt = ([a,b,c,d]: Cubic, value: number): Point => {
  const t = clamp(value), u = 1 - t;
  return [u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0], u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1]];
};
export function arcSampler(curve: Cubic, count = 160) {
  const samples = Array.from({length: count + 1}, (_,i) => cubicAt(curve, i / count));
  const lengths = [0];
  for (let i = 1; i < samples.length; i++) lengths.push(lengths[i-1]+Math.hypot(samples[i][0]-samples[i-1][0],samples[i][1]-samples[i-1][1]));
  const total = lengths[lengths.length-1];
  return (progress: number): Point => {
    const distance = clamp(progress) * total;
    let i = lengths.findIndex(l => l >= distance);
    if (i <= 0) return samples[0];
    const u = (distance-lengths[i-1]) / Math.max(1e-9,lengths[i]-lengths[i-1]);
    return [mix(samples[i-1][0],samples[i][0],u),mix(samples[i-1][1],samples[i][1],u)];
  };
}

export function closedContour(points: readonly Point[], tension = .8): string {
  if (points.length < 3) throw new Error('A contour needs at least three control vertices');
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i=0;i<points.length;i++) {
    const a=points[(i+points.length-1)%points.length],b=points[i],c=points[(i+1)%points.length],e=points[(i+2)%points.length];
    d += `C${b[0]+(c[0]-a[0])*tension/6} ${b[1]+(c[1]-a[1])*tension/6} ${c[0]-(e[0]-b[0])*tension/6} ${c[1]-(e[1]-b[1])*tension/6} ${c[0]} ${c[1]}`;
  }
  return d+'Z';
}
export function morphContour(a: readonly Point[], b: readonly Point[], progress: number): Point[] {
  if (a.length!==b.length || a.length<3) throw new Error('Morph endpoints require compatible topology');
  return a.map((p,i)=>[mix(p[0],b[i][0],clamp(progress)),mix(p[1],b[i][1],clamp(progress))]);
}

/** Tapered continuous skin along a sampled centreline; no independently rotated joints. */
export function ribbon(points: readonly Point[], width: (t: number)=>number): string {
  if (points.length<2) return '';
  const left:Point[]=[],right:Point[]=[];
  for(let i=0;i<points.length;i++) {
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
    const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),r=width(i/(points.length-1));
    left.push([points[i][0]-Math.sin(angle)*r,points[i][1]+Math.cos(angle)*r]);
    right.push([points[i][0]+Math.sin(angle)*r,points[i][1]-Math.cos(angle)*r]);
  }
  return closedContour([...left,...right.reverse()],.35);
}

export const rotatePoint = (p:Point, degrees:number, pivot:Point=[0,0]):Point => {
  const a=degrees*Math.PI/180,x=p[0]-pivot[0],y=p[1]-pivot[1];
  return [pivot[0]+x*Math.cos(a)-y*Math.sin(a),pivot[1]+x*Math.sin(a)+y*Math.cos(a)];
};
