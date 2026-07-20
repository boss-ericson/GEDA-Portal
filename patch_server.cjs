const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldPostStudents = `  app.post("/api/v1/students", async (req, res) => {
    try {
      const student = req.body;
      student.createdAt = new Date().toISOString();
      if (student.schoolId === "demo-school") {
        student.id = "demo-stu-" + Date.now();
        demoStudents.push(student);
        return res.status(201).json(student);
      }
      if (!student.admissionNo || student.admissionNo === "PENDING-SYNC") {
        student.admissionNo = \`ADM-\${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}\`;
      }
      delete student.id;
      const docRef = await addDoc(collection(getDb(), "students"), student);
      res.status(201).json({ ...student, id: docRef.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });`;

const newPostStudents = `  app.post("/api/v1/students", async (req, res) => {
    try {
      const student = req.body;
      student.createdAt = new Date().toISOString();
      if (student.schoolId === "demo-school") {
        student.id = "demo-stu-" + Date.now();
        demoStudents.push(student);
        return res.status(201).json(student);
      }
      if (!student.admissionNo || student.admissionNo === "PENDING-SYNC") {
        student.admissionNo = \`ADM-\${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}\`;
      }
      delete student.id;
      const docRef = await addDoc(collection(getDb(), "students"), student);
      
      // Update school student count
      if (student.schoolId) {
        const schoolRef = doc(getDb(), "schools", student.schoolId);
        const schoolSnap = await getDoc(schoolRef);
        if (schoolSnap.exists()) {
          const currentCount = schoolSnap.data().studentCount || 0;
          await updateDoc(schoolRef, { studentCount: currentCount + 1 });
        }
      }
      
      res.status(201).json({ ...student, id: docRef.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });`;

code = code.replace(oldPostStudents, newPostStudents);
fs.writeFileSync('server.ts', code);
