import bpy,json,hashlib,struct,math
import numpy as np
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];O=R/'assets/characters/psx-texture-retarget-v1';T=R/'out/psx-retarget'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
raw_geometry=[]
def geometry():
 global raw_geometry
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];tris=[];positions=[]
 for o in meshes:
  o.data.calc_loop_triangles()
  for v in o.data.vertices: positions.append(o.matrix_world@v.co)
  for t in o.data.loop_triangles:
   tris.append(sorted([tuple(float(z) for z in o.matrix_world@o.data.vertices[i].co) for i in t.vertices]))
 raw_geometry=np.array(tris)
 return {'meshes':len(meshes),'vertices':sum(len(o.data.vertices) for o in meshes),'triangles':len(tris),'triangle_geometry_sha256':hashlib.sha256(json.dumps(sorted([[tuple(round(z,6) for z in p) for p in tri] for tri in tris])).encode()).hexdigest(),'bounds':[[min(p[k] for p in positions),max(p[k] for p in positions)] for k in range(3)]}
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(O/'source/scene.gltf'));original=geometry();original_triangles=raw_geometry.copy()
bpy.ops.wm.open_mainfile(filepath=str(O/'PSX_Retextured.blend'));native=geometry();obj=next(o for o in bpy.context.scene.objects if o.type=='MESH');layers=[u.name for u in obj.data.uv_layers];packed=[{'name':im.name,'packed':bool(im.packed_file),'size':list(im.size)} for im in bpy.data.images if im.type=='IMAGE']
assert native['triangle_geometry_sha256']==original['triangle_geometry_sha256']
assert obj.data.uv_layers.active.name=='Attached_Atlas_UV'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(O/'PSX_Retextured.glb'));exported=geometry()
assert exported['triangles']==original['triangles']
# glTF bakes hierarchy coordinate conversions into float32. Compare spatially
# matched triangles with an explicit 1-micrometre tolerance, not exact hashes.
centers=original_triangles.mean(axis=1);used=[];max_error=0.
for tri in raw_geometry:
 idx=int(np.argmin(np.linalg.norm(centers-tri.mean(axis=0),axis=1)));used.append(idx)
 error=max(min(np.linalg.norm(a-b) for b in original_triangles[idx]) for a in tri);max_error=max(max_error,error)
assert len(set(used))==len(original_triangles)
assert max_error<1e-6,max_error
exported['max_position_error_metres']=max_error
exported['all_triangles_matched_one_to_one']=True
# Validate the actual image embedded in the GLB, not only the material filename.
raw=(O/'PSX_Retextured.glb').read_bytes();ln=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+ln]);binary=raw[28+ln:];imagechecks=[]
for im in g.get('images',[]):
 b=g['bufferViews'][im['bufferView']];data=binary[b.get('byteOffset',0):b.get('byteOffset',0)+b['byteLength']];h=hashlib.sha256(data).hexdigest();imagechecks.append({'name':im.get('name'),'sha256':h,'matches_supplied_atlas':h==digest(O/'Attached_Texture.png')})
assert imagechecks and all(x['matches_supplied_atlas'] for x in imagechecks)
assert all(s['magFilter']==9728 for s in g.get('samplers',[]))
report={'blender_tested':bpy.app.version_string,'blender_2_93_tested':False,'source':original,'native_reopened':native,'glb_reimported':exported,'native_uv_layers':layers,'native_images':packed,'glb_images':imagechecks,'geometry_preserved':True,'glb_texture_samplers':g.get('samplers',[]),'texture_filtering':'nearest','rigs':len([o for o in bpy.context.scene.objects if o.type=='ARMATURE']),'animations_in_source':False,'artistic_status':'Rendered and inspected; remaining shape/texture limitations documented in README. No user approval implied.','files':{p.name:digest(p) for p in [O/'PSX_Retextured.blend',O/'PSX_Retextured.glb',O/'Attached_Texture.png']}}
(O/'Verification.json').write_text(json.dumps(report,indent=2))
# Export-reimported review images. Matching cameras allow pixel comparison.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=False;scene.render.resolution_x=600;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.world=bpy.data.worlds.new('World');scene.world.color=(.22,.22,.22);scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
for name,pos,target,scale in [('front',(0,-4,.95),(0,0,.92),2.15),('three-quarter',(3,-5,2),(0,0,.92),2.15),('head',(1.3,-3,1.75),(0,-.045,1.68),.36)]:
 bpy.ops.object.camera_add(location=pos);c=bpy.context.object;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();c.data.type='ORTHO';c.data.ortho_scale=scale;scene.camera=c;scene.render.filepath=str(T/('glb-'+name+'.png'));bpy.ops.render.render(write_still=True);bpy.data.objects.remove(c,do_unlink=True)
print('VERIFICATION',json.dumps(report))
