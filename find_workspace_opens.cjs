const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

let stack = [];

for (let i = 1408; i < 2917; i++) {
  const line = lines[i];
  let cleaned = line.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '');
  
  // A very simple search for matching braces and parentheses
  for (let col = 0; col < cleaned.length; col++) {
    const char = cleaned[col];
    if (char === '{') {
      stack.push({ char: '{', line: i + 1, text: line.trim() });
    } else if (char === '}') {
      if (stack.length > 0 && stack[stack.length - 1].char === '{') {
        stack.pop();
      } else {
        console.log(`Unmatched } on line ${i + 1}`);
      }
    } else if (char === '(') {
      stack.push({ char: '(', line: i + 1, text: line.trim() });
    } else if (char === ')') {
      if (stack.length > 0 && stack[stack.length - 1].char === '(') {
        stack.pop();
      } else {
        console.log(`Unmatched ) on line ${i + 1}`);
      }
    }
  }
}

console.log(`At line 2917, there are ${stack.length} unclosed items:`);
stack.forEach(item => {
  console.log(`  - '${item.char}' from line ${item.line}: ${item.text.slice(0, 80)}`);
});
