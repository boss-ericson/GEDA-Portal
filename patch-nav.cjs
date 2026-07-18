const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const navSnippet = `          {role === 'Admin' && (
            <button
              onClick={() => setActiveTab('billing')}
              className={\`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer \${
                activeTab === 'billing'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }\`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Billing (Blaze)</span>
            </button>
          )}

          <div className="pt-2 pb-1 px-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Financials</span>
          </div>`;

code = code.replace(
  `<div className="pt-2 pb-1 px-2">\n            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Financials</span>\n          </div>`,
  navSnippet
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
