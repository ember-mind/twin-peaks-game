#!/usr/bin/env python3
"""Build an approval-only Cooper candidate on a real humanoid base.

The source body is Quaternius' CC0 Universal Base Characters pack.  It is
deliberately kept outside the runtime roster until the visual direction is
approved.  The generated GLB embeds the source textures.

Run:
  TP_UBC_ROOT="/path/to/Universal Base Characters[Standard]" \
    blender --background --python tools/generate_cooper_anatomy_candidate.py
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector


TOOLS = Path(__file__).resolve().parent
PROJECT = TOOLS.parent
sys.path.insert(0, str(TOOLS))
import generate_character_pack as pack  # noqa: E402


VERSION = "anatomy-candidate-1.1.0"
SOURCE_URL = "https://quaternius.com/packs/universalbasecharacters.html"
SOURCE_ROOT = Path(os.environ["TP_UBC_ROOT"]).resolve()
BODY_GLTF = (
    SOURCE_ROOT
    / "Base Characters/Godot - UE/Superhero_Male_FullBody.gltf"
)
HAIR_GLTF = (
    SOURCE_ROOT
    / "Hairstyles/Origin at 0/glTF (Godot)/Hair_SimpleParted.gltf"
)
OUTPUT = Path(
    os.environ.get(
        "TP_COOPER_ANATOMY_OUTPUT",
        PROJECT / "assets/models/twin-peaks-cooper-anatomy-candidate.glb",
    )
).resolve()
EVIDENCE = Path(
    os.environ.get(
        "TP_COOPER_ANATOMY_EVIDENCE",
        PROJECT / "artifacts/character-pilot/cooper-anatomy",
    )
).resolve()
BLEND_OUTPUT = EVIDENCE / "cooper-anatomy-candidate.blend"


def pbr_material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    roughness: float,
    metallic: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = color
    material.roughness = roughness
    material.metallic = metallic
    shader = next(
        node
        for node in material.node_tree.nodes
        if node.type == "BSDF_PRINCIPLED"
    )
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Specular IOR Level"].default_value = 0.25
    return material


def invisible_material() -> bpy.types.Material:
    existing = bpy.data.materials.get("TP_COOPER_Invisible")
    if existing:
        return existing
    material = pbr_material(
        "TP_COOPER_Invisible",
        (0.0, 0.0, 0.0, 0.0),
        roughness=1.0,
    )
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    transparent = nodes.new("ShaderNodeBsdfTransparent")
    links.new(transparent.outputs["BSDF"], output.inputs["Surface"])
    if hasattr(material, "surface_render_method"):
        material.surface_render_method = "DITHERED"
    return material


def remove_import_extras(keep: set[str]) -> None:
    for obj in list(bpy.context.scene.objects):
        if obj.name not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)


def import_source_body() -> tuple[bpy.types.Object, bpy.types.Object]:
    if not BODY_GLTF.exists():
        raise FileNotFoundError(BODY_GLTF)
    bpy.ops.import_scene.gltf(filepath=str(BODY_GLTF))
    rig = bpy.data.objects["Armature"]
    body = bpy.data.objects["SuperHero_Male"]
    keep = {rig.name, body.name, "Eyebrows", "Eyes"}
    remove_import_extras(keep)
    rig.name = "TP_COOPER_ANATOMY_Rig"
    body.name = "TP_COOPER_ANATOMY_Body"
    rig.scale = (0.88, 0.94, 1.04)
    rig["tp_source"] = SOURCE_URL
    rig["tp_license"] = "CC0-1.0"
    body["tp_approval_only"] = True

    # The free glTF defaults to the dark skin map.  Cooper uses the light map
    # shipped in the same CC0 pack; normals and roughness remain untouched.
    skin_path = (
        SOURCE_ROOT
        / "Base Characters/Textures/T_Superhero_Male_Ligh.png"
    )
    skin_image = bpy.data.images.load(str(skin_path), check_existing=True)
    skin_material = bpy.data.materials.get("MI_Superhero_Male")
    if skin_material and skin_material.use_nodes:
        for node in skin_material.node_tree.nodes:
            if (
                node.type == "TEX_IMAGE"
                and node.image
                and "Superhero_Male_Dark" in node.image.name
            ):
                node.image = skin_image
    return rig, body


def reshape_body(body: bpy.types.Object, rig: bpy.types.Object) -> None:
    """Turn the free superhero base into a lean adult investigator."""
    group_names = {
        group.index: group.name
        for group in body.vertex_groups
    }
    arm_groups = {
        "upperarm_l",
        "upperarm_r",
        "lowerarm_l",
        "lowerarm_r",
    }
    hand_groups = {
        name
        for name in group_names.values()
        if (
            name.startswith("hand_")
            or name.startswith("thumb_")
            or name.startswith("index_")
            or name.startswith("middle_")
            or name.startswith("ring_")
            or name.startswith("pinky_")
        )
    }

    for vertex in body.data.vertices:
        links = sorted(vertex.groups, key=lambda item: item.weight, reverse=True)
        dominant = group_names.get(links[0].group, "") if links else ""
        coordinate = vertex.co
        # Narrow the rib cage and deltoid bridge without changing head width.
        if 1.04 < coordinate.z < 1.56 and abs(coordinate.x) < 0.34:
            height = max(0.0, min(1.0, (coordinate.z - 1.04) / 0.52))
            coordinate.x *= 0.86 - 0.08 * height
            coordinate.y *= 0.92
        if dominant in arm_groups:
            bone = rig.data.bones[dominant]
            start = bone.head_local
            axis = bone.tail_local - start
            along = max(
                0.0,
                min(1.0, (coordinate - start).dot(axis) / axis.length_squared),
            )
            centre = start + axis * along
            scale = 0.56 if dominant.startswith("upperarm") else 0.65
            coordinate[:] = centre + (coordinate - centre) * scale
        elif dominant in hand_groups:
            side = "l" if dominant.endswith("_l") else "r"
            centre = rig.data.bones[f"hand_{side}"].head_local
            coordinate[:] = centre + (coordinate - centre) * 0.86


def garment_from_groups(
    body: bpy.types.Object,
    *,
    name: str,
    groups: set[str],
    material: bpy.types.Material,
    min_weight: float,
    z_min: float | None = None,
    z_max: float | None = None,
    thickness: float = 0.012,
) -> bpy.types.Object:
    """Duplicate a weighted skin region into a fitted, deforming garment."""
    garment = body.copy()
    garment.data = body.data.copy()
    garment.name = name
    bpy.context.collection.objects.link(garment)
    allowed = {
        group.index
        for group in body.vertex_groups
        if group.name in groups
    }
    accepted: set[int] = set()
    for vertex in body.data.vertices:
        score = sum(
            link.weight
            for link in vertex.groups
            if link.group in allowed
        )
        if score < min_weight:
            continue
        if z_min is not None and vertex.co.z < z_min:
            continue
        if z_max is not None and vertex.co.z > z_max:
            continue
        accepted.add(vertex.index)

    # Preserve the source vertex indices and therefore all skin weights.
    # Rebuilding the mesh through bmesh renumbered vertices in some Blender
    # imports and produced long "exploding" shoulder triangles in pose.
    garment.data.materials.clear()
    garment.data.materials.append(material)
    garment.data.materials.append(invisible_material())
    for index, vertex in enumerate(garment.data.vertices):
        vertex.co += body.data.vertices[index].normal * thickness
    for polygon in garment.data.polygons:
        polygon.material_index = (
            0
            if all(index in accepted for index in polygon.vertices)
            else 1
        )
        polygon.use_smooth = True

    return garment


def hide_body_groups(
    body: bpy.types.Object,
    *,
    groups: set[str],
    min_weight: float,
    z_max: float | None = None,
    hide_boundary: bool = False,
) -> None:
    """Mask anatomy fully enclosed by garments; prevents feet clipping shoes."""
    accepted: set[int] = set()
    group_indices = {
        group.index
        for group in body.vertex_groups
        if group.name in groups
    }
    for vertex in body.data.vertices:
        if z_max is not None and vertex.co.z > z_max:
            continue
        weight = sum(
            assignment.weight
            for assignment in vertex.groups
            if assignment.group in group_indices
        )
        if weight >= min_weight:
            accepted.add(vertex.index)
    hidden = invisible_material()
    body.data.materials.append(hidden)
    hidden_index = len(body.data.materials) - 1
    for polygon in body.data.polygons:
        accepted_count = sum(vertex in accepted for vertex in polygon.vertices)
        if (
            accepted_count
            and (
                hide_boundary
                or accepted_count == len(polygon.vertices)
            )
        ):
            polygon.material_index = hidden_index


def add_bone_surface(
    rig: bpy.types.Object,
    *,
    name: str,
    points: list[tuple[float, float, float]],
    material: bpy.types.Material,
    bone: str,
    thickness: float = 0.007,
) -> bpy.types.Object:
    """Create a clean authored garment panel instead of a floating box."""
    data = bpy.data.meshes.new(name + "_Data")
    data.from_pydata(points, [], [tuple(range(len(points)))])
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    solidify = obj.modifiers.new("Panel depth", "SOLIDIFY")
    solidify.thickness = thickness
    solidify.offset = 0.0
    bevel = obj.modifiers.new("Panel edge roll", "BEVEL")
    bevel.width = 0.004
    bevel.segments = 2
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = bone
    obj.matrix_world = world
    return obj


def add_tailored_torso(
    rig: bpy.types.Object,
    material: bpy.types.Material,
) -> bpy.types.Object:
    """Open-backed jacket shell: side/back volume without a tunic-like front."""
    rings = (
        (0.845, 0.178, 0.116, 0.006, "pelvis"),
        (0.925, 0.190, 0.124, 0.004, "pelvis"),
        (1.020, 0.188, 0.121, 0.000, "spine_01"),
        (1.175, 0.187, 0.122, -0.002, "spine_02"),
        (1.330, 0.207, 0.137, 0.000, "spine_03"),
        (1.445, 0.198, 0.120, 0.008, "spine_03"),
    )
    segments = 32
    # The missing front sector is deliberate. Separate front panels below
    # create a real opening, waist suppression and lapel break.
    open_faces = set(range(21, 27))
    vertices: list[tuple[float, float, float]] = []
    for z, half_x, half_y, y_offset, _ in rings:
        for index in range(segments):
            angle = math.tau * index / segments
            vertices.append(
                (
                    math.cos(angle) * half_x,
                    y_offset + math.sin(angle) * half_y,
                    z,
                )
            )
    faces: list[tuple[int, ...]] = []
    for ring in range(len(rings) - 1):
        for index in range(segments):
            if index in open_faces:
                continue
            following = (index + 1) % segments
            faces.append(
                (
                    ring * segments + index,
                    ring * segments + following,
                    (ring + 1) * segments + following,
                    (ring + 1) * segments + index,
                )
            )
    data = bpy.data.meshes.new("TP_COOPER_TailoredJacket_Data")
    data.from_pydata(vertices, [], faces)
    data.materials.append(material)
    data.update()
    jacket = bpy.data.objects.new("TP_COOPER_TailoredJacket", data)
    bpy.context.collection.objects.link(jacket)
    for polygon in data.polygons:
        polygon.use_smooth = True
    for ring_index, ring in enumerate(rings):
        group = jacket.vertex_groups.get(ring[4])
        if group is None:
            group = jacket.vertex_groups.new(name=ring[4])
        group.add(
            range(ring_index * segments, (ring_index + 1) * segments),
            1.0,
            "REPLACE",
        )
    modifier = jacket.modifiers.new("Cooper torso bind", "ARMATURE")
    modifier.object = rig
    jacket.parent = rig
    bevel = jacket.modifiers.new("Tailored edge roll", "BEVEL")
    bevel.width = 0.006
    bevel.segments = 2
    return jacket


def add_weighted_panel(
    rig: bpy.types.Object,
    *,
    name: str,
    rows: list[
        tuple[
            tuple[float, float, float],
            tuple[float, float, float],
            str,
        ]
    ],
    material: bpy.types.Material,
    thickness: float = 0.008,
) -> bpy.types.Object:
    """Two-column deforming garment panel with explicit tailoring lines."""
    vertices: list[tuple[float, float, float]] = []
    for inner, outer, _ in rows:
        vertices.extend((inner, outer))
    faces = [
        (row * 2, row * 2 + 1, row * 2 + 3, row * 2 + 2)
        for row in range(len(rows) - 1)
    ]
    data = bpy.data.meshes.new(name + "_Data")
    data.from_pydata(vertices, [], faces)
    data.materials.append(material)
    data.update()
    panel = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(panel)
    for polygon in data.polygons:
        polygon.use_smooth = True
    for row_index, (_, _, bone) in enumerate(rows):
        group = panel.vertex_groups.get(bone)
        if group is None:
            group = panel.vertex_groups.new(name=bone)
        group.add((row_index * 2, row_index * 2 + 1), 1.0, "REPLACE")
    armature = panel.modifiers.new("Tailored panel bind", "ARMATURE")
    armature.object = rig
    solidify = panel.modifiers.new("Cloth body", "SOLIDIFY")
    solidify.thickness = thickness
    solidify.offset = 0.0
    bevel = panel.modifiers.new("Pressed cloth edge", "BEVEL")
    bevel.width = 0.004
    bevel.segments = 2
    panel.parent = rig
    return panel


def add_jacket_fronts(
    rig: bpy.types.Object,
    suit: bpy.types.Material,
    lapel: bpy.types.Material,
) -> list[bpy.types.Object]:
    """Separate fronts, revers and pockets: read as tailored clothing."""
    pieces: list[bpy.types.Object] = []
    for side, sign in (("L", -1.0), ("R", 1.0)):
        rows = [
            (
                (sign * 0.026, -0.123, 0.850),
                (sign * 0.177, -0.054, 0.850),
                "pelvis",
            ),
            (
                (sign * 0.018, -0.132, 1.020),
                (sign * 0.190, -0.058, 1.020),
                "spine_01",
            ),
            (
                (sign * 0.020, -0.137, 1.175),
                (sign * 0.188, -0.064, 1.175),
                "spine_02",
            ),
            (
                (sign * 0.058, -0.134, 1.320),
                (sign * 0.200, -0.073, 1.320),
                "spine_03",
            ),
            (
                (sign * 0.126, -0.112, 1.430),
                (sign * 0.162, -0.080, 1.430),
                "spine_03",
            ),
        ]
        # Reverse each row on one side so both panels face outward.
        if sign < 0.0:
            rows = [(outer, inner, bone) for inner, outer, bone in rows]
        pieces.append(
            add_weighted_panel(
                rig,
                name=f"TP_COOPER_JacketFront{side}",
                rows=rows,
                material=suit,
                thickness=0.010,
            )
        )

        # Revers sit slightly proud of the front and have a lower sheen.
        lapel_rows = [
            (
                (sign * 0.020, -0.151, 1.145),
                (sign * 0.104, -0.132, 1.260),
                "spine_02",
            ),
            (
                (sign * 0.038, -0.153, 1.325),
                (sign * 0.145, -0.119, 1.405),
                "spine_03",
            ),
        ]
        if sign < 0.0:
            lapel_rows = [
                (outer, inner, bone) for inner, outer, bone in lapel_rows
            ]
        pieces.append(
            add_weighted_panel(
                rig,
                name=f"TP_COOPER_NotchLapel{side}",
                rows=lapel_rows,
                material=lapel,
                thickness=0.006,
            )
        )
        pieces.append(
            add_bone_prop(
                rig,
                name=f"TP_COOPER_LowerPocketWelt{side}",
                location=(sign * 0.108, -0.119, 0.990),
                scale=(0.062, 0.007, 0.010),
                material=lapel,
                bone="spine_01",
                rotation=(0.0, math.radians(sign * 3.0), math.radians(sign * 4.0)),
                bevel=0.003,
            )
        )
    pieces.append(
        add_bone_prop(
            rig,
            name="TP_COOPER_BreastPocketWelt",
            location=(-0.103, -0.126, 1.285),
            scale=(0.048, 0.006, 0.008),
            material=lapel,
            bone="spine_03",
            rotation=(0.0, 0.0, math.radians(-5.0)),
            bevel=0.003,
        )
    )
    return pieces


def add_dress_shoe(
    rig: bpy.types.Object,
    *,
    side: str,
    x: float,
    upper_material: bpy.types.Material,
    accent_material: bpy.types.Material,
    sole_material: bpy.types.Material,
) -> list[bpy.types.Object]:
    """Smooth almond-toe Oxford with sole, heel, tongue and fine lacing."""
    # One continuous last. Each station explicitly controls width, sole and
    # topline; this avoids the inflated "two spheres" silhouette.
    stations = (
        (0.105, 0.044, 0.026, 0.116),
        (0.055, 0.054, 0.024, 0.122),
        (-0.015, 0.058, 0.023, 0.110),
        (-0.085, 0.061, 0.022, 0.086),
        (-0.145, 0.055, 0.024, 0.070),
        (-0.190, 0.035, 0.031, 0.059),
        (-0.210, 0.004, 0.044, 0.047),
    )
    segments = 24
    vertices = []
    for y, half_x, bottom, top in stations:
        center_z = (bottom + top) * 0.5
        half_z = (top - bottom) * 0.5
        for index in range(segments):
            angle = math.tau * index / segments
            vertices.append(
                (
                    x + math.cos(angle) * half_x,
                    y,
                    center_z + math.sin(angle) * half_z,
                )
            )
    faces: list[tuple[int, ...]] = [
        tuple(range(segments - 1, -1, -1)),
        tuple(
            (len(stations) - 1) * segments + index
            for index in range(segments)
        ),
    ]
    for station in range(len(stations) - 1):
        for index in range(segments):
            following = (index + 1) % segments
            faces.append(
                (
                    station * segments + index,
                    (station + 1) * segments + index,
                    (station + 1) * segments + following,
                    station * segments + following,
                )
            )
    data = bpy.data.meshes.new(f"TP_COOPER_OxfordUpper_{side}_Data")
    data.from_pydata(vertices, [], faces)
    data.materials.append(upper_material)
    data.update()
    upper = bpy.data.objects.new(f"TP_COOPER_OxfordUpper_{side}", data)
    bpy.context.collection.objects.link(upper)
    upper.name = f"TP_COOPER_OxfordUpper_{side}"
    for polygon in upper.data.polygons:
        polygon.use_smooth = True
    world = upper.matrix_world.copy()
    upper.parent = rig
    upper.parent_type = "BONE"
    upper.parent_bone = f"foot_{side}"
    upper.matrix_world = world

    # Narrow sock sits behind the topline, closing the remaining skin gap
    # without turning the trouser hem into a boot-like cuff.
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=24,
        radius=1.0,
        depth=0.045,
        location=(x, 0.025, 0.112),
    )
    sock = bpy.context.object
    sock.name = f"TP_COOPER_DressSock_{side}"
    sock.scale = (0.033, 0.030, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    sock.data.materials.append(sole_material)
    for polygon in sock.data.polygons:
        polygon.use_smooth = True
    bevel = sock.modifiers.new("Sock edge softness", "BEVEL")
    bevel.width = 0.004
    bevel.segments = 2
    world = sock.matrix_world.copy()
    sock.parent = rig
    sock.parent_type = "BONE"
    sock.parent_bone = f"foot_{side}"
    sock.matrix_world = world

    pieces = [upper, sock]
    pieces.extend(
        [
            add_bone_prop(
                rig,
                name=f"TP_COOPER_DerbySole_{side}",
                location=(x, -0.060, 0.019),
                scale=(0.064, 0.151, 0.010),
                material=sole_material,
                bone=f"foot_{side}",
                bevel=0.012,
            ),
            add_bone_prop(
                rig,
                name=f"TP_COOPER_DerbyHeel_{side}",
                location=(x, 0.052, 0.023),
                scale=(0.048, 0.041, 0.021),
                material=sole_material,
                bone=f"foot_{side}",
                bevel=0.008,
            ),
            add_bone_prop(
                rig,
                name=f"TP_COOPER_DerbyVamp_{side}",
                location=(x, -0.035, 0.109),
                scale=(0.046, 0.030, 0.005),
                material=accent_material,
                bone=f"foot_{side}",
                rotation=(math.radians(-8.0), 0.0, 0.0),
                bevel=0.006,
            ),
        ]
    )
    for lace_index, y in enumerate((-0.022, -0.040, -0.058)):
        pieces.append(
            add_bone_prop(
                rig,
                name=f"TP_COOPER_DerbyLace_{side}_{lace_index}",
                location=(x, y, 0.116 - lace_index * 0.003),
                scale=(0.031, 0.003, 0.002),
                material=sole_material,
                bone=f"foot_{side}",
                bevel=0.002,
            )
        )
    return pieces


def add_hair(rig: bpy.types.Object, hair_material: bpy.types.Material) -> bpy.types.Object:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(HAIR_GLTF))
    imported = [obj for obj in bpy.data.objects if obj not in before]
    hair = next(obj for obj in imported if obj.type == "MESH")
    for obj in imported:
        if obj != hair:
            bpy.data.objects.remove(obj, do_unlink=True)
    hair.name = "TP_COOPER_ANATOMY_Hair"
    hair.data.materials.clear()
    hair.data.materials.append(hair_material)
    hair.vertex_groups.clear()
    head_group = hair.vertex_groups.new(name="Head")
    head_group.add(range(len(hair.data.vertices)), 1.0, "REPLACE")
    modifier = hair.modifiers.new("Cooper head bind", "ARMATURE")
    modifier.object = rig
    hair.parent = rig
    for polygon in hair.data.polygons:
        polygon.use_smooth = True
    return hair


def add_bone_prop(
    rig: bpy.types.Object,
    *,
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    bone: str,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    bevel: float = 0.008,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Intentional edge roll", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    obj.data.materials.append(material)
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = bone
    obj.matrix_world = world
    return obj


def build_clothing(
    rig: bpy.types.Object,
    body: bpy.types.Object,
) -> list[bpy.types.Object]:
    navy = pbr_material(
        "TP_COOPER_Suit",
        (0.004, 0.012, 0.024, 1.0),
        roughness=0.68,
    )
    navy_edge = pbr_material(
        "TP_COOPER_SuitEdge",
        (0.012, 0.030, 0.052, 1.0),
        roughness=0.62,
    )
    lapel = pbr_material(
        "TP_COOPER_Lapel",
        (0.010, 0.024, 0.043, 1.0),
        roughness=0.50,
    )
    shirt = pbr_material(
        "TP_COOPER_Shirt",
        (0.82, 0.84, 0.80, 1.0),
        roughness=0.77,
    )
    tie = pbr_material(
        "TP_COOPER_Tie",
        (0.28, 0.025, 0.035, 1.0),
        roughness=0.58,
    )
    leather = pbr_material(
        "TP_COOPER_Leather",
        (0.022, 0.006, 0.003, 1.0),
        roughness=0.40,
    )
    leather_accent = pbr_material(
        "TP_COOPER_LeatherAccent",
        (0.060, 0.015, 0.006, 1.0),
        roughness=0.34,
    )
    shoe_sole = pbr_material(
        "TP_COOPER_ShoeSole",
        (0.012, 0.008, 0.006, 1.0),
        roughness=0.60,
    )
    metal = pbr_material(
        "TP_COOPER_Metal",
        (0.34, 0.29, 0.16, 1.0),
        roughness=0.30,
        metallic=0.75,
    )
    hair_material = pbr_material(
        "TP_COOPER_Hair",
        (0.018, 0.013, 0.012, 1.0),
        roughness=0.52,
    )

    reshape_body(body, rig)
    hide_body_groups(
        body,
        groups={"foot_l", "ball_l", "ball_leaf_l", "foot_r", "ball_r", "ball_leaf_r"},
        min_weight=0.18,
        hide_boundary=True,
    )
    hide_body_groups(
        body,
        groups={"calf_l", "calf_r"},
        min_weight=0.18,
        z_max=0.24,
        hide_boundary=True,
    )
    hide_body_groups(
        body,
        groups={
            "pelvis",
            "spine_01",
            "spine_02",
            "spine_03",
            "clavicle_l",
            "clavicle_r",
            "upperarm_l",
            "upperarm_r",
            "lowerarm_l",
            "lowerarm_r",
        },
        min_weight=0.30,
    )
    jacket = garment_from_groups(
        body,
        name="TP_COOPER_ANATOMY_Jacket",
        groups={
            "pelvis",
            "spine_01",
            "spine_02",
            "spine_03",
            "clavicle_l",
            "clavicle_r",
            "upperarm_l",
            "upperarm_r",
            "lowerarm_l",
            "lowerarm_r",
        },
        material=navy,
        min_weight=0.24,
        z_min=0.79,
        thickness=0.014,
    )
    trousers = garment_from_groups(
        body,
        name="TP_COOPER_ANATOMY_Trousers",
        groups={"pelvis", "thigh_l", "thigh_r", "calf_l", "calf_r"},
        material=navy_edge,
        min_weight=0.32,
        z_min=0.09,
        z_max=1.05,
        thickness=0.011,
    )
    # Readable shirt opening, lapels, tie and belt.  These authored
    # pieces break the "single inflated bodysuit" read of the rejected model.
    hair = add_hair(rig, hair_material)
    eyebrows = bpy.data.objects.get("Eyebrows")
    if eyebrows is not None:
        eyebrows.data.materials.clear()
        eyebrows.data.materials.append(hair_material)
    pieces = [
        jacket,
        trousers,
        add_tailored_torso(rig, navy),
        hair,
    ]
    pieces.extend(add_jacket_fronts(rig, navy, lapel))
    pieces.extend(
        [
            add_bone_surface(
                rig,
                name="TP_COOPER_ShirtBib",
                points=[
                    (-0.058, -0.151, 1.425),
                    (0.058, -0.151, 1.425),
                    (0.0, -0.153, 1.270),
                ],
                material=shirt,
                bone="spine_03",
                thickness=0.008,
            ),
            add_bone_surface(
                rig,
                name="TP_COOPER_CollarL",
                points=[
                    (-0.052, -0.158, 1.430),
                    (0.0, -0.162, 1.430),
                    (-0.010, -0.169, 1.368),
                ],
                material=shirt,
                bone="spine_03",
                thickness=0.007,
            ),
            add_bone_surface(
                rig,
                name="TP_COOPER_CollarR",
                points=[
                    (0.0, -0.162, 1.430),
                    (0.052, -0.158, 1.430),
                    (0.010, -0.169, 1.368),
                ],
                material=shirt,
                bone="spine_03",
                thickness=0.007,
            ),
            add_bone_surface(
                rig,
                name="TP_COOPER_Tie",
                points=[
                    (-0.010, -0.172, 1.400),
                    (0.010, -0.172, 1.400),
                    (0.008, -0.176, 1.320),
                    (0.0, -0.178, 1.302),
                    (-0.008, -0.176, 1.320),
                ],
                material=tie,
                bone="spine_03",
                thickness=0.006,
            ),
            add_bone_prop(
                rig,
                name="TP_COOPER_JacketButtonUpper",
                location=(0.020, -0.149, 1.075),
                scale=(0.010, 0.006, 0.010),
                material=navy_edge,
                bone="spine_01",
                bevel=0.004,
            ),
            add_bone_prop(
                rig,
                name="TP_COOPER_JacketButtonLower",
                location=(0.020, -0.144, 0.985),
                scale=(0.010, 0.006, 0.010),
                material=navy_edge,
                bone="spine_01",
                bevel=0.004,
            ),
        ]
    )
    for side, x in (("l", 0.114), ("r", -0.114)):
        pieces.extend(
            add_dress_shoe(
                rig,
                side=side,
                x=x,
                upper_material=leather,
                accent_material=leather_accent,
                sole_material=shoe_sole,
            )
        )
    return pieces


def create_pose(rig: bpy.types.Object) -> list[bpy.types.Object]:
    """Relax the source T-pose into a sober, asymmetrical Cooper stance."""
    targets: list[bpy.types.Object] = []
    for side, x, wrist, pole in (
        ("l", 0.32, (0.28, -0.105, 0.995), (0.58, -0.42, 1.15)),
        ("r", -0.32, (-0.275, -0.015, 0.975), (-0.56, -0.31, 1.12)),
    ):
        target = bpy.data.objects.new(f"TP_COOPER_IK_Hand_{side}", None)
        bpy.context.collection.objects.link(target)
        target.location = wrist
        pole_target = bpy.data.objects.new(f"TP_COOPER_IK_Elbow_{side}", None)
        bpy.context.collection.objects.link(pole_target)
        pole_target.location = pole
        constraint = rig.pose.bones[f"lowerarm_{side}"].constraints.new("IK")
        constraint.target = target
        constraint.pole_target = pole_target
        constraint.chain_count = 2
        constraint.pole_angle = math.radians(90 if side == "l" else -90)
        targets.extend((target, pole_target))

    rig.pose.bones["pelvis"].rotation_mode = "XYZ"
    rig.pose.bones["pelvis"].rotation_euler.y = math.radians(-2.2)
    rig.pose.bones["spine_01"].rotation_mode = "XYZ"
    rig.pose.bones["spine_01"].rotation_euler.y = math.radians(2.0)
    rig.pose.bones["spine_03"].rotation_mode = "XYZ"
    rig.pose.bones["spine_03"].rotation_euler.y = math.radians(1.7)
    rig.pose.bones["Head"].rotation_mode = "XYZ"
    rig.pose.bones["Head"].rotation_euler.y = math.radians(-2.2)
    rig.pose.bones["hand_l"].rotation_mode = "XYZ"
    rig.pose.bones["hand_l"].rotation_euler.y = math.radians(-58.0)
    rig.pose.bones["hand_r"].rotation_mode = "XYZ"
    rig.pose.bones["hand_r"].rotation_euler.y = math.radians(58.0)
    rig.pose.bones["thigh_l"].rotation_mode = "XYZ"
    rig.pose.bones["thigh_l"].rotation_euler.x = math.radians(1.5)
    rig.pose.bones["thigh_r"].rotation_mode = "XYZ"
    rig.pose.bones["thigh_r"].rotation_euler.x = math.radians(-1.2)
    bpy.context.view_layer.update()
    return targets


def configure_scene() -> bpy.types.Object:
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.15
    scene.world.use_nodes = True
    background = next(
        node
        for node in scene.world.node_tree.nodes
        if node.type == "BACKGROUND"
    )
    background.inputs["Color"].default_value = (0.025, 0.055, 0.090, 1.0)
    background.inputs["Strength"].default_value = 0.25

    floor_mat = pbr_material(
        "TP_COOPER_AnatomyFloor",
        (0.055, 0.12, 0.06, 1.0),
        roughness=0.92,
    )
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0.0, 0.0, -0.012))
    floor = bpy.context.object
    floor.name = "TP_COOPER_ANATOMY_Floor"
    floor.data.materials.append(floor_mat)

    bpy.ops.object.camera_add(location=(0.0, -3.45, 1.82))
    camera = bpy.context.object
    camera.name = "TP_COOPER_ANATOMY_Camera"
    camera.data.lens = 66
    camera.data.sensor_width = 36
    camera.data.dof.use_dof = True
    camera.data.dof.focus_distance = 3.45
    camera.data.dof.aperture_fstop = 7.0
    scene.camera = camera

    for name, location, energy, size, color in (
        ("Key", (-2.5, -3.2, 4.3), 650, 2.7, (1.0, 0.84, 0.68)),
        ("Fill", (2.7, -2.1, 2.8), 260, 3.0, (0.60, 0.78, 1.0)),
        ("Rim", (1.7, 2.4, 3.5), 720, 2.0, (0.68, 0.84, 1.0)),
        ("Top", (-0.4, 0.2, 5.1), 380, 2.4, (1.0, 0.95, 0.80)),
    ):
        light_data = bpy.data.lights.new("TP_COOPER_" + name, "AREA")
        light_data.energy = energy
        light_data.shape = "DISK"
        light_data.size = size
        light_data.color = color
        light = bpy.data.objects.new("TP_COOPER_" + name, light_data)
        bpy.context.collection.objects.link(light)
        light.location = location
        pack.point_camera(light, (0.0, 0.0, 1.05))
    return camera


def render_views(camera: bpy.types.Object) -> list[str]:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    rendered: list[str] = []
    for label, angle, target, distance, height in (
        ("front", 0.0, (0.0, 0.0, 0.98), 3.45, 1.82),
        ("three-quarter", -27.0, (0.0, 0.0, 1.00), 3.45, 1.82),
        ("profile", -90.0, (0.0, 0.0, 1.00), 3.45, 1.82),
        ("hero-close", -18.0, (0.0, 0.0, 1.38), 2.45, 1.75),
        ("tailoring-detail", -12.0, (0.0, 0.0, 1.18), 1.45, 1.38),
        ("shoe-detail", -18.0, (0.0, -0.025, 0.14), 1.15, 0.40),
    ):
        radians = math.radians(angle)
        camera.location = (
            math.sin(radians) * distance,
            -math.cos(radians) * distance,
            height,
        )
        camera.data.dof.focus_distance = distance
        pack.point_camera(camera, target)
        path = EVIDENCE / f"{label}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        rendered.append(str(path))
    return rendered


def export_candidate(rig: bpy.types.Object) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    for obj in bpy.context.scene.objects:
        if (
            obj.type == "MESH"
            and not obj.name.endswith("_Floor")
        ):
            obj.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=True,
        export_yup=True,
    )


def bake_constraint_pose(rig: bpy.types.Object) -> None:
    """Freeze evaluated IK into ordinary bone transforms for glTF/r147."""
    bpy.context.scene.frame_set(1)
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.nla.bake(
        frame_start=1,
        frame_end=2,
        step=1,
        only_selected=False,
        visual_keying=True,
        clear_constraints=True,
        clear_parents=False,
        use_current_action=False,
        clean_curves=True,
        bake_types={"POSE"},
    )
    bpy.ops.object.mode_set(mode="OBJECT")
    if rig.animation_data and rig.animation_data.action:
        rig.animation_data.action.name = "TP_approval_pose"
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()


def make_invisible_gltf_safe() -> None:
    """Swap preview-only Transparent BSDF for standard glTF alpha blending."""
    material = bpy.data.materials.get("TP_COOPER_Invisible")
    if material is None:
        return
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Base Color"].default_value = (0.0, 0.0, 0.0, 0.0)
    shader.inputs["Alpha"].default_value = 0.0
    shader.inputs["Roughness"].default_value = 1.0
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    material.diffuse_color = (0.0, 0.0, 0.0, 0.0)
    material.surface_render_method = "BLENDED"


def write_manifest(
    rig: bpy.types.Object,
    body: bpy.types.Object,
    rendered: list[str],
) -> None:
    payload = {
        "schema": "twin-peaks.character-anatomy-candidate.v1",
        "version": VERSION,
        "character": "cooper",
        "approval_only": True,
        "integrated": False,
        "source": SOURCE_URL,
        "license": "CC0-1.0",
        "asset": str(OUTPUT),
        "blend": str(BLEND_OUTPUT),
        "bones": len(rig.data.bones),
        "pose_clip": "TP_approval_pose",
        "target_engine_verified": "Three.js r147 + GLTFLoader",
        "preview_page": str(PROJECT / "test/character-anatomy-preview.html"),
        "preview_capture": str(EVIDENCE / "threejs-preview.png"),
        "body_vertices": len(body.data.vertices),
        "body_triangles": sum(
            max(0, len(polygon.vertices) - 2)
            for polygon in body.data.polygons
        ),
        "bytes": OUTPUT.stat().st_size,
        "sha256": hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
        "renders": rendered,
        "gauntlet": {
            "focus": [
                "adult anatomy",
                "shoulder-to-arm continuity",
                "recognizable hands and feet",
                "non-spherical head silhouette",
                "deforming fitted clothing",
            ],
            "runtime_promoted": False,
            "human_approval_required": True,
        },
    }
    (EVIDENCE / "manifest.json").write_text(
        json.dumps(payload, indent=2) + "\n",
        encoding="utf-8",
    )
    print("TP_COOPER_ANATOMY=" + json.dumps(payload, sort_keys=True))


def main() -> None:
    pack.clear_scene()
    rig, body = import_source_body()
    build_clothing(rig, body)
    create_pose(rig)
    camera = configure_scene()
    rendered = render_views(camera)
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUTPUT))
    bake_constraint_pose(rig)
    make_invisible_gltf_safe()
    export_candidate(rig)
    write_manifest(rig, body, rendered)


if __name__ == "__main__":
    main()
