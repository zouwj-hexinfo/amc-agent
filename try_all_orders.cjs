const fs = require('fs');
const { execSync } = require('child_process');

const code = fs.readFileSync('src/App.tsx', 'utf8');

// We find the entire section from 2915 to 2920 (where our old tags reside)
const lines = code.split('\n');

// Let's locate lines 2915 to 2920 of the current App.tsx:
// 2915:                       </div>
// 2916:                     )}
// 2917:                   </div>
// 2918:                 )}
const startText = "                      </div>\n                    )}\n                  </div>\n                )}";

const index = code.indexOf(startText);
if (index === -1) {
  console.error("Could not find startText!");
  process.exit(1);
}

const candidateText = `                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}`;

const fileContent = code.slice(0, index) + candidateText + code.slice(index + startText.length);

fs.writeFileSync('src/App.temp_perfect.tsx', fileContent, 'utf8');

try {
  console.log("Compiling the perfect replacement layout...");
  execSync('npx tsc --noEmit src/App.temp_perfect.tsx', { stdio: 'pipe' });
  console.log("PERFECT REPLACEMENT COMPILED SUCCESSFULLY WITH ZERO ERRORS!");
} catch (err) {
  const errOutput = err.stdout.toString('utf8');
  console.log("Compilation failed with errors:");
  console.log(errOutput.split('\n').filter(l => l.includes('App.temp_perfect.tsx')).slice(0, 10).join('\n'));
}
