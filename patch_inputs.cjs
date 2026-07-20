const fs = require('fs');
let code = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

// Fix iOS Safari input zoom & size for selects and textareas
code = code.replace(/className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded text-xs/g, 'className="w-full p-2 sm:p-2 border border-slate-200 dark:border-slate-700 rounded text-base sm:text-xs');
code = code.replace(/className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs/g, 'className="w-full p-2 sm:p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-base sm:text-xs');

fs.writeFileSync('src/components/AcademicCenter.tsx', code);
