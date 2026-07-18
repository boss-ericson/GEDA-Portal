const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const billingSnippet = `          {activeTab === 'billing' && (
            <BillingComponent school={school} students={students} />
          )}

          {activeTab === 'settings' && (`;

code = code.replace(`          {activeTab === 'settings' && (`, billingSnippet);
fs.writeFileSync('src/components/Dashboard.tsx', code);
