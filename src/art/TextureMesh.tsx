import React from 'react';

export type Point=[number,number];
/** Continuous texture skinning. Adjacent triangles share deformed vertices;
 * the approved illustration stays the texture, rather than exposing a cut edge
 * when an elbow bends. Lower legs receive zero torso weight. */
export const TextureMesh:React.FC<{id:string;xs:number[];ys:number[];deform:(p:Point)=>Point;children:React.ReactNode}>=({id,xs,ys,deform,children})=>{
  const patches:React.ReactNode[]=[];
  for(let iy=0;iy<ys.length-1;iy++)for(let ix=0;ix<xs.length-1;ix++){
    const x=xs[ix],X=xs[ix+1],y=ys[iy],Y=ys[iy+1];
    const triangles:Point[][]=[[[x,y],[X,y],[x,Y]],[[X,Y],[x,Y],[X,y]]];
    for(const points of triangles){
      const [a,b,c]=points,[A,B,C]=points.map(deform),dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1],det=dx*ey-dy*ex;
      const m0=((B[0]-A[0])*ey-(C[0]-A[0])*dy)/det;
      const m2=((C[0]-A[0])*dx-(B[0]-A[0])*ex)/det;
      const m1=((B[1]-A[1])*ey-(C[1]-A[1])*dy)/det;
      const m3=((C[1]-A[1])*dx-(B[1]-A[1])*ex)/det;
      const tx=A[0]-m0*a[0]-m2*a[1],ty=A[1]-m1*a[0]-m3*a[1];
      const cx=(a[0]+b[0]+c[0])/3,cy=(a[1]+b[1]+c[1])/3;
      // A subpixel texture bleed prevents antialias cracks between patches.
      const distances=points.map((p,i)=>{const q=points[(i+1)%3];return Math.abs((q[1]-p[1])*cx-(q[0]-p[0])*cy+q[0]*p[1]-q[1]*p[0])/Math.hypot(q[0]-p[0],q[1]-p[1]);});
      const bleed=1+.85/Math.min(...distances);
      const polygon=points.map(([px,py])=>`${cx+(px-cx)*bleed},${cy+(py-cy)*bleed}`).join(' ');
      const key=`${id}-patch-${patches.length}`;
      patches.push(<g key={key} transform={`matrix(${m0} ${m1} ${m2} ${m3} ${tx} ${ty})`}><clipPath id={key}><polygon points={polygon} shapeRendering="crispEdges"/></clipPath><use href={`#${id}-texture`} clipPath={`url(#${key})`}/></g>);
    }
  }
  return <><defs><g id={`${id}-texture`}>{children}</g></defs>{patches}</>;
};
