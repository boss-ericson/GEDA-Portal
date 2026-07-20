const fs = require('fs');
let code = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

code = code.replace(
  /                            <\/div>\n              <\/div>\n              <\/div>\n\n              <div className="bg-slate-50/g,
  `                            </div>
              </div>

              <div className="bg-slate-50`
);

fs.writeFileSync('src/components/AcademicCenter.tsx', code);
