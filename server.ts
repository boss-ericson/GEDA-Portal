
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, query, where, updateDoc, writeBatch, deleteDoc, getDoc } from "firebase/firestore";
import fs from "fs";

// Initialize Firebase
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper for checking dev environment api key
  const validateApiKey = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In a real app we'd query db for the API key to find the schoolId
      // For now, we'll extract it assuming it's passed or default to dev
      req.schoolId = "dev-school";
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- SCHOOLS ---
  app.get("/api/v1/schools", async (req, res) => {
    try {
      const snapshot = await getDocs(collection(db, "schools"));
      res.json(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/v1/schools", async (req, res) => {
    try {
      const { name, region, district, email, password } = req.body;
      const school = {
        name, region, district, email,
        status: "Active", accessLevel: "Trial",
        userId: "admin-id", // mock
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "schools"), school);
      res.status(201).json({ ...school, id: docRef.id });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/v1/schools/:id", async (req, res) => {
    try {
      if (req.params.id === "demo-school") {
        return res.json({
          id: 'demo-school',
          name: 'GEDA Demo School Complex',
          slug: 'geda-demo-school',
          region: 'Greater Accra',
          district: 'Accra Metropolitan',
          email: 'admin@gedaschool.edu.gh',
          status: 'Active',
          accessLevel: 'Full',
          createdAt: new Date().toISOString()
        });
      }
      const docRef = doc(db, "schools", req.params.id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        res.json({ ...snapshot.data(), id: snapshot.id });
      } else {
        res.status(404).json({ error: "School not found" });
      }
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/v1/schools/:id", async (req, res) => {
    try {
      await updateDoc(doc(db, "schools", req.params.id), req.body);
      res.json({ message: "School updated" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // --- AUTH ---
  app.post("/api/v1/auth/login", async (req, res) => {
    try {
      const { email, password, role } = req.body;
      const snapshot = await getDocs(query(collection(db, "schools"), where("email", "==", email)));
      if (snapshot.empty) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const schoolDoc = snapshot.docs[0];
      res.json({
        user: { email, fullName: "Admin User", role },
        school: { ...schoolDoc.data(), id: schoolDoc.id }
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // --- STUDENTS ---
  app.get("/api/v1/students", async (req, res) => {
    try {
      const snapshot = await getDocs(query(collection(db, "students"), where("schoolId", "==", req.query.schoolId || "")));
      res.json(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/v1/students/:id", async (req, res) => {
    try {
      await updateDoc(doc(db, "students", req.params.id), req.body);
      res.json({ message: "Student updated" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/v1/students/:id", async (req, res) => {
    try {
      await deleteDoc(doc(db, "students", req.params.id));
      res.json({ message: "Student deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/v1/students", async (req, res) => {
    try {
      const student = req.body;
      student.createdAt = new Date().toISOString();
      const docRef = await addDoc(collection(db, "students"), student);
      res.status(201).json({ ...student, id: docRef.id });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/v1/students/bulk", async (req, res) => {
    try {
      const { students } = req.body;
      const batch = writeBatch(db);
      const results = [];
      for (const s of students) {
        const docRef = doc(collection(db, "students"));
        s.createdAt = new Date().toISOString();
        batch.set(docRef, s);
        results.push({ ...s, id: docRef.id });
      }
      await batch.commit();
      res.status(201).json(results);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/v1/students/promote", async (req, res) => {
    try {
      const { studentIds, targetClass } = req.body;
      const batch = writeBatch(db);
      for (const id of studentIds) {
        batch.update(doc(db, "students", id), { classLevel: targetClass });
      }
      await batch.commit();
      res.json({ message: "Promoted successfully" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/v1/sis/students", validateApiKey, async (req, res) => {
    try {
      const snapshot = await getDocs(collection(db, "students"));
      res.json({ data: snapshot.docs.map(d => ({ ...d.data(), id: d.id })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // --- PAYMENTS ---
  app.get("/api/v1/payments", async (req, res) => {
    try {
      const snapshot = await getDocs(query(collection(db, "payments"), where("schoolId", "==", req.query.schoolId || "")));
      res.json(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/v1/payments", async (req, res) => {
    try {
      const payment = req.body;
      payment.timestamp = new Date().toISOString();
      const docRef = await addDoc(collection(db, "payments"), payment);
      res.status(201).json({ ...payment, id: docRef.id });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // --- BACKUPS ---
  app.get("/api/v1/backups", async (req, res) => {
    try {
      const snapshot = await getDocs(query(collection(db, "backupLogs"), where("schoolId", "==", req.query.schoolId || "")));
      res.json(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  
  app.post("/api/v1/backups", async (req, res) => {
    try {
      const { schoolId, type } = req.body;
      const log = {
        schoolId, type: type || "Manual", timestamp: new Date().toISOString(),
        recordsCount: 0, fileName: `backup_${schoolId}_${Date.now()}.json`, status: "Completed"
      };
      const docRef = await addDoc(collection(db, "backupLogs"), log);
      res.status(201).json({ log: { ...log, id: docRef.id } });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // --- API KEYS ---
  app.get("/api/v1/api-keys", async (req, res) => {
    try {
      const snapshot = await getDocs(query(collection(db, "apiKeys"), where("schoolId", "==", req.query.schoolId || "")));
      res.json(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  
  app.post("/api/v1/api-keys", async (req, res) => {
    try {
      const { schoolId, name } = req.body;
      const key = {
        schoolId, name, status: "Active",
        token: `geda_tok_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "apiKeys"), key);
      res.status(201).json({ ...key, id: docRef.id });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  
  app.post("/api/v1/api-keys/revoke", async (req, res) => {
    try {
      const { keyId } = req.body;
      await updateDoc(doc(db, "apiKeys", keyId), { status: "Revoked" });
      res.json({ message: "Revoked" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // --- OTHERS ---
  app.post("/api/v1/attendance/batch", async (req, res) => {
    res.json({ message: "Attendance marked" });
  });

  app.post("/api/v1/sync", async (req, res) => {
    res.json({ message: "Sync complete" });
  });
  
  app.get("/api/v1/teachers", async (req, res) => {
    res.json([]);
  });

  app.get("/api/v1/news", async (req, res) => {
    res.json([
      {
        id: '1', title: 'GES Announces New Curriculum Framework',
        content: 'The Ghana Education Service has released a comprehensive update to the basic school curriculum.',
        date: new Date().toISOString(), source: 'GES Official', url: '#'
      }
    ]);
  });
  
  app.get("/api/v1/academic-records", async (req, res) => {
    res.json([]);
  });

  // --- SUPERADMIN ---
  app.get("/api/v1/superadmin/schools", async (req, res) => {
    try {
      const snapshot = await getDocs(collection(db, "schools"));
      const schools = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      res.json(schools);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/v1/superadmin/schools/:id/status", async (req, res) => {
    try {
      await updateDoc(doc(db, "schools", req.params.id), { status: req.body.status });
      res.json({ message: "Status updated" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/v1/superadmin/schools/:id/verify-payment", async (req, res) => {
    try {
      await updateDoc(doc(db, "schools", req.params.id), { accessLevel: "Full", paidStudentCount: req.body.paidStudentCount, billingNotice: "" });
      res.json({ message: "Payment verified" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  
  app.put("/api/v1/superadmin/schools/:id/billing-notice", async (req, res) => {
    try {
      await updateDoc(doc(db, "schools", req.params.id), { billingNotice: req.body.billingNotice });
      res.json({ message: "Notice sent" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  
  app.put("/api/v1/superadmin/schools/:id/access", async (req, res) => {
    try {
      await updateDoc(doc(db, "schools", req.params.id), { accessLevel: req.body.accessLevel });
      res.json({ message: "Access updated" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
