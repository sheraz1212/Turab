# Great Escape tunnel short: builds the whole scene + animation in Blender (4.2+ / 5.x).
# Run:  blender -b -P build_great_escape.py            (or: python -c "import bpy" with the bpy pip package)
# Env:  GE_OUT=<folder for frames>   GE_ENGINE=CYCLES|BLENDER_EEVEE   GE_SAMPLES=10
import bpy, bmesh, math, random, os

random.seed(44)
W = os.environ.get("GE_OUT", os.path.join(os.path.dirname(os.path.abspath(__file__)), "out"))
FPS, END = 24, 1680
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
    # horizontal strata + damp streaks + coarse grain (more natural sand)
    mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (0.35, 0.35, 5.0)
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    st = N.new("ShaderNodeTexNoise"); st.inputs["Scale"].default_value = 1.2; st.inputs["Detail"].default_value = 6
    L.new(mp.outputs["Vector"], st.inputs["Vector"])
    sr = N.new("ShaderNodeValToRGB")
    sr.color_ramp.elements[0].position = 0.3; sr.color_ramp.elements[0].color = (0.72, 0.68, 0.62, 1)
    sr.color_ramp.elements[1].position = 0.7; sr.color_ramp.elements[1].color = (1.1, 1.08, 1.05, 1)
    L.new(st.outputs["Fac"], sr.inputs["Fac"])
    mx2 = N.new("ShaderNodeMix"); mx2.data_type = "RGBA"; mx2.blend_type = "MULTIPLY"; mx2.inputs["Factor"].default_value = 1.0
    L.new(mx.outputs[2], mx2.inputs[6]); L.new(sr.outputs["Color"], mx2.inputs[7])
    vo = N.new("ShaderNodeTexVoronoi"); vo.inputs["Scale"].default_value = 9.0
    L.new(tc.outputs["Object"], vo.inputs["Vector"])
    vr = N.new("ShaderNodeValToRGB")
    vr.color_ramp.elements[0].position = 0.0; vr.color_ramp.elements[0].color = (0.55, 0.5, 0.45, 1)
    vr.color_ramp.elements[1].position = 0.08; vr.color_ramp.elements[1].color = (1, 1, 1, 1)
    L.new(vo.outputs["Distance"], vr.inputs["Fac"])
    mx3 = N.new("ShaderNodeMix"); mx3.data_type = "RGBA"; mx3.blend_type = "MULTIPLY"; mx3.inputs["Factor"].default_value = 1.0
    L.new(mx2.outputs[2], mx3.inputs[6]); L.new(vr.outputs["Color"], mx3.inputs[7])
    L.new(mx3.outputs[2], b.inputs["Base Color"])
    nz2 = N.new("ShaderNodeTexNoise"); nz2.inputs["Scale"].default_value = 80; nz2.inputs["Detail"].default_value = 6
    L.new(tc.outputs["Object"], nz2.inputs["Vector"])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.8
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
M_SOIL = soil_mat("Soil", 1.0, body=(0.50, 0.33, 0.08), body2=(0.58, 0.40, 0.10), top=(0.11, 0.10, 0.09), grass=(0.13, 0.12, 0.10))
M_HOLE = soil_mat("HoleWall", 0.55, body=(0.50, 0.33, 0.08), body2=(0.58, 0.40, 0.10), top=(0.11, 0.10, 0.09), grass=(0.13, 0.12, 0.10))
M_SAND = mat("Sand", (0.62, 0.43, 0.11), 1.0, noise=0.25)
M_GROUND = mat("CampGround", (0.12, 0.11, 0.095), 1.0, noise=0.5)
M_PATCH = mat("Garden", (0.06, 0.05, 0.03), 1.0, noise=0.4)
M_GREEN = mat("Veg", (0.05, 0.09, 0.03), 0.9, noise=0.4)
M_WOOD = mat("Wood", (0.17, 0.10, 0.05), 0.8, noise=0.3)
M_DWOOD = mat("DarkWood", (0.08, 0.05, 0.03), 0.85, noise=0.3)
M_BOARD = mat("BedBoard", (0.32, 0.20, 0.10), 0.8, noise=0.25)
M_ROOF = mat("Roof", (0.05, 0.05, 0.05), 0.9, noise=0.2)
M_BRICK = mat("Brick", (0.28, 0.08, 0.05), 0.9, noise=0.35)
M_IRON = mat("Iron", (0.03, 0.03, 0.03), 0.5)
M_STOVEGLOW = mat("StoveGlow", (0.05, 0.03, 0.02), 0.5, (1.0, 0.35, 0.08), 0.0)
M_TIN = mat("Tin", (0.55, 0.55, 0.52), 0.35)
M_METAL = mat("Metal", (0.08, 0.08, 0.08), 0.4)
M_PINE = mat("Pine", (0.02, 0.05, 0.025), 0.85, noise=0.4)
M_BARK = mat("Bark", (0.06, 0.045, 0.035), 0.9, noise=0.4)
M_GREY = mat("Uniform", (0.06, 0.07, 0.09), 0.9)          # prisoners (RAF blue-grey)
M_CAP = mat("Cap", (0.05, 0.06, 0.08), 0.9)
M_GUARD = mat("Guard", (0.08, 0.09, 0.07), 0.85)         # guards (field grey, no insignia)
M_OLIVE = M_GUARD
M_PACK = mat("Pack", (0.12, 0.11, 0.08), 0.85)
M_BLACK = mat("BlackCloth", (0.02, 0.02, 0.025), 0.9)
M_STRAW = mat("Straw", (0.45, 0.36, 0.18), 0.9)
M_SKIN = mat("Skin", (0.55, 0.36, 0.25), 0.6)
M_BOOT = mat("Boot", (0.025, 0.02, 0.015), 0.6)
M_CLAY = M_SAND
M_ARROW = mat("Arrow", (1, 1, 1), 0.5, (1, 1, 1), 0.8)
M_RING = mat("Ring", (1, 1, 1), 0.5, (0.9, 0.95, 1.0), 1.2)
M_RED = mat("RedLED", (0.6, 0.0, 0.0), 0.5, (1.0, 0.05, 0.02), 0.0)
M_CROSS = mat("Cross", (0.7, 0.02, 0.02), 0.5, (1.0, 0.05, 0.03), 1.5)
M_LABEL = mat("Label", (1, 1, 1), 0.5, (1, 1, 1), 1.0)
M_SNOW = mat("Snow", (0.85, 0.87, 0.9), 0.6, noise=0.08)
M_LAMP = mat("LampGlow", (1, 0.7, 0.3), 0.5, (1.0, 0.6, 0.25), 30)
M_FIRE = mat("Fire", (1, 0.3, 0.02), 0.5, (1.0, 0.28, 0.03), 9.0)
M_OUTLINE = mat("Outline", (1, 0.45, 0.15), 0.5, (1.0, 0.42, 0.12), 0.9)
M_BEAM = mat("Beam", (1, 1, 0.9), 0.5, (1.0, 0.95, 0.8), 0.6)
M_BEAM.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.12
M_SMOKE = mat("Smoke", (0.22, 0.21, 0.2), 1.0)
M_SMOKE.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.55
for m_ in (M_BEAM, M_SMOKE):
    try:
        m_.blend_method = "BLEND"; m_.surface_render_method = "BLENDED"
    except Exception:
        pass

def set_interp(kind):
    try:
        bpy.context.preferences.edit.keyframe_new_interpolation_type = kind
    except Exception:
        pass

def show(o, f_on, f_off=None):
    """Hide an object from render outside [f_on, f_off)."""
    o.hide_render = True; o.keyframe_insert("hide_render", frame=1)
    o.hide_render = False; o.keyframe_insert("hide_render", frame=f_on)
    if f_off:
        o.hide_render = True; o.keyframe_insert("hide_render", frame=f_off)

def text(name, body, loc, size, m, rot=(R(90), 0, 0)):
    cu = bpy.data.curves.new(name, "FONT"); cu.body = body; cu.size = size; cu.align_x = "CENTER"; cu.extrude = 0.03
    o = link(bpy.data.objects.new(name, cu)); o.location = loc; o.rotation_euler = rot
    cu.materials.append(m)
    return o

# ------------------------------------------------------------ world & lights
wd = bpy.data.worlds.new("Sky"); sc.world = wd; wd.use_nodes = True
bg = wd.node_tree.nodes["Background"]
sun = bpy.data.lights.new("Sun", "SUN"); sun.angle = R(3); sun.color = (1.0, 0.82, 0.62)
so = link(bpy.data.objects.new("Sun", sun)); so.rotation_euler = (R(62), 0, R(-35))
moon = bpy.data.lights.new("Moon", "SUN"); moon.color = (0.5, 0.6, 1.0); moon.angle = R(2)
mo = link(bpy.data.objects.new("Moon", moon)); mo.rotation_euler = (R(45), 0, R(25))
NIGHT0, NIGHT1 = 1328, 1346
for f, se, ws, me_, c in ((1, 3.0, 0.7, 0.0, (0.55, 0.62, 0.75, 1)), (NIGHT0, 3.0, 0.7, 0.0, (0.55, 0.62, 0.75, 1)),
                          (NIGHT1, 0.0, 0.14, 2.6, (0.05, 0.08, 0.18, 1))):
    sun.energy = se; sun.keyframe_insert("energy", frame=f)
    moon.energy = me_; moon.keyframe_insert("energy", frame=f)
    bg.inputs["Strength"].default_value = ws; bg.inputs["Strength"].keyframe_insert("default_value", frame=f)
    bg.inputs["Color"].default_value = c; bg.inputs["Color"].keyframe_insert("default_value", frame=f)

# ------------------------------------------------------------ ground block (cross-section) + camp ground
cut = bpy.data.collections.new("Cutters"); sc.collection.children.link(cut)
ground = box("Ground", -45, 45, 0, 40, -45, 0, mat=M_SOIL)
ground.data.materials.append(M_HOLE)
bm_ = ground.modifiers.new("Dig", "BOOLEAN")
bm_.operation = "DIFFERENCE"; bm_.operand_type = "COLLECTION"; bm_.collection = cut; bm_.solver = "EXACT"
try:
    bm_.material_mode = "TRANSFER"
except Exception:
    pass
bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 239.9, -0.01))
bpy.context.active_object.data.materials.append(M_GROUND)
# snow (only on escape night) shares the cutters, so the exit hole pierces it
snow = box("Snow", -45, 45, 0, 40, 0, 0.06, mat=M_SNOW)
sm = snow.modifiers.new("Dig", "BOOLEAN"); sm.operation = "DIFFERENCE"; sm.operand_type = "COLLECTION"; sm.collection = cut; sm.solver = "EXACT"
show(snow, 1338)
snow2 = box("SnowFar", -200, 200, 40, 300, -0.01, 0.04, mat=M_SNOW); show(snow2, 1338)

def gcut(name, x0, x1, z0, z1, keys, mode="x", y0=-1.0, y1=1.6):
    """Cutter growing along keys [(frame, fraction 0..1)]. mode x: grows right, xl: left, z: down from z1, zu: up from z0."""
    if mode == "x":
        o = box(name, 0, 1, y0, y1, z0, z1, loc=(x0, 0, 0), mat=M_HOLE, coll=cut); full = lambda t: (max(0.001, (x1 - x0) * t), 1, 1)
    elif mode == "xl":
        o = box(name, -1, 0, y0, y1, z0, z1, loc=(x1, 0, 0), mat=M_HOLE, coll=cut); full = lambda t: (max(0.001, (x1 - x0) * t), 1, 1)
    elif mode == "z":
        o = box(name, x0, x1, y0, y1, -1, 0, loc=(0, 0, z1), mat=M_HOLE, coll=cut); full = lambda t: (1, 1, max(0.001, (z1 - z0) * t))
    else:
        o = box(name, x0, x1, y0, y1, 0, 1, loc=(0, 0, z0), mat=M_HOLE, coll=cut); full = lambda t: (1, 1, max(0.001, (z1 - z0) * t))
    o.display_type = "WIRE"; o.hide_render = True
    key(o, 1, scale=full(0))
    for f, t in keys:
        key(o, f, scale=full(t))
    return o

# ------------------------------------------------------------ Harry: shaft, tunnel, chambers, exit
SHAFT_KEYS = [(1, 0.0), (85, 1.6 / 9.1), (250, 3.2 / 9.1), (336, 3.4 / 9.1), (405, 1.0)]
gcut("shaft", -0.45, 0.45, -9.0, 0.1, SHAFT_KEYS, "z")
TUN = [(542, 0.45), (576, 3.0), (700, 5.0), (955, 9.0), (1080, 11.5), (1250, 13.8)]
gcut("tunnel", 0.0, 13.8, -9.0, -8.1, [(f, x / 13.8) for f, x in TUN], "x")
gcut("piccadilly", 4.4, 5.8, -9.0, -7.8, [(1225, 0), (1240, 1)], "z")
gcut("leicester", 8.8, 10.2, -9.0, -7.8, [(1232, 0), (1247, 1)], "z")
gcut("exit", 13.2, 13.8, -8.2, 0.3, [(1350, 0), (1390, 1)], "zu")
def tunnel_end(f):
    for (fa, xa), (fb, xb) in zip(TUN, TUN[1:]):
        if fa <= f <= fb:
            return xa + (xb - xa) * (f - fa) / (fb - fa)
    return TUN[-1][1] if f > TUN[-1][0] else 0.45

# Tom and Dick
gcut("tomShaft", -7.4, -6.6, -8.4, 0.1, [(1085, 0), (1100, 1)], "z")
gcut("tomTun", -12.5, -6.6, -8.4, -7.6, [(1095, 0), (1112, 1)], "xl")
gcut("dickShaft", -3.6, -2.9, -7.4, 0.1, [(1185, 0), (1198, 1)], "z")
gcut("dickTun", -5.6, -2.9, -7.4, -6.6, [(1192, 0), (1205, 1)], "xl")
fill = box("TomFill", -7.45, -6.55, -0.4, 1.0, -1, 0, loc=(0, 0, 0.12), mat=M_SAND)
key(fill, 1, scale=(1, 1, 0.001)); key(fill, 1134, scale=(1, 1, 0.001)); key(fill, 1160, scale=(1, 1, 8.4))
fill2 = box("TomFillT", -12.5, -6.55, -0.4, 1.0, -8.45, -7.55, mat=M_SAND)
key(fill2, 1, scale=(1, 1, 1)); show(fill2, 1150)

# ------------------------------------------------------------ hut 104 (cutaway, on stilts) + stove
HUT_F = 0.6
def hut(x0, x1, y0, y1, cutaway=False):
    for px in (x0 + 0.1, (x0 + x1) / 2, x1 - 0.1):
        for py in (y0 + 0.1, y1 - 0.1):
            box("stilt", px - 0.08, px + 0.08, py - 0.08, py + 0.08, 0, HUT_F, mat=M_DWOOD)
    box("floor", x0, x1, y0, y1, HUT_F, HUT_F + 0.12, mat=M_WOOD)
    box("backwall", x0, x1, y1 - 0.12, y1, HUT_F, 3.2, mat=M_WOOD)
    box("lwall", x0, x0 + 0.12, y0, y1, HUT_F, 3.2, mat=M_WOOD)
    box("rwall", x1 - 0.12, x1, y0, y1, HUT_F, 3.2, mat=M_WOOD)
    if not cutaway:
        box("fwall", x0, x1, y0, y0 + 0.12, HUT_F, 3.2, mat=M_WOOD)
    me = bpy.data.meshes.new("roof"); bm = bmesh.new()
    ym = (y0 + y1) / 2
    pts = [(x0 - 0.2, y0 - 0.3, 3.2), (x1 + 0.2, y0 - 0.3, 3.2), (x1 + 0.2, ym, 4.2), (x0 - 0.2, ym, 4.2),
           (x0 - 0.2, y1 + 0.3, 3.2), (x1 + 0.2, y1 + 0.3, 3.2)]
    v = [bm.verts.new(p) for p in pts]
    bm.faces.new((v[0], v[1], v[2], v[3])); bm.faces.new((v[3], v[2], v[5], v[4]))
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new("roof", me)); me.materials.append(M_ROOF)
    o.modifiers.new("solid", "SOLIDIFY").thickness = 0.08

hut(-2.4, 2.4, 0.15, 5.0, cutaway=True)
for (hx, hy) in ((-9.5, 8), (-2.4, 9), (5, 8), (-16, 1), (-16, 9), (5.0, 15), (-9, 16)):
    hut(hx, hx + 4.8, hy, hy + 4.8)
plinth = box("plinth", -0.55, 0.55, 0.3, 1.4, 0, HUT_F + 0.12, mat=M_BRICK)
stove = link(bpy.data.objects.new("StoveRig", None))
for part in (box("stoveBody", -0.35, 0.35, 0.45, 1.25, 0, 0.8, mat=M_IRON), box("stoveDoor", -0.2, 0.2, 0.43, 0.46, 0.15, 0.45, mat=M_STOVEGLOW)):
    part.parent = stove
pipe = cyl("stovePipe", (0, 0.85, 1.9), 0.07, 2.2, M_IRON); pipe.parent = stove
key(stove, 1, location=(1.2, 0, HUT_F + 0.12)); key(stove, 172, location=(1.2, 0, HUT_F + 0.12)); key(stove, 200, location=(0, 0, HUT_F + 0.12))
glow = M_STOVEGLOW.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
for f, e in ((1, 0.0), (196, 0.0), (206, 12.0)):
    glow.default_value = e; glow.keyframe_insert("default_value", frame=f)
sl = bpy.data.lights.new("stoveL", "POINT"); sl.color = (1, 0.45, 0.15); sl.shadow_soft_size = 0.1
slo = link(bpy.data.objects.new("stoveL", sl)); slo.location = (0, 0.2, 1.1)
for f, e in ((1, 0), (196, 0), (206, 60)):
    sl.energy = e; sl.keyframe_insert("energy", frame=f)
for i, z in enumerate((1.0, 1.9)):                       # bunk beds whose boards will vanish
    box("bunkFrame", -2.2, -1.2, 2.0, 4.6, HUT_F + 0.1, HUT_F + 2.6, mat=M_DWOOD).display_type = "WIRE"
slats = []
for lvl, z in enumerate((HUT_F + 0.7, HUT_F + 1.6)):
    for k in range(8):
        y = 2.05 + k * 0.32
        s = box("slat", -2.2, -1.2, y, y + 0.22, z, z + 0.05, mat=M_BOARD); slats.append(s)
for x0 in (-2.25, -1.2):
    for y0 in (2.0, 4.5):
        box("bunkPost", x0, x0 + 0.08, y0, y0 + 0.08, HUT_F + 0.1, HUT_F + 2.3, mat=M_DWOOD)

# ------------------------------------------------------------ fence, guard tower, searchlight, microphones
for fx in (9.0, 9.8):
    for py in range(0, 40, 2):
        box("post", fx - 0.06, fx + 0.06, py - 0.06, py + 0.06, 0, 3.0, mat=M_DWOOD)
    for wz in (0.5, 1.0, 1.5, 2.0, 2.5, 2.9):
        box("wire", fx - 0.01, fx + 0.01, 0, 40, wz, wz + 0.02, mat=M_METAL)
TX, TY = 12.3, 1.6
for dx in (-0.8, 0.8):
    for dy in (-0.8, 0.8):
        cyl("towerLeg", (TX + dx, TY + dy, 2.6), 0.08, 5.2, M_DWOOD)
box("towerDeck", TX - 1.1, TX + 1.1, TY - 1.1, TY + 1.1, 5.2, 5.35, mat=M_WOOD)
box("towerRail", TX - 1.1, TX + 1.1, TY - 1.1, TY - 1.0, 5.35, 6.2, mat=M_WOOD)
cyl("towerRoof", (TX, TY, 7.2), 1.6, 0.6, M_ROOF, verts=4, r2=0.05, rot=(0, 0, R(45)))
spot = bpy.data.lights.new("search", "SPOT"); spot.spot_size = R(16); spot.spot_blend = 0.3; spot.color = (1, 0.97, 0.88)
spot.use_shadow = False
try:
    spot.cycles.cast_shadow = False
except Exception:
    pass
spo = link(bpy.data.objects.new("search", spot)); spo.location = (TX, TY - 1.0, 5.9)
for f, e in ((1, 0), (NIGHT0, 0), (NIGHT1, 4000)):
    spot.energy = e; spot.keyframe_insert("energy", frame=f)
for f, ang in ((1, -30), (1346, -30), (1390, 25), (1430, -10), (1470, 40), (1520, 0), (1560, 35), (1610, -15), (1680, 20)):
    key(spo, f, rotation_euler=(R(60), 0, R(ang)))
mic = cyl("mic", (8.4, 0.3, -1.4), 0.2, 0.45, M_METAL)
cyl("micWire", (8.4, 0.3, -0.7), 0.015, 1.4, M_IRON)
led = ico("micLED", (8.4, -0.0, -1.2), 0.1, M_RED, 2)
ledE = M_RED.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
for f in (1, 262):
    ledE.default_value = 0.0; ledE.keyframe_insert("default_value", frame=f)
for f0 in (280, 300, 320):
    for f, e in ((f0 - 1, 0.0), (f0, 25.0), (f0 + 8, 0.0)):
        ledE.default_value = e; ledE.keyframe_insert("default_value", frame=f)

def ring(f0, loc, rmax, dur=20):
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.025, location=loc, rotation=(R(90), 0, 0))
    o = bpy.context.active_object; o.data.materials.append(M_RING)
    key(o, 1, scale=(0, 0, 0)); key(o, f0 - 1, scale=(0, 0, 0)); key(o, f0, scale=(0.1, 0.1, 0.1))
    key(o, f0 + dur, scale=(rmax, rmax, rmax)); key(o, f0 + dur + 1, scale=(0, 0, 0))
for i, f0 in enumerate((262, 282, 302)):
    ring(f0, (0, -0.1, -3.0), 8.6)
for i, f0 in enumerate((350, 370, 390)):
    ring(f0, (0, -0.1, -8.4), 3.0, 18)

# ------------------------------------------------------------ forest (pines), garden
def pine(x, y, h):
    cyl("trunk", (x, y, h * 0.25), 0.12 * h / 6, h * 0.5, M_BARK, verts=8)
    for k in range(4):
        z = h * (0.35 + 0.16 * k); r = h * (0.26 - 0.05 * k)
        cyl("needles", (x, y, z), r, h * 0.3, M_PINE, verts=10, r2=0.02)
for i in range(70):
    x = random.uniform(15.5, 45); y = random.uniform(-3, 40)
    if y < 0.5 and x < 18:
        continue
    pine(x, y, random.uniform(7, 11))
for i in range(60):
    pine(random.uniform(-45, 15), random.uniform(24, 60), random.uniform(8, 12))
for gx in (-8.5, -6.5, -4.5):
    box("garden", gx - 0.8, gx + 0.8, 2.3, 4.4, -0.02, 0.04, mat=M_PATCH)
    for k in range(5):
        ico("veg", (gx + random.uniform(-0.6, 0.6), random.uniform(2.5, 4.2), 0.08), 0.12, M_GREEN, 1, (1, 1, 0.6))

# ------------------------------------------------------------ people
def man_prone(name, cloth, hat, loc):
    root, legs, arms = make_man(name, cloth, hat)
    root.rotation_mode = "YXZ"; root.rotation_euler = (R(90), R(90), 0)
    root.location = loc
    return root, legs, arms

def crawl(legs, arms, f0, f1, step=6):
    f, s = f0, 1
    while f <= f1:
        key(legs[0], f, rotation_euler=(R(18 * s), 0, 0)); key(legs[1], f, rotation_euler=(R(-18 * s), 0, 0))
        key(arms[0], f, rotation_euler=(R(-150 - 25 * s), 0, 0)); key(arms[1], f, rotation_euler=(R(-150 + 25 * s), 0, 0))
        s = -s; f += step

def dig_anim(arms, f0, f1, step=7):
    f, up = f0, True
    while f <= f1:
        key(arms[1], f, rotation_euler=(R(-80 if up else 20), 0, 0)); key(arms[0], f, rotation_euler=(R(-60 if up else 10), 0, 0))
        up = not up; f += step
    key(arms[1], f1 + step, rotation_euler=(0, 0, 0)); key(arms[0], f1 + step, rotation_euler=(0, 0, 0))

# digger in the shaft (follows the shaft floor)
dig, dlegs, darms = make_man("Digger", M_GREY, "none")
shov = cyl("shovel", (0, -0.1, -0.7), 0.022, 0.7, M_WOOD); shov.parent = darms[1]
blade = box("blade", -0.1, 0.1, -0.02, 0.02, -0.25, 0, loc=(0, -0.1, -1.05), mat=M_METAL); blade.parent = darms[1]
key(dig, 1, location=(0.0, 0.8, 0.1), rotation_euler=(0, 0, R(20)), scale=(0, 0, 0))
key(dig, 6, scale=(1, 1, 1))
for f, frac in SHAFT_KEYS[1:]:
    key(dig, f, location=(0.0, 0.8, 0.1 - 9.1 * frac))
key(dig, 540, location=(0.0, 0.8, -9.0), scale=(1, 1, 1)); key(dig, 542, scale=(0, 0, 0))
key(darms[0], 1, rotation_euler=(0, 0, 0)); key(darms[1], 1, rotation_euler=(0, 0, 0))
dig_anim(darms, 10, 160); dig_anim(darms, 262, 410); dig_anim(darms, 460, 530)

# tunnel digger (prone, head at the tunnel face)
td, tl, ta = man_prone("TunnelDigger", M_GREY, "none", (0.4, 0.8, -8.75))
key(td, 1, scale=(0, 0, 0)); key(td, 541, scale=(0, 0, 0)); key(td, 543, scale=(1, 1, 1))
for f in list(range(542, 1251, 12)) + [1251]:
    key(td, f, location=(max(0.2, tunnel_end(f) - 2.0), 0.8, -8.75))
key(td, 1330, scale=(1, 1, 1)); key(td, 1332, scale=(0, 0, 0))
crawl(tl, ta, 542, 1320, 7)

# guard crawling under the hut with a flashlight (B2/B3)
gd, gl, ga = man_prone("Ferret", M_GUARD, "helmet", (-7.5, 1.0, 0.25))
key(gd, 1, location=(-7.5, 1.0, 0.25)); key(gd, 88, location=(-7.5, 1.0, 0.25)); key(gd, 160, location=(-3.2, 1.0, 0.25))
key(gd, 220, location=(-3.0, 1.0, 0.25)); key(gd, 262, location=(-8.5, 1.0, 0.25), scale=(1, 1, 1)); key(gd, 264, scale=(0, 0, 0))
crawl(gl, ga, 88, 160, 7); crawl(gl, ga, 222, 262, 7)
fl = bpy.data.lights.new("flash", "SPOT"); fl.spot_size = R(25); fl.spot_blend = 0.5; fl.energy = 0
flo = link(bpy.data.objects.new("flash", fl)); flo.parent = gd; flo.location = (0, -0.15, 2.0); flo.rotation_euler = (R(-90), 0, 0)
for f, e in ((1, 0), (88, 0), (92, 300), (262, 300), (266, 0)):
    fl.energy = e; fl.keyframe_insert("energy", frame=f)

# walking guard who notices a sand pile (B9)
wg, wl, wa = make_man("WalkGuard", M_GUARD, "helmet")
key(wg, 1, location=(-11, 1.8, 0), rotation_euler=(0, 0, R(-90)), scale=(0, 0, 0))
key(wg, 600, location=(-11, 1.8, 0), scale=(0, 0, 0)); key(wg, 602, scale=(1, 1, 1))
key(wg, 690, location=(-4.2, 1.8, 0)); key(wg, 706, scale=(1, 1, 1)); key(wg, 708, scale=(0, 0, 0))
walk(wl, wa, 602, 690)
pile = ico("yellowPile", (-3.0, 1.3, 0.0), 0.35, M_SAND, 3, (1.2, 1, 0.3)); pop(pile, 585)
key(pile, 708, scale=(1.2, 1, 0.3)); key(pile, 712, scale=(0, 0, 0))
opile = outline_rect("pileOutline", 1.2, 1.0, (-3.0, 1.3, 0.12), (0, 0, 0), M_OUTLINE)
key(opile, 1, scale=(0, 0, 0)); key(opile, 610, scale=(0, 0, 0)); key(opile, 615, scale=(1.08, 1.08, 1)); key(opile, 618, scale=(1, 1, 1))
key(opile, 700, scale=(1, 1, 1)); key(opile, 705, scale=(0, 0, 0))

# penguins (B10): walk through the gardens, sand trickles from their trouser legs
set_interp("LINEAR")
for i, (y, d) in enumerate(((2.9, 0), (3.8, 14))):
    p, pl, pa = make_man(f"Penguin{i}", M_GREY, "cap")
    x0, x1, f0, f1 = -10.5, -3.5, 712 + d, 812 + d
    key(p, 1, location=(x0, y, 0), rotation_euler=(0, 0, R(-90)), scale=(0, 0, 0))
    key(p, f0 - 2, scale=(0, 0, 0)); key(p, f0, location=(x0, y, 0), scale=(1, 1, 1)); key(p, f1, location=(x1, y, 0))
    key(p, f1 + 30, scale=(1, 1, 1)); key(p, f1 + 32, scale=(0, 0, 0))
    walk(pl, pa, f0, f1, step=7, swing=20)
    for k in range(26):
        ft = f0 + 4 + k * 3.7
        xs = x0 + (x1 - x0) * (ft - f0) / (f1 - f0)
        g = ico("grain", (xs + random.uniform(-0.15, 0.15), y + random.uniform(-0.1, 0.1), 0.45), random.uniform(0.03, 0.05), M_SAND, 1)
        key(g, 1, scale=(0, 0, 0)); key(g, int(ft), scale=(0, 0, 0)); key(g, int(ft) + 1, scale=(1, 1, 1))
        key(g, int(ft) + 1, location=g.location.copy())
        g.location.z = 0.02; key(g, int(ft) + 10, location=g.location.copy(), scale=(1.4, 1.4, 0.4))
set_interp("BEZIER")

# ------------------------------------------------------------ bed boards shoring the shaft (B7) + collapse (B6)
for k in range(16):
    z = -0.4 - k * 0.55
    f0 = 456 + k * 5
    for side, (xa, xb) in enumerate(((-0.45, -0.38), (0.38, 0.45))):
        b = box("shore", xa, xb, 0.0, 1.6, z - 0.25, z + 0.25, mat=M_BOARD); pop(b, f0 + side * 2)
    bb = box("shoreBack", -0.45, 0.45, 1.53, 1.6, z - 0.25, z + 0.25, mat=M_BOARD); pop(bb, f0 + 1)
for k, s in enumerate(slats):                             # boards disappear from the bunks
    key(s, 1, scale=(1, 1, 1)); key(s, 452 + k * 5, scale=(1, 1, 1)); key(s, 455 + k * 5, scale=(0, 0, 0))
oshaft = outline_rect("shaftOutline", 1.1, 9.4, (0, -0.02, -4.45), (R(90), 0, 0), M_OUTLINE)
key(oshaft, 1, scale=(0, 0, 0)); key(oshaft, 520, scale=(0, 0, 0)); key(oshaft, 525, scale=(1.06, 1.02, 1)); key(oshaft, 528, scale=(1, 1, 1))
key(oshaft, 548, scale=(1, 1, 1)); key(oshaft, 552, scale=(0, 0, 0))
for i in range(14):                                       # sand collapsing into the shaft
    c = ico("slump", (random.uniform(-0.35, 0.35), 0.6, -5.5 - random.uniform(0, 2)), random.uniform(0.1, 0.2), M_SAND, 1)
    f0 = 412 + i * 2
    key(c, 1, scale=(0, 0, 0)); key(c, f0, scale=(0, 0, 0), location=c.location.copy()); key(c, f0 + 1, scale=(1, 1, 1))
    key(c, f0 + 14, location=(c.location.x, 0.6, -8.85)); key(c, 455, scale=(1, 1, 1)); key(c, 460, scale=(0, 0, 0))

# ------------------------------------------------------------ air pump + milk-tin pipe (B11), rails + trolley (B12), lamps
pump = box("bellows", -0.4, 0.4, 0.4, 1.2, -9.0, -8.6, loc=(0.9, 0, 0), mat=M_PACK)
key(pump, 1, scale=(0, 0, 0)); key(pump, 818, scale=(0, 0, 0)); key(pump, 822, scale=(1, 1, 1))
for f in range(822, 1330, 10):
    key(pump, f, scale=(1, 1, 1.0 if (f // 10) % 2 else 0.45))
tinpipe = cyl("tinPipe", (0, 0, 0), 0.06, 1.0, M_TIN, rot=(0, R(90), 0), verts=10)
tinpipe.location = (1.3, 0.5, -8.95)
tinpipe.data.transform(__import__("mathutils").Matrix.Translation((0, 0, 0.5)))   # pivot at the pump end
key(tinpipe, 1, scale=(1, 1, 0.001)); key(tinpipe, 822, scale=(1, 1, 0.001)); key(tinpipe, 840, scale=(1, 1, 7.5))
key(tinpipe, 1250, scale=(1, 1, 11.0))
RIGHT = (0, R(-90), 0)
for k in range(4):
    arrow(f"airArrow{k}", [((1.4, -0.15, -8.75), RIGHT), ((4.0, -0.15, -8.75), RIGHT), ((6.5, -0.15, -8.75), RIGHT), ((8.6, -0.15, -8.75), RIGHT)], 860 + k * 14, 14)
for side in (0.55, 1.05):
    rl = box("rail", 0, 1, side - 0.03, side + 0.03, -9.0, -8.94, loc=(0.6, 0, 0), mat=M_DWOOD)
    key(rl, 1, scale=(0.001, 1, 1)); key(rl, 958, scale=(0.001, 1, 1)); key(rl, 968, scale=(12.5, 1, 1))
trol = link(bpy.data.objects.new("TrolleyRig", None))
tb = box("trolley", -0.35, 0.35, 0.45, 1.15, -8.94, -8.82, mat=M_WOOD); tb.parent = trol
key(trol, 1, location=(1.0, 0, 0), scale=(0, 0, 0)); key(trol, 960, location=(1.0, 0, 0), scale=(0, 0, 0)); key(trol, 964, scale=(1, 1, 1))
key(trol, 1070, location=(9.5, 0, 0)); key(trol, 1080, scale=(1, 1, 1)); key(trol, 1084, scale=(0, 0, 0))
rider, rl_, ra_ = man_prone("Rider", M_GREY, "none", (0, 0.8, -8.6)); rider.parent = trol; rider.location = (-0.95, 0.8, -8.62)
rope = cyl("rope", (0, 0, 0), 0.012, 1.0, M_STRAW, rot=(0, R(90), 0), verts=6); rope.location = (5.5, 0.8, -8.85)
rope.scale = (1, 1, 9.0); show(rope, 962, 1084)
for k, x in enumerate([1.5 + 1.6 * i for i in range(8)]):
    ico("bulb", (x, 0.9, -8.2), 0.05, M_LAMP, 2)
    o = bpy.data.objects[-1] if False else None
lamp_at((3.0, 0.9, -8.25), 640, 15)
lamp_at((7.5, 0.9, -8.25), 900, 15)
lamp_at((11.5, 0.9, -8.25), 1150, 15)
# closed wall in front of the tunnel, only while the camera rides the trolley (FPV)
fpvwall = box("fpvWall", 0.5, 14.0, -0.12, 0.02, -9.1, -7.9, mat=M_HOLE); show(fpvwall, 962, 1080)
fpv = bpy.data.lights.new("fpvLight", "POINT"); fpv.color = (1, 0.75, 0.5); fpv.shadow_soft_size = 0.05
fpvo = link(bpy.data.objects.new("fpvLight", fpv))

# ------------------------------------------------------------ Tom found and blown up (B13), labels (B14), chambers
gx_, gxl, gxa = make_man("Charger", M_GUARD, "helmet")
key(gx_, 1, location=(-9.5, 1.0, 0), rotation_euler=(0, 0, R(-90)), scale=(0, 0, 0))
key(gx_, 1088, scale=(0, 0, 0), location=(-11, 1.0, 0)); key(gx_, 1090, scale=(1, 1, 1)); key(gx_, 1110, location=(-7.8, 1.0, 0))
key(gx_, 1122, location=(-7.8, 1.0, 0)); key(gx_, 1130, location=(-12, 1.0, 0)); key(gx_, 1131, scale=(1, 1, 1)); key(gx_, 1133, scale=(0, 0, 0))
walk(gxl, gxa, 1090, 1110); walk(gxl, gxa, 1122, 1130)
charge = box("charge", -7.15, -6.85, 0.8, 1.1, 0.0, 0.25, mat=M_PACK); pop(charge, 1112, hide_after=1130)
explosion((-7.0, 0.8, 0.2), 1132, 0.85)
lblT = text("lblTom", "TOM", (-9.6, -0.3, -6.9), 1.4, M_LABEL); pop(lblT, 1166)
lblD = text("lblDick", "DICK", (-4.3, -0.3, -5.9), 1.4, M_LABEL); pop(lblD, 1200)
lblH = text("lblHarry", "HARRY", (7.0, -0.3, -7.6), 1.6, M_LABEL); pop(lblH, 1214)
crs = box("cross", -11.0, -8.2, -0.35, -0.3, -6.55, -6.4, mat=M_CROSS); crs.rotation_euler = (0, R(-12), 0); pop(crs, 1176)
for o_ in (lblT, lblD, lblH, crs):
    key(o_, 1330, scale=tuple(o_.scale)); key(o_, 1336, scale=(0, 0, 0))
oh = outline_rect("harryOutline", 14.6, 1.7, (6.85, -0.02, -8.55), (R(90), 0, 0), M_OUTLINE)
key(oh, 1, scale=(0, 0, 0)); key(oh, 1218, scale=(0, 0, 0)); key(oh, 1223, scale=(1.03, 1.08, 1)); key(oh, 1226, scale=(1, 1, 1))
key(oh, 1326, scale=(1, 1, 1)); key(oh, 1330, scale=(0, 0, 0))

# ------------------------------------------------------------ escape night (B16-B18)
first, fl_, fa_ = make_man("FirstOut", M_GREY, "cap")
key(first, 1, location=(13.5, 0.8, -1.9), rotation_euler=(0, 0, R(-90)), scale=(0, 0, 0))
key(first, 1388, scale=(0, 0, 0)); key(first, 1390, scale=(1, 1, 1)); key(first, 1405, location=(13.5, 0.8, -1.2))
key(first, 1430, location=(13.5, 0.8, -1.2)); key(first, 1446, location=(13.5, 0.8, 0.0)); key(first, 1460, location=(14.3, 1.2, 0.0))
key(first, 1500, location=(20.0, 2.5, 0.0)); key(first, 1502, scale=(1, 1, 1)); key(first, 1504, scale=(0, 0, 0))
walk(fl_, fa_, 1450, 1500, step=5, swing=40)
for i in range(5):
    m_, ml, ma = make_man(f"Escaper{i}", M_GREY, "cap")
    f0 = 1505 + i * 22
    key(m_, 1, location=(13.5, 0.8, -1.9), rotation_euler=(0, 0, R(-90)), scale=(0, 0, 0))
    key(m_, f0 - 2, scale=(0, 0, 0)); key(m_, f0, location=(13.5, 0.8, -1.9), scale=(1, 1, 1))
    key(m_, f0 + 14, location=(13.5, 0.8, 0.0)); key(m_, f0 + 22, location=(14.4, 1.0 + i * 0.3, 0.0))
    key(m_, f0 + 60, location=(21.0, 2.0 + i * 0.6, 0.0))
    walk(ml, ma, f0 + 16, f0 + 60, step=5, swing=40)
    if f0 + 62 < END:
        key(m_, f0 + 62, scale=(1, 1, 1)); key(m_, f0 + 64, scale=(0, 0, 0))
# footprints in the snow towards the trees
for k in range(14):
    x = 14.2 + k * 0.5; y = 1.0 + k * 0.1 + (0.12 if k % 2 else -0.12)
    fp = box("footprint", x - 0.12, x + 0.12, y - 0.06, y + 0.06, 0.055, 0.07, mat=M_GROUND); show(fp, 1462 + k * 3)
# falling snow
for i in range(80):
    x, y = random.uniform(6, 20), random.uniform(-2, 6)
    s = ico("flake", (x, y, 7), 0.025, M_SNOW, 1)
    f0 = random.randint(1338, 1500)
    key(s, 1, scale=(0, 0, 0)); key(s, 1337, scale=(0, 0, 0)); key(s, 1338, scale=(1, 1, 1), location=(x, y, random.uniform(2, 9)))
    key(s, 1680, location=(x + random.uniform(-1, 1), y, -0.5))

# ------------------------------------------------------------ camera
cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 32; cam_d.sensor_fit = "VERTICAL"; cam_d.sensor_height = 36
cam_d.clip_start = 0.05; cam_d.clip_end = 500
rig = link(bpy.data.objects.new("CamRig", None))
cam = link(bpy.data.objects.new("Cam", cam_d)); cam.parent = rig; sc.camera = cam
fpvo.parent = cam
for f, e in ((1, 0), (962, 0), (966, 30), (1074, 30), (1078, 0)):
    fpv.energy = e; fpv.keyframe_insert("energy", frame=f)

def look(f, loc, target):
    dx, dy, dz = (target[i] - loc[i] for i in range(3))
    pitch = math.atan2(-dz, math.hypot(dx, dy)); yaw = math.atan2(-dx, dy)
    key(rig, f, location=loc, rotation_euler=(R(90) - pitch, 0, yaw))

look(1, (0.6, -12.5, 1.4), (0.6, 0, -1.4))             # B1 side, camp + shaft
look(86, (0.3, -12.0, 1.4), (0.3, 0, -1.4))
look(150, (-1.0, -11.2, 1.3), (-1.0, 0, -1.0))          # B2 guard under the hut
look(166, (0.6, -3.6, 3.9), (0.0, 1.0, 0.7))            # B3 high angle into hut 104
look(244, (0.4, -3.3, 3.8), (0.0, 1.0, 0.7))
look(262, (4.3, -16.5, 0.6), (4.3, 0, -2.4))            # B4 microphones, side wide
look(330, (4.3, -16.0, 0.5), (4.3, 0, -2.6))
look(352, (0.2, -7.5, -2.5), (0.2, 0, -5.2))            # B5 push-in, pan down to 30 ft
look(405, (0.2, -6.5, -5.2), (0.2, 0, -7.2))
look(450, (0.0, -6.2, -5.0), (0.0, 0, -6.8))            # B6/B7 collapse + bed boards
look(530, (0.0, -7.2, -4.0), (0.0, 0, -5.0))
look(556, (2.0, -6.4, -7.6), (2.6, 0, -8.6))            # B8 sideways
look(578, (3.2, -6.2, -7.7), (3.6, 0, -8.6))
look(592, (-7.0, -4.2, 1.3), (-2.8, 2.0, 0.1))          # B9 yellow sand on grey ground, 3/4 low
look(700, (-6.6, -3.9, 1.2), (-2.8, 2.0, 0.1))
look(716, (-11.5, -4.0, 1.6), (-6.5, 3.4, 0.5))         # B10 penguins
look(812, (-8.5, -4.2, 1.5), (-4.5, 3.4, 0.5))
look(828, (1.6, -3.0, -8.3), (1.9, 0, -8.7))            # B11 pump close-up -> pull out
look(870, (1.8, -3.2, -8.3), (2.1, 0, -8.7))
look(950, (5.0, -11.5, -6.6), (5.0, 0, -8.5))
look(964, (2.2, 0.8, -8.4), (25, 0.8, -8.6))           # B12 FPV on the trolley
look(1072, (10.7, 0.8, -8.4), (30, 0.8, -8.6))
look(1086, (-6.5, -15.5, 0.2), (-6.5, 0, -4.0))         # B13 Tom found + blown up
look(1158, (-6.2, -15.0, 0.1), (-6.2, 0, -4.0))
look(1170, (-1.5, -31.0, 1.0), (-1.5, 0, -5.0))           # B14 three tunnels, pull out
look(1258, (-1.0, -35.0, 2.0), (-1.0, 0, -5.0))
look(1270, (3.0, -46.0, 17.0), (3.0, 10, -4.0))         # B15 extreme wide, "336 FT"
look(1328, (3.0, -49.0, 18.0), (3.0, 10, -4.0))
look(1342, (10.2, -6.0, 0.55), (13.6, 1.6, 0.7))        # B16 night, ground level at the exit
look(1500, (10.6, -5.5, 0.5), (13.8, 1.6, 0.7))
look(1508, (12.0, -9.5, 1.6), (15.5, 2.0, 0.4))         # B17 men crawl out and run
look(1578, (12.4, -9.2, 1.5), (16.0, 2.0, 0.4))
look(1590, (4.5, -26.0, 2.2), (4.5, 0, -4.2))           # B18 final wide
look(1680, (4.5, -27.5, 2.3), (4.5, 0, -4.2))

key(cam, 1, location=(0, 0, 0))
def shake(f0, f1, amp):
    key(cam, f0 - 1, location=(0, 0, 0))
    for f in range(f0, f1):
        a = amp * (1 - (f - f0) / (f1 - f0))
        key(cam, f, location=(random.uniform(-a, a), random.uniform(-a, a), 0))
    key(cam, f1, location=(0, 0, 0))
shake(413, 428, 0.06); shake(1133, 1150, 0.16)
for f0 in (280, 300, 320):
    shake(f0, f0 + 5, 0.03)

sc.frame_set(1)
print("BUILD_OK")
