const fs = require("fs");
let src = fs.readFileSync("src/lib/ats-engine.ts", "utf8");
const bs = String.fromCharCode(92);
const lines = src.split("\n");

// Fix line 31 (0-indexed 30): BT[sS] -> BT[\s\S]
lines[30] = lines[30].replace("raw.match(/BT[sS]*?ET/g)", "raw.match(/BT[" + bs + "s" + bs + "S]*?ET/g)");

// Fix broken regex split at lines 34-35 (0-indexed 33-34)
if (lines[33] && lines[33].indexOf(".replace(/[^") !== -1 && lines[34] && lines[34].indexOf("]/g") === 0) {
  lines[33] = "        .replace(/[^" + bs + "x20-" + bs + "x7E" + bs + "n]/g, \" \")";
  lines.splice(34, 1);
  console.log("Fixed broken regex split");
}

// Fix /s{2,} -> /\s{2,}
for (var i = 30; i < 42; i++) {
  if (lines[i] && lines[i].indexOf(".replace(/s{2,}/g") !== -1) {
    lines[i] = lines[i].replace(".replace(/s{2,}/g", ".replace(/" + bs + "s{2,}/g");
    console.log("Fixed whitespace regex at line " + (i + 1));
  }
}

var out = lines.join("\n");
fs.writeFileSync("src/lib/ats-engine.ts", out, "utf8");
console.log("Done. Lines: " + out.split("\n").length);
