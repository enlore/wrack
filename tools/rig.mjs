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

/* ---------- bodies ---------- */
// Reference segment lengths (cell units). Skeleton factories below use these
// proportions; figure-specific poses should stay close to them — the chain
// validators hold whatever pose A establishes.
export const SEG = { torso: 28, shoulders: 18, thigh: 17, shin: 15, upperArm: 15, foreArm: 15, neck: 10, headR: 7, buttR: 5, sole: 6 };

const GROUND = 105;
const ANKLE_Y = GROUND - SEG.sole; // 99

// A body is a standardized figure in a common position. Each BODIES factory
// returns:
//   joints   — flat name->[x,y] map (pose A defaults; figures override via poses)
//   segments — structured, addressable tree, e.g.
//              BODIES.standing().segments.legs.left.upper  -> ['hip','knee']
//              BODIES.standing().segments.legs.left.foot   -> {at:'ankle',...}
//   chains   — IK chains derived from segments (legs/arms), honoring
//              per-limb side / loose / chain:false flags
//   parts    — renderable parts derived from segments (or hand-ordered when a
//              body needs specific occlusion, e.g. seatedBack's seat sandwich)
// Segment refs are joint names or literal [x,y] points.

function partsFromSegments(s) {
  const parts = [];
  for (const b of s.butts || []) parts.push({ kind: "butt", ...b });
  for (const leg of Object.values(s.legs || {})) {
    parts.push({ kind: "poly", joints: [leg.upper[0], leg.upper[1], leg.lower[1]] });
    if (leg.foot) parts.push({ kind: "foot", ...leg.foot });
  }
  if (s.torso) parts.push({ kind: "line", joints: s.torso });
  if (s.shoulders) parts.push({ kind: "line", joints: s.shoulders });
  if (s.head) parts.push({ kind: "head", ...s.head });
  for (const arm of Object.values(s.arms || {})) {
    parts.push({ kind: "poly", joints: [arm.upper[0], arm.upper[1], arm.lower[1]], cls: "bd4" });
  }
  for (const p of s.extras || []) parts.push(p);
  return parts;
}

function chainsFromSegments(s) {
  const chains = [];
  for (const limbs of [s.legs, s.arms]) {
    for (const limb of Object.values(limbs || {})) {
      if (limb.chain === false) continue;
      if (typeof limb.upper[0] !== "string") continue; // literal-point limbs aren't posed
      chains.push({
        root: limb.upper[0], mid: limb.upper[1], end: limb.lower[1],
        ...(limb.side ? { side: limb.side } : {}),
        ...(limb.loose ? { loose: true } : {}),
      });
    }
  }
  return chains;
}

function body({ joints, segments, parts, chains }) {
  return {
    joints, segments,
    chains: chains ?? chainsFromSegments(segments),
    parts: parts ?? partsFromSegments(segments),
  };
}

export const BODIES = {
  // profile stance; facing -1 = left. footPitch/legSide thread through to the
  // foot part and leg chain for platform work (calf raise).
  standing({ x = 100, facing = -1, footPitch, legSide } = {}) {
    return body({
      joints: {
        hip: [x, 68], knee: [x + facing, 84], ankle: [x - facing * 2, ANKLE_Y],
        sh: [x, 40], head: [x, 30], butt: [x - facing * 5, 71],
        elbow: [x - facing, 52], hand: [x, 64],
      },
      segments: {
        butts: [{ at: "butt" }],
        legs: { left: { upper: ["hip", "knee"], lower: ["knee", "ankle"], side: legSide, foot: { at: "ankle", facing, pitch: footPitch } } },
        torso: ["hip", "sh"],
        head: { at: "head" },
        arms: { left: { upper: ["sh", "elbow"], lower: ["elbow", "hand"] } },
      },
    });
  },
  // dead-on front view; glutes peek past the hips on both sides
  standingFront({ x = 100 } = {}) {
    return body({
      joints: {
        pelvis: [x, 68], lKnee: [x - 5, 84], rKnee: [x + 5, 84],
        lAnkle: [x - 8, ANKLE_Y], rAnkle: [x + 8, ANKLE_Y],
        neckB: [x, 40], head: [x, 28], lSh: [x - 9, 42], rSh: [x + 9, 42],
        lButt: [x - 5, 70], rButt: [x + 5, 70],
      },
      segments: {
        butts: [{ at: "lButt", r: 4.5 }, { at: "rButt", r: 4.5 }],
        legs: {
          left: { upper: ["pelvis", "lKnee"], lower: ["lKnee", "lAnkle"], foot: { at: "lAnkle", front: true } },
          right: { upper: ["pelvis", "rKnee"], lower: ["rKnee", "rAnkle"], foot: { at: "rAnkle", front: true } },
        },
        torso: ["pelvis", "neckB"],
        shoulders: ["lSh", "rSh"],
        head: { at: "head" },
      },
    });
  },
  // three-quarter view: standing height, slightly off-axis; near/far joints
  // offset to convey the turn, depth axis projects down-left foreshortened
  standing3q({ x = 100 } = {}) {
    return body({
      joints: {
        pelvis: [x + 2, 68], neck3: [x, 40], head: [x, 28],
        lSh: [x - 9, 43], rSh: [x + 9, 41],
        lButt: [x - 3, 70], rButt: [x + 7, 70],
        nKnee: [x - 5, 84], nAnkle: [x - 7, ANKLE_Y],
        fKnee: [x + 7, 84], fAnkle: [x + 9, ANKLE_Y],
      },
      segments: {
        butts: [{ at: "lButt", r: 4.5 }, { at: "rButt", r: 4.5 }],
        legs: {
          near: { upper: ["pelvis", "nKnee"], lower: ["nKnee", "nAnkle"], foot: { at: "nAnkle", front: true } },
          far: { upper: ["pelvis", "fKnee"], lower: ["fKnee", "fAnkle"], foot: { at: "fAnkle", front: true } },
        },
        torso: ["pelvis", "neck3"],
        shoulders: ["lSh", "rSh"],
        head: { at: "head" },
      },
    });
  },
  // front view seated on a machine; legs are figure-specific (abduction pads)
  seatedFront() {
    return body({
      joints: { pelvisS: [100, 84], neckS: [100, 52], head: [100, 42] },
      segments: {
        butts: [{ at: [96, 86], r: 4 }, { at: [104, 86], r: 4 }],
        torso: ["pelvisS", "neckS"],
        shoulders: [[92, 54], [108, 54]],
        head: { at: "head" },
      },
    });
  },
  // back view seated at a machine; includes its seat so the shins render
  // occluded behind it, and a slot for figure parts that must sit behind the
  // torso (compose() splices fig.slot there)
  seatedBack() {
    const segments = {
      butts: [{ at: [95, 86], r: 4.5 }, { at: [105, 86], r: 4.5 }],
      torso: [[100, 50], [100, 84]],
      shoulders: ["lSh", "rSh"],
      head: { at: "head" },
    };
    return body({
      joints: { lSh: [91, 52], rSh: [109, 52], head: [100, 38] },
      segments,
      chains: [],
      parts: [
        { kind: "line", joints: [[93, 90], [90, 99]] },
        { kind: "line", joints: [[107, 90], [110, 99]] },
        { kind: "foot", at: [90, 99], front: true },
        { kind: "foot", at: [110, 99], front: true },
        { kind: "rect", x: 84, y: 90, w: 32, h: 6 },
        { kind: "fline", p: [100, 96, 100, 103] },
        { kind: "slot" },
        ...partsFromSegments(segments),
      ],
    });
  },
  // lying face-up on a bench, feet on the floor, head at left
  supine() {
    return body({
      joints: {
        sh: [72, 72], hipS: [118, 74], knee: [133, 84], ankle: [136, ANKLE_Y],
        head: [48, 70], butt: [118, 77],
      },
      segments: {
        butts: [{ at: "butt", r: 4.5 }],
        legs: { left: { upper: ["hipS", "knee"], lower: ["knee", "ankle"], foot: { at: "ankle", facing: 1 } } },
        torso: [[60, 74], "hipS"],
        head: { at: "head" },
      },
    });
  },
  // lying face-down along a bench, head at left, thigh to the knee pivot;
  // the lower leg is figure-specific (leg curl's rotating group)
  prone() {
    return body({
      joints: { head: [48, 73], shP: [59, 76], hipP: [87, 77], knee: [104, 79], butt: [88, 72] },
      segments: {
        butts: [{ at: "butt" }],
        torso: ["shP", "hipP"],
        head: { at: "head" },
        extras: [{ kind: "line", joints: ["hipP", "knee"] }],
      },
    });
  },
  // supine bridge off a bench (hip thrust): shoulders pinned, hips travel
  bridge() {
    return body({
      joints: {
        sh: [46, 60], hip: [85, 92], knee: [112, 76], ankle: [115, ANKLE_Y],
        head: [34, 48], butt: [81, 95],
      },
      segments: {
        butts: [{ at: "butt" }],
        legs: { left: { upper: ["hip", "knee"], lower: ["knee", "ankle"], loose: true, foot: { at: "ankle", facing: 1 } } },
        torso: ["sh", "hip"],
        head: { at: "head" },
      },
    });
  },
  // rear-foot-elevated split stance (Bulgarian split squat)
  splitStance() {
    return body({
      joints: {
        hip: [95, 62], fknee: [86, 81], fankle: [80, ANKLE_Y], rknee: [122, 84], rfoot: [148, 70],
        sh: [90, 34], elbow: [94, 47], hand: [93, 60], head: [89, 26], butt: [100, 64],
      },
      segments: {
        butts: [{ at: "butt" }],
        legs: {
          front: { upper: ["hip", "fknee"], lower: ["fknee", "fankle"], foot: { at: "fankle", facing: -1 } },
          rear: { upper: ["hip", "rknee"], lower: ["rknee", "rfoot"], loose: true, foot: { at: "rfoot", facing: -1, pitch: [60, 60] } },
        },
        torso: ["hip", "sh"],
        head: { at: "head" },
        arms: { left: { upper: ["sh", "elbow"], lower: ["elbow", "hand"] } },
      },
    });
  },
  // reclined in a machine seat, pressing along a diagonal (leg press)
  recline() {
    return body({
      joints: { hip: [76, 88], knee: [85, 57], ankle: [102, 75], head: [44, 58] },
      segments: {
        butts: [{ at: [72, 92] }],
        legs: { left: { upper: ["hip", "knee"], lower: ["knee", "ankle"], loose: true, foot: { at: "ankle", facing: 1, pitch: [-125, -125] } } },
        torso: [[76, 90], [50, 66]],
        head: { at: "head" },
      },
    });
  },
  // three-point bench position (one-arm row): hand and knee on the bench,
  // working arm hangs from the shoulder
  kneelingBench() {
    return body({
      joints: { sh: [86, 58], elbow: [86, 73], hand: [86, 88], head: [60, 50] },
      segments: {
        butts: [{ at: [116, 59] }],
        legs: {
          standing: { upper: [[112, 62], [113, 84]], lower: [[113, 84], [120, 99]], foot: { at: [120, 99], facing: -1 } },
        },
        torso: [[112, 62], [72, 56]],
        head: { at: "head" },
        arms: { row: { upper: ["sh", "elbow"], lower: ["elbow", "hand"], side: -1 } },
        extras: [
          { kind: "poly", joints: [[78, 58], [71, 68], [68, 77]], cls: "bd4" },
          { kind: "line", joints: [[112, 62], [128, 76]] },
          { kind: "line", joints: [[128, 76], [140, 79]] },
          { kind: "foot", at: [141, 80], facing: -1, pitch: [110, 110] },
        ],
      },
    });
  },
};

// Layer a figure over a body: equipment renders behind the body, figure parts
// on top; figure pose values override body joints. A {kind:'slot'} part in the
// body is replaced by fig.slot (parts that must interleave inside the body).
export function compose(base, fig) {
  const bodyParts = base.parts.flatMap(p => p.kind === "slot" ? (fig.slot || []) : [p]);
  return {
    ...fig,
    poses: { A: { ...base.joints, ...(fig.poses?.A || {}) }, B: fig.poses?.B || {} },
    chains: [...(base.chains || []), ...(fig.chains || [])],
    parts: [...(fig.equipment || []), ...bodyParts, ...(fig.parts || [])],
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
export function renderSheet(figures, warn = m => console.error("warn: " + m), { cols = 3 } = {}) {
  const cellW = 200, cellH = 120, pitchX = 210, pitchY = 145, pad = 10;
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 3}" height="${H * 3}">
  <style>${STYLE}
  </style>
  <rect width="${W}" height="${H}" fill="#131519"/>
${cells.join("\n")}
</svg>
`;
}
