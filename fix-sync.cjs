const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/      let syncedCount = 0;\n[\s\S]*?      \}\n/, "      let syncedCount = 0;\n");
fs.writeFileSync('server.ts', code);
