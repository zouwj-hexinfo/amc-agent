const fs = require('fs');
const { execSync } = require('child_process');

try {
  execSync('npx tsc --noEmit src/App.temp_0.tsx', { stdio: 'pipe' });
} catch (err) {
  const errOutput = err.stdout.toString('utf8');
  const matchedLines = errOutput.split('\n').filter(l => l.includes('App.temp_0.tsx'));
  
  matchedLines.slice(0, 3).forEach(errLine => {
    console.log("------------------------");
    console.log("Error:", errLine);
    
    const match = errLine.match(/temp_0\.tsx\((\d+),/);
    if (match) {
      const lineNum = parseInt(match[1]);
      const code = fs.readFileSync('src/App.temp_0.tsx', 'utf8');
      const lines = code.split('\n');
      console.log("Context:");
      for (let l = Math.max(1, lineNum - 5); l <= Math.min(lines.length, lineNum + 5); l++) {
        console.log(`${l === lineNum ? '=>' : '  '} Line ${l}: ${lines[l - 1]}`);
      }
    }
  });
}
