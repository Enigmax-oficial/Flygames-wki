const fs = require('fs');
let code = fs.readFileSync('src/components/PortalHomePage.tsx', 'utf8');
code = code.replace(/import \{ AdBanner \} from '\.\/AdBanner';\n/, '');
code = code.replace(/\s*\{\/\* High-Impact Top Ad Placement \*\/\}\n\s*<AdBanner type="inline" slotId="portal-hero-leaderboard" className="my-4" \/>\n/g, '\n');
code = code.replace(/\s*\{\/\* Ad Placement \*\/\}\n\s*<AdBanner type="footer" slotId="portal-mid-leaderboard" className="my-8" \/>\n/g, '\n');
fs.writeFileSync('src/components/PortalHomePage.tsx', code);
