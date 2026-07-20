const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/localStorage\.getItem\('geda_auth'\)/g, "sessionStorage.getItem('geda_auth')");
code = code.replace(/localStorage\.setItem\('geda_auth'/g, "sessionStorage.setItem('geda_auth'");
code = code.replace(/localStorage\.removeItem\('geda_auth'\)/g, "sessionStorage.removeItem('geda_auth')");

fs.writeFileSync('src/App.tsx', code);
