const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// replace the password hash calculation
code = code.replace(
  /\/\/ Admin password hash for '2026'\nconst ADMIN_PASSWORD_HASH = hashPassword\('2026'\);/g,
  "// Admin password hash for the configured password\nconst ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD ? hashPassword(process.env.ADMIN_PASSWORD) : '764db7d1b0fd9d8686646266120c04bbbe5c1df9107b39c16754e538b3cce756';"
);

// replace the Hint in the endpoint
code = code.replace(
  /return res\.status\(401\)\.json\(\{ success: false, message: 'Incorrect administrator password\. \(Hint: 2026\)' \}\);/g,
  "return res.status(401).json({ success: false, message: 'Incorrect administrator password.' });"
);

fs.writeFileSync('server.ts', code);
