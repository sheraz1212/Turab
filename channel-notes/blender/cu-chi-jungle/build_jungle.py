# Jungle hideout hook — clone of the reference short's first ~24 s (beats + camera).
import bpy, bmesh, math, random, os

random.seed(11)
W = r"C:\Users\Turab\AppData\Local\Temp\claude\3649cd6e6add4177\38384067-f947-44f5-9298-d100460bea54\scratchpad\jungle"
FPS, END = 24, 1524
R = math.radians

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, END
sc.render.resolution_x, sc.render.resolution_y = 720, 1280
for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        sc.render.engine = eng; break
    except TypeError:
        pass
try:
    sc.eevee.taa_render_samples = 16
except Exception:
    pass
sc.render.image_settings.file_format = "PNG"
sc.render.filepath = os.path.join(W, "frames", "f_")
try:
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
except Exception:
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

def soil_mat(name, bright=1.0):
    """Red laterite cross-section with a ragged brown topsoil band and grassy top."""
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
    body, body2, top = (0.36, 0.075, 0.03), (0.40, 0.09, 0.035), (0.26, 0.12, 0.05)
    grass = (0.10, 0.10, 0.03)
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

# ------------------------------------------------------------ materials
M_SOIL = soil_mat("Soil", 1.0)
M_HOLE = soil_mat("HoleWall", 0.5)
M_CLAY = mat("Clay", (0.36, 0.08, 0.03), 1.0, noise=0.25)
M_HARD = mat("HardClay", (0.48, 0.15, 0.06), 0.95, noise=0.15)
M_GRASS = mat("Grass", (0.09, 0.10, 0.03), 1.0, noise=0.5)
M_BARK = mat("Bark", (0.07, 0.06, 0.05), 0.9, noise=0.4)
M_LEAF = mat("Leaf", (0.03, 0.075, 0.02), 0.8, noise=0.45)
M_LEAF2 = mat("Leaf2", (0.06, 0.11, 0.025), 0.8, noise=0.4)
M_BAMBOO = mat("Bamboo", (0.16, 0.24, 0.05), 0.6, noise=0.2)
M_CLOUD = mat("Cloud", (0.9, 0.92, 0.95), 1.0, (1, 1, 1), 0.4)
M_WOOD = mat("Wood", (0.17, 0.09, 0.04), 0.8, noise=0.3)
M_DLEAF = mat("DryLeaf", (0.12, 0.10, 0.02), 0.9, noise=0.4)
M_OLIVE = mat("Olive", (0.10, 0.11, 0.05), 0.85)
M_PACK = mat("Pack", (0.17, 0.16, 0.10), 0.85)
M_BLACK = mat("BlackCloth", (0.02, 0.02, 0.025), 0.9)
M_STRAW = mat("Straw", (0.45, 0.36, 0.18), 0.9)
M_SKIN = mat("Skin", (0.42, 0.25, 0.15), 0.6)
M_BOOT = mat("Boot", (0.025, 0.02, 0.015), 0.6)
M_WATER = mat("Water", (0.03, 0.13, 0.11), 0.05)
M_BED = mat("Bed", (0.55, 0.52, 0.42), 0.9)
M_ARROW = mat("Arrow", (1, 1, 1), 0.5, (1, 1, 1), 0.8)
M_CAN = mat("Canister", (0.12, 0.14, 0.08), 0.6)
def alpha_mat(name, col, a):
    m = mat(name, col, 1.0)
    m.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = a
    try:
        m.blend_method = "BLEND"; m.surface_render_method = "BLENDED"
    except Exception:
        pass
    return m
M_GAS = alpha_mat("Gas", (0.35, 0.4, 0.28), 0.5)
M_MIST = alpha_mat("Mist", (0.85, 0.87, 0.9), 0.3)
M_METAL = mat("Metal", (0.08, 0.08, 0.08), 0.4)
M_FIRE = mat("Fire", (1, 0.15, 0.01), 0.5, (1.0, 0.16, 0.01), 1.6)
M_SMOKE = mat("Smoke", (0.22, 0.21, 0.2), 1.0)
M_SMOKE.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.55
try:
    M_SMOKE.blend_method = "BLEND"; M_SMOKE.surface_render_method = "BLENDED"
except Exception:
    pass
M_OUTLINE = mat("Outline", (1, 0.45, 0.15), 0.5, (1.0, 0.42, 0.12), 0.9)
M_LAMP = mat("LampGlow", (1, 0.7, 0.3), 0.5, (1.0, 0.6, 0.25), 30)

# ------------------------------------------------------------ world & lights
wd = bpy.data.worlds.new("Sky"); sc.world = wd; wd.use_nodes = True
bg = wd.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.45, 0.65, 0.95, 1)
sun = bpy.data.lights.new("Sun", "SUN"); sun.angle = R(4)
so = link(bpy.data.objects.new("Sun", sun)); so.rotation_euler = (R(50), 0, R(-30))
moon = bpy.data.lights.new("Moon", "SUN"); moon.color = (0.5, 0.6, 1.0); moon.angle = R(2)
mo = link(bpy.data.objects.new("Moon", moon)); mo.rotation_euler = (R(45), 0, R(25))
NIGHT0, NIGHT1 = 425, 452
for f, se, ws, me_ in ((1, 3.2, 0.8, 0.0), (NIGHT0, 3.2, 0.8, 0.0), (NIGHT1, 0.3, 0.14, 1.8)):
    sun.energy = se; sun.keyframe_insert("energy", frame=f)
    moon.energy = me_; moon.keyframe_insert("energy", frame=f)
    bg.inputs["Strength"].default_value = ws; bg.inputs["Strength"].keyframe_insert("default_value", frame=f)
for f, se, ws, me_ in ((552, 0.3, 0.14, 1.8), (578, 3.2, 0.8, 0.0)):
    sun.energy = se; sun.keyframe_insert("energy", frame=f)
    moon.energy = me_; moon.keyframe_insert("energy", frame=f)
    bg.inputs["Strength"].default_value = ws; bg.inputs["Strength"].keyframe_insert("default_value", frame=f)
for f, c in ((NIGHT0, (0.45, 0.65, 0.95, 1)), (NIGHT1, (0.05, 0.08, 0.2, 1)),
             (552, (0.05, 0.08, 0.2, 1)), (578, (0.45, 0.65, 0.95, 1))):
    bg.inputs["Color"].default_value = c; bg.inputs["Color"].keyframe_insert("default_value", frame=f)

# ------------------------------------------------------------ ground block (cross-section)
cut = bpy.data.collections.new("Cutters"); sc.collection.children.link(cut)
ground = box("Ground", -70, 70, 0, 40, -60, 0, mat=M_SOIL)
ground.data.materials.append(M_HOLE)
bm_ = ground.modifiers.new("Dig", "BOOLEAN")
bm_.operation = "DIFFERENCE"; bm_.operand_type = "COLLECTION"; bm_.collection = cut; bm_.solver = "EXACT"
try:
    bm_.material_mode = "TRANSFER"
except Exception:
    pass
bpy.ops.mesh.primitive_plane_add(size=500, location=(0, 289.9, -0.01))
bpy.context.active_object.data.materials.append(M_GRASS)

# ------------------------------------------------------------ jungle
def tree(x, y, h, r, roots=True):
    cyl("trunk", (x, y, h / 2), 0.32 * r, h, M_BARK, verts=10, r2=0.18 * r)
    if roots:
        for i in range(random.randint(2, 5)):
            a = random.uniform(0, 6.28); d = random.uniform(0.35, 0.9) * r
            rx, ry = x + math.cos(a) * d, y + math.sin(a) * d
            hh = random.uniform(0.35, 0.7) * h
            o = cyl("root", ((x + rx) / 2, (y + ry) / 2, hh / 2), 0.08 * r, hh * 1.05, M_BARK, verts=6)
            o.rotation_euler = (math.atan2(-(ry - y), hh) * 0.9, math.atan2(rx - x, hh) * 0.9, 0)
    for i in range(random.randint(5, 8)):
        c = ico("canopy", (x + random.uniform(-1.6, 1.6) * r, y + random.uniform(-1.2, 1.2) * r,
                           h + random.uniform(-0.4, 1.0) * r), random.uniform(1.0, 1.6) * r,
                random.choice((M_LEAF, M_LEAF2)), 3, (1, 1, random.uniform(0.55, 0.8)))
        dm = c.modifiers.new("lumps", "DISPLACE"); dm.texture = LEAF_TEX; dm.strength = 0.5 * r

LEAF_TEX = bpy.data.textures.new("leafy", "CLOUDS"); LEAF_TEX.noise_scale = 0.45

placed = [(-2.6, 3.4, 5.5, 1.0), (2.9, 6.0, 6.0, 1.1), (-6.0, 5.0, 6.5, 1.2), (6.5, 4.0, 5.8, 1.1),
          (-0.6, 10.0, 6.8, 1.2), (4.0, 12.0, 6.5, 1.2), (-4.5, 13.0, 6.8, 1.2), (8.5, 9.0, 6.0, 1.1),
          (-9.0, 9.0, 6.4, 1.2), (1.5, 17.0, 7.0, 1.3), (-7.5, 19.0, 7.0, 1.3), (7.0, 18.0, 7.0, 1.3)]
for x, y, h, r in placed:
    tree(x, y, h, r)
for i in range(26):
    tree(random.uniform(-22, 22), random.uniform(22, 40), random.uniform(6, 8), random.uniform(1.2, 1.6), roots=False)
for i in range(45):  # far tree line
    ico("far", (random.uniform(-60, 60), random.uniform(45, 70), random.uniform(3, 6)), random.uniform(3, 5),
        random.choice((M_LEAF, M_LEAF2)), 2, (1, 1, 0.7))
for cx, cy in ((2.9, 3.7), (-4.2, 3.8), (5.5, 7.5)):  # bamboo clumps
    for i in range(9):
        h = random.uniform(5, 8)
        o = cyl("bamboo", (cx + random.uniform(-0.4, 0.4), cy + random.uniform(-0.3, 0.3), h / 2), 0.045, h, M_BAMBOO, verts=6)
        o.rotation_euler = (random.uniform(-0.06, 0.06), random.uniform(-0.08, 0.08), 0)
for i in range(40):  # bushes and leaf litter
    x, y = random.uniform(-9, 9), random.uniform(0.6, 18)
    if abs(x) < 2.2 and y < 3.5:
        continue
    ico("bush", (x, y, 0.05), random.uniform(0.15, 0.45), random.choice((M_LEAF2, M_DLEAF)), 2, (1, 1, 0.45))
for i in range(12):  # clouds
    ico("cloud", (random.uniform(-50, 50), random.uniform(90, 120), random.uniform(18, 30)), random.uniform(5, 9),
        M_CLOUD, 2, (1.6, 1, 0.5))

# ------------------------------------------------------------ hole cutters
shaft = box("ShaftCut", -0.6, 0.6, -1, 1.6, -1, 0, loc=(0, 0, 0.3), mat=M_HOLE, coll=cut)
tunnel = box("TunnelCut", 0, 1, -1, 1.6, -0.55, 0.55, loc=(0.0, 0, -2.65), mat=M_HOLE, coll=cut)
for c in (shaft, tunnel):
    c.display_type = "WIRE"; c.hide_render = True
key(shaft, 1, scale=(1, 1, 0.001)); key(shaft, 10, scale=(1, 1, 0.08)); key(shaft, 56, scale=(1, 1, 3.5))
key(tunnel, 1, scale=(0.001, 1, 1)); key(tunnel, 392, scale=(0.001, 1, 1)); key(tunnel, 445, scale=(4.2, 1, 1))

pile = ico("DirtPile", (1.45, 0.9, 0.0), 1.0, M_CLAY, 3)
key(pile, 1, scale=(0, 0, 0)); key(pile, 14, scale=(0.15, 0.12, 0.05)); key(pile, 56, scale=(0.75, 0.55, 0.32))
key(pile, 470, scale=(0.75, 0.55, 0.32)); key(pile, 540, scale=(0.08, 0.06, 0.02))

# ------------------------------------------------------------ figures
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

# digger (hideout owner)
dig, dlegs, darms = make_man("Digger", M_BLACK, "cone")
BOT = -3.2
key(dig, 1, location=(0, 0.8, BOT), rotation_euler=(0, 0, R(90)), scale=(0, 0, 0))
key(dig, 26, scale=(0, 0, 0)); key(dig, 32, scale=(1, 1, 1))
key(dig, 160, scale=(1, 1, 1)); key(dig, 170, scale=(1, 1, 0.78))
key(dig, 270, scale=(1, 1, 0.78)); key(dig, 280, scale=(1, 1, 1))
key(dig, 395, location=(0.1, 0.8, BOT), scale=(1, 1, 1)); key(dig, 402, scale=(1.05, 1.05, 0.6))
key(dig, 445, location=(3.6, 0.8, BOT)); key(dig, 452, scale=(1.05, 1.05, 0.6)); key(dig, 458, scale=(0, 0, 0))
def dig_anim(f0, f1, step=7):
    f, up = f0, True
    while f <= f1:
        key(darms[1], f, rotation_euler=(R(-80 if up else 20), 0, 0)); key(darms[0], f, rotation_euler=(R(-60 if up else 10), 0, 0))
        up = not up; f += step
    key(darms[1], f1 + step, rotation_euler=(0, 0, 0)); key(darms[0], f1 + step, rotation_euler=(0, 0, 0))
shov = cyl("shovel", (0, -0.1, -0.7), 0.022, 0.7, M_WOOD); shov.parent = darms[1]
blade = box("blade", -0.1, 0.1, -0.02, 0.02, -0.25, 0, loc=(0, -0.1, -1.05), mat=M_METAL); blade.parent = darms[1]
key(darms[0], 1, rotation_euler=(0, 0, 0)); key(darms[1], 1, rotation_euler=(0, 0, 0))
dig_anim(32, 150); dig_anim(283, 372); dig_anim(402, 440, 6)

# patrol A: walks past, parallel to the cross-section
for i, (y, d) in enumerate(((2.0, 0), (2.9, 14))):
    s, sl, sa = make_man(f"SoldierA{i}", M_OLIVE, "helmet", pack=True)
    key(s, 1, location=(-7, y, 0), rotation_euler=(0, 0, R(90)))
    key(s, 58 + d, location=(-7, y, 0)); key(s, 168 + d, location=(7, y, 0))
    walk(sl, sa, 58 + d, 168 + d)
# patrol B: walks away from camera, straight over the covered hole
for i, (x, d) in enumerate(((0.05, 0), (0.75, 10))):
    s, sl, sa = make_man(f"SoldierB{i}", M_OLIVE, "helmet", pack=True)
    key(s, 1, location=(x, 0.15, 0.06), rotation_euler=(0, 0, R(180)), scale=(0, 0, 0))
    key(s, 176 + d, location=(x, 0.15, 0.06), scale=(0, 0, 0)); key(s, 178 + d, scale=(1, 1, 1))
    key(s, 262 + d, location=(x, 8.5, 0.0))
    walk(sl, sa, 178 + d, 262 + d)
# night carrier
car, cl, ca = make_man("Carrier", M_BLACK, "cone", basket=True)
key(car, 1, location=(0.1, 0.8, -0.6), rotation_euler=(0, 0, R(-60)), scale=(0, 0, 0))
key(car, 455, location=(0.1, 0.8, -0.6), scale=(0, 0, 0)); key(car, 458, scale=(1, 1, 1))
key(car, 470, location=(0.3, 0.9, 0.0)); key(car, 545, location=(4.2, 4.6, 0.0))
walk(cl, ca, 470, 545, arm_swing=False)

# ------------------------------------------------------------ lid + leaves + outline
lid = link(bpy.data.objects.new("LidRig", None))
for i in range(5):
    pl = box("plank", -0.72 + i * 0.29, -0.45 + i * 0.29, 0.0, 1.75, 0, 0.08, mat=M_WOOD); pl.parent = lid
key(lid, 1, location=(0, 0, 3.0), scale=(0, 0, 0)); key(lid, 156, location=(0, 0, 3.0), scale=(0, 0, 0))
key(lid, 160, scale=(1, 1, 1)); key(lid, 170, location=(0, 0, 0.0)); key(lid, 173, location=(0, 0, 0.08))
key(lid, 176, location=(0, 0, 0.0))
for i in range(22):
    o = ico(f"leaf{i}", (random.uniform(-0.75, 0.75), random.uniform(0.05, 1.7), 0.1), random.uniform(0.12, 0.22),
            random.choice((M_LEAF2, M_DLEAF, M_LEAF)), 1, (1, 1, 0.25))
    o.rotation_euler = (0, 0, random.uniform(0, 6.3))
    pop(o, 174 + i, (1, 1, 0.25))
ol = outline_rect("LidOutline", 1.7, 1.95, (0, 0.88, 0.16), (0, 0, 0), M_OUTLINE)
key(ol, 1, scale=(0, 0, 0)); key(ol, 196, scale=(0, 0, 0)); key(ol, 201, scale=(1.08, 1.08, 1))
key(ol, 204, scale=(1, 1, 1)); key(ol, 226, scale=(1, 1, 1)); key(ol, 231, scale=(0, 0, 0))

# ------------------------------------------------------------ explosions
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

explosion((-2.0, 7.0, 0.2), 6, 1.4)
explosion((2.6, 4.0, 0.2), 250, 1.5)

# ------------------------------------------------------------ hardened clay walls + outline
for nm, xa, xb, ya, yb, d in (("HardL", -0.6, -0.52, 0.0, 1.6, 3.2), ("HardB", -0.6, 0.6, 1.52, 1.6, 3.2),
                              ("HardR", 0.52, 0.6, 0.0, 1.6, 2.05)):
    o = box(nm, xa, xb, ya, yb, -1, 0, mat=M_HARD)
    key(o, 1, scale=(1, 1, 0)); key(o, 300, scale=(1, 1, 0)); key(o, 340, scale=(1, 1, d))
ol2 = outline_rect("ShaftOutline", 1.3, 3.3, (0, -0.02, -1.6), (R(90), 0, 0), M_OUTLINE)
key(ol2, 1, scale=(0, 0, 0)); key(ol2, 342, scale=(0, 0, 0)); key(ol2, 347, scale=(1.06, 1.06, 1))
key(ol2, 350, scale=(1, 1, 1)); key(ol2, 372, scale=(1, 1, 1)); key(ol2, 377, scale=(0, 0, 0))

lg = ico("lamp", (2.2, 0.9, -2.25), 0.07, M_LAMP, 2)
pop(lg, 430, (1, 1, 1))
ll = bpy.data.lights.new("lampL", "POINT"); ll.color = (1, 0.6, 0.25); ll.shadow_soft_size = 0.05
llo = link(bpy.data.objects.new("lampL", ll)); llo.location = (2.2, 0.6, -2.35)
for ff, e in ((1, 0), (430, 0), (435, 60)):
    ll.energy = e; ll.keyframe_insert("energy", frame=ff)

# ------------------------------------------------------------ camera (beats from the reference)
cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 32; cam_d.sensor_fit = "VERTICAL"; cam_d.sensor_height = 36
cam_d.clip_end = 500
rig = link(bpy.data.objects.new("CamRig", None))
cam = link(bpy.data.objects.new("Cam", cam_d)); cam.parent = rig; sc.camera = cam

def look(f, loc, target):
    dx, dy, dz = (target[i] - loc[i] for i in range(3))
    pitch = math.atan2(-dz, math.hypot(dx, dy)); yaw = math.atan2(-dx, dy)
    key(rig, f, location=loc, rotation_euler=(R(90) - pitch, 0, yaw))

SIDE = (0, 0, -0.35)
look(1, (0, -10.2, 1.3), SIDE)                       # 0-6s  side, cut line mid-frame
look(70, (0, -9.6, 1.3), SIDE)
look(140, (0.2, -9.2, 1.35), (0.2, 0, -0.35))
look(172, (0.35, -3.0, 3.4), (0.35, 3.2, 0.1))       # 6-10s high, behind the patrol
look(236, (0.35, -2.7, 3.3), (0.35, 3.4, 0.1))
look(262, (-1.2, -9.4, 1.1), (0.4, 2.0, -0.4))       # 10-11s lower 3/4 for the blast
look(282, (-1.0, -9.0, 1.0), (0.4, 2.0, -0.4))
look(318, (0, -5.0, 0.35), (0, 0.4, -1.75))          # 12-15s push-in on the shaft
look(380, (0, -4.8, 0.3), (0, 0.4, -1.75))
look(410, (1.6, -6.2, -0.3), (1.6, 0, -2.35))        # 16-17s pan down / sideways
look(430, (1.8, -6.0, -0.35), (1.8, 0, -2.35))
look(462, (-4.6, -4.4, 0.9), (1.2, 2.2, -0.6))       # 18s+ night, low 3/4 view
look(566, (-4.2, -4.0, 0.85), (1.6, 2.4, -0.5))

key(cam, 1, location=(0, 0, 0))
def shake(f0, f1, amp):
    key(cam, f0 - 1, location=(0, 0, 0))
    for f in range(f0, f1):
        a = amp * (1 - (f - f0) / (f1 - f0))
        key(cam, f, location=(random.uniform(-a, a), random.uniform(-a, a), 0))
    key(cam, f1, location=(0, 0, 0))
shake(7, 20, 0.15); shake(251, 266, 0.18)

# ============================================================ PART 2 (24 s -> 63 s)
def gcut(name, x0, x1, z0, z1, f0, f1, mode="x", y0=-1.0, y1=1.6):
    """Cutter that grows over f0..f1. mode x: grows right, xl: grows left, z: grows down."""
    if mode == "x":
        o = box(name, 0, 1, y0, y1, z0, z1, loc=(x0, 0, 0), mat=M_HOLE, coll=cut); full = (x1 - x0, 1, 1); zero = (0.001, 1, 1)
    elif mode == "xl":
        o = box(name, -1, 0, y0, y1, z0, z1, loc=(x1, 0, 0), mat=M_HOLE, coll=cut); full = (x1 - x0, 1, 1); zero = (0.001, 1, 1)
    else:
        o = box(name, x0, x1, y0, y1, -1, 0, loc=(0, 0, z1), mat=M_HOLE, coll=cut); full = (1, 1, z1 - z0); zero = (1, 1, 0.001)
    o.display_type = "WIRE"; o.hide_render = True
    key(o, 1, scale=zero); key(o, f0, scale=zero); key(o, f1, scale=full)
    return o

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

DOWN, LEFT, RIGHT, UP = (0, 0, 0), (0, R(90), 0), (0, R(-90), 0), (R(180), 0, 0)

# digger comes back in the tunnel
key(dig, 584, location=(3.0, 0.8, BOT), scale=(0, 0, 0)); key(dig, 588, scale=(1.05, 1.05, 0.6))
key(dig, 700, location=(2.6, 0.8, BOT), scale=(1.05, 1.05, 0.6))
key(dig, 730, location=(-2.2, 0.8, BOT)); key(dig, 736, scale=(1, 1, 0.66))
key(dig, 900, scale=(1, 1, 0.66)); key(dig, 904, scale=(0, 0, 0))

# ---- S7 air holes + termite mounds (24-30 s)
for i, x in enumerate((1.5, 3.3)):
    gcut(f"vent{i}", x - 0.05, x + 0.05, -2.15, 0.3, 618 + i * 18, 646 + i * 18, "z")
    m = cyl(f"mound{i}", (x, 0.55, 0.5), 0.42, 1.1, M_CLAY, verts=14, r2=0.06)
    pop(m, 655 + i * 8)
    for k in range(2):
        arrow(f"air{i}{k}", [((x, -0.15, 1.3), DOWN), ((x, -0.15, 0.2), DOWN), ((x, -0.15, -1.9), DOWN)], 680 + k * 14 + i * 6, 14)

# ---- S8 kitchen smoke -> long tunnel -> morning mist (30-37 s)
gcut("kitchenLink", -1.3, -0.55, -3.2, -2.3, 700, 712, "xl")
gcut("kitchen", -3.9, -1.25, -3.2, -2.0, 708, 728, "xl")
stove = box("stove", -3.35, -2.8, 0.55, 1.05, -3.2, -2.85, mat=M_BOOT); pop(stove, 726)
pot = cyl("pot", (-3.07, 0.8, -2.75), 0.17, 0.2, M_METAL, verts=14); pop(pot, 730)
fire = ico("stovefire", (-3.07, 0.6, -2.95), 0.1, M_FIRE, 2); pop(fire, 728)
lamp_at((-2.0, 0.9, -2.2), 728, 20)
gcut("chim1", -3.15, -2.97, -2.05, -1.15, 738, 748, "z")
gcut("smokeT", -9.6, -2.97, -1.32, -1.12, 746, 772, "xl")
gcut("chim2", -9.6, -9.4, -1.3, 0.3, 770, 780, "z")
gcut("duct", -9.6, -2.97, -1.55, -0.9, 746, 747, "xl", y0=0.3, y1=1.4)   # closed duct for the FPV shot
for i in range(14):
    f0 = 742 + i * 4
    s = ico(f"ksmoke{i}", (-3.06, 0.8, -2.6), 1.0, M_SMOKE, 2)
    key(s, 1, scale=(0, 0, 0)); key(s, f0 - 1, location=(-3.06, 0.8, -2.6), scale=(0, 0, 0))
    key(s, f0, scale=(0.08, 0.08, 0.08)); key(s, f0 + 10, location=(-3.06, 0.8, -1.22))
    key(s, f0 + 60, location=(-9.5, 0.8, -1.22), scale=(0.08, 0.08, 0.08))
    key(s, f0 + 72, location=(-9.5, 0.8, 0.25))
    key(s, f0 + 110, location=(-9.5 + random.uniform(-3, 3), random.uniform(1.0, 7), 0.3),
        scale=(random.uniform(1.0, 1.6), random.uniform(1.0, 1.6), 0.22))
    key(s, 905, scale=(1.2, 1.2, 0.22)); key(s, 915, scale=(0, 0, 0))
for i in range(10):
    m = ico(f"mist{i}", (-9.5 + random.uniform(-5, 5), random.uniform(2, 12), 0.35), 1.0, M_MIST, 2)
    sc_ = (random.uniform(1.5, 2.6), random.uniform(1.5, 2.6), 0.25)
    key(m, 1, scale=(0, 0, 0)); key(m, 815 + i * 3, scale=(0, 0, 0)); key(m, 850 + i * 3, scale=sc_)
    key(m, 905, scale=sc_); key(m, 915, scale=(0, 0, 0))
fpv = bpy.data.lights.new("fpvLight", "POINT"); fpv.color = (1, 0.7, 0.45); fpv.shadow_soft_size = 0.05
fpvo = link(bpy.data.objects.new("fpvLight", fpv)); fpvo.parent = cam
for ff, e in ((1, 0), (762, 0), (766, 8), (815, 8), (818, 0)):
    fpv.energy = e; fpv.keyframe_insert("energy", frame=ff)

# ---- second entrance, gas attack, water U-bend (37-44 s)
key(tunnel, 446, scale=(4.2, 1, 1))
gcut("segA", 4.15, 5.0, -3.2, -2.1, 880, 890, "x")
gcut("segB", 5.8, 7.0, -3.2, -2.1, 880, 890, "x")
gcut("shaft2", 6.7, 7.3, -2.2, 0.3, 880, 892, "z")
gcut("pit", 4.95, 5.85, -3.95, -2.1, 975, 1000, "z")
hang = box("hangWall", 5.22, 5.58, 0.0, 1.6, -1, 0, loc=(0, 0, -2.1), mat=M_CLAY)
key(hang, 1, scale=(1, 1, 0.001)); key(hang, 998, scale=(1, 1, 0.001)); key(hang, 1008, scale=(1, 1, 1.38))
water = box("water", 4.96, 5.84, 0.0, 1.6, 0, 1, loc=(0, 0, -3.95), mat=M_WATER)
key(water, 1, scale=(1, 1, 0.001)); key(water, 1005, scale=(1, 1, 0.001)); key(water, 1025, scale=(1, 1, 0.72))
enemy, el, ea = make_man("GasSoldier", M_OLIVE, "helmet", pack=True)
key(enemy, 1, location=(7.75, 0.9, 0), rotation_euler=(0, 0, R(-90)), scale=(0, 0, 0))
key(enemy, 886, scale=(0, 0, 0)); key(enemy, 890, scale=(1, 1, 1)); key(enemy, 1070, scale=(1, 1, 1)); key(enemy, 1074, scale=(0, 0, 0))
for p in ea:
    key(p, 1, rotation_euler=(R(-60), 0, 0))
can = box("canister", 7.95, 8.35, 0.6, 1.0, 0, 0.55, mat=M_CAN); pop(can, 890, hide_after=1070)
hose = cyl("hose", (7.25, 0.9, 0.35), 0.035, 0.6, M_BOOT, rot=(0, R(70), 0)); pop(hose, 892, hide_after=1070)
for i in range(12):
    f0 = 905 + i * 3
    g = ico(f"gas{i}", (7.0, 0.8, 0.2), 0.26, M_GAS, 2)
    stop_x = 5.95 + random.uniform(0, 0.8)
    key(g, 1, scale=(0, 0, 0)); key(g, f0 - 1, location=(7.0, 0.8, 0.2), scale=(0, 0, 0)); key(g, f0, scale=(1, 1, 1))
    key(g, f0 + 18, location=(7.0, 0.8, -2.6)); key(g, f0 + 40, location=(stop_x, 0.8, -2.6 + random.uniform(-0.3, 0.3)))
    key(g, 1028, location=(stop_x - 0.25, 0.8, -2.55)); key(g, 1036, location=(stop_x - 0.15, 0.8, -2.6))
    key(g, 1075, scale=(1, 1, 1)); key(g, 1085, scale=(0, 0, 0))
for k in range(3):
    arrow(f"gasArrow{k}", [((7.0, -0.15, 0.9), DOWN), ((7.0, -0.15, -2.6), LEFT), ((5.9, -0.15, -2.6), LEFT)], 910 + k * 10, 16)
olw = outline_rect("TrapOutline", 0.95, 1.9, (5.4, -0.02, -3.0), (R(90), 0, 0), M_OUTLINE)
key(olw, 1, scale=(0, 0, 0)); key(olw, 1038, scale=(0, 0, 0)); key(olw, 1043, scale=(1.08, 1.08, 1))
key(olw, 1046, scale=(1, 1, 1)); key(olw, 1066, scale=(1, 1, 1)); key(olw, 1070, scale=(0, 0, 0))

# ---- S11 levels, rooms (45-50 s)
gcut("conn1", -0.3, 0.3, -5.6, -3.1, 1112, 1122, "z")
gcut("level2", -8.0, 9.5, -5.6, -4.7, 1112, 1135, "x")
gcut("conn2", 8.8, 9.4, -4.8, -2.0, 1125, 1135, "z")
gcut("kitchen2", 8.6, 11.2, -3.2, -2.0, 1140, 1152, "x")
for x in (9.6, 10.4):
    p = cyl("pot2", (x, 0.8, -3.05), 0.16, 0.22, M_METAL, verts=12); pop(p, 1152)
lamp_at((10.0, 0.9, -2.2), 1150, 18)
gcut("hospital", 1.8, 5.2, -6.9, -5.55, 1166, 1180, "x")
for i, x in enumerate((2.3, 3.3, 4.3)):
    b = box(f"hbed{i}", x - 0.35, x + 0.35, 0.4, 1.2, -6.9, -6.55, mat=M_BED); pop(b, 1180 + i * 3)
lamp_at((3.5, 0.9, -5.75), 1180, 18)
gcut("bedrooms", -6.6, -3.0, -6.9, -5.55, 1190, 1203, "x")
for i, x in enumerate((-6.0, -5.0, -4.0)):
    hm = cyl(f"hammock{i}", (x + 0.35, 0.8, -6.35), 0.03, 0.8, M_STRAW, verts=6, rot=(0, R(90), 0)); pop(hm, 1203 + i * 3)
lamp_at((-4.8, 0.9, -5.75), 1203, 18)
lamp_at((-6.5, 0.9, -4.85), 1130, 12); lamp_at((6.0, 0.9, -4.85), 1132, 12)

# ---- S12 network across the whole jungle (51-53 s)
for i in range(34):
    x0 = random.uniform(-60, 55); ln = random.uniform(3, 11)
    if -10 < x0 < 12:
        x0 += 24 if x0 > 0 else -24
    z = random.uniform(-8.5, -1.6); f0 = 1222 + i
    gcut(f"net{i}", x0, x0 + ln, z - 0.35, z + 0.35, f0, f0 + 10, "x")
    if random.random() < 0.6:
        gcut(f"netv{i}", x0 + ln * 0.5, x0 + ln * 0.5 + 0.4, z - 0.3, min(0.3, z + random.uniform(1.5, 4)), f0 + 4, f0 + 12, "z")
for i in range(40):  # extra forest so the wide shot is jungle edge to edge
    x = random.choice((-1, 1)) * random.uniform(14, 62)
    tree(x, random.uniform(3, 38), random.uniform(6, 8), random.uniform(1.1, 1.5), roots=False)

# ---- S13 soldier gets stuck in the entrance (54-58 s)
big, bl, ba = make_man("StuckSoldier", M_OLIVE, "helmet", pack=True)
key(big, 1, location=(7.0, 0.8, 0.0), rotation_euler=(0, 0, 0), scale=(0, 0, 0))
key(big, 1296, scale=(0, 0, 0)); key(big, 1299, scale=(1.3, 1.3, 1.3))
key(big, 1316, location=(7.0, 0.8, 0.0)); key(big, 1324, location=(7.0, 0.8, 0.45)); key(big, 1332, location=(7.0, 0.8, -1.05))
for f in range(1336, 1524, 5):
    key(big, f, location=(7.0 + random.uniform(-0.03, 0.03), 0.8, -1.05 + random.uniform(-0.05, 0.08)))
    for p in ba:
        key(p, f, rotation_euler=(R(random.uniform(-170, -40)), R(random.uniform(-25, 25)), 0))

# ---- S14 villagers walk on the surface (59-63 s)
for i, (y, d) in enumerate(((2.4, 0), (3.1, 10))):
    v, vl, va = make_man(f"Villager{i}", M_BLACK, "cone")
    key(v, 1, location=(-4.0, y, 0), rotation_euler=(0, 0, R(90)), scale=(0, 0, 0))
    key(v, 1418 + d, location=(-4.0, y, 0), scale=(0, 0, 0)); key(v, 1420 + d, scale=(1, 1, 1))
    key(v, 1524, location=(3.0, y, 0))
    walk(vl, va, 1420 + d, 1524)

# ---- camera, part 2
look(590, (2.4, -7.4, 0.7), (2.4, 0, -1.2))            # vents + mounds
look(712, (2.2, -7.6, 0.6), (2.2, 0, -1.2))
look(735, (-2.6, -6.6, -0.2), (-2.6, 0, -2.3))         # kitchen
look(760, (-2.8, -6.4, -0.3), (-2.8, 0, -2.0))
look(766, (-3.0, 0.85, -1.22), (-12, 0.85, -1.22))      # FPV inside the smoke duct (chasing the smoke)
look(812, (-7.6, 0.85, -1.22), (-12, 0.85, -1.22))
look(820, (-9.5, -4.8, 0.55), (-9.5, 5.0, 0.4))         # ground level, morning mist
look(890, (-9.3, -4.4, 0.55), (-9.3, 5.0, 0.4))
look(898, (6.2, -7.4, 0.4), (6.2, 0, -1.5))             # gas attack
look(965, (6.0, -7.0, 0.3), (6.0, 0, -1.6))
look(985, (5.5, -4.6, -1.5), (5.5, 0, -2.9))            # U-bend close-up
look(1070, (5.4, -4.4, -1.55), (5.4, 0, -2.95))
look(1092, (1.2, -11.0, 0.2), (1.2, 0, -3.6))            # pull-out: levels
look(1215, (1.2, -15.5, 1.2), (1.2, 0, -3.8))
look(1238, (0, -40, 15), (0, 8, -3))                     # extreme wide, 100+ KM
look(1292, (0, -44, 16), (0, 8, -3))
look(1302, (7.0, -3.2, -0.6), (7.0, 0.5, 0.2))           # soldier stuck, low angle
look(1418, (7.0, -3.0, -0.65), (7.0, 0.5, 0.2))
look(1430, (1.5, -14.5, 1.3), (1.5, 0, -2.9))            # final wide
look(1524, (1.5, -15.5, 1.4), (1.5, 0, -2.9))
shake(1333, 1342, 0.08)

sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(W, "jungle_hook.blend"))
print("BUILD_OK")
