"""UV-only retarget; source vertices, normals, triangles and transforms unchanged."""
import bpy,json,math,sys,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];O=R/'assets/characters/psx-texture-retarget-v1';TMP=R/'out/psx-retarget'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(O/'source/scene.gltf'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH');me=obj.data
src=json.loads((TMP/'mesh.json').read_text());groups=json.loads((TMP/'islands.json').read_text());group={i:k for k,ids in enumerate(groups) for i in ids}
old=me.uv_layers.active;old.name='Original_UV';uv=me.uv_layers.new(name='Attached_Atlas_UV');me.uv_layers.active=uv;uv.active_render=True
# Piecewise scalar interpolation, avoiding external Blender dependencies.
def interp(x,xs,ys):
 if x<=xs[0]:return ys[0]
 for i in range(1,len(xs)):
  if x<=xs[i]:return ys[i-1]+(ys[i]-ys[i-1])*(x-xs[i-1])/(xs[i]-xs[i-1])
 return ys[-1]
def clamp(x,a,b):return min(b,max(a,x))
# Half-head landmarks, pixel positions on exact target atlas. Mirrored source UV
# is expanded to distinct left/right atlas areas. Source height = -local Y.
head={74:(501,310),75:(344,375),76:(431,350),77:(344,346),78:(402,320),79:(344,308),80:(344,270),81:(344,114),82:(344,89),83:(376,131),84:(405,94),85:(526,148),86:(517,221),87:(474,170),88:(469,139),89:(388,165),90:(414,141),91:(344,208),92:(386,214),93:(344,229),94:(420,248),95:(344,253),96:(488,265),97:(455,220),98:(529,287),99:(555,225),100:(498,27),101:(422,49),102:(344,8),103:(537,71),104:(344,49),105:(605,242),106:(586,238),107:(627,170),108:(555,164),109:(600,168),110:(654,247),111:(586,291),112:(660,304),113:(590,83),114:(667,132),115:(653,56),116:(571,17),360:(488,110),361:(384,189),362:(344,179),363:(344,146),364:(462,121),365:(423,123),366:(681,270),367:(681,337),368:(681,150),369:(670,46),370:(344,3)}
# map duplicate symmetric indices to original half by coordinates
base={tuple(round(c,4) for c in me.vertices[i].co):i for i in head}
regions={}
for p in me.polygons:
 k=group[p.index];coords=[me.vertices[i].co for i in p.vertices];c=sum(coords,Vector())/len(coords);h=-c.y;front=c.z<.1
 region=''
 for li in p.loop_indices:
  vi=me.loops[li].vertex_index;v=me.vertices[vi].co;x,y,z=v;H=-y;X=abs(x)
  if k==1:
   region='head';key=tuple(round(q,4) for q in (-abs(x),y,z));idx=base.get(key)
   if idx is None:idx=base.get(tuple(round(q,4) for q in (x,y,z)))
   a,b=head[idx] if idx is not None else (344+X*110,interp(H,[39,45.2],[360,5]))
   # The replacement pixel atlas places the eyes/nose/mouth lower than the
   # superseded realistic atlas. Refit feature landmarks, tapering to the ears.
   if idx is not None:
    moved=interp(b,[0,49,70,89,94,110,114,123,131,139,141,146,165,179,189,208,214,229,248,253,270,308,320,346,375,394],[0,49,78,103,112,132,137,148,151,160,163,170,185,205,218,239,243,253,265,270,291,326,333,360,383,394])
    weight=clamp((570-a)/60,0,1);b=b*(1-weight)+moved*weight
   # Rear scalp separate chart. Boundary under hair follows geometric ears/nape.
   if c.z>-.1 and h>41.3:
    a=1005+x*92;b=interp(H,[40.3,41.3,42.8,44.6,45.13],[380,376,330,282,274])
   elif c.z>-.1:
    a=344+x*20;b=interp(H,[39,40.5,41.4],[385,374,369])
   elif x<0:a=688-a
  elif k==6:
   region='neck';a=clamp(344+x*33,262,426);b=interp(H,[37,38.5,39.23,40.5],[392,387,381,374])
  elif k in [2,3]:
   region='hands';# palm down A-pose, top/back of hand toward front camera.
   # Longitudinal hand axis from wrist to fingertips, contour-fitted hand atlas.
   t=clamp((25.1-H)/4.1,0,1);a=1027+(z+.95)*12;b=708+t*78
   # put thumb to the outer side of the painted hand instead of across fingers
   if X<13.35 and H<24.2:a=1013+(24.2-H)*5;b=741+(24.2-H)*16
  elif k in [4,5]:
   # Shoulder-to-wrist metric; first two ring bands become a short sleeve.
   L=(X-5.2)*.63+(35-H)*.77
   if (abs(c.x)-5.2)*.63+(35-h)*.77<4.2:
    region='sleeves';a=840+z*30;b=interp(L,[-1,0,4.8],[421,440,538])
   else:
    region='arms';a=1030+(z+.5)*13;b=interp(L,[3,5,12.3],[425,442,663])
  elif k in [7,8,9,10]:
   region='shoes';
   if k in [9,10]:a=1054+(x-(3.55 if x>0 else -3.55))*22;b=1060-z*45
   else:
    # top and side panels use same shoe, heel at top, toe at bottom
    b=interp(z,[-3.6,-.3,1.7,3.6],[1190,1078,1000,945]);a=787+(X-3.55)*28
    if c.z<-2.5 and abs(p.normal.z)>.5:
     b=interp(H,[.09,1.9],[1214,1175]);a=787+(X-3.55)*31
    elif abs(p.normal.x)>.5:
     half=interp(b,[945,1000,1078,1190],[31,45,54,39]);a=787+(1 if X>3.55 else -1)*(half-16+clamp(H,0,2.4)*5)
    elif c.z>2.6 and abs(p.normal.z)>.5:
     b=interp(H,[.09,2.0],[983,932]);a=787+(X-3.55)*23
  elif k==0:
   # Source jacket hem has a separate lower ring down to H=22.6.
   if h>23.15:
    region='shirt-front' if front else 'shirt-back'
    b=interp(H,[22.5,25,30,33,35,36.5,38.6],[702,669,568,508,467,433,418]);width=interp(b,[418,440,478,520,700],[74,126,167,150,158]);radius=interp(H,[22,27,32,35,38.6],[5.15,4.9,5.04,5.45,2.35]);a=(193 if front else 552)+x/radius*width
    # Back uses its own shirt chart and reversed x to show a physically coherent back.
    if not front:a=552-x/radius*width
   else:
    region='jeans-front' if front else 'jeans-back';b=interp(H,[1.9,4,11.8,15.2,19.6,23.2],[1222,1186,994,918,811,742]);
    # Fit each trouser leg to its changing width. Crotch is near H=19.6.
    if H>=19.6:
     a=(192 if front else 535)+(x if front else -x)/5.15*151
    else:
     center=interp(H,[1.9,4,12,19.6],[3.55,3.5,3.13,2.75]);rad=interp(H,[1.9,4,12,19.6],[1.52,1.4,1.9,2.32]);targetcenter=(104 if x<0 else 266) if front else (448 if x>0 else 613);a=targetcenter+(X-center)/rad*(65 if x>0 else -65)*(1 if front else -1)
   # Pants' inherited side seam meets front/back at a consistent local depth.
  else:raise RuntimeError(k)
  uv.data[li].uv=(clamp(a,1,1253)/1254,1-clamp(b,1,1253)/1254)
 regions[p.index]=region
# Actual material, not atlas repainted to fit old UVs.
mat=bpy.data.materials.new('Attached_Atlas_Unlit');mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');em=n.new('ShaderNodeEmission');tex=n.new('ShaderNodeTexImage');im=bpy.data.images.load(str(O/'Attached_Texture.png'));im.pack();tex.image=im;im.filepath='//Attached_Texture.png';tex.interpolation='Closest';uvnode=n.new('ShaderNodeUVMap');uvnode.uv_map='Attached_Atlas_UV';mat.node_tree.links.new(uvnode.outputs['UV'],tex.inputs['Vector']);mat.node_tree.links.new(tex.outputs['Color'],em.inputs['Color']);mat.node_tree.links.new(em.outputs[0],out.inputs['Surface']);me.materials.clear();me.materials.append(mat)
obj.name='PSX_Character_Retextured';obj['modification']='UV retarget only. Original positions, triangles, normals, A-pose preserved.'
obj['source_credit']='Jim Wing, 90s Survival Horror Protagonist (PSX Style), CC-BY-4.0';obj['texture_source']='User-supplied Drive atlas 1ILEojXpcWdaxXDZmyzi7Q-W1HK1cPInw'
(O/'UV_Regions.json').write_text(json.dumps({'face_regions':regions,'note':'polygon indices correspond to preserved source triangle order'},indent=2))
bpy.context.view_layer.objects.active=obj;bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
bpy.context.scene.unit_settings.system='METRIC'
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   sp=area.spaces.active;sp.shading.type='MATERIAL';sp.region_3d.view_location=(0,0,.95);sp.region_3d.view_distance=2.6;sp.region_3d.view_rotation=(Vector((3,-5,2))-Vector((0,0,.92))).to_track_quat('Z','Y');sp.clip_end=100
  elif area.type=='IMAGE_EDITOR':area.spaces.active.image=im
bpy.ops.wm.save_as_mainfile(filepath=str(O/'PSX_Retextured.blend'))
bpy.ops.export_scene.gltf(filepath=str(O/'PSX_Retextured.glb'),export_format='GLB',use_selection=True,export_yup=True,export_normals=True,export_texcoords=True,export_animations=False,export_materials='EXPORT')
# Persist target loop coordinates for editable UV diagram/validation.
(TMP/'target-uv.json').write_text(json.dumps([[list(uv.data[i].uv) for i in p.loop_indices] for p in me.polygons]))
# Review camera only; never saved/exported into delivered asset.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=False;scene.render.resolution_x=600;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.world=bpy.data.worlds.new('World');scene.world.color=(.22,.22,.22);scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
for name,pos,target,scale in [('front',(0,-4,.95),(0,0,.92),2.15),('back',(0,4,.95),(0,0,.92),2.15),('profile',(4,0,.95),(0,0,.92),2.15),('three-quarter',(3,-5,2),(0,0,.92),2.15),('head',(1.3,-3,1.75),(0,-.045,1.68),.36)]:
 bpy.ops.object.camera_add(location=pos);cam=bpy.context.object;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=scale;scene.camera=cam;scene.render.filepath=str(TMP/('retarget-'+name+'.png'));bpy.ops.render.render(write_still=True);bpy.data.objects.remove(cam,do_unlink=True)
