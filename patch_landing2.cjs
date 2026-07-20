const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');
code = code.replace("setIsGoogleAuthLoading(false);", "setIsLoggingIn(false);");
fs.writeFileSync('src/components/LandingPage.tsx', code);
