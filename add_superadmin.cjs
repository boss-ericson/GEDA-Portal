const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /if \(email === "admin@gedaschool.edu.gh"\) \{/g,
  `if (email === "superadmin@ges.gov.gh") {
        return res.json({
          success: true,
          user: { email, fullName: "Super Admin", role: "SuperAdmin" },
          school: {
            id: 'superadmin-ges',
            name: 'GES Super Admin Console',
            slug: 'ges-super-admin',
            region: 'National',
            district: 'HQ',
            email: 'superadmin@ges.gov.gh',
            status: 'Active',
            accessLevel: 'Full',
            createdAt: new Date().toISOString()
          },
          role: "SuperAdmin"
        });
      }
      if (email === "admin@gedaschool.edu.gh") {`
);

fs.writeFileSync('server.ts', code);
