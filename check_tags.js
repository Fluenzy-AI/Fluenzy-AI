const fs = require('fs');
const c = fs.readFileSync('c:/Users/hp/OneDrive/Desktop/fluenzyai/Fluenzy-AI/src/app/interview-guide/page.tsx', 'utf8');
const count = (p) => (c.match(p) || []).length;
console.log(`div ${count(/<div\b/g)} ${count(/<\/div>/g)}`);
console.log(`Card ${count(/<Card\b/g)} ${count(/<\/Card>/g)}`);
console.log(`Select ${count(/<Select\b/g)} ${count(/<\/Select>/g)}`);
console.log(`CardContent ${count(/<CardContent\b/g)} ${count(/<\/CardContent>/g)}`);
console.log(`SelectContent ${count(/<SelectContent\b/g)} ${count(/<\/SelectContent>/g)}`);
