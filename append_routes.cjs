const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

const routes = `
  // --- STUDENTS PROMOTE API ---
  app.post("/api/v1/students/promote", async (req, res) => {
    try {
      const { studentIds, targetClass } = req.body;
      if (!Array.isArray(studentIds) || !targetClass) return res.status(400).json({ error: "Missing fields" });
      
      const batch = writeBatch(db);
      for (const id of studentIds) {
        batch.update(doc(db, "students", id), { classLevel: targetClass });
      }
      await batch.commit();
      res.json({ message: "Promoted successfully" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // --- NEWS API ---
  app.get("/api/v1/news", async (req, res) => {
    try {
      const snapshot = await getDocs(collection(db, "news"));
      if (snapshot.empty) {
        // Return some dummy news if empty
        return res.json([
          {
            id: '1',
            title: 'GES Announces New Curriculum Framework',
            content: 'The Ghana Education Service has released a comprehensive update to the basic school curriculum.',
            date: new Date().toISOString(),
            source: 'GES Official',
            url: '#'
          },
          {
            id: '2',
            title: 'National Best Teacher Awards 2026 Nominations Open',
            content: 'Nominations for the 2026 National Best Teacher Awards are now officially open to all public and private school teachers.',
            date: new Date().toISOString(),
            source: 'Ministry of Education',
            url: '#'
          }
        ]);
      }
      res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // --- SUPERADMIN API ---
  app.get("/api/v1/superadmin/schools", async (req, res) => {
    try {
      const snapshot = await getDocs(collection(db, "schools"));
      res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/v1/superadmin/schools/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const docRef = doc(db, "schools", req.params.id);
      await updateDoc(docRef, { status });
      res.json({ message: "Status updated", status });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
`;

// Insert right before if (process.env.NODE_ENV !== "production") {
const insertPoint = content.indexOf('if (process.env.NODE_ENV !== "production") {');
content = content.slice(0, insertPoint) + routes + content.slice(insertPoint);

fs.writeFileSync('server.ts', content);
console.log('Routes appended successfully.');
