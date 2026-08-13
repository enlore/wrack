// Figure definitions for the wrack exercise sheet. Every figure composes over
// a standardized body from BODIES (see rig.mjs): the body supplies joints,
// segments, chains, and body parts; the figure supplies equipment, pose
// overrides (A = rep start, B = mid-rep hold), and implement parts. Weights
// (bar and dumbbell rings) center on the hand joint that holds them.
import { BODIES, compose } from "./rig.mjs";

export const FIGURES = [
  compose(BODIES.bridge(), {
    name: "HIP THRUST",
    poses: {
      A: { plate: [85, 81] },
      // top: hips finish ON the shoulder-knee line, not arched above it
      B: { hip: [85, 70], head: [34, 56], butt: [81, 73], plate: [85, 59] },
    },
    equipment: [
      { kind: "rect", x: 12, y: 64, w: 34, h: 7 },
      { kind: "fline", p: [17, 71, 17, 103] },
      { kind: "fline", p: [41, 71, 41, 103] },
    ],
    parts: [{ kind: "ring", at: "plate", r: 11 }],
  }),
  compose(BODIES.standing({ x: 100, facing: -1 }), {
    name: "ROMANIAN DEADLIFT",
    poses: {
      A: {},
      // hips back as counterweight; bar plumb under the shoulders, at the legs
      B: { hip: [114, 70], sh: [98, 60], hand: [103, 83], head: [88, 56], butt: [119, 73] },
    },
    parts: [{ kind: "ring", at: "hand", r: 8 }],
  }),
  compose(BODIES.supine(), {
    name: "DB BENCH PRESS",
    poses: {
      A: { elbow: [90, 71], hand: [89, 53] },
      B: { hand: [74, 36] },
    },
    chains: [{ root: "sh", mid: "elbow", end: "hand" }],
    equipment: [
      { kind: "rect", x: 44, y: 78, w: 100, h: 7 },
      { kind: "fline", p: [54, 85, 54, 103] },
      { kind: "fline", p: [134, 85, 134, 103] },
    ],
    parts: [
      { kind: "poly", joints: ["sh", "elbow", "hand"], cls: "bd4" },
      { kind: "ring", at: "hand", r: 6 },
    ],
  }),
  compose(BODIES.seatedBack(), {
    // back view: wide grip overhead, bar pulled to the collarbone,
    // elbows driving down and back past the ribs
    name: "LAT PULLDOWN",
    poses: {
      A: {
        lElbow: [83, 36], rElbow: [117, 36],
        lHand: [78, 20], rHand: [122, 20],
        barL: [74, 20], barR: [126, 20], barC: [100, 20],
      },
      B: {
        lHand: [80, 52], rHand: [120, 52],
        barL: [74, 52], barR: [126, 52], barC: [100, 52],
      },
    },
    chains: [
      { root: "lSh", mid: "lElbow", end: "lHand" },
      { root: "rSh", mid: "rElbow", end: "rHand" },
    ],
    equipment: [
      { kind: "fline", p: [100, 4, 100, 10] },
      { kind: "line", joints: [[100, 8], "barC"], cls: "eqT" },
      { kind: "rect", x: 78, y: 84, w: 12, h: 5 },
      { kind: "rect", x: 110, y: 84, w: 12, h: 5 },
    ],
    // the bar renders inside the body's slot: over the seat, behind the torso
    slot: [{ kind: "line", joints: ["barL", "barR"], cls: "ac" }],
    parts: [
      { kind: "poly", joints: ["lSh", "lElbow", "lHand"], cls: "bd4" },
      { kind: "poly", joints: ["rSh", "rElbow", "rHand"], cls: "bd4" },
    ],
  }),
  compose(BODIES.seatedFront(), {
    name: "SEATED HIP ABDUCTION",
    poses: { A: {}, B: {} },
    equipment: [
      { kind: "rect", x: 86, y: 88, w: 28, h: 6 },
      { kind: "fline", p: [100, 94, 100, 103] },
    ],
    parts: [
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
  }),
  compose(BODIES.standing3q(), {
    // three-quarter view, stack at the lifter's side (anti-rotation): both
    // arms anchor at their shoulders and clasp the handle; the press runs
    // along the foreshortened depth diagonal, far arm extending fully first
    name: "PALLOF PRESS",
    poses: {
      A: { lElbow: [80, 57], rElbow: [110, 60], hand: [95, 58], tdHand: [30, 34] },
      B: { hand: [80, 62], tdHand: [30, 48] },
    },
    chains: [
      { root: "lSh", mid: "lElbow", end: "hand" },
      { root: "rSh", mid: "rElbow", end: "hand" },
    ],
    equipment: [{ kind: "rect", x: 182, y: 52, w: 10, h: 52 }],
    parts: [
      { kind: "line", joints: [[184, 58], "hand"], cls: "acT" },
      { kind: "poly", joints: ["lSh", "lElbow", "hand"], cls: "bd4" },
      { kind: "poly", joints: ["rSh", "rElbow", "hand"], cls: "bd4" },
      { kind: "dot", at: "hand", r: 3.5 },
      // top-down inset: cable from the side, press straight out front
      { kind: "rect", x: 10, y: 8, w: 58, h: 46, cls: "frame" },
      { kind: "label", x: 15, y: 17, text: "TOP" },
      { kind: "rect", x: 58, y: 20, w: 6, h: 12 },
      { kind: "line", joints: [[58, 26], "tdHand"], cls: "acT" },
      { kind: "line", joints: [[18, 26], [42, 26]], cls: "bd4" },
      { kind: "line", joints: [[20, 26], "tdHand"], cls: "bd4" },
      { kind: "line", joints: [[40, 26], "tdHand"], cls: "bd4" },
      { kind: "head", at: [30, 26], r: 4.5 },
      { kind: "dot", at: "tdHand", r: 2.5 },
    ],
  }),
  compose(BODIES.standing({ x: 106, facing: 1, footPitch: [-12, 25], legSide: -1 }), {
    name: "STANDING CALF RAISE",
    poses: {
      // A = the bottom stretch: heels dipped below the platform edge
      A: { hip: [106, 60], knee: [105, 76], ankle: [103, 93], sh: [108, 32], elbow: [113, 47], hand: [111, 60], head: [111, 23], butt: [101, 61] },
      B: { hip: [106, 49], ankle: [101, 82], sh: [108, 21], hand: [111, 49], head: [111, 12], butt: [101, 50] },
    },
    equipment: [{ kind: "rect", x: 106, y: 90, w: 56, h: 15 }],
    parts: [{ kind: "ring", at: "hand", r: 5.5 }],
  }),
  compose(BODIES.splitStance(), {
    name: "BULGARIAN SPLIT SQUAT",
    poses: {
      A: {},
      B: { hip: [97, 82], sh: [90, 54], hand: [93, 80], head: [89, 46], butt: [102, 84] },
    },
    equipment: [
      { kind: "rect", x: 140, y: 72, w: 44, h: 7 },
      { kind: "fline", p: [146, 79, 146, 103] },
      { kind: "fline", p: [176, 79, 176, 103] },
    ],
    parts: [{ kind: "ring", at: "hand", r: 5.5 }],
  }),
  compose(BODIES.recline(), {
    name: "LEG PRESS",
    poses: {
      // A near 90° knee, B stops just short of lockout
      A: { platA: [99, 61], platB: [114, 82] },
      B: { ankle: [120, 57], platA: [117, 43], platB: [132, 64] },
    },
    equipment: [{ kind: "fline", p: [44, 62, 78, 96] }],
    parts: [{ kind: "line", joints: ["platA", "platB"], cls: "ac5" }],
  }),
  compose(BODIES.standingFront(), {
    name: "DB SHOULDER PRESS",
    poses: {
      // A: elbows tucked below shoulder level, bells at ear height
      A: { lElbow: [76, 48], rElbow: [124, 48], lHand: [84, 34], rHand: [116, 34] },
      B: { lHand: [92, 12], rHand: [108, 12] },
    },
    chains: [
      { root: "lSh", mid: "lElbow", end: "lHand" },
      { root: "rSh", mid: "rElbow", end: "rHand" },
    ],
    parts: [
      { kind: "poly", joints: ["lSh", "lElbow", "lHand"], cls: "bd4" },
      { kind: "poly", joints: ["rSh", "rElbow", "rHand"], cls: "bd4" },
      { kind: "ring", at: "lHand", r: 5.5 },
      { kind: "ring", at: "rHand", r: 5.5 },
    ],
  }),
  compose(BODIES.standing({ x: 100, facing: -1 }), {
    name: "CABLE PULL-THROUGH",
    poses: {
      // A = hinged stretch with hips back; B = standing tall — hips travel
      A: { hip: [106, 73], knee: [104, 87], ankle: [98, 99], sh: [80, 62], elbow: [90, 73], hand: [80, 84], head: [70, 58], butt: [111, 75] },
      B: { hip: [95, 70], sh: [95, 42], hand: [97, 72], head: [93, 32], butt: [100, 72] },
    },
    equipment: [{ kind: "rect", x: 178, y: 62, w: 10, h: 42 }],
    parts: [
      { kind: "line", joints: [[182, 100], "hand"], cls: "acT" },
      { kind: "dot", at: "hand", r: 3.5 },
    ],
  }),
  compose(BODIES.kneelingBench(), {
    name: "ONE-ARM ROW",
    poses: {
      A: {},
      B: { hand: [96, 66] },
    },
    equipment: [
      { kind: "rect", x: 56, y: 78, w: 88, h: 7 },
      { kind: "fline", p: [64, 85, 64, 103] },
      { kind: "fline", p: [136, 85, 136, 103] },
    ],
    parts: [{ kind: "ring", at: "hand", r: 5.5 }],
  }),
  compose(BODIES.prone(), {
    name: "LYING LEG CURL",
    // padC tracks the roller pad's position through the group's -100 rotation
    poses: { A: { padC: [116, 81] }, B: { padC: [104, 67] } },
    equipment: [
      { kind: "rect", x: 36, y: 80, w: 74, h: 7 },
      { kind: "fline", p: [44, 87, 44, 103] },
      { kind: "fline", p: [102, 87, 102, 103] },
      // selectorized machine: weight stack and frame off the bench end
      { kind: "fline", p: [110, 86, 164, 86] },
      { kind: "rect", x: 164, y: 78, w: 12, h: 26 },
    ],
    parts: [
      { kind: "line", joints: [[170, 78], "padC"], cls: "acT" },
      {
        kind: "group", transform: { type: "rotate", values: ["0 104 79", "-100 104 79"] },
        children: [
          { kind: "fline", p: [104, 82, 117, 84] },
          { kind: "line", joints: [[104, 79], [119, 81]] },
          { kind: "dot", at: [116, 81], r: 4.5 },
          { kind: "foot", at: [119, 81], facing: -1, pitch: [90, 90] },
        ],
      },
    ],
  }),
];
