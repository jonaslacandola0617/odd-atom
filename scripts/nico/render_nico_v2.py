"""Matched-camera v1/v2 geometry and silhouette comparisons."""
import bpy,sys,json,math
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/characters/nico-lowpoly-v2';REVIEW=OUT/'review'
QUICK='--quick' in sys.argv
views={'front':(0,-3,1.62),'profile':(3,0,1.62),'back':(0,3,1.62),'elevated-three-quarter':(2,-3,2.30)}
def material(name,value,emission=False):
    m=bpy.data.materials.new(name);m.use_nodes=True;nodes=m.node_tree.nodes
    if emission:
        nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');bs=nodes.new('ShaderNodeEmission');bs.inputs['Color'].default_value=(value,value,value,1);m.node_tree.links.new(bs.outputs[0],out.inputs['Surface'])
    else:
        bs=nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(value,value,value,1);bs.inputs['Roughness'].default_value=.85
    return m
def is_head(o):return any(k in o.name for k in ['Hair','HeadAndNeck','Nose','Nostril','QuietMouth','Ear','Eye','Iris','Pupil','Lid','Brow','Glasses'])
def setup(version):
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/f'assets/characters/nico-lowpoly-v{version}/Nico_LowPoly.blend'))
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=20 if QUICK else 40;scene.cycles.use_denoising=False
    scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
    scene.render.image_settings.file_format='PNG';scene.render.resolution_percentage=100
    cam=scene.camera;cam.data.type='ORTHO';cam.data.ortho_scale=.410
    scene.render.resolution_x=480 if QUICK else 672;scene.render.resolution_y=600 if QUICK else 840
    for o in bpy.data.objects:
        if o.type=='MESH':o.hide_render=not is_head(o)
    return scene,cam
def frame(scene,cam,file,loc,target=(0,0,1.62),scale=.410):
    cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
    scene.render.filepath=str(REVIEW/file);bpy.ops.render.render(write_still=True)
    if file=='v2-finished-elevated-three-quarter.png':
        points=[]
        for o in bpy.data.objects:
            if o.type=='MESH' and is_head(o):
                for v in o.data.vertices:
                    p=o.matrix_world@v.co
                    if p.z>=1.500:points.append(world_to_camera_view(scene,cam,p))
        w,h=scene.render.resolution_x,scene.render.resolution_y
        box=[max(0,math.floor(min(p.x for p in points)*w)-2),max(0,math.floor((1-max(p.y for p in points))*h)-2),min(w,math.ceil(max(p.x for p in points)*w)+2),min(h,math.ceil((1-min(p.y for p in points))*h)+2)]
        (OUT/'head-crop.json').write_text(json.dumps({'source':file,'box':box,'method':'Projected actual hair/face mesh vertices at Z >= 1.5m, two-pixel margin. Output will be resized to exactly 96 pixels high.'},indent=2)+'\n')
for version in ([2] if QUICK else [1,2]):
    scene,cam=setup(version)
    gray=material('COMPARE • neutral gray, no textures',.35);skin=material('COMPARE • skin gray, no textures',.48);framegray=material('COMPARE • frame gray',.08)
    for o in bpy.data.objects:
        if o.type=='MESH' and is_head(o):
            o.data.materials.clear();o.data.materials.append(gray if 'Hair' in o.name else framegray if 'Glasses' in o.name or 'Brow' in o.name else skin)
            for p in o.data.polygons:p.material_index=0
    for view,loc in views.items():frame(scene,cam,f'v{version}-gray-{view}.png',loc)
    black=material('COMPARE • solid black silhouette',0,True)
    for o in bpy.data.objects:
        if o.type=='MESH' and is_head(o):
            o.data.materials.clear();o.data.materials.append(black)
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(1,1,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=1
    scene.cycles.samples=8
    for view,loc in views.items():
        if not QUICK or view in ['front','profile']:frame(scene,cam,f'v{version}-silhouette-{view}.png',loc)
    white=material('COMPARE • white head occluder',1,True)
    for o in bpy.data.objects:
        if o.type=='MESH' and is_head(o) and 'Hair' not in o.name:
            if 'HeadAndNeck' in o.name or 'Ear' in o.name:
                o.data.materials.clear();o.data.materials.append(white)
            else:o.hide_render=True
    for view,loc in views.items():frame(scene,cam,f'v{version}-hair-mask-{view}.png',loc)
if not QUICK:
    scene,cam=setup(2)
    for view in ['front','profile','elevated-three-quarter']:frame(scene,cam,'v2-finished-'+view+'.png',views[view])
    for o in bpy.data.objects:
        if o.type=='MESH':o.hide_render=False
    scene.render.resolution_x=1280;scene.render.resolution_y=1160
    for name,loc in [('front',(0,-4,1.0)),('profile',(4,0,1.0)),('three-quarter',(3,-5,1.4))]:frame(scene,cam,'v2-body-'+name+'.png',loc,(0,0,.875),2.12)
print('Matched-camera comparisons rendered from actual saved files.')
