const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');
code = code.replace("setGoogleAuthLoading(false);", "setIsGoogleAuthLoading(false);");
fs.writeFileSync('src/components/LandingPage.tsx', code);
