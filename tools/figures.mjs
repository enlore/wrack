// Figure definitions for the wrack exercise sheet. See rig.mjs for the model:
// pose A = rep start, pose B = mid-rep hold; knees/elbows omitted from B are
// IK-solved from pose A's segment lengths and bend side. Coordinates are
// cell-local (200x120, ground at y=105, sole depth puts planted ankles at 99).
// Figures build on skeleton() templates where a standard body position fits;
// equipment renders behind the body, figure parts on top.
import { skeleton, compose } from "./rig.mjs";

export const FIGURES = [
  {
    name: "HIP THRUST",
    poses: {
      A: { sh: [46, 60], hip: [85, 92], knee: [112, 76], ankle: [115, 99], head: [34, 48], butt: [81, 95], plate: [85, 81] },
      // top: hips finish ON the shoulder-knee line, not arched above it
      B: { hip: [85, 70], head: [34, 56], butt: [81, 73], plate: [85, 59] },
    },
    chains: [{ root: "hip", mid: "knee", end: "ankle" }],
    parts: [
      { kind: "rect", x: 12, y: 64, w: 34, h: 7 },
      { kind: "fline", p: [17, 71, 17, 103] },
      { kind: "fline", p: [41, 71, 41, 103] },
      { kind: "line", joints: ["sh", "hip"] },
      { kind: "poly", joints: ["hip", "knee", "ankle"] },
      { kind: "head", at: "head" },
      { kind: "butt", at: "butt" },
      { kind: "ring", at: "plate", r: 11 },
      { kind: "foot", at: "ankle", facing: 1 },
    ],
  },
  compose(skeleton("standing-side", { x: 100, facing: -1 }), {
    name: "ROMANIAN DEADLIFT",
    poses: {
      A: {},
      // hips back as counterweight; bar stays plumb under the shoulders,
      // brushing the legs just below the knee
      B: { hip: [114, 70], sh: [98, 60], hand: [103, 83], head: [88, 56], butt: [119, 73] },
    },
    parts: [{ kind: "ring", at: "hand", r: 8 }],
  }),
  compose(skeleton("supine-bench"), {
    name: "DB BENCH PRESS",
    poses: {
      A: { sh: [72, 72], elbow: [90, 71], hand: [89, 53], db: [89, 47] },
      B: { hand: [74, 36], db: [74, 30] },
    },
    chains: [{ root: "sh", mid: "elbow", end: "hand" }],
    equipment: [
      { kind: "rect", x: 44, y: 78, w: 100, h: 7 },
      { kind: "fline", p: [54, 85, 54, 103] },
      { kind: "fline", p: [134, 85, 134, 103] },
    ],
    parts: [
      { kind: "poly", joints: ["sh", "elbow", "hand"], cls: "bd4" },
      { kind: "ring", at: "db", r: 6 },
    ],
  }),
  compose(skeleton("seated-side"), {
    name: "LAT PULLDOWN",
    poses: {
      A: { elbow: [100, 44], hand: [108, 32], barL: [94, 32], barR: [126, 32], cable: [110, 32] },
      B: { hand: [108, 58], barL: [94, 58], barR: [126, 58], cable: [110, 58] },
    },
    chains: [{ root: "sh", mid: "elbow", end: "hand" }],
    equipment: [
      { kind: "fline", p: [115, 6, 115, 14] },
      { kind: "rect", x: 78, y: 88, w: 34, h: 6 },
      { kind: "fline", p: [95, 94, 95, 103] },
      { kind: "line", joints: [[115, 12], "cable"], cls: "eqT" },
    ],
    parts: [
      { kind: "poly", joints: ["sh", "elbow", "hand"], cls: "bd4" },
      { kind: "line", joints: ["barL", "barR"], cls: "ac" },
    ],
  }),
  {
    name: "SEATED HIP ABDUCTION",
    poses: { A: {}, B: {} },
    parts: [
      { kind: "rect", x: 86, y: 88, w: 28, h: 6 },
      { kind: "fline", p: [100, 94, 100, 103] },
      { kind: "butt", at: [96, 86], r: 4 },
      { kind: "butt", at: [104, 86], r: 4 },
      { kind: "head", at: [100, 42] },
      { kind: "line", joints: [[100, 52], [100, 84]] },
      {
        kind: "group", transform: { type: "rotate", values: ["0 100 82", "-14 100 82"] },
        children: [
          { kind: "poly", joints: [[100, 82], [87, 90], [85, 99]] },
          { kind: "dot", at: [83, 89], r: 4.5 },
          { kind: "foot", at: [85, 99], front: true },
        ],
      },
      {
        kind: "group", transform: { type: "rotate", values: ["0 100 82", "14 100 82"] },
        children: [
          { kind: "poly", joints: [[100, 82], [113, 90], [115, 99]] },
          { kind: "dot", at: [117, 89], r: 4.5 },
          { kind: "foot", at: [115, 99], front: true },
        ],
      },
    ],
  },
  compose(skeleton("standing-front", { x: 100 }), {
    // front view so the stack reads at the lifter's side (anti-rotation),
    // hands clasped at the sternum pressing out in the picture plane
    name: "PALLOF PRESS",
    poses: {
      A: {
        lKnee: [96, 85], rKnee: [104, 85], lAnkle: [93, 99], rAnkle: [107, 99],
        chest: [100, 54], elbow: [108, 68], hand: [94, 60],
      },
      B: { hand: [68, 60] },
    },
    chains: [{ root: "chest", mid: "elbow", end: "hand" }],
    equipment: [{ kind: "rect", x: 182, y: 52, w: 10, h: 52 }],
    parts: [
      { kind: "line", joints: [[184, 58], "hand"], cls: "acT" },
      { kind: "poly", joints: ["chest", "elbow", "hand"], cls: "bd4" },
      { kind: "dot", at: "hand", r: 3.5 },
    ],
  }),
  {
    name: "STANDING CALF RAISE",
    poses: {
      // A = the bottom stretch: heels dipped below the platform edge
      A: { legTop: [106, 60], knee: [105, 76], ankle: [103, 93], sh: [108, 32], elbow: [113, 47], hand: [111, 60], head: [111, 23], butt: [101, 61], db: [111, 65] },
      B: { legTop: [106, 49], ankle: [101, 82], sh: [108, 21], hand: [111, 49], head: [111, 12], butt: [101, 50], db: [111, 54] },
    },
    chains: [
      { root: "legTop", mid: "knee", end: "ankle", side: -1 },
      { root: "sh", mid: "elbow", end: "hand" },
    ],
    parts: [
      { kind: "rect", x: 106, y: 90, w: 56, h: 15 },
      { kind: "poly", joints: ["legTop", "knee", "ankle"] },
      { kind: "line", joints: ["legTop", "sh"] },
      { kind: "butt", at: "butt" },
      { kind: "head", at: "head" },
      { kind: "poly", joints: ["sh", "elbow", "hand"], cls: "bd4" },
      { kind: "ring", at: "db", r: 5.5 },
      { kind: "foot", at: "ankle", facing: 1, pitch: [-12, 25] },
    ],
  },
  {
    name: "BULGARIAN SPLIT SQUAT",
    poses: {
      A: { hip: [95, 62], fknee: [86, 81], fankle: [80, 99], rknee: [122, 84], rfoot: [148, 70], sh: [90, 34], elbow: [94, 47], hand: [93, 60], head: [89, 26], butt: [100, 64], db: [93, 66] },
      B: { hip: [97, 82], sh: [90, 54], hand: [93, 80], head: [89, 46], butt: [102, 84], db: [93, 86] },
    },
    chains: [
      { root: "hip", mid: "fknee", end: "fankle" },
      { root: "hip", mid: "rknee", end: "rfoot" },
      { root: "sh", mid: "elbow", end: "hand" },
    ],
    parts: [
      { kind: "rect", x: 140, y: 72, w: 44, h: 7 },
      { kind: "fline", p: [146, 79, 146, 103] },
      { kind: "fline", p: [176, 79, 176, 103] },
      { kind: "poly", joints: ["hip", "fknee", "fankle"] },
      { kind: "poly", joints: ["hip", "rknee", "rfoot"] },
      { kind: "line", joints: ["hip", "sh"] },
      { kind: "head", at: "head" },
      { kind: "butt", at: "butt" },
      { kind: "poly", joints: ["sh", "elbow", "hand"], cls: "bd4" },
      { kind: "ring", at: "db", r: 5.5 },
      { kind: "foot", at: "fankle", facing: -1 },
      { kind: "foot", at: "rfoot", facing: -1, pitch: [60, 60] },
    ],
  },
  {
    name: "LEG PRESS",
    poses: {
      // A near 90° knee, B stops just short of lockout
      A: { hip: [76, 88], knee: [85, 57], ankle: [102, 75], platA: [99, 61], platB: [114, 82] },
      B: { ankle: [120, 57], platA: [117, 43], platB: [132, 64] },
    },
    chains: [{ root: "hip", mid: "knee", end: "ankle" }],
    parts: [
      { kind: "fline", p: [44, 62, 78, 96] },
      { kind: "head", at: [44, 58] },
      { kind: "line", joints: [[76, 90], [50, 66]] },
      { kind: "butt", at: [72, 92] },
      { kind: "poly", joints: ["hip", "knee", "ankle"] },
      { kind: "line", joints: ["platA", "platB"], cls: "ac5" },
      { kind: "foot", at: "ankle", facing: 1, pitch: [-125, -125] },
    ],
  },
  compose(skeleton("standing-front", { x: 100 }), {
    name: "DB SHOULDER PRESS",
    poses: {
      // A: elbows tucked below shoulder level, forearms near vertical
      A: { lElbow: [80, 55], rElbow: [120, 55], lHand: [84, 38], rHand: [116, 38], lDb: [84, 33], rDb: [116, 33] },
      B: { lHand: [92, 14], rHand: [108, 14], lDb: [92, 9], rDb: [108, 9] },
    },
    chains: [
      { root: "lSh", mid: "lElbow", end: "lHand" },
      { root: "rSh", mid: "rElbow", end: "rHand" },
    ],
    parts: [
      { kind: "poly", joints: ["lSh", "lElbow", "lHand"], cls: "bd4" },
      { kind: "poly", joints: ["rSh", "rElbow", "rHand"], cls: "bd4" },
      { kind: "ring", at: "lDb", r: 5.5 },
      { kind: "ring", at: "rDb", r: 5.5 },
    ],
  }),
  {
    name: "CABLE PULL-THROUGH",
    poses: {
      // A = hinged stretch with hips back; B = standing tall — hips travel
      A: { hip: [106, 73], knee: [104, 87], ankle: [98, 99], sh: [80, 62], elbow: [90, 73], hand: [80, 84], head: [70, 58], butt: [111, 75] },
      B: { hip: [95, 70], sh: [95, 42], hand: [97, 72], head: [93, 32], butt: [100, 72] },
    },
    chains: [
      { root: "hip", mid: "knee", end: "ankle" },
      { root: "sh", mid: "elbow", end: "hand" },
    ],
    equipment: [{ kind: "rect", x: 178, y: 62, w: 10, h: 42 }],
    parts: [
      { kind: "poly", joints: ["hip", "knee", "ankle"] },
      { kind: "line", joints: ["hip", "sh"] },
      { kind: "head", at: "head" },
      { kind: "butt", at: "butt" },
      { kind: "poly", joints: ["sh", "elbow", "hand"], cls: "bd4" },
      { kind: "line", joints: [[182, 100], "hand"], cls: "acT" },
      { kind: "dot", at: "hand", r: 3.5 },
      { kind: "foot", at: "ankle", facing: -1 },
    ],
  },
  {
    name: "ONE-ARM ROW",
    poses: {
      A: { sh: [86, 58], elbow: [86, 73], hand: [86, 88], db: [86, 94] },
      B: { hand: [96, 66], db: [96, 72] },
    },
    chains: [{ root: "sh", mid: "elbow", end: "hand", side: -1 }],
    parts: [
      { kind: "rect", x: 56, y: 78, w: 88, h: 7 },
      { kind: "fline", p: [64, 85, 64, 103] },
      { kind: "fline", p: [136, 85, 136, 103] },
      { kind: "head", at: [60, 50] },
      { kind: "line", joints: [[112, 62], [72, 56]] },
      { kind: "butt", at: [116, 59] },
      { kind: "poly", joints: [[78, 58], [71, 68], [68, 77]], cls: "bd4" },
      { kind: "line", joints: [[112, 62], [128, 76]] },
      { kind: "line", joints: [[128, 76], [140, 79]] },
      { kind: "poly", joints: [[112, 62], [113, 84], [120, 99]] },
      { kind: "poly", joints: ["sh", "elbow", "hand"], cls: "bd4" },
      { kind: "ring", at: "db", r: 5.5 },
      { kind: "foot", at: [120, 99], facing: -1 },
      { kind: "foot", at: [141, 80], facing: -1, pitch: [-110, -110] },
    ],
  },
  compose(skeleton("prone-bench"), {
    name: "LYING LEG CURL",
    poses: { A: {}, B: {} },
    equipment: [
      { kind: "rect", x: 36, y: 80, w: 116, h: 7 },
      { kind: "fline", p: [44, 87, 44, 103] },
      { kind: "fline", p: [140, 87, 140, 103] },
    ],
    parts: [
      {
        kind: "group", transform: { type: "rotate", values: ["0 122 79", "-100 122 79"] },
        children: [
          { kind: "line", joints: [[122, 79], [148, 82]] },
          { kind: "dot", at: [145, 82], r: 4.5 },
          { kind: "foot", at: [148, 82], facing: -1, pitch: [90, 90] },
        ],
      },
    ],
  }),
];
