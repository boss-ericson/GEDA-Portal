const fs = require('fs');
let code = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

code = code.replace(
  `let num = val === '' ? undefined : Number(val);
    
    // Validation capping
    if (num !== undefined) {`,
  `let num = val === '' ? undefined : Number(val);
    if (num !== undefined && isNaN(num)) return; // reject non-numeric input
    
    // Validation capping
    if (num !== undefined) {`
);

fs.writeFileSync('src/components/AcademicCenter.tsx', code);
