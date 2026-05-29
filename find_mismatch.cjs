const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

console.log("Analyzing App.tsx structure around line 1400...");

let braceCount = 0;
let parenCount = 0;

for (let i = 1408; i < lines.length; i++) {
  const line = lines[i];
  
  // Clean comments and string literals briefly to avoid counting false positives
  let cleaned = line.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '');
  
  // Count braces and parents
  for (let char of cleaned) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
  }
  
  // Let's print whenever counts are neat or at key tab boundaries
  if (line.includes('TAB 3') || line.includes('TAB 4') || line.includes('TAB 5') || i < 1420 || (i >= 3105 && i < 3125)) {
    console.log(`Line ${i + 1}: bCount=${braceCount}, pCount=${parenCount} | ${line.trim().slice(0, 50)}`);
  }
}
