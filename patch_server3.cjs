const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldDelete = `  app.delete("/api/v1/students/:id", async (req, res) => {
    try {
      // For demo, we don't have schoolId in query easily, but we can just filter it out
      const index = demoStudents.findIndex(s => s.id === req.params.id);
      if (index !== -1) {
        demoStudents.splice(index, 1);
        return res.json({ message: "Student deleted" });
      }
      await deleteDoc(doc(getDb(), "students", req.params.id));
      res.json({ message: "Student deleted" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });`;

const newDelete = `  app.delete("/api/v1/students/:id", async (req, res) => {
    try {
      // For demo, we don't have schoolId in query easily, but we can just filter it out
      const index = demoStudents.findIndex(s => s.id === req.params.id);
      if (index !== -1) {
        demoStudents.splice(index, 1);
        return res.json({ message: "Student deleted" });
      }
      
      const docRef = doc(getDb(), "students", req.params.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const student = docSnap.data();
        await deleteDoc(docRef);
        
        if (student.schoolId) {
          const schoolRef = doc(getDb(), "schools", student.schoolId);
          const schoolSnap = await getDoc(schoolRef);
          if (schoolSnap.exists()) {
            const currentCount = schoolSnap.data().studentCount || 0;
            await updateDoc(schoolRef, { studentCount: Math.max(0, currentCount - 1) });
          }
        }
      }
      
      res.json({ message: "Student deleted" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });`;

code = code.replace(oldDelete, newDelete);
fs.writeFileSync('server.ts', code);
