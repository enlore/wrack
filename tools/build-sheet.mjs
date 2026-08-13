// Regenerates assets/animations.svg from tools/figures.mjs.
// Run: mise run sheet   (or: node tools/build-sheet.mjs)
import { renderSheet } from "./rig.mjs";
import { FIGURES } from "./figures.mjs";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let warnings = 0;
const svg = renderSheet(FIGURES, m => { warnings++; console.error("warn: " + m); }, { cols: 1 });
const out = join(root, "assets/animations.svg");
writeFileSync(out, svg);
console.log(`wrote ${out} (${svg.length} bytes), ${warnings} warning(s)`);
process.exitCode = 0;
