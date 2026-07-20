const fs = require('fs');
let code = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

code = code.replace(
  /<\/tbody>\s*<\/table>\s*<\/div>\s*<div className="p-4 sm:p-6 border-t/g,
  `                    </tbody>
                  </table>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t`
);

fs.writeFileSync('src/components/AcademicCenter.tsx', code);
