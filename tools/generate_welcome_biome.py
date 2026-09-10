"""Generate the authored welcome-sign native verge vertical slice.

Run from anywhere:
    blender --background --python tools/generate_welcome_biome.py

The slice is deliberately isolated from the main prop kit.  It exports three
floor-origin, LOD-ready structural variants which share one restrained PNW PBR
palette.  Runtime failure is safe: render3d.js keeps its instanced procedural
ground dressing visible until this GLB has loaded and validated.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "assets" / "models" / "twin-peaks-welcome-biome.glb"
PREVIEW_PATH = Path("/tmp/twin-peaks-welcome-biome-preview.png")
EXPECTED_ROOTS = {
    "TP_BIOME_WelcomeRainGarden_A_LOD0",
    "TP_BIOME_WelcomeMeadow_B_LOD0",
    "TP_BIOME_WelcomeShrub_C_LOD0",
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
    coat: float = 0.0,
    coat_roughness: float = 0.2,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = coat_roughness
    mat["tp_shared_palette"] = "welcome_native_verge_v1"
    return mat


def make_palette() -> dict[str, bpy.types.Material]:
    return {
        "soil": material("TP_BIOME_MAT_SaturatedSoil", (0.075, 0.035, 0.018, 1), 0.88),
        "soil_edge": material("TP_BIOME_MAT_SoilEdge", (0.15, 0.075, 0.03, 1), 0.82),
        "moss": material("TP_BIOME_MAT_Moss", (0.045, 0.14, 0.055, 1), 0.84, coat=0.16, coat_roughness=0.28),
        "moss_light": material("TP_BIOME_MAT_MossLight", (0.18, 0.34, 0.105, 1), 0.8, coat=0.18, coat_roughness=0.24),
        "sedge": material("TP_BIOME_MAT_Sedge", (0.095, 0.30, 0.105, 1), 0.76, coat=0.24, coat_roughness=0.22),
        "sedge_gold": material("TP_BIOME_MAT_SedgeGold", (0.38, 0.38, 0.12, 1), 0.79, coat=0.18, coat_roughness=0.26),
        "leaf": material("TP_BIOME_MAT_NativeLeaf", (0.035, 0.17, 0.075, 1), 0.78, coat=0.26, coat_roughness=0.22),
        "leaf_light": material("TP_BIOME_MAT_NativeLeafLight", (0.16, 0.38, 0.12, 1), 0.76, coat=0.28, coat_roughness=0.2),
        "bark": material("TP_BIOME_MAT_WetBark", (0.11, 0.045, 0.018, 1), 0.58, coat=0.42, coat_roughness=0.2),
        "stone": material("TP_BIOME_MAT_Basalt", (0.18, 0.215, 0.205, 1), 0.46, coat=0.72, coat_roughness=0.14),
        "water": material(
            "TP_BIOME_MAT_ShallowWater",
            (0.018, 0.075, 0.082, 1),
            0.08,
            coat=1.0,
            coat_roughness=0.045,
        ),
        "water_highlight": material(
            "TP_BIOME_MAT_RainRipple",
            (0.34, 0.55, 0.5, 1),
            0.1,
            coat=1.0,
            coat_roughness=0.035,
        ),
        "metal": material("TP_BIOME_MAT_DrainIron", (0.065, 0.075, 0.07, 1), 0.5, 0.52),
        "seed": material("TP_BIOME_MAT_SeedHead", (0.6, 0.46, 0.17, 1), 0.78, coat=0.12),
        "flower": material("TP_BIOME_MAT_FlowerCream", (0.78, 0.68, 0.42, 1), 0.72, coat=0.16),
    }


def apply_bevel(obj: bpy.types.Object, width: float) -> None:
    if width <= 0:
        return
    bevel = obj.modifiers.new(name="TP_BIOME_SoftEdge", type="BEVEL")
    bevel.width = width
    bevel.segments = 1
    bevel.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.select_set(False)


def biome_root(
    name: str, location: tuple[float, float, float], variant: str
) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.empty_display_type = "CUBE"
    obj.empty_display_size = 0.22
    obj["tp_asset_type"] = "environment_vertical_slice"
    obj["tp_biome"] = "town_welcome_native_verge"
    obj["tp_variant"] = variant
    obj["tp_lod_group"] = name.removesuffix("_LOD0")
    obj["tp_lod_level"] = 0
    obj["tp_lod_ready"] = True
    obj["tp_origin"] = "floor_center"
    obj["tp_units"] = "meters"
    obj["tp_fallback"] = "instanced_procedural_ground_dressing"
    return obj


def tag(obj: bpy.types.Object, root: bpy.types.Object) -> None:
    obj["tp_biome_root"] = root.name
    obj["tp_role"] = "environment_component"


def box(
    root: bpy.types.Object,
    name: str,
    size: tuple[float, float, float],
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    bevel: float = 0.015,
    rot: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_bevel(obj, min(bevel, min(size) * 0.2))
    obj.data.materials.append(mat)
    obj.parent = root
    obj.location = loc
    obj.rotation_euler = rot
    tag(obj, root)
    return obj


def cylinder(
    root: bpy.types.Object,
    name: str,
    radius: float,
    depth: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    vertices: int = 8,
    rot: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth)
    obj = bpy.context.object
    obj.name = name
    apply_bevel(obj, min(0.01, radius * 0.16, depth * 0.08))
    obj.data.materials.append(mat)
    obj.parent = root
    obj.location = loc
    obj.rotation_euler = rot
    tag(obj, root)
    return obj


def cone(
    root: bpy.types.Object,
    name: str,
    radius: float,
    depth: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    vertices: int = 7,
    rot: tuple[float, float, float] = (0, 0, 0),
    radius2: float = 0.006,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices, radius1=radius, radius2=radius2, depth=depth
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    obj.parent = root
    obj.location = loc
    obj.rotation_euler = rot
    tag(obj, root)
    return obj


def sphere(
    root: bpy.types.Object,
    name: str,
    radius: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    scale: tuple[float, float, float] = (1, 1, 1),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    obj.parent = root
    obj.location = loc
    tag(obj, root)
    return obj


def irregular_disc(
    root: bpy.types.Object,
    name: str,
    radius_x: float,
    radius_y: float,
    height: float,
    mat: bpy.types.Material,
    seed: float,
    segments: int = 18,
) -> bpy.types.Object:
    """Low extruded irregular disc; never reads as a coplanar alpha card."""
    verts: list[tuple[float, float, float]] = [(0, 0, height), (0, 0, 0)]
    for index in range(segments):
        angle = index / segments * math.tau
        jitter = 1 + math.sin(seed + index * 2.17) * 0.08 + math.cos(seed * 0.63 + index * 1.31) * 0.04
        verts.append((math.cos(angle) * radius_x * jitter, math.sin(angle) * radius_y * jitter, height))
        verts.append((math.cos(angle) * radius_x * jitter, math.sin(angle) * radius_y * jitter, 0))
    faces: list[tuple[int, ...]] = []
    for index in range(segments):
        nxt = (index + 1) % segments
        top_i, bot_i = 2 + index * 2, 3 + index * 2
        top_n, bot_n = 2 + nxt * 2, 3 + nxt * 2
        faces.append((0, top_i, top_n))
        faces.append((1, bot_n, bot_i))
        faces.append((top_i, bot_i, bot_n, top_n))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = root
    tag(obj, root)
    return obj


def irregular_ring(
    root: bpy.types.Object,
    name: str,
    inner_x: float,
    inner_y: float,
    outer_x: float,
    outer_y: float,
    height: float,
    mat: bpy.types.Material,
    seed: float,
    segments: int = 20,
) -> bpy.types.Object:
    verts: list[tuple[float, float, float]] = []
    for index in range(segments):
        angle = index / segments * math.tau
        jitter = 1 + math.sin(seed + index * 1.93) * 0.07 + math.cos(seed * 0.71 + index * 1.17) * 0.035
        verts.extend(
            (
                (math.cos(angle) * outer_x * jitter, math.sin(angle) * outer_y * jitter, height),
                (math.cos(angle) * inner_x, math.sin(angle) * inner_y, height + 0.006),
                (math.cos(angle) * outer_x * jitter, math.sin(angle) * outer_y * jitter, 0),
            )
        )
    faces: list[tuple[int, ...]] = []
    for index in range(segments):
        nxt = (index + 1) % segments
        outer, inner, lower = index * 3, index * 3 + 1, index * 3 + 2
        outer_n, inner_n, lower_n = nxt * 3, nxt * 3 + 1, nxt * 3 + 2
        faces.append((outer, inner, inner_n, outer_n))
        faces.append((outer, outer_n, lower_n, lower))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = root
    tag(obj, root)
    return obj


def rain_ripple(
    root: bpy.types.Object,
    name: str,
    radius: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=radius,
        minor_radius=0.012,
        major_segments=14,
        minor_segments=4,
        location=(0, 0, 0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    obj.parent = root
    obj.location = loc
    obj.scale.z = 0.38
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    tag(obj, root)
    return obj


def beam_between(
    root: bpy.types.Object,
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius: float,
    mat: bpy.types.Material,
    vertices: int = 7,
) -> bpy.types.Object:
    a, b = Vector(start), Vector(end)
    direction = b - a
    obj = cylinder(
        root, name, radius, direction.length, tuple((a + b) * 0.5), mat, vertices
    )
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    obj.rotation_mode = "XYZ"
    return obj


def sedge_fan(
    root: bpy.types.Object,
    prefix: str,
    anchor: tuple[float, float],
    mat: bpy.types.Material,
    scale: float,
    phase: float,
) -> None:
    ax, ay = anchor
    for blade in range(7):
        angle = phase + (blade - 3) * 0.34
        height = scale * (0.42 + (3 - abs(blade - 3)) * 0.055)
        cone(
            root,
            f"{prefix}_Blade_{blade}",
            0.022 * scale,
            height,
            (ax + math.sin(angle) * 0.045, ay + math.cos(angle) * 0.032, height * 0.48),
            mat,
            5,
            (math.sin(angle) * 0.28, math.cos(angle) * 0.25, angle * 0.09),
            0.002,
        )


def rain_garden(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    root = biome_root("TP_BIOME_WelcomeRainGarden_A_LOD0", pos, "rain_garden")
    irregular_disc(root, "RainGarden_Basin", 1.35, 0.82, 0.075, p["soil"], 3.7, 22)
    irregular_ring(
        root,
        "RainGarden_SoilBank",
        0.86,
        0.48,
        1.38,
        0.84,
        0.115,
        p["soil_edge"],
        7.1,
        22,
    )
    irregular_disc(root, "RainGarden_ShallowWater", 0.88, 0.48, 0.026, p["water"], 11.2, 24)
    bpy.data.objects["RainGarden_ShallowWater"].location.z = 0.112
    for index, (x, y, rx, ry) in enumerate(
        (
            (-1.0, -0.2, 0.55, 0.28),
            (-0.65, 0.56, 0.48, 0.25),
            (0.7, 0.58, 0.58, 0.24),
            (1.06, -0.24, 0.45, 0.26),
        ),
        1,
    ):
        sphere(
            root,
            f"RainGarden_MossBank_{index}",
            0.32,
            (x, y, 0.13),
            p["moss_light" if index in (2, 3) else "moss"],
            (rx / 0.32, ry / 0.32, 0.22),
        )
    for index, (x, y, radius) in enumerate(
        (
            (-1.12, 0.1, 0.17),
            (-0.72, -0.52, 0.13),
            (0.72, -0.5, 0.15),
            (1.12, 0.15, 0.12),
            (0.48, 0.62, 0.105),
        ),
        1,
    ):
        sphere(
            root,
            f"RainGarden_Basalt_{index}",
            radius,
            (x, y, radius * 0.55),
            p["stone"],
            (1.2, 0.88, 0.72),
        )
    for index, anchor in enumerate(
        ((-1.0, -0.34), (-0.82, 0.42), (0.75, 0.43), (1.02, -0.28)),
        1,
    ):
        sedge_fan(
            root,
            f"RainGarden_Sedge_{index}",
            anchor,
            p["sedge_gold" if index == 3 else "sedge"],
            0.86 + index * 0.08,
            index * 0.72,
        )
    for index, (x, y, radius) in enumerate(
        ((-0.42, -0.05, 0.13), (0.18, 0.17, 0.18), (0.5, -0.18, 0.105)),
        1,
    ):
        rain_ripple(root, f"RainGarden_Ripple_{index}", radius, (x, y, 0.15), p["water_highlight"])

    box(root, "RainGarden_Drain", (0.34, 0.62, 0.04), (1.38, 0, 0.085), p["metal"], 0.008)
    for slot in range(-2, 3):
        box(
            root,
            f"RainGarden_DrainSlot_{slot}",
            (0.038, 0.5, 0.012),
            (1.38 + slot * 0.058, 0, 0.112),
            p["soil"],
            0.002,
        )


def native_meadow(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    root = biome_root("TP_BIOME_WelcomeMeadow_B_LOD0", pos, "native_meadow")
    irregular_disc(root, "Meadow_SoilTongue", 0.95, 0.56, 0.055, p["soil"], 4.4, 18)
    for index, (x, y, sx, sy) in enumerate(
        (
            (-0.62, 0.04, 1.35, 0.82),
            (-0.12, -0.14, 1.65, 0.92),
            (0.46, 0.12, 1.28, 0.75),
            (0.72, -0.18, 0.95, 0.62),
        ),
        1,
    ):
        sphere(
            root,
            f"Meadow_MossMound_{index}",
            0.25,
            (x, y, 0.05),
            p["moss" if index != 2 else "moss_light"],
            (sx, sy, 0.18),
        )
    meadow_anchors = (
        (-0.72, -0.28), (-0.66, 0.2), (-0.38, -0.02), (-0.2, 0.3),
        (0.02, -0.28), (0.18, 0.12), (0.42, -0.08), (0.58, 0.26),
        (0.76, -0.2),
    )
    for index, anchor in enumerate(meadow_anchors, 1):
        sedge_fan(
            root,
            f"Meadow_Grass_{index}",
            anchor,
            p["leaf" if index % 3 else "sedge_gold"],
            0.82 + (index % 4) * 0.1,
            index * 0.61,
        )
    for index, (x, y, height) in enumerate(
        ((-0.5, 0.12, 0.58), (-0.05, -0.02, 0.72), (0.38, 0.16, 0.54), (0.68, -0.12, 0.45)),
        1,
    ):
        cylinder(root, f"Meadow_SeedStem_{index}", 0.012, height, (x, y, height * 0.5), p["sedge"], 6)
        sphere(
            root,
            f"Meadow_SeedHead_{index}",
            0.055,
            (x, y, height + 0.02),
            p["seed" if index != 2 else "flower"],
            (0.72, 0.72, 1.35),
        )


def native_shrub(p: dict[str, bpy.types.Material], pos: tuple[float, float, float]) -> None:
    root = biome_root("TP_BIOME_WelcomeShrub_C_LOD0", pos, "native_shrub")
    irregular_disc(root, "Shrub_SoilShelf", 0.88, 0.58, 0.07, p["soil_edge"], 9.3, 18)
    stems = (
        ((-0.48, 0, 0.05), (-0.58, 0.04, 0.66)),
        ((-0.22, 0.02, 0.05), (-0.12, -0.04, 0.9)),
        ((0.14, 0, 0.05), (0.28, 0.02, 0.78)),
        ((0.48, 0.03, 0.05), (0.62, -0.04, 0.58)),
    )
    for index, (start, end) in enumerate(stems, 1):
        beam_between(root, f"Shrub_Stem_{index}", start, end, 0.024, p["bark"], 7)
    for index, (x, y, z, scale) in enumerate(
        (
            (-0.58, 0.02, 0.5, (1.25, 0.88, 1.05)),
            (-0.16, -0.03, 0.68, (1.45, 0.98, 1.4)),
            (0.28, 0.03, 0.6, (1.35, 0.92, 1.22)),
            (0.62, -0.02, 0.43, (1.16, 0.8, 0.96)),
        ),
        1,
    ):
        sphere(
            root,
            f"Shrub_Crown_{index}",
            0.32,
            (x, y, z),
            p["leaf_light" if index % 2 else "leaf"],
            scale,
        )
    for index, anchor in enumerate(((-0.74, -0.28), (0.7, 0.24), (0.46, -0.38)), 1):
        sedge_fan(root, f"Shrub_Fern_{index}", anchor, p["sedge"], 0.96, index * 1.3)
    for index, (x, y, radius) in enumerate(((-0.15, 0.3, 0.12), (0.42, 0.27, 0.095)), 1):
        sphere(
            root,
            f"Shrub_Stone_{index}",
            radius,
            (x, y, radius * 0.55),
            p["stone"],
            (1.15, 0.9, 0.72),
        )


def batch_by_material() -> None:
    for root_name in EXPECTED_ROOTS:
        root = bpy.data.objects[root_name]
        groups: dict[str, list[bpy.types.Object]] = {}
        for child in list(root.children):
            if child.type != "MESH" or not child.material_slots:
                continue
            mat_name = child.material_slots[0].material.name
            groups.setdefault(mat_name, []).append(child)
        for mat_name, meshes in groups.items():
            bpy.ops.object.select_all(action="DESELECT")
            for mesh in meshes:
                mesh.select_set(True)
            bpy.context.view_layer.objects.active = meshes[0]
            if len(meshes) > 1:
                bpy.ops.object.join()
            joined = bpy.context.object
            joined.name = f"{root_name}__{mat_name.removeprefix('TP_BIOME_MAT_')}"
            joined.parent = root
            tag(joined, root)


def build_scene() -> None:
    clear_scene()
    palette = make_palette()
    rain_garden(palette, (0, 0, 0))
    native_meadow(palette, (3.0, 0, 0))
    native_shrub(palette, (6.0, 0, 0))
    batch_by_material()
    scene = bpy.context.scene
    scene["tp_asset"] = "Twin Peaks welcome-sign native verge vertical slice"
    scene["tp_palette"] = "welcome_native_verge_v1"
    scene["tp_version"] = "1.1.0"
    scene["tp_fallback"] = "instanced_procedural_ground_dressing"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"


def export_glb() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_PATH),
        export_format="GLB",
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
    roots = {
        obj.name
        for obj in bpy.context.scene.objects
        if obj.type == "EMPTY" and obj.name.startswith("TP_BIOME_")
    }
    if roots != EXPECTED_ROOTS:
        raise RuntimeError(
            f"Welcome-biome root mismatch: missing={sorted(EXPECTED_ROOTS - roots)}, "
            f"unexpected={sorted(roots - EXPECTED_ROOTS)}"
        )
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    unparented = [
        obj.name
        for obj in meshes
        if obj.parent is None or obj.parent.name not in EXPECTED_ROOTS
    ]
    if unparented:
        raise RuntimeError(f"Welcome-biome meshes without a LOD root: {unparented}")
    for root_name in EXPECTED_ROOTS:
        root = bpy.data.objects[root_name]
        if root.get("tp_lod_level") != 0 or not root.get("tp_lod_ready"):
            raise RuntimeError(f"Missing LOD metadata on {root_name}")
    materials = sorted(
        {
            slot.material.name
            for mesh in meshes
            for slot in mesh.material_slots
            if slot.material
        }
    )
    return {
        "file": str(OUTPUT_PATH),
        "bytes": OUTPUT_PATH.stat().st_size,
        "roots": sorted(roots),
        "root_count": len(roots),
        "mesh_batches": len(meshes),
        "materials": materials,
        "material_count": len(materials),
        "triangles": sum(
            len(poly.vertices) - 2 for mesh in meshes for poly in mesh.data.polygons
        ),
        "fallback": "instanced_procedural_ground_dressing",
    }


def render_preview() -> None:
    preview = biome_root("TP_PREVIEW_Only", (0, 0, 0), "validation")
    ground = material("TP_PREVIEW_Ground", (0.055, 0.085, 0.06, 1), 0.96)
    box(preview, "TP_PREVIEW_GroundMesh", (8.5, 3.2, 0.06), (3, 0, -0.07), ground)

    bpy.ops.object.light_add(type="AREA", location=(-1.5, -3.5, 6))
    key = bpy.context.object
    key.data.energy = 950
    key.data.size = 5
    key.data.color = (0.78, 0.9, 0.82)
    bpy.ops.object.light_add(type="AREA", location=(7, 1.5, 4))
    fill = bpy.context.object
    fill.data.energy = 700
    fill.data.size = 4
    fill.data.color = (0.45, 0.58, 0.72)

    bpy.ops.object.camera_add(location=(3, -7.5, 4.8))
    camera = bpy.context.object
    camera.rotation_euler = (
        Vector((3, 0, 0.42)) - camera.location
    ).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 52

    scene = bpy.context.scene
    scene.camera = camera
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 620
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW_PATH)
    scene.world.color = (0.012, 0.018, 0.016)
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.render.render(write_still=True)


def main() -> None:
    build_scene()
    export_glb()
    stats = validate_glb()
    render_preview()
    stats["preview"] = str(PREVIEW_PATH)
    print("TP_WELCOME_BIOME_VALIDATION=" + json.dumps(stats, sort_keys=True))


if __name__ == "__main__":
    main()
