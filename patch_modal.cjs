const fs = require('fs');
let code = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

// 1. Fix Modal Wrapper
code = code.replace(
  `        <div className="fixed inset-0 bg-slate-900/60 z-50 flex sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl sm:max-w-4xl border-0 sm:border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">`,
  `        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="absolute inset-0 sm:relative sm:inset-auto bg-white dark:bg-slate-900 w-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl sm:max-w-5xl border-0 sm:border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">`
);

// 2. Fix iOS Safari input zoom & size
code = code.replace(/className="w-full p-1 text-center text-xs/g, 'className="w-full p-2 sm:p-1 text-center text-base sm:text-xs');
code = code.replace(/<td className="p-1 border/g, '<td className="p-1 sm:p-1.5 border');

// 3. Fix minimum width of the table wrapper so things don't get squished
code = code.replace(/<div className="min-w-\[700px\] sm:min-w-\[800px\]">/, '<div className="min-w-[800px] sm:min-w-[900px]">');

fs.writeFileSync('src/components/AcademicCenter.tsx', code);
