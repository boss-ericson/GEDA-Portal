const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCode = `  app.get("/api/v1/superadmin/schools", async (req, res) => {
    try {
      const snapshot = await getDocs(collection(getDb(), "schools"));
      const schools = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      res.json(schools);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });`;

const newCode = `  app.get("/api/v1/superadmin/schools", async (req, res) => {
    try {
      const snapshot = await getDocs(collection(getDb(), "schools"));
      const schools = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      
      const studentsSnapshot = await getDocs(collection(getDb(), "students"));
      const students = studentsSnapshot.docs.map(doc => doc.data());
      
      const schoolsWithCounts = schools.map(school => {
        const schoolStudents = students.filter(s => s.schoolId === school.id);
        return {
          ...school,
          studentCount: schoolStudents.length
        };
      });
      
      res.json(schoolsWithCounts);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('server.ts', code);
