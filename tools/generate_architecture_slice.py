"""Generate six authored exterior buildings for the Twin Peaks game.

Run from anywhere:
    blender --background --python tools/generate_architecture_slice.py

The GLB is intentionally runtime-neutral.  Every root is floor-centred, faces
Blender -Y, and fits inside the exact collision footprint already encoded by
the town ASCII map.  No map, camera, collision, or renderer source is touched.

Design goal: broad, hand-authored PNW silhouettes with readable roofs and
entries at the shipped top-down camera angle.  Detail is structural rather
than noisy: stepped masses, gables, porches, gutters, mullions, chimneys and
large material fields.  Four material batches per building cap future draw
cost while bevels and weighted normals prevent the blocky procedural read.
"""

from __future__ import annotations

import json
import math
import struct
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector


PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "assets" / "models" / "twin-peaks-architecture-slice.glb"
PREVIEW_DIR = Path("/tmp/tp-botw-architecture-asset-loop1")
VALIDATION_PATH = PREVIEW_DIR / "validation.json"

BUILDINGS = {
    "TP_BUILD_Sheriff": {"footprint": (11.0, 3.0), "kind": "sheriff"},
    "TP_BUILD_DoubleR": {"footprint": (11.0, 3.0), "kind": "diner"},
    "TP_BUILD_Palmer": {"footprint": (10.0, 3.0), "kind": "palmer"},
    "TP_BUILD_GreatNorthern": {"footprint": (10.0, 3.0), "kind": "hotel"},
    "TP_BUILD_Hospital": {"footprint": (8.0, 3.0), "kind": "hospital"},
    "TP_BUILD_Roadhouse": {"footprint": (8.0, 3.0), "kind": "roadhouse"},
}
EXPECTED_ROOTS = set(BUILDINGS)
MAX_TRIANGLES = 75_000
MAX_BYTES = 6 * 1024 * 1024
MAX_MATERIALS_PER_ROOT = 4


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
    coat_roughness: float = 0.25,
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
    mat["tp_architecture_palette"] = "pnw_authored_v1"
    return mat


def palette(
    prefix: str,
    wall: tuple[float, float, float, float],
    roof: tuple[float, float, float, float],
    trim: tuple[float, float, float, float],
    accent: tuple[float, float, float, float],
    roof_metallic: float = 0.02,
    accent_metallic: float = 0.18,
) -> dict[str, bpy.types.Material]:
    return {
        "wall": material(f"TP_ARCH_MAT_{prefix}_Wall", wall, 0.82),
        "roof": material(
            f"TP_ARCH_MAT_{prefix}_Roof",
            roof,
            0.58 if roof_metallic > 0.2 else 0.76,
            roof_metallic,
            coat=0.18,
            coat_roughness=0.24,
        ),
        "trim": material(f"TP_ARCH_MAT_{prefix}_Trim", trim, 0.72, 0.04),
        "accent": material(
            f"TP_ARCH_MAT_{prefix}_Accent",
            accent,
            0.34,
            accent_metallic,
            coat=0.28,
            coat_roughness=0.18,
        ),
    }


def make_palettes() -> dict[str, dict[str, bpy.types.Material]]:
    # Each family owns four materials, shared by all components in that root.
    # Geometry and value hierarchy, not high-frequency texture noise, carries
    # the read at the fixed game camera.
    return {
        "sheriff": palette(
            "Sheriff",
            (0.47, 0.36, 0.235, 1),
            (0.19, 0.30, 0.39, 1),
            (0.69, 0.62, 0.47, 1),
            (0.055, 0.13, 0.19, 1),
            accent_metallic=0.32,
        ),
        "diner": palette(
            "DoubleR",
            (0.44, 0.19, 0.12, 1),
            (0.23, 0.46, 0.62, 1),
            (0.70, 0.76, 0.76, 1),
            (0.55, 0.025, 0.035, 1),
            roof_metallic=0.52,
            accent_metallic=0.24,
        ),
        "palmer": palette(
            "Palmer",
            (0.69, 0.59, 0.39, 1),
            (0.43, 0.19, 0.09, 1),
            (0.80, 0.75, 0.61, 1),
            (0.12, 0.22, 0.19, 1),
            accent_metallic=0.08,
        ),
        "hotel": palette(
            "GreatNorthern",
            (0.31, 0.18, 0.085, 1),
            (0.11, 0.285, 0.13, 1),
            (0.31, 0.34, 0.29, 1),
            (0.52, 0.35, 0.13, 1),
            accent_metallic=0.12,
        ),
        "hospital": palette(
            "Hospital",
            (0.70, 0.73, 0.70, 1),
            (0.26, 0.34, 0.38, 1),
            (0.48, 0.55, 0.57, 1),
            (0.58, 0.025, 0.035, 1),
            roof_metallic=0.2,
            accent_metallic=0.22,
        ),
        "roadhouse": palette(
            "Roadhouse",
            (0.18, 0.105, 0.065, 1),
            (0.13, 0.105, 0.085, 1),
            (0.37, 0.23, 0.13, 1),
            (0.64, 0.025, 0.27, 1),
            accent_metallic=0.12,
        ),
    }


def architecture_root(name: str) -> bpy.types.Object:
    spec = BUILDINGS[name]
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root.location = (0, 0, 0)
    root.empty_display_type = "CUBE"
    root.empty_display_size = 0.32
    root["tp_asset_type"] = "authored_architecture"
    root["tp_building_kind"] = spec["kind"]
    root["tp_footprint"] = list(spec["footprint"])
    root["tp_origin"] = "footprint_center_floor"
    root["tp_forward"] = "-Y"
    root["tp_units"] = "world_tile"
    root["tp_lod_level"] = 0
    root["tp_lod_ready"] = True
    root["tp_ascii_collision_authority"] = True
    return root


def tag(obj: bpy.types.Object, root: bpy.types.Object, role: str) -> None:
    obj["tp_architecture_root"] = root.name
    obj["tp_component_role"] = role


def apply_bevel_and_normals(
    obj: bpy.types.Object,
    width: float,
    segments: int = 2,
) -> None:
    if obj.type != "MESH":
        return
    if width > 0:
        bevel = obj.modifiers.new(name="TP_ARCH_SoftEdge", type="BEVEL")
        bevel.width = width
        bevel.segments = segments
        bevel.limit_method = "ANGLE"
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.modifier_apply(modifier=bevel.name)
        obj.select_set(False)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    weighted = obj.modifiers.new(name="TP_ARCH_WeightedNormals", type="WEIGHTED_NORMAL")
    weighted.keep_sharp = True
    weighted.weight = 50
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=weighted.name)
    obj.select_set(False)


def box(
    root: bpy.types.Object,
    name: str,
    size: tuple[float, float, float],
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    role: str,
    bevel: float = 0.025,
    rot: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_bevel_and_normals(obj, min(bevel, min(size) * 0.18), 2)
    obj.data.materials.append(mat)
    obj.parent = root
    obj.location = loc
    obj.rotation_euler = rot
    tag(obj, root, role)
    return obj


def cylinder(
    root: bpy.types.Object,
    name: str,
    radius: float,
    depth: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    role: str,
    vertices: int = 12,
    rot: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth)
    obj = bpy.context.object
    obj.name = name
    apply_bevel_and_normals(obj, min(0.018, radius * 0.14, depth * 0.08), 2)
    obj.data.materials.append(mat)
    obj.parent = root
    obj.location = loc
    obj.rotation_euler = rot
    tag(obj, root, role)
    return obj


def mesh_object(
    root: bpy.types.Object,
    name: str,
    vertices: list[tuple[float, float, float]],
    faces: list[tuple[int, ...]],
    mat: bpy.types.Material,
    role: str,
    bevel: float = 0.02,
) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update(calc_edges=True)
    # Deterministic dominant-axis UVs give every custom hip/barrel surface the
    # same filtered material vocabulary as primitive boxes. Without this, glTF
    # collapses these roof UVs to one texel and the largest roof masses read as
    # flat colour slabs in the shipped camera.
    # Primitive boxes use Blender's canonical `UVMap`.  Custom meshes must use
    # that exact name too: material batching joins them into one mesh, and glTF
    # samples TEXCOORD_0.  A second custom-named layer survives the join but
    # leaves the large hip/barrel faces sampling a single white texel.
    uv_layer = mesh.uv_layers.new(name="UVMap")
    mins = [min(vertex.co[axis] for vertex in mesh.vertices) for axis in range(3)]
    maxs = [max(vertex.co[axis] for vertex in mesh.vertices) for axis in range(3)]
    for polygon in mesh.polygons:
        dominant = max(range(3), key=lambda axis: abs(polygon.normal[axis]))
        axes = (0, 1) if dominant == 2 else ((0, 2) if dominant == 1 else (1, 2))
        for loop_index in polygon.loop_indices:
            vertex = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            u_span = max(1e-6, maxs[axes[0]] - mins[axes[0]])
            v_span = max(1e-6, maxs[axes[1]] - mins[axes[1]])
            uv_layer.data[loop_index].uv = (
                (vertex[axes[0]] - mins[axes[0]]) / u_span,
                (vertex[axes[1]] - mins[axes[1]]) / v_span,
            )
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = root
    tag(obj, root, role)
    apply_bevel_and_normals(obj, bevel, 2)
    return obj


def gable_roof(
    root: bpy.types.Object,
    name: str,
    width: float,
    depth: float,
    wall_top: float,
    rise: float,
    mat: bpy.types.Material,
    x: float = 0,
    y: float = 0,
    role: str = "roof",
) -> list[bpy.types.Object]:
    angle = math.atan2(rise, depth / 2)
    slope = math.sqrt((depth / 2) ** 2 + rise**2)
    front = box(
        root,
        name + "_FrontPlane",
        (width, slope, 0.10),
        (x, y - depth / 4, wall_top + rise / 2),
        mat,
        role,
        bevel=0.018,
        rot=(angle, 0, 0),
    )
    back = box(
        root,
        name + "_BackPlane",
        (width, slope, 0.10),
        (x, y + depth / 4, wall_top + rise / 2),
        mat,
        role,
        bevel=0.018,
        rot=(-angle, 0, 0),
    )
    ridge = box(
        root,
        name + "_Ridge",
        (width + 0.06, 0.13, 0.13),
        (x, y, wall_top + rise + 0.035),
        mat,
        role,
        bevel=0.028,
    )
    return [front, back, ridge]


def front_gable_roof(
    root: bpy.types.Object,
    name: str,
    width: float,
    depth: float,
    wall_top: float,
    rise: float,
    mat: bpy.types.Material,
    x: float = 0,
    y: float = 0,
    role: str = "roof",
) -> list[bpy.types.Object]:
    """Cross-gable whose ridge projects toward the facade/path (-Y)."""
    angle = math.atan2(rise, width / 2)
    slope = math.sqrt((width / 2) ** 2 + rise**2)
    left = box(
        root,
        name + "_LeftPlane",
        (slope, depth, 0.10),
        (x - width / 4, y, wall_top + rise / 2),
        mat,
        role,
        bevel=0.018,
        rot=(0, -angle, 0),
    )
    right = box(
        root,
        name + "_RightPlane",
        (slope, depth, 0.10),
        (x + width / 4, y, wall_top + rise / 2),
        mat,
        role,
        bevel=0.018,
        rot=(0, angle, 0),
    )
    ridge = box(
        root,
        name + "_Ridge",
        (0.13, depth + 0.06, 0.13),
        (x, y, wall_top + rise + 0.035),
        mat,
        role,
        bevel=0.028,
    )
    return [left, right, ridge]


def hip_roof(
    root: bpy.types.Object,
    name: str,
    width: float,
    depth: float,
    wall_top: float,
    rise: float,
    mat: bpy.types.Material,
    x: float = 0,
    y: float = 0,
) -> bpy.types.Object:
    ridge_half = max(0.32, width / 2 - depth * 0.46)
    z0 = wall_top - 0.035
    z1 = wall_top + rise
    vertices = [
        (x - width / 2, y - depth / 2, z0),
        (x + width / 2, y - depth / 2, z0),
        (x + width / 2, y + depth / 2, z0),
        (x - width / 2, y + depth / 2, z0),
        (x - ridge_half, y, z1),
        (x + ridge_half, y, z1),
    ]
    faces = [
        (0, 1, 5, 4),
        (1, 2, 5),
        (2, 3, 4, 5),
        (3, 0, 4),
        (0, 3, 2, 1),
    ]
    roof = mesh_object(root, name, vertices, faces, mat, "roof", bevel=0.025)
    box(
        root,
        name + "_RidgeCap",
        (ridge_half * 2 + 0.14, 0.14, 0.12),
        (x, y, z1 + 0.025),
        mat,
        "roof_ridge",
        bevel=0.028,
    )
    return roof


def beam_between(
    root: bpy.types.Object,
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    thickness: float,
    mat: bpy.types.Material,
    role: str,
) -> bpy.types.Object:
    """Bevelled square batten aligned between two authored roof points."""
    a, b = Vector(start), Vector(end)
    delta = b - a
    obj = box(
        root,
        name,
        (thickness, thickness, delta.length),
        tuple((a + b) * 0.5),
        mat,
        role,
        min(0.018, thickness * 0.2),
    )
    obj.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()
    return obj


def hip_roof_trim(
    root: bpy.types.Object,
    name: str,
    width: float,
    depth: float,
    wall_top: float,
    rise: float,
    mat: bpy.types.Material,
    x: float = 0,
    y: float = 0,
) -> None:
    """Continuous eave frame and four hip caps, readable at gameplay scale."""
    ridge_half = max(0.32, width / 2 - depth * 0.46)
    z0 = wall_top + 0.005
    z1 = wall_top + rise + 0.045
    box(root, name + "_FrontEave", (width, 0.075, 0.085), (x, y - depth / 2, z0), mat, "roof_trim", 0.014)
    box(root, name + "_BackEave", (width, 0.075, 0.085), (x, y + depth / 2, z0), mat, "roof_trim", 0.014)
    box(root, name + "_WestEave", (0.075, depth, 0.085), (x - width / 2, y, z0), mat, "roof_trim", 0.014)
    box(root, name + "_EastEave", (0.075, depth, 0.085), (x + width / 2, y, z0), mat, "roof_trim", 0.014)
    corners = (
        ((x - width / 2, y - depth / 2, z0), (x - ridge_half, y, z1)),
        ((x + width / 2, y - depth / 2, z0), (x + ridge_half, y, z1)),
        ((x - width / 2, y + depth / 2, z0), (x - ridge_half, y, z1)),
        ((x + width / 2, y + depth / 2, z0), (x + ridge_half, y, z1)),
    )
    for index, (start, end) in enumerate(corners):
        beam_between(root, name + f"_HipCap_{index}", start, end, 0.07, mat, "roof_trim")


def barrel_roof(
    root: bpy.types.Object,
    name: str,
    width: float,
    depth: float,
    base_z: float,
    rise: float,
    mat: bpy.types.Material,
    segments: int = 10,
) -> bpy.types.Object:
    # Closed shallow barrel, extruded along X.  Broad segments intentionally
    # catch rain light without turning into thin banding at game distance.
    verts: list[tuple[float, float, float]] = []
    for side_x in (-width / 2, width / 2):
        for index in range(segments + 1):
            t = index / segments
            y = -depth / 2 + depth * t
            z = base_z + math.sin(t * math.pi) * rise
            verts.append((side_x, y, z))
        verts.append((side_x, depth / 2, base_z - 0.08))
        verts.append((side_x, -depth / 2, base_z - 0.08))
    ring = segments + 3
    faces: list[tuple[int, ...]] = []
    for index in range(segments):
        faces.append((index, ring + index, ring + index + 1, index + 1))
    left_cap = list(range(segments + 1)) + [segments + 1, segments + 2]
    right_cap = [ring + index for index in range(segments + 1)] + [
        ring + segments + 1,
        ring + segments + 2,
    ]
    faces.append(tuple(left_cap))
    faces.append(tuple(reversed(right_cap)))
    faces.extend(
        [
            (segments, ring + segments, ring + segments + 1, segments + 1),
            (segments + 1, ring + segments + 1, ring + segments + 2, segments + 2),
            (segments + 2, ring + segments + 2, ring, 0),
        ]
    )
    return mesh_object(root, name, verts, faces, mat, "roof", bevel=0.018)


def flat_roof(
    root: bpy.types.Object,
    name: str,
    width: float,
    depth: float,
    z: float,
    roof: bpy.types.Material,
    trim: bpy.types.Material,
) -> None:
    box(root, name + "_Deck", (width, depth, 0.12), (0, 0, z), roof, "roof", 0.025)
    parapet_h = 0.27
    box(
        root,
        name + "_FrontParapet",
        (width, 0.16, parapet_h),
        (0, -depth / 2 + 0.08, z + parapet_h / 2),
        trim,
        "parapet",
        0.025,
    )
    box(
        root,
        name + "_BackParapet",
        (width, 0.16, parapet_h),
        (0, depth / 2 - 0.08, z + parapet_h / 2),
        trim,
        "parapet",
        0.025,
    )
    for side in (-1, 1):
        box(
            root,
            name + f"_SideParapet_{side}",
            (0.16, depth - 0.24, parapet_h),
            (side * (width / 2 - 0.08), 0, z + parapet_h / 2),
            trim,
            "parapet",
            0.025,
        )


def front_window(
    root: bpy.types.Object,
    name: str,
    x: float,
    y: float,
    z: float,
    width: float,
    height: float,
    trim: bpy.types.Material,
    glass: bpy.types.Material,
    split: bool = True,
) -> None:
    box(root, name + "_Glass", (width, 0.065, height), (x, y, z), glass, "window_glass", 0.018)
    border = 0.075
    box(
        root,
        name + "_Top",
        (width + border * 2, 0.08, border),
        (x, y - 0.016, z + height / 2 + border / 2),
        trim,
        "window_trim",
        0.018,
    )
    box(
        root,
        name + "_Bottom",
        (width + border * 2 + 0.08, 0.13, border),
        (x, y - 0.025, z - height / 2 - border / 2),
        trim,
        "window_sill",
        0.018,
    )
    for side in (-1, 1):
        box(
            root,
            name + f"_Side_{side}",
            (border, 0.08, height),
            (x + side * (width / 2 + border / 2), y - 0.016, z),
            trim,
            "window_trim",
            0.016,
        )
    if split:
        box(root, name + "_Mullion", (0.045, 0.078, height), (x, y - 0.02, z), trim, "window_mullion", 0.012)


def front_door(
    root: bpy.types.Object,
    name: str,
    x: float,
    y: float,
    width: float,
    height: float,
    trim: bpy.types.Material,
    panel: bpy.types.Material,
    double: bool = False,
) -> None:
    z = 0.18 + height / 2
    box(root, name + "_Recess", (width + 0.26, 0.10, height + 0.22), (x, y + 0.018, z + 0.03), panel, "door_recess", 0.025)
    box(root, name + "_Panel", (width, 0.09, height), (x, y - 0.035, z), panel, "door", 0.025)
    box(
        root,
        name + "_Transom",
        (width - 0.14, 0.055, height * 0.24),
        (x, y - 0.086, z + height * 0.24),
        trim,
        "door_glass",
        0.014,
    )
    for side in (-1, 1):
        box(
            root,
            name + f"_Jamb_{side}",
            (0.1, 0.13, height + 0.16),
            (x + side * (width / 2 + 0.08), y - 0.03, z),
            trim,
            "door_trim",
            0.02,
        )
    box(
        root,
        name + "_Lintel",
        (width + 0.3, 0.14, 0.11),
        (x, y - 0.03, 0.18 + height + 0.09),
        trim,
        "door_trim",
        0.02,
    )
    if double:
        box(root, name + "_Center", (0.055, 0.12, height), (x, y - 0.09, z), trim, "door_trim", 0.012)
    cylinder(
        root,
        name + "_Handle",
        0.035,
        0.065,
        (x + width * (0.16 if double else 0.28), y - 0.12, z - 0.05),
        trim,
        "door_hardware",
        10,
        (math.pi / 2, 0, 0),
    )


def porch(
    root: bpy.types.Object,
    name: str,
    width: float,
    y: float,
    canopy_z: float,
    wall: bpy.types.Material,
    trim: bpy.types.Material,
    roof: bpy.types.Material,
    post_count: int = 2,
) -> None:
    box(root, name + "_Stoop", (width + 0.5, 0.65, 0.16), (0, y + 0.12, 0.08), wall, "foundation", 0.03)
    # Step stays inside the canonical solid footprint.  Collision remains the
    # ASCII building tile; visual geometry never leaks into a walkable tile.
    box(root, name + "_Step", (width + 0.22, 0.25, 0.09), (0, y - 0.20, 0.045), trim, "step", 0.02)
    box(root, name + "_Canopy", (width + 0.55, 0.72, 0.12), (0, y + 0.1, canopy_z), roof, "porch_roof", 0.025, (0.07, 0, 0))
    if post_count == 2:
        positions = (-width / 2, width / 2)
    else:
        positions = tuple(-width / 2 + i * width / (post_count - 1) for i in range(post_count))
    for index, x in enumerate(positions):
        box(
            root,
            name + f"_Post_{index}",
            (0.12, 0.12, canopy_z - 0.12),
            (x, y - 0.03, (canopy_z - 0.12) / 2),
            trim,
            "porch_post",
            0.022,
        )


def gabled_portico(
    root: bpy.types.Object,
    name: str,
    x: float,
    width: float,
    wall_top: float,
    rise: float,
    wall: bpy.types.Material,
    trim: bpy.types.Material,
    roof: bpy.types.Material,
    post_count: int = 3,
) -> None:
    """Deep, footprint-safe entrance with a pitched roof and grounded steps."""
    box(
        root,
        name + "_EntryBay",
        (width - 0.34, 0.54, wall_top - 0.12),
        (x, -1.10, (wall_top - 0.12) / 2 + 0.08),
        wall,
        "entry_mass",
        0.045,
    )
    box(
        root,
        name + "_Stoop",
        (width + 0.16, 0.54, 0.16),
        (x, -1.16, 0.08),
        trim,
        "foundation",
        0.028,
    )
    box(
        root,
        name + "_Step",
        (width - 0.18, 0.15, 0.09),
        (x, -1.42, 0.045),
        trim,
        "step",
        0.018,
    )
    if post_count == 2:
        post_positions = (x - width * 0.38, x + width * 0.38)
    else:
        post_positions = tuple(
            x - width * 0.38 + index * width * 0.76 / (post_count - 1)
            for index in range(post_count)
        )
    post_height = wall_top - 0.18
    for index, post_x in enumerate(post_positions):
        box(
            root,
            name + f"_Post_{index}",
            (0.13, 0.13, post_height),
            (post_x, -1.31, post_height / 2 + 0.10),
            trim,
            "porch_post",
            0.022,
        )
    box(
        root,
        name + "_Header",
        (width - 0.12, 0.15, 0.15),
        (x, -1.31, wall_top - 0.10),
        trim,
        "porch_header",
        0.024,
    )
    portico_roof_width = width + 0.32
    portico_roof_depth = 1.18
    front_gable_roof(
        root,
        name + "_Gable",
        portico_roof_width,
        portico_roof_depth,
        wall_top,
        rise,
        roof,
        x=x,
        y=-0.88,
        role="porch_roof",
    )
    # Outline the actual projecting roof, not the facade behind it.  This
    # separates portico from main roof in the fixed high camera and produces a
    # clear Zelda-like shape hierarchy without adding another material batch.
    for side in (-1, 1):
        box(
            root,
            name + f"_SideEave_{side}",
            (0.075, portico_roof_depth, 0.085),
            (x + side * portico_roof_width / 2, -0.88, wall_top + 0.01),
            trim,
            "porch_roof_trim",
            0.014,
        )
    box(
        root,
        name + "_RidgeCap",
        (0.085, portico_roof_depth + 0.06, 0.085),
        (x, -0.88, wall_top + rise + 0.04),
        trim,
        "porch_roof_trim",
        0.014,
    )
    front_y = -0.88 - portico_roof_depth / 2
    for side in (-1, 1):
        beam_between(
            root,
            name + f"_FrontRake_{side}",
            (x + side * portico_roof_width / 2, front_y, wall_top + 0.01),
            (x, front_y, wall_top + rise + 0.04),
            0.07,
            trim,
            "porch_roof_trim",
        )


def roof_dormer(
    root: bpy.types.Object,
    name: str,
    x: float,
    y: float,
    base_z: float,
    width: float,
    depth: float,
    height: float,
    wall: bpy.types.Material,
    trim: bpy.types.Material,
    roof: bpy.types.Material,
    glass: bpy.types.Material,
    rise: float = 0.28,
) -> None:
    """Small inhabited roof volume, authored as structure rather than decal."""
    box(
        root,
        name + "_Body",
        (width, depth, height),
        (x, y, base_z + height / 2),
        wall,
        "dormer_body",
        0.035,
    )
    gable_roof(
        root,
        name + "_Roof",
        width + 0.18,
        depth + 0.20,
        base_z + height,
        rise,
        roof,
        x=x,
        y=y,
        role="dormer_roof",
    )
    front_window(
        root,
        name + "_Window",
        x,
        y - depth / 2 - 0.035,
        base_z + height * 0.54,
        width * 0.54,
        height * 0.48,
        trim,
        glass,
        True,
    )


def gutter(
    root: bpy.types.Object,
    name: str,
    width: float,
    front_y: float,
    z: float,
    mat: bpy.types.Material,
    down_x: float,
) -> None:
    cylinder(
        root,
        name + "_Channel",
        0.052,
        width,
        (0, front_y, z),
        mat,
        "gutter",
        10,
        (0, math.pi / 2, 0),
    )
    cylinder(
        root,
        name + "_Downpipe",
        0.045,
        max(0.35, z - 0.12),
        (down_x, front_y, max(0.35, z - 0.12) / 2),
        mat,
        "downpipe",
        10,
    )


def chimney(
    root: bpy.types.Object,
    name: str,
    x: float,
    y: float,
    base_z: float,
    wall: bpy.types.Material,
    trim: bpy.types.Material,
    height: float = 0.75,
) -> None:
    box(root, name + "_Body", (0.44, 0.42, height), (x, y, base_z + height / 2), wall, "chimney", 0.035)
    box(root, name + "_Cap", (0.56, 0.54, 0.12), (x, y, base_z + height + 0.03), trim, "chimney_cap", 0.028)
    box(root, name + "_Flue", (0.25, 0.23, 0.08), (x, y, base_z + height + 0.12), trim, "chimney_flue", 0.018)


def timber_frame(
    root: bpy.types.Object,
    prefix: str,
    width: float,
    wall_height: float,
    front_y: float,
    mat: bpy.types.Material,
    verticals: tuple[float, ...],
) -> None:
    for index, x in enumerate(verticals):
        box(
            root,
            prefix + f"_Vertical_{index}",
            (0.13, 0.10, wall_height - 0.12),
            (x, front_y, wall_height / 2),
            mat,
            "timber_frame",
            0.018,
        )
    for index, z in enumerate((0.3, wall_height - 0.18)):
        box(
            root,
            prefix + f"_Horizontal_{index}",
            (width - 0.18, 0.10, 0.13),
            (0, front_y, z),
            mat,
            "timber_frame",
            0.018,
        )


def sign_plate(
    root: bpy.types.Object,
    name: str,
    x: float,
    y: float,
    z: float,
    width: float,
    height: float,
    backing: bpy.types.Material,
    face: bpy.types.Material,
) -> None:
    box(root, name + "_Backing", (width + 0.14, 0.11, height + 0.14), (x, y, z), backing, "sign_backing", 0.035)
    box(root, name + "_Face", (width, 0.055, height), (x, y - 0.078, z), face, "sign_face", 0.025)


def build_sheriff(p: dict[str, bpy.types.Material]) -> bpy.types.Object:
    root = architecture_root("TP_BUILD_Sheriff")
    box(root, "Sheriff_Foundation", (10.55, 2.55, 0.24), (0, 0, 0.12), p["trim"], "foundation", 0.055)
    box(root, "Sheriff_MainHall", (10.25, 2.38, 1.20), (0, 0.03, 0.75), p["wall"], "primary_mass", 0.055)
    box(root, "Sheriff_CivicBay", (3.55, 0.52, 1.50), (0, -1.13, 0.86), p["wall"], "entry_mass", 0.045)
    hip_roof(root, "Sheriff_MainRoof", 10.75, 2.82, 1.34, 0.67, p["roof"])
    # Keep the civic gable subordinate to the cupola and windows. The earlier
    # 3.82 m / 0.64 m version erased the facade in the shipped high camera.
    gable_roof(root, "Sheriff_EntryGable", 3.15, 0.94, 1.52, 0.50, p["roof"], y=-0.88)
    roof_dormer(
        root, "Sheriff_WestDormer", -2.55, -0.55, 1.52,
        1.05, 0.58, 0.48, p["wall"], p["trim"], p["roof"], p["accent"], 0.28
    )
    roof_dormer(
        root, "Sheriff_EastDormer", 2.65, -0.55, 1.52,
        1.05, 0.58, 0.48, p["wall"], p["trim"], p["roof"], p["accent"], 0.28
    )
    porch(root, "Sheriff_Porch", 3.05, -1.15, 1.36, p["trim"], p["trim"], p["roof"], 3)
    front_door(root, "Sheriff_Door", 0, -1.33, 0.82, 0.96, p["trim"], p["accent"], True)
    for index, x in enumerate((-4.2, -3.05, -1.92, 1.92, 3.05, 4.2)):
        front_window(root, f"Sheriff_Window_{index}", x, -1.205, 0.75, 0.68, 0.54, p["trim"], p["accent"])
    timber_frame(root, "Sheriff_FacadeFrame", 10.1, 1.18, -1.205, p["trim"], (-4.92, 4.92))
    # Distinct civic lantern/cupola: reads in roof silhouette, not as signage.
    box(root, "Sheriff_CupolaBody", (1.18, 0.82, 0.58), (0.5, 0, 2.14), p["wall"], "cupola", 0.04)
    for side in (-1, 1):
        box(root, f"Sheriff_CupolaSlat_{side}", (0.16, 0.87, 0.43), (0.5 + side * 0.40, 0, 2.14), p["accent"], "cupola_louver", 0.018)
    hip_roof(root, "Sheriff_CupolaRoof", 1.48, 1.15, 2.43, 0.42, p["roof"], x=0.5)
    sign_plate(root, "Sheriff_Sign", 0, -1.36, 1.31, 1.55, 0.33, p["trim"], p["accent"])
    gutter(root, "Sheriff_Gutter", 10.4, -1.425, 1.30, p["trim"], -4.86)
    return root


def build_diner(p: dict[str, bpy.types.Material]) -> bpy.types.Object:
    root = architecture_root("TP_BUILD_DoubleR")
    box(root, "DoubleR_Foundation", (10.62, 2.56, 0.20), (0, 0, 0.10), p["trim"], "foundation", 0.06)
    box(root, "DoubleR_MainShell", (10.36, 2.38, 1.03), (0, 0.02, 0.62), p["wall"], "primary_mass", 0.10)
    barrel_roof(root, "DoubleR_StreamlinerRoof", 10.72, 2.72, 1.14, 0.56, p["roof"], 12)
    # Two asymmetrical glazed bays break generic long-box rhythm.
    box(root, "DoubleR_WestBay", (2.65, 0.42, 0.83), (-3.45, -1.16, 0.62), p["trim"], "glazed_bay", 0.10)
    box(root, "DoubleR_EastBay", (3.05, 0.44, 0.91), (3.18, -1.15, 0.64), p["trim"], "glazed_bay", 0.11)
    for index, x in enumerate((-4.05, -3.30, -2.55, 2.45, 3.25, 4.05)):
        front_window(root, f"DoubleR_Window_{index}", x, -1.405, 0.67, 0.58, 0.48, p["trim"], p["roof"], False)
    front_door(root, "DoubleR_Door", 0, -1.33, 0.78, 0.88, p["trim"], p["accent"], True)
    # Chrome canopy, red shadow line and raised roadside marquee.
    box(root, "DoubleR_Canopy", (5.0, 0.60, 0.13), (0, -1.16, 1.22), p["trim"], "canopy", 0.045, (0.06, 0, 0))
    box(root, "DoubleR_CanopyStripe", (4.72, 0.08, 0.12), (0, -1.39, 1.15), p["accent"], "canopy_accent", 0.025)
    sign_plate(root, "DoubleR_Marquee", 0, -1.36, 1.73, 2.12, 0.52, p["trim"], p["accent"])
    for side in (-1, 1):
        box(root, f"DoubleR_MarqueePost_{side}", (0.09, 0.10, 0.64), (side * 0.72, -1.34, 1.43), p["trim"], "sign_support", 0.018, (-0.16, 0, 0))
    for index, x in enumerate((-4.85, -1.15, 1.25, 4.78)):
        box(root, f"DoubleR_VerticalFin_{index}", (0.09, 0.16, 1.0), (x, -1.24, 0.62), p["trim"], "streamline_fin", 0.022)
    gutter(root, "DoubleR_Gutter", 10.42, -1.40, 1.18, p["trim"], 4.86)
    return root


def build_palmer(p: dict[str, bpy.types.Material]) -> bpy.types.Object:
    root = architecture_root("TP_BUILD_Palmer")
    box(root, "Palmer_Foundation", (9.56, 2.55, 0.22), (0, 0, 0.11), p["trim"], "foundation", 0.055)
    # One warm sheltering roof unifies the family home.  The old split
    # house/garage gables read as stacked commercial boxes from the game camera.
    box(root, "Palmer_MainHouse", (9.32, 2.36, 1.40), (0, 0.03, 0.82), p["wall"], "primary_mass", 0.06)
    hip_roof(root, "Palmer_HippedRoof", 9.72, 2.84, 1.50, 1.00, p["roof"])
    hip_roof_trim(root, "Palmer_HippedRoofTrim", 9.72, 2.84, 1.50, 1.00, p["trim"])
    gabled_portico(
        root,
        "Palmer_CrossGablePorch",
        0.18,
        2.34,
        1.70,
        0.78,
        p["wall"],
        p["trim"],
        p["roof"],
        2,
    )
    roof_dormer(
        root, "Palmer_EastDormer", 2.62, -0.50, 2.08,
        1.24, 0.68, 0.55, p["wall"], p["trim"], p["roof"], p["accent"], 0.38
    )
    front_door(root, "Palmer_Door", 0.18, -1.33, 0.72, 0.96, p["trim"], p["accent"])
    for index, (x, z, w, h) in enumerate(
        ((-4.08, 0.70, 0.64, 0.50), (-1.72, 0.72, 0.72, 0.54),
         (1.66, 0.72, 0.72, 0.54), (3.08, 0.72, 0.72, 0.54),
         (4.12, 0.72, 0.60, 0.50))
    ):
        front_window(root, f"Palmer_Window_{index}", x, -1.205, z, w, h, p["trim"], p["accent"])
    # Recessed domestic garage remains legible, but is subordinate to the roof
    # and cross-gabled front door.
    box(root, "Palmer_GarageDoor", (2.18, 0.09, 0.66), (-2.96, -1.205, 0.48), p["trim"], "garage_door", 0.025)
    for index in range(4):
        box(
            root,
            f"Palmer_GaragePanel_{index}",
            (0.43, 0.055, 0.20),
            (-3.68 + index * 0.49, -1.265, 0.54),
            p["accent"],
            "garage_panel",
            0.016,
        )
    sign_plate(root, "Palmer_FamilyPlaque", 1.20, -1.36, 0.48, 0.92, 0.24, p["trim"], p["accent"])
    chimney(root, "Palmer_Chimney", -3.72, 0.34, 1.94, p["wall"], p["trim"], 0.94)
    gutter(root, "Palmer_Gutter", 9.34, -1.43, 1.47, p["trim"], 4.38)
    return root


def build_hotel(p: dict[str, bpy.types.Material]) -> bpy.types.Object:
    root = architecture_root("TP_BUILD_GreatNorthern")
    box(root, "GreatNorthern_StonePlinth", (9.62, 2.58, 0.34), (0, 0, 0.17), p["trim"], "stone_plinth", 0.07)
    box(root, "GreatNorthern_LodgeHall", (9.28, 2.34, 1.38), (0, 0.03, 0.86), p["wall"], "primary_mass", 0.07)
    # The main lodge roof owns the silhouette; a sunk inhabited dormer replaces
    # the former teal tower stack while retaining the destination landmark.
    hip_roof(root, "GreatNorthern_MainRoof", 9.82, 2.88, 1.48, 1.18, p["roof"])
    hip_roof_trim(root, "GreatNorthern_MainRoofTrim", 9.82, 2.88, 1.48, 1.18, p["trim"])
    roof_dormer(
        root, "GreatNorthern_CentralDormer", 0, -0.46, 2.12,
        1.94, 0.84, 0.62, p["wall"], p["trim"], p["roof"], p["accent"], 0.56
    )
    gabled_portico(
        root,
        "GreatNorthern_EntryPortico",
        0,
        3.18,
        1.76,
        0.82,
        p["wall"],
        p["trim"],
        p["roof"],
        3,
    )
    front_door(root, "GreatNorthern_Door", 0, -1.33, 1.16, 1.06, p["trim"], p["accent"], True)
    # Structural timber frame spans the broad lodge facade.
    timber_frame(root, "GreatNorthern_Frame", 9.18, 1.38, -1.205, p["trim"], (-4.46, -3.02, 3.02, 4.46))
    for index, (x, z) in enumerate(
        ((-4.0, 0.80), (-2.60, 0.80), (2.60, 0.80), (4.0, 0.80))
    ):
        front_window(root, f"GreatNorthern_Window_{index}", x, -1.205, z, 0.72, 0.52, p["trim"], p["accent"])
    sign_plate(root, "GreatNorthern_Sign", 0, -1.36, 1.54, 2.32, 0.38, p["trim"], p["accent"])
    chimney(root, "GreatNorthern_Chimney", 3.55, 0.20, 2.04, p["wall"], p["trim"], 0.98)
    gutter(root, "GreatNorthern_Gutter", 9.38, -1.42, 1.46, p["trim"], -4.36)
    return root


def build_hospital(p: dict[str, bpy.types.Material]) -> bpy.types.Object:
    root = architecture_root("TP_BUILD_Hospital")
    box(root, "Hospital_Foundation", (7.68, 2.56, 0.24), (0, 0, 0.12), p["trim"], "foundation", 0.055)
    box(root, "Hospital_MainBlock", (7.42, 2.36, 1.16), (0, 0.03, 0.72), p["wall"], "primary_mass", 0.045)
    # Offset upper clinical core and glazed stair tower avoid generic flat box.
    box(root, "Hospital_UpperCore", (4.34, 1.54, 0.92), (0.72, 0.21, 1.61), p["wall"], "upper_mass", 0.045)
    box(root, "Hospital_GlassStair", (1.82, 0.46, 1.48), (-1.15, -1.11, 0.95), p["roof"], "glass_tower", 0.04)
    flat_roof(root, "Hospital_MainRoof", 7.74, 2.72, 1.28, p["roof"], p["trim"])
    box(root, "Hospital_UpperRoof", (4.56, 1.74, 0.13), (0.72, 0.21, 2.12), p["roof"], "upper_roof", 0.025)
    # Deep entrance canopy/ramp.
    box(root, "Hospital_Canopy", (3.08, 0.78, 0.13), (-1.15, -1.11, 1.39), p["trim"], "canopy", 0.035, (0.045, 0, 0))
    box(root, "Hospital_Ramp", (3.60, 0.58, 0.12), (-1.15, -1.16, 0.07), p["trim"], "ramp", 0.03, (0.018, 0, 0))
    front_door(root, "Hospital_Door", -1.15, -1.33, 1.24, 1.05, p["trim"], p["roof"], True)
    for index, x in enumerate((-3.12, -2.35, 0.28, 1.08, 1.88, 2.68, 3.40)):
        front_window(root, f"Hospital_Window_{index}", x, -1.205, 0.68, 0.50, 0.50, p["trim"], p["roof"], False)
    for index, x in enumerate((-0.55, 0.48, 1.52, 2.55)):
        front_window(root, f"Hospital_UpperWindow_{index}", x, -0.585, 1.66, 0.54, 0.40, p["trim"], p["roof"], False)
    # Roof plant, vents, and raised cross; all at distinct elevations.
    box(root, "Hospital_HVAC_A", (0.82, 0.58, 0.36), (-2.54, 0.32, 1.54), p["trim"], "roof_plant", 0.05)
    box(root, "Hospital_HVAC_B", (0.56, 0.46, 0.30), (2.92, 0.42, 1.51), p["trim"], "roof_plant", 0.045)
    for index, x in enumerate((-2.76, -2.54, -2.32)):
        box(root, f"Hospital_HVACLouver_{index}", (0.07, 0.60, 0.05), (x, 0.32, 1.73), p["roof"], "roof_louver", 0.012)
    box(root, "Hospital_CrossHorizontal", (1.02, 0.16, 0.28), (0.72, 0.20, 2.42), p["accent"], "hospital_cross", 0.04)
    box(root, "Hospital_CrossVertical", (0.28, 0.16, 1.02), (0.72, 0.20, 2.42), p["accent"], "hospital_cross", 0.04)
    sign_plate(root, "Hospital_Sign", -1.15, -1.36, 1.42, 1.82, 0.34, p["trim"], p["accent"])
    gutter(root, "Hospital_Gutter", 7.42, -1.42, 1.25, p["trim"], 3.52)
    return root


def build_roadhouse(p: dict[str, bpy.types.Material]) -> bpy.types.Object:
    root = architecture_root("TP_BUILD_Roadhouse")
    box(root, "Roadhouse_StonePlinth", (7.66, 2.56, 0.28), (0, 0, 0.14), p["trim"], "foundation", 0.065)
    box(root, "Roadhouse_MainHall", (7.38, 2.36, 1.48), (0, 0.03, 0.88), p["wall"], "primary_mass", 0.065)
    # Broad, pitched venue roof with continuous eaves.  It replaces the former
    # near-black slab and makes the cemetery foreground intentional as well.
    hip_roof(root, "Roadhouse_HippedRoof", 7.80, 2.84, 1.58, 1.18, p["roof"])
    hip_roof_trim(root, "Roadhouse_HippedRoofTrim", 7.80, 2.84, 1.58, 1.18, p["trim"])
    gabled_portico(
        root,
        "Roadhouse_EntryPortico",
        -0.50,
        3.18,
        1.72,
        0.82,
        p["wall"],
        p["trim"],
        p["roof"],
        3,
    )
    front_door(root, "Roadhouse_Door", -0.50, -1.33, 1.02, 0.98, p["trim"], p["accent"], True)
    for index, x in enumerate((-3.05, -2.18, 1.36, 2.28, 3.12)):
        front_window(root, f"Roadhouse_Window_{index}", x, -1.205, 0.72, 0.56, 0.42, p["trim"], p["accent"], False)
    timber_frame(root, "Roadhouse_Frame", 7.26, 1.46, -1.205, p["trim"], (-3.52, -1.52, 0.52, 3.52))
    sign_plate(root, "Roadhouse_Sign", -0.50, -1.36, 1.58, 1.90, 0.40, p["trim"], p["accent"])
    for side in (-1, 1):
        box(
            root,
            f"Roadhouse_NeonUnderline_{side}",
            (0.62, 0.07, 0.06),
            (-0.50 + side * 1.30, -1.405, 1.58),
            p["accent"],
            "neon",
            0.018,
        )
    # Compact hipped clerestory, sunk into the main roof instead of stacked on it.
    box(root, "Roadhouse_RoofMonitor", (2.20, 0.76, 0.38), (-0.50, 0.16, 2.64), p["wall"], "roof_monitor", 0.045)
    hip_roof(root, "Roadhouse_MonitorRoof", 2.50, 1.04, 2.83, 0.34, p["roof"], x=-0.50, y=0.16)
    for index, x in enumerate((-0.94, -0.50, -0.06)):
        front_window(
            root,
            f"Roadhouse_MonitorWindow_{index}",
            x,
            -0.255,
            2.65,
            0.28,
            0.22,
            p["trim"],
            p["accent"],
            False,
        )
    chimney(root, "Roadhouse_Chimney", 2.62, 0.24, 2.08, p["wall"], p["trim"], 1.00)
    gutter(root, "Roadhouse_Gutter", 7.38, -1.42, 1.54, p["trim"], -3.38)
    return root


def batch_by_material() -> None:
    # One mesh per material per building: at most four future draw submissions
    # per root, despite authored structural detail.
    for root_name in sorted(EXPECTED_ROOTS):
        root = bpy.data.objects[root_name]
        groups: dict[str, list[bpy.types.Object]] = {}
        for child in list(root.children):
            if child.type != "MESH" or not child.material_slots:
                continue
            mat = child.material_slots[0].material
            if mat is None:
                raise RuntimeError(f"Missing material: {child.name}")
            groups.setdefault(mat.name, []).append(child)
        if len(groups) > MAX_MATERIALS_PER_ROOT:
            raise RuntimeError(f"{root_name} uses {len(groups)} material batches")
        for mat_name, meshes in groups.items():
            bpy.ops.object.select_all(action="DESELECT")
            for obj in meshes:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = meshes[0]
            if len(meshes) > 1:
                bpy.ops.object.join()
            joined = bpy.context.object
            joined.name = f"{root_name}__{mat_name.removeprefix('TP_ARCH_MAT_')}"
            # Joining preserves the active object's transform and expresses all
            # other geometry in that local frame. Blender renders that correctly,
            # but the glTF Y-up conversion can otherwise retain a rotated batch
            # node whose axis-aligned runtime bounds cross the floor/footprint.
            # Bake the complete batch into the architecture root frame, leaving
            # every exported child with an identity transform.
            local_matrix = root.matrix_world.inverted() @ joined.matrix_world
            joined.data.transform(local_matrix)
            joined.parent = root
            joined.matrix_parent_inverse = Matrix.Identity(4)
            joined.matrix_basis = Matrix.Identity(4)
            joined.data.update()
            tag(joined, root, "material_batch")
            triangulate = joined.modifiers.new(name="TP_ARCH_Triangulate", type="TRIANGULATE")
            triangulate.keep_custom_normals = True
            bpy.context.view_layer.objects.active = joined
            joined.select_set(True)
            bpy.ops.object.modifier_apply(modifier=triangulate.name)
            joined.select_set(False)


def descendants(root: bpy.types.Object) -> list[bpy.types.Object]:
    found: list[bpy.types.Object] = []
    stack = list(root.children)
    while stack:
        obj = stack.pop()
        found.append(obj)
        stack.extend(obj.children)
    return found


def root_bounds(root: bpy.types.Object) -> tuple[Vector, Vector]:
    points: list[Vector] = []
    root_inverse = root.matrix_world.inverted()
    for obj in descendants(root):
        if obj.type != "MESH":
            continue
        # Joined batches may have a rotated active-object frame; object.bound_box
        # then overestimates the occupied footprint.  Actual vertices prove the
        # geometry contract exactly.
        for vertex in obj.data.vertices:
            points.append(root_inverse @ obj.matrix_world @ vertex.co)
    if not points:
        raise RuntimeError(f"No mesh descendants under {root.name}")
    mins = Vector(tuple(min(point[i] for point in points) for i in range(3)))
    maxs = Vector(tuple(max(point[i] for point in points) for i in range(3)))
    return mins, maxs


def manifold_report(obj: bpy.types.Object) -> dict[str, object]:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    boundary = sum(1 for edge in bm.edges if edge.is_boundary)
    non_manifold = sum(1 for edge in bm.edges if not edge.is_manifold)
    degenerate = sum(1 for face in bm.faces if face.calc_area() < 1e-9)
    bm.free()
    return {
        "boundary_edges": boundary,
        "non_manifold_edges": non_manifold,
        "degenerate_faces": degenerate,
    }


def duplicate_face_planes(obj: bpy.types.Object) -> int:
    # Exact duplicate coplanar faces cause deterministic z-fighting.  Distinct
    # parallel faces are allowed; key includes centre and normal.
    seen: set[tuple[int, ...]] = set()
    duplicates = 0
    for polygon in obj.data.polygons:
        center = polygon.center
        normal = polygon.normal
        key = tuple(round(value * 100_000) for value in (*center, *normal))
        if key in seen:
            duplicates += 1
        seen.add(key)
    return duplicates


def validate_source() -> dict[str, object]:
    roots = {
        obj.name
        for obj in bpy.context.scene.objects
        if obj.type == "EMPTY" and obj.name.startswith("TP_BUILD_")
    }
    if roots != EXPECTED_ROOTS:
        raise RuntimeError(
            f"Root mismatch: missing={sorted(EXPECTED_ROOTS - roots)}, "
            f"unexpected={sorted(roots - EXPECTED_ROOTS)}"
        )
    per_root: dict[str, object] = {}
    total_triangles = 0
    for root_name in sorted(roots):
        root = bpy.data.objects[root_name]
        if root.location.length > 1e-8:
            raise RuntimeError(f"{root_name} pivot is not at origin")
        meshes = [obj for obj in descendants(root) if obj.type == "MESH"]
        materials = sorted(
            {
                slot.material.name
                for obj in meshes
                for slot in obj.material_slots
                if slot.material
            }
        )
        if len(materials) > MAX_MATERIALS_PER_ROOT:
            raise RuntimeError(f"{root_name} exceeds material budget: {len(materials)}")
        triangles = sum(len(poly.vertices) - 2 for obj in meshes for poly in obj.data.polygons)
        total_triangles += triangles
        mins, maxs = root_bounds(root)
        footprint = BUILDINGS[root_name]["footprint"]
        if mins.x < -footprint[0] / 2 - 0.01 or maxs.x > footprint[0] / 2 + 0.01:
            raise RuntimeError(f"{root_name} exceeds footprint width: {mins.x:.3f}..{maxs.x:.3f}")
        if mins.y < -footprint[1] / 2 - 0.01 or maxs.y > footprint[1] / 2 + 0.01:
            raise RuntimeError(f"{root_name} exceeds footprint depth: {mins.y:.3f}..{maxs.y:.3f}")
        if mins.z < -0.015:
            raise RuntimeError(f"{root_name} falls below floor: {mins.z:.4f}")
        manifold = [manifold_report(obj) for obj in meshes]
        if any(report["non_manifold_edges"] or report["degenerate_faces"] for report in manifold):
            raise RuntimeError(f"{root_name} has invalid mesh topology: {manifold}")
        duplicate_planes = sum(duplicate_face_planes(obj) for obj in meshes)
        if duplicate_planes:
            raise RuntimeError(f"{root_name} has {duplicate_planes} exact duplicate face planes")
        per_root[root_name] = {
            "kind": BUILDINGS[root_name]["kind"],
            "pivot": list(root.location),
            "origin": root["tp_origin"],
            "forward": root["tp_forward"],
            "footprint": list(footprint),
            "bounds_min": [round(v, 4) for v in mins],
            "bounds_max": [round(v, 4) for v in maxs],
            "height": round(maxs.z - mins.z, 4),
            "triangles": triangles,
            "mesh_batches": len(meshes),
            "materials": materials,
            "material_count": len(materials),
            "manifold": manifold,
            "duplicate_face_planes": duplicate_planes,
            "normals": "weighted_baked",
        }
    if total_triangles > MAX_TRIANGLES:
        raise RuntimeError(f"Triangle budget exceeded: {total_triangles} > {MAX_TRIANGLES}")
    return {"triangles": total_triangles, "per_root": per_root}


def export_glb() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for root_name in EXPECTED_ROOTS:
        root = bpy.data.objects[root_name]
        root.select_set(True)
        for obj in descendants(root):
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_extras=True,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
    )


def glb_json(path: Path) -> dict[str, object]:
    raw = path.read_bytes()
    if len(raw) < 20 or raw[:4] != b"glTF":
        raise RuntimeError("Export is not a valid GLB container")
    version, length = struct.unpack_from("<II", raw, 4)
    if version != 2 or length != len(raw):
        raise RuntimeError(f"Invalid GLB header: version={version} length={length}/{len(raw)}")
    chunk_length, chunk_type = struct.unpack_from("<II", raw, 12)
    if chunk_type != 0x4E4F534A:
        raise RuntimeError("First GLB chunk is not JSON")
    return json.loads(raw[20 : 20 + chunk_length].decode("utf-8").rstrip(" \0"))


def validate_export(source_stats: dict[str, object]) -> dict[str, object]:
    if not OUTPUT_PATH.exists():
        raise RuntimeError("GLB was not exported")
    size = OUTPUT_PATH.stat().st_size
    if size > MAX_BYTES:
        raise RuntimeError(f"GLB size budget exceeded: {size} > {MAX_BYTES}")
    document = glb_json(OUTPUT_PATH)
    node_names = {node.get("name") for node in document.get("nodes", [])}
    missing = EXPECTED_ROOTS - node_names
    if missing:
        raise RuntimeError(f"Exported GLB missing roots: {sorted(missing)}")
    required_extensions = document.get("extensionsRequired", [])
    unsupported = [
        ext
        for ext in required_extensions
        if ext not in {"KHR_materials_clearcoat", "KHR_materials_transmission"}
    ]
    if unsupported:
        raise RuntimeError(f"r147-unsafe required extensions: {unsupported}")
    return {
        "schema": "twin-peaks.architecture-asset-validation.v1",
        "status": "asset-ready-for-integration-review",
        "file": str(OUTPUT_PATH),
        "bytes": size,
        "max_bytes": MAX_BYTES,
        "roots": sorted(EXPECTED_ROOTS),
        "root_count": len(EXPECTED_ROOTS),
        "triangles": source_stats["triangles"],
        "max_triangles": MAX_TRIANGLES,
        "per_root": source_stats["per_root"],
        "gltf": {
            "asset": document.get("asset", {}),
            "scenes": len(document.get("scenes", [])),
            "nodes": len(document.get("nodes", [])),
            "meshes": len(document.get("meshes", [])),
            "materials": len(document.get("materials", [])),
            "textures": len(document.get("textures", [])),
            "images": len(document.get("images", [])),
            "extensions_used": document.get("extensionsUsed", []),
            "extensions_required": required_extensions,
            "r147_loader_safe": not unsupported,
        },
        "constraints": {
            "ascii_collision_unchanged": True,
            "camera_unchanged": True,
            "maps_unchanged": True,
            "max_materials_per_root": MAX_MATERIALS_PER_ROOT,
            "no_exact_duplicate_face_planes": True,
            "weighted_normals_baked": True,
            "bevels_baked": True,
            "draco": False,
            "meshopt": False,
        },
    }


def configure_preview_scene() -> tuple[bpy.types.Object, bpy.types.Object]:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.world.color = (0.025, 0.035, 0.042)
    scene.view_settings.look = "AgX - Medium High Contrast"

    ground_mat = material("TP_PREVIEW_Ground", (0.09, 0.13, 0.10, 1), 0.9)
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, -0.015))
    ground = bpy.context.object
    ground.name = "TP_PREVIEW_Ground"
    ground.scale = (18, 9, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ground.data.materials.append(ground_mat)

    bpy.ops.object.light_add(type="AREA", location=(-8, -10, 14))
    key = bpy.context.object
    key.name = "TP_PREVIEW_Key"
    key.data.energy = 1800
    key.data.shape = "DISK"
    key.data.size = 7
    key.data.color = (0.82, 0.91, 1.0)

    bpy.ops.object.light_add(type="AREA", location=(11, -1, 9))
    fill = bpy.context.object
    fill.name = "TP_PREVIEW_Fill"
    fill.data.energy = 1150
    fill.data.size = 8
    fill.data.color = (0.60, 0.72, 0.82)

    bpy.ops.object.light_add(type="AREA", location=(1, 9, 8))
    rim = bpy.context.object
    rim.name = "TP_PREVIEW_Rim"
    rim.data.energy = 1350
    rim.data.size = 6
    rim.data.color = (1.0, 0.64, 0.38)

    bpy.ops.object.camera_add(location=(0, -14, 7))
    camera = bpy.context.object
    camera.name = "TP_PREVIEW_Camera"
    camera.data.lens = 56
    camera.data.sensor_width = 36
    scene.camera = camera
    return camera, ground


def aim(camera: bpy.types.Object, target: tuple[float, float, float]) -> None:
    camera.rotation_euler = (
        Vector(target) - camera.location
    ).to_track_quat("-Z", "Y").to_euler()


def render_previews() -> list[str]:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    camera, ground = configure_preview_scene()
    scene = bpy.context.scene
    roots = [bpy.data.objects[name] for name in sorted(EXPECTED_ROOTS)]
    preview_files: list[str] = []

    # Six close hero frames: critic can judge facade, roof, silhouette and entry.
    for root in roots:
        for candidate in roots:
            hidden = candidate is not root
            candidate.hide_render = hidden
            for child in descendants(candidate):
                child.hide_render = hidden
            candidate.location = (0, 0, 0)
        camera.location = (7.2, -9.8, 6.2)
        aim(camera, (0, 0, 1.1))
        filename = PREVIEW_DIR / f"hero-{BUILDINGS[root.name]['kind']}.png"
        scene.render.filepath = str(filename)
        bpy.ops.render.render(write_still=True)
        preview_files.append(str(filename))

    # Full-kit turntable.  Roots arranged after export; exported pivots remain 0.
    placements = {
        "TP_BUILD_Sheriff": (-11.5, 3.1, 0),
        "TP_BUILD_DoubleR": (0, 3.1, 0),
        "TP_BUILD_Palmer": (10.8, 3.1, 0),
        "TP_BUILD_GreatNorthern": (-10.8, -3.4, 0),
        "TP_BUILD_Hospital": (0, -3.4, 0),
        "TP_BUILD_Roadhouse": (9.4, -3.4, 0),
    }
    for root in roots:
        root.hide_render = False
        for child in descendants(root):
            child.hide_render = False
        root.location = placements[root.name]
    ground.scale = (2.0, 1.3, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for index in range(8):
        angle = math.tau * index / 8 - math.pi / 2
        camera.location = (
            math.cos(angle) * 28,
            math.sin(angle) * 28,
            16.5,
        )
        aim(camera, (0, 0, 1.0))
        filename = PREVIEW_DIR / f"turntable-{index:02d}.png"
        scene.render.filepath = str(filename)
        bpy.ops.render.render(write_still=True)
        preview_files.append(str(filename))
    return preview_files


def build_scene() -> None:
    clear_scene()
    palettes = make_palettes()
    build_sheriff(palettes["sheriff"])
    build_diner(palettes["diner"])
    build_palmer(palettes["palmer"])
    build_hotel(palettes["hotel"])
    build_hospital(palettes["hospital"])
    build_roadhouse(palettes["roadhouse"])
    batch_by_material()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"
    scene["tp_asset"] = "Twin Peaks authored architecture vertical slice"
    scene["tp_version"] = "1.0.0"
    scene["tp_coordinate_contract"] = "floor_center; forward=-Y; footprint=ASCII"


def main() -> None:
    build_scene()
    source_stats = validate_source()
    export_glb()
    validation = validate_export(source_stats)
    previews = render_previews()
    validation["preview_dir"] = str(PREVIEW_DIR)
    validation["previews"] = previews
    VALIDATION_PATH.write_text(
        json.dumps(validation, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print("TP_ARCHITECTURE_VALIDATION=" + json.dumps(validation, sort_keys=True))


if __name__ == "__main__":
    main()
