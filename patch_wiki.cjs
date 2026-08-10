const fs = require('fs');
let code = fs.readFileSync('src/components/WikiArticle.tsx', 'utf8');
code = code.replace(/import \{ AdBanner \} from '\.\/AdBanner';\n/, '');
code = code.replace(/\s*\{\/\* Ad Placement \*\/\}\n\s*<AdBanner type="inline" slotId="boss-article-mid" className="my-6" \/>\n/g, '\n');
code = code.replace(/\s*\{\/\* Ad Placement \*\/\}\n\s*<AdBanner type="inline" slotId="standard-article-bottom" className="my-6" \/>\n/g, '\n');
code = code.replace(/\s*<AdBanner type="sidebar" slotId="standard-article-sidebar" className="sticky top-20" \/>\n/g, '');
fs.writeFileSync('src/components/WikiArticle.tsx', code);
