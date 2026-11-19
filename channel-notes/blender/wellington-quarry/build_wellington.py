# Wellington Quarry (Arras 1917) short: builds the whole scene + animation in Blender (4.2+ / 5.x).
# Run:  blender -b -P build_wellington.py            (or: python -c "import bpy" with the bpy pip package)
# Env:  GE_OUT=<folder for frames>   GE_ENGINE=CYCLES|BLENDER_EEVEE   GE_SAMPLES=10
import bpy, bmesh, math, random, os

random.seed(17)
W = os.environ.get("GE_OUT", os.path.join(os.path.dirname(os.path.abspath(__file__)), "out"))
FPS, END = 24, 1584
R = math.radians

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, END
sc.render.resolution_x, sc.render.resolution_y = 720, 1280
sc.render.image_settings.file_format = "PNG"
sc.render.filepath = os.path.join(W, "frames", "f_")
ENGINE = os.environ.get("GE_ENGINE", "CYCLES")
sc.render.engine = ENGINE
if ENGINE == "CYCLES":
    sc.cycles.device = "CPU"
    sc.cycles.samples = int(os.environ.get("GE_SAMPLES", "10"))
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 4
    sc.cycles.diffuse_bounces = 2
    sc.cycles.glossy_bounces = 1
    sc.cycles.transmission_bounces = 2
    sc.cycles.transparent_max_bounces = 6
    sc.render.use_persistent_data = True
else:
    try:
        sc.eevee.taa_render_samples = 16
    except Exception:
        pass
# realistic film look instead of "Standard" (the Cu Chi version looked cartoonish)
for vt in ("AgX", "Filmic"):
    try:
        sc.view_settings.view_transform = vt; break
    except TypeError:
        pass
for lk in ("AgX - Medium High Contrast", "Medium High Contrast", "None"):
    try:
        sc.view_settings.look = lk; break
    except TypeError:
        pass

# ------------------------------------------------------------ helpers
def link(o, coll=None):
    (coll or sc.collection).objects.link(o); return o

def box(name, x0, x1, y0, y1, z0, z1, loc=(0, 0, 0), mat=None, coll=None):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    v = [bm.verts.new((x, y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
        bm.faces.new([v[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); o.location = loc
    if mat: me.materials.append(mat)
    return link(o, coll)

def key(o, f, **kw):
    for k, v in kw.items():
        setattr(o, k, v); o.keyframe_insert(k, frame=f)

def mat(name, col, rough=0.9, emit=None, strength=0.0, noise=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; N, L = nt.nodes, nt.links
    b = N["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    if noise:
        tc = N.new("ShaderNodeTexCoord")
        nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 6; nz.inputs["Detail"].default_value = 8
        L.new(tc.outputs["Object"], nz.inputs["Vector"])
        rp = N.new("ShaderNodeValToRGB")
        rp.color_ramp.elements[0].position = 0.3; rp.color_ramp.elements[0].color = (*[c * (1 - noise) for c in col], 1)
        rp.color_ramp.elements[1].position = 0.7; rp.color_ramp.elements[1].color = (*[min(1, c * (1 + noise)) for c in col], 1)
        L.new(nz.outputs["Fac"], rp.inputs["Fac"]); L.new(rp.outputs["Color"], b.inputs["Base Color"])
        bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.4
        L.new(nz.outputs["Fac"], bp.inputs["Height"]); L.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m

def soil_mat(name, bright=1.0, body=(0.36, 0.075, 0.03), body2=(0.40, 0.09, 0.035), top=(0.26, 0.12, 0.05), grass=(0.10, 0.10, 0.03)):
    """Cross-section soil: body colour at depth, a ragged topsoil band and a thin surface layer."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; N, L = nt.nodes, nt.links
    b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 1.0
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    edge = N.new("ShaderNodeTexNoise"); edge.inputs["Scale"].default_value = 1.6; edge.inputs["Detail"].default_value = 4
    L.new(tc.outputs["Object"], edge.inputs["Vector"])
    sub = N.new("ShaderNodeMath"); sub.operation = "SUBTRACT"; sub.inputs[1].default_value = 0.5
    L.new(edge.outputs["Fac"], sub.inputs[0])
    mul = N.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = 0.35
    L.new(sub.outputs[0], mul.inputs[0])
    add = N.new("ShaderNodeMath"); add.operation = "ADD"
    L.new(sep.outputs["Z"], add.inputs[0]); L.new(mul.outputs[0], add.inputs[1])
    mr = N.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = -10; mr.inputs["From Max"].default_value = 0
    L.new(add.outputs[0], mr.inputs["Value"])
    rp = N.new("ShaderNodeValToRGB"); cr = rp.color_ramp; cr.interpolation = "LINEAR"
    stops = [(0.0, body), (0.90, body2), (0.935, body2), (0.945, top), (0.985, top), (0.996, grass)]
    cr.elements[0].position, cr.elements[0].color = stops[0][0], (*[c * bright for c in stops[0][1]], 1)
    cr.elements[1].position, cr.elements[1].color = stops[-1][0], (*[c * bright for c in stops[-1][1]], 1)
    for p, c in stops[1:-1]:
        e = cr.elements.new(p); e.color = (*[x * bright for x in c], 1)
    L.new(mr.outputs["Result"], rp.inputs["Fac"])
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 22; nz.inputs["Detail"].default_value = 10
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    nr = N.new("ShaderNodeValToRGB")
    nr.color_ramp.elements[0].position = 0.35; nr.color_ramp.elements[0].color = (0.75, 0.75, 0.75, 1)
    nr.color_ramp.elements[1].position = 0.65; nr.color_ramp.elements[1].color = (1.12, 1.12, 1.12, 1)
    L.new(nz.outputs["Fac"], nr.inputs["Fac"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"
    mx.inputs["Factor"].default_value = 1.0
    L.new(rp.outputs["Color"], mx.inputs[6]); L.new(nr.outputs["Color"], mx.inputs[7])
    L.new(mx.outputs[2], b.inputs["Base Color"])
    nz2 = N.new("ShaderNodeTexNoise"); nz2.inputs["Scale"].default_value = 80; nz2.inputs["Detail"].default_value = 6
    L.new(tc.outputs["Object"], nz2.inputs["Vector"])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.45
    L.new(nz2.outputs["Fac"], bp.inputs["Height"]); L.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m

def ico(name, loc, r, m, sub=2, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = scale; o.data.materials.append(m)
    return o

def cyl(name, loc, r, depth, m, rot=(0, 0, 0), verts=12, r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.data.materials.append(m)
    return o

def outline_rect(name, w, h, loc, rot, m):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True)
    me = o.data; bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.delete(bm, geom=bm.faces[:], context="FACES_ONLY"); bm.to_mesh(me); bm.free()
    o.modifiers.new("skin", "SKIN")
    for v in me.skin_vertices[0].data:
        v.radius = (0.03, 0.03)
    me.materials.append(m)
    return o

def pop(o, f, s=(1, 1, 1), hide_after=None):
    key(o, 1, scale=(0, 0, 0)); key(o, f, scale=(0, 0, 0))
    key(o, f + 4, scale=tuple(x * 1.15 for x in s)); key(o, f + 7, scale=s)
    if hide_after:
        key(o, hide_after, scale=s); key(o, hide_after + 5, scale=(0, 0, 0))


def make_man(name, cloth, hat, pack=False, basket=False):
    root = link(bpy.data.objects.new(name, None))
    legs, arms = [], []
    for sx in (-0.11, 0.11):
        p = link(bpy.data.objects.new("hip", None)); p.parent = root; p.location = (sx, 0, 0.84)
        l = cyl("leg", (0, 0, -0.42), 0.085, 0.84, cloth); l.parent = p; legs.append(p)
    for o in (cyl("torso", (0, 0, 1.13), 0.21, 0.62, cloth), ico("head", (0, 0, 1.6), 0.14, M_SKIN, 2)):
        o.parent = root
    if hat == "cone":
        o = cyl("hat", (0, 0, 1.76), 0.34, 0.16, M_STRAW, verts=20, r2=0.0); o.parent = root
    elif hat == "cap":
        o = box("cap", -0.13, 0.13, -0.17, 0.15, 1.68, 1.8, mat=M_CAP); o.parent = root
    elif hat == "none":
        pass
    else:
        o = ico("helmet", (0, 0, 1.68), 0.18, M_OLIVE, 2, (1, 1, 0.65)); o.parent = root
    if pack:
        o = box("pack", -0.17, 0.17, 0.2, 0.42, 0.95, 1.45, mat=M_PACK); o.parent = root
    for sx in (-0.28, 0.28):
        p = link(bpy.data.objects.new("shoulder", None)); p.parent = root; p.location = (sx, 0, 1.38)
        a = cyl("arm", (0, 0, -0.28), 0.065, 0.56, cloth); a.parent = p; arms.append(p)
        h = ico("hand", (0, 0, -0.6), 0.06, M_SKIN, 2); h.parent = p
    for p in legs:
        b = box("boot", -0.07, 0.07, -0.16, 0.07, -0.9, -0.8, mat=M_BOOT); b.parent = p
    o = cyl("belt", (0, 0, 0.86), 0.215, 0.07, M_BOOT); o.parent = root
    o = ico("chest", (0, 0, 1.27), 0.23, cloth, 2, (1, 0.8, 0.75)); o.parent = root
    o = cyl("neck", (0, 0, 1.47), 0.06, 0.08, M_SKIN); o.parent = root
    if basket:
        o = cyl("basket", (0, 0, 1.95), 0.3, 0.25, M_STRAW, verts=14, r2=0.22); o.parent = root
        c = ico("dirt", (0, 0, 2.06), 0.24, M_CLAY, 2, (1, 1, 0.45)); c.parent = root
        for p in arms:
            key(p, 1, rotation_euler=(R(170), 0, 0))
    return root, legs, arms

def walk(legs, arms, f0, f1, step=6, swing=28, arm_swing=True):
    f, s = f0, 1
    while f <= f1:
        key(legs[0], f, rotation_euler=(R(swing * s), 0, 0)); key(legs[1], f, rotation_euler=(R(-swing * s), 0, 0))
        if arm_swing:
            key(arms[0], f, rotation_euler=(R(-swing * s), 0, 0)); key(arms[1], f, rotation_euler=(R(swing * s), 0, 0))
        s = -s; f += step
    for p in legs:
        key(p, f1 + step, rotation_euler=(0, 0, 0))


def explosion(loc, f, size=1.0):
    x, y, z = loc
    fb = ico("fireball", loc, 1.0, M_FIRE, 3)
    key(fb, 1, scale=(0, 0, 0)); key(fb, f, scale=(0, 0, 0))
    key(fb, f + 3, scale=(size, size, size * 0.85)); key(fb, f + 9, scale=(size * 1.3,) * 3); key(fb, f + 15, scale=(0, 0, 0))
    lt = bpy.data.lights.new("blast", "POINT"); lt.color = (1, 0.5, 0.15)
    lo = link(bpy.data.objects.new("blastL", lt)); lo.location = (x, y - 1.5, z + 1.5)
    for ff, e in ((1, 0), (f, 0), (f + 2, 2500 * size), (f + 14, 0)):
        lt.energy = e; lt.keyframe_insert("energy", frame=ff)
    for i in range(12):
        s = ico("smoke", (x + random.uniform(-0.9, 0.9) * size, y + random.uniform(-0.6, 0.6), z + random.uniform(0.2, 1.4) * size),
                1.0, M_SMOKE, 3)
        r = random.uniform(0.5, 0.9) * size
        key(s, 1, scale=(0, 0, 0)); key(s, f + 2, scale=(0, 0, 0)); key(s, f + 12, scale=(r, r, r))
        s.location.z += 3.0 * size; s.location.x += random.uniform(-1, 1)
        key(s, f + 70, location=s.location.copy(), scale=(r * 1.6,) * 3); key(s, f + 95, scale=(0, 0, 0))
    for i in range(10):
        c = ico("chunk", loc, random.uniform(0.06, 0.13), M_CLAY, 1)
        vx, vy, vz = random.uniform(-3, 3), random.uniform(-2.5, 1), random.uniform(3, 6)
        key(c, 1, scale=(0, 0, 0)); key(c, f, location=loc, scale=(0, 0, 0)); key(c, f + 1, scale=(1, 1, 1))
        key(c, f + 9, location=(x + vx * 0.5, y + vy * 0.5, z + vz * 0.45))
        key(c, f + 18, location=(x + vx, y + vy, 0.05)); key(c, f + 40, scale=(1, 1, 1)); key(c, f + 46, scale=(0, 0, 0))


def lamp_at(loc, f, energy=25):
    g = ico("lampglow", loc, 0.06, M_LAMP, 2); pop(g, f)
    l = bpy.data.lights.new("lamp", "POINT"); l.color = (1, 0.6, 0.25); l.shadow_soft_size = 0.05
    lo = link(bpy.data.objects.new("lamp", l)); lo.location = (loc[0], loc[1] - 0.4, loc[2] - 0.1)
    for ff, e in ((1, 0), (f, 0), (f + 4, energy)):
        l.energy = e; l.keyframe_insert("energy", frame=ff)

def arrow(name, path, f0, step):
    """White arrow (pointing along -Z of its local frame) that travels along path points."""
    root = link(bpy.data.objects.new(name, None))
    c = cyl("ahead", (0, 0, -0.14), 0.11, 0.18, M_ARROW, verts=10, r2=0.0, rot=(R(180), 0, 0)); c.parent = root
    s = cyl("ashaft", (0, 0, 0.05), 0.035, 0.25, M_ARROW, verts=8); s.parent = root
    key(root, 1, scale=(0, 0, 0)); key(root, f0 - 1, location=path[0][0], rotation_euler=path[0][1], scale=(0, 0, 0))
    key(root, f0, scale=(1, 1, 1))
    f = f0
    for p, rot in path[1:]:
        f += step; key(root, f, location=p, rotation_euler=rot)
    key(root, f + 2, scale=(1, 1, 1)); key(root, f + 6, scale=(0, 0, 0))


# ------------------------------------------------------------ materials
M_SOIL = soil_mat("Chalk", 1.0, body=(0.48, 0.46, 0.41), body2=(0.60, 0.58, 0.52), top=(0.12, 0.08, 0.05), grass=(0.08, 0.08, 0.04))
M_HOLE = soil_mat("CaveWall", 0.6, body=(0.48, 0.46, 0.41), body2=(0.60, 0.58, 0.52), top=(0.12, 0.08, 0.05), grass=(0.08, 0.08, 0.04))
M_CHALK = mat("ChalkChunk", (0.65, 0.63, 0.58), 1.0, noise=0.2)
M_GROUND = mat("Mud", (0.07, 0.055, 0.04), 1.0, noise=0.5)
M_STONE = mat("Stone", (0.42, 0.38, 0.32), 0.9, noise=0.35)
M_STONE2 = mat("Stone2", (0.30, 0.27, 0.23), 0.9, noise=0.35)
M_ROOF = mat("Roof", (0.12, 0.05, 0.03), 0.9, noise=0.3)
M_WOOD = mat("Wood", (0.17, 0.10, 0.05), 0.8, noise=0.3)
M_DWOOD = mat("DarkWood", (0.08, 0.05, 0.03), 0.85, noise=0.3)
M_SANDBAG = mat("Sandbag", (0.25, 0.21, 0.14), 0.95, noise=0.3)
M_METAL = mat("Metal", (0.08, 0.08, 0.08), 0.4)
M_PIPE = mat("Pipe", (0.12, 0.14, 0.16), 0.4)
M_BED = mat("Bed", (0.55, 0.52, 0.45), 0.9)
M_KHAKI = mat("Khaki", (0.16, 0.13, 0.07), 0.9)
M_OLIVE = M_KHAKI
M_GREYC = mat("FieldGrey", (0.09, 0.10, 0.09), 0.9)
M_PACK = mat("Pack", (0.12, 0.11, 0.08), 0.85)
M_BLACK = mat("BlackCloth", (0.02, 0.02, 0.025), 0.9)
M_STRAW = mat("Straw", (0.45, 0.36, 0.18), 0.9)
M_SKIN = mat("Skin", (0.55, 0.36, 0.25), 0.6)
M_BOOT = mat("Boot", (0.025, 0.02, 0.015), 0.6)
M_CAP = mat("Cap", (0.14, 0.11, 0.06), 0.9)
M_CLAY = M_CHALK
M_ARROW = mat("Arrow", (1, 1, 1), 0.5, (1, 1, 1), 0.8)
M_RING = mat("Ring", (1, 1, 1), 0.5, (0.9, 0.95, 1.0), 1.2)
M_LABEL = mat("Label", (1, 1, 1), 0.5, (1, 1, 1), 1.0)
M_SNOW = mat("Snow", (0.85, 0.87, 0.9), 0.6, noise=0.08)
M_LAMP = mat("LampGlow", (1, 0.7, 0.3), 0.5, (1.0, 0.6, 0.25), 30)
M_BULB = mat("Bulb", (1, 0.85, 0.6), 0.5, (1.0, 0.8, 0.5), 0.0)
M_FIRE = mat("Fire", (1, 0.3, 0.02), 0.5, (1.0, 0.28, 0.03), 9.0)
M_OUTLINE = mat("Outline", (1, 0.45, 0.15), 0.5, (1.0, 0.42, 0.12), 0.9)
M_CRACK = mat("Crack", (0.02, 0.02, 0.02), 1.0)
M_SMOKE = mat("Smoke", (0.22, 0.21, 0.2), 1.0)
M_SMOKE.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.55
try:
    M_SMOKE.blend_method = "BLEND"; M_SMOKE.surface_render_method = "BLENDED"
except Exception:
    pass

def set_interp(kind):
    try:
        bpy.context.preferences.edit.keyframe_new_interpolation_type = kind
    except Exception:
        pass

def show(o, f_on, f_off=None):
    o.hide_render = True; o.keyframe_insert("hide_render", frame=1)
    o.hide_render = False; o.keyframe_insert("hide_render", frame=f_on)
    if f_off:
        o.hide_render = True; o.keyframe_insert("hide_render", frame=f_off)

def text(name, body, loc, size, m, rot=(R(90), 0, 0)):
    cu = bpy.data.curves.new(name, "FONT"); cu.body = body; cu.size = size; cu.align_x = "CENTER"; cu.extrude = 0.03
    o = link(bpy.data.objects.new(name, cu)); o.location = loc; o.rotation_euler = rot
    cu.materials.append(m)
    return o

def F(t):
    return int(round(t * 24)) + 1

# ------------------------------------------------------------ world & lights (grey day -> night -> snowy dawn)
wd = bpy.data.worlds.new("Sky"); sc.world = wd; wd.use_nodes = True
bg = wd.node_tree.nodes["Background"]
sun = bpy.data.lights.new("Sun", "SUN"); sun.angle = R(6); sun.color = (1.0, 0.9, 0.78)
so = link(bpy.data.objects.new("Sun", sun)); so.rotation_euler = (R(58), 0, R(-30))
moon = bpy.data.lights.new("Moon", "SUN"); moon.color = (0.55, 0.65, 1.0); moon.angle = R(4)
mo = link(bpy.data.objects.new("Moon", moon)); mo.rotation_euler = (R(45), 0, R(25))
DAY, NIGHT, DAWN = (2.4, 0.6, 0.0, (0.55, 0.58, 0.62, 1)), (0.0, 0.1, 2.0, (0.04, 0.06, 0.12, 1)), (0.6, 0.35, 1.2, (0.35, 0.42, 0.55, 1))
for f, (se, ws, me_, c) in ((1, DAY), (F(41.0), DAY), (F(41.8), NIGHT), (F(52.6), NIGHT), (F(53.6), DAWN)):
    sun.energy = se; sun.keyframe_insert("energy", frame=f)
    moon.energy = me_; moon.keyframe_insert("energy", frame=f)
    bg.inputs["Strength"].default_value = ws; bg.inputs["Strength"].keyframe_insert("default_value", frame=f)
    bg.inputs["Color"].default_value = c; bg.inputs["Color"].keyframe_insert("default_value", frame=f)

# ------------------------------------------------------------ ground block + cutters
cut = bpy.data.collections.new("Cutters"); sc.collection.children.link(cut)
ground = box("Ground", -50, 50, 0, 40, -45, 0, mat=M_SOIL)
ground.data.materials.append(M_HOLE)
bm_ = ground.modifiers.new("Dig", "BOOLEAN")
bm_.operation = "DIFFERENCE"; bm_.operand_type = "COLLECTION"; bm_.collection = cut; bm_.solver = "EXACT"
try:
    bm_.material_mode = "TRANSFER"
except Exception:
    pass
bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 239.9, -0.01))
bpy.context.active_object.data.materials.append(M_GROUND)
snow = box("Snow", -50, 50, 0, 40, 0, 0.05, mat=M_SNOW)
sm = snow.modifiers.new("Dig", "BOOLEAN"); sm.operation = "DIFFERENCE"; sm.operand_type = "COLLECTION"; sm.collection = cut; sm.solver = "EXACT"
show(snow, F(52.8))
snow2 = box("SnowFar", -200, 200, 40, 300, -0.01, 0.04, mat=M_SNOW); show(snow2, F(52.8))

def gcut(name, x0, x1, z0, z1, keys, mode="x", y0=-1.0, y1=2.4):
    if mode == "x":
        o = box(name, 0, 1, y0, y1, z0, z1, loc=(x0, 0, 0), mat=M_HOLE, coll=cut); full = lambda t: (max(0.001, (x1 - x0) * t), 1, 1)
    elif mode == "xl":
        o = box(name, -1, 0, y0, y1, z0, z1, loc=(x1, 0, 0), mat=M_HOLE, coll=cut); full = lambda t: (max(0.001, (x1 - x0) * t), 1, 1)
    elif mode == "z":
        o = box(name, x0, x1, y0, y1, -1, 0, loc=(0, 0, z1), mat=M_HOLE, coll=cut); full = lambda t: (1, 1, max(0.001, (z1 - z0) * t))
    elif mode == "zu":
        o = box(name, x0, x1, y0, y1, 0, 1, loc=(0, 0, z0), mat=M_HOLE, coll=cut); full = lambda t: (1, 1, max(0.001, (z1 - z0) * t))
    else:  # "pop": the whole cave appears, growing from its centre (lantern reveal)
        cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
        o = box(name, -0.5, 0.5, y0, y1, -0.5, 0.5, loc=(cx, 0, cz), mat=M_HOLE, coll=cut)
        full = lambda t: (max(0.001, (x1 - x0) * t), 1, max(0.001, (z1 - z0) * t))
    o.display_type = "WIRE"; o.hide_render = True
    key(o, 1, scale=full(0))
    for f, t in keys:
        key(o, f, scale=full(t))
    return o

# shaft from the city, medieval caves (bell-ish: main box + narrower dome), connecting tunnels
gcut("shaft", -12.2, -11.2, -9.5, 0.1, [(F(0.3), 0), (F(3.4), 1)], "z")
CAVES = [(-15.0, -10.0, -14.0, -9.0, 3.8), (-8.0, -3.5, -13.5, -9.0, 4.8), (-1.5, 3.5, -14.0, -9.0, 5.8), (5.5, 9.0, -13.0, -9.2, 6.8)]
for i, (x0, x1, z0, z1, t) in enumerate(CAVES):
    gcut(f"cave{i}", x0, x1, z0, z1, [(F(t), 0), (F(t) + 14, 1)], "pop")
    w = (x1 - x0) * 0.6
    gcut(f"dome{i}", (x0 + x1) / 2 - w / 2, (x0 + x1) / 2 + w / 2, z1 - 0.2, z1 + 1.1, [(F(t) + 6, 0), (F(t) + 18, 1)], "pop")
for i, (x0, x1, t) in enumerate(((-10.2, -7.8, 8.5), (-3.7, -1.3, 9.4), (3.3, 5.7, 10.3))):
    gcut(f"link{i}", x0, x1, -12.0, -10.0, [(F(t), 0), (F(t) + 22, 1)], "x")
gcut("shaftLink", -12.2, -11.2, -12.0, -9.4, [(F(3.0), 0), (F(3.6), 1)], "z")
# quiet tunnel toward the enemy (B7) and last push under their line (B15)
gcut("push1", 9.0, 11.0, -12.0, -10.0, [(F(20.0), 0), (F(23.4), 1)], "x")
gcut("rise", 10.0, 11.0, -10.1, -6.0, [(F(48.8), 0), (F(50.2), 1)], "zu")
gcut("last", 10.0, 15.5, -7.0, -5.2, [(F(50.0), 0), (F(52.4), 1)], "x")
EXITS = [12.5, 14.5]
for i, ex in enumerate(EXITS):
    gcut(f"exitShaft{i}", ex - 0.4, ex + 0.4, -5.3, -0.6, [(F(50.6 + i * 0.4), 0), (F(52.6), 1)], "zu")
    gcut(f"exitTop{i}", ex - 0.4, ex + 0.4, -0.7, 0.3, [(F(54.0 + i * 0.6), 0), (F(54.2 + i * 0.6), 1)], "zu")
# trenches: ours (x 1.5) and the enemy line (x 16)
gcut("ourTrench", 1.2, 2.4, -1.9, 0.1, [(1, 1)], "z", y0=-1.0, y1=40)
gcut("enemyTrench", 15.6, 16.8, -1.9, 0.1, [(1, 1)], "z", y0=-1.0, y1=40)
for tx in (1.2, 2.4, 15.6, 16.8):
    for k in range(10):
        box("sandbag", tx - 0.3, tx + 0.3, k * 1.0, k * 1.0 + 0.9, 0, 0.35, mat=M_SANDBAG)

# ------------------------------------------------------------ ruined city (x -30..0), no-man's land, wire
random.seed(5)
for i in range(46):
    x = random.uniform(-32, -0.5); y = random.uniform(1.0, 30)
    w, d, h = random.uniform(2.0, 4.0), random.uniform(2.0, 4.0), random.uniform(3, 9)
    m_ = random.choice((M_STONE, M_STONE2))
    box("house", x, x + w, y, y + d, 0, h, mat=m_)
    for k in range(random.randint(1, 3)):          # jagged, shell-damaged tops
        bx = x + random.uniform(0, w * 0.6)
        box("rubbleTop", bx, bx + random.uniform(0.4, 1.2), y, y + d, h, h + random.uniform(0.3, 1.5), mat=m_)
    if random.random() < 0.35:
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=max(w, d) * 0.72, depth=1.6, location=(x + w / 2, y + d / 2, h + 0.8), rotation=(0, 0, R(45)))
        bpy.context.active_object.data.materials.append(M_ROOF)
for i in range(30):                                 # rubble heaps in the street
    ico("rubble", (random.uniform(-30, -1), random.uniform(0.3, 25), 0.0), random.uniform(0.3, 0.9), random.choice((M_STONE, M_STONE2)), 1, (1, 1, 0.5))
for i in range(18):                                 # shell craters in no-man's land
    x = random.uniform(3.5, 14.5); y = random.uniform(0.5, 30)
    ico("craterRim", (x, y, 0.0), random.uniform(0.8, 1.6), M_GROUND, 2, (1, 1, 0.18))
for py in range(0, 40, 2):
    for wx in (4.0, 13.5):
        cyl("wirePost", (wx, py, 0.6), 0.05, 1.2, M_DWOOD, verts=6)
        box("wire", wx - 0.01, wx + 0.01, py, py + 2, 0.4, 0.42, mat=M_METAL)
        box("wire", wx - 0.01, wx + 0.01, py, py + 2, 0.9, 0.92, mat=M_METAL)

# ------------------------------------------------------------ shells hitting the city (B1)
explosion((-8.0, 6.0, 0.2), 6, 1.2)
explosion((-15.0, 9.0, 0.2), 52, 1.3)
explosion((-3.0, 12.0, 0.2), 1020, 1.0)

# ------------------------------------------------------------ people
def dig_anim(arms, f0, f1, step=7):
    f, up = f0, True
    while f <= f1:
        key(arms[1], f, rotation_euler=(R(-110 if up else 10), 0, 0)); key(arms[0], f, rotation_euler=(R(-90 if up else 0), 0, 0))
        up = not up; f += step
    key(arms[1], f1 + step, rotation_euler=(0, 0, 0)); key(arms[0], f1 + step, rotation_euler=(0, 0, 0))

def tunneller(name, loc, rot, f_on, f_off, digs):
    m_, ml, ma = make_man(name, M_KHAKI, "cap")
    pick = cyl("pick", (0, -0.1, -0.65), 0.02, 0.7, M_WOOD); pick.parent = ma[1]
    head = box("pickHead", -0.25, 0.25, -0.13, -0.07, -1.02, -0.96, mat=M_METAL); head.parent = ma[1]
    key(m_, 1, location=loc, rotation_euler=(0, 0, rot), scale=(0, 0, 0))
    key(m_, f_on - 1, scale=(0, 0, 0)); key(m_, f_on, scale=(1, 1, 1))
    if f_off:
        key(m_, f_off, scale=(1, 1, 1)); key(m_, f_off + 1, scale=(0, 0, 0))
    for a, b in digs:
        dig_anim(ma, a, b)
    return m_

# digger in the shaft, then in the caves/tunnels
d0 = tunneller("ShaftDigger", (-11.7, 1.0, -0.2), R(0), 2, F(3.6), [(4, F(3.4))])
key(d0, 4, location=(-11.7, 1.0, -0.2)); key(d0, F(3.4), location=(-11.7, 1.0, -9.4))
tunneller("LinkDigger0", (-8.4, 1.0, -12.0), R(90), F(8.4), F(17.3), [(F(8.5), F(11.4))])
tunneller("LinkDigger1", (-1.9, 1.0, -12.0), R(90), F(9.3), F(17.3), [(F(9.4), F(12.2))])
tunneller("QuietDigger", (9.4, 1.0, -12.0), R(90), F(19.8), F(23.6), [(F(20.0), F(23.4))])
td = tunneller("LastDigger", (10.5, 1.0, -7.0), R(90), F(50.0), F(52.6), [(F(50.0), F(52.4))])
key(td, F(50.0), location=(10.4, 1.0, -7.0)); key(td, F(52.4), location=(13.6, 1.0, -7.0))

# enemy listener in his trench (B6/B7): crouched, ear to a rod pushed into the ground
ln, ll, la = make_man("Listener", M_GREYC, "helmet")
key(ln, 1, location=(16.2, 1.2, -1.9), rotation_euler=(0, R(25), R(-90)), scale=(0, 0, 0))
key(ln, F(17.3), scale=(0, 0, 0)); key(ln, F(17.4), scale=(1, 1, 0.8)); key(ln, F(23.6), scale=(1, 1, 0.8)); key(ln, F(23.7), scale=(0, 0, 0))
rod = cyl("listenRod", (15.6, 1.2, -1.95), 0.03, 1.4, M_METAL); show(rod, F(17.4), F(23.7))
def ring(f0, loc, rmax, dur=20):
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.03, location=loc, rotation=(R(90), 0, 0))
    o = bpy.context.active_object; o.data.materials.append(M_RING)
    key(o, 1, scale=(0, 0, 0)); key(o, f0 - 1, scale=(0, 0, 0)); key(o, f0, scale=(0.1, 0.1, 0.1))
    key(o, f0 + dur, scale=(rmax, rmax, rmax)); key(o, f0 + dur + 1, scale=(0, 0, 0))
for f0 in (F(17.6), F(18.4), F(19.2)):
    ring(f0, (9.5, -0.1, -11.0), 9.0, 18)
for f0 in (F(20.4), F(21.4), F(22.4)):
    ring(f0, (9.8, -0.1, -11.0), 2.5, 16)

# ------------------------------------------------------------ roof cracks + falling chalk (B4), timber (B5)
cx0, cx1 = -8.0, -3.5
for i in range(7):
    x = random.uniform(cx0 + 0.4, cx1 - 0.4)
    c = box("crack", -0.03, 0.03, -0.25, -0.2, -0.9, 0, loc=(x, 0, -8.0), mat=M_CRACK)
    c.rotation_euler = (0, R(random.uniform(-30, 30)), 0)
    key(c, 1, scale=(1, 1, 0.001)); key(c, F(11.7) + i * 3, scale=(1, 1, 0.001)); key(c, F(11.7) + i * 3 + 8, scale=(1, 1, random.uniform(1.0, 1.8)))
    key(c, F(15.0), scale=(1, 1, 1.4)); key(c, F(15.4), scale=(1, 1, 0.001))
for i in range(12):
    ch = ico("chunk", (random.uniform(cx0 + 0.5, cx1 - 0.5), 0.9, -8.2), random.uniform(0.08, 0.22), M_CHALK, 1)
    f0 = F(12.4) + i * 4
    key(ch, 1, scale=(0, 0, 0)); key(ch, f0, scale=(0, 0, 0), location=ch.location.copy()); key(ch, f0 + 1, scale=(1, 1, 1))
    key(ch, f0 + 12, location=(ch.location.x, 0.9, -13.3)); key(ch, F(17.0), scale=(1, 1, 1)); key(ch, F(17.2), scale=(0, 0, 0))
k = 0
for (x0, x1, z0, z1, t) in CAVES:
    for x in [x0 + 0.5 + j * 1.2 for j in range(int((x1 - x0 - 0.6) / 1.2) + 1)]:
        p = box("post", x - 0.09, x + 0.09, 0.3, 0.5, z0, z1 - 0.15, mat=M_WOOD); pop(p, F(14.8) + k); k += 1
    bm = box("beam", x0 + 0.3, x1 - 0.3, 0.25, 0.55, z1 - 0.35, z1 - 0.1, mat=M_WOOD); pop(bm, F(15.3) + k)
oc = outline_rect("caveOutline", 5.0, 5.6, (-5.75, -0.02, -11.0), (R(90), 0, 0), M_OUTLINE)
key(oc, 1, scale=(0, 0, 0)); key(oc, F(6.6), scale=(0, 0, 0)); key(oc, F(6.8), scale=(1.06, 1.06, 1)); key(oc, F(6.95), scale=(1, 1, 1))
key(oc, F(8.2), scale=(1, 1, 1)); key(oc, F(8.4), scale=(0, 0, 0))
key(oc, F(16.0), scale=(0, 0, 0)); key(oc, F(16.2), scale=(1.06, 1.06, 1)); key(oc, F(16.35), scale=(1, 1, 1)); key(oc, F(17.2), scale=(1, 1, 1)); key(oc, F(17.4), scale=(0, 0, 0))

# ------------------------------------------------------------ electric light (B8), water (B9), railway (B10)
cable = box("cable", -15.0, 9.0, 0.6, 0.65, -9.55, -9.5, mat=M_METAL); show(cable, F(23.8))
bulbE = M_BULB.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
for f, e in ((1, 0.0), (F(24.0), 0.0), (F(24.3), 25.0)):
    bulbE.default_value = e; bulbE.keyframe_insert("default_value", frame=f)
for i, (x0, x1, z0, z1, t) in enumerate(CAVES):
    cxm = (x0 + x1) / 2
    ico("bulb", (cxm, 0.8, z1 - 0.6), 0.08, M_BULB, 2)
    L_ = bpy.data.lights.new(f"caveL{i}", "POINT"); L_.color = (1, 0.8, 0.55); L_.shadow_soft_size = 0.2
    lo = link(bpy.data.objects.new(f"caveL{i}", L_)); lo.location = (cxm, 0.2, z1 - 0.9)
    f_on = F(24.2 + i * 0.6)
    for f, e in ((1, 0), (f_on, 0), (f_on + 2, 120)):
        L_.energy = e; L_.keyframe_insert("energy", frame=f)
lamp_at((-11.7, 0.9, -5.0), 6, 25)                    # lantern of the first digger
pipe = box("waterPipe", 0, 1, 0.5, 0.62, -13.75, -13.6, loc=(-15.0, 0, 0), mat=M_PIPE)
key(pipe, 1, scale=(0.001, 1, 1)); key(pipe, F(27.0), scale=(0.001, 1, 1)); key(pipe, F(28.2), scale=(24.0, 1, 1))
RIGHT = (0, R(-90), 0)
for kk in range(4):
    arrow(f"water{kk}", [((-14.0, -0.15, -13.3), RIGHT), ((-6.0, -0.15, -13.3), RIGHT), ((1.0, -0.15, -13.3), RIGHT), ((8.0, -0.15, -13.3), RIGHT)], F(27.6) + kk * 10, 14)
for side in (0.9, 1.5):
    rl = box("rail", 0, 1, side - 0.03, side + 0.03, -12.0, -11.92, loc=(-14.5, 0, 0), mat=M_METAL)
    key(rl, 1, scale=(0.001, 1, 1)); key(rl, F(29.2), scale=(0.001, 1, 1)); key(rl, F(29.6), scale=(23.0, 1, 1))
cart = box("cart", -0.5, 0.5, 0.75, 1.65, -11.92, -11.5, mat=M_DWOOD)
key(cart, 1, location=(0, 0, 0), scale=(0, 0, 0)); key(cart, F(29.4), location=(-13.5, 0, 0), scale=(0, 0, 0))
key(cart, F(29.6), scale=(1, 1, 1)); key(cart, F(32.0), location=(7.0, 0, 0))
fpvwall = box("fpvWall", -15.5, 10.0, -0.12, 0.02, -14.5, -8.0, mat=M_HOLE); show(fpvwall, F(29.6), F(32.0))
fpv = bpy.data.lights.new("fpvLight", "POINT"); fpv.color = (1, 0.8, 0.6); fpv.shadow_soft_size = 0.05
fpvo = link(bpy.data.objects.new("fpvLight", fpv))

# ------------------------------------------------------------ hospital (B11), cave names (B12)
k = 0
for row, z in enumerate((-14.0, -12.9)):
    for j in range(5):
        x = -1.1 + j * 0.95
        b = box("bed", x, x + 0.75, 0.6 + row * 0.0, 2.1, z, z + 0.35, mat=M_BED); pop(b, F(32.3) + k * 3); k += 1
NAMES = ["BLENHEIM", "NELSON", "WELLINGTON", "AUCKLAND"]
labels = []
for i, ((x0, x1, z0, z1, t), nm) in enumerate(zip(CAVES, NAMES)):
    lb = text(f"lbl{i}", nm, ((x0 + x1) / 2, -0.3, z1 + 1.3), 0.55, M_LABEL); pop(lb, F(37.0) + i * 16); labels.append(lb)
    key(lb, F(46.0), scale=(1, 1, 1)); key(lb, F(46.2), scale=(0, 0, 0))

# ------------------------------------------------------------ 24,000 soldiers walk in (B13) and rise out (B17)
SPOTS = []
for (x0, x1, z0, z1, t) in CAVES:
    for j in range(7):
        SPOTS.append((x0 + 0.4 + j * (x1 - x0 - 0.8) / 6, random.uniform(0.6, 2.0), z0))
for i, (x, y, z) in enumerate(SPOTS):
    s_, sl, sa = make_man(f"Soldier{i}", M_KHAKI, "helmet", pack=True)
    f0 = F(41.6) + i * 3
    key(s_, 1, location=(-11.7, 1.0, -0.2), rotation_euler=(0, 0, R(-90)), scale=(0, 0, 0))
    key(s_, f0 - 1, scale=(0, 0, 0)); key(s_, f0, location=(-11.7, 1.0, -0.2), scale=(1, 1, 1))
    key(s_, f0 + 18, location=(-11.7, 1.0, z if z > -9.4 else -12.0))
    key(s_, f0 + 40, location=(x, y, z))
    walk(sl, sa, f0 + 18, f0 + 40, step=6, swing=22)
    key(s_, F(53.0), scale=(1, 1, 1)); key(s_, F(53.1), scale=(0, 0, 0))
# risers at the exits
for i in range(16):
    s_, sl, sa = make_man(f"Riser{i}", M_KHAKI, "helmet", pack=True)
    ex = EXITS[i % 2]; f0 = F(55.2) + i * 5
    key(s_, 1, location=(ex, 1.0, -2.2), rotation_euler=(0, 0, R(-90)), scale=(0, 0, 0))
    key(s_, f0 - 1, scale=(0, 0, 0)); key(s_, f0, location=(ex, 1.0, -2.2), scale=(1, 1, 1))
    key(s_, f0 + 10, location=(ex, 1.0, 0.0)); key(s_, f0 + 45, location=(ex + 6.0, 1.0 + (i % 4) * 0.6, 0.0))
    walk(sl, sa, f0 + 10, f0 + 45, step=5, swing=38)
for ex in EXITS:
    explosion((ex, 1.0, 0.1), F(54.0) + (EXITS.index(ex)) * 14, 0.9)
# falling snow
for i in range(90):
    x, y = random.uniform(4, 22), random.uniform(-2, 6)
    s = ico("flake", (x, y, 7), 0.025, M_SNOW, 1)
    key(s, 1, scale=(0, 0, 0)); key(s, F(52.8) - 1, scale=(0, 0, 0)); key(s, F(52.8), scale=(1, 1, 1), location=(x, y, random.uniform(2, 9)))
    key(s, END, location=(x + random.uniform(-1, 1), y, -0.5))

# ------------------------------------------------------------ camera
cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 32; cam_d.sensor_fit = "VERTICAL"; cam_d.sensor_height = 36
cam_d.clip_start = 0.05; cam_d.clip_end = 500
rig = link(bpy.data.objects.new("CamRig", None))
cam = link(bpy.data.objects.new("Cam", cam_d)); cam.parent = rig; sc.camera = cam
fpvo.parent = cam
for f, e in ((1, 0), (F(29.5), 0), (F(29.7), 40), (F(31.9), 40), (F(32.0), 0)):
    fpv.energy = e; fpv.keyframe_insert("energy", frame=f)

def look(f, loc, target):
    dx, dy, dz = (target[i] - loc[i] for i in range(3))
    pitch = math.atan2(-dz, math.hypot(dx, dy)); yaw = math.atan2(-dx, dy)
    key(rig, f, location=loc, rotation_euler=(R(90) - pitch, 0, yaw))

look(1, (-10.5, -13.0, 2.0), (-10.5, 0, -1.6))                 # B1 shelled city + shaft
look(F(3.4), (-10.5, -12.5, 1.6), (-10.5, 0, -2.6))
look(F(4.0), (-6.0, -20.0, -5.0), (-6.0, 0, -11.0))            # B2 caves revealed
look(F(8.3), (-5.5, -21.0, -5.4), (-5.5, 0, -11.0))
look(F(8.6), (-3.0, -26.0, -4.6), (-3.0, 0, -11.2))            # B3 link tunnels, wide
look(F(11.5), (-3.0, -25.0, -5.0), (-3.0, 0, -11.2))
look(F(11.8), (-5.75, -9.5, -9.0), (-5.75, 0, -10.6))          # B4/B5 push-in to the cracking cave
look(F(17.2), (-5.75, -8.8, -9.2), (-5.75, 0, -10.8))
look(F(17.6), (13.0, -16.0, -2.0), (13.0, 0, -6.0))            # B6/B7 enemy listener above, quiet digging below
look(F(23.4), (12.5, -16.5, -2.2), (12.5, 0, -6.2))
look(F(23.8), (-3.0, -24.0, -6.0), (-3.0, 0, -11.2))           # B8/B9 lights + water
look(F(29.0), (-3.0, -23.0, -6.4), (-3.0, 0, -11.4))
look(F(29.6), (-12.5, 1.2, -11.0), (20.0, 1.2, -11.3))          # B10 FPV on the cart
look(F(31.9), (8.0, 1.2, -11.0), (30.0, 1.2, -11.3))
look(F(32.2), (1.0, -8.5, -10.5), (1.0, 0, -12.6))             # B11 hospital push-in
look(F(36.6), (1.0, -7.8, -10.8), (1.0, 0, -12.8))
look(F(37.0), (-3.0, -28.0, -5.0), (-3.0, 0, -10.0))           # B12 names, pull out
look(F(41.2), (-3.0, -31.0, -4.0), (-3.0, 0, -9.8))
look(F(46.0), (-3.0, -32.0, -3.6), (-3.0, 0, -9.6))            # B13 soldiers fill the caves
look(F(46.4), (-4.0, -9.0, 6.5), (-12.0, 12.0, 0.5))             # B14 empty street, ground level
look(F(48.4), (-4.5, -8.0, 6.0), (-12.0, 12.0, 0.5))
look(F(48.8), (12.5, -18.0, -1.2), (12.5, 0, -5.0))            # B15 last tunnel under the enemy line
look(F(52.6), (12.8, -17.0, -1.4), (12.8, 0, -5.0))
look(F(53.0), (9.5, -7.5, 0.6), (13.5, 1.5, 0.6))              # B16 snowy dawn, exits blow
look(F(56.6), (9.8, -7.2, 0.6), (13.8, 1.5, 0.6))
look(F(57.0), (13.0, -16.0, 2.2), (15.5, 2.0, -0.5))           # B17 soldiers rise and advance
look(F(61.2), (13.5, -16.5, 2.3), (16.5, 2.0, -0.5))
look(F(61.6), (0.0, -42.0, 2.0), (0.0, 0, -6.5))               # B18 final wide
look(END, (0.0, -44.0, 2.4), (0.0, 0, -6.5))

key(cam, 1, location=(0, 0, 0))
def shake(f0, f1, amp):
    key(cam, f0 - 1, location=(0, 0, 0))
    for f in range(f0, f1):
        a = amp * (1 - (f - f0) / (f1 - f0))
        key(cam, f, location=(random.uniform(-a, a), random.uniform(-a, a), 0))
    key(cam, f1, location=(0, 0, 0))
shake(7, 20, 0.12); shake(53, 66, 0.12); shake(F(12.4), F(13.4), 0.05); shake(F(54.0), F(55.0), 0.12)

sc.frame_set(1)
print("BUILD_OK")
