#!/usr/bin/env python3
"""Build one approval-only Cooper hero asset.

This pilot stays outside runtime roster. It proves shape language, finish,
rigging and export quality before propagating any decision to other characters.
Run:
  blender --background --python tools/generate_cooper_hero_pilot.py
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


VERSION = "pilot-3.0.0"
OUTPUT = Path(
    os.environ.get(
        "TP_COOPER_PILOT_OUTPUT",
        PROJECT / "assets/models/twin-peaks-cooper-hero-pilot.glb",
    )
).resolve()
BLEND_OUTPUT = Path(
    os.environ.get(
        "TP_COOPER_PILOT_BLEND",
        PROJECT / "artifacts/character-pilot/cooper/cooper-hero-pilot.blend",
    )
).resolve()
EVIDENCE = Path(
    os.environ.get(
        "TP_COOPER_PILOT_EVIDENCE",
        PROJECT / "artifacts/character-pilot/cooper",
    )
).resolve()


def tailored_shell(
    components: list[bpy.types.Object],
    *,
    name: str,
    rings: tuple[tuple[float, float, float, float], ...],
    material: bpy.types.Material,
    color: str,
    bone: str,
    segments: int = 24,
) -> bpy.types.Object:
    """Closed elliptical ring shell: controlled chest/waist/hip silhouette."""
    vertices: list[tuple[float, float, float]] = []
    for z, half_x, half_y, y_offset in rings:
        for segment in range(segments):
            angle = math.tau * segment / segments
            vertices.append(
                (
                    math.cos(angle) * half_x,
                    y_offset + math.sin(angle) * half_y,
                    z,
                )
            )
    faces: list[tuple[int, ...]] = [
        tuple(range(segments - 1, -1, -1)),
        tuple(
            (len(rings) - 1) * segments + index
            for index in range(segments)
        ),
    ]
    for ring in range(len(rings) - 1):
        for segment in range(segments):
            following = (segment + 1) % segments
            faces.append(
                (
                    ring * segments + segment,
                    ring * segments + following,
                    (ring + 1) * segments + following,
                    (ring + 1) * segments + segment,
                )
            )
    data = bpy.data.meshes.new(name + "_Data")
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    components.append(
        pack.finish_component(
            obj,
            name=name,
            material=material,
            color=color,
            bone=bone,
            smooth=True,
        )
    )
    return obj


def add_face(
    components: list[bpy.types.Object],
    *,
    skin: bpy.types.Material,
    eye: bpy.types.Material,
    hair: bpy.types.Material,
) -> None:
    skin_base = "#c98b6c"
    skin_shadow = "#a96755"
    face_y = -0.147
    pack.authored_head(
        components,
        name="cooper_pilot_head",
        center=(0.0, 0.002, 1.705),
        radius_x=0.136,
        radius_y=0.140,
        radius_z=0.150,
        jaw_width=0.82,
        jaw_height=1.00,
        material=skin,
        color=skin_base,
        bone="head",
        segments=28,
    )
    for side, sign in (("L", -1), ("R", 1)):
        pack.sphere(
            components,
            name=f"cooper_pilot_ear_{side}",
            location=(sign * 0.135, 0.006, 1.702),
            scale=(0.019, 0.014, 0.034),
            material=skin,
            color=skin_shadow,
            bone="head",
            segments=14,
            rings=8,
        )
        eye_x = sign * 0.047
        pack.oval_disc(
            components,
            name=f"cooper_pilot_sclera_{side}",
            location=(eye_x, face_y + 0.006, 1.725),
            radius_x=0.023,
            radius_z=0.012,
            depth=0.003,
            material=eye,
            color="#f1eee5",
            bone=f"eye.{side}",
            vertices=20,
        )
        pack.oval_disc(
            components,
            name=f"cooper_pilot_iris_{side}",
            location=(eye_x, face_y + 0.003, 1.724),
            radius_x=0.009,
            radius_z=0.008,
            depth=0.002,
            material=eye,
            color="#5e8b89",
            bone=f"eye.{side}",
            vertices=18,
        )
        pack.oval_disc(
            components,
            name=f"cooper_pilot_pupil_{side}",
            location=(eye_x, face_y + 0.001, 1.724),
            radius_x=0.0045,
            radius_z=0.0055,
            depth=0.0015,
            material=eye,
            color="#101820",
            bone=f"eye.{side}",
            vertices=14,
        )
        pack.oval_disc(
            components,
            name=f"cooper_pilot_catchlight_{side}",
            location=(eye_x - 0.003, face_y - 0.001, 1.728),
            radius_x=0.0025,
            radius_z=0.0030,
            depth=0.001,
            material=eye,
            color="#ffffff",
            bone=f"eye.{side}",
            vertices=10,
        )
        pack.eyelid_arc(
            components,
            name=f"cooper_pilot_upper_lid_{side}",
            location=(eye_x, face_y, 1.725),
            outer=(0.026, 0.014),
            inner=(0.022, 0.010),
            upper=True,
            material=hair,
            color="#392b29",
            bone=f"eye.{side}",
            segments=8,
        )
        pack.eyelid_arc(
            components,
            name=f"cooper_pilot_lower_lid_{side}",
            location=(eye_x, face_y + 0.001, 1.724),
            outer=(0.024, 0.012),
            inner=(0.021, 0.009),
            upper=False,
            material=skin,
            color=skin_shadow,
            bone=f"eye.{side}",
            segments=8,
        )
        pack.box(
            components,
            name=f"cooper_pilot_brow_{side}",
            location=(eye_x, face_y - 0.001, 1.758),
            scale=(0.031, 0.004, 0.0045),
            material=hair,
            color="#202932",
            bone=f"brow.{side}",
            rotation=(0.0, sign * 0.025, sign * 0.035),
            bevel=0.004,
        )

    pack.tapered_between(
        components,
        name="cooper_pilot_nose_bridge",
        start=(0.0, face_y + 0.005, 1.719),
        end=(0.0, face_y - 0.002, 1.672),
        radius_start=0.006,
        radius_end=0.010,
        material=skin,
        color=skin_shadow,
        bone="head",
        vertices=12,
    )
    pack.sphere(
        components,
        name="cooper_pilot_nose_tip",
        location=(0.0, face_y - 0.005, 1.666),
        scale=(0.012, 0.011, 0.013),
        material=skin,
        color=skin_shadow,
        bone="head",
        segments=14,
        rings=8,
    )
    pack.flat_prism(
        components,
        name="cooper_pilot_mouth",
        points=(
            (-0.027, 1.625),
            (0.0, 1.628),
            (0.027, 1.625),
            (0.0, 1.619),
        ),
        y=face_y - 0.004,
        depth=0.002,
        material=skin,
        color="#8c4e4d",
        bone="jaw",
    )


def sculpted_hair_cap(
    components: list[bpy.types.Object],
    *,
    material: bpy.types.Material,
    color: str,
) -> None:
    """Connected scalp shell with side-part hairline and open face."""
    segments, rings = 28, 16
    center = Vector((0.0, 0.028, 1.718))
    radii = Vector((0.135, 0.130, 0.150))
    vertices: list[tuple[float, float, float]] = []
    for ring in range(rings + 1):
        phi = math.pi * ring / rings
        radial = math.sin(phi)
        for segment in range(segments):
            theta = math.tau * segment / segments
            vertices.append(
                tuple(
                    center
                    + Vector(
                        (
                            radii.x * radial * math.cos(theta),
                            radii.y * radial * math.sin(theta),
                            radii.z * math.cos(phi),
                        )
                    )
                )
            )
    faces: list[tuple[int, int, int, int]] = []
    for ring in range(rings):
        for segment in range(segments):
            following = (segment + 1) % segments
            face = (
                ring * segments + segment,
                ring * segments + following,
                (ring + 1) * segments + following,
                (ring + 1) * segments + segment,
            )
            midpoint = sum((Vector(vertices[index]) for index in face), Vector()) / 4
            side_part = 1.783 + max(-0.012, min(0.018, midpoint.x * 0.12))
            face_opening = (
                midpoint.y < -0.065
                and midpoint.z < side_part
                and abs(midpoint.x) < 0.134
            )
            lower_neck_opening = midpoint.z < 1.670 and midpoint.y < 0.115
            side_trim = abs(midpoint.x) > 0.086 and midpoint.z < 1.700
            if not face_opening and not lower_neck_opening and not side_trim:
                faces.append(face)
    data = bpy.data.meshes.new("cooper_pilot_hair_cap_Data")
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new("cooper_pilot_hair_cap", data)
    bpy.context.collection.objects.link(obj)
    components.append(
        pack.finish_component(
            obj,
            name="cooper_pilot_hair_cap",
            material=material,
            color=color,
            bone="hair_01",
            smooth=True,
        )
    )


def add_hair(
    components: list[bpy.types.Object],
    hair_material: bpy.types.Material,
) -> None:
    color = "#111b25"
    sculpted_hair_cap(components, material=hair_material, color=color)
    locks = (
        ((-0.126, 1.820), (-0.058, 1.851), (-0.012, 1.785)),
        ((-0.076, 1.849), (-0.008, 1.862), (0.015, 1.789)),
        ((-0.018, 1.858), (0.047, 1.846), (0.032, 1.782)),
        ((0.036, 1.844), (0.095, 1.822), (0.068, 1.775)),
        ((0.082, 1.820), (0.128, 1.793), (0.097, 1.756)),
    )
    for index, points in enumerate(locks):
        pack.flat_prism(
            components,
            name=f"cooper_pilot_front_lock_{index}",
            points=points,
            y=-0.139 - index * 0.001,
            depth=0.012,
            material=hair_material,
            color=("#23384a" if index in (0, 1) else color),
            bone="hair_01",
        )
    for side, sign in (("L", -1), ("R", 1)):
        pack.flat_prism(
            components,
            name=f"cooper_pilot_side_lock_{side}",
            points=(
                (sign * 0.129, 1.793),
                (sign * 0.131, 1.681),
                (sign * 0.105, 1.714),
                (sign * 0.101, 1.811),
            ),
            y=-0.034,
            depth=0.024,
            material=hair_material,
            color=color,
            bone="hair_02",
        )
    for index, (start, end, radius) in enumerate(
        (
            ((-0.098, 0.101, 1.760), (-0.121, 0.114, 1.650), 0.037),
            ((-0.040, 0.138, 1.747), (-0.056, 0.153, 1.622), 0.040),
            ((0.019, 0.146, 1.752), (0.017, 0.161, 1.614), 0.042),
            ((0.078, 0.120, 1.757), (0.100, 0.138, 1.642), 0.037),
        )
    ):
        pack.tapered_between(
            components,
            name=f"cooper_pilot_back_lock_{index}",
            start=start,
            end=end,
            radius_start=radius,
            radius_end=0.012,
            material=hair_material,
            color=("#182837" if index in (1, 2) else color),
            bone="hair_02",
            vertices=14,
        )


def add_suit(
    components: list[bpy.types.Object],
    *,
    cloth: bpy.types.Material,
    skin: bpy.types.Material,
    leather: bpy.types.Material,
    metal: bpy.types.Material,
) -> None:
    navy = "#253b4d"
    navy_light = "#38536a"
    trouser = "#1d2d3b"
    shirt = "#ebe5da"

    for side, x in (("L", -0.120), ("R", 0.120)):
        thigh, shin = f"thigh.{side}", f"shin.{side}"
        pack.jointed_tube(
            components,
            name=f"cooper_pilot_leg_{side}",
            samples=[
                ((x, 0.010, 0.875), 0.095, {thigh: 1.0}),
                ((x, 0.007, 0.710), 0.090, {thigh: 1.0}),
                ((x, 0.003, 0.550), 0.079, {thigh: 0.82, shin: 0.18}),
                ((x, 0.001, 0.485), 0.075, {thigh: 0.48, shin: 0.52}),
                ((x, -0.003, 0.365), 0.067, {shin: 1.0}),
                ((x, -0.006, 0.250), 0.060, {shin: 1.0}),
            ],
            material=cloth,
            color=trouser,
            vertices=18,
        )
        pack.tapered_between(
            components,
            name=f"cooper_pilot_thigh_press_{side}",
            start=(x, -0.076, 0.825),
            end=(x, -0.065, 0.545),
            radius_start=0.0035,
            radius_end=0.0025,
            material=leather,
            color="#304356",
            bone=thigh,
            vertices=8,
        )
        pack.tapered_between(
            components,
            name=f"cooper_pilot_shin_press_{side}",
            start=(x, -0.059, 0.475),
            end=(x, -0.050, 0.285),
            radius_start=0.0028,
            radius_end=0.0020,
            material=leather,
            color="#304356",
            bone=shin,
            vertices=8,
        )
        pack.shoe_wedge(
            components,
            name=f"cooper_pilot_shoe_{side}",
            x=x,
            width=0.064,
            depth=0.155,
            material=leather,
            color="#111820",
            bone=f"foot.{side}",
            toe_bone=f"toe.{side}",
        )
        pack.sole_wedge(
            components,
            name=f"cooper_pilot_sole_{side}",
            x=x,
            width=0.064,
            depth=0.155,
            material=leather,
            color="#070a0d",
            bone=f"foot.{side}",
        )
        for lace_index, (lace_y, lace_z) in enumerate(
            ((-0.020, 0.168), (-0.052, 0.153), (-0.082, 0.139))
        ):
            pack.box(
                components,
                name=f"cooper_pilot_lace_{side}_{lace_index}",
                location=(x, lace_y, lace_z),
                scale=(0.032 - lace_index * 0.002, 0.009, 0.005),
                material=leather,
                color="#59636a",
                bone=f"foot.{side}",
                rotation=(0.0, 0.0, (lace_index - 1) * 0.025),
                bevel=0.003,
            )
        pack.sphere(
            components,
            name=f"cooper_pilot_ankle_{side}",
            location=(x, -0.002, 0.245),
            scale=(0.061, 0.063, 0.050),
            material=leather,
            color="#18222c",
            bone=shin,
            segments=14,
            rings=8,
        )

    tailored_shell(
        components,
        name="cooper_pilot_pelvis",
        rings=(
            (0.780, 0.150, 0.102, 0.010),
            (0.855, 0.165, 0.108, 0.008),
            (0.930, 0.165, 0.110, 0.005),
        ),
        material=cloth,
        color=trouser,
        bone="pelvis",
    )
    pack.box(
        components,
        name="cooper_pilot_waistband",
        location=(0.0, -0.003, 0.925),
        scale=(0.166, 0.118, 0.018),
        material=leather,
        color="#101820",
        bone="pelvis",
        bevel=0.012,
    )
    tailored_shell(
        components,
        name="cooper_pilot_jacket",
        rings=(
            (0.885, 0.174, 0.122, 0.010),
            (1.040, 0.170, 0.126, 0.006),
            (1.250, 0.196, 0.134, 0.000),
            (1.395, 0.207, 0.136, 0.000),
            (1.455, 0.150, 0.114, 0.000),
        ),
        material=cloth,
        color=navy,
        bone="chest",
    )
    pack.flat_prism(
        components,
        name="cooper_pilot_shirt_front",
        points=(
            (-0.045, 1.462),
            (0.045, 1.462),
            (0.046, 1.260),
            (0.000, 1.205),
            (-0.046, 1.260),
        ),
        y=-0.143,
        depth=0.012,
        material=cloth,
        color=shirt,
        bone="chest",
    )
    for side, sign in (("L", -1), ("R", 1)):
        pack.flat_prism(
            components,
            name=f"cooper_pilot_collar_{side}",
            points=(
                (sign * 0.004, 1.466),
                (sign * 0.052, 1.458),
                (sign * 0.040, 1.392),
                (sign * 0.010, 1.420),
            ),
            y=-0.151,
            depth=0.010,
            material=cloth,
            color=shirt,
            bone="chest",
        )
        pack.flat_prism(
            components,
            name=f"cooper_pilot_lapel_{side}",
            points=(
                (sign * 0.015, 1.450),
                (sign * 0.092, 1.390),
                (sign * 0.060, 1.240),
                (sign * 0.016, 1.300),
            ),
            y=-0.151,
            depth=0.015,
            material=cloth,
            color=navy_light,
            bone="chest",
        )
        pack.box(
            components,
            name=f"cooper_pilot_pocket_welt_{side}",
            location=(sign * 0.115, -0.133, 1.070),
            scale=(0.042, 0.006, 0.006),
            material=leather,
            color="#293f52",
            bone="chest",
            rotation=(0.0, sign * 0.025, sign * 0.055),
            bevel=0.004,
        )
    pack.flat_prism(
        components,
        name="cooper_pilot_tie",
        points=(
            (-0.015, 1.405),
            (0.015, 1.405),
            (0.012, 1.255),
            (0.000, 1.220),
            (-0.012, 1.255),
        ),
        y=-0.160,
        depth=0.010,
        material=cloth,
        color="#6f202a",
        bone="tie_01",
    )
    pack.flat_prism(
        components,
        name="cooper_pilot_tie_knot",
        points=(
            (-0.020, 1.431),
            (0.000, 1.457),
            (0.020, 1.431),
            (0.000, 1.402),
        ),
        y=-0.160,
        depth=0.011,
        material=cloth,
        color="#862a34",
        bone="tie_01",
    )
    for index, z in enumerate((1.150, 1.050)):
        pack.sphere(
            components,
            name=f"cooper_pilot_button_{index}",
            location=(0.0, -0.169, z),
            scale=(0.009, 0.005, 0.009),
            material=metal,
            color="#8b8170",
            bone="chest",
            segments=10,
            rings=6,
        )
    pack.sphere(
        components,
        name="cooper_pilot_neck",
        location=(0.0, 0.0, 1.515),
        scale=(0.052, 0.047, 0.072),
        material=skin,
        color="#c98b6c",
        bone="neck",
        segments=20,
        rings=12,
    )
    pack.tapered(
        components,
        name="cooper_pilot_collar_band",
        location=(0.0, -0.002, 1.475),
        radius_top=0.057,
        radius_bottom=0.082,
        depth=0.060,
        material=cloth,
        color=shirt,
        bone="chest",
        vertices=18,
        depth_scale_y=0.84,
    )

    for side, sign in (("L", -1), ("R", 1)):
        clavicle = f"clavicle.{side}"
        upper, fore, hand = (
            f"upper_arm.{side}",
            f"forearm.{side}",
            f"hand.{side}",
        )
        pack.jointed_tube(
            components,
            name=f"cooper_pilot_arm_{side}",
            samples=[
                ((sign * 0.192, 0.000, 1.382), 0.060, {clavicle: 1.0}),
                ((sign * 0.226, 0.002, 1.325), 0.060, {upper: 1.0}),
                ((sign * 0.285, -0.006, 1.165), 0.054, {upper: 0.78, fore: 0.22}),
                ((sign * 0.296, -0.016, 1.095), 0.051, {upper: 0.45, fore: 0.55}),
                ((sign * 0.310, -0.028, 0.930), 0.043, {fore: 1.0}),
                ((sign * 0.314, -0.032, 0.855), 0.039, {fore: 1.0}),
            ],
            material=cloth,
            color=navy,
            vertices=18,
        )
        pack.tapered_between(
            components,
            name=f"cooper_pilot_upper_sleeve_seam_{side}",
            start=(sign * 0.245, 0.045, 1.320),
            end=(sign * 0.289, 0.036, 1.165),
            radius_start=0.006,
            radius_end=0.004,
            material=leather,
            color="#294258",
            bone=upper,
            vertices=8,
        )
        pack.tapered_between(
            components,
            name=f"cooper_pilot_lower_sleeve_seam_{side}",
            start=(sign * 0.299, 0.026, 1.090),
            end=(sign * 0.314, 0.006, 0.875),
            radius_start=0.004,
            radius_end=0.003,
            material=leather,
            color="#294258",
            bone=fore,
            vertices=8,
        )
        pack.sphere(
            components,
            name=f"cooper_pilot_cuff_{side}",
            location=(sign * 0.314, -0.032, 0.862),
            scale=(0.044, 0.041, 0.027),
            material=cloth,
            color=shirt,
            bone=hand,
            segments=14,
            rings=8,
        )
        hand_location = (sign * 0.316, -0.038, 0.795)
        pack.elliptic_palm(
            components,
            name=f"cooper_pilot_hand_{side}",
            location=hand_location,
            scale=0.62,
            material=skin,
            color="#d6a07c",
            bone=hand,
            vertices=14,
        )
        pack.tapered_between(
            components,
            name=f"cooper_pilot_thumb_{side}",
            start=hand_location,
            end=(sign * 0.286, -0.074, 0.782),
            radius_start=0.014,
            radius_end=0.009,
            material=skin,
            color="#bd7d60",
            bone=f"finger.{side}",
            vertices=10,
        )


def add_field_gear(
    components: list[bpy.types.Object],
    *,
    cloth: bpy.types.Material,
    leather: bpy.types.Material,
    metal: bpy.types.Material,
    prop: bpy.types.Material,
) -> None:
    """Layered investigator kit: coat tails, satchel, recorder and badge."""
    navy = "#253b4d"
    navy_shadow = "#172838"
    leather_brown = "#5b3425"

    # Four independent coat panels create motion-ready silhouette and avoid
    # cylindrical trouser/torso seam. Front/back layers overlap intentionally.
    for side, sign in (("L", -1), ("R", 1)):
        bone = f"coat.{side}"
        pack.flat_prism(
            components,
            name=f"cooper_pilot_coat_front_{side}",
            points=(
                (sign * 0.018, 1.030),
                (sign * 0.174, 1.015),
                (sign * 0.190, 0.795),
                (sign * 0.050, 0.760),
            ),
            y=-0.125,
            depth=0.020,
            material=cloth,
            color=navy,
            bone=bone,
        )
        pack.flat_prism(
            components,
            name=f"cooper_pilot_coat_back_{side}",
            points=(
                (sign * 0.010, 1.020),
                (sign * 0.166, 1.000),
                (sign * 0.176, 0.705),
                (sign * 0.028, 0.670),
            ),
            y=0.116,
            depth=0.026,
            material=cloth,
            color=navy_shadow,
            bone=bone,
        )
        pack.box(
            components,
            name=f"cooper_pilot_coat_hem_{side}",
            location=(sign * 0.112, -0.128, 0.780),
            scale=(0.068, 0.010, 0.009),
            material=leather,
            color="#23384a",
            bone=bone,
            rotation=(0.0, sign * 0.020, sign * 0.060),
            bevel=0.005,
        )

    pack.box(
        components,
        name="cooper_pilot_field_belt",
        location=(0.0, -0.005, 0.947),
        scale=(0.178, 0.128, 0.017),
        material=leather,
        color="#151b20",
        bone="pelvis",
        bevel=0.010,
    )
    pack.box(
        components,
        name="cooper_pilot_field_belt_front",
        location=(0.0, -0.143, 0.947),
        scale=(0.164, 0.008, 0.015),
        material=leather,
        color="#4a2c22",
        bone="pelvis",
        bevel=0.006,
    )
    pack.box(
        components,
        name="cooper_pilot_belt_buckle",
        location=(0.0, -0.142, 0.947),
        scale=(0.025, 0.008, 0.018),
        material=metal,
        color="#9c8050",
        bone="pelvis",
        bevel=0.005,
    )

    # Asymmetric field kit replaces ornamental noise with readable function.
    pack.flat_prism(
        components,
        name="cooper_pilot_satchel_strap",
        points=(
            (-0.158, 1.430),
            (-0.130, 1.445),
            (0.174, 0.930),
            (0.145, 0.915),
        ),
        y=-0.170,
        depth=0.014,
        material=leather,
        color=leather_brown,
        bone="chest",
    )
    pack.box(
        components,
        name="cooper_pilot_satchel",
        location=(0.238, 0.015, 0.770),
        scale=(0.105, 0.060, 0.125),
        material=leather,
        color="#704531",
        bone="coat.R",
        rotation=(0.0, -0.040, -0.055),
        bevel=0.025,
    )
    pack.box(
        components,
        name="cooper_pilot_satchel_flap",
        location=(0.238, -0.052, 0.815),
        scale=(0.100, 0.012, 0.060),
        material=leather,
        color="#4f2d21",
        bone="coat.R",
        rotation=(0.0, -0.040, -0.055),
        bevel=0.018,
    )
    pack.box(
        components,
        name="cooper_pilot_satchel_clasp",
        location=(0.238, -0.068, 0.785),
        scale=(0.014, 0.006, 0.018),
        material=metal,
        color="#a18757",
        bone="coat.R",
        bevel=0.004,
    )

    pack.box(
        components,
        name="cooper_pilot_recorder",
        location=(-0.205, -0.118, 0.845),
        scale=(0.054, 0.030, 0.078),
        material=prop,
        color="#2c3336",
        bone="coat.L",
        rotation=(0.0, 0.0, 0.055),
        bevel=0.012,
    )
    for index, x in enumerate((-0.224, -0.187)):
        pack.oval_disc(
            components,
            name=f"cooper_pilot_recorder_reel_{index}",
            location=(x, -0.151, 0.862),
            radius_x=0.014,
            radius_z=0.014,
            depth=0.004,
            material=metal,
            color="#a5adb0",
            bone="coat.L",
            vertices=14,
        )
    pack.box(
        components,
        name="cooper_pilot_recorder_switch",
        location=(-0.205, -0.153, 0.807),
        scale=(0.019, 0.004, 0.006),
        material=metal,
        color="#b44a3d",
        bone="coat.L",
        bevel=0.003,
    )
    pack.oval_disc(
        components,
        name="cooper_pilot_fbi_badge",
        location=(-0.118, -0.161, 1.245),
        radius_x=0.020,
        radius_z=0.026,
        depth=0.004,
        material=metal,
        color="#c6a75b",
        bone="chest",
        vertices=18,
    )


def build_model(
    rig: bpy.types.Object,
    materials: tuple[bpy.types.Material, ...],
) -> bpy.types.Object:
    cloth, skin, leather, eye, metal, prop = materials
    components: list[bpy.types.Object] = []
    add_suit(
        components,
        cloth=cloth,
        skin=skin,
        leather=leather,
        metal=metal,
    )
    add_field_gear(
        components,
        cloth=cloth,
        leather=leather,
        metal=metal,
        prop=prop,
    )
    add_face(components, skin=skin, eye=eye, hair=cloth)
    add_hair(components, cloth)
    mesh = pack.join_character("cooper", components, rig, materials)
    mesh["tp_asset"] = "Cooper hero approval pilot"
    mesh["tp_version"] = VERSION
    mesh["tp_approval_only"] = True
    mesh["tp_integrated"] = False
    mesh["tp_feature_count"] = len(components)
    return mesh


def create_scene() -> tuple[bpy.types.Object, bpy.types.Object]:
    pack.clear_scene()
    pack.reset_palette()
    root = bpy.data.objects.new("TP_COOPER_HERO_PILOT", None)
    bpy.context.collection.objects.link(root)
    root["tp_asset"] = "Cooper hero approval pilot"
    root["tp_version"] = VERSION
    root["tp_integrated"] = False
    root["tp_reference"] = "adult stylized action-adventure silhouette"

    materials = (
        pack.shared_material("TP_CHAR_SHARED_Cloth", roughness=0.82),
        pack.shared_material("TP_CHAR_SHARED_Skin", roughness=0.50),
        pack.shared_material("TP_CHAR_SHARED_Leather", roughness=0.34),
        pack.shared_material("TP_CHAR_SHARED_Eye", roughness=0.18),
        pack.shared_material("TP_CHAR_SHARED_Metal", roughness=0.22, metallic=0.62),
        pack.shared_material("TP_CHAR_SHARED_Prop", roughness=0.30),
    )
    rig = pack.create_rig(root)
    mesh = build_model(rig, materials)
    if pack.PALETTE_IMAGE is not None:
        pack.PALETTE_IMAGE.update()
        pack.PALETTE_IMAGE.pack()
    pack.create_clips(rig)

    scene = bpy.context.scene
    scene["tp_asset"] = root["tp_asset"]
    scene["tp_version"] = VERSION
    scene["tp_character_count"] = 1
    scene["tp_clip_count"] = len(pack.CLIPS)
    scene["tp_root_motion"] = "zero"
    scene["tp_integrated"] = False
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"
    scene.render.fps = pack.FPS
    return rig, mesh


def export_model(rig: bpy.types.Object) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pack.OUTPUT_PATH = OUTPUT
    pack.export_pack(rig)


def apply_preview_toon_materials() -> None:
    """Quantize diffuse response for reference-faithful Eevee evidence renders."""
    for material in bpy.data.materials:
        if not material.name.startswith("TP_CHAR_SHARED_") or not material.use_nodes:
            continue
        tree = material.node_tree
        palette_image = pack.PALETTE_IMAGE
        tree.nodes.clear()
        output = tree.nodes.new("ShaderNodeOutputMaterial")
        emission = tree.nodes.new("ShaderNodeEmission")
        multiply = tree.nodes.new("ShaderNodeMixRGB")
        multiply.blend_type = "MULTIPLY"
        multiply.inputs["Fac"].default_value = 1.0
        ramp = tree.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.interpolation = "CONSTANT"
        ramp.color_ramp.elements[0].position = 0.30
        if material.name.endswith("_Skin"):
            shadow = (0.72, 0.63, 0.58, 1.0)
            middle_color = (0.88, 0.80, 0.74, 1.0)
            light = (1.00, 0.97, 0.92, 1.0)
        elif material.name.endswith("_Eye"):
            shadow = (0.52, 0.56, 0.58, 1.0)
            middle_color = (0.80, 0.84, 0.84, 1.0)
            light = (1.00, 1.00, 1.00, 1.0)
        else:
            shadow = (0.40, 0.44, 0.48, 1.0)
            middle_color = (0.72, 0.75, 0.77, 1.0)
            light = (1.00, 0.98, 0.94, 1.0)
        ramp.color_ramp.elements[0].color = shadow
        ramp.color_ramp.elements[1].position = 0.72
        ramp.color_ramp.elements[1].color = light
        middle = ramp.color_ramp.elements.new(0.50)
        middle.color = middle_color
        grayscale = tree.nodes.new("ShaderNodeRGBToBW")
        shader_to_rgb = tree.nodes.new("ShaderNodeShaderToRGB")
        diffuse = tree.nodes.new("ShaderNodeBsdfDiffuse")
        diffuse.inputs["Roughness"].default_value = 0.75
        palette = tree.nodes.new("ShaderNodeTexImage")
        palette.image = palette_image
        palette.interpolation = "Closest"
        palette.extension = "EXTEND"
        tree.links.new(palette.outputs["Color"], diffuse.inputs["Color"])
        tree.links.new(diffuse.outputs["BSDF"], shader_to_rgb.inputs["Shader"])
        tree.links.new(shader_to_rgb.outputs["Color"], grayscale.inputs["Color"])
        tree.links.new(grayscale.outputs["Val"], ramp.inputs["Fac"])
        tree.links.new(palette.outputs["Color"], multiply.inputs[1])
        tree.links.new(ramp.outputs["Color"], multiply.inputs[2])
        tree.links.new(multiply.outputs["Color"], emission.inputs["Color"])
        tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])


def configure_render(rig: bpy.types.Object) -> bpy.types.Object:
    scene = bpy.context.scene
    apply_preview_toon_materials()
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.40
    scene.world.use_nodes = True
    background = next(
        node for node in scene.world.node_tree.nodes
        if node.type == "BACKGROUND"
    )
    background.inputs["Color"].default_value = (0.055, 0.120, 0.190, 1.0)
    background.inputs["Strength"].default_value = 0.32

    bpy.ops.mesh.primitive_plane_add(size=16, location=(0, 0, -0.008))
    floor = bpy.context.object
    floor.name = "TP_COOPER_PILOT_Floor"
    floor_mat = bpy.data.materials.new("TP_COOPER_PILOT_FloorMat")
    floor_mat.diffuse_color = (0.075, 0.145, 0.070, 1)
    floor_mat.roughness = 0.90
    floor_mat.use_nodes = True
    floor_shader = next(
        node for node in floor_mat.node_tree.nodes
        if node.type == "BSDF_PRINCIPLED"
    )
    floor_shader.inputs["Base Color"].default_value = (0.075, 0.145, 0.070, 1)
    floor_shader.inputs["Roughness"].default_value = 0.90
    floor.data.materials.append(floor_mat)

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=64,
        radius=0.72,
        depth=0.035,
        location=(0, 0, 0.010),
    )
    plinth = bpy.context.object
    plinth.name = "TP_COOPER_PILOT_Plinth"
    plinth_mat = bpy.data.materials.new("TP_COOPER_PILOT_PlinthMat")
    plinth_mat.diffuse_color = (0.20, 0.25, 0.16, 1)
    plinth_mat.roughness = 0.76
    plinth_mat.use_nodes = True
    plinth_shader = next(
        node for node in plinth_mat.node_tree.nodes
        if node.type == "BSDF_PRINCIPLED"
    )
    plinth_shader.inputs["Base Color"].default_value = (0.20, 0.25, 0.16, 1)
    plinth_shader.inputs["Roughness"].default_value = 0.76
    plinth.data.materials.append(plinth_mat)

    bpy.ops.object.camera_add(location=(0, -3.70, 1.95))
    camera = bpy.context.object
    camera.name = "TP_COOPER_PILOT_Camera"
    camera.data.lens = 68
    camera.data.sensor_width = 36
    camera.data.dof.use_dof = True
    camera.data.dof.focus_distance = 3.72
    camera.data.dof.aperture_fstop = 5.6
    scene.camera = camera

    for name, location, energy, size, color in (
        ("Key", (-2.6, -3.4, 4.6), 560, 2.8, (1.0, 0.86, 0.70)),
        ("Fill", (2.8, -2.0, 2.8), 210, 3.2, (0.62, 0.80, 1.0)),
        ("Rim", (1.5, 2.5, 3.8), 540, 2.0, (0.68, 0.86, 1.0)),
        ("Top", (-0.5, 0.5, 5.5), 320, 2.5, (1.0, 0.96, 0.82)),
    ):
        data = bpy.data.lights.new("TP_COOPER_PILOT_" + name, "AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        data.color = color
        light = bpy.data.objects.new("TP_COOPER_PILOT_" + name, data)
        bpy.context.collection.objects.link(light)
        light.location = location
        pack.point_camera(light, (0, 0, 1.0))

    rig.animation_data_create()
    rig.animation_data.action = bpy.data.actions["TP_idle"]
    scene.frame_set(18)
    return camera


def render_views(
    rig: bpy.types.Object,
    camera: bpy.types.Object,
) -> list[str]:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    views = (
        ("front", 0.0, "TP_idle", 18, (0.0, 0.0, 1.00)),
        ("three-quarter", -26.0, "TP_idle", 18, (0.0, 0.0, 1.00)),
        ("profile", -90.0, "TP_idle", 18, (0.0, 0.0, 1.00)),
        ("walk-pose", -26.0, "TP_grid_walk", 6, (0.0, 0.0, 1.00)),
    )
    rendered: list[str] = []
    for label, angle_deg, action, frame, target in views:
        rig.animation_data.action = bpy.data.actions[action]
        scene.frame_set(frame)
        if action == "TP_idle":
            rig.pose.bones["pelvis"].location.x -= 0.018
            rig.pose.bones["pelvis"].rotation_euler.y += 0.028
            rig.pose.bones["spine_01"].rotation_euler.y -= 0.022
            rig.pose.bones["chest"].rotation_euler.y -= 0.035
            rig.pose.bones["head"].rotation_euler.y += 0.025
            rig.pose.bones["upper_arm.L"].rotation_euler.x -= 0.090
            rig.pose.bones["upper_arm.L"].rotation_euler.z -= 0.055
            rig.pose.bones["upper_arm.R"].rotation_euler.x -= 0.035
            rig.pose.bones["upper_arm.R"].rotation_euler.z += 0.025
            rig.pose.bones["forearm.L"].rotation_euler.x -= 0.145
            rig.pose.bones["forearm.R"].rotation_euler.x -= 0.070
            rig.pose.bones["thigh.L"].rotation_euler.x += 0.040
            rig.pose.bones["thigh.R"].rotation_euler.x -= 0.020
            bpy.context.view_layer.update()
        angle = math.radians(angle_deg)
        camera.location = (
            math.sin(angle) * 3.70,
            -math.cos(angle) * 3.70,
            1.92,
        )
        pack.point_camera(camera, target)
        path = EVIDENCE / f"{label}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        rendered.append(str(path))
    return rendered


def write_manifest(mesh: bpy.types.Object, rendered: list[str]) -> None:
    lower, upper = pack.world_bounds(mesh)
    payload = {
        "schema": "twin-peaks.character-approval-pilot.v1",
        "version": VERSION,
        "asset": str(OUTPUT),
        "blend": str(BLEND_OUTPUT),
        "integrated": False,
        "approval_only": True,
        "character": "cooper",
        "bones": len(pack.BONES),
        "clips": list(pack.CLIPS),
        "materials": [
            slot.material.name
            for slot in mesh.material_slots
            if slot.material
        ],
        "triangles": sum(len(p.vertices) - 2 for p in mesh.data.polygons),
        "vertices": len(mesh.data.vertices),
        "bounds": {
            "min": [round(value, 5) for value in lower],
            "max": [round(value, 5) for value in upper],
        },
        "gauntlet": {
            "loops": 4,
            "criteria": [
                "adult 1:7 silhouette",
                "functional asymmetric layering",
                "readable front, three-quarter and profile",
                "cel-shaded material hierarchy",
                "rigged movement pose without detached parts",
            ],
            "runtime_promoted": False,
            "human_approval_required": True,
        },
        "bytes": OUTPUT.stat().st_size,
        "sha256": hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
        "renders": rendered,
    }
    (EVIDENCE / "manifest.json").write_text(
        json.dumps(payload, indent=2) + "\n",
        encoding="utf-8",
    )
    print("TP_COOPER_PILOT=" + json.dumps(payload, sort_keys=True))


def main() -> None:
    rig, mesh = create_scene()
    export_model(rig)
    BLEND_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    if rig.animation_data:
        rig.animation_data.action = None
    pack.reset_pose(rig)
    bpy.context.scene.frame_set(0)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUTPUT))
    camera = configure_render(rig)
    rendered = render_views(rig, camera)
    write_manifest(mesh, rendered)


if __name__ == "__main__":
    main()
