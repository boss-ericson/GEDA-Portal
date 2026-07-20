const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldBulk = `  app.post("/api/v1/students/bulk", async (req, res) => {
    try {
      const { students } = req.body;
      if (students.length > 0 && students[0].schoolId === "demo-school") {
        const results = [];
        for (const s of students) {
          s.createdAt = new Date().toISOString();
          s.id = "demo-stu-" + Date.now() + Math.random();
          demoStudents.push(s);
          results.push(s);
        }
        return res.status(201).json(results);
      }
      const batch = writeBatch(getDb());
      const results = [];
      for (const s of students) {
        const docRef = doc(collection(getDb(), "students"));
        s.createdAt = new Date().toISOString();
        delete s.id;
        batch.set(docRef, s);
        results.push({ ...s, id: docRef.id });
      }
      await batch.commit();
      res.status(201).json(results);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });`;

const newBulk = `  app.post("/api/v1/students/bulk", async (req, res) => {
    try {
      const { students } = req.body;
      if (students.length > 0 && students[0].schoolId === "demo-school") {
        const results = [];
        for (const s of students) {
          s.createdAt = new Date().toISOString();
          s.id = "demo-stu-" + Date.now() + Math.random();
          demoStudents.push(s);
          results.push(s);
        }
        return res.status(201).json(results);
      }
      const batch = writeBatch(getDb());
      const results = [];
      for (const s of students) {
        const docRef = doc(collection(getDb(), "students"));
        s.createdAt = new Date().toISOString();
        delete s.id;
        batch.set(docRef, s);
        results.push({ ...s, id: docRef.id });
      }
      await batch.commit();
      
      // Update school count
      if (students.length > 0 && students[0].schoolId) {
        const schoolRef = doc(getDb(), "schools", students[0].schoolId);
        const schoolSnap = await getDoc(schoolRef);
        if (schoolSnap.exists()) {
          const currentCount = schoolSnap.data().studentCount || 0;
          await updateDoc(schoolRef, { studentCount: currentCount + students.length });
        }
      }
      
      res.status(201).json(results);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });`;

code = code.replace(oldBulk, newBulk);
fs.writeFileSync('server.ts', code);
