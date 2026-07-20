const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(
  "import { getAuth, GoogleAuthProvider } from 'firebase/auth';",
  "import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from 'firebase/auth';"
);

code = code.replace(
  /authInstance = getAuth\(app\);/g,
  `authInstance = getAuth(app);\n    setPersistence(authInstance, browserSessionPersistence).catch((e) => console.error("Firebase persistence error:", e));`
);

fs.writeFileSync('src/lib/firebase.ts', code);
