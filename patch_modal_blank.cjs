const fs = require('fs');
let code = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

// 1. Fix iOS Safari flexbox height collapse & scrolling issues
code = code.replace(
  /<form onSubmit=\{handleSave\} className="flex flex-col flex-1 overflow-hidden min-h-0">\s*<div className="p-4 pb-2 shrink-0">/,
  `<form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 pb-2 shrink-0">`
);

code = code.replace(
  /<div className="flex-1 overflow-y-auto overflow-x-auto px-4 sm:px-6 pb-4 relative">/,
  `<div className="flex-1 w-full overflow-hidden relative">
                <div className="absolute inset-0 overflow-auto px-4 sm:px-6 pb-4">`
);

// We added a div, so we need to add a closing div before the footer.
code = code.replace(
  /<\/div>\s*<\/div>\s*<div className="bg-slate-50 dark:bg-slate-950 border-t/,
  `                </div>
              </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border-t`
);

// 2. Fix iOS Safari disabled input opacity and ensure inputs are visible
code = code.replace(/disabled:text-slate-400/g, 'disabled:text-slate-500 disabled:opacity-100');
code = code.replace(/text-slate-800 dark:text-slate-200/g, 'text-slate-900 dark:text-white'); // slightly stronger contrast

fs.writeFileSync('src/components/AcademicCenter.tsx', code);
