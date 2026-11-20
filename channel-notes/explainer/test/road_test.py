"""Test shot: lonely prairie road + big tree + 2D character close-up (style test vs. the reference channel).
Env: ASSETS=<poly haven assets dir>  CHARS=<character png dir>  OUT=<png prefix>  SAMPLES=32  SHOT=1|2"""
import bpy, os, math, random
R = math.radians
A = os.environ["ASSETS"]; C = os.environ["CHARS"]; OUT = os.environ["OUT"]; SHOT = os.environ.get("SHOT", "1")
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = int(os.environ.get("SAMPLES", "32")); sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 720, 1280
sc.view_settings.view_transform = "AgX"
try:
    sc.view_settings.look = "AgX - Punchy"
except TypeError:
    pass
random.seed(3)

# sky
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True; nt = w.node_tree
env = nt.nodes.new("ShaderNodeTexEnvironment"); env.image = bpy.data.images.load(os.path.join(A, "kloofendal_48d_partly_cloudy_puresky_2k.hdr"))
nt.links.new(env.outputs["Color"], nt.nodes["Background"].inputs["Color"]); nt.nodes["Background"].inputs["Strength"].default_value = 1.0
sun = bpy.data.lights.new("sun", "SUN"); sun.energy = 3.5; sun.angle = R(2); sun.color = (1, 0.95, 0.85)
so = bpy.data.objects.new("sun", sun); sc.collection.objects.link(so); so.rotation_euler = (R(50), R(10), R(-40))

def tex_mat(name, folder, scale, tint=None, rough=0.9):
    m = bpy.data.materials.new(name); m.use_nodes = True; n = m.node_tree.nodes; l = m.node_tree.links
    b = n["Principled BSDF"]; tc = n.new("ShaderNodeTexCoord"); mp = n.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (scale, scale, scale)
    l.new(tc.outputs["UV"], mp.inputs["Vector"])
    def img(kind, non_color=False):
        p = os.path.join(A, folder, f"{folder}_{kind}.jpg")
        if not os.path.exists(p): return None
        t = n.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(p)
        if non_color: t.image.colorspace_settings.name = "Non-Color"
        l.new(mp.outputs["Vector"], t.inputs["Vector"]); return t
    dif = img("Diffuse")
    if dif:
        if tint:
            mx = n.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1
            mx.inputs[7].default_value = (*tint, 1); l.new(dif.outputs["Color"], mx.inputs[6]); l.new(mx.outputs[2], b.inputs["Base Color"])
        else:
            l.new(dif.outputs["Color"], b.inputs["Base Color"])
    nor = img("nor_gl", True)
    if nor:
        nm = n.new("ShaderNodeNormalMap"); l.new(nor.outputs["Color"], nm.inputs["Color"]); l.new(nm.outputs["Normal"], b.inputs["Normal"])
    rg = img("Rough", True)
    if rg: l.new(rg.outputs["Color"], b.inputs["Roughness"])
    else: b.inputs["Roughness"].default_value = rough
    return m

def plane(name, sx, sy, loc, mat, uv_scale=1):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc); o = bpy.context.active_object; o.name = name
    o.scale = (sx, sy, 1); bpy.ops.object.transform_apply(scale=True)
    for lp in o.data.uv_layers[0].data:
        lp.uv = (lp.uv[0] * sx / uv_scale, lp.uv[1] * sy / uv_scale)
    o.data.materials.append(mat); return o

M_GRASS = tex_mat("grass", "aerial_grass_rock", 1.0, tint=(0.35, 0.75, 0.18))
M_ROAD = tex_mat("road", "asphalt_02", 1.0, tint=(0.55, 0.55, 0.58))
plane("ground", 400, 1200, (0, 500, -0.02), M_GRASS, 6)
plane("road", 7.0, 1200, (0, 500, 0.0), M_ROAD, 4)
M_SHOULDER = tex_mat("shoulder", "aerial_grass_rock", 1.0, tint=(0.45, 0.42, 0.38))
plane("shoulderL", 1.2, 1200, (-4.1, 500, -0.01), M_SHOULDER, 3); plane("shoulderR", 1.2, 1200, (4.1, 500, -0.01), M_SHOULDER, 3)
paint = bpy.data.materials.new("paint"); paint.use_nodes = True; paint.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.9, 0.9, 0.85, 1)
yellow = bpy.data.materials.new("yellow"); yellow.use_nodes = True; yellow.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.95, 0.65, 0.05, 1)
for x in (-3.2, 3.2):
    plane("edge", 0.15, 1200, (x, 500, 0.01), paint)
for y in range(-20, 900, 9):
    plane("dash", 0.15, 4.0, (0, y, 0.01), yellow)

# the lone tree (Poly Haven island_tree_01)
bpy.ops.import_scene.gltf(filepath=os.path.join(A, "island_tree_01", "island_tree_01.gltf"))
tree = [o for o in bpy.context.selected_objects if o.parent is None]
for o in tree:
    o.location = (8.5, 70, 0); o.scale = (1.6, 1.6, 1.6); o.rotation_euler = (0, 0, R(40))
# grass clumps + rocks scattered near the camera and along the road
bpy.ops.import_scene.gltf(filepath=os.path.join(A, "grass_medium_01", "grass_medium_01.gltf"))
gsrc = [o for o in bpy.context.selected_objects if o.type == "MESH"]
for o in gsrc: o.location = (0, -1000, 0)
for g in gsrc:                                         # make the grass lush green
    for ms in g.data.materials:
        b = ms.node_tree.nodes.get("Principled BSDF")
        if b and b.inputs["Base Color"].is_linked:
            src = b.inputs["Base Color"].links[0].from_socket
            mx = ms.node_tree.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1
            mx.inputs[7].default_value = (0.55, 1.25, 0.35, 1)
            ms.node_tree.links.new(src, mx.inputs[6]); ms.node_tree.links.new(mx.outputs[2], b.inputs["Base Color"])
def scatter(n, xr, yr, sr):
    for i in range(n):
        side = random.choice((-1, 1)); x = side * random.uniform(*xr); y = random.uniform(*yr)
        for g in gsrc:
            c = g.copy(); sc.collection.objects.link(c)
            s_ = random.uniform(*sr); c.location = (x, y, 0); c.scale = (s_, s_, s_ * random.uniform(0.9, 1.4)); c.rotation_euler = (0, 0, random.uniform(0, 6.28))
scatter(2600, (4.6, 16), (-4, 45), (1.0, 1.9))
scatter(900, (4.6, 40), (45, 220), (1.2, 2.2))
bpy.ops.import_scene.gltf(filepath=os.path.join(A, "boulder_01", "boulder_01.gltf"))
rsrc = [o for o in bpy.context.selected_objects if o.type == "MESH"]
for o in rsrc: o.location = (-6.5, 20, 0); o.scale = (0.6, 0.6, 0.6)
# fence posts
wood = bpy.data.materials.new("wood"); wood.use_nodes = True; wood.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.25, 0.17, 0.1, 1)
for y in range(0, 400, 6):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=1.3, location=(-9, y, 0.65)); bpy.context.active_object.data.materials.append(wood)

# 2D character card (flat-shaded, alpha)
def card(png, loc, height, face_cam=True):
    im = bpy.data.images.load(os.path.join(C, png)); asp = im.size[0] / im.size[1]
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc); o = bpy.context.active_object
    o.scale = (height * asp, height, 1); o.rotation_euler = (R(90), 0, 0)
    m = bpy.data.materials.new(png); m.use_nodes = True; n = m.node_tree.nodes; l = m.node_tree.links
    for x in list(n): n.remove(x)
    t = n.new("ShaderNodeTexImage"); t.image = im
    em = n.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 1.0
    tr = n.new("ShaderNodeBsdfTransparent"); mx = n.new("ShaderNodeMixShader"); out = n.new("ShaderNodeOutputMaterial")
    l.new(t.outputs["Color"], em.inputs["Color"]); l.new(t.outputs["Alpha"], mx.inputs["Fac"])
    l.new(tr.outputs[0], mx.inputs[1]); l.new(em.outputs[0], mx.inputs[2]); l.new(mx.outputs[0], out.inputs["Surface"])
    o.data.materials.append(m)
    try:
        o.visible_shadow = True
    except Exception:
        pass
    return o

cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
def look(loc, target, lens):
    import mathutils
    cam.location = loc; d = mathutils.Vector(target) - mathutils.Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler(); cam.data.lens = lens
if SHOT == "1":   # low medium shot: character on the verge, fence left, road right (like the reference opening)
    ch = card("benny_smug.png", (-5.2, 4.2, 1.02), 2.05)
    look((-4.3, -0.6, 0.75), (-5.0, 4.2, 1.15), 26)
    cam.data.dof.use_dof = True; cam.data.dof.focus_distance = 4.9; cam.data.dof.aperture_fstop = 4.0
    for o in tree: o.location = (-8.0, 34, 0)
else:             # low wide shot: big lone tree beside the empty road, sheriff under it
    for o in tree: o.location = (6.2, 16, 0)
    ch = card("sheriff_angry.png", (4.6, 13.0, 1.02), 2.05)
    look((1.4, -3.0, 1.0), (3.6, 14.0, 3.2), 20)
bpy.context.view_layer.update()
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("TEST_OK")
