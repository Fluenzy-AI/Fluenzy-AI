const src = require('fs').readFileSync('src/lib/ats-engine.ts', 'utf8');
const checks = [
  ['Weight: exp*0.20',     src.includes('expResult.score     * 0.20')],
  ['Weight: proj*0.15',    src.includes('projScore           * 0.15')],
  ['Keyword cap min(15)',  src.includes('Math.min(detectedSkills.length, 15)')],
  ['Pre-check includes',   src.includes('if (!normText.includes(a)) continue;')],
  ['Floor 35 guarantee',   src.includes('atsScore < 35) atsScore = 35')],
  ['AI>=3 rule',           src.includes('>= 3')],
  ['JD dedup Map',         src.includes('deduped = new Map')],
  ['JD prog langs header', src.includes('programming')],
];
checks.forEach(([n,ok]) => console.log(ok ? 'OK' : 'MISSING', n));
