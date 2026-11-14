"""Reopen/reimport v2 and verify the preserved v1 and focused edit scope."""
import bpy,bmesh,json,hashlib,struct,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/characters/nico-lowpoly-v2';V1=ROOT/'assets/characters/nico-lowpoly-v1'
sys.path.insert(0,str(Path(__file__).resolve().parent));from import_nico_glb import weld_for_editing
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def signature(o):return hashlib.sha256(repr(([(tuple(v.co)) for v in o.data.vertices],[tuple(p.vertices) for p in o.data.polygons])).encode()).hexdigest()
def collect(objects):
    result=[];pts=[];triangles=0
    for o in objects:
        if o.type!='MESH':continue
        me=o.data;me.calc_loop_triangles();triangles+=len(me.loop_triangles);pts.extend(o.matrix_world@v.co for v in me.vertices)
        bm=bmesh.new();bm.from_mesh(me)
        result.append({'object':o.name,'vertices':len(me.vertices),'triangles':len(me.loop_triangles),'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),'zero_area_faces':sum(f.calc_area()<1e-12 for f in bm.faces),'flat_polygons':sum(not p.use_smooth for p in me.polygons),'polygons':len(me.polygons),'geometry_hash':signature(o)})
        bm.free()
    return {'triangles':triangles,'mesh_count':len(result),'objects':result,'bounds':{'min':[min(p[i] for p in pts) for i in range(3)],'max':[max(p[i] for p in pts) for i in range(3)]}}
bpy.ops.wm.open_mainfile(filepath=str(V1/'Nico_LowPoly.blend'));v1_hashes={o.name:signature(o) for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('Nico_')}
bpy.ops.wm.open_mainfile(filepath=str(OUT/'Nico_LowPoly.blend'));geo=bpy.data.collections['NICO • editable geometry'];native=collect(geo.objects)
native['packed_images']=[{'name':im.name,'packed':bool(im.packed_file),'size':list(im.size)} for im in bpy.data.images if im.source=='FILE' and im.users]
native['armatures']=sum(o.type=='ARMATURE' for o in geo.objects)
assert not native['armatures'] and all(im['packed'] for im in native['packed_images'])
assert all(o['nonmanifold_edges']==0 and o['zero_area_faces']==0 for o in native['objects'])
assert all(o['flat_polygons']==o['polygons'] for o in native['objects'])
changed=[];unchanged=[]
for o in geo.objects:
    if o.type!='MESH' or o.name not in v1_hashes:continue
    (unchanged if signature(o)==v1_hashes[o.name] else changed).append(o.name)
assert set(changed)=={'Nico_Skin_HeadAndNeck','Nico_QuietMouth','Nico_Jeans • continuous pelvis, crotch and joint loops'},changed
for side in ['L','R']:
    sole=bpy.data.objects['Nico_SneakerSole.'+side];assert abs(min((sole.matrix_world@v.co).z for v in sole.data.vertices))<1e-7
construction=json.loads((OUT/'construction.json').read_text())
assert construction['v1_files_preserved']=={str(p.relative_to(V1)):sha(p) for p in V1.rglob('*') if p.is_file()}
data=(OUT/'Nico_LowPoly.glb').read_bytes();magic,version,size=struct.unpack_from('<4sII',data);length,kind=struct.unpack_from('<I4s',data,12);g=json.loads(data[20:20+length])
assert magic==b'glTF' and version==2 and size==len(data) and kind==b'JSON'
assert all('bufferView' in im and 'uri' not in im for im in g['images'])
assert not g.get('skins') and not g.get('animations') and not g.get('extensionsRequired')
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(OUT/'Nico_LowPoly.glb'));bpy.context.view_layer.update()
raw=collect(bpy.context.scene.objects);restored=weld_for_editing(list(bpy.context.scene.objects));editable=collect(bpy.context.scene.objects)
assert native['triangles']==raw['triangles']==editable['triangles']
assert all(o['nonmanifold_edges']==0 and o['zero_area_faces']==0 for o in editable['objects'])
for side in ['min','max']:
    assert max(abs(a-b) for a,b in zip(native['bounds'][side],raw['bounds'][side]))<1e-5
report={'status':'native_reopened_and_actual_glb_reimported','blender_versions_actually_tested':[bpy.app.version_string],'blender_293_tested':False,'blend_sha256':sha(OUT/'Nico_LowPoly.blend'),'glb_sha256':sha(OUT/'Nico_LowPoly.glb'),'v1_preserved':True,'changed_existing_meshes':changed,'unchanged_existing_meshes':unchanged,'native':native,'raw_glb_import':raw,'editable_glb_import':editable,'glb_editing_restore':restored,'embedded_images':len(g['images']),'required_extensions':g.get('extensionsRequired',[]),'note':'Raw glTF vertices split at hard normals/UV boundaries. The supplied helper restores welded editing topology while preserving authored corner normals. This is unrigged; no bend/acting validation is claimed.'}
(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'triangles':native['triangles'],'meshes':native['mesh_count'],'changed':changed,'v1_preserved':True},indent=2))
if '--render-import' in sys.argv:
    with bpy.data.libraries.load(str(OUT/'Nico_LowPoly.blend'),link=False) as (src,dst):dst.collections=['REVIEW • cameras and neutral lights']
    for c in dst.collections:bpy.context.scene.collection.children.link(c)
    scene=bpy.context.scene;cam=next(o for o in scene.objects if o.type=='CAMERA');scene.camera=cam
    scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=False
    scene.world=bpy.data.worlds.new('v2 import review');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.22,.235,.25,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
    scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
    for o in bpy.context.scene.objects:
        if o.type=='MESH':o.hide_render=not any(k in o.name for k in ['Hair','HeadAndNeck','Nose','Nostril','QuietMouth','Ear','Eye','Iris','Pupil','Lid','Brow','Glasses'])
    cam.location=(2,-3,2.30);cam.rotation_euler=(Vector((0,0,1.62))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=.410
    scene.render.resolution_x=672;scene.render.resolution_y=840;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'review/v2-glb-reimport-head.png');bpy.ops.render.render(write_still=True)
