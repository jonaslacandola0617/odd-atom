"""Reopen the native asset, then import its actual GLB into an empty scene."""
import bpy,bmesh,json,math,struct,hashlib,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/characters/nico-lowpoly-v1'
sys.path.insert(0,str(Path(__file__).resolve().parent))
from import_nico_glb import weld_for_editing
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def collect(objects):
    obs=[o for o in objects if o.type=='MESH'];detail=[];total=0;allpts=[]
    for ob in obs:
        me=ob.data;me.calc_loop_triangles();total+=len(me.loop_triangles)
        bm=bmesh.new();bm.from_mesh(me)
        non=sum(not e.is_manifold for e in bm.edges);deg=sum(f.calc_area()<1e-12 for f in bm.faces);bm.free()
        world=[ob.matrix_world@v.co for v in me.vertices];allpts+=world
        detail.append({'object':ob.name,'vertices':len(me.vertices),'triangles':len(me.loop_triangles),'nonmanifold_edges':non,'zero_area_faces':deg,'flat_faces':sum(not p.use_smooth for p in me.polygons),'polygons':len(me.polygons),'materials':[m.name for m in me.materials if m]})
    return {'meshes':len(obs),'triangles':total,'bounds':{'min':[min(v[i] for v in allpts) for i in range(3)],'max':[max(v[i] for v in allpts) for i in range(3)]},'objects':detail}
bpy.ops.wm.open_mainfile(filepath=str(OUT/'Nico_LowPoly.blend'))
geo=bpy.data.collections['NICO • editable geometry'];native=collect(geo.objects)
native['packed_textures']=[{'image':im.name,'packed':bool(im.packed_file),'size':list(im.size)} for im in bpy.data.images if im.source=='FILE' and im.users>0]
native['armatures']=sum(o.type=='ARMATURE' for o in geo.objects)
native['modifiers']=[{'object':o.name,'type':m.type} for o in geo.objects for m in o.modifiers]
native['feet']={s:{'min_z':min((o.matrix_world@v.co).z for v in o.data.vertices),'max_z':max((o.matrix_world@v.co).z for v in o.data.vertices)} for s in ['L','R'] for o in [bpy.data.objects['Nico_SneakerSole.'+s]]}
for part in ['Nico_ArmAndFiveFingerHand','Nico_SneakerSole','Nico_SneakerUpper']:
    a=bpy.data.objects[part+'.L'];b=bpy.data.objects[part+'.R'];av=[a.matrix_world@v.co for v in a.data.vertices];bv=[b.matrix_world@v.co for v in b.data.vertices]
    # Shoe is the same local silhouette placed at opposite centres, while the
    # arm/hand is a true mirror. Verify anatomical left/right as authored.
    assert len(av)==len(bv)
    error=max((Vector((-p.x,p.y,p.z))-q).length for p,q in zip(av,bv))
    native[part+'_max_mirror_error']=error
    assert error<1e-6
    if 'Arm' in part:native['bilateral_arm_max_mirror_error']=error
watch=bpy.data.objects['Nico_Watch.L • beveled digital case'];native['watch_anatomical_left']=watch.location.x>0

glb=OUT/'Nico_LowPoly.glb';data=glb.read_bytes();magic,version,total=struct.unpack_from('<4sII',data,0);length,kind=struct.unpack_from('<I4s',data,12)
assert magic==b'glTF' and version==2 and total==len(data) and kind==b'JSON'
gltf=json.loads(data[20:20+length]);images=gltf.get('images',[])
assert all('bufferView' in im and 'uri' not in im for im in images)
assert not gltf.get('skins') and not gltf.get('animations')
embedded={'images':len(images),'all_images_in_binary_buffer':True,'extensions_required':gltf.get('extensionsRequired',[]),'materials':len(gltf.get('materials',[]))}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(glb));bpy.context.view_layer.update();imported=collect(bpy.context.scene.objects)
editing_restore=weld_for_editing(list(bpy.context.scene.objects));editable_import=collect(bpy.context.scene.objects)
assert all(o['nonmanifold_edges']==0 and o['zero_area_faces']==0 for o in editable_import['objects'])
issues=[]
for row in native['objects']:
    if row['nonmanifold_edges']:issues.append({'object':row['object'],'problem':'nonmanifold edges','count':row['nonmanifold_edges']})
    if row['zero_area_faces']:issues.append({'object':row['object'],'problem':'zero-area faces','count':row['zero_area_faces']})
if native['triangles']!=imported['triangles']:issues.append({'problem':'native/imported triangle count differs'})
assert native['armatures']==0 and not native['modifiers'] and native['watch_anatomical_left']
assert native['bilateral_arm_max_mirror_error']<1e-6
assert all(im['packed'] for im in native['packed_textures'])
assert all(abs(v['min_z'])<1e-6 for v in native['feet'].values())
for i in range(3):
    assert abs(native['bounds']['min'][i]-imported['bounds']['min'][i])<1e-5
    assert abs(native['bounds']['max'][i]-imported['bounds']['max'][i])<1e-5
report={'blender_version_actually_tested':bpy.app.version_string,'blender_293_tested':False,'native_blend_sha256':sha(OUT/'Nico_LowPoly.blend'),'glb_sha256':sha(glb),'native_reopened':native,'actual_glb_reimported':imported,'glb_editing_restore':editing_restore,'editable_glb_import':editable_import,'glb_embedding':embedded,'technical_issues':issues,'scope':'Geometry/material/texture import checks. Raw glTF hardware vertices split at hard normals; included helper restores welded editing topology with the original corner normals. Visual approval and deformation tests are separate; no rig included.'}
(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'triangles':native['triangles'],'objects':native['meshes'],'glb_images':len(images),'issues':issues},indent=2))
if '--render-import' in sys.argv:
    # Re-use the original review setup, but replace the model with actual GLB
    # geometry. This verifies the delivered file in a rendered view as well.
    imported_objects=list(bpy.context.scene.objects)
    with bpy.data.libraries.load(str(OUT/'Nico_LowPoly.blend'),link=False) as (src,dst):dst.collections=['REVIEW • cameras and neutral lights']
    for c in dst.collections:
        if c:bpy.context.scene.collection.children.link(c)
    scene=bpy.context.scene;scene.camera=next(o for o in scene.objects if o.type=='CAMERA')
    scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False
    scene.world=bpy.data.worlds.new('Import check neutral world');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.22,.235,.25,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
    scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
    scene.render.resolution_x=1280;scene.render.resolution_y=1160;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'review/glb-reimport-three-quarter.png')
    bpy.ops.render.render(write_still=True)
assert not issues,'Technical issues require correction; see verification.json'
