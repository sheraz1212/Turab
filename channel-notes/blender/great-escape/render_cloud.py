# Cloud/headless render of all frames (resumable: existing frames are skipped).
# Usage: GE_OUT=<dir> python render_cloud.py   (needs `pip install bpy`)
import bpy, os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_great_escape.py")).read())
sc = bpy.context.scene
sc.render.use_overwrite = False
sc.render.use_placeholder = True
bpy.ops.render.render(animation=True)
print("RENDER_DONE")
