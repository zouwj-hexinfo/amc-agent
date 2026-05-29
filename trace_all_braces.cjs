const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');

let bCount = 0;
let pCount = 0;
let stack = [];

// A robust parser that ignores comments and string literals
let i = 0;
while (i < code.length) {
  // Ignore single-line comments
  if (code.slice(i, i + 2) === '//') {
    while (i < code.length && code[i] !== '\n') i++;
    continue;
  }
  // Ignore multi-line comments
  if (code.slice(i, i + 2) === '/*') {
    i += 2;
    while (i < code.length && code.slice(i, i + 2) !== '*/') i++;
    i += 2;
    continue;
  }
  // Ignore string literals (single quote, double quote, backtick)
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
      // In backticks we could have nested expressions `${...}` which we won't fully parse in this simple tracer,
      // but let's just see if escaping works
      if (code[i] === '\\') i += 2;
      else i++;
    }
  }

  const char = code[i];
  if (char === '{') {
    bCount++;
    const lineNum = code.slice(0, i).split('\n').length;
    stack.push({ char: '{', line: lineNum, text: code.slice(i, i + 60).replace(/\n/g, ' ') });
  } else if (char === '}') {
    bCount--;
    if (stack.length > 0 && stack[stack.length - 1].char === '{') {
      stack.pop();
    } else {
      const lineNum = code.slice(0, i).split('\n').length;
      console.log(`EXTRA '}' at line ${lineNum}: ${code.slice(i - 30, i + 30).replace(/\n/g, ' ')}`);
    }
  } else if (char === '(') {
    pCount++;
    const lineNum = code.slice(0, i).split('\n').length;
    stack.push({ char: '(', line: lineNum, text: code.slice(i, i + 60).replace(/\n/g, ' ') });
  } else if (char === ')') {
    pCount--;
    if (stack.length > 0 && stack[stack.length - 1].char === '(') {
      stack.pop();
    } else {
      const lineNum = code.slice(0, i).split('\n').length;
      console.log(`EXTRA ')' at line ${lineNum}: ${code.slice(i - 30, i + 30).replace(/\n/g, ' ')}`);
    }
  }
  i++;
}

console.log(`Total outstanding unbalanced chars at end of file: ${stack.length}`);
if (stack.length > 0) {
  console.log("Outstanding stack components:");
  stack.forEach((item, index) => {
    console.log(`[${index}] '${item.char}' at line ${item.line}: ${item.text}`);
  });
}
