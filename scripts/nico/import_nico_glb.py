"""Blender 2.93-compatible glTF import helper (actually tested in 4.3.2).

glTF duplicates vertices at hard-normal/UV boundaries for rendering. Restore
welded editing topology without averaging away the original faceted normals.
No scene objects are deleted and no rig or automatic save is performed.
"""
import bpy,bmesh,sys
from pathlib import Path

def weld_for_editing(objects):
    result=[]
    def point(co):return tuple(round(float(c),7) for c in co)
    for ob in objects:
        if ob.type!='MESH':continue
        me=ob.data
        if hasattr(me,'calc_normals_split'):me.calc_normals_split()
        corner={};smooth={}
        for p in me.polygons:
            face=tuple(sorted(point(me.vertices[i].co) for i in p.vertices))
            smooth[face]=p.use_smooth
            for li in p.loop_indices:
                corner[(face,point(me.vertices[me.loops[li].vertex_index].co))]=tuple(me.loops[li].normal)
        before=len(me.vertices);bm=bmesh.new();bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
        bm.to_mesh(me);bm.free();me.update()
        normals=[None]*len(me.loops)
        for p in me.polygons:
            face=tuple(sorted(point(me.vertices[i].co) for i in p.vertices));p.use_smooth=smooth[face]
            for li in p.loop_indices:normals[li]=corner[(face,point(me.vertices[me.loops[li].vertex_index].co))]
        if hasattr(me,'use_auto_smooth'):me.use_auto_smooth=True
        me.normals_split_custom_set(normals);me.update()
        result.append({'object':ob.name,'hardware_vertices':before,'welded_vertices':len(me.vertices),'original_corner_normals_restored':True})
    return result

def import_nico(path):
    before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(path))
    objects=[o for o in bpy.data.objects if o not in before]
    restored=weld_for_editing(objects)
    for im in bpy.data.images:
        if im.source=='FILE' and im.users and not im.packed_file:im.pack()
    return objects,restored

if __name__=='__main__':
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    if args:path=Path(args[0])
    else:
        path=Path(__file__).resolve().parent/'Nico_LowPoly.glb'
        if not path.exists():path=Path(__file__).resolve().parents[2]/'assets/characters/nico-lowpoly-v1/Nico_LowPoly.glb'
    objects,restored=import_nico(path)
    print('Imported Nico, restored welded topology and preserved authored normals. No file saved automatically.')
