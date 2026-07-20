const fs = require('fs');

const file1 = 'server.ts';
let code1 = fs.readFileSync(file1, 'utf8');
code1 = code1.replace(
  `  app.post("/api/v1/attendance/batch", async (req, res) => {
    res.json({ message: "Attendance marked" });
  });`,
  `  app.get("/api/v1/attendance", async (req, res) => {
    try {
      const q = req.query;
      let conditions = [where("schoolId", "==", q.schoolId || "")];
      if (q.academicYear) conditions.push(where("academicYear", "==", q.academicYear));
      if (q.academicTerm) conditions.push(where("academicTerm", "==", q.academicTerm));
      const snapshot = await getDocs(query(collection(getDb(), "attendance"), ...conditions));
      res.json(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/v1/attendance/batch", async (req, res) => {
    try {
      const { schoolId, records } = req.body;
      if (schoolId === "demo-school") {
        return res.json({ message: "Attendance marked" });
      }
      const batch = writeBatch(getDb());
      for (const r of records) {
        if (r.id) {
          batch.update(doc(getDb(), "attendance", r.id), r);
        } else {
          const docRef = doc(collection(getDb(), "attendance"));
          batch.set(docRef, r);
        }
      }
      await batch.commit();
      res.json({ message: "Attendance marked" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });`
);
fs.writeFileSync(file1, code1);

const file2 = 'api/index.ts';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(
  `  app.post("/api/v1/attendance/batch", async (req, res) => {
    res.json({ message: "Attendance marked" });
  });`,
  `  app.get("/api/v1/attendance", async (req, res) => {
    try {
      const q = req.query;
      let conditions = [where("schoolId", "==", q.schoolId || "")];
      if (q.academicYear) conditions.push(where("academicYear", "==", q.academicYear));
      if (q.academicTerm) conditions.push(where("academicTerm", "==", q.academicTerm));
      const snapshot = await getDocs(query(collection(getDb(), "attendance"), ...conditions));
      res.json(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/v1/attendance/batch", async (req, res) => {
    try {
      const { schoolId, records } = req.body;
      if (schoolId === "demo-school") {
        return res.json({ message: "Attendance marked" });
      }
      const batch = writeBatch(getDb());
      for (const r of records) {
        if (r.id) {
          batch.update(doc(getDb(), "attendance", r.id), r);
        } else {
          const docRef = doc(collection(getDb(), "attendance"));
          batch.set(docRef, r);
        }
      }
      await batch.commit();
      res.json({ message: "Attendance marked" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });`
);
fs.writeFileSync(file2, code2);
