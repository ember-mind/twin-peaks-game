"""Build the authored Pacific Northwest vegetation slice.

Run from the project root (or anywhere):

    /opt/homebrew/bin/blender --background --python tools/generate_vegetation_slice.py

The exported GLB is intentionally runtime-agnostic.  It contains eight
floor-origin roots at (0, 0, 0), all facing Blender -Y (glTF +Z after Y-up
conversion): five deliberately different conifer silhouettes and three
understory clusters.  The meshes share one small material palette so a future
renderer integration can selectively clone roots and instance their children
without generating per-instance materials.
"""

from __future__ import annotations

import json
import math
import shutil
import subprocess
from pathlib import Path

import bpy
from mathutils import Euler, Vector


PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "assets" / "models" / "twin-peaks-vegetation-slice.glb"
PREVIEW_DIR = Path("/tmp/twin-peaks-vegetation-preview")
CONTACT_SHEET = PREVIEW_DIR / "twin-peaks-vegetation-contact-sheet.png"

TREE_ROOTS = (
    "TP_VEG_DouglasFir_Cascade_LOD0",
    "TP_VEG_WesternHemlock_Wind_LOD0",
    "TP_VEG_WesternRedCedar_Young_LOD0",
    "TP_VEG_DouglasFir_BrokenSnag_LOD0",
    "TP_VEG_ConiferSapling_LOD0",
)
UNDERSTORY_ROOTS = (
    "TP_VEG_FernCluster_LOD0",
    "TP_VEG_SalalCluster_LOD0",
    "TP_VEG_SnagRootfall_LOD0",
)
EXPECTED_ROOTS = set(TREE_ROOTS + UNDERSTORY_ROOTS)
TAU = math.tau


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
    coat: float = 0.0,
    coat_roughness: float = 0.25,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = coat_roughness
    mat["tp_shared_palette"] = "pnw_vegetation_v1"
    return mat


def make_palette() -> dict[str, bpy.types.Material]:
    # Restrained values stay readable in fog and under the game's cool key.
    # Materials are intentionally shared across every root.
    return {
        "bark_dark": material(
            "TP_VEG_MAT_Bark_WetDark", (0.058, 0.030, 0.019, 1), 0.76, 0.16, 0.35
        ),
        "bark_warm": material(
            "TP_VEG_MAT_Bark_Russet", (0.145, 0.066, 0.030, 1), 0.82, 0.10, 0.4
        ),
        "needle_deep": material(
            "TP_VEG_MAT_Needle_Deep", (0.024, 0.125, 0.064, 1), 0.91, 0.08, 0.5
        ),
        "needle_mid": material(
            "TP_VEG_MAT_Needle_Mid", (0.045, 0.225, 0.108, 1), 0.88, 0.12, 0.44
        ),
        "needle_tip": material(
            "TP_VEG_MAT_Needle_Tip", (0.125, 0.340, 0.155, 1), 0.84, 0.15, 0.38
        ),
        "understory": material(
            "TP_VEG_MAT_Understory", (0.055, 0.245, 0.105, 1), 0.87, 0.18, 0.34
        ),
        "understory_light": material(
            "TP_VEG_MAT_UnderstoryLight", (0.160, 0.390, 0.140, 1), 0.84, 0.2, 0.3
        ),
        "deadwood": material(
            "TP_VEG_MAT_Deadwood", (0.175, 0.105, 0.057, 1), 0.94
        ),
        "moss": material(
            "TP_VEG_MAT_Moss", (0.050, 0.125, 0.036, 1), 0.93, 0.08, 0.46
        ),
    }


def root(name: str, category: str, species: str) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.empty_display_type = "CUBE"
    obj.empty_display_size = 0.18
    obj["tp_asset_type"] = "authored_vegetation"
    obj["tp_category"] = category
    obj["tp_species"] = species
    obj["tp_units"] = "meters"
    obj["tp_origin"] = "floor_center"
    obj["tp_forward"] = "-Y"
    obj["tp_lod_group"] = name.removesuffix("_LOD0")
    obj["tp_lod_level"] = 0
    obj["tp_lod_ready"] = True
    obj["tp_palette"] = "pnw_vegetation_v1"
    obj["tp_instancing"] = "clone_root_or_merge_by_material"
    return obj


def tag(obj: bpy.types.Object, asset_root: bpy.types.Object, role: str) -> None:
    obj.parent = asset_root
    obj["tp_vegetation_root"] = asset_root.name
    obj["tp_role"] = role


def mesh_object(
    asset_root: bpy.types.Object,
    name: str,
    verts: list[tuple[float, float, float]],
    faces: list[tuple[int, ...]],
    mat: bpy.types.Material,
    role: str,
) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    tag(obj, asset_root, role)
    return obj


def path_mesh(
    asset_root: bpy.types.Object,
    name: str,
    points: list[tuple[float, float, float]],
    radii: list[float],
    mat: bpy.types.Material,
    role: str,
    sides: int = 8,
    phase: float = 0.0,
) -> bpy.types.Object:
    """Tapered, gently irregular path; used for trunks, branches and roots."""
    verts: list[tuple[float, float, float]] = []
    for ring, (point, radius) in enumerate(zip(points, radii)):
        center = Vector(point)
        if ring == 0:
            tangent = Vector(points[1]) - center
        elif ring == len(points) - 1:
            tangent = center - Vector(points[ring - 1])
        else:
            tangent = Vector(points[ring + 1]) - Vector(points[ring - 1])
        tangent.normalize()
        reference = Vector((0, 0, 1))
        if abs(tangent.dot(reference)) > 0.94:
            reference = Vector((1, 0, 0))
        axis_a = tangent.cross(reference).normalized()
        axis_b = tangent.cross(axis_a).normalized()
        for side in range(sides):
            angle = TAU * side / sides + phase
            irregular = 1.0 + 0.055 * math.sin(side * 2.31 + ring * 1.83 + phase * 4)
            offset = (
                axis_a * math.cos(angle) + axis_b * math.sin(angle)
            ) * radius * irregular
            verts.append(tuple(center + offset))
    faces: list[tuple[int, ...]] = []
    faces.append(tuple(reversed(tuple(range(sides)))))
    for ring in range(len(points) - 1):
        a = ring * sides
        b = (ring + 1) * sides
        for side in range(sides):
            nxt = (side + 1) % sides
            faces.append((a + side, a + nxt, b + nxt, b + side))
    last = (len(points) - 1) * sides
    faces.append(tuple(last + side for side in range(sides)))
    return mesh_object(asset_root, name, verts, faces, mat, role)


def bough_pad(
    asset_root: bpy.types.Object,
    name: str,
    center: tuple[float, float, float],
    size: tuple[float, float, float],
    rotation: tuple[float, float, float],
    mat: bpy.types.Material,
    seed: float,
    role: str = "foliage",
) -> bpy.types.Object:
    """Pointed, lobed branch spray with a wet, drooping lower contour.

    The long axis is local X.  This matters at game scale: tiered conifers
    read as overlapping branch fans and crown windows, not stacked balls.
    """
    stations = 8
    sides = 8
    verts: list[tuple[float, float, float]] = []
    transform = Euler(rotation, "XYZ").to_matrix()
    for station in range(stations):
        t = station / (stations - 1)
        x = (t - 0.5) * size[0] * 2
        profile = math.sin(math.pi * (0.035 + 0.93 * t)) ** 0.58
        # Crown-side base is fuller; outer tip is longer, thinner and lower.
        profile *= 1.08 - 0.23 * t
        droop = -size[2] * (0.05 + 0.20 * t * t)
        lobe = 1.0 + 0.11 * math.sin(seed * 1.7 + station * 2.37)
        for side in range(sides):
            angle = TAU * side / sides
            jitter = (
                1.0
                + 0.10 * math.sin(seed + side * 2.17 + station * 0.71)
                + 0.04 * math.cos(seed * 0.63 + side * 1.11 - station * 1.37)
            )
            local = Vector(
                (
                    x,
                    math.cos(angle) * size[1] * profile * jitter * lobe,
                    math.sin(angle) * size[2] * profile * jitter + droop,
                )
            )
            # Subtle side sweep avoids mathematically straight branch fans.
            local.y += size[1] * 0.12 * math.sin(seed + t * 3.4)
            verts.append(tuple(Vector(center) + transform @ local))
    faces: list[tuple[int, ...]] = []
    for station in range(stations - 1):
        for side in range(sides):
            nxt = (side + 1) % sides
            a = station * sides + side
            b = station * sides + nxt
            c = (station + 1) * sides + nxt
            d = (station + 1) * sides + side
            faces.append((a, b, c, d))
    faces.append(tuple(reversed(range(sides))))
    last = (stations - 1) * sides
    faces.append(tuple(last + side for side in range(sides)))
    return mesh_object(asset_root, name, verts, faces, mat, role)


def root_flare(
    asset_root: bpy.types.Object,
    mat: bpy.types.Material,
    moss_mat: bpy.types.Material,
    radius: float,
    count: int,
    seed: float,
) -> None:
    """Curved unequal buttresses descending into a low moss/duff mound."""
    # Two partial duff patches break the circular base without making a green
    # lily-pad skirt. Most of the buttress remains bark-coloured and visible.
    for patch_index in range(2):
        patch_angle = seed + 0.75 + patch_index * 2.45
        patch_center = Vector(
            (
                math.cos(patch_angle) * radius * (0.42 + patch_index * 0.12),
                math.sin(patch_angle) * radius * (0.42 + patch_index * 0.12),
                -0.018,
            )
        )
        patch_segments = 7
        patch_verts: list[tuple[float, float, float]] = [
            tuple(patch_center + Vector((0, 0, radius * 0.055)))
        ]
        patch_faces: list[tuple[int, ...]] = []
        for segment in range(patch_segments):
            angle = TAU * segment / patch_segments
            local_x = math.cos(angle) * radius * (0.34 + patch_index * 0.05)
            local_y = math.sin(angle) * radius * (0.19 + patch_index * 0.03)
            rotated = Vector(
                (
                    local_x * math.cos(patch_angle) - local_y * math.sin(patch_angle),
                    local_x * math.sin(patch_angle) + local_y * math.cos(patch_angle),
                    -0.012,
                )
            )
            patch_verts.append(tuple(patch_center + rotated))
        for segment in range(patch_segments):
            patch_faces.append((0, segment + 1, (segment + 1) % patch_segments + 1))
        patch = mesh_object(
            asset_root,
            f"{asset_root.name}_DuffPatch_{patch_index}",
            patch_verts,
            patch_faces,
            moss_mat,
            "duff_patch",
        )
        for polygon in patch.data.polygons:
            polygon.use_smooth = True

    for index in range(count):
        angle = TAU * index / count + seed + 0.13 * math.sin(index * 2.4)
        length = radius * (0.88 + 0.30 * math.sin(seed * 2 + index * 1.7) ** 2)
        width = radius * (0.48 + 0.13 * math.sin(seed + index * 2.1))
        direction = Vector((math.cos(angle), math.sin(angle), 0))
        side = Vector((-math.sin(angle), math.cos(angle), 0))
        stations = (
            (radius * 0.08, width * 0.64, radius * 0.76),
            (radius * 0.34, width * 0.54, radius * 0.50),
            (length * 0.68, width * 0.30, radius * 0.15),
            (length, width * 0.10, -0.050),
        )
        verts: list[tuple[float, float, float]] = []
        for station_index, (distance, half_width, height) in enumerate(stations):
            center = direction * distance
            center += side * radius * 0.04 * math.sin(seed + index + station_index)
            base_z = -0.018 - station_index * 0.006
            verts.extend(
                [
                    tuple(center - side * half_width + Vector((0, 0, base_z))),
                    tuple(center + side * half_width + Vector((0, 0, base_z))),
                    tuple(center + Vector((0, 0, height))),
                ]
            )
        faces: list[tuple[int, ...]] = []
        for station_index in range(len(stations) - 1):
            a = station_index * 3
            b = (station_index + 1) * 3
            faces.extend(
                [
                    (a, a + 2, b + 2, b),
                    (a + 2, a + 1, b + 1, b + 2),
                    (a, b, b + 1, a + 1),
                ]
            )
        faces.extend([(0, 1, 2), (9, 11, 10)])
        buttress = mesh_object(
            asset_root,
            f"{asset_root.name}_Buttress_{index:02d}",
            verts,
            faces,
            mat,
            "root_flare",
        )
        for polygon in buttress.data.polygons:
            polygon.use_smooth = True


def branch(
    asset_root: bpy.types.Object,
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius: float,
    mat: bpy.types.Material,
    bend: float = 0.05,
) -> None:
    a = Vector(start)
    b = Vector(end)
    mid = a.lerp(b, 0.54)
    mid.z += bend
    path_mesh(
        asset_root,
        name,
        [tuple(a), tuple(mid), tuple(b)],
        [radius, radius * 0.62, radius * 0.17],
        mat,
        "branch",
        sides=6,
        phase=a.z + b.x,
    )


def foliage_lobe(
    asset_root: bpy.types.Object,
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    width: float,
    thickness: float,
    mat: bpy.types.Material,
    underside_mat: bpy.types.Material,
    seed: float,
) -> bpy.types.Object:
    """One compact asymmetric 3D needle lobe, never a broad plate."""
    a = Vector(start)
    b = Vector(end)
    direction = (b - a).normalized()
    side = direction.cross(Vector((0, 0, 1)))
    if side.length < 0.05:
        side = Vector((1, 0, 0))
    side.normalize()
    up = side.cross(direction).normalized()
    stations = 4
    sides = 5
    profiles = (0.10, 1.0, 0.68, 0.035)
    verts: list[tuple[float, float, float]] = []
    for index in range(stations):
        t = index / (stations - 1)
        center = a.lerp(b, t)
        center += side * width * 0.07 * math.sin(seed + t * 4.3)
        profile = profiles[index] * (
            1 + 0.11 * math.sin(seed * 1.7 + index * 2.1)
        )
        for side_index in range(sides):
            angle = TAU * side_index / sides + seed * 0.07
            offset = (
                side * math.cos(angle) * width
                + up * math.sin(angle) * thickness
            ) * profile
            verts.append(tuple(center + offset))
    faces: list[tuple[int, ...]] = []
    for station in range(stations - 1):
        for side_index in range(sides):
            nxt = (side_index + 1) % sides
            a0 = station * sides
            b0 = (station + 1) * sides
            faces.append((a0 + side_index, a0 + nxt, b0 + nxt, b0 + side_index))
    faces.extend(
        [
            tuple(reversed(range(sides))),
            tuple((stations - 1) * sides + i for i in range(sides)),
        ]
    )
    obj = mesh_object(asset_root, name, verts, faces, mat, "foliage_lobe")
    if underside_mat != mat:
        obj.data.materials.append(underside_mat)
        for polygon_index, polygon in enumerate(obj.data.polygons):
            if polygon_index < (stations - 1) * sides and polygon_index % sides in (2, 3, 4):
                polygon.material_index = 1
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def foliage_fan(
    asset_root: bpy.types.Object,
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    width: float,
    thickness: float,
    mat: bpy.types.Material,
    underside_mat: bpy.types.Material,
    branch_mat: bpy.types.Material,
    seed: float,
    lobe_count: int = 4,
    sag: float = 0.10,
    hang: float = 0.0,
) -> None:
    """Compact branch-led spray made from 3–5 overlapping 3D lobes."""
    a = Vector(start)
    b = Vector(end)
    delta = b - a
    length = delta.length
    direction = delta.normalized()
    side = direction.cross(Vector((0, 0, 1)))
    if side.length < 0.05:
        side = Vector((1, 0, 0))
    side.normalize()
    up = side.cross(direction).normalized()
    branch(
        asset_root,
        name + "_Branchlet",
        tuple(a),
        tuple(b + Vector((0, 0, -sag * 0.18))),
        max(0.006, min(0.016, width * 0.055)),
        branch_mat,
        bend=0.012,
    )
    count = max(3, min(6, lobe_count))
    # Authored cluster positions deliberately occupy one compact section of
    # branchlet. Differently sized lobes intersect; they never become a bead
    # row running at equal intervals.
    cluster_positions = {
        3: (0.20, 0.34, 0.49),
        4: (0.18, 0.29, 0.41, 0.53),
        5: (0.16, 0.25, 0.35, 0.45, 0.56),
        6: (0.15, 0.23, 0.31, 0.40, 0.49, 0.58),
    }[count]
    size_pattern = (1.00, 0.72, 0.90, 0.62, 0.80, 0.55)
    for lobe_index in range(count):
        t = cluster_positions[lobe_index]
        lobe_start = a.lerp(b, t)
        sign = -1 if lobe_index % 2 == 0 else 1
        if lobe_index == count - 1:
            lobe_direction = direction * 0.96 + up * (0.04 - hang)
        else:
            lateral = sign * (0.44 + 0.10 * math.sin(seed + lobe_index * 1.9))
            vertical = -0.10 - hang - 0.07 * math.sin(seed * 0.7 + lobe_index)
            lobe_direction = direction * (0.56 + lobe_index * 0.04) + side * lateral + up * vertical
        lobe_direction.normalize()
        lobe_length = length * (
            (0.48 + 0.05 * math.sin(seed * 1.3 + lobe_index * 2.2) ** 2)
            * size_pattern[lobe_index]
        )
        lobe_end = lobe_start + lobe_direction * lobe_length
        lobe_end.z -= sag * (0.32 + lobe_index * 0.04)
        foliage_lobe(
            asset_root,
            f"{name}_Lobe_{lobe_index}",
            tuple(lobe_start - direction * length * 0.035),
            tuple(lobe_end),
            width * (0.64 + 0.07 * math.sin(seed + lobe_index)) * size_pattern[lobe_index] ** 0.45,
            thickness * (0.64 + 0.06 * math.cos(seed * 0.8 + lobe_index)),
            mat,
            underside_mat,
            seed + lobe_index * 1.73,
        )


def supported_bough(
    asset_root: bpy.types.Object,
    name: str,
    origin: tuple[float, float, float],
    angle: float,
    length: float,
    mat_branch: bpy.types.Material,
    mat_foliage: bpy.types.Material,
    mat_shadow: bpy.types.Material,
    seed: float,
    radius: float,
    droop: float,
    fullness: int = 3,
    lift: float = 0.0,
    hang: float = 0.0,
    coverage: float = 1.0,
) -> None:
    """One tapered bough supporting one compact 3–5-lobe 3D spray."""
    start = Vector(origin)
    direction = Vector((math.cos(angle), math.sin(angle), 0))
    joint = start + direction * length * 0.16 + Vector((0, 0, 0.015 + lift * 0.12))
    tip = start + direction * length + Vector((0, 0, lift - droop))
    branch(
        asset_root,
        name + "_Wood",
        tuple(start),
        tuple(tip),
        radius,
        mat_branch,
        bend=0.035,
    )
    foliage_fan(
        asset_root,
        name + "_Spray",
        tuple(joint),
        tuple(tip + direction * length * 0.08),
        length * 0.38 * coverage,
        length * 0.22 * coverage,
        mat_foliage,
        mat_shadow,
        mat_branch,
        seed,
        lobe_count=fullness,
        sag=droop * 0.55,
        hang=hang,
    )


def douglas_fir_cascade(p: dict[str, bpy.types.Material]) -> None:
    r = root(TREE_ROOTS[0], "tree", "Douglas fir — broad drooping cascade")
    path_mesh(
        r,
        r.name + "_Trunk",
        [(0, 0, 0), (0.03, -0.01, 1.0), (-0.02, 0.02, 2.15), (0.06, 0, 3.25), (0.01, 0, 4.35)],
        [0.34, 0.28, 0.19, 0.09, 0.018],
        p["bark_warm"],
        "trunk",
        11,
        0.3,
    )
    root_flare(r, p["bark_dark"], p["moss"], 0.46, 5, 0.26)
    # Eight authored weight-bearing zones, never generated radial rings.
    zones = (
        (0.78, ((0.10, 1.48, 0.21, 6, 0.00), (2.52, 1.16, 0.17, 5, 0.07), (4.46, 1.34, 0.23, 6, -0.03))),
        (1.22, ((0.72, 1.29, 0.18, 6, 0.02), (3.30, 1.08, 0.22, 5, -0.05), (5.52, 0.96, 0.17, 5, 0.06))),
        (1.72, ((0.02, 1.15, 0.22, 6, 0.05), (2.76, 0.91, 0.18, 5, -0.04))),
        (2.18, ((1.06, 0.96, 0.20, 5, -0.03), (3.71, 0.85, 0.24, 5, 0.07), (5.68, 0.72, 0.17, 4, 0.00))),
        (2.67, ((0.32, 0.77, 0.21, 5, 0.04), (2.31, 0.66, 0.18, 4, -0.05), (4.80, 0.71, 0.23, 5, 0.02))),
        (3.12, ((1.34, 0.58, 0.19, 4, 0.00), (3.92, 0.50, 0.22, 4, 0.05))),
        (3.50, ((0.05, 0.43, 0.15, 4, 0.03), (2.58, 0.38, 0.19, 4, -0.02), (5.12, 0.34, 0.15, 3, 0.04))),
        (3.82, ((1.03, 0.29, 0.13, 3, 0.00), (4.16, 0.25, 0.16, 3, 0.03))),
    )
    for zone_index, (z, boughs) in enumerate(zones):
        for bough_index, (angle, length, droop, lobes, z_offset) in enumerate(boughs):
            supported_bough(
                r,
                f"{r.name}_CascadeZone_{zone_index:02d}_{bough_index}",
                (0.01, 0, z + z_offset),
                angle,
                length,
                p["bark_dark"],
                p["needle_deep" if zone_index < 2 else "needle_mid"],
                p["needle_deep"],
                10 + zone_index * 5 + bough_index,
                max(0.018, 0.064 - zone_index * 0.006),
                droop,
                lobes,
                coverage=1.15,
            )
    # Tiny directional new-growth fans articulate the leader without a blob.
    supported_bough(r, r.name + "_LeaderSpray", (0.01, 0, 3.86), -0.15, 0.55, p["bark_dark"], p["needle_tip"], p["needle_deep"], 47, 0.018, 0.04, 3)


def douglas_fir_storm(p: dict[str, bpy.types.Material]) -> None:
    r = root(TREE_ROOTS[1], "tree", "Western hemlock — airy wind crown")
    path_mesh(
        r,
        r.name + "_BentTrunk",
        [(0, 0, 0), (0.01, 0, 1.05), (-0.03, 0.01, 2.2), (0.10, 0, 3.35), (0.29, 0, 4.30), (0.56, -0.02, 4.62)],
        [0.24, 0.20, 0.13, 0.065, 0.025, 0.010],
        p["bark_dark"],
        "trunk",
        9,
        0.8,
    )
    root_flare(r, p["bark_warm"], p["moss"], 0.34, 4, 0.82)
    # Nine authored wind-biased zones; middle zones overlap continuously.
    zones = (
        (0.80, ((-0.44, 1.02, 0.25, 5, 0.00), (2.92, 0.55, 0.22, 4, 0.06))),
        (1.24, ((0.18, 0.94, 0.27, 5, 0.02), (3.84, 0.51, 0.21, 4, -0.05))),
        (1.63, ((-0.62, 0.92, 0.30, 6, 0.04), (1.64, 0.62, 0.25, 5, -0.03), (4.54, 0.48, 0.22, 4, 0.06))),
        (2.02, ((-0.18, 0.84, 0.31, 6, 0.00), (2.36, 0.57, 0.27, 5, 0.07), (4.91, 0.43, 0.22, 4, -0.04))),
        (2.42, ((0.46, 0.75, 0.30, 6, -0.03), (3.18, 0.53, 0.27, 5, 0.05))),
        (2.82, ((-0.56, 0.67, 0.29, 5, 0.04), (1.72, 0.47, 0.24, 4, -0.05), (4.35, 0.38, 0.22, 4, 0.02))),
        (3.22, ((0.12, 0.56, 0.27, 5, 0.00), (3.67, 0.37, 0.22, 4, 0.06))),
        (3.60, ((-0.47, 0.44, 0.24, 4, 0.04), (2.12, 0.31, 0.20, 3, -0.04))),
        (3.93, ((0.32, 0.33, 0.22, 4, 0.00), (4.20, 0.22, 0.17, 3, 0.03))),
    )
    for zone_index, (z, boughs) in enumerate(zones):
        trunk_x = max(0, (z - 2.2) * 0.10)
        for bough_index, (angle, length, droop, lobes, z_offset) in enumerate(boughs):
            supported_bough(
                r,
                f"{r.name}_WindZone_{zone_index:02d}_{bough_index}",
                (trunk_x, 0, z + z_offset),
                angle,
                length,
                p["bark_dark"],
                p["needle_deep" if zone_index < 2 else "needle_mid"],
                p["needle_deep"],
                70 + zone_index * 5 + bough_index,
                max(0.014, 0.046 - zone_index * 0.0035),
                droop,
                lobes,
                hang=0.14,
                coverage=1.35,
            )
    supported_bough(r, r.name + "_BentLeader", (0.25, 0, 4.18), -0.15, 0.56, p["bark_dark"], p["needle_tip"], p["needle_deep"], 101, 0.014, 0.16, 3)


def western_red_cedar(p: dict[str, bpy.types.Material]) -> None:
    r = root(TREE_ROOTS[2], "tree", "Western red cedar — young fan crown")
    path_mesh(
        r,
        r.name + "_FlutedTrunk",
        [(0, 0, 0), (-0.02, 0.01, 0.92), (0.03, -0.01, 1.92), (-0.01, 0.01, 3.0), (0.07, 0, 3.84)],
        [0.30, 0.24, 0.15, 0.07, 0.015],
        p["bark_dark"],
        "trunk",
        11,
        0.46,
    )
    root_flare(r, p["bark_warm"], p["moss"], 0.43, 5, 0.61)
    # Eight hanging curtain zones with hand-authored azimuths and overlaps.
    zones = (
        (0.62, ((0.16, 0.91, 0.35, 6, 0.00), (1.62, 0.78, 0.39, 6, 0.06), (3.32, 0.88, 0.37, 6, -0.04), (5.10, 0.80, 0.41, 6, 0.03))),
        (1.05, ((0.72, 0.85, 0.39, 6, 0.03), (2.26, 0.76, 0.36, 5, -0.05), (4.02, 0.82, 0.42, 6, 0.06), (5.66, 0.72, 0.38, 5, -0.02))),
        (1.48, ((0.05, 0.80, 0.40, 6, 0.04), (1.88, 0.73, 0.37, 5, -0.05), (3.56, 0.77, 0.43, 6, 0.03), (5.28, 0.68, 0.39, 5, 0.08))),
        (1.92, ((0.54, 0.75, 0.41, 6, -0.03), (2.46, 0.67, 0.38, 5, 0.05), (4.36, 0.72, 0.44, 6, 0.00))),
        (2.36, ((0.02, 0.68, 0.40, 6, 0.05), (1.74, 0.60, 0.37, 5, -0.04), (3.64, 0.64, 0.43, 6, 0.03), (5.42, 0.55, 0.36, 5, -0.06))),
        (2.79, ((0.68, 0.57, 0.38, 5, 0.00), (2.68, 0.50, 0.35, 5, 0.07), (4.72, 0.53, 0.40, 5, -0.04))),
        (3.18, ((0.16, 0.45, 0.34, 5, 0.04), (2.04, 0.39, 0.32, 4, -0.05), (4.10, 0.42, 0.36, 5, 0.02))),
        (3.51, ((0.88, 0.31, 0.29, 4, 0.00), (3.02, 0.27, 0.27, 4, 0.05), (5.12, 0.24, 0.25, 3, -0.03))),
    )
    for zone_index, (z, boughs) in enumerate(zones):
        for bough_index, (angle, length, droop, lobes, z_offset) in enumerate(boughs):
            supported_bough(
                r,
                f"{r.name}_CurtainZone_{zone_index:02d}_{bough_index}",
                (0, 0, z + z_offset),
                angle,
                length,
                p["bark_dark"],
                p["needle_deep" if zone_index < 2 else "needle_mid"],
                p["needle_deep"],
                120 + zone_index * 5 + bough_index,
                max(0.014, 0.043 - zone_index * 0.004),
                droop,
                lobes,
                hang=0.30,
                coverage=1.14,
            )
    supported_bough(r, r.name + "_YoungLeader", (0.03, 0, 3.36), -0.10, 0.58, p["bark_dark"], p["needle_tip"], p["needle_deep"], 173, 0.015, 0.08, 3)


def douglas_fir_old_growth(p: dict[str, bpy.types.Material]) -> None:
    r = root(TREE_ROOTS[3], "tree", "Douglas fir — lightning-broken snag")
    path_mesh(
        r,
        r.name + "_SnagTrunk",
        [(0, 0, 0), (-0.03, 0.01, 1.0), (0.04, 0, 2.25), (0.01, -0.01, 3.48), (0.10, 0, 4.48)],
        [0.43, 0.36, 0.25, 0.16, 0.10],
        p["bark_warm"],
        "snag_trunk",
        12,
        0.16,
    )
    root_flare(r, p["bark_dark"], p["moss"], 0.56, 5, 0.08)
    # Pale lightning scar stands proud of the bark, avoiding coplanar flicker.
    mesh_object(
        r,
        r.name + "_BarkLoss",
        [
            (-0.15, -0.255, 1.28),
            (0.10, -0.252, 1.18),
            (0.17, -0.205, 2.12),
            (0.05, -0.175, 2.82),
            (-0.09, -0.182, 2.62),
            (-0.20, -0.218, 1.84),
        ],
        [(0, 1, 2, 3, 4, 5), (5, 4, 3, 2, 1, 0)],
        p["deadwood"],
        "bark_loss",
    )
    # Exposed dead limbs are the grammar; one bough carries surviving foliage.
    dead_specs = (
        (1.15, 0.05, 1.18),
        (1.74, 2.72, 0.84),
        (2.28, 0.93, 1.02),
        (2.84, 3.45, 0.74),
        (3.36, -0.28, 0.66),
        (3.78, 2.14, 0.53),
    )
    for limb_index, (z, angle, length) in enumerate(dead_specs):
        start = (0.02, 0, z)
        end = (
            math.cos(angle) * length,
            math.sin(angle) * length,
            z + (0.12 if limb_index in (1, 4) else -0.08),
        )
        branch(r, f"{r.name}_DeadLimb_{limb_index:02d}", start, end, max(0.035, 0.082 - limb_index * 0.007), p["deadwood"], 0.02)
        # Broken side spur.
        spur_start = Vector(start).lerp(Vector(end), 0.58)
        spur_angle = angle + (-0.72 if limb_index % 2 else 0.64)
        spur_end = spur_start + Vector((math.cos(spur_angle), math.sin(spur_angle), 0.18)) * length * 0.30
        branch(r, f"{r.name}_DeadSpur_{limb_index:02d}", tuple(spur_start), tuple(spur_end), 0.025, p["deadwood"], -0.01)
        if limb_index == 2:
            survivor_start = Vector(start).lerp(Vector(end), 0.34)
            survivor_dir = Vector((math.cos(angle), math.sin(angle), 0))
            foliage_fan(
                r,
                r.name + "_ConnectedSurvivor",
                tuple(survivor_start),
                tuple(Vector(end) + survivor_dir * length * 0.10),
                length * 0.25,
                length * 0.12,
                p["needle_mid"],
                p["needle_deep"],
                p["bark_dark"],
                190,
                lobe_count=5,
                sag=0.12,
            )
    # Jagged broken leader and one fresh recovery shoot.
    path_mesh(r, r.name + "_BrokenLeader", [(0.08, 0, 4.20), (0.11, 0, 4.54)], [0.12, 0.085], p["deadwood"], "snag", 8, 0.2)
    path_mesh(r, r.name + "_TornTop_A", [(0.04, -0.02, 4.45), (-0.01, -0.03, 4.72)], [0.055, 0.008], p["deadwood"], "torn_top", 6, 0.1)
    path_mesh(r, r.name + "_TornTop_B", [(0.13, 0.03, 4.44), (0.22, 0.04, 4.66)], [0.045, 0.007], p["deadwood"], "torn_top", 6, 0.8)
    path_mesh(r, r.name + "_TornTop_C", [(0.08, 0.02, 4.45), (0.06, 0.08, 4.61)], [0.035, 0.006], p["deadwood"], "torn_top", 5, 1.3)
    branch(
        r,
        r.name + "_DeadRecoveryShoot",
        (0.02, 0, 3.62),
        (-0.50, 0.20, 4.05),
        0.025,
        p["deadwood"],
        0.01,
    )


def young_hemlock(p: dict[str, bpy.types.Material]) -> None:
    r = root(TREE_ROOTS[4], "tree", "compact conifer sapling — visible whorls")
    path_mesh(
        r,
        r.name + "_SaplingTrunk",
        [(0, 0, 0), (0.01, 0, 0.72), (-0.025, 0.01, 1.42), (0.04, 0, 2.15), (0.09, 0, 2.72)],
        [0.17, 0.13, 0.075, 0.032, 0.008],
        p["bark_dark"],
        "trunk",
        8,
        0.63,
    )
    root_flare(r, p["bark_warm"], p["moss"], 0.25, 3, 0.43)
    # Short internodes and compact whorls separate the sapling from the
    # long-limbed mature Douglas grammar.
    zones = (
        (0.43, ((0.22, 0.70, 0.00), (1.70, 0.61, 0.05), (3.42, 0.67, -0.03), (5.18, 0.57, 0.04))),
        (0.70, ((0.78, 0.65, 0.03), (2.66, 0.59, -0.04), (4.52, 0.62, 0.05))),
        (0.98, ((0.06, 0.58, 0.04), (1.48, 0.54, -0.03), (3.18, 0.57, 0.05), (5.06, 0.49, -0.02))),
        (1.26, ((0.64, 0.51, 0.00), (2.48, 0.47, 0.05), (4.38, 0.50, -0.04))),
        (1.54, ((0.02, 0.44, 0.04), (1.82, 0.41, -0.03), (3.72, 0.43, 0.05), (5.40, 0.36, -0.02))),
        (1.82, ((0.86, 0.36, 0.02), (2.91, 0.34, -0.04), (4.86, 0.32, 0.04))),
        (2.09, ((0.18, 0.28, 0.03), (2.16, 0.26, -0.03), (4.30, 0.24, 0.04))),
        (2.33, ((1.02, 0.20, 0.00), (3.36, 0.18, 0.04), (5.48, 0.16, -0.03))),
    )
    for zone_index, (z, boughs) in enumerate(zones):
        for bough_index, (angle, length, z_offset) in enumerate(boughs):
            supported_bough(
                r,
                f"{r.name}_JuvenileZone_{zone_index:02d}_{bough_index}",
                (0, 0, z + z_offset),
                angle,
                length,
                p["bark_dark"],
                p["needle_deep" if zone_index == 0 else "needle_mid"],
                p["needle_deep"],
                220 + zone_index * 5 + bough_index,
                max(0.011, 0.034 - zone_index * 0.003),
                0.045,
                5 if zone_index < 5 else 4,
                lift=0.20 - zone_index * 0.012,
                coverage=1.25,
            )
    supported_bough(r, r.name + "_TopWhorl", (0.04, 0, 2.43), 0.12, 0.34, p["bark_dark"], p["needle_tip"], p["needle_deep"], 249, 0.012, 0.025, 3, lift=0.22)


def leaf_mesh(
    asset_root: bpy.types.Object,
    name: str,
    center: tuple[float, float, float],
    length: float,
    width: float,
    yaw: float,
    pitch: float,
    mat: bpy.types.Material,
    role: str,
) -> bpy.types.Object:
    # A subtly folded, pointed leaf with a centre ridge, visible from both sides.
    local = [
        (-width * 0.08, -length * 0.52, 0),
        (-width, -length * 0.06, -width * 0.08),
        (0, 0, width * 0.10),
        (width, -length * 0.04, -width * 0.07),
        (width * 0.72, length * 0.32, 0),
        (0, length * 0.58, width * 0.035),
        (-width * 0.68, length * 0.30, 0),
    ]
    transform = Euler((pitch, 0, yaw), "XYZ").to_matrix()
    verts = [tuple(Vector(center) + transform @ Vector(v)) for v in local]
    faces = [(0, 1, 2), (0, 2, 3), (3, 2, 4), (4, 2, 5), (5, 2, 6), (6, 2, 1)]
    faces += [tuple(reversed(face)) for face in faces]
    return mesh_object(asset_root, name, verts, faces, mat, role)


def fern_cluster(p: dict[str, bpy.types.Material]) -> None:
    r = root(UNDERSTORY_ROOTS[0], "understory", "sword fern cluster")
    for i in range(13):
        angle = TAU * i / 13 + 0.16 * math.sin(i * 1.8)
        length = 0.78 + 0.27 * math.sin(i * 2.17 + 0.4)
        base = Vector((0.06 * math.sin(i), 0.04 * math.cos(i * 1.3), 0.055))
        direction = Vector((math.cos(angle), math.sin(angle), 0))
        tip = base + direction * length
        tip.z = 0.18 + 0.12 * math.cos(i * 1.4)
        mid = base.lerp(tip, 0.52)
        mid.z = 0.42 + 0.07 * math.sin(i)
        path_mesh(r, f"{r.name}_Rachis_{i:02d}", [tuple(base), tuple(mid), tuple(tip)], [0.018, 0.013, 0.004], p["understory"], "fern_rachis", 5, i * 0.4)
        for leaflet in range(1, 7):
            t = leaflet / 7
            center = base.lerp(mid, min(1, t * 1.9)) if t < 0.53 else mid.lerp(tip, (t - 0.53) / 0.47)
            scale = math.sin(math.pi * t) * 0.16
            for sign in (-1, 1):
                leaf_mesh(
                    r,
                    f"{r.name}_Pinna_{i:02d}_{leaflet}_{'L' if sign < 0 else 'R'}",
                    tuple(center),
                    0.19 + 0.04 * math.sin(i + leaflet),
                    max(0.025, scale * 0.36),
                    angle + sign * (1.20 + 0.12 * math.sin(leaflet)),
                    -0.12 + 0.05 * sign,
                    p["understory_light" if (i + leaflet) % 4 == 0 else "understory"],
                    "fern_pinna",
                )


def salal_cluster(p: dict[str, bpy.types.Material]) -> None:
    r = root(UNDERSTORY_ROOTS[1], "understory", "salal and huckleberry shrub")
    stems = [
        (-0.38, -0.05, 0.68, -0.16),
        (-0.12, 0.10, 0.94, 0.09),
        (0.13, -0.04, 0.79, -0.04),
        (0.36, 0.13, 0.63, 0.18),
        (0.05, 0.26, 0.58, 0.31),
    ]
    for i, (x, y, height, lean) in enumerate(stems):
        points = [(x, y, 0.03), (x + lean * 0.3, y - lean * 0.12, height * 0.48), (x + lean, y, height)]
        path_mesh(r, f"{r.name}_Stem_{i:02d}", points, [0.025, 0.017, 0.007], p["bark_warm"], "shrub_stem", 6, i)
        for j in range(4):
            t = 0.28 + j * 0.19
            center = Vector(points[0]).lerp(Vector(points[1]), min(1, t * 1.7)) if t < 0.58 else Vector(points[1]).lerp(Vector(points[2]), (t - 0.58) / 0.42)
            for sign in (-1, 1):
                leaf_mesh(
                    r,
                    f"{r.name}_Leaf_{i:02d}_{j}_{sign:+d}",
                    tuple(center + Vector((0.02 * sign, 0, 0))),
                    0.25 + 0.03 * math.sin(i + j),
                    0.095,
                    0.55 * i + sign * (0.82 + 0.08 * j),
                    -0.18 + j * 0.04,
                    p["understory_light" if (i * 3 + j) % 5 == 0 else "understory"],
                    "salal_leaf",
                )


def snag_rootfall(p: dict[str, bpy.types.Material]) -> None:
    r = root(UNDERSTORY_ROOTS[2], "understory", "storm snag and rootfall")
    # Fallen bole lies along X and has a fractured end rather than a cylinder cap.
    path_mesh(
        r,
        r.name + "_FallenBole",
        [(-1.10, 0.02, 0.20), (-0.24, 0.01, 0.24), (0.82, -0.03, 0.17)],
        [0.17, 0.22, 0.13],
        p["deadwood"],
        "fallen_log",
        9,
        0.28,
    )
    # Root plate rises at the left end with individually bent roots.
    for i in range(9):
        angle = -1.18 + i * 2.36 / 8
        start = (-1.04, 0, 0.19)
        mid = (-1.20, math.sin(angle) * 0.33, 0.34 + 0.16 * math.cos(angle))
        end = (-1.38, math.sin(angle) * 0.54, max(0.025, 0.20 + 0.28 * math.cos(angle)))
        path_mesh(r, f"{r.name}_RootFan_{i:02d}", [start, mid, end], [0.065, 0.040, 0.012], p["bark_dark"], "root_fan", 6, i * 0.31)
    # Broken vertical snag balances the silhouette.
    path_mesh(
        r,
        r.name + "_Snag",
        [(0.46, 0.18, 0), (0.43, 0.16, 0.56), (0.52, 0.17, 1.17)],
        [0.16, 0.125, 0.075],
        p["deadwood"],
        "snag",
        9,
        0.63,
    )
    branch(r, r.name + "_SnagArm", (0.47, 0.17, 0.76), (0.78, 0.13, 1.03), 0.055, p["deadwood"], -0.03)
    for i, center in enumerate(((-0.55, -0.04, 0.35), (0.08, 0.01, 0.39), (0.53, 0.16, 0.56))):
        bough_pad(
            r,
            f"{r.name}_Moss_{i}",
            center,
            (0.28, 0.16, 0.11),
            (0, 0, 0.15 * i),
            p["moss"],
            101 + i,
            "moss",
        )
    # Three small ferns make the rootfall a composed ecological vignette.
    for i in range(3):
        angle = 0.7 + i * 1.8
        for j in range(5):
            yaw = angle + (j - 2) * 0.38
            leaf_mesh(
                r,
                f"{r.name}_Fern_{i}_{j}",
                (-0.72 + i * 0.45, 0.20 - i * 0.12, 0.13),
                0.38 - j * 0.015,
                0.055,
                yaw,
                -0.34,
                p["understory_light" if j == 2 else "understory"],
                "fern_pinna",
            )


def consolidate_mesh_batches() -> None:
    """Join compatible children per root/material signature before export.

    Authored construction uses many small branch/spray meshes for clarity.
    Shipping hundreds of nodes would turn that authorship into draw-call debt,
    so the GLB contains only a handful of reusable batches per root.
    """
    for root_name in sorted(EXPECTED_ROOTS):
        root_obj = bpy.data.objects[root_name]
        children = [obj for obj in descendants(root_obj) if obj.type == "MESH"]
        groups: dict[tuple[str, ...], list[bpy.types.Object]] = {}
        for obj in children:
            signature = tuple(
                slot.material.name if slot.material else "NONE"
                for slot in obj.material_slots
            )
            groups.setdefault(signature, []).append(obj)
        for batch_index, (signature, objects) in enumerate(sorted(groups.items())):
            bpy.ops.object.select_all(action="DESELECT")
            for obj in objects:
                obj.select_set(True)
            active = objects[0]
            bpy.context.view_layer.objects.active = active
            if len(objects) > 1:
                bpy.ops.object.join()
            safe_name = "_".join(name.replace("TP_VEG_MAT_", "") for name in signature)
            active.name = f"{root_name}_Batch_{batch_index:02d}_{safe_name}"
            active.data.name = active.name + "_Mesh"
            active.parent = root_obj
            active["tp_vegetation_root"] = root_name
            active["tp_role"] = "merged_runtime_batch"
            active["tp_batch_materials"] = "|".join(signature)
            active.select_set(False)


def build_scene() -> None:
    clear_scene()
    palette = make_palette()
    douglas_fir_cascade(palette)
    douglas_fir_storm(palette)
    western_red_cedar(palette)
    douglas_fir_old_growth(palette)
    young_hemlock(palette)
    fern_cluster(palette)
    salal_cluster(palette)
    snag_rootfall(palette)
    consolidate_mesh_batches()
    scene = bpy.context.scene
    scene["tp_asset"] = "twin_peaks_vegetation_slice"
    scene["tp_version"] = "1.0.0"
    scene["tp_forward"] = "-Y"
    scene["tp_palette"] = "pnw_vegetation_v1"
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


def descendants(root_obj: bpy.types.Object) -> list[bpy.types.Object]:
    found: list[bpy.types.Object] = []
    stack = list(root_obj.children)
    while stack:
        child = stack.pop()
        found.append(child)
        stack.extend(child.children)
    return found


def validate_glb() -> dict[str, object]:
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(OUTPUT_PATH))
    roots = {
        obj.name
        for obj in bpy.context.scene.objects
        if obj.type == "EMPTY" and obj.name.startswith("TP_VEG_")
    }
    if roots != EXPECTED_ROOTS:
        raise RuntimeError(
            f"Vegetation root mismatch: missing={sorted(EXPECTED_ROOTS - roots)}, "
            f"unexpected={sorted(roots - EXPECTED_ROOTS)}"
        )
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    root_budgets: dict[str, dict[str, int]] = {}
    for root_name in sorted(EXPECTED_ROOTS):
        root_obj = bpy.data.objects[root_name]
        if root_obj.location.length > 0.0001:
            raise RuntimeError(f"{root_name} is not at the shared floor origin")
        if root_obj.get("tp_forward") != "-Y":
            raise RuntimeError(f"{root_name} lost -Y forward metadata")
        children = [obj for obj in descendants(root_obj) if obj.type == "MESH"]
        if not children:
            raise RuntimeError(f"{root_name} contains no renderable mesh")
        minimum_z = min(
            (obj.matrix_world @ Vector(corner)).z
            for obj in children
            for corner in obj.bound_box
        )
        # Root-flare cross-sections are allowed a small soil embed so they do
        # not hover on uneven runtime terrain.  The logical root still sits at
        # the shared floor origin.
        if minimum_z < -0.052:
            raise RuntimeError(f"{root_name} penetrates floor: minZ={minimum_z:.4f}")
        root_budgets[root_name] = {
            "meshes": len(children),
            "triangles": sum(
                len(poly.vertices) - 2 for obj in children for poly in obj.data.polygons
            ),
        }
    unowned = [
        obj.name
        for obj in meshes
        if not obj.get("tp_vegetation_root")
        or obj.get("tp_vegetation_root") not in EXPECTED_ROOTS
    ]
    if unowned:
        raise RuntimeError(f"Meshes without a valid vegetation root: {unowned}")
    materials = sorted(
        {
            slot.material.name
            for obj in meshes
            for slot in obj.material_slots
            if slot.material
        }
    )
    stats = {
        "file": str(OUTPUT_PATH),
        "bytes": OUTPUT_PATH.stat().st_size,
        "roots": sorted(roots),
        "tree_roots": list(TREE_ROOTS),
        "understory_roots": list(UNDERSTORY_ROOTS),
        "root_budgets": root_budgets,
        "meshes": len(meshes),
        "materials": materials,
        "material_count": len(materials),
        "triangles": sum(
            len(poly.vertices) - 2 for obj in meshes for poly in obj.data.polygons
        ),
    }
    # This is an eight-root library, not one runtime instance.  A scene loads
    # selected roots; the complete authored kit remains below 52k triangles.
    if stats["triangles"] > 52000:
        raise RuntimeError(f"Vegetation slice exceeds 52k library budget: {stats['triangles']}")
    if stats["material_count"] > 9:
        raise RuntimeError(f"Vegetation slice exceeds 9 shared materials: {materials}")
    return stats


def add_preview_ground() -> None:
    ground_mat = material("TP_PREVIEW_ForestFloor", (0.033, 0.060, 0.035, 1), 0.98)
    verts = [(-7.8, -3.0, -0.045), (7.8, -3.0, -0.045), (7.8, 3.0, -0.045), (-7.8, 3.0, -0.045)]
    mesh = bpy.data.meshes.new("TP_PREVIEW_GroundMesh")
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    obj = bpy.data.objects.new("TP_PREVIEW_Ground", mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(ground_mat)


def preview_layout() -> None:
    positions = {
        TREE_ROOTS[0]: (-5.0, 0.2, 0),
        TREE_ROOTS[1]: (-2.55, 0.0, 0),
        TREE_ROOTS[2]: (0.0, 0.2, 0),
        TREE_ROOTS[3]: (2.65, 0.0, 0),
        TREE_ROOTS[4]: (5.05, 0.2, 0),
        UNDERSTORY_ROOTS[0]: (-3.3, -1.42, 0),
        UNDERSTORY_ROOTS[1]: (0.0, -1.46, 0),
        UNDERSTORY_ROOTS[2]: (3.35, -1.36, 0),
    }
    for name, position in positions.items():
        bpy.data.objects[name].location = position


def add_preview_lighting() -> None:
    bpy.ops.object.light_add(type="AREA", location=(-4.5, -6.5, 8.5))
    key = bpy.context.object
    key.name = "TP_PREVIEW_Key"
    key.data.energy = 1050
    key.data.shape = "DISK"
    key.data.size = 5.5
    key.data.color = (0.70, 0.84, 0.78)
    bpy.ops.object.light_add(type="AREA", location=(5.5, 2.8, 5.2))
    fill = bpy.context.object
    fill.name = "TP_PREVIEW_Fill"
    fill.data.energy = 820
    fill.data.size = 5.0
    fill.data.color = (0.37, 0.49, 0.68)
    bpy.ops.object.light_add(type="AREA", location=(0, 4.8, 7.5))
    rim = bpy.context.object
    rim.name = "TP_PREVIEW_Rim"
    rim.data.energy = 680
    rim.data.size = 4.0
    rim.data.color = (0.42, 0.65, 0.48)


def render_previews(stats: dict[str, object]) -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    preview_layout()
    add_preview_ground()
    add_preview_lighting()
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1180
    scene.render.resolution_y = 660
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world.color = (0.010, 0.017, 0.014)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.image_settings.color_mode = "RGBA"
    bpy.ops.object.camera_add()
    camera = bpy.context.object
    camera.name = "TP_PREVIEW_Camera"
    camera.data.lens = 48
    scene.camera = camera
    views = {
        "front": ((0, -17.2, 4.7), (0, 0, 2.15)),
        "three-quarter": ((13.8, -14.4, 5.7), (0, 0, 2.05)),
        "back": ((0, 17.2, 4.9), (0, 0, 2.10)),
    }
    paths: list[Path] = []
    for label, (location, target) in views.items():
        camera.location = location
        camera.rotation_euler = (
            Vector(target) - camera.location
        ).to_track_quat("-Z", "Y").to_euler()
        path = PREVIEW_DIR / f"vegetation-{label}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        paths.append(path)
    # Five isolated gameplay thumbnails force each silhouette to stand on its
    # own.  A dense neighbour cannot hide a weak or repeated crown grammar.
    for root_name in EXPECTED_ROOTS:
        root_obj = bpy.data.objects[root_name]
        root_obj.location = (0, 0, 0)
        for item in [root_obj, *descendants(root_obj)]:
            item.hide_render = root_name not in TREE_ROOTS
    thumbnail_paths: list[Path] = []
    heights = (4.55, 4.80, 4.05, 4.78, 2.90)
    for tree_index, root_name in enumerate(TREE_ROOTS):
        for candidate in TREE_ROOTS:
            candidate_root = bpy.data.objects[candidate]
            for item in [candidate_root, *descendants(candidate_root)]:
                item.hide_render = candidate != root_name
        height = heights[tree_index]
        distance = 8.8 if height > 4 else 6.8
        camera.location = (0, -distance, height * 0.56)
        camera.rotation_euler = (
            Vector((0, 0, height * 0.50)) - camera.location
        ).to_track_quat("-Z", "Y").to_euler()
        camera.data.lens = 56
        scene.render.resolution_x = 300
        scene.render.resolution_y = 400
        thumb_path = PREVIEW_DIR / f"gameplay-{tree_index + 1:02d}-{root_name}.png"
        scene.render.filepath = str(thumb_path)
        bpy.ops.render.render(write_still=True)
        thumbnail_paths.append(thumb_path)
    for root_name in EXPECTED_ROOTS:
        root_obj = bpy.data.objects[root_name]
        for item in [root_obj, *descendants(root_obj)]:
            item.hide_render = False
    magick = shutil.which("magick")
    if magick:
        subprocess.run(
            [
                magick,
                "montage",
                *(str(path) for path in paths),
                "-tile",
                "3x1",
                "-geometry",
                "720x403+8+8",
                "-background",
                "#09100d",
                str(CONTACT_SHEET),
            ],
            check=True,
        )
        # Isolated gameplay-thumbnail strip makes silhouette repetition
        # impossible to mask with the surrounding lineup.
        subprocess.run(
            [
                magick,
                "montage",
                *(str(path) for path in thumbnail_paths),
                "-tile",
                "5x1",
                "-geometry",
                "240x320+6+6",
                "-background",
                "#09100d",
                str(PREVIEW_DIR / "twin-peaks-vegetation-gameplay-scale.png"),
            ],
            check=True,
        )
    stats["preview_views"] = [str(path) for path in paths]
    stats["contact_sheet"] = str(CONTACT_SHEET)
    stats["gameplay_scale"] = str(PREVIEW_DIR / "twin-peaks-vegetation-gameplay-scale.png")
    stats["gameplay_thumbnails"] = [str(path) for path in thumbnail_paths]


def main() -> None:
    build_scene()
    export_glb()
    stats = validate_glb()
    render_previews(stats)
    print("TP_VEGETATION_VALIDATION=" + json.dumps(stats, sort_keys=True))


if __name__ == "__main__":
    main()
