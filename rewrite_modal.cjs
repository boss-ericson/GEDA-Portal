const fs = require('fs');
let code = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

// Replace the form tag
code = code.replace(
  /<form onSubmit=\{handleSave\} className="flex flex-col flex-1 overflow-hidden">/,
  '<form onSubmit={handleSave} className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden relative">'
);

// Replace the table wrapper
code = code.replace(
  /<div className="flex-1 overflow-auto min-h-0 px-4 sm:px-6 pb-4">\s*<div className="min-w-\[800px\] sm:min-w-\[900px\]">/,
  `<div className="w-full px-4 sm:px-6 pb-4 shrink-0">
                <div className="overflow-x-auto w-full border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                  <div className="min-w-[800px] sm:min-w-[900px]">`
);

// We added an extra div layer (for the border/overflow-x), we need to close it.
// The end of the table wrapper looks like this:
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
// 
//               <div className="p-4 sm:p-6 border-t
code = code.replace(
  /<\/tbody>\s*<\/table>\s*<\/div>\s*<\/div>\s*<div className="p-4 sm:p-6 border-t/g,
  `                    </tbody>
                  </table>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t`
);

// Update the footer buttons to be sticky
code = code.replace(
  /<div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-700 p-3 sm:p-4 flex justify-end gap-2\.5 sm:gap-3 shrink-0">/,
  '<div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-700 p-3 sm:p-4 flex justify-end gap-2.5 sm:gap-3 shrink-0 sticky bottom-0 z-50">'
);

fs.writeFileSync('src/components/AcademicCenter.tsx', code);
