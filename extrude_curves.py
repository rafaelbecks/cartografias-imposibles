import bpy
import math
from mathutils import Vector

# -------- SETTINGS --------

MODE = "terrain"      # "terrain" | "proximity"
PROFILE = "dune"  # "mountain" | "volcano" | "dune"

MAX_HEIGHT = 0.05
COMPENSATE_CENTER = True

# use index range instead of selection
USE_RANGE = False
TOP_CURVE = 140
BOTTOM_CURVE = 72

INFLUENCE_RADIUS = 50

# --------------------------


def get_curve_index(name):
    import re
    m = re.search(r'\d+', name)
    return int(m.group()) if m else None


def height_profile(t):
    if PROFILE == "mountain":
        return MAX_HEIGHT * (1 - pow(t, 1.7))
    if PROFILE == "volcano":
        return MAX_HEIGHT * (1 - pow(t, 2))
    if PROFILE == "dune":
        return MAX_HEIGHT * math.cos(t * math.pi / 2)
    return MAX_HEIGHT * (1 - t)


def proximity_height(point, points):
    min_dist = min((point - p).length for p in points if (point - p).length > 0)
    norm = max(0, 1 - min_dist / INFLUENCE_RADIUS)
    return norm * MAX_HEIGHT


# -------- GET CURVES --------

if USE_RANGE:
    curves = [
        o for o in bpy.data.objects
        if o.type == "CURVE"
        and (idx := get_curve_index(o.name)) is not None
        and BOTTOM_CURVE <= idx <= TOP_CURVE
    ]
else:
    curves = [o for o in bpy.context.selected_objects if o.type == "CURVE"]

if not curves:
    raise Exception("No curves found")

# sort top → bottom by index
curves.sort(key=lambda o: get_curve_index(o.name), reverse=True)

count = len(curves)

# -------- APPLY EXTRUSION --------

for i, obj in enumerate(curves):

    t = i / (count - 1) if count > 1 else 0
    height = height_profile(t)

    if MODE == "terrain":

        obj.data.extrude = height

        if COMPENSATE_CENTER:
            obj.location.z = height * 0.5

    else:
        # proximity mode (uses curve points)
        spline = obj.data.splines[0]
        pts = [obj.matrix_world @ p.co.xyz for p in spline.bezier_points] \
              if spline.bezier_points else \
              [obj.matrix_world @ p.co.xyz for p in spline.points]

        heights = []

        for p in pts:
            h = proximity_height(p, pts)
            heights.append(h)

        height = sum(heights) / len(heights)

        obj.data.extrude = height

        if COMPENSATE_CENTER:
            obj.location.z = height * 0.5

    print(obj.name, round(height, 4))

print("✓ done")
