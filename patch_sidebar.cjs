const fs = require('fs');
let code = fs.readFileSync('src/components/DesktopSidebar.tsx', 'utf8');
code = code.replace(/import \{ AdBanner \} from '\.\/AdBanner';\n/, '');
code = code.replace(/\s*\{\/\* Ad Placement \*\/\}\n\s*<AdBanner type="sidebar" slotId="sidebar-ad" className="mx-3 mb-3 shrink-0" \/>\n/g, '\n');
fs.writeFileSync('src/components/DesktopSidebar.tsx', code);
