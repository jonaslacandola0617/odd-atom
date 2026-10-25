/** Exercise the actual authored poses/mesh and engine, not duplicate fixtures. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'../../..'),cache=new Map();
function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
  const source=fs.readFileSync(file,'utf8'),mod={exports:{}};cache.set(file,mod);const local=createRequire(file);
  const requireFile=name=>{
    if(name.endsWith('/IllustratedTitle')||name==='./IllustratedTitle')return {IllustratedTitle:()=>null};
    if(name.startsWith('.')){
      const base=path.resolve(path.dirname(file),name);
      for(const ext of ['', '.ts','.tsx'])if(fs.existsSync(base+ext)&&!fs.statSync(base+ext).isDirectory()){
        return (base+ext).endsWith('.json')?JSON.parse(fs.readFileSync(base+ext,'utf8')):load(base+ext);
      }
    }
    return local(name);
  };
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,{module:mod,exports:mod.exports,require:requireFile},{filename:file});return mod.exports;
}
const curves=load(path.join(root,'animation-mastery/engine/timeline/curves.ts'));
const acting=load(path.join(root,'animation-mastery/engine/animation/acting.ts'));
const constraints=load(path.join(root,'animation-mastery/engine/animation/constraints.ts'));
const dynamics=load(path.join(root,'animation-mastery/engine/animation/dynamics.ts'));
const paths=load(path.join(root,'animation-mastery/engine/animation/paths.ts'));
const rig=load(path.join(root,'src/MotionCharacters.tsx'));
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const report={status:'passed',checks:[],mesh_triangles:0,min_signed_area_ratio:Infinity,max_local_foot_displacement:0,max_cup_edge_length_error:0};
const sol={lean:0,head:0,shoulder:0,elbow:0,wrist:0};
for(const [name,duration,performance] of [['A',120,acting.windActing],['D',360,acting.gardenActing]]){
  const snapshots=[];
  for(let frame=0;frame<duration;frame++){
    const p=performance(frame);snapshots.push(JSON.stringify(p));
    for(const mesh of rig.motionGeometryForPoses(p,sol,true)){
      for(let iy=0;iy<mesh.ys.length-1;iy++)for(let ix=0;ix<mesh.xs.length-1;ix++){
        const [x,X,y,Y]=[mesh.xs[ix],mesh.xs[ix+1],mesh.ys[iy],mesh.ys[iy+1]];
        for(const tri of [[[x,y],[X,y],[x,Y]],[[X,Y],[x,Y],[X,y]]]){
          const ratio=cross(...tri.map(mesh.deform))/cross(...tri);
          assert(Number.isFinite(ratio)&&ratio>0,`${name} ${mesh.name} folds at ${frame}`);report.mesh_triangles++;report.min_signed_area_ratio=Math.min(report.min_signed_area_ratio,ratio);
        }
      }
      if(mesh.name==='Mira body')for(const point of [[-90,-30],[10,-50],[80,-10]]){
        const q=mesh.deform(point);report.max_local_foot_displacement=Math.max(report.max_local_foot_displacement,Math.hypot(q[0]-point[0],q[1]-point[1]));
      }
      if(mesh.name==='Mira arm'){
        const corners=[[3,-385],[32,-385],[32,-349],[3,-349]],q=corners.map(mesh.deform);
        for(let i=0;i<4;i++){
          const j=(i+1)%4;report.max_cup_edge_length_error=Math.max(report.max_cup_edge_length_error,Math.abs(Math.hypot(q[i][0]-q[j][0],q[i][1]-q[j][1])-Math.hypot(corners[i][0]-corners[j][0],corners[i][1]-corners[j][1])));
        }
      }
    }
  }
  for(let frame=duration-1;frame>=0;frame--)assert.equal(JSON.stringify(performance(frame)),snapshots[frame],'Frame-order-dependent acting state');
}
assert(report.max_local_foot_displacement<1e-7);assert(report.max_cup_edge_length_error<1e-7);
report.checks.push('Actual A/D poses: connected mesh has no inverted triangles; lower-leg anchors stay fixed; mug skin remains rigid; pose evaluation is independent of frame order.');
const hierarchy=constraints.hierarchy([{id:'hand',parent:'arm',matrix:constraints.localMatrix(10,0)},{id:'arm',matrix:constraints.localMatrix(100,100,90)}]);
const hand=constraints.transformPoint(hierarchy.get('hand'),[0,0]);assert(Math.hypot(hand[0]-100,hand[1]-110)<1e-6);
assert.throws(()=>constraints.hierarchy([{id:'a',parent:'b',matrix:constraints.identity},{id:'b',parent:'a',matrix:constraints.identity}]));
const ik=constraints.twoBoneIK([0,0],[60,80],60,60);assert(Math.abs(Math.hypot(...ik.elbow)-60)<1e-6);assert(Math.hypot(ik.hand[0]-60,ik.hand[1]-80)<1e-6);
report.checks.push('Hierarchy resolves child-before-parent and rejects cycles; two-bone solve retains lengths and reaches a reachable target.');
assert.equal(curves.track(5,curves.keys([[0,3],[10,9,'hold']])),3);assert.equal(curves.track(10,curves.keys([[0,3],[10,9,'hold']])),9);
assert(curves.phase(3,0,10,'accelerate')<curves.phase(3,0,10,'decelerate'));
assert.throws(()=>paths.morphContour([[0,0],[1,0],[0,1]],[[0,0]],.5));
const xs=Array.from({length:200},(_,i)=>dynamics.seeded(i));assert(Math.min(...xs)<.05&&Math.max(...xs)>.95);assert(new Set(xs).size===200);
report.checks.push('Holds preserve authored values, timing profiles differ, incompatible morph topology is rejected, and seeded placement spans its intended range.');
report.limitations='Geometry/determinism checks do not establish illustration quality, seamless texture registration at every pose, source-quality equivalence, or viewer comprehension. Native-pixel and temporal visual inspection are separate.';
const dest=path.join(root,'animation-mastery/validation/quality-audits/engine-geometry.json');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
