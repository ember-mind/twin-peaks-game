"""Generate the Twin Peaks reusable low-poly prop kit.

Run from anywhere:
    blender --background --python tools/generate_prop_kit.py

The script writes ``assets/models/twin-peaks-prop-kit.glb`` relative to the
project root, then clears the Blender scene and re-imports the GLB as a
validation pass.  Every reusable prop is an EMPTY root whose origin sits on
the floor at the prop's logical centre.  Child meshes use local transforms.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "assets" / "models" / "twin-peaks-prop-kit.glb"
PREVIEW_PATH = Path("/tmp/twin-peaks-prop-kit-preview.png")
TAU = math.tau

ROOT_PREFIXES = ("TP_IN_", "TP_OUT_")
EXPECTED_ROOTS = {
    "TP_IN_FloorLamp",
    "TP_IN_FileCabinet",
    "TP_IN_EvidenceBoard",
    "TP_IN_Sofa",
    "TP_IN_Armchair",
    "TP_IN_SideTable",
    "TP_IN_PottedPlant",
    "TP_OUT_Lamppost",
    "TP_OUT_UtilityPole",
    "TP_OUT_TrashBin",
    "TP_OUT_FlowerPlanter",
    "TP_OUT_LogFernCluster",
    "TP_OUT_FallenLogRootball",
    "TP_OUT_DecayedStumpFernFan",
    "TP_OUT_MossStonesBranch",
}


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float,
    metallic: float = 0.0,
    emission: tuple[float, float, float] | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def make_palette() -> dict[str, bpy.types.Material]:
    return {
        # Muted PNW palette: these sit beside the renderer's procedural shell,
        # so no isolated toy-like primaries or mirror-bright metals.
        "wood_walnut": material("TP_MAT_Wood_Walnut", (0.15, 0.060, 0.030, 1), 0.82),
        "wood_honey": material("TP_MAT_Wood_Honey", (0.34, 0.15, 0.055, 1), 0.76),
        "wood_bark": material("TP_MAT_Wood_Bark", (0.085, 0.038, 0.018, 1), 0.94),
        "metal_black": material("TP_MAT_Metal_Black", (0.022, 0.027, 0.027, 1), 0.45, 0.66),
        "metal_green": material("TP_MAT_Metal_Forest", (0.035, 0.105, 0.078, 1), 0.52, 0.42),
        "metal_blue": material("TP_MAT_Metal_Blue", (0.050, 0.115, 0.145, 1), 0.52, 0.42),
        "brass": material("TP_MAT_Brass", (0.38, 0.22, 0.065, 1), 0.38, 0.68),
        "ceramic": material("TP_MAT_Ceramic_Cream", (0.60, 0.55, 0.43, 1), 0.48),
        "glass": material("TP_MAT_Glass_Smoky", (0.17, 0.26, 0.24, 1), 0.32, 0.06),
        "lamp_glow": material(
            "TP_MAT_Lamp_Glow",
            (0.78, 0.34, 0.08, 1),
            0.42,
            emission=(0.86, 0.22, 0.035),
            emission_strength=2.4,
        ),
        "fabric_teal": material("TP_MAT_Fabric_Teal", (0.038, 0.135, 0.140, 1), 0.96),
        "fabric_red": material("TP_MAT_Fabric_Oxblood", (0.23, 0.042, 0.048, 1), 0.95),
        "fabric_gold": material("TP_MAT_Fabric_Mustard", (0.42, 0.20, 0.055, 1), 0.95),
        "cork": material("TP_MAT_Cork", (0.34, 0.17, 0.065, 1), 0.98),
        "paper": material("TP_MAT_Paper_Cream", (0.68, 0.60, 0.44, 1), 0.93),
        "paper_red": material("TP_MAT_Paper_Red", (0.38, 0.065, 0.055, 1), 0.91),
        "soil": material("TP_MAT_Soil", (0.065, 0.025, 0.012, 1), 1.0),
        "terracotta": material("TP_MAT_Terracotta", (0.36, 0.12, 0.055, 1), 0.93),
        "foliage_dark": material("TP_MAT_Foliage_Dark", (0.030, 0.115, 0.060, 1), 0.95),
        "foliage_light": material("TP_MAT_Foliage_Light", (0.075, 0.245, 0.095, 1), 0.93),
        "flower_pink": material("TP_MAT_Flower_Pink", (0.58, 0.15, 0.25, 1), 0.84),
        "flower_yellow": material("TP_MAT_Flower_Yellow", (0.62, 0.40, 0.085, 1), 0.84),
        "concrete": material("TP_MAT_Concrete", (0.23, 0.25, 0.23, 1), 0.97),
        "rubber": material("TP_MAT_Rubber", (0.015, 0.017, 0.016, 1), 0.98),
        "thread_red": material("TP_MAT_Thread_Red", (0.52, 0.025, 0.025, 1), 0.66),
    }


def apply_bevel(obj: bpy.types.Object, width: float, segments: int = 1) -> None:
    if width <= 0:
        return
    bevel = obj.modifiers.new(name="TP_SoftEdge", type="BEVEL")
    bevel.width = width
    bevel.segments = segments
    bevel.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.select_set(False)


def tag_mesh(obj: bpy.types.Object, prop_root: bpy.types.Object) -> None:
    obj["tp_prop_root"] = prop_root.name
    obj["tp_role"] = "prop_component"


def root(name: str, location: tuple[float, float, float], category: str) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.empty_display_type = "CUBE"
    obj.empty_display_size = 0.22
    obj.location = location
    obj["tp_category"] = category
    obj["tp_units"] = "meters"
    obj["tp_origin"] = "floor_center"
    obj["tp_reusable"] = True
    return obj


def box(
    prop_root: bpy.types.Object,
    name: str,
    size: tuple[float, float, float],
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    bevel: float = 0.025,
    rot: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_bevel(obj, min(bevel, min(size) * 0.24))
    obj.data.materials.append(mat)
    obj.parent = prop_root
    obj.location = loc
    obj.rotation_euler = rot
    tag_mesh(obj, prop_root)
    return obj


def cylinder(
    prop_root: bpy.types.Object,
    name: str,
    radius: float,
    depth: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    vertices: int = 12,
    rot: tuple[float, float, float] = (0, 0, 0),
    bevel: float = 0.018,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth)
    obj = bpy.context.object
    obj.name = name
    apply_bevel(obj, min(bevel, radius * 0.25, depth * 0.12), 1)
    obj.data.materials.append(mat)
    obj.parent = prop_root
    obj.location = loc
    obj.rotation_euler = rot
    tag_mesh(obj, prop_root)
    return obj


def cone(
    prop_root: bpy.types.Object,
    name: str,
    radius1: float,
    radius2: float,
    depth: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    vertices: int = 12,
    rot: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices, radius1=radius1, radius2=radius2, depth=depth
    )
    obj = bpy.context.object
    obj.name = name
    apply_bevel(obj, min(0.018, radius1 * 0.1, depth * 0.06), 1)
    obj.data.materials.append(mat)
    obj.parent = prop_root
    obj.location = loc
    obj.rotation_euler = rot
    tag_mesh(obj, prop_root)
    return obj


def sphere(
    prop_root: bpy.types.Object,
    name: str,
    radius: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    scale: tuple[float, float, float] = (1, 1, 1),
) -> bpy.types.Object:
    # Twenty broad triangles keep foliage/flowers deliberately low-poly and
    # avoid turning repeated dressing into a hidden triangle-budget sink.
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    obj.parent = prop_root
    obj.location = loc
    tag_mesh(obj, prop_root)
    return obj


def beam_between(
    prop_root: bpy.types.Object,
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius: float,
    mat: bpy.types.Material,
    vertices: int = 8,
) -> bpy.types.Object:
    a, b = Vector(start), Vector(end)
    delta = b - a
    obj = cylinder(
        prop_root,
        name,
        radius,
        delta.length,
        tuple((a + b) * 0.5),
        mat,
        vertices=vertices,
        bevel=radius * 0.18,
    )
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(delta.normalized())
    return obj


def floor_lamp(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_IN_FloorLamp", pos, "indoor")
    cylinder(r, "FloorLamp_Base", 0.29, 0.09, (0, 0, 0.045), p["brass"], 16)
    cylinder(r, "FloorLamp_BaseInset", 0.20, 0.055, (0, 0, 0.105), p["metal_black"], 16)
    cylinder(r, "FloorLamp_Stem", 0.038, 1.50, (0, 0, 0.86), p["brass"], 10)
    cylinder(r, "FloorLamp_Collar", 0.075, 0.09, (0, 0, 1.42), p["metal_black"], 12)
    cone(r, "FloorLamp_Shade", 0.37, 0.20, 0.43, (0, 0, 1.68), p["fabric_gold"], 16)
    sphere(r, "FloorLamp_BulbGlow", 0.12, (0, 0, 1.67), p["lamp_glow"], (1, 1, 1.08))
    cylinder(r, "FloorLamp_ShadeCap", 0.055, 0.055, (0, 0, 1.92), p["brass"], 12)


def file_cabinet(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_IN_FileCabinet", pos, "indoor")
    box(r, "FileCabinet_Carcass", (0.74, 0.53, 1.16), (0, 0, 0.61), p["metal_green"], 0.045)
    box(r, "FileCabinet_Top", (0.78, 0.56, 0.065), (0, 0, 1.21), p["metal_black"], 0.025)
    for i in range(4):
        z = 0.25 + i * 0.285
        box(r, f"FileCabinet_Drawer_{i + 1}", (0.64, 0.035, 0.235), (0, -0.278, z), p["metal_green"], 0.018)
        box(r, f"FileCabinet_Handle_{i + 1}", (0.25, 0.052, 0.042), (0, -0.322, z + 0.035), p["metal_black"], 0.012)
        box(r, f"FileCabinet_Label_{i + 1}", (0.19, 0.055, 0.075), (0, -0.328, z - 0.065), p["brass"], 0.009)
        box(r, f"FileCabinet_Paper_{i + 1}", (0.135, 0.058, 0.042), (0, -0.337, z - 0.065), p["paper"], 0.004)
    for x in (-0.27, 0.27):
        for y in (-0.19, 0.19):
            cylinder(r, "FileCabinet_Foot", 0.035, 0.07, (x, y, 0.035), p["rubber"], 10)


def evidence_board(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_IN_EvidenceBoard", pos, "indoor")
    box(r, "EvidenceBoard_Panel", (1.55, 0.10, 0.94), (0, 0, 1.18), p["cork"], 0.025)
    for x, z, sx, sz in (
        (0, 0.99, 1.68, 0.075),
        (0, 1.67, 1.68, 0.075),
        (-0.805, 1.33, 0.075, 0.76),
        (0.805, 1.33, 0.075, 0.76),
    ):
        box(r, "EvidenceBoard_Frame", (sx, 0.14, sz), (x, 0, z), p["wood_walnut"], 0.02)
    for x in (-0.59, 0.59):
        box(r, "EvidenceBoard_Leg", (0.10, 0.10, 0.96), (x, 0.06, 0.49), p["wood_walnut"], 0.025)
        box(r, "EvidenceBoard_Foot", (0.42, 0.45, 0.075), (x, 0.08, 0.06), p["wood_walnut"], 0.025)
    papers = [
        (-0.48, -0.065, 1.42, 0.33, 0.29, p["paper"]),
        (0.09, -0.066, 1.47, 0.27, 0.36, p["paper_red"]),
        (0.50, -0.065, 1.23, 0.38, 0.29, p["paper"]),
        (-0.08, -0.067, 1.12, 0.32, 0.20, p["paper"]),
    ]
    for idx, (x, y, z, sx, sz, mat) in enumerate(papers, 1):
        box(r, f"EvidenceBoard_Note_{idx}", (sx, 0.018, sz), (x, y, z), mat, 0.006, (0, 0, (idx - 2) * 0.055))
        sphere(r, f"EvidenceBoard_Pin_{idx}", 0.026, (x, y - 0.018, z + sz * 0.38), p["brass"])
    links = [
        ((-0.48, -0.09, 1.42), (0.09, -0.09, 1.47)),
        ((0.09, -0.09, 1.47), (0.50, -0.09, 1.23)),
        ((0.50, -0.09, 1.23), (-0.08, -0.09, 1.12)),
        ((-0.08, -0.09, 1.12), (-0.48, -0.09, 1.42)),
    ]
    for idx, (start, end) in enumerate(links, 1):
        beam_between(r, f"EvidenceBoard_RedThread_{idx}", start, end, 0.009, p["thread_red"], 6)


def sofa(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_IN_Sofa", pos, "indoor")
    fabric = p["fabric_teal"]
    box(r, "Sofa_Base", (1.78, 0.74, 0.28), (0, 0, 0.34), fabric, 0.09)
    box(r, "Sofa_Back", (1.72, 0.25, 0.82), (0, 0.27, 0.85), fabric, 0.11, (-0.10, 0, 0))
    for x in (-0.48, 0.48):
        box(r, "Sofa_SeatCushion", (0.79, 0.58, 0.19), (x, -0.05, 0.56), fabric, 0.095, (0.025, 0, 0))
        box(r, "Sofa_BackCushion", (0.74, 0.18, 0.56), (x, 0.15, 0.91), fabric, 0.11, (-0.10, 0, 0))
    for x in (-0.91, 0.91):
        box(r, "Sofa_Arm", (0.24, 0.73, 0.50), (x, 0, 0.58), fabric, 0.10)
    for x in (-0.70, 0.70):
        for y in (-0.23, 0.23):
            box(r, "Sofa_Leg", (0.095, 0.095, 0.18), (x, y, 0.09), p["wood_walnut"], 0.025, (0.06, 0, 0))
    box(r, "Sofa_ThrowPillow", (0.39, 0.16, 0.39), (0.48, -0.34, 0.86), p["fabric_gold"], 0.10, (0.08, 0.18, -0.12))


def armchair(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_IN_Armchair", pos, "indoor")
    fabric = p["fabric_red"]
    box(r, "Armchair_Base", (0.92, 0.74, 0.29), (0, 0, 0.34), fabric, 0.095)
    box(r, "Armchair_Seat", (0.64, 0.58, 0.19), (0, -0.06, 0.56), fabric, 0.09, (0.025, 0, 0))
    box(r, "Armchair_Back", (0.75, 0.23, 0.88), (0, 0.27, 0.91), fabric, 0.12, (-0.12, 0, 0))
    for x in (-0.49, 0.49):
        box(r, "Armchair_Arm", (0.23, 0.72, 0.52), (x, 0, 0.60), fabric, 0.09)
    for x in (-0.34, 0.34):
        for y in (-0.23, 0.23):
            box(r, "Armchair_Leg", (0.09, 0.09, 0.19), (x, y, 0.095), p["wood_honey"], 0.025, (0.05, 0, 0))
    box(r, "Armchair_Headrest", (0.48, 0.16, 0.28), (0, 0.11, 1.24), p["fabric_gold"], 0.08, (-0.1, 0, 0))


def side_table(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_IN_SideTable", pos, "indoor")
    box(r, "SideTable_Top", (0.72, 0.58, 0.105), (0, 0, 0.69), p["wood_honey"], 0.045)
    box(r, "SideTable_Drawer", (0.58, 0.44, 0.19), (0, 0, 0.55), p["wood_walnut"], 0.025)
    cylinder(r, "SideTable_Knob", 0.038, 0.075, (0, -0.26, 0.56), p["brass"], 10, (math.pi / 2, 0, 0))
    for x in (-0.26, 0.26):
        for y in (-0.19, 0.19):
            box(r, "SideTable_Leg", (0.075, 0.075, 0.52), (x, y, 0.26), p["wood_walnut"], 0.022, (0.03 * (1 if x > 0 else -1), 0, 0))
    box(r, "SideTable_LowerShelf", (0.54, 0.40, 0.06), (0, 0, 0.19), p["wood_honey"], 0.025)


def potted_plant(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_IN_PottedPlant", pos, "indoor")
    cylinder(r, "PottedPlant_Saucer", 0.34, 0.07, (0, 0, 0.035), p["terracotta"], 16)
    cone(r, "PottedPlant_Pot", 0.30, 0.38, 0.46, (0, 0, 0.29), p["terracotta"], 16)
    cylinder(r, "PottedPlant_Soil", 0.32, 0.035, (0, 0, 0.53), p["soil"], 16)
    stems = [
        ((0, 0, 0.52), (-0.14, 0.03, 1.13)),
        ((0, 0, 0.52), (0.18, -0.04, 1.22)),
        ((0, 0, 0.52), (0.03, 0.12, 1.38)),
        ((0, 0, 0.52), (-0.25, -0.08, 0.93)),
        ((0, 0, 0.52), (0.28, 0.08, 0.99)),
    ]
    for idx, (start, end) in enumerate(stems, 1):
        beam_between(r, f"PottedPlant_Stem_{idx}", start, end, 0.024, p["foliage_dark"], 7)
        endpoint = Vector(end)
        sphere(
            r,
            f"PottedPlant_Leaf_{idx}_A",
            0.22,
            tuple(endpoint),
            p["foliage_light" if idx % 2 else "foliage_dark"],
            (1.38, 0.42, 0.72),
        ).rotation_euler[2] = idx * 0.72
        sphere(
            r,
            f"PottedPlant_Leaf_{idx}_B",
            0.16,
            tuple(endpoint * 0.82 + Vector((0, 0, 0.12))),
            p["foliage_dark"],
            (1.25, 0.38, 0.70),
        ).rotation_euler[2] = idx * 0.72 + math.pi


def lamppost(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_OUT_Lamppost", pos, "outdoor")
    cylinder(r, "Lamppost_Base", 0.32, 0.13, (0, 0, 0.065), p["concrete"], 12)
    cone(r, "Lamppost_Pedestal", 0.22, 0.13, 0.45, (0, 0, 0.34), p["metal_black"], 12)
    cylinder(r, "Lamppost_Post", 0.065, 2.35, (0, 0, 1.65), p["metal_black"], 10)
    cylinder(r, "Lamppost_Collar", 0.13, 0.10, (0, 0, 2.79), p["brass"], 12)
    beam_between(r, "Lamppost_Arm", (0, 0, 2.72), (0.43, 0, 3.04), 0.055, p["metal_black"], 10)
    box(r, "Lamppost_LanternFrame", (0.34, 0.34, 0.47), (0.48, 0, 2.82), p["metal_black"], 0.035)
    box(r, "Lamppost_LanternGlass", (0.25, 0.25, 0.33), (0.48, 0, 2.82), p["glass"], 0.02)
    sphere(r, "Lamppost_Glow", 0.105, (0.48, -0.01, 2.82), p["lamp_glow"], (0.8, 0.8, 1.15))
    cone(r, "Lamppost_Cap", 0.27, 0.05, 0.19, (0.48, 0, 3.13), p["metal_black"], 12)


def utility_pole(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_OUT_UtilityPole", pos, "outdoor")
    cylinder(r, "UtilityPole_Pole", 0.15, 4.15, (0, 0, 2.075), p["wood_bark"], 10, bevel=0.025)
    box(r, "UtilityPole_Crossarm", (1.72, 0.16, 0.16), (0, 0, 3.72), p["wood_walnut"], 0.035)
    box(r, "UtilityPole_BraceLeft", (0.72, 0.08, 0.08), (-0.34, 0, 3.50), p["metal_black"], 0.018, (0, -0.48, 0))
    box(r, "UtilityPole_BraceRight", (0.72, 0.08, 0.08), (0.34, 0, 3.50), p["metal_black"], 0.018, (0, 0.48, 0))
    for idx, x in enumerate((-0.68, 0, 0.68), 1):
        cylinder(r, f"UtilityPole_InsulatorBase_{idx}", 0.055, 0.16, (x, 0, 3.89), p["metal_black"], 10)
        cone(r, f"UtilityPole_Insulator_{idx}", 0.10, 0.055, 0.18, (x, 0, 4.03), p["ceramic"], 12)
        cylinder(r, f"UtilityPole_WireStub_{idx}", 0.018, 0.45, (x, 0, 4.18), p["metal_black"], 8, (math.pi / 2, 0, 0), 0.004)
    box(r, "UtilityPole_Marker", (0.16, 0.035, 0.23), (0, -0.16, 2.26), p["paper_red"], 0.009)


def trash_bin(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_OUT_TrashBin", pos, "outdoor")
    cone(r, "TrashBin_Body", 0.39, 0.34, 0.92, (0, 0, 0.49), p["metal_green"], 16)
    cylinder(r, "TrashBin_Bottom", 0.37, 0.08, (0, 0, 0.06), p["rubber"], 16)
    cylinder(r, "TrashBin_Rim", 0.41, 0.095, (0, 0, 0.96), p["metal_black"], 16)
    cylinder(r, "TrashBin_Lid", 0.43, 0.12, (0, 0, 1.04), p["metal_green"], 16)
    cone(r, "TrashBin_LidCap", 0.34, 0.18, 0.14, (0, 0, 1.15), p["metal_green"], 16)
    cylinder(r, "TrashBin_Handle", 0.045, 0.18, (0, 0, 1.27), p["metal_black"], 10)
    for idx, z in enumerate((0.30, 0.50, 0.70), 1):
        cylinder(r, f"TrashBin_Band_{idx}", 0.385 - idx * 0.012, 0.035, (0, 0, z), p["metal_black"], 16, bevel=0.006)


def flower_planter(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_OUT_FlowerPlanter", pos, "outdoor")
    box(r, "FlowerPlanter_Box", (1.32, 0.55, 0.46), (0, 0, 0.27), p["wood_honey"], 0.065)
    box(r, "FlowerPlanter_Soil", (1.16, 0.41, 0.09), (0, 0, 0.53), p["soil"], 0.025)
    for x in (-0.48, -0.16, 0.16, 0.48):
        for y in (-0.12, 0.12):
            idx = int((x + 0.5) * 10 + (y + 0.13) * 10)
            h = 0.32 + (idx % 3) * 0.055
            beam_between(r, "FlowerPlanter_Stem", (x, y, 0.54), (x + 0.025, y, 0.54 + h), 0.014, p["foliage_dark"], 6)
            sphere(r, "FlowerPlanter_Leaf", 0.10, (x - 0.055, y, 0.68), p["foliage_light"], (1.15, 0.42, 0.55)).rotation_euler[2] = 0.45
            flower_mat = p["flower_pink"] if idx % 2 else p["flower_yellow"]
            for petal in range(5):
                angle = petal * TAU / 5
                sphere(
                    r,
                    "FlowerPlanter_Petal",
                    0.052,
                    (x + math.cos(angle) * 0.052, y + math.sin(angle) * 0.052, 0.56 + h),
                    flower_mat,
                    (1.15, 0.70, 0.52),
                )
            sphere(r, "FlowerPlanter_Centre", 0.045, (x, y, 0.56 + h), p["flower_yellow"])


def log_fern_cluster(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    r = root("TP_OUT_LogFernCluster", pos, "outdoor")
    cylinder(r, "LogFern_Log", 0.31, 1.72, (0, 0, 0.34), p["wood_bark"], 12, (0, math.pi / 2, 0), 0.035)
    cylinder(r, "LogFern_CutLeft", 0.275, 0.026, (-0.87, 0, 0.34), p["wood_honey"], 12, (0, math.pi / 2, 0), 0.008)
    cylinder(r, "LogFern_CutRight", 0.275, 0.026, (0.87, 0, 0.34), p["wood_honey"], 12, (0, math.pi / 2, 0), 0.008)
    for side in (-1, 1):
        for frond in range(3):
            anchor = (side * (0.52 + frond * 0.16), 0.23 - frond * 0.18, 0.10)
            tip = (anchor[0] + side * 0.32, anchor[1] + (frond - 1) * 0.12, 0.72 + frond * 0.10)
            beam_between(r, "LogFern_FrondStem", anchor, tip, 0.018, p["foliage_dark"], 6)
            for leaf_index in range(1, 5):
                t = leaf_index / 5
                centre = Vector(anchor).lerp(Vector(tip), t)
                for leaf_side in (-1, 1):
                    leaf = sphere(
                        r,
                        "LogFern_Leaflet",
                        0.095 * (1 - t * 0.28),
                        tuple(centre + Vector((0, leaf_side * 0.09, 0))),
                        p["foliage_light" if (leaf_index + frond) % 2 else "foliage_dark"],
                        (1.20, 0.42, 0.48),
                    )
                    leaf.rotation_euler[2] = side * 0.40 + leaf_side * 0.32
    for x, y in ((-0.30, -0.18), (0.18, 0.25), (0.42, -0.16)):
        cylinder(r, "LogFern_MushroomStem", 0.025, 0.16, (x, y, 0.62), p["ceramic"], 8)
        cone(r, "LogFern_MushroomCap", 0.105, 0.018, 0.10, (x, y, 0.74), p["paper_red"], 12)


def fallen_log_rootball(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    """Long horizontal mass with an exposed root fan and low moss crown."""
    r = root("TP_OUT_FallenLogRootball", pos, "outdoor")
    cylinder(
        r, "FallenLog_Trunk", 0.245, 1.48, (0.08, 0, 0.29),
        p["wood_bark"], 11, (0, math.pi / 2, 0), 0.025,
    )
    cylinder(
        r, "FallenLog_CutFace", 0.215, 0.026, (0.83, 0, 0.29),
        p["wood_honey"], 11, (0, math.pi / 2, 0), 0.006,
    )
    sphere(
        r, "FallenLog_Rootball", 0.38, (-0.72, 0.02, 0.34),
        p["wood_bark"], (0.86, 0.74, 1.02),
    )
    for idx, end in enumerate(
        ((-1.12, -0.34, 0.07), (-1.18, 0.28, 0.06), (-0.72, -0.52, 0.08), (-0.55, 0.49, 0.07)),
        1,
    ):
        beam_between(
            r, f"FallenLog_Root_{idx}", (-0.72, 0.02, 0.34), end,
            0.055 if idx < 3 else 0.04, p["wood_bark"], 7,
        )
    for idx, (x, y, scale) in enumerate(
        ((-0.34, -0.08, (1.25, 0.75, 0.35)), (0.12, 0.05, (1.45, 0.72, 0.32)), (0.48, -0.03, (1.05, 0.68, 0.28))),
        1,
    ):
        sphere(
            r, f"FallenLog_Moss_{idx}", 0.16, (x, y, 0.51),
            p["foliage_dark" if idx != 2 else "foliage_light"], scale,
        )
    for idx, tip in enumerate(((0.62, 0.38, 0.67), (0.78, 0.18, 0.78), (0.48, 0.48, 0.62)), 1):
        beam_between(r, f"FallenLog_FernStem_{idx}", (0.52, 0.22, 0.18), tip, 0.014, p["foliage_dark"], 6)
        leaf = sphere(
            r, f"FallenLog_FernLeaf_{idx}", 0.12, tip,
            p["foliage_light"], (1.45, 0.35, 0.48),
        )
        leaf.rotation_euler[2] = 0.45 + idx * 0.42


def decayed_stump_fern_fan(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    """Vertical broken stump with an asymmetric fan of fern fronds."""
    r = root("TP_OUT_DecayedStumpFernFan", pos, "outdoor")
    cylinder(r, "Stump_Core", 0.33, 0.66, (0, 0, 0.34), p["wood_bark"], 9, bevel=0.025)
    cylinder(r, "Stump_Cut", 0.285, 0.028, (0, 0, 0.685), p["wood_honey"], 9, bevel=0.006)
    cylinder(r, "Stump_Hollow", 0.13, 0.036, (0.04, -0.03, 0.707), p["soil"], 8, bevel=0.004)
    for idx, (x, y, height) in enumerate(((-0.2, 0.03, 0.24), (0.18, -0.08, 0.30), (0.02, 0.18, 0.19)), 1):
        cone(
            r, f"Stump_BrokenSpire_{idx}", 0.10, 0.025, height,
            (x, y, 0.68 + height * 0.46), p["wood_bark"], 7,
        )
    for idx, end in enumerate(((-0.63, -0.25, 0.05), (0.58, -0.32, 0.05), (-0.38, 0.46, 0.05), (0.45, 0.42, 0.05)), 1):
        beam_between(r, f"Stump_GroundRoot_{idx}", (0, 0, 0.22), end, 0.05, p["wood_bark"], 7)

    fan_origins = ((-0.24, 0.18, 0.08), (-0.10, 0.24, 0.08), (0.08, 0.26, 0.08), (0.24, 0.21, 0.08), (0.36, 0.11, 0.08))
    fan_tips = ((-0.72, 0.20, 0.70), (-0.43, 0.28, 0.92), (-0.05, 0.34, 1.03), (0.35, 0.28, 0.88), (0.69, 0.17, 0.66))
    for idx, (origin, tip) in enumerate(zip(fan_origins, fan_tips), 1):
        beam_between(r, f"Stump_FernStem_{idx}", origin, tip, 0.015, p["foliage_dark"], 6)
        start, finish = Vector(origin), Vector(tip)
        for leaf_idx in (1, 2, 3):
            t = leaf_idx / 4
            centre = start.lerp(finish, t)
            for side in (-1, 1):
                leaf = sphere(
                    r, f"Stump_FernLeaf_{idx}_{leaf_idx}_{side}", 0.09,
                    tuple(centre + Vector((side * 0.08, 0, 0))),
                    p["foliage_light" if (idx + leaf_idx) % 2 else "foliage_dark"],
                    (1.35, 0.34, 0.44),
                )
                leaf.rotation_euler[2] = (idx - 3) * 0.18 + side * 0.34


def moss_stones_branch(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    """Low stone triangle crossed by a forked branch; no log/stump silhouette."""
    r = root("TP_OUT_MossStonesBranch", pos, "outdoor")
    stones = (
        (-0.52, -0.06, 0.18, 0.34, (1.18, 0.85, 0.72)),
        (0.08, 0.18, 0.22, 0.40, (1.0, 0.78, 0.84)),
        (0.55, -0.12, 0.16, 0.30, (1.2, 0.72, 0.86)),
        (0.25, -0.42, 0.11, 0.22, (1.12, 0.65, 0.78)),
    )
    for idx, (x, y, z, radius, scale) in enumerate(stones, 1):
        sphere(r, f"MossStones_Stone_{idx}", radius, (x, y, z), p["concrete"], scale)
        sphere(
            r, f"MossStones_MossCap_{idx}", radius * 0.72,
            (x - 0.03, y, z + radius * scale[2] * 0.58),
            p["foliage_dark" if idx % 2 else "foliage_light"],
            (scale[0] * 0.9, scale[1] * 0.76, 0.26),
        )
    beam_between(
        r, "MossStones_MainBranch", (-0.82, -0.34, 0.27), (0.76, 0.34, 0.46),
        0.075, p["wood_bark"], 8,
    )
    beam_between(
        r, "MossStones_BranchForkA", (0.18, 0.10, 0.39), (0.63, -0.22, 0.72),
        0.042, p["wood_bark"], 7,
    )
    beam_between(
        r, "MossStones_BranchForkB", (-0.18, -0.04, 0.35), (-0.52, 0.34, 0.62),
        0.038, p["wood_bark"], 7,
    )
    for idx, (x, y) in enumerate(((-0.18, 0.32), (0.42, 0.28)), 1):
        cylinder(r, f"MossStones_MushroomStem_{idx}", 0.02, 0.12, (x, y, 0.5), p["ceramic"], 7)
        cone(r, f"MossStones_MushroomCap_{idx}", 0.075, 0.012, 0.07, (x, y, 0.59), p["paper_red"], 9)


def build_scene() -> None:
    clear_scene()
    palette = make_palette()
    builders = [
        (floor_lamp, (0.0, 0.0, 0.0)),
        (file_cabinet, (2.5, 0.0, 0.0)),
        (evidence_board, (5.0, 0.0, 0.0)),
        (sofa, (7.8, 0.0, 0.0)),
        (armchair, (10.7, 0.0, 0.0)),
        (side_table, (13.0, 0.0, 0.0)),
        (potted_plant, (15.2, 0.0, 0.0)),
        # The outdoor row is staggered against the indoor row so all
        # silhouettes remain readable when the complete kit is previewed.
        (lamppost, (1.25, 4.5, 0.0)),
        (utility_pole, (4.25, 4.5, 0.0)),
        (trash_bin, (7.15, 4.5, 0.0)),
        (flower_planter, (10.0, 4.5, 0.0)),
        (log_fern_cluster, (13.35, 4.5, 0.0)),
        (fallen_log_rootball, (16.35, 4.5, 0.0)),
        (decayed_stump_fern_fan, (19.25, 4.5, 0.0)),
        (moss_stones_branch, (22.15, 4.5, 0.0)),
    ]
    for builder, position in builders:
        builder(palette, position)

    # Collapse repeated components that share a material inside each prop.
    # This preserves the authored root hierarchy and material boundaries while
    # cutting browser draw calls from hundreds to roughly one per material.
    for root_name in sorted(EXPECTED_ROOTS):
        prop_root = bpy.data.objects[root_name]
        groups: dict[str, list[bpy.types.Object]] = {}
        for child in list(prop_root.children):
            if child.type != "MESH" or not child.material_slots:
                continue
            mat_name = child.material_slots[0].material.name
            groups.setdefault(mat_name, []).append(child)
        for mat_name, meshes in groups.items():
            if len(meshes) == 1:
                meshes[0].name = f"{root_name}__{mat_name.removeprefix('TP_MAT_')}"
                continue
            bpy.ops.object.select_all(action="DESELECT")
            for mesh in meshes:
                mesh.select_set(True)
            bpy.context.view_layer.objects.active = meshes[0]
            bpy.ops.object.join()
            joined = bpy.context.object
            joined.name = f"{root_name}__{mat_name.removeprefix('TP_MAT_')}"
            joined.parent = prop_root
            tag_mesh(joined, prop_root)

    scene = bpy.context.scene
    scene["tp_asset"] = "Twin Peaks stylized prop kit"
    scene["tp_units"] = "meters"
    scene["tp_version"] = "1.0.0"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"


def export_glb() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_PATH),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_extras=True,
        export_cameras=False,
        export_lights=False,
    )


def validate_glb() -> dict[str, object]:
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(OUTPUT_PATH))
    objects = list(bpy.context.scene.objects)
    roots = {
        obj.name
        for obj in objects
        if obj.type == "EMPTY" and obj.name.startswith(ROOT_PREFIXES)
    }
    missing = EXPECTED_ROOTS - roots
    unexpected = roots - EXPECTED_ROOTS
    if missing or unexpected:
        raise RuntimeError(
            f"GLB root mismatch: missing={sorted(missing)}, unexpected={sorted(unexpected)}"
        )

    mesh_objects = [obj for obj in objects if obj.type == "MESH"]
    unparented = [
        obj.name
        for obj in mesh_objects
        if obj.parent is None or obj.parent.name not in EXPECTED_ROOTS
    ]
    if unparented:
        raise RuntimeError(f"Mesh components without a prop root: {unparented}")

    bad_roots = []
    for name in sorted(EXPECTED_ROOTS):
        obj = bpy.data.objects[name]
        if abs(obj.location.z) > 1e-5:
            bad_roots.append((name, tuple(round(v, 5) for v in obj.location)))
    if bad_roots:
        raise RuntimeError(f"Prop roots are not floor aligned: {bad_roots}")

    material_names = sorted({slot.material.name for obj in mesh_objects for slot in obj.material_slots if slot.material})
    stats = {
        "file": str(OUTPUT_PATH),
        "bytes": OUTPUT_PATH.stat().st_size,
        "prop_roots": len(roots),
        "mesh_objects": len(mesh_objects),
        "materials": len(material_names),
        "triangles": sum(
            len(poly.vertices) - 2
            for obj in mesh_objects
            for poly in obj.data.polygons
        ),
        "roots": sorted(roots),
        "material_names": material_names,
    }
    return stats


def render_validation_preview() -> None:
    """Render the re-imported GLB; preview-only objects never enter the asset."""
    preview_root = root("TP_PREVIEW_Only", (0, 0, 0), "validation")
    ground_mat = material("TP_PREVIEW_Ground", (0.055, 0.070, 0.065, 1), 0.95)
    box(
        preview_root,
        "TP_PREVIEW_GroundMesh",
        (26.0, 8.0, 0.06),
        (10.8, 2.1, -0.07),
        ground_mat,
        0.025,
    )

    bpy.ops.object.light_add(type="AREA", location=(6.0, -5.5, 11.0))
    key = bpy.context.object
    key.name = "TP_PREVIEW_Key"
    key.data.energy = 1700
    key.data.shape = "DISK"
    key.data.size = 7.0
    key.data.color = (1.0, 0.73, 0.48)
    key.rotation_euler = (0.36, 0.0, 0.38)

    bpy.ops.object.light_add(type="AREA", location=(13.0, 5.0, 7.0))
    fill = bpy.context.object
    fill.name = "TP_PREVIEW_Fill"
    fill.data.energy = 1250
    fill.data.size = 6.0
    fill.data.color = (0.30, 0.52, 1.0)
    fill.rotation_euler = (-0.30, 0.0, 2.55)

    bpy.ops.object.light_add(type="AREA", location=(-2.5, 5.0, 5.0))
    rim = bpy.context.object
    rim.name = "TP_PREVIEW_Rim"
    rim.data.energy = 900
    rim.data.size = 4.0
    rim.data.color = (0.30, 0.88, 0.56)
    rim.rotation_euler = (-0.50, 0.0, -1.1)

    bpy.ops.object.camera_add(location=(10.8, -25.0, 14.0))
    camera = bpy.context.object
    camera.name = "TP_PREVIEW_Camera"
    target = Vector((10.8, 2.1, 1.55))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 48

    scene = bpy.context.scene
    scene.camera = camera
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW_PATH)
    scene.render.film_transparent = False
    scene.world.color = (0.012, 0.018, 0.022)
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.render.render(write_still=True)


def main() -> None:
    build_scene()
    export_glb()
    stats = validate_glb()
    render_validation_preview()
    stats["preview"] = str(PREVIEW_PATH)
    print("TP_PROP_KIT_VALIDATION=" + json.dumps(stats, sort_keys=True))


if __name__ == "__main__":
    main()
