"""Run through Blender MCP in the inspected prototype scene.

Round 3 is a table material change. Meshes, camera, lights, chairs and origins
stay fixed. The ID render permits a four-tone table palette at native size.
"""
import bpy
from pathlib import Path

ROOT = Path('/Users/ebuccelli/Code/solo/projects/twin-peaks-game/.worktrees/e3')
OUT = ROOT / 'artifacts/art-pass-e/e3/prop-prototype'
scene = bpy.data.scenes['TP_RoadhousePropPrototype']
assert bpy.data.filepath == str(ROOT / 'assets/prototypes/roadhouse-table-set-prototype.blend')
assert scene.camera.name == 'TPP_OrthoCamera'
assert (scene.render.resolution_x, scene.render.resolution_y) == (48, 36)
table = bpy.data.collections['TP_PROP_RoundTable']

def band(name, color):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    emission = mat.node_tree.nodes.new('ShaderNodeEmission')
    emission.inputs['Color'].default_value = (*color, 1)
    emission.inputs['Strength'].default_value = 1
    output = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(emission.outputs[0], output.inputs['Surface'])
    mat.diffuse_color = (*color, 1)
    mat['role'] = 'flat painted wood band; does not emit scene lighting'
    return mat

# Local flat bands prevent the fixed orange key from bleaching dark walnut.
rim = band('TPP_R3_TableRim', (0.032, 0.019, 0.013))
wood = band('TPP_R3_TableWood', (0.098, 0.058, 0.034))
inset = band('TPP_R3_TableInset', (0.123, 0.073, 0.044))
for name, mat in [('TPP_TableTopDark', rim), ('TPP_TableTop', wood), ('TPP_TableInlay', inset)]:
    obj = bpy.data.objects[name]
    assert obj.name in table.objects and obj.data.users == 1
    obj.data.materials.clear()
    obj.data.materials.append(mat)

# Side faces form the distinct continuous shaded edge under the wooden plane.
top = bpy.data.objects['TPP_TableTop']
top.data.materials.append(rim)
for polygon in top.data.polygons:
    polygon.material_index = 0 if polygon.normal.z > 0.5 else 1

bpy.data.objects['TPP_PREFAB_TableTwoChairs']['definitionVersion'] = 'round-3'
scene['tableMaterialRound'] = 'dark wood plane and shaded rim; geometry unchanged'
scene.render.filepath = str(OUT / 'round-3-diagnostic.png')
scene.render.resolution_x, scene.render.resolution_y = 960, 720
bpy.ops.render.render(write_still=True, scene=scene.name)
scene.render.resolution_x, scene.render.resolution_y = 48, 36
scene.render.filepath = '/tmp/tp-round3-native-raw.png'
bpy.ops.render.render(write_still=True, scene=scene.name)

# Temporary ID pass, with the exact same geometry, visibility and camera.
# Restore every slot and color setting before saving the authoring source.
groups = ['TP_PROP_RoundTable', 'TP_PROP_ChairWoodRed', 'TP_PROP_Candle', 'TP_PROP_Ashtray', 'TP_PROP_PendantLamp']
backup = {}
ids = []
view, look = scene.view_settings.view_transform, scene.view_settings.look
try:
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    for index, group in enumerate(groups, 1):
        mat = band('TPP_R3_ID_' + str(index), ((index / 6) ** 2.2, 0, 0))
        ids.append(mat)
        for obj in bpy.data.collections[group].objects:
            if obj.type != 'MESH':
                continue
            backup[obj.name] = (list(obj.data.materials), [p.material_index for p in obj.data.polygons])
            obj.data.materials.clear()
            obj.data.materials.append(mat)
            for polygon in obj.data.polygons:
                polygon.material_index = 0
    scene.render.filepath = '/tmp/tp-round3-object-ids.png'
    bpy.ops.render.render(write_still=True, scene=scene.name)
finally:
    for name, (materials, indices) in backup.items():
        obj = bpy.data.objects[name]
        obj.data.materials.clear()
        for mat in materials:
            obj.data.materials.append(mat)
        for polygon, index in zip(obj.data.polygons, indices):
            polygon.material_index = index
    for mat in ids:
        bpy.data.materials.remove(mat)
    scene.view_settings.view_transform = view
    scene.view_settings.look = look
scene.render.filepath = str(OUT / 'round-3-native.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'assets/prototypes/roadhouse-table-set-prototype.blend'))
result = {'diagnostic': str(OUT / 'round-3-diagnostic.png'), 'rawNative': '/tmp/tp-round3-native-raw.png', 'ids': '/tmp/tp-round3-object-ids.png'}
