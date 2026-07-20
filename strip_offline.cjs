const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(/  const \[isOffline, setIsOffline\] = useState<boolean>\(\(\) => \{\n    return localStorage\.getItem\('geda_offline_mode'\) === 'true';\n  \}\);\n/, '  const isOffline = false;\n');
code = code.replace(/    localStorage\.setItem\('geda_offline_mode', String\(!isOffline\)\);\n/g, '');

fs.writeFileSync('src/components/Dashboard.tsx', code);
