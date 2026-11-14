import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/psx-retarget'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/characters/psx-texture-retarget-v1/source/scene.gltf'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH');me=obj.data
info={'name':obj.name,'matrix':[list(r) for r in obj.matrix_world],'vertices':[list(v.co) for v in me.vertices],'faces':[list(p.vertices) for p in me.polygons],'uv':[[list(me.uv_layers.active.data[i].uv) for i in p.loop_indices] for p in me.polygons]}
(OUT/'mesh.json').write_text(json.dumps(info))
print('MESH',obj.name,len(me.vertices),len(me.polygons),'BOUNDS',[(min(v.co[k] for v in me.vertices),max(v.co[k] for v in me.vertices)) for k in range(3)])
for o in list(bpy.context.scene.objects):
 if o.type=='MESH': print(o.name,'world bounds',[(min((o.matrix_world@v.co)[k] for v in o.data.vertices),max((o.matrix_world@v.co)[k] for v in o.data.vertices)) for k in range(3)])
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=False;scene.render.resolution_x=600;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('World');scene.world.color=(.22,.22,.22);scene.view_settings.view_transform='Standard'
def cam(pos,target,scale):
 bpy.ops.object.camera_add(location=pos);c=bpy.context.object;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();c.data.type='ORTHO';c.data.ortho_scale=scale;scene.camera=c;return c
for n,pos in [('front',(0,-4,.95)),('back',(0,4,.95)),('side',(4,0,.95)),('three',(3,-5,2))]:
 c=cam(pos,(0,0,.92),2.15);scene.render.filepath=str(OUT/('original-'+n+'.png'));bpy.ops.render.render(write_still=True);bpy.data.objects.remove(c,do_unlink=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'original.blend'))
