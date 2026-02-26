#exec(open("/Users/rafaelbecerra/Projects/cartgrafias-imaginarias/extrude_curves.py").read())

import bpy
import math
from mathutils import Vector

# -------- SETTINGS --------
#
MAX_HEIGHT = 0.055
COMPENSATE_CENTER = True

# use index range instead of selection
USE_RANGE = True
TOP_CURVE = 329
BOTTOM_CURVE = 166

# --------------------------

def get_curve_index(name):
    import re
    m = re.search(r'\d+', name)
    return int(m.group()) if m else None


def height_profile(t):
    return MAX_HEIGHT * math.cos(t * math.pi / 1.5)

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

    obj.data.extrude = height

    if COMPENSATE_CENTER:
        obj.location.z = height * 0.5

    print(obj.name, round(height, 4))

print("✓ done")
