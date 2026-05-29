const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

let braceCount = 0;
let parenCount = 0;

for (let i = 1408; i < 2945; i++) {
  const line = lines[i];
  let cleaned = line.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '');
  for (let char of cleaned) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
  }
  if (i >= 2910 && i < 2945) {
    console.log(`Line ${i + 1}: bCount=${braceCount}, pCount=${parenCount} | ${line.trim().slice(0, 50)}`);
  }
}
