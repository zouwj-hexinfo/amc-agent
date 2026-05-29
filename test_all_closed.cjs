const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Let's insert the missing closing braces right before the right drawer at lines 2915/2916!
const targetText = "                      {/* Right Slide Drawer Overlay (Self-Reflection and Sensitive words Compliance Audit) */}";
const targetIndex = code.indexOf(targetText);

if (targetIndex === -1) {
  console.error("Target text not found");
  process.exit(1);
}

const insertion = `                    </div>
                  )}
                </div>
              )}
`;

const modifiedCode = code.slice(0, targetIndex) + insertion + code.slice(targetIndex);

// Save temporarily to test compilation/braces
fs.writeFileSync('src/App.test.tsx', modifiedCode, 'utf8');

// Run the tracer on App.test.tsx
let bCount = 0;
let pCount = 0;
let stack = [];
let i = 0;

while (i < modifiedCode.length) {
  if (modifiedCode.slice(i, i + 2) === '//') {
    while (i < modifiedCode.length && modifiedCode[i] !== '\n') i++;
    continue;
  }
  if (modifiedCode.slice(i, i + 2) === '/*') {
    i += 2;
    while (i < modifiedCode.length && modifiedCode.slice(i, i + 2) !== '*/') i++;
    i += 2;
    continue;
  }
  if (modifiedCode[i] === '"' || modifiedCode[i] === "'") {
    const q = modifiedCode[i];
    i++;
    while (i < modifiedCode.length && modifiedCode[i] !== q) {
      if (modifiedCode[i] === '\\') i += 2;
      else i++;
    }
  }
  if (modifiedCode[i] === '`') {
    const q = modifiedCode[i];
    i++;
    while (i < modifiedCode.length && modifiedCode[i] !== q) {
      if (modifiedCode[i] === '\\') i += 2;
      else i++;
    }
  }

  const char = modifiedCode[i];
  if (char === '{') {
    bCount++;
    const lineNum = modifiedCode.slice(0, i).split('\n').length;
    stack.push({ char: '{', line: lineNum });
  } else if (char === '}') {
    bCount--;
    if (stack.length > 0 && stack[stack.length - 1].char === '{') {
      stack.pop();
    }
  } else if (char === '(') {
    pCount++;
    const lineNum = modifiedCode.slice(0, i).split('\n').length;
    stack.push({ char: '(', line: lineNum });
  } else if (char === ')') {
    pCount--;
    if (stack.length > 0 && stack[stack.length - 1].char === '(') {
      stack.pop();
    }
  }
  i++;
}

console.log(`With insertion, total outstanding unbalanced chars at end of file: ${stack.length}`);
if (stack.length > 0) {
  console.log("Outstanding stack components:");
  stack.forEach((item, index) => {
    console.log(`[${index}] '${item.char}' at line ${item.line}`);
  });
}
