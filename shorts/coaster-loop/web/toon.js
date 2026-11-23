export const INK = "#241726";
export const SKIN = "#ffe2c2";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
const SH_SKIN = [
    0.96,
    0.86,
    0.84
];
const SH_CLOTH = [
    0.64,
    0.66,
    0.74
];
const SH_FELT = [
    0.62,
    0.62,
    0.7
];
const rad = (d)=>d * Math.PI / 180;
const clamp = (x, a, b)=>Math.max(a, Math.min(b, x));
export const mul = (c, m)=>{
    const n = parseInt(c.slice(1), 16);
    const ch = (v, k)=>Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
    return `#${ch(n >> 16 & 255, m[0])}${ch(n >> 8 & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c, k)=>mul(c, [
        k,
        k,
        k
    ]);
export const mix = (a, b, t)=>{
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    const ch = (s)=>Math.round((A >> s & 255) * (1 - t) + (B >> s & 255) * t).toString(16).padStart(2, "0");
    return `#${ch(16)}${ch(8)}${ch(0)}`;
};
const rnd = (seed, k)=>{
    const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
};
const rotPts = (pts, a, cx, cy)=>pts.map(([x, y])=>[
            cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a),
            cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)
        ]);
const rotAbout = (q, a, c)=>rotPts([
        q
    ], a, c[0], c[1])[0];
const lerp2 = (a, b, t)=>[
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t
    ];
const curve = (a, k, b, n = 10)=>{
    const c = [
        2 * k[0] - (a[0] + b[0]) / 2,
        2 * k[1] - (a[1] + b[1]) / 2
    ], out = [];
    for(let i = 0; i <= n; i++){
        const t = i / n, s = 1 - t;
        out.push([
            s * s * a[0] + 2 * s * t * c[0] + t * t * b[0],
            s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]
        ]);
    }
    return out;
};
export const RIFLEMAN = {
    jacket: "#357650",
    pants: "#3d4440",
    boots: INK,
    hat: "shako",
    belt: "#f1efe6",
    buttons: "#d9dde0",
    rifle: true
};
export const OFFICER = {
    ...RIFLEMAN,
    hat: "shako_tall",
    buttons: "#e8c45a",
    sash: "#c0353a",
    sword: true,
    moustache: "#4a3020",
    rifle: false,
    belt: null,
    build: "stout"
};
export const KID = {
    jacket: "#f08a2c",
    pants: "#3b5b9a",
    boots: "#f4f1ea",
    hat: "cap",
    cap: "#e2453c",
    build: "kid"
};
export const PARENT = {
    jacket: "#7b5ac9",
    pants: "#3b3f52",
    boots: "#5a3b2a",
    hat: "hair",
    hair: "#5a3b2a"
};
export const SKINS = [
    SKIN,
    "#f5c9a0",
    "#ecd0b6",
    "#c99067"
];
export const soldier = (v = 0, extra = {})=>{
    const o = {
        ...RIFLEMAN,
        skin: SKINS[v % 4]
    };
    if (v % 4 === 1) o.moustache = "#4a3426";
    if (v % 4 === 3) o.moustache = "#2a201a";
    return {
        ...o,
        ...extra
    };
};
export const townsfolk = (v = 0)=>{
    const coats = [
        "#3f6fb5",
        "#8c3b4a",
        "#5d7a3a",
        "#b5653f",
        "#2f5f6a",
        "#7b5ac9"
    ];
    const o = {
        jacket: coats[v % 6],
        pants: "#3b3f52",
        boots: "#4a3426",
        skin: SKINS[v % 4]
    };
    return v % 2 ? {
        ...o,
        hat: "bonnet",
        dress: [
            "#d9a441",
            "#c25a7a",
            "#5a8fc2"
        ][v % 3]
    } : {
        ...o,
        hat: "tophat"
    };
};
export class Pen {
    g;
    ol = 12;
    rot = null;
    constructor(g){
        this.g = g;
    }
    P(x, y) {
        if (!this.rot) return [
            x,
            y
        ];
        const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
        return [
            cx + (x - cx) * c - (y - cy) * s + dx,
            cy + (x - cx) * s + (y - cy) * c + dy
        ];
    }
    path(pts, close) {
        const g = this.g;
        g.beginPath();
        pts.forEach((p, i)=>{
            const [x, y] = this.P(p[0], p[1]);
            if (i) g.lineTo(x, y);
            else g.moveTo(x, y);
        });
        if (close) g.closePath();
    }
    poly(pts, fill, ol) {
        const g = this.g, w = ol ?? this.ol;
        this.path(pts, true);
        if (fill) {
            g.fillStyle = fill;
            g.fill();
        }
        if (w) {
            g.lineWidth = w;
            g.strokeStyle = INK;
            g.lineJoin = "round";
            g.stroke();
        }
    }
    ell(cx, cy, rx, ry, fill, ol, a0 = 0, a1 = 360, rot = 0) {
        this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
    }
    line(pts, fill, w, ink = true) {
        const g = this.g;
        g.lineCap = "round";
        g.lineJoin = "round";
        if (ink) {
            this.path(pts, false);
            g.strokeStyle = INK;
            g.lineWidth = w + 2 * this.ol * 0.9;
            g.stroke();
        }
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
    }
    stroke(pts, w, fill = INK) {
        const g = this.g;
        g.lineCap = "round";
        g.lineJoin = "round";
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
    }
    arc(cx, cy, rx, ry, a0, a1, w, fill = INK) {
        const pts = [];
        for(let i = 0; i <= 24; i++)pts.push([
            cx + rx * Math.cos(rad(a0 + (a1 - a0) * i / 24)),
            cy + ry * Math.sin(rad(a0 + (a1 - a0) * i / 24))
        ]);
        this.stroke(pts, w, fill);
    }
    dot(cx, cy, r, fill = INK) {
        const [x, y] = this.P(cx, cy);
        this.g.beginPath();
        this.g.arc(x, y, r, 0, Math.PI * 2);
        this.g.fillStyle = fill;
        this.g.fill();
    }
    clip(pts, fn) {
        const g = this.g;
        g.save();
        this.path(pts, true);
        g.clip();
        fn();
        g.restore();
    }
    shadedFill(pts, base, shadow, light, R, shift = 0.45, r0 = 1.05, r1 = 1.25) {
        const g = this.g, n = pts.length;
        let cx = 0, cy = 0;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
        }
        const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
        const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
        gr.addColorStop(0, base);
        gr.addColorStop(r0 / r1, base);
        gr.addColorStop(1, shadow);
        this.path(pts, true);
        g.fillStyle = gr;
        g.fill();
    }
    gradFill(pts, base, shadow, light, flat = 0.22) {
        const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
        let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
            const d = x * dx + y * dy;
            lo = Math.min(lo, d);
            hi = Math.max(hi, d);
        }
        const dc = cx * dx + cy * dy;
        const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
        const gr = g.createLinearGradient(ax, ay, bx, by);
        gr.addColorStop(0, base);
        gr.addColorStop(flat, base);
        gr.addColorStop(1, shadow);
        this.path(pts, true);
        g.fillStyle = gr;
        g.fill();
    }
    inkRing(pts, w0, thick, k = 0.45, col = INK) {
        const n = pts.length;
        let cx = 0, cy = 0;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
        }
        const out = [], inn = [];
        pts.forEach((q, i)=>{
            const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
            let nx = b[1] - a[1], ny = a[0] - b[0];
            const l = Math.hypot(nx, ny) || 1;
            nx /= l;
            ny /= l;
            const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
            out.push([
                q[0] + nx * h,
                q[1] + ny * h
            ]);
            inn.push([
                q[0] - nx * h,
                q[1] - ny * h
            ]);
        });
        const g = this.g;
        const trace = (r)=>{
            r.forEach(([x0, y0], i)=>{
                const [x, y] = this.P(x0, y0);
                if (i) g.lineTo(x, y);
                else g.moveTo(x, y);
            });
            g.closePath();
        };
        g.beginPath();
        trace(out);
        trace(inn.reverse());
        g.fillStyle = col;
        g.fill("evenodd");
    }
    band(pts, fill, w, rim, cap = "butt") {
        const g = this.g;
        g.lineCap = cap;
        g.lineJoin = "round";
        this.path(pts, false);
        g.strokeStyle = INK;
        g.lineWidth = w + 2 * rim;
        g.stroke();
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
        g.lineCap = "round";
    }
}
const ellPts = (cx, cy, rx, ry, a0 = 0, a1 = 360, rot = 0, n = 48)=>{
    const r = rad(rot), pts = [];
    for(let i = 0; i <= n; i++){
        const a = rad(a0 + (a1 - a0) * i / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
        pts.push([
            cx + x * Math.cos(r) - y * Math.sin(r),
            cy + x * Math.sin(r) + y * Math.cos(r)
        ]);
    }
    return pts;
};
const rrect = (x0, y0, x1, y1, r, n = 8)=>{
    const pts = [];
    for (const [cx, cy, a] of [
        [
            x1 - r,
            y0 + r,
            -90
        ],
        [
            x1 - r,
            y1 - r,
            0
        ],
        [
            x0 + r,
            y1 - r,
            90
        ],
        [
            x0 + r,
            y0 + r,
            180
        ]
    ])for(let i = 0; i <= n; i++)pts.push([
        cx + r * Math.cos(rad(a + 90 * i / n)),
        cy + r * Math.sin(rad(a + 90 * i / n))
    ]);
    return pts;
};
const taper = (p, a, b, wa, wb, col = INK)=>{
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    p.poly([
        [
            a[0] + nx * wa / 2,
            a[1] + ny * wa / 2
        ],
        [
            b[0] + nx * wb / 2,
            b[1] + ny * wb / 2
        ],
        [
            b[0] - nx * wb / 2,
            b[1] - ny * wb / 2
        ],
        [
            a[0] - nx * wa / 2,
            a[1] - ny * wa / 2
        ]
    ], col, 0);
    p.dot(a[0], a[1], wa / 2, col);
    p.dot(b[0], b[1], wb / 2, col);
};
export const blobPts = (cx, cy, B, n = 72)=>{
    const ph = [
        rnd(B.seed, 11),
        rnd(B.seed, 12),
        rnd(B.seed, 13)
    ].map((v)=>v * Math.PI * 2);
    const pts = [];
    for(let i = 0; i < n; i++){
        const t = i / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
        let X = Math.sign(c) * Math.abs(c) ** e;
        const Y = Math.sign(s) * Math.abs(s) ** e;
        X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
        const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
        const x = B.a * X * r, y = B.b * Y * r;
        pts.push([
            cx + x * Math.cos(B.rot) - y * Math.sin(B.rot),
            cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)
        ]);
    }
    return pts;
};
export const headBlob = (seed, a = 118, facing = 0)=>({
        a,
        b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
        nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5),
        nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
        egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
        asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
        rot: rad(8 * (rnd(seed, 7) - 0.5)),
        noise: 0.008,
        seed
    });
export const thickAngle = (light)=>Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);
const FACE = {
    neutral: {
        eye: [
            "lid",
            "lid"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "dash"
    },
    stern: {
        eye: [
            "lid",
            "lid"
        ],
        brow: [
            3,
            -2
        ],
        mouth: "frown"
    },
    grin: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -3,
            -3
        ],
        mouth: "grin"
    },
    laugh: {
        eye: [
            "squeeze",
            "squeeze"
        ],
        brow: [
            -4,
            -4
        ],
        mouth: "laugh"
    },
    whistle: {
        eye: [
            "dash",
            "dash"
        ],
        brow: [
            -2,
            -4
        ],
        mouth: "o"
    },
    nervous: {
        eye: [
            "small",
            "small"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "wave"
    },
    shock: {
        eye: [
            "shock",
            "shock"
        ],
        brow: [
            -7,
            -6
        ],
        mouth: "O"
    },
    relief: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -2,
            1
        ],
        mouth: "smileWide"
    },
    relief_open: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -2,
            1
        ],
        mouth: "grin"
    },
    dazed: {
        eye: [
            "spiral",
            "spiral"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "wave"
    },
    pained: {
        eye: [
            "squeeze",
            "lid"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "teeth"
    },
    smile: {
        eye: [
            "dot",
            "dot"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "smirk"
    },
    smile_closed: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "smile"
    },
    lick: {
        eye: [
            "dot",
            "dot"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "lick"
    }
};
const halfLid = (k)=>k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k;
const eyeKind = (k, lid)=>lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
const lidOf = (b)=>b === true ? 1 : Number(b) || 0;
const eye = (p, kind, x, ey, u, side, look, skin)=>{
    const lx = x + look * 3 * u, lw = 3.8 * u;
    switch(kind){
        case "dot":
            p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0);
            break;
        case "small":
            p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0);
            break;
        case "lid":
            p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180);
            p.stroke([
                [
                    x - 9 * u,
                    ey - u
                ],
                [
                    x + 9 * u,
                    ey - u
                ]
            ], lw);
            break;
        case "slit":
            p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180);
            p.stroke([
                [
                    x - 9 * u,
                    ey
                ],
                [
                    x + 9 * u,
                    ey
                ]
            ], lw);
            break;
        case "happy":
            p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw);
            break;
        case "dash":
            p.stroke([
                [
                    x - 8.5 * u,
                    ey
                ],
                [
                    x + 8.5 * u,
                    ey
                ]
            ], lw);
            break;
        case "squeeze":
            p.stroke([
                [
                    x + 6 * u * side,
                    ey - 5 * u
                ],
                [
                    x - 6 * u * side,
                    ey
                ],
                [
                    x + 6 * u * side,
                    ey + 5 * u
                ]
            ], lw);
            break;
        case "shock":
        case "shockHalf":
            p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u);
            p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
            if (kind === "shockHalf") {
                p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360);
                p.stroke([
                    [
                        x - 11 * u,
                        ey
                    ],
                    [
                        x + 11 * u,
                        ey
                    ]
                ], 2.6 * u);
            }
            break;
        default:
            {
                const s = [];
                for(let t = 1; t < 15; t++)s.push([
                    x + Math.cos(t * 0.9) * t * 0.55 * u,
                    ey + Math.sin(t * 0.9) * t * 0.55 * u
                ]);
                p.stroke(s, 2.4 * u);
            }
    }
};
const dmouth = (p, mx, y, rx, ry, u, tongue = false)=>{
    p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
    p.clip([
        [
            mx - rx,
            y
        ],
        [
            mx + rx,
            y
        ],
        [
            mx + rx,
            y + 3 * u
        ],
        [
            mx - rx,
            y + 3 * u
        ]
    ], ()=>p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
    if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
    p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};
const mouth = (p, kind, mx, my, u, k = 1)=>{
    const mw = 4 * u;
    switch(kind){
        case "dash":
            p.stroke([
                [
                    mx - 5.5 * u * k,
                    my
                ],
                [
                    mx + 5.5 * u * k,
                    my - 0.8 * u
                ]
            ], mw);
            break;
        case "frown":
            p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw);
            break;
        case "smirk":
            p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw);
            break;
        case "smile":
            p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw);
            break;
        case "smileWide":
            p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw);
            break;
        case "grin":
            dmouth(p, mx, my - u, 12 * u * k, 8 * u, u);
            break;
        case "laugh":
            dmouth(p, mx, my, 16 * u * k, 11 * u, u, true);
            break;
        case "o":
            p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u);
            break;
        case "O":
            p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u);
            break;
        case "wave":
            {
                const s = [];
                for(let i = 0; i <= 12; i++)s.push([
                    mx - 9 * u * k + i * 1.5 * u * k,
                    my + 1.5 * u * Math.sin(i * 1.3)
                ]);
                p.stroke(s, 3 * u);
                break;
            }
        case "teeth":
            p.poly([
                [
                    mx - 12 * u * k,
                    my - 4 * u
                ],
                [
                    mx + 12 * u * k,
                    my - 4 * u
                ],
                [
                    mx + 11 * u * k,
                    my + 4 * u
                ],
                [
                    mx - 11 * u * k,
                    my + 4 * u
                ]
            ], WHITE, 3 * u);
            for (const j of [
                -1,
                0,
                1
            ])p.stroke([
                [
                    mx + j * 6 * u * k,
                    my - 4 * u
                ],
                [
                    mx + j * 6 * u * k,
                    my + 4 * u
                ]
            ], 1.5 * u);
            break;
        case "lick":
            p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw);
            p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u);
            break;
    }
};
const faceFront = (p, cx, cy, W, expr, facing, look, lid, brim, skin, moustache, stout = false)=>{
    const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing;
    const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
    for (const side of [
        -1,
        1
    ]){
        const x = fx + side * ex;
        const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
        eye(p, kind, x, ey, u, side, look, skin);
        const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
        if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
        else taper(p, [
            x - side * 8.5 * u,
            by + dI * u
        ], [
            x + side * 8.5 * u,
            by + dO * u
        ], 5 * u, 2.5 * u);
    }
    const mx = cx + 8 * u * facing, my = cy + 20 * u;
    mouth(p, F.mouth, mx, my, u);
    if (moustache) for (const s of [
        -1,
        1
    ])taper(p, [
        mx + s * 1.5 * u,
        cy + 12.5 * u
    ], [
        mx + s * (stout ? 19 : 15) * u,
        cy + (stout ? 10.5 : 15) * u
    ], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
    if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};
const faceSide = (p, hx, hy, W, expr, lid, brim, skin, moustache, stout = false)=>{
    const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
    const kind = eyeKind(F.eye[1], lid);
    eye(p, kind, ex, ey, u, 1, 0.6, skin);
    const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
    if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [
        ex + 8 * u,
        by + dI * u
    ], [
        ex - 7 * u,
        by - u + dO * u
    ], 5 * u, 2.5 * u);
    p.stroke([
        [
            hx + 44 * u,
            hy + 4 * u
        ],
        [
            hx + 47.5 * u,
            hy + 9 * u
        ],
        [
            hx + 43 * u,
            hy + 10 * u
        ]
    ], 3 * u);
    mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
    if (moustache) taper(p, [
        hx + 41 * u,
        hy + 13.5 * u
    ], [
        hx + 25 * u,
        hy + (stout ? 11.5 : 16) * u
    ], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
    if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};
const BONNET = "#e9cf8f", BONNET_BRIM = "#d6b46a";
const hatBehind = (p, o, H, cx, hc, light, thick, ow, side)=>{
    if (o.hat !== "bonnet") return;
    const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, {
        ...H,
        a: H.a * 1.17,
        b: H.b * 1.13,
        asym: 0,
        egg: 0.04,
        seed: H.seed + 3
    });
    p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
    p.inkRing(bb, ow * 0.85, thick);
};
const hatOn = (p, o, hp, H, cx, hc, light, seed, facing, side)=>{
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
    const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5));
    const R = (pts)=>rotPts(pts, a, cx, hc);
    const sag = (yb, wb)=>{
        const base = [];
        for(let i = 0; i <= 12; i++){
            const t = i / 12;
            base.push([
                cx + wb * (2 * t - 1),
                yb + 3 * u * (1 - (2 * t - 1) ** 2)
            ]);
        }
        return base;
    };
    if (o.hat === "shako" || o.hat === "shako_tall") {
        const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
        const body = R([
            ...sag(yb, wb).reverse(),
            [
                cx - wt,
                yb - ht
            ],
            [
                cx + wt,
                yb - ht
            ]
        ]);
        p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
        if (tall) p.clip(body, ()=>p.band(R([
                [
                    cx - wt - 5 * u,
                    yb - ht + 0.07 * HH
                ],
                [
                    cx + wt + 5 * u,
                    yb - ht + 0.07 * HH
                ]
            ]), "#e8c45a", 0.06 * HH, 1.5 * u));
        p.poly(body, null, ow);
        const deg = a * 180 / Math.PI;
        if (side) {
            p.poly(R([
                [
                    cx + 36 * u,
                    yb - 1 * u
                ],
                [
                    cx + 60 * u,
                    yb + 8 * u
                ],
                [
                    cx + 34 * u,
                    yb + 6 * u
                ]
            ]), "#16171b", 2.5 * u);
            const [tx, ty] = R([
                [
                    cx + 24 * u,
                    yb - ht - 6 * u
                ]
            ])[0];
            p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
        } else {
            const [px, py] = R([
                [
                    cx + 3 * u * facing,
                    yb + 3 * u
                ]
            ])[0];
            p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg);
            const [bx, by] = R([
                [
                    cx,
                    yb - 0.45 * ht
                ]
            ])[0];
            p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg);
            p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
            const [tx, ty] = R([
                [
                    cx,
                    yb - ht - 6 * u
                ]
            ])[0];
            p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
        }
    } else if (o.hat === "cap" || o.hat === "hair") {
        const cut = crown + (o.hat === "cap" ? 0.3 : 0.42) * HH;
        const keep = (x, y)=>y < cut || side && o.hat === "hair" && x < cx - 6 * u && y < hc + 0.42 * H.b;
        const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i)=>keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
        const arc = [
            ...hp.slice(startIdx),
            ...hp.slice(0, startIdx)
        ].filter(([x, y])=>keep(x, y)).map(([x, y])=>[
                cx + (x - cx) * 1.03,
                hc + (y - hc) * 1.03
            ]);
        if (arc.length < 3) return;
        if (o.hat === "hair") {
            const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
            for(let i = 1; i < 6; i++)arc.push([
                x0 + (x1 - x0) * i / 6,
                y0 + (y1 - y0) * i / 6 + (i % 2 ? 4 * u : 0)
            ]);
        }
        const col = o.hat === "cap" ? o.cap : o.hair;
        p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
        p.poly(arc, null, ow);
        if (o.hat === "hair") {
            const s = side ? -1 : facing || 1;
            p.stroke([
                [
                    cx + s * 10 * u,
                    cut - 30 * u
                ],
                [
                    cx + s * 2 * u,
                    cut - 12 * u
                ]
            ], 1.2 * u);
        }
        if (o.hat === "cap") {
            const deg = a * 180 / Math.PI;
            if (side) p.poly(R([
                [
                    cx + 40 * u,
                    cut - 2 * u
                ],
                [
                    cx + 74 * u,
                    cut + 4 * u
                ],
                [
                    cx + 40 * u,
                    cut + 6 * u
                ]
            ]), shade(col, 0.8), ow);
            else {
                const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([
                    [
                        cx + s * 4 * u,
                        cut + 1.5 * u
                    ]
                ])[0];
                p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
            }
        }
    } else if (o.hat === "tophat") {
        const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = o.hatCol || "#2e2a36";
        const body = R([
            ...sag(yb, wb).reverse(),
            [
                cx - wt,
                yb - ht
            ],
            [
                cx + wt,
                yb - ht
            ]
        ]);
        p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
        p.clip(body, ()=>p.band(R([
                [
                    cx - wt - 4 * u,
                    yb - 0.13 * HH
                ],
                [
                    cx + wt + 4 * u,
                    yb - 0.13 * HH
                ]
            ]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
        p.poly(body, null, ow);
        const [bx, by] = R([
            [
                cx,
                yb + 1 * u
            ]
        ])[0];
        p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, a * 180 / Math.PI);
    } else if (o.hat === "bonnet") {
        const [bx, by] = R([
            [
                cx + (side ? 6 * u : 0),
                crown + 0.16 * HH
            ]
        ])[0];
        p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
        p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
        const cy = hc + H.b * 0.98;
        p.stroke([
            [
                cx - 14 * u,
                cy - 4 * u
            ],
            [
                cx,
                cy + 2 * u
            ],
            [
                cx + 14 * u,
                cy - 4 * u
            ]
        ], 2 * u, BONNET_BRIM);
    }
};
const BUILD = {
    adult: {
        a: 118,
        torso: 1.1,
        legs: 1.4,
        tw: 0.8
    },
    stout: {
        a: 118,
        torso: 1.15,
        legs: 1.32,
        tw: 0.92
    },
    kid: {
        a: 112,
        torso: 0.85,
        legs: 1.0,
        tw: 0.72
    }
};
const footStroke = (p, a, b, w, col)=>{
    if (col !== INK) p.stroke([
        a,
        b
    ], w + 3, INK);
    p.stroke([
        a,
        b
    ], w, col);
};
export const bodyFront = (p, o, opts)=>{
    const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, tilt = 0, headTilt = 0, wave, light = DEF_LIGHT, facing = 0, seed = 1 } = opts;
    const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
    const H = headBlob(seed, Bd.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
    const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
    const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase) : 0;
    const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - Bd.legs * HH + bob;
    const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
    const thick = thickAngle(light), ow = 5 * u;
    const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
    const legW = 5.8 * u, footW = 7.5 * u;
    p.rot = null;
    if (mode === "sit") {
        for (const side of [
            -1,
            1
        ]){
            const h = [
                300 + side * 15 * u,
                hipY
            ], k = [
                300 + side * 36 * u,
                hipY + 0.2 * HH
            ], f = [
                300 + side * 44 * u,
                sole - 8 * u
            ];
            p.stroke(curve(h, k, f), legW, legCol);
            footStroke(p, [
                f[0] - side * 2 * u,
                f[1]
            ], [
                f[0] + side * 12 * u,
                f[1] - 5 * u
            ], footW, footCol);
        }
    } else if (mode === "fall") {
        const legs = [
            [
                [
                    300 - 15 * u,
                    hipY
                ],
                [
                    300 - 46 * u,
                    hipY + 0.5 * HH
                ],
                [
                    300 - 70 * u,
                    hipY + 0.72 * HH
                ]
            ],
            [
                [
                    300 + 15 * u,
                    hipY
                ],
                [
                    300 + 50 * u,
                    hipY + 0.45 * HH
                ],
                [
                    300 + 76 * u,
                    hipY + 0.22 * HH
                ]
            ]
        ];
        legs.forEach(([h, k, f], i)=>{
            p.stroke(curve(h, k, f), legW, legCol);
            footStroke(p, f, [
                f[0] + (i ? 14 : -14) * u,
                f[1] + (i ? -6 : 4) * u
            ], footW, footCol);
        });
    } else if (o.dress) {
        for (const side of [
            -1,
            1
        ]){
            const fx = 300 + side * 12 * u, fy = sole - 4 * u;
            p.stroke([
                [
                    fx,
                    sole - 0.4 * HH
                ],
                [
                    fx + side * u,
                    fy
                ]
            ], legW, legCol);
            footStroke(p, [
                fx - side * 3 * u,
                fy
            ], [
                fx + side * 12 * u,
                fy + u
            ], footW, footCol);
        }
    } else {
        const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
        for (const [side, ph] of [
            [
                -1,
                0
            ],
            [
                1,
                0.5
            ]
        ]){
            const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
            const hx = 300 + side * 15 * u, fx = 300 + side * 22 * u, fy = sole - 4 * u - up;
            const k = [
                (hx + fx) / 2 + side * (1.5 * u + up * 0.16),
                (hipY + fy) / 2 - up * 0.08
            ];
            p.stroke(curve([
                hx,
                hipY
            ], k, [
                fx,
                fy
            ]), legW, legCol);
            footStroke(p, [
                fx - side * 3 * u,
                fy
            ], [
                fx + side * 13 * u,
                fy + 0.5 * u
            ], footW, footCol);
        }
    }
    const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : 0;
    const A = tilt + sway;
    p.rot = A ? [
        rad(A),
        300,
        hipY
    ] : null;
    const dress = !!o.dress && mode !== "sit" && mode !== "fall";
    const T = {
        a: Bd.tw / 2 * W / 1.06,
        b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
        nTop: 2.2,
        nBot: 2.6,
        egg: o.build === "stout" ? 0.17 : 0.12,
        asym: 0.04 * facing,
        rot: 0,
        noise: 0.006,
        seed: seed + 7
    };
    const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
    const sh = (side)=>[
            tcx + side * 0.85 * T.a,
            chin + 0.12 * HH
        ];
    const hang = (side, fwd)=>{
        const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
        const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
        return [
            S,
            [
                ex,
                S[1] + 0.48 * HH
            ],
            [
                hx,
                chin + 1.04 * HH - Math.abs(fwd) * 9 * u
            ]
        ];
    };
    const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
    const R0 = [
        300 + 47 * u,
        torsoBot + 0.12 * HH
    ], R1 = [
        300 + 64 * u,
        crown - 0.32 * HH
    ];
    const rifle = !!o.rifle && (mode === "march" || mode === "stand" || mode === "stroll");
    const arms = [];
    if (mode === "sit") for (const side of [
        -1,
        1
    ])arms.push({
        pts: [
            sh(side),
            [
                tcx + side * (1.1 * T.a + 6 * u),
                sh(side)[1] + 0.4 * HH
            ],
            [
                tcx + side * (1.2 * T.a + 10 * u),
                torsoBot + 0.04 * HH
            ]
        ],
        front: false
    });
    else if (mode === "fall") for (const side of [
        -1,
        1
    ])arms.push({
        pts: [
            sh(side),
            [
                tcx + side * (1.15 * T.a + 12 * u),
                sh(side)[1] - 0.25 * HH
            ],
            [
                tcx + side * (1.3 * T.a + 24 * u),
                sh(side)[1] - 0.68 * HH
            ]
        ],
        front: false
    });
    else {
        arms.push({
            pts: prop === "shako" ? hang(-1, 0) : hang(-1, -sw),
            front: false
        });
        if (rifle) {
            const G = lerp2(R0, R1, 0.1);
            arms.push({
                pts: [
                    sh(1),
                    [
                        tcx + 1.12 * T.a + 5 * u,
                        sh(1)[1] + 0.45 * HH
                    ],
                    G
                ],
                front: false
            });
        } else if (wave !== undefined) {
            const S = sh(1);
            arms.push({
                pts: [
                    S,
                    [
                        tcx + 1.1 * T.a + 10 * u + 3 * u * wave,
                        S[1] - 0.22 * HH
                    ],
                    [
                        tcx + 1.18 * T.a + 16 * u + 12 * u * wave,
                        S[1] - 0.6 * HH
                    ]
                ],
                front: false
            });
        } else if (prop === "icecream") {
            const S = sh(1);
            arms.push({
                pts: [
                    S,
                    [
                        tcx + 1.05 * T.a + 4 * u,
                        S[1] + 0.45 * HH
                    ],
                    [
                        tcx + 0.5 * T.a,
                        S[1] + 0.4 * HH
                    ]
                ],
                front: true
            });
        } else if (Array.isArray(prop)) {
            const S = sh(1), k = clamp(prop[1], 0, 1);
            const E = lerp2([
                tcx + 1.1 * T.a + 10 * u,
                S[1] - 0.15 * HH
            ], [
                tcx + 1.2 * T.a + 10 * u,
                S[1] + 0.3 * HH
            ], k);
            const Hd = lerp2([
                tcx + 1.15 * T.a + 14 * u,
                S[1] - 0.55 * HH
            ], [
                tcx + 1.45 * T.a + 22 * u,
                S[1] + 0.35 * HH
            ], k);
            arms.push({
                pts: [
                    S,
                    E,
                    Hd
                ],
                front: true
            });
        } else arms.push({
            pts: hang(1, sw),
            front: false
        });
    }
    const drawArm = (a)=>{
        p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
        p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u);
    };
    if (rifle) {
        p.band([
            R0,
            R1
        ], "#7a4b2a", 5 * u, 1.5 * u, "round");
        p.band([
            lerp2(R0, R1, 0.6),
            R1
        ], "#8d949c", 2.4 * u, 1.2 * u, "round");
    }
    if (o.sword && mode !== "sit") {
        const s0 = [
            tcx - 0.75 * T.a,
            torsoBot - 0.2 * HH
        ];
        p.band([
            s0,
            [
                s0[0] - Math.sin(rad(25)) * 0.8 * HH,
                s0[1] + Math.cos(rad(25)) * 0.8 * HH
            ]
        ], "#c9ccd2", 3 * u, 1.2 * u, "round");
    }
    for (const a of arms)if (!a.front) drawArm(a);
    if (dress) {
        const D = {
            a: 0.5 * W * 0.98,
            b: 0.5 * (sole - 0.35 * HH - (chin - 0.2 * HH)),
            nTop: 2.0,
            nBot: 3.0,
            egg: 0.35,
            asym: 0.03 * facing,
            rot: 0,
            noise: 0.006,
            seed: seed + 9
        };
        const dp = blobPts(300, sole - 0.35 * HH - D.b, D);
        p.gradFill(dp, o.dress, mul(o.dress, SH_CLOTH), light);
        p.inkRing(dp, ow, thick);
        const Sw = {
            a: 0.37 * W,
            b: 0.3 * HH,
            nTop: 2.2,
            nBot: 2.4,
            egg: 0.1,
            asym: 0,
            rot: 0,
            noise: 0.006,
            seed: seed + 8
        };
        const sp = blobPts(300, chin + 0.12 * HH, Sw);
        p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
        p.inkRing(sp, ow * 0.9, thick);
    } else {
        p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
        p.clip(tp, ()=>{
            if (o.belt) {
                for (const s of [
                    -1,
                    1
                ])p.band([
                    [
                        tcx - s * 0.75 * T.a,
                        chin - 0.05 * HH
                    ],
                    [
                        tcx + s * 0.8 * T.a,
                        torsoBot - 0.1 * HH
                    ]
                ], o.belt, 5.5 * u, 1.8 * u);
                const xc = tcx + 0.025 * T.a, yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
                p.poly([
                    [
                        xc - 3.5 * u,
                        yc - 3.5 * u
                    ],
                    [
                        xc + 3.5 * u,
                        yc - 3.5 * u
                    ],
                    [
                        xc + 3.5 * u,
                        yc + 3.5 * u
                    ],
                    [
                        xc - 3.5 * u,
                        yc + 3.5 * u
                    ]
                ], "#d9dde0", 1.5 * u);
            }
            if (o.sash) p.band([
                [
                    tcx - 1.3 * T.a,
                    torsoBot - 0.32 * HH
                ],
                [
                    tcx + 1.3 * T.a,
                    torsoBot - 0.32 * HH
                ]
            ], o.sash, 0.13 * HH, 1.8 * u);
            for(let i = 0; i < 4; i++){
                const y = chin + 0.12 * HH + i * 0.2 * HH;
                if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
                p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK);
                p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
            }
        });
        if (o.sash) {
            const s = facing || 1;
            p.poly([
                [
                    tcx + s * 0.55 * T.a,
                    torsoBot - 0.3 * HH
                ],
                [
                    tcx + s * 0.75 * T.a,
                    torsoBot + 0.05 * HH
                ],
                [
                    tcx + s * 0.45 * T.a,
                    torsoBot + 0.02 * HH
                ]
            ], o.sash, 1.6 * u);
        }
        p.inkRing(tp, ow, thick);
    }
    for (const a of arms)if (a.front) {
        drawArm(a);
        const [hx, hy] = a.pts[2];
        if (prop === "icecream") {
            p.poly([
                [
                    hx - 8 * u,
                    hy - 12 * u
                ],
                [
                    hx + 8 * u,
                    hy - 12 * u
                ],
                [
                    hx,
                    hy + 7 * u
                ]
            ], "#e0a35a", 1.8 * u);
            p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
            p.dot(hx, hy, 5.5 * u);
        } else if (Array.isArray(prop)) {
            const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
            const Rh = (pts)=>rotPts(pts, ang, hx, hy);
            p.band(Rh([
                [
                    hx,
                    hy + 12 * u
                ],
                [
                    hx,
                    hy - 44 * u
                ]
            ]), "#8a5a34", 5 * u, 1.5 * u, "round");
            p.poly(Rh([
                [
                    hx - 12 * u,
                    hy - 58 * u
                ],
                [
                    hx + 20 * u,
                    hy - 58 * u
                ],
                [
                    hx + 20 * u,
                    hy - 42 * u
                ],
                [
                    hx - 12 * u,
                    hy - 42 * u
                ]
            ]), "#7d848c", 2.2 * u);
            p.dot(hx, hy, 5.5 * u);
        }
    }
    if (prop === "shako") {
        const [hx, hy] = arms[0].pts[2];
        p.poly([
            [
                hx - 14 * u,
                hy + 3 * u
            ],
            [
                hx + 14 * u,
                hy + 3 * u
            ],
            [
                hx + 16 * u,
                hy + 30 * u
            ],
            [
                hx - 16 * u,
                hy + 30 * u
            ]
        ], "#3a3d47", 2.2 * u);
        p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
        p.dot(hx, hy, 5.5 * u);
    }
    const Ah = A + headTilt, [cpx, cpy] = rotAbout([
        300,
        chin
    ], rad(A), [
        300,
        hipY
    ]);
    p.rot = Ah ? [
        rad(Ah),
        300,
        chin,
        cpx - 300,
        cpy - chin
    ] : null;
    hatBehind(p, o, H, 300, hc, light, thick, ow, false);
    const hp = blobPts(300, hc, H);
    p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
    p.inkRing(hp, ow, thick);
    hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
    const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
    faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout");
    p.rot = null;
};
const ik = (hip, ank, l1, l2)=>{
    const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
    const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
    return [
        hip[0] + l1 * Math.cos(k),
        hip[1] + l1 * Math.sin(k)
    ];
};
const SWING_HIP = 733;
export const bodySide = (p, o, opts)=>{
    const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
    const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
    const H = {
        ...headBlob(seed, Bd.a, 1),
        asym: 0.12,
        rot: rad(3 + 3 * (rnd(seed, 7) - 0.5))
    };
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
    const thick = thickAngle(light), ow = 5 * u;
    const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
    const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
    const legs = [];
    let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
    if (mode === "march") {
        const S = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
        const st = (ph)=>{
            const c = ((phase + ph) % 1 + 1) % 1;
            if (c < 0.5) {
                const s = c / 0.5;
                return {
                    x: S / 2 - S * s,
                    h: 0,
                    stance: true,
                    s
                };
            }
            const s = (c - 0.5) / 0.5;
            return {
                x: -S / 2 + S * s - S / Math.PI * Math.sin(2 * Math.PI * s),
                h: liftH * Math.sin(Math.PI * s),
                stance: false,
                s
            };
        };
        const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
        const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
        hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
        for (const [L, near] of [
            [
                fL,
                false
            ],
            [
                nL,
                true
            ]
        ])legs.push({
            ank: [
                300 + L.x,
                ankY - L.h
            ],
            pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)),
            near
        });
        lean = 4 + 3 * Math.cos(2 * two * phase);
        nearFwd = nL.x / (S / 2);
    } else if (mode === "push") {
        hipY = ankY - 0.87 * legLen;
        legs.push({
            ank: [
                300 - 0.5 * legLen,
                ankY
            ],
            pitch: rad(-8),
            near: false
        }, {
            ank: [
                300 + 0.32 * legLen,
                ankY
            ],
            pitch: 0,
            near: true
        });
        lean = 14 * pose;
    } else if (mode === "swing") {
        hipY = SWING_HIP;
        const a = rad(60 * pose);
        for (const [dx, near] of [
            [
                -6,
                false
            ],
            [
                0,
                true
            ]
        ]){
            const knee = [
                300 + l1 * 0.98 + dx * u,
                hipY + 6 * u
            ];
            legs.push({
                ank: [
                    knee[0] + l2 * Math.sin(a),
                    knee[1] + l2 * Math.cos(a)
                ],
                pitch: -a * 0.5,
                near
            });
        }
    } else {
        legs.push({
            ank: [
                300 - 4 * u,
                ankY
            ],
            pitch: 0,
            near: false
        }, {
            ank: [
                300 + 4 * u,
                ankY
            ],
            pitch: 0,
            near: true
        });
    }
    const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip = [
        300,
        hipY
    ];
    p.rot = null;
    for (const L of legs){
        const knee = mode === "swing" ? [
            300 + l1 * 0.98 + (L.near ? 0 : -6 * u),
            hipY + 6 * u
        ] : ik(hip, L.ank, l1, l2);
        const hp0 = [
            300 + (L.near ? 0 : -5 * u),
            hipY
        ];
        p.stroke([
            hp0,
            knee,
            L.ank
        ], 5.8 * u, L.near ? nearCol : farCol);
        const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
        footStroke(p, [
            L.ank[0] - 3 * u * c,
            L.ank[1] - 3 * u * s
        ], [
            L.ank[0] + 13 * u * c,
            L.ank[1] + 13 * u * s + 0.5 * u
        ], 7.5 * u, L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82));
    }
    p.rot = lean ? [
        rad(lean),
        300,
        hipY
    ] : null;
    const T = {
        a: (o.build === "stout" ? 0.36 : 0.31) * W,
        b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
        nTop: 2.2,
        nBot: 2.5,
        egg: 0.1,
        asym: 0.06,
        rot: 0,
        noise: 0.006,
        seed: seed + 7
    };
    const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
    const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
    const S = [
        tcx + 0.05 * T.a,
        chin + 0.14 * HH
    ], aLen = 0.95 * HH;
    const swingArm = (ang)=>{
        const e = [
            S[0] + Math.sin(ang) * aLen * 0.5,
            S[1] + Math.cos(ang) * aLen * 0.5
        ], a2 = ang + rad(16) * Math.sign(ang || 1);
        return [
            S,
            e,
            [
                e[0] + Math.sin(a2) * aLen * 0.5,
                e[1] + Math.cos(a2) * aLen * 0.5
            ]
        ];
    };
    const rifle = !!o.rifle && (mode === "march" || mode === "stand");
    const B0 = [
        tcx + 0.72 * T.a,
        chin + 0.58 * HH
    ], B1 = [
        tcx - 0.95 * T.a - 22 * u,
        crown - 0.4 * HH
    ];
    let near, far;
    if (mode === "swing") {
        near = [
            S,
            [
                S[0] + 12 * u,
                S[1] - 0.16 * HH
            ],
            [
                300 + 6 * u,
                chin - 0.3 * HH
            ]
        ];
        far = [
            S,
            [
                S[0] + 8 * u,
                S[1] - 0.18 * HH
            ],
            [
                300 + 2 * u,
                chin - 0.36 * HH
            ]
        ];
    } else if (mode === "push") {
        const reach = 0.55 * HH + 0.45 * HH * pose;
        let hN = [
            S[0] + reach,
            S[1] + 0.06 * HH
        ];
        if (opts.hand) {
            const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
            const tg = [
                300 + dx * Math.cos(th) - dy * Math.sin(th),
                hipY + dx * Math.sin(th) + dy * Math.cos(th)
            ];
            hN = [
                hN[0] + (tg[0] - hN[0]) * pose,
                hN[1] + (tg[1] - hN[1]) * pose
            ];
        }
        near = [
            S,
            [
                (S[0] + hN[0]) / 2,
                (S[1] + hN[1]) / 2 + 0.06 * HH
            ],
            hN
        ];
        far = [
            S,
            [
                (S[0] + hN[0]) / 2 - 4 * u,
                (S[1] + hN[1]) / 2 - 0.02 * HH
            ],
            [
                hN[0] - 6 * u,
                hN[1] - 0.08 * HH
            ]
        ];
    } else if (rifle) {
        near = [
            S,
            [
                S[0] - 4 * u,
                S[1] + 0.42 * HH
            ],
            B0
        ];
        far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0);
    } else {
        near = swingArm(rad(-30) * nearFwd);
        far = mode === "march" ? swingArm(rad(30) * nearFwd) : null;
    }
    if (far) {
        p.stroke(curve(far[0], far[1], far[2]), 5.2 * u, farArm);
        p.dot(far[2][0], far[2][1], 5.5 * u);
    }
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, ()=>{
        if (o.belt) p.band([
            [
                tcx - 0.65 * T.a,
                chin - 0.05 * HH
            ],
            [
                tcx + 0.75 * T.a,
                torsoBot - 0.1 * HH
            ]
        ], o.belt, 5.5 * u, 1.8 * u);
        if (o.sash) p.band([
            [
                tcx - 1.3 * T.a,
                torsoBot - 0.32 * HH
            ],
            [
                tcx + 1.3 * T.a,
                torsoBot - 0.32 * HH
            ]
        ], o.sash, 0.13 * HH, 1.8 * u);
        if (!o.dress) for(let i = 0; i < 3; i++){
            const y = chin + 0.16 * HH + i * 0.24 * HH;
            p.dot(tcx + 0.8 * T.a, y, 3 * u, INK);
            p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
        }
    });
    p.inkRing(tp, ow, thick);
    if (rifle) {
        p.band([
            B0,
            B1
        ], "#7a4b2a", 5 * u, 1.5 * u, "round");
        p.band([
            lerp2(B0, B1, 0.6),
            B1
        ], "#8d949c", 2.4 * u, 1.2 * u, "round");
    }
    p.stroke(curve(near[0], near[1], near[2]), 5.2 * u, armCol);
    p.dot(near[2][0], near[2][1], 5.5 * u);
    const hx = 300 + 4 * u;
    hatBehind(p, o, H, hx, hc, light, thick, ow, true);
    const hp = blobPts(hx, hc, H);
    p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
    p.inkRing(hp, ow, thick);
    hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
    const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
    faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout");
    p.rot = null;
};
export const swingKid = (p, o, kick, expr, light = DEF_LIGHT, blink = 0)=>{
    const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
    const seat = rope + 18, x0 = 150, x1 = 550;
    p.line([
        [
            350,
            20
        ],
        [
            x0 + 16,
            seat + 4
        ]
    ], "#a07a4c", 10);
    p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
    const g = p.g;
    g.save();
    g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
    g.scale(k, k);
    bodySide(new Pen(g), o, {
        expr,
        mode: "swing",
        pose: kick,
        light,
        seed: 5,
        blink
    });
    g.restore();
    p.line([
        [
            350,
            20
        ],
        [
            x1 - 16,
            seat + 4
        ]
    ], "#a07a4c", 10);
};
export const fxNote = (p, kind, col = "#1f2a44")=>{
    p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
    p.stroke([
        [
            110,
            190
        ],
        [
            110,
            40
        ]
    ], 14);
    if (kind === 0) p.poly([
        [
            110,
            40
        ],
        [
            170,
            70
        ],
        [
            170,
            110
        ],
        [
            110,
            82
        ]
    ], col, 8);
    else {
        p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
        p.stroke([
            [
                186,
                160
            ],
            [
                186,
                20
            ]
        ], 14);
        p.poly([
            [
                110,
                40
            ],
            [
                186,
                20
            ],
            [
                186,
                50
            ],
            [
                110,
                70
            ]
        ], col, 8);
    }
};
export const fxBurst = (p, t, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230)=>{
    const c = 250, e = 1 - (1 - t) ** 3;
    for(let i = 0; i < rays; i++){
        const a = rad(i * 360 / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
        p.poly([
            [
                c + r0 * 0.5 * Math.cos(a + 0.18),
                c + r0 * 0.5 * Math.sin(a + 0.18)
            ],
            [
                c + ra * Math.cos(a),
                c + ra * Math.sin(a)
            ],
            [
                c + r0 * 0.5 * Math.cos(a - 0.18),
                c + r0 * 0.5 * Math.sin(a - 0.18)
            ]
        ], col, Math.max(3, 8 * (1 - t)));
    }
    if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};
export const fxSplash = (p, t)=>{
    const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
    const blue = "#bfe8ff", deep = "#6cc0f0";
    if (rise > 0.02) {
        const pts = [];
        for(let i = 0; i < 19; i++){
            const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
            pts.push([
                c - 330 + 660 * i / 18,
                size - 120 - h
            ]);
        }
        p.poly([
            ...pts,
            [
                c + 330,
                size - 90
            ],
            [
                c - 330,
                size - 90
            ]
        ], blue, 10);
        p.ell(c, size - 100, 360, 46, deep, 10);
    }
    for(let i = 0; i < 8; i++){
        const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
        if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
    }
};
export const fxPuff = (p, t)=>{
    for(let i = 0; i < 5; i++){
        const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
        p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
    }
};
export const fxStars = (p, t)=>{
    for(let i = 0; i < 4; i++){
        const a = t * Math.PI * 2 + i * Math.PI / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts = [];
        for(let k = 0; k < 10; k++){
            const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90);
            pts.push([
                x + r * Math.cos(b),
                y + r * Math.sin(b)
            ]);
        }
        p.poly(pts, "#ffd84a", 6);
    }
};
export const fxCreak = (p, t)=>{
    const j = 6 * Math.sin(t * 40);
    for (const a of [
        -30,
        0,
        30
    ]){
        const b = rad(a - 90);
        p.stroke([
            [
                150 + 70 * Math.cos(b) + j,
                230 + 70 * Math.sin(b)
            ],
            [
                150 + 100 * Math.cos(b) + 10 + j,
                230 + 100 * Math.sin(b)
            ],
            [
                150 + 130 * Math.cos(b) + j,
                230 + 130 * Math.sin(b)
            ]
        ], 10);
    }
};
export const fxRing = (p, t)=>{
    const g = p.g;
    for(let k = 0; k < 3; k++){
        const u = t - k * 0.22;
        if (u <= 0 || u >= 1) continue;
        g.beginPath();
        g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
        g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa";
        g.lineWidth = 9 * (1 - u) + 3;
        g.stroke();
    }
};
export const fxSign = (p)=>{
    const g = p.g, RED = "#d42f2f";
    p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
    p.poly(rrect(14, 14, 686, 506, 40), null, 14);
    p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
    g.beginPath();
    g.moveTo(112, 470);
    g.quadraticCurveTo(350, 300, 588, 470);
    g.strokeStyle = INK;
    g.lineWidth = 16;
    g.lineCap = "round";
    g.stroke();
    for (const x of [
        88,
        612
    ])p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
    for (const x of [
        150,
        278,
        406,
        534
    ]){
        p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);
        p.stroke([
            [
                x - 8,
                210
            ],
            [
                x + 34,
                262
            ],
            [
                x + 46,
                338
            ]
        ], 15, INK);
        p.stroke([
            [
                x + 6,
                210
            ],
            [
                x - 12,
                274
            ],
            [
                x - 36,
                336
            ]
        ], 15, INK);
        p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);
        p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
    }
    for (const [a, b] of [
        [
            [
                96,
                70
            ],
            [
                604,
                452
            ]
        ],
        [
            [
                604,
                70
            ],
            [
                96,
                452
            ]
        ]
    ]){
        p.stroke([
            a,
            b
        ], 58, "#ffffff");
        p.stroke([
            a,
            b
        ], 42, RED);
    }
};
export const fxCloud = (p, seed)=>{
    const blobs = [
        [
            150,
            190,
            80
        ],
        [
            250,
            150,
            105
        ],
        [
            360,
            160,
            95
        ],
        [
            450,
            195,
            70
        ],
        [
            300,
            210,
            90
        ]
    ];
    for (const [x, y, r] of blobs)p.ell(x + seed * 37 % 20 - 10, y, r, r * 0.8, "#ffffff", 0);
    p.ell(300, 235, 230, 40, "#ffffff", 0);
};
export const fxShadow = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 256);
    g.save();
    g.filter = "blur(9px)";
    const lg = g.createLinearGradient(0, 205, 0, 22);
    lg.addColorStop(0, mix(col, WHITE, 0.08));
    lg.addColorStop(0.55, mix(col, WHITE, 0.3));
    lg.addColorStop(1, mix(col, WHITE, 0.85));
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(40, 205);
    g.bezierCurveTo(36, 120, 46, 50, 64, 30);
    g.bezierCurveTo(82, 50, 92, 120, 88, 205);
    g.closePath();
    g.fill();
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
};
export const fxContact = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [r, k] of [
        [
            0,
            0
        ],
        [
            0.32,
            0.02
        ],
        [
            0.5,
            0.22
        ],
        [
            0.66,
            0.58
        ],
        [
            0.82,
            0.88
        ],
        [
            1,
            1
        ]
    ])gr.addColorStop(r, mix(col, WHITE, k));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
};
export const fxPlank = (p)=>{
    p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
    p.line([
        [
            40,
            46
        ],
        [
            150,
            44
        ],
        [
            270,
            50
        ]
    ], "#7d5234", 4);
    p.line([
        [
            60,
            62
        ],
        [
            200,
            64
        ],
        [
            284,
            60
        ]
    ], "#7d5234", 4);
    p.dot(36, 54, 5, INK);
    p.dot(284, 54, 5, INK);
};
export const fxDrum = (p)=>{
    p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
    p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
    p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
    p.line([
        [
            52,
            88
        ],
        [
            82,
            172
        ],
        [
            112,
            88
        ],
        [
            142,
            172
        ],
        [
            172,
            88
        ],
        [
            202,
            172
        ]
    ], INK, 6);
    p.ell(130, 58, 98, 18, "#f7f3ea", 8);
};
export const fxBlob = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [r, k] of [
        [
            0,
            0
        ],
        [
            0.5,
            0.04
        ],
        [
            0.64,
            0.18
        ],
        [
            0.76,
            0.42
        ],
        [
            0.87,
            0.72
        ],
        [
            0.95,
            0.92
        ],
        [
            1,
            1
        ]
    ])gr.addColorStop(r, mix(col, WHITE, k));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
};
FACE.snore = { eye: ["dash", "dash"], brow: [0, -1], mouth: "o" };
FACE.stubborn = { eye: ["lid", "lid"], brow: [4, -3], mouth: "frown" };
FACE.squint = { eye: ["slit", "slit"], brow: [3, -2], mouth: "dash" };

// ---------------- Roman-era cast (our own designs), built on the Pen / blob / face helpers above ----------------
const STEEL = "#aeb6bf", BRASS = "#d9a845", LEATHER = "#7a4a2a";
export const OUTFITS = {
  legion: { tunic: "#b8322f", cape: "#8f2228", skin: SKIN, helmet: true, armor: true, spear: true, shield: true },
  old: { tunic: "#9c4a3c", cape: "#6e3330", skin: "#f3d6bb", helmet: "old", armor: true, spear: true, shield: false, beard: "#f4f1ea", brows: "#f4f1ea" },
  toga: { tunic: "#f1ead8", skin: "#f5c9a0", toga: "#6b3c8f", hair: "#3b2a20", stout: true },
  civA: { tunic: "#4f7fb8", skin: "#f5c9a0", hair: "#5a3b2a" },
  civB: { tunic: "#d9a441", skin: SKIN, hair: "#2b211c", dress: "#c25a7a" },
  civC: { tunic: "#5d8a3a", skin: "#c99067", hair: "#1e1714", stout: true },
  workA: { tunic: "#8a5d3b", skin: "#f5c9a0", cap: "#c2733a", apron: "#d8c9a6" },
  workB: { tunic: "#3f6a6f", skin: "#ecd0b6", cap: "#5b4a8a", moustache: "#4a3020" },
  // Japan, 1274
  samurai: { tunic: "#b8322f", skin: "#fffdf8", armor: true, lacquer: "#c43a2c", kabuto: "#2a2630", moustache: "#2a2018" },
  samurai2: { tunic: "#2f5a8a", skin: "#fffdf8", armor: true, lacquer: "#3a5f9a", kabuto: "#2a2630" },
  mongol: { tunic: "#3f6a9a", skin: "#fffaf2", fur: "#8a6a4a", furTop: "#b8322f", moustache: "#2a2018" },
  mongol2: { tunic: "#7a5a2a", skin: "#fffaf2", fur: "#5a4a3a", furTop: "#2f5a3a" },
  mongolBoss: { tunic: "#6a2a6a", skin: "#fffaf2", fur: "#d9c9a8", furTop: "#c9962e", moustache: "#2a2018", beard: "#2a2018", stout: true },
  // London, 1814
  clerk: { tunic: "#4a5a7a", skin: "#f5c9a0", hair: "#6b4a2e" },
  boss: { tunic: "#2f4a3a", skin: "#f1c4a0", hat: "tophat", hair: "#3a2a1e", moustache: "#3a2a1e", stout: true },
  brewer: { tunic: "#8a5d3b", skin: "#f5c9a0", cap: "#c2733a", apron: "#d8c9a6", stout: true },
  brewer2: { tunic: "#3f6a6f", skin: "#d9a47a", cap: "#5b4a8a", apron: "#d8c9a6" },
  rescA: { tunic: "#6a4a3a", skin: "#f5c9a0", cap: "#3f3a36" },
  rescB: { tunic: "#4f6a4a", skin: "#c99067", hair: "#1e1714", moustache: "#1e1714" },
  rescC: { tunic: "#7a5a2a", skin: "#ecd0b6", cap: "#2f3a52" },
  lady: { tunic: "#c9a27a", skin: "#f5d2b4", hat: "bonnet", dress: "#7a4a6a", hair: "#5a3b2a" },
  gent: { tunic: "#3a3a52", skin: "#f1c4a0", hat: "tophat", hair: "#2b211c" },
  judge: { tunic: "#8c1f2a", skin: "#f3d6bb", wig: "#f2efe6", stout: true },
  official: { tunic: "#2a2a32", skin: "#f1d0b0", hair: "#9a9a9a", moustache: "#8a8a8a" },
};

/** galea: iron bowl, brass brow band, cheek guards, transverse red crest */
const galea = (p, H, cx, hc, light, thick, ow, old, u) => {
  const crest = old ? "#8d4b3f" : "#d2372f", bowl = old ? "#8f8a7e" : STEEL;
  // crest (behind the bowl top)
  const cy0 = hc - H.b * 0.98;
  const cr = ellPts(cx, cy0, 0.66 * 2 * H.a, 0.42 * 2 * H.b, 180, 360, 0, 40);
  cr.push([cx + 0.66 * 2 * H.a * 0.98, cy0 + 4 * u], [cx - 0.66 * 2 * H.a * 0.98, cy0 + 4 * u]);
  const crP = [...ellPts(cx, cy0 + 2 * u, 0.62 * 2 * H.a, 0.36 * 2 * H.b, 180, 360, 0, 40)];
  p.shadedFill(crP, crest, mul(crest, [0.7, 0.62, 0.7]), light, 0.62 * 2 * H.a, 0.3);
  p.clip(crP, () => { for (let i = -9; i <= 9; i++) p.stroke([[cx + i * 7.4 * u, cy0], [cx + i * 9.4 * u, cy0 - 0.62 * H.b * Math.cos(i / 11)]], 1.4 * u, mul(crest, [0.62, 0.55, 0.62])); });
  if (old) p.clip(crP, () => { for (let i = 0; i < 6; i++) p.ell(cx + (i - 3) * 22 * u, cy0 - 18 * u - (i % 2) * 10 * u, 9 * u, 5 * u, "#6f6a5e", 0); });
  p.inkRing(crP, ow * 0.85, thick);
  p.poly(rrect(cx - 10 * u, cy0 - 6 * u, cx + 10 * u, cy0 + 6 * u, 3 * u), BRASS, 2 * u);
  // bowl: upper head cap
  const bandY = hc - H.b * 0.42;
  const bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  p.shadedFill(bp, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => {
    p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55");
    if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (3 + (i % 3) * 2) * u, (2 + (i % 2)) * u, "#8a4b22", 0);
  });
  p.inkRing(bp, ow * 0.9, thick);
  p.band([[cx - H.a * 1.04, bandY], [cx + H.a * 1.04, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
  for (const s of [-1, 1]) p.dot(cx + s * 0.55 * H.a, bandY, 2.2 * u, "#fff3c4");
};
const cheeks = (p, H, cx, hc, light, ow, old, u) => {
  const bowl = old ? "#8f8a7e" : STEEL;
  for (const s of [-1, 1]) {
    const x0 = cx + s * 0.78 * H.a, x1 = cx + s * 1.07 * H.a, y0 = hc - H.b * 0.42, y1 = hc + H.b * 0.48;
    const pts = [[x0, y0], [x1, y0], [x1 - s * 0.04 * H.a, y1 - 0.1 * H.b], [x0 + s * 0.06 * H.a, y1], [x0 - s * 0.05 * H.a, (y0 + y1) / 2]];
    p.shadedFill(pts, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, 0.2 * H.a, 0.3);
    p.poly(pts, null, ow * 0.8);
    p.dot((x0 + x1) / 2, (y0 + y1) / 2 - 0.05 * H.b, 2.2 * u, BRASS);
  }
};
const cobweb = (p, cx, cy, r, u) => {
  const g = p.g; g.save(); g.globalAlpha = 0.8;
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); p.stroke([[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], 1.1 * u, "#f2f2f2"); }
  for (let k = 1; k <= 4; k++) { const rr = r * k / 4.3, pts = []; for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } p.stroke(pts, 1 * u, "#f2f2f2"); }
  g.restore();
};

/** front-facing Roman-era character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, nohelmet, light */
export const romanFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? OUTFITS[key] : key;
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = O.spear ? "spear" : "hang", tilt = 0, headTilt = 0,
    bob = 0, nohelmet = false, light = rad(-120), web = false, step = 0 } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.2 : 1.16, legsL = O.legs ?? 1.72, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = mix(O.tunic, INK, 0.62), armCol = mix(O.tunic, INK, 0.5);
  const helmet = !!O.helmet && !nohelmet, old = O.helmet === "old";
  p.rot = null;
  // ---- cape behind everything ----
  if (O.cape) {
    const cp = [[cx - 0.48 * W, chin + 0.08 * HH], [cx + 0.48 * W, chin + 0.08 * HH], [cx + 0.62 * W, sole - 0.55 * HH], [cx + 0.2 * W, sole - 0.45 * HH], [cx - 0.2 * W, sole - 0.5 * HH], [cx - 0.62 * W, sole - 0.55 * HH]];
    p.gradFill(cp, O.cape, mul(O.cape, [0.6, 0.6, 0.7]), light); p.inkRing(cp, ow * 0.8, thick);
  }
  // ---- legs ----
  const dress = !!O.dress;
  for (const side of [-1, 1]) {
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 30 * (step ? 1 : 0);
    const sw = (opts.stride || 0) * Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)));
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u + sw * u, fy = sole - 4 * u - up * (opts.stride ? 1.6 : 1);
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), 5.8 * u, legCol);
    const sandal = O.helmet ? LEATHER : "#5a3b2a";
    if (O.helmet || O.kabuto || O.fur) { p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u + 3, INK);
      p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u, sandal); }
    else { const bc = O.boot || "#3a2a22", bt = [[fx - side * 5 * u, fy - 9 * u], [fx + side * 5 * u, fy - 9 * u], [fx + side * 9 * u, fy - 4 * u], [fx + side * 17 * u, fy - 2 * u], [fx + side * 18 * u, fy + 3 * u], [fx - side * 6 * u, fy + 3 * u]];
      p.poly(bt, bc, 2.4 * u); p.stroke([[fx - side * 6 * u, fy + 2.5 * u], [fx + side * 18 * u, fy + 2.5 * u]], 2.2 * u, "#1a1412"); p.ell(fx + side * 10 * u, fy - 3.5 * u, 3.5 * u, 1.6 * u, "#ffffff88", 0); }
    if (O.helmet) for (let k = 1; k <= 3; k++) p.stroke([[fx - 4 * u, fy - k * 0.07 * HH], [fx + 4 * u, fy - k * 0.07 * HH - 2 * u]], 2 * u, LEATHER);
  }
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    if (pose && typeof pose === "object") { const la = 0.44 * HH * (pose.len || 1), a = rad(pose.a || 0), e = rad(pose.e || 0);
      const el = [s[0] + side * Math.sin(a) * la, s[1] + Math.cos(a) * la], hd = [el[0] + side * Math.sin(a + e) * la, el[1] + Math.cos(a + e) * la];
      return { pts: [s, [el[0] * 1.0, el[1]], hd], front: !!pose.front, finger: !!pose.finger, thumb: !!pose.thumb }; }
    switch (pose) {
      case "spear": return { pts: [s, [X(6), s[1] + 0.42 * HH], [X(10), s[1] + 0.2 * HH]], front: false };
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "temple": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 16 * u), hc - 0.1 * HH]], front: false, swirl: true };
      case "lift": return { pts: [s, [X(20), s[1] - 0.25 * HH], [X(4), s[1] - 0.82 * HH]], front: false };
      case "shield": return { pts: [s, [X(4), s[1] + 0.4 * HH], [tcx + side * 0.6 * T.a, torsoBot - 0.1 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "reach": { const lf = (opts.lift || 0) * 0.62 * HH; return { pts: [s, [X(42), s[1] - 0.12 * HH - lf * 0.6], [X(82), s[1] - 0.5 * HH - lf]], front: false }; }
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.25 * H.b]], front: false };
      case "down": return { pts: [s, [X(18), s[1] + 0.45 * HH], [X(26), s[1] + 0.95 * HH]], front: false };
      case "fist": return { pts: [s, [X(26), s[1] + 0.1 * HH], [X(18), s[1] - 0.3 * HH]], front: false };
      case "lever": return { pts: [s, [X(30), s[1] + 0.05 * HH], [X(54), s[1] - 0.05 * HH]], front: false };
      case "shrug": return { pts: [s, [X(24), s[1] + 0.24 * HH], [X(36), s[1] - 0.06 * HH]], front: false };
      case "stamp": { const k = opts.stampK || 0; return { pts: [s, [X(16), s[1] - 0.3 * HH + k * 0.4 * HH], [X(6), s[1] - 0.9 * HH + k * 1.25 * HH]], front: false, stampTool: true }; }
      case "thumb": return { pts: [s, [X(20), s[1] + 0.12 * HH], [X(44), s[1] - 0.12 * HH]], front: false, thumb: true };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  if (opts.out) opts.out.hands = arms.map((a) => rotAbout(a.pts[2], rad(tilt), [cx, hipY]));
  const drawArm = (a) => {
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
    const [hx, hy] = a.pts[2];
    p.dot(hx, hy, 5.5 * u);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 2.6 * u); }
    if (a.thumb) p.stroke([[hx, hy], [hx + Math.sign(hx - cx) * 6 * u, hy - 12 * u]], 2.6 * u);
    if (a.stampTool) { p.band([[hx, hy - 4 * u], [hx, hy + 20 * u]], "#6a4326", 6 * u, 1.4 * u, "round"); p.poly(rrect(hx - 16 * u, hy + 18 * u, hx + 16 * u, hy + 30 * u, 3 * u), "#8a5a34", 2 * u); p.poly(rrect(hx - 15 * u, hy + 29 * u, hx + 15 * u, hy + 34 * u, 2 * u), "#c0242b", 1.2 * u); }
  };
  // spear behind
  if (O.spear && R === "spear") {
    const [hx, hy] = arms[1].pts[2], s0 = [hx + 2 * u, sole - 2 * u], s1 = [hx - 3 * u, 70];
    p.band([s0, s1], old ? "#6d5236" : "#8a5a34", 4.2 * u, 1.4 * u, "round");
    const tip = [[s1[0] - 7 * u, s1[1] + 6 * u], [s1[0], s1[1] - 34 * u], [s1[0] + 7 * u, s1[1] + 6 * u], [s1[0], s1[1] + 14 * u]];
    p.poly(tip, old ? "#8b7c6a" : "#c9cfd6", 2 * u);
    if (web) cobweb(p, s1[0] - 2 * u, s1[1] + 60 * u, 70 * u, u);
  }
  for (const a of arms) if (!a.front) drawArm(a);
  // torso
  if (dress) {
    const D = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(cx, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, O.dress, mul(O.dress, SH_CLOTH), light); p.inkRing(dp, ow, thick);
  }
  // skirt / pteruges below the torso
  if (!dress) {
    const sk = [[tcx - 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 1.0 * T.a, torsoBot + 0.3 * HH], [tcx - 1.0 * T.a, torsoBot + 0.3 * HH]];
    p.gradFill(sk, O.tunic, mul(O.tunic, SH_CLOTH), light); p.poly(sk, null, ow * 0.8);
    if (O.armor) for (let i = -3; i <= 3; i++) { const x = tcx + i * 0.27 * T.a, st = [[x - 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot + 0.22 * HH], [x - 9 * u, torsoBot + 0.22 * HH]]; p.poly(st, old ? "#5e4632" : LEATHER, 1.6 * u); }
  }
  p.gradFill(tp, O.tunic, mul(O.tunic, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.armor) {
      const top = chin - 0.1 * HH, bot = torsoBot - 0.25 * HH, n = 5;
      for (let i = 0; i < n; i++) {
        const y0 = top + (bot - top) * i / n, y1 = top + (bot - top) * (i + 1) / n;
        const c = O.lacquer ? (i % 2 ? O.lacquer : mix(O.lacquer, "#000000", 0.35)) : old ? (i % 2 ? "#8d8679" : "#9a9384") : (i % 2 ? "#a7b0ba" : "#bcc4cc");
        p.poly([[tcx - 1.5 * T.a, y0], [tcx + 1.5 * T.a, y0 + 3 * u], [tcx + 1.5 * T.a, y1 + 3 * u], [tcx - 1.5 * T.a, y1]], c, 1.8 * u);
      }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.2 * HH], [tcx + 1.4 * T.a, torsoBot - 0.2 * HH]], LEATHER, 0.08 * HH, 1.5 * u);
      for (let i = -2; i <= 2; i++) p.dot(tcx + i * 0.3 * T.a, torsoBot - 0.2 * HH, 2.4 * u, BRASS);
      if (old) for (let i = 0; i < 5; i++) p.ell(tcx + Math.sin(i * 1.7) * 0.7 * T.a, top + (bot - top) * ((i * 0.31) % 1), 6 * u, 3 * u, "#8a4b22", 0);
    } else {
      const top0 = chin - 0.3 * HH, bot0 = torsoBot + 0.1 * HH, L0 = tcx - 1.4 * T.a, R0 = tcx + 1.4 * T.a;
      if (O.pattern === "stripe") for (let x = L0; x < R0; x += 9 * u) p.stroke([[x, top0], [x, bot0]], 2.6 * u, O.pcol || mul(O.tunic, [0.7, 0.7, 0.75]));
      if (O.pattern === "pin") for (let x = L0; x < R0; x += 7 * u) p.stroke([[x, top0], [x, bot0]], 0.9 * u, O.pcol || "#ffffff55");
      if (O.pattern === "check") { for (let x = L0; x < R0; x += 14 * u) p.stroke([[x, top0], [x, bot0]], 3.2 * u, O.pcol || "#00000040"); for (let y = top0; y < bot0; y += 14 * u) p.stroke([[L0, y], [R0, y]], 3.2 * u, O.pcol || "#00000040"); for (let x = L0 + 7 * u; x < R0; x += 14 * u) p.stroke([[x, top0], [x, bot0]], 0.9 * u, O.pcol2 || "#e8c25a"); }
      if (O.pattern === "tartan") { for (let x = L0; x < R0; x += 18 * u) p.stroke([[x, top0], [x, bot0]], 6 * u, O.pcol || "#1f3a2a99"); for (let y = top0; y < bot0; y += 18 * u) p.stroke([[L0, y], [R0, y]], 6 * u, O.pcol || "#1f3a2a99"); for (let x = L0 + 9 * u; x < R0; x += 18 * u) p.stroke([[x, top0], [x, bot0]], 1.2 * u, O.pcol2 || "#e8d05a"); for (let y = top0 + 9 * u; y < bot0; y += 18 * u) p.stroke([[L0, y], [R0, y]], 1.2 * u, O.pcol2 || "#e8d05a"); }
      if (O.hivis) { for (const yy of [0.55, 0.85]) { p.band([[L0, chin + yy * HH], [R0, chin + yy * HH]], "#d8dde2", 0.07 * HH, 1.2 * u); p.stroke([[L0, chin + yy * HH - 0.02 * HH], [R0, chin + yy * HH - 0.02 * HH]], 1 * u, "#ffffff"); }
        for (const s of [-1, 1]) p.band([[tcx + s * 0.35 * T.a, chin], [tcx + s * 0.35 * T.a, chin + 0.5 * HH]], "#d8dde2", 0.06 * HH, 1.2 * u); p.stroke([[tcx, chin + 0.1 * HH], [tcx, torsoBot]], 1.6 * u, "#00000055"); }
      if (O.vest) { // waistcoat panel + watch chain
        const vp = [[tcx - 0.5 * T.a, chin + 0.02 * HH], [tcx + 0.5 * T.a, chin + 0.02 * HH], [tcx + 0.62 * T.a, torsoBot - 0.18 * HH], [tcx, torsoBot - 0.05 * HH], [tcx - 0.62 * T.a, torsoBot - 0.18 * HH]];
        p.gradFill(vp, O.vest, mul(O.vest, SH_CLOTH), light); p.clip(vp, () => { if (O.vestPat) for (let x = tcx - T.a; x < tcx + T.a; x += 6 * u) p.stroke([[x, chin], [x + 10 * u, torsoBot]], 1.2 * u, O.vestPat); }); p.poly(vp, null, 2.2 * u);
        p.poly([[tcx - 0.16 * T.a, chin + 0.02 * HH], [tcx + 0.16 * T.a, chin + 0.02 * HH], [tcx, chin + 0.3 * HH]], O.shirt || "#f4f0e6", 1.6 * u);
        p.poly([[tcx - 0.06 * T.a, chin + 0.05 * HH], [tcx + 0.06 * T.a, chin + 0.05 * HH], [tcx + 0.05 * T.a, chin + 0.24 * HH], [tcx, chin + 0.28 * HH], [tcx - 0.05 * T.a, chin + 0.24 * HH]], O.tie || "#8a1f2a", 1.2 * u);
        for (let k = 0; k < 4; k++) p.dot(tcx, chin + (0.36 + k * 0.17) * HH, 2.6 * u, "#e8c25a");
        p.stroke(curve([tcx, chin + 0.62 * HH], [tcx + 0.3 * T.a, chin + 0.78 * HH], [tcx + 0.55 * T.a, chin + 0.6 * HH]), 1.6 * u, "#f2d06a");
      }
      if (O.coat) { // lapels + double row of brass buttons
        for (const s of [-1, 1]) { p.poly([[tcx + s * 0.08 * T.a, chin + 0.02 * HH], [tcx + s * 0.62 * T.a, chin + 0.0 * HH], [tcx + s * 0.32 * T.a, chin + 0.42 * HH], [tcx + s * 0.1 * T.a, chin + 0.5 * HH]], mul(O.tunic, [0.78, 0.78, 0.82]), 1.8 * u);
          for (let k = 0; k < 3; k++) { p.dot(tcx + s * 0.3 * T.a, chin + (0.62 + k * 0.2) * HH, 4 * u, "#f2c94a"); p.dot(tcx + s * 0.3 * T.a - 1.2 * u, chin + (0.62 + k * 0.2) * HH - 1.2 * u, 1.4 * u, "#fff6c8"); } }
        p.stroke([[tcx, chin + 0.45 * HH], [tcx, torsoBot]], 1.6 * u, "#00000066");
        p.stroke([[tcx - 0.9 * T.a, chin + 0.95 * HH], [tcx - 0.4 * T.a, chin + 0.95 * HH]], 1.8 * u, "#00000055");
        p.stroke([[tcx + 0.4 * T.a, chin + 0.95 * HH], [tcx + 0.9 * T.a, chin + 0.95 * HH]], 1.8 * u, "#00000055");
      }
      if (O.scarf) { p.band([[tcx - 0.62 * T.a, chin + 0.05 * HH], [tcx + 0.62 * T.a, chin + 0.07 * HH]], O.scarf, 0.14 * HH, 1.8 * u, "round"); p.poly([[tcx + 0.2 * T.a, chin + 0.1 * HH], [tcx + 0.42 * T.a, chin + 0.12 * HH], [tcx + 0.5 * T.a, chin + 0.62 * HH], [tcx + 0.28 * T.a, chin + 0.6 * HH]], O.scarf, 1.6 * u); for (let k = 0; k < 4; k++) p.stroke([[tcx + 0.24 * T.a, chin + (0.2 + k * 0.1) * HH], [tcx + 0.46 * T.a, chin + (0.22 + k * 0.1) * HH]], 1.4 * u, "#00000044"); }
      if (O.overalls) { const op = [[tcx - 0.55 * T.a, chin + 0.35 * HH], [tcx + 0.55 * T.a, chin + 0.35 * HH], [tcx + 0.7 * T.a, torsoBot + 0.1 * HH], [tcx - 0.7 * T.a, torsoBot + 0.1 * HH]]; p.gradFill(op, O.overalls, mul(O.overalls, SH_CLOTH), light); p.poly(op, null, 1.8 * u);
        for (const s of [-1, 1]) { p.band([[tcx + s * 0.45 * T.a, chin + 0.36 * HH], [tcx + s * 0.7 * T.a, chin - 0.02 * HH]], O.overalls, 0.08 * HH, 1.4 * u); p.dot(tcx + s * 0.45 * T.a, chin + 0.4 * HH, 3 * u, "#d9d9d9"); }
        p.poly(rrect(tcx - 0.25 * T.a, chin + 0.45 * HH, tcx + 0.25 * T.a, chin + 0.68 * HH, 2 * u), mul(O.overalls, [0.85, 0.85, 0.9]), 1.4 * u);
        for (let k = 0; k < 6; k++) p.ell(tcx + Math.sin(k * 2.7) * 0.5 * T.a, chin + (0.5 + ((k * 0.37) % 1) * 0.6) * HH, 5 * u, 3 * u, "#00000030", 0); }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.24 * HH], [tcx + 1.4 * T.a, torsoBot - 0.24 * HH]], O.belt || (O.apron ? "#5a3b2a" : "#e2c27a"), 0.05 * HH, 1.2 * u);
      if (O.belt) { p.poly(rrect(tcx - 7 * u, torsoBot - 0.24 * HH - 6 * u, tcx + 7 * u, torsoBot - 0.24 * HH + 6 * u, 1.5 * u), "#e8c25a", 1.6 * u); p.ell(tcx - 2 * u, torsoBot - 0.24 * HH - 2 * u, 2 * u, 1.2 * u, "#fff6c8", 0); }
      if (O.pockets) for (const sd of [-1, 1]) { const px = tcx + sd * 0.48 * T.a, py = chin + 0.38 * HH; p.poly(rrect(px - 10 * u, py, px + 10 * u, py + 16 * u, 2 * u), mul(O.tunic, [0.92, 0.92, 0.95]), 1.5 * u); p.poly([[px - 11 * u, py - 1 * u], [px + 11 * u, py - 1 * u], [px + 10 * u, py + 5 * u], [px - 10 * u, py + 5 * u]], mul(O.tunic, [0.82, 0.82, 0.86]), 1.5 * u); p.dot(px, py + 3 * u, 1.8 * u, "#e8c25a"); }
      if (O.sam) p.band([[tcx + 0.7 * T.a, chin + 0.02 * HH], [tcx - 0.6 * T.a, torsoBot - 0.26 * HH]], "#6a4022", 0.045 * HH, 1.2 * u);
      for (let k = 0; k < 3; k++) p.stroke([[tcx - 0.6 * T.a + k * 0.5 * T.a, torsoBot - 0.2 * HH], [tcx - 0.5 * T.a + k * 0.5 * T.a, torsoBot - 0.02 * HH]], 1.1 * u, "#00000030");
      p.stroke(ellPts(tcx - 0.45 * T.a, chin + 0.45 * HH, 0.25 * T.a, 0.35 * HH, 200, 250, 0, 8), 4 * u, "#ffffff30");
      if (O.toga) p.band([[tcx - 1.0 * T.a, chin - 0.1 * HH], [tcx + 1.1 * T.a, torsoBot - 0.1 * HH]], O.toga, 0.16 * HH, 1.6 * u);
      if (O.apron) p.poly([[tcx - 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.6 * T.a, torsoBot + 0.2 * HH], [tcx - 0.6 * T.a, torsoBot + 0.2 * HH]], O.apron, 1.6 * u);
      p.stroke([[tcx - 0.2 * T.a, chin + 0.02 * HH], [tcx, chin + 0.16 * HH], [tcx + 0.2 * T.a, chin + 0.02 * HH]], 2 * u);
    }
  });
  p.inkRing(tp, ow, thick);
  if (O.armor) for (const s of [-1, 1]) { // shoulder plates
    const sp = ellPts(tcx + s * 0.72 * T.a, chin + 0.1 * HH, 0.42 * T.a, 0.13 * HH, 180, 360, s * 8, 20);
    p.poly(sp, old ? "#9a9384" : "#c5ccd3", 1.8 * u);
  }
  if (O.moss) {/* reserved */}
  for (const a of arms) if (a.front) drawArm(a);
  // shield in front, held by the left hand
  if (O.shield && L === "shield") {
    const sx = tcx - 0.55 * T.a, sy = torsoBot + 0.05 * HH, sw = 0.36 * W, sh = 0.78 * HH;
    const sp = rrect(sx - sw, sy - sh, sx + sw, sy + sh, 8 * u);
    p.gradFill(sp, "#c0302c", "#7d1d22", light);
    p.clip(sp, () => {
      p.band([[sx - sw, sy], [sx + sw, sy]], BRASS, 6 * u, 1.2 * u);
      p.band([[sx, sy - sh], [sx, sy + sh]], BRASS, 6 * u, 1.2 * u);
      for (const s of [-1, 1]) { p.stroke([[sx + s * 12 * u, sy - 14 * u], [sx + s * 34 * u, sy - 46 * u], [sx + s * 22 * u, sy - 44 * u], [sx + s * 46 * u, sy - 74 * u]], 3.5 * u, BRASS); p.stroke([[sx + s * 12 * u, sy + 14 * u], [sx + s * 34 * u, sy + 46 * u], [sx + s * 22 * u, sy + 44 * u], [sx + s * 46 * u, sy + 74 * u]], 3.5 * u, BRASS); }
      p.stroke(ellPts(sx - sw * 0.5, sy - sh * 0.7, sw * 0.3, sh * 0.1, 200, 320, 0, 10), 3 * u, "#ffffff44");
    });
    p.ell(sx, sy, 13 * u, 13 * u, "#e6c068", 2.2 * u);
    p.inkRing(sp, ow, thick);
  }
  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  if (helmet) galea(p, H, cx, hc, light, thick, ow, old, u);
  const hp = blobPts(cx, hc, H);
  if (O.kabuto) { // samurai helmet: lacquered bowl, neck guard, gold crescent
    const kb = ellPts(cx, hc - 0.28 * H.b, H.a * 1.12, H.b * 0.82, 180, 360, 0, 40); kb.push([cx + H.a * 1.12, hc - 0.2 * H.b], [cx - H.a * 1.12, hc - 0.2 * H.b]);
    for (const s of [-1, 1]) { const ng = [[cx + s * 0.95 * H.a, hc - 0.3 * H.b], [cx + s * 1.45 * H.a, hc + 0.1 * H.b], [cx + s * 1.35 * H.a, hc + 0.45 * H.b], [cx + s * 0.95 * H.a, hc + 0.2 * H.b]]; p.poly(ng, O.kabuto, ow * 0.8); }
    p.shadedFill(kb, O.kabuto, mul(O.kabuto, [0.55, 0.55, 0.6]), light, H.a, 0.4); p.inkRing(kb, ow * 0.9, thick);
    const cr = [[cx - 4 * u, hc - 1.0 * H.b], [cx - 0.75 * H.a, hc - 1.85 * H.b], [cx - 0.55 * H.a, hc - 1.0 * H.b], [cx, hc - 0.86 * H.b], [cx + 0.55 * H.a, hc - 1.0 * H.b], [cx + 0.75 * H.a, hc - 1.85 * H.b], [cx + 4 * u, hc - 1.0 * H.b]];
    p.poly(cr, "#f2c94a", 2.5 * u); }
  if (O.fur) { const fh = ellPts(cx, hc - 0.45 * H.b, H.a * 0.98, H.b * 0.7, 180, 360, 0, 32); p.poly(fh, O.furTop || "#7a2a24", ow * 0.8);
    p.band([[cx - H.a * 1.08, hc - 0.42 * H.b], [cx + H.a * 1.08, hc - 0.42 * H.b]], O.fur, 0.3 * H.b, ow * 0.7, "round"); }
  if (O.wig) { for (const s of [-1, 1]) for (let k = 0; k < 4; k++) p.ell(cx + s * (0.95 + 0.05 * k) * H.a, hc - 0.45 * H.b + k * 0.42 * H.b, 0.32 * H.a, 0.26 * H.b, O.wig, 3 * u);
    p.ell(cx, hc - 0.55 * H.b, 1.08 * H.a, 0.6 * H.b, O.wig, 3 * u); }
  if (O.hair && !helmet) { const hb = blobPts(cx, hc - 0.03 * HH, { ...H, a: H.a * 1.04, b: H.b * 1.05 }); p.poly(hb, O.hair, 0); }
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.ell(cx - 0.42 * H.a, hc - 0.5 * H.b, 0.2 * H.a, 0.11 * H.b, "#ffffffb0", 0); p.ell(cx - 0.62 * H.a, hc - 0.28 * H.b, 0.05 * H.a, 0.05 * H.b, "#ffffffc0", 0);
  p.inkRing(hp, ow, thick);
  if (helmet) {
    const bandY = hc - H.b * 0.42, bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
    p.shadedFill(bp, old ? "#8f8a7e" : STEEL, mul(old ? "#8f8a7e" : STEEL, [0.62, 0.64, 0.72]), light, H.a, 0.4);
    p.clip(bp, () => { p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 5 * u, "#ffffff66");
      if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
    p.poly(bp, null, ow * 0.9);
    p.band([[cx - H.a * 1.05, bandY], [cx + H.a * 1.05, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
    p.poly(rrect(cx - 4 * u, bandY - 0.55 * H.b, cx + 4 * u, bandY - 3 * u, 2 * u), old ? "#a88a4a" : BRASS, 1.5 * u);
    cheeks(p, H, cx, hc, light, ow, old, u);
  } else if (O.hat) hatOn(p, { hat: O.hat, jacket: O.tunic, hatCol: O.hatCol }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.rcap) { const by = hc - 0.4 * H.b; const dome = ellPts(cx + 6 * u, by - 0.12 * H.b, H.a * 1.12, H.b * 0.72, 180, 360, 0, 32); dome.push([cx + H.a * 1.15, by + 0.05 * H.b], [cx - H.a * 1.0, by + 0.05 * H.b]);
    p.shadedFill(dome, O.rcap, mul(O.rcap, [0.7, 0.7, 0.78]), light, H.a, 0.35); p.clip(dome, () => { for (let k = -8; k <= 8; k++) p.stroke([[cx + k * 13 * u, by - H.b], [cx + k * 15 * u, by + 0.1 * H.b]], 5 * u, O.rcapS || "#f4f4f0"); }); p.inkRing(dome, ow * 0.9, thick);
    const brim = [[cx - 0.2 * H.a, by + 0.02 * H.b], [cx + 1.45 * H.a, by + 0.04 * H.b], [cx + 1.4 * H.a, by + 0.2 * H.b], [cx - 0.2 * H.a, by + 0.16 * H.b]]; p.poly(brim, mul(O.rcap, [0.6, 0.6, 0.7]), ow * 0.8); p.ell(cx + 0.1 * H.a, by - 0.78 * H.b, 0.1 * H.a, 0.07 * H.b, O.rcap, 2 * u); }
  else if (O.slouch) { const sc = O.slouch, by = hc - 0.42 * H.b;
    const cr = [...ellPts(cx, by, 0.86 * H.a, 0.85 * H.b, 180, 360, 0, 30)]; p.shadedFill(cr, sc, mul(sc, [0.7, 0.68, 0.64]), light, H.a, 0.35); p.inkRing(cr, ow * 0.9, thick);
    p.stroke([[cx - 0.2 * H.a, by - 0.8 * H.b], [cx + 0.1 * H.a, by - 0.55 * H.b]], 2.5 * u, mul(sc, [0.6, 0.6, 0.6]));
    p.band([[cx - 0.86 * H.a, by - 0.12 * H.b], [cx + 0.86 * H.a, by - 0.12 * H.b]], O.band || "#c9a86a", 0.2 * H.b, 1.4 * u);
    const br = ellPts(cx, by + 0.02 * H.b, 1.55 * H.a, 0.22 * H.b, 0, 360, 0, 40); p.shadedFill(br, sc, mul(sc, [0.7, 0.68, 0.64]), light, 1.5 * H.a, 0.3); p.inkRing(br, ow * 0.85, thick);
    if (O.pinned) { const pu = [[cx + 0.55 * H.a, by - 0.05 * H.b], [cx + 1.3 * H.a, by - 0.1 * H.b], [cx + 1.15 * H.a, by - 0.95 * H.b], [cx + 0.75 * H.a, by - 0.9 * H.b]]; p.poly(pu, mul(sc, [0.88, 0.86, 0.82]), ow * 0.8); p.ell(cx + 0.98 * H.a, by - 0.5 * H.b, 0.14 * H.a, 0.12 * H.b, "#e8c25a", 1.4 * u); }
    p.ell(cx - 0.9 * H.a, by - 0.02 * H.b, 0.3 * H.a, 0.05 * H.b, "#ffffff60", 0); }
  else if (O.cap) hatOn(p, { hat: "cap", cap: O.cap, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.hair) hatOn(p, { hat: "hair", hair: O.hair, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.helmet && nohelmet) { // bald old head with white side tufts
    for (const s of [-1, 1]) p.ell(cx + s * 0.9 * H.a, hc - 0.1 * H.b, 0.22 * H.a, 0.3 * H.b, "#f4f1ea", 3 * u);
  }
  if (O.braids) for (const sd of [-1, 1]) { const bx = cx + sd * 1.0 * H.a, by = hc + 0.1 * H.b; for (let k = 0; k < 4; k++) p.ell(bx + sd * 4 * u, by + k * 0.32 * H.b, 0.16 * H.a, 0.18 * H.b, O.braids, ow * 0.6); p.ell(bx + sd * 4 * u, by + 1.32 * H.b, 0.1 * H.a, 0.07 * H.b, O.bow || "#ffd84a", ow * 0.5); }
  if (O.hood) { const hb = ellPts(cx, hc - 0.25 * H.b, H.a * 1.18, H.b * 0.98, 180, 360, 0, 32); hb.push([cx + H.a * 1.18, hc + 0.3 * H.b], [cx - H.a * 1.18, hc + 0.3 * H.b]); p.shadedFill(hb, O.hood, mul(O.hood, [0.75, 0.7, 0.6]), light, H.a, 0.35); p.inkRing(hb, ow * 0.9, thick); p.ell(cx - 0.5 * H.a, hc - 0.85 * H.b, 0.25 * H.a, 0.08 * H.b, "#ffffff70", 0); }
  if (O.nightcap) { const by = hc - 0.45 * H.b; const cp = [[cx - 1.05 * H.a, by + 0.1 * H.b], [cx + 1.05 * H.a, by + 0.1 * H.b], [cx + 0.8 * H.a, by - 0.7 * H.b], [cx + 1.6 * H.a, by - 0.2 * H.b], [cx + 1.75 * H.a, by - 0.05 * H.b], [cx + 0.2 * H.a, by - 1.05 * H.b], [cx - 0.8 * H.a, by - 0.75 * H.b]];
    p.shadedFill(cp, O.nightcap, mul(O.nightcap, [0.7, 0.7, 0.75]), light, H.a, 0.35); p.clip(cp, () => { for (let k = -6; k <= 8; k++) p.stroke([[cx + k * 18 * u, by + 0.2 * H.b], [cx + k * 18 * u + 30 * u, by - H.b]], 7 * u, "#ffffff"); }); p.inkRing(cp, ow * 0.8, thick); p.ell(cx + 1.75 * H.a, by - 0.05 * H.b, 0.16 * H.a, 0.14 * H.b, "#ffffff", ow * 0.6); }
  if (O.bun) { p.ell(cx + 4 * u * facing, hc - 1.08 * H.b, 0.28 * H.a, 0.22 * H.b, O.hair || "#1d1a24", ow * 0.8); p.ell(cx + 4 * u * facing - 0.08 * H.a, hc - 1.14 * H.b, 0.08 * H.a, 0.05 * H.b, "#ffffff55", 0); p.stroke([[cx - 0.12 * H.a, hc - 0.9 * H.b], [cx + 0.12 * H.a, hc - 0.9 * H.b]], 3 * u, "#c9962e"); }
  if (O.headband) { const hb = ellPts(cx, hc - 0.42 * H.b, H.a * 1.0, H.b * 0.2, 180, 360, 0, 24); p.band([[cx - H.a * 0.98, hc - 0.4 * H.b], [cx + H.a * 0.98, hc - 0.4 * H.b]], O.headband, 0.13 * H.b, 1.4 * u); p.stroke([[cx + H.a * 0.9, hc - 0.4 * H.b], [cx + H.a * 1.25, hc - 0.1 * H.b]], 3.5 * u, O.headband); }
  if (O.plume) { const by = hc - 0.42 * H.b - 0.85 * H.b; p.stroke(curve([cx, by + 6 * u], [cx + 14 * u, by - 26 * u], [cx + 34 * u, by - 18 * u]), 7 * u, INK); p.stroke(curve([cx, by + 6 * u], [cx + 14 * u, by - 26 * u], [cx + 34 * u, by - 18 * u]), 4.5 * u, O.plume); p.ell(cx, by + 4 * u, 5 * u, 4 * u, "#e8c25a", 1.4 * u); }
  if (O.jingasa) { const by = hc - 0.38 * H.b, jc = O.jingasa; const cone = [[cx - 1.5 * H.a, by + 0.12 * H.b], [cx, by - 1.05 * H.b], [cx + 1.5 * H.a, by + 0.12 * H.b], [cx, by + 0.26 * H.b]];
    p.shadedFill(cone, jc, mul(jc, [0.6, 0.6, 0.65]), light, 1.4 * H.a, 0.3); p.inkRing(cone, ow * 0.85, thick); p.stroke([[cx - 1.4 * H.a, by + 0.12 * H.b], [cx + 1.4 * H.a, by + 0.12 * H.b]], 2 * u, "#e8c25a88"); p.ell(cx - 0.5 * H.a, by - 0.5 * H.b, 0.3 * H.a, 0.06 * H.b, "#ffffff40", 0); }
  if (O.beard) {
    const bd = blobPts(cx + 6 * u * facing, hc + 0.85 * H.b, { a: 0.62 * H.a, b: 0.75 * H.b, nTop: 2.4, nBot: 1.6, egg: -0.35, asym: 0, rot: 0, noise: 0.02, seed: seed + 4 });
    p.shadedFill(bd, O.beard, mul(O.beard, [0.86, 0.86, 0.92]), light, 0.6 * H.a, 0.3);
    p.clip(bd, () => { for (let i = -3; i <= 3; i++) p.stroke([[cx + i * 9 * u, hc + 0.45 * H.b], [cx + i * 7 * u, hc + 1.35 * H.b]], 1.2 * u, "#c9c4bb"); });
    p.inkRing(bd, ow * 0.8, thick);
  }
  if (O.shlem) { const by = hc - 0.4 * H.b, sc = O.shlem; const dome = ellPts(cx, by, H.a * 1.1, H.b * 0.75, 180, 360, 0, 32); dome.push([cx + H.a * 1.1, by + 0.1 * H.b], [cx - H.a * 1.1, by + 0.1 * H.b]); p.shadedFill(dome, sc, mul(sc, [0.6, 0.6, 0.62]), light, H.a, 0.35);
    p.clip(dome, () => { for (const k of [-0.55, 0, 0.55]) p.band([[cx + k * H.a, by + 0.1 * H.b], [cx + k * H.a * 1.1, by - 0.75 * H.b]], mul(sc, [1.25, 1.25, 1.25]), 0.14 * H.a, 1.2 * u, 'round'); }); p.inkRing(dome, ow * 0.85, thick);
    for (const s of [-1, 1]) { const fl = [[cx + s * 0.85 * H.a, by + 0.05 * H.b], [cx + s * 1.12 * H.a, by + 0.1 * H.b], [cx + s * 1.08 * H.a, by + 0.75 * H.b], [cx + s * 0.86 * H.a, by + 0.8 * H.b]]; p.poly(fl, sc, ow * 0.7); } }
  if (O.goggles) { const gy = hc - 0.62 * H.b; for (const s of [-1, 1]) { p.ell(cx + s * 0.32 * H.a, gy, 0.26 * H.a, 0.18 * H.b, '#c8a24a', ow * 0.7); p.ell(cx + s * 0.32 * H.a, gy, 0.17 * H.a, 0.11 * H.b, '#9ad0ff', 0); p.ell(cx + s * 0.32 * H.a - 0.06 * H.a, gy - 0.04 * H.b, 0.06 * H.a, 0.04 * H.b, '#ffffffcc', 0); } }
  if (O.peakcap) { const by = hc - 0.5 * H.b, pc = O.peakcap; const crown = [[cx - 1.25 * H.a, by - 0.62 * H.b], [cx - 0.95 * H.a, by - 0.95 * H.b], [cx + 0.95 * H.a, by - 0.95 * H.b], [cx + 1.25 * H.a, by - 0.62 * H.b], [cx + 0.95 * H.a, by - 0.12 * H.b], [cx - 0.95 * H.a, by - 0.12 * H.b]];
    p.shadedFill(crown, pc, mul(pc, [0.62, 0.62, 0.66]), light, 1.2 * H.a, 0.35); p.inkRing(crown, ow * 0.85, thick); p.band([[cx - 0.97 * H.a, by - 0.2 * H.b], [cx + 0.97 * H.a, by - 0.2 * H.b]], O.capband || '#2a2a30', 0.2 * H.b, 1.4 * u);
    p.stroke([[cx - 0.8 * H.a, by - 0.32 * H.b], [cx + 0.8 * H.a, by - 0.32 * H.b]], 2.4 * u, '#d8d8e0'); const vis = [[cx - 0.95 * H.a, by - 0.08 * H.b], [cx + 0.95 * H.a, by - 0.08 * H.b], [cx + 0.7 * H.a, by + 0.14 * H.b], [cx - 0.7 * H.a, by + 0.14 * H.b]]; p.poly(vis, '#16161a', ow * 0.7); p.ell(cx, by - 0.55 * H.b, 0.12 * H.a, 0.1 * H.b, '#c8c8d0', 1.2 * u); }
  if (O.sidecap) { const by = hc - 0.62 * H.b, sc = O.sidecap; const cp = [[cx - 1.0 * H.a, by + 0.18 * H.b], [cx - 0.6 * H.a, by - 0.42 * H.b], [cx + 0.75 * H.a, by - 0.5 * H.b], [cx + 1.0 * H.a, by + 0.15 * H.b]]; p.shadedFill(cp, sc, mul(sc, [0.6, 0.6, 0.65]), light, H.a, 0.35); p.inkRing(cp, ow * 0.8, thick); p.stroke([[cx - 0.95 * H.a, by + 0.08 * H.b], [cx + 0.95 * H.a, by + 0.05 * H.b]], 2.2 * u, mul(sc, [1.6, 1.6, 1.6])); }
  if (O.cowboy) { const by = hc - 0.66 * H.b, cc = O.cowboy; const crown = [[cx - 0.82 * H.a, by + 0.05 * H.b], [cx - 0.7 * H.a, by - 0.75 * H.b], [cx - 0.2 * H.a, by - 0.62 * H.b], [cx, by - 0.78 * H.b], [cx + 0.2 * H.a, by - 0.62 * H.b], [cx + 0.7 * H.a, by - 0.75 * H.b], [cx + 0.82 * H.a, by + 0.05 * H.b]];
    p.shadedFill(crown, cc, mul(cc, [0.62, 0.62, 0.66]), light, H.a, 0.35); p.inkRing(crown, ow * 0.85, thick); p.band([[cx - 0.82 * H.a, by - 0.05 * H.b], [cx + 0.82 * H.a, by - 0.05 * H.b]], O.cowband || '#3a2418', 0.14 * H.b, 1.2 * u);
    const brim = [[cx - 1.55 * H.a, by - 0.22 * H.b], [cx - 1.0 * H.a, by + 0.1 * H.b], [cx + 1.0 * H.a, by + 0.1 * H.b], [cx + 1.55 * H.a, by - 0.22 * H.b], [cx + 1.1 * H.a, by + 0.24 * H.b], [cx - 1.1 * H.a, by + 0.24 * H.b]]; p.shadedFill(brim, cc, mul(cc, [0.55, 0.55, 0.6]), light, 1.5 * H.a, 0.35); p.inkRing(brim, ow * 0.85, thick); if (O.star) p.ell(cx, by - 0.38 * H.b, 0.16 * H.a, 0.15 * H.b, '#f2c94a', 1.5 * u); }
  if (O.bowler) { const by = hc - 0.58 * H.b, bc = O.bowler; const dome = ellPts(cx, by, H.a * 0.95, H.b * 0.82, 180, 360, 0, 32); dome.push([cx + H.a * 0.95, by + 0.02 * H.b], [cx - H.a * 0.95, by + 0.02 * H.b]); p.shadedFill(dome, bc, mul(bc, [0.55, 0.55, 0.6]), light, H.a, 0.35); p.inkRing(dome, ow * 0.85, thick);
    p.band([[cx - 0.95 * H.a, by - 0.06 * H.b], [cx + 0.95 * H.a, by - 0.06 * H.b]], '#5a1a2a', 0.13 * H.b, 1.2 * u); const brim = ellPts(cx, by + 0.06 * H.b, H.a * 1.25, H.b * 0.14, 0, 360, 0, 32); p.poly(brim, bc, ow * 0.8); p.ell(cx - 0.4 * H.a, by - 0.5 * H.b, 0.25 * H.a, 0.1 * H.b, '#ffffff40', 0); }
  if (O.bandana) { const by = hc - 0.42 * H.b; const bd = ellPts(cx, by + 0.05 * H.b, H.a * 1.06, H.b * 0.62, 180, 360, 0, 32); bd.push([cx + H.a * 1.06, by + 0.16 * H.b], [cx - H.a * 1.06, by + 0.16 * H.b]);
    p.shadedFill(bd, O.bandana, mul(O.bandana, [0.65, 0.65, 0.72]), light, H.a, 0.35); p.clip(bd, () => { for (let i = 0; i < 14; i++) p.ell(cx + (((i * 0.37) % 1) - 0.5) * 2 * H.a, by - ((i * 0.61) % 1) * 0.55 * H.b + 0.05 * H.b, 4.5 * u, 4.5 * u, "#ffffff", 0); }); p.inkRing(bd, ow * 0.8, thick);
    const kx = cx - 1.0 * H.a; p.poly([[kx, by], [kx - 0.45 * H.a, by - 0.2 * H.b], [kx - 0.5 * H.a, by + 0.12 * H.b]], O.bandana, ow * 0.6); p.poly([[kx, by + 0.05 * H.b], [kx - 0.38 * H.a, by + 0.45 * H.b], [kx - 0.12 * H.a, by + 0.5 * H.b]], O.bandana, ow * 0.6); p.ell(kx, by + 0.04 * H.b, 0.1 * H.a, 0.09 * H.b, mul(O.bandana, [0.8, 0.8, 0.8]), ow * 0.5); }
  if (O.chef) { const by = hc - 0.66 * H.b; const band = [[cx - 0.88 * H.a, by + 0.12 * H.b], [cx + 0.88 * H.a, by + 0.12 * H.b], [cx + 0.86 * H.a, by - 0.35 * H.b], [cx - 0.86 * H.a, by - 0.35 * H.b]];
    const puff = []; for (let k = 0; k <= 40; k++) { const a = Math.PI + (k / 40) * Math.PI; const bump = 1 + 0.07 * Math.sin(k / 40 * Math.PI * 7); puff.push([cx + Math.cos(a) * 1.08 * H.a * bump, by - 0.35 * H.b + Math.sin(a) * 1.15 * H.b * bump]); }
    puff.push([cx + 0.86 * H.a, by - 0.3 * H.b], [cx - 0.86 * H.a, by - 0.3 * H.b]); p.shadedFill(puff, "#ffffff", "#d8dce8", light, H.a, 0.35); p.inkRing(puff, ow * 0.85, thick);
    for (const s of [-0.45, 0, 0.45]) p.stroke(curve([cx + s * H.a, by - 0.38 * H.b], [cx + s * 1.25 * H.a, by - 0.9 * H.b], [cx + s * 1.1 * H.a, by - 1.3 * H.b], 8), 2.2 * u, "#b8bccc");
    p.shadedFill(band, "#ffffff", "#e0e4ee", light, H.a, 0.35); p.inkRing(band, ow * 0.8, thick); }
  if (O.bicorne) { const by = hc - 0.5 * H.b, bc = O.bicorne; const hat = [[cx - 1.55 * H.a, by + 0.12 * H.b], [cx - 1.1 * H.a, by - 0.42 * H.b], [cx - 0.45 * H.a, by - 0.85 * H.b], [cx, by - 0.95 * H.b], [cx + 0.45 * H.a, by - 0.85 * H.b], [cx + 1.1 * H.a, by - 0.42 * H.b], [cx + 1.55 * H.a, by + 0.12 * H.b], [cx, by + 0.3 * H.b]];
    p.shadedFill(hat, bc, mul(bc, [0.55, 0.55, 0.62]), light, 1.5 * H.a, 0.35); p.inkRing(hat, ow * 0.9, thick); p.stroke([[cx - 1.5 * H.a, by + 0.1 * H.b], [cx - 1.05 * H.a, by - 0.36 * H.b], [cx - 0.42 * H.a, by - 0.76 * H.b], [cx, by - 0.86 * H.b], [cx + 0.42 * H.a, by - 0.76 * H.b], [cx + 1.05 * H.a, by - 0.36 * H.b], [cx + 1.5 * H.a, by + 0.1 * H.b]], 4.5 * u, "#f2c94a");
    p.ell(cx, by - 0.3 * H.b, 0.32 * H.a, 0.3 * H.b, "#ffffff", ow * 0.6); p.ell(cx, by - 0.3 * H.b, 0.2 * H.a, 0.19 * H.b, "#2f5fc8", 0); p.ell(cx, by - 0.3 * H.b, 0.09 * H.a, 0.09 * H.b, "#d8322f", 0); p.ell(cx - 0.5 * H.a, by - 0.55 * H.b, 0.25 * H.a, 0.06 * H.b, "#ffffff40", 0); }
  if (O.tricorn) { const by = hc - 0.48 * H.b, tc = O.tricorn; if (O.feather) { p.stroke(curve([cx + 0.2 * H.a, by - 0.55 * H.b], [cx + 0.9 * H.a, by - 1.35 * H.b], [cx + 1.5 * H.a, by - 1.0 * H.b], 12), 18 * u, INK); p.stroke(curve([cx + 0.2 * H.a, by - 0.55 * H.b], [cx + 0.9 * H.a, by - 1.35 * H.b], [cx + 1.5 * H.a, by - 1.0 * H.b], 12), 12 * u, O.feather); }
    const crown = ellPts(cx, by - 0.3 * H.b, H.a * 0.9, H.b * 0.6, 180, 360, 0, 28); crown.push([cx + 0.9 * H.a, by], [cx - 0.9 * H.a, by]); p.shadedFill(crown, tc, mul(tc, [0.6, 0.6, 0.66]), light, H.a, 0.35); p.inkRing(crown, ow * 0.8, thick);
    const brim = [[cx - 1.6 * H.a, by - 0.45 * H.b], [cx - 0.9 * H.a, by + 0.05 * H.b], [cx, by + 0.28 * H.b], [cx + 0.9 * H.a, by + 0.05 * H.b], [cx + 1.6 * H.a, by - 0.45 * H.b], [cx + 0.95 * H.a, by + 0.32 * H.b], [cx, by + 0.42 * H.b], [cx - 0.95 * H.a, by + 0.32 * H.b]];
    p.shadedFill(brim, tc, mul(tc, [0.55, 0.55, 0.6]), light, 1.5 * H.a, 0.35); p.inkRing(brim, ow * 0.9, thick); p.stroke([[cx - 1.55 * H.a, by - 0.42 * H.b], [cx - 0.92 * H.a, by + 0.08 * H.b], [cx, by + 0.31 * H.b], [cx + 0.92 * H.a, by + 0.08 * H.b], [cx + 1.55 * H.a, by - 0.42 * H.b]], 4 * u, "#f2c94a");
    if (O.skull) { const sx = cx, sy = by - 0.3 * H.b; p.ell(sx, sy, 0.22 * H.a, 0.2 * H.b, "#ffffff", 1.5 * u); p.ell(sx - 0.08 * H.a, sy - 0.01 * H.b, 0.05 * H.a, 0.05 * H.b, INK, 0); p.ell(sx + 0.08 * H.a, sy - 0.01 * H.b, 0.05 * H.a, 0.05 * H.b, INK, 0); for (const s of [-1, 1]) p.stroke([[sx - 0.3 * H.a, sy + s * 0.22 * H.b], [sx + 0.3 * H.a, sy - s * 0.22 * H.b]], 3 * u, "#ffffff"); } }
  faceFront(p, cx, hc, W, expr, facing, look, lid, helmet, skin, O.beard ? O.beard : O.moustache, !!O.stout);
  if (O.eyepatch) { const ex = cx + 7 * u * facing + 14 * u; p.stroke([[cx - H.a * 0.95, hc - 0.45 * H.b], [ex, hc], [cx + H.a * 0.98, hc + 0.1 * H.b]], 2.8 * u, INK); p.ell(ex, hc + 1 * u, 13 * u, 11 * u, "#1a1418", 1.5 * u); p.ell(ex - 4 * u, hc - 3 * u, 4 * u, 2 * u, "#ffffff40", 0); }
  if (O.monocle) { const ex = cx + 7 * u * facing + 13 * u; p.ell(ex, hc, 15 * u, 15 * u, '#ffffff33', 3 * u); p.ell(ex - 5 * u, hc - 5 * u, 4 * u, 3 * u, '#ffffffaa', 0); p.stroke(curve([ex + 6 * u, hc + 14 * u], [ex + 18 * u, hc + 60 * u], [ex - 10 * u, hc + 110 * u], 8), 1.6 * u, '#c8a24a'); }
  if (O.soot) for (let k = 0; k < 7; k++) p.ell(cx + Math.sin(k * 3.1) * 0.6 * H.a, hc + (0.1 + ((k * 0.43) % 1) * 0.6) * H.b, 6 * u, 3.5 * u, "#2a242233", 0);
  if (opts.blush) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 24 * u, hc + 10 * u, 8 * u, 4.5 * u, "#ff8a8a66", 0);
  if (opts.sweat) for (let k = 0; k < opts.sweat; k++) { const sx = cx + (38 - k * 70) * u * (k % 2 ? -1 : 1) * 0.6 + 30 * u, sy = hc - (24 - k * 10) * u; p.poly([[sx, sy - 9 * u], [sx + 5 * u, sy + 2 * u], [sx, sy + 6 * u], [sx - 5 * u, sy + 2 * u]], "#bfe6ff", 1.8 * u); p.dot(sx - 1.5 * u, sy + 1 * u, 1.3 * u, "#ffffff"); }
  if (opts.glasses) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 13 * u, hc, 10 * u, 10 * u, "#ffffff22", 2.6 * u);
  if (O.wig) for (let k = 0; k < 5; k++) p.ell(cx - 0.6 * H.a + k * 0.3 * H.a, hc - 0.82 * H.b, 0.2 * H.a, 0.16 * H.b, O.wig, 2.5 * u);
  if (O.brows) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 14 * u, hc - 20 * u, 11 * u, 5 * u, O.brows, 2 * u);
  if (O.beard) { // re-draw the mouth over the beard for open mouths
    if (expr === "shock" || expr === "snore") p.ell(cx + 8 * u * facing, hc + 22 * u, 6 * u, 7 * u, "#5a1e28", 2 * u);
  }
  p.rot = null;
  if (arms.some((a) => a.swirl)) { // cuckoo swirl next to the temple
    const a = arms.find((x) => x.swirl), [hx, hy] = a.pts[2], ph = opts.swirl || 0, pts = [];
    for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 4 + ph, r = (4 + i * 0.7) * u; pts.push([hx + Math.cos(t) * r, hy - 40 * u + Math.sin(t) * r]); }
    p.stroke(pts, 3 * u, "#ffffff"); p.stroke(pts, 1.4 * u, INK);
  }
};

/** loose helmet prop card (lifted off the old soldier) */
export const helmetCard = (p) => {
  const H = headBlob(3, 118, 0), u = 2 * H.a / 100, hc = 560, light = rad(-120), thick = thickAngle(light), ow = 5 * u;
  galea(p, H, 300, hc, light, thick, ow, true, u);
  const bandY = hc - H.b * 0.42, bp = ellPts(300, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  // dark inside visible from below
  p.ell(300, bandY, H.a * 1.05, 0.12 * H.b, "#2a221e", 0);
  p.shadedFill(bp, "#8f8a7e", mul("#8f8a7e", [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => { for (let i = 0; i < 9; i++) p.ell(300 + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
  p.poly(bp, null, ow * 0.9);
  p.band([[300 - H.a * 1.05, bandY], [300 + H.a * 1.05, bandY]], "#a88a4a", 7 * u, 1.8 * u, "round");
  cheeks(p, H, 300, hc, light, ow, true, u);
};

/** ZZZ for the sleeping guard */
export const fxZ = (p, t) => {
  const g = p.g; g.save(); g.font = "900 120px Arial Black, Arial"; g.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const k = (t + i / 3) % 1, x = 220 + i * 70 + Math.sin(k * 6) * 20, y = 700 - k * 500, s = 0.5 + k * 0.7;
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = Math.min(1, (1 - k) * 2.5);
    g.lineWidth = 16; g.strokeStyle = INK; g.strokeText("Z", 0, 0); g.fillStyle = "#ffffff"; g.fillText("Z", 0, 0); g.restore();
  }
  g.restore();
};
/** falling leaf */
export const fxLeaf = (p, col) => { p.poly([[300, 380], [420, 470], [300, 620], [180, 470]], col, 14); p.stroke([[300, 400], [300, 600]], 8); };
/** dust cloud puff (k 0..1 growth) */
export const fxDust = (p, k, col = "#e8dcc4") => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - k * k);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = 90 + 150 * k; p.ell(300 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.6, 120 + 60 * k, 100 + 50 * k, col, 12); }
  p.ell(300, 520, 170 + 110 * k, 140 + 80 * k, col, 0);
  g.restore();
};
export const fxDrip = (p) => p.ell(300, 500, 40, 64, "#9fd4ff", 10);
export const fxWood = (p, seed) => { p.poly([[200, 420], [400, 400], [420, 560], [230, 600]], "#5b3d22", 14); p.stroke([[240, 450], [380, 440]], 6, "#3a2614"); p.ell(330, 520, 26, 18, "#4d7a32", 0); };

export const headCenter = (seed = 3) => { const H = headBlob(seed, 118, 0), HH = 2 * H.b; return 975 - 1.38 * HH - 1.08 * HH - H.b; };

/** beer pouring down into a cellar window (t 0..1 loops) */
export const fxPour = (p, t) => {
  const g = p.g, w = 150;
  const pts = []; for (let i = 0; i <= 20; i++) { const y = 300 + i * 30; pts.push([300 - w / 2 + 14 * Math.sin(i * 0.9 + t * 12), y]); }
  for (let i = 20; i >= 0; i--) { const y = 300 + i * 30; pts.push([300 + w / 2 + 14 * Math.sin(i * 0.8 + t * 12 + 1), y]); }
  p.poly(pts, "#6b3a1c", 10);
  for (let i = 0; i < 7; i++) { const y = 300 + ((i / 7 + t) % 1) * 560; p.ell(300 + Math.sin(i * 2.1) * 40, y, 22, 14, "#e8cfa0", 0); }
  p.ell(300, 300, 110, 40, "#f1dfb8", 8);
};
/** candle flame */
export const fxFlame = (p, k) => { p.poly([[300, 300 - 40 * k], [360, 520], [300, 600], [240, 520]], "#ffb43a", 10); p.poly([[300, 420], [330, 540], [300, 580], [270, 540]], "#fff2b8", 0); };
/** a gold coin */
export const fxCoin = (p) => { p.ell(300, 500, 120, 120, "#e2b84a", 14); p.ell(300, 500, 80, 80, "#f3d27a", 8); };

/** side-view horse (faces right). gallop 0..1 phase, rear 0..1 lifts the front legs */
export const fxHorse = (p, o = {}) => {
  const { col = "#8a5a3a", mane = "#2a1e18", gallop = 0, rear = 0 } = o, g = p.g;
  g.save(); g.translate(300, 860); g.rotate(-rear * 0.6); g.translate(-300, -860);
  const leg = (x, ph, front) => { const a = Math.sin((gallop + ph) * Math.PI * 2) * 0.5 - (front ? rear * 1.1 : 0); const kx = x + Math.sin(a) * 60, ky = 860 + Math.cos(a) * 60;
    p.stroke([[x, 760], [kx, ky], [kx + (front ? 20 : -10), ky + 80]], 26, col); p.stroke([[kx + (front ? 20 : -10), ky + 80], [kx + (front ? 34 : 4), ky + 82]], 30, "#2a2018"); };
  leg(170, 0.5, false); leg(420, 0, true);
  p.ell(300, 700, 210, 110, col, 12);
  p.poly([[440, 660], [520, 470], [600, 470], [600, 540], [500, 700]], col, 12);
  p.ell(570, 490, 70, 45, col, 12); p.dot(585, 470, 9); p.poly([[540, 440], [560, 405], [575, 445]], col, 8);
  p.poly([[470, 640], [520, 455], [545, 460], [500, 660]], mane, 6);
  p.poly([[95, 650], [40, 780], [70, 790], [110, 690]], mane, 6);
  leg(200, 0, false); leg(450, 0.5, true);
  p.stroke([[330, 590], [330, 640]], 0); p.poly([[250, 590], [380, 590], [370, 640], [260, 640]], "#b8322f", 8);
  g.restore();
};
/** rider on horseback: the rider card drawn small on top of the horse */
export const rider = (p, who, ro, ho) => {
  const g = p.g; g.save(); g.translate(300, 800); g.scale(0.6, 0.6); g.translate(-300, -975); romanFront(p, who, ro); g.restore();
  fxHorse(p, ho);
};
/** iron bomb with a sparking fuse */
export const fxSpark = (p, t) => { for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + t * 6, r = 60 + 40 * ((t * 3 + i * 0.3) % 1); p.stroke([[300, 500], [300 + Math.cos(a) * r, 500 + Math.sin(a) * r]], 14, i % 2 ? "#ffd84a" : "#ff8a2a"); } p.ell(300, 500, 34, 34, "#fff6c8", 0); };
/** jagged lightning bolt */
export const fxBolt = (p, seed = 1) => { let x = 300, y = 0; const pts = [[x, y]]; let s = seed; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  while (y < 1000) { x += (r() - 0.5) * 160; y += 60 + r() * 60; pts.push([x, y]); } p.stroke(pts, 30, "#ffffff"); p.stroke(pts, 12, "#fff6a8"); };
/** rain streaks */
export const fxRain = (p, t) => { for (let i = 0; i < 40; i++) { const x = (i * 97) % 600, y = ((i * 173 + t * 900) % 1100) - 100; p.stroke([[x, y], [x - 40, y + 120]], 5, "#d8e6ff"); } };
/** a shout burst for the samurai */
export const fxShout = (p, t) => { for (let i = 0; i < 3; i++) { const k = (t + i / 3) % 1, r = 120 + k * 260; p.g.save(); p.g.globalAlpha = 1 - k; p.stroke(ellPts(300, 500, r, r * 0.8, -60, 60, 0, 20), 14, "#ffffff"); p.g.restore(); } };

Object.assign(OUTFITS, {
  worker: { tunic: "#ff7a1a", skin: "#fffdf8", cap: "#f4f4f0", hivis: true, belt: "#2a2a30" },
  railman: { tunic: "#2b3f6b", skin: "#fffdf8", cap: "#1f2a44", coat: true, scarf: "#c8322f", moustache: "#5a3a24", belt: "#3a2a1e" },
  engineer: { tunic: "#7a8a96", skin: "#fffdf8", hair: "#f0d070", peakcap: "#7a8a96", capband: "#2a3a4a", monocle: true, coat: true, vest: "#5a6a76", tie: "#2a3a4a", pants: "#5a6a76", boot: "#1a1a1a" },
  bossA: { tunic: "#2a2a38", skin: "#fffdf8", hat: "tophat", moustache: "#2a2018", stout: true, pattern: "pin", vest: "#8a1f2a", vestPat: "#00000033", tie: "#e8c25a" },
  bossB: { tunic: "#3a2a22", skin: "#fffdf8", hat: "tophat", hair: "#9a9a9a", moustache: "#d8d8d8", beard: "#e8e8e8", vest: "#c9962e", tie: "#2a3a6a", stout: true },
  bossC: { tunic: "#2f3f2f", skin: "#fffdf8", hair: "#5a3b2a", pattern: "tartan", pcol: "#14241699", pcol2: "#c8322f", vest: "#e8dcc4", tie: "#1f2a44" },
  bossD: { tunic: "#4a2a4a", skin: "#fffdf8", hat: "tophat", moustache: "#3a2a1e", vest: "#2a5a5a", vestPat: "#ffffff22", tie: "#e8c25a" },
  driver: { tunic: "#5a6a7a", skin: "#fffdf8", cap: "#2a3a5a", overalls: "#3f5f8a", soot: true, scarf: "#e8a23a", moustache: "#2a2018" },
  fireman: { tunic: "#7a4a2a", skin: "#fffdf8", cap: "#3a3a3a", overalls: "#4a4a52", soot: true, scarf: "#c8322f" },
});
/** 2D props held in a hand (drawn on the card) */
export const propLantern = (p, x, y, u, glow = 1) => { const g = p.g;
  g.save(); const gr = g.createRadialGradient(x, y + 30 * u, 2, x, y + 30 * u, 90 * u); gr.addColorStop(0, `rgba(255,220,140,${0.55 * glow})`); gr.addColorStop(1, "rgba(255,180,80,0)"); g.fillStyle = gr; g.fillRect(x - 90 * u, y - 60 * u, 180 * u, 180 * u); g.restore();
  p.stroke(ellPts(x, y - 4 * u, 9 * u, 8 * u, 180, 360, 0, 12), 2.6 * u);
  p.poly(rrect(x - 15 * u, y + 2 * u, x + 15 * u, y + 9 * u, 2 * u), "#2a2a30", 2 * u);
  p.poly(rrect(x - 13 * u, y + 9 * u, x + 13 * u, y + 46 * u, 3 * u), "#ffd27a", 2.4 * u);
  p.poly(rrect(x - 7 * u, y + 15 * u, x + 7 * u, y + 40 * u, 4 * u), "#fff6d8", 0);
  p.poly([[x, y + 18 * u], [x + 5 * u, y + 30 * u], [x, y + 37 * u], [x - 5 * u, y + 30 * u]], "#ff9a2a", 0);
  for (const s of [-1, 1]) p.stroke([[x + s * 13 * u, y + 9 * u], [x + s * 13 * u, y + 46 * u]], 3 * u, "#2a2a30");
  p.poly(rrect(x - 16 * u, y + 46 * u, x + 16 * u, y + 54 * u, 2 * u), "#2a2a30", 2 * u);
};
export const propDetonator = (p, x, y, u) => { // a coin-size red tin with two lead straps
  p.ell(x, y, 16 * u, 16 * u, "#c8322f", 2.4 * u); p.ell(x, y, 10 * u, 10 * u, "#e85a4a", 0); p.ell(x - 4 * u, y - 5 * u, 4 * u, 2.5 * u, "#ffffffaa", 0);
  for (const s of [-1, 1]) p.poly(rrect(x + s * 14 * u - 5 * u, y - 4 * u, x + s * 14 * u + 5 * u + s * 10 * u, y + 4 * u, 1 * u), "#9aa0a8", 1.6 * u);
  p.g.save(); p.g.font = `900 ${10 * u}px Arial`; p.g.fillStyle = "#fff"; p.g.textAlign = "center"; p.g.fillText("!", x, y + 4 * u); p.g.restore();
};

Object.assign(OUTFITS, {
  digger: { tunic: "#b39158", skin: "#fffdf8", slouch: "#8f7650", band: "#c9a86a", pinned: true, belt: "#6a4022", pockets: true, boot: "#4a3020" },
  digger2: { tunic: "#a88a52", skin: "#fffdf8", slouch: "#7f6a48", band: "#b8945a", pinned: true, belt: "#6a4022", pockets: true, moustache: "#5a3a24", boot: "#4a3020" },
  major: { tunic: "#9a8258", skin: "#fffdf8", cap: "#6a5638", moustache: "#3a2a1e", stout: true, belt: "#6a4022", pockets: true, sam: true, coat: false, boot: "#2a1a14" },
  farmer: { tunic: "#3f6fa8", skin: "#fffdf8", slouch: "#d9b45a", band: "#8a5a2a", pattern: "check", pcol: "#1f3a6a66", pcol2: "#e8e0d0", belt: "#5a3a22", moustache: "#8a5a3a", overalls: "#4a5a72", boot: "#4a3020" },
  farmer2: { tunic: "#c8502a", skin: "#fffdf8", slouch: "#e8c878", band: "#c8322f", pattern: "check", pcol: "#6a1a0a55", pcol2: "#f4e8d0", belt: "#5a3a22", boot: "#4a3020", beard: "#a8a8a8" },
  farmwife: { tunic: "#e8d8b8", skin: "#fffdf8", hat: "bonnet", dress: "#4a8a6a", hair: "#7a4a2a", boot: "#3a2a22" },
});
/** side-view cartoon emu (faces right). run 0..1 phase, mood: 'calm'|'angry'|'smug'|'shock', peck 0..1, head look */
export const fxEmu = (p, o = {}) => { const { run = -1, mood = "calm", peck = 0, bob = 0, blink = 0 } = o, g = p.g;
  const running = run >= 0, ph = running ? run : 0, by = 560 + (running ? Math.abs(Math.sin(ph * Math.PI * 2)) * -18 : bob * 10);
  const legC = "#6f7884", legD = "#525a66";
  const leg = (off, dark) => { const a = running ? Math.sin((ph + off) * Math.PI * 2) : 0, hip = [300 + (off ? -10 : 10), by + 60];
    const knee = [hip[0] + 30 + a * 40, hip[1] + 120 - Math.abs(a) * 20], foot = [knee[0] - 20 + a * 70, 960 - (running ? Math.max(0, Math.sin((ph + off) * Math.PI * 2)) * 60 : 0)];
    p.stroke(curve(hip, [hip[0] + 10, hip[1] + 60], knee), 26, dark ? legD : legC); p.stroke([knee, foot], 18, dark ? legD : legC); p.dot(knee[0], knee[1], 14, dark ? legD : legC);
    for (const t of [-1, 0, 1]) p.stroke([foot, [foot[0] + 34 + t * 6, foot[1] + t * 12 + 4]], 9, dark ? legD : legC); };
  leg(0.5, true);
  // shaggy body
  const body = []; for (let i = 0; i <= 64; i++) { const t = i / 64 * Math.PI * 2, j = 1 + (i % 2 ? 0.09 : -0.02) * (Math.sin(t) > -0.2 ? 1 : 0.4); body.push([300 + Math.cos(t) * 175 * j - 10, by + Math.sin(t) * 120 * j]); }
  p.gradFill(body, "#6a4a32", "#3a2818", rad(-120)); p.inkRing(body, 12, rad(-120));
  for (let i = 0; i < 26; i++) { const x = 170 + (i * 37) % 260, y = by - 70 + ((i * 53) % 140); p.stroke([[x, y], [x - 22, y + 30]], 5, i % 3 ? "#2e2014" : "#8a6448"); }
  p.ell(240, by - 60, 60, 22, "#ffffff30", 0);
  // neck + head
  const hx = 430 + peck * 60, hy = 230 + peck * 260 + (running ? Math.sin(ph * Math.PI * 4) * 12 : 0);
  const neck = curve([400, by - 50], [480, by - 180], [hx, hy + 30], 14); p.stroke(neck, 52, "#1d1a24"); p.stroke(neck, 44, "#5f7fa8");
  for (let i = 2; i < 12; i += 2) p.stroke([neck[i], [neck[i][0] - 14, neck[i][1] + 6]], 5, "#3e5a82");
  p.ell(hx, hy, 58, 46, "#5f7fa8", 10); p.ell(hx - 22, hy - 26, 16, 10, "#ffffff55", 0);
  for (let i = 0; i < 5; i++) p.stroke([[hx - 30 + i * 12, hy - 42], [hx - 34 + i * 12, hy - 62 - (i % 2) * 8]], 6, "#3a2a1e");
  p.poly([[hx + 40, hy - 6], [hx + 108, hy + 10], [hx + 40, hy + 22]], "#2a2420", 8); p.stroke([[hx + 44, hy + 9], [hx + 100, hy + 11]], 3, "#6a5a50");
  // eye
  const ex = hx + 10, ey = hy - 8;
  if (blink > 0.5) p.stroke([[ex - 18, ey], [ex + 18, ey]], 7);
  else { p.ell(ex, ey, mood === "shock" ? 26 : 22, mood === "shock" ? 28 : 22, "#ffffff", 7); p.ell(ex + 6, ey + (mood === "smug" ? 4 : 0), 9, 10, "#1d1a24", 0); p.ell(ex + 3, ey - 4, 3, 3, "#ffffff", 0);
    if (mood === "smug") p.poly([[ex - 26, ey - 4], [ex + 26, ey - 4], [ex + 26, ey - 26], [ex - 26, ey - 26]], "#5f7fa8", 0); }
  if (mood === "angry") p.stroke([[ex - 24, ey - 34], [ex + 22, ey - 18]], 9);
  if (mood === "smug") p.stroke([[ex - 24, ey - 6], [ex + 24, ey - 6]], 6);
  if (mood === "shock") p.arc(ex, ey - 40, 18, 6, 200, 340, 7);
  if (o.hat) { const by = hy - 40; p.poly(ellPts(hx, by, 52, 46, 180, 360, 0, 24), "#8f7650", 8); p.band([[hx - 52, by - 6], [hx + 52, by - 6]], "#c9a86a", 12, 3); p.poly(ellPts(hx, by + 2, 96, 14, 0, 360, 0, 30), "#8f7650", 7);
    p.poly([[hx - 40, by], [hx - 92, by - 6], [hx - 80, by - 58], [hx - 52, by - 52]], "#a08660", 6); p.ell(hx - 70, by - 28, 8, 8, "#e8c25a", 3); }
  leg(0, false);
};

/** expression with a different mouth (for talking: alternate open/closed) */
export const withMouth = (expr, m) => { const k = expr + "_" + m; if (!FACE[k]) FACE[k] = { ...FACE[expr], mouth: m }; return k; };

Object.assign(OUTFITS, {
  craftsman: { tunic: "#b0323c", skin: "#fffdf8", hair: "#1d1a24", bun: true, headband: "#f4ead8", belt: "#3a2a1e", boot: "#3a2a22", pattern: "pin", pcol: "#00000022" },
  kdef1: { tunic: "#2f5a9a", skin: "#fffdf8", slouch: "#1d1a24", band: "#c8322f", plume: "#d8322f", belt: "#c8322f", boot: "#2a2220", pockets: false },
  kdef2: { tunic: "#3f7a5a", skin: "#fffdf8", slouch: "#1d1a24", band: "#e8c25a", plume: "#3f6ad8", belt: "#e8c25a", boot: "#2a2220", moustache: "#2a2018" },
  general: { tunic: "#8a1f2a", skin: "#fffdf8", armor: true, lacquer: "#c8962e", slouch: "#1d1a24", band: "#e8c25a", plume: "#ffd84a", moustache: "#1d1a24", beard: "#1d1a24", stout: true, boot: "#2a1a14" },
  ashi: { tunic: "#3a3a46", skin: "#fffdf8", armor: true, lacquer: "#4a4a5a", jingasa: "#2a2622", spear: true, boot: "#2a2220" },
  ashi2: { tunic: "#5a3a2a", skin: "#fffdf8", armor: true, lacquer: "#6a4632", jingasa: "#3a3028", spear: true, moustache: "#2a2018", boot: "#2a2220" },
});
export const propDrill = (p, x, y, u, turn = 0) => { p.stroke([[x, y - 70 * u], [x, y + 40 * u]], 4 * u, "#6a4426"); p.ell(x, y - 74 * u, 9 * u, 6 * u, "#8a5a34", 2 * u);
  const k = Math.sin(turn) * 22 * u; p.stroke([[x - 22 * u, y - 20 * u + k * 0.2], [x + 22 * u, y - 20 * u - k * 0.2]], 3 * u, "#3a2a1e"); p.stroke([[x, y + 40 * u], [x, y + 62 * u]], 2.4 * u, "#9aa0a8"); };
export const propSword = (p, x, y, u, ang = -80) => { const g = p.g; g.save(); g.translate(x, y); g.rotate(ang * Math.PI / 180);
  p.poly([[0, -6 * u], [150 * u, -4 * u], [170 * u, 0], [150 * u, 4 * u], [0, 6 * u]], "#e8eef4", 2 * u); p.stroke([[10 * u, 0], [150 * u, 0]], 1.2 * u, "#9aa4b0"); p.poly(rrect(-8 * u, -16 * u, 4 * u, 16 * u, 3 * u), "#e8c25a", 2 * u); p.poly(rrect(-40 * u, -5 * u, -6 * u, 5 * u, 2 * u), "#3a2018", 2 * u); g.restore(); };
export const propTorch = (p, x, y, u, t = 0) => { p.stroke([[x, y + 30 * u], [x + 8 * u, y - 50 * u]], 6 * u, "#6a4426"); const fy = y - 56 * u, fl = 1 + 0.15 * Math.sin(t * 25);
  p.poly([[x + 8 * u, fy - 46 * u * fl], [x + 26 * u, fy], [x + 8 * u, fy + 12 * u], [x - 10 * u, fy]], "#ff8a2a", 2 * u); p.poly([[x + 8 * u, fy - 26 * u * fl], [x + 16 * u, fy], [x + 8 * u, fy + 6 * u], [x, fy]], "#fff2b0", 0); };
export const propArrow = (p, x, y, u, ang = -30) => { const g = p.g; g.save(); g.translate(x, y); g.rotate(ang * Math.PI / 180); p.stroke([[-110 * u, 0], [60 * u, 0]], 2.4 * u, "#c8a070");
  p.poly(rrect(10 * u, -7 * u, 50 * u, 7 * u, 3 * u), "#c8322f", 1.6 * u); p.poly([[60 * u, -5 * u], [76 * u, 0], [60 * u, 5 * u]], "#9aa0a8", 1.4 * u); p.poly([[-110 * u, 0], [-96 * u, -10 * u], [-80 * u, -10 * u], [-92 * u, 0]], "#f4ead8", 1.2 * u); g.restore(); };

Object.assign(OUTFITS, {
  rworker: { tunic: "#2f8a6a", skin: "#fffdf8", rcap: "#3a5a9a", rcapS: "#f4f4f0", scarf: "#c8322f", overalls: "#3a5a8a", belt: "#5a3a22", boot: "#3a2a22" },
  tycoon: { tunic: "#2a2a38", skin: "#fffdf8", hat: "tophat", moustache: "#2a2018", stout: true, vest: "#e8b84a", vestPat: "#00000022", tie: "#8a1f2a", pattern: "pin", boot: "#1a1414" },
  newsboy: { tunic: "#8a6a44", skin: "#fffdf8", cap: "#5a4a3a", pattern: "check", pcol: "#3a2a1a44", pcol2: "#e8c25a", vest: "#4a5a3a", boot: "#3a2a22" },
});
export const propSaw = (p, x, y, u, k = 0) => { const g = p.g; g.save(); g.translate(x + Math.sin(k) * 14 * u, y); g.rotate(0.15);
  p.stroke([[-10 * u, -30 * u], [-10 * u, 10 * u], [110 * u, 10 * u], [110 * u, -30 * u]], 4 * u, "#3a3a44"); p.poly([[-10 * u, 8 * u], [110 * u, 8 * u], [110 * u, 14 * u], [-10 * u, 14 * u]], "#d8dde2", 1.2 * u);
  for (let i = 0; i < 20; i++) p.poly([[-10 * u + i * 6 * u, 14 * u], [-7 * u + i * 6 * u, 18 * u], [-4 * u + i * 6 * u, 14 * u]], "#b8c0c8", 0); p.poly(rrect(-30 * u, -36 * u, -6 * u, 14 * u, 6 * u), "#c8322f", 2 * u); g.restore(); };
export const propNews = (p, x, y, u, head = "THE FUTURE!") => { const g = p.g; g.save(); g.translate(x - 60 * u, y - 100 * u); p.poly(rrect(0, 0, 130 * u, 160 * u, 3 * u), "#f4ecd8", 2.4 * u);
  g.fillStyle = "#2a2020"; g.font = `900 ${13 * u}px Georgia`; g.textAlign = "center"; g.fillText("THE DESERT GAZETTE", 65 * u, 18 * u); g.fillRect(8 * u, 23 * u, 114 * u, 2 * u); g.font = `900 ${21 * u}px Georgia`; g.fillText(head, 65 * u, 50 * u);
  p.poly(rrect(12 * u, 60 * u, 118 * u, 112 * u, 2 * u), "#c8b898", 1.4 * u); g.fillStyle = "#3a2a20"; g.fillRect(20 * u, 92 * u, 90 * u, 4 * u); for (let i = 0; i < 5; i++) g.fillRect(14 * u, (120 + i * 8) * u, 102 * u, 2.2 * u); g.restore(); };

Object.assign(OUTFITS, {
  nora: { tunic: "#3f7ad8", skin: "#fffdf8", hair: "#c8502a", braids: "#c8502a", bow: "#ffd84a", boot: "#8a3a2a", pattern: "check", pcol: "#ffffff33", pcol2: "#ffd84a" },
  norarain: { tunic: "#ffcc1a", skin: "#fffdf8", hair: "#c8502a", braids: "#c8502a", bow: "#3f7ad8", hood: "#ffcc1a", dress: "#ffcc1a", boot: "#c8322f", coat: true },
  tguard: { tunic: "#2a3f7a", skin: "#fffdf8", hat: "shako", coat: true, belt: "#f4ead8", spear: true, moustache: "#3a2a1e", boot: "#1a1414" },
  mayor: { tunic: "#5a2a6a", skin: "#fffdf8", hat: "tophat", moustache: "#d8d8d8", stout: true, vest: "#e8b84a", vestPat: "#00000022", tie: "#c8322f", scarf: "#e8c25a", boot: "#1a1414" },
  grandpa: { tunic: "#7a5a3a", skin: "#fffdf8", hair: "#e8e8e8", beard: "#f0f0f0", brows: "#f0f0f0", vest: "#3f5a3a", tie: "#8a1f2a", boot: "#3a2a22" },
  bronze: { tunic: "#a8743a", skin: "#c8945a", hat: "tophat", moustache: "#7a4a22", stout: true, boot: "#7a4a22" },
});
/** the founders' map: spiral town + river channels; k = 0..1 reveals flow arrows */
export const fxMap = (p, k = 0, t = 0) => { const g = p.g; g.save(); p.poly(rrect(40, 120, 560, 880, 10), "#f0e0b8", 10);
  g.globalAlpha = 0.25; for (let i = 0; i < 40; i++) { g.fillStyle = "#a07840"; g.beginPath(); g.arc(60 + (i * 97) % 480, 140 + (i * 53) % 720, 6 + (i % 5) * 4, 0, 7); g.fill(); } g.globalAlpha = 1;
  g.strokeStyle = "#5a3a20"; g.lineWidth = 6; g.beginPath(); for (let i = 0; i <= 300; i++) { const th = i / 300 * Math.PI * 6.2, r = 18 + th * 11; const x = 300 + Math.cos(th) * r, y = 560 + Math.sin(th) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.strokeStyle = "#3a6ab0"; g.lineWidth = 22; g.globalAlpha = 0.55; g.beginPath(); g.moveTo(300, 140); g.bezierCurveTo(330, 260, 280, 330, 300, 420); g.stroke(); g.globalAlpha = 1;
  g.fillStyle = "#c8222a"; g.beginPath(); g.arc(300, 560, 12, 0, 7); g.fill(); g.font = "italic 900 34px Georgia"; g.fillStyle = "#3a2418"; g.textAlign = "center"; g.fillText("OAKVALE · 1823", 300, 175); g.font = "italic 26px Georgia"; g.fillText("~ old river ~", 380, 250);
  if (k > 0) { g.strokeStyle = "#2a7ad8"; g.fillStyle = "#2a7ad8"; g.lineWidth = 7; const n = Math.floor(k * 10); for (let j = 0; j < n; j++) { const th = 6.2 * Math.PI - j * 0.62 - (t * 2 % 0.62), r = 18 + th * 11, x = 300 + Math.cos(th) * r, y = 560 + Math.sin(th) * r, a = th + Math.PI / 2 + Math.PI; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.stroke(); g.beginPath(); g.moveTo(16, 0); g.lineTo(4, -9); g.lineTo(4, 9); g.fill(); g.restore(); } }
  g.restore(); };

Object.assign(OUTFITS, {
  tigercrew: { tunic: "#1e1e24", skin: "#fffdf8", sidecap: "#1e1e24", hair: "#c8a050", tie: "#e8e8f0", coat: true, vest: "#2a2a32", pants: "#1e1e24", boot: "#121212" },
  tigercmd: { tunic: "#1e1e24", skin: "#fffdf8", peakcap: "#1e1e24", capband: "#3a3a42", goggles: false, moustache: "#5a3a24", tie: "#e8e8f0", coat: true, vest: "#2a2a32", pants: "#1e1e24", boot: "#121212", stout: true },
  engineer: { tunic: "#7a8a96", skin: "#fffdf8", hair: "#f0d070", peakcap: "#7a8a96", capband: "#2a3a4a", monocle: true, coat: true, vest: "#5a6a76", tie: "#2a3a4a", pants: "#5a6a76", boot: "#1a1a1a" },
  sovcrew: { tunic: "#8a8a4a", skin: "#fffdf8", shlem: "#3a2e24", coat: true, vest: "#7a7a40", tie: "#5a3a24", pants: "#5a5a32", boot: "#2a1e18", moustache: "#3a2414" },
  sovdriver: { tunic: "#8a8a4a", skin: "#fffdf8", shlem: "#3a2e24", goggles: true, coat: true, vest: "#7a7a40", tie: "#5a3a24", pants: "#5a5a32", boot: "#2a1e18" },
  sovworker: { tunic: "#c8b8a0", overalls: "#3a5a98", skin: "#fffdf8", rcap: "#5a4a3a", hair: "#5a3a24", pants: "#3a5a98", boot: "#2a1e18" },
  jake: { tunic: "#2a9a8a", skin: "#fffdf8", cowboy: "#c8a050", cowband: "#5a3a1a", hair: "#3a2414", overalls: "#5a4a3a", pants: "#4a3a2e", boot: "#3a2418" },
  partner: { tunic: "#c8382a", pattern: "stripe", pcol: "#8a1f1a", skin: "#fffdf8", cowboy: "#6a4a2a", cowband: "#2a1a10", star: true, moustache: "#3a2414", vest: "#3a2a20", pants: "#3a3a4a", boot: "#2a1a10" },
  tycoon: { tunic: "#f4f0e8", skin: "#fffdf8", hat: "tophat", hatCol: "#f4f0ea", moustache: "#1a1414", coat: true, vest: "#f4f0e8", tie: "#c8322f", pants: "#f0ece4", boot: "#1a1414", stout: true },
  expert: { tunic: "#6a2a5a", skin: "#fffdf8", bowler: "#2a2228", glasses: true, hair: "#3a2a24", coat: true, vest: "#4a1a3a", tie: "#e8c25a", pants: "#3a2a3a", boot: "#1a1414" },
  builder: { tunic: "#f2c94a", overalls: "#2a5ab8", skin: "#fffdf8", rcap: "#d8322f", hair: "#5a3a24", pants: "#2a5ab8", boot: "#3a2418" },
  rival: { tunic: "#7a3a24", skin: "#fffdf8", bowler: "#1e1a20", moustache: "#1a1414", coat: true, vest: "#3a2418", tie: "#e8c25a", pants: "#4a2a1a", boot: "#141414" },
  dummy: { tunic: "#d8b880", skin: "#f4e0c0", pattern: "stripe", pcol: "#c8a060", pants: "#c8a060", boot: "#8a6a40" },
  cook: { tunic: "#ffffff", skin: "#fffdf8", chef: true, apron: "#f4f0e8", tie: "#d8322f", pants: "#2a2a3a", boot: "#2a1e18", moustache: "#2a1e18" },
  captain: { tunic: "#2a4a9a", skin: "#fffdf8", bicorne: "#22305a", coat: true, vest: "#f4ead8", tie: "#ffffff", moustache: "#3a2418", epaulet: "#f2c94a", boot: "#1a1414", stout: true },
  sailorA: { tunic: "#f4f4f8", pattern: "stripe", pcol: "#2a4ab8", skin: "#fffdf8", bandana: "#d8322f", pants: "#e8dcc0", boot: "#5a3a2a" },
  sailorB: { tunic: "#3a8a5a", skin: "#fffdf8", rcap: "#d8b84a", hair: "#5a3a24", pants: "#4a4a6a", boot: "#3a2a22" },
  pirateCap: { tunic: "#c8282a", skin: "#fffdf8", tricorn: "#1e1a24", feather: "#ffffff", skull: true, coat: true, vest: "#f2c94a", moustache: "#2a1a14", eyepatch: true, boot: "#1a1414", stout: true },
  pirateA: { tunic: "#f4ead8", pattern: "stripe", pcol: "#c8282a", skin: "#fffdf8", bandana: "#1e1a24", eyepatch: true, moustache: "#2a1a14", pants: "#1e1a24", boot: "#1a1414" },
  pirateB: { tunic: "#f4ead8", pattern: "stripe", pcol: "#c8282a", skin: "#fffdf8", bandana: "#1e1a24", beard: "#5a2a14", pants: "#1e1a24", boot: "#1a1414" },
  pirateC: { tunic: "#f4ead8", pattern: "stripe", pcol: "#c8282a", skin: "#fffdf8", bandana: "#1e1a24", hair: "#1a1414", moustache: "#1a1414", pants: "#1e1a24", boot: "#1a1414" },
  edgar: { tunic: "#2a2438", skin: "#fffdf8", hair: "#c8502a", moustache: "#c8502a", coat: true, vest: "#6a2a4a", tie: "#c8322f", boot: "#1a1414" },
  martha: { tunic: "#6a2a5a", skin: "#fffdf8", hair: "#3a2a3a", bun: true, dress: "#6a2a5a", scarf: "#3a1a3a", boot: "#2a1a24" },
  neighbor: { tunic: "#f4ead8", skin: "#fffdf8", nightcap: "#d8322f", pattern: "stripe", pcol: "#c8b8d0", moustache: "#5a3a24", boot: "#5a3a2a" },
  doctor: { tunic: "#2a2a3a", skin: "#fffdf8", hat: "tophat", hair: "#9a9a9a", moustache: "#d8d8d8", vest: "#8a1f2a", tie: "#f4ead8", stout: true, boot: "#1a1414" },
  townA: { tunic: "#c8322f", skin: "#fffdf8", cap: "#3a2a4a", scarf: "#f4cc5a", coat: true, moustache: "#3a2a1e", boot: "#2a1a14" },
  townB: { tunic: "#2f8ab8", skin: "#fffdf8", hat: "bonnet", dress: "#e87ab8", scarf: "#f4ead8", boot: "#3a2a22" },
  townC: { tunic: "#3a9a6a", skin: "#fffdf8", hair: "#5a3a24", scarf: "#c8322f", pattern: "check", pcol: "#00000033", pcol2: "#f4cc5a", boot: "#3a2a22" },
});
export const fxBubble = (p, text, o = {}) => { const g = p.g; g.save(); g.font = `900 ${o.size || 78}px Arial Black, Arial`; const w = Math.max(160, g.measureText(text).width + 70), h = (o.size || 78) + 60, x = 300 - w / 2, y = 330 - h / 2;
  p.poly(rrect(x, y, x + w, y + h, 40), "#ffffff", 10); p.poly([[300 + (o.tail || -40) - 24, y + h - 6], [300 + (o.tail || -40) + 24, y + h - 6], [300 + (o.tail || -40) - 30, y + h + 70]], "#ffffff", 0);
  p.stroke([[300 + (o.tail || -40) - 24, y + h - 2], [300 + (o.tail || -40) - 30, y + h + 70], [300 + (o.tail || -40) + 24, y + h - 2]], 10); g.fillStyle = o.col || "#241726"; g.textAlign = "center"; g.fillText(text, 300, y + h / 2 + (o.size || 78) * 0.36); g.restore(); };
export const fxPaper = (p, title = "CERTIFICATE OF DEATH", name = "E. PRATT") => { const g = p.g; g.save(); p.poly(rrect(110, 220, 490, 760, 8), "#f4ecd8", 8); g.fillStyle = "#3a2418"; g.textAlign = "center"; g.font = "900 34px Georgia"; g.fillText(title, 300, 300);
  g.fillRect(150, 320, 300, 3); g.font = "italic 26px Georgia"; g.fillText("I hereby certify the death of", 300, 380); g.font = "900 56px Georgia"; g.fillText(name, 300, 460); g.font = "italic 24px Georgia"; g.fillText("Jan. 9, 1894", 300, 510); g.strokeStyle = "#2a2a6a"; g.lineWidth = 4; g.beginPath(); g.moveTo(170, 640); g.bezierCurveTo(230, 600, 260, 680, 330, 630); g.stroke(); g.fillText("M.D.", 400, 650);
  p.ell(400, 700, 34, 34, "#c8322f", 4); g.restore(); };
export const fxIOU = (p, amt = "$40") => { const g = p.g; g.save(); p.poly(rrect(160, 380, 440, 560, 6), "#f4ecd8", 6); g.fillStyle = "#3a2418"; g.textAlign = "center"; g.font = "900 48px Georgia"; g.fillText("I.O.U.", 300, 440); g.font = "900 60px Georgia"; g.fillStyle = "#c8322f"; g.fillText(amt, 300, 520); g.restore(); };
export const fxShovel = (p) => { p.stroke([[300, 120], [300, 760]], 14, "#7a4a2a"); p.poly(rrect(255, 90, 345, 130, 8), "#7a4a2a", 6); p.poly([[240, 760], [360, 760], [370, 900], [300, 960], [230, 900]], "#9aa0b0", 8); p.ell(275, 830, 14, 30, "#ffffff70", 0); };
