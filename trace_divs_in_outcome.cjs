const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

let divStack = [];

for (let i = 2518; i < 2915; i++) {
  const line = lines[i];
  
  // Clean comments and ignore inline braces
  let cleaned = line.replace(/\{[^}]+\}/g, '').replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '');
  
  // Find all <div or </div>
  let pos = 0;
  while (true) {
    const openIndex = cleaned.toLowerCase().indexOf('<div', pos);
    const closeIndex = cleaned.toLowerCase().indexOf('</div', pos);
    
    if (openIndex === -1 && closeIndex === -1) break;
    
    if (openIndex !== -1 && (closeIndex === -1 || openIndex < closeIndex)) {
      divStack.push({ type: 'open', line: i + 1, text: line.trim() });
      pos = openIndex + 4;
    } else {
      if (divStack.length > 0 && divStack[divStack.length - 1].type === 'open') {
        divStack.pop();
      } else {
        console.log(`Extra </div> at line ${i + 1}: ${line.trim()}`);
      }
      pos = closeIndex + 5;
    }
  }
}

console.log(`At line 2915, remaining open divs in outcome subtab: ${divStack.length}`);
divStack.forEach(item => {
  console.log(`  - open div on line ${item.line}: ${item.text.slice(0, 80)}`);
});
