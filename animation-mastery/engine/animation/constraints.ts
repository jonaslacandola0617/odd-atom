import {clamp, type Point} from '../timeline/curves';

export type Matrix = readonly [number,number,number,number,number,number];
export const identity:Matrix=[1,0,0,1,0,0];
export const transformPoint=(m:Matrix,p:Point):Point=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
export function multiply(a:Matrix,b:Matrix):Matrix {
  return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
}
export function localMatrix(x:number,y:number,angle=0,sx=1,sy=sx):Matrix {
  const a=angle*Math.PI/180;return [Math.cos(a)*sx,Math.sin(a)*sx,-Math.sin(a)*sy,Math.cos(a)*sy,x,y];
}
export type Bone = {id:string;parent?:string;matrix:Matrix};
export function hierarchy(bones:readonly Bone[]) {
  const result=new Map<string,Matrix>(),lookup=new Map(bones.map(b=>[b.id,b])),visiting=new Set<string>();
  if(lookup.size!==bones.length)throw new Error('Rig bone IDs must be unique');
  const resolve=(id:string):Matrix=>{
    if(result.has(id))return result.get(id)!;
    if(visiting.has(id))throw new Error('Cyclic bone hierarchy');
    const bone=lookup.get(id);if(!bone)throw new Error(`Missing rig parent ${id}`);
    visiting.add(id);const m=bone.parent?multiply(resolve(bone.parent),bone.matrix):bone.matrix;
    visiting.delete(id);result.set(id,m);return m;
  };
  for(const b of bones)resolve(b.id);return result;
}
export function twoBoneIK(root:Point,target:Point,upper:number,lower:number,bend=1) {
  const dx=target[0]-root[0],dy=target[1]-root[1],distance=Math.hypot(dx,dy);
  const d=clamp(distance,Math.abs(upper-lower)+1e-5,upper+lower-1e-5);
  const base=Math.atan2(dy,dx),offset=Math.acos(clamp((upper*upper+d*d-lower*lower)/(2*upper*d),-1,1))*Math.sign(bend||1);
  const elbow:Point=[root[0]+Math.cos(base+offset)*upper,root[1]+Math.sin(base+offset)*upper];
  const reached:Point=[root[0]+Math.cos(base)*d,root[1]+Math.sin(base)*d];
  return {elbow,hand:reached,reachable:Math.abs(d-distance)<1e-4};
}
