const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const fallbackBlock = `          try {
            const snapshot = await getDocs(query(collection(db, "schools"), where("email", "==", loginEmail.trim())));
            if (!snapshot.empty) {
              const schoolDoc = snapshot.docs[0];
              responseData = {
                success: true,
                school: { ...schoolDoc.data(), id: schoolDoc.id },
                user: { email: loginEmail.trim(), fullName: "Admin User", role: selectedRole },
                role: selectedRole
              };
              isSuccess = true;
            } else {
               setLoginError('Invalid official school email or password.');
               return;
            }
          } catch (fbErr: any) {`;

const newFallbackBlock = `          try {
            if (loginEmail.trim() === "superadmin@ges.gov.gh") {
              responseData = {
                success: true,
                user: { email: loginEmail.trim(), fullName: "Super Admin", role: "SuperAdmin" },
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
              };
              isSuccess = true;
            } else {
              const snapshot = await getDocs(query(collection(db, "schools"), where("email", "==", loginEmail.trim())));
              if (!snapshot.empty) {
                const schoolDoc = snapshot.docs[0];
                responseData = {
                  success: true,
                  school: { ...schoolDoc.data(), id: schoolDoc.id },
                  user: { email: loginEmail.trim(), fullName: "Admin User", role: selectedRole },
                  role: selectedRole
                };
                isSuccess = true;
              } else {
                 setLoginError('Invalid official school email or password.');
                 return;
              }
            }
          } catch (fbErr: any) {`;

code = code.replace(fallbackBlock, newFallbackBlock);
fs.writeFileSync('src/components/LandingPage.tsx', code);
