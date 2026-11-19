# Iwo Jima hook test — builds the whole scene + animation in Blender.
# Run: blender -b -P build_hook.py -- [render]
import bpy, bmesh, math, random, os, sys

random.seed(7)
W = r"C:\Users\Turab\Downloads\video\test_iwojima"
FPS, END = 24, 485
R = math.radians

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, END
sc.render.resolution_x, sc.render.resolution_y = 720, 1280
for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        sc.render.engine = eng
        break
    except TypeError:
        pass
try:
    sc.eevee.taa_render_samples = 24
except Exception:
    pass
sc.render.image_settings.file_format = "PNG"
sc.render.filepath = os.path.join(W, "frames", "f_")
try:
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    pass

# ---------------------------------------------------------------- helpers
def link(o, coll=None):
    (coll or sc.collection).objects.link(o)
    return o

def box(name, x0, x1, y0, y1, z0, z1, loc=(0, 0, 0), mat=None, coll=None):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    v = [bm.verts.new((x, y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
        bm.faces.new([v[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me)
    o.location = loc
    if mat:
        me.materials.append(mat)
    return link(o, coll)

def key(o, f, **kw):
    for k, v in kw.items():
        setattr(o, k, v)
        o.keyframe_insert(k, frame=f)

def mat(name, col, rough=0.9, emit=None, strength=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m

def soil_mat(name, bright=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; N, L = nt.nodes, nt.links
    b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 1.0
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    mr = N.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = -10; mr.inputs["From Max"].default_value = 0
    L.new(sep.outputs["Z"], mr.inputs["Value"])
    rp = N.new("ShaderNodeValToRGB"); cr = rp.color_ramp
    stops = [(0.0, (0.20, 0.085, 0.045)), (0.88, (0.26, 0.11, 0.055)),
             (0.925, (0.13, 0.075, 0.05)), (0.955, (0.06, 0.05, 0.045)), (0.975, (0.03, 0.03, 0.032))]
    cr.elements[0].position, cr.elements[0].color = stops[0][0], (*[c * bright for c in stops[0][1]], 1)
    cr.elements[1].position, cr.elements[1].color = stops[-1][0], (*[c * bright for c in stops[-1][1]], 1)
    for p, c in stops[1:-1]:
        e = cr.elements.new(p); e.color = (*[x * bright for x in c], 1)
    L.new(mr.outputs["Result"], rp.inputs["Fac"])
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 14; nz.inputs["Detail"].default_value = 10
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    nr = N.new("ShaderNodeValToRGB")
    nr.color_ramp.elements[0].position = 0.35; nr.color_ramp.elements[0].color = (0.72, 0.72, 0.72, 1)
    nr.color_ramp.elements[1].position = 0.65; nr.color_ramp.elements[1].color = (1.15, 1.15, 1.15, 1)
    L.new(nz.outputs["Fac"], nr.inputs["Fac"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"
    mx.inputs["Factor"].default_value = 1.0
    L.new(rp.outputs["Color"], mx.inputs[6]); L.new(nr.outputs["Color"], mx.inputs[7])
    L.new(mx.outputs[2], b.inputs["Base Color"])
    nz2 = N.new("ShaderNodeTexNoise"); nz2.inputs["Scale"].default_value = 70; nz2.inputs["Detail"].default_value = 6
    L.new(tc.outputs["Object"], nz2.inputs["Vector"])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.35
    L.new(nz2.outputs["Fac"], bp.inputs["Height"]); L.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m

def ico(name, loc, r, m, sub=2, squash=1.0):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object; o.name = name
    o.scale = (1, 1, squash); o.data.materials.append(m)
    return o

def cyl(name, loc, r, depth, m, rot=(0, 0, 0), verts=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.data.materials.append(m)
    return o

def outline_rect(name, w, h, loc, rot, m):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name
    o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True)
    me = o.data
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.delete(bm, geom=bm.faces[:], context="FACES_ONLY"); bm.to_mesh(me); bm.free()
    sk = o.modifiers.new("skin", "WIREFRAME")
    # wireframe needs faces; use a solidify-able edge ring instead
    o.modifiers.remove(sk)
    sk = o.modifiers.new("skin", "SKIN")
    for v in me.skin_vertices[0].data:
        v.radius = (0.035, 0.035)
    me.materials.append(m)
    return o

# ---------------------------------------------------------------- materials
M_SOIL = soil_mat("Soil", 1.0)
M_HOLE = soil_mat("HoleWall", 0.42)
M_RUBBLE = soil_mat("Rubble", 0.75)
M_SAND = mat("BlackSand", (0.032, 0.03, 0.032), 0.95)
M_ROCK = mat("Rock", (0.06, 0.055, 0.055), 0.9)
M_MOUNT = mat("Mount", (0.075, 0.06, 0.05), 0.95)
M_SEA = mat("Sea", (0.02, 0.09, 0.16), 0.08)
M_WOOD = mat("Wood", (0.16, 0.09, 0.04), 0.8)
M_CEMENT = mat("Cement", (0.13, 0.125, 0.115), 1.0)
M_KHAKI = mat("Khaki", (0.18, 0.16, 0.08), 0.85)
M_SKIN = mat("Skin", (0.45, 0.28, 0.17), 0.6)
M_METAL = mat("Metal", (0.08, 0.08, 0.08), 0.4)
M_PLANE = mat("PlaneBody", (0.10, 0.11, 0.10), 0.5)
M_FIRE = mat("Fire", (1, 0.3, 0.05), 0.5, (1.0, 0.28, 0.03), 5)
M_SMOKE = mat("Smoke", (0.05, 0.047, 0.045), 1.0)
M_OUTLINE = mat("Outline", (1, 0.6, 0.35), 0.5, (1.0, 0.55, 0.28), 6)
M_LAMP = mat("LampGlow", (1, 0.7, 0.3), 0.5, (1.0, 0.6, 0.25), 30)

# ---------------------------------------------------------------- world & light
wd = bpy.data.worlds.new("Sky"); sc.world = wd; wd.use_nodes = True
bg = wd.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.42, 0.62, 0.95, 1); bg.inputs["Strength"].default_value = 0.9
sun = bpy.data.lights.new("Sun", "SUN"); sun.energy = 4.0; sun.angle = R(3)
so = link(bpy.data.objects.new("Sun", sun)); so.rotation_euler = (R(52), 0, R(-28))

# ---------------------------------------------------------------- ground
cut = bpy.data.collections.new("Cutters"); sc.collection.children.link(cut)
ground = box("Ground", -20, 20, 0, 40, -10, 0, mat=M_SOIL)
ground.data.materials.append(M_HOLE)
bm_ = ground.modifiers.new("Dig", "BOOLEAN")
bm_.operation = "DIFFERENCE"; bm_.operand_type = "COLLECTION"; bm_.collection = cut
bm_.solver = "EXACT"
try:
    bm_.material_mode = "TRANSFER"
except Exception:
    pass

# dunes behind the cross-section (fade in from y=2.5)
bpy.ops.mesh.primitive_grid_add(x_subdivisions=120, y_subdivisions=110, size=1, location=(0, 21.25, 0))
dn = bpy.context.active_object; dn.name = "Dunes"; dn.scale = (40, 37.5, 1)
bpy.ops.object.transform_apply(scale=True)
vg = dn.vertex_groups.new(name="fade")
for v in dn.data.vertices:
    wy = (dn.matrix_world @ v.co).y
    vg.add([v.index], max(0.0, min(1.0, (wy - 2.6) / 6.0)), "REPLACE")
tex = bpy.data.textures.new("dune", "CLOUDS"); tex.noise_scale = 3.0
dm = dn.modifiers.new("disp", "DISPLACE"); dm.texture = tex; dm.strength = 0.7; dm.mid_level = 0.0
dm.vertex_group = "fade"
dn.data.materials.append(M_SAND)
dn.location.z = 0.002

bpy.ops.mesh.primitive_plane_add(size=600, location=(0, 340, -0.35))
bpy.context.active_object.data.materials.append(M_SEA)
bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=16, radius2=3, depth=11, location=(-16, 62, 5.0))
bpy.context.active_object.data.materials.append(M_MOUNT)

for i in range(40):
    x = random.uniform(-7, 7); y = random.uniform(0.4, 18)
    if abs(x) < 1.6 and y < 3.0:
        continue
    r = random.uniform(0.08, 0.32)
    o = ico(f"rock{i}", (x, y, r * 0.25), r, M_ROCK, 1, 0.55)
    o.rotation_euler = (0, 0, random.uniform(0, 6.3))

# ---------------------------------------------------------------- cutters
shaft = box("ShaftCut", -0.62, 0.62, -1, 1.6, -1, 0, loc=(0, 0, 0.3), mat=M_HOLE, coll=cut)
tunnel = box("TunnelCut", 0, 1, -1, 1.6, -0.55, 0.55, loc=(0.0, 0, -2.65), mat=M_HOLE, coll=cut)
for c in (shaft, tunnel):
    c.display_type = "WIRE"; c.hide_render = True
SHAFT_D = 3.5  # bottom at z = -3.2
key(shaft, 1, scale=(1, 1, 0.001))
key(shaft, 12, scale=(1, 1, 0.08))
key(shaft, 62, scale=(1, 1, SHAFT_D))
key(tunnel, 1, scale=(0.001, 1, 1))
key(tunnel, 418, scale=(0.001, 1, 1))
key(tunnel, 472, scale=(4.2, 1, 1))

# ---------------------------------------------------------------- digger figure
def make_man(name):
    root = link(bpy.data.objects.new(name, None))
    parts = []
    for sx in (-0.11, 0.11):
        parts.append(cyl("leg", (sx, 0, 0.42), 0.085, 0.84, M_KHAKI))
    parts.append(cyl("torso", (0, 0, 1.13), 0.21, 0.62, M_KHAKI))
    parts.append(ico("head", (0, 0, 1.6), 0.14, M_SKIN, 2))
    parts.append(cyl("cap", (0, 0, 1.72), 0.155, 0.1, M_KHAKI))
    parts.append(cyl("brim", (0, -0.1, 1.68), 0.12, 0.03, M_KHAKI, rot=(R(90), 0, 0)))
    parts.append(cyl("armL", (-0.27, 0, 1.15), 0.065, 0.55, M_KHAKI, rot=(0, R(12), 0)))
    for p in parts:
        p.parent = root
    piv = link(bpy.data.objects.new(name + "_arm", None)); piv.parent = root; piv.location = (0.27, 0, 1.38)
    a = cyl("armR", (0, 0, -0.28), 0.065, 0.56, M_KHAKI); a.parent = piv
    sh = cyl("shovel", (0, -0.05, -0.75), 0.022, 0.75, M_WOOD); sh.parent = piv
    bl = box("blade", -0.11, 0.11, -0.02, 0.02, -0.28, 0, loc=(0, -0.05, -1.1), mat=M_METAL); bl.parent = piv
    return root, piv

man, arm = make_man("Digger")
BOT = -3.2
key(man, 1, location=(0, 0.75, BOT), scale=(0, 0, 0))
key(man, 40, location=(0, 0.75, BOT), scale=(0, 0, 0))
key(man, 46, scale=(1, 1, 1))
key(man, 236, scale=(1, 1, 1))
key(man, 242, scale=(0, 0, 0))
key(man, 318, scale=(0, 0, 0))
key(man, 324, scale=(1, 1, 1))
key(man, 418, location=(0.2, 0.75, BOT), scale=(1, 1, 1))
key(man, 424, scale=(1.05, 1.05, 0.6))
key(man, 472, location=(3.4, 0.75, BOT))
key(man, 485, location=(3.6, 0.75, BOT))

def dig(f0, f1, step=7):
    f, up = f0, True
    while f <= f1:
        key(arm, f, rotation_euler=(0, R(-75 if up else 15), 0))
        up = not up; f += step
    key(arm, f1 + step, rotation_euler=(0, 0, 0))
key(arm, 1, rotation_euler=(0, 0, 0))
dig(46, 228); dig(324, 400); dig(424, 478, 6)

# ---------------------------------------------------------------- lid + rocks + outline
lid = link(bpy.data.objects.new("LidRig", None))
plank = box("Lid", -0.78, 0.78, 0.0, 1.75, 0, 0.1, mat=M_WOOD); plank.parent = lid
key(lid, 1, location=(0, 0, 3.5), scale=(0, 0, 0))
key(lid, 152, location=(0, 0, 3.5), scale=(0, 0, 0))
key(lid, 156, location=(0, 0, 3.5), scale=(1, 1, 1))
key(lid, 170, location=(0, 0, 0.0))
key(lid, 174, location=(0, 0, 0.12))
key(lid, 178, location=(0, 0, 0.0))
lid_rocks = []
for i in range(9):
    o = ico(f"lidrock{i}", (random.uniform(-0.6, 0.6), random.uniform(0.15, 1.6), 0.16), random.uniform(0.1, 0.2), M_ROCK, 1, 0.6)
    f = 178 + i * 2
    key(o, 1, scale=(0, 0, 0)); key(o, f, scale=(0, 0, 0)); key(o, f + 5, scale=(1.15, 1.15, 0.65)); key(o, f + 8, scale=(1, 1, 0.55))
ash = box("Ash", -0.8, 0.8, 0.0, 1.78, 0.1, 0.13, mat=M_SAND)
key(ash, 1, scale=(0, 0, 0)); key(ash, 192, scale=(0, 0, 0)); key(ash, 200, scale=(1, 1, 1))

ol = outline_rect("LidOutline", 1.8, 1.95, (0, 0.88, 0.2), (0, 0, 0), M_OUTLINE)
key(ol, 1, scale=(0, 0, 0)); key(ol, 196, scale=(0, 0, 0)); key(ol, 201, scale=(1.08, 1.08, 1))
key(ol, 204, scale=(1, 1, 1)); key(ol, 226, scale=(1, 1, 1)); key(ol, 231, scale=(0, 0, 0))

# ---------------------------------------------------------------- planes
def make_plane(name):
    root = link(bpy.data.objects.new(name, None))
    for p in (cyl("fus", (0, 0, 0), 0.38, 4.6, M_PLANE, rot=(0, R(90), 0), verts=16),
              box("wing", -0.5, 0.5, -3.2, 3.2, -0.05, 0.05, mat=M_PLANE),
              box("tail", -2.4, -1.9, -1.1, 1.1, -0.04, 0.04, mat=M_PLANE),
              box("fin", -2.4, -1.9, -0.04, 0.04, 0, 0.9, mat=M_PLANE),
              box("e1", 0.2, 1.0, -1.7, -1.3, -0.3, 0.0, mat=M_PLANE),
              box("e2", 0.2, 1.0, 1.3, 1.7, -0.3, 0.0, mat=M_PLANE)):
        p.parent = root
    return root
for i, (y, z, d) in enumerate(((4.0, 3.6, 0), (8.0, 4.4, 8))):
    p = make_plane(f"Plane{i}")
    key(p, 1, location=(-30, y, z), rotation_euler=(R(4), 0, 0))
    key(p, 78 + d, location=(-30, y, z))
    key(p, 140 + d, location=(30, y, z + 0.6))

# ---------------------------------------------------------------- explosions
def explosion(loc, f, size=1.0):
    x, y, z = loc
    fb = ico("fireball", loc, 1.0, M_FIRE, 3)
    key(fb, 1, scale=(0, 0, 0)); key(fb, f, scale=(0, 0, 0))
    key(fb, f + 3, scale=(size, size, size * 0.85)); key(fb, f + 9, scale=(size * 1.35,) * 3)
    key(fb, f + 15, scale=(0, 0, 0))
    lt = bpy.data.lights.new("blast", "POINT"); lt.color = (1, 0.5, 0.15)
    lo = link(bpy.data.objects.new("blastL", lt)); lo.location = (x, y - 1.5, z + 1.5)
    for ff, e in ((1, 0), (f, 0), (f + 2, 2500 * size), (f + 14, 0)):
        lt.energy = e; lt.keyframe_insert("energy", frame=ff)
    for i in range(7):
        s = ico("smoke", (x + random.uniform(-0.8, 0.8) * size, y + random.uniform(-0.5, 0.5), z + random.uniform(0.3, 1.2) * size),
                1.0, M_SMOKE, 3)
        r = random.uniform(0.7, 1.2) * size
        key(s, 1, scale=(0, 0, 0)); key(s, f + 2, scale=(0, 0, 0))
        key(s, f + 12, scale=(r, r, r))
        s.location.z += 2.5 * size; key(s, f + 60, location=s.location.copy(), scale=(r * 1.5,) * 3)
        key(s, f + 80, scale=(0, 0, 0))
    for i in range(10):
        c = ico("chunk", loc, random.uniform(0.06, 0.14), M_ROCK, 1)
        vx, vy, vz = random.uniform(-3, 3), random.uniform(-2.5, 1), random.uniform(3, 6)
        key(c, 1, scale=(0, 0, 0)); key(c, f, location=loc, scale=(0, 0, 0)); key(c, f + 1, scale=(1, 1, 1))
        key(c, f + 9, location=(x + vx * 0.5, y + vy * 0.5, z + vz * 0.45))
        key(c, f + 18, location=(x + vx, y + vy, 0.05)); key(c, f + 40, scale=(1, 1, 1)); key(c, f + 46, scale=(0, 0, 0))

explosion((-2.3, 6.0, 0.2), 8, 1.3)
explosion((2.0, 17.0, 0.2), 118, 1.6)
explosion((2.4, 3.6, 0.2), 236, 1.4)

# ---------------------------------------------------------------- collapse + cement
rub = box("Rubble", -0.62, 0.62, 0.0, 1.6, 0, 1, loc=(0, 0, BOT), mat=M_RUBBLE)
key(rub, 1, scale=(1, 1, 0.001)); key(rub, 243, scale=(1, 1, 0.001)); key(rub, 258, scale=(1, 1, 2.1))
key(rub, 324, scale=(1, 1, 2.1)); key(rub, 352, scale=(1, 1, 0.001))
for i in range(8):
    o = ico(f"fall{i}", (random.uniform(-0.45, 0.45), random.uniform(0.3, 1.3), 0.3), random.uniform(0.1, 0.2), M_RUBBLE, 1)
    f = 240 + i
    key(o, 1, scale=(0, 0, 0)); key(o, f, scale=(0, 0, 0)); key(o, f + 1, scale=(1, 1, 1))
    key(o, f + 12, location=(o.location.x, o.location.y, -1.1)); key(o, f + 16, scale=(0, 0, 0))

linL = box("LineL", -0.62, -0.52, 0.0, 1.6, -1, 0, loc=(0, 0, 0), mat=M_CEMENT)
linB = box("LineB", -0.62, 0.62, 1.5, 1.6, -1, 0, loc=(0, 0, 0), mat=M_CEMENT)
linR = box("LineR", 0.52, 0.62, 0.0, 1.6, -1, 0, loc=(0, 0, 0), mat=M_CEMENT)
for o, d in ((linL, 3.2), (linB, 3.2), (linR, 1.9)):
    key(o, 1, scale=(1, 1, 0.0)); key(o, 352, scale=(1, 1, 0.0)); key(o, 384, scale=(1, 1, d))
ol2 = outline_rect("ShaftOutline", 1.36, 3.35, (0, -0.02, -1.58), (R(90), 0, 0), M_OUTLINE)
key(ol2, 1, scale=(0, 0, 0)); key(ol2, 386, scale=(0, 0, 0)); key(ol2, 391, scale=(1.06, 1.06, 1))
key(ol2, 394, scale=(1, 1, 1)); key(ol2, 410, scale=(1, 1, 1)); key(ol2, 415, scale=(0, 0, 0))

# lamp in tunnel
lg = ico("lamp", (2.3, 0.9, -2.2), 0.07, M_LAMP, 2)
key(lg, 1, scale=(0, 0, 0)); key(lg, 448, scale=(0, 0, 0)); key(lg, 452, scale=(1.4, 1.4, 1.4)); key(lg, 455, scale=(1, 1, 1))
ll = bpy.data.lights.new("lampL", "POINT"); ll.color = (1, 0.6, 0.25); ll.shadow_soft_size = 0.05
llo = link(bpy.data.objects.new("lampL", ll)); llo.location = (2.3, 0.6, -2.3)
for ff, e in ((1, 0), (448, 0), (453, 60)):
    ll.energy = e; ll.keyframe_insert("energy", frame=ff)

# ---------------------------------------------------------------- camera
cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 35; cam_d.sensor_fit = "VERTICAL"; cam_d.sensor_height = 36
rig = link(bpy.data.objects.new("CamRig", None))
cam = link(bpy.data.objects.new("Cam", cam_d)); cam.parent = rig; sc.camera = cam

def look(f, loc, target):
    dx, dy, dz = (target[i] - loc[i] for i in range(3))
    pitch = math.atan2(-dz, math.hypot(dx, dy))
    yaw = math.atan2(-dx, dy)
    key(rig, f, location=loc, rotation_euler=(R(90) - pitch, 0, yaw))

SIDE_T = (0, 0, -1.25)
look(1, (0, -11.6, 1.5), SIDE_T)
look(80, (0, -11.0, 1.5), SIDE_T)
look(134, (0, -10.6, 1.55), SIDE_T)
look(166, (0, -6.2, 6.6), (0, 0.9, 0))          # high angle on the lid
look(212, (0, -5.8, 6.2), (0, 0.9, 0))
look(240, (0, -10.8, 1.5), SIDE_T)                # back to side for the blast
look(298, (0, -10.4, 1.4), SIDE_T)
look(340, (0, -7.4, 0.3), (0, 0, -1.7))           # push-in on shaft
look(410, (0, -7.1, 0.25), (0, 0, -1.7))
look(452, (1.5, -7.6, -0.5), (1.5, 0, -2.5))      # pan down + track along tunnel
look(485, (1.7, -7.1, -0.55), (1.7, 0, -2.55))

key(cam, 1, location=(0, 0, 0))
def shake(f0, f1, amp):
    key(cam, f0 - 1, location=(0, 0, 0))
    for f in range(f0, f1):
        a = amp * (1 - (f - f0) / (f1 - f0))
        key(cam, f, location=(random.uniform(-a, a), random.uniform(-a, a), 0))
    key(cam, f1, location=(0, 0, 0))
shake(9, 22, 0.16); shake(120, 128, 0.06); shake(237, 254, 0.2)

sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(W, "iwojima_hook.blend"))
print("BUILD_OK")
