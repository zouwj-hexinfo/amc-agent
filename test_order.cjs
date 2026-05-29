const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const targetText = "                      {/* Right Slide Drawer Overlay (Self-Reflection and Sensitive words Compliance Audit) */}";
const targetIndex = code.indexOf(targetText);

// Let's test the LIFO order in a simulated file and build/compile using vite or esbuild or tsc directly!
const lifoInsertion = `                    </div>
                  )}
                </div>
              )}
`;

const modifiedLIFO = code.slice(0, targetIndex) + lifoInsertion + code.slice(targetIndex + targetText.length);

fs.writeFileSync('src/App.test_lifo.tsx', modifiedLIFO, 'utf8');

// Let's run a tsc single-file compilation check using shell_exec
const { execSync } = require('child_process');
try {
  console.log("Compiling LIFO configuration...");
  execSync('npx tsc --noEmit src/App.test_lifo.tsx', { stdio: 'pipe' });
  console.log("LIFO compiles successfully!");
} catch (err) {
  console.log("LIFO failed to compile with error:");
  console.log(err.stdout.toString('utf8').split('\n').filter(l => l.includes('App.test_lifo.tsx')).slice(0, 5).join('\n'));
}

// Let's test the original order
const origInsertion = `                      </div>
                    </div>
                  )}
                </div>
              )}
`;
const modifiedOrig = code.slice(0, targetIndex) + origInsertion + code.slice(targetIndex + targetText.length);
fs.writeFileSync('src/App.test_orig.tsx', modifiedOrig, 'utf8');
try {
  console.log("Compiling Original configuration...");
  execSync('npx tsc --noEmit src/App.test_orig.tsx', { stdio: 'pipe' });
  console.log("Original compiles successfully!");
} catch (err) {
  console.log("Original failed to compile with error:");
  console.log(err.stdout.toString('utf8').split('\n').filter(l => l.includes('App.test_orig.tsx')).slice(0, 5).join('\n'));
}
