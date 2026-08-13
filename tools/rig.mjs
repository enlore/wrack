// Deterministic SVG rig for wrack's exercise figure sheet.
//
// A figure is two named poses over a joint skeleton — hips, knees, ankles,
// shoulders, elbows, hands, head — in a 200x120 cell, y-down. Pose A is the
// start of the rep, pose B the mid-rep hold. Knees and elbows may be omitted
// from pose B: they are solved with two-bone IK from hip/ankle (shoulder/hand)
// using segment lengths measured from pose A and the bend side observed in
// pose A, so limbs cannot stretch and joints cannot flip direction between
// poses. The build emits SMIL animations with one shared rep timing.
//
// Run tools/build-sheet.mjs with node to regenerate assets/animations.svg.

const DUR = "2.6s";
const KT = "0;0.35;0.55;0.85;1";
const KS = ".4 0 .2 1;0 0 1 1;.4 0 .2 1;0 0 1 1";

export const STYLE = `
    .bd{stroke:#F1EEE7;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;fill:none}
    .bd4{stroke:#F1EEE7;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;fill:none}
    .hd{fill:#F1EEE7}
    .eq{fill:#454C58}
    .eqL{stroke:#454C58;stroke-width:4;stroke-linecap:round}
    .eqT{stroke:#454C58;stroke-width:2;fill:none}
    .ac{stroke:#3D6FF0;stroke-width:4;fill:none;stroke-linecap:round}
    .ac5{stroke:#3D6FF0;stroke-width:5;fill:none;stroke-linecap:round}
    .acT{stroke:#3D6FF0;stroke-width:2.5;fill:none}
    .acF{fill:#3D6FF0}
    .gnd{stroke:#2E343E;stroke-width:2}
    .cell{fill:#161A20}
    .cap{fill:#8A919E;font:600 10px system-ui,sans-serif;letter-spacing:.12em;text-anchor:middle}
    .lab{fill:#5F6773;font:600 7px system-ui,sans-serif;letter-spacing:.1em}
    .frame{fill:none;stroke:#2E343E;stroke-width:1.5}`;

const fmt = n => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? "0" : String(r);
};
const vals = (a, b) => `${a};${b};${b};${a};${a}`;

function animTag(attr, a, b) {
  if (a === b) return "";
  return `<animate attributeName="${attr}" dur="${DUR}" repeatCount="indefinite" values="${vals(a, b)}" keyTimes="${KT}" calcMode="spline" keySplines="${KS}"/>`;
}
function animTransform(type, a, b) {
  return `<animateTransform attributeName="transform" type="${type}" dur="${DUR}" repeatCount="indefinite" values="${vals(a, b)}" keyTimes="${KT}" calcMode="spline" keySplines="${KS}"/>`;
}
function tag(name, attrs, inner = "") {
  const at = Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join("");
  return inner ? `<${name}${at}>${inner}</${name}>` : `<${name}${at}/>`;
}

/* ---------- geometry ---------- */
export const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
const cross = (u, w) => u[0] * w[1] - u[1] * w[0];

// Two-bone IK: mid joint for a root->end chain with segment lengths l1, l2.
// side is +1/-1, the sign of cross(root->end, root->mid).
export function solve2(root, end, l1, l2, side) {
  const dx = end[0] - root[0], dy = end[1] - root[1];
  let d = Math.hypot(dx, dy);
  const reach = l1 + l2 - 0.05;
  if (d > reach) d = reach; // clamp: nearly straight, never stretched
  const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  return [root[0] + ux * a - side * uy * h, root[1] + uy * a + side * ux * h];
}

/* ---------- feet ---------- */
// Vaguely sneaker-shaped, ankle at the local origin, toe pointing +x.
// Sole sits SEG.sole below the ankle, so planted ankles go at ground - SEG.sole.
const SNEAKER = "M -4.5 0 L -5.5 3.5 Q -5.5 6 -3 6 L 7 6 Q 10.5 6 11 3.5 Q 11 1.8 6.5 1 L 2 -0.5 Q -1.5 -1 -4.5 0 Z";
// Front view: a squat rounded block.
const FRONTFOOT = "M -4.5 0 Q -5.5 4.5 -2.5 5.5 L 2.5 5.5 Q 5.5 4.5 4.5 0 Q 0 -1.5 -4.5 0 Z";

// facing: +1 toe points +x, -1 toe points -x. pitch rotates about the ankle
// (positive lifts the heel of a +x-facing foot).
function footEl(ankleA, ankleB, pitchA, pitchB, facing, front) {
  const d = front ? FRONTFOOT : SNEAKER;
  const path = tag("path", { d, class: "hd", transform: `scale(${facing},1)` });
  const rotA = `${fmt(pitchA * facing)} 0 0`, rotB = `${fmt(pitchB * facing)} 0 0`;
  const trA = `${fmt(ankleA[0])} ${fmt(ankleA[1])}`, trB = `${fmt(ankleB[0])} ${fmt(ankleB[1])}`;
  const inner = tag("g", {}, animTransform("rotate", rotA, rotB) + path);
  return tag("g", { transform: `translate(${trA})` },
    (trA === trB ? "" : animTransform("translate", trA, trB)) + inner);
}

/* ---------- standard skeletons ---------- */
// Reference segment lengths (cell units). Skeleton factories below use these
// proportions; figure-specific poses should stay close to them — the chain
// validators hold whatever pose A establishes.
export const SEG = { torso: 28, shoulders: 18, thigh: 17, shin: 15, upperArm: 15, foreArm: 15, neck: 10, headR: 7, buttR: 5, sole: 6 };

const GROUND = 105;
const ANKLE_Y = GROUND - SEG.sole; // 99

// skeleton(kind, opts) -> { joints, chains, parts } for pose A of a common
// body position. Figures compose() these, override joints in poses.A/B, and
// add equipment. facing: -1 = figure faces left (+1 right).
export function skeleton(kind, opts = {}) {
  const { x = 100, facing = -1 } = opts;
  if (kind === "standing-side") {
    return {
      joints: {
        hip: [x, 68], knee: [x + facing, 84], ankle: [x - facing * 2, ANKLE_Y],
        sh: [x, 40], head: [x, 30], butt: [x - facing * 5, 71],
        elbow: [x - facing, 52], hand: [x, 64],
      },
      chains: [
        { root: "hip", mid: "knee", end: "ankle" },
        { root: "sh", mid: "elbow", end: "hand" },
      ],
      parts: [
        { kind: "poly", joints: ["hip", "knee", "ankle"] },
        { kind: "line", joints: ["hip", "sh"] },
        { kind: "joint", at: "sh" },
        { kind: "head", at: "head" },
        { kind: "butt", at: "butt" },
        { kind: "poly", joints: ["sh", "elbow", "hand"], cls: "bd4" },
        { kind: "foot", at: "ankle", facing },
      ],
    };
  }
  if (kind === "standing-front") {
    // The glutes peek out past the hips on both sides — always visible.
    return {
      joints: {
        pelvis: [x, 72], lKnee: [x - 5, 85], rKnee: [x + 5, 85],
        lAnkle: [x - 8, ANKLE_Y], rAnkle: [x + 8, ANKLE_Y],
        neckB: [x, 44], head: [x, 32], lSh: [x - 9, 46], rSh: [x + 9, 46],
        lButt: [x - 5, 74], rButt: [x + 5, 74],
      },
      chains: [],
      parts: [
        { kind: "butt", at: "lButt", r: 4.5 },
        { kind: "butt", at: "rButt", r: 4.5 },
        { kind: "poly", joints: ["pelvis", "lKnee", "lAnkle"] },
        { kind: "poly", joints: ["pelvis", "rKnee", "rAnkle"] },
        { kind: "line", joints: ["pelvis", "neckB"] },
        { kind: "line", joints: ["lSh", "rSh"] },
        { kind: "head", at: "head" },
        { kind: "foot", at: "lAnkle", front: true },
        { kind: "foot", at: "rAnkle", front: true },
      ],
    };
  }
  if (kind === "seated-side") {
    // seated tall, thighs forward toward +facing... pulldown-style: thighs to the right
    return {
      joints: {
        hip: [95, 86], sh: [88, 52], head: [86, 42], butt: [90, 88],
        knee: [120, 84], ankle: [118, ANKLE_Y],
      },
      chains: [],
      parts: [
        { kind: "line", joints: ["hip", "sh"] },
        { kind: "joint", at: "sh" },
        { kind: "head", at: "head" },
        { kind: "butt", at: "butt" },
        { kind: "poly", joints: ["hip", "knee", "ankle"] },
        { kind: "foot", at: "ankle", facing: 1 },
      ],
    };
  }
  if (kind === "supine-bench") {
    // lying face-up on a bench with feet on the floor, head at left
    return {
      joints: {
        sh: [72, 72], hipS: [118, 74], knee: [133, 84], ankle: [136, ANKLE_Y],
        head: [48, 70], butt: [118, 77],
      },
      chains: [],
      parts: [
        { kind: "line", joints: [[60, 74], "hipS"] },
        { kind: "joint", at: "sh" },
        { kind: "head", at: "head" },
        { kind: "butt", at: "butt", r: 4.5 },
        { kind: "poly", joints: ["hipS", "knee", "ankle"] },
        { kind: "foot", at: "ankle", facing: 1 },
      ],
    };
  }
  if (kind === "prone-bench") {
    // lying face-down along a bench, head at left, knees at the bench end;
    // SEG-proportioned: torso 28, thigh 17 to the knee pivot
    return {
      joints: { head: [48, 73], shP: [59, 76], hipP: [87, 77], knee: [104, 79], butt: [88, 72] },
      chains: [],
      parts: [
        { kind: "line", joints: ["shP", "hipP"] },
        { kind: "joint", at: "shP" },
        { kind: "head", at: "head" },
        { kind: "butt", at: "butt" },
        { kind: "line", joints: ["hipP", "knee"] },
      ],
    };
  }
  throw new Error(`unknown skeleton kind: ${kind}`);
}

// Layer a figure over a skeleton: equipment renders behind the body,
// figure parts on top; figure pose values override skeleton joints.
export function compose(base, fig) {
  return {
    ...fig,
    poses: { A: { ...base.joints, ...(fig.poses?.A || {}) }, B: fig.poses?.B || {} },
    chains: [...(base.chains || []), ...(fig.chains || [])],
    parts: [...(fig.equipment || []), ...base.parts.filter(p => !p.skip), ...(fig.parts || [])],
  };
}

/* ---------- pose resolution ---------- */
// chains: named limb chains {root, mid, end, kind:'leg'|'arm'} — mid solved in
// B (and lengths/bend side locked) from pose A when B omits it.
export function resolvePoses(fig, warn) {
  const A = { ...fig.poses.A };
  const B = { ...fig.poses.A, ...fig.poses.B };
  for (const c of fig.chains || []) {
    const [rA, mA, eA] = [A[c.root], A[c.mid], A[c.end]];
    if (!rA || !mA || !eA) { warn(`${fig.name}: chain ${c.mid} missing joints in pose A`); continue; }
    const l1 = dist(rA, mA), l2 = dist(mA, eA);
    // enforce the standardized skeleton: limb segments within 40% of SEG
    // (chains marked loose: true are documented exceptions)
    if (!c.loose) {
      const isArm = /elbow/i.test(c.mid);
      const std1 = isArm ? SEG.upperArm : SEG.thigh, std2 = isArm ? SEG.foreArm : SEG.shin;
      if (Math.abs(l1 / std1 - 1) > 0.4) warn(`${fig.name}: ${c.root}->${c.mid} is ${fmt(l1)} vs standard ${std1}`);
      if (Math.abs(l2 / std2 - 1) > 0.4) warn(`${fig.name}: ${c.mid}->${c.end} is ${fmt(l2)} vs standard ${std2}`);
    }
    const u = [eA[0] - rA[0], eA[1] - rA[1]];
    const w = [mA[0] - rA[0], mA[1] - rA[1]];
    let side = Math.sign(cross(u, w)) || (c.side ?? 1);
    if (c.side) side = c.side;
    if (!fig.poses.B[c.mid]) {
      B[c.mid] = solve2(B[c.root], B[c.end], l1, l2, side);
    } else {
      // explicit B mid: verify lengths and bend side
      const dl1 = Math.abs(dist(B[c.root], B[c.mid]) - l1);
      const dl2 = Math.abs(dist(B[c.mid], B[c.end]) - l2);
      if (dl1 > 3 || dl2 > 3) warn(`${fig.name}: ${c.mid} chain stretches ${fmt(Math.max(dl1, dl2))}px between poses`);
      const uB = [B[c.end][0] - B[c.root][0], B[c.end][1] - B[c.root][1]];
      const wB = [B[c.mid][0] - B[c.root][0], B[c.mid][1] - B[c.root][1]];
      const sB = Math.sign(cross(uB, wB));
      if (sB && sB !== side) warn(`${fig.name}: ${c.mid} bends opposite directions in A and B (joint snaps through)`);
    }
  }
  for (const pose of [A, B]) for (const [j, p] of Object.entries(pose)) {
    if (p[0] < -2 || p[0] > 202 || p[1] < -2 || p[1] > 116) warn(`${fig.name}: joint ${j} out of cell bounds (${fmt(p[0])},${fmt(p[1])})`);
  }
  return { A, B };
}

/* ---------- part rendering ---------- */
const P = (pose, ref) => Array.isArray(ref) ? ref : pose[ref];

function renderPart(part, A, B, warn) {
  const k = part.kind;
  if (k === "rect") return tag("rect", { x: part.x, y: part.y, width: part.w, height: part.h, rx: part.rx ?? 2, class: part.cls ?? "eq" });
  if (k === "fline") return tag("line", { x1: part.p[0], y1: part.p[1], x2: part.p[2], y2: part.p[3], class: part.cls ?? "eqL" });
  if (k === "line" || k === "poly") {
    const joints = part.joints;
    const ptsA = joints.map(j => P(A, j)), ptsB = joints.map(j => P(B, j));
    const cls = part.cls ?? "bd";
    if (joints.length === 2) {
      const [a1, a2] = ptsA, [b1, b2] = ptsB;
      const inner = animTag("x1", fmt(a1[0]), fmt(b1[0])) + animTag("y1", fmt(a1[1]), fmt(b1[1])) +
                    animTag("x2", fmt(a2[0]), fmt(b2[0])) + animTag("y2", fmt(a2[1]), fmt(b2[1]));
      return tag("line", { x1: fmt(a1[0]), y1: fmt(a1[1]), x2: fmt(a2[0]), y2: fmt(a2[1]), class: cls }, inner);
    }
    const sA = ptsA.map(p => `${fmt(p[0])},${fmt(p[1])}`).join(" ");
    const sB = ptsB.map(p => `${fmt(p[0])},${fmt(p[1])}`).join(" ");
    return tag("polyline", { points: sA, class: cls }, animTag("points", sA, sB));
  }
  if (k === "head" || k === "butt" || k === "ring" || k === "dot" || k === "joint") {
    const a = P(A, part.at), b = P(B, part.at);
    const r = part.r ?? (k === "head" ? 7 : k === "joint" ? 3.5 : 5);
    const cls = part.cls ?? (k === "ring" ? "ac" : k === "dot" ? "acF" : "hd");
    const inner = animTag("cx", fmt(a[0]), fmt(b[0])) + animTag("cy", fmt(a[1]), fmt(b[1]));
    return tag("circle", { cx: fmt(a[0]), cy: fmt(a[1]), r, class: cls }, inner);
  }
  if (k === "label") return tag("text", { x: part.x, y: part.y, class: "lab" }, part.text);
  if (k === "foot") {
    const a = P(A, part.at), b = P(B, part.at);
    return footEl(a, b, part.pitch?.[0] ?? 0, part.pitch?.[1] ?? part.pitch?.[0] ?? 0, part.facing ?? 1, part.front);
  }
  if (k === "group") {
    const inner = part.children.map(c => renderPart(c, A, B, warn)).join("\n    ");
    const t = part.transform;
    return tag("g", {}, animTransform(t.type, t.values[0], t.values[1]) + "\n    " + inner);
  }
  warn(`unknown part kind ${k}`);
  return "";
}

/* ---------- sheet ---------- */
export function renderSheet(figures, warn = m => console.error("warn: " + m)) {
  const cols = 3, cellW = 200, cellH = 120, pitchX = 210, pitchY = 145, pad = 10;
  const rows = Math.ceil(figures.length / cols);
  const W = pad * 2 + cols * cellW + (cols - 1) * 10;
  const H = pad + rows * pitchY + 10;
  const cells = figures.map((fig, i) => {
    const x = pad + (i % cols) * pitchX, y = pad + Math.floor(i / cols) * pitchY;
    const { A, B } = resolvePoses(fig, warn);
    const parts = fig.parts.map(p => renderPart(p, A, B, warn)).join("\n    ");
    return `  <!-- ${fig.name} -->
  <g transform="translate(${x},${y})">
    <rect width="${cellW}" height="${cellH}" rx="8" class="cell"/>
    <line x1="8" y1="105" x2="192" y2="105" class="gnd"/>
    ${parts}
    <text x="100" y="134" class="cap">${fig.name}</text>
  </g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="960">
  <style>${STYLE}
  </style>
  <rect width="${W}" height="${H}" fill="#131519"/>
${cells.join("\n")}
</svg>
`;
}
