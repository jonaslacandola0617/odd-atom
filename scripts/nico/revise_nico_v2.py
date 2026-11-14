"""Revise the ACTUAL delivered v1 .blend; never rebuild/overwrite v1.

Wide solid locks replace its outer hair shell. A close underlayer only covers
the scalp. Jaw/neck and lower denim are the only other changed geometry.
"""
import bpy,bmesh,math,json,hashlib,sys,shutil
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];V1=ROOT/'assets/characters/nico-lowpoly-v1';OUT=ROOT/'assets/characters/nico-lowpoly-v2';TMP=ROOT/'out/nico-v2'
OUT.mkdir(parents=True,exist_ok=True);(OUT/'review').mkdir(exist_ok=True);TMP.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
baseline={str(p.relative_to(V1)):sha(p) for p in V1.rglob('*') if p.is_file()}
bpy.ops.wm.open_mainfile(filepath=str(V1/'Nico_LowPoly.blend'))
scene=bpy.context.scene;geo=bpy.data.collections['NICO • editable geometry'];root=next(o for o in geo.objects if o.type=='EMPTY')
root['revision']='v2: hair silhouette, jaw/neck, lower denim';root.empty_display_size=.06
scene.cycles.samples=48;scene.cycles.use_denoising=False
hairmat=bpy.data.materials['Hair • painted charcoal black'];hairtone=bpy.data.materials.get('Hair • shallow facet tone')
if hairtone is None:
    hairtone=hairmat.copy();hairtone.name='Hair • shallow facet tone'
original_hair=next(o for o in geo.objects if o.type=='MESH' and 'Hair_ScalpMass' in o.name)
old_hair_mesh_hash=hashlib.sha256(str([(tuple(v.co)) for v in original_hair.data.vertices]).encode()).hexdigest()
bpy.data.objects.remove(original_hair,do_unlink=True)

def interpolate(z,table):
    if z<=table[0][0]:return table[0][1]
    for (a,x),(b,y) in zip(table,table[1:]):
        if a<=z<=b:return x+(y-x)*(z-a)/(b-a)
    return table[-1][1]

head=bpy.data.objects['Nico_Skin_HeadAndNeck']
def face_warp(co):
    x,y,z=co;scale=interpolate(z,[(1.433,1.0),(1.465,.94),(1.492,.85),(1.505,.82),(1.519,.84),(1.547,.91),(1.579,1),(1.608,1)])
    x*=scale
    if 1.500<z<1.579:
        # The chin slopes into the throat; it no longer ends in a broad shelf.
        front_weight=max(0,min(1,(.014-y)/.075))
        y+=interpolate(z,[(1.500,-.003),(1.505,-.006),(1.519,-.001),(1.547,.001),(1.579,0)])*front_weight
    if z<1.500:
        # A tapered neck with a shallow anterior throat plane, not a cylinder.
        y+=interpolate(z,[(1.433,0),(1.465,.001),(1.492,.002),(1.500,0)])
    return Vector((x,y,z))
for ob in [head]+[o for o in geo.objects if any(k in o.name for k in ['QuietMouth','Nostril','Nico_Nose'])]:
    for v in ob.data.vertices:v.co=face_warp(v.co)
    ob.data.update()

# Add a restrained fabric break between the existing hem/ankle rows. All other
# pelvis/thigh topology comes from the loaded v1 asset.
jeans=bpy.data.objects['Nico_Jeans • continuous pelvis, crotch and joint loops']
bm=bmesh.new();bm.from_mesh(jeans.data)
edges=[e for e in bm.edges if abs(min(v.co.z for v in e.verts)-.105)<1e-5 and abs(max(v.co.z for v in e.verts)-.153)<1e-5]
bmesh.ops.subdivide_edges(bm,edges=edges,cuts=1,use_grid_fill=True)
for v in bm.verts:
    x,y,z=v.co;s=1 if x>=0 else -1;cx=s*.094
    factor=interpolate(z,[(.105,1.30),(.129,1.24),(.153,1.18),(.315,1.12),(.492,1.07),(.529,1.04),(.679,1)])
    if z<=.679:
        x=cx+(x-cx)*factor;y*=factor
        if abs(z-.129)<1e-4:
            x+=s*.0015;y-=.002*max(0,1-abs((x-cx)/.05))
        if abs(z-.105)<1e-4:
            z=.094+(.010 if y>0 else .006)*y/.062
    v.co=(x,y,z)
bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(jeans.data);bm.free();jeans.data.update()

# The underlayer is sampled from the actual saved head's cross-sections.
groups={}
for v in head.data.vertices:groups.setdefault(round(v.co.z,5),[]).append(v.co.copy())
sections=[(z,max(abs(p.x) for p in ps),min(p.y for p in ps),max(p.y for p in ps)) for z,ps in sorted(groups.items())]
def section(z):
    if z>=1.723:
        t=min(1,max(0,(z-1.723)/.006));return (.009*(1-t),.019+.004*t,.027-.004*t)
    for a,b in zip(sections,sections[1:]):
        if a[0]<=z<=b[0]:
            t=(z-a[0])/(b[0]-a[0]);return tuple(a[i]+(b[i]-a[i])*t for i in range(1,4))
    return sections[-1][1:]
def boundary(a):
    aa=abs(a)
    z=interpolate(aa,[(0,1.673),(.60,1.674),(.95,1.651),(1.15,1.625),(1.38,1.650),(1.65,1.646),(1.90,1.623),(2.30,1.606),(2.70,1.591),(math.pi,1.586)])
    uneven=(.004*math.sin(a*5+1.1)+.002*math.sin(a*9-.2)) if aa>2.1 else 0
    return z+.002*math.sin(a*7+.8)+.0015*math.sin(a*3)+uneven
def mesh(name,vs,fs,uv=None):
    me=bpy.data.meshes.new(name+' mesh');me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(name,me);geo.objects.link(o);o.parent=root
    me.materials.append(hairmat);me.materials.append(hairtone)
    if uv:
        layer=me.uv_layers.new(name='UVMap')
        for p in me.polygons:
            for li in p.loop_indices:layer.data[li].uv=uv(me.vertices[me.loops[li].vertex_index].co)
    bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=1e-7);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();me.update()
    for p in me.polygons:p.use_smooth=False
    o['hair_revision']='v2 outer silhouette replacement'
    return o
N=32;ts=[0,.24,.48,.72,.88,.97];vs=[]
for t in ts:
    for i in range(N):
        a=-math.pi+i*math.tau/N;z=boundary(a)+(1.727-boundary(a))*t
        rx,front,back=section(z);x=rx*math.sin(a);y=(front+back)/2-(back-front)/2*math.cos(a)
        normal=Vector((x,y-.012,(z-1.64)*.38)).normalized();p=Vector((x,y,z))+normal*.0045;vs.append(tuple(p))
fs=[]
for j in range(len(ts)-1):
    for i in range(N):fs.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i))
top=len(vs);vs.append((0,.023,1.729))
for i in range(N):fs.append(((len(ts)-1)*N+i,(len(ts)-1)*N+(i+1)%N,top))
inside=len(vs)
for x,y,z in vs[:N]:vs.append((x*.97,.012+(y-.012)*.97,z+.001))
for i in range(N):fs.append((i,inside+i,inside+(i+1)%N,(i+1)%N))
fs.append(tuple(inside+i for i in range(N)))
under=mesh('Nico_Hair_v2_Underlayer • close fitted, stepped ear and tapered nape',vs,fs,lambda p:((math.atan2(p.x,-p.y)+math.pi)/math.tau,(p.z-1.58)/.20))

deps=bpy.context.evaluated_depsgraph_get();skin_bvh=BVHTree.FromObject(head,deps);ORIGIN=Vector((0,.010,1.64))
def skin_base(p):
    d=(Vector(p)-ORIGIN).normalized();hit,normal,index,dist=skin_bvh.ray_cast(ORIGIN,d,1)
    if hit is None:raise RuntimeError('Could not seat hair root on actual scalp')
    return hit,d

# Each path runs ROOT -> raised middle -> short flattened end. Widths are full
# widths in metres. The terminal sections remain broad, never a single point.
LOCKS=[
 ('01_MainSweep',[(.047,.016,1.713),(.032,-.018,1.738),(-.006,-.043,1.744),(-.041,-.063,1.716),(-.056,-.062,1.681)],[.055,.070,.068,.050,.022]),
 ('02_LowerFringe',[(.015,.014,1.711),(.005,-.017,1.730),(-.021,-.054,1.715),(-.019,-.073,1.666)],[.048,.055,.047,.020]),
 ('03_SideFringe',[(.065,.019,1.700),(.062,-.016,1.720),(.045,-.047,1.718),(.037,-.073,1.681)],[.045,.051,.047,.025]),
 ('05_RearLeft',[(-.025,.026,1.716),(-.045,.052,1.700),(-.042,.074,1.674),(-.030,.081,1.621)],[.051,.054,.047,.025]),
 ('06_RearRight',[(.025,.025,1.715),(.047,.051,1.697),(.043,.074,1.662),(.036,.080,1.603)],[.051,.054,.042,.024]),
 ('07_Nape',[(0,.052,1.700),(.007,.081,1.665),(.008,.086,1.625),(.009,.084,1.584)],[.046,.048,.037,.024]),
 ('10_BentCowlick',[(.004,.012,1.727),(-.013,.009,1.737),(-.030,.004,1.747),(-.042,0,1.743),(-.044,-.004,1.735)],[.037,.037,.031,.025,.016]),
]
lock_meta=[]
for name,path,widths in LOCKS:
    vv=[];ff=[];cow='Cowlick' in name
    for j,p in enumerate(path):
        P=Vector(p);base,n=skin_base(P);desired=(P-base).dot(n)
        if j==0:height=.007
        elif j==len(path)-1:height=min(.042 if cow else .010,max(.006,desired))
        else:height=min(.038 if cow else .032 if 'MainSweep' in name else .020,max(.007,desired))
        if 'Rear' in name or 'Nape' in name:height=min(height,.010)
        T=base+n*height
        tangent=Vector(path[min(j+1,len(path)-1)])-Vector(path[max(0,j-1)])
        U=tangent.cross(n).normalized()
        if U.length<.1:U=Vector((1,0,0))
        half=widths[j]/2
        # Cross-section: broad ridge, beveled shoulders, and seated solid base.
        for lateral,level in [(-1,.43),(-.68,.86),(0,1),(.68,.86),(1,.43),(.72,-1),(0,-1),(-.72,-1)]:
            lead=(.002 if cow else .004)*(1-abs(lateral)) if j==len(path)-1 else 0
            q=T+U*half*lateral+tangent.normalized()*lead
            b,nn=skin_base(q)
            lower=.0025 if j==len(path)-1 and not cow else -.0010
            if cow and j>=len(path)-2:lower=max(.002,height-.007)
            if level<0:
                q=b+nn*lower
            else:
                fraction=1 if level==1 else .60 if level>.5 else .12
                q=b+nn*max(lower+.001,.003,height*fraction)
            vv.append(tuple(q))
    n=8
    for j in range(len(path)-1):
        for i in range(n):ff.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    ff.extend([tuple(range(n-1,-1,-1)),tuple((len(path)-1)*n+i for i in range(n))])
    o=mesh('Nico_Hair_v2_Lock_'+name,vv,ff,lambda p:((p.x+.11)/.22,(p.z-1.58)/.22))
    o['construction']='Closed volumetric lock; broad root, raised middle, flattened short tip. Deliberate root overlap with underlayer.'
    lock_meta.append({'object':o.name,'control_path':path,'full_widths':widths,'cowlick':cow})

# Save a new native asset and export only the character. The v1 files are read-only.
shutil.copytree(V1/'textures',OUT/'textures',dirs_exist_ok=True)
for im in bpy.data.images:
    if im.source=='FILE' and im.users:
        im.filepath='//textures/'+Path(im.filepath).name
        if not im.packed_file:im.pack()
for o in bpy.context.selected_objects:o.select_set(False)
for o in geo.objects:o.select_set(True)
bpy.context.view_layer.objects.active=root
scene.render.filepath=str(OUT/'review/finished-three-quarter.png')
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Nico_LowPoly.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'Nico_LowPoly.glb'),export_format='GLB',use_selection=True,export_materials='EXPORT',export_animations=False,export_yup=True,export_normals=True,export_texcoords=True)
assert baseline=={str(p.relative_to(V1)):sha(p) for p in V1.rglob('*') if p.is_file()},'v1 must be unchanged'
(OUT/'construction.json').write_text(json.dumps({'source_v1_blend_sha256':baseline['Nico_LowPoly.blend'],'v1_files_preserved':baseline,'v1_hair_vertex_hash':old_hair_mesh_hash,'outer_shape':'Old outer shell removed. New close scalp cover plus seven broad closed locks, including one bent crown lock.','locks':lock_meta,'other_changes':['Jaw corners/chin width reduced with a few planes','Neck tapers upward and recedes into jaw underside','Lower jeans widened; one extra row creates a small fabric break above the sneakers'],'blender':bpy.app.version_string},indent=2)+'\n')
print('Saved new v2; v1 source and every delivered v1 file unchanged.')
