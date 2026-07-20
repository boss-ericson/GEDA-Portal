const fs = require('fs');
let code = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

// Replace type="number" with type="text" inputMode="numeric" pattern="[0-9]*"
code = code.replace(/type="number" min="0" max="15"/g, 'type="text" inputMode="numeric" pattern="[0-9]*"');
code = code.replace(/type="number" min="0" max="100"/g, 'type="text" inputMode="numeric" pattern="[0-9]*"');

fs.writeFileSync('src/components/AcademicCenter.tsx', code);
