const fs = require('fs');
let code = fs.readFileSync('src/components/CategoryOverviewPage.tsx', 'utf8');
code = code.replace(/import \{ AdBanner \} from '\.\/AdBanner';\n/, '');
code = code.replace(/\s*\{\/\* Ad Placement \*\/\}\n\s*<AdBanner type="footer" slotId="category-hero-bottom" className="my-6" \/>\n/g, '\n');
fs.writeFileSync('src/components/CategoryOverviewPage.tsx', code);
