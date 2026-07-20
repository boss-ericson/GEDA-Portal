const fs = require('fs');
let code = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

code = code.replace(
  /<div className="flex-1 w-full overflow-hidden relative">\s*<div className="absolute inset-0 overflow-auto px-4 sm:px-6 pb-4">/g,
  '<div className="flex-1 overflow-auto min-h-0 px-4 sm:px-6 pb-4">'
);
code = code.replace(
  /<\/div>\s*<\/div>\s*<div className="p-4 sm:p-6 border-t/g,
  '</div>\n\n              <div className="p-4 sm:p-6 border-t'
);
fs.writeFileSync('src/components/AcademicCenter.tsx', code);
