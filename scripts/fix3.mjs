import fs from 'fs';
let src=fs.readFileSync('src/lib/ats-engine.ts','utf8');

// Fix 1: Remove orphaned incomplete function body
// It starts right after the closing brace of the new scoreSections, as a bare block
const marker='\n {\n  const t = rawText.toLowerCase();\n  const checks = [';
const oi=src.indexOf(marker);
if(oi!==-1){
  let depth=0,i=oi+1,started=false;
  while(i<src.length){
    if(src[i]==='{'){depth++;started=true;}
    else if(src[i]==='}'){depth--;if(started&&depth===0){i++;break;}}
    i++;
  }
  while(i<src.length&&(src[i]==='\n'||src[i]==='\r'))i++;
  src=src.slice(0,oi)+src.slice(i);
  console.log('Fixed: Removed orphaned block');
} else {
  console.log('Orphan marker not found, trying line-based approach');
  const lines=src.split('\n');
  // Find the bare ' {' line followed by const checks
  for(let i=0;i<lines.length-1;i++){
    if(lines[i].trim()==='{' && lines[i+1].includes('const t = rawText') && lines[i+2].includes('const checks')){
      let j=i;
      let depth=0,started=false;
      const chars=src;
      // Find position of this line in src
      console.log('Found at line',i+1);
    }
  }
}

// Fix 2: role?.name -> role?.key
const before=src.indexOf('role?.name');
src=src.split('role?.name').join('role?.key');
console.log('Fixed role?.name->role?.key, occurrences:', before!==-1?'yes':'none');

fs.writeFileSync('src/lib/ats-engine.ts',src,'utf8');
console.log('Done, lines:',src.split('\n').length);
