const fs = require('fs');

const code = fs.readFileSync('src/App.temp_perfect.tsx', 'utf8');

let bCount = 0;
let pCount = 0;
let stack = [];

let i = 0;
while (i < code.length) {
  if (code.slice(i, i + 2) === '//') {
    while (i < code.length && code[i] !== '\n') i++;
    continue;
  }
  if (code.slice(i, i + 2) === '/*') {
    i += 2;
    while (i < code.length && code.slice(i, i + 2) !== '*/') i++;
    i += 2;
    continue;
  }
  if (code[i] === '"' || code[i] === "'") {
    const q = code[i];
    i++;
    while (i < code.length && code[i] !== q) {
      if (code[i] === '\\') i += 2;
      else i++;
    }
  }
  if (code[i] === '`') {
    const q = code[i];
    i++;
    while (i < code.length && code[i] !== q) {
      if (code[i] === '\\') i += 2;
      else i++;
    }
  }

  const char = code[i];
  const lineNum = code.slice(0, i).split('\n').length;
  
  if (char === '{') {
    bCount++;
    stack.push({ char: '{', line: lineNum, text: code.slice(i, i + 35).replace(/\n/g, ' ') });
  } else if (char === '}') {
    bCount--;
    if (stack.length > 0 && stack[stack.length - 1].char === '{') {
      stack.pop();
    } else {
      console.log(`POPPED UNMATCHED } on line ${lineNum}: ${code.slice(i - 20, i + 20).replace(/\n/g, ' ')}`);
    }
  } else if (char === '(') {
    pCount++;
    stack.push({ char: '(', line: lineNum, text: code.slice(i, i + 35).replace(/\n/g, ' ') });
  } else if (char === ')') {
    pCount--;
    if (stack.length > 0 && stack[stack.length - 1].char === '(') {
      stack.pop();
    } else {
      console.log(`POPPED UNMATCHED ) on line ${lineNum}: ${code.slice(i - 20, i + 20).replace(/\n/g, ' ')}`);
    }
  }
  
  if (lineNum >= 2912 && lineNum <= 2932 && (char === '}' || char === ')' || char === '{' || char === '(')) {
    console.log(`Line ${lineNum} ('${char}'): stack size = ${stack.length}. Stack tail:`, stack.slice(-3).map(item => `${item.char} (${item.line})`));
  }
  i++;
}
