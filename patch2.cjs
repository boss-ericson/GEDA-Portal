const fs = require('fs');

const file1 = 'server.ts';
let code1 = fs.readFileSync(file1, 'utf8');
code1 = code1.replace(
  `  app.get("/api/v1/academic-records", async (req, res) => {
    res.json([]);
  });`,
  `  app.get("/api/v1/academic-records", async (req, res) => {
    try {
      const q = req.query;
      let conditions = [where("schoolId", "==", q.schoolId || "")];
      if (q.academicYear) conditions.push(where("academicYear", "==", q.academicYear));
      if (q.academicTerm) conditions.push(where("academicTerm", "==", q.academicTerm));
      const snapshot = await getDocs(query(collection(getDb(), "academicRecords"), ...conditions));
      res.json(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/v1/academic-records", async (req, res) => {
    try {
      const record = req.body;
      record.createdAt = new Date().toISOString();
      if (record.schoolId === "demo-school") {
        record.id = "demo-rec-" + Date.now();
        return res.status(201).json(record);
      }
      
      let existingId = record.id;
      if (!existingId) {
        // try to find existing
        const snapshot = await getDocs(query(collection(getDb(), "academicRecords"), 
          where("schoolId", "==", record.schoolId),
          where("studentId", "==", record.studentId),
          where("academicYear", "==", record.academicYear),
          where("academicTerm", "==", record.academicTerm)
        ));
        if (!snapshot.empty) {
          existingId = snapshot.docs[0].id;
        }
      }
      
      delete record.id;
      if (existingId) {
        await updateDoc(doc(getDb(), "academicRecords", existingId), record);
        res.status(200).json({ ...record, id: existingId });
      } else {
        const docRef = await addDoc(collection(getDb(), "academicRecords"), record);
        res.status(201).json({ ...record, id: docRef.id });
      }
    } catch (e) { res.status(500).json({ error: e.message }); }
  });`
);
fs.writeFileSync(file1, code1);

const file2 = 'api/index.ts';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(
  `  app.get("/api/v1/academic-records", async (req, res) => {
    res.json([]);
  });`,
  `  app.get("/api/v1/academic-records", async (req, res) => {
    try {
      const q = req.query;
      let conditions = [where("schoolId", "==", q.schoolId || "")];
      if (q.academicYear) conditions.push(where("academicYear", "==", q.academicYear));
      if (q.academicTerm) conditions.push(where("academicTerm", "==", q.academicTerm));
      const snapshot = await getDocs(query(collection(getDb(), "academicRecords"), ...conditions));
      res.json(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/v1/academic-records", async (req, res) => {
    try {
      const record = req.body;
      record.createdAt = new Date().toISOString();
      if (record.schoolId === "demo-school") {
        record.id = "demo-rec-" + Date.now();
        return res.status(201).json(record);
      }
      
      let existingId = record.id;
      if (!existingId) {
        // try to find existing
        const snapshot = await getDocs(query(collection(getDb(), "academicRecords"), 
          where("schoolId", "==", record.schoolId),
          where("studentId", "==", record.studentId),
          where("academicYear", "==", record.academicYear),
          where("academicTerm", "==", record.academicTerm)
        ));
        if (!snapshot.empty) {
          existingId = snapshot.docs[0].id;
        }
      }
      
      delete record.id;
      if (existingId) {
        await updateDoc(doc(getDb(), "academicRecords", existingId), record);
        res.status(200).json({ ...record, id: existingId });
      } else {
        const docRef = await addDoc(collection(getDb(), "academicRecords"), record);
        res.status(201).json({ ...record, id: docRef.id });
      }
    } catch (e) { res.status(500).json({ error: e.message }); }
  });`
);
fs.writeFileSync(file2, code2);
