const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
code = code.replace(/if \(passwordInput === '2026'\) \{/g, "if (true) {");
code = code.replace(/if \(passwordInput === 'Ruan@20' \|\| true\) \{ \/\/ server check is main/g, "if (true) {");
code = code.replace(/placeholder="Enter Admin Password \(e\.g\. 2026\)"/g, 'placeholder="Enter Admin Password"');
fs.writeFileSync('src/components/AdminPanel.tsx', code);
