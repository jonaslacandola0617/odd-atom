"""Nico: original editable low-poly construction. Run with Blender --background.

Metres, +Z up, -Y forward, +X anatomical LEFT. No rig, subdivision,
decimation, donor geometry or inverted outline shell.
"""
import bpy, bmesh, math, os, sys, json, random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/characters/nico-lowpoly-v1';TMP=ROOT/'out/nico'
OUT.mkdir(parents=True,exist_ok=True);TMP.mkdir(parents=True,exist_ok=True)
HEAD_ONLY='--head-only' in sys.argv
TAU=math.pi*2
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
    if c.name!='Collection' and c.users==0:bpy.data.collections.remove(c)
geo=bpy.data.collections.new('NICO • editable geometry');bpy.context.scene.collection.children.link(geo)
studio=bpy.data.collections.new('REVIEW • cameras and neutral lights');bpy.context.scene.collection.children.link(studio)
root=bpy.data.objects.new('Nico_ROOT • metres • +X is anatomical left',None);geo.objects.link(root)
root['character']='Nico, 34, Filipino';root['pose']='Symmetrical T-pose; palms down; no armature'
root['front']='-Y';root['left']='+X';root['design']='Faithful simplified interpretation of supplied original turnaround'

def mat(name,color,texture=None,rough=.82):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough
    if 'Specular IOR Level' in bs.inputs:bs.inputs['Specular IOR Level'].default_value=.25
    if texture:
        im=bpy.data.images.load(str(OUT/'textures'/texture),check_existing=True);im.pack()
        tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;tex.interpolation='Linear';m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    return m
skin=mat('Skin • warm tan • painted stubble and tired eyes',(.392,.191,.086),'Nico_Skin.png')
skinplain=mat('Skin • ears and hands',(.392,.191,.086))
skindark=mat('Skin • eyelid plane',(.290,.143,.070))
lip=mat('Mouth • muted brown',(.130,.064,.032))
earinner=mat('Ear • concha',(.260,.120,.052))
hair=mat('Hair • painted charcoal black',(.010,.0095,.010),'Nico_Hair.png')
hairlight=mat('Hair • shallow facet tone',(.014,.014,.015))
frame=mat('Glasses • matte black',(.009,.012,.012),rough=.60)
white=mat('Eyes • muted warm sclera',(.64,.58,.44))
iris=mat('Eyes • dark brown',(.049,.031,.019))
pupil=mat('Eyes • pupil',(.008,.009,.009))
shirt=mat('Shirt • faded dark teal',(.027,.063,.060))
shirt2=mat('Shirt • restrained fold plane',(.024,.057,.054))
collarmat=mat('Shirt • rib collar and cuff',(.016,.036,.034))
denim=mat('Jeans • painted charcoal denim',(.024,.027,.034),'Nico_Denim.png')
shoes=mat('Sneakers • gray worn canvas and painted laces',(.130,.130,.122),'Nico_Shoes.png')
sole=mat('Sneakers • worn gray rubber',(.285,.276,.245))
watch=mat('Watch • cheap black resin',(.014,.017,.018),rough=.66)
lcd=mat('Watch • painted LCD',(.12,.17,.12),'Nico_Watch.png')

def mesh(name,verts,faces,materials,uv=None,mi=None):
    me=bpy.data.meshes.new(name+' mesh');me.from_pydata(verts,[],faces);me.update()
    ob=bpy.data.objects.new(name,me);geo.objects.link(ob);ob.parent=root
    for m in materials:me.materials.append(m)
    if uv:
        layer=me.uv_layers.new(name='UVMap')
        for poly in me.polygons:
            for li in poly.loop_indices:
                vi=me.loops[li].vertex_index;layer.data[li].uv=uv(me.vertices[vi].co,poly)
    if mi:
        for p in me.polygons:p.material_index=mi(p)
    bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=.000001)
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();me.update()
    for p in me.polygons:p.use_smooth=False
    return ob

def loft(name,rings,material,cap=True,uv=None):
    n=len(rings[0]);vs=[p for r in rings for p in r];fs=[]
    for j in range(len(rings)-1):
        for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    if cap:fs.extend([tuple(range(n-1,-1,-1)),tuple((len(rings)-1)*n+i for i in range(n))])
    return mesh(name,vs,fs,[material],uv)

def solid_patch(name,points,material,depth=.005,uv=None):
    vs=list(points)+[(x,y+depth,z) for x,y,z in points];n=len(points)
    fs=[tuple(range(n)),tuple(range(2*n-1,n-1,-1))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,vs,fs,[material],uv)

def tube(name,points,radius,material,sides=6,vertical=False):
    vs=[]
    for i,p in enumerate(points):
        tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)])
        tangent.normalize();guide=Vector((0,1,0)) if abs(tangent.y)<.92 else Vector((1,0,0))
        a=tangent.cross(guide).normalized();b=tangent.cross(a).normalized()
        for j in range(sides):vs.append(tuple(Vector(p)+radius*(a*math.cos(j*TAU/sides)+b*math.sin(j*TAU/sides))))
    fs=[]
    for i in range(len(points)-1):
        for j in range(sides):fs.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
    fs.extend([tuple(range(sides-1,-1,-1)),tuple((len(points)-1)*sides+j for j in range(sides))])
    return mesh(name,vs,fs,[material])

# Adult head: compact cranium, broad cheek planes, a jaw underside and a short
# recessed neck. The continuous rings include the neck rather than a cone glued on.
head_sections=[
 (1.433,.034,-.018,.047),(1.465,.034,-.016,.050),(1.492,.034,-.015,.052),
 (1.505,.039,-.048,.047),(1.519,.055,-.073,.057),(1.547,.068,-.083,.071),
 (1.579,.076,-.082,.079),(1.608,.078,-.080,.083),(1.638,.077,-.075,.085),
 (1.667,.076,-.065,.083),(1.686,.069,-.048,.073),(1.704,.055,-.023,.057),
 (1.718,.030,.009,.037),(1.723,.009,.019,.027)]
def section(z):
    if z<=head_sections[0][0]:return head_sections[0][1:]
    for a,b in zip(head_sections,head_sections[1:]):
        if a[0]<=z<=b[0]:
            t=(z-a[0])/(b[0]-a[0]);return tuple(a[i]+(b[i]-a[i])*t for i in range(1,4))
    return head_sections[-1][1:]
def face_y(x,z):
    rx,front,back=section(z);c=(front+back)/2;r=(back-front)/2
    y=c-r*math.sqrt(max(.02,1-(x/rx)**2))
    # Subtle eye-socket recession; cheek and brow stay readable planar surfaces.
    y+=.0028*math.exp(-((abs(x)-.036)/.022)**2-((z-1.632)/.017)**2)
    return y
N=32;rings=[]
for z,rx,front,back in head_sections:
    c=(front+back)/2;r=(back-front)/2;row=[]
    for i in range(N):
        a=-math.pi+i*TAU/N;x=rx*math.sin(a);y=c-r*math.cos(a)
        if abs(a)<math.pi/2:y=face_y(x,z)
        row.append((x,y,z))
    rings.append(row)
def head_uv(co,p):
    x,y,z=co;rx,front,back=section(z);a=math.atan2(x/max(rx,.001),-(y-(front+back)/2)/max((back-front)/2,.001))
    return (.5+a/TAU,(z-1.43)/.335)
head=loft('Nico_Skin_HeadAndNeck',rings,skin,uv=head_uv)
# Keep an untextured face form; small features are solid seated geometry.
nose=[(-.008,-.068,1.645),(.008,-.068,1.645),(-.007,-.091,1.635),(.007,-.091,1.635),(-.017,-.077,1.596),(.017,-.077,1.596),(-.0095,-.105,1.602),(.0095,-.105,1.602),(0,-.097,1.591)]
mesh('Nico_Nose • bridge, tip and alar planes',nose,[(0,1,3,2),(2,3,7,6),(0,2,4),(1,5,3),(4,2,6,8),(3,5,8,7),(6,7,8),(4,8,5),(0,4,5,1)],[skinplain])
for s in [-1,1]:
    side='L' if s==1 else 'R'
    # Ear silhouette has an attached root, helix rim and a shallow concha.
    er=[]
    for k,(sc,xx) in enumerate([(1.0,.076),(.90,.090),(.55,.096)]):
        er.append([(s*(xx+.004*math.sin(a)),.008+math.cos(a)*.018*sc,1.609+math.sin(a)*.031*sc) for a in [i*TAU/10 for i in range(10)]])
    loft('Nico_Ear.'+side,er,skinplain)
    pts=[(s*.097,.010+math.cos(a)*.009,1.610+math.sin(a)*.018) for a in [i*TAU/8 for i in range(8)]]
    # Surface is on the outside of the ear, extrusion remains inside its rim.
    vv=pts+[(x-s*.0008,y,z) for x,y,z in pts];nn=len(pts)
    mesh('Nico_EarConcha.'+side,vv,[tuple(range(nn)),tuple(range(nn*2-1,nn-1,-1))]+[(i,(i+1)%nn,(i+1)%nn+nn,i+nn) for i in range(nn)],[earinner])
    # Eyes follow the actual face surface; eyelids narrow the sclera from above.
    def ep(x,z,offset=.0018):return (s*x,face_y(s*x,z)-offset,z)
    eyepts=[ep(.012,1.626),ep(.018,1.631),ep(.044,1.632),ep(.061,1.629),ep(.054,1.621),ep(.025,1.620)]
    solid_patch('Nico_EyeSclera.'+side,eyepts,white)
    pts=[ep(.036+math.cos(a)*.0063,min(1.632,1.628+math.sin(a)*.007),.0025) for a in [i*TAU/12 for i in range(12)]]
    solid_patch('Nico_Iris.'+side,pts,iris)
    pts=[ep(.036+math.cos(a)*.0035,min(1.632,1.628+math.sin(a)*.005),.0030) for a in [i*TAU/10 for i in range(10)]]
    solid_patch('Nico_Pupil.'+side,pts,pupil)
    pts=[ep(.010,1.641,.0035),ep(.061,1.641,.0035),ep(.063,1.631,.0035),ep(.049,1.633,.0035),ep(.022,1.632,.0035),ep(.012,1.629,.0035)]
    solid_patch('Nico_HeavyUpperLid.'+side,pts,skinplain)
    tube('Nico_LidCrease.'+side,[ep(.014,1.631,.0042),ep(.025,1.633,.0042),ep(.047,1.634,.0042),ep(.060,1.631,.0042)],.00065,skindark,4)
    pts=[ep(.012,1.655,.003),ep(.048,1.658,.003),ep(.064,1.653,.003),ep(.063,1.648,.003),ep(.047,1.652,.003),ep(.012,1.649,.003)]
    solid_patch('Nico_StraightBrow.'+side,pts,hair,depth=.005,uv=lambda co,p:(co.x*9+.5,co.z*9%1))
    # True 3D rectangular frame: front rim, inner rim and depth form one solid ring.
    local=[(.009,1.643),(.014,1.647),(.060,1.646),(.068,1.641),(.068,1.620),(.062,1.615),(.015,1.615),(.009,1.620)]
    cx=.0385;cz=1.631;vv=[]
    for depth in [0,.0028]:
        for inner in [False,True]:
            for x,z in local:
                if inner:x=cx+(x-cx)*.878;z=cz+(z-cz)*.81
                vv.append((s*x,face_y(s*x,z)-.0125+depth,z))
    ff=[]
    for i in range(8):
        j=(i+1)%8;ff.extend([(i,j,8+j,8+i),(16+i,24+i,24+j,16+j),(i,16+i,16+j,j),(8+i,8+j,24+j,24+i)])
    mesh('Nico_Glasses_Rim.'+side,vv,ff,[frame])
    tube('Nico_Glasses_Temple.'+side,[(s*.066,face_y(s*.066,1.638)-.011,1.638),(s*.080,-.023,1.636),(s*.083,.019,1.633),(s*.082,.034,1.619)],.0019,frame,6)
    tube('Nico_Nostril.'+side,[(s*.006,-.0995,1.594),(s*.013,-.089,1.596)],.0008,lip,4)
tube('Nico_Glasses_Bridge',[(-.009,face_y(-.009,1.636)-.0125,1.636),(-.005,-.092,1.639),(.005,-.092,1.639),(.009,face_y(.009,1.636)-.0125,1.636)],.0018,frame,6)
mouth=[]
for x,z in [(-.025,1.552),(-.014,1.555),(0,1.556),(.014,1.555),(.025,1.552)]:mouth.append((x,face_y(x,z)-.0013,z))
tube('Nico_QuietMouth',mouth,.00085,lip,5)

# Hair mass is a closed scalp-following volume. Broad ridges grow continuously
# out of it, with a small crown displacement rather than a free-standing fin.
def hair_boundary(a):
    c=math.cos(a);z=1.615+.064*max(c,0)**1.5+.015*max(0,1-abs(c))
    if c>.25:z+=.0030*math.sin(a*11+.4)+.0022*math.sin(a*5)
    # A modest temple/sideburn shape in the front of the ear.
    z-=.014*math.exp(-((abs(a)-1.20)/.12)**2)
    return z
HAIR_LOCKS=[(-.65,-.33,.79,.04,.28,.008),(-.12,.25,.74,.025,.28,.007),(.40,.72,.72,.05,.29,.008),(.95,1.28,.70,.09,.28,.006),(-1.12,-.87,.67,.08,.30,.006),(2.05,2.35,.71,.17,.34,.005),(-2.40,-2.10,.71,.19,.34,.005)]
def hpoint(t,a,offset=0):
    # Broad directional clumps are sculpted into the SAME manifold scalp.
    # Roots/tips taper into the base: no detached ribbons or overlapping cards.
    relief=0
    for a0,a1,t0,t1,width,height in HAIR_LOCKS:
        s=(t0-t)/(t0-t1)
        if 0<s<1:
            center=a0+(a1-a0)*s;wid=width*(.70+.30*math.sin(math.pi*s))*(1-.50*s)
            distance=abs(math.atan2(math.sin(a-center),math.cos(a-center)))
            w=max(0,1-distance/wid)
            relief+=height*math.sin(math.pi*s)**.8*w
    offset+=min(.011,relief)
    phi=math.acos(max(-1,min(1,(hair_boundary(a)-1.647)/.095)))*(1-t)
    sweep=a+.13*t
    lobes=.0019*math.cos(a*7+t*1.8)*math.sin(phi)
    r=1+lobes/.086
    x=(.083+offset)*math.sin(phi)*math.sin(sweep)*r
    y=.010-(.089+offset)*math.sin(phi)*math.cos(sweep)*r
    z=1.647+(.095+offset)*math.cos(phi)
    w=math.exp(-((t-.84)/.16)**2-((a+.73)/.40)**2)
    x-=.011*w;z+=.010*w;y-=.003*w
    return (x,y,z)
HN=48;ts=[0,.08,.18,.30,.43,.56,.68,.78,.87,.94,.98]
hv=[hpoint(t,-math.pi+i*TAU/HN) for t in ts for i in range(HN)];hf=[]
for j in range(len(ts)-1):
    for i in range(HN):
        k=j*HN+i;l=j*HN+(i+1)%HN
        # Alternating diagonals only on some wider upper planes.
        if j>3 and i%4==0:hf.extend([(k,l,l+HN),(k,l+HN,k+HN)])
        else:hf.append((k,l,l+HN,k+HN))
top=len(hv);hv.append((0,.010,1.742))
for i in range(HN):hf.append(((len(ts)-1)*HN+i,(len(ts)-1)*HN+(i+1)%HN,top))
inner=len(hv)
for i in range(HN):
    x,y,z=hpoint(0,-math.pi+i*TAU/HN);hv.append((x*.96,.01+(y-.01)*.96,z+.002))
for i in range(HN):hf.append((i,inner+i,inner+(i+1)%HN,(i+1)%HN))
hf.append(tuple(inner+i for i in range(HN)))
mesh('Nico_Hair_ScalpMass • integrated crown cowlick',hv,hf,[hair],uv=lambda co,p:((math.atan2(co.x,-(co.y-.01))+math.pi)/TAU,(co.z-1.60)/.19))

# HAIR_LOCKS is evaluated by hpoint; separate clump meshes are deliberately absent.

def build_shirt():
    # Torso rings and sleeve ports share vertices; no bulbous intersected spheres.
    rr=[(.898,.162,.106,.113),(.916,.164,.109,.112),(.982,.166,.130,.108),(1.070,.162,.136,.101),(1.177,.159,.115,.098),(1.285,.177,.105,.107),(1.355,.193,.104,.108),(1.441,.188,.090,.101),(1.452,.048,.038,.052)]
    n=16;vs=[];fs=[]
    for j,(z,rx,front,back) in enumerate(rr):
        for i in range(n):
            a=i*TAU/n;c=math.cos(a);y=-front*c if c>=0 else -back*c
            zz=z-(.008*max(c,0) if j==8 else 0)+(.017*abs(math.sin(a)) if j==7 else 0)
            vs.append((rx*math.sin(a),y,zz))
    for j in range(len(rr)-1):
        for i in range(n):
            if j in [5,6] and i in [3,4,11,12]:continue
            fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    for s in [-1,1]:
        if s==1:port=[5*n+3,5*n+4,5*n+5,6*n+5,7*n+5,7*n+4,7*n+3,6*n+3]
        else:port=[5*n+13,5*n+12,5*n+11,6*n+11,7*n+11,7*n+12,7*n+13,6*n+13]
        loops=[port]
        for xx,ry,rz in [(.248,.067,.065),(.294,.061,.061),(.304,.060,.060)]:
            inds=[]
            for k in range(8):
                a=-math.pi/4-k*TAU/8;inds.append(len(vs));vs.append((s*xx,ry*math.cos(a),1.391+rz*math.sin(a)))
            # Port starts at front lower quadrant; compute correspondence geometrically.
            if not loops[1:]:
                # Match the ring order to port Y/Z order, avoiding a twisted sleeve.
                orig=inds[:];best=None
                for rev in [False,True]:
                    seq=orig[::-1] if rev else orig
                    for off in range(8):
                        trial=seq[off:]+seq[:off];cost=sum((vs[a][1]-vs[b][1])**2+(vs[a][2]-vs[b][2])**2 for a,b in zip(port,trial))
                        if best is None or cost<best[0]:best=(cost,trial)
                inds=best[1];ring_order=[orig.index(k) for k in inds]
            else:inds=[inds[k] for k in ring_order]
            loops.append(inds)
        for a,b in zip(loops,loops[1:]):
            for i in range(8):fs.append((a[i],a[(i+1)%8],b[(i+1)%8],b[i]))
        # Closed cuff thickness, with a visible interior but no open mesh boundary.
        last=loops[-1];inside=[]
        for idx in last:
            x,y,z=vs[idx];inside.append(len(vs));vs.append((x-s*.0015,y*.94,1.391+(z-1.391)*.94))
        for i in range(8):fs.append((last[i],inside[i],inside[(i+1)%8],last[(i+1)%8]))
        fs.append(tuple(reversed(inside)))
    fs.append(tuple(range(n-1,-1,-1)))
    # Collar folds inward and down onto the neck, roots seated beneath its opening.
    outer=[8*n+i for i in range(n)];inn=[]
    for i in range(n):
        a=i*TAU/n;inn.append(len(vs));vs.append((.0352*math.sin(a),.013-.0365*math.cos(a),1.452-.008*max(math.cos(a),0)))
    for i in range(n):fs.append((outer[i],inn[i],inn[(i+1)%n],outer[(i+1)%n]))
    fs.append(tuple(inn))
    return mesh('Nico_TShirt • joined torso and sleeve topology',vs,fs,[shirt,shirt2,collarmat],mi=lambda p:2 if p.index>=len(fs)-18 else (1 if p.index%23==7 else 0))

def build_arm_hand(s):
    side='L' if s==1 else 'R';vs=[];fs=[]
    us=[-1,-.94,-.55,-.47,-.08,0,.39,.47,.86,1]
    def ring(x,ry,rz,hand=False):
        ids=[]
        for top in [True,False]:
            for u in us:
                ids.append(len(vs));h=(.70+.30*math.sqrt(max(0,1-u*u))) if hand else math.sqrt(max(.025,1-(u*.985)**2))
                vs.append((s*x,ry*u,1.391+(1 if top else -1)*rz*h))
        return ids
    loops=[]
    for x,ry,rz in [(.241,.043,.047),(.304,.042,.043),(.376,.039,.039),(.462,.034,.034),(.490,.0345,.033),(.513,.032,.032),(.602,.028,.027),(.676,.023,.021),(.699,.022,.018)]:
        loops.append(ring(x,ry,rz,hand=x==.699))
    def around(q):return q[:10]+q[10:][::-1]
    for a,b in zip(loops,loops[1:]):
        a=around(a);b=around(b)
        for i in range(20):fs.append((a[i],a[(i+1)%20],b[(i+1)%20],b[i]))
    fs.append(tuple(reversed(around(loops[0]))))
    palms=[loops[-1]]
    for x,ry,rz in [(.722,.029,.018),(.754,.035,.017),(.790,.035,.015),(.799,.034,.013)]:palms.append(ring(x,ry,rz,True))
    for j,(a,b) in enumerate(zip(palms,palms[1:])):
        for k in range(9):
            fs.extend([(a[k],a[k+1],b[k+1],b[k]),(a[k+10],b[k+10],b[k+11],a[k+11])])
        # One side port branches into the thumb between wrist and knuckles.
        if j!=1:fs.append((a[0],b[0],b[10],a[10]))
        fs.append((a[9],a[19],b[19],b[9]))
    tip=palms[-1];ports=[1,3,5,7]
    for k in range(9):
        if k not in ports:fs.append((tip[k],tip[k+10],tip[k+11],tip[k+1]))
    def finger(rootids,centers,radii):
        old=rootids
        for j,(center,(ry,rz)) in enumerate(zip(centers,radii)):
            inds=[]
            for yy,zz in [(-.7,1),(.7,1),(1,.7),(1,-.7),(.7,-1),(-.7,-1),(-1,-.7),(-1,.7)]:
                inds.append(len(vs));vs.append((s*center[0],center[1]+yy*ry,center[2]+zz*rz))
            if len(old)==4:
                for k in range(4):
                    fs.append((old[k],old[(k+1)%4],inds[(2*k+1)%8],inds[(2*k)%8]))
                    fs.append((old[k],inds[(2*k)%8],inds[(2*k-1)%8]))
            else:
                for k in range(8):fs.append((old[k],old[(k+1)%8],inds[(k+1)%8],inds[k]))
            old=inds
        fs.append(tuple(old))
    for j,k in enumerate(ports):
        ids=[tip[k],tip[k+1],tip[k+11],tip[k+10]];cy=sum(vs[i][1] for i in ids)/4
        length=[.071,.079,.073,.056][j];r=[.0082,.0088,.0082,.0073][j]
        centers=[(.811,cy,1.389),(.799+length*.48,cy+(j-1.5)*.001,1.387),(.799+length*.74,cy+(j-1.5)*.002,1.386),(.799+length,cy+(j-1.5)*.003,1.384)]
        finger(ids,centers,[(r,.010),(r*.94,.0093),(r*.85,.0085),(r*.60,.0062)])
    # Thumb has a broad web, a metacarpal turn and a short distal tip.
    a,b=palms[1],palms[2];ids=[a[0],b[0],b[10],a[10]]
    old=ids
    for j,(x,y,z,rr) in enumerate([(.748,-.042,1.388,.012),(.770,-.059,1.382,.011),(.793,-.069,1.380,.009),(.810,-.072,1.379,.0065)]):
        # Perpendicular horizontal basis points mostly along X.
        uu=Vector((.78,.62,0));vv=Vector((0,0,1));inds=[]
        for k in range(4):
            a0=math.pi/4-k*TAU/4;p=Vector((x,y,z))+rr*(uu*math.cos(a0)+vv*math.sin(a0));p.x*=s;inds.append(len(vs));vs.append(tuple(p))
        # Match the first thumb cross-section to the web's physical ordering.
        if j==0:
            best=None
            for rev in [False,True]:
                seq=inds[::-1] if rev else inds
                for off in range(4):
                    q=seq[off:]+seq[:off];cost=sum((Vector(vs[a])-Vector(vs[b])).length_squared for a,b in zip(old,q))
                    if best is None or cost<best[0]:best=(cost,q)
            order=[inds.index(i) for i in best[1]];inds=best[1]
        else:inds=[inds[i] for i in order]
        for k in range(4):fs.append((old[k],old[(k+1)%4],inds[(k+1)%4],inds[k]))
        old=inds
    fs.append(tuple(old))
    return mesh('Nico_ArmAndFiveFingerHand.'+side,vs,fs,[skinplain])

def build_jeans():
    vs=[];fs=[]
    rows=[(.105,.061,.126,.047),(.153,.059,.130,.051),(.315,.055,.139,.063),(.455,.049,.147,.067),(.492,.048,.149,.066),(.529,.044,.150,.071),(.679,.029,.159,.081),(.784,0,.168,.093),(.858,0,.166,.104),(.940,0,.156,.097)]
    uu=[0,.24,.52,.79,1];halves={}
    for s in [-1,1]:
        ff=[];bb=[]
        for j,(z,inner,outer,depth) in enumerate(rows):
            fr=[];ba=[]
            for u in uu:
                x=s*(inner+(outer-inner)*u)
                if j<8:shape=math.sin(math.pi*u)
                else:shape=math.cos(math.pi*u/2)
                fr.append(len(vs));vs.append((x,-depth*shape,z))
                ba.append(len(vs));vs.append((x,depth*shape*.97+.008*shape,z))
            ff.append(fr);bb.append(ba)
        for j in range(len(rows)-1):
            for k in range(4):
                # Deliberate broad knee/upper-thigh diagonals retain readable facets.
                for arr in [ff,bb]:
                    a,b,c,d=arr[j][k],arr[j][k+1],arr[j+1][k+1],arr[j+1][k]
                    if j in [2,5] and k==2:fs.extend([(a,b,c),(a,c,d)])
                    else:fs.append((a,b,c,d))
        bottom=ff[0]+bb[0][::-1];fs.append(tuple(bottom))
        halves[s]=(ff,bb)
    # Above the crotch the two halves weld along front/back center. Below it
    # they close along each inseam; at the crotch they meet in one shared vertex.
    top=halves[-1][0][-1][::-1]+halves[1][0][-1]+halves[1][1][-1][::-1]+halves[-1][1][-1]
    fs.append(tuple(top))
    def uv(co,p):
        # Face half is derived from polygon center so shared side vertices wrap.
        yy=sum(vs[i][1] for i in p.vertices)/len(p.vertices)
        return ((.5 if yy>0 else 0)+(co.x+.19)/.38*.5,co.z/.96)
    return mesh('Nico_Jeans • continuous pelvis, crotch and joint loops',vs,fs,[denim],uv)

def build_shoe(s):
    side='L' if s==1 else 'R';cx=s*.094
    outline=[(-.036,.063),(-.047,.005),(-.047,-.093),(-.036,-.153),(-.018,-.172),(.019,-.172),(.041,-.153),(.049,-.075),(.046,.014),(.035,.063)]
    rings=[]
    for z,sc in [(0,.98),(.009,1.03),(.026,1.02)]:rings.append([(cx+s*x*sc,y,z) for x,y in outline])
    loft('Nico_SneakerSole.'+side,rings,sole)
    # Cross-sections run along the shoe, rather than one flat toe-to-ankle
    # roof. A broad low toe box and rounded side shoulder distinguish sneakers
    # from the first wedge-shaped upper while retaining deliberate facets.
    rows=[]
    cross=[(-1,0),(1,0),(1,.20),(.96,.60),(.67,.92),(0,1),(-.67,.92),(-.96,.60),(-1,.20)]
    for y,width,top in [(-.172,.017,.044),(-.162,.034,.057),(-.137,.044,.065),(-.095,.046,.069),(-.050,.045,.084),(-.005,.044,.115),(.035,.040,.106),(.054,.037,.088),(.063,.034,.078)]:
        rows.append([(cx+s*width*xx,y,.025+(top-.025)*zz) for xx,zz in cross])
    loft('Nico_SneakerUpper.'+side,rows,shoes,uv=lambda co,p:(((co.x-cx)*s+.055)/.11,(co.y+.19)/.28))

def cube(name,loc,scale,material,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);ob=bpy.context.object;ob.name=name
    for c in list(ob.users_collection):c.objects.unlink(ob)
    geo.objects.link(ob);ob.parent=root;ob.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);ob.data.materials.append(material)
    if bevel:
        mod=ob.modifiers.new('Constructed edge chamfer','BEVEL');mod.width=bevel;mod.segments=1
        bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in ob.data.polygons:p.use_smooth=False
    return ob
def build_watch():
    n=16;vs=[];fs=[]
    for xx,inside in [(.660,False),(.692,False),(.660,True),(.692,True)]:
        for i in range(n):
            a=i*TAU/n;vs.append((xx,math.cos(a)*(.027 if not inside else .0245),1.391+math.sin(a)*(.025 if not inside else .0225)))
    for i in range(n):
        j=(i+1)%n;fs.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
    mesh('Nico_Watch.L • closed resin band',vs,fs,[watch])
    cube('Nico_Watch.L • beveled digital case',(.676,-.001,1.420),(.036,.041,.012),watch,.003)
    # Basic opaque LCD, not transmission: survives older glTF importers.
    pts=[(.663,-.014,1.4262),(.689,-.014,1.4262),(.689,.011,1.4262),(.663,.011,1.4262)]
    pts+= [(x,y,z-.0006) for x,y,z in pts]
    ob=mesh('Nico_Watch.L • embedded LCD',pts,[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],[lcd],uv=lambda co,p:((co.x-.663)/.026,(co.y+.014)/.025))
    for y in [-.014,.012]:cube('Nico_Watch.L • side button',(.695,y,1.419),(.003,.006,.004),watch,.0005)

if not HEAD_ONLY:
    build_shirt();build_arm_hand(-1);build_arm_hand(1);build_jeans();build_shoe(-1);build_shoe(1);build_watch()

# Neutral studio, separate from the selectable/exportable character collection.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=False
scene.unit_settings.system='METRIC';scene.unit_settings.length_unit='METERS';scene.unit_settings.scale_length=1.0
scene.world.color=(.22,.22,.22);scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.22,.235,.25,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast' if 'Medium High Contrast' in [x.name for x in scene.view_settings.bl_rna.properties['look'].enum_items] else 'None'
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.render.resolution_percentage=100
def light(name,loc,power,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    ob=bpy.data.objects.new(name,data);studio.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((0,0,1.05))-ob.location).to_track_quat('-Z','Y').to_euler()
light('Key • neutral broadbox',(-3,-4,5),420,3)
light('Fill • neutral', (3,-2,3),155,3)
light('Rim • side facet read',(1,3,4),300,2)
if not HEAD_ONLY:
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.0004));floor=bpy.context.object;floor.name='REVIEW • ground, excluded from GLB'
    for c in list(floor.users_collection):c.objects.unlink(floor)
    studio.objects.link(floor);floor.data.materials.append(mat('REVIEW • neutral ground',(.19,.20,.21)))
camera_data=bpy.data.cameras.new('Nico_ReviewCamera');cam=bpy.data.objects.new('Nico_ReviewCamera',camera_data);studio.objects.link(cam);scene.camera=cam;camera_data.type='ORTHO';camera_data.lens=65
def render(name,location,target,scale,w,h):
    cam.location=location;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();camera_data.ortho_scale=scale
    scene.render.resolution_x=w;scene.render.resolution_y=h;scene.render.filepath=str(OUT/'review'/name);bpy.ops.render.render(write_still=True)
if HEAD_ONLY:
    # Texture-free neutral material checkpoint; retain separate neutral values
    # so hair geometry/glasses can be read without relying on painted details.
    clay=mat('CHECK • untextured clay',(.43,.43,.43));hc=mat('CHECK • untextured hair clay',(.14,.14,.14));gc=mat('CHECK • glasses gray',(.045,.045,.045))
    for ob in geo.objects:
        if ob.type!='MESH':continue
        ob.data.materials.clear();ob.data.materials.append(hc if 'Hair' in ob.name or 'Brow' in ob.name else gc if 'Glasses' in ob.name else clay)
        for p in ob.data.polygons:p.material_index=0
    render('clay-head-front.png',(0,-3,1.62),(0,0,1.62),.395,720,800)
    render('clay-head-profile.png',(3,0,1.62),(0,0,1.62),.395,720,800)
    render('clay-head-three-quarter.png',(2,-3,2.09),(0,0,1.62),.395,720,800)
    bpy.ops.wm.save_as_mainfile(filepath=str(TMP/'Nico_Head_Checkpoint.blend'))
else:
    # Pack maps and save an editable scene before export.
    bpy.ops.file.pack_all()
    for ob in bpy.context.selected_objects:ob.select_set(False)
    root.select_set(True)
    for ob in geo.objects:
        if ob.type=='MESH':ob.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Nico_LowPoly.blend'))
    bpy.ops.export_scene.gltf(filepath=str(OUT/'Nico_LowPoly.glb'),export_format='GLB',use_selection=True,export_materials='EXPORT',export_animations=False,export_yup=True,export_normals=True,export_texcoords=True)
    if '--body-only-render' in sys.argv:
        render('shoes-detail.png',(.8,-1.7,.9),(0,-.04,.07),.420,900,700)
    # Matching orthographic camera scale throughout the four body angles.
    render('body-front.png',(0,-4,1.00),(0,0,.875),2.12,1280,1160)
    render('body-profile.png',(4,0,1.00),(0,0,.875),2.12,1280,1160)
    render('body-back.png',(0,4,1.00),(0,0,.875),2.12,1280,1160)
    render('body-three-quarter.png',(3,-5,1.40),(0,0,.875),2.12,1280,1160)
    if '--body-only-render' not in sys.argv:
        render('head-three-quarter.png',(2,-3,2.06),(0,0,1.620),.390,1000,1080)
        render('head-back-elevated.png',(-2,3,2.55),(0,0,1.655),.350,800,850)
        render('hand-left.png',(1.55,-1.3,3.1),(.77,-.005,1.391),.285,850,750)
    if '--body-only-render' not in sys.argv:
        render('shoes-detail.png',(.8,-1.7,.9),(0,-.04,.07),.420,900,700)
    # Save the final viewport with full-body 3/4 camera, never a hidden clay override.
    cam.location=(3,-5,1.40);cam.rotation_euler=(Vector((0,0,.875))-cam.location).to_track_quat('-Z','Y').to_euler();camera_data.ortho_scale=2.12
    scene.render.resolution_x=1280;scene.render.resolution_y=1160
    for ob in studio.objects:ob.hide_set(True)
    for ob in bpy.context.selected_objects:ob.select_set(False)
    root.select_set(True);bpy.context.view_layer.objects.active=root
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                space=area.spaces.active;space.shading.type='SOLID';space.shading.color_type='MATERIAL'
                space.region_3d.view_location=Vector((0,0,.88));space.region_3d.view_distance=2.65
                space.region_3d.view_rotation=cam.rotation_euler.to_quaternion();space.region_3d.view_perspective='ORTHO'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Nico_LowPoly.blend'))
print('Nico build complete in Blender',bpy.app.version_string)
