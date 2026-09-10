"""Generate an authored Twin Peaks character vertical slice.

Run from the project root (or anywhere):
    blender --background --python tools/generate_character_slice.py

The GLB deliberately remains runtime-neutral.  It contains two floor-origin
character roots, Cooper and a neutral NPC base, but does not modify or assume
the current Three.js renderer.  Static mesh quality is prioritized over
shipping a brittle placeholder rig.
"""

from __future__ import annotations

import json
import math
import subprocess
from pathlib import Path

import bpy
from mathutils import Vector


PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "assets" / "models" / "twin-peaks-character-slice.glb"
PREVIEW_PATH = Path("/tmp/twin-peaks-character-slice-preview-4.png")
REJECTED_PREVIEW_PATH = Path("/tmp/twin-peaks-character-slice-preview-3.png")
COMPARISON_PATH = Path("/tmp/twin-peaks-character-slice-before-after-4.png")
PREVIEW_ANGLES = (
    Path("/tmp/twin-peaks-character-slice-front-4.png"),
    Path("/tmp/twin-peaks-character-slice-three-quarter-4.png"),
    Path("/tmp/twin-peaks-character-slice-profile-4.png"),
)
EXPECTED_ROOTS = {"TP_CHAR_Cooper", "TP_CHAR_NPC_Base"}


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.armatures,
        bpy.data.actions,
    ):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float,
    metallic: float = 0.0,
    specular: float = 0.32,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "IOR Level" in bsdf.inputs:
        bsdf.inputs["IOR Level"].default_value = specular
    return mat


def make_palette() -> dict[str, bpy.types.Material]:
    # Saturation is intentionally below the current procedural actors.  Cloth
    # stays broad/rough; only eye highlights, badge and shoe eyelets sharpen.
    return {
        "skin": material("TP_CHAR_MAT_Skin", (0.63, 0.33, 0.22, 1), 0.61, specular=0.36),
        "skin_warm": material("TP_CHAR_MAT_SkinWarm", (0.76, 0.45, 0.30, 1), 0.57, specular=0.38),
        "skin_shadow": material("TP_CHAR_MAT_SkinShadow", (0.43, 0.18, 0.12, 1), 0.68, specular=0.30),
        "hair_dark": material("TP_CHAR_MAT_HairCharcoal", (0.018, 0.024, 0.030, 1), 0.68, specular=0.20),
        "hair_brown": material("TP_CHAR_MAT_HairChestnut", (0.14, 0.052, 0.026, 1), 0.66, specular=0.22),
        "eye_white": material("TP_CHAR_MAT_EyeWhite", (0.82, 0.84, 0.80, 1), 0.22, specular=0.55),
        "eye_dark": material("TP_CHAR_MAT_EyeDark", (0.012, 0.018, 0.022, 1), 0.18, specular=0.62),
        "iris": material("TP_CHAR_MAT_IrisHazel", (0.18, 0.24, 0.18, 1), 0.24, specular=0.52),
        "mouth": material("TP_CHAR_MAT_Mouth", (0.29, 0.055, 0.045, 1), 0.78),
        "suit": material("TP_CHAR_MAT_SuitCharcoal", (0.055, 0.065, 0.075, 1), 0.90, specular=0.20),
        "suit_lapel": material("TP_CHAR_MAT_SuitLapel", (0.085, 0.10, 0.11, 1), 0.82, specular=0.25),
        "suit_seam": material("TP_CHAR_MAT_SuitSeam", (0.025, 0.031, 0.038, 1), 0.94, specular=0.16),
        "shirt": material("TP_CHAR_MAT_ShirtIvory", (0.78, 0.76, 0.67, 1), 0.82, specular=0.24),
        "tie": material("TP_CHAR_MAT_TieOxblood", (0.31, 0.025, 0.035, 1), 0.76),
        "shoe": material("TP_CHAR_MAT_ShoeBlack", (0.018, 0.022, 0.024, 1), 0.25, 0.18, 0.48),
        "sole": material("TP_CHAR_MAT_Sole", (0.01, 0.012, 0.012, 1), 0.96),
        "metal": material("TP_CHAR_MAT_BrushedMetal", (0.33, 0.36, 0.35, 1), 0.30, 0.62),
        "brass": material("TP_CHAR_MAT_BadgeBrass", (0.53, 0.34, 0.085, 1), 0.28, 0.72),
        "coffee": material("TP_CHAR_MAT_Coffee", (0.055, 0.017, 0.008, 1), 0.22),
        "ceramic": material("TP_CHAR_MAT_CeramicCream", (0.72, 0.68, 0.57, 1), 0.26),
        "npc_jacket": material("TP_CHAR_MAT_NPCJacketSage", (0.18, 0.28, 0.24, 1), 0.89, specular=0.18),
        "npc_jacket_light": material("TP_CHAR_MAT_NPCJacketTrim", (0.27, 0.38, 0.32, 1), 0.83, specular=0.22),
        "npc_jacket_dark": material("TP_CHAR_MAT_NPCJacketShadow", (0.105, 0.17, 0.145, 1), 0.93, specular=0.15),
        "npc_shirt": material("TP_CHAR_MAT_NPCShirtBlue", (0.22, 0.35, 0.43, 1), 0.89),
        "npc_trouser": material("TP_CHAR_MAT_NPCTrouserClay", (0.25, 0.18, 0.14, 1), 0.94),
        "npc_scarf": material("TP_CHAR_MAT_NPCScarfMustard", (0.55, 0.32, 0.08, 1), 0.90),
    }


def shade_smooth(obj: bpy.types.Object) -> None:
    if obj.type != "MESH":
        return
    for polygon in obj.data.polygons:
        polygon.use_smooth = True


def apply_bevel(obj: bpy.types.Object, width: float, segments: int = 2) -> None:
    if width <= 0:
        return
    bevel = obj.modifiers.new(name="TP_CHAR_SoftEdge", type="BEVEL")
    bevel.width = width
    bevel.segments = segments
    bevel.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.select_set(False)


def tapered_box(
    character_root: bpy.types.Object,
    name: str,
    bottom: tuple[float, float],
    top: tuple[float, float],
    depth: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    bevel: float = 0.035,
    role: str = "costume",
    rot: tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    """Beveled garment/anatomy block, narrower at one end than the other."""
    bx, by = bottom[0] / 2, bottom[1] / 2
    tx, ty = top[0] / 2, top[1] / 2
    z0, z1 = -depth / 2, depth / 2
    vertices = [
        (-bx, -by, z0),
        (bx, -by, z0),
        (bx, by, z0),
        (-bx, by, z0),
        (-tx, -ty, z1),
        (tx, -ty, z1),
        (tx, ty, z1),
        (-tx, ty, z1),
    ]
    faces = [
        (0, 3, 2, 1),
        (4, 5, 6, 7),
        (0, 1, 5, 4),
        (1, 2, 6, 5),
        (2, 3, 7, 6),
        (3, 0, 4, 7),
    ]
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    apply_bevel(obj, min(bevel, min(bottom + top) * 0.12), 3)
    obj.data.materials.append(mat)
    obj.parent = character_root
    obj.location = loc
    obj.rotation_euler = rot
    tag(obj, character_root, role)
    shade_smooth(obj)
    return obj


def shoe_wedge(
    character_root: bpy.types.Object,
    name: str,
    width: float,
    length: float,
    height: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    role: str = "shoe",
) -> bpy.types.Object:
    """Rounded dress-shoe upper with a lower heel and tapered front toe."""
    hw, hl = width / 2, length / 2
    toe_w = hw * 0.82
    vertices = [
        (-hw, -hl, -height / 2),
        (hw, -hl, -height / 2),
        (hw, hl, -height / 2),
        (-hw, hl, -height / 2),
        (-toe_w, -hl, height * 0.18),
        (toe_w, -hl, height * 0.18),
        (hw * 0.92, hl, height / 2),
        (-hw * 0.92, hl, height / 2),
    ]
    faces = [
        (0, 3, 2, 1),
        (4, 5, 6, 7),
        (0, 1, 5, 4),
        (1, 2, 6, 5),
        (2, 3, 7, 6),
        (3, 0, 4, 7),
    ]
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    apply_bevel(obj, min(0.035, width * 0.13), 3)
    obj.data.materials.append(mat)
    obj.parent = character_root
    obj.location = loc
    tag(obj, character_root, role)
    return obj


def root(name: str, location: tuple[float, float, float], role: str) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.empty_display_type = "CIRCLE"
    obj.empty_display_size = 0.28
    obj["tp_asset_type"] = "character"
    obj["tp_character_role"] = role
    obj["tp_units"] = "meters"
    obj["tp_origin"] = "floor_center"
    obj["tp_forward"] = "-Y"
    obj["tp_static_vertical_slice"] = True
    return obj


def tag(obj: bpy.types.Object, character_root: bpy.types.Object, role: str) -> None:
    obj["tp_character_root"] = character_root.name
    obj["tp_component_role"] = role


def box(
    character_root: bpy.types.Object,
    name: str,
    size: tuple[float, float, float],
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    bevel: float = 0.025,
    rot: tuple[float, float, float] = (0, 0, 0),
    role: str = "costume",
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_bevel(obj, min(bevel, min(size) * 0.22), 2)
    obj.data.materials.append(mat)
    obj.parent = character_root
    obj.location = loc
    obj.rotation_euler = rot
    tag(obj, character_root, role)
    shade_smooth(obj)
    return obj


def cone(
    character_root: bpy.types.Object,
    name: str,
    radius1: float,
    radius2: float,
    depth: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    vertices: int = 10,
    rot: tuple[float, float, float] = (0, 0, 0),
    role: str = "body",
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius1,
        radius2=radius2,
        depth=depth,
        location=(0, 0, 0),
    )
    obj = bpy.context.object
    obj.name = name
    apply_bevel(obj, min(0.018, radius1 * 0.08, depth * 0.04), 2)
    obj.data.materials.append(mat)
    obj.parent = character_root
    obj.location = loc
    obj.rotation_euler = rot
    tag(obj, character_root, role)
    shade_smooth(obj)
    return obj


def cylinder(
    character_root: bpy.types.Object,
    name: str,
    radius: float,
    depth: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    vertices: int = 10,
    rot: tuple[float, float, float] = (0, 0, 0),
    role: str = "detail",
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=(0, 0, 0)
    )
    obj = bpy.context.object
    obj.name = name
    apply_bevel(obj, min(0.014, radius * 0.1, depth * 0.05), 2)
    obj.data.materials.append(mat)
    obj.parent = character_root
    obj.location = loc
    obj.rotation_euler = rot
    tag(obj, character_root, role)
    return obj


def sphere(
    character_root: bpy.types.Object,
    name: str,
    radius: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    scale: tuple[float, float, float] = (1, 1, 1),
    subdivisions: int = 2,
    role: str = "anatomy",
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=subdivisions, radius=radius, location=(0, 0, 0)
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    obj.parent = character_root
    obj.location = loc
    tag(obj, character_root, role)
    shade_smooth(obj)
    return obj


def capsule(
    character_root: bpy.types.Object,
    name: str,
    radius: float,
    length: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    rot: tuple[float, float, float] = (0, 0, 0),
    role: str = "anatomy",
) -> bpy.types.Object:
    """Soft low-poly limb; keeps rounded joints without cylinder end caps."""
    obj = sphere(
        character_root,
        name,
        1.0,
        loc,
        mat,
        (radius, radius * 0.92, length * 0.5),
        2,
        role,
    )
    obj.rotation_euler = rot
    return obj


def tapered_capsule(
    character_root: bpy.types.Object,
    name: str,
    bottom_radius: float,
    top_radius: float,
    length: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    rot: tuple[float, float, float] = (0, 0, 0),
    depth_scale: float = 0.92,
    role: str = "arm",
) -> bpy.types.Object:
    """Continuous rounded sleeve/limb with different wrist and shoulder radii."""
    segments = 12
    cap = min(length * 0.15, max(bottom_radius, top_radius) * 0.72)
    half = length / 2
    rings = (
        (-half + cap, bottom_radius * 0.72),
        (-length * 0.18, bottom_radius * 0.90 + top_radius * 0.10),
        (0.0, (bottom_radius + top_radius) * 0.50),
        (length * 0.18, bottom_radius * 0.10 + top_radius * 0.90),
        (half - cap, top_radius * 0.72),
    )
    vertices: list[tuple[float, float, float]] = [(0, 0, -half)]
    for z, radius in rings:
        for segment in range(segments):
            angle = segment / segments * math.tau
            vertices.append(
                (math.cos(angle) * radius, math.sin(angle) * radius * depth_scale, z)
            )
    top_index = len(vertices)
    vertices.append((0, 0, half))

    faces: list[tuple[int, ...]] = []
    first_ring = 1
    for segment in range(segments):
        nxt = (segment + 1) % segments
        faces.append((0, first_ring + nxt, first_ring + segment))
    for ring_index in range(len(rings) - 1):
        current = 1 + ring_index * segments
        following = current + segments
        for segment in range(segments):
            nxt = (segment + 1) % segments
            faces.append(
                (
                    current + segment,
                    current + nxt,
                    following + nxt,
                    following + segment,
                )
            )
    last_ring = 1 + (len(rings) - 1) * segments
    for segment in range(segments):
        nxt = (segment + 1) % segments
        faces.append((last_ring + segment, last_ring + nxt, top_index))

    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = character_root
    obj.location = loc
    obj.rotation_euler = rot
    tag(obj, character_root, role)
    shade_smooth(obj)
    return obj


def curved_sleeve(
    character_root: bpy.types.Object,
    name: str,
    path: tuple[tuple[float, float, float, float], ...],
    mat: bpy.types.Material,
    depth_scale: float = 0.92,
) -> bpy.types.Object:
    """Single continuous shoulder-to-wrist sleeve following a gentle 3D curve."""
    segments = 12
    vertices: list[tuple[float, float, float]] = []
    for center_x, center_y, center_z, radius in path:
        for segment in range(segments):
            angle = segment / segments * math.tau
            vertices.append(
                (
                    center_x + math.cos(angle) * radius,
                    center_y + math.sin(angle) * radius * depth_scale,
                    center_z,
                )
            )
    faces: list[tuple[int, ...]] = []
    for ring_index in range(len(path) - 1):
        current = ring_index * segments
        following = current + segments
        for segment in range(segments):
            nxt = (segment + 1) % segments
            faces.append(
                (
                    current + segment,
                    current + nxt,
                    following + nxt,
                    following + segment,
                )
            )
    faces.append(tuple(reversed(range(segments))))
    last_ring = (len(path) - 1) * segments
    faces.append(tuple(last_ring + segment for segment in range(segments)))

    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = character_root
    tag(obj, character_root, "arm")
    shade_smooth(obj)
    return obj


def hand(
    character_root: bpy.types.Object,
    p: dict[str, bpy.types.Material],
    prefix: str,
    side: int,
    loc: tuple[float, float, float],
    grip: bool = False,
) -> None:
    """Readable mitten/palm volume plus a distinct thumb at dialogue scale."""
    x, y, z = loc
    sphere(character_root, prefix + "_Palm", 1.0, (x, y, z + 0.012), p["skin_warm"], (0.064, 0.056, 0.074), 2, "hand")
    finger_mass = sphere(
        character_root,
        prefix + "_FingerMass",
        1.0,
        (x, y - (0.014 if grip else 0), z - 0.040),
        p["skin_warm"],
        (0.060, 0.051, 0.055),
        2,
        "hand",
    )
    finger_mass.rotation_euler.x = 0.13 if grip else 0
    sphere(
        character_root,
        prefix + "_Thumb",
        1.0,
        (x + side * 0.050, y - 0.018, z + 0.010),
        p["skin"],
        (0.024, 0.020, 0.050),
        2,
        "hand",
    )


def torus(
    character_root: bpy.types.Object,
    name: str,
    major_radius: float,
    minor_radius: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    rot: tuple[float, float, float] = (0, 0, 0),
    scale: tuple[float, float, float] = (1, 1, 1),
    role: str = "prop",
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=12,
        minor_segments=6,
        location=(0, 0, 0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    obj.parent = character_root
    obj.location = loc
    obj.rotation_euler = rot
    tag(obj, character_root, role)
    shade_smooth(obj)
    return obj


def prism(
    character_root: bpy.types.Object,
    name: str,
    points_xz: tuple[tuple[float, float], tuple[float, float], tuple[float, float]],
    depth: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    role: str = "costume",
) -> bpy.types.Object:
    """Create a triangular prism facing -Y, useful for lapels and collars."""
    vertices = []
    for y in (-depth / 2, depth / 2):
        vertices.extend((x, y, z) for x, z in points_xz)
    faces = [
        (0, 2, 1),
        (3, 4, 5),
        (0, 1, 4, 3),
        (1, 2, 5, 4),
        (2, 0, 3, 5),
    ]
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    apply_bevel(obj, min(0.007, depth * 0.16), 2)
    obj.data.materials.append(mat)
    obj.parent = character_root
    obj.location = loc
    tag(obj, character_root, role)
    return obj


def panel(
    character_root: bpy.types.Object,
    name: str,
    points_xz: tuple[tuple[float, float], ...],
    depth: float,
    loc: tuple[float, float, float],
    mat: bpy.types.Material,
    role: str = "costume",
) -> bpy.types.Object:
    """Extruded garment panel for layered lapels, collars and pocket flaps."""
    count = len(points_xz)
    if count < 3:
        raise ValueError("panel needs at least three points")
    vertices = []
    for y in (-depth / 2, depth / 2):
        vertices.extend((x, y, z) for x, z in points_xz)
    faces: list[tuple[int, ...]] = [
        tuple(reversed(range(count))),
        tuple(range(count, count * 2)),
    ]
    for index in range(count):
        nxt = (index + 1) % count
        faces.append((index, nxt, count + nxt, count + index))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    apply_bevel(obj, min(0.008, depth * 0.16), 2)
    obj.data.materials.append(mat)
    obj.parent = character_root
    obj.location = loc
    tag(obj, character_root, role)
    return obj


def eye(
    r: bpy.types.Object,
    p: dict[str, bpy.types.Material],
    prefix: str,
    x: float,
    z: float,
    iris_shift: float = 0.0,
) -> None:
    # Small inset sclera under curved skin volumes; no dark ring or box frame.
    sphere(r, prefix + "_Sclera", 1.0, (x, -0.300, z), p["eye_white"], (0.070, 0.011, 0.041), 2, "face")
    sphere(r, prefix + "_Iris", 1.0, (x + iris_shift, -0.311, z - 0.003), p["iris"], (0.028, 0.005, 0.029), 2, "face")
    sphere(r, prefix + "_Pupil", 1.0, (x + iris_shift, -0.316, z - 0.003), p["eye_dark"], (0.013, 0.003, 0.015), 1, "face")
    sphere(r, prefix + "_Catchlight", 1.0, (x + iris_shift - 0.007, -0.319, z + 0.007), p["eye_white"], (0.005, 0.002, 0.005), 1, "face")
    sphere(r, prefix + "_UpperLid", 1.0, (x, -0.314, z + 0.038), p["skin_warm"], (0.074, 0.006, 0.009), 2, "face")
    sphere(r, prefix + "_LowerLid", 1.0, (x, -0.312, z - 0.037), p["skin"], (0.058, 0.005, 0.005), 2, "face")


def cooper(p: dict[str, bpy.types.Material], position: tuple[float, float, float]) -> None:
    r = root("TP_CHAR_Cooper", position, "protagonist")

    # A compact heroic silhouette: planted dress shoes, long trouser line,
    # tapered waist and an unmistakable squared FBI jacket.
    for side in (-1, 1):
        x = side * 0.145
        box(r, f"Cooper_Sole_{side}", (0.23, 0.37, 0.055), (x, -0.045, 0.035), p["sole"], 0.018, role="shoe")
        shoe_wedge(r, f"Cooper_Shoe_{side}", 0.22, 0.36, 0.15, (x, -0.075, 0.125), p["shoe"])
        tapered_box(r, f"Cooper_Trouser_{side}", (0.19, 0.22), (0.225, 0.255), 0.53, (x, 0.01, 0.43), p["suit"], 0.03, "leg")
        box(r, f"Cooper_TrouserBreak_{side}", (0.20, 0.225, 0.045), (x, -0.005, 0.19), p["suit_lapel"], 0.012, role="leg")
        box(r, f"Cooper_ShoeVamp_{side}", (0.11, 0.015, 0.055), (x, -0.256, 0.15), p["shoe"], 0.006, role="shoe")
        box(r, f"Cooper_Heel_{side}", (0.18, 0.105, 0.055), (x, 0.095, 0.066), p["sole"], 0.012, role="shoe")
        box(r, f"Cooper_ToeCapSeam_{side}", (0.17, 0.011, 0.018), (x, -0.244, 0.125), p["suit_seam"], 0.004, role="shoe")

    tapered_box(r, "Cooper_Hips", (0.43, 0.29), (0.49, 0.32), 0.23, (0, 0.01, 0.72), p["suit"], 0.055, "body")
    tapered_box(r, "Cooper_JacketBody", (0.52, 0.31), (0.65, 0.35), 0.56, (0, 0.015, 1.00), p["suit"], 0.055, "body")
    box(r, "Cooper_JacketTail", (0.54, 0.285, 0.16), (0, 0.055, 0.75), p["suit"], 0.045, role="costume")
    box(r, "Cooper_ShirtFront", (0.205, 0.028, 0.39), (0, -0.177, 1.10), p["shirt"], 0.009, role="costume")
    panel(r, "Cooper_Lapel_L", ((-0.29, 0.24), (-0.12, 0.25), (-0.035, -0.055), (-0.095, -0.08), (-0.20, 0.08)), 0.040, (0, -0.180, 1.07), p["suit_lapel"])
    panel(r, "Cooper_Lapel_R", ((0.29, 0.24), (0.12, 0.25), (0.035, -0.055), (0.095, -0.08), (0.20, 0.08)), 0.040, (0, -0.180, 1.07), p["suit_lapel"])
    prism(r, "Cooper_ShirtCollar_L", ((-0.105, 0.095), (-0.012, 0.075), (-0.055, -0.025)), 0.030, (0, -0.198, 1.225), p["shirt"])
    prism(r, "Cooper_ShirtCollar_R", ((0.105, 0.095), (0.012, 0.075), (0.055, -0.025)), 0.030, (0, -0.198, 1.225), p["shirt"])
    prism(r, "Cooper_TieKnot", ((-0.045, 0.045), (0.045, 0.045), (0, -0.025)), 0.027, (0, -0.213, 1.285), p["tie"])
    prism(r, "Cooper_Tie", ((-0.034, 0.17), (0.034, 0.17), (0, -0.14)), 0.027, (0, -0.214, 1.075), p["tie"])
    box(r, "Cooper_BreastPocket", (0.145, 0.018, 0.025), (0.205, -0.170, 1.16), p["suit_seam"], 0.005, (0, 0, -0.03), "costume")
    sphere(r, "Cooper_Badge", 0.041, (0.22, -0.190, 1.22), p["brass"], (1.0, 0.20, 1.0), 2, "costume")
    for z in (0.91, 1.04):
        sphere(r, f"Cooper_JacketButton_{z}", 0.021, (0.07, -0.170, z), p["shoe"], (1, 0.24, 1), 1, "costume")
    for x in (-0.22, 0.22):
        box(r, f"Cooper_JacketDart_{x}", (0.012, 0.012, 0.25), (x, -0.166, 0.93), p["suit_seam"], 0.004, role="costume")

    # Relaxed asymmetric stance. Shoulder caps bridge torso/sleeve; the mug
    # elbow comes toward camera while the free arm hangs slightly behind.
    for side in (-1, 1):
        upper_x = side * (0.372 if side < 0 else 0.365)
        upper_y = -0.045 if side < 0 else 0.030
        fore_y = -0.14 if side < 0 else 0.045
        fore_x = upper_x + side * 0.028
        wrist_x = fore_x + side * 0.012
        wrist_y = fore_y - (0.018 if side < 0 else 0)
        curved_sleeve(
            r,
            f"Cooper_Sleeve_{side}",
            (
                (side * 0.345, 0.012, 1.245, 0.112),
                (upper_x, upper_y, 1.06, 0.098),
                (side * 0.390, -0.105 if side < 0 else 0.040, 0.86, 0.082),
                (fore_x, fore_y, 0.70, 0.071),
                (wrist_x, wrist_y, 0.565, 0.063),
            ),
            p["suit"],
            0.93,
        )
        cuff_loc = (wrist_x, wrist_y, 0.555)
        box(r, f"Cooper_ShirtCuff_{side}", (0.145, 0.145, 0.042), cuff_loc, p["shirt"], 0.014, role="costume")
        hand_loc = (fore_x + side * 0.014, fore_y - (0.035 if side < 0 else 0), 0.485)
        hand(r, p, f"Cooper_Hand_{side}", side, hand_loc, grip=side < 0)

    cylinder(r, "Cooper_CoffeeMug", 0.098, 0.205, (-0.465, -0.19, 0.57), p["ceramic"], 18, role="prop")
    cylinder(r, "Cooper_CoffeeSurface", 0.083, 0.010, (-0.465, -0.19, 0.677), p["coffee"], 18, role="prop")
    torus(r, "Cooper_CoffeeHandle", 0.084, 0.019, (-0.565, -0.19, 0.58), p["ceramic"], (math.pi / 2, 0, 0), (0.70, 1, 1), "prop")

    cylinder(r, "Cooper_Neck", 0.115, 0.15, (0, 0.015, 1.37), p["skin"], 16, role="anatomy")
    sphere(r, "Cooper_Head", 0.36, (0, 0, 1.65), p["skin_warm"], (0.91, 0.78, 1.05), 3, "face")
    sphere(r, "Cooper_Jaw", 0.255, (0, -0.018, 1.49), p["skin_warm"], (0.86, 0.80, 0.62), 2, "face")
    for side in (-1, 1):
        sphere(r, f"Cooper_Ear_{side}", 0.074, (side * 0.327, 0, 1.66), p["skin"], (0.58, 0.38, 1.0), 2, "face")
        sphere(r, f"Cooper_InnerEar_{side}", 0.034, (side * 0.346, -0.018, 1.66), p["skin_shadow"], (0.45, 0.22, 0.82), 1, "face")
    eye(r, p, "Cooper_Eye_L", -0.115, 1.69, 0.002)
    eye(r, p, "Cooper_Eye_R", 0.115, 1.69, 0.002)
    sphere(r, "Cooper_NoseBridge", 0.060, (0, -0.292, 1.64), p["skin"], (0.58, 0.42, 1.35), 2, "face")
    sphere(r, "Cooper_NoseTip", 0.045, (0, -0.325, 1.59), p["skin_warm"], (0.86, 0.55, 0.76), 2, "face")
    box(r, "Cooper_Mouth", (0.115, 0.014, 0.017), (0, -0.318, 1.51), p["mouth"], 0.006, (0, 0, -0.018), "face")
    brow_l = sphere(r, "Cooper_Brow_L", 1.0, (-0.115, -0.302, 1.78), p["hair_dark"], (0.060, 0.009, 0.012), 2, "face")
    brow_l.rotation_euler.z = -0.10
    brow_r = sphere(r, "Cooper_Brow_R", 1.0, (0.115, -0.302, 1.78), p["hair_dark"], (0.060, 0.009, 0.012), 2, "face")
    brow_r.rotation_euler.z = 0.08

    # Cohesive slick-back masses with a soft side part, temples and nape.
    sphere(r, "Cooper_HairCrown", 0.315, (0, 0.02, 1.89), p["hair_dark"], (0.98, 0.86, 0.42), 3, "hair")
    sphere(r, "Cooper_HairBack", 0.265, (0, 0.19, 1.75), p["hair_dark"], (1.04, 0.58, 0.70), 2, "hair")
    sphere(r, "Cooper_HairNape", 1.0, (0, 0.235, 1.62), p["hair_dark"], (0.19, 0.075, 0.14), 2, "hair")
    for side in (-1, 1):
        sphere(r, f"Cooper_HairTemple_{side}", 1.0, (side * 0.255, -0.006, 1.79), p["hair_dark"], (0.085, 0.070, 0.16), 2, "hair")
    for name, loc, scale, rot in (
        ("Cooper_SweptHair_Left", (-0.135, -0.252, 1.835), (0.155, 0.035, 0.075), -0.12),
        ("Cooper_SweptHair_Center", (0.015, -0.255, 1.855), (0.175, 0.036, 0.065), -0.04),
        ("Cooper_SweptHair_Right", (0.165, -0.245, 1.825), (0.115, 0.033, 0.085), 0.10),
    ):
        lock = sphere(r, name, 1.0, loc, p["hair_dark"], scale, 2, "hair")
        lock.rotation_euler.z = rot


def npc_base(p: dict[str, bpy.types.Material], position: tuple[float, float, float]) -> None:
    r = root("TP_CHAR_NPC_Base", position, "neutral_npc")
    # Distinct from Cooper: shorter, wider stance, long A-line field jacket,
    # rounder cranium, bobbed nape and an alert forward-leaning left arm.
    for side in (-1, 1):
        x = -0.17 if side < 0 else 0.145
        box(r, f"NPC_Sole_{side}", (0.235, 0.34, 0.058), (x, -0.028, 0.037), p["sole"], 0.018, role="shoe")
        shoe_wedge(r, f"NPC_Shoe_{side}", 0.225, 0.33, 0.145, (x, -0.05, 0.125), p["shoe"])
        box(r, f"NPC_Heel_{side}", (0.185, 0.10, 0.058), (x, 0.085, 0.068), p["sole"], 0.012, role="shoe")
        box(r, f"NPC_ToeCapSeam_{side}", (0.175, 0.011, 0.018), (x, -0.225, 0.127), p["npc_jacket_dark"], 0.004, role="shoe")
        tapered_box(r, f"NPC_Leg_{side}", (0.195, 0.22), (0.24, 0.255), 0.46, (x, 0.01, 0.39), p["npc_trouser"], 0.032, "leg")
        box(r, f"NPC_TrouserBreak_{side}", (0.205, 0.22, 0.045), (x, -0.002, 0.19), p["npc_jacket_dark"], 0.012, role="leg")

    tapered_box(r, "NPC_Hips", (0.50, 0.31), (0.55, 0.33), 0.24, (-0.018, 0.01, 0.65), p["npc_trouser"], 0.055, "body")
    tapered_box(r, "NPC_Shirt", (0.53, 0.30), (0.54, 0.31), 0.43, (-0.012, 0.01, 0.94), p["npc_shirt"], 0.05, "body")
    tapered_box(r, "NPC_Jacket", (0.64, 0.35), (0.55, 0.32), 0.62, (-0.012, 0.035, 0.96), p["npc_jacket"], 0.055, "costume", (0, 0, -0.018))
    box(r, "NPC_JacketOpening", (0.15, 0.028, 0.43), (0, -0.145, 1.02), p["npc_shirt"], 0.009, role="costume")
    panel(r, "NPC_Collar_L", ((-0.25, 0.18), (-0.09, 0.21), (-0.025, -0.045), (-0.08, -0.065), (-0.17, 0.06)), 0.040, (0, -0.155, 1.13), p["npc_jacket_light"])
    panel(r, "NPC_Collar_R", ((0.25, 0.18), (0.09, 0.21), (0.025, -0.045), (0.08, -0.065), (0.17, 0.06)), 0.040, (0, -0.155, 1.13), p["npc_jacket_light"])
    torus(r, "NPC_Scarf", 0.15, 0.037, (0, -0.015, 1.275), p["npc_scarf"], (0, 0, 0), (1, 0.70, 0.70), "costume")
    panel(r, "NPC_ScarfTail", ((-0.055, 0.12), (0.065, 0.11), (0.045, -0.16), (-0.045, -0.13)), 0.045, (0.055, -0.178, 1.11), p["npc_scarf"])
    for x in (-0.23, 0.23):
        box(r, f"NPC_JacketDart_{x}", (0.012, 0.012, 0.30), (x, -0.142, 0.90), p["npc_jacket_dark"], 0.004, role="costume")
    panel(r, "NPC_PocketFlap_L", ((-0.09, 0.025), (0.09, 0.025), (0.08, -0.025), (-0.08, -0.025)), 0.028, (-0.20, -0.155, 0.82), p["npc_jacket_light"])
    panel(r, "NPC_PocketFlap_R", ((-0.09, 0.025), (0.09, 0.025), (0.08, -0.025), (-0.08, -0.025)), 0.028, (0.20, -0.155, 0.82), p["npc_jacket_light"])
    box(r, "NPC_HemPiping", (0.49, 0.018, 0.018), (0, -0.145, 0.67), p["npc_jacket_dark"], 0.006, role="costume")
    for side in (-1, 1):
        upper_x = side * 0.355
        upper_y = -0.065 if side < 0 else 0.045
        fore_y = -0.135 if side < 0 else 0.070
        fore_x = upper_x + side * 0.03
        wrist_x = fore_x + side * 0.012
        wrist_y = fore_y
        curved_sleeve(
            r,
            f"NPC_Sleeve_{side}",
            (
                (side * 0.335, 0.020, 1.205, 0.116),
                (upper_x, upper_y, 1.03, 0.102),
                (side * 0.380, -0.105 if side < 0 else 0.055, 0.85, 0.085),
                (fore_x, fore_y, 0.70, 0.073),
                (wrist_x, wrist_y, 0.56, 0.064),
            ),
            p["npc_jacket"],
            0.93,
        )
        cuff_loc = (wrist_x, wrist_y, 0.56)
        box(r, f"NPC_Cuff_{side}", (0.15, 0.15, 0.043), cuff_loc, p["npc_jacket_dark"], 0.014, role="costume")
        hand(r, p, f"NPC_Hand_{side}", side, (fore_x + side * 0.014, fore_y - 0.012, 0.49))

    cylinder(r, "NPC_Neck", 0.108, 0.14, (0, 0.015, 1.30), p["skin"], 16, role="anatomy")
    sphere(r, "NPC_Head", 0.335, (0.018, 0, 1.57), p["skin_warm"], (1.00, 0.82, 1.00), 3, "face")
    sphere(r, "NPC_Jaw", 0.245, (0.018, -0.012, 1.42), p["skin_warm"], (0.96, 0.84, 0.64), 2, "face")
    for side in (-1, 1):
        ear_x = 0.018 + side * 0.333
        sphere(r, f"NPC_Ear_{side}", 0.070, (ear_x, 0, 1.58), p["skin"], (0.58, 0.38, 1.0), 2, "face")
        sphere(r, f"NPC_InnerEar_{side}", 0.031, (ear_x + side * 0.018, -0.018, 1.58), p["skin_shadow"], (0.44, 0.22, 0.82), 1, "face")
    eye(r, p, "NPC_Eye_L", -0.092, 1.61, -0.001)
    eye(r, p, "NPC_Eye_R", 0.128, 1.61, -0.001)
    sphere(r, "NPC_NoseBridge", 0.052, (0.018, -0.286, 1.56), p["skin"], (0.52, 0.38, 1.22), 2, "face")
    sphere(r, "NPC_NoseTip", 0.041, (0.018, -0.317, 1.515), p["skin_warm"], (0.84, 0.54, 0.75), 2, "face")
    box(r, "NPC_Mouth", (0.10, 0.014, 0.016), (0.018, -0.312, 1.445), p["mouth"], 0.006, role="face")
    npc_brow_l = sphere(r, "NPC_Brow_L", 1.0, (-0.092, -0.298, 1.69), p["hair_brown"], (0.056, 0.009, 0.011), 2, "face")
    npc_brow_l.rotation_euler.z = -0.07
    npc_brow_r = sphere(r, "NPC_Brow_R", 1.0, (0.128, -0.298, 1.69), p["hair_brown"], (0.056, 0.009, 0.011), 2, "face")
    npc_brow_r.rotation_euler.z = 0.02

    sphere(r, "NPC_HairCrown", 0.305, (0.018, 0.02, 1.82), p["hair_brown"], (1.02, 0.87, 0.42), 3, "hair")
    sphere(r, "NPC_HairBack", 0.28, (0.018, 0.19, 1.66), p["hair_brown"], (1.08, 0.60, 0.86), 2, "hair")
    sphere(r, "NPC_HairNape", 1.0, (0.018, 0.22, 1.48), p["hair_brown"], (0.25, 0.08, 0.17), 2, "hair")
    for side in (-1, 1):
        sphere(r, f"NPC_HairSide_{side}", 1.0, (0.018 + side * 0.27, 0.01, 1.67), p["hair_brown"], (0.095, 0.075, 0.20), 2, "hair")
    for name, loc, scale, rot in (
        ("NPC_SweptFringe_Left", (-0.10, -0.247, 1.755), (0.17, 0.035, 0.075), -0.15),
        ("NPC_SweptFringe_Right", (0.115, -0.248, 1.745), (0.18, 0.035, 0.085), 0.13),
    ):
        lock = sphere(r, name, 1.0, loc, p["hair_brown"], scale, 2, "hair")
        lock.rotation_euler.z = rot


def join_by_material(character_root: bpy.types.Object) -> None:
    groups: dict[str, list[bpy.types.Object]] = {}
    for child in list(character_root.children):
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
        joined.name = f"{character_root.name}__{mat_name.removeprefix('TP_CHAR_MAT_')}"
        joined.parent = character_root
        tag(joined, character_root, "merged_material_group")


def build_scene() -> None:
    clear_scene()
    palette = make_palette()
    cooper(palette, (-1.15, 0, 0))
    npc_base(palette, (1.15, 0, 0))
    for root_name in sorted(EXPECTED_ROOTS):
        join_by_material(bpy.data.objects[root_name])

    scene = bpy.context.scene
    scene["tp_asset"] = "Twin Peaks authored character vertical slice"
    scene["tp_version"] = "2.3.0"
    scene["tp_units"] = "meters"
    scene["tp_animation_policy"] = "static quality prioritized; rig deferred"
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
        export_animations=False,
    )


def validate_glb() -> dict[str, object]:
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(OUTPUT_PATH))
    objects = list(bpy.context.scene.objects)
    roots = {
        obj.name
        for obj in objects
        if obj.type == "EMPTY" and obj.name.startswith("TP_CHAR_")
    }
    if roots != EXPECTED_ROOTS:
        raise RuntimeError(
            f"Character root mismatch: expected={sorted(EXPECTED_ROOTS)}, got={sorted(roots)}"
        )

    mesh_objects = [obj for obj in objects if obj.type == "MESH"]
    bad_parenting = [
        obj.name
        for obj in mesh_objects
        if obj.parent is None or obj.parent.name not in EXPECTED_ROOTS
    ]
    if bad_parenting:
        raise RuntimeError(f"Mesh groups without character root: {bad_parenting}")

    root_bounds: dict[str, dict[str, float]] = {}
    per_root: dict[str, dict[str, object]] = {}
    for root_name in sorted(EXPECTED_ROOTS):
        char_root = bpy.data.objects[root_name]
        if abs(char_root.location.z) > 1e-5:
            raise RuntimeError(f"{root_name} origin is not floor-aligned: {tuple(char_root.location)}")
        if char_root.get("tp_forward") != "-Y":
            raise RuntimeError(f"{root_name} forward contract changed")
        if char_root.get("tp_origin") != "floor_center":
            raise RuntimeError(f"{root_name} origin contract changed")
        children = [obj for obj in mesh_objects if obj.parent == char_root]
        world_z = [
            (obj.matrix_world @ Vector(corner)).z
            for obj in children
            for corner in obj.bound_box
        ]
        min_z, max_z = min(world_z), max(world_z)
        if min_z < -0.002 or min_z > 0.08:
            raise RuntimeError(f"{root_name} floor contact invalid: min_z={min_z:.5f}")
        root_bounds[root_name] = {
            "min_z": round(min_z, 5),
            "max_z": round(max_z, 5),
        }
        root_triangles = sum(
            len(poly.vertices) - 2
            for obj in children
            for poly in obj.data.polygons
        )
        root_materials = sorted(
            {
                slot.material.name
                for obj in children
                for slot in obj.material_slots
                if slot.material
            }
        )
        if root_triangles > 9000:
            raise RuntimeError(f"{root_name} exceeds runtime triangle budget: {root_triangles}")
        if len(children) > 24:
            raise RuntimeError(f"{root_name} exceeds runtime mesh-group budget: {len(children)}")
        per_root[root_name] = {
            "mesh_objects": len(children),
            "triangles": root_triangles,
            "materials": len(root_materials),
        }

    material_names = sorted(
        {
            slot.material.name
            for obj in mesh_objects
            for slot in obj.material_slots
            if slot.material
        }
    )
    stats = {
        "file": str(OUTPUT_PATH),
        "bytes": OUTPUT_PATH.stat().st_size,
        "roots": sorted(roots),
        "root_bounds": root_bounds,
        "per_root": per_root,
        "mesh_objects": len(mesh_objects),
        "materials": len(material_names),
        "material_names": material_names,
        "triangles": sum(
            len(poly.vertices) - 2
            for obj in mesh_objects
            for poly in obj.data.polygons
        ),
        "armatures": len([obj for obj in objects if obj.type == "ARMATURE"]),
        "animations": sorted(action.name for action in bpy.data.actions),
    }
    if stats["bytes"] > 2_000_000:
        raise RuntimeError(f"Character slice exceeds 2 MB runtime budget: {stats['bytes']}")
    return stats


def point_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_validation_preview() -> None:
    """Render three re-imported-GLB angles; preview furniture never enters the asset."""
    ground = material("TP_CHAR_PREVIEW_Ground", (0.045, 0.060, 0.058, 1), 0.94)
    backdrop = material("TP_CHAR_PREVIEW_Backdrop", (0.075, 0.095, 0.10, 1), 0.90)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.15, -0.06))
    floor = bpy.context.object
    floor.name = "TP_CHAR_PREVIEW_Floor"
    floor.dimensions = (5.2, 3.2, 0.12)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_bevel(floor, 0.08, 3)
    floor.data.materials.append(ground)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.45, 1.4))
    wall = bpy.context.object
    wall.name = "TP_CHAR_PREVIEW_Backdrop"
    wall.dimensions = (5.2, 0.12, 2.9)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_bevel(wall, 0.08, 3)
    wall.data.materials.append(backdrop)

    bpy.ops.object.light_add(type="AREA", location=(-3.8, -4.8, 6.3))
    key = bpy.context.object
    key.name = "TP_CHAR_PREVIEW_Key"
    key.data.energy = 780
    key.data.shape = "DISK"
    key.data.size = 4.8
    key.data.color = (1.0, 0.71, 0.48)
    point_at(key, (0, 0, 1.05))

    bpy.ops.object.light_add(type="AREA", location=(3.5, -1.0, 4.1))
    fill = bpy.context.object
    fill.name = "TP_CHAR_PREVIEW_Fill"
    fill.data.energy = 470
    fill.data.size = 4.0
    fill.data.color = (0.34, 0.55, 0.86)
    point_at(fill, (0, 0, 1.1))

    bpy.ops.object.light_add(type="AREA", location=(0, 2.0, 4.2))
    rim = bpy.context.object
    rim.name = "TP_CHAR_PREVIEW_Rim"
    rim.data.energy = 420
    rim.data.size = 3.8
    rim.data.color = (0.42, 0.78, 0.58)
    point_at(rim, (0, 0, 1.25))

    bpy.ops.object.camera_add(location=(0, -7.3, 2.55))
    camera = bpy.context.object
    camera.name = "TP_CHAR_PREVIEW_Camera"
    camera.data.lens = 62
    point_at(camera, (0, 0, 1.02))

    scene = bpy.context.scene
    scene.camera = camera
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 760
    scene.render.resolution_y = 760
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world.color = (0.012, 0.018, 0.021)
    scene.view_settings.look = "AgX - Medium High Contrast"

    angles = (
        ((0, -7.3, 2.55), (0, 0, 1.02)),
        ((4.4, -7.0, 3.35), (0, 0, 1.02)),
        ((6.8, -3.2, 2.75), (0, 0, 1.02)),
    )
    for output, (location, target) in zip(PREVIEW_ANGLES, angles, strict=True):
        camera.location = location
        point_at(camera, target)
        scene.render.filepath = str(output)
        bpy.ops.render.render(write_still=True)

    montage = Path("/opt/homebrew/bin/magick")
    if not montage.exists():
        raise RuntimeError("ImageMagick is required to assemble the validation contact sheet")
    subprocess.run(
        [str(montage), *(str(path) for path in PREVIEW_ANGLES), "+append", str(PREVIEW_PATH)],
        check=True,
    )
    if REJECTED_PREVIEW_PATH.exists():
        subprocess.run(
            [
                str(montage),
                "(",
                str(REJECTED_PREVIEW_PATH),
                "-resize",
                "2280x760^",
                "-gravity",
                "center",
                "-extent",
                "2280x760",
                ")",
                str(PREVIEW_PATH),
                "+append",
                str(COMPARISON_PATH),
            ],
            check=True,
        )


def main() -> None:
    build_scene()
    export_glb()
    stats = validate_glb()
    render_validation_preview()
    stats["preview"] = str(PREVIEW_PATH)
    stats["animation_note"] = "Static vertical slice; no skeleton/clips exported."
    print("TP_CHARACTER_SLICE_VALIDATION=" + json.dumps(stats, sort_keys=True))


if __name__ == "__main__":
    main()
